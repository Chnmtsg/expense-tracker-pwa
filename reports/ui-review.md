# UI Review: Quick entry keypad (uncommitted)

Scope: `#quickBtn`, `#quickSheet`, the `.quick-*` CSS and the Quick entry JS in D:\3_Claude\PowerApps\expense-pwa\index.html, plus the probe D:\3_Claude\PowerApps\tools\harness\quick-entry.js. I reviewed the source only. I did not run the probe or render the screens.

## Executive Summary

The keypad is well built. It uses the spacing, type and radius tokens, every key is at least 44px, it reuses the modal stack (so Escape and Android Back work), and it leaves the form's Add button as the only write path. The biggest problem is a mismatch between what the sheet looks like it does and what it actually does. The design copies a bank's send-money screen, where the big coloured button at the bottom completes the action. Here "↓ Expense" only moves the user to a form that still needs Add, and nothing in the sheet or on the form says the entry is not saved yet. That form already has a category chosen, so a user without training is equally likely to walk away thinking it is saved, or to tap Add and file it under whatever category happens to be first. Two smaller problems sit next to it: a keyboard user who presses Enter throws away the amount, and the header button is an icon with no visible label that looks like a calculator.

## Overall Score

**78 / 100.** That is the "Solid" band. There is one contained High finding (UI-01) and two Mediums (UI-02, UI-03), all cheap to fix. The rest is Low polish. The structure underneath (write path, modal handling, tokens, touch targets) is sound and does not need rework.

## Strengths

- **One write path.** `quickEntryTo()` only fills `#incAmount`/`#expAmount` and fires `input`, so formatting, the income split, account choice and every check run exactly as they do for a typed amount. The probe confirms no record is written before Add.
- **Input rules are right.** Leading zeros are dropped (`0` and `000` do nothing on an empty amount), input stops at 12 digits, and both action buttons stay disabled at ₮0. A zero or runaway amount cannot reach the form.
- **Sizing and tokens.** Keys are 56px tall. Spacing uses `--s2/--s4/--s5`, radius uses `--r-sm` and type uses `--t-hero/--t-h3`, all from the existing scale. The amount shrinks with the viewport (`min(var(--t-hero), 8.5vw)`), and the probe checks the longest amount at 320px.
- **Modal behaviour comes for free.** It goes through `openModal`/`closeModal`, so focus is trapped, focus returns afterwards, Escape works and Android Back closes the sheet.
- **Arrows match the rest of the app.** "↑ Income / ↓ Expense" follows the ↑/↓ convention already used in the Analytics legend and the day columns (index.html lines 2783-2784, 9209-9210).
- **A physical keyboard types into the keypad.** Digits and Backspace work, and Ctrl/Alt/Meta shortcuts are left alone.
- **The header is checked.** The probe confirms that with three icons the header neither overflows nor wraps any screen title at 320px.

## Findings

**UI-01: The sheet's action buttons look like they save the entry, but they only open a form that still needs Add**

- Severity: High
- Location: index.html lines 3690-3693 (`#quickIncome`, `#quickExpense`) and `quickEntryTo()` around line 6826. The problem shows up on the Income screen (Add Income) and the Expenses screen (Add Actual Expense).
- Evidence:
  - The sheet copies a send-money screen: a large amount, a keypad, then a full-width primary button "↓ Expense". On that model, the bottom button is the final action.
  - Tapping it closes the sheet and switches screens. No toast, helper line or label change tells the user the entry is not saved.
  - The destination select is never empty. `rebuildSelect()` (line 10950) always leaves an option selected, so after the hand-off the form looks finished: the amount is there in large text and a category or type is already chosen.
  - The code comment says focus lands on "the one field still to choose", but that field already has a value. The only cue is the focus ring on the select.
  - The probe (quick-entry.js line 116) clicks `expAdd` straight after the hand-off and the record is written under the preselected category. This path really is one tap long.
- Impact: The feature is aimed at the least experienced users. Some will assume the button saved the entry and leave, so the expense is never recorded and their totals and balance are wrong. Others will tap Add without looking at the category and file the expense wherever the first category is. Both cost the user money visibility and neither shows an error. The same risk applies to the Income button.
- Recommendation: A small correction is enough; no redesign is needed.
  1. Make the buttons read as the next step, not the end, for example "Income →" / "Expense →".
  2. On arrival, show one helper line or a short toast on the destination form: "Not saved yet. Check the category, then tap Add."
  3. Do not change how the select defaults or how saving works.
- Effort: S

**UI-02: Pressing Enter after typing an amount closes the sheet and loses the amount**

- Severity: Medium
- Location: index.html, the `#quickSheet` markup (line 3673, `#quickClose` is the first focusable element) and `openModal()` (lines 6447-6451). The keydown handler is around line 6849.
- Evidence:
  - The sheet has no INPUT, SELECT or TEXTAREA, so `openModal` puts focus on the first focusable element, which is the close X.
  - The keydown handler catches digits and Backspace but not Enter.
  - A keyboard user types "25000" and presses Enter. The browser treats that as a click on the focused close button, the sheet closes and the amount is gone.
  - The probe sends its keyboard events to `#quickClose` and never tests Enter, which is consistent with focus starting there.
- Impact: The guidelines ask for the app to be keyboard friendly. Here the most natural keyboard action, Enter to confirm, does the opposite of what the user wants. A screen-reader user also lands on "Close quick entry" rather than on the amount.
- Recommendation: Make sure Enter can never land on the close button. Either:
  - focus a key or the Expense button when the sheet opens, or
  - handle Enter in the existing keydown handler (do nothing, or run Expense when an amount is entered).

  The first option alone is enough.
