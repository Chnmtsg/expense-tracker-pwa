# Code Review — Round 14

## Executive Summary

The application is in the best structural condition it has been in across this review series. The money path re-derives clean at source: one unit of record, one `Math.round` per figure, the render-side `moneyValue` guard landed at seven sites rather than the six approved, `fmt` is NaN-safe, and no calculation in `calcSalary`, `stepDate`, `computeRange`, `plannedOccurrences` or `debtInterestPaid` produces a wrong sign, `NaN` or `Infinity` at any boundary I walked. The store seam holds — `load()` is total, `importReplacement` is reachable from the probe rather than copied into it, and all six collection sites carry `debts`/`debtPayments`. Round 13's probe work is real: the note-chip setup assertion is placed where it cannot be masked by a competing red, the two diagnostics are labelled under C42(b), and the WORK-200 perturbation comment records a demonstration that reaches the assertion it names.

**The single biggest risk is `tools/harness/perf.js`.** It is the instrument that discharged two multi-round deferrals, and its central trust argument does not hold: the calibration terminates a busy loop with `Date.now()` and measures it with `performance.now()`, which under `--virtual-time-budget` are the same time domain — so it compares a clock against itself and cannot detect the dilation its own header says it exists to detect. Separately, the one figure the WORK-16/49 trigger is actually stated against (`This Month`, 2ms) is the only measurement in the file with no setup assertion behind it. Nothing found this round loses stored data, misstates a stored figure, reaches a period-filtered surface, or blocks a user.

---

## Overall Score

**89 / 100.**

No Critical and no High: nothing here blocks the release, and the application half of the codebase is genuinely production ready. It sits one point below the production-ready band because four Mediums stand, two of them inside the measurement probe whose figures were used to keep two deferrals closed — the build is fit to ship, but this round's headline number is not as well guarded as its own header claims.

---

## Findings

### Critical

None.

### High

None.

I want the absence on the record rather than implied. Round 13's one High was `npm run verify` returning 0 over a file whose script could not parse — an instrument that could certify a dead application, sitting in the release path. `perf.js` is not that: it is not one of the five commands, it has no npm script, it asserts nothing about its figures, nothing ships on its green, and its numbers are independently plausible as real time. CODE-01 and CODE-02 are Medium for those reasons and not lower because, under C34, this probe is the only thing in the repository that can discharge either trigger.

---

### Medium

**CODE-01 — `perf.js`'s calibration compares two clocks from the same time domain, so it cannot detect the condition it names**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\tools\harness\perf.js:34-48` (the calibration rationale and `busyFor`), `:50-54` (`timeIt`), `:70-76` (the check), against `D:\3_Claude\PowerApps\tools\harness\run.mjs:136` (`'--virtual-time-budget=20000'`, passed on every run)
- **Evidence:** The header states the guard's purpose in its own words: *"the probe first spends a known amount of real time in a busy loop and checks that it can see it. If it cannot, it THROWS instead of reporting a number nobody should trust."* But `busyFor(ms)` at `:43-48` terminates on `while (Date.now() < end)`, and `timeIt` at `:50-54` measures with `performance.now()`. Both are frame clocks, and `--virtual-time-budget` is a property of the frame's time domain, not of one API. If that domain runs at `k` virtual milliseconds per real millisecond, the loop exits after `50/k` real ms and `performance.now()` reports `50`; `t.calibration_ms` is ~50 for every value of `k`, and the `25..250` window at `:72` passes. The subsequent figures are then reported in the same dilated units — `62ms` for All Time could be 620ms real at `k = 0.1`, and nothing in the file can tell. What the check *can* catch is narrower than what it claims: a fully frozen `performance.now()` against a live `Date.now()` would give `calibration_ms = 0` and throw. The direction it claims to catch — both clocks virtual together — is precisely the one it cannot see. `reports/HANDOFF.md:289-292` repeats the probe's claim rather than testing it.
- **Impact:** Two deferrals — WORK-16/49 (six rounds) and the WORK-202 risk — are now recorded as answered on evidence rather than on nobody having looked. That is a real improvement, and it rests on a self-referential guard. If the figures are dilated downward, a cost that has already crossed its 100ms trigger reads as clear by a factor of 50, and the deferral is renewed on a number instead of on silence, which is harder to reopen.
- **Recommendation:** The smallest honest fix is the header: state what the calibration establishes (that `performance.now()` and `Date.now()` agree, and that the clock is not frozen) and what it does not (that either is real time). The smallest fix that makes it a real guard uses a clock outside the frame: `run.mjs:132-137` already spawns Chrome with `spawnSync`, so Node can bound the whole run in wall time and the probe can report the sum of its own measured durations; a gross disagreement between the two is dilation, observed from outside the domain being questioned. Which of the two is right is a ruling, not an edit.
- **Effort:** XS for the header; S for the out-of-frame bound.

