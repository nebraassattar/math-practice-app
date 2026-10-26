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
          <span className="brand-name">Math Practice App</span>
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
