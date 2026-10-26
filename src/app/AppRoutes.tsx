import { SessionSummaryPage } from '../pages/SessionSummaryPage'
import { Route, Routes } from 'react-router-dom'
import { PracticeSetupPage } from '../pages/PracticeSetupPage'
import { PracticeSessionPage } from '../pages/PracticeSessionPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { StatisticsPage, SettingsPage } from './secondaryPages'
import { Suspense } from 'react'

export function AppRoutes() {
  return (
    <Suspense fallback={<p role="status">Loading your page…</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<PracticeSessionPage />} />
        <Route path="/practice/summary" element={<SessionSummaryPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
