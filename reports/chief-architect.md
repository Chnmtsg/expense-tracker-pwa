# Chief Architect — Final Engineering Decision

**Round 6.** Sources read in full and unmodified: `D:\3_Claude\PowerApps\reports\ui-review.md` (9 findings, 87/100), `D:\3_Claude\PowerApps\reports\code-review.md` (11 findings, 90/100), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (18 items WORK-93..WORK-110, conflicts C16–C21). Also read before ruling on anything they govern: `knowledge/review-conventions.md`, `knowledge/project.md`, and my own round-5 decision at `D:\3_Claude\PowerApps\reports\chief-architect.md`.

**This report replaces the round-5 decision as the standing decision.** Everything in round 5 carries forward unchanged except the seven rulings named in "What I Am Changing From Round 5" below.

## Verified Against Source, Not Accepted On Report

I re-derived every load-bearing claim myself before ruling on it.

- **`tools/harness/run.mjs:112`** — `process.exit(parsed &amp;&amp; parsed.ERROR ? 1 : 0);`. `v1-write-flows.js:13` catches every flow exception into a string; `:82` counts console errors into a field nothing reads. `ERROR` is set only by the outer catch at `:79-81`. There is no `dataWasCorrupt`, no `reportFatal` and no store corruption anywhere in the probe. **CODE-03 confirmed exactly, including its second clause.**
- **`index.html:878-892`** — `.hero-kpi`'s `background` still lists exactly two layers; `.hero-kpi::before` is unchanged, `position: absolute`, `rgba(255,255,255,.07)`, no `z-index`. The counter-pattern is in the file at `:1546` (`.cal-cell &gt; * { position: relative; z-index: 1; }`). **WORK-84(b) was never made. UI-05 and CODE-02 both confirmed.**
- **`icon-180.png`, `icon-192.png`, `icon-512.png`** — I opened all three. 512 renders the white tugrik on the blue gradient correctly. 180 and 192 are a white field with a blue band down the right edge. Two files, one correct control. **UI-01 confirmed; this is the assets, not the viewer.**
- **`index.html:1517-1521`** — I derived the cell width independently: `360 − 32 (main) − 2 (card border) − 24 (--s3 ×2) = 302`; less `6 × 2px` gap = `290 / 7 = 41.43px`. The same model gives `40.29px` for `--s4`, which is the comment's own "40.3px", so the model is confirmed by the comment. **"44.6px at 360px" is false. CODE-01 confirmed.** Further: `7 × 44 + 12 = 320px` of grid is required, so at a 360px viewport the card's horizontal padding must be ≤3px per side, and **at 320px the target is unreachable at any padding.**
- **`index.html:983-1006`** — `:987` reads *"State the rule, not the tally."* `:1004` reads *"The three siblings-in-a-row."* Eighteen lines apart. **UI-06 and CODE-05 confirmed.**
- **`index.html:7058, 7089`** — `db.settings.quickAmounts || [...]` against `newAmounts.filter(v =&gt; v &gt; 0)`. `[]` is truthy; edit mode renders zero inputs. **UI-02 confirmed: the state is reachable from the editor and cannot be left.**
- **`index.html:861`** — `.kpi .value` has no `overflow-wrap`; `:914` and its three siblings do. **UI-04 confirmed.**
- **`index.html:7545-7593`** — `reportFatal()` and both listeners sit at the end of the script; `let db = load()` is at `:2643`. Only `#dataErrorDownload` is hidden (`:7588`); `#dataErrorImport` is not. `load()` resets three flags at `:2649-2651` and not `fatalReported`. **CODE-04 and CODE-09 confirmed.**
- **`index.html:7572`** — `if (dataWasCorrupt) return;` is present, correctly placed ahead of the three `setBannerText` calls, under a comment that states the condition it tests rather than one it assumes. **Gate R5's code item did land and is correct.**
- **`tools/check-contrast.mjs:55-57` against `:98-100`** — three exact duplicate pairs. **CODE-06 confirmed.**
- **`index.html:4739-4755`** — `catAdd` checks non-empty only; `incomeTypeAdd` refuses a case-insensitive duplicate. **UI-08 confirmed.**
- **`index.html:1581`** — `.helper { font-size: 11px; ... }`, a literal, equal to `--t-micro`. **UI-09 confirmed on the fact.**

Ruling issued on all 18 items and all six conflicts. No item is silent.

---

## Executive Decision

**No — and for the second round running it is one XS item away, except this time the item is the check and not the code.**

Two reviewers working in parallel, neither seeing the other, both returned no Critical and no High; I re-derived the load-bearing facts myself and the build underneath is sound — integer money end to end, one store seam, quarantine before write, sixteen themes machine-measured, five allow-listed `save()` sites and no unlisted ones. On defect severity alone this ships. What I will not do is call a build releasable on a completion record that has now been falsified five times in a single batch: `WORK-84(b)` was approved with its own commit and its own visual check and was never made; two of three shipped PNGs are a blank white tile; the census returned eighteen lines below the comment written to forbid it; the corrected calendar comment carries a fresh false figure; and `WORK-82`'s filter opened a state a user can reach and cannot leave. Underneath all five sits the fact that makes them possible: `npm run v1` exits 0 whether or not all four write flows throw, so "the batch is verified" has meant a human reading JSON. The build is good; the evidence that it is good does not exist, and the evidence is what a release rests on.

