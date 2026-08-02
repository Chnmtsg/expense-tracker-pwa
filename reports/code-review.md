# Code Review — Round 6

## Executive Summary

The data layer is in the best shape this project has produced: money is integer end to end with one rounding boundary, `writeDb()` is a genuine single seam that reports every failure path, the quarantine-before-write path now survives a later runtime error (`index.html:7572` — WORK-71 landed and I verified it against `:2550/:2576/:2732`), and all five bare `save()` sites are the five on the allow-list. I found no Critical and no High. What I did find is that the project's own named failure mode — a true-sounding number written beside code that does not produce it — has recurred inside the two fixes that were approved specifically to remove it: `index.html:1519` claims the calendar cells are "44.6px at 360px" when the arithmetic the same comment supplies gives 41.4px, and `.hero-kpi::before` still paints above the hero text so the surface `check-contrast.mjs` measures is not the surface that is painted. The single biggest risk is not either defect: it is that **the round's one gate item has no re-runnable check behind it, and `npm run v1` cannot fail** — `run.mjs:112` exits 0 unless the probe itself threw, and the probe asserts nothing.

## Overall Score

**90 / 100.** No Critical and no High findings, which per `knowledge/review-conventions.md` puts this in the 90-100 band. It sits at the floor of that band rather than higher because two of the four Mediums are false numeric claims recorded in the source about measurements a reader will trust, and one is a verification command that reports success unconditionally — in a project whose entire release discipline rests on claims being re-runnable.

---

## Findings

### Critical

None.

### High

None.

### Medium

**CODE-01 — The calendar padding fix records a width it does not produce, and the 44px minimum is still missed**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1518-1521` (comment and `.card.cal-card`), grid at `:1517`, cells at `:1530-1531`, markup at `:2046`
- **Evidence:** The comment states *"--s3 either side gives 44.6px at 360px where --s4 gave 40.3px."* Deriving it from the file: `* { box-sizing: border-box }` (`:744`), `main { padding: 16px }` (`:822`), `.card { border: 1px; padding: var(--s4) }` (`:841-848`), `.card.cal-card { padding-left/right: var(--s3) }` (`:1521`), `.cal-grid { repeat(7, 1fr); gap: 2px }` (`:1517`), `--s3: 12px`, `--s4: 16px` (`:87`).
  - With `--s4`: `(360 − 32 − 2 − 32 − 12) / 7 = 40.29px` — which is exactly the comment's own "40.3px", so the model is confirmed by the comment's other figure.
  - With `--s3`: `(360 − 32 − 2 − 24 − 12) / 7 = 41.43px`, not 44.6px. Trimming 4px of padding per side frees 8px across seven columns: +1.14px per cell. 44.6px would require the card's total horizontal inset to be under 4px.
  - At 375px (iPhone SE/13 mini) it is 43.6px. Only at 390px and above does it clear 44.
  - `ui-guidelines.md:65` — *"Minimum touch target 44x44 px."* The cell is 44px tall (`min-height: 44px`) and 41.4px wide at 360px.
- **Impact:** The main interaction on Analytics is still under the project's own hard minimum on the two most common small phone widths, and the file now records that it is not. This is the second consecutive round in which this exact three-line block carried a false pixel figure; the previous one is quoted at `:1509-1513` as the reason the shortfall *"stayed hidden for a round."*
- **Recommendation:** Correct the comment first (XS) — state the derivation inputs, not a single number, or state no number. Then decide the geometry with a measured value: the remaining slack is the 2px gap and the card border, and neither gets to 44px at 360px, so the honest options are to accept 41.4px with a recorded reason or to drop the card's horizontal padding to zero for this card only. Do not re-record a figure that is not derived from the file.
- **Effort:** S

**CODE-02 — `.hero-kpi::before` paints over the hero text, so the pair table measures a surface that is not painted**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:887-892` (`.hero-kpi::before`), `:864-885` (`.hero-kpi`), `:1763-1767` (markup), `tools/check-contrast.mjs:67-68` (the pairs)
- **Evidence:** `.hero-kpi` is `position: relative` with no `z-index`; `.hero-kpi::before` is `position: absolute` with no `z-index` and `background: rgba(255,255,255,.07)`; `.hero-label`, `.hero-value` and `.hero-trend` are in-flow, non-positioned. A positioned descendant with `z-index: auto` paints after in-flow inline content, so the 140×140 disc at `right:-20px; top:-20px` paints **above** the three text elements — the counter-pattern that fixes this is already in the file 650 lines away at `:1546`, `.cal-cell &gt; * { position: relative; z-index: 1; }`. There is no `z-index` anywhere on the hero (grep for `z-index` returns eight hits, none of them hero).
  - `check-contrast.mjs:67-68` measures `--on-hero` over `--primary`/`--primary-2` composited with `--hero-scrim` only. The disc is not in that stack.
  - Slate (`--primary-2: #7DD3FC`, `--hero-scrim: 0.41`): measured pair = **4.54:1**; with the 7% white disc composited on top = **3.99:1**.
  - Mint (`--primary-2: #22C55E`, `--hero-scrim: 0.31`): **4.53:1** → **4.04:1**.
  - `--hero-scrim` was derived to land white at 4.5:1 with a floor of 0.22, so every theme whose value exceeds 0.22 sits on the boundary and falls below it under the disc. Twelve of sixteen do (`:220, 257, 331, 370, 410, 450, 490, 528, 568, 606, 646, 686`). At 360px the disc's visible region is `x ≥ 208`, `y ≤ 120`, which is where a seven-figure `.hero-value` and the `.hero-trend` sentence both land.
