# UI Review — Round 7

**Scope:** the whole application in `expense-pwa/`. Sources opened and re-derived rather than accepted: `expense-pwa/index.html` (7,846 lines), `expense-pwa/manifest.json`, `expense-pwa/sw.js`, `tools/check-contrast.mjs`, and the three shipped PNG icons (opened as images, not inferred from commit messages). Read before ruling: `knowledge/review-conventions.md`, `knowledge/ui-guidelines.md`, `knowledge/project.md`, `reports/chief-architect.md` (round-6 standing decision), `reports/HANDOFF.md`. `reports/code-review.md` was not opened.

---

## Executive Summary

Round 6 landed on disk. I re-derived rather than trusted: `.hero-kpi::before` is gone and the painted stack is exactly scrim-over-gradient (`index.html:894-919`); the three duplicate pair rows are merged (`tools/check-contrast.mjs:52-114`); `.kpi .value` has its wrap guard (`:876`); the quick-amount editor cannot be emptied (`:7328-7329`); `reportFatal` and both listeners sit at `:2655-2706` with `fatalReported` in the per-load reset set at `:2821`; `.helper` is at `--t-sm` (`:1654`); and I opened `icon-180.png`, `icon-192.png` and `icon-512.png` — all three render the tugrik correctly, with the `"purpose": "any"` raster entry present at `manifest.json:25-29`. No Critical and no High. The single biggest problem is that the contrast guarantee has a second blind spot of exactly the class ruling 3 closed for fills: `opacity` on a text-bearing element is invisible to a token-based pair table, and `.chip.off` uses it — putting the Analytics category filter's own amounts at **2.73:1 in the default theme**. Beside that sit two correctness-of-presentation defects the round-6 batch created or left: the Dashboard's Planned vs Actual card merges two categories that share a name — the exact configuration WORK-103 was narrowed to permit — and the Analytics calendar now snaps to the *oldest* month of a rolling range, hiding today.

---

## Overall Score

**90 / 100.**

No Critical and no High, the round-6 batch is verifiably on disk this time, and the primary journey (Dashboard → add an expense → Analytics) works end to end with correct empty, loading, error and confirmation states throughout. Held at the floor of the band rather than higher because two of the five Mediums are WCAG AA conformance failures, and one of them is structurally unmeasurable by the project's own predicate — which is the failure shape this project has spent three rounds closing.

---

## Strengths

- **Modal and focus handling is genuinely good.** `openModal`/`closeModal` (`index.html:4070-4103`) push and pop history, lock body scroll, focus the first real field rather than the close X, restore focus to the opener on close, and route Escape *and* Android Back through the modal's own cancel control so `confirmDialog()` still resolves (`:4107-4127`). `confirmModal` has no close X, so `items[0]` is Cancel — the destructive button is never the focus target.
- **Every list has an empty state, and the filtered case is distinguished from the truly-empty case.** `renderIncome:4536-4542` and `renderExpenses:4910-4917` branch on the *unfiltered* collection and offer a "Show all time" escape hatch (`:7773-7797`). This is the correct answer to a hard problem and it is applied consistently.
- **Failure is reported honestly.** `writeDb` (`:3104-3124`) raises a persistent banner on every write failure including the quarantine-refusal path, `savedToast` gates the success message on the write's return value, and the Data Summary force-clear no longer overwrites a failure toast with a success one (`:5291-5300`). The import path narrows its catch to the parse and gives each step its own outcome, with a modal rather than a toast on the recovery path (`:5444-5524`).
- **Non-colour encoding is applied deliberately where it matters.** The monthly trend legend carries ↑/↓ as well as hue (`:1898-1902`, `:6178-6186`), chips carry a dashed border and a strikethrough, and the calendar legend steps through the same `--heat-max` ramp the cells use.
- **The PWA icons are correct.** I opened all three files. This was the round-6 item most likely to have been recorded rather than done, and it was done.

---

## Findings

### UI-01 — `.chip.off` uses `opacity` over text; the off-chip amount is 2.73:1 in the default theme

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:1322` (`.chip.off { opacity: .6; border-style: dashed; }`), painting over `.chip-label` (`:1324`) and `.chip-amt` (`:1316`), inside `#dailyChipsCard` (`:2102-2111`) whose ground is `.card` → `--surface`.
- **Evidence:** `opacity` on the element composites the whole rendered chip — background *and* text — toward the card surface, so the effective pair is neither `text/surface-2` nor `text/surface` and `tools/check-contrast.mjs` cannot express it (its `over` mechanism composites the *background* only; see `:209-243`). Derived from the declared tokens:
  - Light (`:root`): effective ground `0.6·#F1F5F9 + 0.4·#FFFFFF` = `(246.6, 249.0, 251.4)`. Effective `.chip-label` = `0.6·#0F172A + 0.4·#FFFFFF` = `(111, 115.8, 127.2)` → **4.45:1**. Effective `.chip-amt` = `0.6·#475569 + 0.4·#FFFFFF` = `(144.6, 153, 165)` → **2.73:1**.
  - Nord (`:451-490`): label **3.93:1**, amount **3.48:1**.

  Both are normal text (13px / 11px), so the threshold is 4.5:1. The rule at `:1317-1321` records that opacity alone was previously ~2.6:1 and that non-colour cues were added — the cues landed, the contrast did not.
