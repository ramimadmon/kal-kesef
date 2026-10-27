# Shraga Phase Prompt - Phase 1: Growth chart, Vercel deployment and launch check

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Context: read shraga/PHASE.md (must be PHASE=1), shraga/Plan.md, shraga/project-arch-plan.md, shraga/DESIGN_SYSTEM.md (v1.1), .claude/rules/project.md, shraga/reports/phase-0-report.md and shraga/reviews/phase-0-review.md before doing anything.

Task: implement Phase 1 - Growth chart, Vercel deployment and launch check - exactly as defined in shraga/Plan.md ("Global constraints", "Conditions carried from Phase 0" and "Phase 1").

Scope (in this order):
1. Close Phase 0 conditions C1-C5 (tiles stack below 480px with value + ₪ on one line; "not investment advice" in the short note; live region announces only the future value; Firefox thumb 28px; screenshots go to docs/screenshots/).
2. Chart card per DESIGN_SYSTEM.md: stacked yearly deposits (purple) vs. profit (green) from `yearly[]`, legend, ILS tooltip, RTL axis, live updates, reduced-motion support, loading skeleton and text fallback. Put the yearly-to-chart mapping in a pure function (e.g. js/chart-data.js) and unit-test it.
3. Chart.js: the latest stable 4.x from cdnjs, exact version pinned, with the cdnjs SRI hash and crossorigin="anonymous". Update the CSP <meta> to allow only that origin for scripts.
4. vercel.json (headers listed in Plan.md) and .vercelignore (tests/, docs/, shraga/).
5. Git + deployment: `git init`, .gitignore (`*.zip`), initial commit. Then STOP and give me Hebrew step-by-step instructions to create an empty GitHub repository and send you its URL. Push only after I send the URL. Then give me Hebrew steps to import the repo into Vercel (framework preset "Other", no build command) and send you the production URL.
6. Launch check on the production URL: response headers, console/CSP check, full regression of AC-0.1 to AC-0.7 and AC-1.1 to AC-1.6, Lighthouse mobile if available (otherwise PageSpeed Insights steps for me, results in the report).

Do NOT:
- add a backend, analytics, custom domain, sharing links, PWA, npm or any library other than Chart.js
- change the stack, file layout, tokens or calculation model beyond the plan
- create, configure or sign in to GitHub/Vercel accounts on my behalf, or push before I confirm the remote
- edit CLAUDE.md or anything in shraga/ except your report
If the plan cannot be followed as written, stop and ask me before continuing.

Security requirements for this phase:
- Third-party script pinned to an exact version with SRI + crossorigin; no other external scripts.
- vercel.json headers: CSP (default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-ancestors 'none'; object-src 'none'; base-uri 'none'), X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, minimal Permissions-Policy.
- textContent-only rule still applies to chart labels, tooltips and fallback text; no secrets or tokens in the repo.
- Verify no CSP violations in the console on the production URL.

Testing requirements for this phase:
- Keep all Phase 0 tests green; add unit tests for the chart data mapping (last total equals futureValue; deposits + profit equals balance per year).
- Do not modify, skip or delete tests to make them pass. If a test seems wrong, stop and explain.
- Verify AC-1.3 by simulating a blocked CDN (e.g. wrong SRI in a temporary copy, not committed) and record the result.
- Regression in Edge, Firefox (if installed; otherwise say so) and one mobile viewport; I will check a real phone if you give me the steps. Save screenshots to docs/screenshots/.

When done:
1. Run the test page and the lint check; paste the output summaries and the production header dump into the report.
2. Write shraga/reports/phase-1-report.md using .claude/skills/shraga/assets/phase-report-template.md.
3. Run /shraga-review. If Rejected, fix only what it lists, update the report and run it again (max 2 rounds).
4. Tell me in Hebrew what the verdict was, the production URL, and what to do next.
