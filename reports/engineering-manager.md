# Prioritized Work Plan — Core Tab Screen Redesign

Sources (read unmodified):
- `D:\3_Claude\PowerApps\reports\ui-review.md` — 15 findings, 84/100
- `D:\3_Claude\PowerApps\reports\code-review.md` — 9 findings, 88/100
- Conventions applied: `D:\3_Claude\PowerApps\knowledge\review-conventions.md`

All 24 source findings are accounted for across 18 `WORK-` items. No severity was altered.

## Project Health

Two independent reviews landed at 84 and 88, both inside the 75-89 "Solid" band, and neither raised a Critical or a High finding across 24 items — the money path, the store, the migrations and the offline path are untouched, and the harness is green at all four commits on `redesign-core-screens` with contrast holding at 480 pairs, worst 4.52:1. Nothing here blocks release on severity: there is no P0 and no P1 work. What holds the branch below 90 is six Medium findings, five of them on the Dashboard — the home screen currently has no heading below `<h1>`, two of three charts render untitled, the legend can scroll the page sideways, and the app's most-used field looks pre-filled. Every one of those six is XS or S, which is why this is a one-sprint gap rather than a rework.

## Priority Matrix

| Item ID | Title | Source IDs | Severity (as filed) | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Restore a heading per Dashboard chart pane and settle the trend range-label wording | UI-01, CODE-02 | Medium (UI-01), Low (CODE-02) | P2 | S | — |
| WORK-02 | Reword the middle chart tab once, resolving both the vocabulary collision and the wrap | UI-02, UI-08 | Medium (UI-02), Low (UI-08) | P2 | XS | WORK-01 |
| WORK-03 | Drop the bold weight from the lead Amount placeholder | UI-03 | Medium | P2 | XS | — |
| WORK-04 | Link the segmented controls to the regions they swap (`aria-controls`, `role="region"`) | UI-04 | Medium | P2 | S | — |
| WORK-05 | Stop the donut legend overflowing its card below ~430px | UI-05 | Medium | P2 | XS | — |
| WORK-06 | Mark the required add-form fields (`aria-required` + `.required-mark`) | UI-13, CODE-01 | Low (UI-13) / Medium (CODE-01) — disputed, see C1 | P2 | XS | Band confirmation from C1 |
| WORK-07 | Make the written record match the code: four stale claims and one stale citation | CODE-05(a,b,c), CODE-08, UI-09 (comment half), UI-12 (comment half) | Low | P3 | XS | — |
| WORK-08 | Icon consolidation: shared `<symbol>` defs plus the two highest-traffic remaining emoji sets | CODE-07, UI-09 | Low | P3 | S | WORK-07 |
| WORK-09 | Verify the range-preset select's affordance on iOS Safari and add a chevron if none is drawn | UI-12 | Low | P3 | S | Device evidence (cannot start from source) |
| WORK-10 | Extract `selectSegment()` and retire the four hand-rolled copies | CODE-04 | Low | P3 | S | WORK-04 |
| WORK-11 | Delete the dead CSS and bring the reopened `.cal-nav` block onto the token scale | CODE-03, UI-11 | Low | P3 | XS | — |
| WORK-12 | Pick one "one card, divided" treatment for `.kpi-strip` and `.stat-strip` | UI-07 | Low | P3 | XS | C2 ruling |
| WORK-13 | Break or document the `.stat-tile` divider coupling to the renderer's tile count | CODE-06 | Low | P3 | XS | WORK-12, C2 ruling |
| WORK-14 | Give the advisor severity badge a non-colour cue and an accessible name | UI-06 | Low | P3 | XS | — |
| WORK-15 | Move `.more-fields` above `#expRecWrap` on the Planned expense form | UI-14 | Low | P3 | XS | — |
| WORK-16 | Persist the selected Dashboard chart pane across relaunch | UI-15 | Low | P3 | XS | — |
| WORK-17 | Add the three KPI icon-tint pairs to `check-contrast.mjs` | UI-10 | Low | P3 | XS | — |
| WORK-18 | Record the deployed cache string and date in `reports/HANDOFF.md` at deploy time | CODE-09 | Low | P3 | XS | Next deploy event |

Files in play: `D:\3_Claude\PowerApps\expense-pwa\index.html` (WORK-01 through WORK-08, WORK-10 through WORK-16), `D:\3_Claude\PowerApps\tools\check-contrast.mjs` (WORK-17), `D:\3_Claude\PowerApps\tools\harness\perf.js` (WORK-07), `D:\3_Claude\PowerApps\reports\HANDOFF.md` (WORK-18).

## Quick Wins

Every Medium in this cycle is XS or S. That is unusual and it should be spent immediately.

