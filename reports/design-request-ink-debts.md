# Design request: the Ink redesign of the Debts screen

2026-10-19. Owner-requested. Source: the "Ink" design handoff
(`design_handoff_ink_redesign`, outside the repo), screens **1a·05 Debts** and
**1a·06 Debt detail**, README sections "05 Debts" and "06 Debt detail".
Phase 1 (the Ink theme) and Ink-as-default for new installs are already merged;
see HANDOFF → Owner decisions, 2026-10-19.

The owner chose this as the next phase and chose to send it through `/review`
because it **overturns standing Debts rulings**. This document maps each part of
the design to what it touches so the review can rule part by part. It proposes;
it does not decide.

## What the design asks for

**List screen (1a·05)**
- D1. Title plus a "+ Add loan" pill that opens the existing add form.
- D2. Summary: "Still owed" caption over the amount at **48px/600**; a 10px
  progress bar (paid ÷ total to repay, teal); under it "₮X paid back" left and
  "Cost so far ₮Y" right (Y in coral). **The explanatory paragraph moves to an
  ⓘ info sheet.** "Borrowed in total" is not shown.
- D3. One **row per debt** (surface, r20): a 48px progress ring with the %
  inside, the name (ellipsis), a due line (coral overdue, amber within 14 days,
  otherwise grey), and on the right still-owed plus "NN% / yr" in coral.
- D4. **Sort: overdue → soonest due → no schedule.**
- D5. Paid-off debts collapse into "N paid off · show".
- D6. **The five per-card buttons (Payment, history/schedule, settle, edit,
  delete) leave the list.** Tapping a row opens the detail.

**Detail (1a·06), a sub-screen or full-height sheet**
- D7. Back, an Edit pill, the name, "Borrowed ₮X on date".
- D8. True-cost card: "Costs you as much as a loan charging **81%** a year",
  a comparison line ("A bank loan is typically 18–24%") and "Why this matters ›".
- D9. Two tiles: Still owed · Last payment (Last payment only with a schedule).
- D10. Schedule timeline: Paid (filled teal), Next (amber ring), upcoming (grey
  ring), amount right-aligned.
- D11. Sticky footer: **Settle early** (secondary) and **Pay ₮next** (teal,
  pre-filled). Delete lives under Edit.

## What each part touches

Condition names are the flow comments in `tools/harness/debts.js`; that file
holds 37 conditions and 44 flows. Rulings are in `reports/chief-architect-*.md`.

| Part | Touches | Nature |
|---|---|---|
| D2 explanation → ⓘ | Condition "THE SUMMARY BLOCK STATES ONE SENTENCE…": *"a qualification the user must perform an action to read is not a qualification while the number it corrects is on screen."* Asserts no summary `.helper` sits in `<details>`, `[hidden]` or `display:none`. | **Direct reversal** |
| D2 48px hero | CSS ruling on `.debt-total-value`: the four figures were set to `--t-h3`, one step DOWN, "so the block stops out-shouting what it sits above", and the four move together ("two headline sizes inside one tile grid is the divergence this comment exists to refuse"). | **Direct reversal** |
| D2 drops "Borrowed in total" | Condition 9 (THE SUMMARY RECONCILES) and the tile-label assertions (lines ~946, ~1006, ~1812). The ungated relationship sentence explains why Still owed can exceed Borrowed. | Removes a ruled figure |
| D2 progress bar | Nothing found. Paid + Still owed = agreed (condition 9) gives it a reconciled basis. | Additive |
| D3 rows | "AT LEAST ONE COMPLETE DEBT CARD IS REACHABLE … WITHOUT SCROLLING" (a 390px guarantee). Rows are shorter, so likely easier, but the guarantee is stated about a *card*. "THE CARD STATES ONE RATE SENTENCE…" and "NO LINE WHERE THERE IS NO RATE TO STATE": the rate copy and its closure live on the card. | Restates; rate copy must move, not vanish |
| D3 "0% / yr" in coral | Measured in the review: a 0% loan (family) shown in the alarm colour. The design's own rule says colour signals state only. Condition 2 already removes cost captions from interest-free debts. | Design defect |
| D3 ring | Upcoming-ring grey #474F55 measures 2.28:1 on Ink's bg (3:1 is needed for meaningful graphics). The ring track #253033 on surface measures 1.29:1. | Contrast |
| D4 sort | **Condition 8b**: live debts ordered by what is still owed, smallest first, "and the application says nothing about why". Condition 8: finished debts sink and keep entry order. | **Direct reversal** of 8b; 8 compatible |
| D5 fold | "FINISHED DEBTS FOLD AWAY, AND EVERYTHING THE USER MIGHT NEED FROM THEM SURVIVES THE FOLD": keys on `debtSettled`; the undo for a mistaken settle must stay reachable inside the group. | Compatible if the undo stays reachable |
| D6 buttons leave the list | Condition 10 (a settled card keeps + Payment, de-emphasised, 44px). "THE BELL OFFERS A LIVE DEBT BOTH OF THE ACTS ITS CARD OFFERS": the bell's actions are defined against the card's. "THE PAYMENT SHEET OFFERS THE ONE AMOUNT IT ALREADY KNOWS". 20 of the 44 flows click a card control (`[data-debt-pay]`, `[data-debt-settle]` and the rest) or read `.debt-card`. | Moves every action; the harness re-anchors on the detail |
| D7–D11 detail | New surface. The router has `.screen` sections and modal sheets; the design leaves "sub-screen or full-height sheet" open. Back must behave as the modal stack does today. | Architecture choice |
| D8 comparison line | "A bank loan is typically 18–24%" is a market claim this app does not hold or update. One-fact-per-claim convention. | New claim |
| D9 "Last payment" | Repayment schedule exists ("A SCHEDULE IS THREE FACTS…"). Shown only with a schedule (handoff constraint). | Compatible |
| D11 Settle early | product-strategy.md: never show a predicted saving for early settlement. The design shows none. | Compatible |
| D2/D9 amounts at 320 | Measured: "₮150,050,000" at 48px/600 is 304px wide; 280px is available at 320. | Needs fit-to-width |

## Constraints that stand regardless

- Single file, no framework, offline-first; no new storage keys (none are needed).
- `npm test` green after every commit; Debts runs at 320 and 390.
- Mongolian first: all copy in English for now, routed through the language
  layer when it exists.
- The release gate from the startup sign-in round is unrelated and unchanged.

## Questions for the review

1. Which of the three direct reversals (D2 ⓘ, D2 hero size, D4 sort) are
   overturned, and on what reasoning? For each one kept, what does the design
   become?
2. Does "Borrowed in total" leave the summary, and what then explains Still owed
   exceeding what was borrowed?
3. Detail as a `.screen` sub-screen or a full-height modal sheet, given Back,
   the bell and the payment sheet's existing flows?
4. Where the rate sentence and its closure live once the list is rows.
5. Build order and slicing, with the harness re-anchoring treated as part of
   each slice rather than a trailing cleanup.
