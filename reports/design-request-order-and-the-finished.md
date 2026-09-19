# Design request — the order of the list, and what happens to the finished

**For the Chief Architect.** Two requests from the owner, in one sentence, on the screen Round 17 and the above-the-list ruling have just spent four agents on:

> *"when we see the list let's sort into less money debt is first then higher money is last, and when we paid completely merge into the one label or beneath dropdown tool"*

**Both collide with something in force, and I am opening on the collisions rather than on the shapes.** The first is refused by name in the shipped file. The second is the thing you named as the answer to the list's real problem — and it is also, in the owner's own words, the control you put on the off-limits list four hours ago.

---

## 1. What the owner asked for, split

| | |
|---|---|
| **(A) Order** | Live debts sorted by amount, smallest first, largest last. |
| **(B) The finished** | Cleared debts collapsed — *"merged into one label"*, **or** *"beneath a dropdown"*. They offered both shapes; neither is mine. |

---

## 2. (A) is refused by name in the shipped file, and I am quoting the refusal rather than working around it

`renderDebts`' sort comment:

> **ONLY the cleared/live split is imposed.** Sorting the live debts by size or by age would have this app **assert a repayment order** — largest-first and oldest-first are competing strategies with real advocates — and nothing on this screen has earned the right to recommend one. The user's own order is information; it is left alone.

**Smallest-first is the snowball method.** Largest-first is avalanche. The comment refuses both, by name, and it refuses them for a reason that has not changed: a list is an ordering, and an ordering is a recommendation whether or not a word accompanies it.

**Three things I want on the record before you rule.**

**(a) The owner is not a user, and that may or may not matter.** The comment's concern is *this app* recommending to *a user*. Here the product's owner is choosing a product default. That is the user-states / app-infers distinction that carried the fee calculator's narrowing — **but it does not obviously transfer**, because the fee calculator's stated rate came from the person it was shown to, and this order would be shipped to every user by someone none of them has met. **I think that is the whole question and I cannot settle it.**

**(b) `PAY-01` found that snowball and avalanche differ by zero tugrik on this data model**, because `totalToRepay` is fixed at agreement and nothing reduces it. So ordering smallest-first recommends a strategy that, on this application's own arithmetic, saves nothing. **The argument for it is behavioural, not financial** — clearing a small debt is evidence the loop can be escaped, which is `product-strategy.md`'s first mission item in a different register. That argument is real and it is also exactly the kind this module has refused four times when it arrived as a figure.

**(c) There is a shape the comment does not refuse, and I am naming it in case it is the answer:** sort by **what is still owed** rather than by what was borrowed. It is the figure the card leads with, it changes as payments land, and *"show me the one I am closest to finishing"* is a statement about the user's own position rather than a strategy with advocates. **I hold this weakly.** It is still an ordering, and the comment's argument may reach it.

---

## 3. (B) is the item you said the list needed, and the shape the owner named is off limits

**Your own Round 17 risk note:** *"Twenty debts at 258px is a 5,160px scroll with no grouping and no collapse, and the sort only sinks cleared debts. The answer when it arrives is grouping or collapse, not another 30px."* The above-the-list ruling repeated it as the route back for 320: *"the route back for 320 is the list itself — grouping or collapse — and never another thirty pixels above it."*

**This request is that answer arriving, and the owner brought it unprompted.**

**And the owner's second phrasing — "beneath dropdown tool" — is a second disclosure control on the Debts screen, which you reaffirmed at full width four hours ago**, against the best argument I could make for narrowing it: *"two chevrons on one screen is two chevrons… a second one teaches the user that this screen hides things, which is the opposite of what the first one was for."*

**I am not asking you to reverse that on the owner's say-so.** I am asking you to rule which of these it is:

**Shape 1 — one label, no control.** Cleared debts do not render as cards. In their place, one line: *three debts finished*. **The problem is access:** a cleared card today still carries five controls — payment history, un-settle, edit, delete — and `SET-03`'s reversal path runs through the ✓ on that card. A label that hides them makes an un-settle unreachable, which would be the first thing this module has hidden that the user needs to undo something.

**Shape 2 — the dropdown the owner named.** Solves access and is the entry you closed. **If it is narrowed, the narrowing has to name why finished debts are different from a cost disclosure** — and I think the difference is real: the first `<details>` moved a form *the user completes once* out of the way of the thing they return for, and finished debts are the same class of object. That is an argument for consistency with the first control rather than against it. **Your counter stands: two chevrons is two chevrons.**

**Shape 3 — collapse with no new control at all.** The cleared group renders as a label that is itself the toggle — a row the user taps, no chevron, no `<details>`. **I suspect this is a chevron wearing a different hat** and you will say so, but it is on the table because it is the only shape that solves access without adding the thing you refused.

