# Design request — the Debts screen visual refresh

**For the Chief Architect.** The owner has supplied a written design specification for a visual refresh of the Debts screen, produced outside this repository. **It is the first request in this programme that arrives as a design rather than as a problem**, and it is the largest single proposal the module has had.

**I do not have the design files.** It cites `Debts — Mobile.dc.html` and `DebtsRefreshed.dc.html`; neither is in the repository and I have not seen a rendering. **Everything below is read off the specification's prose, and where I could not verify a claim I say so.**

**Two of its sections are already narrowed by the owner, before you read it.** See §1.

---

## 1. What the owner already decided, asked the moment the design arrived

The specification names its own open decision and carries an app-wide section. Both were put to the owner immediately.

**(a) Scope of the Android chrome.** The design proposes an M3 top app bar, an extended FAB replacing the add-form entry, and a pill indicator on the bottom nav. **Those are shared by every screen in the application.** Offered Debts-only, whole-app, or Debts-first-then-chrome, the owner chose: **Debts screen only.**

> **So the entire "Android chrome" section is out of scope by the owner's own answer, and the `platform: 'ios' | 'android'` axis the design's component carries is not proposed at all.** The header, the tab bar and the add-form disclosure stay exactly as they are. I am not asking you to rule on an app-wide sweep, because nobody is asking for one.

**(b) The overflow menu.** The design flags this as its open decision — four rare actions behind one `⋯`, buying back ~50px per card — and offers to put them back flat. Offered yes, no, or show-me-both, the owner chose: **no, keep them flat.**

> **So the action row is unchanged: `+ Payment` and four icon buttons, wrapping as it does today.** This also matches their Round 17 answer, where the button row was offered as a complaint and they did not choose it.

**Two consequences the design does not anticipate, and they are load-bearing.**

**The FAB is gone, so the add-form `<details>` stays** — which means the proposed *"What these figures include"* disclosure would be the **third** on this screen, not a replacement for anything. See §3(a).

**The overflow is gone, so the cleared-debt "receipt row" has nowhere to put five controls.** See §3(c).

---

## 2. What is admissible as far as I can tell, and cheap

Stated first so the refusals below are not read as a refusal of the design.

