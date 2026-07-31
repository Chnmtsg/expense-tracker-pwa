# UI/UX Review — Expense Tracker PWA

**Scope:** `D:\3_Claude\PowerApps\expense-pwa\index.html` (6,333 lines), `manifest.json`, `sw.js`, `icon.svg`
**Measured against:** `D:\3_Claude\PowerApps\knowledge\ui-guidelines.md`, `D:\3_Claude\PowerApps\knowledge\project.md`
**Format:** `D:\3_Claude\PowerApps\knowledge\review-conventions.md`

---

## Executive Summary

This is a carefully built interface with an unusually strong failure layer — corrupt-data quarantine, save-failure banners, validated imports, confirmed deletions and a proper focus-trapping modal stack are all present and correct, which is rare. That work is undermined by a single undeclared variable in the Edit Expense save path that throws on every edit, leaves the sheet open, and raises the app's own red "your saved data could not be read" banner at a user who has lost nothing. Below that, the biggest structural problem is that navigation does not match the product: three of the eight core modules named in `project.md` (Budget Planning, Analytics, Reports) have no destination at all, while Income — the counterpart of Expenses — is buried two levels deep behind a modal, to the point that the app's own advisor copy has to spell out the route. Accessibility is half-finished: modals, focus trapping and empty states are handled, but the semantic green and red that carry every currency figure fail WCAG AA, the focus ring itself is ~1.7:1, and the custom date picker cannot be opened by keyboard at all.

---

## Overall Score

**60 / 100** — *Usable but fragile.*

Four High findings sit on core-module reachability and on accessibility requirements the project's own guidelines mandate, which places this squarely in the 60-74 band; the Critical is release-blocking but is a one-line fix, so it does not on its own drag the report into the rework band.

---

## Strengths

- **Failure states are better than most production apps.** Unreadable storage is quarantined to a side key and surfaced with both "Restore from file" and "Download damaged file" (`index.html:1289-1296`, `2056-2098`); a failed write raises a non-dismissible banner with an Export action and `savedToast()` never reports success for a write that did not land (`2411-2421`); a bad import is rejected whole, with a modal naming the specific offending record rather than a toast that vanishes (`4189-4199`).
- **Every destructive action is confirmed, and the confirmation names what is lost** — the contribution count on a goal, the fact that deleting a recurring plan erases its past occurrences, whether a category is still in use (`3743-3745`, `4156-4162`, `5739-5743`). Reset requires two confirmations.
- **Modal infrastructure is correct**: `role="dialog"`, `aria-modal`, a real focus trap, Escape routed through the modal's own cancel control so promises still resolve, focus restoration, body scroll lock, and a stack that supports genuine nesting (`3084-3138`).
- **`revealEntryDate()`** (`2801-2815`) — when a saved entry falls outside the active filter, the app moves the filter to reveal it and says so in the toast. This prevents the duplicate-entry failure mode directly.
- `prefers-reduced-motion` is honoured (`539-542`), and the hero balance is deliberately excluded from the count-up tween so it is never showing a plausible wrong number (`4651-4655`).

---

## Findings

### UI-01 — Editing an expense or income throws, and raises a false data-loss alarm

- **Severity:** Critical
- **Location:** `expense-pwa/index.html:6246` and `:6249` (Edit modal save handler); banner at `:1289-1296`; handler at `:6303`
- **Evidence:** Line 6246 reads `okSave = save(); renderExpenses(); renderDashboard(); updateBellBadge();`. `okSave` is never declared — the only two occurrences in the file are lines 6246 and 6249 — and the script is `"use strict"` from line 1900, so assignment to an undeclared identifier throws `ReferenceError`. The right-hand side runs first, so the record *is* written, but every statement after the assignment is skipped: the Edit Expense sheet stays open, the entries list and Dashboard never refresh, and no confirmation toast appears. The uncaught error reaches `window.addEventListener('error', … reportFatal)` at line 6303, which shows `#dataErrorBanner` — a red, `aria-live="assertive"`, **non-dismissible** banner reading *"Your saved data could not be read. The app has started empty… Something went wrong while loading your data… restore a backup if the app stays broken."* On the income branch the same identifier is *read* at line 6249, after `closeEditModal()`, so that path updates correctly and then raises the same banner.
- **Impact:** Editing an entry is a core action. The user sees the edit fail (expense) or succeed (income) and is then told their saved data could not be read and they should restore a backup. The banner has no dismiss control by design and persists for the rest of the session. This is the app's loudest possible message, fired for a non-event.
- **Recommendation:** Declare the binding — `let okSave = true;` before the income/expense branch at line 6193, and change 6246 to assign to it. No other change.
- **Effort:** XS

