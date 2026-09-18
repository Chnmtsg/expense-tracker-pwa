# Chief Architect Ruling — Design Request: the payoff plan

*(Supplemental. The Round 16 ruling, the saving ruling, the settle-a-debt ruling, the early-settlement ruling, the fee-calculator ruling, the paste-a-loan ruling, the Round 15 ruling and the standing record at `reports\archive-chief-architect-round14.md` — which carries the round-9 standing decision and the Round 11 through 14 supplementals — **remain in force in full.** This ruling adds to that record and replaces none of it. **No off-limits entry is narrowed by one millimetre.** The rate narrowing, the storage narrowing, the `EN4` narrowing and the `SET-01` storage narrowing are each reaffirmed at exactly the width they were granted. The `.debt-totals` block stays closed at three sentences, the card's rate copy at one, the settle sheet's helper at one, the calculator's working line at one — all permanently.)*

**ID namespace.** The item here is `PAY-01`; rejections `PR1`–`PR13`; deferral `PD1`; collisions `PK1`–`PK7`; unasked questions `PN1`–`PN6`.

**Ruling issued on all five questions in §5, on §6, on seven collisions and on six things the proposal did not ask. No item is silent.**

---

## Verified Against Source, Not Accepted On Report

- **§2 is correct and for the reason it gives.** `totalToRepay` is written by `debtAdd` and by the `editCtx.kind === 'debt'` save branch, both from a field the user typed, and by nothing else. There is no amortising balance, no accrual, no per-period recalculation. **Paying faster does not reduce what is owed. The saving is zero by construction.**
- **And the order saves nothing either — which §3 does not say, and it is the sharpest fact in this document.** On records whose totals are fixed at agreement, the sum of everything repaid is identical under every possible ordering. **Avalanche's entire rationale is to minimise interest, and on this data model it minimises nothing.** So the item's two supposedly computable outputs are an order that saves zero and a date that assumes everything. `PK2`.
- **The module has already refused to assert a repayment order, in a shipped comment, on this exact ground.** `renderDebts`' sort comment: *"ONLY the cleared/live split is imposed. Sorting the live debts by size or by age would have this app assert a repayment order — largest-first and oldest-first are competing strategies with real advocates — and **nothing on this screen has earned the right to recommend one.**"* §3's table marks the order **available**; availability was never the question, and permission was decided against it before this request arrived. `PK1`.
- **The derived-figures block header is the rule a projection breaks first.** *"EVERYTHING IN THIS BLOCK IS TRUE AS OF NOW. No date argument, no getRange, no period."* Every figure this module produces is a stock. A payoff date is not a stock.
- **The card is full and its surfaces are closed.** Five controls; three mutually exclusive gated helper lines; `.debt-rate` closed at one sentence; `.debt-totals` closed at three; four tiles.
- **The Debts screen is three blocks** — `#debtTotalsCard`, the add-form `<details>`, `#debtList`. There is no fourth container.
- **`debtAnnualCostRate`'s comment names a payoff planner as a beneficiary of its purity.** That is a sentence in a shipped file anticipating the item this ruling refuses. `PN1`.
- **`debtSettled(d)` already answers §4(d) in both directions.**

---

## Executive Decision

**Yes. This application is fit for release, and I am opening no release gate — eleventh round running.** **On the request itself the answer is no, and it is the first complete no this module has produced: the saving is dropped permanently, the projection is the assumed repayment pattern by another name, and the ordering was refused by the module's own shipped comment before this request existed — so build-sequence item 2 has no admissible content left and the item ends here.** The proposal was right to put its central finding first and stopped one step short of the fact that decides the whole thing: on records whose totals are fixed at agreement, **avalanche saves exactly as much as snowball, which is nothing** — so the plan's order is a recommendation with no monetary consequence, and its date is a forecast about conduct the application has never observed. What is owed today is not a feature but a correction: `product-strategy.md` asks, in its own build sequence, for a figure this architecture has permanently forbidden, and that sentence will outlive this report unless it is corrected where it lives. **What to do about item 2 — drop it, reduce it, or re-sequence the language layer above it — is the owner's product decision and I am not taking it.**

---

## Rulings on the Five Questions in §5

### Q1 — is "save this much" dropped, redefined, or does its absence sink the item?

**Dropped. Permanently. It is not redefined, and its absence is not what sinks the item — §5.2 sinks the item independently, and I want that separation on the record so the two refusals are not read as one.**

**Why not redefined, and this closes the branch by arithmetic rather than by taste.** The redefinition anybody would reach for is *"the saving is what avalanche saves you over snowball."* **That is also zero.** Every ordering pays the same total, because every total is fixed at agreement. So the word has no second referent available on this record, and a redefinition would have to reach outside the record — at which point it is the time-attributable cost model refused at the early-settlement `Q1` on three independent grounds, and reaffirmed at `SAV-01`. **No market fact can change them, because they are about what the application can verify and not about what lenders do.**

**There is a fourth answer and it is the one the proposal was reaching for at `DR4`.** The saving is dropped **and the vocabulary reserved for it is discharged rather than inherited.** `DR4` refused "saved" on three grounds. **The third ground evaporates today. The first two do not, and they were each sufficient when I wrote them.** So: **"saved", "saving", "you saved" and every synonym asserting the user is better off remain off limits permanently on every debt surface, now on two grounds instead of three, and the reservation is spent rather than transferred.** No future request may argue that the reservation lapsed and therefore the word is free. `PK4`.

### Q2 — user-stated pattern, or the prohibition by another name?

**It is the prohibition by another name. I am saying so as plainly as I was asked to: the request ends here, and the strategy's item 2 needs rewriting rather than building.**

Four grounds, any one sufficient.

**First, one stated parameter does not make a model stated.** The user states a scalar. To reach a date the application must additionally assume: that the amount is paid every month, on time, uninterrupted; an allocation rule across several debts, which the **application** supplies; that a partial early payment reduces what is owed, which is **false on this record and is the very fact that makes the saving zero**; and that the lender accepts it, which is `ER10`. **A schedule assembled by the application from one number the user said is an assumed repayment pattern.** `FR3` read from the other end: not naming a model's parameter does not make the model absent; naming one of its parameters does not make the model stated.

**Second, the fee narrowing is five clauses and this satisfies one of them.** What was permitted was *"a rate the user states, consumed by a form-time calculator that fills an existing field, stores nothing, shows its working, and can be overridden by typing."* Here there is **no existing field to fill**, **nothing to override**, the storing is in question, and the working cannot be shown — **because the working is the prohibited pattern itself.** `FEE-04`'s line is safe precisely because it names inputs the user holds and an output checkable against a lender's paper. A payoff date appears in no document anybody holds. **A caveat can name an assumption; it cannot stand in for a model.** `PK3`.

**Third, the module has no forecasts and its own header says so.** The rate was admitted because it is a property of a contract already signed; `settledOn` because it is a dated fact about an event that already happened; `agreed − paid` because both quantities are stored. **A payoff date is the first object ever proposed here whose truth depends on conduct that has not occurred.**

**Fourth, and it is the practical one.** A projected date is wrong in the reassuring direction by default — every real interruption pushes it later, nothing pulls it earlier — shown to a user under financial stress, on the one screen that exists to stop them being told comforting things.

**What I am not saying.** I am not saying the arithmetic is hard; it is trivial. I am saying the application would be asserting a future, and it does not have one to assert.

### Q3 — the home, and whether a new screen is admissible

**No new screen. Not for this and not for anything derived from an existing module's record — and I am ruling it as a standing constraint rather than leaving it moot.**

`project.md` lists modules **by destination**, and records why: *"Reports was listed here and was never built… the entry described an intention rather than a module."* **A destination is earned by being a module — something with its own record, reachable by name.** A payoff plan is a view over `db.debts`. Mechanically it is a `<section>`, a More-sheet entry, a `navigate()` destination, a renderer, and every hard-coded screen list in the file — the class `WORK-02` was approved to close after it had already drifted once.

**And the proposal is right that it does not fit on the Debts screen**, which is exactly why a screen looked like the answer. **A feature that fits nowhere on a screen that has been deliberately closed three times is a feature the screen has already answered.**

**Pre-ruled, constraint only:** if `PD1` ever fires, its home is the Debts screen, not a new screen, not inside any of the four closed surfaces, and not a second door from the Dashboard.

### Q4 — form-time input or a stored preference?

**Neither, because nothing ships. The stored preference is refused permanently and by name; the form-time shape is pre-ruled as the only admissible one if the world ever changes.**

The `SET-01` narrowing was granted on the specific ground that **no derivation could substitute for the settlement fact.** That ground does not apply. Beyond that: a capacity is not a fact about a record, it is a **standing intention about the future**, and it would be the first thing in `db` that is neither money that moved nor a term that was agreed. It goes stale silently. And decisively, **a stored monthly amount is the assumed repayment pattern, persisted**: `FR1` refused a stored rate because it makes the application's total a standing claim about a contract it has never seen; a stored capacity makes the application's date a standing claim about conduct it has never observed.

### Q5 — settled debts

**Confirmed, and it costs nothing because it is already built.** Any plan, now or ever, excludes a debt for which `debtSettled(d)` is true; the predicate is called and the settled fact is never re-tested at the call site.

---

## §6 — What the proposal is not asking for

**Accepted in full, every clause onto the off-limits list.** Not an amortisation schedule, not an effective rate, not APR, not a time-attributable cost, not a second rate on any card, no change to any derivation or write path, not a fifth tile, not a projection stated as a promise about what a lender will accept — and `Q2` rules that **no wording rescues it**, because the problem is the claim and not its confidence. **Clarification, fourth outing: a disclaimer in a proposal binds the proposal, not the future.**

---

## Approved Improvements

**One item. XS. It is not a feature and it is owed whichever way the owner decides item 2's fate.**

| Item ID | Title | Reason for approval |
|---|---|---|
| **PAY-01** | Record, where it will be read, that a saving from faster repayment does not exist on this record | Two halves, one commit, on the `ES-01` and `FEE-01` precedent: **a claim that decided something outlives the report that corrected it.** **(a)** `knowledge\product-strategy.md`'s build sequence item 2 gains a stated limit: that *"save this much"* is not computable on a record whose `totalToRepay` is fixed at agreement and reduced by nothing; that the model which would compute it is off limits by ruling; that avalanche and snowball differ by zero tugrik on such a record; and that a payoff date needs a **recorded repayment schedule**, which is a standing deferral nothing has fired. **Conditions, all binding.** It **states the limit and does not re-sequence the file**: whether item 2 is dropped, reduced or overtaken is the owner's decision and this edit must not take it, must not delete the item, and must not promote item 3. It **states the rule and names no tally**. It **does not announce a feature**. It **does not overcorrect into a market absolute** and **adds no row to the Unverified Market Assumptions table**, because this is an architectural fact about the record and not an assumption about the market. **(b)** One comment in the Debts module stating the rule: **the agreed total is fixed at agreement and nothing in this application reduces it, so paying faster does not reduce what is owed and no saving is derivable here.** It goes above `debtOutstanding`, where the cheap wrong fix would be attempted. **If, on opening the block, the rule is found already stated by `ES-01`'s comment, it is NOT duplicated: one statement of a rule, never two.** In the same commit, `debtAnnualCostRate`'s sentence naming a payoff planner is **re-read** and corrected only if it now reads as a promise. **No code changes. No figure changes. No string on any screen changes. No harness fixture is owed.** XS. |

**There is no second approved item and the absence is the ruling.**

---

## Rejected Improvements

| Item ID | Title | Reason |
|---|---|---|
| **PR1** | "Save this much" in any presentation on any surface | **Permanently.** Zero by construction; non-zero only under the model refused twice. **No market fact fires it.** |
| **PR2** | A projected payoff date from a user-stated monthly amount | Per Q2. **The request ends here.** |
| **PR3** | The same projection computed from recorded payment history | **Pre-rejected as the obvious next proposal and strictly worse** — application-inferred, the side of the line the fee narrowing left closed. |
| **PR4** | A single-debt "what if I paid ₮X a month" calculator on the `FEE` shape | **Pre-rejected so the smallest version cannot arrive next week.** `FEE-02` fills a field the user then owns; this keeps a claim about a future on screen with no document to check it against. |
| **PR5** | Any avalanche/snowball ordering asserted, recommended or displayed | Already refused in `renderDebts`' sort comment, **and now additionally because the choice changes nothing the user pays.** |
| **PR6** | Any projection over multiple debt records | **This application does not project.** |
| **PR7** | A caveat or working line used to license a projection | Here the working line **is** the prohibited pattern. |
| **PR8** | A stored monthly capacity or any stored payment intention | **The `SET-01` narrowing is not a precedent and is not widened.** |
| **PR9** | A new screen for this or any view over an existing record | Per Q3. |
| **PR10** | Amortising `totalToRepay`, or any per-period recalculation | Carried. **Named again because an item that cannot produce a saving invites somebody to manufacture one at the source.** |
| **PR11** | Any figure stating what a lender would accept on accelerated repayment | `ER10` carried. |
| **PR12** | A fifth tile, a fourth totals sentence, a fourth gated card line, a plan chip, a Dashboard tile | Carried. **All four surfaces stay closed.** |
| **PR13** | Any fixture for work that does not exist | Nothing ships, so nothing is asserted. |
| **Rewriting the build sequence or promoting the language layer** | — | **Not mine.** The architect rules shapes; the owner rules product and sequence. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **`PD1`** | A payoff **date** — and only the date | **Trigger: the day this application records a repayment schedule** — the standing deferral, intact, which nothing here fires. On that day a payoff date stops being an assumption about conduct and becomes arithmetic over a record. **Fences, binding:** computed over a **recorded** schedule and never a stated capacity; states a date and **never a saving**; **does not recommend an order**; not a new screen; never reaches a period-filtered surface; **arrives as its own scoped design request.** Explicitly: **a `settledOn` date is not a schedule**, a recorded payment is not a schedule, and **no market fact and no owner statement about lenders can fire this** — only a change in what the application records. |
| **The saving** | — | **Not deferred. Rejected permanently at `PR1`.** Listed so nobody carries it on a table where a trigger could later be attached. |
| **Carried** | Every standing deferral | **Unchanged, every trigger intact, none fired.** |

---

## Conflict Rulings

### PK1 — §3's "an order — Yes, available" against `renderDebts`' own sort comment

**Ruling: the order is not available. It was refused, in writing, in the shipped file, before this request existed.** §3's table answers a question about **data**; the question was about **permission**. **Fifth time a proposal about this module has found the right rule and enumerated its coverage short, and the first time the missing entry was a rule against the proposal itself.**

### PK2 — the order saves nothing, and §2 stopped one step early

**Ruling: on fixed-total records every ordering pays the same total, so avalanche and snowball differ by exactly zero tugrik.** §2 establishes that paying **more** saves nothing; this establishes that paying in the **right order** saves nothing. **Together they empty the item.** **The ranking half of the payoff plan has no monetary content on this record at all.**

### PK3 — §4(a)'s user-stated argument against the fee narrowing's clauses

**Ruling: the narrowing is five clauses and this satisfies one.** **A narrowing is read by all of its clauses, not by its headline** — and the headline was never "the user said it", it was "the user said the whole of it and can check the answer against paper in their hand."

### PK4 — `DR4`'s reservation against a figure that cannot exist

**Ruling: the reservation is discharged as spent, not transferred.** And a correction to my own `SAV-01` strategy item 3: **vocabulary is reserved against a ruled item, not a named one.** Item 2 was named in a strategy file and never scoped, so the reservation was made against a shape nobody had examined — and the shape turned out not to exist. **Reserve a word only once the item's shape is ruled.** Third time in five rulings I have pre-ruled something larger than the object that arrived, and the first time the object arrived at zero.

### PK5 — §7's "the language layer moves up"

**Ruling: correct as an observation, and it is the owner's decision and not mine.** I rule that item 2 has no admissible content. **I do not rule that item 3 is therefore next.** An item vacating a slot does not promote the item behind it; a person does.

### PK6 — §6's disclaimer list against the future

**Ruling: accepted for this request; it binds this request and not the next one.**

### PK7 — §7's "this one is the opposite shape"

**Ruling: §7 was right that this request was scoped larger and wrong about which direction that would resolve in.** The paste control was removed; the settle act needed one field; `SAV-01` was a second label; **and this one, scoped at a screen, an input and a projection, ships nothing at all.** The pattern is not that proposals over-scope. It is that **this module holds two numbers and a span, which is almost enough for a model, and every request finds a genuinely good reason to build one.** Fifth refusal, same reason, and it will not stop.

---

## Rulings on What the Proposal Did Not Ask

**PN1 — `debtAnnualCostRate`'s comment names a payoff planner.** Re-read in `PAY-01`'s commit, corrected only if it reads as a promise.

**PN2 — this ruling fires no performance trigger.** Round 16 recorded that the ledger walk *"becomes real when the payoff plan iterates scenarios."* **It does not. The pre-ruled one-`Map` fix stays unscheduled.**

**PN3 — the mission's third step is now unmet.** *Record what is owed, show what it costs, show the way out as a plan with a date on it.* Steps one and two ship. **Step three has no admissible shape on this record.** Not a finding; it is the thing the owner most needs to read.

**PN4 — the permanently-free list names an unbuilt item whose sentence is unbuildable.** `project.md` met this class once and fixed it by moving *Reports* to Long-term Vision. **Whether "the payoff plan" stays on a pricing commitment is the owner's call.**

**PN5 — a refused plan does not return in miniature.** Not a chip, not a card sentence, not a tile, not a bell item, not a Settings paragraph.

**PN6 — no fixture is owed and none is approved.** Nothing renders, so there is nothing to redden.

---

## Development Order

| Order | Item | Why here |
|---|---|---|
| — | **The owner's decision on build-sequence item 2** | **This ruling reaches into the owner's own file.** They asked for a payoff plan and are being told its saving cannot exist, its ordering saves nothing, and its date is a forecast this application may not make. **They are entitled to hear that before a word of their strategy file is edited.** |
| 1 | **PAY-01** | **Owed whichever way they decide.** One knowledge file, one comment, no code. |

**Not scheduled: `PD1` and every carried deferral.** `npm test` after, expect 0. **Nothing renders, so the debts harness is not owed at any width. No `sw.js` bump.**

---

## Architecture Strategy — next quarter

**What changes.**

1. **This application does not project, and that is now the rule rather than an accident.** It states what was agreed, what was paid, what the user said, and what those imply **as of now**. **A figure whose truth depends on conduct that has not happened is not a derived figure; it is a forecast, and there are none here.**
2. **One stated parameter does not make a model stated.** **A narrowing is read by all its clauses.**
3. **A word is reserved against a ruled item, not a named one.** **Refuse a word on its own grounds, or do not refuse it.**
4. **A new screen belongs to a module with a record, not to a view over one.**
5. **A build-sequence item that asks for an impossible figure is corrected where it lives.**

**Off limits — five additions:** any projection of a future payment, date or balance, from any input, on any surface; any repayment ordering asserted or recommended by the application, including avalanche and snowball by name; a stored preference about what a user intends to pay; a new screen for a view over an existing module's record; and "save this much" or any figure of money not spent because of faster repayment.

**Risks recorded, not scheduled.**

- **Mine, and the largest.** The mission's third step — *show the way out, as a plan with a date on it* — is refused in the only shape proposed and has no other. **The application can now tell a user exactly what they owe and exactly what it costs, and nothing at all about when it ends.**
- **Mine, and the cheapest thing on this list to act on.** The one fact that would turn a payoff date from an assumption into arithmetic is a **recorded repayment schedule**. **It is also the trigger for the effective rate.** One fact, two ruled items, both currently unreachable.
- **Mine, from `PK2`.** The strategy's permanently-free list names the payoff plan as a commitment. After this ruling that entry names something with no admissible content.
- **Mine, from `PK7`.** Five consecutive debt requests have produced a genuinely good reason to add a model, and this is the fifth refusal.
- **Carried and unchanged.** "Cost so far" still overstates an early settlement. A backup restored by an older build loses `settledOn`. No archive. `totalToRepay` has no edit trail. Every string is a literal. Six bell write sites. The add form stands at ten controls and the action row at five.

---

## Final Recommendation

**Put this ruling to the owner with one question, take `PAY-01` when they have answered, and write not a line of anything else: *do you want this application to record what a user has agreed to pay and when — a repayment schedule — because that single fact is the only thing standing between this roadmap and a payoff date, and it is the same fact the effective rate has been waiting on for six rounds?*** Tell them plainly what they are being told: they asked for *pay this much more, finish this much sooner, save this much*, and the answer is that **the saving is zero on a record whose total is fixed at agreement, the ordering is zero for the same reason, and the date is a forecast about conduct the application has never observed and a lender it has never met.** **The sentence I want carried out of this ruling is the one that decided Q1 and Q2 together: this module can say what a loan cost, because that was agreed; it can say what was paid, because that happened; it can say a debt is finished, because the user said so — and it cannot say when the borrowing ends, because that has not happened yet, and every shape offered for saying it anyway would have told a frightened user a comforting number that nobody, including the application, could check.**

*(Design-request ruling, 2026-09-18. Item `PAY-01`; rejections `PR1`–`PR13`; deferral `PD1`; collisions `PK1`–`PK7`; unasked questions `PN1`–`PN6`; `DR4`'s reservation discharged. Source: `D:\3_Claude\PowerApps\reports\design-request-payoff-plan.md`. No code was modified and no knowledge file was modified.)*