- **Impact:** The chip row is the only control that removes a category from the chart, calendar, stats strip and day detail at once. Its "excluded" state is the one a user must be able to read to know their totals are filtered, and its money figure is at roughly half the required ratio in the theme every user starts on. This is also a repeat of the pattern the architect's standing rule was written for — an unmeasurable compositing operation over text — in a mechanism (`opacity`) the rule's wording does not currently reach.
- **Recommendation:** Delete `opacity: .6` and express the off state in tokens: `.chip.off { background: var(--surface); color: var(--text-2); border-style: dashed; }`, and let `.chip-amt` inherit `--text-2` inside an off chip. Both `text-2/surface` (`check-contrast.mjs:97`) and `text-2/surface-2` (`:98`) are already in the pair table, so **no new row is needed** and the state becomes measured for the first time. The dashed border, strikethrough and grey dot are untouched.
- **Effort:** XS

### UI-02 — Dashboard "Planned vs Actual" merges two categories that share a name

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:6061-6068` (`drawPvA`'s `bump`), rendered at `:6094`.
- **Evidence:** `bump` keys its accumulator by `cat.name`, not by `cat.id`:
  ```js
  const name = cat ? cat.name : 'Unknown';
  if (!rows[name]) rows[name] = { planned: 0, actual: 0, group: cat?.group || 'Needs' };
  ```
  WORK-103 narrowed the duplicate check to an exact `(name, group)` match precisely so that "Transport / Needs" and "Transport / Wants" stay legal (`:4967-4984`, `:5148`). Those two categories produce **one** row here, labelled `Transport`, carrying a single group tag taken from whichever category's entry arrived first, with both budgets' money summed into it. `renderDaySelected` (`:6584-6604`) and `renderDailyChips` (`:6423-6438`) key by `x.categoryId` and keep them apart — so Analytics and the Dashboard disagree about how many Transport budgets exist. The comment at `:4979-4980` states the failure mode as *"one heading split across two rows in Planned vs Actual"*; the code merges rather than splits, so that sentence is false for both the blocked case and the permitted one.
- **Impact:** The Dashboard's only per-category budget-vs-spend view silently misreports the structure of a configuration the app explicitly permits and the Settings screen encourages. A user who deliberately split Transport into a Needs half and a Wants half sees one row with one tag and cannot tell which half is over. The totals line stays correct, which makes the misattribution harder to notice.
- **Recommendation:** Key `rows` by `x.categoryId` (with a single sentinel key for entries whose category was deleted), store `name` and `group` on the row from that category, and render `row.name` + `row.group`. Sorting and the totals line are unaffected. Correct the comment at `:4979-4980` to state the merge, not a split.
- **Effort:** S

### UI-03 — Planned-vs-Actual variance is carried by sign and colour only

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:6084-6089`.
- **Evidence:**
  ```js
  if (diff > 0)      diffHTML = `<span style="color:var(--danger-text);…">+${fmt(diff)}</span>`;
  else if (diff < 0) diffHTML = `<span style="color:var(--success-text);…">${fmt(diff)}</span>`;
  ```
  The row renders `+₮50,000` in red or `-₮50,000` in green beside the category name, with no word. Nothing on the row says whether `+` means overspent or saved. The card's own total line eighteen lines below *does* spell it out — `over by` / `under by` / `on target` (`:6111-6115`) — and the app elsewhere goes out of its way to add words and arrows for exactly this reason: the monthly trend legend (`:1898-1902`), the trend bar labels (`:6178-6186`), and the hero trend sentence (`:5982-5984`).
- **Impact:** `project.md` defines the audience as people with little accounting knowledge and requires every screen to be understandable without training. On the Dashboard's per-category budget card, the sign convention is a finance idiom and the only disambiguator is a red/green pair — the exact pair red-green colour blindness confuses, which the file's own comment at `:6182` already identifies. A user can read "under budget" as "over budget" on the app's most-read screen.
- **Recommendation:** Reuse the total line's own vocabulary in the two branches: `↑ over ${fmt(diff)}` and `↓ under ${fmt(-diff)}`. Two template strings; colour and weight stay as they are and become reinforcement rather than the sole carrier.
- **Effort:** XS

