# Vaultline UI Rebuild Plan: "Forest and Cream"

## 1. Design System & Tokens
**Vibe**: Premium, editorial, calm, high-trust (private bank, high-end note-taking).
**Typography**: 
- Headings/Big numbers: `Fraunces` (600, soft serif)
- Interface: `Inter` (400/500/600)
- Tabular/Code: `JetBrains Mono`

**Color Palette**:
- **Canvas/Surfaces**: Cream canvas `#F6F1E4`, Raised `#FFFCF4`, Sunken `#EDE6D3`
- **Borders**: Hairline `#DCD2B9`, Strong `#C9BD9E`
- **Primary/Sidebar**: Deep forest `#14382B`, variations: `#0E2A20` (900), `#1F4D3A` (700), `#2F6B4F` (500), `#DCE8DC` (100), `#EEF4EC` (50)
- **Accents**: Brass `#B8893C`, Brass-soft `#F1E3C4`
- **Text**: Ink `#17211C`, Ink-2 `#465349`, Ink-3 `#66746A`
- **Semantic**: Keep `#2F6B4F`, Move `#9C4A3A` (muted brick + hatch), Warning `#B8893C`, Info `#2E6F73`, Danger `#A23B3B`
- **File Types**: Docs `#2D5A7B`, Photos `#B5654A`, Videos `#C58B2B`, Audio `#7A5C8C`, Archives `#4E8A6B`, Code `#3E6E73`, Installers `#7B7F73`, Other `#A89F86`
- **Dark Mode (Forest night)**: Canvas `#0F1A15`, Surface `#16261E`, Borders `#27403A`, Text `#EFE8D6`

**Shape/Depth/Motion**:
- 1px hairline borders, 10px radius (cards), 8px radius (controls).
- Shadows: soft `0 1px 2px rgba(20,56,43,0.06), 0 8px 24px rgba(20,56,43,0.06)`. No gradients except one in sidebar.
- Motion: Fade + 8px slide (180ms), 120ms color hovers.

## 2. Component Inventory (`src/ui/components`)
- **Typography & Layout**: Heading, Text, Card, PageLayout, Grid, Divider
- **Controls**: Button (primary, secondary, ghost, danger), Input, Select, Slider, Switch, SegmentedControl, Checkbox
- **Data Display**: Badge, Tag, Table (TanStack), Tooltip, Drawer, Modal, Progress/Meter, KPI Card, Treemap (SVG), StackedBar (SVG)
- **Navigation**: Sidebar, TopBar, Breadcrumb, Tabs, DropdownMenu
- **Feedback**: Toast, EmptyState, Skeleton, ErrorBoundaryCard

## 3. Route Structure (`react-router`)
- `/` - Dashboard
- `/files` - Files & Intake
- `/optimizer` - Optimizer configuration and results
- `/algorithm` - Algorithm Analysis (DP, Compare, Complexity, Correctness, Variations)
- `/tools` - Extra Tools gallery
- `/reports` - Export and history
- (Settings & Help in modals/drawers)

## 4. Milestones & Execution Plan

### Milestone 1: Setup & Design System
- Move old UI to `/src/legacy`.
- Update `package.json` with dependencies: `react-router-dom`, `dexie`, `@tanstack/react-table`, `@tanstack/react-virtual`, `lucide-react`, `@fontsource/fraunces`, `@fontsource/inter`, `@fontsource/jetbrains-mono`.
- Create `index.css` with the complete "Forest and Cream" token set.
- Implement base shared components.
- Set up React Router and App Shell (Sidebar + TopBar).

### Milestone 2: File Intake & Storage
- Set up Dexie (IndexedDB) for state persistence.
- Implement Web Worker scanning logic for drop zone and directory picker.
- Build the `/files` page with TanStack Table + Virtualization.
- Add file drawer for details, importance engine card, and duplicates view.

### Milestone 3: Dashboard
- Build empty state and active state for `/`.
- Implement KPI cards, SVG Treemap component, Stacked Bar.
- Wire up Insights card and Quick Actions.

### Milestone 4: Optimizer
- Build the `/optimizer` page: 2-pane layout.
- Config pane: Destinations, constraints, method, precision.
- Result pane: KPIs, Tabs (Plan, Keep, Move, What-if).
- SVG What-if curve component.

### Milestone 5: Algorithm Analysis
- Build `/algorithm`: Walkthrough, Comparison, Complexity, Correctness, Variations.
- Re-use engine data, render fully custom DP table with specific states (computed, current, dependencies, traceback path).
- Implement interactive controls and benchmarking chart (SVG).

### Milestone 6: Extra Tools & Reports
- Build `/tools`: Split, Transfer time, Compression, What-if, Approximate, Cleanup.
- Build `/reports`: Export center (PDF print view, CSV, JSON, Scripts).
- Build Settings Modal & Help Drawer.

### Milestone 7: QA & Polish
- Keyboard navigation & axe-core accessibility checks.
- End-to-end tests in Playwright.
- Screenshot verification across breakpoints (1440, 1366, 1024, 390).