---

## Release Gate Ruling

### Gate R5 does not stand as closed. It reopens with exactly one item.

I set R5's closing condition myself: *"the item landed; V1's write flows executed with a clean console, including a deliberately corrupted store followed by a thrown runtime error, which is the flow that produced the defect; `npm run verify` returns zero across all four tools."*

Three clauses. The first is satisfied — I read `index.html:7545-7593` and the guard is there and correct. The third is satisfied — the four static predicates are real and return zero. **The second was never exercised by any command.** The probe does not corrupt the store, does not raise a runtime error, and could not have reported it if it had, because `run.mjs:112` returns 0 unless the probe's outer catch fired. Gate R5 closed on a condition no command performed.

I am not reopening it against the code. I am reopening it against the evidence, and the whole of the remedy is WORK-98.

| Gate item | Why it blocks release |
|---|---|
| **WORK-98** | The command that underwrites every "it landed" claim in this project cannot return non-zero. Until the corrupted-store-then-throw walk exists and `run.mjs` fails on a thrown flow, gate R5's own closing condition is unperformed, and this round has five worked examples of what that costs. Two lines and one block. |

**GATE R5 CLOSES** when the walk exists and is demonstrated **red before green**: revert `if (dataWasCorrupt) return;` at `index.html:7572`, run `npm run v1`, see a non-zero exit; restore it, run again, see zero. A new assertion that has only ever been seen green is itself an unverified claim, and that would be the sixth instance of this round's class inside the fix for the fifth.

**Nothing else joins the gate.** Not WORK-94, which is the worst live user harm in either report; not WORK-93, which is the app's face on the platform it names. A one-item gate is why R4 and R5's code item both worked, and an eleven-item gate two rounds before them produced a Critical. Both are the first work after the gate closes.

**I open no gate R6.** Four Mediums stacked into a gate is the shape I just declined.

---

## Verification Process Ruling

V1, V2, V3, V4, V5 and V6 all stand. Three amendments, all inside things that already exist, and one convention.

### V1 gets teeth, and the teeth are specified precisely

`run.mjs` must exit non-zero on **(a)** any value in the parsed payload containing `THREW`, and **(b)** an unexpected console error. It must also stop exiting 0 at `:108`, where a payload that fails to parse is currently printed and swallowed — that is the same line class as `:112`, in the same file, inside CODE-03's own claim that the command cannot fail, and I authorise it inside WORK-98's scope. I am recording it as a risk I observed, not raising it as a finding.

**On (b), read this before writing it.** The known-good run prints one console error — the deliberate quota injection at `v1-write-flows.js:69-78`. A blanket `H_total_console_errors &gt; 0` therefore fails a good build on its first run, and the next engineer's rational response is to delete the assertion. **The probe must record errors raised outside the deliberate-failure block as their own field, and `run.mjs` must fail on that field.** An assertion that cries wolf on a clean build is worse than no assertion, because it teaches the team to disable it.

### V1 gains the walk that gate R5 named

One block after the quota case: set a garbage value under `expense-tracker-v1`, drive the corrupt path, call `reportFatal('error','probe')`, and record `dataErrorTitle.textContent` and `dataErrorDownload.style.display`. Gate R5's stated condition becomes a command. This is an assertion inside an existing tool.

### The tool ceiling, stated honestly this time

I froze the count at four in round 5 and the Engineering Manager was right to flag the ambiguity rather than assume it. The honest count on disk is **four static predicates behind `npm run verify` — `lint.mjs`, `check-escaping.mjs`, `check-contrast.mjs`, `check-saves.mjs` — plus one render harness, `tools/harness/`, which predates the freeze.** That is the ceiling: four plus one. WORK-98 adds no file and is compliant. There is no sixth thing this quarter.

### The pair-table convention gains its stated exclusion

My round-5 convention — *a CSS rule that paints a fill under text adds a pair-table row in the same commit* — cannot be satisfied by `.hero-kpi::before`, because an `rgba()` literal is not a token and the mechanism is blind to it by construction. Code Review is right that this will recur. The convention is amended: **a fill under text that is not expressible as a token cannot be measured, and therefore may not paint over text. It is moved beneath the measured stack or it is deleted.** That is now the rule, not a case-by-case judgement.

### One new convention, and it is the only process cost I am adding this round

**An approval condition that names an artifact state closes by re-deriving the artifact, not by making the commit.** Corollary for binaries: **an asset commit closes by opening the asset.** Three of this round's five falsified items — the icons, the census, the paint order — are static and no runtime harness would have caught any of them. What would have caught all three is thirty seconds of looking. That costs nothing and it is not a tool.

### Stage 2 remains deferred, and the trigger did not fire

