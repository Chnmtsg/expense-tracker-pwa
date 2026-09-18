# Chief Architect Ruling — Design Request: saying what an early settlement saved

*(Supplemental. The Round 16 ruling at `D:\3_Claude\PowerApps\reports\chief-architect.md`, the settle-a-debt ruling at `reports\chief-architect-settle-a-debt.md`, the early-settlement ruling at `reports\chief-architect-early-settlement.md`, the fee-calculator ruling at `reports\chief-architect-fee-calculator.md`, the paste-a-loan ruling at `reports\chief-architect-paste-a-loan.md`, the Round 15 ruling at `reports\archive-chief-architect-round15.md`, and the standing record at `reports\archive-chief-architect-round14.md` — which carries the round-9 standing decision and the Round 11 through 14 supplementals — **remain in force in full.** This ruling adds to that record and replaces none of it. **No off-limits entry is narrowed by one millimetre. The rate narrowing, the storage narrowing and the `EN4` narrowing are each reaffirmed at exactly the width they were granted.** The `.debt-totals` block stays closed at three sentences, the card's rate copy at one, and the settle sheet's helper at one — all three permanently, and this document opens none of them.)*

*(Instrument. A design request, on the precedent of the six before it. **There is no UI report, no Code report and no Engineering Manager report, and none is owed. There are therefore no reviewer findings, no `WORK-` items and no Critical findings to approve or overrule — I am recording that rather than leaving the obligation silent.** The trigger is verified rather than accepted on report: `SET-01`, `SET-02` and `SET-03` are on `main`, `debtSettled` is at source and shipped, and `ED2`'s row required exactly this round.)*

**ID namespace.** Not a review round, so no `WORK-` items. The item here is `SAV-01`; rejections `DR1`–`DR12`; collisions `DK1`–`DK7`; unasked questions `DN1`–`DN6`. No new deferral is created and none is to be renumbered into or absorbed by a `WORK-`, `PASTE-`, `FEE-`, `ES-` or `SET-` item.

**Ruling issued on all four questions in §5, on §6, on seven collisions and on six things the proposal did not ask. No item is silent.**

---

## Verified Against Source, Not Accepted On Report

- **The figure is not a fourth derived figure, and this is the most useful thing in this document.** In the card loop, `const outstanding = debtOutstanding(d)` is `Math.max(0, totalToRepay − debtPaid(d.id))`. When it is positive, **`agreed − paid` *is* `outstanding`** — the exact local the card already computes and which `SET-02` deliberately stopped labelling "still owed". **Nothing new is derived, no new function is added, and my own `ED2` row overstated the object when it called this a fourth derived figure.** `SAV-01` is a second label on an existing local at one gated site. `DK3`.
- **The gate needs no reference to `settledOn`.** `cleared` is `debtSettled(d)`, and `debtSettled` returns true on `outstanding === 0` **or** a shape-tested ISO `settledOn`. So `cleared && outstanding > 0` **can only be produced by the stored fact**. One predicate, its readers — `SET-02`'s rule one level on. `DN5`.
- **The card foot already carries two gated helper lines, not one**, and the proposal's §2 does not list them: `payments === 0 ? 'No payments recorded yet.'` and `overpaid > 0 ? '… more than agreed is recorded here. Check your payments if that is not right.'` **They are mutually exclusive by construction** — `overpaid` is `Math.max(0, paid − total)` and is zero whenever `payments === 0`. That invariant is load-bearing and is what §4(b) was actually asking about. `DK2`, `DK4`.
- **Option A does not cost "no new element". It costs either a new declaration or the wrong colour.** `.debt-card.cleared .debt-remaining { color: var(--success-text); font-weight: 700; font-size: 15px; }`. Extending that slot prints **₮240,000 in the success colour at weight 700** — the congratulation §4(a) argues against, delivered by CSS instead of by a verb. Avoiding it needs a new span and a new rule on a card three rulings have closed. **A's stated advantage is false at source.** `DK1`.
- **`.debt-actions` already wraps** — `display: flex; gap: 6px; flex-wrap: wrap;` with a comment recording that five controls compressed the icon buttons to 42px at 320px. `SET-03`'s pre-ruled fallback fired and is in the file. **`.debt-foot` wraps too**, and `.debt-remaining` shares that flex row with the five-control action group. A sentence-length `.debt-remaining` makes the foot's geometry depend on the width of a formatted seven-figure amount, at the one width the harness guards. Ruled at Q1.
- **Round 16's chip ground is in the file and it is broader than the measurement.** `.debt-rate`'s comment: *"A SENTENCE, not a fifth chip: at 320px the chip row already wraps with four pills in it, and the figure this module exists to produce cannot land as a bare percentage in a wrapped pill row beside a different bare percentage."* The measured wrap is one ground; **a figure that needs a sentence does not land in a pill** is the other. `DK6`.
- **`pctLabel` is `paidInFull ? 100 : Math.floor(pct)`**, and its comment already records that `paidInFull` and `cleared` stopped having the same answer when `settledOn` arrived. A settled-early card reads **82% repaid beside ✓ Cleared**, both true. Unchanged here, and `SR10` is carried. `DN6`.
- **`debtInterestPaid` still reports ≈₮296,471 of "Cost so far"** on the worked example where ₮120,000 plus a fee was paid. `SR6`/`EN1` carried: not capped, not special-cased, not gated on the predicate, **and not addressed, mentioned or implied by anything this ruling approves.**

---

## Executive Decision

**Yes. This application is fit for release, and I am opening no release gate — tenth round running.** Nothing in this document is built, so nothing in it changes the release state of what is: `SET-01`–`SET-03` on `main`, `npm test` exit 0, the debts harness 33/33 at 320/360/390, deployed as `expense-tracker-v17`. **On the request itself the answer is yes, at option C, at one site, in a wording I am fixing rather than leaving to implementation, and "saved" is refused.** The deciding fact is that the figure is not new: `agreed − paid`, when positive, is the `outstanding` local the card already computes and which `SET-02` stopped calling "still owed" — so what is being asked for is **one gated sentence giving an existing number its correct second label**, in the helper position where an existing gated sentence already reconciles the mirror-image difference. That is the smallest change that closes a gap this project's own change opened, it adds no derivation, no element, no class, no field and no surface, and it is mutually exclusive with both lines already in that position. **I am not rejecting all four**, because the owner asked for this figure, the arithmetic was pre-ruled as admissible, and refusing a live product request when an XS admissible shape exists would be architecture protecting its own tidiness rather than the user's money.

---

## Rulings on the Four Questions in §5

### Q1 — A, B, C, D, or the gap stays open

**C. A rejected, B rejected permanently, D rejected, and the gap does not stay open.**

**Option A is rejected on three grounds, any one sufficient.** First, **`.debt-remaining` is the obligation slot.** It has carried exactly one fact since the module shipped, and the fact it carries answers *what do I owe* — which is the one question the saving does not answer. `SET-02` just finished making that slot say one thing at nine sites; **widening it one commit later is the entry re-opening by the width of the next good argument**, which is the failure mode I wrote down about the rate entry and which binds me here. Second, **the styling makes the claim.** The cleared slot is success-coloured at weight 700; the figure would arrive congratulating in CSS while the wording carefully declines to congratulate in English, and the proposal's own §4(a) is the argument against its own §3 preference. Third, **the layout.** `.debt-remaining` shares a wrapping flex row with a five-control action group that already needed a `flex-wrap` rescue at 320px; putting a sentence in it makes that row's behaviour a function of the digit count of a tugrik amount. **The proposal leaned A and was right about where the eye goes and wrong about what it costs.**

**Option B is rejected permanently.** Round 16's measurement stands and is not the whole of it: the file's own comment rules that **a figure needing a sentence does not land in a pill**, and it ruled that against the figure this module exists to produce. A saving is in the same class — it is meaningless without the words "than agreed", and a pill row is where words go to be skimmed. On a settled-early card with a note and a due date, B is a fifth pill in a row measured to wrap to four rows at 320px. **On the off-limits list, and not re-arguable on the ground that this one is a tugrik amount rather than a percentage.**

**Option D is rejected.** It costs the same implementation as C and reaches only the user who goes looking, which is Round 16's only High and the ground `SR14` rejected the edit-modal shape on two rounds running. **The question is raised on the card, by two figures printed on the card, and it is answered on the card or not at all.** `DK7`.

**Option C ships, and the reason it wins is positional rather than aesthetic.** The card foot already holds a gated sentence that reconciles a difference between `.debt-numbers`' two figures and the agreed total — `WORK-03`'s overpayment line, whose own comment states the job exactly: *"The line reconciles; it does not apologise and does not offer to correct anything."* **The saving is that line with the sign flipped.** Same two stored quantities, same floored subtraction taken from the other end, same reader, same question, same voice, same position, same class. It is not a new kind of object on this card; it is **the missing half of an object already on it.** And because `overpaid` and a positive `outstanding` cannot both be non-zero, the card gains no line it did not already have room for.

**On "reject all four", which was a real candidate and which I considered at length.** It is cheaper and it is what my own principles usually produce. It loses here for three reasons. The gap was **opened by our own commit** — before `SET-02` the difference was labelled (wrongly) and now it is unlabelled, and shipping a deliberate unexplained gap is defensible for one release and not as a resting state. The owner **asked for this figure**, twice, and the early-settlement ruling pre-ruled its arithmetic as admissible precisely so that this round would be about placement. And the target user is defined as having little accounting knowledge, under financial stress: **asking them to subtract ₮1,120,000 from ₮1,360,000 in their head is the work this module refuses to make them do everywhere else.** Work not done is the cheapest work there is, but this work is one gated line reading a local that is already in scope.

### Q2 — The wording, and whether "saved" is permitted

**"Saved" is refused, permanently, on every debt surface. The string is fixed here and is not an implementation choice.**

> **`You marked this settled after paying ₮240,000 less than the agreed total.`**

**Why "saved" is refused — and note that the proposal's own reason is the weakest of the three.** The proposal argues that an early-settlement fee may have made the deal worse. That argument is half spent: the early-settlement ruling established that **the fee is inside `paid`** when the user recorded it, so `agreed − paid` is already net of it. **The real defect is the word's subject.** `agreed − paid` is an exact statement **about the record**; "saved" is a statement **about the world**, and it is true only if every tugrik that left the user's hands reached `db.debtPayments`. A fee paid at the counter and never recorded, or a final payment recorded short, makes "you saved ₮240,000" false while "₮240,000 less than the agreed total" stays exactly true. **This module states what the record holds and never what the world did, and that single rule has now decided four consecutive requests.** Second ground: it congratulates, and a figure that is wrong in the reassuring direction is the one thing this module was built to stop. Third ground, and it is systemic: **"save this much" is the payoff plan's vocabulary**, reserved by build-sequence item 2 in `product-strategy.md`. A settlement line that spends the word now leaves the plan inheriting it for a projection, which is `EK5`'s shape arriving from the other direction.

**Why this string and not the proposal's.** "₮240,000 less than agreed" is correct and incomplete. It states a difference without stating **why the card says ✓ Cleared while money remains against the agreed total** — which is the actual question the user has, and the answer to it is not arithmetic, it is *you told the application this was finished*. The ruled string carries three facts and no fourth: **the user's own act**, **the amount**, and **what the amount is measured against**. It claims nothing about the lender (`ER10`), promises nothing about the user's net position, offers no correction (unlike its overpaid sibling, because settling for less than agreed is not an error to check), and carries no caveat about the fee (`ER4`, and there is nothing left to caveat).

**Binding on the treatment as well as the words.** `.helper` with `style="margin-top:6px"`, identical to the two lines beside it. **No bold on the figure, no new class, no colour modifier, no new declaration.** The overpaid line prints its figure unemphasised and this one does the same: emphasis is how a reconciling sentence turns into a headline.

### Q3 — §4(b): positive-only, and one subtraction feeding two lines

**Positive-only is approved as proposed. The "two voices in two places" worry is dissolved by the location ruling rather than by a unification, and I am adding one gate the proposal did not trace.**

**There is one place, not two.** Both lines are gated `.helper` lines at the card foot, adjacent in the template, in the same voice, reconciling the same pair of figures against the same agreed total. The proposal's worry was real when it thought the saving might land in `.debt-remaining` or a chip; **at C it does not survive contact with the source.** The two quantities are already documented siblings in the file — `debtOutstanding`'s floor comment and `overpaid`'s `Math.max` are the two halves of one subtraction floored from opposite ends. **No refactor of `WORK-03` is approved or needed**, and its rendered output must be byte-identical after this commit.

**The gate is three conditions and the third is mine.** `cleared && outstanding > 0 && payments > 0`.

- `cleared` — `debtSettled(d)`, never a fresh test, never `settledOn` read directly at the call site.
- `outstanding > 0` — positive-only, per §4(b). §4(c)'s zero case falls out without a special case, as the proposal says.
- **`payments > 0` — and without it the sentence is at its most wrong.** A debt marked settled with nothing in its ledger would print *"You marked this settled after paying ₮1,360,000 less than the agreed total"* directly beneath *"No payments recorded yet."* — "after paying" when nothing was recorded as paid, on a figure that describes an empty ledger rather than a settlement. **The proposal traced the zero case and the negative case and not the empty one.** `DK5`.

**The invariant that gate buys is the part worth keeping.** With it, **at most one gated helper line renders under a debt card in every reachable state** — the property the card has today and the reason it has not grown a sentence per round. It is asserted by the harness, not assumed.

### Q4 — §4(d): the fifth summary tile

**Confirmed. No fifth tile, and no aggregate of settlement differences anywhere, permanently.**

The proposal's three reasons are accepted and there are two more. The four tiles are **stocks** — borrowed, paid, owed, cost — each a straight sum over the record; a running total of settlement differences is a **sum of counterfactuals**, one per event, over loans with different terms and different lenders, and it would be the first debt aggregate that is meaningless without the word "agreed" on a card that never displays the agreed total. And a tile is the congratulation refused at Q2, compounded: a single card's line says what one record holds, while a headline tile reading "Saved" is a score. **`.debt-total-item` is `flex: 1 1 40%`, two to a row, with the fourth already gated — a fifth leaves an orphan at 320px and the helper block that would explain it is closed at three sentences.** On the list.

---

## §6 — What the proposal is not asking for

**Accepted in full, every clause onto the off-limits list, with the standing clarification.**

- *Not a rate, not an allocation, not an accrual, not a fee caveat* — accepted. `ER1`, `ER4`, `ER9` carried unchanged and reaffirmed against this request specifically.
- *No change to `debtOutstanding`, `debtPaid`, `debtInterestPaid`, `debtSettled` or any write path* — **accepted and enforced literally. `SAV-01` reads. It writes nothing.**
- *No fourth sentence in `.debt-totals`; no second figure on the rate line* — accepted, carried, permanent.
- *No new storage key, schema field or migration* — accepted. `settledOn` is the last one. **The storage narrowing granted at `SET-01` is not a precedent for a second field and is not widened here.**
- **Clarification, binding, third outing: a disclaimer in a proposal binds the proposal, not the future.**

---

## Approved Improvements

**One item. XS. Conditions are binding and are part of the approval, not commentary on it. It is not authorised to begin; see the Final Recommendation.**

| Item ID | Title | Reason for approval |
|---|---|---|
| **SAV-01** | Say, once, on the card, what a settlement left unpaid against the agreed total | Per Q1–Q3. It closes a gap this project's own `SET-02` opened, it adds **no derived figure** — `agreed − paid` positive is the `outstanding` local already in scope — and it costs one gated line in the position and voice an existing gated line already established. **Conditions, all binding.** **(1) One site, and only this one:** a `.helper` line in `renderDebts`' card template, immediately after the `overpaid` line, `style="margin-top:6px"`, `.helper` unchanged. **No new class, no new declaration, no colour modifier, no bold on the figure.** **(2) The string is ruled and is not an implementation choice:** `You marked this settled after paying ${fmt(outstanding)} less than the agreed total.` — three facts, no fourth; **no "saved", no "written off", no "forgiven", no caveat, no advice to check anything.** **(3) The gate is `cleared && outstanding > 0 && payments > 0`**, all three locals already in scope; `cleared` is `debtSettled(d)` and the settled fact is never read directly at the call site; the `payments > 0` clause is not optional and its reason goes in the comment. **(4) Nothing is written and nothing is recomputed:** `debtOutstanding`, `debtPaid`, `debtInterestPaid`, `debtSettled`, `debtTermDays`, `pctLabel`, the progress bar, the `overpaid` line's own gate and string, the three `.debt-totals` sentences, the rate line, the settle sheet, the payment sheet, the history modal, `computeReminders` and every write path are **untouched**. **(5) One comment**, above the gated line, stating the rule and never a tally. **(6) Fixtures ride this commit** in `tools\harness\debts.js` — **no new runner, no second probe, no fifth static predicate**: the line renders on the settled-early fixture; and it does **not** render on (a) an **unsettled** debt with money outstanding — *this is the binding negative* — (b) a settled debt paid in full, (c) a settled debt with no recorded payments. **(7) Reddening perturbation:** drop the `cleared` clause from the gate and the unsettled fixture goes red. **(8) `npm test` expect 0, and the debts harness at 320, 360 and 390.** **No `sw.js` bump inside the work.** XS. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **DR1** | §3 option A — extending `.debt-remaining` | Per Q1. The obligation slot; success-coloured at weight 700, which congratulates in CSS; and it makes a wrapping flex row depend on the width of a seven-figure amount. **Its stated advantage is false at source.** |
| **DR2** | §3 option B — a fifth `.debt-meta` chip | **Permanently.** The measured wrap is one ground; the file's own rule — **a figure that needs a sentence does not land in a pill** — is the other. Not re-arguable because this figure is tugrik rather than a percentage. |
| **DR3** | §3 option D, or the figure at any second site | Same cost, fewer readers. **The figure appears at exactly one site.** Not the settle sheet, not the payment sheet, not the history modal, not the bell, not the summary card, not the Dashboard, not any period-filtered surface. |
| **DR4** | "Saved", "saving", "you saved", or any wording stating the user is better off | **Permanently, on every debt surface.** Per Q2. |
| **DR5** | "Written off", "forgiven", "waived", or any phrasing attributing the difference to the lender | `ER10` carried. The application does not state what a counterparty did. |
| **DR6** | A fifth summary tile, or any aggregate of settlement differences | Per Q4. A sum of counterfactuals across loans of different terms. **On the off-limits list.** |
| **DR7** | The line on a debt that is **not** settled | **Rejected permanently and named because it is one missing gate away.** That is the predicted saving, refused three times. The harness negative exists to make the regression loud. |
| **DR8** | The line on a settled debt with no recorded payments | Per Q3. Describes an empty ledger as a settlement, in the reassuring direction. |
| **DR9** | Bold, colour, a new class or any emphasis for the figure | Per Q2. Emphasis is how a reconciling sentence becomes a headline. |
| **DR10** | A fourth `.debt-totals` sentence, a second rate sentence, a second settle-sheet sentence | Carried unchanged. **All three stay closed.** |
| **DR11** | A fee caveat attached to this line | `ER4` carried. There is nothing to caveat, because the wording claims nothing about the world. |
| **DR12** | Any change to the derived figures, `pctLabel`, the bar, the `overpaid` line, or any write path; any new storage | §6 accepted and enforced. **`SAV-01` reads and writes nothing.** |
| **All prior rejections** — carried | Every shape in eleven rejection tables | Unchanged and none re-raised. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **`ED2`** | The saving itself | **Discharged. It is `SAV-01`.** Recorded so the trigger chain closes in the file: `ED1` fired, `SET-01`–`SET-03` shipped, `ED2` got its own round, and the arithmetic ruled earlier is the arithmetic that ships — which turned out to be a local the card already held. |
| **`SD1`** | A correction path for a settlement date | **Closed by `SET-03`.** Nothing owed. |
| **Carried** | Every standing deferral | **Unchanged, every trigger intact, none fired.** The effective rate's trigger is a repayment schedule; **a `settledOn` date is not a schedule and does not fire it.** The language layer still needs its own scoped proposal and ruling. **Nothing here authorises a Mongolian string anywhere, including in the sentence it fixes.** |

---

## Conflict Rulings

### DK1 — §3's "no new element" against `.debt-card.cleared .debt-remaining`

**Ruling: false at source, and the falsity is the reason A loses.** Option A either prints the figure in the success colour at weight 700 — the congratulation the same document argues against one section later — or it adds a span and a declaration. **The proposal's §3 and its §4(a) are in conflict and §4(a) is the one that is right.**

### DK2 — §2's "what is left" enumerated short

**Ruling: the card foot already holds two gated helper positions and §2 does not list them; §3 finds one anyway and calls it option C.** This is the **fourth** time a proposal about this module has found the right rule and enumerated its sites short. **It is not a criticism; it is the standing evidence for why this project states rules and never tallies.**

### DK3 — "a fourth derived figure", which is my own words

**Ruling: there is no fourth derived figure. `agreed − paid` positive is `outstanding`.** My `ED2` row described the object before I had re-opened the source. **A deferral row written without the source open describes the shape it feared, not the shape that arrives** — the second time in three rulings. **It is what makes `SAV-01` XS instead of S.**

### DK4 — §4(b)'s "two voices in two places"

**Ruling: at option C there is one voice and one place.** Both lines are `.helper` at the card foot, mutually exclusive by construction. **No unification is approved and `WORK-03`'s rendered output must be byte-identical after this work.**

### DK5 — §4(c) traced the zero case and not the empty one

**Ruling: the `payments === 0` case is real and is where the sentence would be most misleading.** Ruled into the gate rather than into the wording.

### DK6 — §3's reading of Round 16's chip rejection

**Ruling: the measurement is one ground; the file's own comment carries the other, and it binds.** **A pill carries a fact you skim. This figure is unreadable without "than agreed".**

### DK7 — option D against Round 16's only High

**Ruling: D is rejected, and not because it is harmful — it is inert, which is the more expensive failure.** A wrong line is found and removed; a correct line nobody reaches is paid for once and never again.

---

## Rulings on What the Proposal Did Not Ask

**DN1 — the string is a literal and stays one.** Nothing authorises a Mongolian string or the language layer.

**DN2 — `.helper` unchanged, `style="margin-top:6px"`, identical to both siblings.** No class, no declaration, no colour.

**DN3 — position is immediately after the `overpaid` line**, so the source reads *no payments / more than agreed / less than agreed*.

**DN4 — the negative assertion is the one that matters.** A fixture proving the line is **absent** on an unsettled debt is the mechanical guard against the predicted saving.

**DN5 — `debtSettled(d)` is the gate and the settled fact is never re-tested at the call site.**

**DN6 — `pctLabel` still reads 82% beside ✓ Cleared and that is not this item's problem to tidy.** If anything the new line is the first thing on the card that **explains** the 82%.

---

## Development Order

| Order | Item | Why here |
|---|---|---|
| — | **The owner's approval of this shape** | **This ruling decides a shape; it does not authorise work.** The owner asked for a saving figure and is getting **one gated sentence that never uses the word "saved"** — a product-visible departure they should see before it is built. |
| 1 | **SAV-01** | First and only. Its entire risk is in one gate, which is why its fixtures, and above all the unsettled negative, ride the same commit. |

**No `sw.js` bump inside the work.** The deploy that carries this bumps to v18 **once**, as a deliberate pre-deploy act.

---

## Architecture Strategy — next quarter

**What stays.** Everything in the standing record, **with no entry narrowed by this document.** Single self-contained file, no build step, no dependency, offline-first, **correctness of financial data above everything** — and this request is decided by that clause at the word: `agreed − paid` is exact about the record and "saved" would have been a claim about the world.

**What changes.**

1. **A gated line on a card must prove exclusivity or it does not ship.** The card carries three gated helper lines after `SAV-01` and renders at most one in every reachable state, by construction. **That is now the rule rather than an accident.**
2. **One figure may carry a second label at a gated site; it may not carry two labels at one site.** `outstanding` is "still owed" on a live debt and "less than the agreed total" on a settled one, and the two never render together.
3. **Vocabulary is reserved across the roadmap, not only within a card.** "Save this much" belongs to the payoff plan and is not spent two quarters early. **A word a ruled future item needs is a resource.**
4. **The record, never the world.** Fourth consecutive ruling decided by it: the application says what was agreed, what was paid, and what the user said. **It does not say whether the user came out ahead.**
5. **A deferral row written without the source open describes the shape it feared.** Twice in three rulings I have pre-ruled an object larger than the one that arrived. **Pre-ruling a constraint is still right; pre-ruling a size is not.**

**Off limits this quarter — five additions:** the word "saved" and every synonym asserting the user is better off, on any debt surface; the difference at any site other than the one `SAV-01` names; a fifth summary tile or any aggregate of settlement differences; the difference on a debt that is not settled; and a chip carrying a figure unreadable without its comparison stated.

**Risks recorded, not scheduled.**

- **Mine, and the largest, and new.** `SAV-01`'s figure is exact about the ledger and optimistic about the world whenever the ledger is incomplete. **The wording is the entire mitigation and it is why the wording is ruled** — "less than the agreed total" stays true on an incomplete ledger where "saved" would not.
- **Mine, from `DR7`.** This line is one gate clause away from the predicted saving three rulings refused. **The harness negative is the only thing standing between a future edit and that regression, and it is not optional.**
- **Carried and now sharper.** "Cost so far" still overstates an early settlement by roughly two and a half times, beside a new line that reconciles a different pair correctly. **A card where one gap is explained and a larger one is not may read as the app having checked. It has not.**
- **Carried.** A backup written by this build and restored by an older one loses `settledOn`, and now also its explanation line. The Debts screen still has no archive and each settled-early card is one line taller. `totalToRepay` has no edit trail. Every string is a literal. The bell badge has six write sites to remember. The add form stands at ten controls and the action row at five; **the next control on either should expect a scope question rather than an approval.**

---

## Final Recommendation

**Put this shape to the owner, and when they approve it take `SAV-01` alone: one gated `.helper` line in `renderDebts`' card template, immediately after the overpayment line, reading `You marked this settled after paying ₮240,000 less than the agreed total.`, gated on `cleared && outstanding > 0 && payments > 0`, with its four fixtures — and nothing else until it is green.** The owner should be told plainly what they are approving, because it is not what they asked for: they asked to see **what was saved**, and they are getting a sentence that never says "saved", because `agreed − paid` is exact about what this application's record holds and silent about whether the user came out ahead. **The sentence I want carried out of this ruling is the one that made the whole round XS: the figure was never a fourth derived figure — it is `outstanding`, the number the card has always computed and which `SET-02` stopped calling "still owed", so what was needed was not a new figure on a closed card but the correct second label on a number that was already there.**

*(Design-request ruling, 2026-09-18. Supplemental to the Round 16 ruling and the settle-a-debt, early-settlement, fee-calculator and paste-a-loan design-request rulings, and to the round-9 standing decision with the Round 11 through 15 supplementals — all of which remain in force in full, with no entry narrowed by this document. Item `SAV-01`; rejections `DR1`–`DR12`; collisions `DK1`–`DK7`; unasked questions `DN1`–`DN6`; `ED2` discharged. Source: `D:\3_Claude\PowerApps\reports\design-request-the-saving.md`.)*
