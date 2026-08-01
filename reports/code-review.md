# Code Review — Round 4

## Executive Summary

The application is in materially better shape than the previous round described. Both Criticals from round 3 are genuinely closed: `okSave` is declared and assigned in both branches (`index.html:6790`, `:6803`, `:6847`), and I re-ran the attribute-escaping question by hand across every interpolation site in the file — every record field reaching an HTML attribute value is wrapped in `escapeHTML()`, `fmt()`, `categoryColor()` or `recInterval()`. The horizon split (`aggregationEnd`/`listingEnd`), the single `stepDate` recurrence engine, the `recInterval` clamp, the delegated icon-grid listener and the stale-while-revalidate worker all landed as described and I could not fault their logic. The single biggest risk is that the batch that closed those defects introduced a new instance of the exact class it was fixing: the force-clear path in Settings calls `savedToast(ok, …)` and then unconditionally overwrites it with a success toast (`index.html:4568` then `:4574`), so a failed destructive write still tells the user it worked — and the seventh delete path, category delete, was missed by the `save()`-return sweep entirely. No Critical and no High findings; six Mediums and six Lows.

## Overall Score

**90 / 100.** The conventions put "no Critical or High findings" in the 90-100 band, and after verifying both round-3 Criticals against source I cannot raise one. It sits at the bottom of that band, not the top: six Medium findings remain, two of them are regressions or omissions in work that landed this round, and one is a validator gap of precisely the class WORK-40 was written to close.

---

## Findings

### Critical

None. Both round-3 Criticals verified closed against source.

### High

None.

### Medium

**CODE-01 — Force-clear reports success even when the write failed**

- Severity: Medium
- Location — `expense-pwa/index.html:4566-4574` (`renderDataSummary`, the `[data-clear-idx]` handler)
- Evidence — The handler runs `const ok = save();` … `savedToast(ok, 'Cleared');` at `:4568`, then five lines later runs `toast(\`${r.label} cleared\`);` at `:4574` with no condition. `toast()` replaces the toast element's `textContent` and resets the timer, so on a failed write the message "Not saved — see the banner at the top" is on screen for microseconds before being replaced by "Income entries cleared". This is one of the six delete paths WORK-38 was approved to fix, and the fix is defeated on the same code path that applies it.
- Impact — The user is told a destructive operation succeeded when nothing reached storage. The in-memory collection is empty, the list renders empty, and the data reappears on reload. The save-error banner is up, but the last thing the user read said the clear worked. This is the exact contract `savedToast` exists to keep, stated at `index.html:2685-2689`.
- Recommendation — Delete line 4574. `savedToast(ok, \`${r.label} cleared\`)` at 4568 already says everything the second toast says.
- Effort: XS

**CODE-02 — Category delete is a seventh delete path and does not check `save()`**

- Severity: Medium
- Location — `expense-pwa/index.html:4692-4701` (`renderCategoryList`, the `[data-del-cat]` handler)
- Evidence — `db.categories = db.categories.filter(...); save(); renderSettings(); renderDashboard();` — the return value is discarded and no toast is emitted at all. Every other destructive path in the file now ends in `savedToast(ok, …)`: income `:3889`, expense `:4282`, income type `:4421`, goal `:6326`, contribution `:6596`, data summary `:4566`. This one was outside the six that were counted.
- Impact — Deleting a category is destructive and irreversible (the confirm text at `:4696` warns that existing expenses will show "Unknown"). On a failed write the user gets no message at all, and the category returns on reload while the entries that were re-pointed at "Unknown" appear to have been re-pointed back. It is also the only delete in the app that gives no confirmation on success, which is an inconsistency a user will notice.
- Recommendation — `const ok = save(); renderSettings(); renderDashboard(); savedToast(ok, 'Category deleted');`
- Effort: XS

**CODE-03 — The import validators do not check the two recurrence cursor fields the engines read**

