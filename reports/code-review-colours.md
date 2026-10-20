# Code Review: Colour System (Home charts, Insights, theme tokens)

Reviewed: the live worktree `D:/3_Claude/PowerApps-live` (branch live-v35, v38). Files: `D:/3_Claude/PowerApps-live/expense-pwa/index.html`, `D:/3_Claude/PowerApps-live/tools/check-contrast.mjs`, `D:/3_Claude/PowerApps-live/tools/check-escaping.mjs` and `D:/3_Claude/PowerApps-live/tools/harness/`. I read all 20 sheets in `D:/3_Claude/PowerApps-live/reports/themes-colours/` and checked them against the code. Quick add is out of scope.

**About line numbers:** `index.html` changed while I was reading it (the quick add work running in parallel). The same functions moved by about 22 lines between my first and last reads. The line numbers below come from my last read. Where a number and a function name disagree, go by the function name.

## Executive Summary

The chart code mostly uses tokens. The donut, Planned vs Actual, Monthly Trend, calendar and hero all paint with `var(--…)`. The exception is the category palette: twelve hex values in JavaScript, assigned by position in the category list. Because they sit in JavaScript, they do not change with the theme and `check-contrast.mjs` cannot see them. Some of them are also the app's own state colours: with the default categories, Transport is painted the exact light-theme expense red, and Utilities the income/Savings green. The colours carrying meaning also collide elsewhere:
- Planned vs Actual paints Planned in the brand colour, which matches Actual's over/under colour in seven themes.
- Planned vs Actual paints Actual in text tokens, which in nord and owl are faded until over and under differ by hue alone.
- Planned vs Actual paints extra saving red, as "over".
- The Needs/Wants/Savings tokens have the same value as the state tokens in most themes.

The single biggest risk is structural. Category colour is neither stored nor themed nor measured, so the palette cannot be fixed per theme, cannot stay stable per category, and cannot be kept from regressing until it moves into tokens and a stored slot number. No figure is wrong anywhere in this scope.

## Overall Score

**78 / 100.** No Critical or High findings. The figures are right and every chart has a text label or legend beside its colour. Seven Mediums hold it in the 75–89 band. They come from one root (colour assigned outside the token and measurement system) plus three local defects in Planned vs Actual and the group tokens.

## Findings

### Critical

None.

### High

None.

### Medium

**CODE-01 — The category palette is outside the token system: not theme-aware and not measurable**

- Severity: Medium
- Location: `index.html` — `CATEGORY_COLORS` and `categoryColor()` (Analytics section, about l.9651–9662). Used by `renderDailyChips()` (`--chip-color`), `drawDailyStackedChart()` (segment `background`) and `renderDaySelected()` (`.cat-dot`).
- Evidence:
  - Twelve hex literals in JavaScript, identical in all 16 themes (confirmed in insights-1…4 and daily-1…4).
  - `check-contrast.mjs` `readThemes()` reads only the theme blocks, so these colours are invisible to it.
  - Measured by hand with the tool's own WCAG formula, several fall below the 3:1 graphics minimum on light grounds:
    - `#F59E0B` on light chip `--surface-2` `#F1F5F9`: about 1.97:1. On the white card under the stacked bars: about 2.15:1.
    - `#84CC16` on `#F1F5F9`: about 1.80:1.
    - `#06B6D4` on kingfisher `--surface-2` `#B2EBF2`: about 1.86:1.
  - In the stacked daily chart, colour is the only key ("no other key except a tap", per the comment above the array).
- Impact:
  - Muted themes (nord, sepia, owl, gold) show saturated light-theme colours on pastel or dim grounds.
  - Light themes have stacked-bar segments the eye cannot separate from the card.
  - Nothing can measure or fix this per theme while the colours live in JavaScript.
- Recommendation: declare `--cat-1` … `--cat-12` as plain hex tokens in `:root` and override them only in themes where measurement fails. `categoryColor()` returns `var(--cat-N)`. Delete `CATEGORY_COLORS`.
- Effort: S

