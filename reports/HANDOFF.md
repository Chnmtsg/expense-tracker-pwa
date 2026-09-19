# Handoff — state of the work

Written across the sessions that ran review rounds 7 through 13 and implemented
them. Read `reports/chief-architect.md` first: it is the standing decision and
it outranks this file. It now carries four sections — the round-9 ruling and the
Round 11, 12 and 13 supplementals — and **all four are in force**. This file
covers what that report does not: where the work stopped, how to run the checks,
and the mistakes that cost the most time.

---

## Start here if you are picking this up

**Round 16 shipped the true-cost decoder. Tree clean, `npm test` green, exit
0: debts harness 23/23 at 320px, contrast 528 pairs across 16 themes.** No
release gate is open and none has been for five rounds; the build is fit to
ship. Round 15 before it is merged in full.

### Round 16 — read this before touching the Debts module

**`reports/chief-architect.md` is the Round 16 ruling. The Round 15 ruling is
preserved verbatim at `reports/archive-chief-architect-round15.md` and the
standing record it sits on is at `reports/archive-chief-architect-round14.md`
— ALL OF IT REMAINS IN FORCE.** The Round 15 UI, Code and EM reports are
archived under the same `-round15` suffix. Archive before running `/review`.

**WORK- NUMBERS RESTART EACH ROUND.** Round 16's `WORK-15` is the rate
function; Round 15's `WORK-15` is something else entirely, and the Round 16 EM
report flags the collision. Always say which round.

**What shipped: ALL THIRTEEN approved Round 16 items, plus the whole paste
feature.** Round 16 raised seventeen; thirteen were approved, one was rejected
outright (`WORK-17`, moot once option A was ruled), and three are deferred with
triggers. **Every approved item is now on `main`, one commit each**, plus one
repair to a harness assertion that `WORK-08` had quietly disarmed.

**`PASTE-01` … `PASTE-04` were built and then REMOVED**, in that order, on the
same day. The ruling at `reports/chief-architect-paste-a-loan.md` and its design
request stay where they are — a ruling is not unmade by a product decision that
followed it — and the code is recoverable from git. The reason is recorded in
the removal commit and it is the architect's own K4 risk note firing: that
feature rested on the assumption that TYPING is why debts go unrecorded, the
ruling said nothing in the repository established it, and the owner has since
said the real barrier is different.

**Then `FEE-01` … `FEE-04`, the monthly-rate calculator**, ruled at
`reports/chief-architect-fee-calculator.md` with its request beside it. **Read
that ruling before touching the add-debt form.** It NARROWS a permanent
off-limits entry — the Round 11 ban on "an interest-rate / APR field, or an
amortisation schedule" — by exactly one shape:

> **Permitted:** a rate the USER STATES, consumed by a form-time calculator
> that fills an existing field, stores nothing, shows its working, and can be
> overridden by typing.
>
> **Still off limits, reaffirmed:** a rate the application INFERS; a STORED
> rate field; an amortisation schedule; an assumed repayment pattern; an
> effective/IRR rate; a second rate on a debt card; and APR anywhere in the
> interface.

The premise that entry rested on — "the lender states both of these" — was an
empirical claim about Mongolian lenders, and the owner corrected it. That
correction is a row in `product-strategy.md`'s Unverified Market Assumptions
table, which is that table working exactly as designed, twice in one day and in
opposite directions.

Two conventions in the calculator came from the owner and are not this
repository's to change without asking again: **simple interest on the original
amount**, and **whole months with any remaining days counting as one more**.
Both are printed on screen in the working line for that reason.

**The `FEE-` and `PASTE-` namespaces are their own.** `FEE-02` is not a `WORK-`
item and must never be renumbered into one.

**One thing the ruling recorded as surviving rather than solved.** The total is
computed once at entry; the due date stays editable afterwards; the rate is
deliberately not stored, so nothing can recompute it. That drift already
existed for a hand-typed total — moving a due date does not renegotiate a loan
— and **the pre-ruled answer if it ever bites is an edit trail, not a stored
rate field.** There is deliberately no calculator in the edit modal.

### Owner decisions, dated, because rulings hang on them

**2026-09-18 — early settlement: YES.** Asked whether they want to be able to
mark a debt finished on the day they settled it, recording that date and
nothing else, so the application stops reporting the difference as owed — the
single question the early-settlement ruling ended on. **The answer was yes.**

That answer is `ED1`'s trigger and it has fired. The scoped request is at
`reports/design-request-settle-a-debt.md`. `ED2` — the saving, which is
`agreed − paid` and needs no model because the early-settlement fee is inside
it — is triggered by `ED1` shipping and does not travel in its commit.

**Why this is recorded here and not only in a report.** The owner declined this
shape once, reasonably, believing the alternative worked; the ruling then
established that the set they chose from was empty. A later reader finding a
reversed product decision deserves to know it was reversed on new information
rather than on a whim.

**2026-09-18 — a repayment schedule: YES.** Asked whether they want the
application to record what a user has agreed to pay and when — the question
the payoff-plan ruling ended on. **The answer was yes.**

That fires the scheduled-repayments deferral, which has stood since before the
decoder and which **two ruled items are waiting on**: `PD1`, a payoff date, and
the effective rate. Neither is in the request; both would arrive as their own
scoped requests afterwards. The request is at
`reports/design-request-repayment-schedule.md`.

**2026-09-18 — the schedule is recorded, and `PD1` and the effective rate are
now fireable.** `SCH-01` (the validator) and `SCH-02` (the act) are on `main`,
ruled to ship together. The debt record now carries an optional
`{instalment, count, firstDue}` the user states, refused unless all three are
present, the count is at least two, the first payment is not before the
borrow date, and `instalment × count` lands within one instalment of the
agreed total.

**Nothing on any screen displays it.** No card line, no chip, no tile, no bell
item; nothing marks an instalment paid and nothing says behind or missed. Until
`PD1` follows, a user sees exactly what they saw before. That was the ruling's
intent and it is recorded here so the next reader does not go looking for the
feature on the Debts screen.

What it unlocks, each as its own scoped request: **`PD1`**, a payoff date, and
**the effective rate**, which was refused at the decoder because it is only
true under a schedule the application did not record — and now does.

**2026-09-19 — the payoff date ships, and it is visible only inside ✎.** `PD1`
is discharged as `PDT-01`. Opening a debt's edit modal and typing a count and a
first due date now produces one line — *"The last of these falls on
2027-01-01."* — recomputed as the user types.

**This is not a gate and the owner is not being asked again**, because they
answered on 2026-09-18 and what landed is *smaller* than what they were told to
expect. It is a sentence they are owed, and the architect made it a condition of
the commit. Three parts, all plainly true:

- **The card gets nothing.** No chip, no line, no tile, no bell item. A payoff
  date reaches no surface outside the edit modal.
- **A user still cannot tell, from the Debts screen, which of their debts carry
  a schedule.** That is now `PDD1` — a deferral with an observation trigger —
  rather than a silence, and **it is not to be fixed by a chip.** Every shape
  available on that card today is refused by name, which is why no shape is
  pre-ruled: the observation has to describe the need first.
- **The line is feedback, not a refusal.** It shows a wrong date; it does not
  stop one. A user who does not read it stores exactly what they would have
  stored before.

**Why it was approved at all, which is not the reason the request gave.**
`firstDue` is the one part of a stored debt record that no refusal and no
validator checks — the save branch guards the instalment and the count through
the sum rule, and `debtProblem` tests shape only. `SCD2` will ring a bell off
that date and the effective rate will term a percentage off it. **Stating what
the user just typed implies, while the lender's paper is still in their hand, is
the cheapest check available and the only one that costs no surface.**

**2026-09-19 — the effective rate ships, and the card's rate sentence now says
a different thing on a debt that carries a schedule.** Round 16's deferral is
discharged as `EFF-01` and `EFF-02`. Three plain things, and they are a
condition of the commit rather than a gate, because the owner answered this on
2026-09-18 and `product-strategy.md` — their document — lists "the true rate"
on the permanently-free side of the line:

- **A debt whose record states a schedule reads** *"Costs you as much as a loan
  charging 82% a year on what you still owe."* **instead of** *"Costs you 36% of
  what you borrowed, each year."* The two are alternatives and never a pair;
  exactly one renders in every state, which the harness counts rather than
  assumes.
- **The figure is not what the lender charges, and the sentence says so in
  words.** Mongolian non-bank lenders quote simple interest on the original
  amount regardless of what is left, so the sentence states an *equivalence* —
  *as much as a loan charging* — and never a charge. It may not say APR,
  interest rate, effective, true rate, real rate or actual rate; the last four
  would retroactively call the flat sentence a lie, and the flat sentence is
  true and is on every card carrying no schedule.
- **A user still cannot tell, from the Debts screen, which of their debts carry
  a schedule.** `PDD1` is unmoved and is **not** discharged by this. The rate
  sentence is the first card-visible consequence of a schedule, but that is
  incidental: it appears only where a due date and a cost already exist, it
  never names the schedule, and a user with no schedule learns nothing about why
  another card reads differently.

**The model is the architect's and not the request's, corrected twice, both
times in the understating direction.** Equal monthly periods ignore when the
money actually arrived relative to the first payment — fifteen points on an
ordinary record. Cash flows of `instalment × count` drop up to a whole
instalment of the agreed total — twenty-four points on a three-payment
schedule. Both were removed by making the model smaller: the payment dates the
schedule already implies, in days from the borrow date, summing to exactly the
total the record already holds.

