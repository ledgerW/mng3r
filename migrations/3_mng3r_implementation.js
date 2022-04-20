const ERC20Handler = artifacts.require('ERC20Handler')
const ERC721Handler = artifacts.require('ERC721Handler')
const ERC1155Handler = artifacts.require('ERC1155Handler')
const MNG3RImplementation = artifacts.require('MNG3R')

module.exports = async function(deployer) {
  await deployer.deploy(ERC20Handler)
  await deployer.link(ERC20Handler, MNG3RImplementation);

  await deployer.deploy(ERC721Handler)
  await deployer.link(ERC721Handler, MNG3RImplementation);

  await deployer.deploy(ERC1155Handler)
  await deployer.link(ERC1155Handler, MNG3RImplementation);

  await deployer.deploy(MNG3RImplementation);
};
