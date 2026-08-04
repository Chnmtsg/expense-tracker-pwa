# Chief Architect — Final Engineering Decision

**Round 8.** Sources read in full and unmodified: `D:\3_Claude\PowerApps\reports\ui-review.md` (6 findings, 80/100, one High), `D:\3_Claude\PowerApps\reports\code-review.md` (8 findings, 82/100, one High), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (14 items WORK-128..WORK-141, conflicts C27–C30). Also read before ruling: `knowledge/review-conventions.md`, `knowledge/project.md`, `reports/chief-architect.md` (my round-7 decision), `reports/HANDOFF.md`.

**This report replaces the round-7 decision as the standing decision.** Everything in round 7 carries forward unchanged except the seven items named in "What I Am Changing From Round 7".

---

> ## SUPPLEMENTAL — Feature design ruling: base currency at first run
>
> Sits above the display-currency supplemental. Round 8 carries forward unchanged.
>
> **REJECTED — WORK-146.** A user-chosen base currency, stored, never converted.
> Four independent grounds:
>
> 1. **No user.** A prospective person in another country, zero observed members.
>    The standing rule (`HANDOFF.md:76-78`) rejects shapes returning on a
>    projection rather than an observed harm — now extended from polish to
>    features.
> 2. **No acceptance condition can fail on the symptom.** "The unit of record
>    changed correctly" is a claim about what an integer *means*, and every
>    instrument here reads integers. C30 applied *before* the approval instead
>    of after it. **This is the ground to keep if the others were discarded.**
> 3. **Larger than the display shape already rejected as too large** — those 65
>    `fmt(` sites *plus* 17 input fields, storage semantics, the export blob, the
>    import validator, six magnitude constants, and every currency-shaped literal
>    in the harness.
> 4. **It makes `amount`'s meaning conditional on another field.** `3400` would
>    mean 3,400 or 34.00 depending on `baseCurrency` — in a single-blob store, in
>    a finance app.
>
> **Verified beyond the brief, and each enlarges the finding:**
> - `formatMoneyInput:3712` is `oldVal.replace(/\D/g,'')` writing straight back to
>   `input.value`. **The decimal point is deleted at the keystroke**, before
>   `unmoney:3703` is ever reached. The constraint is enforced twice.
> - **Six bare currency-magnitude constants in `analyzeExpenses`** — `:5876`,
>   `:5903`, `:5926`, `:6044`, `:6084`, `:6085` — and `:5905` prints one as
>   user-facing prose: `` `${smallExp} small purchases (< ₮5K each)` ``. Under a
>   EUR base the insights engine degrades into silence and nonsense, **with every
>   command green**. Currency-agnosticism is a property of every scale-bearing
>   constant, not of the formatters.
> - **The harness contains zero `₮` and zero `MNT`.** `v1-write-flows.js:104`'s
>   `'3,400'` is a *grouping* assertion and passes through a symbol swap untouched.
> - `:5717-5724` spreads `...parsed` **last**, so an unknown `baseCurrency` key in
>   a backup enters the store without passing `importProblem` at all.
> - `calcSalary` is **less** Mongolia-specific than claimed: a generic hourly
>   calculator whose two jurisdiction figures are editable fields whose own helper
>   text says *"change it if yours differs"*.
>
> **WORK-146(a) — swap the symbol, keep whole units — rejected hardest**, because
> it looks cheap: it ships an app that deletes the decimal as the user types and
> records €4.50 as €450. A wrong financial figure, Critical, introduced as a
> feature. And it fails its own goal — `:5905` still prints `< ₮5K`.
>
> **Also rejected:** WORK-147 (currency in the blob — correct check, but with one
> currency it could never come back red, the defect WORK-129 was removed for; it
> becomes a *clause* of the pre-ruling); WORK-148 (optional Salary Calculator —
> unrelated bundling, overstated premise, real cost); WORK-149 (first-run flow as
> a host for a rejected feature); and pre-rejected: routing the 58 `₮` literals
> through a symbol constant.
>
> **APPROVED — WORK-150 (XS):** comments at `:3702`/`:3707` stating that the unit
> of record is the whole tugrik and that `formatMoneyInput` deletes a typed
> decimal before `unmoney` sees it. Two proposals in two rounds each re-derived
> this from source — an observed cost, twice paid. **Comments only; a `const
> CURRENCY` in the diff means it was implemented wrongly.**
>
> **APPROVED — WORK-143 assertion 4, tightened (not new work):** it must assert
> the literal `₮`, not only `'3,400'`. That single character is the only
> machine-checkable statement in this repository that the unit of record has not
> moved.
>
> **Deferred, pre-ruled so it needs an implementation round and not another
> design round — WORK-146(b):** minor units in storage. **Trigger: one real
> person, one named currency with a minor unit, with data to enter.** Shape:
> every amount an integer count of minor units including MNT, whose factor is
> **1** — deliberately deviating from ISO 4217 because the möngö is not in
> circulation, which is what means existing figures do not move; one v2→v3 step;
> `baseCurrency` in the blob with `importProblem` refusing a mismatch; one
> `formatMoney(amountMinor, currency)` seam; and the six `analyzeExpenses`
> thresholds re-expressed as multiples of a per-currency unit.
>
> **WORK-144's trigger has NOT fired** — it was gated on extending the `≈`
> enumeration, a different axis. Not promoted by this ruling.
>
> **Sequencing unchanged.** A rejected item gets no position. WORK-150 sits last.
>
> **Strategy:** no field's meaning may depend on another field's value. An
> acceptance condition that cannot fail is disqualifying *before* approval. A
> capability request whose beneficiary does not exist is a risk with a trigger,
> not work. **Off-limits added:** a symbol constant; `baseCurrency` anywhere; any
> change to `unmoney`/`formatMoneyInput` permitting a decimal separator; a
> first-run flow; making any core module hideable.

---

> ## SUPPLEMENTAL — Feature design ruling: display currency
>
> A capability request, ruled before implementation because it touches the
> money-of-record invariant. Not a review round.
>
> **The requested shape — every figure in the app rendered in a chosen currency
> at the current rate — is REJECTED.** Four independent reasons, any one
> sufficient:
>
> 1. `fmtCurrency:7058` rounds to **whole units** with no minor-unit table, so a
>    ₮500 expense renders `USD 0`. A wrong financial figure.
> 2. `round(a·r) + round(b·r) ≠ round((a+b)·r)`, so converted rows would not sum
>    to converted totals — reintroducing app-wide the exact defect
>    `index.html:4588-4596` records and closed: *"a breakdown could print parts
>    that did not add up to its own total, which is the one thing a breakdown
>    exists to do."*
> 3. Entry stays MNT (`unmoney`, `Amount (₮)`, quick amounts), so the app would
>    display USD and accept ₮ on one screen.
> 4. 65 `fmt(` sites and 58 `₮` literals — a large mechanical sweep, already on
>    the standing off-limits list.
>
> **THE GOVERNING DISTINCTION: a unit of record is not a reading.** MNT is the
> unit of record — every stored amount, every input, the export, the whole
> payroll domain. A reading is an approximation of a recorded figure in another
> unit: marked `≈`, carrying the rate and its date, sitting **beneath** the
> figure it reads, never replacing it, and permitted to be absent.
>
> **The invariant that makes it safe:** *a converted figure is displayed beneath
> the ₮ figure it reads, never instead of it; and no card ever shows more than
> one converted figure.* Converted arithmetic is never on screen, so it can
> never fail to add up — structural, not arithmetic.
>
> **APPROVED — WORK-142 (S):** the `≈` reading at exactly two elements,
> `#kpiNet` and `#sNet`, and nowhere else. Not the KPI components, not the
> salary breakdown, not rows, axes, quick amounts, goals or any input. `fmt()`,
> `fmtCompact()` and `unmoney()` unmodified; no stored value touched; the export
> blob byte-identical. Preference lives in `rememberUiPref` beside
> `conv-last-from` — **not** `db.settings` — validated against `ALL_CURRENCIES`
> per `:7088`. MNT is the off state, so the feature ships default-off. Rates read
> from cache only, **never fetched on boot or in a render**; refreshed only when
> the user opens the picker. No rate ever fetched → control unavailable, with the
> explanation in a **sibling helper line, not the disabled control's label**
> (`:7081` is the live example of getting that wrong).
>
> **APPROVED — WORK-143 (S):** four assertions in `v1-write-flows.js`, no new
> file, no new runner. (1) acceptance — the `≈` line matches
> `Math.round(net × rate)`, red before the feature exists; (2) offline honesty —
> no rate, no `≈` anywhere, and free to run because the harness has no network;
> (3) storage invariance — switching currency leaves the blob byte-identical;
> (4) unit-of-record invariance — rows still show `3,400` and `₮`. Assertion 4 is
> what makes the rejected shape impossible to land by accident.
>
> **Deferred:** WORK-144 minor-unit table (hard gate on extending the
> enumeration to any small figure); WORK-145 more sites, one at a time, on
> observed use; Shape C a real multi-currency ledger — trigger is *the user
> actually transacting in a second currency*, which is not this request.
>
> **Sequencing, not negotiable:** nothing starts until the eleven outstanding
> round-8 items land and `round-8` merges to `main` — one 8,000-line file, and
> `HANDOFF.md:208-210` records that late commit boundaries here cost the project
> twice. WORK-132 in particular is the third round on the same false property.
>
> **Strategy amendments:** a unit of record is not a reading; no card shows more
> than one converted figure; rates fetch on explicit user action only — offline
> is not a state the app detects, it is the state the app is designed for.
> Added to off-limits: re-denominating any stored amount, converting any input
> or list row or chart axis or breakdown component, and putting a display
> currency in `db.settings` or the export blob.

