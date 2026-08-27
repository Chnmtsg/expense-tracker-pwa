# UI Review — Dashboard, Income, Expenses, Analytics redesign

**Scope:** `D:\3_Claude\PowerApps\expense-pwa\index.html` (single-file app), measured against `D:\3_Claude\PowerApps\knowledge\ui-guidelines.md` and `D:\3_Claude\PowerApps\knowledge\project.md`. Supporting file: `D:\3_Claude\PowerApps\tools\check-contrast.mjs`.

**Method note:** this is a source review. Widths, text advances and wrap points below are derived from the declared values in the stylesheet, with the arithmetic shown so it can be checked or re-measured. Where a result depends on the rendering engine (native `<select>` chrome on iOS) I say so rather than assert it.

## Executive Summary

The redesign is a genuine improvement and most of it is correct. Consolidating six bordered, shadowed cards into two divided cards removes real clutter from the two screens that needed it most, the amount-first form order matches how these forms are actually used, the `<details>` disclosure is the right primitive with the platform's keyboard and screen-reader behaviour intact, and every new touch target clears 44px. The removed breakpoints leave no width worse off — the arithmetic in the code comments holds. The single biggest problem is that the Dashboard lost all three of its `<h3>` headings when they became tab labels: the screen now contains no heading below `<h1>`, and two of the three chart panes render a chart with no title in view at all, which costs sighted users the subject of the chart and costs screen-reader users heading navigation on the app's home screen. Nothing here is Critical or High; five Mediums and ten Lows, all fixable at XS or S.

## Overall Score

**84 / 100** — band 75-89, "Solid. Contained High findings, or accumulated Mediums, hold it below 90."

No Critical and no High findings. Five Medium findings — a heading regression on the primary screen, a control-vocabulary collision across three adjacent screens, an ambiguous lead-field placeholder, an unlinked tab control, and a horizontal-overflow risk — hold it out of the 90s. Every one of the five is XS or S, which is why it sits at the top of the band rather than the middle.

## Strengths

- **The consolidation is correct and the removed breakpoints cost nothing.** `.kpi-strip` at 320px gives each `.mini-value` 208px (256px card interior − 36px icon − 12px gap); the three-column layout the 560px query used to collapse gave roughly 55px. `.stat-strip` at 2 columns gives each `.st-value` 112px, and `renderDailyStats` (line 7963) always emits exactly four tiles, so the `:nth-child` dividers describe the grid at every width. Both keep `overflow-wrap: anywhere`.
- **Touch targets are clean.** Every control the redesign introduced or reopened declares a 44px floor: `.segmented button` (1382), `.more-fields > summary` (1936), `.cal-nav button` (1985), `.convert-btn` (2220), and `.filter-row > select` inherits it from the base rule (1119). The narrowest chart tab is 79px wide at 320px.
- **Focus indicators are handled, including the case that needed thought.** `<summary>` matches neither `button:focus-visible` nor `[tabindex]:focus-visible`, and the explicit rule at 1945 exists for exactly that reason.
- **Contrast for the redesign inherits verified pairs.** Every new or changed text rule uses `--text` or `--text-2` on `--surface`/`--surface-2`, all four of which are rows in `PAIRS` (check-contrast.mjs 94-99). No new colour value was introduced. One exception is UI-10.
- **Sign is never hue-only.** `fmt()` (4546) puts the minus outside the symbol; `kpiPlannedNet` (7625) adds colour on top of that, not instead of it; and the trend legend (2506-2510) repeats the arrows precisely so the legend is not itself hue-only.
- **The `<details>` choice.** No JavaScript, no new gesture, correct AT behaviour for free, and hiding a field inside a closed disclosure does not change its value or its participation — the two add handlers (5898, 6354) read `incNotes`/`expNotes` unconditionally and both still work.

## Findings

---

