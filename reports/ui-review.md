## Executive Summary

The branch does what it set out to do. The five-slot bar works, the raised Enter amount disc is a real 56 px target, the More sheet highlights correctly when Analytics is open, and the advisor removal left no orphaned markup, CSS or `--on-warning` references. Nothing in the diff is Critical or High. The biggest problem is a side effect of removing Budget Planning from More: the module the header still calls "Budget Planning" can now only be reached from the "Planned" segment on the Expenses screen. Home talks about the plan twice ("Income minus plan" and the "Budget" chart pane) but gives no way into it. The rest is small: one stale project reference, a focus ring that doesn't wrap the raised disc, a toast that lands on the disc on notched phones, and a keyboard-order change. I recommend declining the decimal-key request (ruling below).

Method note: I had no shell, so I reviewed by reading the files on the branch rather than running `git diff` or a browser. Pixel positions below are worked out from the CSS, not measured on screen.

## Overall Score

**87 / 100.** There are no Critical or High findings. One Medium (Budget Planning is harder to find) and four Lows keep it just under the 90 band.

## Strengths

- **Raised slot.** `nav.tabbar button.tab-add` (expense-pwa/index.html:1354-1363) keeps a full slot's width, so the four labelled tabs stay evenly spaced. The disc is 56 px, above the 44 px floor. Its glyph pair (`on-accent` on `primary`) is already in the contrast table at tools/check-contrast.mjs:54.
- **Current location stays clear.** `navigate()` (index.html:6817-6820) marks More as active (`aria-current="page"`) when Analytics is open, because `daily` was added to `MORE_TABS` (6807). The header also reads "Analytics".
- **The keypad is unaffected by the move.** Enter is still blocked from closing the sheet or saving, and the "Not saved yet" step is kept (6792-6805).
- **Home is now one hero figure, three KPIs and one chart card** (2595-2734). That meets "most important information first" and "reduce visual clutter" better than before.
- **Advisor removal is complete.** A search for `advisor` and `on-warning` in index.html finds nothing.

## Findings

**UI-01 — Budget Planning has no visible entry point now that the More entry is gone**

- Severity: Medium
- Location: Home screen, Budget pane and "Income minus plan" KPI (expense-pwa/index.html:2638-2640, 2704, 2716-2719, 8577). Expenses screen segmented control (2946-2949).
- Evidence: The words "Budget Planning" now appear only in the header, after the user taps "Planned" on Expenses (`screenTitle`, 6689-6691). Home shows a "Budget" pane titled "Planned vs Actual" and an "Income minus plan" KPI. Neither links anywhere. When there are no plans, the pane says only "No planned or actual expenses in this period." (8577), with no next step. `navigate('expenses')` is only called at 10676; nothing on Home opens Planned mode.
- Impact: A user with no accounting background sees "plan" and "Budget" on Home but finds no "Budget" in the tab bar or More. Finding it means guessing that a two-word toggle on the Expenses screen is the budgeting module. project.md lists Budget Planning as a core module, and this is the only one of the eight with no named way in. The owner's removal stands. This finding is about the missing signpost, not the removal.
- Recommendation: Keep the removal. Add one link inside the Home Budget pane, for example "Plan expenses →". It should call `setExpMode('planned')` and then `navigate('expenses')`, the same pair `quickEntryTo` already uses in reverse. Use it as the pane's empty-state action too, so "No planned … expenses" comes with a next step.
- Effort: S

**UI-02 — project.md still describes the old navigation**

- Severity: Low
- Location: knowledge/project.md:26-27
- Evidence: Analytics is listed as "Tab bar". Budget Planning is listed as "More → Budget Planning; the Expenses screen in Planned mode". After bab6caf and 2378659, Analytics is under More and the More entry is gone.
- Impact: Every review role checks the app against this file. Until it's updated, the next review will report both modules as unreachable where the file says they are.
- Recommendation: Change the Analytics row to "More → Analytics". Change Budget Planning to "Expenses screen, Planned mode" (plus the Home link if UI-01 is accepted). Also fix the stale comment at index.html:1364-1368, which says "Analytics" is the longest tab label measured at 320 px. The longest label is now "Expenses".
- Effort: XS

**UI-03 — The focus ring on the Enter amount slot doesn't wrap the disc**

- Severity: Low
- Location: expense-pwa/index.html:1196-1198 (global ring), 1354-1356 (`.tab-add`, `.tab-add-disc { margin-top: -22px }`)
- Evidence: The ring is drawn around the `<button>` box. The disc rises 22 px above the top of that box, so the 2 px ring runs across the disc about a third of the way down instead of around it.
- Impact: Keyboard users still see a focus indicator, so the "visible focus" guideline holds. But the most prominent control in the bar is the only one whose ring doesn't outline it, and it looks broken.
- Recommendation: Put the ring on the disc for this one button. Remove the outline from `nav.tabbar button.tab-add:focus-visible` and give `.tab-add-disc` the same 2 px `--focus-ring-color` outline with a 2 px offset. Both colours are already measured in the contrast table.
- Effort: XS

**UI-04 — On phones with a home indicator, the "Not saved yet" toast covers the disc**

