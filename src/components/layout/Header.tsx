import { Link } from 'react-router-dom'
import { Navigation } from './Navigation'

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          Math Practice App
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
