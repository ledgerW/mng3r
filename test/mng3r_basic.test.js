const ERC20Handler = artifacts.require("ERC20Handler")
const ERC721Handler = artifacts.require("ERC721Handler")
const ERC1155Handler = artifacts.require("ERC1155Handler")
const MNG3RImplementation = artifacts.require("MNG3R")
const GovImplementation = artifacts.require("MNG3RGovernor")
const MNG3RFactory = artifacts.require("MNG3RFactory")
const Quinn20 = artifacts.require("Quinn20")
const Quinn721 = artifacts.require("Quinn721")
const Quinn1155 = artifacts.require("Quinn1155")


contract("MNG3R - Basic", async accounts => {
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
    quinn721 = await Quinn721.new({ from: accounts[testCoins] })
    quinn1155 = await Quinn1155.new({ from: accounts[testCoins] })
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


  it("deploys a factory, MNG3R, and Gov contract", async () => {
    assert.ok(factory.address)
    assert.ok(mng3r.address)
    assert.ok(gov.address)
  })

  it('sends MNG3R protocol fee', async () => {
    const caller = accounts[protocol]

    let result = await mng3r.mint(
      accounts[7],
      1000000,
      { from: accounts[user] }
    )

    let feeTransfer = result.logs[result.logs.length - 1]

    assert.equal(5000, Number(feeTransfer.args.value))
  })

  it('marks caller as the MNG3R MNG3R_ROLE', async () => {
    const caller = accounts[user]

    const MNG3R_ROLE = await mng3r.MNG3R_ROLE.call()
    const hasRole = await mng3r.hasRole.call(MNG3R_ROLE, caller)

    const mng3rMNG3R = await mng3r.mng3r.call()

    assert.ok(hasRole)
    assert.equal(mng3rMNG3R, caller)
  })

  it('sends MNG3R supply to the mng3r', async () => {
    const caller = accounts[user]

    const balance = await mng3r.balanceOf.call(caller)

    assert.equal(1000000, balance)
  })

  it('updates mng3r and mng3rFee', async () => {
    const origMNG3RFee = await mng3r.mng3rFee.call()
    const newMNG3R = accounts[9]
    const newFee = 1000

    await mng3r.setMNG3R(
      newMNG3R,
      { from: accounts[user] }
    )

    await mng3r.setMNG3RFee(
      newFee,
      { from: accounts[user] }
    )

    const mng3rMNG3R = await mng3r.mng3r.call()
    const mng3rFee = await mng3r.mng3rFee.call()

    assert.equal(origMNG3RFee, 200)
    assert.equal(mng3rMNG3R, newMNG3R)
    assert.equal(mng3rFee, newFee)
  })

  it('can receive ETH', async () => {
    const ethAmount = web3.utils.toWei('5', 'ether')

    const beginETHBalance = await web3.eth.getBalance(mng3r.address)

    await web3.eth.sendTransaction({
      from: accounts[5],
      to: mng3r.address,
      value: ethAmount
    })

    const endETHBalance = await web3.eth.getBalance(mng3r.address)

    assert.equal(
      Number(web3.utils.fromWei(endETHBalance, 'ether')),
      Number(web3.utils.fromWei(beginETHBalance, 'ether')) + Number(web3.utils.fromWei(ethAmount, 'ether'))
    )
  })

  it('can send ETH', async () => {
    const recipient = accounts[8]
    const ethReceive = web3.utils.toWei('5', 'ether')
    const ethSend = web3.utils.toWei('3', 'ether')

    const beginETHBalance = await web3.eth.getBalance(recipient)

    await web3.eth.sendTransaction({
      from: accounts[5],
      to: mng3r.address,
      value: ethReceive
    })

    await mng3r.sendETH(
      recipient,
      { from: accounts[user], value: ethSend }
    )

    const endETHBalance = await web3.eth.getBalance(recipient)

    assert.equal(Number(endETHBalance), (Number(beginETHBalance) + Number(ethSend)))
  })

  it('can receive ERC20', async () => {
    const BeginQCBalance = await mng3r.erc20BalanceOf.call(quinn20.address)

    await quinn20.transfer(
      mng3r.address,
      100,
      { from: accounts[testCoins] }
    )

    const EndQCBalance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(EndQCBalance.toNumber(), BeginQCBalance.toNumber() + 100)
  })

  it('can send ERC20', async () => {
    const BeginQCBalance = await mng3r.erc20BalanceOf.call(quinn20.address)

    await quinn20.transfer(
      mng3r.address,
      100,
      { from: accounts[testCoins] }
    )

    await mng3r.erc20Transfer(
      quinn20.address,
      accounts[testCoins],
      75,
      { from: accounts[user] }
    )

    const EndQCBalance = await mng3r.erc20BalanceOf.call(quinn20.address)

    assert.equal(BeginQCBalance.toNumber() + 25, EndQCBalance.toNumber())
  })

  it('can receive ERC721', async () => {
    const BeginQ721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    await quinn721.safeMint(
      mng3r.address,
      '/1',
      { from: accounts[testCoins] }
    )

    const EndQ721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    const holding721 = await mng3r.holding721.call(0)

    assert.equal(EndQ721Balance.toNumber(), BeginQ721Balance.toNumber() + 1)
    assert.ok(holding721.qty.toNumber() === 1)
  })

  it('can send ERC721', async () => {
    const BeginQ721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    const mintNFT = await quinn721.safeMint(
      mng3r.address,
      '/1',
      { from: accounts[testCoins] }
    )

    const nftId = mintNFT.logs[0].args.tokenId.toNumber()

    await mng3r.erc721TransferFrom(
      quinn721.address,
      accounts[testCoins],
      nftId,
      { from: accounts[user] }
    )

    const EndQ721Balance = await mng3r.erc721BalanceOf.call(quinn721.address)

    const holding721 = await mng3r.holding721.call(0)

    assert.equal(BeginQ721Balance.toNumber(), EndQ721Balance.toNumber())
    assert.ok(holding721.qty.toNumber() === 0)
  })


  it('can receive ERC1155', async () => {
    const THORS_HAMMER = 2

    const BeginQ1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    await quinn1155.mint(
      mng3r.address,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    const EndQ1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    const holding1155 = await mng3r.holding1155.call(0)

    assert.equal(EndQ1155Balance.toNumber(), BeginQ1155Balance.toNumber() + 1)
    assert.ok(holding1155.qty.toNumber() === 1)
  })

  it('can send ERC1155', async () => {
    const THORS_HAMMER = 2

    const BeginQ1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    const mintNFT = await quinn1155.mint(
      mng3r.address,
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[testCoins] }
    )

    await mng3r.erc1155TransferFrom(
      quinn1155.address,
      accounts[testCoins],
      THORS_HAMMER,
      1,
      "0x0",
      { from: accounts[user] }
    )

    const EndQ1155Balance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)

    const holding1155 = await mng3r.holding1155.call(0)

    assert.equal(BeginQ1155Balance.toNumber(), EndQ1155Balance.toNumber())
    assert.ok(holding1155.qty.toNumber() === 0)
  })

  it('can receive ERC1155 batch', async () => {
    const THORS_HAMMER = 2
    const LOKIS_DAGGER = 3

    const BeginTHORSBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const BeginLOKISBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, LOKIS_DAGGER)

    await quinn1155.mintBatch(
      mng3r.address,
      [THORS_HAMMER, LOKIS_DAGGER],
      [1, 1],
      "0x0",
      { from: accounts[testCoins] }
    )

    const EndTHORSBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const EndLOKISBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, LOKIS_DAGGER)

    const holdingTHOR = await mng3r.holding1155.call(0)
    const holdingLOKI = await mng3r.holding1155.call(1)

    assert.equal(EndTHORSBalance.toNumber(), BeginTHORSBalance.toNumber() + 1)
    assert.equal(EndLOKISBalance.toNumber(), BeginLOKISBalance.toNumber() + 1)
    assert.equal(holdingTHOR.id.toNumber(), THORS_HAMMER)
    assert.equal(holdingLOKI.id.toNumber(), LOKIS_DAGGER)
  })

  it('can send ERC1155 batch', async () => {
    const THORS_HAMMER = 2
    const LOKIS_DAGGER = 3

    const BeginTHORSBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const BeginLOKISBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, LOKIS_DAGGER)

    await quinn1155.mintBatch(
      mng3r.address,
      [THORS_HAMMER, LOKIS_DAGGER],
      [1, 1],
      "0x0",
      { from: accounts[testCoins] }
    )

    await mng3r.erc1155BatchTransferFrom(
      quinn1155.address,
      accounts[testCoins],
      [THORS_HAMMER, LOKIS_DAGGER],
      [1, 1],
      "0x0",
      { from: accounts[user] }
    )

    const EndTHORSBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, THORS_HAMMER)
    const EndLOKISBalance = await mng3r.erc1155BalanceOf.call(quinn1155.address, LOKIS_DAGGER)

    const holdingTHOR = await mng3r.holding1155.call(0)
    const holdingLOKI = await mng3r.holding1155.call(1)

    assert.equal(EndTHORSBalance.toNumber(), BeginTHORSBalance.toNumber())
    assert.equal(EndLOKISBalance.toNumber(), BeginLOKISBalance.toNumber())
    assert.equal(holdingTHOR.qty.toNumber(), 0)
    assert.equal(holdingLOKI.qty.toNumber(), 0)
  })

})
