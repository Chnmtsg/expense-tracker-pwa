# Code Review — Expense Tracker PWA

Scope: `D:\3_Claude\PowerApps\expense-pwa\index.html` (12,385 lines: CSS 74–2520, markup 2522–3574, one inline script 3575–12383) and `D:\3_Claude\PowerApps\expense-pwa\sw.js`. I reviewed the files as they are on disk, including the uncommitted changes. UI and UX design belong to the ui-review role. This report covers only UX defects that have a cause in the code.

## Executive Summary

The money layer is careful work. Money is stored as whole tugrik, rounding is defined at a small number of named boundaries, and dates are always built from local components. The schema is versioned with append-only migrations. Unreadable data is quarantined, and every import is validated record by record and rejected whole if anything fails. Nearly every write reports its real outcome to the user. The biggest risk is that each window keeps its own in-memory copy of the database and writes the whole thing back without checking what is already stored. With two windows open, one silently overwrites the other's records. A background tab can even do it on its own through the 30-minute reminder timer. Beyond that, one chart is wrong for long date ranges, a few smaller defects can be reproduced, and the main structural debt is a single file with global mutable state.

## Overall Score

**58 / 100** (band 40–59).

One Critical finding (CODE-01, silent loss of financial records) blocks release, so the score cannot sit in a "usable" band. It is at the top of its band because the Critical and High fixes are both small (S and XS), and the rest of the data layer is unusually well defended.

## Findings

### Critical

**CODE-01 — A second window or tab silently overwrites records saved by the other**

- Severity: Critical
- Location:
  - `D:\3_Claude\PowerApps\expense-pwa\index.html:3921` (`let db = load()`, read once per page)
  - `:4407-4434` (`writeDb`/`save` serialise the in-memory `db` over the whole key)
  - `:12350` and `:5872-5873` (the 30-minute `setInterval` → `maybeFireOSNotifications()` → `save()`)
  - `:4468-4471` (`flushPendingSave` on `pagehide`/`visibilitychange`)
- Evidence:
  - The database is read from localStorage once, at boot. Every write replaces the entire stored copy with whatever this page holds in memory.
  - Nothing listens for the `storage` event: a search for `addEventListener('storage'`, `BroadcastChannel` and `navigator.locks` finds nothing.
  - `writeDb` does not check whether the stored copy changed since it was loaded.
- Impact:
  - Window A loads. Window B loads and records an expense. Window A then records anything at all, and B's expense is gone from storage with no warning.
  - Window A needs no user action to cause this. If notification permission is granted and something urgent is due, the interval timer calls `save()` once a day from a stale background tab.
  - Ordinary setups trigger it: the installed PWA plus a browser tab on Android, or two desktop tabs.
  - This is silent data loss in a finance app.
- Recommendation:
  - Store a revision counter in the database. `writeDb` compares the stored revision with the one this page loaded. If they differ, it refuses the write, reloads (`db = load()` then `navigate(<active screen>)`), and tells the user.
  - Add a `storage` listener on `KEY` that does the same reload, so the stale window refreshes before it writes.
  - Both changes go through the single existing write path.
- Effort: S

### High

**CODE-02 — The Monthly Trend drops the newest months for any range longer than 37 months, while still labelled "All time"**

- Severity: High
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:8416-8422` (the month-list loop); label at `:8400`
- Evidence:
  - The month list starts at the earliest month and stops at `if (months.length > 36) break;`. With more than 37 months of data, it keeps the oldest 37 and discards everything after.
  - The card heading still reads "All time" (`rangeLabel = 'All time'`), or the custom range the user picked.
  - The probe in `tools/harness/perf.js` seeds exactly 36 months, so it never reaches this case.
- Impact:
  - A user with more than three years of history, or anyone choosing a custom range that spans more than three years (possible today), sees a chart of their oldest years.
  - The recent months they care about most are missing, under a label that says nothing was left out.
- Recommendation: Cap from the end of the range instead. Clamp the start to `end − 36 months`, and change the label to say the chart shows the latest 36 months.
- Effort: XS

### Medium

**CODE-03 — Turning off "Debt due dates" in Settings is never saved and has no effect**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:7519-7520`; checkbox at `:7499`; read at `:7515`
- Evidence: Change listeners are attached to `['notifEnabled','notifDaysAhead','notifShowPlanned','notifShowGoals','notifShowRecurring']`. `notifShowDebts` is not in that list. `savePref` reads the checkbox, but only when one of the other five controls changes.
- Impact: The user unticks debt reminders, but the bell keeps showing them, `updateBellBadge` is not called, and the box is ticked again after a reload.
- Recommendation: Add `'notifShowDebts'` to the listener list.
- Effort: XS

