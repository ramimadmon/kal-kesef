# Architecture Review - Phase 1: Growth chart, Vercel deployment and launch check
Verdict: Approved with conditions
Round: 1   Date: 2026-10-27
Reviewed: shraga/reports/phase-1-report.md + code (index.html, css/styles.css, js/app.js, js/chart-data.js, js/calculator.js, tests/*, vercel.json, .vercelignore, .gitignore, .claude/rules/project.md) + production deployment
Baseline: shraga/prompts/phase-1-prompt.md, shraga/Plan.md (Phase 1, Global constraints, Conditions C1-C5), shraga/project-arch-plan.md (sections 3, 6, 10, 12), shraga/DESIGN_SYSTEM.md v1.1 (Chart, Motion, Responsive, States), shraga/reviews/phase-0-review.md (risk register lives in PRD section 12)

## 1. Summary
Phase 1 is architecturally compliant. The chart is a separate, failure-isolated layer: money math stays in `calculator.js`, the yearly-to-chart mapping is a pure, tested function in `js/chart-data.js`, and `app.js` only wires and renders. Chart.js 4.5.1 is pinned with a correct SRI hash and `crossorigin="anonymous"`; the production site on Vercel serves the required security headers, keeps tests/docs/shraga/harness files out of the deployment, and shows no console or CSP errors. Phase 0 conditions C1-C5 are closed. Remaining findings are Minor (repository visibility/content, uncommitted evidence, a few evidence gaps and reported deviations that Shraga must record).

## 2. Evidence Verified by the Reviewer
Tests: headless Edge `--dump-dom file:///C:/Users/User/Desktop/projects/kal-kesef/tests/index.html` (run via `Start-Process` with a separate user-data-dir and a 12s kill, because `--dump-dom` does not exit by itself on this machine - same behavior the report describes) -> `<pre id="summary" class="pass">PASSED: 23 FAILED: 0</pre>`, no FAIL lines. 18 Phase 0 tests + 5 new chart-mapping tests. `tests/calculator.test.js`, `tests/test-runner.js` and `js/calculator.js` were not changed in this phase (report section 3; the single git commit contains no earlier history, so this was confirmed by content, not diff - assumption noted).
Lint: `Select-String -CaseSensitive -Path js\*.js, index.html -Pattern 'innerHTML|eval|new Function|onclick='` -> no matches.
Extra checks (reviewer): `Select-String -Path js\*.js, index.html, tests\*.js -Pattern '\son[a-z]+=|style="|localStorage|sessionStorage|document\.cookie|insertAdjacentHTML|outerHTML|document\.write|\.skip|xit\(|\.only\('` -> no matches. Secret pattern search (`api key|token|secret|password`) over js/, css/, index.html, vercel.json, .claude/settings.json and the tracked prompt .txt -> only CSS-token helper names, no secrets.
SRI: reviewer downloaded `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js` and computed `openssl dgst -sha512 -binary | openssl base64 -A` -> `WoViKhKD4qI2...MDhwMA==`, identical to `CHART_SRI` in js/app.js. `https://api.cdnjs.com/libraries/Chart.js?fields=version` -> `{"version":"4.5.1"}` (latest).
Production headers: `curl -sSI https://kal-kesef-beige.vercel.app/` -> `HTTP/1.1 200 OK`; CSP `default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`; HSTS present.
Production exclusions: `/tests/index.html`, `/shraga/PHASE.md`, `/docs/screenshots/phase1-375.png`, `/CLAUDE.md`, `/.claude/settings.json` -> 404; `/js/app.js`, `/js/chart-data.js` -> 200. Production `index.html` and `js/app.js` are byte-identical to the local files.
Production browser check (reviewer, in-app browser): console "No console logs" (no CSP violations, no errors); `Chart.version` 4.5.1; Chart.js `<script>` carries the pinned integrity and `crossorigin=anonymous`; fallback hidden, skeleton removed; defaults: chart last stacked total 150379.3456 = `calculate().futureValue`, card shows 150,379 ₪; years slider -> 35: 36 bars, last total 707,860.64 = `calculate()` and card 707,861 ₪; "abc" in initial field -> "צריך להזין מספר", result and chart kept; only `.hero-value` has `aria-live` (C5). At 320px: scrollWidth = clientWidth = 320, tiles stacked, each tile value one line (28.8px), chart height 280px.
PageSpeed: reviewer opened docs/screenshots/phase1-pagespeed-mobile.png -> 93 / 100 / 100 / 100 (the image does not show the URL or form factor; provenance is the user's run as stated in the report).
AC-1.3 (blocked CDN): not re-executed by the reviewer. Verified by code reading: the script `error` event (which is what an SRI mismatch or network block fires) and any exception in chart creation/update call `showChartFallback()`; `render()` updates the results before and independently of `updateChart()`, which returns early when `chartFailed` or `window.Chart` is absent. Consistent with the builder's temp-copy evidence and docs/screenshots/phase1-1280-cdn-blocked.png.
Changes inspected: `git status` (clean except 4 untracked screenshots + the report), `git ls-files`, `git show --stat HEAD`; all files listed in report section 3 exist and were read.

## 3. What Matches the Architecture
- Stack unchanged: static HTML/CSS, classic `defer` scripts on `window.CalKesef`, no npm/build/framework; Chart.js is the only third-party script, as planned in PRD section 6.
- Boundaries: `calculator.js` untouched and DOM-free; `chart-data.js` only reshapes `yearly[]` (no math besides copying fields); `app.js` computes no money values. Tooltip "total" uses `yearly[i].balance`, not a UI-side sum.
- Chart per DESIGN_SYSTEM: title, stacked bars deposits (purple, bottom) / profit (green, top), legend with text labels, tooltip with year, deposits, profit and total in ILS, x axis reversed (years start from the right), y axis on the right with compact ILS, 280/360px heights, 300ms ease-out, animation disabled under `prefers-reduced-motion`, bordered skeleton while loading, verbatim fallback text. Series colors match DESIGN_SYSTEM section 3 and are declared once in `:root`.
- Results never depend on the chart: library is loaded after the first render, failures are caught and isolated.
- Security: exact version + SRI + crossorigin; CSP in meta and headers allows scripts only from self + cdnjs; `frame-ancestors 'none'` in the header (where it is effective); textContent-only rule holds; no storage, cookies, analytics or inline handlers; no secrets in the repo.
- Deployment followed the agreed method (R7): user-created GitHub repo, push only after the user sent the URL, Vercel Git import by the user, `.vercelignore` excludes tests/, docs/, shraga/ (and more).
- Phase 0 conditions: C1 tiles stack < 480px, value + ₪ `nowrap`; C2 short note includes "ואינם ייעוץ השקעות"; C3 screenshots under docs/screenshots/, not deployed; C4 Firefox thumb 28px + Firefox 159 and real-phone regression; C5 aria-live only on the future value.
- Tests: 5 new mapping tests cover the two required properties (last total = futureValue; deposits + profit = balance per year) across defaults, 0%, minimum and maximum inputs, plus negative input cases. No test was weakened or skipped.
- No future-scope work (no analytics, domain, sharing, PWA, backend).

## 4. Violations
| # | Area | Type | Finding | Severity |
|---|---|---|---|---|
| V1 | Security / data handling | Missing detail | The GitHub repo `ramimadmon/kal-kesef` is publicly readable (GitHub API returns 200 without auth). It tracks all of `shraga/` (PRD .docx, plans, prompts, reports, reviews), `.claude/`, `CLAUDE.md`, `SHRAGA-README.txt` and the original Hebrew prompt `.txt`; commit author metadata contains the user's account email (set by the build session as the local git identity). No secrets were found and none of this is deployed, but the report does not state the repo visibility or that the user's email is now public. | Minor |
| V2 | Documentation | Incomplete implementation | Phase 1 evidence is not committed: 4 screenshots (`phase1-pagespeed-mobile.png`, `phase1-prod-*.png`) and `shraga/reports/phase-1-report.md` are untracked. C3 asks for screenshots stored in the repo. Report section 8 says they will be committed after review. | Minor |
| V3 | Non-functional / evidence | Missing detail | Real-phone regression (C4) is a user statement without browser names or per-item results; Firefox console was not inspected; PageSpeed screenshot does not show URL or form factor. Evidence is acceptable for this scope but weaker than the Plan's standard. | Minor |
| V4 | Architectural alignment | Unauthorized deviation (reported) | Chart.js is injected dynamically by `app.js` instead of a static `<script>` tag (PRD section 6 says "one script tag"). Same URL, SRI and crossorigin; it improves the "results never depend on the chart" requirement. Reported in report section 7, not yet approved. | Minor |
| V5 | Non-functional (UI) | Unauthorized deviation (reported) | Stat tiles use a wrapping flex layout: from 480px they sit side by side unless a value is wider than half the card (only 11-digit max-input values), then wrap. Needed to satisfy both DESIGN_SYSTEM v1.1 rules; reported, not yet approved. | Minor |
| V6 | Non-functional (UI) | Incomplete implementation | Hero future value still wraps at 320-375px for extreme 11-digit results (max inputs) via `overflow-wrap: anywhere`. Unchanged from Phase 0, outside C1; realistic values fit. | Minor |

## 5. Risks
- R5 (compromised third-party script): closed for launch - exact version, SRI verified independently against the file, crossorigin, CSP limited to self + cdnjs, header verified on production. OWASP Top 10:2025 A03 (supply chain) addressed. Residual: CSP allows the whole cdnjs origin; SRI on the only cdnjs script mitigates this.
- R6 (CDN unavailable): closed - fallback path verified by builder (temp SRI mismatch) and by reviewer code reading; results unaffected.
- R7 (deployment method): closed - agreed GitHub -> Vercel flow followed; push only after user confirmation.
- R1 (disclaimer): closed - short note near results now includes "not investment advice"; full disclaimer unchanged.
- V1: Minor privacy/information exposure (OWASP A02 misconfiguration family, informational): public repo exposes planning documents and the user's email; no credentials. User decides whether the repo should be private or the files/identity changed.
- V2-V6: Minor evidence / documentation / UI polish; tracked.

## 6. Deviations Needing a User Decision
| Deviation | Consequence | Recommendation |
|---|---|---|
| Chart.js loaded dynamically from `app.js` (V4) | Results render without waiting for the CDN; same SRI/crossorigin protection. PRD wording "one script tag" no longer literal. | Adopt; Shraga updates PRD section 6 / Plan.md change log. |
| Wrapping flex tiles from 480px (V5) | At max inputs, tiles wrap to their own line instead of side by side; no ₪ wrap, no overflow. | Adopt; record in DESIGN_SYSTEM.md section 10 / Plan.md change log. |
| `.vercelignore` also excludes `.claude/`, `CLAUDE.md`, `*.txt`, `*.zip` | Stricter than plan; verified 404. | Adopt. |
| CSP adds `img-src 'self'`, `connect-src 'none'`, `form-action 'none'` | Stricter than the prompt list; no loosening. | Adopt. |
| New file `tests/chart-data.test.js`; `--chart-*` tokens in `:root` | Within file-layout spirit; tokens match DESIGN_SYSTEM section 3. | Adopt; already in .claude/rules/project.md. |
| Local git identity set to the user's account email and name `ramim` without asking | Email is public in commit metadata (see V1). | User decides: keep, or switch to a GitHub noreply email for future commits. |
| Public GitHub repo containing `shraga/` and harness files (V1) | Planning documents and prompts are readable by anyone. | User decides: make the repo private (Vercel import still works), or accept as-is. |

## 7. Missing Information
- Repository visibility was not mentioned in the report; reviewer determined it is public (V1).
- Browsers and versions used for the real-phone check (iOS Safari? Android Chrome?) are not recorded (V3).
- No pre-Phase-1 git baseline exists (single commit), so "unchanged" claims for `calculator.js` and Phase 0 tests rely on the report plus content inspection.

## 8. Required Corrections
None blocking. Conditions (carried to Shraga / closure):
1. Commit and push the 4 untracked Phase 1 screenshots and this phase's report and review (V2).
2. Shraga asks the user about repo visibility and the commit email (V1) and records the decision.
3. Shraga records the adopted deviations (V4, V5, stricter CSP / .vercelignore, new test file) in Plan.md change log and, where relevant, PRD section 6 / DESIGN_SYSTEM.md section 10.
4. Track as known issues: hero value wrap at 11-digit extremes (V6); real-phone browser names and Firefox console not recorded (V3).

## 9. Final Decision
Approved with conditions: Phase 1 meets the approved architecture, scope and acceptance criteria AC-1.1 to AC-1.6 with evidence verified on production, closes Phase 0 conditions C1-C5, and has no open Critical or Major findings; the Minor findings above are tracked as conditions.

Baseline items closed by this phase: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5 (AC-0.1 to AC-0.7 regression), AC-1.6; Phase 0 conditions C1-C5; risk gate R5, R6, R7 (and R1 residual).
Conditions carried to the next phase: section 8 items 1-4 (this is the last planned phase; they are closure / production-hygiene items for Shraga).

## Round History
| Round | Date | Verdict | Main reason |
|---|---|---|---|
| 1 | 2026-10-27 | Approved with conditions | Chart, SRI/CSP, headers, deployment and regression verified on production; only Minor findings (public repo contents, uncommitted evidence, reported deviations to record) |
