# Phase 1 Report - Growth chart, Vercel deployment and launch check
Prompt: shraga/prompts/phase-1-prompt.md   Date: 2026-10-27   Round: 1

## 1. Summary
Cal-Kesef now shows a live stacked bar chart of yearly deposits (purple) vs. profit (green). It uses Chart.js 4.5.1 from cdnjs, pinned with SRI. A loading skeleton covers the load, a Hebrew text fallback covers failure, and the results card never depends on the chart. The yearly-to-chart mapping is a pure, unit-tested function (`js/chart-data.js`). Phase 0 conditions C1-C5 are closed. The app is in a git repository on GitHub (`ramimadmon/kal-kesef`), deployed on Vercel at https://kal-kesef-beige.vercel.app/ with the security headers from `vercel.json`, and checked on production (headers, console/CSP, regression, PageSpeed mobile).

## 2. Scope Coverage
| Scope item / acceptance criterion | Status | Where (files) |
|---|---|---|
| C1 Tiles stack below 480px; value + ₪ never wrap | Done | css/styles.css (`.tiles` flex-wrap, `.tile` `min-width: max-content`, `.tile-value` `white-space: nowrap`, `@media (max-width: 479px)`) |
| C2 Short note says "not investment advice" | Done | index.html: "המספרים להמחשה בלבד, אינם מובטחים ואינם ייעוץ השקעות." |
| C3 Screenshots in repo under docs/screenshots/ (not deployed) | Done | docs/screenshots/ (9 files); `.vercelignore`; production returns 404 for docs/ |
| C4 Firefox thumb 28px; Firefox + real mobile regression | Done | css/styles.css (`::-moz-range-thumb` 28px, `box-sizing: border-box` on both thumbs); Firefox 159 screenshots; user checked Android + iPhone |
| C5 aria-live announces only the future value | Done | index.html: `aria-live="polite" aria-atomic="true"` moved from `.results` to `.hero-value` |
| Chart card per DESIGN_SYSTEM (title, stacked deposits/profit, legend, ILS tooltip, RTL axis, 280/360px, live update, reduced motion, skeleton, fallback) | Done | index.html, css/styles.css, js/app.js |
| Pure mapping function + unit tests | Done | js/chart-data.js (`CalKesef.toChartData`), tests/chart-data.test.js |
| Chart.js exact version, cdnjs SRI, crossorigin, CSP limited to cdnjs | Done | js/app.js (`CHART_SRC`, `CHART_SRI`), index.html CSP meta, vercel.json |
| vercel.json headers; .vercelignore | Done | vercel.json, .vercelignore |
| git init, .gitignore (*.zip), commit, push after user confirmed remote | Done | .gitignore; commit 3211b01 pushed to origin/main after the user sent the URL |
| AC-1.1 Chart reflects inputs; last total = displayed FV | Done | Production: defaults last total 150379.3456 = `calculate().futureValue`; after edits 365,857 / 392,767 match on chart and card |
| AC-1.2 Deposits vs. profit distinguishable without color | Done | Legend "הפקדות" / "רווח"; tooltip "אחרי 20 שנים / הפקדות: 49,000 ₪ / רווח: 101,379 ₪ / סה״כ: 150,379 ₪" |
| AC-1.3 Blocked CDN -> fallback, numbers update, no uncaught errors | Done | Wrong-SRI temp copy (see 5) |
| AC-1.4 HTTPS, headers, no CSP violations | Done | Header dump + console (see 5) |
| AC-1.5 Phase 0 ACs still pass | Done | Production regression (see 5) |
| AC-1.6 Lighthouse mobile Perf >= 90, A11y >= 95 | Done | PageSpeed Insights mobile, run by the user: 93 / 100 / 100 / 100 |

