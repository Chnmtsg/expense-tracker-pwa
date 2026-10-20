# UI Review: the Ink quick-add sheet (1a·02)

Scope: the proposal in `D:\3_Claude\PowerApps\reports\design-request-ink-quickadd.md`, the handoff screen 1a·02 (`D:\Downloads\Expense app UIUX design\design_handoff_ink_redesign\Expense App Redesign.dc.html`, lines 80-119; `README.md` lines 73-81), the current keypad (`D:\3_Claude\PowerApps\expense-pwa\index.html`), and the harness (`D:\3_Claude\PowerApps\tools\harness\quick-entry.js`, `run.mjs`). This reviews a proposal, not a build. Every finding is about what the drawing specifies, or leaves out, measured against the shipped app, the guidelines and the standing rulings.

## Executive Summary

The owner's reversal fixes the real problem with today's keypad. "Save expense" becomes a true label, the "Not saved yet" detour goes away, and Debt payment sits beside Expense, where it can stop a repayment being logged as spending. But the drawing is a happy-path picture of a flow that now writes financial records directly. It leaves out every state the current form handles: no category chosen, a short account, an income split, a borrowed-money correction, no debts, a refused date. And it specifies two defaults that would quietly record wrong data: a pre-selected category, and a date that defaults to "the last used". The single biggest problem is that the drawing does not fit under the app's standing floors (44px targets, 64px phone keys). With compliant sizes, the 96px-top sheet overflows at 390x844 when the category chips wrap, and nothing fits on a 320x568 screen even at full height. The harness cannot catch this, because it only renders at 820px tall.

## Overall Score

**62 / 100.** There are no Critical findings. There are seven High findings: one layout conflict and six specification gaps that would ship wrong data or bypass protections the current form gives. Most are XS–S corrections to the specification, not redesigns. That places the proposal in the "usable but fragile" band until they are resolved before build.

## Strengths

- **The label becomes true.** A direct save removes the reason "Save" was refused under chief-architect-ink-plan.md WORK-01. It also removes the "Not saved yet" toast, which was a cost in the app's most-used flow.
- **Debt payment as a peer of Expense** (Q2) puts the right destination one tap from where users already go to record money leaving. That supports the binding condition instead of fighting it.
- **The account default reuses existing behaviour.** "From · account, last used" matches `lastUsedAccountId` (index.html:11619-11622), which is derived per collection and never stored. No new storage is needed.
- **The amount stays first and largest** (Q3, 56px, the same as `--t-amount`), and the 1–9 / 000 / 0 / ⌫ layout is the shipped one, so existing muscle memory carries over.

## Findings

**UI-01 — The drawn sheet does not fit at the standing size floors, and the harness cannot see it**

- Severity: High
- Location: 1a·02 (dc.html:84-112; README Q1, Q6); index.html:2334-2346 (phone full-screen rule); tools/harness/run.mjs:124 (`height:820px`); quick-entry.js:56-86
- Evidence: Stack at standing sizes, on a 390px-wide screen with the 96px top:
  - Rows: close/grabber 44, segmented control 44, amount 67 (56 × 1.2 line height), note line about 20, category chips 44 per row (two rows once the default categories "Rent, Groceries, Utilities, Transport, Dining Out…" plus "All…" wrap), meta chips 44, keypad 4×64 + 3×8 = 280, Save 56.
  - Gaps and padding: about 100px.
  - Total: about 753px against 748 available at 844 tall, and 724 at the harness's 820.
  - At 320×568, even full screen with one row of each chip kind, the stack needs about 690px against 568.
  - The meta row in the drawing is `display:flex` with no wrap. At 320 ("Date Today" + "From Khan card" + "Note" ≈ 326px in a 280px content box) it pushes the page sideways.
  - run.mjs fixes every run at 820px tall, so a sheet that clips Save on a 640px or 568px phone passes every probe. quick-entry.js only records `sheet_scrolls_at_820`.
