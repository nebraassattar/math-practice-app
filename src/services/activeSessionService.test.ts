import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACTIVE_SESSION_KEY,
  clearActiveSession,
  isActiveSession,
  loadActiveSession,
  saveActiveSession,
} from './activeSessionService'
import type { ActiveSession } from './activeSessionService'
import { createPracticeRun, finishRun, recordResult } from './practiceSession'

function snapshot(): ActiveSession {
  return {
    version: 1,
    run: createPracticeRun({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
    }),
    selectedAnswer: null,
    revealed: false,
  }
}
afterEach(() => vi.restoreAllMocks())
describe('active session storage', () => {
  it('round trips a continuous run and removes only its owned key', () => {
    const state = snapshot()
    state.run.configuration.sessionLength = 'continuous'
    state.run.session.sessionLength = 'continuous'
    sessionStorage.setItem('unrelated', 'keep')
    expect(saveActiveSession(state)).toBe(true)
    expect(loadActiveSession()).toEqual(state)
    expect(clearActiveSession()).toBe(true)
    expect(loadActiveSession()).toBeNull()
    expect(sessionStorage.getItem('unrelated')).toBe('keep')
  })
  it.each([
    (s: ActiveSession) => {
      s.version = 2 as 1
    },
    (s: ActiveSession) => {
      s.run = finishRun(s.run)
    },
    (s: ActiveSession) => {
      s.selectedAnswer = -1
    },
    (s: ActiveSession) => {
      s.revealed = true
    },
    (s: ActiveSession) => {
      s.run.question.choices = [1, 1, 1, 1]
    },
    (s: ActiveSession) => {
      s.run.question.displayText = 'wrong'
    },
    (s: ActiveSession) => {
      s.run.masteryThreshold = 0
    },
    (s: ActiveSession) => {
      s.run.session.attempted = 1
    },
    (s: ActiveSession) => {
      s.run.question.difficulty = 2
    },
    (s: ActiveSession) => {
      s.run.configuration.mode = 'mistake-review'
    },
  ])('rejects malformed or inconsistent snapshots %#', (mutate) => {
    const state = snapshot()
    mutate(state)
    sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state))
    expect(loadActiveSession()).toBeNull()
  })
  it('accepts valid progress but rejects an already-recorded current question', () => {
    const state = snapshot()
    const question = state.run.question
    state.run = recordResult(state.run, question.id, question.choices[0], false)
    expect(isActiveSession(state)).toBe(true)
    state.run.question = question
    expect(isActiveSession(state)).toBe(false)
  })
  it('round trips a review run with its original pattern and mastery progress', () => {
    const state = snapshot()
    const question = state.run.question
    const missed = recordResult(
      state.run,
      question.id,
      question.choices[0],
      false,
    )
    const review = createPracticeRun(
      { ...state.run.configuration, mode: 'mistake-review' },
      missed.reviewPatterns,
      4,
    )
    state.run = recordResult(
      review,
      review.question.id,
      review.question.choices[0],
      true,
    )
    expect(saveActiveSession(state)).toBe(true)
    expect(isActiveSession(state)).toBe(true)
    expect(loadActiveSession()).toEqual(state)
    expect(loadActiveSession()!.run.reviewPatterns[0].similarCorrectCount).toBe(
      1,
    )
  })
  it('safely handles unavailable storage and malformed JSON', () => {
    sessionStorage.setItem(ACTIVE_SESSION_KEY, 'broken')
    expect(loadActiveSession()).toBeNull()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadActiveSession()).toBeNull()
    expect(saveActiveSession(snapshot())).toBe(false)
    expect(clearActiveSession()).toBe(false)
  })
})
