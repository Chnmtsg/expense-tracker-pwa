# Proposal: the rest of Accounts Phase 2

Written 2026-10-09. The owner said "continue, do these" about every item
still open after CODE-02 (v26 live, CODE-02 merged on `main`, `sw.js` at
v27, not deployed). That is approval to build them. What needs a ruling is
the design of each. Each item is a separate branch and commit.

Context that binds every item:

- Accounts are envelopes. Income is split by shares on arrival, and an
  account is a spending limit. Spending beyond the balance is stopped and
  offers a move; "Record anyway" is the quiet last resort (E5, E6). A money
  move beyond its source is refused with no override (E7). CODE-02 extended
  the limit to a redated expense, and refuses deleting a move whose money
  was spent.
- "No account" is always allowed and never limited, and with no accounts
  every form is exactly as before.
- The forms start on the last-used account, derived from the last record in
  the collection, not stored.

---

## P1. Deleting or editing an income can still take an account below zero

Found while building CODE-02, and the same hole. Deleting an income dated
today or earlier removes its amount from the account it arrived in, and its
split moves from the accounts they fed.

**Proposed:**
- **The income row delete** is refused, with no override, when any account
  it touches would go below zero. That means the account it arrived in, net
  of its split moves, and each split target. The refusal names the account
  and what is left, in the CODE-02 wording.
- **The income edit sheet**, for an income dated today or earlier, is
  refused the same way when lowering the amount, changing the account or
  moving the date into the future would leave its old account short.
- **The Data Summary "Clear all Income entries" stays as it is.** It is a
  bulk reset behind its own confirm, which already names the split moves.
  Refusing it would leave no way to start over.

## P2. Logging a planned expense into an account (Phase 2 item 4)

Today a logged plan writes an Actual with no account. That spending
bypasses the envelopes entirely.

**Proposed:**
- **The "Custom amount" log sheet** gets "Paid from" when an account
  exists. It starts on the last-used Actual account, and the limit dialog
  runs without the navigating Move, as in the edit sheet (E6).
- **The bell's one-tap "✓ Log ₮X", with accounts present,** opens that same
  sheet, prefilled, instead of logging blind. That costs one more tap, but
  the user sees which account pays, and nothing is charged to an account
  they did not pick. With no accounts, one-tap is unchanged.
- **Plans themselves still carry no account** (Phase 1 ruling stands).

## P3. Goal contributions (Phase 2 item 2)

**Proposed:** the debt-payment model from 1a.
- The contribution sheet gets "Paid from" when an account exists. The
  money leaves that account, counted in accountBalance like a debt payment,
  and passes the limit.
- The helper reads: "The account the money leaves. Leave it on No account
  if the money already sits in a savings account."
- The bell's one-tap "Add ₮X" for a recurring goal follows P2: with
  accounts, it opens the sheet prefilled.
- Contributions are shown with their account and counted in accountUses
  and contributionProblem, as debt payments are.

**Alternative considered and not recommended:** link a goal to a "kept in"
account and treat a contribution as a move into it. That makes goal
progress depend on account balances, changes what a goal means, and
duplicates the envelope the user already has.

## P4. Borrowed money arriving into an account (Phase 2 item 1b)

A loan's principal is real money that lands somewhere. It must never be
income, because the debts module exists to stop exactly that.

**Proposed:**
- An optional `debts[].accountId`, "Received into", on the add-debt form,
  shown only when an account exists. accountBalance adds the principal on
  the debt's date.
- **Correction path, which needs the ruling:** the debt edit sheet is ruled
  to hold only the contract's terms. Two options:
  - (a) **Recommended.** Add "Received into" to the edit sheet below the
    terms, under a divider, with a one-line helper saying it is where the
    money went and not a term. Where the principal went is a fact about the
    same act of borrowing, and the only other correction is deleting the
    debt, which cascades its payments.
  - (b) Add-form only, with no correction. A wrong account means deleting
    the debt and its payments.
- **Deleting a debt with an account,** dated today or earlier, follows P1.
  It is refused when the receiving account would go below zero; its
  payments come back to their accounts in the same delete, so they count.

## P5. "Net Balance" label on Home (the other half of WORK-03)

With accounts live, "Net Balance" on Home and "Total in accounts" on
Accounts are two different figures with two balance-sounding names. The
Accounts helper already has to explain the difference.

**Proposed:** rename the Home label to **"Left this period"**, and change
every user-facing sentence that names it, including the ruled Debts scope
sentence ("not counted in your Net Balance" becomes "not counted in what's
left this period"). The `debts.js` assertion is updated with it, and the
reason is recorded in the commit. Code comments are left as they are. The
figure, its arrows and its maths do not change.

Alternative: "Net this period". It is shorter but keeps the jargon.

---

## Order proposed

P1, P2, P3, P4, P5. P1 closes a hole in a shipped rule. P2 and P3 share
the one-tap pattern. P4 has the ruling question. P5 is copy only and
touches a Debts ruling, so it goes last.

One deploy at the end (v27 is already staged).
