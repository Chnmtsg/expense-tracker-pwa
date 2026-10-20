# UI Review: Colour System (Home charts, Analytics, theme tokens), live v38

Scope: `D:/3_Claude/PowerApps-live/expense-pwa/index.html` (branch live-v35), `tools/check-contrast.mjs`, `tools/harness/`, and all 20 sheets in `D:/3_Claude/PowerApps-live/reports/themes-colours/`. I checked every colour judgement against the token values in the file, not against the screenshots. Contrast ratios are WCAG relative luminance, worked out by hand from the hex values. Line numbers are as read on 2026-10-20. The file was being edited in parallel during the review (some lines moved by about 6), so function names are given as anchors too. Quick add is out of scope. The screen the request calls "Insights" has the header **Analytics** in the app, and that is the name used below.

## Executive Summary

Text contrast is in good shape: every text pair the tool measures passes in all 16 themes. The colours that carry meaning in the charts are not. The app has no chart colour layer of its own. Every series borrows a token that already means something else:
- the brand colour (`--primary`) draws Planned bars, the heatmap and the hero card;
- the state colours (`--success`, `--danger`, `--warning`) draw the Needs / Wants / Savings groups;
- one fixed list of twelve hex values, the same in every theme, draws the categories.

**The biggest problem:** in 7 of 16 themes the brand colour is itself a state hue. It is green in mint, forest, peacock and oled, red or crimson in flamingo and rose, and red-brown in sepia. So "planned", "more spending" and "your balance" are drawn in the colour that elsewhere means "income / good" or "over budget". Category colours are tied to list position, so dragging a category in Settings recolours the Analytics charts. Nothing in `tools/` measures a chart series or checks that a colour keeps one meaning.

## Overall Score

**66 / 100: usable but fragile.** There are two High findings (UI-01, UI-02) and five Mediums. None of them is Critical: no figure is wrong, and every chart carries words or amounts beside its colours. But colour contradicts those words often enough, across enough themes, that the colour system does not meet "colours mean the same thing everywhere" or "maintain consistent themes".

## Strengths

- **Words, not just colour, on most charts.** Planned vs Actual says "over / under / on target" in words. The Trend chart puts ↑ / ↓ on both the bars' figures and its legend. Category chips show an off state with a dashed border, strikethrough and a grey dot. So no chart except the stacked daily bars relies on hue alone (see UI-01).
- **Text contrast is measured, not claimed.** There are 38 pairs × 16 themes in `tools/check-contrast.mjs`. The hero scrim and the heatmap ceiling are worked out per theme, and opacity over text has been removed throughout. Every text pair visible in the 20 sheets reads clearly.
- **Dark themes are disciplined.** In dark, slate, midnight and oled the state colours are distinct from the brand, and the charts read cleanly.

## Findings

**UI-01: Category colours ignore the theme, depend on list position, include the state hues, and are the only key in the stacked daily chart**

