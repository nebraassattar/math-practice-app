import { describe, expect, it } from 'vitest'
import { randomInt } from './math'
import { shuffle } from './shuffle'
import { createId } from './ids'

describe('randomInt', () => {
  it('includes both bounds, supports negative ranges, and handles a single value', () => {
    expect(randomInt(-3, 7, () => 0)).toBe(-3)
    expect(randomInt(-3, 7, () => 0.999999)).toBe(7)
    expect(randomInt(4, 4, () => 0.5)).toBe(4)
  })
  it.each([
    [2, 1],
    [0.5, 5],
    [0, Infinity],
    [0, Number.MAX_SAFE_INTEGER],
  ])('rejects invalid bounds %s..%s', (min, max) => {
    expect(() => randomInt(min, max)).toThrow(RangeError)
  })
  it.each([-0.1, 1, NaN, Infinity])(
    'rejects invalid randomness %s',
    (value) => {
      expect(() => randomInt(0, 10, () => value)).toThrow(RangeError)
    },
  )
})

describe('shuffle', () => {
  it('preserves all elements, leaves input unchanged, and can change their order', () => {
    const input = Object.freeze([1, 2, 3, 4])
    const result = shuffle(input, () => 0)
    expect(result).not.toEqual(input)
    expect([...result].sort()).toEqual([...input])
    expect(input).toEqual([1, 2, 3, 4])
    expect(shuffle(input, () => 0.999999)).toEqual(input)
  })
  it('handles empty arrays, single elements, and repeated values', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle(['a'])).toEqual(['a'])
    expect(shuffle([1, 1, 2], () => 0)).toEqual([1, 2, 1])
  })
})

describe('createId', () => {
  it('creates unique UUIDs', () => {
    const ids = Array.from({ length: 1000 }, createId)
    expect(new Set(ids).size).toBe(1000)
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
  })
})
