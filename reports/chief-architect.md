# Chief Architect — Final Engineering Decision

**Round 3.** Sources read in full: `D:\3_Claude\PowerApps\reports\ui-review.md` (23 findings, 60/100), `D:\3_Claude\PowerApps\reports\code-review.md` (18 findings, 60/100), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (40 WORK- items, conflicts C1–C5). Also read: `knowledge/review-conventions.md`, `knowledge/project.md`, `knowledge/coding-standards.md`, `expense-pwa/VERIFICATION.md`.

Both Criticals independently verified against source before ruling:
- `expense-pwa/index.html:6246` — `okSave = save(); …` and `:6249` — `savedToast(okSave, 'Updated');`. Grep for the identifier across the whole file returns exactly those two lines. No declaration. The file is `"use strict"`. CODE-01/UI-01 confirmed.
- Nine unescaped id interpolations confirmed at `:3650`, `:3654`, `:3850`, `:3853`, `:3854`, `:3862`, `:3863`, `:4123`, `:6044`, each sitting beside an `escapeHTML()`-wrapped sibling on the same line. CODE-02 confirmed.

Ruling issued on all 40 WORK- items. No item is silent.

---

## Executive Decision

**No. This application is not fit for release.**

Two Critical defects are live and I have confirmed both in the source myself, not accepted them on report. Every income and expense edit throws a `ReferenceError` and fires the app's loudest, non-dismissible banner telling a user their financial data could not be read — which is false, and whose rational response destroys good data. Separately, record ids reach the DOM unescaped in nine places, turning the documented backup-restore path into stored script execution in the app origin. Both fixes are XS and S respectively; the build is roughly half a day of work from release-eligible on severity grounds. What is not half a day away is the reason both defects exist: the previous release gate introduced one of them and claimed to have closed the class the other belongs to, and a 13-of-13 checklist did not notice either.

---

## Release Gate Ruling

**The round-2 gate is CLOSED. I am not redefining it a third time.**

The round-2 gate had one subject: the planned-occurrence data model. That subject is closed and it is closed on independent evidence, not on self-assertion. Code Review re-walked A2 through A8 from source and confirmed all seven use the derived-occurrence path, and confirmed the ARCH-1 clamp at `index.html:3509-3520` is correct. The Stage 0 inventory did the job I made it a precondition for — it found A3, the Daily "None" chip, which no reviewer had raised, and that finding was demonstrated with a reproducible two-category case rather than asserted. That is the process working.

Moving that gate again because new, unrelated defects were found would be moving the goalposts, and it would teach the wrong lesson: that a gate never closes. A gate is scoped to a class of defect. That class is closed.

**I open a new release gate, R3, with exactly three items:**

| Gate item | Why it blocks release |
|---|---|
| WORK-01 | A core flow throws on every use and raises a false data-loss alarm. |
| WORK-02 | Script execution in the app origin via a first-class documented recovery path. |
| WORK-03 | Wrong financial dates in a second module, from a defect I already ruled on once. |

Total ~0.6 engineering day. Nothing else joins this gate. A gate that grows to eleven items is a sprint wearing a gate's clothes, and the eleven-item version is what produced WORK-01.

**R3 closes only when the three conditions in the next section are met.** A checklist is not a close condition. Ticked boxes are what we had last time.

---

## Verification Process Ruling

The Engineering Manager's central recommendation is that this decision should be spent on verification rather than architecture. **I approve that recommendation, and I reject the specific remedy the framing implies.** Three rulings, effective immediately, binding on all future work.

### V1 — A gate may not close on assertions about code the gate itself modified

`VERIFICATION.md` verified eight consumers of `db.planned` and verified them correctly. It could not have caught `okSave`, because the edit modal save handler is not a consumer of `db.planned` and was therefore not in the inventory — yet gate work touched it. The inventory bounded the *subject*; nothing bounded the *blast radius*.

