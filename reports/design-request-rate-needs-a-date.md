# Design request — the calculator that says nothing

**For the Chief Architect.** This is an **owner observation**, not a feature idea, and it is recorded here first because that is what fires half the deferrals in this module.

> **2026-09-19, the owner, on adding a debt:** *"If I add the debt it asked insert pay back money it's required thing."*

They are describing `FEE-01…04`'s own screen, six weeks after asking for it, and the thing they hit is not the requirement. **It is that the field which would have filled it is two fields below it, labelled optional, and says nothing when it is missing.**

---

## 1. What is true at source

Verified in `expense-pwa/index.html`, not recalled:

| | |
|---|---|
| **The total is required** | `debtAdd` refuses `totalToRepay <= 0` with *"Enter the total you will pay back"*. The field carries the asterisk and `aria-required="true"`. |
| **The calculator fills it from three inputs** | `feeRecalcTotal` reads `debtRate`, `debtPrincipal`, `debtDate` and **`debtDue`**. |
| **`debtDue` is below the field it fills** | Form order: name, amount borrowed, **monthly rate**, **total**, date borrowed, **due by (optional)**. |
| **With no due date, the calculator returns `null`** | `feeTermMonths` has no span, so `feeComputeTotal` returns `null`. |
| **And `null` is rendered as silence** | `feeReportWorking(null)` sets the line to empty, hides it, and restores `debtFamilyHelper`. |

**So the sequence the owner actually walked is this.** Type the rate at field three — the helper under it promises *"Fills in the total below"* — look at field four, and nothing has happened. Nothing says why. The one input that would make it work is two fields further down and the form calls it optional.

**The requirement is not the defect. The silence is.**

---

## 2. Why I am not proposing to make the total optional

Stated first so it is refused by me rather than by you. **The two amounts ARE the record**, and the add form's own comment says so: every figure this module derives comes from `principal` and `totalToRepay`, and the difference between them is the cost of borrowing, which is the number the screen exists to show. A debt with no total is a debt with no cost, no rate, no outstanding figure and no progress bar. **Not proposed, and the observation does not ask for it.**

---

## 3. This module has ruled on this exact shape once already

`renderDebts` carries a gated line — `.debt-rate.ask` — added as **the only High finding of its review round**, and its comment records the reasoning in terms that transfer without adaptation:

> the due date is labelled optional and its helper described only what the field does NOT do, so it reads as skippable to everyone, including someone with a lender's loan and a term they could have typed. Silence meant two users of the same application saw structurally different screens and neither was told why, on the figure the product exists to show.

**The card was fixed. The form it is filled from was not, and the form is where the user is standing when the decision is made.**

---

## 4. What I propose

**One sentence, in the element that already exists, in the state that currently renders nothing.**

`#debtRateWorking` is already there, already `role="status"`, already `aria-live="polite"`, already hidden when there is nothing to say. When a rate has been typed and the calculator cannot run, it says what is missing instead of hiding.

> **Ruled wording wanted. My draft: `Add the date this has to be repaid by and this will fill in the total.`**

It names one action and stops — the ask line's own discipline. No new element, no new field, no new class, no CSS, nothing stored, no change to `feeComputeTotal`, `feeTermMonths` or any write path.

---

## 5. Five things I cannot settle

**(a) The line's copy is closed at one sentence, permanently, by its own comment.** This adds a second state to that element, not a second sentence to a state. **I think that is the distinction and I want it ruled rather than assumed**, because it is the same argument `PDT-01` won in the edit modal and it could be the argument that erodes both.

**(b) The slot is shared with `debtFamilyHelper`.** *"If a family member lent it with nothing extra to pay, put the same amount in both"* renders exactly when the working line does not. A third occupant means a rule about which of three things renders, and **I would rather that rule be written down than discovered.**

**(c) When does it fire?** Once a rate is typed, the calculator can fail for two reasons: no due date, or no amount borrowed. **Naming both is a form that nags**, and the amount borrowed is field two with an asterisk on it — the user is going to fill it. My instinct is: fire only on the missing due date, and only once the rate and the amount are both present. Ruling wanted.

**(d) Should the due date move above the total instead?** It is the smaller sentence and the larger change: field order is the one thing on this form that every other decision has been layered on top of, and moving an optional field above two required ones would be a claim about what this form is for. **I am not proposing it. I want it refused rather than unproposed**, because it is the first thing the next person will suggest.

**(e) Does the due date stop being labelled "(optional)"?** It is genuinely optional **for the record** and genuinely required **for the calculator**, and the label cannot say both in two words. **I lean to leaving the label alone** and letting the new sentence carry it, but a field labelled optional that a sentence asks for is a small contradiction and it is yours to price.

---

## 6. What I am asking for

1. **Rule §4** — the sentence, its wording, or that it does not ship.
2. **Rule §5(a)** — a second state on a closed element.
3. **Rule §5(b)** — the three-occupant rule for that slot, written down.
4. **Rule §5(c)** — the firing condition.
5. **Refuse §5(d) by name**, or rule it.
6. **Rule §5(e)** — the label.

## 7. What I am not asking for

Not a change to what is required. Not a rate stored anywhere. Not a months field, a term field or any second term source (`ER7`). Not a calculator in the edit modal. Not a schedule on the add form (`SCD1`, deferred, not fired by this). Not a change to `feeComputeTotal`, `feeTermMonths`, `feeParseRate`, `debtAdd` or any write path. Not a toast, a dialog, a tooltip or a new element. Not a Mongolian string.

---

## 8. One thing on the record

**This is the first request in this module that came from the owner using it rather than from anyone reading it**, and what it found is not a bug — every function does what it was ruled to do. It is a seam between two correct pieces: a calculator that needs four inputs, and a form that presents one of them as skippable, below the field it fills, with no line connecting them.

**Eight rounds of review did not find it and one afternoon of use did.** That is worth a sentence in the record whatever you rule.
