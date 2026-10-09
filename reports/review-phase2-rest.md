# Review of the Phase 2 rest work, and what was done about it

2026-10-09. Scope: CODE-02 and P1–P5 on `main`. The reports are
`ui-review-phase2-rest.md` (82/100) and `code-review-phase2-rest.md` (80/100).
Neither found anything Critical. All fixes are in one commit on the branch
`phase2-review-fixes`, as was done for `review-envelopes.md`.

| ID | Sev | Finding | Outcome |
|---|---|---|---|
| CODE-01 | High | After a dialog, the income and expense edit sheets wrote to a detached record when another window had written meanwhile, and still said "Updated". | **Fixed.** `dbReplacedSince(snapshot)` runs after every awaited dialog in the edit, log-plan, contribution, debt-edit and debt-payment sheets. If `db` was replaced, it says "nothing was saved" and leaves the sheet open, so Save judges the edit again against fresh records. The new probe step calls `refreshFromStorage()` from inside the dialog. It fails without the guard and passes with it. |
| CODE-02 | Med | An identity test (`includes`) treated any change from another window as a deletion and dropped the save without a word. `saveEditDebtPayment` had no re-check at all. | **Fixed** by the same helper. The three `includes` tests are gone, and the payment sheet re-checks too. |
| CODE-03 | Med | The income-edit refusals and their helper sent the user to delete a move, which CODE-02 now refuses when the money was spent. | **Fixed (copy).** Each now names a path that works: "delete this income and add it again". That path is allowed under R1, with a warning. |
| CODE-04 | Low | The money-move delete checked the refusal only before its confirm, and used its own copy of the rule. | **Fixed.** It uses `accountShortfalls` and is checked again after the confirm. |
| CODE-05 | Low | Two stale comments. | **Fixed.** The balance header now names borrowed money and goal contributions, and the "Synchronous…" comment is back above `spendShortfall`. |
| CODE-06 | Low | Probe gaps. | **Fixed.** Added probes for a lowered income amount, a borrow date moved past today, the log sheet without accounts, the cross-window save, and the refusal and cause wording. |
| UI-01 | Med | The shortfall sentence ("Needs ₮50,000 below zero") could be misread, and the deletes did not say why money leaves an account. | **Fixed.** It now reads "This leaves the Needs account below zero, at -₮50,000." The link uses the same phrase ("goes below zero"). Both deletes state the cause ("The ₮300,000 borrowed comes back out of …") and say "Some of this money has been spent." |
| UI-02 | Med | The two account-change refusals were an 8-second toast. | **Fixed.** `refuseInDialog` marks the field and shows the sentence in a dialog, the same way the money-move refusal does. The three split-income refusals use it too. |
| UI-03 | Med | The goal "Paid from" helper was hard to follow. | **Fixed** with the reviewer's wording. It is concrete and does not say "savings account" (R3.4's concern). |
| UI-04 | Med | "LEFT OVER" and "LEFT AFTER PLAN" sit on the same Home card. | **Open: needs a ruling.** Renaming the tile changes another ruled Home label. The reviewer suggests "Income minus plan". |
| UI-05 | Low | The bell's "✓ Log/Add ₮X" opens a sheet when accounts exist. | **Partly fixed.** With accounts, the label is now "Log ₮X…" / "Add ₮X…", with no tick. **Not done:** reopening the bell after a save that started there. Closing the sheet and opening the bell in one task would put a batched history back over a fresh pushState, so it needs its own measured change. |
| UI-06 | Low | The future-to-today dialog did not say why it appeared, and its link said "Record" in a Save sheet. | **Fixed.** It now starts "Dated YYYY-MM-DD, this expense now comes out of X." The sheet links say "Save anyway"; Add Expense keeps "Record anyway". |
| UI-07 | Low | A negative balance was shown as "₮0 left". | **Fixed.** `leftPhrase` says "X is already at -₮…". The limit dialog does the same. |
| UI-08 | Low | The debt sheet's divider style, and "term" as jargon. | **Fixed.** The divider is now dashed, like the expense sheet's, and the helper says "This doesn't change the loan." |
| UI-09 | Low | "Received into" was not marked optional. | **Fixed.** |
| UI-10 | Low | The new helpers were not linked to their selects. | **Fixed.** `aria-describedby` is set on the goal, add-debt and debt-edit selects. |
| UI-11 | Low | The risky delete link looked safer than the plain delete. | **Fixed.** `choiceDialog({altDanger})` colours the quiet link `--danger-text` on both deletes. |
