# Code Review — Round 17

*Scope: the visual density of the Debts list on `expense-pwa/index.html` at 320, 360 and 390px — `#debtTotalsCard`'s construction, `renderDebts`' card template and per-card work, the CSS for `.debt-card` and its children, the gated helper lines and their exclusivity, and the harness coverage in `tools/harness/debts.js` that a density change would put at risk. Render read: `reports/shot-debts-390.png` (five records, clientWidth 390, overflow 0).*

## Executive Summary

The Debts module is correct, well-guarded on behaviour, and almost entirely unguarded on geometry. Every figure on the card is derived defensively, the gated foot lines are provably exclusive, and the module's two hardest copy closures — one rate sentence per card, at most one gated helper line per card — are held by real assertions in `tools/harness/debts.js`. What is missing is any instrument that sees the card's *size*: `.goal-bar`, `.debt-pct-label` and the chip row appear nowhere in the harness, `npm run debts` lays out at 320 only, and the one measurement that is exactly this round's subject — the distance from the top of the screen to the first `+ Payment` — is recorded every run and asserted against nothing. The single biggest risk to the requested work is structural rather than missing tests: the debt card's layout rules are a line-for-line clone of the goal card's and its progress bar is literally the goal card's, so there is no lever for density that changes the Debts screen alone (CODE-01). About 110px of every card is spacing expressed as nine unnamed literals across two files (CODE-02, CODE-03), four of them off the project's own scale.

## Overall Score

**78 / 100.** One High and five Mediums, none of them defects in what the module computes — the band is "solid, contained High findings hold it below 90". Nothing here blocks release; all of it raises the cost and the risk of the change the owner asked for.

## Review Area Coverage

- **Correctness of Money** — Clean in scope. `pct` guards a zero total (`index.html:10146`), `pctLabel` floors rather than rounds (`:10208`), and no NaN can reach the template because `totalToRepay > 0` and `principal > 0` are enforced at all three doors: `debtProblem` (`:4605`, `:4608`), the add handler (`:11010`), the edit handler (`:11567`). No figure, derivation or wording was reopened.
- **Gated helper lines and their exclusivity** — Clean, and it holds by construction, not by luck. `overpaid > 0` requires `paid > total > 0`, which requires at least one payment, so it cannot coexist with `payments === 0`; `settledShort > 0` requires `payments > 0` and `outstanding > 0`, and `outstanding > 0` excludes `overpaid > 0` because `debtOutstanding` floors at zero (`:9640`). At most one of the three lines at `:10371-10373` can render. It is also asserted, in five states, at `tools/harness/debts.js:1919, 1942, 1949, 1956, 1963`. A density change that touches these gates must keep that flow green.
- **Data and Persistence** — Not exercised by this scope. `renderDebts` is a pure read plus a DOM write; it mutates nothing (the sort takes a copy at `:10138`, asserted at `debts.js:850`).
- **Architecture** — One real problem: the debt card duplicates the goal card instead of sharing it (CODE-01). Otherwise responsibilities are separated — derivation in the `debt*` helpers, presentation in `renderDebts`.
- **Maintainability** — CODE-01, CODE-02, CODE-03, CODE-07, CODE-08, CODE-11. No dead code found in the template.
- **Error Handling** — Clean in scope. `renderDebts` returns early on missing containers (`:9949`) and the empty list has a state (`:9961`).
- **Security** — Clean. Every user-supplied value on the card is escaped: name `:10341`, note `:10228`, borrow date `:10355`, due date and label `:10334`, ids on all five controls `:10364-10368`. Amounts go through `fmt`.
- **Performance** — In scope only as context. `renderDebts` makes roughly six full passes over `db.debtPayments` per debt; this is the recorded WORK-202 risk with a 100ms trigger, measured at 41ms for 200 debts and 5,000 payments (`reports/HANDOFF.md:716`). Not re-raised. See Technical Debt.
- **Reliability and Scalability** — See Future Risks. The card's height, not its arithmetic, is what scales badly here.
- **Technical Debt** — See below.

---

## Findings

### High

**CODE-01 — The debt card's layout is a clone of the goal card's, and its progress bar is the goal card's, so density has no single lever**

