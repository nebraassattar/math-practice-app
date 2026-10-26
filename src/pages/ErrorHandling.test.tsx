import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { createPracticeRun, recordResult } from '../services/practiceSession'
import { DATA_KEY, emptyData, loadData } from '../services/storageService'
import { generateSimilarQuestion } from '../services/similarQuestionGenerator'
import { isValidGeneratedQuestion } from '../services/questionRules'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function sample() {
  const start = createPracticeRun({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
  })
  const run = recordResult(
    start,
    start.question.id,
    start.question.choices[0],
    false,
  )
  return {
    ...emptyData(),
    sessions: [run.session],
    attempts: run.attempts,
    mistakePatterns: run.reviewPatterns,
  }
}
describe('error recovery', () => {
  it.each(['settings', 'sessions', 'attempts', 'mistakePatterns'] as const)(
    'repairs only invalid %s while retaining the other categories and raw saved data',
    (category) => {
      const valid = sample()
      const broken = { ...valid, [category]: null }
      const raw = JSON.stringify(broken)
      localStorage.setItem(DATA_KEY, raw)
      const loaded = loadData()
      for (const key of [
        'settings',
        'sessions',
        'attempts',
        'mistakePatterns',
      ] as const) {
        expect(loaded.data[key]).toEqual(
          key === category ? emptyData()[key] : valid[key],
        )
      }
      expect(loaded.warning).toBeTruthy()
      expect(loaded.warning?.includes('settings were restored')).toBe(
        category === 'settings',
      )
      expect(localStorage.getItem(DATA_KEY)).toBe(raw)
    },
  )
  it.each(['/practice/session', '/practice/summary'])(
    'explains unavailable data at %s and offers a working home link',
    async (path) => {
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      )
      expect(
        screen.getByRole('heading', { name: 'Practice Setup' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('We could not find')
      await user.click(screen.getByRole('link', { name: 'Return Home' }))
      expect(
        screen.getByRole('heading', { name: 'Welcome, math explorer!' }),
      ).toBeInTheDocument()
    },
  )
  it('catches unexpected page failures, hides technical details, and recovers on navigation', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const data = sample()
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    function BrokenPage(): never {
      throw new Error('PRIVATE_STACK_DETAIL')
    }
    function Routes() {
      const location = useLocation()
      return (
        <ErrorBoundary resetKey={location.key}>
          {location.pathname === '/' ? <h1>Home recovered</h1> : <BrokenPage />}
        </ErrorBoundary>
      )
    }
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This page could not be opened',
    )
    expect(screen.queryByText(/PRIVATE_STACK_DETAIL/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Return Home' }))
    expect(
      screen.getByRole('heading', { name: 'Home recovered' }),
    ).toBeInTheDocument()
    expect(loadData().data).toEqual(data)
  })
  it('bounds review-generation retries and falls back to a valid related fact with the original pattern ID', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const pattern = sample().mistakePatterns[0]
    const random = vi.fn(() => {
      throw new Error('random failed')
    })
    const question = generateSimilarQuestion(
      pattern,
      ['addition'],
      undefined,
      random,
    )
    expect(random).toHaveBeenCalledTimes(3)
    expect(isValidGeneratedQuestion(question)).toBe(true)
    expect(question.source).toBe('mistake-review')
    expect(question.mistakePatternId).toBe(pattern.id)
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('retries exhausted'),
      undefined,
    )
  })
})