---

> ## SUPPLEMENTAL — WORK-129 re-ruled, and gate R8 closed
>
> Issued after the decision below, on measurement taken with the corrected
> harness. **This supersedes WORK-129's entry in the tables below.**
>
> **WORK-129 does not land, and is removed from the gate on measurement rather
> than on implementation.** UI-01's premise does not reproduce: no horizontal
> overflow at any width from 240 to 430 in Chrome, `#salary` active, 8 inputs
> found; and the approved declaration was applied and produced identical figures
> at every width, so it is measurably inert. The grid item is a `<div>` wrapper,
> not the input, and a percentage-width child does not propagate a floor into
> its parent's min-content contribution. The cited precedent at `:1115` is a
> flex item that *is* the control — all ten `min-width: 0` sites in the file are.
>
> Decisive under my own C30: WORK-129's condition (b) required red before green,
> and **no perturbation of the shipped application can turn that guard red**.
> An item with no acceptance condition that can fail is not approvable, and
> certainly does not gate a release. That error was mine, not the reviewer's.
>
> **UI-01's status is `High / NOT REPRODUCED`** (Chrome, corrected harness,
> 320–430 asserted plus 240/280 observed, overflow 0 at every width; fix applied,
> figures identical). **Severity is unchanged and is not mine to revise** —
> `review-conventions.md:56` reserves that to the reviewer who raised it.
> Severity describes impact if real; reproduction describes whether it is real.
> Nothing about UI-01 was careless: it labelled its own evidence as derived,
> named the instrument that would settle it, and asked for confirmation before
> action. It did everything right and I gated it anyway.
>
> **Approved in its place — WORK-129(p):** retain the width probe as a standing
> guard (`tools/harness/salary-width.js`), asserting rather than reporting,
> red-tested by perturbing the application.
>
> **Rejected:** the declaration; the defensive-insurance shape (it would install
> the first rule in `index.html` whose justification no instrument here can
> evaluate); the second-engine-condition shape (a gate nobody can close is an
> indefinite hold); and the breakpoint shape, twice over.
>
> **Deferred as a risk with a trigger:** the WebKit residual. Fix pre-ruled.
>
> **New convention: a derived claim is measured before it gates**, never as a
> condition of leaving one. Where no instrument can measure it, it cannot gate.
>
> **GATE R8 CONSISTS OF ONE ITEM: WORK-128. IT IS CLOSED. The build is
> releasable.** The record states that R8 opened with two items, one landed, and
> one was measured out — not that both landed.

---

Ruling issued on all 14 items and all four conflicts. No item is silent.

---

## Verified Against Source, Not Accepted On Report

I re-derived every claim I rule on.

- **`index.html:863`** — `.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }`. No `@media` rule for `.grid-2` anywhere; `.grid-3` breaks at 420px (`:865`), `.grid-4` at 520px (`:867`). `input, select, textarea` at `:1000-1007` sets `width: 100%` and no `min-width`. **UI-01's mechanism is exact.** One correction that helps: `.grid-2` has **only two call sites in the entire file**, `:2020` and `:2064`, both on the Salary screen. The blast radius of a `.grid-2` fix is one module, not the app.
- **`index.html:4995-5008`** — `const done = p.recLastDone || ''; while (iso <= done …)`. For an unlogged plan `done` is `''`, the loop never runs, the anchor is returned. **CODE-01 confirmed.** `:4001` includes it (`due > cutoff` false), `:4011` marks it `urgent`, `:4179` fires an OS notification once per day, `:5100-5102` renders four past dates under `📅 Next:`, `:4127` pushes one actual expense per tap and `:4132` advances the cursor by one step.
- **Blast radius verified independently.** `nextPlannedDue` has exactly three callers — `:4000`, `:4124`, `:4133` — plus `upcomingPlannedDates:5014`. `plannedOccurrences:4920` and `expandPlannedInRange` walk from `p.date` and never call it. **No past-period total moves under any shape of this fix.**
- **`run.mjs:92`** — `f.style.cssText='width:${width}px;height:820px'`. The app is far taller than 820px, so the hosted frame reserves a classic scrollbar. `run.mjs:27-28` states *"A probe that reports its own innerWidth is the only way to know what it measured"* — and `innerWidth` includes that gutter. **CODE-04 confirmed, and the header's stated self-check is the one number that cannot detect the fault.**
- **I re-derived CODE-04's corrected figures myself and they reproduce exactly.** Declared inset = 32 (`main` padding, `:835`) + 2 (card border) + 24 (`.card.cal-card` `--s3` either side, `:1672`) = 58. Recorded rows are a constant 73 below viewport. 320→262 grid→track 35.7; 360→302→41.4; 375→317→43.6; 390→332→45.7. **Correct.**
- **A consequence CODE-04 does not state, and it matters — my derivation.** The padding-zero variant's inset is 34. At 360px it yields grid 326 and track **(326−12)/7 = 44.86**, which *clears* 44. The comment at `:1631-1632` rejects that variant partly because *"It does not clear a 44px TRACK at 360px (42.7)"*. **That clause is false under correction.** See C29.
- **`index.html:3814-3826` against `:3862-3874`** — the restore branch sets `presetEl.value` in script (no `change` event) and calls `applyPreset`; the clamp lives inside the `change` listener that opens at `:3829`. `calDate` is declared at `:6458`, and `initPeriodFilter('daily', …)` is called at `:8040`, after it — so there is no temporal-dead-zone obstacle to calling the sync from the restore branch. **UI-03 confirmed and the fix is safe.**
- **`index.html:2954` / `:2955` / `:3018` / `:3019`** — four fallbacks, three copy semantics, in four adjacent lines, exactly as reported. `saveEditCat:5346` mutates in place. **CODE-02 confirmed.**
- **`index.html:2809-2817`, `:2836`, `:5694`, `:5728`** — `clearQuarantinedCopies()` is called before the new copy is written and on Reset All, and nowhere on the restore path. The comment at `:2831-2832` names two harms; the code closes one. **CODE-03 confirmed.**
- **`index.html:1067`** — `button.danger:hover { filter: brightness(1.08); }`, thirteen lines below the comment at `:1048-1053` that documents why `button.primary` got a per-theme `--primary-hover` instead. **UI-02(a) confirmed, and it is a live violation of my own round-7 C22 property, not merely a contrast finding.**
- **`index.html:1713`, `:1069`, `:1112`, `:7039-7041`** — all four confirmed on the fact. Note `:7041` sets the label to `'Set one side to MNT'` on the same element `:1069` fades; deleting `:7039` does not change that, because `:1069` still applies.
- **`index.html:1619-1620` against `:1659-1662` and `:1670-1671`** — the same comment block asserts WORK-97(b) settled and open. The block's own instruction at `:1654-1657` is *"Do not put a bare pixel figure in this comment again; state the inputs."* **UI-05 and CODE-06 confirmed.**
- **`fixture.js:16-21` and `recurrence.js:45-57`** — all four `RANGES` entries carry explicit `from`/`to`, so `aggregationEnd:4909`'s and `listingEnd:4911`'s open branches are never executed by any command. **CODE-05 confirmed.** `fixture.js:7` is F3, `'2025-10-05'`, `'monthly past'` — CODE-01's exact shape, already in the fixture, asserted by nothing.
- **`index.html:4894-4896` against `:6152`/`:6158`** — `inRange:3731` is true for every date when both bounds are `''`; the planned side clamps to today. **CODE-08 confirmed.**
- **`index.html:1000-1007` applied at `:5518`, `:5524`, `:5528`, `:5532`** — no `input[type="checkbox"]` rule exists; four inline `style="width:auto"` overrides. **UI-06's mechanism confirmed. Its rendered result is not established by anything, including the finding itself.**