**CODE-02 — the one figure the WORK-16/49 trigger is stated against is the only measurement in `perf.js` with no setup assertion**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\tools\harness\perf.js:64-68` (`setDashPreset`), `:108-113` (the This Month measurement), against `:127-132` (the All Time month-count assertion) and `D:\3_Claude\PowerApps\tools\harness\run.mjs:45-46`
- **Evidence:** The restated trigger names *"`renderDashboard()` above 100ms with the date filter on 'This Month'"*. `setDashPreset('thisMonth')` at `:108` sets `sel.value` and dispatches `change`; if the value did not take, `HTMLSelectElement.value` silently becomes `''` and no assertion notices. The probe then times five renders and reports `2ms`. Every other figure in the file is backed by a setup check — `t.seeded_records !== 5000` at `:99-101`, `t.M_allTime_months < 2` at `:128-132`, `!document.querySelector('.debt-card')` at `:156-158` — and the comment at `:120-126` records exactly this failure happening once already (`.mc-col` matched nothing and the probe reported "1 month" for a three-year store). The month-count assertion runs *after* `setDashPreset('all')`, so it proves the render guard passed in the All Time configuration and says nothing about the This Month one. `run.mjs:45-46` states the house rule this breaks in the file's own words: *"A probe that reports zero matches is not a pass. Assert the fixture produced the thing you are measuring before measuring it."* Two milliseconds is also what a guarded early return would look like.
- **Impact:** The number carried into the standing record as *"No, by a factor of 50"* is the one number in the probe that has nothing standing behind it. If `renderDashboard` returned early, or the preset did not apply, the figure describes something other than what the trigger names — and the trigger would then have been discharged by a measurement of nothing.
- **Recommendation:** Assert the This Month configuration before timing it, in the shape the All Time half already uses — `#dashPreset.value === 'thisMonth'` and at least one `#monthlyChart .col` — and throw `setup failed:` naming which, matching every other flow in this harness.
- **Effort:** XS

**CODE-03 — the app's heaviest repeated full-scan surface is unmeasured, and one half of it does not shrink when the user narrows the filter**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7239-7261` (`renderCalendar`), `:7410-7424` (`drawDailyStackedChart`), `:7188-7195` (`renderDaily`), `:7381-7385` and `:7322-7329` (the re-render triggers)
- **Evidence:** In `actual` mode, `renderCalendar:7239` sets `baseSource = db.actual` and `:7249-7251` assigns `source = baseSource` with **no range filter at all**; `:7255-7261` then runs `source.filter(...)` once per day of the month — about 31 full passes over the whole collection. `drawDailyStackedChart:7410-7412` does the same (`source = baseSource` in actual mode) and `:7414-7424` filters it once per day across a window capped at 90 days by `MAX_DAYS` at `:7398`. `renderDaily:7188-7195` calls both, plus `renderDailyStats` and `renderDailyChips`, so one `renderDaily()` performs on the order of 120 full passes over `db.actual` — more full scans of one collection than `renderDashboard` on All Time performs of both (36 each, `:7074-7083`), which is the cost that has been deferred for six rounds and which `perf.js` measured at 62ms. `renderDaily()` re-runs on every category-chip tap (`:7383-7384`) and every calendar day tap (`:7316-7317`); `renderCalendar()` re-runs on both month arrows (`:7322-7329`). `perf.js` never calls `navigate('daily')` or `renderDaily`. Note also that `HANDOFF.md:385` records WORK-16/49's original trigger as *"a measured render >100ms on a mid-range device on Dashboard **or Analytics**"* — the measurement taken covers the Dashboard half only.
- **Impact:** This is stated as arithmetic and not as a measurement, so under C34 it fires nothing and I am not presenting it as a fired trigger. What it does establish is that the instrument built this round to settle the deferred performance questions does not visit the screen where the largest per-record multiplier lives — and where, unlike every other cost on that screen, narrowing the date range does not reduce it, because `renderCalendar` reads `db.actual` in full by design (the same property `:7347-7355` records for `dailyExcluded`).
- **Recommendation:** The smallest change that removes the risk is no change to the application. Add `renderDaily()` to the existing probe with the same seeded store and the same "asserts nothing" treatment, so the Analytics half of the trigger is measured rather than assumed. Whether that number then justifies work is the architect's call; the pre-ruled `Map` shape for `renderDebts` has no analogue here and I am not proposing one.
- **Effort:** XS for the measurement.

