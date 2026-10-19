## Executive Decision

**No. Not in its current state.** It can be released once WORK-01 and WORK-02 have landed. The code is correct: the keypad writes no record, the amount is a capped whole-tugrik integer, and the form's Add stays the only write path. Code Review's 93/100 is supported by the source, and I checked `quickEntryTo()` at index.html 6826-6837 myself. But correct financial data depends on the user recording it correctly as well as on the code. A big coloured "↓ Expense" button that looks like the last step, landing on a form that already looks complete, will produce missing and misfiled entries without any error. A keyboard path that throws away the typed amount on Enter is a small but real defect in the same flow. Both fixes are small, change no save logic, and must be in before this feature reaches main.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Action buttons look like a save but only open a form that still needs Add | Removes the one High finding. The user's totals are what is at stake: entries either go unrecorded or are filed under the preselected category. **Shape:** relabel to "Income →" / "Expense →". Call the existing `toast()` (index.html 5806) once on arrival with "Not saved yet. Check the category, then tap Add." Use the toast, not a persistent helper line. A helper line needs new markup on two forms plus logic to decide when to hide it. The toast needs neither, and its duration already scales to the message length. Select defaults and save logic stay unchanged, as UI Review asked. Update the probe to assert the toast text. Gates merge. |
| WORK-02 | Enter after typing an amount closes the sheet and loses it | Real data loss for keyboard and screen-reader users. **Shape:** handle Enter in the existing keydown handler at index.html 6849: `preventDefault()` and do nothing unless focus is on `#quickIncome` or `#quickExpense`, where the button's normal activation goes ahead. Do not make Enter run Expense; that would add a second one-key route into the hand-off that WORK-01 is fixing. Do not change the shared `openModal()`. UI Review's other option, focusing the Expense button or a key, does not work as written (see Architecture Strategy, Risks). Move the probe's keyboard steps off `#quickClose` and add an Enter assertion. Gates merge. |
| WORK-03 | Header button has no visible label and reads as a calculator | A feature the target user cannot find or recognise does not serve them, and the guidelines require screens to be understandable without training. **Shape:** swap the calculator glyph for a plus / "₮+" mark. No visible text label, because the 320px header has no width for one. The existing probe checks the header width and must stay green. |
| WORK-04 | Income/Expense pair styled like Cancel/Confirm, 13px vs 15px | It touches the same two buttons as WORK-01, costs XS, and fixes a breach of the sizing guideline. Give both buttons the same class and size. Expense stays on the right. |
| WORK-05 | Action row sits 8px from the keys and reads as a fifth key row | XS and one CSS value. A thumb aiming for 0 or ⌫ that hits Income or Expense now moves the user to another screen. Set `.quick-actions` margin-top to `--s4`. |
| WORK-06 | Two different "quick" features on the same path | It is part of the naming decision WORK-03 forces anyway, since that work touches `title` and `aria-label`. **Ruling on the name:** "Enter amount", not "Add entry". A sheet that does not add anything should not be called Add, because that name would repeat the exact misreading WORK-01 removes. Apply it to `#quickTitle`, `#quickBtn` title/aria-label and the close button label. Internal `quick*` identifiers stay as they are; renaming them is churn with no user benefit. |
| WORK-07 | Synthetic `input` event does not bubble | One line (`{ bubbles: true }`). It makes the design comment true and closes the silent divergence any future delegated listener would hit, including the split, which is money. |
| WORK-08 | Probe does not check the income split half of the hand-off | The income split decides which account the money is credited to, so it is financial data, and the comment claims a property no gate enforces. Add one probe flow with two accounts and the split turned on, asserting `#incSplitRest` after the hand-off. Approved in preference to the cheaper option of narrowing the comment, because the property is worth enforcing. Not a merge gate: the listener is attached directly today and WORK-07 makes the event match a typed one. |
| WORK-09 | Expense hand-off can clear an unsaved Planned recurrence draft | Approved as the comment-only option, XS: record in `quickEntryTo` that switching to Actual clears an unsaved schedule, as the toggle does. No confirmation step and no probe check, per the reviewer. The loss is rare, affects unsaved input only, and matches existing toggle behaviour. |
| WORK-10 | Duplicated amount derivation | Approved **only** as the single `quickAmount()` helper used by `renderQuickEntry` and `quickEntryTo`. Two derivations of the amount that gates the buttons and the guard can drift apart, and that would be a money-path defect. The cached `const sheet` reference and any change to the top-level `quickDigits` are not approved (see Rejected). |
| WORK-11 | `.quick-modal` is unused | Remove it. XS, and it sits on the markup line WORK-06 already edits. Do not invent a rule for it. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-10 (part) | Cache `document.getElementById('quickSheet')` in one `const` | Preference. Five lookups of one id on user taps cost nothing measurable and carry no correctness risk. It is split off from the approved helper because it is a separate change. |
| WORK-10 (part) | Move `quickDigits` off the top level | The reviewer advises against it and I agree. It matches the file's existing pattern (`expMode`, `spendReturnTo`), and changing it in isolation would make this section the odd one out until the file moves to modules. |

No `WORK-` item is rejected in full.

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-12 | Expense from Planned mode renders the list twice | Either of two things. (a) A render-cost measurement at realistic volume (around 10,000 transactions, low-end Android) shows the double render on the hand-off is noticeable. (b) A third caller of "set mode, then navigate to Expenses" appears. At that point, build one function that renders once and fix both the More → Budget path and Quick entry together, with no special case for Quick entry. The WORK-09 comment moves into that function when it exists. |

