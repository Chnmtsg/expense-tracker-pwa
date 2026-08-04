# Code Review — Round 9

*(Delivered as the agent's message. The agent is read-only by role definition and holds no write tools; the text below is its complete report, transcribed unmodified.)*

## Executive Summary

The application is in good health and the round‑8 gate work is verifiably on disk: `nextPlannedDue` now applies a forward-looking floor (`expense-pwa/index.html:5229-5251`) with two probe flows that assert the contract (`tools/harness/recurrence.js:102-130`), `freshDefaults` closes the module-constant aliasing (`:2732-2733`), the quarantine is cleared after a confirmed restore (`:5953`) and after a reset (`:5987`), the width-mode harness suppresses the scrollbar gutter and now *requires* `viewport_clientWidth` (`tools/harness/run.mjs:83-85`, `:214-223`), and the open-horizon branch is executed by two new flows (`recurrence.js:146-190`). I re-derived each rather than accepting the previous report.

Round 9's display-currency reading holds its stated invariants where they matter most: nothing writes to `db`, the preference lives in its own key (`:7298`, `:7319`), `fmt`/`fmtCompact`/`unmoney` are untouched, `readCachedRates()` never fetches (`:7330-7340`), and there are exactly two `.conv-reading` elements, each directly beneath the ₮ figure it reads (`:2022`, `:2096`). Nothing in the new code can throw at boot — I traced all four new boot-path statements to a guard or a hoisted declaration.

The single biggest risk this round is not the feature; it is that the assertion written to protect the feature's most important invariant measures the wrong bytes. `v1-write-flows.js:282-314` compares `localStorage.getItem('expense-tracker-v1')`, but the constraint it is written for — *"the export blob byte-identical when the currency changes"* — is a property of the in-memory `db` that `exportBackup()` serialises (`:3480`). A change that mutated `db` without saving would pass this assertion and break the export on the next tap.

**No Critical and no High findings.** Three Medium, five Low.

## Overall Score

**91 / 100** — band 90-100, "Production ready. No Critical or High findings."

Round 8's High and both of its data-layer Mediums are closed and re-derived. The three Mediums that remain are one UI claim that outruns what the code measured, one performance site whose cost does not shrink with the user's filter, and one instrument gap; none blocks a user or corrupts a figure.

---

## Findings

### Critical

None. I looked for data loss, a wrong financial figure, a security hole and an unusable state, and found none.

### High

None.

---

### Medium

**CODE-01 — The Display Currency help line asserts a reading the render path may refuse to produce**

- **Severity** — Medium
- **Location** — `expense-pwa/index.html:7392-7401` (the gate and the claim), against `:7330-7340` (`readCachedRates`) and `:7348-7352` (`renderConvReading`'s gate)
- **Evidence** — Two different predicates decide the same question.
  - `syncDisplayCurrencyControl` gates on `const rates = readCachedRates(); sel.disabled = !rates;` and then writes `` `Net Balance and Net Salary also show ≈ ${displayCurrency}, using the rate of ${asOf}` ``. `readCachedRates` returns truthy for *any* cache entry satisfying `c && c.rates && c.rates.MNT` (`:7334`).
  - `renderConvReading` requires more: `convertVia(mnt, 'MNT', displayCurrency, rates)` returns `null` when `!r[to]` (`:7406`), and `:7352` then calls `hide()`.

  So a cache carrying `MNT` but not the selected code leaves the select **enabled**, the help line stating that both totals now show a reading, and both `#kpiNetConv` and `#sNetConv` `display:none`. This is not hypothetical: `tools/harness/v1-write-flows.js:180-183` seeds exactly that shape — `rates: { USD: 1, MNT: 3400 }` — and selecting any of the other 27 codes in `ALL_CURRENCIES` (`:7104-7136`) against it reproduces the state. The claim is derived from `rates.MNT` and presented as a statement about `rates[displayCurrency]`, which is the "a derived claim is MEASURED before it gates" rule inverted.

  With the live open.er-api.com table all 29 codes resolve, which is why this has not been seen; the app has no way to notice when that stops being true, because nothing re-checks and there is no other signal to the user.
- **Impact** — The Settings screen can state that the app is doing something it is not doing, on the one card whose entire job is to explain that feature, with no competing signal. A user who picks a currency and sees nothing appear has been told by the app that something did appear, so the rational conclusion is that the two totals are somewhere else on the screen.
- **Recommendation** — Gate the help line on the same fact the render gates on. In `syncDisplayCurrencyControl`, replace the `else` branch's condition with a test that the selected code is actually convertible — `rates.rates[displayCurrency]` — and give the failing case its own sentence ("No saved rate for XXX yet. Open the Currency Converter while online to refresh."). Three lines, one function, no new state.
- **Effort** — XS

**CODE-02 — `drawMonthlyTrend` walks the entire database once per month, and is the only Dashboard cost that does not shrink with the selected period**

- **Severity** — Medium
- **Location** — `expense-pwa/index.html:6644-6653`, called from `:6480`
- **Evidence** — Inside `months.map(...)` the predicate is `const inMonth = (x) => { const d = parseISO(x.date); return d.getFullYear() === mo.y && d.getMonth() === mo.m; }`, applied as `db.income.filter(inMonth)` and `db.actual.filter(inMonth)` — the **full arrays**, not the `income`/`actual` already filtered to the period at `:6410-6411`. `months` is capped at 36 (`:6640`). `parseISO` (`:3843`) does `s.split('-').map(Number)` plus a `new Date(...)` per call.

  This is arithmetic, not a timing measurement, and I state it as such: at 10,000 income+expense records over an All-Time range the loop performs 36 × 10,000 = 360,000 `parseISO` calls, each allocating an array and a `Date`. Every other heavy site in `renderDashboard` operates on the already-filtered subset (`groups` at `:6467`, `drawPvA` at `:6474`, `renderAdvisor` at `:6477`), so their cost falls with the filter. This one does not: on "This Month" with 10,000 lifetime records it still walks all 10,000 twice. `renderDashboard` runs on every navigation to Home (`:4713`), every date-range change (`:8448`) and after every income and expense write (`:4873`, `:4895`, `:5310`).
- **Impact** — Projected, not measured. This is the first thing on the Dashboard to become perceptible as a database grows, and it is the site a user cannot avoid by narrowing the date range — which is the escape hatch every other cost on this screen has. `knowledge/project.md` lists "Fast" as a project principle.
- **Recommendation** — One pass instead of 36. Build a bucket keyed by `x.date.slice(0, 7)` from `db.income` and `db.actual` once, then read `months` out of it. This removes `parseISO` from the path entirely — the ISO string's own prefix is the month key, and `ISO_DATE_RE` (`:3494`) already guarantees the shape on every imported record. ~10 lines inside the one function; no other consumer touches this code.
- **Effort** — S

**CODE-03 — The storage-invariance assertion cannot fail on the symptom it names**

- **Severity** — Medium
- **Location** — `tools/harness/v1-write-flows.js:282-314`, against `expense-pwa/index.html:3480` (`exportBackup`)
- **Evidence** — The flow's own header states the constraint as *"Switching display currency must leave the stored blob byte-identical … the assertion that makes the REJECTED shape — a currency that reaches the database — impossible to land by accident."* What it measures is `localStorage.getItem('expense-tracker-v1')` before and after four `setDisplayCurrency` calls (`:290`, `:298`).

  No path in `setDisplayCurrency` (`:7317-7324`) calls `save()` or `writeDb()`. `renderDashboard` and `renderSalaryConvReading` do not write. So the stored blob is **guaranteed** unchanged across the switch regardless of what `setDisplayCurrency` does to `db` in memory — and `exportBackup` at `index.html:3480` serialises `db`, not localStorage. A future change that set, say, `db.settings.displayCurrency` without saving would leave `before === after` true, `M_pref_stored === 'USD'` true, the flow green, and the export blob changed on the very next tap of Export Backup.

  The `M_pref_stored` guard at `:310-313` closes a different hole (the switch doing nothing at all) and does close it. This one is untouched.
- **Impact** — No user impact today. The cost is that the constraint most likely to be violated by a future change — a display currency reaching the money layer — is watched by an assertion structurally blind to the in-memory half of it, in a probe whose header says the opposite. This is the same class the project has paid for repeatedly: a guard narrower than the sentence written on it.
- **Recommendation** — Capture `JSON.stringify(db)` alongside the localStorage read at `:290` and `:298` and compare both. Two lines. Demonstrate it red by adding a throwaway `db.settings.__x = code;` to `setDisplayCurrency` — the localStorage comparison stays green and the new one goes red, which is the demonstration that distinguishes them.
- **Effort** — XS

---

### Low

**CODE-04 — Both `renderDashboard()` calls added in round 9 are unreachable as effects, and a comment states the opposite**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:7321` (in `setDisplayCurrency`) and `:7477` (in `openConverter`), against `:6404` and the comment at `:7472-7475`
- **Evidence** — `renderDashboard` returns at `:6404` unless `#dashboard` has class `active`. Neither call site can run while it does:
  - `:7321` is reached only from the `change` listener on `#displayCurrency` (`:7487`), and that select lives inside the Settings screen (`:2409`).
  - `:7477` is reached only from `openConverter`, whose only triggers are the two `[data-conv-target]` buttons at `:2195` (Income screen) and `:2230` (Expenses screen), wired at `:7519-7524`.

  The Dashboard reading is in fact refreshed by `navigate('dashboard')` → `renderDashboard()` at `:4713`, which is why nothing is visibly broken. The comment at `:7472-7475` says *"the Settings control can become available and both readings can appear — so they are resynced here rather than waiting for the next navigation."* For `#sNetConv` that is true; for `#kpiNetConv` it is exactly waiting for the next navigation.
- **Impact** — No user impact. Team impact is the recurring one: a comment asserting a coupling the code cannot have, in new code, which the next reader will trust when deciding whether a fourth call site is needed.
- **Recommendation** — Keep both calls — they are correct and free if a display-currency control ever appears on the Dashboard — and correct the two comments (`:7314-7316`, `:7472-7475`) to say what holds: the salary reading is refreshed here; the Dashboard's is refreshed by `navigate()`, because `renderDashboard` is Dashboard-only by the guard at `:6404`.
- **Effort** — XS

**CODE-05 — The Display Currency card is the only Settings card `renderSettings()` does not refresh**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:5655-5662` (`renderSettings`), against the three ad-hoc call sites `:8465` (boot), `:7320` (`setDisplayCurrency`) and `:7476` (`openConverter`)
- **Evidence** — `renderSettings` refreshes six things and not this one. The card's state is instead maintained by three separate calls placed by hand. The state that drifts: `syncDisplayCurrencyControl` last ran when a rate cache existed, the cache then disappears — `fetchRatesUSDBase:7241` removes an unreadable entry itself, and a quota eviction can do it — and the user opens Settings. `renderSettings()` runs, the card is not touched, and it keeps an enabled select and a "using the rate of X" line while both readings have silently vanished. Also reachable after `btnReset` (`:5989` calls `renderSettings()`).

  Reachability is thin, which is why this is Low and not folded into CODE-01. The structural point is not thin: the seam exists and this card does not use it, so a fourth state-changing path will have to remember a fourth call.
- **Recommendation** — Add `syncDisplayCurrencyControl();` to `renderSettings()`. One line. The boot call at `:8465` can stay (it must, because `calcSalary()` at `:8466` renders before any navigation to Settings), but the two ad-hoc calls at `:7320` and `:7476` then become belt-and-braces rather than load-bearing.
- **Effort** — XS

**CODE-06 — The reading rounds to whole units of the display currency, so a real balance can read "≈ USD 0"**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:7357` calling `fmtCurrency` at `:7410-7417`
- **Evidence** — `fmtCurrency` does `const rounded = Math.round(amount)` before formatting. Against a ₮/USD rate of ~3,400 that makes every net balance under ₮1,700 render as `≈ USD 0`. Worked through:
  - Net ₮1,500 → 0.44 → `≈ USD 0 · rate of Mon, 04 Aug 2026`.
  - Net −₮1,200 → −0.35 → `Math.round(-0.35)` is `-0`; `-0 < 0` is false, so `sign` is `''` and `Math.abs(-0)` is `0` → `USD 0`. A deficit's sign is lost in the band (−0.5, 0]. The ₮ figure above it still carries `-₮1,200`, so the user is not misled about direction — only the reading is degenerate.
  - The most-seen instance: the Salary screen boots with an empty form, so `calcSalary()` at `:8466` renders `sNet` = `₮0` and `sNetConv` = `≈ USD 0 · rate of …` on every visit for any user with the feature on. The file elsewhere is explicit that this distinction matters — `setNumPlaceholder:3773-3775` exists because *"'₮0' and '—' look alike at a glance but mean opposite things, and only one of them is a claim about the user's money."* The reading has no equivalent.

  This is inherited behaviour, not new: `fmtCurrency` is shared with the converter and reusing it was the right call. The reading is the first place it is applied to a figure the user did not choose.
- **Recommendation** — Extend `renderConvReading`'s existing absence path rather than touching the shared formatter: after `:7352`, `if (Math.abs(converted) < 1) return hide();`. One line, reusing `hide()`, and consistent with the block comment's own rule that absence is a supported state. **Note the coupling before doing it:** `v1-write-flows.js:242-269` relies on `#sNetConv` carrying a digit *before* the rate is removed, which today comes from the empty salary form rendering `≈ USD 0`. Seed a non-zero salary net in that flow in the same commit, or the offline assertion goes vacuous for the salary site.
- **Effort** — XS

**CODE-07 — The rate date shown to the user is a 16-character slice of a third party's free-text field, computed in two places**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:7356` and `:7399`, against `:7255` and `:7469`
- **Evidence** — Both sites do `rates.updatedText ? String(rates.updatedText).slice(0, 16) : 'unknown date'`. `updatedText` is `data.time_last_update_utc` straight from open.er-api.com (`:7255`); `slice(0, 16)` happens to cut `"Mon, 04 Aug 2026 00:02:31 +0000"` at the right place. If that upstream format changes, the app presents a truncated fragment of an unknown string to the user as a date, on the line whose entire purpose is disclosing staleness. The app already records its own timestamp on the same object (`timestamp: now`, `:7256`) and already uses it for exactly this purpose eleven lines away: `new Date(currentRates.timestamp).toLocaleString()` at `:7469`. The 16 is also a duplicated derivation across two functions — `coding-standards.md`, "Avoid duplication".
- **Impact** — Small. The disclosed date is the one thing that makes a stale reading honest rather than hidden, and it currently depends on a third party's string formatting.
- **Recommendation** — One helper beside `readCachedRates` — `const rateAsOf = (r) => new Date(r.timestamp).toLocaleDateString()` — used at both sites. Uses a value the app wrote itself, removes the magic 16, and removes the second copy.
- **Effort** — XS

**CODE-08 — `renderSalaryConvReading()` repaints ten elements to refresh one**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:7364-7367`, calling `calcSalary` at `:4741-4784`
- **Evidence** — The function's name and comment scope it to the reading; its body is `calcSalary()`, which writes `sNormalPay`, `sOTPay`, `sNTPay`, `sOTNTPay`, `sFieldPay`, `sGross`, `sSI`, `sWHT`, `sDeductions` and `sNet` (`:4754-4763`) before reaching `renderConvReading` at `:4768`.

  **On the question of side effects: there are none that matter, and I checked rather than assumed.** `calcSalary` reads the nine fields through `readSalaryField` (`:4739`), writes ten text nodes, and returns a rounded object. It does not touch `db`, does not call `save()` (confirmed against `check-saves.mjs`'s scope chain — it is not in `ALLOWED` and produces no hit), does not toast, and does not touch `.invalid` (that lives in the `input` handler at `:4790` and the Save handler at `:4811`, not here). Called with the same field values it produces the same DOM, so the repaint is genuinely idempotent. The guard at `:7365` (`if (!document.getElementById('sNet')) return`) is always true, since `#sNet` is static markup at `:2095`.

  The cost is a name that under-describes what runs, and a coupling: the moment anyone adds a side effect to `calcSalary` — a draft save, an autosave, a validation toast — it will fire from the Settings screen and from the converter modal.
- **Recommendation** — Nothing structural today. Either narrow the name to what it does (`recalcSalaryPanel`) or, better, ride it along with the standing debt item below: split `calcSalary` into a pure compute and a paint, then this becomes `renderConvReading('sNetConv', computeSalary().net)` and says what it means. Do not do the split for this reason alone.
- **Effort** — XS

---

## Review Areas — Coverage

**Correctness of Money — clean.** The unit of record is stated once at the parse boundary (`:3845-3859`) and WORK-150's addition there is accurate: `formatMoneyInput`'s `replace(/\D/g, '')` at `:3877` is genuinely the decimal guard, and it runs per keystroke before `unmoney` ever sees the field. Rounding has one boundary per figure — `calcSalary:4778-4783` rounds its whole return object in one place, `fmt:3762` and `fmtCompact:3820` are NaN-safe through `n || 0`. The display currency changes none of this: `renderConvReading` receives an already-rounded integer at both sites (`Math.round(net)` at `:4768`; `net` is an integer sum at `:6422`), so the ≈ line can never disagree with the ₮ line above it by a tugrik — the property its own comment at `:4764-4767` claims, and it holds. `convertVia` cannot return `Infinity` (the denominator is `r.MNT`, guaranteed truthy by `readCachedRates:7334`) and `NaN` is caught at `:7352`. Dates remain `toLocalISO`/`parseISO` throughout; no `toISOString()` in the file. CODE-06 is a precision-of-display finding, not a correctness one.

**Data and Persistence — clean; CODE-03 is instrument-side.** One seam (`writeDb`/`save`/`load`), single blob therefore atomic, numbered append-only migrations stamping the version actually reached (`:2794-2808`). `load()` is total and the `d = null` at `:3155` is present. Round 8's CODE-02 and CODE-03 are both closed and re-derived: `freshDefaults:2732` is used at all four fallbacks, and `clearQuarantinedCopies()` now runs after a clean restore (`:5953`, guarded on `!dataWasCorrupt`) as well as on reset (`:5987`). The display currency touches none of it — the preference is in its own key (`:7298`), written through `rememberUiPref` (`:7319`), which swallows a Safari-private throw by design (`:3953`). Offline-first holds: `readCachedRates` never fetches, no boot path reaches the network, and `sw.js` is stale-while-revalidate with the revalidate inside `waitUntil`.

**Architecture — clean.** No render function calls `save()`. The UI reaches storage only through the seam, with the documented `loadFromCloud` exception behind an empty config. The new code respects the layering: `setDisplayCurrency` is a real seam and every mutation of the preference goes through it. CODE-05 is the one place the new feature declines to use an existing seam.

**Maintainability — CODE-07, CODE-08.** Names are meaningful and the comments continue to state derivations rather than results, with the two exceptions in CODE-04. No dead code beyond CODE-04's two calls, which I would keep. `catch { }` without a binding at `:7306` and `:7335` differs from the `catch (_) {}` used at `:2958` and `:7241`; both are valid and this is a style preference, not a finding.

**Error Handling — clean.** Every new failure path degrades to absence rather than to an error: unreadable rate cache → `null` → hide (`:7335-7339`); missing element → return (`:7345`); unconvertible code → hide (`:7352`); unreadable preference → `'MNT'`, the off state (`:7306-7310`). `openConverter`'s catch (`:7479-7482`) correctly does *not* resync, since nothing changed. One narrowness worth knowing rather than fixing: if `fetchRatesUSDBase` succeeds but `rememberUiPref` fails to store the result (`:7266`), the converter works while `readCachedRates` stays null, so `syncDisplayCurrencyControl` tells the user to *"Open the Currency Converter once while online, then come back"* — which they have just done, and which will never work. Safari private browsing is the reachable case, and in that state `writeDb` is failing too and the save-error banner is already up, so the user is not left thinking the app is healthy.

**Security — clean.** `escapeHTML:8435` is correct and applied at every attribute interpolation; `check-escaping.mjs` re-derives that as a search. The new option markup at `:7386-7388` escapes both the value attribute and the label. The reading itself is written via `textContent` (`:7357`), never `innerHTML`. I re-checked the text-content sites the escaping predicate deliberately does not cover: `analyzeExpenses` composes tip strings with unescaped `cat?.name`/`g.name` (`:6067`, `:6082`, `:6116`, `:6277` and five more), but both sinks escape at the render — `renderAdvisor:6349-6350` and `openAdvisorModal:6366-6367`. `computeReminders:4185-4232` does the same and `openNotifModal:4287-4288` escapes at the sink. Every `confirmDialog` message built from a record name (`:5564`, `:5858`, `:7804`) reaches `msgEl.textContent` at `:4491`. Nothing sensitive is logged. `eslint` remains the only dependency, dev-time only.

**Performance — CODE-02.** The display currency costs nothing when off: `renderConvReading` returns at `:7348` before touching localStorage. When on, it adds one `getItem` + `JSON.parse` of the rate table per dashboard render and per salary keystroke (`:4790` → `calcSalary` → `:4768`). The rate blob is a few KB and the parse is on the order of microseconds; I am not raising it. CODE-02 is the site that matters. The previously recorded inventory is unchanged: `drawDailyStackedChart` filters per day over ≤90 days, `renderCalendar` over ≤42, `db.categories.find(...)` per record recurs in `drawDonut:6468`, `drawPvA:6536` and six advisor rules, and `renderGoals:7737` calls `goalSaved` per goal (`:7723`, a full scan of `goalContributions`).

**Reliability and Scalability — projected, not measured.** At 10,000 records the first thing to become perceptible is CODE-02, because it is the only Dashboard cost the user cannot reduce by narrowing the period. `renderDaily` remains the heaviest screen. Both recurrence walkers `console.warn` on guard exhaustion (`:5246`, and the same in `plannedOccurrences`), so a truncated total announces itself rather than looking correct.

**Boot safety — assessed clean, with the derivation.** The documented hazard class is a throw between `let db = load()` (`:3026`) and the `#importFile` change listener (`:5880`). Round 9's only top-level statement in the file is the `change` listener at `:7487`, which is *below* `:5880`, so it cannot reproduce that class; it is unguarded like the ~50 other registrations in that span, and `#displayCurrency` is static markup at `:2409`. The four boot-sequence statements are all safe: `loadDisplayCurrency()` (`:8464`) reads `localStorage` inside a try and `ALL_CURRENCIES`, a `const` initialised at `:7136`, well before `:8464` — no TDZ; `syncDisplayCurrencyControl()` (`:8465`) guards both elements at `:7383` and calls only hoisted declarations (`escapeHTML:8435`, `readCachedRates:7330`); `calcSalary()` (`:8466`) reaches `renderConvReading`, which guards its element at `:7345` and its rates at `:7350`. No new throw site exists at boot.

---

## Technical Debt

- **`calcSalary` computes and paints (CODE-08).** Recorded in round 8 and now carrying a second caller that wants only one of the two responsibilities. Splitting it into a pure compute and a paint is the change that makes `renderSalaryConvReading` honest and makes salary figures producible without a screen. Not urgent; the coupling is now one caller wider than it was.
- **The two reorder implementations.** `initCategoryReorder` and `initIncomeTypeReorder` remain ~45 near-identical lines. Standing deferral; trigger (a behavioural change to either) has not fired.
- **`analyzeExpenses:5996-6330`** — still ~330 lines of 26 inline rules, each re-deriving its own filter from `db`. It is where the AI Budget Assistant from `knowledge/project.md`'s Long-term Vision will want to live and it is the most expensive place in the file to add a rule safely.
- **Every consumer re-derives its own filter/expand pipeline from `db`.** CODE-02 is a direct consequence: `drawMonthlyTrend` reaches past the filtered lists sitting four lines above it because there is no query layer to make the filtered set the obvious thing to use.
- **There is no register of what each probe asserts.** `VERIFICATION.md` is a Stage‑0 document; §6 covers the four static predicates and the save allow-list, and nothing records the harness assertions. Round 9 added four to `v1-write-flows.js` and they are documented only in the probe's own comments — which is defensible, and better than a stale table, but it means a reviewer must read three probe files to know what a green `npm run v1` means. CODE-03 is what that costs: an assertion whose header overstates it, findable only by reading it.
- **The ~2,650 top-level statements between `let db = load()` (`:3026`) and the `#importFile` listener (`:5880`).** Unchanged residual risk; round 9 added nothing inside that span. Mitigated by all three harness commands booting the full app and `boot-crash.js:70` asserting init completed.

## Future Risks

- **CODE-03 is the one that bites later, not now.** The display currency's whole safety argument is "nothing reaches the money layer". That argument is currently defended by a probe flow that would not notice the most likely way it gets broken. Every subsequent currency-adjacent feature will be added under the belief that this flow guards it.
- **CODE-01 becomes a real defect the moment the currency list and the rate source diverge.** The app takes 29 codes from a hand-written constant and rates from a free third-party endpoint, with no reconciliation and no signal when one lacks the other.
- **The reading is one card away from becoming a unit of account.** The design's structural safety — one converted figure per card, never in place of the ₮ figure — is currently enforced by `v1-write-flows.js:367-385`, which counts `.conv-reading` elements *per card*. A reading added on its own card elsewhere (an Income row, a goal card) would pass every assertion in the file. That is the correct trade for now; it is worth knowing which half is guarded.
- **CODE-02 compounds with Reports (Long-term Vision).** A reports module will want month-over-month series, and the pattern it will copy is the one at `:6644`.
- **Cloud Sync remains last-write-wins over a whole-document blob** and `loadFromCloud` still bypasses `load()`'s normalisation (`:3127-3133` records this honestly as deferred WORK-15). The display currency is unaffected — it is not in `db` — which is one more argument for that placement.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **Compare `JSON.stringify(db)` as well as the stored bytes in the storage-invariance flow (CODE-03).** Two lines in `v1-write-flows.js:290`/`:298`, demonstrated red by planting a `db.settings` write in `setDisplayCurrency`. This is first because it is the assertion everything else about the feature's safety rests on, and it is currently the cheapest thing on this list.
2. **Gate the Settings help line on the fact the render gates on (CODE-01).** Three lines in `syncDisplayCurrencyControl`, plus one sentence for the "no rate for this code" case. Removes the only way this feature can state something false.
3. **Bucket by month in one pass in `drawMonthlyTrend` (CODE-02).** ~10 lines inside one function, no other consumer affected, and it removes `parseISO` from the Dashboard's hot path entirely.
4. **Call `syncDisplayCurrencyControl()` from `renderSettings()` (CODE-05), and correct the two comments that claim the Dashboard reading is resynced eagerly (CODE-04).** One line and two paragraphs, same feature, one pass.
5. **Hide the reading below one unit (CODE-06) and factor the rate date into one helper (CODE-07).** Two one-line changes in the same 60-line region. Do CODE-06 *with* the `v1-write-flows.js:242-269` seeding change in the same commit, or the offline assertion goes vacuous for `#sNetConv`.

CODE-08 needs no action of its own; take it when `calcSalary` is split, which is standing debt rather than a finding.
