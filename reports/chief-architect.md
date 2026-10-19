## Executive Decision

**Yes, the branch is fit for release.** Neither reviewer found anything Critical or High. No code that handles money, storage or the data schema changed. The orchestrator ran the full `npm test` on the branch head (2378659) and it exited 0. That is the only test result anyone has confirmed, because neither reviewer could run the tests. The three owner decisions are implemented completely: the five-slot bar with + in the middle, the advisor removal and the Budget Planning removal from More. Searches found nothing left behind. The approved follow-ups are all Low except one Medium (WORK-01), and none of them blocks release. They should still land on this branch before merge. The most important is WORK-02: until project.md matches the navigation that ships, every later review is measured against a reference that is wrong.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Add a "Plan expenses" link to the Home Budget pane, and use it as the pane's empty-state action | This is a real usability gap for the target user, who has "little accounting knowledge" (project.md, Target Users). Home shows "plan" and "Budget" twice, but neither leads anywhere, and the empty state ("No planned or actual expenses in this period.", index.html:8577) gives no next step. It does not re-open the owner's decision: Budget Planning stays out of More, no card is added, and Home gets no new destination. The link only connects a figure Home already shows to where that figure comes from. Build it with the two existing single entry points: `setExpMode('planned')` (index.html:7136), then `navigate('expenses')`. No new navigation path is needed. Scope: one link, used as both the pane link and the empty-state action. Add one assertion to `tools/harness/navigation.js` that the link lands on Expenses in Planned mode. |
| WORK-02 | Update the Core Modules table in project.md | Every review role checks the app against this file. If it is wrong, the next review will report false regressions. The wording is settled under Conflict 2. Change only these two rows. |
| WORK-03 | Rewrite the stale 360px tab-bar comment | coding-standards.md says "Comments are the design record. Keep them true." Use Code Review's wording, which states the rule and points to the overflow check in `quick-entry.js`, instead of naming a new "longest label" that will go stale the same way. |
| WORK-04 | Toast `bottom` includes the safe-area inset and clears the raised disc | It removes a real overlap on phones with a home indicator. The fix is one line: `.toast { bottom: calc(96px + env(safe-area-inset-bottom)) }` (index.html:2464). **Limit on the probe:** headless Chrome reports `env(safe-area-inset-bottom)` as 0, so no headless probe can check the case this fix is for. The probe is approved only as a zero-inset check at 320px and 390px that the bottom edge of `#toast` stays above the top of `.tab-add-disc`. That guards against future changes to the disc or toast geometry. Neither the probe nor the commit message may claim it checks the inset case. The inset behaviour rests on the CSS arithmetic in UI-04 and CODE-04. |
| WORK-05 | Move the focus ring from the `.tab-add` button onto `.tab-add-disc` | The most prominent control in the bar is the only one whose focus ring cuts across it instead of outlining it. The fix is XS and uses colours already in the contrast table. Change only `nav.tabbar button.tab-add:focus-visible` and the disc, and leave the global ring rule alone. |
| WORK-06 | Build `MORE_TABS` from the `[data-more-nav]` buttons | Two hand-kept lists of the same destinations will drift apart, and nothing fails when they do. This branch already had to edit both. The roadmap adds future destinations only to More (see Architecture Strategy), so this list will keep growing. It is safe: the inline script starts at index.html:3741, after the More sheet markup (3535-3599), so the buttons exist when line 6807 runs. It must pass the existing More-highlight check in `quick-entry.js` and the More-entry check in `navigation.js` without editing either. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-07 | "Skip to tab bar" link for keyboard users | Close it as an accepted trade-off, with no code. Focus order follows visual order, so WCAG 2.4.3 is met (UI-05). Severity is Low, and there is a workaround: the screen's own form is reachable sooner. The trade-off comes directly from the tab-bar placement the owner chose. A skip link would add a permanent focusable element to every screen to save Tab presses for a mobile-first app's least common input method. If the owner asks for it, it comes back as a new request. It is not left open here. |
| Owner request | Decimal or comma key on the Enter amount keypad | **Declined.** Both reviewers reached this independently, with evidence. `quickEntryTo` writes `String(amount)` into a `.money-input` field (index.html:6773-6774). `formatMoneyInput` and `unmoney` then remove every non-digit (index.html:5432, 5446-5451), so 12.50 would display and save as ₮1,250. That is a silent hundredfold error in a financial figure, which is Critical-class by the project's own definition. It also contradicts "whole tugrik throughout" (product-strategy.md:84). A comma key has no meaning, because amounts are already grouped and `Number('12,50')` is NaN. The slot a decimal key would use holds `000`, which is the right key for MNT amounts. For amounts with cents, the owner should use "Convert from foreign currency", which already accepts decimals (`inputmode="decimal"`) and hands a whole-tugrik result to the form. Supporting fractional amounts would mean changing the money model across every module and every stored record. That is a product-strategy decision. It is not open, and no one has asked for it. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| — | None | No item has a real risk whose right fix is still unknown. |

## Conflict Rulings

