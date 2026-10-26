export type RandomSource = () => number

/** Return an integer in the inclusive range without silently accepting bad bounds. */
export function randomInt(
  min: number,
  max: number,
  random: RandomSource = Math.random,
): number {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max ||
    !Number.isSafeInteger(max - min + 1)
  ) {
    throw new RangeError('Expected safe integer bounds with min <= max.')
  }
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError(
      'Random source must return a number from 0 (inclusive) to 1 (exclusive).',
    )
  return min + Math.floor(value * (max - min + 1))
}
