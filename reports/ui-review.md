## Executive Summary

The Enter amount keypad on main (33755f1) matches the previous ruling. All eleven approved items (WORK-01 to WORK-11) are in place, in the shape ruled. The one place the code differs from the ruled wording is an improvement (see Ruling Conformance). The High finding from the last review is resolved. The Income and Expense buttons now read "Income →" / "Expense →". On arrival, the form shows a "Not saved yet" toast and focuses the field the user still has to check. The Enter key can no longer close the sheet and throw the amount away. No Critical, High or Medium findings remain. The biggest remaining issue is small. The header button uses the same plus icon as every Add button that saves a record. So the entry point still hints "this adds something", the exact misreading the "Enter amount" name was chosen to avoid. The arrow labels and the toast catch that misreading downstream.

## Overall Score

**92 / 100.** No Critical, High or Medium findings, and the two Low findings are polish and consistency. Every target at 320px is at least 44px, which the probe enforces. The amount stays on one line at that width, also enforced. Keyboard paths and focus rings work. It does not score higher because I could only assess the toast's real effect (do users actually check the category?) through the ruled post-release observation, not from the source.

## Strengths

- **Only the form saves.** The keypad never writes a record. tools/harness/quick-entry.js checks that `db.actual` / `db.income` stay unchanged until Add is pressed, for both kinds.
- **The hand-off tells the truth.** Focus lands on `#expCategory` / `#incType`, the one field still to check, and the toast names that field. Text on the income side is "Check the type": the field there is labelled "Type" (index.html 2940), so the message matches the screen the user sees.
- **The amount is the most prominent thing in the sheet.** It uses `min(var(--t-hero), 8.5vw)` so the 12-digit maximum fits on one line at 320px without wrapping, and the probe asserts this.
- **Keyboard behaviour is complete.** Digits and Backspace type into the keypad from any focus. Enter works only on Income or Expense. Escape closes the sheet through the modal stack. Ctrl/Meta/Alt combinations are passed through, and Shift is not blocked, so AZERTY digit entry still works.

## Ruling Conformance (checked against D:\3_Claude\PowerApps\reports\chief-architect.md)

| Item | Landed as ruled | Evidence |
|---|---|---|
| WORK-01 | Yes, one improvement | Labels at index.html 3700-3701. Toast at 6854. Probe asserts both texts (quick-entry.js 125, 143). The ruled text said "category" for both forms; income says "type" to match its field label. |
| WORK-02 | Yes | Enter guard at 6876. `openModal()` unchanged. Probe keyboard steps target a key, with three Enter assertions (86-89). |
| WORK-03 | Yes | `#ic-plus` at 2633. No visible label. Header-width probe flow kept (44-61). |
| WORK-04 | Yes | Both buttons are `.primary` at `--t-body`, Expense on the right. |
| WORK-05 | Yes | `.quick-actions { margin-top: var(--s4) }` at 2098. |
| WORK-06 | Yes | `#quickTitle`, `#quickBtn` title/aria-label and close label all read "Enter amount". Internal `quick*` identifiers unchanged. |
| WORK-07 | Yes | `{ bubbles: true }` at 6848. |
| WORK-08 | Yes | Split flow at quick-entry.js 151-177 asserts the 20% row and `#incSplitRest`. |
| WORK-09 | Yes | Comment at 6836-6839. |
| WORK-10 | Yes, approved part only | `quickAmount()` at 6811, used by both functions. Sheet lookups are not cached, and `quickDigits` stays at the top level, as ruled. |
| WORK-11 | Yes | `.quick-modal` no longer appears anywhere in index.html. |

Still outstanding from the ruling, and not a UI finding: expense-pwa/sw.js line 9 still reads `expense-tracker-v30`. The ruling requires a bump past v30 at the next publish. Until then, people who installed the app keep the cached build and will not get this feature or its fixes.

## Findings

**UI-01 — The header entry point uses the app's "save a record" icon**