- Severity: Medium
- Location — `expense-pwa/index.html:2738-2754` (`recurrenceProblem`), `:2766-2783` (`goalProblem`); consumed at `:4145` (`nextPlannedDue`) and `:3186` (`computeNextRecurring`)
- Evidence — `recurrenceProblem()` validates `recFrequency`, `recIntervalDays` and `recEndDate`. `goalProblem()` adds `recAmount`, `recStartDate` and `deadline`. Neither validates `recLastDone` (planned) or `recLastLogged` (goals), and those are the two fields the recurrence walks actually pivot on:
  - `nextPlannedDue` at `:4145-4152` does `const done = p.recLastDone || ''; while (iso <= done && guard++ < 20000)`. A `recLastDone` of `"zzz"` compares greater than every ISO date, so the walk runs all 20,000 iterations on every `updateBellBadge()` and returns a date roughly 54 years out.
  - `computeNextRecurring` at `:3186` does `parseISO(r.lastLogged)`; `parseISO` (`:2988`) splits on `-` and maps to `Number`, so a non-ISO string yields `new Date(NaN, NaN, undefined)`. `toLocalISO` of that is the string `"NaN-NaN-NaN"`, which is then rendered on the goal card at `:6277` and used at `:3283` as `parseISO(nextDate) - parseISO(today)` → `NaN` → the reminder reads "In NaNd" at `:3327`.
- Impact — This is the ₮NaN class WORK-40 closed, reappearing through the sibling field on the same records, plus a 20,000-iteration walk per planned entry per badge refresh. Reachable only through an imported or hand-edited file — the same precondition as the finding it mirrors.
- Recommendation — Two lines. In `recurrenceProblem`, reject a present-but-non-ISO `recLastDone`; in `goalProblem`, the same for `recLastLogged`. Both already have `ISO_DATE_RE` in scope and the `'x' in r && r.x != null && !ISO_DATE_RE.test(r.x)` idiom is used three lines above each.
- Effort: XS

**CODE-04 — The exchange-rate cache is the one unguarded `localStorage` pair left**

- Severity: Medium
- Location — `expense-pwa/index.html:5914-5915` and `:5931` (`fetchRatesUSDBase`)
- Evidence — Two problems in one function that `rememberUiPref` (`:3077`) was introduced to prevent:
  - `const raw = localStorage.getItem(RATES_CACHE_KEY); const cached = raw ? JSON.parse(raw) : null;` sits **outside** the `try`. A truncated cache entry throws out of `fetchRatesUSDBase`, the caller's `catch` at `:6002` shows "❌ Could not fetch rates", and nothing ever clears the bad entry — the converter is permanently dead until the user clears site data.
  - `localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(record));` at `:5931` is inside the `try` whose `catch` at `:5933` returns `cached` or rethrows. In Safari private browsing `setItem` throws unconditionally, so a network fetch that **succeeded** is discarded and the user is told rates could not be fetched, with `cached` null on first use.
- Impact — In private browsing the converter never works even with a live connection; after any partial write the converter never works again. Both are silent to the user apart from a message that names the wrong cause.
- Recommendation — Wrap the read in `try { … } catch { localStorage.removeItem(RATES_CACHE_KEY); }` and route the write through `rememberUiPref` (or an equivalent guarded write). The rate cache is a convenience, exactly the category `rememberUiPref` exists for.
- Effort: XS

**CODE-05 — `reportFatal` produces a banner that contradicts itself**

- Severity: Medium
- Location — `expense-pwa/index.html:6930-6942` (`reportFatal`) against the static markup at `:1451-1458`
- Evidence — The banner's headline is hard-coded markup: `<b>Your saved data could not be read.</b> The app has started empty.` `reportFatal` reuses that element and writes only `#dataErrorNote`, whose text is " Something went wrong while loading your data. Your saved data has not been changed — restore a backup if the app stays broken." The rendered banner therefore reads, in one paragraph: *data could not be read → app started empty → data has not been changed*. For a `window.onerror` raised by anything at all — a click handler, a render, a promise rejection — none of the first two clauses is true.
- Impact — The app's loudest, non-dismissible alarm makes three claims about the user's financial history, two of them false, and the two halves disagree. The rational response to the headline is to restore or reset, which destroys good data. The Chief Architect declined to create work for `reportFatal`'s bluntness and recorded it as a risk (ruling C5), but the self-contradiction between the fixed headline and the note is a separate, concrete defect and the standing rule from that same ruling — the `#dataErrorBanner` text is reserved for database load/parse failure — is being violated by this path today.
- Recommendation — Give `reportFatal` its own banner element with its own words, as ruling C5 prescribes. If that is too much for now, the minimum is to have `reportFatal` also rewrite the `<b>` headline, so the banner makes one claim rather than three.
- Effort: S