**UI-01 — The Dashboard now contains no heading below `<h1>`, and two of three chart panes have no title in view**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:2463-2513` (`#dashboard` chart card); `2455-2461` (advisor card)
- **Evidence:** The three `<h3>` headings that titled the Needs/Wants, Planned vs Actual and Monthly Trend cards became the three tab labels at 2486-2488. `<section id="dashboard">` (2405-2514) now contains no `<h1>`-`<h6>` element. `.advisor-title` (2457) is a `<span>`, not a heading. Only the trend pane carries a caption (`.chart-sub`, 2503); the donut pane (2491) and the plan pane (2498) render a chart with nothing naming it. Income (2636, 2688), Expenses (2713, 2754) and Analytics (2794, 2800) all still use `<h3>`.
- **Impact:** A screen-reader user navigating by heading — the standard way to skim a page — finds nothing on the app's home screen. A sighted untrained user must infer a chart's subject from a 13px pill in a three-up control, which UI-08 shows is wrapped to two lines on most phones. `project.md` requires every screen to be understandable without training; a donut with no title does not meet that.
- **Recommendation:** Give each `.dash-pane` a leading `<h3>` carrying the pane's full name. Only the active pane is in flow, so exactly one renders and the visual weight of the old three-heading stack does not return. This also restores the fuller wording ("Planned vs Actual", "Monthly Trend") that the tab labels had to shorten.
- **Effort:** XS

---

**UI-02 — Three visually identical segmented controls on adjacent screens, doing two different kinds of thing**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:2485` (Dashboard, selects a chart); `2695` (Expenses, selects the data mode); `2761` (Analytics, selects the data mode)
- **Evidence:** All three use `.segmented`, `role="group"` and `aria-pressed`. The Dashboard's middle tab reads "Plan vs Actual"; the Expenses and Analytics controls read "Actual" / "Planned". `setExpMode` (5960) changes what the entire Expenses screen is about, including the form title and whether `#expRecWrap` exists; the Dashboard handler (6002) swaps a chart inside one card and nothing else.
- **Impact:** The same control, in the same visual language, using overlapping words, has a screen-level consequence on two tabs and a card-level consequence on a third. For a user with no accounting background and no training, "Plan vs Actual" on Home and "Planned" on Expenses are the same phrase; only one of them changes their data view. The Dashboard control being inside a card is a real distinction, but it is the only one.
- **Recommendation:** Adopt UI-01 (a per-pane `<h3>` states what the selected pane is, which is most of the fix) and reword the middle Dashboard tab so no tab label duplicates a mode name. Resolve the wording together with UI-08, which proposes a shortening for a different reason.
- **Effort:** XS

---

**UI-03 — The lead Amount placeholder renders as a 30px bold "0" and reads as an entered value**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:1903-1906` (`.amount-lead`); `2638` (`#incAmount`); `2715` (`#expAmount`); `--placeholder: var(--text-2)` at `102`
- **Evidence:** `::placeholder` inherits the input's font, so the `placeholder="0"` on both fields now renders at `--t-display` (30px) and `--w-bold` (700). The only difference from a real entered value is `--text-2` versus `--text` — a secondary text colour deliberately tuned to full AA readability, not a faint one. Every figure the app displays elsewhere is formatted `₮0` (4546); this is a bare `0` with no symbol.
- **Impact:** The single most-used field in the application can be read as already filled with zero. The handlers reject it (`if (amount <= 0) { toast('Enter an amount'); return; }` at 5893 and 6352), so no wrong figure is stored — this is a bounced entry, not a data defect, which is why it is Medium and not higher. Before the redesign the same placeholder was at `--t-body` and did not carry this weight.
- **Recommendation:** `.amount-lead::placeholder { font-weight: var(--w-regular); }`. Do not reach for `--text-3` — placeholder text still has to meet AA, and `--text-3` is the disabled-text token.
- **Effort:** XS

---

