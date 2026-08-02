# Principal Code Review — Round 5

Scope: `expense-pwa/index.html` (7,338 lines), `expense-pwa/sw.js`, `expense-pwa/manifest.json`, `expense-pwa/VERIFICATION.md`, `package.json`, `tools/*.mjs`. Read in full. Every finding below was verified against the source, not against a commit message or a prior report.

---

## Executive Summary

The round-4 batch landed and it landed clean. I re-walked all five gate and post-gate classes rather than trusting them: every one of the 33 `save()` sites now either captures its result or is on the allow-list with a reason; `recurrenceProblem()` and `goalProblem()` validate both cursor fields ahead of the no-schedule early return; `findByDataId()` has removed the last id-into-selector path; `navigate('dashboard')` at init removes the duplicated knowledge of the first screen; and the two new predicates are real predicates, not files — `check-saves.mjs` builds an actual brace-depth scope chain and would have caught the seventh delete path without anyone counting. No Critical and no High finding exists in this build.

The durable pattern of the previous four rounds — a fix creating its neighbour — has largely stopped, but it has not stopped entirely, and the one instance of it this round is the biggest risk here. **WORK-48 made `reportFatal()` rewrite every claim the data-error banner renders, which is correct for the case it was written for and destructive for the case it was not: on a boot where the store genuinely could not be read, any later runtime error replaces a true message with a false one ("Your saved data has not been changed") and hides the *Download damaged file* button — removing the only route back to the quarantined copy** (CODE-01). The two other Mediums are older omissions the sweeps never reached: the salary form accepts negative hours and negative deduction percentages straight into `db.income` (CODE-02), and `Restore from file` has no `FileReader.onerror`, so a failed read on the app's recovery path says nothing at all (CODE-03).

The single biggest risk is CODE-01, because it degrades the one screen state the entire storage design exists to make survivable.

---

## Overall Score

**90 / 100** — Production ready band.

The convention's 90-100 band is defined by the absence of Critical and High findings, and there are none: no figure is wrong, no data is lost on any path I could trace, no module is unreachable, and the escaping, save-outcome and validator classes are all closed under re-inspection. It sits at the floor of the band rather than above it because three Mediums remain and all three are failure-reporting or input-validation gaps — the exact class this project keeps rediscovering.

---

## Findings

### Critical

None.

### High

None.

---

### Medium

**CODE-01 — `reportFatal()` overwrites a live corrupt-data banner and hides the recovery button**

- **Severity** — Medium
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:7294-7298`; interacts with `:2499-2514` and `:2627`
- **Evidence** — `updateCorruptBanner()` runs from `load()` on a boot where the stored JSON failed to parse. It shows `#dataErrorBanner` with the true text ("Your saved data could not be read." / "The app has started empty." / "The unreadable data has been set aside, so it is not lost.") and reveals `#dataErrorDownload`. `reportFatal()` — reached from `window.onerror` and `unhandledrejection` at `:7302-7303` — then rewrites the same three elements unconditionally:

  ```js
  setBannerText('dataErrorTitle', 'Something went wrong.');
  setBannerText('dataErrorBody', ' Your saved data has not been changed.');
  setBannerText('dataErrorNote', ' Reload the app. If it stays broken, restore a backup.');
  const dl = document.getElementById('dataErrorDownload');
  if (dl) dl.style.display = 'none';  // nothing was quarantined
  ```

  There is no check on `dataWasCorrupt`. The comment on the `display = 'none'` line states its own precondition — "nothing was quarantined" — and nothing tests it. When `dataWasCorrupt` is true the data *was* changed (the app started empty), something *was* quarantined, and if `corruptQuarantineFailed` is true the replaced note was also the only statement that saving is disabled. `updateCorruptBanner()` is called from `load()` alone, so nothing restores the true text for the rest of the session.
- **Impact** — In the exact state the quarantine mechanism exists to survive, the user is told their data has not been changed while it sits unreadable in a side key, and the button that hands those bytes back disappears. The rational response to "Something went wrong — reload" is to reload, which re-runs `load()`, re-quarantines nothing new, and leaves them no better off. This is C5's rule (every claim the element renders must be rewritten by the path that raises it) satisfied in one direction and violated in the other.
- **Recommendation** — Guard the rewrite: `if (dataWasCorrupt) return;` immediately after the `fatalReported` check, or before the three `setBannerText` calls. The corrupt-data message is the more urgent and more actionable of the two, and it is already showing.
- **Effort** — XS

---

