import type { AppSettings } from '../types/settings'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import {
  isDifficulty,
  isOperation,
  isValidArithmetic,
  calculate,
} from './questionRules'
import { isPracticeConfiguration } from '../utils/practiceConfiguration'
import type { MistakePattern } from '../types/mistake'
import {
  applyMasteryThreshold,
  isMistakePattern,
  patternKey,
  updateMistakePatterns,
} from './mistakeService'

export interface StoredData {
  version: 2
  settings: AppSettings
  sessions: PracticeSession[]
  attempts: PracticeAttempt[]
  mistakePatterns: MistakePattern[]
}

export function defaultSettings(): AppSettings {
  return {
    soundEffectsEnabled: false,
    cardAnimationEnabled: true,
    showExplanations: true,
    defaultOperations: ['addition'],
    defaultDifficulty: 1,
    defaultSessionLength: 10,
    masteryThreshold: 3,
    feedbackEnabled: true,
  }
}
export function emptyData(): StoredData {
  return {
    version: 2,
    settings: defaultSettings(),
    sessions: [],
    attempts: [],
    mistakePatterns: [],
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}
function id(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isSettings(value: unknown): value is AppSettings {
  return (
    record(value) &&
    ['soundEffectsEnabled', 'cardAnimationEnabled', 'showExplanations'].every(
      (key) => typeof value[key] === 'boolean',
    ) &&
    isPracticeConfiguration({
      operations: value.defaultOperations,
      difficulty: value.defaultDifficulty,
      sessionLength: value.defaultSessionLength,
    }) &&
    typeof value.masteryThreshold === 'number' &&
    Number.isSafeInteger(value.masteryThreshold) &&
    value.masteryThreshold > 0 &&
    (value.feedbackEnabled === undefined ||
      typeof value.feedbackEnabled === 'boolean')
  )
}

export function isStoredSession(value: unknown): value is PracticeSession {
  if (
    !record(value) ||
    !isPracticeConfiguration(value) ||
    !id(value.id) ||
    !timestamp(value.startedAt)
  )
    return false
  return (
    (value.completedAt === undefined ||
      (timestamp(value.completedAt) &&
        Date.parse(value.completedAt) >= Date.parse(value.startedAt))) &&
    count(value.attempted) &&
    count(value.correct) &&
    count(value.incorrect) &&
    value.correct + value.incorrect === value.attempted &&
    (value.sessionLength === 'continuous' ||
      value.attempted <= value.sessionLength)
  )
}

export function isStoredAttempt(value: unknown): value is PracticeAttempt {
  if (
    !record(value) ||
    !id(value.id) ||
    !id(value.questionId) ||
    !id(value.sessionId) ||
    !isOperation(value.operation) ||
    !isDifficulty(value.difficulty)
  )
    return false
  return (
    [
      value.firstOperand,
      value.secondOperand,
      value.correctAnswer,
      value.selectedAnswer,
    ].every(count) &&
    isValidArithmetic(
      value.operation,
      value.difficulty,
      value.firstOperand as number,
      value.secondOperand as number,
    ) &&
    calculate(
      value.operation,
      value.firstOperand as number,
      value.secondOperand as number,
    ) === value.correctAnswer &&
    typeof value.selfReportedCorrect === 'boolean' &&
    (value.source === 'regular' ||
      (value.source === 'mistake-review' && id(value.mistakePatternId))) &&
    timestamp(value.attemptedAt)
  )
}

export const DATA_KEY = 'mathPractice.data'
export const APP_KEYS = [
  DATA_KEY,
  'mathPractice.settings',
  'mathPractice.sessions',
  'mathPractice.attempts',
  'mathPractice.statistics',
  'mathPractice.mistakePatterns',
  'mathPractice.version',
]
export const RECENT_SESSION_LIMIT = 100

type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export interface LoadResult {
  data: StoredData
  warning: string | null
  readOnly: boolean
}

export function loadData(storage?: StorageAccess): LoadResult {
  const defaults = emptyData()
  try {
    const raw = (storage ?? window.localStorage).getItem(DATA_KEY)
    if (raw === null) return { data: defaults, warning: null, readOnly: false }
    const parsed: unknown = JSON.parse(raw)
    if (!record(parsed))
      return {
        data: defaults,
        warning:
          'Saved practice data could not be read. Starting with empty history and default settings.',
        readOnly: false,
      }
    // Initial migration: unversioned/version 0 records use the same categories as version 1.
    if (
      parsed.version !== undefined &&
      parsed.version !== 0 &&
      parsed.version !== 1 &&
      parsed.version !== 2
    )
      return {
        data: defaults,
        warning:
          'This practice data comes from a newer app version. It will be left untouched; changes in this visit will not be saved.',
        readOnly: true,
      }
    let repaired = false
    const settings = isSettings(parsed.settings)
      ? { ...defaultSettings(), ...parsed.settings }
      : ((repaired = true), defaults.settings)
    function records<T>(
      value: unknown,
      validate: (item: unknown) => item is T,
    ): T[] {
      if (!Array.isArray(value)) {
        repaired = true
        return []
      }
      const seen = new Set<string>()
      return Array.from(value).filter((item): item is T => {
        if (!validate(item)) {
          repaired = true
          return false
        }
        const identifier = (item as T & { id: string }).id
        if (seen.has(identifier)) {
          repaired = true
          return false
        }
        seen.add(identifier)
        return true
      })
    }
    const sessions = records(parsed.sessions, isStoredSession)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
      .slice(0, RECENT_SESSION_LIMIT)
    const attempts = records(parsed.attempts, isStoredAttempt)
    let mistakePatterns: MistakePattern[]
    if (parsed.version !== 2) {
      // Version 2 adds mistake patterns, seeded from the existing regular practice history.
      mistakePatterns = [...attempts]
        .sort((a, b) => Date.parse(a.attemptedAt) - Date.parse(b.attemptedAt))
        .reduce<MistakePattern[]>(
          (patterns, attempt) =>
            updateMistakePatterns(patterns, attempt, settings.masteryThreshold),
          [],
        )
    } else {
      const keys = new Set<string>()
      mistakePatterns = records(
        parsed.mistakePatterns,
        isMistakePattern,
      ).filter((pattern) => {
        const key = patternKey(pattern)
        if (keys.has(key)) {
          repaired = true
          return false
        }
        keys.add(key)
        return true
      })
    }
    mistakePatterns = applyMasteryThreshold(
      mistakePatterns,
      settings.masteryThreshold,
    )
    return {
      data: { version: 2, settings, sessions, attempts, mistakePatterns },
      warning: repaired
        ? 'Some saved records were invalid. Valid history was kept and invalid settings were restored to defaults.'
        : null,
      readOnly: false,
    }
  } catch {
    return {
      data: defaults,
      warning:
        'Browser storage is unavailable or saved data could not be read. You can still practice, but progress may not be saved.',
      readOnly: false,
    }
  }
}

/** One versioned document makes each session+attempt write atomic. */
export function saveData(
  data: StoredData,
  storage?: StorageAccess,
): string | null {
  try {
    ;(storage ?? window.localStorage).setItem(DATA_KEY, JSON.stringify(data))
    return null
  } catch {
    return 'Your changes are available for this visit, but could not be saved. Browser storage may be full or disabled.'
  }
}

export function clearApplicationStorage(
  storage?: StorageAccess,
): string | null {
  let failed = false
  for (const key of APP_KEYS) {
    try {
      ;(storage ?? window.localStorage).removeItem(key)
    } catch {
      failed = true
    }
  }
  return failed
    ? 'Some application data could not be erased. Please check browser storage permissions and try again.'
    : null
}
