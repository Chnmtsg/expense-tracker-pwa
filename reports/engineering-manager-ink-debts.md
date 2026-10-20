# Engineering Manager: the Ink redesign of the Debts screen (1a·05 / 1a·06)

Sources: `D:\3_Claude\PowerApps\reports\ui-review-ink-debts.md` (UI Review, 52/100) and `D:\3_Claude\PowerApps\reports\code-review-ink-debts.md` (Code Review, 52/100). The design request `D:\3_Claude\PowerApps\reports\design-request-ink-debts.md` was read for context only. I did not open the code.

## Project Health

Both reviewers scored the proposal 52/100, which puts it in "significant rework needed before release". Nothing is built yet, so every finding is about what the design would do if built as drawn. Both reviewers found the same Critical problem: the D10 timeline marks instalments "Paid", which the record cannot know and which standing rulings forbid. They also share most of their High findings: the rate shown on each row, the payment-correction path that D6 removes, the footer that only covers one state, and the bar's denominator. Both say the shell (rows, a detail surface, one "Still owed" figure) is an improvement. Both say every defect can be fixed at XS–M without a redesign. They disagree on one architectural question, how to build the detail. That decision blocks the first sprint.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Schedule timeline makes no paid/unpaid claim. Dates and amounts only, "Next" in text | UI-01, CODE-01 | Critical (both) | P0 | S | WORK-03, ruling on Conflict C3 |
| WORK-02 | Explicit ruling that the detail is a navigation surface, not a disclosure. Lift PDR12 for it by name | CODE-19 | Medium | P1 (blocks P1) | XS (ruling) | none |
| WORK-03 | Build the detail surface: `.screen` sub-screen or full-height modal sheet. Back, focus and the return to the debt after sheets close | CODE-02, UI-13 | High (CODE-02) / Medium (UI-13) | P1 | M | WORK-02, ruling on Conflict C1 |
| WORK-04 | Detail carries the payment ledger with per-payment delete, plus every fact the card carries today (note, stated dueDate, "X paid of Y", cost chip, the three helper lines with their gates) | UI-03, CODE-03 | High (both) | P1 | M | WORK-03, ruling on Conflict C4 |
| WORK-05 | Rate leaves the row. Extract `rateLine` unchanged into `debtRateLineHTML(d)` and render it verbatim once in the detail (ruled sentence, flat fallback, ask line, no line at 0%) | UI-02, CODE-05 | High (both) | P1 | S | WORK-03 |
| WORK-06 | State-dependent footer keyed on `debtSettled`. Live: "+ Payment" / "Mark settled". Settled: "Settled on {date} · Change" plus a demoted "+ Payment". Keep `data-debt-*` and the aria-labels. Detail shows ✓ Cleared and the settled-short line | UI-05, CODE-06 | High (both) | P1 | S | WORK-03 |
| WORK-07 | Summary disclosure stays visible: no ⓘ, the relationship sentence ungated, the cost sentence visible while "Cost so far" is on screen | UI-04, CODE-13 | High (UI-04) / Medium (CODE-13) | P1 | S | Architect ruling on the D2 ⓘ reversal |
| WORK-08 | Bar = totalPaid ÷ (totalPaid + totalOutstanding). Add a settled-short debt to the condition 9 fixture | CODE-04, UI-09 | High (CODE-04) / Medium (UI-09) | P1 | XS | none |
| WORK-09 | Re-anchor the harness (debts.js, accounts.js, perf.js) in the same slice that moves each control. Rows get `data-debt-open`, the detail root gets `data-debt-id`, one probe helper opens the detail | CODE-17 | Medium | P1 (blocks P1 slices) | M | WORK-03 |
| WORK-10 | Detail re-renders after every write and closes with the `EDIT_TARGET_GONE_MSG` pattern when its debt is gone. Add a cross-window flow | CODE-11 | Medium | P2 | S | WORK-03 |
| WORK-11 | Extract `deleteDebt(id)` unchanged. Danger button in the edit sheet. Closes edit and detail together | CODE-10 | Medium | P2 | S | WORK-03 |
| WORK-12 | One `debtNextDate(d, today)` (nearer of dueDate and next instalment, as the bell does) plus one urgency function for row, sort and detail. Coral only for a passed dueDate, never for an instalment. Existing card threshold. Text always states the state. Cleared is never overdue | UI-07, CODE-08 | Medium (both) | P2 | S | none |
| WORK-13 | Fold stays native `<details class="more-fields">` with "Cleared (N)", restyled only | UI-06, CODE-07 | Medium (both) | P2 | XS | none |
| WORK-14 | Hero figure fits at 320 (36px `--t-hero` vs 48px with `fitToWidth`) | UI-08, CODE-15 | Medium (UI-08) / Low (CODE-15) | P2 | XS | Architect ruling on the D2 hero reversal and Conflict C7 |
| WORK-15 | Ring keeps the word "repaid", visible and in the row's accessible name. Floor rule from `pctLabel` | UI-10 (floor rule noted in CODE-04) | Medium | P2 | XS | none |
| WORK-16 | Ring and timeline graphics reach 3:1 (`--text-3`). "Next" printed as a word. Both pairs added to `check-contrast.mjs` PAIRS at 3.0 | UI-11, CODE-16 | Medium (both) | P2 | XS | none |
| WORK-17 | Drop "A bank loan is typically 18–24%" and "Why this matters ›" from this phase | UI-12, CODE-12 | Medium (both) | P2 | XS | none |
| WORK-18 | Rename the "Last payment" tile to name the final agreed date. Stated dueDate stays beside it | UI-14, CODE-18 (label part) | Medium (UI-14) / Low (CODE-18) | P2 | XS | Conflict C9 (wording) |
| WORK-19 | Row is one native button, at least 44px, named "<lender>, ₮X still owed, <due state>", with `:focus-visible`. Focus moves to the detail heading and back to the row. Footer above the tab bar, 44px buttons, scroll area padded by the footer height | UI-15 | Medium | P2 | S | WORK-03 |
| WORK-20 | Payment pre-fill = min(agreed amount, still owed). Remainder chip and `data-qa-exact` untouched. No pre-fill without a schedule | UI-17, CODE-09 | Medium (both) | P2 | S | WORK-06, Conflict C8 (label) |
| WORK-21 | If "Borrowed in total" leaves the summary, the ungated relationship sentence also travels into the detail beside Still owed | CODE-14 | Medium | P2 | XS | WORK-03, WORK-07 |
| WORK-22 | One bounded `debtScheduleOccurrences(d)` used by the timeline and `debtAgreedPaymentAmount`. Near rows only. Solver untouched | CODE-18 (walker part) | Low | P3 | S | none |
| WORK-23 | One add entry point. The pill opens and focuses `#debtAddFields`. Vocabulary stays "debt / borrowed money", not "loan". Empty-state copy matches | UI-16, CODE-20 | Low (both) | P3 | S | none |
| WORK-24 | Sort, if ruled: overdue (by dueDate), then soonest WORK-12 date, then no date. Ties fall back to the ORD-01 key. No explanation on screen. 8b fixture uses dates relative to today | UI-18, CODE-21 | Low (both) | P3 | S | WORK-12, architect ruling lifting 8b / ODR5 |

