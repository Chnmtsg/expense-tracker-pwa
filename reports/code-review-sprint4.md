# Code Review: Sprint 4 Post-Implementation (5ec2dfe..27d3291)

**Inputs.** I read `knowledge/review-conventions.md`, `knowledge/coding-standards.md` and `knowledge/project.md`. I checked the work against these rulings:
- `reports/chief-architect-sprint3-review.md`: the Sprint 4 list, the conditions of approval, the WORK-22 deferral row and the Conflict Rulings.
- `reports/archive-chief-architect-round14.md`: S1 and the WORK-210(b) row for the pre-ruled bound, S2 and the WORK-213 row for the delegation shape, and C44.

Source read:
- `expense-pwa/index.html`: `computeSalary`, `calcSalary`, `sSave`, `renderIncome`, `renderExpenses`, both delegated list handlers, `setExpMode`, `openEditModal`, the `data-show-all` handler, `fmt`/`unmoney`/`unnum`, `drawMonthlyTrend`
- `expense-pwa/sw.js`
- `tools/harness/perf.js`
- `tools/harness/run.mjs`
- `tools/harness/accounts.js`
- `tools/check-saves.mjs`
- `reports/HANDOFF.md`

**Limits.** I could not run git, npm or the probes, and I could not see the pre-delegation code. "Behaviour-identical" is therefore judged against the current handlers on their own terms, not against a diff. Where I say a probe "can fail", I mean the code path it asserts on differs on the shape I describe; I did not see it go red. I could not verify the commit messages that record each probe's red.

## Executive Summary

Sprint 4 lands every ruled item in its ruled shape.
- **`computeSalary`** now derives every total from the rounded parts. Its new probe goes red on the old arithmetic for both ruled input sets.
- **The `perf.js` seed** is anchored to the current month.
- **`run.mjs`** prints the wall-time bound beside the probe's in-frame sum, only when the probe reports one, and asserts nothing.
- **The two list handlers** are delegated once at load, in the `data-show-all` pattern.
- **`sw.js`** reads v30, which is correct because v29 is live and `index.html` changed.

There are no Critical, High or Medium findings.

The biggest risk is coverage. Delegation rewired the four Income and Expenses row controls, but only one of them (Income Delete) is ever clicked by a probe. Removing the `#expList` listener entirely, or breaking the Planned-mode branch, would still pass `npm test`. The other findings are design-record comments that say more than the code or the instrument supports, plus a stale HANDOFF state line.

## Overall Score

**92 / 100.** Every finding is Low. No figure is written wrongly, and every ruled shape and condition I could check is present in the code.

It sits in the low 90s rather than higher for two reasons:
- The commonest edit and delete controls in the app were rewritten with three of four paths unprobed (CODE-01).
- Two comments in the instrument now contradict each other, or C44, about what a `perf.js` figure may settle (CODE-03, CODE-04).

## Conformance by Item (one line each where clean)

- **UI-05 / CODE-04: matches the ruling.**
  - `computeSalary` (`index.html:6807-6822`) does exactly the ruled steps: it rounds each part, takes `gross` as the sum of those rounded parts, computes `si`/`wht` as `r(gross * pct)` on that integer gross, sets `deductions = si + wht`, and sets `net = gross - deductions`.
  - The comment (`:6790-6806`) states the rule the code enforces. Its worked example (1,502 + 1,802 against 3,303) checks out arithmetically. It says that nothing migrates old records.
  - The `calcSalary` comment (`:6824-6825`) and the `sSave` comment (`:6917-6919`) are true.
  - No migration was added.
- **UI-05 / CODE-04 probe: can fail for its reason.**
  - It is `accounts.js:656-694`.
  - On the old arithmetic, case 1 shows parts of 3,304 against a gross of 3,303, and deductions of 661 against SI + WHT of 660.
  - Case 2 shows parts of 9 against a gross of 8.
  - The screen half parses `₮`-formatted text through `unmoney`, which strips the symbol correctly. The stored-row half compares raw numbers.
  - It also asserts that the income amount equals the stored `net`.
  - Both "no accounts, unchanged screen" (`:581`) and "Salary save ≡ Add Income" (`:599`) are still present.
- **CODE-03: matches the ruling.**
  - `perf.js:257-259` counts back from `new Date()`.
  - `w = 0` falls in the current month.
  - `gcd(7, 36) = 1`, so all 36 months are still covered, and the counts are unchanged.
  - `timeList(..., 1)` (`:292`, `:301`) still throws "setup failed" on an empty This Month.
- **WORK-210(b): matches the pre-ruled shape.**
  - `run.mjs:135-142` times the existing `spawnSync` from Node.
  - `:167` adds `wall_clock_ms` only when `in_frame_ms_total` is a number, so every other command's output is unchanged.
  - Nothing is asserted.
  - `perf.js:73-82` sums every `timeIt` duration, and `:307` reports it.
  - The calibration comment's new paragraph (`:57-65`) overstates what the bound sees (CODE-04).
