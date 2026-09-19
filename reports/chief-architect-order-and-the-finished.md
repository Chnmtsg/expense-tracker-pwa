# Chief Architect Ruling — the order of the list, and what happens to the finished

*(Design-request ruling, not a review round. Supplemental to the round-9 standing decision, the Round 11–17 supplementals — `chief-architect.md`, `archive-chief-architect-round16.md`, `archive-chief-architect-round14.md` and the archives they carry — and the eleven design-request rulings in `reports\`. All remain in force in full. This ruling adds to that record and replaces none of it, **except that it narrows one permanent off-limits entry by exactly one shape, and replaces one shipped comment it makes false.** Both are named where they happen.)*

**ID namespace.** Approvals `ORD-01`–`ORD-03`; rejections `ODR1`–`ODR10`; deferrals `ODD1`–`ODD3`; collisions `ODK1`–`ODK9`; unasked questions `ODN1`–`ODN4`. None is to be renumbered into or absorbed by a `WORK-`, `ABL-`, `SCH-`, `SCR`, `PD`, `EFR`, `FEE-`, `SET-`, `SAV-` or `PAY-` item.

**On the three missing reports, recorded because silence here would look like an omission.** There is **no UI Review report, no Code Review report and no Engineering Manager report for this request, and none is owed.** This arrives through the same door as the eleven design-request rulings already in `reports\`: a scoped request from the implementer, ruled directly. The three-report contract in `knowledge\review-conventions.md` governs a review round. **There are therefore no reviewer findings and no Critical findings to approve or overrule, and there is no Engineering Manager conflict list** — the nine collisions below are ones I found between the request, the standing record and the source. The work authorised here is two commits.

**Ruling issued on §2, §3, §4(a), §4(b), §4(c), §4(d), §4(e), on §5, §6, §7 and §8, on nine collisions and on four things the request did not ask. No item is silent.**

---

## The ruling in one screen

1. **(A) is approved, and the refusal it collides with is replaced rather than stepped over.** The app may impose an order. It may never say a word about one. `renderDebts`' sort comment refused an ordering because *"nothing on this screen has earned the right to recommend one"* — and `PAY-01` established that on this record **every ordering pays the same total**, so the choice that comment refused to make is not a financial choice. What is left is a presentation default, and presentation defaults belong to the owner.
2. **The figure is what is still owed — `debtOutstanding` — not the agreed total.** It is the figure that answers the question the owner's own reason names: which one am I closest to finishing. The request's §8 calls this a worse answer now; I disagree, and §2 says why.
3. **I am not endorsing the snowball method and this ruling may never be quoted as though I had.** It is approved because the application **cannot be wrong about money** by ordering this way, not because the behavioural claim is established. `PAY-01` stands: zero tugrik, either way.
4. **(B) is shape 2.** The second-disclosure off-limits entry is narrowed by **exactly one shape**: one `<details class="more-fields">` at the foot of `#debtList`, containing only finished debts, closed on every render. It costs **no new class, no new CSS, no new primitive and no new vocabulary** — `.more-fields` is shipped, styled and used three times. Shape 3 is refused: it is a hand-rolled disclosure in a file that has a native one.
5. **`C36` is not engaged by this, and the reason is worth carrying:** `C36` is violated by hiding a **disclosure**, never by hiding a **figure**. A figure behind a control with its qualification in the open is the safe direction.
6. **The grouping key is `debtSettled`.** One claim, one meaning, at every site that renders it — `SET-02`'s rule, tenth site.
7. **The tiles are untouched and keep counting what the list now folds away.** Nothing explains that, no fourth sentence is permitted to, and that is my largest recorded risk.
8. **The geometry guarantee is not at risk and is still measured, not argued.** The group renders **below** the first card, so nothing above it moves. `ABL-03`'s ladder is spent: a red reading at 390 means this shape is wrong, never that the sentence gets rewritten.

---

## Executive Decision

**Yes. This application is fit for release, and I am opening no release gate — eighth round running.** Nothing here touches a figure, a derivation, a gate, a rate sentence, a write path or one tugrik of stored money; both halves are arrangement. The first half is the rarer thing in this project — a shipped refusal that turns out to have been refusing the wrong question, because `PAY-01` had already emptied the strategies it named of their only disagreement, which was money. The second half is the thing I named twice as this list's real answer, brought unprompted by the person who uses it, and it lands on a primitive the file already owns. What I am refusing is the part that would make either of them speak: no word, badge, number or icon on this screen will ever recommend a repayment order, and no sentence will be added to explain why the totals above the list still count debts the list has folded away.

---

## §2 — May the application impose an order

**It may. It may never recommend one. `ORD-01`.**

**The refusal, read for what it actually refuses.** The shipped comment says sorting by size or age *"would have this app assert a repayment order — largest-first and oldest-first are competing strategies with real advocates — and nothing on this screen has earned the right to recommend one."* That is not a rule against arranging a list. It is a statement about **standing**: two camps disagree, the disagreement is real, and this screen has no authority to settle it.

**`PAY-01` removed the disagreement, and nobody noticed that it also removed this refusal's premise.** The rule now stated above `debtOutstanding` in the shipped file — *the agreed total is fixed at agreement and nothing here reduces it, and that is the reason the order debts are repaid in changes nothing the user pays* — means the advocates are arguing about interest this record does not have. **Avalanche's entire case against snowball is that snowball costs money. On this record it costs zero.** What the comment refused was a financial recommendation the app could be wrong about. There is no such thing available here to be wrong about.

**So what is left is the order of a list, and that is a product default.** `product-strategy.md` is the owner's document and it says where authority sits: *"The owner of this file knows this market and the repository does not. Where the two disagree, the owner is right."* `PK5` said the same from the other end: an architect rules shapes; a person rules product and sequence.

**Who decides what, stated so it cannot be blurred later.**

| Question | Whose |
|---|---|
| Whether the list has a default order, and which end the small ones go | **The owner's.** Answered: smallest first. |
| Whether the application may put that opinion into words, a badge, a number or an icon | **Mine. No, permanently.** `ODR4`. |
| Which figure the order computes on | **Mine**, because it is a question about the record. Answered below. |
| Whether the record can make the order financially wrong | **Mine.** Today it cannot. `ODD2` is what happens if that changes. |

**What I am explicitly not ruling, and this paragraph exists to stop this report being misquoted.** I am **not** ruling that clearing the smallest debt first helps anybody. That is a behavioural claim, this repository establishes nothing about it, and the module has refused four behavioural claims. The distinction that lets this one through is not that the claim got better — it is that **an ordering makes no claim.** A saving, a projection and a date are assertions the user can act on and the app can be wrong about. A sort order is an arrangement: it states nothing, it names no figure, and with the word withheld there is nothing on screen for a user to check or be misled by. **This ruling approves an arrangement and endorses no strategy.**

### Which figure

**`debtOutstanding` — what is still owed — ascending, live debts only.**

Three reasons, in order of weight.

1. **It is the figure the owner's own reason names.** *"Clear the small ones first."* What you are about to clear is what is left on it, not what you borrowed. A ₮5,000,000 loan with ₮50,000 remaining is the one nearest finishing; an untouched ₮300,000 loan is not. An order on the agreed total would put the second first and would be answering a different question from the one the owner asked.
2. **It moves as the user pays, and the agreed total never does.** An order on a frozen number is the application's opinion, fixed for the life of the record. An order on what is left is a record of the user's own progress, reordering itself as they make it — which is the only thing on this screen that could be said to reflect the sentence the owner used, without the application saying anything at all.
3. **It is a figure this module already computes, already leads the card's foot with, already caps, already floors and already guards.** No new derivation, no new field, no new key.

**Against the request's §8.** The addendum argues that sorting on what is still owed now becomes a *worse* answer, because it would dress a named strategy in the clothes of a neutral figure. **I do not accept the premise.** A disguise requires a claim of neutrality, and this ruling makes none: the replacement comment will say in plain words that the order is a product decision taken by ruling. Choosing between two figures is not choosing between honesty and camouflage — it is choosing which figure implements the instruction truthfully, and **the instruction was about finishing, which is a fact about what remains.**

### What replaces the shipped comment

**It is replaced in the same commit that falsifies it, never deleted and never left standing (`ARCH-01`).** Most of it survives: the cleared/live split, the copy-before-sort rule, and stability being load-bearing. The replacement states, as rules and never as tallies, and citing functions rather than coordinates (`C43`):

- **What is imposed:** finished debts sink; the live debts are ordered by what is still owed, smallest first; **the finished group keeps the order it was entered in**, because nothing has earned the right to order finished debts and a stable sort gives that for free.
- **That the order is the product's, taken by ruling, and that the application says nothing about a repayment strategy anywhere on this screen** — no word, no badge, no number, no icon.
- **That no figure on this screen depends on the order**, and that on this record every ordering pays the same total — **citing the rule already stated above `debtOutstanding` by name, and not restating it.** One statement of a rule, never two; that condition is `PAY-01`'s own and it binds here.
- **That the sort key is computed once per debt and never inside the comparator**, and why (below).
- **It does not name snowball, avalanche or any strategy, and it does not record the behavioural argument.** Comments in this project state rules. The argument lives in this report.

### One thing nobody asked, and it is the sharpest technical point in this ruling

`debtOutstanding` calls `debtPaid`, which **filters the whole payment ledger**. A comparator that calls it is a ledger walk *per comparison* — worse than the per-debt walks Round 16 already recorded. **Binding: the sort key is computed once per debt and the comparator reads the precomputed key.** Note what that buys: the *existing* comparator already calls `debtSettled(a)` and `debtSettled(b)` on every comparison, and each of those walks the ledger too. **Done this way, `ORD-01` performs fewer ledger walks than the sort that ships today.** The pre-ruled one-`Map` fix stays unscheduled and this does not fire it.

---

## §3 — Which shape, and the narrowing stated explicitly

**Shape 2. `ORD-02`. The second-disclosure off-limits entry is narrowed by exactly one shape, by me, four hours after I reaffirmed it at full width, with the reason written beside it.**

**Shape 1 is dead** by the owner's own answer, and it was already dying: it would make `SET-03`'s reversal unreachable — the first thing this module ever hid that a user needs in order to undo something.

### Why the entry bends, taken reason by reason against the shape in front of it

The entry stood on three grounds in the above-the-list ruling. **Two of them do not reach this shape, and I am not pretending the third does not exist.**

- **"It would be a rule written for no case."** No longer true, and this is what changed. When I refused it, the narrowing would have licensed nothing that existed on the screen. **This is a case** — the one I named in Round 17's risk register and again in `ABL-03`'s flow header, in the file, in these words: *"the route back for 320 is the list itself — grouping or collapse — and never another thirty pixels above it."* A rule written for the case it was written for is not premature generalisation.
- **The product reason, which outranked everything.** It does not reach this shape at all. `product-strategy.md` mission item 2 is *"Show what the borrowing costs"*; the refused shape put the **aggregate cost figure and the sentence that makes four other cost figures honest** behind a gesture. This shape puts **finished records** behind a gesture and leaves every disclosure, every tile and every live card exactly where they are. It hides nothing the user came for.
- **"Two chevrons on one screen is two chevrons."** This is mine, the request quotes it accurately, and **it is the one that bends.** The first `<details>` moved a form the user completes once out of the way of the thing they return for. Finished debts are that same class of object. The two controls therefore teach **one** rule rather than two: *this screen puts what you are done with out of the way of what you came for.* The lesson I was afraid of — *this screen hides things* — is a bad lesson when what is hidden is a figure; it is the correct lesson when what is hidden is what the user has finished with. **I was right that a second disclosure teaches something. I was wrong that what it teaches is necessarily bad.**

### The narrowing, written so it cannot expand by association

> **Permitted:** **one** `<details>` in `#debtList`, rendered **below** every live debt card, containing **only** finished debt cards and nothing else, **closed on every render**, whose `<summary>` names the state in the card's own existing word and the count of finished debts **and nothing more**. It uses the existing `.more-fields` class and the existing summary markup — chevron `<svg>`, then the text — exactly as `#debtAddFields` does.
>
> **Still off limits, unchanged and reaffirmed:** a **third** disclosure control on the Debts screen; any disclosure containing a **derived figure**, a **disclosure sentence**, a **rate sentence**, a **tile**, a **form field**, a **control** or a **live debt**; any disclosure anywhere in `#debtTotalsCard`; `<details>` nested more than one level; and every clause of `ABR1`, `ABR2` and `ABR7` about the cost figure and its disclosure, which are untouched and are not what this narrowing is about.

### Why shape 3 loses, and it is not close

Shape 3 — a tappable row that is its own toggle, no chevron, no `<details>` — was offered as the shape that solves access without adding the control I refused. **It is a hand-rolled disclosure primitive, and this application already owns a native one.** Three grounds, any one sufficient.

- **It is more complexity for the same effect, which is the one thing this architecture never buys.** `.more-fields` ships with `cursor`, a 44px minimum row, both marker resets, a rotating chevron, a `:focus-visible` ring and — the part nobody would remember to write — the platform's keyboard and screen-reader behaviour. The add form's own comment says exactly this: *"A native `<details>`: no JavaScript, no new gesture, and the keyboard and screen-reader behaviour is the platform's rather than something this file has to keep correct."*
- **It would give the Debts screen two disclosure mechanisms with different keyboard behaviour**, which is worse than two instances of one.
- **The request's own suspicion is correct.** It is a chevron wearing a different hat, and paying for the hat in `aria-expanded`, Enter/Space handling and focus management that would be this file's to keep correct for ever.

### Shape 4 — doing nothing, considered and declined

**It was available, it stayed available through this ruling, and I am recording why I did not take it rather than leaving it to look unconsidered.** `ABL-03`'s §4(d) fired on a measurement; here there is nothing to measure — the cost of shape 4 is the one the request states, that it leaves the owner's request unanswered in both halves, and **both halves have an admissible shape that costs two commits and no new anything.** Rejecting work is cheap and I do it below nine times; rejecting the two pieces that remove a risk I put in the register twice, in favour of a control the file already owns, would be preference wearing restraint.

---

## §4(a) — should (A) be built at all now the owner has said why

**Yes, and the owner's answer is what settles it — though not in the direction the request expected.**

The request's fear was that (A) is a rule with a cost and no stated problem, and that (B) alone fixes what the owner is feeling. **The addendum removes that fear and replaces it with a different one.** The owner did not describe a cluttered list; they described what they want the list to help them do. That makes (A) an instruction with a purpose rather than a preference, and an instruction with a purpose from the person who owns the product is not mine to decline on the grounds that something else might have been what they meant.

**What I am not letting the answer do.** It does not make the behavioural claim true, it does not make `PAY-01` weaker, and it does not license one further word on screen. **(A) is approved because on this record the application cannot be wrong about money by ordering this way — and for no other reason.**

---

## §4(b) — `debtSettled` or `paidInFull`

**`debtSettled`. The same predicate, no second copy, no new predicate. Binding.**

`SET-02` established the rule that decides this: **one claim, one meaning, at every site that renders it.** "Is this finished" already has nine readers — the sort, the `✓ Cleared` line, the due chip's plain form, the `.debt-card.cleared` class, `computeReminders`, the "Still owed" reduce, the payment sheet's helper, the `data-qa-exact` gate and the history helper. **The group is the tenth, and it is the same claim.**

`paidInFull` is refused here and the file says why in its own words: *"`cleared` is about the OBLIGATION… `paidInFull` is about the MONEY, and only the percentage uses it."* Grouping on `paidInFull` would leave a card printing `✓ Cleared`, demoted, reminder-silenced and contributing ₮0 to "Still owed", **sitting among the live debts** — the exact contradiction the cleared/live split exists to remove, re-created inside the fix for something else. The owner's *"when we paid completely"* names the money; their object was the finished ones, and the word on the card is the one the group must agree with.

---

## §4(c) — the summary tiles

**Confirmed. The tiles are untouched. They go on aggregating debts the list has folded away, and nothing on screen says so.**

- *"Borrowed in total"*, *"Paid back so far"* and *"Cost so far"* are statements about all of the borrowing. **Folding a card away does not unmake the money.** Gating them on visibility would be the application under-reporting what the user recorded — the direction `C1` closed permanently, and the same error `SR6` refuses for `debtInterestPaid`.
- *"Still owed"* already contributes ₮0 for a settled debt (`SET-02`) and is unaffected either way.
- **No fourth `.debt-totals` sentence explains this.** That block is closed at three, permanently, and a fourth is on the off-limits list by name (`SR8`, carried through `ABR8`). The request is right that a user who has "put away" three debts may read the totals as describing only what is visible. **That is real, it is bigger after this change than before it, and the only surface that could answer it is shut.** It is `ODD3` and it is my largest recorded risk here.

---

## §4(d) — may an expand state be remembered

**No. Collapsed on every render, expanded per visit. Confirmed as the request assumed, and fenced against the shape it did not name.**

- No new storage key, schema field, `SCHEMA_VERSION` bump or migration — in force, and the request accepts it.
- **And no module-level variable either, which is the shape that would arrive next.** It would dodge the storage rule while being strictly worse: state with no record, invisible to the validator, lost on reload regardless, and the first piece of interface state this application ever remembers. **Refused by name at `ODR6`** so it cannot arrive as "it's only a variable".

**The consequence, named so nobody discovers it in review.** `renderDebts` rebuilds `#debtList` wholesale, so **any action taken inside the expanded group re-collapses it** — open the group, correct a payment, and the group closes. That is the honest cost of the smallest shape. It is annoyance, not incorrectness, nobody has observed it, and it is deferred with a trigger and a pre-ruled shape at `ODD1` rather than engineered against today.

---

## §4(e) — what happens to the geometry guard

**Confirmed, and the answer is structural before it is measured — but it is committed on the measurement, not on this paragraph.**

**The group renders below every live card. Nothing above the first card moves.** `ABL-03`'s assertion compares the **first** card's bottom edge against the navigation's top edge at scroll zero; in the geometry fixture the cleared record `G5` is the **last** of five, precisely because the cleared/live split already sinks it. Folding it into a disclosure at the foot changes the first card's top by nothing at any width. **The 30px of slack is not spent by this change.**

**Three conditions, all binding.**

1. **The flow is re-run at 320, 360 and 390 in `ORD-02`'s commit and the diagnostics are read**, not derived. This project has been wrong about derived pixel figures five times and one of them was mine; the instrument exists, so the figure is measured. *(The reasoning above is structural and not a pixel claim — it says which element moves, not by how much — and it is still not a substitute for the reading.)*
2. **The assertion is not edited, relaxed, re-scoped or moved, under any reading.** `ABR6` stands.
3. **If 390 reddens, the work stops and comes back as a scoped request against this ruling.** **`ABL-03`'s ladder is spent** — it terminated at its first rung when 390 went green with 30px, and there is no third attempt. A red reading here is a signal that **this shape** is wrong, never that the sentence gets rewritten.

**And the flow's own `cards.length !== 5` check is why shape 1 would have reddened it** even had the owner not killed it: a cleared debt that does not render is a card that is not there. Under `<details>` the card stays in the document and the check is unmoved.

---

## Approved Improvements

Three. Conditions are binding and are part of the approval, not commentary on it.

| Item ID | Title | Reason for approval |
|---|---|---|
| **ORD-01** | The live debts are ordered by what is still owed, smallest first; the shipped refusal is replaced by the rule that now holds | §2 and §4(a). Approved because **on this record no ordering can be wrong about money** — `PAY-01`, and the rule already stated above `debtOutstanding` — so the choice the shipped comment refused to make is a presentation default and belongs to the owner. **Conditions, all binding.** The key is **`debtOutstanding`**, ascending, **live debts only**; the finished group keeps the order it was entered in, on the stable sort, because nothing has earned the right to order finished debts. **The sort key is computed once per debt and the comparator reads the precomputed key** — a comparator calling `debtOutstanding` walks the payment ledger per comparison; done this way the sort performs fewer ledger walks than the one that ships today, and the comment says so as a rule. **The copy-before-sort rule is untouched** (`Array.prototype.sort` mutates; a render must never rewrite stored order) and its assertion `N_stored_order` stays. **Not one word, badge, number, chip or icon appears on any screen about a repayment order** (`ODR4`). **The shipped sort comment is replaced in this commit**, per §2 above, in the form stated there — stating rules, naming no tally, citing `debtOutstanding`'s own rule by name rather than restating it, and naming no strategy. **The harness comes with it, and this is not optional.** The flow *"cleared debts sink below the ones still owed"* asserts today that the live pair keeps entry order — a rule this ruling ends — **and its fixture would stay green by coincidence, because its two live records happen to be entered in ascending order.** A green that cannot fail is the defect `WORK-199` found and `C37` exists to stop. So: that flow keeps its cleared/live assertion, **drops the now-false live-order assertion, and has its header repaired in the same commit**; **one new flow beside it in the existing `tools\harness\debts.js`** asserts the new rule on a fixture whose **entry order and size order differ**, or it proves nothing. **No new runner, no second probe, no fifth static predicate.** Red-then-green per `C37`/`C40`: drop the size clause in `renderDebts` and the new flow reddens; both exit codes in the commit message. XS–S. |
| **ORD-02** | Finished debts fold into one disclosure at the foot of the list | §3, §4(b), §4(c), §4(d), §4(e). It is the item I named twice as this list's real answer, it is the only shape that solves access, and **it costs no new class, no new CSS, no new primitive and no new vocabulary.** **Conditions, all binding.** One `<details class="more-fields">` inside `#debtList`, **after every live card**, containing only cards for which **`debtSettled(d)`** is true, with the existing summary markup — the chevron `<svg>` then the text — matching `#debtAddFields` declaration for declaration. **`<summary>` names the state in the card's own existing word plus the count, and nothing else**: no money, no date, no congratulation, no strategy word, no Mongolian string. **The copy is closed at that one string, permanently, on the way in** — the `SET-03` discipline applied before three rounds of growth rather than after. **It does not render at all when there is no finished debt**; a disclosure standing for nothing is a control for nothing. **Closed on every render.** No new class, no `!important`, no new declaration; **if the existing `.more-fields` rules do not suffice, the work stops and returns as a scoped request** rather than growing a selector inside this commit. **No `.goal-*` selector and no Debts declaration in a selector matching a `.goal-*` element** — Round 17's invariant, carried. **Every one of the five controls on a finished card survives untouched** — `+ Payment` demoted, `📜`, `✓`, `✎`, `✕` — and `SET-03`'s reversal path runs through the `✓` exactly as it does today; **the listener-attachment block is unchanged**, because it queries `#debtList` and finds descendants. **The tiles are untouched** (§4(c)) and **no sentence is added anywhere** to explain them. **The geometry flow is re-run at 320, 360 and 390 and its diagnostics read**; the assertion is not edited; red at 390 stops the work (§4(e)). S. |
| **ORD-03** | The demotion flow is put into the state its own sentence describes — **and only if the measurement requires it** | §4(e)'s second collision, pre-ruled so a layout reading cannot cost a round. The flow *"a cleared card stops pushing + Payment as its primary action"* reads `getBoundingClientRect().height` on a control that, after `ORD-02`, lives inside a closed `<details>`. **The harness's own record says this may not bite** — the add-form flow documents that *"in this Chrome a closed `<details>` on the ACTIVE screen still reports a client rect for a child while itself collapsing to summary height"* — **so the outcome is genuinely unknown and is measured, never derived.** **Green: `ORD-03` does not fire and nothing is touched.** **Red: the only permitted repair is to open the group before measuring** — putting the flow into the state in which a user meets that control. **Nothing else may change: not the background comparison, not the 44px floor, not the equal-height comparison, not the `data-debt-pay` check, not the threshold, not the fixture's meaning.** The commit message records both readings and the reason. **If red demands anything beyond opening the group, the work stops and returns as a scoped request.** XS, and conditional. |

**Total approved effort: two commits, well under a day, and one of them may be two lines shorter than written.**

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **ODR1** | Shape 1 — one label, cleared debts not rendered | Dead by the owner's own answer — *"I must be able to open them"* — and it was dying anyway. It puts `SET-03`'s reversal path out of reach, which would be the first thing this module has hidden that a user needs in order to **undo** something, and it would redden the geometry flow's card count, because a card that does not render is a card that is not there. |
| **ODR2** | Shape 3 — a tappable label that is its own toggle, with no `<details>` | Refused. It is a hand-rolled disclosure primitive in a file that ships a native one used three times, and it would pay for the hat in `aria-expanded`, Enter/Space handling and focus management this file would then own for ever. **Generalised onto the off-limits list: no hand-rolled disclosure anywhere in this application.** The request's own suspicion was right. |
| **ODR3** | Shape 4 — neither half, the list keeps sinking cleared debts as it does now | Declined, with the reasoning in §3 above. It was available throughout and its cost is the one the request states. Both halves have an admissible shape at two commits and no new anything; declining them in favour of a control the file already owns would be preference wearing restraint. |
| **ODR4** | Any word, sentence, badge, number, chip, icon, colour or ordinal on any screen that states, recommends, ranks or explains a repayment order — including "pay this first", "start here", a position number, or the words snowball and avalanche | **Refused permanently. `PR5` carried entire and reaffirmed at the moment an ordering ships, which is the moment it is most likely to acquire a caption.** The ordering is silent or it is a recommendation, and a recommendation is a claim the application may not make. **This is the clause most likely to be quoted at as "but the order already says it" — the order is an arrangement, and the arrangement is the whole of what was granted.** |
| **ODR5** | Sorting on the agreed total, the principal, the borrow date, the due date, the percentage repaid or the rate; a sort control; a sort preference; a user-chosen order | Refused. One figure, ruled at §2, for stated reasons. **A control or a preference is worse than the default, not better**: it is a stored intention (`PR8`), a sixth surface on a screen closed at three blocks, and it would put the strategy question to a user the product strategy defines as having little accounting knowledge and being under financial stress. |
| **ODR6** | A remembered expand state — in storage, in a schema field, in the import replacement object, or in a module-level variable that outlives a render | Refused per §4(d). The first three are off limits already; **the fourth is named because it is the one that would arrive as "it's only a variable"** — state with no record, invisible to the validator, lost on reload regardless. `ODD1` is the only door back and its shape is pre-ruled there. |
| **ODR7** | A count threshold on the collapse — folding the group only when there are two or more finished debts — or any shape chosen because it keeps a fixture green | **Pre-refused so it cannot arrive as pragmatism.** It would make the screen's behaviour turn on a tally, it would be unexplainable to the user, and its actual motive would be that two harness fixtures carry exactly one cleared debt. **A shape is never chosen to keep a test green. Where a committed expectation and a ruled shape collide, the collision is ruled — as `ORD-03` rules one — and never dodged.** |
| **ODR8** | Editing, relaxing, deleting or re-scoping any assertion in `ABL-03`'s geometry flow, in the demotion flow, or in the cleared/live sort flow, beyond the two repairs named by ID in this ruling | Refused. `ABR6` and `ABR7` carried in full. **The two permitted repairs are `ORD-01`'s — a comment made false by a ruling, and an assertion whose rule a ruling has replaced, both repaired in the commit that does it, with the replacement landing in the same commit — and `ORD-03`'s, which changes no comparison at all.** Everything else is a scoped request against the ruling the assertion encodes. |
| **ODR9** | An archive, a "finished" filter row, a date filter, a bulk delete of finished debts, a fifth tile, a fifth chip, a fourth gated card line, a sixth control, a fourth `.debt-totals` sentence, an empty-state sentence for a list whose debts are all finished | Refused, all carried, and named here because the collapse is what makes each of them look adjacent. **`SR18` is discharged by `ORD-02`, not widened by it**: what it rejected was a screen-level capability nobody had asked for, and its own door said *"if finished cards ever dominate a real screen, that is an observation and its own request."* **This is that request, and it opened the collapse alone.** |
| **ODR10** | Carried entire, and none of it was re-raised | Every shape rejected in rounds 9 and 11–17 and in the eleven design-request rulings. In force here by name: no new storage key, schema field, `SCHEMA_VERSION` bump or migration; no new harness runner, second probe or fifth static predicate; no app-wide sweep of any kind; no Mongolian strings; no projection, payoff figure, saving or date from any input on any surface; no change to `debtOutstanding`, `debtPaid`, `debtInterestPaid`, `debtSettled`, `pctLabel`, the progress bar, either write path or any stored figure; **`ABR1` and `ABR2`'s substance — the cost figure and its one-site disclosure acquire no control, ever.** |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **ODD1** | Keeping the finished group open across a re-render | **Trigger: an observation — the owner or a watched user losing their place in the group while correcting something inside it.** Not a schedule and not a measurement; this is annoyance, nobody has met it, and the smallest shape ships first. **Pre-ruled so it cannot grow if it fires:** the only permitted answer is reading the element's own `open` property inside `renderDebts` and restoring it on the rebuilt element — **never a stored field, never a storage key, never a `SCHEMA_VERSION` bump, never a module-level flag that outlives the render, and never a second render pass.** If that shape will not do it, it comes back as a scoped request rather than growing. |
| **ODD2** | This ruling's own premise, re-read | **Trigger: any change that makes two orderings of the same debts pay different totals** — an amortising balance, a falling-balance record, a per-period recalculation, or anything that gives `totalToRepay` a life after agreement. All of those are off limits today (`PR10`, carried), so nothing can fire this by accident. **On the day one does, the ordering stops being an arrangement and becomes a recommendation with monetary content, and §2's whole argument collapses** — because the reason the app cannot be wrong about money by ordering this way is that no ordering costs anything. **Recorded so that the day the premise changes, the ruling that rests on it is found rather than inherited.** |
| **ODD3** | The totals that count what the list has folded away | **Trigger: the owner, shown the render, reads a total as describing only the cards they can see.** **Pre-ruled now so nobody rediscovers the closed door:** the answer is **not** a fourth `.debt-totals` sentence (closed permanently, `SR8`), **not** a caption on a tile, and **not** gating any tile on visibility (`C1`'s direction). It is a scoped request about the block above the list, and **`ABD2` is its neighbour and may not absorb it** — `ABD2` is about whether four figures earn their place, and this is about what those figures count. |
| **Carried** | Every standing deferral | **Unchanged, every trigger intact, none fired by this request.** In particular: `PD1`'s successors and the schedule-dependent items; `ABD2` and `ABD3`; `PDD1`; `FD1`; `FD2`; `SCD1`; `EFD1`; `D1`; `D2`; Stage 2; the application-file `ARCH-01` pass; and the language layer, which still needs its own scoped proposal and its own ruling. **Nothing here authorises a Mongolian string anywhere, including in the new `<summary>`.** |

---

## Conflict Rulings

**There is no Engineering Manager report and therefore no recorded conflict list; that is stated rather than left silent.** These are the nine collisions I found between the request, the standing record and the source. Each is ruled.

### ODK1 — the owner's instruction against `renderDebts`' shipped refusal, and against the off-limits entry `PR5` created

**Ruled at §2. The refusal's premise was standing — who may settle a dispute between two camps — and `PAY-01` had already dissolved the dispute by establishing that the camps differ by zero tugrik on this record.** The comment is replaced, not overridden in silence. **`PR5` survives entire in the half that matters**: *asserted, recommended or displayed*. Nothing is asserted, recommended or displayed. **The off-limits line reads, from today: any repayment ordering asserted or recommended **in words, a badge, a number or an icon**; the order of the list itself is the product's.**

### ODK2 — the cleared/live sort flow, which would have stayed green over nothing

**Ruled: the flow's header is repaired and its live-order assertion is replaced in `ORD-01`'s commit, and the new rule gets a fixture that can fail.** Its two live records are entered ascending, so the new order would reproduce the old one exactly and the suite would report a pass it had not tested. **That is the `WORK-199` defect — a flow green over a thing it could not see — and it is also the third time in this project an assertion would have been recorded as met before it was capable of failing.** Repairing a comment a ruling falsifies and replacing an assertion whose rule a ruling has ended is `ARCH-01` and `C37` working; it is not `ABR7`, and §"Architecture Strategy" states the distinction as a rule.

### ODK3 — shape 2 against the second-disclosure entry, reaffirmed at full width four hours ago

**Ruled: narrowed by exactly one shape, by me, with the reason written beside it, and not narrowed again.** Two of its three grounds do not reach this shape; the third — mine, *two chevrons is two chevrons* — bends, because the two controls teach one rule rather than two. **A constraint that opens by the width of each successive good argument is not a constraint. This one opens once, by one shape, and the permitted shape is written out in §3 so the next request is measured against the shape and not against the fact that it moved.**

### ODK4 — the collapse against the demotion flow's geometry assertion

**Ruled at `ORD-03`, pre-ruled in both directions, and measured rather than argued.** The harness's own record says a child of a closed `<details>` may still report a client rect in this Chrome, so the collision may not exist; **that is exactly the class of quirk that produces false passes on this project, so it is read and not assumed.** Red, the flow is put into the state its own sentence describes and no comparison moves. **Recorded because it is the cleanest example available of the difference between editing a test's *state* and editing its *sentence*.**

### ODK5 — the collapse against `ABL-03`'s guarantee and against `ABR6`

**Ruled at §4(e): the group renders below the first card, so nothing the assertion measures moves — and the reading is still taken at three widths.** `ABR6` is untouched: the scope was fixed before the measurement, the ladder terminated at its first rung, and **a red reading at 390 means this shape does not ship, not that the sentence is rewritten.** This change also **buys nothing at 320** and must never be described as though it did: 320 keeps no geometry guarantee, permanently and for the measured reason in `ABL-03`'s header. What the collapse shortens is the **scroll**, which is Round 17's linear problem, and that is a different sentence from the one the guard makes.

### ODK6 — `debtSettled` against `paidInFull`

**Ruled at §4(b): `debtSettled`, on `SET-02`'s rule.** The request called this a real fork and declined to choose; it was right that it is a fork and the module had already chosen, nine sites ago. **A group that disagreed with the label on the cards inside it would be the cleared/live contradiction re-created inside the fix for something else.**

### ODK7 — `SR18`, which rejected a collapse for settled debts by name

**Ruled: discharged by its own door, not overruled.** `SR18` refused a screen-level capability that nobody had asked for, inside a request about a stored fact, and wrote the door in its own words: *"if finished cards ever dominate a real screen, that is an observation and its own request."* **The settle act shipped, finishing a debt became possible, the owner asked unprompted, and the request arrived scoped to the collapse alone.** That is a rejection working exactly as written. **It is not a precedent that a rejection lapses with time — it is discharged because the condition it named occurred.**

### ODK8 — `C36`'s travel test against a finished card's "Cost so far" chip

**Ruled, and the ruling is general: `C36` is violated by hiding a disclosure, never by hiding a figure.** The test is co-visibility — wherever the labelled figure can be **read**, its qualification can be read without a gesture. A figure behind a control with its qualification in the open satisfies that trivially: **there is no reachable state in which the number is legible and the sentence is not.** The travel test from `ABL` is about a **disclosure** travelling and is unmoved. **And `ABD2`'s reachability rule is honoured rather than dodged**: a fact this application computed and once showed is not deleted — it is one tap away, on the same screen, and the aggregate that includes it is on screen the whole time.

### ODK9 — `PAY-01`'s zero-tugrik finding against the owner's behavioural reason

**Ruled: the finding stands unchanged and it is what permits the ordering rather than what refuses it.** The request treats the behavioural argument as the thing needing permission. **It does not get permission and it does not need it** — it is not built, not stated, not tested and not endorsed. What is built is an arrangement whose monetary content is zero, which is the property that makes it safe. **Sixth refusal of a model in this module, and the first time the refusal is what unblocks the request rather than what ends it.**

---

## Rulings on what the request did not ask

Four. None is a finding; no reviewer raised any of them, and I am recording them as ruled scope and as questions.

**ODN1 — how many finished debts does the owner actually have?** The value of `ORD-02` scales with that number and nothing establishes it. If it is one, the collapse trades one card for one row and **the order change is the whole of what they will feel** — which does not change either approval, because both are small and both are asked for, but it decides which one to show them first.

**ODN2 — did "less money debt" mean the size of the loan or what is left on it?** I have ruled what is left, on their stated reason. **One sentence would confirm it and it changes one expression.** Asked here rather than assumed, because this is the only place in this ruling where I chose between two readings of the owner's own words.

**ODN3 — what does the owner expect to find inside the group a year from now?** If the answer is "nothing, I would rather they were gone", that is a different request — deletion already exists, an archive does not and is refused (`ODR9`) — and it would be better asked than discovered when the group holds thirty cards.

**ODN4 — nobody has seen the state where every debt is finished.** The list is then one collapsed row under a summary card reading "Still owed ₮0". **I am adding no empty-state sentence for it** (`ODR9`) — the tile already says it, and a fourth sentence is closed. It is recorded so that the first person to see it knows it was ruled and not overlooked.

---

## Development Order

Two commits, and the second may be three lines shorter than it looks. Run the full harness after each and expect 0.

| Order | Item | Why here |
|---|---|---|
| 1 | **ORD-01** — the sort, its replaced comment, the repaired flow header and the new flow | First, because it is the smaller change, it touches no layout, it engages no off-limits entry once §2 is ruled, and its proof is a red-then-green on a fixture rather than a reading of pixels. **It also lands the precomputed sort key that `ORD-02` then groups on**, so the grouping is written against a key that already exists. |
| 2 | **ORD-02** — the disclosure, carrying **ORD-03** only if the measurement fires it | Second and separate, because it is a different risk on a different surface and **two unrelated changes are not one piece of work.** It is the commit that touches layout and tests, so it goes against a list that is already ordered correctly. Re-run the geometry flow at 320, 360 and 390 and read the diagnostics; read the demotion flow's `P_cleared_h`; record both in the commit message. |

**Not scheduled:** `ODD1`, `ODD2`, `ODD3` (deferred, triggers stated), every carried deferral, and everything in the rejection table. **No `sw.js` cache-key bump is authorised by this ruling**; the standing deploy discipline governs, and it is read as *the key must differ from what is live*.

### What the owner will get

The list opens on the debt they are closest to finishing and ends on the one furthest away, reordering itself as they pay. Everything they have finished folds into one quiet grey row at the foot of the list, with a chevron, which opens to the finished cards with **every control intact** — payment history, un-settle, edit, delete — and closes again on the next render.

### What the owner will not get

**Not one word about why the list is in that order**, ever — no label, no badge, no number, no icon. **No money**: on this record clearing the small ones first saves exactly zero tugrik, and the application will not pretend otherwise. **The four figures above the list do not change when the group closes** — they go on counting the debts it has folded away, correctly, and nothing on screen says so. **The finished group forgets it was open** the moment anything is done inside it. **And 320 gains no guarantee**: the first whole card still requires a scroll there, deliberately and on the record.

---

## Architecture Strategy — next quarter

**What stays, and is not open for discussion.** Everything in the round-9 standing decision, the Round 11–17 supplementals and the eleven design-request rulings, in full, with the single narrowing named at §3. The single self-contained `expense-pwa\index.html` that runs by being opened from disk: no framework, no build step, no bundler, no component abstraction, **no new dependency and no new primitive**. `localStorage`, one write seam, quarantine before write, numbered append-only migrations. **Offline-first, mobile-first, and correctness of financial data above everything** — applied here to an **arrangement**, which is the first time in eight rounds that clause has decided a question with no figure in it, and it decided it by establishing that there is no money in the arrangement to get wrong. `C36`, `C37`, `C38`, `C39`, `C40`, `C42`, `C43`, `ARCH-01` unchanged, and `C36` gains a complement rather than an exception. **Every figure, derivation, gate, rate sentence, copy closure, predicate and storage decision in the Debts module is untouched by this ruling.**

**What changes — five, and all five are readings rather than structures.**

1. **An ordering is an arrangement, not a claim — and the application may take a product default only in silence.** Where two arrangements of the same records are financially identical on this record, choosing between them is presentation and belongs to the owner. **The moment they stop being identical, the arrangement becomes a recommendation and this entry is void** (`ODD2`). The application still does not recommend, project or advise; it arranges.
2. **`C36` is violated by hiding a disclosure, never by hiding a figure.** A figure behind a control with its qualification in the open satisfies co-visibility trivially. This is the necessary complement to `ABL`'s travel test, and without it the travel test reads as a ban on ever folding anything away.
3. **A test may be put into the state its own sentence describes; its sentence may never be changed to fit a shape.** This is what keeps *"editing an assertion to admit a shape"* a real rule rather than a freeze on the suite. **And a comment or an assertion whose rule a ruling has replaced is repaired in the commit that replaces it, with the replacement landing in the same commit** — `ARCH-01` and `C37` together.
4. **A shape is never chosen to keep a fixture green.** Where a ruled shape and a committed expectation collide, the collision is ruled in the open, in advance, in both directions.
5. **The second-disclosure entry is narrowed by exactly one shape**, written out in §3 in the form it must be quoted in, and **the shape is about finished records — never about a figure, a disclosure or a form.**

**Off limits this quarter — everything on the prior lists, plus five:**

- **Any repayment order asserted in words, a badge, a number, an ordinal or an icon**, anywhere in this application, including the words snowball and avalanche. The order of a list is the whole of what was granted.
- **A third disclosure control on the Debts screen**, and any disclosure anywhere containing a derived figure, a disclosure sentence, a tile, a control, a form field or a live debt.
- **A hand-rolled disclosure primitive anywhere in this application.** The platform's `<details>` and this file's `.more-fields` are the whole of it.
- **Any interface state remembered across a render** — by a storage key, a schema field, or a module-level variable that outlives the render.
- **A shape chosen to keep a test green**, and a count threshold introduced to that end.

**Risks I am recording, not scheduling. None is a finding and no report raised any of them as one.**

- **Mine, and it is the largest.** The four figures above the list count debts the list has folded away, **nothing says so, and the only surface that could is closed at three sentences with a fourth off limits.** The collapse makes that gap wider than it was this morning. `ODD3` carries the door and it has a trigger rather than a schedule.
- **Mine, and it is the one most likely to be misread as a regression.** The finished group re-collapses whenever anything is done inside it, because `renderDebts` rebuilds the list wholesale. That is the smallest shape working as ruled. `ODD1`.
- **Mine, from §2.** **The application now ships an opinion about repayment order and says nothing about having one.** It costs zero tugrik today and only today. If this record ever gains a falling balance, the silence becomes a concealment rather than a restraint — which is `ODD2`, recorded because the item that would cause it is off limits and off-limits items have been narrowed twice in this project.
- **Mine.** A finished card's "Cost so far" chip is now one tap away rather than on screen. Mission item 2 is about what borrowing **costs**, the aggregate stays on screen with its disclosure, and the chip is reachable — but smaller visibility is smaller visibility, and if the owner reads it as the cost being hidden, that is `ODD3`'s trigger firing and should be read as such.
- **Mine.** The 390 guard has 30px of slack by construction and this change does not spend it — **but the guard is thin, and the next true sentence anybody adds above that list reddens it.** That is the guard working and it will be read as the guard being wrong.
- **Carried and unchanged.** The `.sr-only` heading is invisible markup whose comment is the whole of its defence. 320 keeps no geometry guarantee at all on a mobile-first application whose users are on the cheapest phones available. **Savings Goals still has no probe anywhere in `tools\harness\`, now two rounds older.** "Cost so far" still overstates an early settlement. A backup restored by an older build loses `settledOn`. `totalToRepay` has no edit trail. Every string in this module is a literal and the language layer still needs its own scoped proposal and its own ruling.

---

## What `reports\HANDOFF.md` should record

Under a dated `2026-09-19` entry, and nothing more than this:

1. **The design request was ruled without a review round, and none was owed** — the three-report contract governs review rounds, not scoped requests; the eleven design-request rulings are the precedent. No reviewer findings existed, so no Critical finding was approved or overruled.
2. **The list now imposes an order, and `renderDebts`' sort comment refusing one is REPLACED, not stepped over.** Live debts are ordered by **what is still owed**, smallest first; finished debts keep entry order. **The refusal's premise was standing, and `PAY-01` had already dissolved it: on a record whose total is fixed at agreement, every ordering pays the same total, so the choice it refused to make is not a financial one.** The owner set the default; the architect ruled the figure and ruled that it may never be voiced.
3. **This is not an endorsement of the snowball method and must never be quoted as one.** `PAY-01` stands: zero tugrik either way. **No word, badge, number, ordinal or icon about a repayment order ships, ever.**
4. **The sort key is computed once per debt, never inside the comparator** — `debtOutstanding` walks the payment ledger, and the sort that shipped before this already walked it twice per comparison through `debtSettled`. The new sort does **fewer** ledger walks than the old one.
5. **The cleared/live sort flow would have stayed green over nothing** — its two live records are entered in ascending order — so its live-order assertion was replaced and the new rule got a fixture whose entry order and size order differ. **A green that cannot fail is not a pass.**
6. **Finished debts fold into ONE `<details class="more-fields">` at the foot of `#debtList`, closed on every render, grouped on `debtSettled`.** The second-disclosure off-limits entry is **narrowed by exactly one shape** — finished records only, never a figure, a disclosure, a tile or a form. **No new class, no new CSS, no new primitive.** A hand-rolled toggle was refused. **`SR18` is discharged by its own door, not overruled.**
7. **`C36` gains a complement: it is violated by hiding a DISCLOSURE, never by hiding a FIGURE.** A figure behind a control with its qualification in the open satisfies co-visibility.
8. **The tiles are unchanged and still count the folded-away debts; no sentence explains it and none may** (`.debt-totals` closed at three, permanently). **No expand state is remembered — not in storage, not in a schema field, not in a module-level variable.** **The geometry guarantee is untouched because the group renders below the first card — and it is still re-read at 320/360/390; `ABL-03`'s ladder is spent, so a red 390 stops the shape rather than rewording the sentence.**
9. **Recorded, not scheduled:** the totals that count what the list hides; the group re-collapsing on any action inside it; a finished card's cost chip now one tap away; the 390 guard's thin slack; and Savings Goals with no probe, two rounds older.

---

## Final Recommendation

**Take `ORD-01` alone and take it first: order the live debts by what is still owed, compute the key once per debt, replace the sort comment with the rule that now holds, and repair the flow that would otherwise have passed this change without testing it.** That commit is the whole of the first half, it touches no layout, and its proof is a red-then-green on a fixture whose entry order and size order disagree — which is the only reason anyone will ever be able to say the sort works. Then take `ORD-02` on its own: one `<details class="more-fields">` at the foot of the list holding the debts `debtSettled` says are finished, closed on every render, summary naming the state and the count and nothing else, every control on every finished card still there — and read the geometry flow at all three widths and the demotion flow's button height before you believe either of them is fine. **The sentence I most want carried out of this ruling is the one that decided §2: this application may arrange what it shows and may not tell the user what to do** — the refusal in that file was right for five rounds and it was refusing a financial recommendation, which on a record whose total is fixed at agreement does not exist; what the owner asked for is an order, and an order that says nothing is the only kind this application will ever ship.

*(Design-request ruling, 2026-09-19. Items `ORD-01`–`ORD-03`; rejections `ODR1`–`ODR10`; deferrals `ODD1`–`ODD3`; collisions `ODK1`–`ODK9`; questions `ODN1`–`ODN4`. One off-limits entry narrowed by exactly one shape at §3; one shipped comment replaced at §2; nothing else reopened. Request: `D:\3_Claude\PowerApps\reports\design-request-order-and-the-finished.md`, read in full including §8. In force and read in full: `D:\3_Claude\PowerApps\reports\chief-architect-above-the-list.md`, `chief-architect.md`, `chief-architect-payoff-plan.md`, `chief-architect-settle-a-debt.md`, `chief-architect-repayment-schedule.md`, `chief-architect-effective-rate.md`, `chief-architect-payoff-date.md`, `chief-architect-the-saving.md`, `chief-architect-early-settlement.md`, `chief-architect-fee-calculator.md`, `chief-architect-paste-a-loan.md`, `chief-architect-rate-needs-a-date.md`, `archive-chief-architect-round16.md`, `archive-chief-architect-round14.md`, `HANDOFF.md`, and the five files in `D:\3_Claude\PowerApps\knowledge\`. Verified at source in `D:\3_Claude\PowerApps\expense-pwa\index.html`: `renderDebts`' sort and its full comment, its empty-list branch, the summary-tile reduces and `helperHTML`, the card template with its five controls and its `cleared` / `paidInFull` / `pctLabel` / `hasBar` comments, the listener-attachment block, `debtPaid`, `debtOutstanding`, `debtSettled`, `openDebtPaymentModal`, and the `.more-fields` rules with the `#debtAddFields` summary markup. In `D:\3_Claude\PowerApps\tools\harness\debts.js`: the flows "cleared debts sink below the ones still owed", "a cleared card stops pushing + Payment as its primary action", "a debt is settled when it is paid off, or when the user says so", "one whole debt card is reachable without scrolling" and the closed-`<details>` client-rect note in the add-form flow. **No file was modified and no other role's report was edited.)***