**The published decoder table is corroboration and not expectation.** It was
computed under twelve equal months; this application measures days, so every
row lands above it — 65.5 → 65.9, 81.2 → 81.7, 153.3 → 155.9, 400.3 → 411.0.
The short rows move furthest because annualising a quarter-year figure
amplifies a small difference in timing. The fixtures assert the band and the
direction, and prove the figure by discounting the stated cash flows back to
the amount borrowed rather than by writing a number down.

**2026-09-19 — the first request in this module that came from USING the
application rather than from reading it.** The owner, adding a debt: *"If I add
the debt it asked insert pay back money it's required thing."* They hit the
required total on a form that promises, two fields above it, *"Fills in the
total below"* — and the input that keeps that promise is labelled optional,
sits two labels **below** the field it fills, and produced no message at all
when it was missing. **Every function did what it was ruled to do. The defect
was the seam between two correct pieces, and eight review rounds did not find
it because a reviewer reads the file in the order it is written and a user
meets it in the order the form is filled.**

**What shipped is one sentence, in `#debtRateWorking`, in the state that used
to render nothing:** *"Add the date this has to be repaid by, and the rate
above will fill in the total."* It renders only when a rate and an amount
borrowed are both present and the due-by field is empty — **the gate is what
makes the promise in the sentence true**, because in that state the due date is
provably the only thing missing.

**What did NOT change, and each was refused by name:** the total is still
required; the due-by field is still labelled **(optional)** and gains no
asterisk, because it is genuinely optional for the record and a label cannot
carry both facts; **no field on the add form moved**; and nothing says a word
about the amount borrowed, an unparseable rate or a due date that is not after
the borrow date — **naming every reason the calculator declined is the form
that nags.**

**THIS OBSERVATION FIRES NO STANDING DEFERRAL, and that is recorded here
because "an owner observation exists" is the sentence most likely to be quoted
at the ones it does not describe.** `FD2` (a lender stating a flat fee) — **not
fired**, nothing about a fee. `SCD1` (a schedule on the add form) — **not
fired**, nothing about a schedule; and note that the cost this observation
found on that form was **order and labelling, not height**, which is the
objection `SCD1`'s pre-ruled answer is aimed at. `PDD1` (which debts carry a
schedule) — **not fired**, it is an observation and it is not that one. `EFD1`
(a guard on `firstDue`) — **not fired**. `FD1` (an edit trail on
`totalToRepay`) — **not fired**. Stage 2 — **not fired**, nothing here is a
calculation defect. **A trigger stated as an observation is discharged only by
an observation that describes the thing the trigger names.**

**One thing to put to the owner when there is a natural moment, and it is not a
gate.** Their sentence reads two ways: *"I could not fill the required total"*,
or *"why is the total required at all"*. **The line answers both** — it tells
them how to have the total filled for them — which is why no ruling waited on
the answer. But if they meant the second, the standing answer is that the two
amounts **are** the record and every figure this module shows is derived from
them, and that is not reopened.

**One condition of this item is a rule with no observable behaviour, and it is
recorded rather than claimed as tested.** The gate computes first and asks only
on the compute's `null`. The ask requires an empty due-by field and the compute
requires a usable one, so the two can never both hold and **reordering them
changes nothing a test can see today** — verified by perturbation, which stayed
green. It is in the code as a rule for the day a fourth input is added, and the
comment says so. The other two perturbations do redden: dropping the
amount-borrowed condition, and leaving the family advice up.

**2026-09-19 — the two questions Round 17 ended on, answered by the owner.** The
Chief Architect recorded them as cheap and load-bearing, and both were put to
the owner the day the ruling landed.

**Q: was the owner on an installed PWA or a browser tab with an address bar?**
**A: installed to the home screen.** So there is no address bar and the content
area is the architect's 700px, not UI-01's 601px. **`UI-01`'s High is weakened
at its own premise**: on the report's other measured numbers — 384px spent
before the list, a 294px first card — the first debt card already fits whole
with roughly 22px to spare, and after the approved density work with roughly
80px. `WORK-02`'s assertion now settles it as a measurement rather than as
arithmetic, which is why it was built regardless.

**Q: did "too much text at the top" mean the grey paragraph or the four
tiles?** **A: both, equally.** **This is the half of `WORK-03`'s trigger that
fired, and it fired against the shape.** The architect wrote: *"If it was the
tiles, every shape proposed for this item is aimed at the wrong half of the
card."* It was both — so the pre-ruled fallback, which discloses one prose
sentence and recovers ~34px, answers half of a complaint whose other half is
the four `.debt-total` tiles and the `h3` above them, and no report examined
those at all. **`WORK-03`'s pre-ruled shape is therefore no longer a remedy for
the complaint as the owner states it.** It is not cancelled — it is waiting on
a scoped request that looks at the whole `#debtTotalsCard`, tiles included,
which is a surface `SCR10` closes at four tiles and which nothing in Round 17
was scoped to review.

**What did NOT change on these answers.** The four approved commits are
untouched: they address the card, not the block above it, and neither answer
bears on them. `C36`'s co-visibility ruling stands whatever the tiles turn out
to need — it is general, it is not Debts-specific, and the sentence it protects
is protected for the same reason either way.

**2026-09-19 — Round 17's density work, and the measurement that refutes both
reports' arithmetic.** `WORK-04`, `WORK-05`, `WORK-06` and the narrowed
`WORK-08`/`WORK-09` are on `main`. `WORK-11` follows. **`WORK-02`'s geometry
flow is written, was run, and is HELD BACK from the suite because it is red —
and it is red after the approved work, not before it.**

**What the instrument measured, on the five-record fixture, in the 820px frame:**

| Width | First card top | First card height | Slack to the nav |
|---|---|---|---|
| 320 | 562 | 363 | **−174** |
| 360 | 502 | 313 | **−64** |
| 390 | 485 | 284 | **−18** |

**Every figure in this table contradicts something that was estimated.** UI
Review put the first card's top at ~468 and the card at 294; the architect
derived 384px of content above the list and concluded the first card fits whole
in 700px with 22px to spare. **Measured, the block above the list is 485px at
390 — 101px more than the derivation — and the card does not fit at any
supported width.** The architect refused to act on UI-01's High until the
instrument reported, which was right; the instrument reports that **UI-01's
finding is correct and its arithmetic was not.**

**And the approved work saves 8px per card, not the ~36px the ruling
projected.** The decomposition: the head margin, the rate margin and the chip
margin each drop 12→8 (−12 total), and the new pre-foot `--s4` adds 4 back.
`WORK-05` saves nothing on height — `.debt-head` is sized by the lender's name
and the paid-of line, not by the percentage beside them, so dropping the figure
from 22px to 18px corrects the card's hierarchy and changes none of its height.
`WORK-04` saves 22px on the two cards that had nothing to draw, which is why the
height spread went **up**, 64→76, exactly as the ruling's second recorded risk
predicted.

**So the guarantee — one whole debt card reachable without scrolling — is not
achievable by any change to the card.** At 390 the card would have to lose 18px
more; at 320 it would have to lose 174. **The dominant term is the 485px above
the list, which is `#debtTotalsCard` plus the disclosure, and Round 17 deferred
that block.** `WORK-03`'s trigger is now fired twice over: by this measurement,
and by the owner answering that "too much text at the top" meant the tiles as
well as the prose.

**The flow is not deleted and not weakened.** It is held in the session
scratchpad, verbatim, to be committed the day it passes — because a geometry
assertion that is committed red teaches the suite to be ignored, and a
geometry assertion weakened until it passes is the diagnostic-mistaken-for-a-
guard that this whole round exists to stop. **What lands with it, unchanged:
the relationship and never a literal, the 390 width added to the `test` chain
in the same commit, and every other figure it gathers labelled diagnostic.**

**2026-09-19 — what sits above the list: ruled and built, and half of "both,
equally" closes unfixed.** `ABL-01`, `ABL-02` and `ABL-03` are on `main`.

1. **The design request was ruled without a review round, and none was owed.**
   The three-report contract governs review rounds, not scoped requests; the
   ten design-request rulings are the precedent.
2. **§3 refused permanently.** The proposal was to move the "Cost so far" tile
   behind a control together with its own disclosure. **`showCost` is the
   AGGREGATE**, so that sentence is the one-site disclosure for the tile **and
   for every per-card "Cost so far" chip** — four of five cards carry one — and
   moving one of the five figures would have left four unqualified statements of
   this application's own even-allocation arithmetic with their qualification
   behind a gesture. **`C36` gains a travel test: a disclosure may travel behind
   a control only if EVERY figure it qualifies travels with it, in every
   reachable state — necessary, never sufficient.** The second-disclosure
   off-limits entry stands unnarrowed.
3. **§4(a) approved as `.sr-only`, not as deletion** — this is the Debts
   screen's only heading and the Dashboard already recorded what removing the
   last heading below `<h1>` costs. **§4(c) approved** with the comment repaired
   in the commit that falsified it. **§4(b) refused**: a merge keeping all three
   facts saves connectives, not lines. `ABD3` is the door back and it requires a
   drafted sentence and a measurement together.
4. **The geometry guarantee is a 390 statement in the 820px fixture. 320 and
   360 are diagnostic permanently**, because at 320 the deficit exceeds
   everything removable above the list. The ladder terminated at its first
   rung — 390 is green with 30px — so §4(d) did not fire and the whole-card
   sentence is what landed. **There is no third attempt.**
5. **Round 17's unscoped Architecture Strategy sentence about the geometry
   guard is read as scoped from today.**
6. **Round-16 `WORK-10` is CLOSED AS VERIFIED WITH NO WORK.** The existing 320
   diagnostic read one line box before `ABL-02` and one after, so the
   eight-figure total was never wrapping mid-number. Its pre-ruled single-column
   stack is not needed and is not built. It does not remain deferred.
