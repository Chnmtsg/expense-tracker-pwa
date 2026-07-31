# Code Review — Expense Tracker PWA

## Executive Summary

The persistence layer is the strongest part of this codebase: writes are single-blob and therefore atomic, corrupt data is quarantined before anything can overwrite it, migrations are numbered and version-stamped, and import validation checks every record rather than just the containers. The recurring-planned-expense model has been genuinely fixed — `p.date` is an immutable anchor, occurrences are derived, the monthly clamp is correct, and every consumer named in `VERIFICATION.md` does what that document claims. Against that, two defects block release: an undeclared variable throws a `ReferenceError` on **every** income and expense edit, and record `id` values reach the DOM unescaped in nine places, which turns the import feature into a stored-XSS vector. The single biggest risk is `index.html:6246` — the edit path is a core flow, it fails on every use, and the failure surfaces as a banner telling the user their saved data could not be read, which is false and will drive people to "restore" over good data.

## Overall Score

**60 / 100**

Two Critical defects block release today — one breaks a core flow on every use, one is a script-execution hole — and one High defect leaves a known, already-fixed date bug live in a second module; the score is not lower because the data layer beneath them is well designed and both Critical fixes are small and contained.

---

## Findings

### Critical

**CODE-01 — `okSave` is never declared, so every income and expense edit throws**

- **Severity** Critical
- **Location** `D:\3_Claude\PowerApps\expense-pwa\index.html:6246` and `:6249`
- **Evidence** The script opens with `"use strict";` (line 1900). Line 6246 reads `okSave = save(); renderExpenses(); renderDashboard(); updateBellBadge();` and line 6249 reads `savedToast(okSave, 'Updated');`. `okSave` is declared nowhere in the file — a grep for the identifier returns only these two lines. Under strict mode an assignment to an undeclared identifier throws `ReferenceError`. On the **expense** branch the throw happens at 6246 *after* `save()` has run but *before* `renderExpenses()`, `renderDashboard()`, `updateBellBadge()` and `closeEditModal()`. On the **income** branch (line 6202) the save and renders complete and the throw lands at 6249. Either way the exception reaches `window.addEventListener('error', ...)` at line 6303, which calls `reportFatal()` and shows `#dataErrorBanner` — whose static markup reads *"Your saved data could not be read. The app has started empty."* (lines 1291-1292).
- **Impact** Editing an expense leaves the modal open, the list stale, and the user with a banner saying their data could not be read — while the change was in fact written. The rational user response to that banner is to restore a backup, which discards subsequent good edits. Every edit in the app is affected. This alone makes the build unreleasable.
- **Recommendation** Declare it: change line 6246 to `const okSave = save();` and move the `savedToast(okSave, 'Updated')` call inside a scope that can see it, or hoist `let okSave = true;` above the `if (editCtx.kind === 'income')` branch at line 6194 so both branches assign it.
- **Effort** XS

**CODE-02 — Record `id` values are interpolated into markup unescaped, giving stored XSS through import**

- **Severity** Critical
- **Location** `index.html:3650`, `:3654`, `:3850`, `:3853`, `:3854`, `:3862`, `:3863`, `:4123`, `:6044`
- **Evidence** Nine template sites interpolate an id straight into an attribute with no `escapeHTML()`, while the sibling fields on the same line are escaped. The clearest is `renderIncomeTypeList()` at line 3862:
  ```js
  &lt;div class="list-item draggable-row"&gt;
    &lt;div&gt;&lt;b&gt;${escapeHTML(t.name)}&lt;/b&gt;&lt;/div&gt;
    &lt;div class="actions"&gt;
      &lt;button title="Edit"   aria-label="Edit"   data-edit-itype="${t.id}"&gt;✎&lt;/button&gt;
  ```
  This block is assigned via `el.innerHTML` on `#incomeTypeList` (line 3867), which parses as normal flow content. The import validator's `namedProblem()` (line 2462) only requires `typeof r.id === 'string' &amp;&amp; r.id` — it never constrains the characters. An imported backup containing `{"id": "\"&gt;&lt;img src=x onerror=…&gt;", "name": "x"}` in `incomeTypes` therefore executes script the moment the Settings screen renders, with no further user action. Line 4123 (`data-edit-name="${c.id}"`) is the same defect in `renderCategoryList()`. The CSP at line 17 includes `script-src 'unsafe-inline'` and its own comment states "CSP does NOT stop an injected inline event handler — escaping every interpolation is what stops that" — the intended defence is exactly the one that is missing here.
