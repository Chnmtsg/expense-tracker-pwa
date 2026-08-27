# Code Review — Core Tab Screen Redesign (Dashboard, Income, Expenses, Analytics) + `sw.js` v15

## Executive Summary

The redesign is structurally sound and does not break anything. I traced every renderer, handler and harness binding that touches the moved markup: all ids, classes and `data-` attributes survived, `formatMoneyInput()` still binds through `.money-input` on both amount fields, and the three static probes plus the five render probes still bind to what they measure. The chart-tab handler's decision not to re-render is provably safe — `renderDashboard()` writes `#donut`, `#donutLegend`, `#pvaChart`, `#trendRangeLbl` and `#monthlyChart` unconditionally (index.html:7643-7652) and none of the five reads a measured width or height, so a `display:none` pane lays out correctly the moment it is shown. The `<details>` disclosure cannot affect submission or validation because the application contains no `<form>` element at all. The single biggest risk is not in this change: it is that the two most-used forms in the app still fail the required-field rule the file itself states as an "if and only if" (CODE-06), and that this redesign rewrote those exact label lines without closing it.

## Overall Score

**88 / 100.**

No Critical and no High findings: the money path, the store, the migrations and the offline path are untouched, and nothing that reads the redesigned markup was left pointing at something that moved. One Medium (a documented convention unmet on the two primary entry forms) and an accumulation of Lows — dead CSS the change orphaned, a fourth copy of the segmented-toggle loop, and three comments that assert more than the code delivers — hold it below 90 under the 75-89 band.

---

## Findings

### Critical

None.

### High

None.

### Medium

**CODE-01 — The two most-used add forms do not satisfy the file's own required-field rule**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html` — rule at 2198-2211; fields at 2638 (`#incAmount`), 2641 (`#incType`), 2715 (`#expAmount`), 2718 (`#expCategory`); handlers at 5893, 5895, 6352, 6353
- **Evidence:** The convention block states the test without qualification: *"A field is marked here if and only if its handler returns early rather than storing what was typed"*, and it enumerates the result as *"the six add-form fields and the five in the two edit modals"*. `incAdd` returns early on `if (amount <= 0)` (5893) and `if (!typeId)` (5895); `expAdd` returns early on `if (amount <= 0)` (6352) and `if (!categoryId)` (6353). All four fields therefore satisfy the stated test, and none carries `aria-required="true"` or a `.required-mark` — while `#sHourly` (2537), `#goalName`, `#goalTarget`, `#debtName`, `#debtPrincipal` and `#debtTotal` all do. The redesign re-authored the `#incAmount` and `#expAmount` label lines to make Amount the lead field and did not close the gap.
- **Impact:** A screen-reader user filling Add Income or Add Expense — the app's two highest-traffic write paths — is not told Amount and Type/Category are required until after they press Add and a toast fires. The convention block exists because this class of defect already shipped for five rounds; the four fields it misses are the four most used in the application.
- **Recommendation:** Add `aria-required="true"` to the four inputs/selects and `<span class="required-mark">*</span>` to their four labels. No handler changes — the rules are already enforced.
- **Effort:** XS

### Low

**CODE-02 — `#trendRangeLbl` left its heading but kept the heading's parentheses**

- **Severity:** Low
- **Location:** `index.html:2503` (new `.chart-sub` home), `7815`, `7820`, `7827` (label construction)
- **Evidence:** `drawMonthlyTrend` builds `rangeLabel` as `'(all time)'`, `'(last 6 months)'` and `` `(${from || '…'} → ${to || '…'})` `` — a parenthetical suffix written for the `<h3>Monthly Trend <span id="trendRangeLbl"></span></h3>` it used to sit inside. It now writes into a standalone `<div class="chart-sub">`, so the Trend pane opens with an orphan line reading `(all time)`. The sibling that kept the old arrangement confirms the convention: `#dailyRangeLbl` is still inside its `<h3>` (2794) and `drawDailyStackedChart` still builds `` ` (${…} → ${…})` `` with a leading space and parens (8185).
- **Impact:** The pane's first line is a fragment with no antecedent, and with the `<h3>` gone nothing in the pane says the chart is monthly. Minor but on the Dashboard, which `ui-guidelines.md` asks to be the least cluttered screen.
- **Recommendation:** Drop the wrapping parentheses from the three `rangeLabel` assignments so `.chart-sub` reads `All time` / `Last 6 months` / `2026-08-01 → 2026-08-31`.
- **Effort:** XS

**CODE-03 — Dead CSS the redesign orphaned, plus three older dead rules**

