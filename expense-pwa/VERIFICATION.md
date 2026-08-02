# Stage 0 — Planned-data verification

This is the artifact the Chief Architect made a precondition of the redefined
release gate. It exists because the previous gate closed on checks that could
not have caught the defect that survived it: each screen was exercised on its
own, nothing compared one screen against another, so a consumer that had never
been migrated to the derived-occurrence model was invisible by construction.

**Written before any gate code changes. Expected values below are derived from
the model, not read off the screen.**

---

## 1. Consumer inventory — every read of `db.planned`

This is a **historical snapshot**, written before any gate code changes, and it
is kept for the record of how the round-3 gate was reasoned and closed. The
question for each site is whether it must see *occurrences* (a recurring plan
expanded across a date range) or only *records* (the stored plan objects).
Anything in the first group that filters on `x.date` directly is wrong, because
`date` is the series anchor, not the occurrence.

**No line numbers and no total.** Both were here and both went stale: every row
had drifted by roughly a thousand lines, so following any of them landed the
reader in unrelated code, and the reference count had moved too. A document
read long after the moment it describes must not restate a position or a count
that the file itself owns — the same rule already applied to §6. Sites are
identified by their enclosing function or by a searchable token; those survive
edits, and the row ids (A1, B2, …) that §5's checklist is written in terms of
are unchanged.

### Group A — must be occurrence-aware

| # | Site | Status |
|---|---|---|
| A1 | `renderExpenses()` — which plans to list | OK — `hasPlannedOccurrence()` |
| A2 | `renderDashboard()` — `totalPlanned`, Planned Left, `drawPvA`, advisor | **WRONG — filters on anchor date (CODE-01)** |
| A3 | `[data-chip-none]` — which categories to exclude | **WRONG — filters on anchor date (not in any report)** |
| A4 | `renderDailyStats()` | OK — `expandPlannedInRange()` |
| A5 | `renderCalendar()` | OK — expands before use |
| A6 | `renderDailyChips()` | OK — expands before use |
| A7 | `drawDailyStackedChart()` | OK — expands before use |
| A8 | `renderDaySelected()` | OK — `expandPlannedInRange()` |

### Group B — record-based by design, no change required

| # | Site | Why records are correct |
|---|---|---|
| B1 | cloud "local data exists" count | counts stored records |
| B2 | `computeReminders()` | iterates plans, calls `nextPlannedDue(p)` per plan |
| B3 | convert-to-actual, find by id | id lookup |
| B4 | convert-to-actual, remove one-off | write |
| B5 | `expAdd` push | write |
| B6 | delete confirm, is-this-a-series | id lookup |
| B7 | delete by id | write |
| B8 | Data Summary count / clear all | counts stored plans, which is what that row means |
| B9 | category-in-use check | any plan referencing the category |
| B10 | active recurring plan count | counts series, not occurrences |
| B11 | recurring plan monthly total | sums series amounts |
| B12 | edit modal, find by id | id lookup |
| B13 | edit modal, remove from old collection | write |
| B14 | edit modal, push to new collection | write |

### What the inventory found that the reviews did not

**A3 (the `[data-chip-none]` handler) is a second occurrence-blind reader.** The Daily
screen's **None** button builds the set of categories to exclude from
`source.filter(x => inRange(x.date, from, to))` — anchor dates only. A category
whose only occurrences in the visible range are *projected* is not in that set,
so pressing **None** leaves it switched on, and the chart, calendar, stats strip
and day detail keep counting it while every chip reads as off. Same root cause
as CODE-01, different screen, and no reviewer looked at it.

It is not in the approved gate. Recording it here rather than fixing it
silently; it should be ruled on alongside WORK-02, which it sits directly
beside.

---

## 2. Fixture

Fixed dates, so every expectation below is deterministic and independent of the
day the check is run. One category (`Home`), no exclusions, Planned mode.

| Id | Date (anchor) | Amount | Recurrence | End date |
|---|---|---|---|---|
| F1 | 2026-03-15 | 100,000 | none | — |
| F2 | 2026-01-31 | 200,000 | monthly | none |
| F3 | 2025-10-05 | 50,000 | monthly | none |
| F4 | 2026-02-02 | 10,000 | weekly | 2026-03-02 |
| F5 | 2026-06-01 | 1,000 | daily | 2026-06-10 |