7. **Half of "both, equally" closes unfixed.** The five lines of grey prose
   above the list are **unchanged** — §3 and §4(b) both refused. The tile half
   got a heading out of the flow and four figures one step down. `ABD2` carries
   the tile half with an owner-shown-the-render trigger; `ABD3` carries the
   prose half.
8. **Recorded, not scheduled:** the `.sr-only` heading is invisible markup and
   the comment is the whole of its defence; the 390 guard has 30px of slack by
   construction, so the next true sentence added to this screen reddens it and
   that is the guard working; **320 keeps no geometry guarantee at all** on a
   mobile-first application, and the honest answer there is the list itself —
   grouping or collapse — not another thirty pixels above it; and Savings Goals
   still has no probe anywhere in `tools\harness\`, one round older.

**The measured arc of the two rounds, at 390, first card top and card height:**
485/292 before anything → 485/284 after the card work → 449/284 after the
heading → **437/284, +30px of slack**, which is the first time a whole debt
card has fitted above the navigation in this fixture.

**2026-09-19 — the list gets an order, and the finished debts fold away.**
`ORD-01` and `ORD-02` are on `main`. `ORD-03` was pre-ruled and **did not
fire**.

**The owner asked for both and stated why for one of them:** *"clear the small
ones first… finishing one proves the loop can be broken."* That is the snowball
method, and it arrived against a refusal written into `renderDebts`' own sort
comment.

1. **The order is approved and the shipped refusal is replaced, not stepped
   over.** The comment refused a size ordering because *"nothing on this screen
   has earned the right to recommend one"*. What settled it is that **there is
   no recommendation to make**: no figure on this screen depends on the order,
   and `PAY-01` established that on this record every ordering pays the same
   total. What was left was a presentation default, and that belongs to the
   owner. **The ruling explicitly does not endorse the snowball method and may
   not be quoted as though it did** — it is approved because the application
   *cannot be wrong about money* by ordering this way.
2. **The key is `debtOutstanding` and never the agreed total.** The agreed total
   is frozen at agreement, so an order on it would be fixed for the life of the
   record; what is left re-forms around the user's own progress. **The sort key
   is computed once per debt, so it performs fewer ledger walks than the sort it
   replaced.**
3. **The application says nothing about a repayment order anywhere** — no word,
   no badge, no number, no icon — and a harness assertion keeps that true.
4. **The old order flow would have stayed green either way**, because its two
   live records happened to be entered in ascending order. Verified after the
   sort changed: it did not redden. Its false assertion is dropped, its header
   repaired, and the new rule is guarded on a fixture where entry order and size
   order are exact reverses **and** the largest agreed total has the smallest
   amount left.
5. **The second-disclosure off-limits entry is narrowed by exactly one shape:**
   one `<details class="more-fields">` at the foot of `#debtList`, finished
   debts only, closed on every render, absent when nothing is finished, summary
   `Cleared (N)` and nothing more. **A third disclosure on this screen stays off
   limits**, as does any disclosure containing a derived figure, a disclosure
   sentence, a rate sentence, a tile, a field, a control or a live debt.
6. **`C36` is not engaged**, and the reason carries: `C36` is violated by hiding
   a **disclosure**, never by hiding a **figure**.
7. **The group keys on `debtSettled`**, tenth site of that claim. A debt settled
   early for less than agreed folds away with the rest, because the word on its
   card says it is over.
8. **The tiles still count the folded debts**, correctly, and **nothing explains
   that** — the block above is closed and no fourth sentence is permitted to
   reopen it. It is the ruling's largest recorded risk.
9. **`ORD-03` did not fire.** The demotion flow measures a control that now sits
   inside a closed `<details>`; the harness's own record said this might not
   bite in this Chrome, and measured rather than derived, it stayed green
   untouched.
10. **The geometry guard gained room rather than losing it:** slack at 390 went
    from +30px to **+94px**, because the fixture's one finished card folded.

**2026-09-18 — the payoff plan is refused entirely**, and what happens to
build-sequence item 2 is still open. The saving is zero on a record whose total
is fixed at agreement, avalanche and snowball differ by zero tugrik for the same
reason, and a date was a forecast about conduct the application has never
observed. The limit is recorded beside item 2 in `product-strategy.md` and takes
no sequencing decision.

**2026-09-18 — the fee is a monthly percentage**, simple interest on the
original amount, whole months with part-months charged in full. Shipped as
FEE-01…04. Not this repository's to change without asking again.

**2026-09-18 — the paste control is removed.** The barrier is not typing.

---

**There is no code item outstanding.** What is left is evidence, and none of it
can be closed by reading the repository:

| Open | What closes it |
|---|---|
| **`D1` — image OCR** | An observed lender message a user genuinely cannot paste: a photographed paper contract, or an app that blocks copying. Record the date and what was seen, here. If it fires, **on-device is the only permitted shape** — cloud vision is rejected permanently, and "on-device cannot read Mongolian Cyrillic well enough" means the image path does not ship, not that it escalates to a backend. |
| **`D2` — the chooser** | An observation that real lender messages routinely carry three or more amounts. Record the count and the message **shape, never the text** — that text is the user's private document. Until then the honest "cannot tell which are the loan" line is the answer. |
| **`WORK-10`** | A width probe at 320px with an eight-figure `totalBorrowed`, recording the measured tile width and whether the wrap lands inside a digit group. A break re-opens it as scoped work; the fix is pre-ruled (single-column `.debt-totals` below ~360px, `fmtCompact` off the table). No break closes it as verified. |
| **`WORK-11`** | A user losing data or abandoning a correction through the delete-only payment history, **or** the same gap being taken up for goal contributions. Pre-ruled shape: one shared correction sheet covering both ledgers, never two. |
| **`WORK-09` (round 15 numbering)** | Five minutes on a physical iPhone at 390px — whether Safari draws a disclosure indicator on the range-preset pill. Carried from round 15 and still open. |
| **The paste control at 320px** | Whether the nested disclosure reads as a sub-section of the form or as a second card. Geometry is clean and measured — 0px card overflow, no sideways scroll at 320, 360 and 390 — but "reads as" is not a measurement. The fallback is pre-ruled: drop the inner `<details>` and render the control as plain markup at the top of the card, no further architect input needed. |

**One piece of real code work is named and unscheduled:** the application-file
ARCH-01 pass. One stale in-file coordinate survives at `:1117`, in a module
Round 16 did not review. `WORK-12` deliberately did not sweep it — that pass
gets its own scoped commit rather than riding a Debts change. A grep for
in-file coordinates returns exactly that one.

**The next substantive feature is the payoff plan**, item 2 of
`knowledge/product-strategy.md`'s build sequence, which builds directly on
`debtAnnualCostRate` and was the reason that function was required to be pure
over one debt record. It needs its own design request and its own ruling.

**One sentence carries the whole ruling:** this application may tell a user
what their loan costs, and may not tell them what it would have cost under a
repayment schedule it has never seen. If anyone reworks `.debt-rate`'s wording
into "the interest rate", the figure becomes the understatement the feature
exists to expose, and the ruling that approved it becomes wrong. The harness
flow asserting the wording is there for exactly that.

### The older immediate task

**Round 15's roadmap is COMPLETE except for two items that cannot be closed by
writing code.** `reports/chief-architect.md` holds the Round 15 ruling;
**the Round 14 supplemental — itself the top of the previous standing record,
carrying round 9 and the Round 11, 12, 13 and 14 supplementals — is preserved
verbatim at `reports/archive-chief-architect-round14.md` and ALL OF IT REMAINS
IN FORCE.** The review workflow overwrites `reports/*.md` on every run, so
archive before running one.

Round 15 redesigned the four core tab screens and then closed 16 of the 18
`WORK-` items it raised. What is left:

| Open item | What it needs | Why nobody can close it by editing |
|---|---|---|
| **WORK-09** | Five minutes on a physical iPhone | Whether Safari draws a disclosure indicator on the range-preset pill cannot be determined from source: no `appearance` is declared for `select` anywhere, so the chrome is the UA's. Open the app in iOS Safari at 390px and look at the first control on Home, Income, Expenses and Analytics. Record device, iOS version, date and whether an indicator is drawn, in this file. An indicator drawn closes it as verified; none drawn reopens it as scoped work — `appearance: none` plus an explicit chevron, keeping the native `<select>`. Implementing that speculatively was explicitly rejected: it would replace native select chrome on every platform to remove an unmeasured risk on one. |
| **WORK-18** | The next deploy | Nothing in this repository can say which cache key is live — `deploy.yml` is `workflow_dispatch` only, so a deploy leaves no trace in the tree, and the history reads by round rather than by deploy. That is the finding, and it stands. It is answerable from GitHub, though, and was answered (below), so the deploy question is settled and only the recording habit is outstanding. At the next deploy, write the cache string and the date into the deploy log below. |

**The next task is either of those, or the hosting work — still the only thing
standing between this app and a phone.**

### Deploy log — what is actually live

