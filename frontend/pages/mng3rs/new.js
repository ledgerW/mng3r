// App
import { React, useState, useEffect } from 'react'
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

  const router = useRouter()
  const [mng3rName, setMNG3RName] = useState('My MNG3R Token Name')
  const [mng3rSymbol, setMNG3RSymbol] = useState('MMTS')
  const [initialSupply, setInitialSupply] = useState(0)
  const [initialVoteDelay, setInitialVoteDelay] = useState(1)
  const [initialVotePeriod, setInitialVotePeriod] = useState(100)
  const [initialVoteThreshold, setInitialVoteThreshold] = useState(1)
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)


  const onSubmit = async (e) => {
    e.preventDefault()

    setIsWaiting(true)
    try {
      await factory.methods.createNewMNG3R(
        mng3rName,
        mng3rSymbol,
        initialSupply,
        initialVoteDelay,
        initialVotePeriod,
        initialVoteThreshold
      )
        .send({
          from: userAccount
        })

      router.push('/')
    } catch (err) {
      setErrorMessage(err.message)
    }
    setIsWaiting(false)
  }


  return (
    <Layout>
      <h3>Create A MNG3R</h3>

      <Form onSubmit={onSubmit} error={!!errorMessage}>
        <Form.Field>
          <Input
            label="MNG3R Name"
            labelPosition="left"
            value={mng3rName}
            onChange={e => { setMNG3RName(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <Input
            label="MNG3R Symbol"
            labelPosition="left"
            value={mng3rSymbol}
            onChange={e => { setMNG3RSymbol(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <Input
            label="Initial Token Supply"
            labelPosition="left"
            value={initialSupply}
            onChange={e => { setInitialSupply(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <Input
            label="Initial Vote Delay"
            labelPosition="left"
            value={initialVoteDelay}
            onChange={e => { setInitialVoteDelay(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <Input
            label="Initial Vote Period"
            labelPosition="left"
            value={initialVotePeriod}
            onChange={e => { setInitialVotePeriod(e.target.value) }}
          />
        </Form.Field>
        <Form.Field>
          <Input
            label="Initial Vote Threshold"
            labelPosition="left"
            value={initialVoteThreshold}
            onChange={e => { setInitialVoteThreshold(e.target.value) }}
          />
        </Form.Field>

        <Message
          error
          header="Oops!"
          content={errorMessage}
        />
        <Button primary type="submit" loading={isWaiting}>Create</Button>
      </Form>
    </Layout>
  )
}