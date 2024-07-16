require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition"); // 追加
require("@nomiclabs/hardhat-ethers"); // 追加
require("dotenv").config(); // dotenvを読み込む


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts", // コントラクトのソースディレクトリを指定
    artifacts: "./artifacts", // アーティファクトのディレクトリを指定
    cache: "./cache",
    tests: "./test"
  },
  ignition: {
    // 必要に応じて設定を追加
  },
  networks: {
    amoy: {
      url: process.env.ALCHEMY_MUMBAI_URL || "", // 環境変数を使用
      accounts: [process.env.TEST_WALLET_PRIVATE_KEY], // 環境変数を使用
    },
  }
};