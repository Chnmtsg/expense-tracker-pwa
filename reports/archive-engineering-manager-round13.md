# Engineering Manager — Round 13

*(The agent is read-only by role definition; this is its complete report, transcribed unmodified — including its own inline correction in the coverage line.)*

**Sources read in full:** `D:\3_Claude\PowerApps\reports\ui-review.md` (8 findings, UI-01..UI-08, 90/100, no Critical, no High, two Medium), `D:\3_Claude\PowerApps\reports\code-review.md` (12 findings, CODE-01..CODE-12, 84/100, one High, no Critical, four Medium). **Read as constraint, not as input:** `reports/chief-architect.md` — the round-9 standing decision plus the Round 11 and Round 12 supplementals, all in force, including C34-C41, G12 and the off-limits lists — `reports/HANDOFF.md`, and the four knowledge files.

**Numbering:** WORK-187 through WORK-206. Highest previously used was WORK-186.

**Severity is never edited.** Every severity below is the one the reviewer who raised it wrote. Priority, effort and sequencing are mine.

---

## Project Health

UI Review returned 90/100 with no Critical and no High; Code Review returned 84/100 with one High and no Critical. On both reports' own words the shipped application is releasable — nothing found loses data, misstates a stored figure, or blocks a user — but the two reports combined do not sit in the 90-100 band, because a High exists and it is that `npm run verify` returns 0 on a file whose top-level script cannot parse, a consequence confirmed in practice last round when a backtick killed the application and the gate stayed green. Eight of the twenty findings are about guards, probe comments or the acceptance record rather than shipped behaviour, which is the failure class this project has spent four rounds retiring in its code and is now meeting in its instruments. The honest summary: the build is fit to ship and its gate is not fit to certify that on its own — and every Medium-or-higher finding in both reports is XS or S, so one sprint clears all seven of them.

