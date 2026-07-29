# UI/UX Review — Expense Tracker PWA

**Scope reviewed:** `D:\3_Claude\PowerApps\expense-pwa\index.html` (5,522 lines), `manifest.json`, `sw.js`, `icon.svg`
**Measured against:** `D:\3_Claude\PowerApps\knowledge\ui-guidelines.md`, `D:\3_Claude\PowerApps\knowledge\project.md`, reported per `D:\3_Claude\PowerApps\knowledge\review-conventions.md`

---

## Executive Summary

This is a genuinely capable application with a real design-token system, empty states on every list, confirmation on every destructive action, and a coherent visual language. It is let down by a systematic accessibility layer that was never built: 67 `&lt;label&gt;` elements exist and not one is associated with its input, the custom date picker and calendar are built from `&lt;div&gt;`s that no keyboard can reach, and the app's own 44×44 px touch-target rule is broken by the controls people press most — the 40×40 edit/delete buttons on every row and the 34×34 buttons on every goal card. The single biggest problem is that the semantic colours the app relies on to communicate money — `--success` for income, `--danger` for expenses, and the Needs/Wants/Savings tags — fail WCAG AA contrast at the sizes they are used, so the *amounts themselves* are the least readable text on the screen. Separately, the product does not match its own brief: `project.md` names eight core modules, and Analytics, Reports and Budget Planning appear nowhere in the interface.

## Overall Score

**66 / 100** — Band 60-74, "Usable but fragile. Multiple High findings."

The primary journey (open Dashboard → add an expense → read Analytics) works and looks professional, and no finding rises to Critical. But eight High findings — contrast, labelling, keyboard access, touch targets, silently-filtered entries, and two missing core modules — mean a meaningful share of 100,000 untrained users will hit real friction in normal use.

## Strengths

- **Destructive actions are handled properly.** Every delete goes through `confirmDialog()` (line 2561), a custom modal written specifically because native `confirm()` is blocked in installed iOS PWAs. Reset requires two confirmations (lines 3494-3498). Delete messages name the consequence ("is used by existing expenses… those entries will show Unknown"). This is better than most production finance apps.
- **Empty states exist for every list**, and the copy tells the user what to do next rather than stating the obvious (`emptyState()`, line 5479; e.g. income copy at line 2799).
- **A real token system exists** — spacing, radius, type, elevation and focus-ring scales are declared with intent (lines 38-54), and `prefers-reduced-motion` is respected (lines 511-514).
- **Money handling in the UI is disciplined**: one `fmt()` formatter (line 2145), live thousand-separator formatting with caret preservation (line 2202), and `toLocalISO()` used everywhere instead of `toISOString()` so dates never shift by timezone.
- **The Financial Advisor content is genuinely useful** — the rules are specific and actionable ("Planned ₮X, spent ₮Y. Either raise the plan or curb the spending").

---

## Findings

### Critical

None. No finding in this review causes data loss, produces a wrong financial figure, or makes the app unusable.

---

### High

**UI-01 — Interactive targets across the app are below the mandated 44×44 px**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — `.list-item .actions button` (lines 662-667, 40×40); `.goal-actions button.goal-icon-btn` (lines 953-957, 34×34); `.goal-add` (lines 947-951, ≈33 px tall); `.segmented button` (lines 776-780, ≈31 px); `button.secondary` / `button.danger` (lines 630, 636, 40 px); `.chip` / `.chip-mini` (lines 855, 865, 32 px); `.notif-item .notif-actions button` (lines 489-493, ≈26 px); `.cal-nav button` (line 1061, ≈34 px); `.qa-btn` (lines 1031-1036, ≈33 px); `.close-x` (line 1184, ≈26 px); Data Summary clear buttons (lines 3305-3306, `padding:2px 8px; font-size:11px`, ≈17 px tall)
- **Evidence:** `knowledge/ui-guidelines.md` states "Minimum touch target 44x44 px". The base `button.primary` and `input` rules honour it (lines 599, 616), but every secondary control does not. The 40×40 row buttons are Edit and Delete, sitting 4 px apart (`gap: var(--s1)`) on every income row, expense row, category row, income-type row and contribution row — the highest-frequency controls in the product, adjacent, one of them destructive.
- **Impact:** Mis-taps on mobile. Because Edit and Delete are adjacent and both undersized, the realistic failure is a user intending to edit and hitting delete. The confirm dialog catches it, but it is friction on the most repeated action in the app. The 17 px Settings clear buttons are effectively un-tappable.
- **Recommendation:** Raise `.list-item .actions button` and `.goal-icon-btn` to 44×44 and increase the gap to `var(--s2)`; add `min-height: 44px` to `button.secondary`, `button.danger`, `.segmented button`, `.qa-btn`, `.cal-nav button` and `.close-x`. Do not resize `.chip` (32 px is acceptable for a dense filter row) but increase its vertical padding to 36 px. Give the Settings clear buttons the `.chip-mini` treatment already used by the adjacent View button.
- **Effort:** S

