## Project Health

The Enter amount keypad on main (33755f1) is in good shape. UI Review scores it 92/100 and Code Review 93/100. Neither report found anything Critical, High or Medium, and both confirm that all eleven ruled items (prior WORK-01 to WORK-11) landed as ruled, with one improvement: the income toast says "type" instead of "category". The feature is ready to publish once the `sw.js` cache bump past `expense-tracker-v30` is done. Both reviewers flag that bump as outstanding. The seven remaining items are all Low and all XS.

## Priority Matrix

New items in this report are numbered WORK-01 onwards. Items from the previous ruling are written "ruling WORK-nn" so the two sets don't get mixed up.

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Bump the `sw.js` cache past `expense-tracker-v30` in the publish change | CODE-01 (also noted, without an ID, in the UI Review Ruling Conformance section) | Low | P3 (release gate, see Recommendations) | XS | WORK-02 to WORK-07 that ship in this publish |
| WORK-02 | Hardware-keyboard digits stop working once focus leaves the sheet: add `tabindex="-1"` to the `.modal` inside `#quickSheet` | CODE-02 | Low | P3 | XS | none |
| WORK-03 | Two design-record comments state a uniqueness or a count that nothing enforces (index.html 6849 "the one field still to check"; probe flow name "...beside three buttons") | CODE-03 | Low | P3 | XS | Chief Architect ruling on Conflict 2 (wording only) |
| WORK-04 | Probe flow 3 depends on flow 2's leftover sheet state: give it its own sheet and assert `₮999,999,999,999` | CODE-04 | Low | P3 | XS | none |
| WORK-05 | Past the 12-digit cap, keys are dropped silently and "000" adds fewer than three zeros: make "000" all-or-nothing | CODE-05 | Low | P3 | XS | WORK-04 |
| WORK-06 | The header entry point uses the app's "save a record" plus icon: switch to the "₮+" mark already allowed, or record the plain plus as a decision | UI-01 | Low | P3 | XS | Chief Architect decision (which icon) |
| WORK-07 | Keypad keys have no hover state: add `.quick-key:hover { background: var(--border); }` | UI-02 | Low | P3 | XS | none |

Duplicates removed: the UI Review's note that `sw.js` is still v30 has no ID and is the same issue as CODE-01. It is merged into WORK-01. The two reviewers disagree on the impact of that issue, which is recorded under Conflicts.

## Quick Wins

None. Every item is XS, but none removes a Medium or higher finding.

## Sprint Plan

Sprint 1: WORK-04, WORK-05, WORK-02, WORK-07, WORK-03, WORK-06 (once ruled), then WORK-01 as the last change before publish.

- Total effort: 7 x XS, under about 3.5 hours including probe runs. The sprint has plenty of room, on purpose. Nothing else from these reports belongs in it.
- WORK-05 is the one to drop if time runs short. Its reviewer marks it optional.
- WORK-06 ships only if the Chief Architect picks "₮+". If the ruling keeps the plain plus, the item becomes a recorded decision with no code change.
- What the sprint delivers:
  - Typed digits keep working after a click inside the sheet.
  - Keypad keys get hover feedback.
  - The probe stops reporting one failure twice under two names.
  - "000" behaves predictably near the cap.
  - The design-record comments meet coding-standards.md.
  - The icon decision is either applied or recorded.
  - A publishable build with the cache bumped once, covering all of the above.

## Roadmap

- Sprint 1: WORK-04, WORK-05, WORK-02, WORK-07, WORK-03, WORK-06, WORK-01
- Sprint 2: none from these reports
- Sprint 3: none from these reports
- Later: none from these reports. Ruling WORK-12 (the double render on the Planned to Expense hand-off) stays deferred under the previous ruling's trigger. Code Review confirms that trigger has not fired. It is not re-itemised here because neither report raises it as a finding.

## Dependencies

- **WORK-01 after every other item that ships in the publish.** The cache constant marks the publish. Bumping it before the last code change would mean bumping twice or shipping a change under a stale cache. CODE-01's own recommendation is to bump with the publish, not now on main.
- **WORK-05 after WORK-04.** WORK-05 changes how keys behave at the 12-digit cap, and flow 3 ("the longest amount fits...") tests exactly that region. If flow 3 starts from a clean sheet first, any change in its result can be put down to WORK-05 alone, not to leftover state from flow 2.
- **WORK-03 and WORK-04 both edit tools/harness/quick-entry.js.** They don't depend on each other logically, but doing them one after the other avoids an edit collision.
- **WORK-06 needs a Chief Architect decision first.** UI-01 offers two acceptable outcomes: the "₮+" mark, or keeping the plain plus as a recorded decision. Choosing between them changes a ruled item (ruling WORK-03), so the Engineering Manager cannot make that call. If "₮+" is chosen, the header-width probe must stay green.
- **WORK-03's comment wording depends on Conflict 2.** The fix is XS whichever way that is ruled, but the replacement text should match the ruling.

## Conflicts

1. **What happens to installed users while `sw.js` stays at v30.**
   - UI Review: "Until then, people who installed the app keep the cached build and will not get this feature or its fixes."
   - Code Review (CODE-01): "Stale-while-revalidate (sw.js 75-104) means installed users still get the new `index.html` on their second load, so nothing breaks." What is lost is the hand-maintained publish fact and the purge of the old cache on install.
   - Both agree the bump is required before publish. They disagree on what users experience without it, and that affects how urgent the bump is.

2. **Whether Category / Type is "the one field still to check" on arrival.**
   - UI Review (Strengths): "Focus lands on `#expCategory` / `#incType`, the one field still to check, and the toast names that field."
   - Code Review (CODE-03): "Category or Type is not the only field still open on arrival: date, account and, on Income, the split all arrive pre-filled too." It treats the matching comment at index.html 6849 as a breach of coding-standards.md.
   - This matters beyond the comment. It decides whether the toast's single named field is the full truth of what the user should check.

## Estimated Effort

| Priority | Items | Effort |
|---|---|---|
| P0 | none | 0 |
| P1 | none | 0 |
| P2 | none | 0 |
| P3 | WORK-01 to WORK-07 (7 items) | 7 x XS, under about 3.5 hours |
| Total | 7 | under half a day |

## Recommendations

- **Ship it.** Both reviews say the ruling landed as written, and nothing above Low remains. Run the one XS pass in Sprint 1 and publish with the v31 bump as the last commit.
- **Treat WORK-01 as a release gate even though it is P3.** It is Low severity, so by the prioritisation table it cannot be P0 or P1. But the previous ruling made it a condition of the next publish, and both reviewers flag it. Do not publish without it.
- **Make three decisions:**
  - WORK-06: "₮+" or the plain plus. Either is fine, but write the choice down so it is a decision and not drift.
  - Conflict 1: what installed users actually get without the bump.
  - Conflict 2: whether the hand-off's "one field to check" framing is accurate. If it is not, the open question about the persistent helper line affects more than one field.
- **Keep the post-release observation the previous ruling set up.** Both reviewers say the toast's real effect cannot be judged from the source. That observation is still the only thing that can trigger a persistent helper line.
- **Watch the header width.** Code Review's Future Risks warns that the next header-level icon is likely to break the 320px layout first. The header-width probe stays the gate.

Sources:
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\knowledge\review-conventions.md
