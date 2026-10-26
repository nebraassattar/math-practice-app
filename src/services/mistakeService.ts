import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'
import type { PracticeConfiguration } from '../types/practiceConfiguration'
import { createId } from '../utils/ids'
import {
  isDifficulty,
  isOperation,
  isValidArithmetic,
  calculate,
} from './questionRules'
import { shuffle } from '../utils/shuffle'
import { randomInt } from '../utils/math'
import type { RandomSource } from '../utils/math'

/** Commutative facts share a pattern, without rewriting their stored display operands. */
export function patternKey(
  value: Pick<
    MistakePattern,
    'operation' | 'difficulty' | 'firstOperand' | 'secondOperand'
  >,
): string {
  const operands = [value.firstOperand, value.secondOperand]
  if (value.operation === 'addition' || value.operation === 'multiplication')
    operands.sort((a, b) => a - b)
  return `${value.operation}:${value.difficulty}:${operands.join(':')}`
}

export function isMistakePattern(value: unknown): value is MistakePattern {
  if (!value || typeof value !== 'object') return false
  const pattern = value as Record<string, unknown>
  if (
    !isOperation(pattern.operation) ||
    !isDifficulty(pattern.difficulty) ||
    typeof pattern.firstOperand !== 'number' ||
    typeof pattern.secondOperand !== 'number'
  )
    return false
  return (
    typeof pattern.id === 'string' &&
    pattern.id.length > 0 &&
    isValidArithmetic(
      pattern.operation,
      pattern.difficulty,
      pattern.firstOperand,
      pattern.secondOperand,
    ) &&
    pattern.correctAnswer ===
      calculate(
        pattern.operation,
        pattern.firstOperand,
        pattern.secondOperand,
      ) &&
    typeof pattern.incorrectCount === 'number' &&
    Number.isSafeInteger(pattern.incorrectCount) &&
    pattern.incorrectCount > 0 &&
    typeof pattern.similarCorrectCount === 'number' &&
    Number.isSafeInteger(pattern.similarCorrectCount) &&
    pattern.similarCorrectCount >= 0 &&
    typeof pattern.lastIncorrectAt === 'string' &&
    Number.isFinite(Date.parse(pattern.lastIncorrectAt)) &&
    typeof pattern.mastered === 'boolean'
  )
}

export function applyMasteryThreshold(
  patterns: readonly MistakePattern[],
  threshold = 3,
): MistakePattern[] {
  if (!Number.isSafeInteger(threshold) || threshold < 1)
    throw new RangeError('Mastery threshold must be a positive integer.')
  return patterns.map((pattern) => ({
    ...pattern,
    mastered: pattern.similarCorrectCount >= threshold,
  }))
}

/** A review miss updates its original pattern; successful regular facts do not advance review mastery. */
export function updateMistakePatterns(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
  threshold = 3,
): MistakePattern[] {
  if (!Number.isSafeInteger(threshold) || threshold < 1)
    throw new RangeError('Mastery threshold must be a positive integer.')
  const original =
    attempt.source === 'mistake-review'
      ? patterns.find((pattern) => pattern.id === attempt.mistakePatternId)
      : undefined
  const existing =
    original ??
    patterns.find((pattern) => patternKey(pattern) === patternKey(attempt))
  if (attempt.selfReportedCorrect) {
    if (attempt.source !== 'mistake-review' || !original) return [...patterns]
    return patterns.map((pattern) =>
      pattern.id === original.id
        ? {
            ...pattern,
            similarCorrectCount: pattern.similarCorrectCount + 1,
            mastered: pattern.similarCorrectCount + 1 >= threshold,
          }
        : pattern,
    )
  }
  if (existing)
    return patterns.map((pattern) =>
      pattern.id === existing.id
        ? {
            ...pattern,
            incorrectCount: pattern.incorrectCount + 1,
            lastIncorrectAt: attempt.attemptedAt,
            similarCorrectCount: 0,
            mastered: false,
          }
        : pattern,
    )
  return [
    ...patterns,
    {
      id: createId(),
      operation: attempt.operation,
      firstOperand: attempt.firstOperand,
      secondOperand: attempt.secondOperand,
      correctAnswer: attempt.correctAnswer,
      difficulty: attempt.difficulty,
      incorrectCount: 1,
      similarCorrectCount: 0,
      lastIncorrectAt: attempt.attemptedAt,
      mastered: false,
    },
  ]
}

export function eligiblePatterns(
  patterns: readonly MistakePattern[],
  configuration: PracticeConfiguration,
): MistakePattern[] {
  return patterns.filter(
    (pattern) =>
      !pattern.mastered &&
      pattern.difficulty === configuration.difficulty &&
      configuration.operations.includes(pattern.operation),
  )
}

export function reviewPriority(
  pattern: MistakePattern,
  now = Date.now(),
): number {
  const days = Math.max(0, now - Date.parse(pattern.lastIncorrectAt)) / 86400000
  return (
    4 * pattern.incorrectCount +
    7 / (1 + days) +
    3 / (1 + pattern.similarCorrectCount)
  )
}

export function prioritizePatterns(
  patterns: readonly MistakePattern[],
  random: RandomSource = Math.random,
  now = Date.now(),
): MistakePattern[] {
  return shuffle(
    patterns.filter((pattern) => !pattern.mastered),
    random,
  ).sort((a, b) => reviewPriority(b, now) - reviewPriority(a, now))
}

/** Mix patterns without immediate reuse when alternatives exist, weighting more urgent facts higher. */
export function selectReviewPattern(
  patterns: readonly MistakePattern[],
  previousId?: string,
  random: RandomSource = Math.random,
  now = Date.now(),
): MistakePattern {
  const active = patterns.filter((pattern) => !pattern.mastered)
  if (active.length === 0)
    throw new Error('No active mistake patterns are available.')
  const options =
    active.length > 1
      ? active.filter((pattern) => pattern.id !== previousId)
      : active
  const weights = options.map((pattern) => reviewPriority(pattern, now))
  const total = weights.reduce((sum, value) => sum + value, 0)
  const draw = (randomInt(0, 999999, random) / 1000000) * total
  let cumulative = 0
  for (let index = 0; index < options.length; index++) {
    cumulative += weights[index]
    if (draw < cumulative) return options[index]
  }
  return options[options.length - 1]
}
