# UI Review — Round 17

**Scope.** The visual density of the Debts **list** on the Debts screen, `D:\3_Claude\PowerApps\expense-pwa\index.html`, at 320, 360 and 390px. In scope: `#debtTotalsCard` and its three sentences, the `renderDebts` card template, and the CSS for `.debt-card`, `.debt-head`, `.debt-name`, `.debt-pct-wrap`, `.debt-numbers`, `.debt-rate`, `.debt-meta`, `.goal-meta-item`, `.goal-bar`, `.debt-foot`, `.debt-remaining`, `.debt-actions` and the gated foot helper lines.

**Primary evidence.** `D:\3_Claude\PowerApps\reports\shot-debts-390.png` — a verified capture at `clientWidth` 390, `overflow` 0, five realistic records. Every measurement below was taken off that render and then reconciled against the declared CSS; where the two disagreed I trusted the render. The decomposition of card 1 below sums to 295px against 294px measured, which is the check that the rest of the arithmetic is sound.

**Not reopened.** No figure, derivation, rate wording, storage shape or write path is questioned here. The ten standing design-request rulings and `archive-chief-architect-round16.md` are treated as in force in full. One finding (UI-01) proposes relocating existing copy without deleting a word of it, and it names the ruling and argues against that ruling's stated reason, as required.

---

## Executive Summary

The Debts list is built out of well-reasoned parts that have never been measured against each other as a stack. Every element on a debt card was justified on its own merits and won; the result is a 294px card, seven blocks separated by four identical 12px gaps, in which the largest, bluest, most dominant element is a derived restatement of the line directly beneath it. The single biggest problem is not any one element — it is that **at 390px no complete debt card is visible on first paint**: 366px of summary card, prose and disclosure sit above a 294px card in roughly 601px of content viewport. The owner's three complaints are all real and all measurable, and the fourth thing they did not choose — the control count — is correctly not the problem. Nothing here is wrong; the screen states true things at a density no untrained user will read.

---

## Overall Score

**78 / 100** — Solid.

One contained High and four Mediums against the reviewed surface hold it below 90. It does not fall to the 60-74 band because there is only one High, the module's correctness, accessibility, contrast, empty states, confirmation and currency discipline are clean within this surface, and every finding below has an XS or S fix that touches presentation only. This score is for the Debts list as rendered, not for the application.

---

## Strengths

- **The card's accessibility is genuinely done, not claimed.** All five controls carry `title` and `aria-label` (`:10364-10368`), the icon buttons are a declared 44x44 and `+ Payment` a declared `min-height: 44px` (`:1720-1730`), the global `:focus-visible` rule at `:1212` reaches all of them, and `.debt-actions` was made to wrap specifically so the fifth control could not shrink the row below 44px (`:1829-1840`). That comment records a measured failure and the fix for it. This is better than most production code.
- **No meaning is carried by colour alone anywhere on the card.** The danger chip says "overdue 18d", the cost chip says "Cost so far", the cleared card says "✓ Cleared". The red and the green are confirmation, never the signal.
- **`.debt-pct` carries its "repaid" caption** (`:10350`, `:1798`). The ambiguity that a rising percentage on a debt means the opposite of a rising percentage on a goal was identified and closed before a second percentage landed on the card. UI-03 below is about that element's *size*, not its label, and the label is why UI-03 is a Medium and not a High.
- **`pctLabel` floors rather than rounds** (`:10208`) so a 99.6% card cannot print "100%" beside "₮5,000 still owed". A density review has no business touching that and it is worth saying it is right.

---

## Findings

### UI-01 — No complete debt card is visible on first paint; the screen's purpose is below the fold