- **Severity:** Low
- **Location:** `index.html:1079-1081`, `904-907`, `1440-1442`, `1985`
- **Evidence:** `.kpi.accent .value`, `.kpi.good .value`, `.kpi.bad .value` (1079-1081) match nothing — the only `.kpi` elements left are the six salary tiles (2518, 2585-2589) and none carries `good`/`bad`/`accent`; the modifiers now live on `.kpi-mini` (2425, 2434, 2443) and are handled by 1070-1072. `.grid-3` and `.grid-4` with their two media queries (904-907) have no consumer — the only grid classes in markup are `.grid-2` at 2540 and 2584. `.breakdown-item` (1440-1442) is emitted by nothing (this one predates the change). `.cal-nav button`'s `font-size: 16px; font-weight: 600` (1985) are now inert: those buttons contain only an SVG.
- **Impact:** Four blocks of stylesheet that a future reader must prove dead before touching. `coding-standards.md` asks for no duplicated styles and a clean structure.
- **Recommendation:** Delete 1079-1081, 904-907, 1440-1442, and the two inert declarations in 1985.
- **Effort:** XS

**CODE-04 — Fourth copy of the segmented-control selection loop**

- **Severity:** Low
- **Location:** `index.html:5964-5968`, `6004-6009` (new), `7922-7927`, `10193-10198`
- **Evidence:** Four byte-for-byte-equivalent blocks: `querySelectorAll(<selector>).forEach(x => { x.classList.remove/toggle('active'); x.setAttribute('aria-pressed', …) })` followed by setting the pressed one. The redesign added the third-listed copy for `[data-dash-chart]`.
- **Impact:** `coding-standards.md` says avoid duplication and prefer reusable modules. The `aria-pressed` half is the part that drifts: a fifth segmented control that forgets it looks identical on screen and is silently wrong to a screen reader.
- **Recommendation:** One helper — `function selectSegment(selector, isOn) { document.querySelectorAll(selector).forEach(x => { const on = isOn(x); x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }` — and four call sites.
- **Effort:** S

**CODE-05 — Three new comments assert more than the code delivers**

- **Severity:** Low
- **Location:** `index.html:2232-2233`, `1912-1913`, `1405`
- **Evidence:**
  (a) 2232-2233: *"Replacing them costs nothing and removes the only inconsistency in the icon language."* Emoji still label `#sSave` (2599), `#sHistory` (2600), `#btnReset` (3047), `#btnSignIn` (3966) and `#btnSyncNow` (3979), and `#expRecEnd`'s placeholder is `"📅 Tap — leave empty for unlimited"` (2738) — on the Expenses screen this change redesigned.
  (b) 1912-1913: *"it is correct inside the card at 320px **and inside the wider edit modals** without either knowing about the other."* `.form-row` appears at exactly two sites, 2640 and 2717; no edit modal uses it. The 150px `auto-fit` reasoning is sound, but the second half names a context the class never enters.
  (c) 1405: *"it shrinks to its own text"*. An `width: auto` native `<select>` sizes to its **widest option** — `Last 90 Days` / `Last 30 Days` — not the selected one, so the chip does not resize as the user changes preset.
- **Impact:** This file's comments carry its design record and are treated as authoritative; a claim of completeness that is false is the exact failure mode `HANDOFF.md:130-132` records ("a green command is a claim about an instrument, not about the application"). Each of these will be read as settled.
- **Recommendation:** State the rule, not the tally: (a) "the labelled buttons on the four tab screens"; (b) drop the edit-modal clause or keep the container-based reasoning without naming a site; (c) "shrinks to its widest option".
- **Effort:** XS

**CODE-06 — The `.stat-tile` divider rules encode a tile count only the renderer knows**

- **Severity:** Low
- **Location:** `index.html:1572-1573` (CSS), `7994-8015` (`renderDailyStats`)
- **Evidence:** `.stat-tile:nth-child(2n+1) { border-right }` and `.stat-tile:nth-child(-n+2) { border-bottom }` draw a correct cross for exactly four tiles. `renderDailyStats` hardcodes four `<div class="stat-tile">` blocks, so today it holds. At six tiles the middle row would lose its bottom divider entirely; at five, the lone last tile would carry a right border with nothing beside it. The CSS comment at 1552-1555 states the dependency; nothing at the renderer does, and the renderer is where a fifth tile would be added.
- **Impact:** A future "Median day" or "Busiest category" tile produces a silently wrong grid, discovered by eye rather than by any check.
- **Recommendation:** Smallest safe fix — one line above the template literal at 7994 naming the coupling (`exactly four tiles; the quadrant dividers at index.html:1572 assume it`). If it is worth removing the coupling instead: `.stat-strip { gap: 1px; background: var(--border) }` with `.stat-tile { background: var(--surface) }` gives count-agnostic dividers with the existing `overflow: hidden` handling the edges.
- **Effort:** XS

