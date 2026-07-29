# Technical Analytics & Implementation Roadmap
## Income & Expense Tracker (PWA) — `expense-pwa/`

Prepared by: Technical Analytics Agent (Senior TPM / Engineering Manager)
Date: 2026-07-28

**Inputs analysed:**
- `reports/ui-review.md` — UI/UX Review Report (24 findings, overall 74/100)
- `reports/code-review.md` — Principal Code Review Report (31 findings, overall 57/100)

No new issues were introduced in this document. Every item below traces to a finding
in one of the two source reports. Source IDs are carried through so each task remains
auditable.

---

# Executive Summary

Two reports, 55 raw findings, 8 duplicates merged → **47 distinct issues**.

The picture is unusual and worth stating plainly: **the visible product is in better
shape than the invisible one.** The UI scores 74 with a genuine design system behind
it. The code scores 57, and three of its findings are unguarded paths that end in
silent, unrecoverable loss of the user's financial history.

That asymmetry sets the entire plan. There is no case for UX work, architecture work
or cloud work until the data is safe — because every one of those tasks edits the same
file that currently has no version control and no tests. **The first 30 minutes of
this roadmap are `git init`.** The first 11 hours make the data durable. Everything
else is schedulable.

The good news is that the ship-blocking band is small and well-understood, and the
highest-ROI work in the whole plan is also the cheapest: **≈5.5 hours of accessibility
and validation fixes move the UX score from 74 to roughly 82**, using CSS and helpers
that already ship in the codebase and are simply unwired.

## Project Health

**FAIR**

| Signal | Reading |
|---|---|
| Feature completeness | Strong — dashboard, salary calc, goals, recurrence, 16 themes, offline, cloud sync |
| Craft quality | Strong — deliberate defensive decisions, comments record *why* |
| Visual design | Good — real token system, 74/100 |
| **Data durability** | **Poor — 3 critical silent-loss paths** |
| **Engineering process** | **Poor — no version control, no tests over financial arithmetic** |
| Architecture | Poor — 5,161-line single file, ~140 globals |
| Security | Fair — escaping mostly right, 12 systematic gaps |

Not *Poor*, because the product works and the craftsmanship is real. Not *Good*,
because a personal-finance app that can silently discard a user's data has failed at
the one thing it exists to do.

---

## Overall Priority Matrix

### CRITICAL (4) — ship-blocking

| ID | Issue | Source | Why Critical |
|---|---|---|---|
| C1 | Corrupt localStorage silently wipes data, then `save()` overwrites the recoverable blob | CODE CRIT-1 | Total, unrecoverable loss of the app's only asset. The second write is what makes it permanent. |
| C2 | `save()` unguarded — quota exhaustion kills the write *and* the rest of the handler | CODE CRIT-2 | App becomes read-only with zero feedback. User keeps entering data that is never stored. |
| C3 | Cloud payload bypasses `load()`, skipping migration and defaults | CODE CRIT-3 | `TypeError` in `analyzeExpenses` → dashboard blanks permanently after a cloud reload. |
| C4 | No version control | CODE HIGH-6 | Every fix below is irreversible and unverifiable without it. Blocks the plan itself. |

C4 is listed as Critical not on its own severity but on its **dependency weight** — it
gates all 43 remaining tasks.

### HIGH (9)

| ID | Issue | Source | Why High |
|---|---|---|---|
| H1 | Recurring plans mutate forward, destroying past occurrences | CODE HIGH-1 | Planned-vs-Actual — the app's core comparison — is already silently wrong for past months. |
| H2 | XSS via unescaped interpolation of imported fields (12 sites) | CODE HIGH-2 | README instructs users to re-import backups from email and cloud. With sync on, executed script reaches the Firestore session. |
| H3 | `validateImport()` validates containers, not elements | CODE HIGH-3 | A malformed file passes the gate and bricks Settings + Dashboard. Compounds H2. |
| H4 | Form labels unassociated (~60) | UI CI-1 | Inputs announce as unlabelled; label text isn't tappable. Mechanical fix, wide impact. |
| H5 | Six component classes below the 44px touch minimum | UI CI-2 | Includes `.close-x` on every modal and the Actual/Planned switch. Primary mis-tap source. |
| H6 | Validation errors are transient toasts only | UI CI-3 | Tells the user *what* failed, never *where*. `.invalid` CSS ships but is unwired. |
| H7 | `settings.notifications` defaults defeated by spread order | CODE HIGH-5 | One-line bug; silently resets preferences on old-backup restore. |
| H8 | Cloud sync: 1MiB doc cap, invisible failures, last-write-wins | CODE HIGH-4 | Users who believe they are backed up are not. Deferred — see dependencies. |
| H9 | Income buried under "More" while Daily Chart holds a primary tab | UI HP-1 | IA inverts actual usage frequency; a daily action costs two taps. |

