# Chief Architect Ruling — Design Request: the calculator that says nothing

**The ruling, first.** **Yes, one item, one commit — the sentence ships, in the element that already exists, in the state that currently renders nothing.** The wording is ruled and it is not the request's draft. The firing condition is ruled and it is **derived rather than chosen**: the sentence promises that adding a date will fill the total, so it may render only in the state where that promise is guaranteed — which is what the amount-borrowed gate is for. §5(a) is ruled admissible, with a fence stated in five conditions, the fifth of which is checkable at source and is what stops it eroding `openDebtEditModal`. §5(b)'s three-occupant rule is written down and the request's framing of it is corrected: these are **two elements and three states**, not one slot and three occupants. §5(d) is **refused by name**, permanently. §5(e) is ruled: the label does not move. **No standing deferral is fired by this observation, and I am recording that explicitly, because "an owner observation exists" is about to be quoted at five deferrals whose triggers it does not describe.**

*(Supplemental. The effective-rate ruling at `D:\3_Claude\PowerApps\reports\chief-architect-effective-rate.md`, the payoff-date ruling at `reports\chief-architect-payoff-date.md`, the repayment-schedule ruling at `reports\chief-architect-repayment-schedule.md`, the payoff-plan ruling at `reports\chief-architect-payoff-plan.md`, the saving ruling at `reports\chief-architect-the-saving.md`, the settle-a-debt ruling at `reports\chief-architect-settle-a-debt.md`, the early-settlement ruling at `reports\chief-architect-early-settlement.md`, the fee-calculator ruling at `reports\chief-architect-fee-calculator.md`, the paste-a-loan ruling at `reports\chief-architect-paste-a-loan.md`, the Round 16 ruling at `reports\chief-architect.md`, and the standing record at `reports\archive-chief-architect-round14.md` and `reports\archive-chief-architect-round15.md` — **remain in force in full.** This ruling adds to that record and replaces none of it. **No off-limits entry is narrowed by one millimetre.** The fee narrowing, the `EFK1` rate-model narrowing, the `SET-01` storage narrowing and the `SCK2` composite-field narrowing are each reaffirmed at exactly the width they were granted; **the fee narrowing is invoked as the ruling that built this screen and is not widened.** `.debt-totals` stays closed at three sentences, the card's rate copy at one sentence in every reachable state, the settle sheet's helper at one, the schedule group's helper at one, `mSchedPayoff` at one — all permanently. `PR1`–`PR13`, `DR1`–`DR12`, `SR1`–`SR18`, `ER1`–`ER12`, `FR1`–`FR12`, `SCR1`–`SCR16`, `PDR1`–`PDR13`, `EFR1`–`EFR18` and `R1`–`R12` are carried entire.)*

*(Instrument. A design request, the eleventh. **There is no UI Review report, no Code Review report and no Engineering Manager report, and none is owed — this is not a review round, and the task that commissioned this ruling says so.** There are therefore no `UI-`, `CODE-` or `WORK-` items, **no recorded conflict list, and no Critical finding to approve or overrule.** I am recording that obligation discharged here rather than leaving it silent. Nothing below is a finding; where I raise something no reviewer raised, it is a risk, a collision, or a condition on the item I am approving — never a finding. **This request is different from the ten before it and the difference is on the record at §8: its trigger is an owner using the shipped application, not anyone reading it.** Every claim in its §1 was re-derived at source per `C43` rather than accepted, and three of them needed correcting — see `RDK4`.)*

**ID namespace.** Item `RD-01`; rejections `RDR1`–`RDR14`; deferral `RDD1`; collisions `RDK1`–`RDK7`; unasked questions `RDN1`–`RDN7`. None is to be renumbered into or absorbed by a `WORK-`, `SCH-`, `PD`, `PAY-`, `SET-`, `SAV-`, `FEE-`, `EFF-`, `ES-` or `PASTE-` item. `RDR` is deliberately distinct from `DR` (debt tracker) and `FR` (fee calculator).

**Ruling issued on §4, on all five items in §5, on §2, on §7, on §8, on seven collisions and on seven things the request did not ask. No item is silent.**

---

## Verified Against Source, Not Accepted On Report

Read at source in `D:\3_Claude\PowerApps\expense-pwa\index.html`: the `#debtAddFields` form in full, `debtAdd`'s click handler, `feeAddMonths`, `feeTermMonths`, `feeComputeTotal`, `feeParseRate`, `feeReportWorking`, `feeRecalcTotal`, `initDebtRate`, `debtPayoffDate`, `debtReportPayoffDate`, and the `rateLine` construction with its hoisted comment in `renderDebts`. Also `D:\3_Claude\PowerApps\tools\harness\debts.js` (the three fee flows), `D:\3_Claude\PowerApps\reports\HANDOFF.md`, and all five files in `D:\3_Claude\PowerApps\knowledge\`.

- **The total is required and the refusal is exactly as quoted.** `debtAdd` refuses `totalToRepay <= 0` with *"Enter the total you will pay back"*; `#debtTotal` carries the asterisk and `aria-required="true"`. True in every part.
- **`#debtRateWorking` is the element immediately below `#debtTotal`**, `class="helper"`, `role="status"`, `aria-live="polite"`, `style="display:none"`. **Nothing sits between the output and the line.** This is the fact that makes the request's "no new element" claim true, and it is why the answer is one state and not one element.
- **The rate field's helper promises the fill in three words** — *"Fills in the total below. You can always type the total yourself instead."* — and **the due-date helper never mentions the total.** Its four sentences say what the field is for (*"When it has to be repaid, and what lets this app show you what the borrowing costs you each year"*), that it drives a reminder, that it may be left empty, and that it creates no planned expense. **The form makes a promise at field three and nowhere tells the user which field keeps it.** That is the seam, located precisely, and it is not what the request said it was — see `RDK4`.
- **`feeReportWorking(null)` sets the text empty, hides the element and restores `#debtFamilyHelper`.** Confirmed. **But `#debtRateWorking` and `#debtFamilyHelper` are two separate elements**, both `.helper`, rendered in sequence — not one slot with occupants. `RDN3` turns on this and the request's §5(b) framing would have invited a merge.
- **`feeRecalcTotal` reads `document.getElementById('debtDate').value || todayISO()`.** The borrow date is **not** a fourth required input — the calculator has three, and a form with no date borrowed still computes. §1's *"reads `debtRate`, `debtPrincipal`, `debtDate` and `debtDue`"* is true of the read and false of the requirement, and §8's *"a calculator that needs four inputs"* is wrong by one. `RDK4`.
- **The calculator declines for THREE reasons once a rate is typed, not two.** No due date; no amount borrowed; **and a due date that is not after the borrow date** — `feeTermMonths` returns `null` on `months > 0` being false, so a same-day or earlier due date is a third silent state. §5(c) names two. This decides the firing condition and is why the gate is stated positively rather than as "not the principal".
- **`feeParseRate` returns 0 for anything that is not digits with at most one separator** — so `"3%"` reads as zero and the calculator treats it as *nothing to compute*. A fourth silence, unnamed by the request. `RDD1`.
- **The three existing fee flows in `tools\harness\debts.js` already assert silence in the state where a careless implementation would nag.** *"a monthly rate fills the total, and stores nothing by itself"* types the rate first with the principal empty, then the due date with the principal still empty. **Those assertions stay green under the ruled gate and go red under the careless one only if a new assertion is written, because they assert the total field and not the line.** `RD-01`(7) writes it.
- **`feeReportWorking`'s comment ends *"The copy is closed at this one sentence, permanently."*** It is opened by this work, so under `ARCH-01` it is re-read and restated. Required, not tidy. `RD-01`(6).
- **`debtReportPayoffDate` is the same idiom and its comment closes `mSchedPayoff` at one sentence.** Its three fields sit immediately above the line, in order, in one group, with no field below the output it fills. **That absence of a seam is what refuses `RDR7`**, and it is checkable at source rather than argued.
- **The card's ask line reads *"Add the date this has to be repaid by to see what it costs you each year."*** Its hoisted comment carries the Round 16 reasoning the request quotes, accurately and word for word, and ends *"It names one action and stops. It does not explain annualisation, and it does not promise what the figure will say."* The ruled wording below borrows its first seven words deliberately.
- **`reports\HANDOFF.md` does not carry this observation.** The commit `31895d0` records it; the handoff does not. That is a gap and `RD-01`(8) closes it.

---

## Executive Decision

**Yes. This application is fit for release, and I am opening no release gate — fifteenth round running.** Everything through `EFF-02` is on `main` and live at v20, `npm test` exit 0, the debts harness green at 320/360/390, and nothing in this ruling is built. **On the request itself the answer is yes, for one item, and the request understated its own case in the same way the payoff-date request did.** It argues from Round 16's transferable reasoning, which is true but is not what carries this: what carries it is that the form makes a promise at field three — *"Fills in the total below"* — and then breaks it in front of the user with no line connecting the promise to the field that keeps it, while that field sits two labels below the output and is labelled optional. **A promise that fails silently is worse than no promise, and this is the only place in the module where the application makes one.** Three things the owner must hear plainly: the total is still required and this ruling does not change that; the line is feedback and not a refusal, so it tells a user what to do and does not stop them doing anything else; and there remain states in which the calculator still says nothing, deliberately, because naming every reason it declined is the form that nags.

---

## Ruling on §4 — the sentence and its exact wording

**It ships. The draft is refused and the wording is ruled, and the wording is load-bearing — fifth consecutive ruling in this module to say that about a sentence.**

> ### Ruled wording, exact, and the copy of this state is closed at it permanently
>
> **`Add the date this has to be repaid by, and the rate above will fill in the total.`**

**Why the draft is refused.** *"Add the date this has to be repaid by and this will fill in the total"* uses **"this" twice in one sentence for two different referents** — the debt, then the date or the application, and a reader cannot tell which. On a screen whose target user is described in `product-strategy.md` as that user *under financial stress*, and in `project.md` as someone with little accounting knowledge, a pronoun that resolves two ways in twelve words is not a small defect. The second clause is also the application promising about itself, which is the voice `FEE-04`'s comment forbids in the sentence six pixels above it.

**Why these words.** The first seven words are **byte-identical to the card's shipped ask line**, which was ruled as the only High finding of its round and has been on users' screens since v16. One phrasing for one request, on two surfaces, is one thing to learn. The second clause **names the mechanism the user was already promised** — the rate helper says *"Fills in the total below"* — rather than making a new promise, and it points at the field the promise came from. The spatial reference is this form's own idiom: *"Fills in the total below"*, *"put the same amount in both"*, *"add it above"*. It names one action, names what performs it, and stops.

**What it may never say.** *"required"*, *"must"*, *"need"*, *"missing"*, *"invalid"*, *"error"*, *"we"*, *"optional"*; any figure of money; any percentage; any count of months or days; any apology; any exclamation; any congratulation; any second action; and **nothing about the amount borrowed, the borrow date, or any other reason the calculator declined** (`RDR4`). If the sentence is ever reworded so that it can render in a state where adding the due date would **not** fill the total, this approval stops holding — see the firing condition, where that is the whole argument.

---

## Ruling on §5(a) — a second state on an element whose copy is closed at one sentence

**Admissible. The distinction the request draws is the right one and I am ruling it rather than letting it be assumed. A closure at one sentence is a closure on what the element SAYS AT ONCE, not on how many reachable states it has — and this module has already shipped that reading twice, on a surface with a stricter closure than this one.**

`.debt-rate` was closed at one sentence permanently. It today carries **three** mutually exclusive variants selected by the record: the effective sentence, the flat sentence, and the ask. `EFF-02`(6) did not spend the closure to get there; it **restated it as a rule over all the variants** — *the card states exactly one rate sentence in every reachable state; they are alternatives and never both render.* That is the governing precedent and it applies here unchanged. `SAV-01`'s rule — **a gated line must prove exclusivity or it does not ship** — is the test, and here exclusivity is arithmetic rather than discipline: `feeComputeTotal` returns an object or `null`, and the ask renders only on the `null` branch.

**But an argument that admits a second state admits a fourth, so the fence is stated in five conditions, all binding, and the fifth is the one that does the work.**

> **A form-time line whose copy is closed at one sentence may take a further state when, and only when, all five hold:**
>
> **(1)** The states cannot co-occur, **by arithmetic rather than by discipline** — one derivation returns a value or a null, and the branch selects the state.
> **(2)** The new state renders **only where the element renders nothing today**. It displaces no sentence, and no existing state is reworded, softened or suppressed to make room for it.
> **(3)** It is **one sentence**, naming **one action**, and it stops.
> **(4)** It names an **input**, never an output, never a reason, never a rule, never a field's status, and never a second action.
> **(5)** **The form does not already make that input's role obvious at the point of entry** — the input is below the field it fills, or labelled in a way that contradicts its role, or both. **This condition is checkable at source, which is why it is the one that binds.**
>
> **And the closure is restated on the way out as a rule over all states: the element states exactly one sentence in every reachable state, and which one is selected by what the calculator did.**

**Why this does not erode `openDebtEditModal`, and I am closing that door now rather than answering it later.** The argument that would erode it is *"`mSchedPayoff` is closed at one sentence; by this ruling it may have a second state asking for `firstDue`."* **It fails condition (5), at source.** `mSchedInstalment`, `mSchedCount` and `mSchedFirstDue` sit immediately above `mSchedPayoff`, in one group, in order, with **no field below the line they fill and no label contradicting its role**. There is no seam, so there is nothing for a sentence to bridge. **`RDR7` refuses it by name.** And `EFR2`'s separate closure — the modal holds exactly **one derived line** — is untouched by this ruling and is reaffirmed at full width: this is a rule about states, not about lines, and it grants nobody a second line anywhere.

**One thing the request got right and did not claim credit for.** It asked for this to be ruled *rather than assumed*, and it was right to: `PDT-01` won the analogous argument in the edit modal by distinguishing a derived **field** from a derived **statement**, and a distinction that is only ever drawn in a report is a distinction the next implementer re-draws from scratch. This one goes in the comment.

---

## Ruling on §5(b) — the rule for which of three things occupies that region

**Ruled, written down, and the request's framing is corrected first, because the framing would have produced the wrong implementation.**

**They are two elements, not one slot.** `#debtRateWorking` sits immediately below `#debtTotal`; `#debtFamilyHelper` sits below it. Both are `.helper`. They are visually adjacent and functionally exclusive, and **they are not to be merged** — `RDR6` refuses it by name, because merging deletes a stated helper to tidy a display, which is `SCR15`'s shape, and because the shipped harness reads `family.style.display` directly.

> ### The rule, written down rather than discovered
>
> **One derivation selects all three states, and it is `feeComputeTotal`'s return together with the gate below it. In order, and the order is the rule:**
>
> **1. A total was computed** → `#debtRateWorking` states the working sentence; `#debtFamilyHelper` is hidden.
> **2. No total was computed, and the ask gate holds** → `#debtRateWorking` states the ruled sentence above; `#debtFamilyHelper` is hidden.
> **3. Otherwise** → `#debtRateWorking` is empty and hidden; `#debtFamilyHelper` renders.
>
> **`#debtFamilyHelper` renders exactly when `#debtRateWorking` is not showing, and in no other state — which is what it does today and is not changed by this item.** One predicate, in one place, so the two cannot drift apart.
>
> **Why the family helper yields in state 2 and not only in state 1.** It advises the zero-cost case — *"If a family member lent it with nothing extra to pay, put the same amount in both."* A user who has typed a monthly rate is not in that case, and two helper sentences about the same field, one of which contradicts the user's own stated situation, is the clutter `FN5` pre-ruled the answer to: **the family helper yields, and is never deleted.** That sentence is now cashed for the second time and its pre-ruling holds unamended.

---

## Ruling on §5(c) — the firing condition

**Ruled, and it is a derivation rather than an instinct. The request reached the right answer by taste; here is the ground, and the ground is what makes the sentence true.**

> ### The gate
>
> **The ask state renders when, and only when, all four hold:**
>
> **(a)** the parsed rate is **above zero** (`feeParseRate` > 0);
> **(b)** the parsed amount borrowed is **above zero**;
> **(c)** `#debtDue` is **empty**;
> **(d)** **no total was computed** — the compute is attempted first and the ask is reached only on its `null`.
>
> **In every other state in which no total was computed, the element renders nothing, exactly as it does today.**

**Why the amount-borrowed gate is not politeness.** The ruled sentence **promises that adding the date will fill the total**. With (a) and (b) holding and (c) true, the borrow date defaults to today inside `feeRecalcTotal`, so the due date is provably **the only missing input** and the promise is guaranteed. Drop the principal gate and the sentence renders in a state where adding the due date fills nothing — **the application would break the same promise a second time, in the sentence it added to explain the first break.** That is the whole argument and it is the sentence I want carried out of this ruling: **a sentence that promises an outcome may render only in the state where the outcome is guaranteed.**

**Why the third failure is not named either.** A due date that is not after the borrow date leaves `#debtDue` non-empty, so (c) fails and the element stays silent. Correct, and deliberate: the ask sentence would be **false** there — the date is already typed. Naming that state instead would need a second sentence, `RDR4` refuses it, and the user is not without feedback — `debtAdd` refuses an earlier due date at the boundary in its own words, and a same-day due date produces `debtTermDays(d) === null` on the card, where the shipped `.debt-rate.ask` line asks for the date. **The downstream surface already speaks. The form does not need to speak twice.**

**Why (d) is stated even though (c) implies it.** It fixes the **gate order** — compute first, ask only where the computation was not reached. That is `EFF-02`(1)'s rule arriving for the third time, and it is stated here so nobody implements the ask as the first branch and discovers later that the two orders differ the day a fourth input is added. `RDK5`.

---

## Ruling on §5(d) — the field order

**Refused. By name, permanently, and the request was right to want it refused rather than left unproposed.**

> **`#debtDue` does not move above `#debtTotal`, and no existing field on this form moves. `RDR1`.**

`FR11` already refuses this, in those words, and is carried entire. Three further grounds, any one sufficient, recorded so the next person who proposes it meets an argument rather than a citation.

**First, the problem it would solve is already solved and was solved deliberately.** `feeRecalcTotal` recomputes from **any** of its inputs, so the order the user fills them in does not matter; the upward fill is explained by the working line appearing in the same instant, directly under the output. That is `FN5`, shipped, and its comment says so in the file.

**Second, it would make the form worse at the exact thing this request is about.** `#debtDue` carries a four-sentence helper ending in a reminder clause. Moving it above `#debtTotal` puts four sentences **between the rate and the total it fills** — more copy between a cause and its effect, not less.

**Third, and the request's own reason is the strongest.** Moving an optional field above two required ones is a claim about what this form is for, and the form's order is the thing every other decision on this screen has been layered on top of. **The smallest change that removes the risk is one sentence in an element that already exists. A reorder is a larger change that removes the same risk and creates a new question.** That is the decision rule, applied literally.

---

## Ruling on §5(e) — the due date's "(optional)" label

**Unchanged. The label stays *"Due by (optional)"*, gains no asterisk, gains no `aria-required`, and gains no clause. `RDR2`. The request's lean is correct and here is the ground it did not state.**

**The label is true and a label that said otherwise would be the first false label on this form.** `debtAdd` stores `dueDate: document.getElementById('debtDue').value || null`. A debt with no due date is a complete, valid, fully supported record: it stores, it renders, it totals, it settles, and the card asks for the date rather than refusing the debt. **The asterisk in this module means the add handler refuses without it** — `WORK-204` ruled that the mark is the paint of a fact, not decoration — so putting one here would make the mark mean two different things on one form, which is the defect `PDR6` exists to prevent, wearing a glyph.

**And the contradiction the request worries about dissolves once the two statements are scoped.** **The label is a property of the record. The sentence is a property of what the user just asked for.** A user who types no rate is never told the date is needed, and for them the field is exactly as optional as the label says. A user who types a rate has asked the application to compute something, and the sentence tells them what that computation needs. **Two true statements about different objects are not a contradiction; one word trying to carry both would be.** The request's instinct that *"the label cannot say both in two words"* is right, and the answer is that it does not have to — the sentence carries the second one, at the moment it becomes true, under the field it is about.

---

## Ruling on §2 — the total staying required

**Accepted, and refused by me as the request asked. `RDR3`, permanently.**

The two amounts **are** the record and the shipped comment above them says so in the file, in terms this ruling does not improve on: every figure this module derives comes from `principal` and `totalToRepay`, and their difference is the cost of borrowing, which is the number the screen exists to show. **A debt with no total has no cost, no rate, no outstanding figure, no progress bar, no effective rate and no settle arithmetic** — it is not a smaller record, it is a different object. `product-strategy.md`'s mission puts *"Record what is actually owed"* first and *"Show what the borrowing costs"* second, and the second is unreachable without the second amount.

**Recorded as a rejection with an ID rather than accepted as a disclaimer, eighth outing of that clarification: a disclaimer in a request binds the request and not the future.**

---

## Ruling on §7 and §8

**§7 accepted in full, every clause onto the off-limits list, and the ones with an ID are enforced rather than merely accepted.** Not a change to what is required (`RDR3`). Not a rate stored anywhere (`FR1`, `FR2`, carried at `RDR9`). Not a months or term field or any second term source (`ER7`, `PDR6`, `EFR8`, carried). Not a calculator in the edit modal (`FR6`, carried at `RDR9`). Not a schedule on the add form (`SCD1`, carried, **not fired** — see the deferred table). No change to `feeComputeTotal`, `feeTermMonths`, `feeParseRate`, `debtAdd` or any write path. Not a toast, dialog, tooltip or new element (`RDR8`, `RDR11`). Not a Mongolian string — **nothing in this ruling authorises one, including in the ruled sentence.**

**§8 is accepted and I am ruling on it rather than thanking it for it, because it asks for a sentence in the record and what it actually earns is a rule.** Eight rounds of review did not find this and one afternoon of use did, and the reason is structural rather than a failure of any reviewer: **every reviewer in this project reads the application in the order the file is written, and the user meets it in the order the form is filled.** A seam between two correct functions is invisible to the first reading and unavoidable in the second. That becomes item 3 of the Architecture Strategy, and `RD-01`(8) puts it in `HANDOFF.md`. **It does not become a licence: an observation outranks a reading of the code on the question of whether a seam hurts, and outranks nothing else — it cannot fire a trigger it does not describe.**

---

## Approved Improvements

**One item. One commit. Conditions are binding and are part of the approval, not commentary on it.**

| Item ID | Title | Reason for approval |
|---|---|---|
| **RD-01** | The line that says what the calculator is waiting for | **The form makes a promise at field three and breaks it in front of the user with nothing connecting the promise to the field that keeps it.** The element, the role, the live region and the hide-when-empty discipline all already exist; what does not exist is the branch. **It removes a real silence on the figure the module exists to produce, it stores nothing, it renders on no card, and it is the smallest change that removes the risk** — `RDR1` names the larger change that removes the same one. **Conditions, all binding.** **(1) One element, one new state, no new anything.** `#debtRateWorking` only. **No new element, no new id, no new class, no new selector, no CSS rule, no change to `.helper`**, and no change to the element's markup or attributes. **(2) The ruled wording, exactly**, per §4, with its forbidden list attached. **(3) The gate, exactly**, per §5(c): rate above zero, amount borrowed above zero, `#debtDue` empty, and **the compute attempted first** — the ask is reached only on `feeComputeTotal` returning `null`. **The comment states the principal gate as a rule and states why: the sentence promises the total will fill, so it may only render where that is guaranteed.** **(4) The three-state rule, exactly**, per §5(b), with `#debtFamilyHelper` hidden whenever `#debtRateWorking` is showing and rendered whenever it is not — **one predicate, one place, unchanged from today's behaviour.** **(5) The decision lives in `feeRecalcTotal` and the render lives in `feeReportWorking`, and the state is passed explicitly.** `feeReportWorking(null)` keeps its present meaning — *nothing to say* — so **both existing call sites are byte-identical**: `debtAdd`'s reset block and the manual-total listener. A reporter that re-derives the ask from the DOM would make the manual-total path depend on the order in which two fields were cleared. `RDN2`. **(6) The element is written only when the text changes** — `if (el.textContent !== next) el.textContent = next;` — **and the comment states the reason as a rule, not a note:** `aria-live="polite"` re-announces on every mutation, and the ask text is constant across keystrokes, so typing `3.5` without the guard announces the same instruction three times to a screen-reader user. It benefits the computed state too. `RDN1`. **(7) `feeReportWorking`'s comment is re-read and amended in the same commit, and this is required rather than tidy** (`ARCH-01`, the block is opened): its closure — *"The copy is closed at this one sentence, permanently"* — is **restated as a rule over both states**: the element states exactly one sentence in every reachable state, which one is selected by whether the calculator ran, and the copy of each is closed permanently. **It states the rule and names no tally, and it cites `feeComputeTotal` and `feeRecalcTotal` by name and no line number** (`ARCH-01`, `C43`). **The `feeRecalcTotal` wiring comment is re-read and is NOT amended: its *"it FILLS ONE FIELD and does nothing else"* is scoped to writes and stays true.** `RDN6`. **No other comment in the file is touched and no sweep is authorised.** **(8) `reports\HANDOFF.md` records the observation and what it did and did not fire, in the same commit** — wording ruled below. **(9) Fixtures ride this commit**, in `tools\harness\debts.js`, in the existing fee flows — **no new runner, no second probe, no fifth static predicate.** Assertions: the ask renders on rate-plus-principal with no due date and its **words** are asserted, as the shipped rate-line flows assert theirs; **the family helper is hidden while it shows**; **the negatives, which are the ones that matter** — a rate typed with nothing borrowed says nothing, a rate typed with a due date already present says nothing, a rate that does not parse says nothing, and **the ask never renders while a total is computed**; and the existing flows *"a monthly rate fills the total, and stores nothing by itself"* and *"the calculator states its assumption, and yields when there is none"* **stay green and unmodified** — `EFN10`'s trap, second outing. **Reddening perturbation: drop the amount-borrowed condition from the gate, and the "nothing borrowed says nothing" assertion goes red. The commit message names it and both exit codes**, and `git diff --name-only` prints exactly `expense-pwa\index.html` and `tools\harness\debts.js` (`C37`, `C40`). **(10) Nothing else changes.** `renderDebts` is byte-identical. `debtAdd`'s refusals and **its toast text** are untouched (`RDN7`). `feeComputeTotal`, `feeTermMonths`, `feeAddMonths`, `feeParseRate`, `debtProblem`, `debtTermDays`, `debtAnnualCostRate`, `debtEffectiveAnnualRate`, `debtPayoffDate`, `debtReportPayoffDate`, `openDebtEditModal`, `computeReminders`, both write paths and every sheet are untouched. **No stored field, no storage key, no `SCHEMA_VERSION` bump, no migration, no default in `importReplacement`.** **`check-escaping.mjs` stays unwidened** — `textContent`, never `innerHTML`, and no user text is interpolated. **(11)** `npm test` expect 0; the debts harness at 320, 360 and 390, expect its existing flows unchanged plus these assertions. **No new width assertion is owed**: one sentence of the same class in the same position as two helper sentences that already render there at every supported width. **No `sw.js` bump inside the work.** **XS.** |

**There is no second item and the absence is the ruling.** The card gets nothing, the edit modal gets nothing, the tiles get nothing, the bell gets nothing, the labels do not move, the fields do not move, `debtAdd` does not change, and `product-strategy.md` gets nothing — **no new row in the assumptions table, because this item rests on no claim about the market that the monthly-rate row does not already carry.**

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **RDR1** | §5(d) — moving `#debtDue` above `#debtTotal`, or any reorder of the add form's existing fields | **Refused by name, permanently, as asked.** `FR11` carried entire. The upward fill it would solve is already solved by recomputing from every input and putting the line under the output; it would place four helper sentences between the rate and the total; and moving an optional field above two required ones is a claim about what this form is for. **The smaller sentence removes the same risk.** |
| **RDR2** | §5(e) — changing, removing or qualifying `#debtDue`'s "(optional)" label; an asterisk; `aria-required`; a second label clause | The label is **true**: `debtAdd` stores `dueDate` as `null` and the record is complete without it. The asterisk in this module means *the handler refuses without it* (`WORK-204`), so one here makes the mark mean two things on one form. **The label is a property of the record; the sentence is a property of what the user asked for.** |
| **RDR3** | §2 — making `totalToRepay` optional, derived-only, or relaxing `debtAdd`'s refusal of it | **Refused by name, as the request asked.** The two amounts are the record; every figure this module derives comes from them and their difference is the cost of borrowing. A debt with no total is not a smaller record, it is a different object. |
| **RDR4** | A second sentence naming any other reason the calculator declined — the amount borrowed, an unparseable rate, a due date not after the borrow date, or a zero-length term | **Permanently.** Naming every reason is the form that nags, and each extra sentence is one more thing that can be false in a state nobody enumerated. The principal is field two with an asterisk and `debtAdd` refuses it by name; an earlier due date is refused at the boundary in its own words; a zero-length term surfaces on the card's own ask line. **The surfaces downstream already speak.** |
| **RDR5** | A clause added to the due-date helper, the rate helper, the family helper or the form's opening helper | **`FN6` carried and reaffirmed.** It refused a fifth sentence in a helper **two fields away** from where the assumption is made; this item states it **at the point of failure, under the output**. Same rule, pointing the same way. The due-date helper is already four sentences. |
| **RDR6** | Merging `#debtRateWorking` and `#debtFamilyHelper` into one element, or deleting the family helper | `SCR15`'s shape: destroying a stated fact to tidy a display. The helper is advice for the no-rate case and that case still exists. The shipped harness reads `family.style.display` directly. **Two elements, three states.** |
| **RDR7** | A second state on `mSchedPayoff`, or a second derived line anywhere in `openDebtEditModal` | **Refused by name and in advance, per §5(a).** It fails fence condition (5) at source: the three schedule fields sit immediately above the line, in order, with no field below the output and no label contradicting its role. **There is no seam, so there is nothing for a sentence to bridge.** `EFR2`'s one-derived-line closure is untouched and reaffirmed at full width. |
| **RDR8** | A toast, dialog, tooltip, inline field error, red styling, `aria-invalid`, or any refusal on the add form for a calculator state | The line is **feedback, not a refusal** — `PDT-01`'s own distinction, second outing. A refusal here would block a legitimate record: a user with a lender's total and no agreed date is an ordinary case and `PDR8`'s rule governs it — **a refusal that protects nothing costs a legitimate record.** |
| **RDR9** | Storing the rate in any form, including in `notes`; a rate input in the edit modal; recomputing a total after the fact; an edit trail shipped inside this item | `FR1`, `FR2`, `FR6` carried entire. **`FD1` remains the pre-ruled answer to the drift if it ever bites, and it is not fired here.** |
| **RDR10** | This sentence, or the calculator, reaching any card, tile, chip, `.debt-meta` pill, gated foot line, bell item, sheet, the Dashboard or any period-filtered surface | Carried and permanent. `C38`, `SCR10`, `PDR2`, `PDR4`, `EFR11`. This is a **form-time** line and it dies with the form session. |
| **RDR11** | A new element, id, class, selector or CSS rule for this state; a distinct visual treatment; a colour change | `.helper` is already this form's subordinate treatment and both existing states use it. The card's `.debt-rate.ask` needed its own class because it sits beside a figure-bearing sentence with `--danger-text` weight; **nothing here sits beside a figure.** |
| **RDR12** | A new storage key, schema field, `SCHEMA_VERSION` bump, migration or `importReplacement` default; a new harness runner, second probe or fifth static predicate; an app-wide sweep; a Mongolian string | Carried entire. **Untested by this feature for the fifth consecutive request about this module**, which is now a property of the module. The language layer still needs its own scoped proposal and its own ruling. |
| **RDR13** | Making `#debtDate` required, or removing `\|\| todayISO()` from `feeRecalcTotal` so the borrow date becomes a fourth gate | Pre-rejected because §1 and §8 both read as though the calculator needs four inputs and an implementer may "fix" the discrepancy. **It needs three.** The default is deliberate and removing it would make the sentence false in a state the gate cannot see. |
| **RDR14** | **All prior rejections — carried** | Unchanged and none re-raised. In particular: the amortisation model; an assumed repayment pattern; a stored or inferred rate; APR, "interest rate", "effective", "true rate", "real rate" or "actual rate" on any screen; a second rate figure on a debt card in any form; "saved" and every synonym; any figure stating what a lender would charge, accept or do; a rate-period or frequency selector; a third term derivation; a per-instalment ledger, mark or cursor; any figure comparing a schedule with `db.debtPayments`; a payoff date on any card, tile, chip or bell item; a countdown, progress figure or "free by"; a one-time or dismissible disclosure mechanism; a cached or memoised derived rate; any cap that under-reports what the user recorded; `class="money-input"` on any input that is not whole tugrik; widening `check-escaping.mjs`; any parser that writes to a collection; cloud vision; auto-recording a payment when an instalment falls due; and **no app-wide sweep of any kind.** |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **`RDD1`** | Widening what `#debtRate` accepts | **Mine, from `RDN5`, and the request did not raise it.** `feeParseRate` reads `"3%"`, `"3 %"` and `"3.5%"` as **zero**, so the calculator declines, the ask does not fire (the rate gate fails), and the user gets the same silence this item exists to remove — through a different door. **It is a deferral and not an item because the right shape is not known and the wrong shape is a parser change on a multiplier**, which is the class of edit `FN3` records as the most dangerous thing on this form. **Trigger: an observation, recorded in `reports\HANDOFF.md` with the date and the exact characters typed, of a user entering a rate this field does not accept.** **Pre-ruled fences if it fires:** the widening is **exactly the characters observed and no more**, in `feeParseRate` alone, in its own commit, with one fixture per accepted character and one per still-rejected character; **the field never gains `class="money-input"`**; and **never a second sentence** telling the user their rate is not a rate (`RDR4`). |
| **`FD1`** | An edit trail on `totalToRepay` | **Carried, unchanged, NOT fired.** Its trigger is an observed total drifting from quoted terms after a due-date edit, or a renegotiated loan reported as having no answer. **This observation describes neither.** It remains the pre-ruled answer to the calculator's drift and it is not a stored rate. |
| **`FD2`** | A flat tugrik fee as a second way to fill the total | **Carried, unchanged, NOT fired.** Its trigger is an observation that real lenders state a **flat fee**. The owner's sentence says nothing about a fee. **Recorded explicitly because this is the deferral nearest to the observation's subject and therefore the one most likely to be claimed as fired.** Nothing is pre-ruled in it, deliberately, and that stands. |
| **`SCD1`** | The schedule on the **add form** | **Carried, unchanged, NOT fired.** Its trigger is an observation that entering a schedule **in two steps** is a real cost to a real user. The observation is about a required amount on a form, not about a schedule, and the owner has not mentioned a schedule. **One thing it inherits from here, as context and not as a firing:** the cost this observation found on the add form was **order and labelling, not height**, so if `SCD1` ever fires, its pre-ruled nested-`<details>` answer is aimed at the objection that has **not** been observed. |
| **`SCD2`** | Reminders from the schedule | **Carried, fireable today, NOT fired.** Its own scoped request. Every fence intact. Nothing here touches `computeReminders`. |
| **`PDD1`** | Telling a user which debts carry a schedule | **Carried, unchanged, NOT fired and NOT discharged.** Its trigger is an observation of a user who entered a schedule and could not find it again. **This is an observation, and it is not that one.** Its fence — **not to be fixed by a chip** — is carried verbatim. |
| **`EFD1`** | A guard on `firstDue` at the write boundary | **Carried, unchanged, NOT fired.** Its trigger is an observation of a stored schedule whose first payment date is wrong, or `firstDue` acquiring a third reader. Neither has happened. |
| **The saving** | — | **Not deferred. Rejected permanently at `PR1`.** Listed again so nobody attaches a trigger to it. |
| **Carried** | Every standing deferral | **Unchanged, every trigger intact, none fired.** `D1` image OCR; `D2` the chooser; `WORK-10`, `WORK-11`, `WORK-09` (round 15 numbering), `WORK-210(b)`, `WORK-213`; the WebKit `.grid-2` residual; Stage 2 — **not fired: nothing here is a calculation defect**; the application-file `ARCH-01` pass and the stale `index.html:1117` coordinate, **still not this item's**; and the language layer. |

---

## Conflict Rulings

**There is no Engineering Manager report and therefore no recorded conflict list, and no reviewer findings this cycle — recorded as an explicit discharge of that obligation rather than left silent.** These are the seven collisions I found between the request, the standing record and the source. Each is ruled.

### RDK1 — `PDR3` against a slot that states an output and also asks for an input

**Ruling: `PDR3` binds at full width, it is not contradicted, and the request was right that it is the sentence that will be quoted against this item. It points the other way.**

`PDR3` refused spending the **card's** gated ask line on a payoff date, on two grounds: the two states **overlap** — a debt with a schedule, a cost and no due date is an ordinary record — so the card would have to **choose** between asking and telling; and the choice's cost was that **suppressing the ask means the due date is never requested**, so the rate the module exists to produce never becomes computable. **Neither ground exists here.** The states cannot overlap: `feeComputeTotal` returns a total or `null`, and a state in which the total was computed is a state in which there is nothing to ask for. And the direction is inverted: `PDR3` protects the **request for the input**, and this item **is that request**, arriving on the surface where the input is typed.

**So the sentence survives and is restated with its scope visible: a slot that asks for an input is not a slot that states an output — where the two states can co-occur and the surface must choose. Where exclusivity is arithmetic, one element may do both, one at a time, and `SAV-01`'s exclusivity test is how you tell which case you are in.** `EFR3` is untouched: nothing here suppresses the card's ask line, and `renderDebts` is byte-identical.

### RDK2 — the one-sentence closure on `feeReportWorking` against a second state

**Ruling: admissible, fenced at five conditions, and the precedent is `.debt-rate` rather than an argument from first principles.** Ruled in full at §5(a). Recorded separately because the closure sentence is in the shipped file and will be read by the implementer, who must find the amended version rather than a contradiction. `RD-01`(7) makes the amendment a condition of the commit.

### RDK3 — `FN6` against a sentence that asks for the due date

**Ruling: `FN6` is untouched and it is the reason this item takes the shape it does.** `FN6` refused a **fifth clause in the due-date helper**, two fields away from where the assumption is made, on the ground that this module states an assumption *"at the moment it happens, under the field it happened to."* **This item is that rule obeyed, not bent:** the sentence lands under `#debtTotal`, which is the field the failure happened to, at the instant it happened. **`RDR5` refuses the helper clause again, by name, so nobody offers it as the cheaper alternative to this item.**

### RDK4 — §1 against the source, in three places

**Ruling: the table is true in its four substantive rows and wrong in three details, and each detail changes an answer, which is why they are here rather than in a footnote.**

**(a) The calculator has three required inputs, not four.** `feeRecalcTotal` reads `debtDate.value || todayISO()`. §1 says it *"reads `debtRate`, `debtPrincipal`, `debtDate` and **`debtDue`**"*, which is true of the read, and §8 concludes *"a calculator that needs four inputs"*, which is false. **The default is what makes the due date provably the only missing input under the ruled gate**, and `RDR13` protects it.

**(b) It declines for three reasons once a rate is typed, not two.** §5(c) names no due date and no amount borrowed. The third is a due date that is not **after** the borrow date, which `feeTermMonths` rejects. §5(c) asks which to fire on, from a list missing one of the candidates. **The gate answers all three, and the third is the one that would have made the ruled sentence false.**

**(c) The form order omits two elements and the omission hides the good news.** Between `#debtTotal` and `#debtDate` sit `#debtRateWorking` and `#debtFamilyHelper`, and below `#debtDue` sits `#debtNotes`. **`#debtRateWorking` is the element immediately under the output** — which is precisely why no new element is needed, and §4's strongest structural claim is stronger than §1 lets it be.

### RDK5 — the gate order against `EFF-02`(1)

**Ruling: the same rule, third application, and stated here so it is not rediscovered.** *Compute first; the ask is reached only where the computation was not.* On the card it was load-bearing because the effective rate needs no due date and a careless order would have suppressed the ask. **Here it is currently implied by the gate rather than load-bearing — and that is exactly why it must be written as a rule**, because the day a fourth input joins the calculator, the two orders stop agreeing and nothing would say so.

### RDK6 — §5(d) against `FR11`

**Ruling: already refused, refused again by name, and the reaffirmation is worth its two lines.** `FR11` refused this against the fee calculator. The request predicts it is *"the first thing the next person will suggest"*, and that prediction is itself the argument for an entry on the off-limits list rather than a rejection buried in one ruling's table. `RDR1` and the Architecture Strategy both carry it.

### RDK7 — `SAV-01`'s exclusivity rule applied off a card for the first time

**Ruling: it transfers, it is satisfied here by arithmetic, and the transfer is recorded because this is its first outing on a form.** `SAV-01`'s rule — **a gated line must prove exclusivity or it does not ship** — was written about the debt card's foot, where three gated helpers cannot co-occur because of how `overpaid` and `settledShort` are computed. **The property it protects is not a property of cards; it is a property of gated copy.** On a form the proof is cheaper and the temptation is greater, because a form's states change under the user's fingers rather than between renders. **Stated as a rule so the next gated form line proves it rather than asserting it.**

---

## Rulings on What the Request Did Not Ask

**RDN1 — `aria-live="polite"` re-announces on every mutation, and the ask text does not change between keystrokes.** `feeRecalcTotal` runs on every `input` event and assigns `textContent` each time; assigning the same string still replaces the text node, and a polite live region can announce it again. The computed sentence changes as the user types, so the repetition was meaningful; **the ask sentence is constant, so typing `3.5` can announce the same instruction three times to a screen-reader user on a form that has just started speaking instructions.** Fixed at `RD-01`(6) by writing only on change — one line, it improves the computed state too, and the comment states it as a rule so nobody removes it as redundant.

**RDN2 — `feeReportWorking(null)` keeps meaning silence at both of its existing call sites, and the ask is decided upstream.** `debtAdd`'s reset block and the manual-total listener both call it, and **the manual-total listener clears the rate immediately before calling it.** A reporter that re-derived the ask from the DOM would make that path depend on the order of two statements — and `FN4` is emphatic that from the moment the user types a total, **the application stops having an opinion about it.** The decision belongs in `feeRecalcTotal`, which holds the parsed inputs, and the state is passed explicitly.

**RDN3 — these are two elements, not one slot, and they are not merged.** Visually adjacent, both `.helper`, functionally exclusive. §5(b)'s "the slot is shared" framing invites a merge into one element with three messages, which would delete a stated helper (`SCR15`), break the shipped harness assertion on `family.style.display`, and put three unrelated sentences behind one `role="status"`. **`RDR6`.**

**RDN4 — the family helper's predicate is stated once, in one place, and does not change.** It renders exactly when `#debtRateWorking` is not showing. That is what it does today; the only difference is that "showing" now has two causes. **Stated as a rule because the obvious alternative — hiding it whenever a rate has been typed — is a second predicate that would agree with the first in every state anyone tested and disagree in the ones nobody did.**

**RDN5 — a rate the field does not accept produces the same silence through a different door.** `"3%"` parses to zero; the calculator declines; the ask gate fails on the rate condition; nothing is said. **It is the identical defect one character wide**, and it is `RDD1` rather than a condition of this item, because the fix is a parser change on a multiplier and this module's own comment records that class of edit as its most dangerous.

**RDN6 — two comments are in this work's path and only one is false.** `feeReportWorking`'s closure sentence becomes misleading the moment a second state ships, and is amended (`RD-01`(7)). **`feeRecalcTotal`'s wiring comment does not**: its *"it FILLS ONE FIELD and does nothing else"* enumerates writes — never the add handler, never `db`, never `localStorage` — and every clause stays true. **Recorded so the implementer does not "improve" a true comment, which is `PDN4`'s inverse and the second time it has come up.** No other comment is touched; **this is `ARCH-01`'s mechanism, not a sweep.**

**RDN7 — `debtAdd`'s toast is not reworded and this item does not touch it.** *"Enter the total you will pay back"* fires **after** the tap; the ruled line fires **before** it. A toast that explained the rate path would be a second door onto the same mechanism, in a transient element nobody can re-read, on a screen where the explanation is already visible in place. **The refusal messages on this form are not this item's to touch.**

---

## What goes in `reports\HANDOFF.md`, in what words

**A condition of the `RD-01` commit.** Placed in the *Owner decisions, dated, because rulings hang on them* section, after the effective-rate entry. **It is recorded against no standing deferral, and saying so is half its purpose.**

> **2026-09-19 — the first request in this module that came from USING the application rather than from reading it.** The owner, adding a debt: *"If I add the debt it asked insert pay back money it's required thing."* They hit the required total on a form that promises, two fields above it, *"Fills in the total below"* — and the input that keeps that promise is labelled optional, sits two labels **below** the field it fills, and produced no message at all when it was missing. **Every function did what it was ruled to do. The defect was the seam between two correct pieces, and eight review rounds did not find it because a reviewer reads the file in the order it is written and a user meets it in the order the form is filled.**
>
> **What shipped is one sentence, in `#debtRateWorking`, in the state that used to render nothing:** *"Add the date this has to be repaid by, and the rate above will fill in the total."* It renders only when a rate and an amount borrowed are both present and the due-by field is empty — **the gate is what makes the promise in the sentence true**, because in that state the due date is provably the only thing missing.
>
> **What did NOT change, and each was refused by name:** the total is still required; the due-by field is still labelled **(optional)** and gains no asterisk, because it is genuinely optional for the record and a label cannot carry both facts; **no field on the add form moved**; and nothing says a word about the amount borrowed, an unparseable rate or a due date that is not after the borrow date — **naming every reason the calculator declined is the form that nags.**
>
> **THIS OBSERVATION FIRES NO STANDING DEFERRAL, and that is recorded here because "an owner observation exists" is the sentence most likely to be quoted at the ones it does not describe.** `FD2` (a lender stating a flat fee) — **not fired**, nothing about a fee. `SCD1` (a schedule on the add form) — **not fired**, nothing about a schedule; and note that the cost this observation found on that form was **order and labelling, not height**, which is the objection `SCD1`'s pre-ruled answer is aimed at. `PDD1` (which debts carry a schedule) — **not fired**, it is an observation and it is not that one. `EFD1` (a guard on `firstDue`) — **not fired**. `FD1` (an edit trail on `totalToRepay`) — **not fired**. Stage 2 — **not fired**, nothing here is a calculation defect. **A trigger stated as an observation is discharged only by an observation that describes the thing the trigger names.**
>
> **One thing to put to the owner when there is a natural moment, and it is not a gate.** Their sentence reads two ways: *"I could not fill the required total"*, or *"why is the total required at all"*. **The line answers both** — it tells them how to have the total filled for them — which is why no ruling waited on the answer. But if they meant the second, the standing answer is that the two amounts **are** the record and every figure this module shows is derived from them, and that is not reopened.

---

## Development Order

| Order | Item | Why here |
|---|---|---|
| 1 | **RD-01** | **The only item. One commit: the gate in `feeRecalcTotal`, the state in `feeReportWorking`, the write-on-change guard, the amended closure comment, the `HANDOFF.md` entry and the fixtures.** They do not split: a gate with no sentence renders nothing, and a sentence with no gate is the nag this ruling refused. |

**No owner gate, and the reasoning is stated rather than assumed.** The owner is the source of this request, the item is strictly smaller than what they described, and **the line answers both readings of their sentence** — so asking would be asking them to adjudicate an ambiguity the item has already covered. What they are owed is not a gate but a sentence, and it is a condition of the commit: the `HANDOFF.md` entry above, including the clause naming what did **not** change.

`npm test` after, expect 0. The debts harness at 320, 360 and 390, expect its existing flows **unchanged** plus these assertions. **No `sw.js` bump inside the work:** v20 is live **and** v20 is staged, so the deploy that carries this bumps to **v21 once**, and the key is checked by **fetching the deployed `sw.js` before touching the file** — the error the v19 row exists to prevent and the trap the v20 row records a second time.

**Not scheduled: `RDD1`, `FD1`, `FD2`, `SCD1`, `SCD2`, `PDD1`, `EFD1`, and every carried deferral.**

---

## Architecture Strategy — next quarter

**What stays, and is not open for discussion.** Everything in the standing record and all eleven design-request rulings, **with no entry narrowed by this document.** The single self-contained `expense-pwa\index.html` that runs by being opened from disk. No framework, no build step, no bundler, no component abstraction, **no new dependency — reaffirmed against this request specifically: no validation library, no form library, no date library.** `localStorage`, one write seam, `load()` total, quarantine before write, numbered append-only migrations. **Offline-first, mobile-first, and correctness of financial data above everything** — and this request is decided by that last clause in the quietest way any of the eleven has been: the total this form refuses to store is the number every other figure in the module is derived from, so the cheapest way to keep it correct is to stop the user having to compute it in their head. A debt figure never reaches a period-filtered surface (`C38`). A collection that must never reach a total keeps its own array (`C39`). A figure the application computed by a model of its own is labelled as such (`C36`). Comments state rules, never tallies (`ARCH-01`). A citation names the thing, not the place (`C43`). **The record holds the agreement; the application never scores performance against it.** The rate-model entry stands at exactly the width `EFK1` granted it; the fee narrowing at exactly the width `FEE`/Q1 granted it, **invoked here as the ruling that built this screen and widened by nothing.**

**What changes.**

1. **A form-time line closed at one sentence may hold more than one mutually exclusive state, and the closure is restated as a rule over all of them: the element states exactly one sentence in every reachable state.** The admission is fenced at five conditions (§5(a)), and **the fifth is the one that binds because it is checkable at source** — the new state is admissible only where the form does not already make the missing input's role obvious, which means the input is below the field it fills or labelled against its role. `.debt-rate` proved the shape on a card; this proves it on a form; `mSchedPayoff` is refused by the same test and that refusal is written down before anyone asks.
2. **A sentence that promises an outcome may render only in the state where the outcome is guaranteed.** This is the most portable thing in this ruling and it is what turned a matter of taste in §5(c) into a derivation. It also states the failure it prevents: an application that breaks a promise, then adds a sentence to explain the break, and breaks the same promise inside the explanation.
3. **An observation from using the application outranks a reading of the code on whether a seam hurts, and outranks nothing else.** Eight rounds read this file correctly and none of them was standing where the user stands. **A reviewer reads the file in the order it is written; a user meets it in the order the form is filled, and the defects that live between two correct functions are only visible from the second direction.** The fence, and it matters more than the permission: **an observation cannot fire a trigger it does not describe** — this one fires none of the five deferrals it is nearest to, and the `HANDOFF.md` entry says so by name. This is `C34` restated for observations: *a trigger stated as an observation is discharged only by an observation that names the thing the trigger names.*
4. **Where the application asks a user for something, it names the input and the mechanism and stops.** Never the reason, never the rule, never the field's status, never a second action, and never more than one of the several things that might be missing. Third sentence in this module built to that shape — the card's ask line, the payoff line and now this — and in all three the wording was the load-bearing part.

**Off limits this quarter — five additions:**

- **Any reorder of the add form's existing fields, including moving `#debtDue` above `#debtTotal`.** Refused by name, twice now.
- **Any change to `#debtDue`'s "(optional)" label**, including an asterisk, `aria-required` or a qualifying clause.
- **A second sentence on the add form naming any other reason the calculator declined.**
- **Any inline field error, red styling, `aria-invalid`, toast or refusal on the add form for a calculator state.** The line is feedback; it never blocks.
- **A second state on `mSchedPayoff`, and a second derived line in `openDebtEditModal`.**

**Risks recorded, not scheduled. None is a finding and no reviewer raised any of them.**

- **Mine, and the largest.** **The line is feedback, not a refusal — third consecutive ruling in this module to record that sentence about a different object.** It tells a user how to fill the total; it does not stop them typing a wrong one, and `debtProblem` validates shape rather than truth. A user who does not read it stores exactly what they would have stored before.
- **Mine, and the one that would most embarrass this ruling.** **The whole item rests on an interpretation of one sentence of the owner's, and that sentence reads two ways.** The item serves both readings, which is why nothing gates on it — but if the owner meant *"why is the total required at all"*, they will not feel heard by a line that helps them fill it, and the `HANDOFF.md` entry is written so the next person can put the question properly rather than rediscovering the ambiguity.
- **Mine, from `RDN5`.** **The calculator still says nothing in three states**: an unparseable rate, an amount borrowed not yet typed, and a due date that is not after the borrow date. Each is deliberate, each is refused a sentence by `RDR4`, and only the first has a deferral. **If the owner hits any of them next, the answer is not a fourth state — it is a scoped request about that state.**
- **Mine, from `RDN1`.** **This form now speaks instructions into a live region while the user types.** The write-on-change guard bounds it; it does not eliminate the fact that a `role="status"` element on an add form has become conversational, and the next state added to it would double the traffic.
- **New, and stated as a risk rather than a finding because no reviewer raised it.** **The add form stands at ten controls under a standing scope question, and this item adds no control — but it adds a third reachable sentence to the region under `#debtTotal`.** Exactly one renders at a time, so nothing is spent; but the region is now a small state machine and the next request that wants to say something on this form should expect to be asked which of the existing states it is prepared to lose.
- **Carried and unchanged.** `totalToRepay` has no edit trail and is load-bearing for four figures. The instalment field is one digit away from a wrong record and the sum rule is its only guard. `firstDue` is still unguarded and now moves a headline percentage. "Cost so far" still overstates an early settlement. A backup restored by an older build loses `settledOn` and `schedule`. No archive on the Debts screen. Six bell write sites. `renderDebts` walks the payment ledger roughly seven times per debt and performs a numeric solve inside the render loop; **`RD-01` runs nothing inside `renderDebts` and fires neither.** Every string in this module is a literal and the language layer still needs its own scoped proposal and its own ruling. One stale in-file coordinate survives at `:1117` and is still not this item's.

---

## Final Recommendation

**Take `RD-01` alone, in one commit, and write nothing else: in `feeRecalcTotal`, after `feeComputeTotal` has already been asked and returned `null`, test that the parsed rate is above zero, the parsed amount borrowed is above zero and `#debtDue` is empty — and in that state, and no other, have `feeReportWorking` put one sentence into `#debtRateWorking` and hide `#debtFamilyHelper` exactly as it does for the working line: `Add the date this has to be repaid by, and the rate above will fill in the total.` Write the element only when the text changes, because a polite live region re-announces a constant sentence on every keystroke. Amend `feeReportWorking`'s closure comment in the same commit so it states the rule over both states rather than contradicting the code beneath it, leave `feeRecalcTotal`'s wiring comment alone because every clause in it is still true, and put the observation and its five not-fired deferrals into `D:\3_Claude\PowerApps\reports\HANDOFF.md` in the words ruled above. The fixtures go in the existing fee flows in `D:\3_Claude\PowerApps\tools\harness\debts.js`, and the one that matters is the negative: a rate typed with nothing borrowed still says nothing, red when the amount-borrowed condition is dropped from the gate.** Then stop: the field order does not move, the "(optional)" label does not move, the total stays required, `debtAdd` and its toast are untouched, `renderDebts` is byte-identical, and `RDD1` stays where it is. **The sentence I want carried out of this ruling is the one that decided §5(c): the request asked which of two missing inputs to name, and the answer fell out of the sentence rather than out of taste — the line promises that adding a date will fill the total, so it may only appear in the state where that is true, which means the gate is not a courtesy to the user but the only thing standing between this application and breaking the same promise twice in a row, the second time inside the apology for the first.**

*(Design-request ruling, 2026-09-19. Item `RD-01`; rejections `RDR1`–`RDR14`; deferral `RDD1` with `FD1`, `FD2`, `SCD1`, `SCD2`, `PDD1` and `EFD1` carried and **explicitly NOT fired**; collisions `RDK1`–`RDK7`; unasked questions `RDN1`–`RDN7`. **No off-limits entry narrowed; the fee narrowing invoked as the governing ruling for this screen and not widened; the `EFK1` rate-model narrowing neither invoked nor widened.** Source: `D:\3_Claude\PowerApps\reports\design-request-rate-needs-a-date.md`. Every claim in its §1 re-derived at source in `D:\3_Claude\PowerApps\expense-pwa\index.html`; three corrected at `RDK4`. **There is no UI Review report, no Code Review report and no Engineering Manager report, and none is owed.** No code was modified, no knowledge file was modified and no other role's report was edited.)*

---

**Note to the orchestrator, not part of the ruling.** The text above is the complete report, ready to be written verbatim to `D:\3_Claude\PowerApps\reports\chief-architect-rate-needs-a-date.md` with LF line endings. Files read at source during this ruling: `D:\3_Claude\PowerApps\reports\design-request-rate-needs-a-date.md`; `D:\3_Claude\PowerApps\reports\chief-architect-fee-calculator.md`; `D:\3_Claude\PowerApps\reports\chief-architect-payoff-date.md`; `D:\3_Claude\PowerApps\reports\chief-architect-effective-rate.md`; `D:\3_Claude\PowerApps\reports\chief-architect-repayment-schedule.md` (the `SCD1`/`SCD2` rows and `SCR9`–`SCR16`); `D:\3_Claude\PowerApps\reports\HANDOFF.md`; `D:\3_Claude\PowerApps\tools\harness\debts.js` (the three fee flows); all five files in `D:\3_Claude\PowerApps\knowledge\`; and `D:\3_Claude\PowerApps\expense-pwa\index.html` — the `#debtAddFields` form, `debtAdd`, `feeAddMonths`, `feeTermMonths`, `feeComputeTotal`, `feeParseRate`, `feeReportWorking`, `feeRecalcTotal`, `initDebtRate`, `debtPayoffDate`, `debtReportPayoffDate`, the `rateLine` construction in `renderDebts` and the `.debt-rate` / `.debt-rate.ask` rules. **Three claims in the request's §1 and §8 do not survive verification and are corrected at `RDK4`; the implementer needs those corrections, not just the ruling.**
