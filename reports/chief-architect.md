## Executive Decision

**Yes.** The Enter amount keypad on main (33755f1) is fit for release. The only condition is that the publish change bumps `sw.js` past `expense-tracker-v30` (WORK-01). Both reviewers checked all eleven ruled items against the source and found them in the ruled shape. I re-read `quickEntryTo()` and the keydown handler at index.html 6840-6877 and agree. The keypad writes no record. The amount is read once (`quickAmount()`, 6811) as a capped whole-tugrik integer. It reaches the form as a bubbling `input` event, and the form's Add button is still the only write path. Nothing at Critical, High or Medium remains. The six other items are Low and XS. I approve four of them, approve one as a written decision with no change in behaviour, and reject one. None of them blocks release.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Bump the `sw.js` cache past `expense-tracker-v30` in the publish change | Release gate. The previous ruling made it a condition of the next publish, and the sw.js header comment (lines 1-8) makes the cache key a hand-maintained publish fact. Without the bump, the `activate` purge (39-46) never removes the old cache. **Shape:** change `expense-tracker-v30` to `expense-tracker-v31` (line 9), in the publish change only and as its last commit. Do not bump it on main ahead of the publish, and bump it once only. It stays Low (Conflict 1 explains why the user impact is smaller than UI Review stated), but the reviewer's severity does not change its status as a gate. |
| WORK-02 | Hardware-keyboard digits stop working once focus leaves the sheet | Real and confirmed. The digit handler is on `#quickSheet` (6872), and the document handler (6492-6506) handles only Escape and Tab. A click on the amount or a gap sends focus to `body`, and after that typing does nothing. **Shape:** add `tabindex="-1"` to the `.modal` at index.html 3681. No JavaScript change, and do not move digit handling into the shared document handler. This is safe with the shared modal code: `focusablesIn()` (6360) excludes `[tabindex="-1"]`, so `openModal()` still lands focus where it does today and the Tab trap is unchanged. See Risks for the one thing to check (the focus ring). |
| WORK-03 | Two design-record comments claim a uniqueness or a count that nothing enforces | It breaches coding-standards.md, and these comments are the design record. **Shape:** follow the Conflict 2 ruling. index.html 6849 becomes "Focus lands on the field the toast names, which also scrolls it in." Rename the quick-entry.js flow at line 44 to "the header keeps every screen title on one line". Do not add a header-button count assertion. The property worth holding is the width, and the probe already enforces it. A count would fail the next time a button is added without any user harm. |
| WORK-04 | Probe flow 3 depends on flow 2's leftover sheet state | The probe is this feature's only gate. A gate that reports one failure twice under two names makes every later failure harder to read. **Shape:** flow 3 opens its own sheet (`navigate('dashboard')`, then click `#quickBtn`) and asserts `₮999,999,999,999`. Nothing else changes. |
| WORK-06 | Header entry point uses the app's "save a record" plus icon | **Decision: keep the plain plus (`#ic-plus`), and write that decision down.** Approved only as that written record. The switch to "₮+" is rejected (see Rejected Improvements). **Shape:** one comment line above `#quickBtn` (index.html 2632) recording that the plain plus is deliberate. The journey it starts does end in a saved record. The "→" labels and the "Not saved yet" toast mark the step where nothing is saved yet. This ruling is the reference. The point is to make this a decision rather than drift, which UI-01 asks for, and to stop the next review raising it again. |
| WORK-07 | Keypad keys have no hover state | It is inconsistent with every comparable control, including the two buttons directly below the keys. It is one CSS rule. **Shape:** `@media (hover: hover) { .quick-key:hover { background: var(--border); } }`. The media guard is deliberate and departs from the unguarded `:hover` used elsewhere in the file. The keypad is tapped many times in a row on touch screens, and there an unguarded `:hover` sticks to the last key tapped, so that key looks selected. Mouse users get the feedback UI-02 asks for, and touch users get nothing new. Do not change the other `:hover` rules in the file. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-05 | Make "000" all-or-nothing at the 12-digit cap | It is not worth building. The behaviour only applies above ₮10,000,000,000, which the code's own comment (6805-6806) describes as past any personal amount. The user always sees the figure before the hand-off, so no wrong record can happen unnoticed. The reviewer marks it optional and advises against telling the user about the cap. Adding a branch, plus a probe assertion to hold it, for an amount nobody types is cost with no benefit. The silent cap stays as it is. |
| WORK-06 (part) | Switch the header icon to a "₮+" mark | It would mean a new glyph for an icon that no user has been shown to misread in a way that causes harm. UI-01 itself says no wrong record results, because the misreading is caught downstream. A text-style currency mark would be the only icon of its kind in the header, and the header is already the width the Future Risks note warns about. It would also tie the entry point to ₮ while multiple currencies are still an open question in the long-term risks. The plain plus is the smaller and more conventional "new entry" signal. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| Ruling WORK-12 (carried forward, not re-itemised this round) | Expense from Planned mode renders the list twice | Unchanged from the previous ruling. Either (a) a render-cost measurement at about 10,000 transactions on a low-end Android device shows the double render is noticeable, or (b) a third caller of "set mode, then navigate to Expenses" appears. Code Review confirms neither has happened. When one does, build one function for both callers, with no special case for Quick entry, and move the WORK-09 comment into it. |
| Persistent helper line on the destination form (the previous ruling's conditional next step, not a WORK item) | Replace or back up the toast | Only the post-release observation the previous ruling set up can trigger this: do users tap Add without checking the category or type? Both reviewers say the source cannot answer that. Do not build it ahead of the evidence. |

## Conflict Rulings

**Conflict 1: What installed users get while `sw.js` stays at v30.**
Code Review is right. UI Review overstates the impact. I read sw.js. The fetch handler is stale-while-revalidate (66-104). Every load serves the cached `index.html` and fetches the new one in the background, then writes it into the same `v30` cache through `waitUntil`. An installed user therefore gets the new build, including this feature and its fixes, on their second load after deploy. They are not stuck on the old build. Without the bump, two things are lost: the new service worker does not install, and the `activate` handler does not purge old caches. The sw.js comment also says the bump is the record of a publish. **Ruling:** the bump is a release gate because it is the project's publish discipline, not because users are stuck. Urgency does not change. It goes in the publish change, last, as WORK-01 says, and not now on main.

**Conflict 2: Is Category / Type "the one field still to check" on arrival?**
Both reviewers describe the same behaviour correctly, and only the comment is wrong. Code Review is right that date, account and (on Income) the split also arrive pre-filled, so "the one field" is a count that nothing enforces. UI Review is right that the toast and the focus point at the field this hand-off actually puts at risk. The previous ruling identified the risk as entries "filed under the preselected category". Date and account arrive with the same defaults the form shows when opened by hand, so they are not a risk this feature creates. **Ruling:** keep the toast text and the focus target unchanged. The single named field is a deliberate choice of what to point at, not a claim that nothing else matters. Reword the comment as set out under WORK-03. If the post-release observation is ever run, it measures category/type checking only. If it shows wrong-account entries, that is a separate finding about the form's defaults, not about this feature.

**Unrecorded discrepancy, noted for completeness.** UI Review's Strengths says digits "type into the keypad from any focus". CODE-02 shows they do not once focus reaches `body`, and the source confirms CODE-02 (6872 and 6492-6506). WORK-02 settles this. No separate ruling is needed.

## Development Order

Each item is its own commit. `npm test` passes at every step, not only at the end. A short-lived branch, as in the previous round, is fine but not required, because nothing here gates a merge.

1. **WORK-04.** The probe comes first so that each later change is checked by flows that do not depend on one another.
2. **WORK-03.** It edits the same probe file, so doing it straight after WORK-04 avoids an edit collision. It also rewords the index.html 6849 comment per Conflict 2.
3. **WORK-02.** The `tabindex="-1"` attribute. No new probe flow is required. If one is added, it must use a real pointer event (CDP `Input.dispatchMouseEvent`). A synthetic `.click()` does not move focus and would pass even if the fix were missing.
4. **WORK-07.** The hover rule. CSS only, and independent of the items above.
5. **WORK-06.** The one-line decision comment at `#quickBtn`. It changes no behaviour, so its position in the order does not matter. It comes before the publish so the record ships with the build.
6. **WORK-01.** The last commit, in the publish change itself. One bump, to v31, covering everything above.

If a publish is needed before items 1-5 are done, ship with WORK-01 alone. None of the other items is a release gate.

## Architecture Strategy

**What stays**
- The form is the only write path. The keypad hands over an amount and never writes a record.
- The shared modal stack with its general focus rule. Keyboard behaviour specific to this feature stays in the feature's own handler. WORK-02 is fixed in markup for exactly this reason.
- The pre-fill convention from the previous ruling: new money pre-fills dispatch a bubbling `input` event. Existing callers are not moved over this quarter.
- The single-file, offline-first, no-dependency structure, the token scale, and the 320px header-width probe as the gate on anything placed in the header.
- The plain plus in the header (WORK-06), the silent 12-digit cap (WORK-05 rejected), and the toast as the only "not saved yet" cue until the observation says otherwise.

**What changes**
- Nothing structural. This round is a finishing pass. The only new pattern is the `(hover: hover)` guard on the keypad's hover rule. It is limited to a control tapped many times in a row and is not to be rolled out across the file without its own finding.

**What is off limits**
- A keypad that saves directly, or any second write path.
- Confirmation dialogs on the hand-off or on mode switching.
- A visible text label, a fourth icon, or a custom glyph in the header without the 320px probe passing and a ruling.
- Currency handling in the keypad until multiple currencies are a ruled roadmap item. Today the hand-off carries a bare integer, as Code Review notes.
- A toast or warning for the digit cap.
- Building the persistent helper line or the WORK-12 shared function before their triggers fire.

**Risks (not findings)**
- **Focus ring on the dialog after WORK-02.** The global rule `[tabindex]:focus-visible` (index.html 1212) applies to the newly focusable `.modal`. Chrome can start matching `:focus-visible` on an element that was focused by mouse once a key is pressed while it has focus. So click the amount, then type a digit, and a 2px outline may appear around the whole sheet. Check this by hand during WORK-02. If it appears, suppress the outline on `#quickSheet .modal` only, in the same commit. The dialog container is not a control, so this costs no accessibility.
- **Header width.** It stays the first place a future header item will break (Code Review, Future Risks). The probe is the gate.
- **Unenforced pre-fill convention.** A third pre-fill site that skips the bubbling `input` event would quietly bypass the income split. No gate catches this today. Re-check it in the review of whichever change adds that caller.

## Final Recommendation

Make flow 3 in tools/harness/quick-entry.js open its own sheet and assert `₮999,999,999,999` (WORK-04), with `npm test` green. Then work through WORK-03, WORK-02, WORK-07 and WORK-06 as separate commits, each passing `npm test`. Publish with the `sw.js` bump to `expense-tracker-v31` as the single last commit. The feature is releasable now. The bump is the only thing that must not be skipped.

Files:
- D:\3_Claude\PowerApps\reports\engineering-manager.md
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\expense-pwa\index.html (`#quickBtn` 2632-2634, sheet `.modal` 3681, Quick entry JS 6802-6879, comment at 6849, `focusablesIn` 6359-6363, `openModal` 6448-6461, document keydown 6492-6506, `[tabindex]:focus-visible` 1212, `.quick-key` 2087-2093)
- D:\3_Claude\PowerApps\expense-pwa\sw.js (line 9; activate purge 39-46; stale-while-revalidate 66-104)
- D:\3_Claude\PowerApps\tools\harness\quick-entry.js (flow name line 44; flow 3 at 92-110)
