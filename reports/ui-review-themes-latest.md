# UI Review: latest upgrades across all 16 themes (quick add v35–v37, Debts 1a·05 v38)

Scope: `D:/3_Claude/PowerApps-live/expense-pwa/index.html` (branch live-v35), `D:/3_Claude/PowerApps-live/tools/check-contrast.mjs`, and all 16 sheets in `D:/3_Claude/PowerApps-live/reports/themes-debts-1a05/` (quick-1..4, debts-1..4, detail-1..4, expenses-1..4). I checked colour judgements against the theme tokens (lines 75–761). Contrast ratios below are computed from those tokens. This review is read-only; the caller saves it as `D:/3_Claude/PowerApps-live/reports/ui-review-themes-latest.md`.

## Executive Summary

The quick add sheet holds up in all 16 themes. Every theme gets the same layout, the selected category chip is unmistakable, and nothing scrolls sideways at 360px. The Debts round works structurally: the Still owed hero, the ring, the schedule and its folds look and behave the same in every theme. Two things let it down: some themes give one colour two meanings, and the debt detail screen has text-size and copy problems. The biggest problem is on the debt detail. A debt with an agreed schedule shows "Final instalment 2027-07-15" and, in the same view, the largest text on screen asks the user to "Add the date this has to be repaid by". A user with no accounting knowledge will either type a date the app already has, or decide the app is broken. Outside that, most problems are theme-specific: flamingo paints repayment progress in the same red as overdue and cost, and nord makes Next, Overdue and later instalments almost the same pale colour.

## Overall Score

**76 / 100.** One High (UI-01) and six Mediums keep this below 90. None of them blocks a task, and every state is still spelled out in words, so the score stays in the "Solid" band rather than "Usable but fragile".

## Strengths

- Selected vs unselected category chip: the selected chip is filled with `--primary` and its text is `--on-accent`, so it reads clearly in all 16 themes. Text on the fill measures at least 4.5:1 in every theme I checked (rose is lowest at about 4.6:1).
- Schedule states never rely on colour alone. Each state has a word ("Paid", "Next", "Overdue · ₮85,000 left"), and a paid dot is filled while the others are rings (index.html 1889–1899, 12708–12718). So the colour collisions in UI-02 cost meaning but never hide a state completely.
- The ring fill against its track is held at 3:1 by `check-contrast.mjs` (lines 130–132), and the sheets show it in all 16 themes.
- Destructive actions are confirmed. Mark settled opens a modal (12655). Deleting a loan row from Expenses names the debt and how much "what you still owe goes up by" (8485–8491).
- Touch targets meet 44px: chips (1569), schedule rows (1886), row actions (1269), keypad keys at 64px (2150).
- No sheet scrolls horizontally in any of the 64 panels.

## Findings

**UI-01 — The debt detail asks for a repayment date while it shows the final instalment date**

- Severity: High
- Location: Debts → debt detail. `index.html` 12046–12047 (`debtRateLineHTML`, the `.ask` branch), styled at 1860–1861. Seen in detail-1..4, all 16 themes.
- Evidence: The top of the scrolled detail reads "Add the date this has to be repaid by to see what it costs you each year." Four rows below, the same screen shows "FINAL INSTALMENT 2027-07-15" and a 12-row schedule. The prompt appears whenever the schedule-based rate is null and the debt has no due date (`debtTermDays(d) === null`). The schedule-based rate (`debtEffectiveAnnualRate`, 11918–11935) also returns null when `sc.firstDue < d.date`, which is the normal case when someone records a loan they took out months ago and leaves the borrowed date at today. The prompt then names the wrong field: the due date. The actual blocker is the borrowed date.
- Impact: The one figure the module exists to produce ("what it costs you each year") is replaced by an instruction that contradicts what is on screen. An untrained user either enters a redundant due date, which gets the flat rate rather than the falling-balance rate the schedule supports, or concludes the app ignored the schedule they typed. This is a core module and the situation is common.
- Recommendation: Smallest safe fix: when `d.schedule` exists but the schedule-based rate is null because the first instalment is before the borrowed date, show a prompt that names that cause and links to Edit (for example, "Check the date you borrowed this: it is after your first instalment"). Show the current due-date prompt only when there is no schedule.
- Effort: S

**UI-02 — In some themes a status colour means two things on the Debts screens (flamingo, rose, nord; minor in sepia, gold, owl)**

