# Code Review: branch bottom-nav-add (bab6caf, f25af1a, 2378659 on top of main 449f5f2)

**Limits on this review.** I had no shell in this session. That means I could not run `git diff 449f5f2..bottom-nav-add` and I could not run `npm test`. I reviewed the branch's current state of the five named files, plus the knowledge files and the code they touch. Removal completeness was checked by searching the tree. A dead helper used only by the deleted advisor would not show up in that search, and `no-unused-vars` is off in `D:\3_Claude\PowerApps\eslint.config.mjs`, so lint would not catch it either. The test pass/fail state is unverified and must be confirmed with `npm test` before merge.

## Executive Summary

The branch is small, well contained and does not touch any money path, storage path or schema. The tab bar rework is done properly: `#quickBtn` keeps its id and handler, `'daily'` is in `MORE_TABS` so More highlights on Analytics, and `quick-entry.js` checks the slot order, equal slot widths, the disc size and that the disc rises above the bar, all at 320px. The advisor and Budget Planning removals left nothing behind that a search can find: no `advisor`, `analyzeExpenses`, `renderAdvisor`, `--on-warning` or `data-more-nav="budget"` in `expense-pwa/`. `navigation.js` now asserts that the More entry is absent. The biggest risk is not in the code. `knowledge/project.md`, which every review is measured against, still says Analytics is on the tab bar and Budget Planning is under More. Separately, the pending decimal key would bring back a known, silent hundredfold money error, and it should be declined.

## Overall Score

**93 / 100.** There are no Critical, High or Medium findings. Four Low findings (one out-of-date design reference, one out-of-date comment, one hand-kept list that has to be updated in two places, and one visual overlap I worked out by arithmetic but did not measure) keep it short of the top of the 90-100 band.

## Findings

### Critical
None.

### High
None.

### Medium
None.

### Low

**CODE-01: project.md Core Modules table is out of date for Analytics and Budget Planning**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\knowledge\project.md` lines 26-27
- Evidence: Line 26 says `Analytics | Tab bar — ...`. Analytics is now reached from the More sheet (`data-more-nav="daily"`, `D:\3_Claude\PowerApps\expense-pwa\index.html` line 3535). Line 27 says `Budget Planning | More → Budget Planning; ...`. That entry was removed in 2378659, and the click handler comment at index.html lines 6704-6706 records the removal. project.md is not in the branch's file list.
- Impact: project.md is the reference every review role measures against (review-conventions.md, "Project Standards"). The next UI Review will either raise a false "module not reachable where documented" finding or learn to ignore the table. Line 19 defines a core module as one that "can be reached by name", so the table has to name the real way in.
- Recommendation: In the same merge, change line 26 to "More → Analytics" and line 27 to "the Expenses screen in Planned mode (header reads Budget Planning)". Nothing else needs to change.
- Effort: XS

**CODE-02: Narrow-screen tab bar comment still calls "Analytics" the longest tab label**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html` lines 1365-1368 (inside `@media (max-width: 360px)` for `nav.tabbar`)
- Evidence: "the labels fit at 320px without it — measured, including "Analytics", the longest one." Analytics is no longer a tab. The longest tab label is now "Expenses", and the middle slot has no text.
- Impact: coding-standards.md says "Comments in this project are the design record. Keep them true." The claim that the labels were measured now refers to a layout that no longer exists. The current fit is in fact covered by the overflow check in `D:\3_Claude\PowerApps\tools\harness\quick-entry.js` lines 68-69.
- Recommendation: Rewrite the comment to state the rule without the out-of-date example. For instance: "the labels fit at 320px at 11px; the quick probe's tab-bar overflow check holds it."
- Effort: XS

