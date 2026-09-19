# Design request — the payoff date

**For the Chief Architect.** This fires `PD1`, and `PD1`'s own row says how: *"its trigger is the day this application records a repayment schedule… Approval is not recording."*

**The trigger is verified at source, not taken from a report.** `SCH-02` is on `main` at `a7b6edf`, `SCH-01` at `897e444`, both pushed, and the live `index.html` at v19 is byte-identical to the repository's. The application records a schedule today. `reports/HANDOFF.md` carries the dated entry.

**One thing before anything else.** Your own closing sentence on the schedule ruling was that if `PD1` does not follow, *"this is storage bought for nothing."* I am not going to use that as an argument for approving anything here, and I want it said out loud that I noticed the temptation. **If the only home available for this figure is one of the closed surfaces, the right answer is still no, and the storage was still bought for nothing.** That outcome has to stay available to you or this request is a formality.

---

## 1. What fires, and what does not

| | |
|---|---|
| **Fires** | `PD1` — a payoff date, and only the date. |
| **Also fireable today, and NOT in this request** | `SCD2`, reminders from the schedule, whose trigger is the same commit. Its own scoped request. |
| **Also fireable today, and NOT in this request** | The effective rate. Its own scoped request, and see §4(c), which is the one place it could arrive by accident. |
| **Not fired by anything here** | Every other standing deferral. |

---

## 2. The figure, exactly

`firstDue` plus `count − 1` monthly steps, through `stepDate`'s `'monthly'` branch with `anchorDay` set from `firstDue`.

That last part is not decoration. `stepDate`'s monthly branch moves to the first of the next month and then clamps the anchor day to that month's length, and its comment records why: `setMonth()` overflows, so 31 January plus one month is 3 March, and a series anchored on the 31st silently relocated itself to the 3rd of every month permanently. **A schedule whose first payment falls on the 31st is an ordinary contract, and computing its last date with anything other than `stepDate` reproduces a bug this repository has already paid for once.**

**What the figure is:** the day the last payment the user agreed to falls due.

**What it is not, and this is the whole ground of the request:** it is not a forecast. It states nothing about what the user will do, nothing about what the lender will accept, and nothing about money. It is arithmetic over two numbers the user typed off their own contract — the same ground that carried the schedule itself, which your ruling put as *"a term of a contract the user is holding in their hand."*

**`SCR9` says a last instalment date is a payoff date with a different label.** I read that as settling the naming and not as an objection: both labels name this figure, both are `PD1`'s, and neither can be used to slip it in under the other. I am asking for it under the name `PD1` gave it.

---

## 3. The thing I most want ruled: there is nowhere on the card to put it

This is the request's real problem, it is the one you declined to pre-rule, and I would rather open with it than bury it at §4.

**Every surface on the debt card is closed, and I checked each one at source rather than from memory:**

| Surface | State | Closed by |
|---|---|---|
| The rate sentence, `.debt-rate` | One sentence, permanently | Its own hoisted comment: *"a card that grows a sentence per review round is a card nobody reads"* |
| The gated ask line, `.debt-rate.ask` | Spoken for — it asks for the due date | `PD1`'s own row: *"how a card asks for two things without growing a second sentence is `PD1`'s question"* |
| `.debt-meta` pills | Four, and a fifth is refused | `SCR10`, with `DR2`: a figure that needs a sentence does not land in a pill |
| The gated foot lines | Three, and **at most one renders in any reachable state** | `SAV-01`'s invariant — and it is not a convention, `tools/harness/debts.js:1804` throws if a card ever renders two |
| The four summary tiles | Four, closed | `SCR10` |
| `.debt-totals` | Three sentences, closed | `SCR10` |
| The action row | Five controls, under a standing scope question | `SCR11` |
| A new screen, modal, sheet or `editCtx.kind` | Refused | `SCR12`, `PR9` |

**So a payoff date has no vacant position, and I am not proposing to create one.** The shapes I can see, with what each costs:

**(a) It displaces the due chip when a schedule exists.** Cheapest-looking, and I think it is the worst. `dueDate` is a term of the contract the user typed; replacing it with a computed date hides a stated fact behind a derived one, which is `SCR15`'s shape with a new subject.

**(b) It becomes a fifth `.debt-meta` pill.** Refused at `SCR10` and I am not re-raising it. Listed so the rejection is on the record against this item rather than against the last one.

**(c) It spends the gated ask line, conditionally.** The ask line renders only when there is a cost and no due date. A payoff date exists only when there is a schedule. **Those two states can overlap** — a debt with a schedule and no due date — so this is not a clean swap, and the card would have to choose between asking for something and telling the user something.

