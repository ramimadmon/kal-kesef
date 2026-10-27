# Cal-Kesef - Architecture & Product Requirements

Version: 1.4   Date: 2026-10-27   Status: Launched - https://kal-kesef-beige.vercel.app/   Build tool: Claude Code
Verified against: OWASP Top 10:2025, OWASP ASVS 5.0 (harness references), 2026-10-27
Word copy: `shraga/Cal-Kesef-PRD.docx` (generated from this file; this file is the source of truth)

## 1. Product Overview
- Name: Cal-Kesef (קל-כסף)
- Short description: A single-page, Hebrew, RTL compound-interest calculator that shows teenagers how long-term saving grows money.
- Primary goal: Make the effect of time and compounding visible and intuitive in under one minute of play.
- Target users: Teenagers (approx. 13-18), mostly on mobile phones; secondary: parents and educators showing it in class.

## 2. Core Problem
- Problem definition: Teens rarely see how small, regular deposits grow over 10-30 years; "compound interest" stays an abstract term.
- Why existing solutions fail: Bank and pension calculators are form-heavy, adult-oriented, often English or LTR, and show a single final number instead of the growth story.

## 3. Main User Flows
- First-time user: Opens the link -> sees results already computed from defaults (10% annual return, 20 years) -> drags a slider -> numbers update instantly.
- Core usage: Adjusts initial amount, monthly deposit, period and annual return (slider or number field) -> reads future value, total deposits and accumulated profit -> (Phase 1) watches the growth chart change.
- Returning user: Same as first-time; no state is saved (by design).
- Admin: None.

## 4. MVP Feature Set
| Area | Features | Phase |
|---|---|---|
| Authentication | None (no accounts, by requirement) | - |
| Core logic | Compound-interest engine (pure JS module); input validation and clamping | 0 |
| Inputs | Initial amount, monthly deposit, years, annual return; each as slider + numeric field kept in sync; defaults 10% / 20 years | 0 |
| Results | Future value, total deposits, accumulated profit; live update on every input change | 0 |
| Disclaimer | Always-visible notice: returns are for illustration only and not guaranteed; not investment advice | 0 |
| Growth chart | Interactive yearly chart: deposits vs. accumulated profit, with tooltip per year | 1 |
| Deployment | Static deployment to Vercel with security headers | 1 |
| Data storage | None | - |
Out of scope for MVP: accounts, saving scenarios, backend, database, analytics/tracking, inflation adjustment, taxes and fees, currency other than ILS, multiple languages, sharing links with parameters, PWA/offline mode.

## 5. System Architecture
- Components and responsibilities:
  - `index.html` - markup, RTL layout, disclaimer.
  - `css/styles.css` - design tokens and styles (from `shraga/DESIGN_SYSTEM.md`).
  - `js/calculator.js` - pure calculation module (no DOM access). Single source of financial logic.
  - `js/app.js` - UI wiring: reads inputs, validates, calls `calculator.js`, renders results (and chart in Phase 1).
  - `tests/` - browser-run unit tests for `calculator.js` (see 10. Quality & Testing).
  - `vercel.json` (Phase 1) - static hosting config and security headers.
