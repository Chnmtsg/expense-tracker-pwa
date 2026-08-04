# UI Review — Round 9

*(Delivered as the agent's message. The agent has read-only tools by role definition — `Read`, `Glob`, `Grep` — so it could not write this file itself; the text below is its complete report, transcribed unmodified.)*

## Executive Summary

Every finding from Round 8 is genuinely closed on disk — I opened each site rather than trusting the record: `.grid-2`'s dropped item is correctly recorded as a risk not a fix, `--danger-hover` and `.val-zero` are token-painted, `syncCalendarAnchor()` is called from both the change and restore paths, and `#sSave` now calls `revealEntryDate` like its two siblings. WORK-142 is the most carefully-built feature in this file: the unit of record is never touched, absence is a supported state, the ≈ line never replaces the ₮ figure, and the explanation of the disabled control lives in a sibling helper exactly as the standing convention requires. The single biggest problem is that the feature cannot be switched on by following its own instruction — the helper line tells the user to "Open the Currency Converter", and nothing in the tab bar, the More sheet or Settings is named that; the only two doors are buttons labelled "🌍 Convert from foreign currency" buried inside the Income and Expenses add forms. Behind that sit two more problems with the same card: the reading gives a rate from six months ago the same visual treatment as one from this morning, while the converter marks the identical condition with a ⚠, and the card's own layout squeezes that all-important helper sentence into roughly a third of the card width at 320px.

## Overall Score

**90 / 100** — Production ready. No Critical and no High findings, which is what the 90-100 band requires. It sits at the floor of that band rather than higher because all three Mediums are on one newly-landed card and one of them leaves a shipped feature unreachable for a user who follows the app's own instructions.

## Strengths

Verified at source, not accepted from the record.

- **WORK-142's central invariant is structural, not clerical, and it holds.** `renderConvReading` is called from exactly two sites (`:4768`, `:6433`), both a single already-computed net, both beneath the ₮ figure they read. `renderConvReading` rounds nothing new — the salary site passes `Math.round(net)`, the same whole tugrik `fmt()` prints on the line above (`:4763-4768`), so the two lines cannot disagree by a tugrik. Nothing in the block writes to `db`; the preference lives in its own `localStorage` key (`:7298`).
- **The disabled-control convention is applied correctly, and this is the first place in the file that gets it right.** `#displayCurrency` is disabled when no rate is cached (`:7393`) and the reason is in the sibling `.helper` (`:7395`), never in the select's own label. The rationale is written at `:7369-7379` and `:2398-2401`. `input:disabled, select:disabled` paints from `--text-3` on `--surface-2` (`:1045`) — tokens, not `opacity`. Contrast this with `#converterUse` (`:7439`), the known finding, which does the opposite.
- **The "text is painted from a token" rule now has no live counter-example over readable text.** `.conv-reading` explicitly declines the obvious `opacity` treatment and says why (`:979-984`). `button.danger:hover` is `--danger-hover` (`:1119`), `.chip.off` is `--surface` + `--text-2` (`:1402-1405`), `.val-zero` is `--text-2` unmodified (`:1803`). Every remaining `opacity` in the sheet is on an inactive control, a non-text graphic, a transient drag state, or a layer behind text.
- **The state matrix, destructive confirmation and empty-state coverage are still complete.** Twelve `confirmDialog()` sites, every list has both a plain and a filtered empty state, and the force-clear path resolved its double-toast so a failed write is the last thing said (`:5727-5736`).
- **Absence is designed rather than defaulted.** No cached rate hides both readings and collapses them (`:7346`, `:7350`), and `readCachedRates()` never fetches (`:7330-7340`) so the Dashboard's paint does not depend on connectivity.

## Findings

---

**UI-01 — Settings instructs the user to open a "Currency Converter" that no navigation surface in the app is named after**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7395` (the helper string), against `:2195` and `:2230` (the only two entry points) and `:2525-2574` (the More sheet)
- **Evidence:**
  - `:7395` — with no rate cached, `#displayCurrencyHelp` reads *"No exchange rates saved yet. Open the Currency Converter once while online, then come back."* This is the shipped default for every user, because `loadDisplayCurrency()` starts at `MNT` and the cache starts empty.
  - The converter is opened only by `openConverter()`, wired at `:7519` to `[data-conv-target]`. `grep` for that attribute returns exactly two elements: `:2195` and `:2230`. Both are labelled **"🌍 Convert from foreign currency"**, and both sit part-way down the Add Income and Add Expense form cards, below the amount field and the quick-amount row.
  - The string "Currency Converter" appears in the app in exactly one place the user can see: `:2621`, the modal's own `<h3>`, which is only visible *after* the user has already found the button. The More sheet lists Budget Planning, Savings Goals, Salary Calculator and Settings (`:2529-2573`) and no converter. The tab bar has five destinations, none of them it.
  - `openConverter()` is also the only thing in the application that populates the rate cache — `fetchRatesUSDBase()` has one caller (`:7460`) — and `:7472-7478` says so. So this is not one route among several; it is the only route, described by a name that appears nowhere on the path to it.
- **Impact:** Every user who opens Settings meets a permanently-inert control with an instruction they cannot act on. `project.md` defines the audience as people with little accounting knowledge for whom "every screen should be understandable without training", and the instruction names a destination that does not exist by that name. The rational reading is that the app is broken. The card is otherwise the most carefully-designed disabled state in the file, and this one sentence is what makes it a dead end.
- **Recommendation:** Reword the string at `:7395` to name the control the user will actually see and where it is: *"No exchange rates saved yet. Open Income → 🌍 Convert from foreign currency once while online, then come back."* That is the smallest safe fix and it costs one string. **Do not** reach for the apparently-better fix of adding a Currency Converter entry to the More sheet without more work: `openConverter(targetInput)` would be called with no target, and the `#converterUse` handler returns silently at `:7493` when `converterTargetInput` is null — the user would get an enabled-looking button that does nothing, which is a worse version of the problem this finding is about.
- **Effort:** XS

---

**UI-02 — The ≈ reading gives a rate from six months ago the same treatment as one from this morning, while the converter flags the identical condition with a ⚠**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7326-7340` (`readCachedRates`) and `:7354-7357` (the rendered string), against `:7244` and `:7465-7469`
- **Evidence:**
  - `RATES_CACHE_TTL_MS` is 24 hours (`:7142`). The converter uses it as a threshold with three distinct treatments: fresh network (`:7464`), `cache-fresh` under 24h (`:7466`), and `cache-stale` over 24h — which gets `statusEl.className = 'conv-status warn'` and the text *"⚠ Offline — using stale cached rates from …"* with a full local date-time (`:7468-7469`).
  - `readCachedRates()` deliberately ignores that threshold (`:7326-7329`), and `renderConvReading` produces one string for every age: `` `≈ ${fmtCurrency(...)} · rate of ${asOf}` `` (`:7357`), where `asOf` is `updatedText.slice(0, 16)` — for this API, "Tue, 05 Aug 2026". A one-hour-old rate and a one-year-old rate render in the same size, the same token and the same phrasing.
  - The stale case is the *normal* case here, not the exception, and that follows from UI-01 plus `:7472-7473`: the only thing that refreshes the cache is opening the converter, which is behind a button most users will never find. A user who opens the converter once to enable the feature and never again keeps that rate under their Net Balance indefinitely.
  - The Settings helper repeats the same flat disclosure (`:7400`) with no age judgement either.
- **Impact:** This line sits directly under the Dashboard hero — the app's single most-read figure. The user is shown a foreign-currency amount that the app itself would call stale in its other surface, with nothing distinguishing it. MNT/USD moves enough over months that a reading months old is a materially wrong impression of what the balance is worth, and the only cue is a date the user must convert to an age in their head. The app already has a notion of "stale" and a treatment for it; the new feature simply does not use either, so the same condition means two different things in two places.
- **Recommendation:** In `renderConvReading`, compute the age from `rates.timestamp` — which is already stored (`:7256`) — and when it exceeds `RATES_CACHE_TTL_MS`, change the wording rather than the paint: `` `≈ ${…} · rate may be out of date (${asOf})` ``. Wording, not colour or opacity, keeps this inside the standing text-paint rule and needs no new token or pair-table row. Mirror the same distinction in the Settings helper at `:7400`. Do **not** start discarding stale rates — `:7326-7329` is right that a disclosed approximation beats nothing.
- **Effort:** XS

---

**UI-03 — The Display Currency card forces a 115-character helper and a 120px select into a row that cannot wrap, so the sentence the design depends on renders in about a third of the card at 320px**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:2404-2410`, against `.row-inline` at `:1900` and the `.helper` rationale at `:1826-1834`
- **Evidence:**
  - `:2404` — `<div class="row-inline" style="justify-content:space-between;gap:var(--s3)">` with two children: a `<div>` holding the title and `#displayCurrencyHelp`, and `<select id="displayCurrency" style="width:auto;min-width:120px">` at `:2409`.
  - `.row-inline` at `:1900` is `display: flex; gap: 8px; align-items: center` — **no `flex-wrap`**. The file's own pattern for a row that must survive a narrow screen is to wrap: `.filter-row` (`:1280`), `.goal-foot` (`:1483`), `.goal-meta` (`:1463`), `.notif-actions` (`:826`), and the salary summary's figure row (`:2097`) all set `flex-wrap: wrap`. This row cannot, at any width.
  - The two helper strings this element carries are long. Disabled: 93 characters (`:7395`). Enabled: about 115, e.g. *"Net Balance and Net Salary also show ≈ USD, using the rate of Tue, 05 Aug 2026. Nothing stored or exported changes."* (`:7400`).
  - **Derived from the declared box model, not observed.** Card content width `A(W) = W − 32` (main padding, `:851`) `− 2` (card border, `:872`) `− 32` (card padding `--s4`, `:874`) `= W − 66`. Both flex items take the default `flex-shrink: 1`, so free space is distributed against their flex base sizes; the select cannot pass its inline `min-width: 120px`, so it freezes there and the text block receives `A(W) − 12 (gap) − 120`. That is **110px at W=320, 150px at 360, 180px at 390, 220px at 430**. A 115-character string at `--t-sm` (13px) in 110px is roughly seventeen characters per line.
  - **How to measure rather than derive this, which is the part that should gate any fix:** `node tools/harness/run.mjs <probe> --width 320|360|390|430`, with the probe calling `navigate('settings')` then `syncDisplayCurrencyControl()` and reporting `document.getElementById('displayCurrencyHelp').getBoundingClientRect().width` alongside `viewport_clientWidth`. The runner fails a width-mode probe that does not report the width it was asked for (WORK-130a), which is what makes the figure worth quoting.
  - `:1833` states, as the justification for `.helper`'s size, *"Every `.helper` is a full-width block, so nothing reflows."* That claim is now false at this site and at `#settingsThemeName` (`:2387`); the Appearance card got away with it because its helper is one word.
- **Impact:** This helper is not decoration. It is the sole carrier of the explanation of why the control beside it is off — the whole point of the design recorded at `:7369-7379`. Putting a correct explanation in a 110px column on the narrow end of the band `project.md` names as primary undoes most of what that decision bought, and `ui-guidelines.md` says plainly "Avoid cramped layouts". Nothing overflows and there is no horizontal scroll — the text block's `min-width: auto` floors at its longest word — so this costs legibility and card height, not layout integrity.
- **Recommendation:** Move `#displayCurrencyHelp` out of the inner `<div>` so it is a sibling of `.row-inline` and spans the card, exactly as every other `.helper` in the file does and as `:1833` claims they all do. The row then holds the title and the select only, which is short enough to survive 320px. Apply the same to `#settingsThemeName` in the same commit so `:1833` becomes true again rather than half-true.
- **Effort:** XS

---

**UI-04 — The ≈ reading is set in the same size and token as the line it is subordinate to, and on the Salary card it is larger than the figures it is subordinate to**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:985-988` (`.conv-reading`) against `:972` (`.hero-trend`); markup at `:2022-2023` and `:2096-2097`
- **Evidence:**
  - `.conv-reading` is `font-size: var(--t-sm); margin-top: var(--s2); color: var(--on-hero)`. `.hero-trend` at `:972` is `font-size: var(--t-sm); margin-top: var(--s2)` and inherits `color: var(--on-hero)` from `.hero-kpi` (`:941`). The two are pixel-identical in size, colour and spacing.
  - Markup order on the Dashboard is value → `#kpiNetConv` → `#kpiNetTrend` (`:2018-2023`), so the approximate conversion takes the position nearer the figure and the app's own judgement — *"↑ 35% of income saved"* / *"↓ Over budget by ₮X"* (`:6438`, `:6440`), the one sentence on the card that interprets the balance — is pushed down and given equal weight.
  - On the Salary card the inversion is sharper: `#sNetConv` at `--t-sm` (13px) sits directly above the Gross / Social insurance / Withholding tax / Total deductions row, which is `font-size:12px` (`:2097`). The subordinate approximation renders **larger** than the four real component figures.
  - The rationale at `:983` says *"Subordination is carried by size and by the ≈ instead"*. Size is not in fact carrying it against either neighbour; only the ≈ is.
- **Impact:** Small but real for a glance-read screen. Two identically-styled 13px lines under the hero give the user no cue which is the app telling them something and which is a currency conversion, and on the Salary card the visual ranking of the figures is wrong. Nothing is unreadable and nothing is incorrect.
- **Recommendation:** Drop `.conv-reading` to `--t-micro` (11px, the scale's floor, already used for `.mini-sub` and `.st-sub` in the same subordinate role) and leave the order alone, so adjacency to the figure it reads is preserved and the size difference does the subordinating the comment claims it does. That is one declaration at `:986` and it fixes both sites, since one rule serves both by design.
- **Effort:** XS

---

**UI-05 — The display-currency picker offers a flag and a three-letter code with no currency name, where the app's own currency picker gives all three**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7386-7388`, against `:7174-7182`
- **Evidence:**
  - `:7387` builds each option as `c.f + ' ' + c.c` — "🇰🇿 KZT", "🇦🇪 AED", "🇲🇾 MYR". The `n` field ("Kazakhstani Tenge", "UAE Dirham", "Malaysian Ringgit") is present on every entry in `CURRENCIES` (`:7104-7134`) and is simply not used here.
  - `renderCurPickList()` at `:7174-7182`, the converter's own picker, renders flag, `.code` **and** `.name` for the same 30 entries, and its search matches on the name (`:7170`). Two currency choosers in one app, built from one list, disagreeing about whether a code alone is enough.
  - `project.md` defines the audience as people with little accounting knowledge and requires every screen to be understandable without training. Twenty-nine ISO codes with no expansion is the kind of thing that requires it.
- **Impact:** A user scrolling a 30-item dropdown of unexplained codes will find USD, EUR, GBP, JPY and CNY and give up on the rest. Low, because the five currencies most users want are the recognisable ones and the choice is reversible.
- **Recommendation:** `c.f + ' ' + c.c + ' — ' + c.n` at `:7387`, matching the picker. **Land UI-03 first**: widening the option text on a select that is currently pinned into a 120px column beside a squeezed helper makes the layout worse before it makes it better. Once the select has the row to itself, the names fit.
- **Effort:** XS

---

**UI-06 — With a display currency on, "≈ USD 0" is printed under an empty balance and under any balance below half a unit**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7343-7358`, with `fmtCurrency` at `:7410-7417`; reached from `:6433` and `:4768`
- **Evidence:**
  - `renderConvReading` hides itself for three conditions — display currency off, no cached rate, and a null or non-finite conversion (`:7348-7352`) — but not for a zero result. `fmtCurrency` rounds to whole units (`:7411`), so at a rate near 3,400 ₮/USD any balance under about 1,700 ₮ renders as "USD 0".
  - The most common instance is not an edge case. `calcSalary()` runs unconditionally at boot (`:8466`) against an empty form, so `#sNet` is ₮0 and `#sNetConv` reads "≈ USD 0 · rate of …" every time the Salary screen is opened before anything is typed. The Dashboard does the same for a user whose filtered period nets to zero.
  - The file already has a considered position on printing a formatted zero where it is not a claim about money: `setNumPlaceholder(plannedNetEl, '—')` at `:6455`, with the reasoning at `:6452-6454` — *"₮0 here was indistinguishable from a plan spent down to nothing"*.
- **Impact:** Cosmetic noise on the two most prominent cards in the app, at the exact moment a new user first sees them. It does not mislead — ₮0 really is worth USD 0 — but it adds a line that says nothing under a figure that already says it.
- **Recommendation:** Add `if (converted === 0) return hide();` beside the existing guards at `:7352`, with a comment stating the derivation (a rounded-to-zero reading tells the user nothing the ₮ figure has not already told them, and absence is already a supported state on this element).
- **Effort:** XS

---

## Review Areas — Clean

- **Layout and Hierarchy.** Clean apart from UI-04. Dashboard order is unchanged and correct: filter → hero → three minis → Advisor → donut → Planned vs Actual → Monthly Trend (`:2008-2088`). The new ≈ line adds one 13px row to the hero and does not displace anything.
- **Navigation.** Clean for the seven modules in `project.md` — tab bar `:2498-2519`, More sheet `:2525-2574`, `aria-current` on every navigation `:4705`/`:4710`, header title from `screenTitle()` `:4711`. The Currency Converter is not a module in `project.md`, which is why UI-01 is filed as an instruction defect rather than a navigation gap.
- **Typography.** Clean apart from UI-04. One scale at `:109-115`; `.conv-reading` uses `--t-sm` from it rather than a literal.
- **Colour and Theme.** Clean. `--danger-hover` now exists in every theme with its derivation rule stated at `:1113-1117` and a pair-table row behind it; `.conv-reading` uses `--on-hero`, already measured against the scrimmed gradient at both sites (`:938-941`, `:1810-1815`) — I confirmed the Salary card genuinely carries the same gradient, so the "one rule serves both" claim at `:976-977` holds.
- **Spacing.** Clean as a rule; new declarations use the `--s*` scale. The residual off-scale literals are the standing rejected sweep and I am not re-raising them.
- **Cards.** Clean. The two new Settings cards use plain `.card` (`:2402`) with no overrides.
- **Mobile.** Clean apart from UI-03's cramping. `#displayCurrency` inherits `min-height: 44px` from `:1032`. No new horizontal-scroll surface: the `.row-inline` in UI-03 cannot overflow because the text block's automatic minimum is its longest word. `.grid-2` (`:879`) still has no `min-width: 0` release — correctly, since WORK-129 was measured out of the gate and the WebKit residual is a recorded risk with a stated trigger; I am not reopening it. The `.cal-grid` overlap below 375px is settled (WORK-97b) and I have no new argument.
- **Accessibility.** Clean. `#displayCurrency` has `aria-label="Display currency"` (`:2409`) and reaches the shared `select:focus` ring (`:1040`). Its disabled paint is token-based, not `opacity` (`:1045`), so it does not extend the `#converterUse` class of defect. The known `#converterUse` finding at `:7439` is unchanged and I am referencing it, not re-raising it.
- **States.** Clean. Absence of a rate is a designed state at both reading sites and is asserted per-card in `tools/harness/v1-write-flows.js`. Twelve `confirmDialog()` sites; every list has a plain and a filtered empty state.
- **Numbers and Formatting.** Clean apart from UI-06's zero case. `fmtCurrency` puts the sign outside the code (`:7415-7416`) for the same reason `fmt()` does, so a negative reading is `-USD 1,200` and not `USD -1,200`. The salary reading converts the same rounded whole tugrik that is painted on the line above (`:4763-4768`), which is the property that stops the two lines disagreeing by one.

**Confirmed from source, not re-raised:** WORK-141 stands as written. There is no `input[type="checkbox"]` rule anywhere in the file; the four controls at `:5761`, `:5767`, `:5771`, `:5775` are sized and painted entirely by `input, select, textarea` at `:1032-1039` — `padding: 11px var(--s3)`, `min-height: 44px`, `border: 1px solid var(--border)`, `border-radius: var(--r-sm)`, `background: var(--surface)` — and each overrides exactly one property, `style="width:auto"`. The markup agrees with the claim. What it cannot settle is how that renders, which is why the screenshot is still the right gate.

## Quick Wins

- **UI-01** — one string at `:7395`; without it the feature's default state is an instruction the user cannot follow.
- **UI-02** — one age comparison against a timestamp already stored, and a wording change; makes the ≈ line agree with the converter about what "stale" means.
- **UI-03** — moving one `<div>` out of a flex row; restores the full-width `.helper` invariant the stylesheet already claims at `:1833`.

## Estimated UX Impact

There are no Critical or High findings to fix. Once the three Mediums land, the Display Currency feature becomes something a user can actually turn on by reading the card in front of them rather than by stumbling across a button two screens away; the ≈ line under Net Balance stops presenting a rate months old with the same confidence as one from this morning, on a screen the user opens offline where that is the normal case; and the sentence that explains why the control is off is read across the card instead of down a 110px column on a 320px phone. Taken together that is the difference between a feature that is correctly built and a feature that is correctly built *and* reachable — which, on the evidence of this card, was the only part of WORK-142 that did not get the same care as the rest of it.
