require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const normalizedPrivateKey = (() => {
  let pk = process.env.PRIVATE_KEY || "";
  if (!pk) return "";
  pk = pk.trim();
  if (!pk.startsWith("0x")) pk = "0x" + pk;
  if (pk.length > 66) pk = pk.slice(0, 66);
  return pk;
})();

const networkAccounts = normalizedPrivateKey ? [normalizedPrivateKey] : [];
const amoyRpcUrl =
  process.env.AMOY_RPC_URL ||
  process.env.RPC_URL ||
  "https://rpc-amoy.polygon.technology/";
const polygonRpcUrl =
  process.env.POLYGON_RPC_URL ||
  process.env.MAINNET_RPC_URL ||
  process.env.RPC_URL ||
  "https://polygon-rpc.com/";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    amoy: {
      url: amoyRpcUrl,
      accounts: networkAccounts,
      chainId: 80002,
      gasPrice: 30000000000,
      timeout: 90000,
    },
    polygon: {
      url: polygonRpcUrl,
      accounts: networkAccounts,
      chainId: 137,
      gasPrice: "auto",
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
