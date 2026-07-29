# Code Review — expense-pwa

## Executive Summary

This is a carefully built single-file PWA with a genuinely strong persistence core: corrupt data is quarantined before anything can overwrite it, `save()` reports failure through a persistent banner, dates are handled in local components throughout, and there is a numbered, append-only migration chain. That care has not been applied evenly. The recurring-planned-expense model was rebuilt around an immutable anchor plus derived occurrences, but the Dashboard — the app's headline screen — still filters `db.planned` by the raw anchor date, so a monthly plan reports Planned ₮0 in every period after the one it was created in while the Expenses and Daily screens show it correctly. The single biggest risk is that the application presents two different, contradictory planned figures for the same data and the wrong one is on the screen users see first. Alongside that, import validation checks five of nine collections, which leaves both a stored-XSS vector and a boot-crash path open through a restored backup file.

## Overall Score

**54 / 100** — Significant rework needed before release.

The data layer, migration chain and failure-reporting are above the standard of most apps this size, but four Critical findings (two producing wrong financial figures, one a security hole, one rendering the app unusable after an import) sit directly on the paths the project's own references call out as most important.

---

## Findings

### Critical

**CODE-01 — Dashboard ignores every recurring occurrence except the anchor**

- Severity: Critical
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:4265`, consumed at `:4304` and `:4307`
- Evidence: `renderDashboard()` builds its planned set with `const planned = db.planned.filter(x =&gt; inRange(x.date, from, to));`. Every other consumer of planned data expands the series first — `renderExpenses()` uses `hasPlannedOccurrence()` (`:3371`), and the four Daily renderers use `expandPlannedInRange()` (`:4556`, `:4604`, `:4664`, `:4715`). A plan anchored 2026-01-05 with `recFrequency: 'monthly'` therefore contributes to the Dashboard only in January. Viewing March: the "Planned Left" KPI (`:4285-4293`) computes `totalIncome - 0`, "Planned vs Actual" (`drawPvA`, `:4347`) renders Planned ₮0 against the real actual and reports "over by" the full amount, and the advisor's per-category budget rule (`:3962-3970`) and "unplanned category" rule (`:4097-4104`) both fire on data that is in fact planned.
- Impact: The first screen the user sees reports wrong planned figures and wrong over/under-budget verdicts for every period after a recurring plan's anchor month. The Expenses screen simultaneously shows the same plan as active, so the app contradicts itself. This is the exact failure the recurring rework documented at `:3201-3216` set out to fix, left un-fixed in one place.
- Recommendation: Replace line 4265 with `const planned = expandPlannedInRange(db.planned, from || '0000-00-00', to || '9999-99-99');` (applying the CODE-02 clamp), so the Dashboard consumes the same derived series as every other screen.
- Effort: S

**CODE-02 — Unbounded date ranges project recurring plans 5,000 occurrences into the future**

- Severity: Critical
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3234-3253` (`plannedOccurrences`), called with an open end bound at `:4556`, `:4664`
- Evidence: `plannedOccurrences()` terminates on `iso &gt; endISO`, `p.recEndDate`, or `guard++ &lt; 5000`. The Daily screen passes `to || '9999-99-99'` as `endISO`. With the "All Time" preset selected (a first-class option in `PRESETS`, `:2537`) in Planned mode, a plan with no `recEndDate` hits none of the real stop conditions and emits the full 5,000 occurrences. `renderDailyStats()` then sums them (`:4560`) and `renderDailyChips()` sums them per category (`:4669`).
- Impact: The Daily screen's "Total", "Daily avg", "Days logged" and category chips report a number that is a function of the guard constant, not of the user's plan — a monthly plan reports 416 years of future spend as a current total. The in-code note at `:3242` frames the unbounded case as a render-cost issue only; the arithmetic consequence is not acknowledged.
- Recommendation: Clamp the projection horizon in one place — when `endISO` is the open sentinel, substitute a bounded horizon (e.g. the later of today and the last stored actual, plus one year) before walking the series. One change in `plannedOccurrences()` fixes every caller.
- Effort: S

**CODE-03 — Stored XSS: unvalidated record fields interpolated unescaped into HTML attributes**

