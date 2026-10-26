# Math Practice App

A browser-based arithmetic practice application being built in phases for children ages 7–12. No account or backend is required.

## Current implementation

- Phases 1–2: React, Vite, TypeScript, shared types, tests, linting, formatting, responsive layout, home page, navigation, and unknown-route fallback.
- Phase 3: operation, difficulty, and session-length configuration with validation.
- Phases 4–5: all four arithmetic generators, four difficulty levels, and four unique shuffled answer choices with operation-specific distractors.
- Phases 6–8: answer selection, card reveal, self-reported results, fixed and continuous sessions, accessible progress, early ending with confirmation, and session summaries. Practice Again starts a fresh session with the same configuration; Change Settings returns to practice setup.
- Card animations can be turned off during practice and respect reduced-motion preferences.
- Completed attempts, totals, session IDs, and timestamps are held in memory for the current run. No practice history or application preferences are written to browser storage.

Routes: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`. Session and summary pages return to setup when required route data is missing or invalid. Statistics and settings are still placeholders.

## Planned features

Browser-storage persistence, saved statistics and settings, mistake tracking, personalized review, and mastery are not implemented. Practice Mistakes is shown disabled on the summary with an explanation. Navigation safety and restoring an active session after refresh come in later phases. Refreshing or leaving a session can lose in-progress attempts; route configuration alone is not a saved session.

See `specifications.md` for the software specification and `TODO.md` for the phased implementation checklist.

## Requirements and installation

Use Node.js 22.12 or later and npm. Install dependencies with `npm ci`.

## Commands

- `npm run dev`: start the Vite development server; open the local URL printed in the terminal.
- `npm run test:run`: run tests once.
- `npm test`: run tests in watch mode.
- `npm run lint`: check code with ESLint.
- `npm run format`: format files with Prettier.
- `npm run format:check`: check formatting without changing files.
- `npm run build`: type-check and create the production build in `dist/`.
- `npm run preview`: serve the production build locally.

Production hosting must serve `index.html` for application routes so direct links and refreshes work with BrowserRouter.

## Manual checks

1. Follow the home links and check unknown-route recovery, Back/Forward, visible keyboard focus, and Skip to content.
2. Configure mixed operations, difficulty, and length. Confirm Start Session requires operations and difficulty and defaults to 10 questions.
3. Start a 5-question session. Confirm Flip Card is disabled until selection, answers can change before revealing, and revealed choices cannot change. Record both right and wrong self-reports and verify progress and the summary totals.
4. Check that the fifth self-report opens the summary. Confirm accuracy, operation/difficulty labels, zero review questions, and all available summary actions. Practice Again should start at question 1; Practice Mistakes should remain disabled with an explanation.
5. Try continuous practice: no fixed progress bar, more questions keep appearing, and End Session opens confirmation. Cancel should keep your current card; confirming should summarize only completed attempts, including zero attempts if you end immediately.
6. Toggle card animation off, and test reduced-motion system preferences. The answer should still appear immediately and stay readable.
7. Check Tab/Shift+Tab and Enter/Space throughout the card flow. New questions and revealed answers receive focus. Resize to 320px, tablet, and desktop widths and check at 200% zoom for overlapping text or horizontal scrolling.
8. Open session and summary routes directly in a new tab with no route data. Both should return to setup.

## Question generator decisions (Phases 4–5)

- Addition/subtraction operands: 0–10, 0–50, 0–100, and 0–1,000 for levels 1–4. Subtraction remains nonnegative; Beginner/Easy addition sums are at most 20/100.
- Multiplication factors: 0–5 × 0–5; 0–10 × 0–10; 0–9 × 0–99; and 10–99 × 0–99. Intermediate includes one-digit and two-digit second factors; Advanced includes one-digit and two-digit second factors.
- Division is generated from a nonzero divisor and integer quotient. Beginner uses divisors 1–5 and quotients 0–5; Easy uses 1–10 and 0–10. Intermediate uses divisors 1–12 and quotients 0–floor(144 / divisor), so dividends never exceed 144. Advanced uses divisors 1–99 and quotients 0–99, so dividends can reach 9,801. These quotient/Advanced bounds fill numeric limits left open by the specification.
- Distractors use neighboring integers and common operation mistakes, including adjacent multiplication and division facts. Negative, fractional, duplicate, and correct-answer distractors are removed. Selection retries are capped at 12, with deterministic completion when draws repeat.
- The main generator rejects invalid configuration, validates complete questions, and retries generation up to three times before returning a valid fixed question for an enabled operation and selected difficulty.
- Immediate repeated problems are avoided with five bounded draws and a deterministic alternate at the same difficulty when randomness repeats.