- **Severity:** High
- **Location:** Debts screen — `#debtTotalsCard` at `D:\3_Claude\PowerApps\expense-pwa\index.html:3086-3089`, the tiles and helper block generated at `:10062-10094`, the disclosure card at `:3110-3115`. Render: `D:\3_Claude\PowerApps\reports\shot-debts-390.png`.
- **Evidence:** Measured off the render at 390px. App header 66px. Page top padding 18px. `#debtTotalsCard` **288px** — an `h3`, four tiles in two rows, then a 102px block of five prose lines at 13px `--text-2`. Card gap 12px. The "Record borrowed money" disclosure card **54px**. Card gap 12px. First debt card begins at **y≈468**. On a 390x844 device the usable content area between the 66px header and the 78px bottom nav is roughly 601px, of which **366px is spent before the list starts**. The first debt card is 294px tall, so approximately 217px of it — 74% — is visible, and no card is whole. Below the tiles, the three ruled sentences render as one undifferentiated 5-line grey paragraph: one ungated sentence (`:10064`) and a `showCost`-gated div carrying two more (`:10066`).
- **Impact:** The Debts screen exists so a user can glance at what they owe. On the device it was designed for, the glance lands on an aggregate and a paragraph, and the user must scroll before a single debt is legible. This is the owner's first complaint and it is arithmetically correct. It also compounds: the prose block is a fixed cost paid on every visit, by a returning user who read it months ago, in front of the list they came for.
- **Recommendation:** Do not delete a sentence. Render the **`showCost`-gated two-sentence div** (`:10066`) inside the screen's own `<details>` primitive — the same native control already used at `:3111`, no new component — placed immediately beneath the four tiles with a summary that names what it answers. Keep the ungated sentence at `:10064` permanently open. Recovers approximately 85px above the first card and removes the wall.

  **The ruling that put it there, and the argument against its stated reason.** The block is closed at three sentences by the in-file ruling at `:10059-10061` and reaffirmed in `archive-chief-architect-round16.md` (rejection table: *"no fourth sentence in the `.debt-totals` block"*). The gated pair's own stated reason is at `:10032-10033` — *"THE COST SENTENCE IS GATED, because it explains a figure and should appear with it."* That reason is satisfied, not defeated, by a disclosure rendered directly under the tile it captions: the gate is untouched, the one-site rule at `:10055-10057` is untouched, and the sentence remains with its figure, one tap away rather than absent. What the reason does **not** establish is that the sentence must be permanently expanded — that was never argued, only inherited. And the closure's own stated purpose (`:10060`, *"a card that grows one sentence per review round is a card nobody reads"*) is an argument for readability. A permanently-open 5-line grey paragraph above the list defeats that purpose on its own terms; a closure that caps growth does not require the capped content to be always-on.

  **The tension I am not authorised to resolve, stated for the Chief Architect.** C36 — *a figure the application computed by a model of its own is labelled as such wherever it is presented as a fact about the outside world* — binds the third sentence specifically (*"It is spread evenly across your repayments, so it may not match your lender's own statement"*), because that is the model disclosure for the "Cost so far" tile. A collapsed disclosure is arguably not a label. **Fallback shape if C36 is read strictly:** disclose only the second sentence (*"The figure above is the part of that extra…"*) and keep sentences 1 and 3 open. That recovers ~34px instead of ~85px, and it is the version I would ship if the architect reads C36 as requiring the model statement to be visible.
- **Effort:** S

---

### UI-02 — Four identical 12px separators make the card seven equal blocks with no grouping

- **Severity:** Medium
- **Location:** `expense-pwa\index.html` — `.debt-head` `:1773`, `.debt-rate` `:1804`, `.debt-meta` `:1809`, `.goal-bar` `:1688`; card template `:10337-10374`.
- **Evidence:** Card 1 in the render decomposes exactly: 16 padding + 56 head (name 22, numbers 18+4 margin, 12 separator) + 48 rate (36 text over two lines, 12 separator) + 64 chips (two 23px rows, 6 gap, 12 separator) + 22 bar (10 + 12 separator) + 73 foot (21 remaining line, 8 gap, 44 button row, which wraps at 390) + 16 padding = **295px**, against 294px measured. Of that, **48px — one sixth of the card — is four separators of identical value**, so the gap between the lender's name and the cost sentence is the same as the gap between the chip row and the progress bar. Nothing on the card is grouped with anything else.
- **Impact:** This is the mechanical cause of the owner's "too busy". Seven blocks at equal visual distance read as seven peers, so the eye has no entry point and must process all of them. On a card that already states one ratio four different ways, uniform rhythm is what turns density into noise. The user has to work out the structure of the card every time instead of once.
- **Recommendation:** Differentiate the rhythm. 8px (`--s2`) between the three blocks that describe **what the debt is** (`.debt-head` → `.debt-rate` → `.debt-meta`), and 16px (`--s4`) before the foot, which is **where it stands and what you can do**. Two groups instead of seven peers, ~12px saved per card, no element moved, added or removed. CSS only.
- **Effort:** XS