**Shape 4 — neither, and the list keeps sinking cleared debts as it does now.** Available, and the honest outcome if `SET-03`'s reversal cannot survive any of the above.

---

## 4. Five things I cannot settle

**(a) Does (A) even help?** The owner has not said their list is badly ordered — they have proposed a rule. If their real complaint is that finished debts clutter the list, **(B) alone fixes it and (A) is a change with a cost and no stated problem.** I would rather ask than build both.

**(b) What counts as "paid completely" for the grouping — `debtSettled`, or `paidInFull`?** They differ, deliberately: a debt settled early for less than agreed is `cleared` but not `paidInFull`, and this module spent a ruling establishing the distinction. **The owner said "when we paid completely", which is `paidInFull`'s words and `debtSettled`'s meaning.** I think the grouping keys on `debtSettled`, because that is what already sinks them and what the card already labels *✓ Cleared* — but it is a real fork and I am not choosing it.

**(c) What happens to the summary tiles?** *Paid back so far* and *Cost so far* aggregate over every debt including cleared ones. If cleared debts collapse out of the list, **the figures above the list still count them** — correctly, but a user who has "put away" three debts may read the totals as describing only what is visible. Nothing on screen would say otherwise.

**(d) Does the collapsed group survive a reload?** Anything remembered is a stored field or a new key, and both are off limits at exactly the width they were granted. **I am assuming it does not** — collapsed on every render, expanded per visit — and I want that confirmed rather than discovered.

**(e) What does this do to the geometry guard?** `ABL-03`'s assertion has 30px of slack at 390 on a five-record fixture with **one** cleared debt. Collapsing it changes that fixture's arithmetic. **The guard must not be edited to accommodate the change** — that is on the off-limits list by name — so if the flow reddens, the work stops and comes back to you.

---

## 5. What I am asking for

1. **Rule §2** — whether the app may impose an order at all, and if so which figure it sorts on. **The comment refusing it is shipped and is quoted above; anything that overrules it also replaces it.**
2. **Rule §3** — which of the four shapes, including shape 4.
3. **If shape 2, rule the narrowing explicitly**, because the entry is four hours old and whoever reads it next needs the reason beside it.
4. **Rule §4(a)** — whether (A) should be built at all if (B) is what the owner is actually feeling.
5. **Rule §4(b)**, the key: `debtSettled` or `paidInFull`.
6. **Confirm §4(c)**, **§4(d)** and **§4(e)**.

## 6. What I am not asking for

Not a payoff plan, an avalanche/snowball *recommendation in words*, a saving, a projection, or any figure comparing debts (`PAY-01` and `PR1`–`PR13` carried entire). Not a change to any figure, derivation, gate, rate sentence, storage shape or write path. Not a new storage key, schema field, `SCHEMA_VERSION` bump or migration — including for a remembered expand state. Not a fifth tile, a fifth chip, a fourth gated line or a sixth control. Not the deletion of any cleared debt, its card's controls, its history or its schedule (`SCR15`). Not an app-wide sweep. Not a Mongolian string.

---

## 7. One thing on the record

**The owner has now asked, unprompted, for the exact thing two of your rulings named as the list's real answer** — and they asked for it in the same breath as a control you had just refused. That is worth saying plainly because it cuts both ways: it is evidence the collapse is wanted by the person who uses this, and it is not evidence that the chevron is the right way to give it to them.

---

## 8. Addendum — the owner answered §4(a) and §3's access problem before this was ruled

Both were put to them the moment this request was written. **Neither answer is a shape; both remove an assumption I would otherwise have asked you to make.**

**§4(a) — why smallest-first.** Offered three readings — a strategy, a tidier list, or "the finished ones are the real problem" — they chose: **"Clear the small ones first… finishing one proves the loop can be broken."**

**So (A) is not a tidiness preference and I am not able to present it as one. The owner is deliberately asking this application to encourage the snowball method.** That is the thing `renderDebts`' comment refuses and it is now refused against an explicit product instruction rather than against an inferred one. **It makes §2(a) the whole question and it makes §2(c) — sorting on what is still owed — a worse answer rather than a better one**, because it would dress a strategy the owner has named in the clothes of a neutral figure.

**What it does not settle**, and I am saying so rather than letting the answer do more work than it can: `PAY-01`'s finding stands unchanged — on this data model the strategy saves zero tugrik — so what the owner is asking to encourage is a **behavioural** claim, and this module has refused four behavioural claims when they arrived as figures. Whether it may arrive as an ordering is yours.

**§3 — access.** Offered a count line with no control, a control, or "you decide", they chose: **"Yes — I must be able to open them."**

**So shape 1 is dead by the owner's own answer**, and the live choice is between **shape 2** — the control you closed four hours ago — and **shape 3**, the tappable label that is either a real alternative or a chevron wearing a different hat. **Shape 4 remains available** and its cost is now explicit: it leaves the owner's request unanswered in both halves.
