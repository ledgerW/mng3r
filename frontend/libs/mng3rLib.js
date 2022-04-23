// App
import useSWR from 'swr'

import mng3rDefinition from '../../build/contracts/MNG3R.json'

import getContract from './getContract'


const mng3rFetcher = (args) => {
  /*
  args (object) of the follwoing:
    address (address (str))
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { web3, address, method, methParams, how, howParams } = args

  const campaign = getContract(web3, mng3rDefinition, null, address)

  const res = campaign.methods[method](...methParams)[how](howParams)

  return res
}

export const useMNG3R = (args) => {
  /*
  args (object) of the follwoing:
    address (address (str))
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { data, mutate, error } = useSWR(args, mng3rFetcher, { refreshInterval: 5000 })

  return {
    data,
    error,
    mutate
  }
}