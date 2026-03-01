const deploySecurity = require("./deploy-security");
const deployBonding = require("./deploy-bonding");
const syncFrontend = require("./sync-frontend");
const { loadDeployment, saveDeployment, requireAddress } = require("./deployment-utils");

async function main() {
  const current = loadDeployment();
  let liquidityController = process.env.LIQUIDITY_CONTROLLER || current.liquidityController;

  if (!liquidityController) {
    const deployedSecurity = await deploySecurity();
    liquidityController = deployedSecurity.address;
  } else {
    requireAddress("LIQUIDITY_CONTROLLER", liquidityController);
    saveDeployment({
      network: "amoy",
      chainId: 80002,
      liquidityController,
    });
  }

  process.env.LIQUIDITY_CONTROLLER = liquidityController;

  const bonding = await deployBonding();
  const deployment = loadDeployment();
  syncFrontend();

  console.log(
    JSON.stringify(
      {
        network: "amoy",
        chainId: 80002,
        addresses: {
          bondingCurveFactory: bonding.address,
          liquidityController,
          dexRouter: deployment.dexRouter || process.env.DEX_ROUTER || null,
        },
        txHashes: deployment.tx || {},
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = main;
