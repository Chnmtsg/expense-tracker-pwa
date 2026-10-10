# Chief Architect: Sprint 3 Post-Implementation Ruling

**Inputs.** I read both reports in full and changed neither:
- `reports/ui-review-sprint3.md`: UI-01 to UI-05, 91/100
- `reports/code-review-sprint3.md`: CODE-01 to CODE-09, 91/100

I measured them against:
- `reports/chief-architect.md`: the Sprint 3 list, the WORK-10 step 1 shape and its standing rule, and the WORK-22 delegation deferral row
- `reports/chief-architect-sprint2-review.md`
- `knowledge/`
- the two standing rulings the WORK-22 question depends on: C44 and the WORK-210(b) deferral (`archive-chief-architect-round14.md:117`, `:225`, `:229`; `HANDOFF.md:872-875`)

**Checked at source** (`expense-pwa/index.html`):
- `commitWrite` (`:10714-10720`): its replaced-`db` branch hard-codes `DB_REPLACED_MSG` with the title "Not saved".
- `editTargetGone` (`:13186-13189`).
- The account and move deletes (`:10885-10949`).
- `computeSalary` (`:6790-6822`): it rounds each part and each total separately from raw values. UI-05 and CODE-04 are both true.
- The unnamed buttons at `:10419`, `:11865`, `:11867`, `:12139`, `:12984`.
- The `.group-label` uses at `:3147`, `:3238`, `:12915`.

**Implementer's facts, taken as context:**
- The live `sw.js` reads v28.
- On `main`, `sw.js` reads v29 and holds Sprints 2 and 3.
- No v29 build has reached a client.

There is no Engineering Manager roadmap for a post-implementation review. Instead of Manager conflicts, I settle the questions the reviewers sent up and the overlaps between the two reports. No ruled Sprint 3 item is reopened.

## Executive Decision

**Yes. Sprints 2 and 3 are fit for release together as v29, under the v29 key, once the fix-now set below lands and `npm test` is green.**

- Both reviewers confirm that every Sprint 3 item matches its ruling. Neither found a Critical, High or Medium.
- Nothing here is a release gate. The fix-now set is about two hours of XS work, and every item is in lines this deploy introduces or guards. Landing it now costs less than shipping it and carrying it.
- The two items that are not XS stay out of the pending deploy:
  - **The Salary rounding (UI-05/CODE-04)** changes the figure a Salary save writes. It goes to Sprint 4 as its first item, because v29 already holds Sprint 2's financial-data fixes and should not wait behind a new money change.
  - **The WORK-22 delegation decision** is sequenced in Sprint 4 behind the instrument bound that C44 requires.
- No v29 build has reached a client, so no key bump is needed. Confirm that the live `sw.js` still reads v28 before deploying.

## Approved Improvements

**Fix now, before the v29 deploy.** Each row is its own commit, merged `--no-ff`, with `npm test` green after each.

