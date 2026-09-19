# Design request — what the bell says about an agreed repayment

**For the Chief Architect.** This fires `SCD2`, deferred at the repayment-schedule ruling and carried unchanged through three rulings since. Its trigger was *"`SCH-02` on `main`, and its own scoped request answering one question — what the bell says about an instalment that fell due and was not paid."*

**`SCH-02` reached `main` at `a7b6edf` and is live at v22.** This is that request, and §3 is that question.

---

## 1. What exists today, verified at source

`computeReminders`' debt branch emits **at most one item per debt**, keyed `debt:<id>`, and only when all of these hold: the `showDebts` setting is on; the record has a `dueDate`; that date is at or before the `daysAhead` cutoff (default 7); `debtSettled(d)` is false; and `debtOutstanding(d)` is above zero.

> `title`: `Debt due: <name>` `sub`: `<dueDate> · <outstanding> still owed`

**It has no lower bound, so an overdue due date keeps reminding** — deliberately, and the comment says so. **Two things clear it:** the debt is paid off, or the user marks it settled. Both are facts in the record.

---

## 2. What is derivable, and what is not

A schedule is `{instalment, count, firstDue}`. **The date of the next agreed payment is `firstDue` walked forward through `stepDate`'s monthly branch until it reaches or passes today, bounded by `count`.** It reads the record and the clock and nothing else.

**It does not read `db.debtPayments`, and it must not.** `SCR6` refuses *"any figure comparing the schedule with `db.debtPayments` — behind by, missed, arrears, instalments remaining, on track"*, and the schedule ruling put the general form as a rule: **the record holds the agreement; the application never scores performance against it.**

---

## 3. The question `SCD2` was deferred on, and my answer

> **What does the bell say about an instalment that fell due and was not paid?**

**My answer: nothing, and that is the rule rather than a gap. I want it ruled rather than assumed, because the opposite answer is available, is attractive, and I think it is a trap.**

**The attractive shape.** Walk from `firstDue` and stop at the **earliest** instalment — including one already in the past. The bell then shows *"a payment you agreed to fell due on 15 August"*, which is a fact about the agreement and not a claim about the user's conduct, so it looks like it slips past `SCR6` on the same distinction that carried the payoff date.

**Why I think it is a trap, and this is the whole of my argument.** **An overdue instalment has nothing that can clear it.** The due-date item clears on two recorded facts — the debt is paid off, or the user says it is settled. An instalment has neither. Nothing in this record says an instalment was paid; `SCR5` refuses a per-instalment ledger, a paid mark and a cursor, permanently and by name. So a bell item for a past instalment **would sit there until the entire debt was settled**, unchanged, for months, whatever the user did. A user who paid on time would be told they had not, by an application with no way of knowing either way.

**That is worse than silence and it is worse than the thing it is trying to fix.** So the walk returns the next occurrence **at or after today**, and a missed payment is simply not something this application is in a position to notice.

**What the user is not left with nothing.** The debt's own `dueDate` item still reminds, still has no lower bound, and still goes overdue in the bell exactly as it does today. **The schedule adds a nearer prompt, never a judgement.**

---

## 4. Five things I cannot settle

**(a) Which item renders when a debt has both a schedule and a due date?** `SCD2`'s fences say **one item per debt, never one per instalment** and **it does not silently displace the due-date item**. Those two together allow only: the schedule item takes the slot and you rule the displacement **explicitly**, or both render and a scheduled debt produces two bell items. **I lean to displacement** — the next agreed payment is the nearer and more actionable of the two, and two items for one debt is how a bell becomes noise — but "not silently" is your word and the ruling is what makes it not silent.

**(b) Does it ride `showDebts`, or does it need its own setting?** It rides `showDebts`, I think: it is the same kind of fact on the same screen and a second toggle for a sub-case is a settings screen growing a row per feature. **But a user who wants due-date reminders and not monthly ones has no way to say so**, and I would rather you refuse that than have me assume it.

**(c) What does the walk cost, and what bounds it?** `debtPayoffDate` already walks this series under `DEBT_SCHEDULE_MONTHS_MAX` — 600 — and returns `null` above it. **`computeReminders` runs on every bell update and on every render that touches the badge**, which is a different budget from a form-time line. I am proposing the same ceiling and the same engine, and I want confirmation that a bounded 600-step walk per scheduled debt per bell update is acceptable, because nobody has measured it and I am not going to claim it is free.

**(d) What happens when the schedule has run out?** Every instalment is in the past, so the walk returns nothing. **The schedule item does not render and the due-date item is what remains** — which is right, but it means a debt whose agreed payments have all fallen due goes quiet in the schedule sense while still being owed. Stated so it is a decision.

**(e) What does the item say?** The due-date item's `sub` carries a date and a figure. Mine would carry the instalment amount and the date — *"15 October · ₮170,000 due"*. **No count, no ordinal, no "payment 4 of 12"**, because a count is the instalments-remaining figure `SCR6` refuses, wearing a label. I have not drafted the `title` and I am not going to, because wording in this module has been load-bearing five rulings running.

---

## 5. What I am asking for

1. **Rule §3** — the next occurrence at or after today, or the earliest including overdue. **If the latter, rule what clears it**, because I cannot find anything in the record that could.
2. **Rule §4(a)** — displacement or two items, and if displacement, say so explicitly.
3. **Rule §4(b)** — the setting.
4. **Rule §4(c)** — the walk's cost and ceiling.
5. **Confirm §4(d)**.
6. **Rule §4(e)**, the item's wording, including the `title`.
7. **And whether this ships at all.** A nearer prompt is a real gain for a user repaying monthly; it is also the first time a debt has produced a recurring bell item, and `SCD2` has been deferred through three rulings without anybody asking for it.

## 6. What I am not asking for

Not a per-instalment ledger, a paid mark, a cursor or any stored field (`SCR5`, carried). Not a figure comparing the schedule with recorded payments in any form (`SCR6`, carried). Not a planned expense, and not any debt figure on a period-filtered surface (`C38`, and the comment above the existing branch). Not a second item per instalment. Not a change to `debtPayoffDate`, `debtEffectiveAnnualRate`, `debtSettled`, `debtProblem`, the schedule's shape or any write path. Not a new storage key, schema field, `SCHEMA_VERSION` bump or migration. Not a new harness runner, probe or predicate. Not a Mongolian string.

---

## 7. One thing on the record

**Every previous request in this module argued for showing the user something more. This one argues for showing them less than the data would permit** — the schedule and the ledger are both in the record, and putting them side by side would be one line of code.

**The reason not to is not that it would be untrue.** It is that the application would have no way to stop saying it. This module has spent eleven rulings establishing what it may claim; `SCD2` is the first item where the binding question is what it could never take back.
