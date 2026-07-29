# UI/UX Review — Expense Tracker PWA

## Executive Summary

This is a carefully engineered application with an unusually mature approach to data safety — corrupt-data quarantine, honest save-failure banners, per-record import validation, and a custom confirmation dialog on every destructive action. That work is real and it is visible in the interface. The design layer has not been held to the same standard: the file opens with a complete, well-reasoned design token system (spacing, radius, type, elevation) and then the ~1,200 lines of component CSS beneath it largely ignore it. The single biggest problem is accessibility — **not one form field in the application is programmatically labelled**, the nine modal dialogs cannot be dismissed or escaped by keyboard, three of the most-used interactive surfaces are `&lt;div&gt;`s that keyboard users cannot reach at all, and nearly every control except the primary button and the tab bar falls below the 44×44 px minimum the project's own guidelines mandate. Combined with a navigation structure that buries Income — a named core module and half the app's purpose — two taps deep behind an unlabelled "More" sheet, the app is harder to use than its underlying quality deserves.

## Overall Score

**68 / 100 — Usable but fragile.**

Five High findings, no Critical: the app is correct and safe with its data, and every list has an empty state, every async action a loading state, and every destructive action a confirmation — but the accessibility layer is effectively absent and mobile-first touch sizing is not met, so a significant fraction of 100,000 users would be blocked or impeded in normal use.

## Strengths

- **State coverage is genuinely complete.** Every list has a purpose-written empty state with an icon, a title and an actionable description (`emptyState()`, line 5857; used at 3136, 3375, 5269, and eight more sites). Every destructive action routes through `confirmDialog()` (line 2897), and "Reset All" requires two confirmations (lines 3867-3871). Deleting a category or income type that is in use says so before asking. This is better than most shipped finance apps.
- **Failure is communicated honestly.** `save()` returns whether the write actually landed, a persistent non-dismissible banner appears if it did not, and the banner offers the exact recovery action (export a backup) rather than a generic apology (lines 1227-1233, 2273-2313).
- **`revealEntryDate()` (line 2633) is excellent product thinking.** Rather than explaining a date filter to a confused user, the app moves the filter to a period containing the entry they just added and says so in the toast. This closes a real duplicate-entry trap.
- **Reduced-motion is respected** globally (lines 513-516) and again inside the number animation (line 2450).
- **`toLocalISO()` is used everywhere instead of `toISOString()`** (line 2487), so dates do not shift for users east of UTC. Small detail, wrong in most apps.

## Findings

Clean areas, reported in one line each as required:
- **States (empty / loading / destructive confirmation)** — clean; see Strengths. The one gap is error state, reported below as UI-09.
- **Horizontal scrolling** — clean. `.trend-wrap` and `.cur-pick-list` scroll internally by design; `.filter-row` wraps; no page-level horizontal overflow was found at 320 px.
- **Colour palette discipline** — clean. Sixteen themes, but all sixteen are driven by one fixed variable contract, and `--needs` / `--wants` / `--savings` / `--success` / `--danger` keep the same meaning in every one.

---

**UI-01 — No form input in the application has an associated label**

