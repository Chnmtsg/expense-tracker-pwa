# UI Review: the Ink redesign of the Debts screen (proposed design 1a·05 / 1a·06)

Save as: `reports/ui-review-ink-debts.md`

## Executive Summary

The proposal's structure is right for the target user. Rows replace cards that each carry five emoji icon buttons, a detail screen gives the true-cost figure room, and a single "Still owed" figure leads the summary. For a stressed user with no accounting knowledge, that shell beats the current screen. The problem is in the details. Several parts state things the record cannot support, or show the module's most carefully worded claims as bare numbers. The biggest problem is D10: the schedule timeline marks past instalments "Paid". This record cannot know that. It is the inference ruled out permanently in BLR6/BLR7, and it would show a user a payment they never made. Fix that, plus the five High findings (rate on the row, the lost payment-correction path, the cost disclosure moved behind ⓘ, the settled-debt states, and how the detail is built), and the design is an improvement to ship, not a regression.

## Overall Score

**52 / 100. Significant rework needed before release.**

One Critical finding (UI-01: a false payment status) and five High findings in the proposal as written put it in the 40–59 band. Every one of them can be fixed without redesigning anything. With those fixed, the same design would score in the high 70s.

## Design parts, assessed

| Part | Verdict for the target user | Ruling it touches | What it needs |
|---|---|---|---|
| D1 Add pill | Improves (clear primary action) | none | One entry point, not two. Wording (UI-16) |
| D2 hero "Still owed" | Improves. Overturn ABL-02's premise: the tile grid it protected no longer exists | ABL-02 / ABR5 | `--t-hero` (36px), not a 48px literal (UI-08) |
| D2 explanation → ⓘ | Worse. **The ruling serves the user better** | C36, ABR1, `TS_disclosure_gated` | Model disclosure stays visible (UI-04) |
| D2 drop "Borrowed in total" | Acceptable | Condition 9 tile assertions, ABD2 | Relationship sentence stays visible (UI-04). Per-debt borrowed amount is still reachable in D7 |
| D2 progress bar | Improves | none | Base it on the two figures under it (UI-09) |
| D3 rows | Improves (shorter, easier to scan, the 390 guarantee gets easier) | the 390 geometry guarantee, the rate-sentence conditions | Rate leaves the row (UI-02). Ring caption (UI-10). Due-line rules (UI-07) |
| D4 sort | **Probably serves this user better** (puts the next obligation first, which agrees with the bell) | ORD-01, ODR5 | An owner default per ORD-01's own table. Needs a ruling to lift ODR5. Tier spec (UI-18) |
| D5 fold | Compatible | ORD-02 | Keep "Cleared (N)", not "paid off" (UI-06) |
| D6 actions leave list | Improves (removes 5 ambiguous glyph buttons per card) | Condition 10, bell parity, 20 flows | Correction path kept (UI-03). Row semantics (UI-15) |
| D7 detail | Improves | router / modal stack | `.screen` sub-screen, not a sheet (UI-13) |
| D8 true-cost card | Improves. The mission figure finally gets room | EFR1, ruled rate wording | Ruled wording kept (UI-02). Drop market claim (UI-12) |
| D9 tiles | Mixed | PDT-01 / PDR1 | "Last payment" renamed (UI-14) |
| D10 timeline | **Defect as specified** | BLR5–BLR7 | No paid/unpaid marks (UI-01). Contrast (UI-11) |
| D11 sticky footer | Improves | payment-sheet condition, Condition 10 | Pre-fill is capped at what is still owed (UI-17). Settled state (UI-05) |

