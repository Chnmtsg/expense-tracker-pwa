# Design request — saying what an early settlement saved

**For the Chief Architect. `ED2`, fired.** Its trigger was `ED1` shipped.
`SET-01`, `SET-02` and `SET-03` are on `main`, green at 33/33 across three
widths, and deployed as `expense-tracker-v17`.

**The arithmetic is not in question and I am not reopening it.** Your
early-settlement ruling pre-ruled it as the only arithmetic permitted:

> `agreed − paid`. One subtraction over two stored quantities. No rate, no
> allocation, no accrual, and no caveat about the fee, because the fee is
> inside it.

**The presentation is what you deliberately did not pre-rule**, and this
request exists because of that sentence: *"it would be a fourth derived figure
on a card whose rate copy is closed at one sentence and whose summary block is
closed at three, and where it goes and what it says is a scoped question that
gets its own round."*

This is that round, and it is almost entirely a question about **where**.

---

## 1. The gap this closes, restated from your own words

`SET-02` left a card reading **"₮1,120,000 paid of ₮1,360,000 · ✓ Cleared"**
with nothing saying where the difference went. You ruled that acceptable
because *"a question the user can ask is strictly better than a claim that is
wrong"* — and that the answer is `ED2`.

One subtraction: **₮240,000**. Exact, fee included, nothing assumed.

---

## 2. Where it cannot go, which is most of the card

Everything below is already closed by a standing ruling, and I list it so the
remaining space is visible rather than argued for:

| Surface | Status |
|---|---|
| `.debt-totals` helper block | **Closed at three sentences, permanently.** A fourth is on the off-limits list. |
| The card's rate line | **Closed at one sentence, permanently**, on the way in. |
| The settle sheet's helper | **Closed at one sentence, permanently**, on the way in. |
| The bell | A notification is no place for a figure that needs a sentence. |
| The Dashboard, Analytics, any period-filtered surface | A debt figure never reaches one. |

**What is left** is the card's own body — the `.debt-numbers` line, the
`.debt-meta` chip row, and `.debt-remaining`, which on a settled debt currently
renders the two words "✓ Cleared" and nothing else.

---

## 3. Four shapes, and I am not choosing

| | Shape | For | Against |
|---|---|---|---|
| **A** | Extend `.debt-remaining`: **"✓ Cleared · ₮240,000 less than agreed"** | The figure lands exactly where "still owed" used to be, which is where the eye already goes for this question, and it costs no new element. | It puts two facts in the slot the module has always used for one. |
| **B** | A fifth chip in `.debt-meta` | The row is built for facts about the loan and already renders up to four. | Round 16 measured a fifth chip wrapping to four rows at 320px, and rejected one for the rate on exactly that ground. |
| **C** | A helper line under the card, beside the overpayment line `WORK-03` added | An existing, precedented position for a gated sentence on a card. | Two gated helper lines can now appear on one card; see §4. |
| **D** | Nowhere on the card — only in the history modal | Costs nothing anywhere. | The question is asked on the card; answering it two taps away is answering it for whoever goes looking, which Round 16's only High called permanently absent for everybody else. |

I lean **A**, because the figure belongs in the slot the question is raised in
and because it is the only option that adds no element to a card three rulings
have closed copy on. But `.debt-remaining` has been one fact since the module
shipped, and that is your call rather than mine.

---

## 4. Four things I cannot settle, and one I got wrong once already

**(a) The word.** "Saved" is the natural English and I think it is wrong here:
it congratulates, and this module has refused to congratulate three times. **"Less than agreed"** states the same fact and claims nothing about whether the
user is better off — they may have paid an early-settlement fee that made it a
worse deal, and this application cannot know. I would like the wording ruled,
not left to implementation, on the precedent of the last three rulings where
the wording turned out to be the load-bearing part.

**(b) A debt settled for MORE than agreed.** `agreed − paid` goes negative when
the user recorded an overpayment and then marked it settled. `WORK-03` already
puts a line on that card — *"₮100,000 more than agreed is recorded here"* — so
the negative case is already spoken for, and I propose `ED2` renders **only
when the difference is positive**. But that means two different gated lines
derived from the same subtraction, in two places, with two voices.

**(c) A debt paid in full and then marked settled.** `agreed − paid` is zero
and no line appears, which falls out of (b) without a special case. Stated so
it is visibly considered.

**(d) The summary card.** Should a settled debt's saving aggregate into a fifth
tile? I propose **no** — four tiles wrap two-to-a-row at 320px and a fifth
changes that geometry, the helper block that would explain it is closed, and
`ED2` is a fact about one settlement rather than a running total. Stated
because §5.5 of the earlier request made me realise aggregates are where this
module's figures go wrong.

---

## 5. What I am asking for

1. **Rule between A, B, C and D**, or reject all four and rule that the gap
   stays open — which is a legitimate outcome and cheaper than any of them.
2. **Rule the wording**, including whether "saved" is permitted.
3. **Rule (b)** — positive-only, and whether one subtraction feeding two lines
   in two voices is acceptable or wants unifying.
4. **Confirm (d)**, no fifth tile.

## 6. What I am not asking for

Not a rate, not an allocation, not an accrual, not a caveat about the fee. Not
a change to `debtOutstanding`, `debtPaid`, `debtInterestPaid`, `debtSettled` or
any write path. Not a fourth sentence in the `.debt-totals` block. Not a second
figure on the rate line. Not a new storage key, schema field or migration —
`settledOn` is the last one of those and `ED2` needs nothing further.
