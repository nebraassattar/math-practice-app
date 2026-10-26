import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="message-page">
      <p className="eyebrow">404 · Page not found</p>
      <h1>Let's find our way home</h1>
      <p>
        We couldn't find that page. Your next adventure is just a click away.
      </p>
      <Link className="button button-primary" to="/">
        Return Home
      </Link>
    </section>
  )
}
