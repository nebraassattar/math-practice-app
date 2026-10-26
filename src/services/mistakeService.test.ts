import { describe, expect, it } from 'vitest'
import type { MistakePattern } from '../types/mistake'
import type { Question, MathOperation } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import { calculate, isValidGeneratedQuestion } from './questionRules'
import { generateQuestion, makeQuestion } from './questionGenerator'
import {
  eligiblePatterns,
  isMistakePattern,
  patternKey,
  prioritizePatterns,
  reviewPriority,
  selectReviewPattern,
  updateMistakePatterns,
  applyMasteryThreshold,
} from './mistakeService'
import {
  generateSimilarQuestion,
  similarQuestionCandidates,
} from './similarQuestionGenerator'
import {
  createPracticeRun,
  recordResult,
  isSessionResult,
  toSessionResult,
} from './practiceSession'
import { DATA_KEY, emptyData, loadData, saveData } from './storageService'
import { mistakeStatistics } from './mistakeStatistics'

function randomSource(seed = 42) {
  let state = seed
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}
function pattern(
  operation: MathOperation = 'multiplication',
  a = 8,
  b = 7,
  difficulty: 1 | 2 | 3 | 4 = 2,
): MistakePattern {
  return {
    id: `${operation}-${a}-${b}-${difficulty}`,
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: calculate(operation, a, b),
    difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    mastered: false,
    lastIncorrectAt: '2026-10-25T12:00:00.000Z',
  }
}
function attempt(q: Question, correct = false): PracticeAttempt {
  return {
    id: crypto.randomUUID(),
    questionId: q.id,
    sessionId: 'session',
    operation: q.operation,
    firstOperand: q.firstOperand,
    secondOperand: q.secondOperand,
    correctAnswer: q.correctAnswer,
    selectedAnswer: q.choices[0],
    selfReportedCorrect: correct,
    source: q.source,
    difficulty: q.difficulty,
    attemptedAt: '2026-10-26T12:00:00.000Z',
    ...(q.mistakePatternId ? { mistakePatternId: q.mistakePatternId } : {}),
  }
}
const all: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]

describe('mistake patterns and mastery', () => {
  it('creates a pattern from a wrong self-report and merges reversed commutative facts', () => {
    const q = makeQuestion('multiplication', 2, 8, 7)
    const first = updateMistakePatterns([], attempt(q))
    expect(first[0]).toMatchObject({
      operation: 'multiplication',
      firstOperand: 8,
      secondOperand: 7,
      correctAnswer: 56,
      incorrectCount: 1,
      similarCorrectCount: 0,
      mastered: false,
    })
    const updated = updateMistakePatterns(
      first,
      attempt(makeQuestion('multiplication', 2, 7, 8)),
    )
    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe(first[0].id)
    expect(updated[0].incorrectCount).toBe(2)
    expect(first[0].incorrectCount).toBe(1)
    expect(patternKey(pattern('addition', 3, 2))).toBe(
      patternKey(pattern('addition', 2, 3)),
    )
    expect(patternKey(pattern('subtraction', 3, 2))).not.toBe(
      patternKey(pattern('subtraction', 2, 3)),
    )
    expect(patternKey(pattern('division', 8, 2))).not.toBe(
      patternKey(pattern('division', 2, 8)),
    )
    expect(patternKey(pattern('addition', 3, 2, 1))).not.toBe(
      patternKey(pattern('addition', 3, 2, 2)),
    )
  })
  it('advances only related review successes, masters at three, and reactivates after another miss', () => {
    const original = pattern()
    let patterns = [original]
    patterns = updateMistakePatterns(
      patterns,
      attempt(makeQuestion('multiplication', 2, 8, 7), true),
    )
    expect(patterns[0].similarCorrectCount).toBe(0)
    for (let index = 1; index <= 3; index++) {
      patterns = updateMistakePatterns(
        patterns,
        attempt(
          generateSimilarQuestion(
            original,
            all,
            undefined,
            randomSource(index),
          ),
          true,
        ),
      )
      expect(patterns[0].similarCorrectCount).toBe(index)
      expect(patterns[0].mastered).toBe(index === 3)
    }
    patterns = updateMistakePatterns(
      patterns,
      attempt(makeQuestion('multiplication', 2, 7, 8)),
    )
    expect(patterns).toHaveLength(1)
    expect(patterns[0]).toMatchObject({
      id: original.id,
      mastered: false,
      similarCorrectCount: 0,
      incorrectCount: 2,
      lastIncorrectAt: '2026-10-26T12:00:00.000Z',
    })
  })
  it('a failed inverse review question updates only the original mistake pattern and resets progress', () => {
    const original = { ...pattern(), similarCorrectCount: 2 }
    const inverse = similarQuestionCandidates(original, all).find(
      (candidate) => candidate.strategy === 'fact-family',
    )!.question
    const updated = updateMistakePatterns([original], attempt(inverse))
    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      id: original.id,
      operation: 'multiplication',
      incorrectCount: 2,
      similarCorrectCount: 0,
      mastered: false,
    })
  })
  it('supports configurable mastery thresholds and rejects invalid thresholds', () => {
    const original = { ...pattern(), similarCorrectCount: 2 }
    expect(applyMasteryThreshold([original], 2)[0].mastered).toBe(true)
    expect(applyMasteryThreshold([original], 4)[0].mastered).toBe(false)
    expect(() => applyMasteryThreshold([original], 0)).toThrow(RangeError)
    expect(() =>
      updateMistakePatterns(
        [],
        attempt(makeQuestion('addition', 1, 1, 1)),
        1.5,
      ),
    ).toThrow(RangeError)
  })
  it('filters mastered and mismatched operations and difficulty', () => {
    const p = pattern()
    expect(
      eligiblePatterns(
        [
          p,
          { ...p, id: 'mastered', mastered: true },
          pattern('addition', 3, 2, 2),
          pattern('multiplication', 3, 2, 1),
        ],
        { operations: ['multiplication'], difficulty: 2, sessionLength: 5 },
      ),
    ).toEqual([p])
    expect(isMistakePattern({ ...p, firstOperand: -1 })).toBe(false)
    expect(isMistakePattern({ ...p, lastIncorrectAt: 'invalid' })).toBe(false)
  })
})