**CODE-02 — The salary form accepts negative hours and negative deduction percentages, and writes the result to `db.income`**

- **Severity** — Medium
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:4031-4075` (the `sSave` handler), `:4002-4026` (`calcSalary`), `:3230` (`unnum`), markup `:1753-1782`
- **Evidence** — `unnum(v)` is `+String(v ?? '').replace(/,/g, '') || 0`, so `unnum('-5') === -5`. Seven of the nine salary inputs — `sNormal`, `sOT`, `sNT`, `sOTNT`, `sFieldDays`, `sSIPct`, `sWHTPct` (`:1753-1782`) — are plain `type="text"` fields, *not* `.money-input`, so `formatMoneyInput()` never strips the minus sign from them. The only two guards on the write path are `unnum(hourlyEl.value) <= 0` and `r.net <= 0`. Neither rejects a mix. With rate 1,000 / normal 10 / overtime **−2**, `otPay` is −3,000, gross is 7,000, net is positive, and the handler stores `otHours: -2, otPay: -3000` in `db.salaries` **and** pushes `Math.round(r.net)` into `db.income` as a real income record. A `sSIPct` of `-11.5` inflates net above gross by the same route.
- **Impact** — A single mistyped minus produces an income entry that is wrong and permanent, and a salary history row whose parts do not sum to its total. The Salary Calculator is a named core module in `project.md` aimed at "people with little accounting knowledge", and `coding-standards.md` says "Validate inputs" without qualification. Nothing in the app flags it afterwards — every downstream sum treats the stored figure as truth.
- **Recommendation** — Clamp at the read boundary, in one place, the way `recInterval()` already does for schedules: a `nonNegative(id)` wrapper around `unnum()` inside `calcSalary`'s `g()`, plus the same treatment for the two percentage fields in the `sSave` record. One helper, eleven call sites already funnel through `g()` and `unnum`.
- **Effort** — XS

---

**CODE-03 — `Restore from file` fails silently if the file cannot be read**

- **Severity** — Medium
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:4995-5058` (`r.onload` is assigned at `:4998`, `r.readAsText(f)` at `:5057`)
- **Evidence** — The `importFile` change handler creates a `FileReader`, assigns `onload`, and calls `readAsText`. There is no `r.onerror` and no `r.onabort`. If the read fails — a file removed from cloud storage between picking and reading, a permission revocation, an unreadable device path — `onload` never fires and every statement in the handler, including both `alertDialog()` calls, is unreachable. The picker closes and the app does nothing.
- **Impact** — This is the recovery path the entire persistence design leans on: the corrupt-data banner's own *Restore from file* button routes here (`:2531-2532`), as does Settings → Restore. A user acting on a data-loss banner taps Restore, the app is silent, and they have no way to distinguish "the file was rejected" from "nothing happened". Every other outcome on this path — bad JSON, a failed validation, a failed write — was deliberately given a modal precisely because a disappearing message is wrong here; the read failure is the one outcome that got none.
- **Recommendation** — Add `r.onerror = () => alertDialog('That file could not be read from this device. Nothing was imported and your data has not changed.', { title: 'Cannot read this file' });` beside the existing `onload`. Two lines, and it reuses the wording pattern already at `:5007`.
- **Effort** — XS

---

### Low

**CODE-04 — `updateStorageStatus()` awaits an unguarded promise and can raise the permanent fatal banner**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:3113`; called without a catch at `:4775` (`renderSettings`) and `:3133`
- **Evidence** — `const persistOK = await (navigator.storage?.persisted?.() ?? false);` sits outside any `try`. Only the `estimate()` call below it is guarded (`:3117-3123`). `renderSettings()` calls `updateStorageStatus()` with no `.catch()`, so a rejected `persisted()` becomes an unhandled rejection, reaches `:7303`, and raises a red, undismissible banner reading "Something went wrong." for the rest of the session. `ensurePersistentStorage()` (`:3099-3106`) wraps the identical API in a `try`, so the pattern is established two functions above and was not applied here.
- **Impact** — A storage-status query that fails is worth a line of text, not a permanent data-integrity alarm. Combined with CODE-01, this is also the most plausible trigger for that finding, since Settings is where a worried user goes.
- **Recommendation** — Wrap the `persisted()` await in the same `try { … } catch { }` shape used by `ensurePersistentStorage()`, defaulting to the "not granted" branch.
- **Effort** — XS

---

**CODE-05 — Rounding is applied at three different boundaries, and `db.salaries` stores unrounded money**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:3143-3146` (`fmt` rounds for display), `:4025` (`calcSalary` returns raw products), `:4054` (`...r` spreads them into the stored record), `:4071` (`Math.round(r.net)` for the income row)
- **Evidence** — The comment at `:4062-4071` states the rule — "Rounded at the write boundary … Every other collection already stores whole tugrik" — and then applies it to exactly one of the two writes on the same handler. `db.salaries` receives `gross`, `si`, `wht`, `net`, `deductions` and the five component pays as raw floats via `...r`. `openSalaryHistory()` (`:4788`) prints them through `fmt()`, which rounds each independently, so a stored row can render `Gross 700,000 · SI 80,500 · WHT 70,000 · Net 549,501` where the printed parts do not reconcile. `salaryProblem()` (`:4034-4039`) validates only `id` and `date`, so nothing constrains these on the import path either.
- **Impact** — Small in magnitude (sub-tugrik), real in kind: the review question "is rounding defined once and applied in one place?" currently answers no, and the one collection that escaped the rule is the one whose whole purpose is showing a breakdown that adds up.
- **Recommendation** — Round in `calcSalary`'s return object so there is one rounding point, and the income write at `:4071` can then drop its own `Math.round`.
- **Effort** — XS