**CODE-06 — The Monthly Trend re-parses every record once per month bucket**

- Severity: Medium
- Location — `expense-pwa/index.html:5370-5379` (`drawMonthlyTrend`)
- Evidence — `months.map((mo) => { const inMonth = (x) => { const d = parseISO(x.date); … }; const inc = db.income.filter(inMonth)…; const exp = db.actual.filter(inMonth)…; })`. `months` is capped at 36 (`:5366`). `parseISO` (`:2988`) does a `split`, a `map(Number)` and a `new Date` per call. So the cost is `36 × (income.length + actual.length)` Date allocations, and `drawMonthlyTrend` is called from `renderDashboard`, which runs on boot and after every add, edit, delete, category change, clear, import and reset. At 5,000 records that is 180,000 Date allocations per dashboard render on the main thread.
- Impact — On a mid-range phone this is the first thing that will visibly stall, and it stalls the most-visited screen rather than the Analytics screen. It is adjacent to the deferred WORK-16 but not covered by it: WORK-16's trigger is the Daily chart and calendar, and its cost profile is string comparison, not object allocation.
- Recommendation — Compute a `YYYY-MM` key once per record (`x.date.slice(0, 7)`), bucket into a `Map` in one pass, then read the buckets. No `Date` objects, one pass instead of 72, and it does not touch the deferred WORK-16 surface.
- Effort: S

### Low

**CODE-07 — Quarantined copies of corrupt data accumulate without bound**

- Severity: Low
- Location — `expense-pwa/index.html:2287-2300` (`quarantineCorruptData`)
- Evidence — The key is `KEY + '.corrupt.' + Date.now()`, so every `load()` that fails to parse writes a **new** full copy of the raw blob. Nothing ever deletes one: there is no cleanup in `load()`, in the reset path (`:4778` removes only `KEY`), or in the import path. `downloadCorruptData` reads the copy but does not clear it.
- Impact — If the store is corrupt and the user reads without saving, each boot adds another full-size copy against a ~5 MB origin quota. The copies also survive a successful recovery indefinitely, holding the user's financial history in a key nothing will ever read again.
- Recommendation — Before writing, delete any existing `KEY + '.corrupt.'` keys, keeping at most one. Clear it on a successful import or reset.
- Effort: XS

**CODE-08 — `check-escaping.mjs` documents a coverage claim the source does not support**

- Severity: Low
- Location — `tools/check-escaping.mjs:16-23`; counter-examples at `expense-pwa/index.html:4245`, `:6267`, `:6277`
- Evidence — The tool's scope note states that text-content interpolation is fine because "Those sites are covered by `escapeHTML()` already where the value is free text, and the remainder are `fmt()`/`fmtCompact()` output." Three sites are neither:
  - `:4245` — `🔁 ${x.recFrequency === 'custom' ? … : x.recFrequency}${x.recEndDate ? ' · ends ' + x.recEndDate : ''}`
  - `:6267` — `📅 ${g.deadline} · ${text}`
  - `:6277` — `🔁 ${freqLbl} · …${nextDate ? ' · ' + nextDate : ''}`, where `freqLbl` is derived from `g.recFrequency` by `charAt(0).toUpperCase() + slice(1)`.
  Nothing is exploitable today, because `isRecFrequency` and `ISO_DATE_RE` constrain those fields at import. But the safety comes from the validators, not from the mechanism the comment names.
