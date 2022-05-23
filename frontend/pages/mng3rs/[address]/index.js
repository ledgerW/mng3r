// App
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// UI
import { Card, Grid, Button, Input } from 'semantic-ui-react'
import Layout from '../../../components/Layout'
import OfferForm from '../../../components/OfferForm'

// Components and Context
import { useAppContext } from '../../../libs/contextLib'

// Libs
import { useContract } from '../../../libs/contractLib'
import showAddress from '../../../libs/utils'

// ABI
import factoryDef from '../../../../build/contracts/MNG3RFactory.json'


const renderSummary = (summary) => {
  const {
    currentMNG3R,
    govAddress,
    mng3rFee,
    totalSupply,
    ethBalance
  } = summary

  let _govAddress
  try {
    _govAddress = govAddress[0].returnValues.gov
  } catch {
    _govAddress = null
  }

  const items = [{
    header: currentMNG3R ? showAddress(currentMNG3R) : currentMNG3R,
    meta: currentMNG3R,
    description: 'Current mng3r of this MNG3R',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: _govAddress ? showAddress(_govAddress) : _govAddress,
    meta: 'Address',
    description: 'Address of governor contract',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: mng3rFee,
    meta: 'Fee',
    description: 'Annual mng3r fee',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: totalSupply,
    meta: 'Supply',
    description: 'Circulating supply of tokens',
    style: { overflowWrap: 'break-word' }
  },
  {
    header: ethBalance,
    meta: 'ETH',
    description: 'ETH Balance',
    style: { overflowWrap: 'break-word' }
  }]

  return <Card.Group items={items} />
}


export default () => {
  const router = useRouter()
  const { address } = router.query
  const { web3, networkId, userAccount } = useAppContext()
  const [ethBalance, setEthBalance] = useState()
  const [firstBlock, setFirstBlock] = useState(0)

  const { data: currentMNG3R, error: err1, mutate: mut1 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'mng3r',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: totalSupply, error: err2, mutate: mut2 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'totalSupply',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: mng3rFee, error: err3, mutate: mut3 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'mng3rFee',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: govAddress, error: err4, mutate: mut4 } = useContract({
    web3: web3,
    def: 'factory',
    addressOrId: networkId,
    action: 'events',
    method: 'NewMNG3RGovernor',
    methParams: {
      filter: { coin: address },
      fromBlock: firstBlock,
      toBlock: 'latest'
    },
    how: null,
    howParams: null
  })

  useEffect(async () => {
    let _ethBalance = await web3.eth.getBalance(address)
    setEthBalance(web3.utils.fromWei(_ethBalance, 'ether'))

    let factoryTxHash = factoryDef.networks[networkId].transactionHash
    let txHash = await web3.eth.getTransaction(factoryTxHash)
    setFirstBlock(txHash.blockNumber)
  }, [])

  return (
    <Layout>
      <h3>MNG3R Show</h3>
      <Grid>
        <Grid.Row>
          <Grid.Column width={10}>
            {renderSummary({ currentMNG3R, govAddress, mng3rFee, totalSupply, ethBalance })}
          </Grid.Column>
          <Grid.Column width={6}>
            <OfferForm />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Link href={`/mng3rs/${address}/offers`}>
              <a>
                <Button
                  content="View Offers"
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