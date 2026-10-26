/** A short, neutral tone after a user action; failure never interrupts practice. */
export function playRevealSound(): boolean {
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 440
    gain.gain.setValueAtTime(0.04, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.onended = () => {
      void context.close().catch(() => {})
    }
    oscillator.start()
    oscillator.stop(context.currentTime + 0.12)
    return true
  } catch {
    return false
  }
}