- **Impact:** The app's headline figure and the only sentence saying whether the user is over or under budget sit at roughly 4.0:1 in twelve themes, while `check-contrast.mjs` reports the row as passing. The standing convention *"a CSS rule that paints a fill under text adds a pair-table row in the same commit"* cannot cover this one — the disc is an `rgba()` literal, not a token, so the mechanism is blind to it by construction and only paint order can remove it.
- **Recommendation:** Smallest safe fix is the pattern already in the file: `.hero-kpi &gt; * { position: relative; z-index: 1; }`, which stops the disc painting over glyphs, plus moving the disc into the `.hero-kpi` background stack (under the scrim) or deleting it. Re-run `check-contrast.mjs` afterwards; the existing two `on-hero` rows then describe what is painted. Deleting the disc is smaller than any of it and costs one decoration.
- **Effort:** S

**CODE-03 — `npm run v1` cannot fail, and the round's gate item has no re-runnable check**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\tools\harness\run.mjs:112`; `D:\3_Claude\PowerApps\tools\harness\v1-write-flows.js:10-16, 82-83`
- **Evidence:** `run.mjs:112` is `process.exit(parsed &amp;&amp; parsed.ERROR ? 1 : 0);`. `t.ERROR` is set only by the probe's outer `catch` (`v1-write-flows.js:79-81`). Inside `flow()` (`:10-16`) every exception is caught and written into `t.flows` as the string `'... THREW ...'`; console errors are counted into `t.consoleErrors` and `t.H_total_console_errors` (`:82`). None of these affects the exit code. A run in which all four write flows throw, the save-failure contract is broken (`t.G_income_edit_failed_toast` reads `"Income updated"`), and the data-error banner is showing still exits 0 and reports success.
  - Separately: gate R5's stated closing condition is *"V1's write flows executed with a clean console, including a deliberately corrupted store followed by a thrown runtime error, which is the flow that produced the defect."* The probe never corrupts the store and never raises a runtime error. The one item in gate R5 — `if (dataWasCorrupt) return;` at `index.html:7572` — has no assertion anywhere in `tools/`.
- **Impact:** "V1 passes" is a claim about a human reading JSON, not a property a command enforces — which is precisely the shape ruling V2 exists to forbid, one level up, in the harness that the four static tools cannot cover. `eslint.config.mjs:70-72` explicitly delegates boot-crash detection to V1 ("V1 … catches those directly"), so the fallback for the project's two historical boot crashes is a command that returns 0 either way.
- **Recommendation:** Two lines. In `run.mjs`, fail on any key whose value is a string containing `THREW`, and on `H_total_console_errors &gt; 0`. In `v1-write-flows.js`, add one block after the quota case: set a garbage value under `expense-tracker-v1`, call `quarantineCorruptData()` / set `dataWasCorrupt`, call `reportFatal('error','probe')`, and record `dataErrorTitle.textContent` and `dataErrorDownload.style.display`. That makes gate R5's own condition re-runnable. This is an assertion inside an existing tool, not a fifth tool.
- **Effort:** XS

