import { NavLink } from 'react-router-dom'

export function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul className="navigation">
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/practice/setup">Practice</NavLink>
        </li>
        <li>
          <NavLink to="/statistics">Statistics</NavLink>
        </li>
        <li>
          <NavLink to="/settings">Settings</NavLink>
        </li>
      </ul>
    </nav>
  )
}
