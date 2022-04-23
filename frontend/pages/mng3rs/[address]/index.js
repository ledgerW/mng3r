// App
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// UI
import { Card, Grid, Button } from 'semantic-ui-react'
import Layout from '../../../components/Layout'
import ContributeForm from '../../../components/ContributeForm'

// Components and Context
import { useAppContext } from '../../../libs/contextLib'

// Libs
import { useMNG3R } from '../../../libs/mng3rLib'


const renderSummary = (web3, summary) => {
  const items = [{
    header: summary.manager,
    meta: 'Manager',
    description: 'Address that created this campaign',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: summary.minContribution,
    meta: 'Minimum Contribution (wei)',
    description: 'Minimum amount to contribute',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: summary.numApprovers,
    meta: 'Number of Approvers',
    description: 'Number of addresses that have contributed',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: summary.numRequests,
    meta: 'Number of Requests',
    description: 'Number of pending requests to spend money',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: web3.utils.fromWei(summary.balance, 'ether'),
    meta: 'Balance (ETH)',
    description: 'Amount of ETH contributed to this campaign',
    style: { overflowWrap: 'break-word' }
  }]

  return <Card.Group items={items} />
}


export default () => {
  const router = useRouter()
  const { address } = router.query
  const { web3, userAccount } = useAppContext()

  /*
  const { data: summary, error, mutate } = useMNG3R({
    web3: web3,
    address: address,
    method: 'getSummary',
    methParams: [],
    how: 'call',
    howParams: null
  })
  */

  useEffect(async () => {
    //const accounts = await web3.eth.getAccounts()
    //setUserWallet(accounts[0])
  }, [])

  //if (error) return <div>failed to load</div>
  if (!summary) return <div>loading...</div>

  return (
    <Layout>
      <h3>Campaign Show</h3>
      <Grid>
        <Grid.Row>
          <Grid.Column width={10}>
            { /*renderSummary(web3, summary)*/}
          </Grid.Column>
          <Grid.Column width={6}>
            <ContributeForm />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Link href={`/mng3rs/${address}/requests`}>
              <a>
                <Button
                  content="View Requests"
                  primary
                />
              </a>
            </Link>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  )
}