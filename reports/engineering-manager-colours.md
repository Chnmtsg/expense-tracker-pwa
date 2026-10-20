# Engineering Manager: Colour System (Home charts, Analytics, theme tokens), live v38

Sources:
- UI Review: D:/3_Claude/PowerApps-live/reports/ui-review-colours.md. Score 66, 2 High, 5 Medium, 4 Low (UI-01 to UI-11).
- Code Review: D:/3_Claude/PowerApps-live/reports/code-review-colours.md. Score 78, 0 High, 7 Medium, 3 Low (CODE-01 to CODE-10).

I read both in full and handled them under knowledge/review-conventions.md. All 21 findings are traced below. None was dropped and no severity was changed. Both reviewers say the line numbers in index.html moved during review because the quick add work was editing the file in parallel. Use function names as anchors.

## Project Health

No figure is wrong anywhere in this scope, and text contrast passes in all 16 themes. The colour layer that carries meaning is not production quality, though. Category colours sit outside the token system and change when the list is reordered. In 7 of 16 themes the brand colour, which draws the Planned bars, the heatmap and the hero card, is itself a state hue. The group tokens are copies of the state tokens. Nothing in `tools/` measures any chart colour. The UI reviewer scores this 66 and the Code reviewer 78. Read together: usable but fragile. The colour system cannot yet promise "one colour, one meaning" in every theme, and nothing stops it regressing.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Move the category palette into per-theme `--cat-N` tokens: theme-aware, at least 3:1 on `--surface`/`--surface-2`, clear of the state hues, slots distinct from each other, deleted-category fallback becomes a token | UI-01 (items 1, 3, 4, 5, 6 and rec. b), CODE-01, CODE-02, CODE-09 | High (UI-01); Medium (CODE-01, CODE-02); Low (CODE-09) | P1 | M | Slot count ruling (Conflict C5) |
| WORK-02 | Store a stable `colorSlot` on each category, filled from current position on migration (`toV4`) and repaired by a load normaliser. Reorder and delete no longer recolour. Store the slot, never a colour string | UI-01 (item 2, rec. a), CODE-03 | High (UI-01); Medium (CODE-03) | P1 | M | WORK-01 |
| WORK-03 | Planned vs Actual: Planned bar in a neutral `--chart-planned` token that is never a state hue. Actual bars use the fill tokens `--danger`/`--success`, not the `-text` tokens. Move inline styles to `.pva-plan` / `.pva-actual.is-over/.is-under/.is-unplanned`. One function decides the state | UI-02 (rec. a), CODE-04, UI-08 | High (UI-02); Medium (CODE-04); Low (UI-08) | P1 | S | Choice of neutral token (Recommendations) |
| WORK-04 | Calendar heat: a per-theme `--heat` token, defaulting to `--primary`, overridden in mint, forest, peacock, oled, flamingo, rose and sepia to a hue clear of success/danger. Ramp reaches 3:1 from empty to max, especially kingfisher and nord | UI-02 (rec. b), UI-05 (rec. b), CODE-10 | High (UI-02); Medium (UI-05); Low (CODE-10) | P1 | M | WORK-10; remedy ruling (Conflict C9) |
| WORK-05 | Build the heatmap legend swatches from the cells' own ramp (`heatMin` up to `heatMax`), painted on `--surface-2` with an unfaded border | UI-05 (rec. a) | Medium | P2 | S | None (lands before WORK-04) |
| WORK-06 | Hero card: when Left over is negative, swap the brand gradient for a `--danger`-based ground. Measured with the `--on-hero` / scrim pair | UI-02 (rec. c) | High | P1 | S | None (lands before WORK-12) |
| WORK-07 | Flamingo: move `--primary-text` (`#CB1508`) off the danger hue | UI-02 (rec. d) | High | P1 | XS | None |
| WORK-08 | Separate Needs/Wants/Savings tokens from the state and brand tokens in every theme. Flamingo `--needs` comes off red. Dark theme declares its own group tokens | UI-03, CODE-06 | Medium (both) | P2 | S | WORK-01; design ruling (Conflict C7); WORK-10 |
| WORK-09 | Planned vs Actual: Savings rows over plan are not shown in danger red as "over". The totals line follows the same rule | UI-04, CODE-05 | Medium (both) | P2 | S | WORK-03 (state function); product ruling (Conflict C6) |
| WORK-10 | Measure what charts paint. Add 3.0 `PAIRS` rows to `check-contrast.mjs` for series vs `--surface` and Planned/Actual vs `--surface-2`. Add one harness probe `chart-colours.js` (per theme: slot-vs-state distance, slot-vs-slot distance, Planned not equal to Actual, chip colour stable across reorder and delete) to `npm test` | UI-06, CODE-07 | Medium (both) | P1 (enabler: guards WORK-01, -03, -04, -08) | S | Ships with WORK-01; the reorder/delete assertion lands with WORK-02 |
| WORK-11 | KPI strip: "Income minus plan" renders in `--text`, and in `--danger-text` only when negative | UI-07 | Medium | P2 | XS | None |
| WORK-12 | Hero muddy in pastel-brand themes (flamingo, and per UI also nord and owl) | UI-09, CODE-08 | Low (both) | P3 | S | WORK-06; remedy ruling (Conflict C8) |
| WORK-13 | Daily totals under the stacked chart render in `--text-2`, not always `--danger-text` | UI-10 | Low | P3 | XS | None |
| WORK-14 | Donut legend: percentage stays on the label line at 360 px ("Needs · 84 %") | UI-11 | Low | P3 | XS | None |

