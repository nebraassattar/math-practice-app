import { Link } from 'react-router-dom'

export function ErrorMessage({
  title = 'Something went wrong',
  message,
}: {
  title?: string
  message: string
}) {
  return (
    <section className="storage-warning" role="alert" aria-label={title}>
      <h2>{title}</h2>
      <p>{message}</p>
      <Link className="button" to="/">
        Return Home
      </Link>
    </section>
  )
}