| Cache key | Published | From | How this was established |
|---|---|---|---|
| `expense-tracker-v14` | 2026-08-14 06:11 UTC | `2b081b2` | `gh run list --workflow=deploy.yml` — one successful run, ever — and `git rev-list -1 --before=<that timestamp> main` to find the commit it shipped, then reading `sw.js` at it. |
| `expense-tracker-v15` | 2026-08-27 09:23 UTC | `bfd2e14` | Run 33058338708, `workflow_dispatch`, success in 30s. Verified by fetching the live `sw.js` (reads v15) and the live `index.html` (carries `data-dash-chart`, `amount-lead`, `ic-repeat`, `sr-only`, `tint-icon` — none of which existed in v14). |
| `expense-tracker-v16` | 2026-09-18 08:46 UTC | `74dabbb` | Run 35326015258, `workflow_dispatch`, success in 33s. Verified by fetching the live `sw.js` (reads v16) and the live `index.html`, which carries `debt-rate`, `debtAnnualCostRate`, `debtTermDays`, `debtPasteText`, `debt-pct-label`, `debtAddFields`, "Costs you" and "Clear it" — none of which existed in v15. **This deploy DID bump the key, and the previous one did not, under the same rule.** v15 was live and v15 was staged, so the key did not differ from what was live; `sw.js`'s `activate` deletes every cache whose key `!== CACHE`, so publishing unchanged would have left every installed user's service worker serving the v15 cache and none of this round. Read the header as "the key must differ from what is live" and it points both ways, which is the whole reason it is phrased that way. |
| `expense-tracker-v17` | 2026-09-18 12:13 UTC | `9460b6e` | Run 35343517351, `workflow_dispatch`, success. Carries the fee calculator (FEE-01…04), the settle act (SET-01…03) and ES-01. Verified by fetching the live `sw.js` (reads v17) and the live `index.html`, which carries `data-debt-settle`, `debtSettled`, `settledOn`, `feeComputeTotal`, `debtRateWorking`, "Mark settled" and "Finished on" — none of which existed in v16. **Bumped, and the previous deploy bumped too, for the same reason and by the same reading:** v16 was live and v16 was staged, so the key did not differ from what is live. Read the rule as "the key must differ from what is live" and it decides every case — it forbade a bump at v15, required one at v16 and required one here. |
| `expense-tracker-v18` | 2026-09-18 13:22 UTC | `4ac09de` | Run 35349742696, `workflow_dispatch`, success. Carries `SAV-01` only; everything before it went out as v17. Verified by fetching the live `sw.js` (reads v18) and the live `index.html`, which carries `settledShort`, "less than the agreed total" and "marked this settled" — none of which existed in v17. **Third consecutive bump, and the four rows together now show the rule deciding rather than a habit forming:** at v15 the staged key already differed from the live one and publishing WAS the bump; at v16, v17 and v18 they were equal, and publishing unchanged would have left installed service workers on the old cache. |
| `expense-tracker-v19` | 2026-09-19 — | `66ba62e` | Run 35406023536, `workflow_dispatch`, success; both jobs green. Carries `PAY-01`, `SCH-01` and `SCH-02`. **The first deploy in this log that changes nothing a user can see** — the schedule is stored and no screen displays it, so the usual "carries a string that did not exist before" check was run against the source rather than the interface: the live `index.html` is byte-identical to the repository's (`md5 555eb152a3c5cadd4642df01fa626cfe`), and carries `mSchedInstalment` and "has an invalid repayment schedule", neither of which existed in v18. Live `sw.js` reads v19. **Fourth consecutive bump, on the same reading:** v18 was live and v18 was staged, checked by fetching the deployed `sw.js` before touching the file rather than inferred from the last deploy's outcome — the error this row exists to prevent. |
| `expense-tracker-v20` | 2026-09-19 — | `2c84480` | Run 35411886925, `workflow_dispatch`, success; both jobs green. Carries `PDT-01`, `EFF-01` and `EFF-02` — the whole of the payoff date and the effective rate — on top of the `PAY-01`/`SCH-01`/`SCH-02` batch that went out unseen at v19. **The first deploy since v18 that changes what a user sees**, so the usual check applies again and was run both ways: the live `index.html` is byte-identical to the repository's (`md5 f0aff3f8f41879e501c909d87a16c14e`) and carries `debtEffectiveAnnualRate`, `DEBT_RATE_SOLVE_DAILY_MAX`, `mSchedPayoff`, *"as much as a loan charging"* and *"The last of these falls on"* — none of which existed in v19. Live `sw.js` reads v20. **Fifth consecutive bump, on the same reading:** v19 was live and v19 was staged, checked by fetching the deployed `sw.js` before touching the file. `gh run watch` died mid-poll on a dropped TCP connection; the run was re-read by `gh run view` rather than assumed finished, which is the only reason that is worth a sentence — **a watch that fails is not a deploy that failed, and neither is it a deploy that succeeded.** |
| `expense-tracker-v21` | 2026-09-19 — | `cffa395` | Run 35421193663, `workflow_dispatch`, success; both jobs green. Carries the whole of Round 17's approved work and the above-the-list ruling — `WORK-04`, `WORK-05`, `WORK-06`, `WORK-11`, `ABL-01`, `ABL-02`, `ABL-03` — plus `RD-01`, which had not deployed. Verified both ways: the live `index.html` is byte-identical to the repository's (`md5 6926a6bd1f7a458a04c599d1c72a5ae0`) and carries `h3 class="sr-only">All borrowing`, `.debt-total-value` at `var(--t-h3)`, `const hasBar = pct > 0` and the `--s4` pre-foot gap, none of which existed in v20. Live `sw.js` reads v21. **Sixth consecutive bump, on the same reading:** v20 was live and v20 was staged, checked by fetching the deployed `sw.js` before touching the file. **This is the first deploy whose user-visible change was decided by a measurement rather than by a screenshot** — the geometry flow reports the first debt card's bottom edge above the navigation at 390 with 30px of slack, where the same fixture measured −26 before any of this work. |
| `expense-tracker-v22` | 2026-09-19 — | `6b53b1b` | Run 35423683233, `workflow_dispatch`, success; both jobs green. Carries `ORD-01` and `ORD-02` — the list ordered by what is still owed, and the finished debts folded into one disclosure at its foot. Verified both ways: the live `index.html` is byte-identical to the repository's (`md5 f95bc1434e7d9cb2cd53cc5dc7e19e0b`) and carries `id="debtDoneGroup"`, `const orderKeys = new Map`, `ka.left - kb.left` and the `Cleared (N)` summary, none of which existed in v21. Live `sw.js` reads v22. **Seventh consecutive bump, on the same reading:** v21 was live and v21 was staged, checked by fetching the deployed `sw.js` before touching the file. **Two deploys in one day, both on measurements:** v21 closed the geometry guarantee at 390 with 30px of slack and this one takes it to 94px, because the fixture's finished card folded away — the first time a change to this screen has made the guard's margin grow rather than shrink. |

**v15 was published without a further bump, and that was correct.**
`deploy.yml`'s header says to bump before publishing, which would have been
wrong here: v14 was live and v15 was already staged, so publishing WAS the one
bump this deploy was entitled to. Going to v16 would have been two bumps for
one deploy — the over-bump `sw.js`'s rule exists to prevent — and would have
left the record naming a v15 that never existed anywhere. Read the header as
"the key must differ from what is live", not "increment it now".

**PUSHING TO `main` DOES NOT PUBLISH.** This cost a round trip: the phone was
showing v14 and the natural reading was that something had not been pushed.
Everything was pushed; `deploy.yml` is `workflow_dispatch` only, on purpose,
and the live site had been thirteen days and one whole round behind `main`.
`git push` stages a build. Actions → Deploy ships it.

Add a row above at each deploy, before touching the key again. Two commands
reconstruct it if anyone forgets, and they are written out here so nobody has
to work them out twice.

### One rule added this round

`knowledge/coding-standards.md` gained a `## Comments` section (ARCH-01).
Comments in this project are the design record; both reviewers independently
found four claims in one change that asserted more than the code delivered.
State the rule, not the tally. Never write "the only", "all", or a count
unless something enforces it. Reference code by function, selector or id —
never by line number. No tooling was approved for it: a lint pass over English
would cost more than the four claims it would have caught.

Eight `index.html:NNNN` citations remain in `tools/`. They were checked
individually rather than swept — most were already stale before round 15 and
one still resolves — so they are left for whoever next opens those blocks,
which is the mechanism ARCH-01 is meant to be.

| Item | |
|---|---|
| WORK-207, 208, 209, 214, 215, 216 | landed together in one incoming edit |
| WORK-210(a), 211, 212, 221 | the `perf.js` pass and the force-clear comment |
| WORK-217, 218, 219, 220, 222, 223 | Sprint 2 |
| C3 | the `review-conventions.md` band row |
| WORK-210(b), WORK-213 | **deferred**, triggers named |

**Results worth carrying rather than re-deriving:**

- **WORK-212 measured the Analytics screen at 7ms** and the number contradicts
  the argument that asked for it. CODE-03 reasoned `renderDaily` was "the app's
  heaviest repeated full-scan surface" from a pass count of ~120. It is roughly a
  tenth of the All Time Dashboard (67ms), because `renderCalendar` compares date
  strings while `drawMonthlyTrend` runs `parseISO` per record per month. **Pass
  count is not cost.** Nothing fires.
- **WORK-211's C40(b) pair is spent.** With the preset id perturbed, the old
  probe reported a comfortable 2ms for a configuration that never applied and
  exited 0. That green cannot be photographed again.
- **WORK-219 turned out to be six citations, not two.** The two the review found
  were correct when it wrote them; four more went stale during this session's own
  work, and two selectors were cited at two different numbers in one file. See
  C43 — the durable half is *lead with the selector*.

**The two record amendments below arrived LATE and are recorded as such.** The
ruling attached them to specific commits; those commits landed without them
because the items were implemented in one incoming edit rather than in the ruled
order.

1. **WORK-204's completion record was wrong.** It was recorded complete while one
   clause of its approval — the asterisk on the five modal labels — was unshipped.
   The ambiguity was in the approval's wording ("which also gain the mark"), not
   in the implementation. Ruled at C2: the mark meant the paint. Shipped as
   WORK-215.