---

## Executive Decision

**No.** Two reviewers working in parallel returned 80 and 82 with one High each, in different layers, and both re-derived round 7's gate work at source rather than trusting the commit record — `load()` is total, the `d` discard is on disk and load-bearing, `boot-crash.js` asserts the property, `v1` asserts every value it records. That is the healthiest verification position this project has been in. Against it sit two defects that I will not ship: the Salary Calculator — a named core module in `knowledge/project.md`, whose Inputs card *is* the module — scrolls sideways on every supported phone width, against a `ui-guidelines.md` rule stated with no qualifier and against the "mobile-friendly" principle the project claims; and a recurring plan anchored before today is reported as permanently overdue, holds an undismissable urgent badge, fires an OS notification every day forever, states four false facts about dates under "📅 Next:", and offers as its only remedy a button that writes one expense the user never incurred per tap. Correctness of financial data outranks everything else here, and an affordance that manufactures financial records is on the wrong side of that line even at High. Neither is expensive — the whole round is under three engineering days and no item exceeds S. **Gate R8 opens with two items and closes in about a day.**

---

## Release Gate Ruling

### Gates R5 and R7 stand closed. Neither is reopened.

R7's stated conditions were performed and both reviewers independently confirmed the work is on disk. Nothing this round is a failure of an R7 condition.

### Gate R8 opens with two items.

| Gate item | Why it blocks release |
|---|---|
| **WORK-129** | A named core module cannot be read or operated on any supported phone width without scrolling the page sideways. The rule it breaches has no qualifier and the release is mobile-first by definition. |
| **WORK-128** | The application states four false facts about dates, raises an alarm that cannot be dismissed, pushes a daily OS notification about a date months past, and its only offered remedy inflates the user's recorded spending. |

**WORK-130(a) — the `run.mjs` correction — is a binding precondition of WORK-129's close, not a gate item.** This follows C24's own precedent exactly: WORK-114 was a binding precondition of WORK-97(b)'s settlement without being a gate item. WORK-129's close condition is a width-mode measurement, and under C24 no width claim may be taken on an instrument known to be measuring a different viewport than the one it names. In practice WORK-130(a) lands first. I am not padding the gate to three; round 7's lesson was that a gate containing items that do not block release is the shape that hides the ones that do.

**GATE R8 CLOSES** when: `.grid-2`'s items can compress and a width-mode probe reports `document.documentElement.scrollWidth − clientWidth === 0` with `#salary` active at 320, 360, 390 and 430, on the corrected harness, **demonstrated red before green** by reverting the declaration; `nextPlannedDue` never reports a date before today for a recurring series, with two assertions in `tools/harness/recurrence.js` over the fixture's F3, **written first so they go red against the current code**; and `npm run verify`, `npm run v1`, `npm run boot` and `npm run recurrence` all exit 0.

---

## Verification Process Ruling

V1 through V6 stand. Two amendments and one new convention, all inside things that already exist. No sixth runner. No new file except none — every assertion this round lands in a probe that already exists.

**The width mode stops lying about its own viewport (WORK-130a).** The hosted frame suppresses the reserved gutter so it lays out like the overlay-scrollbar browsers the app actually runs in. That alone is not enough, because it is the class of fault that returns silently: **a width-mode probe must report the layout width it actually measured — `document.documentElement.clientWidth`, not `innerWidth` — and `run.mjs` must fail when that figure disagrees with `--width`.** This converts the header's documented self-check from a sentence into an assertion, which is this project's standing rule applied to the one instrument that has now produced findings in five consecutive rounds. Field name stated so it is not a design exercise: `viewport_clientWidth`.

**The recurrence probe gains the open horizon it claims to guard (WORK-136), and the contract WORK-128 changes gains its first assertion.** Both land in `tools/harness/recurrence.js`, both use the existing fixture, both are demonstrated red. WORK-128's two assertions are red *for free* against the current code — F3's `nextPlannedDue` is `2025-10-05`, which is before today — so the red-then-green demonstration costs nothing and must be taken in that order.

**New convention, and it is this round's lesson: an acceptance condition must be able to fail on the symptom the approval exists to remove.** If it cannot, it is a regression condition, and the item still needs an acceptance condition. See C30. This is mine to fix, not the implementer's.

**Stage 2 remains deferred; the trigger did not fire, seventh round running.** Code Review re-derived all four fixture totals (290,000 / 360,000 / 260,000 / 50,000) and the 31st clamp by hand and found every one correct, and states plainly that CODE-01 is a defect in what `nextPlannedDue` *means*, not in what `stepDate` *computes*. That is the strongest form the deferral's own terms could take, and it holds.

---

## Conflict Rulings

### C28 — Does a recently un-logged occurrence still nudge? **Ruled first, because WORK-128 is blocked on it.**

**Ruling: No. "Due" for a recurring series is forward-looking. `nextPlannedDue(p)` returns the first occurrence that is both on or after today and strictly after `recLastDone`. No lookback, no new constant.**

Four reasons, and the first is the one that decides it.

**The app records logging, not payment, and must not assert a fact it cannot know.** The absence of `recLastDone` means the user has never *logged* an occurrence of this series as actual. It is not evidence that a payment was missed. `renderExpenses:5107` labels a recurring plan `'Since ' + x.date`, which advertises backdating as the intended way to record an existing standing commitment — rent since last October — and the fixture's own F3 is that shape. Treating that as ten unpaid rents is the application inventing a financial claim out of the absence of a bookkeeping action. In an app whose stated purpose is to help users understand their spending, that is the wrong direction to be wrong in.

**Reminders is a look-ahead system and has no overdue concept to extend.** The control at `:5521` reads *"Show reminders this far ahead"*; `computeReminders` has a forward cutoff, no dismissal, no snooze, and no "overdue" state. A lookback would be the first half of an overdue subsystem that nobody has designed, and an overdue item is unusable without a way to clear it — which is precisely why today's defect is undismissable.

**Every bounded-lookback shape fails.** A fixed constant has no derivation, which is the thing this project has punished for four rounds. And the one shape that *is* derivable — an occurrence stays due until the next one in the same series falls due — does not remove the risk: for a monthly plan it reports a date up to thirty days stale, `daysUntil ≤ 1` is satisfied for all thirty of them, the badge is still permanently urgent and the OS notification still fires every day. I worked it against F3 and it does not fix F3.

**The nudge is not lost, it is bounded.** With `daysAhead` at 7 the user is shown the occurrence for the seven days before it falls, and on the day itself at `daysUntil = 0` it is urgent. That is eight days of warning. A ninth is not worth an alarm that cannot be turned off.

**Boundaries on this ruling, all binding.**

