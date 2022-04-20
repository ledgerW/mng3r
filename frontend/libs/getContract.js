// Contracts
const getContract = (web3Instance, contractDefinition, networkId=null, address=null) => {
  const web3 = web3Instance
  let deployedAddress
  
  if (contractDefinition.contractName === "CampaignFactory") {
    // get network ID and the deployed address
    deployedAddress = contractDefinition.networks[networkId].address
  } else {
    deployedAddress = address
  }
  

  // create the instance
  const instance = new web3.eth.Contract(
    contractDefinition.abi,
    deployedAddress
  )

  return instance
}

export default getContract