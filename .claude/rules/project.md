# Project Rules - Cal-Kesef (קל-כסף)

Project-specific rules for build sessions. The harness constitution is `CLAUDE.md` (never edit it).
Source of truth for scope and design: `shraga/project-arch-plan.md`, `shraga/Plan.md`, `shraga/DESIGN_SYSTEM.md`.

## Stack
- Static HTML5 + CSS + vanilla JavaScript. No framework, no bundler, no package manager, no build step.
- Classic `<script defer>` files (NOT ES modules) sharing one global namespace `window.CalKesef`,
  so the app and the test page work when opened directly from disk (`file://`).
- Font: Rubik from Google Fonts (400/500/700, `display=swap`). No other third-party assets in Phase 0.
- Chart.js 4.5.1 (`chart.umd.min.js`) from cdnjs, exact version + SRI sha512 + `crossorigin="anonymous"`.
  Loaded by `js/app.js` (dynamic `<script>`), never as a blocking tag; on load error the chart card shows the text fallback.
  To upgrade: take the new SRI from `https://api.cdnjs.com/libraries/Chart.js/<ver>?fields=sri` and verify it
  against the downloaded file (`openssl dgst -sha512 -binary f | openssl base64 -A`).
- Hosting: Vercel static (framework "Other", no build command). Security headers in `vercel.json`;
  `.vercelignore` keeps tests/, docs/, shraga/ and harness files out of the deployment. `.gitignore`: `*.zip`.
- Node.js and Python are NOT installed on the build machine. Microsoft Edge is used for headless runs;
  Firefox is installed at `C:\Program Files\Mozilla Firefox\firefox.exe`.

## File layout
```
index.html               # markup, CSP <meta>, RTL layout, disclaimer
css/styles.css           # design tokens (:root custom properties) + styles
js/calculator.js         # pure financial logic: CalKesef.calculate, CalKesef.RANGES, CalKesef.parseInput, CalKesef.normalizeInput
js/chart-data.js         # pure mapping yearly[] -> chart arrays: CalKesef.toChartData (no DOM, no money math)
js/app.js                # UI wiring only: read inputs, validate, call calculator, render with textContent; loads + drives the chart
vercel.json              # Vercel security headers
.vercelignore            # files excluded from deployment
tests/index.html         # browser test page (loads ../js/calculator.js and ../js/chart-data.js)
tests/test-runner.js     # minimal test runner -> window.CalKesefTest; writes <pre id="summary">
tests/chart-data.test.js # unit tests for js/chart-data.js (loaded before calculator.test.js)
tests/calculator.test.js # unit tests for js/calculator.js; its T.run() runs all registered tests
docs/screenshots/        # regression screenshots (not deployed)
```
New folders, files outside this layout, or dependencies require asking the user first.

## Commands (Windows, PowerShell)
Run the app: open `index.html` in a browser (double-click, or):
```
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "file:///C:/Users/User/Desktop/projects/kal-kesef/index.html"
```

Test (headless; reads the machine-readable summary from the DOM):
```
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --dump-dom "file:///C:/Users/User/Desktop/projects/kal-kesef/tests/index.html" | Select-String -Pattern 'id="summary"'
```
Expected: `<pre id="summary">PASSED: <n> FAILED: 0</pre>`. Interactive: open `tests/index.html` in a browser.

Lint (no linter available; security pattern search, must print nothing):
```
Select-String -CaseSensitive -Path js\*.js, index.html -Pattern 'innerHTML|eval|new Function|onclick='
```
`-CaseSensitive` is required: without it `eval` matches inside `futureValue`.
(bash equivalent: `grep -nE 'innerHTML|eval|new Function|onclick=' js/*.js index.html`)

Screenshots (headless):
```
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --hide-scrollbars --window-size=375,1600 --screenshot="<abs path>.png" "file:///C:/Users/User/Desktop/projects/kal-kesef/index.html"
```

## Code conventions
- Every JS file is an IIFE that attaches to `window.CalKesef` (`window.CalKesef = window.CalKesef || {}`); `'use strict'`.
  Tests use `window.CalKesefTest`. No other globals.
- All money math only in `js/calculator.js` (no DOM access there). `app.js` never computes money values;
  it only parses, validates via calculator helpers, formats and renders.
- User-influenced values reach the DOM via `textContent` (or `.value` / attributes on inputs) only.
  Never `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, string `setTimeout`,
  or inline event handlers (`on*=` attributes). Inline `<script>` and `style=""` attributes are blocked by the CSP.
- Input parsing: trim, reject empty, `Number()`, reject NaN/Infinity, clamp to `CalKesef.RANGES`. Invalid values never reach `calculate()`.
- Numbers shown to the user: `Intl.NumberFormat('he-IL', ...)` inside `<bdi>` for bidi isolation.
- CSS: only tokens defined in `shraga/DESIGN_SYSTEM.md` (declared once in `:root` of `css/styles.css`);
  no raw hex colors outside `:root`. Logical properties (`inline-start/end`) for RTL.
- No cookies, localStorage, sessionStorage, analytics or third-party scripts.
- Indentation: 2 spaces. Code, comments and identifiers in English; UI copy in Hebrew.
