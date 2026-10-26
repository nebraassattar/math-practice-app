import type { PracticeAttempt } from '../types/session'
import type { AppStatistics, OperationStatistics } from '../types/statistics'

function totals(): OperationStatistics {
  return { attempted: 0, correct: 0, incorrect: 0 }
}
export function accuracy({ attempted, correct }: OperationStatistics): number {
  return attempted === 0 ? 0 : Math.round((correct / attempted) * 100)
}
export function calculateStatistics(
  attempts: readonly PracticeAttempt[],
): AppStatistics {
  const statistics: AppStatistics = {
    ...totals(),
    byOperation: {
      addition: totals(),
      subtraction: totals(),
      multiplication: totals(),
      division: totals(),
    },
    byDifficulty: { 1: totals(), 2: totals(), 3: totals(), 4: totals() },
  }
  for (const attempt of attempts) {
    for (const bucket of [
      statistics,
      statistics.byOperation[attempt.operation],
      statistics.byDifficulty[attempt.difficulty],
    ]) {
      bucket.attempted++
      if (attempt.selfReportedCorrect) bucket.correct++
      else bucket.incorrect++
    }
  }
  return statistics
}
