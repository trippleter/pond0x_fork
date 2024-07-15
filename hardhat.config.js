require("@nomicfoundation/hardhat-toolbox");
require("hardhat-tracer");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",

  networks: {
    hardhat: {
      forking: {
        url: 'https://rpc.ankr.com/eth',
        blockNumber: 20282673 // comment for latest
      },
    }
  },
  mocha: {
    timeout: 120000 // Set default timeout to 120 seconds
  }
};
