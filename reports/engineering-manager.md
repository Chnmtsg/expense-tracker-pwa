# Engineering Manager — Work Plan, Round 7

**Sources merged, read in full and unmodified:**
- `D:\3_Claude\PowerApps\reports\ui-review.md` — 7 findings, 90/100, no Critical, no High
- `D:\3_Claude\PowerApps\reports\code-review.md` — 11 findings, 78/100, one High, no Critical

**Also read before scheduling:** `D:\3_Claude\PowerApps\knowledge\review-conventions.md`, `D:\3_Claude\PowerApps\knowledge\project.md`, `D:\3_Claude\PowerApps\reports\chief-architect.md` (round-6 standing decision), `D:\3_Claude\PowerApps\reports\HANDOFF.md`.

Both reports are present and non-empty. 18 findings in, 17 `WORK-` items out — one merge, no drops, no invented items. Numbering continues from the round-6 roadmap, which ended at WORK-110.

---

## Project Health

Two reviewers working in parallel both confirm that round 6's batch is genuinely on disk — including the three PNG icons, which both opened as images rather than inferring from commit messages — so the completion-record failure that dominated the last two rounds did not recur. Against that, Code Review raises the first High in three rounds: after a boot-time throw the data-error banner's "Restore from file" opens a picker and does nothing, and `boot-crash.js` — the probe added in round 6 to guard precisely that state — asserts the button is *visible* rather than *functional*, so it passes. The 90/78 spread is honest and not a disagreement: the UI is in good shape and the defect sits in a recovery path and in the evidence layer beneath it, which is the same axis this project has been closing for four rounds. The build the round-6 decision called releasable now has a documented total-loss-of-function in its recovery route, and the guard written to watch it cannot see it — whether that reopens a gate is the Chief Architect's call, not mine.

---

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-111 | "Restore from file" is inert after a boot-time throw; make `load()` incapable of throwing and re-express the probe | CODE-01 | High | P1 | S | WORK-112, WORK-113, WORK-114 |
| WORK-112 | `boot-crash.js` reports a console-error count from a list nothing writes to | CODE-04 | Medium | P2 | XS | — |
| WORK-113 | `npm run v1`'s four write flows record eight values and assert none | CODE-02 | Medium | P2 | S | — |
| WORK-114 | `run.mjs --width` exits 0 on a probe that never reported; `THREW` scan is not recursive | CODE-03 | Medium | P2 | XS | — |
| WORK-115 | Planned vs Actual keys rows by category name, merging two categories WORK-103 was narrowed to permit | UI-02, CODE-05 | Medium | P2 | S | — |
| WORK-116 | Planned vs Actual per-row variance is carried by sign and colour only | UI-03 | Medium | P2 | XS | WORK-115 |
| WORK-117 | `.chip.off` uses `opacity` over text; off-chip amount is 2.73:1 in the default theme and unmeasurable by the pair table | UI-01 | Medium | P2 | XS | Ruling on C22 |
| WORK-118 | Analytics calendar anchors on the range start, hiding today for six of the nine presets | UI-05 | Medium | P2 | XS | Ruling on C26 |
| WORK-119 | Three Settings inline-editor controls have no accessible name | UI-04 | Medium | P2 | XS | — |
| WORK-120 | The header's bottom padding carries the top safe-area inset | CODE-07 | Medium | P2 | XS | — |
| WORK-121 | README ships four files; the app needs eight, and following it undoes WORK-93 | CODE-06 | Medium | P2 | XS | — |
| WORK-122 | `saveEditIType()` has no duplicate-name check, so renaming routes around `incomeTypeAdd`'s | CODE-08 | Low | P3 | XS | — |
| WORK-123 | `goalProblem()` does not validate `createdDate`, silently disabling an advisor rule | CODE-09 | Low | P3 | XS | — |
| WORK-124 | The fixture's four expected totals are the only cross-screen recurrence assertions and no command evaluates them | CODE-10 | Low | P3 | S | Ruling on C25 |
| WORK-125 | Stale round-1 review reports ship inside `expense-pwa/` | CODE-11 | Low | P3 | XS | — |
| WORK-126 | Goal icon picker is 41.6×41.6px at 320px; its comment's two figures reproduce from neither container | UI-06 | Low | P3 | XS | — |
| WORK-127 | The `.cal-grid` measurement table does not say which of the two grids it measured | UI-07 | Low | P3 | XS | — |

