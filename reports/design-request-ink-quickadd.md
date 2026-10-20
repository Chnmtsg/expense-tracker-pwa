# Design request: the Ink quick-add sheet (1a·02)

2026-10-20. Owner-requested while testing the unpublished Ink build locally:
"Quick add (bottom sheet) — first let's only add this one", with the drawing.
Source: the "Ink" handoff, README "02 Quick add (existing keypad sheet,
`#quickBtn`)" and screen 1a·02 with its notes. This document maps the design
to what it touches. It proposes; it does not decide.

## Owner decision (HANDOFF, 2026-10-20 latest)

The owner **reverses** the 2026-10-19 decision ("keep the full-screen keypad;
the sheet with chips and a direct Save is declined"). The Ink Plan ruling's
WORK-01 refused "Save" on the keypad *because it wrote nothing*; a sheet that
saves directly makes the label true. Everything else standing still applies:
the Debts binding condition, the 44px floor, AA contrast, escaping, the
save-outcome rule, revealEntryDate, the account shortfall checks, the income
"borrowed money is not income" correction, English only.

## What the design asks for (1a·02)

- Q1. Sheet from the top at 96px, surface, top radius 28, padding 10/20/28,
  grabber 40×5. "The centre + opens this sheet from any tab, with the keypad
  already up."
- Q2. Segmented control **Expense / Income / Debt payment**.
- Q3. Amount 56/600 centred with a teal caret; "the note or merchant below"
  (14, text-2).
- Q4. **Category chips** 36px pill, **ordered by recent use**, the selected one
  teal; last chip "All…" outlined (opens the full list).
- Q5. **Meta chips**: Date · Today, From · account, Note. "Date and account
  default to the last used and show as editable chips."
- Q6. Keypad 3×4, keys 54px r14 surface-2, digits 24; 1–9, 000, 0, ⌫.
- Q7. **Save** 56px r16 teal: "Save expense" / "Save income" / "Save payment".
  "A typical entry takes three taps: amount, category, save."
- Q8. **Debt payment** mode swaps the category chips for debt chips and
  pre-fills the next instalment. "Pasting a lender SMS fills in the amount."

## What it touches (current app)

| Part | Touches | Kind |
|---|---|---|
| Q1 sheet | `#quickSheet` (today a full-screen keypad on phones, owner rule 2026-10-19; quick-entry.js holds keys ≥64px, full screen, keys at the bottom) | Restructure |
| Q2/Q7 direct save | Today the keypad writes nothing: `quickEntryTo` hands the amount to the Add Income / Add Expense forms and toasts "Not saved yet". The form's Add is the only write path; quick-entry.js asserts nothing is written before Add. A direct save needs the same write paths: `expAdd` (account shortfall `confirmSpend`, `revealEntryDate`, `stillHeld`, `savedToast`), `incAdd` (`pushIncomeWithSplit`, split rows, the loan correction), the debt payment path (`openDebtPaymentModal` / its save, `debtPaymentPrefill`). | New write path |
| Q4 chips | Categories (`db.categories`, groups); "recent use" needs an order derived from `db.actual` (no stored key?); income types for Income mode. | New derived order |
| Q5 meta | Date (`expDate` today default), account (`fillAccountSelect`, last-used default), note. | Reuse |
| Q8 debt payment | `debtPaymentPrefill(d)`, `debtsByUrgency`, the payment save (and the Home statement "already counted, don't add as expense"). SMS paste: `paste-a-loan` exists for creating a debt (chief-architect-paste-a-loan.md). | Reuse / scope |
| Planned | Today Enter amount can also hand off to Planned? (it targets Actual and Income). | Check |
| Probes | quick-entry.js (full-screen, 64px keys, digits, "Not saved yet", nothing written before Add), navigation openExpensesFlow keypad route, accounts.js. | Restate |

## Questions the review should answer

1. **Write paths:** how the sheet saves without a second copy of `expAdd` /
   `incAdd` / the payment save (shortfall dialog, split, revealEntryDate,
   save-outcome, escaping).
2. **Full screen vs sheet:** the owner's phone rule was full screen with 64px
   keys; does the sheet keep that on phones, or follow the drawing?
3. **Recent-use order:** a definition from existing data, no new storage key.
4. **Debt payment mode:** which debts appear, the prefill, the binding
   condition, and whether SMS paste is in scope now.
5. **Income mode:** split rows and the loan correction.
6. **Required fields and refusals:** category, amount, account shortfall.
7. **What happens to the hand-off routes** (`quickEntryTo`, "Not saved yet",
   the Ink Plan WORK-01 comment) and which probes are restated.