**Answers to the request's questions, from the UI side.**
1. **D2 hero size:** overturn it, at `--t-hero`. **D4 sort:** overturn it, if the owner confirms. Same-due-date and no-due-date debts fall back to the ORD-01 key, and nothing on screen explains the order. **D2 ⓘ:** keep the ruling, so the design changes (UI-04).
2. Yes, "Borrowed in total" can leave. The ungated relationship sentence then matters more, not less: this user knows "what reached their hands", and Still owed will sit visibly above it.
3. Use a `.screen` sub-screen (UI-13).
4. The rate sentence and its gated ask line live once, in the detail's true-cost card, in the ruled wording. The row shows no rate (UI-02).
5. Suggested build order: (a) sub-screen detail. It carries every existing action (Pay, Payments, Mark settled, Edit, Delete), and the harness re-anchors on the detail while the cards still exist. (b) Rows replace cards, the actions leave the list, the fold is kept. (c) Summary block. (d) True-cost card and schedule list. (e) Sort, if ruled. Each slice moves its own flows: a flow that clicks a card control is re-pointed at the detail control in the same commit, never afterwards.

## Strengths

- **D6 removes the screen's worst clutter.** Each card currently ends in `+ Payment 📜 ✓ ✎ ✕` (`expense-pwa/index.html` 11853–11857). That is four glyphs a user without training cannot read, and one of them deletes a ledger. Today they wrap to a second row at 320 (comment at 1949–1960).
- **D8 puts mission item 2 at the size it deserves.** Today the yearly cost is a 13px sentence inside a card (`.debt-rate`, 1920). The detail card makes it the subject of the screen.
- **D2's bar answers "how far through am I" at a glance.** The summary comment (11386–11392) names that as the question the block exists to answer.
- **D11 shows no predicted saving for early settlement,** which complies with product-strategy.md.
- **D5 is compatible with ORD-02** as long as the fold stays the native `<details>`.

## Findings

**UI-01 — The schedule timeline marks instalments "Paid", which the record cannot know**

- Severity: Critical
- Location: Detail (D10). Ruling `reports/chief-architect-the-bell-and-the-schedule.md` BLR5–BLR7 (lines 201–203). HANDOFF "Nothing marks an instalment paid and nothing says behind or missed".
- Evidence: D10 specifies "Paid (filled teal)". The record stores `{instalment, count, firstDue}` and a payment ledger with no link from a payment to an instalment. Marking an instalment paid means inferring it from amounts or dates. BLR7 refuses that permanently, and BLR6 refuses any paid/unpaid mark.
- Impact: A user who skipped March sees March filled teal and believes they are on track. That is a wrong financial statement, on the screen meant to break the debt loop. The reverse error (paid but shown unpaid) is just as possible.
- Recommendation: The timeline lists **upcoming** instalments only: the next one on or after today labelled with the word "Next", then the rest in one neutral style, each with date and amount. Past instalments are not drawn. What was actually paid is the payments list (UI-03), which is the user's own record.
- Effort: S

**UI-02 — "NN% / yr" on each row is a bare percentage that mixes two different measures and paints 0% in the alarm colour**

- Severity: High
- Location: List rows (D3). `expense-pwa/index.html` 11733–11813 (rate comments and `rateLine`). `.debt-rate` comment 1915–1919. Ruling `chief-architect-effective-rate.md` EFR1.
- Evidence: (1) The ruled copy forbids "a bare percentage", and the `.debt-rate` comment refuses "a bare percentage … beside a different bare percentage". The row puts "81% / yr" next to a ring reading "40%". (2) Unscheduled debts carry the flat figure ("of what you borrowed"). Scheduled debts carry the equivalence figure ("as much as a loan charging … on what you still owe"). The same loan gives very different values under each, and "NN% / yr" makes them look comparable across rows. (3) A 0% family loan renders in coral. The design's own rule is that colour signals state, and Condition 2 removes cost captions from interest-free debts. (4) The gated ask line ("Add the date this has to be repaid by…") has no slot on a row. Its earlier absence was a High finding, because two users saw different screens with no reason given. (5) D8 drops "on what you still owe" from the ruled sentence.
- Impact: The user compares loans on figures that measure different things, reads family money as alarming, and is never asked for the date that would make the cost computable.
- Recommendation: The row's right side shows still owed only. The rate appears once, in D8, using whichever ruled sentence applies, word for word. Debts with no rate show no line. Costly debts with no term show the ask line in D8's place. Colour on the D8 figure follows the existing `.debt-rate b` rule.
- Effort: S

