# Design request — what the borrowing actually cost, when it is repaid early

**For the Chief Architect. A design request**, on the precedent of the three
before it. It follows `design-request-fee-calculator.md` by about an hour and
depends on what that ruling decided.

---

## 1. What the product owner asked for, and what they chose

Verbatim: *"Do the calculation of dates, when sometimes we pay before the due
date, this option we can pay little money on interest, I'd like to automate
this, when we insert debt taken day and paid day it calculates automatically
our how much money we lost in commision."*

Two questions were put to them and answered:

1. **A lender repaid early charges only the months the money was held, PLUS an
   early-settlement fee.** So the saving is real and the application cannot
   know its true size, because the fee is not a number this record holds.
2. **Show what was saved; do not change the record.** They were offered
   rewriting `totalToRepay`, and a user-driven "settle this debt" action, and
   chose neither.

---

## 2. Two things I checked before writing this

**The settlement date already exists and needs no new field.** Every entry in
`db.debtPayments` carries a `date`. The day a debt was paid off is the date of
the payment that cleared it. §1 asks us to "insert debt taken day and paid
day"; the taken day is `date` and the paid day is already recorded. Nothing new
is typed.

**The rate does not exist any more, and that was the condition FEE shipped
under.** Your ruling this morning permitted a rate the user *states*, consumed
by a form-time calculator, **stored nowhere** — and reaffirmed that a rate the
application *infers* stays off limits. An hour later this feature needs to know
the rate at a moment after that form session ended.

**I believe it does not have to infer one, and this is the part I most want
checked.** The figure can be expressed entirely in quantities the record holds:

> The user agreed to pay `totalToRepay − principal` of cost in exchange for
> holding `principal` for the contracted term. They held it for less. The cost
> attributable to the time they actually used is
> `cost × monthsHeld ÷ contractedMonths`.

No rate is named, computed or stored. It is a proportion of a cost the user
themselves agreed, over two spans the record already contains. **Proportional
allocation of this exact cost is also already this module's shipped practice** —
`debtInterestPaid` spreads it across repayments and says so on screen — so this
is the same idea over a different denominator, not a new kind of claim.

Whether that is genuinely outside the inference prohibition or merely a rate
wearing different clothes is your call, not mine.

---

## 3. The problem I cannot solve inside the owner's answer

**A debt repaid early never clears, so there is nothing to attach the figure
to.**

`debtOutstanding` is `totalToRepay − debtPaid`. A user who borrows ₮1,000,000
against an agreed ₮1,360,000 and settles in month four pays perhaps ₮1,120,000.
They record that payment. The application then shows **₮240,000 still owed, for
ever**, on a debt that is finished — and "Still owed" is the module's headline
figure.

So the state this feature exists to describe is a state the record cannot
represent, and the owner has chosen not to change the record. Three ways out
and I am not choosing between them:

| | What it does | Cost |
|---|---|---|
| **A** | Show the figure on a LIVE debt, predictively: *"settle this today and the cost stops at ₮120,000"* | Actionable before the decision instead of after it, and it needs no settled state at all. But it is not what §1 asked for — it reports a saving available, not one taken. |
| **B** | Treat "paid at least the principal plus the time-attributable cost" as settled | The record stays untouched and the card can close. But the application would be deciding a debt is finished on a model of its own, against a stored figure that says otherwise. |
| **C** | The user marks it settled | Nothing is inferred, the record gets an honest close. The owner declined this shape once already. |

**A is the one I would build** if it were mine, because it converts the feature
from a receipt into a decision aid and it sidesteps §3 entirely. It is also the
one furthest from what was literally asked.

---

## 4. The honesty problem, which is the direction this project is worst at

The owner says the lender also charges an **early-settlement fee**, and the
record does not hold it. So every figure this feature can produce **overstates
the saving and understates the cost.**

That is the reassuring direction. This project has twice ruled that
reassurance is worse than uninformative — `debtInterestPaid`'s own comment
rejects charging principal first because it *"reports zero cost for most of the
debt's life, which is worse than useless: it is reassuring"*, and round 13
refused a rounding that recorded less debt than was owed.

**So whatever ships must name the fee it does not know**, in the same sentence
as the figure, or it tells a user they saved money they did not save. That is
FEE-04's lesson for the third time: the wording is the load-bearing part.

---

## 5. What I am asking for

1. **Rule on §2** — whether a proportion of the user's own agreed cost over two
   stored spans is outside the inference prohibition, or is a rate model by
   another name. If it is the latter, this request ends and the owner is told
   why.
2. **Rule between A, B and C in §3**, or reject all three.
3. **Confirm §4's constraint** and rule on whether an unknowable fee makes the
   figure unshippable rather than merely caveated.
4. **Rule on the month convention.** The owner chose whole months rounding up
   for the calculator. Rounding a *held* term up makes the cost larger and the
   saving smaller, which is the conservative direction here — the opposite
   rounding to the one that was conservative there. Two conventions in one
   module that round opposite ways need either a reason or a single rule.

## 6. What I am not asking for

Not a stored rate. Not a change to `debtProblem`, `debtOutstanding`,
`debtInterestPaid` or either write path. Not a new storage key, schema field or
migration. Not a repayment schedule — the standing deferral on that is
untouched and this request does not fire its trigger.