- Impact: On common small phones the Save button or the bottom keys fall below the fold of the app's launch screen (the sheet opens at every cold start, index.html:15209-15213). Users have to scroll a keypad to finish an entry. The meta row breaks the "no horizontal scrolling" guideline at 320px.
- Recommendation:
  - Make the sheet content-sized and anchored to the bottom: `max-height: 100dvh`, top band only when there is room. On tall phones the drawing's band appears; on short ones the sheet fills the screen, which keeps the owner's full-screen behaviour where it is needed.
  - Category and debt chips: one row only, showing as many recent chips as fit, then "All…". No wrapping, no horizontal rail.
  - Meta chips: one row, account name truncated with an ellipsis.
  - Drop the separate note line under the amount (see UI-14).
  - Put the close control and the segmented control on one row.
  - Add a height parameter to run.mjs and run quick-entry.js at 320×568 and 360×640, asserting Save and the bottom keys sit inside the viewport and nothing scrolls sideways.
  - Owner's call: even after these changes, 320×568 only fits if keys drop below 64px at short heights. The 64px rule is the owner's, so the owner should decide that trade-off explicitly rather than have it decided in the build.
- Effort: M

**UI-02 — Segmented control, category chips, meta chips and keys are under the floors**

- Severity: High
- Location: README Q2 (segment 36px), Q4 (chips 36px), Q5 (meta chips 36px), Q6 (keys 54px); quick-entry.js:69 (64px keys), 392-410 (44px targets); chief-architect-ink-plan.md WORK-02, "Q1 (design), size" rejected
- Evidence: Every new control in the drawing is 36px tall. Keys are 54px with 24px digits. 54px keys and 24px digits were already rejected under chief-architect-ink-plan.md for reversing the owner's phone keypad rule.
- Impact: The sheet is the most-tapped surface in the app, and every chip tap is a classification decision. A 36px target means mis-taps on a financial field, which the 44px floor exists to prevent.
- Recommendation: Segments, category chips and meta chips are at least 44px tall, with the visual pill allowed inside a 44px hit area. Keys stay 64px with `--t-display` digits on phones unless the owner rules otherwise under UI-01. Extend the quick-entry.js 44px sweep (line 405) to every chip and segment in the sheet.
- Effort: S

**UI-03 — A pre-selected category makes a two-tap mis-categorised save the default path**

- Severity: High
- Location: 1a·02 dc.html:96 (Groceries drawn selected), note line 116 ("three taps: amount, category, save"); index.html:7324-7327 (the current reason for "Check the category"); 8504 (`rebuildSelect` falls back to the first category)
- Evidence: The drawing shows a selected chip before the user has chosen one. The current code already names this exact risk: "the form arrives with a category already selected, so it looks finished". If the sheet pre-selects the most recent category (the natural reading of "ordered by recent use"), then amount + Save writes a record in whatever category was used last.
- Impact: Expenses are silently filed under the wrong category. That corrupts the Home donut, the Insights breakdown and Budget Planning comparisons, and the user never notices because the save looked successful. This happens at every cold start.
- Recommendation: In Expense and Income modes no chip is selected when the sheet opens. Save refuses without one: focus the chip row and toast "Choose a category" ("Choose a type" in Income mode), the same `refuseField` behaviour as `expAdd`/`incAdd`. That makes the drawing's "three taps" literally true.
- Effort: S

**UI-04 — "Date defaults to the last used" back-dates new entries**

