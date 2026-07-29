# Code Review — expense-pwa

## Executive Summary

The application is a single-file PWA of 5,522 lines that is, on the surface, carefully written: dates are handled with local components rather than `toISOString()`, `escapeHTML()` is applied at roughly forty render sites, infinite-loop guards exist on every recurrence walk, and the CSS is driven by a disciplined design-token system. The weakness is not the surface, it is the foundation. Every write in the application funnels through one unguarded `localStorage.setItem()` call (index.html:2080) that has no failure path, no user signal, and no automatic backup behind it — for a finance application whose only durable store is `localStorage`, that is the single biggest risk in the codebase. Below that sit four further data-integrity defects: corrupt stored JSON is silently swallowed and then overwritten, render functions destructively rewrite stored planned-expense dates so historical Planned vs Actual figures read ₮0, import validation checks containers but not records, and cloud sync (when a user follows the app's own setup guide) overwrites a whole-document blob last-write-wins. Maintainability is a second, slower problem: a 5,522-line global scope with a 330-line advisor function, recurrence-stepping logic copied into four places, and no schema version to migrate from.

## Overall Score

**58 / 100** — Significant rework needed before release.

One Critical finding (silent, unsignalled data loss on any storage write failure) and four High findings, all in the data layer of a finance application; the code is otherwise thoughtfully written and the fixes are mostly contained, which keeps it out of the lowest band.

---

## Findings

### Critical

**CODE-01 — `save()` has no failure path; a rejected write is silently lost**

- **Severity** — Critical
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\index.html:2079-2082`
- **Evidence** —
  ```js
  function save() {
    localStorage.setItem(KEY, JSON.stringify(db));
    scheduleCloudSync();
  }
  ```
  There is no `try`/`catch`. Every mutation in the application calls this function (income add 2782, expense add 2986, goal add 5038, category edit 3194, settings toggle 3385, drag-reorder 3248, notification conversion 2505, and ~30 more sites). `localStorage.setItem` throws `QuotaExceededError` when the origin quota is exhausted, and throws unconditionally in Safari private browsing. In every caller, `save()` is invoked *before* the follow-up work, e.g. income add at 2782-2787: `save(); …value=''; renderIncome(); renderDashboard(); toast('Income added');`. A throw therefore aborts the handler before the toast, so nothing at all happens on screen while the in-memory `db` still contains the new record. The Settings screen reports quota usage (2122-2131) but nothing detects a failed write.
- **Impact** — A user records transactions, sees them in the list (they are in the in-memory array and reappear on the next render), and loses everything since the last successful write on reload. This is unsignalled data loss in an application whose only durable store is `localStorage`, and it directly contradicts the "Reliable" principle in `knowledge/project.md` and the "Handle errors" rule in `knowledge/coding-standards.md`.
- **Recommendation** — Wrap the write in `try`/`catch`. On failure, surface a blocking, non-dismissible banner ("Your last change could not be saved — export a backup now") and return a boolean so callers can avoid reporting success. Do not attempt a retry or a fallback store; the smallest safe fix is to make the failure visible.
- **Effort** — S

---

### High

**CODE-02 — Corrupt stored data is swallowed, then overwritten by the next write**

- **Severity** — High
- **Location** — `index.html:1809-1862` (specifically the empty catch at 1838 and the fallback at 1839)
- **Evidence** —
  ```js
  } catch (e) {}
  if (!d) d = { income: [], planned: [], actual: [], … };
  ```
  If `JSON.parse` of the stored blob fails (truncated write, storage corruption, a partially written cloud payload), the error is discarded with no logging and no user message, and `load()` returns an empty database. The application then renders as a brand-new install. The first subsequent `save()` (2080) writes the empty object over the only copy of the original, still-possibly-recoverable string.
- **Impact** — Irreversible loss of the entire financial history with no warning and no chance to salvage the raw text. The user sees an empty app and reasonably concludes the browser cleared it.
- **Recommendation** — In the catch, copy the raw string to a side key (e.g. `expense-tracker-v1.corrupt.&lt;timestamp&gt;`) before falling back, and show a persistent banner offering "Restore from file". Never let the first write overwrite an unparsed blob.
- **Effort** — S

**CODE-03 — Rendering destructively rewrites stored planned-expense dates, erasing planned history**

- **Severity** — High
- **Location** — `index.html:2940-2956` (`autoAdvancePlannedRecurring`), called from `renderExpenses()` at 2999, from `computeReminders()` at 2358, and at init 5494; consumed by `drawPvA()` via `renderDashboard()` at 3892/3931
- **Evidence** —
  ```js
  while (stillActive &amp;&amp; p.date &lt; today &amp;&amp; guard++ &lt; 10000) {
    stillActive = advancePlanned(p);   // mutates p.date in place
    changed = true;
  }
  if (changed) { db.planned = remaining; save(); }
  ```
  A recurring planned entry stores exactly one date, and that date is rolled forward past today and persisted as a side effect of opening the Expenses screen or refreshing the bell badge. The original date is gone. `expandPlannedInRange()` (2909-2936) deliberately projects forward only — the comment at 2906-2908 states backward projection is intentionally omitted — so no consumer can reconstruct past occurrences.
- **Impact** — Wrong figures on the Dashboard. Select "Last Month" and a user who has planned monthly rent for a year sees Planned ₮0 against their actual spending, and the "over by" total at 4024-4028 is wrong by the full planned amount. The advisor's per-category "over budget" rule (3589-3597) is silently disabled for every recurring plan. A render pass must never mutate and persist user data.
- **Recommendation** — Stop mutating `p.date`. Treat the stored date as the series anchor plus an optional `lastConvertedDate`, and let `expandPlannedInRange()` (which already exists) generate occurrences in both directions for a queried range. Keep `advancePlanned()` only for the explicit "Mark as Actual" action at 2493.
- **Effort** — M

**CODE-04 — `validateImport()` validates containers but not records**

- **Severity** — High
- **Location** — `index.html:2086-2100`; failure sites at 2796, 3004, 3426
- **Evidence** — The validator checks only that five keys are arrays and that four optional keys are arrays when present. No element is inspected. A backup containing `{"income":[{"amount":500}]}` (no `date`, no `id`) passes, is merged at 3483 and persisted at 3484. `renderIncome()` then executes `.sort((a,b) =&gt; b.date.localeCompare(a.date))` at 2796 and throws `TypeError: Cannot read properties of undefined`. Similarly a category without `group` reaches `c.group.toLowerCase()` at 3426 and throws out of `renderSettings()`, and an entry with a string `amount` such as `"1,000"` becomes `NaN` in every `(+x.amount||0)` reduction — silently contributing 0 to totals.
- **Impact** — A restore from an older, hand-edited, or partially written backup can leave the app on a blank screen with the bad data already persisted, or produce financial totals that are quietly short. `knowledge/coding-standards.md` requires "Validate inputs"; the current check is only half the job, and this is the one place where untrusted data enters the system.
- **Recommendation** — Add a per-record shape check for the five core collections: `id` string, `date` matching `/^\d{4}-\d{2}-\d{2}$/`, `amount` finite number ≥ 0, required foreign key present. Reject the file with a specific message naming the first bad record rather than importing partially.
- **Effort** — S

**CODE-05 — Cloud sync overwrites the whole document last-write-wins**

- **Severity** — High
- **Location** — `index.html:1983-1999` (`syncToCloud`), `1942-1981` (`loadFromCloud`), scheduler at 2001-2005
- **Evidence** —
  ```js
  await fbDb.collection('users').doc(currentUser.uid).set({
    db: JSON.stringify(db),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  ```
  The entire database is serialised into one field and `set()` (not `update()`, not a transaction) replaces the document. `scheduleCloudSync()` fires 1.5 s after any local change. `loadFromCloud()` reads at sign-in only, and `updatedAt` is written but never read or compared. Two devices signed into the same account will each push their full state; the later push wins completely.
- **Impact** — A user who adds expenses on a phone and later opens the app on a tablet that was left open loses the phone's entries entirely, with no conflict prompt. The app's own setup guide (2043-2077) walks users into this configuration, and the Settings copy at index.html:1577 promises data "syncs across all your devices."
- **Recommendation** — Before `set()`, read the document's `updatedAt` and abort with a user-facing prompt if it is newer than the timestamp this device last loaded. That is the smallest change that turns silent loss into a visible choice; a real merge strategy is a separate design decision.
- **Effort** — M

---

### Medium

**CODE-06 — Cloud sync failures are invisible to the user**

- **Severity** — Medium
- **Location** — `index.html:1993-1998`, `2004`
- **Evidence** — `syncToCloud()`'s catch block is `{ console.error(e); }` and then `updateCloudUI()` runs, which redisplays "Last sync: &lt;previous success time&gt;" (2028). The debounced call at 2004 is `syncToCloud().catch(() =&gt; {})`.
- **Impact** — The Settings screen reassures the user that sync is working while every write is failing (expired token, offline, Firestore rules misconfigured). Directly contradicts "Handle errors" in `knowledge/coding-standards.md`.
- **Recommendation** — Set a `lastSyncError` flag in the catch and render a warning line in `updateCloudUI()` instead of the stale success timestamp.
- **Effort** — XS

**CODE-07 — Category `group` is interpolated into HTML without escaping**

- **Severity** — Medium
- **Location** — `index.html:3023`, `3426`, `4007`, `4444`
- **Evidence** — e.g. line 3426: `` `&lt;span class="tag ${c.group.toLowerCase()}"&gt;${c.group}&lt;/span&gt;` ``. Every neighbouring user string (`c.name`, `x.notes`) goes through `escapeHTML()`; `group` never does, in any of the four sites. `group` is constrained to Needs/Wants/Savings by the `&lt;select&gt;` at index.html:1551, but it is *not* constrained on the import path (see CODE-04) or on the cloud-load path (1958).
- **Impact** — A crafted or corrupted backup file yields stored XSS that fires on every subsequent render of Settings, Expenses, the Dashboard and Day Details. The blast radius is the user's own financial data plus, if cloud sync is on, their Firebase session.
- **Recommendation** — Wrap all four interpolations in `escapeHTML()`, and constrain `group` to the three known values when loading.
- **Effort** — XS

**CODE-08 — Settings merge order discards the notification defaults it just built**

- **Severity** — Medium
- **Location** — `index.html:1825-1835`
- **Evidence** —
  ```js
  settings: {
    theme: 'light',
    notifications: { enabled: true, daysAhead: 7, …, ...(parsed.settings?.notifications || {}) },
    ...(parsed.settings || {})          // ← re-overwrites `notifications` wholesale
  }
  ```
  Object literal keys are applied in order, so the final spread replaces the carefully merged `notifications` object with the raw stored one. The merge above it is dead in every case where `parsed.settings.notifications` exists.
- **Impact** — Any stored or imported settings object with a partial `notifications` block loses its defaults: `enabled` becomes `undefined`, so `computeReminders()` returns `[]` at 2356 and every reminder silently stops working with no visible cause. This is also the exact mechanism that will break the next field added to `notifications`, so it defeats the migration path it was written to provide.
- **Recommendation** — Move the `...(parsed.settings || {})` spread above the `notifications` key, or merge settings first and then overlay notifications.
- **Effort** — XS

**CODE-09 — No schema version and no migration framework**

- **Severity** — Medium
- **Location** — `index.html:1785` (`const KEY = 'expense-tracker-v1'`), `1809-1862`
- **Evidence** — The version lives only in the storage key. The stored object has no `version` field. The one migration that exists — income `type` string to `typeId` (1853-1860) — is an ad-hoc loop inside `load()` that must run on every boot forever, because there is no way to record that it has already run. Exported backups (3462) carry no version either, so an old file is indistinguishable from a current one.
- **Impact** — Every future data change adds another permanent unconditional loop to `load()`, and there is no safe way to make a breaking change. This directly blocks the Cloud Sync, Debt Planner, Savings Planner and Investment Tracker items in `knowledge/project.md`, all of which require schema growth.
- **Recommendation** — Add `schemaVersion: 1` to the stored object and to exports, and route `load()` through an ordered array of numbered migration functions. Do this before any further data-shape change.
- **Effort** — S

**CODE-10 — Service worker is network-first for the app shell, contradicting offline-first**

- **Severity** — Medium
- **Location** — `D:\3_Claude\PowerApps\expense-pwa\sw.js:40-54`
- **Evidence** — Every GET, including the navigation request for `index.html`, calls `fetch(e.request)` first and only falls back to `caches.match()` on rejection. The comment at 36-39 states the intent: pick up GitHub Pages deployments instantly.
- **Impact** — Hard offline works, but a weak or captive-portal connection is the common mobile case: `fetch` does not reject promptly, it hangs, so app launch blocks on the network for the browser's timeout before the 5,522-line cached shell is served. That defeats both "Fast" and "Offline-first" in `knowledge/project.md`.
- **Recommendation** — Use stale-while-revalidate for the navigation and shell assets: respond from cache immediately, update the cache in the background, and show a small "Update available — reload" prompt. Keep network-first for anything genuinely dynamic.
- **Effort** — S

**CODE-11 — No module boundaries; the UI layer reads and persists storage directly**

- **Severity** — Medium
- **Location** — `index.html:1805` (`let db = load();`), `2999`, `2358`, `2259-2264`
- **Evidence** — The whole 3,741-line script body is one global scope; `db`, `expMode`, `editCtx`, `dailyMode`, `dailyExcluded`, `calDate`, `currentRates`, `editingCatId`, `dpCallback` and ~20 more are mutable globals on `window`. Render functions reach straight into storage and write it back: `renderExpenses()` calls `autoAdvancePlannedRecurring()` at 2999, which calls `save()` at 2955, which calls `scheduleCloudSync()`. Query state lives in the DOM — `getRange(prefix)` at 2259-2264 reads `&lt;input&gt;` values as the source of truth for every calculation.
- **Impact** — There is no seam at which data correctness can be tested or enforced; a bug like CODE-03 is only possible because rendering can write. `knowledge/coding-standards.md` explicitly requires "Avoid global variables" and "Prefer reusable modules", so this is a deviation, not a preference.
- **Recommendation** — Do not rewrite. Extract a single `store` object (load / get / mutate / save, with the CODE-01 error handling inside it) and make every mutation go through it; forbid `save()` calls from any `render*` function. Split the file into `app.js` + `styles.css` as a second, separate step so the diff stays reviewable.
- **Effort** — XL (needs a design decision first)

**CODE-12 — `analyzeExpenses()` is a 328-line function holding 24 unrelated rules**

- **Severity** — Medium
- **Location** — `index.html:3511-3838`
- **Evidence** — One function contains the 50/30/20 rule, category concentration, plan overspend, 30-day spike, goal pacing, small-transaction counting, biggest expense, peak day, weekend split, emergency fund, income diversification, month projection, unplanned categories, no-spend streak, logging consistency, subscription count, income trend, goal completion, dining-out detection, and four fallback messages. It carries a defensive comment at 3519-3521 explaining that shared date constants were hoisted to the top "so no rule can reference them before initialization if rules are reordered later" — an acknowledgement that the function is already too big to reason about.
- **Impact** — Violates "Keep functions small" and "One responsibility per function" in `knowledge/coding-standards.md`. Every new advisor rule increases the chance of breaking an existing one, and no rule can be tested in isolation. This function is the core of the "help users understand and improve their financial life" goal in `knowledge/project.md`, so it is the part most likely to keep growing.
- **Recommendation** — Convert to an array of small pure rule functions, each `(ctx) =&gt; tip | null`, where `ctx` is a pre-computed set of aggregates. Mechanical, one rule at a time, no behaviour change.
- **Effort** — M

**CODE-13 — Recurrence stepping is implemented four times**

- **Severity** — Medium
- **Location** — `index.html:2331-2340`, `2866-2881`, `2889-2901`, `2911-2919`
- **Evidence** — The same `switch (frequency)` over `daily / weekly / monthly / custom` with the same `(intervalDays || 14)` default appears in `computeNextRecurring()`, `advancePlanned()`, `upcomingPlannedDates()` and `expandPlannedInRange()`. The four copies already differ: `advancePlanned` has no `default` case (2869-2874) while `upcomingPlannedDates` returns early on an unknown frequency (2895), and only two of the four honour `recEndDate`.
- **Impact** — Adding a "quarterly" option requires four correct edits; the copies have already drifted on end-date handling. Violates "Avoid duplication".
- **Recommendation** — Extract one `stepDate(date, frequency, intervalDays)` helper and call it from all four sites.
- **Effort** — S

**CODE-14 — Drag-to-reorder is copied wholesale for categories and income types**

- **Severity** — Medium
- **Location** — `index.html:3087-3132` (`initIncomeTypeReorder`) and `3200-3256` (`initCategoryReorder`)
- **Evidence** — 45 lines are byte-for-byte identical apart from the container id, the guard variable (`editingITypeId` / `editingCatId`) and the target array. The comment at 3089 ("Same index-mismatch guard as initCategoryReorder()") documents the copy.
- **Impact** — Two places to fix any pointer-handling bug, on the touch interaction most likely to need iteration. Violates "Avoid duplication" and "Prefer reusable modules".
- **Recommendation** — One `initReorder(containerId, getArray, isEditing, onReorder)` used by both callers.
- **Effort** — S

**CODE-15 — Daily, calendar and trend charts re-scan the full transaction list once per day/month rendered**

- **Severity** — Medium
- **Location** — `index.html:4345-4355` (`drawDailyStackedChart`), `4236-4242` (`renderCalendar`), `4069-4078` (`drawMonthlyTrend`)
- **Evidence** — The daily chart loops up to 90 days and runs `source.filter(x =&gt; x.date === iso &amp;&amp; …)` over the whole array inside the loop (4349). The calendar repeats the same pattern for up to 31 days (4238-4240). `drawMonthlyTrend` filters `db.income` and `db.actual` once per month for up to 36 months, and its predicate calls `parseISO()` (4071), allocating a `Date` per entry per month. `categoryColor()` (4131-4134) does a `findIndex` over categories for every stacked segment. `renderDaily()` (4169-4176) runs four of these passes and is re-invoked on every chip toggle (4315) and every bar tap (4412).
- **Impact** — Work is O(days × transactions). At 10,000 transactions one `renderDaily()` performs on the order of 1.2 million comparisons plus per-day closure allocation, and one `renderDashboard()` allocates ~360,000 `Date` objects in the All Time trend — repeated on every add, edit and delete. On a low-end phone this turns each tap into a visible stall, against the "Fast" principle in `knowledge/project.md`.
- **Recommendation** — Build a `Map&lt;dateISO, entries[]&gt;` index once per render pass and have the day/month loops read from it; memoise `categoryColor` into a `Map&lt;id, color&gt;` built when categories change.
- **Effort** — M

**CODE-16 — Projected planned occurrences appear in the chart and calendar but not in Day Details**

- **Severity** — Medium
- **Location** — `index.html:4417-4429` (`renderDaySelected`), compared with `4341-4343` and `4230-4232`
- **Evidence** — The stacked chart and calendar both expand recurring entries: `const source = dailyMode === 'planned' ? expandPlannedInRange(baseSource, …) : baseSource;`. `renderDaySelected()` does not — line 4422 reads `const source = dailyMode === 'actual' ? db.actual : db.planned;` with no expansion.
- **Impact** — In Planned mode a user taps a future bar showing ₮450,000 and the detail card underneath says "No expenses on this day." The app appears to contradict itself on the screen whose whole purpose is drill-down.
- **Recommendation** — Call `expandPlannedInRange(db.planned, dailySelectedDate, dailySelectedDate)` in `renderDaySelected()` when `dailyMode === 'planned'`, and label projected rows.
- **Effort** — S

**CODE-17 — Dead persisted fields and one mislabeled setting**

- **Severity** — Medium
- **Location** — `index.html:1824`, `1842`, `2094` (`recurringIncome`); `1830`, `1848`, `3395` (`osPermission`); `3369-3371` vs `2404-2430`
- **Evidence** — `recurringIncome` is defaulted, migrated, validated on import and persisted on every save, but no other line in the file reads or writes it. `settings.notifications.osPermission` is assigned at 3395 and never read — `renderNotifPrefs()` reads `Notification.permission` directly at 3338. The checkbox labelled "Recurring income due" (3370) is bound to `showRecurring`, which in `computeReminders()` (2404-2430) controls *goal auto-contribution* reminders only; there is no recurring-income feature.
- **Impact** — Dead fields in the persisted schema are the most expensive kind of dead code — they must be carried through every future migration and every backup format. The mislabeled checkbox actively misleads the "people with little accounting knowledge" named in `knowledge/project.md`.
- **Recommendation** — Delete `recurringIncome` and `osPermission` from `load()`, the defaults and `validateImport()` (they are additive keys; removing them is backward compatible because nothing reads them). Relabel the checkbox "Goal contributions due".
- **Effort** — XS

---

### Low

**CODE-18 — Salary-derived income is stored as a floating-point amount**

- **Severity** — Low
- **Location** — `index.html:2702-2727`, `2763`
- **Evidence** — `net = gross - si - wht` where `si` and `wht` are `gross * (pct/100)` — unrounded floats. Line 2763 pushes `amount: r.net` into `db.income`, and the salary record at 2744-2756 spreads all nine float fields. Every other money path in the app stores integers via `unmoney()` (2197). `fmt()` rounds only at display time (2145).
- **Impact** — Rounding is defined once, in `fmt()`, but it is applied only on output, so the sum of the rows a user reads can differ by ±1₮ from the total shown. Cosmetically trivial for MNT today; it becomes a real reconciliation problem the moment a report or export is added.
- **Recommendation** — `Math.round()` the derived values in `calcSalary()` before they are stored, so the stored value is the value displayed.
- **Effort** — XS

**CODE-19 — Salary deduction percentages are unvalidated and the failure message is wrong**

- **Severity** — Low
- **Location** — `index.html:2711-2713`, `2742`
- **Evidence** — `sSIPct` and `sWHTPct` accept any number. Entering SI 50 and WHT 60 yields a negative `net`, which is caught only by `if (r.net &lt;= 0) { toast('Enter hours or field days'); return; }` at 2742 — a message about hours, for a percentage problem. The Breakdown card meanwhile displays the negative Net.
- **Impact** — A user who mistypes a percentage is told to fix a different field and cannot work out why saving fails.
- **Recommendation** — Validate `siPct + whtPct &lt;= 100` with its own message, and mark the offending field `invalid` the same way `sHourly` is at 2735.
- **Effort** — XS

**CODE-20 — `drawPvA()` aggregates by category name instead of id**

- **Severity** — Low
- **Location** — `index.html:3974-3986`
- **Evidence** — `if (!rows[name]) rows[name] = { planned: 0, actual: 0, group: cat?.group || 'Needs' };` — the accumulator is keyed on `cat.name`. Nothing prevents two categories sharing a name (`catAdd` at 3048-3057 checks nothing, unlike `incomeTypeAdd` which does check at 3062).
- **Impact** — Two same-named categories silently merge into one Planned vs Actual row and inherit whichever group was seen first; deleted categories collapse into a single "Unknown" row alongside each other.
- **Recommendation** — Key the accumulator on `x.categoryId` and resolve the display name at render time. Optionally add the same duplicate-name guard `incomeTypeAdd` already has.
- **Effort** — XS

**CODE-21 — `wireIconGrid()` adds a permanent document listener on every modal open**

- **Severity** — Low
- **Location** — `index.html:5007-5011`, invoked from `5163`
- **Evidence** — `document.addEventListener('click', …, true)` is registered inside `wireIconGrid()`, which `openGoalEditModal()` calls at 5163 each time the modal opens. Nothing removes it, and the closure retains the `grid` element, which `editModalBody.innerHTML = …` has already detached.
- **Impact** — A capture-phase listener and a detached DOM subtree accumulate per goal edit for the lifetime of the session. Small, but unbounded, and this is a long-lived installed PWA.
- **Recommendation** — Register the outside-click handler once at startup and delegate on `.icon-grid.open`, or return a teardown function that the modal close path calls.
- **Effort** — S

**CODE-22 — The advisor mixes period-filtered and all-time data in the same tip list**

- **Severity** — Low
- **Location** — `index.html:3511` (signature), `3601-3613`, `3616-3631`, `3769-3783`
- **Evidence** — `analyzeExpenses(income, actual, planned, from, to)` receives the period-filtered arrays, but several rules ignore them and read the globals instead: the spike rule scans `db.actual` over a fixed last-30/previous-30 window (3601-3603), the goal-pacing rule scans `db.goals` (3616), and the income trend rule scans `db.income` (3769-3774).
- **Impact** — With the dashboard set to "Last Year", the advisor shows "Groceries up 60% vs last 30 days" next to tips computed over the selected year. The header says the range, the tips do not honour it, and the target audience has no way to tell which is which.
- **Recommendation** — Either scope those three rules to the selected range, or tag them in the UI as "vs last 30 days" so the mixed basis is explicit.
- **Effort** — S

**CODE-23 — The import `FileReader` has no error handler**

- **Severity** — Low
- **Location** — `index.html:3471-3493`
- **Evidence** — Only `r.onload` is assigned; there is no `r.onerror`. If the read fails (permission revoked, file moved on a mobile file provider), nothing runs and `e.target.value = ''` has already cleared the input.
- **Impact** — Restore appears to do nothing at all, on the screen a user reaches precisely when their data is already at risk.
- **Recommendation** — Add `r.onerror = () =&gt; toast('Could not read that file');`.
- **Effort** — XS

**CODE-24 — 159 inline `style` attributes duplicate what the token and class system already provides**

- **Severity** — Low
- **Location** — `index.html` — 159 occurrences; representative clusters at `3300-3309`, `2031-2037`, `4195-4216`, `1287-1292`
- **Evidence** — Layout is re-declared inline inside JS template literals, e.g. `renderDataSummary()` at 3301 writes `style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 0"` per row, and 3305-3306 repeat `style="padding:2px 8px;font-size:11px;border-radius:6px"` on two buttons. Hard-coded pixel values (`8px`, `12px`, `6px`) appear inline while `:root` defines `--s2`, `--s3` and `--r-sm` for exactly these values (index.html:39-42).
- **Impact** — Deviates from "Use reusable classes" and "Avoid duplicated styles" in `knowledge/coding-standards.md`, and lets the design tokens drift out of force one template literal at a time.
- **Recommendation** — Do not do a sweep. Promote the repeated clusters (the data-summary row, the modal action row, the stat tile) to classes as those areas are next touched.
- **Effort** — M

---

## Clean Areas

- **Date and time-zone handling** — Clean. `toLocalISO()` (index.html:2192) is used everywhere with an explicit comment against `toISOString()`, `parseISO()` builds local dates, and range presets (2244-2258) use local month arithmetic consistently.
- **NaN / Infinity safety in arithmetic** — Clean. Every accumulator uses the `(+x.amount || 0)` idiom, `unnum`/`unmoney` (2197-2199) coerce with a `|| 0` fallback, and every division checked is guarded by a positive-denominator test (4191, 3546, 3574, 3656).
- **Secrets and logging** — Clean. The shipped `firebaseConfig` (1867-1874) is empty, no financial data is written to `console`, and no data leaves the device except the anonymous exchange-rate GET at 4596.
- **Dependencies** — Clean and minimal. No build system, no package manager, no bundled third-party code. Two remote resources, both optional and both with working fallbacks: the Firebase compat SDK (loaded only when configured, 1887-1906) and `open.er-api.com` (24 h cache with a stale-cache fallback, 4587-4612).
- **Offline behaviour of features** — Clean apart from CODE-10. The converter degrades explicitly (4665-4677), Firebase is skipped when unconfigured, and persistent storage is requested at boot (2104-2112).
- **Infinite-loop safety** — Clean. All four recurrence walks carry explicit guards (2350, 2928, 2948) and the month builder caps at 36 (4065).

---

## Technical Debt

- **The single-file architecture (CODE-11).** 5,522 lines in one file with one global scope is the root cost behind CODE-03, CODE-12, CODE-13 and CODE-14. Nothing here can be unit tested, and every review of every future change means re-reading the same file.
- **The absent schema contract (CODE-09, CODE-17).** No version field, ad-hoc migration inside `load()`, and two dead fields already baked into the persisted shape and the backup format. Every month this waits, more backup files exist in the wild that a future migration must handle blind.
- **Recurrence modelled as a mutable date (CODE-03).** The data model stores "the next occurrence" rather than "the schedule", so history is unrepresentable. Debt Planner, Savings Planner and any Reports module in `knowledge/project.md` will all need historical planned figures.
- **The cloud-sync module ships inert.** `firebaseConfig` is empty (1867-1874), so ~170 lines (1867-2077) plus a Settings card are unreachable in the released build, while `showFirebaseSetupGuide()` instructs users to edit `index.html` in a text editor and re-upload. It is neither a working feature nor absent — it is a half-feature that must be maintained.
- **No version control.** The repository is not a git repo. There is no way to bisect a regression, review a diff, or roll back a bad release of a file this size. This is the cheapest debt on the list to retire and it multiplies the cost of every other item.
- **Manual-only backup.** Export (3461-3469) is the sole recovery mechanism and it depends on the user remembering. Combined with CODE-01 and CODE-02, the application's durability story rests entirely on user discipline.

---

## Future Risks

- **At 10,000 transactions** the daily and dashboard renders (CODE-15) move from tens of milliseconds to a visible stall on every tap, and the serialised JSON approaches 1.5–2 MB — every single `save()` re-serialises and rewrites all of it, on the main thread, on every keystroke-completed action.
- **On a slow mobile device**, CODE-10 delays first paint behind a hanging network request, and the 5,522-line document must be parsed in full before anything renders. There is no code splitting and no lazy work; `renderDashboard()`, `calcSalary()` and four `initPeriodFilter()` passes all run synchronously at boot (5494-5509).
- **The first breaking schema change** will hit CODE-09 and CODE-08 together: no version to branch on, and the defaults-merge that was supposed to soften new fields does not work.
- **Turning cloud sync on** converts CODE-05 from latent to active for every multi-device user, and CODE-06 hides it while it happens.
- **The roadmap items in `knowledge/project.md`** — AI Budget Assistant, Debt Planner, Savings Planner, Investment Tracker, OCR — each add a collection, a screen and a rule set. Under CODE-11 and CODE-12 they all land in the same file and the same two functions. The file roughly doubles per major feature at the current pattern.
- **Storage eviction** on iOS Safari is acknowledged in the UI copy (index.html:1591) but the response to it is a manual export. If eviction happens between exports, CODE-02 ensures the user is not even told.

---

## Recommended Refactoring

The smallest set of structural changes that removes the most risk, in dependency order:

1. **Introduce a `store` seam and make writes fail loudly** — resolves CODE-01, CODE-02 and CODE-06, and creates the boundary CODE-11 needs. One object owning `load`/`get`/`mutate`/`save`, with the `try`/`catch`, the corrupt-blob quarantine and a visible failure banner inside it. Every existing `save()` call site keeps working unchanged. *Effort: S–M. Highest value per line changed in the whole codebase.*

2. **Ban persistence from the render path, and model recurrence as a schedule** — resolves CODE-03 and CODE-16, and removes the duplication in CODE-13 as a by-product. Stop mutating `p.date`; keep the anchor date immutable, extract the single `stepDate()` helper, and route all four consumers plus `renderDaySelected()` through `expandPlannedInRange()`. *Effort: M.*

3. **Harden the import boundary** — resolves CODE-04 and, with the four escaping fixes, CODE-07. Per-record shape validation in `validateImport()` is a contained ~40-line addition and it is the only place untrusted data enters the system. *Effort: S.*

4. **Add `schemaVersion` and an ordered migration list, and delete the dead fields while doing it** — resolves CODE-09 and CODE-17, and fixes the merge-order bug CODE-08 in the same edit. Do this before any further data-shape change, or the cost only rises. *Effort: S.*

5. **Index once per render pass** — resolves CODE-15. Build the `Map&lt;dateISO, entries[]&gt;` and the category-colour map at the top of `renderDaily()` and `renderDashboard()` and read from them in the loops. No API changes, no behaviour changes, purely local. *Effort: M.*

6. **Then, and only then, split the file** — the remaining half of CODE-11, plus CODE-12, CODE-14 and CODE-24. Extract `styles.css`, then `app.js`, then break `analyzeExpenses()` into a rule array and merge the two reorder implementations. Put the repository under version control before this step so the split is reviewable as a diff.

Do not rewrite. Steps 1–4 are additive or local, preserve backward compatibility as `CLAUDE.md` requires, and together retire the Critical and all four High findings.
