import { Link } from 'react-router-dom'
import { useAppData } from '../../app/dataContext'
import { mistakeStatistics } from '../../services/mistakeStatistics'
import { symbols } from '../../services/questionRules'
import { difficulties } from '../../utils/practiceConfiguration'
import type { MistakePattern } from '../../types/mistake'

function fact(pattern: MistakePattern) {
  return `${pattern.firstOperand} ${symbols[pattern.operation]} ${pattern.secondOperand} = ${pattern.correctAnswer}`
}

function PatternList({
  patterns,
  threshold,
}: {
  patterns: MistakePattern[]
  threshold: number
}) {
  return (
    <ul className="pattern-list">
      {[...patterns]
        .sort(
          (a, b) =>
            b.incorrectCount - a.incorrectCount ||
            Date.parse(b.lastIncorrectAt) - Date.parse(a.lastIncorrectAt),
        )
        .map((pattern) => (
          <li key={pattern.id}>
            <article className="statistics-card-panel">
              <h3>{fact(pattern)}</h3>
              <p>
                {
                  difficulties.find(
                    (option) => option.value === pattern.difficulty,
                  )?.label
                }{' '}
                · {pattern.mastered ? 'Mastered' : 'Needs practice'}
              </p>
              <p>
                Marked wrong: {pattern.incorrectCount}{' '}
                {pattern.incorrectCount === 1 ? 'time' : 'times'}
              </p>
              <p>
                Mastery progress: {pattern.similarCorrectCount} / {threshold}{' '}
                correct related answers
              </p>
              <progress
                aria-label={`Mastery for ${fact(pattern)}, level ${pattern.difficulty}`}
                max={threshold}
                value={Math.min(threshold, pattern.similarCorrectCount)}
              />
              <p>
                Last marked wrong:{' '}
                <time dateTime={pattern.lastIncorrectAt}>
                  {new Date(pattern.lastIncorrectAt).toLocaleString()}
                </time>
              </p>
            </article>
          </li>
        ))}
    </ul>
  )
}

export function MistakeStatistics() {
  const { data } = useAppData()
  const statistics = mistakeStatistics(data.mistakePatterns, data.attempts)
  const active = data.mistakePatterns.filter((pattern) => !pattern.mastered)
  const mastered = data.mistakePatterns.filter((pattern) => pattern.mastered)
  const first = [...active].sort(
    (a, b) => b.incorrectCount - a.incorrectCount,
  )[0]
  return (
    <section aria-labelledby="mistake-statistics-title">
      <h2 id="mistake-statistics-title">Mistake review</h2>
      <dl className="summary-totals">
        <div>
          <dt>Active mistake patterns</dt>
          <dd>{statistics.active}</dd>
        </div>
        <div>
          <dt>Mastered patterns</dt>
          <dd>{statistics.mastered}</dd>
        </div>
        <div>
          <dt>Similar questions practiced</dt>
          <dd>{statistics.reviewed}</dd>
        </div>
        <div>
          <dt>Review questions correct</dt>
          <dd>{statistics.reviewCorrect}</dd>
        </div>
      </dl>
      <p>
        Most frequently missed{' '}
        {statistics.mostMissedOperations.length > 1
          ? 'operations (tie)'
          : 'operation'}
        : {statistics.mostMissedOperations.join(', ') || 'No mistakes yet.'}
      </p>
      {statistics.mostMissedFacts.length > 0 ? (
        <>
          <h3>
            Frequently missed facts
            {statistics.mostMissedFacts.length > 1 ? ' (tie)' : ''}
          </h3>
          <ul>
            {statistics.mostMissedFacts.map((pattern) => (
              <li key={pattern.id}>
                {fact(pattern)} · {pattern.incorrectCount}{' '}
                {pattern.incorrectCount === 1 ? 'miss' : 'misses'} · Level{' '}
                {pattern.difficulty}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No missed facts yet. Keep exploring!</p>
      )}
      {first && (
        <Link
          className="button button-primary"
          to="/practice/setup"
          state={{
            operations: [
              ...new Set(active.map((pattern) => pattern.operation)),
            ],
            difficulty: first.difficulty,
            sessionLength: data.settings.defaultSessionLength,
            mode: 'mistake-review',
          }}
        >
          Practice Mistakes
        </Link>
      )}
      <h3>Active patterns</h3>
      {active.length > 0 ? (
        <PatternList
          patterns={active}
          threshold={data.settings.masteryThreshold}
        />
      ) : (
        <p>No active mistake patterns to review.</p>
      )}
      <details>
        <summary>Mastered patterns ({mastered.length})</summary>
        {mastered.length > 0 ? (
          <PatternList
            patterns={mastered}
            threshold={data.settings.masteryThreshold}
          />
        ) : (
          <p>No mastered patterns yet.</p>
        )}
      </details>
      <p className="development-note">
        Mastery uses correct related answers in review mode. A new wrong
        self-report resets that pattern's progress.
      </p>
    </section>
  )
}