- Severity: High
- Location: `index.html:9661-9668` (`CATEGORY_COLORS`, `categoryColor`). Used in the Analytics category chips (`renderDailyChips`, :9928), the Daily Breakdown stacked bars (`drawDailyStackedChart`, about :9995) and the day detail (`renderDaySelected`, about :10086). Sheets: `insights-1…4.png`, `daily-1…4.png`.
- Evidence:
  1. **Theme-blind.** It is one array of twelve hex values with no theme lookup. The sheets show identical dots on all 16 grounds, from cream (sepia) to pure black (oled).
  2. **Positional.** `categoryColor` returns `CATEGORY_COLORS[idx % 12]`, where `idx` is the category's position in `db.categories`. Categories can be dragged into a new order in Settings ("Drag the ⋮⋮ grip up or down to reorder", `renderCategoryList`, :9084), and they can be deleted (:9100). Either action recolours every category below it. A thirteenth category repeats the first category's colour.
  3. **Overlaps the state colours.** `#EF4444`, `#10B981` and `#F59E0B` are exactly the light theme's `--danger`, `--success` and `--warning`. In the sample data, Transport is drawn in expense red and Utilities in income green.
  4. **Near-duplicates.** Emerald `#10B981` vs teal `#14B8A6`, and cyan `#06B6D4` vs teal `#14B8A6`. In the sheets, Utilities, Shopping and Investments are three blue-green dots that are hard to tell apart. Violet `#8B5CF6`, purple `#A855F7` and indigo `#6366F1` form a second cluster.
  5. **Below 3:1 against the grounds they sit on (WCAG 1.4.11, graphics).** On light `--surface` `#FFFFFF`, five of the twelve fail: `#84CC16` 1.97:1, `#F59E0B` 2.15, `#06B6D4` 2.43, `#14B8A6` 2.47, `#10B981` 2.54. On nord `--surface` `#3B4252`, the first slot, `#3B82F6` (Rent, the largest category), measures 2.73:1, and `#6366F1` measures 2.25:1.
  6. **Colour is the only key.** In the stacked daily bars (10 px wide, segments down to 1 px) the only category labels are `title` attributes, and on a phone those only appear on hover. The file's own comment (:9657) admits this.
- Impact: Analytics is a core module. Its chart cannot be read by colour for anyone with red-green colour blindness, or on muted themes. Worse, the colours are unstable: a user who learns "Rent is blue" sees Rent turn amber after tidying their category list, with no warning. The only workaround is to tap each day and read the detail list.
- Recommendation: two corrections, no redesign.
  - (a) Store a colour slot on each category (`colorSlot`), assigned once at creation as the first unused slot. For existing data, fill it from the current position, so nothing changes colour on upgrade (backward compatible).
  - (b) Replace the hex array with per-theme tokens `--cat-1 … --cat-10`. Two tuned sets are enough to start, one for light grounds and one for dark, plus overrides for the muted themes (nord, sepia, owl, gold). Each slot must measure at least 3:1 against `--surface` and `--surface-2`. No slot should reuse the exact `--danger`, `--success` or `--warning` value; separate them by lightness or a hue step.
  - Leave the chart structure alone. The day detail remains the labelled view.
- Effort: M

**UI-02: In seven themes the brand colour is a state hue, so Planned bars, the heatmap and the hero card speak in "income" green or "over budget" red**

- Severity: High
- Location:
  - Planned vs Actual Planned bar: `drawPvA`, :9520, `background:var(--primary)`
  - Calendar heat: `.cal-cell::before`, :2554, `background: var(--primary)`
  - Hero ground: `.hero-kpi`, :977-979
  - flamingo `--primary-text` `#CB1508`, :620
  - Theme blocks mint :534, forest :300, peacock :572, oled :454, flamingo :612, rose :337, sepia :226
  - Sheets: `plan-*.png`, `daily-*.png`, `split-*.png`
- Evidence, Planned bar against the Actual bar (`--success-text` when under, `--danger-text` when over), measured:

  | Theme | Planned (`--primary`) | Actual | Ratio between the bars |
  |---|---|---|---|
  | oled | `#10B981` | under `#34D399` | 1.32:1, same hue |
  | mint | `#16A34A` | under `#107435` | 1.78:1 |
  | forest | `#059669` | under `#04714F` | 1.60:1 |
  | peacock | `#14B8A6` | under `#78E2BB` | 1.59:1 |
  | rose | `#DB2777` | over `#B31739` | 1.47:1 |
  | sepia | `#B45309` | over `#A71919` | 1.50:1 |
  | flamingo | coral `#F97066` | over `#AD1C1C` | 2.55:1, both red |

  In those themes, the two bars that make up a row's comparison are one colour family. In the four green themes, "under plan" is drawn in the brand green, so the "good" signal does not stand out from the plan. In flamingo, sepia and rose, the brand colour itself looks like "over".