describe('review priority', () => {
  it('favors frequent, recent, and less successfully reviewed patterns', () => {
    const now = Date.parse('2026-10-26T12:00:00Z')
    const p = pattern()
    expect(reviewPriority({ ...p, incorrectCount: 3 }, now)).toBeGreaterThan(
      reviewPriority(p, now),
    )
    expect(
      reviewPriority({ ...p, lastIncorrectAt: '2026-10-26T12:00:00Z' }, now),
    ).toBeGreaterThan(reviewPriority(p, now))
    expect(reviewPriority(p, now)).toBeGreaterThan(
      reviewPriority({ ...p, similarCorrectCount: 2 }, now),
    )
    const options = [p, { ...p, id: 'high', incorrectCount: 20 }]
    expect(prioritizePatterns(options, () => 0.5, now)[0].id).toBe('high')
    const draws = randomSource()
    const selected = Array.from(
      { length: 1000 },
      () => selectReviewPattern(options, undefined, draws, now).id,
    )
    expect(selected.filter((id) => id === 'high').length).toBeGreaterThan(
      selected.filter((id) => id === p.id).length,
    )
  })
  it('mixes equal-priority patterns and avoids consecutive reuse when possible', () => {
    const p = pattern()
    const q = { ...p, id: 'other' }
    expect(prioritizePatterns([p, q], () => 0).map((item) => item.id)).toEqual([
      'other',
      p.id,
    ])
    expect(selectReviewPattern([p, q], p.id, () => 0).id).toBe(q.id)
    expect(selectReviewPattern([p], p.id).id).toBe(p.id)
    expect(() => selectReviewPattern([{ ...p, mastered: true }])).toThrow(
      /No active/,
    )
  })
})

describe('similar questions', () => {
  const cases = all.flatMap((operation) =>
    ([1, 2, 3, 4] as const).flatMap((level) =>
      [0, 0.5, 0.999999].map((draw) => ({ operation, level, draw })),
    ),
  )
  it.each(cases)(
    'keeps $operation level $level valid at random boundary $draw',
    ({ operation, level, draw }) => {
      const q = generateQuestion(operation, level, () => draw)
      const p: MistakePattern = {
        ...pattern(),
        id: 'boundary',
        operation,
        firstOperand: q.firstOperand,
        secondOperand: q.secondOperand,
        correctAnswer: q.correctAnswer,
        difficulty: level,
      }
      const random = randomSource()
      let previous: Question | undefined
      for (let index = 0; index < 10; index++) {
        const review = generateSimilarQuestion(p, all, previous, random)
        expect(isValidGeneratedQuestion(review)).toBe(true)
        expect(review).toMatchObject({
          source: 'mistake-review',
          mistakePatternId: p.id,
          difficulty: level,
        })
        expect(review.displayText).not.toBe(q.displayText)
        if (previous) expect(review.displayText).not.toBe(previous.displayText)
        previous = review
      }
    },
  )
  it.each(all)(
    'offers valid same-operation nearby questions for %s',
    (operation) => {
      const values = {
        addition: [3, 2],
        subtraction: [5, 2],
        multiplication: [8, 7],
        division: [56, 7],
      }
      const [a, b] = values[operation]
      const p = pattern(operation, a, b)
      const nearby = similarQuestionCandidates(p, all).filter(
        (candidate) => candidate.strategy === 'nearby',
      )
      expect(nearby.length).toBeGreaterThan(0)
      expect(
        nearby.every((candidate) => candidate.question.operation === operation),
      ).toBe(true)
      const reverse = similarQuestionCandidates(p, all).filter(
        (candidate) => candidate.strategy === 'reversed',
      )
      expect(reverse.length).toBe(
        operation === 'addition' || operation === 'multiplication' ? 1 : 0,
      )
      const inverse = similarQuestionCandidates(p, all).filter(
        (candidate) => candidate.strategy === 'fact-family',
      )
      expect(inverse.length).toBeGreaterThan(0)
      const expected = {
        addition: 'subtraction',
        subtraction: 'addition',
        multiplication: 'division',
        division: 'multiplication',
      }
      expect(
        inverse.every(
          (candidate) => candidate.question.operation === expected[operation],
        ),
      ).toBe(true)
    },
  )
  it('honors selected operations and rejects invalid patterns', () => {
    const p = pattern()
    for (let index = 0; index < 20; index++)
      expect(generateSimilarQuestion(p).operation).toBe('multiplication')
    expect(() => generateSimilarQuestion({ ...p, correctAnswer: 57 })).toThrow(
      /Invalid/,
    )
    expect(() => generateSimilarQuestion(p, [])).toThrow(/No related/)
  })
})

