export function ProgressBar({
  attempted,
  total,
}: {
  attempted: number
  total: number | 'continuous'
}) {
  return (
    <div className="session-progress" aria-live="polite" aria-atomic="true">
      <p>
        {total === 'continuous'
          ? `Question ${attempted + 1} · Continuous practice`
          : `Question ${attempted + 1} of ${total}`}
      </p>
      {total !== 'continuous' && (
        <progress
          aria-label="Completed questions"
          value={attempted}
          max={total}
          aria-valuetext={`${attempted} of ${total} questions completed`}
        >
          {attempted} of {total} completed
        </progress>
      )}
      <p className="development-note">{attempted} completed</p>
    </div>
  )
}
