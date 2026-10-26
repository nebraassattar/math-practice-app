export function AnswerChoice({
  value,
  selected,
  disabled,
  onSelect,
  shortcut,
  buttonRef,
}: {
  value: number
  selected: boolean
  disabled: boolean
  onSelect: () => void
  shortcut?: number
  buttonRef?: (button: HTMLButtonElement | null) => void
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      className={`answer-choice${selected ? ' selected' : ''}`}
      aria-label={`Answer ${value}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      aria-keyshortcuts={shortcut ? String(shortcut) : undefined}
    >
      {shortcut && (
        <kbd className="answer-index" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
      <span>{value}</span>
      {selected && (
        <span className="answer-selected" aria-hidden="true">
          Selected
        </span>
      )}
    </button>
  )
}