- Impact — The written justification is the thing a future contributor will read before adding a field to one of these templates. Recording a false premise about coverage is the failure mode ruling V2 exists to prevent, one level up.
- Recommendation — Correct the comment to say what is actually true: text-content safety rests on the import validators constraining these fields, and any new field interpolated into text content must either be escaped or validated.
- Effort: XS

**CODE-09 — The escaping predicate has no entry point and is referenced nowhere**

- Severity: Low
- Location — `package.json:7-9`; `tools/check-escaping.mjs`
- Evidence — `package.json` defines exactly one script, `"lint": "node tools/lint.mjs"`. A repo-wide search for `check-escaping` outside `node_modules` returns zero hits — not in `package.json`, not in `expense-pwa/README.md`, not in `expense-pwa/VERIFICATION.md`.
- Impact — Ruling V2 requires this predicate to be re-run and return zero by whoever closes a claim. A check with no script name and no mention in any document will be forgotten on the first busy day, and the class re-opens silently.
- Recommendation — Add `"check:escaping": "node tools/check-escaping.mjs"` and a `"verify"` script running both, and name it in `VERIFICATION.md`.
- Effort: XS

**CODE-10 — The header says "Dashboard" on first paint while everything else says "Home"**

- Severity: Low
- Location — `expense-pwa/index.html:1470` against `:3681-3702` and the init block at `:6946-6960`
- Evidence — The markup ships `<h1 id="hdrTitle">Dashboard</h1>`. `titles.dashboard` is `'Home'` (`:3682`) and the tab label is "Home" (`:1953`), but `hdrTitle` is only ever written inside `navigate()` (`:3739`) and `setExpMode()` (`:3930`). The init block calls `renderDashboard()` directly (`:6960`) and never calls `navigate('dashboard')`, and `renderDashboard` writes only `hdrSub` (`:5170`). So on every cold start the header reads "Dashboard" over a tab bar reading "Home" until the user navigates away and back.
- Impact — The one-word-per-destination property WORK-32 and WORK-07 established is broken on the first screen every session, which is the screen it matters most on.
- Recommendation — Replace `renderDashboard();` at `:6960` with `navigate('dashboard');`, or set the markup's `<h1>` to "Home". The first also removes the duplicated initial-state knowledge.
- Effort: XS

**CODE-11 — Record ids are interpolated into CSS selectors without escaping**

- Severity: Low
- Location — `expense-pwa/index.html:4318`, `:4405`, `:4429-4430`, `:4684`
- Evidence — `document.querySelector(\`input[data-edit-iname="${id}"]\`)` and three siblings build a selector from a record id. Ids generated by `uid()` (`:2335`) are alphanumeric and safe, and `namedProblem` (`:2757`) checks only that an imported id is a non-empty string — not that it is selector-safe. An id containing `"` or `]` makes `querySelector` throw a `SyntaxError`, which reaches `reportFatal` and raises the data-error banner.
- Impact — Narrow: needs an imported or hand-edited file. But it is the same "record data reaches a parser unescaped" class the attribute sweep just closed, in a parser the sweep does not look at, and the failure surfaces as the false data-loss alarm of CODE-05.
- Recommendation — Either use `[...container.querySelectorAll('input[data-edit-iname]')].find(el => el.dataset.editIname === id)`, or add `CSS.escape(id)`. The first needs no new API.
- Effort: XS

**CODE-12 — Dead code the linter cannot see**

