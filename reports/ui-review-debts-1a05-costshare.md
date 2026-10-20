# UI Review: the loan-payment row under the cost-share rule (step 23 gate)

Scope: presentation R1–R7 in D:/3_Claude/PowerApps-live/reports/design-request-debts-1a05-costshare.md, checked against live D:/3_Claude/PowerApps-live/expense-pwa/index.html (live-v35, steps 1–22). The rule itself (forward-only flag, proportional share, stored "Loan payment" category, accountBalance unchanged) is ruled and was not reviewed. Read-only.

## Executive Summary

The shape is mostly right. The amount column shows the share, the paid figure goes in the second line, and there is one named slice, so the list adds up to the total above it on every screen. Three things stop it merging as written. The biggest is the second-line wording "cost ₮20,000 of ₮170,000 paid". It reuses the Debts card's own progress grammar ("₮X paid of ₮Y", index.html 12050–12054), so a user with no accounting knowledge reads it as "only ₮20,000 of the ₮170,000 went through". The other two: the R7 sentence is false for every payment recorded before the release, and nothing stops a user from also logging the repayment by hand under the new category.

## Overall Score

**68 / 100.** Three High findings sit in a small surface (band 60–74). Each one is a copy or picker correction, not a redesign, and the row structure, the totals and the slice need no change.

## Strengths

- R2 is the correct choice. `expTotal` sums `x.amount` over the listed rows (8342–8343), and Home, the trend and Insights all sum the same field. Putting the share in the amount column is the only way the rows add up to the figure above them on every screen.
- R1 and R6 come free from the stored category. There is no "Unknown ?" row, the Needs tag matches Budget Planning's group totals, and the donut gets a named slice with no special cases.
- Under (b), the gap between Home and the account balances is exactly the principal being repaid, which is a sentence a user can be told. That does not hold under (a).

## Findings

**UI-01 — "cost ₮X of ₮Y paid" reads as a partial payment**
- Severity: High
- Location: Expenses, proposed loan row, second line (R3); also the row's accessible name, built at index.html 8404
- Evidence: The Debts card and detail state progress as "₮150,000 paid of ₮1,300,000" (`numbersHTML`, 12050–12054), and the payment sheet says "Paid so far: ₮X of ₮Y" (12681). R3's "cost ₮20,000 of ₮170,000 paid" has the same "X of Y paid" shape, so the natural reading is "₮20,000 of ₮170,000 has been paid". Next to a red ₮20,000 in the amount column, that confirms the misreading: the user believes the app recorded the wrong amount. The orphan and overpaid cases get "cost ₮0 of ₮Y paid", which is worse. The live row's accessible name is "{category}, {date}, {amount}" and carries no paid figure at all.
- Impact: Question 1 answered. The structure is readable, but this wording makes a correct ₮20,000 look like an app error, on the one screen users check against their bank.
- Recommendation: Put the fact the user recognises first, and name the share as what the amount column shows: `2026-11-10 · ₮170,000 paid, ₮20,000 of it is cost · Khan card`. For a cost-free debt the row does not appear (see UI-04). Use the same words in the accessible name: "Loan payment, Khan Bank, 2026-11-10, ₮170,000 paid, ₮20,000 of it is cost". Wrapping to a second meta line at 320px is acceptable. Do not shorten it back to "of".
- Effort: XS

**UI-02 — R7 and the summary claim every payment counts, but older payments do not**
- Severity: High
- Location: Debt detail beside "Cost so far" (R7); Debts summary helper at index.html 12221
- Evidence: "Cost so far" (`debtInterestPaid`, 11582–11588) covers all payments. Rows exist only for payments flagged `spending: true` (C1 part 2). R7's "The cost part of each payment counts as spending" is false for any debt with payments from before the release, and that is every current Debts user. Their "Cost so far ₮150,000" on Debts will sit beside Loan-payment rows adding up to ₮20,000. If the summary's "it is not counted in 'Left over'" clause is simply deleted, the summary then implies the whole figure counts.
- Impact: Question 3 and part of question 4. Two screens disagree about the same money, and the app's own sentence says they agree.
- Recommendation: R7 as proposed, plus a clause shown only when this debt has any payment without the flag: "The cost part of each payment counts as spending; the rest repays what you borrowed. Payments recorded before this update are not counted." In the summary, change only the clause inside the existing gated helper, so the block stays at its three-sentence limit (12216–12218): "The figure above is the part of that extra you have paid so far. For payments recorded since this update, that part counts as spending on Home. It is spread evenly…". So yes, the summary needs this one change, and no new line.
- Effort: S

**UI-03 — The "Loan payment" category invites a hand-logged double count**
- Severity: High
- Location: Expenses Add form and quick-add category pickers (`categoryOptions()`, 8327); payment sheet (`openDebtPaymentModal`, 12679–12690)
- Evidence: C3 makes "Loan payment" an ordinary category, so it appears in every actual-expense picker. Live has told users to log repayments as expenses themselves (14316–14319), and the payment sheet says nothing about spending. A user who records the ₮170,000 payment in Debts, then follows habit and logs "Loan payment ₮170,000" in Expenses, ends up with ₮190,000 spent in the slice. Nothing on either screen warns them.
- Impact: Wrong spending totals in normal use, by exactly the habit the app taught.
- Recommendation: (1) Leave the fixed-id category out of the actual-expense pickers (Add Expense, quick add, the Edit sheet for actuals). Keep it in planned mode and in Budget Planning. (2) Add one helper line to the payment sheet: "The cost part of this payment counts as spending on Home. Do not add it again as an expense." No live preview figure is needed.
- Effort: S

