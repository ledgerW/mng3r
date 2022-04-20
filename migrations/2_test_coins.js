const Quinn20 = artifacts.require('Quinn20')
const Quinn721 = artifacts.require('Quinn721')
const Quinn1155 = artifacts.require('Quinn1155')

module.exports = function(deployer, network, accounts) {
  // local test only
  if ((network == "development") || (network == "rinkeby")) {
    deployer.deploy(Quinn20)
    deployer.deploy(Quinn721)
    deployer.deploy(Quinn1155)
  }
};