Code Review states outright that no calculation defect was found in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`, and took no measurement it did not have. Trigger unchanged and unfired, fifth round running.

---

## Conflict Rulings

### C18 — CODE-03 against gate R5's closing condition. **Ruled first, as asked.**

**Ruling: CODE-03 holds in full. Gate R5 does not stand as closed; it reopens on the evidence half only, with WORK-98 as its single item, and retro-closes on a red-then-green demonstration.**

I verified both clauses at source rather than accepting the report. `run.mjs:112` is exactly as quoted; `flow()` swallows every exception into a display string; console errors go into a field the exit code never reads; and the probe contains no corruption and no thrown runtime error. A run in which all four write flows throw and the save-failure contract is broken exits 0 and prints success.

I separate two things the finding correctly bundles. **The code item landed and is right** — I read it, the guard is correctly placed and its comment states a tested condition rather than an assumed one. **The evidence did not exist** — and `eslint.config.mjs:70-72` explicitly delegates boot-crash detection to V1, so the fallback for this project's two historical boot crashes has been a command that returns 0 either way.

Retro-closing is the honest disposition and reopening is the honest label for the interval. I am using both: R5 is open now, and it closes on the demonstration, not on the commit.

### C19 — Five approved round-5 items against the record of the round-5 batch

**Ruling: the allegation holds on all five. I verified four of them myself directly and the fifth by reading the code that produces it. No blame is assigned and no batch is rescored; the remedy is structural and it is already in this decision.**

`WORK-84(b)` unmade — verified at `:878-892`. `WORK-91`'s icons — I opened all three PNGs against one correct control. `WORK-70`'s census — verified at `:987` against `:1004`. `WORK-83`'s comment — I re-derived 41.43px and the comment's own second figure confirms my model. `WORK-82`'s empty state — verified at `:7058` and `:7089`.

Two of these were reached independently by two reviewers who could not confer. That is corroboration and I treat it as the strongest evidence in the round.

What I take from it: **the failure is not carelessness, it is that a claim of completeness had no owner and no check.** WORK-98 gives the runtime half an owner. The re-derivation convention above gives the static half one. I am adding nothing else, because the fix for a process failure is rarely more process.

One thing I will say plainly, because it is my own ruling that was not met: WORK-83's approval carried the explicit condition *"correcting the '44.6px at 360px' claim"*, and the correction replaced one false figure with another false figure in the same three lines. That is the fourth and fifth instance of this class in two rounds and each arrived inside the fix for the previous one. Code Review's diagnosis is the most valuable sentence in either report and I adopt it as standing guidance: **a number in a comment has no owner; anything expressible as a derivation survives, anything expressible only as a result does not.** Comments in this file state inputs and an operator, or they state no number.

### C16 — `.hero-kpi::before`: two severities, two non-equivalent fix shapes

**Ruling on severity: the item is scheduled at Medium. Neither reviewer's severity is altered — that is theirs to set and the conventions say so.** CODE-02 carries the fuller evidence: twelve of sixteen themes falling from ~4.5:1 to ~4.0:1 on the headline figure and on the only sentence telling a user whether they are over or under budget, while `check-contrast.mjs` reports the row passing. UI-05 set Low on a corner-coverage argument that was correct in round 5, before the paint-order-over-text fact was established. The Engineering Manager prioritised on the higher and that was right.

**Ruling on shape: the background-layer route, as approved in round 5. The `z-index` route is rejected as the fix.** `.hero-kpi &gt; * { position: relative; z-index: 1; }` stops the disc painting over glyphs and leaves it lifting the ground above the scrim the per-theme alphas were derived against — so the pair table would still measure a stack that is not painted, and the app would still contain an unmeasurable fill under text. That is this project's signature defect wearing a fix's clothing. Move the highlight into `.hero-kpi`'s `background` list as a third layer *below* the scrim gradient and delete the `::before` rule. It then sits under the surface the alphas were solved for and needs no pair row.

**Authorised fallback, and only this one:** if under the scrim the layer proves visually indistinguishable, delete it outright and record that in the commit. Deletion costs one decoration and removes the same risk. There is no third option.

### C17 — Is the calendar cell a 44px touch target?

**Ruling: CODE-01 is right, and this is not a disagreement of fact. It is a disagreement of scope, and both statements are true.**

UI Review states the WORK-83 changes are present on disk. They are; I read `:1521`. CODE-01 states the width they produce is 41.4px at 360px and 43.6px at 375px. It is; I derived it independently and the comment's own `--s4` figure confirms the model. Presence is not sufficiency. Only one report asked what the change produced, which is the same discipline distinction running through this entire round.

**WORK-97 is therefore a comment fix now and a geometry decision later**, and I am splitting it on that line — see the approvals and deferrals. The comment correction does not wait on the geometry.

I add one arithmetic fact neither report states, because it changes what "fix the geometry" can mean: **seven cells at 44px plus six 2px gaps require 320px of grid.** At a 360px viewport, after `main`'s 32px and the card's 2px border, the card's horizontal padding must be ≤3px per side for the minimum to be met. **At 320px it is unreachable at any padding.** Whatever lands here must record that, because a guideline that cannot be met at a supported width is a fact about the guideline, not a defect to be papered over with a fourth number.

### C20 — UI-09 against the twice-rejected sweep

**Ruling: UI-09 is outside the sweep's set, the sweep rejection stands entirely unchanged, and UI-09 is approved narrowed to one declaration. This is the closest call of the round and I am saying so.**

The rejected sweep is *"snap 72 off-scale font sizes onto the scale"* — a mechanical M across hundreds of lines of a file with no harness under it, at Low severity and zero removed risk, whose own finding conceded no individual value was wrong. `.helper` at 11px is **on** the scale; it is exactly `--t-micro`. It is not a member of the rejected set, and the argument is not the rejected argument. This is a first raise about audience, and it is anchored in the project's own references: `project.md` requires every screen to be understandable without training by people with little accounting knowledge, and `ui-guidelines.md` opens Typography with "Readable". Under `review-conventions.md`, a deviation from those files is a finding and not a preference.

What tips it: the copy carrying the burden includes the non-reversible force-clear warning and the iOS storage-eviction warning — the two sentences in the app whose misreading costs a user their data — set at the type scale's floor, a floor established for one- and two-word tab labels.

What nearly stopped it: it visually alters twenty blocks in a file with no test harness. That is answered by the fact that it is **one declaration**, so the revert is also one declaration, and every `.helper` is already a full-width block, so nothing reflows structurally. Bounded and reversible is what a 72-value sweep is not.

**Approved, and it opens no door.** No other typographic change is authorised by this ruling, and the sweep does not return.

### C21 — CODE-09 against ruling C5's final form

**Ruling: confirmed. Resetting `fatalReported` in `load()` is consistent with C5, and I extend C5 to say so explicitly rather than leaving the next reader to infer it.**

I verified the path: `reportFatal()` hides `#dataErrorDownload` at `:7588` and does not touch `#dataErrorImport`, so Restore from file is live under a "Something went wrong." banner; `load()` at `:5252` calls `updateCorruptBanner()` at `:2732`, which toggles the banner off; `fatalReported` stays true and the session has no fatal indicator for any later error.