### UI-04 — Three form controls in the Settings inline editors have no accessible name

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:5385` (`input[data-edit-name]`), `:5386` (`select[data-edit-group]`), `:5095` (`input[data-edit-iname]`).
- **Evidence:** All three are rendered with no `<label for>`, no `aria-label` and no `aria-labelledby`. They are the only form controls in the application without one — every other input is either labelled (`:1924-1963`, `:2006-2014`, `:2041-2069`, `:2146-2181`, `:2211-2226`) or carries an `aria-label` where a visible label is impossible (`:1829` `dashPreset`, `:2408` `curPickSearch`, `:7345` `.qa-inp` "Quick amount N", `:2424`/`:2433` the converter's From/To buttons). The row's static text is replaced by these controls when Edit is pressed (`:5381-5392`, `:5091-5101`), so there is no adjacent heading for a screen reader to fall back on either.
- **Impact:** WCAG 3.3.2 (Level A) and 4.1.2. A screen-reader or voice-control user editing a category hears "edit text, Groceries" and "combo box, Needs" with nothing naming what either control is, and the two sit side by side in one row. This is the one place in the app where that pattern occurs, which makes it an inconsistency as well as a conformance failure.
- **Recommendation:** Add `aria-label="Category name"`, `aria-label="Category group"` and `aria-label="Income type name"` to the three templates. Three attributes, matching the pattern already used at `:7345`.
- **Effort:** XS

### UI-05 — The Analytics calendar now lands on the oldest month of a multi-month range, hiding today

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:3693-3699`.
- **Evidence:**
  ```js
  if (prefix === 'daily' && fromEl.value) {
    const start = parseISO(fromEl.value);
    if (start && !isNaN(start)) { start.setDate(1); start.setHours(0,0,0,0); calDate = start; }
  }
  ```
  `calDate` is set from the range's **start**. Of the nine presets (`:3583-3593`), three are single-month and the sync is correct for them. For the rest it lands on the oldest month in the range: with today at 2026-08-03, "Last 30 Days" computes `from = 2026-07-05` (`:3601`) and the heatmap snaps to **July**, dropping the three most recent days — including today, and with them the `.today` highlight (`:1609`). "Last 90 Days" lands on May; "This Year" lands on January. The stat strip above (`:6279-6317`) continues to describe the whole range, so "Peak day" can again name a date the calendar below is not showing — the defect WORK-95 was approved to remove, reintroduced for six of the nine presets. The code comment at `:3688-3692` covers All-Time and Custom and does not address multi-month ranges.
- **Impact:** The calendar heatmap is the module's most visual artifact and the reason a user opens Analytics. On the two most common rolling presets it opens on a month with no recent data in it and no indication that anything is missing, and the user has to work out that the ◀/▶ arrows are the way back to today.
- **Recommendation:** Anchor on today clamped into the range rather than on its start: use `from` if today precedes it, `to` if today follows it, otherwise today. That gives July for "Last Month", August for "This Month", "Last 30 Days", "Last 90 Days" and "This Year", September for "Next Month" and December 2025 for "Last Year" — one small block at the same site, and the arrows are untouched.
- **Effort:** XS

### UI-06 — Goal icon picker is 41.6×41.6 px at 320 px, and its comment's two figures cannot be reproduced from either container

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1443-1447` (the two `@media` rules and the comment between them), `:1448-1454` (`.icon-grid button`), used at `:2154` (Goals screen) and `:7393` (edit-goal modal).
- **Evidence:** The picker renders at ≤400px as five columns with a 6px gap. Derived from the declared box model (`* { box-sizing: border-box }` at `:752`):
  - **Goals screen card:** `main` padding 32 (`:830`) + `.card` border 2 and padding 32 (`:849-853`) + `.icon-grid` border 2 and padding 20 (`:1434-1438`) = 88px of inset. Column = `(W − 88 − 4×6) / 5 = (W − 112) / 5`. At W=320 that is **41.6px** — below the guideline's unqualified 44×44 minimum, since `aspect-ratio: 1/1` makes height follow width. Five columns first clear 44px at W=332.
  - **Edit-goal modal:** `.modal` padding 40 (`:1774-1777`) + the same grid inset 22 = 62px. Column = `(W − 62 − 24) / 5`; at W=320 that is **46.8px** and passes.

  The comment claims *"Six columns inside a padded card gives 37.7px squares at 320px"* and *"Moved to 400px, which is where six columns first clears 44."* Six columns at 320px is `(320 − 88 − 30)/6 = 33.7px` in the card and `(320 − 62 − 30)/6 = 38.0px` in the modal — neither is 37.7. Six columns first clear 44px at W=382 in the card and W=356 in the modal — neither is 400.
- **Impact:** Small for the user: the picker is a convenience and `#goalIcon` (`:2147`) accepts a typed emoji, so nothing is unreachable. The real cost is the comment: two bare results that no container produces, sitting on the rule they justify, in a file where a wrong figure in a comment has now been the recorded defect five times. Under the standing convention *comments state derivations, never results*, this is that class.
- **Recommendation:** Add a fourth column at ≤340px (`repeat(4, 1fr)` gives 55.5px at 320px), and replace the comment's two figures with the inset chain and the operator — `(viewport − 88 inset − gaps) / columns` for the card, `(viewport − 62 inset − gaps) / columns` for the modal — naming which container each applies to.
- **Effort:** XS

