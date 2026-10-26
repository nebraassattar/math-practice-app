import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../app/App'

afterEach(cleanup)

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderSetup(path = '/practice/setup', state: unknown = null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}

const start = () => screen.getByRole('button', { name: 'Start Session' })

describe('Practice configuration', () => {
  it('loads sensible defaults and requires at least one operation', async () => {
    const user = userEvent.setup()
    renderSetup()
    expect(start()).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }))
    expect(start()).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Choose at least one operation',
    )
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    expect(start()).toBeEnabled()
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    expect(start()).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Choose at least one operation',
    )
    await user.click(start())
    expect(screen.getByTestId('location')).toHaveTextContent('/practice/setup')
  })

  it('selects multiple operations, toggles them independently, and selects all without duplicates', async () => {
    const user = userEvent.setup()
    renderSetup()
    const addition = screen.getByRole('checkbox', { name: 'Addition' })
    const multiplication = screen.getByRole('checkbox', {
      name: 'Multiplication',
    })
    await user.click(multiplication)
    expect(addition).toBeChecked()
    expect(multiplication).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Division' })).not.toBeChecked()
    await user.click(addition)
    expect(addition).not.toBeChecked()
    expect(multiplication).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Select All' }))
    await user.click(screen.getByRole('button', { name: 'Select All' }))
    for (const checkbox of screen.getAllByRole('checkbox'))
      expect(checkbox).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /^Easy/ }))
    await user.click(start())
    expect(
      screen.getByText('Addition, Subtraction, Multiplication, Division'),
    ).toBeInTheDocument()
  })

  it('allows exactly one difficulty and length, then hands off the chosen configuration', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }))
    await user.click(screen.getByRole('checkbox', { name: 'Subtraction' }))
    await user.click(screen.getByRole('checkbox', { name: 'Division' }))
    for (const level of ['Beginner', 'Easy', 'Intermediate', 'Advanced']) {
      await user.click(
        screen.getByRole('radio', { name: new RegExp(`^${level}`) }),
      )
      const group = screen.getByRole('group', {
        name: 'Choose your difficulty',
      })
      expect(
        within(group)
          .getAllByRole('radio')
          .filter((radio) => (radio as HTMLInputElement).checked),
      ).toHaveLength(1)
    }
    for (const label of [
      '5 questions',
      '20 questions',
      '10 questions',
      'Continuous practice',
    ]) {
      await user.click(screen.getByRole('radio', { name: label }))
      expect(screen.getByRole('radio', { name: label })).toBeChecked()
      const group = screen.getByRole('group', {
        name: 'Choose your session length',
      })
      expect(
        within(group)
          .getAllByRole('radio')
          .filter((radio) => (radio as HTMLInputElement).checked),
      ).toHaveLength(1)
    }
    await user.click(start())
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/practice/session',
    )
    expect(
      screen.getByRole('heading', { name: 'Practice Session' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Subtraction, Division')).toBeInTheDocument()
    expect(screen.getByText('Advanced')).toBeInTheDocument()
    expect(screen.getByText('Continuous practice')).toBeInTheDocument()
  })

  it.each([5, 10, 20] as const)(
    'hands off a fixed length of %s questions',
    async (length) => {
      const user = userEvent.setup()
      renderSetup()
      expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
      await user.click(screen.getByRole('radio', { name: /^Beginner/ }))
      await user.click(
        screen.getByRole('radio', { name: `${length} questions` }),
      )
      await user.click(start())
      expect(screen.getByText(`${length} questions`)).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/practice/session',
      )
    },
  )

  it('supports checkbox, radio, and submit keyboard interaction', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }))
    screen.getByRole('checkbox', { name: 'Addition' }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked()
    screen.getByRole('radio', { name: /^Beginner/ }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('radio', { name: /^Beginner/ })).toBeChecked()
    start().focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/practice/session',
    )
  })

  it.each([
    null,
    {},
    'invalid',
    { operations: [], difficulty: 1, sessionLength: 10 },
    { operations: ['addition'], difficulty: null, sessionLength: 10 },
    { operations: ['addition'], difficulty: 5, sessionLength: 10 },
    { operations: ['addition'], difficulty: '1', sessionLength: 10 },
    { operations: ['unknown'], difficulty: 1, sessionLength: 10 },
    { operations: ['addition', 'addition'], difficulty: 1, sessionLength: 10 },
    { operations: 'addition', difficulty: 1, sessionLength: 10 },
    { operations: ['addition'], difficulty: 1, sessionLength: 0 },
    { operations: ['addition'], difficulty: 1, sessionLength: '10' },
    { operations: ['addition'], difficulty: 1 },
  ])('returns missing or invalid configuration to setup: %j', (state) => {
    renderSetup('/practice/session', state)
    expect(screen.getByTestId('location')).toHaveTextContent('/practice/setup')
    expect(
      screen.getByRole('heading', { name: 'Practice Setup' }),
    ).toBeInTheDocument()
    expect(start()).toBeEnabled()
  })
})