- **Confined to `nextPlannedDue`.** `plannedOccurrences`, `hasPlannedOccurrence` and `expandPlannedInRange` are untouched. I verified independently that they walk from `p.date` and never call it, so no past-period total, chart or Planned-vs-Actual figure moves.
- **The rule is uniform over both entry paths, and that is deliberate.** A plan logged once in January and then abandoned reaches the same permanently-overdue state through a different input. Applying the floor only when `recLastDone` is unset patches the case; applying it always establishes the property. C22 was ruled to close a class and the implementation closed a case, and both reviewers walked back into it one round later — I am not repeating that in the same decision that criticises it. The two conditions compose correctly: after logging today's occurrence, `recLastDone` is today and the walk still advances to the next one.
- **The `!p.recFrequency` early return at `:4996` is unchanged, and the distinction is principled.** A one-off planned expense is a discrete item the user can clear in a single tap — the convert handler at `:4136` *removes* it rather than advancing a cursor — so there is no fabrication-per-tap mechanism and no unbounded series. It is reasonable for a one-off that was never actioned to keep showing.
- **Do not move the anchor.** Endorsed from CODE-01: `plannedOccurrences:4924` walks from `p.date`, so advancing the anchor makes every past period report Planned ₮0 — the exact defect the v1→v2 migration at `:2639-2646` was written to end.
- **Walk; do not compute.** Any shape that replaces the `stepDate` walk with direct date arithmetic is rejected outright. `stepDate` carries the 31st clamp and ARCH-1's history, and duplicating it is how that comes back.
- **Honour the guard.** The walk is now longer — a daily series anchored in the 1990s approaches the 20,000-step bound. If the guard is exhausted, return `null` and `console.warn`, matching `plannedOccurrences`' existing behaviour, rather than returning a partial result that looks like an answer.

**And yes, it needs a guard, and I am saying where.** `tools/harness/recurrence.js`, riding with WORK-128, over the fixture that already contains the case. Two assertions: no date returned by `nextPlannedDue` for any fixture plan is before `todayISO()`, and `upcomingPlannedDates(F3, 4)` returns four dates none of which is before today. Both are red against the current code before a line is changed, which is the cheapest correct red-then-green demonstration available anywhere in this repository. This does **not** merge with WORK-136 — different functions, different properties, separate commits — but it does mean `recurrence.js` is opened twice in one round, and the commit boundary must be decided before editing.

### C27 — Does the C22 property carve out inactive controls?

**Ruling: it does, and I am amending the convention text so this is not asked a fourth time. `.val-zero` is Low. `button:disabled` and `.list-item .actions button:disabled` are not findings. `button.danger:hover` is squarely in scope and is the item that matters here.**

**(a) Severity.** `.val-zero` renders a `·` marking a day with no spending. Its entire semantic content is "there is no bar here", which the absence of a bar already carries. Medium under `review-conventions.md` requires "a real quality problem with a workaround — users notice but are not blocked". Users do not notice this. **Low.** It moves to P3, and it should still ride with WORK-131's contrast pass because both end at the same tool.

**(b) The property, amended.** The rule exists because `check-contrast.mjs` can only speak about a foreground and a ground expressible as two tokens, and the harm it prevents is *text the user must read that nothing can measure*. WCAG 1.4.3 exempts inactive controls because their legibility is not depended upon — the fade **is** the affordance. Forbidding `opacity` there would require a per-theme disabled token for every button variant, plus pair rows, for zero removed risk. That is premature generalisation with a real cost, and I reject it.

**The amended text:** *Text is painted from a token, on a ground expressible as a token. No `rgba()` literal fill, no `opacity` on a text-bearing element, no `filter`, no `mix-blend-mode` over text. **Inactive controls are exempt — a disabled control may fade — with one exception: a disabled control may not be the sole carrier of the text that explains why it is disabled.***

The exception is not invented; it is what CODE-07's own evidence establishes at `:7039-7041`, where `useBtn`'s label becomes the instruction `'Set one side to MNT'` on a disabled button. Note for whoever implements WORK-139: deleting `:7039` does **not** make that instruction readable, because `:1069` still applies. I am recording that as a risk, not scheduling work for it — see Risks.

**And the Engineering Manager's observation is correct and I am acting on it.** C22 was ruled to close a class; the implementation closed one case, and one round later both reviewers found survivors including a live `filter: brightness()` over text at `:1067`, thirteen lines below the comment explaining why `button.primary` was fixed the right way. **WORK-131 is approved as the completion of C22, not as a new contrast finding**, and it is approved in the token shape specifically because the token shape is the one `check-contrast.mjs` can hold forever.

### C29 — Is re-recording the width figures reopening a settled decision?

**Ruling: it is correcting the record a settled decision rests on, not reopening the decision. WORK-97(b) stays SETTLED. But the correction is larger than CODE-04 states, and one of the settlement's two stated grounds must be withdrawn.**

Correcting a measurement is not the "new argument" `HANDOFF.md:42` requires. A settlement that could be preserved by refusing to fix the instrument that produced it would be a claim, not a decision — and this project's entire method is that claims move to where a machine re-derives them.

I re-derived the corrected figures and they reproduce exactly. Then I checked the alternative, and CODE-04 understates its own finding. Corrected:

- **Current rule (`--s3` inset, 58px):** track 35.7 / 41.4 / 43.6 / 45.7 at 320 / 360 / 375 / 390. Overlap per cell, on the comment's own formula `44 − track − 2`: **6.3px at 320, 0.6px at 360, none at 375 or 390.** The recorded table claims 8.4 / 2.7 / 0.6 / none.
- **Padding-zero variant (34px inset):** at 360 the track is **(326−12)/7 = 44.86**, which clears 44. The comment at `:1631-1632` rejects the variant in part because *"It does not clear a 44px TRACK at 360px (42.7)"*. **Under correction that sentence is false at 360, 375 and 390.**

So the settlement's first ground evaporates. Its second — that zeroing the card's padding pushes `.cal-nav` and `.cal-legend` flush to the card edge at every width — is unaffected by any scrollbar, is independent, and is sufficient on its own. And the corrected numbers make the *accept* outcome substantially better supported than the record claims: the overlap is now sub-pixel at 360 and absent from 375 upward, so the entire cost is 6.3px at 320px alone, where the arithmetic forbids a fix at any padding (seven 44px cells plus six 2px gaps need 320px of grid and a 320px viewport cannot supply it).

**Therefore: the outcome stands, the reasoning is rewritten.** WORK-138 may not simply delete the contradiction; the pass must also strike the falsified 360px clause and re-state the rejection on the ground that survives. A settled decision resting on a stated reason that is known to be false is worse than an open one, because the next reader trusts it.

On the harness's self-check: `run.mjs:27-28` recommends the one number that structurally cannot detect this. That is not a comment defect, it is the same class as a probe asserting visibility instead of function — the documented check asks a question whose answer is the same whether the instrument is right or wrong. Hence the assertion condition on WORK-130(a).

### C30 — WORK-118 established a property the merged implementation does not hold.

**Ruling: WORK-118 is recorded as incomplete for the same reason WORK-95 was, and the reason is mine. The acceptance condition I named could not fail on the symptom. It was a regression condition wearing an acceptance condition's name.**

My round-7 C26 language — *"an approval that establishes a property is met when the property holds, not when the named line is edited"* — is correct and I stand by it. What I then did was name the ◀/▶ arrows as the acceptance test for both WORK-95 and WORK-118. The arrows verify that the sync does not *break* month stepping. They cannot verify that the sync *happens on every path that sets the daily range*, because they never exercise a cold start. I chose the thing that must not break and called it the thing that must be proved.

**So: an acceptance condition must be able to fail on the symptom the item was approved to remove. If it cannot, it is a regression condition and the item still needs an acceptance condition.** This is one level up from "a visibility assertion is not a function assertion" — the same mistake, made in the approval rather than in the probe.

