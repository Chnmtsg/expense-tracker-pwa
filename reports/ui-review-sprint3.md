# UI Review: Sprint 3 (69f5d6b..d7167d7)

Scope: the user-facing result of WORK-10 step 1, CODE-04 (carried from Sprint 2), WORK-21, WORK-22 (measurement only), WORK-13 and WORK-15. I measured it against `knowledge/ui-guidelines.md`, the Sprint 3 list in `D:\3_Claude\PowerApps\reports\chief-architect.md` and the CODE-04 carry in `D:\3_Claude\PowerApps\reports\chief-architect-sprint2-review.md`.

Method: I read `D:\3_Claude\PowerApps\expense-pwa\index.html` at each site, plus `D:\3_Claude\PowerApps\reports\HANDOFF.md` and `D:\3_Claude\PowerApps\tools\harness\perf.js` for WORK-22. I ran no browser, harness or git, so every claim below comes from reading the code. Nothing already ruled is reopened.

## Executive Summary

Every Sprint 3 item does what its ruling asks:
- **WORK-10:** the wrapper calls `save()` and never replaces it.
- **WORK-21:** warns through the existing `choiceDialog`, using the same title and sentence as the other two "leaves an account short" sheets, then allows the save.
- **WORK-13:** names the record on every row in the ruled lists.
- **WORK-15:** shows "Past moves" only when moves exist.
- **CODE-04:** changes nothing on screen.

No Critical, High or Medium problem was introduced.

The most noticeable new problem is in WORK-10's refusal wording. An account delete or money-move delete that crosses another window's write is now refused, as the brief says. But it is refused with the edit sheets' sentence ("…so nothing was saved. Check the details and save again.") under the title "Not saved", on a screen where the user pressed Delete and there is nothing to save.

The other four findings are Low:
- two leftovers from WORK-13;
- the "Past moves" label is spaced and styled exactly like a form field label;
- the WORK-22 record does not state which way the ruled trigger went;
- a rounding mismatch in the Salary breakdown that predates this sprint.

## Overall Score

**91 / 100.** There are no Critical, High or Medium findings, and every ruled item is met. Five Low findings, one of them new wording introduced by WORK-10, keep the score near the bottom of the 90 band.

## Strengths

- **WORK-21 reuses everything, with nothing new for the user to learn.**
  - Its title "This leaves an account short", its sentence (`shortfallText` plus "Some of this money has been spent.") and its link "Save anyway (X goes below zero)" match the debt and income edit sheets word for word (`:13757`, compare `:13386` and `:13613`).
  - The dialog appears only when the starting amount goes down and the account ends below zero today (`:13755`). A rename or a share change never triggers it.
  - Cancel leaves the sheet open with what was typed (`:13758`).
- **WORK-10 keeps the two refusal outcomes distinct.**
  - If the record is gone, the sheet closes with WORK-16's ruled sentence in a dialog (`:10716`).
  - If the records changed, the sheet stays open with what was typed (`:10717`), so the user's correction is not lost.
  - `acctAdd` and `trAdd` stay synchronous, so an add with no dialog still lands in the tap's own task.
- **The WORK-13 labels read naturally aloud.** For example: "Delete Groceries, 2026-10-01, ₮12,000" (`:7595`), "Delete money move, Needs to Savings, 2026-10-01, ₮10,000" (`:10911`), "Payments to Car loan" (`:11866`), "History of Emergency fund" (`:10420`). Amounts go through `fmt`, and a recurring plan carries its "Since …" date, as the visible row does.
- **CODE-04 has no visible effect.** `calcSalary` paints exactly the object `computeSalary` returns (`:6827-6845`). Typing in a Salary split row no longer repaints the breakdown above it.

## Findings

### UI-01: A delete refused after another window's change says "nothing was saved… save again"

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - `commitWrite` `:10717`, which shows `DB_REPLACED_MSG` (`:10688`)
  - Account delete `:10885-10890`; money-move delete `:10942-10947`
