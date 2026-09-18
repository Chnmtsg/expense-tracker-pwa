# Design request — the true cost decoder

**For the Chief Architect. This is a design request, not a review finding.** It
originates from the product owner and asks for a feature that does not exist.
It follows the precedent of `reports/design-request-debt-tracker.md`, which
established this instrument for the module this request extends.

It is filed alongside a Round 16 review scoped to the Debts module, so the
architect rules on the proposal with the module's current review in hand.

---

## 1. Where this comes from

`knowledge/product-strategy.md`, committed 2026-09-18, sets the mission as
breaking the non-bank borrowing loop and names three steps: know what is owed,
know what it costs, see the way out. It puts this item first in the build
sequence and places it on the **free** side of the free/paid line, permanently.

The Debts module already does step one and half of step two. It states cost in
tugrik. It does not state a rate.

---

## 2. The gap, stated precisely

Cost in tugrik is not comparable across loans. These two are the same figure
and are not remotely the same loan:

| Borrowed | Repayable | Cost | Term |
|---|---|---|---|
| ₮1,000,000 | ₮1,300,000 | ₮300,000 | 12 months |
| ₮1,000,000 | ₮1,300,000 | ₮300,000 | 3 months |

The module currently renders these identically. The second is four times the
first. A user deciding whether to roll one loan into another has, today, no
figure in this application that distinguishes them.

This is the number `design-request-debt-tracker.md` said the module existed to
produce — *"a number that changes what someone does"* — at the resolution that
makes it actionable.

---

## 3. The schema question, which I believe answers itself

**The product owner expected this to need a new field. I do not think it
does, and that is the first thing I am asking the architect to confirm.**

A rate needs three inputs. The debt record already carries all three:

| Input | Field | Status |
|---|---|---|
| Principal | `principal` | Required, validated by `debtProblem` |
| Total repayable | `totalToRepay` | Required, validated, and refused if below principal |
| Term | `dueDate` − `date` | `date` required; `dueDate` optional |

So the term is derivable for any debt carrying a due date, and **no new storage
key, schema field or migration is required.** The standing ruling forbids all
three this cycle; on this reading the feature does not test that ruling at all.

The cost of taking the free option is that debts without a `dueDate` get no
rate. I think that cost is close to zero, and the reason is already written in
this module's own comments: a debt with no agreed date is *"money from family"*,
which *"usually carries no interest at all"*. Those debts produce no rate
because they have no cost, not because the term is missing. A non-bank lender
always states a term — it is how the product is sold.

**If the architect disagrees, the alternative is an explicit `termMonths`**, and
that is a schema field, a migration, a validator clause in `debtProblem`, and a
new input on a form whose field order was settled in Round 15. I am not asking
for it. I am recording it so the cheaper option is chosen knowingly.

---

## 4. The hard question: which rate

This is the real architectural decision, and it is a mission question before it
is a technical one.

Given principal `P`, total repayable `T` and term `n` months, there are two
defensible annualised figures and they differ by roughly a factor of two.

**Flat rate** — `((T − P) / P) × (12 / n)`. One line, no assumptions, and it is
the number the lender quotes.

**Effective rate** — the rate that actually discounts the repayments back to
the principal. Requires assuming a repayment schedule and solving for the rate
numerically.

Computed, not estimated — the figures below come from a bisection solve over
equal monthly installments, and the script is reproducible from this table:

| Borrowed | Repayable | Term | Flat | Nominal APR | Effective annual |
|---|---|---|---|---|---|
| ₮1,000,000 | ₮1,300,000 | 12 mo | 30.0% | 51.4% | **65.5%** |
| ₮1,000,000 | ₮1,360,000 | 12 mo | 36.0% | 61.0% | **81.2%** |
| ₮500,000 | ₮650,000 | 6 mo | 60.0% | 96.6% | **153.3%** |
| ₮1,000,000 | ₮1,300,000 | 3 mo | 120.0% | 172.3% | **400.4%** |

Row two is the ordinary case: a lender quoting **"3% per month"**. That phrase
sounds like 36% a year. On an installment loan it is **81%**.

The gap exists because on an installment loan the borrower does not hold the
principal for the full term — they are paying it down throughout, so they are
renting, on average, about half of it. The flat rate divides the full cost by
the full principal and so reports roughly half the true rate.

**The risk I want on the record.** The flat rate is the lender's own framing,
and that framing is chosen because it looks small. If this application prints
30% where the borrower is paying 65%, it has not merely been imprecise — it has
lent its credibility to the understatement the product exists to expose. A user
who checks our figure against the lender's and finds them agreeing concludes the
loan is fine. **Understating a predatory rate is worse than showing no rate.**

**What weighs the other way.** The effective rate assumes equal monthly
installments, and this application does not record a schedule. It records
payments as they happen, ad hoc. For a bullet loan — one repayment at the end —
the effective rate and the flat rate converge, and assuming installments would
*overstate* it. The assumption would be ours, not the contract's.

**There is a precedent for exactly this dilemma, in this module.**
`debtInterestPaid` faced the same choice, picked an allocation the contract does
not specify, and then said so on screen: *"It is spread evenly across your
repayments, so it may not match your lender's own statement."* The module
already owns the practice of stating whose arithmetic produced a figure. A rate
labelled with its assumption is not a new kind of claim here.

I am not ruling between these. The options as I see them:

| Option | What ships |
|---|---|
| **A** | Flat rate only. Truthful arithmetic, understates the loan, matches the lender. |
| **B** | Effective rate only, assuming equal installments, labelled with that assumption. |
| **C** | Effective rate as the headline, flat rate as the secondary line, so a user comparing against the lender's paperwork finds both numbers and an explanation of the gap. |
| **D** | Flat rate now, effective rate deferred behind a trigger. |

---

## 5. States where no rate exists

Four, and each needs a ruling on what the screen does rather than what the
function returns.

| State | Why | Proposed |
|---|---|---|
| No `dueDate` | No term | Omit the rate. Say nothing. |
| `totalToRepay === principal` | No cost | Omit. `renderDebts` already omits a zero cost line rather than printing ₮0, and the comment says why: it implies a question was asked that was not. |
| `dueDate === date` | Zero-length term; division by zero | Must be guarded. Note that `debtProblem` deliberately does **not** cross-check `dueDate` against `date`, so a zero or negative term can reach this code from an import. |
| Very short term | Annualising 3 days produces a true but enormous number | Ruling wanted. The figure is arithmetically correct and may read as a bug. |

---

## 6. What I am asking for

1. **Confirm the no-schema-change reading in §3**, or reject it and say that
   `termMonths` is wanted instead.
2. **Rule between A, B, C and D in §4.** This is the decision; everything else
   follows from it.
3. **Rule on the short-term case** in §5.
4. Confirm the figure belongs on the Debts screen only. The Debts module's
   binding condition — no debt figure reaches the Dashboard — is stated in
   `computeReminders` and I am not proposing to touch it.

## 7. What I am not asking for

Not the payoff planner; it is item 2 in the strategy's sequence and is a
separate request. Not a change to `debtInterestPaid`, whose proportional
allocation was ruled on and is not reopened here. Not a new screen, not a new
storage key, and no change to the Round 15 form field order.