**CODE-02 — The palette contains the state colours and near-duplicates of itself**

- Severity: Medium
- Location: `CATEGORY_COLORS`; `defaultCategories` (about l.4103).
- Evidence:
  - Light-theme exact matches: `#EF4444` = `--danger`, `#10B981` = `--success` = `--savings`, `#F59E0B` = `--warning` = `--wants`, `#3B82F6` = `--needs`.
  - Colours follow list position, so the shipped defaults get: Groceries (Needs) amber (Wants/warning), Utilities (Needs) green (income/Savings), Transport (Needs) red (expenses/over budget). The insights sheets show exactly this in every theme.
  - Near-duplicates that both appear among the shipped defaults: `#10B981` Utilities vs `#14B8A6` Investments (indistinguishable in insights-1…4), and `#8B5CF6` Dining Out vs `#A855F7` Loan payment. `#6366F1` is a third violet, and `#F97316` (Emergency Fund) sits next to `#F59E0B` (Groceries).
- Impact:
  - On the one chart keyed only by colour, a red segment reads as "bad" and a green one as "income".
  - Two default categories cannot be told apart without tapping.
- Recommendation: when CODE-01 is fixed, pick the twelve slot tokens from hues clear of each theme's `--danger`/`--success`/`--warning`, and enforce that with the probe in CODE-07.
- Effort: S (included in CODE-01)

**CODE-03 — Category colour depends on list position, so it is unstable and repeats after twelve**

- Severity: Medium
- Location: `categoryColor()` (`db.categories.findIndex` then `% CATEGORY_COLORS.length`). Things that move positions: `initCategoryReorder()` → `initReorder('catList', () => db.categories, …)` (drag in Settings), the `[data-del-cat]` handler in `renderCategoryList()` (filters the array), and migration `toV3` (appends Loan payment last on upgraded installs).
- Evidence:
  - Dragging one row, or deleting any category above others, recolours every category below it on Insights.
  - The 13th category gets the 1st category's colour. Defaults already use 10 of the 12.
  - The `catAdd` comment relies on this behaviour ("two identically-labelled chips in different colours … categoryColor() is by index").
- Impact:
  - Users who learned "blue = Rent" are silently re-taught.
  - Past about 12 categories, two categories share a colour on the chart keyed only by colour.
- Recommendation: store a palette slot on each category; see Recommended Refactoring, R2. Do not hash the category id instead: with 10 categories in 12 slots, the chance of no collision is about 0.4%.
- Effort: M

**CODE-04 — Planned vs Actual: Planned collides with Actual's state colours, and Actual is painted with text tokens**

- Severity: Medium
- Location: `drawPvA()`. `actualColor` (about l.9474) uses `var(--danger-text)` / `var(--success-text)` / `var(--text-2)`. The Planned bar inline `background:var(--primary)` (about l.9514) repeats `.bar > span { background: var(--primary) }` (l.1501).
- Evidence (plan-1…4):
  - Same hue for Planned and under-budget Actual: forest `#059669` vs `#04714F` (about 1.6:1), plus mint, oled and peacock.
  - Same hue for Planned and over-budget Actual: flamingo `#F97066` vs `#AD1C1C` (about 2.55:1, lightness only), plus rose. Sepia: `#B45309` vs `#A71919` (about 1.50:1).
  - Nord: over `#E4BDC1` vs under `#CBDABE` = about 1.16:1. They differ only in hue, pale pink against pale green, which is the pair red-green colour blindness confuses. Owl is similar (`#E2A3A3` / `#B4C58B`). This happens because the `-text` tokens are faded for text contrast on dark grounds; they are not graphic tokens.
- Impact: the "Planned"/"Actual" labels and the "over/under" words keep the card readable, but in roughly half the themes the bars stop carrying the comparison.
- Recommendation:
  - Move the colours from inline styles to classes: `.pva-plan`, and `.pva-actual` with `.is-over` / `.is-under` / `.is-unplanned`.
  - Paint Planned in one neutral chart token that is never a state colour.
  - Paint Actual with the graphic tokens `--danger` / `--success`, not the `-text` ones.
  - Measure both against the `--surface-2` track (CODE-07).
  - Which neutral to use is a design call for UI review and the Chief Architect.
