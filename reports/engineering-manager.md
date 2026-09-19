# Engineering Manager — Round 17 Work Plan

*Inputs: `D:\3_Claude\PowerApps\reports\ui-review.md` (UI-01…UI-06, score 78) and `D:\3_Claude\PowerApps\reports\code-review.md` (CODE-01…CODE-11, score 78), both read in full and unmodified. Render read: `D:\3_Claude\PowerApps\reports\shot-debts-390.png`. Source under discussion: `D:\3_Claude\PowerApps\expense-pwa\index.html`.*

**ID note.** The `WORK-` IDs below are round-17 IDs, numbered from 01 per the convention. Round 16 also issued `WORK-07`, `WORK-10` and `WORK-202`; wherever those are meant they are written as "round-16 WORK-nn" and never bare.

**Coverage.** 17 findings in, 13 `WORK-` items out. Four findings were absorbed by merges (UI-05+CODE-04; UI-04+CODE-05; UI-06+CODE-02+CODE-08). Nothing was dropped and nothing was invented. No severity was changed.

---

## Project Health

Both reviews independently scored this surface **78/100**, and they arrived there from opposite directions: UI Review found one High and four Mediums in what the screen does to the user, Code Review found one High and five Mediums in what the code does to the next change. Neither raised a Critical, so **nothing here blocks release** — the figures are right, the gates are provably exclusive, accessibility and escaping are clean, and the owner's complaint is about density, not correctness. The honest reading is that the Debts list is a correct module that has grown past the device it runs on: at 390px no complete debt card is visible on first paint, and the reason it got there is that ten rulings each checked one element for truth and none of them for height, because no instrument in the suite measures height. The work below is roughly four days and is almost entirely presentation and instrumentation.

---

## Priority Matrix

No finding in either report is Critical, so there is no P0 and nothing on this list blocks release.

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Merge the seven duplicated goal/debt card rules into single shared definitions, so density has one lever per property | CODE-01 | High (CODE) | P1 | S | — |
| WORK-02 | Put card geometry under assertion and add a 390px width to the suite | CODE-06 | Medium (CODE) | P1 | S | — |
| WORK-03 | No complete debt card on first paint — collapse the `showCost`-gated summary pair behind the screen's existing `<details>` | UI-01 | High (UI) | P1 | S | WORK-02; **architect ruling on C36**; WORK-12 if the fallback shape is ruled |
| WORK-04 | Suppress the progress track in the two states where it carries no information (`paid === 0`, `paidInFull`) | UI-05, CODE-04 | Medium (UI), Medium (CODE) | P2 | XS | WORK-02 |
| WORK-05 | Reduce `.debt-pct` from 22px to `--t-h3` so the card's largest element stops out-ranking its headline figure | UI-03 | Medium (UI) | P2 | XS | WORK-01 |
| WORK-06 | Differentiate the card's rhythm — two groups instead of seven equal 12px-separated peers | UI-02 | Medium (UI) | P2 | XS | WORK-01, WORK-02 |
| WORK-07 | The chip row: build it from one ordered array, then make the chips fill their row instead of trailing off it | UI-04, CODE-05 | Medium (UI), Medium (CODE) | P2 | S | WORK-01; mandatory re-render at 320/360/390 gates acceptance |
| WORK-08 | Convert the opened block's spacing and type literals to tokens; decide the off-scale values deliberately | UI-06, CODE-02, CODE-08 | Low (UI-06), Medium (CODE-02), Low (CODE-08) | P2 | S | WORK-01; overlapping declarations ride along with WORK-06 |
| WORK-09 | Replace the four inline `margin-top` overrides of `.helper` with one class | CODE-03 | Medium (CODE) | P2 | XS | pairs with WORK-03 |
| WORK-10 | Name the anonymous inline-styled head wrapper | CODE-07 | Low (CODE) | P3 | XS | WORK-01 (same edit) |
| WORK-11 | Assert the `.helper` count inside `#debtTotals` in both states | CODE-09 | Low (CODE) | P3 | XS | lands alongside WORK-03 |
| WORK-12 | Split the two gated summary sentences into separately gated elements | CODE-10 | Low (CODE) | P3 → P1 if the UI-01 fallback is ruled | XS | architect ruling on C36 |
| WORK-13 | Collapse the five listener-attachment blocks into one `[attribute, handler]` table | CODE-11 | Low (CODE) | P3 | XS | — |

