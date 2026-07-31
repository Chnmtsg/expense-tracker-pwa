# Merged Execution Roadmap — Expense Tracker PWA

**Sources:** `D:\3_Claude\PowerApps\reports\ui-review.md` (23 findings, 60/100) and `D:\3_Claude\PowerApps\reports\code-review.md` (18 findings, 60/100). Both read in full. 41 findings merged into 40 `WORK-` items: two merges (UI-01+CODE-01, UI-08+CODE-18) and one split (UI-02 into an entry-point item and a Reports-module item, per that finding's own recommendation to schedule Reports separately). No finding dropped, no severity altered.

## Project Health

Both reviewers independently scored this 60/100 — usable but fragile — and they arrived there from completely different evidence, which makes the number credible rather than coincidental. Three Critical-severity defects across the two reports (one of them found twice, from the screen and from the source) block release today, but all three are XS or S: an undeclared variable that throws on every edit, and unescaped record ids that turn the documented restore path into stored XSS. The structural picture underneath is better than the score suggests — the persistence, migration, quarantine and modal layers are called clean by both reports — and the real weakness is that the interface does not match the product definition and that accessibility requirements the project's own guidelines mandate are half-met. The sequencing fact that matters most: the most recent release gate introduced one of the Criticals and left the other's class half-swept, so this build is not one fix away from ready, it is one fix plus a verification process that actually exercises the flow.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Declare `okSave` — every income/expense edit throws and raises a false data-loss banner | UI-01, CODE-01 | Critical | P0 | XS | — |
| WORK-02 | Escape the nine record-`id` interpolations (stored XSS via import) | CODE-02 | Critical | P0 | S | — |
| WORK-03 | Route `computeNextRecurring` through `stepDate` — ARCH-1 monthly overflow still live in goals | CODE-03 | High | P1 | S | — |
| WORK-04 | Give Income a direct tab slot; move Goals into the More sheet | UI-03 | High | P1 | S | — |
| WORK-05 | AA-compliant text tokens for every currency figure and semantic chip | UI-04 | High | P1 | S | — |
| WORK-06 | Custom date fields openable by keyboard (Enter/Space) | UI-05 | High | P1 | S | — |
| WORK-07 | Give Analytics and Budget Planning real destinations (rename + entry point) | UI-02 | High | P1 | M | WORK-04, WORK-12 |
| WORK-08 | Reports as a real module (product decision required — do not stub) | UI-02 | High | P2 | XL | WORK-07, architect ruling |
| WORK-09 | Filtered lists must not claim the user has no data | UI-06 | Medium | P2 | S | — |
| WORK-10 | Dashboard leads with numbers, not filter chrome | UI-07 | Medium | P2 | S | — |
| WORK-11 | "Planned Left" — caption, arithmetic and the no-plan zero state | UI-08, CODE-18 | Medium (UI-08) / Low (CODE-18) | P2 | S | WORK-12, conflict C1 |
| WORK-12 | All Time silently projects 12 months of planned spend | CODE-05 | Medium | P2 | S | — |
| WORK-13 | Horizon must ignore future-dated actuals; guard truncation must not be silent | CODE-04 | Medium | P2 | S | shares code with WORK-12 |
| WORK-14 | Clamp `recIntervalDays` ≥ 1 at both entry points and in the import validator | CODE-10 | Medium | P2 | XS | — |
| WORK-15 | Cloud load through `importProblem` → `writeDb` → `load()` | CODE-06 | Medium | P2 | S | WORK-02 |
| WORK-16 | Index Daily chart and calendar by date instead of filtering per cell | CODE-07 | Medium | P2 | M | — |
| WORK-17 | Debounce high-frequency whole-blob writes; record IndexedDB as migration target | CODE-08 | Medium | P2 | L | architect ruling |
| WORK-18 | Service worker stale-while-revalidate for the app shell | CODE-09 | Medium | P2 | S | — |
| WORK-19 | Raise five control groups to the 44×44 minimum | UI-10 | Medium | P2 | S | — |
| WORK-20 | Raise 9px/10px chart and calendar figures to the declared type floor | UI-11 | Medium | P2 | S | — |
| WORK-21 | Hue-independent cue on Monthly Trend income/expense labels | UI-12 | Medium | P2 | XS | — |
| WORK-22 | Focus ring above 3:1 | UI-13 | Medium | P2 | XS | — |
| WORK-23 | Android Back closes a modal / steps back a screen | UI-14 | Medium | P2 | M | — |
| WORK-24 | Preserve amount, notes and category across the Actual/Planned toggle | UI-15 | Medium | P2 | XS | — |
| WORK-25 | Appearance card in Settings; correct the More sheet subtitle | UI-16 | Medium | P2 | XS | — |
| WORK-26 | History button on the Salary screen | UI-17 | Medium | P2 | XS | — |
| WORK-27 | Expand SI/WHT acronyms; delete the duplicated Breakdown tiles | UI-09 | Medium | P2 | S | — |
| WORK-28 | Retire off-scale radii and spacing as blocks are next edited | UI-18 | Low | P3 | M | — |
| WORK-29 | Salary summary card inherits the hero typographic hierarchy | UI-19 | Low | P3 | XS | — |
| WORK-30 | One date-entry mechanism per form | UI-20 | Low | P3 | S | WORK-06, conflict C4 |
| WORK-31 | Illustrated empty states for the two Settings lists | UI-21 | Low | P3 | S | — |
| WORK-32 | Tab accessible names match visible labels | UI-22 | Low | P3 | XS | WORK-04, WORK-07 |
| WORK-33 | Separate maskable icon inside the 80% safe zone; text runs to paths | UI-23 | Low | P3 | S | — |
| WORK-34 | Remove or consume `_virtual` / `_seriesId` | CODE-11 | Low | P3 | XS | — |
| WORK-35 | Extract one shared `initReorder` | CODE-12 | Low | P3 | S | — |
| WORK-36 | `wireIconGrid` document-listener leak | CODE-13 | Low | P3 | XS | — |
| WORK-37 | Round salary-derived income at the write boundary | CODE-14 | Low | P3 | XS | — |
| WORK-38 | Check `save()`'s return on delete and reorder paths | CODE-15 | Low | P3 | XS | — |
| WORK-39 | Guard the three converter `localStorage.setItem` calls | CODE-16 | Low | P3 | XS | — |
| WORK-40 | Validate `recAmount` / `recFrequency` in `goalProblem()` (₮NaN) | CODE-17 | Low | P3 | XS | shares validator with WORK-14 |

## Quick Wins

XS or S effort, removing Medium severity or higher. Do these first inside their band.

- **WORK-01** (XS, Critical) — one declaration removes a release blocker, restores the edit flow, and stops the app telling users to restore a backup over good data. Found independently by both reviewers.
- **WORK-02** (S, Critical) — nine mechanical `escapeHTML()` wraps matching a pattern the file already uses elsewhere; closes script execution in the app origin.
- **WORK-03** (S, High) — one call site change deletes the second recurrence engine and the regression it carried.
- **WORK-04** (S, High) — two swapped tab slots take a core module from three taps to one.
- **WORK-05** (S, High) — three foreground tokens across six rules bring every currency figure to AA.
- **WORK-06** (S, High) — a `keydown` beside five existing `click` handlers unblocks keyboard users from flows that are currently impossible, not merely awkward.
- **WORK-21, WORK-22, WORK-24, WORK-25, WORK-26** (XS, Medium) — colour-blind-safe trend labels, a perceivable focus ring, no silent input loss, sixteen themes made findable, salary history out of the maintenance panel.
- **WORK-14** (XS, Medium) — a `Math.max(1, …)` stops a plan that renders nothing and burns 5,000 iterations per pass.
- **WORK-09, WORK-10, WORK-12, WORK-13, WORK-18, WORK-19, WORK-20, WORK-27** (S, Medium) — the rest of the half-day band.

## Sprint Plan

**Sprint 1 — Unblock release and re-earn trust in the gate.**

Items: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-39.

Effort: 1 × XS-and-a-half day of implementation — roughly **2.5 engineering days** (XS ×2, S ×5). The remainder of the sprint is deliberately reserved for verification, because the previous gate shipped a Critical into a core flow and I am not scheduling around that a second time.

Delivers: the build stops throwing on every edit and stops raising a false data-corruption banner (two independent causes closed — WORK-01 and WORK-39). The stored-XSS path through backup restore is closed. Goal contributions stop skipping February and drifting permanently. Income becomes a one-tap module, every currency figure meets AA, and keyboard users can reach recurring plans and scheduled goals. Both Criticals and four of the five High findings are gone; the build becomes releasable on severity grounds.

Exit condition, not optional: an actual exercise of the edit flow for both income and expense, the Settings render with an adversarial `id` in an imported file, and a month-end goal contribution walked across a February boundary. A document asserting these is not the same as running them.

## Roadmap

**Sprint 1** — WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-39

**Sprint 2** — WORK-12, WORK-13, WORK-14, WORK-40, WORK-11, WORK-07, WORK-32, WORK-21, WORK-22, WORK-24 (≈3 days)

**Sprint 3** — WORK-09, WORK-10, WORK-15, WORK-18, WORK-19, WORK-20, WORK-25, WORK-26, WORK-27 (≈3.7 days)

**Later** — WORK-08, WORK-16, WORK-17, WORK-23, WORK-28, WORK-29, WORK-30, WORK-31, WORK-33, WORK-34, WORK-35, WORK-36, WORK-37, WORK-38

Two P3 items (WORK-32, WORK-40) and one P3 item (WORK-39) sit earlier than their band because they touch code another item is already opening. That is scheduling convenience, not a priority change.

## Dependencies

**WORK-01 gates the sprint, not just its own finding.** Every edit currently throws and raises a non-dismissible, session-persistent banner. Any manual verification of any other item will be performed against a screen already showing "your saved data could not be read". Nothing else in Sprint 1 can be honestly signed off until this lands first.

**WORK-02 before WORK-15, and before any cloud-enabled release.** The Code Review names cloud load and the unescaped ids as the two places untrusted input reaches the DOM and the store without a gate. Wiring cloud sync while ids are unescaped widens the delivery vector from a shared backup file to a sync document.

**WORK-12 and WORK-13 are one edit.** Both change `plannedHorizon` / `boundedEnd`. Doing them separately means opening the same function twice and re-verifying the same figures twice.

**WORK-12 before WORK-11.** The "Planned Left" caption cannot be made to describe the quantity displayed while the quantity itself changes every day the app is opened on the All Time range.

**WORK-12 before WORK-07.** WORK-07 promotes the Planned mode to a named "Budget Planning" destination. Promoting a total that is horizon-dependent, non-reproducible day-to-day, and capable of silently vanishing a plan (WORK-13) makes the defect more visible, not less. See conflict C3.

**WORK-04 with WORK-07 and WORK-32.** All three edit the tab markup, the `MORE_TABS` array and the `titles` map. Sequencing them apart produces three rounds of merge friction over the same twenty lines, and WORK-32's job — make one word serve the tab text, the `aria-label` and the header title — can only be settled once the final tab set exists.

**WORK-14 with WORK-40.** Both extend the import validators (`entryProblem`, `goalProblem`) with recurrence-field checks. One sweep, one test pass.

**WORK-06 before WORK-30, conditionally.** If the unified date mechanism is the custom picker, WORK-06's keyboard handlers are the foundation. If it is the native input, part of WORK-06 is discarded. Do not start WORK-30 before the architect rules on C4.

**WORK-03 before any future recurrence feature.** The Code Review's technical-debt section identifies two recurrence engines as the cause of this defect and notes that the Debt Planner and Savings Planner named in `project.md` will each have to choose one or write a third.

**WORK-17 needs an architect ruling first.** The Code Review explicitly recommends recording IndexedDB as a migration target rather than doing it now. Treat WORK-17 as the debounce work only until that ruling exists.

**WORK-08 is blocked on product, not engineering.** UI-02 states Reports requires a product decision and should be scheduled separately, not stubbed.

## Conflicts

Recorded, not resolved. These are for the Chief Architect.

**C1 — "Planned Left": severity and direction of the fix.** UI-08 rates the tile Medium: the caption does not describe the quantity displayed, and the no-plan state renders "₮0" in grey, identical to a fully consumed plan. Its recommendation is to rename the tile so the caption matches the value, and render the no-plan case as "—". CODE-18 rates the same tile Low: the label says "Planned Left" but the arithmetic is `totalIncome - totalPlanned`. Its recommendation is also a rename ("Left After Plan"), but it names an alternative — that the app already has the more useful number the label implies (`totalPlanned` minus actual-against-plan). So the two reports agree the label is wrong and disagree on both how much it costs the user and whether the correct fix is to change the label to fit the maths or the maths to fit the label. I have scheduled WORK-11 at S rather than XS because that decision is unmade.

**C2 — The prescribed fix for the Critical.** UI-01 prescribes exactly one shape: hoist `let okSave = true;` above the income/expense branch and assign at line 6246. CODE-01 prefers `const okSave = save();` with the `savedToast` call moved into a scope that can see it, and offers the hoist as its alternative. They also cite different line numbers for the branch (6193 vs 6194). Low stakes, but this is the one line in the codebase that most needs to be changed once, correctly, by someone who has read both descriptions.

**C3 — Whether to surface Planned as a product module now.** UI-02 (High) recommends adding a "Budget Planning" entry that navigates to Expenses with Planned mode preselected, on the grounds that three named core modules currently have no destination at all. CODE-04 and CODE-05 (both Medium) hold that the planned figures behind that mode are currently unreliable in two specific ways: the All Time total silently includes twelve months of projection anchored on today, and the occurrence walk truncates at 5,000 iterations without any signal. The recommendations pull in opposite directions on timing. I have expressed my reading as a dependency (WORK-12 before WORK-07), but I am not entitled to decide that the interface should keep contradicting the product definition for another sprint. That is an architect call.

**C4 — Which date mechanism survives.** UI-05 (High) hardens the custom picker with keyboard handlers at five call sites. UI-20 (Low) says the app should route both date patterns through one mechanism and explicitly allows that mechanism to be the native input — which would remove the five call sites UI-05 just hardened. Both are from the UI report, so this is a tension inside one reviewer's recommendations rather than between the two reports, but it determines whether Sprint 1 work is thrown away in a later sprint, so it needs the same ruling.

**C5 — Divergent read of the failure layer.** The UI report lists the corrupt-data banner and quarantine infrastructure as its first Strength, "better than most production apps". The Code Review finds two independent paths that fire that same banner falsely (CODE-01 and CODE-16), and characterises its text — which tells the user to restore a backup — as the thing that will make a user discard good data. Both reviewers raised the false-fire, so this is not a contradiction of fact; they disagree on whether the mechanism as a whole is an asset or a liability. Neither raised the bluntness of `reportFatal` as a finding, so I have not created work for it. Flagging it because two Low-severity items in this roadmap (WORK-39) and one Critical (WORK-01) share a single symptom, and that pattern may itself be the finding a fourth review raises.

## Estimated Effort

| Band | Items | Breakdown | Approx. engineering time |
|---|---|---|---|
| P0 | 2 | XS ×1, S ×1 | ~0.6 day |
| P1 | 5 | S ×4, M ×1 | ~3.5 days |
| P2 | 20 | XS ×7, S ×9, M ×2, L ×1, XL ×1 | ~18 days |
| P3 | 13 | XS ×8, S ×4, M ×1 | ~4 days |
| **Total** | **40** | | **~26 days** |

Two items carry roughly 40% of the total: WORK-08 (Reports, XL, blocked on a product decision) and WORK-17 (storage strategy, L, blocked on an architecture decision). Excluding those, the entire roadmap is about 16 days. Everything that blocks release is under one day.

## Recommendations

Both Criticals are cheap and both trace to the last round of work — WORK-01 came out of the final gate commit, and WORK-02 is the unswept remainder of a class a gate commit claimed to have closed. That is the headline. The code is not getting worse in the places nobody is touching; it is getting worse in the places the gate touched. I would not spend the next decision on architecture. I would spend it on requiring that a gate closes by exercising the flow it claims to have fixed, because `VERIFICATION.md` asserted correctness across eight consumers and did not catch a `ReferenceError` on every edit in the app.

Second: fix WORK-12 early, and not only for the user. The Code Review's observation that `VERIFICATION.md` §5 asserts a value derived from a moving horizon means the project's own verification artifact cannot be re-run to the same expected result. Clamping that horizon converts a document into a repeatable check, which is worth more than the finding's Medium severity suggests.

Third: rule on C1 and C3 before Sprint 2 starts, and on C4 before anyone opens the date fields a second time. C3 is the one that matters — three of eight named core modules have no destination, which is the largest gap between what this product says it is and what it is, and the reason to delay closing it is a correctness problem that Sprint 2 fixes anyway.

Fourth: WORK-08 is the only XL item and the only one I cannot schedule. UI-02 says do not stub it. Either commit to a Reports module with a defined scope or amend `project.md` so it stops naming eight modules the app does not have — but do not leave it in the "Later" column indefinitely, because it will be the same finding in the fourth review.

Finally, the Code Review's technical-debt entry on module boundaries — 34 mutable module-level globals and a render layer that reads filter state out of DOM inputs — is not a numbered finding and I have created no work for it. I am naming it anyway, because it is the reviewer's stated explanation for why the CODE-01 class of defect was possible and why cross-screen agreement can only be checked by hand. If you want one structural investment out of this round, that is the one that changes the shape of the next report rather than its contents.
