const deployAll = require("./deploy-all");

async function main() {
  await deployAll();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = main;
