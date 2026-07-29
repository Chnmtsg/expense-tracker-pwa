# Merged Execution Roadmap — Expense Tracker PWA

**Inputs:** `D:\3_Claude\PowerApps\reports\ui-review.md` (30 findings, 66/100) and `D:\3_Claude\PowerApps\reports\code-review.md` (24 findings, 58/100). Both reports received in full.
**Merged into:** 50 `WORK-` items. 54 source findings, all traced, none dropped. One cross-report duplicate merged (UI-20 + CODE-06). One intra-report cluster merged (UI-22/23/24 + CODE-24, all Low, one fix pattern).
**Conventions:** `D:\3_Claude\PowerApps\knowledge\review-conventions.md`. Severities are reproduced exactly as the raising reviewer set them. Effort is re-estimated by me where merging changed the shape of the work.

---

## Project Health

The application is not ready for release. The Code Review found one Critical defect — every write in the app goes through an unguarded `localStorage.setItem()` with no failure path (`expense-pwa/index.html:2079-2082`) — plus four High defects concentrated in the data layer, which is why it scores 58/100; the UI Review found no Critical but eight High findings and scores 66/100. Read together, the picture is a product whose visible surface is better than its foundation: the design-token system, empty states and confirmation dialogs are genuinely good, while data durability, planned-expense history and the entire accessibility layer are not built. The two scores are consistent, not contradictory — the UI reviewer could not see CODE-01 because it fails silently, which is precisely the finding. Nothing should ship until WORK-01 through WORK-05 are closed, and the repository being outside version control means there is currently no way to review or roll back the fixes.

