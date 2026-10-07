# Vaultline project rules
1. We are rebuilding the OLD version of this app, page by page, inside the existing sidebar shell. This is a restore, not a redesign. Do not restyle, rename, reorder or "improve" anything that the current task does not mention.
2. Never modify anything in /src/engine. Call its existing functions only.
3. One task = one step. Do only what the step lists. If something else looks wrong, list it in your report; do not fix it.
4. Keep the current shell and theme as the baseline. Put colours, spacing and fonts in the existing theme file or CSS variables; do not hardcode hex values inside components. Reuse existing components before writing new ones.
5. Shared helpers live in /src/lib/format.js: formatSize (uses GB with up to 2 decimals above 1 GB, otherwise MB or KB; never shows values like 15703.45 MB) and pluralize (so we never show "1 files"). Use them everywhere.
6. No invented numbers or claims in the UI. Every number comes from the data or the engine.
7. After each step: run the build and any existing tests, commit with a clear message, and report: what changed (files), how you verified it (commands and output), screenshots at 1366x768 saved to /screenshots/<step-name>/, and anything you noticed but did not touch. Never say something works unless you ran it.
8. If a step is unclear, ask one short question instead of guessing.
