# Merged Execution Roadmap — Round 5

**Sources:** `D:\3_Claude\PowerApps\reports\ui-review.md` (14 findings, 88/100) and `D:\3_Claude\PowerApps\reports\code-review.md` (12 findings, 90/100). Both read in full, plus `D:\3_Claude\PowerApps\reports\chief-architect.md` (round 4) before anything was scheduled.

26 findings → **26 `WORK-` items. No merges, no splits, no finding dropped, no severity altered.** Numbering continues at WORK-67; nothing from the round-4 roadmap is reused.

Zero merges is itself a result, and I checked for them rather than assuming: the two reports barely overlap this round. UI Review is almost entirely contrast-table gaps and layout geometry; Code Review is almost entirely error reporting and input validation. The one artifact both touch is `reportFatal()` at `expense-pwa/index.html:7294-7298` — and they touch it in opposite directions, which is a conflict (C15), not a duplicate.

Standing rulings from round 4 remain in force and I have applied them rather than re-opened them: deferrals (WORK-49/WORK-16 class-wide perf trigger, WORK-57 with WORK-35, WORK-15, WORK-17 IndexedDB half, WORK-23 screen half, Stage 2), rejections (WORK-58, the `.btn-block` refactor, `fbApp`, both mechanical sweeps), and verification rulings V1–V5.

## Project Health

**88 and 90, and for the first time in five rounds neither reviewer raised a Critical or a High.** Both round-4 gate classes are verified closed by re-inspection rather than by commit message: all 33 `save()` sites capture or are allow-listed, the escaping and validator classes hold, and `check-contrast.mjs` converted an unmeasurable "all 16 themes" comment into 432 measurements. The build is release-eligible on severity and closer to release-ready than at any prior round. What holds it below the production-ready line is the shape of the seven remaining Mediums: four are WCAG AA failures on surfaces the new contrast predicate does not have in its pair table — three of them on the default theme's first two screens — and three are failure-reporting or input-validation gaps, including one regression where round 4's own fix (WORK-48) makes the corrupt-data banner tell the user a falsehood on the exact boot the quarantine mechanism exists to survive. Every one of those seven is XS or S.

## Priority Matrix

There is no P0 and no P1 this round. Both bands are empty because neither reviewer raised a Critical or a High, and with no P0/P1 work in existence no dependency can qualify as a P1 blocker. An empty band is a valid result and I am not inflating anything into it.

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-67 | Advisor badge paints `--on-accent` on three status fills; `--on-warning` declared 16×, used 0× | UI-01 | Medium | P2 | XS | pair table (co-pass with WORK-68/69/84) |
| WORK-68 | `.hero-label`'s `opacity: .95` puts the hero caption below AA in 12 of 16 themes | UI-02 | Medium | P2 | XS | pair table (co-pass) |
| WORK-69 | Calendar heat cells print text over an unmeasured `--primary` tint; hottest cells least readable | UI-03 | Medium | P2 | S | pair table (co-pass); precedes WORK-83/92 in `.cal-*` |
| WORK-70 | A fourth button sits beside another without setting its width, under a comment stating there were three | UI-04 | Medium | P2 | XS | applies the standing round-4 width convention |
| WORK-71 | `reportFatal()` overwrites a live corrupt-data banner and hides the recovery button | CODE-01 | Medium | P2 | XS | co-edit with WORK-74 (its most likely trigger) |
| WORK-72 | Salary form accepts negative hours and negative deduction percentages into `db.income` | CODE-02 | Medium | P2 | XS | co-edit with WORK-75 (same function) |
| WORK-73 | `Restore from file` fails silently — no `FileReader.onerror` | CODE-03 | Medium | P2 | XS | — |
| WORK-74 | `updateStorageStatus()` awaits an unguarded promise and can raise the permanent fatal banner | CODE-04 | Low | P3 | XS | co-edit with WORK-71 |
| WORK-75 | Rounding applied at three boundaries; `db.salaries` stores unrounded money | CODE-05 | Low | P3 | XS | co-edit with WORK-72 |
| WORK-76 | `revealEntryDate()` changes the preset without syncing the custom-range editor | CODE-06 | Low | P3 | XS | — |
| WORK-77 | Every mutation repaints the Dashboard even when it is not on screen (13 call sites) | CODE-07 | Low | P3 | XS | precedes any future WORK-16/49 measurement |
| WORK-78 | `check-saves.mjs` only sees a bare save that ends in a semicolon | CODE-08 | Low | P3 | XS | precedes WORK-79 |
| WORK-79 | `VERIFICATION.md` §6 asserts two things that are no longer true | CODE-09 | Low | P3 | XS | WORK-78 |
| WORK-80 | Blob-download helper written twice; both revoke the object URL synchronously | CODE-10 | Low | P3 | XS | — |
| WORK-81 | `importProblem()` does not check id uniqueness; every delete removes all matching ids | CODE-11 | Low | P3 | XS | — |
| WORK-82 | A quick-amount of zero is stored and rendered as a button that does nothing | CODE-12 | Low | P3 | XS | — |
| WORK-83 | Calendar cells still under 44px at 360/375px; icon grid has a sub-44px gap band; comment wrong | UI-05 | Low | P3 | S | co-edit with WORK-92; after WORK-69 |
| WORK-84 | Primary-button hover fill and `.hero-kpi::before` highlight carry text and are outside the pair table | UI-06 | Low | P3 | S | pair table (co-pass with WORK-67/68/69) |
| WORK-85 | Category and income-type reordering still has no keyboard path | UI-07 | Low | P3 | M | **Deferred** — WORK-35 extraction first (architect); see C11 |
| WORK-86 | The goal icon picker is now pointer-only (regression from WORK-59) | UI-08 | Low | P3 | XS | — |
| WORK-87 | The two reorder handlers still discard `save()`'s result | UI-09 | Low | P3 | XS | **Blocked on architect** — contradicts V5; see C14 |
| WORK-88 | Eight dark themes ship and none is ever chosen automatically | UI-10 | Low | P3 | S | **Blocked on architect** — rejected as WORK-58; see C12 |
| WORK-89 | Three declared token scales are bypassed throughout (type, radius, spacing, cards) | UI-11 | Low | P3 | M | **Blocked on architect** — convention-bound, sweeps rejected; see C13 |
| WORK-90 | Theme swatches carry no accessible selected state | UI-12 | Low | P3 | XS | — |
| WORK-91 | The iOS home-screen icon is an SVG, which iOS does not accept | UI-13 | Low | P3 | S | — |
| WORK-92 | Focus ring on calendar cells overdrawn on two sides since the gap change | UI-14 | Low | P3 | XS | co-edit with WORK-83 |

