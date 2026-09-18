# Design request — the payoff plan

**For the Chief Architect.** Build-sequence item 2 in `knowledge/product-strategy.md`, and the largest thing asked of this module since it shipped.

**It contains a figure I believe this architecture has now permanently forbidden, and that is the first thing in this document rather than the fourth.**

---

## 1. What the strategy asks for, verbatim

> **The payoff plan.** Avalanche and snowball over the recorded debts, with the projection that pairs with them — pay this much more, finish this much sooner, save this much. Builds directly on 1. Also free.

Three outputs: an **order**, a **date**, and a **saving**.

---

## 2. The saving is not computable, and I think it is not fixable

**`totalToRepay` is fixed at agreement and nothing in this application reduces it.** Verified at source: it is written by the add handler and by the edit modal, both from a field the user typed, and by nothing else. There is no amortising balance, no accruing interest, and no per-period recalculation anywhere in the module.

So on this data model, **paying faster does not reduce what is owed.** A debt of ₮1,360,000 paid over six months instead of twelve is still ₮1,360,000. "Save this much" is zero, always, by construction.

It is not zero in the world — the owner has stated that a Mongolian lender repaid early charges only the months the money was held, and that fact is in the assumptions table. **But computing what that saves is exactly the time-attributable cost model you refused at `Q1` of the early-settlement ruling**, on three independent grounds, and reaffirmed at `SAV-01`. Nothing since has changed any of them.

**So the strategy's own sentence asks for a figure that is either always zero or permanently off limits.** I am not proposing a way around it. I am asking you to rule which half of the sentence survives.

There is a further reason to be careful here, which is `DR4`'s: **"save this much" is the vocabulary you reserved for this very item** when you refused it to `SAV-01`. If the saving is not computable, the word arrives at the item it was reserved for with nothing to attach to.

---

## 3. What IS computable, exactly

| Output | Available? | From |
|---|---|---|
| **An order** — which debt to clear first | **Yes.** | Avalanche: `debtAnnualCostRate`, already shipped and ruled, a stored-data comparison. Snowball: `debtOutstanding`, smallest first. |
| **A finish date** per debt and overall | **Yes, given one input the app does not have.** | What the user can pay per month. |
| **A saving** | **No.** | §2. |

**The missing input is the whole of the interaction.** The application does not know what the user can afford monthly, it is not derivable from income and expenses without a model of their life, and it is exactly the sort of number this module has four times refused to infer.

---

## 4. Four things I cannot settle

**(a) Is a projection an "assumed repayment pattern"?** That phrase is on the off-limits list, added at the fee ruling and reaffirmed twice. A payoff plan is a repayment pattern by definition. **My argument that it differs** is the one that won the fee calculator: the pattern is **stated by the user** ("I can put ₮50,000 a month at this"), not **inferred by the application** from a contract it has never seen. Whether that distinction carries this far is yours, and it is the question the whole request turns on. If it does not, this item ends here.

**(b) Where does it live?** `project.md` lists modules by destination. This is either a new screen, a section of the Debts screen, or a sheet. The Debts screen has an add form at ten controls, a card with five controls and three gated helper lines, and a summary block closed at three sentences. **I do not think it fits there**, and a new screen is a change to the application's shape that no request has made since Debts itself.

**(c) Does it store anything?** The monthly amount is either typed each time — a form-time input, the `FEE` shape, storing nothing — or remembered, which is a second new field and would test a prohibition narrowed exactly once, for `settledOn`, on the ground that no derivation could substitute. That ground does not obviously apply here.

**(d) What does it do about settled debts?** `debtSettled` is live. A plan that includes debts the user has marked finished would be planning to pay money nobody is owed.

---

## 5. What I am asking for

1. **Rule §2.** Is "save this much" dropped, redefined, or does its absence sink the item? I see no fourth answer.
2. **Rule §4(a)** — whether a user-stated repayment pattern is outside the prohibition, or is the assumed pattern by another name. **If it is the latter, this request ends and the strategy's item 2 needs rewriting rather than building.**
3. **Rule §4(b)**, the home, including whether a new screen is admissible at all.
4. **Rule §4(c)** — form-time input, or a stored preference.
5. **Confirm §4(d)** — settled debts are excluded.

## 6. What I am not asking for

Not an amortisation schedule, not an effective rate, not APR, not a time-attributable cost, not a second rate on any card, not a change to any existing derivation or write path, and not a fifth summary tile. Not a projection stated as a promise about what a lender will accept.

---

## 7. One thing I want on the record before you rule

Every debt item since the decoder has come in smaller than I scoped it — the paste control was removed as unneeded, the settle act turned out to need one field, and `SAV-01` turned out to be a second label on a number already in scope. **This one is the opposite shape: it is the first request that plausibly needs a new screen, a new input, and a projection over multiple records.** If the answer to §5.2 is no, the cheapest outcome available today is that the strategy's build sequence loses item 2 and the language layer moves up — which would be a product decision for the owner, not a failure of this request.