**Conflict 1: Does Budget Planning still meet the "reached by name" rule (project.md:19)?**
Ruling: **Not well enough on its own. WORK-01 is approved.** Code Review is right that the Planned toggle, with "Budget Planning" in the header, is a working path, and recording it is honest. UI Review is right that a user cannot find a module by a name they only see after they have already arrived. "Planned" is one word on a two-way toggle on a different screen. The rule exists so every core module has a door a new user can find, and the door should be where the app first mentions planning, which is Home. The owner's decision stands: Budget Planning does not go back into More. The 87 and 93 scores are each consistent with the findings their reviewer raised. Scores are not mine to reconcile, and this ruling does not change either one.

**Conflict 2: Wording of the Budget Planning row in project.md.**
Ruling: combine both. The rows become:
- Analytics: `More → Analytics — the chart, calendar heatmap, stats and category breakdown`
- Budget Planning: `Home → Budget pane → Plan expenses; the Expenses screen in Planned mode (header reads Budget Planning)`

The parenthetical comes from CODE-01. It ties the module name to what the user actually sees, so a later rename of the control can be checked against the file. Code Review's Future Risk about the Mongolian language layer covers exactly that case. Write the row after WORK-01 lands, so it describes what ships and not what was planned.

**Also recorded (not a conflict):** both reports decline the decimal key for the same reason. Upheld above.

## Development Order

Each item is its own commit. Two unrelated changes never go in one commit.

1. **WORK-01**: the Home Budget pane link and its harness assertion. It is the only Medium and the only user-facing change in navigation, and WORK-02's wording depends on it shipping.
2. **WORK-02**: the project.md rows, written against what WORK-01 actually built. It must land in the same merge as the navigation change, so main is never out of step with its reference.
3. **WORK-06**: `MORE_TABS` built from the DOM. It changes behaviour in `navigate()`, so it goes before the CSS edits. That way a harness failure points at one change.
4. **WORK-05**: the focus ring onto the disc.
5. **WORK-04**: the toast offset and the zero-inset clearance probe. It comes after WORK-05 because both edit the CSS around the disc, and the probe should measure the final geometry.
6. **WORK-03**: the comment rewrite. It changes no behaviour and can go anywhere. It is last so it describes the final state of the bar's CSS.
7. Run the full `npm test`, then the Review Again step. The exit 0 on 2378659 does not cover anything after it.

## Architecture Strategy

**Stays:**
- The single-file, offline-first PWA with one inline script and no build step.
- `navigate()` as the only way to change screens.
- `setExpMode()` as the only way to change the Expenses mode. WORK-01 uses both and adds no third path.
- The whole-tugrik money model: `unmoney`, `formatMoneyInput`, and integers in storage.
- The five-slot tab bar, with Enter amount as the raised middle slot that never takes `aria-current`.

**Changes:**
- The More sheet markup becomes the only list of secondary destinations (WORK-06).
- New rule from this ruling: any change to navigation updates knowledge/project.md's Core Modules table in the same merge. A reference that trails the code makes the review chain unreliable, and this cycle spent two findings on exactly that.

**Off limits this quarter:**
- A sixth primary tab. New modules from Long-term Vision go into More through a `data-more-nav` button.
- Fractional money in any form: keypad, form, import or storage.
- A second navigation or mode-switch path that bypasses `navigate()` or `setExpMode()`.
- Bringing back advisor-style analysis on Home without a product definition. "AI Budget Assistant" stays in Long-term Vision until it has one.

**Risks to watch (stated as risks, not findings):**
- `no-unused-vars` is off (eslint.config.mjs). A helper left dead by an owner-requested removal such as f25af1a is caught only by hand searches. The advisor removal was checked by search for the named symbols only. If a reviewer raises this, I would expect to approve the smallest fix.
- Nothing in the harness stops a future change from adding `.` or `,` to the keypad. Code Review's optional XS guard has no source ID, so it is not ruled here. If a reviewer raises it as a finding, it is the kind of guard this decision favours.
- The safe-area inset cannot be measured headlessly. Any future layout check that depends on it needs a real-device check, not a probe.

## Final Recommendation

Build WORK-01 on `bottom-nav-add`: one "Plan expenses" link in the Home Budget pane, also used as its empty-state action, calling `setExpMode('planned')` then `navigate('expenses')`, with one assertion in `tools/harness/navigation.js`. Then work through WORK-02, -06, -05, -04 and -03 in that order, one commit each. Re-run the full `npm test`, run Review Again, and merge. Tell the owner the keypad will not get a decimal key and point them to "Convert from foreign currency".

Files:
- D:\3_Claude\PowerApps\reports\engineering-manager.md
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\knowledge\project.md
- D:\3_Claude\PowerApps\knowledge\review-conventions.md
- D:\3_Claude\PowerApps\expense-pwa\index.html (setExpMode 7136, quickEntryTo 6766, MORE_TABS 6807, .toast 2463-2464, script start 3741)
- D:\3_Claude\PowerApps\tools\harness\navigation.js
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js
