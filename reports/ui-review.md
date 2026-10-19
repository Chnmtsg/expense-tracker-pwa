## Executive Summary

All six ruled items (WORK-01 to WORK-06) are on `bottom-nav-add` as the Chief Architect ruled them, and none of them goes beyond its approved scope. Home's Budget pane now has a door into Budget Planning. The focus ring outlines the raised disc. The toast clears the disc, and the safe-area term is in the CSS. The More highlight is driven by the More sheet markup, and project.md matches the navigation that ships. This review raised no Critical, High or Medium findings. The biggest remaining problem is small: a navigation comment written before WORK-01 still says Planned mode can only be reached from the toggle on the Expenses screen, which is now false. One limit applies to the whole review: I read the source and did not render the app or run the tests. The only test result is the orchestrator's: `npm test` exited 0 on 65880a9.

## Overall Score

**94 / 100.** The branch has no Critical or High findings, which puts it in the 90-100 band. The one finding is a Low about an inaccurate design-record comment. Nothing fails for the user. It keeps the score just short of the top of the band.

## Strengths

- **WORK-01: the Plan expenses button is built as ruled.**
  - The button is `#dashPlanLink` (index.html:2729), a full-width `button.secondary` (44px minimum height, index.html:1159-1163) in the "Planned vs Actual" pane.
  - It is always shown, so it also serves as the next step under the empty state "No planned or actual expenses in this period." (index.html:8594).
  - Its click handler calls `setExpMode('planned')` and then `navigate('expenses')` (index.html:7209-7212). There is no third navigation path, and the screen change scrolls to the top (index.html:6850).
  - `planLinkFlow` in tools/harness/navigation.js:110-124 checks that the button is visible, that it lands on Expenses in Planned mode, and that the header reads "Budget Planning".
- **WORK-02: the project.md rows match the ruling word for word.** The Analytics and Budget Planning rows (knowledge/project.md:26-27) use the Conflict 2 wording, and they describe what WORK-01 actually built.
- **WORK-06: the More list is built from the More sheet.** `MORE_TABS` is now read from the `[data-more-nav]` buttons (index.html:6820). That line runs after the More sheet markup (index.html:3541-3610). Neither the quick-entry More-highlight check (quick-entry.js:82-83) nor the navigation More-entry check was edited.
- **WORK-05: the focus ring outlines the disc.**
  - The ring is taken off the button and put on `.tab-add-disc`, with the same colour and width as the global ring (index.html:1363-1366).
  - The disc's 4px `--surface` border plus the 2px offset keeps the ring clear of the fill.
  - `focus-ring-color` is already checked at 3:1 against `bg` and `surface` (check-contrast.mjs:128-129), and those are the two backgrounds the ring crosses.
- **WORK-04: the toast clears the disc, and the probe claims only what it can check.**
  - The geometry: `.toast` bottom is `calc(96px + env(safe-area-inset-bottom))` (index.html:2471). The disc tops out at 82px plus the inset (8px bar padding + 52px button + 8px padding + 14px rise), or 86px including the focus ring. That leaves about 10px of clearance at any inset.
  - The probe: it is labelled "(zero inset)" (quick-entry.js:86-94), and it runs at 320px (`quick`) and at 390px (the new `quick390` script). The `quick390` script is wired into `npm test` (package.json:22, 30). Neither the probe name nor its comment claims to check the inset case.
- **WORK-03: the narrow tab-bar comment states the rule.** It names the 11px floor and points to the tab-bar overflow check in quick-entry.js (index.html:1368-1374). It does not name a "longest label" that would go stale.
- **The owner's decisions are intact.**
  - The tab bar has five slots: Home, Income, Enter amount, Expenses, More (index.html:3510-3539, asserted at quick-entry.js:67).
  - Enter amount never takes `aria-current`, because it has no `data-nav`.
  - The More sheet contains Analytics, Accounts, Debts, Savings Goals, Salary Calculator and Settings, and has no Budget Planning entry.
  - The keypad has no decimal key.

## Findings

**UI-01 — The navigation comment still says Planned mode can only be reached from the Expenses screen's toggle**