---

## Quick Wins

Genuine quick wins — XS effort, each removes a Medium, each stands alone once its prerequisite exists:

- **WORK-04** (XS) — one template condition, removes the exact artefact the owner pointed at, engages no ruling, no copy, no derivation.
- **WORK-05** (XS) — one declaration, corrects the card's worst hierarchy inversion without touching a word of ruled copy.
- **WORK-06** (XS) — CSS only, and it is the mechanical difference between a dense card and a busy one.
- **WORK-09** (XS) — deletes four inline styles and makes the foot lines and summary prose reachable from the stylesheet at all.

Qualify on effort but are **not** wins — do not schedule them as such:

- **WORK-01** and **WORK-02** are S and cheap, but they deliver nothing the owner can see. They are prerequisites. Their value is that they make the four items above safe and demonstrable.
- **WORK-03** is S and it is the High with the largest user-visible payoff, but it cannot start until the architect rules. An item blocked on a decision is not a quick win.
- **WORK-07** is S but carries a mandatory re-render and a named disposition to close it unfixed. That is a judgement call, not a win.

---

## Sprint Plan

**Sprint 1 — make the change safe, then make the three unblocked moves.**

Items: **WORK-01, WORK-02, WORK-04, WORK-05, WORK-06** (with WORK-08's overlapping declarations converted inside the WORK-06 commit, since that commit is already rewriting those exact lines — UI-06's argument, and it costs nothing there).

Total effort: 2 × S + 3 × XS ≈ **two days**.

What the sprint delivers:
- One site per property for every duplicated card rule, so the Savings Goals card cannot drift silently while Debts gets denser.
- The first assertion in this project's history that observes a debt card's height, its bar and its top offset — plus the owner's own 390px width in the suite. Round 18 can then be prevented rather than repeated.
- The debt card drops from ~294px to roughly ~258px and resolves into two readable groups instead of seven equal blocks; the empty grey track disappears from the no-payment and cleared cards; the derived percentage stops out-ranking the cost figure. Not one sentence, figure, chip, control or derivation removed.

Explicitly **not** in Sprint 1: WORK-03. It is the P1 High and it has the biggest single effect on the owner's first complaint, but it cannot begin without the C36 ruling. **I will pull it into Sprint 1 the day that ruling lands** — it is S and it fits. I am not planning a sprint around an item that cannot start.

---

## Roadmap

- **Sprint 1** — WORK-01, WORK-02, WORK-04, WORK-05, WORK-06. (WORK-03, and WORK-12 if the fallback is ruled, pulled in immediately if the C36 ruling arrives in time.)
- **Sprint 2** — WORK-03, WORK-09, WORK-11, WORK-07.
- **Sprint 3** — WORK-08 (remainder), WORK-10, WORK-12 (if not already pulled forward).
- **Later** — WORK-13.

---

## Dependencies

**WORK-01 before WORK-05, WORK-06, WORK-07, WORK-10.** Three of the five UI quick wins edit rules that Code Review proved are line-for-line clones of the goal card's — `.debt-pct`/`.goal-pct` (WORK-05), `.debt-head`/`.debt-meta`/`.debt-rate` margins (WORK-06), `.debt-meta`/`.goal-meta` (WORK-07). Editing them before the merge either drifts the twin against two in-file comments that assert they are identical, or forces the same edits to be redone after the merge.

**Risk carried on WORK-01:** round-16 WORK-07 ruled that `.debt-pct` is a per-module rule and `.goal-pct` is not touched. The merge must therefore leave `.debt-pct`'s font-size as a deliberate debt-only declaration, not fold it into a shared selector, or WORK-05 will silently resize the Savings Goals percentage. This is exactly the class of divergence CODE-01 wants made explicit rather than accidental.

