import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { ErrorMessage } from './ErrorMessage'
import { reportDevelopmentError } from '../../utils/developmentErrors'

export class ErrorBoundary extends Component<
  { children: ReactNode; resetKey?: string },
  { failed: boolean; resetKey?: string }
> {
  state: { failed: boolean; resetKey?: string } = { failed: false }
  static getDerivedStateFromProps(
    props: { resetKey?: string },
    state: { resetKey?: string },
  ) {
    return props.resetKey !== state.resetKey
      ? { failed: false, resetKey: props.resetKey }
      : null
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    reportDevelopmentError('The page could not be displayed.', {
      error,
      componentStack: info.componentStack,
    })
  }
  render() {
    return this.state.failed ? (
      <main className="page-container">
        <h1>Let’s take a little break</h1>
        <ErrorMessage message="This page could not be opened. Your saved practice history has not been cleared. Return home and try again." />
      </main>
    ) : (
      this.props.children
    )
  }
}
