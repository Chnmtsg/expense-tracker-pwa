# Design request — a borrowing tracker

**For the Chief Architect. This is a design request, not a review finding.** It
originates from the product owner, not from a reviewer, and it asks for a
feature that does not exist rather than reporting a defect in one that does.

The user's decisions are already made and are not open for re-litigation by me.
They are recorded verbatim in §1. What is open is the architecture, and that is
what this document asks for.

---

## 1. What the user asked for, and what they chose

Verbatim: *"I want to add non-oafs cash lending on income section, it's not
income when we take this lend we buyback to non-oafs. In the Mongolia, this is
the big thing. People take the non-oafs cash lending continiously. I want to add
tracker thing for non-oaf thing. When people see how much money they spend on
non-oafs they can be changed."*

Reading "non-oafs" as **non-bank lenders — ББСБ / NBFI**: the licensed non-bank
finance companies, pawnshops and payday lenders. This reading was put to the
user and not corrected.

Three decisions, taken by the user against stated alternatives:

1. **Scope — non-bank lenders AND friends/family.** Not bank loans, not credit
   cards. This matters more than it looks: see §5(f).
2. **Money model — only interest is a cost.** Principal in and principal out
   cancel. The user was shown the arithmetic of all three candidate models and
   picked this one.
3. **Process — architect first.** The user explicitly chose a design ruling
   over "I propose, you approve" and over "just build it".

**The stated goal is behavioural, not clerical:** *"When people see how much
money they spend on non-oafs they can be changed."* The deliverable is a number
that changes what someone does. That should discipline every other choice here
— a feature that tracks debt accurately but never confronts the user with its
cost has missed the point.

---

## 2. The defect this closes, which is the part I would not defer

This is not only a feature request. The app currently has no way to record
borrowed money, so a user who borrows ₮1,000,000 from a lender has two options,
and both are wrong:

- **Log it as Income.** Net Balance rises by ₮1,000,000 at the moment the user
  becomes ₮1,000,000 poorer. The headline figure of a personal finance
  application states the opposite of the truth.
- **Log nothing.** Then spending the borrowed money shows as ₮1,000,000 of
  expense against income the user never received, and the repayment shows again
  later.

`knowledge/project.md` puts correctness and preservation of financial data
above everything, and the standing decision's own first principle says the same.
The first option is reachable today, is the natural thing for a user to do, and
produces a wrong headline number. I record it as a defect rather than a gap.

---

## 3. Where the arithmetic lands

Net Balance is computed at `expense-pwa/index.html:6465`:

```js
const totalIncome  = income.reduce((s,x) => s + (+x.amount||0), 0);
const totalExp     = actual.reduce((s,x) => s + (+x.amount||0), 0);
const net          = totalIncome - totalExp;
```

Under the chosen model, borrowing ₮1,000,000, spending it, and repaying
₮1,300,000 must produce:

| event | liability | income | expense |
|---|---|---|---|
| loan received | +1,000,000 | — | — |
| user spends it | — | — | 1,000,000 |
| repay principal | −1,000,000 | — | — |
| repay interest | — | — | 300,000 |

Net Balance shows **−1,300,000**, which is true: the user consumed ₮1,000,000
of goods and paid ₮300,000 for the privilege. Cost of borrowing, the headline,
is **300,000**.

The two rejected models produce −2,300,000 (double-counts the principal) and
+1,000,000 at the moment of borrowing (states the opposite of the truth).

---

## 4. The architectural problem I think is the real one

**Net Balance is a FLOW. Debt is a STOCK. The app currently has no stock
concept at all.**

Every figure in this application is a flow measured over a filtered period:
`getRange('dash')` bounds income and expenses, and every total is a sum over
that window. Outstanding debt is not like that. *How much do I still owe* is
true as of now and has no period — it is the same number whether the Dashboard
filter says "This Month" or "All Time".

That distinction has consequences the design has to answer for, and it is the
reason I am not proposing a shape and asking for approval:

- A stock figure placed on a period-filtered card invites the reader to
  subtract it from a flow figure, which is meaningless.
