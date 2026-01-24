const { ethers, network, run } = require("hardhat");

async function main() {
  console.log(`Deploying XReserve to network: ${network.name}`);

  const XReserve = await ethers.getContractFactory("XReserve");
  const xreserve = await XReserve.deploy();
  await xreserve.waitForDeployment();

  const address = await xreserve.getAddress();
  console.log(`XReserve deployed at: ${address}`);

  // Optional: Etherscan verification
  // Requires ETHERSCAN_API_KEY in your .env and proper etherscan config in hardhat.config.js
  if (network.name !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for a few confirmations before verification...");
    try {
      const tx = xreserve.deploymentTransaction();
      if (tx) {
        await tx.wait(5);
      }
      await run("verify:verify", {
        address,
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