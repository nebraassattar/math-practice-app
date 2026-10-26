import type { DifficultyLevel } from '../../types/question'
import { difficulties } from '../../utils/practiceConfiguration'

export function DifficultySelector({
  selected,
  onChange,
}: {
  selected: DifficultyLevel | null
  onChange: (value: DifficultyLevel) => void
}) {
  return (
    <fieldset className="setup-group">
      <legend>Choose your difficulty</legend>
      <p>
        Choose one level. Division answers will be whole numbers; subtraction
        answers will not be negative in the initial version.
      </p>
      <div className="choice-grid">
        {difficulties.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name="difficulty"
              value={option.value}
              checked={selected === option.value}
              onChange={() => onChange(option.value)}
              aria-describedby={`difficulty-${option.value}-help`}
            />
            <span>
              <strong>{option.label}</strong>
              <span
                className="choice-description"
                id={`difficulty-${option.value}-help`}
              >
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
