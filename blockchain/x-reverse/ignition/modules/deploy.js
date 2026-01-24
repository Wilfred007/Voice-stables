// scripts/deploy.js
const { ethers, network, run } = require("hardhat");

async function main() {
  console.log(`Deploying XReserve to network: ${network.name}`);

  const XReserve = await ethers.getContractFactory("XReserve");
  const xreserve = await XReserve.deploy();
  await xreserve.deployed();

  console.log(`XReserve deployed at: ${xreserve.address}`);

  // Optional: Etherscan verification
  // Requires ETHERSCAN_API_KEY in your .env and proper etherscan config in hardhat.config.js
  if (network.name !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for a few confirmations before verification...");
    try {
      // Wait for some blocks to make sure Etherscan indexes the deployment
      await xreserve.deployTransaction.wait(5);
      await run("verify:verify", {
        address: xreserve.address,
        constructorArguments: [],
      });
      console.log("Verification complete.");
    } catch (err) {
      console.log("Verification skipped/failed:", err.message || err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});