- Severity: Low
- Location — `expense-pwa/index.html:2436`/`:2472` (`fbApp`), `:6861-6862` (`EMPTY_ICONS.category`, `EMPTY_ICONS.calendar`), `:3314` (`updateBellBadge`'s `return reminders`), `:3037` (`isoDate`); `eslint.config.mjs:75`
- Evidence — `fbApp` is assigned once and never read. `EMPTY_ICONS.category` and `.calendar` are unreachable: `emptyState()` is called only with `'income'`, `'expense'` and `'goal'` (`:3864`, `:4238`, `:6249`) and `filteredEmptyState()` only with `'income'` and `'expense'`. `updateBellBadge()` ends with `return reminders;` and no call site uses the value. `isoDate` is a second name for `toLocalISO`, used only inside `computeRange`. `eslint.config.mjs:75` sets `'no-unused-vars': 'off'`, so none of this is visible to the one static check that exists.
- Impact — Small individually. Collectively it means the codebase carries identifiers that read as live wiring, in a file where a reader's only navigation aid is naming.
- Recommendation — Delete the four. Leave `no-unused-vars` off — the config's reasoning for that is sound — but sweep once by hand when a file-level pass is open anyway.
- Effort: XS

---

## Clean Areas

- **Correctness of money.** Every stored amount is an integer: `unmoney` (`:2991`) strips non-digits, and salary-derived income is rounded at the write boundary (`:3822`). `fmt` (`:2906`) and `fmtCompact` (`:2964`) both take magnitude first and re-apply sign, so negatives group correctly. Division sites are guarded (`totalIncome > 0`, `total === 0`, `Math.max(1, …)` for chart maxima). No `toFixed` on stored values.
- **Dates and time zones.** `toLocalISO`/`parseISO` throughout; no `toISOString()` anywhere in the file. `new Date(lastNotifiedAt)` is converted through `toLocalISO` before comparison (`:3410`). Month stepping clamps rather than overflows, in one function, for both engines.
- **Schema and migrations.** `SCHEMA_VERSION`, numbered append-only `migrations[]`, per-step `try`/`catch` that stamps only the version actually reached (`:2212-2226`), and the upgrade is persisted through `writeDb` at `:2413` rather than waiting for an unrelated save.
- **Failed writes.** One guarded seam (`writeDb`), a refusal to write when quarantine failed, a non-dismissible banner cleared only by a successful write, and a coalesced path used for preferences only with `pagehide`/`visibilitychange` flush. No `render*` function calls `save()` — the architect's standing rule holds.
- **Import.** Records are validated individually and the file is rejected whole; `replacement` is built from schema defaults rather than spread over the live `db`; the parse `catch` is narrowed to the parse; a quota failure on import raises the banner and reports through `alertDialog` rather than a toast.
- **Offline.** Nothing on the read or write path touches the network. The worker intercepts same-origin GETs only, returns cache first, revalidates under `waitUntil`, and falls back to the shell. The converter degrades to stale rates with an explicit message (`:5998`).
- **Security — attribute escaping.** I walked every `attr="…${…}…"` in the file. Every one is `escapeHTML`, `fmt`, `fmtCompact`, `categoryColor`, `recInterval`, a numeric expression, a code-controlled ternary, or a constant from an in-file array. The class is closed. CSP is present, `unsafe-eval` absent, `connect-src` limited to the two endpoints in use, no secrets in source.
- **Modal focus and history.** Focus trap, Escape routed through the modal's own cancel control so `confirmDialog` still resolves, focus restored on close, and the Back/`expectedPops` bookkeeping balances pushes against pops on every path I traced, including the nested notif → contribute hand-off.

---

## Technical Debt

- **No data-access layer.** Click handlers mutate `db` directly and read filter state out of DOM inputs (`getRange` at `:3053`). The Chief Architect examined this and declined the remedy for the quarter, which I accept; it remains the reason cross-screen agreement can only be established by reading all seven consumers of `db.planned` by hand, as this review again did.
- **The horizon decision is made twice in one call path.** `expandPlannedInRange` applies `aggregationEnd` at `:4126` and then calls `plannedOccurrences`, which applies it again at `:4069`. Idempotent today, but a future reader cannot tell which layer owns the horizon, and changing one without the other will produce a silent disagreement.
- **`expandPlannedInRange` returns live store objects mixed with clones** (`:4134-4135`). The stated justification — "so edit and delete keep working" — is now stale: `renderExpenses` edits and deletes from `db.planned` directly (`:4272-4281`) and never consumes this function's output. The function could clone unconditionally, removing the hazard that a future consumer mutates the store through a render path.
- **Recurrence walks always start from the anchor.** `plannedOccurrences`, `hasPlannedOccurrence`, `nextPlannedDue` and `upcomingPlannedDates` all step from `p.date` regardless of where the requested range begins, so cost is O(age of the plan) per plan per call, and a daily plan older than ~13.7 years hits the 5,000-step guard and vanishes from both the list and the totals. The `console.warn` added this round makes that visible to a developer, not to a user.
- **Cloud sync.** `loadFromCloud` still does `db = JSON.parse(cloudDbJson)` and `localStorage.setItem(KEY, cloudDbJson)` at `:2518-2519`, bypassing `importProblem`, `load()`'s defaults, `normalizeGroup` and `migrate`, with an unguarded `setItem`. This is deferred WORK-15 under a hard precondition and I am not re-raising it — but the comment at `:2398-2400` claims `normalizeGroup` is applied on every load specifically because "data can also arrive from a cloud document that never passes through the import validator", and on the cloud path `load()` is never called. The comment should be corrected now even though the code is not.
- **Two drag-to-reorder implementations** (`:4329-4374`, `:4443-4499`) that differ only in comments — deferred WORK-35, unchanged, and still correct to leave alone until the next behavioural change to either.
- **`no-unused-vars` is off** by deliberate and well-argued choice, which means dead code (CODE-12) is invisible to the only automated check the project has.

## Future Risks

- **10,000 transactions.** CODE-06 is the first wall (Dashboard, on every write). The Analytics screen is the second: `renderCalendar` scans the full `db.actual` once per calendar cell (`:5553`) and `drawDailyStackedChart` once per day up to 90 days (`:5669`) — deferred WORK-16, whose trigger has not fired but is closer than it was. `renderDaily()` runs all five sub-renders on every chip toggle and every calendar tap.
- **Storage growth.** A single-blob `localStorage` store re-serialised in full on every record write. At 10,000 records the blob approaches the size where `JSON.stringify` plus a synchronous write is perceptible per keystroke-to-save. CODE-07 accelerates the quota side of this in exactly the situation where the user can least afford it.
- **Enabling Firebase.** The precondition (WORK-15 and WORK-02 both landed) is half met. Turning the config on today would put unvalidated, unmigrated, un-normalised documents straight into `db` and into `localStorage`.
- **Adding a fifth recurrence frequency.** `isRecFrequency`, the `stepDate` switch, four UI entry points, four display sites, `recurrenceProblem` and both walk functions — ten-plus coordinated edits. The engine is now singular, which is the important half, but the frequency vocabulary is not.
- **The single error surface.** CODE-05 is the concrete instance; the general shape — one banner, one set of words, reached by `window.onerror` from anywhere in 4,800 lines of script — is the risk the Chief Architect recorded under ruling C5, and it is still live.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **One outcome message per user action.** Delete `index.html:4574`; add `savedToast` to the category delete at `:4700`. Two lines, and they close CODE-01 and CODE-02 — the only two findings where the app tells the user something untrue about a write in normal operation.
2. **Two lines in the validators.** Reject non-ISO `recLastDone` in `recurrenceProblem` and non-ISO `recLastLogged` in `goalProblem` (CODE-03). This finishes the validator sweep that WORK-14 and WORK-40 started, on the two fields the recurrence engines actually pivot on.
3. **Route the rate cache through the guarded helpers.** Move the read inside a `try` that clears a bad entry, and the write through `rememberUiPref` (CODE-04). Same seam, same reasoning, one function that was missed.
4. **Give `reportFatal` its own words.** A second banner element with its own headline (CODE-05). This is the only structural change in the list, it is small, and it discharges an existing standing rule rather than inventing a new requirement.
5. **Bucket the trend by month key.** One pass and a `Map` in `drawMonthlyTrend` (CODE-06), removing the largest per-render cost on the most-rendered screen without touching the deferred WORK-16 surface.
6. **`navigate('dashboard')` at init** instead of `renderDashboard()` (CODE-10), which also deletes the duplicated initial-title knowledge in the markup.
7. **A `verify` npm script** running both `tools/lint.mjs` and `tools/check-escaping.mjs`, plus the corrected scope comment in the latter (CODE-09, CODE-08). The predicates exist and both return zero; what is missing is the one line that makes re-running them the default rather than an act of memory.