- Severity: Critical
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:5513`, `:5515`, `:5532`, `:5535`, `:5537`, `:5667`, `:5670`
- Evidence: `openGoalEditModal()` and `openEditModal()` build their bodies with `innerHTML` and interpolate raw values into attributes: `value="${g.target}"`, `value="${g.deadline || ''}"`, `value="${g.recIntervalDays || 14}"`, `value="${g.recAmount || ''}"`, `value="${g.recStartDate || ''}"`, `value="${item.recIntervalDays || 14}"`, `value="${item.recEndDate || ''}"`. Adjacent fields in the same templates *are* escaped (`:5504`, `:5508`, `:5517`), so the omission is inconsistent rather than deliberate. None of these fields is validated on import: `importProblem()` (`:2365`) checks only `id`, `date`, `amount` and the foreign key on entry records (`entryProblem`, `:2342`) and does not inspect `goals` contents at all (`:2374-2377`). A backup file containing `"recEndDate": "\" onfocus=alert(1) autofocus x=\""` passes validation, is persisted, and executes when the user opens that entry's edit modal.
- Impact: A security hole. Attacker-supplied script runs with full access to the user's complete financial history in `localStorage`, and to `exportBackup()`. Delivery requires the user to restore a file, which is a normal, encouraged action (`:1653-1656`).
- Recommendation: Wrap all seven interpolations in `escapeHTML(...)`, matching the sibling fields in the same templates. As defence in depth, add a `Content-Security-Policy` meta tag; the app has no inline event handlers and no runtime third-party script on the default path, so a strict policy costs nothing.
- Effort: XS

**CODE-04 — Import validates five of nine collections; a structurally-valid file can make the app unbootable**

- Severity: Critical
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2365-2397`; crash sites at `:5454` and `:3646`
- Evidence: `importProblem()` checks record shape only for `income`, `planned`, `actual`, `categories` and `incomeTypes`. `salaries`, `goals` and `goalContributions` are checked only for being arrays (`:2374-2377`), and `settings` only for being a non-array object (`:2378-2381`). Two consequences are reachable: (a) `renderQuickAmountRow()` does `const amounts = db.settings.quickAmounts || [...]` then `amounts.map(...)` — a truthy non-array `quickAmounts` throws a `TypeError`; this runs from `renderAllQuickAmountRows()` at init line `:5877`, before `updateBellBadge()`, `calcSalary()` and `renderDashboard()`, so the rest of boot never executes. (b) `openSalaryHistory()` sorts with `b.date.localeCompare(a.date)` — a salary record without `date` throws. In both cases the bad file has already been written to `localStorage` (`:3857`) before the crash, so the failure repeats on every subsequent launch.
- Impact: The app becomes unusable and self-recovery is impossible from inside the app — the Settings screen that holds Reset and Restore is one of the screens that never renders. The user must clear site data, which destroys their history.
- Recommendation: Extend `importProblem()` with the two record shapes that are missing — a `goal`/`contribution` check mirroring `entryProblem()`, and a `salaries` check requiring `id` and an ISO `date` — and validate `settings.quickAmounts` as an array of finite non-negative numbers. Keep the existing whole-file-reject semantics.
- Effort: S

### High

**CODE-05 — `save()` failure is invisible at the point of action; every one of its 31 callers ignores the result**

- Severity: High
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2294-2313`; call sites at `:2841`, `:3100`, `:3118`, `:3345`, `:3416`, `:5416`, `:5782`, `:5839` and 23 others
- Evidence: `save()`'s own contract comment reads "Returns true when the write actually reached localStorage. Callers that report success to the user should check it." No call site does. `expAdd` (`:3345`) runs `save();` and then unconditionally `toast('Actual expense added')`. Worse, `save()` returns `false` immediately without any signal when `corruptQuarantineFailed` is set (`:2302`) — that path shows no banner update and no toast, so the user is told the entry was added when nothing was written and nothing will be.
- Impact: On a full quota or in Safari private browsing, the user gets a green success message for an entry that will be gone on reload. The persistent banner mitigates this only if the user notices a banner that is off-screen while they are looking at a toast.
- Recommendation: Change the toast lines to branch on the return, e.g. `toast(save() ? added : 'Not saved — see the banner above');`. Eight call sites report success to the user; the rest can stay as they are.
- Effort: S

**CODE-06 — "Replace all current data" merges instead of replacing**

- Severity: High
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3856`, confirmation text at `:3848`
- Evidence: The dialog asks "Replace all current data with imported file? This cannot be undone." The implementation is `db = { ...db, ...parsed, schemaVersion: parsed.schemaVersion };`. Any collection absent from the file is retained from the running database. Restoring a backup taken before goals existed leaves all current goals and contributions in place; restoring after a bad bulk edit to `salaries` from a file without a `salaries` key leaves the bad salaries.
- Impact: Restore is the app's primary recovery mechanism (`:1645-1657`) and it does not do what it says. A user restoring to undo a mistake keeps the mistake, silently, with no indication that the merge occurred.
- Recommendation: Build the replacement from the schema defaults rather than the live db: spread `parsed` over a fresh empty database object of the same shape used in `load()`'s fallback (`:2048-2060`), then persist and re-read through `load()` exactly as now.
- Effort: XS

