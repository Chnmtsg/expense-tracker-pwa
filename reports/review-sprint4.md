# Review of Sprint 4, and what was done about it

2026-10-10. Scope: UI-05/CODE-04 (Salary totals), CODE-03 (perf seed),
WORK-210(b) (wall-time bound), the WORK-22 re-take and delegation, on
`main` (5ec2dfe..27d3291).
Reports: `ui-review-sprint4.md` (91/100) and `code-review-sprint4.md` (92/100).
Ruling: `chief-architect-sprint4-review.md` (yes: v30 once the fix-now set
lands). Fixes on the branch `sprint4-review-fixes`, one commit each.

| ID | Sev | Finding | Outcome |
|---|---|---|---|
| CODE-01 | Low | Delegation rewired four row controls; only Income Delete was clicked by a probe. | **Fixed (harness).** A flow clicks Income Edit, Expense Edit, Actual Delete and a Planned recurring Delete through the real buttons. Mutations: `#expList` listener removed → "(2) expense Edit opened null; …"; Planned branch filtering `db.actual` → "(4) the plan was not deleted". |
| CODE-02 / UI-01 (comment) | Low | The delegation comment blamed the 200 ms on the listeners. | **Fixed** with the ruled text; `rg "over 200 ms"` no match. |
| CODE-03 + CODE-04 | Low | `perf.js` stated C44 two ways; the bound's reach was overstated. | **Fixed** with the ruled sentences. The ruling corrected the review's wording: the bound is one-sided (caps understatement, cannot confirm a figure above a threshold); any decision on a `perf.js` figure goes up with both numbers. |
| UI-01 (record) | Med | The All Time cost had no deferral row. | **Ruled as a deferral** (fires on a slow list on a real store, a real store over 2,000 records in a list, or any change to how the rows are built); HANDOFF points to it. Nothing built. |
| UI-02 / CODE-05 | Low | HANDOFF said nothing was undeployed with v30 staged. | **Fixed** with the ruled bullets and state line. |

Closed by the ruling: WORK-22 (delegation stays, now probed) and WORK-210(b)
(landed, read as one-sided). `npm test` exits 0 after each commit; lint 17.
`sw.js` reads v30; the live site reads v29.