All 18 UI findings and all 21 CODE findings are absorbed. CODE-18 contained two separate problems and is split across WORK-18 and WORK-22.

## Quick Wins

These are XS/S items that remove Medium or higher severity, listed in their priority band. Do them first within that band.

- **P0:** WORK-01 (S). A change at design level that removes the Critical.
- **P1:** WORK-08 (XS), WORK-02 (XS, ruling only), WORK-05 (S, which removes four row defects at once, including 0% shown in coral), WORK-06 (S), WORK-07 (S, which keeps two existing sentences visible instead of building an ⓘ sheet).
- **P2:** WORK-13, WORK-14, WORK-15, WORK-16, WORK-17, WORK-18, WORK-21 (all XS). WORK-10, WORK-11, WORK-12, WORK-19, WORK-20 (all S).

A cheap item stays at the priority its severity sets. WORK-08 is XS but stays P1. Nothing became P0 for being cheap.

## Sprint Plan

**Sprint 1: the detail exists beside the current cards. The list does not change.** This matches Code Review slices 1–2 and UI Review build-order step (a).

Items: WORK-02, WORK-12, WORK-11, WORK-05, WORK-03, WORK-04, WORK-06, WORK-10.

Total effort: 1 XS + 5 S + 2 M, roughly 4.5–6.5 working days including the new flows (navigation Back, cross-window stale target, settle-undo through the detail).