---

### UI-03 — The card's largest element restates the line under it; the module's headline figure is its smallest

- **Severity:** Medium
- **Location:** `.debt-pct` `:1782`, `.debt-pct-wrap` `:1797-1798`, `.debt-numbers` `:1778-1781`, `.debt-rate` `:1804-1805`; template `:10342-10351`, `:10319-10321`.
- **Evidence:** In the render, card 1 reads "**16%** repaid" at 22px/800 in `--primary-text` in the top-right, and directly beneath the name "₮340,000 paid of ₮2,040,000" — the same fact, exactly, from which the 16% is derived. 22px is `--t-h2`, the largest type token in the module and the same size as `.debt-total-value` on the summary card. Two lines below it, the figure this module exists to produce — "Costs you as much as a loan charging **81%** a year on what you still owe" — renders at 13px/800 inline in a sentence. Card 2 is "30%" at 22px against "119%" at 13px; card 4 is "19%" against "30%". On every card with a rate, the **derived restatement is 22px and the headline cost is 13px**.
- **Impact:** The owner named "a large percentage badge" as part of what makes the card busy, and they are reading the hierarchy correctly. A user scanning five cards scans five big blue percentages that tell them what "₮X paid of ₮Y" already told them, while the number that would change a decision is the same size as the chip captions. This is not a labelling failure — `archive-chief-architect-round16.md` WORK-07 already fixed that, and the "repaid" caption is present and correct. It is a size failure, and WORK-07's own condition (*"`.debt-pct` is a per-module rule — `.goal-pct` is not touched"*) leaves this element free to change.
- **Recommendation:** Reduce `.debt-pct` from 22px to `--t-h3` (18px). It remains the largest element in `.debt-head` and keeps its caption, its colour and its cleared-state variant; it stops out-ranking the rate sentence and the "still owed" figure. One declaration. Do **not** enlarge `.debt-rate` — new visual weight on ruled copy is the larger change and is not needed to fix the ordering.
- **Effort:** XS

---

### UI-04 — `.debt-meta` cannot pack at any supported width, so the chip row is a ragged one-per-row stack

- **Severity:** Medium
- **Location:** `.debt-meta` `:1809`, `.goal-meta-item` `:1667-1673`; chips emitted at `:10354-10359`, `dueChip` at `:10334`, `noteChip` at `:10228`.
- **Evidence:** At 390px the card interior is 358px. The first chip, "Borrowed ₮1,500,000 on 2026-06-15", measures ~210px in the render — the round-16 report measured the same string family at ~220px — and the due chip "📅 Due 2027-06-15 · 269d left" ~165px. 210 + 6 gap + 165 = **381 > 358**, so the first chip can never share its row. In the render this produces exactly the shape the owner described: card 1 row 1 is the Borrowed chip alone with ~148px of trailing white, row 2 is Due + Cost filling the width; card 2 adds a third row holding one short note chip with ~250px of trailing white; card 3 has a single row. At 320px the interior is 288px and **no pair fits at all** — Borrowed (210) + Cost (~120) = 330 — so every chip owns a row and a four-chip debt spends ~110px on the chip block alone.
- **Impact:** This is the owner's third complaint at source. The pill affordance — 999px radius, 1px border, `--surface-2` fill — exists to group short items on a shared line. Here each item owns a line, so the border and the radius buy nothing and the varying trailing white is read as sloppiness. It is also the main driver of the height variance the owner noticed: measured card heights in the render are **294, 299, 232, 300, 276px** — a 68px spread across five cards — produced by chip blocks of 1, 2 and 3 rows combined with a rate slot that is 0px, 18px or 36px depending on which sentence renders.
- **Recommendation:** Let the chips fill their row rather than trail off it: within `.debt-meta` only, allow the items to grow (`flex: 1 1 auto` on `.debt-meta > .goal-meta-item`, left-aligned text). Every chip row then reads flush left and flush right, the card gains a clean right edge at all three widths, and no copy, no pill, no class and no ruling is touched — this proposes nothing about a fifth pill and removes nothing. **Condition:** this changes how a lone short chip looks (a stretched note pill reads more like a bar than a tag), so it must be re-rendered and eyeballed at 320, 360 and 390 before it is accepted, on the existing debts harness. If the stretched form is judged worse, the honest disposition is to accept the raggedness and close this finding rather than spend copy on it.
- **Effort:** S

