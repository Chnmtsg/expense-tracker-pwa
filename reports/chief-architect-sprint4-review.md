# Chief Architect: Sprint 4 Post-Implementation Ruling

**Inputs.** I read both reports in full and changed neither:
- `reports/ui-review-sprint4.md`: UI-01 (Medium) and UI-02 (Low), 91/100
- `reports/code-review-sprint4.md`: CODE-01 to CODE-05, all Low, 92/100

I measured them against:
- `reports/chief-architect-sprint3-review.md`: the Sprint 4 list, its conditions, the WORK-22 deferral row, the Conflict Rulings and the Risks
- `reports/archive-chief-architect-round14.md`: C44, the WORK-210(b) row, and the WORK-213 row with its permanently rejected cap shape
- `knowledge/` (project, review conventions, and the coding standard's comment rules: "Keep them true", "State the rule, not the tally", "re-read the comment above it")

**Checked at source:**
- the `#incList` handler and the comment above it in `expense-pwa/index.html`, ":7023-7054"
- the `#expList` handler, ":7624-7640"
- the calibration comment in `tools/harness/perf.js`, ":35-65"
- the WORK-22 block in `perf.js`, ":246-269"
- the header tally in `perf.js`, ":24-25"
- the WORK-16/49 seed in `perf.js`, ":106-123"
- the deploy state and WORK-22 paragraphs in `reports/HANDOFF.md`, ":24-68" and ":130-168"

**Implementer's facts, taken as context:**
- v29 is live (deployed 2026-10-10).
- On `main`, `sw.js` reads v30 and holds Sprint 4.
- No v30 build has reached a client.
- Delegation made no measurable difference to All Time.
- No deferral row was written and no next step was chosen. That was correct under the standing rule: open decisions go up.

There is no Engineering Manager roadmap for a post-implementation review. Instead of Manager conflicts, I settle the overlaps, the open All Time question, and one reviewer claim about the instrument that I am correcting (CODE-04). No ruled Sprint 4 item is reopened.

## Executive Decision

**Yes. Sprint 4 is fit for release as v30 once the fix-now set below lands and `npm test` is green.**

- Both reviewers confirm that every Sprint 4 item matches its ruled shape. Neither found a Critical or High.
- The one Medium (UI-01) is a gap in the record, not a defect in what shipped. It is closed by a deferral row in this ruling, not by building anything.
- The fix-now set is all XS. It is one harness probe over the rewired row buttons, which ship in v30, plus comment and record corrections. Landing it now costs less than shipping v30 and carrying it.
- v30 should not wait. It carries the Salary fix, the only money change this sprint, and until v30 deploys every Salary save still writes a breakdown that does not add up.
- No v30 build has reached a client, so a comment-only `index.html` edit rides v30 with no key bump. Confirm that the live `sw.js` still reads v29 before deploying.

## Approved Improvements

**Fix now, before the v30 deploy.** Each row is its own commit, merged `--no-ff`, with `npm test` green after each.

| Item ID | Title | Reason for approval |
|---|---|---|
| CODE-01 | Delegation rewired four row controls, and only Income Delete is clicked by any probe | Income and Expenses rows are the commonest edit and delete controls on the two lists that hold the user's money records. Today, a delete that hits `db.actual` in Planned mode, or a dead `#expList`, would ship green. This is the Sprint 3 CODE-01 class: a rewrite whose key property has no probe. It guards code that ships in v30, so it lands before the deploy. **Shape:** harness only, one flow in `accounts.js`, with `confirmDialog` stubbed to resolve `true` and counting its calls. Click through the real buttons, never `openEditModal` directly: (1) `[data-edit-inc]`: assert `editCtx.kind === 'income'` and zero confirm calls, then close. (2) Actual mode, `[data-edit-exp]`: assert `editCtx.kind === 'actual'`, then close. (3) Actual mode, `[data-del-exp]`: assert the record has left `db.actual` and `db.planned` is unchanged. (4) `setExpMode('planned')`, then `[data-del-exp]` on a recurring plan: assert that the confirm text is the recurring-series sentence, that the plan has left `db.planned`, and that `db.actual` is unchanged. No app change. |
| CODE-02 + UI-01 (comment half) | The delegation comment blames the 200 ms on the per-row listeners | One issue, raised by both reviewers. The comment is the design record, and the post-delegation figures show it is false. It sits in the file v30 ships. **Shape:** replace the whole comment block above the `#incList` listener in `index.html` with the text below. Nothing else in the file changes. The `#expList` one-liner ("Delegated, as the Income list is (WORK-22).") stays. **Exact text:** `/* THE ROW BUTTONS ARE DELEGATED (WORK-22). renderIncome rebuilds every row with innerHTML, so the rows' Edit and Delete buttons are handled by one listener on the list container, bound once, which finds the button with closest(), as the data-show-all handler does. Delegation removed the per-row listeners, not the cost of building the rows; the All Time render cost is carried as a deferral (HANDOFF, WORK-22). Behaviour is identical: the same buttons, the same handlers, the same order of dialogs and writes. */` |
| CODE-03 + CODE-04 (corrected shape) | `perf.js` states C44 two ways, and neither statement says what the bound can see | Both are false or incomplete sentences about one subject, what a `perf.js` figure may settle, in one file. Two contradictory C44 readings in the instrument would mislead the next decision that rests on a figure. One commit, two edits, nothing else in `perf.js`. **Edit 1 (CODE-03).** In the WORK-22 block comment, replace `Measurement only: a row cap stays off limits, and like every figure here (C44) these may corroborate a deferral, not fire or close one.` with exactly: `Measurement only: a row cap stays off limits, and what these figures may settle is stated in the calibration comment above (C44, WORK-210(b)).` **Edit 2 (CODE-04, corrected; see Conflict Rulings).** In the calibration comment, after the sentence ending `...the bound shows no gross dilation (C44).`, add exactly: `The bound is one-sided. Real time spent in the frame cannot exceed the wall time, so it limits how far a figure can UNDERSTATE real time (by at most wall_clock_ms / in_frame_ms_total); it cannot show that a figure is not OVERSTATED by a frame clock running fast unless the in-frame total reaches the wall time. A figure above a threshold is therefore not confirmed by the bound at any margin, and any decision resting on a figure from this file, firing or closing, goes up for a ruling with both numbers beside it.` |
| UI-01 (record half) | The All Time list cost is unchanged after delegation, and no deferral row carries it | This is a real, user-reachable cost that the record had dropped. The deferral row is in Deferred below. HANDOFF has to point to it, so the next session finds a trigger instead of a loose sentence. **Shape:** `HANDOFF.md` only. In the "After delegation" paragraph, replace `No further change is pre-ruled, a row cap stays off limits, and anything more (pagination, virtualisation) needs its own round.` with exactly: `The remaining All Time cost is carried as a deferral in chief-architect-sprint4-review.md (UI-01, the All Time list render cost), with its triggers there. No change is pre-ruled, a row cap stays off limits, and pagination or virtualisation needs its own round.` |
| UI-02 / CODE-05 | HANDOFF says nothing on `main` is undeployed, while v30 is staged | One issue, raised by both reviewers. It is the Sprint 3 CODE-09 class, and here it could strand the Salary fix undeployed. **Shape:** `HANDOFF.md` only. (1) In the "v29 is live" bullet, delete the sentence `Nothing on `main` is undeployed.` (2) Directly after that bullet, add a bullet: `**v30 is staged on `main`, NOT deployed:** Round 19 Sprint 4 with its review fixes. The live `sw.js` reads v29 (confirm before deploy). No v30 build has reached a client.` (3) Replace the "Next (Sprint 4, per…)" sentence in the Sprint 3 bullet with nothing. Add, above the Sprint 3 bullet: `**Round 19 Sprint 4 (staged at v30, NOT deployed).** UI-05/CODE-04 (Salary totals from the rounded parts; existing records untouched), CODE-03 (perf seed counted back from today), WORK-210(b) (wall-time bound, reported, never asserted), the WORK-22 re-take, and WORK-22 delegation (one listener per list; no measurable change to All Time). Sprint 4 review fixes: CODE-01 (the four row buttons clicked through the delegated handlers), CODE-02/UI-01 (delegation comment), CODE-03/CODE-04 (perf.js C44 statements; the bound is one-sided), UI-01 (All Time deferral pointer), UI-02/CODE-05 (this state). Reports: `ui-review-sprint4.md`, `code-review-sprint4.md`, `chief-architect-sprint4-review.md`. **State:** v30 staged on `main`, not deployed; live `sw.js` at v29 (confirm before deploy).` After the deploy, the implementer updates the state lines in the same form as v29's. |

**Conditions of approval (probes and proofs).** Each red is recorded in its commit message.
- **CODE-01:** two stated mutations, each reverted after it is shown red.
  - **Mutation 1:** delete the `#expList` `addEventListener` call. The new flow goes red at step (2).
  - **Mutation 2:** in the `#expList` handler, change the Planned branch to `db.actual = db.actual.filter(...)`. The new flow goes red at step (4).
  - Then `npm test` is green.
- **CODE-02 + UI-01 comment:**
  - This is not an assertion and must not be described as one.
  - The commit shows the old and new comment side by side.
  - `rg -n "over 200 ms" expense-pwa/index.html` returns no match.
  - `git diff --name-only` = `expense-pwa/index.html`.
- **CODE-03 + CODE-04:**
  - `rg -n "not fire or close one" tools/harness/perf.js` returns no match.
  - `rg -n "The bound is one-sided" tools/harness/perf.js` returns one match.
  - `git diff --name-only` = `tools/harness/perf.js`.
  - `node tools/harness/run.mjs tools/harness/perf.js` still prints `wall_clock_ms` beside `in_frame_ms_total`.
- **UI-01 record:**
  - `rg -n "chief-architect-sprint4-review.md \(UI-01" reports/HANDOFF.md` returns one match.
  - `git diff --name-only` = `reports/HANDOFF.md`.
- **UI-02 / CODE-05:**
  - ``rg -n "Nothing on `main` is undeployed" reports/HANDOFF.md`` returns no match.
  - `rg -n "v30" reports/HANDOFF.md` matches the staged bullet and the Sprint 4 state line.
  - `git diff --name-only` = `reports/HANDOFF.md`.
- **All:** `npm test` green after every commit, with all seven standing gates.

**Carried.** None. Every approved item is fix-now.

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| CODE-04, the wording as recommended | "The bound sees only a clock running fast… it can support a figure above a threshold by more than the bound's margin" | The direction is reversed. The bound's one fact is that real in-frame time is at most the wall time. If the frame clock runs at k virtual ms per real ms, then T/k ≤ W, so k ≥ T/W. That bounds a slow clock (understatement, at most W/T, about 2.2x in the re-take). It does not bound a fast clock (overstatement) unless T reaches W. Writing the recommended sentence would put a reversed rule into the design record of the instrument C44 exists to discipline. The finding is approved with the corrected sentence above. |
| CODE-04, optional "about 2.2x margin" note in HANDOFF | Note the margin beside the re-take | As proposed, it describes a fast-clock margin the bound does not have. The corrected `perf.js` sentence already states what the ratio means. A second statement of it is a second place for it to go wrong. |
| UI-01, trigger "an All Time figure above a stated bound" | A `perf.js` figure crossing a number as the deferral's trigger | Under the corrected reading, the bound cannot confirm a figure above a threshold at any margin, so this trigger could never fire cleanly. It is also already true at the measured store, and a trigger that is already true is not a trigger. The deferral's triggers are facts about real stores and real changes instead (see Deferred). |
| A pagination or virtualisation round now | Open the All Time design round in Sprint 5 | Work not done is the cheapest work there is. The cost has an escape hatch the user already has: the default view, This Month, measures 6 ms. The figure comes from a synthetic store of 10,000 records per list, and no real store has been observed slow. The right shape is not known. Pagination changes how a money list reads and must not drift into a cap. Virtualisation adds complexity and accessibility cost to a single-file app. This is a deferral with sharp triggers, not scheduled work. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **UI-01 (the All Time list render cost)**: the row-build half of WORK-213, left after WORK-22 delegation | Building every row of a long Income or Expenses list on each add, edit or delete under All Time | **Fires on the first of:** (a) any observation of a slow Income or Expenses list on a real store, from the owner or a user report; (b) a real store with more than 2,000 records in either list; (c) any proposal that changes how `renderIncome` or `renderExpenses` builds its rows (a Planned-mode occurrence view, grouping, or pagination by another name). **When it fires:** an architect round opens before anything is built. That round has pagination and virtualisation in scope, a row cap excluded (permanently rejected, WORK-213 cap shape), and is preceded by one decomposition measurement in `perf.js`, no new instrument: string build timed separately from the `innerHTML` assignment. Under C44 and the corrected calibration sentence, that measurement informs the round and fires nothing. **Why 2,000:** a count on a real store is a fact, not a `perf.js` figure. The synthetic per-row cost corroborates the choice, as C44 permits for a deferral that stands, and establishes nothing. |
| Code review Technical Debt: the `perf.js` header tally ("six since `crosswindow` joined") and the WORK-16/49 block's "This Month specifically" trigger statement | Stale statements outside the blocks Sprint 4 and this ruling open | **Due when either block is next opened.** In that commit, the sentence states the rule, not the count, and the WORK-16/49 statement names All Time as re-aimed at Round 14 S3. No sweep now: the coding standard binds the block you open, and these are not the blocks opened here. |
| Code review Technical Debt: the WORK-16/49 seed is fixed to 2024-2026 | From 2027-01-01 the Dashboard This Month figure times an empty month | **Due on the first WORK-16/49 re-take, or when that block is opened**, whichever comes first. Then the same count-back anchor as Sprint 3's CODE-03 lands in that commit. This Month is no longer the trigger configuration (Round 14 S3), so no decision currently rests on this figure. |
| Code review Technical Debt: pre-v30 Salary records off by up to ₮1 per part | Stored history as written | **Kept closed by ruling** (Sprint 3: no migration). Reopen only if a reviewer shows a user acting on a pre-v30 history row as wrong. |

**Closed by this ruling (listed so the IDs resolve):**
- **WORK-22**: delegation landed in the pre-ruled WORK-213 shape and stays. It is behaviour-identical, and with CODE-01 it is probed. Its remaining cost moves to the UI-01 row above.
- **WORK-210(b)**: landed, reported and never asserted, with its reading corrected by CODE-04.

## Conflict Rulings

**The remaining All Time cost: deferral row or next round.**
- **Deferral row.** It is in Deferred, and HANDOFF points to it (UI-01 record half).
- The Sprint 3 ruling recorded this exact risk ("Delegation removes listener cost, not DOM build cost… no further change is pre-ruled"). The re-take confirmed it.
- What the record lacked was a trigger. A cost that is nobody's item will be reached for under time pressure, which is the Future Risk Code Review named. The row removes that risk at the cost of one table entry.
- **On process:** the implementer was right not to write the row and not to choose a next step. Writing a deferral row is a ruling.

**CODE-04: what the WORK-210(b) bound can see. I correct the reviewer.**
- **The finding stands:** the calibration paragraph does claim more than the instrument delivers. **The recommended remedy has the direction reversed.**
- Wall time bounds real in-frame time from above. So it caps how far figures can understate real time (a slow clock, at most W/T). It cannot rule out a fast clock that inflates figures unless T ≥ W.
- The corrected sentence is in Approved. The consequence becomes standing: **any decision resting on a `perf.js` figure, firing or closing, goes up for a ruling with both numbers beside it.** Nothing pre-ruled may fire on a `perf.js` figure alone.
- **The WORK-22 firing is not reopened.** It met the condition my Sprint 3 ruling set ("no gross dilation"). Its outcome, delegation, is behaviour-identical and justified on its own terms (one listener instead of two per row, no behaviour change, and from now on probed). The figures it rested on are the kind this correction says the bound cannot confirm. That is recorded under Risks, not reversed.

**Overlaps:**
- **UI-01 = CODE-02 (the comment half).** One commit, in `index.html`. UI-01's record half is a separate HANDOFF commit. They are different files and different acts, and UI-01's "same commit" suggestion is not taken.
- **UI-02 = CODE-05.** One item, one HANDOFF commit. CODE-05's state-line wording is adopted, extended with the Sprint 4 bullet.
- **UI-01 = Code review Future Risks (All Time cost).** Answered by the UI-01 deferral row.
- **CODE-03 + CODE-04.** One commit. Same file, same subject (what a figure may settle). They are not unrelated changes.

**Reviewers' Future Risks:**
- **"The first `perf.js`-based closure."** Answered by the corrected CODE-04 sentence. Closures and firings both go up.
- **"A later rewrite of `renderExpenses` touches `#expList` with no click-level probe."** Answered by CODE-01 landing first, and by trigger (c) of the UI-01 row.

## Development Order

**Fix now, then the v30 deploy:**
1. **CODE-01.** The probe over the delegated handlers that v30 ships. The guard comes first, and the step 2 comment edit then sits in code already under probe.
2. **CODE-02 + UI-01 comment half.** The only `index.html` change, and the last edit to a shipped file.
3. **CODE-03 + CODE-04.** The `perf.js` C44 statements, before any HANDOFF text points to the deferral that depends on them.
4. **UI-01 record half.** The HANDOFF pointer to the deferral row.
5. **UI-02 / CODE-05.** The HANDOFF Sprint 4 bullet and the v30 state, last, so it lists what actually landed.
6. Confirm that the live `sw.js` reads `expense-tracker-v29` and `main` reads v30. Run `npm test` green with all seven gates, then deploy v30 on the owner's word. Update the HANDOFF state lines to "v30 is live" in the v29 form.

*Reasoning:* the probe comes before the code it guards ships. Files that ship come before files that do not. The instrument's rule is corrected before the record cites a decision that depends on it. The deploy state is written last, so it describes what landed.

**Next sprint:** nothing is carried from Sprint 4. The next work comes from the standing decision's remaining items and from any trigger above that fires.

## Architecture Strategy

**Stays:**
- `writeDb` as the single write path, `commitWrite` as its one wrapper, and the standing rule that every new write path uses it.
- **Delegation as the pattern for any list rebuilt with `innerHTML`:** one listener on the container, bound once, using `closest()`, as `data-show-all` does. Any mode-dependent branch reads its mode at click time, and that is sound only while every mode change re-renders the list.
- The Salary rule: every total is computed from the rounded figures shown.
- C44, and WORK-210(b) reported and never asserted.
- Every Sprint 2, 3 and 4 ruling.

**Changes:**
- **The WORK-210(b) bound is read as one-sided.** It caps understatement and cannot confirm a figure above a threshold. Any decision resting on a `perf.js` figure goes up for a ruling with both numbers beside it.
- **A deferral's triggers prefer facts about real stores and real changes over synthetic figures crossing a number.**

**Off limits:**
- A row cap on any list, in any form.
- Pagination, virtualisation, or incremental rendering without the UI-01 round.
- Asserting any `perf.js` figure, or adding `perf.js` to the standing commands.
- Migrating stored salary records.
- Comment sweeps beyond the named sentences, including the `perf.js` header tally until that block is opened.
- A second write path, a store library, or any rewrite.
- Everything already off limits in `chief-architect.md`, `chief-architect-sprint2-review.md` and `chief-architect-sprint3-review.md`.

**Risks (stated as risks, not findings):**
- **The WORK-22 firing rested on figures the bound cannot confirm** (above threshold; overstatement unbounded). No harm follows, because delegation is behaviour-identical, probed, and kept on its own merits. The UI-01 deferral stands as a deferral, which C44 permits figures to corroborate.
- **Heavy users who choose All Time** wait on each add, edit or delete, and the cost grows with history. The default view is cheap, and the UI-01 triggers are the guard.
- **`#expList` reads `expMode` at click time.** That is correct only while every mode change goes through `setExpMode`, which re-renders the list. A future path that changes `expMode` without re-rendering would let a Delete act on the wrong collection. CODE-01's Planned-mode step catches the current shape, not a new path.
- **After v30**, a Salary save with the same inputs as an older record can show a net a few tugrik different. This was accepted in Sprint 3.

## Final Recommendation

Next, add the CODE-01 flow to `tools/harness/accounts.js`. Click `[data-edit-inc]`, `[data-edit-exp]` and `[data-del-exp]` through the real buttons in Actual mode, then `[data-del-exp]` on a recurring plan in Planned mode. Assert the edit kinds, zero confirms on Edit, the series sentence, and that only the right collection changed. Show it red once with the `#expList` listener removed and once with the Planned branch filtering `db.actual`, revert, record both reds, and merge once `npm test` is green. Then work down the fix-now order to step 6, and deploy v30 after confirming the live `sw.js` still reads v29.

Relevant files:
- D:\3_Claude\PowerApps\reports\ui-review-sprint4.md
- D:\3_Claude\PowerApps\reports\code-review-sprint4.md
- D:\3_Claude\PowerApps\reports\chief-architect-sprint3-review.md
- D:\3_Claude\PowerApps\reports\archive-chief-architect-round14.md
- D:\3_Claude\PowerApps\reports\HANDOFF.md
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\expense-pwa\sw.js
- D:\3_Claude\PowerApps\tools\harness\accounts.js
- D:\3_Claude\PowerApps\tools\harness\perf.js
- D:\3_Claude\PowerApps\tools\harness\run.mjs
