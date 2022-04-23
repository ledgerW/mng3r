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


const renderMNG3Rs = (campaigns) => {
  const items = campaigns.map((address) => {
    return ({
      header: address,
      description: (
        <Link href={`/mng3rs/${encodeURIComponent(address)}`}>
          <a>View Campaign</a>
        </Link>
      ),
      meta: 'additional meta data',
      fluid: true
    })
  })

  return <Card.Group items={items} />
}


export default (props) => {
  const {
    web3,
    factory,
    userAccount, setUserAccount,
    chainId, setChainId,
    networkId, setNetworkId
  } = useAppContext()

  const { data: mng3rs, error, mutate } = useFactory({
    factory: factory,
    method: 'getDeployedMNG3Rs',
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
        <h3>{`${chainId} Active MNG3Rs`}</h3>
        <Link href='/mng3rs/new'>
          <a>
            <Button
              content="Create MNG3R"
              icon="add circle"
              floated="right"
              primary
            />
          </a>
        </Link>
        <h3>{userAccount}</h3>
        {mng3rs ? renderMNG3Rs(mng3rs) : ''}
      </div>
    </Layout>
  )
}