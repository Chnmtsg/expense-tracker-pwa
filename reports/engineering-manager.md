# Execution Roadmap — Expense Tracker PWA

Merged from `D:\3_Claude\PowerApps\reports\ui-review.md` (20 findings, 68/100) and `D:\3_Claude\PowerApps\reports\code-review.md` (26 findings, 54/100). 46 findings in, 44 `WORK-` items out, two merges. No finding dropped, no severity altered.

## Project Health

The application is not releasable. The code review found four Critical defects — two of which put wrong financial figures on the Dashboard and the Daily screen today — and the UI review independently found the accessibility layer effectively absent, with five High findings covering unlabelled forms, keyboard-unreachable dialogs and controls, and touch targets below the project's own 44×44 rule. The two scores (68 and 54) do not average into a useful number: the UI reviewer graded a surface that looks and behaves well but was reading figures it had no way to verify, and the code reviewer proved those figures are wrong. The persistence core, migration chain and failure banners are genuinely above average and should be preserved as-is; the gap is between that core and everything that reads from it.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Clamp the recurring projection horizon in `plannedOccurrences()` | CODE-02 | Critical | P0 | S | — |
| WORK-02 | Dashboard must consume derived planned occurrences, not the raw anchor | CODE-01 | Critical | P0 | S | WORK-01 |
| WORK-03 | Escape the seven unescaped attribute interpolations; add CSP meta | CODE-03 | Critical | P0 | XS | — |
| WORK-04 | Import validates all nine collections, not five | CODE-04 | Critical | P0 | S | — |
| WORK-05 | "Replace all current data" must replace, not merge | CODE-06 | High | P1 | XS | WORK-04 |
| WORK-06 | Narrow the import `catch`; route the import write through `save()` | CODE-08 | High | P1 | XS | WORK-04, WORK-05 |
| WORK-07 | Success feedback must branch on the `save()` return value | CODE-05, UI-10 | High (CODE-05) / Medium (UI-10) | P1 | S | — |
| WORK-08 | Associate every form input with its label | UI-01 | High | P1 | S | — |
| WORK-09 | Make the nine modal dialogs keyboard operable | UI-02 | High | P1 | M | — |
| WORK-10 | Convert the four generated interactive `div` surfaces to buttons | UI-03 | High | P1 | S | — |
| WORK-11 | Bring interactive controls up to the 44×44 px minimum | UI-04 | High | P1 | S | WORK-10 |
| WORK-12 | Put Income back in the tab bar; align Daily naming | UI-05 | High | P1 | S | — |
| WORK-13 | Round money at the store boundary | CODE-07 | High | P1 | M | WORK-29 |
| WORK-14 | Bucket once per render instead of scanning per bucket | CODE-09 | High | P1 | M | WORK-21 |
| WORK-15 | Add a top-level error / unhandledrejection handler | CODE-10 | Medium | P2 | XS | — |
| WORK-16 | Cloud load must pass through `load()` | CODE-18 | Medium | P2 | XS | — |
| WORK-17 | Clear `recLastDone` when recurrence is removed | CODE-19 | Medium | P2 | XS | — |
| WORK-18 | Planned vs Actual must key on `categoryId`, not name | CODE-15 | Medium | P2 | XS | — |
| WORK-19 | Serve the app shell cache-first | CODE-11 | Medium | P2 | XS | — |
| WORK-20 | Derive chart colours from a stable hash of category id | CODE-16 | Medium | P2 | S | — |
| WORK-21 | Expand the planned series once per `renderDaily()` | CODE-20 | Medium | P2 | S | WORK-01 |
| WORK-22 | Debounce `save()` | CODE-22 | Medium | P2 | S | WORK-27 |
| WORK-23 | Extract `initRowReorder()` from the two duplicated reorder handlers | CODE-13 | Medium | P2 | S | — |
| WORK-24 | Remove dead code: `isoDate` alias, unused icons; isolate the Firebase module | CODE-21 | Medium | P2 | S | WORK-16 |
| WORK-25 | Collapse the two recurrence engines into `stepDate()` | CODE-12 | Medium | P2 | M | WORK-01 |
| WORK-26 | Turn `analyzeExpenses()` into a rule table over one computed context | CODE-14 | Medium | P2 | M | — |
| WORK-27 | Introduce a thin write API (`addEntry` / `updateEntry` / `removeEntry`) | CODE-17 | Medium | P2 | L | WORK-07 |
| WORK-28 | Fix the toast error channel: width, `aria-live`, duration, import failures in a modal | UI-09 | Medium | P2 | S | WORK-06 |
| WORK-29 | Negative amounts must format as `-₮450,000` | UI-11 | Medium | P2 | XS | — |
| WORK-30 | Fix AA contrast on the Dashboard hero and Salary summary | UI-07 | Medium | P2 | XS | — |
| WORK-31 | Fix placeholder contrast in all sixteen themes | UI-08 | Medium | P2 | XS | — |
| WORK-32 | Stop `word-break: break-all` splitting money figures mid-number | UI-12 | Medium | P2 | XS | — |
| WORK-33 | Expand the Salary Calculator's acronyms and explain the rate defaults | UI-13 | Medium | P2 | S | — |
| WORK-34 | Move the date filter below the content it filters | UI-14 | Medium | P2 | S | — |
| WORK-35 | Give category filter chips a non-colour state indicator and `aria-pressed` | UI-15 | Medium | P2 | XS | — |
| WORK-36 | Make the CSS and the generated markup obey the declared design tokens | UI-16, CODE-26 | Medium (UI-16) / Low (CODE-26) | P2 | M | WORK-11, WORK-30, WORK-31, WORK-32 |
| WORK-37 | Reconcile project.md with the shipped modules, or plan Budget Planning / Analytics / Reports | UI-06 | Medium | P2 | XL | — |
| WORK-38 | Advisor first-run tip points at a tab that does not exist | UI-17 | Low | P3 | XS | WORK-12 |
| WORK-39 | Render the hero Net Balance without the count-up tween | UI-18 | Low | P3 | XS | — |
| WORK-40 | Manifest splash colour and orientation lock | UI-19 | Low | P3 | XS | — |
| WORK-41 | Complete or drop the partial tab ARIA pattern | UI-20 | Low | P3 | XS | WORK-35 |
| WORK-42 | Document `unmoney()`'s whole-tugrik behaviour | CODE-23 | Low | P3 | XS | — |
| WORK-43 | Recompute the active period preset across midnight | CODE-24 | Low | P3 | S | — |
| WORK-44 | Persist the migration result at the end of `load()` | CODE-25 | Low | P3 | XS | — |

