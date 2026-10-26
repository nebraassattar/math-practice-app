import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import {
  ACTIVE_SESSION_KEY,
  loadActiveSession,
} from '../services/activeSessionService'
import { loadData } from '../services/storageService'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function start(path = '/practice/setup') {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: ['/', path],
    initialIndex: 1,
  })
  return { router, ...render(<RouterProvider router={router} />) }
}
async function begin(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Start Session' }))
}
async function reveal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole(
      'button',
    )[0],
  )
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
}
describe('active session recovery and navigation', () => {
  it('restores the same session, question, selected answer and revealed side without duplicate attempts', async () => {
    const user = userEvent.setup()
    const view = start()
    await begin(user)
    await reveal(user)
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await reveal(user)
    const snapshot = loadActiveSession()!
    expect(snapshot.run.attempts).toHaveLength(1)
    expect(snapshot.revealed).toBe(true)
    view.unmount()
    start('/practice/session')
    expect(
      screen.getByRole('heading', { name: "Let's check your answer" }),
    ).toBeInTheDocument()
    expect(loadActiveSession()).toEqual(snapshot)
    expect(loadData().data.attempts).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(loadData().data.attempts).toHaveLength(2)
    expect(loadActiveSession()!.run.session.id).toBe(snapshot.run.session.id)
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument()
  })
  it('restores a selection before reveal and ignores corrupt recovery data', async () => {
    const user = userEvent.setup()
    const view = start()
    await begin(user)
    await user.keyboard('2')
    const snapshot = loadActiveSession()!
    view.unmount()
    start('/practice/session')
    expect(
      screen.getByRole('button', {
        name: `Answer ${snapshot.selectedAnswer}`,
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled()
    view.unmount()
    sessionStorage.setItem(ACTIVE_SESSION_KEY, '{broken')
    start('/practice/session')
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
  })
  it('cancels leaving, then ends and leaves without counting the unfinished answer', async () => {
    const user = userEvent.setup()
    const { router } = start()
    await begin(user)
    const before = loadActiveSession()!
    await user.click(screen.getByRole('link', { name: 'Statistics' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(router.state.location.pathname).toBe('/practice/session')
    expect(loadActiveSession()!.run.question.id).toBe(before.run.question.id)
    await user.click(screen.getByRole('link', { name: 'Statistics' }))
    await user.click(screen.getByRole('button', { name: 'End and Leave' }))
    expect(
      screen.getByRole('heading', { name: 'Statistics' }),
    ).toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
    expect(loadData().data.sessions[0].completedAt).toBeDefined()
    expect(loadData().data.attempts).toHaveLength(0)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(false)
  })
  it('protects browser Back and document unload, and stops warning after completion', async () => {
    const user = userEvent.setup()
    const view = start()
    await begin(user)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    await view.router.navigate(-1)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: true, cancelable: true }),
    )
    for (let i = 0; i < 10; i++) {
      await reveal(user)
      await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    }
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
    expect(loadData().data.attempts).toHaveLength(10)
  }, 15000)
  it('continues practicing when recovery storage cannot be written', async () => {
    const user = userEvent.setup()
    const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      function (key, value) {
        if (key === ACTIVE_SESSION_KEY) throw new Error('full')
        original.call(this, key, value)
      },
    )
    start()
    await begin(user)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'cannot save your current question',
    )
    await reveal(user)
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(loadData().data.attempts).toHaveLength(1)
  })
})