**(d) It lands inside the edit modal, beside the three fields that produced it.** No card surface is touched, the invariant is untouched, and the figure appears exactly where the user typed its inputs. **Its cost is that it is invisible to anyone not editing the debt**, which means `SCN7` — a user cannot tell which debts carry a schedule — is answered with "still nothing", and the feature's only visible consequence lives behind ✎.

**(e) Nothing renders, and `PD1` is refused on its merits.** Then `SCH-01` and `SCH-02` are storage bought for nothing, which is a real outcome and stays available.

**I lean to (d) and I hold it weakly.** It is the only one that touches no closed surface, and it makes the smallest claim on the card, but it answers the discoverability question by declining to.

---

## 4. Six things I cannot settle

**(a) The two dates can disagree, and nothing refuses it.** `SCH-02` deliberately does not cross-check `firstDue` against `dueDate` — *"a refusal that protects nothing costs a legitimate record"* — and nothing checks the last instalment against `dueDate` either. So a debt can hold a `dueDate` of 2027-01-01 and a schedule whose last payment falls in June 2027, and **if both render, the card states two different end dates and explains neither.** Three shapes: refuse the combination at save time; render only one; or render both and accept that the user is looking at their own contract. **Refusing it now would also be a rule change to a shipped write path**, which is its own cost.

**(b) Does a payoff date make `dueDate` redundant?** I do not think so — `dueDate` is when the whole thing is due by, and the last instalment is when the last payment falls. On an ordinary contract they are the same day and the disagreement in (a) never appears. But somebody will propose dropping one, and the reason not to should be on the record.

**(c) The one place the effective rate could arrive by accident.** `debtTermDays(d)` measures `date` to `dueDate`, and it feeds the shipped rate line. **A schedule is a second, better source of a term**, and wiring it in would silently re-term a figure that is already on users' screens and already ruled — changing a live number with no line in any commit message that says so. **I am not proposing it. I want it named and refused here**, because it is a two-line change that looks like a tidy-up.

**(d) Settled debts.** `debtSettled(d)` is the gate, and your schedule ruling already says every future reader of the schedule checks it first. I read that as: a settled debt shows no payoff date, and the schedule is not deleted or blanked (`SCR15`). Confirming rather than asking.

**(e) The shape-defensive reader.** `PD1`'s row requires it, with the failure direction **"no schedule"**, because `debtProblem` has never run over records arriving through `loadFromCloud` (`WORK-13`). So the reader re-checks the three fields itself and returns `null` on anything it does not like, rather than trusting the validator. I want the ruling to say whether that is a new function or a clause inside its one caller — **a function with exactly one reader is the shape `SCH-01`(3) refused as dead code**, and I do not want to guess which side of that line this falls on.

**(f) Discoverability, which is `PD1`'s to answer and which shape (d) does not answer.** `SCN7` records it as a risk and says **it is not to be fixed by a chip**. If the answer is (d), the honest ruling is that the discoverability question is answered "no, and deliberately" — and I would rather that be written down than left looking like an oversight for the next round to find.

---

## 5. What I am asking for

1. **Rule §3** — where this figure lands, or that it lands nowhere. **(e) is a real answer and I am not arguing against it.**
2. **Rule §4(a)** — the disagreement between `dueDate` and the last instalment: refused, reconciled, or shown.
3. **Rule §4(c)** — confirm the shipped rate's term is untouched, by name, so it is refused rather than merely not proposed.
4. **Rule §4(e)** — the reader's shape, against `SCH-01`(3)'s no-dead-code rule.
5. **Rule §4(f)** — whether discoverability is answered here or deliberately left unanswered.
6. **Confirm §4(b)** and **§4(d)**.

## 6. What I am not asking for

Not a saving — `PR1`, permanent, and a schedule does not make one computable because the agreed total is still fixed at agreement. Not an ordering. Not a projection over multiple records, not a total payoff date across all debts, not a countdown, not a progress figure against the schedule (`SCR6`), not an instalment ledger (`SCR5`), not a reminder (`SCD2`, its own request), not an effective rate, not a new screen or modal or sheet, not a fifth tile, not a sixth control, not a change to `debtOutstanding`, `debtPaid`, `debtInterestPaid`, `debtSettled`, `debtAnnualCostRate`, `debtTermDays` or any write path, and no new stored field — **this figure is computed and never saved.**

---

## 7. One thing on the record

**The honest value of this figure is modest and I would rather say so than oversell it.** A user who typed `count` and `firstDue` can work out the last date themselves; the application is saving them the arithmetic and the calendar-clamping, not telling them something they could not know.

**What it does have is the mission's own payload.** The product exists because people in this market lose track of when the loop ends, and "the last one falls on this day" is the single sentence that says it does end. That is the argument for landing it somewhere a user will see it, and it is exactly the argument that would justify spending a closed surface — **which is why I have put it last, after the rejections, rather than first.**