Traceability check: UI-01 to UI-11 and CODE-01 to CODE-10 each appear at least once. UI-01 is split across WORK-01 and WORK-02. UI-02 is split across WORK-03, -04, -06 and -07. UI-05 is split across WORK-04 and -05. There is no P0 because neither report raised a Critical finding.

UI-01 item 6 (colour is the only key in the stacked daily chart) has no separate item. The UI reviewer's recommendation is to leave the chart structure alone and keep the day detail as the labelled view. WORK-01 (distinct, measured slots) and WORK-02 (stable slots) are what fix it.

## Quick Wins

Items at XS or S effort that remove Medium or higher severity, in order within their band:

- **WORK-07** (XS, High, P1): one token in flamingo stops the active tab and mode labels reading as warning red.
- **WORK-11** (XS, Medium, P2): one line stops the app colouring green the derived figure it warns users not to read as spendable.
- **WORK-03** (S, High/Medium, P1): Planned and Actual stop sharing a hue in seven themes. Nord and owl over/under stop differing by hue alone. Absorbs UI-08.
- **WORK-06** (S, High, P1): a negative balance no longer sits on a green card in mint, forest, peacock and oled.
- **WORK-10** (S, Medium, P1): makes every other colour fix verifiable and stops it regressing.
- **WORK-05** (S, Medium, P2): the legend stops showing a density the grid never uses.
- **WORK-09** (S, Medium, P2): blocked until the product ruling.
- **WORK-08** (S, Medium, P2): blocked on WORK-01 and the design ruling.

## Sprint Plan

**Sprint 1: WORK-01, WORK-10, WORK-03, WORK-06, WORK-07, WORK-11**

Total effort: M + S + S + S + XS + XS, about 3.5 days.

What it delivers:
- Category colours become theme tokens, measured against both grounds and against the state colours, with a probe in `npm test` that fails if a token is a copy of a state colour or too close to another.
- Planned vs Actual bars carry the comparison in every theme.
- A negative balance is no longer drawn on a brand-green card.
- Flamingo's brand text stops reading as danger.
- The KPI strip stops endorsing the derived figure.