## Quick Wins

Every Medium in this round is XS or S. That is unusual and it is the single most useful fact in this report: **the entire P2 band is roughly one engineering day.**

- **WORK-71** (XS) — one `if (dataWasCorrupt) return;`. Stops the app telling a user whose data is sitting unreadable in a side key that "your saved data has not been changed", and stops it hiding the only button that hands those bytes back.
- **WORK-72** (XS) — one `nonNegative()` wrapper on `calcSalary`'s `g()`. Closes the last sign gap in a named core module that writes real income records.
- **WORK-73** (XS) — two lines. The recovery path the corrupt-data banner itself routes to stops being silent.
- **WORK-67** (XS) — three `color:` declarations. Makes the Dashboard's second card legible on the default theme and retires a token declared sixteen times and used zero times.
- **WORK-68** (XS) — delete one `opacity` declaration. Restores twelve themes to the 4.5:1 their scrim alphas were derived for.
- **WORK-70** (XS) — one width override plus a comment correction. Removes the fourth instance of a defect the stylesheet asserts is closed.
- **WORK-69** (S) — one cap on the heat ramp plus pair-table rows. Makes the cells the heatmap exists to highlight readable.

Two Lows are quick wins by co-edit rather than by severity and are listed in the sprint on that basis only: **WORK-74** (rides with WORK-71, and is the trigger for it) and **WORK-75** (rides with WORK-72, same function).

## Sprint Plan

**Sprint 1 — Close the entire Medium band, and put every surface that carries text into the pair table.**

Items: **WORK-78, WORK-79, WORK-71, WORK-74, WORK-72, WORK-75, WORK-73, WORK-67, WORK-68, WORK-69, WORK-84, WORK-70.**

Effort: XS ×9, S ×3 — approximately **1.75 engineering days of implementation.** The rest of the sprint is the contrast re-derivation across sixteen theme blocks and V1's write flows, which is where round 4's equivalent sprint actually spent its time.

Delivers: all seven Medium findings closed. The default theme becomes fully legible — advisor badge, hero caption, heatmap cells. Four painted surfaces that carry text enter `check-contrast.mjs`'s pair table, so the mechanism covers them rather than a human remembering them. The corrupt-data banner tells the truth on the boot it exists for, and its most plausible false trigger is guarded. The Salary Calculator stops accepting a minus sign into `db.income`. The recovery path stops being silent. And the save-outcome predicate stops being narrower than the claim written on its own header, with the document that describes it corrected to match.

