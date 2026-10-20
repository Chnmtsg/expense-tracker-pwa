# Design request: the Debts screen (1a·05), the debt detail (1a·06), and one payment record

2026-10-20. Owner-requested after v37 went live (live code: branch `live-v35`,
worktree `D:/3_Claude/PowerApps-live`, `sw.js` v37). This targets the **live**
code, not the unpublished `ink` branch. This document maps the request to
what it touches. It proposes; it does not decide.

The owner's words: "Now let's work on Debts, in the debt window it looks so
many text. I'd like to do this [1a·05] and when we set the schedule it looks
like this [1a·06] and it connected into expenses. When we set the money and
schedule in debts it connect to debts and write their in our debts. If we do
this we don't write two times our debt."

Pictures: `reports/design-debts-1a05.png` (Debts) and
`reports/design-debts-1a06.png` (Debt detail). They are the Ink handoff's
screens 1a·05 and 1a·06.

## Owner decisions (asked 2026-10-20, answered)

1. **Pay once, shows in both.** Tapping Pay in a debt saves one record. It
   also appears in Expenses as a "Loan payment · {debt name}" row and counts
   in the spending totals. Deleting it in one place removes it from both.
   This **reverses** the standing rule at `saveEditDebtPayment` ("It
   deliberately does NOT create an expense ... If the user also wants the
   payment in their spending, they log it as an expense themselves, once"),
   because that rule is exactly what makes the owner write a payment twice.
2. **Paid / Next marks on the schedule, like the picture.** Payments fill
   the instalments in date order; an instalment is Paid once the payments
   add up to it; the first unpaid one is Next; a part-paid instalment says
   how much is left. This **reverses** the Ink Debts ruling's WORK-01 ("no
   paid/missed/behind/on-track state on any instalment, anywhere") for this
   screen.

Everything else standing still applies: the 44px floor, AA contrast in all
16 themes, escaping, the save-outcome rule, the account shortfall checks,
English UI only (user text such as debt names may be any script), lint at
17 warnings, `npm test` green.

## What the design asks for

### 1a·05 Debts
- D1. Header "Debts" with a "+ Add loan" pill on the right.
- D2. "Still owed" label, then the total owed large (hero size).
- D3. One progress bar (paid back over total to repay), then a line:
  "₮4,060,000 paid back" left, "Cost so far ₮948,462" right (the cost in
  coral).
- D4. One row per live debt: a ring with % repaid; the name (ellipsised);
  under it the state, coloured: "Overdue 18 days" (coral), "Due 1 Nov · in
  13 days" (amber), "Due 15 Nov" (muted), "No schedule" (muted); on the
  right the amount still owed and "30% / yr" (the yearly cost figure).
- D5. "1 paid off · show": settled debts collapsed under the list.
- D6. **No explanation paragraphs** on the screen (today: the "Still owed
  includes ..." and "The figure above is ..." helpers, the "Record borrowed
  money" disclosure with its form, the per-card helper "Add the date this has
  to be repaid by ...", chips, and five action buttons per card).

### 1a·06 Debt detail
- E1. Back "‹" and "Edit" at the top; the name; "Borrowed ₮1,500,000 on 15
  Jun 2026".
- E2. "The true cost" card: "Costs you as much as a loan charging 81% a
  year", the figure in coral; under it "A bank loan is typically 18–24%. Why
  this matters ›".
- E3. Two tiles: "Still owed ₮1,700,000" and "Last payment Jun 2027".
- E4. "Schedule": one row per instalment, date, state (Paid in teal, Next
  in amber, none for later), amount; paid rows muted with a filled square,
  Next with an amber outline, later ones an empty square.
- E5. Bottom bar: "Settle early" and "Pay ₮170,000" (the next instalment).

### The connection (owner decision 1)
- F1. One write: Pay records the payment once; Expenses shows it as a row
  and its totals (and Insights, Home's spending figures?) include it.
- F2. One delete: removing it from either place removes the one record.
- F3. No second copy: an expense the user already typed for a loan payment
  is not changed (no migration of existing data), but the app should stop
  telling users to type one.

## What it touches (live code)

| Part | Touches | Kind |
|---|---|---|
| D1–D6 | `#debts` section (~line 3389), `renderDebts` (~11675), the add form inside the disclosure, the card actions (+ Payment, 📜 history, ✓ settle, ✎ edit, ✕ delete) | Restructure |
| D4 yearly cost | the existing contract cost derivations (the "costs as much as a loan charging" figure, `debtInterestPaid` and its neighbour); "No schedule" debts | Reuse |
| E1–E5 | there is no detail screen in live; `ink` has `#debtDetailModal` / `openDebtDetail` (Ink Debts ruling) that could be ported | New screen (port?) |
| E4 schedule | the schedule record (`schedule: { instalment, count, firstDue }`), the ink step that lists "one bounded list of a schedule's dates" | Reuse / port |
| E5 Pay | `openDebtPaymentModal` / `saveEditDebtPayment`, the payment prefill, settle (`settledOn`) | Reuse |
| F1 | `renderExpenses`, expense totals, Insights category totals, Home figures ("Left over"), account balances (debt payments already leave the account) — the risk is counting a payment twice in any total | Data rule |
| F2 | delete paths for expenses and for debt payments (`debtPayDel`), the debt delete cascade | Data rule |
| Probes | `tools/harness/debts.js` (debts, debts390), crosswindow, accounts, navigation | Restate |

## Questions the review should answer

1. **F1 data model:** a derived Expenses row from `db.debtPayments` (one
   record) or a linked expense record (two records)? Which totals include
   it, under what category ("Loan payment"?), and how is double counting
   avoided in account balances, Home, Insights, budgets and exports?
2. **Edit and delete from Expenses:** what ✎ and ✕ on a loan-payment row do.
3. **Paid / Next derivation:** the allocation rule (date order, partial,
   overpayment, payments before the first due date, settled debts), as one
   pure function; what replaces WORK-01's protection.
4. **Port or rebuild:** how much of the `ink` branch's Debts work (rows,
   detail modal, schedule list) can be brought to live without the rest of
   Ink (tab bar, Home, Money).
5. **Where the removed text goes:** which facts must survive (E2's "Why
   this matters ›", the cost caveat) and where.
6. **Smallest safe order** of steps, each shippable, given this goes live.
