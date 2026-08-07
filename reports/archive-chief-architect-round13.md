# Chief Architect — Final Engineering Decision

*(Delivered as the agent's message. The agent holds read-only tools by role definition — `Read`, `Glob`, `Grep` — so it could not write this file itself; the text below is its complete decision, transcribed unmodified. `reports/archive-chief-architect-round8.md` preserves the round-8 decision.)*

**Round 9.** Sources read in full and unmodified: `D:\3_Claude\PowerApps\reports\ui-review.md` (6 findings, 90/100, no Critical, no High), `D:\3_Claude\PowerApps\reports\code-review.md` (8 findings, 91/100, no Critical, no High), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (13 items WORK-151..WORK-163, conflicts C31/C32/C33 plus one standing-decision collision). Also read before ruling: `knowledge/review-conventions.md`, `knowledge/project.md`, `knowledge/coding-standards.md`, `knowledge/ui-guidelines.md`, `reports/archive-chief-architect-round8.md`, `reports/HANDOFF.md`.

**This report replaces the round-8 decision as the standing decision.** Everything in round 8 carries forward unchanged — every rejection, every deferral, every convention — except the seven items named in "What I Am Changing From Round 8". The round-8 supplementals on base currency and on display currency remain in force verbatim, including their off-limits lists.

Ruling issued on all 13 items and all four escalations. No item is silent.

---

## Verified Against Source, Not Accepted On Report

- **`index.html:7317-7324`** — `setDisplayCurrency` is `displayCurrency = …; rememberUiPref(DISPLAY_CURRENCY_KEY, …); syncDisplayCurrencyControl(); renderDashboard(); renderSalaryConvReading();`. **No `save()`, no `writeDb()`, nothing that touches `expense-tracker-v1`.** And `exportBackup:3480` is `downloadJSON(JSON.stringify(db, null, 2), …)`. **CODE-03 is confirmed exactly, and it is worse than a wording problem: the assertion I approved as WORK-143 assertion 3 is green by construction.** No perturbation of `setDisplayCurrency` short of adding a `save()` call can turn it red — and adding a `save()` call is not the failure anyone fears.
- **`v1-write-flows.js:282-314`** — `before`/`after` are both `localStorage.getItem('expense-tracker-v1')`. The header at `:271-281` states the constraint as *"the stored blob byte-identical … the assertion that makes the REJECTED shape — a currency that reaches the database — impossible to land by accident."* The `M_pref_stored` guard at `:310-313` does close the do-nothing hole and is fine. **Confirmed.**
- **`v1-write-flows.js:242-269`, which CODE-06 flags and which nobody else re-derived.** The offline flow asserts `!/\d/.test(sNetConv.textContent)` after the rate is removed. Today that assertion can fail, because with a rate present the empty salary form renders `≈ USD 0` — a digit. **The moment a zero-hide guard lands, `#sNetConv` is hidden for the empty form whether or not a rate is cached, and the salary half of assertion 2 can no longer fail on its symptom.** CODE-06's coupling note is correct, and it is the same C30 defect as CODE-03, in the same approval, one flow away. That is twice in four assertions.
- **`index.html:7348-7352` against `:7392-7401`** — `renderConvReading` gates on `convertVia(...) !== null`, which requires `r[displayCurrency]`; `syncDisplayCurrencyControl` gates on `readCachedRates()`, which requires only `c.rates.MNT` (`:7334`). Two predicates, one question. **CODE-01 confirmed.** Note the shape of the correct fix: `sel.disabled = !rates` must stay as it is — a user whose selected code has no rate needs the select *enabled* to pick a different one.
- **`index.html:7395` and the grep**: `Currency Converter` appears at `:2621` (the modal's own heading, visible only after arrival) and at `:7395` (the instruction). `[data-conv-target]` returns exactly `:2195` and `:2230`, both labelled *"🌍 Convert from foreign currency"*, both mid-form on Income and Expenses. **UI-01 confirmed. The shipped default state of a new feature instructs the user to open something no surface in the application is named after.**
- **`index.html:7255-7256`** — `updatedText: data.time_last_update_utc || new Date().toUTCString()`, `timestamp: now`. Two different facts on one object: the provider's publication time and the moment this app fetched. `:7244` already uses `timestamp` for age; `:7469` already renders it to the user in the converter. **Both C32 positions confirmed on the fact.**
- **`index.html:7410-7417`** — `fmtCurrency` opens with `Math.round(amount)`. So the rendered zero is produced by `Math.round`, and `Math.round(-0.35)` is `-0`, which `sign = rounded < 0` reads as positive. **UI-06 and CODE-06 both confirmed, and neither proposed predicate is `Math.round`.**
- **`index.html:6644-6653`** — `db.income.filter(inMonth)` and `db.actual.filter(inMonth)`, the full arrays, inside a `months.map` capped at 36 (`:6640`), with `parseISO` per record per month. **CODE-02's mechanism confirmed.** Its cost remains arithmetic; no measurement exists.
- **`index.html:2404-2410`** — `<div class="row-inline" style="justify-content:space-between;gap:var(--s3)">` with the title-plus-helper `<div>` and `<select style="width:auto;min-width:120px">`. **UI-03's mechanism confirmed.** Its 110px figure is derived, and the finding says so itself.

---

## Executive Decision

**Yes.** This application is fit for release. Two reviewers working independently returned 90 and 91 with no Critical and no High between them — the first round in this project's history where both reports sit in the production-ready band — and both re-derived round 8's gate work at source rather than trusting the commit record, for the third consecutive round. `verify`, `v1`, `boot` and `recurrence` all exit 0, gate R8 is closed on the record as it actually happened, and eleven of the fourteen findings sit on the perimeter of one feature that ships default-off and whose core invariant — a converted figure beneath the ₮ figure, never instead of it, never more than one per card — was independently re-derived at both sites and holds. Nothing found this round is a wrong financial figure, a data-loss path, or a state a user cannot leave. **I am opening no release gate, and that is the first time I have written that sentence.**

It is not a licence to skip the work. It means these fixes ship on the next build instead of holding this one.

---

## Gate Ruling

**Gates R5, R7 and R8 stand closed. None is reopened. No gate R9 is opened.**

**I am opening one work gate, which is a different instrument and does not block release.**

> **Nothing else in the display-currency region — `index.html:7290-7420`, `:2402-2411`, or `v1-write-flows.js:180-390` — is committed before WORK-151 lands in both its clauses.**

The reason is precise, and it is mine. Four of this round's items edit code whose safety argument is *"nothing reaches the money layer"*, and that argument is currently defended by an assertion that is green by construction plus a second assertion that the very next approved item would render vacuous. Landing further work under those guards is landing it under nothing. This is the standing convention *land tooling before the fix it will verify*, applied to a guard I approved and got wrong.

---

## Conflict Rulings

### C31 — The predicate for hiding a rounded-to-zero reading

**Ruling: neither proposed predicate. The predicate is `Math.round(converted) === 0`, and it is derived from the formatter it defends rather than chosen.**

The Engineering Manager is right that both proposals differ from the symptom, right to say so, and right to decline. The symptom is *"the line would print `USD 0`"*. That is not a property of `converted`; it is a property of what `fmtCurrency` does to `converted`, and `fmtCurrency:7411` opens with `Math.round`. So the guard that fires exactly on the symptom is the formatter's own operation:

- UI-06's `converted === 0` fires only on exact zero. It leaves ₮1,500 rendering `USD 0` — the case UI-06's own evidence names. **Rejected: it cannot fire on most instances of the symptom it was raised for.**
- CODE-06's `Math.abs(converted) < 1` hides 0.6, which `fmtCurrency` renders as `USD 1` — a true, non-degenerate reading. **Rejected: it fires where there is no symptom, and suppressing a true reading of the user's balance is a worse fault than printing a useless one.**
- `Math.round(converted) === 0` fires on exactly the set that renders as zero, including the `-0` case CODE-06 correctly identified at −₮1,200, and on nothing else.

**Conditions.** The guard states its derivation, naming `fmtCurrency`'s `Math.round` as the reason the predicate is what it is — because the coupling is real and the next person to change the formatter needs to find this line. Reuse the existing `hide()`. Do not touch `fmtCurrency`; it is shared with the converter and it is correct there.

This is a new convention and it generalises: **where a guard exists to suppress a rendered symptom, its predicate is the render's own predicate, not an approximation of it.** See C35.

### C32 — Which date the ≈ line carries

**Ruling: the app's own `rates.timestamp`, rendered through one helper, at both sites. CODE-07 carries the date; UI-02 carries the age-switched wording; they use the same fact.**

Three grounds, and the first is decisive.

**A claim computed from one fact may not be displayed as another.** UI-02's own recommendation computes the age from `rates.timestamp` — there is no other option, because `updatedText` is free text this app does not parse. Under UI-02 as written, the app would decide *"this rate may be out of date"* from its own timestamp and then print the provider's date in the same sentence as the evidence for that decision. The user reading the parenthetical would be reading a different fact from the one that produced the warning. On the one line in this application whose entire job is disclosure, that is not acceptable, and it is not a matter of taste.

**`slice(0, 16)` is a magic constant over a third party's formatting, duplicated in two functions.** It works because the string happens to be `"Mon, 04 Aug 2026 00:02:31 +0000"`. If open.er-api.com changes format, the app presents a truncated fragment of an unknown string to the user as a date. CODE-07 is right that the app already owns a better fact and already uses it eleven lines away at `:7469`.

**The two facts are close enough that the honesty gained outranks the provenance lost.** A record is only written when a fetch succeeds, and at that moment `updatedText` and `timestamp` are within one publication cycle of each other. What the user needs from this line is *how old*, and the app can defend its own answer to that.

**Conditions, all binding.**
1. **The sentence must match the fact.** If the displayed date is when this app obtained the rate, the wording says so — *"rate saved &lt;date&gt;"* or equivalent — not *"rate of &lt;date&gt;"*, which asserts publication. This is a financial disclosure line and the distinction is exactly what it exists to make.
2. **The helper degrades to the existing `'unknown date'` string** when `timestamp` is absent or unparseable. A cache entry predating this feature, or a truncated one, must not put `Invalid Date` under the user's balance — which would be the same defect CODE-07 was raised to remove, arriving through the fix for it.
3. **The staleness threshold is the existing `RATES_CACHE_TTL_MS`**, not a second constant. The whole value of UI-02 is that the ≈ line and the converter agree about what "stale" means; a private threshold would leave them disagreeing in a new way.
4. **Wording, not paint.** UI-02 is right and I am making it a condition: no colour, no `opacity`, no new token, no pair-table row. The C22 property is not opened for this.

**Consequence for sequencing, and it reverses the Engineering Manager's Dependency 4.** With the date fact ruled, the helper is the thing everything else writes against. **WORK-160 lands before WORK-153 and WORK-154, not after.** The EM ordered it the other way while the conflict was unresolved, which was the correct call to make under uncertainty; resolving the conflict changes the answer. Taking WORK-160 last would propagate `slice(0, 16)` a third time and then delete all three.

### C33 — CODE-01's recommended sentence contains the phrase UI-01 exists to remove

**Ruling: the Engineering Manager's handling is confirmed, and I am adding the structural half it stops short of. Sequencing is necessary and not sufficient.**

WORK-152 before WORK-153 is correct and stays. But ordering alone fixes this instance and leaves the mechanism intact: the route name would still be typed literally into two branches, and a fourth branch added next round would reintroduce the defect exactly as CODE-01's recommendation just did. This project has spent two rounds on that pattern — C22 was ruled to close a class and the implementation closed a case, and I said in round 8 I would not repeat it.

**So: the route name is written once — one module-level constant beside `DISPLAY_CURRENCY_KEY` — and every branch of `syncDisplayCurrencyControl` composes its sentence from it.** Two consumers today, three after WORK-153. That is not premature generalisation; it is the removal of a duplication that has already produced a defect in a review report, in this repository, this round. `coding-standards.md` says "Avoid duplication" and this is the cheapest possible instance of obeying it.

Neither reviewer is at fault. They wrote independently and neither saw the other's report. The mechanism that let two correct recommendations contradict each other is the duplication, and that is what gets closed.

### Standing-decision collision — WORK-156 / CODE-02, and whether a structural argument can fire a millisecond trigger

**Ruling: no. A trigger stated as a measurement is discharged only by a measurement. WORK-156 stays deferred under WORK-16/49, fourth round running. But the trigger was under-specified, and I am fixing that rather than leaving a fourth round of stalemate.**

**Why the structural argument does not fire it.** A trigger exists so that a decision is settled by something outside the arguer. If prose can fire a trigger stated in milliseconds, the trigger is not a trigger — it is a delay, and the deferral becomes a matter of who argues most persistently. Four rounds of restating the same arithmetic would then have succeeded by attrition, which is the precise failure mode `HANDOFF.md:76-78` and my own round-8 supplemental were written to prevent. The reviewer's evidence is labelled honestly — *"arithmetic, not a timing measurement"*, *"projected, not measured"* — and I credit that honesty; it is why this is a deferral rather than a rejection.

**Why the argument is not worthless, and what it actually establishes.** *"The only Dashboard cost a user cannot reduce by narrowing the date filter"* is not an argument that the cost has arrived. It is an argument about **who is exposed when it does**: for every other cost on that screen the user has a mitigation, and for this one they do not. That changes the consequence of the trigger firing, not the probability. It is a reason to make the trigger *cheap to test*, not a reason to skip it.

**The Reports half is rejected outright.** *"It is the pattern a future Reports module will copy"* is speculation about a module `knowledge/project.md` explicitly moved out of Core Modules this quarter precisely because it *"described an intention rather than a module"*, and building Reports is on my standing off-limits list. Optimising today's code for the shape of a module nobody has defined and nobody may build is premature generalisation on the clearest possible facts.

**What I am changing, because the Engineering Manager's escalation exposed a real defect in my own deferral.** WORK-16/49's trigger — *"a measured render above 100ms on a mid-range device, or a real store above 5,000 actual records"* — names two conditions this project has no way to produce. There is no mid-range device here and no real store. In round 8 I rejected a shape on the ground that *"a gate nobody can close is an indefinite hold"*, and I have been holding one. This project's own instruments can settle it: `run.mjs` already boots the full application in Chrome, and a probe that seeds synthetic records and times `renderDashboard()` is an **input to the existing runner**, not a sixth runner — the same standing precedent that admitted `salary-width.js` and `recurrence.js`.

**The trigger is therefore restated, and it is now closeable by anyone in an afternoon:**

> **WORK-16/49 fires when a probe under `tools/harness/`, run through `run.mjs`, reports `renderDashboard()` above 100ms with the date filter on "This Month" against a seeded store of 5,000 income-plus-actual records** — the filtered case specifically, because that is the configuration in which this cost is not escapable — **or on any observation of a slow Dashboard on a real store.** The measurement is its own step and is not scheduled by me. If it fires, WORK-156 is **pre-ruled** and needs no further architect round: the one-pass month bucket keyed on `x.date.slice(0, 7)`, ~10 lines inside `drawMonthlyTrend`, no other consumer, no query layer, no indexing of anything else. What is deferred is landing it, not deciding it.

That is the same construction I used for the WebKit residual in round 8, and it converts a four-round stalemate into a single cheap question.

### Escalation 5 — WORK-151 and the recurrence of C30 inside the approval C30 was written to protect

**Ruling: the Engineering Manager is right to place this first, right to call it mine, and I am recording it as mine. WORK-151 is approved, widened, and made the work gate.**

I wrote C30 in round 8 after WORK-118: *an acceptance condition must be able to fail on the symptom the item was approved to remove.* In the same document I approved WORK-143 assertion 3 — *"switching currency leaves the blob byte-identical"* — over a function that does not write to the blob. The assertion is green by construction. It is a regression condition wearing an acceptance condition's name, which is the exact sentence I wrote one page earlier. And re-deriving it at source turned up a second instance in the same approval: assertion 2's salary half will go vacuous the moment the zero guard lands.

**What that costs me, and the convention it earns.** Writing the rule down did not prevent the rule being broken, four assertions later, by its author. So the rule needs an operational form that cannot be satisfied by intention: **an approval that names an assertion must also name the perturbation that turns it red, and that perturbation must be a change to the application, not to the expectation.** Had I been required to write *"demonstrated red by …"* beside assertion 3 in round 8, I would have discovered in the writing that no such perturbation exists. See C37.

**WORK-151 is therefore two clauses in one commit, and they are one piece of work — one property, one probe file, one pass.**

1. **Assertion 3 measures what its header names.** Capture the export expression itself — `JSON.stringify(db, null, 2)`, the literal contents of `exportBackup:3480`, not a look-alike — alongside the existing localStorage read at `:290` and `:298`, and compare both. Keep the localStorage comparison: it is not wrong, only insufficient, and retaining both is what distinguishes *"wrote to the store"* from *"mutated memory"*. Correct the header at `:271-281` to state which comparison guards which fact.
2. **Assertion 2 keeps a symptom it can fail on.** Seed a non-zero salary net in the flow at `:242-269` so `#sNetConv` carries a digit that comes from the salary figure rather than from the empty form's degenerate zero.

**Red-then-green, both clauses, by perturbing the application.** Clause 1: plant a throwaway `db.settings.__x = code;` in `setDisplayCurrency` — the localStorage comparison stays green, the new one goes red. That contrast *is* the demonstration. Clause 2: with the seed in place, break `renderConvReading`'s absence path so a stale node survives, and watch the flow go red at the salary site. Remove both perturbations before committing.

**Why clause 2 rides here rather than with WORK-157, which is where both the reviewer and the Engineering Manager put it.** Landing it in the tooling slot means the assertion is hardened and demonstrated red *before* the behaviour that would hollow it exists — the standing convention, correctly applied. It also dissolves the round's only hard same-commit cross-file dependency: **WORK-157 becomes a one-line change with no probe coupling at all**, dropping from S to XS. Strictly better than either proposal, at no extra cost.

### Escalation 6 — WORK-157 against deferred WORK-144

**Ruling: WORK-157 is approved and it does not pre-empt WORK-144. WORK-144's gate is neither opened nor narrowed.**

The Engineering Manager frames it as *"the app discloses nothing rather than discloses imprecisely"*, and that framing is what makes the answer clear once the predicate is ruled. Under `Math.round(converted) === 0`, the string being removed is `USD 0`. That is not an imprecise disclosure. Applied to ₮1,500 at 3,400 ₮/USD it is a **false** one — the balance is worth about forty-four cents, not zero dollars — and applied to −₮1,200 it silently drops the sign. The choice is not between disclosing nothing and disclosing imprecisely; it is between disclosing nothing and disclosing something untrue, in an application whose first principle is that correctness of financial data outranks everything else.

Hiding is also the shape already approved. `index.html:7296-7297` states it: *"Absence is a supported state, not an error … The ₮ figure is complete on its own."* WORK-157 extends an existing designed state to one more case; it does not invent a policy.

**And it forecloses nothing.** WORK-144 would make sub-unit figures *representable*; WORK-157 makes an unrepresentable figure *absent* instead of wrong. If WORK-144's gate ever fires, the guard's condition simply becomes rarely true and the guard stays correct. **WORK-144's trigger is unchanged and is not fired by this ruling** — exactly as I recorded for it in round 8, where it was gated on extending the ≈ enumeration, a different axis, and this touches that axis not at all.

**Pre-rejected shape:** a third sentence form such as *"≈ less than USD 1"*. Neither reviewer proposed it and I will not invent it. This line's value is that it has exactly one shape; a second shape for a degenerate case doubles the surface for a case whose whole content is *"nothing to say here"*.

---

## Approved Improvements

Eleven of thirteen approved, several narrowed, one widened, one re-scoped downward in effort.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-151** | The storage-invariance assertion cannot fail on the symptom it names | Verified at `v1-write-flows.js:282-314` against `index.html:7317-7324` and `:3480`. `setDisplayCurrency` writes nothing to `expense-tracker-v1`, so the comparison is green by construction, while `exportBackup` serialises `db`. **This is C30 violated inside the approval C30 was written to protect, by me.** **Approved widened to two clauses in one commit (see Escalation 5): compare the literal export expression `JSON.stringify(db, null, 2)` as well as the stored bytes, keeping both; and seed a non-zero salary net at `:242-269` so assertion 2 keeps a symptom it can fail on. Conditions: both clauses demonstrated red by perturbing the application, never the expectation; the header at `:271-281` corrected to state which comparison guards which fact.** **This is the work gate. Nothing else in the region lands first.** |
| **WORK-160** | The rate date is a 16-character slice of a third party's free-text field, computed twice | Verified at `:7356`/`:7399` against `:7255-7256` and `:7469`. **Promoted from P3/Sprint 2 into the first string commit by the C32 ruling**, because it establishes the fact every later sentence writes against. **Approved as one helper beside `readCachedRates`, reading `rates.timestamp`, used at both sites. Conditions: the sentence must say what the fact is — when the app obtained the rate, not when the provider published it; the helper degrades to the existing `'unknown date'` string when the timestamp is absent or unparseable, so no cache entry can put `Invalid Date` under the user's balance; the magic 16 is deleted, not moved.** |
| **WORK-152** | Settings instructs the user to open a "Currency Converter" no navigation surface is named after | Verified: `[data-conv-target]` returns exactly `:2195` and `:2230`, both labelled *"🌍 Convert from foreign currency"*, both mid-form; the string "Currency Converter" is reachable only at `:2621`, after arrival. `openConverter` is also the only writer of the rate cache, so this is the sole route, described by a name that appears nowhere on the path to it. `project.md` requires every screen to be understandable without training, and the shipped default state of the card fails that on its own instruction. **Approved as the reworded string, naming the control the user will see and the screen it is on. Condition, from C33: the route name is written once as a module-level constant and every branch composes from it.** |
| **WORK-153** | The help line asserts a reading the render path may refuse to produce | Verified: `:7393` gates on `c.rates.MNT`; `:7352` gates on `r[displayCurrency]`. Two predicates, one question, and `v1-write-flows.js:180-183` already seeds the divergent shape. The card whose entire job is to explain the feature can state that the app is doing something it is not. **Approved as gating the help line on the fact the render gates on, with a third branch for the unconvertible code. Conditions: `sel.disabled = !rates` is unchanged — a user whose code has no rate needs the select enabled to choose another, and disabling it would trap them; the new sentence composes from WORK-152's constant; no new state, no re-check, no reconciliation layer between the currency list and the rate source.** |
| **WORK-154** | A rate from six months ago is given the same treatment as one from this morning | Verified at `:7326-7329` and `:7357` against `:7466-7469`: the converter has three treatments for rate age including a ⚠ and a full date-time; the reading has one string for every age. Because `openConverter` is the only refresher and it is behind a button most users will not find, **stale is the normal case for this line, not the exception** — and it sits under the app's single most-read figure. **Approved as an age-switched wording change at both `:7357` and `:7400`. Conditions: threshold is the existing `RATES_CACHE_TTL_MS`, not a second constant; wording only — no colour, no `opacity`, no new token, no pair row; stale rates are still not discarded, because `:7326-7329` is right that a disclosed approximation beats nothing; the date comes from WORK-160's helper.** |
| **WORK-155** | The Display Currency helper is forced into ~110px of a 320px card by a row that cannot wrap | Verified at `:2404-2410` against `.row-inline:1900` (no `flex-wrap`) and five sibling rows in the same file that do wrap. This helper is the sole carrier of the explanation of why the control beside it is off — the entire point of the design at `:7369-7379` and `:2398-2401` — and `:1833` justifies `.helper`'s size with a claim ("every `.helper` is a full-width block") that this site makes false. **Approved as moving `#displayCurrencyHelp` out of the inner `<div>` to be a sibling of `.row-inline`, and the same at `#settingsThemeName` in the same commit, so the invariant is true again rather than half-true — an invariant with two known exceptions is not an invariant, and this one is grep-checkable.** **Conditions: the fix is structural and needs no measurement; but under the standing rule, if any width figure is written into a comment it must first be produced by a width-mode probe reporting `viewport_clientWidth` (WORK-130a). The simplest compliance is to record no figure.** |
| **WORK-158** | The Display Currency card is the only Settings card `renderSettings()` does not refresh | Verified at `:5655-5662` against three hand-placed calls at `:8465`, `:7320`, `:7476`. The seam exists and this card declines to use it, so a fourth state-changing path will need a fourth call. One line, and the drift it prevents is real if thin. **Approved. Condition: the boot call at `:8465` stays — `calcSalary()` at `:8466` renders before any navigation to Settings — and the two ad-hoc calls become belt-and-braces rather than load-bearing, which the comment should say.** |
| **WORK-159** | Both round-9 `renderDashboard()` calls are unreachable as effects, and a comment states the opposite | Verified at `:7321` and `:7477` against the `:6404` guard and the two `[data-conv-target]` trigger sites. The comment at `:7472-7475` asserts a coupling the code cannot have, in new code, on the exact class this project has paid for repeatedly. **Approved as the comment correction only, both calls kept.** The comment must state the derivation: the salary reading is refreshed here; the Dashboard's is refreshed by `navigate()`, because `renderDashboard` is Dashboard-only by the guard at `:6404`. **Rides in one pass with WORK-158.** |
| **WORK-157** | "≈ USD 0" is printed under a zero or near-zero balance | Verified at `:7343-7358` with `fmtCurrency:7410-7417`, and confirmed most-seen on the empty salary form at boot via `calcSalary()` at `:8466`. **Approved with the predicate ruled at C31: `Math.round(converted) === 0`, beside the existing guards, reusing `hide()`, with the comment stating why the predicate is the formatter's own operation.** **Re-scoped from S to XS: WORK-151 clause 2 carries the harness seeding, so this item has no probe dependency and is one line.** Does not pre-empt WORK-144 (Escalation 6). |
| **WORK-161** | The ≈ reading is not subordinated by size, and on the Salary card is larger than the figures it reads | Verified at `:985-988` against `:972`: `.conv-reading` and `.hero-trend` are identical in size, colour and spacing, so two 13px lines under the hero give no cue which is the app's judgement and which is a conversion; and on the Salary card a subordinate approximation renders larger than the four component figures at 12px. The comment at `:983` claims size carries the subordination, and it does not. **Approved as one declaration dropping to an existing scale step already used for subordinate text. Conditions: a scale token, never a literal; markup order unchanged, so adjacency to the figure it reads is preserved; the comment at `:983` becomes true rather than being deleted.** |
| **WORK-162** | The picker offers a code with no currency name, where the app's own picker gives all three | Verified at `:7387` against `renderCurPickList:7174-7182`: one currency list, two choosers, disagreeing about whether a bare ISO code is enough, in an app whose stated audience has little accounting knowledge and whose screens must be understandable without training. **Approved as `c.f + ' ' + c.c + ' — ' + c.n`, after WORK-155.** **Condition, and it is not optional: a `width:auto` select sizes to its longest option, so `#displayCurrency` must be prevented from exceeding its container, and `node tools/harness/run.mjs tools/harness/salary-width.js --width 320` — or an equivalent probe with Settings active — must report `scrollWidth − clientWidth === 0` after the change. This application does not ship a new horizontal-scroll surface to make a dropdown more legible.** |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-163** | `renderSalaryConvReading()` repaints ten elements to refresh one | Not work. The reviewer who raised it says outright *"Nothing structural today"* and *"Do not do the split for this reason alone"*, and verified there are no side effects that matter. The comment at `:7361-7363` already states the derivation honestly and is **true**, so there is no false-comment defect to close either. A rename now would be undone by the `calcSalary` split later. Recorded as standing debt with its existing trigger: any side effect added to `calcSalary`, or the split landing on its own merits. **Work not done is the cheapest work there is.** |
| **WORK-157 (UI-06 predicate shape)** | `if (converted === 0) return hide();` | Fires only on exact zero and leaves ₮1,500 rendering `USD 0` — the case UI-06's own evidence describes. A guard that cannot fire on most instances of its own symptom is the C30 defect in miniature. See C31. |
| **WORK-157 (CODE-06 predicate shape)** | `if (Math.abs(converted) < 1) return hide();` | Hides 0.6, which `fmtCurrency` renders as `USD 1` — a true, non-degenerate reading of the user's balance. Suppressing a correct financial reading is a worse fault than printing a useless one. See C31. |
| **WORK-157 (third-sentence shape)** | Render *"≈ less than USD 1"* instead of hiding | Neither reviewer proposed it and I will not invent it. This line's value is that it has exactly one shape; a second shape for a case whose entire content is "nothing to say" doubles the surface for no information. |
| **WORK-154 (provider-date shape)** | Keep the provider's `updatedText` slice in the rendered sentence | The age is computed from `rates.timestamp` — there is no other option — so the sentence would print one fact as evidence for a judgement made from another. On the app's only disclosure line, that is disqualifying. See C32. |
| **WORK-152 (navigation-entry shape)** | Add a Currency Converter entry to the More sheet | UI-01 pre-rejects this itself and is right: `openConverter(targetInput)` would be called with no target and `#converterUse` returns silently at `:7493`, producing an enabled-looking button that does nothing — a worse version of the defect. **And a second, architectural ground: `project.md` has just been cleaned so that every module it names has a destination. Giving a destination to something that is not a module inverts the property that section exists to hold.** |
| **WORK-153 (disable-the-select shape)** | Disable `#displayCurrency` when the selected code has no rate | Traps the user in the broken state: the select is the only way to choose a code that *does* have a rate. Only the help text branches. |
| **WORK-159 (deletion shape)** | Delete the two unreachable `renderDashboard()` calls | The guard at `:6404` makes them free, and the seam is the correct shape if a display-currency control ever reaches the Dashboard. The comment is what is false; correct the comment. |
| **WORK-156 (structural-argument shape)** | Fire WORK-16/49's trigger on the "no escape hatch" and "Reports will copy it" arguments | If prose can discharge a trigger stated in milliseconds, it is not a trigger. The Reports half is speculation about a module `project.md` moved out of Core Modules this quarter and which is on the standing off-limits list. See the standing-decision ruling and C34. |
| **WORK-155 (comment-narrowing shape)** | Narrow `:1833`'s claim instead of making both sites conform | The round-8 WORK-135 precedent applies unchanged: close the harm so the comment becomes true, rather than editing a true statement down to fit incomplete code. |
| **All round-8 and earlier rejections** — carried | WORK-146, 146(a), 147, 148, 149; the symbol constant; `baseCurrency` anywhere; any change to `unmoney`/`formatMoneyInput` permitting a decimal separator; a first-run flow; making any core module hideable; WORK-89 sweep half; WORK-88/WORK-58; WORK-87, WORK-76 extraction half, WORK-100, WORK-102 input-event half, WORK-106 deny-list half, WORK-111, WORK-112, WORK-125, WORK-126; every shape rejected inside WORK-128/129/131/135/138/140 | All carry forward as rejected so they cannot be re-proposed, exactly as `HANDOFF.md:104-118` and the round-8 tables record them. Neither report re-raised any of them, and UI Review again correctly declined to re-raise the residual spacing literals. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-156** | `drawMonthlyTrend` walks the entire database once per month | Held by WORK-16/49, **fourth round running**, on evidence the reviewer himself labels arithmetic rather than measurement. **Trigger restated so it is closeable with the instruments this project already has:** a probe under `tools/harness/`, run through `run.mjs`, reporting `renderDashboard()` above 100ms with the filter on "This Month" against a seeded store of 5,000 income-plus-actual records — the filtered case specifically, because that is where this cost is inescapable — **or** any observation of a slow Dashboard on a real store. The probe is an input to the existing runner, not a sixth runner. **I am not scheduling the measurement.** If it fires, the fix is **pre-ruled and needs no architect round:** the one-pass bucket on `x.date.slice(0, 7)`, ~10 lines, inside `drawMonthlyTrend` only, no query layer, no indexing of anything else. |
| **WORK-141** | The four reminder checkboxes are sized by the rule authored for text fields | **Unchanged and still the only outstanding approved-adjacent item.** UI Review confirmed from source this round that the markup agrees with the finding — no `input[type="checkbox"]` rule exists, four inline `style="width:auto"` overrides — and stated correctly that source cannot settle how it renders. **The gate is unchanged: one screenshot of Settings → Notifications at 390px, taken with the iframe technique at `HANDOFF.md:200-204`, during any other harness run.** Bordered boxes with 24px of padding ⇒ immediate XS approval in the carve-out shape with the four inline attributes deleted in the same commit. Engine ignores padding and border on the native control ⇒ the item closes as a comment. **Do not implement it from the markup.** |
| **WORK-144** | Minor-unit table for the display reading | Unchanged, hard gate, **not fired and not narrowed by WORK-157** (Escalation 6). Trigger remains extending the ≈ enumeration to any small figure — a different axis from hiding a degenerate one. |
| **WORK-145 / Shape C** | More reading sites, one at a time; a real multi-currency ledger | Unchanged. WORK-145 on observed use of the two shipped sites; Shape C on the user actually transacting in a second currency. Nothing this round is evidence for either — eleven of fourteen findings are about the two sites that already exist. |
| **WORK-146(b)** | Minor units in storage | Unchanged and pre-ruled, so it needs an implementation round rather than another design round. Trigger: one real person, one named currency with a minor unit, with data to enter. |
| **WORK-85 + WORK-35, WORK-15, WORK-17 (IndexedDB half), WORK-23 (screen half), WORK-30, WORK-31** — carried | Standing deferrals | Unchanged. Code Review recorded the second reorder copy is still there and correctly did not re-raise it. No report presented evidence against any of these. |
| **Stage 2** — carried | Pure-logic module and test runner | **Not promoted, eighth round running.** Trigger unchanged: a rounding or arithmetic defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. Code Review re-derived the money path this round — one rounding boundary per figure, `calcSalary:4778-4783` rounding its whole return object in one place, NaN-safety at `fmt`/`fmtCompact` — and found no defect. CODE-06 is explicitly a precision-of-display finding, not a correctness one. The deferral holds on its own terms. |

---

## Development Order

**The work gate governs: WORK-151 lands first, in both clauses, and nothing else in the display-currency region is committed before it.**

**Step 1 — WORK-151.** Both clauses, one commit, one probe file. Compare the literal export expression as well as the stored bytes, keeping both; seed a non-zero salary net in the offline flow. Demonstrate each red by perturbing the application — a planted `db.settings.__x` write for clause 1, a broken absence path for clause 2 — and remove the perturbations before committing. **First because every item after it edits code whose safety argument currently rests on a guard that cannot say no.**

**Steps 2–5 — one pass over `syncDisplayCurrencyControl` and `renderConvReading`, four commits, in this order and not another.** The commit boundary is decided here, before editing, because `HANDOFF.md:243-245` records that deciding it afterwards has cost this project twice.

- **Step 2 — WORK-160.** The rate-date helper, on `rates.timestamp`, at both sites, with the `'unknown date'` fallback. **First among the string work because C32 makes it the fact every later sentence writes against; taking it last would propagate `slice(0, 16)` a third time and then delete all three.**
- **Step 3 — WORK-152.** The route-name constant, and the disabled branch reworded from it. Before WORK-153, because WORK-153 adds a branch that must compose from the same constant.
- **Step 4 — WORK-153.** The help line gated on the render's predicate, third branch composing from the constant, `sel.disabled` untouched.
- **Step 5 — WORK-154.** The age-switched wording at both `:7357` and `:7400`, against `RATES_CACHE_TTL_MS`, using WORK-160's helper. Last of the four because it rewords branches that steps 3 and 4 restructure.

**Step 6 — WORK-155.** Markup, not strings, so it does not collide with steps 2–5 and could run in parallel; scheduled here so the Sprint-1 pass is reviewed as one thing. Both helper sites in the one commit.

**Sprint 1 ends here.** Every Medium in both reports that is not held by a standing deferral, plus the two instrument clauses, plus one P3 item promoted by a conflict ruling. About one engineering day, dominated by demonstration and verification rather than edit time.

**Step 7 — WORK-158, then WORK-159.** One pass, two commits, same feature, adjacent sites.

**Step 8 — WORK-157.** One line, now dependency-free because WORK-151 clause 2 carried the seeding. After steps 2–5, because it lands in a function those steps restructure.

**Step 9 — WORK-161.** One declaration.

**Step 10 — WORK-162.** After WORK-155, with the width check at 320 as a condition of the commit, not as a follow-up.

**Not scheduled:** WORK-156 (deferred, trigger restated), WORK-163 (not work), WORK-141 (deferred, pending one screenshot).

**Run `npm run verify`, `npm run v1`, `npm run boot` and `npm run recurrence` after each commit, and expect 0.**

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework, no runtime build step, no bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`, and `load()` stays total. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations. `stepDate` as the single recurrence engine, walked and never replaced by arithmetic. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever. **"Due" is forward-looking for a recurring series.** **A unit of record is not a reading** — MNT is the unit of record, a reading is marked `≈`, carries its rate's date, sits beneath the figure it reads, never replaces it, and is permitted to be absent. **No card shows more than one converted figure.** **Rates fetch on explicit user action only** — offline is not a state this app detects, it is the state it is designed for. Offline-first. Mobile-first. Correctness and preservation of financial data above everything.

**What changes.**

1. **C34 — a trigger stated as a measurement is discharged only by a measurement, and a trigger must name an instrument that exists here.** A structural or rhetorical argument may re-scope a trigger, sharpen it, or show it was written wrong; it may not fire it. And a trigger whose conditions this project cannot produce is an indefinite hold wearing a schedule — the same fault I rejected a shape for in round 8 and was quietly committing myself. Every deferral I carry forward is now expected to name the command that would close it.
2. **C35 — where a guard exists to suppress a rendered symptom, its predicate is the render's own predicate.** Not an approximation of it, not a threshold chosen for looking sensible. Both proposed zero-guards this round were reasonable and both were wrong, in opposite directions, because neither was derived from `fmtCurrency`'s `Math.round`. A threshold on a financial display is derived or it is a guess.
3. **C36 — one fact per user-facing claim, and it comes from the source the app can defend.** If the app computes a judgement from its own timestamp, it displays its own timestamp. It may not compute from one fact and print another beside it as evidence. And a value taken from a third party's free-text formatting is not a fact this app can defend.
4. **C37, and it is this round's real lesson: an approval that names an assertion must also name the perturbation that turns it red, and that perturbation must be a change to the application, not to the expectation.** C30 said an acceptance condition must be able to fail on the symptom. I wrote that in round 8 and then approved an assertion four items later that cannot fail at all, over a function that does not write to the thing it compares. Writing the rule down did not stop me breaking it; being made to write *"demonstrated red by …"* beside it would have, because there is no sentence that could have gone there. **A rule that is satisfied by intention is not a rule. Give it a blank that has to be filled in.**
5. **The C22 property, unchanged and unopened.** Text is painted from a token, on a ground expressible as a token — no `rgba()` fill, no `opacity` on a text-bearing element, no `filter`, no `mix-blend-mode` over text — with inactive controls exempt, except where the disabled control is the sole carrier of the text explaining why it is disabled. UI Review reports no live counter-example over readable text remains, and the Display Currency card is the worked example of getting the exception right. WORK-154 is ruled wording-only so this stays shut.
6. **The ceiling is four plus one, and it is a ceiling on RUNNERS.** Four static predicates behind `verify`, one render harness with one runner. Probes and fixtures are its inputs and are not counted. **This round adds no file at all** — every change lands in code or in a probe that already exists. The WORK-16/49 measurement, if anyone ever takes it, is a probe.
7. **A visibility assertion is not a function assertion.** Unchanged. **Comments state derivations, never bare results.** Unchanged, and three of this round's approvals exist because a comment stated something the code did not do. **A claim of completeness closes by re-derivation.** Unchanged, and it worked a third time.
8. **No new top-level statement between `let db = load()` and the `#importFile` listener** without asking what a throw there costs. Round 9 added one, below the listener, and Code Review derived that it cannot reproduce the documented class.

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports — and, new this round, **optimising present code for the shape Reports is imagined to want.** Enabling Firebase. Deleting or repairing quarantined Cloud Sync code. Splitting `index.html`. Any large mechanical sweep. Any `render*` calling `save()`. A seventeenth theme before `check-contrast.mjs` covers it. A sixth runner. `color-mix()` following inside `check-contrast.mjs`. No overdue, snooze or dismissal subsystem for reminders. Re-denominating any stored amount; converting any input, list row, chart axis or breakdown component; a display currency in `db.settings` or the export blob; a symbol constant; `baseCurrency` anywhere; any change to `unmoney`/`formatMoneyInput` permitting a decimal separator; a first-run flow; making any core module hideable. **And new: a second staleness threshold anywhere in the app — `RATES_CACHE_TTL_MS` is the one definition of stale, and the ≈ line and the converter agree by using it.**

**Risks I am recording, not scheduling. None of these is a finding; no reviewer raised any of them as one.**

- **Mine, from the C32 ruling.** Moving the displayed date to `rates.timestamp` makes the line say when this app obtained the rate rather than when it was published. That is the more defensible fact and the wording condition makes it honest, but it is a change in what the user is told. If anyone ever reports confusion between the two, the answer is wording, not restoring a third party's string.
- **Mine, from the WORK-162 condition.** A `width:auto` select sized by its longest option is a horizontal-scroll surface waiting to happen at 320px. The condition catches it once; the shape recurs anywhere a `width:auto` control takes user-supplied or list-supplied text.
- **From CODE-01's own Future Risks, unscheduled.** The app takes 29 currency codes from a hand-written constant and rates from a free third-party endpoint, with no reconciliation and no signal when one lacks the other. WORK-153 makes the divergence honest to the user; it does not remove it. Trigger for doing more: the live table actually failing to resolve a shipped code.
- **From CODE-07's Future Risks, unscheduled.** The one-reading-per-card invariant is enforced by a per-card count in `v1-write-flows.js:367-385`. A reading added on a card that has none — an Income row, a goal card — would pass every assertion in the file. That is the correct trade today; it is worth knowing which half is guarded, and WORK-145 is where it would be revisited.
- **From `#converterUse`, carried unchanged.** Its disabled label is still the sole carrier of the instruction *"Set one side to MNT"*, faded by `:1069`, between 2.11:1 and 3.88:1 across the sixteen themes. WORK-139 did not fix it and was not approved to. Trigger unchanged: any user report of confusion on the converter, or any further change to that control. UI Review referenced it correctly rather than re-raising it.
- **Carried unchanged.** The WebKit `.grid-2` residual with its one-observation trigger. `analyzeExpenses` at ~330 lines of 26 inline rules, where the AI Budget Assistant will want to live. Every consumer re-deriving its own filter pipeline from `db` — CODE-02 is a direct consequence and the standing deferral holds it. Filter state in DOM inputs rather than a model. The ~2,650 top-level statements between `let db = load()` and the `#importFile` listener. **The module-boundary problem remains the leading candidate for the quarter after this one, and remains cheaper to live with than to rewrite a render layer with no harness underneath it.**

---

## What I Am Changing From Round 8

Everything not listed here carries forward unchanged.

1. **No release gate is opened. The build is fit for release** — the first round where I have written that. Gates R5, R7, R8 stay closed.
2. **A work gate replaces it:** nothing in the display-currency region lands before WORK-151.
3. **WORK-143 assertion 3's approval is recorded as incomplete, and the cause is mine** — a regression condition named as an acceptance condition, one document after I wrote the rule forbidding exactly that. Assertion 2's salary half is recorded as about to become the same, and is hardened pre-emptively.
4. **New convention C34:** a measurement trigger is discharged only by a measurement, and a trigger must name an instrument that exists here.
5. **New convention C35:** a suppression guard's predicate is the render's own predicate.
6. **New convention C36:** one fact per user-facing claim, from the source the app can defend.
7. **New convention C37:** an approval naming an assertion also names the perturbation that turns it red.
8. **WORK-16/49's trigger is restated** so it is closeable by a probe through the existing runner, and WORK-156's fix is pre-ruled so it needs no further architect round if it fires.
9. **The Engineering Manager's Dependency 4 is reversed** — WORK-160 lands before WORK-154 — as a direct consequence of the C32 ruling.
10. **The Engineering Manager's Dependency 1 is dissolved** — the harness seeding moves into WORK-151, and WORK-157 drops from S to XS with no cross-file coupling.

---

## Final Recommendation

**Land WORK-151 in both clauses, and land nothing else until it is green having first been red.** In `D:\3_Claude\PowerApps\tools\harness\v1-write-flows.js`, capture the literal export expression `JSON.stringify(db, null, 2)` alongside the existing `localStorage.getItem('expense-tracker-v1')` reads at `:290` and `:298` and compare both — keeping the byte comparison, because holding the two side by side is what distinguishes a write to the store from a mutation of memory — then correct the header at `:271-281` to say which comparison guards which fact; and in the same commit seed a non-zero salary net in the offline flow at `:242-269`, so `#sNetConv` carries a digit that comes from the salary figure rather than from the empty form's degenerate zero, which is the digit WORK-157 is about to remove. Prove both by breaking the application rather than the expectation: plant a throwaway `db.settings.__x = code;` in `setDisplayCurrency` and watch the byte comparison stay green while the new one goes red — that contrast is the whole demonstration — then break `renderConvReading`'s absence path and watch the seeded salary assertion go red where today it would have shrugged. Remove both perturbations, run all four commands, commit. Then, and only then, the four-commit pass over `syncDisplayCurrencyControl` in the ruled order — helper, route constant, predicate, age — followed by the markup move. The lesson to carry out of this round is not any of the fourteen findings; it is that in round 8 I wrote *"an acceptance condition must be able to fail on the symptom"* and then, four items later in the same document, approved an assertion that compares bytes a function never writes. The rule was correct, it was mine, I published it, and I broke it inside the very approval it was written to protect. **A convention that can be satisfied by good intentions is a sentence, not a guard. From this round every approval that names an assertion must also name the perturbation that turns it red — because I would have caught this one in the writing, and I did not have to write it.**

*(Round 9. Full reports: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\engineering-manager.md`. Round 8 preserved at `D:\3_Claude\PowerApps\reports\archive-chief-architect-round8.md`. This decision replaces `D:\3_Claude\PowerApps\reports\chief-architect.md` as the standing decision.)*

---
---

# Chief Architect — Supplemental Decision, Round 11

## The borrowing tracker — a design ruling, not a review round

**This is a design request, not a review.** There is no UI Review, no Code Review and no Engineering Manager report for it, and none is required: the "three reports or stop" rule governs review rounds, and this is a product owner asking for a feature that does not exist. I say so explicitly so that the absence is recorded as a fact about the process rather than as an omission.

**Sources read in full and unmodified:** `reports/design-request-debt-tracker.md`, `reports/chief-architect.md` (my own round-9 standing decision), `reports/HANDOFF.md`, `knowledge/project.md`, `knowledge/coding-standards.md`, `knowledge/ui-guidelines.md`, `knowledge/review-conventions.md`.

**Verified at source, not accepted on report:** `index.html:2768-2844` (freshDefaults, SCHEMA_VERSION, migrations, migrate), `:3115-3220` (load and its fallbacks), `:3534-3731` (the import validators), `:5060-5304` (the recurrence engine end to end), `:5727-5781` (renderDataSummary), `:5897-5916` (category delete), `:5950-5990` (the import replacement object), `:6021-6034` (Reset All), `:6419-6495` (renderDashboard's guard and the net computation), `:4155-4196` (computeNextRecurring), `:4693-4755` (screenTitle, MORE_TABS, navigate), `:7915-7986` (goalSaved and renderGoals), `:8467-8489` (the contribution write), `:2208-2235` and `:2557-2610` (the Income screen and the More sheet), plus `tools/harness/v1-write-flows.js` and `tools/harness/recurrence.js` in full.

**Everything in the round-9 standing decision remains in force.** C22, C30, C34, C35, C36, C37, the off-limits list, every rejection and every deferral. Nothing below reopens any of them.

---

## Executive Decision

**Yes — the application remains fit for release, and this feature does not change that.** Round 9 opened no release gate, rounds 4 through 10 are merged, and every command exits 0; a new feature is added to a releasable build, not to repair one. I am approving the borrowing tracker in the shape the user chose — non-bank lenders and family, interest-only as the cost — but at **roughly half the size the design request implies**, because §4's central claim is wrong on the facts and the correction removes most of the design work. The app already has a stock module, already has the parent-plus-ledger shape this needs, already has one recurrence stepper serving two walkers, and already absorbs new top-level collections without a migration. What is left is a screen, a store seam and one sentence. **The single highest-value line in this entire ruling is the sentence on the Income screen that says borrowed money is not income** — it closes more of §2 than the whole Debts screen does, and that fact disciplines how much effort the rest deserves.

---

## §4 — Where I disagree, and it matters

> *"Net Balance is a FLOW. Debt is a STOCK. The app currently has no stock concept at all."*

**The first two sentences are right and useful. The third is false, and it is the one being used to justify treating this as unprecedented.**

`goalSaved(goalId)` at `index.html:7915-7919`:

```js
function goalSaved(goalId) {
  return db.goalContributions
    .filter(c => c.goalId === goalId)
    .reduce((s, c) => s + (+c.amount || 0), 0);
}
```

No date argument. No `getRange`. No period. It is a full-history reduce over a child collection, and `renderGoals` at `:7929-7932` renders three stocks from it — `saved`, `remaining`, `pct`. The Goals screen has no filter row at all. **Savings Goals is a stock module and has been shipping for the entire life of this review series.** It lives on its own screen under More, it never appears on the period-filtered Dashboard, and nobody has ever reported the confusion §4 predicts.

That is not a quibble. It changes the answer to four of the seven questions:

- The **shape** is not undecided. `db.goals` + `db.goalContributions` is a parent collection plus a flat child ledger, with a validator each in `importProblem:3700-3709`, a row each in `renderDataSummary:5730-5739`, and a cascade delete at `:7999-8000`. A debt is a negative goal. Same shape, same six sites, same validators.
- The **stock/flow hazard** is already solved, by segregation rather than by design work: the stock lives on an unfiltered screen and never touches a filtered card. That is the rule, and I am naming it C38 below rather than inventing a mechanism for it.
- The **recurrence question** is already answered by precedent. `computeNextRecurring:4155-4196` is a second schedule *walker* that routes its step through `stepDate`, and the comment at `:4171-4177` records why: it once had its own `setMonth` and reproduced ARCH-1 — *"Two engines, one defect, twice."*
- The **migration question** is already answered. `goals` and `goalContributions` reached the store through `parsed.goals || []` at `:3136-3137` with **no migration step**. `SCHEMA_VERSION` is still 2.

So I reject the request's own framing of itself — *"this is the reason I am not proposing a shape"*. The shape was in the repository. It should have been found by opening `renderGoals`, and the standing convention that **a claim of completeness closes by re-derivation** applies to a claim of *absence* just as hard. "The app has no stock concept" is a completeness claim, it was stated without a re-derivation, and it was wrong.

**What §4 gets right, and I am keeping:** a stock figure on a period-filtered card invites a subtraction the app cannot honour, and that is the same family of hazard as *no card shows more than one converted figure*. It earns a convention. It does not earn an architecture.

---

## §2 — The defect classification, corrected

I accept §2 as real and I am acting on it. I correct its severity framing.

The app is not producing a wrong figure. It is faithfully totalling what the user told it. `totalIncome` at `:6462` is an unconditional reduce over `db.income`, and it is correct about its inputs. What is wrong is that **the app offers no correct alternative and says nothing when the user takes the wrong one.** Under `review-conventions.md` that is not Critical — it is a High-severity gap whose remedy is a destination plus a sentence. Recording it as Critical would have justified rushing the whole feature; recording it accurately is what lets me ship the sentence first-class and the rest at its own pace.

---

## Rulings on §5(a) through §5(g)

### §5(a) — Where the liability lives

**Ruled: two new top-level arrays, `db.debts` and `db.debtPayments`, modelled exactly on `db.goals` / `db.goalContributions`. No migration. `SCHEMA_VERSION` stays 2.**

**Why separate arrays and not a flag on an existing collection.** Every Dashboard total is an unconditional reduce — `:6462`, `:6463`, `:6464`. A debt record inside `db.income` carrying `isLoan: true` is one forgotten filter away from re-creating §2's defect *in the fix for §2's defect*, and it would be invisible in review because the collection would look untouched. A separate array inverts the exposure: a consumer must **opt in** to see debt. That is the direction of safety, and I am making it convention C39.

**Why flat, not a nested `payments` array on the debt.** `importProblem:3710-3728` validates per record with a per-collection loop and a per-collection id-uniqueness `Set`. A nested array gets neither. Flat is both cheaper and better validated — and it is the shipped precedent.

**Why no migration, and this is the biggest single cut in this ruling.** A migration exists to *transform* data. There is nothing to transform: `parsed.debts || []` handles every file ever written by this app. Bumping to `SCHEMA_VERSION` 3 for an empty step would restamp every existing file and every export for zero benefit. `goals` and `goalContributions` set the precedent at `:3136-3137`. The comment at `:2791-2793` says migrations are append-only and never edited; it does not say every addition needs one.

**The schema surface is wider than §5(a) says. It names three sites. There are six**, and missing any one of the last three is the failure this project has paid for repeatedly:

| # | Site | What breaks if missed |
|---|---|---|
| 1 | `load()` field-by-field, `:3129-3154` | Debts silently dropped on every boot |
| 2 | `load()` fresh defaults, `:3195-3207` | `renderDataSummary` throws on a fresh install |
| 3 | Import `replacement`, `:5963-5970` | A backup imports without its debts, silently |
| 4 | `importProblem` `optionalArrays`, `:3671` | A stray `null` reaches a financial collection |
| 5 | `importProblem` `perRecord`, `:3700-3709` | A hand-edited backup injects unvalidated money records |
| 6 | `renderDataSummary` rows, `:5730-5739` | The store's own inventory under-reports itself |

**Record shape, ruled:**

- `db.debts[]` — `{ id, name, principal, totalToRepay, date, notes }`. One free-text identifier, not a `name`/`lender` pair: a second field the user must distinguish between is a question the target audience should not be asked. `totalToRepay >= principal` is refused at the input with a toast and **rejected** at import — rejected rather than clamped, matching `recurrenceProblem`'s stated reasoning at `:3550-3553`.
- `db.debtPayments[]` — `{ id, debtId, date, amount, notes }`. Structurally identical to `goalContributions`.
- **One new validator, not two.** `contributionProblem:3640-3647` is parameterised on the foreign-key name, exactly as `entryProblem(r, fk):3534` already is for `typeId`/`categoryId`. That is the shipped pattern for this precise situation.

### §5(b) — How interest is recognised, and when

**Ruled: proportional on the running total, one formula, no user input, exactly one rounding operation.**

```
interestPaid(d) = Math.round(debtPaid(d.id) * (d.totalToRepay - d.principal) / d.totalToRepay)
```

- **Rejected — user-entered split per payment.** It asks the target user for a number they do not have, on every payment, and a wrong answer silently misstates money. `project.md`: *"People with little accounting knowledge. Every screen should be understandable without training."*
- **Rejected — all-interest-first.** It is what an NBFI actually does, and it makes the number the feature exists to show spike once and then read zero forever. The stated goal is behavioural; a signal that fires once and goes quiet fails it.
- **Rejected — all-principal-first.** It reports zero interest for most of the debt's life. Actively reassuring, which is the exact opposite of the request.

**Computed on the running total, not summed per payment.** This gives one `Math.round` per figure, which is the property Code Review re-derived and approved for `calcSalary:4778-4783` in round 9 — the whole return object rounded in one place. Per-payment rounding would accumulate drift across ten records for no gain.

**And note what my §5(c) ruling does to this question.** §5(b) asks *"which period does the expense fall in"*, because it assumed an expense record. Under §5(c) there is no expense record, so interest paid is a **stock** — "how much of what I have handed over was the cost of borrowing" — and it has no period, no invariant about periods, and no way to fall in the wrong one. **§5(b) shrinks from an invariant to a formula.** That is the ruling doing real work rather than picking a side.

### §5(c) — The crux: real `db.actual` record, or computed term

**Ruled: neither, at stage 1. Interest is not written to `db.actual`, and the net formula at `:6465` is not changed. Both proposed shapes are rejected by name.**

The request says both options have a serious cost. They do — but it undersells both, and once they are stated in full the third answer becomes obvious.

**Option A — a real `db.actual` record — costs more than a category.** §5(c) names the category risk. Deleting a category leaves the record showing "Unknown" (`:5901`), which the app already tolerates. That is the *small* cost. The large one is that **a record in `db.actual` is editable and deletable through the normal expense UI.** `openEditModal('actual', id)` will open it; the user can set its amount to 5 or delete it, and now two stored facts — the payment and its derived expense — disagree with no reconciliation and no way to detect it. This repository has an explicit convention against exactly that: *"Projections are derived, never stored"* (`:2819`), with migration `toV2` existing for no purpose other than stripping derived fields that leaked into storage. And WORK-128's entire history is a button that *"writes one actual expense per tap"*, fabricating records the user never incurred. A third cost: the user who logs the payment as an expense *and* records it as a debt payment is counted twice.

**Option B — the computed term — is not one formula.** `net = income − expenses − interestPaid` changes `:6465`, and `:6463` still feeds `#kpiExpenses` on the same card. The user then reads **Income ₮1,000,000 · Expenses ₮1,000,000 · Net −₮300,000** on the headline card of a finance app, and the three figures do not add up. That is a worse defect than the one being closed, and it is precisely the hazard §4 correctly identified — two figures on one card inviting an arithmetic the app refuses to honour. To fix it you must thread the term into `totalExp`, the donut, `drawMonthlyTrend`, the category breakdown, the Daily total and `analyzeExpenses`'s 26 rules. **Six consumers, or a card that lies.** That is the "every consumer re-derives its own filter pipeline" debt my own standing decision names as the leading architectural problem, deliberately extended.

**So: neither.** At stage 1, interest paid is reported on the Debts screen as a named figure and the Dashboard is not touched. My grounds, in order:

1. **§2's defect is closed by giving borrowing a destination, not by redefining Net Balance.** Changing the headline formula is a separate product change riding along in the fix. `CLAUDE.md` forbids that.
2. **The §3 arithmetic does not require the app to fabricate anything.** The user *spends* the borrowed money, and that spending is already logged by hand. The interest is money that leaves their pocket, and it is logged the same way if they log it. What the app must not do is add ₮1,000,000 to income — and stage 1 stops exactly that.
3. **The behavioural goal is better served.** *"When people see how much money they spend on non-oafs they can be changed."* A card that says **"You have paid ₮300,000 in interest"** confronts harder than ₮300,000 dissolved anonymously into a net of −₮1,300,000. The deliverable is a **named** number, not an absorbed one.
4. **Every card keeps adding up.** `renderDashboard` untouched, its Dashboard-only guard untouched, `:6440-6446` untouched, the one-converted-figure rule untouched, all four `v1` assertions untouched, `npm run recurrence` untouched.

**What this costs, stated plainly rather than hidden.** If the user does not separately log the interest as an expense, Net Balance understates their outgoings by that amount. That is a real residual and I am deferring it as **WORK-168** with a trigger and a **pre-ruled shape** — see Deferred. It is a defer, not a punt: I have named what settles it and what gets built if it fires.

### §5(d) — The Income-screen entry point

**Ruled: approved as a link and a sentence. Rejected as a form.**

One button below `#incAdd` at `:2228`, reading approximately *"Borrowed money? Record it as a debt →"*, with a helper line stating the fact: **"Borrowed money is not income — you have to pay it back."** It calls `navigate('debts')`. It writes nothing. It has no amount field, no select, no save.

Why a link:

- A second write path into a financial collection, sitting inside the card headed "Add Income", puts a mis-tap between two different meanings of the same gesture.
- **The sentence is the intervention.** It is the application naming the user's category error at the exact moment they are about to commit it. That is worth more than saving a tap, and it is the whole of §2's user-facing half.
- XS instead of M.

**Binding condition: the sentence contains the negation explicitly.** Not "Add a loan". The words "is not income" appear. §2 is an error in the user's head and the remedy is a sentence that names it.

**Pre-rejected, permanently, and this is the one somebody will propose:** a **"Loan" or "Borrowed" entry in `db.incomeTypes`**. It is one configuration keystroke from re-creating §2's defect in full — an income type *is* income, and `:6462` reduces `db.income` unconditionally — and it would pass review because it looks like data, not code. Off limits.

### §5(e) — Scheduled repayments and the recurrence engine

**Ruled: no scheduling at stage 1, deferred as WORK-169. When it comes it reuses `stepDate` through a walker of its own, and it does not touch `plannedOccurrences` or `expandPlannedInRange`.**

- **Not `expandPlannedInRange`.** Its two horizons at `:5129-5148` exist to make Planned comparable to Actual over one window. A debt schedule asks *"when is my next payment"* — `nextPlannedDue`'s question, not `plannedOccurrences`'. Overloading the aggregation path would put debt occurrences into `totalPlanned` at `:6464`: §2's defect wearing a different coat.
- **Not a new stepper.** `stepDate:5082-5103` carries ARCH-1's 31st clamp. `computeNextRecurring:4178-4183` already demonstrates the correct pattern — a second walker, one step function — and its comment records that having its own `setMonth` reproduced ARCH-1 verbatim. A third stepper is off limits.
- **Why deferred.** An NBFI schedule is knowable without the app modelling it. Scheduling adds a reminder surface, a badge, a notification path, a mark-as-paid write and a cursor field — every one with its own defect history here, WORK-128 most expensively. Stage 1's job is the liability and the cost.

### §5(f) — Zero-interest debt

**Ruled: it is not a special case, and building it as one is rejected.** With `totalToRepay === principal` the interest fraction is exactly 0 and every payment is pure principal. No branch, no flag. That the family case falls out of the general rule *by being correct* rather than *by being exempted* is the test the rule passes.

Three binding presentation conditions, because this is where a wrong word does harm:

1. **The cost figure is hidden when it rounds to zero, and the predicate is the render's own** — `Math.round(interest) === 0`, the same derivation as WORK-157 under C35. "Cost of borrowing: ₮0" under money from your mother is the application implying a question was asked.
2. **A user whose debts are all interest-free never sees a "cost of borrowing" heading at all.** Not a zero — an absence. Absence is a supported state in this application (`:7296-7297`) and this is the same policy.
3. **No hard-coded "Lender" label.** The counterparty is the user's own free text. A debt owed to a sibling must not be captioned with a word that presupposes a business.

**Pre-rejected:** a `kind: 'nbfi' | 'family'` discriminator. It generalises before any behaviour branches on it, and the arithmetic already covers both. If a later split is wanted it is a filter on `interest > 0`, derived, not stored.

### §5(g) — Staging

**Ruled: three stages. Stage 1 approved as WORK-164 through WORK-167. Stages 2 and 3 deferred with triggers.** The full breakdown is in Development Order below.

---

## Approved Improvements

Numbered from WORK-164 as instructed.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-164** | The store seam: `db.debts` and `db.debtPayments`, with nothing rendering them | Six sites, verified individually at source, not three as the request states. Modelled on `db.goals`/`db.goalContributions`, which reached the store with **no migration** at `:3136-3137` — so `SCHEMA_VERSION` stays 2 and no migration is written. One new validator, parameterised on the foreign key exactly as `entryProblem(r, fk):3534` already is. **This is the work gate.** Landing a screen first would mean landing writes into collections that four of six fallback paths do not yet know about, and backward compatibility is mandatory per §6. **Conditions: all six sites in one commit; four assertions with the four perturbations named below; no UI, no render, no writer.** Effort M. |
| **WORK-165** | The Debts screen — the liability, the outstanding balance, and the cost of borrowing | The deliverable. A More entry, a `titles` entry, `MORE_TABS`, a `navigate` branch, an add form, a card per debt, a payment modal on the pattern of `openContributeModal`, a payment ledger, and cascade delete on the pattern of `:7999-8000`. Three derived functions mirroring `goalSaved`: `debtPaid`, `debtOutstanding`, `debtInterestPaid`. **One commit and not two: a debt the user can record but cannot pay down is a screen that tells them they owe money and offers no way to reduce it — a shipped defect, not an increment.** **Five binding conditions with their perturbations, below.** Effort L. |
| **WORK-166** | The Income screen says, in words, that borrowed money is not income | The highest value per line in this ruling. §2's defect is a category error in the user's head at the moment they open the Income form, and one sentence at that moment closes more of it than the entire Debts screen does. **Approved as a link and a helper sentence only — no form, no write.** **Conditions: the words "is not income" appear; it calls `navigate('debts')` and nothing else. This item ships with NO assertion, and that is deliberate — a string-presence check would be a visibility assertion, which this project's own convention says is not a function assertion.** Effort XS. |
| **WORK-167** | `project.md` records the module that now exists | `project.md:30-34` states the property that section exists to hold: *"Every module named above now has a destination."* The inverse must hold too, or the file drifts back into describing intentions. **Approved as: Core Modules gains a row — `Debts` / `More → Debts`; Long-term Vision's `Debt Planner` line is removed, and the part of it that is genuinely still unbuilt (scheduling) is carried as deferred WORK-169 in this report rather than as a vision bullet.** One entry per thing. Effort XS. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **§5(a) — flag shape** | A `isLoan`/`kind` discriminator on `db.income` or `db.planned` | Every Dashboard total is an unconditional reduce (`:6462-6464`). Exclusion by flag is one forgotten filter from re-creating §2's defect inside the fix for §2's defect, and it would be invisible in review because the collection looks untouched. Separate arrays make a consumer opt in. Convention C39. |
| **§5(a) — nested shape** | A `payments` array nested on each debt record | `importProblem:3710-3728` validates per record with a per-collection loop and a per-collection id-uniqueness `Set`. A nested array gets neither without new validator machinery. Flat is cheaper *and* better validated. |
| **§5(a) — migration** | A `migrations[2]` step and `SCHEMA_VERSION` 3 | Nothing to transform. `parsed.debts \|\| []` handles every file this app has ever written, and `goals`/`goalContributions` are the shipped precedent for adding a collection with no version bump. Bumping the version restamps every existing file and every export for zero benefit. |
| **§5(b) — user split** | A user-entered principal/interest split per payment | Asks the stated target audience — *"people with little accounting knowledge"* — for a number they do not have, on every payment, where a wrong answer silently misstates money. |
| **§5(b) — all-interest-first** | Recognise interest before principal | Front-loads the entire cost into the first month or two, so the number the feature exists to show spikes once and reads zero thereafter. The goal is behavioural; a signal that fires once fails it. |
| **§5(b) — all-principal-first** | Recognise principal before interest | Reports zero interest for most of the debt's life. Worse than uninformative — reassuring. |
| **§5(c) — Option A** | Interest as a real, app-created `db.actual` record | `openEditModal('actual', id)` opens it. The user can edit or delete a record the app is treating as derived, leaving two stored facts in disagreement with no reconciliation and no detection. Against `:2819`'s standing rule that projections are derived and never stored, and against WORK-128's whole history of fabricated actuals. Also double-counts for any user who already logs the payment. |
| **§5(c) — Option B** | `net = income − expenses − interestPaid` | Not one formula. `:6463` still feeds `#kpiExpenses` on the same card, so the headline card would read Income 1,000,000 · Expenses 1,000,000 · Net −300,000 — three figures that do not add up, which is a worse defect than the one being closed. Threading the term through `totalExp`, the donut, `drawMonthlyTrend`, the breakdown, the Daily total and 26 advisor rules is a six-consumer change, deliberately extending this project's leading architectural debt. |
| **§5(d) — form shape** | An "Add borrowing" form on the Income screen | A second write path into a financial collection, inside the card headed "Add Income", where a mis-tap lands on the wrong meaning. The link teaches; the form only saves a tap. |
| **§5(d) — income type** | A "Loan" or "Borrowed" entry in `db.incomeTypes` | One configuration keystroke from §2's defect in full, and it would pass review because it looks like data rather than code. **Permanently off limits.** |
| **§5(e) — reuse shape** | Debt schedules through `plannedOccurrences` / `expandPlannedInRange` | Their two horizons (`:5129-5148`) exist to make Planned comparable to Actual over one window. Debt occurrences reaching that path would land in `totalPlanned` at `:6464` — §2's defect in another collection. |
| **§5(e) — new stepper** | A third recurrence step function for debts | `computeNextRecurring:4171-4177` records what happened last time: *"Two engines, one defect, twice."* A walker of its own is permitted; a stepper is not. |
| **§5(f) — special case** | A zero-interest branch, or a `kind` discriminator | The proportional rule already yields exactly zero. A special case for a case the general rule handles correctly is premature generalisation with a maintenance cost. |
| **New — reading shape** | A `≈` converted figure on a debt card | Not requested by anyone; I am pre-rejecting it so it cannot arrive as polish. It is a new reading site and falls squarely under deferred **WORK-145**, whose trigger is observed use of the two sites that already exist. The one-reading-per-card rule and the standing off-limits list govern unchanged. |
| **New — filter shape** | A date-range filter row on the Debts screen | The Debts screen renders stocks. A filter would make "how much do I still owe" a function of a control, which is the precise error §4 correctly warned about. C38. |
| **New — rate shape** | An interest-rate / APR field, or an amortisation schedule | The user chose "only interest is a cost" over the alternatives and does not know their APR. A rate model is the accounting feature this feature was chosen *instead of*. |
| **All round-9 and earlier rejections** — carried | Every shape in the round-9 rejection table and its carried predecessors | Unchanged. Nothing in this request re-raises any of them. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-168** | Interest reaching Net Balance | **The residual of my §5(c) ruling, stated rather than hidden.** Trigger: the user having lived with stage 1 through at least one debt from borrowing to settlement, and stating that the Dashboard should include interest. That question is answerable in a week of use and unanswerable now, because it depends on whether they already log the payment as an expense. **The fix is pre-ruled, so if it fires it needs no architect round: an optional checkbox on the payment modal — "also record this as an expense" — creating a normal, user-owned, user-categorised, editable `db.actual` record by an explicit act.** That is neither rejected shape. Nothing derived is stored, no formula changes, every existing consumer picks it up for free, every card still adds up, and the double-count is impossible because the user chooses once. Default off. |
| **WORK-169** | Scheduled repayments and reminders | Trigger: the user having used stage 1 through a repayment cycle and reporting a payment they missed that the app could have warned about. **Pre-ruled shape:** a walker of its own routing every step through `stepDate`, on the `computeNextRecurring:4178-4183` pattern; a `recFrequency`/`recIntervalDays`/`recLastPaid` triple validated by the existing `recurrenceProblem:3554`; no contact with `plannedOccurrences` or `expandPlannedInRange`. **Not pre-ruled and needing its own round:** anything touching `computeReminders`, the bell badge, or the OS notification path — WORK-128 is why. |
| **WORK-141, WORK-156, WORK-144, WORK-145 / Shape C, WORK-146(b), WORK-85+35, WORK-15, WORK-17, WORK-23, WORK-30, WORK-31, Stage 2** — carried | All round-9 deferrals | **Unchanged, every trigger intact.** Nothing in this feature fires any of them. **Stage 2 is worth one specific note: `debtInterestPaid` is a new arithmetic function on money, and it is exactly the kind of thing whose first rounding defect fires Stage 2's trigger.** The deferral holds today; this feature moves the trigger closer to a real event than it has been in eight rounds. |

---

## Conflict Rulings

There is no Engineering Manager report and therefore no recorded conflicts. What follows is what I am ruling in their place: the seven open questions, each with a one-line disposition, plus the two places where I overruled the request's own framing.

| Question | Ruling |
|---|---|
| **§5(a)** Where the liability lives | Two flat top-level arrays on the `goals`/`goalContributions` pattern. Six sites, not three. **No migration; `SCHEMA_VERSION` stays 2.** One validator, parameterised on the foreign key. |
| **§5(b)** How interest is recognised | Proportional on the running total. One formula, no user input, exactly one `Math.round`. The three alternatives rejected by name. Reduced from an invariant to a formula by the §5(c) ruling. |
| **§5(c)** Real record or computed term | **Neither.** Both rejected with their full costs stated. Stage 1 reports interest on the Debts screen only; `:6465` is untouched. The residual is deferred as WORK-168 with a pre-ruled shape that is neither. |
| **§5(d)** The Income entry point | A link and a sentence containing "is not income". No form. `db.incomeTypes` permanently off limits for this. |
| **§5(e)** Recurrence reuse | No scheduling at stage 1. When it comes: a walker of its own, `stepDate` for every step, no contact with the aggregation path. |
| **§5(f)** Zero-interest debt | Not a special case. Falls out of the formula. Three binding presentation conditions, including a C35-derived hide predicate. |
| **§5(g)** Staging | Three stages. Stage 1 only, four items, work-gated on WORK-164. |
| **§4** The framing | **Overruled in part.** Flow-vs-stock is right and earns C38. *"The app has no stock concept at all"* is false — `goalSaved:7915-7919` and `renderGoals:7929-7932` are a shipped stock module. The correction removes most of the design work. |
| **§2** The severity | **Corrected.** A real gap with a wrong headline consequence, remedied by a destination plus a sentence — High, not Critical. The distinction matters because it is what lets WORK-166 be first-class and the rest be paced. |

---

## Development Order

**The work gate governs: WORK-164 lands first, in one commit, and nothing that writes a debt record is committed before it is green having first been red.** Same instrument and same reason as round 9's: the safety argument for everything after it is *"a debt never reaches a Dashboard total"*, and that argument is currently true by construction — which is the exact C37 trap.

### Step 1 — WORK-164. The store seam. Four assertions, four application perturbations.

All in a new flow group in `tools/harness/v1-write-flows.js`. A probe input, not a sixth runner — the standing precedent that admitted `salary-width.js` and `recurrence.js`.

| # | Assertion | **Demonstrated red by** (C37 — the application changes, never the expectation) |
|---|---|---|
| 1 | A database containing debts and payments produces the same `#kpiIncome`, `#kpiExpenses`, `#kpiNet` and `#kpiPlannedNet` as the same database without them | Change `:6462` to `db.income.concat(db.debts).reduce(...)` — `#kpiIncome` moves. **This perturbation is literally §2's defect written in code, which is what makes the assertion the guard for it.** |
| 2 | A backup exported with debts and payments re-imports with both intact | Delete `debts: []` from the `replacement` object at `:5963-5970` — the round trip silently loses them |
| 3 | A stored blob with no `debts` key loads to `[]` and does not throw | Change `parsed.debts || []` to `parsed.debts` at `:3129-3154` — `renderDataSummary` throws on `.length` of undefined. **This is the backward-compatibility assertion §6 makes mandatory.** |
| 4 | An import whose `debts` is not a list, or whose record has a non-numeric `principal` or `totalToRepay < principal`, is refused with a named message | Remove `'debts'` from `optionalArrays` at `:3671` — the malformed file imports clean |

**A throw exits a flow at its first failing assertion**, so this needs four passes, each leaving the earlier ones correct. `HANDOFF.md:236-238` records that WORK-113 needed five.

### Step 2 — WORK-165. The Debts screen. One commit. Five binding conditions.

| # | Condition | **Demonstrated red by** |
|---|---|---|
| 1 | **Stock invariance.** `debtOutstanding` and the cost figure read identically with the Dashboard filter on "This Month" and on "All Time" | Make `debtPaid` filter its payments through `getRange('dash')` — the two readings diverge. This is §4's correct half, made into a guard |
| 2 | **Zero-interest.** A debt with `totalToRepay === principal` renders no cost figure at all, and its outstanding is still correct | Remove the `Math.round(interest) === 0` guard — "₮0" appears under a family loan |
| 3 | **Cascade.** Deleting a debt removes its payments | Drop the `db.debtPayments = db.debtPayments.filter(...)` line — orphans survive a delete, exactly as `:7999-8000` prevents for goals |
| 4 | **Isolation, through the real controls.** WORK-164 assertion 1 re-run with the records created by tapping, not seeded | Add `db.income.push(...)` to the debt-save handler — the shape a future engineer would actually write |
| 5 | **No horizontal scroll at 320px** with a deliberately long debt name, via a width-mode probe with `#debts` active reporting `viewport_clientWidth` and `scrollWidth − clientWidth === 0` | Not an assertion to redden — a precondition. **This is the WORK-162 risk I recorded in round 9 recurring exactly where I predicted: "the shape recurs anywhere a `width:auto` control takes user-supplied text."** A debt name is user-supplied text on a mobile-first card |

Plus two review conditions with no assertion, stated so they are checked by eye: **`renderDebts` writes only inside `#debts`**, mirroring the containment property `:6440-6446` states for `renderDashboard`; and **the Debts screen carries no filter row**, with a comment saying why — the figures are stocks.

### Step 3 — WORK-166. The Income link and its sentence.

After the destination exists. A warning with no remedy invites the user to proceed anyway.

### Step 4 — WORK-167. `project.md`.

Last, because a module is recorded once it exists, not once it is planned. That ordering is the property `project.md:30-34` was cleaned to hold.

**Run `npm run verify`, `npm run v1`, `npm run boot` and `npm run recurrence` after each commit, and expect 0.** `recurrence` in particular: it is the only command that would catch a debt schedule leaking into the aggregation horizon, and step 2 is the commit where that could happen.

**Not scheduled:** WORK-168, WORK-169, and every carried deferral.

**Effort:** M + L + XS + XS. Call it a week. That is larger than anything since the display currency, as the request says — and it is roughly half what the request implies, because there is no migration, no scheduling, no Dashboard change, no per-payment split, no zero-interest branch and no Income form.

---

## Does this open a gate?

**No release gate. One work gate.**

> **Nothing that writes a debt record is committed before WORK-164 lands with all four assertions green, each having first been demonstrated red by the named change to the application.**

The build remains fit for release throughout: every commit above leaves the shipped application in a coherent state, and a partially-built Debts screen is never on `main` because WORK-165 is one commit by ruling.

---

## Architecture Strategy — additions to the standing decision

Everything in the round-9 Architecture Strategy carries forward unchanged. Added:

**Two new conventions.**

1. **C38 — a stock and a flow do not share a card.** A figure true *as of now* lives on a screen with no date filter. A figure measured *over a period* lives on a filtered one. Neither is ever placed where a reader can subtract it from the other. This generalises the one-converted-figure rule from currency to time, and Savings Goals is the shipped worked example — an unfiltered screen of stocks that has never appeared on the Dashboard. Debts is the second.
2. **C39 — a collection whose records must never reach a total gets its own top-level array, not a discriminator field on an existing one.** Derived, not chosen: every Dashboard total is an unconditional reduce over a whole collection, so exclusion-by-flag is one forgotten filter from a wrong headline number, and the omission is invisible because the collection looks untouched. Separate arrays make every consumer opt in.

**One correction to how absence is claimed.** The standing rule is *a claim of completeness closes by re-derivation*. This round shows it must cover **claims of absence** too. *"The app has no stock concept at all"* is a completeness claim in negative form, it was stated without opening `renderGoals`, and it was wrong — and it nearly bought an architecture the repository already contained. **The question "does this exist here already" is answered by grep, not by recollection.**

**Added to the off-limits list this quarter.** A "Loan"/"Borrowed" entry in `db.incomeTypes`, or any debt record written by the app into `db.income`, `db.planned` or `db.actual`. A third recurrence stepper. Any change to `:6465`'s net formula for this feature. A date filter on the Debts screen. An interest-rate, APR or amortisation model. A `≈` reading on a debt card. A `kind` discriminator on a debt. A `SCHEMA_VERSION` bump without a transform to perform.

**Risks I am recording, not scheduling. None of these is a finding; no reviewer raised any of them.**

- **Mine, from the §5(c) ruling.** Stage 1 leaves interest out of Net Balance. If the user does not separately log the payment as an expense, the headline understates their outgoings. Deferred as WORK-168 with a pre-ruled shape. Stated here so it cannot be discovered later as a surprise.
- **A debt recorded and then never paid down through the app** leaves "outstanding" as a stale figure that reads authoritative. `db.goals` has the identical exposure today via `goalSaved` on an abandoned goal, and it has never been reported. Same trade, now made twice.
- **`totalToRepay` is a single number**, so a renegotiated or variable NBFI loan cannot be represented without editing it, which silently restates history. Acceptable at stage 1. If it bites, the answer is an edit trail, not a rate model.
- **The `width:auto` / user-supplied-text overflow shape**, carried from round 9 and now recurring on a debt name. Caught once by WORK-165 condition 5; the shape recurs.
- **Two unfiltered money screens now exist.** That is a pattern, not an exception, and C38 names it before a third arrives without a rule.

---

## Final Recommendation

**Build WORK-164 and nothing else until its four assertions are green having each been red.** In `expense-pwa/index.html`, add `debts: parsed.debts || []` and `debtPayments: parsed.debtPayments || []` to the field-by-field object at `:3129-3154` and empty arrays to the fresh defaults at `:3195-3207`; add both to the import `replacement` at `:5963-5970`, to `optionalArrays` at `:3671`, and to the `perRecord` table at `:3700-3709` with one new `debtProblem` validator and `contributionProblem` parameterised on its foreign key exactly as `entryProblem(r, fk)` already is; add two rows to `renderDataSummary` at `:5730-5739`. **Write no migration and do not touch `SCHEMA_VERSION` — `goals` and `goalContributions` are the shipped precedent at `:3136-3137`, and a version bump with nothing to transform restamps every file in the world for nothing.** Then, in `tools/harness/v1-write-flows.js`, add the four-assertion flow group, and prove each by breaking the application in the way named above — beginning with `db.income.concat(db.debts)` at `:6462`, which is §2's defect written out as code and is the reason this assertion is the guard for the whole feature. Four passes, because a throw exits a flow at its first failure. Then all four commands, then commit. The lesson I want carried out of this ruling is not any of the seven questions: it is that the design request opened with *"the app has no stock concept at all"*, and `goalSaved()` — a full-history reduce with no date argument, rendering three period-free figures on an unfiltered screen — has been sitting in this file the whole time. **A claim that something does not exist here is a completeness claim in negative form, and it closes by re-derivation exactly like the positive kind. It cost most of a design document this time. Next time it buys an architecture we already own.**

*(Round 11. Supplemental to the round-9 standing decision, which remains in force in full. Source: `D:\3_Claude\PowerApps\reports\design-request-debt-tracker.md`.)*

---
---

# Chief Architect — Supplemental Decision, Round 12

## The Debts implementation reviewed, and the guards that could not say no

**Sources read in full and unmodified:** `reports/ui-review.md` (10 findings, 78/100, no Critical, three High), `reports/code-review.md` (12 findings, 78/100, no Critical, three High), `reports/engineering-manager.md` (17 items WORK-170..WORK-186, conflicts C1-C5), `reports/design-request-debt-tracker.md`, `reports/HANDOFF.md`, `reports/chief-architect.md` — my own round-9 standing decision and my own Round 11 supplemental — and the four knowledge files.

**Verified at source, not accepted on report.** `index.html:1487` (`.goal-bar`, class-only, no ancestor) against `:1501`, `:1506`, `:1507`, `:1512` (all four ancestor-scoped under `.goal-actions`); `:1500` and `:1553` (the two layout rules); `:8192-8196` and `:8350-8353` (the only two markup sites carrying `goal-add`/`goal-icon-btn`; the `data-goal-add` buttons at `:4520` and `:4524` carry no such class and are unaffected by any shape ruled below); `:1524-1528` (`.debt-card`, `var(--shadow)`, `margin-bottom: 14px`); `:1542-1548` against `:1477-1486` (the two chips, and `.debt-meta-item.cost` as the only modifier that must survive a merge); `:1558-1562` (the summary block, `20px` off the scale, and **neither chip carries `overflow-wrap`** — which is load-bearing for WORK-174 below).

**Two findings arrived observed rather than reported, and I am treating them as measured.** The 320px geometry behind UI-01/CODE-01 — debt "+ Payment" 23px on `rgb(240,240,240)` against goal 44px on `rgb(37,99,235)`, debt icons 23x34 against 44x44 — and the CODE-03 demonstration: deleting `debts: []` from the application's real import replacement leaves `npm run v1` green. Both are discharged as measurements under the standing rule that a derived claim is measured before it gates.

**Everything in the round-9 standing decision and the Round 11 supplemental remains in force.** C22, C30, C34, C35, C36, C37, C38, C39, every rejection, every deferral, every off-limits entry. Nothing below reopens any of them. Two conventions are added and one existing convention is strengthened because it was followed and still failed.

---

## Executive Decision

**Yes. The application remains fit for release, and I am opening no release gate.** Two reviewers working independently returned 78 and 78, three High and no Critical each, and they agree on the diagnosis: the Debts module's architecture is right and its edges are not. Nothing found this round loses stored data, misstates a stored figure, or reaches a Dashboard total — the property the whole module was approved on holds, was re-derived at source by both reviewers, and is guarded by an assertion that can genuinely fail. What is not fit is the **record**: three of the acceptance conditions I approved WORK-164 and WORK-165 under are weaker than the record states, one of them because a probe asserts against a copy of the application object it names. The application is releasable; its certificate is not, and I am reopening the certificate rather than the release.

---

## Gate Ruling

**No release gate. Gates R5, R7 and R8 stand closed. The round-9 work gate (WORK-151) and the Round 11 work gate (WORK-164) remain closed on their own terms — with one exception, stated next.**

**The WORK-164/165 acceptance record is reopened, and I am declaring it not closed.** I wrote in the Round 11 supplemental: *"Nothing that writes a debt record is committed before WORK-164 lands with all four assertions green, each having first been demonstrated red by the named change to the application."* Assertion 2 was never green-having-been-red against the application. It is green against `replacementFor()`, a literal living inside `tools/harness/v1-write-flows.js:592-635`. Condition 5 of WORK-165 — *"No horizontal scroll at 320px … via a width-mode probe … reporting `viewport_clientWidth`"* — has never run at 320px, because `package.json:16` carries no `--width`. And the containment property I deliberately stated as a **review** condition checked by eye was substituted by an assertion that tests where three elements sit in the markup, which retired the eye without replacing it.

That is three of the module's conditions. The module is correct in all three cases. The guards are not.

> **Work gate G12. `npm run debts` and the WORK-164 flow group may not be described, in `HANDOFF.md` or in any commit message, as carrying the Debts module's acceptance conditions until WORK-172, WORK-175 and WORK-176 are green having each first been demonstrated red under C40 below. Until G12 re-closes, no NEW debt capability is committed — specifically WORK-173's edit modal, which is a new write path into `db.debts`. Repairs to already-shipped defects are not held.**

The line between what is held and what is not is derived, not chosen. WORK-164's assertions 2, 3 and 4 exist to guard *writes into the debt collections surviving a round trip*. An edit modal is a second writer into `db.debts`. Landing a second writer while the round-trip guard is a copy of itself is landing it under nothing — the same sentence I wrote in round 9 and again in round 11, applied a third time to the same instrument class. WORK-170, WORK-171 and everything below them repair surfaces that already shipped; holding a 23px delete button on a phone behind two S-sized probe items would be ceremony, and ceremony is not what a gate is for.

**G12 re-closes when those three land.** At that point the record is amended in one commit: the WORK-164/165 acceptance is re-declared closed on evidence that exists, and `HANDOFF.md:32-33` — *"carries the seven conditions the screen was approved under"* — is corrected to say which conditions it carries and since when. A gate record that reports a vacuous condition as a met one is the completion-record failure rounds 5 and 6 were spent recovering from, and `HANDOFF.md:96-99` says so in its own words.

---

## Conflict Rulings

### C1 — WORK-170: which selector shape, given the two blast radii

**Ruling: CODE-01's shape. Drop the `.goal-actions` ancestor from all four rules. UI-01's enumeration shape is rejected by name.**

Both reviewers are right about the defect and right that cloning is forbidden. The disagreement is between enumerating containers and making the class the contract. Three grounds, and the first is decisive.

**The file already answers this, eleven lines above the defect.** `.goal-bar` at `:1487` is class-only and it reaches the debt card. `.goal-add` and `.goal-icon-btn` at `:1501-1512` are ancestor-scoped and they do not. The comment at `:1514-1517` names all three as reused; two failed and one worked, and the difference between them is exactly the ancestor. **The mechanism that worked is the mechanism to keep.** That is a derivation from the code under review, not a preference between two styles.

**The shape that caused the defect should not be the shape of the fix, extended by one.** Under UI-01's enumeration, a third module that reuses these buttons gets the identical silent failure — an unstyled native control below 44px, invisible to every functional assertion — and there is no signal at the point of reuse. The blast radius UI-01 calls "closed" is closed today and open to the same defect forever. Under the class-only shape the failure cannot recur: carrying the class is carrying the styling.

**The "open blast radius" is what a class is.** `button.goal-add` still binds the element type, `.goal-actions` and `.debt-actions` keep their own layout rules untouched, and the only elements affected are the ones an author deliberately labelled `goal-add`. Nobody applies that class by accident. Against that, UI-01's shape multiplies the number of places the 44px target is written by one per module — which is precisely the drift the comment at `:1514-1517` was written to prevent, arriving through the fix for the comment being wrong.

**What CODE-01 is right about and I am not fixing now.** A class named `goal-add` on a screen about debt is a name that lies, and both reviewers said so. Renaming is a separate change that removes no risk today, and I will not bundle it. Recorded as debt with a trigger, below.

### C2 — WORK-171: the two formulas

**Ruling: the Engineering Manager's resolution is confirmed. UI-03's inner-cap form, carrying CODE-02's derivation in the comment.**

The equivalence proof is correct and I re-derived it rather than accepting it. The tie-break is also correct and is stronger than the EM presents it: `debtProblem` requires numeric, not integer, so a hand-edited import can carry a non-integer `cost`, and in that case `Math.min(cost, Math.round(…))` returns a fraction while `Math.round(Math.min(paid, total) * cost / total)` returns an integer. This application's money is integer tugrik end to end. **A formula that can only ever return an integer is preferred over one that can return a fraction on data the validators admit, and correctness of financial data is the rule that decides it.** The EM resolved this itself, on a stated ground, and did not need me. That is the right instinct and I want it repeated.

The comment states CODE-02's derivation — paying more than you owe does not buy more interest, the same fact `:8248` already states for flooring outstanding — because the outer-cap form reads as the invariant and the inner-cap form reads as the mechanism, and the comment is where the invariant belongs.

### C3 — WORK-173: is a debt edit modal in scope

**Ruling: both. The risk-register line is corrected here, in this document, at no cost; and the edit modal is approved, scoped tightly, and held behind G12.**

**First, my own line, because it is mine and it is wrong.** `reports/chief-architect.md:581` reads *"`totalToRepay` is a single number, so a renegotiated or variable NBFI loan cannot be represented without editing it, which silently restates history. Acceptable at stage 1. If it bites, the answer is an edit trail, not a rate model."* It presumes an edit capability WORK-165 never built. **Read as amended: at the time of writing, editing a debt did not exist; the only correction path was a delete that cascaded the payment ledger. The renegotiation risk stands unchanged; the sentence describing its mechanism did not.** Both reviewers found this from opposite directions, and CODE-06 is right that a risk register must not describe a capability the code lacks. That correction is now made, it costs nothing, and it does not require a WORK item.

**Second, and separately: is the modal work?** CODE-06 says adding one is a decision, not a fix, and it is right that it is a decision. Here is the decision.

Debts is the only financial collection in this application with a write path and no correction path. Income, both expense kinds, salaries and goals all have one. The substitute offered to a user who mistyped a digit is a confirmation dialogue that names how many payment records it is about to destroy. **That is a data-loss-shaped action offered as the remedy for a typo, in the module whose two defining numbers are entered exactly once and are the inputs to every figure it produces.** Preservation of financial data is the principle above every other in my standing decision, and it does not distinguish between data the app lost and data the app made the user destroy.

Against approving: it was not in scope, and rejecting unnecessary work is cheap. But this is not preference or speculation — it is a named remedy for an observed asymmetry, on a shipped pattern (`openGoalEditModal`, `editCtx.kind`, `#editModal`), at S, adding no machinery. It removes a real risk with the smallest change that removes it. **Approved.**

**And here is where I fence it, because this is the item that grows.** An edit is not an edit *trail*. A trail is what `:581` says the answer is if renegotiation ever bites, and that remains deferred and unbuilt. What is approved is a correction path for a typo, and the conditions below say so in a form that cannot be read as anything else.

### C4 — WORK-178: severity divergence (UI-05 Medium, CODE-12 Low)

**Ruling: the Engineering Manager's handling is confirmed. Both severities stand; priority set to the higher.** Only the reviewer who raised a finding may set its severity, and the EM correctly did not touch either. The two reviewers are weighing different things — a date silently recorded and presented back as chosen, versus an empty control and a sticky value — and both are true. The item is XS either way, so the divergence costs nothing to honour.

### C5 — WORK-174: severity divergence (UI-02 High, CODE-07 Medium)

**Ruling: confirmed, same reasoning.** Priority to the higher, no severity edited, XS either way.

### C6 — the split of UI-02, which the Engineering Manager made and asked me to check

**Ruling: the split is correct, and I would have required it.**

My own standing rule is *never approve two unrelated changes as one piece of work*. UI-02 raised a capability decision and a three-line render fix as one finding. They share a symptom — the form asks for a repayment term and never shows it back — but they are not one change: one needs a scope ruling from me, the other is undisputed by both reports and touches no decision at all. Bundling them would have held an XS behind a decision it does not depend on, which is exactly the failure the rule exists to prevent. The EM split them without diluting UI-02's High across either half, recorded the split explicitly, and priced both. That is the correct call and it is well made.

**One consequence the split creates and I am ruling on: WORK-174 stands on its own and is not folded into WORK-173.** The card is where a note is read; the modal is where it is changed. Goal notes are editable and not rendered on the goal card, which makes debts better than goals in this one respect after WORK-174 lands. I am not sweeping goals to match. An inconsistency in the direction of showing the user their own data more, not less, is not a defect.

---

## Approved Improvements

Fifteen of seventeen approved, two split, several narrowed, two shapes rejected inside approvals. The EM's numbering is kept; where I split an item I use `(a)`/`(b)` rather than renumbering, so every ID in the roadmap still resolves.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-175** | `npm run debts` carries no `--width`, so the 320px condition runs at ~785px | Verified: `package.json:16` has no flag; `run.mjs` builds the sizing iframe, suppresses the gutter and checks `viewport_clientWidth` only when `width` is truthy. My WORK-165 condition 5 named 320px and the command has never taken that measurement. **This is the instrument, and it goes first.** **Conditions: one flag on the existing script — not a fifth runner, not a second script; `t.viewport_clientWidth` verified to come back 320; and the existing overflow flow demonstrated capable of failing at 320 by removing `overflow-wrap: anywhere` from `.debt-name` at `:1534` with the 82-character fixture name in place, then reverted. That last is not optional: WORK-175's whole content is converting a condition that cannot fail into one that can, and an unproven conversion is the defect being fixed.** XS. |
| **WORK-171** | `debtInterestPaid` is uncapped, so an overpaid debt reports a cost the loan could not have carried | Verified at `:8270-8276` against `:8247-8250` and `:8325`: three derived figures, two clamped, one not, and the unclamped one is the number the module exists to produce. Reachable by a duplicate entry or a final payment typed as the total. **Approved in UI-03's inner-cap form per C2, with CODE-02's derivation in the comment.** **Assertion: seed payments beyond `totalToRepay`; assert `debtInterestPaid(d) <= d.totalToRepay - d.principal` and that the rendered cost equals `cost` exactly. Demonstrated red by removing the `Math.min` at `index.html:8275` — an application change. Checked per C40.** The optional overpayment toast at `:8954` is **not** approved: the cap is the fix, and a warning for a state the app now handles correctly is a second surface for no information. XS. |
| **WORK-170** | Debt card action buttons receive no styling and sit below the 44px touch minimum | Measured at 320px, not derived: 23px against 44px, 23x34 against 44x44, on a row whose three controls are the only route to a payment, the only route to the ledger, and a cascade delete. `ui-guidelines.md:65` sets 44x44 and this application is used at 320-430. **Approved in CODE-01's class-only shape per C1: `button.goal-add`, `button.goal-icon-btn`, and the same for both `:hover` rules. `.goal-actions` and `.debt-actions` layout rules untouched.** **Conditions: the comment at `:1514-1517` is corrected to state the derivation — that these classes are container-independent exactly as `.goal-bar` at `:1487` is, and that the ancestor scope is why two of its three named reuses did not happen. `tools/check-contrast.mjs:103`'s annotation is corrected in the same commit, since the pair it names is now actually painted on this screen. Assertion: extend `debts.js` to measure `.debt-actions .goal-add`, `.debt-actions .goal-icon-btn` and, after `navigate('goals'); renderGoals()`, their `.goal-actions` equivalents; assert height >= 44, width >= 44 on the icons, and every measured property EQUAL between the two rows — heights, widths and `backgroundColor` compared site-to-site, never against a hard-coded colour or a pixel literal other than the guideline's 44. Demonstrated red by restoring the `.goal-actions ` ancestor to the `button.goal-add` rule at `index.html:1501` — an application change. Checked per C40. Lands after WORK-175 or the measurement is taken at 785px and means nothing.** XS. |
| **WORK-172** | The WORK-164 import-replacement assertion tests a copy of the object it guards | Verified by the observed demonstration: deleting `debts: []` from the application leaves `npm run v1` green. **This is C37 violated in the round where C37 was the headline lesson, and the process as written was followed.** Site 3 of the six I enumerated — *"a backup imports without its debts, silently"* — is the one that loses a user's records on a restore, and it is unguarded. **Approved in CODE-03's extraction shape: `function importReplacement(parsed) { … }`, a top-level FUNCTION DECLARATION — not a `const`, because `HANDOFF.md:235` records that a top-level `let`/`const` is not a property of the frame's window and a function declaration is, and reaching it from the probe is the entire point. Called by the import handler; the probe calls `frame.contentWindow.importReplacement(...)`. `replacementFor()` is DELETED from the probe, not left beside it. The comment at `v1-write-flows.js:592-593` becomes true rather than being deleted.** A hoisted declaration cannot throw at definition time, so the standing rule about new top-level statements between `let db = load()` and the `#importFile` listener is satisfied — state that derivation in the comment. **Demonstrated red by deleting `debts: []` from `importReplacement` in `index.html` — the perturbation the flow's own comment already names and currently cannot honour. Checked per C40.** S. |
| **WORK-176** | The containment flow cannot fail on the symptom it is named after | Verified: `debts.js:223-236` asserts that three static elements are descendants of `#debts`, which is a property of the markup at `:2529-2534`, not of `renderDebts`. CODE-05's real complaint is the one that matters — I stated containment as a **review** condition checked by eye, and an assertion that looks like a guard stops the eye. **Approved in the snapshot shape: capture `innerHTML` of `#dashboard`, `#income`, `#expenses` and `#goals`, call `renderDebts()`, assert all four byte-identical.** **Conditions, and the second is not optional. (1) The probe header names exactly which screens are covered and states that containment beyond those four remains a review condition — the assertion narrows the eye's job, it does not retire it. (2) Establish the baseline first: take the four snapshots twice with NOTHING between them and assert identical, before asserting across `renderDebts()`. If any screen proves non-deterministic it is dropped from the set and the reason recorded in the probe. An assertion that goes red on correct code is a defect in the assertion, and that is a standing rule this project has already paid for once. Demonstrated red by adding a write to an element outside `#debts` inside `renderDebts` in `index.html` — the shape `:6440-6446` exists to prevent. Checked per C40.** The alternative shape — delete the flow and restore the review condition — is rejected below. S. |
| **WORK-174** | `debtNotes` is collected, stored and never rendered anywhere | Verified: `:2524-2525` collects it, `:8473` stores it, no render path reads it, and payment notes at `:8422` ARE rendered — which makes the asymmetry accidental rather than policy. The placeholder invites the user to record the loan term, which is the single most useful fact about an NBFI loan, into a field nothing can show. **Approved as CODE-07's guarded chip, escaped.** **Conditions, derived from a risk I recorded in round 9 and again in round 11: neither `.debt-meta-item` (`:1542-1547`) nor `.goal-meta-item` (`:1477-1483`) carries `overflow-wrap`, and a note is user-supplied free text. The notes render carries `overflow-wrap: anywhere`, and `debts.js`'s existing overflow flow is extended to seed a long unbroken note alongside the 82-character lender name, still asserting `scrollWidth − clientWidth === 0` at 320. Demonstrated red by removing that `overflow-wrap` — an application change. Checked per C40. Depends on WORK-175; without it the assertion runs at 785px and passes whatever the CSS says.** XS. |
| **WORK-178** | `debtDate` is never initialised and never reset | Verified at `:9147-9149` (three of four entry dates set) and `:8476-8479` (four of five fields reset). `:8470`'s `|| todayISO()` means a blank field silently stamps today and `:8344` then renders that date back as fact. Every sibling form prefills for exactly this reason. **Approved: initialise in the same block as the other three, reset to `todayISO()` alongside the other four fields. One place, four dates.** XS. |
| **WORK-173** | A debt cannot be edited; the only correction path cascades the payment ledger | Ruled in scope at C3. Debts is the only financial collection with a write path and no correction path, and the substitute is a confirmed cascade delete offered to a user who wants to fix a typo. **Approved with six binding conditions. (1) Reuses `#editModal` and a fourth `editCtx.kind === 'debt'` branch in the existing save handler at `:8899-8961`. No new modal element, no new save path. (2) Fields exactly: name, principal, total to repay, date, notes. No others, now or later, without a new ruling. (3) It repeats the `totalToRepay < principal` refusal from `:8466-8469` — REJECTED with a named message, never clamped, for the reason `recurrenceProblem` states at `:3828-3832`. (4) It does not touch `db.debtPayments`. Editing a debt does not adjust, re-date, re-scale or re-derive any payment; the three derived figures re-derive on their own. (5) No edit trail, no version history, no restatement record. `:581`'s edit trail remains the deferred answer to RENEGOTIATION, and this item is the answer to a TYPO. Those are different features and only one is approved. (6) The edit control is a fourth `.goal-icon-btn` in `.debt-actions`, so it lands after WORK-170 or it ships unstyled — the defect being fixed, arriving inside its own fix.** **Two assertions, both C37-complete. (i) After editing a debt through the real control, every one of its payments still resolves and `debtOutstanding` reflects the new `totalToRepay`. Demonstrated red by having the edit branch push a new record with a fresh id instead of mutating in place — the payments orphan and outstanding jumps to the full new total. (ii) An edit setting `totalToRepay < principal` is refused and the stored record is unchanged. Demonstrated red by removing the refusal from the edit branch. Both are application changes; checked per C40. Held behind G12: this is a second writer into `db.debts` and it does not land while the round-trip guard is a copy of itself.** S. |
| **WORK-177** | The module's headline figures sit below a nine-control add form | Verified: source order on `#debts` is add-card, summary, list; `#debtTotalsCard` is the only place "Still owed" appears; and `:8284` already hides it when `db.debts` is empty, so a first-time user still meets the form first with nothing above it. `ui-guidelines.md` says most important information first, and over a debt's life there is one add and many glances. **Approved as the block move only. No CSS, no JS, no change to the empty case, `#debtList` stays where it is.** XS. |
| **WORK-179** | The summary card shows "Still owed" above "Borrowed in total" with the explanation gated off | Verified at `:8299`: `showCost` is a function of what has been PAID, so before the first payment the card headed "All borrowing" shows two figures computed on two different bases, one larger than the other, with nothing saying why — and the gap is largest at exactly that moment. `project.md` requires every screen to be understandable without training by people with little accounting knowledge. **Approved as one ungated sentence stating the relationship. Conditions: no new figure, no new card, no change to the hide predicate — the ruled hide-when-zero behaviour is not reopened and UI-06 correctly did not reopen it. The existing gated sentence at `:8317` is APPENDED when `showCost` is true, not repeated; read the two together and if either restates the other, the gated one is reworded.** XS. |
| **WORK-181** | The debt payment-history modal diverges from the goal history modal | Verified: `:8409` resets the cancel label and `:8446` never relabels it, so the app's one read-only list is dismissed by a button asking what the user is cancelling — where `:8776-8777`, `:5932` and `:6630` all say Close, with the reason written at `:8775`. Plus `.helper` where the sibling uses `.empty`, a bare note where three other sites wrap it in `<span class="note">`, and `closeEditModal()` where the goal modal re-renders in place at `:8792`. **Approved as the union of both reports' sub-fixes, one function, four lines. Condition: the re-render after a payment delete happens only on a successful `save()`, matching the goal path exactly — a modal that refreshes on a failed save presents a stale list as committed.** XS. |
| **WORK-182(a)** | `S_orphan_pay` names a property its case does not test | Verified: `v1-write-flows.js:690` constructs a payment with no `debtId` key at all and the message at `:696` says so, while the variable name promises an orphan check. A name claiming a property it does not test is the same class as a comment stating a result the code does not produce, which this project has now paid for in three separate rounds. **Approved as the rename only, to a name that says what the case tests. Free, and it is currently the only thing in the repository claiming that property. Rides with WORK-172, same file.** XS. |
| **WORK-183** | `withFramesRun` duplicated across two probes, with a narrower vacuity guard in the copy | **Approved in the narrower half only.** `v1-write-flows.js:567` tests income, expense and net; `debts.js:176` tests income and net, so a starved-clock `#kpiExpenses` reading "₮0" passes unnoticed there. That is the guard that makes the stubbed clock trustworthy, and `HANDOFF.md:243` records `requestAnimationFrame` starvation as a live trap in this environment. **Approved: widen `debts.js:176` to include `before.expense`, and point its comment at the full derivation in `v1-write-flows.js` rather than restating it — inputs and a pointer survive an edit, an abbreviated restatement does not.** The extraction half is rejected below. XS. |
| **WORK-184(a)** | `.debt-total-value` is a fourth headline size that is not on the type scale | Verified at `:1561`: `font-size: 20px; font-weight: 800`, where the scale at `:109` is 11/13/15/18/22 and `.kpi .value` at `:897` is `var(--t-h2)` at `var(--w-bold)` with the same wrap release. `ui-guidelines.md` asks for consistent sizing, and a deviation from a project reference is a finding, not a preference. **Approved as pointing the declaration at the existing tokens. Condition: `.debt-total-value` carries `overflow-wrap: anywhere` and lives in a `flex: 1 1 40%` item, so `npm run debts` at 320 must still report `scrollWidth − clientWidth === 0` after the size increases. Depends on WORK-175.** XS. |
| **WORK-184(b)** | `.debt-meta-item` diverges from `.goal-meta-item` in four ways, three of them unintended | Verified declaration by declaration at `:1542-1547` against `:1477-1483`: padding, border, weight, and a literal `11px` where the other uses the token of the same value. **Approved in UI-08's better shape: delete `.debt-meta-item`, use `.goal-meta-item`, and carry `.cost` across as a modifier on it. One component, not two aligned ones.** **Conditions: the merged component uses `var(--t-micro)`, never the literal; `.debt-meta-item.cost`'s `--danger-text` and weight survive verbatim, because that colour pair is measured by `check-contrast.mjs` on both grounds and losing it would be a contrast regression the predicate would catch loudly and late. Lands after WORK-174, which adds a call site — the EM's dependency, confirmed. Separate commit from WORK-184(a): a summary-card token and a card chip are two components, and I do not approve two changes as one piece of work.** XS. |
| **WORK-185** | A debt 99.6% repaid prints "100%" beside a non-zero "still owed" | Verified at `:8325`/`:8341` against `:8326`: `cleared` is the exact test `outstanding === 0`, and the integer beside it is `toFixed(0)`, which rounds. The bar at `:8347` is fractionally more honest than the headline above it. **This is C35's family: the rendered claim must be derived from the same fact as the state it sits beside.** **Approved as `Math.floor(pct)` when `!cleared`, with the comment stating that derivation — the integer agrees with `cleared` because `cleared` is exact. Bar's `toFixed(1)` unchanged.** **Widened to both sites**, the debt card and the goal card at `:8146`/`:8185`, in one commit: UI-09 reported it once because that is where it was newly written, and closing a case while leaving the class is the failure I ruled against in round 9's C33 and said I would not repeat. **Safety valve: if the goal card has no exact terminal test equivalent to `outstanding === 0`, the goal half is DROPPED and the reason recorded in the commit. Do not invent one to make the widening work.** XS. |
| **WORK-186(a)** | `.debt-card`'s bottom margin is a literal where the cards it interleaves with use a token | Verified at `:1527`: `margin-bottom: 14px` against `.card`'s `var(--s3)`. No theme interaction, no elevation question, one declaration. **Approved.** The shadow half is deferred below. XS. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-180** | `contributionProblem` accepts `amount === 0`; change `< 0` to `<= 0` | **Rejected, and I am overruling the Engineering Manager's scheduling of it.** `importProblem` refuses the WHOLE FILE with a named message. So this change converts a backup that imported yesterday into one that cannot be imported today, in exchange for removing a ledger row that CODE-08 itself says produces no wrong figure and sums to nothing. The affected population is files that already contain a ₮0 record — which no editor in this application can produce, so they are hand-edited or hand-merged files, exactly the files whose owner most needs them to still open. `coding-standards.md` says *"Always preserve backward compatibility"*, and it does not carve out Low-severity boundary symmetry. Trading access to a user's own backup for a boundary rule that reads more tidily is the wrong direction on a Low. **Recorded as accepted divergence with a trigger: if the editors' `<= 0` rule is ever relaxed, or if a zero-amount row is ever observed producing a wrong FIGURE rather than a row, this reopens.** Work not done is the cheapest work there is. |
| **WORK-183 (extraction half)** | Move `withFramesRun` into `fixture.js` and run both probes with `--fixture` | Rejected. The two helper BODIES are identical and have not changed since they were written; what diverged is the vacuity guard beside them, and WORK-183(a) fixes exactly that. Deduplicating the stable part would add a `--fixture` flag and a module coupling to `npm run debts` purely to obtain a helper, on a probe that seeds its own store and does not use the fixture dataset. That is premature deduplication with a live coupling cost, for a Low. **Recorded as debt with a trigger: a third probe needing the helper, or the first divergence in the helper body itself.** |
| **WORK-170 (enumeration shape)** | `.goal-actions button.goal-add, .debt-actions button.goal-add { … }` | Rejected at C1. It is the shape that produced the defect, extended by one container, and it re-arms the identical silent failure for the next module that reuses these classes. `.goal-bar` at `:1487` is the file's own proof that class-only reuse works. |
| **WORK-170 (clone shape)** | A `.debt-actions button { … }` block duplicating the rules | Rejected, and both reviewers pre-rejected it. It is the second place for the 44px target to drift that the comment at `:1514-1517` exists to prevent. Recorded so it cannot arrive later as "just make the debt buttons look right". |
| **WORK-171 (outer-cap form)** | `Math.min(cost, Math.round(debtPaid(d.id) * cost / total))` | Rejected on the tie-break at C2. Arithmetically equivalent for every value this application's own write path can produce, but it can return a fraction where `cost` is non-integer, which `debtProblem` admits on an imported file. The form that can only return an integer wins on a money figure. Its derivation is kept, in the comment. |
| **WORK-171 (overpayment toast)** | Warn at `:8954` when `amount > debtOutstanding(d)` | Rejected. UI-03 offers it as a courtesy and says the cap is the fix. Once capped, the app handles the state correctly and the payment modal already shows the outstanding figure in its helper at `:8392`. A warning about a state that is now correct is a second surface carrying no information. |
| **WORK-172 (DataTransfer shape)** | Drive the real `#importFile` input with a synthetic `DataTransfer` | Rejected, as CODE-03 itself suggests. Far more machinery — a synthetic event, an async `FileReader` closure and a settling wait — for a property one extracted function delivers directly. `HANDOFF.md` records that async settling in this harness is where false passes are manufactured. |
| **WORK-176 (deletion shape)** | Delete the containment flow and restore the review condition | Rejected. The flow is cheap, it is one snapshot away from being real, and deleting a guard because it asks the wrong question throws away the place the right question already has a home. Fix the question. |
| **WORK-186 (app-wide sweep)** | Make `.card` track the per-theme `--shadow` | Rejected as out of scope, as UI-10 itself says: a regression surface of every card in the file, on a Low. Recorded, not swept. |
| **UI-08 / UI-10 (mechanical sweeps)** | The 72 font sizes, the 69 spacings, the residual spacing literals | Carried as rejected, now declined a fifth time. Both reviewers correctly declined to re-raise them and I am recording that they were right to. |
| **All round-9 and Round 11 rejections** — carried | Every shape in both rejection tables and their carried predecessors | Unchanged. Nothing in either report re-raises any of them. In particular: no `≈` reading on a debt card, no date filter on the Debts screen, no `kind` discriminator, no APR model, no debt record in `db.income`/`db.planned`/`db.actual`, no third recurrence stepper, no `SCHEMA_VERSION` bump without a transform. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-182(b)** | Import accepts a `debtPayment` pointing at no debt | The exposure is real and CODE-10's evidence is sound: a hand-merged backup can carry money records the Data Summary counts and no screen can show or delete. But the only remedy available today is the same whole-file refusal that WORK-180 was rejected for, applied to a file whose owner may have no other copy — and the same exposure has existed for `goalContributions` for the entire life of the application with no report. **Trigger, and it names the shape rather than a feeling: if `importProblem` ever gains a per-record rejection or quarantine mode, the parent-key check for BOTH `goalContributions`/`goals` and `debtPayments`/`debts` lands with it, in that commit. Or: one observed orphan in a real store.** Building per-record quarantine for this finding alone is a larger change than a Low justifies; building the check without it trades a bad state for a worse one. |
| **WORK-186(b)** | `.debt-card` resolves its shadow from `--shadow` where the `.card`s it interleaves with use `--e1` | The DEFECT is verified at source — `--e1` is declared once and never overridden, `--shadow` is redeclared by fifteen themes — but the FIX DIRECTION is not. Converging `.debt-card` down to `--e1` makes it agree with the plain cards beside it and disagree with `.goal-card`; converging the other way is the app-wide question UI-10 correctly refused to open. Which token is right on a dark ground is a question about how fifteen themes render, and I cannot answer it from declarations. **Trigger, deliberately cheap and identical in kind to WORK-141's: one screenshot of the Debts screen in one dark theme at 390px, taken with the iframe technique at `HANDOFF.md:200-204` during any other harness run. If the debt cards read as floating above the plain cards, converge `.debt-card` AND `.goal-card` to `--e1` in one commit — close the class, not the case. If instead the plain cards read flat, this item inverts into the app-wide question and stays recorded. Do not implement it from the token declarations.** |
| **WORK-168** | Interest reaching Net Balance | Unchanged from Round 11, trigger intact, fix pre-ruled. **Code Review's Future Risks name the live hazard precisely and I am recording it as a condition: WORK-171 lands in the same neighbourhood, and nobody fixes both at once. WORK-171 is a cap inside `debtInterestPaid`; `:6465` is not touched by it and is not touched by anything in this roadmap.** |
| **WORK-169** | Scheduled repayments and reminders | Unchanged, trigger intact, shape pre-ruled. Nothing this round fires it. |
| **WORK-141, WORK-156, WORK-144, WORK-145 / Shape C, WORK-146(b), WORK-85+35, WORK-15, WORK-17, WORK-23, WORK-30, WORK-31, Stage 2** — carried | All round-9 and Round 11 deferrals | **Unchanged, every trigger intact.** Neither report presents evidence against any of them, and the EM correctly scheduled none. **Stage 2 note, carried forward and now sharper: `debtInterestPaid` is the arithmetic function I said in Round 11 was the likeliest first firing of Stage 2's trigger. UI-03 and CODE-02 found a CLAMPING defect in it, not a ROUNDING or arithmetic one — the single `Math.round` is correct, both reviewers re-derived it, and the boundaries at zero payments, `cost <= 0`, `total <= 0` and corrupt `principal > totalToRepay` all verified correct. Stage 2's trigger is a calculation defect a unit test would have caught; a missing clamp on an out-of-range input is not that. It does not fire. Ninth round.** |

---

## Conventions — one strengthened, two added

### C37 was followed, and it still failed. Here is what it was missing.

C37 says: *an approval that names an assertion must also name the perturbation that turns it red, and that perturbation must be a change to the application, not to the expectation.* I wrote it in round 9 after breaking it myself. In round 11 I applied it: WORK-164 assertion 2 named its perturbation — *"Red by deleting `debts: []` from the import replacement object"* — and the implementer filled in the blank. The blank was filled in honestly and the demonstration was performed on the wrong object, because a copy of that object was sitting inside the probe and it reddened exactly as promised.

So the blank was not enough. **A rule that can be satisfied by intention is a sentence; a rule that can be satisfied by editing the wrong file is only slightly better.** Two additions, both operational, both cheap.

**C40 — the red-then-green demonstration is an artifact, not a claim.** For every assertion approved anywhere in this project, from now:

1. Apply the named perturbation with the Edit tool, in `expense-pwa/index.html` only.
2. Run `git diff --name-only`. **The output must be exactly `expense-pwa/index.html`.** If any path under `tools/` appears, the demonstration is VOID and the assertion is not trusted, whatever colour the command returned.
3. Run the command. It must exit non-zero, and the failure message must name **the assertion in question** — not a different one. A throw exits a flow at its first failing assertion (`HANDOFF.md:253-256`), so a red arriving from an earlier assertion is not evidence for this one.
4. Revert with the Edit tool, never `git checkout <file>` (`HANDOFF.md:266-269`). Re-run. Expect 0.
5. The commit message records: the file and line perturbed, the before and after text, the literal output of `git diff --name-only`, the assertion name that went red, and both exit codes.

Step 2 is the whole convention. It is the one step that would have caught CODE-03 in round 11, in the ten seconds it takes to run, and it costs nothing on every occasion it finds nothing.

**C41 — an assertion may not rebuild the application value it guards.** A value an assertion compares against is obtained by calling into the frame (`frame.contentWindow.someFunction(...)`), or by reading the DOM or `localStorage`. It is never a literal reconstructed inside the probe. If the value lives inside a closure and cannot be reached — which is exactly what `index.html:6177-6185`'s inline `replacement` inside an async `FileReader` handler is — **the fix is to extract it into a named top-level function in the APPLICATION, not to copy it into the probe.** The copy is not a shortcut to the guard; it is the absence of one wearing the guard's name. This is the same lesson as *a visibility assertion is not a function assertion*, one level down: a probe may not assert against its own furniture.

C40 and C41 together mean the round-11 failure has two independent ways of being caught, and neither depends on anybody remembering the lesson.

---

## Development Order

**G12 governs: WORK-173 does not land until WORK-172, WORK-175 and WORK-176 are green having each first been red under C40. Nothing else is held.**

**Step 1 — WORK-175.** `--width 320` on the `debts` script, `t.viewport_clientWidth` verified at 320, and the existing overflow flow demonstrated capable of failing by removing `overflow-wrap: anywhere` from `.debt-name`. **First, unconditionally: it is the instrument that three later items are measured with, and today it measures air.** This is the standing convention *land tooling before the fix it will verify*, and this round is the third time it has had to be invoked.

**Step 2 — WORK-171.** The cap, the derivation comment, the new flow, red by removing the `Math.min`. **Second, and I am moving it ahead of the Engineering Manager's placement, with a reason: it is the wrong-financial-figure item, it has no dependency, and correctness of financial data outranks everything else on my list. The EM ordered it third under a defensible reading of the mis-tap risk; on my own ordering rule the arithmetic goes first, and it costs nothing because both land the same day.**

**Step 3 — WORK-170.** The four selectors, the corrected comment, the corrected `check-contrast.mjs` annotation, the geometry assertion measuring both action rows site-to-site. Immediately after, because its instrument is now in.

**Step 4 — WORK-172.** `importReplacement` extracted as a function declaration, the probe calling the frame, `replacementFor()` deleted. Red by deleting `debts: []` from the application.

**Step 5 — WORK-176.** The four-screen snapshot, with its own determinism baseline taken first, and the probe header stating which screens the eye is still responsible for.

**→ G12 re-closes here, in one commit that carries no code change:** the WORK-164/165 acceptance is re-declared closed on evidence that now exists, and `HANDOFF.md:32-33` is corrected to say which conditions `npm run debts` carries and since when. **The wording must not compress this into "the module was approved and verified." It says: three conditions were recorded as met before they could fail, and here is when each became capable of failing. `HANDOFF.md:96-99` records why that distinction is not optional.**

**Step 6 — WORK-174.** Notes on the card, escaped, guarded on presence, with `overflow-wrap` and the long-note seed in the 320px flow.

**Step 7 — WORK-178.** The fourth entry date joins the other three, in the init block and in the reset.

*Sprint 1 ends here. Five XS, two S, seven commits. The time is in the demonstrations, not the edits.*

**Step 8 — WORK-173.** The edit modal, six conditions, two assertions. **After G12 and after WORK-170**, for the two reasons stated in the approval.

**Step 9 — WORK-177**, then **WORK-179**. The two comprehension items on the same screen, adjacent, two commits. Reorder before the sentence, so the sentence is written under the card in its final position.

**Step 10 — WORK-181**, then **WORK-182(a)**, then **WORK-183(a)**. Three XS consistency items in two files; WORK-182(a) rides in `v1-write-flows.js` after WORK-172 has restructured it, which is the EM's dependency and it is correct.

**Step 11 — WORK-184(a)**, then **WORK-184(b)**, then **WORK-185**, then **WORK-186(a)**. Presentation, last, two separate commits for the two halves of 184, and 184(b) after WORK-174 has added its call site.

**Not scheduled:** WORK-180 (rejected), WORK-183 extraction half (rejected), WORK-182(b) (deferred, trigger named), WORK-186(b) (deferred, one screenshot), and every carried deferral.

**Run `npm run verify`, `npm run v1`, `npm run boot`, `npm run recurrence` and `npm run debts` after each commit, and expect 0.** `debts` is now five commands, not four, and after step 1 it is the only one that runs at a phone width.

---

## Architecture Strategy — Next Quarter

Everything in the round-9 and Round 11 Architecture Strategy carries forward unchanged. Added or amended:

**What stays, and is not open for discussion.** Everything already listed, plus: **a debt figure never reaches a period-filtered surface** (C38, now with two shipped examples and one guard that will actually be able to say so after WORK-176), and **a collection whose records must never reach a total keeps its own top-level array** (C39).

**What changes.**

1. **C40 — the red-then-green demonstration is an artifact.** Five steps, above. Step 2 — `git diff --name-only` must print exactly the application file — is the convention; the rest is bookkeeping around it.
2. **C41 — an assertion may not rebuild the application value it guards.** Reach into the frame, or extract in the application. Never copy into the probe.
3. **Reuse across module boundaries is by class, not by container.** Derived this round from the file's own evidence: `.goal-bar` is class-only and reached the debt card; `.goal-add` and `.goal-icon-btn` were ancestor-scoped and reached nothing, while a comment asserted all three were shared. If a component is meant to be reusable, the class is the contract and the container is not part of it.
4. **A shared boundary rule is not tightened at the cost of a file that used to import.** New from WORK-180's rejection. `importProblem` refuses whole files, so every tightening of a validator is a retroactive rejection of somebody's backup. Tighten only where the loose case produces a wrong figure, not merely an untidy row — or build per-record quarantine first.

**What is off limits this quarter.** Everything on the round-9 and Round 11 lists, unchanged, plus three additions:

- **`analyzeExpenses` does not learn that debt exists.** Code Review names this as the most likely place a debt figure gets smuggled onto a period-filtered card by somebody trying to be helpful, and it is right: 26 inline rules over income and expenses, some already goal-aware, one advisor away from telling a user to put their surplus into a savings goal while ₮1,300,000 is outstanding. That advice is arguably wrong, and fixing it by giving the advisor a debt figure is C38 violated on the app's most persuasive surface. **Named here before it is proposed as polish, exactly as Code Review asked.**
- **A second definition of the 44px target.** One rule per control type, class-scoped, and the fix for a control that is not getting it is to make the class reach it, never to write the number again.
- **A rename of `goal-add`, `goal-icon-btn`, `goal-bar` or `goal-meta-item` on its own.** The names lie on a debt screen and both reviewers said so. It removes no risk today and it touches two render sites and eight rules. **Trigger: a third module borrowing any of the four. At that point all four are renamed to module-neutral names in one commit, both render sites updated, and the naming debt closes as a class rather than a case.**

**Risks I am recording, not scheduling. None of these is a finding; no reviewer raised any of them as one.**

- **Mine, and it is the one to watch.** WORK-173 gives `db.debts` a second writer. Every argument for the module's safety — a debt never reaches a Dashboard total — was verified against one writer. The isolation assertion (WORK-165 condition 4) exercises the ADD path through the real control. **After WORK-173, that assertion covers one of two write paths, and nothing says so.** I am not requiring a third assertion for it now; I am recording that the coverage narrowed and naming the trigger: a third writer into `db.debts`, at which point condition 4 is re-derived across all of them rather than extended one at a time.
- **Mine, from the WORK-174 condition.** The user-supplied-text-into-a-fixed-width-container shape, now recurring for the third round running — the display-currency select, the lender name, and now a free-text note in a chip with no `overflow-wrap`. Caught each time by a condition. **It will keep recurring, and the answer is not another condition each time: it is that every chip, pill and card in this file that can carry user text either wraps or is measured at 320. That is a sweep, and sweeps are off limits, so this stays a risk with a per-item condition until something changes.**
- **From Code Review's Future Risks, unscheduled.** The Debts list is unsorted and unarchived, so a year of settled NBFI loans becomes a pile of "✓ Cleared" cards above the live ones. `db.goals` has the identical exposure. Trigger: a real store where the cleared cards outnumber the live ones.
- **From Code Review's Future Risks, unscheduled.** A round-11 export imported by a pre-round-11 build loses its debts on the next save. Not a stated requirement, a `SCHEMA_VERSION` bump would not have changed it, and it is the honest limit of "backward compatible". Recorded so it is not discovered as a surprise.
- **Carried unchanged.** An abandoned debt reads authoritative forever. Interest still does not reach Net Balance (WORK-168). `writeDb` serialises two more collections on every save. The `#converterUse` disabled label. The WebKit `.grid-2` residual. Every consumer re-deriving its own filter pipeline. **The module-boundary problem remains the leading candidate for the quarter after this one, and remains cheaper to live with than to rewrite a render layer with no harness underneath it.**

---

## What I Am Changing From Round 11

Everything not listed here carries forward unchanged.

1. **No release gate. The build is fit for release**, second round running.
2. **The WORK-164/165 acceptance record is reopened and declared not closed.** Work gate G12 re-closes it after WORK-172, WORK-175 and WORK-176. `HANDOFF.md:32-33` is corrected in the same commit.
3. **`chief-architect.md:581` is corrected.** At the time of writing, editing a debt did not exist. The renegotiation risk stands; the sentence describing its mechanism did not. Both reviewers found this and both were right.
4. **An edit path for a debt record is approved**, scoped to a typo correction, fenced from the edit-trail feature `:581` still defers.
5. **New convention C40:** the red-then-green demonstration is an artifact, and `git diff --name-only` must print exactly the application file.
6. **New convention C41:** an assertion may not rebuild the application value it guards; extract in the application instead.
7. **Reuse across module boundaries is by class, not by container** — derived from `.goal-bar` working and `.goal-add` not.
8. **A shared validator is not tightened at the cost of a file that used to import** — WORK-180 rejected on that ground.
9. **`analyzeExpenses` is added to the off-limits list** for any debt figure, before anybody proposes it as polish.
10. **WORK-185 is widened to both cards and WORK-186 is split**, one half approved and one deferred to a screenshot — closing a class where it is cheap, and refusing to guess where it is not.

---

## Final Recommendation

**Add `--width 320` to the `debts` script, and prove it can now say no before you fix anything it is supposed to watch.** In `D:\3_Claude\PowerApps\package.json:16`, add the flag; confirm `t.viewport_clientWidth` comes back 320; then, with the 82-character lender name already in the fixture, remove `overflow-wrap: anywhere` from `.debt-name` at `D:\3_Claude\PowerApps\expense-pwa\index.html:1534`, run `git diff --name-only` and confirm it prints exactly `expense-pwa/index.html`, run `npm run debts` and watch the overflow assertion fail by name, revert with the Edit tool, re-run, expect 0 — and put that whole sequence in the commit message. That is one XS item and it takes an hour, and it is the right first hour because the same command returned green all through round 11 while measuring a 785px viewport that no user has. The lesson I want carried out of this round is not the unstyled button and it is not the uncapped interest, both of which are one line each. It is that in round 9 I wrote C37 — *name the perturbation that turns the assertion red, and perturb the application, not the expectation* — and in round 11 an implementer did exactly that, named the perturbation, ran it, saw red, and was watching a copy of the object the whole time. **The blank was filled in and the blank was not enough. A convention that tells you what to do still needs a step that tells you how to check you did it, and `git diff --name-only` is that step: ten seconds, no judgement required, and it is the difference between a guard and a sentence about one. I have now written three conventions to close this class. This is the first one a person cannot satisfy by meaning well.**

*(Round 12. Supplemental to the round-9 standing decision and the Round 11 supplemental, both of which remain in force in full. Full reports: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\engineering-manager.md`.)*

---
---

# Chief Architect — Supplemental Decision, Round 13

## The gate that could not say no, and a condition I authored wrong

**Sources read in full and unmodified:** `reports/ui-review.md` (8 findings UI-01..UI-08, 90/100, no Critical, no High, two Medium), `reports/code-review.md` (12 findings CODE-01..CODE-12, 84/100, one High, no Critical, four Medium), `reports/engineering-manager.md` (20 items WORK-187..WORK-206, conflict C1, escalations S1-S4), `reports/HANDOFF.md`, `reports/chief-architect.md` — my own round-9 standing decision, Round 11 supplemental and Round 12 supplemental, all three in force — and the four knowledge files.

**Everything in the round-9, Round 11 and Round 12 decisions remains in force.** C22, C30, C34–C41, C38, C39, G12 as re-closed, every rejection, every deferral, every off-limits entry. Nothing below reopens any of them. One convention is added, one is strengthened against its author, and one is extended to instruments.

**Ruling issued on all 20 items, on C1, on S1 through S4, and on the Engineering Manager's deliberate inversion of the Code Review's order. No item is silent.**

---

## Verified Against Source, Not Accepted On Report

- **`tools/lint.mjs:29` against `:37-46`.** Confirmed exactly. The comment-blanking regex runs over `raw` — the whole file — and the `<script>` boundary pass runs after it. A grep for `<!--` returns exactly four sites inside the script region (`4926`, `8265`, `8427`, `8468`) and the script region is lines `2919`–`9422`. I opened all four and confirmed each is inside a template literal assigned to `innerHTML`. **CODE-01 is confirmed at the mechanism and the blind regions are exactly four.**
- **And a second fact neither report names, which changes how WORK-187 must be built.** `index.html:7` contains the literal text `<script>` inside the HTML comment that opens at `:5`. That is the phantom-script hazard `lint.mjs:25-28` documents having found by running the check against itself. **If the boundary pass is simply moved ahead of the comment regex, line 7 opens a phantom script region and the entire stylesheet is linted as JavaScript.** This is not a new finding — it is a binding implementation condition on an approved item, and it is stated below.
- **The four comments contain no backtick and no `${`.** I checked each. So the expected outcome of WORK-187 on a clean tree is exit 0. That does not weaken the EM's risk note; it sharpens what to do if the expectation is wrong.
- **`tools/harness/debts.js:538-539`.** `var a = snapshot(); var b = snapshot();` with nothing between them. **CODE-05 confirmed, and see S4 — the vacuity was specified by me, verbatim.**
- **`index.html:8998-9001` against `:8635-8642`.** The goal path is `const ok = save(); openGoalHistoryModal(goalId); renderGoals(); updateBellBadge();` — unconditional. The debt path gates on `ok`. **UI-04 confirmed; the debt comment at `:8636-8637` asserts a derivation from a property that does not exist.**
- **`index.html:8586`, `:8588`, `:8908`, `:8930`, `:9030`, `:9048`.** All six carry the identical shape `class="money-input" … value="${escapeHTML(<stored number>)}"`, and `formatMoneyInput:4217` strips the decimal point. **CODE-03 confirmed at all six sites, not two.** `:8930` is the one that differs in a way that matters: it is `escapeHTML(g.recAmount || '')` and the empty case is load-bearing — see the WORK-189 conditions.
- **`index.html:5040-5061`.** `navigate()` re-renders dashboard, income, expenses, daily, goals, debts and settings on arrival. Every screen that shows a db-derived money figure is in that list. **CODE-04's one-line fix genuinely closes the class, and I re-derived that rather than accepting it.**
- **`index.html:8409`.** `showCost = Math.round(totalInterest) !== 0` is an aggregate over all debts, so it is true whenever any per-card `costHere` chip is on screen. That is what makes one disclosure sentence on the summary card sufficient for both interest surfaces — see S1.
- **`HANDOFF.md:178-187`.** Four commands listed. My Round 12 order requires five. **Confirmed.**

**Two things arrived observed rather than reported and I am treating them as measured, not as claims:** the `lint.mjs` mechanism as run in practice — a backtick, `verify` green, `boot` red — and the `debts.js:538-539` back-to-back snapshot. Both are discharged under the standing rule that a derived claim is measured before it gates.

---

## Executive Decision

**Yes. This application is fit for release, and I am opening no release gate — third round running.** Two reviewers working independently returned 90 and 84 with no Critical between them, and the one High is a hole in an instrument, not in shipped behaviour: nothing found this round loses stored data, misstates a stored figure, reaches a period-filtered surface, or blocks a user. Round 12's seventeen-item roadmap landed and both reviewers re-derived it at source rather than accepting the record, which is the fourth consecutive round that has happened and is now the most reliable property this project has. What is not fit is again the certificate rather than the build: `npm run verify` can return 0 over a file whose top-level script cannot parse, and one clause of one acceptance condition I wrote in Round 12 describes a construction that cannot fail. **The build ships; the gate gets repaired first, because it is two lines and it is the only thing here that could certify a blank screen.**

---

## Gate Ruling

**No release gate. Gates R5, R7, R8 stand closed. The round-9 work gate (WORK-151) and the Round 11 work gate (WORK-164) stand discharged. G12 stands closed and is NOT reopened.**

**No new gate is opened this round, and I want the reason on the record, because I have opened one in each of the last three rounds and the instrument loses its meaning if it becomes the default.**

> **A gate exists to hold work behind evidence. Where there is no work to hold, the remedy for a wrong record is a record correction in a named commit — not a gate that holds nothing. A gate whose held set is empty teaches the next reader that gates are decorative, and that is a more expensive lesson than the one it purports to teach.**

Applied here: every one of the twenty items is a repair to a shipped defect, an instrument, or a comment. **Nothing this round is a new capability**, so there is nothing a gate could hold. WORK-188 is held behind WORK-187 by a binding ordering ruling, which is sufficient on its own; wrapping a dependency in a gate would be ceremony. I am recording this as a decision rule rather than numbering it as a convention, deliberately: it governs my own instruments and does not need to be cited by anyone else.

---

## Conflict Ruling — C1

### C1 — The two reports diverge on the history-modal save handling

**Ruling: there is no contradiction of fact. Both statements are true within the scope each reviewer checked. UI-04 stands at the severity UI Review set, WORK-195 is approved, and the Engineering Manager was right to decline to resolve it.**

Code Review's Error handling section states the debt writes are clean and names `:8642` specifically. That is true and I re-derived it. UI Review re-derived the *sibling* the debt comment cites and found the sibling does not have the property. That is also true and I re-derived it. A clean statement scoped to one path is not falsified by a defect in another path; it is completed by it. Neither reviewer is wrong and neither is owed a correction.

**What is owed a correction is my own acceptance sentence, and this is the more important half of the ruling.** WORK-181's Round 12 condition read: *"the re-render after a payment delete happens only on a successful `save()`, matching the goal path exactly."* The implementer implemented the first clause correctly and wrote a comment recording the second. **The second clause was false when I wrote it.** The goal path at `:8998-9001` re-renders unconditionally and always has. So the shipped debt behaviour is right, the shipped debt comment is wrong, and it is wrong because it faithfully repeats a derivation I supplied.

That is the same shape as S4 and it has the same author. Read them together.

**Disposition:** WORK-195 makes `:8999` conditional in the shape of `:8642`, which makes the comment at `:8636-8637` true rather than deleting it — the WORK-135 precedent, applied for the fourth time. **Rejected shape: deleting or narrowing the debt comment instead.** Close the harm so the statement becomes true; do not edit a statement down to fit incomplete code.

---

## Rulings on the Engineering Manager's Escalations

### S1 — Is a model-disclosure sentence permitted, and does C36 govern its wording

**Ruling: it is not merely permitted, it is required, and C36 is exactly the convention that requires it. WORK-193 is approved.**

The Round 11 supplemental put *"an interest-rate / APR field, or an amortisation schedule"* off limits. That is a rejection of a **model**. UI-02 proposes no model, no second figure, no branch and no input — it proposes telling the user which model is already in use. Those are different objects and I will not let an off-limits entry expand by association into a prohibition on saying what the application does.

**The affirmative ground is C36, and it is decisive.** C36 says: *one fact per user-facing claim, and it comes from the source the app can defend.* Today the summary card says **"Paid in interest"** and the card chip says **"Interest so far"**, both unqualified. The fact the app can defend is *"the share of the agreed extra proportional to what you have repaid, spread evenly, computed by this application."* The fact those two labels assert is *"the interest your lender has charged you."* **The app is displaying a claim sourced from arithmetic it owns as a claim about a contract it has never seen.** That is C36's target precisely, on the one figure `project.md:32-35` says the module exists to produce, for an audience `project.md:68-70` defines as having no accounting knowledge and no training. I wrote C36 in round 9 over a rate date; it applies with far more force to an interest allocation.

**Conditions, all binding.**

1. **One site, not two.** The disclosure goes once, under the summary card's "Paid in interest" figure, gated on `showCost`. Verified above: `showCost` is the aggregate, so it is true whenever any per-card "Interest so far" chip is rendered. **The per-card chip is not captioned again** — a per-card repetition would put the same sentence on screen once per debt, which is noise, and `ui-guidelines.md:11` asks for reduced cognitive load.
2. **It folds into WORK-192's rewrite of the gated helper. It does not become a third helper line.** Under WORK-179 the block already carries one ungated sentence and one gated sentence. A third would make three sentences of prose under a two-figure card.
3. **Voice.** The sentence uses the voice the application already speaks in — second person or impersonal. **It does not introduce a first-person "we"** unless "we" already appears in a user-facing string, which is a grep and takes ten seconds. `:8442` is the model: *"'Still owed' includes anything you agreed to pay on top of what you borrowed."*
4. **It names the app's arithmetic and the possible divergence, and nothing else.** It does not explain amortisation, does not mention APR, does not offer to model the lender's schedule, and does not apologise. One clause on what the app does, one clause on what that means for the lender's statement.
5. **And this fence is not optional: no fourth sentence in this block, ever, without a new ruling.** I have now ruled the copy under this card in three consecutive rounds — WORK-179, then WORK-192, then WORK-193 — and a screen that grows one sentence per review is a screen that will be unreadable in four more. The block is closed at one ungated sentence and one gated block of two.

**Rejected shapes, so they cannot arrive as polish:** a separate third helper line (condition 2); a qualifier appended to the "Paid in interest" label itself, which would put a caveat inside a heading; a tooltip, an info icon or a disclosure toggle, none of which any reviewer proposed and all of which are a new component for one sentence; and any wording that implies the app could compute the lender's figure if it had more input, which would be an advertisement for the model I put off limits.

### S2 — WORK-189 at six sites or two

**Ruling: six, through one named helper, not six copies of `Math.round`. Two is rejected by name.**

The reviewer is right and this project has ruled it twice — C33 in round 9 and the widening of WORK-185 in round 12. The counter-argument that four sites are "outside this round's scope of change" does not survive contact with the facts: I opened all six and they are character-for-character the same construction in the same file, and the defect is a **wrong financial figure presented to the user in a field they are about to commit**. Correctness of financial data outranks scope tidiness. `CLAUDE.md`'s "never modify unrelated files" governs *files*; these are six lines of one file, all instances of one shape, and none of them is unrelated to the others.

**But six inline `Math.round`s would be closing the case six times, which is not the same as closing the class.** The shape is *"a stored money number rendered into a `.money-input` value attribute"* and it should have exactly one expression.

**Conditions, all binding.**

1. **One helper, defined beside `unmoney`/`formatMoneyInput` at `:4199-4213`**, in the money-input neighbourhood, with a comment stating the derivation: the field is about to be run through `formatMoneyInput`, which strips the decimal point on the first keystroke and on the pre-fill call, so a stored non-integer must be resolved before it reaches the field or the user is shown ten or a hundred times the stored value. **The guard is at the render for the same reason `:4206-4212` puts the other one at the input: the parser is not where this class is fixed.**
2. **It is applied INSIDE `escapeHTML`, never around it — `escapeHTML(moneyValue(x))`.** `check-escaping.mjs` is deliberately narrow and `index.html:4918-4924` records what happened last time an interpolation shape it could not classify appeared in an attribute: the resolution was to hoist, not to widen the check. **Do not teach `check-escaping.mjs` a new shape for this.**
3. **The empty case is preserved at `:8930`.** That site is `escapeHTML(g.recAmount || '')` and renders an empty field with `placeholder="0"`. A helper that folds `''` to `0` would put a literal zero into a field the user left blank and kill the placeholder. The helper passes `''`, `null` and `undefined` through unchanged and rounds only a number. **State the degradation for a non-numeric in the comment rather than leaving it to be discovered.**
4. **No validator is touched.** `debtProblem` and `entryProblem` continue to admit non-integers. Ruling 8 from Round 12 — *a shared boundary rule is not tightened at the cost of a file that used to import* — governs, and it points the other way from tightening.
5. **The WORK-185 safety valve applies:** if any of the six turns out not to share the shape, it is dropped and the reason is recorded in the commit. Do not force a site to fit. On my reading all six fit; `mGoalRecInterval` at `:8927` is not one of them and is not a money input.

**One consequence I am stating rather than hiding.** After this change, a user who opens and saves an edit on a hand-imported record carrying `1000.5` stores `1001`. That is a 0.5 tugrik restatement, it is visible in the field before they commit, it happens only on an explicit Save, and it is the application's unit of record asserting itself. It replaces a 9,004.5 tugrik error. I record it because a silent restatement of stored money is exactly the thing this project reads reports about, and I would rather it be found in this paragraph than in round 15.

### S3 — WORK-202: scheduled item or recorded risk

**Ruling: not an item. Rejected as scheduled work and converted to a recorded risk with a trigger and a pre-ruled fix, in the WORK-16/49 shape. The Engineering Manager's instinct is correct and I am taking the option it offered.**

Three grounds. **C34:** the finding is arithmetic, and the reviewer says so in its own words — *"negligible at realistic sizes"*, reported only because the review area asks about quadratic work over a growing list. A cost stated as an arithmetic shape is not a measurement and does not schedule itself. **`coding-standards.md:7`:** *"Never optimize prematurely."* This is the textbook instance — a `Map` introduced to replace six filters over a collection that in a real store holds tens of records. **And the smallest change that removes the risk is no change**, because the risk is not present: debts are few and long-lived by the nature of the thing being modelled, and unlike the Dashboard cost in WORK-16/49 there is no argument that a user cannot escape it, because there is nothing to escape.

Leaving it "Later" would leave it to be re-raised every round by every reviewer who reads the review brief, which is how WORK-16/49 consumed four rounds.

> **Recorded risk. `renderDebts` performs about six full passes over `db.debtPayments` per debt (`index.html:8400-8402`, `:8448-8454`, helper at `:8329-8333`); `goalSaved:8210-8214` has the identical shape. Trigger: a probe under `tools/harness/`, run through `run.mjs`, reporting `renderDebts()` above 100ms against a seeded store of 200 debts and 5,000 payments — or any observation of a slow Debts screen on a real store. If anyone ever takes the WORK-16/49 measurement, `renderDebts` is added to that same probe in that same commit; this does not earn a second instrument. If it fires, the fix is PRE-RULED and needs no architect round: one `Map` of `debtId → { paid, count }` built at the top of `renderDebts` and read in both loops, `goalSaved` untouched, no other consumer, nothing indexed.**

**This is a rejection of an item the Engineering Manager did not drop, which is a different thing from dropping it — that distinction was correctly drawn in the escalation and I am honouring it.**

### S4 — Is the G12 record reopened a second time

**Ruling: no, the gate is not reopened. Yes, the record is amended, once, in the WORK-191 commit. And the defect is mine in a stronger sense than the escalation states, which I am putting on the record before anything else.**

**First, the ownership, because the user's own note attributes this error to the implementer and that is wrong.** My Round 12 condition on WORK-176 reads, verbatim:

> *"(2) Establish the baseline first: take the four snapshots twice with NOTHING between them and assert identical, before asserting across `renderDebts()`."*

`debts.js:538-539` is that sentence compiled. The implementer did not misread the condition, cut a corner, or fill in a blank dishonestly — **they implemented my words exactly, and my words specified a construction that cannot fail.** "With nothing between them" is the defect, written by me, in the same document in which I added C40 and C41 to stop assertions that cannot fail, one page after I wrote *"an assertion that goes red on correct code is a defect in the assertion."* I am overruling the self-attribution in the brief: this is the third consecutive round in which an acceptance condition of mine has been satisfiable by a construction incapable of failing — round 9's assertion 3, round 11's assertion 2 against a copy, and now this — and it is the first of the three where the wording itself was the fault rather than the implementation of it. See the strengthening of C37 below.

**Second, why the gate is not reopened, and I have tested this against the temptation to be lenient with myself.** G12 held *new debt capability* behind three instrument repairs, because the round-trip guard was a copy of itself — a **live** hole in a guard's ability to say no, with a second writer into `db.debts` queued behind it. Neither condition holds now.

- **The containment assertion itself is real.** Code Review says so explicitly and I re-derived it: `renderDebts()` genuinely runs between `a` and `after` at `:547-550`, and a stray write outside `#debts` is caught. The guard can say no.
- **The baseline is a precondition against a FALSE RED, not against a false green.** Its stated job was to stop the comparison reddening on a correctly non-deterministic screen. A vacuous precondition of that kind does not weaken the guard's ability to fail; it weakens its ability to avoid failing wrongly. That is a genuinely lesser fault and I will not inflate it to match the last one.
- **Nothing is queued.** No new debt capability is proposed anywhere in this roadmap. A gate here would hold the empty set.

**Third, the hole that IS real and that neither the escalation nor the reviewer named.** Because `stable` is computed at runtime and `:551` iterates only `stable`, a future non-determinism in any of the four screens would **silently remove that screen from containment coverage** while the command stays green and `t.J_dropped` names it in output nobody is required to read. That is a guard that can quietly say yes to less every run. It is latent rather than live, so it does not move the gate — but it is what WORK-191 must close, and it is why WORK-191 is approved widened rather than as written. It is also the reason for C42.

**The amendment, and its exact scope.** In the WORK-191 commit, and in no other:

> **The G12 closing record is amended. WORK-176's containment assertion was green having first been red on the named application perturbation, and that statement stands. WORK-176's second condition — the determinism baseline — was recorded as met on a construction that could not fail, because the condition as written specified two snapshots with no render between them. The baseline became capable of failing on `<commit>`. The author of the defective condition was the Chief Architect. The gate is not reopened; nothing was held behind it.**

**The wording must not compress this into "the baseline was fixed."** `HANDOFF.md:96-99` records why. And WORK-181's false clause from C1 is amended in the WORK-195 commit in the same shape, in one sentence: the acceptance condition compared the debt path to a property of the goal path that the goal path did not have.

---

## Ruling on the Order Inversion — WORK-187 before WORK-188

**Ruling: the Engineering Manager's inversion is upheld. Code Review's Recommended Refactoring §1 is overruled on order only, not on content. WORK-187 lands first.**

Both of the EM's reasons are sound and I am adding the one that makes it not a matter of judgement.

**The standing convention is *land tooling before the fix it will verify*** — invoked in round 9, Round 11 and Round 12, and this is the fourth. It is not a preference; it exists because a fix landed under a guard that cannot see it is a fix landed under nothing.

**C40 requires the demonstration to be an artifact.** WORK-188 deletes all four regions in which the artifact is produced.

**And the decisive one: taking WORK-188 first makes WORK-187 unfalsifiable against the shipped file.** Once the four comments are JavaScript block comments, the blind region is empty. The only remaining demonstration would be to add an in-template HTML comment back in order to break it — that is, to demonstrate a gate against a construct the codebase no longer contains. That is a demonstration against a hypothetical, and C40 exists precisely to stop demonstrations that are about something other than the shipped application. Today the perturbation is one character in a comment that ships, in a file whose own prose claims the hazard is guarded. **That artifact exists now, it has already been produced once in practice, and it will not exist again after WORK-188. Spend it.**

Code Review is not wrong about anything except the order, and its ordering argument — that removing the cause removes the need — is the argument for doing both, which I have approved.

---

## Ruling on the WORK-187 Implementation Risk

**I agree with the Engineering Manager, without qualification, and I am adding the thing that must be done and two things that must not.**

Once `lint.mjs` stops blanking comments inside script regions, ESLint sees those four comments' real bytes for the first time. If the clean tree goes red on the first run, **that is a defect surfacing, not a regression introduced.** The bytes were always there; the instrument was not. A gate that finds something the moment it is repaired has just justified its repair.

**On the facts I expect it to stay green.** I opened all four and none contains a backtick, a `${`, or a `*/`. I am recording that expectation so that a red run is treated as information rather than as a surprise, and so that nobody quietly concludes the fix was wrong.

**What must be done if it goes red.** The offending bytes are corrected in `expense-pwa/index.html` **in the same commit as WORK-187**, with the commit message recording the exact before and after text and the fact that the gate's first true statement about that region was to reject it. Repairing what your new gate immediately catches is part of landing the gate; it is not a second piece of work and it does not violate the one-change rule. The tree does not go to `main` red.

**What must NOT be done, and each of these is a named rejection:**

- **Re-narrowing the regex, or restoring comment blanking inside script regions "just for the template literals."** That is the defect, re-armed, wearing the fix's commit hash.
- **An `eslint-disable`, an ignore path, or any edit to `eslint.config.mjs` to make the red go away.** The configuration is not the thing under repair.
- **Reordering to land WORK-188 first because the problem then disappears.** That is hiding a live defect behind a cleanup and it destroys the artifact at the same time.
- **Editing the comment prose to appease the linter without recording what was wrong.** If a byte in a shipped comment can stop the script parsing, the fact that it was there is the most valuable output of the whole item.

**And the implementation condition neither report states, which I verified at source.** `index.html:7` contains the literal text `<script>` inside the HTML comment opening at `:5`. **A naive reordering — boundary pass first, comment regex second — reintroduces the exact phantom-script defect `lint.mjs:25-28` documents having found by running the check against itself**, and the symptom is spectacular: `inScript` flips true at line 7 and the whole stylesheet is linted as JavaScript. The fix must therefore be **a single pass that tracks HTML-comment state and script state together**: while outside a script region, a line inside an HTML comment is blanked and is *not* tested for script tags; while inside a script region, comments are left alone. Roughly ten lines, line numbering preserved exactly as `:8-11` promises. **And `:8-11` is corrected to state what the tool actually removes** — CODE-01's second clause, which I am making a condition rather than an option.

**The cheap check that the phantom defect has not returned:** `lint.mjs:73` prints `lint: <N> script lines checked`. **N must be identical before and after WORK-187.** If it jumps to several thousand, the boundary pass is eating the stylesheet. That is one number, on screen, on every run, and it costs nothing.

---

## Approved Improvements

Nineteen of twenty approved. One rejected outright. Two narrowed against their own reviewer's recommendation. Two merged into one commit. Conditions are binding.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-187** | `npm run verify` returns 0 on a file whose script cannot parse | Confirmed at `lint.mjs:29` against `:37-46`, with exactly four blind regions verified individually at source. A static gate that can certify a completely dead application is the round-6 "the machine could not say no" defect returning through the one instrument nobody re-derived. **Conditions: one interleaved pass tracking comment state and script state together — a naive reorder reintroduces the phantom-script defect at `index.html:7`, which I verified; `:8-11` corrected to state what the tool removes; `lint: <N> script lines checked` identical before and after; the demonstration is the instrument pair under C40(b) below. FIRST, unconditionally.** S. |
| **WORK-188** | Developer commentary inside four template literals, emitted into the DOM on every card render | ~780 bytes of prose re-emitted per debt card, per goal card, and sixteen times per theme-picker open, plus a lexical hazard guarded only by hand-written prose. `coding-standards.md` asks for clean structure; commentary that ships as markup is not that. **Approved on its own merits — that developer prose reaches the user's DOM — and NOT on the ground that it causes WORK-187, which WORK-187 fixes independently.** **Conditions: relocate by hoisting the explained expression into a named const with the block comment above it, on the file's own `:4918-4924` precedent — do NOT park a twelve-line comment twenty-five lines from what it explains; every word of text preserved; the two "NO BACKTICKS IN THIS COMMENT" warnings DELETED rather than carried, because after the move they describe a hazard the code no longer has and a comment stating a constraint that does not exist is the class this project has paid for in four rounds; the commit records that the WORK-187 artifact is no longer reproducible and names the commit where it was performed.** S. |
| **WORK-189** | A stored non-integer is multiplied by a power of ten when any edit modal repopulates it | Verified at all six sites, not two. `escapeHTML(1000.5)` → `"1000.5"` → `formatMoneyInput` strips the point → the field displays `10,005` and Save stores `10005`. A wrong financial figure at the moment a user corrects a typo. **Approved at SIX sites per S2, through ONE named helper beside `unmoney`/`formatMoneyInput`, applied INSIDE `escapeHTML(…)`, preserving the empty case at `:8930`, touching no validator, with the WORK-185 safety valve. One assertion, at the debt principal site.** S. |
| **WORK-190** | The import handler re-renders four screens; the application has seven | Verified: `navigate():5040-5061` re-renders every screen that shows a db-derived money figure. So `renderSettings(); navigate(document.querySelector('.screen.active')?.id \|\| 'dashboard');` genuinely closes the class rather than adding the two missing screens. The banner control `#dataErrorImport` is reachable from any screen, and today a user who restores from Debts keeps looking at pre-import cards whose "+ Payment" button is dead and silent. **Conditions: `renderSettings()` stays and becomes belt-and-braces, which the comment must say; the comment states the derivation — `navigate()` is the seam that renders every money screen on arrival, so the list cannot drift again. Ships with NO assertion, deliberately: the code path lives inside an async `FileReader` closure, C41 forbids copying it into the probe, and extracting a one-line function purely to make it reachable is machinery for a Medium whose recovery is one tab tap. WORK-166 is the precedent for a deliberate assertion absence.** XS. |
| **WORK-191** | WORK-176's determinism baseline cannot fail, and its comment claims a property it does not have | Confirmed at `debts.js:538-539`. **The vacuity was specified by my own Round 12 condition, verbatim — see S4.** **Approved WIDENED, and the widening is not optional: (1) re-render between the two snapshots — wrap the four `navigate()/render()` calls at `:525-530` in a function, call it, snapshot `a`, call it again, snapshot `b`; (2) declare the covered set in the file and THROW, naming the screen, when a screen is not in `stable` unless it appears in a written allow-list with a recorded reason — the allow-list is empty today. Clause 2 closes the hole nobody named: `:551` iterates only `stable`, so a future non-determinism silently narrows containment coverage while the command stays green. Without clause 2 the baseline still cannot redden and the item repeats itself. The G12 record amendment rides in this commit and nowhere else.** XS. |
| **WORK-192** | The cost helper's "That extra" resolves to the agreed extra, not to the figure it sits under | Verified: the demonstrative's only antecedent is `totalToRepay − principal`, a constant of the loan, while the figure is the paid-so-far share. On the module's own fixture the sentence names 300,000 above a printed 150,000. A defect introduced by the WORK-179 rewording, on the one figure `project.md:32-35` says the module exists to produce. My WORK-179 condition tested the two sentences for restatement; it should have tested them for reference. **Approved. Lands as ONE commit with WORK-193 — see below.** XS. |
| **WORK-193** | Nothing tells the user the interest split is the app's own even allocation | **Approved under S1. Required by C36, not merely permitted by it: two unqualified labels present the app's own arithmetic as a fact about a contract the app has never seen.** **Five binding conditions at S1: one site gated on `showCost`; folded into WORK-192's rewrite, not a third helper line; the app's existing voice with no first-person "we"; the app's arithmetic and the possible divergence and nothing else; and the block is closed at three sentences permanently.** XS. |
| **WORK-194** | The debt note is the only chip carrying user text with no caption or marker | Verified at `:8485` against `:8483`, `:8484` and the goal chips at `:8237`/`:8247`. The one chip whose content the app cannot vouch for is the one chip that reads exactly like the two app-authored facts beside it. **Approved as the `📝` prefix only. Condition: no border, no colour modifier, no new class — `.goal-meta-item.note` already carries the only declaration this chip needs.** XS. |
| **WORK-195** | The goal history modal re-renders unconditionally after a failed save | Ruled at C1. On a failed write the list redraws without the deleted row while the toast reports `SAVE_FAILED_MSG` — an uncommitted delete presented as committed beside a message saying it was not. **Approved as `if (ok) openGoalHistoryModal(goalId); else closeEditModal();`, matching `:8642`. `renderGoals()` and `updateBellBadge()` stay unconditional, matching `renderDebts()` at `:8635`. Ships with NO assertion: reddening it requires a failing `save()`, and a failed-write probe is a new capability that a Low does not buy. Acceptance is a side-by-side re-read of both functions, with both four-line quotes in the commit message. If a failed-save probe is ever built for another reason, BOTH history modals get an assertion in that commit — recorded so it is not re-litigated. The WORK-181 record amendment rides here.** XS. |
| **WORK-196** | `openGoalHistoryModal` sets an `editCtx` kind with no branch in the save handler | Verified at `:8957` against `:8606` and the fall-through at `:9234-9237`. Unreachable today only because a button is hidden; one change to `focusablesIn` or to the reset order and it is a throw reaching `reportFatal()` to tell a user their saved data could not be read. The sibling written after it does the right thing. **Approved as `editCtx = null`. After WORK-195, same function, two commits — two different classes.** XS. |
| **WORK-197** | WORK-184(a)'s condition cannot detect a font-size increase on a wrap-released element | The complaint is correct: `overflow-wrap: anywhere` converts overfill into a mid-token break, so the page-overflow assertion reads zero on the failure as well as on the success, and my condition was satisfied by an instrument that cannot see the property the change put at risk. **Approved NARROWED, against the reviewer's own recommendation: record `t.E_cost_value_rects` — `getClientRects().length` on `.debt-total-item.cost .debt-total-value`, seeded with a seven-figure amount — as a LABELLED DIAGNOSTIC in the existing 320px flow, with NO assertion. The `=== 1` assertion is rejected below. The observed value goes in the commit message; if it is greater than 1 that is an observation for the next UI round, not a guard now.** XS. |
| **WORK-198** | The 320px flow justifies its fixture with a deleted class and a property that is now false | Verified: `.debt-meta-item` was deleted by WORK-184(b) and `.goal-meta-item.note` at `:1502` **does** declare `overflow-wrap: anywhere`, so both halves of the sentence are false. The seed remains correct and load-bearing. `HANDOFF.md:424-427` makes naming the guaranteed behaviour in the probe's own header a standing rule. **Approved, and it ABSORBS the header half of WORK-197: the rewritten header names `.goal-meta-item.note` and `index.html:1502` as the declaration under test, AND states what the flow does and does not guarantee — it guarantees no page overflow at 320; it does not guarantee that a figure does not wrap, because the application accepts wrapping over sideways scroll by the recorded decision at `index.html:890-896`. Written LAST in the `debts.js` pass, after WORK-199 and WORK-197 have settled the flow's final shape.** XS. |
| **WORK-199** | WORK-174's user-visible behaviour is unguarded; only its CSS half is | Verified: deleting the note render at `:8485` leaves the flow green, because the page simply stops overflowing. `run.mjs:45-46` states the house rule this breaks in the file's own words. **Approved: throw "setup failed: the note chip did not render" BEFORE the overflow assertion, so it is the first to fail. `t.E_card_width` is LABELLED as a diagnostic rather than dropped or compared — it is useful context when the overflow assertion fires and there is nothing honest to compare it against that page-overflow does not already imply. First in the `debts.js` pass.** XS. |
| **WORK-200** | The WORK-173 orphaning demonstration reddens a different assertion than the one it names | Verified against `HANDOFF.md:271-273`: a throw exits a flow at its first failing assertion, so a `push` perturbation reddens `:309` and never reaches `:312`, which is the assertion the flow is named for. **Approved, with the condition that makes it real rather than cosmetic: the corrected comment is written only AFTER the named perturbation has been run and observed to redden `K_id` at `:312` by name. If the run reddens `:309` instead, the comment records whichever perturbation actually reaches the named assertion. The failure message goes in the commit. A comment recording a demonstration nobody performed is the exact class this item exists to close.** XS. |
| **WORK-201** | Flow K states its expectation by re-running the application's formula | Not a C41 breach in substance — the expression is a compile-time constant — but it obscures the hand-checkable figure the comment at `:324` already supplies, two flows after the file argues against exactly this. **Approved as `if (t.K_interest !== 166667)`. Hand-check recorded in the commit: 500,000 × 500,000 ÷ 1,500,000 = 166,666.67, rounds to 166,667. No perturbation needed; `npm run debts` still exits 0.** XS. |
| **WORK-203** | The service worker cache string was not bumped for round 12 | The file's own instruction at `sw.js:1`. Mitigated by `staleWhileRevalidate` — an installed user gets the new build on their second load — but the rule exists so old caches are purged at `:32-39`, and a GitHub Pages deploy workflow now exists. **Approved as `expense-tracker-v12`, in the last commit before any deploy. One bump per deploy, not one per sprint.** XS. |
| **WORK-204** | The required-field asterisk is decoration on four of five fields; no edit modal marks required fields at all | Verified: a grep for `aria-required` returns `:2239` and nothing else, and the two edit modals enforce five rules between them while marking none. An unexplained red glyph teaches nothing to the audience `project.md:68-70` names, and a screen reader announces "star" with no programmatic requirement behind it. **Approved NARROWED: `aria-required="true"` goes only on inputs whose save handler actually refuses them — derived from the handler, never assumed — which is the five already marked, plus name/principal/total in the debt modal and name/target in the goal modal, which also gain the mark. NO legend line: UI-05 pre-rejects it and is right that the `sHourly` helper pattern is where a rule needs explaining and would be noise repeated five times. No visual change to the five existing sites.** S. |
| **WORK-205** | An excluded Analytics category keeps its exclusion when it leaves the range, but its chip disappears | Verified at `:7251-7258` against the four consumers, and the calendar is where it bites because `renderCalendar` reads `db.actual` in full at `:7147` while still applying `dailyExcluded` at `:7166`. Figures quietly excluding data with no visible control and no indicator is the failure that costs most trust on an analytics screen, and `ui-guidelines.md:11` asks for the opposite. **Approved in the chip shape: render a chip for every id in `dailyExcluded` even with no data in range, appended after the sorted list at `:7259` with `₮0`. `.chip.off` already exists and already carries `aria-pressed`; no new component, no new state. The count-badge alternative is rejected below. Last, and droppable if the sprint runs long.** S. |
| **WORK-206** | `HANDOFF.md`'s runbook lists four commands where the standing order requires five | Verified at `HANDOFF.md:178-187`: `npm run debts` is absent, and it is the only command that runs at a phone width. Anyone following the handoff rather than the standing decision runs the wrong set — which is how a runbook becomes the thing that certifies a build. **Approved, and MOVED into Sprint 1 after WORK-187 and WORK-188, not Sprint 2: both dependencies land in Sprint 1, and a runbook that misdescribes the gate is exactly what this round is about. One documentation edit, stating the five commands and what `verify` covers after WORK-187 — specifically that it can now fail on a parse error anywhere in the shipped script, which it could not before.** XS. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-202** | `renderDebts` scans `db.debtPayments` six times per debt | **Rejected as scheduled work; converted to a recorded risk with a trigger and a pre-ruled fix — S3 above.** The reviewer labels it *"negligible at realistic sizes"* and reports it only because the review area asks. C34: arithmetic is not a measurement. `coding-standards.md:7`: never optimize prematurely. Unlike WORK-16/49 there is not even an argument that a user cannot escape it, because there is nothing to escape. Leaving it "Later" would leave it to be re-raised every round, which is how WORK-16/49 consumed four. **Work not done is the cheapest work there is.** |
| **WORK-197 (assertion shape)** | `getClientRects().length === 1` on `.debt-total-value`, asserted | **Rejected, against the reviewer's own recommendation.** It asserts a property the application does not hold: `.kpi .value` has run at the same token with the same wrap release in narrower `.grid-2` tiles for many rounds, and the comment at `index.html:890-896` records that wrapping was **deliberately chosen** there over sideways scroll. So an asserted line count would go red on correct code the first time a longer amount, a wider theme font or a raised token meets it — and *"an assertion that goes red on correct code is a defect in the assertion"* is my own standing rule, which I broke once already this quarter. The reviewer was right that nothing measures the property and honest that it had not measured it; the answer is to measure it every run and assert nothing, which is what WORK-197 is approved as. |
| **WORK-197 (do nothing)** | Leave the WORK-184(a) condition as it stands | Also rejected. The condition was reported met on an instrument that cannot see the property, and *"nobody has measured it"* is not a state to leave a headline money figure in when the measurement is one line inside a flow that already runs at 320px. |
| **WORK-189 (two-site shape)** | Fix only the two debt sites | Rejected at S2. Closing the case and leaving the class is the failure this project has ruled against twice — C33 in round 9 and the WORK-185 widening in round 12. All six sites are the identical construction in the identical file and the defect is a wrong financial figure in a field the user is about to commit. |
| **WORK-189 (six-copy shape)** | Six inline `Math.round(...)` expressions | Rejected. That is closing the case six times. One named helper, one definition, grep-checkable. `coding-standards.md:11` — avoid duplication. |
| **WORK-189 (validator shape)** | Tighten `debtProblem`/`entryProblem` to require integers | Rejected. Ruling 8 from Round 12 governs: `importProblem` refuses whole files, so every tightening is a retroactive rejection of somebody's backup. The reviewer identified this itself and pointed the fix at the render. |
| **WORK-193 (third-sentence shape)** | The disclosure as a separate third helper line under `.debt-totals` | Rejected at S1 condition 2. Three sentences of prose under a two-figure card is the opposite of `ui-guidelines.md:11`. It folds into the gated sentence being rewritten anyway. |
| **WORK-193 (per-card shape)** | Caption the "Interest so far" chip on every debt card | Rejected. `showCost` is the aggregate and is true whenever any card chip renders, so one sentence on the summary card covers both surfaces. A per-card repetition is the same sentence once per debt. |
| **WORK-193 (model shapes)** | Anything that computes, offers or explains the lender's own schedule | Rejected and already off limits from Round 11 §5(b) and the Round 11 off-limits list. UI-02 explicitly re-proposes none of it and was right not to. Named here so the disclosure sentence cannot become the doorway. |
| **WORK-195 (comment-deletion shape)** | Delete or narrow the debt comment at `:8636-8637` instead of making it true | Rejected. WORK-135's precedent, applied a fourth time: close the harm so the statement becomes true rather than editing a true-sounding statement down to fit incomplete code. |
| **WORK-205 (count-badge shape)** | Show a count beside the "Categories" title when `dailyExcluded.size > 0` | Rejected as the lesser of two equal-cost shapes. It announces that a filter is active without putting the control that clears it back on screen; the chip keeps the control adjacent to the state it controls, which is the actual complaint. Same effort, strictly less. |
| **WORK-204 (legend shape)** | A legend line explaining the asterisk on each form | Rejected, and UI-05 pre-rejects it. Noise repeated five times; the `sHourly` helper is the right pattern where a rule genuinely needs words. |
| **WORK-206 (scope creep)** | Rewriting `HANDOFF.md`'s procedure sections while fixing the runbook | Rejected pre-emptively. One block, five commands, one sentence on what `verify` now covers. A handoff document edited broadly during an unrelated repair is how a record acquires claims nobody derived. |
| **WORK-188 (park-the-comment shape)** | Move the twelve-line comments to sit above the whole card map | Rejected. It puts the prose twenty-five lines from what it explains, which converts a precise derivation into an essay. Hoist the explained expression into a named const, on the file's own `:4918-4924` precedent. |
| **WORK-187 (regex-narrowing shape)** | Keep blanking comments inside script regions for template literals only | Rejected. That is the defect with a new commit hash. See the implementation-risk ruling. |
| **WORK-187 (naive-reorder shape)** | Run the `<script>` boundary pass first, then the comment regex on non-script lines | Rejected on a fact I verified: `index.html:7` contains the literal text `<script>` inside an HTML comment, so the boundary pass would open a phantom region at line 7 and lint the stylesheet as JavaScript — the exact defect `lint.mjs:25-28` records finding by running the check against itself. One interleaved pass, or nothing. |
| **All round-9, Round 11 and Round 12 rejections** — carried | Every shape in three rejection tables and their carried predecessors | Unchanged and not re-raised by anyone. In particular: no `≈` reading on a debt card, no date filter on the Debts screen, no `kind` discriminator, no APR or amortisation model, no debt record in `db.income`/`db.planned`/`db.actual`, no "Loan" entry in `db.incomeTypes`, no third recurrence stepper, no `SCHEMA_VERSION` bump without a transform, no `analyzeExpenses` learning that debt exists, no second definition of the 44px target, no rename of the four `goal-*` classes on its own, no fifth runner. **Both reviewers correctly declined a fifth time to re-raise the app-wide font-size and spacing sweeps, and I am recording that they were right.** |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-202** | `renderDebts`'s six passes over `db.debtPayments` | **Not deferred as an item — rejected and converted to a recorded risk (S3).** Listed here so the ID resolves. Trigger and pre-ruled fix are in the risk register below. |
| **WORK-186(b)** | `.debt-card` resolves its shadow from `--shadow` where its neighbours use `--e1` | Unchanged from Round 12. Still held behind **one screenshot** of the Debts screen in one dark theme at 390px, taken during any other harness run. UI Review correctly declined to re-raise it and correctly declined to guess the fix direction. Do not implement it from the token declarations. |
| **WORK-141** | The four reminder checkboxes sized by the rule authored for text fields | Unchanged, still the oldest open item, still held behind one screenshot of Settings → Notifications at 390px. Referenced correctly by UI Review rather than re-raised. |
| **WORK-182(b)** | Import accepts a `debtPayment` pointing at no debt | Unchanged, trigger intact: per-record rejection or quarantine arriving in `importProblem`, at which point the parent-key check lands for both `goalContributions`/`goals` and `debtPayments`/`debts` in that commit — or one observed orphan in a real store. |
| **WORK-168** | Interest reaching Net Balance | Unchanged, trigger intact, fix pre-ruled. **Nothing this round moves toward it and nothing in WORK-192/193 touches `:6465`.** The disclosure sentence approved at S1 makes the exclusion *more* explicit to the user, which is the correct direction while the deferral stands. |
| **WORK-169** | Scheduled repayments and reminders | Unchanged, trigger intact, shape pre-ruled. Nothing this round fires it. |
| **WORK-156 / WORK-16/49** | `drawMonthlyTrend` walks the entire database once per month | Unchanged, sixth round. Trigger unchanged and closeable by a probe through the existing runner. **Amended in one respect only: if that measurement is ever taken, `renderDebts` is added to the same probe in the same commit** — see the WORK-202 risk. No second instrument. |
| **WORK-144, WORK-145 / Shape C, WORK-146(b), WORK-85+35, WORK-15, WORK-17, WORK-23, WORK-30, WORK-31** — carried | All standing deferrals | **Unchanged, every trigger intact.** No report presents evidence against any of them and the Engineering Manager correctly scheduled none. |
| **Stage 2** — carried | Pure-logic module and test runner | **Not promoted, tenth round.** Trigger unchanged: a rounding or arithmetic defect in `calcSalary`, `stepDate`, `computeRange`, `plannedOccurrences` or `debtInterestPaid`. Code Review re-walked `debtInterestPaid` at every boundary this round — zero, exact-total, overpayment, `cost <= 0`, `total <= 0`, `NaN`, `Infinity` — and found it correct at all of them. **CODE-03 is worth a specific word because it looks like a firing and is not: it is a defect in a RENDER expression that repopulates a field, not a defect in a money calculation. A unit test over `debtInterestPaid` would not have caught it; opening the modal on a non-integer record does. The trigger does not fire.** |

---

## Perturbations — Every Approved Assertion, and How the Author Proves the Perturbation Fired

C40 and C41 are mine and this round found two more guards that could not say no. So this table is mandatory, not illustrative. **Where an item ships with no assertion, that is stated, with the reason.** Every perturbation is a change to `expense-pwa/index.html` unless the item is an instrument repair, in which case C40(b) below governs.

| Item | What is guarded | Perturbation | How the author proves it fired |
|---|---|---|---|
| **WORK-187** | `verify` can fail on a parse error anywhere in the shipped script | Insert one backtick into the comment at `index.html:8468-8479` | **C40(b) pair.** Before the fix: `npm run verify` exits **0** and `npm run boot` exits non-zero — that contrast is the defect. After the fix: `npm run verify` exits **1** and the reported message is a **parse** error at a line inside 2919–9422, not a style rule. Plus `git diff --name-only` prints exactly `expense-pwa/index.html`; plus `lint: <N> script lines checked` prints the same N before and after, which is the phantom-script check. Revert with the Edit tool, re-run all five, expect 0. Both exit codes, both messages and both N values in the commit. |
| **WORK-188** | Nothing — a relocation | none | Not an assertion. Proof is a grep: `<!--` returns **no line between 2919 and 9422**; the text of all four comments is byte-preserved apart from the two deleted backtick warnings; `npm run verify` exits 0. Commit records that the WORK-187 artifact is now unreproducible and names the commit where it was performed. |
| **WORK-189** | A stored non-integer does not reach a money field multiplied | Remove the rounding from `index.html:8586` | Seed `db.debts[0].principal = 1000.5`, open the edit modal **through the real edit control**, assert `#mDebtPrincipal.value === '1,001'` — a hand-checkable literal, per CODE-09's lesson, never a re-run of the expression. Red run prints the observed `10,005`, which is exactly ten times wrong and is the symptom. `git diff --name-only` = `expense-pwa/index.html`. |
| **WORK-190** | — | — | **No assertion, deliberately.** The path is inside an async `FileReader` closure; C41 forbids copying it into the probe and extracting a one-line function for the probe is machinery for a Medium whose recovery is one tab tap. WORK-166 is the precedent. Review condition: read the handler and confirm no screen name is written literally in it. |
| **WORK-191 (a) baseline** | The four screens actually render deterministically | Make one render non-deterministic — append `<span hidden>${Math.random()}</span>` to `renderIncome`'s output in `index.html` | `npm run debts` exits **non-zero** with a message **naming `#income`** as not snapshotting deterministically, and `t.J_stable_screens` prints `dashboard,expenses,goals`. **Note precisely why clause 2 of the approval is not optional: without the declared-set-plus-allow-list check, this same perturbation leaves the command GREEN, because `:551` iterates only `stable` and income has silently left it. If the run is green, the widening was not implemented.** |
| **WORK-191 (b) containment** | `renderDebts` writes nothing outside `#debts` | Add a write to an element on another screen inside `renderDebts` | Unchanged from Round 12 and still valid. **Run as a separate pass** — a throw exits a flow at its first failing assertion, so (a) and (b) cannot be demonstrated in one run. Message names the screen. |
| **WORK-192 + WORK-193** | — | — | **No assertion, deliberately.** A string-presence check is a visibility assertion, and this project's standing convention is that a visibility assertion is not a function assertion. WORK-166's precedent, second use. Acceptance is reading the ungated and gated sentences together against the printed figure on the fixture — 1,000,000 borrowed, 1,300,000 total, 650,000 paid, 150,000 printed — and confirming the prose describes 150,000 and says whose arithmetic produced it. |
| **WORK-194** | — | — | No assertion. WORK-199's setup assertion already guards that the chip renders; the marker is one string. |
| **WORK-195 / WORK-196** | — | — | **No assertion, with the reason recorded** (a failed-save probe is a new capability a Low does not buy). Acceptance for WORK-195 is the two four-line quotes side by side in the commit. WORK-196 is unreachable today by construction and there is nothing honest to redden. |
| **WORK-197** | Nothing — a diagnostic | none | **Explicitly not an assertion and must not be described as one.** `t.E_cost_value_rects` on a seven-figure seed is recorded in the commit message. If it is greater than 1, that is an observation carried to the next UI round as evidence, not a guard now. |
| **WORK-198** | Nothing — a header | none | Not an assertion. The header must name `.goal-meta-item.note` and `index.html:1502` as the declaration under test, and state the one thing the flow does **not** guarantee. |
| **WORK-199** | The note chip actually rendered before the overflow measurement is taken | Delete the `${d.notes ? … }` render at `index.html:8485` | `npm run debts` exits non-zero with **"setup failed: the note chip did not render"**, and it must be the **first** assertion in that flow to fail — place it before the overflow throw. Deleting the note reduces overflow rather than causing it, so there is no competing red. |
| **WORK-200** | That the recorded demonstration reaches the assertion it names | `db.debts = db.debts.filter(x => x.id !== editCtx.debtId).concat({ ...d, id: uid() })` in the edit branch | The failure message must name **`K_id` at `:312`**, not `'the edit created a second debt'` at `:309`. **The comment is written after the run, recording whichever perturbation actually reached `:312`.** The failure message goes in the commit. This item is void if the comment is written first. |
| **WORK-201** | — | — | No perturbation: the change replaces a compile-time constant with the same constant written out. Hand-check in the commit: 500,000 × 500,000 ÷ 1,500,000 = 166,666.67 → 166,667. `npm run debts` exits 0. |
| **WORK-203 / WORK-204 / WORK-205 / WORK-206** | — | — | No assertions. WORK-204 and WORK-205 are verified by reading the save handlers and the chip builder respectively; WORK-205 additionally re-runs `npm run debts` at 320 to confirm the extra chips do not push the row sideways — the existing overflow assertion covers it and must stay green. |

---

## Conventions — one added, one strengthened, one extended

### C42 — a guard that can narrow its own coverage must narrow it loudly, and a measurement nothing compares is labelled diagnostic

Derived from two findings this round, not invented: `debts.js`'s `stable` set can silently shrink (CODE-05, second order), and `t.E_card_width` is measured and compared to nothing (CODE-06). Two clauses.

**(a)** Where a probe computes at runtime the set of things it will assert over, that set is compared against a set **declared in the file**. Any shortfall throws, naming the missing item, unless the item appears in a **written allow-list with a recorded reason**. A coverage set that shrinks silently is a guard that says yes to less on every run and never says no — and it does it without anybody editing anything, which is worse than a guard that was never written.

**(b)** Every value a probe records is either compared by an assertion in the same flow, or is **labelled in the flow header as a diagnostic, with the reason it is not asserted**. `run.mjs:45-46` already says a probe that reports zero matches is not a pass; this extends the same rule to a probe that reports anything nobody reads. A number printed beside real assertions reads as a checked one.

C42(b) is what permits WORK-197 to exist at all in its narrowed form, and it is the reason that narrowing is honest rather than a dodge.

### C37, strengthened — against its author, at authoring time

C37 says: *an approval that names an assertion must also name the perturbation that turns it red, and that perturbation must be a change to the application, not to the expectation.* Round 12 added C40 (the demonstration is an artifact) and C41 (a probe may not rebuild the value it guards) after C37 was followed and still failed. **This round it failed a third way, and the new way is the one none of the three covers: the condition itself specified a construction incapable of failing.** "Take the four snapshots twice with NOTHING between them" is my sentence, the implementer compiled it faithfully, and no artifact discipline could have caught it because there is no application perturbation that reddens a comparison of a thing with itself.

> **Added to C37: before I publish an acceptance condition that names an assertion, I write the perturbation that reddens it and check that the perturbation reddens THAT assertion by name. If I cannot write one, the condition does not ship — the condition is the defect, not the implementation of it.** C30 said an acceptance condition must be able to fail on the symptom. C37 required the perturbation to be named. This requires the naming to happen **before the condition is published**, by its author, which is the only point at which the fault this round was introduced could have been caught. I would have discovered it in the writing, exactly as I would have in round 9, and once again I did not have to write it.

### C40(b) — the instrument clause

C40 governs a change to the application verified by an instrument. **When the approved change is to the INSTRUMENT, the demonstration is the same application perturbation run twice: once against the old instrument, which must be green — that green IS the defect — and once against the new, which must be red.** Both exit codes and both messages go in the commit message. A one-sided demonstration of an instrument repair proves the instrument can fail; it does not prove it could not fail before, and the whole content of an instrument repair is the difference.

WORK-187 is the first item to land under it and is the reason it exists.

---

## Development Order

**No gate governs. The one binding sequence constraint is WORK-187 before WORK-188, ruled above and not negotiable.**

### Sprint 1 — the gate, the money, and the sentence. Seven commits.

1. **WORK-187.** The interleaved comment/script pass; header at `:8-11` corrected; `N` identical before and after; C40(b) pair in the commit message. **First, unconditionally.** If the clean tree goes red, the offending bytes are corrected in the same commit and the commit says so.
2. **WORK-188.** Four comments hoisted out on the `:4918-4924` precedent; the two backtick warnings deleted; the commit records that the WORK-187 artifact is now spent.
3. **WORK-189.** One helper, six sites, inside `escapeHTML`, empty case preserved, one assertion at the debt principal.
4. **WORK-190.** One line, `renderSettings()` kept as belt-and-braces, comment states the `navigate()` derivation.
5. **WORK-191.** Re-render between the snapshots, plus the declared-set-and-allow-list clause. **The G12 record amendment rides here and nowhere else.**
6. **WORK-192 + WORK-193 — one commit, one string.** I am overriding the Engineering Manager's two-commit sequencing, with the reason: once S1 is ruled, these are two clauses of one sentence about one figure in one block, and writing that sentence twice leaves a window in which it is half-corrected. **If S1 had gone the other way, WORK-192 would have shipped alone — the EM's split was the right call to make while the decision was open, exactly as C6 was in round 12.** This is not two unrelated changes as one piece of work; it is one sentence.
7. **WORK-206.** The runbook, after both its dependencies. **Moved forward from the EM's Sprint 2**, because a handoff that tells the next person to run four commands is the instrument this round exists to repair, and it should not outlive the sprint that repairs it.

**Sprint 1 clears the single High and every Medium in both reports.** Roughly two engineering days, most of it demonstration and five commands per commit rather than edit time.

### Sprint 2 — the probe pass and the consistency items.

8. **WORK-199** — the setup assertion, and `E_card_width` labelled.
9. **WORK-197** — the diagnostic rect count, same flow, after 199.
10. **WORK-198** — the flow header, **last in that flow**, absorbing WORK-197's "what this does not guarantee" sentence. The EM's reasoning for putting the comment last is correct and I am confirming it: a comment written before the flow's final shape is a comment that is wrong again by Friday.
11. **WORK-200** — perturb, observe, *then* write the comment.
12. **WORK-201** — the literal.
13. **WORK-195**, then **WORK-196** — two commits, same function, two classes. The WORK-181 record amendment rides in 195.
14. **WORK-194** — the marker.
15. **WORK-204**, then **WORK-205** — the two S items, last, droppable if the sprint runs long without anything else moving.
16. **WORK-203** — `expense-tracker-v12`, in the last commit before any deploy. If round 13 deploys after Sprint 1, it moves into Sprint 1's final commit instead.

**Not scheduled:** WORK-202 (rejected, risk recorded), and every carried deferral.

**Run `npm run verify`, `npm run v1`, `npm run boot`, `npm run recurrence` and `npm run debts` after each commit, and expect 0. Five, not four — and after WORK-187 the first of them can finally fail on a dead script.**

---

## Architecture Strategy — Next Quarter

Everything in the round-9, Round 11 and Round 12 Architecture Strategy carries forward unchanged. Added or amended:

**What stays, and is not open for discussion.** Everything already listed. A single self-contained `index.html` opened from disk; no framework, no build step, no bundler. `localStorage`, single-blob, one write seam, `load()` total, quarantine before write, numbered append-only migrations. `stepDate` as the one recurrence engine. Offline-first, mobile-first, and correctness of financial data above everything. A debt figure never reaches a period-filtered surface (C38). A collection that must never reach a total keeps its own array (C39). **And new this round, stated because it was almost lost: a figure the application computed by a model of its own is labelled as such wherever it is presented as a fact about the outside world.** That is C36 read for what it always meant, and the Debts interest split is the first place it has bitten.

**What changes.**

1. **C42** — coverage that can narrow must narrow loudly; a measurement nothing compares is labelled diagnostic.
2. **C37 strengthened** — the author of a condition writes the reddening perturbation before publishing the condition, or the condition does not ship.
3. **C40(b)** — an instrument repair is demonstrated by the same application perturbation run against both the old and the new instrument.
4. **A gate is opened only where there is work to hold.** Recorded as a decision rule, unnumbered, governing my own instruments. Where there is nothing to hold, a wrong record is corrected in a named commit.

**What is off limits this quarter.** Everything on the round-9, Round 11 and Round 12 lists, unchanged — including `analyzeExpenses` learning that debt exists, a second definition of the 44px target, a standalone rename of the four `goal-*` classes, a fifth runner, a `SCHEMA_VERSION` bump with nothing to transform, a date filter on the Debts screen, an APR or amortisation model, and a `≈` reading on a debt card. **Four additions:**

- **A fourth sentence in the `.debt-totals` helper block.** Closed at one ungated and one gated block of two, permanently, per S1.
- **Widening `check-escaping.mjs` to admit a new interpolation shape.** The check is narrow on purpose. `index.html:4918-4924` records the correct response — hoist the expression — and WORK-189 must follow it rather than teach the predicate.
- **Suppressing a lint failure by configuration.** No `eslint-disable`, no ignore path, no `eslint.config.mjs` edit to make a red go away. If the repaired gate rejects something, the something is what changes.
- **A fifth static predicate.** The ceiling is four plus one and it is a ceiling on runners and predicates alike; WORK-189's class-closure is guarded by one assertion and one grep, not by a new gate.

**Risks I am recording, not scheduling. None of these is a finding; no reviewer raised any of them as one.**

- **`renderDebts` performs about six full passes over `db.debtPayments` per debt**, and `goalSaved` has the identical shape. Trigger: a probe through `run.mjs` reporting `renderDebts()` above 100ms against 200 debts and 5,000 payments, or an observation on a real store. If the WORK-16/49 measurement is ever taken, this rides in the same probe. **Fix pre-ruled: one `Map` at the top of `renderDebts`, `goalSaved` untouched.** (S3.)
- **Mine, new, from re-deriving UI-07.** The Analytics category chips are built from the current date range while `renderCalendar` reads `db.actual` in full. So after WORK-205 one control still governs two differently-scoped surfaces — a chip derived from a range, applied to a heatmap that has none. WORK-205 restores the control; it does not reconcile the scopes. If anyone reports confusion about the heatmap after WORK-205, the question is which surface the chips are supposed to govern, and it is a UI question, not a code one.
- **Mine, from the WORK-189 ruling.** Opening and saving an edit on a hand-imported non-integer record resolves it to whole tugrik. Visible before commit, explicit, and 1,000 times smaller than what it replaces — but it is a silent restatement of stored money and it is recorded here rather than discovered later.
- **Mine, from WORK-197.** `.debt-total-value` may break mid-figure at 320px and nobody knows. After WORK-197 it is measured on every run and asserted by nothing. That is deliberate; if the number comes back greater than 1 it is evidence for the next UI round, and the reason it is not a guard is that the application accepts wrapping over sideways scroll by a recorded decision at `index.html:890-896`.
- **Carried unchanged.** Cleared debts accumulate unsorted and unarchived, same exposure as `db.goals`. The isolation assertion covers one of two write paths into `db.debts` since WORK-173, trigger named. The `goal-*` naming debt with its third-module trigger. The `--shadow`/`--e1` divergence and WORK-141, one screenshot each. The user-supplied-text-in-a-fixed-container shape, fourth round running. An abandoned debt reads authoritative forever. Interest still does not reach Net Balance. The `#converterUse` disabled label. Every consumer re-deriving its own filter pipeline. **The module-boundary problem remains the leading candidate for the quarter after this one, and remains cheaper to live with than to rewrite a render layer with no harness underneath it.**

---

## What I Am Changing From Round 12

Everything not listed here carries forward unchanged.

1. **No release gate, third round running. No new work gate, and the reason is on the record: a gate is opened only where there is work to hold.**
2. **G12 is NOT reopened. Its closing record is amended once, in the WORK-191 commit**, naming which clause of which condition was vacuous and who authored it.
3. **The vacuity of WORK-176's baseline is recorded as MINE, not the implementer's.** The Round 12 condition said "with NOTHING between them" and the probe is that sentence compiled.
4. **WORK-181's acceptance condition is recorded as containing a false clause** — the goal path it was matched against does not have the property. Amended in the WORK-195 commit.
5. **New convention C42:** coverage that can narrow must narrow loudly; an uncompared measurement is labelled diagnostic.
6. **C37 is strengthened against its author at authoring time**, which is the only point at which this round's defect was catchable.
7. **C40 gains clause (b):** an instrument repair is demonstrated against both the old and the new instrument.
8. **The Engineering Manager's inversion of the Code Review's order is upheld** — WORK-187 before WORK-188 — with a third reason: landing 188 first makes 187 unfalsifiable against the shipped file.
9. **WORK-189 is widened to six sites through one helper**, and **WORK-192 and WORK-193 are merged into one commit**, and **WORK-197 is narrowed from an assertion to a diagnostic against its own reviewer's recommendation**, and **WORK-202 is rejected outright and converted to a risk**. Four places where I moved the roadmap, each with its reason beside it.
10. **A model-disclosure sentence is permitted on the Debts summary card and the helper block is then closed permanently at three sentences.**

---

## Final Recommendation

**Repair `tools/lint.mjs` first, in one interleaved pass, and prove it with the pair before you spend the artifact.** With the tree clean, insert one backtick into the comment at `expense-pwa/index.html:8468-8479`, run `git diff --name-only` and confirm it prints exactly that path, then run `npm run verify` and record that it exits **0** while `npm run boot` exits non-zero — that green is the defect and it is the only time you will be able to photograph it. Revert with the Edit tool. Then rewrite `lint.mjs` as a single walk that tracks HTML-comment state and `<script>` state together, blanking comments only while outside a script region and never testing a commented line for a script tag — **not** by moving the boundary pass ahead of the regex, because `index.html:7` contains the literal text `<script>` inside an HTML comment and that reorder relights the phantom-script defect the tool's own header records finding by running the check against itself. Confirm `lint: <N> script lines checked` prints the same N as before. Re-apply the same backtick, confirm `verify` now exits 1 with a **parse** error inside the script region, revert with the Edit tool, run all five commands, and put both exit codes, both messages and both N values in the commit. Then move the four comments out, and after that the money helper, the navigate seam, the determinism baseline, and the sentence under "Paid in interest".

The lesson I want carried out of this round is not the linter, which is two lines. In Round 12 I wrote three conventions to stop assertions that cannot fail — C30 said the condition must be able to fail, C37 said name the perturbation, C40 said produce the artifact and check `git diff --name-only` — and then, in that same document, I wrote an acceptance condition whose own words instructed the implementer to compare a thing with itself. **The implementer did not cut a corner. They compiled my sentence exactly, and my sentence specified a guard that cannot say no.** Every convention I have written so far constrains the person who implements the condition. None of them constrained the person who writes it. **From this round I write the reddening perturbation before I publish the condition, and if I cannot write one, the condition does not ship — because that is the one place in this whole chain where nobody is checking my work, and it is now the third round running that it has been the place the defect came from.**

*(Round 13. Supplemental to the round-9 standing decision, the Round 11 supplemental and the Round 12 supplemental, all three of which remain in force in full. Full reports: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\engineering-manager.md`.)*