### UI-07 — The `.cal-grid` measurement table does not say which of the two grids it measured

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1539-1582`, governing both `#calGrid` (`:2126`, inside `.card.cal-card`) and `#dpGrid` (`:2456`, inside the date-picker modal).
- **Evidence:** The table at `:1554-1558` gives viewport → grid → track → overlap for four widths and is measured in `.cal-card`, whose horizontal padding is set to `--s3` by the rule at `:1582` — a rule scoped to that card alone. `#dpGrid` sits in a `.modal` with `padding: 20px` and `max-width: 380px` (`:2448`, `:1774-1777`), which is a different width at every viewport. Derived: modal content width is `min(W, 380) − 40`, so track = `(min(W,380) − 40 − 12) / 7` — **38.3px at 320px, 44.0px at 360px, 46.1px at 375px, 46.9px at 390px**. The picker therefore meets 44px at every supported width except 320. Six lines below the table, at `:1569-1572`, the comment says *"The date picker matters more than the heatmap here"* — so a reader is invited to apply a table to a grid it does not describe.
- **Impact:** No user-facing defect; the date picker is in better shape than the comment implies. The cost is to the open decision: WORK-97(b) is deferred pending a harness measurement of `.cal-cell` widths, and whoever performs it will read this table as covering both grids and measure one.
- **Recommendation:** Label the existing table "`.cal-card` heatmap" and add the picker's derivation as a second line — inputs and an operator, no standalone figure. **New evidence offered to the WORK-97(b) deferral, not a re-raise of it:** the mis-tap risk the deferral names is confined to 320px for the date picker, which narrows what the deferred decision has to settle.
- **Effort:** XS

---

## Review Areas — Coverage

Areas with no finding, reported in one line each, as required.

