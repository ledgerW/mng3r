// App
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// UI
import { Card, Grid, Button, Form, Message } from 'semantic-ui-react'
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
    symbol,
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
    header: symbol,
    meta: 'Symbol',
    style: { overflowWrap: 'break-word' },
    key: symbol
  },
  {
    header: currentMNG3R ? showAddress(currentMNG3R) : currentMNG3R,
    meta: 'Current mng3r of this MNG3R',
    style: { overflowWrap: 'break-word' },
    key: currentMNG3R
  },
  {
    header: _govAddress ? showAddress(_govAddress) : _govAddress,
    meta: 'Address of governor contract',
    style: { overflowWrap: 'break-word' },
    key: _govAddress
  },
  {
    header: mng3rFee,
    meta: 'Annual mng3r fee',
    style: { overflowWrap: 'break-word' },
    key: mng3rFee
  },
  {
    header: totalSupply,
    meta: 'Circulating supply of tokens',
    style: { overflowWrap: 'break-word' },
    key: totalSupply
  },
  {
    header: ethBalance,
    meta: 'ETH Balance',
    style: { overflowWrap: 'break-word' },
    key: ethBalance
  }]

  return <Card.Group items={items} />
}


export default () => {
  const router = useRouter()
  const { address } = router.query
  const { web3, networkId, userAccount } = useAppContext()
  const [ethBalance, setEthBalance] = useState()
  const [firstBlock, setFirstBlock] = useState(0)

  const { data: name, error: err1, mutate: mut1 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'name',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: symbol, error: err2, mutate: mut2 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'symbol',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: currentMNG3R, error: err3, mutate: mut3 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'mng3r',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: totalSupply, error: err4, mutate: mut4 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'totalSupply',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: mng3rFee, error: err5, mutate: mut5 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'mng3rFee',
    methParams: [],
    how: 'call',
    howParams: null
  })

  const { data: govAddress, error: err6, mutate: mut6 } = useContract({
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
      <Grid>
        <Grid.Row>
          <Grid.Column width={9}>
            <Form>
              <h3>{name}</h3>
              {renderSummary({
                symbol, currentMNG3R, govAddress, mng3rFee, totalSupply, ethBalance
              })}
              <h3>
                <Link href={`/mng3rs/${address}/offers`}>
                  <a>
                    <Button
                      content="View Offers"
                      primary
                    />
                  </a>
                </Link>
              </h3>
            </Form>
          </Grid.Column>
          <Grid.Column width={7}>
            <OfferForm />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  )
}