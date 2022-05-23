// App
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// UI
import { Card, Grid, Button, Feed } from 'semantic-ui-react'
import Layout from '../../../../components/Layout'

// Components and Context
import { useAppContext } from '../../../../libs/contextLib'

// Libs
import { useContract } from '../../../../libs/contractLib'
import showAddress, { showTime } from '../../../../libs/utils'
import getContract from '../../../../libs/getContract'
import mng3rDef from '../../../../../build/contracts/MNG3R.json'


const renderOffers = (offers) => {
  console.log(offers)
  const cards = offers.map((offer, idx) => {
    return (<Card>
      <Card.Content>
        <Card.Header>ERC20 Offer By: {showAddress(offer.offerMaker)}</Card.Header>
        <Card.Meta>{`Offer Index: ${idx}`}</Card.Meta>
      </Card.Content>
      <Card.Content>
        <Feed>
          <Feed.Event
            icon='pencil'
            content={`Offered Asset: ${showAddress(offer.toMNG3RAsset)}`}
          />
          <Feed.Event
            icon='pencil'
            content={`Offered Amount: ${offer.toMNG3RAmtOrId}`}
          />
          <Feed.Event
            icon='pencil'
            content={`Requested Asset: ${showAddress(offer.fromMNG3RAsset)}`}
          />
          <Feed.Event
            icon='pencil'
            content={`Requested Amount: ${offer.fromMNG3RAmtOrId}`}
          />
          <Feed.Event
            icon='pencil'
            content={`Expires: ${showTime(offer.expirationTime)}`}
          />
        </Feed>
      </Card.Content>
      <Card.Content extra>
        <Button.Group>
          <Button positive>Accept</Button>
          <Button.Or />
          <Button negative>Return</Button>
        </Button.Group>
      </Card.Content>
    </Card>)
  })

  return cards
}


export default () => {
  const router = useRouter()
  const { address } = router.query

  const { web3, userAccount } = useAppContext()

  const [offers, setOffers] = useState([])

  const mng3r = getContract(web3, mng3rDef, address)

  const { data: numOffers, error: err1, mutate: mut1 } = useContract({
    web3: web3,
    def: 'mng3r',
    addressOrId: address,
    action: 'methods',
    method: 'getNumERC20Offers',
    methParams: [],
    how: 'call',
    howParams: null
  })

  useEffect(async () => {
    console.log(numOffers)

    let offers = []
    for (const n in Array.from(Array(numOffers).keys())) {
      let offer = await mng3r.methods.getERC20Offer(n).call()
      offers.push(offer)
    }

    setOffers(offers)
  }, [])

  return (
    <Layout>
      <h3>Offers</h3>
      <Grid>
        <Grid.Row>
          <Grid.Column width={6}>
            <Card.Group>
              {offers ? renderOffers(offers) : ''}
            </Card.Group>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  )
}