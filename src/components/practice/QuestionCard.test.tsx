import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

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
    expect(
      screen.getByRole('heading', { name: '2 plus 3 equals what?' }),
    ).toHaveFocus()
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

describe('accessible card interaction', () => {
  it('selects and focuses answers with 1–4, announces revealed answers, and locks shortcuts after flipping', async () => {
    const user = userEvent.setup()
    render(
      <QuestionCard
        question={question}
        onResult={vi.fn()}
        animationEnabled={false}
      />,
    )
    for (let index = 0; index < 4; index++) {
      await user.keyboard(String(index + 1))
      const answer = screen.getByRole('button', {
        name: `Answer ${question.choices[index]}`,
      })
      expect(answer).toHaveAttribute('aria-pressed', 'true')
      expect(answer).toHaveAttribute('aria-keyshortcuts', String(index + 1))
      expect(answer).toHaveFocus()
      expect(screen.getByText('Selected')).toBeVisible()
    }
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    const announcement = screen.getByText(
      'The correct answer is 5. You chose 7.',
    )
    expect(announcement).toHaveAttribute('aria-live', 'polite')
    await user.keyboard('1')
    expect(screen.getByText(/Your answer:/)).toHaveTextContent('7')
  })

  it('ignores text/number inputs, editable content, browser shortcuts, repeats, and open dialogs', async () => {
    const user = userEvent.setup()
    const view = render(
      <>
        <input aria-label="Text entry" />
        <input type="number" aria-label="Number entry" />
        <textarea aria-label="Notes" />
        <div
          contentEditable
          role="textbox"
          aria-label="Editable text"
          suppressContentEditableWarning
        />
        <QuestionCard
          question={question}
          onResult={vi.fn()}
          animationEnabled={false}
        />
      </>,
    )
    await user.type(screen.getByRole('textbox', { name: 'Text entry' }), '1234')
    expect(screen.getByRole('textbox', { name: 'Text entry' })).toHaveValue(
      '1234',
    )
    await user.type(
      screen.getByRole('spinbutton', { name: 'Number entry' }),
      '3',
    )
    await user.type(screen.getByRole('textbox', { name: 'Notes' }), '2')
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Editable text' }), {
      key: '4',
    })
    const heading = screen.getByRole('heading', {
      name: '2 plus 3 equals what?',
    })
    heading.focus()
    for (const modifiers of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { repeat: true },
      { isComposing: true },
    ])
      expect(fireEvent.keyDown(heading, { key: '1', ...modifiers })).toBe(true)
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    view.rerender(
      <>
        <dialog open>
          <button>Modal control</button>
        </dialog>
        <QuestionCard
          question={question}
          onResult={vi.fn()}
          animationEnabled={false}
        />
      </>,
    )
    fireEvent.keyDown(window, { key: '1' })
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  })

  it('responds to reduced-motion changes and still works when animations are disabled', async () => {
    let reduced = false
    const listeners = new Set<() => void>()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return reduced
        },
        addEventListener: (_event: string, callback: () => void) =>
          listeners.add(callback),
        removeEventListener: (_event: string, callback: () => void) =>
          listeners.delete(callback),
      })),
    )
    const user = userEvent.setup()
    const view = render(
      <QuestionCard question={question} onResult={vi.fn()} animationEnabled />,
    )
    const card = screen.getByRole('region', { name: 'Question card' })
    expect(card).toHaveClass('animate-card')
    act(() => {
      reduced = true
      listeners.forEach((listener) => listener())
    })
    expect(card).not.toHaveClass('animate-card')
    await user.keyboard('2')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByText('2 + 3 = 5')).toBeVisible()
    act(() => {
      reduced = false
      listeners.forEach((listener) => listener())
    })
    view.rerender(
      <QuestionCard
        question={question}
        onResult={vi.fn()}
        animationEnabled={false}
      />,
    )
    expect(card).not.toHaveClass('animate-card')
    view.unmount()
    expect(listeners.size).toBe(0)
  })
})
