const { ethers } = require("hardhat");
const { loadDeployment, saveDeployment, requireAddress } = require("./deployment-utils");

async function deploySecurity() {
  const [deployer] = await ethers.getSigners();
  const governanceOwner = process.env.GOVERNANCE_OWNER;
  requireAddress("GOVERNANCE_OWNER", governanceOwner);

  const LiquidityController = await ethers.getContractFactory("LiquidityController");
  const liquidityController = await LiquidityController.deploy(governanceOwner);
  await liquidityController.waitForDeployment();

  const address = await liquidityController.getAddress();
  const txHash = liquidityController.deploymentTransaction()?.hash || null;
  const current = loadDeployment();

  const record = saveDeployment({
    network: "amoy",
    chainId: 80002,
    liquidityController: address,
    tx: {
      ...(current.tx || {}),
      liquidityController: txHash,
    },
  });

  console.log(
    JSON.stringify(
      {
        contract: "LiquidityController",
        address,
        txHash,
        deployer: deployer.address,
        owner: governanceOwner,
        deploymentFile: "deployment-amoy.json",
      },
      null,
      2
    )
  );

  return {
    address,
    txHash,
    record,
  };
}

async function main() {
  await deploySecurity();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = deploySecurity;
