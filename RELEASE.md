# Release record — October 26, 2026

Live application: https://math-practice-app-nebraassattar.netlify.app

Repository: https://github.com/nebraassattar/math-practice-app

## Delivered

The class-assignment application is deployed with arithmetic practice, four difficulty levels, configurable sessions, answer cards and self-reporting, saved statistics/settings, personalized mistake review and mastery, refresh recovery, navigation protection, accessible controls, responsive layouts, and error recovery. There is no account or application backend.

Netlify builds `main` with Node 24, `npm run build`, and `dist`. The SPA rewrite is in `netlify.toml`. The user confirmed deployment and accepted the hosting badge. No hosting access or badge settings were changed during final review.

## Final verification

- 319 tests in 20 files passed; ESLint, Prettier, TypeScript, and the production build passed.
- Local production preview loaded Home, Statistics, and Settings, including a direct Statistics refresh and the split page bundles. No warnings/errors were captured in that preview.
- Live route checks covered Home, Setup, Session, Summary, Statistics, Settings, and an unknown URL. Direct links and refreshes worked; missing session/summary data returned to setup with explanations. Unknown-route Return Home and browser Back/Forward worked.
- A five-question live session produced five attempts, four right, one wrong, and 80% accuracy. The revealed card survived refresh, and Statistics/recent sessions retained totals after refresh. These self-reported results were test records in the checking browser, not a measure of arithmetic correctness.
- Live Home, Settings, and populated Statistics had no page overflow at 320px. Earlier checks covered phone and tablet viewport sizes, visible focus, keyboard-only practice, reduced motion, and user-confirmed zoom/larger fonts.
- Axe reported no violations in its tested jsdom states. It does not certify rendered contrast or spoken screen-reader behavior; see `TESTING.md`.

## Performance and data decisions

- Statistics and mistake summaries are memoized by their input arrays. Dialog changes do not repeat those calculations. Identical settings/session snapshots avoid redundant saves while newer-schema write protection remains enforced. Question generation runs at session initialization and transitions rather than on unrelated re-renders.
- Statistics and Settings load as separate page bundles. The entry JavaScript is 359.87 kB (112.15 kB gzip), compared with 371.31 kB (114.29 kB gzip) before splitting. Additional page JavaScript is approximately 3.90 kB and 8.63 kB; CSS is 9.92 kB (2.79 kB gzip). These figures describe the measured local production build.
- A 5,000-attempt/1,000-session test retained all attempt totals and only the latest 100 session summaries on load. Its JSON value was 1,579,065 characters, or 3,158,130 UTF-16 value bytes (about 3.01 MiB, excluding key/implementation overhead). Save/load/aggregation took 34.4 ms on the development machine. This is not a slower-device benchmark or a universal browser storage quota guarantee.
- No attempt archiving is needed for the measured case. All attempts are kept, so no aggregate information is lost through archiving. Very long histories can reach browser storage limits; the app warns and continues in memory when saving fails. Users should not expect unlimited history.
- Runtime dependencies are React, React DOM, and React Router. Development dependencies support the build, types, lint, formatting, and tests. No unused direct dependency was identified. The UI uses system fonts and a local SVG favicon, without downloaded font or photo assets.

## Privacy review

Application source contains no analytics/tracking service, advertising integration, personal-information form, account, or network upload of practice records. Settings/history are stored locally; recovery uses per-tab sessionStorage. The app explains that clearing browser data removes progress. Hosting still receives ordinary page/asset requests; this review does not make claims about the host's own logs. The host-injected Netlify badge remains, as accepted by the user.

## Remaining verification and known limits

The deployed feature set is delivered, but the full production-readiness checklist is not certified complete. The following remain unchecked in `TODO.md`:

- Actual screen-reader testing with a named screen reader/browser.
- Chrome, Safari, Firefox, Edge, actual device/emulator coverage, and slower-device performance testing. The in-app Chromium browser and resized viewports do not substitute for all these environments.
- A single `MutationObserver.observe` console error appeared during rapid live refresh testing. It did not reproduce on fresh loads, later navigation/refreshes, or local production preview. Its source is unconfirmed; the error-free live-console item remains open pending follow-up.

No required pending check was silently marked passed. `TODO.md` retains the original scope, and `TESTING.md` gives the remaining screen-reader procedure. Run the four project checks before future releases, and recheck live routes and storage after any deployment change.
