# Shraga Phase Prompt - Phase 0: Working calculator with designed UI

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Context: read shraga/PHASE.md (must be PHASE=0), shraga/Plan.md, shraga/project-arch-plan.md and shraga/DESIGN_SYSTEM.md before doing anything.

Task: implement Phase 0 - Working calculator with designed UI - exactly as defined in shraga/Plan.md ("Global constraints" and "Phase 0").

Scope:
- Create .claude/rules/project.md with the stack, file layout, the exact run / test / lint commands and code conventions (global namespace `window.CalKesef`, textContent-only rule, design tokens).
- js/calculator.js: pure `calculate()` and clamping per PRD section 5 (calculation model, input ranges). No DOM access.
- index.html + css/styles.css + js/app.js: header, results card, inputs card (4 synced slider + number rows), disclaimer, responsive RTL layout - all per DESIGN_SYSTEM.md.
- Defaults 1,000 / 200 / 20 years / 10%; results visible on load; validation and clamp states as in DESIGN_SYSTEM.md section 7 and 14.
- tests/index.html + tests/test-runner.js + tests/calculator.test.js: zero-install browser test page that writes a machine-readable summary into the DOM (e.g. `<pre id="summary">PASSED: n FAILED: m</pre>`).

Do NOT:
- build anything from Phase 1 (no chart, no Chart.js, no vercel.json, no deployment)
- use ES modules, a bundler, npm, or any library; change the stack, file layout or tokens beyond the plan
- edit CLAUDE.md or anything in shraga/ except your report
If the plan cannot be followed as written, stop and ask me before continuing.

Environment: Node.js and Python are NOT installed. Run the test page headless with Microsoft Edge, e.g.
`& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --dump-dom "file:///<abs path>/tests/index.html"`
(locate msedge.exe if the path differs) and record that exact command in .claude/rules/project.md.

Security requirements for this phase:
- Write user-influenced values to the DOM with textContent only; no innerHTML, eval, new Function or inline event handlers.
- Parse inputs with Number(), reject NaN/Infinity, clamp to the PRD ranges; never let invalid values reach calculate().
- Add a CSP <meta> allowing only 'self' plus fonts.googleapis.com (styles) and fonts.gstatic.com (fonts).
- No cookies, localStorage, analytics or third-party scripts.

Testing requirements for this phase:
- Unit-test every case listed under Phase 0 "Tests" in shraga/Plan.md, with independently computed reference values (tolerance <= 1 ILS).
- Do not modify, skip or delete tests to make them pass. If a test seems wrong, stop and explain.
- "Lint": no linter is available; instead run and report a search for innerHTML|eval|new Function|onclick= in js/ and index.html (must be empty), and record it as the lint command.
- Verify AC-0.1 to AC-0.7 in the browser (use the in-app browser or headless Edge screenshots at 375px and 1280px); list exact manual steps in the report's "How to Try It".

When done:
1. Run the test page and the lint check; paste the output summaries into the report.
2. Write shraga/reports/phase-0-report.md using .claude/skills/shraga/assets/phase-report-template.md.
3. Run /shraga-review. If Rejected, fix only what it lists, update the report and run it again (max 2 rounds).
4. Tell me in Hebrew what the verdict was and what to do next.
