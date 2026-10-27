# Architecture Review - Phase 0: Working calculator with designed UI
Verdict: Approved with conditions
Round: 1   Date: 2026-10-27
Reviewed: shraga/reports/phase-0-report.md + code (index.html, css/styles.css, js/calculator.js, js/app.js, tests/*, .claude/rules/project.md)
Baseline: shraga/prompts/phase-0-prompt.md, shraga/Plan.md (Phase 0, Global constraints), shraga/project-arch-plan.md v1.2, shraga/DESIGN_SYSTEM.md v1.0 (risk register lives in PRD section 12)

## 1. Summary
The implementation matches the approved architecture: static HTML/CSS with classic `<script defer>` files on `window.CalKesef`, all money math isolated in a DOM-free `js/calculator.js`, UI wiring in `js/app.js` that only parses, validates, formats and renders via `textContent`. The calculation model, input ranges, defaults, validation states, CSP and layout follow the PRD and DESIGN_SYSTEM.md. Tests pass on a clean run and the reference values were independently reproduced by the reviewer. Only Minor findings remain; they are carried as conditions.

## 2. Evidence Verified by the Reviewer
Tests: `& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --dump-dom "file:///C:/Users/User/Desktop/projects/kal-kesef/tests/index.html" | Select-String -Pattern 'id="summary"|FAIL'` -> `PASSED: 18 FAILED: 0`, no FAIL lines, 0 skipped (the runner has no skip mechanism).
Lint: `Select-String -CaseSensitive -Path js\*.js, index.html -Pattern 'innerHTML|eval|new Function|onclick='` -> no matches.
Extra checks (reviewer): `Select-String -Path js\*.js, index.html, tests\*.js -Pattern '\son[a-z]+=|style="|localStorage|sessionStorage|document\.cookie|insertAdjacentHTML|outerHTML|document\.write|skip|xit|only\('` -> no matches; raw hex colors in css/styles.css outside `:root` -> 0.
Reference values: reviewer re-ran an independent month-by-month PowerShell simulation (`b = b*(1+r_m) + D`, `r_m = (1+R)^(1/12)-1`) for all 7 non-trivial reference cases; every value matches the test constants to 4 decimals (e.g. defaults 150,379.3456; max values 20,987,770,439.0734).
App DOM (headless `--dump-dom` of index.html): fv 150,379 ₪, deposits 49,000 ₪, profit 101,379 ₪, label "בעוד 20 שנים"; sliders carry min/max/step from `RANGES` and `aria-valuetext` with units. Headless console showed only browser-internal messages (shutdown / sync), no page errors or CSP violations.
Screenshots: reviewer opened `phase0-375-viewport.jpg` and `phase0-1280.png` (session scratchpad): RTL correct, ₪ not reversed, results above inputs on mobile, inputs right / results left on desktop, slider fill from the right.
Changes inspected: not a git repository; all files listed in report section 3 exist and were read in full.

## 3. What Matches the Architecture
- Stack and file layout exactly as Plan.md / project.md; no ES modules, bundler, npm or library; no Phase 1 work (no chart, Chart.js, vercel.json).
- Boundary: `calculator.js` has no DOM access; `app.js` computes no money values (only slider fill percentage and formatting).
- Calculation model per PRD 5: effective annual -> monthly rate, initial at month 0, end-of-month deposits, R=0 branch, `yearly[]` 0..N with `{year, balance, deposits, profit}`.
- Input safety: `parseInput` trims, rejects empty, uses `Number()`, rejects NaN/Infinity; `normalizeInput` clamps to PRD ranges; `calculate()` throws on out-of-range input and `render()` keeps the last result if it ever throws.
- Security: CSP meta (`default-src 'self'`, scripts self only, styles self + fonts.googleapis.com, fonts fonts.gstatic.com, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`); `textContent` only; no inline handlers, no storage, no cookies, no analytics, no third-party scripts.
- Design: all tokens declared once in `:root`, logical properties, Rubik with tabular numbers, `<bdi>` + Intl ILS formatting, focus ring 2px primary with offset, 44px touch targets, `aria-live="polite"`, labels linked, disclaimer text verbatim from DESIGN_SYSTEM.md, `prefers-reduced-motion` respected.
- Tests cover every Phase 0 case in Plan.md plus negative cases (NaN, Infinity, "1e400", empty, unknown names, fractional years, out-of-range calculate).
- Deviations are reported honestly in report section 7; none changes architecture, stack, schema or scope.

## 4. Violations
| # | Area | Type | Finding | Severity |
|---|---|---|---|---|
| V1 | Non-functional (UI) | Incomplete implementation | At 360-639px, stat-tile values of 7+ digits (e.g. 50 years: profit 2,915,598 ₪) wrap the ₪ sign onto a second line. No overflow or scroll, but the tile looks broken at realistic inputs. Reported by the builder as a known issue. | Minor |
| V2 | Security / Product (R1) | Missing detail | The short note directly under the results ("המספרים להמחשה בלבד ואינם מובטחים") omits "not investment advice"; the full disclaimer with that wording is at the bottom of the page and, on mobile, below the whole inputs card (needs scrolling). DESIGN_SYSTEM allows a short linked line, so this is not a contradiction, but R1's wording is not fully near the results on mobile. | Minor |
| V3 | Documentation | Missing detail | Screenshot evidence lives only in the temporary session scratchpad, not in the repo or report, so it will not survive the session (Plan.md: "screenshots at 375px and 1280px in the report"). | Minor |
| V4 | Non-functional (UI) | Missing detail | Slider styling verified only in Edge (WebKit/Blink pseudo-elements). Firefox uses a 22px thumb (DESIGN: 28px) and was not tested; iOS Safari not tested. | Minor |
| V5 | Accessibility | Missing detail | The `aria-live="polite"` region wraps all three results and is updated on every slider `input` event, which can produce a flood of announcements for screen-reader users while dragging. | Minor |
| V6 | Contract (UI sync) | Missing detail | A typed value that is in range but off-step (e.g. initial 1050) is used for the result, while the native slider snaps its thumb to the nearest step; field and thumb then differ slightly. Acceptable per PRD ("fields accept any value in range"), noted for Phase 1 regression. | Minor |

## 5. Risks
- R1 (disclaimer): mitigated - full disclaimer always rendered; short note near results. Residual: V2 (Minor).
- R3 (formula): closed - closed-form implementation verified against an independent simulation by builder and reviewer, tolerance 1 ₪.
- R4 (bidi): closed for Phase 0 - Intl + `<bdi>`, verified in screenshots at 320/375/1280.
- R7 (tooling): handled - headless Edge test and lint commands recorded in `.claude/rules/project.md` and reproduced by the reviewer.
- V1, V4, V5, V6: Minor UX / a11y polish; track into Phase 1 regression.

## 6. Deviations Needing a User Decision
| Deviation | Consequence | Recommendation |
|---|---|---|
| Fix for V1 needs a DESIGN_SYSTEM change (smaller mobile stat-number size, or stacking tiles below 640px instead of 360px) | Without it, long values wrap ₪ in tiles on common phone widths | Shraga to ask the user; recommended: stack tiles below 480px or reduce mobile stat number to 20px, applied in Phase 1 |
| Reported implementation-level deviations (minimumFractionDigits 0, years rounding, immediate non-numeric error, `type="text"` fields, mobile tile padding 8px, optional insight line omitted, case-sensitive lint) | None visible beyond the baseline; all within PRD / DESIGN_SYSTEM rules | Adopt as-is; Shraga records them in the Plan.md change log |

## 7. Missing Information
- No cross-browser evidence beyond Edge (V4). Matters because the target users are mostly on mobile phones (iOS Safari / Android Chrome).
- Interactive browser QA was run against a temporary local HttpListener in the scratchpad (not part of the project); results are credible and consistent with the code, but were not re-executed interactively by the reviewer (reviewer verified via code reading, headless DOM dump and screenshots).

## 8. Required Corrections
None blocking. Conditions for Phase 1:
1. Resolve V1 after the user decides on the DESIGN_SYSTEM change (Shraga).
2. Extend the short results note to include "ואינו ייעוץ השקעות" (or equivalent) so R1 wording is near the results on mobile.
3. Store regression screenshots inside the repo or attach them to the Phase 1 report path agreed with Shraga (e.g. a non-deployed folder excluded by `.vercelignore`).
4. Include Firefox and at least one real mobile browser in the Phase 1 regression; align the Firefox thumb to 28px.
5. Consider limiting live announcements (e.g. announce only the future value, or on `change` instead of `input`).

## 9. Final Decision
Approved with conditions: Phase 0 meets the approved architecture, scope and acceptance criteria AC-0.1 to AC-0.7 with verified evidence; the six Minor findings above are carried into Phase 1 as tracked conditions.

Baseline items closed by this phase: AC-0.1, AC-0.2, AC-0.3, AC-0.4, AC-0.5 (with V1 tracked), AC-0.6, AC-0.7; risk gate R1, R3, R4.
Conditions carried to the next phase: conditions 1-5 in section 8 (V1-V6).

## Round History
| Round | Date | Verdict | Main reason |
|---|---|---|---|
| 1 | 2026-10-27 | Approved with conditions | Architecture, scope and ACs met with verified evidence; only Minor UI / a11y / evidence-retention findings |
