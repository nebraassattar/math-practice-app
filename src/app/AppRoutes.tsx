import { Route, Routes } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/practice/setup"
        element={
          <PlaceholderPage
            title="Practice Setup"
            description="You'll choose your operations, difficulty, and session length here."
          />
        }
      />
      <Route
        path="/practice/session"
        element={
          <PlaceholderPage
            title="Practice Session"
            description="Your math questions and answer cards will appear here."
          />
        }
      />
      <Route
        path="/practice/summary"
        element={
          <PlaceholderPage
            title="Session Summary"
            description="You'll see a summary of your finished practice here."
          />
        }
      />
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
