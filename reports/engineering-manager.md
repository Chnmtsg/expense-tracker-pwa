## Project Health

The Quick entry keypad is sound in code but not yet sound in what it tells the user. Code Review scores it 93/100: no Critical, High or Medium findings, the money path is correct, and it writes nothing before Add. UI Review scores it 78/100 because of one contained High finding (UI-01). The sheet's big "↓ Expense" / "↑ Income" button looks like it saves the entry, but it only opens a form that still needs Add. As a result, entries go unrecorded or get filed under the preselected category, so the user's totals end up wrong. That fix is size S, and I recommend landing it with the two cheap Medium fixes before this uncommitted feature is committed.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | The sheet's action buttons look like they save the entry, but they only open a form that still needs Add (relabel as next step, add a "Not saved yet. Check the category, then tap Add." cue on arrival) | UI-01 | High | P1 | S | — |
| WORK-02 | Pressing Enter after typing an amount closes the sheet and loses the amount (focus starts on the close X) | UI-02 | Medium | P2 | XS | WORK-01 (soft) |
| WORK-03 | The header button has no visible label and looks like a calculator | UI-03 | Medium | P2 | S | — |
| WORK-04 | The Income/Expense pair is styled like Cancel/Confirm, and its two labels use different type sizes (13px vs 15px) | UI-04 | Low | P3 | XS | WORK-01 (soft) |
| WORK-05 | The action buttons sit as close to the keypad as the keys sit to each other (8px), so they read as a fifth key row | UI-05 | Low | P3 | XS | — |
| WORK-06 | Two different features on the same forms are both called "quick" (keypad vs Quick amount chips) | UI-06 | Low | P3 | XS | WORK-03 |
| WORK-07 | The synthetic `input` event does not bubble, so it is not "exactly as a typed one" | CODE-01 | Low | P3 | XS | — |
| WORK-08 | The probe does not check the split half of the hand-off it claims to hold | CODE-02 | Low | P3 | S | WORK-07 (soft) |
| WORK-09 | The Expense hand-off can silently clear an unsaved Planned recurrence draft | CODE-04 | Low | P3 | XS | — |
| WORK-10 | Repeated lookups, repeated parsing and a top-level mutable global (`quickAmount()` helper) | CODE-05 | Low | P3 | XS | WORK-01, WORK-07 (soft) |
| WORK-11 | `.quick-modal` is a class nothing uses | CODE-06 | Low | P3 | XS | — |
| WORK-12 | Expense from Planned mode renders the Expenses list twice in one tap (shared with the More → Budget path; reviewer says defer) | CODE-03 | Low | P3 | S | — |

Duplicates: none. The two reports describe 12 distinct problems. UI-01 and CODE-04 both live in `quickEntryTo()`, but one is a misleading-completion problem and the other is a silent draft clear. They stay separate.

## Quick Wins

Do these first inside their priority band:

- **WORK-01** (S, removes a High): relabel the buttons and add one "not saved yet" helper line. Select defaults and save logic stay unchanged.
- **WORK-02** (XS, removes a Medium): move focus when the sheet opens (to a key or the Expense button) so Enter can never land on the close X.
- **WORK-03** (S, removes a Medium): use a plus or "₮+" style mark, or a short visible label, in place of the calculator icon.

## Sprint Plan

**Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07.

- **Total effort:** 2 S + 5 XS, about 1.5 days at the upper bound.
- **What it delivers:** a keypad an untrained user cannot mistake for a save. Keyboard and screen-reader users keep their amount. The feature can be found and has one clear name. The commit row is visually separate from the keys and its buttons carry equal weight. The hand-off event behaves like a real typed one.
- **Why these four P3 items are in:** WORK-04, WORK-05 and WORK-06 edit the same markup, CSS and naming as WORK-01 and WORK-03. WORK-07 is a one-line change in the same function WORK-01 touches. Doing them in the same pass avoids editing those lines twice. They are scheduled for convenience and their priority does not change.
- **Probe updates are in scope:** the probe sends its keyboard events to `#quickClose` (UI-02 evidence), and the hand-off flow will gain a helper line. tools/harness/quick-entry.js must be updated in the same sprint so `npm test` stays green and honest.

## Roadmap

- **Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07
- **Sprint 2:** WORK-08, WORK-09, WORK-10, WORK-11
- **Sprint 3:** none
- **Later:** WORK-12