C5 governs what may be **written** into `#dataErrorBanner`. The latch governs whether anything may be written **at all**, and a successful `load()` is a new load state — it is precisely the event that already resets `dataWasCorrupt`, `corruptRawKey` and `corruptQuarantineFailed` at `:2649-2651`. **C5 extended: every flag that gates what `#dataErrorBanner` says belongs to one per-load reset set, and that set lives in `load()`.** One line, at that site, with the others. WORK-108 approved.

---

## What I Am Changing From Round 5

Everything not listed here carries forward unchanged, including every rejection and every deferral.

1. **Gate R5: closed → reopened on the evidence half**, single item WORK-98, retro-closes on a red-then-green demonstration. (C18)
2. **C5 extended** to cover the per-load reset set, not only the banner's text. (C21)
3. **The tool freeze restated precisely**: four static predicates behind `verify`, plus one render harness. Four plus one is the ceiling.
4. **The "fill under text adds a pair row" convention amended** with its exclusion: an unmeasurable fill may not paint over text.
5. **WORK-83's approval condition is recorded as not met**; the comment half is reissued as WORK-97(a) and the geometry half is deferred with a measurement condition rather than re-approved.
6. **WORK-84(b) re-approved unchanged in shape as WORK-100**, with the `z-index` alternative explicitly rejected so it cannot be substituted.
7. **One new convention**: an approval condition naming an artifact state closes by re-deriving the artifact; an asset commit closes by opening the asset.

---

## Approved Improvements