- **Layout and Hierarchy — clean.** The Dashboard leads with the hero Net Balance (`:1836-1840`), then the three-tile strip, then the advisor; nothing above the fold competes with the money. The salary screen's summary card no longer duplicates four figures (`:1968-1971`).
- **Navigation — clean.** All seven `project.md` modules plus Savings Goals are reachable by name: four in the tab bar (`:2293-2314`), four in the More sheet (`:2320-2369`). `screenTitle` (`:4306-4309`) keeps the header and the tab bar naming the same destination including the Expenses/Budget Planning split, `aria-current="page"` tracks it (`:4351-4359`), the More pill highlights for its three sub-screens, and `navigate('dashboard')` runs at boot (`:7832`) so the cold start does not read "Dashboard" over a tab reading "Home". Every modal has a Cancel or Close, an Escape route and an Android Back route.
- **Typography — clean within what is in scope.** Size and weight hierarchy is coherent (`--t-hero` 36 → `--t-display` 30 → `--t-h2` 22 → `--t-h3` 18 → `--t-body` 15 → `--t-sm` 13 → `--t-micro` 11), and WORK-104 moved the explanatory layer off the floor (`:1654`). The residual off-scale literals (`12.5px` at `:1421`, `13.5px` at `:1491`, `17px` at `:1375`) are members of the twice-rejected 72-value sweep and are not raised.
- **Colour and Theme — clean apart from UI-01.** Sixteen theme blocks, each declaring the same token set; income is `--success-text` and expense `--danger-text` at every site I checked (`:1093-1094`, `:6086-6090`, `:6190-6191`, `:1621-1622`); `--on-*` foregrounds are enforced per fill by `check-contrast.mjs:269-278`.
- **Spacing — governed by the standing rejection.** The `--s1..--s7` scale is used in new rules; the ~69 off-scale literals are the rejected sweep and are not raised. Nothing I read is cramped.
- **Cards — clean within what is in scope.** `.card` (`:849-856`), `.kpi` (`:864-867`), `.kpi-mini` (`:965-971`) and `.more-item` (`:1189-1197`) share `--r-md` and `--e1`. The radius spread across secondary surfaces (`6px`, `10px`, `12px`, `16px`) is the rejected sweep's nine-radius set.
- **Mobile — clean apart from UI-06.** Every interactive class I checked declares 44px or larger: `.icon-btn` 44×44 (`:774-776`), tab bar 52 (`:1173`), `.more-item` 56 (`:1195`), buttons 44 (`:1013`), inputs 44 (`:996`), `.chip` 44 (`:1309`), `.chip-mini` 44×44 (`:1325`), `.cal-nav button` 44 (`:1537`), list-row actions 44×44 (`:1096-1098`), `.convert-btn` 44 (`:1663`), `.advisor-more` 44 (`:1497`), reminder actions 44 (`:813`), `.swap-btn` 44 (`:1695`), `.barchart .col` 44 (`:1272`, `:1278`). No horizontal page scroll: every headline-figure class now carries `overflow-wrap: anywhere` (`:876`, `:947`, `:983`, `:1345`, `:1617`, `:1672`), and the two charts that do scroll do so inside `.trend-wrap` (`:1257`), not on the page. `.cal-cell` track overlap is WORK-97(b) and is not re-raised.
- **Accessibility — one finding (UI-04) plus UI-01.** Focus ring is one token with no per-theme exception (`:142`), applied to buttons, links and `[tabindex]` (`:1068-1070`) and to inputs (`:1003-1006`), with the calendar's clipping case handled by `outline-offset: -2px` (`:1589`). Every readonly date field and the icon grid have Enter/Space keyboard routes (`:6914-6925`, `:7216-7226`). Tab is trapped inside the top modal (`:4113-4127`).
- **States — clean.** Empty state for every list I could find (`:3916`, `:4541`, `:4915`, `:5089`, `:5241`, `:5376`, `:6076`, `:6170`, `:6430`, `:6487`, `:6581`, `:7096`, `:7462`), with the filtered-vs-truly-empty distinction and an escape hatch. Loading state on every async path (`:2240`, `:2255`, `:3411-3413`, `:6832`). Error states name the next action (`:5456`, `:5468`, `:5495`, `:5520`, `:6851`, `:1800-1806`). Every destructive action is confirmed, Reset All twice (`:5527-5530`), and the confirmations name what will be lost (`:4954`, `:5128`, `:5168`, `:5281`, `:5422`).
- **Numbers and Formatting — one finding (UI-03).** `fmt` (`:3463-3466`) puts the sign outside the symbol and groups thousands; `fmtCompact` (`:3521-3531`) takes magnitude first so negatives stay grouped; `fmtCurrency` (`:6792-6799`) follows the same sign rule for foreign codes. Money is rounded at one boundary in `calcSalary` (`:4422-4427`). "Left After Plan" renders `—` with "No plan set" rather than a misleading `₮0` (`:5995-6001`).

---

## Quick Wins

- **UI-01** — one declaration swapped for two token declarations; the state becomes measurable by an existing pair row instead of invisible to the predicate.
- **UI-03** — two template strings; borrows vocabulary the same card already prints eighteen lines below.
- **UI-04** — three `aria-label` attributes; closes the app's only unlabelled controls and matches a pattern already in the file.
- **UI-05** — one small block at the site that already exists; restores the property WORK-95 was approved to establish, for the six presets it currently misses.
- **UI-02** — one key change from `cat.name` to `x.categoryId` plus the two fields it carries; makes the Dashboard agree with Analytics about a configuration the app permits.

---

## Estimated UX Impact

There are no Critical or High findings, so nothing here changes whether the build ships. Fixing the five Mediums changes three things for the user. First, the Analytics category filter becomes readable in its off state in every theme instead of two of the sixteen I measured failing AA and the default theme sitting under it — and, more durably, that state moves from *unmeasurable* to *covered by an existing pair row*, closing the same hole for `opacity` that ruling 3 closed for fills. Second, the Dashboard stops reporting a category structure the user did not create: Planned vs Actual will show the same categories the Settings screen, the chips and the day detail show, and its per-row variance will say "over" or "under" in words rather than leaving a red plus sign to be decoded. Third, opening Analytics on "Last 30 Days" or "Last 90 Days" will show the month containing today rather than a month whose newest data is a month old.

The two Lows are documentation hygiene with one small touch-target correction attached, and one of them hands the deferred WORK-97(b) decision a measurement it did not have.
