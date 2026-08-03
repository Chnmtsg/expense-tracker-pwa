# Code Review — Round 8

## Executive Summary

The application is in good structural health and round 7's gate work is genuinely on disk: `load()` is total at `index.html:2918-3048`, the catch discards `d` at `:3012`, `boot-crash.js:70` now asserts `A_init_completed` as the property rather than as a precondition, `v1-write-flows.js` asserts every value it records, `run.mjs` fails on an empty payload and scans `THREW` recursively, and `drawPvA` keys by `categoryId` at `:6274`. I re-derived each of those rather than accepting the reports. The single biggest risk this round is not in the persistence layer — it is that a recurring planned expense anchored before today is reported as permanently overdue, with an "urgent" bell badge, a daily OS notification and a "📅 Next:" line naming four dates in the past, and the only affordance offered to clear it fabricates actual expenses that never happened. The project's own canonical fixture (`fixture.js:7`, "monthly past") is exactly this shape, and no command exercises it. Alongside that sit two data-layer defects (module constants aliased into `db`; a full quarantined copy of the database that outlives its own recovery) and two instrument faults of the class HANDOFF calls the expensive one — the width-mode harness measures in a viewport 15px narrower than any phone, and `npm run recurrence` never executes the open-ended horizon it is documented to guard.

**Stage 2's trigger did not fire.** I found no rounding or arithmetic defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. I re-derived all four of `fixture.js`'s expected totals by hand (290,000 / 360,000 / 260,000 / 50,000) and the 31st clamp, and every one is correct. CODE-01 is a defect in what `nextPlannedDue` *means*, not in what `stepDate` computes.

## Overall Score

**82 / 100** — band 75-89, "Solid. High findings exist but are contained."

One High, contained to one function's contract and its four consumers; five Mediums, none of which blocks a user; no Critical. Two of the Mediums are instrument-side rather than product-side, which is the position the project has deliberately traded into and is not a regression.

---

## Findings

### High

**CODE-01 — A recurring plan anchored before today is permanently overdue, and the app's only offered remedy fabricates expenses**

- **Severity** — High
- **Location** — `expense-pwa/index.html:4995-5008` (`nextPlannedDue`), `:5011-5025` + `:5100-5103` (`upcomingPlannedDates` and the "📅 Next:" render), `:3996-4013` (`computeReminders`), `:4179` (`maybeFireOSNotifications`), `:4121-4143` (the "→ Mark as Actual" handler)
- **Evidence** — `nextPlannedDue` at `:4997-5005` is `const done = p.recLastDone || ''; while (iso <= done …)`. For a plan with a frequency and no `recLastDone`, `done` is `''`, `p.date <= ''` is false for every non-empty string, so the loop never runs and the function returns **the anchor**, however old. Worked through with today = 2026-08-03 and a plan anchored 2026-01-05, monthly:
  - `computeReminders:4001` — `due > cutoff` is `'2026-01-05' > '2026-08-10'` → false, so it is included; `:4004` gives `daysUntil ≈ -210`; `:4011` sets `urgency: 'urgent'` because `daysUntil <= 1`. The bell badge is permanently non-zero and `maybeFireOSNotifications:4179-4188` fires an OS notification for it once per day, every day, forever.
  - `renderExpenses:5100` calls `upcomingPlannedDates(x, 4)`, which seeds from `nextPlannedDue` and steps forward four times → `2026-01-05 · 2026-02-05 · 2026-03-05 · 2026-04-05`, rendered under the literal label `📅 Next:` at `:5102`. All four dates are in the past.
  - The only control offered is `→ Mark as Actual` at `:4098`. Its handler at `:4127` pushes **one** actual expense dated at the overdue occurrence and advances `recLastDone` by one step, so clearing seven months of backlog means creating seven actual expenses the user never incurred.
  - The alternative — editing the anchor forward — destroys the property the anchor model exists to provide: `plannedOccurrences:4924` walks from `p.date`, so moving it forward makes every past period report Planned ₮0, which is the exact defect the v1→v2 migration at `:2639-2646` was written to end.
  - This is not an exotic shape. `renderExpenses:5107` labels a recurring plan `'Since ' + x.date`, which advertises backdating as the model, and the project's own fixture carries it: `tools/harness/fixture.js:7` is `F3 … '2025-10-05' … 'monthly past'`, 302 days overdue as of today. No assertion in `recurrence.js` calls `nextPlannedDue`.
