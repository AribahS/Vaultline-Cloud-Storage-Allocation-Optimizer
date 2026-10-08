# Vaultline palette audit

The source of truth for color values is `src/index.css` (`:root`). Components use the semantic tokens and aliases defined there. The current source includes the Dashboard and the legacy interactive lessons; Phase R2 removes the Dashboard as a destination and consolidates navigation.

| Screen or area | Element | Token / role |
| --- | --- | --- |
| App shell and every light page | Page background | `--paper` |
| All light pages | Cards, borders and lift | `--card`, `--card-border`, `--shadow-level-1` |
| All light pages | Headings and body copy | `--ink`; secondary copy `--text-muted` |
| Top bar | Logo and inactive navigation | `--ink`; active tab `--vault` with `--paper` text |
| Files | Kept and moved status | `--kept` with `--ink`; `--moved` with `--paper` and stripe pattern |
| Dashboard | KPI values and short underline | `--ink`, `--highlight` |
| Optimizer | Controls and results | `--paper` / `--card`, `--ink`; gold is reserved for highlights and trace indicators |
| Reports | Summary cards and printed moved status | `--card`, `--ink`; moved status `--moved` with a pattern in print |
| Play | Stage, controls and sublabels | `--vault`, `--paper`, `--text-muted-on-dark`; gold highlights `--highlight` |
| Algorithm drawer | Light content and DP heat map | `--paper`, `--ink`; heat steps `--heat-0` through `--heat-4`, foreground switches to `--paper` on dark steps |
| Landing | Hero only | `--vault` and `--paper`; hero secondary copy `--text-muted-on-dark` |
| Landing below hero | Feature cards and footer | `--paper`, `--card`, `--card-border`, `--ink`, `--text-muted` |
| Danger states | Text, border and alert surface | `--danger`, `--color-danger-border`, `--alert-surface` |
| File type badges | Category surface and paired label | `--color-file-*-*` token pair, checked by contrast test |

Contrast pairs and ratios are printed by `node scripts/contrast-check.mjs` and checked by `src/lib/contrast.test.ts`. Immutable `/src/engine` contains legacy export/category color literals and is deliberately excluded from the source-literal audit to honor the no-engine-edits constraint. Bundled SVG logos are also excluded as third-party brand assets. The current UI does not consume those engine colors for page styling.