Preconditions, all rulings rather than engineering work:
- The slot count, 10 or 12 (C5).
- The neutral `--chart-planned` value. The UI reviewer proposes `--text-3` or a grey-blue at 3:1 on `--surface-2`. The Code reviewer defers the choice to UI and the Chief Architect.

WORK-02 is deliberately left out. It is the only change that touches stored data (a migration). Both reports point that way: the Code reviewer says it "should be its own change". All Sprint 1 items edit `index.html`, which the parallel quick add work is also editing, so expect merge friction.

## Roadmap

- **Sprint 1:** WORK-01, WORK-10, WORK-03, WORK-06, WORK-07, WORK-11
- **Sprint 2:** WORK-02, WORK-05, WORK-04, WORK-09, WORK-08
- **Sprint 3:** WORK-12, WORK-13, WORK-14
- **Later:** none. Every item fits in three sprints. If Sprint 2 slips, WORK-08 and WORK-09 move here before anything P1 does.

## Dependencies

- **WORK-01 before WORK-02:** the slot integer indexes `--cat-N`, so the number of slots must be fixed (C5) and the tokens must exist before a migration stamps slots into user data.
- **WORK-01 together with WORK-10:** the Code reviewer recommends landing them together so the new tokens arrive already measured. The `PAIRS` rows for categories only work once the colours are tokens; the JS array is invisible to `readThemes()`.
- **WORK-02 completes WORK-10:** the probe's "colour stable across reorder and delete" assertion can only pass once slots are stored.
- **WORK-01 before WORK-08:** the UI reviewer's fix draws the group colours from the new palette (reserved slots or `--group-*`), at S effort only once the WORK-01 tokens exist (M alone).
- **WORK-03 before WORK-09:** WORK-03 introduces the single function that decides state from (group, planned, actual). WORK-09 is a rule inside that function. WORK-09 also needs the product ruling (C6).
- **WORK-05 before WORK-04:** the legend should be built from the cell ramp first, so that the `--heat` change in WORK-04 shows up correctly in both.
- **WORK-10 before WORK-04 and WORK-08:** both fixes need the new 3.0 rows and distance checks to show they work.
- **WORK-06 before WORK-12:** both change `.hero-kpi` and the hero scrim rows in `check-contrast.mjs`. Settle the negative-state ground first, then tune the pastel themes against it.
- **WORK-02 and the escaping check:** store an integer, never a colour string. Otherwise `categoryColor` would stop being a safe constant wrapper in `check-escaping.mjs`, and theme-awareness would be lost (Code review, Future Risks).

## Conflicts

For the Chief Architect. Recorded, not resolved.

- **C1: Severity of the category palette.**
  - UI-01 rates it **High**: Analytics is a core module, its stacked chart "cannot be read by colour for anyone with red-green colour blindness, or on muted themes", and colours change without warning on reorder.
  - CODE-01, CODE-02 and CODE-03 rate the same defects **Medium**: no figure is wrong and every chart has a label or legend.
  - WORK-01 and WORK-02 carry both severities. I set them to P1 on the High.
- **C2: Severity of the Planned vs Actual colour collision.**
  - UI-02 rates it **High**: in nearly half the themes the at-a-glance reading contradicts the words.
  - CODE-04 rates it **Medium**: the labels and over/under words keep the card readable.
  - WORK-03 carries both.
- **C3: Severity of the weak heatmap range.**
  - UI-05 rates it **Medium**: the heatmap's purpose fails in roughly a third of themes, and the legend misdescribes the scale.
  - CODE-10 rates the kingfisher/nord range **Low**: the values stay printed.
  - WORK-04 carries both.
- **C4: Overall score.** UI 66 ("usable but fragile") against Code 78 ("solid"). The gap follows directly from C1 and C2.
- **C5: Number of category slots and how tokens are tuned.**
  - UI-01 proposes `--cat-1 … --cat-10`, in two tuned sets (light grounds, dark grounds) plus overrides for nord, sepia, owl and gold.
  - CODE-01/R1 proposes `--cat-1 … --cat-12` in `:root`, overridden only in themes where measurement fails.
  - The Code reviewer notes the defaults already use 10 of 12 slots, so 10 slots would mean duplicates from the 11th category.
