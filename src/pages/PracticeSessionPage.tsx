import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppData } from '../app/dataContext'
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
import { eligiblePatterns } from '../services/mistakeService'
import { encouragement } from '../services/feedbackService'
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '../services/activeSessionService'
import type { ActiveSession } from '../services/activeSessionService'
import { SessionNavigationGuard } from '../components/practice/SessionNavigationGuard'

function ActivePractice({
  configuration,
  restored,
}: {
  configuration: PracticeConfiguration
  restored: ActiveSession | null
}) {
  const { data, saveProgress, saveSettings } = useAppData()
  const [run, setRun] = useState(
    () =>
      restored?.run ??
      createPracticeRun(
        configuration,
        data.mistakePatterns,
        data.settings.masteryThreshold,
      ),
  )
  const currentRun = useRef(run)
  const [recoveryFailed, setRecoveryFailed] = useState(false)
  const persistCard = useCallback(
    (selectedAnswer: number | null, revealed: boolean) => {
      if (!currentRun.current.isActive) return
      setRecoveryFailed(
        !saveActiveSession({
          version: 1,
          run: currentRun.current,
          selectedAnswer,
          revealed,
        }),
      )
    },
    [],
  )
  const [feedback, setFeedback] = useState('')
  const [feedbackCorrect, setFeedbackCorrect] = useState(true)
  const animationEnabled = data.settings.cardAnimationEnabled
  const initialSession = useRef(run)
  useEffect(() => {
    saveProgress(
      initialSession.current.session,
      initialSession.current.attempts,
    )
  }, [saveProgress])
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
    if (data.settings.feedbackEnabled !== false)
      setFeedback(encouragement(correct, feedback))
    setFeedbackCorrect(correct)
    currentRun.current = updated
    setRun(updated)
    saveProgress(updated.session, updated.attempts)
    if (updated.isActive)
      saveActiveSession({
        version: 1,
        run: updated,
        selectedAnswer: null,
        revealed: false,
      })
    else clearActiveSession()
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
    saveProgress(completed.session, completed.attempts)
    clearActiveSession()
    navigate('/practice/summary', {
      state: toSessionResult(completed),
      replace: true,
    })
  }

  function endAndLeave() {
    const completed = finishRun(currentRun.current)
    currentRun.current = completed
    saveProgress(completed.session, completed.attempts)
    clearActiveSession()
  }

  return (
    <section className="practice-page">
      <SessionNavigationGuard
        onLeave={endAndLeave}
        isActive={() => currentRun.current.isActive}
      />
      {recoveryFailed && (
        <p role="alert">
          This browser cannot save your current question. Keep this page open to
          continue practicing.
        </p>
      )}
      <p className="eyebrow">One question at a time</p>
      <h1>Practice Session</h1>
      {configuration.mode === 'mistake-review' && (
        <p className="review-badge">
          Mistake review ·{' '}
          {eligiblePatterns(run.reviewPatterns, configuration).length} active{' '}
          {eligiblePatterns(run.reviewPatterns, configuration).length === 1
            ? 'pattern'
            : 'patterns'}{' '}
          · {run.masteryThreshold} correct related answers to master a pattern
        </p>
      )}
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
      <p
        className={`feedback-message ${feedbackCorrect ? 'feedback-positive' : 'feedback-supportive'}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        hidden={!feedback || data.settings.feedbackEnabled === false}
      >
        {feedback}
      </p>
      <QuestionCard
        key={run.question.id}
        question={run.question}
        onResult={record}
        animationEnabled={animationEnabled}
        showExplanations={data.settings.showExplanations}
        soundEnabled={data.settings.soundEffectsEnabled}
        initialAnswer={
          restored?.run.question.id === run.question.id
            ? restored.selectedAnswer
            : null
        }
        initiallyRevealed={
          restored?.run.question.id === run.question.id && restored.revealed
        }
        onCardChange={persistCard}
      />
      <div className="session-controls">
        <label>
          <input
            type="checkbox"
            checked={animationEnabled}
            onChange={(event) =>
              saveSettings({
                ...data.settings,
                cardAnimationEnabled: event.target.checked,
              })
            }
          />{' '}
          Animate card flips
        </label>
        <button type="button" className="button" onClick={endSession}>
          End Session
        </button>
      </div>
      <p className="development-note">
        Your current question is saved for refreshes in this tab. Completed
        answers stay in your practice history. Leaving this page asks whether to
        end the session.
      </p>
    </section>
  )
}

function AdmittedPractice({
  configuration,
  restored,
}: {
  configuration: PracticeConfiguration
  restored: ActiveSession | null
}) {
  const { data } = useAppData()
  // Validate review availability once on entry; mastering the last pattern must
  // allow the active run to navigate to its summary instead of redirecting early.
  const [available] = useState(
    () =>
      restored !== null ||
      configuration.mode !== 'mistake-review' ||
      eligiblePatterns(data.mistakePatterns, configuration).length > 0,
  )
  return available ? (
    <ActivePractice configuration={configuration} restored={restored} />
  ) : (
    <Navigate
      to="/practice/setup"
      replace
      state={{ notice: 'review-unavailable' }}
    />
  )
}

export function PracticeSessionPage() {
  const { state, key }: { state: unknown; key: string } = useLocation()
  const { data } = useAppData()
  const [restored] = useState(() => {
    const snapshot = loadActiveSession()
    const saved = data.sessions.find(
      (session) => session.id === snapshot?.run.session.id,
    )
    // A failed recovery cleanup must not resurrect a finished or newer session.
    return saved?.completedAt ||
      (snapshot && saved && saved.attempted > snapshot.run.session.attempted)
      ? null
      : snapshot
  })
  const configuration = restored?.run.configuration ?? state
  if (!isPracticeConfiguration(configuration))
    return (
      <Navigate
        to="/practice/setup"
        replace
        state={{ notice: 'missing-session' }}
      />
    )
  return (
    <AdmittedPractice
      key={key}
      configuration={configuration}
      restored={restored}
    />
  )
}
