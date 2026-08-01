# Merged Execution Roadmap — Round 4

**Sources:** `D:\3_Claude\PowerApps\reports\ui-review.md` (16 findings, 73/100) and `D:\3_Claude\PowerApps\reports\code-review.md` (12 findings, 90/100). Both read in full. 28 findings merged into **26 `WORK-` items** — two merges (UI-14 + CODE-02, UI-05 + CODE-10), no splits, no finding dropped, no severity altered. Numbering continues at WORK-41; nothing from the round-3 roadmap is reused. Standing deferrals from `reports/chief-architect.md` (WORK-08, WORK-15, WORK-16, WORK-17 IndexedDB half, WORK-23 screen half, WORK-28 as convention, WORK-30, WORK-31, WORK-35) remain in force; two places where a report presents new evidence against one are flagged in Conflicts rather than reversed here.

I spot-checked the two overlap candidates against source: the double toast at `expense-pwa/index.html:4568` then `:4574` is real and unconditional, the category-delete handler at `:4692` is the same site both reviewers describe, and the shared button rule carries `width: 100%` at `:787`.

## Project Health

The two scores diverge by 17 points and both are defensible, because they measure different surfaces of the same build: Code Review found no Critical and no High and verified both round-3 Criticals closed against source (90/100, bottom of the production-ready band); UI Review found three High findings that live in normal use (73/100, usable but fragile). Nothing in either report blocks release on data correctness — no wrong figure, no data loss, no security hole, no unreachable module — so the round-3 gate work held. What did not hold is the edge of that work: the contrast pass fixed text-on-surface and never measured text-on-fill, this round's new Salary History button collapsed the primary Save action beside it, and two of the six Mediums are omissions or regressions inside the batch that closed the last round's Criticals. Readiness is honest as: **release-eligible on severity, not release-ready on accessibility** — 13 of 16 themes ship a primary button whose label the reviewer measured as low as 2.00:1.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-41 | `--on-accent` / `--on-danger` / `--on-success` and a per-theme hero scrim — white text on fills fails AA in 13 of 16 themes | UI-01 | High | P1 | M | — (co-edit with WORK-42) |
| WORK-42 | `--primary-text` per theme; switch the eleven foreground uses of `--primary` | UI-02 | High | P1 | S | — (co-edit with WORK-41) |
| WORK-43 | `width: 100%` in the shared button rule breaks the Salary primary action and the Analytics day-detail header | UI-03 | High | P1 | XS | — |
| WORK-44 | Force-clear reports success even when the write failed | CODE-01 | Medium | P2 | XS | — |
| WORK-45 | Category delete: the seventh delete path, no `save()` check and no toast | UI-14, CODE-02 | Low (UI-14) / Medium (CODE-02) | P2 | XS | — |
| WORK-46 | Validate `recLastDone` and `recLastLogged` — the two cursor fields the engines pivot on | CODE-03 | Medium | P2 | XS | shares validators with landed WORK-14/WORK-40 |
| WORK-47 | Guard the exchange-rate cache read and write | CODE-04 | Medium | P2 | XS | — |
| WORK-48 | `reportFatal` gets its own banner and its own words | CODE-05 | Medium | P2 | S | architect re-ruling on C5 (see C9) |
| WORK-49 | Bucket Monthly Trend by `YYYY-MM` key instead of re-parsing per month | CODE-06 | Medium | P2 | S | must not touch the deferred WORK-16 surface |
| WORK-50 | Analytics day tap: preserve `scrollLeft`, scroll the detail card into view | UI-04 | Medium | P2 | XS | — |
| WORK-51 | Header names the screen you are on and the period you are looking at | UI-05, CODE-10 | Medium (UI-05) / Low (CODE-10) | P2 | XS | co-edit with WORK-52 |
| WORK-52 | The Expenses tab must not land the user on Budget Planning | UI-06 | Medium | P2 | XS | co-edit with WORK-51 |
| WORK-53 | Category tag text is below AA composited over `--surface-2` | UI-09 | Low | P3 | XS | measure inside the WORK-41/42 pass |
| WORK-54 | Kingfisher `--text-2` fails AA on `--surface-2` and `--bg` | UI-10 | Low | P3 | XS | measure inside the WORK-41/42 pass |
| WORK-55 | Calendar cells and the goal icon grid below 44px at common phone widths | UI-11 | Low | P3 | S | — |
| WORK-56 | Accessible names for the converter buttons, currency search and quick-amount inputs | UI-12 | Low | P3 | XS | — |
| WORK-57 | Keyboard path for category and income-type reordering | UI-13 | Low | P3 | M | WORK-35 (deferred; its trigger fires here) |
| WORK-58 | Default an unset theme to dark when the OS prefers dark | UI-15 | Low | P3 | S | — |
| WORK-59 | Goal icon grid opens on focus and inserts 32 tab stops | UI-16 | Low | P3 | XS | — |
| WORK-60 | Quarantined copies of corrupt data accumulate without bound | CODE-07 | Low | P3 | XS | — |
| WORK-61 | Correct the coverage claim in `check-escaping.mjs` | CODE-08 | Low | P3 | XS | — |
| WORK-62 | `check:escaping` and `verify` scripts, named in `VERIFICATION.md` | CODE-09 | Low | P3 | XS | — |
| WORK-63 | Record ids interpolated into CSS selectors without escaping | CODE-11 | Low | P3 | XS | surfaces through WORK-48's banner |
| WORK-64 | Delete `fbApp`, two unreachable `EMPTY_ICONS`, `updateBellBadge`'s return, `isoDate` | CODE-12 | Low | P3 | XS | — |
| WORK-65 | Add the two missing type steps; retire 72 off-scale `font-size` literals | UI-07 | Low | P3 | M | bound by the WORK-28 convention — no sweep |
| WORK-66 | Twelve radii and six card paddings against a three-value scale | UI-08 | Low | P3 | S | bound by the WORK-28 convention — no sweep |

