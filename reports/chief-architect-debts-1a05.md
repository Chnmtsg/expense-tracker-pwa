# Chief Architect: Debts 1a·05, Debt detail 1a·06, one payment record in Debts and Expenses

Inputs, all read in full and left unmodified:
- D:/3_Claude/PowerApps-live/reports/engineering-manager-debts-1a05.md (WORK-01 to WORK-32, conflicts C1 to C6)
- D:/3_Claude/PowerApps-live/reports/ui-review-debts-1a05.md (UI-01 to UI-24, score 48)
- D:/3_Claude/PowerApps-live/reports/code-review-debts-1a05.md (CODE-01 to CODE-16, score 58)
- D:/3_Claude/PowerApps-live/reports/design-request-debts-1a05.md (owner decisions 1 and 2)
- D:/3_Claude/PowerApps-live/knowledge/review-conventions.md and D:/3_Claude/PowerApps-live/knowledge/project.md

All three reports are present. I also checked two code facts in live index.html because rulings depend on them. First, `contributionProblem` (5181–5190) checks only the fields it knows and ignores any others, so a new optional field on a payment does not break older builds or imports. Second, `saveEditDebtPayment` (13748–13793) is the only place a payment gets written.

## Executive Decision

**No.** The change is not fit for release as proposed. Live v37 as it stands today stays fit, and every step in the Development Order below is meant to ship on its own with `npm test` green. Two Critical findings sit on the connection (F1). CODE-01: counting the full repayment counts the principal twice for anyone who also logged what they bought with the loan. UI-01: payments users already logged by hand would be counted a second time the moment they upgrade. The screen work (the detail, rows, copy) carries no financial risk, is mostly a port from ink, and needs no redesign, so it goes first. F1 goes last. It ships only under the counting rule ruled here, it counts only payments recorded after the release, and the rule lives in one function so it can be changed later without a data migration.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Ruling on how F1 counts a repayment; restate module header, `saveEditDebtPayment` comment, project.md rationale | Critical (CODE-01). Ruled in C1 below. Restating the header, the comment and project.md ships in the F1 commit, because that commit is what makes the old wording false. |
| WORK-02 | No past period's spending total changes on upgrade | Critical (UI-01). Ruled in C1: a new payment is marked when it is written, and only marked payments count. Older payments stay Debts-only, as they are today. |
| WORK-03 | One spending accessor at every read site; `accountBalance` never reads it; category in-use check counts payments | High (CODE-02). Without one accessor, Expenses, Home and Analytics will disagree. Split into two commits: a pure refactor with no behaviour change, then the F1 behaviour. |
| WORK-04 | One derived Paid/Next/Overdue rule (`debtInstalmentStates`) read by the row, detail, Pay prefill and bell | High (UI-02, CODE-04). Owner decision 2 needs exactly one rule, or two screens will contradict each other about whether the user is behind. Overdue ruled below. |
| WORK-05 | Bounded schedule walk `debtScheduleOccurrences`, ported from ink | Unblocks WORK-04 and WORK-18. Stops a fifth copy of the schedule walk from being written. XS, no behaviour change. |
| WORK-06 | Port the debt detail with refresh after every write and close-when-gone; do not port `mDebtPayHome` | Every detail item depends on it. A modal that goes stale is a wrong figure on screen (CODE-10). |
| WORK-07 | Detail keeps every fact the card carried; the "Still owed includes…" line under the hero too | High (UI-03). Without that sentence, "Still owed more than Borrowed" reads as a bug in the module's main figure. |
| WORK-08 | "Payments · N recorded ›" row opening `openDebtHistoryModal` unchanged | High (UI-05). It is the only way to correct a mistyped payment. Reuses an existing sheet. |
| WORK-09 | Leave the "% / yr" tag off rows | High (UI-04). A bare percentage that puts two different measures side by side misleads the target user. Leaving it off is the smallest fix. Owner's call, see C7. |
| WORK-10 | Loan-payment rows in Expenses: own attributes, shared `deleteDebtPayment(id)`, honest ✕ confirmation, ✎ route, no false "Expense deleted" | High (UI-06, CODE-03). A false success message breaks the save-outcome rule. ✎ ruled in C2. |
| WORK-11 | Restate every comment and string made false, in the commit that makes it false | High (UI-07). Comments are the design record (coding-standards.md). This is not a separate task. |
| WORK-12 | Harness restated, not deleted; Condition 4 / WORK-164 split into a kept negative and a new positive invariant; new flows | High (CODE-05). Deleting the guards to get green would remove the protection on stock invariance, condition 9, the cascade and the caps. Lands in pieces, with each structural commit. |
| WORK-13 | Debt delete moves into the Edit sheet via `deleteDebt(id)`; spending clause added once F1 ships | The card ✕ disappears when rows replace cards, so delete needs a new home. The clause ships in the F1 commit, because only F1 makes it true. |
| WORK-14 | Coral for overdue only, through `deadline-danger` / `deadline-warning` | Keeps urgency readable and keeps contrast in all 16 themes. XS. |
| WORK-15 | "repaid" and "still owed" labels, both in the row's accessible name | Removes a misreading already recorded on ink. XS. |
| WORK-16 | "Final instalment" beside `dueDate`, never in place of it | Removes a misreading of a date. XS. |
| WORK-17 | Non-control glyph for schedule markers, at 3:1 | A shape that looks like a checkbox invites taps that do nothing. XS. |
| WORK-18 | Fold Paid rows into "N paid · show" (`.more-fields`) | On a long schedule, Next scrolls out of view. Reuses an existing control. |
| WORK-19 | Pay opens the existing sheet, prefilled with min(remaining on Next, still owed), never writes on tap; write moves onto `commitWrite` | Both reviewers asked for it independently. A one-tap write would skip the date, the account and the shortfall checks. Still one record per payment, so it still meets owner decision 1's goal. |
| WORK-20 | "Mark settled"; settled detail shows "Settled on {date} · Change" | Wrong copy on an overdue debt, and settle has no visible undo. XS. |
| WORK-21 | Ruled rate sentence word for word via `debtRateLineHTML`; no benchmark, no "Why this matters ›" | Removes an unsourced market claim the app cannot keep up to date offline, and a link that goes nowhere. |
| WORK-22 (narrow part) | One add entry point and one word | Two controls for one action. Narrow scope only. The schedule-at-add part is deferred, see C4. |
| WORK-23 (title part) | Loan-payment rows titled "Loan payment · {debt}", one named slice, never "Unknown ?" | Without it, every payment shows as an unknown expense. The slice comes free from the stored category ruled in C3. The neutral "Loan" tag is rejected, see C3. |
| WORK-24 | Keep the live 44px "Cleared (N)" disclosure, restyled only | "Paid off" is false for a debt settled short, and the proposed link is under 44px. |
| WORK-25 | Empty and edge states (no debts, all settled, no schedule, settled detail) | Common states that would otherwise be improvised in the build. Mostly reuses live strings. |
| WORK-26 | Hero bar = totalPaid / (totalPaid + totalOutstanding); settled-short debt added to the condition 9 fixture | Without it the bar contradicts "Still owed ₮0". XS, and it applies to live today. |
| WORK-27 | Orphan imported payments still count, labelled "Loan payment"; flow added | Keeps Expenses consistent with `accountBalance`, which already counts these payments. XS, ships inside the F1 commit. |
| WORK-28 | Hero uses `--t-hero`, measured at 320px with a nine-digit total | The hero overflows a 320px phone. XS, ships in the rows commit. |
| WORK-29 | One date format: the new screens use live's existing ISO dates; no new formatter | Keeping ISO is the smallest way to make the same record look the same on both screens. Adding a formatter is rejected, see the Rejected table. |
| WORK-30 | Port the screen body only; keep the live header and More → Debts; no tab bar or FAB | The tab bar and FAB are ink's navigation model, not live's. A build constraint, not separate work. |
| WORK-31 | Two lines for a debt name before the ellipsis | Similar lender names become impossible to tell apart at 320px. XS, ships in the rows commit. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-23 (tag part) | Neutral "Loan" tag in place of the Needs/Wants/Savings group | It would add a fourth label that exists on one row type only, and Budget Planning's group totals would no longer match the tags users see. The row title already names the payment. The tag shows the category's group like every other row. |
| WORK-29 (formatter part) | Add a human-date formatter for Debts and Expenses | That is an app-wide date change, unrelated to Debts, and nobody asked for it. Keeping ISO already gives one format. |
| (C2, UI-06 position) | A payment editor reached from ✎ on an Expenses loan row | It adds a payment edit path that does not exist today. An edit would have to re-run the allocation, the date-before-loan refusal and the account shortfall check (Code Review, Future Risks). Delete and re-enter covers the need. See C2. |
| (UI-01 option) | A one-time "bring older payments into spending" choice | Speculative. It would bring back exactly the double count UI-01 warns about, for users who logged those payments by hand. Not built. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-22 (schedule-at-add part) | Schedule fields in the add form | A separate owner request after the detail ships, or evidence that users add a debt and never come back to set its schedule. Today it is Add, then Edit, which works. |
| WORK-32 | One per-render debt-id → paid `Map` | A measured Debts render above 50 ms on the 320 fixture with 10,000 payments, or a third per-row ledger walk being added. Until then, the extra walk WORK-04 adds is cheap at realistic sizes. |