---

### UI-05 — The progress track renders in the two states where it carries no information

- **Severity:** Medium
- **Location:** `.goal-bar` `:1686-1694`; rendered unconditionally at `:10360`. Cards 3 and 5 in `shot-debts-390.png`.
- **Evidence:** Card 3 ("Ээж", no payments) states one fact five times: "**0%** repaid" at 22px, "₮0 paid of ₮300,000", a full-width empty grey track, "**₮300,000** still owed", and the gated line "No payments recorded yet." Card 5 ("Paid off already") states the mirror fact four times: "**100%** repaid", "₮520,000 paid of ₮520,000", a full-width solid green track, and "✓ Cleared" on a green-tinted card with a green border. In both states the 10px track plus its 12px margin costs 22px and adds nothing that is not already on the card in larger type.
- **Impact:** The owner named the empty grey track specifically. A progress bar that is entirely empty reads as an unfilled input or a rendering fault rather than as information, and it is the element on the card with the worst information-to-pixel ratio in the state where the card is already at its most repetitive. At 100% it is the fourth statement of "done" on a card that is already green.
- **Recommendation:** Suppress `.goal-bar` when `paid === 0` and when `paidInFull` is true. The remaining states — any partial repayment — are exactly the states where a length is worth drawing. Saves 22px on the cards most likely to be numerous in a mature list, and removes the empty slab. **Counter-argument recorded honestly:** an empty track is a comparison signal when scanning a list of bars. It is outranked here because the 22px "0%" badge is a stronger and earlier glance signal than a grey track, and after UI-03 reduces that badge to 18px it is still the first thing the eye lands on in the card's top-right. One template condition; no copy, no ruling, no derivation touched.
- **Effort:** XS

---

### UI-06 — The debt card's spacing uses literals, two of which are not on the project's scale

- **Severity:** Low
- **Location:** `.debt-card` padding `:1751`; `.debt-head` `:1773`; `.debt-rate` `:1804`; `.debt-meta` `:1809`; `.debt-foot` `:1810`; `.debt-actions` `:1840`; `.goal-meta-item` `:1670`; `.debt-pct-label` `:1798`; the three gated foot lines' inline `style="margin-top:6px"` at `:10371-10373`.
- **Evidence:** The scale is declared at `:128` — `--s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px`. The card writes `16px`, `12px` (x4), `8px`, `4px` as literals where tokens of the same value exist, and writes **`6px`** (chip gap, action gap, three inline foot margins) and **`3px`** (chip vertical padding, `.debt-pct-label` margin) which are on no step of the scale at all. The file already states this preference against itself at `:1752` — *"`--s3`, not 14px"* — and at `:1848-1852`, where a 20px literal was removed for exactly this reason.
- **Impact:** No user-visible failure today. It is a deviation from `knowledge/ui-guidelines.md` ("Use an 8px spacing system") and from the file's own stated rule, and it is why UI-02's rhythm problem was invisible: nothing in the CSS reads as a rhythm decision, it reads as six unrelated numbers.
- **Recommendation:** Fold into the UI-02 commit, since that commit is already rewriting these declarations. Token the values that have tokens; leave `6px` and `3px` alone unless the UI-02 rhythm makes them redundant, and do **not** open an app-wide spacing sweep — that shape is off limits and stays off limits.
- **Effort:** XS

---

## Review Areas

Clean areas reported in one line, per the honesty rules.

