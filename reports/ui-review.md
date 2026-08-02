# UI Review — expense-pwa (Round 5)

## Executive Summary

Round 4's work landed and it landed correctly: the accent-fill and `--primary`-as-foreground contrast failures are genuinely closed, the Salary and Analytics layout breaks are fixed, the header now names the screen and the period you are actually on, the Expenses tab means Expenses, the Analytics chart keeps its scroll position and scrolls its answer into view, and the tag and Kingfisher contrast findings measure clean on re-derivation. `tools/check-contrast.mjs` is a real improvement — it turned an unverifiable "all 16 themes" comment into 432 measurements. The single biggest remaining problem is that **the pair table decides what gets measured, and three painted surfaces that carry text were left out of it**: the Financial Advisor badge (which paints `--on-accent` on `--success`/`--warning`/`--danger`, and is why `--on-warning` is declared sixteen times and used nowhere), the hero card's caption (whose `opacity: .95` was not folded into the scrim derivation), and the calendar heat cells (whose text sits on a `--primary` tint at up to 95%). All three fail WCAG AA in the default theme or in most themes. Everything else is polish, plus one fourth instance of the `width: 100%` button defect the stylesheet now asserts is closed.

## Overall Score

**88 / 100.** No Critical and no High findings, which by the bands would place this at 90+. It sits just below "production ready" because four of the findings are measurable WCAG AA failures — three of them reachable on the default theme's first two screens — discovered one full round after a dedicated contrast pass, and because `button.primary/secondary/danger { width: 100% }` has now produced a defect in a fourth location under a comment stating there were three.

## Strengths

- **The contrast predicate is the right shape.** `tools/check-contrast.mjs` measures rather than asserts, models the `:root` cascade into theme blocks, resolves `var()` aliases, and composites the per-theme scrim. It caught its own author's mistake (measuring `--on-accent` instead of `--on-hero` over the gradient) and recorded why. Every finding below is a *gap in the table*, not a failure of the mechanism.
- **Round-4 fixes verified individually.** `#sHistory`/`#dayDetailClose`/`#settingsThemeBtn` set their own width (index.html:936); `navigate('dashboard')` replaces the bare `renderDashboard()` at init (7325); the `#hdrSub` write is guarded by the active-screen check (5474); the Expenses tab resets `expMode` (3952); `drawDailyStackedChart` saves and restores `scrollLeft` (6035, 6044) and scrolls the day-detail card into view only on opening (6057); the three `*-text` tag tokens re-measure at 4.60–4.64:1 against the composited 15% tint, and Kingfisher's `--text-2` at 4.63:1 on `--surface-2`.
- **States, modals and formatting remain complete.** Every list has both an empty and a filtered-empty state, every destructive action is confirmed, the data-error banner now rewrites all three of its claims so `reportFatal()` no longer says data could not be read when it was read fine (7294–7296), and `savedToast` covers every mutation except the two reorder handlers.

## Findings

---

**UI-01 — The Financial Advisor badge paints `--on-accent` on three status fills; `--on-warning` is declared sixteen times and used nowhere**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `.advisor-count` 1353–1359, `renderAdvisor()` 5416–5419, badge markup 1696; token declarations at 42, 133, 165, 200, 235, 270, 305, 342, 380, 418, 456, 492, 530, 566, 604, 642; `tools/check-contrast.mjs:57`
- **Evidence:** `.advisor-count` sets `color: var(--on-accent)` once and then overrides only the *background* three times: `.good → var(--success)`, `.warning → var(--warning)`, `.critical → var(--danger)`. `renderAdvisor()` always writes `badge.className = 'advisor-count ' + worst` where `worst` is one of those three, so the `--primary` fill the colour was chosen against is never actually painted. In the four themes whose `--on-accent` is `#FFFFFF` (light — the default — dark, sepia, rose), 10 of the 12 resulting combinations fail: light `#fff` on `#10B981` = **2.32:1**, on `#F59E0B` = **2.15:1**, on `#EF4444` = **3.76:1**; dark 1.92 / 1.67 / 2.77; sepia 3.09 / 3.19; rose 3.77 / 2.15. The text is 11px at weight 700, so the threshold is 4.5:1. Grepping `var(--on-warning)` across the file returns **zero** call sites — the token exists only to be measured by the predicate, whose own note for it reads `'advisor warning badge'`, which is precisely the rule that does not use it.
- **Impact:** On a new install (light theme), the count on the Dashboard's Financial Advisor card — the second card on the app's landing screen — is illegible. The count itself is recoverable by reading the tips below, which is why this is not higher, but a badge nobody can read is a badge that should not be there.
- **Recommendation:** Give each state its own foreground: `.advisor-count.good { color: var(--on-success) }`, `.warning { color: var(--on-warning) }`, `.critical { color: var(--on-danger) }`, leaving the base rule's `--on-accent` for the `--primary` default. Then the three existing pair-table rows already cover it.
- **Effort:** XS

