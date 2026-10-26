import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { AppRoutes } from './AppRoutes'
import { AppProvider } from './AppProvider'
import { useAppData } from './dataContext'
import { RouteAccessibility } from './RouteAccessibility'

function StorageNotice() {
  const { warning } = useAppData()
  return warning ? (
    <p className="storage-warning" role="alert">
      {warning}
    </p>
  ) : null
}

function App() {
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

export default App
