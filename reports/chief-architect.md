## Executive Decision

**Yes. The branch is fit for release** once the two XS items below land and `npm test` passes again. Both reviewers checked all six review 3 items (WORK-01 to WORK-06) independently. Both found every item on `bottom-nav-add` at 65880a9 as ruled and within scope. Where Code Review could not see history, the orchestrator confirmed the two conditions it could not check: 86fe1c4 touched only index.html, and the WORK-04 commit message claims only the zero-inset case. Neither report has a Critical, High or Medium finding, and the branch changes no money, storage, schema, validation or import code. The one finding that touches financial data is WORK-01 (CODE-01). An unsaved recurrence is cleared silently, so a recurring planned expense can be saved as a one-off and future planned figures come out too low. Nothing already saved is lost, but it is the kind of quiet distortion this product exists to prevent, and the fix is one guard. That is why I hold the merge for it rather than ship it as a follow-up.

I checked both items against the source. At index.html:7209-7212 the handler calls `setExpMode('planned')` with no guard, and `setExpMode` clears `#expRecFreq`, `#expRecCustomWrap` and `#expRecEnd` unconditionally (7163-7165). The comments at index.html:6715-6717 and tools/harness/navigation.js:83-84 still say "reached only".

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | "Plan expenses" clears an unsaved recurrence when Expenses is already in Planned mode (CODE-01) | It removes a real path to an understated planned figure, and correct financial figures outrank everything else. The fix is the guard the other two `setExpMode` callers already use (6721, 6781): `if (expMode !== 'planned') setExpMode('planned'); navigate('expenses');`. It also removes the duplicate `renderExpenses()`. **The planLinkFlow assertion is part of this item, not optional.** It starts in Planned mode with `expRecFreq` set, taps the link, and checks the value survives. CODE-01 shows that a caller forgot this guard once. Without a test locking it in, the fix rests on memory. The assertion tests this same change, so it belongs in the same commit. |
| WORK-02 | Two comments still say Planned mode is reached "only" through the Expenses screen's own control (UI-01, CODE-02) | coding-standards.md calls comments the design record and forbids an unenforced "the only". Since 1fca51b both comments are false. They also break the review 3 rule that navigation and its references must not disagree. Fix both locations, index.html:6715-6717 and tools/harness/navigation.js:83-84. Change only the false sentence in each, state both ways in, and keep the line saying More has no entry. The item is not done until both are corrected. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| (EM future decision, from Code Review Technical Debt) | Make `setExpMode` skip its clearing when the mode does not change | I reject this now. It changes how the segmented control behaves when the active option is pressed again, and no finding asks for that. With WORK-01's guard and assertion, the caller-side check is enforced at all three callers. Moving the guard inside the function is a generalisation without a present need. If the caller count grows, the Deferred row on the render chain is the place to revisit this. |
| (EM future decision, from Code Review Future Risks) | Keep project.md:27 in step with any translation of "Budget Planning" and "Plan expenses" | Rejected as a work item, because there is no work to do. No translation is scheduled, and the review 3 rule already requires navigation and project.md to change in the same merge. A second rule for the same thing would only duplicate the first. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| (EM future decision, from Code Review Future Risks) | The hand-kept render chain in `navigate()` (index.html:6836-6844) | **Trigger:** the next change that adds a screen or a More destination. That change must either add its render call and a navigation harness assertion that the new screen renders, or replace the chain with a lookup table keyed by screen name. Whoever adds the screen decides which, in the same commit. Today every screen is wired, so nothing is broken and the right shape is not yet known. Also revisit `setExpMode` guarding itself if a fourth `setExpMode` caller appears. |
| (EM recommendation, not a finding) | Real-device check that the toast clears the + disc on a phone with a home indicator | This is a stated risk, not a finding. Both sides of the calculation carry `env(safe-area-inset-bottom)` (toast at 96px plus the inset, disc top at 82px, or 86px with the ring, plus the inset), so the arithmetic holds at any inset. The check does not block the merge. It must be done once on a real device before the next review closes, and the result recorded in that review. A failure becomes a High finding against the disc and toast geometry. |

## Conflict Rulings

1. **Grouping UI-01 and CODE-02 into WORK-02.** Upheld. They share a cause, a fix and a severity, and both locations are named as required. One item with two locations fits "never approve two unrelated changes as one piece of work", because these changes are related: they correct the same false claim. One commit for WORK-02.
2. **CODE-01 has a single source.** There is no conflict, and a single source does not weaken the finding. UI Review read the source and did not exercise this path, and it says so. Code Review traced it in code, and I confirmed it at index.html:7163-7165 and 7209-7212. The finding stands at Low, and it is approved.
3. **The breakdown behind the 82px disc-top figure.** There is no conflict in the outcome. Both breakdowns reach 82px (86px with the focus ring) and about 10px of clearance. Code Review's version (8px padding + 52px button + 22px rise) is the one it checked against the CSS, and it matches the comment at index.html:2467. UI Review's 8 + 14 split adds up to the same 22px. I rule the 82px figure and the existing comment correct, and no change is needed.

## Development Order

1. **WORK-01 first** (index.html:7210 guard, plus the planLinkFlow assertion in tools/harness/navigation.js). It is the only item that affects financial data, so it goes first. Landing it first also means WORK-02's corrected comment describes the final shape of the entry path.
2. **WORK-02 second** (index.html:6715-6717 and tools/harness/navigation.js:83-84). Only comments change.

These are two separate commits, each naming its source IDs. The hunks do not overlap. After both, run the full `npm test` (all standing gates, including `quick390`) and merge `bottom-nav-add` to main only on exit 0.

## Architecture Strategy

**What stays:**
- The single-file, offline-first PWA.
- `navigate()` as the only path between screens, and `setExpMode()` as the only path between modes.
- The More sheet markup as the only list of secondary destinations (WORK-06).
- The 5-slot bar with the raised Enter amount disc.
- The owner decisions: advisor removed, Budget Planning out of More, no decimal key.
- The rule that navigation, its comments, the harness and knowledge/project.md agree in the same merge.

**What changes:** only the guard and the two comments above.

**What is off limits this quarter:**
- Reopening any owner decision.
- Restructuring `setExpMode`'s clearing behaviour.
- Generalising the `navigate()` render chain before its trigger fires.
- Any probe or commit message that claims to have checked the non-zero safe-area inset headlessly.

**Watched risks, carried forward:** `no-unused-vars` stays off, so dead code is still found only by name search; the inset case needs a real device.

## Final Recommendation

Land WORK-01 now as one commit on `bottom-nav-add`. That is the `expMode !== 'planned'` guard at index.html:7210 plus the planLinkFlow assertion that a set `expRecFreq` survives the Plan expenses tap. Then land WORK-02 as a second commit correcting both "only" comments. Run the full `npm test`, and merge to main when it exits 0.

Files:
- D:\3_Claude\PowerApps\reports\engineering-manager.md
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\expense-pwa\index.html (WORK-01: 7209-7212, with 7163-7165; WORK-02: 6715-6717)
- D:\3_Claude\PowerApps\tools\harness\navigation.js (WORK-02: 83-84; WORK-01 assertion in planLinkFlow, 110-124)
