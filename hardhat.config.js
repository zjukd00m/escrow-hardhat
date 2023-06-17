require('@nomicfoundation/hardhat-toolbox');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();

module.exports = {
  solidity: "0.8.17",
  paths: {
    artifacts: "./app/src/artifacts",
  },
  networks: {
    hardhat: {},
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [
        process.env.PRIVATE_KEY,
      ]
    },
    etherscan: {
      url: 'https://api.polygonscan.com/api',
      apiKey: process.env.POLYGONSCAN_API_KEY,
    },
  }
};