---

**CODE-06 — `revealEntryDate()` changes the preset without syncing the custom-range editor**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:3394-3397`; contrast with `:7253-7255`
- **Evidence** — `revealEntryDate()` sets `#<prefix>Preset.value`, `From` and `To` programmatically. Setting `.value` fires no `change` event, so `initPeriodFilter`'s `syncCustom()` (`:3333-3335`, the only thing that toggles `.filter-custom.show`) never runs. The `data-show-all` handler solves the identical problem four lines of its own (`:7253-7255`: "The user may have been on Custom; the date editor belongs to that preset"), so the knowledge exists in the file and only one of the two writers has it.
- **Impact** — Add an entry dated outside a custom range and the preset dropdown flips to "This Month" while the From/To editor stays on screen showing the new dates — a control the design deliberately hides for every non-custom preset. Cosmetic, but it is the same "two places do one job and one of them is right" shape that has produced the last four rounds of regressions.
- **Recommendation** — Move the `customEl.classList.toggle('show', preset === 'custom')` line into `revealEntryDate()` as well, or extract the three-line "apply a preset to the DOM and persist it" body that `revealEntryDate` and the `data-show-all` handler now duplicate.
- **Effort** — XS

---

**CODE-07 — Every mutation repaints the Dashboard even when the Dashboard is not on screen**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:5458` (`renderDashboard`), guard at `:5474`; called off-screen at `:3610, 4073, 4095, 4138, 4464, 4531, 4706, 4836, 4986, 5054, 5071, 7153, 7197`
- **Evidence** — `navigate()` at `:3990` already calls `renderDashboard()` on entering the screen, so every one of the thirteen other call sites is a full repaint of a hidden `<section>`: `expandPlannedInRange` over all plans, `analyzeExpenses` (26 rules, several full scans of `db.actual`, `db.income` and `db.goals`), `drawDonut`, `drawPvA`, `renderAdvisor` and `drawMonthlyTrend` (up to 36 months × two full-collection filters). WORK-51 added the guard at `:5474` for exactly one of the writes — the subtitle — which establishes that the whole function is Dashboard-only; the other 80 lines still run.
- **Impact** — No user-visible failure today, and I am deliberately not re-raising the deferred indexing work (WORK-16/WORK-49) whose trigger has not fired. This is the cheaper and different lever on the same axis: not "make the loop faster" but "do not run the loop". At the 5,000-record threshold the architect set, this multiplies the deferred cost by thirteen and puts it on the critical path of every add and every delete, which is where a stall is felt.
- **Recommendation** — Extend the existing `:5474` guard to the whole function: early-return from `renderDashboard()` when `#dashboard` is not `.active`. `navigate()` re-renders on entry, so nothing is lost. Same treatment applies to the `renderIncome()`/`renderExpenses()` pairs at `:5054` and `:5071`.
- **Effort** — XS

---