- **WORK-22 re-take: recorded as ruled.**
  - `HANDOFF.md:150-160` has All Time and This Month for both lists over three runs, with the bound beside each run.
  - The trigger was read against All Time, as the Conflict Ruling requires. 205-273 ms is far above about 17 ms unthrottled.
- **WORK-22 delegation: the WORK-213 shape, behaviour-correct.**
  - There is one listener per container (`index.html:7030`, `:7625`), bound once at top level after the containers exist (`:2968`, `:3050`). `closest()` is used as in the `data-show-all` handler (`:13852`).
  - `expMode` is read at click time, both for Edit (`:7627`) and after the confirm `await` for Delete (`:7636`). That is sound because every mode change goes through `setExpMode`, which re-renders the list (`:7091`), so the rows on screen always belong to the current mode.
  - Clicks on the filtered empty state's "Show all time" button fall through both `closest()` tests and reach the document handler.
  - Both handlers keep `const ok = save()`, so `check-saves.mjs` sees the result consumed.
  - No per-row binding code and no stale comment about one remain.
  - Post-delegation figures are recorded at `HANDOFF.md:161-168`.
  - Probe coverage: CODE-01. Comment: CODE-02.
- **sw.js v30: correct.**
  - `sw.js:9` reads `expense-tracker-v30`, v29 is live (`HANDOFF.md:36`), and the derivation comment (`:1-8`) is unchanged.
  - HANDOFF has not caught up (CODE-05).

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

**CODE-01: Delegation rewired four row controls, and only Income Delete is clicked by any probe**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:7030-7054` (`#incList` handler) and `:7625-7640` (`#expList` handler)
  - `tools/harness/accounts.js:1196`, `:1530`, `:1538`, `:1545` (the only list-button clicks)
  - `tools/harness/accounts.js:895-920` (the CODE-06 label probe)
- **Evidence:**
  - Across `tools/`, the only `.click()` on a list row button is on `[data-del-inc=…]`.
  - No probe clicks `[data-edit-inc]`, `[data-edit-exp]` or `[data-del-exp]`. Every edit-sheet flow calls `openEditModal(...)` directly (for example `accounts.js:281`, `:289`, `:300` and `v1-write-flows.js:67`, `:97`). That path bypasses the delegated handler.
  - The CODE-06 probe reads `aria-label` only and never dispatches a click.
  - So `npm test` stays green if any of these happens:
    - the `#expList` listener is deleted;
    - `openEditModal(expMode, …)` becomes `openEditModal('actual', …)`;
    - the Planned branch at `:7637` filters `db.actual`;
    - the Income Edit early `return` is removed, so an Edit tap falls through toward Delete.
  - The ruling required that "the existing list flows must stay green". They are green, but for three of the four rewired controls they cannot go red, because they never exercise them.
  - The `expMode`-at-click-time property, which is the one behavioural subtlety delegation brings to `#expList`, is unprobed in both modes.
- **Impact:** These are the commonest edit and delete controls in the app, on the two lists that hold the user's money records. A regression in the delegated path, such as a delete hitting the wrong collection in Planned mode or a dead Edit button, would ship green. This is the same class as the Sprint 3 CODE-01: a rewrite whose key property has no probe.
- **Recommendation:** Add one flow to `accounts.js` with `confirmDialog` stubbed to resolve `true`. Through the real buttons:
  - Click `[data-edit-inc="I1"]` and assert `editCtx.kind === 'income'`, with no confirm asked. Then close.
  - In Actual mode, click `[data-edit-exp="E1"]` and assert `editCtx.kind === 'actual'`. Then click `[data-del-exp="E1"]` and assert that E1 has left `db.actual` and that `db.planned` is unchanged.
  - `setExpMode('planned')`, then click `[data-del-exp]` on a recurring plan. Assert that the series sentence was asked, that the plan has left `db.planned`, and that `db.actual` is unchanged.
  - Show it red by temporarily removing the `#expList` listener, and record that red in the commit message, as the Sprint 3 conditions require. This is harness only, with no app change.
- **Effort:** XS