- **WORK-05** — one `flex-wrap: wrap` removes a stated `ui-guidelines.md` violation ("No horizontal scrolling") from the home screen.
- **WORK-03** — one `::placeholder` declaration on a class only two fields carry; stops the most-used field in the app reading as pre-filled.
- **WORK-01** — one `<h3>` per pane; only one pane is ever in flow, so the old three-heading stack does not return. Restores heading navigation to the home screen.
- **WORK-06** — four attributes and four spans, no handler change. Qualifies as a quick win on CODE-01's Medium; UI-13 filed the same gap as Low.
- **WORK-02** — one label reword, no structural change, once WORK-01 has fixed the pane names.
- **WORK-04** — S only because it touches three controls; the attributes themselves are mechanical.

## Sprint Plan

**Sprint 1 — close the Dashboard Mediums before the branch merges.**

Items: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07.

Effort: 2×S + 5×XS — roughly 1.5 to 2 days including a full harness re-run (`verify`, `v1`, `boot`, `recurrence`, `debts`, `pva`, `rows`) and a contrast re-run.

Delivers: the Dashboard regains headings and a title on every chart; the home screen stops scrolling sideways at phone widths; the segmented controls stop meaning two different things across three adjacent screens and announce what they control; the two highest-traffic write forms announce their required fields; and the four false claims the change introduced into the file's design record are corrected before they merge into `main` and get read as settled.

Deliberately excluded: WORK-08, WORK-09 and WORK-10 are each S and each carries a dependency or an unresolved input. Adding them would make this a two-week sprint described as one.

## Roadmap

- **Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07
- **Sprint 2:** WORK-10, WORK-11, WORK-12, WORK-13, WORK-15, WORK-16
- **Sprint 3:** WORK-08, WORK-09, WORK-14, WORK-17
- **Later:** WORK-18 (bound to the next deploy, not to a sprint)

On the two pre-existing defects the UI reviewer pulled into scope, plainly:

- **UI-05 (WORK-05) belongs in this cycle.** It is Medium, it is one declaration, and the redesign made the donut the Dashboard's default view — the redesign raised its exposure even though it did not cause it. Sprint 1.
- **UI-06 (WORK-14) belongs in a later cycle.** It is Low, the redesign changed the card's frame and not the badge, and the information is recoverable one scroll down through border tint, emoji and wording. It stays in the roadmap at Sprint 3. It is deprioritized, not dropped.

## Dependencies

- **WORK-01 → WORK-02.** The `<h3>` restores the full pane names ("Planned vs Actual", "Monthly Trend"). The tab label must be chosen knowing what the heading above it now says, otherwise the reword is done twice. UI-02 wants the label changed to break a vocabulary collision and UI-08 wants it shortened to stop wrapping at 320px — one edit, decided once, satisfies both.
- **CODE-02 is folded inside WORK-01, and one fix does not subsume the other.** UI-01's heading restores the antecedent the parenthetical lost, but `.chart-sub` is still a standalone `<div>`, so `(all time)` remains a parenthetical with nothing to be parenthetical to. Restoring the heading without dropping the parentheses leaves the Trend pane reading "Monthly Trend" followed by a bracketed fragment. Both edits, same commit.
- **WORK-04 → WORK-10.** Add the `aria-controls`/`role="region"` wiring first, then extract `selectSegment()` across all four call sites so the helper encodes the final invariant rather than an intermediate one. Extracting first means editing the helper's contract twice.
- **WORK-07 → WORK-08.** WORK-07 narrows the icon comment to what was actually done. WORK-08 then changes what was actually done, so it must re-read and re-settle the line WORK-07 wrote. This ordering is still correct: a false claim of completeness should not sit in `main` for two sprints waiting on a structural fix.
- **C2 ruling → WORK-12 → WORK-13.** Both items edit the same divider rules. The mechanism must be chosen once, before either is implemented, or WORK-13's coupling comment is written against a mechanism WORK-12 then replaces.
- **WORK-09 is blocked on evidence, not on other work.** The UI reviewer states explicitly that the iOS affordance question cannot be settled from source and needs a device check at 390px. It cannot be estimated below S until someone looks.
- **WORK-18 is bound to a deploy event**, not to a sprint. The finding is that the rule has no observable state; the fix only exists at the moment of the next publish.

Branch note: `redesign-core-screens` is four commits and unmerged. Sprint 1 should land on that branch rather than as follow-ups on `main` — the Mediums are in the markup these four commits authored, and fixing them in place keeps the branch's own review true. `sw.js` is already at v15 in this branch; per CODE-09 nobody can establish from the repository whether v15 has been published, so no further bump should be made in Sprint 1 without answering that question first.

## Conflicts

**C1 — Severity and scope of the required-field gap (UI-13 vs CODE-01).**

- *UI Review (UI-13) says Low.* It frames the gap as consistency and polish: the two Amount fields are the only required fields in the app carrying no marker, while `#sHourly`, `#goalName`, `#goalTarget`, `#debtName`, `#debtPrincipal` and `#debtTotal` all do. Scope: two fields — `#incAmount` (2638) and `#expAmount` (2715).
- *Code Review (CODE-01) says Medium.* It frames the gap as a documented convention unmet on the app's two highest-traffic write paths: a screen-reader user is not told the fields are required until after pressing Add and a toast fires, and the convention block exists because this class of defect already shipped for five rounds. Scope: four fields — adding `#incType` (2641) and `#expCategory` (2718), on the grounds that `incAdd` returns early on `if (!typeId)` (5895) and `expAdd` on `if (!categoryId)` (6353), so all four satisfy the file's stated "if and only if" test at 2198-2211.

