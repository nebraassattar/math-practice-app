import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../app/App'
import * as sound from '../services/soundService'
import { StrictMode } from 'react'
import {
  DATA_KEY,
  emptyData,
  saveData,
  loadData,
} from '../services/storageService'
import {
  createPracticeRun,
  finishRun,
  recordResult,
} from '../services/practiceSession'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function renderPage(path = '/settings', state: unknown = null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <App />
    </MemoryRouter>,
  )
}
function seedHistory() {
  let run = createPracticeRun({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
  })
  run = finishRun(
    recordResult(run, run.question.id, run.question.choices[0], true),
  )
  const data = {
    ...emptyData(),
    settings: { ...emptyData().settings, cardAnimationEnabled: false },
    sessions: [run.session],
    attempts: run.attempts,
  }
  saveData(data)
  return data
}

describe('saved statistics and settings', () => {
  it('does not duplicate session creation under StrictMode', () => {
    render(
      <StrictMode>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/practice/session',
              state: {
                operations: ['addition'],
                difficulty: 1,
                sessionLength: 5,
              },
            },
          ]}
        >
          <App />
        </MemoryRouter>
      </StrictMode>,
    )
    expect(loadData().data.sessions).toHaveLength(1)
  })

  it.each([true, false])(
    'applies saved sound, animation, and explanation preferences: %s',
    async (enabled) => {
      const user = userEvent.setup()
      const play = vi.spyOn(sound, 'playRevealSound').mockReturnValue(true)
      const data = emptyData()
      data.settings = {
        ...data.settings,
        soundEffectsEnabled: enabled,
        cardAnimationEnabled: enabled,
        showExplanations: enabled,
      }
      saveData(data)
      renderPage('/practice/session', {
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 5,
      })
      const animation = screen.getByRole('checkbox', {
        name: 'Animate card flips',
      })
      expect((animation as HTMLInputElement).checked).toBe(enabled)
      await user.click(
        within(
          screen.getByRole('group', { name: 'Answer choices' }),
        ).getAllByRole('button')[0],
      )
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      expect(play.mock.calls).toHaveLength(enabled ? 1 : 0)
      expect(Boolean(screen.queryByText(/^Combine /))).toBe(enabled)
    },
  )

  it('keeps saved history if a reset cannot be written', async () => {
    const user = userEvent.setup()
    seedHistory()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    renderPage('/statistics')
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(
      screen.getByRole('button', { name: 'Erase Practice History' }),
    )
    expect(loadData().data.attempts).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('could not be erased')
    expect(screen.getByRole('alert')).toHaveTextContent('No reset was applied')
  })

  it('saves preferences and loads them in a fresh app instance and practice setup', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await user.click(screen.getByRole('checkbox', { name: 'Sound effects' }))
    await user.click(screen.getByRole('checkbox', { name: 'Card animation' }))
    await user.click(
      screen.getByRole('checkbox', { name: 'Show explanations' }),
    )
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }))
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    await user.click(screen.getByRole('radio', { name: /^Intermediate/ }))
    await user.click(screen.getByRole('radio', { name: '20 questions' }))
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved.')
    view.unmount()
    renderPage('/practice/setup')
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /^Intermediate/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked()
    const saved = loadData().data.settings
    expect(saved).toMatchObject({
      soundEffectsEnabled: true,
      cardAnimationEnabled: false,
      showExplanations: false,
    })
    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }))
    expect(loadData().data.settings.defaultOperations).toEqual(['division'])
  })

  it('requires an operation before saving defaults', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }))
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeDisabled()
    expect(
      screen.getByText(/Choose at least one default operation/),
    ).toBeInTheDocument()
  })

  it('persists each attempt and completion once, displays history, and reloads without duplicates', async () => {
    const user = userEvent.setup()
    const view = renderPage('/practice/session', {
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
    })
    expect(loadData().data.sessions).toHaveLength(1)
    for (let index = 0; index < 5; index++) {
      await user.click(
        within(
          screen.getByRole('group', { name: 'Answer choices' }),
        ).getAllByRole('button')[0],
      )
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.click(
        screen.getByRole('button', {
          name: index === 0 ? 'I Got It Wrong' : 'I Got It Right',
        }),
      )
      expect(loadData().data.attempts).toHaveLength(index + 1)
    }
    expect(loadData().data.sessions[0]).toMatchObject({
      attempted: 5,
      correct: 4,
      incorrect: 1,
    })
    expect(loadData().data.sessions[0].completedAt).toBeTruthy()
    view.unmount()
    renderPage('/statistics')
    const all = screen
      .getByRole('heading', { name: 'All practice' })
      .closest('article')!
    expect(all).toHaveTextContent('80%')
    expect(all).toHaveTextContent('Attempted5')
    expect(
      screen.getByText(/Completed · Addition · Beginner/),
    ).toBeInTheDocument()
    expect(loadData().data.attempts).toHaveLength(5)
  }, 15000)

  it('confirms statistics reset, preserves preferences and unrelated storage, and supports cancel', async () => {
    const user = userEvent.setup()
    const seeded = seedHistory()
    localStorage.setItem('unrelated', 'keep')
    renderPage('/statistics')
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    let dialog = screen.getByRole('dialog', { name: 'Reset Statistics?' })
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(loadData().data.attempts).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    dialog = screen.getByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Erase Practice History' }),
    )
    expect(screen.getByText(/No questions attempted yet/)).toBeInTheDocument()
    expect(loadData().data.attempts).toEqual([])
    expect(loadData().data.sessions).toEqual([])
    expect(loadData().data.settings).toEqual(seeded.settings)
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('clears all app data only after confirmation, restores defaults, and goes home', async () => {
    const user = userEvent.setup()
    seedHistory()
    localStorage.setItem('mathPractice.mistakePatterns', '[{"future":"data"}]')
    localStorage.setItem('unrelated', 'keep')
    renderPage()
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(loadData().data.attempts).toHaveLength(1)
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Erase All Application Data' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Welcome, math explorer!' }),
    ).toBeInTheDocument()
    expect(localStorage.getItem(DATA_KEY)).toBeNull()
    expect(localStorage.getItem('mathPractice.mistakePatterns')).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
    await user.click(screen.getByRole('link', { name: 'Start Practice' }))
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
  })

  it('continues practicing in memory and warns when storage writes fail', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    renderPage('/practice/session', {
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
    })
    expect(
      screen
        .getAllByRole('alert')
        .some((alert) => alert.textContent?.includes('could not be saved')),
    ).toBe(true)
    await user.click(
      within(
        screen.getByRole('group', { name: 'Answer choices' }),
      ).getAllByRole('button')[0],
    )
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
  })

  it('does not overwrite a future schema when saving settings', async () => {
    const user = userEvent.setup()
    const raw = JSON.stringify({ version: 99, future: 'keep' })
    localStorage.setItem(DATA_KEY, raw)
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))
    expect(localStorage.getItem(DATA_KEY)).toBe(raw)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'newer saved-data version',
    )
  })
})
