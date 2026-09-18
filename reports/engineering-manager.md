# Engineering Manager — Round 16 Work Plan

**Scope:** the Debts module in `D:\3_Claude\PowerApps\expense-pwa\index.html`, together with `D:\3_Claude\PowerApps\reports\design-request-true-cost-decoder.md` as specified.

**Inputs read in full and unmodified:**
- `D:\3_Claude\PowerApps\reports\ui-review.md` — 13 findings (UI-01…UI-13), 80/100
- `D:\3_Claude\PowerApps\reports\code-review.md` — 9 findings (CODE-01…CODE-09), 84/100
- `D:\3_Claude\PowerApps\reports\design-request-true-cost-decoder.md`, `D:\3_Claude\PowerApps\knowledge\product-strategy.md`, `D:\3_Claude\PowerApps\reports\chief-architect.md`, `D:\3_Claude\PowerApps\reports\archive-chief-architect-round14.md`, `D:\3_Claude\PowerApps\knowledge\review-conventions.md`

All 22 findings are carried below. Nothing is dropped, no severity is altered, and every `WORK-` item traces to at least one source ID.

**ID note.** Per `review-conventions.md` these `WORK-` IDs are numbered from 01 within this report and are Round-16 IDs. Where an earlier round's `WORK-` number is referenced I qualify it — in particular CODE-09 cites the standing cloud-validation deferral recorded in `load()` as "WORK-15" under an earlier numbering, which is **not** this report's `WORK-15`.

---

## Project Health

Two independent reviews of the same module found zero Critical and zero High findings in the code as built, and both scored it in the 75-89 "Solid" band (UI 80, Code 84) — the shipped Debts module is the most carefully reasoned screen in the application and it is fit for release today. Its defects are contained: five Mediums against built code and behaviour, and both reviewers independently landed on the same unreconciled overpayment display. The one High finding in this cycle is UI-01, and it is filed against the **unbuilt** proposal, not the module: it says that shipping §5's "omit the rate, say nothing" would make the product strategy's first-sequence, permanently-free, mission-defining figure invisible and unexplained for every debt without a due date. The module is therefore in good shape to receive the decoder, and the decoder is not in good shape to be received — it needs an architectural ruling on §4 and §5 before any of it can be scheduled.

---

## Priority Matrix

| Item ID | Title | Source IDs | Severity (as filed) | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Refresh the bell badge at the five debt write sites | CODE-01 | Medium | P2 | XS | — |
| WORK-02 | Route `loadFromCloud` through `navigate()` instead of a hard-coded screen list | CODE-02 | Medium | P2 | XS | — |
| WORK-03 | Reconcile the per-card "paid" figure with the "Paid back so far" tile in the overpayment state | UI-02, CODE-08 | Medium (UI-02), Low (CODE-08) | P2 | S | Conflict C1 ruling |
| WORK-04 | Make the due-date helper state what the field actually does | UI-03, UI-01 (helper half) | Medium (UI-03), High (UI-01) | P2 | XS | See Dependencies — one edit or two |
| WORK-05 | Collapse the add-debt card into the existing `<details>` disclosure | UI-04 | Medium | P2 | S | — |
| WORK-06 | Exact-remainder quick-amount chip on the payment sheet | UI-05 | Medium | P2 | S | — |
| WORK-07 | Label the card's bare 22px percentage | UI-08, UI-06 (part 2) | Low (UI-08), Medium (UI-06) | P1 | XS | Blocks WORK-16 |
| WORK-08 | One name for `debtInterestPaid` at both its sites | UI-09 | Low | P3 | XS | — |
| WORK-09 | Required-field mark and `aria-required` on the payment sheet's Amount | UI-10 | Low | P3 | XS | — |
| WORK-10 | Eight-figure total wrapping mid-number at 320px — measure, then fix if real | UI-11 | Low | P3 | XS | Width probe first |
| WORK-11 | A recorded payment can only be deleted, never corrected | UI-12 | Low | P3 | M | Deferred — reviewer recommends no action this cycle |
| WORK-12 | Restate the derived-figures block header as a rule, and fix the wrong in-file citation | CODE-06, CODE-07 | Low, Low | P3 | XS | Mandatory in the decoder commit if it ships |
| WORK-13 | Record Debts as a named consumer of the deferred cloud-validation gap | CODE-09 | Low | P3 | XS (record only) | WORK-02 lands first |
| WORK-14 | **[proposal]** Do not ship §5 row 1 as "say nothing" — render the actionable prompt where the rate would be | UI-01 | High (if shipped as specified) | P1 | S | Architect ruling on §3/§5; WORK-16 |
| WORK-15 | **[proposal]** The rate function's shape: day-based term, contracted span, `> 0` guard, `null` for "no rate", pure over one record | CODE-03, CODE-04, UI-13, UI-07 (guard half) | Medium, Medium, Low, Medium | P1 | XS–S | Architect ruling on §4 |
| WORK-16 | **[proposal]** Give the rate a readable home on the debt card — a sentence, not a chip; a display threshold for extreme rates; off the summary card and out of the bell | UI-06, UI-07 (display half) | Medium, Medium | P1 | M | WORK-07, WORK-15, architect ruling on §4/§5/§6.4 |
| WORK-17 | **[proposal]** If option B or C is ruled: bounded solver, fixed iteration count, `null` on non-convergence, harness fixture for §4's four rows | CODE-05 | Medium | P1 | S | Conditional on the §4 ruling; WORK-15 |