**CODE-04 — The goal editor changes the record before validating, so a cancelled edit is persisted by the next save**

- Severity: Medium
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:11892-11903`
- Evidence:
  - `g.name`, `g.target`, `g.icon`, `g.deadline` and `g.notes` are assigned at `:11892-11896`.
  - The recurring-schedule checks that can still reject the edit (`return` at `:11902` and `:11903`) run after those assignments.
  - `closeEditModal()` (`:11870`) does not undo anything.
- Impact:
  - The user changes a goal's target, picks a frequency without an amount, sees "Enter a recurring amount", and presses Cancel.
  - The new target stays in memory, shows on the next render, and is written by the next unrelated `save()`. The user is never told.
- Recommendation: Read and validate every field into local variables first, and assign to `g` only after all checks pass. The debt branch at `:11936-12049` already works this way.
- Effort: XS

**CODE-05 — Analytics and the Monthly Trend rescan whole collections once per day or per month, and repeat it on every tap**

- Severity: Medium
- Location:
  - `D:\3_Claude\PowerApps\expense-pwa\index.html:8632-8634` (`renderCalendar`: one full `source.filter` per day of the month)
  - `:8793` (`drawDailyStackedChart`: one full filter per day, up to 90)
  - `:8430-8431` (`drawMonthlyTrend`: two full filters per month, with a `parseISO` allocation per record)
  - Re-run on every chip tap (`:8759`) and day tap (`:8692`, `:8868`)
- Evidence: One `renderDaily()` makes about 120 full passes over `db.actual`. `renderCalendar` ignores the date filter, so narrowing the range does not reduce the cost. The comments at `tools/harness/perf.js:10-14` and `:178-196` acknowledge this cost and defer it.
- Impact: At 10,000 transactions, each Analytics tap does more than a million record comparisons on a phone. The trend does 37 × n `Date` allocations per Dashboard render on All Time.
- Recommendation: Bucket the source once per render into a `Map` from date (or month) to total, and look values up from it. This is one small helper shared by the three functions. No library is needed.
- Effort: S

**CODE-06 — One 12,000-line document with global mutable state, and UI handlers that change storage state directly**

- Severity: Medium
- Location:
  - `D:\3_Claude\PowerApps\expense-pwa\index.html:3575-12383`
  - Globals: `db` (`:3921`), `expMode`, `editCtx`, `calDate` (`:8502`), `dailyMode`/`dailyExcluded` (`:8499-8501`), and the `cloudSync*` flags (`:4122-4134`)
  - Direct mutations from click handlers, for example `:6442`, `:6932`, `:7043-7044`, `:9804-9805`, `:10703-10708`, `:12120`
- Evidence:
  - Every handler pushes into, filters or splices `db.*` and then calls `save()` itself.
  - There is no data-access module. coding-standards.md says "Avoid global variables" and "Prefer reusable modules".
  - The file is so tightly ordered at load time that its own comments warn against moving statements (`:3755-3782`, `:3945-3949`, `:4506-4515`).
- Impact: Every new screen or write path has to rediscover these load-order constraints and the save-and-report contract. The script's statement order is itself a failure mode, which is why comments like these exist.
- Recommendation: Do this step by step, not as a rewrite:
  1. Inside the same file, gather the mutations into one store object (for example `store.add(collection, record)`, `store.remove(collection, id)`, `store.update(...)`) that owns `save()` and returns its outcome.
  2. Move handlers onto it one screen at a time.
  3. Then move the script to an external file (see CODE-10).
- Effort: L

**CODE-07 — Two functions far exceed "keep functions small"**

- Severity: Medium
- Location:
  - `D:\3_Claude\PowerApps\expense-pwa\index.html:11881-12263`: the `#editModalSave` click handler, about 380 lines with seven `editCtx.kind` branches (goal, debt, debtSettle, debtPayment, logPlanned, contribution, income/expense)
  - `:10161-10712`: `renderDebts`, about 550 lines
