import type { Question } from '../types/question'
import { randomInt } from '../utils/math'
import type { RandomSource } from '../utils/math'
import { shuffle } from '../utils/shuffle'

type AnswerContext = Pick<
  Question,
  'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer'
>

/** Common mistakes plus nearby integers, filtered before use. */
export function distractorCandidates(question: AnswerContext): number[] {
  const {
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
  } = question
  let mistakes: number[]
  switch (operation) {
    case 'addition':
      mistakes = [Math.abs(a - b), answer - 10, answer + 10]
      break
    case 'subtraction':
      mistakes = [a + b, answer - 10, answer + 10]
      break
    case 'multiplication':
      mistakes = [a + b, answer - a, answer + a, answer - b, answer + b]
      break
    case 'division':
      mistakes = [
        answer - 1,
        answer + 1,
        b,
        a / (b + 1),
        ...(b > 1 ? [a / (b - 1)] : []),
      ]
      break
  }
  const nearby = [-2, -1, 1, 2, 3].map((offset) => answer + offset)
  return [...new Set([...mistakes, ...nearby])].filter(
    (value) => Number.isSafeInteger(value) && value >= 0 && value !== answer,
  )
}

export function generateAnswerChoices(
  question: AnswerContext,
  random: RandomSource = Math.random,
): number[] {
  const candidates = distractorCandidates(question)
  const incorrect = new Set<number>()
  // Bound retries even if a random source repeatedly chooses the same candidate.
  for (let attempt = 0; attempt < 12 && incorrect.size < 3; attempt++) {
    incorrect.add(candidates[randomInt(0, candidates.length - 1, random)])
  }
  // Deterministic completion guarantees three distractors near zero and with repeated draws.
  for (const candidate of candidates) {
    if (incorrect.size === 3) break
    incorrect.add(candidate)
  }
  if (incorrect.size !== 3)
    throw new Error('Unable to generate three unique distractors.')
  return shuffle([question.correctAnswer, ...incorrect], random)
}
