const { ethers } = require("hardhat");
const { saveDeployment, loadDeployment, requireAddress } = require("./deployment-utils");

async function deployGovernance() {
  const [deployer] = await ethers.getSigners();
  const proposer = process.env.GOVERNANCE_PROPOSER;
  const executor = process.env.GOVERNANCE_EXECUTOR;
  const minDelay = Number(process.env.TIMELOCK_MIN_DELAY || 86400);

  requireAddress("GOVERNANCE_PROPOSER", proposer);
  requireAddress("GOVERNANCE_EXECUTOR", executor);
  if (!Number.isFinite(minDelay) || minDelay < 0) {
    throw new Error("TIMELOCK_MIN_DELAY must be a non-negative number of seconds");
  }

  const TimelockController = await ethers.getContractFactory(
    "@openzeppelin/contracts/governance/TimelockController.sol:TimelockController"
  );

  const timelock = await TimelockController.deploy(
    minDelay,
    [proposer],
    [executor],
    proposer
  );
  await timelock.waitForDeployment();

  const timelockAddress = await timelock.getAddress();
  const txHash = timelock.deploymentTransaction()?.hash || null;
  const current = loadDeployment();

  saveDeployment({
    network: "amoy",
    chainId: 80002,
    governanceTimelock: timelockAddress,
    tx: {
      ...(current.tx || {}),
      governanceTimelock: txHash,
    },
  });

  console.log(
    JSON.stringify(
      {
        contract: "TimelockController",
        address: timelockAddress,
        txHash,
        deployer: deployer.address,
        minDelay,
        proposer,
        executor,
      },
      null,
      2
    )
  );

  return {
    address: timelockAddress,
    txHash,
    minDelay,
    proposer,
    executor,
  };
}

async function main() {
  await deployGovernance();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = deployGovernance;
