import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  difficulties,
  isPracticeConfiguration,
  operations,
} from '../utils/practiceConfiguration'

export function PracticeSessionPage() {
  const { state }: { state: unknown } = useLocation()
  if (!isPracticeConfiguration(state))
    return <Navigate to="/practice/setup" replace />

  return (
    <section className="message-page">
      <p className="eyebrow">Configuration preview</p>
      <h1>Practice Session</h1>
      <p>
        Your choices arrived! Questions and practice sessions are coming in a
        later phase.
      </p>
      <dl className="configuration-summary">
        <dt>Operations</dt>
        <dd>
          {operations
            .filter((option) => state.operations.includes(option.value))
            .map((option) => option.label)
            .join(', ')}
        </dd>
        <dt>Difficulty</dt>
        <dd>
          {
            difficulties.find((option) => option.value === state.difficulty)
              ?.label
          }
        </dd>
        <dt>Session length</dt>
        <dd>
          {state.sessionLength === 'continuous'
            ? 'Continuous practice'
            : `${state.sessionLength} questions`}
        </dd>
      </dl>
      <Link className="button" to="/practice/setup">
        Change Choices
      </Link>
    </section>
  )
}