**UI-02 — Amounts, group tags and chart labels fail WCAG AA contrast**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — `.list-item .amount.pos/.neg` (lines 658-660); `.tag.needs/.wants/.savings` (lines 715-721); `.barchart .col .val-inc/.val-exp` (lines 1090-1091); `.hero-label` and `.hero-trend` (lines 553-563); `.salary-summary .label` (line 1095) and the Gross/SI/WHT line (line 1287); `.advisor-count.warning` (line 1006)
- **Evidence:** In the default Light theme, `--success` `#10B981` on the `.list-item` background `#F1F5F9` measures **2.34:1**, and `--danger` `#EF4444` measures **3.43:1**. Both are applied at `font-size: 15px; font-weight: 700`, which does not qualify as WCAG "large text" (that needs ≥18.66 px bold), so the required ratio is 4.5:1. Every income and expense amount in every list therefore fails. The `.tag` rule paints the same hue at 15% opacity as its own background — `.tag.wants` is `#F59E0B` on a ≈`#FEF3E0` tint, roughly **2.1:1**. `.val-inc` / `.val-exp` print real currency values at **9 px** in those same colours. `.hero-label` is white at `opacity: .85` over the `#3B82F6` end of the gradient, ≈**3.0:1** at 13 px. `knowledge/ui-guidelines.md` requires "WCAG AA contrast" and "High contrast".
- **Impact:** The numbers the entire product exists to communicate are the hardest text on the screen to read. This affects every user in poor light or on a dimmed screen, not only users with low vision, and it recurs on every screen.
- **Recommendation:** Add darker text-only variants of the three status colours (e.g. `--success-text: #047857`, `--danger-text: #B91C1C`, `--warning-text: #B45309` in light themes) and use them for `.amount`, `.tag`, `.val-inc`, `.val-exp` and the advisor badge, keeping the existing tokens for fills and bars. Raise `.hero-label`/`.hero-trend` opacity to 1 and darken the gradient's light stop. Raise `.val-inc`/`.val-exp` from 9 px to `var(--t-micro)`.
- **Effort:** M

**UI-03 — No form input in the application is programmatically labelled**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — 67 `&lt;label&gt;` elements, zero `for=` attributes; unnamed period-filter selects at lines 1210, 1358, 1391, 1450
- **Evidence:** A search for `for="` in the file returns zero matches. Every label is a standalone sibling: `&lt;label&gt;Date&lt;/label&gt;&lt;input type="date" id="incDate" /&gt;` (line 1365) is representative. The only correctly labelled inputs are the four notification checkboxes, which happen to wrap their input (lines 3354-3371). Additionally, `#dashPreset`, `#incPreset`, `#expPreset` and `#dailyPreset` have no label, no `aria-label` and no placeholder — the date inputs beside them do have `aria-label` (lines 1211-1212), so the omission is inconsistent as well as incorrect.
- **Impact:** A screen-reader user hears "edit, blank" for every field in the app and cannot complete a single form. Tapping a label does not focus its input, which costs sighted mobile users a precise tap on a small field. This is a WCAG 1.3.1 / 3.3.2 failure across the whole product.
- **Recommendation:** Add `for="&lt;id&gt;"` to each `&lt;label&gt;` (mechanical, the ids all exist), and add `aria-label="Date range preset"` to the four preset selects.
- **Effort:** S

**UI-04 — Core interactions cannot be reached or operated by keyboard**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — date-picker cells (line 4756), calendar heatmap cells (line 4260), stacked-chart columns (line 4385), currency-picker rows (line 4535); readonly date fields at lines 1422, 1510, 1533, 5137, 5159, 5292
- **Evidence:** All four interactive elements are `&lt;div&gt;`s with a `click` listener, no `tabindex`, no `role` and no key handler, so they are not in the tab order and cannot be activated. The goal deadline, recurring end date and first-contribution date are `readonly` inputs whose only opener is `inp.addEventListener('click', …)` — focusing them by keyboard does nothing, and even if the picker opened, no day is selectable. There are also **zero `&lt;form&gt;` elements** in the file, so pressing Enter in an amount field never submits; every add action requires reaching the button. `knowledge/ui-guidelines.md` requires "Keyboard friendly".
- **Impact:** Setting a goal deadline, a recurring end date or a currency is impossible without a pointer. Selecting a day on the Daily screen is impossible without a pointer. This blocks keyboard and switch users from whole features, and blocks everyone on a desktop from fast entry.
- **Recommendation:** Convert the four `&lt;div&gt;` groups to `&lt;button type="button"&gt;` (they already carry all needed data attributes; only CSS `display` and `background` need re-declaring), and add a `keydown` handler on the readonly date inputs for Enter/Space. Wrap the Income, Expense and Goal forms in `&lt;form&gt;` with `submit` handlers so Enter works.
- **Effort:** M

**UI-05 — Two of the eight core modules do not exist in the interface**

