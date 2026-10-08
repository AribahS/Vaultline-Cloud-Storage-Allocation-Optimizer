# Manual screenshot checklist

No browser screenshot was captured: `npx playwright install chromium` failed with `EPERM` while creating `C:\Users\Admin\AppData\Local\ms-playwright`. Capture these screens manually at both **1366×768** and **390×844** where applicable.

## Screens and states

- Landing page: hero, “Try sample data” primary action and “Open app” secondary action.
- Play: Explore mode and Challenge mode, each with the bundled sample data.
- Files: Table view, bulk selection bar, row details panel, Duplicates view, and cleared empty state.
- Plan: summary, treemap, Keep and Move lists, constraints, and export actions.
- Algorithm drawer: open over the Dashboard, showing the “Watch it think” tab.

## Check at each size

- The single filled primary action is visible above the fold.
- Headings and cards do not overlap or clip; at 390×844 content stacks into one column.
- The page has no horizontal scroll. Wide tables and the algorithm grid scroll inside their own cards.
- Body text and labels remain legible against their surfaces; kept and moved states remain distinguishable by both color and pattern.
- At 390×844, top navigation remains usable and the drawer stays within the viewport with its own scroll area.
- Files table, bulk actions, detail panel, duplicate groups, empty state, and Plan exports remain reachable and operable.
