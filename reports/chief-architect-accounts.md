# Chief Architect ruling: Accounts (Phase 1)

2026-10-09, on reports/proposal-accounts.md.

## Ruling: APPROVED WITH CHANGES

The data model is right. Transfers sit in their own collection, so no income or expense total can count one unless code is written to include it. `accountId` is optional, and when it is absent the entry belongs to no account. There is no migration and no SCHEMA_VERSION bump, which follows the `debts` precedent in load(). Phase 1 scope is approved as written, and Phase 2 stays out of it. The screen goes under More: the tab bar is full, and someone who never creates an account sees the app unchanged.

## Required changes

- **C1. Register both collections everywhere the store is built.** Add them to LOAD_COLLECTIONS, to the fresh-database literal in load(), to importReplacement(), and to RECORD_COLLECTIONS.
- **C2. Validators in importProblem().**
  - Add both collections to optionalArrays and perRecord.
  - `accountProblem` checks the id, a name that is not blank once trimmed, and that `opening` is a finite number of 0 or more.
  - `transferProblem` checks the id, an ISO date, an amount that is finite and 0 or more, and that `fromId` and `toId` are both present and differ.
  - Both ends of a transfer must name an account in the same file. This is a deliberate departure from debtPayments, which does not check that its debt exists.
  - `entryProblem`: an `accountId` that is present must be a non-empty string. It is not checked against the accounts list, because an entry whose account no longer exists simply counts as "No account".
- **C3. Data Summary.** The accounts row gets `clear: null`, because clearing accounts would orphan the transfers. The transfers row can be cleared.
- **C4. Label the screen total "Total in accounts", never "Balance".** Add a line saying it counts only entries assigned to an account.
- **C5. Work out the last-used account from the records rather than storing it.** Use the newest income entry for the Income form and the newest actual expense for the Expense form. No settings key.
- **C6. Edit sheet.** Choosing "No account" deletes `accountId`. Every path that rebuilds a record carries `accountId` across.
- **C7. Refusals.**
  - Moving money refuses an amount of 0 or less, and refuses the same account at both ends.
  - Adding or editing an account refuses an empty name.
  - Import accepts amounts of 0 or more.
- **C8. Record the paths that stay without an account in Phase 1.** These are logging a planned expense as actual and both Salary writes into income. Note them beside the `accounts` field in load().

## Upheld

- Negative balances are shown, not refused.
- Deleting an account is refused while any entry or transfer still names it, and the message gives the count.
- No accounts are created automatically.
- Entries dated in the future are left out of balances.

## Accepted risk

A stale v24 page drops accounts and transfers the next time it saves. The cache-key bump must ship in the same release.

## Commit order

1. C1, C2 and C8, with probes.
2. The screen and balances: C3, C4 and C7.
3. The account selects on the forms and edit sheet: C5 and C6.

Run npm test after each step.
