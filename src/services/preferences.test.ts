import { describe, expect, it, vi, afterEach } from 'vitest'
import { explainQuestion } from './explanationService'
import { playRevealSound } from './soundService'
import { generateQuestion } from './questionGenerator'

afterEach(() => vi.unstubAllGlobals())
describe('practice preferences', () => {
  it.each(['addition', 'subtraction', 'multiplication', 'division'] as const)(
    'provides a matching explanation for %s',
    (operation) => {
      const question = generateQuestion(operation, 1, () => 0.5)
      const explanation = explainQuestion(question)
      expect(explanation).toContain(String(question.firstOperand))
      expect(explanation).toContain(String(question.secondOperand))
      expect(explanation).toContain(String(question.correctAnswer))
    },
  )
  it('handles unavailable sound without interrupting practice', () => {
    vi.stubGlobal('AudioContext', undefined)
    expect(playRevealSound()).toBe(false)
  })
  it('plays a short tone with a gain ramp and closes its audio context', () => {
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
    const oscillator = {
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as null | (() => void),
    }
    const close = vi.fn(() => Promise.resolve())
    vi.stubGlobal(
      'AudioContext',
      class {
        currentTime = 0
        destination = {}
        createGain = () => gain
        createOscillator = () => oscillator
        close = close
      },
    )
    expect(playRevealSound()).toBe(true)
    expect(oscillator.start).toHaveBeenCalledOnce()
    expect(oscillator.stop).toHaveBeenCalledWith(0.12)
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.001,
      0.12,
    )
    oscillator.onended?.()
    expect(close).toHaveBeenCalledOnce()
  })
})
