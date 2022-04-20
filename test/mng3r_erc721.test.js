const ERC20Handler = artifacts.require("ERC20Handler")
const ERC721Handler = artifacts.require("ERC721Handler")
const ERC1155Handler = artifacts.require("ERC1155Handler")
const GovImplementation = artifacts.require("MNG3RGovernor")
const MNG3RImplementation = artifacts.require("MNG3R")
const MNG3RFactory = artifacts.require("MNG3RFactory")
const Quinn721 = artifacts.require("Quinn721")
const Quinn20 = artifacts.require("Quinn20")
const Quinn1155 = artifacts.require("Quinn1155")


contract("MNG3R - Advanced ERC721", async accounts => {
  let erc20Handler
  let erc721Handler
  let erc1155Handler
  let mng3rImplementation
  let factory
  let mng3r
  let gov

  before(async () => {
    erc20Handler = await ERC20Handler.new({ from: accounts[0] })
    await MNG3RImplementation.link("ERC20Handler", erc20Handler.address)

    erc721Handler = await ERC721Handler.new({ from: accounts[0] })
    await MNG3RImplementation.link("ERC71Handler", erc721Handler.address)

    erc1155Handler = await ERC1155Handler.new({ from: accounts[0] })
    await MNG3RImplementation.link("ERC1155Handler", erc1155Handler.address)

    mng3rImplementation = await MNG3RImplementation.new({ from: accounts[0] })

    govImplementation = await GovImplementation.new({ from: accounts[0] })
  })

  beforeEach(async () => {
    factory = await MNG3RFactory.new(mng3rImplementation.address, govImplementation.address, { from: accounts[0] })

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

    govAddresses = await factory
      .getDeployedGovs(
        {
          from: accounts[0]
        }
      )
    govAddress = govAddresses[0]
    gov = await GovImplementation.at(govAddress)

    // test tokens
    quinn721 = await Quinn721.new({ from: accounts[1] })
  })


  it('can receive an ERC721 offer', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      1,
      { from: offerMaker }
    )

    const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
    const erc721Offer = await mng3r.getERC721Offer.call(0)
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    assert.equal(ERC721Payable.toNumber(), 1)
    assert.equal(erc721Offer.offerMaker, offerMaker)
    assert.equal(erc721Balance.toNumber(), 1)
  })


  it('can return an expired ERC721 offer', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      0,
      { from: offerMaker }
    )

    await mng3r.returnExpiredERC721Offer(
      0,
      { from: offerMaker }
    )

    const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
    const numERC721Offers = await mng3r.getNumERC721Offers.call()
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    assert.equal(ERC721Payable.toNumber(), 0)
    assert.equal(numERC721Offers.toNumber(), 0)
    assert.equal(erc721Balance.toNumber(), 0)
  })


  it('can accept an ERC721 offer - pay with Treasury', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC721Offer(
      idx,
      assetPayType,
      { from: accounts[0] }
    )

    const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
    const numERC721Offers = await mng3r.getNumERC721Offers.call()
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)
    const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

    assert.equal(ERC721Payable.toNumber(), 0)
    assert.equal(numERC721Offers.toNumber(), 0)
    assert.equal(erc721Balance.toNumber(), 1)
    assert.equal(offerMakerBalance.toNumber(), 50)
  })


  it('can accept an ERC721 offer - pay with non-Treasury ERC20', async () => {
    const quinn20 = await Quinn20.new({ from: accounts[1] })
    await quinn20.transfer(
      mng3r.address,
      500,
      { from: accounts[1] }
    )

    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      quinn20.address,
      [200],
      [0],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC721Offer(
      idx,
      assetPayType,
      { from: accounts[0] }
    )

    const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
    const numERC721Offers = await mng3r.getNumERC721Offers.call()
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)
    const erc20Balance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(ERC721Payable.toNumber(), 0)
    assert.equal(numERC721Offers.toNumber(), 0)
    assert.equal(erc721Balance.toNumber(), 1)
    assert.equal(erc20Balance.toNumber(), 300)
  })


  it('can accept an ERC721 offer - pay with ERC721', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0
    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    // mint the request asset to mng3r to pay with
    await quinn721.safeMint(
      mng3r.address,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 1
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      quinn721.address,
      [1],
      [0],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC721Offer(
      idx,
      assetPayType,
      { from: accounts[0] }
    )

    const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
    const numERC721Offers = await mng3r.getNumERC721Offers.call()
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    assert.equal(ERC721Payable.toNumber(), 0)
    assert.equal(numERC721Offers.toNumber(), 0)
    assert.equal(erc721Balance.toNumber(), 1)
  })


  it('can accept an ERC721 offer - pay with ERC1155', async () => {
    quinn1155 = await Quinn1155.new({ from: accounts[1] })

    const THORS_HAMMER = 2
    await quinn1155.mint(
      mng3r.address,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[1] }
    )

    const offerMaker = accounts[2]
    const tokenId = 0
    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 2
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      quinn1155.address,
      [THORS_HAMMER],
      [1],
      60,
      { from: offerMaker }
    )

    let idx = 0
    await mng3r.acceptERC721Offer(
      idx,
      assetPayType,
      { from: accounts[0] }
    )

    const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
    const numERC721Offers = await mng3r.getNumERC721Offers.call()
    const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)
    const hammerBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    assert.equal(ERC721Payable.toNumber(), 0)
    assert.equal(numERC721Offers.toNumber(), 0)
    assert.equal(erc721Balance.toNumber(), 1)
    assert.equal(hammerBalance.toNumber(), 0)
  })


  it('only the Admin can accept an ERC721 offer', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      60,
      { from: offerMaker }
    )

    try {
      let idx = 0
      await mng3r.acceptERC721Offer(
        idx,
        assetPayType,
        { from: accounts[7] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
      const numERC721Offers = await mng3r.getNumERC721Offers.call()
      const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)
      const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

      assert.equal(ERC721Payable.toNumber(), 1)
      assert.equal(numERC721Offers.toNumber(), 1)
      assert.equal(erc721Balance.toNumber(), 1)
      assert.equal(offerMakerBalance.toNumber(), 0)
    }
  })


  it('can not accept an expired ERC721 offer', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      0,
      { from: offerMaker }
    )

    try {
      let idx = 0
      await mng3r.acceptERC721Offer(
        idx,
        assetPayType,
        { from: accounts[0] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
      const numERC721Offers = await mng3r.getNumERC721Offers.call()
      const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)
      const offerMakerBalance = await mng3r.balanceOf.call(offerMaker)

      assert.equal(ERC721Payable.toNumber(), 1)
      assert.equal(numERC721Offers.toNumber(), 1)
      assert.equal(erc721Balance.toNumber(), 1)
      assert.equal(offerMakerBalance.toNumber(), 0)
    }
  })


  it('can not receive an ERC721 offer if offerer does not own nft', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0
    const unOwnedTokenId = 99

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    try {
      await quinn721.approve(
        mng3r.address,
        0,
        { from: offerMaker }
      )

      let assetPayType = 0
      await mng3r.offerERC721ToFund(
        quinn721.address,
        [unOwnedTokenId],
        assetPayType,
        mng3r.address,
        [50],
        [0],
        1,
        { from: offerMaker }
      )
    } catch (err) {
      assert.ok(err)

      const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, 0)
      const numERC721Offers = await mng3r.getNumERC721Offers.call()
      const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

      assert.equal(ERC721Payable.toNumber(), 0)
      assert.equal(numERC721Offers.toNumber(), 0)
      assert.equal(erc721Balance.toNumber(), 0)
    }
  })


  it('can not send ERC721 exceeding payable obligations', async () => {
    const offerMaker = accounts[2]
    const tokenId = 0

    await quinn721.safeMint(
      offerMaker,
      '/1',
      { from: accounts[1] }
    )

    await quinn721.approve(
      mng3r.address,
      tokenId,
      { from: offerMaker }
    )

    let assetPayType = 0
    await mng3r.offerERC721ToFund(
      quinn721.address,
      [tokenId],
      assetPayType,
      mng3r.address,
      [50],
      [0],
      1,
      { from: offerMaker }
    )

    try {
      await mng3r.erc721TransferFrom(
        quinn721.address,
        accounts[5],
        tokenId,
        { from: accounts[0] }
      )
    } catch (err) {
      assert.ok(err)

      const ERC721Payable = await mng3r.getERC721Payable.call(quinn721.address, tokenId)
      const erc721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

      assert.equal(ERC721Payable.toNumber(), 1)
      assert.equal(erc721Balance.toNumber(), 1)
    }
  })
})