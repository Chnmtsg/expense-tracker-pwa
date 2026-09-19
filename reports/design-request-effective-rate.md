# Design request — the effective rate

**For the Chief Architect.** This fires the effective rate, deferred at Round 16 as the replacement for **option D** and described there as *"the only door back to it"*. Its trigger was *"the day this application records a repayment schedule"*, and that day has passed: `SCH-02` is on `main` at `a7b6edf` and live at v19, `PDT-01` at `2e65591` reads the schedule already.

**Two things this request carries that the last one did not.**

**First, it inherits a duty.** `PDN6` ruled that `debtAnnualCostRate`'s comment — which states at source that this application *"records payments as they happen and no schedule at all"* — is **now false**, and that correcting it belongs to this request and to nobody else, because `ARCH-01`'s mechanism is that a comment is re-read when its block is opened rather than swept. **That correction is half of this commit whatever else you rule**, and if you refuse the figure it still has to happen.

**Second, it is the one item in this module with pre-ruled conditions written before its trigger fired.** Round 16 set them so that no architect round would have to rediscover them, and I have not re-argued any of them. They are quoted verbatim at §5.

---

## 1. What fires, and what does not

| | |
|---|---|
| **Fires** | The effective rate. |
| **Also fireable today, and NOT in this request** | `SCD2`, reminders from the schedule. Its own scoped request. |
| **Not fired by anything here** | `PDD1`, `SCD1`, and every other standing deferral. |

---

## 2. The figure, and why it is not the one already on the card

`debtAnnualCostRate` states **the cost as a share of what was borrowed, spread over the agreed term**. Its own comment says what it is not: *"a borrower repaying in installments does not hold the whole principal for the whole term, so a true rate on the falling balance is roughly double this figure."*

**"Roughly double" is not rhetoric. I computed all four of Round 16's rows rather than copying them, and they verify:**

| Borrowed | Repayable | Payments | On the card today | Effective annual |
|---|---|---|---|---|
| ₮1,000,000 | ₮1,300,000 | 12 | **30%** | **65.5%** |
| ₮1,000,000 | ₮1,360,000 | 12 | **36%** | **81.2%** |
| ₮500,000 | ₮650,000 | 6 | **60%** | **153.3%** |
| ₮1,000,000 | ₮1,300,000 | 3 | **120%** | **400.3%** |

**The fourth row is worth a sentence of its own.** Computed from the exact instalment it is 400.4% and from the whole-tugrik instalment the record actually stores it is 400.3% — a tenth of a point, below the precision the card displays, which is the answer to the question of whether the stored rounding gap matters. It does not.

**This is the figure the product exists to show.** `knowledge/product-strategy.md`'s first step is breaking the borrowing loop by making the cost legible, and the card currently shows a number that is honest, correctly labelled, and **half the truth about the money**.

---

## 3. Where it goes — and I have not answered "nowhere"

Your `PDD1` ruling left a rule I am taking seriously: *"a closed surface is not an argument against a feature, it is an argument about where the feature goes,"* and *"a request that opens 'there is nowhere to put this' has usually not finished looking."* So this section proposes rather than complains.

**What I propose: the effective rate replaces the flat rate on the card when — and only when — a schedule is recorded, under its own sentence and its own label.**

**Why that is not `PDR6`.** `PDR6` refused wiring the schedule into `debtTermDays`, on the ground that it would make **one label mean two things** depending on an optional field. This is the opposite construction: **two labels, each with exactly one derivation**, and the sentence itself tells the user which question is being answered.

```
no schedule   Costs you 36% of what you borrowed, each year.
a schedule    Costs you 81% a year on the money you still owe.
```

**The card's one-sentence closure is honoured, not spent.** It stays at one sentence in every reachable state; what changes is which sentence, and the state that selects it is a fact the user typed.

**Three alternatives, and why I am not proposing them.**

**(a) Both rates on the card.** A second sentence on copy closed at one, permanently. Refused by the block's own comment and I am not re-raising it.

**(b) The edit modal, beside the schedule, on `PDT-01`'s precedent.** Tempting and I think wrong. `PDT-01` earned that position by being **a guard** — it checks `firstDue`, which nothing else checks. **An effective rate guards nothing.** It checks no stored field and catches no typo, so the rule that carried `PDT-01` does not reach it, and you flagged this exact risk: the modal is *"one good argument away from a second derived line."* **This is that argument, and I am declining to make it.**

