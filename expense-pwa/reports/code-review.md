# Principal Code Review Report — Income & Expense Tracker (PWA)

Reviewed: `expense-pwa/` — `index.html` (5,161 lines), `sw.js` (54), `manifest.json`, `README.md`
Reviewer role: Principal Software Engineer, pre-production review
Date: 2026-07-28

---

# Executive Summary

The code is better than its packaging suggests. Defensive decisions are visible and
deliberate — `toLocalISO()` exists specifically because `toISOString()` shifts dates
east of UTC, `confirmDialog()` replaces `confirm()` because iOS blocks it in installed
PWAs, `sw.js` uses `allSettled` because `addAll()` fails the whole install on one 404,
and `validateImport()` was clearly written after a malformed file crashed a render
pass. The comments record *why*, not *what*. That is senior-engineer behaviour.

What blocks production is narrower and more serious than general code quality: **the
persistence layer has three unguarded failure paths that end in silent data loss**,
and the app that owns a user's multi-year financial history has no version control,
no tests, and no module boundaries.

Ship-blocking work is roughly 11 hours. The rest is real but schedulable.

---

## Overall Code Quality Score

| Area | Score | Note |
|---|---|---|
| Architecture | 42 | One 5,161-line file, ~140 symbols in one scope, no modules |
| HTML | 65 | Semantic sections and ARIA on tabs; labels unassociated, no `<form>` |
| CSS | 82 | Genuine token system, consistent naming, minor drift |
| JavaScript | 63 | Correct logic, good comments; duplication and unguarded I/O |
| Performance | 60 | Adequate now; O(days × entries) render paths won't hold |
| Security | 55 | Escaping mostly right, but ~12 interpolation gaps on imported data |
| Maintainability | 48 | Four copies of the recurrence logic; no tests |
| Scalability | 45 | Single-doc cloud model and full-scan renders both cap out |
| **Overall** | **57 / 100** | |

---

## Strengths

- **Date handling is correct.** `toLocalISO()` is used everywhere instead of
  `toISOString()`, with the reason documented. This is the single most common bug in
  date-heavy apps and it has been avoided systematically.
- **`escapeHTML()` exists and is applied to every user-typed free-text field** —
  category names, notes, goal names, income type names, currency names, the signed-in
  email address.
- **The service worker is thoughtfully written.** Network-first so GitHub Pages
  deploys land immediately, `allSettled` so one missing asset can't destroy the cache,
  an explicit `res.type === 'basic'` guard so opaque cross-origin responses aren't
  cached, and a comment stating it never touches localStorage.
- **Recurring schedules have termination guards.** Every advance loop is bounded
  (`guard++ < 20000`, `< 10000`, `< 5000`) with a comment explaining the bound.
- **Deleting a goal contribution rolls back `recLastLogged`** to the most recent
  remaining contribution. That is a non-obvious consistency case, handled correctly.
- **`confirmDialog()` returns a Promise and cleans up its listeners** on every path —
  no leak across repeated confirmations.

---

## Critical Issues

### CRIT-1 — Corrupt localStorage silently wipes the user's data
`index.html:1809-1862`

```js
try {
  const raw = localStorage.getItem(KEY);
  if (raw) { const parsed = JSON.parse(raw); d = { ... }; }
} catch (e) {}          // ← swallowed
if (!d) d = { income: [], planned: [], actual: [], ... };
```

**Why it matters:** if the stored JSON is truncated or corrupted — an interrupted
write, a browser crash mid-`setItem`, a storage-layer fault — `JSON.parse` throws, the
catch discards the error, and the app boots with an empty database. The user sees
every entry gone with no explanation. **Then the first action they take calls
`save()`, which overwrites the still-recoverable raw string with `{}`.** Recovery
becomes impossible at that moment.

**Reproduction:** in DevTools, set `expense-tracker-v1` to `{"income":[` and reload.
The app opens clean. Add one expense. The original value is now unrecoverable.

**Fix:** on parse failure, copy the raw string to `expense-tracker-v1.corrupt.<ts>`,
surface a blocking message offering export of the raw blob, and refuse to auto-save
until the user chooses.

**Effort:** Small (~1.5h). **Priority: Critical.**

---

### CRIT-2 — `save()` has no error handling; quota exhaustion loses writes silently
`index.html:2079-2082`

```js
function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
  scheduleCloudSync();
}
```

