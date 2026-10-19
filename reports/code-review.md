## Executive Summary

The Quick entry keypad on main matches the previous ruling. I checked all eleven approved items (WORK-01 to WORK-11) against the source, and each one landed in the ruled shape. The one deliberate deviation is the income toast text, and it improves on the ruling. Neither rejected sub-item was built. The money path is correct: the amount is a capped whole-tugrik integer read in one place (`quickAmount()`), it reaches the form as a bubbling `input` event, and the form's Add button is still the only write path. The probe enforces that for both destinations and for the income split. The biggest remaining risk is a release step, not code: `sw.js` is still `expense-tracker-v30`, and the ruling made bumping it a prerequisite for the next publish. Everything else I found is Low.

## Overall Score

**93 / 100.** I found no Critical, High or Medium issues in the code. Four Low findings are left: a keyboard edge case, a silent digit cap, two comment-standard slips and an order-dependent probe. The outstanding cache bump is a publish step the ruling already scheduled, not a defect on main.

## Conformance to the previous ruling (reports/chief-architect.md)

| Item | Landed as ruled? | Evidence |
|---|---|---|
| WORK-01 | Yes, with one improvement | The labels read "Income →" / "Expense →" (index.html 3700-3701). `toast()` is called once on arrival (6854). The ruled text was "Check the category" for both forms. The implementation says "type" on Income, because the Income field is labelled "Type" (2940). That is more accurate, keeps the ruling's intent, and the probe asserts both strings (quick-entry.js 125, 143). Save logic and select defaults are untouched. |
| WORK-02 | Yes | The Enter guard is in the sheet's own keydown handler (6876): `!e.target.closest('.quick-actions')`. This is equivalent to "only `#quickIncome` / `#quickExpense`" while the row holds just those two buttons. `openModal()` is unchanged (6448-6461). The probe's keyboard steps now include Enter on the close X, on a key and on Expense (quick-entry.js 86-89). |
| WORK-03 | Yes | The header button uses `#ic-plus` (2633, symbol at 2592) and has no visible label. The header-width probe flow is retained (quick-entry.js 44-61). |
| WORK-04 | Yes | Both buttons are `.primary`. `.quick-actions > button` sets only flex and width (2099), so no size override is left. |
| WORK-05 | Yes | `.quick-actions { margin-top: var(--s4) }` (2098). |
| WORK-06 | Yes | "Enter amount" is used in `#quickTitle` (3683), in the `#quickBtn` title and aria-label (2632), and in the close label "Close Enter amount" (3682). The internal `quick*` names are kept. |
| WORK-07 | Yes | `new Event('input', { bubbles: true })` (6848). |
| WORK-08 | Yes | The split flow is in quick-entry.js 151-177. It chooses the account before the hand-off, then asserts the 20% row and `#incSplitRest`. |
| WORK-09 | Yes | The comment above `quickEntryTo` (6837-6839) records that an unsaved schedule is cleared. |
| WORK-10 | Yes, approved part only | `quickAmount()` (6811) is used by both `renderQuickEntry` (6814) and `quickEntryTo` (6841). The repeated `getElementById('quickSheet')` lookups and the top-level `quickDigits` were left alone, as ruled. |
| WORK-11 | Yes | No `.quick-modal` remains in index.html. |
| WORK-12 (deferred) | Still deferred, correctly | The Planned to Expense hand-off still renders twice: `setExpMode` calls `renderExpenses()` (7236), then `navigate` calls it again (6900). Neither trigger has fired. |
| Publish prerequisite | **Not done** | See CODE-01. |

## Review Areas

