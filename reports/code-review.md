# Code Review — Round 7

**Scope:** `expense-pwa/` in full, plus `tools/` (the harness is in scope by the round-7 brief). Read against `knowledge/review-conventions.md`, `knowledge/coding-standards.md`, `knowledge/project.md`, the round-6 standing decision in `reports/chief-architect.md`, and `reports/HANDOFF.md`. Every claim below was re-derived from source; I did not accept a commit message or a comment as evidence. `reports/ui-review.md` was not read.

## Executive Summary

Round 6's approved work is genuinely on disk — I opened all three PNGs (correct), read `.hero-kpi` (the `::before` is deleted and the reason is recorded), `.kpi .value` (wrap guard present), the button census (no number), `.helper` (`var(--t-sm)`), `saveEditCat`/`catAdd` (exact `(name, group)` refusal), `load()` (`fatalReported` resets with the other three flags), `run.mjs` (exits non-zero on `THREW`, unexpected console errors and an unparseable payload) and `VERIFICATION.md` §1 (function names, no total). Nothing was recorded as landed that is not there. The money layer remains the strongest part of the codebase: integers end to end, one rounding boundary in `calcSalary`, one `fmt`, `toLocalISO`/`parseISO` everywhere and no `toISOString` anywhere in the app.

The single biggest risk is not in the money and not in the store — it is that the recovery route the whole persistence design rests on is inert in the one state it exists for. `#importFile`'s `change` listener is registered at `index.html:5444`, roughly 2,650 lines *after* `let db = load()` at `:2793`. On a boot-time throw — the exact state `tools/harness/boot-crash.js` constructs and passes — "Restore from file" opens a file picker and then does nothing at all. The probe asserts the button is *reachable*; it does not assert it *works*, which is the presence-is-not-sufficiency distinction the architect drew in ruling C17, now sitting inside the project's own boot-crash guard.

The second theme is that `npm run v1` can now say no to a *throw* but still cannot say no to a *wrong value*. The four write flows record eight measurements and assert none of them; only the corrupt-boot walk contains `throw` statements, which is why the gate's red-then-green demonstration worked. A build where "edit income" writes the wrong amount, or where the data-error banner is stuck on, still exits 0 and prints success.

## Overall Score

**78 / 100** — Solid. High findings exist but are contained.

One High and six Mediums. The High is a total-loss-of-function in the recovery path, but it is not reachable from any shipped code path I could find (the common corruption route — an unparseable blob — quarantines correctly and leaves Restore fully wired), which is what keeps it out of the Critical band. The money, store, migration, quarantine and escaping layers are clean, and I found no calculation defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences` — **the Stage 2 trigger did not fire.** The drop from round 6's 90 is the recovery-path defect plus a verification layer that is narrower than the confidence being placed on it.

---

## Findings

### Critical

None.

### High

**CODE-01 — "Restore from file" is inert after a boot-time throw, and `boot-crash.js` calls that state green**

- **Severity:** High
- **Location:** `expense-pwa/index.html:2790-2791` (button wiring), `:2793` (`let db = load()`), `:5444` (the `change` listener); `tools/harness/boot-crash.js:52-53`
- **Evidence:** `#dataErrorImport`'s click handler is registered at `:2790` and does `document.getElementById('importFile').click()`. The listener that actually reads the chosen file is registered at `:5444`, in the top-level run *below* `let db = load()`. When `load()` throws — which `:2885` `d.categories.forEach(...)` does for a blob that parses cleanly but whose `categories` is a truthy non-array, outside the `try` that ends at `:2858` — execution stops at `:2793`. Every statement from there to `:5444` is unreached. The banner is shown by `reportFatal()` (registered at `:2705-2706`, correctly above `load()`), the button is visible and live, the picker opens, the user chooses their backup, and **nothing happens**: there is no `change` listener on `#importFile`. `boot-crash.js` constructs precisely this state (`:33-35`, `categories: 'abc'`) and asserts `t.D_restore_reachable = ... offsetParent !== null` at `:52-53` — visibility, not function. The probe passes.
- **Impact:** In the one state the data-error banner exists for, the app is a blank screen whose only offered recovery does nothing, silently. The failure is deterministic on reload, so it does not clear itself. The user's remaining option is to clear site storage, which destroys the financial history the quarantine design was built to preserve. This also means WORK-99 moved the *reporting* above `load()` and left the *recovery* below it, and the probe written to guard that move cannot tell the difference.
- **Recommendation:** Do not simply move the listener — the handler body reads `ISO_DATE_RE` (`const`, `:3207`) and assigns `db`, both of which are in the temporal dead zone on this path, so it would throw instead of doing nothing. The smallest safe fix is to stop `load()` throwing at all: extend its `try` to cover the normalisation at `:2885` and `migrate(d)` at `:2888`, so a structurally invalid blob takes the quarantine path it was written for. The whole script then completes, the banner is raised by `updateCorruptBanner()` instead, and every recovery control is wired. Note the consequence for the probe: after this fix `A_init_completed` becomes **true**, so `boot-crash.js:57-59`'s setup check inverts and the probe must be re-expressed — the residual class (any throw elsewhere in the top-level run) needs a different injection. Demonstrate red before green, per the standing rule.
- **Effort:** S