**UI-04 — ₮0 rows: leave them out (question 2)**
- Severity: Medium
- Location: R4; `spendingEntries()` (11146) as read by Insights `renderDailyStats` (9564–9631), the calendar and the day detail
- Evidence: Every reader of the accessor counts rows as well as summing them. "N entries", "Days logged · with spending", "Avg per active day" (its divisor is days with any entry) and the calendar's marked days would all count a ₮0 family-money payment as a spending day. Expenses would show a red "₮0" row whose ✕ (step 24) deletes a ₮170,000 payment. A payment past the agreed total also produces a ₮0 share on a debt that does have a cost, and R3 has no wording for that case.
- Impact: Insights overstates spending days and lowers the per-day average. The rule for when a row appears stops being "it adds to the total".
- Recommendation: The accessor projects only payments whose share is greater than 0. One rule then covers every screen: a loan row appears exactly when it adds to spending. "Where my money went" for those payments is already answered by the debt's Payments history and the account balance.
- Effort: XS

**UI-05 — Budget Planning compares a planned instalment with the actual cost share**
- Severity: Medium
- Location: Budget Planning / Planned vs Actual (R6)
- Evidence: A user with no training plans the instalment they actually pay ("Loan payment ₮170,000 monthly"). Actual for the category is ₮20,000, so the row shows them ₮150,000 under budget every month.
- Impact: A reassuring and wrong reading of the budget. Question 4: two screens disagree.
- Recommendation: When "Loan payment" is planned in actual mode, caption its Planned vs Actual row: "Actual counts only the cost part of loan payments; plan that part." Changing the planner is not needed.
- Effort: S

**UI-06 — Past months' totals move when a debt's terms or earlier payments change**
- Severity: Medium
- Location: Debt Edit sheet; history-sheet delete; Home and Insights for past periods
- Evidence: Each share comes from the running proportional figure over all payments, in date order. Editing `totalToRepay` or `principal` re-prices every flagged row. Adding or deleting an earlier-dated payment can move a later row across the cap, and the single rounding shifts shares by ₮1. Last month's Home spending then changes with no expense touched. WORK-02's "no past period's total moves" holds at upgrade but not after edits.
- Impact: Question 4. A past period's total changes silently, on a screen the user did not open.
- Recommendation: No change to the rule. Add one line under the Edit sheet's total field: "Changing what you repay also changes the cost counted in past spending." Flag to the Chief Architect that the WORK-02 guarantee covers only the upgrade.
- Effort: XS

**UI-07 — Spec gaps for the build (account, note, ✎ label, edge confirmations)**
- Severity: Low
- Location: Projected row shape (design request, Rule section); `accountMeta` (11282–11285); R5
- Evidence: (a) The projected object `{ id, date, amount, categoryId, debtPaymentId, debtId, paid }` has no `accountId`, so `accountMeta(x)` renders no "Khan card" as R3 promises. Payments also carry `notes` (14347), which every other Expenses row shows. (b) On every other row ✎ means "edit this record", but here it opens the debt (C2), and the live title and aria-label read "Edit". (c) R5's "what you still owe goes up by ₮Y" is false for a settled debt (still owed stays ₮0). For an orphan row there is no "{debt}" and no detail to open.
- Recommendation: Project `accountId` and `notes`. Give ✎ the title and aria-label "Open {debt}". At step 24, drop the "still owe" clause for a settled debt, and give orphan rows no ✎ and the confirmation "Delete this loan payment?".
- Effort: XS

Clean areas, one line each: Layout and hierarchy (title, amount, tag order matches every other row). Colour (actual spending keeps `.neg`, the slice comes from `categoryColor`). Typography, spacing, cards and touch targets (the live `.list-item` template is reused unchanged). Day-detail and chart tooltips show "Loan payment ₮X" with no debt name, which is acceptable because the share is the figure being charted there.

## Answers to the four questions

1. Amount = share, with the paid figure only in the second line, is readable and correct, but only with UI-01's wording. As proposed, ₮20,000 beside "of ₮170,000 paid" reads as the app being wrong.
2. No. Leave ₮0 rows out at the accessor (UI-04).
3. Use R7 with the conditional "before this update" clause. The summary needs a one-clause rewrite inside the existing helper, not a new line (UI-02).
4. Four places disagree: Cost so far vs the rows (UI-02), Insights counts with ₮0 rows (UI-04), Planned vs Actual (UI-05), and past totals after edits (UI-06). Hand-logging double counts are covered by UI-03.

## Verdict

**The (b) row shape may merge at step 23 once UI-01, UI-02, UI-03 and UI-04 are in the same commit.** All four are copy, a picker filter and a one-line accessor guard. Measure the row at 320px with the new second line, and add a harness flow showing that a cost-free debt's payment produces no Expenses row and no Insights entry. UI-05 and UI-06 may follow before release. UI-07(a) belongs in step 23. UI-07(b)–(c) land with step 24, where ✎ and ✕ first appear.

## Quick Wins

- UI-01 — XS, High: a copy change that removes the main misreading.
- UI-04 — XS, Medium: one guard in `spendingEntries()` makes the row rule match every screen.
- UI-06 — XS, Medium: one helper line under the Edit sheet's total field.
- UI-02 — S, High: conditional copy, and the summary block stays at three sentences.
- UI-03 — S, High: a picker filter and one helper line.
- UI-05 — S, Medium: one caption on one Planned vs Actual row.

## Estimated UX Impact

With the High findings fixed, a user who records a ₮170,000 repayment sees a row that first states what they paid, then why only ₮20,000 counts. The Expenses total, Home and Insights agree to the tögrög. Debts says plainly which payments count, so an existing user's "Cost so far" no longer seems to contradict their spending. The one habit the app used to teach, logging the repayment by hand, can no longer double their spending through the new category.
