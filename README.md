# Math Practice App

A browser-based arithmetic practice application for children ages 7–12, built one milestone at a time. No account or backend is required.

## Current implementation

- Phases 1–2: React, Vite, TypeScript, shared types, tests, linting, formatting, responsive layout, home page, navigation, and unknown-route fallback.
- Phase 3: validated practice setup for operations, difficulty, and session length.
- Phases 4–5: four arithmetic generators, four difficulty levels, and four unique shuffled answer choices with operation-specific distractors.
- Phases 6–8: question cards, self-reported results, fixed/continuous practice, progress, early ending, and session summaries.
- Phase 9: versioned browser storage for settings, sessions, and attempts. Completed answers are saved as results are recorded, including during unfinished sessions.
- Phase 10: overall, operation, and difficulty statistics; up to 100 recent sessions; empty states; and confirmed statistics reset that preserves settings.
- Phase 11: saved sound, animation, explanation, and default practice preferences; session-specific setup changes; and confirmed Clear All Application Data.

Routes: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`. Session and summary routes return to setup when required route data is missing or invalid.

## Storage behavior and privacy

- Settings, sessions, and attempts share one version-1 JSON document at `mathPractice.data`. Saving a result updates the session and attempt in the same localStorage write. Attempts are deduplicated by ID.
- Overall and grouped statistics are calculated from saved attempts, rather than stored as a second aggregate that could become out of sync. All lifetime attempts are kept; recent session detail is limited to 100 sessions, newest first.
- Missing or version-0 envelopes using the initial category structure are normalized to version 1 and written in that format on the next save. Unknown future schemas are protected from automatic overwrites.
- Loaded records are validated. Invalid settings recover to defaults; malformed/duplicate history records are filtered while valid records are retained. A warning explains recovery.
- Blocked storage, capacity errors, and JSON errors do not crash practice. New changes stay available in memory when writes fail, and a visible warning explains that they were not saved. Failed statistics resets preserve existing saved history and report failure.
- Reset Statistics clears the history used for totals, grouped statistics, and recent sessions, keeping settings unchanged. Clear All Application Data removes the app's document and its specifically named legacy/reserved keys, including mistake patterns, restores defaults, and returns home. Unrelated browser keys are untouched.
- No practice history is sent to a server. Data belongs to the current browser profile and origin; changing the local server port uses separate storage. Clearing browser data removes saved progress.

Default practice choices are Addition, Beginner, and 10 questions. Sound is initially off; animations and explanations are on. Settings are saved with Save Settings. The in-session animation checkbox also saves the animation preference. Reduced-motion preferences always disable card animations.

## Planned features

Mistake tracking, personalized review, mastery, navigation safety, and restoring the current question after refresh are not implemented. Practice Mistakes remains disabled with an explanation. Completed answers are preserved, but refreshing the practice page starts a fresh run rather than resuming the current card.

See `specifications.md` for the software specification and `TODO.md` for the implementation checklist.

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

1. Save different operations, difficulty, and session length in Settings. Refresh, visit practice setup, and confirm saved defaults load. Individual setup changes should not overwrite those defaults.
2. Complete a five-question session with both right and wrong self-reports. Visit Statistics and check totals, accuracy, each operation/difficulty card, and the recent session. Refresh and reopen the app tab; results should remain.
3. Fully quit and reopen the browser, then return to the same app origin and port. Confirm attempts and settings remain. The full browser-process restart check was confirmed during user review; reload and closing/reopening the app tab were also verified.
4. Test sound on/off, animations on/off, explanations on/off, and reduced-motion preferences. Sound is a short neutral tone when revealing an answer; a browser without audio support should still allow practice.
5. Open Reset Statistics, cancel, and check history remains. On disposable test data, confirm the reset, then verify zero totals, empty recent sessions, and unchanged settings. Test Clear All Application Data separately: after explicit confirmation it should restore defaults and return home.
6. Use Tab/Shift+Tab and Enter/Space; confirmation dialogs initially focus Cancel, trap focus using native modal behavior, dismiss with Escape, and restore focus. Check 320px/mobile, tablet, and desktop widths and 200% zoom for overlap or horizontal scrolling.
7. Try continuous practice and cancel/confirm End Session. Only completed attempts should count, including a zero-attempt session if you finish immediately. Refreshing mid-session preserves recorded attempts but does not restore the current card.
8. Check the home links, Back/Forward, unknown-route recovery, visible focus, and Skip to content. Direct session/summary URLs without route data should return to setup.

## Question generator decisions (Phases 4–5)

- Addition/subtraction operands: 0–10, 0–50, 0–100, and 0–1,000 for levels 1–4. Subtraction remains nonnegative; Beginner/Easy addition sums are at most 20/100.
- Multiplication factors: 0–5 × 0–5; 0–10 × 0–10; 0–9 × 0–99; and 10–99 × 0–99. Intermediate includes one-digit and two-digit second factors; Advanced includes one-digit and two-digit second factors.
- Division is generated from a nonzero divisor and integer quotient. Beginner uses divisors 1–5 and quotients 0–5; Easy uses 1–10 and 0–10. Intermediate uses divisors 1–12 and quotients 0–floor(144 / divisor), so dividends never exceed 144. Advanced uses divisors 1–99 and quotients 0–99, so dividends can reach 9,801. These quotient/Advanced bounds fill numeric limits left open by the specification.
- Distractors use neighboring integers and common operation mistakes, including adjacent multiplication and division facts. Negative, fractional, duplicate, and correct-answer distractors are removed. Selection retries are capped at 12, with deterministic completion when draws repeat.
- The main generator rejects invalid configuration, validates complete questions, and retries generation up to three times before returning a valid fixed question for an enabled operation and selected difficulty.
- Immediate repeated problems are avoided with five bounded draws and a deterministic alternate at the same difficulty when randomness repeats.