**UI-04 — The Dashboard chart tabs give assistive technology no link to the region they control**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:2485-2513` (markup); `6002-6014` (handler)
- **Evidence:** The control is `role="group"` with three `aria-pressed` buttons. There is no `aria-controls`, the panes carry no `role` and no accessible name, and the handler toggles `.active` and `aria-pressed` only — no live region, no focus move.
- **Impact:** A screen-reader user pressing "Trend" hears "Trend, pressed" and receives no indication that the region below changed and no way to navigate to it. `display: none` correctly removes the inactive panes from the accessibility tree, so the content is reachable by continuing to read — that workaround is why this is Medium. The same pattern surfaces on the Expenses (2695) and Analytics (2761) mode toggles, where the swap is larger; report once, fix consistently.
- **Recommendation:** Add `aria-controls` on each button naming its pane, and `role="region"` plus `aria-label` on each `.dash-pane`. Smaller than converting to the full `tablist`/`tab`/`tabpanel` pattern, and it preserves the current keyboard behaviour of each button sitting in the tab order.
- **Effort:** S

---

**UI-05 — The donut legend overflows its card below roughly 430px, producing page-level horizontal scroll**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:1446-1450` (`.donut-wrap`, `.legend`, `.legend .row`); `7681-7686` (legend markup); pane at `2491`
- **Evidence:** `.legend .row` is `display: flex` at its initial `flex-wrap: nowrap`. Its children are a 10px dot, a `flex: 1` name span (whose `min-width: auto` floors it at min-content, ~43px for "Savings"), a bold amount, and a percentage with `margin-left: 6px` on top of the row's 8px gap. For a 7-figure MNT amount that is roughly 183px of unshrinkable content. Available width is `viewport − 32 (main) − 2 (card border) − 32 (card padding) − 140 (svg, flex-shrink: 0) − 16 (gap)`: **98px at 320, 138px at 360, 168px at 390, 208px at 430.** Neither `body` (794), `main` (875) nor `.card` (894) sets `overflow-x`.
- **Impact:** `ui-guidelines.md` states "No horizontal scrolling". The overflow is data-dependent — a 5-figure amount (~161px total) fits at 360 and 390 and still overflows at 320 — and the row paints outside the card rather than clipping, so the figures stay readable. That is why this is Medium rather than High. This is pre-existing: the redesign changed the pane's frame, not `.donut-wrap`. It is in scope because this pane is now the Dashboard's default view.
- **Recommendation:** `.legend .row { flex-wrap: wrap; }` and `overflow-wrap: anywhere` on the amount, or stack `.donut-wrap` to a column below ~400px. Measure at 320/360/390 before and after — the arithmetic above is derived from declared values, not observed.
- **Effort:** XS

---

**UI-06 — Advisor severity is carried by badge colour alone**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1857-1870` (`.advisor-count` and its three state rules); `2458` (markup); `7499-7501` (handler)
- **Evidence:** `.advisor-count.good`, `.warning` and `.critical` differ only in `background` and `color`. `badge.textContent = tips.length` (7499) in all three states, so the rendered text is the same digit whatever the severity.
- **Impact:** Hue-only signalling. A colour-blind user, or any screen-reader user, gets "3" with no severity. The information is recoverable one scroll down, because each `.advisor-tip` carries its level in a border tint *and* an emoji *and* the wording — which is why this is Low. Pre-existing; in scope because the card sits on the redesigned Dashboard.
- **Recommendation:** Give the badge an `aria-label` naming the worst level, and add one non-colour difference (a glyph or a ring) for the `critical` state.
- **Effort:** XS

---

**UI-07 — The two "one card, divided" treatments introduced together divide differently**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1051-1063` (`.kpi-strip` / `.kpi-mini`); `1563-1573` (`.stat-strip` / `.stat-tile`)
- **Evidence:** `.kpi-strip` puts the padding on the card (`padding: 0 var(--s4)`) and the divider on the row (`.kpi-mini + .kpi-mini { border-top }`), so the hairlines are inset 16px from both card edges. `.stat-strip` puts the padding on the tile (`.stat-tile { padding: var(--s4) }`) and the divider on the tile edge, so the hairlines run to the card border — which is also why it needs `overflow: hidden`.
- **Impact:** The same pattern, introduced in the same change on the two screens it was introduced for, presents two different ways. `ui-guidelines.md` asks for consistent cards. Nothing fails for the user.
- **Recommendation:** Pick one. The inset form (`.kpi-strip`) is the safer default because it does not depend on `overflow: hidden` to clip corners.
- **Effort:** XS