**CODE-07 — Money is stored as floating point and rounded independently at four display sites**

- Severity: High
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3047-3049` and `:3099`; rounding at `:2442`, `:2448`, `:2473`, `:4999`
- Evidence: The salary calculator computes `si = gross * (pct/100)`, `wht = gross * (pct/100)`, `net = gross - si - wht` and pushes `amount: r.net` into `db.income` unrounded, along with the full float breakdown via `...r` into `db.salaries`. Manual entries are integers (`unmoney`, `:2494`), so the store holds a mix. Rounding then happens separately in `fmt()` (`Math.round`), `setNumAnimated()` (`Math.round`), `fmtCompact()` (`Math.round(+n||0)`) and `fmtCurrency()` (`Math.round`). Three salary entries of `1234.5` render as `₮1,235` each in the Income list while the Dashboard KPI shows `Math.round(3703.5)` = `₮3,704`.
- Impact: Rows and totals disagree by a few tugriks in a finance application, with no explanation available to the user. Because the drift is stored, not merely displayed, it accumulates across every derived figure — savings rate, projections, planned-vs-actual differences. `knowledge/project.md` lists "Reliable" as a core principle.
- Recommendation: Round at the single point where money enters the store — `Math.round()` the salary calculator's `net` (and the breakdown fields it persists) before `db.income.push` / `db.salaries.push`. That makes every stored amount an integer minor unit and leaves the four display formatters as pure formatters. Existing float data is tolerated by all readers, so no migration is required.
- Effort: M

**CODE-08 — The import handler reports every failure as "Invalid file", including failures that occur after the data has been written**

- Severity: High
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3843-3862`
- Evidence: The whole body sits in one `try { ... } catch { toast('Invalid file'); }`. The block spans parsing, validation, the confirmation dialog, an unguarded `localStorage.setItem(KEY, JSON.stringify(db))` at `:3857`, `load()`, `save()`, `applyTheme()` and four render calls. A quota failure at `:3857`, or any exception thrown by `renderSettings()`/`renderDashboard()` on the newly imported data, produces the message "Invalid file" — after the file has been merged and persisted.
- Impact: The user is told their file was rejected when it was in fact accepted and has already replaced their data, possibly leaving a half-rendered screen. This is the one place untrusted data enters the app and its error reporting actively misleads.
- Recommendation: Narrow the `catch` to the `JSON.parse` step and let the write and render steps report their own outcomes; route the write through `save()` so the existing save-error banner covers it.
- Effort: XS

**CODE-09 — Daily and Trend renderers rescan the full transaction list once per day and once per month**

- Severity: High
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:4611-4613`, `:4722`, `:4442-4448`
- Evidence: `renderCalendar()` runs `source.filter(x =&gt; x.date === iso &amp;&amp; ...)` inside a loop over every day of the month — up to 31 full passes. `drawDailyStackedChart()` does the same inside a loop bounded by `MAX_DAYS = 90` — 90 full passes. `drawMonthlyTrend()` runs `db.income.filter(inMonth)` and `db.actual.filter(inMonth)` per month for up to 36 months, and `inMonth` calls `parseISO(x.date)`, allocating a `Date` per entry per month. Each of these also calls `db.categories.find()` per entry (`:4747`, `:4350`, `:3377`).
- Impact: At 10,000 transactions, one `renderDashboard()` allocates roughly 720,000 `Date` objects in `drawMonthlyTrend` alone, and one `renderDaily()` performs roughly 1.2 million array-element comparisons. `renderDashboard()` runs on every navigation, every filter change and after every add, edit and delete. On a mid-range phone this is the difference between an instant app and a visibly stalled one, against a project principle of "Fast".
- Recommendation: Bucket once per render instead of scanning per bucket — build a `Map` from ISO date (or `YYYY-MM`) to entries in a single pass, then read the buckets in the day/month loop. Same for a `Map` of category id to category, replacing the repeated `.find()`.
- Effort: M

### Medium

**CODE-10 — No top-level error handler**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:5869-5896` (init block); no `window.onerror` or `unhandledrejection` listener exists anywhere in the file
- Evidence: The init sequence runs eleven statements in a row with no guard. Any throw — from CODE-04, from a corrupt cloud document, from a render bug — silently halts the sequence and leaves the app partially constructed with no message. The `dataErrorBanner` covers only unparseable storage, not a parse-succeeds-render-throws failure.
- Impact: The user sees a half-drawn or blank screen with no explanation and no route to Restore. Everything the persistence layer does to make failures visible is bypassed by an exception raised one layer up.
- Recommendation: Add a `window.addEventListener('error', ...)` handler that reveals the existing `dataErrorBanner` (which already offers Restore and Download) with a generic message. One handler, reusing DOM that is already there.
- Effort: XS

