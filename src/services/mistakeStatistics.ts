import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'
import { operations } from '../utils/practiceConfiguration'

export function mistakeStatistics(
  patterns: readonly MistakePattern[],
  attempts: readonly PracticeAttempt[],
) {
  const misses = new Map(operations.map((option) => [option.value, 0]))
  for (const attempt of attempts)
    if (!attempt.selfReportedCorrect)
      misses.set(attempt.operation, misses.get(attempt.operation)! + 1)
  const mostMisses = Math.max(0, ...misses.values())
  const highestFactCount = Math.max(
    0,
    ...patterns.map((pattern) => pattern.incorrectCount),
  )
  const reviewAttempts = attempts.filter(
    (attempt) => attempt.source === 'mistake-review',
  )
  return {
    active: patterns.filter((pattern) => !pattern.mastered).length,
    mastered: patterns.filter((pattern) => pattern.mastered).length,
    reviewed: reviewAttempts.length,
    reviewCorrect: reviewAttempts.filter(
      (attempt) => attempt.selfReportedCorrect,
    ).length,
    mostMissedOperations: operations
      .filter(
        (option) => mostMisses > 0 && misses.get(option.value) === mostMisses,
      )
      .map((option) => option.label),
    mostMissedFacts: patterns.filter(
      (pattern) =>
        highestFactCount > 0 && pattern.incorrectCount === highestFactCount,
    ),
  }
}
