# Design request — what sits above the list

**For the Chief Architect.** Round 17 deferred `WORK-03` behind a measurement and behind one question to the owner. **Both have now come back, and both fired.** This is the scoped request that fires with them.

**It is the first request in this module argued from measurements rather than from estimates**, because the instrument Round 17 ordered has been built, and the first thing it did was contradict every derived pixel figure in the round — including yours and including mine.

---

## 1. The two triggers, and what they returned

**Trigger one, the owner's answer.** You wrote: *"ask them whether 'too much text at the top' meant the grey paragraph or the four tiles… If it was the tiles, every shape proposed for this item is aimed at the wrong half of the card."*

> **They answered: both, equally.**

So `WORK-03`'s pre-ruled fallback — disclose one prose sentence, recover ~34px — answers half of a complaint whose other half is a surface no report in Round 17 examined.

**Trigger two, the measurement.** `WORK-02`'s flow was written, run red against the unchanged application, then run again after `WORK-04`, `WORK-05` and `WORK-06` landed. **It is still red.**

| Width | First card top | First card height | Slack to the nav |
|---|---|---|---|
| 320 | 562 | 363 | **−174** |
| 360 | 502 | 313 | **−64** |
| 390 | 485 | 284 | **−18** |

**The flow is held back from the suite, not weakened and not deleted.** A geometry assertion committed red teaches the suite to be ignored; one relaxed until it passes is the diagnostic-mistaken-for-a-guard this round exists to stop. It lands the day it passes, in the shape you ruled.

---

## 2. What is actually above the list, measured

At 390, decomposed element by element. **This table is the request.**

| Element | Height | Note |
|---|---|---|
| App header | 73 | Not in scope, not proposed |
| Page top padding | 24 | |
| `#debtTotalsCard` — `h3` "All borrowing" | **24** | Labels a card whose four tiles are each self-labelled |
| `#debtTotalsCard` — the four tiles | **102** | 4 × 45 in two rows of two |
| `#debtTotalsCard` — sentence 1, ungated | **34** | 14 words |
| `#debtTotalsCard` — sentences 2 and 3, gated, one element | **68** | 39 words |
| Card padding and inner gaps | ~58 | |
| Gap, then the add-form disclosure | 29 + 44 | |
| Gap to the first card | 29 | |
| **Total above the first card** | **485** | |

**The prose is 102px and the tiles are 102px. They are exactly equal, and the owner said "both, equally" without having measured anything.**

**Two consequences I want on the record before any shape is discussed.**

**(a) Round 17's derivation was out by 101px.** UI Review put the first card's top at ~468 and you derived 384px above the list from its component figures. It is 485. You refused to act on UI-01's High until the instrument reported — that was right, and the instrument reports that **UI-01's finding was correct and its arithmetic was not.**

**(b) At 320 the guarantee is unreachable by anything in this request.** The deficit is 174px and everything I could propose to remove above the list — the `h3` and all three sentences — totals 126px. The card itself is 363px at that width, because the chips stack one per row. **So either the guarantee is a 390 statement, or it needs the chip row back, which you closed unfixed.** I am not proposing to reopen that. I am asking you to say which, because `WORK-02`'s flow cannot be written until its guarantee has a stated scope.

---

## 3. The thing I most want ruled: your own off-limits entry blocks the obvious shape

**The shape the measurement points at is this:** move the **"Cost so far" tile and its two-sentence explanation together** behind one disclosure, leaving three tiles and one sentence permanently open. Recovers **68px** immediately, and the `h3` is a further 24.

**And it satisfies `C36` rather than evading it**, which is the part I want tested. Your rule is co-visibility: *wherever the labelled figure can be read, its disclosure can be read without the user performing an action.* If the figure and its disclosure are behind the **same** control, there is no state in which the figure is legible and the qualification is not. The rule binds the pair, and the pair moves together.

**But Round 17's off-limits list says: *"A second disclosure control on the Debts screen… A second one on the same screen teaches the user that this screen hides things, which is the opposite of what the first one was for."*** That entry is three days old and it refuses this shape by name.

**So I am asking you to narrow it, by exactly one shape, or to refuse the shape.** The narrowing I would argue for: *a figure may travel behind a control together with its own `C36` disclosure, and that is not a second place the screen hides things — it is one fact moved intact.* The counter-argument is yours and it is strong: two chevrons on one screen is two chevrons, whatever the reason for the second.

**If the entry stands, the shapes that remain are smaller and I have listed them in §4.**

---

## 4. Four smaller shapes, with what each is worth

**(a) Delete the `h3` "All borrowing". 24px.** The card's four tiles are individually labelled — *Still owed*, *Paid back so far*, *Borrowed in total*, *Cost so far* — and the screen's own title bar already says **Debts**. The heading names a card whose contents name themselves. **Cheapest, and the only one that removes no sentence and no figure.**

**(b) Merge sentences 2 and 3 into one. Up to 34px.** Sentence 2 states scope; sentence 3 is the `C36` disclosure. `C36` permits merging explicitly — *"a model disclosure may be moved, shortened or merged"* — so the merged sentence carries the disclosure and stays open. **I have not drafted it**, because the wording would be load-bearing and this module has now ruled four times that wording is where the honesty lives.

**(c) Reduce the tile value from `--t-h2` to `--t-h3`. Roughly 16px.** This is `WORK-05`'s argument applied to the block above: four figures at the module's largest type, of which the one the product exists to expose — *Cost so far* — is the fourth. **It also closes round-16 `WORK-10`**, the deferred 320px tile-overflow item, because an eight-figure total at 18px no longer breaks mid-number in a 132px column. **I flag that it touches a deferral rather than pretending it doesn't.**

**(d) Do nothing above the list, and restate the guarantee.** If `C36`, `SCR10` and the disclosure entry each hold, the honest outcome is that one whole card is not reachable without scrolling on this screen, and `WORK-02`'s flow asserts something else — the first card's *top* is above the fold, say. **Weaker, and I would rather have it than a guarantee written to be passable.**

---

## 5. What I am not asking for

Not a fifth tile, and not a fourth sentence — `SCR10` and the block's own closure stand, and `WORK-11` now enforces the second one. Not the removal of any figure. Not the `C36` disclosure hidden while its figure shows, in any shape. Not a new screen, a new card, a new component or a new primitive. Not a change to `totalOutstanding`, `totalPaid`, `totalBorrowed`, `totalInterest`, `showCost` or any derivation. Not the chip row, which you closed unfixed. Not an app-wide sweep. Not a Mongolian string.

---

## 6. What I am asking for

1. **Rule §3** — narrow the disclosure entry by the one shape, or refuse it.
2. **Rule §4(a)**, the heading.
3. **Rule §4(b)** — whether sentences 2 and 3 merge, and if so rule the wording rather than delegating it.
4. **Rule §4(c)**, the tile type size, and say what it does to round-16 `WORK-10`.
5. **Rule §2(b)** — the guarantee's scope, since `WORK-02` cannot be committed until its sentence is true somewhere.
6. **Confirm §4(d) is available**, because a request whose only acceptable outcome is a change is not a request.

---

## 7. One thing on the record

**Round 17 cost four agents and produced thirteen items, and the one thing that has actually changed anybody's mind was a forty-line probe that took ten minutes to write.** Two reviews and a ruling all reasoned about this screen from a component tally, and all three were wrong in the same direction by roughly 100px.

**I am not proposing an instrument for every surface** — that is the sweep this record refuses. I am recording that on the one question this project keeps getting wrong, *how big is the thing we just built*, the cheapest available answer has never been to think harder about it.