17 of 18 items approved, one of them as a half. Gate item marked **[R5]**.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-98** | `npm run v1` cannot fail; gate R5's condition has no re-runnable check **[R5]** | Verified at `run.mjs:112` and across the whole probe. The command underwriting every completion claim in this project returns 0 unconditionally, and C19 is five worked examples of the cost. Ruling C18. **Conditions: the unexpected-console-error field must exclude the deliberate quota injection; `:108`'s parse-failure exit 0 is in scope; and the assertion must be demonstrated red before green.** |
| WORK-94 | Emptying the quick-amount editor deletes the feature with no way back | Verified at `:7058`/`:7089`. A state a user reaches from the editor, with no message, no route back short of Reset All, on the app's two most-used forms — created by a fix I approved. Two expressions, one function. First item after the gate. |
| WORK-99 | Global error handler registered after ~5,190 lines of top-level statements | Verified: listeners at `:7592-7593`, `let db = load()` at `:2643`. The mechanism written for a store the app cannot build a database from does not exist at the moment that store is read. Moving three declarations to just after `:2552` covers 5,000 lines instead of 30 and changes no behaviour. |
| WORK-93 | Two of three shipped PNG icons render as a blank tile | I opened all three files against one correct control. The app's own Storage Status and About cards tell users to install to the home screen; the tile they get is a white square. **Condition: this commit closes by opening each exported PNG.** The `"purpose": "any"` raster entry lands in the same commit — re-exporting without one leaves the same class of gap. |
| WORK-96 | `.kpi .value` is the one headline-figure class with no wrap guard | Verified at `:861` against `:914`, `:950`, `:1310`, `:1599`. Seven-figure amounts are the normal case in MNT and `.grid-2` has no breakpoint, so a named core module can push the page into horizontal scroll, which `ui-guidelines.md` rules out without qualification. One declaration. |
| WORK-100 | `.hero-kpi::before` paints above the scrim and above the hero text | Ruling C16. Verified unmade at `:878-892`. Corroborated independently by both reviewers from different directions. **Approved in the background-layer shape only, below the scrim, with the `::before` deleted; outright deletion is the sole authorised fallback. The `z-index` route is rejected.** Re-run `check-contrast.mjs` after. |
| WORK-105 | Three exact-duplicate rows in the contrast pair table | Verified at `:55-57` against `:98-100`. The pair table is the one hand-maintained artifact the whole V4/V6 mechanism rests on, and its printed summary is what a reader uses to judge coverage. Rides with WORK-100 so the sixteen theme grounds are measured once. |
| WORK-97(a) | Calendar padding comment records a width it does not produce | Ruling C17. I derived 41.43px independently and the comment's own second figure confirms my model. **Conditions: state the derivation inputs and no bare result; record that 44px requires ≤3px of card padding at 360px and is unreachable at 320px.** This is the same three-line block that carried a false figure in the previous round, and the correction must be the last one. |
| WORK-95 | Analytics calendar heatmap ignores the screen's own date-range filter | One filter row at the top of a screen governs that screen — that is the whole contract for an untrained audience, and three of four cards honour it while the module's most visual artifact silently does not. **Approved in the reviewer's shape: sync `calDate` on preset change only, so the ◀/▶ arrows keep working. All-Time leaves it alone.** |
| WORK-107 | `getComputedStyle` called once per calendar cell inside the render loop | Up to 42 forced style resolutions per paint of a per-theme constant. Explicitly not the deferred WORK-16/49 class and does not touch it. Moving one line, in the same pass as WORK-95. |
| WORK-108 | Fatal-error latch never reset; the restore path hides the banner it raised | Ruling C21. Verified at `:7588`, `:2649-2651`, `:2732`. After a restore taken in response to a runtime error — the sequence the banner's own text recommends — the session is silent about every later failure. One line, at the existing per-load reset site. |
| WORK-101 | The button rule's census returns eighteen lines below the comment forbidding censuses | Verified at `:987` against `:1004`, corroborated independently by both reviewers. My own convention written into the file with a false tally three lines under the sentence rejecting tallies. **Condition: the replacement contains no number.** |
| WORK-102 (narrowed) | Seven salary fields silently clamp a negative entry to zero and say nothing | The money is right and stays right; the explanation is missing, on a calculator aimed at people with no accounting knowledge, where a field reading `-2` beside ₮0 reads as the app being broken. **Narrowed to the Save path only, reusing the `sHourly` `.invalid` + toast block verbatim. The `input`-event half is rejected** — it toasts per keystroke as someone types a minus sign. |
| WORK-103 (narrowed) | Category names may duplicate exactly; income types may not | Verified at `:4739` against `:4750`. Two identical categories split one heading across two rows and produce two identically-labelled chips in different colours, with no diagnosis available to the user. **Narrowed to an exact `(name, group)` refusal — the one combination that cannot be intentional — in `catAdd` and `saveEditCat`. "Transport / Needs" and "Transport / Wants" stay legal.** |
| WORK-110 (split) | Two dead declarations | **Two unrelated changes, therefore two commits.** (b) `computeNextRecurring()`'s `base` is approved on its own merit: it is the one place in the file doing date arithmetic in milliseconds rather than through `stepDate`/`parseISO`, inside the single recurrence engine, and a dead line is a pattern the next editor copies. (a) `.salary-summary`'s duplicate `background` is approved **as a ride-along only** — it does not earn its own commit. |
| WORK-106 (narrowed) | `check-escaping.mjs`'s skip rule states a reason that is false at a live site | The tools' headers are claims and they get re-derived like everything else — this is the CODE-08 class from round 5 in the sibling tool. **Approved as the comment correction only, naming `index.html:7061` and the `importProblem()` constraint that makes it safe. The deny-list alternative is rejected.** After WORK-94, which rewrites the cited site. |
| WORK-109 | `VERIFICATION.md` §1's line-number inventory is stale at every row | §5's gate-close checklist is written entirely in that section's row ids, so the record of how the round-3 gate closed can no longer be walked. **Approved in CODE-10's shape: replace the `Line` column with the enclosing function name and drop the "22 references" total** — consistent with the standing rule that this document records no counts and describes predicates, not positions. Last in its sprint. |
| WORK-104 (narrowed) | The app's entire explanatory layer is set at its smallest size | Ruling C20. Outside the rejected sweep's set — 11px is *on* the scale — and argued from `project.md` and `ui-guidelines.md` rather than from preference. The copy at the type floor includes the non-reversible force-clear warning and the iOS eviction warning. **Narrowed to the single declaration `.helper { font-size: var(--t-sm); }`, with a visual check at 360px of the five longest helper blocks. No other typographic change is authorised by this ruling.** |

---

## Rejected Improvements

