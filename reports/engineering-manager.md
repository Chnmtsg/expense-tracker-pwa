## Project Health

UI Review scores the branch 87 and Code Review scores it 93. Neither report has a Critical or High finding, and no money, storage or schema path changed. The orchestrator ran `npm test` on the branch head (2378659) and it exited 0. Both reviewers could not run it themselves, so this is the first confirmed test result. The branch can ship. The one real gap is that Budget Planning no longer has a named way in after its More entry was removed (Medium). Everything else is Low and each fix is about one line. All of it fits in one short sprint and can land before merge.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Add a "Plan expenses" link to the Home Budget pane, and use it as the pane's empty-state action | UI-01 | Medium | P2 | S | — |
| WORK-02 | Update the Core Modules table in project.md (Analytics is now under More; Budget Planning row changes) | UI-02, CODE-01 | Low | P3 | XS | WORK-01 (ruling only) |
| WORK-03 | Rewrite the stale 360px tab-bar comment that still calls "Analytics" the longest label | UI-02, CODE-02 | Low | P3 | XS | — |
| WORK-04 | Toast `bottom` should include the safe-area inset and clear the raised disc, confirmed by a headless probe | UI-04, CODE-04 | Low | P3 | S | — |
| WORK-05 | Move the focus ring from the `.tab-add` button onto `.tab-add-disc` | UI-03 | Low | P3 | XS | — |
| WORK-06 | Build `MORE_TABS` from the `[data-more-nav]` buttons so the list exists only once | CODE-03 | Low | P3 | XS | — |
| WORK-07 | Keyboard users reach Enter amount last: either add a "Skip to tab bar" link or accept the trade-off | UI-05 | Low | P3 | S | Owner decision |

Notes on the matrix:
- I estimated WORK-04 at S. Both reviewers said XS for the CSS change, but Code Review also asks for a probe at 320 and 390 that measures `#toast` against `.tab-add-disc`. A probe that measures layout is the kind of check that can pass falsely in this project's headless setup, so it gets real time.
- UI-02 covers both the project.md table and the stale comment. I split it into WORK-02 and WORK-03 because the two edits are in different files, so UI-02 is listed under both.

## Quick Wins

- **WORK-01** (S, Medium). It is the only item that qualifies. One link gives a core module a named way in again without undoing the owner's removal. Do it first in P2.

## Sprint Plan

**Sprint 1: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06**

- Total effort: 1 S + 1 S + 4 XS. That is at most about one working day, with time left to re-run `npm test` and do the Review Again step.
- What it delivers:
  - Budget Planning gets a named way in from Home, and the Budget pane's empty state gets a next step.
  - project.md matches the shipped navigation again, so the next review does not raise false "unreachable" findings.
  - The design-record comment is true again.
  - The toast no longer covers the raised disc on phones with a home-indicator inset, and a probe proves it.
  - The focus ring on the main control outlines the disc.
  - The More highlight cannot drift from the More sheet when new destinations are added.
- WORK-07 is left out on purpose. It needs an owner decision before there is anything to build.

## Roadmap

- **Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06
- **Sprint 2:** WORK-07 (only if the owner asks for the skip link; if they accept the trade-off, close it with no code)
- **Sprint 3:** none
- **Later:** none

## Dependencies

- **WORK-01 before WORK-02.** The new Budget Planning row in project.md depends on whether the Home link is accepted. UI-02 says to add the Home link "if UI-01 is accepted", while CODE-01 writes the row without it. Write the row once, after WORK-01 is ruled on. (Also see the first item under Conflicts.)
- **WORK-04 and WORK-05 both edit the CSS around the raised disc** (`.toast`, `.tab-add`, `.tab-add-disc`). This is a sequencing note, not a real dependency: do them one after the other in the same change so they do not conflict.
- **WORK-06 changes how navigation highlighting works.** It must pass the existing More-highlight check in `quick-entry.js` and the More-entry check in `navigation.js`.
- **All Sprint 1 items need a fresh `npm test` run afterwards.** The exit 0 the orchestrator got applies to 2378659 only.
- **WORK-07 depends on the owner** choosing between a skip link and accepting the trade-off.

## Conflicts

1. **Does Budget Planning still meet the "reached by name" rule in project.md?**
   - UI Review (UI-01, Medium): Budget Planning is now the only one of the eight core modules "with no named way in". The words appear only in the header after the user taps "Planned" on Expenses. Home mentions "plan" and "Budget" but links nowhere.
   - Code Review: raises no finding on this. CODE-01 proposes documenting the way in as "the Expenses screen in Planned mode (header reads Budget Planning)", which treats the current path as good enough to record. The issue appears only under Future Risks, and only for the case where the Mongolian language layer renames the control.
   - This is also why the scores differ (87 vs 93). I have not decided between them. The Chief Architect's ruling decides whether WORK-01 is built and how WORK-02 is worded.

2. **Wording of the Budget Planning row in project.md.**
   - UI-02: "Expenses screen, Planned mode", plus the Home link if UI-01 is accepted.
   - CODE-01: "the Expenses screen in Planned mode (header reads Budget Planning)".
   - This follows from conflict 1.

Where the reports agree, recorded so it is not mistaken for a conflict: both reports independently decline the decimal/comma keypad key, for the same reason. The keypad's `String(amount)` hand-off into the `.money-input` fields, combined with `unmoney` and `formatMoneyInput` stripping every non-digit, would turn 12.50 into ₮1,250. That is a silent wrong financial figure, and it contradicts "whole tugrik throughout" (product-strategy.md:84). Both reports also say a comma key would be useless.

## Estimated Effort

| Band | Items | Effort |
|---|---|---|
| P0 | none | 0 |
| P1 | none | 0 |
| P2 | WORK-01 | S (under half a day) |
| P3 | WORK-02, WORK-03, WORK-05, WORK-06 (XS each); WORK-04, WORK-07 (S each) | about 2 hours + up to 1 day |
| **Total** | 7 items | about 1.5 days at most; Sprint 1 alone is about 1 day |

## Recommendations

- **Merge after Sprint 1, not before.** Nothing blocks release. But WORK-02 matters more than its size suggests: until project.md matches the shipped navigation, the next review cycle will report false regressions.
- **Rule on conflict 1 first.** Either Budget Planning needs a named way in from Home (WORK-01), or the Planned toggle plus the header title counts as "reached by name". That one decision sets WORK-01 and the wording of WORK-02.
- **Decline the decimal/comma key.** Both reviewers agree, and building it would cause a Critical-class wrong-figure defect. Tell the owner to use "Convert from foreign currency" for amounts with cents. Supporting fractions would be an XL money-model change and a product-strategy decision.
- **Two things to consider that have no source ID, so I have not made them `WORK-` items.**
  - Code Review suggests an optional XS guard in `quick-entry.js` that asserts `.` and `,` keydowns leave the amount unchanged.
  - Code Review records as debt that `no-unused-vars` is off, so a helper left dead by the advisor removal would not be caught by lint or by the reviewers' searches.
  - If you want either, ask a reviewer to raise it as a finding.
- **Decide WORK-07 with the owner.** Accepting the keyboard-order trade-off is a valid result and costs no code.

Files:
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\knowledge\review-conventions.md
