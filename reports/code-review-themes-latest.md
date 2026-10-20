# Code Review: the latest upgrades in every theme (quick add v35–v37, Debts 1a·05 / v38)

Scope: `D:/3_Claude/PowerApps-live` (branch `live-v35`). I read `expense-pwa/index.html` (the theme blocks at lines 75–761, `THEMES` at 6921, the new quick add CSS at 2131–2285 and the Debts CSS at 1729–2021), `tools/check-contrast.mjs`, `tools/harness/run.mjs`, `quick-entry.js` and `debts.js`, plus all 16 sheets in `reports/themes-debts-1a05/`. I changed no files. You asked for the report to be saved as `D:/3_Claude/PowerApps-live/reports/code-review-themes-latest.md`; I have not written it.

## Executive Summary

The new CSS is disciplined about tokens. It has no hard-coded colours, it uses no token that some theme fails to define, and it adds no `var()` fallbacks. `check-contrast.mjs` correctly measures the 36 pairs it lists across all 16 themes. The weakness is in what nobody measures. The new elements are graphics and states: chip outlines, the selected chip fill, schedule dots, the detail bar, and how state colours differ from each other. Only the debt ring's pair was added to the table, and the harness never renders any theme except the default `:root`. As a result, two themes (flamingo, kingfisher) ship a selected chip and a detail progress bar below 3:1. In rose and flamingo the "repaid" colour is the same red as "cost" and "overdue". The single biggest risk is structural: the theme guard covers text-on-surface pairs, and the upgrades are mostly non-text state, so every new state colour depends on someone looking at a screenshot.

## Overall Score

**80 / 100.** There are no Critical or High findings. Money, data and persistence are not touched by this theming scope. Five Medium findings, all caused by the same gap (non-text states that are unmeasured and run only in the default theme), plus several Low maintainability items hold it in the 75–89 band.

## Findings

### Critical

None.

### High

None.

### Medium

**CODE-01 — The debt detail bar uses a different, unmeasured token pair from the list's bar and ring, and is below 3:1 in two themes**

- Severity: Medium
- Location: `expense-pwa/index.html` 12213 (`barHTML` emits `.goal-bar`), 1729–1736 (`.goal-bar`: fill `--primary`, track `--surface-2`), compared with 1958–1961 (`.debt-ring`) and 1989–1990 (`.debt-summary-bar`): fill `--primary-text`, track `--surface-3`.
- Evidence:
  - The same quantity, the share repaid, is drawn with two pairs. The list pair is in the table (`check-contrast.mjs` 130–132). The detail pair is not.
  - Computed fill against track for the detail bar: flamingo `#F97066` on `#FFE0D6` is about 2.25:1; kingfisher `#00ACC1` on `#B2EBF2` is about 2.1:1; mint and ocean are about 3.0:1, right at the line.
  - The track `--surface-2` on the modal `--surface` is about 1.1:1 in light, so the empty part of the bar is close to invisible (`detail-1.png`, light panel).
  - In `detail-2.png` the flamingo detail bar is coral while the list bar in `debts-2.png` is red: one module, two colours for one fact.
  - The ring comment (1953–1957) says the fill and track were chosen for 3:1. The detail bar quietly bypasses that decision.
- Impact: In two themes the progress reading in the detail sheet is weaker than WCAG 1.4.11, the module shows the same figure in two colours, and no check reports it.
- Recommendation: Render the detail bar with `.debt-summary-bar`, whose tokens are already measured, instead of `.goal-bar`. Savings Goals keeps `.goal-bar` unchanged. No new pair is needed.
- Effort: XS

**CODE-02 — Overdue and later instalments are both hollow dots that differ only by hue, and in four themes the hues nearly match**

- Severity: Medium
- Location: `index.html` 1889 (default dot: 2px `--text-2` ring), 1897 (next: `--warning-text`), 1899 (overdue: `--danger-text`). Only `li.paid` gets a fill (1894).
- Evidence:
  - Shape separates only Paid from the rest. Next, Overdue and Later are all hollow rings.
  - Computed `--text-2` (later) against `--danger-text` (overdue): rose `#831843` vs `#B31739` is about 1.4:1, flamingo `#A34246` vs `#AD1C1C` is about 1.2:1, and both pairs are red.
  - Nord (`#D8DEE9` vs `#E4BDC1`) and owl (`#E0D0B8` vs `#E2A3A3`) are near-identical pastels.
  - Visible in `detail-2.png` (rose and flamingo: every dot reads red) and `detail-3.png` / `detail-4.png` (nord and owl: the overdue dot is only faintly pink).
  - The comment at 1871–1875 says the dots are in "measured text tokens, which clear the 3:1 a graphic needs". That is true against the surface, but it says nothing about telling the dots apart, and `check-contrast.mjs` (ratio against a ground only) cannot express that.