**CODE-04 — The global error handler is registered after ~5,190 lines of top-level statements, so it cannot see a boot-time throw**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7592-7593`, against `:2402` (`&lt;script&gt;`), `:2639` (`let db = load()`), `:2715`, `:3235`, `:4019`, `:6995`
- **Evidence:** `window.addEventListener('error', …)` and `('unhandledrejection', …)` are at `:7592-7593`. The comment above `reportFatal()` at `:7536-7544` states its purpose: *"the init sequence below is a straight run of statements, so a throw anywhere in it leaves the app half constructed with no message and, worse, no route to Restore."* That is true of `:7595-7625` — and equally true of `:2404-7591`, which is also a straight run of top-level statements and which the handler does not cover because it does not exist yet. Concrete reachable path inside it: `load()` at `:2715` does `d.categories.forEach(...)` **outside** the `try` that ends at `:2683`, on a value taken from `parsed.categories?.length ? parsed.categories : defaultCategories` (`:2660`) — a stored blob whose `categories` is a non-empty non-array parses fine and then throws a `TypeError` out of `let db = load()`. Everything below, including the two listeners and the wiring of `#dataErrorImport`, never runs.
- **Impact:** In the exact state the mechanism was written for — a store the app cannot construct a database from — the user gets a blank screen with no banner, no Restore button and no Download damaged file button. The reachability is low today (it needs a hand-edited or foreign-written blob, since `importProblem()` rejects a non-array `categories`), but it is the failure class the whole banner exists for, and every future top-level statement widens it.
- **Recommendation:** Move `let fatalReported = false;`, `function reportFatal(...)` and the two `addEventListener` calls to immediately after `let corruptQuarantineFailed = false;` (`:2552`). That is the earliest point at which every binding `reportFatal` reads is initialised — `dataWasCorrupt` (`:2550`), `setBannerText` and `updateBannerOffset` are function declarations and hoist, and `#dataErrorBanner` is in the markup at `:1712`, well before the script. It covers 5,000 lines instead of 30 and changes no behaviour.
- **Effort:** XS

### Low

**CODE-05 — The `.btn` block replaces one census and reintroduces another twenty lines below**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1004-1006`, against `:983-987` and `:810-821`
- **Evidence:** `:983-987` now reads *"every button that sits beside another element sets its own width. No exceptions, **and no count** … State the rule, not the tally."* `:1004-1005` then reads *"The three siblings-in-a-row. Each shrinks to its label…"* above `:1006`, which lists three ids. There is a fourth CSS site doing the same job at `:821` (`.notif-item .notif-actions button { width: auto; flex: 1 1 auto; }`) — the very site whose appearance made the previous "three places" tally false — plus numerous inline `style="flex:1"` overrides (`:1916`, `:2193-2194`, `:2368-2369`, `:2385-2386`, `:2396-2397`).
- **Impact:** The definite article makes it a claim about the file, and it is already wrong. It is the same class the block above it was rewritten to remove, three lines apart.
- **Recommendation:** Delete the word "three": *"These siblings-in-a-row shrink to their label so the element beside them keeps its own size."*
- **Effort:** XS

**CODE-06 — Three rows in the contrast pair table are exact duplicates, and the printed count overstates distinct coverage**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\check-contrast.mjs:55-57` against `:98-100`
- **Evidence:** `{ on-danger, danger, 4.5 }`, `{ on-success, success, 4.5 }` and `{ on-warning, warning, 4.5 }` each appear twice, differing only in `note`. `PAIRS.length` is 32; the distinct set is 29. The tool prints `32 pairs, 512 measured` (`:284-288`); 48 of those 512 are the same arithmetic run twice.
- **Impact:** No wrong result — the arithmetic is identical — but the pair table is the one hand-maintained artifact the whole V4/V6 mechanism rests on, and its own summary line is the number a reader uses to judge coverage. `coding-standards.md` says "Avoid duplication" without qualification.
- **Recommendation:** Delete `:98-100` and merge their notes into `:55-57` (e.g. `'danger buttons, data-loss banner, advisor badge critical'`). Re-run; the line should read `29 pairs, 464 measured, 0 below threshold`.
- **Effort:** XS