**CODE-07 — Inline SVG path data duplicated across sites**

- **Severity:** Low
- **Location:** `index.html` — `M12 5v14M5 12h14` at 2653, 2750, 2865, 2937, 2999, 3007; `m9 18 6-6-6-6` at nine sites including 2647, 2744, 2804, 3244; `M16 2v4M8 2v4M3 10h18` at 2445, 2767, 3106; the recurrence glyph verbatim at 2724 and 10167
- **Evidence:** Replacing the emoji with inline SVG turned a one-character label into 150-400 bytes of path data repeated per site. The recurrence icon at 10167 lives inside a template literal in the edit modal, so its twin at 2724 cannot be changed by search alone without touching a JS string.
- **Impact:** `coding-standards.md` asks to avoid duplication and prefer reusable modules. Six copies of the plus glyph means a future icon revision is six edits, one of which is inside a template literal.
- **Recommendation:** A single `<svg style="display:none"><defs><symbol id="ic-plus" viewBox="0 0 24 24">…</symbol>…</defs></svg>` near the top of `<body>` and `<svg><use href="#ic-plus"/></svg>` at the sites that now repeat. Applied only to the glyphs that repeat — not a file-wide sweep of the tab bar and More sheet, which the standing rule against large mechanical sweeps rules out.
- **Effort:** S

**CODE-08 — Stale cross-file line citation in the perf probe**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\harness\perf.js:165`
- **Evidence:** *"The columns are `.col` inside #monthlyChart (index.html:7251)."* `index.html:7251` is now the advisor's month-over-month spike rule; the `.col` markup is at 7871-7880. The redesign shifted the file and nothing updated the pointer. The assertion at 170-175 still functions — only the citation is wrong.
- **Impact:** The next reader debugging `npm run perf` is sent to unrelated code. Every line-numbered cross-file reference in `tools/` carries this hazard.
- **Recommendation:** Cite the function name (`drawMonthlyTrend`) rather than a line number.
- **Effort:** XS

**CODE-09 — "One bump per deploy" is unverifiable from the repository**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\sw.js:1-9`; `D:\3_Claude\PowerApps\.github\workflows\deploy.yml:25-37`
- **Evidence:** `sw.js:1-8` states the rule as *"Before a publish and NOT on every commit — the cache key is a hand-maintained fact"*, and `deploy.yml:40-41` is `workflow_dispatch` only, so a deploy leaves no trace in the tree. The commit history reads by round rather than by deploy — `6afac2b "Bump the service worker to v13 for the round-14 build"` — and this change takes v14 to v15. I cannot establish whether a deploy occurred between v14 and v15, and neither can anyone else from the repository, which is the finding: the rule has no observable state to be checked against.
- **Impact:** Harmless when over-bumped (an extra cache purge costs one re-download of nine assets and `sw.js` never touches localStorage), but a rule nobody can check is a rule that stops being read — the exact reasoning `deploy.yml:29-34` gives for making the workflow manual.
- **Recommendation:** Record the deployed cache string and date in `reports/HANDOFF.md` at the moment of each deploy, so "has this string been published" is answerable.
- **Effort:** XS

---

## Review Areas

**Correctness of money** — Clean. Nothing in this change touches storage, rounding, `fmt`, `unmoney` or `moneyValue`; `.amount-lead` (1903-1906) sets only `font-size`, `font-weight`, `letter-spacing` and `min-height`, and both amount inputs keep `class="money-input amount-lead"` so `initMoneyInputs()` (4705) still binds them along with the other fifteen.

**Data and persistence** — Clean. No schema, migration or write path was touched. The `<details>` cannot affect submission: the application contains no `<form>` element, no `required` attribute and no `checkValidity()` call — `incAdd` (5890) and `expAdd` (6348) are plain click handlers reading `getElementById(...).value`, which returns the same string whether or not an ancestor `<details>` is open. Reset behaviour is unchanged (5901-5902, 6368-6372); the disclosure simply stays open after an add, which is correct.

**Architecture** — Clean for this change. The chart-tab handler is presentation-only and correctly refuses to trigger a render; `renderDashboard()`'s early return (7568) and its `#dashboard`-containment invariant are unaffected because the panes are inside `#dashboard`. The UI layer does not reach into storage anywhere in the changed code.

**Maintainability** — CODE-03, CODE-04, CODE-05, CODE-07.

**Error handling** — Clean. No failure path was added or altered.

**Security** — Clean. The one new unescaped text interpolation is `${peakDay || 'no data'}` at 8013; `peakDay` is a key of `byDay`, sourced from `x.date`, which `entryProblem` gates through `ISO_DATE_RE` on every import (4198). That is the validator-based safety `check-escaping.mjs:25-34` documents, and it holds. No new attribute interpolation was introduced.