### Medium

**CODE-02 — `npm run v1` asserts that the write flows do not throw; every value they measure is unchecked**

- **Severity:** Medium
- **Location:** `tools/harness/v1-write-flows.js:43-44, 53-54, 65, 73-76, 79-80, 92`; `tools/harness/run.mjs:136-150`
- **Evidence:** `run.mjs` fails on `parsed.ERROR`, on any string containing `THREW`, and on `H_unexpected_console_errors > 0`. Nothing else. In the probe, `A_income_count`, `B_amount_after_edit`, `B_modal_closed`, `C_actual_count`, `D_amount_after_edit`, `D_list_refreshed`, `E_data_banner_hidden`, `F_save_banner_hidden` and `G_income_edit_failed_toast` are **recorded and never compared to anything**. The only `throw` statements in the file are in the corrupt-boot walk (`:123, :126, :140-145`), which is why reverting `index.html:7572` turned the run red — that walk asserts, the four write flows do not. A run in which `db.income[0].amount` is 5000 instead of 7500, or `E_data_banner_hidden` is `false`, or `G_income_edit_failed_toast` reads "Income updated" instead of `SAVE_FAILED_MSG`, exits 0 and prints success.
- **Impact:** The command that underwrites every completion claim in this project verifies the absence of exceptions in four flows, not their correctness. The probe's own comments state stronger claims than the code makes — `:78` "The false alarm must not be showing", `:82` "And the contract still holds when a write genuinely fails" — neither of which is a test. This is the same shape as round 6's CODE-03 one level in: a value written into a field that nothing reads.
- **Recommendation:** Convert the recorded values into assertions inside the existing `flow()` blocks, in the same style the corrupt-boot walk already uses: `if (db.income[0].amount !== 7500) throw new Error('edit income did not write 7500, wrote ' + ...)`, and the same for the expense edit, the two banner booleans and the save-failure toast. No new file; the assertions go inside the probe that already exists. Demonstrate each red once by breaking what it watches.
- **Effort:** S

**CODE-03 — `run.mjs --width` exits 0 on a probe that never reported**

- **Severity:** Medium
- **Location:** `tools/harness/run.mjs:77-88`, `:98-116`, `:134-157`
- **Evidence:** In width mode the host page copies the inner frame's attribute after a fixed 1800ms and falls back to a literal: `f.contentDocument.documentElement.getAttribute('data-probe') || '{}'` (`:83-85`). If the inner probe threw before writing, or simply had not finished, the outer document carries `{}`. That parses, so the `:107-114` guard the architect authorised in WORK-98 does not fire; `Object.entries({})` is empty so no `THREW` is found; `H_unexpected_console_errors` is `undefined` so the console assertion is skipped. The command prints `{}` and exits 0. Separately, the `THREW` scan at `:138-142` descends into arrays but not into nested objects, so a probe reporting a table keyed by width would hide a `THREW` string from it.
- **Impact:** This is the same class as the parse-failure exit-0 that round 6 closed at `:108`, in the same file, in the mode that is *not* exercised by `npm run v1` or `boot-crash.js`. It matters now because the deferred WORK-97(b) names its own settling condition as a harness probe reporting `.cal-cell` `getBoundingClientRect().width` at 320, 360, 375 and 390px — a width-mode, nested-result probe. The calendar geometry decision, whose numbers have already been wrong twice, would rest on a runner that returns green for a probe that measured nothing.
- **Recommendation:** In `run.mjs`, fail when the parsed payload has no own keys, and poll for `data-probe` in the host rather than sampling once at a fixed timeout (or, minimally, have the host write a sentinel such as `{"ERROR":"probe did not report within 1800ms"}` instead of `{}`). Make the `THREW` scan recursive over plain objects. Both are inside an existing file.
- **Effort:** XS