F2 is anchored on the 31st and carries **ARCH-1**: a monthly recurrence must
occur on the anchor's day of month, clamped to the last day of shorter months.
Expected series: `01-31, 02-28, 03-31, 04-30, 05-31, 06-30, 07-31, …`
Current `setMonth()` behaviour instead yields `01-31, 03-03, 04-03, 05-03, …` —
February is skipped entirely and the day drifts to the 3rd permanently.

F3 is anchored before every other plan and has never been logged, so it is the
detector for "a period in the past reports what was planned for it".

---

## 3. Expected values

`Planned total` is the sum of occurrence amounts in the range.
`Plans listed` is how many rows the Expenses planned list shows — one row per
plan, not per occurrence, so it is a count of series with at least one
occurrence in range.

| Range | F1 | F2 | F3 | F4 | F5 | **Planned total** | **Plans listed** |
|---|---|---|---|---|---|---|---|
| **A** 2026-02-01 → 2026-02-28 | 0 | 200,000 | 50,000 | 40,000 | 0 | **290,000** | **3** |
| **B** 2026-03-01 → 2026-03-31 | 100,000 | 200,000 | 50,000 | 10,000 | 0 | **360,000** | **4** |
| **C** 2026-06-01 → 2026-06-30 | 0 | 200,000 | 50,000 | 0 | 10,000 | **260,000** | **3** |
| **D** 2025-10-01 → 2025-10-31 | 0 | 0 | 50,000 | 0 | 0 | **50,000** | **1** |

Working:
- Range A — F2 one occurrence (02-28, ARCH-1); F3 one (02-05); F4 four
  (02-02, 02-09, 02-16, 02-23).
- Range B — F4 one (03-02) then the schedule ends.
- Range C — F5 ten daily occurrences (06-01…06-10) = 10,000; F4 ended in March.
- Range D — predates every anchor except F3.

### What each range detects

| Range | Detects |
|---|---|
| A | **ARCH-1.** Pre-fix total is 90,000, not 290,000 — F2 contributes nothing because `setMonth()` jumps 01-31 straight to 03-03. |
| B | General agreement with a mixed set of recurrences. |
| C | Bounded daily series; F4 correctly stopped at its end date. |
| D | **CODE-01 / the anchor model.** A period entirely in the past. Under the old moving-cursor model this was 0. |

---

## 4. Cross-screen agreement — the check that was missing

For each range above, with no categories excluded:

1. **Dashboard `totalPlanned`** (`renderDashboard`) **==** the table value.
2. **Daily stats total** (`renderDailyStats`, Planned mode) **==** the same value.
3. **Expenses planned list row count** **==** `Plans listed`.

Dashboard and Daily must produce **the same number for the same fixture and the
same range**. Today they cannot: Daily expands, Dashboard filters on the anchor.
That single comparison catches CODE-01, and running it across ranges A and D
catches ARCH-1 at the same time.

### Day-detail drill-down (WORK-24 regression)

Selecting **2026-02-28** in Planned mode must show F2 at 200,000. Pre-ARCH-1
there is no occurrence on that date at all, so the day reads empty.

### Unbounded range (CODE-02, WORK-12, WORK-13)

With **All Time** selected, `plannedOccurrences()` originally terminated only on
`guard++ < 5000`, so the Daily total was a function of the guard constant rather
than of the data. WORK-01 bounded it; WORK-12 and WORK-13 made the bound
well-defined, and there are now **two** horizons, which this section has to test
separately because they answer different questions.

`aggregationEnd()` — used wherever occurrences become a number. An open range
stops at **today**, so Planned covers exactly the window Actual covers and the
two headline figures are comparable. `listingEnd()` — used wherever the question
is only *does this plan belong in this view*. An open range stops at **today +
one year**, so a plan created for next month still appears in the Expenses list
under All Time instead of silently vanishing.

Assertions, all re-runnable against the fixture rather than fixed counts that
move with the calendar:

1. `expandPlannedInRange(db.planned, OPEN_START, OPEN_END)` — no occurrence may
   fall after `todayISO()`. This is the aggregation horizon, and it is the whole
   claim: `max(occurrence.date) <= todayISO()`.