- **Severity:** High
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html` — every screen. Examples: Salary 1343-1380, Income 1411-1419, Expenses 1444-1472, Goals 1544-1579, Settings 1594-1609, Converter 1776-1785, and all modal-generated forms at 5437-5441, 5503-5537, 5635-5672.
- **Evidence:** The markup pattern throughout is `&lt;label&gt;Date&lt;/label&gt;&lt;input type="date" id="incDate" /&gt;`. There is not a single `for=` attribute in the file, and no input other than the notification checkboxes (3730-3747) is nested inside its label. The only fields carrying any accessible name are the six date-filter inputs, which use `aria-label` (1257-1258, 1405-1406, 1438-1439, 1497-1498).
- **Impact:** A screen-reader user hears "edit text, blank" for every amount, date, category and note field in the app — they cannot fill in a single form. Sighted users lose the tap-the-label-to-focus-the-field affordance, which matters on a phone where the 13 px label is easier to hit than a date input. `&lt;label&gt;` is also being used purely as a visual style hook, which means the semantic element is present and lying rather than merely absent.
- **Recommendation:** Add `for="&lt;id&gt;"` to each `&lt;label&gt;` and keep the existing CSS. The ids already exist on every input, so this is a mechanical edit with no layout change. Do the same in the three template-literal form builders.
- **Effort:** S

---

**UI-02 — The nine modal dialogs are not keyboard operable**

- **Severity:** High
- **Location:** `index.html` — `#moreSheet` 1693, `#editModal` 1734, `#themeModal` 1746, `#notifModal` 1754, `#currencyPickerModal` 1762, `#converterModal` 1771, `#datePickerModal` 1800, `#confirmModal` 1817. Open/close logic at 2897-2925, 2956-2979, 5036-5083, 5100-5166, 5700-5712.
- **Evidence:** Searching the file for `Escape` returns two hits, both for inline category-rename inputs (3545, 3822). No modal listens for Escape. No modal sets `role="dialog"` or `aria-modal="true"`. No modal traps focus or restores focus to the element that opened it. No modal locks body scroll (`body.style.overflow` appears nowhere). `#confirmModal` (1817) has no close-X at all, so its only exits are the two buttons and a backdrop click.
- **Impact:** A keyboard user who opens the delete-confirmation dialog tabs straight out of it and into the page behind, where the focus ring is invisible under the backdrop; they cannot reliably reach Cancel or Delete. On a phone, the page behind the sheet scrolls under the user's finger when the sheet's own content is short. This affects the confirmation dialog that guards every destructive action in the app.
- **Recommendation:** Write one `openModal(el)` / `closeModal(el)` pair that adds `role="dialog" aria-modal="true"`, records `document.activeElement`, moves focus to the first focusable child, cycles Tab within the dialog, closes on Escape, restores focus on close, and toggles `overflow:hidden` on `&lt;body&gt;`. Route all existing `classList.add('show')` / `.remove('show')` calls through it.
- **Effort:** M

---

**UI-03 — Three primary interactive surfaces are `&lt;div&gt;`s and cannot be reached by keyboard**

- **Severity:** High
- **Location:** `index.html` — calendar heatmap cells `renderCalendar()` 4633-4647; date-picker cells `renderDatePickerGrid()` 5134-5145; daily stacked-chart columns `drawDailyStackedChart()` 4757-4787; currency picker rows `renderCurPickList()` 4912-4924.
- **Evidence:** All four render `&lt;div ... data-*&gt;` with a `click` listener attached. None has `tabindex`, `role="button"`, or a key handler. The CSS focus rule (646) targets only `button`, `a` and `[tabindex]`, so these elements can never show a focus ring either.
- **Impact:** The calendar heatmap is the main interaction on the Daily screen and the custom date picker is the *only* way to set a goal deadline, a recurring end date, or a first-contribution date — those three fields are `readonly` inputs (1468, 1556, 1579) whose only input path is the div-based picker. A keyboard-only user therefore cannot set a deadline on a savings goal at all, and cannot inspect any day in the calendar.
- **Recommendation:** Change the four generated elements from `&lt;div&gt;` to `&lt;button type="button"&gt;` and reset the button styling in the existing class rules. This gets keyboard focus, Enter/Space activation and the focus ring for free without touching the click handlers.
- **Effort:** S

---

**UI-04 — Most interactive controls are below the 44×44 px minimum the guidelines require**

