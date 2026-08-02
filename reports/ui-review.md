# UI Review — expense-pwa (Round 6)

## Executive Summary

Round 5's contrast work landed and it landed properly: the advisor badge now sets a foreground per state, `.hero-label`'s opacity is gone, the calendar heat ramp is capped per theme with `--heat-max`, and `check-contrast.mjs` carries the V6 unused-token assertion — all verified against source rather than against the commit messages. Navigation, states, modal focus management, destructive-action confirmation and currency formatting are all clean and stay clean. The single biggest problem this round is not a design decision, it is that **three items from the round-5 batch are not actually on disk in the state the batch reports**: two of the three shipped PNG icons render as a blank white tile, `WORK-84(b)`'s paint-order change to `.hero-kpi::before` was approved and never made, and `WORK-82`'s quick-amount fix opened a new dead end where the feature can be permanently deleted from the UI. Everything else is a small set of Lows, including one census comment that returned eighteen lines below the comment that forbids censuses.

## Overall Score

**87 / 100.** No Critical and no High: no figure is wrong, no module is unusable and no path loses data. It sits below the 90 band because a shipped asset is visibly broken on the platform the app itself tells users to install to, one approved AA item did not land at all, and a round-5 fix created a new unrecoverable state — three defects that a "rounds 4 and 5 fully implemented" claim does not survive.

## Strengths

- **The round-5 contrast set is genuinely closed, and I re-derived it rather than reading the commits.** `.advisor-count.good/.warning/.critical` set `--on-success`/`--on-warning`/`--on-danger` (index.html:1442-1444); `.hero-label` has no `opacity` (index.html:895-910); `--heat-max` is declared per theme and the ramp is clamped to it (index.html:6120-6123); the pair table gained the `primary-hover` and heat-cell rows (check-contrast.mjs:104, 108) and the V6 unused-token assertion (check-contrast.mjs:270-279). The token that fingerprinted the worst finding of last round is now used and machine-policed.
- **`renderDashboard()`'s early return is done the way an early return has to be done.** The guard at index.html:5703 is preceded by an explicit containment audit naming the one element that was outside `#dashboard` and why it had its own guard, plus a standing instruction for the next editor. That is the correct shape for a change whose failure mode is silence.
- **States and destructive actions remain complete.** Every list has both an empty and a filtered-empty state with an escape hatch (index.html:4312, 4686, 6840, 7502); all eleven destructive paths route through `confirmDialog()` and Reset is double-confirmed; the modal stack traps Tab, handles Escape, restores focus and owns Android Back (index.html:3867-3924); `fmt()`, `fmtCompact()` and `fmtCurrency()` all put the sign outside the symbol.

## Findings

---

**UI-01 — Two of the three shipped PNG icons render as a blank tile**

- **Severity:** Medium
- **Location:** `expense-pwa/icon-180.png`, `expense-pwa/icon-192.png`; referenced at `expense-pwa/index.html:40`, `expense-pwa/manifest.json:24-35`, `expense-pwa/sw.js:9-10`
- **Evidence:** I opened all three PNGs. `icon-512.png` renders correctly: the white tugrik mark on the blue gradient, full-bleed, matching `icon-maskable.svg`. `icon-180.png` and `icon-192.png` both render as an almost entirely **white** square with a thin blue vertical band down the right edge — no mark, no gradient field. Two separate files show the identical anomaly against one correct control, so this is the assets, not the viewer. Separately, `index.html:35-40` states the 180px file was *"Rendered from icon-maskable.svg at 180px"*, which is the wrong source for `apple-touch-icon`: iOS applies a squircle that trims corners only, it does not honour a maskable safe zone. The maskable artwork's mark is 220 units wide on a 512 canvas (`icon-maskable.svg:23-26`) against 300 in `icon.svg:21-24`, so even a correct export from that source would put the mark on the iOS home screen at ~73% of its intended linear size on a square-cornered field.
- **Impact:** On iOS the installed home-screen tile is a blank white square — the exact platform whose storage eviction the app's own Storage Status card (index.html:2183-2186) and About card (index.html:2205-2208) tell users to mitigate *by installing to the home screen*. On Android the 192px maskable icon is what most launchers use. This was UI-13 last round, approved as WORK-91, and the asset that shipped is worse than the SVG fallback it replaced.
- **Recommendation:** Re-export `icon-192.png` from `icon-maskable.svg` and `icon-180.png` from `icon.svg` (the "any" artwork — apple-touch-icon is not maskable), and open each file to confirm before committing. While the manifest is open, add a `"purpose": "any"` PNG entry: today both raster entries are `maskable` only (`manifest.json:28, 34`), so the only `any` icon is an SVG.
- **Effort:** XS