**Why it matters:** `setItem` throws `QuotaExceededError` when the origin's
localStorage limit (5–10MB) is reached. Nothing catches it. The throw propagates out
of whatever click handler called `save()`, so the remaining statements — `renderIncome()`,
`renderDashboard()`, `toast('Income added')` — never run. The user sees no toast and
no new row, concludes the tap didn't register, and taps again. Every subsequent write
fails the same way. The app becomes read-only with no message.

Note also that `save()` is called from render paths (see MED-4), so this can fire
during a passive screen change, not just an explicit add.

**Reproduction:** fill localStorage to quota, then add an expense.

**Fix:** wrap in try/catch; on `QuotaExceededError` show a persistent banner
prompting an export, and surface actual usage (`updateStorageStatus()` already
computes it).

**Effort:** Small (~1.5h). **Priority: Critical.**

---

### CRIT-3 — Cloud data bypasses `load()`, skipping migration and defaults
`index.html:1958-1959`

```js
db = JSON.parse(cloudDbJson);
localStorage.setItem(KEY, cloudDbJson);
```

**Why it matters:** every safety mechanism in `load()` is skipped — the default
collections, the `settings.notifications` defaults, and the `type` → `typeId` income
migration. If the cloud document was written by an older build (or by a device that
had not yet run a migration), `db.goals`, `db.goalContributions` or
`db.settings.notifications` can be `undefined`. The very next line calls
`renderDashboard()`, which reaches `db.goals.forEach(...)` inside `analyzeExpenses()`
and throws `TypeError: Cannot read properties of undefined`. The dashboard renders
blank and stays blank.

`validateImport()` — which exists precisely to prevent this for file imports — is not
applied to the cloud path.

**Fix:** route cloud payloads through the same gate as file imports:
`validateImport(parsed)` → write to localStorage → `db = load()`. Three lines.

**Effort:** Small–Medium (~3h with the shape validation from HIGH-3).
**Priority: Critical.**

---

## High Priority Issues

### HIGH-1 — Recurring planned expenses destroy their own history
`index.html:2940-2956` (`autoAdvancePlannedRecurring`), `2909-2936` (`expandPlannedInRange`)

A recurring planned expense is stored as **one record whose `date` field is mutated
forward** past today on every boot. Past occurrences are not recorded anywhere, and
`expandPlannedInRange()` deliberately refuses to project backwards:

```
// (Backward projection is intentionally NOT done — occurrences before the
// stored date never happened, so drawing phantom cells there would be wrong.)
```

**Why it matters:** the comment is defensible in isolation, but combined with forward
mutation it means a monthly rent entered in January has, by July, a stored date of
July — and **January through June show zero planned rent**. The Dashboard's Planned vs
Actual for any past month is therefore wrong: actuals are present, the plan they were
measured against has vanished. The core comparison the app is built around silently
degrades over time.

**Reproduction:** create a monthly planned expense dated 2026-01-05. Reopen the app in
July. Set the dashboard range to "Last Month". Planned shows ₮0 for that category.

**Fix:** separate the *schedule* (frequency, anchor date, interval, end date) from its
*occurrences*. Occurrences are then derivable for any window, forward or backward,
without mutation. This also fixes MED-6 for free.

**Effort:** Large (~8h). **Priority: High** — correctness of the headline feature.

---

### HIGH-2 — XSS through imported backup files
~12 template sites interpolate imported values without `escapeHTML()`

Free-text fields are escaped correctly. Fields *assumed* to be machine-generated are
not — but every one of them is attacker-controlled once a backup file is imported,
and the README instructs users to store and re-import backups from email and cloud
drives.

Confirmed unescaped sites:

| Location | Expression |
|---|---|
| `index.html:3012` | `x.recFrequency`, `x.recIntervalDays`, `x.recEndDate` |
| `index.html:3023` | `cat?.group` |
| `index.html:3024`, `2807` | `x.date` |
| `index.html:3426` | `c.group` and `c.group.toLowerCase()` in a class attribute |
| `index.html:4007` | `v.group` |
| `index.html:4909` | `g.deadline` |
| `index.html:5135-5159` | `g.target`, `g.deadline`, `g.recIntervalDays`, `g.recAmount`, `g.recStartDate` — all inside `value="…"` |
| `index.html:5257-5292` | `item.date`, `item.amount`, `item.recIntervalDays`, `item.recEndDate` — all inside `value="…"` |
| `index.html:5197` | `c.date` |

The `value="…"` cases are the most exploitable: a `category.group` or `goal.deadline`
of `" onfocus="…` breaks the attribute and executes.

