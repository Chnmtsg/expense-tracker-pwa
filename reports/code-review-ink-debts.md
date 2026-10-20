# Code Review: Ink redesign of the Debts screen (proposal 1a·05 / 1a·06)

Scope: `D:\3_Claude\PowerApps\reports\design-request-ink-debts.md` (D1–D11), checked against the current Debts module in `D:\3_Claude\PowerApps\expense-pwa\index.html` and the harness in `D:\3_Claude\PowerApps\tools\harness\debts.js`. Nothing is built yet, so these findings are about what the design would do if built as drawn. Suggested save name: `reports/code-review-ink-debts.md`.

## Executive Summary

The current module can absorb this redesign. Every figure the design shows already exists as a pure derivation. The design is mostly a re-layout plus one new surface, and the modal stack already supports the nesting the detail needs. The single biggest risk is D10: it marks schedule instalments as "Paid". This record cannot know that, and the claim is ruled off limits (SCR5, BLR6, PDR11). Built as drawn, it would state a wrong financial fact. Three more parts would quietly break money guarantees:
- **D6:** it drops the only route to the payment ledger and to deleting a payment.
- **D2:** the progress bar's stated denominator never reaches full once a debt is settled early.
- **D3/D8:** both re-word the ruled rate sentences.

The detail surface must be a modal sheet, not a `.screen`. Screen-level history does not exist and is off limits, so a sub-screen would make Android Back leave the app.

## Overall Score

**52 / 100 (band 40–59: significant rework before build).** There is one Critical (CODE-01) and five Highs (CODE-02 to CODE-06). None of them needs a rewrite. Each has an XS–S correction, and with those applied the design is buildable in about L effort over six slices.

---

## What each design part costs and touches

| Part | Effort | Reuses | Breaks or must change |
|---|---|---|---|
| D1 "+ Add loan" pill | XS | `#debtAddFields` `<details>`, the `addFields.open` logic in `renderDebts` | nothing, if the pill opens and focuses the existing disclosure (CODE-20) |
| D2 hero, bar, captions | S | `totalOutstanding`, `totalPaid`, `totalInterest`, `showCost` | `.debt-total-value` ruling; condition 9 tile labels; bar denominator (CODE-04); fit at 320 (CODE-15) |
| D2 ⓘ | XS code | — | summary-sentence condition; order-and-the-finished off-limits list (CODE-13) |
| D2 drop Borrowed | XS | — | the relationship sentence must travel (CODE-14) |
| D3 rows | M | `debtPaid`, `debtOutstanding`, `debtSettled`, the `pctLabel` floor rule | rate copy (CODE-05); contrast (CODE-16); one-card-reachable flow re-anchors to "one row" |
| D4 sort | XS code, S harness | the precomputed `orderKeys` map | condition 8b (CODE-21); needs the bell's nearer-date rule (CODE-08) |
| D5 fold | XS | `#debtDoneGroup`, keyed on `debtSettled` | "paid off" wording (CODE-07); undo reachability moves into the detail |
| D6 buttons leave | M (mostly harness) | the five open-sheet functions, all unchanged | about 20 flows in debts.js, plus accounts.js and perf.js (CODE-17) |
| D7 detail shell | S | `openModal`/`closeModal`, the modal stack, `pendingBacks` | refresh and stale-target handling (CODE-11) |
| D8 true-cost card | XS if the sentence is reused | `debtAnnualCostRate`, `debtEffectiveAnnualRate`, `DEBT_RATE_DISPLAY_MAX` | wording (CODE-05); market claim (CODE-12) |
| D9 tiles | S | `debtOutstanding`, `debtPayoffDate` | label ambiguity, inside CODE-18 |
| D10 timeline | S (dates only) | `stepDate`, `debtNextAgreedPayment`, `debtAgreedPaymentAmount` | "Paid" state (CODE-01); fifth schedule walk (CODE-18) |
| D11 footer | S | `openDebtPaymentModal`, `openDebtSettleModal` | state-dependent footer (CODE-06); pre-fill (CODE-09); Delete under Edit (CODE-10) |

---

## Findings

### Critical