- **Impact** — Two of the seven core modules in `knowledge/project.md` misreport. Budget Planning states a false fact about a date ("Next" naming only past dates). Reminders shows a permanently urgent alarm that cannot be dismissed and pushes a daily OS notification. Worst, the remedy the app puts in front of the user inflates their recorded actual spending by one occurrence per tap — a wrong financial figure produced by the app's own affordance, in an app whose stated purpose is to help users understand their spending.
- **Recommendation** — Change what "due" means for a never-logged past anchor, in `nextPlannedDue` alone. Its only callers are `computeReminders:4000`, `upcomingPlannedDates:5014` and the convert handler at `:4124`/`:4133`; `plannedOccurrences`, `hasPlannedOccurrence` and `expandPlannedInRange` do not call it, so the aggregation path and every past-period total are untouched. The smallest shape: when `recLastDone` is unset, start the walk at the first occurrence on or after today rather than at the anchor. This needs an explicit engineering decision on one question — whether an un-logged occurrence in the *recent* past should still nudge — so the decision belongs to the architect; the implementation is one function either way. Do **not** fix it by moving the anchor.
- **Effort** — S

---

### Medium

**CODE-02 — `load()` hands the module-level default arrays into `db` by reference, so editing a category mutates the defaults**

- **Severity** — Medium
- **Location** — `expense-pwa/index.html:2954`, `:3018`, `:3019` (against `:2955`)
- **Evidence** — Four fallbacks, three different copy semantics, in four adjacent lines:
  - `:2954` `categories: parsed.categories?.length ? parsed.categories : defaultCategories` — hands out the **module array itself**.
  - `:2955` `incomeTypes: … : defaultIncomeTypes.map(t => ({ ...t, id: uid() }))` — a full deep copy with fresh ids.
  - `:3018` `categories: [...defaultCategories]` — a new array over the **same nine objects**.
  - `:3019` `incomeTypes: [...defaultIncomeTypes]` — a new array over the same objects, keeping their ids.

  `saveEditCat:5346` does `cat.name = name; cat.group = group` in place, and `saveEditIType:5227` does `t.name = name`, so on the `:3018`/`:3019` path a rename mutates `defaultCategories[i]` / `defaultIncomeTypes[i]`. `load()` is then called again in-session from `btnReset:5729` and from the import handler at `:5694`, and re-reads the mutated constants. On the `:2954` path — reachable by importing a backup whose `categories` is `[]`, which `importProblem:3488` accepts because it only checks `Array.isArray` — `db.categories` *is* `defaultCategories`, so `catAdd:5167`'s `push` and `initCategoryReorder:5400`'s `splice` mutate it too.
- **Impact** — "Reset All Data", whose confirm text at `:5720` reads *"Delete ALL data (income, expenses, categories, salary history)"*, does not restore the default categories or income types: the user's renamed and regrouped ones come back as the "defaults" and are then persisted by the next `save()`. Self-heals on a page reload, which is what has kept it invisible. Beyond the defect, the four-way inconsistency is a trap: the next person to read `:2955` will reasonably assume `:2954` beside it copies too.
- **Recommendation** — One helper — `const freshDefaults = (list) => list.map(x => ({ ...x }))` — used at all four sites, with `:2955`'s `id: uid()` preserved where it is deliberate. One line each, plus a comment saying the copy is what stops a rename reaching the constant.
- **Effort** — XS

**CODE-03 — A quarantined copy of the whole database survives a successful recovery, unreachable, for the life of the origin**