- Impact: The word "Overdue" still carries the state, so WCAG 1.4.1 holds. But the marker designed to pull the eye to the missed instalment does nothing in four themes.
- Recommendation: Give Overdue a shape of its own: fill the overdue dot with `--danger-text`, as Paid is filled. Leave Next and Later hollow. This is shape, not a new token, and it works in every theme. Pair it with CODE-03 so Paid and Overdue (both filled) are not the same red in flamingo.
- Effort: XS

**CODE-03 — `--primary-text` is red or crimson in flamingo and rose, so "repaid" uses the colour of "cost" and "overdue"**

- Severity: Medium
- Location: Theme blocks: flamingo 612 (`--primary-text: #CB1508`) vs 614 (`--danger-text: #AD1C1C`); rose 338 (`#C7216B`) vs 340 (`#B31739`). Consumers of `--primary-text` as the progress colour: 1894–1895 (Paid dot and word), 1901 (`.debt-numbers .paid`), 1914 (`.debt-pct`), 1960 (ring fill), 1990 (summary bar fill).
- Evidence:
  - In `debts-2.png` (flamingo) the Still owed bar and both rings are red directly above and beside the red "COST SO FAR" figure and the red "overdue 18d" due line.
  - In `detail-2.png` the "₮425,000 paid" figure and "20%" are red.
  - In these two themes the token that means progress and the token that means cost or danger are close in hue. Nothing checks that semantic tokens stay apart.
- Impact: Repayment progress reads as an alarm in two of 16 themes, on the one screen whose purpose is the difference between paying off and paying for borrowing.
- Recommendation: Add one `--progress` token, `var(--primary-text)` on `:root`. Override it only in flamingo and rose with a non-red hue that passes 4.5:1 on `--surface` / `--surface-2` and 3:1 on `--surface-3`. Point the five consumers above at it, and add its pairs to `check-contrast.mjs` (a copy of rows 70–71 and 130–131). Every other theme is unchanged.
- Effort: S

**CODE-04 — The selected quick add chip shows its state with a fill below 3:1 in two themes, and nothing measures it**

- Severity: Medium
- Location: `index.html` 2248 (`.quick-chip[aria-pressed="true"], .quick-all.on { background: var(--primary); color: var(--on-accent) }`) on the sheet's `--surface` (2761).
- Evidence:
  - The table measures `--on-accent` on `--primary` (the label, line 54) but not `--primary` against `--surface`, which is the boundary that shows the state.
  - Computed: flamingo `#F97066` on `#FFFFFF` is about 2.8:1; kingfisher `#00ACC1` on `#FFFFFF` is about 2.7:1. Other light themes are 3.0–5.2:1.
  - In those two themes `--on-accent` is `#000000` and `--text` is dark (flamingo `#7A2E32`), so the label colour barely changes when a chip is selected. The fill is the only visible cue (`quick-2.png`, flamingo and kingfisher panels).
- Impact: The selected chip decides which category an entry is saved under. In two themes its state indicator fails WCAG 1.4.11, and the release gate cannot see it.
- Recommendation: Add a non-colour cue to the pressed rule: a leading check glyph, or `font-weight: var(--w-bold)`. Add `{ fg: 'primary', bg: 'surface', min: 3.0 }` to the table so the remaining gap is reported, not assumed. Do not retune `--primary` in those themes for this alone; it is the button fill app-wide.
- Effort: S

**CODE-05 — No probe ever renders a non-default theme, so theme behaviour has no re-runnable guard**

- Severity: Medium
- Location: `tools/harness/run.mjs` (no theme option); `tools/harness/*.js` (searching for `theme|data-theme` finds no probe that calls `applyTheme` or sets `data-theme`); `quick-entry.js` 528–538; `debts.js` 3884–3885.
- Evidence:
  - Every rendered assertion runs under `:root` (light).
  - The chips-versus-keys flow asserts only `cs.borderTopColor !== cs.backgroundColor` (537), which passes at 1.01:1 and is checked in one theme.
  - The schedule flow asserts the dot's class, word and radius, not its colour.
  - `package.json` `test` contains no theme pass.
  - The 16 screenshot sheets are the only theme evidence, and they are neither asserted nor re-run.
