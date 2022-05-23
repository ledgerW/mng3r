// App
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// UI
import { Card, Grid } from 'semantic-ui-react'
import Layout from '../../../../components/Layout'
import CreateRequestForm from '../../../../components/CreateRequestForm'

// Components and Context
import { useAppContext } from '../../../../libs/contextLib'

// Libs
import { useMNG3R } from '../../../../libs/mng3rLib'


export default () => {
  const router = useRouter()
  const { address } = router.query
  const { userAccount } = useAppContext()

  useEffect(async () => {
  }, [])

  return (
    <Layout>
      <h3>Create a New Request</h3>
      <Grid>
        <Grid.Column width={6}>
          <CreateRequestForm userWallet={userAccount} campaignAddress={address} />
        </Grid.Column>
      </Grid>
    </Layout>
  )
}