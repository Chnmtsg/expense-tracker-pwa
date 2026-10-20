# Code Review: Debts 1a·05, debt detail 1a·06, one payment record in both places

Scope: the live worktree `D:/3_Claude/PowerApps-live` (branch `live-v35`). I read `expense-pwa/index.html` and `tools/harness/` (mostly `debts.js`, plus `v1-write-flows.js` and `accounts.js`). The request was `reports/design-request-debts-1a05.md`. Prior art came from `D:/3_Claude/PowerApps` (`ink`): `expense-pwa/index.html` and `reports/chief-architect-ink-debts.md`. Line numbers are for live `index.html` unless another file is named.

## Executive Summary

The live Debts code is in good shape. Money is stored as whole tugrik and rounded in one place. The derived figures are pure and guarded. The settle, overpayment and cascade cases are handled and backed by a 3,183-line probe. The design work in 1a·05 and 1a·06 is mostly moving and removing things, and most of it can be ported from `ink`. The connection is different. "Pay once, shows in both" reverses this module's founding rule. The biggest risk is CODE-01: counting the whole repayment as spending counts the borrowed principal twice in Home's "Left over", the Expenses total and Analytics, for every user who records what they bought with the borrowed money. That is the double count the module header (11330–11338) says Debts was built to remove. It needs an explicit ruling, with the numbers in front of the owner, before any F1 code is written. The other risks are about how F1 is built (CODE-02, CODE-03), the Paid/Next rule (CODE-04), and the harness, whose standing invariants assert the opposite of F1 (CODE-05).

## Overall Score

**58 / 100**: significant work is needed before this change can go out. The existing Debts code on its own would score in the mid-80s. This change as proposed carries one Critical (CODE-01) and four High findings (CODE-02 to CODE-05), and each one has to be ruled on or designed before code. None of them needs a rewrite.

## Findings

Review areas in brief:
- **Money correctness:** clean in existing code. Integer tugrik, one `Math.round` per figure, and the caps live inside the formulas (`debtInterestPaid`, 11442–11448). CODE-01 is the exception, and it belongs to the proposal.
- **Dates:** clean. Local ISO strings, `parseISO`, and `stepDate` clamping the 31st.
- **Schema:** clean. `SCHEMA_VERSION = 2` with append-only migrations (4004–4068).
- **Failed writes:** clean. There is a single localStorage blob, so one `save()` is atomic.
- **Offline-first:** unaffected. Nothing here touches the network.
- **Security:** clean in existing code. `escapeHTML` is applied wherever a debt name or note reaches the DOM (12045, 12158, 12181–12185, 12451). New sites are covered in CODE-02 and CODE-11.
- **Dependencies:** none added.

### Critical

**CODE-01 — Counting the whole repayment as spending (F1) counts the principal twice**
- Severity: Critical
- Location:
  - `index.html` 11330–11338 (module header) and 13748–13753 (`saveEditDebtPayment` rule)
  - `knowledge/project.md` 35–38
  - `tools/harness/debts.js` 492–495
  - `tools/harness/v1-write-flows.js` 537–559
- Evidence:
  - The header names two wrong options the module exists to remove. The second is "the same money was counted as spending twice — once when they spent it, once when they paid it back." It then says "a repayment of principal is not an expense".
  - Owner decision 1 counts the whole payment in the spending totals.
  - Worked case: borrow ₮1,000,000 and log a ₮1,000,000 phone in Expenses (the normal path). Then repay ₮1,300,000. Today Home shows ₮1,000,000 spent (it leaves out the ₮300,000 cost). Under F1 it shows ₮2,300,000. What the user actually lost is ₮1,300,000.
  - `accountBalance` (10747–10759) is unaffected and correct. So after F1, "Left over" and the account balances always differ by the principal.
  - Mitigating fact: the live comment at 13753 already tells users to log the payment as an expense themselves. So this owner is already double counting by hand. F1 would make it automatic for every user.
