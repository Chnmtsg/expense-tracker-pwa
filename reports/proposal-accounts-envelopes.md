# Proposal: Accounts as spending limits (envelopes)

Written 2026-10-09. The owner restated what accounts are for: *"when money
arrives we split it into several accounts, then track our expenses; if we
spend the account limit we can't buy anything new."* v25 is live with
accounts, money moves and "Paid from". Two things are missing:

1. **Split on arrival.** An income lands in one account today.
2. **The limit.** An expense can take an account below zero today; it is
   only shown red.

The owner has ruled both product questions (AskUserQuestion, 2026-10-09):

- **Limit rule:** stop, and offer to move money. "Record anyway" stays as a
  marked last resort, because the purchase may already have happened, and a
  record that refuses it would show money the user no longer has.
- **Split rule:** a fixed percentage per account, with a preview before
  saving. The amounts can be changed for that one payday.

What needs a ruling is the data model and the scope of the limit.

---

## A. Split on arrival

### Data

- `accounts[].share`: optional, a whole number 1–100, the percent of each
  income this account receives. Absent means no share. The sum across
  accounts must be at most 100, enforced at the form. Import checks only
  the shape: an integer from 1 to 100, and a sum of 100 or less.
- `transfers[].incomeId`: optional, the income entry that produced this
  move.

No migration; both fields are optional, following the `debts` precedent.

### Behaviour

The split is made of **ordinary money moves**. No new kind of record is
needed, and every balance rule already holds.

- On Add Income with "Into account" = X, when any OTHER account has a share,
  a checkbox appears, "Split by my shares", ticked by default. Under it is
  a preview: one money field per share account, prefilled with
  `floor(amount × share / 100)` and editable for this payday. X keeps the
  rest, and the preview says so: "Stays in X: ₮…".
- Saving writes the income into X, plus one transfer per non-zero row from X
  to that account. Each transfer is dated the income's date and carries
  `incomeId`, with the note "Split of income".
- If the edited rows add up to more than the income, the save is refused at
  the field.
- **Deleting the income deletes its split moves**, and the confirm says how
  many. Without this, X would be left paying out money that never arrived.
- **Editing the income later does not re-split.** The edit sheet says this
  in one line when the income has split moves, and the moves can be
  corrected one by one on the Accounts screen.
- X's own share, if it has one, is ignored for X: what stays is the
  remainder.

### Where shares are set

- The add-account form and the edit-account sheet get a field "Share of
  each income (%)".
- The Accounts screen shows one line: "Shares: 90% of each income · 10%
  stays where it arrives". It is hidden when no account has a share.

## B. The limit

**Scope: anything that takes money out of an account.**

- **Actual expense** (Add form, and the edit sheet when the amount or
  account changes): when `amount > balance(A)`, show a dialog with three
  actions:
  - **Move ₮short from another account** (primary). This saves nothing. It
    opens Accounts with Move money prefilled: To = A, Amount = shortfall,
    From = the account with the most money. The expense form keeps what
    was typed.
  - **Cancel.**
  - **Record anyway**, a quiet secondary link. It saves, and the account
    goes negative and red, as it does today.
- **Debt payment "Paid from"**: the same dialog. A repayment is spending.
- **Money move**: refused at the field when `amount > balance(From)`, with
  no override. Topping up Hobby by pushing Needs below zero would defeat
  the limit.
- **Split moves**: never limited. The income arrives in the same save.
- **"No account"** is never limited.

The balance checked is `accountBalance(A)` as of today. For an edit, the
entry's own previous amount is excluded first.

### Dialog

A third, link-style button `confirmAlt` is added to `#confirmModal`. It is
hidden by default and used only by a new `choiceDialog()`, which resolves
`'ok' | 'alt' | 'cancel'`. `confirmDialog()` and `alertDialog()` are
unchanged, and Escape still cancels.

## Out of scope

- Monthly refill or reset of envelopes.
- Limits on planned expenses.
- Borrowed money arriving (1b, ruling pending).
- Goal contributions.

## Risks

- **A user with no shares and no accounts sees nothing new.**
- **The limit changes the core Add Expense flow** for users with accounts.
  The dialog appears only when Paid from names an account AND the amount
  exceeds its balance. "No account" bypasses it entirely.
- **Stale v25 page:** both new fields are carried on existing records, and
  v25's load() keeps every field of accounts and transfers, because it
  copies the arrays whole. Nothing is lost on a round trip through v25.
  `sw.js` still needs a bump to v26 in the same release.

## Open after implementation

- **CODE-02 (needs a ruling):** deleting a money move takes money out of its
  receiving account, and editing a future-dated expense's date to today
  starts counting it. Neither passes through the limit. E5 as ruled does not
  cover them. Do they count as spending? See reports/review-envelopes.md.
