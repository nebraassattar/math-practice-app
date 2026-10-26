import { useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import { AnswerChoice } from './AnswerChoice'
import { playRevealSound } from '../../services/soundService'
import { explainQuestion } from '../../services/explanationService'

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
  const heading = useRef<HTMLHeadingElement>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  useEffect(() => {
    if (isCardFlipped) resultHeading.current?.focus()
  }, [isCardFlipped])

  function record(correct: boolean) {
    if (submitted.current || !isCardFlipped || selectedAnswer === null) return
    submitted.current = true
    onResult(question.id, selectedAnswer, correct)
  }

  return (
    <section
      className={`question-card${isCardFlipped ? ' flipped' : ''}${animationEnabled ? ' animate-card' : ''}`}
      aria-label="Question card"
    >
      {!isCardFlipped ? (
        <div className="card-front">
          <h2 className="math-question" ref={heading} tabIndex={-1}>
            {question.displayText}
          </h2>
          <div className="answer-grid" role="group" aria-label="Answer choices">
            {question.choices.map((value) => (
              <AnswerChoice
                key={value}
                value={value}
                selected={selectedAnswer === value}
                disabled={isCardFlipped}
                onSelect={() => setSelectedAnswer(value)}
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
            aria-expanded={false}
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