- **Severity** — Medium
- **Location** — `expense-pwa/index.html:2809-2817` (`clearQuarantinedCopies`), called only from `:2836` and `:5728`; `:2828-2832`; `:2872-2877`; `:2928`; `:3600`
- **Evidence** — `quarantineCorruptData:2836` calls `clearQuarantinedCopies()` **before** writing the new copy, which fully closes the per-launch accumulation it describes. But the comment at `:2831-2832` names a *second* harm — *"The copies also outlived a successful recovery indefinitely, holding the user's financial history in a key nothing would read again"* — and nothing in the code addresses it. After the user restores a backup through `#importFile` (`:5687-5697`), `db = load()` resets `corruptRawKey = null` at `:2928`, so `downloadCorruptData:2873`'s `if (!corruptRawKey) return` makes the key unreachable, and `clearQuarantinedCopies` is called only on the *next* corruption event or on a full Reset at `:5728`. The blob stays in `localStorage` at `expense-tracker-v1.corrupt.<ts>` permanently.
- **Impact** — A full duplicate of the user's financial history is retained after they have explicitly replaced it, against a ~5 MB origin quota, in the one situation where quota headroom is what makes the next recovery possible. `updateStorageStatus:3600` reports `localStorage.getItem(KEY).length` as *"Your data"* while `navigator.storage.estimate()` two lines above at `:3594` reports the origin total including the orphan, so the Settings card shows an unexplained gap and offers no way to act on it. The only removal path is Reset All Data, which destroys everything. Secondarily, a comment states a problem as motivation and the code solves half of it — the class this project has closed repeatedly.
- **Recommendation** — Call `clearQuarantinedCopies()` after a confirmed successful restore, at `:5694-5697` once `db = load()` has produced a clean parse (`!dataWasCorrupt`), following the precedent already set at `:5728`; and narrow the comment at `:2831-2832` to what the call it sits above actually establishes. If retaining the damaged bytes after a restore is deliberate, the alternative smallest fix is to surface them in Storage Status with their size and a Clear button — but state which was chosen and why.
- **Effort** — XS

**CODE-04 — The width-mode harness reserves a 15px desktop scrollbar, so every measured width is a viewport the app never runs in**

- **Severity** — Medium
- **Location** — `tools/harness/run.mjs:89-110` (the host frame), `run.mjs:25-28` (the header claim); the figures it produced are at `expense-pwa/index.html:1609-1613` and `:1625-1629`
- **Evidence** — The four recorded rows differ from their stated viewport by a **constant 73px**: 320−247, 360−287, 375−302, 390−317. The app's declared inset at that container is `main { padding: 16px }` (`:835`) = 32, plus `.card` border 1px each side (`:854-857`) = 2, plus `.card.cal-card { padding-left/right: var(--s3) }` (`:1672`, `--s3: 12px` at `:95`) = 24 — **58**. `.card.cal-card` is a direct child of `main` (markup at `:2209`), so there is no further wrapper. The unexplained 15px is Chrome-on-Windows' classic scrollbar, reserved inside `run.mjs:92`'s `f.style.cssText='width:${width}px;height:820px'` because the app is far taller than 820px. The recorded table is internally consistent with itself (the padding-zero variant at `:1626-1629` adds exactly 24/7 = 3.43px per track, as it must), which is why nothing caught it. Corrected for a phone's overlay scrollbar the tracks become 35.7 / 41.4 / 43.6 / 45.7 and the crossover to "no overlap" moves from 390px to ~375px.

  The sharpest part: `run.mjs:27-28` states *"A probe that reports its own innerWidth is the only way to know what it measured."* `window.innerWidth` **includes** the scrollbar, so the one self-check the harness documents is precisely the one that cannot reveal this. `document.documentElement.clientWidth` is the number that can.
- **Impact** — Every width-mode measurement this harness will ever produce is ~15px narrower in layout than the device it claims to model, on a mobile-first app whose supported widths are 320–390px — a band where 15px is 5% of the viewport. WORK-97(b) was settled on these figures. The *decision* survives correction (the overlap is smaller, so accepting it is if anything better supported), but the derivation recorded in the source is wrong, and the next width question will be wrong the same way. This is the instrument-fault class `HANDOFF.md:117-119` names as the expensive one, in the mode `HANDOFF.md:136-139` documents as the fix for the previous instance of it.
- **Recommendation** — In `run.mjs`, add to the width-mode prelude a rule that removes the reserved gutter in the hosted frame (`html{scrollbar-width:none}` plus `::-webkit-scrollbar{width:0}`), so the frame lays out like an overlay-scrollbar browser; and record in the header that `innerWidth` includes a gutter while `clientWidth` does not, so a probe reporting only `innerWidth` cannot detect this. Then re-record the four rows at `index.html:1609-1613` and `:1625-1629`. No new runner, no new file, no change to the application.
- **Effort** — S

