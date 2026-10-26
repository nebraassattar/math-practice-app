# Math Practice App

A browser-based arithmetic practice application for children ages 7–12, built one milestone at a time. No account or backend is required.

## Current implementation

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

## Planned features

Navigation safety and restoring the current question after refresh are not implemented. Mistake review is disabled only when there are no active patterns. Completed answers are preserved, but refreshing the practice page starts a fresh run rather than resuming the current card.

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
5. Open Reset Statistics, cancel, and check history remains. On disposable test data, confirm the reset, then verify zero totals, empty recent sessions and mistake patterns, and unchanged settings. Test Clear All Application Data separately: after explicit confirmation it should restore defaults and return home.
6. Use Tab/Shift+Tab and Enter/Space; confirmation dialogs initially focus Cancel, trap focus using native modal behavior, dismiss with Escape, and restore focus. Check 320px/mobile, tablet, and desktop widths and 200% zoom for overlap or horizontal scrolling.
7. Try continuous practice and cancel/confirm End Session. Only completed attempts should count, including a zero-attempt session if you finish immediately. Refreshing mid-session preserves recorded attempts but does not restore the current card.
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
