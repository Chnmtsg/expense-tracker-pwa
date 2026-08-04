# Engineering Manager — Round 12

*(Read-only by role definition; this text is the agent's complete report, transcribed unmodified.)*

Sources: `reports/ui-review.md` (10 findings, 78/100), `reports/code-review.md` (12 findings, 78/100). Constraint documents read: `reports/chief-architect.md` (round-9 standing decision plus the Round 11 supplemental), `reports/design-request-debt-tracker.md`, `reports/HANDOFF.md`, and the four knowledge files.

Numbering continues from WORK-169 (deferred). This report allocates WORK-170 through WORK-186.

## Project Health

Both reviewers scored the Debts module 78/100 independently, and both found three High findings and no Critical — a rare agreement that the module's architecture is right and its edges are not. The data layer, the store seam, the stock/flow separation and the cascade delete all verified clean at source in both reports; what failed is the surface (every action button on the new screen renders unstyled and below the 44px minimum) and, more seriously, the verification record: three of the acceptance conditions the module was approved under are weaker than the record states — one is asserted against a copy of the code it names (CODE-03), one runs at the wrong viewport and cannot fail (CODE-04), and one asserts markup structure in place of the behaviour it is titled after (CODE-05). The build is not release-blocked by severity — nothing here loses or misstates stored data, and nothing reaches a Dashboard total — but the WORK-164/165 gate was declared closed on assertions that cannot all say no, and that is the round's real finding.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-170 | Debt card action buttons receive no styling and sit below the 44px touch minimum | UI-01, CODE-01 | High | P1 | XS | WORK-175 (to measure the fix) |
| WORK-171 | `debtInterestPaid` is uncapped, so an overpaid debt reports a cost the loan could not have carried | UI-03, CODE-02 | High | P1 | XS | — |
| WORK-172 | The WORK-164 import-replacement assertion tests a copy of the object it guards | CODE-03 | High | P1 | S | — |
| WORK-173 | A debt cannot be edited; the only correction path cascades the payment ledger | UI-02 (in part), CODE-06 | High (UI-02) / Medium (CODE-06) | P1 | S | Architect scope ruling; WORK-170 |
| WORK-174 | `debtNotes` is collected, stored and never rendered anywhere | UI-02 (in part), CODE-07 | High (UI-02) / Medium (CODE-07) | P1 | XS | — |
| WORK-175 | `npm run debts` carries no `--width`, so the 320px overflow condition runs at ~785px | CODE-04 | Medium | P1 (blocks P1 verification) | XS | — |
| WORK-176 | The containment flow cannot fail on the symptom it is named after | CODE-05 | Medium | P2 | S | — |
| WORK-177 | The module's headline figures sit below a nine-control add form | UI-04 | Medium | P2 | XS | — |
| WORK-178 | `debtDate` is never initialised and never reset | UI-05, CODE-12 | Medium (UI-05) / Low (CODE-12) | P2 | XS | — |
| WORK-179 | The summary card shows "Still owed" above "Borrowed in total" with the explanation gated off | UI-06 | Medium | P2 | XS | — |
| WORK-180 | `contributionProblem` accepts `amount === 0`, which both write paths refuse | CODE-08 | Low | P3 | XS | — |
| WORK-181 | The debt payment-history modal diverges from the goal history modal | UI-07, CODE-09 | Low | P3 | XS | — |
| WORK-182 | Import accepts a `debtPayment` pointing at no debt; `S_orphan_pay` does not test an orphan | CODE-10 | Low | P3 | S | WORK-172 (same file) |
| WORK-183 | `withFramesRun` duplicated across two probes, with a narrower vacuity guard in the copy | CODE-11 | Low | P3 | XS | — |
| WORK-184 | The debt summary reimplements the KPI tile at an off-scale size; the debt chip diverges from the goal chip | UI-08 | Low | P3 | XS | WORK-174 (new `.debt-meta-item` site) |
| WORK-185 | A debt 99.6% repaid prints "100%" beside a non-zero "still owed" | UI-09 | Low | P3 | XS | — |
| WORK-186 | `.debt-card` resolves its shadow from a different token than the `.card`s it is interleaved with | UI-10 | Low | P3 | XS | — |

**Merges made — explicitly:**

- **UI-01 + CODE-01 → WORK-170.** Same defect, found independently. Fix shape disputed; see Conflicts C1.
- **UI-03 + CODE-02 → WORK-171.** Same defect, two formulas, proven equivalent; see Conflicts C2.
- **UI-02 split across WORK-173 and WORK-174, absorbing CODE-06 and CODE-07 respectively.** UI-02 raised the edit path and the unrendered notes as one High finding; the Code Review raised them as two Mediums with different remedies and different scope status. Splitting lets the notes fix (XS, undisputed, both reports want it) land now without waiting on the scope ruling the edit modal needs. UI-02 appears in both rows and is not diluted: both carry its High.
- **UI-05 + CODE-12 → WORK-178.** Same defect, divergent severity; see Conflicts C4.
- **UI-07 + CODE-09 → WORK-181.** Same defect. Not a disagreement — the fix is the union of both: relabel Cancel to Close (both), `.helper` → `.empty` (UI-07), wrap the note in `<span class="note">` (UI-07), re-render in place instead of `closeEditModal()` after a payment delete (CODE-09).

No finding was dropped. All 22 source IDs (UI-01..UI-10, CODE-01..CODE-12) appear above.

## Quick Wins

XS or S effort removing Medium or higher severity. Do these first inside their priority band.

1. **WORK-175 (XS, Medium)** — one flag on one npm script. Do it first regardless of its own severity: it is the instrument the rest of the sprint's geometry claims are measured with.
2. **WORK-170 (XS, High)** — the fix is a selector edit. The measurement that gates it has now been taken (below), so it no longer rests on a derived pixel figure.
3. **WORK-171 (XS, High)** — one `Math.min`, and the module's headline number can no longer report a cost the loan did not have.
4. **WORK-174 (XS, High/Medium)** — three lines; the form stops asking for information it can never show back.
5. **WORK-172 (S, High)** — extracting one named function retires the guarded-by-a-copy pattern for every collection added after this one.
6. **WORK-177 (XS, Medium)** — move one `<div>` above another; the empty case already hides itself.
7. **WORK-178 (XS, Medium)** — one line in the init block, one in the reset.
8. **WORK-179 (XS, Medium)** — one ungated sentence.
9. **WORK-176 (S, Medium)** — a handful of lines converts an assertion that cannot fail into one that can.

**WORK-173 (S, High/Medium) mechanically qualifies but is not a quick win**, because it cannot start: it needs a scope ruling first. See Conflicts C3.

## Sprint Plan

**Sprint 1 — the surface, the arithmetic, and the three conditions that cannot fail.**

| Order | Item | Effort | Why this order |
|---|---|---|---|
| 1 | WORK-175 | XS | The instrument before the claim. `--width 320` on the `debts` script, verified by `t.viewport_clientWidth` returning 320. |
| 2 | WORK-170 | XS | Restores the 44px target and the primary affordance on the module's only route to recording a payment. Land the probe extension (both action rows measured, debt against goal) in the same commit. |
| 3 | WORK-171 | XS | Caps the one number the feature exists to produce. New `debts.js` flow, demonstrated red by removing the cap — a change to the application, not the expectation. |
| 4 | WORK-172 | S | Extract `importReplacement(parsed)` and point the flow at it. Demonstrated red by deleting `debts: []` from `index.html`, which is the perturbation the flow's own comment already names and currently cannot honour. |
| 5 | WORK-176 | S | Snapshot `innerHTML` of the four other screens around a `renderDebts()` call, or delete the flow and restore the review condition honestly. |
| 6 | WORK-174 | XS | Render `d.notes` on the card, escaped, guarded on presence. |
| 7 | WORK-178 | XS | Initialise and reset `debtDate` alongside the app's other three entry dates. |

Total: five XS, two S. Seven commits, `npm run verify`, `npm run v1`, `npm run boot`, `npm run recurrence` after each, plus a red-then-green demonstration for each of the three probe changes — which is where the real time goes, not in the edits.

**What the sprint delivers:** the Debts screen's primary control becomes a 44px themed button instead of a native OS button next to a cascade delete; the interest figure becomes one that cannot exceed what the loan cost; and three of the module's acceptance conditions — the import round-trip, the 320px overflow band, and containment — become conditions that can actually go red. The form stops collecting a repayment term it can never display, and the fourth entry date starts behaving like the other three.

**Not in this sprint, deliberately:** WORK-173. It needs the architect's scope ruling, and the sprint is full enough that an S-sized item arriving mid-sprint on a decision would push something already committed. The ruling is requested during Sprint 1; the work lands in Sprint 2 either way, in one shape or the other.

## Roadmap

- **Sprint 1** — WORK-175, WORK-170, WORK-171, WORK-172, WORK-176, WORK-174, WORK-178
- **Sprint 2** — WORK-173, WORK-177, WORK-179, WORK-182, WORK-180
- **Sprint 3** — WORK-181, WORK-183, WORK-184, WORK-185, WORK-186
- **Later** — nothing from this round. Every finding is scheduled. The standing deferrals (WORK-168, WORK-169, WORK-141, WORK-156, WORK-144, WORK-145, WORK-146(b), WORK-85+35, WORK-15, WORK-17, WORK-23, WORK-30, WORK-31, Stage 2) remain deferred with their triggers intact; none is fired by anything in these two reports, and none is scheduled here.

## Dependencies

- **WORK-175 before WORK-170 can be claimed closed.** The button geometry is a 320px property. `npm run debts` currently runs at roughly 785px, so it would report the fix green whether the fix worked or not. The flag lands first, then the fix, then the measurement is a re-run rather than an assertion of intent.
- **WORK-170 before WORK-173.** UI-02's edit control is a fourth `.goal-icon-btn` in `.debt-actions`. Added before WORK-170, it is unstyled too, and the new button inherits exactly the defect being fixed.
- **WORK-172 before WORK-182.** Both edit `tools/harness/v1-write-flows.js`; WORK-172 restructures the import flow that WORK-182's `S_orphan_pay` rename sits beside. Sequencing them avoids re-doing one inside the other, and the commit boundary is easier to decide up front than to unpick afterwards.
- **WORK-174 before WORK-184.** WORK-174 adds a new `.debt-meta-item` call site for the notes. WORK-184 proposes deleting `.debt-meta-item` in favour of `.goal-meta-item`. Done in the other order, WORK-184 sweeps a set of call sites that WORK-174 then adds to.
- **WORK-180 touches a shared validator.** `contributionProblem` serves both `goalContributions` and `debtPayments`; the change from `< 0` to `<= 0` must be checked against the existing goal-contribution fixtures, which is why it is S-adjacent work priced XS and scheduled where there is room to re-run the fixtures.
- **Nothing here adds a runner.** WORK-175 is a flag on an existing script; WORK-176 and WORK-171 add flows to existing probes; WORK-183's larger option moves a helper into `tools/harness/fixture.js`, which is an input, not a runner. The four-plus-one ceiling is untouched by every item in this roadmap. No test framework and no build step is proposed by either reviewer or by me.

## Conflicts

**C1 — WORK-170: the two reports agree on the defect and disagree on the fix.**

- **UI-01's position:** extend the four existing selectors to also match `.debt-actions` — `.goal-actions button.goal-add, .debt-actions button.goal-add { … }`, and the same for the icon variant. Keeps the single definition the comment at `:1514-1517` exists to preserve. Blast radius: closed, two named containers.
- **CODE-01's position:** drop the `.goal-actions` ancestor entirely — `button.goal-add`, `button.goal-icon-btn` — which is what the comment already claims is true, and correct the comment. Blast radius: open, the rules then apply to any element carrying those classes anywhere in the file, now and in future.
- **Both agree on one thing and it should be recorded:** do not clone the rules into a `.debt-actions button` block. That is the drift the comment was written to prevent, and neither reviewer proposes it.
- **Measurement, now taken and treated as observed rather than derived.** On the corrected width-mode harness at 320px: the debt "+ Payment" button is **23px tall on `rgb(240,240,240)`**; the goal equivalent is **44px on `rgb(37,99,235)`**; the debt icon buttons are **23x34px against 44x44px**. UI-01 explicitly declined to quote a figure and specified this measurement as the thing that should gate the fix; CODE-01 estimated "roughly 20-24px" and the measurement lands inside that. The standing convention that a derived claim is measured before it gates is therefore discharged for this item: WORK-170 is eligible to gate.
- Architect's call: which selector shape, given the two blast radii.

**C2 — WORK-171: two formulas, checked for equivalence rather than merged on faith.**

- UI-03: `Math.round(Math.min(debtPaid(d.id), total) * cost / total)` — caps the paid figure inside the multiplication.
- CODE-02: `Math.min(cost, Math.round(debtPaid(d.id) * cost / total))` — caps the result.
- **They are arithmetically equivalent under this application's integer-tugrik invariant.** Case `paid <= total`: the inner cap is a no-op, and `paid * cost / total <= cost`, so rounding cannot exceed the integer `cost` and the outer cap is a no-op too — both return `Math.round(paid * cost / total)`. Case `paid > total`: UI-03 returns `Math.round(total * cost / total)` = `cost`; CODE-02's rounded term exceeds `cost`, so the outer cap returns `cost`. Both preserve exactly one `Math.round`, which both reviewers name as a requirement.
- **One divergence exists and is worth stating rather than hiding.** If `cost` is ever non-integer, the two differ: UI-03 always returns an integer, CODE-02 can return a fraction. The app's own write path cannot produce that — Code Review verified `unmoney` strips every non-digit, integer tugrik end to end — but `debtProblem` requires numeric, not integer, so a hand-edited import could. **Merged as UI-03's inner-cap form on that tie-break**, carrying CODE-02's derivation for the comment: paying more than you owe does not buy more interest, the same fact `:8248` already states for flooring outstanding. No ruling needed; recorded so the choice is visible.
- Both reports independently specify the same red-then-green demonstration: seed payments beyond `totalToRepay`, assert `debtInterestPaid <= totalToRepay - principal`, and prove it red by removing the cap from the application.

**C3 — WORK-173: a scope question, not a technical one, and it is the architect's.**

- **UI-02's position (High):** add an edit modal on the `openGoalEditModal` pattern, reusing `#editModal` with an `editCtx.kind === 'debt'` branch; fields name, principal, total to repay, date, notes; it must repeat the `totalToRepay < principal` refusal rather than clamp. Effort S. The argument: debts are the only financial collection in the app with a write path and no correction path, and the only available remedy is a delete that cascades the whole ledger — a data-loss-shaped action offered to a user who wants to fix a typo.
- **CODE-06's position (Medium):** "this was not in the approved scope, and adding one is a decision, not a fix." Offers a smaller honest alternative: either the modal (S), or a line in the standing decision converting `chief-architect.md:581`'s recorded risk from *"editing restates history"* to *"editing does not exist"* (XS). The argument: the risk register must not describe a capability the code lacks.
- **Both reports cite `chief-architect.md:581` and both read it the same way** — the standing decision's own risk entry presumes an edit capability that was never built. Neither reviewer proposes an edit *trail*, which is what `:581` says the answer is if it bites.
- Nothing in the Round 11 supplemental rejects an edit path by name. It is out of approved scope, not off limits. I have not resolved it and have priced both branches: modal S, risk-register correction XS.

**C4 — WORK-178: severity divergence on the same defect.** UI-05 calls it Medium (the date silently recorded is never shown to the user, and with no edit path a wrong borrowing date is permanent); CODE-12 calls it Low (no wrong figure; an empty control and a sticky value). Both severities stand unchanged. I priced priority to the higher of the two, P2, without altering either report.

**C5 — WORK-174: severity divergence on the same defect.** UI-02 carries High across both halves of its finding; CODE-07 calls the notes half Medium. Both stand. Priority set to P1 on the higher severity; the fix is XS either way, so the divergence costs nothing to honour.

**Not conflicts, recorded so they are not mistaken for one:** UI-07 and CODE-09 list partly different sub-fixes for the same modal — the merged item takes the union. UI-08 and UI-10 both explicitly decline to widen into the app-wide sweeps (72 font sizes, 69 spacings, `.card` tracking the per-theme `--shadow`); those remain rejected or recorded-not-scheduled and nothing in this roadmap touches them.

## Estimated Effort

| Band | Items | Effort |
|---|---|---|
| P0 | none | — |
| P1 | WORK-170, WORK-171, WORK-172, WORK-173, WORK-174, WORK-175 | 4 XS + 2 S |
| P2 | WORK-176, WORK-177, WORK-178, WORK-179 | 3 XS + 1 S |
| P3 | WORK-180..WORK-186 | 6 XS + 1 S |
| **Total** | **17 items, 22 findings** | **13 XS + 4 S** |

Nominal edit time is small — under a day of typing. The honest figure is about a week, because five of these items change or add an assertion, and this project's conventions require each to be demonstrated red by a change to the application before it is trusted green, with four commands run after every commit. Sprint 1 is roughly half of that week.

## Recommendations

If I had a minute with the Chief Architect, I would spend it on three things.

**CODE-03 is the item that matters, and it is not really about debts.** The WORK-164 work gate — the one thing everything else in the module was allowed to be built on top of — was declared closed on four assertions, and assertion 2 tests a `replacementFor()` object that lives inside the probe. Deleting `debts: []` from the application's real import replacement leaves `npm run v1` green. That is a C37 violation committed in the round where C37 was the headline lesson, by the same mechanism the lesson describes: the perturbation was named, the blank was filled in, and nobody checked that filling it in was possible. It is one of the six store sites the ruling enumerated, and it is the one that loses a user's debts silently on a backup restore. The fix is small and permanent — extract `importReplacement(parsed)` and let the probe call the real thing — and it retires the pattern for every collection added after this one.

**Three of the round's acceptance conditions are weaker than the record says.** CODE-03 above; CODE-04, where condition 5's 320px overflow check runs at roughly 785px and therefore cannot fail; and CODE-05, where the containment condition you deliberately stated as a *review* condition "checked by eye" was substituted by an assertion that only tests where three elements sit in the markup — so the assertion retired the eye without replacing it. You may want to decide whether the WORK-164/165 gate should be re-declared closed after WORK-172, WORK-175 and WORK-176 land, rather than left recorded as closed on its current evidence. The module itself is sound in all three cases; it is the guards that are not.

**Rule on WORK-173 in this round rather than the next.** Both reviewers arrived at your own `:581` risk line from opposite directions and found it describes a capability the code does not have. Whether the answer is the modal or the register correction, the cost of deciding is one paragraph and the cost of deferring is that the risk register keeps asserting something untrue. Everything else here is small, both reports agree on the diagnosis, and the two genuine fix disagreements — C1's selector blast radius and C3's scope — are the only places I have deliberately left a decision on your desk.