### MEDIUM (17)

M1 recurrence stepper duplicated ×4 (CODE MED-1) · M2 month-end drift, 31st → wrong
month (CODE MED-2) · M3 `wireIconGrid` listener leak (CODE MED-3) · M4 read paths
mutate + trigger cloud writes (CODE MED-4) · M5 O(days × entries) rendering (CODE
MED-5) · M6 day-detail ignores projected occurrences (CODE MED-6) · M7 no CSP, no SRI
(CODE MED-7) · M8 modals lack focus trap / Escape / focus return (CODE MED-8 + UI
HP-4, **merged**) · M9 placeholder contrast 2.9:1 fails AA (UI HP-2) · M10 add-entry
flow buried below filters (UI HP-3) · M11 two empty-state languages (UI MP-1) · M12
mixed emoji/SVG icon language (UI MP-2) · M13 `break-all` splits currency figures (UI
MP-3) · M14 four filter rows consume ~110px above the fold (UI MP-4) · M15 calendar
cells too dense below 400px (UI MP-5) · M16 sarcastic overdue goal quotes (UI MP-6) ·
M17 monolith blocks all testing (CODE Architecture debt)

M17 is rated Medium **as a task**, despite being the root cause of much of this list —
it is high-effort, zero-user-visible-benefit, and correctly sequenced after
correctness. It is not rated Low because deferring it indefinitely is what produced
the current state.

### LOW (17)

LOW-1..7 from the code review (SW offline fallback, ₮0 quick-amount buttons,
unpersisted chip state, `uid()` entropy, magic numbers, repeated DOM lookups, unvalidated
`parseISO`) and LP-1..6 plus MP-equivalents from the UI review (desktop bottom-sheet
modals, theme swatch previews, 10px labels, no back affordance, toast `aria-live`,
chip-state resets). Full detail in the source reports.

### INFORMATIONAL (4)

- The design token system is a genuine asset. Enforce it rather than replace it.
- 16 themes is a maintenance surface, not a feature — consider deriving variants.
- Firestore rules in the setup guide are correctly scoped to `request.auth.uid`.
- The service worker's `allSettled` and `res.type === 'basic'` guards are correct and
  should survive any refactor.

---

## Quick Wins

Low effort, high value, minimal risk. **All of these use code that already exists in
the repository and is merely unwired or mis-set.**

| # | Change | Source | Effort | Expected benefit |
|---|---|---|---|---|
| QW-1 | Fix `settings.notifications` spread order | H7 | 1h | Eliminates a silent preference-loss bug. One line. |
| QW-2 | Add `for`/`id` to all labels | H4 | 1.5h | Screen-reader labelling + much larger tap targets, app-wide |
| QW-3 | Raise six components to 44px | H5 | 1h | Removes the primary mis-tap source, including every modal close button |
| QW-4 | Darken `--placeholder` across themes | M9 | 0.5h | AA compliance on text that carries the only affordance for tap-to-open date fields |
| QW-5 | Wire the existing `.invalid` class + scroll-into-view | H6 | 1.5h | Most of a Critical UX issue, using CSS that already ships unused |
| QW-6 | `aria-live="polite"` on the toast | UI LP-5 | 5m | Screen readers hear every confirmation. Five minutes. |
| QW-7 | Route remaining blank states through `emptyState()` | M11 | 45m | Visual consistency; the needed icons already exist in `EMPTY_ICONS` |
| QW-8 | `break-all` → `overflow-wrap: anywhere` | M13 | 15m | Stops currency figures splitting mid-number |
| QW-9 | Soften the four `overdue` goal quotes | M16 | 10m | Removes tone risk at the user's worst moment |
| QW-10 | Fix `wireIconGrid` listener leak | M3 | 30m | Prevents unbounded listener accumulation |

