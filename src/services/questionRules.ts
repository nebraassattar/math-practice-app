import type {
  DifficultyLevel,
  MathOperation,
  Question,
} from '../types/question'

export const operandMaximum: Record<DifficultyLevel, number> = {
  1: 10,
  2: 50,
  3: 100,
  4: 1000,
}
export const divisionMaximum: Record<DifficultyLevel, number> = {
  1: 5,
  2: 10,
  3: 12,
  4: 99,
}
export const symbols: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

export function isDifficulty(value: unknown): value is DifficultyLevel {
  return value === 1 || value === 2 || value === 3 || value === 4
}

export function isOperation(value: unknown): value is MathOperation {
  return (
    value === 'addition' ||
    value === 'subtraction' ||
    value === 'multiplication' ||
    value === 'division'
  )
}

export function calculate(
  operation: MathOperation,
  first: number,
  second: number,
): number {
  switch (operation) {
    case 'addition':
      return first + second
    case 'subtraction':
      return first - second
    case 'multiplication':
      return first * second
    case 'division':
      return first / second
  }
}

/** Validate a regular whole-number question, including its four answer choices. */
export function isValidGeneratedQuestion(value: unknown): value is Question {
  if (typeof value !== 'object' || value === null) return false
  const q = value as Record<string, unknown>
  if (!isOperation(q.operation) || !isDifficulty(q.difficulty)) return false
  const { firstOperand: a, secondOperand: b, correctAnswer: answer } = q
  if (
    typeof a !== 'number' ||
    typeof b !== 'number' ||
    typeof answer !== 'number' ||
    ![a, b, answer].every((n) => Number.isSafeInteger(n) && n >= 0)
  )
    return false
  if (
    typeof q.id !== 'string' ||
    q.id.length === 0 ||
    q.source !== 'regular' ||
    !Array.isArray(q.choices) ||
    q.choices.length !== 4 ||
    !Array.from(q.choices).every(
      (value) =>
        typeof value === 'number' && Number.isSafeInteger(value) && value >= 0,
    ) ||
    new Set(q.choices).size !== 4 ||
    !q.choices.includes(answer)
  )
    return false
  if (
    q.displayText !== `${a} ${symbols[q.operation]} ${b} = ?` ||
    calculate(q.operation, a, b) !== answer
  )
    return false
  const level = q.difficulty
  switch (q.operation) {
    case 'addition':
      return (
        a <= operandMaximum[level] &&
        b <= operandMaximum[level] &&
        (level > 2 || answer <= (level === 1 ? 20 : 100))
      )
    case 'subtraction':
      return a <= operandMaximum[level] && b <= a
    case 'multiplication':
      return level === 1
        ? a <= 5 && b <= 5
        : level === 2
          ? a <= 10 && b <= 10
          : level === 3
            ? a <= 9 && b <= 99
            : a >= 10 && a <= 99 && b <= 99
    case 'division':
      return (
        b >= 1 &&
        b <= divisionMaximum[level] &&
        (level === 3
          ? a <= 144
          : answer <= (level === 4 ? 99 : divisionMaximum[level]))
      )
  }
}