**CODE-05 — `npm run recurrence` never exercises the open-ended horizon it is documented to guard**

- **Severity** — Medium
- **Location** — `tools/harness/fixture.js:16-21`, `tools/harness/recurrence.js:44-57`, against `expense-pwa/index.html:4909` and `:4911-4916`
- **Evidence** — All four `RANGES` entries carry explicit `from`/`to` dates. `aggregationEnd:4909` is `(endISO) => (endISO >= OPEN_END ? todayISO() : endISO)` and `listingEnd:4911-4916` branches the same way, so with an explicit `to` **neither open branch is ever executed**. I confirmed no other command reaches it either: `boot-crash.js` and `v1-write-flows.js` both boot with an empty `db.planned` and a `thisMonth` preset. Replacing `todayISO()` at `:4909` with any other expression leaves all four totals and both clamp assertions green.

  That open branch is what the default All-Time view depends on: `renderDashboard:6158`, `renderExpenses:5081`, `[data-chip-none]:6490`, `renderDailyStats:6509` and `renderDailyChips:6643` all pass `OPEN_START`/`OPEN_END`. `VERIFICATION.md:169-187` lists five assertions about exactly this behaviour, every one ticked by hand in §5 and re-derived by nothing. Meanwhile `recurrence.js:1-19` describes itself as *"The recurrence engine's regression guard"* and `HANDOFF.md:102-103` instructs the reader to *"run it after any change to recurrence, filtering or the dashboard"*. Under round 7's standing ruling — a probe may not be described as guarding a behaviour unless it exercises it or asserts a property that implies it — that description is wider than what the probe asserts.

  A second uncovered path, same fix site: `computeNextRecurring:3943-3984` is the goals-side walker and, by its own comment at `:3959-3965`, carried ARCH-1 independently. Nothing calls it from any probe.
- **Impact** — The one command that can say no to a wrong number on the money engine cannot say no to the horizon that governs the app's most-used unbounded view. A regression there would restore the "totals are a function of the guard constant" defect that `:4875-4886` exists to prevent, with every command green.
- **Recommendation** — Two flows inside the existing probe, no new file and no new runner: (a) `expandPlannedInRange(db.planned, OPEN_START, OPEN_END)` yields no occurrence after `todayISO()` and a bounded count for F3 (tens, not thousands); (b) a plan anchored after today satisfies `hasPlannedOccurrence(p, OPEN_START, OPEN_END) === true` while contributing zero occurrences — the listing/aggregation split, which is the property the two horizons exist to keep apart. Both are already written as prose in `VERIFICATION.md:172-181`; this converts two sentences into two assertions. Demonstrate each red by perturbing `:4909`/`:4911`. A third flow over `computeNextRecurring` if it is cheap.
- **Effort** — S

---

### Low

**CODE-06 — The `.cal-grid` comment states that WORK-97(b) is settled and, forty lines later, that it is open**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:1619-1620` against `:1659-1662`; duplicated paragraph at `:1647-1652` against `:1659-1661`; also `:1670-1671`
- **Evidence** — `:1619-1620` reads *"THE OVERLAP IS ACCEPTED. This was the open question (WORK-97b) and it is now settled by measurement rather than left as a judgement."* `:1661-1662`, inside the same comment block, reads *"Whether the sub-390px overlap is acceptable is an open decision (WORK-97b), not a settled one."* `:1670-1671`, in the next block, reads *"Whether to spend the rest of the inset — or accept the overlap and record why — is WORK-97b."* The settlement was prepended and the paragraph it supersedes was left in place. The `#dpGrid` observation is also written twice, at `:1647-1652` and again at `:1659-1661`.
- **Impact** — No user impact, which is why this is Low rather than higher. Team impact is real and repeatable: `HANDOFF.md:42` records the decision as settled and says *"Do not reopen without a new argument"*, while the source of record says it is open. A reader who reaches the bottom of the block reopens a measurement that cost a probe run and an architect ruling. This is the class that has cost this project four rounds, and the fix is a deletion.
- **Recommendation** — Delete `:1659-1662` and the WORK-97b sentence at `:1670-1671`; the settlement at `:1619-1637` and the `#dpGrid` derivation at `:1647-1652` already say everything both carried. Ride it along with CODE-04's re-recorded figures — same comment block, one pass.
- **Effort** — XS

