# UI Review — Round 8

## Executive Summary

This interface is in good shape. Navigation, empty states, error states, destructive confirmations, modal focus management, currency formatting and the sign/word disambiguation work from earlier rounds are all genuinely on disk and correct — I opened each one rather than trusting the commit record. The single biggest problem is that the Salary Calculator's input card is a two-column CSS grid with no breakpoint and no `min-width` release, so on phone widths the two columns cannot compress below the intrinsic width of the text inputs inside them and the page scrolls sideways — a direct breach of `ui-guidelines.md` "No horizontal scrolling", on a named core module, by a mechanism this file already documents at `index.html:874-880` and already fixes elsewhere at `index.html:1115`. Behind that sit two residual instances of the standing "no compositing over text" rule that survived WORK-117, and a completion gap in WORK-118: the Analytics calendar anchor is synced when the preset *changes* but not when it is *restored*, so the defect returns on every app launch for six of the nine presets.

## Overall Score

**80 / 100** — Solid. One High finding, contained to a single screen and correctable with one declaration; three Mediums, each a partially-completed piece of work rather than a new design flaw; no Critical. The band above (90-100) requires no High findings, which this round does not meet.

## Strengths

These are load-bearing and I verified each at source rather than accepting the record.

- **Navigation is complete and unambiguous.** All seven modules named in `project.md` are reachable by name (`index.html:2383-2459`), Budget Planning correctly resolves to `setExpMode('planned')` before `navigate('expenses')` at `:4518`, the Expenses tab resets `expMode` at `:4499` so the tab bar and header cannot name different modules, and `screenTitle()` at `:4481` makes the header follow the toggle. `aria-current` is set on every navigation at `:4529`/`:4534`.
- **The state matrix is genuinely complete.** Every list has both an empty state and a *filtered* empty state that distinguishes "you have nothing" from "nothing matches this filter", with an escape hatch (`:7998-8022`, `:4711-4718`, `:5085-5092`). Every async path has a loading state and an error state that names the next action (`:7055-7077`, `:5640-5715`). Every destructive action routes through `confirmDialog()`, and Reset All requires two.
- **Modal accessibility is done properly**, not gestured at: focus trap on Tab and Shift-Tab (`:4288-4302`), Escape routed through the modal's own cancel control so promises resolve (`:4282-4286`), focus restoration (`:4267`), Android Back mapped to the modal stack with correct history bookkeeping (`:4232-4278`), and `role="dialog"` / `aria-modal` / `aria-labelledby` on all nine.
- **Colour never carries meaning alone.** The trend legend carries ↑/↓ (`:1991-1992`), Planned vs Actual now says "over"/"under"/"on target" in words (`:6311-6313`), and the excluded-category chip carries a dashed border, a strikethrough and a grey dot on top of the token change (`:1350-1353`).
- **Currency formatting is one function used everywhere**, sign outside the symbol in both `fmt()` and `fmtCurrency()` (`:3618-3621`, `:7017-7024`), and `fmtCompact()` re-applies the sign after taking the magnitude so negatives group correctly.

## Findings

---

**UI-01 — The Salary Calculator's input grid cannot compress below its inputs' intrinsic width, so the screen scrolls horizontally on every phone**