**CODE-04 — the transaction lists render one DOM row and two listeners per record, with no cap**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:5316-5318` and `:5329-5353` (`renderIncome`), `:5735-5749` onward (`renderExpenses`)
- **Evidence:** `renderIncome` filters and sorts `db.income`, then `list.map(...)` at `:5329` builds one `.list-item` per surviving record with no `slice`, no pagination and no virtualisation, and `:5347-5348` attaches two listeners per row individually. `renderExpenses:5749` is the same shape, plus a `db.categories.find` per row at `:5750`. Both functions run on every add, edit and delete on their own screen (`:5351`, `:5303-5306`). The file caps elsewhere when a loop is bounded by data — `drawMonthlyTrend` at `:7070` (`months.length > 36`), `drawDailyStackedChart` at `:7398` (`MAX_DAYS = 90`) — so an uncapped list is inconsistent with the file's own habit rather than an unconsidered case.
- **Impact:** At the "10,000 transactions" question the review brief asks: on All Time the Expenses screen builds 10,000 rows and attaches 20,000 listeners, synchronously, on the main thread, and repeats it after every single delete. The user has an escape hatch — narrowing the date filter — which is why this is Medium and not higher, and it is the same escape hatch the standing decision says the Dashboard cost lacks. Again: arithmetic, not a measurement, and it fires no trigger on its own.
- **Recommendation:** No application change is the smallest safe answer today. If it is ever to be settled, it is the same probe and the same store — `renderIncome()` and `renderExpenses()` on All Time against 5,000 records — reported and asserted against nothing, in the file that already exists. A cap or a delegated listener is a product decision about how many rows a list may show, and that needs a ruling before an edit.
- **Effort:** XS to measure; M for any fix.

---

### Low

**CODE-05 — the rewritten 320px header cites two line numbers that are each exactly 26 lines stale, and contradicts itself about one of them**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\harness\debts.js:517` and `:526`, against `D:\3_Claude\PowerApps\expense-pwa\index.html:1636` and `:1528`, and `D:\3_Claude\PowerApps\reports\HANDOFF.md:105-112`
- **Evidence:** `debts.js:516-517` reads *"`.debt-total-value` at :1610 is the same choice for this screen"*; the rule is at `index.html:1636`, and `:1610` is a comment line belonging to `.debt-name`. The same file cites the same rule **correctly** thirty lines later at `debts.js:549` (*"index.html:1636"*). `debts.js:525-526` reads *"measured, most recently at 91px of overflow with :1502 removed"*; the declaration removed for that measurement is `.goal-meta-item.note`, which the same header names correctly at `:522` as `index.html:1528`, while `:1502` is `.goal-meta`, an unrelated flex container. Both wrong numbers are exactly 26 less than the right ones — the same 26-line insertion `HANDOFF.md:105-112` documents, and these are the references that correction did not reach.
- **Impact:** WORK-198 existed because this header justified its fixture with a deleted class and a false property. It now names one rule at two different lines within one file and points the reader who wants to re-run the 91px demonstration at the wrong rule. This is the project's most-repeated defect class arriving inside the fix for its previous instance.
- **Recommendation:** Correct `:517` to `1636` and `:526` to `1528`, and apply `HANDOFF.md:116-118`'s own habit — lead with the selector, and grep the selector back before writing the number.
- **Effort:** XS

