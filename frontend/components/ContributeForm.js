// App
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// UI
import { Button, Form, Input, Message } from 'semantic-ui-react'

// Components and Context
import { useAppContext } from '../libs/contextLib'

// Libs
import getContract from '../libs/getContract'
import campaignDefinition from '../../build/contracts/Campaign.json'


export default (props) => {
  const router = useRouter()
  const { address } = router.query

  const { web3, userAccount } = useAppContext()

  const [contribution, setContribution] = useState(0)
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const campaign = getContract(web3, campaignDefinition, null, address)


  const onSubmit = async (e) => {
    e.preventDefault()

    setIsWaiting(true)
    try {
      await campaign.methods.contribute()
        .send({
          from: userAccount,
          value: web3.utils.toWei(contribution, 'ether')
        })

      //router.push('/')
    } catch (err) {
      setErrorMessage(err.message)
    }
    setIsWaiting(false)
  }

  
  return(
      <Form onSubmit={onSubmit} error={ !!errorMessage }>
        <h3>Amount to Contribute</h3>
        <Form.Field>
          <Input
            label="ether"
            labelPosition="right"
            value={ contribution }
            onChange={ e => { setContribution(e.target.value) }}
          />
        </Form.Field>

        <Message
          error
          header="Oops!"
          content={ errorMessage }
        />
        <Button primary type="submit" loading={ isWaiting }>Contribute</Button>
      </Form>
  )
}