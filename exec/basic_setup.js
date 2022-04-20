const MNG3RImplementation = artifacts.require("MNG3R")
const GovImplementation = artifacts.require("MNG3RGovernor")
const MNG3RFactory = artifacts.require("MNG3RFactory")
const Quinn20 = artifacts.require("Quinn20")
const Quinn721 = artifacts.require("Quinn721")
const Quinn1155 = artifacts.require("Quinn1155")


module.exports = async function (callback) {
  try {
    // Fetch accounts from wallet - these are unlocked
    const accounts = await web3.eth.getAccounts()

    factory = await MNG3RFactory.deployed()
    console.log('Factory at', factory.address)

    await factory
      .createNewMNG3R(
        'TestMNG3R',
        'TLC',
        '1000000',
        '1',
        '3',
        '1',
        {
          from: accounts[0]
        }
      )

    mng3rAddresses = await factory
      .getDeployedMNG3Rs(
        {
          from: accounts[0]
        }
      )
    mng3rAddress = mng3rAddresses[0]
    mng3r = await MNG3RImplementation.at(mng3rAddress)
    console.log('MNG3R at:', mng3r.address)

    govAddresses = await factory
      .getDeployedGovs(
        {
          from: accounts[0]
        }
      )
    govAddress = govAddresses[0]
    gov = await GovImplementation.at(govAddress)
    console.log('Gov at', gov.address)

    //quinn20 = await Quinn20.deployed()
    //quinn721 = await Quinn721.deployed()
    //quinn1155 = await Quinn1155.deployed()
  }
  catch (error) {
    console.log(error)
  }

  callback()
}