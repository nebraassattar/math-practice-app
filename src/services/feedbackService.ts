import { randomInt } from '../utils/math'
import type { RandomSource } from '../utils/math'
const positive = [
  'Nice work! Keep exploring.',
  'Great effort! Ready for another?',
  'You are building your math skills.',
  'One more step forward. Well done!',
]
const supportive = [
  'Every mistake is a chance to learn.',
  'Keep going. Practice helps you grow.',
  'Take your time. You can try again.',
  'Learning takes practice. You are making progress.',
]
export function encouragement(
  correct: boolean,
  previous = '',
  random: RandomSource = Math.random,
): string {
  const messages = correct ? positive : supportive
  const index = randomInt(0, messages.length - 1, random)
  return messages[index] === previous
    ? messages[(index + 1) % messages.length]
    : messages[index]
}
