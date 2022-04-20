const GovernorImplementation = artifacts.require('MNG3RGovernor')

module.exports = async function(deployer) {
  await deployer.deploy(GovernorImplementation);
};