- Impact: Home, Expenses, Budget Planning and Analytics all overstate spending by the principal for the life of every loan. That is a wrong financial figure under the severity table, and it reverses the reason project.md gives for Debts being a core module.
- Recommendation:
  - Before any F1 code, the Chief Architect puts the worked case to the owner and gets a recorded ruling on one of two options:
    - (a) Keep counting the full payment. Then restate the module header, the `saveEditDebtPayment` comment and project.md's rationale, and accept the gap between "Left over" and the account balances.
    - (b) Show the row in Expenses (no retyping, which is the owner's real goal) and count the payment in totals by a rule that does not re-count principal.
  - Either way, the two harness invariants are restated as positive conditions, not deleted (CODE-05).
- Effort: XS for the ruling; S for restating the rules and probes.

### High

**CODE-02 — F1 data model: a linked second record double-subtracts accounts and breaks older builds; a derived row needs a single accessor and a real category**
- Severity: High
- Location: `accountBalance` 10752; the readers of `db.actual` listed below; donut 9099–9103; category delete 8832–8839; `scheduleCloudSync` from `save()` 4868–4872
- Evidence:
  - **Linked record (two records).** `accountBalance` already subtracts `db.debtPayments` (10752). A mirrored `db.actual` row that carries an `accountId` takes the money out of the account twice, and `spendShortfall` checks it twice. An older build (another device via cloud sync, or a cached service-worker tab) that deletes the payment from the history sheet (12469) leaves the mirror behind as a stray expense. That breaks "Always preserve backward compatibility".
  - **Derived row (one record).** Spending totals come straight from `db.actual` with no shared accessor. The sites are:
    - Expenses list and total: 8211, 8218–8219
    - Dashboard KPI, net, donut and Planned vs Actual: 9033, 9042, 9099, 9107
    - Monthly trend: 9324, and its date span at 9276
    - Daily stats, chips and None: 9425, 9443
    - Stacked chart and calendar: 9511, 9610, 9666
    - Day detail: 9790
  - Each of those sites looks up `db.categories` by `categoryId`. The donut silently drops entries with no category (`if (cat)` at 9102), so a payment with a made-up category id would count in `kpiExpenses` and be missing from the donut.
  - Settings lets a user delete a category that is in use (8834–8836). Its check reads only `db.actual` and `db.planned`.
- Impact: whichever model is picked, one missed reader makes Expenses, Home and Analytics disagree with each other.
- Recommendation:
  - Use the derived model: `db.debtPayments` stays the single source of truth.
  - Add one stored, ordinary "Loan payment" category (group Needs). Create it in a v2→v3 migration, or on the first payment.
  - Add one accessor, for example `spendingEntries()`: `db.actual` plus one projected row per payment `{id, date, amount, categoryId: loanCat, debtPaymentId, debtId}`. Switch the read sites above to it in one commit.
  - `accountBalance` keeps reading `db.debtPayments` and must never read the accessor.
  - Extend the category in-use check to count payments. Show the debt name only through `escapeHTML`.
  - This adds no stored expense, needs no data migration (F3), and is invisible to older builds.
- Effort: M

**CODE-03 — Edit and delete on an Expenses row would fail silently for a loan-payment row**
- Severity: High
- Location: Expenses click handler 8300–8315; `openEditModal` 13375–13379; payment delete in the history sheet 12466–12487
- Evidence:
  - Delete runs `db.actual = db.actual.filter(i => i.id !== b.dataset.delExp)` and then `save()` and `savedToast(ok, 'Expense deleted')`. For a projected row the filter removes nothing, `save()` succeeds, and the user is told it was deleted while the row stays.
  - Edit calls `openEditModal('actual', id)`, which returns with no message when the id is not in `db.actual` (13379).
  - The only payment delete is written inline inside the history sheet.
- Impact: F2 ("delete in one place removes both") would report a success that did not happen. That breaks the save-outcome rule.
- Recommendation:
  - Give loan rows their own attributes (for example `data-debt-pay-del` and `data-debt-open`).
  - Pull the history sheet's delete out into one `deleteDebtPayment(id)` function. Use it from the history sheet and from Expenses, and have it re-render Debts, Expenses, Dashboard and the bell.
  - ✎ on a loan row opens the debt detail. There is no payment edit path today, and this is not the place to add one.
- Effort: S

**CODE-04 — Paid/Next/Overdue has no single rule, and it would contradict the bell and the edit sheet**
- Severity: High
- Location: `computeReminders` debt branch 6126–6131 and 6144–6146; `debtNextAgreedPayment` 12649–12699; edit-sheet helper 12384; due chip 12143–12152
- Evidence:
  - The bell only ever looks at the next instalment on or after today. It says the app "is not in a position to notice" a missed instalment (6126–6131, 12657–12666).
  - The edit sheet tells the user "This app does not mark them paid" (12384).
  - Owner decision 2 adds Paid and Next marks, and D4 shows "Overdue 18 days". If that comes from an unpaid past instalment, the Debts row would say Overdue while the bell announces the next future instalment as "Agreed payment … in N days".
  - Today "overdue" exists only for `dueDate` (12148). The design request does not say which source D4 uses.
  - `ink`'s `debtNextDate` (ink 14205) and `debtUpcomingHTML` (ink 13507) were built under WORK-01, so they cannot be ported as they are.
- Impact: two screens make opposite claims about whether the user is behind. That is wrong in either direction for someone under financial stress.
- Recommendation: one pure function, `debtInstalmentStates(d)`, built on one bounded schedule walk (CODE-13), with these rules:
  - Amounts come from `debtAgreedPaymentAmount`.
  - The money to allocate is `min(debtPaid, totalToRepay)`, filling instalments in date order. Payment dates are ignored, so payments made before the first due date count.
  - An instalment is Paid once fully covered. One partly covered instalment shows what is left. The first instalment that is not Paid is Next.
  - If `debtOutstanding === 0`, every instalment is Paid.
  - A settled-short debt marks nothing as Paid beyond what the money covers, and has no Next.
  - A schedule that `debtEffectiveAnnualRate`'s sum check would reject (11646) gets no marks at all.
  - The row state, the detail list, the Pay amount and the bell all read this one function. The ruling must say whether a past Next makes the debt "Overdue". If it does, the bell's floor-at-today rule changes in the same commit.
  - Restate 12384, 6126–6131 and 12657–12666.
- Effort: S–M

**CODE-05 — The harness asserts the opposite of F1, and most of its anchors are being removed**
- Severity: High
- Location:
  - `tools/harness/debts.js`: Condition 4 at 434–507 (492–495), helper closure at 1974–2045 and 2630–2684, card controls at 159 and 2853–2926
  - `tools/harness/v1-write-flows.js` 534–559
  - `tools/harness/accounts.js` 907, 933, 942
- Evidence:
  - `debts.js` 492–495 fails if a tapped payment moves Expenses ("repaying principal is not spending").
  - `v1-write-flows.js` 554–556 does the same for seeded payments.
  - `debts.js` has 65 anchors on `.debt-card`, `.debt-total-item`, `.debt-meta`, `.debt-rate`, `#debtAddFields` and `.helper`. It also asserts helper text that D6 removes, for example 2650, which needs "Still owed" in the summary helper.
  - `accounts.js` 907 lists the five `data-debt-*` card controls.
- Impact: either `npm test` goes red, or someone "fixes" it by deleting the guards that protect the parts that do not change: stock invariance, the reconciliation in condition 9, the cascade, and the caps.
- Recommendation:
  - Each structural commit restates its own flows against the row and the detail. Flows are not deleted.
  - Condition 4 and WORK-164 split:
    - "a debt reaches no Income or Left-over total" stays.
    - A new positive "a payment appears once in Expenses and once in each total, and not twice in any account balance" is added.
  - New flows: F2 delete from both places, the allocation edge cases from CODE-04, the detail's Back behaviour (`navigation.js`), and refresh or close when another window deletes the debt (crosswindow).
- Effort: M

### Medium

**CODE-06 — The D3 bar never reaches 100% once a debt is settled for less than agreed**
- Severity: Medium
- Location: 11710–11711, 11744–11745
- Evidence: `totalOutstanding` counts a settled debt as 0. "Total to repay" still includes that debt's full `totalToRepay`. So paid ÷ total-to-repay stays below 100% when everything is finished.
- Impact: the hero bar contradicts "Still owed ₮0" at the moment the user finishes.
- Recommendation: bar = `totalPaid / (totalPaid + totalOutstanding)` (`ink` WORK-08). Add a settled-short debt to the condition 9 fixture.
- Effort: XS

**CODE-07 — D6 removes facts that would have no other home**
- Severity: Medium
- Location:
  - Overpaid and settled-short lines: 12189–12190, with the rule at 11733–11743 ("Do not 'fix' this by capping the card")
  - Relationship sentence: 11799
  - History sheet, the only place to delete a mistyped payment: 12182, 12437
  - Settle and undo: 12183, 12421
  - Delete: 12185, 12215–12245
- Evidence: D6 removes the helpers and all five card actions. The detail in 1a·06 shows only Edit, Settle early and Pay.
- Impact: the summary shows capped figures and the card shows uncapped ones, and the line explaining the difference disappears. A wrong payment can no longer be deleted. A settle made by mistake can no longer be undone.
- Recommendation:
  - Apply `ink` WORK-04's rule: the detail carries every fact the card carried.
  - Port `debtCardParts` and `debtRelationshipSentenceHTML` from `ink`.
  - Add a "Payments" row that opens `openDebtHistoryModal` unchanged.
  - Pull delete out into `deleteDebt(id)` (ink 13616) and put it in the edit sheet.
- Effort: S

**CODE-08 — The design's rate copy breaks the ruled wording**
- Severity: Medium
- Location: rule at 12065–12097; sentences at 12134–12141
- Evidence:
  - D4's "30% / yr" is a bare percentage, which the rule forbids, and it does not say which of the two figures it is.
  - E2 drops "on what you still owe" from the ruled sentence.
  - E2 also adds "A bank loan is typically 18–24%", an unsourced market claim the app cannot update offline. `ink` WORK-17 rejected it.
  - D4 also uses coral and amber, which live has no tokens for.
- Impact: the cost figure turns into an understatement, or into a claim the app cannot stand behind.
- Recommendation:
  - Extract `debtRateLineHTML(d)` (ink 12850) unchanged. Render it in the detail exactly as written.
  - The row tag needs its own ruling. Until then, leave it off.
  - Colour row states with the existing `deadline-danger` and `deadline-warning` classes (12148–12150), so all 16 themes keep AA contrast.
- Effort: XS–S

**CODE-09 — "Pay ₮X" must go through the existing payment sheet and through `commitWrite`**
- Severity: Medium
- Location: `saveEditDebtPayment` 13754–13793; the `commitWrite` rule at 10999–11001
- Evidence:
  - The sheet refuses a payment dated before the loan (13777), checks the account shortfall (13786–13788), and handles a debt that disappears while it is open (13760).
  - Owner decision 1 reads "Tapping Pay … saves one record".
  - The handler still uses a hand-placed `dbReplacedSince`. The rule says the next change to it moves it onto `commitWrite`.
- Impact: a one-tap write skips the date and account choice and the shortfall dialog, and one mis-tap records money.
- Recommendation:
  - Pay opens `openDebtPaymentModal` with a prefill of `min(remaining on Next, debtOutstanding)` from CODE-04. A user who paid ahead then cannot overpay in one tap (`ink` WORK-20 used the full instalment, which is too much once an instalment is part-paid).
  - Move the write onto `commitWrite` in the same commit.
- Effort: S

**CODE-10 — The new detail screen has no refresh or close behaviour**
- Severity: Medium
- Location: `refreshFromStorage` 4916–4922; write paths at 12243, 12470, 13714, 13743 and 13790
- Evidence:
  - Every Debts write re-renders only `renderDebts` and the bell.
  - Another window's write reloads `db` and calls `navigate`, which calls `renderDebts` (7414). Nothing refreshes or closes an open modal.
  - Live has no detail screen. `ink`'s detail needed WORK-10 (re-render after every write, close when the debt is gone) and WORK-11 (a delete that closes both sheets).
- Impact: after a payment, or after another window deletes the debt, the detail shows out-of-date figures.
- Recommendation:
  - Port `#debtDetailModal`, `openDebtDetail` and `renderDebtDetail` from `ink` (4056, 13530–13614). It uses the same modal stack (6597–6635).
  - `renderDebts` refreshes the open detail as its last step, and closes it with `EDIT_TARGET_GONE_MSG` when the debt is gone.
  - Do not port `ink`'s `mDebtPayHome` helper (ink 13698). It talks about Ink's Home "Left to spend", which live does not have.
- Effort: S–M

**CODE-11 — Imported orphan payments would show up as Expenses rows**
- Severity: Medium
- Location: `contributionProblem` 5181–5190; 5454–5456
- Evidence: an imported payment only has to have some `debtId`. That id is not checked against `debts`, and the 5454 comment says transfers are stricter "on purpose".
- Impact: under F1, a payment whose debt is missing becomes a "Loan payment · undefined" row that counts in totals but appears on no Debts screen. Or it gets dropped and Expenses stops matching the account balances.
- Recommendation:
  - Write the rule into the accessor: rows whose debt is missing still count, labelled "Loan payment" with no name. That matches `accountBalance`, which already counts them.
  - Add a flow for it.
- Effort: XS

**CODE-12 — Comments and screen copy that F1 or owner decision 2 would make false**
- Severity: Medium
- Location:
  - 11335–11338: "Nothing here writes to db.actual … a repayment of principal is not an expense"
  - 13750–13753
  - 6101–6104
  - 12384: "This app does not mark them paid"
  - 11801: "it is not counted in 'Left over' on Home"
  - 3512: "recording a repayment is still up to you"
- Evidence: each of these states the rule that is being reversed.
- Impact: `coding-standards.md` says "Comments in this project are the design record. Keep them true." Screen copy at 11801 and 12384 would also tell users something false.
- Recommendation: restate each one in the commit that makes it false. The `saveEditDebtPayment` comment should now say "stop telling users to type one" (F3).
- Effort: XS

### Low

**CODE-13 — The schedule list in E4 would walk the schedule once per row**
- Severity: Low
- Location: `debtAgreedPaymentAmount` 12706–12713
- Evidence: each call walks the whole schedule to find the last date. Calling it once per row in E4 means count² `stepDate` calls, which is 360,000 at the 600-month limit.
- Impact: a visible stall on a slow phone with a mistyped count.
- Recommendation: port `debtScheduleOccurrences` (ink 14161–14188) as its own commit, and have `debtAgreedPaymentAmount` and CODE-04's function read from it.
- Effort: XS

**CODE-14 — `renderDebts` walks the whole payment ledger about eight times per debt**
- Severity: Low
- Location: 11350–11354, 11892–11895, 11939, 11942–11957
- Evidence:
  - `debtPaid` filters all of `db.debtPayments`.
  - It is reached through `debtSettled`, `debtOutstanding`, `debtInterestPaid` and a separate count in `cardHTML`, in the sort keys, and again in the finished filter.
  - CODE-04 adds one more walk per row.
- Impact: still small at 10,000 payments, but it grows with debts × payments.
- Recommendation: build one `Map` of debt id → paid total and count per render, and pass it in. Do not change what the derived functions compute.
- Effort: S

**CODE-15 — Labels in the design that are false in some states**
- Severity: Low
- Location: fold summary rule 11926–11937; `debtPayoffDate` 12631
- Evidence:
  - "Last payment Jun 2027" (E3) can be read as the most recent payment made.
  - "1 paid off" (D5) is false for a debt settled for less than agreed. The fold string is fixed as "Cleared (N)".
  - "Settle early" (E5) is false for an overdue debt.
- Impact: small but real misreadings on a finance screen.
- Recommendation: "Final instalment", shown next to `dueDate` and never instead of it (`ink` WORK-18). Keep "Cleared (N)". Use "Mark settled" (`ink` WORK-06).
- Effort: XS

**CODE-16 — Two ways to add, and the schedule cannot be set at add time**
- Severity: Low
- Location: `#debtAddFields` 3447–3524; schedule fields only in the edit sheet, 12376–12381
- Evidence:
  - A "+ Add loan" pill next to the existing disclosure gives two controls for one action. `ink` WORK-23 rejected that.
  - The add form has no schedule fields, so getting the 1a·06 schedule takes Add and then Edit.
  - The design says "loan" while the app says "debt".
- Impact: one more thing for the user to learn, and an extra step before the main 1a·06 view appears.
- Recommendation: one entry point (the disclosure's summary styled as the pill) and one word for it. Adding schedule fields to the add form is a separate request.
- Effort: XS

## Technical Debt

- **No spending accessor (CODE-02).** Spending totals are separate reads of `db.actual` spread across Home, Expenses and Analytics. Any future source of spending has the same blast radius as F1.
- **Card logic lives inside one closure.** `renderDebts`'s `cardHTML` closure (11941–12193) holds every per-debt derivation, so neither the detail nor Expenses can reuse it. Pull it out into `debtCardParts` (CODE-07, CODE-10).
- **Delete logic written inline.** The debt delete (12215–12245) and payment delete (12466–12487) are inline listeners. A copied cascade will drift (CODE-03, CODE-07).
- **Four copies of the schedule walk** (11654–11660, 12642–12645, 12692–12696, 12710). A fifth is coming for Paid/Next unless the bounded walk lands first (CODE-13, CODE-04).
- **Older write paths not yet on `commitWrite`.** `saveEditDebtPayment` and both debt deletes still use the old pattern (CODE-09).
- **The harness tests the DOM shape, not only behaviour.** Its 65 selector anchors make every layout change a harness rewrite (CODE-05).

## Future Risks

- **Cloud sync with mixed versions.** Any F1 model that writes a second record will produce stray expenses when an older build deletes a payment (CODE-02). The derived model is immune.
- **Budget Planning.** Loan payments land in Planned vs Actual as unplanned actual spending in their category. Users will ask to plan them. That leads back toward planned expenses created from a debt, which 6095–6104 refuses.
- **"Left to spend" on Home.** The ink-branch rule (subtract instalments due this month) would stack on top of F1's counting and count a payment twice in one month. `ink`'s 14235–14239 already records a known one-instalment double count. Rule on this before either is ported.
- **Payment edits.** Expenses rows invite ✎. Today a payment can only be deleted and re-entered. An edit path has to re-run the allocation and the account checks.
- **Scale.** At 10,000 payments the main costs are the per-render ledger walks (CODE-14) and the existing per-month trend filter (9318–9324). Neither breaks first. The first thing to break as features grow is agreement between screens (CODE-02, CODE-04).

## Recommended Refactoring

This is the smallest set and order of changes, each shippable on its own with `npm test` green at 320 and 390. It answers the request's six questions.

1. **Ruling first (CODE-01, CODE-04).** Cover how F1 counts payments, using the worked numbers. Cover whether a past Next instalment means "Overdue", and the bell change that follows. Cover the row's rate tag (CODE-08).
2. **Pull out existing code with no change in behaviour (Q4).**
   - `debtScheduleOccurrences` (CODE-13)
   - `debtRateLineHTML` (CODE-08)
   - `deleteDebt` and `deleteDebtPayment` (CODE-03, CODE-07)
   - `debtCardParts`, plus one per-render paid `Map` (CODE-14)
   - The card calls all of these. No output changes.
3. **Detail screen (CODE-07, CODE-10, CODE-15).**
   - Port `#debtDetailModal` from `ink`, opened from the card name.
   - It carries every card fact, a Payments row, and Edit / Mark settled / + Payment.
   - Add the refresh/close and Back flows.
   - Port without the Ink tab bar, Home or Money. `--t-hero` already exists in live (146).
4. **Allocation (CODE-04).** `debtInstalmentStates(d)` as one pure function, with flows for the edge cases. Then the schedule list in E4 and the Pay prefill (CODE-09).
5. **Rows replace cards (D1–D6, CODE-06, CODE-16).** Ring with "repaid", the state from step 4, the bar denominator fix, "Cleared (N)", one add entry point. Restate the card flows in the same commit (CODE-05).
6. **F1 and F2, only as ruled in step 1 (CODE-02, CODE-03, CODE-11, CODE-12).**
   - The "Loan payment" category: a v3 migration, or created on first payment.
   - `spendingEntries()` swapped in at every read site in one commit.
   - Loan-row routing to the shared delete.
   - Restate comments and copy. Split the harness invariants into a kept negative and a new positive.
   - Q5, where the removed text goes: the ruled rate sentence, the reconciliation lines and the relationship sentence move into the detail word for word. "Why this matters ›" and the bank comparison are not built.

Nothing here needs a new library or a rewrite.