**CODE-07 — `check-escaping.mjs`'s skip rule states a reason that is false at a live site**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\check-escaping.mjs:72-74`, against `expense-pwa\index.html:7061`
- **Evidence:** `:74` is `if (!/\w\.\w/.test(expr)) continue;`, under `:72-73`: *"Record data reaches markup through a property access. Bare loop counters and literals from fixed in-code arrays cannot carry a quote."* At `index.html:7061` the attribute is `data-qa-set="${a}"`, where `a` is an element of `db.settings.quickAmounts` (`:7058`) — store data, destructured by `.map((a, i) =&gt;`, with no property access at the interpolation site. It is skipped, and the stated reason for skipping it does not hold. It is safe today only because `importProblem()` (`index.html:3179-3190`) requires every quick amount to be a finite positive number — the same "the validators, not the wrapper" argument the tool's own header makes at `:25-29` about a different set of sites.
  - Related narrowing, no live site: `ATTR_WITH_INTERP` (`:50`) only matches double-quoted attribute values. A single-quoted one would be invisible.
- **Impact:** The predicate's stated coverage is broader than its behaviour. This is the CODE-08 class from round 5 in the sibling tool: the next reader trusts the header.
- **Recommendation:** Correct the comment to say what the rule actually does (*"an expression with no property access is skipped; this misses a record value that has been destructured or aliased into a bare identifier — `data-qa-set` at index.html:7061 is one, and it is safe only because importProblem() constrains it"*). If you want the assertion rather than the caveat, replace the dot test with a small deny-list of known-safe identifiers; that stays inside the existing tool.
- **Effort:** XS

**CODE-08 — `getComputedStyle` is called once per calendar cell inside the render loop**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:6120`, inside the `cells.map()` at `:6106`
- **Evidence:** `const heatMax = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--heat-max')) || 0.3;` is evaluated per cell — up to 42 per `renderCalendar()`, which runs from `renderDaily()` on every chip toggle, mode switch, day selection and month step. The value is a per-theme constant that cannot change within one render.
- **Impact:** Up to 42 forced style resolutions per calendar paint where one would do. Small in absolute terms; it is listed because it is exactly "work repeated on every render that could be done once", and the fix is moving one line.
- **Recommendation:** Hoist `heatMax` and `heatMin` above the `cells.map()` call. This is not the deferred indexing class (WORK-16/49) and does not touch it.
- **Effort:** XS

**CODE-09 — The fatal-error latch is never reset, and one path hides the banner it raised**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7545-7548` and `:2609-2612`, reached via `:2636` and `:5252`
- **Evidence:** `reportFatal()` sets `fatalReported = true` and never clears it. `#dataErrorImport` (`:2636`) is inside the same banner and is **not** hidden by `reportFatal()` — only `#dataErrorDownload` is (`:7588`). So from a "Something went wrong." banner the user can tap Restore from file; on success `db = load()` (`:5252`) runs `updateCorruptBanner()` (`:2732`), whose first act is `el.classList.toggle('show', dataWasCorrupt)` → `false` → the banner is removed. From that point the session has no fatal indicator and `fatalReported` is still `true`, so no later runtime error can raise one.
- **Impact:** After a restore taken in response to a runtime error — a plausible sequence, since the banner's own text says *"If it stays broken, restore a backup"* — the app is silent about every subsequent failure for the rest of the session.
- **Recommendation:** Reset `fatalReported = false` in `load()` beside the other per-load resets at `:2649-2651`. One line, and it keeps ruling C5 intact because `updateCorruptBanner()` already rewrites every claim the element renders.
- **Effort:** XS