---

**UI-08 — Two of the three chart tab labels wrap on the phone widths the app targets**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1376-1385` (`.segmented`, `.segmented button`); `2486-2488` (labels)
- **Evidence:** Derived. Text box per button = `((viewport − 66) − 8 padding − 8 gaps) / 3 − 16 button padding` → **63px at 320, 71px at 360, 87px at 390, 100px at 430.** At 13px weight 500, "Needs / Wants" is roughly 77px and "Plan vs Actual" roughly 86px; "Trend" is roughly 35px. No `white-space` is declared, so both long labels wrap to two lines at 320 and 360, and "Plan vs Actual" is borderline at 390. Nothing overflows — a flex item's `min-width: auto` resolves to the widest word ("Needs", ~36px) — but the strip grows past its 44px `min-height` to about 47px.
- **Impact:** The Dashboard's primary control shows three pills of visually unequal text mass on most phones. Cosmetic.
- **Recommendation:** Shorten the middle label so it fits at 320px, and add `line-height: 1.15` so the two-line case at the narrowest widths stays tidy. Decide the wording together with UI-02, which wants the same label changed for a different reason.
- **Effort:** XS

---

**UI-09 — The icon language is now mixed inside the same cards the change was made to unify**

- **Severity:** Low
- **Location:** claim at `expense-pwa/index.html:2224-2233`; remaining emoji on in-scope screens at `2738` (`#expRecEnd` placeholder, Expenses/Planned), `6409` (recurring tag), `6429` (next-occurrence line), `5938-5939` and `6463-6464` (`✎`/`✕` in the Income and Expenses list rows), and the Financial Advisor tip icons pushed at `7184-7482` and rendered at `2460`
- **Evidence:** The comment at 2232 states that replacing the emoji "removes the only inconsistency in the icon language". After the change, the Financial Advisor card carries a stroked SVG in its title (2457) and three platform emoji in the tips directly beneath it. `.list-item .actions button svg` (1259) is styled for an SVG that the Income and Expenses row markup never emits.
- **Impact:** The platform-dependent rendering the change was made to eliminate is still present on three of the four redesigned screens, in some cases in the same card as the icon that was converted. The stylesheet already carries a rule for the un-migrated case.
- **Recommendation:** No sweep — the project forbids large mechanical edits. Either narrow the comment to what was actually done, or take the two highest-traffic remaining sets (advisor tip icons, list-row edit/delete) as a scoped follow-up.
- **Effort:** S

---

**UI-10 — The tinted KPI icon pairs are the one thing these screens paint that `check-contrast.mjs` does not measure**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1070-1072`; `tools/check-contrast.mjs:52-124`
- **Evidence:** `.kpi-mini.good/.bad/.accent .mini-icon` place `--success-text` / `--danger-text` / `--primary-text` on a 12% tint of the same hue composited over `--surface`. `PAIRS` covers each of those three foregrounds on `surface` and on `surface-2` (77-90) but not on its own tint. The `over:` compositing mechanism the row would need already exists and is used for the calendar heat cells (117).
- **Impact:** No known failure across the 16 themes — the tint is weak, so the ground stays close to `--surface`, and the arrows are redundant with the "Income" / "Expenses" / "Left After Plan" labels beside them, so WCAG 1.4.11 does not bind. The cost is that the file's own stated rule ("Entries are added by the work that establishes them", line 49) is not kept, so a seventeenth theme would inherit an unmeasured pair.
- **Recommendation:** Three rows at `min: 3.0` using the existing `over:` form.
- **Effort:** XS

---

**UI-11 — `.cal-nav button` was reopened and left off-scale, with one declaration now dead**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1981-1987`
- **Evidence:** The rule was edited to add `display: inline-flex`, `align-items`, `justify-content` and an SVG size. It still carries `border-radius: 8px` rather than `var(--r-sm)`, `padding: 6px 14px`, and `font-size: 16px` on a button whose only content is now an SVG. `.cal-nav` itself keeps `margin-bottom: 12px; gap: 8px` rather than `var(--s3)` / `var(--s2)`.
- **Impact:** None for the user. The project states at 116-119 that off-scale values are replaced "as their blocks are next opened". This block was opened and they were not, so the convention is drifting at exactly the point it is supposed to be enforced.
- **Recommendation:** `var(--r-sm)`, `var(--s3)`, `var(--s2)`, and delete `font-size`.
- **Effort:** XS