**WORK-02 before WORK-03, WORK-04, WORK-06.** Nothing in `tools/harness/` observes `.goal-bar`, `.debt-pct-label`, the chip rows, card height, card-to-card variance, or this screen at 360 or 390. Without the flow first, each of these changes is asserted by a screenshot — which is how the card reached 294px over ten rounds. Code Review also notes C37 requires the author of a condition to demonstrate red-then-green.

**WORK-09 pairs with WORK-03.** The summary prose margin (`:10063`) and the gated foot lines (`:10371-10373`) are inline styles inside a template literal, unreachable from any stylesheet. The two pieces of copy this round is asked to look at cannot be re-spaced until those four overrides become a class.

**WORK-12 before WORK-03 — but only under the fallback shape.** UI-01's fallback discloses the second summary sentence and keeps the first and third open. Those two sentences currently share one `.helper` div under one `showCost` gate, with no id and no modifier. **The fallback is not buildable without WORK-12 first.** The primary shape (disclose both gated sentences together) does not need it. This is the single most important conditional dependency in the plan and it turns a Low P3 item into a P1 blocker the moment the architect chooses the fallback.

**WORK-11 alongside WORK-03.** The three-sentence closure on `#debtTotals` is comment-only; nothing counts `.helper` there. The one block this round may be asked to restructure is unguarded in both directions — against growth and against loss. If WORK-03 lands, the count should land with it.

**WORK-07 internal order and gate.** CODE-05's ordered-array refactor comes first (it gives the shape one place to live), then UI-04's fill-the-row declaration. Acceptance is gated on a re-render and an eyeball at 320, 360 and 390 on the existing debts harness. UI Review states the honest disposition explicitly: if the stretched chip reads worse than the ragged one, close the finding unfixed rather than spend copy on it.

**WORK-08 overlaps WORK-06.** The declarations WORK-06 rewrites should be tokenised in that same commit. The remainder — card padding, bar height, foot gap, inter-card margin, the four off-scale values — is a separate S and does not need to be in Sprint 1. Do not let this become an app-wide spacing sweep; UI Review states that shape is off limits and it stays off limits.

---

## Conflicts

### C-1 — Sequencing: values first, or instruments first

**Code Review's position.** CODE-01 and CODE-06 must both land before any value moves. Otherwise the density change cannot be demonstrated red-then-green and will silently drift the Savings Goals card, which has no probe in `tools/harness/` at all.

**UI Review's position.** Its Quick Wins list is ordered UI-05, UI-03, UI-02 first — three XS presentation fixes, each of which removes an artefact the owner pointed at directly, none of which needs anything built first.

**My recommendation, as the sequencing decision asked for: instruments first. CODE-01 and CODE-06 land before any value moves.**

**What that costs.** Roughly two S items — about one day — during which the owner sees no change at all. It delays the first visible density win by that day, and it front-loads a sprint with a no-op render and a test flow, which is the least satisfying way to answer a complaint that arrived as "it didn't looks fine".

**Why I am paying it.** The cost of the other order is higher and it is not hypothetical. Three of UI Review's five quick wins (UI-02, UI-03, UI-04) edit rules Code Review demonstrated are byte-for-byte clones of the goal card's, sitting under two in-file comments asserting the two are kept identical — so "values first" means either the Savings Goals card drifts with nothing watching it, or the same three edits are done twice. And the card's height is the one quantity in this module that nothing has ever asserted: `t.F_pay_top_closed` already *records* the exact number this round is about and checks it against nothing. Without WORK-02 the claim "one more whole card per screen" is a screenshot, and the eleventh ruling will be assessed the way the first ten were.

