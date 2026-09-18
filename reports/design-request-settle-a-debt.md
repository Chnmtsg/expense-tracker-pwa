# Design request — letting a user say a debt is finished

**For the Chief Architect. `ED1`, fired.** The trigger you set was the owner's
answer to the single question in the early-settlement ruling. They answered
**yes**, and it is recorded in `reports/HANDOFF.md` with the date.

This is the scoped request that ruling said it would have to arrive as.

**It asks for the first new stored fact about a debt since the module shipped,
and it therefore tests the prohibition on any new storage key, schema field or
migration — which has held for four consecutive requests.** That is stated
first, not discovered in §4.

---

## 1. What is being asked, and the fences already on it

The owner wants a debt they have paid off early to stop being reported as
outstanding. Your `ED1` row pre-ruled the shape and I am not proposing outside
it. Restated so this document can be read alone:

- **One dated fact about an event that happened.**
- Written **only by an explicit user act** on a debt the user considers
  finished — never inferred, never defaulted, never derived.
- **Optional, absent on every existing record**, and absent and explicit `null`
  treated identically — the `dueDate` lesson carried verbatim.
- **Does not change `totalToRepay`, does not write `db.debtPayments`, and does
  not alter one tugrik of what the user recorded.**
- **Is not a schedule and may not become the first entry of one.**

`ED2` — the saving itself, `agreed − paid` — is **not** in this request and
does not travel in its commit.

---

## 2. What it is

A single optional ISO date on the debt record. Working name `settledOn`.

```
{ id, name, principal, totalToRepay, date, dueDate, notes, settledOn? }
```

It means exactly one thing: **the user says this debt was finished on this
day.** It is not a payment, not an amount, and not a claim about what the
lender charged.

**On the prohibition.** Every request since Round 15 has avoided storage and I
have argued each time that avoiding it was the smaller change. It is not this
time, and the early-settlement ruling is why: *"no automatic test can
distinguish 'settled early' from 'still owes the difference' without the fact
that distinguishes them."* There is no derivation available at any price. The
choice is this field or the state stays broken, and I am not going to dress a
third model up as an alternative.

**Migration.** None. `migrate()` is append-only and numbered; an optional field
absent from every existing record needs no step, exactly as `dueDate` needed
none. `debtProblem` gains one clause in `dueDate`'s own shape: present and
malformed is refused, absent or `null` is normal.

---

## 3. What changes on screen, and the line I think matters

**The module's test for a finished debt becomes: nothing outstanding against
the agreed total, OR the user has said it is settled.**

That one predicate is the lever for three of the four harms your ruling listed
— the card sinks below live debts, the due chip stops being overdue, and
`computeReminders` stops notifying. All three already key off the cleared test
rather than off the money.

**`debtOutstanding` does NOT change, and this is the part I want ruled.** It
reports `totalToRepay − debtPaid`, which on a settled-early debt is a true
statement about the record: the user agreed to ₮1,360,000 and handed over
₮1,120,000. That figure is not wrong. What was wrong is calling it *owed*.

So a settled card would carry a figure it must not label "still owed" —
and the honest label for it is the saving, which is `ED2` and is deliberately
not in this request. **I think that leaves a gap this request cannot close on
its own**, and I would rather you rule on whether `ED1` can ship alone than
discover it in review.

**`debtInterestPaid` I am not proposing to touch.** On a settled-early debt it
reports cost allocated across payments that stopped early, which overstates.
That is the same class of wrongness the early-settlement ruling refused to fix
with a model, and I am not fixing it with one here.

---

## 4. Where the act lives — three shapes, none chosen

The card's action row already carries `+ Payment`, history, edit and delete.

| | |
|---|---|
| **A** | A fifth control on the card. Most discoverable, and the row is already four buttons wide at 320px. |
| **B** | Inside the edit modal, as a dated field. Cheapest, no new control, and it puts a state change behind a screen labelled for correcting typos. |
| **C** | A confirm dialog from a card control, on the delete precedent — the act is irreversible-ish and states what it will do. |

I lean **C** for the act and **A** for reaching it, but the row width at 320px
is a real constraint and I have not measured it.

---

## 5. What I am asking for

1. **Rule on the field** — the name, and whether `settledOn` as one optional
   ISO date is the right object.
2. **Rule on §3's gap**: can `ED1` ship without `ED2`, given a settled card
   would show a figure whose only honest label is the one `ED2` provides?
3. **Rule between A, B and C**, or reject all three.
4. **Rule on reversibility.** A user who marks a debt settled by mistake needs
   a way back. Clearing the field is the obvious one and it is a second write
   path into the same fact.
5. **Rule on what a settled debt does to the summary tiles** — "Still owed"
   aggregates `debtOutstanding` across debts, and a settled debt contributing
   its difference to that total is the original harm at the aggregate level.

## 6. What I am not asking for

Not `ED2`. Not a change to `totalToRepay`, `debtPaid`, `debtInterestPaid` or
either write path. Not a schedule. Not an amount alongside the date. Not a
second settled-like state anywhere else in the application.