I have not resolved this. WORK-06 is planned at the four-field superset, because implementing only two fields would silently drop half of CODE-01, and the two extra attributes cost nothing. The priority band is the open question: at CODE-01's Medium it is P2 and belongs in Sprint 1 as written; at UI-13's Low it is P3 and would move to Sprint 2. It is scheduled in Sprint 1 pending the ruling, since deferring an XS item to protect a band is not a saving.

**C2 — Which divider mechanism the two consolidated cards should share (UI-07 vs CODE-06).** Both filed Low; this is a disagreement of recommendation, not of severity, and neither reviewer saw the other's.

- *UI-07 recommends the inset form* — padding on the card, divider on the row, as `.kpi-strip` does — explicitly "because it does not depend on `overflow: hidden` to clip corners", and would converge `.stat-strip` onto it.
- *CODE-06's alternative fix* goes the other way for `.stat-strip`: `gap: 1px` with `background: var(--border)` on the strip and `var(--surface)` on the tile, which gives count-agnostic dividers and relies on the existing `overflow: hidden` for the edges. That removes the `:nth-child` coupling to the renderer's tile count that UI-07's inset form would preserve.

The trade is real: UI-07 buys visual consistency and drops an `overflow: hidden` dependency; CODE-06's alternative buys immunity to a fifth stat tile being added later. CODE-06's own minimal fix — one comment naming the coupling — is compatible with either. This needs one decision before WORK-12 and WORK-13 are worked.

**Not a conflict, recorded for completeness:** UI-09 and CODE-07 both address icon duplication and do not disagree. UI-09 rules out a sweep and offers "narrow the comment, or take two scoped sets"; CODE-07 proposes a targeted `<symbol>` block and independently rules out a file-wide sweep. WORK-07 and WORK-08 take both halves in that order.

**Unresolvable from either report:** UI-12's iOS affordance risk. No `appearance` is declared for `select` anywhere in the file, so whether the primary filter on all four core screens looks operable depends on what the UA draws. The UI reviewer says outright this needs a device check; the Code reviewer only reached the comment-accuracy half (CODE-05c). WORK-09 carries it as an open question, not a conclusion.

## Estimated Effort

| Band | Items | Effort | Rough total |
|---|---|---|---|
| P0 | none | — | 0 |
| P1 | none | — | 0 |
| P2 | 6 (WORK-01 … WORK-06) | 2×S, 4×XS | ~1 to 1.5 days |
| P3 | 12 (WORK-07 … WORK-18) | 3×S, 9×XS | ~2 to 2.5 days |
| **Total** | **18** | **5×S, 13×XS** | **~3.5 to 4 days** plus verification |

No item is M, L or XL. Nothing in this cycle needs a design decision except C2, and that decision is smaller than the work it gates.

## Recommendations

If I had one minute with the Chief Architect:

1. **Nothing blocks the merge on severity, and something blocks it on judgement.** Zero Critical, zero High, both scores in the same band, harness green at every commit. But five of the six Mediums are on the home screen of a personal finance app, and the entire Medium set is 1 to 1.5 days. Land Sprint 1 on `redesign-core-screens` before merging rather than merging and carrying six Mediums into `main` as follow-ups.
2. **Rule on C1 first — it is the only ruling that moves a sprint.** I have scheduled WORK-06 at CODE-01's four-field scope in Sprint 1. If you agree with UI-13's Low, tell me and it moves to Sprint 2; if you agree with CODE-01's Medium, it stays and the plan is unchanged. Either way the four-field scope should stand, because the two extra attributes are free and halving the scope would drop half a finding.
3. **Rule on C2 before Sprint 2 starts.** It gates two items and costs one sentence. The question is only whether `.stat-strip` converges on `.kpi-strip`'s inset dividers (UI-07) or on count-agnostic gap dividers (CODE-06's alternative). Do not let both be implemented against different assumptions.
4. **Both reports independently flagged the same failure mode, and it is the one worth a standing rule.** The change introduced four claims that assert more than the code delivers — an "only inconsistency" that is not only, an edit-modal context the class never enters, a select that sizes to its widest option rather than its text, and a line-numbered cross-file pointer that moved. This file's comments are its design record and there is no mechanism keeping them true. WORK-07 fixes these four; the pattern is that claims shaped "the only X" and "index.html:NNNN" decay, and rules stated without a tally and references stated by function name do not. That is worth writing into `knowledge/coding-standards.md` rather than re-finding next round.
5. **Get someone on an iPhone for five minutes.** WORK-09 is the only item in this plan that no amount of reading can close, and if the answer is bad it affects the first control on all four core screens.