describe('review sessions and persistence', () => {
  it('mixes multiple active patterns in one session and masters them independently', () => {
    const patterns = [pattern(), pattern('addition', 3, 2)]
    let run = createPracticeRun(
      {
        operations: ['multiplication', 'addition'],
        difficulty: 2,
        sessionLength: 'continuous',
        mode: 'mistake-review',
      },
      patterns,
    )
    let previousId: string | undefined
    while (run.isActive && run.attempts.length < 10) {
      if (
        previousId &&
        run.reviewPatterns.filter((item) => !item.mastered).length > 1
      )
        expect(run.question.mistakePatternId).not.toBe(previousId)
      previousId = run.question.mistakePatternId
      run = recordResult(run, run.question.id, run.question.choices[0], true)
    }
    expect(run.attempts).toHaveLength(6)
    expect(
      new Set(run.attempts.map((item) => item.mistakePatternId)).size,
    ).toBe(2)
    expect(
      run.reviewPatterns.every(
        (item) => item.mastered && item.similarCorrectCount === 3,
      ),
    ).toBe(true)
  })
  it('ends even continuous practice when all eligible mistakes are mastered', () => {
    const p = pattern()
    const configuration = {
      operations: ['multiplication' as const],
      difficulty: 2 as const,
      sessionLength: 'continuous' as const,
      mode: 'mistake-review' as const,
    }
    let run = createPracticeRun(configuration, [p], 3)
    for (let index = 0; index < 3; index++) {
      expect(run.question.mistakePatternId).toBe(p.id)
      expect(run.question.source).toBe('mistake-review')
      run = recordResult(run, run.question.id, run.question.choices[0], true)
    }
    expect(run.isActive).toBe(false)
    expect(run.attempts).toHaveLength(3)
    expect(run.attempts.every((item) => item.mistakePatternId === p.id)).toBe(
      true,
    )
    expect(run.reviewPatterns[0].mastered).toBe(true)
    expect(isSessionResult(toSessionResult(run))).toBe(true)
  })
  it('migrates version-1 misses, preserves history/settings, and persists mastery across reloads', () => {
    const a = attempt(makeQuestion('multiplication', 2, 8, 7))
    const b = attempt(makeQuestion('multiplication', 2, 7, 8))
    const data = {
      ...emptyData(),
      version: 1,
      settings: { ...emptyData().settings, soundEffectsEnabled: true },
      attempts: [a, b],
    }
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    let migrated = loadData().data
    expect(migrated.version).toBe(2)
    expect(migrated.settings.soundEffectsEnabled).toBe(true)
    expect(migrated.attempts).toEqual([a, b])
    expect(migrated.mistakePatterns).toHaveLength(1)
    expect(migrated.mistakePatterns[0].incorrectCount).toBe(2)
    let patterns = migrated.mistakePatterns
    for (let index = 0; index < 3; index++)
      patterns = updateMistakePatterns(
        patterns,
        attempt(generateSimilarQuestion(patterns[0]), true),
      )
    migrated = { ...migrated, mistakePatterns: patterns }
    saveData(migrated)
    expect(loadData().data.mistakePatterns[0].mastered).toBe(true)
  })
  it('filters corrupt and duplicate stored patterns while keeping valid history', () => {
    const p = pattern()
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({
        ...emptyData(),
        mistakePatterns: [
          p,
          { ...p, id: 'duplicate' },
          { ...p, id: 'bad', correctAnswer: 0 },
        ],
      }),
    )
    const loaded = loadData()
    expect(loaded.warning).toMatch(/invalid/)
    expect(loaded.data.mistakePatterns).toEqual([p])
  })
  it('reports review totals and ties without ranking empty data as a missed operation', () => {
    expect(mistakeStatistics([], []).mostMissedOperations).toEqual([])
    const p = pattern()
    const q = pattern('addition', 3, 2)
    const wrong = [
      attempt(makeQuestion('multiplication', 2, 8, 7)),
      attempt(makeQuestion('addition', 2, 3, 2)),
    ]
    const reviewed = attempt(generateSimilarQuestion(p), true)
    const stats = mistakeStatistics(
      [p, { ...q, mastered: true }],
      [...wrong, reviewed],
    )
    expect(stats).toMatchObject({
      active: 1,
      mastered: 1,
      reviewed: 1,
      reviewCorrect: 1,
    })
    expect(stats.mostMissedOperations).toEqual(['Addition', 'Multiplication'])
    expect(stats.mostMissedFacts).toHaveLength(2)
  })
})