**CODE-04 — `boot-crash.js` reports a console-error count from a list nothing writes to**

- **Severity:** Medium
- **Location:** `tools/harness/boot-crash.js:24`, `:71`, `:77`; `tools/harness/run.mjs:147-150`
- **Evidence:** The probe declares `var t = { consoleErrors: [], flows: [] };` and then sets `t.H_unexpected_console_errors = t.consoleErrors.length` at `:71` and `:77`. There is no `console.error` hook, no `window.addEventListener('error', ...)` and no `push` into `consoleErrors` anywhere in the file — unlike `v1-write-flows.js:17-20`, which installs all three. The field is therefore always `0`. `run.mjs:147` reads it and can never fail on it.
- **Impact:** A reader of the payload, and of `run.mjs`'s own note at `:131-133` ("a probe that does not report that field gets no console checking"), reasonably concludes that `boot-crash.js` *is* console-checked, because it reports the field. It is not. An assertion that structurally cannot fail is the exact defect round 6 raised as its most important finding, reproduced in the probe added to fix it.
- **Recommendation:** Either install the same three-line recorder `v1-write-flows.js` uses, or delete the `consoleErrors` field and the two `H_unexpected_console_errors` assignments so the payload stops implying a check that is not happening. The second is smaller and honest; note that console errors raised inside the *nested* frame are not visible to the outer one either way, which is worth stating in the probe's header.
- **Effort:** XS

**CODE-05 — Planned vs Actual keys rows by category name, so two categories the app deliberately allows merge into one mislabelled row**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:6062-6067`, `:6094`; contrast with `:6423` and `:6437` (chips key by `categoryId`)
- **Evidence:** `drawPvA()` builds `rows[name]` from `cat.name` and stamps `group: cat?.group || 'Needs'` on first sight only. Round 6's WORK-103 explicitly preserved "Transport / Needs" and "Transport / Wants" as a legitimate pair (`:4974-4976`). Those two distinct categories produce **one** Planned vs Actual row labelled "Transport", carrying whichever group tag was encountered first, with both categories' planned and actual money summed into it. The same two categories appear as two separate chips with two separate colours on Analytics, because `renderDailyChips()` keys by id. Two cards on two screens disagree about how many categories there are.
- **Impact:** The Dashboard's budget-comparison card silently merges two budgets and mislabels the group of the merged row, on the one screen where over/under budget is the message. For an audience `project.md` defines as having little accounting knowledge, there is nothing on screen explaining why "Transport" shows more actual than they planned for either Transport. Additionally, the comment at `:4977-4980` justifying the WORK-103 guard states that an exact duplicate produces "one heading split across two rows in Planned vs Actual" — the opposite of what `drawPvA` does; a duplicate merges. That is a comment stating a derived result that is false, which is the class the standing convention forbids.
- **Recommendation:** Key `rows` by `x.categoryId` and carry `name` and `group` as fields of the row, exactly as `renderDailyChips()` and `renderDaySelected()` already do. Sort and render unchanged. Correct the `catAdd` comment's Planned-vs-Actual clause in the same commit, stating what the code does.
- **Effort:** XS

**CODE-06 — README's deploy instructions ship four files; the app needs eight, and following them undoes WORK-93**

- **Severity:** Medium
- **Location:** `expense-pwa/README.md:11-17` (Files table), `:53` (deploy step 3), `:74-79` (Features), `:96` (WORK ids)
- **Evidence:** The Files table lists `index.html`, `manifest.json`, `sw.js`, `icon.svg`. Step 3 of the recommended GitHub Pages route reads "Upload all four files (`index.html`, `manifest.json`, `sw.js`, `icon.svg`) to the repo." `manifest.json:11-42` declares five icons including `icon-maskable.svg`, `icon-180.png`, `icon-192.png` and `icon-512.png`; `index.html:48` links `icon-180.png` as the apple-touch-icon; `sw.js:3-12` lists all eight assets. A deployment made by following the README exactly 404s four of them. Separately: `:79` describes Settings as having a "dark mode toggle" — there are sixteen themes behind a picker (`index.html:4198-4215`); the Features list omits Analytics, Savings Goals, Budget Planning, reminders and the currency converter, four of which `project.md` names as core modules; and `:96` cites "WORK-05 and WORK-14 in `reports/chief-architect.md`" as the Firebase preconditions, which resolve in the current standing decision to nothing of the kind (the live deferral is WORK-15).
- **Impact:** The icon work approved and completed in round 6 — the app's face on the platform whose storage-eviction warning the app itself raises — is undone by the app's own deployment instructions. The stale WORK ids sit in the paragraph that is the standing hard precondition for enabling Cloud Sync, so a reader checking whether the precondition is met is sent to identifiers that no longer describe it.
- **Recommendation:** Make the Files table and step 3 name the deployable set once, or replace step 3 with "upload the whole `expense-pwa` folder" so it cannot drift again. Fix the theme line, add the four missing modules to Features, and replace the WORK-05/WORK-14 citation with WORK-15 or with the condition itself rather than an id.
- **Effort:** XS

**CODE-07 — The header's bottom padding carries the top safe-area inset**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:768-769`
- **Evidence:**
  ```css
  padding: 14px 16px calc(14px + env(safe-area-inset-top)) 16px;
  padding-top: calc(14px + env(safe-area-inset-top));
  ```
  The shorthand's third value is the **bottom**. The following line then overrides the top with the same expression. The resulting box is top `14px + inset-top` (intended) and bottom `14px + inset-top` (not). `<meta name="viewport" content="... viewport-fit=cover">` at `:31` makes `env()` resolve to the real inset, and the app's own Storage Status and About cards recommend installing to the home screen, which is the mode where `safe-area-inset-top` is non-zero.