---

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | `save()` has no failure path; rejected writes are silently lost | CODE-01 | Critical | P0 | S | PREREQ-A |
| WORK-02 | Corrupt stored JSON is swallowed, then overwritten by the next write | CODE-02 | High | P1 | S | WORK-01 |
| WORK-03 | Rendering destructively rewrites stored planned-expense dates | CODE-03 | High | P1 | M | WORK-17 |
| WORK-04 | `validateImport()` validates containers but not records | CODE-04 | High | P1 | S | — |
| WORK-05 | Cloud sync overwrites the whole document last-write-wins | CODE-05 | High | P1 | M | Conflict C1 |
| WORK-06 | Interactive targets across the app are below the mandated 44×44 px | UI-01 | High | P1 | S | — |
| WORK-07 | Amounts, group tags and chart labels fail WCAG AA contrast | UI-02 | High | P1 | M | — |
| WORK-08 | No form input in the application is programmatically labelled | UI-03 | High | P1 | S | — |
| WORK-09 | Core interactions cannot be reached or operated by keyboard | UI-04 | High | P1 | M | — |
| WORK-10 | New entries silently disappear when their date falls outside the active filter | UI-06 | High | P1 | S | — |
| WORK-11 | Salary Calculator is unusable without prior payroll knowledge | UI-07 | High | P1 | S | — |
| WORK-12 | Settings ships a non-functional Cloud Sync feature with developer instructions | UI-08 | High | P1 | S | Conflict C1 |
| WORK-13 | Two of the eight core modules do not exist in the interface | UI-05 | High | P2 | XL | Conflict C3 |
| WORK-14 | Cloud sync failures are invisible and the UI shows a stale success state | UI-20, CODE-06 | Medium | P2 | XS | — |
| WORK-15 | Category `group` is interpolated into HTML without escaping (stored XSS) | CODE-07 | Medium | P2 | XS | pairs with WORK-04 |
| WORK-16 | Settings merge order discards the notification defaults it just built | CODE-08 | Medium | P2 | XS | WORK-17 |
| WORK-17 | No schema version and no migration framework | CODE-09 | Medium | P2 | S | WORK-01 |
| WORK-18 | Service worker is network-first for the app shell, contradicting offline-first | CODE-10 | Medium | P2 | S | — |
| WORK-19 | No module boundaries; the UI layer reads and persists storage directly | CODE-11 | Medium | P2 | XL | PREREQ-A, WORK-01 |
| WORK-20 | `analyzeExpenses()` is a 328-line function holding 24 unrelated rules | CODE-12 | Medium | P2 | M | — |
| WORK-21 | Recurrence stepping is implemented four times | CODE-13 | Medium | P2 | S | WORK-03 |
| WORK-22 | Drag-to-reorder is copied wholesale for categories and income types | CODE-14 | Medium | P2 | S | — |
| WORK-23 | Daily, calendar and trend charts re-scan the full transaction list per day/month | CODE-15 | Medium | P2 | M | — |
| WORK-24 | Projected planned occurrences appear in the chart but not in Day Details | CODE-16 | Medium | P2 | S | WORK-03 |
| WORK-25 | Dead persisted fields and one mislabeled setting | CODE-17 | Medium | P2 | XS | WORK-17 |
| WORK-26 | Modals are not accessible dialogs | UI-09 | Medium | P2 | M | co-schedule WORK-09 |
| WORK-27 | Status messages and screen changes are never announced | UI-10 | Medium | P2 | XS | — |
| WORK-28 | Validation errors appear only as a transient toast far from the field | UI-11 | Medium | P2 | S | — |
| WORK-29 | Header reserves the top safe-area inset at its bottom | UI-12 | Medium | P2 | XS | — |
| WORK-30 | Dashboard KPI labels do not say what they measure | UI-13 | Medium | P2 | XS | — |
| WORK-31 | Advisor card outranks the user's own data and nags on a fresh install | UI-14 | Medium | P2 | S | — |
| WORK-32 | Currency figures can break in the middle of a number | UI-15 | Medium | P2 | XS | — |
| WORK-33 | Negative amounts render as "₮-5,000"; a deficit looks identical to a surplus | UI-16 | Medium | P2 | XS | — |
| WORK-34 | Category colours repeat after twelve and are the only key in the stacked chart | UI-17 | Medium | P2 | S | — |
| WORK-35 | Income and Salary Calculator are two taps deep with no back affordance | UI-18 | Medium | P2 | M | Conflict C3 |
| WORK-36 | Placeholder text fails AA contrast in every theme | UI-19 | Medium | P2 | S | — |
| WORK-37 | Group colours and status colours collide and change meaning between themes | UI-21 | Medium | P2 | M | WORK-07 |
| WORK-38 | Salary-derived income is stored as a floating-point amount | CODE-18 | Low | P3 | XS | — |
| WORK-39 | Salary deduction percentages unvalidated; failure message is wrong | CODE-19 | Low | P3 | XS | pairs with WORK-28 |
| WORK-40 | `drawPvA()` aggregates by category name instead of id | CODE-20 | Low | P3 | XS | — |
| WORK-41 | `wireIconGrid()` adds a permanent document listener on every modal open | CODE-21 | Low | P3 | S | — |
| WORK-42 | Advisor mixes period-filtered and all-time data in the same tip list | CODE-22 | Low | P3 | S | WORK-20 |
| WORK-43 | The import `FileReader` has no error handler | CODE-23 | Low | P3 | XS | — |
| WORK-44 | Two different empty-state treatments | UI-25 | Low | P3 | XS | — |
| WORK-45 | Dates shown as raw ISO strings in most places, long-form in one | UI-26 | Low | P3 | S | — |
| WORK-46 | A tab button's accessible name differs from its visible label | UI-27 | Low | P3 | XS | — |
| WORK-47 | `role="tablist"` applied without the rest of the tab pattern | UI-28 | Low | P3 | XS | — |
| WORK-48 | PWA install: dark splash against a light app; maskable icon outside safe zone | UI-29 | Low | P3 | XS | — |
| WORK-49 | Long unbroken note text can push list rows past the viewport | UI-30 | Low | P3 | XS | — |
| WORK-50 | Declared design-token scales are not enforced (type, spacing, radius, inline styles) | UI-22, UI-23, UI-24, CODE-24 | Low | P3 | L | PREREQ-A, WORK-07, WORK-36, WORK-37 |

**PREREQ-A — Put the repository under version control.** Not a numbered finding. Sourced from Code Review → Technical Debt → "No version control". Effort XS. The code reviewer calls it "the cheapest debt on the list to retire and it multiplies the cost of every other item", and makes it an explicit precondition for the file split. I am not assigning it a `WORK-` ID because neither reviewer raised it as a finding, but it is scheduled first in Sprint 1 and no roadmap item after WORK-01 should start without it.

---

## Quick Wins

XS or S effort, Medium severity or higher. Do these first **inside their priority band** — a cheap fix does not jump the band.

**Inside P0/P1**
- WORK-01 (S, Critical) — a `try`/`catch` and a visible failure banner around one function. Highest value per line changed in the codebase.
- WORK-02 (S) — quarantine the unparsed blob to a side key before falling back.
- WORK-04 (S) — ~40 lines of per-record shape validation at the only place untrusted data enters.
- WORK-08 (S) — adding `for=` to 67 labels is mechanical, needs no design input, unblocks screen-reader use of every form.
- WORK-06 (S) — CSS-only size increases on eight selectors bring the app in line with its own 44 px rule.
- WORK-10 (S) — one range check after add stops entries vanishing and prevents the duplicate-planned-expense loop.
- WORK-12 (S) — hiding one Settings card removes a developer-facing feature from a consumer product.
- WORK-11 (S) — expanding "SI"/"WHT" and annotating three defaults makes a core module self-explanatory.