- Trust boundaries: Everything runs in the browser. No secrets, no server, no user data leaves the device. The only third-party content is the pinned chart library (Phase 1) and web fonts.
- Data flow: input event -> parse + clamp -> `calculate(params)` -> result object `{ futureValue, totalDeposits, profit, yearly[] }` -> render text (and chart).
- Architectural rules:
  - All financial math lives only in `js/calculator.js`; `app.js` never computes money values.
  - No build step, no bundler, no framework, no package manager required to run. Scripts are classic `<script defer>` files sharing the global namespace `window.CalKesef` (not ES modules), so `index.html` and the test page work when opened directly from disk (file://).
  - User-influenced values are written to the DOM with `textContent` only, never `innerHTML`.
  - Every third-party script is pinned to an exact version with Subresource Integrity (SRI).

### Calculation model
- Monthly rate derived from the effective annual return: `r_m = (1 + R)^(1/12) - 1` (assumption: effective, not nominal R/12).
- Deposits are made at the end of each month; the initial amount is invested at month 0.
- `FV = P * (1 + r_m)^n + D * ((1 + r_m)^n - 1) / r_m`, where `n = years * 12`; if `R = 0`, `FV = P + D * n`.
- `totalDeposits = P + D * n`; `profit = FV - totalDeposits`.
- `yearly[]` holds, for each year 0..N: `{ year, balance, deposits, profit }` (used by the chart in Phase 1).
- Values are nominal (no inflation, no tax, no fees). Displayed rounded to whole shekels, formatted with `Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })`.

### Input ranges (assumption)
| Input | Default | Min | Max | Step |
|---|---|---|---|---|
| Initial amount (₪) | 1,000 | 0 | 1,000,000 | 100 |
| Monthly deposit (₪) | 200 | 0 | 20,000 | 50 |
| Saving period (years) | 20 | 1 | 50 | 1 |
| Annual return (%) | 10 | 0 | 20 | 0.5 |

Numeric fields accept any value in range; out-of-range values are clamped on blur with an inline hint. Empty or non-numeric input shows an inline error and keeps the last valid result visible.

## 6. Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Frontend | Plain HTML5 + CSS + vanilla JavaScript (classic scripts, one global namespace) | Simplest possible; no installs, no build, runs from file:// |
| Backend / functions | None | Not needed |
| Database | None | No persistence by requirement |
| Auth | None | No accounts by requirement |
| Storage | None | - |
| Charting (Phase 1) | Chart.js 4.5.1, exact version pinned, loaded from cdnjs with SRI + crossorigin, injected by `js/app.js` after the first render | Mature, accessible tooltips, touch support; dynamic load keeps results independent of the CDN |
| Fonts | Google Fonts, Rubik (400/500/700, Hebrew + Latin) | Modern Hebrew typography |
| Hosting | Vercel, static site (no framework preset) | Free tier, HTTPS, headers via `vercel.json` |
| Testing | Browser test page `tests/index.html` with a minimal assert helper; manual QA script | Node.js is not installed on the build machine; zero-install testing |

## 7. AI Architecture
Not applicable. The product makes no AI calls.

## 8. Data Structure
No persisted entities. In-memory structures only:
| Entity | Key fields | Relations | Access rule |
|---|---|---|---|
| CalcParams | initial, monthly, years, annualRatePct | Input to calculate() | Local to page |
| CalcResult | futureValue, totalDeposits, profit, yearly[] | Output of calculate() | Local to page |

## 9. UX / UI Guidelines
1. Design Goal - Playful, colorful and trustworthy. A teen should "get it" by moving one slider, and feel that saving is something they can do.
2. Main Screens / Views - One page: header (name + one-line hook), results card (3 highlighted numbers), inputs card, chart card (Phase 1), disclaimer. On mobile the results card comes before the inputs; on desktop they sit side by side.
3. Main User Flows - See section 3. Results are visible on load (no "Calculate" button).
4. UX Principles - Instant feedback on every change; results above the inputs on mobile; purple = deposits, green = profit, everywhere; one idea per card; plain teen-friendly Hebrew (no jargon, short labels with an optional one-line explanation); large touch targets; never block the user with errors - keep the last valid result.
5. Visual Language - Modern, colorful, friendly, clean, high-contrast. Mint green + purple on a light background (user decision, 2026-10-27); font Rubik.
6. Design System - Full spec: `shraga/DESIGN_SYSTEM.md`.
7. Responsive Behavior - Mobile-first single column (min width 320px); on desktop (>= 900px) inputs and results sit side by side (results sticky), chart full width below.
8. Accessibility - Full RTL (`<html lang="he" dir="rtl">`); numbers and currency rendered with correct bidi isolation; every slider has a visible label and a linked numeric field; keyboard operable; visible focus; contrast WCAG AA; results region uses `aria-live="polite"`; colors never the only signal in the chart (Phase 1 legend + tooltip text).
9. UI States - Default (computed from defaults), Updated (live), Invalid input (inline message, last result kept), Chart loading/failed (Phase 1: text fallback "the chart could not be loaded", numbers still shown).
10. Open Design Questions - None (color direction and font resolved in DESIGN_SYSTEM.md).

## 10. Technical Requirements
- Backend logic: None.
- APIs / integrations: None (chart library and fonts are static assets).
- Performance: Results update within one animation frame of input; page usable on a mid-range phone; total page weight < 300 KB excluding fonts and chart library.
- Cost control: Vercel free tier; no metered services.

### Security
- Drivers: Public static page, no user data, no secrets. Main risks are supply chain (third-party script) and DOM injection.
- Baseline: OWASP Top 10:2025 items relevant to static sites (A03 supply chain, A05 injection, A02 security misconfiguration); ASVS 5.0 Level 1 subset.
- Phase 0: no `innerHTML`/`eval` with user-influenced values; input parsing with `Number()` + range clamp; no inline event handlers; CSP via `<meta http-equiv>` limited to self and the font origin.
- Phase 1: chart library pinned + SRI + `crossorigin="anonymous"`; `vercel.json` headers: `Content-Security-Policy` (default-src 'self'; script-src 'self' cdnjs; style/font for Google Fonts), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal, `frame-ancestors 'none'`.
- No cookies, no storage, no analytics, so no consent banner is required.

### Quality & Testing
- Approach: Unit tests on `js/calculator.js` (the only place with logic), run in the browser via `tests/index.html` showing pass/fail counts; plus a manual/browser-automated QA script for UI.
- Critical paths: Default values produce the expected result; 0% return; 0 initial; 0 monthly; 1 year and 50 years; max values do not overflow or produce NaN; yearly[] length = years + 1 and last balance = futureValue; sliders and fields stay in sync; RTL rendering on a 375px viewport.
- Reference values: Unit tests compare against independently computed expected values with tolerance <= 1 ₪.
- Definition of Done (per phase): all tests in `tests/index.html` pass; no console errors; manual QA script passed at 375px and 1280px; phase report written; `/shraga-review` approved.

## 11. Success Criteria
| Dimension | Metric | Target |
|---|---|---|
| Comprehension | A teen can explain "why the profit grew" after 1 minute (informal test) | 4 of 5 testers |
| Usability | Time to first slider interaction | < 10 seconds |
| Correctness | Unit tests vs. reference values | 100% pass, within 1 ₪ |
| Reliability | Console errors on load and interaction | 0 |
| Performance | Lighthouse (mobile) Performance / Accessibility | >= 90 / >= 95 |

## 12. Risks & Limitations
| ID | Category | Risk | Severity | Mitigation | Owner phase |
|---|---|---|---|---|---|
| R1 | Legal / Product | Users read the illustrative return as a promise or as investment advice | Major | Permanent disclaimer near results; wording "illustration only, not guaranteed, not investment advice"; no product or fund recommendations | 0 |
| R2 | Product | 10% default return looks optimistic to adults; nominal values ignore inflation, tax and fees | Minor | Disclaimer mentions nominal values and no inflation/tax/fees; user can lower the rate | 0 |
| R3 | Technical | Wrong formula or rounding produces misleading numbers | Major | Single calculation module; unit tests vs. reference values | 0 |
| R4 | Technical / UX | RTL bidi issues: currency sign and numbers appear reversed | Minor | Intl formatting + bidi isolation; QA on mobile | 0 |
| R5 | Security | Compromised or changed third-party chart script | Major | Exact version, SRI, CSP | 1 |
| R6 | Technical | CDN unavailable -> chart missing | Minor | Graceful fallback; numbers never depend on the chart | 1 |
| R7 | Technical | No Node.js or Python on build machine limits tooling (no npm test, no local server, no Vercel CLI) | Minor | Browser test page; deploy via Vercel Git import or dashboard | 0-1 |

Accepted constraints: no persistence, no inflation/tax modeling, Hebrew only.

## 13. Assumptions & Open Questions
- Assumptions:
  - App name in Hebrew rendered as "קל-כסף" (assumption; confirm wording).
  - Effective annual rate converted to monthly; end-of-month deposits.
  - Defaults beyond the required ones: initial ₪1,000, monthly ₪200.
  - Input ranges as in section 5.
  - Phase numbering follows the harness: the user's "Phase 1" is Phase 0 here, and "Phase 2" is Phase 1.
  - Vercel deployment uses a GitHub repository import or the Vercel dashboard (user has or will create the accounts).
- Open questions (material only): none.
- Resolved: deployment goes through a GitHub repository imported into Vercel (user decision 2026-10-27). The user owns the GitHub and Vercel accounts and performs account actions.

## 14. Development Phases
Two phases only (user requirement). Details in Plan.md.
- Phase 0 - Working calculator with designed UI: project rules file, calculation module + tests, inputs (slider + field), live results, disclaimer, responsive RTL design per DESIGN_SYSTEM.md.
- Phase 1 - Growth chart and Vercel deployment: yearly growth chart (deposits vs. profit) with fallback, `vercel.json` security headers, production deployment, final regression and security check.

## Change Log
| Version | Date | Change |
|---|---|---|
| 1 | 2026-10-27 | Initial PRD from the user's brief ("prompt 002"). |
| 1.1 | 2026-10-27 | Design direction approved (mint + purple, Rubik); DESIGN_SYSTEM.md created; results card above inputs on mobile. |
| 1.2 | 2026-10-27 | Plan.md created. Classic scripts with a global namespace instead of ES modules (Node.js and Python not installed; app and tests must run from file://). |
| 1.3 | 2026-10-27 | Phase 0 closed. Deployment method decided: GitHub repository -> Vercel Git import. Stat tiles stack below 480px (DESIGN_SYSTEM.md v1.1). |
| 1.4 | 2026-10-27 | Phase 1 closed, product launched on Vercel. Chart.js 4.5.1 injected dynamically by app.js (same SRI/crossorigin). Stricter CSP adopted (adds img-src 'self', connect-src 'none', form-action 'none'). |