## Quick Wins

XS or S effort, removing Medium or higher severity. Do each first inside its own priority band — none of these is promoted out of its band because it is cheap.

**P0 band:** WORK-03 (XS, closes the stored-XSS hole with seven `escapeHTML()` wraps), WORK-01, WORK-02, WORK-04.

**P1 band:** WORK-05 (XS, one line makes Restore actually restore), WORK-06 (XS), WORK-07 (S, removes the app congratulating the user on a write that did not land), WORK-08 (S, mechanical `for=` pass unblocks every form for screen readers), WORK-10 (S, four `div`→`button` swaps restore keyboard access to the calendar and the only date picker), WORK-11 (S, CSS-only), WORK-12 (S, two array entries put a core module back).

**P2 band:** WORK-15, WORK-16, WORK-17, WORK-18, WORK-19, WORK-29, WORK-30, WORK-31, WORK-32, WORK-35 (all XS); WORK-20, WORK-21, WORK-23, WORK-24, WORK-28, WORK-33, WORK-34 (all S).

The highest value-per-hour items in the whole set are WORK-03, WORK-05, WORK-18 and WORK-29: four one-to-few-line changes that remove a security hole, a silent data-recovery failure, a wrong Dashboard breakdown and a malformed currency figure.

## Sprint Plan

**Sprint 1 — "Correct figures, closed import boundary, forms usable"**

Items: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-15, WORK-08, WORK-10, WORK-11, WORK-29, WORK-30, WORK-31.

Effort: 7 × S, 7 × XS ≈ 5.25 implementation days. Reserve the remainder of the sprint for regression testing of financial figures across period presets — that testing is not optional and is the reason this sprint is not fuller.

Delivers:
- The Dashboard, Expenses and Daily screens report the same planned figures for the same data, and "All Time" stops summing 5,000 projected occurrences.
- The import path is closed: a restored file can no longer inject script, can no longer make the app unbootable, replaces rather than merges, and reports its real outcome. A top-level error handler catches whatever still gets through and surfaces the existing Restore banner.
- The user is never told a save succeeded when it did not.
- Every form field has an accessible name; the calendar, chart, currency rows and date-picker cells are keyboard reachable; the most-tapped controls meet 44×44.
- Negative balances and hero text are legible and correctly formatted.