- **Impact:** On a notched iOS device in the installed PWA — the recommended configuration — the sticky header is roughly 47–59px taller than designed, on every screen, pushing the whole app down. This is derived from the declaration rather than measured on a device; the derivation is unambiguous, since the shorthand's third value is the bottom by definition. It is also a direct deviation from `coding-standards.md` "Avoid duplicated styles": two padding declarations where the second exists only to correct the first.
- **Recommendation:** One declaration: `padding: calc(14px + env(safe-area-inset-top)) 16px 14px 16px;` and delete the `padding-top` line.
- **Effort:** XS

### Low

**CODE-08 — `saveEditIType()` has no duplicate-name check, so renaming is the way around `incomeTypeAdd`'s**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:5028-5038`; contrast with `:4995-4997` (`incomeTypeAdd`) and `:5145-5151` (`saveEditCat`)
- **Evidence:** `incomeTypeAdd` refuses a case-insensitive duplicate. `saveEditIType()` writes `t.name = name` with only a non-empty check. The category pair carries both halves, and `saveEditCat`'s own comment states the reason: *"Same rule as catAdd, or renaming is a way around it."* That reasoning was not applied to the income-type pair.
- **Impact:** Two identically-labelled income types, indistinguishable in the Income form's Type dropdown and in the Income list, with no diagnosis available to the user. Minor secondary effect: the salary handler resolves its target with `db.incomeTypes.find(t => t.name === 'Salary')` (`:4491`), so a type renamed to "Salary" ahead of the real one silently becomes the destination for net-salary income records.
- **Recommendation:** Add the same exclusion-of-self duplicate test `saveEditCat` uses, minus the group clause. Three lines.
- **Effort:** XS