- **Severity:** High
- **Location:** `index.html` CSS block. Measured: `.list-item .actions button` 40×40 (664-667); `button.secondary` and `button.danger` `min-height: 40px` (632, 638); `.goal-actions .goal-icon-btn` 34×34 (955-959); `.goal-actions .goal-add` ≈34 px tall (949-953); `.cal-nav button` ≈31 px tall (1063); `.close-x` unsized glyph ≈25×25 (1213); `.chip` / `.chip-mini` `min-height: 32px` (858, 867); `.segmented button` ≈33 px (778-782); `.qa-btn` ≈34 px (1033-1038); `.notif-actions button` ≈28 px (491-495); `.advisor-more` ≈25 px (1024-1028); `.convert-btn` ≈20 px (1103-1108); Data Summary clear buttons `padding: 2px 8px; font-size: 11px` ≈17 px tall (3682); `.icon-grid button` ≈32-40 px on phones (976-998); `.cal-cell` ≈41 px wide at a 375 px viewport (7 columns of `1fr` inside a 311 px content box).
- **Evidence:** `knowledge/ui-guidelines.md` states "Minimum touch target 44x44 px." Only `.icon-btn` (44×44, line 461), `button.primary` (44, line 618), `nav.tabbar button` (52, line 738), `.more-item` (56, line 757) and `.cur-pick-item` (~46) meet it. The 40×40 edit and delete buttons appear on every income row, expense row, category row, income-type row and contribution row — they are the most frequently tapped controls in the app after the tab bar.
- **Impact:** Mis-taps on a 40×40 target sitting 4 px from its neighbour (`gap: var(--s1)`, line 663) mean users hit Delete when they meant Edit. Delete is confirmed, so this is friction rather than data loss — but it is friction on the most repeated action, and the 17 px Data Summary "clear all" buttons are the smallest targets in the app while being among the most destructive.
- **Recommendation:** Raise `.list-item .actions button` to 44×44 and increase its gap to `var(--s2)`; set `min-height: 44px` on `button.secondary`, `button.danger`, `.segmented button`, `.chip`, `.qa-btn`, `.cal-nav button` and `.goal-icon-btn`; give `.close-x` explicit `width:44px;height:44px`. All CSS-only, no markup change.
- **Effort:** S

---

**UI-05 — Income, a core module, is two taps deep behind an unlabelled "More" sheet**

- **Severity:** High
- **Location:** `index.html` — tab bar 1670-1691; More sheet 1693-1730; `MORE_TABS` 3011.
- **Evidence:** The five tab-bar slots are Home, Expenses, Daily, Goals, More. Income and Salary Calculator — both named core modules in `knowledge/project.md` — are reachable only via More → Income. Meanwhile Daily and Goals, which appear nowhere in project.md's module list, hold direct slots. The app's own first-run advisor tip compounds the confusion by telling the user to use the "Income tab" (line 4204), which does not exist. The Daily screen is also labelled three different ways: "Daily" in the tab bar (1681), "Daily Chart" in the header (2989), and "Daily Breakdown" on the card (1515) — and it contains a stats strip, a chart, a calendar and a day-detail panel, none of which the name predicts.
- **Impact:** An untrained user opening the app to record their salary has no visible path to do so. Logging income is one half of an income-and-expense tracker; making it the only primary flow hidden behind a "⋯" menu inverts the app's own information architecture. This is exactly the audience `project.md` describes: "People with little accounting knowledge. Every screen should be understandable without training."
- **Recommendation:** Swap Goals and Income in the tab bar — Income becomes a direct tab, Goals moves into More alongside Salary Calculator and Settings. Update `MORE_TABS` accordingly and rename the Daily tab to match its header. No new screens, no new components.
- **Effort:** S

---

**UI-06 — Three of the eight core modules named in project.md have no screen**

- **Severity:** Medium
- **Location:** Whole application; measured against `knowledge/project.md` lines 15-22.
- **Evidence:** project.md names Dashboard, Salary Calculator, Income, Expenses, **Budget Planning**, **Analytics**, **Reports**, Settings. The app ships Dashboard, Salary Calculator, Income, Expenses, Daily Chart, Savings Goals and Settings (`titles`, lines 2984-2992). Budget Planning exists only as a "Planned" toggle inside Expenses (1431-1434) and a Planned-vs-Actual card on the Dashboard. Analytics is partially served by the Daily screen and the Dashboard charts but has no home of its own. Reports does not exist in any form — the Backup &amp; Restore JSON export (1645-1657) is a data dump, not a report a user can read.
- **Impact:** A user cannot produce anything they could show to someone else, print, or file — for a personal finance app aimed at people trying to "understand, manage and improve their financial life" (project.md line 9), the absence of any readable output is a real capability gap, not a cosmetic one. The absence of a named Budget Planning surface also means the recurring-plan feature, which is genuinely sophisticated, is discoverable only by toggling a segmented control inside Expenses.
- **Recommendation:** This needs a product decision before any code: either revise project.md to describe the modules the app actually has (Daily and Goals are real, valuable modules that the reference does not acknowledge), or plan the three missing screens. The smallest honest step is to reconcile the reference document first.
- **Effort:** XL

---

