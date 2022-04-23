import React from 'react'
import Link from 'next/link'

import { Menu, Button } from 'semantic-ui-react'

import ConnectButton from './connectWalletButton'



export default () => {
  return (
    <Menu style={{ marginTop: "10px" }}>
      <Link href="/">
        <a className="item">MNG3R</a>
      </Link>

      <Menu.Menu position="right">

        <Link href="/">
          <a className="item">Active MNG3Rs</a>
        </Link>

        <Link href="/mng3rs/new">
          <a className="item">+</a>
        </Link>

        <Menu.Item>
          <ConnectButton />
        </Menu.Item>

      </Menu.Menu>
    </Menu>
  )
}