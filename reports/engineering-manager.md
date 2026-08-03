# Engineering Manager — Work Plan, Round 8

**Sources read in full and unmodified:** `D:\3_Claude\PowerApps\reports\ui-review.md` (6 findings, 80/100, one High), `D:\3_Claude\PowerApps\reports\code-review.md` (8 findings, 82/100, one High). Also read before merging: `knowledge/review-conventions.md`, `knowledge/project.md`, `reports/chief-architect.md` (round-7 standing decision, WORK-111..WORK-127), `reports/HANDOFF.md`.

14 findings in, 14 `WORK-` items out, numbered WORK-128..WORK-141. Two findings merged into shared items; two findings split because they bundle sites at different severities and merging them would have required me to overwrite a reviewer's severity. Every source ID is accounted for. No finding is dropped.

---

## Project Health

Two reviewers working in parallel returned 80 and 82 — both in the "Solid" band — with **one High each, and the two Highs are different defects in different layers**. Round 7 is genuinely on disk: both reviewers independently re-derived the gate work (`load()` total, the `d` discard at `:3012`, `boot-crash.js` asserting the property, `v1` asserting every value it records, `drawPvA` keyed by `categoryId`) rather than trusting the commit record, and all four commands exit 0. Against that, the app currently scrolls sideways on every phone in a named core module, and a recurring plan anchored before today fires a daily OS notification for a date seven months past while offering the user a button that fabricates an actual expense per tap. **The build is not releasable in the state these two Highs describe, and neither is expensive to fix — every item this round is XS or S, and the round totals under three engineering days.**

---

## Priority Matrix

No item is P0. **Neither reviewer raised a Critical**, and I will not manufacture one from two Highs.

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| **WORK-128** | A recurring plan anchored before today is permanently overdue; the only remedy offered fabricates one actual expense per tap | CODE-01 | High | P1 | S | Architect ruling C28 |
| **WORK-129** | `.grid-2` has no breakpoint and no `min-width: 0`, so the Salary Calculator's inputs cannot compress and every phone scrolls sideways | UI-01 | High | P1 | S | WORK-130 (for its measurement only) |
| **WORK-130** | The width-mode harness reserves a 15px desktop scrollbar, so every recorded width is a viewport no phone has | CODE-04 | Medium | P1 | S | — |
| **WORK-131** | `button.danger:hover` composites the destructive-confirm label with `filter`, dropping it below AA in seven of sixteen themes | UI-02 (a) | Medium | P2 | S | — |
| **WORK-132** | The Analytics calendar anchor syncs on preset *change* but not on *restore*, so WORK-118's symptom returns on every cold start | UI-03 | Medium | P2 | S | — |
| **WORK-133** | "Save & Add as Income" writes the record without moving the Income filter to a period that shows it | UI-04 | Medium | P2 | XS | — |
| **WORK-134** | `load()` hands the module-level default arrays into `db` by reference, so a rename mutates the constants and Reset All does not restore defaults | CODE-02 | Medium | P2 | XS | — |
| **WORK-135** | A full quarantined copy of the database outlives a successful recovery, unreachable, for the life of the origin | CODE-03 | Medium | P2 | XS | — |
| **WORK-136** | `npm run recurrence` never executes the open-ended horizon its header says it guards | CODE-05 | Medium | P2 | S | — |
| **WORK-137** | `.val-zero` paints text through `opacity` — a live member of the class ruling C22 closed as a property | UI-02 (b), CODE-07 | **Medium (UI-02) / Low (CODE-07)** — see C27 | P2 | XS | — |
| **WORK-138** | The `.cal-grid` comment states WORK-97(b) is settled and, forty lines later, that it is open | UI-05, CODE-06 | Low | P3 | XS | WORK-130 |
| **WORK-139** | The converter's inline `opacity`/`cursor` writes duplicate `button:disabled` on the one label that explains why the action is unavailable | CODE-07 | Low | P3 | XS | — |
| **WORK-140** | `aggregationEnd`'s comment claims Planned and Actual cover the same window; on All Time with a future-dated actual they do not | CODE-08 | Low | P3 | XS | — |
| **WORK-141** | The four reminder checkboxes are sized and painted by the rule authored for text fields | UI-06 | Low | P3 | XS | — |

### Merges and splits — what I did to the reviewers' findings

**Corroboration, not duplication.** Two of these items exist because the reviewers found the same thing without conferring:

