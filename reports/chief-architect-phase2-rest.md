# Chief Architect ruling: the rest of Accounts Phase 2

2026-10-09, on reports/proposal-accounts-phase2-rest.md (P1 to P5). The owner has approved building all five items, so the build itself is not reopened here. This report rules on the design of each. No Engineering Manager roadmap exists for this round. The proposal stands in its place, and its two open questions are ruled as conflicts below: P4 against the terms-only rule for the debt edit sheet, and P5 against the Debts scope sentence.

## Executive Decision

**Yes, and the work can proceed.** `main` holds CODE-02 with `sw.js` at v27 staged. Nothing in this batch blocks shipping what is already there.

All five items close real gaps:
- P1 closes a hole in a shipped rule.
- P2, P3 and P4 bring the last three money paths into the envelopes. Without them, an account balance can be wrong without anyone seeing it.
- P5 removes a naming clash that the app currently has to explain away in a helper line.

Two proposals are amended on correctness grounds:
- **P1.** A hard refusal is wrong for the user's own corrections. It would make the record keep money that never arrived.
- **P5.** "Left this period" reads wrongly under five of the eight range presets.

The batch ships as one deploy, once all five are green.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| P1 (amended, R1) | Deleting or editing an income can take an account below zero | It is the same hole CODE-02 closed for money moves. The amendment keeps the correction possible and refuses only the case that games the limit. |
| P2 (amended, R2) | Logging a planned expense into an account | Logged plans are a main way spending gets recorded, and today they skip the envelopes completely. Every account balance is wrong for every user who logs plans. |
| P3 (amended, R3) | Goal contributions paid from an account | Money set aside for a goal leaves an envelope in real life. Without this, the account overstates what can be spent. It reuses the debt-payment model, so nothing new is invented. |
| P4, option (a), amended (R4) | Borrowed money arriving into an account | The money lands somewhere. Without this, a loan makes an account look short or forces the user to record it as income, which is exactly what the Debts module exists to stop. |
| P5 (amended, R5) | Rename "Net Balance" on Home | This is the outstanding half of WORK-03. Now that accounts exist, two figures carry balance-sounding names and the app has to explain the difference. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| P1, "refused with no override" for delete, amount and date changes | Hard refusal of income corrections | Deleting an income or lowering its amount gives money to no account, so nobody can use it to get round the limit. It is the user correcting what happened. A refusal with no override forces the record to show money that never arrived. That is the same falsehood the owner's E5 ruling rejected when it kept "Record anyway". Replaced by R1. |
| P3, alternative | Goals tied to a "kept in" account, with contributions treated as moves | Rejected for the reasons the proposal gives. It changes what a goal means, makes goal progress depend on account balances, and duplicates an envelope the user already has. |
| P4, option (b) | "Received into" on the add form only, with no way to correct it | The only way to fix a wrong choice would be to delete the debt, which also deletes its payments. The comment on the debt edit sheet was written specifically against making a user destroy records to fix a typo. |
| P5, "Left this period" | Proposed label | The range preset directly above the label can read Last Month, Last Year, Last 30 Days, Last 90 Days or All Time. "This period" then contradicts the selector one line up. |
| P5, alternative "Net this period" | Shorter label | It keeps the jargon, as the proposal itself says. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| — | Nothing is deferred | — |

## Conflict Rulings

**C-A. P4 against the terms-only rule for the debt edit sheet. Ruled for option (a), with the rule amended by name.**
- The rule exists to stop the sheet growing into a place for status, conduct and history. "Received into" is none of those.
- The sheet already edits the amount and date at which the borrowed money arrives, because the principal and the date borrowed are terms. Under P4, both now move an account balance. The account is the third part of that same fact. Leaving it out would make two parts of one fact correctable and the third not.
- The comment at `openDebtEditModal` (`expense-pwa/index.html`, the "WHAT BELONGS HERE IS A RULE AND NOT A COUNT" block) is amended in the same commit. It must name exactly one exception: *the account the borrowed money arrived in, because the sheet already corrects the amount and date of that arrival.* It must also state that the rule otherwise stands, including "whatever else recommends it".
- No second exception may be added on this precedent.

**C-B. P5 against the ruled Debts scope sentence. The sentence changes, and its meaning does not.**
- The Round 17 ruling made the sentence a statement of scope: what the figure is part of, and where it does not appear. That scope is unchanged. Only the name of the place changes.
- The sentence quotes the new label exactly, so a reader can find it on Home. The `debts.js` assertion checks the quoted label, so if the label and the sentence ever drift apart, a test fails.

