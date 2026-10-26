import type { SessionLength } from '../../types/practiceConfiguration'

const lengths: SessionLength[] = [5, 10, 20, 'continuous']

export function SessionLengthSelector({
  selected,
  onChange,
}: {
  selected: SessionLength
  onChange: (value: SessionLength) => void
}) {
  return (
    <fieldset className="setup-group">
      <legend>Choose your session length</legend>
      <div className="choice-grid">
        {lengths.map((value) => (
          <label className="choice" key={value}>
            <input
              type="radio"
              name="sessionLength"
              checked={selected === value}
              onChange={() => onChange(value)}
            />
            <span>
              {value === 'continuous'
                ? 'Continuous practice'
                : `${value} questions`}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