- **Evidence:**
  - Both delete handlers now pass their pre-confirm snapshot to `commitWrite`. If any other window writes while the confirm is open, the delete is refused with: "Another window changed your records while this was open, so nothing was saved. Check the details and save again.", titled "Not saved".
  - The user pressed ✕ and then "Delete". There is no Save button on the Accounts list. The action they need to repeat is the delete.
  - This refusal is new in Sprint 3. The ruling fixed only the vanished-record sentence (WORK-16's), so this sentence's use on a delete was not ruled.
- **Impact:**
  - A user with no training reads "nothing was saved" as unrelated to what they just did, and "save again" points to a control that does not exist on this screen.
  - The row is still in the list, so the user cannot tell whether the delete happened, failed, or is pending.
  - This is the only refusal in the app that names the wrong verb for the act it refuses.
- **Recommendation:**
  - Give `commitWrite` an optional message for this case. The two delete handlers pass a delete-worded sentence, for example: "Another window changed your records while this was open, so nothing was deleted. Check the list and delete again.", titled "Not deleted".
  - Edit sheets keep `DB_REPLACED_MSG` unchanged.
  - Leave the vanished-record sentence as ruled.
- **Effort:** XS

### UI-02: Some row actions are still unnamed after WORK-13: payment and contribution deletes, and the goal and debt card actions

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - Debt payment history: `aria-label="Delete payment"` `:12139`
  - Goal contribution history: `aria-label="Delete contribution"` `:12984`
  - Goal card "+ Add ₮" `:10419`; debt card "+ Payment" `:11865`, and "Mark settled" / "Settled" `:11867`
- **Evidence:**
  - WORK-13 named Edit, Delete, History and Payments on every list in its scope, and extended this to Debts.
  - Inside the two history sheets, every row's delete is still announced identically ("Delete payment", "Delete contribution"). These rows differ only by amount and date.
  - On each goal and debt card, three actions in the same button group as the newly named ones still carry no name, so a list of three debts announces "Mark settled" three times.
  - The source finding (Round 19 UI-08) listed neither of the history sheets, so this is a gap in coverage, not a regression.
- **Impact:**
  - It is the defect WORK-13 was ruled to remove ("cannot tell which record a Delete removes"), on the two ledgers where a delete gives money back to an account.
  - Within one card group, some buttons now name their record and some do not, so the pattern is no longer consistent.
- **Recommendation:** Apply the same pattern in the same form:
  - `Delete payment, ${date}, ${fmt(amount)}` and `Delete contribution, ${date}, ${fmt(amount)}`;
  - `Add to ${g.name}`, `Add payment to ${d.name}`, `Mark ${d.name} settled`.
  - Visible text does not change.
- **Effort:** XS

### UI-03: "Past moves" looks and is spaced exactly like one more field label in the Move money form

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - Markup `:3234-3239`
  - `.group-label` style `:1087`; button `margin-top` `:1156`; spacing tokens `:128`
- **Evidence:**
  - `.group-label` shares one rule with `label`: same size (`--t-sm`), colour (`--text-2`), weight (medium) and `margin-top: var(--s3)` (12px).
  - "Past moves" therefore sits 12px under the Move Money button. That is the same gap and the same type as "From", "To", "Amount", "Date" and "Notes" above it.
  - The two existing `.group-label`s that introduce a section set `font-weight:600` inline (`:3147`, `:12915`). This one does not.
- **Impact:** WORK-15 exists because the move history "reads as part of the form". The label is now present, but it reads as a field label and not as a section break. A user scanning on a phone may still take the list as part of the form. The ruled shape is met, but its purpose is only partly met.
- **Recommendation:** Keep the one ruled `.group-label` and add the existing section treatment inline: `margin-top: var(--s5); font-weight: 600`. That gives a 24px break on the 8px system and matches the other section-introducing labels. No markup or behaviour changes.
- **Effort:** XS

### UI-04: The WORK-22 result is recorded without the outcome its ruling defined, and is filed under the wrong item

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\reports\HANDOFF.md:116-125`; ruling `D:\3_Claude\PowerApps\reports\chief-architect.md:76`
- **Evidence:**
  - The ruling says that if a re-render of either list "takes over 100 ms at 10,000 records under the assumed 6x phone slowdown, approve delegation… Otherwise close it."
  - HANDOFF records All Time at 137 ms (Income) and 145 ms (Expenses) unthrottled, and estimates "~0.8-0.9 s at 6x", which is above that threshold.
  - It then says the figures "may corroborate a deferral, not fire one" under C44. It also calls the deferred item "WORK-13's delegation question", but the deferred row is "WORK-22, delegation".
  - So the item is neither approved nor closed, as the ruling required, and the record names the wrong item.
- **Impact:**
  - **User:** someone who chooses All Time with a large history waits close to a second on a phone after every add or delete on the commonest write path. The ruling built its trigger to catch exactly this.
  - **Team:** the next reader cannot tell whether delegation is approved, closed or still open, and searches under the wrong ID.
- **Recommendation:** Do not change any code. Correct "WORK-13" to "WORK-22" in HANDOFF. Ask the Chief Architect to state the outcome: either the 100 ms trigger fired on All Time, or C44 governs and the deferral stands. Only the ruling's owner can decide that.
- **Effort:** XS

### UI-05: The Salary breakdown can print parts that do not add up to its totals by ₮1 (pre-existing)

- **Severity:** Low
- **Location:** `computeSalary`, `D:\3_Claude\PowerApps\expense-pwa\index.html:6804-6822`, and its comment `:6795-6803`
- **Evidence:**
  - Each component is rounded on its own, and so are `gross`, `deductions` and `net`, from their raw values.
  - Worked example, rate 1,001 with 1 OT hour and 1 OT+night hour:
    - OT 1,501.5 rounds to ₮1,502; OT+night 1,801.8 rounds to ₮1,802.
    - Gross 3,303.3 rounds to ₮3,303, but the parts shown add up to ₮3,304.
  - With 10% SI and 10% WHT:
    - Deductions 660.66 round to ₮661; Net 2,642.64 rounds to ₮2,643.
    - Gross minus Deductions on screen is ₮2,642.
  - The comment says this function creates "ONE rounding boundary" so that parts add up to the total "which is the one thing a breakdown exists to do". The code does not deliver that.
  - CODE-04 moved this code unchanged, as ruled. This was not introduced by Sprint 3.
- **Impact:** A user checking their payslip against the breakdown finds a ₮1 arithmetic error in the app's own sum. The stored net matches the net shown, so no record is wrong.
- **Recommendation:**
  - Derive totals from the rounded parts: `gross = sum of rounded parts`, `deductions = r(si) + r(wht)`, `net = gross − deductions`. Alternatively, correct the comment to state what the code does.
  - The first option changes stored salary values by up to ₮1, so it needs a ruling before it is scheduled.
- **Effort:** S

### Review areas

- **Layout and Hierarchy:** Clean. No Sprint 3 change moves a headline figure. On "Past moves" see UI-03.
- **Navigation:**
  - Clean.
  - Every new dialog has Cancel. WORK-21's Cancel returns to the open sheet.
  - The vanished-record path closes the sheet and does not trap the user.
- **Typography:** UI-03 only. No new sizes.
- **Colour and Theme:**
  - Clean.
  - WORK-21's link uses the quiet `--text-2` style its siblings use.
  - The money-move amount keeps its neutral colour.
- **Spacing:** UI-03 only.
- **Cards:** Clean. No new cards.
- **Mobile:** Clean. No new fixed widths and no new touch targets.
- **Accessibility:**
  - WORK-13 is met for its ruled lists; the gaps are in UI-02.
  - "Past moves" is a `div`, as ruled, so heading navigation does not reach it. This follows from the ruled shape and is not raised.
- **States:**
  - UI-01.
  - Every destructive action in scope is still confirmed.
  - The money-move delete re-checks the shortfall after its confirm (`:10943`).
  - Not raised: on a delete whose record another window already removed, WORK-10's ruled sentence reads "This entry was deleted in another window. Nothing was saved." under "Not saved". The sentence was ruled word for word, and the "This entry" wording is closed (`chief-architect-sprint2-review.md:85`).
- **Numbers and Formatting:**
  - UI-05, which predates this sprint.
  - Every new amount goes through `fmt`, with an explicit `-₮` for negatives (`shortfallText` `:10666`).
- **Not user-facing:**
  - CODE-04 (no visible change).
  - The `sw.js` key, which still reads `expense-tracker-v29` as the brief states. I did not open `sw.js` in this review.

## Quick Wins

None. No finding in this report is Medium or above. UI-01, UI-02, UI-03 and UI-04 are each XS and could ride along with the next copy commit before the v29 deploy.

## Estimated UX Impact

There are no Critical or High findings to fix. As shipped, Sprint 3 means:
- lowering an account's starting amount below what has been spent from it is warned in the same words as every other change that does so, and is still allowed;
- an account or money-move delete that races another window no longer goes through against records the user never saw;
- a screen-reader user hears which income, expense, category, type, goal, debt or move each Edit or Delete acts on;
- the move history has a label.

Fixing UI-01 would make the new delete refusal name the act it refused. Fixing UI-02 would finish WORK-13 on the two ledgers where a delete gives money back to an account.