---

**UI-02 — Emptying the quick-amount editor deletes the feature with no way back**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:7055-7095` — the fallback at `:7058`, the render loops at `:7060` and `:7071`, the filter at `:7089`
- **Evidence:** `db.settings.quickAmounts` is written in exactly one place, `:7089`, as `newAmounts.filter(v =&gt; v &gt; 0)`. Clear all three inputs (or type `0` into all three) and press ✓ Save, and the stored value becomes `[]`. `renderQuickAmountRow()` then reads `db.settings.quickAmounts || [50000, 100000, 200000]` at `:7058` — `[]` is truthy, so the default never applies. In display mode `[].map(...)` renders zero buttons and only the ✎ Edit pill; **in edit mode it renders zero inputs**, leaving ✓ Save and Cancel over nothing. There is no other writer: grep for `quickAmounts` returns the validator at `:3179-3187`, the read at `:7058` and the write at `:7089`, and nothing in `load()` seeds it. The only recoveries are Reset All or restoring a backup, both of which discard other work.
- **Impact:** The quick-amount row sits on both the Income and the Expenses add forms — the app's two most-used screens — and is the fastest path to a common amount. A user who clears the boxes intending to retype them loses the control permanently and is given no message saying so. This state is reachable from the editor itself, which is what makes it a defect rather than an edge case; it was created by WORK-82's `.filter(v =&gt; v &gt; 0)`, which correctly stopped storing zeroes and did not consider the empty result.
- **Recommendation:** Make the fallback length-aware and give the editor a floor: read `const amounts = db.settings.quickAmounts?.length ? db.settings.quickAmounts : [50000, 100000, 200000];` at `:7058`, and in edit mode render three slots regardless (`(amounts.length ? amounts : ['','',''])`), so an empty list can always be refilled. Two expressions, one function.
- **Effort:** XS

---

**UI-03 — Analytics: the calendar heatmap ignores the screen's own date-range filter**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — filter row `:2019-2025`, `renderDaily()` `:6021-6028`, `calDate` `:5984`, `renderCalendar()` `:6071-6101`, month nav `:6148-6155`
- **Evidence:** One filter row sits at the top of the Analytics screen, above everything. `renderDaily()` passes `{from, to}` into `renderDailyStats()`, `renderDailyChips()` and `drawDailyStackedChart()` — all three obey it. `renderCalendar()` takes no range argument at all: it reads the module-level `calDate`, initialised to the current month at `:5984` and mutated only by the ◀/▶ buttons at `:6148-6155`. Nothing in `initPeriodFilter('daily', renderDaily)` or in the preset `change` handler (`:3500-3505`) touches `calDate`. So selecting "Last Month" moves the four stat tiles, the category chips and the Daily Breakdown chart to July while the Calendar View stays on August, with only its own small month label to say so.
- **Impact:** For a user with no training, one control at the top of a screen governs that screen. The Peak day tile can report a date the calendar is not showing, and the calendar's own helper text (`:2058`) mentions the mode toggle and tapping a day but never says the card is on a separate clock. The heatmap is the module's most visual artifact, and it can silently answer a different question from the three cards above it.
- **Recommendation:** Sync on preset change only, not on every render, so the ◀/▶ arrows keep working: after `applyPreset()` in `initPeriodFilter`'s change handler, when `prefix === 'daily'` and `from` is non-empty, set `calDate` to the first of `from`'s month before calling `onChange()`. All-Time leaves `calDate` where it is.
- **Effort:** S

---

**UI-04 — The Salary breakdown tiles are the one headline-figure class with no wrap guard, and the grid overflows because of it**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html` — `.kpi .value` `:861`, the two-column card `:1899-1907`, `.grid-2` `:850`
- **Evidence:** Four of the app's five headline-figure classes carry a break guard — `.hero-value` `overflow-wrap: anywhere` (`:914`), `.mini-value` (`:950`), `.stat-tile .st-value` (`:1310`), `.conv-val` (`:1599`). `.kpi .value` at `:861` does not. It is used by the five tiles in "Where the gross comes from" (`:1902-1906`), which sit in `.grid-2` — `grid-template-columns: 1fr 1fr` with **no** breakpoint, unlike `.grid-3` (420px, `:852`) and `.grid-4` (520px, `:854`). `1fr` is `minmax(auto, 1fr)`, and a grid item's automatic minimum is its min-content size; with no break opportunity in `₮1,250,000`, min-content is the whole unbroken string. Track arithmetic at a 360px viewport: `main` padding 16 leaves 328; card border 1 + padding `--s4` each side leaves 294; minus the 12px gap gives 141 per column; minus the tile's own border and `--s4` padding leaves **107px** of content box against roughly 110px for a seven-figure amount at 22px bold. At 320px the available width is 87px. Below the threshold the tracks refuse to shrink and the card, then `main`, overflows horizontally. (The widths are computed from the declared values, not measured in a browser — the consistency gap against the four sibling classes is the primary evidence.)
- **Impact:** Seven-figure amounts are the normal case in MNT — the screen's own default field allowance is ₮50,000/day. On 320–375px phones (iPhone SE, 12/13 mini) the Salary Calculator, a named core module, can push the page into horizontal scrolling, which `knowledge/ui-guidelines.md` rules out without qualification.
- **Recommendation:** Add `overflow-wrap: anywhere;` to `.kpi .value` at `:861`, matching the four sibling classes. That sets min-content to one character and the tracks collapse correctly. One declaration; no breakpoint needed.
- **Effort:** XS