**Why it matters:** with Firebase cloud sync configured, executed script has access to
`db`, the Firestore handle and the authenticated session.

**Fix:** apply `escapeHTML()` at all listed sites and add a lint rule or a tagged
template helper so new interpolations are escaped by default.

**Effort:** Medium (~4h). **Priority: High.**

---

### HIGH-3 — `validateImport()` checks container types only, not element shapes
`index.html:2086-2100`

The function verifies that `income`, `planned`, `actual`, `categories`, `incomeTypes`
are arrays and that optional collections are arrays when present. It never inspects
the elements.

**Why it matters:** `{"categories":[{"name":"X"}], ...}` passes validation. Then
`renderCategoryList()` at line 3426 calls `c.group.toLowerCase()` on `undefined` and
throws — the Settings screen renders blank, and `drawPvA()` throws the same way on
the Dashboard. Both screens are dead until the user finds Reset All. A missing
`amount` instead produces `NaN` totals that propagate silently through every chart.

**Fix:** validate required fields per element type and coerce numerics. Reject the
import with a specific message rather than half-applying it.

**Effort:** Medium (~3h). **Priority: High.**

---

### HIGH-4 — Cloud sync will fail silently at scale and has no conflict resolution
`index.html:1983-2005`

Three compounding problems:

1. **Whole database in a single Firestore document.** Firestore's hard limit is 1MiB
   per document. A few years of daily entries plus goal contributions will approach
   it. The write then fails permanently.
2. **Failures are invisible.** `syncToCloud()` catches and calls `console.error` only.
   The UI continues to display "Last sync: <time>" from the previous success. A user
   who believes cloud sync is protecting them is not protected.
3. **Last-write-wins across devices.** `scheduleCloudSync()` debounces 1.5s and
   overwrites. There is no `updatedAt` comparison and no post-login listener, so two
   signed-in devices silently clobber each other.

**Fix:** split collections into subcollections or chunked documents; surface sync
failures in the UI with a retry; compare `updatedAt` before overwriting.

**Effort:** Large (~8h). **Priority: High** — but see the dependency note: this should
follow HIGH-1, since the storage schema changes there.

---

### HIGH-5 — `settings.notifications` defaults are defeated by the spread order
`index.html:1825-1835`

```js
settings: {
  theme: 'light',
  notifications: { enabled: true, daysAhead: 7, ..., ...(parsed.settings?.notifications || {}) },
  ...(parsed.settings || {})        // ← overwrites `notifications` wholesale
}
```

The trailing spread reassigns `notifications` from the raw parsed object, discarding
the merged defaults above it.

**Why it matters:** restoring an older backup whose `notifications` object predates
`showRecurring` or `daysAhead` yields `undefined` for those keys.
`renderNotifPrefs()` then renders unchecked boxes and a `<select>` with nothing
selected, so the user's preferences appear reset — and saving from that screen makes
it permanent.

**Fix:** move the `...parsed.settings` spread above the `notifications` key, or merge
explicitly.

**Effort:** Small (~1h). **Priority: High** — one-line fix, silent data-shape bug.

---

### HIGH-6 — No version control, no tests
The directory is not a git repository, and there is no test of any kind for ~3,700
lines of financial logic — salary deductions, recurrence arithmetic, 25 advisor rules,
period filtering.

**Why it matters:** every refactor recommended in this report is currently
irreversible and unverifiable. There is no way to bisect a regression or confirm that
unifying the recurrence logic preserved behaviour.

**Fix:** `git init` and commit before any other change in this report. Then add unit
tests for `computeNextRecurring`, `advancePlanned`, `expandPlannedInRange`,
`computeRange`, `calcSalary` and `unmoney`/`unnum` — all are pure and trivially
testable once extracted.

**Effort:** git init, Small (~30m). Test harness + first suite, Large (~8h).
**Priority: High** — the 30-minute half is a prerequisite for everything else.

---

## Medium Priority Issues

### MED-1 — The recurrence step logic exists in four places
`computeNextRecurring()` (2331-2340), `advancePlanned()` (2869-2874),
`upcomingPlannedDates()` (2890-2896), `expandPlannedInRange().stepForward` (2911-2919).

Four copies of the same `switch (frequency)` with the same `intervalDays || 14`
fallback. A fix applied to one — such as MED-2 below — must be applied to all four or
the app becomes internally inconsistent.