- Effort: S

**CODE-05 — Planned vs Actual paints extra saving red, as "over"**

- Severity: Medium
- Location: `drawPvA()` — the `diff > 0` branch and `actualColor` apply to every group. The totals line repeats the same judgement.
- Evidence: plan-1…4, every theme: "Emergency Fund · Savings · over ₮66,666" in `--danger-text`, with a red Actual bar.
- Impact: putting money aside, the behaviour the product wants to encourage, gets the same signal as overspending. The figure is right; the meaning the colour gives it is the opposite.
- Recommendation: this is a product ruling, not an engineering one; it belongs to the Chief Architect. Engineering needs one place where state is decided from (group, planned, actual), so the classes in CODE-04 read a single result. Possible rulings: Savings over plan shown as neutral or positive, or Savings rows given no over/under colour at all.
- Effort: XS once ruled

**CODE-06 — The Needs/Wants/Savings tokens have the same values as the state and brand tokens**

- Severity: Medium
- Location: theme blocks (`:root` l.75 and following, each `html[data-theme=…]`); `drawDonut()` `colors` (about l.9377).
- Evidence, by value in the theme blocks:
  - `--savings` = `--success` in 14 of 16 themes (all except dark and rose).
  - `--wants` = `--warning` in 10 (light, sepia, ocean, forest, rose, oled, nord, peacock, flamingo, kingfisher).
  - `--needs` = `--primary` in ocean, rose, midnight and slate.
  - Owl `--wants` = `--primary` (`#C49960`).
  - Flamingo `--needs` `#E11D48` is rose's `--danger` and is close to flamingo's own `--danger` `#DC2626`. In split-2, Needs (84% of the sample) is a red ring.
  - The dark theme declares no group tokens at all and inherits the light-theme ones.
- Impact:
  - Home shows Savings in the income green and Wants in the warning amber, beside green and red KPI figures.
  - In flamingo the largest slice of the main chart reads as an alarm.
  - Nothing keeps the group meanings apart from the state meanings.
- Recommendation: decide whether group colours may equal state colours (a design ruling). Whatever the ruling, enforce it with the inequality and distance probe in CODE-07. At minimum, move flamingo `--needs` off the red hue.
- Effort: S

**CODE-07 — Nothing measures chart colours, and nothing checks that a colour keeps one meaning**

- Severity: Medium
- Location: `tools/check-contrast.mjs` `PAIRS` (38 rows); `tools/harness/` (no chart probe).
- Evidence:
  - `PAIRS` has no row for `--needs`/`--wants`/`--savings` as fills, for `--success`/`--danger` as trend bars on `--surface`, for `--primary` against the Planned vs Actual track `--surface-2`, for the Planned vs Actual Actual fills, or for any category colour (CODE-01).
  - No predicate compares one series with another.
  - The harness reads computed colours only for quick-entry and debts. `debts.js` "repayment progress is never painted in the danger colour" (the `tok()` helper, per-theme loop) is the existing pattern, and no chart probe uses it.
  - The summary line "16 themes × 38 pairs, 0 below" reads as "colours are checked", but it covers text, not charts.
- Impact: CODE-01, 02, 04 and 06 all shipped without any measurement noticing, and any fix would regress the same way.
- Recommendation:
  - Add `PAIRS` rows at 3.0: `cat-1…12` vs `surface` and `surface-2`; `needs`/`wants`/`savings` vs `surface`; `success`/`danger` vs `surface`; the Planned vs Actual Planned and Actual tokens vs `surface-2`. These need no new code once the colours are tokens.
  - Add one harness probe, `chart-colours.js`. Per theme, it asserts:
    - (a) no `--cat-N` is within a fixed distance of `--danger`/`--success`/`--warning`;
    - (b) the slots are pairwise distinct by the same distance;
    - (c) Planned ≠ Actual in both states;
    - (d) a category keeps its `--chip-color` after a reorder and after deleting the category above it.
  - Use one distance function defined once. A plain equality test would miss flamingo's `#E11D48` vs `#DC2626`.
  - Keep check-contrast's ruling-V4 scope: series-vs-series distance belongs in the probe, not the contrast tool.