- Evidence: One listener holds the validation and the write for seven different record types, which goes against coding-standards.md "One responsibility per function". CODE-04 sits in one of those branches, unnoticed beside six others.
- Impact: High chance of edits interfering with each other, and the branches cannot be tested on their own.
- Recommendation: Split the save handler into a table of `{ kind: handlerFn }` with one function per kind; the listener only dispatches. Split `renderDebts` into a totals renderer and a per-card renderer.
- Effort: M

### Low

**CODE-08 — Comments use line coordinates and unenforced counts, which the coding standard forbids, and several are already wrong**

- Severity: Low
- Location:
  - `D:\3_Claude\PowerApps\expense-pwa\index.html:3939` ("registered ~2,650 lines further down"; the `#importFile` listener is at `:7605`, about 3,650 lines below)
  - `:3763` ("roughly 5,000 lines")
  - `:7377` ("on the :1117 precedent", a bare line number)
  - `:3765`, `:3775`, `:4014`, `:4765`, `:4951`, `:4961`, `:7450`, `:12334`
  - The documentation for `debtAnnualCostRate` (`:9957-10016`) sits above `debtTermDays` (`:10032`), not above its own function (`:10038`)
- Evidence: coding-standards.md: "Reference code by function, selector or id — never by line number. A cross-file reference is a name, not a coordinate." Two of the coordinates listed are already off by thousands of lines.
- Impact: The file's comments are its design record, and these ones mislead the next person who reads them.
- Recommendation: Replace each coordinate with the function or id it points to, and move the misplaced doc block onto `debtAnnualCostRate`.
- Effort: S

**CODE-09 — The comment above `load()` says it is "TOTAL", but it only checks the shape of `categories`**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:3925` (the claim) against `:3989-4019` and `:4047`
- Evidence:
  - `income: parsed.income || []` (and the same for every other collection) passes through any truthy value that is not an array.
  - A stored `{"schemaVersion":2,"income":{}}` parses, skips migration, and then throws at the first `db.income.filter` in `renderDashboard`. That throw comes from the `navigate('dashboard')` near the end of the init block (`:12372`), so service-worker registration and Firebase init never run.
  - This can only be reached by tampering with localStorage directly or by a future write bug.
- Impact: Either the comment is false or the guarantee is missing, and the boot-crash class it describes can return through the other collections.
- Recommendation: In `load()`, apply `Array.isArray(x) ? x : []` to every collection, or quarantine when any collection is not an array.
- Effort: XS

**CODE-10 — Some stored values reach `innerHTML` unescaped, and the CSP cannot back this up because it allows inline script**

- Severity: Low
- Location:
  - `D:\3_Claude\PowerApps\expense-pwa\index.html:6479` (`${x.date}`)
  - `:6975` (`x.recFrequency`, `x.recEndDate`)
  - `:7018`/`:7023` (`dateLabel`)
  - `:9740` (`${g.deadline}`)
  - CSP `script-src 'unsafe-inline'` at `:19`
- Evidence:
  - These fields are safe today only because import and cloud validation regex-check them (`:4605`, `:4629`, `:4672`).
  - The CSP comment (`:6-10`) says escaping is the only real defence.
  - The markup has no inline `on*=` handlers (searched: 0 matches), so the only reason for `'unsafe-inline'` is that the script itself is inline.
- Impact: This is defence in depth, not a live exploit. Any future write path that skips the validator turns these fields into an XSS sink in a finance app.
- Recommendation: Wrap these fields in `escapeHTML`. Separately, moving the script to an external `app.js` (cached by `sw.js`) lets `'unsafe-inline'` be removed from `script-src`.
- Effort: XS (escaping); S (external script)

**CODE-11 — The drag-to-reorder logic is copied for categories and income types**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:7144-7189` (`initIncomeTypeReorder`) and `:7265-7321` (`initCategoryReorder`)
- Evidence: The two pointer state machines are the same apart from the container id and the array; one even comments "Same index-mismatch guard as initCategoryReorder()". Both also ignore the return value of `save()`.
- Impact: A fix applied to one will drift away from the other, which coding-standards.md "Avoid duplication" is meant to prevent.
- Recommendation: Write one `initReorder(containerId, getList, editingId)` and call it from both places.
- Effort: S