- **Severity:** High
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:863` (`.grid-2`), applied at `:2020-2055` (Salary → Inputs, eight fields). Also `:2064` (Salary → "Where the gross comes from"), which is unaffected because its children are text.
- **Evidence:**
  - `:863` — `.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }`. There is no `@media` rule for `.grid-2` anywhere in the file. `.grid-3` collapses at 420px (`:865`) and `.grid-4` at 520px (`:867`) — and `.grid-2` is the only one of the three that contains form controls.
  - `1fr` is `minmax(auto, 1fr)`, so each track's floor is the grid item's content-based minimum. The items at `:2021-2054` are `<div>` wrappers containing `<input type="text">` with no `size` attribute. `input, select, textarea` at `:1000-1007` sets `width: 100%`, `padding: 11px var(--s3)`, `border: 1px`, `font-size: var(--t-body)` — and no `min-width`. A percentage width is indefinite during intrinsic sizing, so the input contributes its UA intrinsic width (`size=20` at 15px) plus 24px padding plus 2px border.
  - Derivation, stated as inputs and an operator so it survives an edit. Available card content width `A(W) = W − 32 (main padding, :835) − 2 (card border, :856) − 32 (card padding var(--s4), :858)` = `W − 66`. Required grid width `R = 2·I + 12`, where `I` is one input's intrinsic width. The grid overflows whenever `R > A`, i.e. whenever `I > (W − 78) / 2`. That threshold is 121px at W=320, 141px at W=360, 156px at W=390 and 176px at W=430. A `size=20` field at 15px with 26px of box chrome does not fit under any of those except the last.
  - **This file already knows the mechanism and already fixes it elsewhere.** `:874-880` states it explicitly for the `.kpi` tiles in the *same* `.grid-2`: *"`1fr` is minmax(auto, 1fr) and a grid item's automatic minimum is its min-content size, so without a break opportunity … the card cannot shrink past it — the page scrolls sideways instead."* The fix applied there was `overflow-wrap: anywhere`, which introduces break opportunities in *text* and can do nothing for a form control's intrinsic width. And `:1115` — `.cat-edit input { flex: 1; min-width: 0; }` — is the same release, added to a flex row for exactly this reason. It was applied to one container and not the other.
  - Nothing mitigates it downstream: there is no `overflow-x` on `html`, `body` or `main` (grep for `overflow-x` returns only `.trend-wrap:1262`).
- **Impact:** The Salary Calculator is a named core module in `project.md`, and its Inputs card is the whole module. Four of its eight fields — Overtime Hours, Overtime at Night, Field Days, Withholding Tax % — sit in the right-hand column. On any phone the user must scroll the page sideways to read their labels and reach their boxes, while the sticky header and fixed tab bar stay put and the layout shears. `project.md` requires every screen to be understandable without training; `ui-guidelines.md` states "No horizontal scrolling" as a rule with no qualifier.
- **Recommendation:** One declaration — `.grid-2 > * { min-width: 0; }` — beside `:863`, with a comment stating the derivation above and naming which container it applies to. This is the smallest safe fix and it matches the precedent already in the file at `:1115`; the inputs' `width: 100%` then fills whatever track results. A breakpoint (`@media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr } }`) would match the house style of `.grid-3`/`.grid-4` but is larger and leaves the 481-560px band unhandled. **Confirm the deficit at 320, 360, 390 and 430px with the width-mode harness before and after** — `node tools/harness/run.mjs <probe> --width …`, reporting `document.documentElement.scrollWidth − clientWidth` with `#salary` active. My figures are derived from the declared box model, not measured; the existing instrument (unblocked by WORK-114) is the right way to close that gap, and a probe that measures a *hidden* screen will measure nothing, so the probe must call `navigate('salary')` first.
- **Effort:** S

---

