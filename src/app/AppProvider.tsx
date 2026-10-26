import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DataContext } from './dataContext'
import type { AppSettings } from '../types/settings'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import {
  clearApplicationStorage,
  emptyData,
  isSettings,
  loadData,
  RECENT_SESSION_LIMIT,
  saveData,
} from '../services/storageService'
import type { StoredData } from '../services/storageService'
import {
  applyMasteryThreshold,
  updateMistakePatterns,
} from '../services/mistakeService'
import { clearActiveSession } from '../services/activeSessionService'

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => loadData())
  const [data, setData] = useState(loaded.data)
  const current = useRef(loaded.data)
  const readOnly = useRef(loaded.readOnly)
  const [warning, setWarning] = useState(loaded.warning)
  const commit = useCallback((next: StoredData, mustSave = false) => {
    const error = readOnly.current
      ? 'A newer saved-data version is protected. Changes in this visit cannot be saved.'
      : saveData(next)
    if (error && mustSave) {
      setWarning(
        'Saved practice history could not be erased. No reset was applied. Check browser storage and try again.',
      )
      return false
    }
    setWarning(error)
    current.current = next
    setData(next)
    return error === null
  }, [])
  const saveSettings = useCallback(
    (settings: AppSettings) => {
      if (!isSettings(settings)) return false
      if (
        !readOnly.current &&
        JSON.stringify(settings) === JSON.stringify(current.current.settings)
      )
        return true
      return commit({
        ...current.current,
        settings,
        mistakePatterns: applyMasteryThreshold(
          current.current.mistakePatterns,
          settings.masteryThreshold,
        ),
      })
    },
    [commit],
  )
  const saveProgress = useCallback(
    (session: PracticeSession, attempts: PracticeAttempt[] = []) => {
      const existing = current.current
      const knownIds = new Set(existing.attempts.map((attempt) => attempt.id))
      const fresh = attempts.filter((attempt) => {
        if (knownIds.has(attempt.id)) return false
        knownIds.add(attempt.id)
        return true
      })
      const previousSession = existing.sessions.find(
        (item) => item.id === session.id,
      )
      if (
        fresh.length === 0 &&
        previousSession &&
        JSON.stringify(previousSession) === JSON.stringify(session)
      )
        return
      // Do not let a duplicate mount overwrite a newer saved snapshot of this session.
      const latest =
        previousSession &&
        (previousSession.attempted > session.attempted ||
          (previousSession.completedAt && !session.completedAt))
          ? previousSession
          : session
      const sessions = [
        latest,
        ...existing.sessions.filter((item) => item.id !== session.id),
      ]
        .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
        .slice(0, RECENT_SESSION_LIMIT)
      commit({
        ...existing,
        sessions,
        attempts: [...existing.attempts, ...fresh],
        mistakePatterns: fresh.reduce(
          (patterns, attempt) =>
            updateMistakePatterns(
              patterns,
              attempt,
              existing.settings.masteryThreshold,
            ),
          existing.mistakePatterns,
        ),
      })
    },
    [commit],
  )
  const resetStatistics = useCallback(
    () =>
      commit(
        { ...current.current, sessions: [], attempts: [], mistakePatterns: [] },
        true,
      ),
    [commit],
  )
  const clearAllData = useCallback(() => {
    if (!clearActiveSession()) {
      setWarning(
        'Your current question could not be erased. Check browser storage permissions and try again.',
      )
      return false
    }
    const error = clearApplicationStorage()
    setWarning(error)
    if (error) return false
    readOnly.current = false
    const defaults = emptyData()
    current.current = defaults
    setData(defaults)
    return true
  }, [])
  return (
    <DataContext.Provider
      value={{
        data,
        warning,
        saveSettings,
        saveProgress,
        resetStatistics,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
