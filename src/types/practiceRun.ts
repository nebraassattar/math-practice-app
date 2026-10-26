import type { PracticeConfiguration } from './practiceConfiguration'
import type { PracticeAttempt, PracticeSession } from './session'
import type { Question } from './question'

export interface PracticeRun {
  configuration: PracticeConfiguration
  session: PracticeSession
  question: Question
  attempts: PracticeAttempt[]
  isActive: boolean
}

export interface SessionResult {
  configuration: PracticeConfiguration
  session: PracticeSession
  attempts: PracticeAttempt[]
}