**UI-07 — Text on the Dashboard hero and Salary summary fails WCAG AA contrast**

- **Severity:** Medium
- **Location:** `index.html` — `.hero-label` `opacity: .85` (555-559) and `.hero-trend` `opacity: .9` (565) over the `.hero-kpi` gradient (541-548); `.salary-summary .label` `rgba(255,255,255,.85)` (1097) and the inline `color:rgba(255,255,255,.9)` deduction strip (1333) over the same gradient.
- **Evidence:** The gradient runs `#2563EB → #3B82F6`. White at 85 % opacity against `#3B82F6` gives ≈3.1:1; against `#2563EB` ≈4.2:1. Both are below the 4.5:1 AA threshold for text under 18.66 px bold — `.hero-label` is 13 px semibold and `.hero-trend` is 13 px regular. `knowledge/ui-guidelines.md` requires "WCAG AA contrast" and "High contrast."
- **Impact:** `.hero-trend` carries the single most important sentence on the home screen — "↓ Over budget by ₮450,000" or "↑ 32% of income saved" (lines 4278-4283). It is the only place the app tells the user whether they are winning or losing, and it is the lowest-contrast text in the app. The same applies to the Gross / SI / WHT breakdown on the Salary screen.
- **Recommendation:** Remove the opacity from `.hero-trend` and `.salary-summary` values (use full white); raise `.hero-label` from `.85` to `.95`. No layout or colour-system change.
- **Effort:** XS

---

**UI-08 — Placeholder text fails AA contrast in every theme**

- **Severity:** Medium
- **Location:** `index.html` — `input::placeholder` rule at 612; `--placeholder` defined per theme at 24, 71, 92, 114, 136, 158, 180, 207, 230, 255, 280, 303, 328, 351, 374, 399.
- **Evidence:** Light theme uses `#94A3B8` on `#FFFFFF` ≈ 2.6:1. Mint uses `#22C55E` ≈ 2.3:1. Flamingo `#E39B9F` and Kingfisher `#4FC3F7` are near 2.1:1. The rule explicitly sets `opacity: 1` to make placeholders *more* visible, which shows the intent was there, but the colour values were never checked. Notably the `--text-2` values in these same themes carry hand-written comments confirming they were deliberately darkened for AA ("darkened for AA compliance (5.7:1)", line 90) — `--placeholder` was left out of that pass.
- **Impact:** Placeholders carry real guidance here, not decoration: "e.g. Travel to Japan", "e.g. Groceries", "📅 Tap — leave empty for unlimited", "🔍 Search by code or name (e.g. USD, Yen)". Users in bright light or with reduced vision cannot read the hints that explain what the field wants.
- **Recommendation:** Set `--placeholder` to the theme's `--text-2` value, or one step darker than `--text-3`, in each theme block. Same one-line-per-theme fix already applied to `--text-2`.
- **Effort:** XS

---

**UI-09 — Toasts are the only error channel, are clipped, are never announced, and disappear in 1.8 s**

- **Severity:** Medium
- **Location:** `index.html` — `.toast` CSS 1163-1169; `toast()` 2649-2654. Error call sites: import validation 3847, `'Invalid file'` 3862, persistence 2434, cloud sign-in 2144, cloud load 2190.
- **Evidence:** `.toast` has no `max-width`, no `white-space` control, and is centred with `transform: translateX(-50%)`, so any message wider than the viewport is clipped at both ends. Line 2434 emits *"Browser did not grant persistence — install as PWA and try again"* — 62 characters, ≈370 px at 13 px, which exceeds every phone viewport. Import failures surface as `'Cannot import — ' + problem`, where `problem` is a sentence like `"planned entry 12 has an invalid amount"` (2387). The element has no `aria-live`, so screen readers announce nothing. `setTimeout(..., 1800)` removes it after 1.8 seconds regardless of message length.
- **Impact:** A user whose backup file fails validation gets a partially-clipped sentence that vanishes before they can read it, with no way to recall it and no guidance on what to do next. Restoring a backup is the recovery path the whole storage design depends on — it is the worst place in the app for an ephemeral error.
- **Recommendation:** Add `max-width: calc(100vw - 32px)`, `border-radius: var(--r-md)`, `text-align: center` and `aria-live="polite"` to `.toast`; scale the dismiss timeout with message length (e.g. `Math.max(1800, msg.length * 60)`); and for import failures specifically, show the reason in the existing `confirmModal` instead of a toast.
- **Effort:** S

