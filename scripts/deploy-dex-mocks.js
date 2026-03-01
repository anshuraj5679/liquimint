const { ethers } = require("hardhat");
const { loadDeployment, saveDeployment } = require("./deployment-utils");

async function main() {
  const [deployer] = await ethers.getSigners();
  const current = loadDeployment();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const weth = await MockERC20.deploy("Mock WETH", "WETH", ethers.parseEther("1000000"));
  await weth.waitForDeployment();

  const MockDEXFactory = await ethers.getContractFactory("MockDEXFactory");
  const dexFactory = await MockDEXFactory.deploy();
  await dexFactory.waitForDeployment();

  const MockDEXRouter = await ethers.getContractFactory("MockDEXRouter");
  const dexRouter = await MockDEXRouter.deploy(await dexFactory.getAddress(), await weth.getAddress());
  await dexRouter.waitForDeployment();

  const record = saveDeployment({
    network: "amoy",
    chainId: 80002,
    weth: await weth.getAddress(),
    dexFactory: await dexFactory.getAddress(),
    dexRouter: await dexRouter.getAddress(),
    tx: {
      ...(current.tx || {}),
      weth: weth.deploymentTransaction()?.hash || null,
      dexFactory: dexFactory.deploymentTransaction()?.hash || null,
      dexRouter: dexRouter.deploymentTransaction()?.hash || null,
    },
  });

  console.log(
    JSON.stringify(
      {
        deployer: deployer.address,
        addresses: {
          weth: await weth.getAddress(),
          dexFactory: await dexFactory.getAddress(),
          dexRouter: await dexRouter.getAddress(),
        },
        txHashes: {
          weth: weth.deploymentTransaction()?.hash || null,
          dexFactory: dexFactory.deploymentTransaction()?.hash || null,
          dexRouter: dexRouter.deploymentTransaction()?.hash || null,
        },
        deploymentFile: "deployment-amoy.json",
      },
      null,
      2
    )
  );

  return record;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = main;