## Conflict Rulings

**C1. What F1 counts, and whether past payments count (UI-01 vs CODE-01 / CODE-02). This is the owner's call. The recommended default is below, and the build proceeds on it if the owner does not answer.**

The ruling has three parts.

1. **Data model: derived, one record (CODE-02).** `db.debtPayments` stays the only source of truth. No expense record is ever written for a payment. Spending is read through one accessor, `spendingEntries()`, which returns `db.actual` plus one projected row for each counted payment. `accountBalance` keeps reading `db.debtPayments` and never reads the accessor. Backup, export and import never read it either.

2. **Which payments count: forward only (UI-01).** From this release, `saveEditDebtPayment` writes a new optional field on each payment, `spending: true`. Only payments carrying it are projected into spending. `contributionProblem` gains one rule, "if present it must be boolean", following the same pattern as `accountId`.
   - No existing record is rewritten (F3).
   - No past period's total moves.
   - Payments written by an older build (cloud sync, a cached tab) carry no flag. They stay Debts-only, which matches what that older build told its user.
   - No `SCHEMA_VERSION` bump is needed for the flag. The validator already ignores fields it does not know.

3. **How much of a counted payment counts.** This is the owner's call between CODE-01's two options:
   - (a) The full payment counts. This is owner decision 1 as recorded.
   - (b) Only the cost share counts, so the principal is not counted again.

   **Recommended default: (a), the owner's recorded decision.** Reasons:
   - The owner made the decision knowingly, quoting the rule it reverses.
   - Live already tells users to log the full payment as an expense by hand (13750–13753, 6101–6102). So (a) only removes the retyping. It moves no figure compared with what the app itself already tells users to do.
   - (b) would put rows in Expenses whose shown amount differs from what they add to the total. For users with little accounting knowledge, that looks like the app being wrong, and no reviewer has assessed it.
   - The rule lives in one function (the amount the accessor projects for each payment). Switching to (b) later is one commit with no data migration.

   What the owner must be shown before the F1 commit merges is CODE-01's worked case: borrow ₮1,000,000, log a ₮1,000,000 phone, repay ₮1,300,000. Home then shows ₮2,300,000 spent against a real loss of ₮1,300,000, and "Left over" differs from the account balances by the principal. If the owner chooses (b), the projection counts the cost share only, and the row shows "cost ₮X of ₮Y paid". That shape then needs a UI review pass before it merges.

   Under (a), CODE-01 is resolved by its own option (a). The module header (11330–11338), the `saveEditDebtPayment` comment (13748–13753) and the Debts rationale in knowledge/project.md are all restated in the F1 commit to say what the app now does, including that the principal gap is accepted. Nothing is left claiming "a repayment of principal is not an expense".

