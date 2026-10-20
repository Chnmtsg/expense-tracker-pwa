# Chief Architect: the Ink quick-add sheet (1a·02)

Inputs, all read in full: `D:\3_Claude\PowerApps\reports\engineering-manager-ink-quickadd.md` (WORK-01 to WORK-20, C1 to C6), `D:\3_Claude\PowerApps\reports\ui-review-ink-quickadd.md` (UI-01 to UI-18, score 62) and `D:\3_Claude\PowerApps\reports\code-review-ink-quickadd.md` (CODE-01 to CODE-15, score 64). I also read the request (`reports/design-request-ink-quickadd.md`), the owner decisions in `reports/HANDOFF.md` (the latest is 2026-10-20: the sheet is wanted, reversing 2026-10-19) and the standing rulings. I checked the facts my rulings rest on against `expense-pwa/index.html`:
- `pushIncomeWithSplit` reads the split from form DOM (11428-11444).
- `incSplitOn` is checked by default (3147), so a form left untouched writes `splitPlan`'s floor shares.
- `openModal` focuses the first INPUT/SELECT/TEXTAREA it finds (6924).
- The sheet's keydown handler takes every digit and Backspace inside the sheet (7345-7350).
- `#incGoDebts` calls `navigate('debts')` (13299).
- The payment helper sentence is the one ruled in ink-home WORK-04(1) (13053).

All three reports are present.

**Standing rulings this one changes.** The owner's 2026-10-20 reversal lifts two items in `chief-architect-ink-plan.md`: WORK-01 (the "Save" label refused) and the off-limits line "'Save' on any control that does not write a record". It lifts them only for a control that does write a record. That off-limits line still binds every other control. The full-screen keypad assertions in quick-entry.js may be restated to the new geometry, because the owner's decision behind them is reversed. "Keys under 64px on phones" stays off limits unless the owner answers the call below.

## Executive Decision