## Quick Wins

XS or S effort removing Medium severity or higher. Do these first inside their band.

- **WORK-43** (XS, High) — three inline width overrides. Restores the Salary Calculator's primary action to primary size and stops the Analytics day-detail title rendering underneath a full-width Close button. Highest value per minute in the roadmap.
- **WORK-42** (S, High) — one token per theme, eleven find-and-replace call sites. Fixes the active-tab indicator and the goal completion percentage in four themes.
- **WORK-44** and **WORK-45** (XS, Medium) — delete one line, add one `savedToast`. These are the only two findings in either report where the app tells the user something untrue about a write in normal operation. Code Review ranks them first for the same reason.
- **WORK-46** (XS, Medium) — two lines in validators that already have `ISO_DATE_RE` in scope; closes the ₮NaN class on the sibling fields WORK-14 and WORK-40 did not cover, and removes a 20,000-iteration walk per planned entry per badge refresh.
- **WORK-47** (XS, Medium) — one guarded read, one guarded write; the converter stops being permanently dead in private browsing.
- **WORK-50, WORK-51, WORK-52** (XS, Medium) — save/restore `scrollLeft` plus one `scrollIntoView`; one swapped init call plus one `if` guard; one mode reset in `navigate()`.
- **WORK-48** (S, Medium) and **WORK-49** (S, Medium) — the app's loudest alarm stops making three claims, two of them false; the Dashboard stops allocating 36 × record-count `Date` objects on every write.

WORK-41 is the one High that is not a quick win: it is M because the fix is 16 themes × three fills × a measured scrim, and measurement is the work.

## Sprint Plan

**Sprint 1 — Make every theme a supported theme, and stop the app saying "done" for writes that did not land.**

Items: **WORK-43, WORK-41, WORK-42, WORK-53, WORK-54, WORK-44, WORK-45, WORK-46.**

Effort: XS ×5, S ×1, M ×1 — approximately **3.5 engineering days** of implementation. The remainder of the sprint is reserved for the contrast verification pass across 16 themes and for V1's four write flows, which every item in this sprint touches or renders beside.

Delivers: the label on every primary button, the data-loss banner, the reminder badge and both gradient cards become legible in all 16 themes rather than three; the active tab indicator and the goal completion percentage come above AA in the four light themes where they were not; the Salary Calculator's primary action renders at primary size and the Analytics day-detail header stops rendering broken; force-clear and category delete stop reporting outcomes they cannot know; and the recurrence validators cover the two fields the engines actually pivot on. All three High findings close. Both remaining "the app said something untrue" findings close.

WORK-53 and WORK-54 sit two bands above their priority purely because they are contrast measurements against the same theme blocks WORK-41 and WORK-42 are opening. That is scheduling convenience under the standing WORK-28 convention, not a priority change.

I have deliberately left the other six P2 items out. Sprint 1 already contains the only M in the top two bands and a verification pass that has to be done by measurement rather than by inspection; adding six more XS/S items would put the sprint at five days of implementation and nothing left for the check that makes the contrast work provable.

## Roadmap

**Sprint 1** — WORK-43, WORK-41, WORK-42, WORK-53, WORK-54, WORK-44, WORK-45, WORK-46

**Sprint 2** — WORK-47, WORK-48, WORK-63, WORK-49, WORK-50, WORK-51, WORK-52, WORK-61, WORK-62 (≈2.75 days; closes every P2 item)

**Sprint 3** — WORK-55, WORK-56, WORK-58, WORK-59, WORK-60, WORK-64 (≈2 days)

