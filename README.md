# Math Practice App

A browser-based arithmetic practice application for children ages 7–12, built one milestone at a time. No account or backend is required.

## Current implementation

Phase 20 adds automated axe accessibility scans and a full keyboard-only addition-session regression. See [TESTING.md](TESTING.md) for coverage, limitations, and the remaining real screen-reader check. Axe runs in jsdom and does not verify rendered contrast or reflow. Vitest is updated to its compatible patched release.

Phase 19 adds category-specific saved-data recovery notices, a reusable error message and page error boundary, explanations when session/summary data is missing, and development-only diagnostics for bounded question-generation retries. Both regular and review generation provide validated fallbacks. Unexpected render failures show a simple recovery screen with Return Home; technical details are kept out of that screen.

- Phases 1–2: React, Vite, TypeScript, shared types, tests, linting, formatting, responsive layout, home page, navigation, and unknown-route fallback.
- Phase 3: validated practice setup for operations, difficulty, and session length.
- Phases 4–5: four arithmetic generators, four difficulty levels, and four unique shuffled answer choices with operation-specific distractors.
- Phases 6–8: question cards, self-reported results, fixed/continuous practice, progress, early ending, and session summaries.
- Phase 9: versioned browser storage for settings, sessions, and attempts. Completed answers are saved as results are recorded, including during unfinished sessions.
- Phase 10: overall, operation, and difficulty statistics; up to 100 recent sessions; empty states; and confirmed statistics reset that preserves settings.
- Phase 11: saved sound, animation, explanation, mastery-goal, and default practice preferences; session-specific setup changes; and confirmed Clear All Application Data.
- Phases 12–15: persistent mistake patterns, related-question generation, prioritized mistake-review sessions, configurable mastery, and active/mastered mistake statistics.

Phases 16–17 now add number-key answer shortcuts, route focus and page titles, spoken question labels and live answer announcements, reduced-motion detection, optional encouragement, and responsive layout improvements. Automated and browser checks pass; the user also confirmed the remaining zoom and larger-font checks during review.

