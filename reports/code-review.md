## Executive Summary

The Quick entry change is small and contained, and it is sound where it matters most. It writes no money record. The amount is a whole-tugrik integer of at most 12 digits, built from a digit string. It reaches the form as an unformatted integer string and goes through the same formatMoneyInput, unmoney and Add path as a typed amount. The sheet uses the existing openModal/closeModal stack, so Escape, Back and focus return behave like every other sheet. The probe is wired into `npm test`, and run.mjs fails the run on its THREW, ERROR and console-error fields. The biggest risk is small: the hand-off fires a synthetic `input` event that does not bubble, unlike a real one. The code comment says the value is handled "exactly as a typed one", and that holds today only because every current listener is attached directly to the field. Nothing in this change blocks release.

## Overall Score

**93 / 100.** There are no Critical, High or Medium findings, and the money path is correct and tested end to end. The six Low findings cover one fragile fidelity assumption, two probe and side-effect gaps, and minor tidiness. They keep the score off the top of the band but are not release risks.

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

**CODE-01 — The synthetic `input` event does not bubble, so it is not "exactly as a typed one"**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html`, `quickEntryTo()`, line 6834 (`input.dispatchEvent(new Event('input'));`). The claim it breaks is in the comment above, lines 6821-6823.
- Evidence: `new Event('input')` defaults to `bubbles: false`, but a real user `input` event bubbles. It works today only because every listener on these fields is attached directly to them: `initMoneyInputs()` (line 5547) and the `incAmount` listener that calls `renderIncomeSplit('inc')` (lines 7092-7094).
- Impact: Any later listener delegated from a parent (a form-level dirty flag, validation, or a delegated split listener) will react to typing but not to Quick entry. That is a silent divergence, and it contradicts a design-record comment. The convention elsewhere is to call `formatMoneyInput(inp)` directly (lines 10257-10259, 12990-12991), so readers have no prior example of this event-based route.
- Recommendation: Use `new Event('input', { bubbles: true })` so the dispatched event matches a real one.
- Effort: XS

**CODE-02 — The probe does not check the split half of the hand-off it claims to hold**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\tools\harness\quick-entry.js`, line 41 (`db.accounts = []`) and the Income flow at lines 121-135. The claim is in `index.html` lines 6822-6823 ("formatted and split exactly as a typed one").
- Evidence: The probe clears all accounts before running, so the income split never has anything to render. The Income flow only checks the formatted field value, the focus target and the written amount. Nothing checks that `renderIncomeSplit('inc')` ran on the dispatched event.
- Impact: If the split stops following the hand-off (CODE-01 is one way that could happen), an income could be saved with a stale split, and no gate would catch it. The comment states a property the gate does not enforce, which coding-standards.md ("Comments ... Keep them true") asks us to avoid.
- Recommendation: Add one flow with two accounts and a split turned on. Hand off an amount and assert that the split rest line (`#incSplitRest`) reflects it. Otherwise, narrow the comment to formatting only.
- Effort: S

**CODE-03 — Expense from Planned mode renders the Expenses list twice in one tap**

- Severity: Low
- Location: `index.html`, `quickEntryTo()`, lines 6830-6831.
- Evidence: `setExpMode('actual')` ends with `renderExpenses()` (line 7212), and `navigate('expenses')` calls `renderExpenses()` again (line 6876). The More → Budget path (lines 6785-6787) has the same pattern, so this copies existing behaviour rather than introducing it.
- Impact: The list render runs twice on the tap meant to be fastest. It is not noticeable at today's data sizes, but at 10,000 transactions on a slow phone it doubles the cost of the hand-off.
- Recommendation: Defer. Fix it together with the budget path when render cost is next measured, for example by having `setExpMode` skip its render when a `navigate` follows. Do not add a special case for Quick entry alone.
- Effort: S

**CODE-04 — The Expense hand-off can silently clear an unsaved Planned recurrence draft**

- Severity: Low
- Location: `index.html`, `quickEntryTo()`, line 6830, through `setExpMode()` lines 7201-7203.
- Evidence: `setExpMode` clears `expRecFreq`, `expRecCustomWrap` and `expRecEnd` whenever it runs. With the toggle, the user chooses that switch. With Quick entry, the switch to Actual is implicit: a user part-way through a recurring planned expense who opens the keypad and taps Expense loses the schedule fields without warning. The amount, category and notes are kept.
- Impact: Only unsaved form input is lost, never stored data. The case is rare, but the loss is invisible.
- Recommendation: Accept this and record it in the `quickEntryTo` comment ("switching to Actual clears an unsaved schedule, as the toggle does"), or check it in the probe. Do not add a confirmation step.
- Effort: XS

**CODE-05 — Repeated lookups, repeated parsing and a top-level mutable global**