**C2. ✎ on a loan-payment row in Expenses (UI-06 vs CODE-03): CODE-03's position.** ✎ opens the debt detail. ✕ calls the shared `deleteDebtPayment(id)` and uses UI-06's honest confirmation: "Delete this loan payment? It is also removed from {debt}, and what you still owe goes up by ₮X." A payment edit path is not built here (see Rejected). It can come back as its own request if users ask for it.

**C3. Categorising loan payments (UI-18 vs CODE-02): CODE-02's position.** One stored, ordinary "Loan payment" category in group Needs.
- It is created by an append-only v2→v3 migration, with a fixed id. It is not created on the first payment, because that would make a payment write create a category as a side effect, and two windows could race to create it.
- Every existing `db.categories` lookup, the donut, Planned vs Actual and the 50/30/20 group totals then work without special cases. The named slice in UI-18 comes free with it.
- The category in-use check refuses to delete it while any debt exists, so the projection can never point at a missing category.
- The row is titled "Loan payment · {debt}", with the debt name escaped. The "Loan" tag is rejected.

**C4. Schedule fields in the add flow (UI-17 vs CODE-16): CODE-16's position.** It is a separate request, deferred above. This change ships one entry point only.

**C5. Which word (UI-17 vs CODE-16): neither rename.** The one entry point is the existing disclosure summary, restyled as the pill, and it keeps the live wording, "Record borrowed money". That is the same wording as #incGoDebts (3094) and #quickGoDebts (3815), so no other entry point has to be renamed. The pill measures at 320px. If the text does not fit, the pill wraps to two lines. It is not reworded. Both links keep navigating to Debts. Opening the form from them is not in scope.