**The concession I am making to UI Review's order.** WORK-04 (the progress track) touches the template only — it gates the element, not the shared `.goal-bar` rule — so it is not blocked by WORK-01 and could ship on day one. I am still holding it until WORK-02's flow exists, because nothing observes the bar today and Code Review asks for the assertion in the same change, but if the architect wants one visible win inside the first day, **WORK-04 is the one item that can be pulled forward without breaking the argument above.** WORK-03 is likewise unblocked by WORK-01 — it is a different block — and is held only by the ruling.

### C-2 — Who decides the chip row's shape, and whether it gets fixed at all

**UI Review (UI-04)** proposes a specific CSS shape: `flex: 1 1 auto` on `.debt-meta > .goal-meta-item`, left-aligned, so chips fill their row and the card gains a straight right edge at all three widths — and names a condition under which the correct answer is to accept the raggedness and close the finding unfixed.

**Code Review (CODE-05)** holds that the chip *count* is closed by ruling so the fix is shape not deletion, that **the shape is the architect's to choose**, and that the code-side deliverable is only the ordered-array refactor that gives them somewhere to land it. It does not contemplate closing the finding unfixed.

Not resolved here. The two are compatible in sequence, but they disagree on whether the shape is UI Review's to propose or the architect's to choose, and on whether "do nothing" is an acceptable outcome. Both belong to the architect.

### C-3 — Severity and effort on the literals

The same defect is filed at two severities: **UI-06 calls the spacing literals Low** ("no user-visible failure today"); **CODE-02 calls them Medium** ("a density pass has to locate nine numbers in two files"). Effort differs too — UI-06 says XS *if folded into the UI-02 commit*, CODE-02 says S standalone, CODE-08 says XS. I have changed neither severity. I priced WORK-08 at **S** because Code Review counted nine literals across two files plus four inline overrides, of which only a subset falls inside WORK-06's commit; and I set its priority at **P2** off the higher of the two severities, per the rule that priority is mine and severity is not.

### Open ruling required — not a disagreement between reviewers

**WORK-03 / UI-01.** This is the one item that cannot be built until the Chief Architect rules. UI Review did what the constraint requires — named the ruling, argued against its stated reason, and flagged a tension it says it is not authorised to resolve. Carried forward intact, including the fallback:

> **The proposal.** Do not delete a sentence. Render the `showCost`-gated two-sentence div (`:10066`) inside the screen's own `<details>` primitive — the same native control already used at `:3111`, no new component — placed immediately beneath the four tiles with a summary that names what it answers. Keep the ungated sentence at `:10064` permanently open. Recovers approximately 85px above the first card.
>
> **The ruling that put it there, and the argument against its stated reason.** The block is closed at three sentences by the in-file ruling at `:10059-10061` and reaffirmed in `archive-chief-architect-round16.md` (rejection table: *"no fourth sentence in the `.debt-totals` block"*). The gated pair's own stated reason is at `:10032-10033` — *"THE COST SENTENCE IS GATED, because it explains a figure and should appear with it."* That reason is satisfied, not defeated, by a disclosure rendered directly under the tile it captions: the gate is untouched, the one-site rule at `:10055-10057` is untouched, and the sentence remains with its figure, one tap away rather than absent. What the reason does **not** establish is that the sentence must be permanently expanded — that was never argued, only inherited. And the closure's own stated purpose (`:10060`, *"a card that grows one sentence per review round is a card nobody reads"*) is an argument for readability. A permanently-open 5-line grey paragraph above the list defeats that purpose on its own terms; a closure that caps growth does not require the capped content to be always-on.
>
> **The tension UI Review is not authorised to resolve.** C36 — *a figure the application computed by a model of its own is labelled as such wherever it is presented as a fact about the outside world* — binds the third sentence specifically (*"It is spread evenly across your repayments, so it may not match your lender's own statement"*), because that is the model disclosure for the "Cost so far" tile. A collapsed disclosure is arguably not a label.
>
> **Fallback shape if C36 is read strictly.** Disclose only the second sentence (*"The figure above is the part of that extra…"*) and keep sentences 1 and 3 open. That recovers ~34px instead of ~85px, and it is the version UI Review would ship if the architect reads C36 as requiring the model statement to be visible.