2. **The WORK-195 note now covers THREE modals, not two.** Round 13 recorded: *"If
   a failed-save probe is ever built for another reason, BOTH history modals get
   an assertion in that commit."* After WORK-216 the reminders sheet carries the
   same property, so the sentence reads: **all three in-place-refreshing modals —
   debt payments, goal contributions and the reminders sheet — get the assertion
   in that commit.**

**Still true and easy to undo by accident:**

- **`perf.js`'s calibration is not a guard.** It shows the two clocks agree and
  neither is frozen; it cannot show either is real time. Under **C44** its figures
  may corroborate a standing deferral but may not fire a trigger, close an item or
  schedule work. WORK-210(b) lands *first* the day anything turns on a number.
- **WORK-186(b) and WORK-141 are CLOSED.** For the first time since round 8 the
  deferred table holds nothing waiting on an observation.
- **Two new conventions, C43 and C44**, are in the Round 14 supplemental.

Sprint 2 landed in the architect's binding order, one commit per item:

| | |
|---|---|
| WORK-199 | the 320px flow checks its fixture rendered before it measures it |
| WORK-197 | the headline interest figure is measured; nothing asserts it |
| WORK-198 | that flow's header describes the flow that is actually there |
| — | *(the containment header stops describing the baseline WORK-191 replaced)* |
| WORK-200 | the orphaning demonstration reddens the assertion it names |
| WORK-201 | flow K expects a figure a reader can check, not a formula |
| WORK-195 | the goal history modal stops presenting a failed delete as committed |
| WORK-196 | that modal stops leaving an editCtx kind nothing handles |
| WORK-194 | the one chip the app cannot vouch for says so |
| WORK-204 | the required-field mark becomes a fact, not a red glyph |
| WORK-205 | an excluded category keeps the control that un-excludes it |

**Three results worth carrying rather than re-deriving:**

- **WORK-197 came back 1.** `E_diag_cost_value_rects` is 1 and the text is
  `₮1,500,000` at 320px in a 288px card — the headline interest figure does
  **not** wrap at seven figures. There is nothing to carry to a UI round, and
  the architect's recorded risk on that point can be read as answered for now.
- **WORK-199 found the flow it repaired was green over nothing.** Deleting the
  note render left `npm run debts` at exit 0. That is measured, not argued.
- **One unlisted item shipped, and it is recorded as unlisted.** WORK-191
  rewrote the determinism baseline in Sprint 1 but left the flow header twenty
  lines above still describing the construction it had replaced — "snapshotted
  twice with nothing in between", which is the defect WORK-191 exists to
  remove. Found while reading for WORK-199, fixed in its own commit.

**The service worker is NOT bumped again, and that is deliberate.** It went to
`expense-tracker-v12` in Sprint 1 and there has been no deploy since, so one
bump still covers everything in round 13. The rule is one bump per deploy, not
one per sprint. **If you deploy after merging, v12 is the correct string; the
next bump belongs to the next deploy.**

**Both screenshot-gated items are now answered too** — `WORK-141` is closed as a
comment on the measurement, and `WORK-186(b)` turns out to need a decision
rather than a fix. See the section below. Everything round 13 approved is in.

### What the last three rounds were actually about

Not features. Guards that could not say no. Three separate instruments were found
green over things they could not see:

| | |
|---|---|
| Round 11 | an assertion tested a *copy* of the import object living inside the probe |
| Round 12 | `npm run debts` had no `--width`, so the 320px condition ran at 749px |
| Round 13 | `npm run verify` returned **0** on a file whose script could not parse |

If you take one thing from this file: **a green command is a claim about an
instrument, not about the application.** Every convention C30–C42 exists because
that claim was wrong at least once.

### Load-bearing and easy to undo by accident

- **A debt is its own collection, never a flag on `db.income`.** Every Dashboard
  total is an unconditional reduce, so a flag would be one forgotten filter from
  the defect the Debts module exists to close. `npm run debts` and the WORK-164
  flows in `npm run v1` are the guards.
- **The Debts screen has no date filter, and its figures never appear on the
  Dashboard.** They are stocks. C38.
- **`data-num-token` is normalised in the containment baseline and deliberately
  NOT in the containment comparison.** It is a tween ticket that advances on
  every render, so the baseline must ignore it — but between the two containment
  snapshots nothing should advance it, which makes it the tripwire for
  `renderDebts` calling `renderDashboard`. Normalising it in both places would
  look tidier and would remove the guard.
- **No HTML comment may go inside a JavaScript template literal.** `lint.mjs` can
  now see them, so a stray backtick fails `verify` instead of shipping a blank
  screen — but the four that existed were moved out in WORK-188 and none should
  come back.

### A line number in a comment is stale the moment anything above it moves

This file and the reports cite `index.html:NNNN` constantly, and it is a useful
habit. It also rots faster than anyone expects, and it rots **silently** —
nothing in `verify` reads a comment.

Worked example, produced in one sitting. Round 13 Sprint 2 wrote
`.goal-meta-item.note at index.html:1502` into a probe header. A later commit in
the SAME sprint inserted a 25-line comment at `:1045`, and every reference below
that point moved by 26 lines. `:1502` then pointed at `.goal-meta`, a different
rule that happens to look plausible. Three references drifted that way. Then the
correction over-shot and moved two that had never drifted at all, because they
sat *above* the insertion — a rule at `:887` does not move when you insert at
`:1045`.

So, two habits:

- **Lead with the selector or the function name; the number is convenience.**
  "`.goal-meta-item.note` at `index.html:1528`" survives the number going stale,
  because the next reader can grep. A bare `:1528` does not.
- **When you correct one, check which side of the edit it was on.** Only
  references BELOW an insertion move, and they all move by the same amount.
  `grep -n` the selector and read the line back before writing the number down —
  every number in the shadow table below was verified that way after being
  wrong twice.

### The two screenshot-gated items — BOTH OBSERVATIONS HAVE NOW BEEN TAKEN

They were recorded for many rounds as needing something no command could
produce. That was not quite right: `run.mjs`'s own iframe technique takes a
screenshot at an exact width, and the header at the bottom of this file
documents how. Both were taken at 390px in Chrome and both are answered.

**WORK-141 — CLOSED as a comment, which is the outcome the standing decision
pre-ruled for this branch.** The engine discards the padding and the border
this rule sets on a native checkbox; the deferred "bordered boxes with 24px of
padding" state does not occur.

    notifEnabled / ShowPlanned / ShowGoals / ShowRecurring
    13x44  padding 0px  border 0px  min-height 44px  appearance auto
    (the <select> beside them, which the rule IS for: 324x46)

The one thing the deferral did not anticipate: **`min-height: 44px` IS
honoured**, so each box is 13 wide and 44 tall. Harmless — 44px is the touch
minimum and the flex `<label>` is the real click target — but recorded above the
`input, select, textarea` rule (`index.html:1071`) so it is not rediscovered.
`width:auto` inline is load-bearing; do not remove it.

**WORK-186(b) — the finding's framing is wrong, and it needs a decision rather
than a fix.** It was raised as "`.debt-card` resolves its shadow from
`--shadow` where its neighbours use `--e1`". Measured in the dark theme, and
confirmed at source:

| | |
|---|---|
| `.card` `:875`, `.kpi` `:887`, `.kpi-mini` `:1019`, `.stat-tile` `:1456` | `var(--e1)` |
| `.goal-card` `:1489` | `var(--shadow)` |
| `.debt-card` `:1604` | `var(--shadow)` |

**The debt card matches the goal card exactly** — the component it was modelled
on, whose chips and buttons WORK-170 and WORK-184(b) deliberately merged with
it. The divergence is between the goal/debt card family and everything else,
it predates the Debts module entirely, and changing `.debt-card` alone to
`--e1` would break the one consistency the last two rounds were spent
establishing. **So the choice is leave both or change both, and changing both
touches the Goals screen — a wider item than the one that was filed.**

Visually it is moot on the evidence: in the dark theme both resolve to
near-black on near-black (`rgba(0,0,0,.4)` vs `rgba(15,23,42,.05)` on a
`rgb(17,24,39)` card) and neither shadow is perceptible in the screenshot.

Screenshots are at `reports/shot-notif-390.png` and
`reports/shot-debts-dark-390.png`, **untracked on purpose** — they are evidence
for a decision, not a repo artifact, and this project records measurements as
prose everywhere else.

**A trap that bit while measuring, worth the two lines.** `body` carries
`transition: background .2s` at `:776`, so a probe that flips `data-theme` and
immediately reads `getComputedStyle(document.body).backgroundColor` gets the
**in-flight** value — it reported the light background on a page that
screenshots dark. `box-shadow` is not in that transition list, so the shadow
figures above are unaffected. Use `--no-transitions`, or read a property that
does not transition, or take the picture.

### Still only the user can unblock

- **Shipping on a phone — iOS or Android — is blocked on ONE thing: an HTTPS
  origin.** Nothing else about it is blocked, and it has been outstanding for
  the life of this project.
  - **iOS needs nothing else.** Safari installs a PWA from the share sheet: no
    Apple Developer account, no Mac, no review, no `assetlinks.json`. The
    packaging inputs are complete. See `expense-pwa/DEPLOY-IOS.md`.
  - **Android needs a Play Console account** on top of hosting, and the
    origin-root `assetlinks.json` trap decides which repo you host from. See
    `expense-pwa/DEPLOY-ANDROID.md`.
  - **The App Store is a separate decision** and is not blocked on anything
    technical here: it needs a Mac (this is a Windows machine), $99/year, and a
    Guideline 4.2 argument about web wrappers. `DEPLOY-IOS.md` §4 states the
    trade; it is an architectural decision and is not started.
