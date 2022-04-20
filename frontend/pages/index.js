// App
import React, { useEffect } from 'react'
import Link from 'next/link'

// UI
import { Card, Button } from 'semantic-ui-react'
import Layout from "../components/Layout"

// Components and Context
import { useAppContext } from '../libs/contextLib'

// Libs
import { useFactory } from '../libs/factoryLib'


const renderCampaigns = (campaigns) => {
  const items = campaigns.map((address) => {
    return ({
      header: address,
      description: (
        <Link href={`/campaigns/${encodeURIComponent(address)}`}>
          <a>View Campaign</a>
        </Link>
      ),
      meta: 'additional meta data',
      fluid: true
    })
  })

  return <Card.Group items={ items } />
}


export default (props) => {
  const {
    web3,
    factory,
    userAccount, setUserAccount,
    chainId, setChainId,
    networkId, setNetworkId
  } = useAppContext()

  const { data: campaigns, error, mutate } = useFactory({
    factory: factory,
    method: 'getDeployedCampaigns',
    methParams: [],
    how: 'call',
    howParams: null
  })

  useEffect(async () => {
    mutate()
  }, [])


  return (
    <Layout>
      <div>
        <h3>{`${chainId} Open Campaigns`}</h3>
        <Link href='/campaigns/new'>
          <a>
            <Button
              content="Create Campaign"
              icon="add circle"
              floated="right"
              primary
            />
          </a>
        </Link>
        <h3>{ userAccount }</h3>
        { campaigns ? renderCampaigns(campaigns) : ''}
      </div>
    </Layout>
  )
}