---

## Quick Wins

XS or S items that remove Medium or higher severity. Do these first inside their priority band.

- **WORK-01** (XS, Medium) — one call beside five existing `renderDebts()` calls; removes the only built-code defect a user meets in normal use.
- **WORK-02** (XS, Medium) — deletes a hard-coded list that has already drifted once in this codebase, and closes the class at its second door.
- **WORK-04** (XS, Medium) — one clause on an existing helper line makes a named permanently-free feature discoverable and stops an unannounced OS notification.
- **WORK-07** (XS, Low filed, gates a Medium) — one word next to the card's largest number; it stops being optional the moment a second percentage lands.
- **WORK-03** (S, Medium) — one gated line removes the only place this screen contradicts itself about money.
- **WORK-06** (S, Medium) — removes the overpayment state at its source rather than capping it downstream.
- **WORK-05** (S, Medium) — one existing disclosure primitive puts the module's repeat action back above the fold.
- **WORK-15** (XS–S, Medium ×2) — the whole of it is the shape of one function, and getting it wrong is the only way this feature prints a wrong number.

Not quick wins despite being cheap: **WORK-08, WORK-09, WORK-10, WORK-12, WORK-13** are all XS but remove Low severity only.

---

## Sprint Plan

**Sprint 1 — harden the module before it grows a rate. Eight items, roughly 2.75 days.**

`WORK-01` → `WORK-02` → `WORK-04` → `WORK-12` → `WORK-07` → `WORK-03` → `WORK-06` → `WORK-05`

| Item | Effort |
|---|---|
| WORK-01 | XS |
| WORK-02 | XS |
| WORK-04 | XS |
| WORK-12 | XS |
| WORK-07 | XS |
| WORK-03 | S |
| WORK-06 | S |
| WORK-05 | S |

**Total: five XS + three S ≈ 2.75 days.**

**What the sprint delivers.** The bell stops counting debts the application knows are settled. A user standing on Debts when cloud data replaces local data no longer reads the previous database's balances. The screen stops stating two different figures for the same money. The optional due-date field stops having invisible consequences. The final payment — the one the module's own comment names as the observed cause of the overpayment state — can be entered with one tap on the exact figure already on screen. The returning user reaches "+ Payment" without a full swipe past a form they completed months ago. And the card's largest number and the derived-figures block header are both true and labelled, which is the state the card has to be in before a second percentage arrives.

**Why the decoder is not in this sprint.** Every decoder item (WORK-14 through WORK-17) is blocked on a Chief Architect ruling that does not yet exist — §3's schema reading, the A/B/C/D choice in §4, the short-term case in §5, and the Debts-screen-only confinement in §6.4. Scheduling implementation against an unmade ruling would be the optimistic long plan this section exists to avoid. The decoder is Sprint 2, in full, the moment the ruling lands.