- **One iOS question needs one screenshot**, in the shape WORK-141 and
  WORK-186(b) were settled: `apple-mobile-web-app-status-bar-style` is
  deliberately unset because the header already pads with
  `env(safe-area-inset-top)` and whether `black-translucent` renders correctly
  on a notched iPhone is a render question. `DEPLOY-IOS.md` §3 has the two
  outcomes and what each one means.

### The user's live deployment situation, which is not in any report

They have a GitHub repo containing **four files at the repo root** —
`icon.svg`, `index.html`, `manifest.json`, `sw.js` — uploaded by hand. This
project keeps the app in `expense-pwa/`, so the two are not connected and every
update is a manual re-upload.

**Five icon files referenced by `manifest.json` are missing from that repo**
(`icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-512-any.png`,
`icon-maskable.svg`), so "Add to Home screen" will not work there until they are
uploaded. `.github/workflows/deploy.yml` exists here and publishes `expense-pwa/`
to Pages gated on `npm run verify`, but it has never run, because **this repo has
no remote at all**. Connecting them would overwrite their repo's history — their
call, and it has not been made.

`npm run debts` is a probe on the existing runner, not a fifth runner.

**Its acceptance record was reopened in round 12, and here is the honest
version.** Three of the conditions WORK-164 and WORK-165 were closed on were
recorded as met before they were capable of failing:

| Condition | Recorded met | Actually capable of failing since |
|---|---|---|
| A backup round-trips its debts | round 11 | **WORK-172** — the assertion rebuilt the import replacement object inside the probe and asserted against its own copy; deleting a default from the application left it green |
| No horizontal scroll at 320px | round 11 | **WORK-175** — the command carried no `--width`, so it ran at 749px where a 288px card cannot overflow; and once it ran at 320 the fixture still could not overflow, because every word in it was shorter than the card |
| `renderDebts` writes only inside `#debts` | round 11 | **WORK-176** — the flow checked where three elements sat in the markup, which is not a property of the function |

The module itself was correct in all three cases. The guards were not. Work gate
G12 held any new debt capability until those three landed; it is now closed, and
each of the three carries a C40 demonstration in its commit message.

**G12's closing record is amended once, in round 13, and the amendment is not a
reopening.** WORK-176's containment assertion was green having first been red on
the named application perturbation, and that statement stands unchanged.
WORK-176's *second* condition — the determinism baseline — was recorded as met on
a construction that could not fail: it read `innerHTML` twice in a row with
nothing between the reads, which compares a thing with itself.

**The author of the defective condition was the Chief Architect**, not the
implementer. The round-12 condition said, verbatim, *"take the four snapshots
twice with NOTHING between them"*, and the probe was that sentence compiled. That
is why C37 now binds the author of a condition to write the reddening
perturbation *before* publishing it.

The baseline became capable of failing in **WORK-191**, which also closed a hole
neither reviewer named: the containment loop iterates the runtime-computed
`stable` set, so a screen that became non-deterministic would have silently left
coverage while the command stayed green. It now throws and names the screen.

The gate is not reopened. Nothing was held behind it.

**Do not compress this into "the module was approved and verified."** The
distinction between a condition that was met and one that could have failed is
the completion-record failure rounds 5 and 6 were spent recovering from.

**`round-10` is the live branch** — ten commits, tree clean, every command
green. It is the whole of round 9's approved roadmap, in the architect's
binding order:

| | | |
|---|---|---|
| WORK-151 | the two assertions that could not fail | *the work gate* |
| WORK-160 | the rate date, from a fact the app owns | |
| WORK-152 | the instruction names a route that exists | |
| WORK-153 | the help line gated on the render's own predicate | |
| WORK-154 | a stale rate says so | |
| WORK-155 | the disabled-control explanation gets the card's width | |
| WORK-158/159 | the card joins the seam; two comments stop overstating | |
| WORK-157 | a reading that would print `USD 0` prints nothing | |
| WORK-161 | the reading is subordinated by size | |
| WORK-162 | the picker names its currencies | |

**Two items are deliberately not done, and neither is an oversight.**

- **WORK-141** — was blocked on one screenshot of Settings → Notifications at
  390px. Round 9's UI review confirmed from source that the markup agrees with
  the finding, and said correctly that source cannot settle how it *renders*.
  **That screenshot has since been taken and the item is CLOSED as a comment** —
  the engine discards the padding and border on a native checkbox. The figures
  and the one surprise (`min-height` IS honoured) are in the pickup section.
- **WORK-156** — `drawMonthlyTrend`. Deferred since round 5 because its trigger
  is stated in milliseconds and nobody had measured. **The measurement has now
  been taken and the trigger DOES NOT FIRE.** See "The measurement, taken at
  last" below. The deferral holds — now on evidence rather than on the absence
  of it.

**WORK-163 was rejected as not-work** and should not be revived on its own.

### The measurement, taken at last

`tools/harness/perf.js`, run by hand through the existing runner:

    node tools/harness/run.mjs tools/harness/perf.js

**It is NOT one of the five commands and must not be added to them.** It is a
measurement, not a gate, and it has no npm script on purpose — a sixth entry in
a runbook that WORK-206 just corrected to say five would make a measurement look
like a check. It asserts nothing about its own figures for the same reason: the
trigger is "above 100ms", and a probe that threw on that would turn a decision
to schedule work into a red build.

