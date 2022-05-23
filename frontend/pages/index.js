// App
import React, { useEffect } from 'react'
import Link from 'next/link'

// UI
import { Grid, Card, Button } from 'semantic-ui-react'
import Layout from "../components/Layout"

// Components and Context
import { useAppContext } from '../libs/contextLib'

// Libs
import { useContract } from '../libs/contractLib'
import showAddress from '../libs/utils'


const renderMNG3Rs = (mng3rs) => {
  const items = mng3rs.map((address) => {
    return ({
      header: showAddress(address),
      description: (
        <Link href={`/mng3rs/${encodeURIComponent(address)}`}>
          <a>View MNG3R</a>
        </Link>
      ),
      meta: 'MNG3R Name',
      fluid: true
    })
  })

  return <Card.Group items={items} />
}

const renderGovs = (govs) => {
  const items = govs.map((address) => {
    return ({
      header: showAddress(address),
      description: (
        <Link href=''>
          <a>Governor Contract</a>
        </Link>
      ),
      meta: 'Additional meta data',
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

  const { data: mng3rs, error: err1, mutate: mut1 } = useContract({
    web3: web3,
    def: 'factory',
    addressOrId: networkId,
    action: 'methods',
    method: 'getDeployedMNG3Rs',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: govs, error: err2, mutate: mut2 } = useContract({
    web3: web3,
    def: 'factory',
    addressOrId: networkId,
    action: 'methods',
    method: 'getDeployedGovs',
    methParams: [],
    how: 'call',
    howParams: null
  })

  useEffect(async () => {
    mut1()
    mut2()
  }, [])


  return (
    <Layout>
      <div>
        <h3>{`Chain ID: ${chainId}`}</h3>
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
        <Grid>
          <Grid.Row>
            <Grid.Column width={6}>
              {mng3rs ? renderMNG3Rs(mng3rs) : ''}
            </Grid.Column>
            <Grid.Column width={6}>
              {govs ? renderGovs(govs) : ''}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    </Layout>
  )
}