**UI-02 — Two text-bearing elements still composite outside the token system, and one of them drops the confirm dialog's Delete label below AA in seven themes**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1067` (`button.danger:hover`) and `:1713` (`.barchart .col .val-zero`)
- **Evidence:**
  - `:1067` — `button.danger:hover { filter: brightness(1.08); }`. `button.danger` at `:1063-1066` paints `color: var(--on-danger)` on `background: var(--danger)` at `--t-sm` (13px) / weight 600, which is normal text under WCAG and needs 4.5:1. `filter` applies to the element *and its label*, so the painted pair is neither `on-danger/danger` nor anything the pair table can express. `check-contrast.mjs:61` measures `on-danger` on `danger` only; there is no `danger-hover` token and no corresponding row, whereas the primary button *does* have one (`check-contrast.mjs:103`, `{ fg: 'on-accent', bg: 'primary-hover' }`) added for precisely this reason — see the comment at `index.html:1048-1053`. The rule was applied to one variant and not the other.
  - Recomputed from the declared tokens. `--on-danger: #FFFFFF` over `--danger: #DC2626` measures 4.83:1 at rest and **4.22:1** under `brightness(1.08)` (both channels lighten; white cannot). That affects ocean (`:225`/`:254`), forest (`:262`/`:291`), mint (`:495`/`:525`), flamingo (`:573`/`:603`) and kingfisher (`:611`/`:643`). Rose (`#FFFFFF` on `#E11D48`, `:299`/`:328`) goes 4.69 → **4.11**. Owl (`#FFFFFF` on `#C74B4B`, `:651`/`:681`) goes 4.63 → **4.06**. Seven of sixteen themes below 4.5:1. Sepia (`#B91C1C`) stays above at 5.74; the nine dark-text and black-text themes improve.
  - `:1713` — `.barchart .col .val-zero { font-size: var(--t-micro); color: var(--text-2); opacity: .5; }`. This is `opacity` on a text-bearing element, the exact mechanism ruling C22 closed for `.chip.off`. It renders the `·` placeholder in both charts (`:6410-6411`, `:6733`) on `--surface`. Light theme: `--text-2` `#475569` at 50% over `#FFFFFF` composites to `(163,170,180)`, **2.34:1** — against a declared `text-2/surface` row that reports roughly 7.5:1. The predicate says nothing about it.
  - For completeness, so this is not re-raised: `button:disabled { opacity: .5 }` (`:1069`) and `.list-item .actions button:disabled { opacity: .25 }` (`:1112`) are on inactive controls, which WCAG 1.4.3 exempts; `.list-item.dragging { opacity: .95 }` (`:1132`) is a 5% transient drag state; `.empty-state svg` (`:1142`) and `.cal-legend .swatch` (`:2220`) are non-text graphics; `.cal-cell::before` (`:1694`) sits *behind* text (`:1697`) and is measured by the pair table's `invert` row. None of those are findings.
- **Impact:** `button.danger` is the OK button of every confirmation dialog in the app (`confirmDialog()` sets `okBtn.className = 'danger'` at `:4317`), plus "Reset All" and the eight force-clear `✕` controls in Data Summary. On a pointer device the label of the button that destroys data is the one that becomes hardest to read at the moment the user is deciding. The `.val-zero` dot is lower stakes — it marks a day with no spending — but it is a live second instance of a class the architect closed as a *property* rather than a case, and leaving it teaches that the rule is per-selector.
- **Recommendation:** Two separate corrections. (a) Add a per-theme `--danger-hover` derived the same way `--primary-hover` was — `--danger` walked in lightness until `--on-danger` clears 4.6:1 on it — replace `:1067` with `button.danger:hover { background: var(--danger-hover); border-color: var(--danger-hover); }`, and add one pair-table row `{ fg: 'on-danger', bg: 'danger-hover', min: 4.5 }`. (b) At `:1713`, delete `opacity: .5` and state the state in tokens: `color: var(--text-3)`, which is already the file's weaker text token — then add `text-3/surface` to the pair table, or use `--text-2` unmodified if `--text-3` does not clear 4.5 in every theme. Re-run `check-contrast.mjs` after; its summary line must be the honest one.
- **Effort:** S

---

