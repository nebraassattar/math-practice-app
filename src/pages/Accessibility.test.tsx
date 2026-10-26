import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../app/App'
import {
  emptyData,
  loadData,
  saveData,
  defaultSettings,
  DATA_KEY,
} from '../services/storageService'

afterEach(cleanup)
function renderPage(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('accessibility and feedback preferences', () => {
  it('focuses new route headings and updates the document title after navigation', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('link', { name: 'View Statistics' }))
    expect(
      screen.getByRole('heading', { name: 'Statistics', level: 1 }),
    ).toHaveFocus()
    expect(document.title).toBe('Statistics | Math Practice App')
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Settings',
      }),
    )
    expect(
      screen.getByRole('heading', { name: 'Settings', level: 1 }),
    ).toHaveFocus()
  })
  it('persists the feedback option and preserves older version-2 preferences that lack it', async () => {
    const settings = defaultSettings()
    delete settings.feedbackEnabled
    settings.soundEffectsEnabled = true
    localStorage.setItem(DATA_KEY, JSON.stringify({ ...emptyData(), settings }))
    expect(loadData().data.settings).toMatchObject({
      feedbackEnabled: true,
      soundEffectsEnabled: true,
    })
    const user = userEvent.setup()
    const view = renderPage('/settings')
    await user.click(
      screen.getByRole('checkbox', { name: 'Encouraging feedback' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    view.unmount()
    renderPage('/settings')
    expect(
      screen.getByRole('checkbox', { name: 'Encouraging feedback' }),
    ).not.toBeChecked()
    expect(loadData().data.settings.soundEffectsEnabled).toBe(true)
  })
  it.each([true, false])(
    'respects feedback preference during real practice: %s',
    async (enabled) => {
      const data = emptyData()
      data.settings.feedbackEnabled = enabled
      saveData(data)
      const user = userEvent.setup()
      renderPage('/practice/setup')
      await user.click(screen.getByRole('button', { name: 'Start Session' }))
      await user.keyboard('1')
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
      if (enabled) expect(screen.getByRole('status')).not.toBeEmptyDOMElement()
      else expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(loadData().data.attempts[0].selfReportedCorrect).toBe(false)
    },
  )
})
