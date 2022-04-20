// App
import { React, useState, useEffect} from 'react'
import { useRouter } from 'next/router'

// Components and Context
import { useAppContext } from '../../libs/contextLib'

// UI
import { Button, Form, Input, Message } from 'semantic-ui-react'
import Layout from '../../components/Layout'


export default () => {
  const {
    web3,
    factory,
    userAccount, setUserAccount,
    chainId, setChainId,
    networkId, setNetworkId
  } = useAppContext()
  console.log(userAccount)
  console.log(factory)
  
  const router = useRouter()
  const [minContribution, setMinContribution] = useState(0)
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  
  const onSubmit = async (e) => {
    e.preventDefault()

    setIsWaiting(true)
    try {
      await factory.methods.createCampaign(minContribution)
        .send({
          from: userAccount,
          gasPrice: 22000
        })

      router.push('/')
    } catch (err) {
      setErrorMessage(err.message)
    }
    setIsWaiting(false)
  }

  
  return(
    <Layout>
      <h3>Create A Campaign</h3>

      <Form onSubmit={onSubmit} error={ !!errorMessage }>
        <Form.Field>
          <Input
            label="wei"
            labelPosition="right"
            value={ minContribution }
            onChange={ e => { setMinContribution(e.target.value) }}
          />
        </Form.Field>

        <Message
          error
          header="Oops!"
          content={ errorMessage }
        />
        <Button primary type="submit" loading={ isWaiting }>Create</Button>
      </Form>
    </Layout>
  )
}