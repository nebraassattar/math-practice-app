import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import { emptyData, loadData, saveData } from '../services/storageService'
import { makeQuestion } from '../services/questionGenerator'
import { updateMistakePatterns } from '../services/mistakeService'
import type { PracticeAttempt } from '../types/session'

function renderPage(path = '/practice/setup', state: unknown = null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <App />
    </MemoryRouter>,
  )
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
async function answer(
  user: ReturnType<typeof userEvent.setup>,
  correct: boolean,
) {
  await user.click(
    within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole(
      'button',
    )[0],
  )
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', {
      name: correct ? 'I Got It Right' : 'I Got It Wrong',
    }),
  )
}
function seedPattern() {
  const question = makeQuestion('addition', 1, 3, 2)
  const attempt: PracticeAttempt = {
    id: 'original-attempt',
    questionId: question.id,
    sessionId: 'previous-session',
    operation: 'addition',
    firstOperand: 3,
    secondOperand: 2,
    correctAnswer: 5,
    selectedAnswer: 4,
    selfReportedCorrect: false,
    difficulty: 1,
    source: 'regular',
    attemptedAt: '2026-10-26T12:00:00.000Z',
  }
  const patterns = updateMistakePatterns([], attempt)
  saveData({ ...emptyData(), attempts: [attempt], mistakePatterns: patterns })
  return patterns[0]
}
function definition(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling
    ?.textContent
}

describe('personalized review flow', () => {
  it('disables review without active mistakes and blocks stale direct review URLs', () => {
    const view = renderPage()
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeDisabled()
    expect(screen.getByText(/0 active mistake patterns/)).toBeInTheDocument()
    view.unmount()
    renderPage('/practice/session', {
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      mode: 'mistake-review',
    })
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
  })
  it('creates a mistake from real practice, enables review, persists mastery, and finishes a review early', async () => {
    const user = userEvent.setup()
    vi.spyOn(Math, 'random').mockReturnValue(0.25)
    const view = renderPage('/practice/session', {
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
    })
    for (let index = 0; index < 5; index++) await answer(user, index !== 0)
    expect(loadData().data.mistakePatterns).toHaveLength(1)
    const original = loadData().data.mistakePatterns[0]
    expect(original.incorrectCount).toBe(1)
    await user.click(screen.getByRole('link', { name: 'Practice Mistakes' }))
    expect(screen.getByRole('radio', { name: 'Mistake review' })).toBeChecked()
    expect(screen.getByText(/1 active pattern matches/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    expect(
      screen.getByText(/Mistake review · 1 active pattern/),
    ).toBeInTheDocument()
    for (let index = 0; index < 3; index++) await answer(user, true)
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toBeInTheDocument()
    expect(definition('Questions attempted')).toBe('3')
    expect(definition('Mistake-review questions')).toBe('3')
    expect(definition('Accuracy')).toBe('100%')
    expect(
      screen.getByRole('button', { name: 'Practice Again' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Practice Mistakes' }),
    ).toBeDisabled()
    expect(loadData().data.mistakePatterns[0]).toMatchObject({
      id: original.id,
      similarCorrectCount: 3,
      mastered: true,
    })
    expect(
      loadData()
        .data.attempts.filter((attempt) => attempt.source === 'mistake-review')
        .every((attempt) => attempt.mistakePatternId === original.id),
    ).toBe(true)
    view.unmount()
    renderPage('/statistics')
    expect(definition('Active mistake patterns')).toBe('0')
    expect(definition('Mastered patterns')).toBe('1')
    expect(definition('Similar questions practiced')).toBe('3')
    expect(definition('Review questions correct')).toBe('3')
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Practice',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await answer(user, false)
    expect(loadData().data.mistakePatterns).toHaveLength(1)
    expect(loadData().data.mistakePatterns[0]).toMatchObject({
      id: original.id,
      mastered: false,
      similarCorrectCount: 0,
      incorrectCount: 2,
    })
  }, 15000)
  it('explains nonmatching review choices and allows switching back to regular practice', async () => {
    const user = userEvent.setup()
    seedPattern()
    renderPage('/practice/setup', {
      operations: ['division'],
      difficulty: 2,
      sessionLength: 5,
      mode: 'mistake-review',
    })
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'No active mistakes match',
    )
    await user.click(screen.getByRole('radio', { name: 'Regular practice' }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })
  it('resets review progress after a review miss without creating a duplicate pattern', async () => {
    const user = userEvent.setup()
    const original = seedPattern()
    renderPage('/practice/session', {
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      mode: 'mistake-review',
    })
    await answer(user, true)
    expect(loadData().data.mistakePatterns[0].similarCorrectCount).toBe(1)
    await answer(user, false)
    expect(loadData().data.mistakePatterns).toHaveLength(1)
    expect(loadData().data.mistakePatterns[0]).toMatchObject({
      id: original.id,
      similarCorrectCount: 0,
      incorrectCount: 2,
      mastered: false,
    })
  })
  it('saves a new mastery goal, updates mastered state, and clears patterns with statistics reset', async () => {
    const user = userEvent.setup()
    const original = seedPattern()
    const data = loadData().data
    saveData({
      ...data,
      mistakePatterns: [{ ...original, similarCorrectCount: 2 }],
    })
    renderPage('/settings')
    const threshold = screen.getByRole('spinbutton', {
      name: 'Correct related answers required for mastery',
    })
    await user.clear(threshold)
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
    await user.type(threshold, '2')
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(loadData().data.settings.masteryThreshold).toBe(2)
    expect(loadData().data.mistakePatterns[0].mastered).toBe(true)
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Statistics',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(
      screen.getByRole('button', { name: 'Erase Practice History' }),
    )
    expect(loadData().data.mistakePatterns).toEqual([])
    expect(loadData().data.settings.masteryThreshold).toBe(2)
  })
  it('shows active details, ties, and a separate mastered list', async () => {
    const user = userEvent.setup()
    const original = seedPattern()
    const data = loadData().data
    saveData({
      ...data,
      mistakePatterns: [
        original,
        {
          ...original,
          id: 'other',
          firstOperand: 4,
          secondOperand: 1,
          correctAnswer: 5,
        },
        {
          ...original,
          id: 'mastered',
          firstOperand: 5,
          secondOperand: 2,
          correctAnswer: 7,
          similarCorrectCount: 3,
          mastered: true,
        },
      ],
    })
    renderPage('/statistics')
    expect(
      screen.getByText('Frequently missed facts (tie)'),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Mastery progress: 0 \/ 3/)).toHaveLength(2)
    expect(
      screen.getByRole('link', { name: 'Practice Mistakes' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByText('Mastered patterns (1)', { selector: 'summary' }),
    )
    expect(screen.getByText(/Mastery progress: 3 \/ 3/)).toBeVisible()
  })
})