**Inside P2**
- WORK-14 (XS) — four lines in an existing catch block stop the app claiming a backup succeeded when it failed. Both reviewers raised it independently.
- WORK-15 (XS) — four `escapeHTML()` wraps close a stored-XSS path.
- WORK-16 (XS) — move one spread above one key; restores the notification defaults mechanism.
- WORK-25 (XS) — delete two dead persisted fields and relabel one misleading checkbox.
- WORK-29 (XS) — one value in a CSS shorthand removes a ~47 px dead band from every screen on every notched iPhone.
- WORK-30 (XS) — renaming two KPI labels removes the app's most alarming misreading.
- WORK-32 (XS), WORK-33 (XS) — stop currency splitting mid-digit; put the minus sign in front of the symbol.
- WORK-27 (XS) — two attributes make every success and error message audible.

---

## Sprint Plan — Sprint 1

**Theme: make the data safe, and make the repository reviewable.**

Assumption: one engineer, ten working days, roughly 65% of capacity on planned work. If two engineers are available, pull WORK-03 and WORK-21 forward from Sprint 2 — not anything else.

| Item | Effort |
|---|---|
| PREREQ-A — version control | XS |
| WORK-01 — guarded write + visible failure banner | S |
| WORK-02 — corrupt-blob quarantine | S |
| WORK-17 — `schemaVersion` + ordered migration list | S |
| WORK-16 — settings merge order (same `load()` edit as WORK-17) | XS |
| WORK-25 — dead fields + mislabeled checkbox (same edit) | XS |
| WORK-04 — per-record import validation | S |
| WORK-15 — escape `group` at all four sites, constrain on load | XS |
| WORK-12 — hide unconfigured Cloud Sync card | S |
| WORK-14 — surface sync failure instead of stale success | XS |
| WORK-08 — associate 67 labels with their inputs | S |
| WORK-06 — 44×44 touch targets | S |
| WORK-10 — warn when a new entry falls outside the active filter | S |
| WORK-29, WORK-30, WORK-32, WORK-33 — dashboard and formatting quick wins | XS ×4 |

**Total: 7 × S, 9 × XS, plus PREREQ-A ≈ 4.5 engineer-days of implementation, ≈ 7 days with review and regression testing.**

**What the sprint delivers:** the application stops losing data silently. A failed write is visible, a corrupt store is preserved rather than overwritten, a bad backup is rejected before it is persisted, and there is finally a schema version to migrate from and a git history to roll back to. Alongside that, the two highest-frequency UI defects are gone — every form field is labelled for assistive technology, Edit and Delete are no longer 40 px targets 4 px apart, and adding next month's rent no longer looks like a failed save. The Cloud Sync card stops asking non-technical users to edit `index.html`.

This sprint does **not** close the release gate on its own. WORK-03, WORK-05, WORK-07 and WORK-09 remain open High findings after it.

---

## Roadmap

**Sprint 1** — PREREQ-A, WORK-01, WORK-02, WORK-04, WORK-06, WORK-08, WORK-10, WORK-12, WORK-14, WORK-15, WORK-16, WORK-17, WORK-25, WORK-29, WORK-30, WORK-32, WORK-33

**Sprint 2** — WORK-03, WORK-05, WORK-07, WORK-11, WORK-21, WORK-24, WORK-27, WORK-36

**Sprint 3** — WORK-09, WORK-18, WORK-20, WORK-23, WORK-26, WORK-28, WORK-31

**Later** — WORK-13, WORK-19, WORK-22, WORK-34, WORK-35, WORK-37, WORK-38, WORK-39, WORK-40, WORK-41, WORK-42, WORK-43, WORK-44, WORK-45, WORK-46, WORK-47, WORK-48, WORK-49, WORK-50

"Later" is not "never". WORK-13 and WORK-19 are the two XL items and are both blocked on a decision, not on capacity — they will consume roughly a third of the total remaining effort once unblocked and need to be scheduled explicitly, not absorbed.

---

## Dependencies

