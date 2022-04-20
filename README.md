# MNG3R  
The MNG3R dApp lets you create your own mng3r instance.  A mng3r is essentially 
an on-chain ETF (Exchange-Traded Fund) with a DAO governance structure that is spawned when you create a
new mng3r instance.  A mng3r instance can hold and trade a collection of any
on-chain assets (ERC20, ERC721, ERC1155) and issue ownshership shares (ERC20 tokens w/ voting rights)
of itself.  

Example Usages:
- A personal on-chain hedge fund you manage  
- Sell shares of the NFT collection you've acquired or created  
- On-chain tax-loss harvesting (maybe?)

A mng3r instance consists of:
- a MNG3R contract  
  - this is an ERC20 token that can...  
  - send and receive ETH, ERC20, ERC721, and ERC1155  
  - trustlessly receive and execute trade offers for any of the above assets  
    - holds offered asset in escrow  
    - cannot transfer offered asset will offer is pending  
- an OpenZeppelin Governor contract linked to your MNG3R instance  
  - so your MNG3R ETF is also a DAO out of the box  
- Additionally from the dApp, you can...
  - link your MNG3R and Gov contracts to an OpenZeppelin Defender account  
  - link and use Tally for Governance admin  
  - buy and sell tokens (ERC20) through 0x/Match  
  - buy and sell NFTs (ERC721, ERC115) through OpenSea


## Contracts
### Run Tests  
On local Ganache  
- start Ganache  
- from project root  
- run all tests: `truffle test`  
- run specific test: `truffle test test/testFile.js --network [TRUFFLE-NETWORK] [...truffle kwargs]`  
  

### Deploy Contracts  
- from project root 
- `truffle migrate --network [TRUFFLE-NETWORK] [...truffle kwargs]`   

### Compile Contracts  
- from project root 
- `truffle compile --network [TRUFFLE-NETWORK] [...truffle kwargs]`  

### Run Scripts On Network  
- from project root
- `truffle exec --network [NETWORK NAME] exec/script.js`  


## Frontend  
### Run Local  
- from `./frontend`
- `npm run start`  

### Deploy  
- Hosting and CI/CD on Vercel 


## TODO  
### Functionality  
- [X] make factory   
- [X] add Events  and Errors  
- [X] write tests  
- [X] refactor w/ libraries  
- [X] refactor as minimal proxy  
- [X] accept (approve and execute) asset trade offer  
- [ ] protocol fee structure  
- [ ] manager fee structure
- [X] write more tests  
- [X] create Infura project  
- [X] test w/ OZ Defender account  
- [X] deploy to Rinkeby testnet  
- [X] manual test of Fund contract on testnet   
- [ ] deploy to Optimism testnet  
- [ ] deploy to Optimism mainnet
- [ ] deploy to Arbitrum testnet  
- [ ] deploy to Arbitrum mainnet  
- [ ] manual test with Matcha, OpenSea, etc...

### UI  
- [ ] Basic display and interaction  
- [ ] OZ Defender API - account setup for user MNG3R instances  
- [ ] 0x API - buy and sell module  
- [ ] OpenSea API - buy and sell NFTs  
- [ ] Tally API (?) - account setup for user MNG3R instances 

### Governance
- [X] make Governor contract  
- [ ] update Fund contract for governance roles and actions
- [X] test w/ Tally account for Governance/DAO 

