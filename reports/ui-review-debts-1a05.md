# UI Review: Debts 1a·05, Debt detail 1a·06, and one payment record in Debts and Expenses

Scope: the proposal in D:/3_Claude/PowerApps-live/reports/design-request-debts-1a05.md, its pictures D:/3_Claude/PowerApps-live/reports/design-debts-1a05.png and D:/3_Claude/PowerApps-live/reports/design-debts-1a06.png, and the live code they would replace in D:/3_Claude/PowerApps-live/expense-pwa/index.html (branch live-v35) and D:/3_Claude/PowerApps-live/tools/harness/debts.js. I read the ink branch as prior art (D:/3_Claude/PowerApps/expense-pwa/index.html and D:/3_Claude/PowerApps/reports/chief-architect-ink-debts.md). Ink rulings are cited as evidence of problems already found. They are not treated as standards for live.

The design is not built yet, so keyboard behaviour, focus and exact contrast are reviewed as requirements on the build. They are not counted as observed failures.

## Executive Summary

The proposal fixes a real problem. Today each live debt card carries five icon buttons, up to three helper sentences and four chips (index.html 12154–12191). The summary adds two more paragraphs on top. The rows-plus-detail shape is the right correction, and the owner's one-record payment removes the double entry they complained about. The biggest problem is in the connection, not the pictures. Live told users to log loan repayments as expenses themselves (index.html 13750–13753, 6101–6102), and the owner's own words confirm they did. If every existing db.debtPayments record starts counting as spending, those users' past Expenses totals, Home "Left over" and Insights double overnight. Two more problems stack on top. The pictures disagree with themselves about which instalment is next. And removing the explanation text also removes the sentences that make "Borrowed ₮1,500,000 / Still owed ₮1,700,000" make sense.

## Overall Score

**48 / 100.** One Critical finding (wrong spending figures for existing users when they upgrade) and six High findings put this in the 40–59 band. Most of the screen-level fixes are XS or S corrections to the design. None of them needs a redesign.

## Strengths

- **One action per row.** Replacing five per-card buttons with a row that opens a detail removes the main source of clutter on the live screen (index.html 12180–12186). This meets "reduce cognitive load" directly.
- **The answer comes first.** "Still owed" as the hero, above the list, is the question the screen exists to answer.
- **Every coloured state also has a word.** Overdue, Due, No schedule, Paid and Next are all written out, so colour is never the only signal (with one exception, UI-12).
- **One payment record, shown in two places.** This removes the owner's double entry at the source rather than with a reminder.
- **Settled debts collapse under the list.** This keeps the glance on money still owed. Live already does this with the "Cleared (N)" fold.

## Findings

**UI-01 — Existing loan payments would be counted twice in spending the moment F1 ships**
- Severity: Critical
- Location: Expenses list and total (index.html 8210–8219), Home "Left over", Insights category totals. The connection F1/F3 in design-request-debts-1a05.md.
- Evidence: Live tells the user a debt payment does not create an expense and that "they log it as an expense themselves, once" (13750–13753). The reminders block says the same: "record the repayment as an expense themselves" (6101–6102). The owner's request is "we don't write two times our debt", so they did write it twice. F3 says existing expenses are not touched. F1 then makes every db.debtPayments record appear as an Expenses row and count in totals. Nothing in the proposal limits which payments do that.
- Impact: For every user who followed the old instruction, every past month's spending figure (Expenses total, Home, Insights) silently goes up by their loan payments. These are wrong financial figures, delivered by an upgrade, to users who cannot tell why.
- Recommendation: No past period's spending total may change on upgrade without the user being told. The smallest safe shape is that only payments recorded after this release count as spending, and earlier payments stay Debts-only exactly as they are today. The data mechanism is Code Review's call. The rule above is the requirement. If older payments are ever brought in, it has to be a one-time, explicit choice that names the count and the amount.
- Effort: M

