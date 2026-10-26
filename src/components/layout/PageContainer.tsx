import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="page-container" tabIndex={-1}>
      {children}
    </main>
  )
}