---

**UI-02 — `.hero-label`'s `opacity: .95` puts the Dashboard hero caption below AA in twelve of sixteen themes**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `.hero-label` 841–845, scrim derivation comment 811–823, `--hero-scrim` per theme (202, 237, 307, 344, 382, 420, 458, 494, 532, 568, 606, 644); `tools/check-contrast.mjs:67–68`
- **Evidence:** The scrim alphas were derived as "the alpha at which **white** clears 4.5:1 against both gradient stops", and the predicate measures `--on-hero` (`#FFFFFF`) at full strength. `.hero-label` then renders at `opacity: .95`, which composites to 95% white over the scrimmed stop — a step the derivation did not account for. Against the governing light stop: slate falls from 4.54:1 to **4.27:1**, gold from 4.55 to **4.27**, forest from 4.52 to **4.24**. Every theme whose scrim was *derived* rather than floored at `.22` — ocean, forest, midnight, slate, oled, nord, mint, peacock, flamingo, kingfisher, owl, gold, i.e. twelve of sixteen — lands in the same 4.2–4.3 band. The four themes still at the `.22` floor (light, dark, sepia, rose) have enough margin and are unaffected. `.hero-label` is 13px semibold, so 4.5:1 applies.
- **Impact:** "NET BALANCE" is the only thing on the card that says what the 36px figure below it *is*, and it is the lowest-contrast text on the app's most-looked-at surface. The margin is small (5%), but the whole point of deriving the alphas was that this class of claim stops being approximate.
- **Recommendation:** Remove `opacity: .95` from `.hero-label` — the scrim already provides the visual separation the opacity was imitating — or, if the softer caption is wanted, add `{ fg: 'on-hero', bg: 'primary-2', over: {…}, min: 4.74 }` and re-derive the twelve alphas so 95% white clears 4.5. Removing the opacity is the smaller change and needs no re-derivation.
- **Effort:** XS

---

**UI-03 — Calendar heat cells print their text over a `--primary` tint that nothing measures; the hottest cells are the least readable**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `.cal-cell::before` 1438–1443, `.cal-cell .cal-day` 1448, `.cal-cell .cal-val` 1449, intensity computation `renderCalendar()` 5878
- **Evidence:** `renderCalendar()` sets `--intensity` to `total / axisMax * 0.95`, and `.cal-cell::before` fills the cell with `var(--primary)` at that opacity. The day number uses `--text-2` and the amount uses `--text`; neither pair is in the contrast table, which only ever measures those tokens against `--surface`, `--surface-2` and `--bg`. In the default theme, composited against `--surface-2`: at 95% intensity the day number measures **1.53:1** and the amount **3.4:1**; the day number drops below 4.5:1 at roughly 45% intensity and the amount at roughly 83%. In the dark theme the day number measures **3.59:1** at full intensity. Both are 11px at weight 700, so 4.5:1 applies. A typical month produces several cells above 45% of its peak.
- **Impact:** The heatmap exists to answer "which days did I spend most", and the cells holding the answer are the ones whose date and figure cannot be read. The colour ramp still conveys the ranking and the `aria-label`/`title` carry both values, so there is a workaround — tap the cell and read the day-detail card — but the visualisation stops doing its own job at exactly the point it matters.
- **Recommendation:** Cap the ramp where the text still clears AA rather than at 0.95 — with `--text` on the value and `--text-2` on the day number, roughly 0.40 in the light themes — or switch the cell text to a token derived against the tinted ground. Either way, add `{ fg: 'text-2', bg: 'primary', over: { colour: <surface-2>, alpha: <cap> } }`-shaped rows so the cap is held by the predicate rather than by a comment.
- **Effort:** S

---

