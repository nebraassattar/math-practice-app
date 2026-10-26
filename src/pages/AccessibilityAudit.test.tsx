import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'
import App from '../app/App'
import {
  createPracticeRun,
  finishRun,
  recordResult,
  toSessionResult,
} from '../services/practiceSession'
import { emptyData, loadData, saveData } from '../services/storageService'

beforeEach(() => {
  // axe probes canvas to identify some content; jsdom cannot draw it.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
const configuration = {
  operations: ['addition'] as const,
  difficulty: 1 as const,
  sessionLength: 5 as const,
}
function renderPage(path: string, state: unknown = null) {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: [{ pathname: path, state }],
  })
  return render(<RouterProvider router={router} />)
}
async function audit() {
  // jsdom has no layout/canvas engine: contrast and visual reflow require browser review.
  const result = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(
    result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
}
function seedHistory() {
  const run = createPracticeRun({
    ...configuration,
    operations: [...configuration.operations],
  })
  const progress = recordResult(
    run,
    run.question.id,
    run.question.choices[0],
    false,
  )
  saveData({
    ...emptyData(),
    sessions: [progress.session],
    attempts: progress.attempts,
    mistakePatterns: progress.reviewPatterns,
  })
  return progress
}
describe('automated accessibility audit', () => {
  it.each([
    '/',
    '/practice/setup',
    '/statistics',
    '/settings',
    '/not-a-page',
    '/practice/session',
    '/practice/summary',
  ])('has no detectable axe violations at %s', async (path) => {
    renderPage(path)
    await audit()
  })
  it('audits populated statistics and the reset confirmation', async () => {
    const user = userEvent.setup()
    seedHistory()
    renderPage('/statistics')
    await audit()
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await audit()
  })
  it('audits question front, revealed answer, navigation confirmation and completed summary', async () => {
    const user = userEvent.setup()
    renderPage('/practice/session', {
      ...configuration,
      operations: [...configuration.operations],
    })
    await audit()
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await audit()
    await user.click(screen.getByRole('link', { name: 'Statistics' }))
    await audit()
    cleanup()
    const progress = seedHistory()
    renderPage('/practice/summary', toSessionResult(finishRun(progress)))
    await audit()
  })
  it('completes a full addition session entirely with keyboard input and records each result once', async () => {
    const user = userEvent.setup()
    renderPage('/practice/session', {
      ...configuration,
      operations: [...configuration.operations],
    })
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Question ${i + 1} of 5`)).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toHaveFocus()
      await user.keyboard('1')
      expect(
        within(
          screen.getByRole('group', { name: 'Answer choices' }),
        ).getAllByRole('button')[0],
      ).toHaveFocus()
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      expect(screen.getByRole('button', { name: 'Flip Card' })).toHaveFocus()
      await user.keyboard('{Enter}')
      await user.tab()
      expect(
        screen.getByRole('button', { name: 'I Got It Right' }),
      ).toHaveFocus()
      if (i % 2) {
        await user.tab()
        await user.keyboard(' ')
      } else await user.keyboard('{Enter}')
    }
    expect(
      screen.getByRole('heading', { name: 'Session Summary' }),
    ).toHaveFocus()
    expect(loadData().data.attempts).toHaveLength(5)
    expect(loadData().data.sessions[0]).toMatchObject({
      attempted: 5,
      correct: 3,
      incorrect: 2,
    })
    expect(
      loadData().data.attempts.every((a) => a.operation === 'addition'),
    ).toBe(true)
    await audit()
  })
})