Shapes rejected within approved items, and the standing rejections that carry forward.

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-100 (`z-index` shape)** | `.hero-kpi &gt; * { position: relative; z-index: 1; }` as the fix | Ruling C16. It stops the disc painting over glyphs and leaves it lifting the ground above the scrim the per-theme alphas were derived against, so `check-contrast.mjs` would still measure a stack that is not painted. That is this project's signature defect dressed as its remedy. The background-layer route removes the surface from the question; that is the approved shape. |
| **WORK-102 (`input`-event half)** | Flag and toast on every `input` event across nine fields | A toast that fires on the keystroke where a user has typed `-` and not yet typed the digits is noise, and noise is how users learn to dismiss the toast that matters. The Save path removes the same risk and is smaller. |
| **WORK-106 (deny-list half)** | Replace the dot test with a deny-list of known-safe identifiers | Premature generalisation for zero removed risk. There is one live site, it is safe, and the defect is that the comment overstates the predicate. Correcting the sentence removes the entire risk; building a list to maintain does not. |
| **WORK-110(a) as standalone work** | A commit for a duplicate `background` declaration | Zero risk removed, zero reader confusion beyond two adjacent lines. It rides along with whatever opens `.salary-summary` or it does not happen. Work not done is the cheapest work there is. |
| **WORK-89 (sweep half)** — carried | Snap 72 font sizes, 9 radii, ~69 spacings, 7 card paddings onto the scales | Rejected twice, unchanged, and **not reopened by WORK-104** — ruling C20 turns on `.helper` being on the scale already and therefore outside this set. M effort, Low severity, zero removed risk, hundreds of lines in a file with no harness under it. |
| **WORK-88** — carried | Default an unset theme to dark when the OS prefers dark | Rejected in rounds 4 and 5. Carries no trigger: it returns on an observed user harm, not a projected one. Not re-raised this round. |
| **WORK-87** — carried | Add `savedToast` to the two reorder handlers | Rejected on a verified fact: `writeDb()` raises `showSaveError()` on every failure path. Unchanged; not re-raised. |
| **WORK-76 (extraction half)** — carried | Extract the shared "apply a preset and persist it" body | Two call sites do not justify a new seam when moving one line removed the defect. Unchanged. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-97(b)** | Calendar cell geometry — accept 41.4px or drop the card's horizontal padding | Ruling C17. The risk is real: a mis-tap in the date picker writes a wrong date into a goal deadline or a plan's end date. The right shape is not known, and **every number in these three lines has been wrong twice from arithmetic alone.** What settles it: a harness probe reporting `.cal-cell` `getBoundingClientRect().width` at 320, 360, 375 and 390px, for the current rule and for the padding-zero variant, plus a check that zeroing the card's padding does not push `.cal-nav` and `.cal-legend` edge-to-edge. If the variant clears 44px at 360 and 375 without that side effect, take it. If it does not, **accept the shortfall and record the derivation and the 320px impossibility** — that is a legitimate outcome and a far better one than a fourth wrong figure. `tools/harness/` exists for exactly this; this is the item that makes it earn its keep. |
| **WORK-85** — carried | Keyboard path for category and income-type reordering | Trigger unchanged: a behavioural change to either reorder path — which fires WORK-35 and this together, extraction first — or evidence of a real keyboard or switch user blocked by it. The palette-by-index fact is recorded and is not new evidence. |
| **WORK-16 / WORK-49** — carried | Index Daily chart and calendar; bucket Monthly Trend | Trigger unchanged: a measured render above 100ms on a mid-range device, or a real database above 5,000 actual records. Code Review explicitly declined to re-raise these and took no measurement, which I note approvingly. WORK-107 is not this class. |
| **WORK-35** — carried | Extract the shared reorder implementation | Trigger did not fire, because WORK-85 is deferred. |
| **WORK-15** — carried | Cloud load through `importProblem` → `writeDb` → `load()` | Hard precondition holds: no build ships with Firebase configured until WORK-15 and the escaping work have both landed. |
| **WORK-17 (IndexedDB half), WORK-23 (screen half), WORK-30, WORK-31** — carried | Standing round-3 deferrals | Unchanged. No report this round presented new evidence against any of them. |
| **Stage 2** — carried | Pure-logic module and test runner | Not promoted, fifth round running. Code Review states outright that no calculation defect was found in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. **Trigger unchanged and unfired:** a rounding or arithmetic defect in one of those four fires it. |

---

## Development Order

Nothing outside R5 begins before R5 closes.

**Step 0 — WORK-98 [R5]. Alone.** Two lines in `run.mjs` (thrown flow, unexpected console error, and the parse-failure path at `:108`), one block in `v1-write-flows.js` (corrupt the store, drive the corrupt path, `reportFatal`, record the banner's title and the download button's display). The unexpected-error count must exclude the deliberate quota injection or the assertion will be deleted by the next engineer who runs it. **Demonstrate red before green: revert `index.html:7572`, run, see non-zero; restore, run, see zero.**

**GATE R5 CLOSES.** Conditions: the walk exists, `npm run v1` returns non-zero with the guard reverted and zero with it restored, and `npm run verify` returns zero across all four static tools. **Then the build is releasable.**

**Step 1 — WORK-94. Alone.** The only state in either report a user can reach and cannot leave without discarding other work. It is the fix for a fix, so its own edit gets undivided attention.

**Step 2 — WORK-99. Alone.** Moving `let fatalReported`, `reportFatal()` and both listeners up 5,000 lines is a low-risk edit with a high-consequence failure mode — a boot crash — and Step 0 is what makes it observable. This is why it goes after the gate and not before it. Note for the record: it is **not** a dependency of WORK-98's walk. The probe is injected after the entire app script, so `reportFatal` exists when the walk runs regardless. The Engineering Manager's pairing is a convenience, not a constraint.