Applied to **WORK-132**, the acceptance condition is stated as the symptom, not as a gesture: *with a saved non-current-month preset in `filter-state-v1`, a cold start of Analytics paints the month the Peak day tile names.* And because this is the third time on the same property, the completion condition is stated as an enumeration rather than a diff: **`calDate` has exactly three writers — the initialiser at `:6458`, the two arrows at `:6630`/`:6634`, and the sync — and every path that sets the daily range must reach the sync.** That is re-derivable by grep, which is this project's standard for a completeness claim. The arrows stay as the regression condition, correctly labelled.

I am not adding a probe for it. Making the harness read `localStorage` before boot and re-render Analytics is a real piece of work for a Medium, and the enumeration above is checkable by search in ten seconds. If this property fails a third time, that judgement was wrong and the probe is the answer.

---

## What I Am Changing From Round 7

Everything not listed here carries forward unchanged, including every rejection, every deferral, and every convention in `HANDOFF.md`'s "Conventions in force".

1. **Gate R8 opens** with WORK-129 and WORK-128. Gates R5 and R7 stay closed. (C28, and the release gate ruling)
2. **The C22 property gains a stated carve-out**: inactive controls may fade, except where the disabled control is the sole carrier of the text explaining why it is disabled. (C27)
3. **New convention: an acceptance condition must be able to fail on the symptom.** Otherwise it is a regression condition. (C30)
4. **New convention: a measurement is a claim about the instrument as much as about the app.** A width-mode probe reports the layout width it measured, and `run.mjs` fails when that disagrees with `--width`. (C29)
5. **New product rule: "due" is forward-looking for a recurring series.** The app records logging, not payment, and may not assert a missed payment from the absence of a logging action. (C28)
6. **WORK-118's approval is recorded as incomplete**, completed by WORK-132 — and the cause recorded as my acceptance condition, not the implementation.
7. **WORK-97(b) stays SETTLED, with its recorded reasoning corrected**: the "does not clear a 44px track at 360px" ground is withdrawn as false under correction; the flush-edge ground carries it alone. (C29)

---

## Approved Improvements

