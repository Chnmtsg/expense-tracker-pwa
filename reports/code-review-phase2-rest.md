# Code Review: CODE-02 and P1–P5 (post-implementation)

Scope: CODE-02 plus P1–P5 on `main`, checked against reports/chief-architect-phase2-rest.md (R1–R6, C-A, C-B) and the CODE-02 section of reports/proposal-accounts-envelopes.md. I had Read/Grep/Glob only, so I reviewed the code as it stands now rather than the diff. I could not confirm the R6 "shown failing before the fix" requirement, because that needs git history.

## Executive Summary

The batch follows the rulings closely:
- One shared shortfall helper (`accountShortfalls` / `incomeEffect` / `effectChange`) drives both income and debt changes.
- The refuse-vs-warn split from R1 is applied the same way in both places.
- Future-dated amounts are excluded the same way everywhere.
- `debts.accountId` is read only by `accountBalance`, `accountUses`, the debt delete and the debt edit sheet. No income, Home or Analytics figure reads it.
- The new fields are optional and shape-checked on import.

**The biggest risk:** the new `await choiceDialog` in the income edit (and the older `confirmSpend` await in the expense edit) captures the record before the dialog opens. If another window writes while the dialog is open, `refreshFromStorage` replaces `db`. The edit is then written to a detached object, so nothing changes, and the user is still told "Updated". The sibling handlers that do re-check after the await use an identity test. That test treats any change from another window as a deletion and closes the sheet without a word.

## Overall Score

**80 / 100.** One contained High (a false success message on an edit made while a cross-window write lands mid-dialog) and two Mediums keep this below 90. The rulings themselves are implemented correctly and the probes cover each refuse and warn branch.

## Findings

### Critical

None.

### High

**CODE-01 — The income and expense edit sheets save to a detached record after a dialog, and still report "Updated"**

- **Severity:** High
- **Location:**
  - expense-pwa/index.html:13178 and 13182: `item` and `moves` are captured.
  - :13207–13208: `await choiceDialog` (new in P1).
  - :13210–13219: `moves` and `item` are changed.
  - :13223: `save()`.
  - :13303: `savedToast(okSave, 'Updated')`.
  - Same pattern in the expense branch: :13228, then the `await confirmSpend` at :13243, then the writes at :13250–13298. CODE-02's `startsCounting` widened when this await is reached.
- **Evidence:**
  - Any write from another window while the dialog is open fires the `storage` listener (:4693–4699). That calls `refreshFromStorage` (:4682–4688), which sets `db = load()`.
  - `load()` updates `lastSeenRaw` (:4149), so the stale-write guard in `writeDb` (:4616) no longer fires.
  - When the user taps "Save anyway" or "Record anyway", the handler changes the old `item`, which is no longer in `db`. `save()` then writes the fresh `db` unchanged and returns true.
  - Nothing re-checks the record after the await in either branch. Its siblings do: `saveEditLogPlanned` at :13114, `saveEditContribution` at :13143, `saveEditDebt` at :13004.
- **Impact:** A correction to an income or expense is silently lost while the toast says "Updated". This breaks the `savedToast` contract this file treats as non-negotiable (:4650–4653, :4701–4708). The user believes a money figure was corrected when it was not. Cross-window behaviour is a standing `npm test` gate, so this is in scope for release.
- **Recommendation:** After each await, look the record up again by id (`editCtx.id`, and the moves by `incomeId`). If it is gone, close the sheet and say so. If it still exists, recompute the shortfall on the fresh `db`, or re-run the save so the dialog is evaluated again. Add a cross-window probe that writes from a second window while the dialog is open.
- **Effort:** S

### Medium

**CODE-02 — After a dialog, the log-plan, contribution and debt-edit sheets treat any cross-window refresh as a deletion, and drop the save without a word**

- **Severity:** Medium
- **Location:**
  - expense-pwa/index.html:13114: `if (!db.planned.includes(p)) { closeEditModal(); return; }`
  - :13143: `if (!db.goals.includes(g)) { closeEditModal(); return; }`
  - :13004: `if (choice !== 'alt' || !db.debts.includes(d)) return;`
