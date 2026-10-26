# Math Practice App

A browser-based arithmetic practice application being built in phases for children ages 7–12. No account or backend is required.

## Current implementation

- Phase 1: React, Vite, TypeScript, shared types, ESLint, Prettier, Vitest, and React Testing Library.
- Phase 2: reusable page container, header, and navigation; a welcoming responsive home page; large navigation links; visible keyboard focus and a skip link.
- Phase 3: operation, difficulty, and session-length selectors; validated navigation to a configuration preview. No practice session is started yet.
- React Router routes: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`.
- Clearly labeled placeholders for later features and a page-not-found fallback with a link home.

## Planned features

Generated arithmetic questions, multiple-choice flashcards, session results, statistics, settings, browser storage, and personalized mistake review are not implemented yet. Statistics, settings, and session summaries remain placeholders. The session route only displays the chosen configuration and redirects to setup when configuration is missing or invalid. Configuration is passed in router navigation state; no browser-storage persistence is implemented.

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