---

**UI-05 — `WORK-84(b)` did not land: `.hero-kpi::before` still paints above the scrim, and above the hero text**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:887-892`, `.hero-kpi` background `:878-880`; `tools/check-contrast.mjs` PAIRS `:52-115`
- **Evidence:** The architect approved this as its own commit with its own visual check (`reports/chief-architect.md`, WORK-84 row and Step 5), and the source is unchanged: `.hero-kpi::before` is still a `position: absolute` pseudo-element filling `rgba(255,255,255,.07)`, and `.hero-kpi`'s `background` at `:878-880` still lists exactly two layers (scrim, gradient) with no third. Grep for `hero-kpi` returns only `:864`, `:887` and the markup at `:1763`. No pair-table row covers it either. The new fact beyond round 5's UI-06(b): as a positioned descendant with `z-index: auto`, the circle paints in step 8 of the painting order while `.hero-label`, `.hero-value` and `.hero-trend` are non-positioned in-flow blocks painting in steps 3 and 7 — so the veil is over the **text as well as** the ground. `--on-hero` is `#FFFFFF` in all sixteen theme blocks, so 7% white over white text is a no-op and the ground lift is unopposed. The circle occupies the card's top-right 140px square, which at a 360px viewport covers the right ~100px — reached by the 36px `.hero-value` itself once the figure passes about seven characters, not only by `.hero-trend`.
- **Impact:** Slate's light gradient stop measured 4.54:1 → 3.99:1 under the circle last round; that is unchanged. It affects the app's most-looked-at surface but only in one corner and only at longer values, which is why it was Low then and stays Low. What is new is that the commit message for the contrast pass claims *"every painted surface is in the table"* while this surface is neither in the table nor removed from the question — the project's named failure mode, in the batch that was meant to close it.
- **Recommendation:** As approved: move the highlight into `.hero-kpi`'s `background` list as a third layer *below* the scrim gradient (a `radial-gradient` at the same position), and delete the `::before` rule. It then sits under the scrim the alphas were derived against and needs no pair-table row.
- **Effort:** XS

---

**UI-06 — The button rule's census returns eighteen lines below the comment that forbids censuses**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:983-987` (the convention) and `:1004-1006` (the override list)
- **Evidence:** WORK-70's approval condition was that the count be replaced by a class statement. The main comment complies, and says so explicitly: *"No exceptions, and no count — this comment previously said 'three places got this wrong'… State the rule, not the tally."* Eighteen lines below, `:1004-1005` reads *"**The three** siblings-in-a-row. Each shrinks to its label…"* above `#sHistory, #dayDetailClose, #settingsThemeBtn`. The sentence is already false: `.notif-item .notif-actions button` at `:821` is a fourth sibling-in-a-row rule (added by WORK-70 itself), and at least a dozen more buttons set their own width inline — `#sSave` `:1916`, `#btnImport`/`#btnReset` `:2193-2194`, `#editModalCancel`/`#editModalSave` `:2308-2309`, `#converterCancel`/`#converterUse` `:2368-2369`, `#dpClear`/`#dpToday` `:2385-2386`, `#confirmCancel`/`#confirmOk` `:2396-2397`.
- **Impact:** Nothing renders wrong. This is the class the architect named as the project's real defect — a true-sounding count written beside code that does not hold it — reintroduced by the commit whose whole purpose was to remove it, which is why it is worth thirty seconds now rather than a fifth round later.
- **Recommendation:** Replace `:1004-1005` with a statement of what the selector does rather than how many things it is: *"These three set their own width; so does every other sibling-in-a-row, per the rule above."*
- **Effort:** XS