**C6. Severity differences inside merged items.** These were recorded, not resolved, and none of them changes a ruling. Each merged item took the higher severity for its priority, and I accept that ordering. Severity stays as each reviewer set it.

**C7. Rulings the Engineering Manager asked for in the same sitting.**
- **Does a past unpaid instalment make a debt Overdue?** Yes. The owner drew "Overdue 18 days" in 1a·05, and decision 2's allocation makes it derivable. When Next's date has passed, the row and detail say "Overdue {n} days", counted from the earlier of Next's date and a passed `dueDate`. The bell's floor-at-today rule changes in the same commit, so the bell names the missed instalment. The comments at 6126–6131 and 12657–12666 are restated in that commit. The owner may veto this. If they do, the row shows "Due" for a passed Next and the bell is left unchanged.
- **Row rate tag.** Off. This is the owner's call, defaulting to off. If the owner wants a figure on the row, it must be one measure on every row, with a word ("cost 30% a year"), and it is left out when the cost is zero (UI-04).
- **Pay never writes on tap (EM recommendation 2).** Ruled under WORK-19. Pay plus Save still writes exactly one record, which is the owner's goal. The owner is told about this. No answer is needed to proceed.

## Development Order

Each step is one commit, ships on its own, and keeps `npm test` green (all standing gates, lint at 17) at 320 and 390. Harness flows are restated in the same commit as the code they test. They are never deleted.

**Phase A: extractions with no behaviour change.**
1. **WORK-05.** Port `debtScheduleOccurrences`. `debtAgreedPaymentAmount` and the existing walks read from it.
2. **CODE-08 extraction (part of WORK-21).** Extract `debtRateLineHTML(d)` with unchanged output. The card calls it.
3. **CODE-07 extraction (part of WORK-07).** Extract `debtCardParts` and `debtRelationshipSentenceHTML` out of the `cardHTML` closure. The card calls them, and its output is unchanged.
4. **CODE-03/CODE-07 extraction (parts of WORK-10 and WORK-13).** Extract `deleteDebt(id)` and `deleteDebtPayment(id)`. The card and the history sheet call them. Copy is unchanged.

**Phase B: live fix.**
5. **WORK-26.** Change the hero bar denominator and add a settled-short debt to the condition 9 fixture.

**Phase C: the detail, opened from the existing card.**
6. **WORK-06.** `#debtDetailModal`, `openDebtDetail` and `renderDebtDetail`, opened from the card name. `renderDebts` refreshes the detail as its last step and closes it with `EDIT_TARGET_GONE_MSG` when the debt is gone. Adds the Back, refresh and crosswindow flows.
7. **WORK-07.** The relationship sentence, the cost caveat, and the overpaid and settled-short lines in the detail, under the figures they explain.
8. **WORK-08.** The Payments row.
9. **WORK-21.** The ruled rate sentence in the detail.
10. **WORK-16.** "Final instalment" beside `dueDate`.
11. **WORK-20.** "Mark settled" and the settled state.
12. **WORK-25 (detail part).** The no-schedule line ("No agreed schedule · Add one", which opens Edit) and the settled detail.

**Phase D: allocation.**
13. **WORK-04 (function).** `debtInstalmentStates(d)` as a pure function, with flows for each of CODE-04's edge cases. No UI change.
14. **WORK-04 + WORK-17 (schedule list).** The schedule list in the detail with Paid / Next · ₮X left / Overdue states and non-control glyphs. Restates 12384 (WORK-11).
15. **WORK-18.** The "N paid · show" fold.
16. **WORK-19.** Pay prefill, and `saveEditDebtPayment` moves onto `commitWrite`.
17. **WORK-04 (bell).** The bell reads the allocation and names an Overdue instalment. Restates 6126–6131 and 12657–12666.

