# Chief Architect — Final Engineering Decision

**Round 7.** Sources read in full and unmodified: `D:\3_Claude\PowerApps\reports\ui-review.md` (7 findings, 90/100), `D:\3_Claude\PowerApps\reports\code-review.md` (11 findings, 78/100), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (17 items WORK-111..WORK-127, conflicts C22–C26). Also read before ruling: `knowledge/review-conventions.md`, `knowledge/project.md`, `reports/chief-architect.md` (my round-6 decision), `reports/HANDOFF.md`.

**This report replaces the round-6 decision as the standing decision.** Everything in round 6 carries forward unchanged except the seven items named in "What I Am Changing From Round 6".

Ruling issued on all 17 items and all five conflicts. No item is silent.

---

## Verified Against Source, Not Accepted On Report

I re-derived every claim I rule on.

- **`index.html:2790-2793` against `:5444`.** `#dataErrorImport`'s click handler is at `:2790` and does `getElementById('importFile').click()`. `let db = load()` is at `:2793`. The `change` listener that reads the chosen file is at `:5444`. **CODE-01's structural claim is exact.** I confirmed the throw: the `try` closes at `:2858`; `:2885` runs `d.categories.forEach(...)` outside it; `:2830` gates on `parsed.categories?.length ? parsed.categories : defaultCategories`, so a truthy-length non-array survives to `:2885`.
- **`boot-crash.js:51-53`** — `t.D_restore_reachable = ... offsetParent !== null`. Visibility. Not function. `:57-59` asserts `A_init_completed` is **false** as a setup precondition. **CODE-01's second clause confirmed: the probe passes on the broken state.**
- **The handler cannot simply be moved.** I read `:5444-5525`. Its body reaches `importProblem()` (→ `ISO_DATE_RE`, `const` at `:3207`), `writeDb`, `load`, `alertDialog`, `confirmDialog`, `applyTheme` and four `render*` functions. On the throw path the script never reaches any of them, so relocation converts a silent no-op into a throw. **The reviewer is right to reject that shape.**
- **A correction to the recommended fix that is in neither report.** Extending `load()`'s `try` past `:2885` and `:2888` is **not sufficient as written**. When `d.categories.forEach` throws, `d` has already been assigned the bad parsed object at `:2826`. The catch calls `quarantineCorruptData(raw)`, and then `if (!d) d = {defaults}` at `:2860` does **not** fire, because `d` is truthy. The app would boot with `db.categories === 'abc'` — a worse state than the one being fixed. **The catch must discard `d`.** This is a condition on WORK-111, derived at `:2826`, `:2853-2858`, `:2860-2872`.
- **A dependency the Engineering Manager claims that does not exist.** `v1-write-flows.js:117-146`'s corrupt-boot walk seeds `'{not json'`, which fails `JSON.parse` inside the existing `try` at `:2825`. `d` stays undefined, the defaults fallback runs. Extending the `try` does not touch that path. **WORK-111 does not move the corrupt-boot walk's premise.** Neither does it need width mode. **WORK-113 and WORK-114 are therefore not preconditions of WORK-111**, and the gate is smaller than proposed.
- **`run.mjs:82-85`** — the host samples once at 1800ms and falls back to `||'{}'`. `{}` parses, `Object.entries({})` is empty, `H_unexpected_console_errors` is `undefined`, so `:147` is skipped. Exit 0. **CODE-03 confirmed.** `:138-142` iterates arrays only, not nested plain objects. **Second clause confirmed.**
- **`boot-crash.js:24, 71, 77`** — `consoleErrors: []` is declared and never written. No `console.error` hook, no `error` listener, no `push`. `H_unexpected_console_errors` is structurally always `0`. **CODE-04 confirmed.**
- **`v1-write-flows.js:43-92`** — `A_income_count`, `B_amount_after_edit`, `B_modal_closed`, `C_actual_count`, `D_amount_after_edit`, `D_list_refreshed`, `E_data_banner_hidden`, `F_save_banner_hidden`, `G_income_edit_failed_toast`: recorded, never compared. The only `throw`s are at `:123, :126, :140-145`, inside the corrupt-boot walk. **CODE-02 confirmed exactly.**
- **`index.html:6061-6068`** — `const name = cat ? cat.name : 'Unknown'; if (!rows[name]) rows[name] = {...}`. Keyed by name; `group` stamped on first sight. `:6423`/`:6437` key by `categoryId`. **UI-02 and CODE-05 confirmed, independently, from opposite directions.**
- **`index.html:1322`** — `.chip.off { opacity: .6; border-style: dashed; }` over `.chip-label` (`:1324`) and `.chip-amt` (`:1316`). I recomputed the light-theme amount myself: effective text `(144.6, 153, 165)`, effective ground `(246.6, 249, 251.4)`, relative luminances 0.3149 and 0.9439, **contrast 2.72:1**. UI-01's arithmetic holds.
- **`index.html:3693-3699`** — `calDate` is set from `fromEl.value`, the range start. **UI-05 confirmed.**
- **`index.html:768-769`** — the shorthand's third value is the bottom and it carries `env(safe-area-inset-top)`; `:769` then re-states the top. **CODE-07 confirmed; it is unambiguous from the declaration.**
- **`index.html:3328-3334`** — `importProblem` requires `Array.isArray(data.categories)`. **The import path cannot produce CODE-01's blob.** `save()` stringifies a real `db`. The only live routes are `loadFromCloud()` (unvalidated, behind an empty Firebase config and a hard precondition) and external editing of the store. **This is why CODE-01 is High and not Critical, and the reviewer scoped it correctly.**
- **`index.html:5385-5386`, `:5028-5038`, `:3276-3303`, `:1444-1447`, `:1554-1572`; `README.md:11-17, 53`; `expense-pwa/reports/*.md`** — UI-04, CODE-08, CODE-09, UI-06, UI-07, CODE-06, CODE-11 all confirmed on the fact.
- **`tools/harness/` on disk** — `run.mjs`, `fixture.js`, `v1-write-flows.js`, `boot-crash.js`. `package.json` has four `check` scripts, `verify`, and `v1`. `boot-crash.js` is not a script; it is invoked as an argument to `run.mjs`. **That is the precedent that settles C25, and it is already on disk under my own ceiling.**

---

## Executive Decision

**No. One item, for the third round running — and this time the item is mine.**

Two reviewers working in parallel returned no Critical, 90 and 78, and where they converged they converged independently on `drawPvA`, including both spotting that the WORK-103 comment I approved claims a *split* where the code *merges*. Round 6's batch is genuinely on disk; both reviewers opened all three PNGs rather than trusting a commit, and the completion-record failure that dominated two rounds did not recur. Against that sits CODE-01: after a boot-time throw the data-error banner's "Restore from file" opens a picker and does nothing, deterministically, in the one state the banner exists for, and the user's remaining move is to clear site storage — which destroys the financial history the entire quarantine design was built to preserve. That is a data-loss outcome, and correctness and preservation of financial data outranks everything else in this project. The path is narrow today — I verified `importProblem` blocks it and `save()` cannot produce it — but `tools/harness/boot-crash.js`, added under WORK-99 to guard exactly this state, asserts `offsetParent !== null` and passes, so nothing in the project can tell a working recovery route from a visible button. **WORK-99 is my approval, granted on the reasoning that moving three declarations "changes no behaviour"; that was true of what moved and false of the mechanism, because I moved the reporting above `load()` and never asked where the recovery sat.** I am holding the build for one day to fix that.

---

## Release Gate Ruling

### Gate R5 stands closed. It is not reopened.

R5's condition was: *the item landed; V1's write flows executed with a clean console, including a deliberately corrupted store followed by a thrown runtime error; `npm run verify` returns zero.* All three clauses were performed. `v1-write-flows.js:117-146` is that walk, it contains real assertions, and it was demonstrated red-then-green. CODE-01 is a different defect in a different mechanism, not a failure of R5's condition. Retro-reopening a gate whose stated condition was met would make the instrument meaningless.

### Gate R7 opens with two items.

| Gate item | Why it blocks release |
|---|---|
| **WORK-112** | Goes first because WORK-111 rewrites the same file. Re-expressing a probe that still carries a field nothing can populate teaches the next reader to trust the wrong thing. Delete two assignments and one field. |
| **WORK-111** | The only route out of a broken boot is a no-op in the one state it exists for, and the user's fallback destroys their history. The guard written for that state asks about visibility, not function. |

**GATE R7 CLOSES** when: `boot-crash.js` no longer reports a console field nothing writes; `load()` is total; `boot-crash.js` asserts `A_init_completed === true` as the *property* rather than as a setup precondition; the assertion is demonstrated **red before green** by reverting the `load()` change; and `npm run verify`, `npm run v1` and `node tools/harness/run.mjs tools/harness/boot-crash.js` all exit 0.

**WORK-113 and WORK-114 are not in the gate**, against the Engineering Manager's recommendation. I checked the claim rather than accepting it: WORK-111's demonstration runs `boot-crash.js` without `--width` and reports flat strings and a string array, so neither the width-mode `{}` fallback nor the non-recursive `THREW` scan can affect it; and the corrupt-boot walk's premise is the `JSON.parse` failure, which the fix does not touch. A gate of four items where two are unnecessary is the eleven-item shape that produced a Critical, in miniature. Two items, one pass, one file pair.

**I schedule WORK-113 and WORK-114 immediately after the gate**, before anything user-facing, because every subsequent claim in this round rests on them.

---

## Verification Process Ruling

V1 through V6 stand. Four amendments and two new conventions, all inside things that already exist.

**V1's write flows gain assertions (WORK-113).** The command that underwrites every completion claim in this project can say no to a throw and cannot say no to a wrong number. Eight `if (...) throw` lines inside the flows that already run, in the style the corrupt-boot walk already uses. Each demonstrated red once by breaking what it watches.

**The runner stops returning green on nothing (WORK-114).** Fail on a parsed payload with no own keys. Poll for `data-probe` rather than sampling once at 1800ms, or write an explicit `ERROR` sentinel. Recurse the `THREW` scan over plain objects. This is the same class as the parse-failure exit-0 I authorised in round 6, in the same file, in the one mode no current command exercises.

**The tool ceiling is restated, and it is a ceiling on runners.** Four static predicates behind `verify` — `lint.mjs`, `check-escaping.mjs`, `check-contrast.mjs`, `check-saves.mjs` — plus **one render harness**, whose single runner is `run.mjs`. **Probes and fixtures under `tools/harness/` are inputs to that runner and are not counted.** They install nothing, configure nothing and add no invocation pattern. There is no sixth **runner** this quarter.

**The pair-table exclusion widens from a mechanism to a property.** Round 6's wording named a *fill*. The property it was groping at is: `check-contrast.mjs` can only measure a foreground and a ground expressible as two tokens. The amended rule: **text is painted from a token, on a ground expressible as a token. Any CSS that composites text or its ground outside the token system — an `rgba()` literal fill, `opacity` on a text-bearing element, `filter`, `mix-blend-mode` — is not permitted over text.** State the state in tokens instead. This costs nothing to enforce, adds no tool, and closes the class rather than the case.

**New convention, and it is this round's lesson: a visibility assertion is not a function assertion.** I drew this as ruling C17 for a code review and it is now inside my own guard. The rule for probes: **an assertion that an element is present or visible guards nothing about whether it works, and a probe may not be described as guarding a behaviour unless it exercises that behaviour or asserts a property that provably implies it.** WORK-111's re-expressed `boot-crash.js` is the worked example — once `load()` cannot throw, `A_init_completed === true` is exactly the property that implies every listener below `load()` was registered.

**Stage 2 remains deferred; the trigger did not fire, sixth round running.** Code Review states outright that it found no calculation defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. I note that WORK-124 directly answers the strongest argument *against* the deferral — that no command would surface a calculation defect — which strengthens the deferral rather than weakening it.

---

## Conflict Rulings

### C23 — CODE-01 against gate R5's closing record and WORK-99's approval. **Ruled first.**

**Ruling: CODE-01 holds in full, verified at source. Gate R5 stays closed. Gate R7 opens on WORK-112 + WORK-111. The recommended fix is accepted in shape, with one correction the report does not contain.**

I separate three things the conflict bundles.

**R5's condition was met** and I will not retro-reopen a gate whose stated condition was performed. Doing so would teach that a closed gate means nothing, which is the opposite of what a gate is for.

**WORK-99 is my error and I am recording it as one.** I approved it on the reasoning that moving `let fatalReported`, `reportFatal()` and both listeners above `load()` "changes no behaviour". That is true of the three declarations. It is false of the mechanism: the banner those declarations raise carries a button whose handler is registered 2,650 lines further down, so I moved the alarm above the failure and left the exit below it. Nobody asked where the other half was, and I am the one who should have.

**The fix is accepted, with a correction.** Extending `load()`'s `try` past `:2885` and `:2888` is right in direction and insufficient as written: `d` is already assigned when the throw happens, so `if (!d) d = {defaults}` at `:2860` does not fire and the app boots with `db.categories === 'abc'`. **The catch must discard `d`.** The requirement I am approving is a property, not a diff: **`load()` returns either a valid parsed database or the defaults, for any bytes in the store, and every failure routes through `quarantineCorruptData()` and `updateCorruptBanner()`.** One corruption outcome, not two.

**On the residual class, and I am recording it as a risk, not scheduling it.** Making `load()` total removes the one known reachable throw. It does not remove the structural fact that ~2,650 top-level statements sit between `let db = load()` and the recovery listener, and that a throw in any of them still leaves `#importFile` unwired under a "Something went wrong" banner. Guarding that would need either the file split (off limits) or the listener moved (impossible: `ISO_DATE_RE` is permanently in the temporal dead zone on that path). I am adding no work for it. I am adding a constraint: **no new top-level statement is added between `load()` and the import listener without asking what a throw there costs.**

### C22 — Does the "unmeasurable fill may not paint over text" exclusion reach `opacity`?

**Ruling: it does now. The convention is amended to name the property rather than the mechanism, and `.chip.off` is not a one-off.**

I recomputed 2.72:1 myself from the declared tokens; UI-01 is right on the arithmetic and right that `check-contrast.mjs`'s `over` mechanism (`:209-243`) composites the background only and cannot express this pair. Round 6's wording was written against `rgba()` because `rgba()` was the instance in front of me. Treating `opacity` as outside it would mean the next round finds `filter: brightness()` and asks the same question a third time. The enumeration of ways CSS composites is short and closed, so naming the property is not premature generalisation — it is the correct level of abstraction, one round late.

The code fix needs no ruling and no new pair row: `.chip.off { background: var(--surface); color: var(--text-2); border-style: dashed; }` makes the state measurable by `text-2/surface` and `text-2/surface-2`, both of which are already in the table. The dashed border, the strikethrough and the grey dot are untouched, so the non-colour encoding survives intact.

### C24 — CODE-03 against WORK-97(b)'s settling condition

**Ruling: the fix is approved on its own merit and needs no conflict resolution. The ordering constraint is recorded as binding.**

WORK-97(b)'s stated settling condition is a width-mode probe reporting `.cal-cell` widths at four viewports as a width-keyed result — precisely the mode where `run.mjs` prints `{}` and exits 0, reporting a nested shape the `THREW` scan does not descend into. Every number in those three lines has been wrong twice from arithmetic alone. **WORK-97(b) may not be settled until WORK-114 has landed.** That is a constraint on the deferral, not new work, and it costs nothing to hold.

### C25 — Is a probe file under `tools/harness/` a sixth thing?

**Ruling: no. A probe run by `run.mjs` is inside the harness. The ceiling is on runners, not on probes. WORK-124 is authorised.**

Three reasons, and the first is decisive.

**The precedent is already on disk under my own ceiling.** When I wrote "four static predicates plus one render harness" in round 6, `tools/harness/` already contained a runner, a fixture and a probe. `boot-crash.js` was added during round 6's implementation and is not in `package.json`; it is an argument to `run.mjs`. If a probe were a sixth thing, round 6 breached my own ceiling and nobody noticed — which tells me the wording, not the practice, was wrong.

**The property the ceiling protects is "nothing new to install, configure, learn or maintain as a separate command."** A probe adds no dependency, no script pattern, no runner. It is data that `run.mjs` executes. What the ceiling forbids is a fifth static predicate, a second harness, a test framework, or a new runner.

**The two readings give opposite answers for the one artifact that would guard the recurrence engine** — the part of this application with the longest defect history, whose four expected totals currently sit in `fixture.js` as data with no runner, under a HANDOFF instruction that cannot be followed. Reading a ceiling so that it forbids the guard the ceiling exists to make possible is the wrong reading.

**Restated so it cannot be misread again:** four static predicates behind `verify`, plus one render harness with one runner, `run.mjs`. Probes and fixtures under `tools/harness/` are its inputs and are not counted. **There is no sixth runner this quarter.**

### C26 — UI-05 against WORK-95's approved shape

**Ruling: a defect inside the approved shape. WORK-95's approval was incomplete, not wrong. No re-approval ceremony; WORK-118 completes it.**

My approval named *when* to sync and one constraint — the arrows keep working, All-Time is left alone. It did not name the anchor because I did not think to. The property WORK-95 was approved to establish is in its own title and in the code comment at `:3683`: *"Peak day tile could name a date the calendar below it was not showing."* UI-05 demonstrates that property is still false for six of nine presets, with the identical symptom. An approval that establishes a property is met when the property holds, not when the named line is edited. Finishing it is XS, at the same site, with the arrows untouched.

I endorse the reviewer's anchor rule and I checked it is total across all nine presets: **today, clamped into `[from, to]`** — `from` if today precedes the range, `to` if today follows it, otherwise today. That gives August for This Month, Last 30 Days, Last 90 Days and This Year; July for Last Month; September for Next Month; December 2025 for Last Year; and leaves All-Time and Custom alone.

### WORK-112's shape — the choice the Engineering Manager left to me

**Ruling: delete the field and both assignments. The recorder is rejected.**

Installing the three-line recorder adds a new assertion, which under my own standing rule needs its own red-then-green demonstration — for a check that, as the reviewer notes, cannot see console errors raised inside the *nested* frame, which is where the entire subject of the probe happens. That is a second assertion that structurally can barely fail, added to fix the first one that structurally cannot. Deleting is smaller, honest, and stops the payload implying a check that is not happening. **Condition: the probe's header states plainly that console errors inside the nested frame are invisible to the outer one**, so the next reader does not add the recorder believing it covers the boot.

---

## What I Am Changing From Round 6

Everything not listed here carries forward unchanged, including every rejection and every deferral.

1. **Gate R5 stands closed** — its condition was performed. **Gate R7 opens** with two items, WORK-112 then WORK-111. (C23)
2. **The pair-table exclusion widens** from "an unmeasurable fill" to any compositing over text outside the token system, `opacity` included. (C22)
3. **The tool ceiling is restated as a ceiling on runners, not probes.** Probes and fixtures under `tools/harness/` are inputs to `run.mjs` and are not counted. (C25)
4. **New convention: a visibility assertion is not a function assertion.** Ruling C17's principle becomes a rule for probes. (C23)
5. **WORK-95's approval is recorded as incomplete**, completed by WORK-118, not revised. (C26)
6. **WORK-99's approval is recorded as the origin of CODE-01.** My stated reason was true of what moved and false of the mechanism.
7. **WORK-97(b)'s deferral gains a binding ordering constraint**: it may not be settled before WORK-114 lands. (C24)

---

## Approved Improvements

16 of 17 items approved, one of them narrowed to half. Gate items marked **[R7]**.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-112** | `boot-crash.js` reports a console-error count from a list nothing writes to **[R7]** | Verified: `consoleErrors` is declared at `:24` and never written; the field is structurally always 0 and `run.mjs:147` can never fire on it. An assertion that cannot fail is the exact defect round 6 raised as its most important finding, reproduced inside the probe added to fix it. **Approved as deletion, not as a recorder. Condition: the header records that nested-frame console errors are invisible to the outer frame.** Goes first; same file as WORK-111. |
| **WORK-111** | "Restore from file" is inert after a boot-time throw **[R7]** | Verified at `:2790-2793`, `:2885`, `:5444` and `boot-crash.js:51-53`. The one route out of a broken boot is a silent no-op in the one state it exists for, and the user's fallback destroys the history quarantine was built to preserve. **Conditions: (a) `load()` returns a valid database or the defaults for any input, every failure routing through `quarantineCorruptData()`; (b) the catch must discard the partially-built `d`, or the app boots with `categories` as a string — my derivation, in neither report; (c) `boot-crash.js` re-expressed so `A_init_completed === true` is the assertion, not the setup precondition, keeping the banner, title and reachability checks; (d) demonstrated red before green by reverting the `load()` change; (e) all three commands exit 0 at close.** |
| WORK-113 | `npm run v1`'s four write flows record eight values and assert none | Verified at `:43-92`: the only `throw`s in the file are in the corrupt-boot walk, which is why the round-6 demonstration worked and why the four flows did not. A build where "edit income" writes 5000 instead of 7500, or where the data-error banner is stuck on, exits 0 and prints success. **Conditions: assertions inside the existing `flow()` blocks, in the corrupt-boot walk's own style; the two banner booleans and the save-failure toast included; each demonstrated red once; no new file.** First work after the gate. |
| WORK-114 | `run.mjs --width` exits 0 on a probe that never reported | Verified at `:82-85` and `:138-142`. Same class as the parse-failure exit-0 I authorised in round 6, in the same file, in the one mode no current command exercises. **Conditions: fail on a payload with no own keys; poll rather than sample at 1800ms, or write an explicit `ERROR` sentinel; recurse the `THREW` scan. Must land before any WORK-97(b) measurement (C24).** |
| WORK-115 | Planned vs Actual keys rows by category name | The strongest-evidenced item of the round. Two reviewers who could not confer found the same line, reached the same fix, and both independently noticed the WORK-103 comment claims a *split* where the code *merges* — a result-stating comment that is false, inside a guard I approved last round. The Dashboard reports a category structure the user did not create, in the configuration my own narrowing of WORK-103 was written to permit. **Conditions: key by `x.categoryId`, carry `name` and `group` as row fields, one sentinel key for deleted categories, and correct the comment at `:4979-4980` in the same commit.** Scheduled at S, as the Engineering Manager reasoned. |
| WORK-116 | Planned-vs-Actual variance is carried by sign and colour only | `project.md` requires every screen to be understandable without training by people with little accounting knowledge. A red `+₮50,000` with no word, decoded by a red/green pair the file's own comment at `:6182` identifies as the confusable one, on the Dashboard's per-category budget card. The vocabulary already exists eighteen lines below at `:6111-6115`. Two template strings. After WORK-115, so it lands on the final row shape. |
| WORK-117 | `.chip.off` uses `opacity` over text | Ruling C22. I recomputed 2.72:1 from the declared tokens. This is the only control that removes a category from the chart, calendar, stats strip and day detail at once, so its excluded state is exactly the one a user must be able to read to know their totals are filtered — and its money figure is at roughly half the required ratio in the theme every user starts on. **Approved in the reviewer's shape: tokens, not opacity. No new pair row. Re-run `check-contrast.mjs` after. The now-dead `opacity` in `.chip`'s transition list may be dropped in the same commit.** |
| WORK-118 | Analytics calendar anchors on the range start, hiding today | Ruling C26. A defect inside WORK-95's approved shape: the property that approval was granted to establish is still false for six of nine presets, with the identical symptom the code comment at `:3683` names. **Approved in the reviewer's shape — today clamped into the range; I verified it is total across all nine presets. The ◀/▶ arrows remain the acceptance test, as they were for WORK-95.** |
| WORK-119 | Three Settings inline-editor controls have no accessible name | Verified at `:5385`, `:5386`, `:5095`. WCAG 3.3.2 Level A and 4.1.2. These are the app's only unlabelled form controls — every other input is either labelled or carries `aria-label` — so it is an internal inconsistency as well as a conformance failure, and the row's static text is *replaced* by the controls, so there is no fallback. Three attributes matching the pattern already at `:7345`. |
| WORK-120 | The header's bottom padding carries the top safe-area inset | Verified at `:768-769`; the shorthand's third value is the bottom by definition, and `:769` exists only to correct `:768`. On a notched device in the installed PWA — the configuration the app's own Storage Status and About cards recommend — the sticky header is ~47–59px taller than designed on every screen. Also a direct deviation from `coding-standards.md` "Avoid duplicated styles". **Condition: one declaration replaces two, with a one-line reason so it cannot be re-introduced.** |
| WORK-121 | README ships four files; the app needs eight | Verified at `README.md:11-17, 53` against `manifest.json:11-42`, `index.html:48` and `sw.js:3-12`. The app's own deployment instructions undo WORK-93, the icon work I approved and conditioned last round, on the platform whose storage-eviction warning the app itself raises. **Condition: step 3 and the Files table name the folder, not a file list, so this cannot drift a fifth time.** The theme line, the four missing modules and the stale WORK-05/WORK-14 citation ride in the same commit — the stale ids sit in the paragraph that is the standing hard precondition for Cloud Sync. |
| WORK-122 | `saveEditIType()` has no duplicate-name check | Verified at `:5028-5038` against `:4995-4997`. `saveEditCat`'s own comment states the reason — *"Same rule as catAdd, or renaming is a way around it"* — and that reasoning was applied to one pair and not the other. The salary handler's `find(t => t.name === 'Salary')` at `:4491` makes it more than cosmetic. Three lines, minus the group clause. |
| WORK-123 | `goalProblem()` does not validate `createdDate` | Verified at `:3276-3303`, `:5656-5666`, `:7272`. Third instance of a class this project has closed twice, returning through a sibling field on the same records; the two previous instances produced visible defects and this one silently disables an advisor rule with no signal at all. One line, matching the three beside it. |
| WORK-124 | The fixture's four expected totals have no runner | Ruling C25. The four figures `VERIFICATION.md` §3 derives and §5's checklist is written in terms of exist as data nothing evaluates, under a HANDOFF instruction that cannot be followed. This is the only regression guard the recurrence engine — the longest defect history in the application — would have. **Conditions: one probe under `tools/harness/`, run by `run.mjs --fixture`, throwing on any disagreement with `RANGES`; demonstrated red by perturbing one expectation; added to `package.json` as a named script so HANDOFF's instruction becomes a command rather than a sentence — `boot-crash.js` may take the same one-line treatment as a ride-along. No new runner.** Last item in the round. |
| WORK-125 (narrowed) | Stale round-1 review reports ship inside `expense-pwa/` | Verified on disk. Three round-1 documents describing a 5,161-line `index.html` that is now 7,846, under the same filenames as the live reports at root, published by README Option B. **Narrowed to deletion. The "move with a round suffix" alternative is rejected: git history holds them, and preserving a document that describes a codebase which no longer exists is retained confusion, not an archive.** |
| WORK-127 | The `.cal-grid` measurement table does not say which grid it measured | Verified at `:1554-1572`. Six lines below a table measured in `.cal-card` — whose padding is set by a rule scoped to that card alone — the comment says *"The date picker matters more than the heatmap here"*, inviting a reader to apply the table to `#dpGrid`. WORK-97(b) is deferred pending exactly that measurement, so this misdirects the person who will take it. **Condition: label the existing table, add the picker's derivation as inputs and an operator, no standalone figure.** Feeds WORK-97(b) and narrows what it must settle. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-126 (geometry half)** | Add a fourth `@media` breakpoint at ≤340px for the goal icon picker | The shortfall is 2.4px on a decorative picker, across a 12px viewport band (320–331px), in one of its two containers, with `#goalIcon` accepting a typed emoji so nothing is unreachable. Against that: adding a **fourth** breakpoint to a rule whose three existing breakpoints are justified by two figures that reproduce from neither container is building on sand. The correct disposition is the one I already authorised for the calendar in WORK-97(b) — record the derivation and record the shortfall. **The comment half is approved; see below.** |
| **WORK-112 (recorder shape)** | Install `v1-write-flows.js`'s three-line console recorder in `boot-crash.js` | It adds a new assertion, which needs its own red-then-green demonstration, for a check that cannot see console errors inside the nested frame — which is where the entire subject of the probe happens. A second assertion that can barely fail, added to remove the first that cannot. Deletion is smaller and honest. |
| **WORK-111 (move-the-listener shape)** | Relocate `#importFile`'s `change` listener above `load()` | Verified at `:5444-5525`: the handler reaches `importProblem` (→ `ISO_DATE_RE`, `const` at `:3207`), `writeDb`, `load`, `alertDialog`, `confirmDialog` and four `render*` functions, none of which exist on the throw path. It converts a silent no-op into a throw. Making `load()` total removes the risk; moving the listener relocates it. |
| **WORK-111 (bare `try`-extension shape)** | Extend `load()`'s `try` past `:2885`/`:2888` without discarding `d` | Derived at `:2826`, `:2853-2858`, `:2860`. `d` is already assigned when the throw fires, so the defaults fallback does not run and the app boots with `db.categories === 'abc'` — a half-built database reaching every consumer. Worse than the defect. The catch must discard `d`. |
| **WORK-125 (move shape)** | Relocate the three stale reports under root `reports/` with a round suffix | See above. Git history is the archive. |
| **WORK-89 (sweep half)** — carried | Snap 72 font sizes, 9 radii, ~69 spacings, 7 card paddings onto the scales | Rejected three times, unchanged, and explicitly not reopened by anything this round. UI Review correctly declined to raise the residual off-scale literals at `:1421`, `:1491`, `:1375` as members of this set. |
| **WORK-88 / WORK-58** — carried | Default an unset theme to dark when the OS prefers dark | Rejected in rounds 4, 5 and 6. Returns only on an observed user harm. Not re-raised. |
| **WORK-87** — carried | Add `savedToast` to the two reorder handlers | Rejected on a verified fact: `writeDb()` raises `showSaveError()` on every failure path. Not re-raised. |
| **WORK-76 (extraction half)** — carried | Extract the shared "apply a preset and persist it" body | Two call sites do not justify a new seam. Unchanged. |
| **WORK-100 (`z-index` shape), WORK-102 (`input`-event half), WORK-106 (deny-list half)** — carried | Shapes rejected inside round-6 approvals | All three carry forward as rejected so they cannot be re-proposed, exactly as `HANDOFF.md:51-54` records them. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-97(b)** — carried, with a new constraint | Calendar cell geometry — accept the sub-390px track overlap or spend the card's inset | Unchanged in substance: a width-mode probe reporting `.cal-cell` `getBoundingClientRect().width` at 320, 360, 375 and 390px, for the current rule and the padding-zero variant, plus a check that zeroing the padding does not push `.cal-nav` and `.cal-legend` edge-to-edge. Accepting the shortfall and recording the derivation remains a legitimate outcome. **New binding constraint (C24): this may not be settled before WORK-114 lands.** WORK-127 supplies the `#dpGrid` derivation and narrows the question to 320px for the picker. |
| **WORK-85 + WORK-35** — carried | Keyboard path for reordering; extract the shared reorder implementation | Trigger unchanged: a behavioural change to either reorder path (extraction first), or a real keyboard or switch user blocked. Not re-raised this round. |
| **WORK-16 / WORK-49** — carried | Index the Daily chart and calendar; bucket Monthly Trend | Trigger unchanged: a measured render above 100ms on a mid-range device, or a real store above 5,000 actual records. Code Review restated the scan costs and **explicitly took no measurement and did not re-raise**, which I note approvingly for the second round running. |
| **WORK-15** — carried | Cloud load through `importProblem` → `writeDb` → `load()` | Hard precondition holds: no build ships with Firebase configured until WORK-15 and the escaping work have both landed. Newly relevant: `loadFromCloud()` is the one live route to CODE-01's blob, so WORK-111 narrows the risk but does not retire the precondition. WORK-121 corrects the stale ids that make this precondition hard to check. |
| **WORK-17 (IndexedDB half), WORK-23 (screen half), WORK-30, WORK-31** — carried | Standing round-3 deferrals | Unchanged. No report this round presented evidence against any of them. |
| **Stage 2** — carried | Pure-logic module and test runner | Not promoted, sixth round running. **Trigger unchanged and unfired:** a rounding or arithmetic defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`. WORK-124 answers the strongest argument against this deferral — that no command would surface such a defect — which strengthens it. |

---

## Development Order

Nothing outside R7 begins before R7 closes.

**Step 0 — WORK-112, then WORK-111. [R7]** Two commits, one pass, one file pair. Delete `consoleErrors` and both `H_unexpected_console_errors` assignments and record in the header why the outer frame cannot see the inner one's console. Then make `load()` total, **discarding `d` in the catch**, and re-express `boot-crash.js` so `A_init_completed === true` is the assertion rather than the setup precondition. **Demonstrate red before green** by reverting the `load()` change.

**GATE R7 CLOSES.** Conditions: `load()` is total, the probe asserts the property rather than the precondition, the demonstration is red-then-green, and `npm run verify`, `npm run v1` and `node tools/harness/run.mjs tools/harness/boot-crash.js` all exit 0. **Then the build is releasable.**

**Step 1 — WORK-113, then WORK-114.** The instrument, before anything user-facing, because every claim in the rest of this round rests on it. Eight assertions inside the flows that already run, each demonstrated red once; then the runner's empty-payload guard, its poll, and its recursive scan.

**Step 2 — WORK-115, then WORK-116.** One pass over `drawPvA`, two commits. Key by `categoryId` first so the variance wording lands on the final row shape. The `catAdd` comment correction rides with WORK-115.

**Step 3 — WORK-117.** One declaration becomes two token declarations. `check-contrast.mjs` runs after and its summary line must be the honest one.

**Step 4 — WORK-118.** Today clamped into the range. The ◀/▶ arrows are the acceptance test, as they were for WORK-95.

**Step 5 — WORK-119, then WORK-120.** Separate commits; unrelated. Three attributes, then one padding declaration replacing two.

**Step 6 — WORK-121.** Step 3 names the folder. Theme line, four modules and the WORK-15 citation ride along.

**Step 7 — WORK-122, then WORK-123.** Separate commits. Both are three lines or fewer at a site that already carries its siblings.

**Step 8 — WORK-125, WORK-126 (comment only), WORK-127.** Separate commits. Delete the three stale reports. The icon-grid comment states inputs, an operator and which container, and records the 320–331px shortfall rather than adding a breakpoint. The `.cal-grid` table gets its label and the picker's derivation.

**Step 9 — WORK-124. Last.** The fixture probe, demonstrated red by perturbing one expectation, wired as a named script. It goes last because it is the round's only remaining S, it benefits from WORK-114 having landed, and it should be written against the final state of everything above it.

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework, no runtime build step, no bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations. `stepDate` as the single recurrence engine. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever. Offline-first. Mobile-first. Correctness and preservation of financial data above everything.

**What changes.**

1. **`load()` becomes total.** The one function in this application that reads untrusted bytes returns a valid database or the defaults, for any input, and every failure routes to quarantine and the true banner. One corruption outcome, not two. This is the boundary the whole persistence design assumed it already had.
2. **A visibility assertion is not a function assertion.** A probe may not be described as guarding a behaviour unless it exercises that behaviour or asserts a property that provably implies it. This round's central fact is that the guard for a broken recovery route was green, and it was green because it asked whether a button could be seen.
3. **The verification layer can say no to a wrong value, not only to a throw.** `npm run v1`'s four write flows assert; `run.mjs` fails on an empty payload and scans nested results; the recurrence fixture gets a runner. Every new assertion is demonstrated red before it is trusted green — unchanged, and it held this round.
4. **The ceiling is four plus one, and it is a ceiling on runners.** Four static predicates behind `verify`, one render harness with one runner. Probes and fixtures are its inputs and are not counted. There is no sixth runner.
5. **Text is painted from a token, on a ground expressible as a token.** No `rgba()` literal fill, no `opacity` on a text-bearing element, no `filter`, no `mix-blend-mode` over text. Unmeasurable text is not allowed. This replaces the round-6 fill-only wording.
6. **Comments state derivations, never results.** Unchanged, and it caught two more instances this round — the icon-grid figures and the WORK-103 split-versus-merge claim. Six instances in three rounds.
7. **A claim of completeness closes by re-derivation; an asset commit closes by opening the asset.** Unchanged, and it worked: both reviewers opened all three PNGs and round 6's central failure did not recur.
8. **C5 in its extended final form**, unchanged.

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports. Enabling Firebase. Deleting or repairing any quarantined Cloud Sync code, `fbApp` included. Splitting `index.html`. Any large mechanical sweep across the file — the 72 font sizes and 69 spacings are declined for the fourth time. Any `render*` calling `save()`. A seventeenth theme before `check-contrast.mjs` covers it. A sixth **runner**. CSS parsing, cascade resolution or `color-mix()` following inside `check-contrast.mjs`.

**Risks I am recording, not scheduling.** Three carry forward unchanged and are not findings: `analyzeExpenses()` is 330 lines of 26 inline rules with no seam, and it is where the AI Budget Assistant will want to live; every consumer re-derives its own filter/expand pipeline from `db`, which is precisely what WORK-115 costs when one of them derives its key differently; and filter state lives in DOM inputs rather than a model, which is why the harness is the only place a range-dependent claim can be checked. **One new risk, stated as a risk and not raised as a finding:** making `load()` total removes the one known reachable throw and does not remove the ~2,650 top-level statements between `let db = load()` and the recovery listener. Any future throw in that span still leaves `#importFile` unwired under a banner that offers it. **The constraint I am adding is free: no new top-level statement goes in that span without asking what a throw there costs.** The module-boundary problem — 34 mutable globals, filter state in the DOM — remains the leading candidate for the quarter after this one, and remains cheaper to live with than to rewrite a render layer with no harness underneath it.

**And the thing that matters more than any item here.** Round 6's lesson was *prove the machine can say no*. The machine can now say no, and this round it said yes to a broken recovery route because it was asked whether a button was visible. A guard is not a guard because it exists; it is a guard because of the question it asks. The three probes in this repository were each written to close a specific hole, and each one is now the place the next hole will hide. The discipline that follows is not more probes. It is that **every assertion names the behaviour it guarantees, in words, in its own header — and if it cannot, it is not guarding anything.**

---

## Executive Report

The application is one day from releasable and I am holding it, for the third round running — but this time the item is my own approval. Two reviewers working in parallel returned no Critical, 90 and 78, and where they converged they converged independently: both found `drawPvA` keying by `cat.name`, both reached the same fix, and both noticed that the WORK-103 comment I approved last round claims a *split* where the code *merges*. Round 6's batch is genuinely on disk — both opened all three PNGs as images rather than trusting a commit — so the completion-record failure that dominated two rounds did not recur, and that is the most important good news in the round.

What holds the build is `index.html:5444`. `#importFile`'s `change` listener is registered 2,650 lines below `let db = load()` at `:2793`, so after a boot-time throw the data-error banner's "Restore from file" opens a picker and does nothing, deterministically, in the one state the banner exists for; the user's remaining move is to clear site storage, which destroys the financial history the quarantine design was built to preserve. I verified the reachability myself — `importProblem` blocks the blob at `:3333`, `save()` cannot produce it, and the only live route is the unvalidated cloud path behind a hard precondition — which is why the reviewer's High is correct and Critical would have been wrong. But `tools/harness/boot-crash.js`, added under WORK-99 to guard exactly this state, asserts `offsetParent !== null` at `:52-53` and passes. That is ruling C17's own distinction — presence is not sufficiency — sitting inside the project's guard, and **WORK-99 is my approval, granted on the reasoning that moving three declarations "changes no behaviour". That was true of what moved and false of the mechanism: I put the alarm above the failure and left the exit below it.**

I add one correction the reports do not contain. Extending `load()`'s `try` past `:2885` is right in direction and insufficient as written — `d` is already assigned at `:2826` when the throw fires, so `if (!d) d = {defaults}` at `:2860` does not run and the app boots with `db.categories === 'abc'`. **The catch must discard `d`.** I also removed two dependencies the Engineering Manager recorded: WORK-111's demonstration runs without `--width` and reports flat values, so CODE-03's holes cannot touch it, and the corrupt-boot walk's premise is the `JSON.parse` failure, which the fix does not move. **Gate R7 is therefore two items, not four.**

On the conflicts. **C23:** CODE-01 holds in full; gate R5 stays closed because its condition was performed; gate R7 opens on WORK-112 + WORK-111 with the `d`-discard condition attached. **C22:** the exclusion widens from a mechanism to a property — text is painted from a token, on a token-expressible ground, and `opacity` over text is out; I recomputed 2.72:1 myself. **C24:** the fix is uncontested; the ordering constraint is binding — WORK-97(b) may not be settled before WORK-114 lands. **C25:** a probe is inside the harness; the ceiling is on runners, not probes, and the precedent for that is `boot-crash.js`, already on disk under my own round-6 ceiling. WORK-124 is authorised, and the recurrence engine gets its regression guard. **C26:** UI-05 is a defect inside WORK-95's approved shape, not a revision of it; the approval established a property and the property is still false for six of nine presets.

Of 17 items I approved 16, narrowed two, rejected one half and five shapes within approvals, and carried forward every standing rejection and deferral. Three verification amendments and two new conventions, all inside things that already exist. The approved roadmap is roughly 2.7 engineering days, no item above S, no rewrite, no new dependency, no sixth runner, no change to the single-file constraint.

---

## Implementation Priority

1. **WORK-112 [R7]** — delete the dead field and both assignments; header records the nested-frame limitation.
2. **WORK-111 [R7]** — `load()` becomes total, the catch discards `d`, `boot-crash.js` asserts `A_init_completed === true` as the property; demonstrated red before green.
3. **GATE R7 CLOSES** — all three commands exit 0. **Then the build is releasable.**
4. **WORK-113** — eight assertions inside the flows that already run, each demonstrated red once.
5. **WORK-114** — empty-payload failure, poll instead of a fixed sample, recursive `THREW` scan. Blocks WORK-97(b).
6. **WORK-115, then WORK-116** — key by `categoryId` and correct the comment; then the variance says "over" and "under".
7. **WORK-117** — tokens replace `opacity`; `check-contrast.mjs` runs after.
8. **WORK-118** — today clamped into the range; the arrows are the acceptance test.
9. **WORK-119, then WORK-120** — three `aria-label`s; one padding declaration replacing two.
10. **WORK-121** — step 3 names the folder, not a file list.
11. **WORK-122, then WORK-123** — the rename guard and the `createdDate` validator.
12. **WORK-125, WORK-126 (comment only), WORK-127** — delete the stale reports; both comments state inputs, an operator and which container.
13. **WORK-124 — last** — the fixture probe, demonstrated red, wired as a named script.

---

## Recommended Next Action

**Land WORK-112 and then WORK-111, and close gate R7 — nothing else touches the repository first.** Delete `consoleErrors` and both `H_unexpected_console_errors` assignments from `D:\3_Claude\PowerApps\tools\harness\boot-crash.js` and record in its header that console errors inside the nested frame are invisible to the outer one. Then make `load()` total in `D:\3_Claude\PowerApps\expense-pwa\index.html` — extend the `try` past `:2885` and `:2888`, **and set `d` back to null in the catch, or the defaults fallback at `:2860` will not fire and the app will boot with `categories` as a string** — and re-express `boot-crash.js` so that `A_init_completed === true` is the assertion rather than the setup precondition, because once `load()` cannot throw, "init completed" is exactly the property that guarantees `#importFile`'s listener at `:5444` was registered. Then the demonstration, which matters more than the code: revert the `load()` change, run `node tools/harness/run.mjs tools/harness/boot-crash.js`, confirm it goes red; restore it, confirm green. Do not batch the seven user-facing Mediums into this, however cheap they look — WORK-113 and WORK-114 are the first work after the gate and the whole round is under three days. This round's central fact is not the defect. It is that the guard written to watch a broken recovery route reported it green, because it asked whether a button could be seen instead of whether it did anything — and that guard was added under an approval of mine that said the change altered no behaviour.

*(Round 7. Full reports: `D:\3_Claude\PowerApps\reports\ui-review.md`, `D:\3_Claude\PowerApps\reports\code-review.md`, `D:\3_Claude\PowerApps\reports\engineering-manager.md`. This decision replaces `D:\3_Claude\PowerApps\reports\chief-architect.md` as the standing decision.)*
