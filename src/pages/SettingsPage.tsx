import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../app/dataContext'
import { isSettings } from '../services/storageService'
import { OperationSelector } from '../components/practice/OperationSelector'
import { DifficultySelector } from '../components/practice/DifficultySelector'
import { SessionLengthSelector } from '../components/practice/SessionLengthSelector'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

export function SettingsPage() {
  const { data, saveSettings, clearAllData } = useAppData()
  const [draft, setDraft] = useState(() => ({
    ...data.settings,
    defaultOperations: [...data.settings.defaultOperations],
  }))
  const [message, setMessage] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const navigate = useNavigate()
  const valid = isSettings(draft)
  function save(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    const saved = saveSettings(draft)
    setMessage(
      saved
        ? 'Settings saved.'
        : 'Settings apply for this visit, but could not be saved in this browser.',
    )
  }
  return (
    <section className="setup-page">
      <p className="eyebrow">Make practice yours</p>
      <h1>Settings</h1>
      <p>
        Save your favorite starting choices. You can change them for an
        individual practice session.
      </p>
      <form onSubmit={save}>
        <fieldset className="setup-group">
          <legend>Practice preferences</legend>
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={draft.soundEffectsEnabled}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  soundEffectsEnabled: event.target.checked,
                })
              }
            />
            Sound effects
          </label>
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={draft.cardAnimationEnabled}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  cardAnimationEnabled: event.target.checked,
                })
              }
            />
            Card animation
          </label>
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={draft.showExplanations}
              onChange={(event) =>
                setDraft({ ...draft, showExplanations: event.target.checked })
              }
            />
            Show explanations
          </label>
          <p>
            Sound plays a short tone when an answer is revealed. Reduced-motion
            preferences always turn off card animations.
          </p>
        </fieldset>
        <OperationSelector
          selected={draft.defaultOperations}
          onChange={(defaultOperations) =>
            setDraft({ ...draft, defaultOperations })
          }
        />
        <DifficultySelector
          selected={draft.defaultDifficulty}
          onChange={(defaultDifficulty) =>
            setDraft({ ...draft, defaultDifficulty })
          }
        />
        <SessionLengthSelector
          selected={draft.defaultSessionLength}
          onChange={(defaultSessionLength) =>
            setDraft({ ...draft, defaultSessionLength })
          }
        />
        {!valid && (
          <p id="settings-validation">
            Choose at least one default operation before saving.
          </p>
        )}
        <button
          type="submit"
          className="button button-primary"
          disabled={!valid}
          aria-describedby={!valid ? 'settings-validation' : undefined}
        >
          Save Settings
        </button>
        <p role="status">{message}</p>
      </form>
      <section className="danger-zone">
        <h2>Clear application data</h2>
        <p>
          This removes settings, sessions, answers, and mistake data from this
          browser. It cannot be undone.
        </p>
        <button className="button" onClick={() => setConfirmClear(true)}>
          Clear All Application Data
        </button>
      </section>
      {confirmClear && (
        <ConfirmDialog
          title="Clear all application data?"
          message="This permanently erases all Math Practice App settings, practice history, and mistake data in this browser and restores the defaults. This cannot be undone."
          confirmLabel="Erase All Application Data"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            const cleared = clearAllData()
            setConfirmClear(false)
            if (cleared) navigate('/')
            else
              setMessage(
                'Some saved data could not be erased. Check browser storage permissions and try again.',
              )
          }}
        />
      )}
    </section>
  )
}