**CODE-11 — Service worker is network-first for the application shell**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\sw.js:40-53`
- Evidence: The `fetch` handler attempts the network for every GET and only falls back to `caches.match` on rejection. The comment states this is to pick up GitHub Pages updates instantly. `index.html` is 5,899 lines and is the entire application.
- Impact: With no network the fallback works, but on a slow or captive network the app start is blocked on a request that must time out before the cached shell is served — the common mobile case. `knowledge/project.md` lists "Fast" and "Offline-first" as core principles; network-first is the opposite ordering for a shell that changes only on deploy.
- Recommendation: Serve navigation and same-origin shell requests cache-first with a background revalidate, keeping network-first for anything else. The `CACHE` constant is already bumped per deploy (`sw.js:2`), so updates still land on the next launch.
- Effort: XS

**CODE-12 — Two independent recurrence engines**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2659-2686` (`computeNextRecurring`, goals) and `:3220-3315` (`stepDate` / `nextPlannedDue` / `plannedOccurrences`, planned expenses)
- Evidence: Both implement the same four frequencies (`daily`, `weekly`, `monthly`, `custom` with `intervalDays || 14`) with the same month-overflow behaviour, but through different code, different guards (20000 vs 5000) and different state fields (`lastLogged` vs `recLastDone`). `stepDate()` is documented at `:3218` as "The one definition of a recurrence step" — `computeNextRecurring()` does not use it.
- Impact: A fix to one (a month-end rule, a new frequency, the CODE-02 horizon clamp) silently leaves the other wrong, and the two will diverge. This is exactly the duplication `knowledge/coding-standards.md` prohibits.
- Recommendation: Rewrite `computeNextRecurring()` in terms of `stepDate()`, keeping its signature so goal callers are untouched.
- Effort: M

**CODE-13 — `initCategoryReorder` and `initIncomeTypeReorder` are the same 50 lines twice**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3463-3508` and `:3576-3632`
- Evidence: Identical pointer-drag logic — same 5px activation threshold, same `itemHeight` measurement, same `Math.round(dy / itemHeight)` slot calculation, same `splice`/`splice` reorder, same `finish` handler bound to `pointerup` and `pointercancel`. The only differences are the container id, the guard variable and the target array. The comment at `:3465` ("Same index-mismatch guard as initCategoryReorder()") documents the copy.
- Impact: Two places to fix any drag bug, and they have already begun to differ in comment density. Direct deviation from "Avoid duplication".
- Recommendation: Extract `initRowReorder(containerId, getList, isEditing, onReorder)` and call it twice.
- Effort: S

**CODE-14 — `analyzeExpenses()` is a 328-line function containing roughly 30 inline rules**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3884-4211`
- Evidence: One function holds every advisor rule as an inline block, mixing shared setup (`:3888-3900`), aggregation, thresholds and copy. Several rules re-derive the same aggregates independently — `byCat` at `:3942`, `cur30ByCat`/`prev30ByCat` at `:3973`, `byDay` at `:4026`, and full passes over `db.income` at `:4142` and `:4145`.
- Impact: Adding, testing or reordering a rule requires reading the whole function; the thresholds (`&gt; 35%`, `&gt;= 10000`, `&gt;= 20`) are scattered rather than declared. Against "Keep functions small" and "One responsibility per function", and it is the module the project's long-term vision names as the seed of the AI Budget Assistant.
- Recommendation: Move the rules into an array of `{ id, evaluate(ctx) }` objects over a context computed once, and keep `analyzeExpenses()` as the ten-line driver. No behaviour change.
- Effort: M

