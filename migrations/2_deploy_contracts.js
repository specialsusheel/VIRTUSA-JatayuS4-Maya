const TransactionBatch = artifacts.require("TransactionBatch");

module.exports = function (deployer) {
  deployer.deploy(TransactionBatch);
};
