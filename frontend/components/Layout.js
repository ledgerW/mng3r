import React from 'react'

import { Container } from 'semantic-ui-react'
import Header from './Header'


export default (props) => {
  return(
    <div>
      <Header/>
        <Container>
          { props.children }
        </Container>
    </div>
  )
}