- **Correctness of Money:** Clean. Digits form a string capped at 12 characters, so `Number()` is exact. `String(amount)` goes through `formatMoneyInput`, then `unmoney` on Add. No rounding, sign or NaN path exists: `Number('') || 0` gives 0, and the buttons and the guard both require more than 0.
- **Data and Persistence:** Clean. The keypad writes nothing, and the probe asserts that no record exists before Add (quick-entry.js 126, 144). Offline behaviour is unaffected.
- **Architecture:** Clean. The keypad uses the shared modal stack and the form's own write path. Feature-specific keyboard handling lives in the feature's own handler, as ruled.
- **Maintainability:** Two Low findings (CODE-03, CODE-04).
- **Error Handling:** Clean. Nothing in this scope can fail at runtime except a missing element, and the probe catches that.
- **Security:** Clean. All output goes through `textContent`. No new dependency.
- **Performance:** Clean. The work is constant per tap. The double render is a deferred item (WORK-12).
- **Reliability and Scalability:** Two Low findings (CODE-02, CODE-05).
- **Technical Debt:** See below.

## Findings

### Critical
None.

### High
None.

### Medium
None.

### Low

**CODE-01 — The service-worker cache bump the ruling requires before publish has not happened**

- Severity: Low
- Location: D:\3_Claude\PowerApps\expense-pwa\sw.js line 9 (`const CACHE = 'expense-tracker-v30';`)
- Evidence: The previous ruling's Development Order says all approved items must land "before the next publish, together with the `sw.js` cache bump past `expense-tracker-v30`". The constant is still v30.
- Impact: Stale-while-revalidate (sw.js 75-104) means installed users still get the new `index.html` on their second load, so nothing breaks. But the hand-maintained publish fact the sw.js comment (lines 1-8) depends on would be skipped, and the old cache would not be purged on install.
- Recommendation: Bump to `expense-tracker-v31` as part of the publish change, not now on main. The sw.js comment says to bump "before an intentional publish", not per commit.
- Effort: XS

**CODE-02 — Hardware-keyboard digits stop working once focus leaves the sheet**

- Severity: Low
- Location: index.html 6872 (keydown listener on `#quickSheet`). The document-level handler at 6492-6506 handles only Escape and Tab.
- Evidence: Typed digits are read only by a listener on `#quickSheet`, so they register only while focus is inside the sheet. In Chrome, clicking a non-focusable part of the dialog (the `<output>` amount, the title, the gaps between keys) moves focus to `body`. After that, typed digits and Backspace do nothing. The probe dispatches synthetic keydowns directly on elements (quick-entry.js 76-89), so it does not exercise focus.
- Impact: A desktop user who clicks the amount and then types sees no response. No data is wrong and the on-screen keys still work.
- Recommendation: Give the `.modal` element inside `#quickSheet` `tabindex="-1"`. A click on its non-focusable content then focuses the dialog, which is inside the sheet. No JavaScript change is needed. Do not move digit handling into the shared document handler.
- Effort: XS

**CODE-03 — Two design-record comments state counts or uniqueness that nothing enforces**

- Severity: Low
- Location: index.html 6849 ("Focus lands on the one field still to check"). tools/harness/quick-entry.js 44 (flow name "...beside three buttons").
- Evidence: coding-standards.md, Comments: "Never write 'the only', 'all', or a count, unless something enforces it." Category or Type is not the only field still open on arrival: date, account and, on Income, the split all arrive pre-filled too. The toast names the field to check, but nothing makes it "the one". The probe flow name says "three buttons", but the flow never counts header buttons. It checks overflow only.
- Impact: The comments drift from the truth as soon as a field or a header button is added, and these comments are the project's design record.
- Recommendation: State the rule instead. For example, "Focus lands on the field the toast names, which also scrolls it in". Rename the flow to "the header keeps every screen title on one line". Alternatively, add a header-button count assertion if three is a property worth holding.
- Effort: XS

**CODE-04 — Probe flows depend on the previous flow's sheet state**

- Severity: Low
- Location: tools/harness/quick-entry.js 92-110
- Evidence: The flow "the longest amount fits..." starts by pressing keys on a sheet that the previous flow opened and left at ₮1,200. Its expected value `'₮120,099,999,999'` (line 95) encodes that leftover state.
- Impact: If flow 2 throws before line 89, flow 3 fails too, with a misleading message such as "no key" or a wrong amount. The real failure is then reported twice under two names. Maintenance cost only. The gate still fails correctly.
- Recommendation: Have flow 3 open its own sheet (`navigate('dashboard'); quickBtn.click()`) and assert the plain twelve-nines value `₮999,999,999,999`.
- Effort: XS

