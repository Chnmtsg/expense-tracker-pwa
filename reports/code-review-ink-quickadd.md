# Code Review: the Ink quick-add sheet (1a·02)

Scope: `reports/design-request-ink-quickadd.md` (Q1 to Q8) checked against `#quickSheet` and `quickEntryTo`, the `expAdd` / `incAdd` / `saveEditDebtPayment` write paths, the modal stack, and `tools/harness/` (quick-entry.js first). The owner's 2026-10-20 reversal is taken as given. Nothing is built yet, so this review covers what the current code forces on the proposal and what it would break if the proposal were built as drawn. All paths are relative to `D:\3_Claude\PowerApps\`.

## Executive Summary

Today's keypad is small, well commented and well tested, and it is safe for one reason: it writes nothing. `quickEntryTo` passes the amount to forms whose Add handlers hold every money rule. A sheet that saves directly removes that protection. The three handlers it needs (`expAdd`, `incAdd`, `saveEditDebtPayment`) are click handlers tied to their own forms' DOM, so none of them can be called from a sheet. The biggest risk is the Income mode. `pushIncomeWithSplit` only knows about split rows that exist in a form's DOM. If a sheet with no split rows called it, the split would be skipped silently, and every account with a share would end up with a wrong balance. The debt payment mode has its own problem. It cannot reuse the existing payment sheet, because `#editModal` paints underneath `#quickSheet`. The work is buildable, but only after three writers are extracted from their handlers first. A sheet that copies the handlers would leave four write paths that drift apart.

## Overall Score

**64 / 100.** "Usable but fragile". There is one Critical risk (the income split) and five Highs, each tied to a specific line of current code. All of them can be fixed by refactoring, with no rewrite, which keeps the score above 59. The number of Highs keeps it below 75.

## Findings

### Critical

**CODE-01: A direct income save from the sheet skips the account split, or applies one the user never saw**

- Severity: Critical
- Location: `expense-pwa/index.html` 11375-11378 (`INCOME_FORM_AMOUNT`, keyed `inc` and `s` only), 11428-11444 (`pushIncomeWithSplit`), 11380-11404 (`renderIncomeSplit`); `tools/harness/quick-entry.js` 454-482.
- Evidence:
  - `pushIncomeWithSplit(prefix, entry)` reads `prefix + 'Account'`, `prefix + 'SplitWrap'`, `prefix + 'SplitOn'` and `#${prefix}SplitRows` from the DOM.
  - It writes split transfers only when those rows are visible and checked.
  - The sheet in Q5 has a From chip and no split rows.
  - So any sheet call either finds no wrap and pushes the income with no transfers, or needs a third prefix with hidden DOM.
  - The probe at quick-entry.js:454 exists because "the split decides which account the money is credited to".
- Impact: The split is skipped with no error. An income of ₮100,000 into Main with a 20% Savings share stores ₮100,000 in Main and ₮0 in Savings. Both account balances are wrong, and the shortfall checks that use them go wrong too. The other way round, applying `splitPlan` without showing it would write transfers the user never saw.
- Recommendation: When Income mode's account has a non-empty `splitPlan(amount, accountId)`, the sheet does not save. It falls back to today's hand-off (`quickEntryTo('income')`) with a one-line reason. The split rows on the form stay the only place a split is confirmed. Do not add a hidden `q` prefix.
- Effort: S

### High

**CODE-02: Each write path is a click handler tied to its form, so a direct save means copying it**

- Severity: High
- Location: `expense-pwa/index.html` 8459-8501 (`expAdd`), 7793-7810 (`incAdd`), 14721-14760 (`saveEditDebtPayment`), 11545-11554 (`commitWrite` and its rule).
- Evidence:
  - All three handlers read their own inputs by id: `expAmount`/`expCategory`/`expAccount`, `incAmount`/`incType`, and `mDate`/`mAmount`/`mAccount`.
  - Each then runs validation, the shortfall check, push, `save()`, `stillHeld`, `revealEntryDate`, the renders and `savedToast`, all in one body.
  - No function exists that takes an entry and writes it.
  - `commitWrite`'s header says: "every new write path goes through this, and no new hand-placed dbReplacedSince is written."
  - `expAdd` awaits `confirmSpend` (8482) and then pushes into whatever `db` is current (8483). It never checks whether another window replaced `db` during the dialog.
