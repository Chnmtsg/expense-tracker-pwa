# UI Review: Accounts (Phase 1)

2026-10-09, branch accounts-phase1 (a6d4f02..6b05397). Score 78/100.

| ID | Severity | Finding | Fix |
|---|---|---|---|
| UI-01 | High | The add form ("Money in it now… from now on") and the edit sheet ("Starting balance… before the entries you assigned") define the starting amount differently, and the edit sheet can assign past entries, so money can be counted twice. | One label and one definition, with a line saying older entries are already inside it. |
| UI-02 | Medium | The helper says the total "can differ from the balance on Home" but leaves out the period filter, the main reason; Home's label is "Net Balance". | Name Net Balance and state the period/to-date difference. |
| UI-03 | Medium | The empty state leads with "Total in accounts ₮0" plus the Home-difference helper. | Hide the total and helper while there are no accounts. |
| UI-04 | Medium | "Account in use" gives one combined count and no way to find the entries. | Split by income, expenses and money moves, naming where each lives. |
| UI-05 | Low | The More menu promises moving money; with one account the card is hidden and nothing says why. | Show a hint with exactly one account. |
| UI-06 | Low | "⇄" is part of the Move Money button's accessible name. | aria-hidden on the glyph. |

Strengths: 44px row actions with named labels, rows that wrap at 320px, a
one-column form at 320px, and negative balances carrying a sign as well as
colour.