**Yes. The application as it stands is fit for release.** The shipped keypad writes nothing, so it carries none of the risks raised here. The sheet as drawn is **not** fit to build. It would write money records through a fourth, copied write path. It would skip or hide the income split (CODE-01, Critical). It would pre-select a category and back-date entries. And it would let a loan be saved as income in three taps on the screen the app opens to. I approve the sheet in the corrected form below. The order is: extract the three writers, then build the geometry, then Expense mode, then Note, then Income mode, then Debt payment mode. Every step keeps the app shippable. Income stays on today's truthful hand-off until its protections ship.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Extract `recordActualExpense`, `recordIncome(entry, split)`, `recordDebtPayment` | Removes the structural blocker (CODE-02). Without it, every save in the sheet is a copy of a money rule that will drift. This is a refactor, not a rewrite. Three commits, one per writer. Each writer goes through `commitWrite` with a snapshot taken before its first await, which is the designed direction in `commitWrite`'s own header. **One behaviour change is allowed and must be named in its commit:** `expAdd`'s path now refuses a write if `db` was replaced while the shortfall dialog was open. That gets a crosswindow assertion. Otherwise there is no behaviour change, and v1-write-flows, debts, accounts and crosswindow stay green. `pushIncomeWithSplit(prefix, entry)` becomes a DOM-reading wrapper over `recordIncome`, so the Salary save (`s`) keeps working unchanged. |
| WORK-02 | The income split is never skipped and never unseen | Approves the Critical CODE-01, and UI-07. The shape is ruled under C1. |
| WORK-03 | No chip selected at open; Save with no chip writes nothing | Prevents silent wrong-category records (UI-03, CODE-04). Save stays enabled. With no chip, tapping it refuses on the chip row using the existing refusal messages from `expAdd`/`incAdd`, word for word. Debt mode does the same with "Choose a debt" (no form equivalent exists). |
| WORK-04 | Date opens on today and is resolved by `todayISO()` inside the writer at save time; only the account is last-used | Removes a wrong-month figure that a default would produce. The chip stores no date until the user picks one. |
| WORK-05 | The keydown handler ignores `input`, `textarea` and `select` targets; no field takes focus when the sheet opens | Stops a note from changing the amount (UI-05, CODE-05). **It also covers the "All…" `<select>` from WORK-20**, which `openModal` would otherwise focus at every open (see Risks). The sheet sets its own first focus. Smallest form: elements marked `data-no-autofocus` are skipped by `openModal`'s field search. |
| WORK-06 | Income mode shows the "is not income" correction | Keeps the binding condition on the new income path (UI-06, CODE-03). Wording and destination are ruled under C3. |
| WORK-07 | Debt payment mode, safe | Never opens `#editModal`. Writes through `recordDebtPayment` only, to `db.debtPayments` only. Shows live debts in `debtsByUrgency(todayISO())` order. Shows the still-owed line and the ink-home WORK-04(1) sentence. Keeps the borrow-date floor, the `d.date` default for a future-dated debt, and the empty state. Chip filter, copy and empty state are ruled under C4. Home's Pay and the bell stay on `openDebtPaymentModal` (see Deferred). |
| WORK-08 | Fit at 390x844, 360x640 and 320x568, plus a height option for run.mjs | Today no gate can see vertical fit (UI-01, CODE-09). Geometry is ruled under C6, and key height is an owner's call (below). |
| WORK-09 | Every field resets when the sheet opens, and it opens on Expense. A mode change keeps the amount and clears the chip. A prefill goes only into an empty amount, shows muted, and the first digit replaces it | Prevents a wrong-collection save after reopening, and inflated payments (UI-09, CODE-12). |
| WORK-10 | 44px hit areas on segments and chips; keys stay 64px with `--t-display` digits | Standing floors. Extend the 44px sweep in quick-entry.js to every chip and segment. |
| WORK-11 | The shortfall dialog is called with `offerMove: false`, and refusals focus the sheet's own controls with the forms' exact wording | With `offerMove: true` the dialog navigates away and the entry is lost (UI-12, CODE-07). The edit and payment sheets already work this way (E6). |
| WORK-12 | SMS paste is out of this build | Upholds the owner's 2026-09-18 removal and paste-a-loan R1/R8. **Only the exclusion is approved.** The correction is recorded here: paste-a-loan does **not** exist, because it was removed by owner decision. The request document is an input and is not edited (see Rejected). |
| WORK-13 | Keep `#quickClose` (44px, labelled, on the segment row). The grabber is `aria-hidden` decoration. A backdrop tap does not dismiss once anything has been entered | Users have a visible way out, and an entry cannot be thrown away by a stray tap. Close, Escape and Back still dismiss and write nothing. |
| WORK-14 | Save closes the sheet; the toast names the record through `savedToast` | The confirmation is the only check on a save with no undo. The suffix is ruled under C5. |
| WORK-15 | The Note chip becomes an inline field, the keypad hides while it has focus, and the separate note line goes | Keeps Save above the system keyboard and frees the slot that WORK-06, WORK-07 and WORK-08's fit budget need. The Note `<input>` does not exist in the sheet's DOM until the chip is tapped (CODE-05's first option). |
| WORK-16 | Ink tokens only, and new pairs added to check-contrast.mjs for all 17 themes | Prevents AA failures in light themes. Ink Plan WORK-20 already refuses r14/r16/r18. A constraint on steps 6, 7, 9 and 10. |
| WORK-17 | `aria-pressed` on segments and chips; an accessible name for the dialog and the + button; From / Into / Paid from on the account chip | Screen-reader users must be able to hear the selection before they save. `aria-pressed` and the account-chip wording are constraints on the steps that create them. The rename has its own step: dialog and + button both become **"Add entry"**, and quick-entry.js:140 and the navigation probes are restated. |
| WORK-18 | Restate the harness's hand-off assertions; keep the `#quickSheet`, `#quickKeys [data-qk]` and `#quickBtn` ids | The flow that writes money must not ship with weaker gates than the keypad it replaces. It has no slot of its own: every behaviour commit restates its own probes, using the invariants both reports list. Deleting a probe to turn a gate green is refused. |
| WORK-19 | Comments and names that state "writes nothing / never Save" are rewritten, citing the 2026-10-20 reversal and this ruling | The comments are the design record (coding-standards). Each commit rewrites the comments it makes false. The last step is a check that can be run again (Development Order step 12). |
| WORK-20 | "Recent use" means push order scanned from the end, deleted categories skipped, frozen while the sheet is open, no new key; "All…" is a native `<select>` filled from `categoryOptions()`; an empty state | Needs no new storage and no new component, and every category stays reachable. Chip labels go through `escapeHTML`/`textContent` (check-escaping.mjs). Income types use the same rule over `db.income`. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-12 (second half) | Edit the design request to correct the paste-a-loan premise | The request is a dated input, and this ruling now records the correction. Editing an input document after it has been ruled on rewrites history for no gain to the user. |
| Q1 (design) | Sheet fixed at a 96px top offset | Does not fit at 568px or 640px (UI-01, CODE-09). Replaced by the C6 geometry. |
| Q2/Q4/Q5 (design), size | 36px segments and chips | Below the 44px floor on the app's most-tapped classification control. |
| Q6 (design) | 54px keys, 24px digits, r14 | Already refused in `chief-architect-ink-plan.md` (WORK-02, "Q1 (design), size"). Only the owner's key-height call below can change key height, and only at short heights. |
| Q1/Q2/Q5/Q7 (design), literals | `#0A1113`, `#253033`, r28/r16/r12/r18, padding 10/14/20/28 | Not Ink tokens, and they fail contrast in light themes (WORK-16). |
| Q4 (design), selected chip | Groceries drawn pre-selected | Produces wrong-category records (WORK-03). |
| Q5 (design), date default | "Date defaults to the last used" | Back-dates entries into the wrong month (WORK-04). |
| Q3 (design), note line | A separate "note or merchant" line under the amount | Duplicates the Note chip and takes the slot the mode lines need (WORK-15). |
| Q8 (design), paste | "Pasting a lender SMS fills in the amount" | Reverses a dated owner decision and paste-a-loan R1/R8. It may come back only as its own proposal. |
| Grabber as the only close (design) | No visible close control | Drag-to-dismiss does not exist, and installed iOS apps have no Back (WORK-13). |
| CODE-01's fallback-only shape | A split account always hands off to the form | Overruled under C1. As drawn, "Save income" would not save for every user with a share account. That is the false label the owner's reversal removed. |
| CODE-09's "top 0 below 600px" | A breakpoint-driven full-height sheet | Overruled under C6. The content-sized sheet reaches full height by itself, with no media query. |
| A hidden `q` prefix for split DOM | Fake split rows inside the sheet | Hidden DOM that decides money is the defect, not a fix. `recordIncome(entry, split)` takes values. |
| A stored recent-use list | An MRU key in storage | Needs a validator, and it outlives deleted categories. Derived order is enough (WORK-20). |
| A new modal for "All…" | A custom full-list picker | A native `<select>` is accessible and already exists as a pattern (WORK-20). |
| "Loan" as an income type | Any income-type route for borrowed money | Refused permanently by standing rulings, and restated by CODE-03. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| CODE-06 / Future Risks | Point Home's Pay and the bell at the sheet's Debt payment mode | Step 10 ships green and the owner asks for one payment surface. Both already reach `recordDebtPayment` after step 3, so no fourth save can appear in the meantime. |
| CODE-06 / Technical Debt | An explicit z-index rule for stacked modals, instead of DOM order | A third surface at z-index 40 needs to stack over the sheet. Today the shortfall and confirm dialogs sit at 60, which is enough. Step 7 asserts that the shortfall dialog stacks above the sheet. |
| CODE-01 / Technical Debt | Split computation fully separated from `INCOME_FORM_AMOUNT` and form prefixes | A third income surface beyond Add Income, Salary and the sheet. WORK-01's `recordIncome(entry, split)` already removes the risk for the sheet. |

## Conflict Rulings

**C1. How Income mode handles a split account. Ruled: show the split and save it, with the form one tap away. UI-07's shape, held to CODE-01's guard.**
- When `splitPlan(amount, accountId)` is non-empty, Income mode shows one outcome line above Save, in the form's own words: "₮20,000 to Savings · ₮80,000 stays in Main". It re-renders on every change to the amount or the account.
- Save calls `recordIncome(entry, split)`. The split is computed at save time by the **same** `splitPlan` call that drew the line, so the record cannot differ from what was shown. This is exactly what Add Income writes when its rows are left untouched (`incSplitOn` is checked by default). So nothing is skipped and nothing is unseen, and both of CODE-01's failure modes are gone.
- The line carries "Change split →". It closes the sheet and hands the amount, the chosen type and the account to Add Income, using a reduced `quickEntryTo('income')`. That is its only remaining use. The toast becomes "Not saved yet. Adjust the split, then tap Add." The expense branch and "Check the category" go.
- If the split adds up to more than the income, Save refuses on the outcome line with the form's wording ("The split adds up to ₮X, more than the income"), and "Change split →" stays available.
- No outcome line, no split write. A probe asserts that saving into an account with shares writes the stated transfers, and that saving into an account without shares writes none.
- Why not CODE-01's fallback: it would make "Save income" a button that does not save for every user with a share account. That reintroduces the false label the owner's reversal exists to remove, on the income path the owner asked to shorten. Both shapes cost about the same. This one keeps one writer and a true label.
- Severity is not changed. CODE-01 stays Critical and is approved through WORK-02.

**C2. Severity differences.** Both values stand, because only the reviewer who raised a finding sets its severity. Priority follows the higher value, as the EM set it. No item changes band and no ruling depends on the difference.

**C3. Income correction. Ruled: CODE-03's wording rule, the existing link's destination.**
- The sheet shows the form's own bold sentence, **"Borrowed money is not income."**, verbatim. It may wrap but is never truncated or ellipsised at any width.
- It is followed by the existing link label, "Record borrowed money instead →", which closes the sheet and calls `navigate('debts')`. That is the same destination as `#incGoDebts`.
- The form's second, explanatory sentence stays on the form only. The sheet carries the correction itself, which is the point the 3170 comment makes.
- UI-06's "Record a debt →" opening the Debts add form is not adopted. It would add a new entry route for a one-word gain.
- A probe asserts that the line appears in Income mode and not in the other two modes.

**C4. Debt mode copy, chips and empty state. Ruled: CODE-06 on filter and wording, UI-08 on the empty state.**
- Chips show `!debtSettled(d) && debtOutstanding(d) > 0`, in `debtsByUrgency(todayISO())` order, with names truncated by ellipsis. This is the precise form of "unsettled", and the urgency order is already ruled.
- The helper sentence is ruled text (ink-home WORK-04(1)) and is shown **word for word**: "A payment recorded here is already taken off Left to spend on Home. Don't also add it as an expense." Shortening it would reopen a ruled sentence. The fit gate covers Debt mode with this sentence.
- With live debts present, Save stays enabled and refuses with no debt chosen (CODE-04, consistent with the other modes).
- With **no** live debts, the chip row is replaced by "No debts to pay. Open Debts →" (closes the sheet, `navigate('debts')`), and Save is disabled. A refusal that points at an empty row has nowhere to send the user. "No debts recorded" is not used, because it is false when settled debts exist.
- With a debt chosen, the freed line reads "₮X still owed", and the date refusal focuses the Date chip.

**C5. Toast suffix. Ruled: UI-13.** When the entry's list is not the screen beneath the sheet, the "· showing {period}" suffix is dropped. `revealEntryDate` still moves the filter, so the entry is visible on the next visit and the duplicate-entry protection holds. A toast naming another screen's filter adds words about state the user cannot see. With today as the default date, the case is rare anyway.

**C6. Geometry. Ruled: UI-01's content-sized sheet. Key height is the owner's call.**
- The sheet is anchored to the bottom, sized to its content, with `max-height: 100dvh`. The top band appears only when there is room.
- Close and the segments share one row.
- Category and debt chips sit on one row: as many as fit, then "All…". No wrap and no horizontal rail.
- The meta row is one row, with the account name ellipsised.
- The keypad and Save are anchored at the bottom and never scroll.
- run.mjs gains a height option, and quick-entry.js runs at all three sizes, asserting:
  - no horizontal scroll
  - all twelve keys and Save inside the viewport
  - nothing scrolls in Expense mode at 390x844 and 360x640

**Owner's call: keys below 64px on short screens.**
- **Recommended default (built if no answer comes): keys stay 64px at every height.** At short heights the region above the keypad compresses: the amount steps down from `--t-amount`, and gaps go to `--s1`. As a last resort that upper region scrolls inside itself, while the keypad and Save stay anchored and fully visible. The 320x568 gate asserts Save and all keys in view, not zero scroll.
- **The alternative the owner may choose:** below 640px tall, keys shrink to fit, never below 48px, so the whole stack fits without any scroll.
- The 64px rule is the owner's (2026-10-19), so a build without an answer must not reverse it.

## Development Order

One commit per step, each on its own branch merged to main with `npm test` green. Each step restates the probes it changes (WORK-18) and rewrites the comments it makes false (WORK-19). WORK-12 needs no commit, because this ruling records it.

1. **WORK-01a: `recordActualExpense({date, amount, categoryId, notes, accountId}, {offerMove})`.** `expAdd` becomes a caller, through `commitWrite`. The named change is the post-dialog stale-write refusal, with its crosswindow assertion. Writers first: everything that saves depends on them.
2. **WORK-01b: `recordIncome(entry, split)`.** `pushIncomeWithSplit` becomes the DOM wrapper. `incAdd` and the Salary save become callers.
3. **WORK-01c: `recordDebtPayment(debtId, {date, amount, notes, accountId})`.** `saveEditDebtPayment` becomes a caller, and Home Pay and the bell now reach it through the modal.
4. **WORK-05: the keydown target guard and the `openModal` autofocus exemption.** Harmless on today's keypad, and required before any field or `<select>` exists in the sheet.
5. **WORK-08 (harness half): run.mjs height option.** The shipped keypad is asserted at 390x844, 360x640 and 320x568. The gate exists before the layout it guards.
6. **Sheet geometry: the basic UI, which has no WORK item of its own (EM's note), with WORK-08 layout, WORK-10, WORK-13 and WORK-16.** `#quickSheet` is restructured into the C6 sheet: the close row, the amount, the anchored keypad, 44px/64px floors, Ink tokens, contrast pairs and the backdrop guard. **The actions stay "Expense →" / "Income →" hand-offs.** No chips or Save yet, so no label lies. The full-screen assertions are restated to the fit assertions. Effort about M.
7. **Expense mode saves: WORK-20, WORK-03, WORK-04, WORK-09, WORK-11, WORK-14.**
   - Recent-order category chips and "All…" are added, with no default chip.
   - The Date and From meta chips are added: date resolved at save, account last-used.
   - "Expense →" becomes **Save expense**, calling `recordActualExpense` with `offerMove: false`. Save closes the sheet with a toast naming the record.
   - `openQuickEntry` resets all state on open.
   - `aria-pressed` is on the chips.
   - **"Income →" stays as today's hand-off**, so the Income path keeps the form's protections until step 9.
   - Expense invariants restated: Save writes exactly one record; no chip writes nothing; cancelling the shortfall dialog writes nothing; Close, Escape and Back write nothing; Enter only acts with focus on Save. Effort about M.
8. **WORK-15: the Note chip.** An inline field, created on tap. The keypad hides while it has focus, and the probe confirms that typing "2" and Backspace in Note leaves the amount unchanged. It comes before steps 9 and 10 because it frees their slot.
9. **Income mode: WORK-06 and WORK-02, with the segment control and WORK-09's mode rule.**
   - Expense / Income segments.
   - Type chips.
   - The C3 correction and the C1 outcome line.
   - **Save income** through `recordIncome`.
   - "Into" on the account chip.
   - The "Income →" button is retired, and `quickEntryTo` is reduced to "Change split →".
   - These ship together because Income mode is not safe without both protections. The fit gate covers Income mode.
10. **Debt payment mode: WORK-07, with WORK-09's prefill rule.**
    - The third segment.
    - The live-debt chips, C4 copy and empty state.
    - The prefill: muted, only into an empty amount, replaced by the first digit.
    - "Paid from".
    - **Save payment** through `recordDebtPayment`.
    - Probes: the write goes only to `db.debtPayments` and `db.actual` is unchanged; the borrow-date refusal focuses the Date chip. The fit gate covers Debt mode with the sentence.
11. **WORK-17 (rename half):** the dialog's accessible name and the + button become "Add entry". quick-entry.js:140 and navigation.js/signin.js are restated. This is separate because it touches probes outside the sheet.
12. **WORK-19 closure:** a check that can be run again. A search of `expense-pwa/` and `tools/harness/` for "Not saved yet. Check", "NEVER 'SAVE'", "writes no record of its own", "only Add writes" and "Enter amount" returns only intended hits. Any stragglers are rewritten in this commit.

Why this order: writers before any save (CODE-02). Input isolation before any field. The gate before the geometry. Geometry before the content it must hold. Expense first, because it is the most-used path and carries the simplest rules. Note before the modes that need its slot. Income and Debt each ship whole with their binding protections. Until a mode ships, its route is today's truthful hand-off or absent.

## Architecture Strategy

**Stays.**
- One guarded writer (`writeDb`) and `commitWrite` as the only entry for new write paths.
- `revealEntryDate`, `savedToast`/`stillHeld`, the account limit through `confirmSpend`.
- The Debts binding condition and its two ruled sentences.
- Derived, never-stored orders (`lastUsedAccountId`, recent use).
- 64px phone keys and 44px targets.
- Native controls over custom components.
- The full Add Expense / Add Income forms for Planned, recurrence and split editing. The sheet writes Actual expenses, income and debt payments only.
- Offline-first: nothing here touches the network.

**Changes.**
- Money rules move out of click handlers into three value-taking writers, with the forms and the sheet as callers. This is the main structural change of the quarter. Every future entry surface (OCR, a later SMS proposal, Home Pay) inherits it for free.
- The keypad becomes a sheet that writes, and the "writes nothing" design record is retired with a citation.
- The harness gains vertical fit.

**Off limits.**
- A second copy of any money rule in sheet code.
- Hidden DOM that decides money.
- A pre-selected category or debt.
- A last-used date.
- SMS paste in the sheet.
- "Save" on any control that does not write a record.
- Keys under 64px unless the owner answers the call above.
- Deleting or loosening a probe to turn a gate green.
- A stored MRU list.
- New radius or colour literals.
- Building Income or Debt mode without its protections in the same commit.

**Risks, stated as risks and not as new findings.**
- `openModal` focuses the first INPUT/SELECT/TEXTAREA (6924), so WORK-20's "All…" `<select>` would take focus at every open, including cold start. WORK-05's exemption must cover it (folded into step 4).
- With a real Save in the sheet, today's Enter rule (Enter does nothing except on an action, 7349) must hold. Otherwise Enter becomes a one-key write from the close X. Restated in step 7.
- Other accounts' shares can sum past 100%, making `splitPlan` exceed the income. The sheet's refusal must land on the outcome line (C1).

## Final Recommendation

Start Development Order step 1. Extract `recordActualExpense` from `expAdd` so it takes values and goes through `commitWrite`. The only behaviour change is the post-dialog stale-write refusal, named in the commit and asserted in crosswindow. v1-write-flows, accounts and debts must stay green. While steps 1 to 5 are built, ask the owner the one call this ruling leaves open: may phone keys go below 64px on screens shorter than 640px? If no answer comes by step 6, build the default: 64px keys everywhere, with the upper region compressing and the keypad and Save always in view.
