import type { MistakePattern } from '../types/mistake'
import type { MathOperation, Question } from '../types/question'
import type { RandomSource } from '../utils/math'
import { randomInt } from '../utils/math'
import { makeQuestion } from './questionGenerator'
import { isValidArithmetic, isValidGeneratedQuestion } from './questionRules'
import { isMistakePattern } from './mistakeService'
import { reportDevelopmentError } from '../utils/developmentErrors'

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family'
interface Candidate {
  operation: MathOperation
  a: number
  b: number
  strategy: SimilarityStrategy
}

export function similarQuestionCandidates(
  pattern: MistakePattern,
  allowedOperations: readonly MathOperation[] = [pattern.operation],
): { question: Question; strategy: SimilarityStrategy }[] {
  if (!isMistakePattern(pattern)) throw new Error('Invalid mistake pattern.')
  const {
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
  } = pattern
  const candidates: Candidate[] = []
  for (const delta of [-2, -1, 1, 2]) {
    if (operation === 'division') {
      if (b + delta > 0)
        candidates.push({
          operation,
          a: (b + delta) * answer,
          b: b + delta,
          strategy: 'nearby',
        })
      candidates.push({
        operation,
        a: b * (answer + delta),
        b,
        strategy: 'nearby',
      })
    } else
      candidates.push(
        { operation, a: a + delta, b, strategy: 'nearby' },
        { operation, a, b: b + delta, strategy: 'nearby' },
      )
  }
  if (operation === 'addition' || operation === 'multiplication')
    candidates.push({ operation, a: b, b: a, strategy: 'reversed' })
  switch (operation) {
    case 'addition':
      candidates.push(
        { operation: 'subtraction', a: answer, b: a, strategy: 'fact-family' },
        { operation: 'subtraction', a: answer, b, strategy: 'fact-family' },
      )
      break
    case 'subtraction':
      candidates.push(
        { operation: 'addition', a: b, b: answer, strategy: 'fact-family' },
        { operation: 'addition', a: answer, b, strategy: 'fact-family' },
      )
      break
    case 'multiplication':
      if (b > 0)
        candidates.push({
          operation: 'division',
          a: answer,
          b,
          strategy: 'fact-family',
        })
      if (a > 0)
        candidates.push({
          operation: 'division',
          a: answer,
          b: a,
          strategy: 'fact-family',
        })
      break
    case 'division':
      candidates.push(
        {
          operation: 'multiplication',
          a: b,
          b: answer,
          strategy: 'fact-family',
        },
        { operation: 'multiplication', a: answer, b, strategy: 'fact-family' },
      )
      break
  }
  const seen = new Set([`${operation}:${a}:${b}`])
  return candidates.flatMap((candidate) => {
    const key = `${candidate.operation}:${candidate.a}:${candidate.b}`
    if (
      seen.has(key) ||
      !allowedOperations.includes(candidate.operation) ||
      !isValidArithmetic(
        candidate.operation,
        pattern.difficulty,
        candidate.a,
        candidate.b,
      )
    )
      return []
    seen.add(key)
    const question: Question = {
      ...makeQuestion(
        candidate.operation,
        pattern.difficulty,
        candidate.a,
        candidate.b,
        () => 0.5,
      ),
      source: 'mistake-review',
      mistakePatternId: pattern.id,
    }
    return isValidGeneratedQuestion(question)
      ? [{ question, strategy: candidate.strategy }]
      : []
  })
}

export function generateSimilarQuestion(
  pattern: MistakePattern,
  allowedOperations: readonly MathOperation[] = [pattern.operation],
  previous?: Question,
  random: RandomSource = Math.random,
): Question {
  let candidates = similarQuestionCandidates(pattern, allowedOperations)
  if (previous)
    candidates = candidates.filter(
      (candidate) =>
        candidate.question.operation !== previous.operation ||
        candidate.question.firstOperand !== previous.firstOperand ||
        candidate.question.secondOperand !== previous.secondOperand,
    )
  if (candidates.length === 0)
    throw new Error('No related question matches these practice choices.')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const selected =
        candidates[randomInt(0, candidates.length - 1, random)].question
      const question = {
        ...selected,
        choices: makeQuestion(
          selected.operation,
          selected.difficulty,
          selected.firstOperand,
          selected.secondOperand,
          random,
        ).choices,
      }
      if (isValidGeneratedQuestion(question)) return question
      reportDevelopmentError('Review question failed validation.', {
        attempt: attempt + 1,
      })
    } catch (error) {
      reportDevelopmentError('Review question generation failed; retrying.', {
        attempt: attempt + 1,
        error,
      })
    }
  }
  // Candidate construction already uses a deterministic source and validates the entire question.
  const fallback = candidates[0].question
  reportDevelopmentError(
    'Review retries exhausted; using a validated related question.',
  )
  if (!isValidGeneratedQuestion(fallback))
    throw new Error('Unable to generate a valid related question.')
  return fallback
}