- **Severity:** High
- **Location:** `knowledge/project.md` lines 15-22 vs `expense-pwa/index.html` `titles` map (lines 2648-2656) and tab bar (lines 1621-1642)
- **Evidence:** `project.md` names eight core modules: Dashboard, Salary Calculator, Income, Expenses, **Budget Planning**, **Analytics**, **Reports**, Settings. The app ships seven screens — dashboard, salary, income, expenses, daily, goals, settings. A search for "Analytics", "Report" and "Budget Plan" in `index.html` returns one match, inside the Firebase setup instructions. "Daily Chart" and "Savings Goals" exist but are not in the module list; Budget Planning exists only as an unnamed "Planned" toggle inside Expenses; Reports has no equivalent at all beyond a JSON export.
- **Impact:** A user told the product has Reports cannot find them. More importantly for the team, the product and its brief have silently diverged, so every downstream prioritisation decision is made against a spec nobody is tracking.
- **Recommendation:** This needs a decision before code. Either (a) amend `project.md` to reflect the shipped module set — renaming "Analytics" to the existing Daily Chart screen and folding Budget Planning into Expenses explicitly — or (b) schedule the two genuinely missing modules. Do not build anything before the brief is reconciled.
- **Effort:** XL (needs a design decision first)

**UI-06 — Newly added entries silently disappear when their date falls outside the screen's active filter**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — `expAdd` handler (lines 2967-2995) and `renderExpenses()` (lines 2997-3007); same pattern in `incAdd` (line 2772) / `renderIncome()` (line 2790)
- **Evidence:** The add handler pushes the entry and calls the render function, which immediately filters by `getRange('exp')`. The default filter is "This Month" (line 3301). Adding a **planned** expense — which is by definition usually in a future month, e.g. next month's rent — saves the record, shows "Planned expense added", and then renders a list that does not contain it, with the count in the card header unchanged.
- **Impact:** The user sees a success toast and an unchanged, often empty, list. The rational conclusion is that the save failed, so they add it again — producing duplicate planned expenses that then corrupt the Planned-vs-Actual comparison and the Dashboard's "Planned Left" figure. This lands squarely on the app's target user, who has no mental model of the filter.
- **Recommendation:** After a successful add, compare the entry's date against the active range; if it falls outside, change the toast to "Added — hidden by the current date filter" and offer to switch the preset (or auto-switch to the preset containing that date).
- **Effort:** S

**UI-07 — Salary Calculator is unusable without prior payroll knowledge**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — Salary screen, lines 1284-1352
- **Evidence:** The screen presents "SI", "WHT", "SI+WHT", "NT Hours (×1.2)", "OT+NT Hours (×1.8)" and "Field Allowance / day". Neither "SI" nor "WHT" is expanded anywhere in the application. The only helper text on the screen is on Hourly Rate (line 1301). Three values are pre-filled with unexplained defaults: `11.5` for SI %, `10` for WHT % (lines 1330, 1334) and `50000` for field allowance (line 1322). `project.md` states the target user has "little accounting knowledge" and that "every screen should be understandable without training".
- **Impact:** The user cannot verify whether the pre-filled rates apply to them. The output is written straight into the Income ledger via "Save &amp; Add as Income" (line 2732), so a wrong assumption about SI/WHT propagates into the Dashboard, the Advisor and every trend chart. This is the one screen where a misunderstanding changes reported figures.
- **Recommendation:** Expand the abbreviations in the labels ("SI % — Social Insurance", "WHT % — Withholding Tax") and add a one-line `.helper` under each pre-filled field stating that the default is the standard Mongolian rate and should be checked against the user's payslip.
- **Effort:** S

**UI-08 — Settings ships a non-functional Cloud Sync feature with developer instructions**

- **Severity:** High
- **Location:** `expense-pwa/index.html` — Cloud Sync card (lines 1572-1579), `updateCloudUI()` (lines 2012-2016), `showFirebaseSetupGuide()` (lines 2043-2077)
- **Evidence:** `firebaseConfig` ships with empty strings (lines 1867-1874), so `isFirebaseConfigured()` is false and every user sees "⚠ Cloud sync NOT configured" plus a button labelled "📖 How to set up Firebase". That button opens an eight-step guide that instructs the user to create a Firebase project, publish Firestore security rules, and "Open `index.html` in a text editor… replace the empty values… save, upload to GitHub." The card's helper text simultaneously promises "Cloud sync stores your data safely in your Google account."
- **Impact:** For 100,000 non-technical users this is a prominent Settings card that promises the most valuable feature in the app (protection against iOS clearing PWA storage), then asks them to edit source code. It reads as a broken product, and it sits directly above the Storage Status card that warns their data may be deleted — so the user is alarmed and then denied the fix.
- **Recommendation:** When `isFirebaseConfigured()` is false, hide the Cloud Sync card entirely and move the setup guide into repository documentation. The Backup &amp; Restore card below it already gives the user a real, working answer to the same problem.
- **Effort:** S

---

### Medium

