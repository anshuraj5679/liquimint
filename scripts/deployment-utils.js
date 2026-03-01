const fs = require("fs");
const path = require("path");

const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployment-amoy.json");

function loadDeployment() {
  if (!fs.existsSync(DEPLOYMENT_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
}

function saveDeployment(nextData) {
  const current = loadDeployment();
  const merged = {
    ...current,
    ...nextData,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

function requireAddress(name, value) {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} is required and must be a valid address`);
  }
}

module.exports = {
  DEPLOYMENT_FILE,
  loadDeployment,
  saveDeployment,
  requireAddress,
};
