import { useEffect, useState } from 'react'
import Head from 'next/head'
import { ContextWrapper } from '../libs/contextLib'

import getWeb3, { subscribeProvider, setCurrentState } from '../libs/web3'
import getContract from '../libs/getContract'
import factoryDefinition from '../../build/contracts/CampaignFactory.json'

import 'semantic-ui-css/semantic.min.css'

//import { Amplify } from 'aws-amplify';

/*
Amplify.configure({
  API: {
    endpoints: [
      {
        name: "similarity",
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION
      },
    ]
  }
});
*/


export default ({ Component, pageProps }) => {
  const [web3, setWeb3] = useState(null)
  const [factory, setFactory] = useState(null)
  const [userAccount, setUserAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [networkId, setNetworkId] = useState(null)


  const allContext = {
    web3, setWeb3,
    factory, setFactory,
    userAccount, setUserAccount,
    chainId, setChainId,
    networkId, setNetworkId
  }

  useEffect(async () => {
    const { web3Instance, providerInstance } = await getWeb3()
    const networkId = await web3Instance.eth.net.getId()
    let contract

    try {
      contract = await getContract(web3Instance, factoryDefinition, networkId)
    } catch {
      contract = null
      console.log(`${networkId} is not supported`)
    }

    const handlers = {setUserAccount, setChainId, setNetworkId}
    await setCurrentState(providerInstance, handlers)
    await subscribeProvider(providerInstance, handlers)

    setWeb3(web3Instance)
    setFactory(contract)
  }, [])

  return (
    <div className="App">
      <Head>
        <meta content="text/html; charset=UTF-8" name="Content-Type" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        
        <link rel="manifest" href="/manifest.json" />
        
        <title>CrowdCoin</title>
      </Head>
      {web3 && 
        <ContextWrapper allContext={allContext}>
          <Component {...pageProps}/>
        </ContextWrapper>
      }
      
    </div>
  ) 
}