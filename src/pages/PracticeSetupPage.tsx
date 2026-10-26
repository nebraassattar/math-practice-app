import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { OperationSelector } from '../components/practice/OperationSelector'
import { DifficultySelector } from '../components/practice/DifficultySelector'
import { SessionLengthSelector } from '../components/practice/SessionLengthSelector'
import type { DifficultyLevel, MathOperation } from '../types/question'
import type { SessionLength } from '../types/practiceConfiguration'
import { isPracticeConfiguration } from '../utils/practiceConfiguration'

export function PracticeSetupPage() {
  const [operations, setOperations] = useState<MathOperation[]>([])
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null)
  const [sessionLength, setSessionLength] = useState<SessionLength>(10)
  const navigate = useNavigate()
  const configuration = { operations, difficulty, sessionLength }
  const valid = isPracticeConfiguration(configuration)
  const message =
    operations.length === 0 && difficulty === null
      ? 'Choose at least one operation and a difficulty level to start.'
      : operations.length === 0
        ? 'Choose at least one operation to start.'
        : difficulty === null
          ? 'Choose a difficulty level to start.'
          : 'Your choices are ready!'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPracticeConfiguration(configuration))
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
