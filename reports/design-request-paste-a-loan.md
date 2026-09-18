# Design request — reading a lender's message into the debt form

**For the Chief Architect. This is a design request, not a review finding.** It
follows `reports/design-request-debt-tracker.md` and
`reports/design-request-true-cost-decoder.md`, the instrument this project uses
when the product owner asks for something that does not exist.

It asks for a ruling only. Nothing is built.

---

## 1. What the product owner asked for, and what they chose

The request was for a **screenshot** to be read and the debt written in
automatically. Two decisions were put to them against stated alternatives and
both were taken:

1. **Text, not an image.** The user pastes the lender's message; no OCR. The
   alternatives offered were on-device OCR (Tesseract.js lazy-loaded on the
   `loadFirebaseSDK` precedent) and cloud vision through a proxy. Both were
   declined in favour of the path that needs no dependency, no backend and no
   network.
2. **Free, permanently.** Recording a debt is on the permanently-free side of
   `product-strategy.md`'s binding constraint, and auto-filling the same form is
   the same act done faster.

The owner's stated goal is the one in the mission: get the debt recorded
correctly, with less typing, so it gets recorded at all.

---

## 2. Why the image was declined, recorded so it is not re-litigated

Extracting digits from an image is the easy half. The hard half is knowing
which digit is the principal and which is the total to repay, and that means
reading **Mongolian Cyrillic** — *зээлийн хэмжээ*, *эргэн төлөх дүн*. Tesseract's
accuracy there is poor, so on-device OCR would realistically yield unlabelled
candidate numbers, which is what §4 below produces anyway from text that is
already perfectly legible. Cloud vision reads it well and costs a backend, a
per-call charge, offline-first, and the user's loan document leaving their
phone — on a feature ruled free.

**The image path is a deferral, not a rejection**, and §7 proposes its trigger.

---

## 3. The property that makes this safe, and the whole shape of the proposal

**Nothing here writes a debt. It fills the form.**

The paste path sets the value of `#debtName`, `#debtPrincipal`, `#debtTotal`,
`#debtDate` and `#debtDue`. The user then reads what is in the fields and taps
**Add Debt**, which is the existing handler, with its existing refusals —
total below principal, due date before borrow date — and the existing
`debtProblem` behind it.

So this request adds **no write path, no storage key, no schema field, no
migration, no validator clause and no new refusal.** It adds an input
convenience in front of a form that already exists and is already defended.

That is deliberate and it is the reason the proposal is this shape. A parser
that wrote `db.debts` directly would be a second write path into financial
records, and a misread digit would become a stored debt nobody chose. `debtProblem`
would not catch it: it validates shape, not truth, and a wrong-but-plausible
number passes every check it makes.

---

## 4. How the numbers are assigned, which is the only interesting question

The naive design reads Mongolian keywords and labels each amount. I am not
proposing it. It is lender-specific, it rots the day a lender changes their
template, and when it is wrong it is confidently wrong.

**Proposed instead: extract every money amount, then assign by an invariant the
record already enforces.**

`debtProblem` refuses `totalToRepay < principal`. That is not a convention, it
is what a loan is. So when a message yields exactly two amounts, the smaller is
the principal and the larger is the total to repay — and that assignment is
language-independent, lender-independent, and cannot be broken by a template
change.

| Amounts found | Proposed behaviour |
|---|---|
| Exactly two | Assign smaller → principal, larger → total. Fill both. |
| One | Fill principal only. Leave the total for the user. |
| More than two | Fill nothing. Offer the amounts and let the user choose. |
| None | Say so and change nothing. |

Dates are extracted separately and are lower-risk: the earlier is the borrow
date, the later the due date, with today as the default borrow date the form
already uses. Accepted formats should include `2027-01-01`, `2027.01.01` and
`2027/01/01`, since Mongolian lenders use all three.

**Where I want a ruling** is the three-or-more case. Filling nothing is honest
and may read as the feature not working, on a screen whose whole point is to
reduce typing. Filling the two largest would be a guess this document cannot
justify — a message quoting a balance or an instalment alongside the loan would
produce a wrong debt that looks right.

---

## 5. Where it lives

Inside the add-debt card, above the fields, in the `<details>` disclosure the
application already uses — closed by default, so the form a returning user sees
is unchanged.

Note a dependency the architect may want to rule on: **UI-04 (Round 16,
approved, unbuilt) collapses the entire add-debt card into that same
disclosure.** Two `<details>` nested, or one inside a card that is itself
collapsed, is a shape nobody has ruled on. Either this waits for UI-04, or
UI-04 is re-scoped when it lands, and I would rather that were decided now than
discovered by whoever implements the second one.

---

## 6. What I am asking for

1. **Confirm the no-write-path reading in §3** — that filling form fields in
   front of an existing handler is not a second write path into financial data,
   and that this therefore needs no ruling on storage.
2. **Rule on the three-or-more-amounts case in §4.**
3. **Rule on whether the assignment-by-invariant rule in §4 is sound**, or
   whether any assignment the app makes for the user is too much and every
   amount should be offered for the user to place.
4. **Rule on the §5 collision with UI-04.**
5. Confirm the feature is free, per `product-strategy.md`, and that nothing
   here obliges a later paid tier.

## 7. What I am not asking for

Not image OCR. **Proposed as a deferral with a trigger:** it returns when the
text path has shipped and a real lender message is observed that a user cannot
paste — a photographed paper contract, or an app that blocks copying. Until
then it would buy a dependency or a backend to solve a problem no observation
has reported.

Not bank-SMS expense capture, which `product-strategy.md` places in the paid
tier and which is a different feature over a different record. Not a change to
`debtProblem`, the add-debt handler, or any existing refusal. Not a Mongolian
keyword dictionary.
