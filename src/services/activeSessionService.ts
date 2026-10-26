import type { PracticeRun } from '../types/practiceRun'
import { finishRun, isSessionResult, toSessionResult } from './practiceSession'
import { isValidGeneratedQuestion } from './questionRules'
import { isMistakePattern, eligiblePatterns } from './mistakeService'

export const ACTIVE_SESSION_KEY = 'mathPractice.activeSession'
export interface ActiveSession {
  version: 1
  run: PracticeRun
  selectedAnswer: number | null
  revealed: boolean
}

export function isActiveSession(value: unknown): value is ActiveSession {
  if (!value || typeof value !== 'object') return false
  const state = value as ActiveSession
  const run = state.run
  if (
    state.version !== 1 ||
    !run ||
    run.isActive !== true ||
    typeof state.revealed !== 'boolean' ||
    !isValidGeneratedQuestion(run.question) ||
    !Array.isArray(run.reviewPatterns) ||
    !run.reviewPatterns.every(isMistakePattern) ||
    !Number.isSafeInteger(run.masteryThreshold) ||
    run.masteryThreshold < 1 ||
    !isSessionResult(toSessionResult(finishRun(run)))
  )
    return false
  return (
    run.question.difficulty === run.configuration.difficulty &&
    run.configuration.operations.includes(run.question.operation) &&
    run.question.source ===
      (run.configuration.mode === 'mistake-review'
        ? 'mistake-review'
        : 'regular') &&
    !run.attempts.some((a) => a.questionId === run.question.id) &&
    (run.configuration.sessionLength === 'continuous' ||
      run.attempts.length < run.configuration.sessionLength) &&
    (state.selectedAnswer === null ||
      run.question.choices.includes(state.selectedAnswer)) &&
    (!state.revealed || state.selectedAnswer !== null) &&
    (run.configuration.mode !== 'mistake-review' ||
      eligiblePatterns(run.reviewPatterns, run.configuration).some(
        (p) => p.id === run.question.mistakePatternId,
      ))
  )
}

/** Per-tab recovery avoids two tabs accidentally sharing one in-progress card. */
export function loadActiveSession(): ActiveSession | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    return isActiveSession(value) ? value : null
  } catch {
    return null
  }
}
export function saveActiveSession(state: ActiveSession): boolean {
  try {
    sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
export function clearActiveSession(): boolean {
  try {
    sessionStorage.removeItem(ACTIVE_SESSION_KEY)
    return true
  } catch {
    return false
  }
}
