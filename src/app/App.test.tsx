import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'

afterEach(cleanup)

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders the application title and welcome heading', () => {
    renderApp()
    expect(
      screen.getByRole('link', { name: 'Math Practice App' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Welcome, math explorer!',
      }),
    ).toBeInTheDocument()
  })

  it.each([
    ['Start Practice', '/practice/setup', 'Practice Setup'],
    ['View Statistics', '/statistics', 'Statistics'],
    ['Settings', '/settings', 'Settings'],
  ])('navigates from the home %s link', async (name, path, heading) => {
    const user = userEvent.setup()
    renderApp()
    const link = within(screen.getByRole('main')).getByRole('link', { name })
    expect(link).toHaveAttribute('href', path)
    await user.click(link)
    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Coming soon/)).toBeInTheDocument()
  })

  it.each([
    ['/practice/setup', 'Practice Setup'],
    ['/practice/session', 'Practice Session'],
    ['/practice/summary', 'Session Summary'],
    ['/statistics', 'Statistics'],
    ['/settings', 'Settings'],
  ])('supports direct navigation to %s', (path, heading) => {
    renderApp(path)
    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
  })

  it('shows an unknown-route fallback and returns home', async () => {
    const user = userEvent.setup()
    renderApp('/unknown/page')
    expect(
      screen.getByRole('heading', { name: "Let's find our way home" }),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Return Home' })
    expect(link).toHaveAttribute('href', '/')
    await user.click(link)
    expect(
      screen.getByRole('heading', { name: 'Welcome, math explorer!' }),
    ).toBeInTheDocument()
  })

  it('supports keyboard navigation and identifies the current page', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    await user.tab()
    expect(
      screen.getByRole('link', { name: 'Math Practice App' }),
    ).toHaveFocus()
    await user.tab()
    const navigation = within(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    )
    expect(navigation.getByRole('link', { name: 'Home' })).toHaveFocus()
    expect(navigation.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.tab()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
  })
})