---

**UI-12 — The range-preset pill's affordance is left entirely to the rendering engine, and it does not size the way the comment says**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1398-1419`; used at `2407`, `2607`, `2701`, `2773`; `PRESETS` at `4718-4728`
- **Evidence:** Two things. First, no `appearance` is declared for `select` anywhere in the file, so the disclosure indicator is whatever the platform draws. The rule strips `width: 100%`, applies `border-radius: var(--r-full)` and de-emphasises the label to `--text-2` semibold at `--t-sm`. Where a UA draws no indicator, the first control on all four core screens becomes a bordered pill of secondary-coloured text with nothing marking it operable. **This cannot be settled from source — it needs a device check on iOS Safari.** Second, the comment at 1405 says the control "shrinks to its own text"; a `width: auto` `<select>` shrinks to its *widest option*, so the pill is sized by "Last 30 Days" / "Last 90 Days" regardless of what is selected. The visual outcome is still a compact chip, so this is a comment-accuracy issue, not a layout one.
- **Impact:** Potentially the primary filter on four screens stops looking like a control on one platform family. Contrast itself is fine — `text-2` on `surface` is row 97 of `PAIRS`. The keyboard and screen-reader story is unaffected: it is still a native `<select>` with `aria-label="Date range preset"`.
- **Recommendation:** Verify on iOS Safari at 390px. If no indicator is drawn, add an explicit chevron via `appearance: none` plus a background image, keeping the native `<select>` element. Correct the comment either way.
- **Effort:** S

---

**UI-13 — The two required Amount fields are the only required fields in the app carrying no marker**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:2637-2638` (`#incAmount`); `2714-2715` (`#expAmount`); the rule stated at `2198-2211`; handlers at `5893` and `6352`
- **Evidence:** The file states its own test at 2205: "A field is marked here if and only if its handler returns early rather than storing what was typed." Both handlers do exactly that (`if (amount <= 0) { toast('Enter an amount'); return; }`). Neither label carries `.required-mark`, and neither input carries `aria-required="true"`, while `#sHourly` (2537), `#goalName`, `#goalTarget` (2831, 2836), `#debtName`, `#debtPrincipal` and `#debtTotal` (2911-2915) all do.
- **Impact:** The two most-used required fields in the application are the two that do not announce as required. Pre-existing; in scope because the redesign rewrote exactly these two label lines and re-established them as the lead field of each form.
- **Recommendation:** Add `<span class="required-mark">*</span>` to both labels and `aria-required="true"` to both inputs.
- **Effort:** XS

---

**UI-14 — On the Planned expense form, the disclosure is separated from the form it extends by an unrelated block, and the two use the same rule treatment**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:2713-2750`; `.more-fields` border at `1933`; `#expRecWrap` inline border at `2723`
- **Evidence:** In Planned mode the reading order is Amount → Category/Date → helper → `#expRecWrap` (a `border-top: 1px dashed` block carrying a label, a helper paragraph, a select, a conditional interval field, an end-date field and a second helper) → `.more-fields` (a second `border-top: 1px dashed` block) → Add. The two blocks are marked identically.
- **Impact:** "Notes and currency conversion" ends up roughly 200px below the fields it belongs with, and the identical dashed rule gives the reader no cue that the second block is collapsible while the first is not. The recurrence block staying outside the disclosure is right — the comment at 2709-2712 justifies it correctly — but its placement pushes the disclosure out of its own form.
- **Recommendation:** Move `.more-fields` above `#expRecWrap` so the optional-extras disclosure stays adjacent to the main fields and the recurrence block remains the last thing before Add. Alternatively differentiate the two rules so the collapsible one reads as collapsible.
- **Effort:** XS

