# UI Review — expense-pwa (Round 4)

## Executive Summary

The application is structurally sound and the round-3 work landed largely as described: navigation now reaches all seven named modules plus Goals, every list has a distinct "empty" and "filtered-empty" state, every destructive action is confirmed, modals trap focus and honour Escape and Android Back, and colour is no longer the sole carrier of meaning anywhere I could find. The remaining problems are concentrated in one place: **the contrast work fixed text-on-surface and stopped there.** White text on the `--primary`/`--danger`/`--success` fills — which is the label on every primary button, the data-loss banner, the reminder badge and the hero card — was never measured, and it fails WCAG AA in the default theme for danger fills and in 13 of 16 themes for the primary button, bottoming out at 2.00:1 on Nord. A second, unrelated defect compounds the impression: the shared button rule carries `width: 100%`, so the newly added Salary "History" button collapses the primary Save action beside it to roughly 87px. Everything else is polish.

## Overall Score

**73 / 100** — *Usable but fragile.* Three High findings, all live in normal use: two systemic contrast failures that the round-3 token work did not cover, and one layout break on the Salary screen introduced by this round's changes. No Critical findings; no wrong figures, no data loss, no unreachable module.

## Strengths

- **States are genuinely complete.** Every list has an empty state, the filtered-empty state distinguishes "you have none" from "none in this period" and offers a real escape hatch (`filteredEmptyState`, index.html:6886), failed writes raise a persistent banner rather than a toast, and the import path reports its own outcome at each step instead of one catch-all "Invalid file".
- **Colour is never the only carrier of meaning.** Monthly Trend labels and legend now carry ↑/↓ (index.html:5399), excluded chips are dashed + struck through as well as dimmed (index.html:1066), calendar heat cells print their value, goal deadline pills print "Overdue 5d" rather than relying on red.
- **Keyboard and focus handling is above average for a single-file app.** The focus ring is a solid `--text` outline with an offset that cannot fail by construction, `wireDateField()` makes the five readonly date fields operable by Enter/Space, and chart columns and calendar cells are real `<button>`s with `aria-pressed` and dated `aria-label`s.
- **The "Left After Plan" tile is now honest.** The em-dash plus "No plan set" removes the previous claim that a user with no budget had ₮0 remaining.

## Findings

---

**UI-01 — White text on accent fills and on the hero gradient fails WCAG AA in most themes**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — `button.primary` (792), `.alert-banner` (1403–1412), `.icon-btn .badge` (611–619), `.advisor-count` (1206–1212), `.goal-actions button.goal-add` (1151), `.qa-save` (1256), `.swap-btn` (1359), `.notif-item .notif-actions button` (633), `.hero-kpi` / `.hero-label` / `.hero-trend` (687–722), `.salary-summary` (1303–1318 and the 12px figures row at 1572)
- **Evidence:** The six new `*-text` tokens per theme correct text *on surfaces*; the comment at line 44 states the base semantic tokens are "retained for fills". Those fills carry white text, and it was not measured. `#fff` on `var(--primary)`: Nord `#88C0D0` = **2.00:1**, Slate `#38BDF8` = 2.14:1, Gold `#F59E0B` = 2.15:1, Peacock 2.49:1, OLED 2.54:1, Owl 2.60:1, Midnight 2.72:1, Kingfisher 2.74:1, Flamingo 2.79:1, Mint 3.30:1, Ocean 3.68:1, **Dark 3.68:1**, Forest 3.77:1. Only Light (5.17:1), Sepia (5.02:1) and Rose (4.60:1) pass. `#fff` on `var(--danger)` fails in the **default** theme too: `#EF4444` = 3.76:1, and `#F87171` in the dark themes = 2.77:1 — this is the colour of the "Your saved data could not be read" banner and the reminder badge. `#fff` on `var(--success)` `#10B981` = 2.54:1 (the ✓ Save button on quick amounts).
  The hero gradient has the same problem by a different route. The comment at lines 687–695 claims the 22% black scrim reaches 4.5:1 "in all 16 themes"; measured against the `--primary-2` stop it does not. After the scrim: Slate 2.73:1, Gold 2.74:1, Midnight 3.00:1, Peacock 3.05:1, Flamingo 3.08:1, OLED 3.13:1, Kingfisher 3.34:1, Nord 3.36:1, Owl 3.42:1, Mint 3.66:1, Ocean 3.87:1, Forest 4.01:1. `.hero-label` and `.hero-trend` are 13px, so they need 4.5:1; the 36px `.hero-value` needs 3:1 and misses it in Slate, Gold, Midnight and Peacock. `.salary-summary` uses the identical gradient and adds a 12px line of Gross/SI/WHT figures on top of it.