**CODE-01 — D10 marks instalments "Paid", which this record cannot know**
- Severity: Critical
- Location: design request D10 (`reports/design-request-ink-debts.md` line 35). Code that states the limit:
  - `debtNextAgreedPayment` comment, `expense-pwa/index.html:12329-12338`
  - `computeReminders` debt branch, `index.html:6190-6194`
- Evidence: there is no instalment ledger, paid mark or cursor on a debt. Payments in `db.debtPayments` are ad hoc and carry no instalment link. A "Paid (filled teal)" state can only come from one of two places:
  - the calendar (past means paid), which is false for anyone who missed a payment;
  - an allocation of `debtPaid` across instalments, which compares the schedule with the ledger.

  The second is refused permanently by SCR5 (`chief-architect-repayment-schedule.md:137`), PDR11 (`chief-architect-payoff-date.md:143`) and BLR6 (`chief-architect-the-bell-and-the-schedule.md:202`). The last one also bars any on-screen prompt about an instalment that has already fallen due (line 324).
- Impact: a user who missed an instalment is told it was paid, or a user who paid early is told they are behind. Either way the app scores performance against an agreement it has no data on. This is a wrong financial statement on the screen meant to make debt legible.
- Recommendation: the timeline states the terms only. Show dates and amounts, mark Next from `debtNextAgreedPayment`, and draw past dates and future dates in the same neutral style with no paid or missed meaning. If the design cannot live without a Paid state, drop D10 and keep D9.
- Effort: S

### High

**CODE-02 — A `.screen` sub-screen for the detail breaks Back; use a modal sheet**
- Severity: High (this is the decision that answers Question 3)
- Location: `navigate()`, `index.html:7111-7141`; the modal-stack history comment, `index.html:6606-6627`; `chief-architect-sprint1-review.md:88`
- Evidence:
  - `navigate()` toggles `.active` and pushes no history.
  - The modal stack is the app's only user of history ("Screen-level history is deliberately not attempted here — the architect deferred it").
  - Screen-level history or routing is on the off-limits list.
  - `navigate` also scrolls to the top on any change of screen (line 7140), which would lose the user's place in the list.
  - `refreshFromStorage` re-renders by active screen id (line 4985), so a sub-screen would need a "current debt" variable that outlives renders.
- Impact: with a sub-screen, Android Back on the detail exits the PWA. That is the failure the modal stack was built to remove.
- Recommendation: build the detail as a full-height modal sheet. That means a new `#debtDetailModal` beside `#editModal` with its own `data-dismiss`, holding the debt id on the element rather than in a global.
  - The payment, settle, edit and history sheets already open `#editModal`. They stack over the detail exactly as the date picker stacks over the goal editor today.
  - Back closes the top sheet only. Two closes in one task are already batched by `pendingBacks`/`flushPendingBacks` (`index.html:6638-6654`).
  - **The bell does not change.** It keeps handing off straight to `#editModal` (`index.html:6488-6499`) and never opens the detail, so its "two stacked dialogs" rule and its flows stay as they are. Only the comment's word "card" changes to "detail".
  - Add a navigation.js flow: Back with payment-over-detail closes payment only, the next Back closes the detail, and no dead history entry is left.
- Effort: S