**Later** — WORK-57, WORK-65, WORK-66

## Dependencies

**WORK-41 and WORK-42 are one edit to the theme blocks, and WORK-53 and WORK-54 ride in it.** All four add or correct per-theme colour tokens and all four require the same measurement pass against the same grounds. Sequencing them apart means opening 16 theme declarations four times and re-measuring the same pairs each time. WORK-41's constraint from the finding stands: do not change `--primary` itself — it measures correctly as an accent against every surface, and the new tokens are foreground-only.

**WORK-51 and WORK-52 are one edit to `navigate()`.** WORK-51 changes what writes `hdrTitle`/`hdrSub` and when; WORK-52 changes what `navigate('expenses')` means. Both touch the same function and the same `expMode`/`screenTitle` relationship, and they were raised as the same class of defect: the tab bar and the header naming different modules.

**WORK-63 belongs with WORK-48.** An id containing `"` or `]` throws a `SyntaxError` out of `querySelector`, which reaches `reportFatal`, which raises the banner WORK-48 is rewording. Fixing the words while leaving a path that fires them falsely repeats the round-3 pattern.

**WORK-46 finishes the validator sweep that WORK-14 and WORK-40 started.** Same two functions, same idiom three lines above each insertion point, one test pass. If any other validator work opens before Sprint 1, this rides along.

**WORK-49 must not extend into WORK-16's surface.** Code Review is explicit that Monthly Trend is a different cost profile (Date allocation, on the Dashboard, on every write) from the deferred Daily-chart/calendar item (string comparison, on Analytics). The scope is one `Map` build in `drawMonthlyTrend`. Anything that reaches into `renderCalendar` or `drawDailyStackedChart` is reopening a deferral, not doing this item.

**WORK-57 fires WORK-35's stated trigger.** The Chief Architect deferred extracting a shared `initReorder` with the trigger "the next behavioural change to either reorder path — most likely keyboard-accessible reordering — at which point extract first and change once." WORK-57 is that change. It must not land as two parallel keyboard implementations across `initCategoryReorder` and `initIncomeTypeReorder`; extraction comes first inside the same item, which is why it is M and not S.

**WORK-65 and WORK-66 are bound by the WORK-28 convention and by the standing "no large mechanical sweep" rule.** Both findings enumerate off-scale values across the whole file. Under the existing ruling the scheduled part is only the token additions (`--t-display`, `--t-hero`, `--r-bar`); the 72 literals and twelve radii are replaced only in blocks another approved item is already opening. They stay in the roadmap at Later so they are not lost, not because a sweep is planned.

**WORK-62 makes ruling V2 mechanically enforceable.** V2 requires a named search re-run at close by whoever closes a claim. `tools/check-escaping.mjs` has no script entry and is named in no document, so the predicate exists but the ritual does not. It is Low severity and scheduled as such, but it is the cheapest insurance against the "half-swept class" failure mode recurring.

**Unresolved: WORK-41 has no V2 predicate.** Its close condition is an "all 16 themes" claim of exactly the shape V2 governs, and no mechanical contrast check exists in this repo. Flagged to the architect rather than invented as work — no reviewer raised it.

## Conflicts

Recorded, not resolved.

**C6 — Release readiness. 73 versus 90 on the same build.** UI Review scores 73/100, "usable but fragile", on three High findings that it states live in normal use: two systemic contrast failures affecting the primary call-to-action in 13 of 16 themes, and one layout break on a named core module. Code Review scores 90/100, "production ready", on the convention's own definition of that band — no Critical and no High — having re-verified both round-3 Criticals closed against source. Neither is misapplying the band table; they are looking at different failure surfaces, and the convention's bands are keyed on severity rather than on count or domain. The two reports therefore hand you a build that is simultaneously in the production-ready band and carrying three High findings. Which score governs the release decision is not mine to pick.

**C7 — Severity divergence on the category delete.** UI-14 rates it **Low** ("polish, consistency": the user gets no confirmation for an action that can retag expenses as "Unknown"). CODE-02 rates it **Medium** ("a real quality problem with a workaround": the only delete in the app that reports nothing, on a destructive and irreversible path, where a failed write is silent). Same site, same recommended fix, same XS effort. I have merged them as WORK-45 and prioritised on the higher severity, as the rules require, and both severities are recorded unchanged. The reviewers disagree on how much a silent destructive write costs.

**C8 — Severity divergence on the cold-start header.** UI-05 rates the header defect **Medium** and describes two faults: "Dashboard" over a tab reading "Home" on every cold start, and `renderDashboard()` writing the Dashboard's date range into `#hdrSub` from twelve non-Dashboard code paths, so the app can state a period that has nothing to do with the visible list. CODE-10 rates the cold-start half **Low** and does not raise the subtitle half at all. WORK-51 carries both halves and both severities. The disagreement is whether a header that names the wrong period after an add or delete is polish or misinformation.