**Total: ≈7 hours for ten fixes**, closing two Critical UX issues and one High code
issue. This is the single best value in the plan and should not wait for a sprint
boundary.

---

## Technical Debt Summary

| Category | Items | Weight | Assessment |
|---|---|---|---|
| **Architecture** | Single 5,161-line file; ~140 globals; no modules, no build, no dependency management | **Heavy** | Root cause of the testing, performance and security-audit gaps. Not itself urgent — but nothing else gets structurally better until it is addressed. |
| **Code** | 4× recurrence stepper (M1); ~60 duplicated lines across the two reorder functions; 330-line `analyzeExpenses` with 25 inline rules; repeated filter/sort pipelines | **Moderate–Heavy** | M1 is the one that actively generates bugs: M2's fix must land in four places or the app becomes internally inconsistent. |
| **Performance** | Per-day full scans in calendar and daily chart; `find()` in per-row loops; `analyzeExpenses` on every render | **Moderate** | Invisible today, linear in the data the app is explicitly designed to accumulate. Schedule, don't rush. |
| **Security** | 12 unescaped interpolation sites (H2); no CSP; Firebase SDK without SRI (M7) | **Moderate** | The gaps are systematic, not random — which means one focused pass closes the class, not just the instances. |
| **Maintainability** | No tests over salary/recurrence/advisor arithmetic; no version control; 16 hand-maintained themes; hardcoded tax rates | **Heavy** | The absence of tests is what makes the architecture debt expensive to repay rather than merely large. |
| **Scalability** | Firestore 1MiB single-doc cap; localStorage 5–10MB; full-scan renders | **Moderate** | The Firestore cap is a hard wall, not a slowdown — but it is years away and behind a schema change. |

---

## Sprint Roadmap

Sprints are sized at ~16 hours (≈2 focused days). Ordering is driven by dependency and
risk, not by category.

### Sprint 0 — Make the work reversible · 0.5h
> Not a real sprint. Do this before touching anything.

| Task | Source | Effort |
|---|---|---|
| `git init`, `.gitignore`, commit the current state as the baseline | C4 | 30m |

**Exit criterion:** every subsequent change is bisectable and revertible.

---

### Sprint 1 — Data durability · ≈11h
> The ship-blocking band. Nothing here is user-visible. All of it is why the app can
> be trusted with someone's finances.

| # | Task | Source | Effort |
|---|---|---|---|
| 1.1 | Quarantine corrupt localStorage instead of discarding it; block auto-save until the user chooses | C1 | 1.5h |
| 1.2 | try/catch `save()`; persistent banner + export prompt on `QuotaExceededError` | C2 | 1.5h |
| 1.3 | Element-level import validation (required fields, numeric coercion, specific rejection message) | H3 | 3h |
| 1.4 | Route cloud payloads through `validateImport()` → localStorage → `load()` | C3 | 3h |
| 1.5 | Fix the `settings.notifications` spread order | H7 (QW-1) | 1h |
| 1.6 | Extract the storage boundary — `load` / `save` / `validate` / `migrate` in one place | refactor #2 | 1h |

**Sequencing note:** 1.3 precedes 1.4 deliberately — the cloud path should reuse the
strengthened validator, not a weaker copy of it.

**Exit criterion:** no code path can silently lose or half-apply user data.

---

### Sprint 2 — Quick wins + security pass · ≈16h
> Highest ROI in the plan. Ships visible improvement the same week the invisible work
> lands.

| # | Task | Source | Effort |
|---|---|---|---|
| 2.1 | **All ten Quick Wins** (minus QW-1, done in 1.5) | QW-2..10 | 6h |
| 2.2 | Escape all 12 unescaped interpolation sites; add a tagged-template helper so new ones are escaped by default | H2 | 4h |
| 2.3 | Add CSP meta tag; SRI hashes or local pinning for the Firebase SDK | M7 | 1.5h |
| 2.4 | Shared modal controller — focus trap, Escape, focus restore, `role="dialog"` (all nine modals) | M8 | 3h |
| 2.5 | Re-audit: confirm no interpolation site remains unescaped after 2.2 | H2 | 1.5h |