- Impact: A sheet with its own save body is a second copy of each money rule. The next fix to `expAdd` (a refusal, a render, a toast) would miss the sheet. That is the drift the Salary and Add Income writers were merged to remove (WORK-09 at 11421-11427).
- Recommendation: Extract three writers that take values instead of DOM, before building any sheet UI. Each runs the existing validation and shortfall logic and returns the save outcome.
  - `recordActualExpense({date, amount, categoryId, notes, accountId}, {offerMove})`
  - `recordIncome(entry, split)`, with `pushIncomeWithSplit` becoming a wrapper that reads the DOM
  - `recordDebtPayment(debtId, {date, amount, notes, accountId})`

  The handlers become callers, and the sheet is a third caller. The new writers go through `commitWrite` with a snapshot taken before the first await. Each extraction is its own commit, with v1-write-flows, debts and accounts green and no behaviour change.
- Effort: M

**CODE-03: Income mode bypasses the "Borrowed money is not income" binding condition**

- Severity: High
- Location: `expense-pwa/index.html` 3161-3190 (the sentence and `#incGoDebts`, under `#incAdd`); the binding condition is in `reports/archive-chief-architect-round13.md` §2 and WORK-166.
- Evidence:
  - Today a keypad Income entry lands on the Income form, directly above the sentence. The markup comment says that is "the moment the mistake happens … at the one moment it matters".
  - Q2/Q7 save income from the sheet in three taps, without the user ever seeing that form.
- Impact: The sheet becomes the fastest way to record money that just arrived, including a loan. Home's net figure rises by the borrowed amount, which is the defect the Debts module exists to prevent. The sentence is still in the app but no longer at the moment of entry.
- Recommendation: Income mode shows the sentence itself, visible and unshortened, with the words "is not income", plus a link that closes the sheet and calls `navigate('debts')`. It is not a chip and not an income type; "Loan" as an income type is pre-rejected permanently.
- Effort: S

**CODE-04: A category chip selected by default turns "amount, Save" into a wrong-category record**

- Severity: High
- Location: `expense-pwa/index.html` 7324-7327 (`quickEntryTo` comment and toast), 8462-8464 (`expAdd` category check).
- Evidence:
  - The current code warns because "the form arrives with a category already selected, so it looks finished".
  - `expAdd` refuses only when there is no category at all.
  - If the sheet's chip row, ordered by recent use (Q4), opens with the first chip selected, the same false sense of being finished becomes a two-tap write with no "Not saved yet" step after it.
- Impact: Expenses are quietly recorded under the user's most recent category. Insights' breakdown, the Needs/Wants split and "Planned, not yet spent" on Home (calculated per category) all become wrong.
- Recommendation:
  - The sheet opens with no category selected.
  - Save stays enabled. Tapping it with no choice refuses on the chip row in `refuseField`'s manner, naming the category.
  - Debt mode does the same with no debt selected.
  - Add a flow: amount plus Save with no chip writes nothing and refuses.
- Effort: XS

**CODE-05: A Note input inside the sheet cannot hold digits, and it takes focus on every open**