## Rulings

**R1. P1: income delete and income edit.**
1. **One test, built once.** Add a single helper that takes a change as a set of amounts per account and returns every account that would end below zero today. P1 and P4 both use it. Only amounts dated today or earlier count, as in `accountBalance`.
2. **A change that moves money to another account is refused, with no override.** This is the E7 and CODE-02 rule. It applies to changing an income's "Into account" when the old account would end below zero. Changing the account also re-points the split moves (E3), so the old account loses the amount minus what was moved out. The refusal names the account and what it has left. It says to change the account of the spending recorded against it, or to move money in, first.
3. **A change that only takes money away is warned about, then allowed.** This is the E5 and E6 shape. It applies to:
   - deleting the income;
   - lowering its amount;
   - moving its date past today. The split moves move with it under E3, so every split target loses too and must be included.

   The dialog names each account that would go short and by how much. It offers Cancel and a quiet "Delete anyway" or "Save anyway", with the account named, styled as "Record anyway" is (UI-05).
4. **One dialog per tap.** The income row delete already shows a confirm that counts the split moves. Fold the shortfall into that confirm and relabel its button. Do not show two dialogs one after the other.
5. Income dated in the future is not checked.
6. "Clear all Income entries" in Data Summary is left as it is. Accepted as proposed.
7. Add a probe for each branch: refused account change, warned delete, warned date move covering the split targets, and a clean delete. Each must be shown failing on the code before the fix.

**R2. P2: logging a plan into an account.**
1. `logPlannedAsActual` takes `accountId` in `edits` and writes it through `applyAccountId`. Without an account it writes nothing, so the record has no `accountId` field.
2. The "Custom amount" sheet (`openLogPlannedModal`) gets "Paid from" when at least one account exists. It starts on the last-used actual account, under the C5 rule (`lastUsedAccountId(db.actual)`).
3. The limit runs in `saveEditLogPlanned` before anything is written. It uses `spendShortfall` and `confirmSpend` without offering Move, as E6 requires, and it checks dates the same way the Add Expense form does.
4. **Amended for the bell.** With accounts present, the planned-expense row shows one button, "✓ Log ₮X", which opens the prefilled sheet. "Custom amount" is dropped in that state, because two buttons opening the same sheet is a choice that means nothing. With no accounts, both buttons and the one-tap write are byte-for-byte unchanged.
5. Plans still carry no account. The Phase 1 ruling stands.
6. Update the C8 note at `accounts` in `load()`: the logged-plan path is no longer one that stays without an account. Salary is still listed there.

**R3. P3: goal contributions.**
1. Contributions get an optional `accountId`. Each one:
   - is subtracted in `accountBalance`;
   - is counted in `accountUses`, and named in the refusal to delete an account;
   - is shape-checked in `contributionProblem`, as debt payments are;
   - is shown with its account in the goal's history.
2. "Paid from" appears on the contribution sheet only when an account exists. It starts on the account of the last contribution, under C5. A user who follows the helper therefore keeps getting "No account" by default.
3. The limit runs in `saveEditContribution` before anything is written. It uses `confirmSpend` without Move.
4. **The helper is reworded:** "The account the money leaves. If it stays in one of your accounts here, leave this on No account." The proposed wording said "savings account", and a user whose app account is named Savings could read that as an instruction to pick it.
5. The bell's "✓ Add ₮X" follows R2. With accounts, it opens the sheet prefilled with `recAmount` and the reminder's date, and "Custom amount" is dropped. A probe must show that saving the prefilled sheet unchanged writes exactly what the one-tap path writes today, including the advance of `recLastLogged`, plus the chosen `accountId`. With no accounts, nothing changes.
6. Goal progress does not read accounts.

**R4. P4: borrowed money arriving into an account.**
1. An optional `debts[].accountId`, labelled "Received into", appears on the add-debt form only when an account exists. It starts on "No account": a loan is not a routine entry, so there is no last-used default.
2. `accountBalance` adds the principal when `date` is today or earlier.
   - **No income total, no Dashboard figure and no Analytics figure reads it.**
   - A probe must show that the Home figure and every income sum are unchanged by a debt that has an account. This is the reason the Debts module exists.