---

**UI-10 — A success toast is shown even when the save failed**

- **Severity:** Medium
- **Location:** `index.html` — `save()` contract comment at 2294-2296; unchecked call sites at 3100-3102 (salary), 3118-3124 (income), 3345-3359 (expense), 5416-5423 (goal), 5754-5756 and 5782-5784 (goal edit / contribution), 3429-3432 (category), 3441-3445 (income type).
- **Evidence:** The code documents its own rule — *"Returns true when the write actually reached localStorage. Callers that report success to the user should check it."* No caller checks it. Every one calls `save();` then unconditionally `toast('Income added')` / `'Goal added'` / `'Category added'`.
- **Impact:** On a quota-exhausted device or in Safari private browsing — both explicitly called out in the code's own comment at 2268-2271 — the user simultaneously sees a green-path confirmation toast and a red banner saying the change could not be saved. Two contradictory signals about their money at the same moment; the toast is the one they are looking at, because it is the one that appeared where they were acting.
- **Recommendation:** Change the pattern to `if (save()) toast('Income added');` at the eight call sites. The banner already handles the failure case.
- **Effort:** XS

---

**UI-11 — Negative amounts render with the currency symbol before the minus sign**

- **Severity:** Medium
- **Location:** `index.html` — `fmt()` line 2442; reached with negative values at 4273 (`kpiNet`), 4291 (`kpiPlannedNet`), 4373 (Planned-vs-Actual per-category difference).
- **Evidence:** `fmt = (n) =&gt; '₮' + Math.round(n || 0).toLocaleString('en-US')`. For `n = -450000` this produces `₮-450,000`. The Dashboard hero calls it with `net = totalIncome - totalExp`, which is negative whenever the user overspends. The related `fmtCompact()` (2472-2477) is worse for negatives: it falls through both magnitude branches and returns `'₮' + v` with no thousand separator at all, so `-3000` would render as `₮-3000` while every neighbouring figure is grouped.
- **Impact:** `₮-450,000` is not a currency format any user has seen. On the hero it appears at 36 px in white on blue, where the leading hyphen is the only thing distinguishing a large deficit from a large surplus — and the guideline question "Is the sign of a value ever ambiguous?" is answered badly here, because the hero's colour does not change with sign (the gradient is always brand blue). The `Planned Left` tile does swap colour with sign (4292), so the app is inconsistent with itself.
- **Recommendation:** Change `fmt` to place the sign outside: `const fmt = (n) =&gt; { const v = Math.round(n||0); return (v&lt;0?'-₮':'₮') + Math.abs(v).toLocaleString('en-US'); }`. Apply the same guard in `fmtCompact`.
- **Effort:** XS

---

**UI-12 — `word-break: break-all` splits money figures mid-number on large phones**

- **Severity:** Medium
- **Location:** `index.html` — `.hero-value` 563, `.mini-value` 594, `.st-value` 888, `.cal-val` 1088, `.conv-val` 1115. Layout rule at 572-575.
- **Evidence:** `.kpi-strip` is three columns above 420 px and one column below. At a 430 px viewport (iPhone 15/16 Pro Max) each `.kpi-mini` column is ≈127 px; subtracting 24 px padding, a 36 px icon and a 12 px gap leaves ≈55 px for `.mini-body`. `₮1,250,000` at 18 px/700 is ≈95 px wide, and `break-all` permits a break at any character, so it renders as `₮1,25` / `0,000`. The `PLANNED LEFT` label at 11 px uppercase with `.04em` tracking is ≈78 px and wraps for the same reason.
- **Impact:** On some of the most common phones on the market, the three headline figures on the home screen are broken across lines at arbitrary digit positions. A number split as `₮1,25` / `0,000` is not merely ugly — it is momentarily misreadable, and this is the Dashboard.
- **Recommendation:** Replace `word-break: break-all` with `overflow-wrap: anywhere` on `.mini-value` and `.st-value` (which breaks only when there is no other option and never mid-token where a wrap point exists), and add a `@media (max-width: 560px)` breakpoint to `.kpi-strip` so the three-up layout only engages when there is room for it. Alternatively render `.mini-value` with `fmtCompact()`, which the app already uses in tighter places.
- **Effort:** XS

