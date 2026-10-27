# Plan - Cal-Kesef (קל-כסף)
Build tool: Claude Code   Stack: static HTML + CSS + vanilla JS (classic scripts, no build), Chart.js pinned (Phase 1), Vercel static hosting
Source of truth: shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md
Rules: one phase at a time; tests run every phase; `/shraga-review` closes every phase; no work outside the current phase.
Two phases only (user requirement). User's "Phase 1" = Phase 0 here; user's "Phase 2" = Phase 1 here.

## Status
| Phase | Name | Status |
|---|---|---|
| 0 | Working calculator with designed UI | Closed 2026-10-27 - Approved with conditions (shraga/reviews/phase-0-review.md) |
| 1 | Growth chart, Vercel deployment and launch check | Next - carries Phase 0 conditions C1-C5 |

## Conditions carried from Phase 0 (must be closed in Phase 1)
- C1 (V1) Stat-tile values of 7+ digits wrap the ₪ sign at 360-639px. Fix: stack tiles below 480px and keep value + ₪ on one line (DESIGN_SYSTEM.md v1.1, user decision).
- C2 (V2) Short note under the results must also say it is not investment advice (e.g. "...ואינו ייעוץ השקעות").
- C3 (V3) Regression screenshots stored in the repo under `docs/screenshots/` (excluded from deployment by `.vercelignore`).
- C4 (V4) Regression includes Firefox and at least one real mobile browser; Firefox slider thumb aligned to 28px.
- C5 (V5) Limit live announcements: `aria-live` announces only the future value, not all three results on every input.
- Noted (V6): off-step typed values (e.g. 1050) are used as typed while the slider snaps; accepted per PRD.