Not in Sprint 1 and deliberately so: WORK-09 (modal keyboard behaviour) is M and touches nine dialogs including the confirmation dialog that guards every destructive action — it needs a sprint where it is not competing with four Criticals.

## Roadmap

**Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-10, WORK-11, WORK-15, WORK-29, WORK-30, WORK-31

**Sprint 2:** WORK-09, WORK-12, WORK-13, WORK-16, WORK-17, WORK-18, WORK-19, WORK-21, WORK-28, WORK-38, WORK-44

**Sprint 3:** WORK-27, WORK-14, WORK-20, WORK-22, WORK-32, WORK-35, WORK-41

**Later:** WORK-23, WORK-24, WORK-25, WORK-26, WORK-33, WORK-34, WORK-36, WORK-37, WORK-39, WORK-40, WORK-42, WORK-43

Nothing in **Later** is cancelled. WORK-37 in particular is an XL product decision that should be scheduled with the Chief Architect early even though the implementation lands late.

## Dependencies

- **WORK-01 before WORK-02.** The Dashboard fix routes it through `expandPlannedInRange()`. If the horizon clamp is not in place first, the Dashboard inherits the 5,000-occurrence defect that WORK-01 exists to remove — the fix would trade one wrong number for another.
- **WORK-01 before WORK-21 and WORK-25.** The single hoisted expansion and the unified recurrence engine must both be built on the corrected step-and-horizon logic, or the clamp has to be applied twice.
- **WORK-04 → WORK-05 → WORK-06.** All three edit the same import handler. Sequencing them in one branch avoids three rounds of merge churn in a 5,899-line file, and WORK-06's narrowed `catch` only makes sense once WORK-04's validation and WORK-05's replacement semantics define what the surviving failure modes are.
- **WORK-07 before WORK-06's write path is meaningful.** Routing the import write through `save()` only helps if `save()`'s return value is acted on.
- **WORK-10 before WORK-11.** Sizing rules target buttons; the generated elements must be buttons before the 44×44 rules can apply to them.
- **WORK-09 and WORK-10 together complete the date-picker path.** WORK-10 makes the picker cells focusable; WORK-09 makes the modal containing them escapable and focus-trapped. Either alone leaves the keyboard path half-built, though neither blocks the other technically.
- **WORK-29 before WORK-13.** Both edit `fmt()` / `fmtCompact()`. Fix the sign placement first, then remove rounding as a display concern, so the formatters are touched once each.
- **WORK-27 before WORK-22.** Debouncing belongs inside the write API, not scattered across 31 call sites. WORK-27 is also the prerequisite for the IndexedDB migration the code review names in Technical Debt.
- **WORK-16 before WORK-24.** Fix the cloud path's latent defect before reorganising the module that contains it, so the reorganisation does not carry the bug forward.
- **WORK-11, WORK-30, WORK-31, WORK-32 before WORK-36.** The token substitution pass maps sizes, radii and spacing to the nearest declared token. Running it before the contrast and touch-target fixes are baked in risks reverting them.
- **WORK-12 before WORK-38.** If Income becomes a real tab, the advisor's first-run copy becomes true and the item closes for free. If WORK-12 is rejected, WORK-38 becomes a copy edit instead.
- **WORK-35 and WORK-41 share one decision.** Both hinge on whether the app standardises on `aria-pressed` for toggle controls. Decide once.
- **WORK-37 does not block WORK-12.** The IA reshuffle is reversible and cheap; the module-scope decision is neither. Do not hold a High-severity navigation fix behind an XL product question.

## Conflicts

**C-1 — Severity and scope of the save-failure reporting gap.** UI-10 rates it Medium and scopes the fix to eight call sites that report success (`if (save()) toast(...)`). CODE-05 rates it High, counts 31 callers ignoring the return, and adds evidence the UI reviewer could not see: `save()` returns `false` with no banner update and no toast at all when `corruptQuarantineFailed` is set, so there is a path where the user is told an entry was added, nothing was written, and nothing ever will be. Both positions stand as written. The merged item WORK-07 carries both severities. The Chief Architect should rule on whether the silent quarantine-failure path is in scope for the same change.