- Evidence, heatmap: the same `--primary` makes "more spending" darker green in mint, forest, peacock and oled (`daily-2.png`, `daily-4.png`).
- Evidence, hero: the card stays brand-coloured when Left over is negative. `renderDashboard` only changes the trend line to "↓ You spent … more than you earned" (:9326). So in mint, forest, peacock and oled a negative balance sits on a green card.
- Evidence, flamingo text: `--primary-text` `#CB1508` is within a few degrees of hue of `--danger-text` `#AD1C1C`. So the active tab label, the "Calendar View — **Actual**" mode label and every other brand-coloured piece of text read as warning red (`daily-2.png`, flamingo).
- Impact: Dashboard and Analytics are both core modules. In nearly half the themes, the at-a-glance colour reading contradicts the words beside it. A user with no accounting background reads colour first. A negative balance on a green card, or a planned amount in alarm red, is exactly the misreading the guidelines' "reduce cognitive load" is meant to prevent. The words prevent wrong figures, which is why this is High and not Critical.
- Recommendation: add two chart tokens rather than re-tuning brands.
  - (a) `--chart-planned`: a neutral reference fill, for example `--text-3` or a grey-blue, measured at least 3:1 against `--surface-2`, the bar track. Use it for the Planned bar so Planned never shares a hue with either outcome.
  - (b) `--heat`: per theme, defaulting to `--primary`, overridden in the seven themes to a hue clear of `--success` and `--danger`.
  - (c) Hero, the smallest safe option: when `net < 0`, add a class that swaps the gradient for a `--danger`-based ground. Measure it with the same `--on-hero` / scrim pair in check-contrast.
  - (d) flamingo: move `--primary-text` off the danger hue, the same way `--progress` was moved under WORK-06.
- Effort: M

**UI-03: Needs / Wants / Savings colours are copies of the state colours, so the group donut makes value judgements**

- Severity: Medium
- Location: `--needs`, `--wants`, `--savings` and their `-text` variants in all theme blocks (:102-127 and per theme). `drawDonut` :9380. `.tag.needs/.wants/.savings` :1345-1347. Sheets: `split-*.png`, `plan-*.png`.
- Evidence:
  - `--savings` is identical to `--success` in every theme that sets both: sepia, ocean, forest, midnight, slate, oled, nord, mint, peacock, flamingo, kingfisher, owl and gold. In light and dark the root values match too (`#10B981`).
  - `--wants` is identical to `--warning` in light, sepia, ocean, rose, nord, peacock and kingfisher, and within a shade of it in midnight and slate.
  - `--needs` sits in the danger family in three themes:
    - flamingo: `#E11D48` vs `--danger` `#DC2626`. `--needs-text` `#AD1637` vs `--danger-text` `#AD1C1C` is effectively the same colour. In `plan-2.png` the pink "Needs" tag sits beside "over ₮266,668" in the same red.
    - rose: `#DB2777` vs `--danger` `#E11D48`.
    - sepia: `#7C2D12` vs `--danger` `#B91C1C`.
  - In flamingo, 84 % of the donut ring is drawn in near-danger red for ordinary rent and groceries.
  - Elsewhere the group colour equals the brand: `--needs` = `--primary` in midnight, ocean, slate and rose, and owl's `--wants` `#C49960` is exactly owl's `--primary`.