---

## Roadmap

| Sprint | Items |
|---|---|
| **Sprint 1** | WORK-01, WORK-02, WORK-04, WORK-12, WORK-07, WORK-03, WORK-06, WORK-05 |
| **Sprint 2** | WORK-15, WORK-16, WORK-14, WORK-17 (conditional on the §4 ruling being B or C) |
| **Sprint 3** | WORK-08, WORK-09, WORK-10, WORK-13 |
| **Later** | WORK-11 |

Sprint 2 is the decoder as one release. If the architect rules A or D, WORK-17 drops out and Sprint 2 is WORK-15 → WORK-16 → WORK-14 only; WORK-16's presentation work is unchanged by that ruling except for how many figures it must carry.

WORK-11 sits in Later on its reviewer's own recommendation ("No action this cycle"), and carries the reviewer's condition: if it is ever taken up it is one shared correction sheet covering both the debt-payment and goal-contribution ledgers, not two.

---

## Dependencies

1. **WORK-07 before WORK-16.** The card already carries an unlabelled 22px percentage meaning *repaid*. Landing a second percentage meaning *cost per year* within about 100px of it, while the first is still unlabelled, converts a Low into a comprehension failure on the feature that cannot afford one. UI-06 states this as part 2 of its own recommendation. This is why WORK-07 is P1 despite being filed Low — the priority is mine, the severity is UI-08's and unchanged.

2. **WORK-15 before WORK-16.** The presentation gates on what the function returns. `null` for "no rate" is what lets WORK-16 and WORK-14 distinguish "no term" from "zero cost" from "term is zero or negative", and CODE-03 is explicit that the guard belongs in the derived figure and **not** in `debtProblem`, whose deliberate refusal to cross-check `dueDate` against `date` must not be reopened.

3. **WORK-16 before/with WORK-14.** WORK-14 tells the user to enter a due date so they can see what the loan costs per year. If the rate then arrives with no readable home, WORK-14 has sent the user to a number they cannot parse. The High finding is not closed by the prompt alone.

4. **WORK-12 rides the decoder commit if the decoder ships.** CODE-06 is mandatory in the same commit as any fourth function in that block — "ALL THREE FIGURES BELOW ARE STOCKS" becomes false on the day the rate lands. Scheduling it into Sprint 1 discharges this in advance; if for any reason it slips, it is not optional in Sprint 2. Note also CODE-07's scope warning: at least one more wrong in-file coordinate lives at `:6992`, outside this review's scope, so the ARCH-01 sweep of the application file is not a one-liner and should not be smuggled into this item.

5. **WORK-04 — one helper edit or two, and the architect should say which.** UI-01 and UI-03 both land on the same three lines (`index.html:3080-3082`) and UI-01 asks that the edit be "made once". The reminder clause (UI-03) is unconditional and Medium; the decoder clause (UI-01) is conditional on a ruling that does not exist yet. Default: ship the reminder clause in Sprint 1 and let WORK-14 amend the same helper in Sprint 2. The alternative is to hold WORK-04 until the ruling and make one edit. I have not decided this for the architect because it turns on how soon the §4 ruling arrives.

6. **WORK-06 reduces the incidence of the state WORK-03 reconciles, but does not replace it.** Existing records already in the overpayment state are unaffected by a new chip, and UI-02's contradiction is present on every render of such a record. Both are needed. Order WORK-03 before WORK-06 only if the C1 ruling is in hand; otherwise the order is free.