- Severity: Low
- Location: expense-pwa/index.html 2632-2634 (`#quickBtn`), header on every screen
- Evidence: `#quickBtn` renders `<use href="#ic-plus"/>`. The same symbol sits on all seven buttons that write a record: Add Income (2965), Add Expense (3078), Add Goal (3202), Add Account (3248), Add Debt (3423), Add Category (3486) and Add Income Type (3494). Inside this app, the plus means "this writes a record". WORK-06 rejected the name "Add entry" for exactly this reason: "a sheet that does not add anything should not be called Add".
- Impact: The first thing a new user sees promises the action the sheet deliberately does not perform. The "→" labels and the "Not saved yet" toast catch the misreading later, so no wrong record results. But every first use starts with a mismatch between icon and outcome. This is a consistency problem, not a data risk. That is why it is Low.
- Recommendation: Use the "₮+" mark the ruling already allowed for WORK-03. That keeps a plus (findable, no label needed at 320px) and ties it to money rather than to the generic Add icon. The header-width probe must stay green. If the Chief Architect prefers to keep the plain plus, record that choice so the inconsistency is a decision rather than drift.
- Effort: XS

**UI-02 — Keypad keys have no hover state**

- Severity: Low
- Location: expense-pwa/index.html 2087-2093 (`.quick-key`), Enter amount sheet
- Evidence: `.quick-key` defines only `:active`. Every comparable control in the app has a hover state, including `.icon-btn:hover` (834) and `button.primary:hover` / `button.secondary:hover` (1173, 1180). That includes the two action buttons directly below the keys in the same sheet.
- Impact: With a mouse, the twelve keys give no feedback on hover while the buttons beneath them do, so the keys look less interactive than the row below. Touch users are not affected.
- Recommendation: Add `.quick-key:hover { background: var(--border); }`, the same treatment `.icon-btn` uses on the same `--surface-2` fill.
- Effort: XS

## Review Areas

- **Layout and hierarchy:** Clean. Inside the sheet, the amount comes first, then the keys, then the next step.
- **Navigation:** Clean. The sheet opens from every screen. Close, Escape and a backdrop tap all exit. The hand-off lands on the correct module, in Actual mode for Expense.
- **Typography:** Clean. Every size comes from the type scale (`--t-hero`, `--t-h3`, `--t-body`), and both action buttons are the same size.
- **Colour and theme:** Clean. Only theme tokens are used. Income and Expense are no longer distinguished by colour alone; both carry text labels.
- **Spacing:** Clean. Every value is a token. The visible gap above the action row is about 28px, because `button.primary` adds its own `--s3` margin on top of the row's `--s4`. That is still clearly separate from the 8px key gap, which is the point of WORK-05.
- **Cards:** Not applicable. The sheet uses the shared `.modal`.
- **Mobile:** Clean. Fourteen targets are at least 44x44px, enforced by the probe. No sideways scroll at 320px, enforced by the probe.
- **Accessibility:** Clean. Keys are real buttons and get the global `:focus-visible` ring. ⌫ has an aria-label. The amount announces itself through `aria-live="polite"`, and the toast region is `role="status"`. Disabled buttons at ₮0 are exempt from contrast requirements.
- **States:** Clean for this scope. The zero state disables both actions. There are no async actions and no destructive actions. Dismissing the sheet throws away only the amount being typed, which is not a saved record.
- **Numbers and formatting:** Clean. `fmt()` gives the same ₮ grouping used everywhere else. The value is whole tugrik, capped at 12 digits, and its sign is never ambiguous.

## Quick Wins

None. Neither finding is Medium or higher.

## Estimated UX Impact

There are no Critical or High findings to fix. The previous High (UI-01, action buttons that looked like a save) and the previous Medium (UI-02, Enter throwing away the amount) are both resolved on main. A user now ends up on the right form with the amount filled in, the field to check focused, and a plain statement that nothing has been saved yet. The remaining uncertainty is behavioural. The toast is short: about 2.9s for the expense message, using `msg.length * 60`. Whether users actually read it before tapping Add can only be learned from the post-release observation the ruling set up as its trigger for a persistent helper line. Nothing in the source settles that question either way.

Files reviewed:
- D:\3_Claude\PowerApps\expense-pwa\index.html (CSS 2076-2099, header 2621-2643, sheet 3674-3704, JS 6802-6879, `toast` 5815, button system 1136-1214)
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js
- D:\3_Claude\PowerApps\package.json (`quick` script, line 29; included in `test`, line 22)
- D:\3_Claude\PowerApps\expense-pwa\sw.js (line 9, cache still v30)
- D:\3_Claude\PowerApps\reports\chief-architect.md (previous ruling)
