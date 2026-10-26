import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { isSessionResult } from '../services/practiceSession'
import { difficulties, operations } from '../utils/practiceConfiguration'
import { useAppData } from '../app/dataContext'
import { eligiblePatterns } from '../services/mistakeService'
import { encouragement } from '../services/feedbackService'

export function SessionSummaryPage() {
  const { data } = useAppData()
  const { state }: { state: unknown } = useLocation()
  const [feedback] = useState(() =>
    isSessionResult(state) && state.attempts.length > 0
      ? encouragement(
          state.attempts[state.attempts.length - 1].selfReportedCorrect,
        )
      : '',
  )
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  if (!isSessionResult(state)) return <Navigate to="/practice/setup" replace />
  const { configuration, session, attempts } = state
  const activeCount = data.mistakePatterns.filter(
    (pattern) => !pattern.mastered,
  ).length
  const canReplay =
    configuration.mode !== 'mistake-review' ||
    eligiblePatterns(data.mistakePatterns, configuration).length > 0
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
      {data.settings.feedbackEnabled !== false && feedback && (
        <p className="feedback-message feedback-positive">{feedback}</p>
      )}
      {!canReplay && (
        <p>
          All matching mistake patterns are mastered. Nice work! Choose regular
          practice or a different set of mistakes next.
        </p>
      )}
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
        {canReplay ? (
          <Link
            className="button button-primary"
            to="/practice/session"
            state={configuration}
            replace
          >
            Practice Again
          </Link>
        ) : (
          <button className="button" disabled>
            Practice Again
          </button>
        )}
        {activeCount > 0 ? (
          <Link
            className="button"
            to="/practice/setup"
            state={{ ...configuration, mode: 'mistake-review' }}
          >
            Practice Mistakes
          </Link>
        ) : (
          <button
            className="button"
            type="button"
            disabled
            aria-describedby="mistake-review-help"
          >
            Practice Mistakes
          </button>
        )}
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
        {activeCount > 0
          ? `${activeCount} active mistake ${activeCount === 1 ? 'pattern is' : 'patterns are'} available for related practice.`
          : 'No active mistake patterns to review. Marking a future answer wrong makes related practice available.'}
      </p>
      <p className="development-note">
        Your practice history is saved in this browser. Clearing browser data
        removes saved progress.
      </p>
    </section>
  )
}
