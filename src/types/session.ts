import type {
  DifficultyLevel,
  MathOperation,
  QuestionSource,
} from './question.ts'

export interface PracticeAttempt {
  id: string
  questionId: string
  operation: MathOperation
  firstOperand: number
  secondOperand: number
  correctAnswer: number
  selectedAnswer: number
  selfReportedCorrect: boolean
  difficulty: DifficultyLevel
  source: QuestionSource
  attemptedAt: string
  sessionId: string
  mistakePatternId?: string
}

export interface PracticeSession {
  id: string
  startedAt: string
  completedAt?: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: number | 'continuous'
  attempted: number
  correct: number
  incorrect: number
  mode?: 'regular' | 'mistake-review'
}