**PREREQ-A → everything structural.** WORK-19 (file split) is explicitly gated on version control by the code reviewer, "so the split is reviewable as a diff". WORK-50 is a large mechanical diff for the same reason. In practice nothing after WORK-01 should be edited in a 5,522-line file with no history.

**WORK-01 → WORK-02, WORK-17, WORK-19.** The guarded write introduces the `store` seam. The corrupt-blob quarantine (WORK-02) belongs inside the same object, the migration list (WORK-17) hangs off the same `load()` path, and the seam is the boundary WORK-19 needs in order to forbid `save()` from render functions.

**WORK-17 → WORK-03, WORK-16, WORK-25.** This is a sequencing point I have changed from the code reviewer's own recommended order, and it should be confirmed. The code reviewer's refactoring list puts recurrence modelling (step 2) before `schemaVersion` (step 4), but CODE-09 itself says to add the version "before any further data-shape change" — and WORK-03 changes the persisted recurrence shape by turning `p.date` into an immutable anchor plus an optional `lastConvertedDate`. I have therefore scheduled WORK-17 first. If WORK-03 can be implemented purely additively and backward compatibly, the order can be relaxed; if not, WORK-17 must land first or the first breaking change hits with no version to branch on.

**WORK-03 → WORK-21, WORK-24.** Once the anchor date stops being mutated, the single `stepDate()` helper (WORK-21) falls out of the rework as a by-product, and Day Details can call `expandPlannedInRange()` (WORK-24). Doing WORK-24 before WORK-03 would layer a fix on top of a model that still destroys history.

**WORK-04 pairs with WORK-15.** Both harden the import boundary. WORK-04 rejects malformed records; WORK-15 constrains `group` to the three known values on the import and cloud-load paths and escapes it at the four render sites. Do them in one edit.

**WORK-07 → WORK-37 → WORK-50.** WORK-07 adds accessible text-only variants of the status colours. WORK-37 then redefines the Needs/Wants/Savings palette once at `:root` so it no longer collides with status colours — and must preserve the AA ratios WORK-07 established. WORK-50 snaps every remaining off-scale value to tokens, which is only worth doing once the token set itself has stopped moving. Running WORK-37 first would force WORK-07's contrast measurements to be redone.

**WORK-09 co-schedules with WORK-26.** Keyboard reachability and modal focus management are the same body of work in the same code paths; splitting them across sprints means touching the modal open/close helpers twice.

**WORK-20 → WORK-42.** Scoping three advisor rules to the selected date range is a small change once the function is an array of pure rules, and a risky one inside a 328-line function. **WORK-31 should land before WORK-20**, since gating three rules and reordering one card is a targeted S-effort change, and WORK-20 is explicitly a no-behaviour-change refactor that must then preserve it.

**WORK-28 pairs with WORK-39.** WORK-28 extends the existing `.invalid` + `focus()` pattern to every validation branch; WORK-39 is one more branch (salary percentages) plus a corrected message. Free if done together.

**WORK-12 and WORK-05 are coupled through Conflict C1.** If the Cloud Sync card is hidden when unconfigured, WORK-05 is unreachable in the shipped build and its priority changes. Do not start WORK-05 before C1 is ruled on.

**WORK-13 and WORK-35 are both blocked on Conflict C3.** Neither the missing modules nor the tab-set change should be built before the brief is reconciled. The UI reviewer is explicit: "Do not build anything before the brief is reconciled."

---

## Conflicts

These are recorded for the Chief Architect. I have not resolved them.

**C1 — Cloud Sync: remove it, or repair it?**

- *UI Review (UI-08, High):* when `isFirebaseConfigured()` is false, hide the Cloud Sync card entirely and move the setup guide into repository documentation. The card promises the app's most valuable feature to 100,000 non-technical users and then instructs them to open `index.html` in a text editor; the Backup &amp; Restore card below already gives a real, working answer to the same problem.
- *Code Review (CODE-05 High, CODE-06 Medium, plus Technical Debt):* treats cloud sync as a feature to be corrected — read `updatedAt` before `set()` and prompt on conflict, set a `lastSyncError` flag and render it. Separately flags the module as "neither a working feature nor absent — it is a half-feature that must be maintained", and notes `knowledge/project.md` carries Cloud Sync as a roadmap item.
- *What is at stake:* if the card is hidden, WORK-05 fixes code no shipped user can reach, and ~170 lines plus a Settings card become dead weight carried through every future change. If the card stays, WORK-12 is not done and the consumer-facing problem remains. A third option — ship a configured Firebase project — was proposed by neither reviewer and would be a new decision.

**C2 — Is there a release blocker? The two reports disagree on the presence of Critical severity.**

