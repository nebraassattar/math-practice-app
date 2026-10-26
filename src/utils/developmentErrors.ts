/** Diagnostics belong in the development console, never in child-facing messages. */
export function reportDevelopmentError(message: string, detail?: unknown) {
  if (import.meta.env.DEV) console.error(`[Math Practice] ${message}`, detail)
}
