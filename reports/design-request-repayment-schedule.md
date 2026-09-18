# Design request — recording what the user agreed to pay, and when

**For the Chief Architect.** The owner was asked the question your payoff-plan ruling ended on — *do you want this application to record what a user has agreed to pay and when* — and **answered yes**. It is recorded in `reports/HANDOFF.md` with the date.

**This is the request that fires the scheduled-repayments deferral**, which has stood since before the decoder and which two ruled items are waiting on: `PD1`, the payoff date, and the effective rate.

**It is the largest storage change proposed since the module shipped, and larger than `settledOn` by a long way.** That is stated first.

---

## 1. What fires, and what does not

| | |
|---|---|
| **Fires** | The standing scheduled-repayments deferral. |
| **Unlocked, but NOT in this request** | `PD1` (a payoff date) and the effective rate. Both have their own fences and both arrive as their own scoped requests **after** this ships, if it does. |
| **Not fired by anything here** | Every other standing deferral. |

**This request is the fact only.** No date, no rate, no plan, no projection. If it ships and nothing else ever does, the application simply knows what the user agreed to pay.

---

## 2. What a schedule is, on this market's evidence

The owner has told us, and it is in the assumptions table: a Mongolian non-bank lender quotes **a monthly rate**, charges **simple interest on the original amount**, and charges **whole months**. The ordinary contract is therefore **N equal monthly instalments**, and the borrower knows N, the instalment, and the day of the month.

So the minimum honest object is three facts:

```
instalment  — what is due each time
count       — how many
firstDue    — when the first one falls
```

Everything else is derivable: the last due date, the sum of instalments, whether the sum matches `totalToRepay`.

**I am proposing this as one optional object on the debt record**, in `settledOn`'s shape: absent on every existing record, absent and `null` identical, refused by the validator only when present and malformed, no migration because there is nothing to transform.

---

## 3. The thing I most want ruled: is this derivable, and does that matter?

**It very nearly is.** The record already holds `principal`, `totalToRepay`, `date` and `dueDate`, and `feeTermMonths` already computes whole months between two dates. So `totalToRepay ÷ months` is an instalment, and `months` is a count, and `date` plus one month is a first due date.

**And I think deriving it would be exactly the prohibition.** That is the application **inferring** a repayment pattern from a contract it has never seen — the object refused at the fee ruling, at the early-settlement ruling, and again at the payoff plan three hours ago. The whole reason a schedule unlocks `PD1` is that it is **recorded** rather than assumed; a derived schedule would unlock nothing, because it would carry exactly the uncertainty that made the projection inadmissible.

**So: stated by the user, or it is not a schedule.** I believe that is the ruling, but it is the load-bearing claim of this request and I want it decided rather than assumed. If a derived schedule is admissible, this request is much smaller and much worse.

---

## 4. Five things I cannot settle

**(a) Does the sum have to match `totalToRepay`?** `instalment × count` will rarely equal it exactly — ₮1,360,000 over 12 is ₮113,333.33, and this application stores whole tugrik. **Refusing a mismatch would refuse most real contracts.** Accepting it silently leaves two figures on one record that disagree. I see three shapes — refuse, accept silently, or accept and say so — and I lean on the third by the module's own habit, but where such a sentence could live is a real problem on a card whose copy is closed at one sentence and whose foot is closed at three gated lines.

**(b) Does it write `db.planned`?** The application already has recurring planned expenses with a frequency, an interval and a cursor. A repayment schedule is the same shape. **I am not proposing it**, because the Debts module's binding condition is that no debt record reaches `db.planned` or any period-filtered surface — but somebody will propose it, and the reason not to should be on the record rather than in my head.

**(c) What does it do to reminders?** `computeReminders` has one debt branch, keyed on `dueDate`, emitting at most one item per debt. A schedule means up to N due dates. **The bell currently counts debts; it would start counting instalments**, and a user with three debts on monthly schedules could see a dozen items.

**(d) What happens when a payment does not match an instalment?** `db.debtPayments` records what was actually paid, ad hoc, in any amount. A schedule says what was *agreed*. The two will disagree constantly, and the application would then hold both a plan and a record of departure from it. **That is the first time this module would hold an expectation alongside a fact.**

**(e) Does a settled debt keep its schedule?** `debtSettled` is live. A finished debt with a schedule still listing future instalments is the harm `SET-02` closed at nine sites, arriving through a new door.

---

## 5. What I am asking for

1. **Rule §3** — stated by the user, or is a derived schedule admissible? **If derived is admissible, say so plainly, because it changes everything downstream and I think it would waste the unlock.**
2. **Rule the object in §2** — three facts, or fewer, or more, and whether it is one field on the debt record or something else.
3. **Rule §4(a)**, the mismatch between `instalment × count` and `totalToRepay`.
4. **Rule §4(c)**, what reminders do, since this is the first thing that could multiply them.
5. **Rule §4(d)** — whether holding an expectation alongside a fact is admissible in this module at all. **If it is not, this request ends**, because a schedule is an expectation by definition.
6. **Confirm §4(b)** and **§4(e)**.

## 6. What I am not asking for

Not a payoff date, not an effective rate, not a projection, not a saving, not an ordering, not a new screen, not a second rate anywhere, not a change to `debtOutstanding`, `debtPaid`, `debtInterestPaid`, `debtSettled`, `debtAnnualCostRate` or any existing write path. **Not automatic payment recording** — a schedule says what is owed and never marks it paid.

---

## 7. One thing on the record

Five consecutive debt requests have been refused for adding a model. **This one asks to store the model's input instead** — not what the application thinks will happen, but what the user says was agreed. If that distinction does not hold, I would rather hear it now than after a field is in the record, because a stored field is the one thing in this project that cannot be quietly removed.