2. F3 (monthly, 2025-10-05, no end date) yields one occurrence per elapsed month
   — currently in the tens, never the thousands. Any result at or near 5,000
   means the horizon is not in effect and the guard is doing the terminating.
3. A plan anchored **after** today (e.g. 2027-03-15) must satisfy
   `hasPlannedOccurrence(p, OPEN_START, OPEN_END) === true` while contributing
   **zero** occurrences to `expandPlannedInRange`. Listing and aggregation
   disagreeing here is the intended behaviour, not a defect.
4. Inserting a far-future actual (2099-01-01) must change none of the above.
   The horizon no longer reads `db.actual`, so one mistyped year can no longer
   expand every open-ended plan by seventy years — which is what CODE-04
   described.
5. The four explicit ranges A–D are unaffected by all of this and must still be
   290,000 / 360,000 / 260,000 / 50,000 with Dashboard == Daily.

The guard remains as a backstop and now `console.warn`s when it fires. A silent
guard hit reads identically to a correct result; a loud one cannot.

### Negative interval (WORK-14)

The other way to burn the guard is a `recIntervalDays` of `-5`, which steps the
series backwards so it never reaches the end of the range. `recInterval()` is
the one definition of a valid interval and every path goes through it:

- `recInterval(-5) === 14`, and likewise for `0`, `''`, `'abc'`. `recInterval(3.7) === 3`, `recInterval(999999) === 3650`.
- `stepDate('2026-01-01', 'custom', -5, 1) === '2026-01-15'` — the stepper cannot
  move backwards regardless of what is in storage, which matters because
  `migrate()` does not re-validate existing records.
- A plan already holding `-5` produces a short bounded list, not 5,000 steps.
- Import **rejects** rather than clamps, and the test is `recInterval(n) !== n`,
  so the reject path cannot drift from the accept path.
- The badge, the goal meta line and both modal inputs display
  `recInterval(...)`, so what is shown is what the series will actually do.

---

## 5. Gate close checklist

The gate closes when every box is ticked, and not before.

Run against commit `fe42ccf`, all eleven gate items implemented.

- [x] A1 `renderExpenses` — agrees with the table
- [x] A2 `renderDashboard` — agrees with the table *(was the Critical)*
- [x] A3 `[data-chip-none]` — **fixed on approval.** See below.
- [x] A4 `renderDailyStats` — agrees with the table
- [x] A5 `renderCalendar` — 2026-02-28 cell shows ₮200K
- [x] A6 `renderDailyChips` — category totals render
- [x] A7 `drawDailyStackedChart` — bar present for 2026-02-28
- [x] A8 `renderDaySelected` — 2026-02-28 lists F2 at 200,000
- [x] Ranges A–D: Dashboard total == Daily total, all four
- [x] Range A total is 290,000, not 90,000 (ARCH-1)
- [x] Range D total is 50,000, not 0 (anchor model)
- [x] All Time: no occurrence past today, F3 in the tens not 5,000; Dashboard == Daily
- [x] All Time: future-anchored plan lists but contributes zero to totals
- [x] All Time: a 2099 actual moves neither horizon
- [x] Group B sites re-read and confirmed still record-based

### A3 — demonstrated, then fixed on approval

The checklist requires A3 to be *ruled on*, not merely noticed. It was recorded
with evidence rather than left as an assertion, handed over, and fixed once
approved. The defect as it stood:

First attempt to check it produced a **false pass**. The Stage 2 fixture uses a
single category for every plan, and F5's anchor falls inside the test range, so
the exclusion set happened to contain that category anyway. The check has to
use a category whose occurrences in range are *only* projections.

Reproduced with two categories over 2026-06-01 → 2026-06-30:

| Category | Amount in June | Anchor |
|---|---|---|
| Groceries | ₮5,000 | 2026-06-03 — inside the range |
| Rent | ₮200,000 | 2026-01-31 — outside, monthly, projected into June |

Pressing **None**:

- `dailyExcluded` receives only the Groceries category.
- The Rent chip still reads **on**.
- The total falls from ₮205,000 to **₮200,000**.

The user asked to exclude everything and was still looking at ₮200,000 of
spending, with a chip row that did not say so.