**Fix:** extract `stepDate(date, frequency, intervalDays)` and call it from all four.
This is the prerequisite for MED-2 and simplifies HIGH-1.

**Effort:** Medium (~3h).

### MED-2 — Monthly recurrence drifts at month end
`d.setMonth(d.getMonth() + 1)` on 2026-01-31 yields 2026-03-03, because February has
no 31st and JavaScript overflows. A monthly rent anchored on the 31st walks forward
through the calendar and eventually lands in the wrong month entirely.

**Probability: High** — the 31st, 30th and 29th are common rent and salary dates.

**Fix:** clamp to the last valid day of the target month. Apply once, in the extracted
`stepDate()` from MED-1.

**Effort:** Small (~1.5h, after MED-1).

### MED-3 — `wireIconGrid()` leaks a document listener per goal-edit
`index.html:5007-5011`

```js
document.addEventListener('click', (e) => { ... }, true);
```

`wireIconGrid('mGoalIconGrid', 'mGoalIcon')` runs on **every** `openGoalEditModal()`
call, adding a new capture-phase document listener each time. None are removed, and
each closes over a `grid` element that has since been replaced by
`editModalBody.innerHTML = …`. Open the goal editor twenty times and twenty listeners
run on every click in the app, all operating on detached DOM.

**Fix:** register the outside-click handler once, or remove it when the modal closes.

**Effort:** Small (~30m).

### MED-4 — Read paths mutate state and trigger cloud writes
`computeReminders()` (2354) calls `autoAdvancePlannedRecurring()`, which calls
`save()`, which calls `scheduleCloudSync()`. `computeReminders()` is itself called by
`updateBellBadge()` — invoked on init, on a 30-minute interval, and after most
mutations — and again by `openNotifModal()`. `renderExpenses()` also calls it directly.

**Why it matters:** opening the notification modal can write to localStorage and queue
a Firestore write. Behaviour becomes order-dependent and hard to reason about, and it
multiplies the blast radius of CRIT-2.

**Fix:** advance schedules once at boot and after explicit mutations; make
`computeReminders()` pure.

**Effort:** Medium (~2.5h).

### MED-5 — Render cost is O(days × entries)
- `renderCalendar()` (4236-4242): filters the entire source array once per day of the
  month — 31 full scans.
- `drawDailyStackedChart()` (4347-4355): filters the entire source once per day, up to
  90 days.
- `categoryColor()` (4131-4134) runs `db.categories.findIndex()` per chart segment.
- `db.categories.find()` appears inside per-entry loops in `drawPvA`, `renderExpenses`,
  `analyzeExpenses` and `renderDaySelected`.
- `analyzeExpenses()` runs ~25 rules, several scanning all of `db.actual`, on every
  dashboard render — including every filter change.

At a few hundred entries this is imperceptible. At the multi-year scale the app is
explicitly designed for, the Daily screen will visibly stall on every chip toggle.

**Fix:** build a `Map` index of categories once per render pass, and bucket entries by
date in a single pass instead of filtering per day.

**Effort:** Medium (~4h).

### MED-6 — Day-detail ignores projected planned occurrences
`index.html:4422` uses raw `db.planned`, while the calendar and stacked chart that
produced the clickable cell use `expandPlannedInRange()`. Tapping a projected future
occurrence therefore shows "No expenses on this day" beneath a cell that visibly
displays an amount.

**Fix:** use the same expanded list. Resolved automatically by HIGH-1.

**Effort:** Small (~1.5h standalone).

### MED-7 — No Content-Security-Policy; Firebase SDK loaded without SRI
`loadFirebaseSDK()` (1887-1906) injects three scripts from `gstatic.com` with no
`integrity` attribute, and the app ships no CSP meta tag. A CSP would also have
contained HIGH-2.

**Fix:** add a CSP meta tag; add SRI hashes or pin the SDK locally.

**Effort:** Small (~1.5h).

### MED-8 — Modals lack focus management
No focus trap, no `Escape` handler, no focus restoration, no `role="dialog"` /
`aria-modal`. Nine modals, including the confirm dialog guarding Reset All.

**Effort:** Medium (~3h for one shared controller).

---

## Low Priority Issues

- **LOW-1** — `sw.js:52`: `.catch(() => caches.match(e.request))` resolves to
  `undefined` on a cache miss while offline, and `respondWith(undefined)` surfaces as
  a network error rather than an offline page. Add an `index.html` fallback for
  navigation requests.