**UI-04 — A fourth button sits beside another element without setting its width, under a comment stating there were three**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — shared rule and its convention comment 914–936, override list 936, `.notif-item .notif-actions` 755, offending markup `openNotifModal()` 3573
- **Evidence:** The comment at 918–928 reads "Three places got this wrong; each now sets its own width, below", and 936 lists `#sHistory, #dayDetailClose, #settingsThemeBtn`. A fourth exists: a goal-contribution reminder renders two buttons into `.notif-actions` (`display: flex; gap: 6px; flex-wrap: wrap`) —

  ```html
  <button data-log-goalrec="…" data-next-date="…">✓ Add ₮25,000</button>
  <button class="secondary" data-goal-add="…">Custom amount</button>
  ```

  The first carries no class, so the shared rule does not reach it and it sizes to its label. The second matches `button.secondary` and inherits `width: 100%` and `margin-top: var(--s3)`; `.notif-item .notif-actions button.secondary` (765) overrides only background, colour and border. With `flex-wrap: wrap`, "Custom amount" therefore wraps onto its own line at the full width of the notification row.
- **Impact:** In the Reminders sheet — reachable from the bell on every screen — the secondary action is the largest element in the row and the primary "✓ Add ₮X" sits above it at a third of the width. The visual hierarchy of the pair is inverted. More importantly the stylesheet now carries a swept-class claim ("three places") that is false, which is the same failure mode `check-contrast.mjs` was built to end for colour.
- **Recommendation:** Add `class="secondary"`'s sibling to the override list — either give the markup at 3573 an explicit `style="flex:1"` alongside a matching one on the button at 3572, or extend line 936. Then correct the count in the comment, or replace the count with "each sibling-in-a-row sets its own width" so the claim cannot go stale again.
- **Effort:** XS

---

**UI-05 — Calendar cells are still under 44px on 360px and 375px phones; the icon grid has a gap band below 44px**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `.cal-grid` 1426 and its comment 1419–1425, `.icon-grid` breakpoints 1332–1334, date-picker modal 2265
- **Evidence:** The gap was reduced 4px → 2px as recommended, but the second half of the recommendation — dropping the calendar card's horizontal padding to `--s3` — was not applied, and the comment at 1424 claims "44.6px at 360px". Measured with `main` padding 16px, card border 1px and card padding `--s4` on each side: at a 360px viewport the cell is (360 − 32 − 2 − 32 − 12) ÷ 7 = **40.3px**; at 375px (iPhone SE/12 mini/13 mini) **42.4px**; at 390px 44.6px, which is where the comment's figure comes from. The date picker, which was the riskier of the two, is now fine: its 380px-capped modal yields 46.9px at any viewport ≥380px and 44.0px at 360px. The goal icon grid drops to 5 columns only at ≤360px, so between 361px and ~385px it renders 6 columns at 40.8–43.9px.
- **Impact:** A mis-tap on the heatmap costs a re-tap and nothing else, which is why this is Low now that the date picker — where a mis-tap writes a wrong goal deadline — is clear.
- **Recommendation:** Apply the other half of the original fix: `padding-left/right: var(--s3)` on the calendar card, which yields 44.6px at 360px. Move the icon grid's 5-column breakpoint from `max-width: 360px` to `max-width: 400px`. Correct the comment at 1424 to the width the code actually produces.
- **Effort:** S

---

**UI-06 — Two painted states carry text and are outside the pair table: the primary button's hover fill and the hero card's highlight**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `button.primary:hover` 938, `.goal-actions button.goal-add:hover` 1301, `.swap-btn:hover` 1520, `.hero-kpi::before` 833–838; `tools/check-contrast.mjs:54, 67–68`
- **Evidence:** (a) The table measures `--on-accent` against `--primary` only. All three hover rules repaint the fill to `--primary-2`, which is lighter in every theme. In the four themes whose `--on-accent` is white, the label on a hovered primary button measures light **3.68:1**, rose **3.53:1**, sepia **3.19:1**, dark 3.68:1 — against 4.5:1 required. (b) `.hero-kpi::before` paints a 140px circle of `rgba(255,255,255,.07)` over the finished background, i.e. *above* the scrim the alphas were derived against. In the top-right region it lifts the ground by roughly 0.5 ratio points: slate's light stop goes from 4.54:1 to **3.99:1**. `.hero-trend` is 13px and sits at y ≈ 95–113px, inside the circle's 0–120px band; at a 320–360px viewport the circle covers the right 40% of the card, so a long "↓ Over budget by ₮1,234,567" reaches it. `.salary-summary` uses the same gradient and has no `::before`, so only the Dashboard hero is affected.
- **Impact:** Hover is a pointer-only, transient state on a mobile-first app, and the hero case needs a long value on a narrow screen — narrow enough that neither is a normal-use failure. Both are the same root cause as UI-01: the table is the contract, and two surfaces that carry text are not in it.
- **Recommendation:** Add `{ fg: 'on-accent', bg: 'primary-2', min: 4.5 }` to the pair table and let it force whatever the four themes need. Move `.hero-kpi::before` behind the scrim (paint it as a third background layer under the scrim gradient rather than as a pseudo-element above it), which removes it from the contrast question entirely.
- **Effort:** S

