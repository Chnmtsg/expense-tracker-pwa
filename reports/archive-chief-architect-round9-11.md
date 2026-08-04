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