| # | Change | Why I think it survives |
|---|---|---|
| **A** | **`₮1,700,000` still owed becomes the card's dominant figure; the percentage drops to a 12px caption under the bar** | This is `UI-03` carried to its conclusion. That finding said the largest element restates the line beneath it while the figure the user opens the screen for is smaller; `WORK-05` took the percentage from 22px to 18px and the ruling left its size a per-module decision. **Nothing in the standing record protects the percentage's position.** |
| **B** | **The borrowed amount and date become a caption under the lender's name instead of the first chip** | `UI-04` and `CODE-05` both found that chip is ~210px against a 358px interior, **can never share a row at any supported width**, and is the main driver of the ragged rows and the height spread. Moving it out of the chip set is the one change that fixes that without stretching pills — the shape you refused at `WORK-07`. **It removes no fact and no figure.** |
| **C** | **The progress bar moves under the head, 10px → 6px** | `.goal-bar` is shared with Savings Goals, which has no probe anywhere in `tools\harness\`. **So this must be a `.debt-card`-scoped rule and never an edit to `.goal-bar`** — Round 17's invariant. Stated here because the design does not say it. |
| **D** | **`font-variant-numeric: tabular-nums` on money, and `letter-spacing: -0.02em` on the large figures** | The string `tabular-nums` does not occur anywhere in the file today. Money in a vertical list does not align, and this is the one-declaration fix. **Scope is the question** — see §4(b). |
| **E** | **Card radius `var(--radius)` → 16px** | `--radius` is `var(--r-md)`, 12px, and **exactly two rules use it: `.goal-card` and `.debt-card`.** So "the debt card's radius" cannot be changed through the token without changing the goal card too. A debt-only declaration is possible; whether a 4px radius difference between two adjacent card types is an improvement or a wobble is yours. **I hold this one weakly and would drop it without argument.** |

---

## 3. Three collisions, each named at source

### (a) The summary card's paragraphs behind a disclosure — refused hours ago, and this is the same shape

The design says: *"The two explanatory paragraphs move behind a 'What these figures include' disclosure, verbatim. Same `<details>` primitive the add form already uses."*

**That is `ABR1`, ruled today, and the ruling's reason applies to this proposal more strongly than to the one it refused.** `showCost` is the **aggregate**, so the sentence *"It is spread evenly across your repayments, so it may not match your lender's own statement"* is the one-site `C36` disclosure for the tile **and for every per-card "Cost so far" chip**. **This design keeps those chips** — they are one of the three it retains. So collapsing the paragraphs leaves a screen full of unqualified statements of the application's own even-allocation arithmetic with their qualification behind a tap. **`C36`'s travel test: a disclosure may travel behind a control only if every figure it qualifies travels with it.** These do not.

**And with the FAB out of scope it would also be a third disclosure on this screen**, where the off-limits entry has been reaffirmed at full width twice and narrowed by exactly one shape.

**I am not asking you to reverse either. I am asking you to rule the rest of the summary card on the assumption that both paragraphs stay open**, because the design's hero-figure layout may still be worth having with five lines of prose beneath it — and if it is not, that is the answer.

### (b) "Paid back so far" stops being a tile and becomes a progress track

The design moves it into a bar captioned `₮4,060,000 paid back` / `21% of what you agreed`, leaving **Borrowed in total** and **Cost so far** as a 2-up row.

**This is the tile half of the owner's "both, equally" complaint, and `ABD2` is exactly this deferral** — *"whether all four tiles earn their place above the list"*, with the trigger *"the owner, shown the render after these two commits, still names the block above the list."* **The owner has not been shown that render and has not named it again. They have sent a design that does.**

**Two things I cannot settle.** Whether a design specification counts as the observation `ABD2` waits for. And whether this is a removal at all: `ABD2`'s pre-ruling says **a figure removed from the tile grid must still be reachable on this screen**, and here the figure is not removed — it is re-presented with a percentage of the agreed total beside it. **That percentage is new**, and a percentage of what was agreed is a figure this module does not currently state anywhere on the summary card.

### (c) Cleared debts become a 3-line receipt row

*"Collapse to a single 3-line row: green check, name, `₮520,000 repaid · cost you ₮120,000`, overflow."*

**The overflow is gone by the owner's answer, so the five controls have nowhere to go.** A cleared card today carries `+ Payment` (demoted), history, ✓, ✎ and ✕ — and **`SET-03`'s reversal path runs through that ✓**, which `CLB-01` relied on this morning when it added `Mark settled` to the bell. A receipt row that drops them makes undoing a mistaken settlement unreachable from this screen.

**Three shapes I can see:** the receipt row keeps the five controls and is not three lines; it keeps ✓ and ✎ only, which is a new per-state control set; or cleared debts keep their full cards inside the group that already collapses them, which is what shipped this morning and costs nothing. **I lean to the third and I am not confident.**

---

## 4. Four things I cannot settle

**(a) Motion.** Bars animating `scaleX` over 0.8s and cards fading and lifting 10px on mount. **The `prefers-reduced-motion` block exists and would need extending to cover them, which the design assumes rather than states.** My own concern is different: this list re-renders in full on every payment, every settle, every edit and every delete, so **"on mount" is "on every write"** — a user recording a payment would watch every card in the list fade and lift again. I do not know whether the design intends a first-paint-only animation, and I cannot build one without knowing.

**(b) The scope of `tabular-nums`.** Money is rendered by one `fmt` through dozens of surfaces. **A rule scoped to the debt card and the summary aligns this screen and leaves every other screen's figures as they are** — which is either correct incrementalism or a visible inconsistency, and app-wide is a sweep. I propose debt-screen-only and want it ruled rather than assumed.

**(c) What the harness will say.** Several flows read the structures this moves: the chip row's text, `.debt-numbers .paid`, the card's control set, the `.debt-name` ordering, the 44px floor, and the geometry guard, which currently passes at 390 with **30px of slack**. **The card getting shorter should widen that**, but every assertion that reads a moved element has to be re-pointed **without weakening what it guarantees**, and that is the part of this work I would most like a condition on.

**(d) Whether this arrives as one commit or several.** It touches the summary card, the card head, the chip set, the bar, the type and the cleared group. **I would rather ship A, B and D first** — the three that answer findings already on the record — and put the summary card's re-layout second, so the geometry guard reads a known number between them.

---

## 5. What I am asking for

1. **Rule §2** — A, B, C, D, E, individually. E is the one I expect to lose.
2. **Rule §3(a)** — the summary card's layout **with both paragraphs staying open**, or not at all.
3. **Rule §3(b)** — whether a design specification fires `ABD2`, and whether the "% of what you agreed" figure is admissible at all.
4. **Rule §3(c)** — the cleared row, including "leave it as it shipped this morning".
5. **Rule §4(a)** — motion, and whether "on mount" can mean anything other than "on every write" in a list that re-renders whole.
6. **Rule §4(b)** — the scope of `tabular-nums`.
7. **Rule §4(c)** — the condition on re-pointing assertions.
8. **Rule §4(d)** — the commit split.

## 6. What I am not asking for

Not the Android chrome, the FAB, the top app bar, the nav indicator or the `platform` axis — **out of scope by the owner's answer**. Not the overflow menu — **refused by the owner's answer**. Not a copy change of any kind: every string stays the string the application already renders. Not a new module, a new screen, a new record or a new figure, **except** the "% of what you agreed" in §3(b), which is flagged rather than assumed. Not a new storage key, schema field, `SCHEMA_VERSION` bump or migration. Not a change to any derivation, gate, write path or ordering. Not an edit to `.goal-bar`, `.goal-card` or any `.goal-*` selector. Not a new harness runner, probe or predicate. Not an app-wide sweep of spacing, type, colour or motion. Not a Mongolian string.

---

## 7. One thing on the record

**This design is right about the problem.** Its five-point diagnosis matches, almost line for line, what two independent reviews found in Round 17 — the button row, the percentage outranking the figure the user came for, the always-expanded paragraphs, the three-row chips, and money that does not align. **Four of those five have been raised and three have been partly answered; the fifth, tabular figures, nobody noticed.**

**Where it goes wrong is the same place my own request went wrong this morning**: it reaches for a disclosure to reclaim the height, and the sentence it would collapse is the one that admits the application is guessing. **That refusal is hours old and I would rather cite it than re-argue it.**