**UI-03 — The detail has no payments list, so a mis-entered payment can no longer be corrected**

- Severity: High
- Location: Detail (D7–D11). `expense-pwa/index.html` 11854 (`data-debt-hist`) and 12127 (`data-debt-pay-del` inside the history modal).
- Evidence: D6 lists "history/schedule" among the buttons leaving the list. The detail spec covers a schedule timeline, two tiles and a footer, with no payment history. Today 📜 is the only way to delete a single payment. A debt without a schedule (most family loans) would get a detail page with nothing below the tiles.
- Impact: A user who types ₮1,700,000 for ₮170,000 can only delete the whole debt. That is the overpayment state three derivations were hardened against, with the fix removed.
- Recommendation: The detail carries a "Payments" section for every debt, listing date, amount and the per-payment delete exactly as the history modal does today. The schedule section (UI-01) appears above it only when a schedule exists.
- Effort: M

**UI-04 — Moving the summary explanation behind ⓘ hides the cost disclosure while the cost figure is on screen**

- Severity: High
- Location: Summary (D2). `expense-pwa/index.html` 11426–11474. `tools/harness/debts.js` 2678–2688 (`TS_disclosure_gated`). Ruling `chief-architect-above-the-list.md` ABR1, C36 travel test.
- Evidence: D2 keeps "Cost so far ₮Y" in coral on screen and moves the paragraph saying the figure is this app's even split ("may not match your lender's own statement") behind ⓘ. The same sentence also qualifies the cost figure in each detail. An ⓘ sheet would also be a third disclosure control on the screen, which is off-limits.
- Impact: Mission item 2's figure is shown as fact about a contract the app has never seen. The user meets the lender's different statement and concludes either that the app is wrong or that they are, and both readings are false. Dropping "Borrowed in total" makes the ungated sentence more necessary: the user remembers what reached their hands and will see Still owed exceed it.
- Recommendation: Keep the ruling. Under the bar, render the ungated relationship sentence, plus the cost sentence when `showCost`, both visible. The design's ⓘ is dropped. Shortening the gated sentence (for example, moving the "Left over on Home" scope clause elsewhere) is a separate request against ABR7 and must carry ABD3's measurement.
- Effort: S

**UI-05 — The footer and detail do not define the settled state, and the undo path is unclear**

- Severity: High
- Location: Detail footer (D11) and D7. Condition 10 (`debts.js` 1025–1031). ORD-02 undo condition (`debts.js` 2903–2918). `expense-pwa/index.html` 1934–1948.
- Evidence: The footer is always "Settle early" plus a teal "Pay ₮next". For a cleared debt, "Settle early" is false, and a teal Pay brings back the solicitation Condition 10 removed. The undo for a mistaken settle runs through ✓ today, and the design names no replacement. "Settle early" is also wrong copy for a debt past its due date.
- Impact: A user who marked the wrong debt settled has no visible way back. A finished debt keeps pushing payments.
- Recommendation: For a live debt: "Mark settled" (secondary, the wording the bell already uses) and "+ Payment" (primary). For a cleared debt: the footer shows "Settled on <date> · Change" (opening the existing settle sheet, where an empty date undoes the settle) and a demoted "+ Payment". The detail shows ✓ Cleared and the settled-short line in place of "Still owed".
- Effort: S

**UI-06 — "N paid off · show" is a false label for debts settled for less**

- Severity: Medium
- Location: List fold (D5). `expense-pwa/index.html` 11605–11610 and 11873. `debts.js` 2896–2901.
- Evidence: The group keys on `debtSettled`, which includes debts settled short. "Paid off" asserts the money was repaid. "· show" suggests a custom toggle, and ODR2 refuses a hand-rolled disclosure.
- Impact: A user who settled early for less reads that they paid in full, which contradicts the settled-short line inside.
- Recommendation: Keep the native `<details class="more-fields">` with its exact summary "Cleared (N)" and chevron, restyled only.
- Effort: XS

**UI-07 — The due line's colour thresholds and date source are undefined, and the bell, the card and the design use three different windows**