13 of 14 items approved, one deferred, several narrowed. Gate items marked **[R8]**.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-129** | `.grid-2` has no `min-width: 0`, so the Salary Calculator scrolls sideways **[R8]** | Verified at `:863`, `:1000-1007`, `:2020-2055`. A named core module in `knowledge/project.md` breaches a `ui-guidelines.md` rule stated with no qualifier, on every supported phone width, in the default state, with half the fields the module exists to collect in the unreachable column. The file documents the mechanism for its own KPI tiles at `:874-880` and applies the identical release at `:1115`. **Approved as `.grid-2 > * { min-width: 0; }` with the derivation stated as inputs and an operator.** The fix is contained: `.grid-2` has exactly two call sites, both on the Salary screen. **Conditions: (a) a width-mode probe calls `navigate('salary')` first and reports `scrollWidth − clientWidth` at 320/360/390/430, on the corrected harness; (b) demonstrated red before green by reverting the declaration; (c) no measured figure is written into the comment that the probe did not produce.** |
| **WORK-128** | A recurring plan anchored before today is permanently overdue; the only remedy fabricates an expense per tap **[R8]** | Verified at `:4997-5005`, `:4001-4011`, `:4179`, `:5100-5102`, `:4127-4132`, and the blast radius re-derived independently. Two of seven core modules misreport, an alarm exists that cannot be dismissed, an OS notification fires daily about a date months past, and the affordance the app puts in front of the user inflates recorded actual spending. **Approved in the shape ruled at C28: the first occurrence on or after today that is strictly after `recLastDone`, applied uniformly, confined to `nextPlannedDue`, the `!recFrequency` early return untouched, the walk kept, the guard honoured with `null` and a warn on exhaustion.** **Conditions: two assertions in `tools/harness/recurrence.js` over fixture F3, written before the fix so they are red first; `npm run recurrence` exits 0 after; no change to any aggregation function.** |
| **WORK-130(a)** | The width-mode harness reserves a 15px desktop scrollbar — *the instrument* | Verified at `run.mjs:92` and `:27-28`, and the 15px re-derived from the recorded table against a declared 58px inset. Every width measurement this project will ever take comes from here, on a mobile-first app whose supported band is 320–390px, where 15px is 5% of the viewport. **Binding precondition of WORK-129's close, under C24's own precedent.** **Conditions: suppress the reserved gutter in the hosted frame; the header records that `innerWidth` includes a gutter and `clientWidth` does not; and — the part that stops this recurring — a width-mode probe must report `viewport_clientWidth` and `run.mjs` must fail when it disagrees with `--width`, demonstrated red by asking for a width the frame does not honour.** |
| **WORK-130(b)** | Re-record the four rows at `index.html:1609-1613` and `:1625-1629` | The figures are wrong by a constant 15px and the source of record says so implicitly at `:1654-1657` — *"Do not put a bare pixel figure in this comment again; state the inputs."* **Split from WORK-130(a) deliberately: the instrument blocks the gate, the record does not.** **Conditions: taken on the corrected harness; the falsified "does not clear a 44px TRACK at 360px" clause is struck and the rejection re-stated on the flush-edge ground alone (C29); rides in one pass with WORK-138.** |
| **WORK-132** | The Analytics calendar anchor syncs on preset change but not on restore | Verified at `:3814-3826` against `:3862-3874`; setting `.value` in script fires no `change`, and `calDate` at `:6458` unconditionally lands on the current month. The property WORK-95 and WORK-118 were both approved to establish is still false on the app's most common entry path, for the same six of nine presets, with the identical symptom. **Approved in the reviewer's shape: extract to a named local inside `initPeriodFilter`, call from both the change handler and the restore branch, guarded on `prefix === 'daily'`, not called from `applyPreset`.** **Conditions: the acceptance condition is the cold-start symptom, not the arrows (C30); the comment at `:3840-3842` names both call sites; completeness closes by enumerating `calDate`'s writers.** |
| **WORK-131** | `button.danger:hover` composites the destructive-confirm label with `filter` | Verified at `:1067`, thirteen lines below the comment at `:1048-1053` documenting why `button.primary` was given a per-theme `--primary-hover` for exactly this reason. This is the OK button of every confirmation dialog in the app (`:4317`), so the label on the control that destroys data is the one that becomes hardest to read at the moment the user decides. **Approved as C22's completion, in the token shape: per-theme `--danger-hover` derived as `--primary-hover` was, plus one pair-table row `{ fg: 'on-danger', bg: 'danger-hover', min: 4.5 }`.** The row is the point — it makes the state machine-checked forever. **Condition: `check-contrast.mjs` runs after and its summary line is the honest one.** |
| **WORK-133** | "Save & Add as Income" writes the record without moving the Income filter | Verified at `:4674-4677` against `:4696-4699` and `:5063-5069`. Both sibling add paths call `revealEntryDate`; this one does not. The comment at `:3893-3900` states the mechanism's own reason: *"the add looks like it failed. Adding it again is the rational response, which is how duplicate planned expenses were created."* A duplicate salary save writes to both `db.salaries` and `db.income` and doubles the income figure on the hero KPI, the donut and the Monthly Trend. **Three lines at a site whose two siblings already carry the pattern.** |
| **WORK-134** | `load()` hands the module-level default arrays into `db` by reference | Verified at `:2954`, `:2955`, `:3018`, `:3019` — four fallbacks, three copy semantics, four adjacent lines — against `saveEditCat:5346`'s in-place mutation. "Reset All Data", whose confirm text promises to delete categories, returns the user's renamed ones as the defaults and then persists them. It self-heals on reload, which is why it has stayed invisible. **One helper at all four sites, `:2955`'s `id: uid()` preserved where it is deliberate, with a comment saying what the copy stops.** |
| **WORK-135** | A quarantined copy of the whole database outlives a successful recovery | Verified at `:2809-2817`, `:2836`, `:5694`, `:5728`. A full duplicate of the user's financial history stays in a ~5 MB origin permanently, unreachable — `corruptRawKey` is reset by `load()` at `:2928`, so `downloadCorruptData:2873` returns early and nothing will ever read it again. An unreachable copy is not a recovery option; it is quota consumption in the one situation where quota headroom is what makes the next recovery possible. **Approved as the call after a confirmed restore, guarded on a clean parse (`!dataWasCorrupt`), following the precedent eight lines away at `:5728`.** **Condition, and it inverts the reviewer's alternative: do not narrow the comment at `:2831-2832`. It names two harms; close the second so the comment becomes true.** |
| **WORK-136** | `npm run recurrence` never executes the open-ended horizon its header says it guards | Verified at `fixture.js:16-21` against `:4909` and `:4911-4916`: all four ranges carry explicit bounds, so neither open branch is ever reached by any command. That branch governs the default All-Time view on the Dashboard, Expenses, the chips and both Daily renders, and a regression there restores the "totals are a function of the guard constant" defect that `:4875-4886` exists to prevent — with every command green. Under round 7's standing ruling, a probe may not be described as guarding a behaviour it does not exercise. **Approved as two flows in the existing probe: the open-ended expansion yields nothing after today and a bounded count for F3; and a plan anchored after today satisfies `hasPlannedOccurrence` while contributing zero occurrences — the listing/aggregation split, which is the property the two horizons exist to keep apart.** **Conditions: each demonstrated red by perturbing `:4909`/`:4911`, not by editing the expectation; no new file, no new runner. The third flow over `computeNextRecurring` is optional and does not gate the item.** |
| **WORK-137** | `.val-zero` paints text through `opacity` | Verified at `:1713`. A live member of the class C22 closed as a property, and the reason it is worth the two minutes is that leaving it teaches the rule is per-selector. **Severity ruled Low (C27), so P3 — but scheduled with WORK-131 because both end at the same tool.** **Approved as: delete the `opacity`, state the state in a token, add the pair row if the token used is not already covered.** |
| **WORK-138** | The `.cal-grid` comment says WORK-97(b) is settled and, forty lines later, that it is open | Verified at `:1619-1620` against `:1659-1662` and `:1670-1671`, and against `HANDOFF.md:42`. Two independent reviewers opened the same block and reached the same deletion. The last thing the block says is that a measured, twice-closed question is open, which is an invitation to spend a probe run and an architect ruling on it again. **Approved as deletion, not rewrite — the settlement at `:1619-1637` and the `#dpGrid` derivation at `:1647-1652` already carry everything both paragraphs held.** **Conditions: lands after WORK-130(b) and in the same pass; the falsified 360px clause goes with it (C29).** |
| **WORK-139** | The converter's inline `opacity`/`cursor` writes duplicate `button:disabled` | Verified at `:7039-7040` against `:1069`. A direct deviation from `coding-standards.md` "Avoid duplicated styles", two lines, on an element whose rule already sets both. **Approved narrowly as the deletion of the two duplicated writes.** The readability of `'Set one side to MNT'` is *not* fixed by this and is not in scope — `:1069` still applies. Recorded as a risk below, not as work. |
| **WORK-140** | `aggregationEnd`'s comment claims Planned and Actual cover the same window | Verified at `:4894-4896` against `:6152`/`:6158` and `inRange:3731-3736`. The comment states an invariant that is false on the default unbounded view for a future-dated actual. **Approved as the comment narrowing only.** This matters slightly more after WORK-128, because a plan due in the next few days can now be converted into a future-dated actual — a pre-existing property of the convert button that WORK-128 neither creates nor worsens, and precisely the input this comment misdescribes. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-129 (breakpoint shape)** | `@media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr } }` | Larger than the fix that removes the risk, and it leaves the 481–560px band unhandled while `min-width: 0` covers every width unconditionally. The precedent already in the file at `:1115` is the release, not a breakpoint. |
| **WORK-128 (bounded-lookback shape)** | Keep a lookback window so a recently missed occurrence still nudges | A fixed constant has no derivation. The one derivable shape — an occurrence stays due until the next one falls — I worked against fixture F3 and it leaves a monthly plan permanently urgent with a daily OS notification, so it does not remove the risk it was proposed for. See C28. |
| **WORK-128 (move-the-anchor shape)** | Advance `p.date` past today | `plannedOccurrences:4924` walks from the anchor, so every past period would report Planned ₮0 — the exact defect the v1→v2 migration at `:2639-2646` was written to end. |
| **WORK-128 (direct-arithmetic shape)** | Compute the next occurrence without walking `stepDate` | Duplicates the 31st clamp and ARCH-1's entire history in a second place. The walk stays. |
| **WORK-131 (deletion shape)** | Delete `button.danger:hover` and give destructive buttons no hover state | Removes the risk and a real affordance with it: hover feedback confirming which control the pointer is on matters most on the button that destroys data. Every other variant has one. |
| **WORK-131 (`color-mix` shape)** | `button.danger:hover { background: color-mix(…) }` | `check-contrast.mjs` cannot follow `color-mix()`, and following it is on the off-limits list for this quarter. An unmeasurable hover fill over text is the class C22 forbids — it would trade one violation for another. |
| **WORK-135 (comment-narrowing shape)** | Shrink the comment at `:2831-2832` to what the code does | Backwards. The comment states a real harm as motivation; close the harm rather than editing the motivation down to fit. Narrowing a true statement to match incomplete code is how a codebase stops telling the truth about itself. |
| **WORK-137 / C27 (no-exemption shape)** | Extend the no-`opacity`-over-text property to `button:disabled` and `.list-item .actions button:disabled` | WCAG 1.4.3 exempts inactive controls and the fade *is* the affordance. Enforcing it would require per-theme disabled tokens and pair rows for every button variant, for zero removed risk. See C27. |
| **WORK-140 (code-change shape)** | Clamp the aggregation-side `to` for actuals as well | Would silently hide a mistyped year — a future-dated actual would vanish from the total rather than looking wrong. The comment change is smaller and safer, and Code Review says so itself. |
| **WORK-138 (rewrite shape)** | Rewrite the contradictory paragraphs rather than delete them | Both surviving passages already say everything the deleted ones carried. Rewriting duplicates a derivation, and a duplicated derivation is how the two halves drifted apart in the first place. |
| **WORK-89 (sweep half)** — carried | Snap 72 font sizes, 9 radii, ~69 spacings onto the scales | Declined four times. UI Review again correctly declined to re-raise the residual literals. Unchanged. |
| **WORK-88 / WORK-58** — carried | Default an unset theme to dark when the OS prefers dark | Rejected in rounds 4, 5, 6 and 7. Returns only on an observed user harm. Not re-raised. |
| **WORK-87, WORK-76 (extraction half), WORK-100 (`z-index`), WORK-102 (`input`-event half), WORK-106 (deny-list half), WORK-111 (move-the-listener), WORK-112 (recorder), WORK-125 (move shape), WORK-126 (fourth breakpoint)** — carried | Shapes rejected inside earlier approvals | All carry forward as rejected so they cannot be re-proposed, exactly as `HANDOFF.md:51-64` records them. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-141** | The four reminder checkboxes are sized by the rule authored for text fields | **Deferred, and this is the one item I am not approving.** The mechanism is verified — no `input[type="checkbox"]` rule exists and four inline `style="width:auto"` attributes carry the knowledge — but the finding states plainly that the rendered result was not assessed and claims none. The recommended fix is a nine-declaration rule including a size and an `accent-color`, which is a visual design decision proposed without anyone having looked at what is on screen. Approving an appearance change nobody has seen is the "true-sounding claim beside code that does not support it" failure this project has spent four rounds on. **What settles it: one screenshot of Settings → Notifications at 390px, taken with the iframe technique `HANDOFF.md:136-139` documents, during any other harness run.** If the controls render as bordered boxes with 24px of padding, it is an immediate XS approval in the carve-out shape with the four inline attributes deleted in the same commit. If the engine ignores padding and border on the native control, the only residue is four inline styles and the item closes as a comment. |
| **WORK-97(b)** — closed, now with a corrected record | Calendar cell geometry | **No longer deferred and not reopened** — see C29. The outcome stands and is better supported under correction. WORK-130(b) and WORK-138 correct the record it rests on. Do not reopen without a new argument, and a corrected measurement is not one. |
| **WORK-85 + WORK-35** — carried | Keyboard reorder path; extract the shared reorder implementation | Trigger unchanged: a behavioural change to either reorder path (extraction first), or a real keyboard or switch user blocked. Code Review recorded the second copy is still there and did not re-raise. Not fired. |
| **WORK-16 / WORK-49** — carried | Index the Daily chart and calendar; bucket Monthly Trend | Trigger unchanged: a measured render above 100ms on a mid-range device, or a real store above 5,000 actual records. Code Review restated the costs and **explicitly took no measurement, third round running.** I note that approvingly. |
| **WORK-15** — carried | Cloud load through `importProblem` → `writeDb` → `load()` | Precondition holds: no build ships with Firebase configured until cloud data goes through the same validation and migration as local data and a sync failure is visible. |
| **WORK-17 (IndexedDB half), WORK-23 (screen half), WORK-30, WORK-31** — carried | Standing round-3 deferrals | Unchanged. No report this round presented evidence against any of them. |
| **Stage 2** — carried | Pure-logic module and test runner | Not promoted, **seventh round running, and on the strongest evidence yet.** Trigger unchanged: a rounding or arithmetic defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. Code Review re-derived all four fixture totals and the 31st clamp by hand and found every one correct, and states outright that CODE-01 is a defect in what `nextPlannedDue` *means*, not in what `stepDate` computes. The deferral holds on its own stated terms. |