- **Impact:** The label on the app's main call-to-action is illegible or near-illegible for low-vision users in 13 of 16 themes, and the most important message the app can display — the data-loss banner — fails in every theme including the default. Themes are not a hidden setting: they are offered from a header button and from a Settings card, so users will select these.
- **Recommendation:** Add one `--on-accent` text token per theme (`#fff` or `--text`, whichever measures ≥4.5:1 against that theme's `--primary`, with `--on-danger`/`--on-success` where the fill differs) and use it in place of the hardcoded `#fff`/`white` in the nine rules listed. For the two gradient cards, make the scrim a per-theme token (`--hero-scrim`) and set it to the opacity that brings the `--primary-2` stop to 4.5:1 against white. Do not change `--primary` itself — it measures correctly as an *accent* against every surface.
- **Effort:** M

---

**UI-02 — `--primary` is used directly as a text colour and has no AA-checked variant**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — `nav.tabbar button.active` (920), `.kpi.accent .value` (758), `.goal-numbers .saved` (1121), `.goal-pct` (1124), `.goal-meta-item.recurring` (1136), `.advisor-more` (1227), `.conv-val` (1338), `.barchart .col.selected .lbl` (1040), inline `color:var(--primary)` at 1780, 4245, 4250
- **Evidence:** Six `*-text` tokens were added per theme (success, danger, warning, needs, wants, savings). `--primary` was not one of them, and it is used as a foreground colour in eleven places. Against `--surface`: Kingfisher `#00ACC1` = **2.74:1**, Flamingo `#F97066` = 2.79:1, Mint `#16A34A` = 3.30:1, Ocean `#0891B2` on `#F0F9FF` = 3.45:1. All four fail AA for the 11px active tab label, the 13px "See all N tips →" button and the `.goal-meta-item` pill; Flamingo and Kingfisher also miss the 3:1 large-text threshold for the 22px `.goal-pct` and the 30px converter result.
- **Impact:** In those four themes the *only* indicator of which tab you are on is a label the user may not be able to read, and the goal completion percentage — the headline figure of the Goals module — is below large-text AA.
- **Recommendation:** Add `--primary-text` per theme alongside the six existing text tokens, computed against `--surface`/`--surface-2` exactly as they were, and switch the eleven foreground usages to it. Leave `--primary` as the fill and border colour.
- **Effort:** S

---

**UI-03 — The shared button rule sets `width: 100%`, so any button placed beside another element renders at the wrong size**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — rule at 783–791; broken instances at 1648–1651 (Salary screen), 1792 (Analytics day-detail header), 1856–1862 (Settings Appearance card), 1765–1768 (Analytics chip header)
- **Evidence:** `button.primary, button.secondary, button.danger { … width: 100%; … }`. Every other pair in the app gives both buttons `style="flex:1"`, which neutralises it. The three places that do not are broken:
  - **Salary screen** (this round's new History button): `<button class="primary" id="sSave" style="flex:1">💾 Save & Add as Income</button>` sits next to `<button class="secondary" id="sHistory">🕘 History</button>`. Save resolves to `flex-basis: 0`; History resolves to `flex-basis: 100%` of the row. With negative free space, flex-grow does not apply, so Save is frozen at its automatic minimum (min-content ≈ 87px, its label wrapping over three or four lines) while the secondary History button takes the remaining ~260px. The screen's primary action is the smaller, wrapped one.
  - **Analytics day detail**: `<button class="secondary chip-mini" id="dayDetailClose" style="float:right">Close</button>` is a float with `width: 100%`, so it occupies the full width of the `<h3>` and pushes the "Aug 1, 2026 — Actual" title onto the line below it.
  - **Settings → Appearance**: "Change theme" claims ~70% of the card row, squeezing the "Theme / Light" label to ~85px.
- **Impact:** The Salary Calculator — a named core module — presents a mangled primary action, and the Analytics day-detail card header renders visibly broken every time a day is selected. Both are new or newly reachable surfaces from this round, so they read as the freshest work in the app.
- **Recommendation:** Add `width: auto` (or `flex: 0 0 auto`) to `#sHistory` and `#dayDetailClose`, and `flex: 0 0 auto` to `#settingsThemeBtn`. Longer term, move `width: 100%` out of the shared rule onto a `.btn-block` modifier so the default is intrinsic width; that is the change that stops the next instance.
- **Effort:** XS

---

**UI-04 — Selecting a day on the Analytics chart loses the user's place and puts the answer off-screen**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `drawDailyStackedChart` (5722–5734), `#dayDetailCard` (1791), helper text at 1776
- **Evidence:** The helper under the chart reads "Tap a day to see its breakdown below." Tapping a column calls `renderDaily()`, which rewrites `#dailyStackChart.innerHTML` — destroying the `.trend-wrap` element and resetting its `scrollLeft` to 0. The chart is horizontally scrollable and up to 90 days wide, so tapping a recent day scrolls the chart back to the oldest day and the column the user just selected is no longer visible. The day-detail card that answers the tap is rendered *after* the full calendar heatmap card, roughly 600px further down; nothing scrolls it into view.
- **Impact:** The primary interaction of the Analytics module appears to do nothing and simultaneously throws away the scroll position the user worked to reach. Users will conclude the chart is not tappable.
- **Recommendation:** Capture `trendWrap.scrollLeft` before the innerHTML rewrite and restore it after, and call `dayDetailCard.scrollIntoView({ block: 'nearest' })` when a date is newly selected (not when it is cleared).
- **Effort:** XS

---

**UI-05 — The header does not reliably describe the screen you are on**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — static markup 1470, `navigate()` 3739–3740, `renderDashboard()` 5170
- **Evidence:** Two separate defects in one element.
  1. The `<h1>` ships as `<h1 id="hdrTitle">Dashboard</h1>`, and the init block (6946–6960) calls `renderDashboard()` but never `navigate('dashboard')`. On every cold start the header therefore reads **"Dashboard"** while the active tab reads **"Home"** — the exact mismatch the tab-bar comment at 1944–1949 says was removed. It self-corrects only after the user visits another tab and returns.
  2. `renderDashboard()` writes the *Dashboard's* date range into `#hdrSub`, and it is called from twelve non-Dashboard code paths (income add/delete, expense add/delete, edit-modal save, salary save, category edit, data-summary clear, import, reset, reminder conversion). Adding an income entry while the Income screen is filtered to "All Time" leaves the header reading `Income` / `2026-08-01 → 2026-08-31`, which is the Dashboard's filter, not Income's.
- **Impact:** The subtitle is the only place the app states which period the numbers on screen cover. After any add or delete it can state a period that has nothing to do with the visible list — on a finance screen that is a statement about the user's money that is not true.
- **Recommendation:** Call `navigate('dashboard')` in the init block instead of `renderDashboard()` directly, and guard the subtitle write: `if (document.getElementById('dashboard').classList.contains('active'))` before line 5170 — the same guard `setExpMode()` already uses at line 3929.
- **Effort:** XS

---

**UI-06 — The Expenses tab can land the user on "Budget Planning"**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — More-sheet handler 3716–3724, `navigate()` 3727–3747, `screenTitle()` 3699–3702
- **Evidence:** `expMode` is module state that nothing resets. Once the user has opened More → Budget Planning, pressing the **Expenses** tab renders the Planned list under the header **"Budget Planning"** for the rest of the session. The tab bar highlights "Expenses" while the header names a different module, and the user's actual spending is hidden behind a segmented control they did not touch.
- **Impact:** The tab bar is the primary navigation and is supposed to be the one control whose destination is unambiguous. This is the same label/destination mismatch that motivated removing the tab `aria-label`s, reintroduced through a different door.
- **Recommendation:** Have the Expenses tab reset the mode — `if (name === 'expenses' && !fromBudgetEntry) setExpMode('actual')` — or, if persisting the mode is intentional, leave the header as "Expenses" and let the segmented control alone carry the mode. Either is consistent; the current pairing is not.
- **Effort:** XS

---

**UI-07 — The declared type scale is bypassed 72 times across 15 sizes**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — token declaration at 78; violations throughout, e.g. 1165 (12.5px), 1224 (13.5px), 1119 (17px), 1362 (20px), 1338 (30px), 1118 (32px), 716 (36px)
- **Evidence:** `--t-micro: 11px; --t-sm: 13px; --t-body: 15px; --t-h3: 18px; --t-h2: 22px` declares five steps. There are 72 hardcoded `font-size: Npx` declarations using 15 distinct values: 11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 30, 32, 36. Two are fractional (12.5px on `.goal-quote` and `.tip-message`, 13.5px on `.tip-title`) and sit adjacent to 13px tokenised text, so the Advisor card and Goals card show three near-identical sizes within one component.
- **Impact:** No individual size is wrong, but "clear hierarchy" and "consistent sizing" are not achievable while five steps compete with fifteen ad-hoc values, and each new component copies whichever neighbour it was pasted from.
- **Recommendation:** Add the two missing display steps the app genuinely needs (`--t-h1: 22px` is taken; add `--t-display: 30px` and `--t-hero: 36px`), then replace the 72 literals with the nearest token. No visual change beyond snapping 12.5→13 and 13.5→13.
- **Effort:** M

---

**UI-08 — Card radius and padding do not match the scale the stylesheet declares**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — token declaration at 73; violations at 559, 623, 635, 992, 1029, 1038, 1139, 1153, 1170, 1182, 1190, 1215, 1278, 1334, 1345, 1372, 1441
- **Evidence:** `--r-sm: 8px; --r-md: 12px; --r-full: 999px` is commented "Radius scale — 3 values only". Twelve distinct radii are in use: 2, 3, 4, 5, 6, 8, 10, 12, 16, 999 plus the two tokens. Card padding likewise varies: `.card` 16px, `.advisor-card` 14px 16px, `#dailyChipsCard` 12px 16px, `.stat-tile` 12px, `.conv-result` 18px 14px, `.modal` 20px. `.list-item.dragging` uses a hardcoded `0 12px 28px rgba(0,0,0,.25)` instead of `--e3`.
- **Impact:** Adjacent cards on the Dashboard have visibly different corner softness and inset. This is polish, not failure, but it undercuts the "professional" target in the guidelines.
- **Recommendation:** Snap 10px → `--r-md`, 5/6px → `--r-sm`, and leave the ≤4px bar radii as an explicit `--r-bar` token. Set `.advisor-card` and `#dailyChipsCard` to the standard `--s4`, or add a documented `.card--tight` modifier if the tighter inset is deliberate.
- **Effort:** S

---

**UI-09 — Category tag text is marginally below AA on list rows**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `.tag.needs` / `.tag.wants` / `.tag.savings` (900–902), rendered inside `.list-item` (828–833)
- **Evidence:** The tag background is `color-mix(in srgb, var(--needs) 15%, transparent)`, so it composites against whatever sits behind it. Behind it on the Expenses and Settings lists is `.list-item`'s `--surface-2`, not `--surface`. Light theme: `--needs-text #0B5FE9` over the resulting `#D6E4F9` = **4.26:1**; `--wants-text #976106` over `#F1E8D5` = **4.31:1**. Both need 4.5:1 (11px, weight 600). The same tags over a white card (`.pva-head` on the Dashboard) measure 4.62:1 and pass, which suggests the tokens were derived against `--surface` only.
- **Impact:** The Needs/Wants/Savings classification — the input to the 50/30/20 advice — is slightly under threshold on the two screens where it appears most.
- **Recommendation:** Darken the three `*-text` tokens by one step, or raise the tag tint from 15% to a value that lands the composited background above 0.79 relative luminance. Re-measure against `--surface-2`, which is the harder of the two grounds.
- **Effort:** XS

---

**UI-10 — Kingfisher's `--text-2` fails AA on `--surface-2` and on the page background**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:479`
- **Evidence:** Kingfisher sets `--text-2: #0277BD`. Against `--surface #FFFFFF` it measures 4.80:1 and passes; against `--surface-2 #B2EBF2` it measures **3.67:1** and against `--bg #E0F7FA` **4.31:1**. `--text-2` is the colour of `.list-item .meta` (dates and notes, 12px), `.helper`, `.empty`, `.mini-label` and every chip amount — all of which sit on `--surface-2`. Every other theme's `--text-2` clears 4.5:1 on all three grounds; the other light themes carry a comment recording the measurement, and Kingfisher does not.
- **Impact:** One theme renders all secondary text below AA. Low reach, but it is the only theme in sixteen that was not measured.
- **Recommendation:** Darken to `#01579B`-adjacent (measured 5.66:1 on `--surface-2`) and add the measurement comment the sibling themes carry.
- **Effort:** XS

---

**UI-11 — Touch targets below 44px in the calendar grids and the goal icon picker**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `.cal-cell` / `.cal-grid` (1272–1283), date picker modal (2098–2113), `.icon-grid` (1178–1187)
- **Evidence:** `.cal-cell` sets `min-height: 44px` but its width is `(container − 6×4px gap) ÷ 7`. Inside a card at 360px viewport that is **38.9px**; at 390px (iPhone 14) **41.4px**; at 393px (Pixel) **43.6px**. The date-picker modal is capped at 380px wide with 20px padding, giving **42.3px** at any viewport ≥380px. The goal `.icon-grid` drops to 6 columns below 480px, giving **37.7px** square buttons at a 320px viewport.
- **Impact:** Every phone width in common use produces calendar cells narrower than the 44px the guidelines require. In the heatmap a mis-tap costs a re-tap; in the date picker it writes the wrong date into a goal deadline or a recurring plan's end date, which the user may not notice.
- **Recommendation:** Reduce `.cal-grid` gap from 4px to 2px and drop the calendar card's horizontal padding to `--s3`, which yields 44.6px at 360px. For the icon grid, switch to 5 columns below 360px.
- **Effort:** S

---

**UI-12 — Three sets of form controls carry no accessible name**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — converter currency buttons (2074–2075, 2083–2084), currency search box (2064), quick-amount edit inputs (6461)
- **Evidence:**
  - `<label for="convFromBtn">From</label>` and `<label for="convToBtn">To</label>` point at `<button>` elements. `button` is not a labelable element, so the association is dropped; both buttons announce only their contents ("🇺🇸 USD US Dollar ▼"), and nothing distinguishes the From side from the To side non-visually.
  - `<input type="text" id="curPickSearch" placeholder="🔍 Search by code or name…">` has no label and no `aria-label`; the placeholder disappears on first keystroke.
  - `renderQuickAmountRow()` emits `<input class="qa-inp money-input" data-qa-idx="${i}" value="…">` — three unlabelled fields with no placeholder, so pressing "✎ Edit" produces three anonymous number boxes for sighted and screen-reader users alike.
- **Impact:** The converter is the app's only route for foreign-currency entry and cannot be operated confidently without sight. The quick-amount editor gives no clue which box is which slot.
- **Recommendation:** Replace the two `<label for>` with `aria-label="Convert from"` / `aria-label="Convert to"` on the buttons (keeping the visible text as a `.group-label`), add `aria-label="Search currencies"` to the search box, and add `aria-label="Quick amount ${i+1}"` to the three edit inputs.
- **Effort:** XS

---

**UI-13 — Category and income-type reordering has no keyboard path**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `initCategoryReorder` (4443–4499), `initIncomeTypeReorder` (4329–4374), hint text at 4680 and 4401
- **Evidence:** Reordering is implemented entirely on `pointerdown`/`pointermove`/`pointerup`, and the hint reads "Press and drag a row up or down to reorder". There is no move-up/move-down control and no keyboard handler.
- **Impact:** Keyboard-only and switch users cannot change category order. The order is not purely cosmetic: `categoryColor()` (5439) assigns chart colours by array index, so it determines the Analytics palette as well as dropdown order.
- **Recommendation:** Add ↑/↓ buttons to each row alongside the existing edit/delete actions, driving the same splice. The drag gesture stays as the pointer shortcut.
- **Effort:** M

---

**UI-14 — Deleting a category is the only mutation that reports nothing**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:4699–4700` (and the two reorder handlers, 4367 and 4491)
- **Evidence:** `db.categories = db.categories.filter(…); save(); renderSettings(); renderDashboard();` — the return value of `save()` is discarded and no toast fires. Every other mutation in the file uses `const ok = save(); savedToast(ok, '…')`, which exists precisely so the user is never told "done" for a write that did not land. Here they are told nothing at all, and a failed write is silent even though the banner machinery is available.
- **Impact:** Deleting a category can silently fail to persist, and even on success the user gets no confirmation for an action that can retag existing expenses as "Unknown".
- **Recommendation:** `const ok = save(); … savedToast(ok, 'Category deleted');` — matching the income-type delete handler nine lines away.
- **Effort:** XS

---

**UI-15 — Eight dark themes ship and none of them is ever chosen automatically**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `applyTheme(db.settings.theme || 'light')` (3630), defaults at 2361 and 2389
- **Evidence:** A new install always resolves to `'light'`. There is no `@media (prefers-color-scheme: dark)` rule and no read of `matchMedia('(prefers-color-scheme: dark)')`.
- **Impact:** A user whose phone is in dark mode gets a full-brightness white app on first launch and has to discover the unlabelled palette glyph in the header to fix it. With 100,000 users a meaningful share never will.
- **Recommendation:** Default the *unset* theme to `dark` when `matchMedia('(prefers-color-scheme: dark)').matches`, and keep any explicit stored choice authoritative. One line in `load()`'s fresh-database branch plus one in `applyTheme`'s fallback.
- **Effort:** S

---

**UI-16 — Focusing the goal Icon field inserts 32 tab stops before the next field**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `wireIconGrid` (6339–6364), grid markup at 1811 and 6504
- **Evidence:** `input.addEventListener('focus', open)` opens the 32-button `.icon-grid`, which sits between the icon/name row and the Target Amount field in DOM order. A keyboard user who tabs into the Icon field must then traverse all 32 emoji buttons to reach Target Amount, on every pass through the form.
- **Impact:** The Goals form becomes tedious to complete without a pointer, and the grid opens on focus even when the user was only tabbing through.
- **Recommendation:** Open the grid on `click` only (the `focus` handler is the one that fires on tab-through), or give the grid `tabindex="-1"` on its buttons and expose a single "Choose icon" button that opens it deliberately.
- **Effort:** XS

---

## Clean Areas

- **Layout and hierarchy** — the Dashboard leads with Net Balance, then the three-tile strip, and both fit the first screenful on a 390×844 device; nothing competes with the headline figure.
- **States** — every list has an empty state, every async path has a status line, errors name a recovery action, and every destructive action is confirmed (Reset is double-confirmed).
- **Colour semantics** — income/green, expense/red and warning/amber mean the same thing on every screen, and no meaning is carried by hue alone.
- **Numbers and formatting** — `fmt()` puts the sign outside the symbol consistently, `fmtCompact()` is used only where space forces it, and the converter follows the same sign rule.
- **Back and cancel** — every modal has a close control, a Cancel, backdrop dismissal, Escape and Android Back, all routed through one `dismissModal()`.

## Quick Wins

- **UI-03** — three inline width overrides remove a visibly broken primary action on Salary and a broken card header on Analytics.
- **UI-05** — one call swapped in the init block and one `if` guard around the subtitle write.
- **UI-06** — one line in `navigate()` decides whether the Expenses tab means Expenses.
- **UI-04** — save and restore `scrollLeft`, add one `scrollIntoView`; makes the Analytics chart feel responsive rather than dead.
- **UI-02** — one token per theme and eleven find-and-replace call sites; fixes the active-tab indicator in four themes.

## Estimated UX Impact

Fixing the three High findings changes what the app looks like to anyone who is not on the default theme with perfect vision. Today, choosing Nord, Slate or Gold — offered on equal footing with Light from the header and from Settings — makes the label on every Save, Add and Import button effectively unreadable, and in four light themes the active tab indicator and the goal completion percentage go with it; after UI-01 and UI-02 every theme is a supported theme rather than a cosmetic gamble. UI-03 restores the Salary Calculator's primary action to primary size and stops the Analytics day-detail card rendering with its title underneath a full-width Close button — two of the surfaces this round newly exposed.

The Medium set removes three moments where the app misinforms or appears broken: tapping a day on the Analytics chart will produce a visible answer instead of silently scrolling the chart back to the start; the header will name the screen you are on and the period you are actually looking at rather than the Dashboard's; and the Expenses tab will stop occasionally delivering Budget Planning. None of these change a figure, but each one currently costs the user a moment of doubt about whether the numbers in front of them are the ones they asked for — which, in a finance app aimed at people with no accounting training, is the expensive kind of doubt.