**Rule:** before any batch of work is signed off, every top-level flow whose source lines were changed by that batch must be executed once, with the console visible, and the console must be clean. For this codebase the irreducible set is four flows: add income, edit income, add expense, edit expense. Not because they are the subject of any given change, but because they are the flows a personal finance app cannot ship broken. Cost: minutes. It would have caught WORK-01 on the first attempt.

### V2 — A claim to have closed a class must be stated as a predicate and re-run at close

CODE-02 exists because an earlier gate commit claimed to have swept the escaping class and the sweep was incomplete. "All ids are escaped" is not a claim, it is a search.

**Rule:** any commit or report asserting "all X" must name the mechanical search that proves it, and that search must be re-run and return zero at close, by the person closing. For WORK-02 that predicate is a grep for `${…id}` inside template literals with no `escapeHTML(` wrapper. When WORK-02 lands, the predicate and its zero result are recorded with it. This costs one command and removes the entire "half-swept class" failure mode.

### V3 — One development-time static check is authorised. Stage 2 is not promoted.

This is the ruling the Engineering Manager's framing invites me to get wrong, so I will be explicit.

Manual verification has now failed twice, in two different ways. But the two new defects are an **undeclared identifier** and an **unescaped template interpolation**. Neither is a calculation. The Stage 2 pure-logic module and test runner I authorised in round 2 would have caught **neither** — `okSave` lives in a DOM event handler, and CODE-02 lives in a markup template. Promoting Stage 2 on this evidence is preparing for the previous war. **Stage 2 remains deferred.**

What would have caught `okSave` instantly, statically, with no execution and no fixture, is a `no-undef`-class static check over the script. What would have caught CODE-02 is V2's grep.

**Narrow amendment to my standing "no build step" rule:** a static check is permitted provided it (a) is development-time only, (b) is not required to run, load or serve the application, (c) produces no artifact the shipped app depends on, and (d) leaves `expense-pwa/index.html` openable directly from disk. A linter is not a build step. The app must remain a single file that runs by being opened. Under those four constraints, one static check is authorised and I want it in place before feature work resumes.

That is the specific change to how work is verified: **V1 costs minutes per batch, V2 costs one command per claim, V3 costs one configuration file and removes a whole defect class permanently.** All three together are cheaper than the Stage 2 harness alone, and all three would have caught this round's regressions. Stage 2 would have caught none of them.

---

## Conflict Rulings

### C1 — "Planned Left": severity and direction of the fix

**Ruling: change the label to fit the arithmetic. Do not change the arithmetic. Adopt UI-08's no-plan state.**

`totalIncome - totalPlanned` is a correct and meaningful figure. CODE-18's alternative — planned minus actual-against-plan — is a *different* headline financial number on the primary screen, and introducing it means new arithmetic, new edge cases, and its own verification pass, to fix a label. The smallest change that removes the risk is the rename. Both reviewers independently recommended a rename; only one offered the alternative, and only as an aside.

Take UI-08's second half in full: render the no-plan case as "—" with a "No plan set" sub-line. The ambiguity between "no plan exists" and "plan fully consumed" is the part of this finding that actually misinforms a user, and it is the cheaper half.