**CODE-03 — D6 removes the only route to the payment ledger and to deleting a payment, and other card facts have no destination**
- Severity: High
- Location: `openDebtHistoryModal` and its `data-debt-pay-del` handler, `index.html:12109-12159`; card template `index.html:11843-11862`
- Evidence: the 📜 button is the only entry to the payment list and its per-payment delete. D7–D11 contain no ledger view, and D10 is the schedule, not the ledger, and exists only for scheduled debts. The design also gives no destination for these card facts:
  - the user's note (`noteChip`);
  - the stated `dueDate` when a schedule exists;
  - the per-debt "X paid of Y" (uncapped, which condition 9's card half asserts at `debts.js:990-999`);
  - the per-debt "Cost so far" chip;
  - three helper lines: "No payments recorded yet", the overpayment line and the settled-short line.
- Impact: a mistyped payment can no longer be found or deleted except by deleting the whole debt and its ledger. The overpaid and settled-short lines exist so that two figures on one screen reconcile. Without them the tile and the debt contradict each other with no explanation.
- Recommendation: the detail carries every fact the card carries today. Add a "Payments" row that calls `openDebtHistoryModal(id)` unchanged. Move the three helper lines with their gates as written. Show notes and due date as text in the detail.
- Effort: S

**CODE-04 — D2's bar ("paid ÷ total to repay") never fills once any debt is settled early**
- Severity: High
- Location: `renderDebts`, `index.html:11382-11383` (settled debts add 0 to Still owed) and `index.html:11416-11417` (paid is capped at the agreed total); condition 9 fixture `debts.js:935-942`
- Evidence: a debt settled for less than agreed contributes its capped paid figure and zero owed. So paid + owed is less than the total agreed, and paid ÷ total agreed stays below 100% forever. With every debt finished, the hero reads "Still owed ₮0" over a bar that is not full. Condition 9's fixture has no settled debt, so nothing in the harness would catch it. The request calls the bar "additive, nothing found" (line 50).
- Impact: two money signals on the hero disagree, at the moment the user has finished.
- Recommendation: define the bar as `totalPaid ÷ (totalPaid + totalOutstanding)`, i.e. from the two figures printed beside it. It then fills exactly when nothing is owed. Add a settled-short debt to condition 9's fixture. For the per-row ring, reuse the card's `pctLabel` floor rule (`index.html:11669-11680`): floor, never round, and 100 only when paid in full.
- Effort: XS

**CODE-05 — D3 "NN% / yr" and the D8 headline re-word the ruled rate sentences**
- Severity: High
- Location: `rateLine`, `index.html:11806-11813`; ruling comment `index.html:11733-11769`; harness `debts.js:2545-2565` and the "names what the percentage is a share of" flow at `debts.js:3390`
- Evidence:
  - The ruling forbids "a bare percentage", requires the sentence to name what the figure is a share of, and says "Neither may be described in the other's words".
  - D3's "NN% / yr" is a bare figure under one label for two different derivations, flat and effective.
  - D8 prints "Costs you as much as a loan charging 81% a year" without "on what you still owe", which the harness asserts (`debts.js:2551`).
  - D8 is also only valid for scheduled debts. Unscheduled ones get the flat sentence or the ask line.
  - Reuse fixes the request's "0% / yr in coral" defect for free: `debtAnnualCostRate` returns null for a zero cost (`index.html:11229-11231`).
- Impact: this makes the understatement the feature exists to expose, and it reddens two flows.
- Recommendation (answers Question 4):
  - Extract `rateLine` from `cardHTML` into `debtRateLineHTML(d)`, unchanged.
  - Render it verbatim as the detail's one rate slot, including the ask line and the flat fallback.
  - Rows carry no rate.
  - The one-sentence closure moves with the slot, intact.
- Effort: XS

**CODE-06 — The D11 footer is drawn for one state; the module has three**
- Severity: High
- Location: `openDebtSettleModal`, `index.html:12076-12107` (undo means clearing the date); condition 10 `debts.js:1025-1060`; fold flow `debts.js:2903-2919`
- Evidence: "Settle early" plus "Pay ₮next" fits a live, scheduled, not-overdue debt only:
  - **Settled debt:** it needs the undo route, which is today the card's ✓. Condition 10 also keeps a de-emphasised + Payment at 44px.
  - **Overdue debt:** "early" is false.
  - **No schedule:** there is no "next" amount.

  The bell labels the same act "Mark settled" (`index.html:6438`, asserted at `debts.js:3127`).
- Impact: without a state-dependent footer, the undo for a mistaken settle becomes unreachable. That is the property the fold condition exists to protect.
- Recommendation: one footer function keyed on `debtSettled(d)`.
  - Live: "+ Payment" (or "Pay ₮X" per CODE-09) and "Mark settled", the bell's word.
  - Settled: "Settled on {date} · Change", opening `openDebtSettleModal`, plus a secondary + Payment.
  - Keep `data-debt-pay`, `data-debt-settle` and the current aria-labels on these buttons.
- Effort: S

### Medium

**CODE-07 — "N paid off · show" is false for a debt settled early, and the summary string is closed**
- Location: fold comment `index.html:11598-11610`; `debts.js:2896-2901`
- Evidence: the group keys on `debtSettled`, which includes settled-short debts. "Paid off" asserts the money was repaid. The summary is ruled "closed at its one string, permanently" and asserted as `Cleared (2)`.
- Impact: the label states a repayment that did not happen.
- Recommendation: keep "Cleared (N)" in the existing `.more-fields` primitive.
- Effort: XS

**CODE-08 — A third due-urgency threshold, and three readers of "the due date"**
- Location: card `dueChip`, `index.html:11815-11824` (30 days); bell `index.html:6208-6224` (nearer of two dates, 3 and 7 days); design D3 (14 days); design D4 sort
- Evidence: the row line, the D4 sort and the bell each need "which date is next for this debt". Only the bell implements the nearer-of-dueDate-and-next-instalment rule. Overdue can only come from `dueDate`, because `debtNextAgreedPayment` never returns a past date.
- Impact: the row, the sort and the bell drift apart, e.g. a row sorted "soonest" whose line shows a different date than the bell.
- Recommendation: extract `debtNextDate(d, today)` from `computeReminders` (returning the date and whether it is the agreed date or the due date), and use one urgency function for the row, the sort and the detail. Keep the CONDITION 14 rule that a cleared debt is never overdue.
- Effort: S

**CODE-09 — The "Pay ₮next" pre-fill can recreate the overpayment state**
- Location: `openDebtPaymentModal`, `index.html:11920-11959` (no amount parameter); `debtAgreedPaymentAmount`, `index.html:12378-12385`
- Evidence: the next instalment can exceed what is still owed, for a user who paid ahead. Overpayment is the state three derivations were hardened against (`index.html:11093-11105`). There is precedent for a pre-filled, selected amount in `openLogPlannedModal` (line 6389).
- Impact: one tap could record more than is owed.
- Recommendation: add an optional prefill. Use `min(agreed amount, debtOutstanding(d))`, select the field's text, label the button with that figure, and fall back to "+ Payment" with no schedule. Leave the `data-qa-exact` chip logic untouched; its harness checks read it from the row, not from an argument (`debts.js:3190-3192`).
- Effort: S

**CODE-10 — "Delete lives under Edit" needs the delete handler extracted**
- Location: anonymous `[data-debt-del]` listener inside `renderDebts`, `index.html:11887-11917`; `openDebtEditModal`, `index.html:12012-12074`
- Evidence: the cascade, the account-shortfall dialog and the re-render live in a closure that only the card can reach. `#editModal`'s footer has Save and Cancel only.
- Impact: copying the handler into the edit sheet would duplicate the cascade logic, so the two copies could drift.
- Recommendation: extract `deleteDebt(id)` unchanged. Call it from a danger button in the edit sheet. On success, close the edit sheet and the detail together; the close batching already handles two closes in one task.
- Effort: S

**CODE-11 — The detail must refresh after every write and close when its debt is gone**
- Location: save handlers that call `renderDebts()`, `index.html:13386`, `13415`, `13462`; history delete, `12142`; `refreshFromStorage`, `4980-4986`; `editTargetGone`, `13174-13177`
- Evidence: every write re-renders the list only. A sheet left open shows stale figures, or a debt another window deleted.
- Recommendation: `renderDebts` re-renders the open detail as its last step. If the debt no longer exists, it closes the detail with the `EDIT_TARGET_GONE_MSG` pattern. Add a cross-window flow for this case.
- Effort: S

**CODE-12 — D8's "A bank loan is typically 18–24%" and "Why this matters ›"**
- Location: design D8 (line 33); rate ruling, `index.html:11757-11765`; `chief-architect-order-and-the-finished.md:99`, `:306`
- Evidence: this is a market figure the app does not hold, cannot update offline, and cannot source. "Why this matters" is a further sheet holding explanatory prose, i.e. a disclosure containing a disclosure sentence, which is on the off-limits list.
- Recommendation: drop both. The ruled sentence is the explanation.
- Effort: XS

**CODE-13 — D2 ⓘ hides the qualifier of "Cost so far"**
- Location: `helperHTML`, `index.html:11469-11474`; condition at `debts.js:2609`; `chief-architect-order-and-the-finished.md:99`
- Evidence: the cost sentence states that the figure is the app's even allocation and may not match the lender. The ⓘ is cheap to build, but it is a disclosure control holding a disclosure sentence, which is off limits beyond the condition the request names.
- Recommendation (engineering view; the architect rules): keep the relationship sentence visible. The cost sentence may be shortened but should stay on screen while its figure is.
- Effort: XS

**CODE-14 — Dropping "Borrowed in total" moves the confusion into the detail**
- Location: `index.html:11429-11437`
- Evidence: D7 prints "Borrowed ₮X" and D9 prints "Still owed ₮Y". Y is greater than X for every costed debt with little paid. That is exactly the gap the ungated sentence exists to explain.
- Recommendation: if Borrowed leaves the summary, the relationship sentence travels to the detail next to D9, ungated.
- Effort: XS

**CODE-16 — Ring colours fail 3:1, and no check would catch them**
- Location: `D:\3_Claude\PowerApps\tools\check-contrast.mjs` PAIRS (hand-maintained, line 52); design request line 53
- Evidence: the upcoming ring measures 2.28:1 and the track 1.29:1. A new token pair is only checked if someone adds it to PAIRS.
- Recommendation: add both pairs at 3.0 under the non-text-graphics block. Fix the tokens until `npm run check:contrast` is green.
- Effort: XS

**CODE-17 — The harness re-anchoring reaches beyond debts.js**
- Location:
  - `tools/harness/debts.js` (53 selector references to `.debt-card`, `data-debt-*`, `.debt-rate` and the totals);
  - `tools/harness/accounts.js:346`, `:907-942`, `:1735-1748` (scoped to `#debts button[data-debt-*]`);
  - `tools/harness/perf.js:249`
- Evidence: a detail sheet outside `#debts` fails the accounts.js scope. Lookups like `[data-debt-edit=id].closest('.debt-card')` (e.g. `debts.js:2509`, `:2806`, `:2878`) lose their root.
- Recommendation:
  - Keep the five `data-debt-*` attribute names and their aria-labels identical on the detail's controls.
  - Give rows `data-debt-open="id"` and give the detail root `data-debt-id`.
  - Add one probe helper that opens the detail for an id.
  - Most flows then change one lookup line and keep their assertions.
  - Re-anchor in the slice that moves each control, not afterwards.
- Effort: M

**CODE-19 — The detail surface itself needs an explicit ruling**
- Location: PDR12, `chief-architect-payoff-date.md:144` ("a new screen, modal, sheet … primitive" refused); `chief-architect-order-and-the-finished.md:306` ("any disclosure anywhere containing a derived figure … a control … or a live debt")
- Evidence: read literally, both forbid the detail sheet.
- Recommendation: the architect states that the detail is a navigation surface and not a disclosure, and lifts PDR12 for this one modal by name.
- Effort: XS (ruling only)

### Low

**CODE-15 — The 48px hero needs fit-to-width, and the precedent is single-use**
- Location: `fitQuickAmount`, `index.html:7031-7041`
- Evidence: "₮150,050,000" at 48px measures 304px against 280px available at 320. `fitQuickAmount` is hard-wired to `#quickAmount`.
- Recommendation: generalise it to `fitToWidth(el)`, call it after render and on resize, and skip it while the element has no width. Do not copy it.
- Effort: XS

**CODE-18 — The timeline would be the fifth walk of one schedule, and "Last payment" is ambiguous**
- Location: walks at `index.html:11326`, `12313`, `12364`, `12382`
- Evidence: each walk repeats the anchor-day `stepDate` idiom. `debtAgreedPaymentAmount` walks with no ceiling check of its own. A 600-count schedule would render 600 rows. "Last payment" could mean the last recorded payment or the final agreed date (`debtPayoffDate`, whose closure bars "paid off" wording, `index.html:12395-12399`).
- Recommendation: add one bounded `debtScheduleOccurrences(d)` and use it for the timeline and `debtAgreedPaymentAmount`. Leave the solver as ruled. Show near rows only. Label the tile "Final agreed payment".
- Effort: S

**CODE-20 — The D1 pill duplicates the add-form disclosure**
- Location: `index.html:3411`, `index.html:11363-11364`
- Recommendation: the pill sets `#debtAddFields.open` and focuses the first field. Moving the form into a sheet is deferred.
- Effort: XS

**CODE-21 — The D4 sort depends on the clock and replaces 8b**
- Location: `orderKeys` and the comparator, `index.html:11564-11574`; `debts.js:865-928`
- Evidence: the change is a key swap built on CODE-08's function. The order then changes as days pass, so 8b's fixture must use dates relative to today (the bell flow's `iso(n)` idiom at `debts.js:3087`). The order still asserts no strategy and keeps the stable tie order.
- Effort: XS code, S harness

**Review areas with no finding:**
- **Security:** clean, on condition that the new templates keep `escapeHTML` on `name` and `notes`, as the card does. `check-escaping.mjs` covers the file.
- **Storage:** clean. No new storage key or field is needed and none should be added.
- **Performance:** clean. `renderDebts` walks the ledger roughly six times per debt today, and rows do not change that order of cost.

---

## Technical Debt

- `cardHTML` holds every per-debt rule inline: rate slot, `pctLabel`, bar gate, due chip and helper lines. Any second surface forces extraction first (CODE-05, CODE-06, CODE-08). This is the main structural debt the redesign exposes.
- The delete cascade lives in an anonymous listener (CODE-10).
- There are four schedule walks with copied anchor logic (CODE-18).
- `#editModal` is one shared element for every kind of record. It works for the detail because the detail is a separate element, but any future "sheet over a sheet over the detail" adds pressure on the `editCtx` global.

## Future Risks

- The Mongolian language layer will lengthen every row line and the hero. Fit-to-width (CODE-15) and the 320 no-overflow conditions become the binding constraints.
- Every future debt fact now needs a home in the detail. Without the "detail carries everything the card carried" rule (CODE-03), facts will drop silently.
- The 390 one-row-reachable guarantee gets easier with rows, which invites new blocks above the list. The guard should be re-anchored, not relaxed.
- A future "Settings without user name" or navigation phase must not introduce screen-level history piecemeal for this detail (CODE-02).

## Recommended Refactoring and slicing

Every slice keeps `npm test` green, re-anchors its own harness flows, and runs at 320 and 390.

1. **Extract, no visible change.**
   - Pull these out of `cardHTML` and `computeReminders` unchanged: `debtRateLineHTML(d)`, `debtPctLabel(d)`, `debtHelperLinesHTML(d)`, `debtNextDate(d, today)`, one urgency function, and `deleteDebt(id)`.
   - The bell switches to `debtNextDate`.
   - Covers CODE-05, CODE-08, CODE-10. Effort S.
2. **Detail sheet beside the cards.**
   - Add `#debtDetailModal`, opened from the card name. It holds the full card facts, the state-dependent footer, the Payments row and the rate slot; `renderDebts` refreshes it and closes it when its debt is gone.
   - Add new flows: navigation.js Back, a cross-window flow, and the settle undo through the detail.
   - Covers CODE-02, CODE-03, CODE-06, CODE-11, CODE-19. Effort M.
3. **Cards become rows (D3, D6).**
   - Card controls are removed.
   - In the same commit: re-anchor about 20 debts.js flows plus accounts.js and perf.js, and add the contrast pairs.
   - Covers CODE-16, CODE-17. Effort M.
4. **Order and fold (D4, D5), only as ruled.**
   - The 8b rewrite and "Cleared (N)".
   - Covers CODE-07, CODE-21. Effort S.
5. **Summary (D2), only as ruled.**
   - Hero with `fitToWidth`, the bar on the reconciled denominator, the condition 9 fixture gains a settled-short debt, and sentences placed per ruling.
   - Covers CODE-04, CODE-13, CODE-14, CODE-15. Effort S.
6. **Schedule surfaces (D9, D10, D11).**
   - One occurrences walker, a dates-only timeline, the "Final agreed payment" tile, and the capped pre-fill.
   - Covers CODE-01, CODE-09, CODE-18. Effort S.

No rewrite and no library is needed. Slice 1 alone removes most of the drift risk, because every later slice then reuses one function for each rule instead of copying it.