**Severity is untouched.** Every severity above is the raising reviewer's. Priority, effort and sequence are mine.

**Note on WORK-115's effort.** The two reports independently estimated the same change at S (UI-02) and XS (CODE-05). I scheduled S, because the smallest *safe* implementation also needs a sentinel key for entries whose category was deleted — which UI-02 names and CODE-05 does not — plus the comment correction both reports demand. That is an effort divergence, not a severity or fix-shape disagreement, so it is not escalated.

**Corroboration, stated explicitly.** Three convergences between reports that never saw each other:

1. **WORK-115 (UI-02 / CODE-05)** — same defect, same location, same recommended fix (key by `x.categoryId`, carry `name` and `group` as row fields), and both independently noticed that the WORK-103 justification comment at `index.html:4977-4980` states a *split* where the code *merges*. Two reviewers reaching the same false comment from opposite directions is the strongest evidence in the round.
2. **Round 6's batch is on disk** — both reports re-derived the same set (`.hero-kpi::before` deleted, the merged pair rows, `.kpi .value`'s wrap guard, `.helper` at `--t-sm`, `fatalReported` in the per-load reset set) and both opened all three PNGs rather than trusting a commit. Round 6's central failure did not repeat.
3. **The evidence layer is the standing risk** — UI-01 reaches it through "structurally unmeasurable by the project's own predicate" and CODE-02/03/04 through "cannot fail on a wrong value". Different mechanisms, one shape, found independently.

---

## Quick Wins

Every Medium and the single High in this round is XS or S. That is worth saying plainly: **effort is not the constraint this round — sequencing and evidence are.** Listed in the order they should be taken inside their priority bands.

| Item | Why it is a quick win |
|---|---|
| WORK-114 | Two guards and one recursion in one existing file; closes the runner hole that would otherwise let WORK-97(b)'s deferred measurement return green on nothing. |
| WORK-112 | Delete two assignments and one field, or add three lines; stops a payload implying a check that structurally cannot fail. |
| WORK-113 | Eight `if (...) throw` lines inside flows that already run, in the style the corrupt-boot walk already uses. No new file. |
| WORK-111 | One brace move plus a re-expressed setup check. S effort against a High that silently destroys the recovery route. |
| WORK-117 | One declaration swapped for two token declarations; the state moves from unmeasurable to covered by two pair rows that already exist. No new pair row. |
| WORK-118 | One small block at a site that already exists; restores the property WORK-95 was approved to establish for the six presets it misses. |
| WORK-116 | Two template strings, borrowing vocabulary the same card prints eighteen lines below. |
| WORK-119 | Three `aria-label` attributes matching a pattern already in the file; closes the app's only unlabelled controls. |
| WORK-120 | One padding declaration replaces two, removing ~47–59px of unintended header height in the installed PWA the app itself recommends. |
| WORK-121 | Table and step 3 name the deployable set once; stops the app's own instructions from undoing WORK-93. |
| WORK-115 | One key change plus two row fields; makes the Dashboard agree with Analytics about a configuration the app permits. |

---

## Sprint Plan — Sprint 1 only

**Items:** WORK-114, WORK-112, WORK-113, WORK-111.
**Total effort:** 2 XS + 2 S — roughly one engineering day of edits, plus the red-then-green demonstrations, which are the larger half of the cost.

**What the sprint delivers.** The command that underwrites every completion claim in this project becomes able to say no to a wrong *value*, not only to a throw. The runner stops returning green in width mode for a probe that measured nothing, and stops hiding a `THREW` inside a nested result. The boot-crash probe stops reporting a console-error field that nothing can ever populate. And with those three in place, `load()` is made incapable of throwing, so a structurally invalid blob takes the quarantine path it was written for and every recovery control — including "Restore from file" — is wired in the one state the data-error banner exists for.

**This sprint is deliberately short.** WORK-111 changes the boot path, inverts `boot-crash.js:57-59`'s setup assertion, and touches the premise of `v1-write-flows.js`'s corrupt-boot walk. This project has twice paid for batching cheap work around an edit of that shape, and the round-6 decision's one-item gate is the reason its two riskiest edits landed clean. I am not adding the seven user-facing Mediums to this sprint however cheap they look. If the Chief Architect opens a gate on WORK-111, Sprint 1 becomes the gate plus its three preconditions and everything below moves down one sprint.

