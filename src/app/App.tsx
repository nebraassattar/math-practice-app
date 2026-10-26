import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { AppRoutes } from './AppRoutes'

function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <PageContainer>
        <AppRoutes />
      </PageContainer>
    </>
  )
}

export default App