**Performance** — No regression. All three panes were rendered before the change and all three are rendered now; the redesign neither added nor removed work per render. It does mean a user who only reads the donut still pays for the up-to-36-month trend loop on every Dashboard refresh — carried below as debt, not as a finding, since `perf.js` covers the figure and I have no measurement showing it is slow.

**Reliability and scalability** — Clean for this change. `renderDailyStats` is one pass over the filtered list plus one over `byDay`; the redesign changed only its markup, not its complexity.

**Removed media queries** — Clean. No orphaned `560px` or `480px` block remains; the surviving media queries (791, 889, 905, 907, 1343, 1812, 1836) all have live selectors. The removals did leave `.grid-3`/`.grid-4` and their two breakpoints with no consumer — reported as CODE-03.

**`display:none` panes misleading a reader** — Clean, and I checked every reader. `debts.js:700` snapshots `#dashboard` innerHTML (unaffected by display); `perf.js:147,170` counts `#monthlyChart .col` via `querySelectorAll` (matches hidden elements); `pva-convert.js:57` reads `s.style.width`, the inline value, not layout, and `:171` reads `textContent`; `v1-write-flows.js:450` walks `.conv-reading`, none of which is inside a pane. The three layout-measuring sites in the application (`4598`, `5367`, `6589`/`6715`) all operate outside `#dashboard`.

---

## Technical Debt

- **Four hand-rolled segmented controls (CODE-04).** Each new tabbed surface adds a copy. The `aria-pressed` half is the part that will be forgotten first.
- **Comments as the design record (CODE-05, CODE-08).** This file's most valuable asset is its written reasoning, and it has no mechanism to keep a claim true. Three claims went stale in one change, and a fourth (`perf.js:165`) went stale in another file because line numbers moved. Claims of the form "the only X" and "index.html:NNNN" are the two shapes that decay; rules stated without a tally and references stated by function name do not.
- **Icon duplication (CODE-07).** The change moved from a shared font (emoji) to per-site copies. That is the right call for consistency and the wrong one for maintenance; a `<symbol>` block recovers both.
- **CSS coupled to renderer output counts (CODE-06).** `.stat-tile`'s dividers today, and any future `:nth-child` layout for generated markup tomorrow.
- **Everything on the Dashboard renders whether or not it is visible.** Deliberate and defensible today (the alternative is a second reason for the Dashboard to recompute, which the comment at 2478-2484 correctly rejects). It becomes debt only if the pane set grows or a pane becomes expensive.

## Future Risks

- **A fifth stat tile or a sixth chart pane.** The stat dividers break silently (CODE-06). Chart panes are safe — `.dash-pane`/`.dash-pane.active` is count-agnostic — but each new pane adds unconditional render work to a function already called from thirteen non-Dashboard sites.
- **10,000 transactions.** Unchanged by this work. `drawMonthlyTrend` filters `db.income` and `db.actual` once per month in range (7845-7846), so All Time over three years is 36 full scans of both collections — quadratic in (records × months), and it now runs even when the Trend pane is hidden. `perf.js` measures exactly this at 5,000 records; that figure is the tripwire, and if it is ever breached, lazy pane rendering becomes the obvious answer and the comment at 2483-2484 will need revisiting.
- **A slow mobile device.** The redesign helps: three cards became one, and roughly 900px of Dashboard below the advisor card became roughly 300px. Layout and paint cost fall; script cost is unchanged.
- **`Reports`, `Cloud Sync` and `AI Budget Assistant` from `project.md`'s long-term vision** will each want the Dashboard's chart data outside the DOM. Today every figure a chart shows exists only as `innerHTML`. That is not a defect and this change did not worsen it, but it is the first wall a Reports module hits.

## Recommended Refactoring

The smallest set, in order of risk removed per unit of change:

1. **Close CODE-01** — four attributes and four spans. It is the only finding with a user-visible impact and the only one that contradicts a rule the file states as an "if and only if".
2. **Delete the dead CSS in CODE-03** — four blocks, no behaviour change, and it removes the ambiguity about whether `.kpi` modifiers are still a live pattern.
3. **Correct the three comments in CODE-05 and the citation in CODE-08, and drop the parentheses in CODE-02** — five one-line edits that make the written record match the code again.
4. **Extract `selectSegment()` (CODE-04)** — one function, four call sites, and the `aria-pressed` invariant stops being something four places have to remember.

Not recommended: a rewrite of the Dashboard render path, lazy pane rendering, or a file-wide icon sweep. The first two solve a problem no measurement shows exists; the third is the large mechanical change the project's own standing rule forbids, and CODE-07's targeted `<symbol>` block removes the same duplication at a fraction of the regression surface.