**Step 3 — WORK-93.** Re-export both PNGs, open both files, then commit. `sw.js` `ASSETS` and the `"purpose": "any"` manifest entry in the same commit.

**Step 4 — WORK-96.** One declaration. The last headline-figure class joins the other four.

**Step 5 — WORK-100 + WORK-105, one measurement pass, two commits.** The hero's highlight moves into the background stack below the scrim and the `::before` is deleted; the three duplicate pair rows are merged. Then `check-contrast.mjs` runs once and its two `on-hero` rows describe the surface that is painted. This step does not close until that run returns zero and the printed summary is the honest one. WORK-100 gets its own visual check on the app's most-looked-at card, as it should have had last round.

**Step 6 — WORK-97(a).** The comment states inputs and an operator, records 41.4px as derived, and records the 320px ceiling. No result-only number.

**Step 7 — WORK-95 + WORK-107, one pass over `renderCalendar()`, two commits.** The behavioural change first, the hoist second. The ◀/▶ arrows must still work after; that is the acceptance test.

**Step 8 — WORK-108, then WORK-101.** One line at the per-load reset site; then the census becomes a class statement with no number in it.

**Step 9 — the tail: WORK-102, WORK-103, WORK-110(b), WORK-104, WORK-106, WORK-110(a) as a ride-along.** Separate commits. WORK-104 lands with its visual check. WORK-106 lands after WORK-94 so it describes the final code.

**Step 10 — WORK-109. Last.** `VERIFICATION.md` §1 is rewritten against the final state, in function names rather than line numbers, exactly as WORK-79 was sequenced last round. Everything above it moves positions; nothing above it moves a function name.

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework, no runtime build step, no bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations. `stepDate` as the single recurrence engine. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever. Offline-first. Mobile-first. Correctness of financial data above everything.

**What changes.**

1. **The verification layer's render-time half becomes real.** `npm run v1` returns non-zero on a thrown flow, an unexpected console error and an unparseable payload, and it performs the corrupted-store-then-throw walk that gate R5 named. Every new assertion in this project is demonstrated red before it is trusted green.
2. **The ceiling is four plus one.** Four static predicates behind `verify`, one render harness. New assertions go inside one of those five. There is no sixth thing.
3. **An unmeasurable fill may not paint over text.** The pair-table convention keeps its rule and gains its exclusion: a fill expressed as an `rgba()` literal cannot be measured by a token-based mechanism, so it moves beneath the measured stack or it is deleted. This is what removes CODE-02's class permanently rather than case by case.
4. **A claim of completeness closes by re-derivation.** An approval condition naming an artifact state is closed by re-deriving the artifact; an asset commit is closed by opening the asset. Three of this round's five falsified items were visible in thirty seconds to anyone who looked.
5. **Comments state derivations, never results.** Inputs and an operator survive an edit; a bare figure does not. Five instances in two rounds, each inside the fix for the last one, is enough evidence for a rule.
6. **C5 in its extended final form.** A path may reuse `#dataErrorBanner` only if it rewrites every claim the element renders *and* establishes it is not overwriting a more urgent true message — and every flag gating what that element says belongs to one per-load reset set, in `load()`.

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports. Enabling Firebase. Deleting or repairing any quarantined Cloud Sync code, `fbApp` included. Splitting `index.html` beyond the single authorised sibling module. Any large mechanical sweep across the file — the 72 font sizes and 69 spacings are the specific temptation and they are declined for the third time; WORK-104 is one declaration and does not reopen them. Any `render*` function calling `save()`. A seventeenth theme before `check-contrast.mjs` covers it. A sixth executable. CSS parsing, cascade resolution or `color-mix()` following inside `check-contrast.mjs`.

**Risks I am recording, not scheduling.** Neither is a finding and neither is new. `analyzeExpenses()` is 330 lines of 26 inline rules with no seam, and it is where the roadmap's AI Budget Assistant will want to live. Every consumer re-derives its own filter/expand pipeline from `db`; Reports, Debt Planner and Investment Tracker each need a second read model over the same collections, and `VERIFICATION.md` §1 becoming unwalkable is the first sign the hand audit does not reach an eighth consumer. Two further risks I observed while verifying this round, stated as risks and not raised as findings: `run.mjs:108` exits 0 on an unparseable payload, which I have folded into WORK-98's scope; and `load()` at `:2715` does `d.categories.forEach(...)` outside the `try` that ends at `:2683`, which is the concrete path CODE-04 names and which WORK-99 covers. The module-boundary problem — 34 mutable globals, filter state read out of DOM inputs — remains the leading candidate for the quarter after this one, and it remains cheaper to live with than to rewrite a render layer with no harness underneath it.

**And the thing that matters more than any item here.** Last round I wrote that the counting problem had been moved somewhere it could be checked. This round proved that only half of it was: the static half is genuinely policed, and every false claim found was found by someone re-deriving rather than reading — but the runtime half was never checked at all, and five approved items were recorded as landed when they had not. The correction is not more process. It is one command that can say no, and one habit: **open the thing you claim you changed.**