- Severity: Medium
- Location: Debts list ring, summary bar, "Paid" schedule word and dot, `.debt-numbers .paid`, `.debt-pct` (1894–1901, 1914, 1960, 1990). All of these use `--primary-text`. Overdue and cost use `--danger-text`; Next uses `--warning-text`; later dots use `--text-2`. Seen in debts-2, detail-2 (flamingo, rose) and debts-3, detail-3 (nord).
- Evidence:
  - **flamingo:** `--primary-text #CB1508` and `--danger-text #AD1C1C` are the same red hue. The "20% repaid" figure, the ₮425,000 paid figure, the ring, the bar fill and "Record borrowed money" are painted in the same red as "OVERDUE · ₮85,000 LEFT", "overdue 18d" and "COST SO FAR ₮666,346".
  - **rose:** `#C7216B` against `#B31739`, about 14° of hue apart. They read as the same family.
  - **nord:** Next `--warning-text #F0D8A9`, Overdue `--danger-text #E4BDC1` and later `--text-2 #D8DEE9` are all pale tints. Next vs Overdue is 1.22:1 and later vs Next is 1.03:1, so the three ring states look the same and "Overdue" does not read as a warning.
  - **sepia / gold / owl:** Paid and Next hues are 5–6° apart (sepia #A24B08/#8A4C04, gold #F59E0B/#FBBF24, owl #CAA370/#E8BB68). The filled-vs-ring dot shape tells them apart, so this is the mildest case.
  - `check-contrast.mjs` measures each colour against its surface, but never compares two status colours with each other.
- Impact: In flamingo, a user's progress is painted in the alarm colour, so paying a debt down looks like a warning. In nord, the dots stop carrying any meaning. The words prevent a total loss of meaning (that is why this is not High), but the colour gives a wrong or empty first impression to everyone using these themes.
- Recommendation: Change tokens only. Give flamingo's `--primary-text` a darker coral or rose-brown hue that is clearly not red (re-measured at 4.5:1 on `--surface` and 3:1 against `--surface-3`). Give nord's `--danger-text` a more saturated red that still passes 4.5:1 (Nord's own `#BF616A` family, lightened). Then add a check to `check-contrast.mjs` that flags paired status tokens (primary-text vs danger-text, warning-text vs danger-text) when their hues are within roughly 30°.
- Effort: S for the two token changes. M if the hue check is added to the tool.

**UI-03 — The overdue schedule row shows the full instalment large and the amount actually due in the smallest text on screen**

- Severity: Medium
- Location: Debt detail → Schedule, overdue or part-paid row. `index.html` 12709–12718, 1891–1892. Seen in detail-1..4.
- Evidence: The row reads `2026-10-15 · OVERDUE · ₮85,000 LEFT · ₮170,000`. ₮170,000 is bold at `--t-sm` (13px). The money the user actually owes now, ₮85,000, sits inside an 11px (`--t-micro`), uppercase, letter-spaced label. On dark themes that label is pale (for example nord `#E4BDC1`).
- Impact: Asked "how much do I need to pay?", the user reads the biggest number on the row, ₮170,000, which is wrong by half. The most urgent fact on the screen has the weakest typography.
- Recommendation: When `left < amount`, make `left` the row amount and move the full amount into the caption ("Overdue · of ₮170,000"). Keep the state word in normal case at `--t-sm`.
- Effort: S

**UI-04 — On the debt detail, the balance figure is smaller than its own caption, and a prompt with no figure is the largest text**

- Severity: Medium
- Location: Debt detail. `index.html` 1945–1946 (`.debt-remaining` 14px, `.debt-remaining b` 15px), 1863 (`.debt-detail-figures .debt-remaining` sets `--t-h3`, 18px, on the wrapper only), 1861 (`.debt-detail-cost .debt-rate` at `--t-h3`, which overrides the subordinate `.debt-rate.ask` treatment the comment at 1938–1940 asks for). Seen in detail-1..4.
- Evidence: "₮1,615,000" renders at 15px and its caption "still owed" at 18px. In every sheet the caption is visibly larger than the number. The figure-less ask prompt renders at 18px in a tinted box and is the largest text in view. 14px and 15px are also outside the type scale (11/13/15/18/22).
- Impact: The figure the user came to see is outranked by its own caption and by a helper line. The guidelines call for a clear hierarchy and the most important information first.
- Recommendation: Put `.debt-remaining b` in the detail at `--t-h3` or larger and the caption at `--t-sm`. Give `.debt-detail-cost .debt-rate.ask` `--t-sm` so the comment at 1938 is true on the detail too.
- Effort: XS

**UI-05 — The Debts hero carries two paragraphs of explanation that push the list below the fold and refer to "this update"**

- Severity: Medium
- Location: Debts list hero. `index.html` 12366–12368 (`helperHTML`), along with `debtRelationshipSentenceHTML()`. Seen in debts-1..4.
- Evidence: About 75 words of helper text sit under the three figures. At 360×760 the hero takes about 290px and only about 1.5 debt rows are visible above the tab bar. The second paragraph says "The figure above is the part of that extra…", but three figures sit above it, and "that extra" refers to the sentence before. It also says "For payments recorded since this update…". That is release-note language: it means nothing to anyone who installs after v38, and it never goes out of date because nothing removes it.
- Impact: This adds cognitive load on the screen's first view for exactly the user this product targets. The list of debts, which is what the screen is for, is mostly off screen. Notes in the code say the block is "closed at three sentences". That is a ruling on how many sentences, not on placement or wording, so this finding stands.
- Recommendation: Replace "since this update" with a date ("since 20 October 2026"), or drop the clause when no older payments exist. `debtSpendingLineHTML` already gates on `older`, so reuse that test. Name the figure ("Cost so far is the part…"). Put the paragraph behind a one-line "What these figures mean" disclosure using the existing `.more-fields` component.
- Effort: S

**UI-06 — The quick add Expense/Income state is shown mainly by a fill at about 1.1:1**

- Severity: Medium
- Location: Quick add header. `index.html` 2219 (`.quick-modes button.active { background: var(--surface-3) }` on a `--surface-2` track, 1420). Seen in quick-1..4.
- Evidence: Active fill against the track measures 1.12:1 in light (#E2E8F0 on #F1F5F9), 1.14:1 in dark, 1.12:1 in oled. In the sheets the selected "Expense" segment is barely different from "Income" in light, sepia, dark, gold and oled. The label colour also changes (`--text-2` to `--text`), which is the stronger cue.
- Impact: The mode decides whether money is recorded as spending or income. Since v36 the sheet stays open in the same mode after Save, so a wrong mode repeats over several entries. "Save expense" on the button restates the mode, which is why this is Medium and not High.
- Recommendation: Give the active segment a `--primary` bottom border or a 1.5px `--border-2` outline, or use the `.segmented button.active` treatment (`--surface` plus shadow, 1428) that the rest of the app already uses.
- Effort: XS

**UI-07 — After Save, the sheet resets with only a generic "Expense added" toast**

- Severity: Medium
- Location: Quick add after Save. `index.html` 7391–7401 (`quickSaved`), 7433–7434, 5078.
- Evidence: Since the stays-open change, Save clears the amount to zero and keeps the sheet up. The only confirmation is a 13px toast reading "Expense added" or "Income added". It names no amount and no category and offers no undo. It sits at `bottom: 96px` (2708), over the keypad's bottom row.
- Impact: The owner's reason for staying open was that entries come several at a time. A user entering several cannot tell from the screen which entry was saved, or whether a double tap saved one twice. The amount display goes back to empty either way.
- Recommendation: Put what was saved in the toast: "₮12,500 · Groceries added". The values are already in scope in `quickSave`. An Undo is a separate, larger decision and is not needed for this fix.
- Effort: XS

**UI-08 — Outlined chips measure 1.4–2.0:1 against the sheet in every theme**

- Severity: Low
- Location: Quick add chips. `index.html` 2242 (`border: 1.5px solid var(--border-2)` on `--surface`). Seen in quick-1..4.
- Evidence: Outline against surface: light 1.48:1, mint 1.40:1, dark 1.69:1, midnight 1.65:1, nord 1.69:1, oled 1.91:1, gold 1.99:1. The outlines are discernible in light themes and faint on gold, owl and oled. `check-contrast.mjs` does not measure this pair, and the design request says so.
- Impact: Each chip still has a text label and icon, so WCAG 1.4.11 is not strictly failed. But the v37 change exists to make chips read as chips rather than keys, and that rests on a boundary most themes draw below 3:1. This is weakest in daylight on a phone.
- Recommendation: Use `--text-3`, or a new `--chip-outline` token measured at 3:1 on `--surface`, and add the pair to `check-contrast.mjs`.
- Effort: S

**UI-09 — One chip in the details row renders in a different font from its neighbours**

- Severity: Low
- Location: Quick add details row. `index.html` 1559–1570 (`.chip` sets no `font-family`), 3924–3926 (Date and Note are `<button>`; the account chip is a `<label>`). The same applies to `.segmented button` (1423).
- Evidence: Buttons do not inherit the body font, but labels do. "No account" renders heavier and in a different face from "Today", "Note" and the category chips in all four quick sheets.
- Impact: Inconsistent sizing and weight inside a single row of the same control. The guidelines require consistent typography.
- Recommendation: Add `font-family: inherit` to `.chip` and `.segmented button`.
- Effort: XS

**UI-10 — The loan row's pencil icon opens the debt instead of editing**

- Severity: Low
- Location: Expenses → Loan payment row. `index.html` 8474. Seen in expenses-1..4.
- Evidence: The loan row uses the same ✎ glyph as the Groceries row above it. On Groceries it edits the entry; on the loan row it opens the debt detail (screen readers hear "Open {debt}"). Sighted users get no such hint.
- Impact: The same icon does two different things one row apart. Users expecting an edit form land on a different screen.
- Recommendation: Use the app's chevron (`m9 18 6-6-6-6`) or an "open" icon on loan rows.
- Effort: XS

**UI-11 — The Debts row breaks its date across two lines and abbreviates days**

- Severity: Low
- Location: Debts list row. `index.html` 12546, 13436, 1977. Seen in debts-1..4, second row.
- Evidence: "Next payment 2026-" / "10-15 · overdue 5d" breaks the date at its hyphen in all 16 themes. "overdue 18d" uses a unit abbreviation found nowhere else in the module.
- Impact: The most time-sensitive line on the row is the hardest one to read.
- Recommendation: Wrap the date in a `white-space: nowrap` span and write "overdue 5 days".
- Effort: XS

**UI-12 — On near-black themes the ring and bar track can barely be seen against the card**

- Severity: Low
- Location: `.debt-ring` and `.debt-summary-bar` tracks (1960, 1989) in oled, gold, dark and midnight. Seen in debts-3, debts-4, detail-3, detail-4.
- Evidence: Track (`--surface-3`) against card (`--surface`): oled 1.20:1 (#1F1F1F on #0A0A0A). On oled and gold the ring looks like a loose arc and the bar like a short stub. Fill against track does meet 3:1.
- Impact: "18% of what" depends on seeing where the track ends. The percentage label carries the meaning, so this is polish.
- Recommendation: Draw the track in `--border-2`, or add a 1px `--border` ring, in those themes.
- Effort: XS

**UI-13 — Mint and forest paint debt and expense figures in their success green**

- Severity: Low
- Location: Theme tokens: mint `--text #14532D` vs `--success-text #107435` (549, 535); forest `#064E3B` vs `#04714F` (315, 302). Seen in quick-1/quick-2 (the expense amount), debts-1/debts-2 (Still owed hero).
- Evidence: "₮12,965,000 still owed" and the expense amount on quick add are rendered in near-success green.
- Impact: In those themes green means both "normal text" and "good or income". The words make it clear, so the cost is a weaker signal rather than a wrong one.
- Recommendation: Leave the theme hue, but render the Still owed hero and `.quick-amount` in a neutral dark (a darker, less saturated green-grey) in these two themes.
- Effort: S

## Review areas

- **Layout and Hierarchy:** UI-04, UI-05, UI-03.
- **Navigation:** Clean. Debts is reachable via More, More stays highlighted, the detail has Back (12740), and the quick add close X is always present.
- **Typography:** UI-04, UI-09, UI-11.
- **Colour and Theme:** UI-02, UI-13, UI-12.
- **Spacing:** No cramping observed. `.debt-row` padding of 14px (1796) is off the 8px scale; the stylesheet records it as a known replacement under the standing convention, so I raise no new finding.
- **Cards:** Clean within scope. Debt rows still render as bordered cards rather than "rows"; the comment at 1797–1800 records this as a ruled divergence.
- **Mobile:** Clean. No horizontal scroll, targets at least 44px, and the full-screen quick add fits at 360×760.
- **Accessibility:** UI-06, UI-08. The focus ring is `--text` with offset in all 16 themes (177), and `.quick-pick` moves the ring onto the chip (2257). I could not test keyboard behaviour from static sheets.
- **States:** UI-07. Destructive actions are confirmed. Not assessed, because no sheet shows them: the bell's missed-instalment item, the Pay prefill, the Payments sheet, the quick add Income mode, and the post-save sheet state.
- **Numbers and Formatting:** UI-03. Currency is formatted the same way everywhere (₮ with thousands separators); ISO dates are used consistently across Debts and Expenses.

## Quick Wins

- UI-01: S. Change the prompt condition and wording; this removes the only High.
- UI-04: XS. Two font-size declarations fix the inverted balance and caption sizes.
- UI-06: XS. One rule makes the mode state visible before it repeats across saves.
- UI-07: XS. Put the amount and category, already in scope, into the toast string.
- UI-03: S. Swap which amount is primary on part-paid rows.
- UI-05: S. Replace "since this update" and fold the paragraph.
- UI-02: S. Two token changes (flamingo `--primary-text`, nord `--danger-text`) fix the worst collisions.

## Estimated UX Impact

Once UI-01 is fixed, a user who records an existing loan with a schedule gets either the cost figure or an instruction that matches what they see, instead of an instruction contradicted four rows below it. That removes the most likely reason for an untrained user to give up on the Debts detail. Together with UI-03 and UI-04, the detail would lead with what is still owed and what is due now, at sizes that match their importance. Fixing UI-02 means a flamingo user's repayment progress no longer reads as an alarm, and a nord user can tell an overdue instalment from a future one at a glance. Fixing UI-06 and UI-07 means a user entering several quick-add items in a row can see which mode they are in and what each Save recorded.