- **Evidence:**
  - `includes` tests object identity. After `refreshFromStorage` every record is a new object, so the test fails for any write from another window, not only when this record was deleted or logged elsewhere. The comment at :13112–13113 claims the narrower meaning.
  - In the first two cases the sheet closes, nothing is written, and no toast appears. The user tapped "Record anyway" and sees the sheet close, which reads as success.
  - In `saveEditDebt` the dialog closes and the sheet stays open with no explanation.
  - Related, with the same cause and possibly from before this batch (Phase 2 item 1a): `saveEditDebtPayment` pushes the payment after `await confirmSpend` (:13088–13089) with no re-check at all. If the debt is deleted in another window during the dialog, the result is the orphan payment its own comment says it prevents (:13056–13059). With an `accountId`, that orphan reduces an account balance and blocks deleting the account through `accountUses`, while appearing in no history.
- **Impact:** A logged bill or goal contribution is silently not recorded. A hidden orphan can skew an account balance.
- **Recommendation:** Re-check by id (`db.planned.find(x => x.id === editCtx.planId)`, and the same for goals and debts) and continue with the fresh record. When it is truly gone, close with a toast saying nothing was saved. Apply the same re-check to `saveEditDebtPayment`.
- **Effort:** S

**CODE-03 — The income edit's refusals send the user to a move delete that CODE-02 now refuses**

- **Severity:** Medium
- **Location:**
  - expense-pwa/index.html:13187: "Delete those moves on Accounts first".
  - :13188 and :13189: "delete its moves / that move on Accounts first".
  - :12738: the edit-sheet helper, "delete a move on the Accounts screen to undo it".
  - Against :10636–10638, where deleting a move is refused when the receiving account has spent the money.
- **Evidence:** A split move's money in its target account is routinely spent. In that case every instruction above leads to "Can't delete this move". The ruling names this under Risks ("Not ruled here, because no reviewer raised it"). This report raises it.
- **Impact:** The user hits a dead end with contradictory instructions while trying to correct an income. The only way out that works is to delete the income (now warned under R1) and enter it again, and nothing tells them that.
- **Recommendation:** Reword the three refusals and the helper so they name a path that works. For example, deleting the income is allowed with a warning, or point to the spending in the target account. This needs only a copy ruling, not new behaviour.
- **Effort:** XS (copy) once ruled

### Low

**CODE-04 — The money-move delete checks the refusal before its confirm, and duplicates the shared helper**

- **Severity:** Low
- **Location:** expense-pwa/index.html:10634–10641
- **Evidence:**
  - The no-override refusal is evaluated before `await confirmDialog`, and the delete happens afterwards by id on whatever `db` exists then. A cross-window spend from the receiving account during the confirm is not seen, so the E7/CODE-02 refusal can be bypassed.
  - The test `accountBalance(to) < amount` is a separate copy of what `accountShortfalls({[toId]: -amount})` computes. R1.1 asks for "one test, built once".
- **Impact:** A narrow cross-window window in a rule that is meant to have no override, plus a second copy of the shortfall rule that can drift from the first.
- **Recommendation:** Re-evaluate the refusal after the confirm, using `accountShortfalls`.
- **Effort:** XS

**CODE-05 — Comments that are no longer true after this batch**

- **Severity:** Low
- **Location:**
  - expense-pwa/index.html:10294–10297: the Accounts header lists what makes up a balance but leaves out goal contributions (subtracted) and borrowed money (added), both of which `accountBalance` now counts at :10306 and :10309.
  - :10428–10429: "Synchronous, so a spend that fits is saved in the same task…" now sits above the `accountShortfalls` block. It describes `spendShortfall` (:10461).
- **Evidence:** As quoted. coding-standards.md: "Comments in this project are the design record. Keep them true."
- **Impact:** These comments mislead the next reader about the rule for balances.
- **Recommendation:** Add both terms to the header, and move the comment back above `spendShortfall`.
- **Effort:** XS

**CODE-06 — Probe gaps against R4.4, R1.3 and R6**

- **Severity:** Low
- **Location:** tools/harness/accounts.js
  - `loanEditFlow` (:1072–1122)
  - `incomeShortFlow` (:893–955)
  - `logPlanFlow` (:958–1001)
