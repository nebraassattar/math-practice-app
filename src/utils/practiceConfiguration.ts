import type { PracticeConfiguration } from '../types/practiceConfiguration'
import type { DifficultyLevel, MathOperation } from '../types/question'

export const operations: { value: MathOperation; label: string }[] = [
  { value: 'addition', label: 'Addition' },
  { value: 'subtraction', label: 'Subtraction' },
  { value: 'multiplication', label: 'Multiplication' },
  { value: 'division', label: 'Division' },
]

export const difficulties: {
  value: DifficultyLevel
  label: string
  description: string
}[] = [
  {
    value: 1,
    label: 'Beginner',
    description:
      'Add and subtract 0–10 (sums up to 20). Multiply with factors 0–5; divide by 1–5.',
  },
  {
    value: 2,
    label: 'Easy',
    description:
      'Add and subtract 0–50 (sums up to 100). Multiply with factors 0–10; divide by 1–10.',
  },
  {
    value: 3,
    label: 'Intermediate',
    description:
      'Add and subtract 0–100, with carrying and borrowing. Multiply one-digit numbers by one- or two-digit numbers; divide numbers up to 144 by 1–12.',
  },
  {
    value: 4,
    label: 'Advanced',
    description:
      'Add and subtract numbers up to 1,000. Multiply two-digit numbers by one- or two-digit numbers; divide larger numbers by one- or two-digit divisors.',
  },
]

export function isPracticeConfiguration(
  value: unknown,
): value is PracticeConfiguration {
  if (typeof value !== 'object' || value === null) return false
  const config = value as Record<string, unknown>
  return (
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    config.operations.every((operation) =>
      operations.some((option) => option.value === operation),
    ) &&
    new Set(config.operations).size === config.operations.length &&
    difficulties.some((option) => option.value === config.difficulty) &&
    [5, 10, 20, 'continuous'].includes(config.sessionLength as number | string)
  )
}