**CODE-10 — `VERIFICATION.md` §1's line-number inventory is stale at every row**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\VERIFICATION.md:23-51` (and `:55`, `:205-219` which refer back to it)
- **Evidence:** Every line number in the 22-row table is roughly 1,000-1,200 lines short of its current position: A2 cites `renderDashboard()` at 4442 (now `:5675`), A5 `renderCalendar()` at 4774 (now `:6071`), A3 `[data-chip-none]` at 4716 (now `:6003`), B2 `computeReminders()` at 2761 (now `:3608`). The count itself has moved too: `db.planned` now has 24 references, not 22. Following any row lands the reader in unrelated code.
- **Impact:** §5's gate-close checklist is written entirely in terms of these row ids, so the artifact that records how the round-3 gate was closed can no longer be walked. This is the same class WORK-79 corrected in §6, in a section WORK-79 did not open.
- **Recommendation:** §1 is explicitly a historical snapshot ("Written before any gate code changes"), so the honest fix is not to renumber it forever: replace the `Line` column with the enclosing function name, which is stable and is what the reader needs, and drop the "22 references" total. Consistent with the standing rule that this document records no counts.
- **Effort:** XS

**CODE-11 — Two dead declarations**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1564` and `:3576`
- **Evidence:** (a) `.salary-summary` is declared twice back to back — `:1564` sets `background` and `color`, `:1566-1570` re-declares `background`. The `background` on `:1564` is never used. (b) `computeNextRecurring()`'s `const base = r.lastLogged ? parseISO(r.lastLogged) : new Date(start.getTime() - 86400000);` — the else branch is unreachable in effect, because `next` is unconditionally reassigned to `new Date(start)` at `:3596` whenever `!r.lastLogged`. (The dead expression is also the one place in the file that does date arithmetic in milliseconds rather than through `stepDate`/`parseISO`, so it is worth removing rather than leaving as a pattern to copy.)
- **Impact:** None at runtime. Both are small reading costs in the two places a future editor is most likely to touch — the gradient card and the single recurrence engine.
- **Recommendation:** Merge the two `.salary-summary` blocks; change `base` to `parseISO(r.lastLogged)` and move it inside the branch that uses it.
- **Effort:** XS

---

## Review Areas — coverage

- **Correctness of money.** Clean, and it is the strongest part of the codebase. Amounts enter through `unmoney()` (digits only, `:3374`) or `nonNegative(unnum(...))` (`:4184`); `calcSalary()` returns a fully rounded object (`:4219-4224`) and `db.salaries` and `db.income` are written from the same rounded values on the same handler (`:4249-4271`); `fmt()` is the one display rounding (`:3289`); no `toISOString()` anywhere; `toLocalISO`/`parseISO` throughout. `stepDate()` monthly clamping (`:4451-4462`) is correct and reversible under `anchorDay`; `plannedOccurrences`, `hasPlannedOccurrence`, `nextPlannedDue` and `computeRange` all re-derived and correct. **No calculation defect found in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences` — Stage 2's trigger does not fire.**
- **Data and persistence.** Clean. One seam (`writeDb`/`save`/`load`), numbered append-only migrations with the version stamped at the level actually reached (`:2488-2502`), quarantine before any write with a single retained copy (`:2575-2601`), import validated whole-file including id uniqueness (`:3213-3220`) and rejected rather than partially applied. Offline behaviour is correct: the only network calls are the rate cache (guarded, with stale fallback, `:6483-6528`) and Firebase, which is unconfigured and hidden.
- **Architecture.** Sound within the declared constraints. Render functions do not write; `renderDashboard()`'s early return (`:5703`) is safe — I re-derived the containment claim, and every element it and its four collaborators write lives inside `#dashboard` except `hdrSub`, which the return now covers. The two reorder implementations remain duplicated (deferred WORK-35); not re-raised, no new evidence.
- **Maintainability.** Mostly good; the exceptions are CODE-05, CODE-11 and the standing `analyzeExpenses()` size, which the architect records as a risk rather than a finding.
- **Error handling.** Good at the leaf level — `FileReader.onerror` landed (`:5270-5273`), `updateStorageStatus()`'s `persisted()` await is guarded (`:3255-3259`), the import catch is narrowed to the parse. The gaps are structural: CODE-04 and CODE-09.
- **Security.** Clean. CSP is tight and honest about `unsafe-inline`; `escapeHTML()` covers `&amp; &lt; &gt; " '`; every record-derived attribute value is escaped or numerically derived — I walked all 120 attribute interpolations. `findByDataId()` (`:4779-4784`) correctly avoids building selectors from record ids. Nothing sensitive is logged. Zero runtime dependencies. CODE-07 is a tooling-accuracy note, not an exposure.
- **Performance.** One new item (CODE-08). The per-day/per-cell `filter` scans over `db.actual` in `renderCalendar` and `drawDailyStackedChart` remain the deferred WORK-16/49 class; I took no measurement and present no new evidence, so I explicitly decline to re-raise them.
- **Reliability and scalability.** At 10,000 transactions the single-blob `localStorage` write and the unindexed daily scans are the first things to bend, exactly as the standing deferral describes. Nothing new.
- **Technical debt.** Below.