**UI-09 — Modals are not accessible dialogs**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `.modal-backdrop` / `.modal` (lines 1169-1184) and all nine modal instances (lines 1644-1777)
- **Evidence:** No modal carries `role="dialog"` or `aria-modal="true"`. A file-wide search for `Escape` returns two matches, both inside the inline category/income-type editors (lines 3169, 3445) — no modal closes on Escape. Focus is never trapped, never moved into the dialog except for two ad-hoc `setTimeout(… .focus(), 100)` calls (lines 4520, 5070), and never restored to the trigger on close. Background content stays in the tab order behind the backdrop.
- **Impact:** Keyboard users tab out of the open dialog into the page behind it and become lost; screen-reader users are not told a dialog opened. Everyone loses the near-universal Escape-to-cancel habit, which matters most on `#confirmModal`, the delete confirmation.
- **Recommendation:** Add `role="dialog" aria-modal="true"` and `aria-labelledby` pointing at each modal's existing `&lt;h3&gt;`; add one shared `keydown` listener that closes the topmost visible `.modal-backdrop` on Escape; store and restore the trigger element in the existing open/close helpers.
- **Effort:** M

**UI-10 — Status messages and screen changes are never announced**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `&lt;div class="toast" id="toast"&gt;` (line 1683), `toast()` (lines 2315-2320), `navigate()` (lines 2676-2696)
- **Evidence:** The toast element has no `role="status"` and no `aria-live`, so its text is never announced. Toasts are the app's only channel for success, validation and error feedback — "Income added", "Enter an amount", "Cloud load failed", "Invalid backup file format". `navigate()` toggles `.active` classes and updates the header text but does not move focus or announce the change.
- **Impact:** A screen-reader user gets no confirmation that anything they did worked, and no notification when it failed.
- **Recommendation:** Add `role="status" aria-live="polite"` to `#toast`, and in `navigate()` set focus to the `&lt;h1&gt;` (given `tabindex="-1"`) after switching screens.
- **Effort:** XS

**UI-11 — Validation errors appear only as a transient toast far from the field**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `incAdd` (line 2775), `expAdd` (lines 2971-2972), `goalAdd` (lines 5018-5029), `editModalSave` (lines 5345-5358)
- **Evidence:** Every validation failure calls `toast()`, which shows a pill at `bottom: 90px` (line 1162) for 1,800 ms and then vanishes. The invalid field is not marked and not focused. The only exception is the Salary hourly rate, which does get `.invalid` plus `.focus()` (lines 2734-2737) — proving the pattern exists but was not applied elsewhere.
- **Impact:** On a long form (the Goal form is roughly two screens tall), the message appears at the bottom of the viewport, unrelated to the field that caused it, and disappears before a slower reader finishes it. "Enter an amount" does not say which amount when the Goal form has both a target and a recurring amount.
- **Recommendation:** Extend the existing `.invalid` + `focus()` pattern (already styled at lines 1156-1159) to every validation branch, and keep the toast as a secondary cue.
- **Effort:** S

