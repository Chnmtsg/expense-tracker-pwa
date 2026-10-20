# Chief Architect: the Ink redesign of the Debts screen (1a·05 / 1a·06)

Inputs read in full: `D:\3_Claude\PowerApps\reports\engineering-manager-ink-debts.md`, `D:\3_Claude\PowerApps\reports\ui-review-ink-debts.md`, `D:\3_Claude\PowerApps\reports\code-review-ink-debts.md`, `D:\3_Claude\PowerApps\reports\design-request-ink-debts.md`, and the 2026-10-19 Owner decisions in `D:\3_Claude\PowerApps\reports\HANDOFF.md`. I checked the evidence for C1 and WORK-02 against the sources. The modal-stack comment and `scrollRestoration` are at `expense-pwa/index.html` 6606–6654. The date picker already stacks over another modal (`#datePickerModal` at z-index 60, line 2615). The off-limits list in `chief-architect-sprint1-review.md:88` includes "screen-level history or routing". PDR12 is in `chief-architect-payoff-date.md:144`. The off-limits list in `chief-architect-order-and-the-finished.md` is at lines 303–309, and that list also refuses "any interface state remembered across a render … by a module-level variable that outlives the render". All three reports are present. This ruling does not replace `reports/chief-architect.md`.

---

## Executive Decision (Executive Report)

**The shipped application: yes, fit for release. The proposal as drawn: no. The corrected proposal: yes, built slice by slice, and each slice can ship on its own once `npm test` is green at 320 and 390.**

Nothing has been built yet. Every finding is about what the design would do if built as drawn, so none of them blocks anything that ships today. The one Critical finding (D10 marking instalments "Paid") is approved here as a permanent rule on how the timeline is built. It is not a defect waiting in the code. So it does not hold back the slices that come before the timeline, and I am overruling the Engineering Manager's statement that nothing can ship until Sprint 3. The structure of the design (rows, one detail surface, one "Still owed" headline) serves the target user better than five glyph buttons per card, and both reviewers say so. Each defect has an XS–M fix that keeps the shape. Of the three reversals, I overturn two (the hero size, at the scale's own token; and the sort, in silence and on the owner's word). I keep one (no ⓘ, so the summary sentences stay visible). The detail is a full-height modal sheet, because a sub-screen needs two things this project has ruled out: screen-level history and a "current debt" variable that outlives the render.

---

## Rulings on the three direct reversals

**Reversal 1: D2, the explanation moves behind ⓘ. Refused. The standing ruling stands at full width.**
The condition reads: "a qualification the user must perform an action to read is not a qualification while the number it corrects is on screen". It is C36, which is breached by hiding a disclosure, never by hiding a figure. An ⓘ sheet would also be a third disclosure control on the Debts screen, and it would be a disclosure holding a disclosure sentence. Both are on the off-limits list. The design becomes this: under the bar, the ungated relationship sentence always shows, and the cost sentence shows whenever `showCost` is true. Both are visible and unshortened. Shortening the gated cost sentence is not part of this phase. ABR7 stands, so any shortening comes back as its own request, carrying ABD3's measurement. Both reviewers' wordings agree with this result, and CODE-13's "may be shortened" does not authorise shortening in this phase.

**Reversal 2: D2, 48px hero. Overturned, at `var(--t-hero)` (36px), not at 48px.**
The ruling that set `.debt-total-value` to `--t-h3` protected a tile grid ("the four move together"). The design removes that grid, so the premise no longer holds and the hierarchy argument now favours the design. The rule underneath that ruling survives: per ABK2's repaired comment, there is no sixth headline size on a five-step scale. A 48px literal would be that sixth size, and `--t-hero` is already on the scale. Measure at 320 with the long-lender fixture. If 36px fits (estimated at about 228px against 280px available), no fit-to-width code is written. The comment on `.debt-total-value` is repaired in the same commit (ARCH-01).