**CODE-07 — `opacity` over text at three sites, one of which is written twice**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:1713`, `:1069`, `:1112`, and `:7039` against `:7041`
- **Evidence** — The standing convention (round 7, C22; `HANDOFF.md:195-198`) is that text is painted from a token on a token-expressible ground, and that `opacity` on a text-bearing element is out because `check-contrast.mjs` cannot express it — its `over` mechanism at `:209-243` composites the background only. Live instances:
  - `:1713` `.barchart .col .val-zero { … color: var(--text-2); opacity: .5; }` — the `·` placeholder in both charts (`:6410-6411`, `:6733`).
  - `:1069` `button:disabled { opacity: .5 }` and `:1112` `.list-item .actions button:disabled { opacity: .25 }`.
  - `:7039` `useBtn.style.opacity = hasMNT ? '1' : '.5'` — an inline duplicate of `:1069` on the same element, applied to the button whose label at `:7041` is `'Set one side to MNT'`. That label is the **only** text telling the user why the primary action is unavailable and what to do about it, and it is rendered at half opacity by two independent rules. `:7040`'s `cursor` write duplicates `:1069`'s too.
- **Impact** — The predicate reports nothing about any of them. WCAG 1.4.3 exempts inactive controls, so `:1069`/`:1112` cause no conformance failure; the converter case is the one that costs something, because the instruction is unreadable at exactly the moment it is needed. `:7039`/`:7040` are also a direct deviation from `coding-standards.md` "Avoid duplicated styles".
- **Recommendation** — Delete `:7039` and `:7040`; `button:disabled` at `:1069` already sets both. If the converter's disabled state must read differently from every other disabled button, state it in tokens on that rule. Change `:1713` to a token colour with no `opacity`. Re-run `check-contrast.mjs`.
- **Effort** — XS

**CODE-08 — `aggregationEnd`'s comment claims Planned and Actual cover the same window; on All Time with a future-dated actual they do not**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:4894-4900` against `:6151-6162`
- **Evidence** — The comment at `:4894-4896` states *"An open range means everything up to today, so the Planned figure covers the same window as the Actual figure beside it."* In `renderDashboard`, `actual` at `:6152` is `db.actual.filter(x => inRange(x.date, from, to))`, and `inRange:3731-3736` returns true for every date when `from` and `to` are both `''`; `planned` at `:6158` goes through `aggregationEnd`, which clamps to `todayISO()`. So on All Time an actual dated in the future is counted on one side and has no counterpart on the other. The file itself worries about this input elsewhere — `:4906` describes *"a single actual mistyped as 2099"* — and `expDate` is an unconstrained `<input type="date">` at `:2049`-equivalent markup with no `max`.
- **Impact** — Small and rare. The stated invariant is not one, and the next reader who relies on it (for example when building the Reports module in `project.md`'s Long-term Vision) will assume the two sides are comparable on the default unbounded view.
- **Recommendation** — Narrow the comment to what holds — the horizon makes the two sides comparable *for the data the app expects*, and a future-dated actual is outside it — or clamp the aggregation-side `to` for actuals as well. The comment change is the smaller and safer of the two; the code change would silently hide a mistyped year, which is worse.
- **Effort** — XS

---

## Review Areas — Coverage

**Correctness of Money — clean.** Every stored amount is an integer tugrik: `unmoney:3703` strips to digits, `calcSalary:4597-4602` rounds its entire return object in one place, and `entryProblem:3361` rejects string amounts on import with the reason stated. `fmt:3618` and `fmtCompact:3676` are NaN-safe via `n || 0` / `+n || 0`, so no path can print `₮NaN`. Every division I traced is guarded by a positive-denominator test. Dates are `toLocalISO`/`parseISO` throughout — I grepped and there is not one `toISOString()` in the file — and every day-difference goes through `Math.round(… / 86400000)`, which is the correct handling for a DST-crossing pair of local midnights. I re-derived all four fixture totals by hand and they are right.

**Data and Persistence — CODE-02, CODE-03.** Single source of truth, single-blob therefore atomic write, one seam (`writeDb`/`save`/`load`), numbered append-only migrations with the version stamped at the step actually reached (`migrate:2651-2665`). `load()` is total, verified line by line, and the `d = null` at `:3012` is present and load-bearing. Import validates per record and rejects whole. Offline-first holds: `sw.js` is stale-while-revalidate with `waitUntil` on the revalidate, the converter degrades to labelled stale rates (`:7069-7072`), and every non-database `localStorage` write goes through `rememberUiPref:3788` so a Safari-private throw cannot raise the data-loss banner.

**Architecture — clean.** No `render*` calls `save()`; I checked every `save()` site through `check-saves.mjs`'s scope chain and by reading. The UI does not reach into storage except through the seam, with the one documented exception of `loadFromCloud:3147-3148`, which is quarantined behind an empty config and a hard precondition. `renderDashboard:6145`'s active-screen guard carries a correctly-scoped safety note.

**Maintainability — CODE-06, plus recorded debt.** Names are meaningful and the comments are unusually good — most state derivations, and the icon-grid block at `:1473-1495` re-derives correctly (I checked the arithmetic: 41.6px, 46.8px, the 2.4px shortfall and the 320–331px band all reproduce). The exception is CODE-06. No dead code found; `computeNextRecurring`'s millisecond arithmetic is gone as recorded.

**Error Handling — clean.** Every failure path I traced reports: `writeDb:3258-3267` raises the banner on both refusal and throw, `savedToast:3318` prevents a false success, the import path gives each step its own outcome including `r.onerror:5712`, and `updateStorageStatus:3584-3588` guards the `await` that previously reached `window.onerror`. `reportFatal:2775`'s corrupt-data guard is in place and `v1-write-flows.js:169-198` walks it with real assertions. The `fatalReported` reset at `:2945` closes the latch that ruling C5 governs, and all four flags reset in one place.

**Security — clean.** `escapeHTML:8024` is correct and applied at every attribute interpolation; `check-escaping.mjs` re-derives that as a search rather than a claim, and its header is honest about what it does not cover. The unescaped text-content sites (`:5097`, `:5107`, `:7339`, `:7349`) are each constrained by an import validator, which I verified individually. `findByDataId:5203` avoids building a selector from a record id. Nothing sensitive is logged. The only third-party dependency is `eslint`, dev-time only; Firebase's three SDK loads are behind an empty config.

**Performance — no new finding; the deferred trigger has not fired.** The costs are unchanged and I took no measurement, so I do not re-raise WORK-16/49 — third round. For the record of what breaks first: `drawDailyStackedChart:6703` runs `source.filter(…)` once per day inside a loop of up to 90 days, which is the only genuinely O(days × records) site with a user-controllable multiplier; `renderCalendar:6564` is the same shape at ≤42; and `db.categories.find(…)` per record recurs in `drawPvA:6273`, `drawDailyStackedChart:6728` and six `analyzeExpenses` rules. `renderCalendar:6598` correctly hoisted its `getComputedStyle` out of the cell loop.

**Reliability and Scalability — projected, not measured.** At 10,000 actuals a single `renderDaily()` performs roughly 1.3M predicate evaluations across the stacked chart, calendar and chips, and it re-runs in full on every chip tap, mode switch and day tap. That is the first thing to become perceptible on a mid-range phone. `plannedOccurrences:5000` and `hasPlannedOccurrence:5000` both `console.warn` when their guard fires, so a truncated total announces itself rather than looking correct.

**Technical Debt — see below.**

---

## Technical Debt

- **The two reorder implementations.** `initCategoryReorder:5354-5410` and `initIncomeTypeReorder:5233-5278` are ~45 lines each and differ only in the collection and the container id. This is `coding-standards.md`'s "Avoid duplication" and "Prefer reusable modules", and it is standing deferral WORK-85/WORK-35 whose trigger — a behavioural change to either path — has not fired. I do not re-raise it; I record that the second copy is still there and that any future change to drag behaviour must extract first, or the two will diverge silently.
- **`analyzeExpenses:5740-6070`** — 330 lines, 26 inline rules, no seam, each re-deriving its own filter from `db`. Recorded by the architect as a risk rather than a finding, and unchanged. It is where the AI Budget Assistant in `project.md`'s Long-term Vision will want to live, and it will be the most expensive thing in the file to add a rule to safely.
- **Every consumer re-derives its own filter/expand pipeline from `db`.** `renderDashboard`, `renderDailyStats`, `renderDailyChips`, `drawDailyStackedChart`, `renderCalendar` and `[data-chip-none]` each build their own. CODE-05 is the cost of that: an invariant that holds in five of six places is only checkable by running the app.
- **`calcSalary:4565-4603` computes and paints.** It writes ten DOM elements and returns the record. Two responsibilities in one function, against `coding-standards.md`. Small and cohesive today; it becomes a problem the moment salary figures need to be produced without a screen — which is the first thing a unit test under Stage 2 would want.
- **The ~2,650 top-level statements between `let db = load()` at `:2883` and the `#importFile` listener at `:5637`.** The recorded residual risk. I checked and found no reachable throw introduced this round — the round-7 work landed inside functions, CSS and templates, so the standing constraint was honoured. The span still contains dozens of unguarded `document.getElementById('x').addEventListener(…)` statements, each a live throw site if a markup id is renamed. Worth noting in mitigation: all three harness commands boot the full app, and `boot-crash.js:70` asserts init completed, so this class is now caught by a command rather than only by reading.

## Future Risks

- **CODE-01 gets worse as the roadmap arrives.** Notifications is a Long-term Vision item; a permanently-urgent reminder that fires an OS notification once a day is the shape that gets an app's notification permission revoked. Fix the meaning of "due" before building anything on top of it.
- **CODE-04 compounds every future geometry decision.** The harness is the only place a width-dependent claim can be checked, and it is currently 15px off. Any future breakpoint chosen from it will be chosen from the wrong number.
- **CODE-05 is the shape round 7 warned about.** Three probes exist, each written to close a specific hole, and each is now the most likely place the next hole hides. The recurrence probe's header claims more coverage than it has; that is the same sentence-versus-assertion gap that cost a High last round, in the newest artifact.
- **Reports (Long-term Vision) will be built on `db` directly**, because there is no query layer — and it will re-derive the filter/expand pipeline a seventh time. CODE-08's false invariant is exactly the sort of thing it will inherit.
- **At a real 5,000+ actual records** the Analytics screen becomes the first thing to stutter, and there is no measurement infrastructure for it — the harness measures layout, not time.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **Fix what "due" means for a never-logged past anchor — `nextPlannedDue` only (CODE-01).** One function, four known callers, aggregation untouched. This is the only item here that changes what a user sees, and it removes both a false statement about a date and an affordance that fabricates expenses. It needs the architect to settle one question first: whether a *recent* un-logged occurrence should still nudge.
2. **Deep-copy the defaults at all four fallbacks in `load()` (CODE-02).** One helper, four lines. Removes the only path by which a render-time edit reaches a module constant, in the one function that reads untrusted bytes.
3. **Clear the quarantine after a confirmed restore, and narrow the comment above it (CODE-03).** One call, one paragraph, at a site that already has the precedent eight lines away in the Reset handler.
4. **Remove the reserved scrollbar from the width-mode host and re-record the four rows (CODE-04), and delete the contradictory paragraphs in the same pass (CODE-06).** One `run.mjs` change and one comment block. These two are the same file region and the same commit's worth of work.
5. **Two flows in `recurrence.js` for the open horizon (CODE-05).** Converts `VERIFICATION.md:172-181`'s prose into assertions. No new runner, no new file, each demonstrated red by perturbing `:4909`/`:4911`.

CODE-07 and CODE-08 are XS comment-and-declaration changes that can ride with any of the above; neither justifies a pass of its own.
