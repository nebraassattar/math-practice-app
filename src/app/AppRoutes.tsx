import { SessionSummaryPage } from '../pages/SessionSummaryPage'
import { Route, Routes } from 'react-router-dom'
import { PracticeSetupPage } from '../pages/PracticeSetupPage'
import { PracticeSessionPage } from '../pages/PracticeSessionPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { StatisticsPage } from '../pages/StatisticsPage'
import { SettingsPage } from '../pages/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/practice/setup" element={<PracticeSetupPage />} />
      <Route path="/practice/session" element={<PracticeSessionPage />} />
      <Route path="/practice/summary" element={<SessionSummaryPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
