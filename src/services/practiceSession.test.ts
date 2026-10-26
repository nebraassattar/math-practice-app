import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPracticeRun,
  finishRun,
  isSessionResult,
  nextQuestion,
  recordResult,
  toSessionResult,
} from './practiceSession'
import type { PracticeConfiguration } from '../types/practiceConfiguration'
import type { DifficultyLevel, MathOperation } from '../types/question'
import * as generator from './questionGenerator'

const config: PracticeConfiguration = {
  operations: ['addition', 'division'],
  difficulty: 1,
  sessionLength: 5,
}
afterEach(() => vi.restoreAllMocks())

describe('practice session state', () => {
  it('creates a fresh session with configuration and no recorded attempts', () => {
    const run = createPracticeRun(config)
    expect(run.configuration).toEqual(config)
    expect(run.session).toMatchObject({
      ...config,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    })
    expect(run.session.id).toBeTruthy()
    expect(Number.isFinite(Date.parse(run.session.startedAt))).toBe(true)
    expect(run.attempts).toEqual([])
    expect(run.isActive).toBe(true)
    expect(createPracticeRun(config).session.id).not.toBe(run.session.id)
  })

  it('stores the complete attempt using the self-reported result, not the selected answer', () => {
    const run = createPracticeRun(config)
    const wrongChoice = run.question.choices.find(
      (value) => value !== run.question.correctAnswer,
    )!
    const updated = recordResult(run, run.question.id, wrongChoice, true)
    expect(updated.session).toMatchObject({
      attempted: 1,
      correct: 1,
      incorrect: 0,
    })
    expect(updated.attempts[0]).toMatchObject({
      sessionId: run.session.id,
      questionId: run.question.id,
      selectedAnswer: wrongChoice,
      selfReportedCorrect: true,
      operation: run.question.operation,
      difficulty: 1,
      source: 'regular',
    })
    expect(updated.attempts[0].attemptedAt).toBeTruthy()
    expect(run.attempts).toEqual([])
    expect(updated.question.displayText).not.toBe(run.question.displayText)
    expect(recordResult(updated, run.question.id, wrongChoice, false)).toBe(
      updated,
    )
    expect(recordResult(run, run.question.id, -999, false)).toBe(run)
  })

  it.each([5, 10, 20] as const)(
    'completes exactly %s attempts and stops generating questions',
    (length) => {
      let run = createPracticeRun({ ...config, sessionLength: length })
      const generate = vi.spyOn(generator, 'generateQuestion')
      for (let index = 0; index < length; index++) {
        const calls = generate.mock.calls.length
        const previous = run.question
        run = recordResult(
          run,
          previous.id,
          previous.choices[0],
          index % 2 === 0,
        )
        expect(run.session.attempted).toBe(index + 1)
        if (index < length - 1) expect(run.isActive).toBe(true)
        else {
          expect(run.isActive).toBe(false)
          expect(generate.mock.calls.length).toBe(calls)
          expect(run.question).toBe(previous)
        }
      }
      expect(run.session.correct + run.session.incorrect).toBe(length)
      expect(run.session.completedAt).toBeTruthy()
      expect(isSessionResult(toSessionResult(run))).toBe(true)
      expect(
        recordResult(run, run.question.id, run.question.choices[0], true),
      ).toBe(run)
    },
  )

  it('continues without a fixed limit and ends with a timestamp', () => {
    let run = createPracticeRun({ ...config, sessionLength: 'continuous' })
    for (let index = 0; index < 25; index++)
      run = recordResult(run, run.question.id, run.question.choices[0], false)
    expect(run.isActive).toBe(true)
    expect(run.session).toMatchObject({ attempted: 25, incorrect: 25 })
    run = finishRun(run)
    expect(run.isActive).toBe(false)
    expect(run.session.completedAt).toBeTruthy()
    expect(finishRun(run)).toBe(run)
    expect(isSessionResult(toSessionResult(run))).toBe(true)
  })

  it('supports an empty early-ended summary without fabricated attempts', () => {
    const result = toSessionResult(finishRun(createPracticeRun(config)))
    expect(isSessionResult(result)).toBe(true)
    expect(result.session.attempted).toBe(0)
  })

  it.each(
    (
      [
        'addition',
        'subtraction',
        'multiplication',
        'division',
      ] as MathOperation[]
    ).flatMap((operation) =>
      ([1, 2, 3, 4] as DifficultyLevel[]).map((difficulty) => ({
        operation,
        difficulty,
      })),
    ),
  )(
    'avoids repeats when randomness is stuck: $operation level $difficulty',
    ({ operation, difficulty }) => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const configuration = { ...config, operations: [operation], difficulty }
      const previous = nextQuestion(configuration)
      expect(nextQuestion(configuration, previous).displayText).not.toBe(
        previous.displayText,
      )
    },
  )

  it.each([
    null,
    {},
    { session: {} },
    { configuration: config, attempts: [], session: {} },
  ])('rejects absent or malformed summary: %j', (result) => {
    expect(isSessionResult(result)).toBe(false)
  })

  it('rejects inconsistent totals and duplicate attempts in route state', () => {
    let run = createPracticeRun(config)
    run = finishRun(
      recordResult(run, run.question.id, run.question.choices[0], true),
    )
    const result = toSessionResult(run)
    expect(
      isSessionResult({
        ...result,
        session: { ...result.session, correct: 0 },
      }),
    ).toBe(false)
    expect(
      isSessionResult({
        ...result,
        attempts: [result.attempts[0], result.attempts[0]],
        session: { ...result.session, attempted: 2, correct: 2 },
      }),
    ).toBe(false)
  })
})