---

**UI-07 — Category and income-type reordering still has no keyboard path**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `initCategoryReorder()` 4712–4768, `initIncomeTypeReorder()` 4598–4643, hints at 4670 and 4957
- **Evidence:** Both are implemented entirely on `pointerdown`/`pointermove`/`pointerup`. A grep for `ArrowUp`, `ArrowDown`, `data-up`/`data-down` or any move control across the file returns nothing. The hints read "Press and drag a row up or down to reorder".
- **Impact:** Keyboard-only and switch users cannot change the order. It is not cosmetic: `categoryColor()` assigns Analytics chart colours by array index, so category order sets the palette as well as the dropdown order.
- **Recommendation:** Add ↑/↓ buttons to each row beside the existing edit/delete pair, driving the same splice the drag handler uses. The pointer gesture stays as the shortcut.
- **Effort:** M

---

**UI-08 — The goal icon picker is now pointer-only**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `wireIconGrid()` 6703–6707, grid markup 1971 and 6884
- **Evidence:** The round-4 fix removed the `focus` listener that inserted 32 tab stops and replaced it with `input.addEventListener('click', open)` alone. `click` does not fire on a text input from Enter, and Space is consumed by the field, so there is now no keyboard route to the grid; while closed it is `display: none`, so its 32 buttons are also out of the tab order. The comment at 6704–6707 documents the removal but not the consequence.
- **Impact:** A keyboard user can still type an emoji into the field directly and the form defaults to 🎯, so the goal can be created — the suggested-icon feature is simply unavailable without a pointer. The tab-stop problem the change fixed was the worse of the two.
- **Recommendation:** Add a `keydown` handler for Enter/Space on the icon input, exactly as `wireDateField()` (6416–6421) already does for the five readonly date fields, and give the grid a route back out (Escape closes, focus returns to the input).
- **Effort:** XS

---

**UI-09 — The two reorder handlers still discard `save()`'s result**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:4636` and `4760`
- **Evidence:** `db.incomeTypes.splice(…); save(); renderSettings();` and `db.categories.splice(…); save(); renderSettings();` — the return value is dropped and no `savedToast` fires. Round 4 flagged these alongside the category delete; the delete was fixed (4986–4987) and these two were not. Every other mutation in the file follows `const ok = save(); savedToast(ok, '…')`.
- **Impact:** A failed write during a reorder is silent: the list renders in the new order from memory and reverts on reload. Category order determines the Analytics palette, so the user sees a colour change that does not survive a restart, with nothing having said so.
- **Recommendation:** `const ok = save(); renderSettings(); savedToast(ok, 'Order saved');` in both handlers.
- **Effort:** XS

---

**UI-10 — Eight dark themes ship and none is ever chosen automatically**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `applyTheme(db.settings.theme || 'light')` 3865, defaults at 2562 and 2590
- **Evidence:** A fresh database sets `theme: 'light'` and `applyTheme` falls back to `'light'`. There is no `@media (prefers-color-scheme: dark)` rule and no `matchMedia` read anywhere in the file.
- **Impact:** A user whose phone is in dark mode gets a full-brightness white app on first launch and has to find the unlabelled palette glyph in the header, or Settings → Appearance, to change it.
- **Recommendation:** In `load()`'s fresh-database branch only, default `theme` to `'dark'` when `matchMedia('(prefers-color-scheme: dark)').matches`. An explicitly stored choice stays authoritative.
- **Effort:** S

---

