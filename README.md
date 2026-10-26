# Math Practice App

A browser-based arithmetic practice application being built in phases for children ages 7–12. No account or backend is required.

## Current implementation

- Phase 1: React, Vite, TypeScript, shared types, ESLint, Prettier, Vitest, and React Testing Library.
- Phase 2: reusable page container, header, and navigation; a welcoming responsive home page; large navigation links; visible keyboard focus and a skip link.
- React Router routes: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`.
- Clearly labeled placeholders for later features and a page-not-found fallback with a link home.

## Planned features

Practice configuration, generated arithmetic questions, multiple-choice flashcards, session results, statistics, settings, browser storage, and personalized mistake review are not implemented yet. The destination pages currently contain placeholders only.

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

1. Open the home page and follow Start Practice, View Statistics, and Settings. Confirm each destination is labeled as coming soon.
2. Open each route directly, refresh it, and use the browser Back and Forward controls.
3. Open an unknown path and use Return Home.
4. Use Tab and Shift+Tab to navigate, check visible focus, and use Enter to activate links. Check Skip to content moves focus to the main content.
5. Resize to a 320px mobile width, tablet, and desktop; check readable text, wrapped navigation, and stacked action cards without horizontal scrolling. Check at 200% zoom.