| Item ID | Title | Reason for approval |
|---|---|---|
| CODE-01 | No probe covers the "snapshot before any await" property at `saveEditAccount` | WORK-10 step 1 exists to protect this window. `saveEditAccount` is the only place in the wrapper where the property does any work, and a regression there would currently ship green. **Shape:** harness only. Add one case to `openingWarnFlow`. Inside the stubbed `choiceDialog`, use `wrapperFlow`'s `otherWindow` helper to add an expense on `AO`, then return `'alt'`. Assert three things: the opening amount is unchanged, the open alert reads `DB_REPLACED_MSG`, and `editCtx` is still set (the sheet stays open). It lands **before** UI-01 touches `commitWrite`, so that change is made under the probe. |
| UI-01 | A refused delete says "nothing was saved… save again" | The new refusal names a control that does not exist on that screen, for an act the user did not take. **Shape:** (1) Declare `DB_REPLACED_DELETE_MSG` beside `DB_REPLACED_MSG`. (2) Give `commitWrite`'s options object one optional property, `replaced = { msg: DB_REPLACED_MSG, title: 'Not saved' }`, used only by the `db !== snapshot` branch. (3) The account delete (`:10887`) and the move delete (`:10944`) pass `replaced: { msg: DB_REPLACED_DELETE_MSG, title: 'Not deleted' }`. (4) Do not change `DB_REPLACED_MSG`, `dbReplacedSince`, the edit sheets, or the gone path (WORK-16's sentence stays as ruled). **Exact sentence:** `Another window changed your records while this was open, so nothing was deleted. Check the list and delete again.` **Exact title:** `Not deleted` |
| CODE-06 | The WORK-13 probe only selects buttons that already have an `aria-label` | The regression most likely to hit WORK-13 is a render rewrite that drops the attribute, and this probe cannot see that. Delegation (see the WORK-22 ruling) would be exactly that kind of rewrite. **Shape:** for each list the probe covers, select by data attribute (`button[data-edit-*]`, `button[data-del-*]`, `button[data-goal-*]`, `button[data-debt-*]`, using the attribute names the file actually uses). Fail on a missing label as well as a bare one. Reword the comment so it names the lists covered instead of saying "every list". In this commit, scope it to WORK-13's ruled lists only, so it is green on landing. |
| UI-02 / CODE-07 | Payment and contribution deletes and the goal/debt card actions are still unnamed | One issue, raised by both reviewers. On the two ledgers where a delete returns money to an account, this is the defect WORK-13 was ruled to remove. It also leaves card groups that WORK-13 itself made half-named. XS, aria only, no visible change. **Exact labels:** `Delete payment, ${p.date}, ${fmt(p.amount)}` (`:12139`); `Delete contribution, ${c.date}, ${fmt(c.amount)}` (`:12984`); `Add to ${g.name}` (`:10419`); `Add payment to ${d.name}` (`:11865`); `Mark ${d.name} settled` when not cleared, and `${d.name} is settled` when cleared (`:11867`, aria only, with `title` unchanged). Each label is built as one string and escaped exactly once, as WORK-13's are. In the same commit, extend CODE-06's probe to the two history sheets and these three card actions. |
| UI-03 | "Past moves" reads as one more field label | WORK-15's purpose was to separate the history from the form, and this label only half does that. It is one element added in this deploy. This is not a spacing sweep. **Shape:** `:3238` only, inline: `style="display:none;margin-top:var(--s5);font-weight:600"`. Markup, text and show/hide behaviour do not change. |
| CODE-05 | Two `sSave` comments still name `calcSalary()` as the site that clamps and rounds | These are false design-record comments in code this deploy moved. **Shape:** in the three sentences at `:6895-6901` and `:6918-6920`, replace `calcSalary()` with `computeSalary()`. Nothing else changes. |
| CODE-08 | The WORK-15 comment says the move list is "the only place" a move is undone | An unenforced absolute, which the coding standard forbids. **Exact replacement for the first clause:** `Where moves are reviewed and undone one at a time.` The rest of the comment stays. |
| UI-04 / CODE-02 | The WORK-22 record names the wrong item and leaves the decision unsettled | One issue, raised by both reviewers. The record half is fixed now. The decision is in Conflict Rulings. **Exact replacement** for the last sentence of `HANDOFF.md:123-125`: `Under C44 these figures may not fire a trigger until WORK-210(b) has landed and the run is re-taken. The WORK-22 (delegation) deferral is read against All Time and is sequenced in chief-architect-sprint3-review.md: WORK-210(b), then the re-take, then delegation if the re-taken All Time figure is over 100 ms at the assumed 6x. A row cap stays off limits.` |
| CODE-09 | HANDOFF does not record Sprint 3, the wrapper rule, or the deploy key | The next session would not learn the rule that Sprint 3 exists to establish. **Shape:** (1) Replace the "Next: deploy v29…" line with a Sprint 3 bullet that lists WORK-10 step 1, CODE-04, WORK-21, WORK-22 (measurement), WORK-13 and WORK-15, plus this review's fixes. (2) Add the standing rule verbatim: `Every new write path uses commitWrite; no new hand-placed dbReplacedSince is written.` (3) Record the state: `v29 not yet deployed; Sprints 2 and 3 ship together under v29; live sw.js at v28 (confirm before deploy).` It can share a commit with UI-04/CODE-02 only if that commit touches nothing but `HANDOFF.md`. Separate commits are preferred. |

**Carried to Sprint 4.** Approved now, built after the v29 deploy:

| Item ID | Title | Reason for approval |
|---|---|---|
| UI-05 / CODE-04 | The Salary breakdown's parts do not add up to its totals | One pre-existing issue, raised by both reviewers. The stored `db.salaries` row is inconsistent with itself, and the code's own comment, plus the archived ruling it cites, records this defect as closed. It is a money figure, so it is Sprint 4's first item. **It is not fix-now:** the shape changes the net that a new Salary save writes by a few tugrik, and that should not ride in a deploy that already carries two sprints. **Shape, in `computeSalary` only:** round each part; `gross` = the sum of the rounded parts; `si = r(gross * SI%)` and `wht = r(gross * WHT%)`, both on that integer gross; `deductions = si + wht`; `net = gross - deductions`. In the same commit, rewrite the comment to state the rule the code now enforces: every total is computed from the rounded figures shown. **Do not** touch existing records, and add no migration. The alternative "correct the comment only" is rejected (see Rejected). |
| CODE-03 | The WORK-22 seed stops covering This Month on 2027-01-01 | Needed before the re-take this ruling requires. **Shape:** count months back from `new Date()` instead of forward from 2024. Keep the spread and the record counts. |
| WORK-210(b) (standing deferral, trigger fired) | Out-of-frame wall-clock bound on `perf.js` | Its trigger was "the first time any figure from `perf.js` is proposed as firing a trigger… this lands FIRST." The WORK-22 deferral row makes a decision depend on exactly such a figure, and both reviewers and the HANDOFF entry propose acting on it. **The shape is pre-ruled** (`archive-chief-architect-round14.md:117`): Node bounds the run in wall time around the existing `spawnSync` in `run.mjs`, and the probe reports the sum of its own durations. The result is reported, never asserted. Nothing else in `run.mjs` changes. |

**Conditions of approval (probes).** Each probe must be shown failing on the pre-fix code, or against a stated mutation for harness-only items. Each red is recorded in its commit message.
- **CODE-01:** temporarily pass `db` instead of `snap` at `:13760`. The new case goes red. Revert.
- **UI-01:** `wrapperFlow` asserts, for both the account delete and the move delete under another window's write, that the open alert reads the exact sentence above with the title `Not deleted`, and that the record is still in `db`. It goes red on current `main`. Also assert that `saveEditAccount`'s replaced case still shows `DB_REPLACED_MSG` under `Not saved`; CODE-01's case covers this, so the default is pinned.
- **CODE-06:** temporarily delete the `aria-label` attribute from the income row's Delete. The widened probe goes red, where the current one stays green. Revert.
- **UI-02 / CODE-07:** the extended probe asserts the exact labels for one payment row, one contribution row, and the three card actions, in both settled states. It goes red on current `main`.
- **UI-03:** one assertion that `#trListLabel`'s computed `font-weight` is 600 and its `margin-top` is 24px when moves exist. It goes red on current `main`.
- **UI-05 / CODE-04 (Sprint 4):** take the UI-05 inputs (rate 1,001; 1 OT hour; 1 OT+night hour; 10% SI; 10% WHT) and the CODE-04 inputs (rate 3; OT 1; night 1). For each, assert that `gross` equals the sum of the displayed parts, `deductions` equals `si + wht`, `net` equals `gross - deductions`, the stored `db.salaries` row satisfies the same three identities, and the income written equals the stored `net`. It goes red on current `main`. The existing "no accounts, unchanged screen" and "Salary save ≡ Add Income" probes stay green.
- **CODE-03 (Sprint 4):** run `perf.js` with the clock set to a 2027 date. This Month draws rows. It throws "setup failed" on current `main`.
- **WORK-210(b) (Sprint 4):** reported, never asserted, as pre-ruled. The proof is that the run prints both the wall-time bound and the in-frame sum.
- **All:** `npm test` green after every commit, with all seven standing gates.

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| UI-05 / CODE-04, "correct the comment only" option | Make the comment describe the inconsistent rounding and leave the arithmetic alone | It would turn a closed defect into a documented property of the one payroll calculator. The standing record (`archive-chief-architect-round8.md:108-112`) holds that a breakdown whose parts do not add up to its total fails "the one thing a breakdown exists to do". Rewriting the comment to permit that defect is not a fix. |
| UI-05 / CODE-04, interim comment fix before v29 | Correct the comment now, then correct the arithmetic in Sprint 4 | Two edits to one comment within a sprint, and v29 users see no difference. The comment is corrected in the commit that makes it true. |
| CODE-02, "build delegation now" reading (not proposed; recorded so it is not reached for) | Treat 137/145 ms as having fired the trigger | C44 is binding: a `perf.js` figure may not fire a trigger until WORK-210(b) has landed. See Conflict Rulings. |
| CODE-02, "close the deferral" reading (not proposed; recorded) | Treat This Month (about 30 ms at 6x) as the governing figure and close the item | That reads the trigger against the cheapest configuration. The Round 14 S3 re-aim of WORK-156 already rejected exactly that reading. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-22, delegation (standing deferral; trigger configuration now ruled) | One delegated listener per list instead of per-row listeners | **Settled by the re-take in Sprint 4, after WORK-210(b) and CODE-03 have landed.** If the re-taken All Time figure for either list is over 100 ms at the assumed 6x (over about 17 ms unthrottled), and the WORK-210(b) bound shows no gross dilation, **delegation is approved without another round.** The shape is pre-ruled (WORK-213, `archive-chief-architect-round14.md:226`): one listener per list container, using the existing `data-show-all` pattern, replacing the per-row pair, behaviour-identical. It lands in one commit after WORK-13 (already merged). The widened CODE-06 probe and the existing list flows must stay green, and the figure is re-measured and recorded after delegation. If the re-taken figure is at or under the threshold, the item is closed. |
| Code review Technical Debt: the wrapper's gone path closes the edit sheet | `commitWrite`'s gone branch always runs `closeEditModal()` | No defect today, because the two list deletes have no sheet open. **Settled by** the first non-sheet handler that has an open modal (a history-sheet delete or a bell action) being moved onto the wrapper. In that same commit, add one optional `gone` callback to `commitWrite`, defaulting to `editTargetGone`. Not before, because no caller needs it yet. |
| Code review Technical Debt: six hand-placed `dbReplacedSince` calls outside Accounts | WORK-10 later stages | Unchanged and governed by the WORK-10 deferral row in `chief-architect.md`. Its trigger (c), "a new account-touching flow being proposed", is now armed because step 1 has landed. Nothing in this ruling fires it: the Sprint 4 items change a computation, a harness seed, the runner and a listener pattern, and none of them adds a flow. When it fires, each migrated sheet that has a dialog carries a CODE-01-style cross-window probe inside its dialog. |