**CODE-03: MORE_TABS repeats the More sheet's destinations by hand**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html` line 6807 (`const MORE_TABS = ['daily', 'accounts', 'goals', 'debts', 'salary', 'settings'];`) and the `data-more-nav` buttons at lines 3535-3599
- Evidence: There are two lists of the same destinations. This branch had to update both: it added the Analytics `data-more-nav` button and `'daily'` in `MORE_TABS`. The harness only checks the `daily` case (quick-entry.js line 82). If a destination is added to the sheet but not to the array, More is not highlighted and `aria-current` is wrong on that screen, and nothing fails.
- Impact: coding-standards.md says "Avoid duplication." The roadmap keeps adding More destinations (Reports, Savings Planner and others in project.md's Long-term Vision), and every addition is a chance for the two lists to drift apart.
- Recommendation: Build the list from the DOM once, for example `const MORE_TABS = [...document.querySelectorAll('[data-more-nav]')].map(b => b.dataset.moreNav);`. Then the HTML sheet is the only list.
- Effort: XS

**CODE-04: The toast can cover the raised Enter amount disc on phones with a home-indicator inset**

- Severity: Low
- Location: `D:\3_Claude\PowerApps\expense-pwa\index.html` line 2464 (`.toast { bottom: 90px; ... }`), against lines 1336, 1345 and 1356 (bar padding `var(--s2)` + `env(safe-area-inset-bottom)`, button `min-height: 52px`, disc `margin-top: -22px`)
- Evidence: This is worked out from the CSS, not measured. Bar height is 8 + 52 + 8 = 68px plus the inset. The disc top sits 8 - 22 = -14px from the bar top, so 82px plus the inset above the viewport bottom. The toast is centred horizontally, exactly over the middle slot, and its bottom edge is a flat 90px that ignores the inset. With no inset there is 8px of clearance. With a 34px inset (an iPhone PWA in standalone mode), the disc top is at 116px and the toast covers the top 26px of the disc. `quickEntryTo()` (line 6780) shows a toast every time the keypad is used. The toast has `pointer-events: none` (line 2471), so taps still go through.
- Impact: Visual only and short-lived. For a couple of seconds the app's main action is partly hidden under a message. The toast already overlapped the bar's top edge on inset devices before this branch; the raised disc makes the overlap bigger.
- Recommendation: Add the inset and clear the disc: `bottom: calc(96px + env(safe-area-inset-bottom))`. Confirm with a headless probe at 320 and 390 that measures `#toast` against `.tab-add-disc`.
- Effort: XS

### Clean areas (one line each)

- **Correctness of Money:** clean. No calculation, rounding or storage path changed. The keypad reads `quickAmount()` and hands off through the form's own `input` event as before.
- **Data and Persistence:** clean. No schema change. `goalProblem()` still validates `createdDate`, and its comment (lines 4962-4966) was correctly updated to say nothing reads it any more.
- **Architecture:** clean. Navigation still goes through `navigate()`, and `#quickBtn` correctly has no `data-nav` and never becomes active.
- **Maintainability:** CODE-02, CODE-03. Nothing else.
- **Error Handling:** clean. No new failure path.
- **Security:** clean. The tab bar and the More entries are static markup, and no new `innerHTML` was added.
- **Performance:** clean, and slightly better. `renderDashboard()` no longer runs the advisor analysis.
- **Reliability and Scalability:** CODE-04. The 320px layout is held by `quick-entry.js`.
- **Test coverage:** `navigation.js` and `quick-entry.js` were updated to match the new layout, and both are in the `npm test` chain in `D:\3_Claude\PowerApps\package.json`. I could not run them (see the limits note at the top).

## Ruling on the pending owner request: decimal or comma key on the Enter amount keypad

**Decline. Do not add the key.**

- Under the current code a decimal key is a silent hundredfold error. If `quickKey('.')` were allowed, `quickDigits` would become `"12.5"`, `quickAmount()` (line 6737, `Number(quickDigits)`) would give 12.5, and the keypad would show a fractional amount. Then `quickEntryTo()` (lines 6773-6774) writes `String(amount)` into `#expAmount`/`#incAmount` and fires `input`. `formatMoneyInput()` (lines 5446-5451) strips every non-digit, so the form shows `125`. Typing 12.50 gives `1,250`. The comment above `formatMoneyInput()` (lines 5439-5445) already names this exact failure and says the guard lives there. A keypad key would get around that guard in its own UI while the form quietly strips the point.
- A comma key does nothing useful. The amount is already grouped with thousands separators on display, and `Number('12,50')` is NaN, which becomes 0, so Income and Expense would stay disabled.
- The product rule does not allow fractions. `D:\3_Claude\PowerApps\knowledge\product-strategy.md` line 84 says "whole tugrik throughout", and `unmoney()` (line 5432) is built on that. Supporting fractions would mean changing the money model for every module and every stored record, which needs a Chief Architect decision first. It is not a keypad change.
- The likely real need is already met: the `000` key (line 3639) is in the bottom-left slot where a decimal key would usually sit, and it makes large MNT amounts fast to enter.
- Optional guard (XS): add a line to `quick-entry.js` that sends `.` and `,` keydowns to the sheet and asserts the amount does not change, so any future relaxation fails a test instead of shipping.

## Technical Debt

- Removing the advisor has left `createdDate` written on every goal with nothing reading it (index.html lines 4962-4966 say so). That is acceptable and documented. It is listed here only so a future feature that reads it knows the old values were never shown to a user.
- Because `no-unused-vars` is off, helpers made dead by feature removals are only found by searching. That is a standing gap for owner-requested removals like f25af1a.
- The out-of-date reference in project.md (CODE-01) is the kind of debt that makes downstream reviews unreliable.

## Future Risks

- Every More destination added from the roadmap is a chance for CODE-03 to bite until `MORE_TABS` is derived from the DOM.
- The bar now has five slots with a fixed-width disc. Adding a sixth primary destination would break the equal-width check, which is the right outcome, but it means any new primary module has to go in More.
- Budget Planning is now reached only through the Expenses screen's "Planned" control. If the Mongolian language layer renames that control, project.md line 19's "reached by name" test should be checked again.

## Recommended Refactoring

The smallest set that removes the risk is four XS edits, all of which can land in this branch before merge:

1. Correct project.md lines 26-27 (CODE-01).
2. Rewrite the 360px tab bar comment (CODE-02).
3. Build `MORE_TABS` from `[data-more-nav]` (CODE-03).
4. Make the toast's `bottom` include the inset and clear the disc, and confirm with a probe (CODE-04).

Then run `npm test`, which I could not run here.

Files referenced:
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\knowledge\project.md
- D:\3_Claude\PowerApps\knowledge\product-strategy.md
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js
- D:\3_Claude\PowerApps\tools\harness\navigation.js
- D:\3_Claude\PowerApps\tools\check-contrast.mjs
- D:\3_Claude\PowerApps\eslint.config.mjs
- D:\3_Claude\PowerApps\package.json
