import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import type { PracticeConfiguration } from '../types/practiceConfiguration'
import {
  createPracticeRun,
  finishRun,
  toSessionResult,
} from '../services/practiceSession'

const config: PracticeConfiguration = {
  operations: ['addition', 'division'],
  difficulty: 1,
  sessionLength: 5,
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>
}
function renderSession(
  configuration: unknown = config,
  path = '/practice/session',
) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state: configuration }]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}
async function answer(
  user: ReturnType<typeof userEvent.setup>,
  correct: boolean,
) {
  const choices = within(
    screen.getByRole('group', { name: 'Answer choices' }),
  ).getAllByRole('button')
  await user.click(choices[0])
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', {
      name: correct ? 'I Got It Right' : 'I Got It Wrong',
    }),
  )
}
function summaryValue(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling
    ?.textContent
}

describe('practice flow', () => {
  it('completes a mixed session, updates progress, displays the summary, and starts again', async () => {
    const user = userEvent.setup()
    renderSession()
    for (let index = 0; index < 5; index++) {
      expect(screen.getByText(`Question ${index + 1} of 5`)).toBeInTheDocument()
      expect(
        screen.getByRole('progressbar', { name: 'Completed questions' }),
      ).toHaveAttribute('value', String(index))
      expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
      await answer(user, index < 3)
    }
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/practice/summary',
    )
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toHaveFocus()
    expect(summaryValue('Questions attempted')).toBe('5')
    expect(summaryValue('Correct answers')).toBe('3')
    expect(summaryValue('Incorrect answers')).toBe('2')
    expect(summaryValue('Accuracy')).toBe('60%')
    expect(summaryValue('Operations practiced')).toBe('Addition, Division')
    expect(summaryValue('Difficulty')).toBe('Beginner')
    expect(summaryValue('Mistake-review questions')).toBe('0')
    expect(
      screen.getByRole('link', { name: 'Practice Mistakes' }),
    ).toHaveAttribute('href', '/practice/setup')
    expect(
      screen.getByRole('link', { name: 'Change Settings' }),
    ).toHaveAttribute('href', '/practice/setup')
    expect(
      screen.getByRole('link', { name: 'View Statistics' }),
    ).toHaveAttribute('href', '/statistics')
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute(
      'href',
      '/',
    )
    await user.click(screen.getByRole('link', { name: 'Practice Again' }))
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  }, 15000)

  it('keeps continuous practice running until End Session, supports cancel, and omits fixed progress', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderSession({ ...config, sessionLength: 'continuous' })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await answer(user, false)
    expect(
      screen.getByText('Question 2 · Continuous practice'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(confirm).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Question 2 · Continuous practice'),
    ).toBeInTheDocument()
    confirm.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(summaryValue('Questions attempted')).toBe('1')
    expect(summaryValue('Incorrect answers')).toBe('1')
    expect(summaryValue('Accuracy')).toBe('0%')
  })

  it('allows animations to be disabled and ends an empty session without counting an unfinished answer', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderSession()
    const animations = screen.getByRole('checkbox', {
      name: 'Animate card flips',
    })
    expect(animations).toBeChecked()
    await user.click(animations)
    expect(animations).not.toBeChecked()
    expect(
      screen.getByRole('region', { name: 'Question card' }),
    ).not.toHaveClass('animate-card')
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(summaryValue('Questions attempted')).toBe('0')
    expect(summaryValue('Accuracy')).toBe('0%')
  })

  it.each([null, {}, { configuration: config, session: {}, attempts: [] }])(
    'redirects invalid summary state: %j',
    (state) => {
      renderSession(state, '/practice/summary')
      expect(
        screen.getByRole('heading', { name: 'Practice Setup' }),
      ).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/practice/setup',
      )
    },
  )

  it('navigates from a valid summary to setup and home', async () => {
    const user = userEvent.setup()
    const result = toSessionResult(finishRun(createPracticeRun(config)))
    renderSession(result, '/practice/summary')
    await user.click(screen.getByRole('link', { name: 'Change Settings' }))
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Home',
      }),
    )
    expect(
      screen.getByRole('heading', { name: 'Welcome, math explorer!' }),
    ).toBeInTheDocument()
  })
})