**Exit criterion:** import is no longer an execution vector; accessibility score ≈87.

---

### Sprint 3 — Recurrence correctness · ≈16.5h
> The app's core comparison is currently wrong for past periods. This sprint fixes the
> model, not the symptom.

| # | Task | Source | Effort |
|---|---|---|---|
| 3.1 | Extract `stepDate(date, frequency, intervalDays)`; collapse all four steppers into it | M1 | 3h |
| 3.2 | Clamp month-end overflow inside `stepDate()` (31st no longer drifts) | M2 | 1.5h |
| 3.3 | Unit-test harness + tests for `stepDate`, `computeNextRecurring`, `expandPlannedInRange`, `computeRange`, `calcSalary`, `unmoney`/`unnum` | CODE HIGH-6 | 6h |
| 3.4 | Split schedules from occurrences — stop mutating `date` forward; derive occurrences for any window | H1 | 8h → 6h¹ |

¹ Reduced from the code review's 8h estimate because 3.1 and 3.3 land first, which is
most of the extraction and all of the safety net.

**Delivered for free:** M6 (day-detail ignoring projected occurrences) and M4 (read
paths mutating state) both dissolve when mutation-on-read is removed.

**Exit criterion:** Planned vs Actual is correct for arbitrary historical ranges;
recurrence logic exists once and is tested.

---

### Sprint 4 — Architecture & performance · ≈16.5h
> No user-visible change. This is the sprint that makes every future sprint cheaper.

| # | Task | Source | Effort |
|---|---|---|---|
| 4.1 | Split the monolith into ES modules — `storage`, `dates`, `recurrence`, `salary`, `advisor`, `charts`, `screens/*`, `ui/modal` | M17 | 12h |
| 4.2 | Index-based rendering: `Map` for categories, single-pass date bucketing | M5 | 4h |
| 4.3 | Memoise `analyzeExpenses` on `(from, to, db-version)` | M5 | 0.5h |

**Sequencing note:** 4.1 lands *after* Sprint 3's tests exist. Refactoring 3,700 lines
of untested financial logic is the one move in this plan that could quietly break the
product; the tests from 3.3 are what make it safe.

**Exit criterion:** modules are individually testable; Daily screen stays responsive
at 10× current data volume.

---

### Sprint 5 — Cloud, IA & polish · ≈16h

| # | Task | Source | Effort |
|---|---|---|---|
| 5.1 | Cloud sync rework: chunked/subcollection storage, visible failure state + retry, `updatedAt` conflict check | H8 | 8h |
| 5.2 | Promote Income to the tab bar; move Daily Chart into More | H9 | 2h |
| 5.3 | Collapse the four filter rows into a single period pill | M14 | 2h |
| 5.4 | Persistent quick-add affordance | M10 | 2h |
| 5.5 | Calendar density below 400px; unify icon language (M12); remaining LOW items | M15, M12, LOW-* | 2h |

**Sequencing note:** 5.1 is deliberately last despite being rated High. It is the
single largest dependency risk in the plan — the storage schema it must serialise is
rewritten in Sprint 3. Building it earlier means building it twice.

---

## Task Dependencies

```
  git init  (Sprint 0)
      ↓
  ┌───────────────────────────────────────────────┐
  │  everything below                             │
  └───────────────────────────────────────────────┘
      ↓
  Storage boundary + validation  (1.1 – 1.6)
      ↓
      ├──→ Cloud payload routing (1.4)          [needs the validator from 1.3]
      │
      ├──→ Quick wins + escaping pass (Sprint 2) [independent — can run in parallel]
      │
      └──→ Extract stepDate() (3.1)
                ↓
           Month-end clamp (3.2)                 [must land in ONE place, not four]
                ↓
           Unit tests (3.3)
                ↓
           Schedule / occurrence split (3.4)
                ↓
                ├──→ Day-detail fix (M6)         [resolved automatically]
                ├──→ Read-path purity (M4)       [resolved automatically]
                │
                └──→ Module split (4.1)          [needs tests to be safe]
                          ↓
                     Index-based rendering (4.2)
                          ↓
                     Cloud sync rework (5.1)     [needs the final schema]
                          ↓
                     IA + polish (5.2 – 5.5)
```

