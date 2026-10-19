## Project Health

Both reports were read in full: UI Review scores the branch 94/100 and Code Review 95/100. Neither found a Critical, High or Medium issue. Both reviewers confirm that all six ruled items from review 3 (WORK-01 to WORK-06) are on `bottom-nav-add` at 65880a9 as ruled and within their approved scope. The orchestrator reports that `npm test` exits 0. The branch is ready to merge. Three Low findings remain, and they reduce to two XS items, neither of which blocks release. One gap is not closed by either review or the probe: whether the toast clears the disc on a device with a non-zero safe-area inset. That rests on CSS arithmetic and needs a check on a real device.

**Ruled-item verification (from both reports; this report adds nothing new)**

| Ruled item | UI Review | Code Review | Note |
|---|---|---|---|
| WORK-01 Home "Plan expenses" link | Landed as ruled | Landed as ruled | Code Review found an edge case in the new handler (CODE-01, below). It does not mean the item failed to land as ruled. |
| WORK-02 project.md rows | Match the ruling word for word | Match the ruling word for word | — |
| WORK-06 MORE_TABS from [data-more-nav] | Landed; checks not edited | Landed; could not confirm "not edited" without git | The orchestrator confirms 86fe1c4 changed only expense-pwa/index.html, so the condition holds. |
| WORK-05 focus ring on .tab-add-disc | Landed as ruled | Landed as ruled | — |
| WORK-04 toast clearance and zero-inset probe | Landed; probe claims zero inset only | Landed; could not read commit messages | The orchestrator confirms the commit message limits the claim to zero-inset geometry, so the ruling's limit holds. |
| WORK-03 narrow tab-bar comment | States the rule; names no "longest label" | Same | — |

The owner decisions are intact in both reports: the 5-slot bar, the advisor removed, Budget Planning out of More, and no decimal key. None of these is reopened.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | "Plan expenses" clears an unsaved recurrence when Expenses is already in Planned mode | CODE-01 | Low | P3 | XS | — |
| WORK-02 | Two comments still say Planned mode is reached "only" through the Expenses screen's own control. WORK-01 (1fca51b) made this false. | UI-01, CODE-02 | Low | P3 | XS | — |

**Item detail**

- **WORK-01 (CODE-01)**
  - Location: expense-pwa/index.html:7209-7212 (the handler) and 7163-7165 (what `setExpMode` clears).
  - Problem: `setExpMode` always clears `#expRecFreq`, `#expRecCustomWrap` and `#expRecEnd`. The two existing callers check the mode first: the Expenses tab at 6721 and `quickEntryTo` at 6781. The new `#dashPlanLink` handler calls `setExpMode('planned')` with no check.
  - User impact: a user who has a planned expense in progress with a recurrence picked, goes to Home, and taps "Plan expenses" comes back with the recurrence cleared. Nothing tells them. If they then tap Add, they save a one-off planned expense instead of a recurring one, and future planned figures on Home's Budget pane are under-stated. Nothing already saved is lost.
  - Side effect: the call also runs a redundant `renderExpenses()` while Expenses is hidden.
  - Fix (as the reviewer wrote it): `if (expMode !== 'planned') setExpMode('planned'); navigate('expenses');`
  - Optional, at the reviewer's suggestion: a `planLinkFlow` assertion that starts in Planned mode with `expRecFreq` set and checks the value survives the tap.
- **WORK-02 (UI-01 and CODE-02)**
  - Two locations, both required:
    - (a) expense-pwa/index.html:6715-6717, the comment in the tab `[data-nav]` click handler. Source: UI-01.
    - (b) tools/harness/navigation.js:81-84, the comment above `budgetSwitchFlow`. Source: CODE-02.
  - Why it matters: both comments claim there is only one way into Planned mode, and since WORK-01 there are two. This breaks coding-standards.md ("Comments in this project are the design record. Keep them true." and the rule against writing "the only" unless something enforces it). It also breaks the review 3 rule that navigation and its references must not disagree. A future change could wrongly treat the Home entry point as unintended.
  - Fix: change only the affected sentence in each place. State both ways in, drop "only", and keep the line about More having no entry. The suggested wording is in UI-01 and CODE-02.
  - The item is done only when both locations are fixed.

