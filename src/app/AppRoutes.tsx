import { SessionSummaryPage } from '../pages/SessionSummaryPage'
import { Route, Routes } from 'react-router-dom'
import { PracticeSetupPage } from '../pages/PracticeSetupPage'
import { PracticeSessionPage } from '../pages/PracticeSessionPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/practice/setup" element={<PracticeSetupPage />} />
      <Route path="/practice/session" element={<PracticeSessionPage />} />
      <Route path="/practice/summary" element={<SessionSummaryPage />} />
      <Route
        path="/statistics"
        element={
          <PlaceholderPage
            title="Statistics"
            description="Your practice history and progress will appear here."
          />
        }
      />
      <Route
        path="/settings"
        element={
          <PlaceholderPage
            title="Settings"
            description="You'll choose your practice preferences here."
          />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