**Phase E: rows replace cards.**
18. **WORK-13.** Delete moves into the Edit sheet. It lands before the card ✕ goes.
19. **Rows (WORK-09, 14, 15, 24, 28, 30, 31, and the screen part of WORK-25).** One row template replaces the card: ring and "repaid", "still owed", state from the allocation in deadline classes, no rate tag, "Cleared (N)", `--t-hero`, two-line names, live header kept, plus the empty and all-settled states. These are all parts of one template, so they ship together. Card anchors are restated against row and detail (WORK-12).
20. **WORK-22 (narrow part).** The single entry point, restyled from the disclosure summary. Restates 3512 if it is still present.

**Phase F: the connection, under the C1 ruling.** It does not merge until the owner has been shown the worked case. If they have not answered, it merges on default (a).
21. **WORK-03 (refactor).** `spendingEntries()` returns `db.actual` only, and every read site CODE-02 lists switches to it. No behaviour change.
22. **WORK-02 (flag).** `saveEditDebtPayment` writes `spending: true`, and `contributionProblem` validates the field. No visible change.
23. **WORK-03 + WORK-01 + WORK-23 + WORK-27 (F1).** The v3 migration creates the "Loan payment" category. The accessor projects flagged payments. Orphan rows are labelled. The category in-use check covers payments. Loan rows render in Expenses with no ✎ or ✕ yet.
    - Restates, in this commit: the module header, the `saveEditDebtPayment` comment, 6101–6104, 11801, the project.md rationale, and the debt-delete clause from WORK-13.
    - Splits Condition 4 / WORK-164 into the kept negative and the new positive invariant (a payment appears once in Expenses, once in each total, and never twice in any account balance).
24. **WORK-10.** Loan-row ✎ opens the detail. ✕ calls `deleteDebtPayment` with the honest confirmation and re-renders Debts, Expenses, Dashboard and the bell. Adds the F2 flows.

Why this order:
- The extractions come first so later commits only move or add code, never rewrite it.
- The detail comes before rows so no fact is ever lost. The card stays until the detail carries everything it carried.
- Allocation comes before rows because the row state reads it.
- The refactor comes before F1 so that the F1 commit changes behaviour in exactly one function.
- Steps 23 and 24 are split so that no build ever shows a ✎ or ✕ that reports a false success.
- F1 is last because it is the only step that changes financial figures, and the only one waiting on the owner.

## Architecture Strategy

**What stays:**
- Single localStorage blob, offline-first, mobile-first.
- `db.debtPayments` as the only payment record.
- `accountBalance` reads the ledger directly.
- Append-only migrations.
- Integer tugrik with one rounding per figure.
- The live header and More → Debts navigation.
- The existing payment sheet and history sheet, reused rather than replaced.

**What changes:**
- **Spending is read through one accessor.** This is the quarter's main structural change. It is also the only way any future source of spending can be added safely.
- **Per-debt derivations leave the `renderDebts` closure** and become pure functions (`debtCardParts`, `debtInstalmentStates`, `debtScheduleOccurrences`, `debtRateLineHTML`) shared by rows, the detail, Expenses and the bell.
- **Deletes become named functions on `commitWrite`.**
- **The harness tests behaviour against the new row and detail anchors.** Its invariants are restated, never deleted.

**What is off limits:**
- Writing a second record for a payment.
- Projecting payments into backup, export, import or `accountBalance`.
- A payment edit path.
- Porting ink's Home "Left to spend", tab bar, FAB or `mDebtPayHome`.
- A market-rate benchmark.
- A new date formatter.
- Rewriting any stored record to change past totals.

**Stated risks, not findings:**
- Under default (a), "Left over" and the account balances differ by the principal for as long as a loan runs. This is accepted and must be written into the restated rationale.
- If ink's "Left to spend" rule is ever ported, it would stack on F1 and count a payment twice in one month (Code Review, Future Risks). Any such port needs its own ruling first.

## Final Recommendation

Start Phase A now with step 1 (WORK-05, port `debtScheduleOccurrences` as a no-behaviour-change commit). At the same time, put CODE-01's worked case and the C1 choice ((a) full payment, the default, or (b) cost share only) to the owner, together with the two smaller default calls (Overdue on a missed instalment, no rate tag on rows). Phases A to E need no answer and take roughly two weeks. That gives the owner time to answer before step 23, the only commit that changes a financial figure. If the owner has not answered by then, it merges on default (a), with the full restatement and the forward-only flag.
