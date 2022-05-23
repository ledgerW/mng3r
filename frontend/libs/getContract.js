// Contracts
const getContract = (_web3, contractDefinition, addressOrId) => {
  const web3 = _web3
  let deployedAddress

  try {
    // get network ID and the deployed address
    deployedAddress = contractDefinition.networks[addressOrId].address
  } catch {
    deployedAddress = addressOrId
  }

  // create the instance
  const instance = new web3.eth.Contract(
    contractDefinition.abi,
    deployedAddress
  )

  return instance
}

export default getContract