*(The write itself lands; whether the persisted values are correct is Code Review's domain. This finding is about what the screen does and what it tells the user.)*

---

### UI-02 — Three of the eight core modules have no destination

- **Severity:** High
- **Location:** Tab bar `index.html:1741-1762`; More sheet `:1764-1801`; `titles` map `:3263-3271`; screen sections `:1325-1737`
- **Evidence:** The app has exactly seven navigable screens: `dashboard`, `salary`, `income`, `expenses`, `daily`, `goals`, `settings`. `knowledge/project.md` names eight core modules: Dashboard, Salary Calculator, Income, Expenses, **Budget Planning**, **Analytics**, **Reports**, Settings. Budget Planning, Analytics and Reports have no screen, no tab, no More entry and no key in `titles`. Two screens that are *not* core modules — "Daily Chart" and "Savings Goals" — occupy two of the five tab-bar slots. The nearest equivalents are unlabelled and undiscoverable: planning exists only behind the "Planned" segmented button on Expenses (`:1503-1505`); analysis is split between four Dashboard cards and a screen titled "Daily Chart"; nothing produces a report — Backup &amp; Restore exports raw JSON (`:1718`).
- **Impact:** A user looking for their budget, an analytics view, or a report has nowhere to go and no vocabulary in the interface that matches what they were told the product does. Three named modules are effectively invisible.
- **Recommendation:** Rename before building. Retitle the `daily` screen "Analytics" in `titles` and in the tab label, and add a "Budget Planning" row to the More sheet that calls `navigate('expenses')` with the Planned mode preselected. Reports requires a product decision and should be scheduled separately, not stubbed.
- **Effort:** M (renames and entry points only; Reports as a real module is XL)

---

### UI-03 — Income, a core module, is three taps and a modal away

- **Severity:** High
- **Location:** Tab bar `index.html:1741-1762`; More sheet item `:1769-1778`; advisor copy `:4574-4577`
- **Evidence:** The tab bar exposes Home, Expenses, Daily, Goals, More. Reaching Income requires tapping More, waiting for the bottom sheet, then tapping Income. The source acknowledges the cost in a comment at line 4574 — *"Income has no tab of its own; it lives in the More sheet"* — and the first-run advisor tip has to print the route: *"Log some income (More → Income) and expenses (Expenses tab)"*. Daily and Goals, neither of which is a core module, hold direct tab slots. Salary Calculator is behind the same sheet.
- **Impact:** Half of "income and expense tracking" costs three interactions and a modal transition on every visit, on the app's most frequent workflow, for users the project describes as untrained.
- **Recommendation:** Swap the slots — move Goals into the More sheet and give Income the direct tab. Both are one-line changes to the tab markup and the `MORE_TABS` array at line 3290.
- **Effort:** S

---

### UI-04 — The semantic colours carrying every currency figure fail WCAG AA

- **Severity:** High
- **Location:** Token declarations `index.html:55-57`; `.list-item .amount.pos/.neg` `:715-716`; `.tag.wants` `:776`; `.advisor-count.warning` `:1069`; `.goal-meta-item.deadline-warning` `:992`; `.conv-status.warn` `:1184`
- **Evidence:** Measured against `--surface: #FFFFFF` in the default theme: `--success #10B981` = **2.5:1**, `--danger #EF4444` = **3.8:1**, `--warning #F59E0B` = **2.1:1**; white text on `#F59E0B` (the advisor warning badge) = **2.1:1**. `.list-item .amount` renders at 15px/700, which is *not* WCAG "large text" (that needs ≥18.66px bold), so the 4.5:1 threshold applies. This means **every amount in the Income list, every amount in the Expenses list, every "Wants" tag, every deadline warning chip and the advisor's warning badge** sit below AA. The stylesheet shows this question was worked elsewhere — the hero gradient scrim comment at `:566-575`, and `--text-2` deliberately darkened "for AA compliance" in sepia, ocean, forest and rose (`:116, 138, 160, 182`) — so the semantic tokens appear to have been missed rather than traded away.
- **Impact:** The single most-read figure on the two busiest screens is the least legible element on them. `knowledge/ui-guidelines.md` requires WCAG AA and high contrast without qualification.
- **Recommendation:** Add foreground-only variants alongside the existing tokens — e.g. `--success-text: #047857` (4.6:1), `--danger-text: #B91C1C` (5.9:1), `--warning-text: #B45309` (4.6:1) — and use them in the six text rules listed above. Leave `--success`/`--danger`/`--warning` untouched for bars, fills and tints, where the contrast rule does not apply.
- **Effort:** S

---

### UI-05 — Custom date fields cannot be opened by keyboard

- **Severity:** High
- **Location:** `expRecEnd` `index.html:1539` + handler `:3475-3478`; `goalDeadline` `:1627` + `:5569-5572`; `goalRecStart` `:1650` + `:5756-5759`; `mGoalDeadline`/`mGoalRecStart` `:5948-5951`; `mExpRecEnd` `:6097-6099`
- **Evidence:** Each of these is `&lt;input type="text" readonly&gt;` whose *only* listener is `click`. A keyboard user can Tab to the field, but Enter does not fire a `click` event on a text input, and Space is absorbed by the readonly input — the picker never opens. There is no alternative route: `openDatePicker()` is the sole way to set these values, and `goalRecStart` is mandatory once a frequency is selected (validation at `:5807`).
- **Impact:** A keyboard-only user cannot set an end date on a recurring planned expense (Expenses, a core module) and cannot create a scheduled goal contribution at all — the flow is blocked, not merely slower. `ui-guidelines.md` requires keyboard friendliness.
- **Recommendation:** Add a `keydown` handler beside each existing `click` handler that opens the picker on Enter or Space. Five call sites, same two lines each.
- **Effort:** S

---

### UI-06 — Filtered lists tell the user they have no data

- **Severity:** Medium
- **Location:** `renderIncome` `index.html:3415`; `renderExpenses` `:3707`; `emptyState()` `:6264-6270`
- **Evidence:** The empty state is selected purely from the *filtered* list length. With the default "This Month" preset (`:2766`) and entries dated in any other month — or immediately after selecting "Next Month" from the preset list (`:2700`) — the Income screen renders **"No income yet / Add your first income above — salary, freelance, gift, whatever comes in"** over a database full of records. Expenses does the same: **"No actual expenses / Add one above."** Nothing on the screen attributes the emptiness to the active period.
- **Impact:** The app states something false about the user's own data. The rational response is to re-enter an entry that already exists, which creates the exact duplicates that `revealEntryDate()` (`:2791-2800`) was written to prevent.
- **Recommendation:** Branch on the unfiltered collection length. When it is non-empty, show "No income in this period" with a "Show all time" button that sets the preset to `all`.
- **Effort:** S

---

### UI-07 — The Dashboard opens on three form controls, two of them visually unlabelled

- **Severity:** Medium
- **Location:** `index.html:1326-1330` (repeated at `:1474-1478`, `:1507-1511`, `:1566-1570`); `.filter-row` CSS `:839-840`; preset override `:2775`
- **Evidence:** The first element above the fold on every data screen is `#dashPreset` followed by two bare `&lt;input type="date"&gt;` boxes whose only labels are `aria-label="From date"` and `aria-label="To date"` — visually they are two identical boxes side by side with nothing distinguishing them. `.filter-row &gt; * { flex: 1 1 130px; min-width: 130px }` forces a wrap to two rows below ~410px, so on a 390px phone roughly 100px of the first screenful is filter chrome before any number appears. The two date boxes stay live and editable even while a named preset is selected, and touching either one silently switches the preset to "Custom" (`:2775`).
- **Impact:** `ui-guidelines.md` requires the most important information first and reduced clutter on the Dashboard; the screen currently leads with configuration. An untrained user cannot tell which box is the start of the range, and can silently break a preset they thought was fixed.
- **Recommendation:** Keep the preset select visible; hide the two date inputs unless the preset is "Custom", and when shown give them visible "From" / "To" text labels rather than `aria-label` only.
- **Effort:** S

---

### UI-08 — "Planned Left" does not describe what it shows, and its zero state is ambiguous

- **Severity:** Medium
- **Location:** Markup `index.html:1357-1365`; render `:4667-4675`
- **Evidence:** The third Dashboard tile is captioned **"Planned Left"**. The rendered value is coloured green when positive and red when negative (`:4674`). When no planned expenses fall in the period the tile renders **"₮0" in grey** — wording and figure identical to a period whose plan has been entirely consumed. No sub-line, tooltip or caption distinguishes the two, and the phrase "Planned Left" reads to an untrained user as "budget I still have to spend".
- **Impact:** One of three headline numbers on the app's primary screen is not self-explanatory, and its most common state — a new user with no plan — reads as "you have nothing left".
- **Recommendation:** Rename the tile so the caption matches the quantity displayed, and render the no-plan case as "—" with a "No plan set" sub-line instead of ₮0.
- **Effort:** XS

*(I am reporting the label and the zero state only. Whether the computed figure is right is Code Review's evidence domain.)*

---

### UI-09 — Salary Calculator requires payroll knowledge, and repeats its own figures

- **Severity:** Medium
- **Location:** `index.html:1400-1470`
- **Evidence:** Input labels read "SI %", "WHT %", "OT Hours (×1.5)", "NT Hours (×1.2)", "OT+NT Hours (×1.8)", "Field Allowance / day (₮)". SI and WHT are never expanded anywhere on the screen and arrive pre-filled with 11.5 and 10 (`:1447`, `:1451`) with no explanation of what they are or where the rates come from. The only helper text on the entire screen belongs to Hourly Rate (`:1418`). Separately, the summary card already prints Gross, SI, WHT and SI+WHT (`:1405-1408`), and the Breakdown card below reprints Gross (`sGross2`, `:1464`) and SI+WHT (`sDeductions2`, `:1465`) — the same four figures rendered twice on one screen.
- **Impact:** `project.md` states the target user has little accounting knowledge and that **every screen should be understandable without training**. This screen is the clearest deviation from that, and the duplication adds clutter that `ui-guidelines.md` asks to remove.
- **Recommendation:** Expand the acronyms in the labels ("Social Insurance (SI) %", "Withholding Tax (WHT) %") with one line of `.helper` text each, and delete the duplicated Gross and SI+WHT tiles from the Breakdown card.
- **Effort:** S

---

### UI-10 — Several interactive controls are below the 44×44 px minimum

- **Severity:** Medium
- **Location:** `.convert-btn` `index.html:1169-1174`; `.advisor-more` `:1084-1088`; `.notif-item .notif-actions button` `:517-521`; `.qa-edit-btn` `:1100-1104`, `.qa-save` `:1111-1114`, `.qa-cancel` `:1115-1118`; `.barchart.compact .col` `:880`
- **Evidence:** `.convert-btn` is `padding: 6px 0 0 0` at 12px → roughly 24px tall, and it is the *only* entry point to the currency converter, present on both the Income and Expenses forms (`:1486`, `:1519`). `.advisor-more` is `padding: 6px 0` at 13px → ~26px. The reminder-sheet actions "→ Mark as Actual" and "+ Add to goal" are `padding: 6px 10px` at 12px → ~26px, and they commit real records (`:2998-3040`). The quick-amount edit/save/cancel controls are `padding: 8px …` at 13px → ~33px. Daily chart columns are `flex: 0 0 28px`, so each tappable day is 28px wide. The rest of the app does honour the rule — `.icon-btn` 44×44 (`:487`), `.chip` (`:911`), `.cal-cell` (`:1128`), list row actions (`:720`) — which makes these the exceptions rather than a house style.
- **Impact:** `ui-guidelines.md` sets 44×44 as a hard minimum. Mis-taps land on the controls that commit a planned expense as actual or add money to a goal.
- **Recommendation:** Add `min-height: 44px` and adequate horizontal padding to the five rule blocks listed; widen `.barchart.compact .col` to 44px and let the chart scroll further.
- **Effort:** S

---

### UI-11 — Chart and calendar figures are set below the declared type floor

- **Severity:** Medium
- **Location:** `.y-axis` `index.html:868`; `.val-inc`/`.val-exp`/`.val-zero` `:1152-1154`; `.barchart.compact .col .lbl` `:882`; `.cal-wkday` `:1126`; `.cal-cell .cal-val` `:1148`; `.st-label`/`.st-sub` `:941, 950`; scale declared `:71`
- **Evidence:** The type scale declares `--t-micro: 11px` as the smallest step. In practice: chart y-axis labels are **9px**, the income and expense value labels under every Monthly Trend column are **9px**, compact chart day labels are **9px**, calendar weekday headers and per-day totals are **10px**, and the Daily stat-tile labels and sub-lines are **10px**. These carry currency amounts and axis values. More broadly, of 126 `font-size` declarations in the file only 29 use a `--t-*` token, and `--t-h1: 28px` is declared but referenced nowhere.
- **Impact:** The numbers beneath the Monthly Trend and inside the calendar heatmap — the entire point of both cards — are the smallest text in the application, on the smallest screens. `ui-guidelines.md` asks for readable, consistently sized type.
- **Recommendation:** Raise the 9px and 10px declarations to `--t-micro` (11px); the compact chart will scroll marginally further, which it already supports. Route the remaining hardcoded sizes through the scale opportunistically.
- **Effort:** S

---

### UI-12 — Monthly Trend distinguishes income from expenses by red/green hue alone

- **Severity:** Medium
- **Location:** Legend `index.html:1392-1395`; bars and labels `:4843-4858`; label colours `:1152-1153`
- **Evidence:** Each month column renders two adjacent bars, `var(--success)` then `var(--danger)`, with two stacked value labels beneath in those same two colours and **no text distinguishing them** — a column reads as "₮1.2M" above "₮800K" with hue as the only key. The legend below the chart is two coloured squares labelled "Income" and "Expenses", so the mapping itself is also carried only by hue, and green/red is precisely the pair red-green colour blindness confuses. The `title` attributes ("Income ₮…", `:4851-4852`) are hover-only and do not exist on touch, which is the app's primary platform.
- **Impact:** Roughly 1 in 12 male users cannot tell which bar is income. On a finance dashboard that inverts the chart's meaning rather than merely degrading it.
- **Recommendation:** Prefix the two value labels with a hue-independent cue — "↑" for income and "↓" for expenses — reusing the arrows already established on the hero trend line (`:4660-4662`). One template change.
- **Effort:** XS

---

### UI-13 — The focus ring is below 3:1 against the page background

- **Severity:** Medium
- **Location:** Token `index.html:80`; applied at `:651-654` (inputs) and `:689-692` (all buttons, links, tabbables)
- **Evidence:** `--focus-ring: 0 0 0 3px color-mix(in srgb, var(--primary) 35%, transparent)`. In the default theme that composites to approximately `#AEC5F6` over `--bg #F8FAFC` — a contrast ratio of **≈1.7:1**. WCAG 2.4.11 requires 3:1 for a focus indicator. Every focusable element in the app routes through this one token, including the case where it sits on a `--primary`-filled button, where the separation is lower still.
- **Impact:** Keyboard users lose track of position. `ui-guidelines.md` requires visible focus indicators; this one is present but not perceivable at the required threshold.
- **Recommendation:** Change the single token — either raise the mix to ~70%, or replace with `outline: 2px solid var(--primary); outline-offset: 2px`, which stays visible on coloured buttons too.
- **Effort:** XS

---

### UI-14 — The Android Back button cannot close a modal or step back a screen

- **Severity:** Medium
- **Location:** `navigate()` `index.html:3291-3311`; `openModal`/`closeModal` `:3092-3114`; `manifest.json:7` (`"display": "standalone"`). No `pushState`, `popstate`, `history.` or `hashchange` occurs anywhere in the file.
- **Evidence:** Screen changes are pure class toggling and create no history entry, and none of the nine modal dialogs push one either. In an installed standalone PWA, the Android Back gesture therefore exits the app rather than dismissing the open bottom sheet or returning to the previous screen.
- **Impact:** The most-used navigation control on Android performs the most destructive available action mid-flow — the Edit Expense or Add Contribution sheet is abandoned and the app is dismissed. Users learn to avoid Back, or lose work repeatedly.
- **Recommendation:** Push one history entry in `openModal()` and call `history.back()` from the close path; add a `popstate` listener that dismisses the top of the existing `modalStack`. The stack already exists, so this is wiring, not new architecture.
- **Effort:** M

---

### UI-15 — Switching Actual/Planned silently discards typed input

- **Severity:** Medium
- **Location:** `index.html:3450-3469`
- **Evidence:** The segmented control's handler unconditionally clears `expAmount`, `expNotes`, `expRecFreq`, `expRecCustomWrap` and `expRecEnd` on every toggle (`:3460-3465`). A user who types an amount and a note, then realises the entry belongs under Planned, loses both with no warning and no undo. The two modes share every field except frequency.
- **Impact:** Silent loss of typed input in the app's single most frequent flow. The comment calls it preventing data "leaking across modes", but amount and notes are identically meaningful in both.
- **Recommendation:** Keep amount, notes and category across the switch; clear only the four recurrence fields, which are genuinely mode-specific.
- **Effort:** XS

---

### UI-16 — Settings does not contain the theme picker its own menu entry promises

- **Severity:** Medium
- **Location:** More sheet subtitle `index.html:1789-1798`; Settings screen `:1661-1737`; `cloudCard` `:1692` (`display:none`); theme button `:1316-1318`; `updateCloudUI` guard `:2346-2349`
- **Evidence:** The More sheet's Settings row reads *"Categories, types, cloud sync, theme, backup"*. The Settings screen contains Categories, Income Types, Notifications, Data Summary, Storage Status, Backup &amp; Restore and About. The theme picker exists only behind an unlabelled palette icon in the header (`#themeBtn`), and the Cloud Sync card is hidden unless a Firebase project is compiled into the source — so two of the five things the menu advertises are not there.
- **Impact:** A user who wants to change the theme is directed to the one screen that does not offer it, and has no reason to guess that an unlabelled header glyph is the answer. Sixteen themes were built and then made hard to find.
- **Recommendation:** Correct the More subtitle to describe what Settings contains, and add an "Appearance" card to the Settings screen with a button calling the existing `openThemePicker()`.
- **Effort:** XS

---

### UI-17 — Salary history is reachable only through a maintenance panel

- **Severity:** Medium
- **Location:** `openSalaryHistory()` `index.html:3975-3993`; wired at `:4004` and `:4013-4021`; Salary screen `:1400-1470`
- **Evidence:** Saving a calculation pushes to `db.salaries` (`:3372`) and toasts "Saved and added to Income". The only route back to those records is Settings → **Data Summary** → the "👁 View" button on the "Salary calculations" row — a card whose own helper text describes it as a force-clear tool: *"Use the ✕ buttons to force-clear a data type if something feels stuck. Non-reversible — export first."* (`:1704`). The Salary screen itself offers no link to its history.
- **Impact:** A core module's saved output is hidden inside a destructive-maintenance panel that a cautious user will deliberately avoid.
- **Recommendation:** Add a "History" secondary button next to Save on the Salary screen, calling the existing `openSalaryHistory()`.
- **Effort:** XS

---

### UI-18 — Design tokens are declared and then largely bypassed

- **Severity:** Low
- **Location:** Declarations `index.html:64-87`; usage throughout the stylesheet
- **Evidence:** The radius comment states *"3 values only"* (`:67-68`), but the sheet uses 3px (`:1150`), 4px (`:853`), 5px (`:996`), 6px (`:519, 1022, 1127`), 8px, 10px (`:507, 1011, 1046, 1188, 1215`), 12px, 16px (`:1279`) and 50%. Spacing: 60 declarations use off-scale values (3, 5, 6, 7, 9, 10, 11, 14, 18, 20, 22, 26, 30px) against a declared scale of 4/8/12/16/24/32/48. `--chart-axis` (`:62`) and `--t-h1` (`:71`) are declared and never referenced. Card metrics drift with it: `.card` is 12px radius / 12px bottom margin (`:544-551`), `.goal-card` 12px / **14px** (`:968-972`), `.stat-tile` **8px** radius (`:935-939`), `.notif-item` and `.advisor-tip` **10px** (`:507, 1073`).
- **Impact:** No screen fails, but surfaces do not visually line up and every new component re-decides values the token file already answered. `ui-guidelines.md` asks for an 8px spacing system and consistent card padding, radius and shadow.
- **Recommendation:** No redesign. Replace off-scale radii with `--r-sm`/`--r-md` and off-scale spacing with the nearest `--s*` step as each block is next edited, and delete the two dead tokens.
- **Effort:** M

---

### UI-19 — The two hero cards use opposite typographic hierarchies

- **Severity:** Low
- **Location:** `.hero-kpi` `index.html:566-602`; `.salary-summary` `:1156-1164`; markup `:1401-1410`; `.kpi` rules `:563-564`
- **Evidence:** The Dashboard hero pairs a 13px uppercase semibold label with a 36px bold value. The Salary summary card is `class="card salary-summary"` — **not** `.kpi` — so `.kpi .label` and `.kpi .value` (`:563-564`) never apply to it. `.salary-summary .label` sets only `color: #fff`, leaving the caption at the inherited 16px regular; `.salary-summary .value` sets only `color` and `font-size: 24px`, with no `font-weight` at all. The caption "Net Salary (this calculation)" therefore renders at two-thirds the size of the number it introduces, and the number is not bold.
- **Impact:** The headline figure on the Salary screen is visually weaker than its own caption, and the two hero cards do not read as the same component.
- **Recommendation:** Add `kpi` to the salary summary card's class list, or give `.salary-summary .label` and `.value` the same size and weight the Dashboard hero uses.
- **Effort:** XS

---

### UI-20 — Two date-entry patterns inside the same form

- **Severity:** Low
- **Location:** Expenses form `index.html:1515` (`&lt;input type="date" id="expDate"&gt;`) vs `:1539` (`&lt;input type="text" id="expRecEnd" readonly placeholder="📅 Tap — leave empty for unlimited"&gt;`); Goals `:1627`, `:1650`; picker `:1871-1886`
- **Evidence:** The Add Expense card asks for a date twice using two different mechanisms — the OS date picker for the entry date and a custom in-app calendar sheet for the recurrence end date. They differ in appearance, in placeholder convention, and in capability: the custom picker offers "Clear" and "Today" buttons (`:1882-1883`) that the native input does not.
- **Impact:** The user has to learn two date interactions on one screen and cannot predict which a given field will use. (Related to UI-05, which covers the keyboard consequence of the custom variant; this finding is about the inconsistency itself.)
- **Recommendation:** Route both through the existing `openDatePicker()`, which already handles Clear and Today, or both through native inputs — pick one.
- **Effort:** S

---

### UI-21 — Empty states use two different visual grammars

- **Severity:** Low
- **Location:** `emptyState()` `index.html:6264-6270` with `.empty-state` `:754-769`, versus the `.empty` one-liner `:753` used at `:2968, 3844, 3988, 4114, 4744, 5125, 5201, 5305, 5982`
- **Evidence:** Income (`:3415`), Expenses (`:3707`) and Goals (`:5669`) get the illustrated state — icon, title, and a sentence of guidance. Categories ("No categories."), Income Types ("No income types."), Planned vs Actual, Day details, Salary history, Goal history and the reminders sheet get a single grey sentence with no icon and, in most cases, no suggested next step.
- **Impact:** Minor inconsistency, but the plain variants also waste the moment where a first-run user is most receptive to being told what to do — the Settings screen is the first thing many users open.
- **Recommendation:** Leave the modal and in-card cases as they are where vertical space is tight; give the two Settings lists the illustrated component.
- **Effort:** S

---

### UI-22 — Tab bar accessible names do not match the visible labels

- **Severity:** Low
- **Location:** `index.html:1742-1745` (and `:1746-1761`); `titles` map `:3264`
- **Evidence:** The first tab shows the text **"Home"** but carries `aria-label="Dashboard"`, which fully replaces the visible text for assistive technology and voice control. The header title for the same screen is a third variant path — `titles.dashboard = 'Dashboard'`. The `aria-label`s on the remaining four tabs duplicate their visible `&lt;span&gt;` text and add nothing.
- **Impact:** A voice-control user saying "Home" does not activate the tab (WCAG 2.5.3, Label in Name); a screen-reader user and a sighted user cannot refer to the same control by the same word.
- **Recommendation:** Choose one word for the screen and use it in the tab text, in `aria-label` and in `titles`; drop the redundant `aria-label`s from the other four tabs.
- **Effort:** XS

---

### UI-23 — The PWA icon is declared maskable but drawn edge-to-edge from text

- **Severity:** Low
- **Location:** `expense-pwa/manifest.json:11-18`; `expense-pwa/icon.svg`
- **Evidence:** A single icon is declared `"sizes": "any", "purpose": "any maskable"`. The artwork fills the full 512×512 canvas and draws its own `rx="96"` rounded rectangle. The word "tracker" (`font-size="90"`, seven glyphs, centred at x=256, baseline y=380) spans roughly x=86 to x=426; its outer ends fall outside the central 80% safe zone a maskable icon must respect, so a circular Android mask clips them. Both glyph runs are `&lt;text&gt;` in a `system-ui` font stack rather than converted paths, so rendering depends on the launcher's available fonts — including the ₮ glyph. There is no PNG fallback of any size.
- **Impact:** The home-screen icon is the first thing a user sees of the installed app and can render clipped, double-rounded, or with substituted glyphs.
- **Recommendation:** Keep this file as the `purpose: "any"` icon and add a second manifest entry with `purpose: "maskable"` whose content sits inside the central 80%; convert the two text runs to paths.
- **Effort:** S

---

## Clean Areas

- **Loading states.** The only network-dependent action is the exchange-rate fetch, and it has all four states: loading ("Loading rates…", `:5432`), fresh, cached-with-age, and offline-stale with a warning, plus a distinct hard-failure message that tells the user what to do (`:5436-5452`). Storage status shows "Checking…" (`:1709`) before resolving.
- **Horizontal scrolling.** No page-level horizontal overflow was found in the layout rules at 320-430px: `.filter-row`, `.goal-meta`, `.alert-banner` and `.qa-row` all wrap; `.grid-3`, `.grid-4`, `.stat-strip`, `.icon-grid`, `.theme-swatches` and `.kpi-strip` all collapse at breakpoints. The only horizontal scrollers are the two `.trend-wrap` chart containers, which is intentional and contained.
- **Currency formatting.** `fmt()` (`:2602-2605`) is used uniformly, with the sign placed outside the symbol (`-₮450,000`, never `₮-450,000`), en-US grouping and integer rounding. `fmtCompact()` (`:2635-2645`) re-applies the sign after taking magnitude, so negatives group correctly, and `fmtCurrency()` (`:2392-2399`) follows the same sign rule for foreign currencies. Difference figures in Planned vs Actual are consistently `+₮…` / `-₮…` and are additionally worded ("over by", "under by") in the total line.

---

## Quick Wins

Findings at XS or S effort with Medium severity or higher.

- **UI-01** — One declared variable removes a release-blocking failure and a false data-loss banner.
- **UI-08** — A caption change and a "—" placeholder fix the third headline number on the primary screen.
- **UI-12** — Two arrow characters make the Monthly Trend readable without colour vision.
- **UI-13** — One token value brings every focus indicator in the app above 3:1.
- **UI-15** — Not clearing two fields stops silent input loss in the most frequent flow.
- **UI-16** — One Settings card and one corrected subtitle make sixteen themes findable.
- **UI-17** — One button on the Salary screen surfaces history that already renders correctly.
- **UI-03** — Swapping two tab slots moves a core module from three taps to one.
- **UI-04** — Three new colour tokens used in six text rules bring the app's primary figures to AA.
- **UI-05** — A `keydown` handler beside five existing `click` handlers unblocks keyboard users entirely.
- **UI-06** — One conditional stops the app telling users they have no data.
- **UI-07** — Hiding two inputs behind "Custom" puts the money first on four screens.
- **UI-09** — Expanding two acronyms and deleting two duplicate tiles fixes the least understandable screen.
- **UI-10** — `min-height: 44px` on five rule blocks clears the guideline's hard minimum.
- **UI-11** — Raising 9px and 10px to 11px makes the chart and calendar figures legible.

---

## Estimated UX Impact

Fixing the Critical and the four High findings changes five concrete things for the user. Editing an entry stops failing and stops accusing the app of losing their data — which today is the single most likely reason a user would abandon the product or, worse, wipe it by "restoring" over good data. Income stops being a hidden feature: the app's own onboarding tip no longer needs to print a navigation path, and the daily loop becomes one tap instead of three. Every currency figure in the two busiest lists becomes legible against its background, which is the difference between glancing at a balance and squinting at it. Keyboard-only users gain access to recurring plans and scheduled goals, which are currently unreachable rather than merely awkward. And once Budget Planning, Analytics and Reports have named destinations, the interface stops contradicting the product definition — a user told the app has eight modules can find eight modules.

The remaining Medium findings are what separates "works" from "trustworthy": the Dashboard leading with numbers instead of filters, empty states that describe the filter rather than the user's data, form input that survives a mode switch, and touch targets that hit on the first try. None of them block anyone, and all but two are half-day fixes or smaller.
