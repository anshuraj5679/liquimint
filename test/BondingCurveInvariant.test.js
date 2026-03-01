const { expect } = require("chai");
const { ethers } = require("hardhat");

const ONE_DAY = 24 * 60 * 60;

async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

function seededRandom(seed) {
  let state = BigInt(seed);
  return () => {
    state = (state * 1664525n + 1013904223n) % 4294967296n;
    return Number(state) / 4294967296;
  };
}

describe("BondingCurve Economic Invariants", function () {
  let owner;
  let creator;
  let traders;
  let bondingFactory;
  let liquidityController;
  let token;
  let tokenAddress;

  beforeEach(async function () {
    [owner, creator, ...traders] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockWeth = await MockERC20.deploy("Mock WETH", "WETH", ethers.parseEther("1000000"));
    await mockWeth.waitForDeployment();

    const MockDEXFactory = await ethers.getContractFactory("MockDEXFactory");
    const mockFactory = await MockDEXFactory.deploy();
    await mockFactory.waitForDeployment();

    const MockDEXRouter = await ethers.getContractFactory("MockDEXRouter");
    const mockRouter = await MockDEXRouter.deploy(await mockFactory.getAddress(), await mockWeth.getAddress());
    await mockRouter.waitForDeployment();

    const LiquidityController = await ethers.getContractFactory("LiquidityController");
    liquidityController = await LiquidityController.deploy(owner.address);
    await liquidityController.waitForDeployment();

    const BondingCurveFactoryV3 = await ethers.getContractFactory("BondingCurveFactoryV3");
    bondingFactory = await BondingCurveFactoryV3.deploy(
      owner.address,
      await mockRouter.getAddress(),
      await liquidityController.getAddress()
    );
    await bondingFactory.waitForDeployment();

    const creationFee = await bondingFactory.creationFee();
    await bondingFactory.connect(creator).createToken(
      "InvariantToken",
      "INV",
      0,
      ethers.parseEther("0.001"),
      2,
      '{"suite":"invariant"}',
      { value: creationFee }
    );

    tokenAddress = await bondingFactory.allTokens(0);
    token = await ethers.getContractAt("BondingCurveToken", tokenAddress);
  });

  it("maintains sane state across randomized buy/sell sequence", async function () {
    const rand = seededRandom(42);
    const activeTraders = traders.slice(0, 4);

    for (let step = 0; step < 40; step++) {
      await increaseTime(31);
      const actor = activeTraders[step % activeTraders.length];

      if (step % 3 !== 2) {
        const buyMatic = 0.05 + rand() * 1.45; // [0.05, 1.50]
        await token.connect(actor).buy({ value: ethers.parseEther(buyMatic.toFixed(6)) });
      } else {
        const bal = await token.balanceOf(actor.address);
        if (bal > 0n) {
          const sellAmount = bal / 3n;
          if (sellAmount > 0n) {
            await token.connect(actor).sell(sellAmount);
          }
        }
      }

      const supply = await token.totalSupply();
      const price = await token.getCurrentPrice();
      expect(supply).to.be.gte(0n);
      expect(price).to.be.gt(0n);

      const contractBalance = await ethers.provider.getBalance(tokenAddress);
      for (const t of activeTraders) {
        const tBal = await token.balanceOf(t.address);
        if (tBal > 0n) {
          const quote = await token.calculateSellReturn(tBal / 2n);
          expect(quote).to.be.lte(contractBalance);
        }
      }
    }

    const finalSupply = await token.totalSupply();
    const holders = await Promise.all(traders.slice(0, 4).map((t) => token.balanceOf(t.address)));
    const holderSum = holders.reduce((sum, bal) => sum + bal, 0n);
    expect(holderSum).to.equal(finalSupply);
  });

  it("maintains graduation invariants and rejects double graduation", async function () {
    await owner.sendTransaction({
      to: tokenAddress,
      value: ethers.parseEther("120"),
    });

    await bondingFactory.manualGraduate(tokenAddress);

    const info = await bondingFactory.getTokenInfo(tokenAddress);
    expect(info.graduated).to.equal(true);
    expect(info.lpPair).to.not.equal(ethers.ZeroAddress);
    expect(info.lpLockId).to.be.gte(0n);

    const lock = await liquidityController.locks(info.lpLockId);
    expect(lock.isUnlocked).to.equal(false);
    expect(lock.amount).to.be.gt(0n);
    expect(lock.unlockTime).to.be.gt(lock.lockedAt + BigInt(360 * ONE_DAY));

    await expect(bondingFactory.manualGraduate(tokenAddress)).to.be.revertedWith("Already graduated");
  });
});