---

## Roadmap

| Sprint | Items |
|---|---|
| **Sprint 1** | WORK-114, WORK-112, WORK-113, WORK-111 |
| **Sprint 2** | WORK-115, WORK-116, WORK-117, WORK-118, WORK-119, WORK-120, WORK-121 |
| **Sprint 3** | WORK-122, WORK-123, WORK-125, WORK-126, WORK-127, WORK-124 |
| **Later** | No new items. The standing deferrals carry forward unchanged: WORK-97(b), WORK-85, WORK-35, WORK-16/49, WORK-15, WORK-17 (IndexedDB half), WORK-23 (screen half), WORK-30, WORK-31, Stage 2. |

Nothing in either report presents evidence that fires a deferral's trigger. Code Review states outright that it found no calculation defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences` and took no performance measurement — **the Stage 2 trigger did not fire for the sixth round running**, and WORK-16/49 was explicitly not re-raised. WORK-127 offers new *evidence* to the WORK-97(b) deferral (the date picker's mis-tap risk is confined to 320px) and explicitly does not re-raise it; I have scheduled it as the Low it was raised as and left the deferral closed.

---

## Dependencies

1. **WORK-114 and WORK-113 before WORK-111.** The standing rule from round 6 is *land tooling before the fix it will verify, and demonstrate a new assertion red before you trust it green*. WORK-111's demonstration runs through `run.mjs`, and WORK-114 closes the hole that lets a probe report nothing and still exit 0. Separately, WORK-111 changes what `load()` does with a structurally invalid blob — which is exactly the premise of `v1-write-flows.js`'s corrupt-boot walk. Those assertions should exist and be trusted before that premise moves.
2. **WORK-112 immediately before WORK-111.** Same file (`tools/harness/boot-crash.js`). WORK-111 must re-express the setup check because `A_init_completed` inverts once `load()` stops throwing; doing that inside a probe that still carries a field nothing writes to invites the next reader to trust the wrong thing. Two commits, one pass, dead field removed first.
3. **WORK-111 re-runs `npm run v1` and `boot-crash.js` as part of its own close.** Code Review names the consequence but not the replacement: after the fix, the residual class — any throw elsewhere in the top-level run — needs a different injection. That injection is part of WORK-111's scope, not a follow-up.
4. **WORK-115 before WORK-116.** Both edit `drawPvA`'s row construction and render. Keying by `categoryId` first, so the variance wording lands on the final row shape. Two commits, one pass.
5. **WORK-114 before any WORK-97(b) measurement is taken.** The deferral names its own settling condition as a width-mode probe reporting `.cal-cell` widths at four viewports — the exact mode CODE-03 shows can return green on a probe that measured nothing, reporting a nested result the `THREW` scan does not descend into. The calendar comment's numbers have been wrong twice from arithmetic alone; a third attempt should not rest on an unverified runner. This is recorded so the deferral is not settled before WORK-114 lands.
6. **WORK-126 and WORK-127 feed WORK-97(b), and block nothing.** WORK-127 supplies the `#dpGrid` derivation the deferral did not have, which narrows what the deferred decision must settle.
7. **WORK-124 is gated on a ruling, not on other work.** See C25.
8. **WORK-117's code change is not gated; the convention amendment it implies is.** The recommended fix uses two pair rows that already exist in `check-contrast.mjs`, so it can land without a ruling. Whether the standing "unmeasurable fill may not paint over text" exclusion is widened to cover `opacity` over text is the architect's, and is the more durable half. See C22.

---

## Conflicts

Five items for the Chief Architect. Two are disagreements about scope between a report and a standing ruling; three are places where a report proposes something the standing decision's wording does not settle. Where the two reviewers overlap they agree, so there is no reviewer-versus-reviewer conflict of fact or severity this round. I state both positions and pick no winner.

### C22 — Does the "unmeasurable fill may not paint over text" exclusion reach `opacity`?

