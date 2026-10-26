import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

// Existing feature tests exercise real secondary pages without unrelated loading delays.
// LazyRoutes.test.tsx explicitly unmocks this boundary to test actual code splitting.
vi.mock('../app/secondaryPages', async () => ({
  StatisticsPage: (await import('../pages/StatisticsPage')).StatisticsPage,
  SettingsPage: (await import('../pages/SettingsPage')).SettingsPage,
}))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
// jsdom has no native dialog implementation; browsers provide its modal focus behavior.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
