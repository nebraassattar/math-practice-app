import type { PracticeConfiguration } from './practiceConfiguration'
import type { PracticeAttempt, PracticeSession } from './session'
import type { Question } from './question'
import type { MistakePattern } from './mistake'

export interface PracticeRun {
  configuration: PracticeConfiguration
  session: PracticeSession
  question: Question
  attempts: PracticeAttempt[]
  isActive: boolean
  reviewPatterns: MistakePattern[]
  masteryThreshold: number
}

export interface SessionResult {
  configuration: PracticeConfiguration
  session: PracticeSession
  attempts: PracticeAttempt[]
}