- "Interest paid" *is* a flow and belongs in a period. "Outstanding" is a stock
  and does not. They are the two numbers the feature exists to show, and they
  do not belong to the same kind of card.
- The standing decision already carries a convention of exactly this family —
  *no card shows more than one converted figure*, ruled to stop the user
  subtracting two things that should not be subtracted. This is the same
  hazard in a different dimension.

---

## 5. What needs ruling

I have deliberately not chosen any of these.

**(a) Where the liability lives.** A new top-level `db.debts` plus a payments
array, or something reusing what exists? This is a schema change either way:
`SCHEMA_VERSION` is 2, `migrations` is append-only, and `load()` at `:3129-3145`
builds `d` field by field, so a new array needs a line there, a line in the
fresh-defaults object at `:3195`, and a migration. All three or the field is
absent on one of the four fallback paths.

**(b) How interest is recognised, and when.** The user chose "only interest is
a cost" but not *when* that cost appears. Candidates: proportionally on each
payment (`interest_part = payment × (total − principal) / total`, one formula,
derivable, no user input); user-entered split per payment (accurate, but asks
for something many users will not know); or all-principal-first / all-interest-
first. Whichever is chosen becomes an invariant, because it decides which
period the expense falls in.

**(c) Whether interest becomes a real `db.actual` record or a computed term.**
This is the crux and I want it ruled explicitly.
- *As a real expense record*: Net Balance needs no change, every existing chart
  and total picks it up for free, and the export blob carries it. But it needs
  a category, and a user can delete or rename categories — which would put a
  derived record's meaning at the mercy of a field the user controls.
- *As a computed term*: `net = income − expenses − interestPaid`. Nothing
  fabricates records. But it changes the headline formula that four rounds of
  review have been checking, and every other consumer of `net` has to agree.

**(d) The Income-screen entry point.** The user asked for it there, and the
reasoning is sound — Income is where a person goes when cash arrives. But the
control must create something that is explicitly *not* income, on the screen
whose entire subject is income. Getting that wording wrong reintroduces §2's
defect through the fix for it.

**(e) Whether scheduled repayments reuse the recurrence engine.** NBFI loans
repay on a schedule, which is what `planned` + `stepDate` + `expandPlannedInRange`
already do — including the 31st-clamp and the two-horizon rules that took three
rounds to get right. Reuse risks overloading a structure whose invariants are
written for planned *expenses*; duplication risks a second recurrence
implementation, which the standing decision would almost certainly reject.

**(f) Zero-interest debt, which the friends/family scope makes mandatory.**
Money borrowed from family usually carries no interest. Under the chosen model
that is a pure liability with no expense ever — the tracker must handle a debt
whose cost is legitimately zero without looking broken, and the headline "cost
of borrowing" must not imply a friend charged interest they did not.

**(g) Staging.** This is larger than anything approved since the display
currency. `CLAUDE.md` requires the smallest safe implementation and forbids
bundling unrelated features. A defensible first stage might be the liability
and the cost figure with manual repayments, deferring scheduling entirely. That
is a call for the architect, not for me.

---

## 6. Constraints I am treating as binding

From the standing decision and `HANDOFF.md`, unless the architect says
otherwise:

- Money is integer tugrik. No minor units, no decimals, no change to `unmoney`
  or `formatMoneyInput`.
- One store seam; `load()` stays total; migrations numbered and append-only.
- The verification ceiling is four plus one and it is a ceiling on **runners**.
  New probes are inputs and are permitted; a new runner is not.
- C37: any assertion this feature ships with must come with the perturbation
  that turns it red, and that perturbation changes the application.
- `renderDashboard` is Dashboard-only, and `:6440-6446` explicitly forbids
  adding a write to anything outside `#dashboard` inside it.
- No large mechanical sweep. Backward compatibility is mandatory: an existing
  export must import unchanged.

---

## 7. What I am asking for

A ruling on §5(a) through §5(g), a staging decision, and a binding sequence.
If the answer is that this should not be built in the shape the user chose, I
would rather have that now than after it ships.
