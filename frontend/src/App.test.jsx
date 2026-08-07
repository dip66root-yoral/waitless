import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

describe('App Component', () => {
  it('renders the WAITLESS logo in the navigation bar', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Check for the WAITLESS text in the nav
    const logoElement = screen.getByText(/WAITLESS/i)
    expect(logoElement).toBeInTheDocument()
  })
})
