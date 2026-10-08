# Vaultline verification record

Date: 2026-10-08

## Final Phase 9 commands

| Command | Result | Evidence |
| --- | --- | --- |
| `npx playwright install chromium` | Failed (environment) | `EPERM: operation not permitted, mkdir 'C:\\Users\\Admin\\AppData\\Local\\ms-playwright'`. Not retried. |
| `npx tsc -b` | Passed | Exit 0 after fixing a test fixture’s TypeScript literal type. |
| `npm test` | Passed | 19 files, 110 tests passed. Includes engine/capacity regressions, persistence stale-session cleanup, and axe checks. |
| `npm run lint` | Passed with warnings | Exit 0. Oxlint emitted warning-only output (343 lines, including pre-existing warnings in `temp_restore`, legacy code and engine files). |
| `node scripts/contrast-check.mjs` | Passed | 23 text/background pairs passed. Ratios are listed below. |
| `npm run build` | Failed (environment) | Contrast check passed, embedded tests passed (19 files, 110 tests), and `tsc -b` completed. Vite then failed loading `vite.config.ts`: `Error: spawn EPERM` from `externalize-deps`. Production bundle was not verified. This was the single Phase 9 build attempt. |

During implementation, the first focused Phase 9 test run exposed an incorrect test normalization assumption, a test timeout, and two unnamed Optimizer controls. The tests were corrected to use the app’s automatic unit rounding; the axe timeout was raised for the larger Files view; and the custom amount, unit selector, and capacity slider received accessible names. The focused suite then passed (13 tests). The first final `npx tsc -b` also caught a widened fixture type; after fixing it, the final type-check passed.

Phase 8’s one build attempt stopped earlier in the embedded tests on a lazy-route test timeout before TypeScript or Vite ran. That test was corrected and the full Phase 8 test suite passed. The Phase 9 attempt above is the final production-build attempt; it reached Vite and was blocked by the sandbox’s process-spawn restriction.

## Contrast pairs

The build contrast script checks the following normal-text pairs (minimum 4.5:1). All pass:

| Text / foreground | Background | Ratio |
| --- | --- | ---: |
| Body ink | Paper | 15.64:1 |
| Body ink | White cards | 16.33:1 |
| Cream stage text | Vault green | 12.90:1 |
| Primary button label | Forest | 12.90:1 |
| Ink | Lightest heat fill | 12.99:1 |
| Cream text | Medium heat fill | 5.53:1 |
| Cream text | Darker heat fill | 8.63:1 |
| Cream text | Darkest heat fill | 12.90:1 |
| Kept block label | Deep green | 12.90:1 |
| Moved block label | Rust | 5.66:1 |
| Play kept tile label | Deep green | 12.90:1 |
| Play moved tile label | Rust | 5.66:1 |
| Gold highlight text | Vault green | 9.93:1 |
| Danger text | Paper | 6.44:1 |
| Danger text | Alert surface | 6.13:1 |
| Docs label | File docs color | 4.59:1 |
| Photos label | File photos color | 8.56:1 |
| Videos label | File videos color | 6.64:1 |
| Audio label | File audio color | 4.64:1 |
| Archives label | File archives color | 4.56:1 |
| Code label | File code color | 6.55:1 |
| System label | File system color | 6.76:1 |
| Other label | File other color | 8.50:1 |

## Verification coverage

Verified by automated tests, not visually:

- Solver output on the bundled student sample at 15 GB: 11 kept, importance 75 of 77, about 11.94 GB kept, with Spotify’s cache moved.
- `planForCapacity` against a fresh table solve at multiple capacities; importance never decreases as capacity grows; kept size remains within capacity.
- Scoring determinism, integer bounds, and absence of `fetch`/`FileReader` in scoring logic.
- `formatSize`, `pluralize`, sample replacement remaining at 12 files, initial sample count, and stale `currentSession/latest` cleanup.
- WCAG 2.0/2.1 A/AA axe rules on Dashboard, Files, Optimizer, Plan, Play, Landing, and the open Algorithm drawer. Axe’s color-contrast rule is disabled in jsdom because jsdom lacks canvas; the separate token contrast check above covers the project’s declared color pairs.
- Responsive DOM/class structure checks from the Phase 8 suite.

No screen was visually checked and no screenshots were captured. See [`screenshots/README.md`](screenshots/README.md) for the exact screen states and 1366×768 / 390×844 manual capture checklist. Visual layout, responsive behavior, keyboard/focus behavior, and actual rendered contrast still need a browser check.

## Known limits and untouched issues

- Suggested importance scores are a metadata-only heuristic, not ground truth.
- The capacity-table teaching/Play path uses a coarse DP scale: file sizes round up and capacity rounds down, so it can leave some real-world space unused.
- Exported shell migration content is generated text; Vaultline does not run it. It must be reviewed before use.
- The app stores only session summary metadata through its existing IndexedDB helper and clears the stale `currentSession/latest` record on startup. It does not restore a user’s scanned file list after reload. The 12-file sample count is correct on a fresh start, but persistence of user scans remains unimplemented; the storage engine was left untouched under the project rule.
- Production bundle output and browser-rendered accessibility/layout remain unverified because the sandbox blocks child-process creation and browser installation.
- `test.cjs` and `test.ts` are untracked scratch files and were not staged or committed.