**C9 — CODE-05 against standing ruling C5.** Ruling C5 declined to create work for `reportFatal`'s bluntness, recorded it as a risk, and set a standing rule that `#dataErrorBanner` text is reserved for database load/parse failure. CODE-05 argues this is new evidence, not a re-raise: the fixed `<b>` headline and the note `reportFatal` writes contradict each other in a single paragraph ("could not be read → started empty → has not been changed"), and the standing rule is being violated by the `window.onerror` path today. Code Review asks for the separate banner element that C5 itself prescribed, or at minimum a rewritten headline. I have scheduled WORK-48 at P2/S with the dependency recorded, because I am not entitled to reopen a ruling. If C5 stands as written, WORK-48 reduces to the minimum variant or drops to the risk register — that is an architect call.

**C10 — CODE-06 against deferred WORK-16.** WORK-16 was deferred with the trigger "a real database exceeding roughly 5,000 actual expenses, or an observed interaction delay on the Daily screen." CODE-06 claims a different item entirely: Monthly Trend, on the **Dashboard**, on every write, with a cost profile of `Date` allocation rather than string comparison, at 36 × record count. Code Review states plainly that it is "adjacent to the deferred WORK-16 but not covered by it." I have taken that at face value and scheduled WORK-49 as new work with a hard scope boundary. If the architect reads it as the deferred item wearing a different name, WORK-49 goes back under WORK-16's trigger — but note that the trigger as written keys on the Daily screen and this defect is not on it.

## Estimated Effort

Sizing convention: XS ≈ 0.25 day, S ≈ 0.5 day, M ≈ 1.5 days, including the per-batch V1 flow execution.

| Band | Items | Breakdown | Approx. engineering time |
|---|---|---|---|
| P0 | 0 | — | — |
| P1 | 3 | XS ×1, S ×1, M ×1 | ~2.25 days |
| P2 | 9 | XS ×7, S ×2 | ~2.75 days |
| P3 | 14 | XS ×9, S ×3, M ×2 | ~6.75 days (≈2.5 days if WORK-65 and WORK-66 stay convention-bound, as the standing ruling requires) |
| **Total** | **26** | | **~11.75 days, or ~7.5 days under the standing no-sweep rule** |

Nineteen of 26 items are XS. There is no P0 and no XL. Everything that either reviewer calls High is 2.25 days, and one of the three is 30 minutes.

## Recommendations

**First: the theme layer is the only thing standing between this build and release-eligible on both reports.** Three High findings, all in one place, all from the same root cause — the round-3 contrast work solved text-on-surface, declared victory in a comment, and never measured text-on-fill or the hero scrim. Two days of measurement and tokens closes all three plus two Lows riding the same blocks. Nothing else in this round is close in value.

**Second: this round repeats round three's shape at lower severity, and that is the durable finding.** WORK-44 is the fix for WORK-38 being defeated on the very code path it was applied to. WORK-45 is the seventh delete path that a sweep of "six delete paths" missed. WORK-46 is the sibling field the WORK-14/WORK-40 validator sweep did not reach. UI-01's own evidence is a source comment asserting 4.5:1 "in all 16 themes" that measurement contradicts. That is three counted sweeps that miscounted and one measured claim that was not measured — precisely what ruling V2 exists to prevent, and V2 currently has no mechanical form for either the delete-path class or the contrast class. WORK-62 gives V2 a name for the one predicate that does exist; I would ask for a decision on whether "all delete paths call `savedToast`" and "all themes measure ≥4.5:1" get predicates too, because those are the two claims that have now failed twice each.

**Third: rule on C9 before Sprint 2 starts.** WORK-48 is the only item in the roadmap whose scope I cannot fix without you, and it sits with WORK-63 in the same sprint because the two together are the difference between the app's loudest alarm being trustworthy and being a hazard.

**Fourth: C6 is your call and I have not pre-empted it.** If 90 governs, this build ships today and Sprint 1 is a quality release. If 73 governs, Sprint 1 is the release gate. The distinction matters mainly for what you tell the team about WORK-41 — a two-day accessibility item is scheduled very differently from a two-day release blocker, and both reports support one of those readings.

**Finally, one thing neither report numbered.** Code Review's technical-debt section states that the comment at `expense-pwa/index.html:2398-2400` justifies `normalizeGroup` on the grounds that data "can also arrive from a cloud document," while `load()` is never called on the cloud path — and recommends correcting the comment now even though WORK-15 stays deferred. It has no finding ID, so I created no work for it. I am naming it because it is the same failure mode as WORK-61: a written justification that a future contributor will read and trust, describing coverage the source does not provide.