- **Impact** Arbitrary script in the app origin: full read of `localStorage` (the user's entire financial history), the ability to rewrite or wipe it, and — once Cloud Sync is configured — exfiltration. Backup/restore is a first-class documented recovery path, and a shared or tampered backup file is a realistic delivery vector.
- **Recommendation** Wrap every one of the nine sites in `escapeHTML(...)`, matching what lines 3733, 4127-4128 and 5075 already do. Optionally add an `id` character check to `entryProblem()`/`namedProblem()` as a second layer, but escaping is the fix.
- **Effort** S

---

### High

**CODE-03 — A second recurrence engine still carries the monthly overflow bug that was fixed for planned expenses**

- **Severity** High
- **Location** `index.html:2843` (inside `computeNextRecurring`, lines 2833-2860)
- **Evidence** `stepDate()` (lines 3504-3525) documents and fixes the `setMonth()` overflow, clamping to the last day of a short month. `computeNextRecurring()`, which drives goal auto-contributions, still contains the unfixed form:
  ```js
  case 'monthly': next.setMonth(next.getMonth() + 1); break;
  ```
  With `recStartDate` or `recLastLogged` of `2026-01-31`, `setMonth(+1)` produces 31 February, which JavaScript normalises to `2026-03-03`. February is skipped entirely and the schedule then sits on the 3rd permanently, because line 6179 writes `g.recLastLogged = nextDue` and the next walk starts from that drifted date. `computeNextRecurring` feeds the bell badge (`computeReminders`, line 2925), the goal card's next-due label (line 5693), and the "✓ Add ₮N" button at line 3026 that writes a `goalContributions` record dated on the wrong day.
- **Impact** Users saving a fixed amount on the last day of the month — the most common payday anchor — silently lose one contribution reminder and then have every subsequent one land on the wrong date, permanently. This is the same defect the team already classified as ARCH-1 and fixed once; it is still live in a second module. It is also the concrete cost of having two recurrence implementations.
- **Recommendation** Replace the `switch` inside `computeNextRecurring`'s `step()` with a call to `stepDate(toLocalISO(next), r.frequency, r.intervalDays, parseISO(r.startDate).getDate())`. One definition of a recurrence step, as the comment above `stepDate` already claims.
- **Effort** S

---

### Medium

**CODE-04 — Occurrence walks truncate silently at 5,000 iterations**

- **Severity** Medium
- **Location** `index.html:3569` (`plannedOccurrences`), `:3587` (`hasPlannedOccurrence`)
- **Evidence** Both loops are bounded by `while (guard++ &lt; 5000)` and walk forward from the anchor. `plannedHorizon()` (line 3545) sets the open-ended end date to one year past *the newest actual expense*, not past today: `db.actual.forEach(x =&gt; { if (x.date &amp;&amp; x.date &gt; last) last = x.date; })`. A single mistyped actual dated 2099 pushes the horizon to 2100, at which point a daily plan exceeds 5,000 steps. `plannedOccurrences` then returns a truncated list and `hasPlannedOccurrence` returns `false` — so the plan disappears from the Expenses list entirely, and the Dashboard and Daily totals are understated. Nothing logs, warns, or marks the result as partial.
- **Impact** A wrong Planned figure and a vanished plan, with no signal that anything was cut off. The user has no way to attribute the missing money to a typo in an unrelated record.
- **Recommendation** Ignore future-dated actuals when computing the horizon (`if (x.date &gt; last &amp;&amp; x.date &lt;= todayISO()) last = x.date;`), and return a flag or log a `console.warn` when the guard fires so truncation is not silent.
- **Effort** S

**CODE-05 — "All Time" silently adds a 12-month projection the user never asked for**

- **Severity** Medium
- **Location** `index.html:3545-3553` (`plannedHorizon`, `boundedEnd`), consumed at `:4643` (`renderDashboard`) and `:4945` (`renderDailyStats`)
- **Evidence** `computeRange('all')` returns `{ from: '', to: '' }` (line 2720). `renderDashboard` passes `to || OPEN_END` into `expandPlannedInRange`, and `boundedEnd` converts `OPEN_END` into `plannedHorizon()` — today plus one year. The header sub-label at line 4633 reads `'All time'`. So on the All Time range the Planned total is *past occurrences plus twelve months of future projections*, while the Actual total on the same row is past-only. Because the horizon is anchored on today, the same database produces a different All Time Planned total every day.
- **Impact** The Planned vs Actual card and the "Planned Left" tile compare unlike quantities on All Time, and the headline figure is not reproducible day to day. `VERIFICATION.md` §5 asserts "F3 yields 22 occurrences" — that assertion is itself a function of the run date, so the gate check cannot be re-run to the same expected value.
- **Recommendation** Label it. Either clamp the All Time planned expansion to `todayISO()` so Planned and Actual cover the same window, or keep the horizon and change the header sub-label to name it (e.g. `All time → &lt;horizon&gt;`). The first is smaller and makes the comparison honest.
- **Effort** S

**CODE-06 — Cloud load bypasses validation, defaults and migrations**

- **Severity** Medium
- **Location** `index.html:2287-2288`
- **Evidence** `loadFromCloud()` does:
  ```js
  db = JSON.parse(cloudDbJson);
  localStorage.setItem(KEY, cloudDbJson);
  ```
  It does not call `importProblem()`, does not go through `load()` (so no `normalizeGroup`, no default `settings.notifications`, no default collections) and does not call `migrate()`. A cloud document written by an older build keeps its old `schemaVersion` and is never upgraded; a document missing `goals` makes `renderGoals()` throw at line 5668. The write to `localStorage` is also raw rather than via `writeDb()`, so a quota failure here is unhandled — unlike every other write path in the file.
- **Impact** Dormant today: `firebaseConfig` is empty (line 2196) and `isFirebaseConfigured()` gates everything. The moment Cloud Sync is turned on — an explicit item in `knowledge/project.md`'s long-term vision — this becomes a data-loss path, because the unvalidated blob is persisted to the only local copy before any render can reject it.
- **Recommendation** Route the cloud payload through the same gate the file import uses: `importProblem(parsed)` → reject with `alertDialog`, then `writeDb(replacement)` → `db = load()`. That reuses code that already exists at lines 4189-4229.
- **Effort** S

**CODE-07 — The Daily screen re-scans the whole transaction list once per day cell**

- **Severity** Medium
- **Location** `index.html:5116` (`drawDailyStackedChart`), `:5000-5002` (`renderCalendar`), `:4931-4938` (`renderDaily`)
- **Evidence** In actual mode `drawDailyStackedChart` sets `source = baseSource` (the whole of `db.actual`, line 5087-5110) and then, inside a per-day loop capped at 90 days, runs `source.filter(x =&gt; x.date === iso &amp;&amp; ...)` (line 5116). `renderCalendar` does the same over up to 31 days at line 5000. `renderDaily()` (lines 4931-4938) calls five renderers in sequence, and every chip tap, mode toggle and calendar-cell tap calls `renderDaily()` again (lines 4907, 4928, 5037, 5082, 5179). At 10,000 actual expenses that is roughly 900,000 comparisons for the chart plus 310,000 for the calendar, per interaction.
- **Impact** The Daily screen becomes visibly unresponsive as history grows, and it degrades on exactly the low-end mobile devices `knowledge/project.md` targets. Nothing is wrong today at a few hundred records; this is the first thing that breaks with scale.
- **Recommendation** Build one `Map` from date → entries at the top of each renderer and index into it inside the loop, instead of filtering the array per day. Same for `renderCalendar`.
- **Effort** M

**CODE-08 — Every save re-serialises and synchronously writes the entire database**

- **Severity** Medium
- **Location** `index.html:2400` (`writeDb`), called from `save()` at `:2412`
- **Evidence** `localStorage.setItem(KEY, JSON.stringify(obj))` writes the whole object on every mutation — including a category reorder drag (line 3956), a theme swatch tap (line 3246) and a notification-preference checkbox (line 4093). `localStorage` is synchronous and main-thread. `updateStorageStatus` (line 2584) already measures the blob: `(localStorage.getItem(KEY) || '').length`.
- **Impact** At 10,000 transactions the blob is on the order of 1-1.5 MB; serialising and writing it blocks the main thread on every single change, and the practical `localStorage` ceiling of ~5 MB caps the application at roughly 30-40k records. Quota exhaustion is handled honestly (the save-error banner) but is not recoverable — the user can only export and stop.
- **Recommendation** Not a rewrite. Keep `localStorage` as the store, but debounce `save()` for high-frequency, low-value mutations (reorder, theme, notification prefs) so a drag writes once on drop rather than per change. Record IndexedDB as the migration target in the roadmap rather than doing it now.
- **Effort** L

**CODE-09 — The service worker is network-first for the app shell, which contradicts offline-first**

- **Severity** Medium
- **Location** `D:\3_Claude\PowerApps\expense-pwa\sw.js:40-53`
- **Evidence** The `fetch` handler calls `fetch(e.request)` first for every GET and only falls back to `caches.match` in `.catch()`. There is no timeout. `knowledge/project.md` lists "Fast" and "Offline-first" as project principles; the comment in `sw.js:36-39` states the trade explicitly ("try the network so GitHub Pages updates are picked up instantly").
- **Impact** On a slow or half-connected mobile network the user waits for the network round trip to fail before the cached shell is served. `fetch` does not reject quickly on a stalled connection, so first paint can hang for tens of seconds — the worst case on exactly the devices and networks the project targets. Fully offline is fine; degraded connectivity is not.
- **Recommendation** Switch the navigation/shell requests to stale-while-revalidate: respond from cache immediately, fetch in the background, update the cache. Keep network-first for anything else if desired. No library needed.
- **Effort** S

**CODE-10 — `recIntervalDays` accepts negative values from the UI and from import**

- **Severity** Medium
- **Location** `index.html:1536` (`&lt;input type="text" id="expRecInterval"&gt;`), `:3670`, `:6217`, and `importProblem` at `:2504-2554`
- **Evidence** The custom-interval field is `type="text"` with `inputmode="numeric"`, which is a hint, not a constraint. Both the add path (line 3670) and the edit path (line 6217) do `parseInt(value, 10) || 14`, so `0` and `NaN` fall back to 14 but `-5` passes straight through. `stepDate` then does `d.setDate(d.getDate() + (intervalDays || 14))` (line 3521) and the series walks *backwards*. In `plannedOccurrences` the `if (iso &gt; endISO) break` exit is never reached, so the loop runs to the 5,000 guard on every call. `importProblem` does not validate `recFrequency`, `recIntervalDays`, `recEndDate` or `recLastDone` at all — `entryProblem` (line 2450) checks only `id`, `date`, `amount` and `categoryId`.
- **Impact** A plan that produces no occurrences in any forward range, burns 5,000 iterations per render pass, and cannot be diagnosed from the UI. Reachable by typing a minus sign.
- **Recommendation** Clamp at both entry points: `Math.max(1, parseInt(v, 10) || 14)`, and add a `recIntervalDays`/`recFrequency` check to `entryProblem` for the `planned` collection.
- **Effort** XS

---

### Low

**CODE-11 — `_virtual` and `_seriesId` are written but never read**

- **Severity** Low
- **Location** `index.html:3609`
- **Evidence** `expandPlannedInRange` tags projections with `_virtual: true, _seriesId: p.id`. A search for both identifiers finds only this line and the migration that strips them (line 1975). Nothing consumes either field.
- **Impact** Dead data on every projected occurrence, and a migration step maintained for a field that has no reader — future maintainers will assume the tag is load-bearing.
- **Recommendation** Either remove both fields (and leave `toV2` as-is, since it must stay for files already in the wild) or use `_virtual` in the delete/edit handlers to reject actions on a projection.
- **Effort** XS

**CODE-12 — Two near-identical drag-to-reorder implementations**

- **Severity** Low
- **Location** `index.html:3795-3840` (`initIncomeTypeReorder`) vs `:3908-3964` (`initCategoryReorder`)
- **Evidence** The two functions are the same 45-line pointer-drag algorithm — same threshold of 5px, same `itemHeight` derivation, same `Math.round(dy / itemHeight)` slot maths, same `splice` swap — differing only in the container id, the guard variable (`editingITypeId` vs `editingCatId`) and the target array. `knowledge/coding-standards.md` states "Avoid duplication" and "Prefer reusable modules".
- **Impact** A fix or accessibility improvement to one will not reach the other. There is already a divergence: the category version has a comment explaining the edit-mode index guard, the income-type version has a one-line reference to it.
- **Recommendation** Extract `initReorder(containerEl, getList, isEditing, onReorder)` and call it twice.
- **Effort** S

**CODE-13 — `wireIconGrid` leaks a document-level listener on every goal edit**

- **Severity** Low
- **Location** `index.html:5785-5789`, called from `:5941`
- **Evidence** `wireIconGrid` ends with `document.addEventListener('click', (e) =&gt; {...}, true)` and is called once at module load (line 5791) and again on **every** `openGoalEditModal()` (line 5941). Nothing removes the previous listener, and each closure captures a `grid` element that was replaced when `#editModalBody.innerHTML` was reassigned.
- **Impact** One capturing document click handler accumulates per goal edit opened, each holding a detached DOM node. Not user-visible in a short session; it grows without bound in a long-lived installed PWA.
- **Recommendation** Attach the outside-click handler once, keyed off `document.querySelector('.icon-grid.open')`, rather than per `wireIconGrid` call.
- **Effort** XS

**CODE-14 — Salary-derived income is stored unrounded while every other amount is an integer**

- **Severity** Low
- **Location** `index.html:3328` (`calcSalary`), `:3378` (`db.income.push({ ..., amount: r.net, ... })`)
- **Evidence** Hours fields are read with `unnum()` (line 2664), which keeps decimals, so `normalPay = rate * 7.5` and `net = gross - si - wht` are floats. Every other amount in the database comes from `unmoney()` (line 2662), which strips non-digits and is always an integer. `fmt()` rounds at display only.
- **Impact** A stored salary income of `1,234,567.89` displays as `₮1,234,568`; a list of such rows can display individual figures that do not sum to the displayed total. The drift is cosmetic at MNT scale, but the rounding rule is applied at the display boundary only, so the stored and shown values disagree for one collection.
- **Recommendation** `Math.round()` the derived salary figures before pushing them into `db.income` and `db.salaries`, so rounding happens once, at the write boundary.
- **Effort** XS

**CODE-15 — `save()`'s return value is checked on some paths and ignored on others**

- **Severity** Low
- **Location** `index.html:3438`, `:3749`, `:3833`, `:3956`, `:4031`, `:4093`, `:5746`, `:6005`, `:6202`
- **Evidence** The file establishes a clear contract at line 2410 — *"Callers that report success to the user should check the return value"* — and honours it in the add paths via `savedToast(ok, ...)`. Every delete, every reorder, the theme picker and the notification preferences call bare `save()` and then report success (or nothing) regardless.
- **Impact** Contained, because `writeDb` raises the persistent save-error banner on failure so the user does learn. But a delete that did not persist reports nothing at the point of action, and the entry silently returns on reload.
- **Recommendation** Use the existing `savedToast(save(), '…')` pattern on the delete paths at minimum.
- **Effort** XS

**CODE-16 — Unguarded `localStorage.setItem` for converter preferences surfaces as a data-corruption banner**

- **Severity** Low
- **Location** `index.html:5337`, `:5344`, `:5350-5351`
- **Evidence** `localStorage.setItem('conv-last-from', code)` and friends are called bare inside click handlers. Everywhere else in the file such writes are guarded — `saveFilterState` wraps in `try/catch` (line 2737), `writeDb` catches and reports (line 2401), `quarantineCorruptData` catches (line 2063). In Safari private browsing `setItem` throws unconditionally; the throw escapes to `window.onerror` and shows `#dataErrorBanner`, whose text is *"Your saved data could not be read. The app has started empty."*
- **Impact** Picking a currency in private browsing tells the user their financial data is unreadable. False alarm on the most alarming banner in the app.
- **Recommendation** Wrap the three writes in `try {} catch {}` like `saveFilterState` does.
- **Effort** XS

**CODE-17 — A goal with a frequency but no amount renders "₮NaN"**

- **Severity** Low
- **Location** `index.html:5697`, validator at `:2471-2479`
- **Evidence** `renderGoals` builds the recurring meta chip with `fmtCompact(g.recAmount)`. `fmtCompact` (line 2635) does `Math.round(+n || 0)` — `+undefined` is `NaN`, `NaN || 0` is `0`… but `Math.abs(NaN)` short-circuits nothing: for `n = null` it yields `0` correctly, while for `n = "abc"` (a string amount from a hand-edited or third-party backup) it yields `NaN`, and the final `'₮' + a.toLocaleString('en-US')` renders `₮NaN`. `goalProblem()` validates `id`, `name`, `target`, `deadline` and `recStartDate` but never `recFrequency`, `recAmount` or `recIntervalDays`.
- **Impact** A visibly broken figure on a finance screen, from a file the validator accepted.
- **Recommendation** Add `recAmount` and `recFrequency` checks to `goalProblem()` when `recFrequency` is present.
- **Effort** XS

**CODE-18 — The "Planned Left" tile does not compute what its label says**

- **Severity** Low
- **Location** `index.html:1362` (label) vs `:4672` (`const plannedNet = totalIncome - totalPlanned;`)
- **Evidence** The tile is labelled *Planned Left* but holds income minus planned spend — i.e. what would remain after the plan, not how much of the plan remains unspent. The neighbouring tiles ("Income", "Expenses") are literal.
- **Impact** For the stated audience — "people with little accounting knowledge" (`knowledge/project.md`) — the tile reads as "how much of my budget is unspent", which is a different and more useful number the app also has (`totalPlanned - actual-against-plan`).
- **Recommendation** Rename the label to match the computation (e.g. "Left After Plan"). A UI decision, flagged here because the mismatch is between markup and arithmetic.
- **Effort** XS

---

## Clean Areas

- **Atomicity** — clean. Every write goes through `writeDb` as a single `JSON.stringify` of the whole object, so no failure can leave data half-updated.
- **Dates and time zones** — clean. `toLocalISO`/`parseISO` (lines 2657-2659) are used everywhere; there is no `toISOString()` anywhere in the file, and the comment at line 2655 states the reason.
- **NaN / Infinity / sign safety in money maths** — clean. `unmoney`/`unnum` coerce to `0`, `fmt`/`fmtCompact` handle sign outside the symbol, and every division I traced is guarded (`drawDonut` line 4703, `drawPvA` line 4746 `Math.max(1, …)`, `renderDailyStats` line 4953, the advisor rules at 4289/4317/4407).
- **Schema versioning and migrations** — clean. `SCHEMA_VERSION`, numbered append-only `migrations[]`, per-step `try/catch` that stops without stamping a failed step, a newer-version bail-out (line 1983), and the upgrade persisted immediately (line 2182).
- **Corrupt-data handling** — clean. Raw bytes are quarantined before any write, `writeDb` refuses when quarantine failed, and the user gets both a download of the damaged file and a restore path.
- **Modal accessibility and focus management** — clean. `openModal`/`closeModal` with a stack, focus trap, Escape routed through the dismiss control, and focus restoration (lines 3084-3138).
- **Import container validation** — clean for the checks it performs; the per-record functions and the `quickAmounts` check (lines 2521-2533) are well reasoned. The gaps are recorded as CODE-02, CODE-10 and CODE-17.

---

## Technical Debt

**Two recurrence engines.** `stepDate`/`plannedOccurrences`/`nextPlannedDue`/`upcomingPlannedDates` (lines 3504-3647) and `computeNextRecurring` (lines 2833-2860) implement the same concept twice. CODE-03 is the first drift, and it is a wrong-date defect. Every future recurrence feature — the Debt Planner and Savings Planner in `knowledge/project.md` — will have to choose one or reimplement a third.

**No module boundary.** The script declares roughly 34 mutable module-level variables (`db`, `expMode`, `dailyMode`, `dailyExcluded`, `dailySelectedDate`, `calDate`, `editCtx`, `editingCatId`, `editingITypeId`, `currentRates`, `convFromCurr`, `dpCallback`, `saveFailed`, `dataWasCorrupt`, …), directly against `knowledge/coding-standards.md`'s "Avoid global variables" and "Prefer reusable modules". More consequentially, the render layer reads its own inputs from the DOM: `renderDashboard()` (line 4632) starts with `getRange('dash')`, which reads `document.getElementById('dashFrom').value` (line 2726). Filter state lives in input elements, not in a state object, so no calculation can be exercised without a DOM. This is what made the CODE-01 class of defect possible and what makes the cross-screen agreement check in `VERIFICATION.md` a manual procedure rather than an assertion.

**Duplication that will drift** — CODE-12 (two reorder implementations), `plannedOccurrences` and `hasPlannedOccurrence` (lines 3557-3596) carrying the same walk twice, and `isoDate` at line 2708 as a second name for `toLocalISO`. Also 154 inline `style="…"` attributes against "Use reusable classes. Avoid duplicated styles", including literal repeats such as `class="helper" style="text-align:right;margin-top:8px"` at lines 4784 and 5229.

**Cloud sync is half-built** — CODE-06. `syncToCloud` swallows its error (line 2322-2323: `console.error(e)` and nothing else), the model is last-write-wins over a whole-document blob, and the load path has no validation. It is correctly hidden behind an empty config, but it is shipped code that a maintainer may reasonably assume is finished.

**`VERIFICATION.md` as an artifact** — its expected values are asserted against a horizon that moves with the calendar (see CODE-05), so §5's "F3 yields 22 occurrences" cannot be re-verified after the run date. The consumer inventory in §1 is accurate against the code as it stands; I re-checked A2 (line 4643), A3 (line 4926), A4 (line 4945), A5 (line 4993), A6 (line 5056), A7 (line 5109) and A8 (line 5194) and all seven use the derived-occurrence path, and the ARCH-1 clamp at lines 3509-3520 is correct. The document's claims hold; its reproducibility does not.

---

## Future Risks

- **At 10,000 transactions** the Daily screen (CODE-07) becomes the bottleneck first — roughly 1.2M array comparisons per interaction — and the synchronous whole-blob write (CODE-08) makes every mutation janky. The hard ceiling is `localStorage`'s ~5 MB, reached somewhere around 30-40k records, at which point the save-error banner appears and the only exit is export.
- **On a slow mobile device**, the network-first service worker (CODE-09) delays first paint before any of the above matters.
- **The first non-idempotent migration** will be safe, because `load()` now persists the version stamp (line 2182) — but only for data arriving through `load()`. Data arriving from the cloud (CODE-06) never migrates, so the first cloud-enabled release will have two populations of databases at different schema versions.
- **Cloud Sync, the AI Budget Assistant and the OCR Receipt Scanner** all imply larger payloads and untrusted input. CODE-02 and CODE-06 are the two places where untrusted input already reaches the DOM and the store without a gate; both must be closed before any of those features lands.
- **Every new screen that reads `db.planned`** has to remember to expand occurrences. There are eight such consumers today and the inventory was built by hand. A ninth added without that knowledge reproduces the original Critical.

---

## Recommended Refactoring

The smallest set of changes that removes the most risk, in order:

1. **Declare `okSave`** (CODE-01). One line. Unblocks the edit flow and stops the false data-corruption banner.
2. **Escape the nine `id` interpolations** (CODE-02). Mechanical, matches the pattern already used everywhere else in the file, closes the script-execution hole.
3. **Make `computeNextRecurring` call `stepDate`** (CODE-03). Removes the second recurrence engine and the ARCH-1 regression with it — one defect fixed and one class of future drift eliminated in the same edit.
4. **Route the cloud load through `importProblem` → `writeDb` → `load()`** (CODE-06). Reuses lines 4189-4229 verbatim; turns the dormant data-loss path into the same guarded path the file import already uses.
5. **Index by date instead of filtering per day** in `drawDailyStackedChart` and `renderCalendar` (CODE-07). Two `Map` builds; removes the quadratic growth without touching the data model.
6. **Clamp the All Time planned expansion to today, or label the horizon** (CODE-05). Makes the Dashboard's Planned vs Actual comparison honest and makes the `VERIFICATION.md` assertions reproducible.

Items 1-3 are the release gate. Items 4-6 should land before the next feature.