- **WORK-138 (UI-05 + CODE-06).** Both reviewers opened the same comment block, both found `:1619-1620` asserting WORK-97(b) is settled against `:1659-1662` asserting it is open, both found the third instance at `:1670-1671`, both reached the same fix (delete, do not rewrite), and both rated it Low. CODE-06 adds one observation UI-05 does not: the `#dpGrid` paragraph is written twice (`:1647-1652` against `:1659-1661`). Two independent reads reaching the same deletion is the strongest evidence in the round for an item this cheap.
- **WORK-137 (UI-02 part b + CODE-07).** Both reviewers independently found that `opacity` over text survives at sites WORK-117 did not reach, and both named `:1713` (`.val-zero`) as a live instance. They differ on severity and on scope — recorded as **C27**, not resolved here.

**Splits, made to preserve severity rather than to create work:**

- **UI-02 → WORK-131 + WORK-137.** UI-02 is one Medium finding covering two mechanisms. Its `button.danger:hover` half carries the Medium's weight (recomputed contrast 4.83 → 4.22 in five themes, 4.69 → 4.11 in rose, 4.63 → 4.06 in owl, on the OK button of every confirmation dialog) and was found by UI Review alone. Its `.val-zero` half is the site Code Review also found. Bundling them would have forced a single severity onto a pair the two reports rate differently.
- **CODE-07 → WORK-137 + WORK-139.** CODE-07's `:7039`/`:7040` converter case is a distinct defect — a duplicated inline style against `coding-standards.md`, on the only text that tells the user why the primary action is unavailable — that UI Review did not see and that has a different fix from `.val-zero`.

---

## Quick Wins

A caveat first, because the section is misleading this round: **no item in this round exceeds S effort**, so almost everything technically qualifies. These are the ones where a single edit at a site that already carries the pattern removes a Medium or higher.

| Item | Why it is a quick win |
|---|---|
| **WORK-133** (XS, Medium) | Three lines at a site whose two siblings — `incAdd:4696` and `expAdd:5063` — already carry `revealEntryDate`. Closes the documented route by which duplicate income records, and therefore a wrong Dashboard income total, get created. |
| **WORK-134** (XS, Medium) | One helper used at four adjacent lines in `load()`. Removes the only path by which a render-time rename reaches a module constant, in the one function that reads untrusted bytes. |
| **WORK-135** (XS, Medium) | One call after a confirmed restore, following the precedent eight lines away at `:5728`. Stops a full duplicate of the user's financial history sitting permanently in a ~5 MB quota. |
| **WORK-137** (XS, Medium/Low) | One declaration becomes a token colour. |
| **WORK-129** (S, High) | One declaration — `.grid-2 > * { min-width: 0; }` — matching the precedent already in the file at `:1115`. The *fix* is XS-sized; the S is the measurement discipline around it. |

**Not a quick win despite being cheap:** WORK-128 is S and its implementation is one function, but it cannot start until the architect settles what "due" means. Cheapness does not move it earlier; the ruling does.

---

## Sprint Plan

**Sprint 1 — the two Highs, the instrument one of them is verified with, and the three XS data-layer/duplicate-entry closures.**

| Order | Item | Effort |
|---|---|---|
| 1 | **WORK-130** — remove the reserved gutter from the width-mode host; record in `run.mjs`'s header that `innerWidth` includes a gutter and `clientWidth` does not; re-record the four rows at `index.html:1609-1613` and `:1625-1629` | S |
| 2 | **WORK-129** — `.grid-2 > * { min-width: 0; }` with the derivation as a comment; confirm the deficit at 320/360/390/430px on the *corrected* harness, before and after, with the probe calling `navigate('salary')` first | S |
| 3 | **WORK-128** — change what "due" means for a never-logged past anchor, in `nextPlannedDue` alone. **Blocked until C28 is ruled.** | S |
| 4 | **WORK-134** — deep-copy the defaults at all four `load()` fallbacks | XS |
| 5 | **WORK-135** — clear the quarantine after a confirmed restore; narrow the comment at `:2831-2832` to what the call above it establishes | XS |
| 6 | **WORK-133** — mirror `:4696-4699` in the salary handler | XS |

**Total: three S plus three XS ≈ 1.5 engineering days.**

**What the sprint delivers.** The Salary Calculator stops shearing sideways on every phone and its right-hand column — half the fields the module exists to collect — becomes reachable. A recurring plan anchored before today stops reporting four past dates under "📅 Next:", stops holding an undismissable urgent badge, stops firing a daily OS notification, and stops offering a button that inflates recorded spending. The only instrument in the project that can answer a width question starts measuring a viewport a phone actually has. Reset All Data restores the real defaults. A restored backup no longer leaves a full copy of the user's financial history in the origin. And back-dating a pay period stops producing an income record the Income screen silently refuses to show.