**The calibration is the part to read first, and it is weaker than this file
once claimed.** The probe spends a known 50ms in a busy loop and checks it can
see it, and it reported 49-50ms — but `busyFor` terminates on `Date.now()` while
`timeIt` measures with `performance.now()`, and **both are frame clocks.**
`--virtual-time-budget` is a property of the frame's time domain, not of one API,
so if that domain runs at *k* virtual milliseconds per real millisecond the loop
exits after 50/*k* real ms and the measurement still reads ~50 — for every value
of *k*.

So the calibration establishes that the two clocks agree and that neither is
frozen. **It does not establish that either is real time**, which is what the
figures below would need. Under C44 they may corroborate a deferral that already
stands; they may not fire a trigger, close an item or schedule work.

| Measured | Trigger | Fires? |
|---|---|---|
| `renderDashboard()` on **This Month**, 5,000 records — **2ms** (2,3,2,2,2) | above 100ms | **No**, by a factor of 50 |
| `renderDebts()`, 200 debts + 5,000 payments — **41ms** (42,41,42,41,41) | above 100ms | **No** |
| *(context)* `renderDashboard()` on **All Time**, same store, 36 month columns — **62ms** | not the trigger config | — |

**Both deferrals hold** — and they held before this measurement existed, which
is the point C4 turned on. A trigger needs evidence to **fire**; it needs nothing
to stay unfired. WORK-156 and the WORK-202 risk were never discharged or narrowed
by these figures, so even if the numbers are dilated the deferrals are unmoved.
The figures corroborate them. They do not carry them.

*(This paragraph previously ended "neither is now resting on nobody having
looked." That claimed the instrument had checked itself, and it had compared a
clock against a clock in the same domain. Corrected under WORK-210(a).)*

**One observation for whoever rules next, which is theirs and not mine to
act on.** The trigger names the **This Month** configuration, on the stated
ground that it is "the configuration in which this cost is not escapable". That
is true per scan — narrowing the filter does not stop each month scanning the
whole store — but the filter also shrinks the *month list*, which is the
multiplier. So This Month builds **one** column and costs 2ms, while All Time
builds 36 and costs 62ms. **The trigger is aimed at the cheapest configuration
and the expensive one is excluded from it**, which means as written it is
unlikely ever to fire. The number that would actually cross 100ms first is All
Time at roughly 3x this store — about 15,000 records. Recorded here rather than
acted on: the trigger is the architect's and re-aiming it is a ruling, not an
implementation.

**Next:** merge `round-10`, then a review round on it. Or the Android work,
still blocked on two decisions only you can make — an HTTPS origin to host
from, and a Play Console account. See `expense-pwa/DEPLOY-ANDROID.md`; the two
traps recorded there (assetlinks.json must be served from the **origin root**,
and with Play App Signing the fingerprint is Google's, not your local
keystore's) are the ones that cost days if met live.

---

## Where things stand

Eight review rounds have run. Rounds 4 through 8 are **fully implemented and
merged to `main`.** One commit per approved item, each message carrying its own
evidence and its own red-then-green demonstration where one applies.

Rounds 5 and 6 found no Critical and no High. **Round 7 found one High**, and
it was damage from round 6: WORK-99 moved the error *reporting* above
`let db = load()` and left the *recovery* below it, so after a boot-time throw
"Restore from file" opened a picker and did nothing. The probe added in the
same round to guard that state asserted the button was **visible** rather than
**functional**, so it passed.

### Gate R8: closed on one item, and the other was measured out

**R8 opened with WORK-128 and WORK-129. WORK-128 landed. WORK-129 was removed
from the gate when the measurement its close depended on was taken** and
returned no overflow at any width from 240 to 430 in Chrome on the corrected
harness; the approved declaration was then applied and produced identical
figures at every width. The residual WebKit exposure is a recorded risk with a
trigger, not a delivered item.

That wording is deliberate and must not be compressed into "both landed". A
gate record that reports a dropped item as a delivered one is the
completion-record failure rounds 5 and 6 were spent recovering from.

- **WORK-128** — "due" is forward-looking for a recurring series.
  `nextPlannedDue` returned the anchor however old for a series never logged,
  so a plan anchored months back held an undismissable urgent badge, fired a
  daily OS notification, printed four past dates under "Next:", and offered a
  button that wrote one actual expense per tap. Its two assertions were red
  against fixture F3 before a line changed. All four range totals unchanged.
- **WORK-130(a)** — the binding precondition, in. The width-mode frame no
  longer reserves a scrollbar gutter, and a width-mode probe must now report
  `viewport_clientWidth` or the runner fails.
- **WORK-129** — not landed. See "A derived claim is measured before it gates"
  below, and the risk table.

### Gate R7: `load()` is now total

Its two items are on `main`. `load()` returns a valid parsed database or the
defaults for any bytes in the store, and every failure routes through
quarantine and the true banner — one corruption outcome, not two.

**The catch discards `d`, and that line is load-bearing.** `d` is assigned from
`parsed` before the code that throws, so without the reset it stays truthy, the
defaults are never substituted, and the app boots on a half-built database with
`categories` as a string. Measured: with the reset removed, init completes, the
banner shows, Restore is reachable, and `categoryOptions()` throws
`db.categories.map is not a function`. Every assertion the old probe had would
have passed.

**The build is releasable.** Everything still open was deferred by the
architect with an explicit trigger, not left undone:

| Deferred | Trigger that reopens it |
|---|---|
| **WORK-129 (WebKit residual)** — a risk, not an item | `.grid-2`'s tracks may floor on a form control's intrinsic width in a non-Blink engine. Unmeasured and unmeasurable here. **Trigger, deliberately cheap: any OBSERVATION of horizontal scroll on the Salary screen on iOS Safari — one report, one screenshot, one borrowed device.** If it fires the fix is **pre-ruled and needs no architect round**: `.grid-2 > * { min-width: 0; }` at `index.html:863`, XS, with the observation recorded as the derivation and the observing engine named. What is deferred is landing it, not deciding it |
| ~~WORK-97(b)~~ — **SETTLED**, no longer deferred | Measured once WORK-114 unblocked it. The padding-zero variant fails both stated conditions: it does not clear a 44px track at 360px (42.7), and it pushes `.cal-nav` and `.cal-legend` flush to the card edge at every width. **The overlap is accepted and the derivation is recorded in the `.cal-grid` comment**, along with the fact that 320px cannot supply the 320px of grid seven 44px cells need, at any padding. Do not reopen without a new argument |
| WORK-85 + WORK-35 | any behavioural change to either reorder path (extraction first), or a real keyboard/switch user blocked |
| WORK-16 / WORK-49 | a measured render >100ms on a mid-range device on Dashboard or Analytics, **or** a real store >5,000 actual records. Code Review has now declined to re-raise this twice without a measurement |
| WORK-15 (Cloud Sync) | precondition, restated as conditions rather than ids: cloud data must go through the same validation and migration as local data — `loadFromCloud()` assigns `db` directly today — and a sync failure must be visible |
| WORK-17 IndexedDB half | a real blob approaching 2 MB |
| WORK-23 screen half | the modal half landing and users still reporting disorientation on Back |
| Stage 2 (test harness) | the first *calculation* defect a unit test would have caught. Unfired for the sixth round running. `npm run recurrence` now answers the strongest argument against this deferral — that no command would surface such a defect — which **strengthens** it |

Rejected with no trigger — these return only on an observed user harm, not a
reviewer's projection: WORK-58/88 (auto dark theme), the `.btn-block` refactor,
deleting `fbApp`, and both mechanical sweeps (72 font sizes, 69 spacings, now
declined four times).

Shapes rejected inside approved items, worth not re-proposing: the `z-index`
route for the hero highlight (measured below AA); flagging salary fields on
`input` rather than Save (toasts mid-keystroke); a deny-list in
`check-escaping.mjs` (one live site, already safe); **moving the `#importFile`
listener above `load()`** (its body reaches `ISO_DATE_RE`, `writeDb`, the
dialogs and four render functions — it converts a silent no-op into a throw);
**a console recorder in `boot-crash.js`** (it would watch the outer window,
where nothing happens); and **a fourth icon-grid breakpoint** (2.4px across a
12px band, on a rule whose existing breakpoints were justified by figures that
were never true).

---

## How to check your work

**Five commands after every commit, not four.** `npm run debts` was added in
round 11 and this block still listed four until round 13 — and it is the only one
that runs at a phone width.

```
npm run verify       # the four static predicates, must exit 0
npm run v1           # write flows, the ≈ reading, and the corrupt-boot walk
npm run boot         # a boot-time throw must still reach a working Restore
npm run recurrence   # fixture totals, the 31st clamp, and no past due date
npm run debts        # the Debts module's conditions — runs at --width 320

# Width-mode guard — run at each width; not a package script because it takes
# one viewport per invocation. Asserted band is 320-430.
node tools/harness/run.mjs tools/harness/salary-width.js --width 320
```

**What `verify` covers, and what it did not until round 13.** It can now fail on
a parse error anywhere in the shipped script. Before WORK-187 it could not:
`lint.mjs` blanked every HTML comment in the file *before* working out where the
`<script>` block started, so a comment written inside a JavaScript template
literal was erased before ESLint saw it. A backtick in one of those four regions
ended the template literal, the top-level script stopped parsing, and
`npm run verify` returned **0** over a completely dead application. `npm run boot`
was what caught it.

So: a green `verify` was never on its own evidence that the app starts, and until
round 13 it could not have been. It is now — but run all five anyway, because
each of the other four covers something `verify` still cannot see.

`npm run v1` now carries WORK-143's four display-currency assertions as well as
the original write flows: the `≈` reading equals the ₮ figure times the cached
rate, no cached rate means no reading at either site, switching currency leaves
the stored blob **byte-identical**, and no recorded amount or row ever leaves
whole tugrik. Eleven flows; all four were demonstrated red by breaking the
application, not the expectation.

`verify` runs `lint` → `check:escaping` → `check:contrast` → `check:saves`.
Each exists because someone asserted a class was closed and was wrong.

**The ceiling is four plus one, and it is a ceiling on RUNNERS.** Four static
predicates behind `verify`, plus one render harness whose single runner is
`tools/harness/run.mjs`. Probes and fixtures under `tools/harness/` are its
inputs and are not counted — that is what settled whether the recurrence guard
could exist. There is no sixth runner.

**All four commands can fail, and each was demonstrated red before it was
trusted green.** `v1` asserts every value it records, not just the absence of
throws. `run.mjs` fails on a thrown flow, an unexpected console error, an
unparseable payload, an **empty** payload, and a `THREW` nested at any depth.
"Unexpected" excludes errors raised inside the probe's `expectingFailure`
window — if you add a deliberate failure, put it inside that window or you will
break the clean-build run, and an assertion that cries wolf gets deleted.

`run.mjs` renders any probe and prints what it measured:

```
node tools/harness/run.mjs <probe.js> [--width 390] [--fixture] [--no-transitions]
```

`--fixture` injects `tools/harness/fixture.js` (`loadFixture()`, `RANGES`), the
five-plan dataset from `expense-pwa/VERIFICATION.md`. `npm run recurrence` is
the probe that evaluates it; run it after any change to recurrence, filtering
or the dashboard.

Set `CHROME_PATH` if Chrome is not at the default Windows location.

Note what this file does **not** say: how many pairs `check-contrast.mjs`
measures, how many `save()` sites are allow-listed, how many themes exist.
Those are the tools' numbers and the tools print them.

---

## Mistakes worth not repeating

Every one of these produced a false pass or a false failure in this project.

**Instrument faults — the expensive category.** More findings in rounds 4–7
came from a broken probe than from broken code, and a broken probe that
*passes* is the dangerous shape.

- **A visibility assertion is not a function assertion.** This is the round-7
  lesson and it cost a High. `boot-crash.js` asserted the Restore button's
  `offsetParent !== null` and passed while the button did nothing at all. It
  now asserts that init **completed**, which is the property that implies every
  listener below `load()` was registered.
- **Assert on something that is true on a healthy build.** A first attempt at
  the WORK-115 guard checked `#expCategory`'s option count — which is 0 on a
  perfectly healthy boot, because that dropdown only fills when the Expenses
  screen renders. It failed the green case. Prefer calling a function on the
  frame's window over reading a rendering side effect.
- A top-level `let` is **not** a property of `window`. `frame.contentWindow.db`
  is always `undefined`. Function declarations *are* — `categoryOptions()` is
  how the WORK-115 guard reads the store.
- `--window-size` is ignored by headless Chrome for layout. Host the page in a
  sized iframe and have the probe report its own `innerWidth`. The same trap
  bites **screenshots**: a plain `--screenshot` renders at desktop width and
  crops the right-hand side — where the thing you are checking usually is. Use
  an iframe of the target width, a window slightly *wider*, and
  `--force-device-scale-factor=1`.
- CSS transitions never settle under `--virtual-time-budget`.
- `requestAnimationFrame` is starved. Drive animations with a stubbed clock.
- **A count of zero is not a pass**, and neither is a selector that found the
  wrong thing. `#analytics` is `#daily`; the quick-amount row is `qaRowInc`;
  there is more than one `.grid-2` on the salary screen. **Every probe here
  throws `setup failed:` rather than measuring air** — keep it that way.
- Expanded occurrences carry a **synthetic id** `"<seriesId>:<date>"`; only the
  occurrence landing on the plan's own anchor date keeps the plain id. Filter
  for both or every recurring occurrence is invisible.
- When poisoning the store to test `load()`, the blob must have a **truthy
  `.length`** to reach the throwing path — `categories: 'abc'` works,
  `categories: {0:'x'}` does not.
- **A throw exits a flow at its first failing assertion.** One perturbation run
  only ever proves the first assertion in each flow. WORK-113 needed five
  passes, each leaving the earlier assertions correct so the next was reached.

**Windows/PowerShell.**

- `index.html` is LF. PowerShell `.Replace()` with `\r\n` matches nothing.
- Commit messages **always** via `git commit -F <file>`, and write that file
  with the **Write tool**. `Set-Content -Encoding utf8` puts a BOM in the
  subject line — this is documented here and I still did it to ten commits in
  round 7, then had to `filter-branch` them. A multi-line `-m "..."` is also
  torn apart by the parser into dozens of `pathspec` errors.
- **Never `git checkout <file>` to undo a temporary test edit.** It reverts to
  HEAD, not to your working state. It destroyed a finished WORK-111 in round 7
  and the work had to be rebuilt. Use `git stash push <file>` / `git stash pop`,
  which preserve and restore — or revert the edit with the Edit tool.
- `Select-String` renders a leading `/*` as `\*`. Display artifact, not a broken
  comment — confirm with Read before "fixing" it.
- Use absolute paths; the working directory drifts.

**Process.**

- Land tooling *before* the fix it will verify, and **demonstrate a new
  assertion red before you trust it green.** Perturb the thing it watches, not
  just the expectation, where you can: WORK-124's red came from changing a
  plan's frequency, which moved three real totals.
- **Decide the commit boundary before editing.** Splitting several changes to
  one file afterwards means reverting each group, committing, and re-applying —
  about a dozen extra edits. Round 7 paid this twice.
- **Open the thing you claim you changed.** Round 6 shipped five items that
  were not on disk as recorded; round 7's reviewers confirmed all of them by
  opening the files, including the PNGs as images, and that class did not
  recur.

---

## Conventions in force

The architect's, not suggestions:

- **A visibility assertion is not a function assertion.** A probe may not be
  described as guarding a behaviour unless it exercises that behaviour or
  asserts a property that provably implies it.
- **Text is painted from a token, on a ground expressible as a token.** No
  `rgba()` literal fill, no `opacity` on a text-bearing element, no `filter`,
  no `mix-blend-mode` over text — the predicate cannot measure any of them.
  `.hero-kpi` and `.chip.off` are the worked examples.
- **Comments state derivations, never bare results.** Inputs and an operator
  survive an edit; a figure does not. Seven instances in three rounds, several
  arriving inside the fix for the last one. If a figure depends on which
  container something is in, say which container.
- **A derived claim is measured BEFORE it gates, not as a condition of leaving
  one.** A finding whose evidence is stated as computed or reasoned from a
  declared model rather than observed is a *candidate*: it may be approved as
  work, it may not be a gate item. The measurement that settles it is its own
  step, scheduled first. Where no instrument can take that measurement, it
  cannot gate at all — it becomes a risk with a trigger.

  This is the third form of one mistake, and the shape keeps moving up a level.
  Round 7: the probe asked a question that could not fail. Round 8: the approval
  named a condition that could not fail. This: the gate admitted a claim before
  the question was asked at all. **The check comes before the commitment, or the
  commitment is a guess wearing a schedule.**
- **`min-width: 0` is a flex-item release in this codebase.** All ten instances
  are flex items, where the automatic minimum genuinely binds. A grid item that
  is a wrapper `<div>` with a percentage-width child does not floor on that
  child's intrinsic width in Blink — measured at six widths. Do not re-derive
  this; run `salary-width.js`.
- **A claim of completeness closes by re-derivation**; an asset commit closes
  by opening the asset.
- **Ruling C5, extended.** A path may reuse `#dataErrorBanner` only if it
  rewrites every claim the element renders *and* is not overwriting a more
  urgent true message — and every flag gating what that element says resets in
  one place, in `load()`.
- **No new top-level statement between `let db = load()` and the `#importFile`
  listener** without asking what a throw there costs. Making `load()` total
  removed the one known reachable throw; it did not remove the ~2,650
  statements in that span.
- **A measurement is only as honest as the instrument's self-report.** Added
  after WORK-130. Eight rows of pixel figures in the `.cal-grid` comment were
  honestly measured and uniformly wrong, because the harness frame reserved a
  15px desktop scrollbar and every row described a viewport 15px narrower than
  the one it named. Nothing in the numbers looked off — the error was uniform,
  which is exactly what made it survive review. The runner now suppresses the
  gutter and **fails** if a width-mode probe does not report the width it was
  asked for. When you record a measurement, name the command and its flags:
  that is the only part a later reader can re-run.
- **The disabled-control exemption has one exception, and it is measured.**
  Inactive controls are exempt from the text-contrast rule — except where the
  disabled control is the sole carrier of the text explaining *why* it is
  disabled. `button:disabled { opacity: .5 }` composites text and ground
  together toward the backdrop, so the pair falls to **2.11:1 (sepia) through
  3.88:1 (nord)** in all sixteen themes, and no predicate can see it. Put the
  explanation in a sibling helper line. `#converterUse` is the live example of
  getting it wrong; the Display Currency card is the worked example of getting
  it right.
- **C37 — an approval that names an assertion must also name the perturbation
  that turns it red, and that perturbation must change the APPLICATION, not the
  expectation.** This is round 9's real lesson and it was the architect's own
  mistake to record. Round 8 established that an acceptance condition must be
  able to fail on its symptom; four items later, in the same document, it
  approved an assertion comparing `localStorage` bytes across a function that
  never writes to `localStorage` — green by construction. Writing the rule down
  did not prevent the rule being broken by its author. Being made to fill in
  *"demonstrated red by …"* would have, because there was no sentence that
  could have gone there. **A rule that can be satisfied by intention is a
  sentence, not a guard. Give it a blank that has to be filled in.**
- **C34 — a trigger stated as a measurement is discharged only by a
  measurement, and it must name an instrument that exists here.** A structural
  argument may re-scope or sharpen a trigger; it may not fire it. And a trigger
  whose conditions this project cannot produce is an indefinite hold wearing a
  schedule — which is what WORK-16/49's was until round 9 restated it.
- **C35 — a suppression guard's predicate is the render's own predicate.** Both
  predicates proposed for the zero reading were reasonable and both were wrong,
  in opposite directions, because neither was derived from `fmtCurrency`'s
  `Math.round`. Each was tried in the application and each failed on the case
  that disqualified it. A threshold on a financial display is derived or it is
  a guess.
- **C36 — one fact per user-facing claim, from the source the app can defend.**
  If a judgement is computed from our own timestamp, our own timestamp is what
  gets displayed. Do not compute from one fact and print another beside it as
  evidence.
- **C38 — a stock and a flow do not share a card.** Income and expenses are
  flows: they belong to a period and the date filter governs them. An
  outstanding balance is a stock: it is true as of now and a date filter makes
  it a lie. This is why the Debts screen has no period selector and why its
  figures never join a Dashboard total.
- **C39 — a collection that must never reach a total gets its own array.** Not
  a flag on an existing one. Every total in this app is an unconditional
  reduce, so a flag makes correctness depend on remembering a filter at every
  future call site; a separate array makes the wrong answer unwritable.
- **C40 — the red-then-green demonstration is an artifact, not a claim.** The
  commit message states the perturbation, both exit codes, and
  `git diff --name-only` printing exactly `expense-pwa/index.html` — proving
  the red came from touching the app rather than the instrument. **C40(b): an
  instrument repair is demonstrated against BOTH the old and the new
  instrument.** Round 13's whole finding is the pair `verify=0` (old) against
  `verify=1` (new) on one identical backtick. Only the new instrument's exit
  code is not evidence of anything.
- **C41 — an assertion may not rebuild the value it guards.** Round 11's import
  check re-implemented the replacement object inside the probe and then
  compared it to itself; it would have passed against an app that had no import
  at all. If the probe contains a copy of the logic, extract the real one and
  call it.
- **C42 — coverage that can narrow must narrow loudly, and an uncompared
  measurement is labelled diagnostic.** A screen that silently drops out of a
  set proves less each round while reporting the same green. Hence
  `ALLOW_UNSTABLE = []` and a throw that names the screen that left. And a
  number nothing compares against is a diagnostic, not an assertion — say so in
  the output, or the next reader takes it for a guard.
- **A derived pixel figure has now been wrong four times.** The latest: round
  9's UI review derived 110px for a width that measures 122px, having
  subtracted the flex gap twice. The method was sound; the arithmetic was not.
  Measure with a width-mode probe and let it report `viewport_clientWidth`.
- **An assertion that goes red on correct code is a defect in the assertion.**
  WORK-143's fourth check first counted every `.conv-reading` in the document
  and failed at two — but the two live on different cards on different screens,
  which is the design. It was the check overstating the invariant, not the app
  breaking it. Fixed to count per card, and the episode is recorded in the
  probe itself, because a check that fails on correct code is the kind the next
  person deletes rather than repairs.

---

## The one thing to carry forward

For four rounds the real defect was that assertions of completeness were wrong:
six delete paths that were seven, sixteen themes measured in a comment and
never measured, "three places got this wrong" when there were four.

The fix was to move each claim somewhere a machine re-derives it. Round 6 then
found the machine could not say no — `npm run v1` returned 0 whether the
application worked or not — and fixed that.

**Round 7's lesson is the next one along: the machine could say no, and it was
asking the wrong question.** `boot-crash.js` watched a broken recovery route
and reported it green, because it asked whether a button was visible rather
than whether it did anything. A guard is not a guard because it exists. It is a
guard because of the question it asks.

So the rule now has three parts. Move the claim somewhere a machine re-derives
it. Prove the machine can say no. And **make every assertion name the behaviour
it guarantees, in words, in its own header — if it cannot, it is not guarding
anything.** Every probe in this repository was written to close a specific
hole, and each one is now the most likely place the next hole hides.