- **Severity:** High
- **Location:** `expense-pwa/index.html:1633-1699` (`.goal-*`) against `:1749-1840` (`.debt-*`); the shared `.goal-bar` at `:1686-1694`, used by the debt template at `:10360`
- **Evidence:** Seven rule pairs are identical or near-identical, declaration for declaration:
  - `.goal-head:1646` / `.debt-head:1773` — identical
  - `.goal-meta:1656` / `.debt-meta:1809` — identical
  - `.goal-foot:1695` / `.debt-foot:1810` — identical
  - `.goal-pct:1654` / `.debt-pct:1782` — identical
  - `.goal-numbers:1650-1653` / `.debt-numbers:1778-1781` — identical plus `overflow-wrap`
  - `.goal-remaining:1696-1698` / `.debt-remaining:1811-1813` — identical modulo the state modifier
  - `.goal-actions:1699` / `.debt-actions:1840` — identical plus `flex-wrap`
  - `.goal-card:1633-1644` / `.debt-card:1749-1771` — same resolved values, and the comment at `:1636` records that a round was spent making them so.
  Meanwhile `.goal-bar` — 10px of height plus a 12px margin, one of the largest single density items on the card — is genuinely one rule used by both modules, by design (`:1733-1748`). There is no probe for the Savings Goals screen at all: `tools/harness/` contains no goals file, and the only place a goal card is ever measured is the button-equality flow inside `debts.js:176-221`, which measures two buttons.
- **Impact:** Every candidate density lever is either duplicated or shared. Change `.debt-head`'s 12px alone and the twin silently drifts, against two in-file comments that assert the two are kept identical (`:1636-1642`, `:1733-1748`) — and a comment claiming reuse is exactly what stops the next reader checking. Change `.goal-bar` and the Savings Goals screen changes too, with nothing watching it.
- **Recommendation:** Before any value moves, merge the seven duplicated rules into one definition each with a shared selector list (`.goal-head, .debt-head { ... }`), which is the idiom this file already chose twice for the same reason — `.goal-meta-item` (`:1657-1673`) and `button.goal-add` (`:1700-1731`) were merged rather than aligned. Then the density change has one site per property and the divergences that are deliberate (`overflow-wrap`, `flex-wrap`, the state modifiers) are the only things left in `.debt-*`. For the bar specifically, gate the **element in the template** (CODE-04), never the shared rule.
- **Effort:** S

### Medium

**CODE-02 — The card's vertical rhythm is nine unnamed literals, four of them off the project scale**

