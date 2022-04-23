// App
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// UI
import { Card, Grid, Button } from 'semantic-ui-react'
import Layout from '../../../../components/Layout'
import ContributeForm from '../../../../components/ContributeForm'

// Components and Context
import { useAppContext } from '../../../../libs/contextLib'

// Libs
import { useMNG3R } from '../../../../libs/mng3rLib'


export default () => {
  const router = useRouter()
  const { address } = router.query

  return (
    <Layout>
      <h3>Requests</h3>
      <Link href={`/mng3r/${address}/requests/new`}>
        <a>
          <Button
            content="Create Request"
            primary
          />
        </a>
      </Link>
    </Layout>
  )
}