Routes: `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, and `/settings`. Session and summary routes return to setup when required route data is missing or invalid.

## Storage behavior and privacy

- Settings, sessions, attempts, and mistake patterns share one version-2 JSON document at `mathPractice.data`. Saving a result updates the session, attempt, and mistake patterns in the same localStorage write. Attempts are deduplicated by ID.
- Overall and grouped statistics are calculated from saved attempts, rather than stored as a second aggregate that could become out of sync. All lifetime attempts are kept; recent session detail is limited to 100 sessions, newest first.
- Missing/version-0/version-1 envelopes are upgraded in memory to version 2 and written in that format on the next save. Existing regular-practice misses seed mistake patterns during migration; saved settings and attempts are preserved. Unknown future schemas are protected from automatic overwrites.
- Loaded records are validated. Invalid settings recover to defaults; malformed/duplicate history records are filtered while valid records are retained. A warning explains recovery.
- Blocked storage, capacity errors, and JSON errors do not crash practice. New changes stay available in memory when writes fail, and a visible warning explains that they were not saved. Failed statistics resets preserve existing saved history and report failure.
- Reset Statistics clears attempts, sessions, mistake patterns, and all statistics, keeping settings unchanged. Clear All Application Data removes the app's document and its specifically named legacy/reserved keys, including mistake patterns, restores defaults, and returns home. Unrelated browser keys are untouched.
- No practice history is sent to a server. Data belongs to the current browser profile and origin; changing the local server port uses separate storage. Clearing browser data removes saved progress.

Default practice choices are Addition, Beginner, and 10 questions. Sound is initially off; animations and explanations are on. Settings are saved with Save Settings. The in-session animation checkbox also saves the animation preference. Reduced-motion preferences always disable card animations.

## Session recovery (Phase 18)

The active run, question, selected answer, and revealed side are saved in per-tab sessionStorage at `mathPractice.activeSession` (snapshot version 1). Refreshing restores the same card, progress, review patterns, and mastery goal. Completed attempts remain in localStorage and are deduplicated on restoration. Recovery clears when the session completes or is ended. Closing a tab may discard its sessionStorage. Invalid snapshots are ignored safely; unavailable recovery storage shows a warning while practice continues.

The production app uses the React Router data router to protect active sessions during in-app navigation and browser Back/Forward. Cancel or Escape keeps practicing. End and Leave saves completed answers, excludes the unfinished card, and continues to the requested page. Same-page anchors remain usable. Refresh, closing the tab, and external navigation use the standard browser unload warning when supported. Browsers control its wording and may suppress it. Refresh restores the run rather than ending it.

See `specifications.md` for the software specification and `TODO.md` for the implementation checklist.

## Mistake review behavior (Phases 12–15)

- A wrong self-report creates or updates a pattern for the operation, operands, and difficulty. Reversed addition/multiplication facts share a pattern; subtraction/division are directional. A new miss resets mastery progress and reactivates a previously mastered pattern.
- Review uses active patterns matching the selected operations and difficulty. The setup page shows both the total active count and the matching count and explains when review cannot start. Summary and Statistics links open review setup; regular practice remains available.
- Related questions use nearby operands, reversed commutative operands, or inverse fact families. Subtraction remains nonnegative, division remains whole-number and nonzero-divisor, and every candidate must satisfy the chosen difficulty rules. Inverse operations appear only when also selected. Exact original questions and immediate repeats are excluded.
- Pattern selection favors frequent/recent misses and lower review progress. Equal priorities are randomized, weighted selection mixes patterns, and consecutive reuse is avoided whenever another active pattern is available.
- A correct review self-report advances the original pattern, even when the related question uses an inverse operation. A wrong review self-report updates that original pattern without creating a duplicate for the related question. Correct regular-practice answers do not advance review mastery.
- Mastery requires three correct related review answers by default; change the goal in Settings. Changing the goal recalculates mastered status from saved progress. Mastered patterns are excluded from review. If all matching patterns become mastered, the session ends early with its actual attempted count, including in continuous practice.
- Statistics show active/mastered counts, review attempts/correct counts, most frequently missed operations and facts (including ties), and pattern details sorted by misses. Mastered patterns are available in a separate expandable list. Overall and grouped statistics include both regular and review attempts.

## Requirements and installation

Use Node.js 24.x and npm, matching the Netlify build environment. Install dependencies with `npm ci`. The locked Vite/plugin dependencies require Node 20.19+ or 22.12+, ESLint requires 20.19+, 22.13+, or 24+, and the locked jsdom and Vitest versions also accept Node 24. All locked dependency Node engine ranges were checked against Node 24. Local verification uses Node 24.11.0.

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

## Deploying through Netlify

Deployment is prepared, but has not been performed. The root `netlify.toml` configures `npm run build`, publishes `dist`, selects Node 24, and rewrites `/*` to `/index.html` with status 200. Existing built assets are served normally; application routes are handled by React Router. No functions, backend, API keys, or application environment variables are required.

After reviewing and committing/pushing the prepared files to GitHub (a separate step that has not been performed for this configuration):

1. Sign in to [Netlify](https://app.netlify.com/) and select your team.
2. Choose **Add new project → Import an existing project**, then **GitHub**. Authorize access to the repository if prompted.
3. Select `nebraassattar/math-practice-app`.
4. Set the production branch to **main**. Leave the base directory empty (the repository root). Confirm the build command is **npm run build** and the publish directory is **dist**. The checked-in `netlify.toml` supplies these settings and Node 24; remove any conflicting Node version override in the Netlify UI. Leave functions/package-directory overrides unset.
5. Choose a project name, review the settings, and select **Publish** (or **Deploy**, if shown). In the deploy log, confirm Node 24 is selected and the build succeeds. Wait for the published URL.
6. Open the HTTPS site and test `/`, `/practice/setup`, `/practice/session`, `/practice/summary`, `/statistics`, `/settings`, and an unknown path. Open each directly and refresh it. Session/summary routes without valid data should show setup with an explanation; an unknown path should show the app fallback, not a Netlify 404.
7. Complete practice, check Statistics, refresh, and reopen the same site to verify saved history. Check keyboard controls, mobile widths, and the browser console. Localhost, preview URLs, and the production domain have separate browser storage; localhost history will not transfer automatically.

Netlify builds from GitHub, so uncommitted local files are not included. Once Git integration is active, later pushes to `main` normally trigger production builds. See the official [repository deployment guide](https://docs.netlify.com/start/quickstarts/deploy-from-repository/), [file-based configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/), and [Node dependency configuration](https://docs.netlify.com/build/configure-builds/manage-dependencies/).

The application is not marked complete: real screen-reader testing, the remaining cross-browser/device checks, slower-device performance testing, and live Netlify deployment verification remain pending in `TODO.md`. In-progress performance changes are also uncommitted and require review.

## Manual checks

For Phase 19, open `/practice/session` in a fresh tab without an active recovery snapshot, then open `/practice/summary` without result state. Both should return to setup with an explanation and a working Return Home link. Start a normal session afterward to confirm practice still works. Automated tests simulate damaged storage, unexpected page errors, and generation failures; there is no need to damage your saved history to review these cases. Valid stored categories and valid records are retained when another category contains invalid data; loading alone does not overwrite the original stored document.

1. Save different operations, difficulty, and session length in Settings. Refresh, visit practice setup, and confirm saved defaults load. Individual setup changes should not overwrite those defaults.
2. Complete a five-question session with both right and wrong self-reports. Visit Statistics and check totals, accuracy, each operation/difficulty card, and the recent session. Refresh and reopen the app tab; results should remain.
3. Fully quit and reopen the browser, then return to the same app origin and port. Confirm attempts and settings remain. The full browser-process restart check was confirmed during user review; reload and closing/reopening the app tab were also verified.
4. Test sound on/off, animations on/off, explanations on/off, and reduced-motion preferences. Sound is a short neutral tone when revealing an answer; a browser without audio support should still allow practice.
5. Open Reset Statistics, cancel, and check history remains. On disposable test data, confirm the reset, then verify zero totals, empty recent sessions and mistake patterns, and unchanged settings. Test Clear All Application Data separately: after explicit confirmation it should restore defaults and return home.
6. Use Tab/Shift+Tab and Enter/Space; confirmation dialogs initially focus Cancel, trap focus using native modal behavior, dismiss with Escape, and restore focus. Check 320px/mobile, tablet, and desktop widths and 200% zoom for overlap or horizontal scrolling.
7. Try continuous practice and cancel/confirm End Session. Only completed attempts should count, including a zero-attempt session if you finish immediately. Refreshing mid-session restores the current card, selected answer, and revealed side while preserving recorded attempts.
8. Check the home links, Back/Forward, unknown-route recovery, visible focus, and Skip to content. Direct session/summary URLs without route data should return to setup.

## Manual mistake-review checks

1. Refresh the updated app. Finish regular practice with at least one answer marked wrong. Check the new active pattern, wrong count, fact, and difficulty in Statistics.
2. Open Practice Mistakes from the summary or Statistics. Confirm matching operations/difficulty and start review. Questions should be related, valid, and labeled as review; changing to an unmatched difficulty should explain why Start Session is disabled.
3. Mark three related questions right. Confirm mastery, the review count in the summary, and automatic early completion when no matching active patterns remain. Refresh Statistics and expand Mastered patterns to see saved progress.
4. Before mastery, mark a review question wrong and confirm progress resets on the original pattern without a duplicate. Later mark the original regular fact wrong again and confirm it becomes active.
5. Try multiple active patterns and mixed operations, including related inverse operations when enabled. Change the mastery goal in Settings and confirm the target and mastered status update.
6. Check mobile layouts, keyboard controls, and reset/cancel behavior. Reset Statistics and Clear All Application Data should also remove patterns after explicit confirmation.

## Question generator decisions (Phases 4–5)

- Addition/subtraction operands: 0–10, 0–50, 0–100, and 0–1,000 for levels 1–4. Subtraction remains nonnegative; Beginner/Easy addition sums are at most 20/100.
- Multiplication factors: 0–5 × 0–5; 0–10 × 0–10; 0–9 × 0–99; and 10–99 × 0–99. Intermediate includes one-digit and two-digit second factors; Advanced includes one-digit and two-digit second factors.
- Division is generated from a nonzero divisor and integer quotient. Beginner uses divisors 1–5 and quotients 0–5; Easy uses 1–10 and 0–10. Intermediate uses divisors 1–12 and quotients 0–floor(144 / divisor), so dividends never exceed 144. Advanced uses divisors 1–99 and quotients 0–99, so dividends can reach 9,801. These quotient/Advanced bounds fill numeric limits left open by the specification.
- Distractors use neighboring integers and common operation mistakes, including adjacent multiplication and division facts. Negative, fractional, duplicate, and correct-answer distractors are removed. Selection retries are capped at 12, with deterministic completion when draws repeat.
- The main generator rejects invalid configuration, validates complete questions, and retries generation up to three times before returning a valid fixed question for an enabled operation and selected difficulty.
- Immediate repeated problems are avoided with five bounded draws and a deterministic alternate at the same difficulty when randomness repeats.

## Accessibility and polish review (Phases 16–17)

- During a question, press 1–4 to select the corresponding answer. Tab, Enter, and Space also work. Shortcuts ignore editable fields, modified keys, and open dialogs.
- Route changes focus the new page heading; practice focuses each question. Revealed answers and progress have accessible announcements. Test with your screen reader as part of final accessibility review.
- Reduced motion overrides card animation. Encouraging feedback can be disabled independently in Settings; existing saved settings retain their preferences and default this new option to on.
- Browser checks covered 320px and 390px phone widths and 768×1024, 1024×768, and 1024×600 tablet layouts. Statistics and Settings were checked at 320px without page overflow. Answer buttons remain large and wrap to one column when needed.
- The user confirmed the remaining manual checks, including zoom and larger fonts, during milestone review. Text uses relative sizing.