- **Severity:** Medium
- **Location:** `:1751` (padding 16), `:1773` (margin-bottom 12), `:1804` (12), `:1809` (gap 6, margin-bottom 12), `:1686-1688` (bar height 10, margin-bottom 12), `:1810` (gap 8), `:1840` (gap 6), `:1770` (margin-bottom `var(--s3)`), plus the inline `margin-top` values in the template at `:10063` and `:10371-10373`
- **Evidence:** The spacing scale is `--s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px` at `:128`, and the comment above it at `:124-127` states the standing convention: off-scale values "are replaced as their blocks are next opened". 12 and 16 have exact tokens and are written here as literals; 6 and 10 are on no scale at all. The same rule block is already half-converted — `:1770` and `:1845` use `var(--s3)` while the rules beside them use bare numbers. Added up, the fixed spend per card at these widths is 32 (padding) + 12 + 12 + 12 (three margins) + 10 + 12 (bar) + 8 (the foot's wrap gap, which applies at every width below ~500px because `.debt-foot` always wraps there) + 12 (inter-card margin) = **about 110px of spacing and rule before a glyph of content**. In the committed 390 render the cards measure roughly 230-320px total.
- **Impact:** A density pass has to locate nine numbers in two files and cannot express "one step tighter" in the system's own words; the next reader cannot tell which numbers were chosen and which were copied.
- **Recommendation:** While the block is open, convert per the standing convention (12 → `--s3`, 16 → `--s4`, 8 → `--s2`) and make 6 and 10 deliberate choices with a stated reason. This is preparation for the density change, not the change itself.
- **Effort:** S

**CODE-03 — Four inline `margin-top` overrides of `.helper`, at two values, for one role**

- **Severity:** Medium
- **Location:** `:10063` (`margin-top:8px`), `:10371`, `:10372`, `:10373` (`margin-top:6px` each); `.helper` declares `margin-top: 4px` at `:2303`
- **Evidence:** One class, three different values, three of them written inside a template literal where no selector can reach them.
- **Impact:** The summary prose and the gated foot lines — the two pieces of copy this round is asked to look at — cannot be re-spaced from the stylesheet at all. Deviation from coding-standards CSS: "Use reusable classes. Avoid duplicated styles."
- **Recommendation:** One modifier (e.g. `.debt-card .helper { margin-top: var(--s1); }` and the summary's own rule), and delete the four inline styles.
- **Effort:** XS

**CODE-04 — The progress track renders on a debt with no payments, restating "nothing paid" a fourth time**

- **Severity:** Medium
- **Location:** `:10360`, with `pct` computed at `:10146`
- **Evidence:** The bar is unconditional. In `reports/shot-debts-390.png` the third card ("Ээж") renders an empty grey track directly beneath "₮0 paid of ₮300,000" and "0% repaid", and directly above "No payments recorded yet." — four statements of the same fact, one of which is a 10px grey rectangle plus a 12px margin. The card already has the idiom for this: the cost chip one line above is gated on `costHere` (`:10357`), and the bell, the totals tile and the rate line are all gated on having something to say.
- **Impact:** 22px of decoration on the card with the least to report, and a visible contributor to the height variance the owner called ragged.
- **Recommendation:** Gate the bar element on `pct > 0` in the template, exactly as `costHere` gates the cost chip. Do not touch `.goal-bar` — Savings Goals shares it (CODE-01). Nothing asserts the bar today, so add the assertion in the same change (CODE-06).
- **Effort:** XS

**CODE-05 — Nothing bounds or orders the chip row, and the widest chip is built first**

- **Severity:** Medium
- **Location:** `:10354-10359`; `.debt-meta` at `:1809`
- **Evidence:** The chip count varies from 1 to 4 by record state — "Borrowed…" always, the due chip if `dueDate`, the cost chip if `costHere`, the note chip if `notes` — and the first chip is composed as `Borrowed <amount> on <ISO date>`, which is the longest chip on the card by construction (label plus a 7-9 glyph amount plus a 10-character date). In the 390 render that chip takes a whole row to itself on cards 1, 2 and 4, and the five cards carry 2, 3, 1, 2 and 2 chip rows respectively.
- **Impact:** Card height varies with data in a way nothing controls, which is the untidiness the owner named. The rows are an emergent property of four inline ternaries rather than a decision anyone made.
- **Recommendation:** The chip *count* is closed by ruling, so the fix is shape, not deletion, and the shape is the architect's. The code-side change that gives them a lever is to build the row from one ordered array of chip descriptors (the pattern `renderGoals` already uses at `:9521` and `:9531` with `metaItems.push`) instead of four inline ternaries, so order and any wrapping rule live in one place.
- **Effort:** S

**CODE-06 — No assertion observes the card's height, its bar, its caption or its chip rows, and the suite runs at 320 only**

- **Severity:** Medium
- **Location:** `tools/harness/debts.js` (whole file); `package.json:23`
- **Evidence:** The only geometry assertions in the module's probe are the 44px button floor and goal/debt button equality (`debts.js:159-221`), the totals card's overflow at 320 (`:936-949`), page overflow with a long lender name (`:643-646`), and the form-collapse delta (`:2641-2664`). `.goal-bar` and `.debt-pct-label` do not appear anywhere in `tools/harness/`. Most pointedly, `t.F_pay_top_closed` at `debts.js:2653` measures the exact quantity this round is about — the distance from the top of the screen to the first `+ Payment` — and is asserted against nothing; only the *difference* `F_saved_px > 300` is checked. `npm run debts` passes `--width 320`; no command lays this screen out at 360 or 390, and the runner's frame is a fixed 820px tall (`run.mjs:111`), which makes a "how much fits on one screen" assertion cheap and deterministic.
- **Impact:** The density change cannot be demonstrated red-then-green, and nothing stops the card growing back. The card reached its current height across ten rulings with no instrument watching; in the committed render the first debt card's top edge sits roughly 470px down an 844px viewport and about two cards fit on screen, which is precisely the owner's complaint and precisely what no flow can see.
- **Recommendation:** One flow on a fixed five-record fixture that records each `.debt-card`'s height and the first card's top offset, and asserts a *relationship* — e.g. that two live cards fit inside the 820px frame — rather than a literal, on the precedent `debts.js:193-204` sets for comparing site-to-site instead of to magic numbers. Add a second npm width for 390 so the owner's device is in the suite.
- **Effort:** S

### Low

**CODE-07 — The card head has an anonymous inline-styled wrapper where the twin has a class**

- **Severity:** Low
- **Location:** `:10340` (`<div style="min-width:0;flex:1">`) against `.goal-title` at `:1647`
- **Evidence:** The goal card names this element and styles it in CSS; the debt card leaves it unnamed with two inline declarations.
- **Impact:** The element a density change is most likely to target — to bring the percentage onto the name's line, say — has no selector, and its layout is invisible to the stylesheet and to any assertion.
- **Recommendation:** Give it the existing class or a named one, in the same edit as CODE-01.
- **Effort:** XS

**CODE-08 — Six literal font sizes on the card, two of them off the declared type scale**

- **Severity:** Low
- **Location:** `.debt-name` 16px (`:1777`), `.debt-numbers` 13px (`:1778`), `.debt-pct` 22px (`:1782`), `.debt-pct-label` 11px (`:1798`), `.debt-rate` 13px (`:1804`), `.debt-remaining` 14px and its `b` 15px (`:1811-1812`)
- **Evidence:** The scale is `--t-micro: 11px; --t-sm: 13px; --t-body: 15px; --t-h3: 18px; --t-h2: 22px` at `:141`. 16 and 14 are on no step. Four of the six have exact tokens and are written as literals anyway — including `.debt-pct-label`'s 11px, two rules away from the comment at `:1665` that converted `.goal-meta-item`'s identical literal to `--t-micro` for this exact reason, and one rule above `:1848-1852`, where the file rejects an off-scale 20px headline in these same words.
- **Impact:** Line height follows font size, so the card's height budget is spread across six unnamed numbers, two of which the design system does not contain.
- **Recommendation:** Convert the four with exact tokens; decide 16 and 14 deliberately while the block is open.
- **Effort:** XS

**CODE-09 — The summary card's three-sentence closure is a count with nothing enforcing it**

- **Severity:** Low
- **Location:** `:10059-10061` ("THIS BLOCK IS CLOSED AT THREE SENTENCES. One ungated, two gated."), over `helperHTML` at `:10062-10067`
- **Evidence:** coding-standards.md, Comments: "Never write 'the only', 'all', or a count, unless something enforces it." The card's rate closure *is* enforced — `debts.js:2460-2463` asserts exactly one `.debt-rate` on six differently-shaped records — and the per-card helper closure *is* enforced at `debts.js:1919-1963`. Nothing counts `.helper` inside `#debtTotals`. The only assertion on that block is `B_totals_html` (`debts.js:128-139`), which checks for the absence of "cost so far" and the presence of one figure.
- **Impact:** The one block this round may be asked to shorten is the one whose closure is comment-only, so a change there is unguarded in both directions — growth and deletion alike.
- **Recommendation:** Assert the `.helper` count in `#debtTotals` in both states (one with no cost, two with) alongside whatever this round changes.
- **Effort:** XS

**CODE-10 — The two gated summary sentences share one element, so neither has an independent handle**

- **Severity:** Low
- **Location:** `:10066` — one `.helper` div carrying both "The figure above is the part of that extra you have paid so far, and it is not counted in your Net Balance." and "It is spread evenly across your repayments, so it may not match your lender's own statement."
- **Evidence:** One gate (`showCost`), one element, no id, no modifier.
- **Impact:** Any ruling that keeps one sentence and defers or relocates the other has no seam to act on; it would be a copy edit inside a template literal with no assertion on either side. Three of the five lines of prose the owner met are in this one element.
- **Recommendation:** No change unless the architect rules on the copy. If they do, split into two separately gated elements in that change, and pair with CODE-09.
- **Effort:** XS

**CODE-11 — Five near-identical listener-attachment blocks, re-run per render**

- **Severity:** Low
- **Location:** `:10378-10385` (plus the delete block at `:10386-10399`)
- **Evidence:** Five `el.querySelectorAll('[data-debt-…]').forEach(b => b.addEventListener('click', …))` statements differing only in attribute and callback, executed after every full `innerHTML` rebuild — five listeners per card, re-created on every render.
- **Impact:** Duplication that will drift the next time a control is renamed, and per-render work that scales with card count. Adjacent to the action row rather than in it: the control *count* is not in question here.
- **Recommendation:** One table of `[attribute, handler]` pairs iterated once. Not event delegation — that is a larger change than the risk justifies.
- **Effort:** XS

---

## What a density change breaks today

Named so the work can be planned rather than discovered. These flows in `tools/harness/debts.js` go red on the changes most likely to be proposed:

| Change | Goes red at |
|---|---|
| Remove the rate sentence, or fold it into a chip | `:2460-2463` (exactly one `.debt-rate` on six records), `:2736`, `:2760`, `:2783-2786` (the `.ask` variant), `:2828` (the display cap) |
| Move a gated foot line out of `.debt-card` (into the summary, a chip, or a disclosure) | `:1919`, `:1942`, `:1949`, `:1956`, `:1963` — the flow counts `.helper` **inside the card** and requires exactly 0 or 1 per state |
| Rename or remove `.debt-name` | `:835` (order), `:912` (card lookup by lender), `:547-647` (the `overflow-wrap` guard, documented red at 91px of overflow) |
| Cap or restructure the card's paid figure | `:917-921` (`.debt-numbers .paid` must report the uncapped ledger) |
| Move the due chip or cost chip out of `.debt-meta` | `:1145-1146`, `:1719` (both read `.debt-meta` textContent) |
| Rename `.debt-remaining` or `.debt-pct` | `:1715`, `:1726` |
| Restructure the summary tiles | `:872-892` (tiles mapped by label), `:1733`, plus the 320px overflow guard at `:936-949` |
| Touch any control, or the cleared-card demotion | `:159-221`, `:958-987`, and every flow that clicks `[data-debt-pay]` |
| Anything that makes `renderDebts` write outside `#debts` | `:680-804` |

**And what has nothing standing behind it today** — a change here is invisible in both directions: `.debt-card` height at any width; `.goal-bar`'s presence, width and empty-track case (the string does not occur in `tools/harness/`); the chip row count and wrapping; `.debt-pct-label` and the word "repaid"; the number and text of the sentences in `#debtTotals`; card-to-card height variance; and the whole screen at 360 and 390.

## Technical Debt

- **The goal/debt twin (CODE-01)** is the expensive one. Two components kept identical by comment are one component with extra steps, and this file has already said so twice while creating a third instance. Every future change to either card pays the tax, and the Savings Goals half has no probe.
- **Spacing and type as literals (CODE-02, CODE-08)** make the card's size unnamed. The standing convention at `:124-127` says these get converted when the block is next opened; this round opens the block, so deferring again means the convention stops describing what happens.
- **`renderDebts`' six passes over `db.debtPayments` per debt** is the recorded WORK-202 risk, with a pre-ruled `Map` fix and a 100ms trigger that the 41ms measurement (`HANDOFF.md:716`) does not fire. **Not re-raised as a finding.** Noted only because a density change that adds per-card derivation lands on top of it, and because the pre-ruled fix is already agreed if it ever does fire.
- **Inline styles inside template literals (CODE-03, CODE-07)** are a small, spreading pattern: they are unreachable from CSS, invisible to the contrast and geometry tooling, and they accumulate at exactly the points where copy is added.

## Future Risks

- **The card grows back.** Ten rulings have each added one true, well-argued element. Every one of them was checked for correctness and none for height, because no instrument measures height. Without CODE-06 the eleventh will be assessed the same way, and this review round will recur.
- **A density fix drifts the twin.** If this round edits `.debt-*` only, the goal card and the debt card stop being identical while the comments asserting they are identical remain — the precise failure mode `:1737-1742` was written to record.
- **360 and 390 stay untested.** The owner's complaint arrived from a device the suite never lays out. Any fix will be validated by screenshot; the next regression will arrive the same way.
- **At scale the height is what hurts first, not the arithmetic.** 20 debts at ~280px each is a 5,600px scroll with no grouping and no collapse; the sort only sinks cleared debts. The data layer is fine at 200 debts (measured); the screen is not.

## Recommended Refactoring

The smallest set of structural changes that removes the most risk, in order — none of them touches a figure, a derivation, a rate sentence, the storage shape or the write path:

1. **Merge the seven duplicated card rules into single definitions** (CODE-01), using the shared-selector idiom this file already applied to `.goal-meta-item` and `button.goal-add`. This is a no-op render that gives the density work one site per property and is verifiable by the existing button-equality flow plus the 320px overflow flow.
2. **Add the geometry flow and the 390 width** (CODE-06) *before* changing any value, so the density change can be demonstrated red-then-green, which C37 requires of the author of a condition anyway.
3. **Convert the spacing and type literals in the opened block to tokens** (CODE-02, CODE-08), per the standing convention at `:124-127`, and replace the four inline `margin-top` overrides with one class (CODE-03). After this, "one step tighter" is a single expressible change.
4. **Gate the progress track on `pct > 0`** (CODE-04) and give the head wrapper a name (CODE-07). Two XS edits that remove real height from the least informative card and give the head a selector.
5. **Build the chip row from one ordered array** (CODE-05), so whatever the architect rules about the row's shape has a single place to land.
6. **Assert the summary block's sentence count** (CODE-09) so its closure is enforced the way the card's two closures already are — whether or not the copy is shortened.
