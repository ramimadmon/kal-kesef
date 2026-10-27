# Design System - Cal-Kesef (קל-כסף)

Version: 1.1 (1.1: stat tiles stack below 480px instead of 360px)
Last updated: 2026-10-27
Status: Approved (color direction confirmed by user: mint green + purple, light background). Exact values are `(proposed)` and may be tuned in Phase 0 only within WCAG AA.

## 1. Design Goal
A bright, friendly, one-page tool that makes a teenager say "wow, look how much it grew" within seconds. Purple stands for the money you put in, green for the money that grew by itself; this pairing is used consistently in numbers, legends and the chart.

## 2. Visual Language
Attributes: Colorful, Friendly, Clean, Confident, Mobile-first.
Personality: Feels like a modern consumer app, not a bank form. Playful in color and shape, serious in numbers.
Do:
- Use purple for deposits and green for profit everywhere, without exception.
- Use large, bold numbers for results; short Hebrew labels.
- Keep generous white space and rounded cards.
- Keep the disclaimer visible and readable, never hidden in fine print.
Don't:
- Don't add colors, gradients or fonts beyond this file.
- Don't use red for anything except input errors.
- Don't use emoji or illustrations as the only carrier of meaning.
- Don't use financial jargon in labels ("CAGR", "nominal") without a plain-Hebrew explanation.

## 3. Color System

| Role | Token | HEX | Usage |
|---|---|---|---|
| Primary (purple) | --color-primary | #7C3AED | Slider fill and thumb, focus ring, key accents |
| Primary hover | --color-primary-hover | #6D28D9 | Hover / active of primary elements |
| Primary strong | --color-primary-strong | #5B21B6 | Purple text (deposit numbers), header gradient start |
| Secondary (mint) | --color-secondary | #10B981 | Profit fills (chart, bars, badges). Not for text on white |
| Secondary strong | --color-secondary-strong | #047857 | Green text (profit numbers), header gradient end |
| Secondary soft | --color-secondary-soft | #D1FAE5 | Profit tile background |
| Primary soft | --color-primary-soft | #EDE9FE | Deposit tile background, slider track (unfilled) |
| Accent (optional) | --color-accent | #F59E0B | Rare emphasis only (e.g. small "magic of time" badge). Never for text on white |
| Background | --color-bg | #F7F6FD | Page background |
| Surface | --color-surface | #FFFFFF | Cards |
| Text | --color-text | #1E1B4B | Primary text, future value number |
| Muted text | --color-text-muted | #5B5875 | Helper text, captions, units |
| Border | --color-border | #E4E1F5 | Card borders, input borders, dividers |
| Success | --color-success | #047857 | Positive status (same as secondary strong) |
| Warning | --color-warning | #B45309 | Clamp hint ("max is 50 years") |
| Warning soft | --color-warning-soft | #FEF3C7 | Disclaimer background |
| Error | --color-error | #B91C1C | Invalid input message and input border |
| Info | --color-info | #1D4ED8 | Neutral notices (unused in MVP) |