- **UI Review (UI-01):** `opacity` on a text-bearing element composites background *and* glyphs toward the ground, so the effective pair is expressible as neither `text/surface-2` nor `text/surface`, and `check-contrast.mjs`'s `over` mechanism (`:209-243`) composites the background only. `.chip.off` therefore sits at **2.73:1** on its amount in the default theme with the predicate reporting nothing. This is the same *class* the round-6 exclusion closed for `rgba()` fills, in a mechanism the exclusion's wording does not currently name.
- **The standing decision (round 6, change 4; ruling under C16):** the exclusion is written as *"a fill under text that is not expressible as a token cannot be measured, and therefore may not paint over text"*, with `.hero-kpi` carrying the worked example. It addresses a *fill*. It does not address a compositing operation applied to the element itself.
- **What needs ruling:** whether the convention is amended to cover any unmeasurable compositing over text (opacity included), or whether `.chip.off` is treated as a one-off. The code fix is XS either way and needs no new pair row.

### C23 — CODE-01 against gate R5's closing record and against WORK-99's approval

- **Code Review (CODE-01, High):** the recovery control the whole persistence design rests on is inert in the one state it exists for, and `boot-crash.js:52-53` — added in round 6 to guard that state — asserts `offsetParent !== null`, which is visibility, not function. It passes. This is the presence-is-not-sufficiency distinction the architect drew himself in ruling C17, now sitting inside the project's own boot-crash guard. WORK-99 moved the *reporting* above `load()` and left the *recovery* below it.
- **The standing decision:** gate R5 closed on a red-then-green demonstration, "the build is releasable", and WORK-99 was approved on the basis that moving the three declarations "changes no behaviour". The demonstration performed was of the corrupt-quarantine path (`if (dataWasCorrupt) return;` reverted, `v1` red; restored, green) — not of the *throw* path CODE-01 describes.
- **What needs ruling:** whether a High against the recovery route reopens a gate, and whether CODE-01's recommended fix is accepted in the shape offered. Note that the fix makes `load()` incapable of throwing, which removes the state WORK-99 was approved to cover and inverts the round-6 probe's setup assertion — the report names that cost honestly and does not fully specify the replacement injection. I have scheduled that specification inside WORK-111 rather than as a separate item; if the architect wants it separated, it splits cleanly.

### C24 — CODE-03 against the WORK-97(b) deferral's settling condition

- **Code Review (CODE-03, Medium):** width mode falls back to a literal `{}` after a fixed 1800ms, which parses, contains no `THREW`, and reports no console-error field — so the runner prints `{}` and exits 0. The `THREW` scan also does not descend into nested objects, so a result table keyed by width would hide one.
- **The standing deferral (WORK-97(b)):** names as its settling condition "a harness probe reporting `.cal-cell` `getBoundingClientRect().width` at 320, 360, 375 and 390px, for the current rule and for the padding-zero variant" — a width-mode probe returning a nested, width-keyed result. The deferral's own text says `tools/harness/` "exists for exactly this; this is the item that makes it earn its keep."
- **What needs ruling:** nothing about the fix, which is uncontested and XS. What needs recording is the ordering constraint — that the deferral cannot be settled before WORK-114 lands, or the fourth number in that comment will be as unverified as the first three.

### C25 — CODE-10's recommended probe against the four-plus-one tool ceiling

- **Code Review (CODE-10, Low):** recommends "one probe in `tools/harness/` that calls `loadFixture()`, walks `RANGES`, and throws when a computed total or plan count disagrees — assertions inside the existing render harness, **adding no sixth executable**." The four fixture totals (290,000 / 360,000 / 260,000 / 50,000) currently exist as data with no runner, and `HANDOFF.md:88-91` instructs the next engineer to "run that after any change to recurrence, filtering or the dashboard" — an instruction that cannot be followed.
- **The standing decision (change 3, and the Architecture Strategy):** "four static predicates behind `verify`, plus one render harness. New assertions go *inside* one of those five. There is no sixth thing this quarter." `HANDOFF.md:69-72` repeats it.
- **What needs ruling:** whether a new probe *file* under `tools/harness/`, executed by the existing `run.mjs`, is "inside" the harness or is a sixth thing. The wording does not settle it, and the two readings give opposite answers for the one artifact that would guard the recurrence engine — the part of the app with the longest defect history and, per the Stage 2 deferral, the part whose trigger is a calculation defect no command would currently surface. WORK-113's fix is unaffected either way; it stays inside an existing file.

### C26 — UI-05 against WORK-95's approved shape