**CODE-06 — `lint.mjs`'s comment states behaviour the branch immediately below it does not have**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\lint.mjs:77-83`
- **Evidence:** The comment at `:77-79` says of a line carrying both markers: *"Both markers on one line is a self-contained comment: no state change, and **the tag test below still runs on whatever surrounds it**."* The code at `:83` is `if (opensComment && closesComment) return '';` — it blanks the line and returns, so the boundary test at `:88-93` never runs on it. The first clause of the sentence is true; the second is false. Nine such lines exist in `index.html` (`:2173`, `:2258`, `:2346`, `:2407`, `:2462`, `:2523`, `:2637`, `:2891` and the `-->` closer at `:16`), none carrying a script tag, so nothing is currently missed.
- **Impact:** No behavioural defect today. But this is the tool WORK-187 repaired specifically because a comment claimed a coverage the code did not have, and the new comment repeats the shape one branch away: a future `<!-- … --> <script>` on one line would open no region, and the next reader has been told in writing that it would.
- **Recommendation:** Make the sentence describe the branch — the line is blanked and is not tested for a script tag, and the reason that is safe is that no such line exists. Do not change the branch to match the sentence; blanking is the conservative direction.
- **Effort:** XS

**CODE-07 — the force-clear handler's five re-render calls cannot take effect from the only screen the control appears on**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:6146-6150`, against `:6834` (the `renderDashboard` guard), `:2723` (`#dataSummary`, inside `<section id="settings">` at `:2638`) and `:5111-5130` (`navigate`)
- **Evidence:** The clear buttons are built by `renderDataSummary` into `#dataSummary`, which lives inside the Settings section, and `renderDataSummary` is only called from `renderSettings` at `:6072`. So when the handler at `:6138` runs, `.screen.active` is always `settings`. `renderDashboard()` at `:6146` therefore returns immediately at its `:6834` guard, and the four conditionals at `:6147-6150` — `expenses`, `income`, `daily`, `goals` — can never match. Five calls, none of which can have an effect. `navigate()` at `:5130` re-renders each of these screens on arrival, so the user sees correct figures anyway.
- **Impact:** No defect for the user. It reads as a coupling that does not exist, on a destructive path, and it is the shape WORK-190 was raised to close on the import handler two commits ago — where the ruled answer was the `navigate()` seam and a comment stating the derivation. Here there is no comment at all, so a reader adding a seventh collection will believe this list is the place to add a render.
- **Recommendation:** Keep the calls if they are wanted as belt-and-braces — the round-9 WORK-159 precedent — and add one comment stating the derivation: the control is Settings-only, so `renderSettings()` is the effective refresh and every other screen is repainted by `navigate()` on arrival.
- **Effort:** XS

**CODE-08 — `sw.js`'s "bump on every deploy" rule cannot be honoured under a deploy that fires on every push**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\sw.js:1-2`, against `D:\3_Claude\PowerApps\.github\workflows\deploy.yml:25-28`, and `D:\3_Claude\PowerApps\reports\HANDOFF.md:55-59`
- **Evidence:** `sw.js:1` is *"Bump this string on every deploy to force a fresh install of the SW"* and `:2` is `const CACHE = 'expense-tracker-v12';`. `deploy.yml:25-28` triggers on `push: branches: [main]`, so every commit that reaches `main` is a deploy of `expense-pwa/`. The standing ruling and `HANDOFF.md:55-59` both treat the bump as a manual step taken *before* a deploy — a discipline that is coherent for hand-uploaded files and is not coherent for a push trigger. `HANDOFF.md:198-201` records that the workflow has never run because the repository has no remote; the moment one is attached, the two rules disagree on the first push.
- **Impact:** Mitigated but not zero: `staleWhileRevalidate` at `:59-93` means an installed user gets a changed `index.html` on their second load, so a missed bump costs one stale load rather than a stuck build. The real cost is that a rule stated as absolute (*"every deploy"*) is one nobody can follow, and rules that cannot be followed stop being read.
- **Recommendation:** Reconcile the two in words, not code — either the trigger becomes deliberate (`workflow_dispatch` only, which `:28` already provides) or the sentence at `sw.js:1` says what it actually means: bump before an intentional publish, and the cache key is not a per-commit fact. Which one is a decision about how this project ships.
- **Effort:** XS