---

**UI-13 — The Salary Calculator uses unexplained acronyms and jargon throughout**

- **Severity:** Medium
- **Location:** `index.html` — Salary screen 1329-1399. Specifically the summary strip 1333-1337 and the input labels 1355-1380.
- **Evidence:** The screen presents `SI`, `WHT`, `SI+WHT`, `OT Hours (×1.5)`, `NT Hours (×1.2)`, `OT+NT Hours (×1.8)`, `Field Allowance / day`, `SI %` (defaulting to 11.5) and `WHT %` (defaulting to 10). Searching the whole file for "Social Insurance" or "Withholding" returns nothing — the acronyms are never expanded anywhere in the app or the README. The only helper text on the screen is on Hourly Rate: *"Required — all salary calculations are based on this."* (1347). The 11.5 % and 10 % defaults are jurisdiction-specific and unexplained.
- **Impact:** `project.md` states the target user has "little accounting knowledge" and that "Every screen should be understandable without training." This screen is the counter-example: it asks a user to confirm or change two percentages that directly determine their net pay, using labels that do not say what they are. A user who does not know that WHT means withholding tax has no basis to judge whether 10 % is right for them, and the app writes the result straight into Income (3099).
- **Recommendation:** Expand the labels in place — "SI %" → "Social Insurance (SI) %", "WHT %" → "Withholding Tax (WHT) %", "NT Hours" → "Night Hours (NT) ×1.2" — and add one `.helper` line under the two percentage fields stating the standard Mongolian rate and that it can be changed. Purely textual.
- **Effort:** S

---

**UI-14 — The date filter is the first element on four screens, above the figure it filters**

- **Severity:** Medium
- **Location:** `index.html` — Dashboard 1255-1259 (above the hero at 1261), Income 1403-1407, Expenses 1436-1440, Daily 1495-1499.
- **Evidence:** On the Dashboard the first thing rendered is a `.filter-row` containing a preset `&lt;select&gt;` and two `&lt;input type="date"&gt;` controls; the Net Balance hero sits below it. The same three controls repeat at the top of Income, Expenses and Daily. The selected range is *also* already shown in the header sub-line (`hdrSub`, set at 4260-4261 to `2026-07-01 → 2026-07-31`), so the information is duplicated.
- **Impact:** `knowledge/ui-guidelines.md` requires "Most important information first" and "Reduce visual clutter" on the Dashboard. Three form controls occupying the top ~60 px of the home screen is chrome outranking content, and it is the first thing a new user sees when they open the app — an empty filter widget rather than their money. It also means the hero KPI is below the fold on shorter phones once the header and any banner are accounted for.
- **Recommendation:** Move the `.filter-row` below the `.hero-kpi` on the Dashboard, and collapse it to a single tappable summary chip (reading the current preset) that expands the two date inputs on demand. Keep the existing `initPeriodFilter()` wiring untouched.
- **Effort:** S

---

**UI-15 — Category filter chips signal on/off by opacity alone**

- **Severity:** Medium
- **Location:** `index.html` — `.chip.off { opacity: .38 }` and `.chip.off .chip-dot { background: var(--text-2) }` (865-866); rendered at 4679-4689.
- **Evidence:** Toggling a chip adds or removes the `off` class and nothing else. There is no checkmark, no strikethrough, no text change, and no `aria-pressed` attribute (a search for `aria-pressed` in the file returns zero results). At 38 % opacity, `--text` `#0F172A` over `--surface-2` `#F1F5F9` resolves to roughly 2.6:1 — below AA for the chip's own label.
- **Impact:** This is the Daily screen's only mechanism for excluding categories from the chart, calendar, stats strip and day-detail panel simultaneously. A user who cannot perceive the opacity difference — in sunlight, with reduced vision, or via a screen reader — is looking at filtered financial totals with no indication that anything is being excluded. The "All" / "None" buttons (1507-1508) make it easy to enter that state accidentally.
- **Recommendation:** Add `aria-pressed` to each chip button, raise `.chip.off` opacity to `.6`, and add a visible non-colour marker — e.g. give `.chip.off` a dashed border and prefix the label with a strikethrough style. Three CSS lines plus one attribute.
- **Effort:** XS

