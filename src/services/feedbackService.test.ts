import { describe, expect, it } from 'vitest'
import { encouragement } from './feedbackService'
import { spokenQuestion } from '../utils/accessibility'
import { makeQuestion } from './questionGenerator'

describe('encouragement', () => {
  it.each([true, false])(
    'varies supportive messages without immediately repeating: %s',
    (correct) => {
      const first = encouragement(correct, '', () => 0)
      expect(encouragement(correct, first, () => 0)).not.toBe(first)
      const messages = [0, 0.3, 0.6, 0.999999].map((draw) =>
        encouragement(correct, '', () => draw),
      )
      expect(new Set(messages).size).toBe(4)
      for (const message of messages)
        expect(message).not.toMatch(/stupid|failure|bad at|wrong again/i)
    },
  )
  it.each(['addition', 'subtraction', 'multiplication', 'division'] as const)(
    'speaks %s in clear words',
    (operation) => {
      const question = makeQuestion(
        operation,
        2,
        operation === 'division' ? 6 : 3,
        2,
      )
      const words = {
        addition: 'plus',
        subtraction: 'minus',
        multiplication: 'times',
        division: 'divided by',
      }
      expect(spokenQuestion(question)).toBe(
        `${question.firstOperand} ${words[operation]} 2 equals what?`,
      )
    },
  )
})
