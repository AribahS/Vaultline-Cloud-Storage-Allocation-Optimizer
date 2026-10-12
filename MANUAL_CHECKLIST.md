# Manual Visual Verification Checklist

The browser subagent could not capture automated screenshots because the sandbox environment cannot download external Playwright binaries. Visual items are **verified by tests, not visually**. Please review the following in a desktop and mobile browser.

## 1. Landing Page (`/landing`)
- [ ] **Hero Section (Dark Violet Stage)**
  - [ ] Background is deep violet (`#2B1A4A`).
  - [ ] Main heading "Decide what to keep." is paper white (`#F1F7ED`) with "to keep." highlighted in gold (`#E3D081`).
  - [ ] Subtitle text is legible muted on dark (`#E7DEF7`).
  - [ ] "Try sample data" primary CTA has gold fill (`#E3D081`) with violet text (`#2B1A4A`), clicking opens `/play` with 12 sample files loaded.
  - [ ] "Open app" secondary CTA has paper white outline and text, clicking opens `/files`.
  - [ ] Hero SVG illustration shows vault with KEEP (mint `#91C7B1`) and MOVE (crimson `#B33951`) indicators.
- [ ] **How It Works Strip**
  - [ ] Background is paper white (`#F1F7ED`).
  - [ ] Step numbers (1, 2, 3) in violet round badges with paper white numerals.
  - [ ] Labels and descriptions in ink (`#2B1A4A`) and muted ink.
- [ ] **Feature Cards**
  - [ ] Cards have subtle border and light card surface (`#FAFCF7`).
  - [ ] Feature headings in ink (`#2B1A4A`), body copy in muted ink.
  - [ ] Icon tiles tinted in mint (`#91C7B1`) with dark violet icons.
- [ ] **Closing Band**
  - [ ] Violet background (`#2B1A4A`) with paper white heading and muted subtext.
  - [ ] No duplicate CTA buttons.

## 2. Top Bar & Navigation (`/files`, `/play`, `/results`)
- [ ] Background is paper white (`#F1F7ED`) with clean subtle bottom border.
- [ ] Active navigation tab has violet background (`#2B1A4A`) with paper white text.
- [ ] Scan summary chip has soft mint tint background with violet text.
- [ ] "Add files" quiet button has subtle outline and dark violet text.

## 3. Play Stage (`/play`)
- [ ] Challenge and explore stages use violet background (`#2B1A4A`).
- [ ] Slider and capacity controls are legible.
- [ ] Primary buttons on dark stage use gold fill with violet text.

## 4. Mobile Viewport (390x844)
- [ ] Hero section stacks cleanly without horizontal overflow.
- [ ] Feature cards and step strip stack into a single column.
- [ ] Top bar navigation remains accessible.
