import { Link } from 'react-router-dom'

export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="message-page">
      <p className="eyebrow">Coming soon · Placeholder page</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p>
        This feature is not available yet. Come back as our math adventure
        grows!
      </p>
      <Link className="button button-primary" to="/">
        Return Home
      </Link>
    </section>
  )
}