- Impact: CODE-01 to CODE-04 shipped without any check failing. The next upgrade will repeat the pattern, and a 17th theme gets no rendered coverage at all.
- Recommendation: Add one flow to `quick-entry.js` and one to `debts.js` that loop over `Object.keys(THEMES)`, call `applyTheme(id)`, and assert computed facts that hold in every theme:
  - the chip fill differs from the key fill;
  - the pressed chip fill differs from the surface;
  - the overdue dot's computed colour differs from a later dot's;
  - the detail bar's fill differs from its track.

  These are equality and difference checks, not a CSS engine; ratios stay in `check-contrast.mjs`.
- Effort: M

### Low

**CODE-06 — The outlined chip boundary is about 1.5–1.8:1 and unmeasured; it is faint in the dark themes**

- Severity: Low
- Location: `index.html` 2242 (`border: 1.5px solid var(--border-2)` on `--surface`).
- Evidence: Computed `--border-2` on `--surface`: light about 1.5:1, midnight about 1.6:1, nord and dark about 1.7:1, kingfisher about 1.8:1. In `quick-3.png` and `quick-4.png` the outlines in dark, slate, gold, owl and oled are faint. WCAG does not require the boundary, because the text label identifies the chip. But the owner's stated reason for the outline (2236–2240) is to tell chips from keys, and that relies on this boundary plus fill (`--surface`) versus fill (`--surface-2`).
- Impact: The distinction the owner asked for is weakest in the dark themes.
- Recommendation: Record the decision in the comment at 2236. If it needs strengthening, use `--text-2` at 1px for the outline (already measured at 4.5:1 on `--surface`), not a new token.
- Effort: XS

**CODE-07 — Schedule state colour depends on source order, not on a stated rule**

- Severity: Low
- Location: `index.html` 1897–1899; class built at 12714 (`[r.state, r.overdue ? 'overdue' : '']`).
- Evidence:
  - A missed first instalment renders as `class="next overdue"`. Red wins over amber only because 1899 comes after 1897 at equal specificity, and an unrelated rule (`.debt-schedule .more-fields`, 1898) sits between them.
  - Each rule also sets `border-color` on the text and `color` on the dot, properties that do nothing there.
  - `debts.js` asserts the class and word, not the computed colour, so a reorder would paint an "Overdue" row amber without failing.
- Impact: A routine tidy-up could silently paint an overdue instalment as "next".
- Recommendation: Write the overdue rule as `li.overdue`, `li.next.overdue` (or raise its specificity), split the dot and word declarations, move 1898 out from between them, and add a one-line comment.
- Effort: XS

**CODE-08 — Off-scale literals and duplicated bar geometry in the new Debts CSS**

- Severity: Low
- Location: `index.html`:
  - 1796 and 1815: `padding: 14px 16px`, `gap: 14px`
  - 1839: `font-size: 22px`, which equals `--t-h2`
  - 1845: `border-radius: 999px`, which equals `--r-full`
  - 1851–1853: `-20px`, hard-coupled to `.modal { padding: 20px }` at 2763
  - 1989–1990: `.debt-summary-bar` repeats `.goal-bar`'s 10px height and 5px radius (1729–1736)
  - 1836 and 1843: `.debt-detail-top` declared twice
- Evidence: The `:root` spacing comment (123–126) says "New declarations use these values". These rules were added in this round.
- Impact: A change to modal padding misaligns the sticky foot, and the two bar definitions will drift. CODE-01 is that drift already, in colour.
- Recommendation: Use the scale tokens where one equals the literal. Merge the duplicate selector. Derive the foot's negative margin from a shared `--modal-pad` token, or leave a comment naming `.modal`.
- Effort: XS

**CODE-09 — `THEMES` repeats each theme's hex values by hand, and one has already drifted**

- Severity: Low
- Location: `index.html` 6921–6938 compared with the theme blocks.
- Evidence: `dark` lists `accent: '#3B82F6'`, but the dark block declares no `--primary` and inherits `#2563EB` from `:root` (99). Every other entry's accent equals its block's `--primary`. Nothing checks that the two agree.
- Impact: The picker swatch misstates one theme's accent. Adding a 17th theme means editing two places with no guard.
- Recommendation: Correct `dark.accent`. Optionally, have `check-contrast.mjs` (which already parses the blocks) assert that each `THEMES` id has a block and that `bg` / `accent` match `--bg` / `--primary`.
- Effort: XS

**CODE-10 — The unguarded `.chip:hover` sticks on touch for the outlined chips**

- Severity: Low
- Location: `index.html` 1571 (`.chip:hover { border-color: var(--primary) }`), compared with the keypad's guarded rule at 2158–2161.
- Evidence: The keypad comment explains that an unguarded `:hover` sticks to the last element tapped on touch. Now that the outline is how quick chips are recognised, a sticky accent border on Date, the account chip or Note after a tap reads as a selected or focused state.
- Impact: A false "selected" cue on the meta chips on phones.
- Recommendation: Wrap the chip's hover rule in `@media (hover: hover)`, as the keypad's is.
- Effort: XS