What it delivers:
- The shared rules are pulled out of `cardHTML`, `computeReminders` and the anonymous delete listener with no visible change: `debtRateLineHTML`, `debtNextDate` plus the urgency function, and `deleteDebt`.
- A working detail, opened from each card, that already does everything the card does: Pay, Payments with per-payment delete, Mark settled / undo, Edit, Delete, and the ruled rate sentence.
- The detail refreshes after writes and closes cleanly when its debt is gone.
- `npm test` stays green, because the cards and their controls still exist for the existing flows.

Entry condition: Sprint 1 cannot start until the Chief Architect rules on WORK-02 and on Conflicts C1 and C4.

Deliberately left out: rows, the summary and the timeline. With them in, the sprint would be overfilled.

## Roadmap

- **Sprint 1:** WORK-02, WORK-12, WORK-11, WORK-05, WORK-03, WORK-04, WORK-06, WORK-10
- **Sprint 2:** WORK-09, WORK-19, WORK-15, WORK-16, WORK-13, WORK-07, WORK-08, WORK-14, WORK-21
- **Sprint 3:** WORK-01, WORK-22, WORK-18, WORK-20, WORK-17
- **Later:** WORK-23, WORK-24

Sprint 2 replaces cards with rows (D3, D6), keeps the fold (D5) and builds the summary (D2). Sprint 3 builds the schedule surfaces (D9, D10, D11 pre-fill) and the true-cost card clean-up. Later holds the add-pill consolidation and the sort, which needs a ruling to lift 8b / ODR5.

WORK-01 is P0 but sits in Sprint 3 because the timeline is not built before then. Its form should be ruled now (Conflict C3). The timeline must never be built in any form that carries a paid or unpaid state. The Ink Debts redesign cannot be released until Sprint 3 is complete.

## Dependencies

- **WORK-02 before WORK-03.** Code Review notes that PDR12 and the order-and-the-finished off-limits list, read literally, forbid any new modal, sheet or screen holding a derived figure. The detail needs that ruling before anyone builds it.
- **Conflict C1 before WORK-03.** The sheet-vs-screen choice decides the Back mechanics, the refresh model and the harness root. Code Review's evidence also says screen-level history is on the off-limits list. If a sub-screen is chosen, that is a second ruling.
- **WORK-03 before WORK-04, 05, 06, 10, 11, 19 and 21.** They all put content or controls into the detail.
- **WORK-04, 05, 06 and 11 before the card controls are removed in Sprint 2.** Every action and fact on the card needs a home in the detail first. Otherwise the payment-correction path (UI-03 / CODE-03) and the settle undo (UI-05 / CODE-06) go missing for a while.
- **WORK-09 moves with every slice.** Each flow that clicks a card control is re-pointed at the detail control in the commit that moves the control, never afterwards. Both reviewers state this.
- **WORK-12 before WORK-24.** The row line, the sort and the bell must read one "next date", or they drift apart.
- **WORK-06 before WORK-20.** The pre-fill belongs to the footer button.
- **WORK-07 before WORK-21.** Whether "Borrowed in total" leaves the summary decides whether the relationship sentence must also travel into the detail.
- **WORK-22 alongside WORK-01.** The bounded walker should exist before the timeline is drawn, so a 600-count schedule cannot render 600 rows. It does not block the correction that WORK-01 makes.
- **Architect rulings on the three direct reversals** (D2 ⓘ, D2 hero, D4 sort) gate WORK-07, WORK-14 and WORK-24.

## Conflicts

**C1. How the detail is built (WORK-03). This is the main disagreement.**
- UI Review (UI-13, Medium): use a `.screen` sub-screen reached from the row. Header and system Back return to the list, scrolled to that row. Focus moves to the detail heading and back to the row. Sheets open over it and close back to it. A full-height modal sheet would either stack a second modal layer (a new mechanism) or be replaced by the payment sheet, sending the user back to the list after every payment.
- Code Review (CODE-02, High): use a full-height modal sheet, a new `#debtDetailModal` beside `#editModal` that holds the debt id on the element. `navigate()` pushes no history. The modal stack is the app's only user of history, and screen-level history is off limits. So on a sub-screen, Android Back would exit the PWA. `navigate()` also scrolls to the top on screen change, and `refreshFromStorage` would need a "current debt" global. Payment, settle and edit sheets would stack over the detail the way the date picker stacks over the goal editor today. `pendingBacks` already batches two closes. The bell keeps handing off straight to `#editModal`.
- What both agree on: the user must land back on the debt after a payment, sheets open over the detail, and Back closes only the top layer.
- The reviewers also differ on severity (Medium vs High) and effort (M vs S). I used M for planning.