**Three orderings that must not be violated:**

1. **`git init` before any edit.** A 5,000-line file with no history and no tests is
   being modified across 47 tasks. Without this, one bad refactor is unrecoverable.
2. **`stepDate()` extraction (3.1) before the month-end fix (3.2).** The bug lives in
   four copies. Fixing it in place means fixing it four times, and a missed copy
   leaves the app internally inconsistent — the notification bell would predict a
   different date than the calendar draws.
3. **Tests (3.3) before the module split (4.1).** Restructuring untested financial
   arithmetic is the highest-risk action in this plan. Reversing this order is the
   most likely way to ship a regression.

**One ordering that is deliberately non-obvious:** cloud sync (H8) is rated High but
scheduled last. It serialises a schema that Sprint 3 rewrites. Building it in Sprint 2
means building it twice and throwing one away.

---

## Risk Assessment

| Issue | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| C1 — corrupt storage wipe | User loses years of financial history with no warning; the next tap makes it permanent | **Medium** (needs a corrupting event) | **Catastrophic** — total loss of the app's only asset, no recovery | Sprint 1.1: quarantine the raw blob, block auto-save, offer raw export |
| C2 — quota exhaustion | App silently stops persisting; user keeps entering data that is never stored | **High** over a multi-year lifetime | **Severe** — undetected loss of all entries after the quota point | Sprint 1.2: try/catch + persistent banner + usage display |
| C3 — cloud bypasses `load()` | Dashboard throws and blanks permanently after a cloud reload | **Medium** (needs a version-skewed cloud doc) | **High** — app appears broken; user may Reset All and lose local data | Sprint 1.4: route through the validator and `load()` |
| C4 — no version control | Any of the 47 changes below is unrevertable; no bisect on regression | **Certain** if unaddressed | **High** — turns a one-hour bug into a rewrite | Sprint 0, 30 minutes |
| H1 — recurrence history loss | Planned vs Actual silently wrong for every past month | **Certain — already occurring** | **High** — the headline feature quietly misleads; erodes trust in every number | Sprint 3.4 model change; tests first |
| H2 — import XSS | Script execution with access to `db` and the Firestore session | **Low–Medium** (needs a hostile file, but README encourages re-import from email/cloud) | **High** with sync enabled | Sprint 2.2 escaping pass + 2.3 CSP as defence in depth |
| H8 — cloud sync failure | User believes they are backed up and is not | **Medium** (grows with data toward the 1MiB wall) | **Severe** — false confidence is worse than no backup | Sprint 5.1; **interim mitigation: surface sync failures in the UI during Sprint 1** (~1h) |
| M17 — monolith | Every change is high-blast-radius; onboarding near-impossible | **Certain** | **Medium**, compounding | Sprint 4.1, gated behind tests |
| M5 — render performance | Daily screen stalls as data grows | **Medium**, rising with usage | **Medium** — degrades, doesn't break | Sprint 4.2 |
| **Plan risk** — refactor regression | Sprint 4's module split breaks financial arithmetic | **Medium if tests are skipped**, Low with them | **High** | Hard-gate 4.1 on 3.3; keep sprints independently shippable |

**One interim mitigation is worth pulling forward out of sequence:** H8's *visibility*
fix (showing sync failures instead of console-logging them, ~1h) belongs in Sprint 1,
even though the full rework waits for Sprint 5. False confidence in a backup is the
most dangerous state a user can be in, and making failure visible is an hour of work
that does not depend on the schema change.

---

## ROI Analysis

### Highest ROI

| Item | Effort | Return | Why |
|---|---|---|---|
| **Sprint 0 — git init** | 0.5h | Unblocks and de-risks 47 tasks | Highest ratio in the plan by an order of magnitude |
| **The ten Quick Wins** | 7h | UX 74 → ~82; accessibility 62 → ~85 | Uses CSS and helpers that already ship and are merely unwired. Nothing is *built* — it is *connected* |
| **Sprint 1 — data durability** | 11h | Converts the product from untrustworthy to trustworthy | The entire premise of a finance app. Nothing else matters if this is unfixed |
| **QW-1 spread-order fix** | 1h | Eliminates a silent data-shape bug | One line |
| **H2 escaping pass** | 4h | Closes an entire vulnerability class | Systematic gaps → one pass fixes the class, not the instances |