- Severity: Low
- Location: expense-pwa/index.html:2463-2464 (`.toast { bottom: 90px }`), 1336 and 1356 (bar padding, disc offset)
- Evidence: Without a safe-area inset, the disc top is about 82 px from the bottom (68 px bar, minus 8 px padding, plus 22 px rise), so the toast clears it by 8 px. The bar adds `env(safe-area-inset-bottom)` but the toast doesn't. On a 34 px inset the disc top is at about 116 px, and the centred toast sits over the top 26 px of the disc. The toast that does this is exactly the one quick entry fires (6780).
- Impact: The toast is `pointer-events: none`, so nothing is blocked. The primary control is visually covered for the length of the toast. The toast already overlapped the bar on these devices before this branch; the disc makes it obvious.
- Recommendation: Change the toast to `bottom: calc(96px + env(safe-area-inset-bottom))`.
- Effort: XS

**UI-05 — Keyboard users now reach Enter amount last instead of first**

- Severity: Low
- Location: expense-pwa/index.html:3499-3528 (`#quickBtn` is now inside `nav.tabbar` after `</main>`; it used to be in the header)
- Evidence: Focus order follows the DOM. Before bab6caf, `#quickBtn` came right after the header title. Now it comes after every focusable element on the current screen. On Expenses that means the whole form and every row in the list.
- Impact: The order still matches the visual order (WCAG 2.4.3 is met), so this isn't a failure. But the action the app is "opened for most" (comment at 3508) takes the most Tab presses to reach from the keyboard. A hardware-keyboard user can type into the screen's own form instead, which is the workaround.
- Recommendation: No markup move. If the owner wants a shortcut, add a "Skip to tab bar" link as the first focusable element, which helps all five tabs at once. Otherwise accept the trade-off as a known consequence of the tab-bar decision.
- Effort: S

### Review areas

- **Layout and Hierarchy:** Clean. Home is hero, KPIs, then one chart card. Budget pane: see UI-01.
- **Navigation:** All eight core modules can be reached. Budget Planning has no named door (UI-01). Analytics is now two taps; that's the owner's decision. Close is always available on the More and keypad sheets.
- **Typography:** Clean. Tab labels stay at the 11 px floor, and "Expenses" fits a 64 px slot at 320 px. Stale comment noted under UI-02.
- **Colour and Theme:** Clean. The disc reuses `primary` / `on-accent` / `primary-hover`, all in the contrast table, and the dropped `--on-warning` token has no remaining users.
- **Spacing:** Clean. At max scroll the last content edge sits at 72 + 16 = 88 px, which clears the disc top (about 82 px) with and without a safe-area inset.
- **Cards:** Clean. The More items are unchanged. `--shadow-lg` on the disc is the deliberate elevation for a raised control, not a drift between cards.
- **Mobile:** Clean except UI-04. Every tab is at least 52 px tall and the disc is 56 px. Five `flex: 1` slots can't overflow sideways.
- **Accessibility:** UI-03 and UI-05. The Enter amount accessible name is `aria-label` because there's no visible text, so WCAG 2.5.3 isn't affected.
- **States:** Only UI-01's missing next step on the Budget pane's empty state. Removing the advisor took its loading and empty paths with it and left nothing dangling.
- **Numbers and Formatting:** Clean in this diff. See the ruling below for the decimal request.

## Ruling on the pending owner request: decimal/comma key on the Enter amount keypad

**Decline.** If built as asked, it would cause a Critical-class defect (wrong financial figures).

- Evidence: `quickEntryTo` puts `String(amount)` into `#expAmount` / `#incAmount` and fires `input` (index.html:6773-6774). Those are `.money-input` fields: `formatMoneyInput` keeps only digits (5450), and `unmoney` saves `+String(v).replace(/[^\d]/g, '')` (5432). A keypad "12.50" would show and save as ₮1,250, which is 100 times too much and looks plausible enough that nobody would notice. A comma key does nothing useful either: the display and the form already add thousands separators, so a typed comma has no meaning.
- Strategy: knowledge/product-strategy.md:84 says "whole tugrik throughout". The tugrik's subunit (möngö) isn't in practical use. Supporting fractions would mean changing the money model, the formatter, every total and the import format. That is XL effort and a product-strategy decision, not a keypad tweak.
- The slot a decimal key would use already holds `000` (3639), which is the right key for seven-figure MNT amounts.
- If the owner's real need is entering foreign-currency amounts with cents, that's already covered. "Convert from foreign currency" on both forms uses `#convAmount` with `inputmode="decimal"` (3689) and hands a whole-tugrik result to the form.
- Recommended answer to the owner: no change to the keypad. Point them to the converter for amounts with cents.

## Quick Wins

- None. The only Medium (UI-01) is S effort, so it qualifies, and it's the one worth doing first: a single link restores a named way into a core module without undoing the owner's removal.

## Estimated UX Impact

There are no Critical or High findings, so nothing blocks release. Fixing UI-01 would give "Budget" and "Income minus plan" on Home somewhere to go, so a new user could start planning from the place the app first mentions it. That would close the last gap in "every core module can be reached by name". UI-02 through UI-04 are each a one-line correction. Together they keep the next review from flagging false regressions, make keyboard focus on the main control look intentional, and keep the main control uncovered on notched iPhones.

Files referenced:
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\knowledge\project.md
- D:\3_Claude\PowerApps\knowledge\product-strategy.md
- D:\3_Claude\PowerApps\tools\check-contrast.mjs
