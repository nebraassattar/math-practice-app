import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../app/dataContext'
import { accuracy, calculateStatistics } from '../services/statisticsService'
import { operations, difficulties } from '../utils/practiceConfiguration'
import { StatisticsCard } from '../components/statistics/StatisticsCard'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { MistakeStatistics } from '../components/statistics/MistakeStatistics'

export function StatisticsPage() {
  const { data, resetStatistics } = useAppData()
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')
  const statistics = useMemo(
    () => calculateStatistics(data.attempts),
    [data.attempts],
  )
  return (
    <section>
      <p className="eyebrow">Every step adds up</p>
      <h1>Statistics</h1>
      <p>
        These results use your self-reported answers and stay in this browser.
      </p>
      {statistics.attempted === 0 && (
        <p>
          No questions attempted yet.{' '}
          <Link to="/practice/setup">Start practicing</Link> to begin your
          learning journey.
        </p>
      )}
      <section aria-labelledby="overall-title">
        <h2 id="overall-title">Overall progress</h2>
        <StatisticsCard title="All practice" statistics={statistics} />
      </section>
      <section aria-labelledby="operation-title">
        <h2 id="operation-title">By operation</h2>
        <div className="statistics-grid">
          {operations.map((option) => (
            <StatisticsCard
              key={option.value}
              title={option.label}
              statistics={statistics.byOperation[option.value]}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="difficulty-title">
        <h2 id="difficulty-title">By difficulty</h2>
        <div className="statistics-grid">
          {difficulties.map((option) => (
            <StatisticsCard
              key={option.value}
              title={`Level ${option.value}: ${option.label}`}
              statistics={statistics.byDifficulty[option.value]}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="recent-title">
        <h2 id="recent-title">Recent sessions</h2>
        {data.sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <>
            <p>
              Up to 100 recent sessions. Overall totals include all saved
              attempts.
            </p>
            <ol className="recent-sessions">
              {[...data.sessions]
                .sort(
                  (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
                )
                .map((session) => (
                  <li key={session.id}>
                    <article>
                      <h3>
                        <time dateTime={session.startedAt}>
                          {new Date(session.startedAt).toLocaleString()}
                        </time>
                      </h3>
                      <p>
                        {session.completedAt ? 'Completed' : 'Unfinished'} ·{' '}
                        {session.operations
                          .map(
                            (operation) =>
                              operations.find(
                                (option) => option.value === operation,
                              )?.label,
                          )
                          .join(', ')}{' '}
                        ·{' '}
                        {
                          difficulties.find(
                            (option) => option.value === session.difficulty,
                          )?.label
                        }
                        {' · '}
                        {session.mode === 'mistake-review'
                          ? 'Mistake review'
                          : 'Regular practice'}
                      </p>
                      <dl className="stat-values">
                        <div>
                          <dt>Attempted</dt>
                          <dd>{session.attempted}</dd>
                        </div>
                        <div>
                          <dt>Correct</dt>
                          <dd>{session.correct}</dd>
                        </div>
                        <div>
                          <dt>Incorrect</dt>
                          <dd>{session.incorrect}</dd>
                        </div>
                        <div>
                          <dt>Accuracy</dt>
                          <dd>{accuracy(session)}%</dd>
                        </div>
                      </dl>
                    </article>
                  </li>
                ))}
            </ol>
          </>
        )}
      </section>
      <MistakeStatistics />
      <button className="button" onClick={() => setConfirmReset(true)}>
        Reset Statistics
      </button>
      <p role="status">{message}</p>
      {confirmReset && (
        <ConfirmDialog
          title="Reset Statistics?"
          message="Are you sure you want to erase all practice history, mistake patterns, and statistics? Settings will stay unchanged. This cannot be undone."
          confirmLabel="Erase Practice History"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            const saved = resetStatistics()
            setConfirmReset(false)
            setMessage(
              saved
                ? 'Practice history and statistics have been reset. Settings were kept.'
                : 'Practice history could not be erased. Please try again after checking browser storage.',
            )
          }}
        />
      )}
      <p className="development-note">
        Clearing browser data removes your saved progress and mistake patterns.
      </p>
    </section>
  )
}
