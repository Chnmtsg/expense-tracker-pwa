# Review request: the app's colour system — charts, text and the colours that carry meaning

2026-10-20. Owner's words, after v38 went live: "review the colours". Before
that: "What do you think about colour combination of app graph, text and
other related things?"

Live is v38 (branch `live-v35`, `D:/3_Claude/PowerApps-live`). The theme
review that preceded this one (`reports/chief-architect-themes-latest.md`)
covered the quick add and Debts screens; this one covers everything that
draws with colour: Home's charts, Insights, and the tokens behind them.

## Evidence: every theme, five screens

`reports/themes-colours/`, 20 PNG sheets, 4 themes each, 360×760 per panel,
six months of realistic data, each theme in its own browser:

| Screen | Sheets |
|---|---|
| Home, Split pane (Needs / Wants / Savings donut, KPI tiles, hero) | `split-1.png` … `split-4.png` |
| Home, Budget pane (Planned vs Actual) | `plan-1.png` … `plan-4.png` |
| Home, Trend pane (All time, income vs expenses by month) | `trend-1.png` … `trend-4.png` |
| Insights, category chips | `insights-1.png` … `insights-4.png` |
| Insights, daily stacked chart and calendar | `daily-1.png` … `daily-4.png` |

Sheet order: 1 = light, mint, sepia, ocean; 2 = forest, rose, flamingo,
kingfisher; 3 = dark, slate, nord, midnight; 4 = peacock, gold, owl, oled.

## What was observed before this review (the orchestrator's first look; to be confirmed or rejected)

1. `CATEGORY_COLORS` (index.html, Analytics section) is twelve fixed hex
   values used in every theme; on muted themes (nord, sepia, gold) they are
   bright against pastel grounds; the set includes the red and green the app
   uses for over-budget / expenses and income.
2. `categoryColor(id)` is by list position, so reordering categories in
   Settings recolours them; a thirteenth repeats the first.
3. Planned vs Actual draws Planned in the theme colour and Actual red when
   over: in flamingo (coral vs dark red) and sepia (brown vs red-brown) the
   two bars are hard to tell apart.
4. The Needs / Wants / Savings donut uses `--needs`, `--wants`, `--savings`:
   Wants is the warning amber, Savings the income green, and in flamingo
   Needs is red.
5. Flamingo's hero (Left over) reads muddy brown-rose under its scrim.
6. Home carries many coloured elements at once (hero, three tinted KPI icon
   tiles, a green figure, the chart).

`tools/check-contrast.mjs` measures text and a few graphics against grounds
(16 themes × 38 pairs, 0 below); it does not measure chart series against
each other or against their grounds, and nothing checks that a colour keeps
one meaning.

## Questions

1. Which colour problems are real, in which themes, and how serious?
2. What is the smallest sound colour system for charts: theme-aware category
   colours, stable per category, kept clear of the state colours?
3. Planned vs Actual and the donut: what should each draw in?
4. What should be measured so this does not regress?
