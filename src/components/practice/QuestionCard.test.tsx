import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QuestionCard } from './QuestionCard'
import type { Question } from '../../types/question'

const question: Question = {
  id: 'first',
  operation: 'addition',
  firstOperand: 2,
  secondOperand: 3,
  correctAnswer: 5,
  choices: [4, 5, 6, 7],
  difficulty: 1,
  displayText: '2 + 3 = ?',
  source: 'regular',
}
afterEach(cleanup)

describe('QuestionCard', () => {
  it('requires an answer, supports changing it, then reveals a locked answer', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(
      <QuestionCard
        question={question}
        onResult={onResult}
        animationEnabled={false}
      />,
    )
    const flip = screen.getByRole('button', { name: 'Flip Card' })
    expect(flip).toBeDisabled()
    expect(screen.getByRole('heading', { name: '2 + 3 = ?' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Answer 4' }))
    expect(screen.getByRole('button', { name: 'Answer 4' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(flip).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Answer 5' }))
    expect(screen.getByRole('button', { name: 'Answer 4' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(onResult).not.toHaveBeenCalled()
    await user.click(flip)
    expect(
      screen.queryByRole('group', { name: 'Answer choices' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument()
    expect(screen.getByText(/Your answer:/)).toHaveTextContent('Your answer: 5')
    expect(
      screen.getByRole('heading', { name: "Let's check your answer" }),
    ).toHaveFocus()
    const right = screen.getByRole('button', { name: 'I Got It Right' })
    fireEvent.click(right)
    fireEvent.click(right)
    fireEvent.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(onResult).toHaveBeenCalledExactlyOnceWith('first', 5, true)
  })

  it('records wrong self-reports and resets selection and flip state for the next card', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    const { rerender } = render(
      <QuestionCard
        key={question.id}
        question={question}
        onResult={onResult}
        animationEnabled
      />,
    )
    screen.getByRole('button', { name: 'Answer 5' }).focus()
    await user.keyboard(' ')
    screen.getByRole('button', { name: 'Flip Card' }).focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(onResult).toHaveBeenCalledExactlyOnceWith('first', 5, false)
    rerender(
      <QuestionCard
        key="second"
        question={{ ...question, id: 'second' }}
        onResult={onResult}
        animationEnabled
      />,
    )
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    for (const button of screen.getAllByRole('button', { name: /^Answer / }))
      expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('Your answer:')).not.toBeInTheDocument()
  })
})
