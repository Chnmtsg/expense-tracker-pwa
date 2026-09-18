# Design request — entering a loan the way the lender states it

**For the Chief Architect. This is a design request, not a review finding.** It
follows `design-request-debt-tracker.md`, `design-request-true-cost-decoder.md`
and `design-request-paste-a-loan.md`.

**It asks you to reopen a permanent off-limits entry.** That is stated here,
first, rather than discovered in §4 — Round 16 rejected an item partly because
*"an off-limits entry may not be overturned by a feature request that does not
know it exists."* This one knows.

---

## 1. What the product owner asked for, and what they chose

Verbatim: *"In debt section, lets remove Paste a message from your lender then
add this we insert the fee, due date and how many money borrowed it calculate
automatically in our debt section."*

Two decisions were put to them against stated alternatives, including the
alternative that avoids the collision entirely:

1. **The fee is a MONTHLY PERCENTAGE — 3% сарын хүү.** They were offered a flat
   tugrik fee and a one-off percentage, both of which stay inside the standing
   rules, and were told plainly that a monthly rate is *"the case that
   collides… it needs the architect to reopen that entry, not just approve a
   form change."* They chose it anyway, which is information rather than
   oversight.
2. **The paste control is removed entirely.** Done, in the commit preceding
   this document. The ruling and request that produced it are untouched.

---

## 2. The collision, in full

The Round 11 supplemental put **"an interest-rate / APR field, or an
amortisation schedule"** on the permanent off-limits list. Round 13's S1 read
that entry as a rejection of a *model*, not of saying what the application
does. Round 16 applied it to reject the effective rate and reaffirmed it,
adding *"an amortisation model, an assumed repayment schedule, an effective/IRR
rate, or the abbreviation APR anywhere in the user interface."*

**An input that says "3% per month" is an interest-rate field by name.** There
is no reading of §1 that avoids this.

---

## 3. Why I am asking anyway: the entry's premise has been contradicted by the
owner

The Debts module takes two amounts instead of a rate, and its own comment says
exactly why:

> *Two amounts rather than an interest rate: the lender states both of these
> and most people do not know their APR.*

**That is an empirical claim about Mongolian lenders, and the owner — whose
judgement of this market `product-strategy.md` says outranks this repository —
now says it is wrong.** The lender states a monthly rate. The borrower does not
know the total; they know 3% a month, the amount, and the date.

If that is true, the consequence runs the other way from the prohibition. The
current form asks for a number the user does not have and must compute — on a
loan, which is the arithmetic this audience is worst at and the arithmetic this
module exists to do for them. The prohibition was written to stop the app
modelling a rate it had not been told. It now also stops the app accepting a
rate it *has* been told.

**The distinction from Round 16's option B is the whole of my argument.** That
option had the application *infer* a rate from data it held, under an assumed
repayment schedule it does not record — asserting something about a contract it
had never seen. This has the user *state* the rate from the paperwork in front
of them, and the application do one multiplication and show the result for
confirmation. **Inference is a model. Arithmetic over a stated input is not.**

---

## 4. The proposal, which stores nothing new

**The rate is a form-time calculator. It is not stored, not in the record, not
anywhere.**

| Field | Status |
|---|---|
| Amount borrowed | Existing `#debtPrincipal`, unchanged |
| Monthly rate | **New input, not stored** |
| Due by | Existing `#debtDue`, unchanged |
| Total you will pay back | Existing `#debtTotal` — **computed and filled, still editable, still the thing that is stored** |

So `db.debts` is byte-identical in shape to today: `principal`,
`totalToRepay`, `date`, `dueDate`, `notes`. **No storage key, no schema field,
no migration**, and the Round 15/16 prohibition on all three is untested for
the third consecutive request about this module.

It is the same shape the paste control had and was approved under: it fills a
field, the user confirms it, the existing handler and `debtProblem` do the
writing. §3 of `design-request-paste-a-loan.md` argued that and you confirmed
it; the four properties you attached (never submits, never touches `db`, the
result is legible in the form's own idiom, the user can check it) apply here
unchanged and I propose them as conditions again.

---

## 5. What I do not know, and will not guess

**(a) Simple or compounding.** 3% a month over 12 months is 36% of the
principal if it is simple interest on the original amount, and 42.6% if it
compounds. Mongolian flat loans are usually quoted simple, but I have no
evidence in this repository and the two differ by ₮66,000 on a ₮1,000,000 loan.
This is a question for the owner, not for you, and I have not put it to them
yet because it only matters if you approve the shape.

**(b) How a term becomes months.** The record stores two dates. Days ÷ 30?
Calendar months? Rounded how? Whatever is chosen is a modelling decision the
stored data does not contain, and CODE-04 established last round that the
rounding direction matters most on short terms, which are the predatory ones.

**(c) THE DRIFT, WHICH IS THE ONE THAT WORRIES ME.** The total is computed once,
at entry, from the rate and the due date. `openDebtEditModal` lets the user
change the due date afterwards. The stored total will not recompute — and
because the rate is not stored, **nothing can recompute it**. A user who moves
their due date out by three months keeps a total that no longer matches the
rate they were quoted, and the app cannot tell them, because it no longer knows
the rate. Storing the rate would fix it and is a schema field, which is off
limits. I do not have an answer to this and I am not proposing one.

**(d) It makes the decoder less surprising.** `debtAnnualCostRate` exists to
tell a user their 3%-a-month loan costs 36% a year. If the user typed 3% a
month themselves, the card is now telling them arithmetic they supplied. The
comparison between a 3-month and a 12-month loan — the gap §2 of the decoder
request actually named — still works. The shock does not. Worth knowing before
approving, because it partly un-buys something ruled three commits ago.

---

## 6. What I am asking for

1. **Rule on whether the Round 11 entry is narrowed** to permit a rate the user
   states as an input to a calculator, while continuing to forbid a rate the
   application infers, a stored rate field, an amortisation schedule, and APR
   anywhere in the interface. If the answer is no, this request ends here and
   the owner gets a flat-fee form instead, which needs no ruling.
2. **Rule on the not-stored reading in §4** — that a calculator filling an
   existing field is not a schema change and not a model.
3. **Rule on (c), the drift.** It is the one hazard I cannot design around
   inside the constraints.
4. **Rule on whether (b) belongs in your ruling** or in implementation, given
   CODE-04's precedent that the rounding direction is a correctness question.

## 7. What I am not asking for

Not a stored rate, not an amortisation schedule, not APR in the interface, not
a repayment plan, not a change to `debtProblem` or to either write path, and
not a second door — if this ships, the total remains directly typeable for the
users whose lender does state a total.
