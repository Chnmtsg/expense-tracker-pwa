# Review of Sprint 3, and what was done about it

2026-10-10. Scope: WORK-10 step 1, CODE-04 (carried), WORK-21, WORK-22
(measurement), WORK-13 and WORK-15, on `main` (69f5d6b..d7167d7).
Reports: `ui-review-sprint3.md` (91/100) and `code-review-sprint3.md` (91/100).
Ruling: `chief-architect-sprint3-review.md` (yes: Sprints 2 and 3 ship
together as v29 once the fix-now set lands). The fix-now items are on the
branch `sprint3-review-fixes`, one commit each.

| ID | Sev | Finding | Outcome |
|---|---|---|---|
| CODE-01 | Low | The wrapper's "snapshot before any await" was unprobed at `saveEditAccount`. | **Fixed (harness).** `openingWarnFlow`: another window writes inside the warning, then Save anyway; the opening is unchanged, `DB_REPLACED_MSG` under "Not saved", the sheet stays open. Mutation `commitWrite(db, …)`: "the cut was written over records changed in another window". |
| UI-01 | Low | A refused delete said "nothing was saved… save again". | **Fixed as ruled.** `DB_REPLACED_DELETE_MSG` and an optional `replaced` on `commitWrite`; the two deletes pass "Not deleted". Without it both deletes alerted the save wording. |
| CODE-06 | Low | The WORK-13 probe selected only buttons that already had a label. | **Fixed (harness).** Buttons found by data attribute; a missing label fails. Removing the expense Delete's label fails the new probe and passes the old one. |
| UI-02 / CODE-07 | Low | Payment and contribution deletes and the goal/debt card actions were unnamed. | **Fixed with the ruled labels**, probed in full in both settled states. |
| UI-03 | Low | "Past moves" read as a field label. | **Fixed.** Inline `margin-top:var(--s5);font-weight:600`; probed by computed style ("weight 500, margin-top 12px" before). |
| CODE-05 | Low | Three `sSave` comments named `calcSalary()` for the clamp and rounding. | **Fixed**, those three sentences only. |
| CODE-08 | Low | "The only place a move can be reviewed or undone". | **Fixed** with the ruled clause. |
| UI-04 / CODE-02 | Low | The WORK-22 record named WORK-13 and recorded a C44 reading as the outcome. | **Record fixed** with the ruled sentence. The decision is ruled: All Time governs; WORK-210(b) lands first, then the re-take, then delegation if over 100 ms at 6x. **Process rule recorded:** when two standing rulings appear to conflict, record the conflict under the correct ID and send it up; do not choose. |
| CODE-09 | Low | HANDOFF lacked Sprint 3, the wrapper rule and the key state. | **Fixed** (Sprint 3 bullet, the rule verbatim, the state). |
| UI-05 / CODE-04 | Low | Salary breakdown parts can miss their totals by ₮1. | **Carried to Sprint 4**, first item. |
| CODE-03 | Low | The perf seed stops covering This Month in 2027. | **Carried to Sprint 4.** |

`npm test` exits 0 after each commit. Lint is at 17 warnings. `sw.js`
reads `expense-tracker-v29`; the live site reads v28.
