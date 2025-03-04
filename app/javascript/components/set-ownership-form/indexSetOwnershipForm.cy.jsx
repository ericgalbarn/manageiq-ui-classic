import React from 'react'
import SetOwnershipForm from './index'

describe('<SetOwnershipForm />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<SetOwnershipForm />)
  })
})