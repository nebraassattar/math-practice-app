import type { DifficultyLevel, MathOperation, Question } from './question.ts'
import type { MistakePattern } from './mistake.ts'
import type { PracticeAttempt, PracticeSession } from './session.ts'
import type { AppStatistics } from './statistics.ts'
import type { SessionLength } from './practiceConfiguration'

export interface AppSettings {
  soundEffectsEnabled: boolean
  cardAnimationEnabled: boolean
  showExplanations: boolean
  defaultSessionLength: SessionLength
  defaultDifficulty: DifficultyLevel
  defaultOperations: MathOperation[]
  masteryThreshold: number
  feedbackEnabled?: boolean
}

export interface AppState {
  settings: AppSettings
  currentSession: PracticeSession | null
  currentQuestion: Question | null
  currentQuestionIndex: number
  selectedAnswer: number | null
  isCardFlipped: boolean
  attempts: PracticeAttempt[]
  mistakePatterns: MistakePattern[]
  statistics: AppStatistics
}
