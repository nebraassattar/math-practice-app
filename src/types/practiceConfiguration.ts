import type { DifficultyLevel, MathOperation } from './question'

export type SessionLength = 5 | 10 | 20 | 'continuous'

export interface PracticeConfiguration {
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  mode?: 'regular' | 'mistake-review'
}