**UI-03 — The Analytics calendar anchor is synced when the preset changes but not when it is restored, so the WORK-118 symptom returns on every app launch**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:3862-3874` against `:3814-3826`, and `:6458`
- **Evidence:**
  - The clamp — today clamped into `[from, to]` — lives at `:3862-3874`, **inside `presetEl.addEventListener('change', …)`** which opens at `:3829`.
  - The filter is persisted: `persist()` at `:3802-3804` calls `saveFilterState()`, which writes to `localStorage` under `filter-state-v1` (`:3774-3778`). It is restored on boot at `:3814-3826` — `presetEl.value = saved.preset; applyPreset(saved.preset)` — and that path contains **no** call to the clamp. Setting `.value` in script fires no `change` event.
  - `calDate` is initialised at `:6458` to the first of the *current* month, unconditionally, and nothing else writes it except the ◀/▶ arrows (`:6630`, `:6634`).
  - So: choose "Last Year" on Analytics (calendar correctly clamps to December 2025 per `:3868`), close the app, reopen it, open Analytics. `renderDailyStats`, `renderDailyChips` and `drawDailyStackedChart` all read `getRange('daily')` and describe 2025; `renderCalendar()` at `:6548-6549` reads `calDate` and paints August 2026. The Peak day tile at `:6537-6541` names a date the calendar below it is not showing — the exact symptom the comment at `:3833-3838` says this sync was added to remove, and which `:3849-3857` says WORK-118 finished removing.
  - Affects the same six presets WORK-118 was raised for (Last Month, Last 30, Last 90, This Year, Last Year, Next Month) plus any Custom range not containing today; This Month and All-Time are unaffected because `:6458` already lands correctly.
- **Impact:** The user opens Analytics, reads a stat strip describing one period and a heatmap describing another, with nothing on screen saying they disagree. It is silent — every figure is individually correct — which is why it is worth fixing rather than tolerating. It recurs on every cold start, so it is more frequent than the defect it descends from.
- **Recommendation:** Extract `:3862-3874` into a named local (e.g. `syncCalendarAnchor()`) inside `initPeriodFilter` and call it from both the change handler and the restore branch at `:3821`, guarded by `prefix === 'daily'` as it already is. Do not call it from `applyPreset` — that would also fire on the Custom date inputs, which `:3845-3847` deliberately excludes. The ◀/▶ arrows remain the acceptance test, as they were for WORK-95 and WORK-118. Update the comment at `:3840-3842` to say *both* call sites, since it currently explains why the sync is not inside `renderCalendar()` and implies the change handler is the only writer.
- **Effort:** S

---

**UI-04 — "Save & Add as Income" writes an income record without moving the Income screen's filter to a period that shows it**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:4675-4677`, against `:4696` and `:5063-5065`
- **Evidence:**
  - The salary handler pushes to `db.income` at `:4674` with `date` taken from `#sDate` (`:4644`), then runs `const ok = save(); renderDashboard(); savedToast(ok, 'Saved and added to Income');`. There is no `revealEntryDate('inc', date)` and no `renderIncome()`.
  - Both of the other two add paths do call it: `incAdd` at `:4696` (`const movedTo = revealEntryDate('inc', date)`) and `expAdd` at `:5063`, and both fold the result into the toast (`:4699`, `:5069`).
  - The comment at `:3893-3900` states the reason the mechanism exists: *"the success toast fires, the list is unchanged, and the add looks like it failed. Adding it again is the rational response, which is how duplicate planned expenses were created."*
  - The Income screen's default preset is This Month (`:3824`), and `#sDate` is user-editable (`:2014`), pre-filled with today at `:8047`. A pay date in a previous month therefore lands outside the filter. The filtered empty state at `:7998-8005` only appears when the list is *empty*; with other entries present that month, the salary record is simply absent and nothing says why.
- **Impact:** A user who back-dates a pay period is told "Saved and added to Income", goes to Income, and does not find it. The rational response is to save again — which pushes a second row into both `db.salaries` and `db.income`, doubling the income total on the hero KPI, the donut and the Monthly Trend. That is a wrong financial figure produced by a UI gap, and it is the precise failure the file's own mechanism was written to prevent.
- **Recommendation:** Mirror `:4696-4699`: `const movedTo = revealEntryDate('inc', date); renderIncome(); renderDashboard(); savedToast(ok, movedTo ? \`Saved and added to Income · showing ${movedTo}\` : 'Saved and added to Income');`. Three lines, at the site that already carries its two siblings' pattern.
- **Effort:** XS

---