7. **WORK-02 before WORK-13.** Both concern `loadFromCloud`. WORK-02 is code; WORK-13 is a record-only item naming Debts as a consumer of the standing cloud-validation deferral (recorded in `load()`'s comment, earlier numbering). CODE-09 explicitly asks for no new work this cycle, and adds one binding condition to the decoder: **the rate function's guards must be defensive in their own right**, because `debtProblem` has never run over cloud-loaded records.

8. **WORK-17 is gated on the §4 ruling.** It exists only under B or C. CODE-05 asks that the guards be part of the ruling itself rather than left to implementation, because `debtProblem` puts no upper bound on `totalToRepay` and the term can be one day, so the worst case is unbounded and a plausible-looking bisection ceiling returns the ceiling silently.

9. **The standing prohibition is not tested.** Both reviewers addressed the Round 15 off-limits entry on any new storage key, schema field or migration. Code Review confirms §3's no-schema-change reading against the source: `date` required and ISO-validated, `dueDate` optional and ISO-validated, both stored by both write paths. No decoder item below requires a schema change. The one implementation note that follows: the field is absent in pre-`dueDate` backups and written as explicit `null` by both current write paths, so the function must treat absent and `null` alike.

---

## Conflicts

For the Chief Architect. I state both positions and resolve none.

### C1 — The overpayment display: severity, and the direction of the fix (UI-02 vs CODE-08, gates WORK-03)

Both reviewers found the same defect independently, at the same two sites (`:9539-9540` capped, `:9722` uncapped), and disagree on both how bad it is and what to do.

- **UI Review, UI-02, Medium.** The application disagrees with itself about how much money the user handed over, using the same word for both figures, one card apart, for an audience defined as having little accounting knowledge and being under financial stress. Explicitly: *"Do not cap the card figure — the ledger total is a fact and the user should see what they recorded."* Fix is a reconciling line gated on `debtPaid(d.id) > totalToRepay`, in the module's existing helper voice. No derivation changes, no cap reopened.
- **Code Review, CODE-08, Low.** No stored data is wrong and each figure is individually defensible, which is why it is Low. Cheapest fix is the opposite direction: *"a single `debtPaidCapped(d)` used by both the tile and the card, so the cap is one named rule rather than two sites that can drift."* Leaving the card literal is also allowed, **but then the comment at `:9529-9538` must say so**, because it currently reads as though the cap is the module's uniform rule. Code Review also notes the harness already seeds this exact state (`tools/harness/debts.js:855-887`) and asserts the summary but nothing about the card.

Both severities stand as filed. The two recommendations are mutually exclusive in their primary form: UI-02 forbids capping the card, CODE-08 prefers capping both. CODE-08's secondary branch (leave the card literal, correct the comment) is compatible with UI-02 and is the only overlap between them. The effort is XS-to-S either way, so this is not a cost decision.

### C2 — The §4 option disposition (UI-06 vs Code Review's §4 response, gates WORK-16 and WORK-17)

Both reports responded to §4 within their own remit. They agree on two things and pull in opposite directions on a third.

**Agreed by both:** option D is the most expensive over time, not the cheapest — it publishes the lender's own figure and then doubles the headline number for the same debt in a later version with no change to the user's data, and this application has no restatement record anywhere. And option C, by adding an explanation of the gap to the summary, is choosing to reopen the block the comment at `:9588-9590` closes at three sentences.

**The pull:**
- **UI Review (UI-06), from comprehension only, explicitly declining the arithmetic:** *"Option B is the only one whose output is one number, one label and one assumption sentence — the exact shape `debtInterestPaid` already ships and that this module has proven it can carry."* On A: *"a number that confirms the framing the screen exists to break has no behaviour-changing content left in it."* On C: three percentages and a request to hold the difference between two annualisation methods, for this user.
- **Code Review, explicitly declining to rule, recording engineering facts:** option A is *"one expression and no new failure modes beyond CODE-03."* Options B and C require this file's first numeric solve, with CODE-05's hazards, over a worst case that is genuinely unbounded. And CODE-05's own summary: *"A silently clamped solve is the one outcome worse than no rate, by the proposal's own argument."*

So the report that judges comprehension rules out A and lands on B; the report that judges engineering records that B is the option introducing a new class of failure into the module's headline figure, and that A introduces none. Neither reviewer claims the other's ground. The decision is the architect's, and it is a mission question before it is a technical one, as §4 itself says.

### C3 — A contested proposal claim, not a reviewer disagreement (informational, gates WORK-14)

Recorded here so it is not lost, and labelled so it is not mistaken for a conflict between the two reports.

- **The proposal, §3:** the cost of taking the free option — no rate for debts without a `dueDate` — *"is close to zero"*, because a debt with no agreed date is money from family and carries no cost.
- **UI Review, UI-01, High:** that is an argument about *typical records*, not about the form. `dueDate` is labelled optional and its helper states only what the field does not do, so the field is presented as skippable to every user, including one with a non-bank loan and a term they could have entered. Two users of the same application would see structurally different screens and neither is told why.
- **Code Review:** confirms §3's schema reading as an engineering fact — the term is derivable for every debt carrying a due date and no migration is needed — and takes no position on the user-facing cost of the omission, which is outside its remit.

The reports do not contradict each other. The proposal's cost estimate is contradicted by one of them, and nothing in either report supports it.

---

## Estimated Effort

| Band | Items | Effort |
|---|---|---|
| **P0** | none | — |
| **P1** | WORK-07, WORK-14, WORK-15, WORK-16, WORK-17 | 1 XS + 2 S + 1 M + 1 S (conditional) ≈ **2.5–3.5 days**, of which ~0.5 day drops if the §4 ruling is A or D |
| **P2** | WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06 | 3 XS + 3 S ≈ **2.25 days** |
| **P3** | WORK-08, WORK-09, WORK-10, WORK-12, WORK-13, WORK-11 | 5 XS ≈ **1.25 days**, plus WORK-11 at M, deferred and unscheduled |

**Scheduled total across Sprints 1-3: roughly 6 to 7 days**, with a single M item (WORK-16, the rate's presentation) and no L or XL. WORK-11 (M) is the only item carried to Later and is not counted.

No item in this cycle requires a rewrite, a new abstraction, a new dependency, a new storage key, a schema field or a migration.

---

## Recommendations

1. **The built module is releasable and Sprint 1 is not a release blocker — schedule it anyway, and before the decoder.** Zero Critical and zero High across 22 findings from two independent reviews. But three of Sprint 1's items (WORK-07, WORK-12, WORK-03) are the card and the record being made true *before* a fourth derived figure and a second percentage land on them, and they are XS and S. Doing them after the decoder means writing the decoder's design record against a block header and a comment that are already false.

2. **Rule §4 before anything else. It is the decision and everything else follows from it**, as the proposal itself says. WORK-15, WORK-16, WORK-14 and WORK-17 are all blocked on it, and they are the whole of item 1 in the product strategy's build sequence. C2 is the sharpest thing in this cycle: one reviewer says the flat rate has no behaviour-changing content left in it, the other says the effective rate introduces this file's first numeric solve over an unbounded worst case whose silent-clamp failure is worse than shipping no rate at all. Both are right within their remit and neither can settle it.

3. **Whatever is ruled in §4, rule §5 row 1 with it.** UI-01 is the only High finding in this cycle and it is against the proposal's own proposed disposition. The strategy places this figure first in the build sequence and permanently free; "omit the rate, say nothing" makes it invisible and unexplained for every user who skipped a field the form tells them is optional. The fix is S and it is one line in the rate's position, gated on `totalToRepay > principal` so the family case stays silent — which is what §5 actually wants.

4. **Put CODE-05's guards in the ruling itself, not in the implementation, if B or C is chosen.** A fixed iteration count, `return null` on non-convergence or on a bracket that fails to straddle, a harness fixture asserting §4's four rows, and the function pure over one debt record with no `db` read. The last of those is free today and is what makes the payoff plan — strategy item 2, which builds directly on this one — cheap rather than expensive.

5. **Settle C1 in one sentence and let WORK-03 proceed.** The two reviewers want opposite fixes for the same defect. CODE-08's secondary branch — leave the card literal and correct the comment that implies the cap is uniform — is the only shape both reports accept, and it is compatible with UI-02's reconciling line. That observation is mine, not a resolution; the ruling is yours.

6. **One thing neither report was asked to weigh, and I am flagging as a scheduling risk rather than a finding.** Code Review's future-risk note that a rate which changes when a user edits a debt will read as the application changing its mind, with no version history anywhere in `openDebtEditModal`. UI-13 asks for the term to be fixed to the contracted span, which makes the figure constant for the life of the debt and is XS to say now. Say it in the ruling. It is the cheapest sentence in this cycle and the most expensive one to discover later.
