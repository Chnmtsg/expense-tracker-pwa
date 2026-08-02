# Engineering Manager — Work Plan (Round 6)

Sources read in full and unmodified: `D:\3_Claude\PowerApps\reports\ui-review.md` (9 findings, 87/100), `D:\3_Claude\PowerApps\reports\code-review.md` (11 findings, 90/100). Governing documents read: `D:\3_Claude\PowerApps\knowledge\review-conventions.md`, `D:\3_Claude\PowerApps\knowledge\project.md`, `D:\3_Claude\PowerApps\reports\chief-architect.md` (round-5 standing decision). Both reports present and complete. Numbering continues from WORK-92.

20 findings in, 18 `WORK-` items out. Two merges, both of them independent corroboration rather than duplication.

## Project Health

Two independent reviewers, neither seeing the other's report, both returned no Critical and no High — 87/100 and 90/100, the second consecutive round in that shape. On severity alone the build is releasable. What neither score captures on its own is the pattern both reports converge on from opposite directions: five items from the approved round-5 batch are alleged not to be on disk in the state the batch reported (WORK-84(b) never made, WORK-91's icons shipped broken, WORK-70's census returned, WORK-83's comment carrying a fresh false figure, WORK-82 opening a new unrecoverable state), and CODE-03 alleges the command that would have caught a boot failure — `npm run v1` — exits 0 by construction. If CODE-03 holds, the green verification line that accompanied that batch is not evidence, and the round-5 gate closed on a condition that was never exercised. That is the readiness question this round, and it is a verification question, not a defect count.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-98 | `npm run v1` cannot fail; gate R5's stated condition has no re-runnable check | CODE-03 | Medium | P2 | XS | — |
| WORK-99 | Global error handler registered after ~5,190 lines of top-level statements | CODE-04 | Medium | P2 | XS | WORK-98 (for verification, not for the edit) |
| WORK-93 | Two of three shipped PNG icons render as a blank tile; apple-touch-icon exported from the maskable source | UI-01 | Medium | P2 | XS | — |
| WORK-94 | Emptying the quick-amount editor deletes the feature with no way back | UI-02 | Medium | P2 | XS | — |
| WORK-96 | `.kpi .value` is the one headline-figure class with no wrap guard; `.grid-2` overflows | UI-04 | Medium | P2 | XS | — |
| WORK-100 | `.hero-kpi::before` paints above the scrim and above the hero text; the pair table measures a surface that is not painted | UI-05 + CODE-02 | Low (UI-05) / Medium (CODE-02) | P2 | S | — (co-edit WORK-105) |
| WORK-97 | Calendar padding comment records a width it does not produce; 44px minimum still missed at 360/375px | CODE-01 | Medium | P2 | S | Geometry half blocked on an architect ruling |
| WORK-95 | Analytics calendar heatmap ignores the screen's own date-range filter | UI-03 | Medium | P2 | S | — |
| WORK-101 | The button rule's census returns eighteen lines below the comment that forbids censuses | UI-06 + CODE-05 | Low | P3 | XS | — |
| WORK-102 | Seven salary fields silently clamp a negative entry to zero and say nothing | UI-07 | Low | P3 | S | — |
| WORK-105 | Three exact-duplicate rows in the contrast pair table; printed count overstates distinct coverage | CODE-06 | Low | P3 | XS | Rides with WORK-100 |
| WORK-107 | `getComputedStyle` called once per calendar cell inside the render loop | CODE-08 | Low | P3 | XS | Co-edit WORK-95 (same function) |
| WORK-108 | Fatal-error latch never reset; the restore path hides the banner it raised | CODE-09 | Low | P3 | XS | Confirm against ruling C5 |
| WORK-110 | Two dead declarations (`.salary-summary` background, `computeNextRecurring()`'s `base`) | CODE-11 | Low | P3 | XS | — |
| WORK-103 | Category names may duplicate exactly; income types may not | UI-08 | Low | P3 | XS | — |
| WORK-106 | `check-escaping.mjs`'s skip rule states a reason that is false at a live site | CODE-07 | Low | P3 | XS | After WORK-94 (same region) |
| WORK-109 | `VERIFICATION.md` §1's line-number inventory is stale at every row | CODE-10 | Low | P3 | XS | Last in its sprint |
| WORK-104 | The app's entire explanatory layer is set at its smallest size (`.helper` 11px) | UI-09 | Low | P3 | XS | Architect ruling — see C20 |

No P0 and no P1: neither reviewer raised a Critical or a High, and there is no P0/P1 work for a dependency to block. WORK-98 is the item I would most like to call P1; the priority table does not permit it, so it is P2 scheduled first, and I flag it to the architect as gate-worthy under Recommendations.

**Where both reviewers independently reached the same finding, treat it as stronger evidence.** WORK-100 (UI-05 + CODE-02) and WORK-101 (UI-06 + CODE-05) were each derived twice, from different directions, by reviewers who did not see each other's work. UI-05 reached the hero disc through painting order and the Slate ratio; CODE-02 reached it through the pair table's blind spot and counted twelve of sixteen themes falling below 4.5:1. Neither is a re-reading of the other. Corroborated findings should not be discounted as "only one of them called it Medium."

## Quick Wins

Every Medium in both reports is XS or S. That is unusual and it is worth stating plainly: the entire Medium band of this round is roughly two engineering days, and none of it needs a design decision except WORK-97's geometry half.

- **WORK-98** — two lines in `run.mjs` turn a command that always reports success into one that can fail. Every other claim in this report is checked by a human until this lands.
- **WORK-99** — moving three declarations up ~5,000 lines gives the boot-crash class its first real net, and gives WORK-98's new probe walk something to catch.
- **WORK-93** — re-export two PNGs and open them. The app's home-screen identity on the platform it names in its own advice is currently a blank white square.
- **WORK-94** — two expressions remove a state a user can reach from the editor and cannot leave without Reset All.
- **WORK-96** — one `overflow-wrap` declaration brings the last of five headline-figure classes into line and removes a horizontal-scroll path on 320–375px phones.
- **WORK-100** — the approved shape is one background layer and one deleted rule. It closes the last painted surface carrying text that neither the table nor the code owns.
- **WORK-97 (comment half only)** — XS, and it stops a false pixel figure propagating into a third round. The geometry half is not a quick win; it is a decision.

## Sprint Plan

**Sprint 1 — "the green line means something again."**

| Item | Effort |
|---|---|
| WORK-98 | XS |
| WORK-99 | XS |
| WORK-93 | XS |
| WORK-94 | XS |
| WORK-96 | XS |
| WORK-100 (with WORK-105 riding in the same file) | S + XS |
| WORK-97(a) — the comment only | XS |

**Total: 7 XS + 1 S ≈ 8 hours, one engineering day.**

What the sprint delivers: `npm run v1` becomes capable of failing and gains the corrupted-store-then-throw walk that gate R5's own closing condition names, with `reportFatal()` moved early enough for that walk to catch anything; the installed app stops presenting itself as a blank tile on iOS and in Android launchers; the quick-amount row stops being a control that using it can destroy; the Salary Calculator stops pushing the page into horizontal scroll on an iPhone SE; the hero card's painted surface and the surface `check-contrast.mjs` measures become the same surface, with the pair table's own summary line made honest in the same pass; and the calendar comment stops asserting a width the file does not produce.

I am deliberately leaving WORK-95 and WORK-97's geometry half out. WORK-95 is a behavioural change to a filter interaction that must not break the ◀/▶ month arrows, and it deserves a sprint where it is not the eighth item. WORK-97(b) cannot start until someone rules on whether 41.4px is accepted with a recorded reason or the card's horizontal padding goes to zero.

## Roadmap

**Sprint 1** — WORK-98, WORK-99, WORK-93, WORK-94, WORK-96, WORK-100, WORK-105, WORK-97(a).

**Sprint 2** — WORK-95, WORK-107, WORK-97(b), WORK-101, WORK-102, WORK-108, WORK-110.

**Sprint 3** — WORK-103, WORK-106, WORK-104, WORK-109.

**Later** — carried standing deferrals, unchanged and not re-raised by either reviewer this round: WORK-85, WORK-35, WORK-16 / WORK-49, WORK-15, WORK-17 (IndexedDB half), WORK-23 (screen half), WORK-30, WORK-31, Stage 2. Code Review explicitly declined to re-raise WORK-16/49 and presented no new evidence; the `analyzeExpenses()` size and the per-consumer read-model duplication remain recorded risks rather than scheduled items.

Nothing from this round is dropped. Every one of the 20 findings appears above.

## Dependencies

- **WORK-98 before WORK-99's verification.** The edits are independent — WORK-99 is a code move, WORK-98 is a harness change — but Code Review's recommendation pairs them for a reason: WORK-98 adds a probe walk that deliberately corrupts the store and raises a runtime error, and WORK-99 is what makes the handler exist when that walk runs. Land WORK-98 first so the walk can fail, then WORK-99, then re-run and confirm the walk turns red if either is reverted.
- **WORK-98 before every "it landed" claim in this roadmap.** Until `npm run v1` can return non-zero, no statement of the form "the write flows are clean" is a property a command enforces. This is the whole of CODE-03's argument and it applies to Sprint 1's own closing evidence.
- **WORK-105 rides with WORK-100.** Both edit `tools/check-contrast.mjs`; WORK-100 requires a re-run of that tool afterwards, and WORK-105 changes the summary line that re-run prints. Doing them apart means measuring the sixteen theme grounds twice.
- **WORK-97(b) is blocked on a ruling, not on code.** Both honest options — accept 41.4px with a recorded reason, or drop the card's horizontal padding to zero for this card only — are decisions about a hard minimum in `ui-guidelines.md`. WORK-97(a), the comment correction, has no such block and should not wait for it.
- **WORK-107 with WORK-95.** Both edit `renderCalendar()`. WORK-95 changes when it runs; WORK-107 hoists a line out of its loop. One pass over the function.
- **WORK-106 after WORK-94.** WORK-106 corrects a comment in `check-escaping.mjs` that cites `index.html:7061` — the quick-amount interpolation WORK-94 rewrites. Correcting the comment first means correcting it against code that is about to change.
- **WORK-109 last in its sprint.** `VERIFICATION.md` §1 records positions; every item that edits `index.html` moves them. Its recommendation is to replace line numbers with enclosing function names, which is stable — but the replacement should be written against the final state, exactly as WORK-79 was sequenced last round.
- **WORK-108 touches ruling C5's territory.** No code dependency, but it edits the `#dataErrorBanner` lifecycle, which C5 governs in its final form. Code Review's argument that resetting `fatalReported` in `load()` keeps C5 intact needs confirming before the edit, not after.

## Conflicts

### Reviewer against reviewer

**C16 — `.hero-kpi::before`: same defect, two severities and two fix shapes.**
UI-05 sets it at **Low**: it affects one corner of one card, at longer values, and was Low last round for the same reason. CODE-02 sets it at **Medium**: twelve of sixteen themes fall from ~4.5:1 to ~4.0:1 on the headline figure and the only sentence saying whether the user is over or under budget, while `check-contrast.mjs` reports the row as passing. Neither reviewer saw the other's number; both arrived at the same physical fact (a positioned pseudo-element with `z-index: auto` painting above in-flow text) and the same Slate figures (4.54 → 3.99). I have not changed either severity. I prioritised on the higher, P2.
The fix shapes also differ. UI-05 asks for the shape the architect already approved as WORK-84(b): move the highlight into `.hero-kpi`'s background list as a third layer *below* the scrim and delete the `::before` rule, which removes the surface from the contrast question entirely. CODE-02 names `.hero-kpi &gt; * { position: relative; z-index: 1; }` as the smallest safe fix — the `.cal-cell &gt; *` pattern already 650 lines away in the file — and offers the background move or deletion as alternatives. These are not equivalent: the `z-index` route stops the disc painting over glyphs but leaves it lifting the ground above the scrim the alphas were derived against, so the pair table still measures a stack that is not painted. The architect approved the background-layer shape; I am recording the divergence rather than resolving it.

**C17 — Is the calendar cell a 44px touch target?**
UI Review lists calendar geometry under Clean Areas: *"every interactive class I checked declares 44px … The calendar cell and icon-grid geometry fixes from WORK-83 are both present (`:1521`, `:1412`)."* CODE-01 says the cell is 44px tall and **41.4px wide** at 360px and 43.6px at 375px, below `ui-guidelines.md:65`'s hard minimum on the two most common small phone widths, and that the comment recording "44.6px at 360px" is arithmetically false against the same comment's own confirmed model. Both may be describing different things — presence of the declared change versus the width it produces — but they read as opposite conclusions about the same element, and only one report treats the minimum as still missed. This decides whether WORK-97 is a comment fix or a comment fix plus a geometry decision.

### Finding against standing ruling

**C18 — CODE-03 against gate R5's closing condition.**
The round-5 decision closed gate R5 on: *"the item landed; V1's write flows executed with a clean console, including a deliberately corrupted store followed by a thrown runtime error, which is the flow that produced the defect; `npm run verify` returns zero across all four tools."* CODE-03 states that `tools/harness/run.mjs:112` is `process.exit(parsed &amp;&amp; parsed.ERROR ? 1 : 0)`, that `ERROR` is set only by the probe's outer catch, that flow exceptions are written into `t.flows` as strings and console errors counted into `t.H_total_console_errors` with neither affecting the exit code, and that `v1-write-flows.js` **never corrupts the store and never raises a runtime error**. If that is right, the second clause of the gate condition was never exercised by any command, and gate R5's one item — `if (dataWasCorrupt) return;` at `index.html:7572` — has no assertion anywhere in `tools/`. `eslint.config.mjs:70-72` explicitly delegates boot-crash detection to V1. UI Review makes no claim in this area. This is the architect's call and only the architect's: whether gate R5 stands as closed, is retro-closed once WORK-98 lands and the walk runs red-then-green, or is reopened.

**C19 — Five approved round-5 items against the record of the round-5 batch.**
Not a disagreement between reviewers; a disagreement between both reviewers and the recorded state of the last batch. UI-05 and CODE-02 independently find WORK-84(b) — approved as its own commit with its own visual check — unmade on disk, with the `::before` rule unchanged and no pair-table row covering it. UI-01 finds WORK-91's shipped assets rendering as blank tiles against one correct control. UI-06 and CODE-05 independently find WORK-70's census returned eighteen lines below the comment written to forbid it. CODE-01 finds WORK-83's corrected comment carrying a new false figure — the fourth and fifth instance of the class in two rounds, each introduced by the fix for the previous instance. UI-02 finds WORK-82's `.filter(v =&gt; v &gt; 0)` opened a permanently unrecoverable state. I am not scoring the batch; I am recording that two reviewers who could not confer both concluded that "rounds 4 and 5 fully implemented" does not survive re-derivation, and that this is the same evidence class the architect named as the project's real defect.

**C20 — UI-09 against the standing rejection of WORK-89's sweep half.**
UI-09 proposes `.helper` move from a literal `11px` to `var(--t-sm)` (13px), on the ground that `project.md` targets people with little accounting knowledge and the app's entire multi-sentence explanatory layer — including the non-reversible force-clear warning and the iOS storage-eviction warning — is set at the bottom of the type scale, a floor established for one- and two-word tab labels. The standing ruling rejected the mechanical sweep of 72 font sizes twice, on the reasoning that "no individual value is wrong," and set the convention that off-scale values are replaced only in blocks another approved item is already opening. UI-09's position: this is one declaration, both the old and new values are on-scale, and the argument is about audience rather than scale conformance, so it is a new argument and not a re-raise. The counter-position available from the standing ruling: it is a typographic change that visually alters twenty blocks of copy in a file with no test harness under it, which is the shape the sweep rejection exists to prevent. Both positions stated; I do not pick.

**C21 — CODE-09 against ruling C5's final form.**
C5 in its final form: a path may reuse `#dataErrorBanner` only if it rewrites every claim the element renders *and* establishes it is not overwriting a more urgent true message. CODE-09 finds a residual path in the other direction — `#dataErrorImport` is inside the banner and is not hidden by `reportFatal()`, so from a "Something went wrong." banner the user can restore from file, and `load()` → `updateCorruptBanner()` then removes the banner while `fatalReported` stays `true`, leaving the session with no fatal indicator for any later error. Code Review's proposed fix is one line, `fatalReported = false` beside the other per-load resets, and argues C5 stays intact because `updateCorruptBanner()` already rewrites every claim the element renders. This is not a reviewer disagreement; it is an extension of C5 that only its author can confirm.

### Notes on standing constraints

- **The four-tool freeze.** WORK-98 modifies `tools/harness/run.mjs` and `tools/harness/v1-write-flows.js` — the pre-existing V1 harness — and adds no file. Code Review states this explicitly: *"This is an assertion inside an existing tool, not a fifth tool."* On my reading it is compliant with "new assertions go inside an existing tool," since the freeze names the four static checks behind `npm run verify`. I flag it rather than assume it.
- **WORK-109 is authorised in principle by the standing convention** that `VERIFICATION.md` records no counts and describes predicates rather than positions. CODE-10 applies that convention to §1, which WORK-79 did not open. It needs scheduling, not a new ruling.
- **CODE-08 / WORK-107 is explicitly not the deferred WORK-16/49 class** and does not touch it; Code Review says so and takes no measurement against the deferred trigger.
- **Stage 2's trigger did not fire.** Code Review states outright that no calculation defect was found in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`.

## Estimated Effort

| Band | Items | Composition | Estimate |
|---|---|---|---|
| P0 | none | — | 0 |
| P1 | none | — | 0 |
| P2 | 8 (WORK-93, 94, 95, 96, 97, 98, 99, 100) | 5 XS + 3 S | ~14.5 hours ≈ 2 engineering days |
| P3 | 10 (WORK-101, 102, 103, 104, 105, 106, 107, 108, 109, 110) | 9 XS + 1 S | ~8.5 hours ≈ 1 engineering day |
| **Total** | **18** | **14 XS + 4 S** | **~3 engineering days** |

Where the two reviewers estimated the same item differently, I took the larger: WORK-100 is S, not XS, because the smallest safe version includes a re-run of `check-contrast.mjs` and the visual check the architect attached to WORK-84(b). WORK-97 is S because the comment is XS and the geometry decision is not.

No item in this round is M, L or XL. No item requires a rewrite, a new dependency, a fifth tool, a new theme, or any change to the single-file constraint.

## Recommendations

**Land WORK-98 before anything else, and treat it as a candidate gate item.** The priority table cannot make a Medium a P1, so I have not — but if CODE-03 is right, this round's most important fact is not a defect at all: it is that the command underwriting the release discipline returns 0 whether or not all four write flows throw, and gate R5's own closing condition names a corrupted-store-then-throw walk the probe has never performed. Two lines in `run.mjs` and one block in `v1-write-flows.js` convert the round's central claim from something a human reads out of JSON into something a command enforces. Everything else in this roadmap is checked by a person until that lands. I would ask you to rule on C18 first and on everything else after.

**The second thing I would say is about the batch, not the items.** Five approved round-5 items are alleged to have landed differently from how they were recorded, and the two most specific allegations — WORK-84(b) unmade, WORK-70's census returned — were each reached twice by reviewers working in parallel who could not have copied one another. That is corroboration, and it points at the same place WORK-98 does: the difference between work reported complete and work demonstrably complete. The comment-borne measurement class is now on its fifth instance in two rounds, and each instance arrived inside the fix for the previous one. Code Review's diagnosis is worth more than any item below it — *a number in a comment has no owner; anything expressible as a derivation survives, anything expressible only as a result does not.* If you want one convention out of this round, that is the one.

**Third, the Medium band is cheap and it is entirely user-facing.** Two blank icons, a control a user can destroy by using it, a headline figure that pushes an iPhone SE into horizontal scroll, and an Analytics screen whose filter governs three of its four cards. Roughly two days, no decisions required except WORK-97's geometry. There is no reason for any of it to wait behind the P3 tail.

**Finally, C16 needs your severity note more than your fix note.** Two reviewers put the same hero-card defect at Low and Medium respectively, and the fix shapes they propose are not equivalent — the `z-index` route stops the disc painting over glyphs but leaves the pair table measuring a stack that is not painted, while the background-layer route you already approved removes the surface from the question. I have scheduled the higher priority and recorded both. Which shape lands determines whether the commit message *"every painted surface is in the table"* becomes true or becomes true-sounding.
