import { randomInt } from './math'
import type { RandomSource } from './math'

/** Fisher–Yates shuffle; leave the source array untouched. */
export function shuffle<T>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomInt(0, index, random)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}