**Reversal 3: D4, the sort. Overturned, replacing condition 8b, with one entry gate.**
Under ORD-01's own split, the order of a list is presentation. It belongs to the owner, and the application may take it only in silence. Sorting by due date is financially identical to sorting by smallest balance on this record, so ODD2 does not fire. ODR4 stands permanently: no word, badge, ordinal or icon explains the order. The design request says it "proposes; it does not decide", and ORD-01 makes this the owner's choice. So the gate is a one-line owner confirmation, recorded under "Owner decisions, dated" before WORK-24 is built. The ordering's tiers are set in WORK-24. Condition 8 (finished debts sink, in entry order) is unchanged.

**"Borrowed in total" leaves the summary.** The relationship sentence then has to appear wherever a borrowed figure and Still owed are on screen together. That means under the summary bar (WORK-07) and in the detail beside Still owed (WORK-21). Condition 9 keeps its sentence, THE SUMMARY RECONCILES. Per order-and-the-finished principle 3, the test may be put into the state its sentence describes, and the sentence may not be edited to fit the shape. If reconciliation cannot be asserted without the tile, the tile stays, and that collision comes back to me.

---

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Timeline makes no paid/unpaid claim | The only Critical. A "Paid" mark is a false financial statement. It repeats SCR5, BLR6, BLR7 and PDR11, and **it becomes a standing ruling now**: no paid, missed, behind or on-track state on any instalment, on any surface, in any form. The form is UI-01's (see C2): upcoming instalments only, the next one labelled with the word "Next", each with date and amount, and past instalments not drawn. |
| WORK-02 | The detail is a navigation surface; PDR12 lifted for it by name | Without this ruling the detail is forbidden. **Ruled:** `#debtDetailModal` is a navigation surface, not a disclosure. PDR12 ("a new screen, modal, sheet …") is lifted for that one element only. The order-and-the-finished entry "any disclosure anywhere containing a derived figure … a control … or a live debt" does not apply to it, because it discloses nothing; it is where a debt's controls live. Everything else stays refused: no `<details>` holding a figure inside the detail, no new `editCtx.kind`, no new harness runner, no other new modal. The probe helper that opens the detail is a function inside `debts.js`, not a second probe or runner. |
| WORK-03 | Build the detail as a full-height modal sheet `#debtDetailModal` | The detail unblocks the whole redesign. The mechanism is ruled in C1. The new element sits beside `#editModal` and below it in z-order, so the payment, settle, edit and history sheets and the date picker stack over it. Back closes only the top layer through the existing modal stack and `pendingBacks`. The debt id is held as `data-debt-id` on the open element. **This is ruled permitted by name:** it identifies an open surface, as `editCtx` does for `#editModal`, and the list's render never reads it to arrange the list. The bell keeps handing off straight to `#editModal`. Add a navigation.js flow: payment over the detail, Back closes the payment sheet only, the next Back closes the detail, and no history entry is left behind. |
| WORK-04 | Detail carries the ledger and every card fact | Without it, D6 removes the only way to correct a payment. Shape per C4: a "Payments" row that calls `openDebtHistoryModal(id)` unchanged. The detail also carries the note, the stated `dueDate`, "X paid of Y", the cost chip, and the three helper lines with their gates as written. **Standing rule from here on: the detail carries every fact the card carried. A card fact without a home in the detail blocks removing the cards.** |
| WORK-05 | Rate leaves the row; `debtRateLineHTML(d)` extracted unchanged and rendered verbatim once in the detail | This keeps the ruled rate sentences word for word: EFR1, "on what you still owe", the flat fallback, the ask line, and no line at 0%. It also removes the "0% in coral" defect for free. **The owner is to be told of the trade-off UI Review names: each loan's cost is no longer visible on the list. That was a deliberate choice.** |
| WORK-06 | Footer depends on `debtSettled` | This keeps the settle undo (the property the fold condition protects) and keeps Condition 10. Live: "+ Payment" (primary) and "Mark settled" (secondary, the bell's word). Settled: "Settled on {date} · Change", which opens the existing settle sheet, plus a demoted "+ Payment" at 44px. The detail shows ✓ Cleared and the settled-short line. The `data-debt-*` attributes and aria-labels stay identical. "Settle early" is not used, because it is false for an overdue debt. |
| WORK-07 | Summary sentences stay visible, with no ⓘ | This applies Reversal 1. |
| WORK-08 | Bar = totalPaid ÷ (totalPaid + totalOutstanding); add a settled-short debt to the condition 9 fixture | Otherwise two figures on the hero contradict each other at the moment the user finishes. XS, and it stays P1. |
| WORK-09 | Harness re-anchoring | Approved as a rule for every slice, **not as a separate work item**. Each flow that clicks a card control is re-pointed at the detail control in the commit that moves the control. That covers `debts.js`, `accounts.js` (whose `#debts button[data-debt-*]` scope must widen to take in the detail) and `perf.js`. Rows get `data-debt-open`. Any condition whose sentence names a "card" (the 390 one-complete-card guarantee, Condition 10, the bell-parity condition) is restated by this ruling against the row or the detail, and the restatement lands in the commit that removes the card (ARCH-01). No count threshold or sentence is relaxed to keep a flow green. |
| WORK-10 | Detail re-renders after every write and closes on `EDIT_TARGET_GONE_MSG` when its debt is gone; cross-window flow | Without it, figures stay stale after a write or after another window deletes the debt. `renderDebts` refreshes the open detail as its last step. |
| WORK-11 | Extract `deleteDebt(id)` unchanged; danger button in the edit sheet; closes the edit sheet and the detail together | A copied delete cascade would drift from the original. Extraction is the smallest change. |
| WORK-12 | One `debtNextDate(d, today)` and one urgency function | The row, the sort, the detail and the bell must read one date, or they drift apart. The function is extracted from `computeReminders` unchanged, and the bell switches to it with no behaviour change. It uses the existing card threshold, not 14 days. Coral appears only for a `dueDate` that has passed, never for an instalment (BLR1). A cleared debt is never overdue. The text always states the state. |
| WORK-13 | Fold stays the native `<details class="more-fields">`, "Cleared (N)", restyled only | "Paid off" is false for a debt settled short. The summary string is closed, and ODR2 refuses a hand-rolled disclosure. |
| WORK-14 | Hero at `--t-hero` | Applies Reversal 2. Measure at 320. |
| WORK-15 | The ring keeps "repaid", visibly and in the accessible name; floor rule from `pctLabel` | Restores the fix for a recorded ambiguity: without the word, "30%" reads as 30% left. |
| WORK-16 | Ring and timeline graphics at 3:1 using `--text-3`; "Next" as a word; both pairs added to `check-contrast.mjs` | WCAG 1.4.11 needs 3:1 for meaningful graphics, and colour must not be the only signal. |
| WORK-17 | Drop "A bank loan is typically 18–24%" and "Why this matters ›" | The first is an unsourced market claim the app cannot update offline. The second would be a disclosure holding a disclosure sentence. The ruled sentence is the explanation. The comparison can come back only through product-strategy.md's assumptions table with a source. |
| WORK-18 | Tile labelled "Final instalment", with the stated `dueDate` beside it | Removes the past/future misreading (C8). **The detail may show `debtPayoffDate` beside `dueDate`, never in its place.** PDR1 is untouched: neither fact replaces the other, and PDT-01's closure against "paid off" wording carries over. |
| WORK-19 | Row is one native button, at least 44px, with an accessible name and focus treatment; footer buttons at least 44px; scroll area padded by the footer's height | Keyboard and screen-reader users must be able to reach the detail. On a full-height sheet the footer sits at the bottom of the sheet with safe-area padding. Focus returns to the row through the modal stack's `returnFocus`. |
| WORK-20 | Pre-fill = min(agreed amount, still owed), field selected; no pre-fill without a schedule; button labelled "+ Payment" | Without the cap, one tap could bring back the overpayment state. Label per C7. The remainder chip and `data-qa-exact` are untouched. |
| WORK-21 | Relationship sentence in the detail beside Still owed, ungated | The detail prints "Borrowed ₮X" next to "Still owed ₮Y" from the day it exists, so per C36 the qualification goes with it. It builds with WORK-04, not after WORK-07. |
| WORK-22 | One bounded `debtScheduleOccurrences(d)` | Prevents a fifth copy of the schedule walk and a 600-row timeline. Its own commit, before WORK-01. The solver is untouched. |
| WORK-23 | One add entry point; vocabulary "debt / borrowed money" | Two controls for one action is two things to learn. **Shape:** the existing `#debtAddFields` `<details>` stays the single entry, its summary reading "+ Add debt" in Ink styling. No separate pill is added, because a pill that toggles the disclosure is a second control. Moving the form into a sheet stays deferred. |
| WORK-24 | Sort: overdue (by `dueDate`), then soonest WORK-12 date, then no date; ties fall back to the ORD-01 key; no on-screen explanation; 8b fixture uses dates relative to today | Applies Reversal 3. **Entry gate: the owner's one-line confirmation, recorded in HANDOFF.** 8b's replaced comment and flow header are repaired in the same commit. |

## Rejected Improvements

The EM handed me 24 WORK items and I approve all 24, in the shapes above. What I reject are the competing shapes and the parts of the design that the approvals replace.

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-03 (UI-13's shape) | Detail as a `.screen` sub-screen | Rejected in C1. It needs screen-level history (off limits; Android Back would otherwise exit the PWA) and a "current debt" module variable that outlives the render (off limits). `navigate()` also scrolls to the top on every screen change. |
| WORK-04 (UI-03's shape) | Inline payments list in the detail | Rejected in C4. It duplicates the history modal's list and its per-payment delete, so two copies would drift. |
| WORK-14 (CODE-15's shape) | Keep 48px and generalise `fitQuickAmount` into `fitToWidth(el)` | 48px is a sixth headline size. The fit-to-width code is speculative until 36px is measured to fail at 320. |
| WORK-20 (CODE-09's label) | Button labelled with the pre-filled figure | Rejected in C7. |
| WORK-23 (CODE-20's shape) | A separate pill that opens and focuses the disclosure | A second control for one action. |
| D2 ⓘ (design) | Summary explanation behind an info sheet | Reversal 1. |
| D10 "Paid" state and past instalments drawn (design and CODE-01's alternative) | Timeline instalments marked paid, or past dates drawn neutrally | WORK-01 and C2. |
| D11 "Settle early" and "Pay ₮next" (design) | Single-state footer copy | WORK-06 and C7. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| (part of WORK-14) | `fitToWidth(el)` generalisation | It is approved only if the 320 measurement at `--t-hero` with the long-lender fixture overflows, or when the language layer arrives and the hero overflows in Mongolian. It must generalise `fitQuickAmount`, not copy it. |
| (part of WORK-07) | Shortening the gated cost sentence | A separate request against ABR7 that carries ABD3's measurement. |
| (part of WORK-17) | Market comparison line | An entry in product-strategy.md's assumptions table with a source, then its own request. |
| (part of WORK-23) | Add form moved into a sheet | A request showing the inline form costs the 390 row guarantee. |

---

## Conflict Rulings

**C1. Detail as `.screen` or modal sheet. Ruled: a full-height modal sheet, `#debtDetailModal` (CODE-02).**
Both reviewers want the same behaviour: land back on the debt after a payment, sheets over the detail, and Back closing only the top layer. Only the modal delivers it without breaking a standing rule:
- The modal stack is the app's only user of history. Screen-level history is deferred and on the off-limits list, so on a sub-screen Android Back exits the app.
- A sub-screen needs a "current debt" variable to survive `refreshFromStorage`. A module-level variable that outlives the render is off limits.
- `navigate()` scrolls to the top, which loses the user's place in the list. A modal never moves the page (`scrollRestoration = 'manual'`), so closing the detail returns the user to the list exactly where they were. That gives UI-13 its "scrolled to that row" for free.
- UI-13's objection was that a sheet "stacks a second modal layer (a new mechanism)". It does not hold: `#datePickerModal` already stacks over another modal today. The payment sheet opens in `#editModal` over the detail. It does not replace the detail.

Severity stays as each reviewer set it (CODE-02 High, UI-13 Medium); only the reviewer may set severity. Plan on M.

**C2. Past instalments on the timeline. Ruled: not drawn (UI-01).**
Past instalments drawn in a "neutral style" are still a list of past obligations next to future ones, and a timeline's visual grammar reads earlier as done. BLR6 also bars any on-screen prompt about an instalment that has already fallen due. Drawing nothing is the smallest shape and makes no claim. What was actually paid is the Payments ledger, the user's own record. CODE-01's other option (drop D10, keep D9) is not needed, because the upcoming-only timeline is ruled safe.

**C3. Severity of the summary ⓘ (High vs Medium).** Severity stays with each reviewer. The remedy is identical and the item is P1 either way. On the cost sentence: visible and not shortened in this phase (Reversal 1). UI-04's reading governs.

**C4. Where the ledger lives. Ruled: a "Payments" row opening `openDebtHistoryModal(id)` unchanged (CODE-03).**
It reuses the one existing list and the one per-payment delete. The history sheet stacks over the detail and closes back to it. A detail for a debt with no schedule is not empty, because it carries every card fact (WORK-04). WORK-04 is re-estimated at S.

**C5. Severity of the bar denominator (High vs Medium).** Severity stays with each reviewer. The fix is the same and is approved (WORK-08), P1.

**C6. Hero size. Ruled: `--t-hero` (UI-08).** See Reversal 2. Fit-to-width is deferred until a measurement shows it is needed.

**C7. Payment button label. Ruled: "+ Payment" (UI-17).**
A button labelled with an amount reads as if tapping it records the payment. "+ Payment" is already the card's and the bell's vocabulary, so the aria-labels and harness anchors stay stable. A figure in a 44px button at 320 also becomes the first thing to overflow once the language layer arrives. The capped pre-fill stays (WORK-20).

**C8. Tile label. Ruled: "Final instalment" (UI-14).**
Copy is UI Review's domain. The word agrees with the timeline's "Next" instalment vocabulary, and the stated `dueDate` sits beside it.

**C9. Where the relationship sentence goes. Ruled: both places, not exclusive.**
Under the summary bar (WORK-07) and in the detail beside Still owed (WORK-21). Each place shows Still owed while the user knows, or is shown, what they borrowed. It is one string rendered from one function in two places, not two copies.

**C10. Effort estimates.** Planning on the larger figure is upheld, except where a ruling removes the difference: WORK-04 drops to S under C4. WORK-03 stays M, because it carries the navigation and cross-window flows.

**EM statement overruled: "The Ink Debts redesign cannot be released until Sprint 3 is complete."** WORK-01 is a rule for code not yet written. Each slice below is complete and safe once its flows are green, so each may ship. The timeline does not ship until it is built in WORK-01's form.

---

## Development Order (Implementation Priority)

Each line is its own commit, or a tight series of commits. `npm test` stays green after every commit, at 320 and 390. Each commit re-anchors its own flows (WORK-09).

**Slice 0: rulings (this document).**
1. **WORK-02 and the C1 ruling.** Issued here. They are the entry condition for everything else.

**Slice 1: extract, no visible change.** Every later slice reuses one function per rule instead of copying it.
2. **WORK-12**: `debtNextDate` plus the urgency function. The bell switches to them with no behaviour change.
3. **WORK-05 (extraction half)**: `debtRateLineHTML(d)`. The card calls it.
4. **WORK-11 (extraction half)**: `deleteDebt(id)`. The card's listener calls it.

**Slice 2: the detail, beside the cards. The list does not change.**
5. **WORK-03**: the `#debtDetailModal` shell, opened from the card name, plus the navigation.js Back flow.
6. **WORK-04 + WORK-21**: every card fact, the Payments row, and the ungated relationship sentence beside Still owed.
7. **WORK-05 (detail half) + WORK-17**: the rate slot rendered verbatim, with no comparison line and no "Why this matters".
8. **WORK-06**: the state-dependent footer, plus the settle-undo-through-the-detail flow.
9. **WORK-11 (detail half)**: the danger button in the edit sheet, which closes the edit sheet and the detail together.
10. **WORK-10**: refresh and close-when-gone, plus the cross-window flow.

**Slice 3: cards become rows.** This starts only once the detail carries every card fact and action, so the correction path and the settle undo are never missing.
11. **WORK-19 + WORK-15 + WORK-16**: rows replace cards, card controls are removed, the contrast pairs are added, and the "card" conditions are restated against the row and detail in this same commit.
12. **WORK-13**: fold restyle.

**Slice 4: summary.**
13. **WORK-08**: bar denominator, plus the settled-short debt in the fixture.
14. **WORK-07**: Borrowed leaves the summary; both sentences visible; condition 9 held per its sentence.
15. **WORK-14**: hero at `--t-hero`, measured at 320.

**Slice 5: schedule surfaces.**
16. **WORK-22**: bounded occurrences walker, its own commit.
17. **WORK-01**: upcoming-only timeline with "Next".
18. **WORK-18**: "Final instalment" tile.
19. **WORK-20**: capped pre-fill behind "+ Payment".

**Slice 6: last.**
20. **WORK-23**: single add entry, restyled.
21. **WORK-24**: sort. Gated on the owner's recorded confirmation.

**Reasoning.** Extraction comes first because three later surfaces each need the same rule, and copying a rule is the drift that every ruling in this module has fought. The detail is built before the list changes, so no card action or fact is ever without a home. Rows come before the summary because rows carry the harness's biggest re-anchoring and the 390 guarantee. The schedule comes late because it is the only place the Critical could reach, and its walker must exist first. The sort comes last because it is the only item that waits on the owner and the only one that changes order over time.

---

## Architecture Strategy

**What stays.**
- A single file, no framework, offline-first, and no new storage key, schema field or migration.
- The modal stack as the only owner of history.
- `#editModal` as the shared sheet for every debt act, with the five `openDebt*Modal` functions unchanged.
- The bell's direct hand-off to `#editModal`.
- The ruled rate sentences, word for word.
- The native `<details>`/`.more-fields` as the only disclosure primitive.
- Condition 8 and ODR4: order is never explained.
- `escapeHTML` on name and notes in every new template.

**What changes.**
- Per-debt rules leave `cardHTML` for named pure functions: rate line, next date and urgency, delete, and the occurrences walker.
- One new surface, `#debtDetailModal`, becomes the home for a debt's facts and actions. The list becomes rows that navigate to it.
- The summary hero moves to `--t-hero`.
- 8b is replaced by the due-date order, once the owner confirms.

**Off limits this quarter. Everything on the prior lists, plus:**
- Any paid, missed, behind or on-track state on an instalment, anywhere, in any form. This is permanent.
- Screen-level history or routing, introduced piecemeal for this detail or any other.
- Any second new modal or sheet. The lift of PDR12 covers `#debtDetailModal` by name and nothing else.
- A disclosure control inside the detail holding a figure or a disclosure sentence, and any ⓘ or info sheet on the Debts screen.
- A bare percentage on any list surface.
- A headline size off the type scale.
- A market figure or comparison not sourced in product-strategy.md.
- An amount-labelled action button.

**Risks I am recording, not scheduling. No reviewer raised these as findings.**
- **Three stacked modal layers.** In the detail, opening Edit and then the date picker gives three layers. Z-order must be detail < `#editModal` < picker. The navigation flow in step 5 should cover two layers at least.
- **The owner's 2026-10-19 "Left to spend" rule** subtracts "instalments due or overdue this month". When that is built, it must be reconciled with BLR6 and WORK-01. Treating an instalment as still owed on Home is close to the inference this ruling refuses on Debts.
- **The language layer** will lengthen the row line, the footer labels and the hero first. Those are where the deferred fit-to-width will be triggered.

---

## Final Recommendation (Recommended Next Action)

Build step 2: extract `debtNextDate(d, today)` and the urgency function out of `computeReminders` and the card's `dueChip`, with no change in behaviour, and switch the bell to them. Do it in one commit, with `npm test` green at 320 and 390 and the existing bell and due-chip flows passing unchanged as the proof. The rulings it needs (WORK-02, C1) are issued in this document. Every later slice reads this function, and it is the smallest commit that removes a real drift risk before any new surface exists. Before step 21, ask the owner one line, whether the Debts list should be ordered by next due date instead of smallest balance, and record the answer under "Owner decisions, dated" in `D:\3_Claude\PowerApps\reports\HANDOFF.md`.