**CODE-15 — Planned vs Actual aggregates by category name, merging distinct categories**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:4348-4356`; category creation at `:3424-3433`
- Evidence: `drawPvA()` keys its accumulator on `const name = cat ? cat.name : 'Unknown'` rather than on `categoryId`. `catAdd` performs no duplicate-name check — unlike `incomeTypeAdd`, which explicitly rejects duplicates at `:3438`. Two categories both named "Transport" (one Needs, one Wants) are separate everywhere in the app except this chart, where they collapse into a single row whose group tag is whichever was seen first.
- Impact: A silently wrong breakdown on the Dashboard, plus a real deleted-category bug: every entry pointing at a deleted category falls into one shared "Unknown" row (`:4351`), merging unrelated spending.
- Recommendation: Key `rows` on `x.categoryId` and resolve the display name at render time. One-line change.
- Effort: XS

**CODE-16 — Chart colours are bound to array position, so reordering a category recolours history**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:4504-4507`
- Evidence: `categoryColor(id)` returns `CATEGORY_COLORS[db.categories.findIndex(c =&gt; c.id === id) % 12]`. The app ships drag-to-reorder for exactly this array (`:3576`) and a delete that splices it (`:3831`).
- Impact: Reordering or deleting one category re-colours every other category in the Daily stacked chart and the chips. Users read those charts by colour; the mapping changing under them undermines the screen's purpose.
- Recommendation: Derive the index from a stable hash of `c.id` rather than the array position.
- Effort: S

**CODE-17 — No data-access layer; `db` is a global mutated directly from DOM handlers**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:1997` (`let db = load()`), mutated at `:3114`, `:3344`, `:3416`, `:3428`, `:3441`, `:3499`, `:3622`, `:3831`, `:5344`, `:5411`, `:5766`, `:5836` and ~20 other event handlers
- Evidence: Every write is a click handler reaching into `db.&lt;collection&gt;.push(...)` or reassigning a filtered array, followed by an ad-hoc list of render calls. There is no add/update/delete function anywhere; the closest thing to invariant enforcement is `normalizeGroup()` in `load()` (`:2064`), which runs only on load. Module-level mutable state is extensive: `db`, `expMode`, `dailyMode`, `dailyExcluded`, `dailySelectedDate`, `calDate`, `editCtx`, `editingCatId`, `editingITypeId`, `curPickCallback`, `dpCallback`, `currentRates`, and six Firebase variables.
- Impact: Two direct consequences are already visible: the `localStorage.setItem` bypasses at `:2171`, `:3857`, `:4943`, `:4984` sidestep the save-failure reporting, and each handler maintains its own hand-written list of screens to re-render (compare `:3159` with `:3417` with `:3700-3705`), which is how a screen gets forgotten. Against "Avoid global variables" and "Prefer reusable modules".
- Recommendation: Do not restructure the whole file. Add a thin write API — `addEntry(collection, record)`, `updateEntry`, `removeEntry` — that validates with the existing `entryProblem()`, calls `save()`, and returns its boolean. Migrate the twelve financial-record call sites to it; leave settings and UI state alone.
- Effort: L

**CODE-18 — The cloud path installs a database that never passes through `load()`**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2170-2171`
- Evidence: `loadFromCloud()` does `db = JSON.parse(cloudDbJson); localStorage.setItem(KEY, cloudDbJson);` and then renders. `migrate()`, the `normalizeGroup()` pass, the settings-defaults merge and the corrupt-data quarantine are all in `load()` and none of them run. The load path's own comment at `:2062-2063` states that normalization is applied on every load precisely "because data can also arrive from a cloud document that never passes through the import validator" — but the cloud path does not call `load()` either.
- Impact: Currently latent: `firebaseConfig` is empty (`:2079-2086`), `isFirebaseConfigured()` returns false and none of this executes. The moment the config is filled in, an older or partial cloud document produces a `db` with no `settings.notifications` (crashing `renderNotifPrefs()` at `:3713`) or no `goals` (crashing `renderGoals()`), with no migration and no quarantine.
- Recommendation: Replace those two lines with `localStorage.setItem(KEY, cloudDbJson); db = load();`, reusing the validated path. Route the write through `save()` so quota failures surface.
- Effort: XS