## Conflict Rulings

**Conflict 1: Is the hand-off safe to ship?**
Both reviewers are right about different things, and I side with UI Review on readiness. Code Review is right that the code writes nothing wrong. UI Review is right that the screen invites wrong records. This project ranks correctness of financial data above everything else, and figures are only correct if entries get recorded and filed properly. A flow that predictably leads to missing or misfiled entries is a correctness risk even when every line of code is right. **Ruling: WORK-01 gates the merge to main.** On the Engineering Manager's severity note: UI-01 stays High. Only the reviewer sets severity, and High is defensible: the code produces no wrong figure, and the harm depends on the user misreading the screen, which the fix addresses directly. My gating ruling does not depend on the rating. I would gate this as a High because it is cheap and the cost falls on the user's totals.

**Conflict 2: Keyboard integration.**
There is no real contradiction. Code Review's "Integration: Clean" covers the wiring: routing through the modal stack, Escape/Back, returning focus, package.json. UI Review's UI-02 is about behaviour: where focus lands and what Enter does there. I confirmed it: `openModal()` (index.html 6447-6451) focuses the first focusable element when there is no field, and that element is `#quickClose` (3673). The keydown handler (6849-6853) does not handle Enter. **Ruling: UI-02 stands as a Medium. WORK-02 gates the merge, in the shape set out in Approved.**

## Development Order

Commit the current uncommitted feature to a feature branch, not to main. Land each approved item below as its own change on that branch. Merge to main only once WORK-01 and WORK-02 are in. All approved items must land before the next publish, together with the `sw.js` cache bump past `expense-tracker-v30` that the release note requires.

1. **WORK-01.** It removes the High. Every later edit to the buttons and to `quickEntryTo` builds on the final labels and hand-off.
2. **WORK-04.** Same two buttons. Settle class and size right after the labels so the buttons are edited in one pass.
3. **WORK-05.** Same action row, one CSS value. Done while the row is open.
4. **WORK-02.** Second merge gate. Done after the buttons are final, because the Enter guard checks for those two buttons. The probe's keyboard steps move off `#quickClose` here.
5. **WORK-03.** The header mark.
6. **WORK-06.** The name. It follows WORK-03 because they are one decision about how the feature presents itself.
7. **WORK-11.** Remove the dead class on the sheet markup WORK-06 just touched.
8. **WORK-07.** One line in `quickEntryTo`, after WORK-01's edits to that function have settled.
9. **WORK-08.** The split probe. It goes after WORK-07 so the gate covers the event as it will finally be dispatched.
10. **WORK-09.** A comment in `quickEntryTo`.
11. **WORK-10.** The `quickAmount()` helper goes last, so it is written once against the final shape of both functions.

`npm test` must pass at every step, not only at the end.

## Architecture Strategy

**What stays**
- The form is the only write path. The keypad hands over an amount and never writes a record. That is the property that makes this feature safe, and it is not negotiable.
- The shared modal stack (`openModal`/`closeModal`) handles every sheet. Its focus rule stays general. Feature-specific keyboard behaviour lives in the feature's own handler.
- The single-file, offline-first, no-dependency structure, the token scale, and the 320px probe discipline.
- Select defaults on the Income and Expense forms. WORK-01 fixes the cue, not the defaults.

**What changes**
- **Pre-fill convention.** From now on, any new code that pre-fills a money field dispatches a bubbling `input` event, so every listener, direct or delegated, sees it exactly as a typed value. The existing callers that use `formatMoneyInput` directly are not migrated this quarter. Nothing is broken there, and moving them is unrequested work. This answers the Engineering Manager's request for a decision before a third caller appears.
- **"Set mode and navigate to Expenses."** This becomes one function when the WORK-12 trigger fires, and not before.

**What is off limits**
- A keypad that saves records directly, or any second write path.
- Confirmation dialogs on the hand-off or on mode switching (rejected by both reviewers' recommendations).
- A tab for this feature, or a visible text label in the header.
- A fourth header icon without the 320px header probe passing.
- Currency handling in the keypad. The ₮-only display follows the whole-tugrik rule and changes only when multiple currencies become a ruled roadmap item.

**Risks (not findings)**
- UI-02's first suggested fix does not work as written. `#quickExpense` is disabled when the sheet opens at ₮0, so it cannot take focus. Focusing a digit key instead would make Enter enter that digit, which turns one bug into another. This is why WORK-02 is ruled as an Enter guard in the keydown handler.
- The WORK-02 guard also blocks Enter on the close X. That is intended. Keyboard users close the sheet with Escape, which already works through the modal stack.
- A toast is transient. If post-implementation review shows users still tap Add without checking the category, the next step is a persistent helper line on the destination form. Do not build that pre-emptively.

## Final Recommendation

Commit the current Quick entry work to a feature branch and implement WORK-01 there first. Relabel the buttons "Income →" / "Expense →", call the existing `toast()` on arrival with "Not saved yet. Check the category, then tap Add.", and update tools/harness/quick-entry.js to assert it, with `npm test` green. Do not touch select defaults or save logic. That one change removes the only release-blocking risk in this scope. Next comes WORK-02, and then the feature can merge to main.

Files:
- D:\3_Claude\PowerApps\reports\engineering-manager.md
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\expense-pwa\index.html (Quick entry section 6793-6855, sheet markup 3671-3695, `openModal` 6439-6452, `toast` 5806)
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js
- D:\3_Claude\PowerApps\expense-pwa\sw.js (cache bump at publish)