---

**UI-15 — Two of three Dashboard charts now require a press, and the selection resets on every launch**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:2485-2513`; handler `6002-6014`
- **Evidence:** The default pane is the Needs/Wants donut. "Plan vs Actual" — the only per-category over-budget view on Home — is behind a press. The handler stores nothing, so the selection survives navigating away and back within a session (all screens stay in the DOM) but resets to `split` on every reload or relaunch. The per-category over-budget signal is also produced as an advisor tip (7246), but `renderAdvisor` shows only `tips.slice(0, 3)` (7507), so it can be pushed behind "See all N tips".
- **Impact:** On a screen whose job is a glance, the over-budget picture can be two interactions away. This is genuinely mitigated: the "Left After Plan" tile (2448) and the advisor card both sit above the chart card, so the headline signal is not lost — which is why this is Low and not Medium. The reset is the sharper edge: a user whose reason for opening the app is budget adherence re-selects the same tab every launch.
- **Recommendation:** Persist the selected pane alongside the filter state that `applyPreset` already saves and restores (4837-4858). Do not couple the default to the advisor's output — that makes a tab a data dependency.
- **Effort:** XS

---

## Clean Areas

- **Navigation.** All eight modules in `project.md` are reachable. The tab bar (3073-3094) carries five targets; `setScreen` (5711-5718) sets both `.active` and `aria-current="page"`, and marks the More button active for the modules behind it. The active state is colour *and* stroke weight (1340-1342), plus the `<h1>` names the screen. Modals carry `role="dialog"`, `aria-modal` and a labelled close button.
- **States.** Every list has an empty state, and the Income/Expenses lists correctly distinguish "you have nothing" from "nothing matches this filter" (5918-5924, 6397-6402). `#pvaChart` (7724) and `#monthlyChart` (7854) both have empty branches; the donut renders a "No data" centre label (7677); the advisor has one (7504). `renderDailyStats` always emits four tiles, so the stat card has no gap state. Every delete is confirmed (`confirmDialog`, 5946). Save failure has a dedicated banner with an export action (2380-2383).
- **Numbers and formatting.** `fmt()` (4546) is the single money formatter, thousand-separated, with the sign outside the symbol. Dates render as ISO throughout, including the new peak-day sub-line (8013) — terse, but consistent and unambiguous.
- **Touch targets and keyboard.** Covered under Strengths. Every control the redesign touched is keyboard-reachable in source order; `<details>` opens on Enter and Space natively.
- **Spacing.** The new rules use the token scale throughout. One off-scale value: `min-height: 60px` on `.amount-lead` (1905), which is a control height rather than spacing.
- **Colour and theme.** The palette is limited and the redesign introduces no new colour value. Income/expense/warning meanings hold across the four screens. The two hue-only risks found are UI-06 (reported) and the chart tab active state, which is not hue-only — it changes background *and* foreground *and* adds a shadow, on top of `aria-pressed`.

## Quick Wins

- **UI-01** — one `<h3>` per pane restores headings and per-chart titles in a single edit; only one is ever in flow.
- **UI-02** — resolved almost entirely by UI-01 plus one label reword; no structural change.
- **UI-03** — one `::placeholder` declaration on a class only two fields carry.
- **UI-05** — one `flex-wrap: wrap` removes a guideline violation on the app's home screen.
- **UI-04** — S rather than XS only because it touches three controls; the attributes themselves are mechanical.

## Estimated UX Impact

Once UI-01 through UI-05 are fixed, the Dashboard stops being a screen with no headings and no chart titles: a screen-reader user can navigate it, and a sighted user always sees what the visible chart is about without decoding a wrapped pill. The Home screen stops scrolling sideways on the phone widths most users are on. The most-used field in the app no longer looks pre-filled, so the first entry a new user attempts is less likely to bounce with a toast. And the segmented control stops meaning two different things on three adjacent screens. None of these changes the information architecture the redesign established — the consolidation, the amount-first order and the disclosure are all sound and should stay.
