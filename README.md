# Math Practice App

A browser-based arithmetic practice application being built in phases for children ages 7–12. No account or backend is required.

## Current implementation

- Phase 1: React, Vite, TypeScript, shared types, ESLint, Prettier, Vitest, and React Testing Library.
- Phase 2: reusable page container, header, and navigation; a welcoming responsive home page; large navigation links; visible keyboard focus and a skip link.
- Phase 3: operation, difficulty, and session-length selectors; validated navigation to a configuration preview. No practice session is started yet.
- Phases 4–5: tested arithmetic generators for all operations and difficulty levels, with four unique, shuffled multiple-choice answers. These services are not connected to the practice UI yet.
- React Router routes: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`.
- Clearly labeled placeholders for later features and a page-not-found fallback with a link home.

## Planned features

Interactive question cards, practice session flow, session results, statistics, settings, browser storage, and personalized mistake review are not implemented yet. Statistics, settings, and session summaries remain placeholders. The session route only displays the chosen configuration and redirects to setup when configuration is missing or invalid. Configuration is passed in router navigation state; no browser-storage persistence is implemented.

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

## Manual Phase 2 checks

1. Open the home page and follow Start Practice, View Statistics, and Settings. Confirm Start Practice opens setup; statistics and settings remain labeled as coming soon.
2. Open each route directly, refresh it, and use the browser Back and Forward controls.
3. Open an unknown path and use Return Home.
4. Use Tab and Shift+Tab to navigate, check visible focus, and use Enter to activate links. Check Skip to content moves focus to the main content.
5. Resize to a 320px mobile width, tablet, and desktop; check readable text, wrapped navigation, and stacked action cards without horizontal scrolling. Check at 200% zoom.

## Manual Phase 3 checks

1. Open Start Practice. Confirm no operations or difficulty are selected, 10 questions is selected, and Start Session is disabled with an explanation.
2. Select multiple operations, toggle one off, and use Select All. Choose a difficulty and each available length.
3. Start Session and confirm the preview matches your chosen operations, difficulty, and length. No questions should appear.
4. Open /practice/session directly in a new tab without configuration; confirm it returns to setup.
5. Check the selectors with Tab, Space, and arrow keys. Check visible focus and selected controls at mobile widths and 200% zoom.

## Question generator decisions (Phases 4–5)

- Addition/subtraction operands: 0–10, 0–50, 0–100, and 0–1,000 for levels 1–4. Subtraction remains nonnegative; Beginner/Easy addition sums are at most 20/100.
- Multiplication factors: 0–5 × 0–5; 0–10 × 0–10; 0–9 × 0–99; and 10–99 × 0–99. Intermediate includes one-digit and two-digit second factors; Advanced includes one-digit and two-digit second factors.
- Division is generated from a nonzero divisor and integer quotient. Beginner uses divisors 1–5 and quotients 0–5; Easy uses 1–10 and 0–10. Intermediate uses divisors 1–12 and quotients 0–floor(144 / divisor), so dividends never exceed 144. Advanced uses divisors 1–99 and quotients 0–99, so dividends can reach 9,801. These quotient/Advanced bounds fill numeric limits left open by the specification.
- Distractors use neighboring integers and common operation mistakes, including adjacent multiplication and division facts. Negative, fractional, duplicate, and correct-answer distractors are removed. Selection retries are capped at 12, with deterministic completion when draws repeat.
- The main generator rejects invalid configuration, validates complete questions, and retries generation up to three times before returning a valid fixed question for an enabled operation and selected difficulty.
- No question cards, running sessions, result tracking, persistence, or mistake review are implemented in this milestone. The browser still shows only the Phase 3 configuration preview.
