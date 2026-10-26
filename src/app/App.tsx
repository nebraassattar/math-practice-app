import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { AppRoutes } from './AppRoutes'
import { AppProvider } from './AppProvider'
import { useAppData } from './dataContext'
import { RouteAccessibility } from './RouteAccessibility'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { useLocation } from 'react-router-dom'

function StorageNotice() {
  const { warning } = useAppData()
  return warning ? (
    <p className="storage-warning" role="alert">
      {warning}
    </p>
  ) : null
}

function AppContent() {
  return (
    <AppProvider>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <RouteAccessibility />
      <PageContainer>
        <StorageNotice />
        <AppRoutes />
      </PageContainer>
    </AppProvider>
  )
}

function App() {
  const { key } = useLocation()
  return (
    <ErrorBoundary resetKey={key}>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
