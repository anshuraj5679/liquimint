const { expect } = require("chai");
const { ethers } = require("hardhat");

const ONE_DAY = 24 * 60 * 60;
const THIRTY_DAYS = 30 * ONE_DAY;
const NINETY_DAYS = 90 * ONE_DAY;

async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("LiquidityController Edge Cases", function () {
  let owner;
  let creator;
  let attacker;
  let liquidityController;
  let projectToken;
  let lpToken;

  async function createLock({ duration = THIRTY_DAYS, amount = ethers.parseEther("100"), signer = creator, targetLp = lpToken } = {}) {
    await targetLp.connect(signer).approve(await liquidityController.getAddress(), amount);
    const lockId = await liquidityController.connect(signer).lockLiquidity.staticCall(
      await projectToken.getAddress(),
      await targetLp.getAddress(),
      amount,
      duration,
      100
    );
    await liquidityController.connect(signer).lockLiquidity(
      await projectToken.getAddress(),
      await targetLp.getAddress(),
      amount,
      duration,
      100
    );
    return { lockId, amount };
  }

  beforeEach(async function () {
    [owner, creator, attacker] = await ethers.getSigners();

    const LiquidityController = await ethers.getContractFactory("LiquidityController");
    liquidityController = await LiquidityController.deploy(owner.address);
    await liquidityController.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    projectToken = await MockERC20.deploy("Project", "PRJ", ethers.parseEther("1000000"));
    await projectToken.waitForDeployment();

    lpToken = await MockERC20.deploy("Mock LP", "MLP", ethers.parseEther("1000000"));
    await lpToken.waitForDeployment();
    await lpToken.mint(creator.address, ethers.parseEther("1000"));
  });

  it("applies emergency unlock penalty correctly", async function () {
    const { lockId, amount } = await createLock({ duration: NINETY_DAYS });
    const before = await lpToken.balanceOf(creator.address);

    await liquidityController.connect(creator).emergencyUnlock(lockId);

    const lock = await liquidityController.locks(lockId);
    expect(lock.isUnlocked).to.equal(true);

    const afterBalance = await lpToken.balanceOf(creator.address);
    const returnedAmount = afterBalance - before;
    const expected = amount - ((amount * 20n) / 100n);
    expect(returnedAmount).to.equal(expected);
  });

  it("reverts rewards claim when reward pool is insufficient", async function () {
    const { lockId } = await createLock({ duration: 365 * ONE_DAY });
    await expect(liquidityController.connect(creator).claimRewards(lockId)).to.be.revertedWith("Insufficient reward pool");
  });

  it("claims rewards successfully when reward pool is funded", async function () {
    const { lockId } = await createLock({ duration: NINETY_DAYS, amount: ethers.parseEther("10") });
    const lock = await liquidityController.locks(lockId);
    const rewards = lock.bonusRewards;
    expect(rewards).to.be.gt(0n);

    await liquidityController.connect(owner).fundRewardPool({ value: rewards });
    await liquidityController.connect(creator).claimRewards(lockId);

    const updatedLock = await liquidityController.locks(lockId);
    expect(updatedLock.bonusRewards).to.equal(0n);
    expect(await liquidityController.getUserRewards(creator.address)).to.equal(rewards);
  });

  it("enforces extend lock boundaries", async function () {
    const { lockId } = await createLock({ duration: THIRTY_DAYS });
    const maxDuration = await liquidityController.MAX_LOCK_DURATION();

    await expect(
      liquidityController.connect(creator).extendLock(lockId, maxDuration)
    ).to.be.revertedWith("Exceeds max duration");

    await liquidityController.connect(creator).extendLock(lockId, ONE_DAY);
    const lock = await liquidityController.locks(lockId);
    expect(lock.unlockTime).to.be.gt(0n);
  });

  it("blocks unauthorized unlock and emergency unlock", async function () {
    const { lockId } = await createLock({ duration: NINETY_DAYS });

    await expect(liquidityController.connect(attacker).unlockLiquidity(lockId)).to.be.revertedWith("Not lock owner");
    await expect(liquidityController.connect(attacker).emergencyUnlock(lockId)).to.be.revertedWith("Not lock owner");
    await expect(liquidityController.connect(attacker).extendLock(lockId, ONE_DAY)).to.be.revertedWith("Not lock owner");
  });

  it("prevents emergency unlock after expiry", async function () {
    const { lockId } = await createLock({ duration: THIRTY_DAYS });
    await increaseTime(THIRTY_DAYS + 1);
    await expect(liquidityController.connect(creator).emergencyUnlock(lockId)).to.be.revertedWith("Lock already expired");
  });

  it("prevents double unlock", async function () {
    const { lockId } = await createLock({ duration: THIRTY_DAYS });
    await increaseTime(THIRTY_DAYS + 1);
    await liquidityController.connect(creator).unlockLiquidity(lockId);
    await expect(liquidityController.connect(creator).unlockLiquidity(lockId)).to.be.revertedWith("Already unlocked");
  });

  it("caps total locked percentage at 100", async function () {
    await lpToken.mint(owner.address, ethers.parseEther("100"));
    await createLock({ duration: NINETY_DAYS, amount: ethers.parseEther("10"), signer: creator });
    await createLock({ duration: NINETY_DAYS, amount: ethers.parseEther("10"), signer: owner });

    const pct = await liquidityController.getTotalLockedPercentage(await projectToken.getAddress());
    expect(pct).to.equal(100n);
  });

  it("reverts lock creation when LP transferFrom returns false", async function () {
    const MockFailingERC20 = await ethers.getContractFactory("MockFailingERC20");
    const failingLp = await MockFailingERC20.deploy("Fail LP", "FLP", ethers.parseEther("1000000"));
    await failingLp.waitForDeployment();
    await failingLp.mint(creator.address, ethers.parseEther("1000"));
    await failingLp.connect(creator).setFailTransferFrom(true);
    await failingLp.connect(creator).approve(await liquidityController.getAddress(), ethers.parseEther("10"));

    await expect(
      liquidityController.connect(creator).lockLiquidity(
        await projectToken.getAddress(),
        await failingLp.getAddress(),
        ethers.parseEther("10"),
        THIRTY_DAYS,
        100
      )
    ).to.be.reverted;
  });

  it("reverts unlock when LP transfer returns false", async function () {
    const MockFailingERC20 = await ethers.getContractFactory("MockFailingERC20");
    const failingLp = await MockFailingERC20.deploy("Fail LP", "FLP", ethers.parseEther("1000000"));
    await failingLp.waitForDeployment();
    await failingLp.mint(creator.address, ethers.parseEther("1000"));

    const { lockId } = await createLock({
      duration: THIRTY_DAYS,
      amount: ethers.parseEther("10"),
      targetLp: failingLp,
    });

    await failingLp.connect(creator).setFailTransfer(true);
    await increaseTime(THIRTY_DAYS + 1);

    await expect(liquidityController.connect(creator).unlockLiquidity(lockId)).to.be.reverted;
  });
});
