const { ethers } = require("hardhat");
const { loadDeployment, saveDeployment, requireAddress } = require("./deployment-utils");

async function deployBonding() {
  const [deployer] = await ethers.getSigners();
  const current = loadDeployment();
  const governanceOwner = process.env.GOVERNANCE_OWNER;

  const dexRouter = process.env.DEX_ROUTER || current.dexRouter;
  const liquidityController = process.env.LIQUIDITY_CONTROLLER || current.liquidityController;

  requireAddress("GOVERNANCE_OWNER", governanceOwner);
  requireAddress("DEX_ROUTER", dexRouter);
  requireAddress("LIQUIDITY_CONTROLLER", liquidityController);

  const BondingCurveFactoryV3 = await ethers.getContractFactory("BondingCurveFactoryV3");
  const bondingFactory = await BondingCurveFactoryV3.deploy(
    governanceOwner,
    dexRouter,
    liquidityController
  );
  await bondingFactory.waitForDeployment();

  const address = await bondingFactory.getAddress();
  const txHash = bondingFactory.deploymentTransaction()?.hash || null;

  const record = saveDeployment({
    network: "amoy",
    chainId: 80002,
    dexRouter,
    liquidityController,
    bondingCurveFactory: address,
    tx: {
      ...(current.tx || {}),
      bondingCurveFactory: txHash,
    },
  });

  console.log(
    JSON.stringify(
      {
        contract: "BondingCurveFactoryV3",
        address,
        txHash,
        deployer: deployer.address,
        owner: governanceOwner,
        dexRouter,
        liquidityController,
        deploymentFile: "deployment-amoy.json",
      },
      null,
      2
    )
  );

  return {
    address,
    txHash,
    dexRouter,
    liquidityController,
    record,
  };
}

async function main() {
  await deployBonding();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = deployBonding;