**CODE-11 — Comments in the touched Debts blocks carry counts and stale patches**

- Severity: Low
- Location: `index.html`:
  - 1800–1813: ".debt-card (now .debt-row)" patched in three times; "overridden by EIGHT theme blocks, not fifteen; in the other eight"
  - 1875: the dots "clear the 3:1 a graphic needs"
- Evidence: `coding-standards.md` says "Never write 'the only', 'all', or a count, unless something enforces it" and "re-read the comment above it before you commit". The eight-block count is true today but nothing enforces it. The 1875 claim covers dot against ground but not dot against dot (CODE-02).
- Impact: The design record says more than the code guarantees, which is the failure `check-contrast.mjs`'s header was written about.
- Recommendation: Rewrite the 1800 block around `.debt-row` without the counts. Narrow the 1875 sentence to "against the surface".
- Effort: XS

### Review areas

- **Correctness of money:** Clean for this scope. The Expenses loan row ("₮85,000 paid, ₮22,500 of it is cost") renders the same in all 16 themes (`expenses-1..4.png`), and the amounts use measured tokens.
- **Data and persistence:** Not touched by the theming work. The theme choice is saved through `saveSoon()` (6996), as before.
- **Architecture:** Clean. The new rules read only tokens, and no theme block contains component rules.
- **Hard-coded colours, missing tokens, fallbacks:** Clean. The new quick add and Debts CSS has no hex or rgba literals. Every token it uses resolves in all 16 themes through the `:root` cascade, which `check-contrast.mjs` models (212–220). No new `var(--x, fallback)` was added.
- **Maintainability:** CODE-07, CODE-08, CODE-11.
- **Error handling:** Not relevant to this CSS scope. `run.mjs`'s fail paths (empty payload, THREW, viewport mismatch) are sound.
- **Security:** Clean. Quick chips are built with `textContent` (7185), and swatch styles go through `escapeHTML` (6984).
- **Performance:** Clean. `fitQuickChips()` runs once per open and per resize, linear in the number of chips.
- **Reliability and scalability:** CODE-05. A 17th theme gets text-pair coverage automatically and nothing else.

## Technical Debt

- **The pair table measures text against a ground, while the upgrades add states and graphics.** `check-contrast.mjs` by design cannot express "these two state colours must differ" or "this fill against that surface marks a state" unless someone adds the row. Overlaps CODE-01, CODE-02, CODE-04, CODE-06.
- **One semantic token does several jobs.** `--primary-text` means brand foreground, link, progress and Paid at once, so a theme that picks a red brand colour turns progress red. Overlaps CODE-03.
- **Two progress-bar components** (`.goal-bar`, `.debt-summary-bar`) with the same geometry and different tokens. Overlaps CODE-01, CODE-08.
- **`THEMES` and the CSS blocks each hold theme values.** Overlaps CODE-09.

## Future Risks

- **A 17th theme**, or a retuned accent, inherits correct text contrast and unmeasured state colours. A red or amber accent re-creates CODE-03 against `--danger-text` / `--warning-text`.
- **Roadmap items that add states** (Notifications, Savings Planner, the Investment Tracker) will reach for `--primary-text` / `--warning-text` / `--danger-text` for new states and meet the same collisions.
- **Screenshot sheets as the theme gate** do not scale. At four screens they are 16 images, and each new screen adds four more that someone must read by eye.

## Recommended Refactoring

The smallest set of changes, in order of risk removed per effort:

1. **Detail bar to `.debt-summary-bar`** (CODE-01, XS). This removes an unmeasured pair and a duplicated component in one edit.
2. **Overdue dot filled** (CODE-02, XS), with **hover guarded** (CODE-10, XS) and **schedule selector order made explicit** (CODE-07, XS).
3. **A `--progress` token**, overridden only in flamingo and rose, with its pairs added to the table (CODE-03, S).
4. **A non-colour pressed cue on quick chips**, plus a `primary` on `surface` 3:1 row (CODE-04, S).
5. **One theme loop per probe file** in `quick-entry.js` and `debts.js`, asserting difference facts across `THEMES` (CODE-05, M). This is the step that stops the class from recurring.
6. **Cleanup:** fix `THEMES.dark.accent` and optionally guard the match in `check-contrast.mjs` (CODE-09); swap the Debts literals for tokens (CODE-08); correct the comments (CODE-11).

No rewrite and no new library is needed. Every step is a token, selector or probe change inside files that already exist.