### High ROI

| Item | Effort | Return |
|---|---|---|
| Sprint 3.1–3.2 — `stepDate()` + month-end clamp | 4.5h | Removes a 4× duplication that actively generates inconsistency, and fixes a High-probability date bug |
| Sprint 3.4 — schedule/occurrence split | 6h | Restores correctness to the app's core comparison; dissolves M6 and M4 for free |
| M8 — shared modal controller | 3h | One function fixes nine modals for keyboard and screen-reader users |
| H9 — promote Income to the tab bar | 2h | Removes two taps from a daily action |

### Medium ROI

| Item | Effort | Return |
|---|---|---|
| Sprint 3.3 — unit tests | 6h | No immediate user benefit; makes Sprint 4 safe and every future change cheaper. Enabling investment |
| Sprint 4.1 — module split | 12h | Zero user-visible change; the largest single unlock for future velocity |
| Sprint 4.2 — index-based rendering | 4h | Prevents a future problem; imperceptible today |

### Low ROI

| Item | Effort | Return | Note |
|---|---|---|---|
| H8 — full cloud sync rework | 8h | Real, but for a **single-device app by design** (README: "no multi-user or sync") | Rated High on severity, Low on ROI — the 1MiB wall is years away and the interim visibility fix captures most of the value for 1/8th the cost |
| M12 — unify icon language | 2h | Aesthetic consistency only | Genuinely cosmetic |
| 16-theme consolidation | ~6h | Reduces future maintenance | Deferred — no current user impact |

---

## Recommended Development Order

Numbered execution sequence. **WHY** is given for each, because ordering here is
load-bearing.

| # | Task | Sprint | Effort | Why here |
|---|---|---|---|---|
| 1 | `git init` + baseline commit | 0 | 0.5h | Everything after this is reversible. Nothing before it is. |
| 2 | Quarantine corrupt storage (C1) | 1 | 1.5h | The most catastrophic failure mode, and the one where a second write makes loss permanent |
| 3 | Guard `save()` (C2) | 1 | 1.5h | Highest-probability data loss. Also reduces the blast radius of M4 |
| 4 | Element-level import validation (H3) | 1 | 3h | Must precede #5 so the cloud path reuses the strong validator |
| 5 | Route cloud through `load()` (C3) | 1 | 3h | Depends on #4 |
| 6 | Spread-order fix (H7) | 1 | 1h | One line, silent bug, trivially safe |
| 7 | Extract storage boundary | 1 | 1h | Consolidates #2–#6 behind one seam before the module split touches it |
| 8 | Surface cloud sync failures (interim H8) | 1 | 1h | Pulled forward: false backup confidence is dangerous and this doesn't depend on the schema |
| 9 | Ten Quick Wins (QW-2..10) | 2 | 6h | Best ROI in the plan; ships visible value the same week as invisible work |
| 10 | Escaping pass + template helper (H2) | 2 | 4h | Closes the vulnerability class before the module split multiplies the call sites |
| 11 | CSP + SRI (M7) | 2 | 1.5h | Defence in depth behind #10 |
| 12 | Shared modal controller (M8) | 2 | 3h | Nine modals, one function |
| 13 | Escaping re-audit | 2 | 1.5h | Verifies #10 actually closed the class |
| 14 | Extract `stepDate()` (M1) | 3 | 3h | **Must precede #15** — the bug lives in four copies |
| 15 | Month-end clamp (M2) | 3 | 1.5h | Now a one-place fix |
| 16 | Unit tests for pure functions | 3 | 6h | **Must precede #19** — the safety net for the riskiest refactor |
| 17 | Schedule/occurrence split (H1) | 3 | 6h | Restores core correctness; needs #14 and #16 |
| 18 | Verify M6 + M4 resolved | 3 | 0h | Both dissolve with #17 — confirm, don't re-implement |
| 19 | Module split (M17) | 4 | 12h | Gated on #16. The single highest-risk action in the plan |
| 20 | Index-based rendering (M5) | 4 | 4h | Far cheaper once modules exist |
| 21 | Memoise `analyzeExpenses` | 4 | 0.5h | Trivial once #20 lands |
| 22 | Cloud sync rework (H8) | 5 | 8h | **Last on purpose** — serialises the schema rewritten in #17 |
| 23 | Promote Income to tab bar (H9) | 5 | 2h | IA change; safe once the architecture is stable |
| 24 | Filter pill + quick-add (M14, M10) | 5 | 4h | UX refinement |
| 25 | Calendar density, icon language, LOW items | 5 | 2h | Polish |