**Why I stopped there.** Six items, one of them gated on a ruling. WORK-136's two recurrence flows and WORK-131's per-theme token derivation are each a genuine S and would push this past two days with a blocked item still in it. An honest 1.5 days beats an optimistic 3.

---

## Roadmap

| Sprint | Items |
|---|---|
| **Sprint 1** | WORK-130, WORK-129, WORK-128, WORK-134, WORK-135, WORK-133 |
| **Sprint 2** | WORK-131, WORK-132, WORK-136, WORK-137 |
| **Sprint 3** | WORK-138, WORK-139, WORK-140, WORK-141 |
| **Later** | None. No finding from this round is deferred. |

The standing deferrals in the round-7 decision — WORK-85/WORK-35, WORK-16/WORK-49, WORK-15, WORK-17, WORK-23, WORK-30, WORK-31 and Stage 2 — carry forward untouched. **None of their triggers fired.** Code Review restated the scan costs and explicitly took no measurement (third round of declining to re-raise WORK-16/49), and re-derived all four fixture totals (290,000 / 360,000 / 260,000 / 50,000) and the 31st clamp by hand, finding every one correct — **so Stage 2's trigger is unfired for the seventh round running.** I am not scheduling any of them.

---

## Dependencies

**WORK-130 → WORK-129.** UI-01's own recommendation is to confirm the deficit with the width-mode harness at four viewports. CODE-04 establishes that harness currently lays out 15px narrower than the width it claims. Measuring WORK-129 on the uncorrected harness would over-report the overflow and write a fourth wrong figure into the source — the exact class HANDOFF calls the expensive one, and the class that has now cost this project instrument findings in rounds 4, 5, 6, 7 and 8. UI-01's *fix* does not depend on WORK-130; its *evidence* does. Land the harness first.

**WORK-130 → WORK-138.** Both touch the same comment block at `index.html:1609-1671`, and Code Review recommends riding them together as one pass. There is also an ordering constraint with teeth: WORK-138 deletes the paragraph that says WORK-97(b) is open, leaving only the settlement. If it lands before WORK-130 re-records the figures, the surviving text asserts a settlement resting on measurements already known to be wrong. Re-record, then delete.

**Architect ruling C28 → WORK-128.** CODE-01's recommendation states outright that one question belongs to the architect: whether an un-logged occurrence in the *recent* past should still nudge. The implementation is one function either way, but the two answers produce different user-visible behaviour and the function's contract is what four consumers read. Do not start it on a guess.

**Architect ruling C27 → WORK-137 (scope only).** The fix at `:1713` is uncontested and could ship today. What needs the ruling is whether `button:disabled` at `:1069` and `.list-item .actions button:disabled` at `:1112` are in scope, since the two reviewers reach opposite conclusions about them. Ship the `:1713` change on its own merit; hold the disabled-control question.

**Not a dependency, contrary to how it looks.** WORK-131 and WORK-137 both end with a `check-contrast.mjs` run and WORK-131 adds a pair-table row. They share a tool, not a prerequisite; either can land first.

**Not a dependency, but worth naming.** CODE-05 records that no assertion anywhere calls `nextPlannedDue`. WORK-136's two proposed flows guard `expandPlannedInRange` and `hasPlannedOccurrence`, not `nextPlannedDue`, so WORK-136 does not guard WORK-128. Under the standing convention — *land tooling before the fix it will verify, and demonstrate every new assertion red before trusting it green* — that gap is a question for the architect, raised in Recommendations. I have not scheduled a probe flow for it, because neither reviewer asked for one and inventing work is not mine to do.

---

## Conflicts

Four, for the Chief Architect. I have not resolved any of them.

### C27 — Severity and scope of `opacity` over text at the sites WORK-117 did not reach

**Position A (UI-02, Medium).** `.val-zero` at `:1713` is one half of a Medium finding. UI Review computed light-theme `--text-2` at 50% over `--surface` as **2.34:1** against a pair table declaring roughly 7.5:1, and states plainly that `:1069` and `:1112` are **not findings** — WCAG 1.4.3 exempts inactive controls — and enumerates five further sites (`.list-item.dragging`, `.empty-state svg`, `.cal-legend .swatch`, `.cal-cell::before`) as explicitly not findings, so they are not re-raised.