---

## Development Order

Nothing outside R8 begins before R8 closes.

**Step 0 — WORK-130(a).** The instrument, before the claim it will verify. Suppress the reserved gutter in the hosted frame; record in the header that `innerWidth` includes a gutter and `clientWidth` does not; require `viewport_clientWidth` from width-mode probes and fail `run.mjs` when it disagrees with `--width`. Demonstrated red by asking for a width the frame does not honour. **This is a precondition of the gate, not a gate item — WORK-129 cannot record a width figure taken on an instrument known to be wrong (C24).**

**Step 1 — WORK-129. [R8]** One declaration with the derivation stated as inputs and an operator. Probe calls `navigate('salary')` first, reports `scrollWidth − clientWidth` at 320/360/390/430, red before green by reverting the declaration.

**Step 2 — WORK-128. [R8]** Write the two `recurrence.js` assertions **first**; they are red against the current code for free, because F3's `nextPlannedDue` is `2025-10-05`. Then the fix in `nextPlannedDue` alone, in the shape ruled at C28. Then green. This is the correct application of "land tooling before the fix it will verify" and it costs nothing.

**GATE R8 CLOSES.** `npm run verify`, `npm run v1`, `npm run boot` and `npm run recurrence` all exit 0. **Then the build is releasable.**

**Step 3 — WORK-132.** First after the gate, because this is the second consecutive round in which the same property is still false and a third would make it permanent. Acceptance condition is the cold-start symptom; the arrows are the regression condition; completeness closes by enumerating `calDate`'s writers.

**Step 4 — WORK-133, then WORK-134, then WORK-135.** Three separate commits, three unrelated defects, all XS. Ordered by how directly they touch money: the duplicate-income route first, the defaults-mutation second, the quota leak third.

**Step 5 — WORK-131, then WORK-137.** One pass, two commits, one `check-contrast.mjs` run at the end. WORK-131 first because it adds the pair row; WORK-137 rides behind it even though it is P3, because opening the same tool twice for an XS change is waste.

**Step 6 — WORK-136.** The round's last S. It goes here because `recurrence.js` will already contain WORK-128's assertions and the two open-horizon flows should be written against the file's final state — and because the commit boundary in that file must be decided before editing, which `HANDOFF.md:178-180` says this project has paid for twice.

**Step 7 — WORK-130(b), then WORK-138.** One pass over `index.html:1596-1671`, two commits. Re-record the four rows from the corrected harness, strike the falsified 360px clause and re-state the rejection on the flush-edge ground; then delete the two contradictory paragraphs. **In that order** — deleting first would leave a settlement resting on figures already known to be wrong.

**Step 8 — WORK-139, then WORK-140.** Two separate XS commits, unrelated. Delete the duplicated inline writes; narrow the false invariant.

**Not scheduled — WORK-141.** Deferred pending one screenshot.

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework, no runtime build step, no bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`, and `load()` stays total. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations. `stepDate` as the single recurrence engine, walked and not replaced by arithmetic. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever. Offline-first. Mobile-first. Correctness and preservation of financial data above everything.

**What changes.**

1. **"Due" is a forward-looking claim.** The application records when occurrences fall and when the user logged one. It does not record what the user paid. It may therefore never assert a missed payment from the absence of a logging action. This is the rule that stops the app manufacturing financial facts, and it is the one to hold onto when Notifications arrives on the roadmap.
2. **An acceptance condition must be able to fail on the symptom the item was approved to remove.** Otherwise it is a regression condition and the item still needs an acceptance condition. This is the round-7 lesson one level up: last round the *probe* asked the wrong question, this round the *approval* did.
3. **A measurement is a claim about the instrument as much as about the app.** Width-mode results carry the layout width actually measured, and the runner fails when it disagrees with what was asked for. Five consecutive rounds have produced an instrument finding; this is the first one that makes the next instance impossible to hide.
4. **Text is painted from a token, on a ground expressible as a token** — no `rgba()` fill, no `opacity` on a text-bearing element, no `filter`, no `mix-blend-mode` over text — **with inactive controls exempt, except where the disabled control is the sole carrier of the text explaining why it is disabled.** This is the amended C22 and it is now stated in a form that answers the question it was asked twice.
5. **The ceiling is four plus one, and it is a ceiling on runners.** Four static predicates behind `verify`, one render harness with one runner. Probes and fixtures are its inputs. There is no sixth runner, and this round adds no file at all.
6. **A visibility assertion is not a function assertion.** Unchanged.
7. **Comments state derivations, never bare results** — and a derivation is only as good as the measured input it takes. `.cal-grid`'s table stated its formula correctly and was wrong anyway, because the number fed into it came from a broken instrument. Name the instrument as well as the container.
8. **A claim of completeness closes by re-derivation.** Unchanged, and it worked again: both reviewers re-derived round 7's gate work rather than trusting the record.
9. **Ruling C5 in its extended form, and the no-new-top-level-statement constraint**, unchanged.

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports. Enabling Firebase. Deleting or repairing quarantined Cloud Sync code. Splitting `index.html`. Any large mechanical sweep across the file. Any `render*` calling `save()`. A seventeenth theme before `check-contrast.mjs` covers it. A sixth runner. CSS parsing, cascade resolution or `color-mix()` following inside `check-contrast.mjs`. **And new this quarter: no overdue, snooze or dismissal subsystem for reminders.** C28's ruling makes one tempting; building it is a product decision nobody has made, and the correct fix is that nothing is reported overdue in the first place.

**Risks I am recording, not scheduling.**

- **New, mine, from C28's shape.** `nextPlannedDue`'s walk gets longer under the ruling — a daily series anchored decades back approaches the 20,000-step guard, and `upcomingPlannedDates` calls it per plan per render. The guard condition on WORK-128 makes exhaustion honest rather than silent, which is what matters. If a real store ever hits it, the answer is a cheap fast-forward before the walk, not a rewrite.
- **New, from CODE-07's evidence, deliberately not scheduled.** `#converterUse` renders the instruction `'Set one side to MNT'` on a disabled button, so the only text explaining why the primary action is unavailable is faded by `:1069`. WORK-139 does not fix this and was not approved to. The right shape is a helper line beside the button with a stable button label, and it costs more than the harm justifies today. Trigger: any user report of confusion on the converter, or any further change to that control.
- **New, from CODE-01's own Future Risks.** `computeReminders` has no dismissal concept at all. WORK-128 removes the case where that is intolerable; it does not add the feature. Notifications is a Long-term Vision item and this is the first thing it will need.
- **Carried unchanged.** `analyzeExpenses:5740-6070` is 330 lines of 26 inline rules with no seam, and it is where the AI Budget Assistant will want to live. Every consumer re-derives its own filter/expand pipeline from `db`, which is exactly why CODE-05's invariant could hold in five places and be unverifiable in the sixth — and exactly what Reports will inherit as a seventh. Filter state lives in DOM inputs rather than a model, which is why the harness is the only place a range-dependent claim can be checked. The ~2,650 top-level statements between `let db = load()` and the `#importFile` listener. The module-boundary problem remains the leading candidate for the quarter after this one, and remains cheaper to live with than to rewrite a render layer with no harness underneath it.