WORK-11 is Medium (UI-08's severity governs, since it covers the user-visible defect), and the decision being made drops it from S to XS.

### C2 — The prescribed shape of the Critical fix

**Ruling: hoist the declaration, and assign it in both branches.**

`let okSave = true;` immediately before the `if (editCtx.kind === 'income')` branch at `index.html:6194`, with `:6246` assigning it — and `:6202` changed from bare `save();` to `okSave = save();`.

Both reviewers stopped one line short. UI-01 and CODE-01 as written leave the income branch never assigning, so `savedToast(okSave, 'Updated')` at `:6249` reports success unconditionally for income. That directly violates the contract the file states at `:2410` and that UI Review names as a Strength — "`savedToast()` never reports success for a write that did not land". Fixing the throw while leaving the lie in place is not a fix.

`index.html:6202` is already a raised finding: it appears in CODE-15's location list (WORK-38). This is not new scope, it is one variable, one function, one purpose. WORK-01 and the `:6202` line of WORK-38 land together. The rest of WORK-38 does not.

CODE-01's `const` variant is rejected: it forces the `savedToast` call to move, which changes control flow in the one function that most needs to change once and minimally.

### C3 — Whether to surface Planned as a product module now

**Ruling: three separate answers, because these are three separate modules and the reports have been treating them as one.**

I ruled in round 1 that `project.md` should be amended rather than three modules built. UI-02 rates the gap High and asks for real destinations. Both positions are partly right, and the reason they read as a conflict is that "give three modules destinations" bundles three unlike problems.

**Analytics — approve the rename.** The `daily` screen *is* analytics. It has a chart, a calendar heatmap, a stats strip and category chips. Retitling it in `titles` and the tab label is a string change that closes the gap for that module completely. This is neither building a module nor amending the vision; it is naming what already exists, and it is cheaper than either option I considered in round 1.

**Budget Planning — approve the entry point, after WORK-12 and WORK-13.** I ratify the Engineering Manager's dependency and I want the reasoning on record: promoting Planned mode to a named destination while the All Time planned total is anchored on today (CODE-05) and can silently truncate at 5,000 iterations (CODE-04) does not hide a defect, it advertises it. A named "Budget Planning" destination that reports a different number every day is worse for the user than no destination. WORK-12 and WORK-13 are one S-sized edit to the same function and land two steps ahead of it. The delay is measured in days, not sprints.

**Reports — reject. Amend `project.md`.** This is where my round-1 ruling stands unchanged. Nothing in the app produces a report, no product definition of "report" exists, UI-02 itself says do not stub it, and it is the only XL item in the roadmap. Building an XL module because a bullet list names it is the definition of work that should not be done. Move Reports to the Long-term Vision section of `knowledge/project.md`, alongside Cloud Sync and the Debt Planner, where the other unbuilt intentions already live.

The Engineering Manager's concern — "it will be the same finding in the fourth review" — is answered by this ruling, not deferred by it. After these three actions `project.md` names seven core modules and the app has seven destinations. The gap is zero, permanently, and it is closed for roughly one M-sized edit rather than one XL module.

### C4 — Which date mechanism survives

**Ruling: the custom picker survives for optional and clearable dates. Native `input type="date"` survives for required entry dates. Both stay. WORK-06 is not throwaway work.**

The two patterns are not an accident, they encode a capability difference. `expRecEnd` carries the placeholder "Tap — leave empty for unlimited": the field must be clearable, and "empty means unlimited" is semantically load-bearing. Native date inputs do not offer a clear affordance reliably across mobile browsers, and `openDatePicker()` already provides Clear and Today (`index.html:1882-1883`). Conversely, forcing the plain required entry date through a custom in-app sheet discards the OS picker, which is more familiar, better tested for accessibility, and free.

Unifying in either direction loses something real. This is recorded as a convention so the next review does not re-raise it: **optional or clearable date → custom picker; required entry date → native input.** WORK-30 is rejected on that basis. WORK-06 hardens the five custom-picker call sites that are here to stay, and it unblocks a flow that is currently impossible for keyboard users, not merely slow.

### C5 — Divergent read of the failure layer

**Ruling: both reviewers are right, about different things. The quarantine mechanism is an asset. `reportFatal`'s single message is the liability. I create no work, and I set a rule instead.**

UI Review is correct that quarantine, the save-failure banner, whole-file import rejection and the damaged-file download are better than most production apps ship. Code Review is correct that the same banner fires falsely from at least two paths and that its text drives a user toward destroying good data. These are not contradictory readings; one describes the mechanism, the other describes one string.

WORK-01 and WORK-39 remove both known false-fire paths, and both are approved. Neither reviewer raised the bluntness of `reportFatal` as a finding, and I will not invent one. I record it as a **risk**: the app has one message for "your database could not be parsed" and routes every uncaught error to it, so the next unrelated exception anywhere in 6,300 lines will again tell a user their financial history is gone.

**Standing rule, effective now:** the `#dataErrorBanner` text is reserved for load or parse failure of the database. No new `window.onerror` path, and no new failure surface, may reuse it. If a future change needs a general error surface, it gets its own words. That is a constraint on future work, costs nothing today, and is the durable half of the fix.

---

## Approved Improvements

34 of 40 items approved. Gate items marked **[R3]**.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-01** | Declare `okSave` **[R3]** | Verified in source. A core flow throws on every use and fires a false data-loss alarm. XS. Shape fixed by ruling C2 — both branches assign. |
| **WORK-02** | Escape the nine record-`id` interpolations **[R3]** | Verified in source. Script execution in the app origin through the documented restore path. Mechanical, matches the pattern the file already uses on adjacent fields. Closes with V2's predicate. |
| **WORK-03** | Route `computeNextRecurring` through `stepDate` **[R3]** | Correctness of financial data outranks everything. This is ARCH-1, which I ruled on in round 2, still live in a second module. One call-site change deletes the second recurrence engine and the regression together. |
| WORK-04 | Give Income a direct tab slot; move Goals to More | Income is a core module in `project.md`; Goals is not. The source comments and the onboarding copy both admit the cost. Two swapped slots. |
| WORK-05 | AA text tokens for currency figures and chips | `ui-guidelines.md` requires WCAG AA without qualification, and the stylesheet shows this was solved for `--text-2` and missed here. Foreground-only variants leave every fill and bar untouched — no redesign. |
| WORK-06 | Custom date fields openable by keyboard | The flow is blocked, not slow: a keyboard user cannot create a scheduled goal contribution at all. Ruling C4 confirms these five call sites are permanent. |
| WORK-07 | Analytics and Budget Planning destinations | Ruling C3. Renames and one More-sheet entry only. Closes two of the three module gaps for a string change. Hard dependency on WORK-12/13. |
| WORK-09 | Filtered lists must not claim the user has no data | The app states something false about the user's own financial records, and the rational response creates the duplicates `revealEntryDate()` exists to prevent. |
| WORK-10 | Dashboard leads with numbers, not filter chrome | Mobile-first and "most important information first" are both project principles; ~100px of a 390px first screenful is configuration. Scope held to hiding the two date inputs behind "Custom" and giving them visible labels. |
| WORK-11 | "Planned Left" caption and no-plan zero state | Ruling C1. Rename the label, render no-plan as "—". Arithmetic untouched. Now XS. |
| WORK-12 | All Time silently projects 12 months of planned spend | A headline figure that changes every day the app is opened is not a financial figure. Also converts `VERIFICATION.md` §5 from a one-time observation into a repeatable assertion — worth more than its Medium severity. |
| WORK-13 | Horizon ignores future-dated actuals; truncation not silent | Same function, same edit, same purpose as WORK-12: make the horizon well-defined. A mistyped actual dated 2099 currently vanishes a plan with no signal. |
| WORK-14 | Clamp `recIntervalDays` ≥ 1 at both entry points and in import | `coding-standards.md` requires input validation. A minus sign produces a plan that renders nothing and burns 5,000 iterations per pass. XS. |
| WORK-17 (part) | Debounce high-frequency whole-blob writes | Approved for the debounce only. A reorder drag writing the entire database per pointer move is a defect, not a scale concern. The IndexedDB half is deferred — see below. |
| WORK-18 | Service worker stale-while-revalidate for the shell | Offline-first is a stated project principle and the current handler contradicts it deliberately. Degraded connectivity, not offline, is the failure case. Condition: the revalidate path must still update the cache so deploys are picked up. |
| WORK-19 | Raise five control groups to 44×44 | Hard minimum in `ui-guidelines.md`, and the rest of the app honours it — these are exceptions, not house style. Mis-taps land on controls that commit records and move money into goals. |
| WORK-20 | Raise 9px/10px figures to the declared type floor | The scale declares 11px as the smallest step. Currency amounts are currently the smallest text in the app on the smallest screens. |
| WORK-21 | Hue-independent cue on Monthly Trend labels | Red/green as the sole key on a finance chart inverts meaning rather than degrading it for ~1 in 12 male users. Two characters, reusing an established pattern. |
| WORK-22 | Focus ring above 3:1 | One token value. Every focusable element in the app routes through it. |
| WORK-23 | Android Back closes a modal | **Narrowed to modals only.** Mobile-first: the most-used control on the primary platform currently dismisses the app mid-flow and discards typed input. `modalStack` already exists, so this is wiring. Screen-level history is deferred. |
| WORK-24 | Preserve amount, notes, category across Actual/Planned | Silent loss of typed input in the most frequent flow. XS. |
| WORK-25 | Appearance card in Settings; correct More subtitle | The menu advertises two things the destination does not contain. Sixteen themes were built and hidden behind an unlabelled glyph. XS. |
| WORK-26 | History button on the Salary screen | A core module's saved output is reachable only through a panel whose own helper text describes it as a non-reversible force-clear tool. XS, reuses `openSalaryHistory()`. |
| WORK-27 | Expand SI/WHT; delete duplicated Breakdown tiles | `project.md` states every screen must be understandable without training for users with little accounting knowledge. This is the clearest deviation from the project's own definition of its audience. |
| WORK-28 (scope reduced) | Retire off-scale radii and spacing | Approved **as a convention with no scheduled effort**: replace off-scale values only in blocks another approved item is already opening. No sweep — that violates my standing rule. The only scheduled part is deleting the two dead tokens (XS). |
| WORK-29 | Salary summary inherits the hero hierarchy | The headline figure on the Salary screen renders visually weaker than its own caption. Adding one class fixes it. XS. |
| WORK-32 | Tab accessible names match visible labels | WCAG 2.5.3 Label in Name is a conformance item, not a preference. Lands inside WORK-04/07 because it edits the same twenty lines. |
| WORK-33 | Separate maskable icon; text runs to paths | The installed icon is the first thing a user sees and it clips under a circular mask. Isolated, no application code touched. |
| WORK-34 | Remove `_virtual` / `_seriesId` | Dead data written on every projected occurrence, with a migration maintained for a field no reader consumes. Approved for **removal only** — the guard alternative is new behaviour nobody asked for. Migration `toV2` stays for files in the wild. |
| WORK-36 | `wireIconGrid` document-listener leak | Unbounded growth of capturing handlers, each pinning a detached DOM node, in an installed long-lived PWA. XS. |
| WORK-37 | Round salary-derived income at the write boundary | Stored and displayed values currently disagree for one collection, and rows can fail to sum to their own total. Rounding belongs at the write boundary. Backward compatible: existing records already display rounded. |
| WORK-38 (narrowed) | Check `save()`'s return on the delete paths | Approved for the **delete paths and `:6202` only**, as CODE-15 itself recommends "at minimum". The reorder, theme and notification-preference paths report nothing, so there is no false success to correct, and `writeDb` already raises the banner. |
| WORK-39 | Guard the three converter `localStorage.setItem` calls | The second known false-fire of the corrupt-data banner. Picking a currency in private browsing should not tell a user their financial history is unreadable. XS. |
| WORK-40 | Validate `recAmount` / `recFrequency` in `goalProblem()` | ₮NaN on a finance screen, from a file the validator accepted. Lands with WORK-14 as one validator sweep. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-08** | Reports as a real module (XL) | Ruling C3. No product definition of "report" exists, UI-02 itself says do not stub it, and it is the single largest item in the roadmap — roughly a fifth of the total — justified only by a bullet in a vision list. `project.md` is a statement of intent and it is cheaper and more honest to correct the document than to build an XL module to satisfy it. **Replacement action, approved:** move Reports to the Long-term Vision section of `knowledge/project.md`. This closes the finding rather than parking it, and it is what stops the same item appearing in the fourth review. |
| **WORK-30** | One date-entry mechanism per form | Ruling C4. The two patterns encode a real capability difference — clearable/optional versus required — and unifying in either direction loses something the flows depend on. The inconsistency has a reason; it is now a recorded convention rather than a defect. |
| **WORK-31** | Illustrated empty states for two Settings lists | Preference. Nothing fails, no guideline mandates illustrated empty states, and UI-21 itself concedes the plain variant is correct in most of its own locations. S effort for zero removed risk. Work not done is the cheapest work there is. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-15** | Cloud load through `importProblem` → `writeDb` → `load()` | Cloud Sync remains quarantined by my round-1 ruling: hidden while unconfigured, not repaired, not deleted, not extended. The path is unreachable — `firebaseConfig` is empty and `isFirebaseConfigured()` gates it — so there is no risk to remove today. **Converted into a hard precondition instead of scheduled work: no build may ship with Firebase configured until WORK-15 and WORK-02 have both landed.** The trigger is the decision to enable Cloud Sync, and that decision is not mine to make unilaterally. Repairing dormant code before that decision exists is speculative work on a feature that may change shape entirely. |
| **WORK-16** | Index Daily chart and calendar by date | The Code Review states plainly that nothing is wrong today at a few hundred records. M effort against zero present user impact is premature optimisation, and `coding-standards.md` says so directly. The fix — two `Map` builds — will be identical whenever it is needed. **Trigger:** a real database exceeding roughly 5,000 actual expenses, or an observed interaction delay on the Daily screen. |
| **WORK-17 (IndexedDB half)** | Record IndexedDB as a migration target | Not work. A note in the roadmap, as the Code Review itself recommends. Replacing the store is exactly the rewrite my standing rules forbid when a refactor removes the same risk, and the debounce removes the risk that exists today. **Trigger:** a real blob approaching 2 MB, or the storage-status reading crossing 50% of quota for an actual user. |
| **WORK-23 (screen half)** | Screen-level back navigation history | The modal half removes the damage — losing typed input and being ejected from the app mid-flow. A screen-level history stack is a larger design question with its own failure modes (double-back, navigation while a modal is open) and no user is losing data to it. **Trigger:** the modal fix landing and users still reporting disorientation on Back. |
| **WORK-35** | Extract one shared `initReorder` | Two implementations that have drifted only in comments. Extraction now is a refactor with no defect behind it. **Trigger:** the next behavioural change to either reorder path — most likely keyboard-accessible reordering — at which point extract first and change once. |
| **Stage 2** | Pure-logic module and test runner | Authorised in round 2, **not promoted, and explicitly not promoted on the evidence of this round.** Neither new defect is a calculation: one is an undeclared identifier in a DOM handler, one is an unescaped template interpolation. Stage 2 would have caught neither, and V3's static check catches the first for a fraction of the cost. **Trigger:** the first defect that a pure-logic unit test would have caught and that V1–V3 would not — that is, a *calculation* defect surviving a review. That trigger has not fired. |

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework. No runtime build step. No bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations; existing migration steps are immutable because files exist in the wild that depend on them. Offline-first. Mobile-first. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever.

**What changes.**

1. **One recurrence engine.** When WORK-03 lands, `stepDate` is the only permitted definition of a recurrence step. Any future work — the Debt Planner or Savings Planner named in the vision, or anything else — that introduces a second stepping implementation is rejected on sight. Two engines produced ARCH-1 twice; the second occurrence is a High finding in this very report.
2. **One development-time static check**, under the four constraints in V3. This is a narrow, deliberate amendment to the no-build-step rule and it does not open the door to a build pipeline.
3. **`knowledge/project.md` is corrected.** Reports moves to Long-term Vision. Analytics and Budget Planning are named as the destinations that exist. After this the document describes the product, and the largest gap between what this app says it is and what it is closes without building anything.
4. **Two new standing rules,** both zero-cost and both permanent: `#dataErrorBanner` text is reserved for database load/parse failure and may not be reused by any new error path (ruling C5); and the date convention from ruling C4 — optional or clearable date uses the custom picker, required entry date uses the native input.

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports. Enabling Firebase. Splitting `index.html` beyond the single sibling pure-logic module authorised in round 2 — which remains authorised and remains unexercised. Any large mechanical sweep across the file. Any `render*` function calling `save()`.

**And one thing I am explicitly declining to do.** The Code Review names 34 mutable module-level globals and a render layer that reads filter state out of DOM inputs, and calls it the reason the CODE-01 class of defect was possible and the reason cross-screen agreement can only be checked by hand. The Engineering Manager offers it as the one structural investment that would change the shape of the next report. It is a fair diagnosis and I am rejecting the remedy for this quarter. Extracting filter state into a state object and threading it through every renderer is a rewrite of the render layer in all but name, in a 6,300-line single file, with no test harness underneath it — and the last two rounds have demonstrated exactly what happens when large changes land in this codebase without one. The specific consequence the reviewer names, undeclared identifiers surviving into shipped code, is removed entirely by V3 at approximately one percent of the cost. **I am recording the module-boundary problem as a real long-term risk, not creating work for it, and not pretending it has gone away.** It is the leading candidate for the quarter after this one, once the static check and, if its trigger fires, Stage 2 are underneath it.

---

## Executive Report

The application is not fit for release, and it is close. Two Critical defects, both verified by me against source rather than accepted on report, block it: an undeclared `okSave` at `index.html:6246` that throws on every income and expense edit and raises the app's most alarming banner for a non-event, and nine unescaped record-id interpolations that turn backup restore into stored script execution. Together they are about half an engineering day. Under them the architecture is sound and both reviewers say so independently from different evidence — atomic writes, correct quarantine, numbered migrations, whole-file import rejection, a real focus trap, and a planned-occurrence model that Code Review re-verified from source across all eight consumers and found correct.

The round-2 gate did its job and I am declaring it closed. Its subject — occurrence-blind readers of `db.planned` — is closed on independent evidence, and the Stage 0 inventory I made a precondition earned its cost by finding the Daily "None" chip that no reviewer had looked at. What failed was not the gate's subject but its edges: gate work modified the edit modal, which was outside the inventory by construction and therefore outside every one of the thirteen checks, and a commit claimed to have swept the escaping class without re-running the search that would have proved it. Both failures are cheap to close permanently, and I have closed them as process rulings V1, V2 and V3 rather than as a fourth gate.

I have deliberately not promoted the Stage 2 test harness. The instinct — verification failed twice, so build the test infrastructure — is the right instinct pointed at the wrong target: neither new defect is a calculation, and a pure-logic module would have caught neither of them. A static check catches the first class outright, and a grep catches the second. That is the smallest change that removes the actual risk, and it is the decision I most want on the record from this round.

Of 40 items I approved 34, rejected 3 and deferred 3, plus two half-items. The rejections are the XL Reports module (correct the vision document instead — it costs a paragraph and permanently closes the gap that has now appeared in three consecutive reviews), the date-mechanism unification (the inconsistency encodes a real capability difference and is now a recorded convention), and illustrated empty states in Settings (preference, no failure). Excluding rejected and deferred work the approved roadmap is roughly twelve to thirteen engineering days, of which the release gate is 0.6.

---

## Implementation Priority

Build order, with the reasoning for the order. Nothing outside R3 begins before R3 closes.

**Step 0 — Adopt V1, V2, V3. No code.** The static check goes in first, before any fix, because it is the thing that proves WORK-01's class is gone rather than asserting it, and because installing it after the fix proves nothing.

**Step 1 — WORK-01 [R3].** First, and alone. Every edit currently throws and leaves a session-persistent banner reading "your saved data could not be read". Any manual verification of any other item is performed against a screen already lying to the verifier. Nothing else can be honestly signed off until this lands. The C2 shape applies: hoist, and assign in both branches.

**Step 2 — WORK-02 [R3].** Second, because it is the demonstration case for V2: the commit records the search predicate and its zero result. Also before anything touching cloud or import.

**Step 3 — WORK-03 [R3].** Third. Financial date correctness, and it deletes the second recurrence engine on the way past, which is the structural half of its value.

**GATE R3 CLOSES.** Conditions: the three items land, one commit each; V1's four write flows are executed with a clean console; V2's predicate returns zero. Then, and only then, the build is release-eligible on severity grounds.

**Step 4 — WORK-39.** Immediately after the gate, not in it. XS, and it removes the last known false-fire of the same banner the gate just stopped firing. Finishing the symptom while it is fresh.

**Step 5 — WORK-12 + WORK-13, as one edit.** Same function, same purpose: make the planned horizon well-defined. This is the highest-value non-gate work in the roadmap because it does two jobs — it makes a headline figure reproducible for the user, and it makes `VERIFICATION.md` re-runnable to a fixed expected value instead of one that moves with the calendar. It also unblocks two later items.

**Step 6 — WORK-14 + WORK-40, as one validator sweep.** Both extend the import validators with recurrence-field checks. One pass, one verification.

**Step 7 — WORK-11.** Now unblocked: C1 is ruled and WORK-12 has stopped the underlying quantity from moving. Renaming a tile whose value changes daily would have been renaming a moving target.

**Step 8 — WORK-04 + WORK-07 + WORK-32, as one edit, plus the `project.md` amendment.** All three touch the same tab markup, the `MORE_TABS` array and the `titles` map. Sequencing them apart means three rounds of friction over twenty lines, and WORK-32's job — one word serving tab text, `aria-label` and header title — can only be settled once the final tab set exists. The `project.md` amendment lands in the same change because it is the other half of ruling C3, and after this step the document and the application agree.

**Step 9 — Accessibility batch: WORK-05, WORK-06, WORK-19, WORK-20, WORK-21, WORK-22.** Grouped because they share one verification pass — a contrast and target-size sweep of the same screens — not because they are one change. Each lands as its own commit.

**Step 10 — Honesty and clarity batch: WORK-09, WORK-10, WORK-24, WORK-25, WORK-26, WORK-27.** Everything in this group stops the interface either misinforming the user or hiding something it already built.

**Step 11 — Platform: WORK-18, WORK-23 (modals only), WORK-33.** Offline-first, Android Back, and the installed icon. These touch `sw.js`, the modal stack and `manifest.json` respectively — three different surfaces, three separate changes, deliberately after the correctness work.

**Step 12 — Hygiene, XS batch: WORK-17 (debounce), WORK-29, WORK-34, WORK-36, WORK-37, WORK-38 (narrowed), plus the two dead-token deletions from WORK-28.** Last because none of them changes anything a user experiences today, and each is small enough to ride along with whatever else opens its file. WORK-28's remaining scope is a convention, not a task, and never a sweep.

---

## Recommended Next Action

**Approve gate R3 — WORK-01, WORK-02, WORK-03 — together with process rulings V1, V2 and V3, and authorise the single development-time static check under the four constraints stated above.** Nothing has been started and nothing should be until you say so. The order matters: install the static check first, then fix `okSave` and confirm the check would have caught it, then the escaping sweep with its predicate recorded, then the recurrence engine. That is roughly half a day of code plus a configuration file, it makes the build releasable on severity grounds, and it is the only sequence that closes this round's defects while also closing the reason they were possible. Do not let anything else into this gate — the eleven-item version is what produced the Critical we are now fixing.