**C-2 — Whether the app's financial figures are trustworthy today.** The UI review states "the app is correct and safe with its data" and awards 68/100 on the basis of no Critical findings. The code review states the Dashboard reports Planned ₮0 and a false "over budget" verdict for every period after a recurring plan's anchor month (CODE-01), and that Daily totals under "All Time" report a number derived from a guard constant (CODE-02). These describe the same screens: the UI reviewer praised `.hero-trend` as "the only place the app tells the user whether they are winning or losing" while the code reviewer showed that sentence can be wrong. Not resolved here. It materially affects whether 68/100 is defensible as a UX score.

**C-3 — Who owns the import failure message.** UI-09 recommends routing import failures out of the toast and into the existing `confirmModal`, with a length-scaled toast timeout and `aria-live` for everything else. CODE-08 recommends narrowing the `catch` so the write and render steps report their own outcomes through `save()` and the existing persistent banner. Both are correct in isolation; together they would give the same failure two different presentations. One owner needs to be chosen for the import error path.

**C-4 — Scope of the design-token remediation.** UI-16 rates the token drift Medium and recommends a mechanical substitution pass across roughly 1,200 lines of CSS — every radius, font-size, shadow and off-scale spacing value mapped to the nearest declared token. CODE-26 rates the same underlying problem Low and explicitly recommends the opposite scope: "Do not attempt all 156," promote only the four or five repeating inline combinations to classes. Merged as WORK-36 with both severities recorded; the effort estimate (M) reflects the UI reviewer's larger scope and will drop to S if the Chief Architect adopts the code reviewer's.

**C-5 — Whether negative amounts are a supported value.** UI-11 treats negatives as first-class and requires `-₮450,000` on the hero and in Planned-vs-Actual. CODE-23 examines `unmoney()`, which strips minus signs from every amount the user types, rates it Low, and recommends leaving the behaviour and adding a comment. The app would then display negatives it will not accept as input. Neither reviewer saw the other's half. Flagged as a coherence question, not a defect either reviewer raised.

## Estimated Effort

| Priority | Items | Effort breakdown | Approx. dev-days |
|---|---|---|---|
| P0 | 4 | 3 × S, 1 × XS | ~1.75 |
| P1 | 10 | 3 × M, 5 × S, 2 × XS | ~7.5 |
| P2 | 23 | 1 × XL, 1 × L, 3 × M, 8 × S, 10 × XS | ~15 + the XL |
| P3 | 7 | 1 × S, 6 × XS | ~2 |
| **Total** | **44** | | **~26 dev-days + WORK-37 (XL, needs a product decision first)** |

Estimates are implementation only, at the smallest safe scope each reviewer recommended. They exclude regression testing, which for the P0 band is a significant additional cost because the defects are in financial arithmetic with no unit tests anywhere in the repository.

## Recommendations

Three things, in one minute.

**First: the release gate did not close.** The prior round rebuilt the recurring model around an immutable anchor with derived occurrences, and it was the right design — but CODE-01 shows the Dashboard was never migrated to it, so the app now holds two contradictory answers for the same question and shows the wrong one on the screen users open first. CODE-02 shows the new expander has no bounded horizon. CODE-19 shows the edit round-trip leaves `recLastDone` behind. That is one incomplete migration producing three findings, and it should be treated as unfinished work from the last gate rather than as three new defects. Whatever verification let that gate close needs to change before the next one.

**Second: rule on C-2 before anyone quotes a score.** The UI review and the code review disagree about whether the numbers on the screen are right. That is not a stylistic disagreement — it decides whether this is a 68 that needs polish or a 54 that needs rework. My reading of the merged evidence is that the code review's is the load-bearing one, but the call is yours.

**Third: fund WORK-27 in Sprint 3 and do not let it slip.** It is the only L in the plan and the only item with no user-visible output, which makes it the easiest thing to cut. It is also the prerequisite for the storage-model change that the roadmap's own future modules — Cloud Sync, OCR Receipt Scanner — cannot ship without. Cutting it does not save four days; it defers them and adds every call site written in the meantime.

One caution on scope: the code review's "Explicitly not recommended" list — no rewrite, no framework, no build step, no state library — is worth adopting as a standing constraint on this roadmap. Every one of these 44 items is reachable by refactor.