**CODE-09 — the goal history modal interpolates a date unescaped where its sibling escapes the same field**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:9150`, against `:8778`
- **Evidence:** `openGoalHistoryModal:9150` writes `<div class="meta">${c.date}${c.notes ? … escapeHTML(c.notes) … }</div>`; `openDebtHistoryModal:8778` writes the structurally identical line as `${escapeHTML(p.date)}…`. The two were written as siblings for the same purpose and differ on this one call. Not exploitable: `contributionProblem:3915` requires `ISO_DATE_RE` on import, and every other writer is an `<input type="date">`, so the value cannot carry markup — which is the same "safety comes from the validators, not from a wrapper" argument `tools/check-escaping.mjs:18-34` makes for the text-content sites it deliberately does not inspect. `check-escaping.mjs:50` matches attribute values only, so nothing will ever report this.
- **Impact:** None today. It is one call away from the pattern, in the module pair that was deliberately aligned across two rounds, in a class this project has already had to close twice by hand.
- **Recommendation:** Wrap it, matching `:8778`. No predicate change — `check-escaping.mjs` is narrow on purpose and widening it is off limits.
- **Effort:** XS

---

## Review Areas

**Correctness of Money — clean.** Re-derived at source rather than accepted. The unit of record is the whole tugrik and it is stated once at the parse boundary (`:4225-4239`); `formatMoneyInput:4253-4268` is the real decimal guard and says so; `moneyValue:4297` closes the render side and passes non-numbers through unchanged, preserving the `placeholder="0"` case at `:9099`. It landed at seven sites (`:8748`, `:8750`, `:9027`, `:9077`, `:9099`, `:9221`, `:9239`), one more than the six approved. `fmt:4141-4144` folds `NaN` to zero and puts the sign outside the symbol; `debtInterestPaid:8493-8499` is correct at zero payments, exact settlement, overpayment, `cost <= 0` and `total <= 0`, with exactly one `Math.round` on the running total. `toLocalISO`/`parseISO` are used throughout and the only occurrence of `toISOString` in the file is a comment forbidding it (`:4219`). **Stage 2's trigger does not fire:** I walked the five functions its trigger names and found no rounding or arithmetic defect. CODE-01 and CODE-02 are defects in a probe, not in a calculation, and CODE-05 is a comment.

**Data and Persistence — clean.** One blob, one write seam, `load()` total with the discard-`d` line intact at `:3457`, quarantine before write, migrations append-only and idempotent, `SCHEMA_VERSION` correctly not bumped for `debts`/`debtPayments`. All six collection sites carry both arrays: field-by-field `:3402-3403`, fresh defaults `:3465`, `importReplacement:3994`, `optionalArrays:4013`, `perRecord:4051-4052`, `renderDataSummary:6119-6120`. `importReplacement` is a top-level function declaration reachable from the frame (`v1-write-flows.js:615-619` refuses to run if it is not), so C41 is satisfied at the site that broke it. Offline-first holds: nothing on the boot path fetches, rates are cached and fetched only on explicit user action, and the service worker returns the cached shell first.

**Architecture — clean, with one recorded debt untouched.** Responsibilities are separated at the seams that matter: no `render*` calls `save()` (`check-saves.mjs` proves it), `renderDebts` writes only inside `#debts` (guarded, and the guard can now genuinely fail), and debt figures reach no period-filtered surface. `analyzeExpenses` still does not know debt exists, correctly. The module-boundary problem and every-consumer-re-deriving-its-own-filter-pipeline are recorded in the standing decision as the leading candidate for next quarter; I am not re-raising them.

**Maintainability — CODE-05, CODE-06, CODE-07.** Function sizes and names are good; the one genuinely long function, `analyzeExpenses:6429`, is already recorded. Comments state derivations rather than results almost everywhere, which is why the three exceptions above are worth naming.

**Error Handling — clean.** Every write reports its outcome or is allow-listed with a reason. `savedToast` is the single message and it is the last thing said on every path I traced, including the force-clear handler where an earlier double-toast defect is recorded at `:6152-6161`. The seven bare `catch {}` blocks (`:3237`, `:4121`, `:4267`, `:4352`, `:4364`, `:5911`/`:6040`, `:7693`) all cover UI preferences, pointer capture or cache cleanup — none swallows a money write. Both history modals now re-render on success only, and the comments at `:8798-8810` and `:9181-9190` record honestly which one had the property first.

**Security — CODE-09 only.** `escapeHTML:9558-9560` covers all five characters. CSP is present with `'unsafe-inline'` documented at `:5-16` as unavoidable without a build step, and the file is honest that escaping, not CSP, is the fix. Nothing sensitive is logged: all fourteen `console.*` calls carry an error object or a record id. One dev dependency, `eslint ^9.17.0`, installed fresh in CI by the caret range and not shipped to users.