**CODE-09 — `goalProblem()` does not validate `createdDate`, which silently disables an advisor rule**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:3276-3303` (validator), `:5656-5666` (consumer), `:7272` (writer)
- **Evidence:** `goalProblem()` validates `deadline`, `recStartDate` and `recLastLogged` against `ISO_DATE_RE` and does not check `createdDate`, which `:7272` writes on every goal. `analyzeExpenses()` does `parseISO(g.createdDate || todayISO())` at `:5656`; a non-ISO value yields an Invalid Date, so `totalDays` and `daysDone` are `NaN`, the `totalDays <= 0 || daysDone <= 0` guard at `:5660` is false for `NaN`, and the comparison at `:5663` is then false for every goal — the rule silently never fires.
- **Impact:** Contained: no `NaN` reaches the screen, and no money is wrong. But this is the third instance of the same class the project has already closed twice — a date field on a record that the import validator does not reach, consumed by `parseISO` — and the two previous instances (`recLastDone`, `recLastLogged`) both produced visible defects. The failure here is a rule that stops working with no signal.
- **Recommendation:** One line in `goalProblem()`, matching the three beside it: `if ('createdDate' in r && r.createdDate != null && !ISO_DATE_RE.test(r.createdDate)) return 'has an invalid created date';`
- **Effort:** XS

**CODE-10 — The fixture's expected values are the project's only cross-screen recurrence assertions and no command evaluates them**

- **Severity:** Low
- **Location:** `tools/harness/fixture.js:16-29`; `package.json:13`; `reports/HANDOFF.md:88-91`
- **Evidence:** `fixture.js` carries `RANGES` with `expectTotal` / `expectPlans` for four ranges (290,000 / 360,000 / 260,000 / 50,000) and the helpers `sumOccurrences()` and `plansListed()` to evaluate them. No probe in `tools/harness/` uses `--fixture`; `npm run v1` runs `v1-write-flows.js`, which does not. HANDOFF instructs "Run that after any change to recurrence, filtering or the dashboard" — an instruction that cannot be followed, because there is no probe to run; the next engineer must write one first.
- **Impact:** The four figures that `VERIFICATION.md` §3 derives, and that §5's gate-close checklist is written in terms of, exist as data with no runner. The recurrence engine is the part of the app with the longest defect history (ARCH-1, the moving cursor, the guard-constant totals) and the fixture is the one artifact that would catch a regression in it. Also relevant to the standing Stage 2 deferral: the deferral's own trigger is a calculation defect, and there is no command that would surface one.
- **Recommendation:** Add one probe in `tools/harness/` that calls `loadFixture()`, walks `RANGES`, and throws when a computed total or plan count disagrees — assertions inside the existing render harness, adding no sixth executable. Wire it as a second script or run it by hand; the point is that the four numbers become re-derivable by a command rather than by a person. Demonstrate red by perturbing one expectation.
- **Effort:** S

**CODE-11 — Stale round-1 review reports ship inside the application directory**

- **Severity:** Low
- **Location:** `expense-pwa/reports/code-review.md`, `expense-pwa/reports/ui-review.md`, `expense-pwa/reports/analytics-roadmap.md`
- **Evidence:** `expense-pwa/reports/code-review.md:3-5` reads "`index.html` (5,161 lines), `sw.js` (54)" dated 2026-07-28; the file is now ~7,845 lines and `sw.js` is 93. `CLAUDE.md` names `reports/` at the repository root as the location for generated review reports, and the current reports live there. These are duplicates of report *names* that exist at root with different, current content.
- **Impact:** No runtime effect — `sw.js`'s `ASSETS` does not include them and nothing links them. The cost is that a reader who opens `expense-pwa/reports/code-review.md` gets a round-1 document describing a codebase that no longer exists, under the same filename as the live one. README Option B ("drag the entire `expense-pwa` folder") also publishes them.
- **Recommendation:** Move the three files under the root `reports/` with a round suffix, or delete them. Nothing references them.
- **Effort:** XS

---

## Review Areas

**Correctness of money — clean.** Currency is integer tugrik end to end: `unmoney()` (`:3548`) strips to digits, `fmt()` (`:3463-3466`) rounds once at display with the sign outside the symbol, `calcSalary()` rounds its entire return object in one place (`:4422-4427`) so the stored breakdown and the income row written beside it cannot disagree, `nonNegative()` (`:4387`) is the single clamp for all nine salary inputs and is applied at both read sites. `fmtCompact()` takes magnitude first and re-applies the sign. Divisions are guarded (`gTot > 0`, `totalActual > 0`, `daysLogged > 0`, `g.target > 0`, `axisMax` floored at 1 via `niceCeil`). Dates are `toLocalISO`/`parseISO` throughout; `toISOString()` appears only in the comment forbidding it (`:3541`). **I found no calculation defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. The Stage 2 trigger did not fire, sixth round running.**

**Data and persistence — one High.** Single source of truth (`db`), one write seam (`writeDb`/`save`/`load`), a single-blob atomic write so no partial update is possible, numbered append-only migrations with the version stamped at the step actually reached (`:2561-2575`), quarantine before any write with at most one copy retained (`:2729-2755`), and an import validator that rejects a file whole and now checks id uniqueness per collection. Offline behaviour is correct: the store never touches the network, `fetchRatesUSDBase()` falls back to a stale cache and labels it, and `sw.js` is stale-while-revalidate with a shell fallback. The defect is CODE-01: the *recovery* half of this design is registered 2,650 lines below the point it must survive. CODE-09 is one remaining gap in the validator.

**Architecture — clean within the constraints.** Responsibilities separate cleanly for a single-file app: storage, validation, the recurrence engine, render functions and handlers each occupy their own region. No `render*` calls `save()` — `check-saves.mjs` re-derives that on every run. `stepDate()` is the single step definition and `computeNextRecurring()` now routes through it. `expandPlannedInRange()` is the one expansion. The UI reaches storage only through `db` and the one seam. `renderDashboard()`'s early return (`:5952`) is guarded by a documented containment argument.

**Maintainability — one Medium.** Names are meaningful and comments state why. `renderDashboard()` guards against being re-entered from thirteen non-Dashboard call sites; `initPeriodFilter` is shared by four screens; `downloadJSON` is shared by both halves of the recovery story. The one duplication that will drift is `drawPvA`'s name-keyed grouping against every other consumer's id-keyed grouping (CODE-05). `analyzeExpenses()` remains 330 lines of 26 inline rules with no seam — recorded by the architect as a risk, not raised here as a finding. Dead code: `clearQuarantinedCopies()` returns a count nobody reads (`:2726`); not worth a finding.

**Error handling — one High, one Medium.** Every failure path in the persistence layer reports: `writeDb()` raises the banner on quota and on quarantine failure, `savedToast()` is the one message helper, and `check-saves.mjs` allow-lists the five silent writes with reasons. The import path narrows its catch to the parse and gives the read failure its own modal. `updateStorageStatus()` guards both awaits. The gaps are CODE-01 (the recovery control does nothing) and CODE-02 (the harness reports failures it does not assert on).

**Security — clean.** I traced every interpolation of record data. Attribute values are escaped or validator-constrained, and `check-escaping.mjs` re-derives that; text-content sites reaching the DOM carry `escapeHTML()` (`renderAdvisor` escapes tip titles and messages, so the unescaped `${g.name}` at `:3854`/`:5664`/`:5825` never reaches markup raw), and every dialog and toast writes through `textContent`. `findByDataId()` (`:5021-5026`) removes the selector-injection route for imported ids. CSP is present and honest about what `'unsafe-inline'` costs. Nothing sensitive is logged — `console.error` carries messages and exception objects, not record contents. The only third-party dependency is the optional Firebase SDK behind an empty config, and the one network call is the rate API. Dev dependency is ESLint 9 only.

**Performance — deferred class, unchanged.** `renderCalendar()` scans the full collection per cell (`:6339-6341`, up to 42 × N), `drawDailyStackedChart()` per day (`:6478`, up to 90 × N), `drawMonthlyTrend()` filters both collections per month (`:6161-6162`), and category lookups are `find()` inside `forEach` in five places. This is the deferred WORK-16/49 class; its trigger is a measured render above 100ms on a mid-range device or a real store above 5,000 records. **I took no measurement and I am not re-raising it.** The round-6 hoist of `getComputedStyle` out of the cell loop is present at `:6373`.

**Reliability and scalability.** At 10,000 transactions the store is a single ~1.5MB JSON blob written synchronously on every record change; `saveSoon()` correctly keeps preferences off that path. The first thing to break is the Analytics screen's per-cell and per-day scans, then blob size against the ~5MB origin quota (deferred WORK-17). Guards on every recurrence walk are bounded and now `console.warn` when they fire.

**Technical debt — see below.**

---

## Technical Debt

- **The verification layer's runtime half is narrower than the confidence placed on it (CODE-02, CODE-03, CODE-04, CODE-10).** Round 6 established that a command must be able to say no, and made it able to say no to an exception. It still cannot say no to a wrong number, cannot say no in width mode at all, and carries one field that structurally cannot fail. The cost compounds: every future "it landed" claim rests on this command, and each round adds assertions to it.
- **`analyzeExpenses()` — 330 lines, 26 inline rules, no seam.** Recorded by the architect and unchanged. It is where the roadmap's AI Budget Assistant will want to live and it has no boundary to attach to.
- **Every consumer re-derives its own filter/expand pipeline from `db`.** Six render functions each rebuild "filter this collection by the active range, expanding planned occurrences". CODE-05 is what that costs when one of them derives its grouping key differently from the others. Reports, Debt Planner and Investment Tracker each need a second read model over the same collections.
- **Filter state lives in DOM inputs, not in a model.** `getRange(prefix)` reads `.value` off two `<input type="date">` elements. Every screen's range is therefore only knowable by asking the DOM, which is what makes the harness the only place a range-dependent claim can be checked.
- **The README is the app's deployment contract and has drifted from the app four ways (CODE-06).** The Files table has been wrong since the second icon was added; the WORK ids in the Cloud Sync precondition were correct two decisions ago.

---

## Future Risks

- **The first new consumer of `db.planned` will re-derive the pipeline a seventh time.** `VERIFICATION.md` §1's inventory is now written in function names rather than positions, which keeps it walkable, but it is still a hand audit and it does not reach a consumer nobody adds it to.
- **Enabling Cloud Sync remains gated on WORK-15, and `load()` is still not on the cloud path** — `loadFromCloud()` assigns `db` directly and writes the raw string to `localStorage` (`:3003-3004`), so no normalisation, no migration and no validation run for cloud data. The code says so honestly at `:2878-2884`. The README's stale WORK ids (CODE-06) make that precondition harder to check than it should be.
- **The calendar geometry decision (WORK-97b) is scheduled to be settled by a width-mode harness probe**, which is the exact mode CODE-03 shows can return green on a probe that measured nothing. Fix CODE-03 before that measurement is taken, or the fourth number in that comment will be as unverified as the first three.
- **A seventeenth theme, or any new painted surface carrying text, re-opens the contrast question.** The mechanism is sound and the standing exclusion (an unmeasurable fill may not paint over text) is now written into `.hero-kpi`'s comment as a worked example, but coverage is still hand-maintained.
- **Growth of `analyzeExpenses()`.** Twenty-six rules with no seam is where the next feature will be pasted, and each rule silently re-scans `db.actual` and `db.goals`.

---

## Recommended Refactoring

The smallest set of structural changes that removes the most risk, in order:

1. **Make `load()` incapable of throwing (CODE-01).** Extend its `try` past the group normalisation and `migrate()` so a structurally invalid blob quarantines instead of aborting the script. This restores every recovery control in the state they exist for, and it is one brace move. It requires re-expressing `boot-crash.js`'s setup check in the same commit, since `A_init_completed` inverts — which is the honest cost, not a reason to skip it.

2. **Turn `v1-write-flows.js`'s recorded values into assertions (CODE-02).** Eight `if (...) throw` lines inside the flows that already run, in the style the corrupt-boot walk already uses. This is the change that makes "the batch is verified" mean something for the four flows, not just for the fifth. No new file.

3. **Close the two runner holes in `run.mjs` (CODE-03) and delete the dead field in `boot-crash.js` (CODE-04).** Fail on an empty payload, poll instead of sampling at a fixed timeout, and recurse the `THREW` scan. Together with (2) this is what makes the harness trustworthy before WORK-97(b)'s measurement is taken.

4. **Key `drawPvA` by `categoryId` (CODE-05)**, carrying name and group as row fields. This aligns the Dashboard with the four consumers that already do it and removes the last place where two categories are decided to be the same thing by their label.

5. **Give the fixture a runner (CODE-10).** One probe inside `tools/harness/` that evaluates `RANGES`. It costs an afternoon and it is the only regression guard the recurrence engine would have.

6. **The five XS items — CODE-06, CODE-07, CODE-08, CODE-09, CODE-11 —** as separate commits, in any order, after the above. Each is one to three lines and none depends on another.