- Effort: S

### Low

**CODE-08 — Flamingo's hero turns brown because the scrim colour is fixed at black**

- Severity: Low
- Location: `.hero-kpi` background `linear-gradient(rgba(0,0,0,var(--hero-scrim)), …)` (about l.977); `check-contrast.mjs` pairs `over: { colour: '#000000', alphaToken: 'hero-scrim' }` (l.66–67).
- Evidence: flamingo `--hero-scrim: 0.37` black over `#F97066`→`#FCA5A5` gives the brown-rose seen in split-2 and trend-2. Contrast passes; the hue is lost. Slate, nord, owl and gold desaturate the same way, less visibly.
- Impact: polish only. The owner noticed it.
- Recommendation:
  - Add a `--hero-scrim-colour` token (default `#000000`, so 15 themes are unchanged) with a deep on-hue override for flamingo, for example its `--text` `#7A2E32`.
  - Point both pair rows' `over.colour` at the token. `colourFor()` already accepts a token name.
  - Re-derive flamingo's alpha.
- Effort: XS

**CODE-09 — The deleted-category colour is a light-theme literal**

- Severity: Low
- Location: `categoryColor()` fallback `'#94A3B8'`.
- Evidence: this is the light theme's `--text-3`, hard-coded. It is used for entries whose category was deleted ("Unknown" rows in the day detail).
- Impact: inconsistent with the dark and pastel themes, and not measured.
- Recommendation: return `var(--text-3)` (or the neutral chosen in CODE-04).
- Effort: XS

**CODE-10 — The calendar heat ramp has almost no range in kingfisher and nord**

- Severity: Low
- Location: `renderCalendar()` `heatMax` / `heatMin`; tokens `--heat-max` kingfisher 0.27, nord 0.29.
- Evidence: daily-2 (kingfisher) and daily-3 (nord): the hottest cells (3, 9, 16, 20) are barely separable from empty cells. The ceiling is set by text contrast (the measured pair at l.111), so the comment's "Ranking survives regardless" holds only through the printed amounts.
- Impact: the heatmap's job, pointing at heavy days, is mostly lost in two themes. The values stay printed in the cells.
- Recommendation: a design call: a non-fill marker for the top band, or a different ramp ground. If the ramp stays, add a probe for minimum separation between `heatMin` and empty cells.
- Effort: S

### Clean or not assessed

- **Correctness of money:** chart colours do not affect any figure. The only meaning error is CODE-05.
- **Data and persistence:** no colour is stored today, so there is nothing to migrate yet. Import replaces the whole database and keeps array order, so today's position colours survive export/import. Implications of storing a slot are under R2.
- **Architecture:** the chart renderers read tokens through CSS. The palette is the only colour decision made in JavaScript (CODE-01).
- **Error handling:** clean for this scope.
- **Security:** clean today. `categoryColor()` returns only constants, and category names are escaped. See Future Risks on `check-escaping.mjs`.
- **Performance:** `drawMonthlyTrend()` calls `spendingEntries()` once per month. This is known, deferred (WORK-156) and timed by `tools/harness/perf.js`, so I raise no new finding. `categoryColor()` runs a `findIndex` per chip and per segment, which is trivial; R2 makes it O(1).
- **Dead code:** none in scope.

## Technical Debt

- **Colour lives in three places:** stylesheet tokens, inline `style=` strings in JavaScript templates (`drawPvA`, `drawDailyStackedChart`, `renderDaySelected`), and a JavaScript array. Every new chart repeats that choice. (CODE-01, CODE-04)
- **Text tokens doubling as fills.** The `-text` tokens are tuned for 4.5:1 text and faded on dark grounds, so using them as fills breaks separation (CODE-04). The project has no declared "graphic series" token role yet.
- **The dark theme declares no group tokens** and inherits the light-theme values. That works, but it is the only theme where the donut's colours were never chosen for its ground. (CODE-06)
- **A comment that will go stale:** the `catAdd` comment's "categoryColor() is by index" becomes false with R2 and must be rewritten in the same change (coding-standards: keep comments true).