## Conflict Rulings

**WORK-22: which configuration the trigger means, and whether WORK-210(b) lands first.**
- **The trigger is read against All Time.** The deferral row names no filter. A trigger is measured against the most expensive configuration a user can reach in normal use, because naming the cheapest one excludes the case the trigger exists to catch. This is the same reasoning that re-aimed WORK-156's trigger at All Time in Round 14 (S3). All Time is one tap away and needs no training.
- **WORK-210(b) lands first.** The two rulings do not conflict. They compose: the Round 19 row decides *what* settles the item, and C44 decides *when* a figure may settle anything. WORK-210(b)'s own trigger has fired, and its shape needs no architect round.
- **Status:** deferred, with the configuration fixed and the sequence fixed (Sprint 4, steps 2 to 5). Not closed, and not approved yet. The unthrottled figures are about eight times the threshold, so approval is the likely outcome, but the rule does not bend for a likely outcome.
- **On process:** the implementer was right that C44 is binding and was right not to build anything. Recording the C44 reading as the outcome, under the wrong ID, was wrong. **Standing rule:** when two standing rulings appear to conflict, the implementer records the conflict in HANDOFF under the correct ID and sends it up. The implementer does not choose. The mislabel ("WORK-13") is corrected under UI-04/CODE-02.

**Overlaps:**
- **UI-02 = CODE-07.** One item, one commit. UI-02's wider scope, which includes the card actions, is approved because it removes the half-named card groups WORK-13 created.
- **UI-04 = CODE-02.** One item. The record fix is now; the decision is above.
- **UI-05 = CODE-04.** One item, carried to Sprint 4, totals derived from the rounded parts.

**Not raised, and kept closed:**
- On a delete whose record another window already removed, the user sees WORK-16's ruled sentence under "Not saved".
- The "This entry" wording.

**Reviewers' Future Risks:**
- The bell's stale-row risk stays as recorded in the Sprint 2 ruling. It becomes due when Notifications work starts.
- Delegation rewriting WORK-13's render functions is covered by CODE-06 landing first.

## Development Order