**C2. Past instalments on the timeline (WORK-01).** Both reviewers agree there must be no paid or missed state.
- UI-01 says past instalments are not drawn. Show only the next instalment, labelled "Next", and the upcoming ones.
- CODE-01 says draw past and future dates in the same neutral style with no paid or missed meaning, or drop D10 and keep D9 if the design insists on a Paid state.

**C3. Severity of the summary ⓘ (WORK-07).**
- UI-04 rates it High. CODE-13 rates it Medium.
- Both say to keep the relationship sentence visible. On the cost sentence, UI-04 says any shortening of the gated sentence is a separate request against ABR7 carrying ABD3's measurement. CODE-13 says the cost sentence "may be shortened but should stay on screen".

**C4. Where the payment ledger lives in the detail (WORK-04).**
- UI-03 (M): an inline "Payments" section on every debt, listing date, amount and per-payment delete as the history modal does today.
- CODE-03 (S): a "Payments" row that opens the existing `openDebtHistoryModal(id)` unchanged.

**C5. Severity of the bar denominator (WORK-08).**
- CODE-04 rates it High. UI-09 rates it Medium.
- The fix is the same in both reports.

**C6. Hero size (WORK-14).**
- UI-08 (Medium): use `--t-hero` (36px). The 48px literal is off the type scale. ABL-02's premise no longer applies because the tile grid is gone.
- CODE-15 (Low): keep 48px and generalise `fitQuickAmount` into `fitToWidth(el)`.

**C7. Label on the payment button (WORK-20).**
- UI-17: label it "+ Payment". A button labelled with an amount reads as if tapping it records the payment.
- CODE-09: label it with the capped figure, and fall back to "+ Payment" when there is no schedule.

**C8. Wording of the tile label (WORK-18).**
- UI-14 (Medium): "Final instalment".
- CODE-18 (Low, for the whole finding): "Final agreed payment".

**C9. Where the relationship sentence goes (WORK-07 / WORK-21).**
- UI-04 places it under the summary bar.
- CODE-14 places it in the detail beside Still owed, if "Borrowed in total" leaves the summary.
- These may not be exclusive, but neither report says both.

**C10. Effort estimates that differ.**
- WORK-03: M (UI) vs S (CODE).
- WORK-04: M (UI) vs S (CODE).
- WORK-05: S (UI) vs XS (CODE).
- WORK-23: S (UI) vs XS (CODE).
- I planned on the larger figure in each case.

## Estimated Effort

| Band | Items | Effort mix | Approximate total |
|---|---|---|---|
| P0 | 1 | 1 S | up to 0.5 day |
| P1 | 8 | 2 XS, 3 S, 3 M | 4.5–7.5 days |
| P2 | 12 | 7 XS, 5 S | about 3 days |
| P3 | 3 | 3 S | up to 1.5 days |
| **Total** | **24** | | **about 9.5–12.5 working days** |

This is somewhat above Code Review's "about L over six slices", for two reasons. I planned on the larger estimate wherever the reviewers differ (C10), and harness re-anchoring (WORK-09) is counted as separate work.

## Recommendations

1. **Rule C1 first.** Everything else waits on how the detail is built. UI Review's case is about where the user lands after a payment. Code Review's case is that Back exits the app, and that screen-level history is off limits. Both agree on the behaviour they want. They disagree on which mechanism delivers it within the standing rulings.
2. **Make WORK-01 a standing ruling now.** No paid, missed or behind state on any instalment, in any form. Also rule on C2 (draw past dates neutrally, or do not draw them). It is the only Critical, and it repeats BLR6/BLR7/SCR5/PDR11.
3. **Rule on the three reversals one at a time.**
   - D2 ⓘ: both reviewers say keep the ruling, differing only on severity (C3).
   - D2 hero: UI Review says overturn at `--t-hero`. Code Review keeps 48px with fit-to-width (C6).
   - D4 sort: UI Review says overturn only if the owner confirms. Code Review treats it as a key swap that needs 8b rewritten.
4. **Issue WORK-02 together with C1.** Without it, the detail is literally forbidden by PDR12.
5. **Adopt the build rule both reviewers stated.** The detail is built first and carries everything the card carries. The cards leave only after that. Harness flows are re-anchored in the commit that moves each control. Sprint 1 is deliberately only the detail.
6. **Tell the owner about the trade-off UI Review named.** With the rate off the rows, the per-loan cost is no longer visible on the list. It appears only in the aggregate and on each detail. That is the price of showing it in the ruled wording, and it was a choice.