---

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| **WORK-187** | `npm run verify` returns 0 on a file whose script cannot parse, because `lint.mjs:29` blanks HTML comments across the whole file before the `<script>` boundary pass | CODE-01 | High | P1 | S | — |
| **WORK-188** | Developer commentary lives inside four template literals, is emitted into the user's DOM on every card render, and is the cause of WORK-187's blind region | CODE-02 | Medium | P2 | S | WORK-187 |
| **WORK-189** | A stored non-integer amount is silently multiplied by a power of ten when any edit modal repopulates it — six sites | CODE-03 | Medium | P2 | S | — (scope ruling requested, S2) |
| **WORK-190** | The import handler re-renders four screens; the application has seven, and two of them show money | CODE-04 | Medium | P2 | XS | — |
| **WORK-191** | WORK-176's determinism baseline cannot fail, and its comment claims a property it does not have | CODE-05 | Medium | P2 | XS | — |
| **WORK-192** | The cost helper's "That extra" resolves to the agreed extra, not to the figure it sits under | UI-01 | Medium | P2 | XS | — |
| **WORK-193** | Nothing tells the user the interest split is the app's own even allocation, so the figure will not match the lender's | UI-02 | Medium | P2 | XS | WORK-192 (same block; S1 ruling requested) |
| **WORK-194** | The debt note is the only chip in the application carrying user text with no caption or marker | UI-03 | Low | P3 | XS | — |
| **WORK-195** | The goal history modal re-renders unconditionally after a failed save, presenting an uncommitted delete as committed — and the debt modal's comment says the two paths agree | UI-04 | Low | P3 | XS | — |
| **WORK-196** | `openGoalHistoryModal` sets `editCtx` to a kind with no branch in the save handler | CODE-12 | Low | P3 | XS | WORK-195 (same function) |
| **WORK-197** | WORK-184(a)'s acceptance condition cannot detect the effect of a font-size increase on a wrap-released element | UI-06 | Low | P3 | XS | WORK-199 |
| **WORK-198** | The 320px overflow flow justifies its fixture with `.debt-meta-item`, a class WORK-184(b) deleted, and a property that is now false | UI-08 + CODE-07 (**merged**) | Low / Low | P3 | XS | WORK-197, WORK-199 |
| **WORK-199** | WORK-174's user-visible behaviour is unguarded — nothing asserts the note chip rendered; `E_card_width` is measured and never compared | CODE-06 | Low | P3 | XS | — |
| **WORK-200** | The WORK-173 orphaning demonstration, as recorded, reddens a different assertion than the one it is named for | CODE-08 | Low | P3 | XS | — |
| **WORK-201** | Flow K states its expectation by re-running the application's formula, two flows after the file argues against doing that | CODE-09 | Low | P3 | XS | — |
| **WORK-202** | `renderDebts` scans `db.debtPayments` six times per debt | CODE-10 | Low | P3 | S | — (S3: may be a recorded risk, not an item) |
| **WORK-203** | The service worker cache string was not bumped for round 12, against its own instruction | CODE-11 | Low | P3 | XS | Lands last before any deploy |
| **WORK-204** | The required-field asterisk is decoration on four of five fields, and no edit modal marks required fields at all | UI-05 | Low | P3 | S | — |
| **WORK-205** | A category excluded from the charts keeps its exclusion when it leaves the date range, but its chip does not render, so the control that would restore it disappears | UI-07 | Low | P3 | S | — |
| **WORK-206** | `HANDOFF.md`'s runbook lists four commands where the standing order requires five, and describes `verify`'s coverage as WORK-187 shows it is not | CODE-01 (Future Risks) | — (not graded; carries none of CODE-01's High) | P3 | XS | WORK-187, WORK-188 |

**Source ID coverage — none dropped.**
UI-01→187·wait, corrected: UI-01→192, UI-02→193, UI-03→194, UI-04→195, UI-05→204, UI-06→197, UI-07→205, UI-08→198. CODE-01→187 (and its Future Risks clause→206), CODE-02→188, CODE-03→189, CODE-04→190, CODE-05→191, CODE-06→199, CODE-07→198, CODE-08→200, CODE-09→201, CODE-10→202, CODE-11→203, CODE-12→196. All twenty findings appear.

**Merged: exactly one pair.** UI-08 and CODE-07 are the same finding — the `debts.js:467-472` fixture comment cites `.debt-meta-item`, deleted by WORK-184(b), and asserts an absence of `overflow-wrap` that `.goal-meta-item.note` at `index.html:1502` contradicts. Both reviewers reach the same location, the same mechanism and the same recommendation, and both grade it Low. One item, two source IDs.

**Not merged, and why, for the four pairs that invited it:**

- **CODE-01 and CODE-02 are two items.** They are cause and blind spot, they live in different files (`tools/lint.mjs` and `expense-pwa/index.html`), and they carry different severities that only the reviewer may set. Decisively: the fix for CODE-01 is an instrument and the standing convention is *land tooling before the fix it will verify*, which cannot be expressed if they are one item. Merging would also make one commit that both repairs a gate and edits four regions of the application file it gates.
- **CODE-05 and UI-06 are two items.** Both are "a guard cannot see what it claims" and I am recording that as the round's dominant pattern, but they are different guards on different properties — the WORK-176 determinism baseline, and the WORK-184(a) font-size/overflow condition. Nothing about fixing one fixes or informs the other.
- **UI-01 and UI-02 are two items, in one pass.** Both reviewers say they can ship as one string and they may well do so. They are separately ruled because they are separately decidable: UI-01 corrects a demonstrative that points at the wrong quantity and is uncontested; UI-02 adds new user-facing copy about the app's chosen allocation model, which is a disclosure decision on a screen the architect has been ruling one sentence at a time (WORK-179). Bundling them would hold an XS defect correction behind a decision it does not depend on — precisely the reasoning the architect confirmed at C6 in round 12. If both are approved, one commit and one string is the right implementation.
- **UI-04 and CODE-12 are two items, in one pass.** Both sit in `openGoalHistoryModal`; they are different defects with different acceptance (an unconditional re-render on a failed save; an `editCtx` kind with no save branch). Two one-line changes in one function is the case where the commit boundary must be decided before editing, per `HANDOFF.md:298`. My recommendation is two commits, because they close two different classes; folding them into one is a defensible architect call and costs nothing either way.

---

## Quick Wins

Every Medium-or-higher finding in both reports is XS or S. That is the round's most useful single fact, and it is why the sprint plan below is short rather than optimistic.

- **WORK-187** — S, removes the only High. The gate stops certifying a dead application.
- **WORK-192** — XS, one string. The sentence under the module's headline figure stops describing a different number.
- **WORK-193** — XS, one sentence. The interest figure stops being presented as the lender's arithmetic.
- **WORK-190** — XS, one line, and it closes the class rather than adding the two missing screens.
- **WORK-191** — XS, one re-render between two snapshots.
- **WORK-189** — S, six one-expression edits. A wrong financial figure stops reaching a field the user is about to commit.
- **WORK-188** — S, four comments relocated. The blind region stops being possible.

Do WORK-187 first inside P1. Do the rest first inside P2.

---

## Sprint Plan — Sprint 1 only

**Items:** WORK-187, WORK-188, WORK-189, WORK-190, WORK-191, WORK-192, WORK-193.

**Total effort:** 3 S + 4 XS. Roughly two engineering days, and most of that is the C40 demonstrations and running five commands after each commit, not edit time.

**Order:** WORK-187 → WORK-188 → WORK-189 → WORK-190 → WORK-191 → WORK-192 → WORK-193. Seven commits.

**What the sprint delivers:**

1. `npm run verify` can fail on a syntax error anywhere in the shipped script, and `lint.mjs`'s header stops overstating what it removes.
2. The four regions the linter could not see stop existing, and the hand-written "no backticks in this comment" rule stops being the only thing guarding a parse.
3. No edit modal repopulates a stored non-integer as ten or a hundred times itself.
4. A restore from the banner refreshes the screen the user is actually on.
5. WORK-176's baseline becomes capable of detecting the non-determinism its comment claims it detects.
6. The two sentences under "Paid in interest" describe the figure they sit under and say whose arithmetic produced it.

**This sprint clears every Medium and the single High in both reports.** Nothing Low is in it. That is deliberate: thirteen Low findings at XS-to-S would fit on paper and would dilute a sprint whose first two items are the round's only real risk.

---

## Roadmap

**Sprint 1** — WORK-187, WORK-188, WORK-189, WORK-190, WORK-191, WORK-192, WORK-193.

**Sprint 2** — WORK-199, WORK-197, WORK-198, WORK-200, WORK-201, WORK-195, WORK-196, WORK-194, WORK-206, WORK-203.

**Sprint 3** — WORK-204, WORK-205.

**Later** — WORK-202.

---

## Dependencies

**1. WORK-187 before WORK-188 — and I have inverted the Code Review's stated order, deliberately.**
Code Review's Recommended Refactoring §1 says *"Move the four in-template comments out (CODE-02), then fix `lint.mjs` (CODE-01)."* I am scheduling the reverse, for two reasons. First, the standing convention is *land tooling before the fix it will verify*, invoked three rounds running. Second, and concretely: C40 requires the demonstration to be an artifact — perturb `expense-pwa/index.html` only, `git diff --name-only` must print exactly that path, the command must go red naming the assertion. The perturbation that reddens WORK-187 is a backtick inside one of the four in-template comments. WORK-188 deletes all four. Landing WORK-188 first means the only demonstration available for WORK-187 is one where you first add a comment back — a weaker artifact than the one that already exists and that the user has already run. I am recording the inversion openly so the architect can reverse it if the reasoning is wrong.

**2. Implementation risk on WORK-187, which is not a finding and must not be worked around.**
Once `lint.mjs` stops blanking comments inside script regions, ESLint sees the four comments' real bytes for the first time. They are string content inside template literals, so a `${` in any of them becomes an interpolation and a backtick ends the string. If the clean tree goes red on the very first run after the fix, that is a defect surfacing, not a regression introduced — it gets recorded and fixed, not suppressed by narrowing the regex.

**3. WORK-192 before WORK-193.** Same block of `renderDebts`, and WORK-179's standing condition governs both: *"read the two together and if either restates the other, the gated one is reworded."* The corrected reference must exist before the disclosure sentence is written against it. Commit boundary decided before editing.

**4. WORK-195 before WORK-196.** Same function, `openGoalHistoryModal`. WORK-195's fix introduces a failure branch calling `closeEditModal()`; WORK-196 changes what `editCtx` is set to on open. Sequencing them avoids editing the same lines twice.

**5. The `debts.js` pass: WORK-199 → WORK-197 → WORK-198.** Three items land in the same 25-line overflow flow at `debts.js:461-487`. WORK-199 adds the setup assertion that the note chip rendered; WORK-197 adds the `getClientRects().length` measurement of `.debt-total-item.cost .debt-total-value`; WORK-198 rewrites the flow's justifying comment. **The comment goes last**, because `HANDOFF.md:424-427` makes naming the guaranteed behaviour in the probe's own header a standing rule, and a comment written before the flow's final shape is a comment that will be wrong again by the end of the sprint. WORK-200 and WORK-201 are in other flows and do not collide.

**6. WORK-191 does not collide with the `debts.js` pass.** It is in flow J (`:504-545`); the pass above is flow E. Sequenced apart for review clarity only.

**7. WORK-206 after WORK-187 and WORK-188.** `HANDOFF.md`'s runbook at `:179-187` lists four commands where the architect's Round 12 order requires five — `npm run debts` is missing — and the same block will need to state what `verify` covers once WORK-187 changes that. One documentation edit after both land, not two.

**8. WORK-203 lands last before any deploy.** The reviewer asks for the bump in the round's closing commit. A GitHub Pages deploy workflow now exists (commit `de1360d`), so the constraint is one bump per deploy rather than one per sprint: if round 13 deploys after Sprint 1, the bump moves into Sprint 1's final commit.

**9. WORK-189 has no technical dependency but has an open scope question** (S2 below). If the architect narrows it to the two debt sites, the item stays in Sprint 1 and drops to XS.

**Verification ceiling — checked, and nothing here breaches it.** The ceiling is four plus one and it is a ceiling on **runners**. WORK-187 modifies an existing static predicate behind `verify`. WORK-191, WORK-197, WORK-199, WORK-200 and WORK-201 modify `tools/harness/debts.js`, an existing probe on the existing runner. **No fifth runner, no test framework, no build step, no new file is scheduled anywhere in this roadmap.** Stage 2 remains deferred and nothing this round fires it: the only arithmetic finding, CODE-03, is a repopulation defect in a render expression, not a calculation defect in a money function.

---

## Conflicts

**C1 — The two reports reach different conclusions about the history-modal save handling, and it is a coverage divergence rather than a contradiction of fact.**

- *Code Review's position:* the Error handling review area is **clean**. It states that every debt write captures `save()`'s return and reports through `savedToast`, and specifically that *"the payment-delete re-render is correctly gated on success at `:8642`."* It raised no finding on the goal-side path.
- *UI Review's position:* UI-04, **Low**. The goal contribution-history delete at `index.html:8998-9001` re-renders **unconditionally** — `const ok = save(); openGoalHistoryModal(goalId); …` with `ok` used only for the toast — so on a failed write the list redraws without the deleted row while `savedToast` reports `SAVE_FAILED_MSG`. It further reports that the debt modal's comment at `:8636-8637` asserts *"matching the goal history modal,"* which makes the comment false.

Both examined the same subsystem; Code Review scoped its clean statement to the debt writes and did not re-derive the goal sibling, and UI Review did. Neither is wrong on the facts each checked. **I am not resolving it**, and I have scheduled the repair as WORK-195 at the severity UI Review set. The architect will want to note the consequence for the record: WORK-181's round-12 acceptance condition was *"the re-render after a payment delete happens only on a successful `save()`, matching the goal path exactly"*, and UI-04 reports that the path it was matched against does not have that property.

**No other conflict exists between the two reports.** There is no severity divergence on any shared finding this round — the only merged pair, UI-08 and CODE-07, are both Low — and no recommendation in either report contradicts one in the other. An empty remainder is a valid result and I am not filling it.

### Standing-decision questions — for the architect, not conflicts between reviewers

I record these because each collides with a live ruling, and none of them is mine to settle.

**S1 — UI-02's disclosure sentence against the ruled interest model.** The Round 11 supplemental ruled the proportional allocation at §5(b), rejected the three alternatives by name, and put an interest-rate/APR/amortisation model on the off-limits list. UI-02 states explicitly that it re-proposes none of that; its finding is that *the ruled model is presented without saying it is a model*, and its recommendation is one helper sentence under `.debt-totals`. The questions: is a model-disclosure sentence approved at all; does it stand as a second sentence or fold into WORK-192's rewrite; and does C36 (*one fact per user-facing claim, from the source the app can defend*) govern its wording. Nothing in the off-limits list names it, and nothing in WORK-179's conditions anticipates it.

**S2 — WORK-189's scope: six sites or two.** Code Review's Technical Debt section is explicit: *"Fixing the two debt ones alone would close the case and leave the class, which is the failure mode this project has ruled against twice."* Those two rulings are C33 in round 9 and the widening of WORK-185 in round 12. Against six: four of the sites are outside the Debts module and outside this round's scope of change, and `CLAUDE.md` says never modify unrelated files. I have scheduled all six with the WORK-185 safety valve — if any site turns out not to share the shape, it is dropped and the reason recorded in the commit rather than forced to fit. The architect decides whether six or two.

**S3 — WORK-202 against the standing treatment of unmeasured performance findings.** CODE-10 is arithmetic, not measurement: the reviewer says outright it is *"negligible at realistic sizes"* and reports it only because the review area asks about quadratic work. That is the same shape as WORK-16/49, deferred four rounds under C34 on the ground that a trigger stated as a measurement is discharged only by a measurement. I have placed it in **Later** rather than scheduling it. The architect may prefer to convert it into a recorded risk with a trigger, in the WORK-16/49 shape, so it stops being re-raised — that would be a rejection of an item I did not drop, which is a different thing from dropping it.

**S4 — Two round-12 acceptance sentences rest on properties this round reports do not hold.** CODE-05 says WORK-176's determinism baseline — which the architect made a condition and wrote *"the second is not optional"* — is vacuous by construction, because the two snapshots are taken back to back with no render between them, so `t.J_dropped: "none"` proves nothing. G12 was re-closed on WORK-172, WORK-175 and WORK-176 being green having first been red. Whether the G12 record is reopened again is the architect's call and only the architect's; the repair (WORK-191) is XS and is scheduled either way. WORK-181's sentence is the second instance, described at C1 above.

### Not findings, carried so they are not lost

Neither reviewer raised these as findings and I have created no item for them; both reports record them so the next reader does not re-derive them. Cleared debts accumulate unsorted and unarchived (same exposure as `db.goals`). The isolation assertion covers one of the two write paths into `db.debts` since WORK-173, with the trigger already named. The `goal-*` naming debt on the Debts screen, with its third-module trigger. The `--shadow` / `--e1` divergence and WORK-141, both held behind one screenshot each. The app-wide font-size and spacing sweeps, correctly declined a fifth time by UI Review.

---

## Estimated Effort

| Priority | Items | Effort |
|---|---|---|
| **P0** | none | — |
| **P1** | WORK-187 | 1 S |
| **P2** | WORK-188, WORK-189, WORK-190, WORK-191, WORK-192, WORK-193 | 2 S + 4 XS |
| **P3** | WORK-194, WORK-195, WORK-196, WORK-197, WORK-198, WORK-199, WORK-200, WORK-201, WORK-202, WORK-203, WORK-204, WORK-205, WORK-206 | 3 S + 10 XS |
| **Total** | 20 items | 6 S + 14 XS ≈ 4–5 engineering days |

**There is no P0 in this roadmap because neither reviewer graded anything Critical.** The High goes to P1 by the rule, and I am not promoting it: Code Review states in its own score justification that *"Nothing here blocks release,"* and that the class is caught the moment `npm run boot` or `npm run v1` runs. A cheap fix does not become P0 because it is cheap, and a frightening one does not become P0 because it is frightening.

---

## Recommendations

**One minute, to the Chief Architect.**

Rule on WORK-187 before anything else in this roadmap. It is the only item whose absence lets a completely dead application pass the gate, the demonstration is one backtick and already exists, and the fix is two lines in a static predicate. I have inverted the Code Review's stated order and put the instrument before the cause — WORK-187 before WORK-188 — because C40 requires the red-then-green to be an artifact and WORK-188 deletes the four regions the artifact is produced in; reverse me if you disagree, but decide it before the sprint starts, because the commit boundary has to be decided before editing.

Two of your own round-12 acceptance sentences are named in this round's findings. WORK-176's determinism baseline, which you made non-optional, is vacuous as written; WORK-181's condition was matched against a property of the goal path that UI-04 says the goal path does not have. Both repairs are XS and both are scheduled. Whether the G12 record is reopened a second time is yours, and the roadmap does not depend on the answer.

Then rule the two scope questions, because they are the only ones that change the shape of Sprint 1. S2: WORK-189 at six sites or two — the reviewer warns that two closes the case and leaves the class, and this project has ruled against that twice. S1: whether the application is permitted to tell the user, in one sentence, that the interest split is its own even allocation. That is the only new user-facing copy in the round and it sits on the one figure `project.md` says the Debts module exists to produce.

Finally, the honest release statement. The application is fit to ship on both reports. Its gate is not fit to certify that on its own until WORK-187 lands, and `HANDOFF.md`'s runbook still tells the next person to run four commands where your order requires five. Those two facts belong in the same sentence in the record, and WORK-206 is where I put them.