- *UI Review:* "None. No finding in this review causes data loss, produces a wrong financial figure, or makes the app unusable." Score 66/100, band "usable but fragile".
- *Code Review:* CODE-01 is Critical — unsignalled data loss on any storage write failure, which occurs unconditionally in Safari private browsing and on quota exhaustion. Score 58/100, "significant rework needed before release".
- *What is at stake:* these are not strictly contradictory — the UI reviewer assessed observable behaviour and the failure is by definition invisible — but they produce opposite release recommendations. Note also that CODE-03 does produce wrong financial figures on screen (Planned ₮0 for any past range with recurring plans), which the UI reviewer did not observe. Someone must state the release gate. My working assumption in this plan is that CODE-01 and CODE-03 block release; that assumption is mine, not a reviewer's, and needs ratifying.

**C3 — Which document is authoritative, the shipped app or `knowledge/project.md`?**

- *UI Review (UI-05, High, XL):* the brief and the product have silently diverged. `project.md` names Budget Planning, Analytics and Reports; none exist. Recommends either amending `project.md` to describe the shipped module set, or scheduling the two genuinely missing modules — and explicitly says not to build anything until this is settled.
- *Code Review:* repeatedly sizes technical debt *against* `project.md` as written. CODE-09 states the absent schema contract "directly blocks the Cloud Sync, Debt Planner, Savings Planner and Investment Tracker items in `knowledge/project.md`"; the recurrence-model debt is justified by "Debt Planner, Savings Planner and any Reports module in `knowledge/project.md` will all need historical planned figures"; the Future Risks section prices AI Budget Assistant, Debt Planner, Savings Planner, Investment Tracker and OCR into the architecture argument.
- *What is at stake:* if the brief is trimmed to match what shipped, part of the urgency behind WORK-17 and WORK-19 falls away and WORK-13 disappears. If the brief stands, WORK-13 is a committed XL build and the architectural debt is understated rather than overstated. WORK-35 (promoting Income into the tab bar) sits on the same ruling. This is the single decision that most changes the shape of the roadmap.

---

## Estimated Effort

Nominal conversion: XS = 0.25 d, S = 0.5 d, M = 1.5 d, L = 4 d, XL = 8 d. XL items are, by the shared definition, "more than a week, or needs a design decision first" — both XL items here are the latter, so their estimate is a placeholder until the decision is made.

| Priority | Items | Effort mix | Nominal engineer-days |
|---|---|---|---|
| P0 | 1 | 1 × S | ≈ 0.5 |
| P1 | 11 | 7 × S, 4 × M | ≈ 9.5 |
| P2 | 25 | 9 × XS, 9 × S, 5 × M, 2 × XL | ≈ 30.25 (16 of which are the two XL items) |
| P3 | 13 | 9 × XS, 3 × S, 1 × L | ≈ 7.75 |
| **Total** | **50** | | **≈ 48 engineer-days** |

Excluding the two XL items pending decision, the executable backlog is ≈ 32 engineer-days, roughly three sprints for one engineer. P0 + P1 — the work that must close before release — is ≈ 10 engineer-days.

---

## Recommendations

Put the repository under version control this week. It is a twenty-minute task that neither reviewer raised as a numbered finding, and every other item on this list is more expensive and less reversible without it.

Rule on C1 and C3 before Sprint 2 planning. C1 decides whether WORK-05 is a High-priority fix or dead code, and C3 decides whether WORK-13 is an XL commitment or a documentation edit — together they move roughly 16 of the 48 estimated days. I have scheduled around both, but the plan stays provisional until you rule.

Accept the code reviewer's dependency-ordered refactoring sequence with one change. Their steps 1 through 4 are additive, local and backward compatible, and they retire the Critical and all four High code findings. My one deviation is moving `schemaVersion` (WORK-17) ahead of the recurrence rework (WORK-03), because WORK-03 changes the persisted shape and CODE-09 says the version must exist before any such change. Please confirm or overrule that ordering.

Do not let the accessibility work slip past Sprint 3. Six of the eight UI High findings and five Mediums are accessibility, and three of them — WORK-08, WORK-06, WORK-27 — are XS or S with no dependencies. They are cheap, they are already scheduled early, and they are the easiest items to quietly drop when the data-layer work overruns. WORK-09 and WORK-26 are the ones genuinely at risk.

Finally, note that C2 means nobody has yet said out loud whether this app is releasable. My reading is that it is not, until WORK-01 through WORK-12 are closed. That call is yours, not mine.
