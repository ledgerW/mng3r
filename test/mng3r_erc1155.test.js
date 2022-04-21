const ERC20Handler = artifacts.require("ERC20Handler")
const ERC721Handler = artifacts.require("ERC721Handler")
const ERC1155Handler = artifacts.require("ERC1155Handler")
const GovImplementation = artifacts.require("MNG3RGovernor")
const MNG3RImplementation = artifacts.require("MNG3R")
const MNG3RFactory = artifacts.require("MNG3RFactory")
const Quinn1155 = artifacts.require("Quinn1155")
const Quinn20 = artifacts.require("Quinn20")
const Quinn721 = artifacts.require("Quinn721")

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("MNG3R - Advanced ERC1155", async accounts => {
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

    // test tokens
    quinn1155 = await Quinn1155.new({ from: accounts[testCoins] })
  })


  it('can receive an ERC1155 offer', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      1,
      { from: offerMaker }
    )

    const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
    const erc1155Offer = await mng3r.getERC1155Offer.call(0)
    const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    assert.equal(ERC1155Payable.toNumber(), 1)
    assert.equal(erc1155Offer.offerMaker, offerMaker)
    assert.equal(erc1155Balance.toNumber(), 1)
  })


  it('can return an expired ERC1155 offer', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      0,
      { from: offerMaker }
    )

    await mng3r.returnExpiredERC1155Offer(
      0,
      { from: offerMaker }
    )

    const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
    const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
    const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    assert.equal(ERC1155Payable.toNumber(), 0)
    assert.equal(numERC1155Offers.toNumber(), 0)
    assert.equal(erc1155Balance.toNumber(), 0)
  })


  it('can accept an ERC1155 offer - pay with Treasury', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC1155Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
    const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
    const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

    assert.equal(ERC1155Payable.toNumber(), 0)
    assert.equal(numERC1155Offers.toNumber(), 0)
    assert.equal(erc1155Balance.toNumber(), 1)
    assert.equal(offerMakerBalance.toNumber(), 50)
  })


  it('can accept an ERC1155 offer - pay with non-treasury ERC20', async () => {
    const quinn20 = await Quinn20.new({ from: accounts[testCoins] })
    await quinn20.transfer(
      mng3r.address,
      500,
      { from: accounts[testCoins] }
    )

    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      quinn20.address,
      [200],
      [0],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC1155Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
    const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
    const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(ERC1155Payable.toNumber(), 0)
    assert.equal(numERC1155Offers.toNumber(), 0)
    assert.equal(erc1155Balance.toNumber(), 1)
    assert.equal(erc20Balance.toNumber(), 300)
  })


  it('can accept an ERC1155 offer - pay with ERC721', async () => {
    const quinn721 = await Quinn721.new({ from: accounts[testCoins] })
    await quinn721.safeMint(
      mng3r.address,
      '/1',
      { from: accounts[testCoins] }
    )

    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 1
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      quinn721.address,
      [0],
      [0],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC1155Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
    const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
    const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    assert.equal(ERC1155Payable.toNumber(), 0)
    assert.equal(numERC1155Offers.toNumber(), 0)
    assert.equal(erc1155Balance.toNumber(), 1)
    assert.equal(erc721Balance.toNumber(), 0)
  })


  it('can accept an ERC1155 offer - pay with ERC1155', async () => {
    const offerMaker = accounts[8]
    const LOKIS_DAGGER = 1
    const THORS_HAMMER = 2

    await quinn1155.mint(
      mng3r.address,
      LOKIS_DAGGER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 2
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      quinn1155.address,
      [LOKIS_DAGGER],
      [1],
      [60],
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC1155Offer(
      idx,
      assetPayType,
      { from: accounts[user] }
    )

    const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
    const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
    const hammerBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const daggerBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, LOKIS_DAGGER)

    assert.equal(ERC1155Payable.toNumber(), 0)
    assert.equal(numERC1155Offers.toNumber(), 0)
    assert.equal(hammerBalance.toNumber(), 1)
    assert.equal(daggerBalance.toNumber(), 0)
  })


  it('only the Admin can accept an ERC1155 offer', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      60,
      { from: offerMaker }
    )

    try {
      let idx = 0
      await mng3r.acceptERC1155Offer(
        idx,
        assetPayType,
        { from: accounts[user] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
      const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
      const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
      const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

      assert.equal(ERC1155Payable.toNumber(), 1)
      assert.equal(numERC1155Offers.toNumber(), 1)
      assert.equal(erc1155Balance.toNumber(), 1)
      assert.equal(offerMakerBalance.toNumber(), 0)
    }
  })


  it('can not accept an expired ERC1155 offer', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      0,
      { from: offerMaker }
    )

    try {
      let idx = 0
      await mng3r.acceptERC1155Offer(
        idx,
        assetPayType,
        { from: accounts[user] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
      const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
      const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
      const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

      assert.equal(ERC1155Payable.toNumber(), 1)
      assert.equal(numERC1155Offers.toNumber(), 1)
      assert.equal(erc1155Balance.toNumber(), 1)
      assert.equal(offerMakerBalance.toNumber(), 0)
    }
  })


  it('can not receive an ERC1155 offer if offerer does not own nft', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    try {
      let assetPayType = 0
      await mng3r.offerERC1155ToFund(
        quinn1155.address,
        [THORS_HAMMER],
        [3],
        assetPayType,
        mng3r.address,
        [50],
        [0],
        1,
        { from: offerMaker }
      )
    } catch (err) {
      assert.ok(err)

      const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
      const numERC1155Offers = await mng3r.getNumERC1155Offers.call()
      const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

      assert.equal(ERC1155Payable.toNumber(), 0)
      assert.equal(numERC1155Offers.toNumber(), 0)
      assert.equal(erc1155Balance.toNumber(), 0)
    }
  })


  it('can not send ERC1155 exceeding payable obligations', async () => {
    const offerMaker = accounts[8]
    const THORS_HAMMER = 2

    await quinn1155.mint(
      offerMaker,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await quinn1155.setApprovalForAll(
      mng3r.address,
      true,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC1155ToFund(
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      1,
      { from: offerMaker }
    )

    try {
      await mng3r.erc1155TransferFrom(
        quinn1155.address,
        accounts[5],
        THORS_HAMMER,
        { from: accounts[user] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC1155Payable = await mng3r.getERC1155Payable.call(quinn1155.address, THORS_HAMMER)
      const erc1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

      assert.equal(ERC1155Payable.toNumber(), 1)
      assert.equal(erc1155Balance.toNumber(), 1)
    }
  })
})