## 3. Files Changed
- index.html - modified - CSP meta allows https://cdnjs.cloudflare.com for scripts; loads js/chart-data.js; chart card; aria-live only on the future value (C5); short note wording (C2)
- css/styles.css - modified - chart series tokens in `:root`; tile layout (C1); 28px thumbs incl. Firefox (C4); chart skeleton / failed / fallback styles; chart height 280 / 360px; desktop grid area "chart"
- js/chart-data.js - created - pure `toChartData(yearly)` -> `{ years, deposits, profit, totals }`
- js/app.js - modified - loads Chart.js dynamically with SRI + crossorigin; builds and updates the chart; tooltip and axis formatting; reduced motion; fallback on load error or chart exception
- tests/chart-data.test.js - created - 5 unit tests for the mapping
- tests/index.html - modified - loads ../js/chart-data.js and chart-data.test.js
- vercel.json - created - security headers
- .vercelignore - created - excludes tests/, docs/, shraga/ and harness files
- .gitignore - created - `*.zip`
- .claude/rules/project.md - modified - Chart.js and hosting rules, new files in the layout, Firefox path
- docs/screenshots/*.png - created - regression evidence (9 files)
- shraga/reports/phase-1-report.md - created - this report

Not modified: js/calculator.js, tests/calculator.test.js, tests/test-runner.js, CLAUDE.md, other files in shraga/.

## 4. Dependencies
- Chart.js 4.5.1 (`https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js`). This was the latest version on cdnjs on 2026-10-27 (`https://api.cdnjs.com/libraries/Chart.js?fields=version` -> `{"version":"4.5.1"}`). It is planned in PRD section 6.
  SRI `sha512-WoViKhKD4qI2WruSZqv9+kvM4WfFhUMQCLN4QlDTt5aU56fLQy2gYoxWIqlEnXqJy/+Ac5q/hk1oWfqnMDhwMA==` comes from the cdnjs API. It was verified independently against the downloaded file (`openssl dgst -sha512 -binary chart.umd.min.js | openssl base64 -A`), which produced the same value.
- No other dependency. No npm or build step.

## 5. Verification
Tests: `& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --dump-dom "file:///C:/Users/User/Desktop/projects/kal-kesef/tests/index.html" | Select-String -Pattern 'id="summary"|FAIL'`
```
<pre id="summary" class="pass">PASSED: 23 FAILED: 0</pre>
```
18 Phase 0 tests (unchanged) + 5 new tests: one point per year 0..N; last total === futureValue (and last deposits/profit === totalDeposits/profit), for 5 cases including min and max inputs; deposits + profit === balance for every year (tolerance 1e-6 or 1e-12 relative); defaults vs. reference 150,379.3456 at year 20; rejects undefined / empty / non-array. No FAIL lines. The runner has no skip mechanism.
Note: on this machine headless Edge printed the DOM but did not exit by itself in this session. The command was run via `Start-Process ... -RedirectStandardOutput` and the process was killed after 20s. The output is the same.

Lint: `Select-String -CaseSensitive -Path js\*.js, index.html -Pattern 'innerHTML|eval|new Function|onclick='`
```
(no matches)
```
Extra checks, all empty / 0: `Select-String -Path js\*.js, index.html, tests\*.js -Pattern '\son[a-z]+=|style="|localStorage|sessionStorage|document\.cookie|insertAdjacentHTML|outerHTML|document\.write'` -> no matches. Raw hex colors in css/styles.css after `:root` -> 0. `vercel.json` parses as JSON. Chart labels, tooltips and legend are drawn on the canvas by Chart.js. The fallback text is static markup shown by toggling `hidden`. No user value is written via HTML.

Production header dump: `curl -sSI https://kal-kesef-beige.vercel.app/`
```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Content-Type: text/html; charset=utf-8
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
```
(Abridged. The full dump also has Accept-Ranges, Access-Control-Allow-Origin, Age, Cache-Control, Content-Disposition, Content-Length, Date, Etag, Last-Modified, X-Vercel-Cache and X-Vercel-Id.) The same CSP and nosniff headers are on `/js/app.js` (`application/javascript`).
`curl -sSI http://kal-kesef-beige.vercel.app/` -> `308 Permanent Redirect`, `Location: https://kal-kesef-beige.vercel.app/`.
Excluded paths on production -> 404: `/tests/index.html`, `/shraga/PHASE.md`, `/docs/screenshots/phase1-375.png`, `/CLAUDE.md`, `/.claude/settings.json`, `/vercel.json`. `/js/chart-data.js` -> 200.

Console / CSP on production (in-app browser, https://kal-kesef-beige.vercel.app/): "No console logs" after load and after all regression interactions. No CSP violations. Scripts on the page: `/js/calculator.js`, `/js/chart-data.js`, `/js/app.js`, `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js`. The integrity attribute equals the pinned SRI, `crossOrigin` = `anonymous` and `Chart.version` = `4.5.1`.

AC-1.3, blocked CDN. A temporary copy of index.html, css/ and js/ in the session scratchpad had the SRI hash changed in app.js. It was served on localhost and never put in the project or committed:
- Console (only line): `Failed to find a valid digest in the 'integrity' attribute for resource '.../Chart.js/4.5.1/chart.umd.min.js' ... The resource has been blocked.` (browser SRI message, no uncaught page error).
- `window.Chart` undefined; chart wrap class `chart-wrap is-failed`; fallback visible: "לא הצלחנו לטעון את הגרף, אבל כל המספרים למעלה מעודכנים."
- Moving the monthly slider to 500 still updated results: FV 365,857 ₪, deposits 121,000 ₪.
- Screenshot: docs/screenshots/phase1-1280-cdn-blocked.png.

Regression on production, Edge in-app browser:
| Check | Result |
|---|---|
| AC-0.1 defaults | 150,379 / 49,000 / 101,379 ₪, label "כמה יהיה לך בעוד 20 שנים"; chart last total 150379.3456 = calculate() |
| AC-0.2 slider -> field | monthly slider 500 -> field "500", FV 365,857 ₪, deposits 121,000 ₪, chart last total 365,857 |
| AC-0.2 field -> slider | initial field "5000" -> slider 5000, FV 392,767 ₪ = round(calculate(5000,500,20,10)); chart 392,767 |
| AC-0.3 invalid | "abc" -> "צריך להזין מספר", aria-invalid=true, FV kept; "99" + blur -> 50, "המקסימום הוא 50 שנים", 51 bars; empty + blur and "Infinity" + blur -> error, FV kept 7,884,973 ₪; no NaN/Infinity in results |
| AC-0.4 disclaimer | Full disclaimer text present; short note under tiles includes "ואינם ייעוץ השקעות" |
| AC-0.5 layout | 320: scrollWidth 320, tiles stacked one line each, results above inputs, chart 280px; 375: scrollWidth 375, chart 280px; 1280: scrollWidth = clientWidth (1265, scrollbar), inputs right / results left, results sticky, chart 360px |
| AC-0.6 keyboard | Real key presses: Tab -> "לפרטים" link -> initial slider; End -> 1,000,000, FV 6,871,152 ₪; focus outline solid rgb(124, 58, 237) |
| AC-0.7 console / tokens | No console logs; Rubik loaded; 0 raw hex outside `:root` |
| C5 live regions | Only `.hero-value` has aria-live |

C1 tile check, local server, in-app browser: tiles at 320 / 375 / 480 / 640 / 1280 with defaults, 50 years (profit 2,915,598 ₪) and max inputs (profit 20,974,770,439 ₪). Every value is on one line (height 29px, scrollWidth <= clientWidth) and there is no horizontal scroll. At 480-639 and on desktop, tiles sit side by side unless a value is too wide. Only the 11-digit max-input values are, and those tiles wrap to their own line (see section 7).

Cross-browser:
- Edge (Chromium) headless + in-app browser: all of the above.
- Firefox 159 (installed, headless screenshots, reduced-motion pref) at 375 and 1280, local and production. Layout, RTL, 28px thumbs and chart all render. Chart.js loads with SRI under the production headers (docs/screenshots/phase1-prod-firefox-375.png, phase1-prod-firefox-1280.png). The Firefox console could not be read in headless screenshot mode.
- Real phones: the user opened the production URL on Android and iPhone and reported the check as passed. The user did not name the browsers or report each item separately.

PageSpeed Insights, mobile (https://pagespeed.web.dev/, run by the user on https://kal-kesef-beige.vercel.app/, 2026-10-27): Performance 93, Accessibility 100, Best Practices 100, SEO 100. Screenshot: docs/screenshots/phase1-pagespeed-mobile.png. The session tried the PageSpeed API first, but it returned `429 RESOURCE_EXHAUSTED` (no keyless quota), and Lighthouse CLI is not available because Node.js is not installed.

Screenshots (docs/screenshots/): phase1-375.png, phase1-1280.png (Edge, local), phase1-firefox-375.png, phase1-firefox-1280.png, phase1-1280-cdn-blocked.png, phase1-prod-edge-1280.png, phase1-prod-firefox-375.png, phase1-prod-firefox-1280.png, phase1-pagespeed-mobile.png. The 375px Edge shot was taken through a 375px iframe wrapper in the scratchpad, because headless Edge enforces a wider minimum window.

## 6. How to Try It
- Production: open https://kal-kesef-beige.vercel.app/ and move any slider. The three numbers and the chart update together. Hover or tap a bar to see year, deposits, profit and total.
- Local: open `index.html` from disk. The chart loads from cdnjs; with no network the fallback text appears.
- Tests: open `tests/index.html` -> `PASSED: 23 FAILED: 0`.

## 7. Deviations from the Plan
| Deviation | Reason | Approved by user? |
|---|---|---|
| Stat tiles use a wrapping flex layout. Below 480px they always stack. From 480px they sit side by side, unless a value is wider than half the card, and then that tile wraps to its own line. Only 11-digit values at max inputs do this. | DESIGN_SYSTEM v1.1 also requires that value + ₪ never wrap. At 480px with max inputs, the 2-column grid overflowed the tile (223px value in a 185px tile), and desktop columns had the same overflow. | No - implementation detail to keep both v1.1 rules; Shraga to confirm |
| Chart.js is injected by `js/app.js`, not loaded by a static `<script>` tag. It still has the exact URL, `integrity` and `crossorigin="anonymous"`. | A blocking deferred tag would delay app.js, and so the results, until the CDN answers. Dynamic loading gives reliable `load`/`error` events for the skeleton and fallback, and keeps "results never depend on the chart". | No |
| `.vercelignore` also excludes `.claude/`, `CLAUDE.md`, `SHRAGA-README.txt`, `*.txt` and `*.zip`, beyond the plan's tests/, docs/, shraga/ | Keeps harness and planning files off the public site; verified 404 in production | No (stricter than plan) |
| New test file `tests/chart-data.test.js` | The prompt asked for chart mapping tests. A separate file keeps calculator.test.js unchanged. It loads before calculator.test.js, whose existing `T.run()` runs all registered tests. | No (file layout updated in .claude/rules/project.md) |
| CSP in vercel.json and the meta tag adds `img-src 'self'`, `connect-src 'none'` and `form-action 'none'` to the directive list in the prompt | These keep the Phase 0 meta directives; all are stricter, and none loosens anything | No (stricter) |
| Chart series colors added as `--chart-*` tokens in `:root` | DESIGN_SYSTEM section 3 defines the series hexes. app.js reads them from CSS, so there are no raw colors in JS. | No |
| Git identity set locally in the repo: `user.email` = the user's account email, `user.name` = `ramim` | There was no global git identity, and a commit needs one. The user can change it with `git config user.name`. | No |

## 8. Known Issues & Open Items
- The hero future value (34px on mobile) still wraps at 320-375px only for extreme 11-digit results (max inputs), via `overflow-wrap: anywhere`. Default and realistic values fit. This is unchanged from Phase 0 and C1 does not cover it.
- V6 (Phase 0, accepted): off-step typed values are used as typed while the slider thumb snaps.
- Real-phone check: reported as passed by the user on Android and iPhone; browser versions not recorded.
- Firefox console not inspected (headless screenshot mode only). Rendering, SRI load and layout are verified.
- The Phase 1 screenshots added after commit 3211b01 and this report are not committed yet. They will be committed and pushed after the review; docs/ and shraga/ are not deployed, so production is unaffected.
- Local headless Edge: `--dump-dom` does not exit on its own on this machine. The output is correct, but the documented command needs a timeout wrapper.

## 9. Fix Rounds
| Round | Review items addressed | Result |
|---|---|---|
