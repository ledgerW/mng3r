const MNG3RImplementation = artifacts.require('MNG3R')
const GovernorImplementation = artifacts.require('MNG3RGovernor')
const MNG3RFactory = artifacts.require('MNG3RFactory')

module.exports = async function(deployer) {
  // Already deployed Implementation contract
  const mng3rImplementation = await MNG3RImplementation.deployed()
  const govImplementation = await GovernorImplementation.deployed()

  // then factory
  await deployer.deploy(MNG3RFactory, mng3rImplementation.address, govImplementation.address)
};