## Dependencies

- **WORK-06 after WORK-03:** UI Review says to rename the keypad "when the label from UI-03 is chosen". The new name and the new header mark are one decision.
- **WORK-04 after or with WORK-01 (soft):** both change the same two buttons (index.html lines 3690-3693). Settle the labels first, then the classes and sizing, or do both in one change.
- **WORK-02 with WORK-01 (soft):** one of UI-02's fix options is to focus the Expense button when the sheet opens, and that button is being relabelled in WORK-01. Agree the final button before choosing the focus target. Either way, the probe's keyboard steps must move off `#quickClose`.
- **WORK-08 after WORK-07 (soft):** the split assertion passes today because the listener is attached directly to the field. Landing it after the bubbling fix means the gate covers the event as it will finally be dispatched. CODE-02 names CODE-01 as one way the split could stop following the hand-off.
- **WORK-10 after WORK-01 and WORK-07 (soft):** the `quickAmount()` helper touches `renderQuickEntry` and `quickEntryTo`. Sequencing it after the Sprint 1 edits to `quickEntryTo` avoids churn.
- **WORK-09 and WORK-12 (soft link, not blocking):** Code Review's refactoring note puts the schedule-clear note into the merged "set mode and navigate" function that WORK-12 would create. CODE-04's own recommendation (a comment in `quickEntryTo`, or a probe check) can be done now. WORK-09 should not wait for WORK-12.
- **WORK-12 is outside this feature:** the double render copies the existing More → Budget path. Code Review recommends fixing both callers together when render cost is next measured, with no special case for Quick entry.

## Conflicts

For the Chief Architect. I have not resolved these.

1. **Is the hand-off safe to ship?**
   - Code Review: "Nothing in this change blocks release." It rates the money path, data and architecture Clean, and cites the probe's Add steps (quick-entry.js lines 115 and 131) as proof that nothing is written before Add.
   - UI Review: rates UI-01 High. Users will believe the entry is saved and leave, or tap Add under whatever category is preselected. Its impact, as written: "their totals and balance are wrong". It cites the same probe (line 116, clicking `expAdd` straight after the hand-off) as proof that the misfiling path is one tap long.
   - Both reports read the same evidence and reach different readiness conclusions. Neither finding is Critical, so no P0 exists. Whether WORK-01 must land before the feature is committed is a ruling for you.
2. **Keyboard integration.**
   - Code Review lists "Integration (modal stack, keyboard, package.json)" as Clean.
   - UI Review raises UI-02 (Medium): focus opens on the close X, so Enter after typing an amount closes the sheet and discards it.

## Estimated Effort

| Priority | Items | Effort |
|---|---|---|
| P0 | none | 0 |
| P1 | WORK-01 | 1 S (under half a day) |
| P2 | WORK-02, WORK-03 | 1 XS + 1 S (under about 1 day) |
| P3 | WORK-04 to WORK-12 | 7 XS + 2 S (under about 1.5 days) |
| **Total** | 12 items | 8 XS + 4 S, about 2.5 days at the upper bound |

## Recommendations

- **Fix WORK-01 before this feature is committed.** The code is right. The problem is the message the screen sends, and the cost lands in the user's own totals. It is an S fix that needs no change to save logic or select defaults.
- **Do WORK-02 and WORK-03 in the same pass.** They are cheap, and without them keyboard users lose their amount and touch users may never find the feature.
- **Rule on the two Conflicts.** The main one is whether a High UX finding gates committing a change that Code Review calls release-safe.
- **Note on UI-01's severity.** The impact UI Review describes (unrecorded or misfiled expenses, wrong totals) is close to the conventions' wording for Critical ("wrong financial figures"). The reviewer set it at High, and I have kept it there. If you want it re-rated, that question goes to UI Review.
- **Not a work item:** Code Review records a release note. `expense-pwa/sw.js` still has `CACHE = 'expense-tracker-v30'` and must be bumped when this change ships, per its own comment.
- **Before this goes further:** Code Review's technical debt notes two ways of pre-filling a money field (calling `formatMoneyInput` directly vs dispatching `input`) and two callers of "set mode and navigate to Expenses". Both are worth one decision before a third caller appears.

Sources: D:\3_Claude\PowerApps\reports\ui-review.md, D:\3_Claude\PowerApps\reports\code-review.md, D:\3_Claude\PowerApps\knowledge\review-conventions.md
