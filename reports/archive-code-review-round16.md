# Code Review — Round 16: the Debts module, and the true-cost-decoder proposal

## Executive Summary

The Debts module is the best-defended code in this file. Money is whole tugrik, every derived figure is a stock with a single `Math.round`, `debtProblem` refuses the shapes that produce `₮NaN`, both write paths refuse rather than clamp, the delete path cascades, and nineteen harness flows in `tools/harness/debts.js` hold the module's negatives. I found no Critical and no High finding in the code as built. What I did find is a consistent omission at the module's edges: **no debt write path refreshes the bell badge**, and **`loadFromCloud` re-renders a hard-coded screen list that leaves Debts out** — the identical defect the import path already diagnosed and closed by routing through `navigate()`. The single biggest risk is not in the module as built but in the proposal: its §4 formula annualises in whole months and its §5 treats a zero-length term as an import-only hazard, and both readings lean toward the understatement the feature exists to expose.

## Overall Score

**84 / 100** — Solid. No Critical or High findings; five Mediums (two against the built code at the module's edges, three against the proposal as specified) and four Lows hold it below 90. The module's core arithmetic — `debtPaid`, `debtOutstanding`, `debtInterestPaid` — I could find nothing wrong with.

---

## Findings

### Critical

None.

### High

None.

---

### Medium

**CODE-01 — No debt write path refreshes the bell badge**

- **Severity** Medium
- **Location** `D:\3_Claude\PowerApps\expense-pwa\index.html` — the five debt write sites: `:9770` (delete debt), `:9921` (delete payment), `:9990` (add debt), `:10529` (edit debt), `:10570` (add payment). Each is `const ok = save(); renderDebts();` with no `updateBellBadge()`.
- **Evidence** `computeReminders` has a debt branch (`:5207-5225`) and `updateBellBadge` (`:5259`) is a straight count of its result. Every goal write site calls it — `:10326-10327`, `:10467`, `:10622` — and the comment at `:10323-10325` explicitly names `renderDebts()` on the debt path as its model for staying unconditional. The debt path does not have the property being cited. The sharpest path: the reminder sheet's own `+ Payment` button (`:5449-5453`) opens `openDebtPaymentModal`; the user pays the debt off in full; `computeReminders` now excludes it; the badge keeps its old digit until the 30-minute interval at `:10798` or an unrelated income/expense/goal write.
- **Impact** The bell counts a debt the application knows is settled or deleted, and omits one just recorded with a due date inside the window. In an offline-first app that stays open, the 30-minute timer is the effective repair. A reminder that outlives its cause is precisely what the `computeReminders` debt-branch comment says the module must not produce ("a reminder that cannot be acted on is the reminder `nextPlannedDue` was rewritten to stop firing", `:5204-5206`).
- **Recommendation** Add `updateBellBadge();` beside `renderDebts();` at the five sites. Unconditional, on the `:10323-10327` precedent — it redraws from `db`, which a failed save leaves untouched.
- **Effort** XS

**CODE-02 — `loadFromCloud` re-renders a hard-coded screen list that omits Debts**

- **Severity** Medium
- **Location** `expense-pwa\index.html:4047-4056`
- **Evidence** After `db = JSON.parse(cloudDbJson)` it calls `renderDashboard()` plus conditional renders for `income`, `expenses`, `goals`, `settings`, `daily`. The Debts section id is `debts` (`:3032`) and `navigate()` renders it at `:5901`; neither is reached. The import path had this exact defect and closed it — its comment at `:7279-7298` names the scenario verbatim: *"A user who restores from the Debts screen was left looking at debt cards whose '+ Payment' button resolved a deleted id and returned silently — a dead control over records that no longer existed"* — and fixed it by routing through `navigate()` so "the list cannot drift again as screens are added". The list drifted again, through the other door.
- **Impact** A user standing on Debts when cloud data replaces local data continues to see the previous database's debts, outstanding balances and cost of borrowing, with nothing saying they are stale. The controls are safe (`:9777`, `:10546` and `:9757` all re-look-up and return silently) but silent. Exposure is limited today because the path is behind `isFirebaseConfigured()`; `product-strategy.md` puts hardened cloud sync at item 4 of the build sequence, which is when this stops being limited.
- **Recommendation** Replace the six calls with the seam the import path uses: `renderSettings(); navigate(document.querySelector('.screen.active')?.id || 'dashboard');`
- **Effort** XS

**CODE-03 — A zero-length term is reachable through both debt forms, not only through an import (against the proposal, §5)**

- **Severity** Medium
- **Location** `expense-pwa\index.html:9973` (`if (dueDate && dueDate < date)`) and `:10519` (same test in the edit branch); `reports/design-request-true-cost-decoder.md` §5 row 3.
- **Evidence** Both write paths compare with `<`, not `<=`, so `dueDate === date` is accepted and stored by the normal UI — a debt borrowed today and due today is a valid record today, and renders as "due today" at `:9711`. The proposal says a zero or negative term "can reach this code from an import". Negative is import-only; **zero is a supported state of the primary write path**. A ruling taken on the import-only reading will place the guard at the import boundary, where it protects nothing.
- **Impact** If the decoder ships with the guard in `debtProblem` rather than in the derived figure, `(T − P)/P × (365/0)` yields `Infinity` and the Debts screen prints `Infinity%` — the `₮NaN` class this file has closed three times, reintroduced on the one number the module exists to produce.
- **Recommendation** The guard belongs in the derived rate function: term in days `> 0`, else return `null` and omit the line, on the `showCost` precedent at `:9542-9547`. Do not add a cross-check to `debtProblem` — its comment at `:4500-4503` is right that an importer rejecting a whole backup over this destroys more than it protects.
- **Effort** XS as part of the feature

**CODE-04 — The proposal's `12 / n` month formula introduces a rounding choice the stored data does not require (against the proposal, §4)**

- **Severity** Medium
- **Location** `reports/design-request-true-cost-decoder.md` §4; consumes `date`/`dueDate` as written at `expense-pwa\index.html:9977-9979`
- **Evidence** The term is stored as two ISO dates, and this module already computes a term in exactly one idiom — `Math.round((parseISO(a) - parseISO(b)) / 86400000)` at `renderDebts:9707` and `computeReminders:5213`. Converting that to a whole month count `n` requires a rounding decision the proposal does not state. A 45-day loan is 1.5 months; rounded to 2, a ₮1,000,000 → ₮1,100,000 loan reports 60% flat instead of 81%. The direction of the error is downward on short terms, which are the predatory ones.
- **Impact** The proposal's own stated failure condition is understating a predatory rate. A month-rounded denominator understates exactly the loans the feature is aimed at, and it does so invisibly.
- **Recommendation** Annualise from days using the existing idiom: cost ÷ principal × 365 ÷ days. No month conversion anywhere. (365 fixed, not 365.25 — one constant, stated once.)
- **Effort** XS

**CODE-05 — If the effective rate is ruled (option B or C), the solver's bracket and its non-convergence path must be part of the ruling (against the proposal, §4)**

- **Severity** Medium
- **Location** `reports/design-request-true-cost-decoder.md` §4; no numeric solver exists anywhere in `expense-pwa\index.html` today, so there is no local convention to inherit.
- **Evidence** The proposal's own table reaches 400.4% effective on a 3-month loan. `debtProblem` (`:4489-4492`) puts no upper bound on `totalToRepay` and the term can be one day, so the true worst case is unbounded. A bisection written with a plausible-looking ceiling returns **the ceiling** when the answer lies above it, silently, and the caller cannot tell that from a solved rate. That failure mode prints a confident wrong number on the module's headline figure.
- **Impact** A silently clamped solve is the one outcome worse than no rate, by the proposal's own argument.
- **Recommendation** If B or C is ruled, the ruling itself should fix three things: a fixed iteration count (never a converge-until loop), a `return null` on non-convergence or on a bracket that fails to straddle, and a harness flow in `tools/harness/debts.js` asserting the four rows of §4's table as a regression fixture. Also require the function to be **pure over one debt record** — no `db` read — which makes it the first debt figure testable without a fixture database and keeps the no-Dashboard condition trivially true.
- **Effort** S (the guard, not the feature)

---

### Low

**CODE-06 — The derived-figures block header states a count**

- **Severity** Low
- **Location** `expense-pwa\index.html:9441` — "ALL THREE FIGURES BELOW ARE STOCKS."
- **Evidence** `knowledge/coding-standards.md` §Comments: "Never write 'the only', 'all', or a count, unless something enforces it. State the rule, not the tally." Nothing enforces three. The decoder adds a fourth function to this block and makes the header false on the day it lands.
- **Impact** A comment that is the module's design record becomes wrong at the exact place a reader goes to learn what the module's figures are.
- **Recommendation** Restate as the rule — every figure in this block is a stock, which is why none takes a date argument and none reaches the Dashboard. Mandatory in the same commit if the decoder ships (ARCH-01).
- **Effort** XS

**CODE-07 — A line-number citation inside `renderDebts`, already pointing at the wrong function**

- **Severity** Low
- **Location** `expense-pwa\index.html:9686-9688` — "Hoisted out of the template rather than commented inside it, on the openThemePicker precedent at :4987-4993".
- **Evidence** `openThemePicker` is at `:5761`. Lines `4987-4993` are inside `initPeriodFilter`'s `syncCalendarAnchor` closure. The citation is wrong by roughly 770 lines. `coding-standards.md` §Comments forbids line-number references outright, and commit `54e8c4a` applied ARCH-01 to eight such citations in `tools/` — this one, in the application file and inside the module under review, was not swept. At least one more lives at `:6992` ("on the :1117 precedent"), outside my scope but the same class, so the sweep is not a one-liner.
- **Impact** The next reader follows the coordinate to unrelated code and either distrusts the record or copies the wrong precedent.
- **Recommendation** Name the function: "on the precedent in `openThemePicker`". Sweep the remaining in-file coordinates in the same commit.
- **Effort** XS

**CODE-08 — The per-card "paid" figure and the "Paid back so far" tile disagree when a debt is overpaid**

- **Severity** Low
- **Location** `expense-pwa\index.html:9539-9540` (capped per debt) versus `:9722` (`fmt(paid)`, uncapped)
- **Evidence** The module's own harness fixture demonstrates it: `tools/harness/debts.js:855-887` seeds debt `T1` with a 200,000 payment against a 130,000 total. The summary tile counts 130,000 for that debt; the card on the same screen reads "200,000 paid of 130,000" at 100%. The harness asserts the summary reconciles and asserts nothing about the card.
- **Impact** The helper sentence's promise — paid plus still owed is the total agreed — is contradicted by the cards it summarises, for a user who typed the whole total as a final payment. No stored data is wrong and each figure is individually defensible, which is why this is Low rather than Medium.
- **Recommendation** Decide the rule once. Cheapest: a single `debtPaidCapped(d)` used by both the tile and the card, so the cap is one named rule rather than two sites that can drift. Leaving the card literal is also defensible — but then say so in the comment at `:9529-9538`, which currently reads as though the cap is the module's uniform rule.
- **Effort** XS

**CODE-09 — Debt records arriving through `loadFromCloud` are never seen by `debtProblem`**

- **Severity** Low
- **Location** `expense-pwa\index.html:4047-4048`, against `debtProblem`'s stated justification at `:4493-4499`
- **Evidence** `debtProblem` validates `dueDate`'s format specifically "because `renderDebts` and `computeReminders` both `parseISO` it, and `parseISO` of a non-ISO string yields 'NaN-NaN-NaN'". `loadFromCloud` assigns `db` from parsed JSON and writes the raw string to `localStorage` without `importProblem`; `load()`'s own comment at `:3883-3889` records this gap and defers it as WORK-15. Consequence in this module: a malformed `dueDate` renders "📅 Due &lt;junk&gt; · NaNd left" (`:9707-9713`) and puts a `NaN` `daysUntil` into `computeReminders` (`:5213`). Referential integrity is likewise unchecked — `importProblem` validates `debtPayments` shape (`:4605`) but never that `debtId` resolves, so an orphan payment would be invisible on this screen and still counted by the Data Summary (`:6990`), which is the precise harm the delete cascade at `:9765-9769` exists to prevent.
- **Impact** None today on the local path. Recorded so the Debts module is a named consumer when WORK-15 is scheduled, and so the rate function is not written assuming `debtProblem` has run.
- **Recommendation** No new work in this cycle. Record the dependency; if the decoder ships, its guards must be defensive in their own right.
- **Effort** XS to record

---

## Response to the design request

**§3 — the no-schema-change reading is correct, and I confirm it.** `date` is required and ISO-validated (`debtProblem:4483`), `dueDate` is optional and ISO-validated when present (`:4499`), and both write paths store both (`:9977-9979`, `:10523-10527`). Term = `dueDate − date` is derivable for every debt carrying a due date. No new storage key, schema field or migration, so the standing prohibition is not tested. Two implementation notes: the field is absent in pre-`dueDate` backups and written as explicit `null` by both current write paths, so the function must treat absent and `null` alike; and a rate is a **stock** in this module's sense — a property of the contract, true as of now — so it belongs in the `debtPaid`/`debtOutstanding`/`debtInterestPaid` block and inherits the no-filter, no-Dashboard rules for free.

**It must not read `db.debtPayments`.** The rate is a property of the contract, not of the ledger; a later reader will ask why it ignores recorded payments, and the comment must answer that before they "fix" it.

**§4 — I do not rule, but two engineering facts should be on the record before the architect does.** Option A is one expression and no new failure modes beyond CODE-03. Options B and C require this file's first numeric solve, with CODE-05's hazards. **Option C additionally reopens a block that is explicitly closed**: the comment at `:9588-9590` states the summary helper block is closed at three sentences and "a fourth needs a new ruling" — C's "explanation of the gap" is that fourth sentence, so choosing C is choosing to make that ruling. Putting the secondary flat figure on the card rather than in the summary block avoids it. **Option D is the most expensive over time**, not the cheapest: it publishes the lender's number first and then changes a figure the user has already learned, and this application has no restatement record anywhere (`openDebtEditModal:9833`).

**§5 — see CODE-03.** Zero-length term is a UI-reachable state, not an import artefact. On the very-short-term row I have no engineering objection: with the day-based formula of CODE-04 and a `term > 0` guard, a 3-day term produces a large but finite, correct number. It is a credibility question, not a correctness one, and it is the architect's to rule.

**§6 item 4 — confirmed.** `db.debts` has exactly three consumers outside `renderDebts` and its modals: the `computeReminders` debt branch (`:5208`), the Data Summary count (`:6989`), and nothing else (verified by searching every `db.debts` reference). No Dashboard or Analytics path touches it. A rate rendered inside `renderDebts` cannot reach a Dashboard total.

---

## Review Areas

- **Correctness of money** — Clean. Whole tugrik throughout; `fmt` rounds once at the edge; `debtInterestPaid` does one `Math.round` on the running total with the cap inside the multiplication; `debtOutstanding` floors at zero; every coercion is `+x || 0`. No NaN, Infinity or sign path found in the built module.
- **Data and persistence** — One source of truth (`db.debts` + `db.debtPayments`, separate collections with the reasoning recorded at `:3835-3855`). Import validation rejects whole files rather than repairing records. No half-write is possible — every handler mutates then calls one `save()` and reports its return. Offline-first holds: nothing in the module touches the network. Gaps: CODE-09.
- **Architecture** — Clean. Derived figures are pure of the DOM; renderers are pure of storage except through `db`; no debt figure reaches the Dashboard, and the harness enforces it.
- **Maintainability** — Good, with CODE-06, CODE-07 and CODE-08 against it. `renderDebts` is long (`:9505-9773`) but is a sequence of hoisted, commented sections rather than nested logic, and the hoisting of `noteChip`/`dueChip` out of the template is the right call for the documented reason. No dead code found in the module.
- **Error handling** — Clean. Every write reports through `savedToast(ok, …)`; failed saves leave modals as they were (`:9935-9936`) with the banner speaking; every id look-up that can race a delete re-resolves and returns. Nothing is swallowed.
- **Security** — Clean. Every user string reaching the DOM in this module goes through `escapeHTML` — `name`, `notes`, `date`, `dueDate`, `id` on all five data attributes, and `r.title`/`r.sub` in the reminder sheet (`:5417-5418`). `confirmDialog` and `toast` use `textContent`. No debt data is logged. No third-party dependency is involved.
- **Performance** — Acceptable at realistic scale, quadratic in shape. `renderDebts` walks `db.debtPayments` roughly seven times per debt — three summary reduces, `totalPaid`, plus `paid`/`outstanding`/`interest`/`payments` in the map — and the sort comparator at `:9650-9651` calls `debtOutstanding` twice per comparison, adding another `D log D × P`. At 20 debts and 500 payments that is nothing; at 50 debts and 10,000 payments it is millions of element visits per render, on every payment write. Carried as debt below rather than as a finding because I have no measurement and the target user has a handful of debts.
- **Reliability and scalability** — The Debts screen is not the module that breaks first at 10,000 records; the payment ledger stays small by nature. What breaks first is the render cost above, and only if the app is repurposed for many debts.
- **Technical debt** — Below.

---

## Technical Debt

- **The per-debt payment scan (`debtPaid`) is re-run seven-plus times per render.** Not a defect and not worth optimising now — `coding-standards.md` says never optimise prematurely. It becomes real if a payoff planner (strategy item 2) iterates scenarios over the same figures, which is exactly what an avalanche/snowball projection does. The cheap fix when it arrives is one `Map` of debtId → paid built once per render; the shape of `debtPaid(debtId)` supports that without changing any caller.
- **The bell badge has no single refresh seam** (CODE-01). Five debt sites and seven goal/expense sites each remember to call it individually. Every new write path is one more chance to forget. Not worth an abstraction today; worth noting that the next module with reminders makes it three lists to remember.
- **Line-number citations in the application file** (CODE-07). ARCH-01 was applied to `tools/` in `54e8c4a` and the application file still carries at least two.
- **The cloud path bypasses both `load()` and `importProblem`** (CODE-09, CODE-02, deferred WORK-15). Two separate consequences already land on this module. It gets more expensive the longer cloud sync stays half-built.

## Future Risks

- **The decoder's rate is the first figure in this application derived from an assumption rather than from a record.** Every existing figure is arithmetic over what the user typed. If option B or C is ruled, the module starts making a claim about a contract it has never seen — which it has done once before, in `debtInterestPaid`, and survived only because it says so on screen. The labelling practice is the load-bearing part, not the arithmetic.
- **The payoff plan (strategy item 2) will want the rate per debt and will want to iterate it.** If the rate function is pure over one record, that is free. If it reaches into `db`, item 2 pays for it.
- **A renegotiated loan still has no answer.** `openDebtEditModal` is documented as the answer to a typo, with no version history (`:9833-9836`). A rate that changes when a user edits a debt will read as the application changing its mind. Not a blocker; it is the next question this module gets asked.
- **The language layer (strategy item 3) meets a module whose every string is a literal**, including the three helper sentences whose exact wording carries the module's honesty. Those sentences are the hardest strings in the app to translate and the most costly to get wrong.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **`updateBellBadge()` at the five debt write sites** (CODE-01). XS, removes the one defect a user meets in normal use.
2. **Route `loadFromCloud` through `navigate()`** (CODE-02). XS, deletes a hard-coded list that has already drifted once in this codebase and closes the same defect class at its second door.
3. **If the decoder is approved: day-based term, `> 0` guard in the derived function, `null` for "no rate"** (CODE-03, CODE-04). These are not three changes; they are the shape of one function, and getting them wrong is the only way this feature can print a wrong number.
4. **Restate the block header as a rule and fix the `openThemePicker` citation** (CODE-06, CODE-07). XS, and item 3 forces the first of them anyway.
5. **One `debtPaidCapped(d)` shared by the tile and the card, or one sentence in the comment saying why they differ** (CODE-08). XS.

No rewrite is recommended, no new abstraction is recommended, and no dependency is recommended.
