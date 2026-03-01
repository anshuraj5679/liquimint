const { ethers } = require("hardhat");
const { loadDeployment, saveDeployment, requireAddress } = require("./deployment-utils");

async function main() {
  const current = loadDeployment();
  const factoryAddress = process.env.BONDING_FACTORY || current.bondingCurveFactory;
  const reputationAddress = process.env.REPUTATION_ADDRESS;

  requireAddress("BONDING_FACTORY", factoryAddress);
  requireAddress("REPUTATION_ADDRESS", reputationAddress);

  const factory = await ethers.getContractAt("BondingCurveFactoryV3", factoryAddress);
  const tx = await factory.setReputationContract(reputationAddress);
  await tx.wait();

  saveDeployment({
    reputationContract: reputationAddress,
    tx: {
      ...(current.tx || {}),
      setReputation: tx.hash,
    },
  });

  console.log(
    JSON.stringify(
      {
        bondingFactory: factoryAddress,
        reputationContract: reputationAddress,
        txHash: tx.hash,
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
