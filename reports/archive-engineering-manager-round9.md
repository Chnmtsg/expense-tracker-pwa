# Engineering Manager — Work Plan, Round 9

*(Delivered as the agent's message. The agent holds read-only tools by role definition and has no write tool; the text below is its complete report, transcribed unmodified.)*

**Sources read in full and unmodified:** `D:\3_Claude\PowerApps\reports\ui-review.md` (6 findings, 90/100), `D:\3_Claude\PowerApps\reports\code-review.md` (8 findings, 91/100). **Also read before planning:** `knowledge/review-conventions.md`, `knowledge/project.md`, `knowledge/coding-standards.md`, `knowledge/ui-guidelines.md`, `reports/archive-chief-architect-round8.md` (the standing decision, still in force), `reports/HANDOFF.md`.

Numbering continues at **WORK-151**. Round 8 used WORK-128..WORK-141; the architect's supplementals used WORK-142..WORK-150.

---

## Project Health

Two reviewers working independently returned 90 and 91 with no Critical and no High between them, which is the first round in this project's history where both reports sit in the production-ready band. The build is releasable and nothing in either report meets the P0 bar, so I am opening no gate items — that call remains the architect's. What is striking is the concentration: eleven of the fourteen findings land on one newly-shipped feature, the WORK-142/143 display-currency reading, and both reviewers independently describe that feature's core as correctly built. The honest reading is that this is a well-built feature with a defective perimeter — its instruction names a destination that does not exist, its help line claims a reading the render path may refuse to produce, and the assertion written to guard its most important invariant cannot fail on the symptom it names.

---

## Priority Matrix

There is **no P0 and no P1 this round.** P0 requires a Critical finding and P1 requires a High or a dependency blocking one; neither report raised either. That is a statement about severity, not about importance — sequencing within P2 carries the urgency, and it is stated in Dependencies and the Sprint Plan.

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| **WORK-151** | The storage-invariance assertion cannot fail on the symptom it names | CODE-03 | Medium | P2 | XS | — |
| **WORK-152** | Settings instructs the user to open a "Currency Converter" that no navigation surface is named after | UI-01 | Medium | P2 | XS | — |
| **WORK-153** | The Display Currency help line asserts a reading the render path may refuse to produce | CODE-01 | Medium | P2 | XS | WORK-152 |
| **WORK-154** | A rate from six months ago is given the same treatment as one from this morning | UI-02 | Medium | P2 | XS | WORK-153 |
| **WORK-155** | The Display Currency helper is forced into ~110px of a 320px card by a row that cannot wrap | UI-03 | Medium | P2 | XS | — |
| **WORK-156** | `drawMonthlyTrend` walks the entire database once per month | CODE-02 | Medium | P2 | S | **Blocked** — WORK-16/49 trigger (unfired) |
| **WORK-157** | "≈ USD 0" is printed under a zero or near-zero balance | **UI-06 + CODE-06** | Low | P3 | S | Harness seeding, same commit (hard) |
| **WORK-158** | The Display Currency card is the only Settings card `renderSettings()` does not refresh | CODE-05 | Low | P3 | XS | — |
| **WORK-159** | Both round-9 `renderDashboard()` calls are unreachable as effects, and a comment states the opposite | CODE-04 | Low | P3 | XS | rides with WORK-158 (soft) |
| **WORK-160** | The rate date is a 16-character slice of a third party's free-text field, computed twice | CODE-07 | Low | P3 | XS | WORK-154 |
| **WORK-161** | The ≈ reading is not subordinated by size, and on the Salary card is larger than the figures it reads | UI-04 | Low | P3 | XS | — |
| **WORK-162** | The display-currency picker offers a code with no currency name, where the app's own picker gives all three | UI-05 | Low | P3 | XS | WORK-155 |
| **WORK-163** | `renderSalaryConvReading()` repaints ten elements to refresh one | CODE-08 | Low | P3 | XS | `calcSalary` split (standing debt) |

### Source-ID mapping — all fourteen accounted for

| Source | Absorbed by | Merged? |
|---|---|---|
| UI-01 | WORK-152 | No |
| UI-02 | WORK-154 | No |
| UI-03 | WORK-155 | No |
| UI-04 | WORK-161 | No |
| UI-05 | WORK-162 | No |
| **UI-06** | **WORK-157** | **Yes — merged with CODE-06** |
| CODE-01 | WORK-153 | No |
| CODE-02 | WORK-156 | No |
| CODE-03 | WORK-151 | No |
| CODE-04 | WORK-159 | No |
| CODE-05 | WORK-158 | No |
| **CODE-06** | **WORK-157** | **Yes — merged with UI-06** |
| CODE-07 | WORK-160 | No |
| CODE-08 | WORK-163 | No |

**One merge only.** UI-06 and CODE-06 are the same defect found from two directions — a rounded-to-zero reading printed beneath a figure that already says it, most visibly on the empty Salary form at boot. Both reviewers rated it Low; the merged item stays Low. The two reviewers disagree on the fix predicate, which is recorded under Conflicts, and CODE-06 carries a harness dependency UI-06 does not, which is recorded under Dependencies as a hard same-commit constraint.

### Why UI-01, UI-02 and CODE-01 stay three items and land as one pass

They are three distinct defects. UI-01 is an instruction naming a destination that does not exist by that name. UI-02 is a stale rate presented with the confidence of a fresh one. CODE-01 is a help line claiming a reading the render path may refuse to produce. Three different predicates, three different acceptance conditions, three different symptoms a user would report differently. Merging them would destroy the traceability the convention requires and would produce one item whose acceptance condition could only be "the card reads better", which is exactly the shape the architect's C30 convention disqualifies.

They must nonetheless land as **one pass over `syncDisplayCurrencyControl`, in the stated order**, and this is not a preference. CODE-01 restructures the function from two branches into three; UI-01 rewords branch one; UI-02 rewords branch three and mirrors a change made in a different function. Landing them in arbitrary order means each rewrites text the previous one wrote. `HANDOFF.md:243-245` records that deciding the commit boundary after editing one file has cost this project twice. The boundary is decided here: three commits, one pass, order WORK-152 → WORK-153 → WORK-154.

WORK-155 also touches this card but at the markup (`index.html:2404-2410`), not the JS strings, so it does not collide and can run in parallel.

---

## Quick Wins

Items at XS or S effort that remove Medium or higher severity, taken first inside their priority band.

- **WORK-151** — two lines in an existing probe. Makes the assertion guarding the feature's central safety claim capable of coming back red.
- **WORK-152** — one string. Without it, the feature's shipped default state is an instruction the user cannot act on.
- **WORK-153** — three lines and one new sentence in one function. Removes the only way this feature can state something false.
- **WORK-154** — one age comparison against a timestamp already stored, plus a wording change. Makes the ≈ line agree with the converter about what "stale" means.
- **WORK-155** — moving one `<div>` out of a flex row. Restores the full-width `.helper` invariant the stylesheet already claims at `:1833`.

**WORK-156 meets the size-and-severity test but is not available as a quick win.** It is Medium at S effort, and it is the "bucket Monthly Trend" half of standing deferral WORK-16/49, whose trigger — a measured render above 100ms on a mid-range device, or a real store above 5,000 actual records — has not fired. Code Review states its own evidence as "projected, not measured". Scheduling it would be scheduling work the standing decision holds.

---

## Sprint Plan — Sprint 1 only

**Items:** WORK-151, WORK-152, WORK-153, WORK-154, WORK-155.

**Total effort:** five XS items. Realistically about one engineering day, not two hours — each commit in this repository carries a red-then-green demonstration where one applies, a full `verify` / `v1` / `boot` / `recurrence` run, and a commit message written to a file. The edit time is minutes; the discipline is the cost, and it is the cost that has kept this project's completion record honest since round 7.

**Order:** WORK-151 first, then the one pass WORK-152 → WORK-153 → WORK-154, then WORK-155.

**What the sprint delivers.** Every Medium finding in both reports that is not held by a standing deferral. Concretely: the Display Currency feature becomes reachable by following the app's own instruction rather than by stumbling on a button two screens away; the card stops being able to state that the app is doing something it is not doing; the ≈ line stops presenting a months-old rate with the same confidence as one from this morning on the screen the user opens offline, where stale is the normal case; the sentence explaining why the control is disabled is read across the card instead of down a 110px column; and all of it lands under a storage-invariance assertion that can now actually fail on an in-memory `db` mutation.

**What the sprint deliberately excludes.** All eight Low items, including the merged WORK-157. Four of them touch the same 60-line region this sprint is rewriting. Opening that region for Lows in the same sprint that restructures its two main functions is how a clean pass becomes a merge exercise. They are Sprint 2 and Sprint 3 work and they lose nothing by waiting.

---

## Roadmap

| Sprint | Items |
|---|---|
| **Sprint 1** | WORK-151, WORK-152, WORK-153, WORK-154, WORK-155 |
| **Sprint 2** | WORK-157, WORK-158, WORK-159, WORK-160 |
| **Sprint 3** | WORK-161, WORK-162 |
| **Later** | WORK-156, WORK-163 |

**Sprint 2** is the display-currency behaviour and seam pass: the zero reading with its harness seeding, the `renderSettings()` seam, the two comments that claim a coupling the code cannot have, and the rate-date helper. All four sit in the same region and share one review.

**Sprint 3** is presentation polish on the same feature: the type-scale subordination and the picker labels. Both are safe to defer indefinitely and neither has a dependent.

**Later** is not "dropped". WORK-156 sits there because a standing deferral holds it and its trigger has not fired; if a measurement is ever taken that fires the trigger, it moves to the front of P2. WORK-163 sits there because the reviewer who raised it says explicitly that it needs no action of its own and should ride with the `calcSalary` split, which is standing technical debt rather than a finding.

---

## Dependencies

**Hard — these change the outcome if ignored.**

1. **WORK-157 requires the `v1-write-flows.js:242-269` seeding change in the same commit.** This is the coupling CODE-06 flags and it is the most consequential dependency in the round. The existing offline-honesty assertion relies on `#sNetConv` carrying a digit *before* the rate is removed, and today that digit comes from the empty salary form rendering "≈ USD 0" — the very string WORK-157 removes. Fixing the defect without seeding a non-zero salary net first does not break the flow; it makes it pass vacuously, which is worse. The salary half of WORK-143's offline assertion would silently stop asserting anything, in a round whose headline finding is an assertion that cannot fail on its symptom. One commit, both files, and the seeded flow re-demonstrated red by restoring the rate.

2. **WORK-152 lands before WORK-153.** CODE-01's recommended new branch carries the sentence *"No saved rate for XXX yet. Open the Currency Converter while online to refresh."* That reintroduces, in brand-new code, the exact defect UI-01 exists to remove. Whatever wording WORK-152 settles on must govern every branch of the function, including the one WORK-153 adds.

3. **WORK-153 lands before WORK-154.** UI-02's Settings mirror edits the enabled-state sentence that CODE-01 splits into two branches. Reversing the order means writing the age distinction once and then writing it again into a branch that did not exist.

4. **WORK-154 lands before WORK-160.** Both rewrite the same two `asOf` sites (`:7356`, `:7399`). CODE-07 removes the duplicated `slice(0, 16)`; UI-02 rewords the sentence containing it. Taking WORK-160 first means WORK-154 rewrites the new helper's call sites immediately. Whoever implements WORK-154 should be told the helper is coming so the duplicated slice is not propagated a third time.

5. **WORK-155 lands before WORK-162.** UI-05 states this itself: widening option text on a select currently pinned into a 120px column beside a squeezed helper makes the layout worse before it makes it better.

6. **WORK-156 is blocked by standing deferral WORK-16/49.** Trigger: a measured render above 100ms on a mid-range device, or a real store above 5,000 actual records. Unfired, and Code Review's evidence is explicitly arithmetic rather than measurement.

7. **WORK-163 is blocked by the `calcSalary` split**, which is standing technical debt and unscheduled. CODE-08 says outright: "Do not do the split for this reason alone."

**Soft — sequencing judgement, not blocking.**

8. **WORK-151 goes first in Sprint 1.** Not because Medium outranks Medium, but because `HANDOFF.md:239-241` states the convention: land tooling before the fix it will verify. Four of this round's items edit the display-currency code; landing the corrected storage-invariance assertion first means every one of them is made under a guard that can say no. The code reviewer put it first for the same reason and I agree with the reasoning.

9. **WORK-158 and WORK-159 ride in one pass.** Same feature, adjacent sites, and Code Review's own recommended refactoring bundles them.

10. **WORK-155's measurement is optional for the fix and mandatory for any recorded figure.** UI-03 labels its own evidence as derived from the declared box model, not observed, and names the instrument that would settle it. The recommended fix — moving the helper out of the flex row — is structural and does not depend on the exact pixel figure, so no measurement gates it. But under the standing conventions "a derived claim is measured before it gates" and "no measured figure is written into a comment that the probe did not produce", if any width figure is recorded in a comment it must first be taken on the corrected harness with `viewport_clientWidth` reported (WORK-130a). **This is a probe, not a runner, and is therefore permitted** — the ceiling of four-plus-one is a ceiling on runners, and `HANDOFF.md:145-149` records that probes and fixtures are the existing runner's inputs and are not counted. WORK-129(p) is the standing precedent for retaining such a probe.

---

## Conflicts

For the Chief Architect. I state both positions and resolve none.

### C31 — The two reports prescribe different predicates for hiding the zero reading, and neither is the predicate their shared evidence describes

**UI-06's position:** add `if (converted === 0) return hide();` beside the existing guards at `:7352`.

**CODE-06's position:** add `if (Math.abs(converted) < 1) return hide();` after `:7352`.

These are not the same guard. `converted` is the raw float before `fmtCurrency` rounds it, so UI-06's predicate fires only on an exact zero — it would hide the empty-salary-form case both reports lead with, but would leave a ₮1,500 balance rendering "≈ USD 0", which is the case UI-06's *own evidence* describes ("at a rate near 3,400 ₮/USD any balance under about 1,700 ₮ renders as USD 0"). CODE-06's predicate covers that case but reaches further than the stated symptom: a conversion of 0.6 rounds to "USD 1", a true and non-degenerate reading, and `< 1` hides it.

The predicate that exactly matches "the reading rounds to zero" is neither of the two proposed. I am not choosing it, because choosing the threshold on a user-facing financial reading is a design call on a feature the architect ruled personally, and the architect's own rejection of the broader display-currency shape rested in part on this exact rounding behaviour. Both reviewers rate the severity Low and neither position changes that.

### C32 — Both reports claim authority over the date string on the same line, and they want different strings there

**UI-02's position:** keep `asOf` — the 16-character slice of the upstream `updatedText` — in the rendered sentence, and use the app's own `rates.timestamp` only to compute an age and switch the wording.

**CODE-07's position:** stop showing the upstream string entirely. Replace both sites with one helper reading `new Date(r.timestamp).toLocaleDateString()`, on the grounds that the disclosed date is the only thing making a stale reading honest and it currently depends on a third party's string formatting.

Both use `rates.timestamp`; they disagree on what the user sees. Under UI-02 the user reads the rate provider's stated publication date; under CODE-07 the user reads the date the app cached it. These are different facts and can differ by up to the cache lifetime. The reports were written independently and neither reviewer saw the other's proposal. The two are implementable together — an age-switched sentence carrying an app-owned date — but that combination is neither reviewer's recommendation and I will not invent it as a merged item.

### C33 — Recorded as a collision, not a disagreement of judgement

Taken literally, CODE-01's recommended new sentence contains the phrase UI-01 was raised to remove. Neither reviewer saw the other's report and I have no reason to think either would defend the contradiction. I have handled it as Dependency 2 (WORK-152 governs the wording for every branch) rather than as a substantive conflict, and I record it here so the architect can rule otherwise if the wording decision belongs at that level.

### Standing-decision collision — not a report-vs-report conflict, but it needs a ruling

**CODE-02 / WORK-156 re-raises the "bucket Monthly Trend" half of standing deferral WORK-16/49.** The deferral's trigger is a measured render above 100ms on a mid-range device, or a real store above 5,000 actual records. Code Review states plainly that its evidence is "arithmetic, not a timing measurement" and "projected, not measured". Round 8's decision noted approvingly that Code Review had declined to take a measurement for the third round running, and `HANDOFF.md:98` records the same for the second.

I have placed WORK-156 in Later and scheduled nothing. What is new this round and may or may not matter to the architect: the reviewer adds a structural argument the earlier rounds did not make — that this is the *only* Dashboard cost the user cannot reduce by narrowing the date range, so the escape hatch every other cost on that screen has does not exist here, and that the pattern at `:6644` is the one a Reports module will copy. That is an argument about shape rather than about speed, and whether a shape argument can fire a trigger stated in milliseconds is a question above my level.

---

## Estimated Effort

| Band | Items | Effort |
|---|---|---|
| **P0** | none | — |
| **P1** | none | — |
| **P2** | WORK-151, 152, 153, 154, 155, 156 | 5 × XS + 1 × S |
| **P3** | WORK-157, 158, 159, 160, 161, 162, 163 | 6 × XS + 1 × S |
| **Total** | 13 items | 11 × XS + 2 × S |

**Scheduled work** (Sprints 1–3, eleven items, excluding the two held in Later): approximately **1.5 to 2 engineering days**, dominated by per-commit demonstration and verification overhead rather than by edit time. No item exceeds S. No new file is required except optionally one probe, which is an input to the existing runner. No new runner, no test framework, no build step, no new dependency.

---

## Recommendations

**One minute, for the Chief Architect.**

Two independent reviewers returned 90 and 91 with no Critical and no High. The build is releasable and I am opening no gate. Almost everything found is on the perimeter of one feature you personally ruled into existence, and the feature's core — the invariant that a converted figure sits beneath the ₮ figure and never replaces it — was independently re-derived and holds at both sites.

**Rule CODE-03 first, and rule it as yours.** The storage-invariance assertion compares `localStorage` bytes across a currency switch, but no path in `setDisplayCurrency` writes to storage, so it is guaranteed green regardless of what that function does to `db` in memory — and `exportBackup` serialises `db`, not `localStorage`. That is a guard that cannot fail on the symptom its own header names, which is the exact convention you established in round 8's C30 after WORK-118. It has now recurred inside the very approval that convention was written to protect, one round later, in a probe you approved. Two lines fix it. The lesson is worth more than the two lines.

**The three Settings-card Mediums are one pass and I have fixed the boundary before editing.** WORK-152 → WORK-153 → WORK-154, three commits, one function. Left to arbitrary order they overwrite each other, and CODE-01's recommended new sentence as literally written reintroduces UI-01's defect in fresh code.

**Two conflicts are yours, not mine.** The threshold for hiding a rounded-to-zero reading, where the two proposed predicates differ from each other and both differ from the symptom their shared evidence describes; and which date the ≈ line should carry, the provider's or the app's. Both are design calls on a feature whose approval you wrote, and the first touches the rounding behaviour that was one of your four grounds for rejecting the broader display-currency shape.

**One thing to notice about WORK-157.** Hiding the reading below one unit is the cheap alternative to WORK-144, the minor-unit table you deferred behind a hard gate. Approving the hide is a decision that the app discloses nothing rather than discloses imprecisely, and it partially pre-empts that deferral. It also carries the round's only hard same-commit dependency: without seeding a non-zero salary net in `v1-write-flows.js`, fixing this defect turns an existing assertion vacuous.

**And WORK-156 needs a word from you.** It is the "bucket Monthly Trend" half of WORK-16/49, whose trigger is a measurement nobody has taken for the fourth round running. I have not scheduled it. The reviewer's new argument is structural rather than temporal — this is the only Dashboard cost a user cannot escape by narrowing the filter — and whether that can fire a trigger stated in milliseconds is not my call to make.
