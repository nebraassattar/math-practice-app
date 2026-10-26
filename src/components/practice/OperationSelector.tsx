import type { MathOperation } from '../../types/question'
import { operations } from '../../utils/practiceConfiguration'

export function OperationSelector({
  selected,
  onChange,
}: {
  selected: MathOperation[]
  onChange: (value: MathOperation[]) => void
}) {
  return (
    <fieldset className="setup-group">
      <legend>Choose your operations</legend>
      <p id="operations-help">Choose one or more. Mix them for variety!</p>
      <button
        className="button"
        type="button"
        onClick={() => onChange(operations.map((option) => option.value))}
      >
        Select All
      </button>
      <div className="choice-grid" aria-describedby="operations-help">
        {operations.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, option.value]
                    : selected.filter((value) => value !== option.value),
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
