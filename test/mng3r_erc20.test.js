const ERC20Handler = artifacts.require("ERC20Handler")
const ERC721Handler = artifacts.require("ERC721Handler")
const ERC1155Handler = artifacts.require("ERC1155Handler")
const GovImplementation = artifacts.require("MNG3RGovernor")
const MNG3RImplementation = artifacts.require("MNG3R")
const MNG3RFactory = artifacts.require("MNG3RFactory")
const Quinn20 = artifacts.require("Quinn20")
const Quinn721 = artifacts.require("Quinn721")
const Quinn1155 = artifacts.require("Quinn1155")

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("MNG3R - Advanced ERC20", async accounts => {
  let protocol = 0
  let testCoins = 1
  let user = 2
  let erc20Handler
  let erc721Handler
  let erc1155Handler
  let mng3rImplementation
  let factory
  let mng3r
  let gov

  before(async () => {
    erc20Handler = await ERC20Handler.new({ from: accounts[protocol] })
    await MNG3RImplementation.link("ERC20Handler", erc20Handler.address)

    erc721Handler = await ERC721Handler.new({ from: accounts[protocol] })
    await MNG3RImplementation.link("ERC71Handler", erc721Handler.address)

    erc1155Handler = await ERC1155Handler.new({ from: accounts[protocol] })
    await MNG3RImplementation.link("ERC1155Handler", erc1155Handler.address)

    mng3rImplementation = await MNG3RImplementation.new({ from: accounts[protocol] })

    govImplementation = await GovImplementation.new({ from: accounts[protocol] })

    // test tokens
    quinn20 = await Quinn20.new({ from: accounts[testCoins] })
  })

  beforeEach(async () => {
    factory = await MNG3RFactory.new(mng3rImplementation.address, govImplementation.address, { from: accounts[protocol] })

    await factory
      .createNewMNG3R(
        'TestMNG3R',
        'TLC',
        '1000000',
        '1',
        '3',
        '1',
        {
          from: accounts[user]
        }
      )

    mng3rAddresses = await factory
      .getDeployedMNG3Rs(
        {
          from: accounts[user]
        }
      )
    mng3rAddress = mng3rAddresses[0]
    mng3r = await MNG3RImplementation.at(mng3rAddress)

    govAddresses = await factory
      .getDeployedGovs(
        {
          from: accounts[user]
        }
      )
    govAddress = govAddresses[0]
    gov = await GovImplementation.at(govAddress)
  })


  it('can receive an ERC20 offer', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      1,
      { from: offerMaker }
    )

    const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
    const erc20Offer = await mng3r.getERC20Offer.call(0)
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(ERC20Payable.toNumber(), 100)
    assert.equal(erc20Offer.offerMaker, offerMaker)
    assert.equal(erc20Balance.toNumber(), 100)
  })


  it('can return an expired ERC20 offer', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      0,
      { from: offerMaker }
    )

    await mng3r.returnExpiredERC20Offer(
      0,
      { from: offerMaker }
    )

    const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
    const numERC20Offers = await mng3r.getNumERC20Offers.call()
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(ERC20Payable.toNumber(), 0)
    assert.equal(numERC20Offers.toNumber(), 0)
    assert.equal(erc20Balance.toNumber(), 0)
  })


  it('can accept an ERC20 offer - pay with Treasury', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      120,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC20Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
    const numERC20Offers = await mng3r.getNumERC20Offers.call()
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)
    const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

    assert.equal(ERC20Payable.toNumber(), 0)
    assert.equal(numERC20Offers.toNumber(), 0)
    assert.equal(erc20Balance.toNumber(), offerAmt)
    assert.equal(offerMakerBalance.toNumber(), 50)
  })


  it('can accept an ERC20 offer - pay with non-treasury ERC20', async () => {
    await quinn20.transfer(
      mng3r.address,
      500,
      { from: accounts[testCoins] }
    )

    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      quinn20.address,
      [300],
      [0],
      120,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC20Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
    const numERC20Offers = await mng3r.getNumERC20Offers.call()
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(ERC20Payable.toNumber(), 0)
    assert.equal(numERC20Offers.toNumber(), 0)
    assert.equal(erc20Balance.toNumber(), 500 + offerAmt - 300)
  })


  it('can accept an ERC20 offer - pay with ERC721', async () => {
    const quinn721 = await Quinn721.new({ from: accounts[testCoins] })
    await quinn721.safeMint(
      mng3r.address,
      '/1',
      { from: accounts[testCoins] }
    )

    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 1
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      quinn721.address,
      [0],
      [0],
      120,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC20Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
    const numERC20Offers = await mng3r.getNumERC20Offers.call()
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    assert.equal(ERC20Payable.toNumber(), 0)
    assert.equal(numERC20Offers.toNumber(), 0)
    assert.equal(erc20Balance.toNumber(), offerAmt)
    assert.equal(erc721Balance.toNumber(), 0)
  })


  it('can accept an ERC20 offer - pay with ERC1155', async () => {
    const quinn1155 = await Quinn1155.new({ from: accounts[testCoins] })
    const THORS_HAMMER = 2
    await quinn1155.mint(
      mng3r.address,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 2
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      120,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC20Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
    const numERC20Offers = await mng3r.getNumERC20Offers.call()
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)
    const hammerBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    assert.equal(ERC20Payable.toNumber(), 0)
    assert.equal(numERC20Offers.toNumber(), 0)
    assert.equal(erc20Balance.toNumber(), offerAmt)
    assert.equal(hammerBalance.toNumber(), 0)
  })


  it('only the Admin can accept an ERC20 offer', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      60,
      { from: offerMaker }
    )

    try {
      let idx = 0
      await mng3r.acceptERC20Offer(
        idx,
        assetPayType,
        { from: accounts[7] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
      const numERC20Offers = await mng3r.getNumERC20Offers.call()
      const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)
      const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

      assert.equal(ERC20Payable.toNumber(), offerAmt)
      assert.equal(numERC20Offers.toNumber(), 1)
      assert.equal(erc20Balance.toNumber(), offerAmt)
      assert.equal(offerMakerBalance.toNumber(), 0)
    }
  })


  it('can not accept an expired ERC20 offer', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      0,
      { from: offerMaker }
    )

    try {
      let idx = 0
      await mng3r.acceptERC20Offer(
        idx,
        assetPayType,
        { from: accounts[user] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
      const numERC20Offers = await mng3r.getNumERC20Offers.call()
      const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)
      const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

      assert.equal(ERC20Payable.toNumber(), offerAmt)
      assert.equal(numERC20Offers.toNumber(), 1)
      assert.equal(erc20Balance.toNumber(), offerAmt)
      assert.equal(offerMakerBalance.toNumber(), 0)
    }
  })


  it('can not receive an ERC20 offer if offerer has insufficient tokens', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 600

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    try {
      let assetPayType = 0
      await mng3r.offerERC20ToFund(
        quinn20.address,
        [offerAmt],
        assetPayType,
        mng3r.address,
        [50],
        [0],
        1,
        { from: offerMaker }
      )
    } catch (err) {
      assert.ok(err)

      const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
      const numERC20Offers = await mng3r.getNumERC20Offers.call()
      const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

      assert.equal(ERC20Payable.toNumber(), 0)
      assert.equal(numERC20Offers.toNumber(), 0)
      assert.equal(erc20Balance.toNumber(), 0)
    }
  })


  it('can not send ERC20 exceeding payable obligations', async () => {
    const offerMaker = accounts[8]
    const offerAmt = 100

    await quinn20.transfer(
      offerMaker,
      500,
      { from: accounts[testCoins] }
    )

    await quinn20.increaseAllowance(
      mng3r.address,
      offerAmt,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC20ToFund(
      quinn20.address,
      [offerAmt],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      1,
      { from: offerMaker }
    )

    try {
      await mng3r.erc20Transfer(
        quinn20.address,
        accounts[5],
        75,
        { from: accounts[user] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC20Payable = await mng3r.getERC20Payable.call(quinn20.address)
      const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

      assert.equal(ERC20Payable.toNumber(), 100)
      assert.equal(erc20Balance.toNumber(), 100)
    }
  })
})
