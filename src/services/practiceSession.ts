import type { PracticeConfiguration } from '../types/practiceConfiguration'
import type { PracticeRun, SessionResult } from '../types/practiceRun'
import type { Question } from '../types/question'
import { createId } from '../utils/ids'
import { isPracticeConfiguration } from '../utils/practiceConfiguration'
import { generateQuestion } from './questionGenerator'
import type { MistakePattern } from '../types/mistake'
import {
  eligiblePatterns,
  selectReviewPattern,
  updateMistakePatterns,
} from './mistakeService'
import { generateSimilarQuestion } from './similarQuestionGenerator'

function sameProblem(a: Question, b: Question) {
  return (
    a.operation === b.operation &&
    a.firstOperand === b.firstOperand &&
    a.secondOperand === b.secondOperand
  )
}

export function nextQuestion(
  configuration: PracticeConfiguration,
  previous?: Question,
  reviewPatterns: readonly MistakePattern[] = [],
): Question {
  if (configuration.mode === 'mistake-review') {
    const available = eligiblePatterns(reviewPatterns, configuration)
    const pattern = selectReviewPattern(available, previous?.mistakePatternId)
    return generateSimilarQuestion(pattern, configuration.operations, previous)
  }
  for (let retry = 0; retry < 5; retry++) {
    const question = generateQuestion(
      configuration.operations,
      configuration.difficulty,
    )
    if (!previous || !sameProblem(question, previous)) return question
  }
  // A deterministic alternate within the same level also handles a repeating random source.
  const operation = configuration.operations[0]
  const alternate = generateQuestion(
    operation,
    configuration.difficulty,
    () => 0,
  )
  // The minimum and maximum problems differ at every level.
  if (!previous || !sameProblem(alternate, previous)) return alternate
  const alternateHigh = generateQuestion(
    operation,
    configuration.difficulty,
    () => 0.999999,
  )
  return alternateHigh
}

export function createPracticeRun(
  configuration: PracticeConfiguration,
  reviewPatterns: readonly MistakePattern[] = [],
  masteryThreshold = 3,
): PracticeRun {
  if (!isPracticeConfiguration(configuration))
    throw new Error('Invalid practice configuration.')
  return {
    configuration,
    session: {
      id: createId(),
      startedAt: new Date().toISOString(),
      ...configuration,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    },
    question: nextQuestion(configuration, undefined, reviewPatterns),
    attempts: [],
    isActive: true,
    reviewPatterns: [...reviewPatterns],
    masteryThreshold,
  }
}

/** Ignore stale/double submissions; the student's self-report is authoritative. */
export function recordResult(
  run: PracticeRun,
  questionId: string,
  selectedAnswer: number,
  correct: boolean,
): PracticeRun {
  if (
    !run.isActive ||
    run.question.id !== questionId ||
    !run.question.choices.includes(selectedAnswer)
  )
    return run
  const question = run.question
  const attempt = {
    id: createId(),
    questionId,
    operation: question.operation,
    firstOperand: question.firstOperand,
    secondOperand: question.secondOperand,
    correctAnswer: question.correctAnswer,
    selectedAnswer,
    selfReportedCorrect: correct,
    difficulty: question.difficulty,
    source: question.source,
    attemptedAt: new Date().toISOString(),
    sessionId: run.session.id,
    ...(question.mistakePatternId
      ? { mistakePatternId: question.mistakePatternId }
      : {}),
  }
  const attempts = [...run.attempts, attempt]
  const reviewPatterns = updateMistakePatterns(
    run.reviewPatterns,
    attempt,
    run.masteryThreshold,
  )
  const noMoreReview =
    run.configuration.mode === 'mistake-review' &&
    eligiblePatterns(reviewPatterns, run.configuration).length === 0
  const complete =
    noMoreReview ||
    (run.configuration.sessionLength !== 'continuous' &&
      attempts.length >= run.configuration.sessionLength)
  return {
    ...run,
    attempts,
    reviewPatterns,
    isActive: !complete,
    session: {
      ...run.session,
      attempted: attempts.length,
      correct: run.session.correct + Number(correct),
      incorrect: run.session.incorrect + Number(!correct),
      ...(complete ? { completedAt: new Date().toISOString() } : {}),
    },
    question: complete
      ? run.question
      : nextQuestion(run.configuration, run.question, reviewPatterns),
  }
}

export function finishRun(run: PracticeRun): PracticeRun {
  if (!run.isActive) return run
  return {
    ...run,
    isActive: false,
    session: { ...run.session, completedAt: new Date().toISOString() },
  }
}

export function toSessionResult(run: PracticeRun): SessionResult {
  return {
    configuration: run.configuration,
    session: run.session,
    attempts: run.attempts,
  }
}

/** Route state is untrusted; a missing or malformed summary returns to setup. */
export function isSessionResult(value: unknown): value is SessionResult {
  if (!value || typeof value !== 'object') return false
  const result = value as Partial<SessionResult>
  if (
    !isPracticeConfiguration(result.configuration) ||
    !Array.isArray(result.attempts) ||
    !result.session
  )
    return false
  const { session, configuration, attempts } = result
  if (
    typeof session.id !== 'string' ||
    !session.id ||
    typeof session.startedAt !== 'string' ||
    typeof session.completedAt !== 'string' ||
    !Number.isFinite(Date.parse(session.startedAt)) ||
    !Number.isFinite(Date.parse(session.completedAt))
  )
    return false
  if (
    !isPracticeConfiguration(session) ||
    session.difficulty !== configuration.difficulty ||
    session.sessionLength !== configuration.sessionLength ||
    (session.mode ?? 'regular') !== (configuration.mode ?? 'regular') ||
    session.operations.join(',') !== configuration.operations.join(',')
  )
    return false
  if (
    ![session.attempted, session.correct, session.incorrect].every(
      (n) => Number.isInteger(n) && n >= 0,
    ) ||
    session.attempted !== attempts.length ||
    session.correct + session.incorrect !== session.attempted
  )
    return false
  if (
    configuration.sessionLength !== 'continuous' &&
    attempts.length > configuration.sessionLength
  )
    return false
  if (
    !Array.from(attempts).every(
      (attempt) =>
        attempt &&
        typeof attempt === 'object' &&
        typeof attempt.id === 'string' &&
        typeof attempt.questionId === 'string' &&
        attempt.sessionId === session.id &&
        typeof attempt.selfReportedCorrect === 'boolean' &&
        configuration.operations.includes(attempt.operation) &&
        attempt.difficulty === configuration.difficulty &&
        (attempt.source === 'regular' ||
          (attempt.source === 'mistake-review' &&
            typeof attempt.mistakePatternId === 'string' &&
            attempt.mistakePatternId.length > 0)) &&
        [
          attempt.firstOperand,
          attempt.secondOperand,
          attempt.correctAnswer,
          attempt.selectedAnswer,
        ].every((n) => Number.isSafeInteger(n) && n >= 0) &&
        typeof attempt.attemptedAt === 'string' &&
        Number.isFinite(Date.parse(attempt.attemptedAt)),
    )
  )
    return false
  return (
    new Set(attempts.map((attempt) => attempt.id)).size === attempts.length &&
    new Set(attempts.map((attempt) => attempt.questionId)).size ===
      attempts.length &&
    attempts.filter((attempt) => attempt.selfReportedCorrect).length ===
      session.correct
  )
}
