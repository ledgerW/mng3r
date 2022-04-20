// App
import useSWR from 'swr'

import campaignDefinition from '../../build/contracts/Campaign.json'

import getContract from '../libs/getContract'


const campaignFetcher = (args) => {
  /*
  args (object) of the follwoing:
    address (address (str))
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { web3, address, method, methParams, how, howParams } = args

  const campaign = getContract(web3, campaignDefinition, null, address)

  const res = campaign.methods[method](...methParams)[how](howParams)

  return res
}

export const useCampaign = (args) => {
  /*
  args (object) of the follwoing:
    address (address (str))
    method (contract method name (str))
    methParams (contract method params (list))
    how (contract method type, eg. call, send (str))
    howParams (contract method type params (object))
  */
  const { data, mutate, error } = useSWR(args, campaignFetcher, { refreshInterval: 5000 })

  return {
    data,
    error,
    mutate
  }
}