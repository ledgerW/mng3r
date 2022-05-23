// App
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// UI
import { Button, Form, Input, Message } from 'semantic-ui-react'

// Components and Context
import { useAppContext } from '../libs/contextLib'

// Libs
import getContract from '../libs/getContract'
import mng3rDef from '../../build/contracts/MNG3R.json'
import IERC20Def from '../../build/contracts/IERC20.json'


const assetPayType = {
  ERC20: 0,
  ERC721: 1,
  ERC1155: 2
}


export default (props) => {
  const router = useRouter()
  const { address } = router.query

  const { web3, userAccount } = useAppContext()

  const [toMNG3RAsset, setToMNG3RAsset] = useState('')
  const [toMNG3RAmtOrId, setToMNG3RAmtOrId] = useState(0)
  const [toMNG3R1155Amt, setToMNG3R1155Amt] = useState(0)
  const [fromMNG3RAsset, setFromMNG3RAsset] = useState('')
  const [fromMNG3RAmtOrId, setFromMNG3RAmtOrId] = useState(0)
  const [fromMNG3R1155Amt, setFromMNG3R1155Amt] = useState(0)
  const [expiresInSeconds, setExpiresInSeconds] = useState(0)

  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const mng3r = getContract(web3, mng3rDef, address)


  const onSubmit = async (e) => {
    e.preventDefault()

    setIsWaiting(true)

    const IERC20 = getContract(web3, IERC20Def, toMNG3RAsset)

    try {
      await IERC20.methods.approve(
        address,
        toMNG3RAmtOrId
      )
        .send({
          from: userAccount
        })

      await mng3r.methods.offerERC20ToFund(
        toMNG3RAsset,
        [toMNG3RAmtOrId],
        assetPayType.ERC20,
        fromMNG3RAsset,
        [fromMNG3RAmtOrId],
        [0],
        expiresInSeconds,
      )
        .send({
          from: userAccount
        })

      //router.push('/')
    } catch (err) {
      setErrorMessage(err.message)
    }
    setIsWaiting(false)
  }


  return (
    <Form onSubmit={onSubmit} error={!!errorMessage}>
      <h3>Make an Offer</h3>
      <Form.Field>
        <label>Offer Asset</label>
        <Input
          label="Address"
          labelPosition="right"
          placeholder='Ox123...XYZ'
          value={toMNG3RAsset}
          onChange={e => { setToMNG3RAsset(e.target.value) }}
        />
      </Form.Field>
      <Form.Field>
        <label>Offer Amount</label>
        <Input
          label="Qty"
          labelPosition="right"
          value={toMNG3RAmtOrId}
          onChange={e => { setToMNG3RAmtOrId(e.target.value) }}
        />
      </Form.Field>
      <Form.Field>
        <label>Receive Asset</label>
        <Input
          label="Address"
          labelPosition="right"
          placeholder='Ox123...XYZ'
          value={fromMNG3RAsset}
          onChange={e => { setFromMNG3RAsset(e.target.value) }}
        />
      </Form.Field>
      <Form.Field>
        <label>Receive Amount</label>
        <Input
          label="Qty"
          labelPosition="right"
          value={fromMNG3RAmtOrId}
          onChange={e => { setFromMNG3RAmtOrId(e.target.value) }}
        />
      </Form.Field>
      <Form.Field>
        <label>Expiration</label>
        <Input
          label="Seconds"
          labelPosition="right"
          value={expiresInSeconds}
          onChange={e => { setExpiresInSeconds(e.target.value) }}
        />
      </Form.Field>

      <Message
        error
        header="Oops!"
        content={errorMessage}
      />
      <Button primary type="submit" loading={isWaiting}>Make Offer</Button>
    </Form>
  )
}