**UI-11 — Three declared token scales are bypassed throughout**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — declarations at 77 (spacing), 82–83 (radius), 88–94 (type); violations throughout
- **Evidence:** Reported once here; it surfaces under Typography, Spacing and Cards.
  - **Type:** 72 hardcoded `font-size: Npx` declarations across 13 distinct values (11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 32). Adding `--t-display` and `--t-hero` removed 30px and 36px from the list; the two fractional sizes remain, and `.tip-title` 13.5px (1371) sits directly above `.tip-message` 12.5px (1372) beside `--t-sm` 13px text in the same component.
  - **Radius:** the comment at 82 says "3 values only" and `--r-bar` was added as a fourth. Nine literal values are still in use: 2, 4, 5, 6, 8, 10, 12, 16, 999.
  - **Spacing:** the comment at 76 says "use ONLY these values" (4/8/12/16/24/32/48). Roughly 69 literal declarations use off-scale values — 2, 3, 6, 10, 11, 14, 18, 20px.
  - **Cards:** `.card` 16px, `.advisor-card` 14px 16px, `#dailyChipsCard` 12px 16px, `.stat-tile` 12px, `.conv-result` 18px 14px, `.goal-card` 16px, `.modal` 20px. `.list-item.dragging` (1015) hardcodes `0 12px 28px rgba(0,0,0,.25)` instead of `--e3`.
