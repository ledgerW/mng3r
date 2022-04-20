import React from 'react'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import Web3 from "web3";

import { Button } from 'semantic-ui-react'

// Components and Context
import { useAppContext } from '../libs/contextLib'

// Libs
import { subscribeProvider, setCurrentState } from '../libs/web3'



export default () => {
  const {
    setWeb3,
    userAccount, setUserAccount,
    setChainId,
    setNetworkId
  } = useAppContext()

  const handlers = { setUserAccount, setChainId, setNetworkId }

  const buttonContent = userAccount ? userAccount : 'Connect'

  async function getWeb3Modal() {
    const web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: false,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: { 
            infuraId: process.env.INFURA_ID
          },
        },
      },
    })
    return web3Modal
  }
  
  async function connect() {
    try {
      const web3Modal = await getWeb3Modal()
      const provider = await web3Modal.connect()
      
      const web3Instance = new Web3(provider)
      setWeb3(web3Instance)

      await setCurrentState(provider, handlers)
      await subscribeProvider(provider, handlers)
    } catch (err) {
      console.log('error:', err)
    }
  }

  const handleClick = () => {
    connect()
  }


  return(
    <Button primary content={ buttonContent } onClick={ handleClick }/>
  )
}