- **Evidence:**
  - **R4.4:** the warning for a borrow date moved past today on the debt edit is not probed. Only a lowered principal is (:1096).
  - **R1.3:** a lowered income amount is not probed. A date move is (:925).
  - **R6:** for P2, "no accounts, sheet exactly as before" is asserted for the bell row (:994) but not for `openLogPlannedModal`; nothing checks that `#mAccount` is absent. P3 does assert this (:1064).
  - All dialog probes stub `choiceDialog`. Only `stackedCloseFlow` (:800) checks real stacking, and only for the expense sheet. The shared close path makes that acceptable.
  - No probe covers CODE-01 or CODE-02.
- **Impact:** These branches can regress without a failing gate.
- **Recommendation:** Add the three missing assertions, and a cross-window probe for the post-await re-check.
- **Effort:** S

## Review Areas

- **Correctness of money:** Clean.
  - Future dates are excluded the same way in `accountBalance` (:10301, :10309), `incomeEffect` (:10445), `arrival` (:12995), the debt delete (:11598–11600) and the move delete (:10635).
  - Refuse is used only when the account changes (:13201, :12997), and warn for less, later or "No account", as R1.2, R1.3 and R4.4 require.
  - One dialog per tap for the income and debt deletes (:6919–6922, :11603–11606).
- **R4 isolation:** Clean. `debts[].accountId` is read only at :10309, :10323, :11598, :11758 and :12994–12997.
- **Data and persistence:** Backward compatible.
  - Optional fields are shape-checked (:4953, :5034), no `SCHEMA_VERSION` bump, and the C8 note is updated (:4201–4205).
  - "No account" is the field's absence everywhere (`applyAccountId` at :5969, :12325, :13006, :13139).
  - Atomicity after dialog awaits is covered in CODE-01 and CODE-02.
- **Architecture:** Clean. One shared helper, the bell hands off to the owning sheet (:6116–6122, :6154–6159), and no UI-to-storage shortcuts were added.
- **Maintainability:** Two drifted comments (CODE-05) and one duplicated rule (CODE-04).
- **Error handling:** CODE-01 and CODE-02.
- **Security:** Clean.
  - Dialog text goes through `textContent` (:6440–6446) and `toast`.
  - New markup escapes account names (`accountOptions`, `accountMeta`).
- **Performance:** Clean. `accountShortfalls` calls `accountBalance` once per affected account, which is O(n) per call. Nothing quadratic was added.
- **C-A and C-B:** Done.
  - The exception comment names one exception and keeps "whatever else recommends it" (:11675–11681).
  - The label and every quoted sentence read "Left over" (:2625, :3182, :3307, :9855–9856, :11172).
  - debts.js:2665 asserts the new label.
  - Remaining "Net Balance" matches are in code comments only, which R5.4 says to leave alone.

## Technical Debt

- Every async save handler decides for itself whether to re-check after an await, and three different shapes now exist: none, an identity test, and an identity test plus return. A single "re-resolve by id after await" convention would remove the whole class of bug (CODE-01, CODE-02).
- The move-delete rule exists in two places (CODE-04).

## Future Risks

- Every new account-touching write path will add another await over the edit sheet. Without the convention above, each one reopens CODE-01.
- Bulk clears in Data Summary (debts, contributions) can take accounts below zero with no warning. This is accepted as off limits by ruling, but it is the next way balances will look wrong to users.
- Accepted in the ruling: a stale v26 page drops the new fields from its balance calculations until v27 is served.

## Recommended Refactoring

1. Add one small helper that looks up the record named by `editCtx` again after any await, and use it in `saveEditEntry`, `saveEditLogPlanned`, `saveEditContribution`, `saveEditDebt` and `saveEditDebtPayment`. This fixes CODE-01 and CODE-02. Back it with one cross-window probe (CODE-06).
2. Move the move-delete refusal onto `accountShortfalls` and evaluate it after the confirm (CODE-04).
3. Get a copy ruling on the income-edit dead-end instructions (CODE-03), and fix the two comments (CODE-05).

Files referenced: D:\3_Claude\PowerApps\expense-pwa\index.html, D:\3_Claude\PowerApps\tools\harness\accounts.js, D:\3_Claude\PowerApps\reports\chief-architect-phase2-rest.md, D:\3_Claude\PowerApps\reports\proposal-accounts-envelopes.md
