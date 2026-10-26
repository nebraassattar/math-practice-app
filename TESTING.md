# Phase 20 testing record

Run `npm ci`, then `npm run test:run`, `npm run lint`, `npm run format:check`, and `npm run build`.

## Automated coverage

- Tasks 79: `questionGenerator.test.ts`, `questionUtilities.test.ts`, `storageService.test.ts`, `mistakeService.test.ts`, and `activeSessionService.test.ts` cover all operations/difficulty boundaries, distractors, unique choices, zero/nonzero statistics, mistake updates, related facts, mastery, serialization, invalid data, migrations, and recovery.
- Task 80: `PracticeConfiguration.test.tsx`, `QuestionCard.test.tsx`, `PracticeSession.test.tsx`, `Persistence.test.tsx`, `MistakeReview.test.tsx`, and `SessionRecovery.test.tsx` cover selection, revealing, both result controls, progress/completion, statistics, and confirmation/cancellation.
- Task 81: existing flow tests cover mixed operations, continuous practice, mistake creation/review/mastery, restored state, and statistics reset. `AccessibilityAudit.test.tsx` adds a complete five-question addition session using number keys, Tab, Enter, and Space, checking focus, saved results, and totals.
- Task 82: axe-core scans Home, Setup, empty/populated Statistics, Settings, unknown-route recovery, missing-session/summary messages, question front/back, completed summary, reset confirmation, and navigation confirmation. The suite asserts zero detected violations. Reduced-motion changes and interaction with animations disabled are covered in `QuestionCard.test.tsx`.

## Scope and review results

The axe scans use jsdom, which has no rendered layout or canvas. Color-contrast checks are explicitly disabled; canvas probes return null. A passing scan does not certify contrast, visual reflow, announcements spoken by assistive technology, or native dialog focus trapping. Existing browser/manual checks supplement these tests.

The browser keyboard check completed a five-question addition session using keyboard input, including both result controls. The summary reported five attempts, three right, two wrong, and 60% accuracy. Prior browser checks verified refresh recovery, Back navigation, dialog Cancel/Escape, and responsive widths. The user confirmed zoom and larger-font checks during the Phases 16–17 review. No new visual layout is introduced in Phase 20.

The automated scans reported no violations to remediate. Page landmarks, names, focused headings, selected states, live regions, and dialog controls were reviewed alongside existing tests. Incomplete/layout-dependent checks still need real assistive-technology review.

## Remaining manual screen-reader check

Task 82's screen-reader item remains unchecked. Use NVDA with a supported browser, VoiceOver with Safari, or another real screen reader:

1. Open Home and use Skip to content. Navigate to Setup and confirm the page heading, operation checkbox labels, difficulty descriptions, and validation messages are understandable.
2. Start practice. Confirm each new question is announced with operation words; explore the four answer buttons and selected state. Some screen readers use number keys for browse-mode navigation, so use Tab/Enter or switch to interaction mode when testing the 1–4 shortcuts.
3. Reveal the answer. Confirm the correct/selected answer announcement and both self-report controls. Record results and check progress announcements and focus on the next question.
4. Try leaving the session. Confirm the dialog title/message, initial Cancel focus, focus containment, Escape cancellation, and restored focus.
5. Complete the session and inspect summary, Statistics, Settings, and empty/error states. Confirm headings and totals are understandable without visual cues.

Record the screen reader, browser, and outcome before marking this last item complete. Repeat 200% zoom and reduced-motion checks in the target browser if its behavior differs from the earlier reviewed environment.

## Dependency check

Phase 20 adds axe-core as a development dependency and updates Vitest to the compatible patched 4.1.12 release. Installation reported zero known dependency vulnerabilities after that update. This records that run, not a guarantee about future advisories.