- Severity: High
- Location: dc.html:117 ("Date and account default to the last used"); README Q5; index.html:8460 (`expDate` falls back to today)
- Evidence: The note applies "last used" to the date as well as the account. The drawing itself shows "Date · Today", so the note and the drawing disagree.
- Impact: A user who back-dated one entry (yesterday's taxi) has every later quick entry silently dated yesterday. Across a month boundary that moves spending into the wrong month on Home, Insights and the budget: a wrong financial figure produced by a default.
- Recommendation: The date always opens on today. Only the account defaults to last used. State this in the build ruling and assert it in quick-entry.js: save a back-dated entry, reopen the sheet, and the Date chip reads "Today".
- Effort: XS

**UI-05 — Typed digits go to the amount while the user is writing a note**

- Severity: High
- Location: index.html:7345-7350 (the `#quickSheet` keydown listener); README Q5 (Note chip)
- Evidence: The listener captures every `/^\d$/` keydown anywhere in the sheet and calls `quickKey`. It also turns Backspace into "delete last digit". That is safe today because the sheet has no text field. The proposal adds a Note field inside the same sheet.
- Impact: On a hardware keyboard (desktop, tablet), typing "2 coffees" into Note changes the amount to ₮…2. Backspace in the note deletes amount digits. The user saves a figure they never typed.
- Recommendation: The listener ignores events whose target is an `input`, `textarea` or `select`. Assert it in quick-entry.js: focus the Note field, type "2" and Backspace, and the amount is unchanged.
- Effort: XS

**UI-06 — Income mode bypasses the "Borrowed money is not income" correction**

- Severity: High
- Location: README Q2 (Income segment); index.html:3161-3190 (the correction and "Record borrowed money instead →" on Add Income); design-request "Everything else standing still applies … the income 'borrowed money is not income' correction"
- Evidence: The drawing has no place for the sentence or the link. Today the only income write path shows it at the moment money arrives. A direct-save Income mode would become a second income write path without it.
- Impact: A user who received a loan records it in three taps as income. Net balance rises at the moment they became poorer, which is the defect the Debts module and the binding condition ("Borrowed money never raises any Home figure") exist to prevent.
- Recommendation: In Income mode, the line under the amount (freed by UI-14) reads "Borrowed money is not income. Record a debt →" and opens the Debts add form. Keep the words "is not income". The comment at index.html:3170 explains why they matter. Probe that the line is present in Income mode and absent in the other two.
- Effort: S

**UI-07 — Income mode would split money between accounts without showing it**

- Severity: High
- Location: index.html:11428-11444 (`pushIncomeWithSplit` reads `incSplitRows` from the form); quick-entry.js:454-482 (the split hand-off flow); README Q2/Q7
- Evidence: Today the split rows and "Stays in Main: ₮80,000" are visible on the form before Add. The drawing has no split surface. A direct save either skips the split (account balances differ from what the user configured) or applies it unseen (money moves between accounts with nothing on screen).
- Impact: In either case, account balances after an income entry are not what the user saw or expected, for every user with a share account, every time they record income.
- Recommendation: When the chosen account has shares, Income mode shows one line above Save stating the outcome, in the existing words ("₮20,000 to Savings · ₮80,000 stays in Main"), using the same derivation the form uses. Editing individual rows stays on the full Add Income form, reached from that line. Restate the quick-entry.js split flow against the sheet.
- Effort: S

**UI-08 — Debt payment mode has none of the payment sheet's guidance or states**

- Severity: Medium
- Location: README Q8; index.html:13044-13056 (payment modal: still-owed line, exact-remaining chip at 13052, Home statement at 13053, `min` date), 14744-14747 (the before-borrow refusal), 12468 (`debtsByUrgency`)
- Evidence: The drawing only says "swaps the category chips for debt chips and pre-fills the next instalment". Undrawn:
  - which debts appear
  - the empty state when there are none
  - "₮X still owed"
  - the overpayment guard (the exact-remaining chip)
  - the statement "A payment recorded here is already taken off Left to spend on Home. Don't also add it as an expense."
  - where a "cannot be earlier than the borrow date" refusal lands
- Impact: Users can overpay unknowingly, double-count by also logging the payment as an expense, or face a blank chip row with no way forward.
- Recommendation:
  - Chips list unsettled debts only, in `debtsByUrgency` order, names truncated with an ellipsis.
  - With no unsettled debts: "No debts recorded. Add debt →", with Save disabled.
  - With a debt chosen, the line under the amount reads "₮X still owed" and the Home statement shows above Save (shortened is fine, the meaning kept).
  - The date refusal focuses the Date chip.
  - The write goes to `db.debtPayments` only. Probe that `db.actual` is unchanged, which is the binding condition.
- Effort: S

**UI-09 — Who owns the amount when it is prefilled or the mode changes is undefined**

- Severity: Medium
- Location: README Q8 (prefill); index.html:7293-7297 (`quickKey` appends); 13061-13065 (the modal selects the prefill so typing replaces it)
- Evidence: `quickKey` appends digits. A prefilled ₮150,000 followed by a "5" becomes ₮1,500,005. The drawing also does not say whether switching to Debt payment overwrites an amount already typed, or what happens to a selected chip when the mode changes.
- Impact: Inflated payment figures, or a typed amount silently replaced by an instalment.
- Recommendation: A prefilled amount is marked as a prefill (muted, like `.is-empty`) and the first digit replaces it, matching the modal's select-on-focus. The prefill applies only when the amount is empty. A typed amount is never overwritten. Changing mode keeps the amount and clears the chip selection.
- Effort: S

**UI-10 — "Pasting a lender SMS" is out of scope, and the request misstates that paste-a-loan exists**

- Severity: Medium
- Location: dc.html:118; design-request table row Q8 ("paste-a-loan exists for creating a debt"); reports/HANDOFF.md:427, 1067 ("2026-09-18 — the paste control is removed. The barrier is not typing."); chief-architect-paste-a-loan.md R1, R8
- Evidence: PASTE-01…04 were built and removed by owner decision. R1 pre-rejects any paste that leads to a record without a deliberate act, and R8 rejects paste reached from other entry points. On a direct-save sheet, paste then Save is a one-tap path from parsed text to a payment record.
- Impact: Building it reverses a dated owner decision and creates the parse-to-record path the ruling forbids. Wrong-but-plausible amounts get recorded.
- Recommendation: Exclude SMS paste from this build. Correct the request's table row so the build ruling does not inherit the false premise.
- Effort: XS

**UI-11 — No visible Close, and the backdrop band throws away more than before**

- Severity: Medium
- Location: dc.html:85 (grabber only, no close control); index.html:3976 (`#quickClose`), 7332-7334 (backdrop tap closes)
- Evidence: The drawing replaces the close X with a 40×5 grabber. Drag-to-dismiss does not exist in the app, and installed iOS apps have no Back. The 96px band above the sheet is a backdrop, and tapping it closes the sheet. With chips and a note, that tap now discards an amount, a category and a note.
- Impact: iOS and keyboard users have no visible way out of the flow. Thumb users who reach for the top of the screen lose their entry.
- Recommendation: Keep `#quickClose` (44px, labelled) on the segmented-control row. The grabber is decoration only (`aria-hidden`). A backdrop tap does not dismiss once anything has been entered. Close, Escape and Back still do.
- Effort: XS

**UI-12 — Refusals and the account shortfall dialog are not designed for the sheet**

- Severity: Medium
- Location: index.html:8463-8464, 8481-8482 (`expAdd` refusals, `confirmSpend(…, { offerMove: true })`), 11589-11603 (Move navigates to Accounts), 14753-14755 (the payment path uses `offerMove: false`)
- Evidence: `offerMove: true` navigates away to Accounts and relies on the form still holding what was typed. A sheet would close and lose the entry. The payment and edit sheets already use `offerMove: false` for exactly this reason (E6). `refuseField` targets form inputs by id, but the sheet's equivalents are chips.
- Impact: A user short on an account taps "Move ₮X", lands on Accounts, and finds their expense gone. Refusals point at fields that are not on screen.
- Recommendation: The sheet calls the shortfall check with `offerMove: false`, so the dialog names the move in words, as the payment sheet does. Refusals focus the sheet's own control: the amount for "Enter an amount", the chip row for category or type, the Date chip for the borrow-date rule. The messages are word for word the same as the forms'.
- Effort: S

**UI-13 — The save outcome is undrawn, and the existing toast copy would be wrong**

- Severity: Medium
- Location: index.html:8494-8500 and 7806-7809 (`revealEntryDate` + "· showing {period}"), 6212-6234
- Evidence: The drawing does not say whether the sheet closes or stays, or what confirms the save. `revealEntryDate` changes the filter on Expenses or Income, and the toast says "· showing Last month" while the user is looking at Home under a closed sheet. The app has no undo.
- Impact: The confirmation refers to a screen the user cannot see. With no undo, the only check on a three-tap save is the confirmation, and it does not say what was saved.
- Recommendation: Close the sheet on save. The toast names the record ("₮12,500 · Groceries saved", "₮150,000 paid to Khan Bank") through `savedToast`, so a storage failure is still reported. Drop the "· showing …" suffix when the target list is not the screen beneath, while keeping the filter move itself. The existing toast-clearance probe (quick-entry.js:331-337) is restated with the new text.
- Effort: XS

**UI-14 — The Note interaction is undrawn, and the note line duplicates the Note chip**

- Severity: Medium
- Location: README Q3 ("the note or merchant below", 14 text-2) and Q5 (Note chip)
- Evidence: There is no drawn state for an open note. On a phone the system keyboard opens over the custom keypad and the Save button. The line under the amount and the Note chip show the same information twice and cost about 20px (UI-01).
- Impact: Users who add a note lose sight of Save, or cannot tell how to get back to the keypad.
- Recommendation: Tapping Note turns the chip into an inline text field. The keypad hides while it has focus, so Save stays directly above the system keyboard, and "Done" or blurring the field brings the keypad back. Once filled, the chip shows the note truncated. Remove the separate line and use that slot for the mode-specific lines in UI-06 and UI-08.
- Effort: S

**UI-15 — The drawing's literal colours, radii and spacing are not Ink tokens**

- Severity: Medium
- Location: README Q1, Q2, Q5, Q6, Q7 (bg `#0A1113`, `#253033`; r28, r14, r16, r12, r18; padding 10/20/28, chip padding 14); index.html:127, 135, 803 (`--s*`, `--r-sm` 12, `--r-md` 20); chief-architect-ink-plan.md WORK-18, WORK-20
- Evidence: Ink Plan WORK-20 rules "Ink radius tokens only" and has already rejected r14/r16/r18. The segment track and meta chips are a hard-coded near-black, which in the 16 other themes (light ones included) puts `--text` on a dark fill. 10, 14, 20 and 28 are not on the 8px scale.
- Impact: Unreadable chips in light themes (an AA failure), and a sheet that looks unlike every other surface.
- Recommendation: Track and chips use `--surface-2` / `--bg`. Keys use `--r-sm`, the sheet and Save use `--radius`, chips use `--r-full`. Spacing uses `--s2`–`--s5`. Add each new foreground/background pair (chip text on chip fill, the selected chip, segment labels) to check-contrast.mjs for all 17 themes in the commit that introduces it.
- Effort: S

**UI-16 — Selection state and names are not specified for assistive technology**

- Severity: Medium
- Location: README Q2, Q4, Q5; index.html:3926 (`aria-label="Enter amount"`), 3975-3977 (dialog labelled by `#quickTitle`); quick-entry.js:140
- Evidence: The drawing marks the selected segment and chip by fill and weight only, and has no visible title. The + button and the dialog are named "Enter amount", which the code comment justifies by "it adds nothing". That is no longer true. The meta chip reads "From" in every mode, but income goes *into* an account.
- Impact: Screen-reader users cannot tell which category is selected before they save. The + button's name describes a different feature.
- Recommendation:
  - Segments and chips use `aria-pressed`, the app's existing pattern (index.html:3303, 3408, 14375).
  - The dialog keeps an accessible name (a visually hidden `h3` is acceptable), for example "Add entry".
  - Rename the + button to match, restating quick-entry.js:140 and the navigation probes.
  - The account chip reads "From" for Expense, "Into" for Income, and "Paid from" for Debt payment.
- Effort: S

**UI-17 — The harness's hand-off flows must be restated, not deleted**

- Severity: Medium
- Location: quick-entry.js:6-12 (header), 75-83 ("Save" refused, hand-off labels), 331-337 (toast text), 363-390 (Enter blocked on keys and close), 417-482 (hand-off and split flows); index.html:3993-3997 (the WORK-01 comment), 7306-7328 (`quickEntryTo`)
- Evidence: Nearly every write-related assertion in quick-entry.js encodes the hand-off ("only Add writes", "Not saved yet", no "Save" on the actions). The proposal lists "Restate" but names no replacement invariants.
- Impact: Without replacements, the sheet ships with weaker gates than the keypad it replaces. The flow that writes financial records is the one that most needs them.
- Recommendation: Restate the assertions in the same commit that changes the behaviour. Replacement invariants:
  - Close, Escape and Back write nothing.
  - Save writes exactly one record with the shown amount, chosen category, today's date and the last-used account.
  - Save without a category writes nothing and focuses the chips (UI-03).
  - Cancelling the shortfall dialog writes nothing.
  - Income with shares writes the stated split (UI-07).
  - Debt payment writes only `db.debtPayments` (UI-08).
  - Typing into Note leaves the amount unchanged (UI-05).
  - Fit holds at 320×568 (UI-01).
  - Replace the WORK-01 comment at index.html:3993 with one citing the 2026-10-20 reversal.
- Effort: M

**UI-18 — "Recent use" has no definition, and "All…" opens an undrawn surface**

- Severity: Low
- Location: README Q4; design-request question 3; index.html:11614-11622 (the push-order precedent)
- Evidence: "Ordered by recent use" could mean by entry date or by the order records were added. If chips re-sort while the sheet is open, the chip under the thumb moves. "All…" opens "the full list" with no drawing.
- Impact: Chip positions that are unpredictable or move during use cause mis-taps.
- Recommendation: Recent means the most recently *recorded* (push order in `db.actual` / `db.income`, the same rule as `lastUsedAccountId`). Categories never used follow `db.categories` order. Deleted categories never appear. The order is computed when the sheet opens and frozen while it is open. No new storage key. "All…" is a native `<select>` styled as the chip, with grouped options from `categoryOptions()`. That is accessible, uses the OS picker, and needs no new component. Choosing from it selects that category for this entry. Empty state with no categories or types: "No categories yet · Settings →".
- Effort: S

### Areas with no finding

- **Navigation:** the + stays one tap from every tab. Cancel is covered under UI-11 and naming under UI-16.
- **Typography:** the amount uses `--t-amount` and the keys `--t-display` once UI-02 holds. No further hierarchy issue.
- **Cards:** not applicable. The sheet has no cards. Radius is covered under UI-15.
- **Loading states:** clean. Every action is a synchronous local write, and storage failure is surfaced by `savedToast` (kept under UI-13).
- **Destructive actions:** clean. The sheet only creates records.
- **Numbers and formatting:** the amount uses the shipped `₮` and en-US grouping, the same as `fmt()`. Mode and the Save label carry direction, so no sign is ambiguous. The prefill risk is covered under UI-09.
- **Colour meaning:** selection in `--primary` does not conflict with Money WORK-15, which is about row amounts. Theme pairs are covered under UI-15.

### Answers to the request's questions, from a UI standpoint

1. **Write paths:** one write function per kind, shared by the form and the sheet, so refusals, shortfall, split, `revealEntryDate` and the save outcome cannot diverge (UI-12, UI-13). How to extract it is for code review.
2. **Full screen vs sheet:** a content-sized bottom sheet that fills the screen when it must (UI-01). Key height at short heights is the owner's call.
3. **Recent-use order:** push order, frozen while open, no new key (UI-18).
4. **Debt payment:** unsettled debts in urgency order, prefill that a first keypress replaces, `db.debtPayments` only, SMS paste excluded (UI-08, UI-09, UI-10).
5. **Income:** split outcome line, plus the "is not income" correction (UI-06, UI-07).
6. **Required fields:** amount (Save disabled at zero, as today), category or type (refused, never pre-selected), shortfall via `offerMove: false` (UI-03, UI-12).
7. **Hand-off routes:** `quickEntryTo` and "Not saved yet" are retired. The full forms stay for Planned and recurrence (the sheet writes Actual only, as the keypad does today). The probes are restated (UI-17).

## Quick Wins

- **UI-04** (XS): one default, today, that removes a wrong-month figure.
- **UI-05** (XS): a target check in one listener, which stops silent amount corruption.
- **UI-10** (XS): exclude one line of scope and correct the request, upholding a dated owner decision.
- **UI-11** (XS): keep the existing close button and guard the backdrop.
- **UI-13** (XS): toast copy that names what was saved, and drop the misleading suffix.
- **UI-03** (S): no pre-selection plus the existing refusal pattern, which removes mis-categorised saves.
- **UI-06** (S): one line with the existing words, keeping the loan protection on the new income path.
- **UI-07** (S): one outcome line from the existing derivation, so account moves are visible.
- **UI-02** (S): sizing tokens, back to the standing floors.
- **UI-08, UI-09, UI-12, UI-14, UI-15, UI-16** (S): each is a specification line plus existing patterns, with no new components.

## Estimated UX Impact

With the seven High findings resolved, the sheet does what the drawing promises for real users. A typical expense is three deliberate taps and lands in the category the user chose, dated today. On a small phone, Save and every key are in view without scrolling. Income entered from the sheet keeps the two protections the form gives today: borrowed money is named as not income, and an account split is shown before it happens. A note can never change the amount. Unfixed, the same three taps would file spending under the previous category, sometimes on the previous date, and could log a loan as income with no warning, all on the screen the app opens to at every cold start.