**And the thing that matters more than any item here.** Round 6's lesson was *prove the machine can say no*. Round 7's was *the machine was asking the wrong question*. Round 8's is one level up again, and it is mine twice over: **the approval can ask the wrong question too.** I named an acceptance test for WORK-118 that could not fail on the symptom, and the item merged with the property still false — the same mistake as a visibility assertion, made by me rather than by a probe. And `run.mjs`'s header recommends `innerWidth` as its self-check, which is the one number that cannot reveal the fault it was written to prevent. A guard is not a guard because it exists; an acceptance condition is not one because it is written down. Both are only as good as whether they can come back red on the thing you are actually afraid of.

---

## Executive Report

The application is a day from releasable and I am holding it, for the fourth round running. Two reviewers working in parallel returned 80 and 82, no Critical, and one High each in different layers — and where they converged, on the contradictory `.cal-grid` comment and on surviving `opacity` over text, they converged without conferring. Round 7's gate work is genuinely on disk and both reviewers re-derived it at source rather than trusting the commit record, so the completion-record failure that dominated rounds 5 and 6 has now not recurred twice.

What holds the build is two things. `index.html:863`: `.grid-2` is `1fr 1fr` with no breakpoint and no `min-width: 0`, and it contains eight text inputs on the Salary Calculator — a named core module whose Inputs card *is* the module. `1fr` is `minmax(auto, 1fr)`, so the track floor is the input's intrinsic width, and every supported phone width scrolls sideways. The file documents this mechanism for its own KPI tiles forty lines further down and applies the identical release at `:1115`; it was applied to one container and not the other. And `index.html:4997`: for a recurring plan with no logging cursor, `done` is `''`, the walk never runs, and the anchor is returned however old — so the fixture's own F3, anchored 302 days back, holds a permanently urgent badge, fires an OS notification once a day forever, prints four past dates under "📅 Next:", and offers a button that writes one expense the user never incurred per tap. I verified the blast radius myself: three callers, and no aggregation function touches it, so no past-period total moves under any shape of the fix.

I ruled C28 first because WORK-128 was blocked on it, and the answer is that **"due" is forward-looking**. The absence of `recLastDone` means the user has never logged this series, not that they never paid it — `renderExpenses:5107` labels a recurring plan "Since <date>", which advertises backdating as the model. The app records bookkeeping actions and must not manufacture a financial claim from their absence. I worked the one derivable lookback shape against F3 and it still leaves a monthly plan permanently urgent, so it does not remove the risk it was proposed for; and a constant would be undecided. I also applied the rule uniformly rather than only to the never-logged branch, because a plan logged once in January and abandoned reaches the same state through a different door — and C22 was ruled to close a class one round ago while the implementation closed a case, which is the very thing C27 asks me about.

**On C29 I found more than the report did.** Corrected for the 15px gutter, the padding-zero variant of `.cal-grid` yields a 44.86px track at 360px — so the clause at `index.html:1631-1632` rejecting it because *"it does not clear a 44px TRACK at 360px (42.7)"* is **false**. WORK-97(b)'s outcome survives, because the flush-edge objection is independent and sufficient and because the corrected overlap is 0.6px at 360 and absent from 375 upward — better supported than the record claims, not worse. But a settled decision resting on a stated reason known to be false is worse than an open one, so the correction is larger than re-typing four numbers: the reasoning is rewritten too. Re-recording is correcting the record a decision rests on, not reopening the decision.

**On C30 the fault is mine and I am recording it as one.** I named the ◀/▶ arrows as WORK-118's acceptance test, twice. The arrows verify that the sync does not break month stepping; they cannot exercise a cold start, which is the symptom. I chose the thing that must not break and called it the thing that must be proved. **An acceptance condition must be able to fail on the symptom the item was approved to remove** — otherwise it is a regression condition, and the item still needs an acceptance condition.

Of 14 items I approved 13, split one into instrument and record so the gate stays at two, deferred one, and rejected eleven shapes within or alongside the approvals. Every standing rejection and deferral carries forward, Stage 2 included, on the strongest evidence its trigger has ever had. Roughly 2.9 engineering days, no item above S, no rewrite, no new dependency, no new file, no sixth runner, no change to the single-file constraint.

---

## Implementation Priority

1. **WORK-130(a)** — the instrument: suppress the frame's reserved gutter, header records `innerWidth` vs `clientWidth`, and `run.mjs` fails when a width-mode probe's `viewport_clientWidth` disagrees with `--width`. Precondition of the gate.
2. **WORK-129 [R8]** — `.grid-2 > * { min-width: 0 }` with the derivation; measured on the corrected harness at 320/360/390/430, red before green.
3. **WORK-128 [R8]** — two `recurrence.js` assertions first (red for free against F3), then `nextPlannedDue` returns the first occurrence on or after today that is after `recLastDone`, green.
4. **GATE R8 CLOSES** — all four commands exit 0. **Then the build is releasable.**
5. **WORK-132** — extract the anchor sync, call it from restore as well; acceptance condition is the cold start, not the arrows.
6. **WORK-133, then WORK-134, then WORK-135** — three separate XS commits.
7. **WORK-131, then WORK-137** — one contrast pass, two commits, `check-contrast.mjs` last.
8. **WORK-136** — the two open-horizon flows, each demonstrated red by perturbing `:4909`/`:4911`.
9. **WORK-130(b), then WORK-138** — re-record the four rows and strike the falsified 360px clause; then delete the contradictory paragraphs. That order.
10. **WORK-139, then WORK-140** — two XS commits, unrelated.
11. **WORK-141 — deferred**, pending one screenshot of Settings → Notifications at 390px.

---

## Recommended Next Action

**Fix the instrument, then close the gate — nothing else touches the repository first.** In `D:\3_Claude\PowerApps\tools\harness\run.mjs`, add a rule to the width-mode host that removes the reserved scrollbar from the frame at line 92, correct the header at lines 25-28 to say that `innerWidth` includes that gutter while `document.documentElement.clientWidth` does not, and make the runner require `viewport_clientWidth` from a width-mode probe and fail when it differs from `--width` — because the fault this closes is that the one self-check the file recommends is the one number that could never have revealed it. Then `D:\3_Claude\PowerApps\expense-pwa\index.html:863`: add `.grid-2 > * { min-width: 0; }` with the derivation stated as inputs and an operator, confirm `scrollWidth − clientWidth` is 0 at 320, 360, 390 and 430 with `#salary` active, and prove it by reverting the declaration and watching it go red. Then, and in this order, write the two assertions in `D:\3_Claude\PowerApps\tools\harness\recurrence.js` — that no date `nextPlannedDue` returns for a fixture plan is before today, and that `upcomingPlannedDates(F3, 4)` returns four dates none of which is past — run `npm run recurrence`, and watch it fail on the code as it stands, because fixture F3 has been sitting in this repository since Stage 0 describing exactly the defect nobody was asking about. Only then change `nextPlannedDue` so a recurring series' next due date is the first occurrence on or after today that is after `recLastDone`, and nothing else — not the anchor, not the aggregation walk, not the one-off path. Do not batch the seven Mediums into this pass, however cheap they look; the whole round is under three days and the two items in the gate are the only two that block a release. The lesson to carry out of this round is not either defect. It is that I approved WORK-118 against an acceptance test that could not fail on the symptom it was approved to remove, and it merged with the property still false — the same mistake the probe made last round, made one level up, by me.

*(Round 8. Full reports: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\engineering-manager.md`. This decision replaces `D:\3_Claude\PowerApps\reports\chief-architect.md` as the standing decision.)*
