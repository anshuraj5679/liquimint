const { expect } = require("chai");
const { ethers } = require("hardhat");

const ONE_DAY = 24 * 60 * 60;
const THIRTY_DAYS = 30 * ONE_DAY;

async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("BondingCurve Core Flows", function () {
  let owner;
  let creator;
  let trader;
  let bondingFactory;
  let liquidityController;
  let mockWeth;

  async function createToken() {
    const creationFee = await bondingFactory.creationFee();
    const tx = await bondingFactory.connect(creator).createToken(
      "CoreToken",
      "CORE",
      0, // LINEAR
      ethers.parseEther("0.001"),
      2, // 2% royalty
      '{"description":"core test token"}',
      { value: creationFee }
    );
    await tx.wait();

    const tokenAddress = await bondingFactory.allTokens(0);
    const token = await ethers.getContractAt("BondingCurveToken", tokenAddress);
    return { tokenAddress, token };
  }

  beforeEach(async function () {
    [owner, creator, trader] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockWeth = await MockERC20.deploy("Mock WETH", "WETH", ethers.parseEther("1000000"));
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
  });

  it("create, buy, and sell should work end-to-end", async function () {
    const { tokenAddress, token } = await createToken();
    expect(tokenAddress).to.match(/^0x[a-fA-F0-9]{40}$/);

    const buyTx = await token.connect(trader).buy({ value: ethers.parseEther("1") });
    const buyRc = await buyTx.wait();
    const buyTradeLog = buyRc.logs
      .map((log) => {
        try {
          return bondingFactory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "TokenTraded");
    expect(buyTradeLog.args.trader).to.equal(trader.address);

    const traderBalance = await token.balanceOf(trader.address);
    expect(traderBalance).to.be.gt(0n);
    expect(await token.totalBuys()).to.equal(1n);

    await increaseTime(31);
    const sellTx = await token.connect(trader).sell(traderBalance / 2n);
    const sellRc = await sellTx.wait();
    const sellTradeLog = sellRc.logs
      .map((log) => {
        try {
          return bondingFactory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "TokenTraded");
    expect(sellTradeLog.args.trader).to.equal(trader.address);
    expect(await token.totalSells()).to.equal(1n);

    const tokenInfo = await bondingFactory.getTokenInfo(tokenAddress);
    expect(tokenInfo.totalBuys).to.equal(1n);
    expect(tokenInfo.totalSells).to.equal(1n);
  });

  it("graduate should add LP and create an LP lock", async function () {
    const { tokenAddress } = await createToken();

    // Fund token contract directly to cross graduation threshold.
    await owner.sendTransaction({
      to: tokenAddress,
      value: ethers.parseEther("120"),
    });

    await bondingFactory.manualGraduate(tokenAddress);

    const tokenInfo = await bondingFactory.getTokenInfo(tokenAddress);
    expect(tokenInfo.graduated).to.equal(true);
    expect(tokenInfo.lpPair).to.not.equal(ethers.ZeroAddress);

    const lock = await liquidityController.locks(tokenInfo.lpLockId);
    expect(lock.owner).to.equal(creator.address);
    expect(lock.lpToken).to.equal(tokenInfo.lpPair);
    expect(lock.isUnlocked).to.equal(false);
    expect(lock.amount).to.be.gt(0n);
  });

  it("manual LP lock and unlock should work for creator", async function () {
    const { tokenAddress } = await createToken();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const lpToken = await MockERC20.deploy("Manual LP", "MLP", ethers.parseEther("1000000"));
    await lpToken.waitForDeployment();

    const amount = ethers.parseEther("100");
    await lpToken.mint(creator.address, amount);
    await lpToken.connect(creator).approve(await liquidityController.getAddress(), amount);

    const lockId = await liquidityController.connect(creator).lockLiquidity.staticCall(
      tokenAddress,
      await lpToken.getAddress(),
      amount,
      THIRTY_DAYS,
      100
    );

    await liquidityController.connect(creator).lockLiquidity(
      tokenAddress,
      await lpToken.getAddress(),
      amount,
      THIRTY_DAYS,
      100
    );

    await expect(liquidityController.connect(creator).unlockLiquidity(lockId)).to.be.revertedWith(
      "Lock period not ended"
    );

    await increaseTime(THIRTY_DAYS + 1);
    await liquidityController.connect(creator).unlockLiquidity(lockId);

    const lock = await liquidityController.locks(lockId);
    expect(lock.isUnlocked).to.equal(true);
  });

  it("enforces graduation slippage configuration bounds", async function () {
    await expect(
      bondingFactory.connect(trader).setGraduationSlippageBps(100)
    ).to.be.reverted;

    await expect(
      bondingFactory.connect(owner).setGraduationSlippageBps(2500)
    ).to.be.revertedWith("Slippage too high");

    await bondingFactory.connect(owner).setGraduationSlippageBps(300);
    expect(await bondingFactory.graduationSlippageBps()).to.equal(300n);
  });
});
