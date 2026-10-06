# Vaultline Fix Log

## Section 1: /tools Blank Page
- **Fix:** Rewrote `/src/ui/pages/ToolsPage.tsx` into a routing gallery that mounts sub-tools under `/tools/*`. Added a root ErrorBoundary in `main.tsx` and a route ErrorBoundary in `App.tsx`.
- **Evidence:** Vitest smoke test (`ToolsPage.test.tsx`) asserting that the gallery and all tools mount correctly without crashing under three conditions (no files, sample data, 5000 files). Test passed successfully. (Playwright automated test skipped due to driver download failure in this environment).

## Section 2: Optimizer Stale Plan & Progress Panel
- **Fix:** Added "Plan is out of date" banner with "Recompute Now" button to `OptimizerPage.tsx`. Implemented dataset size checks for >2000 files warning. Implemented progress panel showing optimization stages, cell count, progress bar, and cancel action. Connected `AlgorithmPage.tsx` dataset mapping to `normaliseItemSize` helper from engine.
- **Evidence:** Browser screenshot verification at 1366x768 / 110% zoom.

## Section 3: Layout Overflows & Responsive Pass
- **Fix:** Made TopBar search input flex-shrinkable (`flex: '0 1 320px'`, `minWidth: '120px'`). Updated `Treemap.tsx` SVG to `width="100%"` with `maxWidth: "100%"`. Rounded `executionTimeMs` floating point in `OptimizerPage.tsx` (`Math.round`) to prevent wide string expansion. Added `whiteSpace: 'nowrap'` and responsive SVG viewBox to `StackedBar.tsx` to prevent line splitting on "27.85 MB". Fixed `Keep list` and `Move list` tables in `OptimizerPage.tsx` with `tableLayout: 'fixed'`, explicit column widths (`width: '110px'`), text truncation (`textOverflow: 'ellipsis'`), `whiteSpace: 'nowrap'` on byte sizes, and wrapper `overflowX: 'auto'`. Adjusted Optimizer page left grid column max width (`minmax(240px, 300px)`).
- **Evidence:** Clean execution of Vitest suite (32/32 tests passing). User screenshot inspection confirms layout alignment.

## Section 4: Dual Scrollbar & TopBar Shift
- **Fix:** Changed AppShell outer div from `minHeight:100vh` to `height:100vh; overflow:hidden`. Added `overflow:hidden` to the right-column wrapper. Added `height:100%` to `html, body` and `#root` in `index.css`.
- **Evidence:** Automated regression tests pass. Structural root cause confirmed via CSS analysis (minHeight causing body scroll).

## Section 5: Landing Page
- **Fix:** Created `src/ui/pages/LandingPage.tsx` with Framer Motion hero, animated SVG vault illustration, 3 feature cards with hover effects, stats strip, and two CTAs. Wired in `src/main.tsx` with `localStorage` flag so it shows only once. "Skip to app" `<a>` always visible at top-left.
- **Evidence:** Dev server running at http://localhost:5174/. `localStorage.removeItem('vaultline_landing_seen')` + reload shows landing page.

## Section 6: Pluralization
- **Fix:** Created `src/utils/pluralize.ts`. Replaced manual ternary patterns in `DashboardPage.tsx`, `FilesPage.tsx`, `Sidebar.tsx`. Added `scripts/check-plurals.mjs` regression checker.
- **Evidence:** `src/utils/pluralize.test.ts` — 7 passing unit tests. `src/regression.test.tsx` — pluralize helper regression block passing.

## Full Test Run Evidence (2026-09-30)
```
Test Files  5 passed (5)
    Tests  53 passed (53)
 Start at  00:52:31
 Duration  8.11s
```
All 53 tests pass. Includes: engine tests, ToolsPage smoke tests, regression suite (pluralize, store, KpiCard, DashboardPage empty state).
- **Evidence:** Screenshot showing sidebar with a single vertical scrollbar. ![Sidebar Scrollbar](file:///C:/Users/Admin/.gemini/antigravity-ide/brain/58d6d100-1ef2-417e-9cc0-0ec0a536f842/.user_uploaded/media_1790795174658.png)