**UI-05 — The `.cal-grid` comment states WORK-97(b) is settled and, forty lines later, states it is open**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1619-1620` against `:1659-1662`, and `:1670-1671`
- **Evidence:**
  - `:1619-1620` — *"THE OVERLAP IS ACCEPTED. This was the open question (WORK-97b) and it is now settled by measurement rather than left as a judgement."* The two measurement tables at `:1609-1613` and `:1625-1629` and the rejection reasoning at `:1631-1645` are all present and correct.
  - `:1659-1662`, the final paragraph of the same comment — *"The date picker matters more than the heatmap here… Whether the sub-390px overlap is acceptable is an open decision (WORK-97b), not a settled one."* Its first sentence also duplicates `:1650-1652` verbatim in substance.
  - `:1670-1671`, in the `.card.cal-card` comment immediately below — *"Whether to spend the rest of the inset — or accept the overlap and record why — is WORK-97b."* That question is answered by the table at `:1625-1629`.
  - `HANDOFF.md:42` records WORK-97(b) as **SETTLED**, "do not reopen without a new argument". The source contradicts the handoff.
- **Impact:** No user impact. The cost is to the next reviewer: the last thing this comment says is that the decision is open, which is an invitation to re-raise a question that has been measured twice and closed. This project's stated failure mode is a true-sounding claim written beside code that does not support it; here it is two claims in one comment that cannot both be true.
- **Recommendation:** Delete the paragraph at `:1659-1662` — its useful half is already at `:1650-1652` — and replace the WORK-97(b) sentence at `:1670-1671` with a pointer to the table above ("measured; the padding-zero variant fails both conditions — see the second table"). Change nothing else in the comment; the derivations are correct and are the reason it exists.
- **Effort:** XS

---

**UI-06 — The four reminder checkboxes are sized and painted by the rule written for text fields**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1000-1007` applied to `:5518`, `:5524`, `:5528`, `:5532`
- **Evidence:** `input, select, textarea { width: 100%; padding: 11px var(--s3); min-height: 44px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); font-size: var(--t-body); }`. There is no `input[type="checkbox"]` rule anywhere in the file (grep for `checkbox` returns only the four call sites and one comment at `:3282`). Each of the four overrides exactly one property — `style="width:auto"` — so with `* { box-sizing: border-box }` at `:752` the checkbox occupies a box of at least 44px in height with 24px of horizontal padding and 2px of border around a native control. They are the only checkboxes in the application, so there is no second instance to compare against.
- **Impact:** Cosmetic and confined to Settings → Notifications. The labelling is correct — each control is wrapped in its own `<label>` (`:5517`, `:5523`, `:5527`, `:5531`), so the accessible name and the click target are both fine, and the row is at least 44px tall. What is wrong is that a rule authored for text fields is the only thing deciding how these render, so their appearance is incidental rather than designed, and it will differ between engines depending on how each treats `padding` and `min-height` on a native checkbox. I could not assess the rendered result by reading alone and am not claiming one.
- **Recommendation:** One carve-out beside `:1013`: `input[type="checkbox"] { width: auto; min-height: 0; padding: 0; border: none; background: none; inline-size: 20px; block-size: 20px; accent-color: var(--primary); }`, and delete the four inline `style="width:auto"` attributes in the same commit so the knowledge lives in one place. The 44px target is already provided by the wrapping `<label>` row.
- **Effort:** XS

---

## Review Areas — Clean