**CODE-19 — Recurring flag removal leaves `recLastDone` behind**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:5822-5832`
- Evidence: Both branches of the edit-modal save delete `recFrequency`, `recIntervalDays` and `recEndDate`, but never `recLastDone`. `nextPlannedDue()` reads it at `:3289` as `const done = p.recLastDone || ''` and then skips forward with `while (iso &lt;= done)`.
- Impact: A user who turns a recurring plan into a one-time or actual expense and later turns recurrence back on gets a plan whose series silently starts after the stale `recLastDone` date — every occurrence before it vanishes from the reminder bell and from `nextPlannedDue()`. Financial state made wrong by a UI round-trip.
- Recommendation: Add `delete item.recLastDone;` to both branches, next to the existing deletes.
- Effort: XS

**CODE-20 — `renderDaily()` expands the same recurring series four times per render**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:4542-4549`, expanding at `:4556`, `:4604`, `:4664`, `:4715`
- Evidence: `renderDaily()` calls `renderDailyStats`, `renderDailyChips`, `drawDailyStackedChart` and `renderCalendar` in sequence, and each independently calls `expandPlannedInRange()` over `db.planned` for its own (overlapping) range. In Planned mode with the "All Time" range this is four separate 5,000-object expansions (CODE-02), and it runs again on every chip toggle and every calendar day tap (`:4645`, `:4688`, `:4784`).
- Impact: Four times the necessary work on the screen with the heaviest render, on the interactions users repeat most.
- Recommendation: Expand once in `renderDaily()` for the widest range needed and pass the result down as a parameter.
- Effort: S

**CODE-21 — Dead and unreachable code**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2072-2263` (Firebase module, ~190 lines), `:2540` (`const isoDate = toLocalISO`), `:5853-5855` (unused `EMPTY_ICONS` entries)
- Evidence: The entire cloud-sync module — SDK loader, auth, two sync functions, the UI renderer and the `cloudCard` markup at `:1621-1628` — is gated behind `isFirebaseConfigured()`, which returns false for the shipped empty config, so none of it executes and the card is hidden (`:2229-2232`). `isoDate` is an alias for `toLocalISO` declared 51 lines after it and used only inside `computeRange()`, giving one function a different name for the same helper. `EMPTY_ICONS.category` and `EMPTY_ICONS.calendar` are never requested — `emptyState()` is called only with `'income'`, `'expense'` and `'goal'`.
- Impact: ~190 lines of the JavaScript is unreachable in the shipped artifact yet must be read, reasoned about and kept compiling by every future change — and it carries a real latent defect (CODE-18). The `isoDate` alias makes a grep for date formatting miss `computeRange()`.
- Recommendation: Keep the Firebase module (it is a stated roadmap item) but move it behind a clearly marked, single boundary and fix CODE-18 so it is safe when enabled. Delete the `isoDate` alias and the two unused icons.
- Effort: S

**CODE-22 — Whole-database serialization on every keystroke-level change**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2304`
- Evidence: `save()` is `localStorage.setItem(KEY, JSON.stringify(db))` — the complete database, synchronously, on the main thread. It is called from 31 sites, including per-toggle handlers such as `savePref()` (`:3761`) and the drag-reorder `finish` handlers (`:3501`, `:3624`).
- Impact: At 10,000 transactions the serialized blob is on the order of 1.5 MB; every theme click, every checkbox and every drag rewrites all of it. On a slow phone this is a visible stall, and the 5 MB per-origin `localStorage` ceiling is the hard limit on how much history the app can ever hold. `updateStorageStatus()` (`:2411`) reports usage but nothing warns as the ceiling approaches.
- Recommendation: Debounce `save()` (the cloud path already demonstrates the pattern at `:2213-2217`) so a burst of UI changes writes once. The storage-model change belongs in Technical Debt, not here.
- Effort: S

### Low

**CODE-23 — `unmoney()` discards minus signs and decimal points**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2494`
- Evidence: `const unmoney = (v) =&gt; +String(v ?? '').replace(/[^\d]/g, '') || 0;` — `"12.50"` becomes `1250`, `"-500"` becomes `500`. It is used for every amount the user types (`:3110`, `:3328`, `:5395`, `:5722`, `:5763`).
- Impact: Mostly mitigated: `.money-input` fields are live-reformatted by `formatMoneyInput()` (`:2499`), which strips the characters as the user types, so the field visibly shows `1,250` before submission. MNT has no circulating subunit, so the decimal case is unlikely in practice. Recording it because the silent 100× is a property of the parser, not of the input widget, and any future non-MNT or decimal-bearing field inherits it.
- Recommendation: Leave the behaviour, add a one-line comment at `:2494` stating that money is whole tugriks by design so the next reader does not treat the stripping as a bug.
- Effort: XS

**CODE-24 — Period presets are resolved once and never refreshed**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2578-2600`
- Evidence: `initPeriodFilter()` calls `applyPreset()` at startup, writing concrete dates into the `from`/`to` inputs. `getRange()` (`:2556`) then reads those inputs. Nothing recomputes them while the app is open.
- Impact: A PWA left open across midnight on the last day of a month still reports the previous month under a "This Month" label, including in the advisor's end-of-month projection rule (`:4073`). Recovering requires re-selecting the preset.
- Recommendation: Recompute the active non-custom preset on `visibilitychange` when the date has changed since the last render.
- Effort: S