**CODE-05 — Keys past the 12-digit cap are dropped silently, and "000" near the cap adds fewer than three zeros**

- Severity: Low
- Location: index.html 6823 (`(quickDigits + key).slice(0, QUICK_MAX_DIGITS)`)
- Evidence: With 10 digits typed, "000" appends two zeros. With 11, it appends one. At 12, every key does nothing and nothing tells the user.
- Impact: This applies only above ₮10,000,000,000. The 6805-6806 comment correctly calls that range past any personal amount, and the user sees the figure before handing it off. No wrong record is possible without the user seeing the wrong figure on screen first.
- Recommendation: Make "000" all-or-nothing: append only if all three digits fit. Optionally leave the cap silent. Do not add a toast for an amount nobody types.
- Effort: XS

## Technical Debt

- **"Set mode, then navigate to Expenses" exists in two places:** the More → Budget path and `quickEntryTo` (6844-6845). This is the ruled WORK-12 deferral. Its trigger (a third caller, or a measured render cost at 10,000 transactions on a low-end device) is the right one. When it fires, the WORK-09 comment moves into the new function.
- **Pre-fill convention is split.** `quickEntryTo` uses the ruled bubbling-`input` convention. Older callers call `formatMoneyInput` directly (for example the quick-amount chips). That split is accepted under the ruling's "What changes" section. It becomes debt the first time one of those older callers needs the income split or the delegated `invalid` clearer at 5807-5813 to follow.
- **Top-level `quickDigits` and repeated id lookups.** Both were deliberately kept to match the file's pattern (WORK-10 rejected parts). They will need to move when the single file becomes modules, together with `expMode` and `spendReturnTo`.

## Future Risks

- **Header width.** The header now holds three icon buttons at 320px, and the probe guards overflow and title wrap. A fourth icon, such as Cloud Sync status or Notifications from the long-term vision, is off limits until that probe passes. That is likely where the next header-level item breaks first.
- **Transient cue.** The "not saved yet" warning is a toast that lasts about 3 seconds at about 50 characters. The ruling's own risk note applies: if users still tap Add without checking the category, the next step is a persistent helper line. This review cannot assess that. It needs real use.
- **Multiple currencies.** The keypad shows ₮ only by rule. If multiple currencies become a roadmap item, the keypad must carry a currency into the hand-off, or the form must convert. Today the hand-off sends a bare integer.
- **A third pre-fill site that skips the convention.** It would silently diverge from the income split, which is money. The convention exists but no gate enforces it.

## Recommended Refactoring

No structural refactoring is warranted in this scope. The smallest useful set of changes:

1. With the publish change: bump `sw.js` to v31 (CODE-01).
2. One XS pass on the feature: add `tabindex="-1"` to the sheet's `.modal` (CODE-02), reword the two comments (CODE-03) and make flow 3 self-contained (CODE-04). CODE-05 is optional.
3. Keep WORK-12 deferred until its trigger fires. Then build one "set Expenses mode and show it" function for both callers, with no special case for Quick entry.

Files:
- D:\3_Claude\PowerApps\expense-pwa\index.html (`.quick-*` CSS 2076-2099; `#quickBtn` 2627-2634; `#quickSheet` 3674-3704; Quick entry JS 6802-6879; `openModal`/`closeModal` 6448-6482; `toast` 5815; `setExpMode` 7211)
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js
- D:\3_Claude\PowerApps\package.json (`quick` script line 29, `test` chain line 22)
- D:\3_Claude\PowerApps\expense-pwa\sw.js (line 9)
- D:\3_Claude\PowerApps\reports\chief-architect.md (previous ruling)