- **C6: Savings over plan (WORK-09).**
  - UI-04 prescribes a fix: neutral colour (`--text-2` word, neutral bar) and the words "ahead by" / "short by" for Savings rows, keeping danger for Needs and Wants.
  - CODE-05 says it is "a product ruling, not an engineering one", and lists the options as neutral or positive, or no over/under colour at all.
- **C7: May group colours equal state colours (WORK-08)?**
  - UI-03 prescribes no aliasing: take the group colours from the category palette or dedicated `--group-*` tokens.
  - CODE-06 asks for a design ruling on whether `--savings`/`--wants` may equal `--success`/`--warning`. Its minimum is moving flamingo `--needs` off red.
- **C8: How to fix the muddy hero (WORK-12).**
  - UI-09: add a `--hero-from` / `--hero-to` pair that starts from a deeper brand step in flamingo, nord and owl, so the scrim can drop to about 0.22.
  - CODE-08: add a `--hero-scrim-colour` token (default black) with an on-hue override for flamingo only, for example `#7A2E32`.
  - The two reviewers also disagree on which themes are affected.
- **C9: How to fix the heatmap range (WORK-04).**
  - UI-05(b): a per-theme `--heat` hue reaching 3:1 from empty to max with `--text` still at 4.5:1, or else a small solid ground behind the text.
  - CODE-10: a design call between a non-fill marker for the top band and a different ramp ground. If the ramp stays, add a minimum-separation probe.

## Estimated Effort

Nominal sizes: XS 0.25 d, S 0.5 d, M 1.5 d.

| Band | Items | Effort |
|---|---|---|
| P0 | none | 0 |
| P1 | WORK-01 (M), WORK-02 (M), WORK-03 (S), WORK-04 (M), WORK-06 (S), WORK-07 (XS), WORK-10 (S) | about 6.25 d |
| P2 | WORK-05 (S), WORK-08 (S), WORK-09 (S), WORK-11 (XS) | about 1.75 d |
| P3 | WORK-12 (S), WORK-13 (XS), WORK-14 (XS) | about 1.0 d |
| **Total** | 14 items | **about 9 d** |

Rulings are not included: C5 to C9 and the neutral token for WORK-03.

## Recommendations

- **Rule on the open decisions before Sprint 1 starts:**
  - C5, the slot count;
  - the neutral `--chart-planned` value;
  - C6, how Savings over plan should look;
  - C7, whether group colours may equal state colours.
  Everything in Sprints 1 and 2 waits on one of these.
- **Rule on the C1 and C2 severities.** I have scheduled on the higher one. If you rule Medium, WORK-01, -02 and -03 drop to P2, but the order does not change because they are the root cause and the dependency for everything else.
- **Treat WORK-10 as part of the fix, not a follow-up.** The current "16 themes × 38 pairs, 0 below" reads as a clean bill of health for colours it never measures, which is how these defects shipped.
- **Keep WORK-02 as its own change.** It is the only change to stored data. Store an integer slot, never a colour, to keep theme-awareness and the `check-escaping` exemption intact.
- **Coordinate with the quick add work on `index.html`.** Both reviewers saw lines move by 6 to 22 during review.

Files:
- D:/3_Claude/PowerApps-live/reports/ui-review-colours.md
- D:/3_Claude/PowerApps-live/reports/code-review-colours.md
- D:/3_Claude/PowerApps-live/expense-pwa/index.html
- D:/3_Claude/PowerApps-live/tools/check-contrast.mjs
- D:/3_Claude/PowerApps-live/tools/harness/

Intended save path: D:/3_Claude/PowerApps-live/reports/engineering-manager-colours.md (not written by me; read-only run).