- **Layout and Hierarchy.** Clean. Dashboard order is filter → Net Balance hero → three KPI minis → Advisor → donut → Planned vs Actual → Monthly Trend (`:1917-1995`); the single dominant figure is first and nothing competes with it. The salary summary card no longer repeats four figures from the card below it (`:2058-2061`).
- **Navigation.** Clean — see Strengths.
- **Typography.** Clean. One scale (`:108-114`), used by class rather than by literal at every headline site; `.helper` sits at `--t-sm` not the 11px floor (`:1736-1744`); the 11px floor is respected on narrow screens (`:1184-1190`). The header `h1` and card `h3` share `--t-h3` and are separated by weight, surface and a border, which is a legitimate reading of "clear hierarchy" rather than a deviation.
- **Colour and Theme.** Clean apart from UI-02. Sixteen themes, all token-driven, all covered by `check-contrast.mjs`; income green / expense red / warning amber are consistent across the Dashboard, Analytics, goal cards and advisor tips; colour is never the sole carrier (see Strengths).
- **Spacing.** Clean as a rule. New declarations use `--s1`…`--s7`; the residual off-scale literals are the standing rejected sweep and I am not re-raising them.
- **Cards.** Clean. `.card` at `:854-861` is one definition — `--r-md`, `--s4`, `--e1`, `--border` — and the two documented deviations (`.card.cal-card` inset at `:1672`, `.advisor-card` at `:1512`) each carry a derivation.
- **Mobile.** Every interactive target I checked meets 44×44: `.icon-btn` 44 (`:781`), `.list-item .actions button` 44 (`:1103`), tab bar 52 (`:1178`), `.chip`/`.chip-mini` 44 (`:1317`, `:1354`), `.cal-cell` 44 via `aspect-ratio` + `min-height` (`:1682`), `.barchart .col` 44 (`:1277`, `:1283`), `.close-x` 44 (`:1870`), reminder actions 44 (`:818`), `.convert-btn` 44 (`:1753`), `.swap-btn` 44 (`:1785`). The one documented shortfall is the goal icon picker at 320-331px (2.4px, derivation at `:1473-1495`), which is a recorded and accepted decision. Horizontal scrolling: UI-01 is the only breach; the two charts scroll inside `.trend-wrap` (`:1262`) and do not reach the page.
- **Accessibility.** Clean apart from UI-02's contrast. Every form control in the file has a `<label for>`, an `aria-label`, or a wrapping `<label>` — I enumerated all 80 `<input|select|textarea>` occurrences. Focus indicator is one token with no per-theme exceptions and a stated derivation (`:123-142`), measured against all four grounds at 3:1 in the pair table, and inset on `.cal-cell` so the ring is not clipped by neighbours (`:1673-1679`). Every tile-like surface that must be operable is a real `<button>` (`:1082-1086`, `:6612`, `:6739`, `:4413`), and the date fields have a keyboard route (`:7122-7138`).
- **States.** Clean — see Strengths.
- **Numbers and Formatting.** Clean. One `fmt()`, sign outside the symbol, `toLocaleString('en-US')` grouping everywhere; `setNumPlaceholder` uses `—` rather than `₮0` where the value is not a claim about money (`:3630-3639`, `:6192`); the hero balance is written directly rather than tweened so a glance never reads a plausible wrong figure (`:6166-6170`); `fmtCompact` re-applies the sign after taking the magnitude (`:3676-3686`). No ambiguous sign found.

## Quick Wins

- **UI-04** — three lines at a site whose two siblings already carry the pattern; removes a route to duplicate income records.
- **UI-03** — one extraction and one extra call site; finishes WORK-118 on the path it did not cover.
- **UI-01** — one declaration, matching the precedent already at `:1115`; needs a width-mode measurement to confirm, which the harness already supports.
- **UI-02** — one token per theme plus one pair-table row, mirroring `--primary-hover`; and one colour swap at `:1713`.

## Estimated UX Impact

Once UI-01 lands, the Salary Calculator stops shearing sideways on every phone and its right-hand column — half the fields the module exists to collect — becomes readable and reachable without scrolling. Once the three Mediums land, the Delete label in every confirmation dialog stays above AA on hover in all sixteen themes, the Analytics stat strip and its heatmap describe the same period on a cold start rather than only after the user re-picks the preset, and back-dating a pay period no longer produces an income record the Income screen silently refuses to show — which is the route by which a duplicate salary entry, and therefore a wrong income total on the Dashboard, currently gets created.