---

**UI-16 — The declared design token scales are not followed by the component CSS**

- **Severity:** Medium
- **Location:** `index.html` — tokens declared at 38-53; violations throughout 413-1213.
- **Evidence:** The file declares `--r-sm: 8px; --r-md: 12px; --r-full: 999px` under the comment *"Radius scale — 3 values only"*. The CSS below uses ten distinct radii: 2 px (1322), 3 px (825, 833, 1090), 4 px (799, 800), 5 px (937, 941), 6 px (493, 842, 968, 1071), 8 px, 10 px (481, 951, 957, 988, 1013, 1122, 1149), 12 px, 16 px (1208) and 999 px. The type scale declares six sizes (11/13/15/18/22/28); the CSS hard-codes roughly a hundred `font-size` declarations across eighteen distinct values — 9, 10, 11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 24, 30, 32, 36 px — while `--t-h1` (28 px) is never used at all. Elevation declares "3 tiers" and the CSS adds at least four ad-hoc shadows (694, 730, 1140, 433). Spacing declares 4/8/12/16/24/32/48 and the CSS uses 3, 5, 6, 10, 14 and 18 px in dozens of places (e.g. `.advisor-card` `padding: 14px 16px`, `.conv-result` `padding: 18px 14px`, `.goal-card` `margin-bottom: 14px` against `.card`'s 12 px).
- **Evidence, user-visible consequence:** Card radii in the rendered UI are 8 px (`.stat-tile`), 10 px (`.notif-item`, `.advisor-tip`, `.cur-pick-item`), 12 px (`.card`, `.goal-card`, `.more-item`) and 16 px (`.modal`) — four different corner treatments visible on a single scroll of the Daily screen. Chart labels at 9 px (814, 1092-1094) are below any readable minimum on a phone.
- **Impact:** `knowledge/ui-guidelines.md` requires "Consistent sizing", "Use an 8px spacing system", "Consistent border radius", "Consistent shadows". The surfaces do not line up optically, and the 9-10 px chart and calendar labels — which carry actual amounts — are hard to read. Individually each instance is minor; collectively they are why the app reads as assembled rather than designed.
- **Recommendation:** Do not restyle. Do a mechanical substitution pass: map every radius to the nearest of the three declared values, every `font-size` to the nearest of the six declared tokens (raising 9 px and 10 px to `--t-micro`), every shadow to `--e1/--e2/--e3`, and every off-scale padding/margin to the nearest `--sN`. Verify the four charts still fit afterwards.
- **Effort:** M

---

**UI-17 — The first-run advisor tip directs users to a tab that does not exist**

- **Severity:** Low
- **Location:** `index.html` line 4203-4204.
- **Evidence:** With no data, the advisor emits: *"Log some income and expenses (Income tab, Expenses tab) — the advisor turns your data into concrete tips."* There is no Income tab; Income lives inside the More sheet (see UI-05).
- **Impact:** This is the only onboarding guidance a first-run user receives, and half of it points nowhere. Small in isolation, but it lands on the empty Dashboard at the exact moment a new user is deciding whether the app is worth learning.
- **Recommendation:** Change the copy to name the real path — "(More → Income, and the Expenses tab)" — or fix it implicitly by adopting UI-05, after which the sentence becomes true.
- **Effort:** XS

---

**UI-18 — The Dashboard KPI count-up animation displays figures that are not the user's balance**

- **Severity:** Low
- **Location:** `index.html` — `setNumAnimated()` 2445-2470; called at 4271-4273 and 4287-4291.
- **Evidence:** Every Dashboard render tweens Net Balance, Income, Expenses and Planned Left from their previous values to their new ones over 450 ms with an ease-out cubic, then applies a `scale(1.06)` pulse (2466, 506-511). This fires on every navigation to the Dashboard and on every filter change, not only on first load. Reduced-motion is correctly honoured (2450-2454).
- **Impact:** For 450 ms the hero displays a plausible, correctly-formatted, fully-legible currency figure that is not the user's balance. A user who glances and looks away can walk off with a wrong number. In a finance app the headline figure is the one place where motion buys the least and costs the most.
- **Recommendation:** Keep the animation for the small KPI tiles if desired, but render `#kpiNet` directly via `fmt()` with no tween. One-line change at 4273.
- **Effort:** XS

---

**UI-19 — Manifest splash colour contradicts the default theme, and orientation is locked**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\manifest.json` lines 8-9.
- **Evidence:** `"background_color": "#0f172a"` (dark navy) while the default theme is `light` with `--bg: #F8FAFC` (index.html 2954, 16). `"orientation": "portrait"`.
- **Impact:** Every cold launch of the installed PWA shows a dark navy splash that flashes to a near-white app — a jarring first 300 ms on every open. The portrait lock means a tablet user, or a phone user with a keyboard case, cannot use the app in landscape at all; nothing in the layout requires portrait.
- **Recommendation:** Set `background_color` to `#F8FAFC` to match the default theme, and change `orientation` to `"any"`.
- **Effort:** XS

---

**UI-20 — The tab ARIA pattern is incomplete**

- **Severity:** Low
- **Location:** `index.html` — `role="tablist"` / `role="tab"` at 1431-1433, 1484-1492, 5649-5651.
- **Evidence:** Three segmented controls declare `role="tablist"` and `role="tab"` with correctly maintained `aria-selected` (3171-3191, 4515-4527, 5681-5692), but no element carries `role="tabpanel"`, none has `aria-controls`, and no arrow-key handler is bound, which the tab pattern requires.
- **Impact:** A screen reader announces "tab, 1 of 2" and then the user's arrow keys do nothing, because the roles promise a widget behaviour the code does not implement. A partially-implemented ARIA pattern is harder to use than plain buttons would be.
- **Recommendation:** Either add `aria-controls` plus an arrow-key handler, or — the smaller safe fix — drop `role="tablist"`/`role="tab"` and use `aria-pressed` on the two buttons instead, which matches what they actually do.
- **Effort:** XS

---

## Quick Wins

Findings at XS or S effort with Medium severity or above:

- **UI-01** — Adding `for=` to existing labels is mechanical, changes nothing visually, and unblocks every form in the app for assistive-technology users.
- **UI-03** — Swapping four generated `&lt;div&gt;`s for `&lt;button&gt;`s restores keyboard access to the calendar, the chart and the only date picker in the app.
- **UI-04** — A dozen CSS `min-height` / `width` bumps bring the app in line with its own 44×44 rule.
- **UI-05** — Swapping two entries in the tab bar array puts a core module back where users will find it.
- **UI-07** — Removing three opacity values fixes AA contrast on the Dashboard hero and Salary summary.
- **UI-08** — One `--placeholder` value per theme block fixes placeholder contrast everywhere.
- **UI-09** — A `max-width`, an `aria-live` and a length-scaled timeout make error messages readable.
- **UI-10** — Wrapping eight `toast()` calls in `if (save())` removes the contradictory success message.
- **UI-11** — A three-token change to `fmt()` fixes negative currency formatting app-wide.
- **UI-12** — Swapping `word-break: break-all` for `overflow-wrap: anywhere` stops money splitting mid-number.
- **UI-13** — Expanding five label strings makes the Salary Calculator comprehensible without training.
- **UI-15** — One attribute and three CSS lines give the category filter a non-colour state indicator.

## Estimated UX Impact

Once UI-01 through UI-05 are fixed, the application becomes operable for the whole audience rather than most of it: screen-reader users can complete every form, keyboard users can set a goal deadline and inspect the calendar, dialogs can be escaped, and the most-tapped controls stop producing mis-taps on a phone. Putting Income back in the tab bar removes the single largest discoverability failure — a new user opening the app to record their salary will see where to do it, which is the difference between the app being adopted and abandoned in the first session.

Fixing the Medium band changes what the user can trust. Amounts stop being clipped mid-digit on large phones, negative balances read as `-₮450,000` rather than `₮-450,000`, the hero's over/under-budget sentence becomes legible, error messages survive long enough to be read and acted on, and the app stops congratulating the user on a save that did not happen. Explaining SI and WHT turns the Salary Calculator from a form only its author can complete into one the stated target user can. None of this requires a redesign — the design system is already written at the top of the file; the work is mostly making the rest of the file obey it.
