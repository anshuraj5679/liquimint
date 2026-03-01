const { ethers } = require("hardhat");
const { loadDeployment, requireAddress } = require("./deployment-utils");

async function waitTx(tx) {
  const receipt = await tx.wait();
  return {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
  };
}

async function main() {
  const deployment = loadDeployment();
  const results = {
    network: "amoy",
    chainId: 80002,
    checks: {},
    txHashes: {},
    notes: [],
  };

  requireAddress("bondingCurveFactory", deployment.bondingCurveFactory);
  requireAddress("liquidityController", deployment.liquidityController);

  const [owner] = await ethers.getSigners();
  const provider = owner.provider;

  const ownerBalance = await provider.getBalance(owner.address);
  results.checks.owner = {
    address: owner.address,
    balanceMatic: ethers.formatEther(ownerBalance),
  };

  const factoryCode = await provider.getCode(deployment.bondingCurveFactory);
  const liqCode = await provider.getCode(deployment.liquidityController);
  results.checks.contractCode = {
    bondingCurveFactory: factoryCode !== "0x",
    liquidityController: liqCode !== "0x",
  };

  const factory = await ethers.getContractAt("BondingCurveFactoryV3", deployment.bondingCurveFactory);
  const liquidity = await ethers.getContractAt("LiquidityController", deployment.liquidityController);

  const creationFee = await factory.creationFee();
  const createTx = await factory.createToken(
    "AmoyCore",
    "AMY",
    0,
    ethers.parseEther("0.001"),
    2,
    '{"source":"post-deploy-checks"}',
    { value: creationFee }
  );
  const createRc = await createTx.wait();
  const createEvent = createRc.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "TokenCreated");

  const tokenAddress = createEvent?.args?.tokenAddress;
  if (!tokenAddress) {
    throw new Error("TokenCreated event missing during post-deploy checks");
  }
  results.txHashes.createToken = createTx.hash;
  results.checks.createToken = {
    tokenAddress,
  };

  const token = await ethers.getContractAt("BondingCurveToken", tokenAddress);

  const buyTx = await token.buy({ value: ethers.parseEther("0.02") });
  results.txHashes.buy = buyTx.hash;
  await buyTx.wait();
  const ownerTokenBalance = await token.balanceOf(owner.address);
  results.checks.buy = {
    ownerTokenBalance: ownerTokenBalance.toString(),
    success: ownerTokenBalance > 0n,
  };

  const burnerWallet = ethers.Wallet.createRandom().connect(provider);
  const fundWalletTx = await owner.sendTransaction({
    to: burnerWallet.address,
    value: ethers.parseEther("0.01"),
  });
  results.txHashes.fundSellerWallet = fundWalletTx.hash;
  await fundWalletTx.wait();

  const transferAmount = ownerTokenBalance / 2n;
  const transferTx = await token.transfer(burnerWallet.address, transferAmount);
  results.txHashes.transferToSeller = transferTx.hash;
  await transferTx.wait();

  const tokenFromSeller = token.connect(burnerWallet);
  const sellTx = await tokenFromSeller.sell(transferAmount / 2n);
  results.txHashes.sell = sellTx.hash;
  await sellTx.wait();
  results.checks.sell = {
    soldAmount: (transferAmount / 2n).toString(),
    success: true,
  };

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const lp = await MockERC20.deploy("PostDeployLP", "PDLP", ethers.parseEther("1000000"));
  await lp.waitForDeployment();
  results.txHashes.lpTokenDeploy = lp.deploymentTransaction()?.hash || null;

  const lpAmount = ethers.parseEther("100");
  const approveTx = await lp.approve(await liquidity.getAddress(), lpAmount);
  results.txHashes.lpApprove = approveTx.hash;
  await approveTx.wait();

  const lockTx = await liquidity.lockLiquidity(
    tokenAddress,
    await lp.getAddress(),
    lpAmount,
    30 * 24 * 60 * 60,
    100
  );
  const lockRc = await lockTx.wait();
  results.txHashes.lockLiquidity = lockTx.hash;
  const lockEvent = lockRc.logs
    .map((log) => {
      try {
        return liquidity.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "LiquidityLocked");

  const lockId = lockEvent?.args?.lockId;
  if (lockId === undefined) {
    throw new Error("LiquidityLocked event missing in post-deploy checks");
  }
  results.checks.lockLiquidity = {
    lockId: lockId.toString(),
    success: true,
  };

  const emergencyUnlockTx = await liquidity.emergencyUnlock(lockId);
  results.txHashes.emergencyUnlock = emergencyUnlockTx.hash;
  await emergencyUnlockTx.wait();
  const lockInfo = await liquidity.locks(lockId);
  results.checks.unlockLiquidity = {
    lockId: lockId.toString(),
    isUnlocked: lockInfo.isUnlocked,
  };

  if (ownerBalance >= ethers.parseEther("110")) {
    const fundTokenTx = await owner.sendTransaction({
      to: tokenAddress,
      value: ethers.parseEther("101"),
    });
    results.txHashes.fundForGraduation = fundTokenTx.hash;
    await fundTokenTx.wait();

    const gradTx = await factory.manualGraduate(tokenAddress);
    results.txHashes.graduate = gradTx.hash;
    await gradTx.wait();

    const info = await factory.getTokenInfo(tokenAddress);
    results.checks.graduate = {
      attempted: true,
      graduated: info.graduated,
      lpPair: info.lpPair,
      lpLockId: info.lpLockId.toString(),
    };
  } else {
    results.checks.graduate = {
      attempted: false,
      reason: "Insufficient owner balance for 100+ MATIC graduation threshold",
      requiredMatic: "101",
      ownerBalanceMatic: ethers.formatEther(ownerBalance),
    };
    results.notes.push("Graduation live-call skipped due balance threshold.");
  }

  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = main;