**CODE-12 — Reset All does not re-apply the default theme, and its confirmation does not mention goals or debts**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:7708-7721`
- Evidence:
  - After `db = load()`, `applyTheme` is not called. The import path (`:7663`) and the cloud path (`:4265`) both call it.
  - The prompt reads "Delete ALL data (income, expenses, categories, salary history)?", but goals, contributions, debts and payments are deleted as well.
- Impact: The old theme stays until the next reload, and the user is not told that goals and debts will be destroyed.
- Recommendation: Call `applyTheme(db.settings.theme || 'light')`, and list every collection in the prompt.
- Effort: XS

**CODE-13 — The service worker's background refresh does not wait for the cache write, although its comment says it does**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\sw.js:78-87` against the comment at `:58-61`
- Evidence: `cache.put(e.request, res.clone())` is called but its promise is not returned, so the promise passed to `e.waitUntil` can settle before the write finishes.
- Impact: On a page that closes quickly, a new deploy may not land in the cache, which is the exact case the comment says is handled.
- Recommendation: `return cache.put(...).then(() => res)`.
- Effort: XS

**CODE-14 — The optional Firebase SDK is pinned to an old version and loaded from a CDN without integrity checks**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:4146-4150`; CSP allows `https://www.gstatic.com` at `:19`
- Evidence: `firebasejs/10.7.1` scripts are added with no `integrity` attribute. This code is inactive while `firebaseConfig` is empty (`:4113-4120`).
- Impact: Once cloud sync is configured, a third-party script runs with full access to financial data, and nothing verifies what was delivered.
- Recommendation: Before enabling sync, pin a current version and add `integrity` plus `crossorigin`, or serve the SDK from the same origin.
- Effort: XS

