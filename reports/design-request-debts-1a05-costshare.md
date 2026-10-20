# Design request: the loan-payment row under the cost-share rule (step 23 gate)

2026-10-20. `reports/chief-architect-debts-1a05.md`, C1 part 3: the owner
chose **(b), only the cost share of a counted payment counts as spending**
(HANDOFF owner decisions, 2026-10-20 latest, after v37). The ruling says:
"If the owner chooses (b), the projection counts the cost share only, and the
row shows 'cost ₮X of ₮Y paid'. That shape then needs a UI review pass before
it merges." This document is that shape. It proposes; it does not decide.

Live code: `D:/3_Claude/PowerApps-live` (branch `live-v35`), with Development
Order steps 1–22 built (detail, schedule list, rows, `spendingEntries()`,
the `spending: true` flag on new payments).

## The rule (fixed by the ruling, not under review)

- Only payments carrying `spending: true` (recorded from this release) are
  projected. Older payments stay Debts-only.
- A payment's **cost share** = the part of the debt's "Cost so far" that this
  payment adds, on the module's existing proportional rule
  (`debtInterestPaid`: paid × (total − principal) / total, paid capped at the
  total, one rounding on the running total). Per payment it is the running
  figure after it minus the running figure before it, in date order over all
  of the debt's payments, so the shares add up exactly to "Cost so far" and a
  payment past the agreed total adds nothing.
- One stored category "Loan payment" (group Needs), created by a v2→v3
  migration with a fixed id; `spendingEntries()` returns `db.actual` plus one
  projected row per flagged payment, `{ id, date, amount: costShare,
  categoryId: loan, debtPaymentId, debtId, paid }`.
- `accountBalance` keeps subtracting the full payment from its account.

## The proposed row in Expenses (under review)

```
Loan payment · Khan Bank                          ₮20,000
2026-11-10 · cost ₮20,000 of ₮170,000 paid · Khan card
[Loan payment chip, group tag Needs]               ✎  ✕
```

- R1. Title "Loan payment · {debt name}" (escaped). Orphan (debt missing):
  "Loan payment".
- R2. Amount column: the cost share (what this row adds to the total above
  the list).
- R3. Second line: date · "cost ₮X of ₮Y paid" · account. For a debt that
  costs nothing (money from family): "no cost · ₮Y paid", amount ₮0.
- R4. The row appears for every flagged payment, including ₮0 ones, because
  the Expenses list is where the owner looks for "where my money went"; the
  total above the list counts only the shares.
- R5. ✎ opens the debt's detail; ✕ asks "Delete this loan payment? It is
  also removed from {debt}, and what you still owe goes up by ₮Y." (ruled,
  C2; step 24).
- R6. Home, the donut, the monthly trend, Insights: the share only, in the
  "Loan payment" slice. Budget Planning: "Loan payment" like any category.
- R7. The detail, beside "Cost so far": one line, "The cost part of each
  payment counts as spending; the rest repays what you borrowed." Replaces
  the summary's "it is not counted in 'Left over' on Home", which becomes
  false.

## Questions for the review

1. Is R2/R3 (amount column = share, the paid figure only in the second line)
   readable for a user with little accounting knowledge, or does a ₮20,000
   row for a ₮170,000 payment read as the app being wrong?
2. R4: should ₮0-share rows (family money) appear at all?
3. R7 wording, and whether the summary needs any line.
4. Anything in the projection that would make two screens disagree.
