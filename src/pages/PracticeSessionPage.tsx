import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { PracticeConfiguration } from '../types/practiceConfiguration'
import {
  difficulties,
  isPracticeConfiguration,
  operations,
} from '../utils/practiceConfiguration'
import {
  createPracticeRun,
  finishRun,
  recordResult,
  toSessionResult,
} from '../services/practiceSession'
import { QuestionCard } from '../components/practice/QuestionCard'
import { ProgressBar } from '../components/practice/ProgressBar'

function ActivePractice({
  configuration,
}: {
  configuration: PracticeConfiguration
}) {
  const [run, setRun] = useState(() => createPracticeRun(configuration))
  const currentRun = useRef(run)
  const [animationEnabled, setAnimationEnabled] = useState(true)
  const navigate = useNavigate()

  function record(
    questionId: string,
    selectedAnswer: number,
    correct: boolean,
  ) {
    const updated = recordResult(
      currentRun.current,
      questionId,
      selectedAnswer,
      correct,
    )
    if (updated === currentRun.current) return
    currentRun.current = updated
    setRun(updated)
    if (!updated.isActive)
      navigate('/practice/summary', {
        state: toSessionResult(updated),
        replace: true,
      })
  }

  function endSession() {
    if (
      !window.confirm(
        'End this practice session and see your results? Your current unanswered question will not be counted.',
      )
    )
      return
    const completed = finishRun(currentRun.current)
    currentRun.current = completed
    setRun(completed)
    navigate('/practice/summary', {
      state: toSessionResult(completed),
      replace: true,
    })
  }

  return (
    <section className="practice-page">
      <p className="eyebrow">One question at a time</p>
      <h1>Practice Session</h1>
      <details className="practice-details">
        <summary>Your practice choices</summary>
        <dl className="configuration-summary">
          <dt>Operations</dt>
          <dd>
            {operations
              .filter((option) =>
                configuration.operations.includes(option.value),
              )
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
          <dt>Session length</dt>
          <dd>
            {configuration.sessionLength === 'continuous'
              ? 'Continuous practice'
              : `${configuration.sessionLength} questions`}
          </dd>
        </dl>
      </details>
      <ProgressBar
        attempted={run.attempts.length}
        total={configuration.sessionLength}
      />
      <QuestionCard
        key={run.question.id}
        question={run.question}
        onResult={record}
        animationEnabled={animationEnabled}
      />
      <div className="session-controls">
        <label>
          <input
            type="checkbox"
            checked={animationEnabled}
            onChange={(event) => setAnimationEnabled(event.target.checked)}
          />{' '}
          Animate card flips
        </label>
        <button type="button" className="button" onClick={endSession}>
          End Session
        </button>
      </div>
      <p className="development-note">
        Results are kept only for this visit. Practice history is not saved yet.
      </p>
    </section>
  )
}

export function PracticeSessionPage() {
  const { state, key }: { state: unknown; key: string } = useLocation()
  if (!isPracticeConfiguration(state))
    return <Navigate to="/practice/setup" replace />
  return <ActivePractice key={key} configuration={state} />
}
