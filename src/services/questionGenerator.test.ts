import { describe, expect, it, vi } from 'vitest'
import type { DifficultyLevel, MathOperation } from '../types/question'
import {
  generateAddition,
  generateSubtraction,
  generateMultiplication,
  generateDivision,
  generateQuestion,
} from './questionGenerator'
import { isValidGeneratedQuestion } from './questionRules'
import { distractorCandidates, generateAnswerChoices } from './answerChoices'
import * as ids from '../utils/ids'

function seededRandom(seed = 123456) {
  let state = seed
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const operations: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
const levels: DifficultyLevel[] = [1, 2, 3, 4]
const combinations = operations.flatMap((operation) =>
  levels.map((level) => [operation, level] as const),
)

describe('arithmetic generation', () => {
  it.each(combinations)(
    'generates valid %s questions at level %s across varied inputs',
    (operation, level) => {
      const random = seededRandom()
      const ids = new Set<string>()
      for (let index = 0; index < 100; index++) {
        const question = generateQuestion(operation, level, random)
        const {
          firstOperand: a,
          secondOperand: b,
          correctAnswer: answer,
        } = question
        expect(question.operation).toBe(operation)
        expect(question.difficulty).toBe(level)
        expect(question.source).toBe('regular')
        expect(ids.has(question.id)).toBe(false)
        ids.add(question.id)
        expect(isValidGeneratedQuestion(question)).toBe(true)
        expect(question.choices).toHaveLength(4)
        expect(new Set(question.choices).size).toBe(4)
        expect(
          question.choices.filter((choice) => choice === answer),
        ).toHaveLength(1)
        for (const choice of question.choices) {
          expect(Number.isInteger(choice)).toBe(true)
          expect(choice).toBeGreaterThanOrEqual(0)
        }
        if (operation === 'addition') expect(answer).toBe(a + b)
        if (operation === 'subtraction') {
          expect(answer).toBe(a - b)
          expect(a).toBeGreaterThanOrEqual(b)
        }
        if (operation === 'multiplication') expect(answer).toBe(a * b)
        if (operation === 'division') {
          expect(b).toBeGreaterThan(0)
          expect(a % b).toBe(0)
          expect(answer).toBe(a / b)
        }
      }
    },
  )

  it.each(levels)(
    'honors inclusive addition and subtraction limits at level %s',
    (level) => {
      const max = [10, 50, 100, 1000][level - 1]
      const low = generateAddition(level, () => 0)
      const high = generateAddition(level, () => 0.999999)
      expect([low.firstOperand, low.secondOperand, low.correctAnswer]).toEqual([
        0, 0, 0,
      ])
      expect([
        high.firstOperand,
        high.secondOperand,
        high.correctAnswer,
      ]).toEqual([max, max, 2 * max])
      if (level <= 2)
        expect(high.correctAnswer).toBeLessThanOrEqual(level === 1 ? 20 : 100)
      const draws = [0, 0.999999]
      const subtraction = generateSubtraction(level, () => draws.shift() ?? 0.5)
      expect([
        subtraction.firstOperand,
        subtraction.secondOperand,
        subtraction.correctAnswer,
      ]).toEqual([max, 0, max])
      expect(generateSubtraction(level, () => 0).correctAnswer).toBe(0)
    },
  )

  it.each(levels)(
    'honors multiplication factor limits at level %s',
    (level) => {
      const low = generateMultiplication(level, () => 0)
      const high = generateMultiplication(level, () => 0.999999)
      expect([low.firstOperand, low.secondOperand]).toEqual([
        level === 4 ? 10 : 0,
        0,
      ])
      expect([high.firstOperand, high.secondOperand]).toEqual(
        [
          [5, 5],
          [10, 10],
          [9, 99],
          [99, 99],
        ][level - 1],
      )
    },
  )

  it.each(levels)('honors division boundaries at level %s', (level) => {
    const low = generateDivision(level, () => 0)
    const high = generateDivision(level, () => 0.999999)
    expect([low.firstOperand, low.secondOperand, low.correctAnswer]).toEqual([
      0, 1, 0,
    ])
    expect([high.secondOperand, high.correctAnswer]).toEqual(
      [
        [5, 5],
        [10, 10],
        [12, 12],
        [99, 99],
      ][level - 1],
    )
    if (level === 3) expect(high.firstOperand).toBe(144)
  })

  it('allows a divisor of one and a dividend of 144 at intermediate level', () => {
    const draws = [0, 0.999999]
    const q = generateDivision(3, () => draws.shift() ?? 0.5)
    expect([q.firstOperand, q.secondOperand, q.correctAnswer]).toEqual([
      144, 1, 144,
    ])
  })

  it('selects every enabled operation without selecting a disabled one', () => {
    const random = seededRandom()
    const seen = new Set(
      Array.from(
        { length: 100 },
        () => generateQuestion(operations, 2, random).operation,
      ),
    )
    expect(seen).toEqual(new Set(operations))
    for (let i = 0; i < 50; i++)
      expect(['addition', 'division']).toContain(
        generateQuestion(['addition', 'division'], 1, random).operation,
      )
  })

  it.each(
    [[], ['unknown'], ['addition', 'unknown'], null, Array(1)].map(
      (selection) => ({ selection }),
    ),
  )('rejects invalid operations: %j', ({ selection }) => {
    expect(() => generateQuestion(selection as MathOperation[], 1)).toThrow(
      RangeError,
    )
  })

  it.each([0, 5, NaN, '1', null])('rejects invalid difficulty %s', (level) => {
    expect(() =>
      generateQuestion('addition', level as DifficultyLevel),
    ).toThrow(RangeError)
  })

  it.each(combinations)(
    'bounds retries and supplies a complete fallback for %s level %s',
    (operation, level) => {
      const random = vi.fn(() => {
        throw new Error('random source unavailable')
      })
      expect(
        isValidGeneratedQuestion(generateQuestion(operation, level, random)),
      ).toBe(true)
      expect(random).toHaveBeenCalledTimes(3)
    },
  )

  it('recovers from a transient random-source failure', () => {
    const random = vi.fn(seededRandom()).mockImplementationOnce(() => {
      throw new Error('transient')
    })
    expect(
      isValidGeneratedQuestion(generateQuestion('division', 3, random)),
    ).toBe(true)
    expect(random.mock.calls.length).toBeGreaterThan(3)
  })

  it('discards an invalid generated result and retries before returning', () => {
    const createId = vi.spyOn(ids, 'createId').mockReturnValueOnce('')
    try {
      expect(
        isValidGeneratedQuestion(
          generateQuestion('addition', 1, seededRandom()),
        ),
      ).toBe(true)
      expect(createId).toHaveBeenCalledTimes(2)
    } finally {
      createId.mockRestore()
    }
  })
})

describe('answer choices', () => {
  it.each([
    ['addition', 8, 7, 15],
    ['subtraction', 15, 7, 8],
    ['multiplication', 8, 7, 56],
    ['division', 56, 7, 8],
    ['addition', 0, 0, 0],
    ['subtraction', 1, 1, 0],
    ['multiplication', 0, 5, 0],
    ['division', 0, 5, 0],
    ['division', 1, 1, 1],
  ] as const)(
    'generates safe choices for %s %s and %s',
    (operation, firstOperand, secondOperand, correctAnswer) => {
      const question = { operation, firstOperand, secondOperand, correctAnswer }
      const random = vi.fn(() => 0)
      const choices = generateAnswerChoices(question, random)
      expect(choices).toHaveLength(4)
      expect(new Set(choices).size).toBe(4)
      expect(choices).toContain(correctAnswer)
      expect(
        choices.every((value) => Number.isSafeInteger(value) && value >= 0),
      ).toBe(true)
      expect(random).toHaveBeenCalledTimes(15) // 12 bounded draws plus 3 shuffle swaps
    },
  )

  it('includes common operation mistakes and neighboring fact-family answers', () => {
    expect(
      distractorCandidates({
        operation: 'addition',
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 15,
      }),
    ).toEqual(expect.arrayContaining([1, 5, 25, 14, 16]))
    expect(
      distractorCandidates({
        operation: 'subtraction',
        firstOperand: 15,
        secondOperand: 7,
        correctAnswer: 8,
      }),
    ).toContain(22)
    expect(
      distractorCandidates({
        operation: 'multiplication',
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 56,
      }),
    ).toEqual(expect.arrayContaining([48, 64, 49, 63]))
    expect(
      distractorCandidates({
        operation: 'division',
        firstOperand: 56,
        secondOperand: 7,
        correctAnswer: 8,
      }),
    ).toEqual(expect.arrayContaining([7, 9]))
  })

  it('shuffles the correct answer into every position across deterministic random draws', () => {
    const random = seededRandom()
    const question = {
      operation: 'multiplication' as const,
      firstOperand: 8,
      secondOperand: 7,
      correctAnswer: 56,
    }
    const positions = new Set(
      Array.from({ length: 100 }, () =>
        generateAnswerChoices(question, random).indexOf(56),
      ),
    )
    expect(positions).toEqual(new Set([0, 1, 2, 3]))
  })
})

describe('question validation', () => {
  it.each([
    { choices: [2, 2, 3, 4] },
    { choices: [3, 4, 5, 6] },
    { choices: [2, -1, 3, 4] },
    { choices: [2, 1.5, 3, 4] },
    { choices: [2, 3, 4] },
    { choices: [2, 3, 4, 5, 6] },
    { choices: [2, '3', 4, 5] },
    { choices: Object.assign(Array<number>(4), { 0: 2, 1: 3, 2: 4 }) },
    { correctAnswer: 3 },
    { displayText: 'wrong' },
    { firstOperand: -1 },
    { secondOperand: Infinity },
    { id: '' },
    { source: 'unknown' },
    { difficulty: 5 },
    { operation: 'unknown' },
  ])('rejects malformed questions: %j', (patch) => {
    const question = generateAddition(1, () => 0.1)
    expect(question.correctAnswer).toBe(2)
    expect(isValidGeneratedQuestion({ ...question, ...patch })).toBe(false)
  })
  it('rejects division by zero and out-of-range operands', () => {
    const question = generateDivision(1, () => 0.5)
    expect(isValidGeneratedQuestion({ ...question, secondOperand: 0 })).toBe(
      false,
    )
    const q = generateAddition(1, () => 0)
    expect(
      isValidGeneratedQuestion({
        ...q,
        firstOperand: 11,
        displayText: '11 + 0 = ?',
        correctAnswer: 11,
        choices: [11, 12, 13, 14],
      }),
    ).toBe(false)
    expect(isValidGeneratedQuestion(null)).toBe(false)
  })
})
