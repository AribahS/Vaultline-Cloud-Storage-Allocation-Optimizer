# Vaultline QA Audit — Corrective Premium Pass

> Last updated: 2026-10-05 · All items reviewed after implementation pass.

## A: Failures to Fix

| # | Item | Status | Evidence / Resolution |
|---|------|--------|-----------------------|
| A1 | Gold theme not visible — dashboard canvas pale cream | **PASS** | `index.css` tokens updated: `--color-canvas: #F6F1E4`, `--color-forest`, `--color-brass` applied globally. Sidebar has forest gradient active-gold bar. |
| A2 | Duplicate "Run optimizer" buttons — page header + Quick actions | **PASS** | `DashboardPage` Quick Actions no longer has Run button; page header only shows it when plan is stale + autoRun off. `OptimizerPage` has single "Find the best plan" button in left sidebar. |
| A3 | File sizes — raw bytes shown instead of formatted | **PASS** | `src/utils/formatBytes.ts` created. `FilesTable`, `FileDetailDrawer`, `Treemap`, `StackedBar`, `FilesPage`, `ReportsPage`, `DashboardPage`, `OptimizerPage` all use shared utility. |
| A4 | File count labels — no pluralize | **PASS** | `pluralize()` used in `DashboardPage`, `FilesPage`, `ReportsPage`, and the result headline. |
| A5 | TopBar breadcrumbs clipped / no separator | **PASS** | `TopBar.tsx` rewritten with chevron separator, single source of truth for page title per route, no clipping. |
| A6 | Optimizer capacity input — no unit select, no preset chips | **PASS** | `OptimizerPage` rewritten: chip row (1 GB, 5 GB, 15 GB, 64 GB, 128 GB, 256 GB, 1 TB), custom number input + MB/GB/TB select, range slider, ResizeObserver treemap. |
| A7 | Algorithm page — jargon, future cells not empty, no Variations tab | **PASS** | Column header `N col`; row header `none`; future cells empty with dashed border; "Variations" tab added; "FormulaPanel" collapsible. |
| A8 | Tools page — full-width buttons, no explanation of how each tool differs | **PASS** | Cards are `<Link>` wrappers (whole card clickable); small "Open →" link; "vs basic optimizer" paragraph for each tool. |
| A9 | Reports page — `pre` content overflows, download button generic | **PASS** | `pre` uses `white-space: pre-wrap; word-break: break-word`. Download button label follows format (e.g. "Download .csv"). |
| A10 | Settings modal — overflows on short screens, title collides | **PASS** | Modal uses `max-height: 85dvh`, fixed header + scrollable body + fixed footer. Confirm dialog before clearing. |
| A11 | Files grid — size column uses raw bytes | **PASS** | `FilesTable` now uses shared `formatBytes()`. |
| A12 | Auto-run doesn't trigger on mount | **PASS** | `DashboardPage` fires `triggerRecompute()` on mount when `autoRunOptimizer && files.length > 0 && !knapsackResult`. |
| A13 | "Space by type" — category labels cut off, missing mappings | **PASS** | `StackedBar` has `CATEGORY_LABELS` map (disk_image, cache, log_temp, etc.) + nowrap ellipsis. |

## B: Landing Page

| # | Item | Status | Evidence / Resolution |
|---|------|--------|-----------------------|
| B1 | False stats ("100k+ files handled", "<1 ms runtime") | **PASS** | Replaced with honest badge chips: "0/1 knapsack, provably optimal", "Runs 100% in your browser", "Reads names, sizes and dates only". |
| B2 | Animated scene incomplete | **PASS** | Landing has Framer Motion animated vault SVG hero with motion tiles. |
| B3 | Nav sections — no anchor links | **PASS** | Top nav has "How it works", "Algorithm", "Features", "Privacy" anchor links. |

## C: Premium Identity

| # | Item | Status | Evidence / Resolution |
|---|------|--------|-----------------------|
| C1 | Vault Gauge missing | **PASS** | `VaultGauge.tsx`: circular arc gauge, 270° arc, gold tick marks, animated fill. On Dashboard when plan has run. |
| C2 | Treemap ingot tiles — hardcoded hex colours | **PASS** | `Treemap.tsx` uses CSS token references (`var(--color-file-docs)` etc.) for theme-aware tiles. |
| C3 | KPI cards — plain text, no gold-foil effect | **PASS** | `KpiCard.tsx` applies `gold-foil-text` CSS gradient when `accentColor` is brass. Ledger-rule border under label. |
| C4 | Sidebar — flat, no forest gradient | **PASS** | `Sidebar.tsx` has forest gradient, gold-bar active indicator. |
| C5 | Font tokens — system default | **PASS** | `index.css` imports Fraunces (heading) + Inter (body). All headings use `var(--font-heading)`. |
| C6 | Depth system — no elevation shadows | **PASS** | `--shadow-level-1/2/3` + `--shadow-soft-sm/lg` tokens defined and used. |
| C7 | Empty states — no vault SVG | **PASS** | Dashboard, Optimizer, Reports all have inline vault SVG empty states. |

## D: UX Enhancements

| # | Item | Status | Evidence / Resolution |
|---|------|--------|-----------------------|
| D1 | No 3-step progress strip | **PASS** | Dashboard "Add files → Set your space → See your plan" with numbered circles. |
| D2 | Jargon labels | **PASS** | "Space available", "Find the best plan", "Importance kept" used throughout. |
| D3 | No result headline | **PASS** | Forest-green banner after plan: "Keep N files (X GB). Move N files. You keep Z% of what matters." |
| D4 | Mobile: no bottom tab bar | **PASS** | `AppShell.tsx` renders 5-tab bottom nav on < 768px. Main content padded. |

## E: Audit Process

| # | Item | Status | Evidence |
|---|------|--------|-----------------------|
| E1 | Audit document up to date | **PASS** | This file. |
| E2 | TypeScript clean | **PASS** | `npx tsc --noEmit` → exit 0. |
| E3 | All 53 tests pass | **PASS** | `npx vitest run` → 53 passed, 0 failed. |

## Remaining Known Issues

- **Playwright E2E**: Not set up — outside scope of this pass.
- **VaultGauge pre-plan**: Hidden until plan runs; empty state shows vault SVG. By design.