**(c) Filling the gap where the flat rate is absent** — a debt with a schedule and no `dueDate`. Arithmetically free and I think it is `PDR6` through a side door: it makes the presence of a rate on a card depend on which optional field the user happened to fill, and a user with two debts would see a rate on one and an ask line on the other for reasons they cannot deduce.

---

## 4. The thing I most want ruled: the number changes, and the card cannot explain why

**A user who has been looking at 36% for a month, and who then types a schedule off the same piece of paper, sees 81% the next time the screen renders.** Nothing about their loan changed.

**Round 16 pre-authorised exactly this shape and gave the reason:** the figure moves *"because the application learned something rather than because it changed its mind, and the change is explicable on the screen where it appears."*

**I am not sure that last clause is satisfiable on this card, and that is the question.** The rate copy is closed at one sentence; there is no room for *"this went up because you told us how you are repaying."* The places an explanation could live are all closed or spent — the foot's gated line is exclusive and provably full, the pills are refused, and the modal is where the user is when the change happens but not where they are when they see it.

**Three shapes I can see:** the sentence carries its own explanation in its wording and nothing else is said; a one-time disclosure appears at the moment of the change and never again, which is a new mechanism this application does not have; or the change ships unexplained and is recorded as a risk. **I lean to the first and I am not confident.** A sentence that says *"on the money you still owe"* does name the difference, but only to a reader who noticed the old one.

---

## 5. The pre-ruled conditions, quoted rather than re-argued

From Round 16, verbatim:

> a fixed iteration count and never a converge-until loop; `return null` on non-convergence or on a bracket that fails to straddle, never a silent ceiling; a harness fixture in `tools\harness\debts.js` asserting §4's four rows as a regression; the function pure over one debt record; and the assumption stated on screen in the module's existing disclosure voice.

**I accept all five and am asking for none of them to be relaxed.** Two notes rather than requests.

**On "the assumption stated on screen":** the assumption that clause was written about — equal instalments — **is no longer an assumption**. It is `d.schedule`, typed by the user. What remains assumed is only that the payments happen when the schedule says. **So I think that clause is discharged rather than owed, and I want you to say which**, because shipping a disclosure of an assumption the application no longer makes would be worse than shipping none.

**On the solver's inputs:** principal out at day zero, then `count` payments of `instalment`, monthly. **Not `totalToRepay`** — the sum rule permits `instalment × count` to differ from it by up to one instalment, and the schedule is the thing being modelled. The rounding this creates is the 0.1pp in §2's fourth row.

---

## 6. What I am asking for

1. **Rule §3** — the conditional replacement, or one of (a)–(c), or nowhere.
2. **Rule §4** — whether "explicable on the screen where it appears" is satisfiable here, and what happens if it is not. **If it is not satisfiable and is binding, this request ends**, and I would rather that than ship a figure that doubles without a reason.
3. **Rule §5's first note** — is the on-screen assumption disclosure discharged or still owed?
4. **Confirm the solver's inputs** in §5's second note.
5. **Rule what happens to `DEBT_RATE_DISPLAY_MAX`.** It caps the display at *"more than 1,000%"*. The flat rate reaches it rarely; an effective rate over a short schedule reaches it easily — three payments already produce 400%. **The cap was ruled for a figure with roughly half this range.**
6. **Confirm `PDN6`'s correction rides this commit**, and rule whether it still rides it if the figure is refused.

## 7. What I am not asking for

Not APR anywhere in the interface. Not a change to `debtAnnualCostRate`'s own arithmetic, its label, or its term source (`PDR6` carried entire). Not a second rate rendered beside the first. Not a rate stored anywhere, in `notes` or elsewhere. Not a rate the user can type as a rate (`FEE-03`'s narrowing is neither invoked nor widened). Not a saving, an ordering, a projection, a countdown, or any figure comparing the schedule with `db.debtPayments`. Not a new screen, modal, sheet or `editCtx.kind`. Not a new harness runner, probe or static predicate. Not a new stored field, key, migration or `SCHEMA_VERSION` bump. Not a Mongolian string.

---

## 8. One thing on the record

**This is the first request in this module where I think the honest figure is the alarming one, and the alarming one is right.** Every previous ruling here has narrowed a claim — the decoder shipped flat because effective would have overstated a bullet loan, the saving was refused because it is zero, the payoff plan was refused entirely. **This one goes the other way: the number on the card understates, by about half, on the exact product this application was built to expose.**

**Which is also why I would rather you refused it than approved it loosely.** A figure that doubles with no explanation, on a screen belonging to somebody under financial stress, is the kind of thing that gets read as a bug in the app rather than a fact about the loan — and the fastest way to make a user distrust a true number is to change it without telling them why.