**CODE-15 — A goal contribution can be saved against a goal that was deleted while the sheet was open**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html:12152-12159`
- Evidence: The `contribution` branch pushes `{ goalId: editCtx.goalId }` without checking that the goal still exists. The `debtPayment` branch (`:12097-12098`) checks for the debt for exactly this reason.
- Impact: An orphaned contribution that never shows on any card, but still counts in the Data Summary.
- Recommendation: Use the same `find`-then-close guard as the debt payment branch.
- Effort: XS

### Review areas

- **Correctness of Money:** Mostly clean. Money is integer tugrik (`:5081-5098`), the decimal guard is in `formatMoneyInput` (`:5109`), `moneyValue` handles values on the way into inputs, rounding is single-site in `calcSalary` (`:6334`) and `debtInterestPaid` (`:9933`), and every division is guarded. The exception is CODE-02.
- **Dates and time zones:** Clean. Dates go through `toLocalISO`/`parseISO` everywhere, and day differences use `Math.round`, which handles DST.
- **Data and Persistence:** The schema is versioned with migrations (`:3641-3703`), unreadable data is quarantined, and import and cloud data are validated (`:4598-4931`). Offline works through the service-worker app shell and localStorage. Defects: CODE-01, CODE-04 and CODE-09.
- **Architecture:** CODE-06.
- **Maintainability:** CODE-07, CODE-08 and CODE-11.
- **Error Handling:** Strong. Failed writes raise a banner and `savedToast`, there is a top-level `reportFatal`, and the import `FileReader.onerror` is handled. No silent swallowing was found beyond deliberate preference writes (`rememberUiPref`).
- **Security:** CODE-10 and CODE-14. Nothing sensitive is logged beyond `console.error` of exceptions.
- **Performance:** CODE-05. The Dashboard is skipped while hidden (`:8153`), and the heat-map style is read once per render.
- **Reliability and Scalability:** At 10,000 transactions the blob is roughly 1–2 MB (estimated, not measured), well under the ~5 MB localStorage quota. The first things to break are CODE-05 on a slow phone and CODE-02 after three years.
- **Initial load:** Could not be measured with read-only tools. The whole 12k-line document, all 16 theme blocks included, is parsed on every cold start, but only the Dashboard is rendered and nothing is fetched at boot (`:12360-12363`).

## Technical Debt

- **Whole-database writes.** Every `save()` stringifies and synchronously writes the entire database to one localStorage key (`:4419`), on the main thread. This is fine today, but the cost grows with history, and it is the reason CODE-01 loses whole records rather than single fields.
- **Cloud sync stores the whole database as one Firestore document** (`:4325-4328`), last write wins. Firestore documents are limited to 1 MiB, so at somewhere around 8,000–10,000 records sync will start failing permanently. This blocks the Cloud Sync item in knowledge/project.md's Long-term Vision.
- **Planned series track progress with a single high-water mark (`recLastDone`), not a per-occurrence ledger** (`:6867-6886`, documented). "Paid" over-reports when occurrences are logged out of order. Any future Reports module that needs per-occurrence settlement will need a schema migration.
- **Comments are dense with process history** (references to WORK-nn, ARCH-1, "ruling C5", "round 7") that cannot be understood without records kept outside the file. Many blocks are several times longer than the code they describe. This overlaps with CODE-08 and raises the cost of every read.
- **Currency is hard-wired** into `fmt`/`fmtCompact` (`:4997`, `:5055`) and the "whole tugrik" rule. The Investment Tracker in the Long-term Vision will need a currency field and a migration.
- **Structure:** CODE-06 and CODE-07.

## Future Risks

- **Multi-device sync:** Once Cloud Sync is enabled, CODE-01's lost-update problem moves from tabs to devices, under last-write-wins over a single document.
- **Long histories:** Users with more than three years of data hit CODE-02, and every Analytics interaction slows down in line with total history (CODE-05).
- **Reports and Notifications (roadmap):** Both will need to read the same data that is currently reached through globals and per-screen filters. Without a store layer (CODE-06), each new module adds another copy of the filtering and save-reporting logic.
- **Planned-series loop guards:** `plannedOccurrences` (5,000 steps, `:6718`) truncates a daily plan anchored about 13.7 years back, and it only logs a console warning.

## Recommended Refactoring

These are the smallest structural changes that remove the most risk, in order:

1. **Revision-checked writes plus a `storage` listener in `writeDb`/`load`** (CODE-01). One function changes, and it closes the release blocker. Effort: S.
2. **One date-bucketing helper** shared by `drawMonthlyTrend`, `renderCalendar` and `drawDailyStackedChart`, with the month cap clamped from the end of the range (CODE-02, CODE-05). Effort: S.
3. **Validate-then-assign in every edit branch**, delivered as part of splitting `#editModalSave` into one handler per kind behind a dispatch table (CODE-04, CODE-07, CODE-15). Effort: M.
4. **A store object inside the existing file** that owns all mutations and `save()` reporting, with screens moved onto it one at a time (CODE-06, CODE-11). Effort: L.
5. **Move the script to an external `app.js`** in the service-worker cache, then drop `'unsafe-inline'` from `script-src` (CODE-10). Effort: S.
6. **Quick fixes:** add `notifShowDebts` to the listener list (CODE-03), make `load()` coerce every collection (CODE-09), re-apply the theme on Reset (CODE-12), and chain `cache.put` in the service worker (CODE-13). Effort: XS each.