- Severity: Low
- Location: expense-pwa/index.html:6715-6717 (the comment in the tab-bar `[data-nav]` click handler)
- Evidence: the comment reads "The tab means Actual. Planned is reached only through the segmented control on the screen itself; the More sheet's Budget Planning entry was removed as a redundant second way in." Since WORK-01 (1fca51b), Home's `#dashPlanLink` (index.html:7209-7212) also opens Planned mode. knowledge/project.md:27 now lists it as the first way into Budget Planning.
- Impact: nothing breaks for the user. coding-standards.md treats comments as the design record. The ruling's new rule (chief-architect.md, Architecture Strategy) says navigation and its references must not disagree, and this comment now disagrees with both the code and project.md. A future change to the tab handler could be checked against this comment and wrongly conclude that the Home entry point is unintended.
- Recommendation: change the sentence to something like "Planned is reached through the segmented control on the screen and through Home's Budget pane (Plan expenses); there is no More entry." Change only that sentence. Code Review may raise the same issue under comment accuracy. If it does, the Engineering Manager should merge the two into one WORK item.
- Effort: XS

**Review areas**

- **Layout and Hierarchy:** clean. The new button is the last item in its pane and does not compete with the chart. The Dashboard's order is unchanged.
- **Navigation:** clean apart from UI-01. All eight core modules can be reached by the names in project.md:23-30. The current location is shown by `aria-current` and the More highlight. Every sheet has a close control.
- **Typography:** clean. Tab labels stay at `--t-micro` (11px), and the button uses `--t-sm`, the standard secondary-button size.
- **Colour and Theme:** clean. No new colour pairs were added. The ring and the hover fill (`on-accent` on `primary-hover`, check-contrast.mjs:101) are already measured.
- **Spacing:** clean. The button uses the standard `--s3` top margin. The bottom of the page content clears the disc: body padding 72px plus main padding 16px is 88px, against a disc top of 82px (86px with the focus ring).
- **Cards:** clean. No card was changed.
- **Mobile:** clean. The disc is 56x56. The new button is 44px tall at full width. Overflow and even slot widths are checked at 320px and 390px (quick-entry.js:68-75).
- **Accessibility:** clean. The new control is a native `<button>` named by its visible text. The focus ring is now visible on the disc. Focus order still follows visual order (WORK-07's accepted trade-off is not reopened).
- **States:** clean. The Budget pane's empty state now offers a next step. No async or destructive action was added.
- **Numbers and Formatting:** clean. No formatting changed, and the keypad still accepts whole tugrik only.

## Quick Wins

None. The only finding (UI-01) is XS effort but Low severity, below the Medium threshold for this section. It should still go into the same merge, as one commit.

## Estimated UX Impact

This review raised no Critical or High findings, so nothing changes for the user here. The user-facing gains from review 3 have already shipped on this branch:

- A user with no accounting training can now go from the "Planned vs Actual" figure on Home to the place where those plans are made.
- A keyboard user sees a ring around the most prominent control instead of a line cutting across it.
- On phones with a home indicator, the "Not saved yet" toast no longer sits over the + disc. This is the case headless Chrome cannot show and the probe deliberately does not claim to check. It depends on the CSS arithmetic above, so it still needs to be confirmed on a real device.

Files:
- D:\3_Claude\PowerApps\expense-pwa\index.html (tab bar CSS 1332-1374; toast 2467-2479; Budget pane link 2723-2730; tab bar markup 3510-3539; More sheet 3541-3610; stale comment 6715-6717; MORE_TABS 6820; dashPlanLink handler 7209-7212; pva empty state 8594)
- D:\3_Claude\PowerApps\tools\harness\navigation.js (planLinkFlow 110-124)
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js (tab bar and disc 63-84; toast clearance probe 86-94)
- D:\3_Claude\PowerApps\tools\check-contrast.mjs (54, 101, 128-131)
- D:\3_Claude\PowerApps\knowledge\project.md (26-27)
- D:\3_Claude\PowerApps\package.json (22, 30)
- D:\3_Claude\PowerApps\reports\chief-architect.md
