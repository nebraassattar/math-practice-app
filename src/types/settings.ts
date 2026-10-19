import type { DifficultyLevel, MathOperation, Question } from './question.ts'
import type { MistakePattern } from './mistake.ts'
import type { PracticeAttempt, PracticeSession } from './session.ts'
import type { AppStatistics } from './statistics.ts'

export interface AppSettings {
  soundEffectsEnabled: boolean
  cardAnimationEnabled: boolean
  showExplanations: boolean
  defaultSessionLength: number | 'continuous'
  defaultDifficulty: DifficultyLevel
  defaultOperations: MathOperation[]
  masteryThreshold: number
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