**Performance — CODE-03, CODE-04.** The two costs the standing decision records (`drawMonthlyTrend`'s per-month scan at `:7074-7083`, `renderDebts`'s ~six passes per debt) are confirmed unchanged and correctly deferred. The two above are not covered by either.

**Reliability and Scalability — CODE-03, CODE-04.** At 10,000 transactions the first things to move are the Analytics screen's ~120 full scans and the uncapped Income/Expenses lists, in that order. On a slow mobile device the calendar is the surface to watch, because it re-renders on every chip tap and its cost is filter-independent.

**Technical Debt — see below.**

---

## Technical Debt

- **The measurement probe is now load-bearing and is not covered by the discipline that covers the five commands.** CODE-01 and CODE-02 are the instance; the class is that `perf.js` is exempt from C40 (there is nothing to redden), reports figures nobody compares, and yet its output is now quoted in the standing record as the reason two deferrals hold. It is the only artifact in the repository with that combination.
- **Line numbers in prose.** CODE-05 is the fourth instance in three rounds and the first to survive a correction pass aimed at it. `HANDOFF.md:99-123` diagnoses this correctly and the diagnosis did not close the case it was written from.
- **`renderDaily`'s five collaborators each re-derive their own view of `db.actual`, with two of them ignoring the date range entirely.** This is the "every consumer re-derives its own filter pipeline" debt the standing decision names, in its most expensive instance, and CODE-03 is a direct consequence.
- **Uncapped list rendering (CODE-04)** is cheap to live with and expensive to change later, because a cap is a product decision about what a list shows and a delegated listener is a change to six handlers.
- **The service-worker cache key is a hand-maintained fact on an automated pipeline (CODE-08).** It costs nothing today because the pipeline has never run.

---

## Future Risks

- **The trigger aiming problem, already recorded and not mine to re-raise.** `HANDOFF.md:303-314` observes that WORK-16/49's restated trigger names the *cheapest* Dashboard configuration — This Month builds one month column and costs 2ms, while All Time builds 36 and costs 62ms — so as written it is unlikely ever to fire. I re-derived that at source (`:7065-7071` builds the month list from the filter range) and it is correct. It is the architect's trigger and re-aiming it is a ruling. CODE-03 is the adjacent version of the same shape on a different screen.
- **A second measurement probe.** Because `perf.js` is not a command and asserts nothing, the cheapest way for the next person to answer a new performance question is to write another one. The standing ceiling is on runners, not probes, so nothing stops that — and a second unasserting probe is a second place for a trust argument like CODE-01's to live.
- **Cleared debts and completed goals accumulate unsorted and unarchived** — already recorded, unchanged, and now with a second unfiltered money screen shipping.
- **A collection added after `debts`** must reach six sites. Five of them are enumerated in one place; `renderDataSummary:6107-6121` is the sixth and is the easiest to miss, because omitting it produces an under-report rather than a throw.

---

## Recommended Refactoring

The smallest set of structural changes that removes the most risk, in the order that removes it fastest. All of it is subject to the Chief Architect's ruling; none of it is scheduled here.

1. **Make the measurement probe honest about what it measured — CODE-01 and CODE-02, one pass.** These are the only two findings whose subject is the evidence for a decision rather than the behaviour of the application. The header correction is XS; the setup assertion is XS and is the same shape the file already uses twice. If the out-of-frame wall-clock bound is wanted instead of the header correction, that is a `run.mjs` change and needs its own ruling. **Nothing else in this list matters as much, because everything else is either recorded or cosmetic.**

2. **Extend the same probe to `renderDaily()` — CODE-03**, and to `renderIncome()`/`renderExpenses()` if CODE-04 is thought worth a number. One store, one file, no new instrument, no assertion. This converts two arithmetic arguments into measurements without asking anyone to accept an arithmetic argument, which is what C34 requires.

3. **Correct the three prose defects together — CODE-05, CODE-06, CODE-07.** Three comments in three files, all of the same class: a sentence that describes something the code beside it does not do. They share no code and no risk, so they need not share a commit — but they should share a reading, because the reason they exist is one habit and not three mistakes.

4. **Settle the service-worker rule in words — CODE-08.** One sentence in `sw.js` or one line in `deploy.yml`. It costs nothing now and costs a stale load per missed bump the day a remote is attached.

5. **Escape the date — CODE-09.** One call, matching its own sibling.
