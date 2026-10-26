import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <>
      <section className="welcome" aria-labelledby="welcome-heading">
        <p className="eyebrow">Little steps. Big discoveries.</p>
        <h1 id="welcome-heading">Welcome, math explorer!</h1>
        <p>
          Every great adventure starts with a little curiosity. Let's explore
          numbers together, one step at a time.
        </p>
        <div className="math-symbols" aria-hidden="true">
          <span>+</span>
          <span>−</span>
          <span>×</span>
          <span>÷</span>
        </div>
      </section>
      <section aria-labelledby="explore-heading">
        <h2 id="explore-heading">Where would you like to go?</h2>
        <div className="home-actions">
          <div className="action-card practice-card">
            <h3>Explore numbers</h3>
            <p>Your practice adventure will start here.</p>
            <Link className="button button-primary" to="/practice/setup">
              Start Practice
            </Link>
          </div>
          <div className="action-card statistics-card">
            <h3>Watch your progress</h3>
            <p>A place for your learning journey.</p>
            <Link className="button" to="/statistics">
              View Statistics
            </Link>
          </div>
          <div className="action-card settings-card">
            <h3>Make it yours</h3>
            <p>A place to choose how you practice.</p>
            <Link className="button" to="/settings">
              Settings
            </Link>
          </div>
        </div>
        <p className="development-note">
          Ready to practice? Progress tracking and saved preferences are coming
          in later updates.
        </p>
      </section>
    </>
  )
}