- Severity: Medium
- Location: Rows (D3). `expense-pwa/index.html` 11815–11824 (card warning at ≤30 days). Bell `daysAhead` (7 in fixtures). Rulings BLR1, PDR1.
- Evidence: The design specifies amber "within 14 days". The card uses 30, and the bell uses the user's notification window. The spec does not say which date the line shows. For a scheduled debt, "overdue" on an instalment is refused (BLR1), and a cleared debt is never overdue (flow at `debts.js` 1203).
- Impact: Amber means three different things across the app's surfaces, so colour stops carrying meaning.
- Recommendation: The due line shows the same date the bell states (the nearer of `dueDate` and the next instalment on or after today). Coral only when `dueDate` has passed, never for an instalment. Amber uses the existing card threshold. Cleared rows show no urgency colour. The text always states the state ("overdue 10d", "due in 4d"), so colour is never the only signal.
- Effort: S

**UI-08 — The 48px hero is off the type scale and overflows at 320**

- Severity: Medium
- Location: Summary (D2). Type tokens at `expense-pwa/index.html` 140–146. `.debt-total-value` at 1987.
- Evidence: The request measured "₮150,050,000" at 48px/600 as 304px wide against 280px available at 320. The scale already has `--t-hero: 36px`, which puts the same string at about 228px (scaled from the measurement; still to be measured). The guidelines require no horizontal scrolling and consistent sizing, and `fmtCompact` stays off this card.
- Impact: The hero wraps mid-number or scrolls sideways on the cheapest phones. Zoom is off by the owner's decision, so there is no fallback.
- Recommendation: `font-size: var(--t-hero)`. The figure is no longer a tile in a grid, so ABL-02's "four move together" premise no longer applies and the hierarchy argument favours the design. Measure at 320 in the long-lender-name fixture.
- Effort: XS

**UI-09 — The summary bar's basis does not reconcile with the figures printed under it once a debt is settled short**

- Severity: Medium
- Location: Summary (D2). `expense-pwa/index.html` 11374–11417. Condition 9 (`debts.js` 930–966).
- Evidence: "Paid ÷ total to repay" uses the agreed total. "Still owed" counts a settled debt as ₮0 (SET-02), so with a settled-short debt, paid plus still owed is less than agreed. Condition 9's fixture has no settled debt. If every debt is settled short, the bar stops below 100% under "Still owed ₮0".
- Impact: The bar contradicts the headline figure at the moment the user finishes.
- Recommendation: Bar length = paid ÷ (paid + still owed), the two figures printed directly beneath it. Add a settled-short debt to the condition 9 fixture.
- Effort: XS

**UI-10 — The progress ring drops the "repaid" caption that was added to resolve an ambiguity**

- Severity: Medium
- Location: Rows (D3). `expense-pwa/index.html` 1900–1914 (`.debt-pct-label` comment).
- Evidence: The comment records that a debt's percentage reads equally well as the share repaid or the share still owed, which is why "repaid" was added. The ring shows the bare number.
- Impact: A user reads "30%" as 30% left, the opposite of the truth.
- Recommendation: Put the word "repaid" under the ring, or "30% repaid" as text, and include the word in the row's accessible name.
- Effort: XS

**UI-11 — Ring and timeline graphics fail non-text contrast, and "Next" is marked by colour alone**