**Position B (CODE-07, Low).** The same `:1713` site is one of three live instances, rated Low overall because the predicate reports nothing about any of them and the two disabled-button rules cause no conformance failure. Code Review nonetheless lists `:1069` and `:1112` as live instances of the standing convention rather than as exempt.

**What the architect must settle.** (a) Which severity `.val-zero` carries — Medium or Low. (b) Whether ruling C22, as amended in round 7 to name a *property* ("no `opacity` on a text-bearing element") rather than a mechanism, carves out inactive controls that WCAG exempts, or whether the property admits no exception. The two reports read the same standing ruling and reach opposite answers on the same two lines. I have priced WORK-137 at P2 to avoid summarising a Medium into a Low; if the ruling is Low, it drops to P3 and moves to Sprint 3.

**One observation the architect should weigh, in neither report's framing.** C22 was ruled in round 7 explicitly to close the *class* rather than the *case*, on the stated reasoning that "the next round finds `filter: brightness()` and asks the same question a third time." One round later, both reviewers found surviving `opacity` over text, and UI Review found a surviving `filter: brightness(1.08)` over text at `:1067`. The ruling closed the class; the implementation closed one case.

### C28 — CODE-01's deferred decision: does a recently un-logged occurrence still nudge?

Handed to the architect by the reviewer, not by me. CODE-01 states: *"This needs an explicit engineering decision on one question — whether an un-logged occurrence in the recent past should still nudge — so the decision belongs to the architect; the implementation is one function either way."*

**The two shapes.** Start the walk at the first occurrence on or after today, and a plan whose payment was genuinely missed yesterday goes silent. Or keep a bounded lookback, and the definition of "bounded" is a new constant with no derivation behind it.

**What is not in dispute**, and the architect should note it as a boundary on any ruling: the reviewer rejects fixing this by moving the anchor, because `plannedOccurrences:4924` walks from `p.date`, so moving it forward makes every past period report Planned ₮0 — the exact defect the v1→v2 migration at `:2639-2646` was written to end. The reviewer also verified the blast radius: `nextPlannedDue`'s only callers are `computeReminders:4000`, `upcomingPlannedDates:5014` and the convert handler at `:4124`/`:4133`, and the aggregation path does not call it, so no past-period total moves.

### C29 — CODE-04 against WORK-97(b)'s settlement record

**Position A (CODE-04).** The four recorded rows at `index.html:1609-1613` and `:1625-1629` differ from their stated viewport by a constant 73px, against a declared inset of 58px. The unexplained 15px is Chrome-on-Windows' reserved scrollbar inside the 820px-tall host frame. Corrected, the tracks become 35.7 / 41.4 / 43.6 / 45.7 and the crossover to "no overlap" moves from 390px to ~375px. The reviewer states explicitly that **the decision survives correction** — the overlap is smaller, so accepting it is if anything better supported — but that the derivation recorded in the source is wrong.

**Position B (the standing record).** `HANDOFF.md:42` records WORK-97(b) as **SETTLED**, "do not reopen without a new argument". Ruling C24 made WORK-114 a binding precondition of that settlement, and that precondition was met.

**What the architect must settle.** Whether re-recording the figures constitutes reopening a settled decision, or whether it is the correction of a record that a settled decision rests on. The reviewer's own framing is that this is the latter. I note the sharpest line in CODE-04's evidence, because it bears on the harness's stated self-check rather than on WORK-97(b): `run.mjs:27-28` claims *"A probe that reports its own innerWidth is the only way to know what it measured"*, and `window.innerWidth` **includes** the scrollbar — so the one self-check the harness documents is precisely the one that cannot reveal this fault.

### C30 — WORK-118 established a property that the merged implementation does not hold

**Position A (UI-03).** The clamp lives inside `presetEl.addEventListener('change', …)` at `:3862-3874`. The restore path at `:3814-3826` sets `presetEl.value` in script, which fires no `change` event, and contains no call to the clamp. `calDate` is initialised at `:6458` to the first of the current month unconditionally. So the Peak day tile names a date the calendar below it is not showing on every cold start, for the same six of nine presets WORK-118 was raised for.

**Position B (the standing record).** WORK-118 was approved under ruling C26 in the reviewer's shape, with the ◀/▶ arrows as the stated acceptance test, implemented and merged.