- **LOW-2** — `renderQuickAmountRow()` (5100) stores `v > 0 ? v : 0`, permitting a
  quick-amount button labelled `₮0` that does nothing when tapped. Filter zeros out.
- **LOW-3** — `dailyExcluded` is not persisted and is not cleared when switching
  Actual/Planned, so the stat strip totals change across a mode toggle with no visible
  cause.
- **LOW-4** — `uid()` is `Math.random().toString(36).slice(2,10) + Date.now().toString(36)`.
  Adequate for single-device use; `crypto.randomUUID()` is available and free.
- **LOW-5** — Magic numbers throughout: `1.5`/`1.2` OT multipliers, `11.5`/`10`
  SI/WHT defaults, `50000` field allowance, `5000` small-purchase threshold, `20000`/
  `10000`/`5000` loop guards, `MAX_DAYS = 90`. Hoist to a named config block —
  especially the tax rates, which change by legislation.
- **LOW-6** — `document.getElementById()` is called repeatedly for the same element
  inside single functions (`calcSalary`, the `sSave` handler). Cache the references.
- **LOW-7** — `parseISO()` (2194) does no validation; a malformed date string yields
  `Invalid Date` and propagates `NaN` through comparisons rather than failing loudly.

---

## Technical Debt

**Architecture** — One 5,161-line HTML file containing markup, ~1,170 lines of CSS and
~3,700 lines of JavaScript in a single global scope with roughly 140 top-level
symbols. There are no module boundaries, no build step, and no dependency management.
Every function can reach every piece of state, so nothing can be reasoned about or
tested in isolation. This is the root cause of most other entries in this report.

**Code Quality** — Four copies of the recurrence stepper (MED-1). Near-identical
`initCategoryReorder()` / `initIncomeTypeReorder()` (~60 duplicated lines). Repeated
`.filter(inRange).sort(...)` pipelines across five render functions. `renderSettings()`
re-renders five subsections whenever any one of them changes.

**Performance** — MED-5. Adequate today, degrades linearly with the data the app is
designed to accumulate.

**Security** — HIGH-2 (import XSS), MED-7 (no CSP, no SRI). The escaping discipline is
mostly right; the gaps are systematic rather than random, which makes them fixable in
one pass.

**Maintainability** — No tests over financial arithmetic. No version control. Sixteen
themes to keep in sync by hand. `renderDashboard` → `analyzeExpenses` is a 330-line
function containing 25 inline rules that cannot be tested individually.

**Scalability** — Single-document cloud model (HIGH-4) and full-scan renders (MED-5)
both cap out on the same axis: total entry count.

---

## Performance Problems

| Issue | Impact | Fix |
|---|---|---|
| Per-day array filtering in calendar and daily chart | O(days × entries); 31 and up to 90 full scans per render | Bucket by date in one pass |
| `categories.find()` / `findIndex()` inside per-row loops | O(rows × categories) | Build a `Map` once per render |
| `analyzeExpenses()` on every dashboard render | ~25 rules, several full scans, on every filter change | Memoise on `(from, to, db-version)` |
| `renderDaily()` redraws four sections per chip toggle | Full calendar + chart rebuild per tap | Redraw only affected sections |
| `renderSettings()` rebuilds five subsections | Drag-reorder handlers reattached on every keystroke path | Split into targeted renders |

---

## Security Risks

| # | Risk | Severity | Vector |
|---|---|---|---|
| 1 | XSS via unescaped interpolation of imported fields | High | Malicious or tampered backup JSON (HIGH-2) |
| 2 | No CSP | Medium | Amplifies #1; nothing constrains injected script |
| 3 | Firebase SDK from CDN without SRI | Medium | CDN compromise or MITM (MED-7) |
| 4 | Import applies before full validation | Medium | Malformed file bricks two screens (HIGH-3) |
| 5 | Full financial history in one Firestore doc | Low–Medium | Single credential compromise exposes everything (HIGH-4) |

Correctly handled and worth noting: Firestore rules in the setup guide are properly
scoped to `request.auth.uid == userId`; the config object being empty in source is the
right default; the service worker never touches localStorage.

---

## Maintainability Problems

1. Single file; no module boundaries (Architecture debt).
2. Recurrence logic duplicated four times (MED-1).
3. `analyzeExpenses()` — 330 lines, 25 inline rules, untestable individually.
4. `initCategoryReorder()` / `initIncomeTypeReorder()` — ~60 duplicated lines.
5. Tax rates and multipliers hardcoded at their use sites (LOW-5).
6. Sixteen themes maintained by hand.
7. No tests, no CI, no version control (HIGH-6).

