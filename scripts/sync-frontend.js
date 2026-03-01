const fs = require("fs");
const path = require("path");
const { loadDeployment } = require("./deployment-utils");

function replaceAddress(content, key, address) {
  const pattern = new RegExp(`(${key}:\\s*)'0x[a-fA-F0-9]{40}'`);
  return content.replace(pattern, `$1'${address}'`);
}

function updateContractsConfig(deployment) {
  const configPath = path.join(__dirname, "..", "src", "config", "contracts-v2.ts");
  let content = fs.readFileSync(configPath, "utf8");

  if (deployment.bondingCurveFactory) {
    content = replaceAddress(content, "bondingCurveFactory", deployment.bondingCurveFactory);
  }
  if (deployment.liquidityController) {
    content = replaceAddress(content, "liquidityControllerV3", deployment.liquidityController);
    content = replaceAddress(content, "liquidityController", deployment.liquidityController);
  }
  if (deployment.dexRouter) {
    content = replaceAddress(content, "dexRouter", deployment.dexRouter);
  }

  fs.writeFileSync(configPath, content);
}

function copyAbi(artifactRelativePath, outputRelativePath) {
  const artifactPath = path.join(__dirname, "..", artifactRelativePath);
  const outputPath = path.join(__dirname, "..", outputRelativePath);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact missing: ${artifactRelativePath}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2));
}

function syncFrontend() {
  const deployment = loadDeployment();
  if (!deployment.bondingCurveFactory || !deployment.liquidityController) {
    throw new Error("Deployment file missing bondingCurveFactory or liquidityController");
  }

  updateContractsConfig(deployment);
  copyAbi(
    "artifacts/contracts/bonding/BondingCurveFactoryV3.sol/BondingCurveFactoryV3.json",
    "src/config/abis/BondingCurveFactoryV3.json"
  );
  copyAbi(
    "artifacts/contracts/bonding/BondingCurveToken.sol/BondingCurveToken.json",
    "src/config/abis/BondingCurveToken.json"
  );
  copyAbi(
    "artifacts/contracts/security/LiquidityController.sol/LiquidityController.json",
    "src/config/abis/LiquidityController.json"
  );

  console.log(
    JSON.stringify(
      {
        synced: true,
        addresses: {
          bondingCurveFactory: deployment.bondingCurveFactory,
          liquidityController: deployment.liquidityController,
          dexRouter: deployment.dexRouter || null,
        },
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    syncFrontend();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

module.exports = syncFrontend;
