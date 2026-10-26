import { expect, it } from 'vitest'
import { createPracticeRun, recordResult } from './practiceSession'
import {
  DATA_KEY,
  emptyData,
  loadData,
  saveData,
  RECENT_SESSION_LIMIT,
} from './storageService'
import { calculateStatistics } from './statisticsService'

it('round trips 5,000 attempts, caps recent details, and retains lifetime totals', () => {
  const initial = createPracticeRun({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
  })
  const run = recordResult(
    initial,
    initial.question.id,
    initial.question.choices[0],
    true,
  )
  const attempts = Array.from({ length: 5000 }, (_, i) => ({
    ...run.attempts[0],
    id: `attempt-${i}`,
    questionId: `question-${i}`,
    sessionId: `session-${Math.floor(i / 5)}`,
    selfReportedCorrect: i % 3 !== 0,
  }))
  const sessions = Array.from({ length: 1000 }, (_, i) => {
    const correct = attempts
      .slice(i * 5, i * 5 + 5)
      .filter((a) => a.selfReportedCorrect).length
    const time = new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()
    return {
      ...initial.session,
      id: `session-${i}`,
      startedAt: time,
      completedAt: time,
      attempted: 5,
      correct,
      incorrect: 5 - correct,
    }
  })
  const data = { ...emptyData(), attempts, sessions }
  const start = performance.now()
  expect(saveData(data)).toBeNull()
  const loaded = loadData()
  const stats = calculateStatistics(loaded.data.attempts)
  const elapsed = performance.now() - start
  expect(loaded.warning).toBeNull()
  expect(loaded.data.attempts).toHaveLength(5000)
  expect(loaded.data.sessions).toHaveLength(RECENT_SESSION_LIMIT)
  expect(loaded.data.sessions[0].id).toBe('session-999')
  expect(stats).toMatchObject({
    attempted: 5000,
    correct: 3333,
    incorrect: 1667,
  })
  const characters = localStorage.getItem(DATA_KEY)!.length
  expect(characters * 2).toBeLessThan(5 * 1024 * 1024)
  console.info(
    `Large-history check: ${characters} JSON characters; ${characters * 2} UTF-16 value bytes; save/load/aggregate ${elapsed.toFixed(1)} ms.`,
  )
})