---

## Estimated Development Time

| Sprint | Focus | Hours |
|---|---|---|
| 0 | Version control | 0.5 |
| 1 | Data durability *(ship-blocking)* | 12.0 |
| 2 | Quick wins + security | 16.0 |
| 3 | Recurrence correctness + tests | 16.5 |
| 4 | Architecture + performance | 16.5 |
| 5 | Cloud, IA, polish | 16.0 |
| | **Total Estimated Hours** | **≈77.5** |

**Reconciliation with source reports:** the code review estimated ≈76h and the UI
review ≈16h, totalling ≈92h. This plan lands at ≈77.5h because eight findings were
duplicated across the two reports (notably modal focus management, counted once here)
and because three items — M4, M6, and part of H1's extraction cost — are absorbed as
by-products of tasks that must happen anyway. **≈14.5 hours are saved purely by
ordering.**

### Milestone view

| Milestone | Cumulative | Meaning |
|---|---|---|
| **Trustworthy** | 12.5h | No path silently loses data. Minimum bar for a finance app. |
| **Releasable** | 28.5h | + accessibility, security, visible UX gains. Defensible public release. |
| **Correct** | 45h | + Planned vs Actual accurate for all periods, recurrence tested. |
| **Maintainable** | 61.5h | + modular, tested, performant at scale. |
| **Complete** | 77.5h | + reliable cloud sync and IA refinement. |

---

## Final Recommendation

**Strategy: stabilise, then ship visibly, then correct the model, then restructure.**

Four judgements drive this plan.

**1. Spend the first 12.5 hours on things the user will never see.** This is a
personal-finance app with three unguarded paths to silent data loss and no version
control. Every hour spent on themes, charts or IA before that is an hour spent making
an untrustworthy product prettier. The band is small — a day and a half — and it is
non-negotiable.

**2. Then take the cheapest win available and ship it.** The ten Quick Wins are ~7
hours and move the UX score from 74 to roughly 82. Almost none of it is new code: the
`.invalid` class ships unused, `EMPTY_ICONS` has unused entries, the 44px rule is
already written into the design system and merely violated by six components. This is
connecting things that were already built. It also matters for morale and stakeholder
confidence that the sprint after the invisible one is conspicuously visible.

**3. Fix the recurrence model before restructuring anything.** Planned vs Actual — the
comparison the entire dashboard is built around — is already wrong for past months,
and the cause is a data-model decision, not a bug. Restructuring around a broken model
means migrating twice. Extract `stepDate()` first, write the tests, then change the
model.

**4. Refactor last, and only behind tests.** The 5,161-line monolith is the root cause
of most of this report, and it is genuinely worth 12 hours to fix. But splitting 3,700
lines of untested salary and recurrence arithmetic into modules is the one action here
that could quietly break the product without anyone noticing for months. Sprint 3's
tests are the precondition. This ordering — correctness before structure — is the
single most important sequencing call in the plan.

**What I would push back on if asked to compress the plan:** cut Sprint 5, not Sprint
3. Cloud sync is rated High on severity but Low on ROI for what the README describes
as a deliberately single-device app, and the one-hour interim visibility fix in Sprint
1 captures most of its real value. **Sprints 0–4 (≈61.5h) deliver a trustworthy,
accessible, correct and maintainable product.** Sprint 5 is refinement, and it is the
right thing to defer if time is short.

**What must not be cut under any circumstances:** Sprint 0 (0.5h) and Sprint 1 (12h).
Every other item in this document is an improvement. Those two are the difference
between an app that can be trusted with someone's financial history and one that
cannot.
