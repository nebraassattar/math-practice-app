import type { OperationStatistics } from '../../types/statistics'
import { accuracy } from '../../services/statisticsService'

export function StatisticsCard({
  title,
  statistics,
}: {
  title: string
  statistics: OperationStatistics
}) {
  return (
    <article className="statistics-card-panel">
      <h3>{title}</h3>
      <dl className="stat-values">
        <div>
          <dt>Attempted</dt>
          <dd>{statistics.attempted}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{statistics.correct}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{statistics.incorrect}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{accuracy(statistics)}%</dd>
        </div>
      </dl>
    </article>
  )
}
