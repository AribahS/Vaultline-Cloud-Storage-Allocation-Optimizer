# Vaultline Root Causes

## Section 1: /tools Blank Page
**Root Cause:**
- File: `/src/ui/pages/ToolsPage.tsx` lines 152 and 261.
- Why: `ToolsPage` passes an array of objects `{ label, value }` to the `options` prop of `SegmentedControl`. However, `SegmentedControl` (in `/src/ui/components/SegmentedControl.tsx`) expects `options: string[]` and renders the option directly (`{option}`). React throws a fatal error because objects are not valid as React children. This causes the entire React tree to unmount since there is no ErrorBoundary to catch it.

## Section 2: Optimizer Stale Plan & Progress Panel
**Root Causes:**
1. Stale Plan Banner & Trigger:
   - File: `src/ui/pages/OptimizerPage.tsx`
   - Why: `OptimizerPage` did not check `isPlanStale` or render a banner informing users when files/capacity changed. Also, `files.length > 2000` datasets were missing an explicit notice that auto-recompute is disabled.
2. Progress Panel:
   - File: `src/ui/pages/OptimizerPage.tsx` & `src/store/useAppStore.ts`
   - Why: `useAppStore` had `computeProgress` state defined in `AppState` but `cancelCompute` was not implemented in the store, and `OptimizerPage` did not render the progress card during `isComputing`.
3. ComparisonTab crash (`TypeError: Cannot read properties of undefined (reading 'length')`):
   - File: `src/ui/pages/AlgorithmPage.tsx` lines 408, 414, 425
   - Why: `ComparisonTab` accessed `bruteResult.keptItems`, `bruteResult.totalValue`, and `bruteResult.keptItems.reduce(...)` — but `BruteForceResult` (from `src/engine/bruteForce.ts`) uses **different field names**: `bestSubset`, `bestValue`, and `bestSize`. Reading `.length` on `undefined` (keptItems) caused the crash.
   - Fix: Updated all three table cell references to use the correct fields: `bestValue`, `bestSubset.length`, `bestSize`.


## Section 3: Layout Overflows & Responsive Pass
**Root Causes:**
1. TopBar Search Container Overflow:
   - File: `src/ui/components/TopBar.tsx`
   - Why: Fixed `width: '320px'` without flex-shrink caused the search box and action buttons to overflow horizontally on 1366x768 screens at 110% zoom (effective width ~1242px).
3. Floating-Point Runtime String Expansion:
   - File: `src/ui/pages/OptimizerPage.tsx` line 258
   - Why: Raw `knapsackResult.executionTimeMs` produced unrounded floating-point strings like `6.399999991059303ms`, expanding the Runtime KPI card and pushing the right-pane layout beyond 100vw.
5. Keep/Move List Table Unconstrained Width & Size Label Wrapping:
   - File: `src/ui/pages/OptimizerPage.tsx` lines 277-321
   - Why: Tables in `Keep list` and `Move list` lacked `tableLayout: 'fixed'` and `whiteSpace: 'nowrap'` on Size columns (causing "8.4" and "MB" to break across lines), and lacked `overflowX: 'auto'` on wrapper cards, expanding the table and cutting off the Importance header at the right edge of the screen.

## Section 4: Dual Scrollbar & TopBar Shift (2026-09-30)
**Root Cause:**
- File: `src/ui/components/AppShell.tsx` — outer div used `minHeight:100vh`.
- Why: `minHeight:100vh` allows the outer container to grow beyond the viewport when content overflows, creating a body-level scrollbar alongside the main-level scrollbar. This shift caused the TopBar to jitter ~8px on scroll.
- Fix: Changed to `height:100vh; overflow:hidden` on the outer div and added `overflow:hidden` on the right-column div so only `<main>` ever scrolls. Added `height:100%` to `html,body,#root` to complete the flex tree.

## Section 5: Landing Page (Missing)
**Root Cause:**
- No landing page existed; the app opened directly to the app shell.
- Fix: Created `src/ui/pages/LandingPage.tsx` (Framer Motion, deep-forest/gold, hero SVG, features, CTAs). Wired into `src/main.tsx` with `localStorage` `vaultline_landing_seen` flag. "Skip to app" `<a>` tag always visible.

## Section 6: Inconsistent Pluralization
**Root Cause:**
- Files: `DashboardPage.tsx`, `FilesPage.tsx`, `Sidebar.tsx` — manual `${count} item${count !== 1 ? 's' : ''}` ternaries with no shared utility.
- Fix: Created `src/utils/pluralize.ts` helper; replaced all ternary patterns. Added `scripts/check-plurals.mjs` checker script.