**UI-02 — "Next" and "Due" disagree between the row, the detail, the bell and the Pay button, and the schedule has no overdue state**
- Severity: High
- Location: 1a·05 row "Хүн ам банк бус · Due 15 Nov"; 1a·06 schedule "15 Oct · Next" and "Pay ₮170,000"; the bell's "Agreed payment" item (index.html 6114–6124, harness debts.js 2950–2999).
- Evidence: The pictures fix "today" at about 19 Oct ("Due 1 Nov · in 13 days"). For the same debt, the list says the next date is 15 Nov while the detail says 15 Oct is Next, which is already four days past, and paints it amber, the "coming up" colour. The live bell picks the nearest calendar instalment on or after today and ignores payments. The owner's rule (decision 2) picks the first unpaid instalment by allocation. These give different dates whenever the user is ahead or behind.
- Impact: The user cannot tell what they owe or when. A missed instalment shows as "Next" in amber rather than as overdue, which understates the one state that needs action. The bell and the screen will contradict each other.
- Recommendation: Define one derived "next instalment" (first unpaid by the owner's allocation rule, with its remaining amount) and use it in the row, the detail, the Pay prefill and the bell. Add a third schedule state for an unpaid instalment whose date has passed: the word "Overdue" plus the coral already used for overdue rows. Show a part-paid instalment as "Next · ₮X left", as decision 2 already requires.
- Effort: M

**UI-03 — D6 removes the sentences that make the figures add up, and the pictures show the confusion it causes**
- Severity: High
- Location: 1a·06 header and tiles; 1a·05 summary. Live sentences at index.html 11799, 11801, 12189, 12190.
- Evidence: 1a·06 shows "Borrowed ₮1,500,000", two instalments Paid, and then "Still owed ₮1,700,000". The live code records exactly this state ("Still owed larger than Borrowed in total ... the rational readings are 'the app is wrong' or 'I typed something wrong'", 11757–11765) and answers it with one sentence: "'Still owed' includes anything you agreed to pay on top of what you borrowed." D6 deletes that sentence. It also deletes the cost caveat (an even split that "may not match your lender's own statement") and the overpaid and settled-short reconciling lines.
- Impact: A user with no accounting knowledge sees that they owe more than they borrowed after paying ₮340,000, and concludes the app is wrong. This is the module's main figure.
- Recommendation: Keep exactly one short line under the hero ("Still owed includes what you agreed to pay on top of what you borrowed"), and the same string beside "Still owed" in the detail. Move the cost caveat and the overpaid and settled-short lines into the detail, under the figure each one explains. Everything else in D6 can go.
- Effort: S

**UI-04 — "30% / yr" on rows is a bare percentage that mixes two different measures**
- Severity: High
- Location: 1a·05 row right column ("30% / yr", "119% / yr", "81% / yr", "0%"); live rate line at index.html 12098–12141.
- Evidence: Live has two rate sentences for two different questions. One is a flat cost as a share of what was borrowed, for debts with no schedule. The other is the equivalent of a loan charging X% on what you still owe, for debts with a schedule. Each is worded so that neither reads as an interest rate. The row puts whichever one applies into the same "/ yr" slot, so on one screen a flat figure sits next to a falling-balance figure as if they were comparable. "Ээж" shows "0%" in coral, although live deliberately prints nothing when there is no cost (12125–12129).
- Impact: A novice reads "% / yr" as an interest rate and may pick which debt to repay first by comparing numbers that measure different things. The 0% in coral reads as a warning about free money from family.
- Recommendation: The smallest safe correction is to drop the percentage from the row and show the ruled sentence word for word in the detail. Ink reached the same answer (chief-architect-ink-debts.md WORK-05). If the owner wants a figure on the row, it must be one measure on every row, carry a word ("cost 30% a year"), and be omitted when the cost is zero.
- Effort: S

**UI-05 — The detail has no list of payments, so a wrong payment cannot be found or corrected from Debts**
- Severity: High
- Location: 1a·06; live history sheet openDebtHistoryModal (index.html 12437–12495), removed from the card by D6.
- Evidence: The schedule lists instalments, which are what was agreed. It does not list payments, which are what was recorded. The design drops the 📜 history button and puts nothing in its place. Live's only per-payment delete is in that sheet, and live has no payment edit at all.
- Impact: A user who mistypes ₮1,700,000 for ₮170,000 sees every instalment turn Paid and has no way to undo it on this screen. They would have to find the row in Expenses under the right date filter.
- Recommendation: Add one "Payments · N recorded ›" row in the detail that opens the existing history sheet unchanged (the ink prior art at D:/3_Claude/PowerApps/expense-pwa/index.html 13569–13573).
- Effort: S

**UI-06 — What ✎ and ✕ do on a loan-payment row in Expenses is not designed**
- Severity: High
- Location: Expenses row actions and delete handler (index.html 8291–8315).
- Evidence: ✎ opens openEditModal(expMode, id), the generic expense editor with a category select. A loan payment has no category and live has no payment editor. ✕ confirms with "Delete this expense entry?" (8309), which does not say the payment also leaves the debt and that "Still owed" goes up.
- Impact: The user can either turn a loan payment into an ordinary expense by picking a category, or delete it without knowing it changes their debt.
- Recommendation: On a loan-payment row, ✎ opens the same sheet Pay uses ("Payment to {debt}": date, amount, account, notes), saving the one record. ✕ confirms "Delete this loan payment? It is also removed from {debt}, and what you still owe goes up by ₮X."
- Effort: M

**UI-07 — Three live sentences become false when Paid/Next and F1 ship**
- Severity: High
- Location: index.html 12384 (edit sheet: "This app does not mark them paid — recording a repayment is still up to you."); 3512 (add form: "It does not create a planned expense — recording a repayment is still up to you."); 11801 (cost "is not counted in 'Left over' on Home").
- Evidence: Decision 2 marks instalments Paid. Decision 1 counts payments, cost included, in spending and therefore in Home.
- Impact: The screen that sets the schedule says the opposite of what the schedule then shows, and Home's figure is explained wrongly.
- Recommendation: Rewrite or remove all three in the same commit as the behaviour change.
- Effort: XS

**UI-08 — Deleting a debt now changes past spending, and the confirmation does not say so**
- Severity: Medium
- Location: Delete cascade (index.html 12215–12245), and wherever delete lands after D6 removes the ✕.
- Evidence: The confirmation reads "Delete "{name}" and all N payments? This cannot be undone." Under F1 those payments are also Expenses rows, so past months' spending and Home figures drop. The design also does not say where delete lives once the card's ✕ is gone.
- Impact: The user agrees to lose a debt and does not expect their March spending to change.
- Recommendation: Put Delete in the Edit sheet (the ink shape, chief-architect-ink-debts.md WORK-11) and add one clause: "They are also removed from your spending."
- Effort: XS

**UI-09 — Coral means both "overdue" and "cost"**
- Severity: Medium
- Location: 1a·05 hero ("Cost so far ₮948,462"), every row's "% / yr", the "Overdue 18 days" state; 1a·06 "81%".
- Evidence: The same coral marks the only state that needs action (Overdue) and an informational figure shown on every row.
- Impact: When every row has coral, the overdue row no longer stands out, which defeats the urgency colour.
- Recommendation: Keep coral for overdue only. Show cost figures in the text colour at semibold.
- Effort: XS

**UI-10 — The row's ring and amount have no labels**
- Severity: Medium
- Location: 1a·05 rows ("19%" ring, "₮12,600,000").
- Evidence: Live labels both ("repaid" under the percentage, 12166–12167; "still owed" beside the amount, 12179). The design drops both. Ink restored "repaid" because "30%" was read as 30% left (WORK-15).
- Impact: The user can read the percentage as remaining, and the amount as borrowed rather than owed.
- Recommendation: Keep "repaid" under the ring and "still owed" under the amount, in small muted type. Include both in the row button's accessible name.
- Effort: XS

**UI-11 — "Last payment" reads as the payment the user last made**
- Severity: Medium
- Location: 1a·06 tile "Last payment Jun 2027".
- Evidence: The tile sits above a list of Paid rows, where "last payment" naturally means the most recent one recorded.
- Impact: The user gets the most recent date and the final date confused.
- Recommendation: Label it "Final instalment", the wording ink settled on (C8).
- Effort: XS

**UI-12 — The schedule markers look like checkboxes**
- Severity: Medium
- Location: 1a·06 schedule rows (filled square, amber-outlined square, empty square).
- Evidence: A filled or empty square next to a list item is the standard checkbox shape. The rows are not meant to be tapped.
- Impact: Users will tap a square to mark an instalment paid and nothing will happen. If it were made tappable, it would create payments the user never made.
- Recommendation: Use a non-control glyph: a dot, or a ✓ icon for Paid. Keep the graphic at 3:1 against its background (WCAG 1.4.11).
- Effort: XS

**UI-13 — On long schedules, Paid rows push Next off the screen**
- Severity: Medium
- Location: 1a·06 schedule (5 rows drawn; live allows up to DEBT_SCHEDULE_MONTHS_MAX instalments, index.html 11641).
- Evidence: Paid rows stay at the top in date order. At instalment 30 of 60, the Next row is about 29 rows down.
- Impact: The one row the user opened the detail for is out of sight.
- Recommendation: Fold the Paid rows into "N paid · show" using the existing .more-fields disclosure, show Next and a few rows after it, then "N more".
- Effort: S

**UI-14 — "Pay ₮170,000" reads as a one-tap payment, and its amount is undefined when an instalment is part-paid**
- Severity: Medium
- Location: 1a·06 bottom bar; live openDebtPaymentModal (index.html 12248–12287).
- Evidence: A button labelled with an amount reads as "this records ₮170,000". Under F1 that write is also a spending record. The design does not say what the button shows after a part payment, or when what is still owed is less than one instalment.
- Impact: Accidental payments, or a prefill that overpays and brings back the overpaid state.
- Recommendation: Pay opens the existing payment sheet prefilled with the smaller of what is left on Next and what is still owed. It never writes on tap. If the owner keeps the amount in the label, it must be that same figure.
- Effort: S

**UI-15 — "Settle early" is wrong for an overdue debt, and the detail has no settled state**
- Severity: Medium
- Location: 1a·06 bottom bar; live openDebtSettleModal (index.html 12421–12435).
- Evidence: On a debt that is overdue, settling is not "early". The design shows no bar for a settled debt, and live's undo path ("Clear the date and save to undo") runs through the same sheet.
- Impact: Wrong copy on overdue debts. A settle made by mistake has no visible undo.
- Recommendation: Use "Mark settled" on live debts. On a settled debt, show "Settled on {date} · Change" (ink WORK-06).
- Effort: XS

**UI-16 — "The true cost" card makes an unsourced market claim and has a link that goes nowhere**
- Severity: Medium
- Location: 1a·06 "A bank loan is typically 18–24%. Why this matters ›".
- Evidence: The app is offline and cannot keep a market figure up to date. No source is recorded in knowledge/product-strategy.md. "Why this matters ›" has no designed destination and is an inline text link well under 44px tall. The ruled sentence also drops "on what you still owe" (live 12136).
- Impact: A stale or wrong benchmark presented as fact, and a target that fails the 44px rule.
- Recommendation: Show the ruled sentence word for word, including "on what you still owe". Drop the benchmark and the link until a sourced entry exists (ink WORK-17).
- Effort: S

**UI-17 — The add flow is not designed, and the schedule cannot be set when the debt is added**
- Severity: Medium
- Location: 1a·05 "+ Add loan"; live add form (index.html 3446–3524), schedule fields only in Edit (12376–12384); entry links #incGoDebts (3093) and #quickGoDebts (3815).
- Evidence: D6 removes the add disclosure but no sheet replaces it. Instalment, count and first due date exist only in the Edit sheet, while the owner describes setting "the money and schedule" together. The Income and Quick add links navigate to Debts, where the form is closed whenever any debt exists. The pill says "loan" where the rest of the app says "borrowed money".
- Impact: The owner's main journey takes two separate sheets. Users arriving from Income or Quick add land on a list instead of a form.
- Recommendation: "+ Add loan" opens one add surface that includes the three schedule fields as optional. Both entry links open that surface. Use one word throughout ("Add borrowed money", or rename every entry point together).
- Effort: M

**UI-18 — A loan-payment row would show as "Unknown ?" in Expenses and in category views**
- Severity: Medium
- Location: Expenses row template (index.html 8230–8231, 8280, 8284); Analytics category breakdown; Planned vs Actual.
- Evidence: The row title is cat?.name || 'Unknown' and the tag is cat?.group || '?'. A payment has no categoryId.
- Impact: Every loan payment shows as an unknown expense, and Budget Planning counts it as unplanned overspend with no name.
- Recommendation: Give loan-payment rows their own title ("Loan payment · {debt}") and a neutral "Loan" tag in place of the Needs/Wants/Savings group. Give them one named slice in category breakdowns.
- Effort: S

**UI-19 — "1 paid off · show" is under 44px and wrong for debts settled short**
- Severity: Medium
- Location: 1a·05 under the list.
- Evidence: An inline text link about one line tall. "Paid off" is false for a debt the user settled for less than the agreed total. Live uses "Cleared (N)" on the native .more-fields disclosure, which already has a 44px row (11904–11938).
- Impact: Fails the touch-target rule, and states a repayment that did not happen.
- Recommendation: Keep the live "Cleared (N)" disclosure and restyle it only.
- Effort: XS

**UI-20 — Empty and edge states are not drawn**
- Severity: Medium
- Location: 1a·05 and 1a·06.
- Evidence: Neither picture shows: no debts (hero, bar and the "add" call to action); every debt settled ("Still owed ₮0" over an empty list); a detail with no schedule ("Ээж"); a settled debt's detail. Live has an empty state for no debts (11694–11698).
- Impact: These are common states, and each will be improvised when it is built.
- Recommendation: No debts: hide the hero and show the live empty state with the add button. All settled: hide the bar. No schedule: replace the Schedule section with one line, "No agreed schedule · Add one", which opens Edit.
- Effort: S

**UI-21 — The hero is above the type scale and will overflow at 320px**
- Severity: Low
- Location: 1a·05 "₮15,050,000" (about 48px in the picture); type tokens at index.html 140–146 (--t-hero: 36px).
- Evidence: Eleven glyphs at about 48px nearly fill a 320px viewport. A nine-digit total will not fit.
- Impact: Horizontal scrolling or clipping on small phones.
- Recommendation: Use --t-hero and measure at 320 with a nine-digit total.
- Effort: XS

**UI-22 — Dates in the design do not match the rest of the app**
- Severity: Low
- Location: 1a·05/1a·06 ("15 Nov", "Jun 2027") against live ISO dates everywhere (debt chip 12151, history 12451, Expenses rows 8285).
- Evidence: Live has no human-date formatter. The same payment would read "15 Oct" in Debts and "2026-10-15" in Expenses.
- Impact: The one record shown in two places looks like two different records.
- Recommendation: Use one format in both places. Either keep ISO here, or add one formatter and use it on both screens.
- Effort: S

**UI-23 — The pictures' tab bar, FAB and in-screen title are not live navigation**
- Severity: Low
- Location: 1a·05 bottom bar (Home / Money / Debts / Plan, + FAB) and the "Debts" heading; live header titles (index.html 6896) and More → Debts (3721).
- Evidence: Live reaches Debts through More, and its app header already says "Debts".
- Impact: Porting the picture literally would add a second title and an unbuilt navigation model.
- Recommendation: Port the screen body only. Keep the live header. Put "+ Add loan" at the top right of the body.
- Effort: XS

**UI-24 — Long names are cut too hard at 320px**
- Severity: Low
- Location: 1a·05 row name ("Car loan from a de…").
- Evidence: A single line ellipsised against a right column that can be 12 or more characters wide.
- Impact: Two loans from similar lenders become impossible to tell apart.
- Recommendation: Allow two lines for the name before the ellipsis.
- Effort: XS

### Review areas
- **Layout and hierarchy:** The order is right (hero, bar, rows). The concerns are covered in UI-03, UI-09 and UI-10.
- **Navigation:** The detail has Back. Issues are in UI-17 and UI-23. Build the detail as a modal sheet so Android Back closes only the top layer (ink C1).
- **Typography:** UI-21. Labels at roughly 11–12px in the pictures must use --t-micro or --t-sm, not new sizes.
- **Colour and theme:** UI-09 and UI-04. Text always goes with colour, apart from UI-12.
- **Spacing:** Roughly on an 8px rhythm in the pictures. Cannot be measured exactly from a raster.
- **Cards:** Rows, cost card and tiles share one radius and use no shadow in the pictures. They are consistent with each other. The port should use the live .card tokens.
- **Mobile:** UI-21, UI-19, UI-16, UI-24.
- **Accessibility:** Contrast cannot be assessed from a raster. The muted Paid rows and empty markers need measuring in all 16 themes. Requirements for the build: each row is one native button of at least 44px with an accessible name that includes "repaid" and "still owed", and focus returns to the row when the detail closes.
- **States:** UI-20, UI-08, UI-15. Loading does not apply (local data).
- **Numbers and formatting:** UI-01, UI-02, UI-03, UI-04, UI-22. ₮ grouping is consistent throughout.

## Quick Wins

- UI-03 (S): one line under the hero, plus the detail, stops "I owe more than I borrowed" from reading as a bug.
- UI-04 (S): removing or labelling the row percentage removes a misleading comparison.
- UI-05 (S): one row reuses the existing history sheet and restores the only correction path.
- UI-07 (XS): three strings that would otherwise contradict the new behaviour.
- UI-08 (XS): one clause in an existing confirmation.
- UI-09 (XS): a colour change gives overdue its urgency back.
- UI-10 (XS): two small labels remove a recorded misreading.
- UI-11 (XS): one label change.
- UI-12 (XS): a glyph change removes a false affordance.
- UI-13 (S): reuses the existing disclosure so Next stays in view.
- UI-14 (S): Pay opens the existing sheet with a capped prefill.
- UI-15 (XS): copy change plus the settled-state bar.
- UI-16 (S): drop two lines and restore the ruled sentence word for word.
- UI-18 (S): a row branch stops "Unknown ?".
- UI-19 (XS): keep the live 44px disclosure and its correct wording.
- UI-20 (S): four small states, three of them reusing live strings.

## Estimated UX Impact

With UI-01 fixed, nobody's past spending, Home or Insights figures change on upgrade, and the owner's goal of writing each payment once holds without corrupting history. With UI-02 fixed, the row, the detail, the Pay button and the bell all name the same next instalment, and a missed one shows as overdue instead of hiding as "Next". UI-03 and UI-04 keep the screen's main figures believable for a user with no accounting knowledge. UI-05 and UI-06 mean a mistyped payment can be found and corrected from either screen without silently changing the other. UI-07 removes sentences that would contradict the screen on day one. The result is the calmer, less wordy screen the owner asked for, without giving up correctness of the figures, which is what the module exists for.