- **Layout and hierarchy** — UI-01, UI-02, UI-03.
- **Navigation** — Not re-assessed. Out of this round's scope and clean as filed in round 16; nothing in the list surface changes it. Back and cancel are unaffected — no finding.
- **Typography** — One hierarchy defect, UI-03. Sizes are otherwise consistent and drawn from the declared scale: 16 name, 13 numbers/rate, 11 chips and caption, 15 the "still owed" figure. The one off-scale headline size in this module was already removed (`:1848-1852`). No further finding.
- **Colour and theme** — Clean. Blue means progress/primary, red means cost, green means cleared, amber means a deadline approaching, and each is used that way on every card in the render. No meaning is carried by colour alone; every coloured element also states its meaning in words.
- **Spacing** — UI-02 (rhythm), UI-06 (tokens). No cramped area found; the problem is uniformity, not tightness.
- **Cards** — Clean. `.debt-card` (`:1749-1771`) and `.card` (`:902-909`) resolve to the same 16px padding and the same `--r-md` radius. The shadow divergence between the goal/debt card family and `--e1` was investigated at source, measured at 390px in the theme where it is largest, found imperceptible, and accepted in writing at `:1756-1769`. I re-read that reasoning and agree with it; it is not a finding.
- **Mobile** — UI-04 is the 320px case. Every interactive target on the card is a declared 44px (`:1720-1730`) and `.debt-actions` wraps rather than shrinking below it. No horizontal scrolling: the render reports `overflow` 0 at 390, and `.debt-meta`, `.debt-foot` and `.debt-actions` all wrap while `.debt-name`, `.debt-numbers` and `.goal-meta-item.note` carry `overflow-wrap: anywhere` for the free-text fields.
  **Carried, not re-filed:** at 320px the `.debt-totals` tiles resolve to ~132px each while "₮15,050,000" at 22px/700 needs ~143px, so an eight-figure total will break mid-number. That is **WORK-10**, deferred in round 16 as an evidence item with a named trigger and a pre-ruled fix. This arithmetic is derived, not observed — which is exactly what that deferral said was insufficient — so I am not re-filing it. I am noting that the 390px render shows the value already occupying most of its column, which makes the pre-ruled harness measurement at 320px cheap and worth doing.
- **Accessibility** — Clean within this surface, and better than clean on touch targets. All five controls labelled; `:focus-visible` reaches them via `:1212`; contrast pairs used on the card (`--text-2`/`--surface`, `--danger-text`/`--surface`, `--danger-text`/`--surface-2`) are all recorded as already present in `check-contrast.mjs`'s measured pair table by the comments that introduced them. No form inputs exist on this surface. No finding.
- **States** — Clean. Empty state present with an action-bearing sentence (`:9959-9963`); the summary card and the add-form disclosure are both gated on the same emptiness test so the empty state's "add it above" stays true. Delete is confirmed and the confirmation names the cascade and the payment count (`:10386-10393`). The three gated foot lines remain provably mutually exclusive. UI-05 is about a redundant state, not a missing one.
- **Numbers and formatting** — Clean. One `fmt` throughout, thousands separated, currency symbol leading, percentages whole. No sign is ambiguous: no value on this surface is rendered with a bare minus, and every figure is captioned by a word ("paid of", "still owed", "Cost so far", "repaid"). The one case where a figure could be misread — "Still owed ₮15,050,000" exceeding "Borrowed in total ₮14,700,000" — is precisely what the ungated sentence at `:10064` exists to explain, which is why UI-01 keeps that sentence open.

---

## Quick Wins

- **UI-05** — XS, one template condition, removes the exact artefact the owner pointed at, engages no ruling.
- **UI-03** — XS, one declaration, and it corrects the card's worst hierarchy inversion without touching a word of ruled copy.
- **UI-02** — XS, CSS only, and it is the difference between a dense card and a busy one.
- **UI-01** — S, and it is the High. It uses a primitive the screen already has and deletes no sentence, but it needs the architect's reading of C36 first.
- **UI-04** — S, one declaration plus a mandatory re-render at three widths; it has a named condition under which the correct answer is to close it unfixed.

---

## Estimated UX Impact

With UI-01 fixed, the first debt card is whole on first paint at 390px and roughly two cards are visible, which is what the screen is for. With UI-02, UI-03 and UI-05 fixed, the card drops from ~294px to roughly 258px and — more importantly — resolves into two readable groups instead of seven equal blocks, with the cost figure no longer out-ranked by a restatement of the line above it. Measured together across the render's five records that is approximately **265px less scrolling and one more whole card per screen**, with not one sentence, figure, chip, control or derivation removed. If UI-04's stretched-chip form survives its re-render, the list also gains a straight right edge at all three widths, which is the whole of the "untidy and ragged" complaint. The user who opens this screen to answer "what do I owe and what is it costing me" gets to a debt without scrolling, and reads the cost figure before the percentage that restates the line beneath it.

*(Round 17. UI-01…UI-06. Primary evidence: `D:\3_Claude\PowerApps\reports\shot-debts-390.png`. Source: `D:\3_Claude\PowerApps\expense-pwa\index.html`.)*
