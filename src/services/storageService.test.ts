import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  APP_KEYS,
  DATA_KEY,
  defaultSettings,
  emptyData,
  loadData,
  saveData,
  clearApplicationStorage,
} from './storageService'
import { createPracticeRun, recordResult } from './practiceSession'
import { calculateStatistics, accuracy } from './statisticsService'

afterEach(() => vi.restoreAllMocks())
function history() {
  let run = createPracticeRun({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
  })
  run = recordResult(run, run.question.id, run.question.choices[0], true)
  return { ...emptyData(), sessions: [run.session], attempts: run.attempts }
}

describe('storage service', () => {
  it('uses defaults with empty storage and persists a versioned document across independent loads', () => {
    expect(loadData().data).toEqual(emptyData())
    const data = history()
    expect(saveData(data)).toBeNull()
    expect(loadData().data).toEqual(data)
    expect(loadData().data.attempts[0]).toMatchObject({
      selectedAnswer: data.attempts[0].selectedAnswer,
      selfReportedCorrect: true,
      sessionId: data.sessions[0].id,
      difficulty: 1,
      operation: 'addition',
    })
    expect(JSON.parse(localStorage.getItem(DATA_KEY)!).version).toBe(2)
  })
  it.each([undefined, 0, 1])(
    'migrates an initial envelope with version %s without losing progress',
    (version) => {
      const data = { ...history(), version }
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
      const loaded = loadData()
      expect(loaded.readOnly).toBe(false)
      expect(loaded.data.version).toBe(2)
      expect(loaded.data.attempts).toEqual(data.attempts)
      saveData(loaded.data)
      expect(JSON.parse(localStorage.getItem(DATA_KEY)!).version).toBe(2)
    },
  )
  it('protects unknown future schemas and leaves their raw data untouched', () => {
    const raw = JSON.stringify({ version: 99, privateFutureData: 'preserve' })
    localStorage.setItem(DATA_KEY, raw)
    expect(loadData().readOnly).toBe(true)
    expect(localStorage.getItem(DATA_KEY)).toBe(raw)
  })
  it('recovers invalid settings without discarding valid history and filters bad or duplicate records', () => {
    const data = history()
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({
        ...data,
        settings: { defaultDifficulty: 8 },
        attempts: [...data.attempts, data.attempts[0], { id: 'bad' }],
        sessions: [...data.sessions, { id: 'bad' }],
      }),
    )
    const loaded = loadData()
    expect(loaded.warning).toMatch(/invalid/)
    expect(loaded.data.settings).toEqual(defaultSettings())
    expect(loaded.data.attempts).toEqual(data.attempts)
    expect(loaded.data.sessions).toEqual(data.sessions)
  })
  it.each(['{broken', 'null', '[]'])(
    'recovers malformed JSON data %s',
    (raw) => {
      localStorage.setItem(DATA_KEY, raw)
      expect(loadData().warning).toBeTruthy()
      expect(loadData().data.attempts).toEqual([])
    },
  )
  it('caps recent sessions while preserving every lifetime attempt', () => {
    const data = history()
    data.sessions = Array.from({ length: 120 }, (_, index) => ({
      ...data.sessions[0],
      id: String(index),
      startedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    }))
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    const loaded = loadData().data
    expect(loaded.sessions).toHaveLength(100)
    expect(loaded.sessions[0].id).toBe('119')
    expect(loaded.attempts).toEqual(data.attempts)
  })
  it('handles blocked reads and quota failures without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('disabled', 'SecurityError')
    })
    expect(loadData().warning).toMatch(/unavailable/)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(saveData(emptyData())).toMatch(/could not be saved/)
  })
  it('clears only owned application keys, including reserved mistake-pattern data', () => {
    for (const key of APP_KEYS) localStorage.setItem(key, 'test')
    localStorage.setItem('unrelated.preference', 'keep')
    localStorage.setItem('mathPractice.unrelated', 'keep')
    expect(clearApplicationStorage()).toBeNull()
    for (const key of APP_KEYS) expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem('unrelated.preference')).toBe('keep')
    expect(localStorage.getItem('mathPractice.unrelated')).toBe('keep')
  })
  it('reports deletion failures', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(clearApplicationStorage()).toMatch(/could not be erased/)
  })
})

describe('statistics calculations', () => {
  it('handles empty history without division by zero', () => {
    const statistics = calculateStatistics([])
    expect(statistics.attempted).toBe(0)
    expect(accuracy(statistics)).toBe(0)
  })
  it('aggregates self-reported results across all four operations and levels', () => {
    const template = history().attempts[0]
    const operations = [
      'addition',
      'subtraction',
      'multiplication',
      'division',
    ] as const
    const attempts = operations.flatMap((operation, index) =>
      [true, false, true].map((correct, attemptIndex) => ({
        ...template,
        id: `${index}-${attemptIndex}`,
        operation,
        difficulty: (index + 1) as 1 | 2 | 3 | 4,
        selfReportedCorrect: correct,
      })),
    )
    const statistics = calculateStatistics(attempts)
    expect(statistics).toMatchObject({
      attempted: 12,
      correct: 8,
      incorrect: 4,
    })
    expect(accuracy(statistics)).toBe(67)
    for (const operation of operations)
      expect(statistics.byOperation[operation]).toEqual({
        attempted: 3,
        correct: 2,
        incorrect: 1,
      })
    for (const level of [1, 2, 3, 4] as const)
      expect(statistics.byDifficulty[level]).toEqual({
        attempted: 3,
        correct: 2,
        incorrect: 1,
      })
  })
})
