import "@nomicfoundation/hardhat-toolbox";

const config = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.NEXT_PUBLIC_ETH_RPC_URL,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

export default config;