---

**UI-07 — Seven salary fields silently clamp a negative entry to zero and say nothing**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:4184-4185` (`nonNegative`, `readSalaryField`), `:4189-4198` (all reads), `:4249-4260` (the stored record), against the pattern at `:4227-4238`
- **Evidence:** `nonNegative = (v) =&gt; Math.max(0, unnum(v))` is correct as a data guard and closes WORK-72. But seven of the nine fields (`sNormal`, `sOT`, `sNT`, `sOTNT`, `sFieldDays`, `sSIPct`, `sWHTPct`) are plain `type="text"` with no `.money-input` class, so `formatMoneyInput()` never rewrites them and the field keeps displaying `-2` after the clamp. Every derived figure and the stored `otHours` then read 0. The screen already owns the right pattern: `sHourly` at `:4232-4236` adds `.invalid`, focuses the field and toasts *"Hourly Rate is required"*, and `.invalid` (`:1643-1646`) exists for exactly this. It is applied to one field of nine.
- **Impact:** On a calculator, an input reading `-2` beside an Overtime Pay of ₮0 reads as the calculator being broken, not as the entry being rejected. The user has no way to know which field the app disagreed with. The money is right; the explanation is missing.
- **Recommendation:** In the `sSave` handler and on `input`, flag any of the nine whose raw `unnum()` is negative with `.invalid` and one toast naming the field, reusing the `sHourly` block verbatim. No change to the clamp.
- **Effort:** S

---

**UI-08 — Category names may duplicate exactly; income types may not**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:4739-4748` (`catAdd`) against `:4750-4760` (`incomeTypeAdd`); consequences at `:5148`, `:6181-6183`, `:5823-5827`
- **Evidence:** `incomeTypeAdd` refuses a name that already exists, case-insensitively (`:4753-4755`). `catAdd`, the card directly above it in the same screen, checks only that the name is non-empty. Two categories with the same name and the same group are indistinguishable in the expense dropdown (`categoryOptions()`), render as two identical rows in the Settings list (`:5148`), produce two identically-labelled chips in different colours on Analytics (`:6181-6183`, since `categoryColor()` is by index), and split one heading across two rows in Planned vs Actual (`:5823-5827`). The inline rename editor (`saveEditCat`, reached from `:5164`) has no check either.
- **Impact:** A user who adds "Groceries" twice sees their grocery spending split across two rows with no indication why, and no obvious diagnosis. It is recoverable by renaming or deleting one, which is why it is Low. Note the asymmetry is not obviously wrong in principle: "Transport / Needs" and "Transport / Wants" is a legitimate pair, which is why the income-type rule cannot simply be copied.
- **Recommendation:** Refuse only an exact `(name, group)` duplicate — the one combination that cannot be intentional — with the same toast shape as its neighbour: *"That category already exists in Needs."* Apply it in `catAdd` and in `saveEditCat`.
- **Effort:** XS

---