I am not resolving this, and I have not preferred one shape over the other in the plan. I add only one implementation fact the architect needs before choosing: **the fallback is the more expensive of the two shapes to build**, because the two gated sentences currently share a single element with one gate, no id and no modifier (CODE-10), so the fallback requires WORK-12 first. The primary shape does not.

---

## Estimated Effort

| Band | Items | Effort | Rough time |
|---|---|---|---|
| P0 | — | — | none; no Critical findings in either report |
| P1 | WORK-01, WORK-02, WORK-03 | 3 × S | ~1.5 days |
| P2 | WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09 | 4 × XS + 2 × S | ~1.5–2 days |
| P3 | WORK-10, WORK-11, WORK-12, WORK-13 | 4 × XS | ~2 hours |
| **Total** | **13 items** | | **~3.5–4 days** |

**Cosmetic housekeeping the owner's complaint does not require** — recorded honestly so the architect can cut scope:

- **WORK-13** (listener table) — pure duplication cleanup, adjacent to the action row, which the owner explicitly did *not* choose as a problem. Cuttable with no loss to this round.
- **WORK-10** (name the head wrapper) — internal cleanliness. Only becomes load-bearing if a future change tries to bring the percentage onto the name's line. Cuttable, though it is nearly free inside WORK-01.
- **WORK-08's type half** (CODE-08's four token conversions) — invisible to the owner. The one exception is `.debt-pct`, which WORK-05 is changing anyway. Cuttable; the spacing half is preparation the standing convention at `:124-127` says is owed when a block is opened, and this round opens it.
- **WORK-11** (assert the sentence count) — no user-visible effect, but it is the guard on the one block this round may restructure, in both directions. Cuttable only if WORK-03 is refused.
- **WORK-12** — housekeeping *unless* the fallback shape is ruled, at which point it is a blocker.

**Not cuttable without abandoning the owner's complaint:** WORK-03 (complaint 1, the wall of text), WORK-05 and WORK-06 (complaint 2, tall and busy), WORK-04 and WORK-07 (complaint 3, ragged and the empty track). WORK-01 and WORK-02 are not cuttable either, but for a different reason: they are what makes the other five safe and provable.

---

## Recommendations

1. **Rule on C36 first, before Sprint 1 ends.** WORK-03 is the only High with a direct user-visible payoff, it is S, and it is the single item in this plan that cannot start without you. Both shapes are on the table and both are buildable; the primary recovers ~85px and needs nothing extra, the fallback recovers ~34px and needs WORK-12 first. Either answer unblocks the sprint; no answer leaves the owner's first complaint untouched.
2. **Approve instruments-first.** It costs one day of invisible work. The alternative drifts the Savings Goals card — which has no probe anywhere in the harness — or does three of the five fixes twice.
3. **WORK-02 is the item that stops round 18 being round 17.** Ten rulings each added one true element and none of them was measured for height, because nothing measures height. `t.F_pay_top_closed` already records the exact number this round is about and asserts nothing against it. If you cut one thing from this plan, do not cut that one.
4. **Decide WORK-07 deliberately.** UI Review has offered you a legitimate "close it unfixed" outcome if the stretched chip reads worse than the ragged one. That is the owner's literal third complaint, so if you take the close-unfixed path, say so out loud rather than letting it lapse.
5. **You can cut roughly half a day** — WORK-13, WORK-10, and WORK-08's type half — without weakening the answer to anything the owner said. I would keep WORK-11.
6. **Nothing in this plan removes a sentence, a figure, a chip, a control or a derivation.** No closure is reopened. The only item that engages a ruling at all is WORK-03, and it relocates copy rather than deleting it.

*(Round 17. WORK-01…WORK-13, absorbing UI-01…UI-06 and CODE-01…CODE-11. Sources: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`. Evidence render: `D:\3_Claude\PowerApps\reports\shot-debts-390.png`.)*
