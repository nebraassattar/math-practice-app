import { useEffect, useId, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import { AnswerChoice } from './AnswerChoice'
import { playRevealSound } from '../../services/soundService'
import { explainQuestion } from '../../services/explanationService'
import { spokenQuestion } from '../../utils/accessibility'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function QuestionCard({
  question,
  onResult,
  animationEnabled,
  showExplanations = false,
  soundEnabled = false,
}: {
  question: Question
  onResult: (
    questionId: string,
    selectedAnswer: number,
    correct: boolean,
  ) => void
  animationEnabled: boolean
  showExplanations?: boolean
  soundEnabled?: boolean
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const submitted = useRef(false)
  const answerButtons = useRef<(HTMLButtonElement | null)[]>([])
  const shortcutHelpId = useId()
  const reducedMotion = useReducedMotion()
  const heading = useRef<HTMLHeadingElement>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  useEffect(() => {
    if (isCardFlipped) resultHeading.current?.focus()
  }, [isCardFlipped])
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        isCardFlipped ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !/^[1-4]$/.test(event.key)
      )
        return
      if (document.querySelector('dialog[open]')) return
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="spinbutton"]',
        )
      )
        return
      const index = Number(event.key) - 1
      const value = question.choices[index]
      if (value === undefined) return
      event.preventDefault()
      setSelectedAnswer(value)
      answerButtons.current[index]?.focus()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [question.choices, isCardFlipped])

  function record(correct: boolean) {
    if (submitted.current || !isCardFlipped || selectedAnswer === null) return
    submitted.current = true
    onResult(question.id, selectedAnswer, correct)
  }

  return (
    <section
      className={`question-card${isCardFlipped ? ' flipped' : ''}${animationEnabled && !reducedMotion ? ' animate-card' : ''}`}
      aria-label="Question card"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isCardFlipped
          ? `The correct answer is ${question.correctAnswer}. You chose ${selectedAnswer}.`
          : ''}
      </p>
      {!isCardFlipped ? (
        <div className="card-front">
          <h2
            className="math-question"
            ref={heading}
            tabIndex={-1}
            aria-label={spokenQuestion(question)}
          >
            {question.displayText}
          </h2>
          <p className="keyboard-hint" id={shortcutHelpId}>
            Choose an answer. Use Tab and Enter or Space, or press 1–4.
          </p>
          <div
            className="answer-grid"
            role="group"
            aria-label="Answer choices"
            aria-describedby={shortcutHelpId}
          >
            {question.choices.map((value, index) => (
              <AnswerChoice
                key={value}
                value={value}
                selected={selectedAnswer === value}
                disabled={isCardFlipped}
                onSelect={() => setSelectedAnswer(value)}
                shortcut={index + 1}
                buttonRef={(element) => {
                  answerButtons.current[index] = element
                }}
              />
            ))}
          </div>
          <button
            className="button button-primary"
            type="button"
            disabled={selectedAnswer === null}
            onClick={() => {
              if (soundEnabled) playRevealSound()
              setIsCardFlipped(true)
            }}
          >
            Flip Card
          </button>
        </div>
      ) : (
        <div className="card-back">
          <h2 ref={resultHeading} tabIndex={-1}>
            Let's check your answer
          </h2>
          <p className="math-question">
            {question.displayText.replace('?', String(question.correctAnswer))}
          </p>
          <p>
            Correct answer: <strong>{question.correctAnswer}</strong>
          </p>
          <p>
            Your answer: <strong>{selectedAnswer}</strong>
          </p>
          <p>You decide how it went. Your choice records the result.</p>
          {showExplanations && (
            <p className="question-explanation">{explainQuestion(question)}</p>
          )}
          <div className="result-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => record(true)}
            >
              I Got It Right
            </button>
            <button
              className="button"
              type="button"
              onClick={() => record(false)}
            >
              I Got It Wrong
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