---

## Executive Report

The application is one XS item from releasable and I am holding it for that item, exactly as in round 5 — but the item has moved from the code to the check, and that move is the whole story of this round. Two reviewers working in parallel returned no Critical and no High for the second consecutive round, 87 and 90, and where they converged they converged independently: both found `.hero-kpi::before` painting over the hero text, both found the button census returned. I verified the load-bearing facts myself rather than accepting either report — I derived the calendar cell at 41.43px and watched the comment's own second figure confirm my model, I opened all three PNGs and found two of them blank against one correct control, and I read the guard at `index.html:7572` and found it present and correct. The build underneath is the soundest this project has produced.

What holds it is `tools/harness/run.mjs:112`. It is `process.exit(parsed &amp;&amp; parsed.ERROR ? 1 : 0)`, `ERROR` is set only by the probe's outer catch, every flow exception is swallowed into a display string, and the console-error count is written into a field nothing reads. A run in which all four write flows throw and the save-failure contract is broken exits 0 and prints success. Worse for my own record: gate R5's stated closing condition named *a deliberately corrupted store followed by a thrown runtime error*, and the probe has never corrupted a store or raised a runtime error. **Gate R5 closed on a condition no command performed, and it reopens on that half with WORK-98 as its single item.** The code item landed and is right; the evidence did not exist. It closes on a red-then-green demonstration and not on a commit, because an assertion only ever seen green is the same class of claim it was written to retire.

That is also the mechanism behind C19. Five approved round-5 items are not on disk as recorded — `WORK-84(b)` unmade, two icons blank, the census returned, the calendar comment carrying a fresh false figure, `WORK-82` opening an unrecoverable state — and two of the five were reached twice by reviewers who could not confer. Three of them are static and no harness would catch them; what would catch all three is looking. So the remedy is two things and no more: one command that can fail, and one convention that an approval condition naming an artifact closes by re-deriving the artifact.

On the escalated conflicts. **C18:** CODE-03 holds in full, verified at source; R5 reopens on the evidence, retro-closes on the demonstration. **C19:** holds on all five, four verified by my own inspection; no batch is rescored and the fix is structural. **C16:** scheduled at CODE-02's Medium, neither reviewer's severity altered, and the background-layer shape stands with the `z-index` route explicitly rejected — it would leave the pair table measuring a stack that is not painted, which is the defect wearing the fix's clothes. **C17:** not a conflict of fact but of scope; presence is not sufficiency, CODE-01's arithmetic is right, and I add that 44px requires ≤3px of card padding at 360px and is unreachable at 320px. **C20:** `.helper` is on the scale and therefore outside the rejected sweep's set; approved as one declaration, the closest call of the round, and it opens no door. **C21:** confirmed, and C5 is extended so the next reader does not have to infer it.

Of 18 items I approved 17, deferred one half, split one, narrowed five, and rejected four shapes within approvals plus the four standing rejections that carry forward. Three verification amendments, all inside things that already exist. The approved roadmap is roughly three engineering days, no item above S, no rewrite, no dependency, no sixth tool, and no change to the single-file constraint.

---

## Implementation Priority

1. **WORK-98 [R5]** — alone; assertion excludes the deliberate quota error; demonstrated red before green.
2. **GATE R5 CLOSES** — walk performed, `v1` red-on-revert and green-on-restore, `verify` zero across four.
3. **WORK-94** — the trap a user can enter and not leave.
4. **WORK-99** — the error handler moves to `:2552`, now that a boot crash is observable.
5. **WORK-93** — re-export, open both files, then commit; manifest `any` entry and `sw.js` in the same commit.
6. **WORK-96** — one declaration.
7. **WORK-100 + WORK-105** — one measurement pass, two commits, closing on `check-contrast.mjs` zero with the honest summary line.
8. **WORK-97(a)** — the comment states a derivation and records the 320px ceiling.
9. **WORK-95 + WORK-107** — one pass over `renderCalendar()`; the ◀/▶ arrows are the acceptance test.
10. **WORK-108, then WORK-101** — the reset joins its set; the census loses its number.
11. **WORK-102, WORK-103, WORK-110(b), WORK-104, WORK-106, WORK-110(a) as a ride-along** — separate commits.
12. **WORK-109** — last, written against the final state in function names.

---

## Recommended Next Action

**Land WORK-98 and close gate R5 — nothing else touches the repository first.** Two lines in `tools/harness/run.mjs`, one block in `tools/harness/v1-write-flows.js`, and then the demonstration that matters more than the code: revert `if (dataWasCorrupt) return;` at `expense-pwa/index.html:7572`, run `npm run v1`, and confirm it goes red; restore the line and confirm it goes green. Do not batch the four Mediums into this, however cheap they look and however much they are the visible half of the round — WORK-94 and WORK-93 are the first two things after the gate and they are one day away. This round's central fact is not a defect: it is that five items were recorded as complete and were not, under a green line from a command that returns 0 whether the application works or does not. Until that command can say no, every claim in this report — including my own — is a person reading JSON.

*(Round 6. Full reports: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\engineering-manager.md`. This decision replaces `D:\3_Claude\PowerApps\reports\chief-architect.md` as the standing decision.)*
