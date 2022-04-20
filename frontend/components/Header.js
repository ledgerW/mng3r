import React from 'react'
import Link from 'next/link'

import { Menu, Button } from 'semantic-ui-react'

import ConnectButton from './connectWalletButton'



export default () => {
  return(
    <Menu style={{ marginTop: "10px" }}>
      <Link href="/">
        <a className="item">CrowdCoin</a>
      </Link>
      
      <Menu.Menu position="right">
        
        <Link href="/">
          <a className="item">Campaigns</a>
        </Link>
        
        <Link href="/campaigns/new">
          <a className="item">+</a>
        </Link>

        <Menu.Item>
          <ConnectButton/>
        </Menu.Item>
      
      </Menu.Menu>
    </Menu>
  )
}