- Effort: XS

**UI-03: The header button has no visible label and looks like a calculator**

- Severity: Medium
- Location: index.html line 2625 (`#quickBtn`), in the header on every screen.
- Evidence:
  - The icon is a calculator outline: a rectangle, a display bar and a 3x3 grid of dots.
  - "Quick entry" exists only in `title` and `aria-label`. `title` never appears on touch devices, and the project says Android is its main platform.
  - The app already has a module called Salary Calculator, and this icon sits next to the bell and palette icons.
- Impact: The project says the target user should understand every screen without training. A user like that will either never find the feature or open it expecting a calculator. The feature only helps people who already know it is there.
- Recommendation: Keep the button where it is and choose one fix:
  - use a plus or a "₮+" style mark that reads as adding an entry, or
  - add a short visible text label once the width allows it.

  Do not add a tab.
- Effort: S

**UI-04: The Income/Expense pair is styled like Cancel/Confirm, and its two labels use different type sizes**

- Severity: Low
- Location: index.html lines 3691-3692. Styles are at lines 1166 and 1175-1179.
- Evidence:
  - `#quickIncome` uses `.secondary` and `#quickExpense` uses `.primary`.
  - Everywhere else in the app, a secondary/primary pair inside a modal means Cancel/commit (for example, `#editModal` at lines 3661-3662).
  - `.secondary` also sets `--t-sm` at medium weight, while `.primary` uses `--t-body` at semibold, so the two labels in this pair render at 13px and 15px.
- Impact: Income looks like the "back out" choice, and the pair breaks the guideline on consistent sizing. Users still read the labels, so nothing fails.
- Recommendation: Give both buttons the same weight and size. Either use the same class for both, or override the font size on `.quick-actions > button`. Making Expense the default by placing it on the right is enough.
- Effort: XS

**UI-05: The action buttons sit as close to the keypad as the keys sit to each other**

- Severity: Low
- Location: index.html lines 2086 and 2094 (`.quick-keys` gap `--s2`, `.quick-actions` margin-top `--s2`).
- Evidence: The gap between keys and the gap between the last row of keys (000, 0, ⌫) and the action buttons are both 8px. The action buttons look like a fifth keypad row.
- Impact: A thumb aiming for 0 or ⌫ can land on Income or Expense. That is recoverable, because no record is written, but the user is moved to another screen.
- Recommendation: Raise `.quick-actions` margin-top to `--s4` or `--s5` so the commit row separates visually from the keys.
- Effort: XS

**UI-06: Two different features on the same forms are both called "quick"**

- Severity: Low
- Location: index.html, `#quickSheet` "Quick entry" (line 3674) and the existing "Quick amount" chips `#qaRowInc`/`#qaRowExp` (lines 2931 and 3021) with their "Quick amounts saved" toast (line 13017).
- Evidence: The keypad hands the user to forms whose amount field already has a row of "quick amount" chips. The two features share a name and have nothing to do with each other.
- Impact: Help text, support conversations and the user's own mental model now have two different "quick" things on the same path.
- Recommendation: Rename the keypad (for example "Add entry" or "Enter amount") when the label from UI-03 is chosen.
- Effort: XS

### Area coverage

- **Layout and hierarchy:** Clean. The amount is first and largest, and the keys come second. The commit row is covered in UI-05.
- **Navigation:** Close, Escape, backdrop tap and Android Back all leave the sheet. Where the hand-off lands is covered in UI-01. Finding the button is covered in UI-03.
- **Typography:** Uses the token scale. The size mismatch is covered in UI-04.
- **Colour and theme:** Clean. Only theme tokens are used, and the arrows plus text labels mean colour never carries meaning alone.
- **Spacing:** Every value is on the 8px scale. The grouping issue is covered in UI-05.
- **Cards:** Not applicable. The sheet uses the shared `.modal` styling unchanged.
- **Mobile:** Clean. Keys are 56px, every target is at least 44px (checked by the probe), and the header and amount do not scroll sideways at 320px. By my estimate the sheet fits inside the 90vh limit on a 568px-tall screen.
- **Accessibility:** The global `button:focus-visible` ring covers the keys, ⌫ has a label, the amount output uses `aria-live="polite"`, and the destination select gets the `select:focus` ring. Focus on open is covered in UI-02.
- **States:** The disabled state at ₮0 is correct and makes clear why the buttons are off. No loading state is needed because nothing is async. No confirmation is needed because nothing destructive happens and dismissing the sheet only discards an amount that is easy to retype. The missing "not saved" state is covered in UI-01.
- **Numbers and formatting:** Clean. The amount goes through the shared `fmt()`, no sign is ever shown, and the hand-off produces the same "25,000" a typed amount would.

## Quick Wins

- **UI-01** (S, High): New labels plus one helper line remove the false sense that the entry is done.
- **UI-02** (XS, Medium): Changing where focus starts stops Enter from discarding the amount.
- **UI-03** (S, Medium): A clearer icon or a visible label is the difference between a feature people find and one they never see.

## Estimated UX Impact

With UI-01 fixed, the keypad's speed no longer works against getting the record right. Users will know the entry is not finished until they tap Add, and they will be asked to check the category at the moment they are most likely to miss it. That closes the two silent ways an untrained user ends up with wrong totals: entries never recorded and entries filed under the wrong category. Fixing UI-02 and UI-03 as well lets keyboard and first-time users finish the flow without losing their amount or needing to be told the feature exists. No changes to the data model or the save logic are needed.