**CODE-02: The delegation comment blames the 200 ms on the per-row listeners, and the post-delegation figures show that is not the cause**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:7023-7029`
- **Evidence:**
  - The comment reads: "used to bind an Edit and a Delete listener to each one on every render: at 10,000 rows All Time took over 200 ms per add on a desktop (HANDOFF, the WORK-22 re-take)."
  - Placing the cost directly after the listener binding says the listeners caused it.
  - `HANDOFF.md:161-166` records the opposite: after delegation, All Time is 205-273 ms, "No measurable change: the All Time cost is building 10,000 rows of HTML, not binding their listeners".
  - The comment also carries a figure. The standard says "State the rule, not the tally" and "Comments in this project are the design record. Keep them true."
- **Impact:** A future reader of `renderIncome` will believe the list's All Time cost was fixed here. That is the wrong starting point for the pagination or virtualisation round the ruling says this cost needs.
- **Recommendation:**
  - Drop the figure and state the rule: rows are rebuilt with `innerHTML`, so their buttons are handled by one listener on the container, bound once, as the `data-show-all` handler is.
  - If the measurement is mentioned, point to "HANDOFF, WORK-22" by name, without implying that delegation reduced the render cost.
- **Effort:** XS

**CODE-03: The WORK-22 block in `perf.js` still says its figures may not fire anything, directly above the seed this sprint edited, and they just fired WORK-22**

- **Severity:** Low
- **Location:**
  - `tools/harness/perf.js:246-253` (block comment)
  - `perf.js:254-256` (the CODE-03 lines added under it)
  - Contradicted by `perf.js:64-65` and `reports/HANDOFF.md:157-158`
- **Evidence:**
  - The block comment ends: "like every figure here (C44) these may corroborate a deferral, not fire or close one."
  - The calibration paragraph rewritten this sprint now says a figure "may settle something only when read beside that bound and the bound shows no gross dilation (C44)".
  - HANDOFF records that these exact figures, read beside the bound, fired the trigger and approved delegation.
  - The CODE-03 commit opened this block and added three lines directly under the stale sentence. The standard requires: "When you open a block, re-read the comment above it before you commit."
- **Impact:** The same file now gives two contradictory C44 readings. The next person to take a `perf.js` figure to a decision (WORK-16/49 is the obvious next one) gets both permissions and both prohibitions.
- **Recommendation:** Replace the last clause with one that defers to the calibration comment, for example: "…a row cap stays off limits; what these figures may settle is stated in the calibration comment above (C44, WORK-210(b))." Change nothing else in the block.
- **Effort:** XS

**CODE-04: The new calibration paragraph implies the wall-time bound clears dilation in both directions, but it can only see a frame clock running fast**

- **Severity:** Low
- **Location:**
  - `tools/harness/perf.js:57-65`, read against `:50-55`
  - `reports/HANDOFF.md:154-156`
  - (`run.mjs:162-166` states it correctly as "an upper bound")
- **Evidence:**
  - The wall time includes Chrome's start and the boot, so it is an upper bound on real in-frame time. The paragraph says so correctly: "an in-frame total near or above it is the frame clock running fast".
  - It then concludes, without qualification, that a figure "may settle something only when read beside that bound and the bound shows no gross dilation (C44)".
  - C44 (`archive-chief-architect-round14.md:253`) and this file's own `:53-55` say dilation "distorts in both directions, so a figure above a threshold is no more trustworthy than one below it".
  - A frame clock running slow makes in-frame figures smaller, which leaves the total even further below the wall time. The bound cannot detect it.
  - The bound's discriminating power also has a size. At 3,133 ms in-frame against 6,873 ms wall, it rules out a fast clock of more than about 2.2x and nothing finer.
  - For WORK-22 none of this matters. The decision fired on a figure about 12x over threshold, which is exactly the direction and the margin the bound can vouch for. The record's conclusion stands.
  - This does not challenge the pre-ruled shape. It is the WORK-210(a) class: a sentence claiming more than the instrument delivers.
- **Impact:** The next decision may be a closure, where a figure is under its threshold (for example a WORK-16/49 re-take, or All Time after a future list change). Read against this paragraph, the bound would be taken as clearing a figure it cannot bound from below. That is the case C44 says the figure must not decide.
- **Recommendation:**
  - Add one sentence to `perf.js:57-65`: the bound sees only a clock running fast. It can support a figure above a threshold by more than the bound's margin, but it says nothing about a figure below one. A closure on a `perf.js` figure therefore goes up for a ruling.
  - Optionally note the about 2.2x margin beside the re-take in HANDOFF.
  - Do not change `run.mjs`.
- **Effort:** XS

**CODE-05: HANDOFF still says nothing on `main` is undeployed, and has no Sprint 4 entry or v30 state**

- **Severity:** Low (overlaps `ui-review-sprint4.md` UI-02)
- **Location:** `reports/HANDOFF.md:36-38`, `:65-68`
- **Evidence:**
  - `:37-38` reads "Nothing on `main` is undeployed", but `sw.js:9` reads v30 and `main` holds Sprint 4.
  - `:65-68` still lists Sprint 4 as "Next".
  - No bullet records what Sprint 4 landed or that v30 is staged and not deployed. "v30" does not appear anywhere in HANDOFF.
  - The WORK-22 paragraphs (`:150-168`) are present but sit under "Measured, not built", not in the state list.
- **Impact:** The next session reads that there is nothing to deploy. A Salary money change, which alters the net a new save writes, sits undeployed, and the record says it does not exist. This is the Sprint 3 CODE-09 class.
- **Recommendation:**
  - Replace the "Next (Sprint 4…)" line with a Sprint 4 bullet: UI-05/CODE-04, CODE-03, WORK-210(b), the WORK-22 re-take and delegation.
  - Change the state line to: `v30 staged on main, not deployed; live sw.js at v29 (confirm before deploy).`
- **Effort:** XS

## Review Areas

- **Correctness of money:** One rounding boundary, in `computeSalary`. The totals are now derived from the shown integers, so `fmt`'s own rounding cannot disagree with them. Stored rows and income agree. Clean.
- **Data and persistence:** No schema or storage change and no migration, as ruled. The delete handlers keep their existing writes and `save()` result handling. Clean.
- **Architecture:** Delegation follows the existing `data-show-all` pattern, with no new abstraction. Clean.
- **Maintainability:** Comment accuracy (CODE-02, CODE-03, CODE-04). Otherwise clean.
- **Error handling:** The delegated handlers keep `savedToast(ok, …)`. Clean.
- **Security:** No new DOM sink. Row ids remain `escapeHTML`'d into the data attributes and are read back through `dataset`, never built into a selector. Clean.
- **Performance:** About 20,000 fewer listeners at 10,000 rows. All Time is still about 200-270 ms unthrottled, because the cost is row construction. This is recorded, not a finding.
- **Reliability and scalability:** All Time list renders remain far above the 100 ms at 6x trigger after delegation. That is for the ruling chain to act on (see Future Risks).
- **Technical debt:** See below.

## Technical Debt

- **`perf.js`'s header carries stale tallies and a stale trigger statement.**
  - `:24-25` says the standing commands are "six since `crosswindow` joined". `HANDOFF.md:170` records seven since `accounts`.
  - `:106-112` says the WORK-16/49 trigger "is stated against the 'This Month' configuration specifically". Round 14 S3 re-aimed it at All Time.
  - Both predate Sprint 4 and sit outside the blocks it opened, so neither is raised as a finding. They become due the next time those blocks are opened, and both should then state the rule, not the count. This is the same file as CODE-03 and CODE-04.
- **The WORK-16/49 seed (`perf.js:118`) is still fixed to 2024-2026.**
  - From 2027-01-01, the Dashboard This Month figure times a month with no records.
  - `drawMonthlyTrend` draws the column regardless, so the WORK-211 setup assertion (`:158`) still passes.
  - The per-month scan still walks the full store, so the cost stays representative and the This Month figure is no longer a trigger configuration. That is why this is debt, not a defect.
  - It was outside CODE-03's ruled scope, and the same one-line anchor would close it.
- **Salary records written before v30 are internally inconsistent by up to ₮1 per part,** and the history sheet (`index.html:7914`) shows them as they are. This was accepted by ruling and is listed only so it is not rediscovered as a defect.

## Future Risks

- **The All Time list cost is now the most-measured open cost in the app, and nothing is pre-ruled for it.** At 10,000 records it is about 1.2-1.6 s per add at the assumed 6x, after delegation. A row cap stays off limits. Pagination or virtualisation needs its own round, and the risk is that it is reached for under time pressure without one. UI-01 of the UI review asks for a deferral row to carry this.
- **The first `perf.js`-based closure.** Without CODE-04's sentence, the bound will be read as clearing a below-threshold figure it cannot bound.
- **Any later rewrite of `renderExpenses`,** such as a Planned-mode occurrence view or pagination, will touch the delegated `#expList` handler with no click-level probe behind it until CODE-01 lands.

## Recommended Refactoring

No structural change is needed. The smallest set that removes the most risk:

1. **CODE-01:** one harness flow that clicks all four row controls in both expense modes, shown red against a removed `#expList` listener.
2. **CODE-03 and CODE-04:** two comment edits in `perf.js` that make its C44 statements agree with each other and with what the bound can see.
3. **CODE-02:** restate the delegation comment as a rule, without the figure.
4. **CODE-05:** the HANDOFF Sprint 4 bullet and v30 state line, before the deploy.

All are XS. CODE-01 is harness only. The rest are comments and records.

Relevant files:
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\expense-pwa\sw.js
- D:\3_Claude\PowerApps\tools\harness\accounts.js
- D:\3_Claude\PowerApps\tools\harness\perf.js
- D:\3_Claude\PowerApps\tools\harness\run.mjs
- D:\3_Claude\PowerApps\reports\HANDOFF.md
- D:\3_Claude\PowerApps\reports\chief-architect-sprint3-review.md
- D:\3_Claude\PowerApps\reports\archive-chief-architect-round14.md
- D:\3_Claude\PowerApps\reports\ui-review-sprint4.md