---

## Scalability Risks

- **Firestore 1MiB document cap** (HIGH-4) — a hard wall, not a slowdown.
- **localStorage 5–10MB origin cap** — combined with CRIT-2, hitting it means silent
  write failure.
- **Full-scan render paths** (MED-5) — linear degradation with entry count.
- **Feature extensibility** — adding a second currency, a second account or shared
  budgets requires touching the single global `db` object from ~40 call sites.

---

## Potential Future Bugs

| # | Predicted bug | Probability | Why | Reproduction | Prevention |
|---|---|---|---|---|---|
| 1 | Monthly schedule anchored on the 31st drifts into the wrong month | High | `setMonth()` overflow (MED-2) | Monthly planned expense on 2026-01-31; advance twice | Clamp to last valid day in `stepDate()` |
| 2 | App becomes read-only with no message when localStorage fills | High | CRIT-2 | Fill quota, add an entry | try/catch + persistent banner |
| 3 | Planned vs Actual shows ₮0 planned for past months | High (already occurring) | HIGH-1 | Monthly plan from January, view "Last Month" in July | Schedule/occurrence split |
| 4 | Dashboard blanks permanently after a cloud reload | Medium | CRIT-3 — `db.goals` undefined → `TypeError` in `analyzeExpenses` | Sign in against a cloud doc written by an older build | Route cloud through `load()` |
| 5 | Notification preferences appear reset after restoring an old backup | Medium | HIGH-5 spread order | Import a backup whose `notifications` lacks `showRecurring` | Fix merge order |
| 6 | Settings screen renders blank after importing a hand-edited file | Medium | HIGH-3 — `c.group.toLowerCase()` on undefined | Import categories without `group` | Element-level validation |
| 7 | Click handling slows and misfires after repeated goal edits | Medium | MED-3 listener leak | Open the goal editor ~20 times | Register once / remove on close |
| 8 | Daily screen stalls on chip toggle | Medium (grows with data) | MED-5 | Several thousand entries, toggle a category | Index by date and category |
| 9 | Two devices silently overwrite each other's entries | Medium (only if both signed in) | HIGH-4 last-write-wins | Add on device A, then on device B | Compare `updatedAt` before write |
| 10 | Tapping a projected planned day shows "No expenses on this day" | High (already occurring) | MED-6 | Recurring plan, tap a future calendar cell | Use the expanded list |

---

## Recommended Refactoring

1. **`git init` and commit.** Prerequisite for everything below. (~30m)
2. **Extract a storage module** — `load` / `save` / `validate` / `migrate` with real
   error handling. Resolves CRIT-1, CRIT-2, CRIT-3, HIGH-3, HIGH-5 behind one
   boundary. (~6h)
3. **Extract `stepDate()`** and collapse the four recurrence steppers into it, then
   fix the month-end clamp once. (~4h)
4. **Split schedules from occurrences** — the HIGH-1 model change. Removes the
   mutation-on-read pattern and fixes MED-6. (~8h)
5. **One escaping pass** over the twelve unescaped interpolation sites, plus a CSP.
   (~5h)
6. **Split the monolith into ES modules** — `storage`, `dates`, `recurrence`,
   `salary`, `advisor`, `charts`, `screens/*`, `ui/modal`. No behaviour change; makes
   everything above testable. (~12h)
7. **Add unit tests** for the pure functions extracted in steps 3–4 and for
   `calcSalary`, `computeRange`, `unmoney`/`unnum`. (~8h)
8. **Index-based rendering** to replace the per-day filters. (~4h)

---

## Estimated Refactoring Effort

| Band | Items | Hours |
|---|---|---|
| Ship-blocking | CRIT-1, CRIT-2, CRIT-3, HIGH-5, git init | ~11 |
| Security & correctness | HIGH-2, HIGH-3, MED-7, MED-1, MED-2, MED-6 | ~15 |
| Data model | HIGH-1, MED-4 | ~11 |
| Architecture & performance | Module split, tests, MED-5, MED-3 | ~25 |
| Cloud & UX | HIGH-4, MED-8, LOW-* | ~14 |
| **Total** | | **≈76 hours** |

**Overall classification: Large.**

Production readiness: **not ready today.** The eleven hours in the ship-blocking band
are what stand between this and a defensible release; everything after that is
schedulable improvement rather than risk.