**CODE-08 — `check-saves.mjs` only sees a bare save that ends in a semicolon**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\tools\check-saves.mjs:72`
- **Evidence** — `const BARE_SAVE = /(^|[;{}\s])save\(\)\s*;/;`. The trailing `;` is required. `if (ok) save()` at end of line, `rows.forEach(() => save())`, and any `save()` closing an arrow body are all valid JavaScript that discards the return value and none of them match, so they are never counted as hits and never checked against `ALLOWED`. The file's own header states the property it is claiming: "A new unreported write fails on the first run. That is the only property that matters." That property does not hold for those three forms. (The current source is clean — I checked all 33 `save()` occurrences — so this is a gap in the guard, not a live defect.)
- **Impact** — This predicate exists because the class failed twice by hand-counting in a single round. A guard that is narrower than the claim written on it is how the class returns, and the next reader will trust the header.
- **Recommendation** — Drop the required semicolon and detect a discarded call instead: match `save()` and reject only when the preceding non-whitespace token is one of `= return ? : || && (` — i.e. invert the existing `CAPTURED` test rather than depending on statement punctuation. Re-run; the five allow-listed sites should still be the only hits.
- **Effort** — XS

---

**CODE-09 — `VERIFICATION.md` §6 asserts two things that are no longer true**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\VERIFICATION.md:288-290` and `:313-316`
- **Evidence** — `:288-290` — "The table is a deliverable … It is empty until WORK-41/42/53/54 populate it, and an empty table passes." The table in `tools/check-contrast.mjs:52-100` now holds 27 pairs and measures 432 combinations. `:313-316` — "**The category-delete handler is deliberately absent from this list.** It is WORK-45, a gate R4 item, and `check-saves.mjs` fails on it today." WORK-45 landed at `index.html:4986` (`const ok = save(); … savedToast(ok, 'Category deleted');`) and the check returns zero.
- **Impact** — This is the artifact the Chief Architect made a precondition of the gate, and the one a future contributor reads to learn what the predicates currently assert. It now describes the state before the batch that closed the gate. It is the same class WORK-61 was approved to fix in `check-escaping.mjs` — a false premise recorded in a document people trust — and correcting a paragraph is the cheapest fix that exists.
- **Recommendation** — Update both paragraphs to the state on disk: the pair table is populated and its 27 pairs are listed by the tool; the allow-list has five entries and the check returns zero.
- **Effort** — XS

---

**CODE-10 — The blob-download helper is written twice, and both revoke the object URL synchronously after `click()`**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:2518-2528` (`downloadCorruptData`) and `:2903-2911` (`exportBackup`)
- **Evidence** — Both functions build the same five-line sequence — `new Blob` → `createObjectURL` → detached `<a>` → `a.click()` → `URL.revokeObjectURL(url)` — differing only in payload and filename. In both, `revokeObjectURL` runs on the same tick as `click()`, and the anchor is never attached to the document. `coding-standards.md` names "Avoid duplication" directly, and these are the two halves of the same recovery story: export a backup, and hand back the bytes that failed to parse.
- **Impact** — A single `downloadJSON(text, filename)` helper is the obvious shape and would let a fix to the revoke timing — which is the fragile part of this idiom across browsers — land once instead of twice. Both call sites sit on the data-recovery path, which is the one place a silently cancelled download costs the most.
- **Recommendation** — Extract `downloadJSON(text, filename)` beside `exportBackup()` and call it from both; move the revoke behind a `setTimeout(..., 0)` inside it.
- **Effort** — XS

---

**CODE-11 — `importProblem()` does not check id uniqueness, and every delete removes all matching ids**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:3045-3095` (`importProblem`); deletes at `:4137, 4529-4530, 4689, 4976, 6669, 6936`
- **Evidence** — Each per-record validator requires `typeof r.id === 'string' && r.id` and nothing more; no collection is checked for duplicate ids. Every delete is a filter on inequality — `db.income = db.income.filter(i => i.id !== b.dataset.delInc)` and five siblings — so two records sharing an id are both removed by one tap. `openEditModal()` (`:6969`) resolves with `find`, so it would edit the first and leave the second.
- **Impact** — `uid()` collisions are not a realistic route; a hand-merged or hand-edited backup is. The failure is quiet and destructive: the user deletes one row and two disappear, or edits one and the duplicate keeps the old figure. The import path is described in the source as "the only place untrusted data enters the application", and this is the one structural property of a record collection it does not check.
- **Recommendation** — One `Set` per collection inside the existing `perRecord` loop at `:3086-3093`, returning `"<key> entry N has a duplicate id"`. It reuses the loop and the message shape already there.
- **Effort** — XS

---

**CODE-12 — A quick-amount of zero is stored and rendered as a button that does nothing**

- **Severity** — Low
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:6821`
- **Evidence** — `db.settings.quickAmounts = newAmounts.map(v => v > 0 ? v : 0);` — the guard maps a non-positive value to `0` and stores it. `renderQuickAmountRow()` (`:6797-6798`) then renders `<button data-qa-set="0">₮0</button>`; tapping it sets the amount field to `0`, and the subsequent Save reports "Enter a valid amount". The import validator at `:3070` accepts `0` for the same reason (`qa[i] < 0` only).
- **Impact** — A control that is visibly present and cannot do anything. Trivial workaround (edit the row again), but it is a defect the code went out of its way to almost prevent.
- **Recommendation** — `.filter(v => v > 0)` instead of mapping to zero, and reject `0` in the import validator so the two agree.
- **Effort** — XS

---

## Review Areas

- **Correctness of money** — Amounts are integer tugrik end to end: `unmoney()` strips everything but digits, `fmt()` is the one formatter and puts the sign outside the symbol, `fmtCompact()` takes magnitude first and re-applies the sign, and every reduction uses `(+x.amount || 0)`. `niceCeil`, the percentage `toFixed` calls and the donut arithmetic are all guarded against a zero denominator. Two gaps: CODE-05 (rounding boundary) and CODE-02 (sign).
- **Dates and time zones** — Clean. `toLocalISO()` is used everywhere, `toISOString()` appears nowhere, `parseISO` splits on local components, `stepDate()` is the single recurrence engine and clamps month-end against an explicit anchor day. `computeNextRecurring()` now routes through `stepDate()`, so the two engines that produced ARCH-1 are one.
- **Data and persistence** — One store seam (`writeDb`), one schema version, append-only numbered migrations that stamp only the version reached and persist it at `:2623`, quarantine-before-write capped at one copy, whole-file import rejection built from schema defaults rather than a spread over the live `db`. Findings: CODE-03, CODE-11.
- **Offline-first** — Clean. `sw.js` is stale-while-revalidate over same-origin GETs with the revalidate inside `waitUntil()`, an `index.html` shell fallback on a cold cache miss, `allSettled` on install, cross-origin left to the browser, and no localStorage contact. The converter falls back to a stale cache and labels it as stale. Nothing in the boot path awaits the network.
- **Architecture** — The single-file, no-build monolith is a standing architectural ruling, not a finding, and I am not re-litigating it. Within that constraint, responsibilities are separated by seam rather than by file (`writeDb`/`save`/`load`, `stepDate`, `openModal`/`closeModal`, `escapeHTML`, `rememberUiPref`), and the UI does not reach past `writeDb` — the one exception, `loadFromCloud()` at `:2728-2729`, is quarantined code behind an empty config and is deferred WORK-15.
- **Maintainability** — Names are meaningful and comments record *why*. Function size is the weak spot: `analyzeExpenses()` is 330 lines of 26 inline rules and `renderDashboard()` reaches eight collaborators. Duplication is down (`stepDate`, `findByDataId`, `savedToast`, `setBannerText`, one icon-grid listener) but three pairs remain: the two reorder initialisers (deferred WORK-35/57), the two download helpers (CODE-10), and the two preset-application sites (CODE-06). Dead code: I found none beyond the deliberately retained `fbApp`.
- **Error handling** — Findings CODE-01, CODE-03, CODE-04. Everything else is handled and reported: every record write reports its outcome (verified mechanically and by reading all 33 sites), the import path reports each of its four failure modes separately, `rememberUiPref()` swallows only preference writes and says so, and both loop guards `console.warn` when they fire.
- **Security** — Clean. CSP is present with `object-src`/`base-uri`/`form-action`/`frame-ancestors` locked and `connect-src` narrowed; `escapeHTML` covers the five characters that matter; `check-escaping.mjs` returns zero and I spot-checked the sites it deliberately skips (`colors[key]`, `categoryColor()` output, `toFixed` percentages, `aria-pressed` booleans) — none can carry a quote. No secrets are logged; `console.error` payloads are exception objects, not user data. The only third-party dependency is the optional Firebase SDK, which does not load while the config is empty, plus dev-only ESLint.
- **Performance** — CODE-07. The per-day and per-month full scans (`renderCalendar`, `drawDailyStackedChart`, `drawMonthlyTrend`, `categoryColor`) are the standing deferred WORK-16/WORK-49 whose trigger has not fired; I am not re-raising them and present no new evidence against the deferral.
- **Reliability and scalability** — At 10,000 records the walls, in order: the render cost above (soft), then the ~5 MB localStorage quota (hard, but visible — `writeDb` raises a banner and `updateStorageStatus` shows usage), then the Firestore 1 MiB document if Cloud Sync is ever enabled (hard, and gated behind WORK-15). On a slow phone the first thing felt is CODE-07's repaint on every add.
- **Technical debt** — Below.

---

## Technical Debt

- **`load()` validates nothing.** `importProblem()` guards the import boundary only. Data already in `localStorage` from a build that predates a validator — including a `recLastDone` of `"zzz"`, which WORK-46 now rejects on import but which `nextPlannedDue()` at `:4398` still string-compares — is never re-checked. Both shipped migrations are idempotent, so nothing is broken today; the debt is that "validated" means "validated at import", and the file reads as though it means more. Overlaps CODE-11.
- **`expandPlannedInRange()` returns the stored object for the anchor occurrence** (`:4383`). Documented and deliberate so edit and delete keep working, but it means a "projection" is sometimes a live reference into `db.planned`. Any future consumer that mutates what it thinks is a copy corrupts the series.
- **The modal history stack is balanced but fragile.** `history.back()` is asynchronous while `openModal`'s `pushState` is synchronous, so a close-then-open sequence (`:3614-3615`, notification → contribute) interleaves a pending traversal with a new entry. I traced it and the counter balances on every path, but the invariant is held by a plain integer and nothing tests it.
- **`check-escaping.mjs` is line-based.** `ATTR_WITH_INTERP` matches double-quoted attributes on a single line only. No current template splits an attribute across lines, so the check is sound today; the constraint is undocumented in a file whose whole purpose is documenting its own scope. Overlaps CODE-08.
- **Cloud Sync (`:2712-2816`)** remains quarantined, unvalidated and unmigrated on the load path — standing deferral WORK-15, precondition still holding.
- **No test harness** over `stepDate`, `plannedOccurrences`, `computeNextRecurring`, `computeRange`, `calcSalary`, `unmoney`/`unnum`. Stage 2's trigger has still not fired — CODE-02 is an input-validation gap, not a calculation defect, and a unit test would not have caught it either.

---

## Future Risks

1. **The predicates are now the project's memory, and two of them describe themselves inaccurately** (CODE-08, CODE-09). The failure mode this project keeps hitting is a true-sounding claim nobody re-derives. It has moved from comments into tools, which is progress, but the same discipline has to apply to the tools' own headers.
2. **Growth pressure lands on `renderDashboard` first**, not on the Analytics loops the deferral names — because it runs thirteen times more often than it needs to (CODE-07). When the 5,000-record trigger fires, the deferred indexing pass will be measured against a baseline that includes twelve wasted repaints.
3. **`analyzeExpenses` is where the roadmap's AI Budget Assistant will want to live**, and it is a 330-line function of inline rules with no seam to attach to. Every new rule makes the extraction more expensive and the Dashboard render slower.
4. **Reports, Debt Planner and Investment Tracker** all need a second read model over the same collections. Today every consumer re-derives its own filter/expand pipeline from `db` directly; the fifth such consumer is where the seven-consumer hand-audit recorded in `VERIFICATION.md` §1 stops being affordable.
5. **A seventeenth theme is now safe** — `check-contrast.mjs` covers it by construction, and this is the clearest example in the codebase of a class being genuinely closed rather than asserted closed.

---

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **Guard `reportFatal()` on `dataWasCorrupt`** (CODE-01). One line, and it restores the truthfulness of the app's most consequential message. Do it with CODE-04's `try` in the same pass, since that is the most likely trigger.
2. **Clamp the salary inputs inside `calcSalary`'s `g()` and round its return object** (CODE-02, CODE-05). One helper each, both at the boundary, and they close the last two "correctness of money" gaps in the file.
3. **Add `r.onerror` to the import handler** (CODE-03). Two lines on the recovery path.
4. **Widen `BARE_SAVE` to detect a discarded call rather than a semicolon, and correct `VERIFICATION.md` §6** (CODE-08, CODE-09). The guard and the document that describes it, together, before either drifts further.
5. **Extend the `#dashboard.active` guard to the whole of `renderDashboard()`** (CODE-07). One early return; it removes thirteen redundant full renders and is the cheapest thing available against the deferred performance class without reopening it.
6. **Extract the two small duplicates that remain reachable** — `downloadJSON()` (CODE-10) and the "apply a preset and persist it" body shared by `revealEntryDate` and the `data-show-all` handler (CODE-06). Both are XS, and both are places where one of two copies is already right and the other is not.

Nothing here needs a rewrite, a new dependency, or a change to the single-file constraint.