- Severity: Low
- Location: `index.html` lines 6799, 6802, 6827, 6829, 6840, 6842.
- Evidence: `let quickDigits` is a top-level mutable global, against coding-standards.md ("Avoid global variables"). The rest of the file does the same with `expMode` and `spendReturnTo`. `Number(quickDigits) || 0` is written twice, in `renderQuickEntry` and `quickEntryTo`. `document.getElementById('quickSheet')` is looked up five times.
- Impact: The amount is derived in two places that could drift apart, for example if one gains a cap or validation and the other does not.
- Recommendation: Add a single `quickAmount()` helper (or one `const sheet` reference) and use it in both places. Leave the global as it is unless the file moves to modules. It matches the file's existing pattern.
- Effort: XS

**CODE-06 — `.quick-modal` is a class nothing uses**

- Severity: Low
- Location: `index.html` line 3672 (`<div class="modal quick-modal" ...>`).
- Evidence: No CSS rule, script or probe refers to `.quick-modal`. The only match for it is the markup line itself.
- Impact: It is a dead hook that suggests styling which does not exist.
- Recommendation: Remove it, or give it the rule it was meant to carry.
- Effort: XS

### Review areas with no findings

- **Correctness of Money:** Clean. The amount is an integer digit string capped at 12 digits (`QUICK_MAX_DIGITS`, line 6798), well within exact Number range. It cannot be NaN or Infinity, and it cannot be negative. Zero is blocked twice, by the disabled buttons and the `amount <= 0` guard (line 6828). Rounding stays in the existing `unmoney` and Add path. No dates are involved.
- **Data and Persistence:** Clean. Nothing is written, no schema changes, and it works fully offline. The probe asserts that no record exists before Add (quick-entry.js lines 115 and 131).
- **Architecture:** Clean apart from CODE-01. The keypad uses the form as its only write path and reuses `openModal`, `closeModal`, `navigate` and `setExpMode`. The UI does not touch storage.
- **Error Handling:** Clean. Every failure path is a disabled control or an early return, and nothing is swallowed.
- **Security:** Clean. Output goes through `textContent` only, keys come from fixed markup or are matched against `/^\d$/`, and no dependency was added.
- **Performance:** CODE-03 only.
- **Integration (modal stack, keyboard, package.json):** Clean. `data-dismiss="quickClose"` routes Escape and Back through the close control. Focus returns to `#quickBtn` before `quickEntryTo` moves it on. The `quick` script follows the pattern of the other `--width 320` probes, is appended to `test`, and the probe reports its outer catch as `ERROR`, which run.mjs reads.
- **Release note (not a defect):** `D:\3_Claude\PowerApps\expense-pwa\sw.js` still has `CACHE = 'expense-tracker-v30'`. Its own comment says to bump it before a publish, not on each commit, so it should be bumped when this change ships.

## Technical Debt

- Expenses mode switching and navigation are separate calls, and each one re-renders. That shape now appears in two places, the budget path and Quick entry (CODE-03). A third caller would make "navigate to Expenses in mode X" worth a single function.
- Field hand-off is done two ways: calling `formatMoneyInput` directly (quick-amount row, converter, transfer) or dispatching `input` (Quick entry). With two conventions, each new pre-fill has to work out which side effects it needs (CODE-01, CODE-02).

## Future Risks

- A delegated `input` listener on the Income or Expense form, which is a likely addition for a dirty-form guard or live validation, would silently miss Quick entry (CODE-01).
- The header now holds three icon buttons. The probe shows titles fit at 320px today. A fourth header action, such as a Notifications control from the roadmap, would go over that width, and the probe would catch it.
- Recording multiple currencies (the Cloud Sync and Investment Tracker items in the roadmap point that way) would break the keypad's hard-coded `fmt` (₮) display. That is consistent with the whole-tugrik rule documented at `unmoney` and is not a defect today.

## Recommended Refactoring

1. Make the dispatched event bubble (CODE-01) and add the split assertion to the probe (CODE-02). Together these make the hand-off comment true and enforced. Effort XS plus S.
2. Add a single `quickAmount()` helper and remove the dead `.quick-modal` class (CODE-05, CODE-06). Effort XS.
3. Defer: when render cost is next measured, merge "set mode and navigate to Expenses" into one call that renders once, covering both the budget path and Quick entry (CODE-03). Note the implicit schedule clear (CODE-04) in that function's comment.

Files reviewed:
- `D:\3_Claude\PowerApps\expense-pwa\index.html`: CSS lines 2076-2095, header lines 2622-2635, sheet lines 3667-3695, JS lines 6793-6855, plus integration points `openModal`/`closeModal`/`dismissModal` (lines 6439-6497), `fmt`/`unmoney`/`formatMoneyInput` (lines 5387-5514), `setExpMode` (line 7187), `navigate` (line 6858) and the income split listener (line 7092).
- `D:\3_Claude\PowerApps\tools\harness\quick-entry.js`
- `D:\3_Claude\PowerApps\tools\harness\run.mjs` (pass/fail contract)
- `D:\3_Claude\PowerApps\package.json`
- `D:\3_Claude\PowerApps\expense-pwa\sw.js`