**CODE-25 — Migration results are not persisted until an unrelated save happens**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:2066` and `:1922`
- Evidence: `migrate(d)` stamps `d.schemaVersion = v` in memory, and `load()` returns without writing. The upgraded shape reaches storage only when some later user action calls `save()`.
- Impact: Both shipped migrations are idempotent, so today this only means they re-run on every boot until the user changes something. The risk is structural: the append-only contract at `:1875-1877` assumes a step runs once, and the first non-idempotent step added will run repeatedly on a read-only session.
- Recommendation: Have `load()` call `save()` when `migrate()` raised the version, guarded so it cannot fire in the `corruptQuarantineFailed` state (`save()` already refuses there).
- Effort: XS

**CODE-26 — 156 inline `style` attributes duplicate values that already exist as design tokens**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html` — 156 occurrences; concentrated at `:2237`, `:2242-2254`, `:3676-3684`, `:3729-3753`, `:4341-4343`, `:5501-5538`
- Evidence: The stylesheet defines a complete token set with an explicit instruction — "Spacing scale — use ONLY these values" (`:38`), radius, type and elevation scales (`:41-53`). Generated markup then hard-codes `font-size:11px`, `padding:2px 8px`, `border-radius:6px`, `margin-top:8px`, `gap:8px` inline, and repeats the same combinations across unrelated renderers (compare `:3681` with `:3682` with `:2429`).
- Impact: Nothing fails, but a theme or spacing change now has to be made in the stylesheet and in 156 string literals. Direct deviation from "Use reusable classes" and "Avoid duplicated styles" in `knowledge/coding-standards.md`.
- Recommendation: Promote the four or five combinations that repeat (the mini-button, the helper row, the legend row) to classes and use them in the templates. Do not attempt all 156.
- Effort: S

---

## Clean Areas

- **Dates and time zones** — clean. `toLocalISO()` (`:2489`) is used everywhere with an explicit comment against `toISOString()`, and a grep confirms `toISOString` appears nowhere in the file. Comparisons are lexical on `YYYY-MM-DD`, which is correct and DST-safe.
- **Corrupt-data quarantine** — clean. The raw bytes are copied aside before any write (`:1951`), `save()` refuses to run if the copy failed (`:2302`), and the user is given both the damaged file and a restore route (`:1218-1225`).
- **Offline behaviour of the currency converter** — clean. `fetchRatesUSDBase()` (`:4965`) serves fresh cache, falls back to stale cache on network failure, and `openConverter()` distinguishes all three states to the user (`:5043-5055`).
- **Third-party dependencies** — clean. The shipped default path loads no third-party script and makes no network call at startup. The two external endpoints (`open.er-api.com`, `gstatic.com`) are both user-initiated and both optional.
- **Injection surface other than CODE-03** — clean. No `eval`, no `new Function`, no `document.write`, no inline `on*` handlers, and no reading of `location.hash`/`location.search`. All 54 `innerHTML` assignments route user text through `escapeHTML()` (`:5865`) except the seven attribute sites in CODE-03.
- **Service worker install robustness** — clean. `Promise.allSettled` over individual `cache.add` calls (`sw.js:16-21`) correctly avoids the all-or-nothing failure of `addAll`.

---

## Technical Debt

**The storage model is the ceiling on everything.** A single `localStorage` key holding one JSON blob, rewritten in full on every change (CODE-22), caps the application at roughly 5 MB and makes every write O(total data). `knowledge/project.md` names Cloud Sync, a Debt Planner, a Savings Planner, an Investment Tracker and an OCR Receipt Scanner as future modules — the last of those stores images, which this model cannot hold at all. Moving to IndexedDB with per-collection stores is the change that unblocks the roadmap, and it is far cheaper to do now, behind the write API proposed in CODE-17, than after three more modules have been written against the global `db`.

**Two recurrence engines and one half-applied recurrence model.** CODE-01 and CODE-12 are the same debt seen twice: the recurring-planned model was correctly redesigned but only propagated to some consumers, and the goals feature never adopted it. Every future feature that touches schedules — the Debt Planner's payment schedules, notification scheduling — will have to pick one of the two engines, and picking wrong is invisible until a user reports a wrong number.

