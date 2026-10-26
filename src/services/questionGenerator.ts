import type {
  DifficultyLevel,
  MathOperation,
  Question,
} from '../types/question'
import { createId } from '../utils/ids'
import { randomInt } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { generateAnswerChoices } from './answerChoices'
import { reportDevelopmentError } from '../utils/developmentErrors'
import {
  calculate,
  divisionMaximum,
  isDifficulty,
  isOperation,
  isValidGeneratedQuestion,
  operandMaximum,
  symbols,
} from './questionRules'

export function makeQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  firstOperand: number,
  secondOperand: number,
  random: RandomSource = Math.random,
): Question {
  const question: Question = {
    id: createId(),
    operation,
    difficulty,
    firstOperand,
    secondOperand,
    correctAnswer: calculate(operation, firstOperand, secondOperand),
    displayText: `${firstOperand} ${symbols[operation]} ${secondOperand} = ?`,
    choices: [],
    source: 'regular',
  }
  question.choices = generateAnswerChoices(question, random)
  return question
}

function assertDifficulty(difficulty: DifficultyLevel) {
  if (!isDifficulty(difficulty))
    throw new RangeError('Unsupported difficulty level.')
}

export function generateAddition(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  assertDifficulty(difficulty)
  return makeQuestion(
    'addition',
    difficulty,
    randomInt(0, operandMaximum[difficulty], random),
    randomInt(0, operandMaximum[difficulty], random),
    random,
  )
}

export function generateSubtraction(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  assertDifficulty(difficulty)
  const a = randomInt(0, operandMaximum[difficulty], random)
  const b = randomInt(0, operandMaximum[difficulty], random)
  return makeQuestion(
    'subtraction',
    difficulty,
    Math.max(a, b),
    Math.min(a, b),
    random,
  )
}

export function generateMultiplication(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  assertDifficulty(difficulty)
  const firstMax =
    difficulty === 1 ? 5 : difficulty === 2 ? 10 : difficulty === 3 ? 9 : 99
  const secondMax = difficulty === 1 ? 5 : difficulty === 2 ? 10 : 99
  return makeQuestion(
    'multiplication',
    difficulty,
    randomInt(difficulty === 4 ? 10 : 0, firstMax, random),
    randomInt(0, secondMax, random),
    random,
  )
}

export function generateDivision(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  assertDifficulty(difficulty)
  const divisor = randomInt(1, divisionMaximum[difficulty], random)
  const quotientMax =
    difficulty === 3
      ? Math.floor(144 / divisor)
      : difficulty === 4
        ? 99
        : divisionMaximum[difficulty]
  const quotient = randomInt(0, quotientMax, random)
  return makeQuestion(
    'division',
    difficulty,
    divisor * quotient,
    divisor,
    random,
  )
}

const generators = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
}

/** Reject bad configuration; retry unexpected generation failures, then use a valid fixed question. */
export function generateQuestion(
  operation: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  assertDifficulty(difficulty)
  const selected = typeof operation === 'string' ? [operation] : operation
  if (
    !Array.isArray(selected) ||
    selected.length === 0 ||
    !Array.from(selected).every(isOperation)
  )
    throw new RangeError('Choose at least one supported operation.')
  let chosen: MathOperation = selected[0]
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      chosen = selected[randomInt(0, selected.length - 1, random)]
      const question = generators[chosen](difficulty, random)
      if (isValidGeneratedQuestion(question)) return question
      reportDevelopmentError('Generated question failed validation.', {
        chosen,
        difficulty,
        attempt: attempt + 1,
      })
    } catch (error) {
      reportDevelopmentError('Question generation failed; retrying.', {
        chosen,
        difficulty,
        attempt: attempt + 1,
        error,
      })
    }
  }
  const first = chosen === 'multiplication' && difficulty === 4 ? 10 : 1
  reportDevelopmentError(
    'Question retries exhausted; using a validated fallback.',
    { chosen, difficulty },
  )
  const fallback = makeQuestion(chosen, difficulty, first, 1, () => 0.5)
  if (!isValidGeneratedQuestion(fallback))
    throw new Error('Unable to generate a valid arithmetic question.')
  return fallback
}