**UI-09 — The app's entire explanatory layer is set at its smallest size**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1581` (`.helper`); twenty `class="helper"` blocks, of which the longest are `:1885`, `:1890`, `:1979`, `:2091`, `:2170`, `:2177`, `:2183-2186`, `:2197-2200`, `:5094-5097`
- **Evidence:** `.helper { font-size: 11px; color: var(--text-2); }` — a literal 11px, equal to `--t-micro`, the bottom of the type scale, and the project's own stated floor (the tab-bar comment at `:1145-1148` calls 11px "the floor"). That floor was established for one- and two-word tab labels. It is currently also carrying multi-sentence instruction: *"Your contribution, deducted from gross pay. 11.5% is the standard employee rate — change it if yours differs."* (`:1885`), the recurrence explanation (`:1979`), the non-reversible force-clear warning (`:2177`), the iOS storage-eviction warning (`:2183-2186`) and the backup advice (`:2197-2200`). Contrast is fine — `text-2`/`surface` is in the pair table and passes — this is size alone.
- **Impact:** `knowledge/project.md` targets "people with little accounting knowledge" and requires every screen to be understandable without training, and `ui-guidelines.md` opens Typography with "Readable". The text carrying that burden is the smallest and second-lightest in the app. This is a judgement about the audience, not a WCAG failure; there is no minimum font size in AA.
- **Recommendation:** Set `.helper` to `var(--t-sm)` (13px), the size already used for `.more-sub`, `.empty-desc` and `.chip` labels, and leave `--t-micro` for uppercase captions and axis labels. One declaration; nothing reflows structurally because every `.helper` is already a full-width block.
- **Effort:** XS

---

## Clean Areas

- **Navigation** — all eight named destinations reachable without guessing; `titles` gives one word per destination and `navigate('dashboard')` at `:7615` applies it on a cold start, so the header and the tab bar cannot disagree; `aria-current="page"` tracks the active tab and the More pill; the Expenses tab resets `expMode` (`:4121`) so the tab means Actual.
- **States** — every list has an empty state and a filtered-empty state with a "Show all time" escape hatch; every async path has a status line rather than a blank; every one of the eleven destructive actions goes through `confirmDialog()` and Reset is double-confirmed; the corrupt-data and save-failure banners both name a next action, and `reportFatal()` now yields to a live corrupt-data banner (`:7572`).
- **Colour as sole carrier of meaning** — excluded chips are dashed and struck through as well as dimmed (`:1287-1289`); the Monthly Trend legend repeats ↑/↓ (`:1825-1829`); calendar cells and chart columns carry `aria-pressed` and dated `aria-label`s; goal deadline pills print "Overdue 5d". Theme swatches now carry `aria-pressed` (`:4035`, `:4049-4052`).
- **Numbers and formatting** — one rounding boundary in `calcSalary()` (`:4219-4224`), sign outside the symbol in all three formatters, `—` plus "No plan set" rather than ₮0 on an unset plan (`:5750-5752`), and the hero figure rendered directly rather than tweened.
- **Keyboard and focus** — one focus-ring token with no per-theme exceptions and a documented derivation (`:115-134`); calendar cells, chart columns and currency rows are real `&lt;button&gt;`s; the modal stack traps Tab, routes Escape through each modal's own cancel control, restores focus and owns Android Back; the goal icon picker's keyboard route is restored (`:6960-6970`).
- **Touch targets** — every interactive class I checked declares 44px: `.icon-btn`, `.chip`, `.chip-mini`, `.qa-*`, `.cal-nav button`, `.convert-btn`, `.advisor-more`, `.list-item .actions button`, `.swap-btn`, `.close-x`, and the notification actions. The calendar cell and icon-grid geometry fixes from WORK-83 are both present (`:1521`, `:1412`).

## Quick Wins

- **UI-01** — re-export two PNGs and open them; the app's home-screen identity on the platform it names is currently a blank tile.
- **UI-02** — two expressions remove a permanently unrecoverable state from the two most-used forms.
- **UI-04** — one `overflow-wrap` declaration brings the last headline-figure class in line with the other four and removes a horizontal-scroll path.
- **UI-05** — the approved change is one background layer and one deleted rule, and it closes the last unmeasured painted surface.

## Estimated UX Impact

There are no Critical or High findings, so nothing here blocks release. Fixing the four Mediums changes three concrete things for the user. The installed app stops presenting itself as a blank white tile on the home screen it is told to install to, which is the first thing a new user sees of it and currently the worst. The quick-amount row stops being a control that can be destroyed by using it — today a user who clears three boxes to retype them loses the feature for the life of the database, with no message and no route back short of Reset All. And the Analytics screen stops answering two different questions at once: the four stat tiles, the chips and the daily chart move with the filter while the heatmap silently stays on the current month, so "Peak day" can name a date the calendar below it is not showing.

The Low set is polish with one exception worth scheduling deliberately: UI-05 is an approved item that did not land, and it is the last painted surface carrying text that neither the pair table nor the code has been made responsible for. Landing it is what makes the commit message *"every painted surface is in the table"* true, which matters more here than the 0.55 ratio points it recovers on Slate.