- **UI Review (UI-05, Medium):** `calDate` is set from the range's *start*, so with today at 2026-08-03 "Last 30 Days" opens the heatmap on July and drops today and its `.today` highlight; "Last 90 Days" lands on May, "This Year" on January. Six of the nine presets. The stat strip above continues to describe the whole range, so "Peak day" can again name a date the calendar below is not showing — which is the defect WORK-95 was approved to remove. Recommends anchoring on today clamped into the range.
- **The standing decision (WORK-95 approval):** *"Approved in the reviewer's shape: sync `calDate` on preset change only, so the ◀/▶ arrows keep working. All-Time leaves it alone."* The approval named *when* to sync and did not name *what to anchor on*.
- **What needs ruling:** whether this is a defect inside the approved shape — in which case it is an XS fix and no re-approval is needed — or a behavioural revision to an item ruled on last round, which changes which month opens on six presets and should be re-stated rather than absorbed. Both readings are available from the approval's text.

**One shape decision inside an item, recorded here so it is not lost.** WORK-112 (CODE-04) offers two fixes: install the three-line console recorder that `v1-write-flows.js:17-20` uses, or delete the `consoleErrors` field and both `H_unexpected_console_errors` assignments. The reviewer recommends the second as "smaller and honest". The first adds a new assertion and would itself need a red-then-green demonstration under the round-6 rule. Either satisfies the finding; the choice is the architect's.

---

## Estimated Effort

| Band | Items | Breakdown | Approximate total |
|---|---|---|---|
| **P0** | none | — | — |
| **P1** | WORK-111 | 1 × S | ~0.5 day, plus demonstrations |
| **P2** | WORK-112 … WORK-121 (10 items) | 2 × S, 8 × XS | ~1.4 days |
| **P3** | WORK-122 … WORK-127 (6 items) | 1 × S, 5 × XS | ~0.7 day |
| **Total** | 17 items | 4 × S, 13 × XS | **~2.7 engineering days** |

No item exceeds S. No item requires a rewrite, a new dependency, a sixth executable (subject to C25), or any change to the single-file constraint. This is the same order of magnitude as the round-6 batch. The demonstrations — red-then-green for every new assertion in WORK-111, WORK-112, WORK-113, WORK-114 and WORK-124 — are not in the effort figures above and will take longer than the edits.

---

## Recommendations

**CODE-01 is the round, and the probe matters more than the defect.** A boot-time throw leaves "Restore from file" opening a picker and doing nothing, deterministically on every reload, in the one state the banner exists for — the user's remaining move is to clear site storage, which destroys the history quarantine was built to preserve. That is bad. What is worse is that `boot-crash.js`, added last round to guard exactly that state, asserts `offsetParent !== null` and passes. Round 6's lesson was *prove the machine can say no*; this is the same lesson one level in — the machine can say no, and it is asking the wrong question.

**If you gate, gate on WORK-111, and put its three preconditions inside the gate rather than before it.** The fix inverts `A_init_completed`, so the round-6 probe must be re-expressed against a residual class the report does not fully specify, and the corrupt-boot walk's premise moves at the same time. Demonstrating that red before green requires a runner that cannot return green on nothing (WORK-114) and flows that assert on values rather than on the absence of throws (WORK-113). A one-item gate worked twice; a one-item gate with its instrument already trustworthy is what this one needs.

**Three rulings unblock scheduling, and all three are cheap to give.** C22 (does the unmeasurable-fill exclusion widen to `opacity` over text — the code fix needs no ruling, the convention does), C25 (is a fixture probe inside the harness or a sixth thing — this decides whether the recurrence engine ever gets a regression guard), and C26 (is re-anchoring the calendar a defect fix inside WORK-95 or a revision of it). C23 is yours to weigh; C24 needs only to be recorded as an ordering constraint on WORK-97(b).

**Treat WORK-115 as the strongest-evidenced item in the round.** Two reviewers who could not confer found `drawPvA` keying by `cat.name`, reached the same fix, and both independently noticed the WORK-103 comment claims a *split* where the code *merges*. That comment is a result-stating comment that is false — the exact class your round-6 standing guidance was written for — sitting inside a guard approved last round.

**The good news is real and should be recorded.** Round 6's batch is on disk, verified independently by both reviewers including all three PNGs opened as images; no Critical in either report; no calculation defect in the four money functions for the sixth round running; and `npm run verify`, `npm run v1` and `boot-crash.js` all exit 0 today. The whole of this round is ~3 days and nothing above S. What is on the table is not whether the application works — it is whether the one route out of a broken boot does, and whether the instrument watching it is asking about function or about visibility.
