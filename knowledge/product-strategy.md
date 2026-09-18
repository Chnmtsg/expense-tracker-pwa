# Product Strategy

Written 2026-09-18. This file states who the application is for, how it earns
money, and what it will never do to earn money.

It is subordinate to `knowledge/project.md` on what the application IS, and it
outranks it on who the application is FOR. Where the two disagree about the
user, this file is the one that was written knowing the answer.

---

## Mission

Mongolia has a large non-bank lending sector. Young people borrow from it, and
the terms compound faster than they expect, so the borrowing repeats. The loop
is the problem, not the first loan.

This application exists to break that loop for one person at a time, by doing
three things in order.

1. Record what is actually owed, so the number is known rather than feared.
2. Show what the borrowing costs, in tugrik and as a rate.
3. Show the way out, as a plan with a date on it.

Recording expenses is how the application earns the right to do the other two.
It is not the point.

---

## Target User

A young person in an urban centre, with a smartphone, some income, and at least
one non-bank loan.

They know two numbers about that loan: what reached their hands, and what the
lender says they will pay back. They do not know their APR, and nothing in the
application may require them to.

`project.md` already states the general rule — little accounting knowledge,
every screen understandable without training. This user is that user under
financial stress, which makes the rule stricter rather than looser.

---

## The Binding Constraint

**An application that helps people escape debt must never charge the people
deepest in it.**

If a user in a payday-loan spiral ever borrows to keep a subscription current,
the product has become the thing it was built to fight. That is not a risk to
be managed. It is a line.

So the free tier is defined by purpose, not by generosity.

**Free, permanently, and not subject to future repricing**

- Recording income, expenses and debts
- Cost of borrowing, and the true rate
- The payoff plan
- Due-date reminders
- Local backup and export

**Paid**

Convenience and insight. Never escape.

Anything that helps a user get out of debt is free. Anything that saves them
time or effort once they are stable may be charged for. When a new feature is
proposed, that question is asked first, and it is not a close call — a feature
that cannot be sorted onto one side stays free until somebody argues it across.

This is also the stronger commercial position. Free debt tracking is the
acquisition funnel and the entire marketing claim.

---

## Language

**Mongolian first, English second.** Mongolian is the default.

The application is English-only today — `<html lang="en">`, and every string in
`expense-pwa/index.html` a literal. It is already Mongolian in every other
respect: whole tugrik throughout, a layout tuned for seven-figure MNT amounts,
and a salary calculator carrying Mongolian social insurance and withholding
rates over hourly, overtime, night and field-allowance pay.

The language gap is therefore the only thing standing between the application
as built and the user it is for. Nothing else on this roadmap reaches that user
first.

It requires a language layer in a single-file application whose architecture
ruling says no new abstraction. That ruling was made about cards and icons
rather than about reaching the user at all, but it is not for this file to
overturn: the language layer needs its own Chief Architect decision, taken on a
scoped proposal, before a line of it is written.

English is kept rather than replaced. It costs one extra column in a string
table once the table exists, and dropping it would close a door in exchange for
a saving that only exists before the table is built.

---

## Revenue Model

**Freemium consumer subscription.**

Priced in tugrik. Never in dollars, and never converted at display time — a
price that moves with the exchange rate is a price nobody trusts.

| Period | Price |
|---|---|
| Monthly | ₮4,900 |
| Yearly | ₮39,000 |

The yearly price is two months free. It exists to reduce renewal friction, not
to raise revenue per user.

### What is paid

| Feature | Why a user pays |
|---|---|
| Cloud sync and backup | A broken phone otherwise destroys years of records. Half-built already — `initFirebase`, `syncToCloud`, and Google sign-in behind `isFirebaseConfigured()`. |
| Bank SMS auto-capture | The major banks send an SMS per transaction. Drafting entries from them is the difference between an application abandoned in week three and one that is kept. |
| Household sharing | Mongolian households pool income. One tracker per household is closer to how the money moves than one per person. |
| Reports and export | Wanted by people who are already stable, which is the right side of the line. |

SMS capture is the highest-value paid feature and the highest-risk one. Android
restricts the permission to applications whose core function is SMS, and iOS
cannot do it at all. It ships with a paste or share-sheet path that works
everywhere, and the automatic path is an enhancement on top of that — never the
only way in.

### What is not a revenue source

**Advertising.** Rejected. It costs the trust a financial application runs on,
and at Mongolian ad rates it would not cover hosting.

**Paywalling the user's own history.** Rejected. Their records are theirs.

**Lead generation to non-bank lenders.** Rejected permanently. It is the single
change that would turn this application into the problem it was built against,
and no price makes it acceptable.

**Selling user financial data.** Rejected permanently.

---

## Deferred, With Triggers

These are real options. Neither is scheduled, and each states what would put it
on a roadmap.

| Option | Trigger |
|---|---|
| **Employer seats.** The salary calculator already models mining and construction payroll, and those employers carry the wage-advance problem among their staff. One 500-person company at roughly a dollar per employee per month is one conversation for what several hundred consumer signups earn, and it charges no indebted person anything. | An employer asking, or consumer conversion measured below 2% after the paid tier has run six months. |
| **Refinancing referrals.** Moving a user off a non-bank loan and into a bank loan is a genuine win and a paid lead. It is also the nearest neighbour of the rejected item above, which is why its conditions are written before anyone wants it. | Only after the paid tier sustains itself, and only with all three of: disclosure on the screen where it appears, ranking by user cost alone, and no money accepted from non-bank lenders. Failing any one, it does not ship. |

---

## Unverified Market Assumptions

These shaped the plan above and none of them is established in this repository.
Each is recorded so a wrong one can be traced to what it decided, rather than
surviving quietly as a fact.

| Assumption | What it decided | How it gets settled |
|---|---|---|
| The addressable segment is several hundred thousand people | Whether a consumer subscription can reach useful scale at all | Published population and mobile-penetration figures |
| Free-to-paid conversion of 3–5% | The install volume needed for a given revenue, and the employer-seats trigger above | Measurement, after the paid tier ships. Not before. |
| ₮4,900 is affordable but not trivial for this user | The price | Willingness-to-pay conversations with real users, before any payment work is scoped |
| QR-invoice rails with prepaid periods are the practical way to collect money, and app-store billing is not | The shape of the payment work, and its margin | Merchant documentation, read before that work is scoped |

The owner of this file knows this market and the repository does not. Where the
two disagree, the owner is right and this table is what gets corrected.

---

## Build Sequence

Ordered by what unblocks what, not by value.

1. **The true cost decoder.** Add the loan term to the debt record and show the
   annualised rate. The data is nearly all there — `debtProblem` already holds
   principal and total-to-repay, deliberately, for exactly this user. A lender
   quoting a monthly percentage sounds small; the yearly figure does not. This
   is the number most likely to change what somebody does, and it is free.
2. **The payoff plan.** Avalanche and snowball over the recorded debts, with
   the projection that pairs with them: pay this much more, finish this much
   sooner, save this much. Builds directly on 1. Also free.
3. **The language layer.** Scoped, ruled on, then built. It is what reaches the
   user; the two items above are what it reaches them with, which is why it is
   third rather than first.
4. **Cloud sync, hardened.** The paid boundary goes here, so this is the first
   item that needs accounts to be real.
5. **Payments.** Last, and scoped only once retention data shows that somebody
   would renew.

Items 1 and 2 each need one review cycle, and neither needs a new storage key.

**Nothing in this sequence changes the architecture.** Single file, no build
step, no framework, offline-first. The language layer is the one item that
touches it, and it goes through the Chief Architect before it is written.
