# Engineering Manager: Debts 1a·05, Debt detail 1a·06, one payment record in Debts and Expenses

Sources, both read in full and left unmodified:
- D:/3_Claude/PowerApps-live/reports/ui-review-debts-1a05.md (UI-01 to UI-24, score 48)
- D:/3_Claude/PowerApps-live/reports/code-review-debts-1a05.md (CODE-01 to CODE-16, score 58)

Conventions: D:/3_Claude/PowerApps-live/knowledge/review-conventions.md.

## Project Health

The existing live Debts code is sound. Code Review puts it in the mid-80s on its own. The proposed change is not releasable as it stands. UI Review scored it 48 and Code Review scored it 58. Between them they raised two Critical findings and ten High findings. Both Criticals are about the "one payment record" connection (F1), and both produce wrong spending figures. CODE-01 says principal is counted twice for as long as a loan runs. UI-01 says payments users already logged by hand are counted twice as soon as they upgrade. No F1 code should be written until the Chief Architect and the owner have ruled on these. The screen-level work (rows, detail, copy) is mostly XS or S, much of it can be ported from ink, and none of it needs a redesign.

## Priority Matrix

Severity is copied from each reviewer. Where two sources disagree, both values are shown. Priority follows the higher severity.

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Ruling: how F1 counts a repayment, given that full counting counts principal twice; then restate module header, saveEditDebtPayment comment and project.md rationale | CODE-01 | Critical | P0 | S (XS ruling, S restatement) | none |
| WORK-02 | No past period's spending total may change on upgrade; payments users already logged as expenses must not be counted again | UI-01 | Critical | P0 | M | WORK-01, WORK-03 |
| WORK-03 | F1 data model: one spending accessor (`db.actual` plus projected payments) switched in at every read site in one commit; `accountBalance` never reads it; category in-use check counts payments | CODE-02 | High | P1 | M | WORK-01 |
| WORK-04 | One derived Paid/Next/Overdue rule (`debtInstalmentStates`) read by the row, the detail, the Pay prefill and the bell; Overdue state for an unpaid past instalment; "Next · ₮X left" for part-paid | UI-02, CODE-04 | High (UI-02), High (CODE-04) | P1 | M | WORK-05; ruling on whether a past Next makes the debt Overdue |
| WORK-05 | Bounded schedule walk `debtScheduleOccurrences`, ported from ink as its own commit | CODE-13 | Low | P1 (blocks WORK-04, WORK-18) | XS | none |
| WORK-06 | Port the debt detail (`#debtDetailModal`, `openDebtDetail`, `renderDebtDetail`) with refresh after every write and close-when-gone; do not port ink's `mDebtPayHome` | CODE-10 | Medium | P1 (blocks WORK-07, WORK-08 and the detail items) | M | none |
| WORK-07 | The detail keeps every fact the card carried: the "Still owed includes what you agreed to pay on top" sentence (one line under the hero as well), the cost caveat, the overpaid and settled-short lines; port `debtCardParts` and `debtRelationshipSentenceHTML` | UI-03, CODE-07 (relationship sentence and reconciliation lines) | High (UI-03), Medium (CODE-07) | P1 | S | WORK-06 |
| WORK-08 | "Payments · N recorded ›" row in the detail that opens `openDebtHistoryModal` unchanged | UI-05, CODE-07 (history sheet) | High (UI-05), Medium (CODE-07) | P1 | S | WORK-06 |
| WORK-09 | Leave the bare "% / yr" off rows until it is ruled on; if kept, one measure on every row, with a word, omitted at zero | UI-04, CODE-08 (row tag) | High (UI-04), Medium (CODE-08) | P1 | S | ruling on the row tag |
| WORK-10 | Loan-payment rows in Expenses: own data attributes, shared `deleteDebtPayment(id)` used by the history sheet and Expenses, honest ✕ confirmation, defined ✎ route; no false "Expense deleted" success | UI-06, CODE-03 | High (UI-06), High (CODE-03) | P1 | M (S under CODE-03's ✎ position) | WORK-03, WORK-06, Conflict C2 |
| WORK-11 | Restate every comment and screen string made false by F1 or Paid marks (11335–11338, 13750–13753, 6101–6104, 12384, 11801, 3512) in the commit that makes it false | UI-07, CODE-12 | High (UI-07), Medium (CODE-12) | P1 | XS | WORK-03 (F1 strings), WORK-04 (12384) |
| WORK-12 | Harness: restate card flows against row and detail rather than deleting them; split Condition 4 / WORK-164 into a kept negative and a new positive invariant; new flows for F2 delete, allocation edges, detail Back, crosswindow | CODE-05 | High | P1 | M (spread across sprints) | WORK-01; lands with each structural commit |
| WORK-13 | Debt delete moves into the Edit sheet via an extracted `deleteDebt(id)`; confirmation adds "They are also removed from your spending." | UI-08, CODE-07 (delete) | Medium (UI-08), Medium (CODE-07) | P2 | S | WORK-06; clause only once WORK-03 ships |
| WORK-14 | Coral for overdue only; cost figures in text colour; row states use existing `deadline-danger` / `deadline-warning` classes | UI-09, CODE-08 (colour tokens) | Medium (UI-09), Medium (CODE-08) | P2 | XS | none |
| WORK-15 | Row labels "repaid" under the ring and "still owed" under the amount, both in the row button's accessible name | UI-10 | Medium | P2 | XS | none |
| WORK-16 | "Last payment" becomes "Final instalment", shown beside `dueDate` and never in place of it | UI-11, CODE-15 (E3) | Medium (UI-11), Low (CODE-15) | P2 | XS | WORK-06 |
| WORK-17 | Schedule markers use a non-control glyph (dot or ✓), at 3:1 contrast | UI-12 | Medium | P2 | XS | WORK-04 |
| WORK-18 | Fold Paid rows into "N paid · show" (existing `.more-fields`) so Next stays in view on long schedules | UI-13 | Medium | P2 | S | WORK-04, WORK-05 |
| WORK-19 | Pay opens the existing payment sheet, prefilled with min(remaining on Next, still owed), never writes on tap; the write moves onto `commitWrite` | UI-14, CODE-09 | Medium (UI-14), Medium (CODE-09) | P2 | S | WORK-04, WORK-06 |
| WORK-20 | "Mark settled" in place of "Settle early"; a settled debt's detail shows "Settled on {date} · Change" (visible undo) | UI-15, CODE-15 (E5), CODE-07 (settle and undo) | Medium (UI-15), Low (CODE-15), Medium (CODE-07) | P2 | XS | WORK-06 |
| WORK-21 | Ruled rate sentence word for word in the detail, including "on what you still owe", via extracted `debtRateLineHTML`; the bank benchmark and "Why this matters ›" are not built | UI-16, CODE-08 (E2 copy) | Medium (UI-16), Medium (CODE-08) | P2 | S | WORK-06 |
| WORK-22 | One add entry point and one word for it; Income and Quick add links open that surface; schedule fields at add time (scope disputed) | UI-17, CODE-16 | Medium (UI-17), Low (CODE-16) | P2 | S, or M if schedule-at-add is in scope | Conflicts C4, C5 |
| WORK-23 | Loan-payment rows in Expenses and category views get their own title ("Loan payment · {debt}") and a named slice, never "Unknown ?" | UI-18, CODE-02 (category part) | Medium (UI-18), High (CODE-02) | P2 | S | WORK-03, Conflict C3 |
| WORK-24 | Keep the live 44px "Cleared (N)" disclosure, restyled only; not "1 paid off · show" | UI-19, CODE-15 (D5) | Medium (UI-19), Low (CODE-15) | P2 | XS | none |
| WORK-25 | Empty and edge states: no debts, all settled, no schedule ("No agreed schedule · Add one"), settled detail | UI-20 | Medium | P2 | S | WORK-06 |
| WORK-26 | Hero bar = totalPaid / (totalPaid + totalOutstanding) so it reaches 100% after a settle-short; add a settled-short debt to the condition 9 fixture | CODE-06 | Medium | P2 | XS | none |
| WORK-27 | Orphan imported payments (debt missing) still count in the accessor, labelled "Loan payment" with no name; add a flow for it | CODE-11 | Medium | P2 | XS | WORK-03 |
| WORK-28 | Hero uses `--t-hero`, measured at 320px with a nine-digit total | UI-21 | Low | P3 | XS | none |
| WORK-29 | One date format for the same payment in Debts and Expenses | UI-22 | Low | P3 | S | WORK-03 |
| WORK-30 | Port the screen body only; keep the live header and More → Debts; no tab bar or FAB | UI-23 | Low | P3 | XS | none |
| WORK-31 | Allow two lines for a debt name before the ellipsis | UI-24 | Low | P3 | XS | none |
| WORK-32 | One per-render debt-id → paid Map passed into the derived functions, with no change to what they compute | CODE-14 | Low | P3 | S | none |

Coverage check: all of UI-01 to UI-24 and CODE-01 to CODE-16 appear above. CODE-07, CODE-08 and CODE-15 each cover several distinct problems, so each is split by part across more than one item. The split is noted in the Source IDs column. CODE-02 is absorbed fully into WORK-03, and its category recommendation is also listed under WORK-23.

## Quick Wins

These are XS or S items that remove Medium or higher severity. Do them first inside their priority band.

- P0: WORK-01 (S). The ruling itself is XS. Everything F1-related waits on it.
- P1: WORK-11 (XS), WORK-07 (S), WORK-08 (S), WORK-09 (S).
- P2: WORK-14, WORK-15, WORK-16, WORK-17, WORK-20, WORK-24, WORK-26, WORK-27 (all XS). WORK-13, WORK-18, WORK-19, WORK-21, WORK-23, WORK-25 (all S).

None of these was promoted because it is cheap. Their priorities follow from severity and dependency alone.

## Sprint Plan

The next sprint is Sprint 1, sized for one developer at about 4 to 5 days of build effort. It deliberately ships no F1 code.

- Items: WORK-01, WORK-05, WORK-06, WORK-07, WORK-08, WORK-16, WORK-20, WORK-21, WORK-26, plus the WORK-12 flows for the detail (Back, refresh, close-when-gone, crosswindow).
- Estimated build effort: WORK-05 XS, WORK-06 M, WORK-07 S, WORK-08 S, WORK-16 XS, WORK-20 XS, WORK-21 S, WORK-26 XS, harness part about S. That comes to roughly 4 to 5 days. WORK-01 is Chief Architect and owner time, not build time.
- Delivers:
  - Recorded rulings on how F1 counts payments, using the worked numbers from CODE-01 and the upgrade case from UI-01.
  - A ruling on whether a past unpaid instalment makes a debt Overdue.
  - A ruling on the row rate tag.
  - A live debt detail opened from the existing card. It carries every card fact, the ruled rate sentence, a Payments row, "Final instalment", "Mark settled" with a visible settled state, and a hero bar that reaches 100%.
  - No spending figure changes. `npm test` stays green.

If the rulings are not recorded by the end of Sprint 1, Sprint 2 below cannot start. In that case, swap Sprint 2 and Sprint 3.

## Roadmap

- Sprint 1: WORK-01, WORK-05, WORK-06, WORK-07, WORK-08, WORK-16, WORK-20, WORK-21, WORK-26, WORK-12 (part)
- Sprint 2 (F1, only as ruled): WORK-02, WORK-03, WORK-10, WORK-11 (part: F1 strings), WORK-23, WORK-27, WORK-12 (part: Condition 4 split and positive invariant)
- Sprint 3 (rows replace cards, allocation): WORK-04, WORK-09, WORK-13, WORK-14, WORK-15, WORK-17, WORK-18, WORK-19, WORK-24, WORK-25, WORK-28, WORK-30, WORK-31, WORK-11 (part: 12384, 6126–6131), WORK-12 (part: card anchors restated)
- Later: WORK-22, WORK-29, WORK-32

WORK-22 goes to Later because its scope is disputed (C4). If the scope is ruled narrow (one entry point and one word, S), it can join Sprint 3.

## Dependencies

- WORK-01 comes before WORK-02, WORK-03, WORK-10, WORK-11 (F1 part), WORK-12 (positive invariant), WORK-23 and WORK-27. Both reviewers say the counting rule must be decided before F1 code. The positive harness invariant cannot be written until the rule is known.
- WORK-03 comes before WORK-02, WORK-10, WORK-23, WORK-27 and WORK-29. The upgrade rule, the loan-row actions, the row labels and the orphan rule are all built on the accessor. Every read site must switch in one commit, or Expenses, Home and Analytics will disagree (CODE-02).
- WORK-05 comes before WORK-04 and WORK-18. CODE-04 builds the allocation on one bounded walk. Without it, the schedule list costs count² `stepDate` calls (CODE-13). This is why a Low finding is placed at P1.
- WORK-04 comes before WORK-17, WORK-18 and WORK-19, and before the 12384 / 6126–6131 copy in WORK-11. The markers, the fold, the Pay prefill and the bell all read the one allocation function. The bell's floor-at-today rule changes in the same commit if the ruling makes a past Next Overdue.
- WORK-06 comes before WORK-07, WORK-08, WORK-13, WORK-16, WORK-19, WORK-20, WORK-21 and WORK-25. These all live in the detail. Under CODE-03's position, WORK-10's ✎ also opens the detail. This is why a Medium finding is placed at P1.
- WORK-13's added clause ("also removed from your spending") is only true once WORK-03 ships. Moving delete into the Edit sheet must happen no later than the card ✕ disappearing (Sprint 3).
- WORK-11 is not a standalone task. Each string ships in the same commit as the behaviour that makes it false.
- WORK-12 lands in pieces with each structural commit. Flows are restated, never deleted. The stock-invariance, condition 9 reconciliation, cascade and cap guards must survive.
- WORK-14 implements the design's "coral" through the existing `deadline-danger` / `deadline-warning` classes, so all 16 themes keep contrast (CODE-08).

## Conflicts

For the Chief Architect. No winner is picked here.

**C1. What F1 counts, and whether past payments are included (UI-01 vs CODE-01 / CODE-02)**

- UI-01's position:
  - The danger is users who already logged loan repayments as expenses by hand, as live told them to.
  - The smallest safe shape is that only payments recorded after this release count as spending. Earlier payments stay Debts-only.
  - Bringing older payments in must be a one-time explicit choice that names the count and amount.
  - UI-01 leaves the data mechanism to Code Review. It does not object to counting the full payment going forward.
- CODE-01's position:
  - Counting the full payment counts principal twice for every user who records what they bought with the borrowed money.
  - It treats the owner's existing hand double-counting as a mitigating fact: F1 makes automatic what the owner already does.
  - It asks for a ruling between (a) counting the full payment and restating the module's rationale, and (b) a counting rule that does not re-count principal.
- CODE-02's position:
  - It recommends a derived model that projects every `db.debtPayments` record and "needs no data migration (F3)".
  - That projection includes past payments, which UI-01 says must not change past totals.

**C2. What ✎ does on a loan-payment row in Expenses (UI-06 vs CODE-03)**

- UI-06: ✎ opens the Pay sheet as an editor ("Payment to {debt}": date, amount, account, notes) and saves the one record. Effort M.
- CODE-03: ✎ opens the debt detail. "There is no payment edit path today, and this is not the place to add one." Effort S.

**C3. How loan payments are categorised (UI-18 vs CODE-02)**

- UI-18: a neutral "Loan" tag in place of the Needs/Wants/Savings group, and one named slice in category breakdowns.
- CODE-02: one stored, ordinary "Loan payment" category in group Needs, created by a v2→v3 migration or on the first payment.

**C4. Whether schedule fields belong in the add flow in this change (UI-17 vs CODE-16)**

- UI-17 (Medium, M): "+ Add loan" opens one add surface that includes the three schedule fields as optional, because the owner describes setting "the money and schedule" together.
- CODE-16 (Low, XS): one entry point (the disclosure summary styled as the pill). "Adding schedule fields to the add form is a separate request."

**C5. Which word the app already uses (UI-17 vs CODE-16)**

- UI-17 says the rest of the app says "borrowed money" and suggests "Add borrowed money", or renaming every entry point together.
- CODE-16 says the app says "debt".

**C6. Severity differences inside merged items**

These are recorded, not resolved. Priority follows the higher value.

- UI-03 High vs CODE-07 Medium
- UI-04 High vs CODE-08 Medium
- UI-07 High vs CODE-12 Medium
- UI-11, UI-15 and UI-19 Medium vs CODE-15 Low
- UI-17 Medium vs CODE-16 Low

## Estimated Effort

Effort is converted at XS about 0.1 day, S about 0.5 day, M about 1.5 days.

| Band | Items | Composition | Approx. days |
|---|---|---|---|
| P0 | 2 | 1 S, 1 M | ~2 |
| P1 | 10 | 5 M, 3 S, 2 XS | ~9 |
| P2 | 15 | 1 M, 6 S, 8 XS | ~5.5 (≈6.5 if WORK-22 is M) |
| P3 | 5 | 2 S, 3 XS | ~1.5 |
| Total | 32 | | ~18 to 19 build days, plus ruling time |

The Chief Architect's ruling time for WORK-01, the Overdue question, the row tag and C1 to C5 is not included above.

## Recommendations

1. Rule on C1 before anything else, with CODE-01's worked case (borrow ₮1,000,000, buy a ₮1,000,000 phone, repay ₮1,300,000: Home shows ₮2,300,000 against a real loss of ₮1,300,000) and UI-01's upgrade case both put to the owner. Two Critical findings depend on this one decision. No F1 code should start until it is recorded.
2. Both reviewers independently disagree with owner decision 1's wording "Tapping Pay … saves one record". UI-14 and CODE-09 both require Pay to open the existing sheet and never write on tap. The owner should confirm that this still meets their goal of writing each payment once.
3. Rule in the same sitting on whether an unpaid past instalment makes a debt Overdue, and so whether the bell changes (WORK-04), and on the row rate tag (WORK-09). Then rule on C2 to C5, which are small.
4. Ship the detail screen first (Sprint 1). It carries no financial risk, mostly ports existing ink code, and every later item depends on it.
5. Do not let the harness be "fixed" by deletion. CODE-05's split of the Condition 4 invariant is what keeps the parts that do not change protected while F1 lands.