## Quick Wins

None. Both items are XS effort, but both are Low severity, which is below the Medium threshold for this section. Both reviewers reached the same conclusion.

## Sprint Plan

**Next sprint: WORK-01 and WORK-02.**

- Total effort: 2 x XS, under an hour.
- Land them as two separate commits, one per item, on `bottom-nav-add` before it merges to main. Then run `npm test` again.
- What it delivers:
  - Tapping "Plan expenses" never silently clears an unsaved recurrence.
  - The design-record comments in the app and the harness match the code and knowledge/project.md, which completes review 3's rule that navigation and its references must not disagree.
- Nothing else is planned. No other findings exist.

## Roadmap

- Sprint 1: WORK-01, WORK-02
- Sprint 2: none
- Sprint 3: none
- Later: none

## Dependencies

- Neither item depends on the other. Either order works.
- Both items touch the same two files:
  - WORK-01 changes index.html:7210, and navigation.js `planLinkFlow` if the optional assertion is added.
  - WORK-02 changes index.html:6715-6717 and navigation.js:81-84.
- The hunks do not overlap. Keep them as separate commits so each can be traced to its source finding.

## Conflicts

The two reports do not substantively disagree. Three points of contact are recorded for the Chief Architect, with no winner picked:

1. **How the comments were grouped.** UI-01 (the app comment) and CODE-02 (the harness comment) are in different files, and each reviewer raised only one of them. UI-01 itself predicted that Code Review might raise the same issue and asked for a merge. This report merges them into WORK-02 because the cause, the fix and the severity are the same. Both locations are listed, so neither finding is weakened.
2. **CODE-01 has no UI Review counterpart.** UI Review rated the States and Navigation areas clean, apart from UI-01. Code Review found the recurrence-clearing path by reading the handler. This is a difference in what each review covered, not a disagreement: UI Review read source and did not render the app, and it does not claim to have tested this path. It is recorded so the Chief Architect sees that the finding has one source.
3. **The 82px disc-top figure.** The reviewers break it down differently:
   - UI Review: 8px bar padding + 52px button + 8px padding + 14px rise.
   - Code Review: 8px bar padding + 52px button, plus a 22px rise.

   Both reach 82px, or 86px with the focus ring, and both conclude the toast clears the disc by about 10px. The outcome is the same. Only the stated breakdown differs.

## Estimated Effort

| Priority | Items | Effort |
|---|---|---|
| P0 | none | 0 |
| P1 | none | 0 |
| P2 | none | 0 |
| P3 | WORK-01, WORK-02 | 2 x XS (under 1 hour) |
| **Total** | 2 | **under 1 hour** |

## Recommendations

- **Ruling:** rule WORK-01 and WORK-02 as two XS commits before `bottom-nav-add` merges to main, then merge. Neither blocks release, but both are cheap, and WORK-02 completes the rule you set in review 3.
- **Real-device check:** schedule one check on a phone with a home indicator to confirm the toast clears the + disc. Both reviewers and the WORK-04 commit message state that headless Chrome cannot test the non-zero inset case. This is not a finding and has no WORK ID.
- **Future decisions, not work items.** Code Review's Technical Debt and Future Risks sections name three. Rule on them only if and when you want them scheduled:
  - Whether `setExpMode` should skip its clearing when the mode does not change. This would protect every caller, but it changes how the segmented control behaves when the active option is pressed again.
  - The hand-kept render chain in `navigate()` (index.html:6836-6844). A new screen needs a second edit there, and nothing warns if it is missed.
  - Keeping project.md:27 in step with any future translation of "Budget Planning" and "Plan expenses".

Files:
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\knowledge\review-conventions.md
- D:\3_Claude\PowerApps\expense-pwa\index.html (WORK-01: 7209-7212, 7163-7165; WORK-02: 6715-6717)
- D:\3_Claude\PowerApps\tools\harness\navigation.js (WORK-02: 81-84; optional WORK-01 assertion in planLinkFlow 110-124)
