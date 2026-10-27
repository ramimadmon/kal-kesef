# Phase 0 Report - Working calculator with designed UI
Prompt: shraga/prompts/phase-0-prompt.md   Date: 2026-10-27   Round: 1

## 1. Summary
Cal-Kesef now exists as a static, RTL, Hebrew single page (`index.html`) that opens directly from disk and shows live compound-interest results (future value, total deposits, profit) for four synced slider + number inputs, with defaults 1,000 / 200 / 20 years / 10%. All money math lives in the pure module `js/calculator.js` (closed-form model from PRD section 5, plus parsing and clamping helpers), verified by an 18-test zero-install browser test page against independently computed reference values. Project rules (stack, layout, run / test / lint commands, conventions) are in `.claude/rules/project.md`.

## 2. Scope Coverage
| Scope item / acceptance criterion | Status | Where (files) |
|---|---|---|
| `.claude/rules/project.md` (stack, layout, run/test/lint commands, conventions) | Done | .claude/rules/project.md |
| `calculate({initial, monthly, years, annualRatePct})` -> `{futureValue, totalDeposits, profit, yearly[]}` per PRD 5 | Done | js/calculator.js |
| Input clamping helper with PRD ranges (+ parse helper rejecting empty/NaN/Infinity) | Done | js/calculator.js (`RANGES`, `parseInput`, `normalizeInput`, `isInRange`) |
| Header, results card (hero + deposits tile + profit tile), inputs card (4 rows), disclaimer | Done | index.html, css/styles.css |
| Slider <-> field sync, live results, no calculate button | Done | js/app.js |
| Validation: empty/non-numeric -> inline error, last result kept; out of range -> clamp on blur + warning hint | Done | js/app.js, css/styles.css |
| Responsive: results above inputs on mobile; 2 columns >= 900px, inputs at start (right), results sticky | Done | css/styles.css |
| RTL, Rubik, ILS formatting via Intl inside `<bdi>` | Done | index.html, js/app.js |
| CSP `<meta>` (self + fonts.googleapis.com styles + fonts.gstatic.com fonts) | Done | index.html (tests/index.html has a self-only CSP) |
| Browser test page with machine-readable summary `<pre id="summary">` | Done | tests/index.html, tests/test-runner.js, tests/calculator.test.js |
| AC-0.1 Defaults match `calculate()` and reference | Done | Displayed 150,379 / 49,000 / 101,379 ₪; reference 150,379.3456 (see 5) |
| AC-0.2 Slider updates field + results, and vice versa | Done | Verified in browser (see 5, QA log) |
| AC-0.3 Invalid input never shows NaN/Infinity/blank; last valid result kept | Done | Verified with "abc", empty, "Infinity", "99" |
| AC-0.4 Disclaimer visible without interaction (mobile + desktop) | Done | Full block always rendered + short note under the tiles linking to it |
| AC-0.5 320 / 375 / 1280 px, no horizontal scroll, RTL, ₪ not reversed | Done | scrollWidth == innerWidth at all three; see Known Issues for tile wrapping |
| AC-0.6 Keyboard-only use | Done | Tab order logical, Arrow/Home/End move sliders, focus ring 2px #7C3AED |
| AC-0.7 No console errors; only DESIGN_SYSTEM tokens | Done | 0 page console messages (file:// and http); 0 raw hex outside `:root` |

## 3. Files Changed
- .claude/rules/project.md - created - project rules: stack, layout, exact run/test/lint/screenshot commands, conventions
- index.html - created - markup, CSP meta, RTL page, 4 input rows, results, disclaimer
- css/styles.css - created - DESIGN_SYSTEM tokens in `:root`, components, responsive layout, RTL slider fill
- js/calculator.js - created - pure calculation, ranges, parsing and clamping (no DOM)
- js/app.js - created - UI wiring, validation flow, Intl formatting, textContent rendering
- tests/index.html - created - zero-install test page
- tests/test-runner.js - created - minimal runner (`window.CalKesefTest`), writes `<pre id="summary">`
- tests/calculator.test.js - created - 18 unit tests
- shraga/reports/phase-0-report.md - created - this report

## 4. Dependencies
- None added. Only external asset: Google Fonts Rubik stylesheet (already in the plan).

## 5. Verification
Tests: `& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --dump-dom "file:///C:/Users/User/Desktop/projects/kal-kesef/tests/index.html" | Select-String -Pattern 'id="summary"'`
```
<pre id="summary" class="pass">PASSED: 18 FAILED: 0</pre>
```
Tests cover: defaults; 0% return; initial 0; monthly 0; 1 year; 50 years; max values (finite, every yearly row finite); min values (all zero); yearly[10] intermediate balance; `yearly.length === years + 1`, last yearly balance === futureValue, profit === futureValue - totalDeposits (for each case and for every year 1..50); RANGES match PRD; clamping at min and max for all 4 inputs; boundary values unchanged; years rounding; normalizeInput rejects NaN/±Infinity/unknown; parseInput rejects empty/spaces/"abc"/"Infinity"/"1e400"/null; calculate throws (never returns NaN) on invalid input. Tolerance 1 ₪.

Reference values were computed independently with a month-by-month PowerShell simulation (`b = b*(1+r_m) + D`, 12*years iterations, `r_m = (1+R)^(1/12)-1`), not with the closed form used in calculator.js:
| initial, monthly, years, rate | Reference FV |
|---|---|
| 1000, 200, 20, 10% | 150,379.3456 |
| 1000, 200, 20, 0% | 49,000.0000 |
| 0, 200, 20, 10% | 143,651.8456 |
| 1000, 0, 20, 10% | 6,727.4999 (= 1000 * 1.1^20) |
| 1000, 200, 1, 10% | 3,608.1073 |
| 1000, 200, 50, 10% | 3,036,598.3566 |
| 1,000,000, 20,000, 50, 20% | 20,987,770,439.0734 |
| 1000, 200, 10, 10% | 42,566.5138 |

Lint: `Select-String -CaseSensitive -Path js\*.js, index.html -Pattern 'innerHTML|eval|new Function|onclick='`
```
(no matches)
```
Note: without `-CaseSensitive` the search reports 3 false positives (`eval` inside `futureValue` in js/app.js:71, js/calculator.js:73 and :105), so the recorded lint command is case-sensitive.
Extra checks (all empty): `Select-String -Path js\*.js, index.html -Pattern '\son[a-z]+=|style="|localStorage|sessionStorage|document\.cookie|insertAdjacentHTML|outerHTML|document\.write'` -> no matches; raw hex colors in css/styles.css outside `:root` -> 0.

Console (file://): `msedge --headless --disable-gpu --enable-logging=stderr --v=0 --dump-dom file:///.../index.html` -> no page console messages, no CSP violations (the only CONSOLE line came from a built-in Edge extension, `chrome-extension://ndcpkimcihhghdcddljkfmmjccdmcmof`). The dumped DOM shows `fv-value` = `‏150,379 ‏₪`, `deposits-value` = `‏49,000 ‏₪`, `profit-value` = `‏101,379 ‏₪`, so the CSP allows the local scripts under file://. In-app browser console (http): "No console logs".

Browser QA log (in-app browser, page served by a temporary PowerShell HttpListener from the scratchpad, because the in-app pane renders file:// only as a static snapshot; not part of the project):
| Check | Result |
|---|---|
| Defaults (375px) | 150,379 ₪ / 49,000 ₪ / 101,379 ₪, label "כמה יהיה לך בעוד 20 שנים"; `calculate()` = 150379.3456 |
| Slider -> field | monthly slider set to 500 -> field "500", deposits 121,000 ₪, FV 365,857 ₪ |
| Field -> slider | initial field "5000" -> slider 5000, FV 392,767 ₪ = round(calculate(5000,500,20,10)) |
| Non-numeric | years "abc" -> "צריך להזין מספר", `aria-invalid="true"`, FV unchanged 150,379 ₪ |
| Out of range while typing | "99" -> error cleared, no recompute yet, FV unchanged |
| Out of range on blur (Tab) | field and slider -> 50, hint "המקסימום הוא 50 שנים" (warning color), FV 3,036,598 ₪ = reference |
| Empty + blur | field empty, error shown, results kept (3,036,598 / 121,000) |
| "Infinity" + blur | error shown, results kept |
| Max values (all 4 sliders at max) | 20,987,770,439 / 13,000,000 / 20,974,770,439 ₪; no NaN/Infinity in results text; scrollWidth 320 at 320px |
| Keyboard | Tab order: details link, then per row slider -> field, rows top to bottom. Years slider: ArrowLeft increases (thumb moves left in RTL), Home -> 1 (label "שנה", FV 3,608 ₪), End -> 50. Focus outline solid rgb(124,58,237) |
| Layout widths | 320: scrollWidth 320, tiles stacked; 375: scrollWidth 375, tiles side by side, results above inputs; 1280: scrollWidth 1280, results card left of inputs card, `position: sticky` |
| Fonts | `document.fonts.check('16px Rubik')` = true |

Screenshots (outside the repo, session scratchpad):
- 375px: `C:\Users\User\AppData\Local\Temp\claude\C--Users-User--claude-spares-spare-0CNeLJ\b11d0cc4-52cc-4222-9399-feb2a0f456a3\scratchpad\phase0-375-viewport.jpg`
- 320px: `C:\Users\User\AppData\Local\Temp\claude\C--Users-User--claude-spares-spare-0CNeLJ\b11d0cc4-52cc-4222-9399-feb2a0f456a3\scratchpad\phase0-320-viewport.jpg`
- 1280px: `C:\Users\User\AppData\Local\Temp\claude\C--Users-User--claude-spares-spare-0CNeLJ\b11d0cc4-52cc-4222-9399-feb2a0f456a3\scratchpad\phase0-1280.png` (headless Edge; command in .claude/rules/project.md)
Headless Edge `--window-size=375,...` does not produce a real 375px layout viewport (the page lays out wider and the PNG is cropped), so the 375/320 evidence comes from the in-app browser's viewport emulation instead.

## 6. How to Try It
1. Double-click `index.html` (or run the "Run the app" command in `.claude/rules/project.md`).
2. Without touching anything: the results card shows ‏150,379 ₪ (in 20 years), ‏49,000 ₪ deposited, ‏101,379 ₪ profit, and the yellow disclaimer is visible.
3. Drag "תקופת החיסכון" slider: the number field and all three results change instantly; at 1 year the label reads "בעוד 1 שנה".
4. Type `5000` into "סכום התחלתי": the slider moves and results update while typing.
5. Type `abc` into "תקופת החיסכון": red message "צריך להזין מספר" appears; results do not change.
6. Replace with `99` and press Tab: the field becomes 50, an amber hint "המקסימום הוא 50 שנים" appears, results update.
7. Clear the field and press Tab: the error appears; the last results stay.
8. Keyboard only: press Tab from the top; focus moves to the "לפרטים" link, then each slider and field with a purple ring; on a slider use arrows / Home / End.
9. Resize the window (or use DevTools device mode) to 320px, 375px and 1280px: no horizontal scroll; on desktop inputs are on the right and results on the left.
10. Tests: double-click `tests/index.html` -> "PASSED: 18 FAILED: 0" plus a list of PASS lines.

## 7. Deviations from the Plan
| Deviation | Reason | Approved by user? |
|---|---|---|
| Intl currency formatter also sets `minimumFractionDigits: 0` (PRD lists only `maximumFractionDigits: 0`) | ILS defaults to 2 minimum fraction digits; `max 0 < min 2` throws a RangeError in some engines. Output format is the same as specified. | No (implementation detail, no visible change) |
| `normalizeInput` rounds years to whole numbers (e.g. 20.4 -> 20) | `yearly[]` is defined per whole year (length years + 1); step is 1 in the PRD | No (within PRD step) |
| Non-numeric text shows the inline error immediately while typing (empty shows on blur); clamping happens on blur as specified | Prevents silent non-updates while the user types letters; empty is not flagged mid-edit so clearing a field to retype is not punished | No (within DESIGN_SYSTEM section 7 / 14 states) |
| Number fields are `type="text"` with `inputmode="decimal"` (years: `numeric`) and `dir="ltr"` | Needed to detect non-numeric text (a `type="number"` field reports "" for "abc"); DESIGN_SYSTEM specifies `inputmode="decimal"` and LTR digits | No (follows DESIGN_SYSTEM) |
| Stat tile inline padding 8px below 640px (16px from 640px) | DESIGN_SYSTEM does not set tile padding; 16px made "101,379 ₪" (the default profit) wrap at 375px | No (uses existing spacing tokens) |
| Optional "insight" line under the tiles not implemented | Marked optional in DESIGN_SYSTEM; would need an extra result field | No |
| Lint command uses `-CaseSensitive` | Avoids false positives (`futureValue`) | No |

## 8. Known Issues & Open Items
- At 360-639px, stat-tile values of 7+ digits (e.g. 50 years: profit ‏2,915,598 ₪) wrap the ₪ sign to a second line inside the tile (no overflow, no horizontal scroll, sign not reversed). Fixing it needs either a smaller mobile stat-number size or stacking tiles above 360px, both of which change DESIGN_SYSTEM values; left for Shraga to decide.
- Screenshots are stored in the session scratchpad (temporary), not in the repo, because the build session may only write its report inside `shraga/`. They can be regenerated with the commands in `.claude/rules/project.md` / section 5.
- The temporary QA server script (`serve.ps1`) lives only in the scratchpad and is not part of the project.
- Project is not a git repository, so there is no diff; reviewer should inspect the files listed in section 3.

## 9. Fix Rounds
| Round | Review items addressed | Result |
|---|---|---|
| 1 | - (initial submission) | Approved with conditions (shraga/reviews/phase-0-review.md); 6 Minor findings carried to Shraga, no fix round required |