**Everything is one 5,899-line file.** This is a deliberate and defensible choice for a zero-build PWA, and it is not itself a defect. The cost is concrete: there is no unit test anywhere in the repository, and there cannot be one while `plannedOccurrences()`, `migrate()` and `entryProblem()` are unreachable from outside the `&lt;script&gt;` tag. Those three functions carry the application's financial correctness and are exactly the code that should be tested. Extracting only the pure logic into a sibling `&lt;script type="module"&gt;` would make them testable without introducing a build step.

**No versioning of derived semantics.** `SCHEMA_VERSION` covers data shape. It does not cover meaning — the v1→v2 comment (`:1896-1901`) documents that `planned[].date` changed meaning and that no transform could undo it. Any future change to what `recLastDone` or `recEndDate` means will face the same problem with no mechanism to detect it.

**Overlaps with findings:** CODE-17 and CODE-22 (write path), CODE-12 and CODE-01 (recurrence), CODE-19 (Firebase module carried but unused).

---

## Future Risks

**At 10,000 transactions.** The Dashboard becomes the bottleneck first, not storage: `drawMonthlyTrend()` (CODE-09) allocates a `Date` per entry per month and runs on every navigation and every filter change. The Daily screen follows, with 90 full-list scans per chart render plus 31 more for the calendar, multiplied by four redundant expansions (CODE-20). Storage crosses roughly 1.5 MB — safe against the 5 MB ceiling, but every save rewrites all of it.

**At 30,000–40,000 transactions**, or after adding receipt images, the `localStorage` quota is reached. The failure is handled honestly — `save()` returns false and the banner appears (`:2277`) — but there is no recovery path other than manual deletion, and CODE-05 means the user is told each blocked entry was saved.

**On a slow mobile device**, the network-first service worker (CODE-11) delays start-up by a full network timeout on flaky connections, and each synchronous whole-database `JSON.stringify` (CODE-22) blocks the main thread on every toggle and drag.

**When Cloud Sync is enabled**, CODE-18 activates immediately: an older cloud document installs itself with no migration and no defaults, and the sync itself is last-write-wins over a whole-document blob — two devices editing on the same day means one device's entries are simply gone. The README warns about this; the code does nothing about it. This is the roadmap item most likely to cause data loss.

**When the AI Budget Assistant is built**, it will be built on top of `analyzeExpenses()` (CODE-14), which will by then be 400+ lines of un-testable inline rules over a context that is recomputed per rule.

**The first thing that actually breaks**, in order: the Dashboard's planned figures (already wrong today, CODE-01); the Daily totals under "All Time" (already wrong today, CODE-02); then Dashboard render latency; then the storage ceiling.

---

## Recommended Refactoring

The smallest set of structural changes that removes the most risk, in the order they should be done.

1. **Route every planned-expense read through one function.** Fix the horizon clamp inside `plannedOccurrences()` and change the Dashboard to call `expandPlannedInRange()`. Two edits close the app's two wrong-figure defects at once and make the recurring model finally have a single meaning. — *CODE-01, CODE-02*

2. **Close the import boundary.** Escape the seven attribute interpolations, extend `importProblem()` to the four collections it does not check, narrow the import `catch`, and make the merge a replacement. This is the whole untrusted-input surface, and all four fixes are XS or S. — *CODE-03, CODE-04, CODE-06, CODE-08*

3. **Introduce a thin write API and make failure visible.** `addEntry` / `updateEntry` / `removeEntry` that validate with the existing `entryProblem()`, call `save()`, and return its boolean; migrate the twelve financial-record call sites and branch the success toasts on the result. This removes the `localStorage` bypasses, gives one place to add the future IndexedDB backend, and is the prerequisite for the storage migration named in Technical Debt. — *CODE-05, CODE-17, CODE-18, CODE-22*

4. **Bucket once per render.** One `Map` of date to entries and one `Map` of id to category, built once and read by the day/month loops, replacing 121 full-list scans and every repeated `.find()`. Hoist the Daily expansion into `renderDaily()`. — *CODE-09, CODE-20*

5. **Collapse the two recurrence engines into `stepDate()`.** After step 1, this is a mechanical rewrite of one function, and it removes the drift risk before the Debt Planner and Savings Planner add a third scheduler. — *CODE-12*

6. **Round money at the store boundary.** `Math.round()` the salary calculator's outputs before they are pushed. One place, no migration, and it makes the four display formatters purely presentational. — *CODE-07*

Steps 1 and 2 are release blockers. Step 3 is what makes steps 4 and the roadmap affordable. Steps 5 and 6 are small and can follow.

**Explicitly not recommended:** a rewrite, a framework, a build step, or a state-management library. Every finding above is reachable by refactor, and the single-file zero-dependency form is the reason this app boots instantly and works offline.