- Severity: High
- Location: `expense-pwa/index.html` 7345-7350 (the sheet's keydown handler), 6921-6925 (`openModal` focus).
- Evidence:
  - The handler catches every `/^\d$/` key and every Backspace anywhere inside `#quickSheet` and sends them to `quickKey`. It does not check whether the target is a text field.
  - `openModal` focuses the first INPUT/SELECT/TEXTAREA it finds before anything else.
  - So a Note field in the sheet (Q5) would:
    - turn "Room 12" into amount digits,
    - delete amount digits when the user presses Backspace in the note,
    - get focus on every open, including the cold-start open at 15213, which raises the phone's keyboard over the keypad.
- Impact: The amount changes while the user types a note, and they may only notice after saving. Every launch also opens the system keyboard.
- Recommendation:
  - The Note chip opens its input on tap and is not in the sheet's initial DOM as an `<input>`. Alternatively, mark it so `openModal` skips it.
  - The keydown handler returns early when `e.target` is a text input or textarea.
  - Add flows: digits typed into the note stay in the note, and the amount is unchanged.
- Effort: S

**CODE-06: Debt payment mode cannot reuse the payment sheet, and the design's prefill overwrites the amount the user typed**

- Severity: High
- Location: `expense-pwa/index.html` 2811-2818 (`.modal-backdrop` z-index 40; only the picker, theme and confirm modals are at 60), 3956 / 3974 (`#editModal` is before `#quickSheet` in the DOM), 13023-13066 (`openDebtPaymentModal` sets the global `editCtx` and draws `mDate`/`mAmount`/`mAccount`), 13016-13021 (`debtPaymentPrefill`), 13053 (the helper sentence), 14744-14747 (date floor).
- Evidence:
  - Both modals have z-index 40 and `#quickSheet` comes later in the DOM, so a payment sheet opened from the quick sheet would paint underneath it.
  - The save is bound to `#editModal`'s fields and to `editCtx`.
  - Q8 pre-fills the next instalment when a debt chip is chosen. Q7's order is "amount, category, save", so the amount is typed before the chip and the prefill would overwrite it.
  - `saveEditDebtPayment` refuses a date before the borrow date, and `openDebtPaymentModal` defaults a future-dated debt to `d.date`. The sheet's fixed "Date · Today" would be refused for such a debt.
- Impact: A hidden sheet, a wrong amount written after a chip tap, or a refusal the user cannot explain. If the ink-home WORK-04(1) sentence ("already taken off Left to spend … Don't also add it as an expense") is missing from the sheet, the double count it guards against comes back.
- Recommendation:
  - Payment mode calls `recordDebtPayment` (CODE-02) and never opens `#editModal`.
  - Chips show live debts only (`!debtSettled(d) && debtOutstanding(d) > 0`) in `debtsByUrgency(todayISO())` order. That is the ruled order; do not use recency here.
  - The prefill applies only while the amount is empty.
  - The date floor and the `d.date` default carry over.
  - The helper sentence is shown in this mode, word for word.
  - Home's Pay (8068) and the bell (6738) stay on `openDebtPaymentModal` for this phase.
- Effort: M

### Medium

**CODE-07: The shortfall dialog's "Move" would lose the sheet's entry**

- Severity: Medium
- Location: `expense-pwa/index.html` 11589-11603 (`confirmSpend` with `offerMove`), 11833-11837 (`trAdd`'s return path).
- Evidence:
  - With `offerMove: true`, `confirmSpend` calls `navigate('accounts')` while the sheet is still open.
  - The return after the move checks `unmoney(expAmount.value) > 0`, which is the form, not the sheet.
  - The edit and payment sheets pass `offerMove: false` for this exact reason (E6, comment at 11453-11455).
- Impact: Accounts opens under the open sheet, and the "now tap Add Expense" return points at a form that holds nothing.
- Recommendation: The sheet always calls the writer with `offerMove: false`. The dialog then names the move in words, as the other sheets do. Add a flow: a short account over the sheet gives the dialog above the sheet, and Cancel leaves the amount, chip and account as they were.
- Effort: XS

**CODE-08: The sheet's date: "last used" would backdate entries, and a date held at open goes stale overnight**

- Severity: Medium
- Location: `expense-pwa/index.html` 15172-15181 (`ENTRY_DATE_IDS`, `refreshForNewDay`), 15194, 15213 (sheet opened at cold start).
- Evidence:
  - Q5 says "Date and account default to the last used".
  - The account default already exists as `lastUsedAccountId` (11619). A date default does not. Every entry date is reset to today on boot and moved forward by `refreshForNewDay`, which only touches the ids listed in `ENTRY_DATE_IDS`.
  - The sheet opens at launch and can be left open past midnight on a resumed PWA.
- Impact: A last-used date silently stamps today's spending with the date of an earlier back-dated entry, so it lands in the wrong month. A "Today" value captured at open goes stale overnight.
- Recommendation: The chip stores no date until the user picks one. "Today" is resolved with `todayISO()` inside the writer at save time. Account follows `lastUsedAccountId` for the mode's collection. Date is never last-used.
- Effort: XS

**CODE-09: The drawn geometry does not fit the phones the app supports, and no gate can detect it**

- Severity: Medium
- Location: `expense-pwa/index.html` 2334-2346 (full-screen rule, 64px keys); `tools/harness/run.mjs` 124 (the frame is a fixed 820px tall); `tools/harness/quick-entry.js` 58-69.
- Evidence: Rough sum for the sheet at 320×568 with 64px keys:

  | Part | px |
  |---|---|
  | Top offset | 96 |
  | Padding | 38 |
  | Grabber | 10 |
  | Segmented control | 44 |
  | Amount (56×1.2) | 67 |
  | Note line | 20 |
  | Category chips | 44 |
  | Meta chips | 44 |
  | Keys (4×64 + gaps) | 280 |
  | Save | 56 |
  | Gaps | about 70 |
  | **Total** | **about 770** |

  - That is about 200px more than a 568px screen. With 54px keys it is still about 730.
  - Every harness run lays out in an 820px-tall frame, so a sheet that scrolls Save off a 568px screen passes every gate.
  - The 36px chips and segments are under the standing 44px floor.
  - r14, r16 and r28 are not Ink tokens (Ink Plan WORK-20 refused r14/r16/r18).
- Impact: On small phones, Save is below the fold in the app's most-used flow.
- Recommendation:
  - Below 600px, keep the full-height sheet (top 0), and add the chips and Save inside it.
  - Keep 64px keys unless the architect rules otherwise.
  - Controls are 44px or taller, and radii use tokens.
  - Add a `--height` option to run.mjs, or a 568 frame for quick-entry, so "Save is visible without scrolling at 320×568" is asserted.
- Effort: S

**CODE-10: SMS paste in payment mode goes against the paste-a-loan ruling**

- Severity: Medium
- Location: `reports/chief-architect-paste-a-loan.md` R1, R8 and the off-limits list (lines 185, 192, 242-243); Q8.
- Evidence:
  - The ruling fences the parser to the debt form. It refuses "this parser learning any record other than a debt" and "a paste that submits the form". It keeps a required field as "deliberate friction".
  - A debt payment is a different record (`db.debtPayments`). The sheet's paste-amount-Save path would be the reflex path the ruling removed.
- Impact: It would reopen a standing ruling as a side effect, and put the free/paid line (product strategy's paid SMS capture) at risk.
- Recommendation: Keep SMS paste out of scope for this build. Bring it back only as its own proposal.
- Effort: XS (to leave out)

**CODE-11: The probes assert the hand-off, so they must be restated, not deleted**

- Severity: Medium
- Location:
  - `tools/harness/quick-entry.js` 6-12 (header), 58-86 (full screen, 64px keys, "never Save", labels), 363-390 (actions disabled at zero, Enter rules), 417-482 (hand-off flows), 331-337 (the "Not saved yet" toast text), 140 (slot named "Enter amount")
  - `tools/harness/navigation.js` 486-490 (`quickExpense` routes through `openExpenses('actual')`)
  - `tools/harness/signin.js` 95-135
  - `tools/harness/run.mjs` 92-98 (prelude depends on `#quickSheet` and `modalStack`)
- Evidence: Each of these encodes "nothing is written before Add". The prelude hides the launch sheet by removing `.show`, without closing it.
- Impact: Deleting them to turn the gate green would remove the only executable proof of the write rules on this path.
- Recommendation: Restate each one in the commit that changes its behaviour.
  - "Only Add writes" becomes "only Save writes".
  - Zero, no chip, or a split account writes nothing.
  - Save writes exactly one record with the typed amount, chosen category, account and today's date.
  - A stale write keeps the sheet's values (`stillHeld`).
  - A failed write shows `SAVE_FAILED_MSG`.
  - The shortfall dialog stacks above the sheet.
  - Payment mode writes to `db.debtPayments` and never to `db.actual`.
  - Keep the `#quickSheet`, `#quickKeys [data-qk]` and `#quickBtn` ids so run.mjs and signin.js keep working.
- Effort: M

**CODE-12: `openQuickEntry` resets only the digits**

- Severity: Medium
- Location: `expense-pwa/index.html` 7299-7304; `tools/harness/run.mjs` 96.
- Evidence:
  - `openQuickEntry` resets only `quickDigits = ''`.
  - The new state (mode, chip, debt, note, picked date, account) would survive from one open to the next.
  - The harness prelude and Back both close the sheet without going through any close handler.
- Impact: A reopened sheet could keep yesterday's Debt mode or chip, and the next three taps would save to the wrong collection or category.
- Recommendation:
  - Reset every field in `openQuickEntry`, not on close.
  - Mode opens on Expense every time.
  - Add a flow: open, choose Debt mode and a chip, close with Back, reopen, and expect Expense, no chip, ₮0.
- Effort: XS

### Low

**CODE-13: "Recent use" can be derived with no new storage key**

- Severity: Low
- Location: `expense-pwa/index.html` 11614-11622 (`lastUsedAccountId`, ruling C5: derived from push order, never stored).
- Evidence: Q4 needs an order. The C5 precedent already defines "recent" as push order in the collection.
- Impact: Without a written definition, someone may add a stored MRU list, which needs a validator and can outlive deleted categories. Someone else may sort `db.actual` by date on every open, at O(n log n), on the cold-start path.
- Recommendation:
  - Scan `db.actual` (or `db.income` for types) from the end and collect unique `categoryId`s that still exist in `db.categories`.
  - Stop when the chip row is full, then append the categories never used, in `db.categories` order, and finally "All…".
  - "All…" is a native `<select>` filled by `categoryOptions()` (8450). No new modal is needed, and it covers every category.
- Effort: XS

**CODE-14: Comments and names that state the old rule**

- Severity: Low
- Location: `expense-pwa/index.html` 3917-3925 (`#quickBtn` comment: "the arrow labels and the 'Not saved yet' toast"), 3968-3973 ("writes no record of its own … the only write path"), 3993-3997 ("NEVER 'SAVE' … refused permanently"), 7255-7257 and 7306-7312 (section header and `quickEntryTo` header), `aria-label="Enter amount"` / `#quickTitle`; `tools/harness/quick-entry.js` 8-12.
- Evidence: Under coding-standards (Comments), these comments are the design record. Once the sheet saves, each of them is false.
- Impact: The next reader trusts a comment saying the sheet cannot write.
- Recommendation:
  - Rewrite them in the same commits. Cite the 2026-10-20 owner decision and the new ruling.
  - Rename the control in one place, and update quick-entry.js:140 to match.
  - Keep `quickEntryTo` only as the split fallback from CODE-01. Otherwise remove it, together with the "Not saved yet" toast.
- Effort: XS

**CODE-15: `revealEntryDate`'s toast refers to a screen the user is not on**

- Severity: Low
- Location: `expense-pwa/index.html` 8494-8500, 6212-6234.
- Evidence: Saving from the sheet over Home with a back-dated chip would show "Actual expense added · showing Last Month". "Showing" refers to the Expenses filter, which is not on screen.
- Impact: The message is confusing. The duplicate-entry protection still works, because the filter is moved for the next visit.
- Recommendation: Keep the `revealEntryDate` call. Have the sheet's toast name the screen ("· Money shows Last Month").
- Effort: XS

## Review Areas

- **Correctness of money:** Amounts are whole tugrik from `quickAmount()` (7264), capped at 12 digits, with no NaN path. The risks are about where money goes (CODE-01, CODE-04, CODE-06, CODE-08), not arithmetic.
- **Data and persistence:** One guarded writer (`writeDb`, 5127) and a stale-write refusal already exist. The sheet needs no new storage key (CODE-13) and no migration. The risks are the post-await replacement check and the `commitWrite` rule (CODE-02).
- **Architecture:** The UI handlers are the write layer. This is the main structural problem (CODE-02). Z-order between modals is decided by DOM order (CODE-06).
- **Maintainability:** Current code is clean. The risks are copied handlers (CODE-02) and comments that become false (CODE-14).
- **Error handling:** `savedToast`/`stillHeld` cover save failure and stale writes. The sheet must reuse them through the writers and must refuse on missing fields, not skip silently (CODE-04).
- **Security:** Chip labels (category, income type and debt names, all free text, some loaded from the cloud) must go through `escapeHTML` or `textContent`. `check-escaping.mjs` gates `innerHTML` templates. Nothing is logged. No new dependency is needed.
- **Performance:** Clean if CODE-13's scan-from-end is used. Load debt chips lazily when Debt mode is chosen, not at boot.
- **Reliability and scalability:** At 10,000 transactions the recent-use scan stops early. The real reliability gap is the small-phone layout, which no gate checks (CODE-09).
- **Technical debt:** See below.

## Technical Debt

- Money rules live inside click handlers (CODE-02). Every new entry surface (Home Pay, the bell, future OCR or reports) pays for that again until the writers are extracted.
- `pushIncomeWithSplit` and `INCOME_FORM_AMOUNT` tie the split to form DOM by prefix (CODE-01). Separating "compute the split" from "read the split rows" is the debt to pay down.
- Z-order depends on DOM order at one z-index (CODE-06). A third stacked surface needs either an explicit z rule or a DOM move, and the debts ruling already relies on the current order.
- The harness has one frame height (CODE-09), so vertical fit is never tested.

## Future Risks

- Home's Pay and the bell will later be pointed at the sheet's payment mode (README §01.4). Without `recordDebtPayment`, that becomes a fourth payment save.
- Cloud Sync (long-term vision) replaces `db` across devices. A sheet save that does not use `commitWrite` would write over the replaced data.
- A paid SMS capture would arrive through the same sheet. CODE-10's boundary has to hold before that.
- If the language layer arrives, the mode labels "Save expense / Save income / Save payment" and the two binding sentences (CODE-03, CODE-06) are the hardest strings to translate.

## Recommended Refactoring

The smallest set of changes, in order. Each is its own commit with `npm test` green.

1. Extract `recordActualExpense`, `recordIncome(entry, split)` and `recordDebtPayment`, all through `commitWrite`. The existing handlers become callers, with no behaviour change (CODE-02, and the groundwork for CODE-06 and CODE-07).
2. Build the sheet below 600px as the full-height layout, with mode, chips and Save inside it. Reset all state on open. Isolate the Note field from the keypad handler (CODE-05, CODE-09, CODE-12).
3. Expense mode: no default chip, refuse without one, recent order derived from push order, `offerMove: false`, date resolved at save (CODE-04, CODE-07, CODE-08, CODE-13).
4. Income mode: the "is not income" sentence, and the hand-off fallback when a split applies (CODE-01, CODE-03).
5. Payment mode: live debts in `debtsByUrgency` order, prefill only while the amount is empty, the date floor, the helper sentence. No SMS paste (CODE-06, CODE-10).
6. Restate the probes and comments in the commits that change them (CODE-11, CODE-14, CODE-15).

Answers to the design request's questions:

1. **Write paths:** use the three extracted writers (refactoring step 1), not copies.
2. **Full screen or sheet:** full height below 600px with 64px keys unless ruled otherwise; the drawn 96px top does not fit 568px screens.
3. **Recent-use order:** push order from the end of the collection, deleted categories skipped, no storage key.
4. **Debt payment mode:** live debts only, the ruled urgency order, prefill only into an empty amount, the binding sentence shown, SMS paste out of scope.
5. **Income mode:** the "is not income" sentence is required, and a split account falls back to the Income form.
6. **Required fields and refusals:** amount and category or debt are required, each refused on its own control; the shortfall dialog appears without Move.
7. **The hand-off routes:** `quickEntryTo` survives only as the split fallback, "Not saved yet" goes, the WORK-01 comment is rewritten to cite the reversal, and quick-entry.js, navigation.js and signin.js are restated rather than relaxed.