## Future Risks

- **Storing a colour string per category would break two guarantees at once.** `check-escaping.mjs` lists `categoryColor` in `SAFE_WRAPPER` because its output is a constant. If it returned an imported hex or CSS string, attacker-controlled text would reach a `style=` attribute with the check still passing. A stored hex would also undo theme-awareness. R2 stores a small integer validated at the border for this reason.
- **The 17th theme** inherits whatever `:root` declares. Without the CODE-07 probe, a new theme can reintroduce a red Needs or a Planned bar that matches Actual unnoticed.
- **Growth in categories:** the defaults use 10 of 12 slots. Users adding categories hit duplicates almost at once. R2 assigns the least-used slot, which keeps duplicates as far apart as possible but cannot remove them past 12. That is the honest limit the existing KNOWN LIMIT comment already states.
- **Roadmap items such as Reports and the AI Budget Assistant** will chart by category. If colour is not a stable property of a category by then, each new surface will re-derive it, and the copies will drift apart.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

**R1 — Palette into tokens.** Fixes CODE-01, CODE-02 and CODE-09.
- Add `--cat-1` … `--cat-12` as plain hex in `:root`, with per-theme overrides only where the R4 rows fail.
- Choose hues clear of each theme's state colours.
- `categoryColor()` returns `var(--cat-N)`, with the fallback `var(--text-3)`.
- Delete `CATEGORY_COLORS`.
- No data change. Effort S.

**R2 — Stable slot per category.** Fixes CODE-03.
- Add an optional integer `colorSlot` (1–12) to each category record.
- **Migration `toV4`:** stamps `slot = (index % 12) + 1` in current order, so no existing user sees a colour change on upgrade. This is append-only, as the migration rules require.
- **Load normaliser:** runs on every load, next to `normalizeGroup`. A missing, non-integer or out-of-range slot gets the lowest unused slot, or the least-used one once all 12 are taken. This covers imports and categories created by older builds.
- **New categories:** `catAdd` uses the same assignment.
- **`defaultCategories`:** authored with fixed slots.
- **Reorder and delete:** no longer move any colour.
- **Import/export:** the slot travels in the backup automatically. `importProblem` does not need to reject it, because the normaliser repairs it, which is the same policy as `group`.
- **Backward compatibility:** an older build keeps the unknown field, because `load()` spreads the parsed file and edits categories in place.
- **Store the slot, never a colour:** this keeps theme-awareness and keeps the `check-escaping` exemption true.
- Effort M.

**R3 — Planned vs Actual colours as classes.** Fixes CODE-04, with CODE-05 once ruled.
- `.pva-plan` in a neutral chart token.
- `.pva-actual.is-over` / `.is-under` / `.is-unplanned` in `--danger` / `--success` / neutral.
- One function decides the state from (group, planned, actual).
- Delete the inline background styles. Effort S.

**R4 — Measure what charts paint.** Fixes CODE-07 and guards CODE-06.
- Add the 3.0 `PAIRS` rows listed in CODE-07.
- Add one harness probe, `tools/harness/chart-colours.js`, built on the `debts.js` `tok()` per-theme pattern: slot-vs-state distance, slot-vs-slot distance, Planned ≠ Actual, colour stable across reorder and delete.
- Add it to `npm test`. Effort S.

**R5 — Fix the flamingo hero and the group tokens.** Fixes CODE-08 and CODE-06 once the design ruling is made.
- Add the `--hero-scrim-colour` token.
- Move flamingo `--needs` off red. Whether `--savings`/`--wants` may equal `--success`/`--warning` is ruled once and enforced by R4. Effort XS–S.

Do R1 and R4 together, so the new tokens arrive already measured. R2 is the only step that changes stored data, and it should be its own change.