## Global constraints (both phases)
- No backend, no database, no auth, no storage (no cookies, localStorage or analytics).
- No package manager and no build step. Node.js and Python are NOT installed on the build machine.
- Classic `<script defer>` files sharing one global namespace `window.CalKesef` (not ES modules),
  so `index.html` and `tests/index.html` work when opened directly from disk (file://).
- All financial math only in `js/calculator.js` (no DOM access there). UI code never computes money values.
- User-influenced values reach the DOM via `textContent` only; no `innerHTML`, `eval` or inline handlers.
- Only colors, fonts and components defined in shraga/DESIGN_SYSTEM.md. New ones require asking the user.
- Any new dependency, folder or deviation from this plan: stop and ask; record it in the phase report.

## Phase 0 - Working calculator with designed UI
Objectives: a complete, correct, good-looking calculator on one page, with live results and the disclaimer.
Features:
- `.claude/rules/project.md`: stack, file layout, how to run (open `index.html`), how to test
  (open `tests/index.html`), conventions (namespace, textContent rule, tokens). CLAUDE.md is never edited.
- File layout: `index.html`, `css/styles.css`, `js/calculator.js`, `js/app.js`, `tests/index.html`,
  `tests/test-runner.js`, `tests/calculator.test.js`.
- `calculator.js`: `calculate({ initial, monthly, years, annualRatePct })` -> `{ futureValue, totalDeposits,
  profit, yearly[] }` per the calculation model in PRD section 5; input clamping helper with the PRD ranges.
- UI per DESIGN_SYSTEM.md: gradient header, results card (future value + deposits tile + profit tile),
  inputs card (4 rows of slider + number field, synced), disclaimer block, responsive layout (results above
  inputs on mobile; two columns >= 900px), RTL, Rubik font, ILS formatting with bidi isolation.
- Defaults: initial 1,000; monthly 200; 20 years; 10%. Results visible on load, no calculate button.
- Validation states: empty/non-numeric -> inline error, last valid result kept; out of range -> clamped on blur
  with warning hint.
- CSP `<meta>`: self + Google Fonts origins only.
Inputs: PRD (sections 3-5, 9, 10, 12), DESIGN_SYSTEM.md (all sections except Chart).
Outputs: working `index.html` opened from disk; passing test page; `.claude/rules/project.md`; phase report.
Acceptance criteria:
- AC-0.1 With defaults, displayed values match `calculate()` and the independent reference values in tests.
- AC-0.2 Moving any slider updates its number field and all three results immediately, and vice versa.
- AC-0.3 Invalid input never shows NaN, Infinity or a blank result; last valid result stays visible.
- AC-0.4 Disclaimer text is visible without interaction on mobile and desktop.
- AC-0.5 Layout correct at 320px, 375px and 1280px; no horizontal scroll; RTL correct; ₪ not reversed.
- AC-0.6 Keyboard-only use works (Tab order logical, arrows move sliders, focus ring visible).
- AC-0.7 No console errors; no colors or fonts outside DESIGN_SYSTEM.md tokens.
Validation: `tests/index.html` shows all green with counts; screenshots at 375px and 1280px in the report;
grep shows no `innerHTML`/`eval` in `js/`.
Risk gate: R1 (disclaimer wording present), R3 (formula tested vs. reference), R4 (bidi checked).
Tests:
- Unit (tests/calculator.test.js): defaults; 0% return; initial 0; monthly 0; 1 year; 50 years; max values;
  `yearly.length === years + 1`; last yearly balance === futureValue; profit === futureValue - totalDeposits;
  clamping at min/max; tolerance <= 1 ₪.
- UI: manual QA script in the report (or browser-tool run): defaults, slider sync, invalid input, resize, keyboard.
Out of scope: chart, `vercel.json`, deployment, any library.

## Phase 1 - Growth chart, Vercel deployment and launch check
Objectives: show growth over time visually, publish on Vercel, and confirm the app is safe and correct to launch.
Features:
- Chart card per DESIGN_SYSTEM.md: stacked yearly deposits (purple) vs. profit (green) from `yearly[]`,
  legend, ILS tooltip (year, deposits, profit, total), RTL axis, live update with the inputs,
  `prefers-reduced-motion` respected.
- Chart.js exact version from cdnjs with SRI + `crossorigin="anonymous"`; skeleton while loading;
  text fallback if it fails. Results card never depends on the chart.
- `vercel.json`: static output, headers - CSP (default-src 'self'; script-src 'self' cdnjs; Google Fonts for
  style/font; frame-ancestors 'none'), X-Content-Type-Options nosniff, Referrer-Policy
  strict-origin-when-cross-origin, minimal Permissions-Policy. `.vercelignore` excludes `tests/`, `docs/` and `shraga/`.
- Close Phase 0 conditions C1-C5 (see section above) before the launch check.
- Deployment (user decision): git repository in the project folder (`.gitignore` excludes `*.zip`), pushed to a
  GitHub repository the user creates, imported into Vercel by the user. The build session prepares the repo,
  commits, and gives step-by-step Hebrew instructions; it pushes only after the user confirms the remote.
- Launch check: full regression of Phase 0 + Phase 1, security review of headers and third-party script,
  Lighthouse mobile run on the production URL.
Inputs: PRD (sections 5, 10, 12), DESIGN_SYSTEM.md (Chart, Motion, States), Phase 0 code and report.
Outputs: chart in the app; `vercel.json`; production URL; phase report with evidence.
Acceptance criteria:
- AC-1.1 Chart reflects current inputs; last bar/point total equals the displayed future value.
- AC-1.2 Deposits and profit distinguishable without color (legend + tooltip text).
- AC-1.3 Blocking the CDN shows the fallback text; numbers still update; no uncaught errors.
- AC-1.4 Production URL loads over HTTPS; response headers match the list above; no CSP violations in console.
- AC-1.5 All Phase 0 acceptance criteria still pass (regression).
- AC-1.6 Lighthouse mobile: Performance >= 90, Accessibility >= 95.
Validation: header dump from the production URL; screenshots of chart at 375px and 1280px; test page green.
Risk gate: R5 (SRI + CSP verified), R6 (fallback verified), R7 (deployment method agreed);
no open Critical / Major findings from the security review.
Tests: unit tests unchanged and green + new unit test for chart data mapping (pure function in `app.js`
or a small `js/chart-data.js`); manual/browser QA for chart, fallback and production headers.
Out of scope: analytics, custom domain (unless the user asks), sharing links, PWA, any backend.

## Change Log
| Date | Change |
|---|---|
| 2026-10-27 | Plan created: 2 phases per user brief; classic scripts instead of ES modules (no local server or Node on the build machine). |
| 2026-10-27 | Phase 0 closed (Approved with conditions, user confirmed). Conditions C1-C5 moved into Phase 1. Adopted Phase 0 implementation deviations: Intl `minimumFractionDigits: 0`; years rounded to whole numbers; non-numeric error shown while typing (empty on blur); number fields `type="text"` + inputmode + `dir="ltr"`; mobile stat-tile inline padding 8px; optional insight line dropped; lint search is case-sensitive. |
| 2026-10-27 | C1 decided by user: stat tiles stack below 480px (DESIGN_SYSTEM.md v1.1). |
| 2026-10-27 | Deployment method decided by user: GitHub -> Vercel Git import (closes R7 decision). |