**UI-12 — Header reserves the top safe-area inset at its bottom, leaving a dead band on notched devices**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` lines 451-452
- **Evidence:**
  ```css
  padding: 14px 16px calc(14px + env(safe-area-inset-top)) 16px;
  padding-top: calc(14px + env(safe-area-inset-top));
  ```
  In the four-value shorthand, the third value is **bottom**. The following line correctly fixes `padding-top`, but the inflated bottom padding is never overridden. On an iPhone with a ~47 px top inset the header gains 47 px of empty space *below* the title.
- **Impact:** On the exact device class this PWA targets (the Settings copy at line 1591 calls out iOS Safari specifically), the sticky header is roughly 60% taller than intended with the title floating at the top of an empty band, on every screen. Nothing breaks, but the app looks unfinished on install.
- **Recommendation:** Change the shorthand's third value to `14px`.
- **Effort:** XS

**UI-13 — Dashboard KPI labels do not say what they measure**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — "Net Balance" (line 1216), "Planned Left" (line 1245); computation at lines 3897, 3912-3920
- **Evidence:** "Net Balance" is `totalIncome - totalExp` **within the selected date range**, not an account balance. "Planned Left" is `totalIncome - totalPlanned` — income minus planned spending, which is not "planned left". When `totalPlanned === 0` the tile shows `₮0` in grey (line 3915), which is indistinguishable from "you have nothing left".
- **Impact:** On the 1st of a month with the default "This Month" filter, the largest number on the Dashboard reads "Net Balance ₮0". A user with no accounting background reasonably concludes the app lost their money. "Planned Left ₮0" tells a user with no budget that their budget is exhausted.
- **Recommendation:** Rename to "Net This Period" and "Income Minus Plan"; when `totalPlanned === 0`, render "—" with the sub-label "No plan set" instead of `₮0`.
- **Effort:** XS

**UI-14 — The Financial Advisor card outranks the user's own data and nags on a fresh install**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — card markup lines 1251-1257; rules in `analyzeExpenses()` lines 3511-3838; `renderAdvisor()` line 3840
- **Evidence:** The advisor sits third on the Dashboard, above the Needs/Wants/Savings donut, Planned vs Actual and the Monthly Trend — i.e. above every chart of the user's actual data. Several rules fire on almost any dataset regardless of behaviour: "No emergency fund goal set up" fires as a `warning` for anyone with income and no goal named /emergen|rainy|safety/ (line 3681); "No savings goals set up yet" fires for anyone with income and zero goals (line 3794); "Savings only 0%" fires as `critical` for anyone who has not categorised spending as Savings (line 3556). The count badge (line 1254) renders a bare number with no unit — a user sees a red "17" with no idea what it counts.
- **Impact:** A user who has just logged their first expense is met with a red critical badge and warnings about things they have not set up yet. `ui-guidelines.md` asks the Dashboard to put "most important information first" and "reduce visual clutter"; advice generated from three data points is neither.
- **Recommendation:** Move the advisor card below the donut and Planned-vs-Actual, suppress "you haven't set X up" rules until the user has at least ~10 entries, and label the badge ("17 tips").
- **Effort:** S

**UI-15 — Currency figures can break in the middle of a number**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `word-break: break-all` on `.hero-value` (line 561), `.mini-value` (line 592), `.stat-tile .st-value` (line 885), `.cal-cell .cal-val` (line 1086), `.conv-val` (line 1113)
- **Evidence:** `break-all` permits a line break at any character, including between digits of a thousands group. `.mini-value` renders full `fmt()` output at 18 px bold inside a three-column grid; at a 421 px viewport each column is ≈124 px, so `₮123,456,789` wraps mid-number.
- **Impact:** A figure rendered as `₮123,4` / `56,789` across two lines is misread at a glance — and these are the Dashboard's Income, Expenses and Planned tiles.
- **Recommendation:** Replace `break-all` with `overflow-wrap: anywhere` on the container and switch `.mini-value` and `.st-value` to `fmtCompact()` (already implemented, line 2175) above a length threshold.
- **Effort:** XS

**UI-16 — Negative amounts render as "₮-5,000" and a deficit looks identical to a surplus**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `fmt()` (line 2145); `.hero-kpi` (lines 539-546); usages at lines 3900, 3999-4001, 4026
- **Evidence:** `fmt` is `'₮' + Math.round(n).toLocaleString()`, so a negative value produces the symbol *before* the minus sign: `₮-5,000`. The hero KPI is always the primary gradient — its background, colour and weight are identical whether Net Balance is +₮500,000 or −₮500,000; only the small `.hero-trend` line beneath (13 px at ≈3.3:1 contrast, see UI-02) distinguishes them.
- **Impact:** The one number the Dashboard is built around does not change appearance when the user is in deficit, and its sign is carried by a hyphen in a non-standard position. Users scanning quickly will miss it.
- **Recommendation:** Change `fmt` to place the sign first (`-₮5,000`); add a `.hero-kpi.negative` modifier that swaps the gradient for the danger hue when net &lt; 0.
- **Effort:** XS

**UI-17 — Category colours repeat after twelve categories and are the only key in the stacked chart**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `CATEGORY_COLORS` (lines 4127-4134), `categoryColor()` (lines 4131-4134), stacked segments (line 4375)
- **Evidence:** The palette holds 12 colours and is indexed with `idx % CATEGORY_COLORS.length`, so the 13th category is assigned exactly the same hex as the 1st. In the stacked daily chart, a segment carries no label — only a fill colour and a `title` tooltip, which does not exist on touch. The app ships with 9 default categories and encourages adding more via Settings.
- **Impact:** Once a user passes 12 categories, two different categories are indistinguishable in the chart and in the chip row, with no fallback. `ui-guidelines.md` warns against colour-only meaning by implication of its accessibility section.
- **Recommendation:** When the category count exceeds the palette length, vary lightness on the repeat cycle, and note in the chart helper text that tapping a day gives the labelled breakdown (that path already exists via `renderDaySelected()`).
- **Effort:** S

**UI-18 — Income and Salary Calculator are two taps deep with no back affordance**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — tab bar (lines 1621-1642), More sheet (lines 1644-1681), `MORE_TABS` (line 2675)
- **Evidence:** The five tab slots are Home, Expenses, Daily, Goals, More. Income — a core module in `project.md` and half of the app's data model — is only reachable through the More sheet, alongside Salary Calculator and Settings. Once on Income, Salary or Settings there is no back control; the tab bar highlights the generic "More" pill without indicating which sub-screen is open, and the only exit is another tab or reopening More.
- **Impact:** Logging income costs three taps against one for an expense, which will bias what users record and therefore skew every net figure and the Advisor's conclusions. `ui-guidelines.md`'s navigation expectation — that the user can reach the modules without guessing — is only partly met.
- **Recommendation:** The header title already identifies the screen, so the smallest fix is to promote Income into the tab bar in place of Daily (which is analysis, not entry) and move Daily into More. This is a tab-set change and should be agreed before implementation.
- **Effort:** M

**UI-19 — Placeholder text fails AA contrast in every theme**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `--placeholder` token per theme (lines 24, 71, 92, 114, 136, 158, 180, 203, 230, 254, 280, 303, 328, 351, 374, 399); rule at line 610
- **Evidence:** Light uses `#94A3B8` on `#FFFFFF` ≈ **2.6:1**; Kingfisher uses `#4FC3F7` ≈ **1.9:1**; Flamingo uses `#E39B9F` ≈ **2.2:1**. AA requires 4.5:1. Several placeholders carry the only affordance hint a control has: the readonly deadline and end-date inputs show nothing but `📅 Tap to choose date` / `📅 Tap — leave empty for unlimited` (lines 1422, 1510, 1533).
- **Impact:** Users cannot read the hint that tells them the field is tappable, so goal deadlines and recurring end dates look like broken, uneditable inputs.
- **Recommendation:** Darken `--placeholder` to at least the value of `--text-2` minus one step in each theme; for the readonly date fields, move the hint into a `.helper` line beneath the input instead of relying on placeholder text.
- **Effort:** S

