# Chief Architect — Final Engineering Decision

**Scope:** `D:\3_Claude\PowerApps\expense-pwa\` (whole application)
**Inputs:** `D:\3_Claude\PowerApps\reports\ui-review.md` (20 findings, 68/100), `D:\3_Claude\PowerApps\reports\code-review.md` (26 findings, 54/100), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (44 WORK items, 5 escalated conflicts). All three received and read in full.
**Standards applied:** `knowledge/project.md`, `knowledge/review-conventions.md`, `CLAUDE.md`.

---

## Executive Decision

**No. This application is not fit for release.**

Two Critical defects put wrong money on the screen today: the Dashboard reports Planned ₮0 for every period after a recurring plan's anchor month while the Expenses screen shows the same plan as active, and the Daily screen under "All Time" reports a total derived from a guard constant rather than the user's data. I verified both directly in source — `renderDashboard()` at `index.html:4265` still reads `db.planned.filter(x =&gt; inRange(x.date, from, to))`, and `plannedOccurrences()` at `index.html:3244` terminates on `guard++ &lt; 5000` with no bounded horizon. A third Critical, unescaped attribute interpolation in the edit modals, combines with import validation that covers five of nine collections to leave a stored-XSS path open through the app's own recovery mechanism. The previous release gate did not close, and it did not close for a specific and correctable reason: the recurrence rework was implemented correctly in the model and never propagated to every consumer, and the verification regime had no step that would notice a forgotten consumer. That is one incomplete migration, not a design failure, and the architecture underneath it — immutable anchor, derived occurrences, quarantine-before-write, append-only migration chain — remains the right one and stays.

---

## Conflict Rulings

### C-1 — Severity and scope of the save-failure reporting gap

**Ruling: CODE-05 governs. Severity is High. The silent quarantine-failure path is in scope, and it is fixed inside `save()`, not at the call sites.**

UI-10 and CODE-05 are not in conflict about the defect, only about its size. CODE-05 saw evidence the UI reviewer could not: `save()` returns `false` with no banner update and no toast when `corruptQuarantineFailed` is set. A write path that can fail in complete silence is a financial-correctness defect, and correctness of financial data outranks everything.

The scope is **not** 31 call sites. The smallest change that removes the real risk is two-part:
1. `save()` must never return `false` silently — the `corruptQuarantineFailed` short-circuit surfaces the existing banner before returning, in one place.
2. The eight call sites that report success to the user branch on the return value, per both reviewers' identical recommendation.

The 23 call sites that report nothing to the user are untouched. Effort stays S. WORK-07 is approved at this scope.

### C-2 — Whether the app's financial figures are trustworthy today

**Ruling: they are not. The Code Review is load-bearing. 54/100 is the governing figure for release readiness. 68/100 stands as a UX score only and may not be quoted as a readiness number.**

The two reports are not in genuine disagreement; they had different evidence. The UI reviewer graded an interface that presents its figures well. The Code reviewer proved those figures are wrong. A well-presented wrong number is worse than a badly-presented right one, and the specific sentence the UI reviewer singled out as the most valuable in the app — `.hero-trend`, "the only place the app tells the user whether they are winning or losing" — is one of the sentences CODE-01 shows can be false. There is no averaging these scores; the correctness finding subsumes the presentation score.

I am not amending the UI Review, and I am not adjusting its severity — neither is mine to change. I am ruling on the standing process question the conflict exposes: **a UI Review may report what a screen shows and how it behaves; it may not assert that the underlying data is correct.** Data correctness is Code Review's evidence domain. That constraint is added to how these reviews are run from now on. It costs nothing and it is the reason a 68 and a 54 were able to describe the same screens.

### C-3 — Who owns the import failure message

**Ruling: CODE-08 owns detection and message content. UI-09 owns presentation, and the presentation surface for import failures is `confirmModal`, not the toast. The import path must not also toast.**

These were never mutually exclusive; the Engineering Manager already recorded the correct sequencing (WORK-28 depends on WORK-06). Narrowing the `catch` to the `JSON.parse` step is the correctness change and comes first: today a quota failure at `index.html:3857` or a render throw after the write reports "Invalid file" for data that has already replaced the user's database. Once each step reports its real outcome, the presentation question has a single answer:

- Validation rejections and post-write failures on the import path → `confirmModal`, which persists until dismissed and can hold a full sentence like `"planned entry 12 has an invalid amount"`.
- Everything else → the toast, with UI-09's `max-width`, `aria-live` and length-scaled timeout.

One failure, one presentation. Restore is the app's primary recovery mechanism; an error on that path must survive long enough to be read.

### C-4 — Scope of the design-token remediation

**Ruling: CODE-26's scope is adopted. UI-16's 1,200-line mechanical substitution pass is rejected.**

This is precisely the "large mechanical sweep" my standing rule prohibits, and the evidence for keeping that rule got stronger this round, not weaker. A single 5,899-line file, no automated tests, no build step, and a sweep touching every radius, font-size, shadow and off-scale spacing value in the stylesheet is unverifiable by inspection and carries real regression risk across sixteen themes and four charts — for zero removal of user-facing risk. UI-16's own impact statement concedes it: "Individually each instance is minor."

WORK-36 is approved at S: promote the four or five repeating inline combinations to classes, plus one carve-out taken from UI-16's own evidence and recommendation — raise the 9 px and 10 px chart and calendar labels that carry actual amounts to `--t-micro`. That is legibility of financial figures, which is a different question from token hygiene. Everything else in the token drift is enforced by attrition: when a rule is touched for another reason, it is brought onto the scale.

### C-5 — Whether negative amounts are a supported value

**Ruling: negative amounts are a supported display value and are not a supported input value. Both reviewers are right and the app is already coherent; nobody had both halves.**

The invariant is already enforced at the untrusted boundary — `entryProblem()` at `index.html:2348` rejects `r.amount &lt; 0` outright on import. `unmoney()` stripping the minus sign at `index.html:2494` is the same invariant enforced at the typed boundary. Meanwhile negatives arise only as *derived* figures: `net = totalIncome - totalExp`, `plannedNet`, and the Planned-vs-Actual per-category difference. The app must render those correctly.

Both items are approved with a specification attached: **an amount stored in a collection is a non-negative whole tugrik; sign is a property of derived figures only.** WORK-29 makes `fmt()` and `fmtCompact()` render `-₮450,000`. WORK-42's comment at `index.html:2494` states that rule rather than merely noting the stripping. The app will not display negatives it refuses as input, because it never asks for one.

---

## Rulings on the Two Implementation Notes

Neither reviewer raised these. They are live semantics in shipped code and I was asked to ratify them, so I am ruling on them as specification decisions, not as findings. They carry no `WORK-` ID because no reviewer raised them; I am labelling them `ARCH-` so they remain traceable and are never confused with reviewer findings.

### ARCH-1 — Monthly stepping drift via `setMonth()` — NOT RATIFIED

`stepDate()` at `index.html:3225` uses `d.setMonth(d.getMonth() + 1)`. An anchor on the 29th–31st does not land on the same day of the following month; it overflows. Jan 31 becomes Mar 3, and then stays on the 3rd forever. February reports zero planned for a plan that was planned for it.

This is not a deliberate semantic. It is an artifact of the `Date` API, and it produces a wrong planned figure by the same mechanism as CODE-01 — a period showing money that was not planned for it. The note is correct that this was previously invisible because history was being erased; retaining history is what made it observable. That does not make it acceptable now.

**Specification, effective immediately:** a monthly recurrence occurs on the anchor's day of month, clamped to the last day of shorter months. Jan 31 → Feb 28 (or 29) → Mar 31. The anchor day is never lost.

This lands in the release gate as its own commit, sequenced immediately after WORK-01, because both edit the recurrence step and horizon logic and no other approved item does. WORK-25 later propagates the corrected `stepDate()` to the goals engine, which is exactly what WORK-25 exists to do.

### ARCH-2 — `nextPlannedDue()` returns the earliest unlogged occurrence — RATIFIED, with a presentation bound

`nextPlannedDue()` at `index.html:3287` walks from the immutable anchor past `recLastDone`. A monthly plan anchored in the past and never logged as actual therefore reads as overdue from its anchor.

I ratify this. It is the only definition consistent with the immutable-anchor model. The alternative — skip to the current period — silently discards occurrences the user planned, which is the precise defect the rework at `index.html:3204-3215` was built to remove. Reintroducing it in the reminder path would give the app two answers again, which is the failure mode this whole gate exists to eliminate.

The cost is real but contained: because `recLastDone` is written only when the user converts an occurrence to an actual — an optional workflow — a user who never uses that button accumulates an unbounded backlog on the reminder bell. That is confined to `nextPlannedDue()` and `upcomingPlannedDates()`; `plannedOccurrences()` and `expandPlannedInRange()` are unaffected, so no total, chart or KPI is wrong.

**I am recording this as a risk, not scheduling work.** No reviewer raised it, no figure is wrong, and the cheapest fix is a presentation bound applied when the reminder surface is next touched for another reason: a reminder surface must not present an unbounded backlog of never-logged occurrences. Attrition, not a sprint item.

---

## Release Gate — Redefined

The previous gate is closed out as **failed**, and replaced with a narrower one. The gate is exactly these eleven changes, each its own commit, and nothing else. Every one is XS or S.

**Block A — finish the recurrence migration** (this is the unfinished work from the last gate, not new defects)

| # | Item | What it closes |
|---|---|---|
| 1 | WORK-01 | Bound the horizon in `plannedOccurrences()` when `endISO` is the open sentinel |
| 2 | ARCH-1 | Monthly step clamps to month-end; anchor day is never lost |
| 3 | WORK-02 | `renderDashboard()` consumes `expandPlannedInRange()`, same as every other screen |
| 4 | WORK-17 | `delete item.recLastDone` on both edit-modal branches |
| 5 | WORK-44 | `load()` persists the migration when `migrate()` raised the version |

**Block B — close the untrusted-input boundary**

| # | Item | What it closes |
|---|---|---|
| 6 | WORK-03 | Escape the seven attribute interpolations; add a CSP meta tag |
| 7 | WORK-04 | Validate all nine collections, including `settings.quickAmounts` |
| 8 | WORK-05 | "Replace all data" builds from schema defaults, not from the live `db` |
| 9 | WORK-06 | Narrow the `catch` to `JSON.parse`; route the write through `save()` |

**Block C — the app never lies about a write**

| # | Item | What it closes |
|---|---|---|
| 10 | WORK-07 | `save()` never returns `false` silently; eight success toasts branch on the return |
| 11 | WORK-15 | Top-level `error` / `unhandledrejection` handler reveals the existing banner |

WORK-15 is in the gate because Block B assumes a safety net exists for whatever still gets through the import path, and today there is none — a throw during `renderSettings()` on newly imported data leaves the user on a half-drawn screen with no route to Restore.

**Not in the gate, and deliberately so:** every accessibility item. UI-01 through UI-05 are High, all five are approved, and all five are scheduled immediately after the gate. They are not release blockers under `knowledge/review-conventions.md`, where only Critical blocks release, and folding them in would triple a gate whose entire value is that it is small enough to verify completely. That is the mistake that was made last time.

---

## Verification — What Changes

The gate failed on manual testing plus headless-browser probes. The regime changes, and the change is targeted at the specific failure, not at "test more".

The last gate did not fail because the logic was wrong. It failed because **a consumer was forgotten.** `renderExpenses()` was migrated, all four Daily renderers were migrated, `renderDashboard()` was not. No probe compared one screen against another, so nothing noticed.

**Stage 0 — before a single line of gate code is written (no implementation):**

1. **A planned-data consumer inventory.** Enumerate every call site that reads `db.planned`, in writing, before starting. Each is ticked off individually at the end. The verification artifact is the list, not the screenshots.
2. **A cross-screen agreement check.** One fixture dataset — at minimum one non-recurring plan, one monthly plan anchored on the 31st, one monthly plan anchored in the past and never logged, one plan with `recEndDate`, one with none — and a written table of expected planned totals per screen per period preset, including "All Time". **Dashboard, Expenses and Daily must produce identical planned totals for the same fixture and the same range.** That single check catches CODE-01, CODE-02 and ARCH-1 simultaneously, and it is the check that was missing.
3. Expected values are written down **before** implementation, not read off the screen afterwards.

The gate closes only when the table is green and every consumer on the inventory is ticked. Not before.

**Stage 2 — the one structural change I am authorising this quarter.** Immediately after the gate closes, extract the pure financial logic — `stepDate`, `plannedOccurrences`, `hasPlannedOccurrence`, `expandPlannedInRange`, `nextPlannedDue`, `migrate`, `entryProblem`, `importProblem` — into a single sibling `&lt;script type="module"&gt;` file, DOM-free and `db`-free, plus a plain HTML test runner. No build step, no test framework, no npm. The Code Review named this in Technical Debt and it is correct: these functions carry the application's financial correctness and are currently unreachable from outside the `&lt;script&gt;` tag.

This narrowly amends my standing "no file split" rule, and I am amending it because the evidence changed: this gate has now failed once on exactly the code that cannot be tested, and it will keep failing until that code can be. It is one file containing pure functions. Nothing else moves out of `index.html`.

It comes **after** the gate, not during it. Refactoring the same lines that carry four Criticals, in the same change, violates "Never implement multiple unrelated features in one task" and would make both harder to verify. It comes **before** WORK-21 and WORK-25, both of which rebuild on that logic.

---

## Approved Improvements

41 of 44 items approved. Four are approved at reduced scope and are marked; their rejected halves are itemised in the next section.

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Clamp the recurring projection horizon | Critical. Daily totals are a function of a guard constant. Gate. |
| WORK-02 | Dashboard consumes derived planned occurrences | Critical. The app holds two contradictory answers and shows the wrong one first. Gate. |
| WORK-03 | Escape seven attribute interpolations; add CSP | Critical. Security hole reachable through the app's own recovery path. Gate. |
| WORK-04 | Import validates all nine collections | Critical. A structurally-valid file makes the app unbootable with no in-app recovery. Gate. |
| WORK-05 | "Replace all data" must replace, not merge | Restore is the primary recovery mechanism and it does not do what its own dialog says. One line. Gate. |
| WORK-06 | Narrow the import `catch`; route through `save()` | Reports "Invalid file" for data already written. Misleading error on the untrusted boundary. Gate. |
| WORK-07 | Success feedback branches on `save()` | Per C-1. A write can fail in total silence; the user is told their money was saved. Gate. |
| WORK-08 | Associate every form input with its label | Not one `for=` in the file. Screen-reader users cannot complete any form. Mechanical, no layout change. |
| WORK-09 | Make the nine modals keyboard operable | Guards every destructive action in the app; today a keyboard user tabs out of the delete confirmation. |
| WORK-10 | Convert four generated `div` surfaces to buttons | The div-based date picker is the only way to set a goal deadline; keyboard users cannot set one at all. |
| WORK-11 | Bring controls to 44×44 px | The project's own mobile-first rule, violated on the most-tapped controls. CSS-only. |
| WORK-12 | Income back in the tab bar; align Daily naming | Income is a named core module hidden two taps deep behind "⋯". Two array entries. |
| WORK-13 | Round money at the store boundary | Stored float drift accumulates into every derived figure. "Reliable" is a stated principle. No migration needed. |
| WORK-15 | Top-level error / unhandledrejection handler | The safety net Block B assumes exists. Reuses the existing banner DOM. Gate. |
| WORK-16 | Cloud load must pass through `load()` | Precondition of ever enabling the quarantined sync module. XS, and makes the quarantine safe rather than merely closed. |
| WORK-17 | Clear `recLastDone` on recurrence removal | Part of the incomplete migration. A UI round-trip silently makes financial state wrong. Gate. |
| WORK-18 | Planned vs Actual keys on `categoryId` | Silently wrong Dashboard breakdown; all deleted-category entries merge into one "Unknown" row. One line. |
| WORK-19 | Serve the app shell cache-first | Network-first contradicts the stated offline-first principle on the common mobile case. Requires stale-while-revalidate and the existing per-deploy `CACHE` bump. |
| WORK-20 | Stable hash for chart colours | Users read those charts by colour, and the app ships drag-to-reorder for the array the colours are bound to. |
| WORK-21 | Expand the planned series once per `renderDaily()` | Removes a 4× multiplier on the heaviest render at S effort. Approved independently of the deferred WORK-14. |
| WORK-22 | Debounce `save()` | Whole-database `JSON.stringify` on every toggle and drag, synchronously on the main thread. Belongs inside WORK-27. |
| WORK-24 | Remove dead code; isolate the Firebase module | *Reduced scope.* Supports the Cloud Sync quarantine ruling. |
| WORK-25 | Collapse the two recurrence engines into `stepDate()` | Two engines is how ARCH-1 gets fixed in one place and stays wrong in the other. Stops a third scheduler appearing. |
| WORK-27 | Thin write API (`addEntry`/`updateEntry`/`removeEntry`) | The one store seam. Removes the four `localStorage` bypasses and is the prerequisite for any storage change. Funded, not cuttable. |
| WORK-28 | Fix the toast error channel | Per C-3. Errors on the recovery path must survive long enough to be read. |
| WORK-29 | Negative amounts format as `-₮450,000` | Per C-5. The hero's sign is the only thing distinguishing a large deficit from a large surplus. |
| WORK-30 | AA contrast on Dashboard hero and Salary summary | The lowest-contrast text in the app carries its single most important sentence. Three opacity values. |
| WORK-31 | Placeholder contrast in all sixteen themes | Placeholders carry real guidance here. The same pass was already done for `--text-2` and skipped `--placeholder`. |
| WORK-32 | Stop `word-break: break-all` splitting money | `₮1,25 / 0,000` on the Dashboard on the most common large phones is momentarily misreadable. |
| WORK-33 | Expand the Salary Calculator's acronyms | Direct violation of "understandable without training" on the screen that writes straight into Income. Purely textual, zero risk. |
| WORK-34 | Move the date filter below the content it filters | *Reduced scope.* An empty filter widget outranking the user's money on the home screen. |
| WORK-35 | Non-colour state indicator and `aria-pressed` on chips | Filtered financial totals with no perceivable indication that anything is excluded. |
| WORK-36 | CSS and markup obey the declared tokens | *Reduced scope, per C-4.* Plus the 9–10 px amount-bearing chart labels raised to `--t-micro`. |
| WORK-37 | Reconcile project.md with the shipped modules | *Reduced scope.* Reaffirms my previous ruling; UI-06 independently reached the same "smallest honest step". |
| WORK-38 | Advisor first-run tip points at a real tab | The only onboarding guidance a first-run user gets, and half of it points nowhere. Closes free if WORK-12 lands first. |
| WORK-39 | Render hero Net Balance without the count-up tween | 450 ms of a plausible, legible, wrong currency figure on the headline number of a finance app. One line. |
| WORK-40 | Manifest splash colour and orientation | Dark navy splash flashing to a near-white app on every cold launch. Orientation unlock requires a landscape smoke check first. |
| WORK-41 | Complete or drop the partial tab ARIA pattern | Take the smaller option: drop `role="tablist"`/`role="tab"`, use `aria-pressed`. Decided jointly with WORK-35 — see below. |
| WORK-42 | Document `unmoney()`'s whole-tugrik behaviour | Per C-5, and the comment must state the invariant, not just the behaviour. |
| WORK-43 | Recompute the active preset across midnight | A PWA left open reports the previous month under a "This Month" label, including in the advisor's projection rule. |
| WORK-44 | Persist the migration result at the end of `load()` | Part of the incomplete migration. The append-only contract assumes a step runs once. Gate. |

**Standing decision covering WORK-35 and WORK-41** (the Engineering Manager correctly flagged these as one decision): **the app standardises on `aria-pressed` for toggle controls.** No new `role="tablist"` is introduced anywhere. The three existing segmented controls drop the tab roles.

---

## Rejected Improvements

No whole item was rejected. That is not an oversight — every one of the 44 traces to an observed defect or a documented deviation from `knowledge/project.md`, `coding-standards.md` or `ui-guidelines.md`, and both reviewers stayed inside their evidence. What is rejected is **scope**, and these rejections are load-bearing: they remove roughly a week of work that removes no risk.

| Item ID | Rejected portion | Reason for rejection |
|---|---|---|
| WORK-36 | UI-16's mechanical substitution pass over ~1,200 lines of CSS — every radius, font-size, shadow and off-scale spacing value | Per C-4. This is the large mechanical sweep my standing rule bans, and the case for the rule is stronger this round, not weaker: no automated tests, no build step, one 5,899-line file, sixteen themes and four charts to regress, for zero user-facing risk removed. UI-16's own impact statement concedes each instance is minor. Tokens are enforced by attrition. |
| WORK-34 | The collapse-to-a-tappable-summary-chip component | The finding is that chrome outranks content on the home screen. Moving `.filter-row` below `.hero-kpi` removes that entirely. A new collapsible component is added complexity built to serve a problem the reorder already solved. Reorder on the Dashboard only; leave `initPeriodFilter()` wiring untouched. |
| WORK-37 | Building Budget Planning, Analytics and Reports | Reaffirms my previous ruling. Three new modules is XL speculative work while the app cannot yet put a correct planned figure on its own home screen. UI-06's own recommendation names reconciling the reference document as "the smallest honest step". Amend `project.md` to describe the modules that ship — including Daily and Goals, which are real and which the reference does not acknowledge — and record Budget Planning, Analytics and Reports under an explicit "Not built" heading so the gap stays visible rather than being quietly deleted. Documentation only, XS. |
| WORK-24 | Restructuring the Firebase module | Cloud Sync stays quarantined. Delete the `isoDate` alias and the two unused `EMPTY_ICONS` entries, and put a single clearly-marked boundary comment around the ~190 unreachable lines. Reorganising a module that is prohibited from executing is work that removes no risk from a shipped artifact. |
| WORK-07 | Migrating all 31 `save()` call sites | Per C-1. Eight call sites report success to the user; those eight branch. The silent-failure risk is removed inside `save()` itself, in one place. Touching 23 call sites that report nothing would be a mechanical sweep across the file's most-edited handlers for no additional risk removed. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-14 | Bucket once per render instead of scanning per bucket | The evidence is a projection at 10,000 transactions, not a measurement. Bring a profile of `renderDashboard()` and `renderDaily()` over a 5,000-entry fixture on a mid-range phone. If either exceeds 100 ms, this is approved immediately at P1 — "Fast" is a stated principle and I will not argue with a number. Until then it is M-effort against a modelled future. Note that WORK-21 is approved regardless and removes the worst multiplier (4× redundant expansion) at S. |
| WORK-23 | Extract `initRowReorder()` from the two duplicated reorder handlers | Real duplication, real standards deviation, but a stable one — no drag defect has been reported and the two copies have not functionally diverged. This is the attrition rule applied consistently: extract the moment either handler is touched for any other reason, and the extraction is then free. A bug report against either handler promotes it immediately. |
| WORK-26 | Turn `analyzeExpenses()` into a rule table | 328 lines is a genuine standards violation, but the stated justification is that it will become the seed of the AI Budget Assistant — a "future versions may include" item. Restructuring for a module that may never be built is premature generalisation. What settles it: the next time an advisor rule is added, removed, or has a threshold changed. At that point extract the rule table as part of that change, not before it. |

---

## Standing Architectural Rules — Reaffirmed and Amended

| Rule | Status |
|---|---|
| No rewrite | **Holds.** Reinforced. The Code Review independently reached the identical conclusion — "Explicitly not recommended: a rewrite, a framework, a build step, or a state-management library" — and every one of the 44 items is reachable by refactor. |
| No framework | **Holds.** |
| No build step | **Holds.** The Stage 2 test module needs none: a plain ES module and a plain HTML runner. |
| No file split this quarter | **Amended, narrowly.** One sibling pure-logic module (`stepDate`, `plannedOccurrences`, `hasPlannedOccurrence`, `expandPlannedInRange`, `nextPlannedDue`, `migrate`, `entryProblem`, `importProblem`) plus a test runner, DOM-free and `db`-free. Post-gate. Nothing else leaves `index.html`. Amended because this gate has now failed once on exactly the code that cannot be tested. |
| No large mechanical sweeps; tokens by attrition | **Holds.** Reinforced by the C-4 ruling and extended to the 23 non-reporting `save()` call sites. |
| Cloud Sync quarantined — hidden, not repaired, not deleted, not extended | **Holds, and tightened.** I confirmed the quarantine is intact: `firebaseConfig` is empty at `index.html:2079-2086`, `isFirebaseConfigured()` gates the card, and the README warning is referenced in-file. WORK-16 and WORK-24 are approved as *precondition and containment* work only. Last-write-wins whole-document overwrite and invisible sync failures remain unresolved preconditions. **Enabling Cloud Sync is prohibited until both are designed and ruled on.** The Code Review names it correctly: "the roadmap item most likely to cause data loss." |
| No `render*` function may call `save()` | **Holds.** The recurrence rework honoured it and documents it at `index.html:3215`. WORK-44 does not violate it — `load()` is not a render function. |
| One store seam | **Holds, and is now scheduled.** WORK-27 is the seam. Funded, sequenced, not cuttable. |
| **New — no review IDs in source code** | `index.html:3243` reads "that is the render cost covered by WORK-23, not here." WORK IDs are per-report and are not stable across runs: in this roadmap WORK-23 is `initRowReorder()`, so that comment is now actively misleading. Comments describe the condition, never the ticket. Fix it when WORK-01 touches those lines. |

**A risk I am recording, not a finding:** no reviewer raised the stale WORK ID at `index.html:3243`, and neither raised ARCH-1 or ARCH-2. I am not converting any of the three into findings and no severity is being assigned on any reviewer's behalf.

---

## Architecture Strategy — Next Quarter

**What stays.** The single-file zero-dependency zero-build PWA. It is why the app boots instantly and works offline, and both reviewers independently defended it. The persistence core stays exactly as it is: quarantine-before-write, `save()` returning a real boolean, the persistent non-dismissible failure banner, the numbered append-only migration chain, `toLocalISO()` everywhere with lexical `YYYY-MM-DD` comparison. Both reviewers rated this core above the standard for apps of this size and they are right — it is the reason four Criticals are recoverable rather than catastrophic. The immutable-anchor recurring model stays; it was the right design and it is being finished, not revisited.

**What changes.** Three things, in order. First, one meaning for a planned occurrence — every consumer reads through `expandPlannedInRange()`, no exceptions, verified against a written consumer inventory. Second, the financial logic becomes testable: pure functions in a sibling module with a plain runner, which is the structural answer to a gate that has now failed on untested arithmetic. Third, one store seam — `addEntry`/`updateEntry`/`removeEntry` (WORK-27) — which removes the four `localStorage` bypasses, gives the debounce (WORK-22) one home instead of 31, and is the only place a future IndexedDB backend can be attached without rewriting every handler.

**What is off limits.** A rewrite. A framework. A build step. A state library. Enabling Cloud Sync. Building Budget Planning, Analytics or Reports. Any mechanical sweep across the file. The IndexedDB migration itself — named correctly in Technical Debt as the ceiling on the roadmap, but it does not start until WORK-27 has landed and the seam has been proven by the twelve financial call sites migrating cleanly through it. Doing it before the seam exists is the same mistake as this gate, at ten times the cost.

**The shape of the quarter.** Gate, then testability, then accessibility, then the seam. Nothing after the gate is scheduled ahead of the thing it depends on, and nothing is scheduled at all that does not remove a risk someone observed.

---

## Executive Report

The application is not fit for release, and the reason is narrower than the raw numbers suggest. Four Critical findings and 44 open items reads like an application in trouble. It is not. Two of the four Criticals (CODE-01, CODE-02), plus CODE-19 and CODE-25, are a single incomplete migration — the recurring-plan rework was designed correctly, implemented correctly in the model layer, and then not carried to every consumer. The Engineering Manager's characterisation is exactly right and I adopt it: **one unfinished piece of work producing four findings, not four defects.** The other two Criticals (CODE-03, CODE-04) are a single unclosed boundary — the import path — and all four fixes there are XS or S.

The score conflict is resolved in favour of the Code Review. **54/100 governs release readiness; 68/100 is a UX score and must not be quoted as a readiness figure.** The UI reviewer graded a well-built interface honestly and within their evidence; they simply had no way to see that the figures that interface presents so clearly are wrong. That is a structural property of splitting the review, not a failure by either reviewer, and I have added a standing constraint so it cannot recur: a UI Review reports what a screen shows and how it behaves, never that the data behind it is correct.

The important finding of this round is not in either report. It is that **the previous gate closed on verification that could not have detected the defect that survived it.** Manual testing and headless probes exercised each screen; nothing compared one screen against another, so a forgotten consumer was invisible by construction. The fix is not "test harder" — it is two artifacts written before implementation starts: a consumer inventory of every call site reading `db.planned`, and a cross-screen agreement table proving Dashboard, Expenses and Daily produce identical planned totals for one fixture across every period preset, including "All Time". That single table catches CODE-01, CODE-02 and the ARCH-1 month-end drift at once. Immediately after the gate, the pure financial functions move into a sibling module with a plain test runner — the one structural rule I am amending, and I am amending it because the alternative is watching this gate fail a third time.

I ruled on all five conflicts, all 44 WORK items and both unratified implementation semantics. 41 items approved, four of those at reduced scope, three deferred with stated settling conditions, and roughly a week of speculative work rejected — the 1,200-line token sweep, three unbuilt modules, a new collapsible filter component, a 31-call-site migration, and a reorganisation of code that is prohibited from running. On the two live semantics nobody had ratified: the earliest-unlogged-occurrence rule is **ratified**, because skipping to the current period would reintroduce the exact occurrence-erasing defect the rework removed; the `setMonth()` month-end drift is **not ratified** and enters the gate, because a monthly plan anchored on the 31st that silently relocates itself to the 3rd and empties February is a wrong planned figure by the same mechanism as the Critical this gate exists to close.

---

## Implementation Priority

Each numbered item is one commit. Nothing in a later stage starts before its stage opens.

**Stage 0 — Verification artifacts. No code.**
Consumer inventory of every `db.planned` reader; fixture dataset; expected-value table per screen per preset, written before implementation. *Precondition for Stage 1. This is the step whose absence let the last gate close wrongly.*

**Stage 1 — Release gate.** Ordered so each fix builds on corrected foundations rather than propagating a defect forward.
1. WORK-01 — clamp the horizon. *First: WORK-02 routes the Dashboard through this function, so an unclamped version would trade one wrong number for another.*
2. ARCH-1 — monthly month-end clamp. *Same function, immediately after, before any consumer is pointed at it.*
3. WORK-02 — Dashboard consumes the derived series. *Now inherits correct horizon and correct stepping.*
4. WORK-17 — clear `recLastDone` on recurrence removal.
5. WORK-44 — persist the migration in `load()`.
6. WORK-03 — escape the seven attributes; add CSP. *Highest value-per-minute item in the entire set.*
7. WORK-04 — validate all nine collections.
8. WORK-05 — replace, do not merge.
9. WORK-06 — narrow the `catch`; route the write through `save()`. *Items 7–9 all edit the same handler; one branch, this sequence, avoids three rounds of churn in a 5,899-line file.*
10. WORK-07 — `save()` never fails silently; eight toasts branch. *Before item 9's routing is meaningful.*
11. WORK-15 — top-level error handler. *Last in the gate: the net under everything above.*

**Gate verification.** Re-run the Stage 0 table. Tick every consumer on the inventory. Green table and complete inventory, or the gate does not close.

**Stage 2 — Testability.** Extract the pure logic module and the first test file covering `stepDate`, `plannedOccurrences`, `nextPlannedDue`, `migrate`, `entryProblem`, `importProblem`. *Blocks WORK-21 and WORK-25, both of which rebuild this logic.*

**Stage 3 — Correctness of presentation, then accessibility.** WORK-18 (wrong Dashboard breakdown, one line, goes first) → WORK-29 → WORK-13 → WORK-08 → WORK-10 → WORK-11 → WORK-09 → WORK-12 → WORK-38 → WORK-28 → WORK-30 → WORK-31 → WORK-32 → WORK-35 → WORK-41. *WORK-29 before WORK-13 so the formatters are touched once each. WORK-10 before WORK-11 because sizing rules target buttons. WORK-12 before WORK-38 or the latter becomes a copy edit. WORK-35 and WORK-41 land together under the single `aria-pressed` decision.*

**Stage 4 — The store seam.** WORK-27 → WORK-22 → WORK-16 → WORK-24 → WORK-19. *WORK-27 first: the debounce belongs inside the write API, not scattered across 31 call sites. WORK-16 before WORK-24 so the reorganisation does not carry the latent cloud defect forward.*

**Stage 5 — Recurrence unification and the remainder.** WORK-21 → WORK-25 (carries ARCH-1 to the goals engine permanently) → WORK-20 → WORK-33 → WORK-34 → WORK-36 → WORK-37 → WORK-39 → WORK-40 → WORK-42 → WORK-43.

**Not scheduled:** WORK-14, WORK-23, WORK-26 — deferred with the settling conditions stated above.

---

## Recommended Next Action

**Approve the redefined release gate — eleven items (WORK-01, ARCH-1, WORK-02, WORK-17, WORK-44, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-15), one commit each, in the order given — and approve Stage 0 as a hard precondition: the `db.planned` consumer inventory and the cross-screen expected-value table must be written down before the first line of gate code is changed.** That single precondition is the difference between this gate and the last one, which closed on verification incapable of catching the defect that survived it. No implementation begins until you approve. If you approve only one thing today, approve Stage 0 — it costs an hour, it is the only artifact that would have prevented this second round, and every other decision in this report waits behind it.
