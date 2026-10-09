# Proposal: Accounts

Written 2026-10-09. Requested by the owner: "add multiple bank accounts, like
debt account, savings account, needs account, hobby account". The owner chose
**real accounts, named by purpose** over budget jars: an account holds money
and has a balance; income goes in, expenses come out, money moves between
accounts. A user may name them by purpose (Needs, Savings, Debt payoff, Hobby)
or by bank (Khan, Golomt, Cash). Both read the same to the app.

This is a new collection and a new screen, so it needs a ruling before code.

---

## Why it belongs in the free tier

It is recording (product-strategy.md, free list). Its strongest use is the
mission's: a separate "Debt payoff" account whose balance shows whether the
next repayment is covered, before the due date rather than on it.

---

## Data model — Phase 1

Two new collections, both optional, both `|| []` in load(). NO MIGRATION and
no SCHEMA_VERSION bump, on the precedent written at `debts` in load(): nothing
existing is transformed.

```
accounts:  { id, name, opening }            // opening: whole ₮, >= 0, default 0
transfers: { id, date, amount, fromId, toId, notes }
```

One optional field on two existing collections:

```
income[].accountId   // the account it arrived in
actual[].accountId   // the account it was paid from
```

Absent means "no account". Every existing record is valid unchanged, and every
existing total (Dashboard, Analytics, Budget) is untouched, because none of
them read the new field. Accounts are a VIEW over records that already exist,
plus transfers, which are deliberately a separate collection so no income or
expense reduce can ever count a transfer (the same inversion argued at `debts`).

Balance of an account, as of today:

```
opening
+ Σ income   where accountId = a.id and date <= today
− Σ actual   where accountId = a.id and date <= today
+ Σ transfers where toId   = a.id and date <= today
− Σ transfers where fromId = a.id and date <= today
```

A negative balance is shown, not refused: the user's record is the truth about
what happened, and an overdrawn purpose account is exactly what they need to see.

## UI — Phase 1

- **Accounts screen**, reached from the More menu (the tab bar is full).
  Total at the top, one row per account with its balance, "Add account"
  (name + starting balance), "Move money" (from, to, amount, date, notes),
  and the transfer list. Edit renames / changes the starting balance.
- **Delete** an account: refused while any income, expense or transfer names
  it, with the count stated. No orphan ids, no cascade that silently strips
  history (the goals/debts rule).
- **Income and expense forms**: one select, "Into account" / "Paid from",
  shown ONLY when at least one account exists, with "No account" as an option
  and the last-used account preselected. A user who never creates an account
  sees the app exactly as today.
- Edit sheet for an income/expense entry gets the same select.
- Import validates `accounts` and `transfers` (ids unique, amounts finite and
  >= 0, transfer ends name existing accounts and differ). Data Summary lists
  both; Reset clears both; RECORD_COLLECTIONS includes both.

## Phase 2 (not in this change, recorded so it is not lost)

1. Debt payments taken from an account; borrowed money arriving into one.
   - **1a, debt payments: BUILT 2026-10-09.** Optional `accountId` on
     debtPayments, a "Paid from" select on the payment sheet (only once an
     account exists, starting on the last payment's account), the account
     named in the payment history, subtracted in accountBalance, counted in
     the delete refusal, shape-checked in contributionProblem. Payments have
     no edit path, so a wrong account is corrected the existing way: delete
     and re-add. Deleting a debt cascades its payments, so the account's
     balance moves back with them — the delete confirm already names the
     payments it removes.
   - **1b, borrowed money arriving: NEEDS A RULING.** The debt edit sheet is
     ruled to hold only the contract's terms ("a field that is not a term the
     user stated does not belong here"). A "Received into" account on the add
     form with no correction path, or a correction field in that sheet, both
     touch that ruling.
2. Goal contributions moving money into a savings account.
3. Payday split: share a salary across accounts by stored percentages.
4. Planned expenses logged as actual inherit a default account.

Each is a separate item. Phase 1 is complete without any of them.

## Risks

- Overlap with Needs/Wants/Savings category groups: groups classify spending,
  accounts hold money. Different questions; the copy must not use "Needs" as a
  default account name for that reason — no accounts are seeded.
- Older build reading a newer store: load() builds the database from a named
  field list, so a v24 page (e.g. a stale service-worker copy) would drop
  `accounts` and `transfers` on its next save. `accountId` on records survives.
  Same exposure `debts` had when it shipped; the cache-key bump on deploy is
  the mitigation, and nothing else is lost.
- Cloud sync is disabled (empty firebaseConfig); RECORD_COLLECTIONS is updated
  anyway so WORK-24 does not inherit a gap.