**UI-20 — Cloud sync failures are silent and the UI keeps showing a stale success state**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `syncToCloud()` catch block (lines 1993-1998), status rendering (line 2028)
- **Evidence:** The catch does `console.error(e)` and nothing else. `lastCloudSync` is only updated on success, but `updateCloudUI()` still renders `Last sync: &lt;old time&gt;` afterwards, with the green "✓ Signed in" line above it. There is no error surface at all for a failed write.
- **Impact:** A user whose sync is failing sees a green checkmark and a timestamp, believes their data is backed up, and finds out otherwise only after losing the device. This is the highest-stakes silent failure in the product. (Reachable only once `firebaseConfig` is populated — see UI-08.)
- **Recommendation:** Set an error flag in the catch and render "⚠ Last sync failed — tap Sync now to retry" in `--danger` above the actions.
- **Effort:** XS

**UI-21 — Group colours and status colours are the same colours, and both change meaning between themes**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — token definitions per theme (e.g. lines 32-34 vs 28-31; sepia 95-100; rose 161-167; flamingo 331-337)
- **Evidence:** In the Light theme `--wants` and `--warning` are both `#F59E0B`, and `--savings` and `--success` are both `#10B981` — so a "Wants" tag is pixel-identical to a warning, and a "Savings" tag is pixel-identical to income. Across themes the group hues are not stable: `--needs` is blue `#3B82F6` in Light, dark red `#7C2D12` in Sepia, pink `#DB2777` in Rose, and `#E11D48` in Flamingo, where `--danger` is `#DC2626` — a Needs tag and an expense amount become near-identical reds.
- **Impact:** Colour cannot be used as a reliable carrier of meaning: the same hue means "Wants", "warning" and (in some themes) "expense". `ui-guidelines.md` requires consistent themes and warns against excessive colour. The tags do carry text labels, which is why this is not High.
- **Recommendation:** Define `--needs/--wants/--savings` once at `:root` from a palette that no status token uses, and stop re-declaring them per theme except where the background demands a lightness shift.
- **Effort:** M

---

### Low

**UI-22 — Type sizes drift outside the declared type scale**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — scale declared line 45; violations at lines 812 (9 px), 879/885/1064/1085/1086 (10 px), 676/1057 (14 px), 915 (17 px), 1020 (13.5 px), 1021/961 (12.5 px), 559 (36 px), 1096 (24 px), 1113 (30 px)
- **Evidence:** The file declares a six-step scale (`--t-micro: 11px` … `--t-h1: 28px`) and then uses at least ten hard-coded sizes outside it, including fractional values (12.5 px, 13.5 px) and sizes below the smallest declared step.
- **Impact:** No single instance fails, but the cumulative effect is that "small text" means five different things across the app, which is what `ui-guidelines.md` means by "Consistent sizing".
- **Recommendation:** Map each ad-hoc value to the nearest scale token; add one `--t-nano: 10px` step if the chart axes genuinely need it, rather than leaving 9 px floating.
- **Effort:** S

**UI-23 — Spacing values drift off the declared scale**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — scale declared line 39 (`4/8/12/16/24/32/48`); off-grid values at lines 418 (10 px), 478 (10 px), 488 (6 px), 786 (14 px), 794 (10 px), 909 (14 px), 999 (14 px), 1010 (10 px), 1110 (18 px 14 px), 1147 (10 px 12 px)
- **Evidence:** The comment at line 38 reads "use ONLY these values". Dozens of rules use 3, 5, 6, 10, 14 and 18 px directly.
- **Impact:** Vertical rhythm is inconsistent between cards — `.card` uses 16 px padding while `.advisor-card` overrides to `14px 16px` and `.goal-card` uses 16 px with a 14 px bottom margin against `.card`'s 12 px. Visible as slight misalignment when cards stack.
- **Recommendation:** Replace off-grid values with the nearest token; where 14 px was chosen deliberately, use `var(--s4)`.
- **Effort:** S

