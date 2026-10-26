export function AnswerChoice({
  value,
  selected,
  disabled,
  onSelect,
}: {
  value: number
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`answer-choice${selected ? ' selected' : ''}`}
      aria-label={`Answer ${value}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {value}
      {selected && (
        <span className="answer-selected" aria-hidden="true">
          Selected
        </span>
      )}
    </button>
  )
}
