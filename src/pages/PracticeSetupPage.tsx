import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { OperationSelector } from '../components/practice/OperationSelector'
import { DifficultySelector } from '../components/practice/DifficultySelector'
import { SessionLengthSelector } from '../components/practice/SessionLengthSelector'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { SessionLength } from '../types/practiceConfiguration'
import { isPracticeConfiguration } from '../utils/practiceConfiguration'
import { useAppData } from '../app/dataContext'
import { eligiblePatterns } from '../services/mistakeService'

export function PracticeSetupPage() {
  const { data } = useAppData()
  const { state }: { state: unknown } = useLocation()
  const initial = isPracticeConfiguration(state) ? state : null
  const [operations, setOperations] = useState<MathOperation[]>(() => [
    ...(initial?.operations ?? data.settings.defaultOperations),
  ])
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(
    initial?.difficulty ?? data.settings.defaultDifficulty,
  )
  const [sessionLength, setSessionLength] = useState<SessionLength>(
    initial?.sessionLength ?? data.settings.defaultSessionLength,
  )
  const [mode, setMode] = useState<'regular' | 'mistake-review'>(
    initial?.mode ?? 'regular',
  )
  const navigate = useNavigate()
  const configuration = { operations, difficulty, sessionLength, mode }
  const activeCount = data.mistakePatterns.filter(
    (pattern) => !pattern.mastered,
  ).length
  const matchingCount = isPracticeConfiguration(configuration)
    ? eligiblePatterns(data.mistakePatterns, configuration).length
    : 0
  const valid =
    isPracticeConfiguration(configuration) &&
    (mode === 'regular' || matchingCount > 0)
  const message =
    operations.length === 0 && difficulty === null
      ? 'Choose at least one operation and a difficulty level to start.'
      : operations.length === 0
        ? 'Choose at least one operation to start.'
        : difficulty === null
          ? 'Choose a difficulty level to start.'
          : mode === 'mistake-review' && matchingCount === 0
            ? 'No active mistakes match these operations and difficulty. Try other choices or regular practice.'
            : 'Your choices are ready!'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (valid && isPracticeConfiguration(configuration))
      navigate('/practice/session', { state: configuration })
  }

  return (
    <section className="setup-page">
      <p className="eyebrow">Make it your adventure</p>
      <h1>Practice Setup</h1>
      <p>
        Pick what you'd like to explore. You can choose more than one operation!
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset className="setup-group">
          <legend>Choose your practice mode</legend>
          <p id="review-mode-help">
            {activeCount} active mistake{' '}
            {activeCount === 1 ? 'pattern' : 'patterns'}.{' '}
            {activeCount === 0
              ? 'Mistake review becomes available after an answer is marked wrong.'
              : 'Review related questions to build mastery.'}
          </p>
          <div className="choice-grid">
            <label className="choice">
              <input
                type="radio"
                name="practiceMode"
                checked={mode === 'regular'}
                onChange={() => setMode('regular')}
              />
              <span>Regular practice</span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="practiceMode"
                checked={mode === 'mistake-review'}
                disabled={activeCount === 0}
                aria-describedby="review-mode-help"
                onChange={() => setMode('mistake-review')}
              />
              <span>Mistake review</span>
            </label>
          </div>
          {mode === 'mistake-review' && (
            <p>
              {matchingCount} active{' '}
              {matchingCount === 1 ? 'pattern matches' : 'patterns match'} your
              current choices.
            </p>
          )}
        </fieldset>
        <OperationSelector selected={operations} onChange={setOperations} />
        <DifficultySelector selected={difficulty} onChange={setDifficulty} />
        <SessionLengthSelector
          selected={sessionLength}
          onChange={setSessionLength}
        />
        <p id="setup-validation" role="status">
          {message}
        </p>
        <button
          className="button button-primary"
          type="submit"
          disabled={!valid}
          aria-describedby="setup-validation"
        >
          Start Session
        </button>
      </form>
    </section>
  )
}
