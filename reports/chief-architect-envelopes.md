# Chief Architect ruling: Accounts as spending limits

2026-10-09, on reports/proposal-accounts-envelopes.md. The owner's two product rules are settled and are not reopened here.

## Ruling: APPROVED WITH CHANGES

- **Data model:** approved. `accounts[].share` and `transfers[].incomeId` are both optional, with no migration.
- **Split:** approved. A split is made of ordinary money moves.
- **`choiceDialog`:** approved.
- **Limit scope:** approved, with the edit sheet and the payment sheet fixed (E5, E6).
- **Delete cascade:** approved, completed by E2 and E3.

## Required changes

- **E1. Validators.**
  - In `accountProblem`, `share` must be an integer from 1 to 100 when present.
  - In `importProblem`, the shares across all accounts must total 100 or less.
  - In `transferProblem`, `incomeId` must be a non-empty string when present. Only its shape is checked, not whether the income exists.
- **E2. Every path that deletes income also deletes the moves split from it.**
  - Deleting an income row removes its moves, and the confirm message gives the count.
  - The Data Summary "Clear income" also removes every move that carries an `incomeId`, and its confirm says so.
- **E3. Editing an income that has split moves.**
  - The income is not re-split.
  - If the date or account changes, the new values are written onto its moves.
  - If the new amount is less than the moves' total, the save is refused.
  - A note in the edit sheet says the moves can be deleted on the Accounts screen.
- **E4. The share field.**
  - It appears on the add-account form and in the edit-account sheet.
  - A value that would take the total over 100 is refused, and the message gives the share still free.
  - An empty field deletes `share` rather than storing 0.
- **E5. When the limit applies to an expense.**
  - Available money is `accountBalance(A)`, plus the record's old amount if it was an actual expense on A dated today or earlier.
  - The limit is checked only when the amount, the account or the kind changes.
- **E6. Where the Move action appears.**
  - The Move action is offered only on the Add Expense form.
  - The edit sheet and the debt-payment sheet name the shortfall and the account with the most money, and offer Cancel and Record anyway.
  - The Move action is left out when no other account has a balance above 0.
- **E7. Moving money.** `trAdd` refuses an amount above the source account's balance today, at the amount field, with no override.
- **E8. `choiceDialog` cleanup.**
  - `confirmAlt` is hidden and its listener removed on every close.
  - `data-dismiss` stays on `confirmCancel`, and tapping the backdrop counts as cancel.
  - `confirmDialog` and `alertDialog` never show `confirmAlt`, and a probe checks this.
- **E9. Cache.** `sw.js` moves to v26 in the same release.

## Accepted risk

A page still running v25 that deletes an income will leave its split moves behind. The E9 cache bump limits how long that can last.

## Commit order

1. E1 and the data fields.
2. E4, the split, E2 and E3.
3. E8, E7, E5 and E6.

Run `npm test` after each step. The cascade must ship in the same release as the split.