- **Impact:** No single value is wrong. Adjacent cards on the Dashboard have visibly different corner softness and inset, and each new component inherits whichever neighbour it was pasted from. This is the gap between the stylesheet's stated system and its actual one.
- **Recommendation:** Snap in place, no redesign: 12.5/13.5 → `--t-sm`; 10px radius → `--r-md`, 5/6px → `--r-sm`; 6px → `--s2` or `--s1`, 10/14px → `--s3`/`--s4`, 18/20px → `--s4`/`--s5`; `.list-item.dragging` → `--e3`. Where a value is deliberate (`.advisor-card`'s tighter inset), give it a documented `.card--tight` modifier rather than a literal.
- **Effort:** M

---

**UI-12 — Theme swatches carry no accessible selected state**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `openThemePicker()` 3869–3874 and 3882–3883, `.theme-swatch.active` 688
- **Evidence:** The sixteen swatches are `<button>` elements with no `aria-pressed`, `aria-current` or `role="radio"`, and the class swap at 3882–3883 changes only the CSS class. The visible difference between active and inactive is `border-color: var(--primary)` plus a 15%-alpha halo — no mark, no label, no text.
- **Impact:** A screen-reader user cannot tell which of sixteen themes is currently applied. Sighted users get immediate confirmation from the whole app repainting, and the border does carry a lightness difference as well as hue, so the visual side is adequate; the programmatic side is missing.
- **Recommendation:** Add `aria-pressed="${id === current}"` to the swatch markup and keep it in sync in the click handler alongside the class swap. A small ✓ in the active swatch's preview would also remove the last colour-only distinction.
- **Effort:** XS

---

**UI-13 — The iOS home-screen icon is an SVG, which iOS does not accept**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:35`, `expense-pwa/manifest.json:11–24`
- **Evidence:** `<link rel="apple-touch-icon" href="icon.svg">` and both manifest icon entries are `"type": "image/svg+xml"`. iOS Safari requires PNG for `apple-touch-icon`; an SVG is ignored and the home-screen tile falls back to a screenshot of the page. The app targets this platform explicitly — the Storage Status card names iOS Safari (2074) and the About card tells users to install to the home screen (2097).
- **Impact:** On iOS the installed app has no icon of its own, on the platform where installing is the app's own recommended mitigation against storage eviction. It does not block installation.
- **Recommendation:** Export 180×180, 192×192 and 512×512 PNGs from the existing SVGs, point `apple-touch-icon` at the 180px one and add the two PNG entries to the manifest alongside the SVGs. Add them to `sw.js`'s `ASSETS` list.
- **Effort:** S

---

**UI-14 — The focus ring on calendar cells is overdrawn on two sides since the gap change**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `button:focus-visible` 957–959, `.cal-grid` gap 1426, `.cal-cell` `position: relative` 1435, `.cal-cell.selected` 1447
- **Evidence:** The focus ring is `outline: 2px solid` at `outline-offset: 2px`, so it occupies the band 2–4px outside the cell's border box. The grid gap is now **2px**, so that entire band falls inside the neighbouring cells' boxes. `.cal-cell` is `position: relative`, so later siblings paint above earlier ones: the right and bottom segments of a focused interior cell's ring are painted over by its neighbours' backgrounds, leaving a top-and-left L. At the previous 4px gap the ring sat exactly flush in the gap. `.cal-cell.selected`'s `0 0 0 3px` halo is affected the same way. Both the Analytics heatmap and the date-picker grid use `.cal-grid`.
- **Impact:** The keyboard indicator on the date picker — the only way to set a goal deadline or a recurring end date — is half-drawn. It remains partially visible, so this is a degradation rather than a loss.
- **Recommendation:** Give `.cal-cell:focus-visible` `outline-offset: -2px` so the ring draws inside the cell, or raise the focused cell with `z-index: 2` on `:focus-visible`. Either is one declaration.
- **Effort:** XS

---

## Clean Areas

- **Navigation** — all eight destinations (Home, Income, Expenses, Analytics, Budget Planning, Savings Goals, Salary Calculator, Settings) are reachable by name; `aria-current="page"` tracks the active tab and the More pill; the active tab is marked by colour *and* stroke weight; every modal has a close control, a Cancel, backdrop dismissal, Escape and Android Back, all routed through one `dismissModal()` (3750).
- **States** — every list has both an empty and a filtered-empty state with an escape hatch, every async path has a status line (`convStatus` 6338–6349, `storageStatus` 3114–3127, import 5007–5049), every destructive action is confirmed and Reset is double-confirmed, and the import path reports its own outcome at each step.
- **Numbers and formatting** — `fmt()` puts the sign outside the symbol (3143), `fmtCurrency()` follows the same rule (6290), `fmtCompact()` handles negatives by magnitude, and the "Left After Plan" tile prints an em-dash plus "No plan set" rather than ₮0.
- **Layout and hierarchy** — the Dashboard leads with Net Balance and the three-tile strip; the custom date fields stay hidden until the preset is Custom; the Salary screen no longer duplicates four figures across two cards.
- **Form labelling** — the round-4 gaps are closed: `aria-label` on both converter currency buttons (2241, 2250), on the currency search (2225) and on the three quick-amount edit inputs (6811); the two dropped `<label for>`-on-`<button>` associations are now `.group-label` spans.
- **Colour as sole carrier of meaning** — excluded chips are dashed and struck through as well as dimmed, trend labels and legend carry ↑/↓, goal deadline pills print "Overdue 5d", chart columns and calendar cells carry `aria-pressed` and dated `aria-label`s. The only remaining instance is UI-12.
- **Horizontal scrolling** — none at page level; the only `overflow-x: auto` is `.trend-wrap`, which is the intended chart scroller.

## Quick Wins

- **UI-01** — three `color:` declarations; the pair table already covers the result, and it removes a token that is currently declared sixteen times and used zero times.
- **UI-02** — delete one `opacity` declaration; restores twelve themes to the 4.5:1 the scrim alphas were derived for.
- **UI-04** — one width override; removes the fourth instance of a defect the stylesheet asserts is closed, and lets the comment's claim be made true.
- **UI-03** — one cap on the heat ramp plus one pair-table row; makes the busiest days on the heatmap readable in the default theme.

## Estimated UX Impact

There are no Critical or High findings this round, so nothing changes about whether the app can be shipped. What the Medium set changes is whether the default theme is fully legible. Today a new user on the default light theme meets three pieces of text they cannot read: the advisor count on the Dashboard's second card, the "NET BALANCE" caption above the app's headline figure in twelve of sixteen themes, and the date and amount inside the highest-spending cells of the Analytics heatmap — which are the cells the heatmap exists to draw attention to. Fixing UI-01 through UI-03 means every figure the app puts on screen can actually be read on the theme it ships with, and — more durably — it puts the three surfaces into `check-contrast.mjs`, so the next surface that carries text on a fill is measured rather than assumed.

UI-04 restores the intended weight of the two actions in the goal-contribution reminder, and, by correcting the comment's count, removes the second false swept-class claim this project has shipped in the stylesheet. The Low set is polish, with two exceptions worth scheduling: UI-07 leaves keyboard users unable to reorder categories, which silently sets the Analytics palette, and UI-08 makes the goal icon picker pointer-only — a regression introduced by the fix for last round's tab-stop problem, and the reason regressions from fixes stay in scope.