**Fixed.** The None handler now builds its exclusion set from
`expandPlannedInRange()` — the same source `renderDailyChips()` uses to draw
the chips, so the button and the chips can no longer disagree. Re-run on the
same case: both categories excluded, every chip off, total ₮205,000 → ₮0.
**All** still restores ₮205,000, and actual mode is unchanged.

---

## 6. The mechanical predicates

Four development-time checks. None is required to run or serve the app —
`index.html` still opens directly from disk with no build and no install.
All four run behind one command:

```
npm run verify
```

| Check | Ruling | What it answers |
|---|---|---|
| `tools/lint.mjs` | V3 | Does the inline script contain an identifier that cannot resolve? |
| `tools/check-escaping.mjs` | V2 | Does record data reach an HTML **attribute value** unescaped? |
| `tools/check-contrast.mjs` | V4 | Does every declared foreground/background pair clear its WCAG ratio, in **every** theme? |
| `tools/check-saves.mjs` | V5 | Does any write discard its result without a recorded reason? |

Each one exists because a human asserted a class was closed, in good faith,
and was wrong. Six delete paths that were seven. Nine escaped interpolations
that were not all of them. Sixteen themes measured in a comment and never
measured. The codebase was sound each time; the counting was not, and counting
more carefully is not a fix. Each check replaces one act of counting with one
command.

### The contrast pair table (V4)

`check-contrast.mjs` holds an explicit table of `(foreground, background,
minimum)` triples, maintained by hand. A human decides which pairs matter; the
machine does the arithmetic and the counting. It deliberately does not parse
CSS rules, resolve the cascade, or follow `color-mix()` — a pair that is not in
the table is a pair this check says nothing about.

The table is a **deliverable of the work that establishes each pair**, not a
prerequisite. Read the tool for what it currently covers; this document
deliberately records no count, because a count written here is a statement
about a moment, read long after the moment. It said "the table is empty" for a
full round after the table was populated.

Two rules govern the table rather than its contents:

- **A CSS rule that paints a fill under text adds a pair-table row in the same
  commit.** The mechanism is sound; the coverage is hand-maintained, and four
  painted surfaces carrying text were found outside it one round after the
  table was built.
- **A declared `--on-*` token with no `var()` reference anywhere fails the
  check.** An unreferenced foreground token is the fingerprint of a fill that
  paints its text with the wrong one — which is how the advisor badge shipped
  white-on-green at 2.32:1 while `--on-warning` sat declared sixteen times and
  used nowhere.

### The save-outcome allow-list (V5)

A `save()` whose return value nothing consumes is forbidden unless its site is
on the allow-list in `tools/check-saves.mjs`, with a reason. The check is an
allow-list rather than a census precisely so that it never requires counting:
an eighth delete path cannot appear silently.

"Discarded" is decided by what precedes the call, not by punctuation after it.
An earlier version required a trailing semicolon, which meant `if (ok) save()`
and `forEach(() => save())` were invisible to a tool whose own header claimed
that a new unreported write fails on the first run.

It does **not** require every `save()` to be followed by `savedToast()`. That
would be a rule about outcome messaging disguised as a rule about writes, and
it would put a toast on a reorder drag.

Current allow-list, mirrored from the tool:

| Site | Why it reports nothing |
|---|---|
| `saveSoon` | Coalesced preference write. No toast is shown, so there is no false success to report; failure still raises the banner through `writeDb()`. |
| `flushPendingSave` | The same coalesced write, flushed on `pagehide`. |
| `initIncomeTypeReorder` | Reorder drag. **Failure is reported** — `writeDb()` raises the save-error banner on every failure path. The omitted *toast* is a noise judgement about a drag gesture, not a claim that a failed write is silent. |
| `initCategoryReorder` | Reorder drag. Same reasoning. Note that category order sets the Analytics palette by array index, so a failed write does revert a visible change — the banner is what reports it. |
| `maybeFireOSNotifications` | Records `lastNotifiedAt` so a reminder does not fire twice in a day. Bookkeeping, not a record the user entered. Losing it costs one duplicate reminder. |

The two reorder reasons were reworded after a review read the original — "the
new order is already on screen; a toast per drop would be noise" — as a claim
that a failed reorder is silent, and recommended adding toasts. It is not
silent: every failure path in `writeDb()` raises the persistent save-error
banner. The original reason was true but weaker than the truth, and it invited
the wrong fix.