**Fix now, then the v29 deploy:**
1. **CODE-01.** Harness only. It pins the wrapper's one live await before step 2 edits `commitWrite`.
2. **UI-01.** `commitWrite`'s optional `replaced`, plus the two delete handlers, with the `wrapperFlow` assertions.
3. **CODE-06.** The widened probe, green on WORK-13's ruled lists.
4. **UI-02 / CODE-07.** The labels, plus the probe extension written against CODE-06's selector.
5. **UI-03.** One inline style.
6. **CODE-05.** Comments.
7. **CODE-08.** Comment.
8. **UI-04 / CODE-02.** HANDOFF correction.
9. **CODE-09.** HANDOFF Sprint 3 bullet, the wrapper rule, and the key state.
10. Confirm the live `sw.js` reads `expense-tracker-v28` and `main` reads v29. Run `npm test` green, then deploy v29 on the owner's word.

*Reasoning:* the guard comes before the change it guards. The behaviour and copy fix comes before probe-only work. The probe that catches a dropped label comes before the labels are added. Comments and records come last, so they describe what actually landed.

**Sprint 4:**
1. **UI-05 / CODE-04.** The money figure comes first.
2. **CODE-03.** It makes the measurement repeatable.
3. **WORK-210(b).** The bound, before any figure is acted on.
4. **WORK-22 re-take.** All Time and This Month for both lists, recorded in HANDOFF in the same form, with the bound beside the figures.
5. **WORK-22 delegation**, only if step 4 fires the trigger; otherwise close the item in HANDOFF.

*Reasoning:* financial correctness outranks performance. The instrument is fixed before it is trusted, and it is trusted before anything is built on what it reports.

## Architecture Strategy

**Stays:**
- `writeDb` as the single write path.
- `commitWrite` as the one wrapper over it, and the standing rule that every new write path uses it.
- `editTargetGone(msg)` as the single "sheet closed, nothing was saved" outlet.
- The occurrence rule, the Reset loader rule, and every Sprint 2 and Sprint 3 ruling.
- C44, and the pre-ruled WORK-210(b) and WORK-213 shapes.

**Changes:**
- **`commitWrite`'s refusal wording follows the act refused.** One optional `replaced` message and title. The default stays the save wording, and any future caller that is not a save passes its own words.
- **The Salary breakdown has one rounding boundary in fact, not only in its comment.** Totals are derived from the shown parts (Sprint 4).
- **A trigger stated without a configuration is read against the most expensive configuration reachable in normal use.** This is now standing.
- **Accessible names are probed by data attribute, not by the presence of a label.**

**Off limits:**
- A row cap on lists, in any form. Pagination and virtualisation need their own round.
- Building delegation before the re-take.
- Migrating stored salary records.
- A second write path, a store library, or any rewrite.
- Spacing or comment sweeps beyond the named lines.
- Everything already off limits in `reports/chief-architect.md` and `reports/chief-architect-sprint2-review.md`.

**Risks (stated as risks, not findings):**
- Delegation removes listener cost, not DOM build cost. All Time may still be above 100 ms after it. If it is, the figure is recorded and no further change is pre-ruled. A cap stays rejected.
- After the Salary fix, a new save with the same inputs as an old record can show a net a few tugrik different from that record. Existing records stay as written, and this is acceptable.
- A delete can now be refused under two titles: "Not saved" for the vanished-record case (ruled) and "Not deleted" for the replaced case. This is kept closed. Reopen it only if a reviewer shows it confusing users.

## Final Recommendation

Next, add the CODE-01 case to `openingWarnFlow`: another window adds an expense on `AO` inside the stubbed `choiceDialog`, which then returns `'alt'`. Assert that the opening is unchanged, the alert is `DB_REPLACED_MSG`, and `editCtx` is still set. Show it red by passing `db` as the snapshot, revert, and merge it once `npm test` is green. Then work down the fix-now order to step 10, and deploy Sprints 2 and 3 together as v29, after confirming the live `sw.js` still reads v28.

Relevant files:
- D:\3_Claude\PowerApps\reports\ui-review-sprint3.md
- D:\3_Claude\PowerApps\reports\code-review-sprint3.md
- D:\3_Claude\PowerApps\reports\chief-architect.md
- D:\3_Claude\PowerApps\reports\chief-architect-sprint2-review.md
- D:\3_Claude\PowerApps\reports\archive-chief-architect-round14.md
- D:\3_Claude\PowerApps\reports\HANDOFF.md
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\expense-pwa\sw.js
- D:\3_Claude\PowerApps\tools\harness\accounts.js
- D:\3_Claude\PowerApps\tools\harness\perf.js
