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

22 references. The question for each is whether it must see *occurrences*
(a recurring plan expanded across a date range) or only *records* (the stored
plan objects). Anything in the first group that filters on `x.date` directly is
wrong, because `date` is the series anchor, not the occurrence.

### Group A — must be occurrence-aware

| # | Line | Site | Status |
|---|---|---|---|
| A1 | 3536 | `renderExpenses()` — which plans to list | OK — `hasPlannedOccurrence()` |
| A2 | 4442 | `renderDashboard()` — `totalPlanned`, Planned Left, `drawPvA`, advisor | **WRONG — filters on anchor date (CODE-01)** |
| A3 | 4716 | `[data-chip-none]` — which categories to exclude | **WRONG — filters on anchor date (not in any report)** |
| A4 | 4735 | `renderDailyStats()` | OK — `expandPlannedInRange()` |
| A5 | 4774 | `renderCalendar()` | OK — expands at 4785 |
| A6 | 4845 | `renderDailyChips()` | OK — expands at 4848 |
| A7 | 4879 | `drawDailyStackedChart()` | OK — expands at 4901 |
| A8 | 4986 | `renderDaySelected()` | OK — `expandPlannedInRange()` |

### Group B — record-based by design, no change required

| # | Line | Site | Why records are correct |
|---|---|---|---|
| B1 | 2207 | cloud "local data exists" count | counts stored records |
| B2 | 2761 | `computeReminders()` | iterates plans, calls `nextPlannedDue(p)` per plan |
| B3 | 2887 | convert-to-actual, find by id | id lookup |
| B4 | 2900 | convert-to-actual, remove one-off | write |
| B5 | 3509 | `expAdd` push | write |
| B6 | 3575 | delete confirm, is-this-a-series | id lookup |
| B7 | 3581 | delete by id | write |
| B8 | 3834 | Data Summary count / clear all | counts stored plans, which is what that row means |
| B9 | 3991 | category-in-use check | any plan referencing the category |
| B10 | 4308 | active recurring plan count | counts series, not occurrences |
| B11 | 4310 | recurring plan monthly total | sums series amounts |
| B12 | 5818 | edit modal, find by id | id lookup |
| B13 | 5998 | edit modal, remove from old collection | write |
| B14 | 6028 | edit modal, push to new collection | write |

### What the inventory found that the reviews did not

**A3 (`index.html:4716`) is a second occurrence-blind reader.** The Daily
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

### Unbounded range (CODE-02)

With **All Time** selected, `plannedOccurrences()` currently terminates only on
`guard++ < 5000`, so the Daily total becomes a function of the guard constant
rather than of the data. After WORK-01 the horizon is bounded.

Assertion: F3 (monthly, no end date) must produce **fewer than 100 occurrences**
over All Time, and the count must equal the number of months from 2025-10-05 to
the bounded horizon. Any result in the thousands means the clamp is not in
effect. The Daily total must be finite and must not change when the guard
constant is changed.

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
- [x] All Time: F3 yields 22 occurrences, not 5,000; Dashboard == Daily
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
