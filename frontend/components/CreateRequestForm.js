// App
import React, { useState } from 'react'
import { useRouter } from 'next/router'

// Components and Context
import { useAppContext } from '../libs/contextLib'

// UI
import { Button, Form, Input, Message } from 'semantic-ui-react'

// Libs
import campaignDefinition from '../../build/contracts/Campaign.json'


export default (props) => {
  const { web3, userAccount } = useAppContext()

  const [description, setDescription] = useState('to buy supplies, etc...')
  const [amount, setAmount] = useState(0)
  const [recipient, setRecipient] = useState('0x...')
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const { campaignAddress } = props
  const campaign = await getContract(web3, campaignDefinition, campaignAddress)


  const onSubmit = async (e) => {
    e.preventDefault()

    setIsWaiting(true)
    try {
      await campaign.methods.createRequest(description, web3.utils.toWei(amount, 'ether'), recipient)
        .send({
          from: userAccount
        })
    } catch (err) {
      setErrorMessage(err.message)
    }
    setIsWaiting(false)
  }

  
  return(
      <Form onSubmit={onSubmit} error={ !!errorMessage }>
        <Form.Field>
          <label>Description</label>
          <Input
            value={ description }
            onChange={ e => { setDescription(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <label>Amount</label>
          <Input
            label="ether"
            labelPosition="right"
            value={ amount }
            onChange={ e => { setAmount(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <label>Recipient</label>
          <Input
            value={ recipient }
            onChange={ e => { setRecipient(e.target.value) }}
          />
        </Form.Field>

        <Message
          error
          header="Oops!"
          content={ errorMessage }
        />
        <Button primary type="submit" loading={ isWaiting }>Create Request</Button>
      </Form>
  )
}