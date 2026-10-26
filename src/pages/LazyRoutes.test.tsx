import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../app/App'

vi.unmock('../app/secondaryPages')
afterEach(cleanup)
it('loads real split pages on navigation and keeps heading focus and page titles', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )
  await user.click(screen.getByRole('link', { name: 'View Statistics' }))
  const heading = await screen.findByRole('heading', {
    name: 'Statistics',
    level: 1,
  })
  expect(heading).toHaveFocus()
  expect(document.title).toBe('Statistics | Math Practice App')
  await user.click(screen.getByRole('link', { name: 'Settings' }))
  expect(
    await screen.findByRole('heading', { name: 'Settings', level: 1 }),
  ).toHaveFocus()
  expect(document.title).toBe('Settings | Math Practice App')
})