**Why this is for the architect and not for me.** The technical fix is uncontested and cheap — extract the clamp, call it from both sites, guard on `prefix === 'daily'`, do not call it from `applyPreset`. What needs a ruling is process, and it is the architect's own language that raises it: C26 stated that *"an approval that establishes a property is met when the property holds, not when the named line is edited."* This is the second consecutive round in which that sentence applies to the same property — WORK-95 established it, WORK-118 was approved to complete it, and it is still false on the app's most common entry path. The acceptance test named in both approvals (the ◀/▶ arrows) cannot detect a cold-start defect. The architect should decide whether WORK-118 is recorded as incomplete a second time, and whether an acceptance condition that cannot fail on the reported symptom is an acceptance condition.

---

## Estimated Effort

| Band | Items | Composition | Estimate |
|---|---|---|---|
| **P0** | none | — | 0 |
| **P1** | WORK-128, WORK-129, WORK-130 | 3 × S | ~1.2 days |
| **P2** | WORK-131, WORK-132, WORK-133, WORK-134, WORK-135, WORK-136, WORK-137 | 3 × S, 4 × XS | ~1.4 days |
| **P3** | WORK-138, WORK-139, WORK-140, WORK-141 | 4 × XS | ~0.3 day |
| **Total** | 14 items | 6 × S, 8 × XS | **~2.9 engineering days** |

No item is M, L or XL. No rewrite, no new dependency, no new runner, no change to the single-file constraint. This is the same shape as round 7 (~2.7 days, no item above S), which is either a healthy plateau or a sign the reviews are now finding only what fits inside one pass — worth watching, not worth acting on yet.

---

## Recommendations

**One minute, to the Chief Architect:**

1. **Two Highs, two layers, neither expensive, and they are genuinely different defects — do not treat this as one bad round.** WORK-129 is one declaration with a precedent already in the file at `:1115`; WORK-128 is one function with three known callers and no effect on any past-period total. The round is under three days end to end.

2. **Rule C28 first, before anything is implemented.** WORK-128 is the only item in the round blocked on you, it is the item that stops the app fabricating financial records through its own affordance, and CODE-01's Future Risks note is the sharpest argument for urgency: Notifications is a Long-term Vision item, and a permanently-urgent reminder firing a daily OS notification is the shape that gets an app's notification permission revoked. Fix the meaning of "due" before anything is built on top of it.

3. **Land WORK-130 before WORK-129, and treat this as the round's real lesson.** Round 6 proved the machine could say no. Round 7 proved it was asking the wrong question. Round 8 says the machine is asking the right question **in the wrong units** — 15px on a mobile-first app whose supported band is 320–390px is 5% of the viewport. Every width claim the project will ever make comes from this one instrument.

4. **C27 is the one worth your attention beyond its severity.** The disagreement is small; what it exposes is that C22 was ruled to close a class and the implementation closed a case, and both reviewers independently walked back into it one round later. If the property admits an exemption for inactive controls, say so in the convention text — otherwise the next round asks a fourth time.

5. **C30 deserves a sentence about acceptance conditions, not just about WORK-118.** Twice now an approval has established a property, been implemented against a named acceptance test, and merged with the property still false. The arrows could not detect a cold-start defect. That is the same structural mistake as a visibility assertion standing in for a function assertion — one level up, in the approval rather than in the probe.

6. **Two things I could not schedule and am handing you rather than inventing work for.** CODE-05 records that nothing anywhere asserts `nextPlannedDue`, and WORK-136's two flows do not close that. Under the standing convention that every new assertion is demonstrated red before green, WORK-128 changes a contract with no guard at all — you should say whether it needs one and where. And CODE-08's false invariant is Low today, but Code Review names it as exactly what a future Reports module inherits when it re-derives the filter/expand pipeline a seventh time.

7. **Stage 2's trigger did not fire, seventh round running, and this time the evidence is stronger than usual.** Code Review re-derived all four fixture totals and the 31st clamp by hand and found every one correct, and states outright that CODE-01 is a defect in what `nextPlannedDue` *means*, not in what `stepDate` *computes*. The deferral holds on its own stated terms.

**Relevant files:** `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\chief-architect.md`, `D:\3_Claude\PowerApps\reports\HANDOFF.md`, `D:\3_Claude\PowerApps\expense-pwa\index.html`, `D:\3_Claude\PowerApps\tools\harness\run.mjs`, `D:\3_Claude\PowerApps\tools\harness\recurrence.js`, `D:\3_Claude\PowerApps\tools\harness\fixture.js`.
