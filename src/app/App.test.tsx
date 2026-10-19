import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('renders the Math Practice App heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Math Practice App' }),
    ).toBeInTheDocument()
  })
})