- Impact: the donut is the default pane on Home. Wants drawn in warning amber suggests wants are a problem. Needs in red (flamingo) suggests essential spending is an alarm. The legend labels prevent a wrong reading of the amounts, but the colours make a judgement the app does not intend.
- Recommendation: take the three group colours from the category palette introduced in UI-01 (three reserved slots, or dedicated `--group-*` tokens) instead of aliasing the state tokens. Measure them against `--surface` at 3:1 and against each other.
- Effort: S (once UI-01's tokens exist; M if done alone)

**UI-04: Saving more than planned is shown in red as "over"**

- Severity: Medium
- Location: `drawPvA`, :9476-9480 (`diffHTML`, `actualColor`). Totals line about :9533. Sheets: `plan-1…4.png`, "Emergency Fund · Savings".
- Evidence: in every theme, Emergency Fund (group Savings, planned ₮0, actual ₮66,666) shows "over ₮66,666" in `--danger-text` with a red Actual bar. The colour and the word depend only on `actual > planned`, never on `v.group`. The totals line "over by …" includes savings rows as well.
- Impact: for the target user, red plus "over" says they did something wrong. Putting extra money into an emergency fund is the behaviour the product's vision exists to encourage.
- Recommendation: for rows whose group is Savings, use neutral colours (`--text-2` word, `--chart-planned` or neutral bar) and the words "ahead by" / "short by" in place of over / under. Keep the danger colour for Needs and Wants.
- Effort: S

**UI-05: The calendar heatmap barely shows in light and muted themes, and its legend shows lighter steps than the cells ever use**

- Severity: Medium
- Location: `.cal-cell` / `.cal-cell::before`, :2544-2560. `renderCalendar`, `heatMax` / `heatMin`, about :9837-9844. `.cal-legend` markup :3374. `.cal-legend .swatch`, :2572. Sheets: `daily-1…4.png`.
- Evidence:
  - The hottest possible cell against an empty cell (`--primary` at `--heat-max` over `--surface-2`) measures 1.23:1 in kingfisher (`#00ACC1` at 0.27 over `#B2EBF2`) and 1.62:1 in nord (`#88C0D0` at 0.29 over `#434C5E`). WCAG 1.4.11 asks 3:1 for graphics.
  - In `daily-2.png` (kingfisher) and `daily-3.png` (nord), the filled days are almost indistinguishable from the empty ones.
  - The legend sets `opacity` on the whole swatch, border included, over `--surface`, while the cells sit on `--surface-2`. So the legend shows a different colour pair from the one the cells use.
  - The legend's lowest step is `heat-max × 0.2`, which is 0.054 in kingfisher and 0.058 in nord, and is effectively invisible in the sheets. But no painted cell is ever lighter than `heatMin = min(0.15, heatMax × 0.5)`. The legend therefore shows a density the grid never uses, which is the exact thing the markup comment at :3371 says it prevents.
- Impact: amounts are printed in the cells, so no data is lost. But the heatmap's purpose, spotting heavy days at a glance, fails in roughly a third of themes, and the legend misdescribes the scale.
- Recommendation:
  - (a) Build the legend swatches from the same `--intensity` arithmetic as the cells (`heatMin`, then steps up to `heatMax`), painted on `--surface-2` with an unfaded border.
  - (b) Paint the heat in the `--heat` token from UI-02, chosen per theme to reach at least 3:1 between empty and maximum while `--text` still clears 4.5:1. If no hue does both in a theme, put the text on its own small solid ground inside the cell.
- Effort: S for (a), M for (b)

**UI-06: Chart series fail the 3:1 graphics contrast and nothing measures them**

- Severity: Medium
- Location: `tools/check-contrast.mjs` PAIRS (:52-144). Trend bars `drawMonthlyTrend` :9626-9627. Donut `drawDonut`. Legend dots :1521.
- Evidence: the pair table has no row for any chart series against its ground and no row comparing series with each other. Measured from the tokens:
  - light Trend Income bar `--success` `#10B981` on `#FFFFFF`: 2.54:1
  - light donut Wants `#F59E0B`: 2.15:1, Savings `#10B981`: 2.54:1
  - kingfisher Wants `#FF8F00` on white: 2.29:1
  - nord Wants against Savings in the donut (`#EBCB8B` / `#A3BE8C`): 1.30:1 lightness difference, separated by hue only

  No check anywhere asserts that a token keeps one meaning, which is why UI-02 and UI-03 went unnoticed. The harness (`tools/harness/*.js`) has no colour test; `donut-legend-width.js` checks layout only.
- Impact: every future theme or token tweak can repeat UI-01 to UI-03 silently. The tool's "0 below" result currently reads as a clean bill of health for the colours it does not measure.
- Recommendation: add rows at 3.0 for each series against `--surface`, and for `--chart-planned` / `--success-text` / `--danger-text` against the bar track `--surface-2`. Add a small separate assertion that `--needs`, `--wants`, `--savings`, `--chart-planned`, `--heat` and `--cat-*` are not equal to, and not within a hue and lightness threshold of, `--success` / `--danger` / `--warning`, and that the `--cat-*` slots differ from each other by a minimum distance. This would have caught UI-02 and UI-03 when they were introduced.
- Effort: S

**UI-07: "Left over" on a green card is fine, but the only coloured figure on the KPI strip is the derived one the app warns against reading as spendable**

- Severity: Medium
- Location: `renderDashboard`, :9353 (`plannedNetEl.style.color`). Sheets: `split-1…4.png`, `trend-1…4.png`.
- Evidence: Income and Expenses render in `--text`. "Income minus plan ₮900,000" renders in `--success-text`, the only green figure on the card, in all 16 themes. The comment at :9354-9361 records that "the plainest reading of a green 'Left After Plan' … was that the larger figure is spendable", and adds the caption "Money already spent is not taken off." to counter it. The green colour argues against that caption.
- Impact: on the first screen, the eye is drawn to the figure with the weakest basis, in the colour that means "good / available". This confirms the orchestrator's observation 6 only to this extent: the tinted icon tiles are low-alpha and do not compete with the hero.
- Recommendation: render the figure in `--text`. Keep `--danger-text` only when it is negative, since a negative value is a real warning.
- Effort: XS

**UI-08: The same meaning is drawn in two different reds and greens on one card**

- Severity: Low
- Location: `drawPvA` :9480 fills bars with `--danger-text` / `--success-text`. `drawMonthlyTrend` :9626-9627 and the Trend legend :3020-3021 use `--danger` / `--success`.
- Evidence: in light, "over" on the Budget tab is `#C31111` and "expenses" on the Trend tab is `#EF4444`. "Under" is `#0A7451` and "income" is `#10B981`. Both panes are tabs of the same Home card. The `-text` tokens are tuned for text and are being used as bar fills.
- Impact: small, but it weakens the colour-to-meaning link that UI-02 and UI-03 already strain.
- Recommendation: use the fill tokens (`--danger`, `--success`) for all bars and keep the `-text` tokens for words.
- Effort: XS

**UI-09: The hero card turns muddy in pastel-brand themes**

- Severity: Low
- Location: `.hero-kpi` :977-979. Per-theme `--hero-scrim`: flamingo 0.37, nord 0.36, owl 0.34. Sheets: `split-2.png`, `split-3.png`, `split-4.png`.
- Evidence:
  - flamingo: the gradient `#F97066` → `#FCA5A5` under a 0.37 black scrim comes out at about `#9D4740` → `#9F6868`, a brown-rose duller than the coral FAB and tab icons beside it.
  - nord comes out at about `#577B85` and owl at about `#81653F`, both grey-brown.
  - Contrast passes (the scrim exists for that), but the headline card becomes the dullest coloured element on Home. This confirms the orchestrator's observation 5.
- Impact: visual quality and hierarchy only. The figure is still the largest type and is legible.
- Recommendation: in these three themes, start the hero gradient from a deeper brand step (for example a `--hero-from` / `--hero-to` pair that defaults to `--primary` / `--primary-2`) so white clears 4.5:1 with a scrim near 0.22, instead of greying a pastel. Re-measure with the existing `--on-hero` rows.
- Effort: S

**UI-10: Daily totals are always red, including in Planned mode**

- Severity: Low
- Location: `drawDailyStackedChart`, :9999 (`val-exp` with no mode check). `.val-exp` :2569.
- Evidence: every day's total under the stacked chart renders in `--danger-text` (`daily-*.png`, "₮527K" in red), whether the mode is Actual or Planned. Red here means "an expense", while on the Budget tab red means "over plan".
- Impact: a planned day's total reads as a warning. This is one more case of red carrying two meanings.
- Recommendation: use `--text-2` for daily totals and keep red for comparisons against a plan.
- Effort: XS

**UI-11: The donut legend percentage wraps onto its own line at 360 px**

- Severity: Low
- Location: `.legend .row` :1520 (`flex-wrap: wrap`), `drawDonut` legend markup. Sheets: all four `split-*.png`.
- Evidence: in all 16 themes, "(84%)" drops onto a second line under "Needs" while the amount stays on the first, so each legend row is two lines and the percentage sits away from its label.
- Impact: harder to scan, and it pushes the Savings row below the fold.
- Recommendation: put the percentage after the label ("Needs · 84 %") and leave the amount right-aligned. The existing `min-width: 0` overflow guard stays.
- Effort: XS

### Review areas outside the finding list

- **Layout and Hierarchy:** the hero leads every Home pane. Only UI-07 and UI-09 affect hierarchy through colour.
- **Navigation:** not assessed; outside the colour scope.
- **Typography:** no colour-related issues; type hierarchy on these screens is consistent.
- **Colour and Theme:** UI-01 to UI-10.
- **Spacing / Cards:** not assessed beyond UI-11; outside the scope.
- **Mobile:** the daily chart scrolls inside its own container by design, and the page itself does not scroll sideways in any sheet. Touch targets were not assessed.
- **Accessibility:** text contrast passes as measured. Graphics contrast fails per UI-01, UI-05 and UI-06. The colour-only key is UI-01.
- **States:** not assessed; outside the scope.
- **Numbers and Formatting:** currency is consistent across these screens (₮, thousands separators, compact K/M on axes). The sign is unambiguous.

### Orchestrator's first-look observations, confirmed or rejected

1. Category colours are fixed, bright on muted grounds, and include state hues: **confirmed** (UI-01).
2. Colours follow list position and repeat after twelve: **confirmed** (UI-01). Deleting a category also shifts colours.
3. Planned and Actual are hard to tell apart in flamingo and sepia: **confirmed and wider**. It is also true in rose, and in mint, forest, peacock and oled for the "under" case (UI-02).
4. The donut uses state colours, with Needs red in flamingo: **confirmed**, also in rose and sepia (UI-03).
5. The flamingo hero is muddy: **confirmed**, also nord and owl. Low severity (UI-09).
6. Home has too many coloured elements: **mostly rejected**. The icon tints are low-alpha. The one real problem is the green derived figure (UI-07).

## Quick Wins

- **UI-07** (XS, Medium): one line of colour removes the visual endorsement of a figure the app itself says must not be read as spendable.
- **UI-04** (S, Medium): checking the group on the Planned vs Actual rows stops the app showing saving as overspending.
- **UI-06** (S, Medium): adding the measurement rows and the one-meaning check makes the remaining fixes verifiable, so they cannot regress.
- **UI-05 (a)** (S, Medium): building the legend from the cells' own ramp makes the legend match the grid.
- **UI-03** (S once UI-01 lands, Medium): pointing the three group tokens at chart slots takes value judgements out of the donut.

## Estimated UX Impact

Once UI-01 and UI-02 are fixed, colour gets a single, stable meaning on every chart in every theme:
- green and red mean only income or under plan, and expense or over plan;
- the brand colour means only "this app" and "the current selection";
- each category keeps one colour for life, whatever the list order.

A user can then read the Budget pane, the heatmap and the hero at a glance in all 16 themes, not just the nine where the brand happens to avoid red and green. The Analytics stacked chart becomes readable for colour-blind users and on muted themes. Together with UI-06, the next theme added inherits these guarantees through the check tool rather than through someone remembering to look.

Files: `D:/3_Claude/PowerApps-live/expense-pwa/index.html`, `D:/3_Claude/PowerApps-live/tools/check-contrast.mjs`, `D:/3_Claude/PowerApps-live/reports/themes-colours/`. Per your instructions this review was read-only and I did not write it to disk; the intended save path is `D:/3_Claude/PowerApps-live/reports/ui-review-colours.md`.
