import { createContext, useContext } from 'react'
import type { AppSettings } from '../types/settings'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import type { StoredData } from '../services/storageService'

export interface ApplicationData {
  data: StoredData
  warning: string | null
  saveSettings: (settings: AppSettings) => boolean
  saveProgress: (session: PracticeSession, attempts?: PracticeAttempt[]) => void
  resetStatistics: () => boolean
  clearAllData: () => boolean
}
export const DataContext = createContext<ApplicationData | null>(null)
export function useAppData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('Application data provider is missing.')
  return context
}