3. The edit sheet takes "Received into" below the terms, under a divider, with a one-line helper saying it records where the money went and is not a term. The field shows when an account exists or when the debt already has `accountId`. Choosing "No account" deletes the field (C6). The code comment is amended as ruled in C-A.
4. **Edit-sheet changes follow R1.**
   - Changing "Received into" moves money to another account, so it is refused when the old account would end below zero.
   - Lowering the principal, or moving the date past today, is warned about and then allowed.
   - The existing cap on the date (earliest payment and the settled date) stays.
5. **Deleting a debt follows R1.** It is warned about, not refused. The net effect on each account counts the payments returned in the same delete. The existing confirm, which already counts the payments, carries the shortfall line and the relabelled button, as one dialog.
6. `accountUses` counts debts that have `accountId`, and `debtProblem` shape-checks the field (a non-empty string when present).
7. **No new line on the debt card.** The card and the totals card are heavily ruled. The edit sheet is where the field is seen and corrected.

**R5. P5: the Home label.**
1. Home's label becomes **"Left over"**. It is short, plain, and true under all eight presets. The selector directly above it already names the period.
2. Every sentence the user can see is updated to quote the label:
   - `index.html:3182`, the Accounts helper: "\"Left over\" on Home covers the period you pick…"
   - `:3307`, the add-debt helper: "…keeps it out of \"Left over\" on Home…"
   - `:9816` and `:9817`, the currency note: "\"Left over\" and Net Salary also show ≈…"
   - `:11088`, the Debts scope sentence: "…and it is not counted in \"Left over\" on Home."
3. `debts.js:2665` asserts the new quoted string. Search the whole harness for "Net Balance" before changing anything (the WORK-03 rule), and update every match in the same commit.
4. Code comments are left alone. The figure, its arrows and its calculation do not change. The commit message cites this ruling and the Round 17 classification of the sentence as a statement of scope.

**R6. Rules for every item.**
- Each item is its own branch and commit. That makes five commits, and none of them is combined with another.
- "No account" is never limited. A user with no accounts sees every form, sheet and bell row exactly as before, and a probe asserts this for P2, P3 and P4.
- Every new limit or refusal ships with a probe shown failing on the code before the fix (the CODE-02 precedent). Run `npm test` after each item.
- No migration and no `SCHEMA_VERSION` bump. All new fields are optional, following the `debts` precedent.

## Development Order

Confirmed: **P1, P2, P3, P4, P5.**
1. **P1** comes first. It closes a hole in a shipped rule, and it builds the shared shortfall helper that P4 uses.
2. **P2** next. It wires "Paid from" into the log sheet and sets the bell pattern for the case with accounts.
3. **P3** reuses the bell pattern from P2 unchanged.
4. **P4** depends on the R1 helper and amends a ruled comment, so it comes after the pattern is settled.
5. **P5** is copy only and touches a Debts ruling, so it goes last and in isolation, which makes it easy to revert.

There is one deploy at the end. `sw.js` is already at v27, so no further bump is needed unless v27 is deployed before this batch lands.

## Architecture Strategy

**What stays:**
- Balances are worked out from the records, never stored.
- Accounts are a view over records. No income, expense, Dashboard or Analytics total reads `accountId` or a debt's arrival.
- C5's last-used default is derived from the records.
- The tiers of the limit:
  - spending is warned, with a "Record anyway" or equivalent;
  - moving money is refused;
  - "No account" is free.

**What changes:**
- One stated rule now covers every write that touches an account. A change that moves money to another account is refused. A change that only takes money away is warned about and allowed.
- The debt edit sheet's rule gains exactly one named exception.

**Off limits:**
- Accounts on plans.
- Linking goals to accounts.
- Re-splitting an income after it is edited.
- Any limit on bulk resets from Data Summary.
- Any line about accounts on the debt card.
- Treating C-A as a precedent for more non-term fields on the debt edit sheet.

**Risks:**
- A stale v26 page keeps the new fields, because it copies these arrays whole, but leaves them out of its balances. That is the same transient exposure accepted in E9, and the v27 bump limits how long it lasts.
- Separate from this batch: the income edit helper tells users they can delete a move on the Accounts screen, but CODE-02 now refuses deleting a move whose money was spent. Not ruled here, because no reviewer raised it.

## Final Recommendation

Start P1 on its own branch. First build the shared helper that lists which accounts a change would leave below zero, with its probes shown failing on the current `main`. Then wire in the income account-change refusal and the warned delete and edit as ruled in R1.