Order within the sprint: **WORK-78 → WORK-79 first** (the predicate is widened before anything is trusted to it, and the document is corrected after the widening lands so it describes the final state — the architect's Step 0 pattern). Then WORK-71+WORK-74 as one pass, WORK-72+WORK-75 as one pass, WORK-73 alone. Then the four contrast items as **one measurement pass, four commits**, closing only when `check-contrast.mjs` returns zero — V4's demonstration case, exactly as round 4's Step 3 was. WORK-70 last, alone; it is thirty minutes and it is the only item touching the button rule.

I have deliberately left out the ten remaining unblocked Lows. Adding them would push implementation past three days and leave nothing for the re-derivation pass, which is the part of contrast work that is actually work. An honest 1.75 days plus verification beats an optimistic three.

## Roadmap

**Sprint 1** — WORK-78, WORK-79, WORK-71, WORK-74, WORK-72, WORK-75, WORK-73, WORK-67, WORK-68, WORK-69, WORK-84, WORK-70

**Sprint 2** — WORK-76, WORK-77, WORK-80, WORK-81, WORK-82, WORK-86, WORK-90, WORK-92, WORK-83, WORK-91 (≈1.8 days; closes every unblocked Low)

**Sprint 3** — WORK-87, WORK-88 — **only if** the Chief Architect reinstates them under C14 and C12. If either ruling stands, the item leaves the roadmap and Sprint 3 has capacity for whatever round 6 raises.

**Later** — WORK-85 (deferred behind WORK-35's extraction), WORK-89 (convention-bound; the sweep half is rejected, the stale-comment half is a scoping question for the architect under C13)

## Dependencies

- **WORK-74 before or with WORK-71.** CODE-04 is named by Code Review as the most plausible trigger of CODE-01: an unguarded `persisted()` rejection reaches `window.onerror`, which is what invokes `reportFatal()`. Fixing the banner guard while leaving the trigger fixes the symptom on the less likely path first. One pass, two commits.
- **WORK-75 with WORK-72.** Both land inside `calcSalary` — the clamp in `g()`, the rounding in the return object. Opening that function twice to change two adjacent boundaries is the expensive way to do it, and the rounding change is what lets the income write at `:4071` drop its own `Math.round`.
- **WORK-67, WORK-68, WORK-69, WORK-84 are one measurement pass.** All four are gaps in the same artifact — the pair table in `D:\3_Claude\PowerApps\tools\check-contrast.mjs`. UI Review is explicit that none of them is a failure of the mechanism. Sequencing them apart means re-deriving the same sixteen theme grounds four times. Under V4 the step does not close until the check returns zero with the new rows in it.
- **WORK-78 before WORK-79.** The document must describe the predicate after it is widened, not before. Correcting §6 first would make it stale again within the same sprint.
- **WORK-69 before WORK-83 and WORK-92.** All three edit the `.cal-grid`/`.cal-cell` block. WORK-69 changes the intensity ramp, WORK-83 changes the card padding that sets cell width, WORK-92 changes the focus outline offset. Colour first, geometry second, and WORK-83/WORK-92 together — WORK-92 exists *because* of the gap change WORK-83 completes, so splitting them risks a third pass over the same rules.
- **WORK-77 before any future performance measurement.** Code Review is careful here and I am ratifying its care: CODE-07 explicitly does not re-raise deferred WORK-16/WORK-49 and presents no new evidence against the deferral. But it does change the baseline. If the class-wide trigger (a measured render above 100ms, or a real store above 5,000 records) ever fires, measuring against a Dashboard that repaints thirteen times more often than it needs to will measure the wrong thing.
- **WORK-85 depends on WORK-35.** The architect's deferral is explicit: if the reorder paths change behaviourally, both change and the extraction comes first. This is not my dependency to remove.
- **WORK-87, WORK-88, WORK-89 depend on an architect ruling, not on engineering work.** Each is scheduled only if reinstated.

## Conflicts

Five. I am recording all five and resolving none.

### C11 — UI-07 against the deferred WORK-57

**UI Review** re-raises the missing keyboard path for category and income-type reordering at Low, M effort, with fresh location evidence (`initCategoryReorder()` 4712-4768, `initIncomeTypeReorder()` 4598-4643, no `ArrowUp`/`ArrowDown`/`data-up`/`data-down` anywhere in the file).

**The architect deferred this in round 4** on the grounds that it is Low, it is the largest remaining item, and it is not a blocked *creation* flow — categories are fully usable in any order; only rearranging them is unreachable. The trigger is: a behavioural change to either reorder path, or evidence of a real keyboard or switch user blocked by it.

**Is there new evidence?** Partially, and it is worth the architect's attention: UI-07 states that `categoryColor()` assigns Analytics chart colours **by array index**, so category order sets the chart palette and not merely the dropdown order. That is a functional consequence beyond ordering, and it is not addressed in the round-4 deferral reasoning. It is also not the evidence the trigger names — no real blocked user is presented, and no behavioural change to either reorder path has occurred. The trigger has not fired on its own terms.

### C12 — UI-10 against the rejected WORK-58

**UI Review** re-raises defaulting an unset theme to dark when the OS prefers dark, at Low, S effort.

**The architect rejected WORK-58 outright** in round 4: a preference, not a defect; its impact claim was speculation; its premise (that a user must discover the unlabelled palette glyph) had already been falsified by WORK-25's labelled Appearance card; and it makes first-run behaviour vary by device, which makes every future first-run report ambiguous forever.

**Is there new evidence?** **No.** UI-10's impact paragraph now says the user must find the palette glyph "or Settings → Appearance" — it has absorbed the correction the architect made and left the argument otherwise unchanged. No new fact, no measurement, nothing fails. This is the same item at the same severity for the same reason.

### C13 — UI-11 against the rejected WORK-65/WORK-66 sweeps and the WORK-28 convention

**UI Review** reports 72 hardcoded `font-size` declarations across 13 values, 9 literal radius values, ~69 off-scale spacing declarations, and seven card padding variants, at Low, M effort, recommending a snap-in-place pass.

**The architect rejected both sweeps** in round 4 — bound by the WORK-28 convention and the no-large-mechanical-sweep rule, on a file with no test harness under it, for Low severity and zero removed risk. WORK-65/66 were approved only as token additions with their canonical uses switched.

**Is there new evidence?** **Not for the sweep.** The font-size count is unchanged at 72, and the finding again concedes "no single value is wrong". But one half of UI-11 is a different class from the sweep and I want the architect to rule on it separately rather than have it rejected by association: the comment at line 82 states "3 values only" when `--r-bar` made it four, and the comment at line 76 states "use ONLY these values" against ~69 declarations that do not. Those are false claims recorded in the file, which is the exact class the architect approved WORK-61 to fix in `check-escaping.mjs` at XS. Whether the stale-comment half is separable from the rejected sweep is the architect's call, not mine.

### C14 — UI-09 against Code Review's closed-class finding and ruling V5

**UI Review (UI-09, Low)** reports that the two reorder handlers at `expense-pwa/index.html:4636` and `:4760` discard `save()`'s result and fire no `savedToast`, and recommends `const ok = save(); renderSettings(); savedToast(ok, 'Order saved');` in both. Its impact argument is that category order determines the Analytics palette, so a failed reorder write produces a colour change that silently does not survive a restart.

**Code Review** states the opposite conclusion about the same two sites: "every one of the 33 `save()` sites now either captures its result or is on the allow-list with a reason," and lists the save-outcome class as closed under re-inspection.

**I verified the artifact rather than either report.** `D:\3_Claude\PowerApps\tools\check-saves.mjs:55-62` carries both sites on the allow-list with the reason *"Reorder drag. The new order is already on screen; a toast per drop would be noise. Ruled acceptable in round 3 (WORK-38 narrowing)."* Ruling V5 is explicit on the point: *"I am explicitly not requiring that every `save()` be followed by `savedToast`. That would be a rule about outcome messaging masquerading as a rule about writes, and it would put a toast on the reorder drag."*

So UI-09 is a direct request to reverse a standing ruling and remove two allow-list entries. It does carry one fact the allow-list reason does not answer: the allow-list justifies silence on the grounds that "the new order is already on screen," and the palette consequence is precisely a case where what is on screen after a failed write is not what will be there after a reload. That is the architect's to weigh. **The finding is not dropped** — it is WORK-87, P3, held for ruling.

### C15 — UI Review records `reportFatal()` as a strength; Code Review records the same lines as this round's biggest risk

**UI Review** lists `expense-pwa/index.html:7294-7296` under Strengths: "the data-error banner now rewrites all three of its claims so `reportFatal()` no longer says data could not be read when it was read fine."

**Code Review (CODE-01, Medium)** raises the same lines as the single biggest risk in the build: the rewrite is unconditional, there is no check on `dataWasCorrupt`, and on a boot where the store genuinely failed to parse a later runtime error replaces a true message with a false one and hides `#dataErrorDownload` — the only route back to the quarantined copy.

These are not symmetric and I am not treating them as an even split: UI Review assessed the non-corrupt path, where the round-4 fix is correct and its praise is accurate; Code Review assessed the corrupt path, which UI Review did not exercise. Both statements can be true of the same five lines. I record it because two reports made opposing assessments of one artifact and the Chief Architect should see that, not because there is doubt about the finding. **WORK-71 stands at Medium as Code Review set it and is first in Sprint 1.**

## Estimated Effort

| Band | Items | Breakdown | Implementation |
|---|---|---|---|
| P0 | 0 | — | — |
| P1 | 0 | — | — |
| P2 | 7 | XS ×6, S ×1 | ≈ **0.75–1 day** |
| P3 | 19 | XS ×13, S ×4, M ×2 | ≈ **2.4 days** excluding the two blocked M items; ≈ **4.5–6.5 days** including them |
| **Total** | **26** | XS ×19, S ×5, M ×2 | ≈ **3.2 days** unblocked; ≈ **5.5–7.5 days** if every conflict item is reinstated |

Excluding the three architect-blocked items (WORK-87, WORK-88, WORK-89) and the deferred WORK-85, the executable roadmap is **23 items at roughly 3.2 engineering days**, plus the contrast re-derivation pass and V1's write flows. That is the smallest roadmap this project has produced.

## Recommendations

**One minute, five things.**

**First: this is the round to consider whether a gate is still the right instrument.** Round 4's gate existed because three defects were fresh damage from the batch that claimed to close their class. That test still catches something this round — WORK-71 is a regression created by WORK-48, and WORK-86 is a regression created by WORK-59 — but it catches two XS items, not eleven, and neither reports a wrong figure or loses data. If you open gate R5, my recommendation is **WORK-71 alone**, at XS: it is the only finding in either report where the app makes a false statement to a user about their financial data, and it does so in the one screen state the entire storage design exists to survive. WORK-86 does not belong in a gate; it belongs in Sprint 2 with a note that it is the second consecutive regression introduced by an accessibility fix.

**Second: the pair table is now the contract, and three of four Mediums are gaps in it.** `check-contrast.mjs` is working exactly as designed — UI Review says so directly, and Code Review calls it the clearest example in the codebase of a class genuinely closed rather than asserted closed. But a hand-maintained table of pairs is still a hand-maintained list, and this round found four painted surfaces that carry text and are not in it. The mechanism is right; the coverage question has simply moved. Worth a rule alongside your seventeenth-theme rule: **a CSS rule that paints a fill under text adds a pair-table row in the same commit.**

**Third: two predicates now describe themselves inaccurately** (WORK-78, WORK-79). Your own durable finding from round 4 was that this project's failure mode is a true-sounding claim nobody re-derives, and that the fix was to move claims out of comments and into tools. Code Review's point is that the claim has moved into the tools' *headers* — `check-saves.mjs` carries "a new unreported write fails on the first run. That is the only property that matters" above a regex that misses `if (ok) save()` and `forEach(() => save())`. Both are XS and both are in Sprint 1 ahead of everything else.

**Fourth: three findings ask you to reverse three round-4 rulings, and only one of them brings anything new.** UI-10 brings nothing (C12). UI-11 brings nothing for the sweep, but the two stale scale comments inside it are arguably WORK-61's class rather than WORK-65/66's, and that is worth thirty seconds of your time (C13). UI-07's palette-by-index consequence is the one genuinely new fact (C11), and it still does not fire the trigger you set. UI-09 is the interesting one — it asks to remove two entries from an allow-list you personally authorised, with an argument the allow-list's own reason does not answer (C14).

**Fifth, and the reason I would not spend the last ten seconds on any single finding: the counting problem you named in round 4 is measurably better.** Code Review re-walked 33 save sites, five gate classes and every escaping skip mechanically. UI Review's four Mediums are gaps in a table, not unverified assertions. The two false-claim artifacts found this round are a stylesheet comment saying "three places" when there are four, and a tool header narrower than its regex — both of which were found by someone re-deriving rather than reading. That is the process working. The remaining ~3.2 days of work is the smallest and least risky roadmap this project has had, and none of it needs a rewrite, a dependency, or a change to the single-file constraint.
