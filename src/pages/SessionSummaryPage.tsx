import { useEffect, useRef } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { isSessionResult } from '../services/practiceSession'
import { difficulties, operations } from '../utils/practiceConfiguration'

export function SessionSummaryPage() {
  const { state }: { state: unknown } = useLocation()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  if (!isSessionResult(state)) return <Navigate to="/practice/setup" replace />
  const { configuration, session, attempts } = state
  const accuracy =
    session.attempted === 0
      ? 0
      : Math.round((session.correct / session.attempted) * 100)
  return (
    <section className="summary-page">
      <p className="eyebrow">Every step counts</p>
      <h1 ref={heading} tabIndex={-1}>
        Session Summary
      </h1>
      <p>
        Nice work making time to learn! Here's how you said your practice went.
      </p>
      <dl className="summary-totals">
        <div>
          <dt>Questions attempted</dt>
          <dd>{session.attempted}</dd>
        </div>
        <div>
          <dt>Correct answers</dt>
          <dd>{session.correct}</dd>
        </div>
        <div>
          <dt>Incorrect answers</dt>
          <dd>{session.incorrect}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{accuracy}%</dd>
        </div>
      </dl>
      <dl className="configuration-summary">
        <dt>Operations practiced</dt>
        <dd>
          {operations
            .filter((option) => configuration.operations.includes(option.value))
            .map((option) => option.label)
            .join(', ')}
        </dd>
        <dt>Difficulty</dt>
        <dd>
          {
            difficulties.find(
              (option) => option.value === configuration.difficulty,
            )?.label
          }
        </dd>
        <dt>Mistake-review questions</dt>
        <dd>
          {
            attempts.filter((attempt) => attempt.source === 'mistake-review')
              .length
          }
        </dd>
      </dl>
      <div className="summary-actions">
        <Link
          className="button button-primary"
          to="/practice/session"
          state={configuration}
          replace
        >
          Practice Again
        </Link>
        <button
          className="button"
          type="button"
          disabled
          aria-describedby="mistake-review-help"
        >
          Practice Mistakes
        </button>
        <Link className="button" to="/practice/setup">
          Change Settings
        </Link>
        <Link className="button" to="/statistics">
          View Statistics
        </Link>
        <Link className="button" to="/">
          Return Home
        </Link>
      </div>
      <p id="mistake-review-help" className="development-note">
        Practice Mistakes will be available when mistake review is added in a
        later phase.
      </p>
      <p className="development-note">
        Results are not saved after this visit. Statistics and app settings are
        coming later.
      </p>
    </section>
  )
}