---

## Technical Debt

- **The verification layer has one unchecked half.** Four static tools are genuinely load-bearing; the render-time half is not (CODE-03). `run.mjs` is the only thing standing between a boot crash and a green `npm run` line, and `eslint.config.mjs:70-72` explicitly leans on it. Cheapest debt in the report to retire.
- **Contrast coverage is bounded by what a token can express.** V6 catches an unreferenced `--on-*` token; nothing catches a painted surface expressed as an `rgba()` literal, which is what CODE-02 is. The standing convention ("a fill under text adds a pair-table row") cannot be satisfied for a literal. That gap will recur; it is worth writing down beside the convention rather than discovering it a third time.
- **Comment-borne measurements.** CODE-01 and CODE-05 are the fourth and fifth instances of the same class in two rounds, both introduced by the fix for the previous instance. The pattern is not carelessness; it is that a number in a comment has no owner. Anything expressible as a derivation (inputs and an operator) survives; anything expressible only as a result does not.
- **`VERIFICATION.md` §1** (CODE-10) is the last section still mirroring positions rather than describing predicates.
- **`analyzeExpenses()`** — 330 lines, 26 inline rules, no seam (`:5298-5628`). Recorded, not scheduled, per the standing decision.

## Future Risks

- **Every consumer re-derives its own filter/expand pipeline from `db`.** Seven do it today; Reports, Debt Planner and Investment Tracker each need a second read model over the same collections. The hand audit that produced `VERIFICATION.md` §1 is already unwalkable (CODE-10), which is the first sign that the audit does not scale to an eighth consumer.
- **The top-level script is now 5,220 lines of straight-line construction.** CODE-04 is only the error handler's version of this; every new boot-time statement is a new way to produce a screen with no banner and no route out. The single-file constraint is not the problem — the ordering is, and it is fixable inside it.
- **A seventeenth theme** inherits a correct focus ring by construction (`:132-134`) and a correct pair table, but would inherit CODE-02's hero disc uncovered.
- **`localStorage` at 10,000 records:** one synchronous `JSON.stringify` of the whole blob per record write, on the main thread, on a phone. The deferred trigger (5,000 real records / 100ms measured render) remains the right one; nothing this round moved it.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **CODE-03 + CODE-04 together — under an hour, and they are the same problem.** Make `run.mjs` fail on a thrown flow or a console error, add the corrupted-store-then-throw walk to `v1-write-flows.js` so gate R5's own condition becomes a command, and move `let fatalReported` / `reportFatal()` / the two listeners to just after `index.html:2552` so that walk has something to catch. After this the boot-crash class has a real net under it for the first time.
2. **CODE-02 — one declaration plus a re-measure.** `.hero-kpi &gt; * { position: relative; z-index: 1; }` (the `.cal-cell &gt; *` pattern), or delete the disc. Then `check-contrast.mjs`'s two `on-hero` rows describe the painted surface. Do this in the same pass as CODE-06, which is a three-line deletion in the same file.
3. **CODE-01 — correct the comment before touching the geometry.** The comment is XS and stops the false figure propagating; the geometry decision needs a measured value and may end in "41.4px, recorded, because there is no slack left", which is a legitimate outcome and a better one than a fourth wrong number.
4. **The tail — CODE-05, CODE-07, CODE-08, CODE-09, CODE-10, CODE-11.** All XS, all single-line or single-comment, none changes a figure or unblocks a flow. Ride them along with whatever opens their region.

No rewrite is recommended, no dependency is recommended, no new tool is recommended, and nothing here requires reopening a deferral or a rejection.