**UI-24 — Border radii and shadows exceed the declared three-value scales**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — scale declared line 42 ("3 values only": 8/12/999); violations at lines 479 (10 px), 797 (4 px), 934 (5 px), 949 (10 px), 955 (10 px), 967 (6 px), 986 (10 px), 1069 (6 px), 1179 (16 px), 3305-3306 (6 px); ad-hoc shadow at line 692
- **Evidence:** At least six radius values are in use against three declared. `.list-item.dragging` declares its own `0 12px 28px rgba(0,0,0,.25)` rather than using `--e3`.
- **Impact:** Cards, tiles and pills round at slightly different rates, which reads as imprecision rather than as intentional hierarchy. `ui-guidelines.md` asks for consistent radius and shadows.
- **Recommendation:** Snap all radii to `--r-sm` / `--r-md` / `--r-full` (the modal's 16 px top corners are a legitimate sheet exception — add a fourth token for it), and replace the ad-hoc drag shadow with `var(--e3)`.
- **Effort:** S

**UI-25 — Two different empty-state treatments**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — rich `emptyState()` at lines 5479-5485 (used at 2799, 3007, 4891) vs plain `.empty` at line 697 (used at 3136, 3405, 3989, 4083, 4358, 4429, 5204, 3280, 2459)
- **Evidence:** Income, Expenses and Goals get an illustrated state with an icon, a title and guidance. Categories, income types, Planned vs Actual, both charts, day detail, salary history, goal history and reminders get a single grey sentence.
- **Impact:** The nine plain states also give less help — "No categories." tells a new user nothing about what to do, while the rich states do. Every list has *some* empty state, so nothing is broken.
- **Recommendation:** Route the list-shaped cases (categories, income types, goal history) through `emptyState()` with the existing `category` icon; leave chart placeholders plain.
- **Effort:** XS

**UI-26 — Dates are shown as raw ISO strings in most places and long-form in one**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — raw `${x.date}` at lines 2807, 3024, 3276, 5197; goal meta line 4909; reminders lines 2377, 2397; Peak day line 4214; long-form at line 4425
- **Evidence:** List rows, reminders and goal deadlines print `2026-07-14`. The day-detail card title prints `Jul 14, 2026`. Both formats exist in the same session, sometimes on the same screen (Daily).
- **Impact:** ISO dates are unambiguous but unfamiliar to a non-technical audience, and the inconsistency makes the interface feel machine-generated.
- **Recommendation:** Add one `fmtDate()` helper next to `fmt()` and use it at all display sites; keep ISO for storage and for the native `&lt;input type="date"&gt;` values.
- **Effort:** S

**UI-27 — A tab button's accessible name differs from its visible label**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` lines 1622-1625
- **Evidence:** `&lt;button data-nav="dashboard" … aria-label="Dashboard"&gt;` contains `&lt;span&gt;Home&lt;/span&gt;`. The `aria-label` overrides the visible text, so the accessible name is "Dashboard" while the user sees "Home".
- **Impact:** WCAG 2.5.3 (Label in Name) failure — a voice-control user saying "tap Home" gets no match. The `aria-label` is redundant here in any case, since the button already has a text label.
- **Recommendation:** Remove `aria-label` from the four tab buttons that already contain a `&lt;span&gt;` label, or change it to "Home".
- **Effort:** XS

**UI-28 — `role="tablist"` is applied without the rest of the tab pattern**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — lines 1385-1388, 1438-1447, 5271-5274
- **Evidence:** The segmented controls declare `role="tablist"` and `role="tab"` with correctly maintained `aria-selected`, but there is no `aria-controls`, no element with `role="tabpanel"`, no `id` linkage, and no arrow-key navigation or roving `tabindex`.
- **Impact:** A screen-reader user is told they are in a tab list and then finds none of the behaviour that promise implies. Simple buttons would be announced more accurately.
- **Recommendation:** Either complete the pattern (add `aria-controls` and `role="tabpanel"` on the region each toggle switches, plus arrow-key handling) or drop the roles and rely on `aria-pressed`.
- **Effort:** XS

**UI-29 — PWA install presentation: dark splash against a light app, and a maskable icon whose wordmark falls outside the safe zone**

- **Severity:** Low
- **Location:** `expense-pwa/manifest.json` lines 9, 11-18; `expense-pwa/icon.svg` line 11
- **Evidence:** `background_color` is `#0f172a` (dark navy) while the default theme's `--bg` is `#F8FAFC` (near-white), so cold start flashes dark then jumps to light. The single icon is declared `"purpose": "any maskable"`, but maskable icons require content inside a centred circle of 80% diameter (radius 205 px at 512 px); the word "tracker" at `y=380`, `font-size=90` extends to roughly ±175 px horizontally and 124 px below centre — a corner distance of ≈214 px, outside the safe zone. There is also no PNG fallback for platforms that do not rasterise SVG icons, and the SVG relies on `system-ui` being available to the rasteriser.
- **Impact:** A visible colour flash on every launch, and a home-screen icon whose wordmark may be clipped or, on platforms without SVG icon support, replaced by a generic glyph.
- **Recommendation:** Set `background_color` to `#F8FAFC`; either shrink/reposition the wordmark inside the safe zone or declare the SVG `"purpose": "any"` and add a separate padded 512 px maskable PNG.
- **Effort:** XS

**UI-30 — Long unbroken note text can push list rows past the viewport**

- **Severity:** Low
- **Location:** `expense-pwa/index.html` — `.list-item` (lines 650-655); row markup at lines 2804-2816 and 3021-3034
- **Evidence:** `.list-item` is `display: flex` and neither child declares `min-width: 0`, so flex items cannot shrink below their content width. The `.meta` line interpolates user-entered notes with no wrapping rule. Other rows in the same file *do* guard this (`min-width:0` at lines 4451, 4930), so the omission is inconsistent.
- **Impact:** A note containing a long unbroken string (a pasted URL or reference number) widens the row and introduces page-level horizontal scrolling, which `ui-guidelines.md` prohibits. Notes with spaces wrap normally, so this only triggers on specific input.
- **Recommendation:** Add `min-width: 0` to the `.list-item` text column and `overflow-wrap: anywhere` to `.list-item .meta`.
- **Effort:** XS

---

## Area Summaries

- **Layout and hierarchy** — Dashboard order is sound (hero, then KPI strip, then charts) but the Advisor card interrupts it (UI-14) and two of the three KPI labels are wrong (UI-13).
- **Navigation** — Current location is always shown in the header; the tab set does not match the module brief (UI-05, UI-18).
- **Typography** — Clear hierarchy, drifting sizes (UI-22).
- **Colour and theme** — Income/expense semantics are consistent within a theme; group and status colours collide, and contrast fails at small sizes (UI-02, UI-21).
- **Spacing** — Nothing cramped; the declared scale is not enforced (UI-23).
- **Cards** — Padding is consistent apart from `.advisor-card`; radius and shadow drift (UI-24).
- **Mobile** — Layout holds down to 320 px and no screen scrolls horizontally under normal input; touch targets are the failure (UI-01, UI-30).
- **Accessibility** — The weakest area by a wide margin (UI-02, UI-03, UI-04, UI-09, UI-10, UI-19, UI-27, UI-28). Focus rings themselves are correctly implemented (`:focus-visible`, lines 644-647) — the problem is that half the interactive elements are not focusable at all.
- **States** — Empty states exist everywhere (two treatments, UI-25); loading states cover every async path; **every destructive action is confirmed — this area is clean**; error states exist but one is silent (UI-20) and one is transient (UI-11).
- **Numbers and formatting** — One formatter, consistent symbol, consistent rounding. Negative sign placement (UI-16) and mid-number wrapping (UI-15) are the defects.

---

## Quick Wins

XS or S effort, Medium severity or higher.

- **UI-12** — One character change (a `calc()` to `14px`) removes a 47 px dead band from every screen on every notched iPhone.
- **UI-13** — Renaming two labels and rendering "—" instead of "₮0" removes the app's most alarming misreading.
- **UI-16** — Moving the minus sign inside `fmt()` fixes negative display everywhere at once.
- **UI-15** — Swapping `break-all` for `overflow-wrap: anywhere` stops currency figures splitting mid-digit.
- **UI-10** — Two attributes on the toast element make every success and error message audible.
- **UI-20** — Four lines in an existing catch block stop the app claiming a backup succeeded when it failed.
- **UI-03** — Adding `for=` to 67 labels is mechanical, needs no design input, and unblocks screen-reader use of every form.
- **UI-01** — CSS-only size increases on eight selectors bring the app in line with its own 44 px rule.
- **UI-06** — One range check after add stops entries silently vanishing and prevents duplicate planned expenses.
- **UI-08** — Hiding one Settings card removes a developer-facing feature from a consumer product.
- **UI-07** — Expanding "SI"/"WHT" and annotating three defaults makes a core module self-explanatory.
- **UI-19** — Darkening one token per theme makes hint text legible.
- **UI-11** — Reusing the `.invalid` pattern that already exists for Hourly Rate ties errors to fields.
- **UI-14** — Reordering one card and gating three advisor rules de-clutters the Dashboard for new users.
- **UI-17** — A lightness variation on the palette repeat keeps the stacked chart readable past 12 categories.

---

## Estimated UX Impact

With the Critical and High findings resolved (there are no Critical), the app becomes usable by people it currently excludes and stops losing users at the point of first entry. Screen-reader and keyboard users gain access to forms, date selection and the Daily screen — features that are today completely closed to them. Every money figure in every list becomes legible at AA contrast, which benefits all users on a phone in daylight, not only those with low vision. Row-level Edit and Delete stop being a coin flip on a small screen. Most importantly, adding a planned expense for next month will no longer look like a failed save, which removes the duplicate-entry loop that currently corrupts the Planned-vs-Actual comparison and the Advisor's conclusions. The Salary Calculator becomes a screen a user can complete correctly without asking someone, and Settings stops asking them to edit source code. What remains after that is consistency work — spacing, radius, type scale, date formatting — which affects perceived quality rather than task success, plus the unresolved product question of whether Analytics and Reports are being built or being removed from the brief.