Header gradient: `linear-gradient(135deg, var(--color-primary-strong), var(--color-secondary-strong))` with white text (both ends >= 4.5:1 with #FFFFFF).

Chart series (Phase 1): deposits `#8B5CF6` (fill) / `#5B21B6` (line), profit `#10B981` (fill) / `#047857` (line). Gridlines `--color-border`, axis labels `--color-text-muted`.

Dark mode: No (out of scope for MVP).
Contrast: all text / background pairs must meet WCAG AA (4.5:1 body, 3:1 large text and UI components). Mint `#10B981` and amber `#F59E0B` are fill-only colors.

## 4. Typography

Font families:
- Headings and body: Rubik (Google Fonts, weights 400, 500, 700), fallback `"Rubik", "Segoe UI", Arial, sans-serif`.
- Hebrew: Rubik (covers Hebrew).
- Numbers: Rubik with `font-variant-numeric: tabular-nums` so values don't jump while sliding.
- Load: one Google Fonts request with `display=swap`, subsets Hebrew + Latin.

| Style | Size (px / rem) | Weight | Line height | Usage |
|---|---|---|---|---|
| Display number | 40 / 2.5 (mobile 34 / 2.125) | 700 | 1.1 | Future value |
| H1 | 28 / 1.75 (mobile 24 / 1.5) | 700 | 1.2 | App name in header |
| H2 | 20 / 1.25 | 700 | 1.3 | Card titles |
| Stat number | 24 / 1.5 | 700 | 1.2 | Total deposits, profit |
| Body L | 18 / 1.125 | 400 | 1.5 | Header tagline |
| Body | 16 / 1 | 400 | 1.5 | Default text |
| Small | 14 / 0.875 | 400 | 1.45 | Helper text, disclaimer, captions |
| Label | 16 / 1 | 500 | 1.3 | Input labels, slider values |

Rules: one font family; weights 400 body, 500 labels, 700 headings and numbers; body line length <= 70 characters. Minimum text size 14px.

## 5. Spacing & Layout

Base unit: 4px.

| Token | Value |
|---|---|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 12px |
| --space-4 | 16px |
| --space-6 | 24px |
| --space-8 | 32px |
| --space-12 | 48px |

Layout: single page, max content width 1040px, centered. Page gutters 16px mobile / 32px desktop. Gap between cards `--space-6`. Card padding `--space-6` (mobile `--space-4`).

Page structure (top to bottom in source order):
1. Header (gradient band): app name + one-line tagline.
2. Results card.
3. Inputs card.
4. Chart card (Phase 1).
5. Disclaimer (also referenced right under the results).

## 6. Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| --radius-sm | 8px | Number inputs |
| --radius-md | 16px | Stat tiles |
| --radius-lg | 24px | Cards, header bottom corners |
| --radius-full | 9999px | Slider track and thumb, badges |

Shadows (2 levels):
- `--shadow-card`: `0 4px 16px rgba(30, 27, 75, 0.08)` - cards.
- `--shadow-thumb`: `0 2px 6px rgba(91, 33, 182, 0.35)` - slider thumb.

## 7. Components

### Input row (slider + number field)
- Structure per input: label (Label style) and a one-line helper (Small, muted) above; below them a row with the range slider (flex 1) and a number field (width 112px) with a unit suffix (₪, שנים, %).
- Slider: track height 8px, `--radius-full`; filled part `--color-primary`, unfilled `--color-primary-soft`; thumb 28px circle, white with 3px `--color-primary` border and `--shadow-thumb`. Hit area at least 44px tall. Fill direction follows RTL (fills from the right).
- Number field: height 44px, `--radius-sm`, 1px `--color-border`, text centered, `inputmode="decimal"`, tabular numbers, LTR digits isolated inside the RTL row.
- Sync: moving the slider updates the field and vice versa, live.
- States: default; hover (border `--color-primary-hover`); focus (2px outline `--color-primary`, offset 2px); invalid (border and message `--color-error`, message below the row, `aria-describedby`); clamped (message in `--color-warning`, e.g. "המקסימום הוא 50 שנה"); disabled (not used).
- Validation timing: on input, results recompute when the value is valid; clamping and messages happen on blur.

### Results card
- Hero: future value, label "כמה יהיה לך בעוד N שנים", Display number in `--color-text`.
- Two stat tiles side by side; stacked vertically below 480px (user decision 2026-10-27, fixes ₪ wrapping on 7+ digit values):
  - Deposits tile: background `--color-primary-soft`, number `--color-primary-strong`, label "כמה הפקדת".
  - Profit tile: background `--color-secondary-soft`, number `--color-secondary-strong`, label "כמה הכסף הרוויח לבד".
- Optional one-line insight under the tiles (Small): e.g. "הרווח הוא X% מהסכום הסופי" (computed in calculator.js only).
- Container has `aria-live="polite"`; updates are not animated (instant).
- A short disclaimer line directly under the tiles (Small, muted) linking to the full disclaimer.

### Cards
- Surface `--color-surface`, `--radius-lg`, `--shadow-card`, 1px `--color-border`. Card title H2.

### Disclaimer
- Background `--color-warning-soft`, text `--color-text`, Small, `--radius-md`, padding `--space-4`, an info icon at the inline start.
- Text (Hebrew, final copy may be refined in Phase 0): "המחשבון נועד להמחשה בלבד. התשואה אינה מובטחת, החישוב אינו כולל אינפלציה, מסים ודמי ניהול, ואינו מהווה ייעוץ השקעות."

### Chart (Phase 1)
- Card with H2 "איך הכסף גדל לאורך השנים".
- Stacked area or stacked bar per year: deposits (purple) at the bottom, profit (green) on top.
- Legend with color swatch + text label. Tooltip shows year, deposits, profit and total, formatted ILS.
- Height 280px mobile / 360px desktop. X axis: years starting from the right (RTL).
- Fallback text if the library fails to load: "לא הצלחנו לטעון את הגרף, אבל כל המספרים למעלה מעודכנים."

### Buttons
- None in MVP (results compute live). Do not add buttons without asking.

## 8. Iconography
Inline SVG only (no icon library). Needed icons: info (disclaimer). Size 20px, stroke 2px, `currentColor`. Do not mirror the info icon.

## 9. Motion
Durations: 150ms for hover/focus color changes; chart transitions 300ms ease-out (Phase 1). No animation on result numbers. Respect `prefers-reduced-motion` (disable chart animation and transitions).

## 10. Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 640px | Single column: header, results, inputs, chart, disclaimer. Stat tiles stacked below 480px, side by side from 480px. A formatted value plus ₪ never wraps inside a tile at any width (`white-space: nowrap` on the value). |
| Tablet | 640-899px | Single column, wider cards, larger gutters. |
| Desktop | >= 900px | Two columns: inputs card on the right (start), results card on the left, `position: sticky; top: 24px`. Chart and disclaimer full width below. |

Minimum supported width 320px; no horizontal scroll at any width.

## 11. Accessibility
- WCAG AA contrast (see section 3).
- Full keyboard operation: sliders respond to arrow keys, Page Up/Down and Home/End (native `input type="range"`).
- Visible focus ring: 2px solid `--color-primary`, offset 2px, never removed.
- Every slider and number field has a visible `<label>`; slider and field share the same label via `aria-labelledby`; slider has `aria-valuetext` with unit (e.g. "20 שנים").
- Results region `aria-live="polite"`.
- Profit vs. deposits never by color alone: always a text label (and legend in the chart).
- Minimum touch target 44x44px.

## 12. RTL & Localization
- `<html lang="he" dir="rtl">`; use logical CSS properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`).
- Text aligned to the start (right) by default.
- Currency and numbers: `Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })`; wrap formatted numbers in `<bdi>` (or `unicode-bidi: isolate`) to prevent reversed signs.
- Percent: `Intl.NumberFormat('he-IL', { style: 'percent', maximumFractionDigits: 1 })`.
- Copy: short, second person, gender-neutral where possible (e.g. "כמה יהיה לך").

## 13. UX Principles
1. Results are visible on load; there is no "calculate" button.
2. Every change gives instant feedback.
3. One idea per card: results, inputs, growth.
4. Purple = what you put in, green = what grew by itself, everywhere.
5. Never punish input mistakes: keep the last valid result and explain gently.
6. Plain teen-friendly Hebrew; one helper line per input at most.

## 14. UI States
| Screen / Component | Empty | Loading | Success | Error |
|---|---|---|---|---|
| Results card | N/A (defaults always present) | N/A (instant) | Numbers for current inputs | Last valid numbers kept; error shown at the input |
| Input row | Empty field -> inline "צריך להזין מספר" | N/A | Synced slider + field | Out of range -> clamped on blur with warning hint; non-numeric -> error |
| Chart (Phase 1) | N/A | Card skeleton (bordered empty area) until library loads | Chart for current inputs | Fallback text, numbers unaffected |
| Fonts | N/A | System fallback (`display=swap`) | Rubik | System fallback |

## 15. Open Questions
None blocking. Final Hebrew microcopy may be refined in Phase 0 within these rules.