- Severity: Medium
- Location: Rows (D3) and timeline (D10). Ink tokens at `expense-pwa/index.html` 771–808.
- Evidence: The upcoming-ring grey #474F55 measures 2.28:1 on Ink's background. WCAG 1.4.11 needs 3:1. The ring track #253033 measures 1.29:1 on surface. "Next" differs from upcoming only by an amber ring.
- Impact: Users with low vision cannot tell upcoming items from empty space, and colour-blind users cannot pick out the next instalment.
- Recommendation: Use `--text-3` (#838F91, well above 3:1 on Ink's surface) for upcoming rings and the ring track. Print the word "Next" beside the amber item.
- Effort: XS

**UI-12 — The comparison line makes a market claim the app does not hold, and "Why this matters ›" has no defined content**

- Severity: Medium
- Location: Detail true-cost card (D8). product-strategy.md "Unverified Market Assumptions" and refinancing-referral conditions.
- Evidence: "A bank loan is typically 18–24%" is a figure nothing in the repository sources or updates. It sits beside the user's own rate in the same visual weight. The destination of "Why this matters ›" is not specified.
- Impact: The claim goes stale silently and reads as advice to refinance, which is the nearest neighbour of a rejected revenue line. An unspecified link becomes a third disclosure by default.
- Recommendation: Drop both from this phase. If the owner wants the comparison, it goes in product-strategy.md's assumptions table with a source first, then comes back as its own request.
- Effort: XS

**UI-13 — Building the detail as a full-height modal sheet would collide with the single shared edit modal**

- Severity: Medium
- Location: Detail (D7). `#editModal` hosts payment (11920), settle, history and edit sheets. Bell hand-off (`debts.js` 3148–3160).
- Evidence: Pay, Settle and Edit from the detail all open `#editModal`. If the detail is itself a sheet, it either stacks a second modal layer (new mechanism) or is replaced by the payment sheet, so the user returns to the list rather than to the debt.
- Impact: The user loses their place after every payment, which is the most frequent act on this screen.
- Recommendation: A `.screen` sub-screen reached from the row, with Back (header and system) returning to the list scrolled to that row. Focus moves to the detail heading on open and returns to the row on Back. Sheets open over it and close back to it.
- Effort: M

**UI-14 — "Last payment" is ambiguous**

- Severity: Medium
- Location: Detail tiles (D9). Ruling `chief-architect-payoff-date.md` PDT-01 and PDR1 (line 45).
- Evidence: Shown only with a schedule, so it means the final instalment date. To this user, "last payment" means the most recent one they made. The figure is currently ruled into the edit modal only. The detail is a new surface, not the card PDR1 refused, but it still needs a ruling.
- Impact: The user reads a future date as a past payment, or the reverse.
- Recommendation: Label it "Final instalment" with the date. The user-typed `dueDate` stays visible beside it, and neither replaces the other.
- Effort: XS

**UI-15 — Row and sticky-footer interaction are unspecified for keyboard and small screens**

- Severity: Medium
- Location: Rows (D6) and footer (D11).
- Evidence: The spec says "tapping a row opens the detail" and gives no element, accessible name, or focus treatment. The sticky footer's relation to the bottom tab bar, and to content scrolled beneath it at 320, is not stated.
- Impact: Keyboard and screen-reader users may not be able to reach the detail. The last timeline or payment item may be hidden under the footer.
- Recommendation: Each row is one native `<button>` (or link) at least 44px tall, named "<lender>, ₮X still owed, <due state>", with the existing `:focus-visible` ring. The footer sits above the tab bar, both buttons are at least 44px tall, and the detail's scroll area pads by the footer's height.
- Effort: S

**UI-16 — "+ Add loan" changes the module's vocabulary and duplicates the add-form entry**

- Severity: Low
- Location: Title row (D1). `expense-pwa/index.html` 3410–3415 and 11366–11369 (empty state says "add it above").
- Evidence: The form and empty state say "borrowed money" deliberately, because family money is not a "loan" to this user. The pill plus the existing `<details>` summary would give two controls for one action.
- Impact: Some users do not record money from family. Two entry points means two things to learn.
- Recommendation: One entry point labelled "+ Add debt" or "Record borrowed money". The empty-state wording must match wherever the form ends up.
- Effort: S

**UI-17 — "Pay ₮next" can pre-fill more than is still owed**

- Severity: Medium
- Location: Footer (D11). Payment-sheet condition (`debts.js` 3189–3260).
- Evidence: The final instalment can exceed the remainder, for example after an early extra payment. The payment-sheet condition exists because the final payment is the one most often typed wrong, and the observed cause of overpayment. A button labelled with an amount also reads as if tapping it records the payment.
- Impact: This brings back the overpayment state the remainder chip removed at its source.
- Recommendation: Label the button "+ Payment". It opens the existing sheet with the amount pre-filled as min(instalment, still owed), and the remainder chip stays. No pre-fill for unscheduled debts.
- Effort: XS

**UI-18 — The sort tiers say "no schedule" where they mean "no date", and ties are unspecified**

- Severity: Low
- Location: List (D4). `expense-pwa/index.html` 11564–11574. Rulings ORD-01, ODR4, ODR5.
- Evidence: A debt with a `dueDate` and no schedule has a date. "No schedule" would sink it below debts it is due before. Ties within a tier are not defined, and an unstable order makes rows shuffle between renders.
- Impact: The order looks arbitrary, which is worse than any order.
- Recommendation: Tiers are overdue (by `dueDate`), then soonest date (the UI-07 date), then no date. Ties fall back to the ORD-01 key. Finished debts stay in the fold in entry order. No word or badge explains the order (ODR4 stands).
- Effort: XS

**Review areas.**
- **Layout and hierarchy:** improved. Remaining issues are UI-04 and UI-08.
- **Navigation:** UI-13 and UI-15.
- **Typography:** UI-08. Otherwise clean.
- **Colour:** UI-02 (0% shown in coral), UI-07, UI-11.
- **Spacing:** clean in the spec, on 8px-compatible tokens (r20 = Ink's `--r-md`).
- **Cards:** clean. Ink sets one radius and no shadow.
- **Mobile:** UI-08, UI-15.
- **Accessibility:** UI-10, UI-11, UI-15.
- **States:** UI-03, UI-05. The empty state survives (D1 note in UI-16). Loading does not apply (synchronous local data).
- **Numbers and formatting:** UI-02, UI-09.

## Quick Wins

- UI-02 (S): take the rate off the row. That removes four defects at once.
- UI-04 (S): keep two existing sentences visible instead of building an ⓘ sheet.
- UI-05 (S): two footer states, using copy the bell already uses.
- UI-06 (XS): keep the shipped "Cleared (N)" `<details>`.
- UI-07 (S): one date source, one threshold, text always present.
- UI-08 (XS): one token swap fixes both the scale and the 320 overflow.
- UI-09 (XS): one change to the bar's denominator.
- UI-10 (XS): restore one word.
- UI-11 (XS): one token, one label.
- UI-12 (XS): delete two lines from the design.
- UI-14 (XS): rename one label.
- UI-17 (XS): one cap, one label.
- UI-01 (S): a change at design level. Draw upcoming instalments only.

## Estimated UX Impact

Once UI-01 and the five High findings are corrected, the user gets a list they can read in one glance: one large "Still owed", a bar that ends where their debts end, and one short row per debt saying what is owed and when the next date is. One tap opens a debt where the yearly cost is the largest statement on the page, in wording that cannot be misread, with the payments they recorded and the instalments still to come, and nothing claiming a payment they did not make. Paying stays two taps and cannot overpay. A mistaken settle can always be undone. The explanation that makes "Cost so far" honest stays on screen. The main remaining trade-off is that the cost of each loan is no longer visible on the list, only in the aggregate and on each detail. That is the price of showing it correctly, and the owner should be told it was a choice.

Key files: `D:\3_Claude\PowerApps\reports\design-request-ink-debts.md`, `D:\3_Claude\PowerApps\expense-pwa\index.html` (renderDebts 11347–11887, `.debt-*` CSS 1838–1988, Ink tokens 762–808, type tokens 140–146), `D:\3_Claude\PowerApps\tools\harness\debts.js`, `D:\3_Claude\PowerApps\reports\chief-architect-the-bell-and-the-schedule.md`, `D:\3_Claude\PowerApps\reports\chief-architect-above-the-list.md`, `D:\3_Claude\PowerApps\reports\chief-architect-order-and-the-finished.md`, `D:\3_Claude\PowerApps\reports\chief-architect-payoff-date.md`, `D:\3_Claude\PowerApps\reports\chief-architect-effective-rate.md`.
