// App
import useSWR from 'swr'

import factoryDefinition from '../../build/contracts/MNG3RFactory.json'
import mng3rDefinition from '../../build/contracts/MNG3R.json'

import getContract from './getContract'

const contractDefs = {
  'factory': factoryDefinition,
  'mng3r': mng3rDefinition
}


const contractFetcher = (args) => {
  /*
  args (object) of the follwoing:
    address (address (str))
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { web3, def, addressOrId, action, method, methParams, how, howParams } = args

  const contract = getContract(web3, contractDefs[def], addressOrId)

  let res = null

  if (action == 'methods') {
    res = contract.methods[method](...methParams)[how](howParams)
  }

  if (action == 'events') {
    res = contract.getPastEvents(method, methParams)
  }

  return res
}

export const useContract = (args) => {
  /*
  args (object) of the follwoing:
    address (address (str))
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { data, mutate, error } = useSWR(args, contractFetcher, { refreshInterval: 5000 })

  return {
    data,
    error,
    mutate
  }
}