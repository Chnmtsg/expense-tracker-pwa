# Chief Architect — Final Engineering Decision

**Round 4.** Sources read in full: `D:\3_Claude\PowerApps\reports\ui-review.md` (16 findings, 73/100), `D:\3_Claude\PowerApps\reports\code-review.md` (12 findings, 90/100), `D:\3_Claude\PowerApps\reports\engineering-manager.md` (26 items WORK-41..WORK-66, conflicts C6–C10). Also read: `knowledge/review-conventions.md`, `knowledge/project.md`, and my own round-3 report before ruling on anything it governs.

Verified independently against source before ruling, not accepted on report:

- `expense-pwa/index.html:787` — `width: 100%` in the shared `button.primary, button.secondary, button.danger` rule; `:1649-1650` — `#sSave` carries `style="flex:1"` and `#sHistory` carries nothing. UI-03 confirmed.
- `expense-pwa/index.html:4566` `const ok = save();` … `:4568` `savedToast(ok, 'Cleared');` … `:4574` `toast(\`${r.label} cleared\`);` — unconditional, eight lines later. CODE-01 confirmed.
- `expense-pwa/index.html:4699-4700` — `db.categories = db.categories.filter(...); save(); renderSettings(); renderDashboard();`. Return discarded, no toast. UI-14/CODE-02 confirmed.
- `expense-pwa/index.html:5170` — `renderDashboard()` writes `hdrSub` unconditionally; `:3740` — `navigate()` clears it. UI-05's second half confirmed: the Dashboard's period can be printed under another screen's title.
- `expense-pwa/index.html:6960` — the init block calls `renderDashboard()`, never `navigate('dashboard')`. CODE-10 confirmed.
- Contrast measured myself, not taken on trust: Nord `--primary: #88C0D0` (`:351`) against `#fff` = **2.00:1**. Default `--danger: #EF4444` against `#fff` = **3.76:1**. UI-01's numbers are accurate.
- `:688-692` — the hero scrim comment asserting the flat overlay works "in all 16 themes". This is the measured claim the Engineering Manager flagged, and it is the third artifact this project has shipped that asserts a swept class without a search behind it.
- `package.json:7-9` — one script, `lint`. `check-escaping` appears nowhere. CODE-09 confirmed.
- Grep for `on-accent|--primary-text|--hero-scrim` across `index.html` returns zero. The tokens UI-01 and UI-02 ask for genuinely do not exist.

Ruling issued on all 26 items. No item is silent.

---

## Executive Decision

**No — and it is three XS fixes away from yes.**

There is no Critical finding in either report, both round-3 Criticals are verified closed against source by a reviewer who re-walked them rather than reading the commit message, and no figure is wrong, no data is lost, and no module is unreachable. What I will not sign is a release that ships a visibly mangled primary action on a named core module which this project's own last batch introduced, alongside two paths that tell the user a destructive write succeeded when it did not — one of which is the round-3 fix being defeated on the very line it was applied to. Those three defects total three-quarters of a day and every one of them is a regression or an omission from the batch that was supposed to close this class. The contrast work is a genuine High and it is genuinely bad in the themes it hits, but non-default themes are opt-in, the default theme's primary button passes, and an accessibility deficit is a quality release, not a release blocker. The durable finding of this round is not any of the sixteen defects: it is that three counted sweeps miscounted and one measured claim was never measured, which is the fourth consecutive round in which an assertion of completeness was wrong.

---

## Release Gate Ruling

**Gate R3 is closed and stays closed.** Its three items landed, both Criticals are verified against source, `tools/lint.mjs` and `tools/check-escaping.mjs` exist and both return zero. The process worked at the level I set it at.

**I open gate R4 with exactly three items, all XS.**

| Gate item | Why it blocks release |
|---|---|
| WORK-43 | A named core module renders its primary action at ~87px with a wrapped label, introduced by the last batch. |
| WORK-44 | A destructive clear reports success unconditionally, defeating WORK-38 on a path WORK-38 was applied to. |
| WORK-45 | The seventh delete path — destructive, irreversible, and the only mutation in the app that reports nothing. |

Total ~0.75 engineering day. Nothing else joins. All three share one property that earns them the gate over higher-severity work: each is a defect the previous release batch created or missed while claiming to have closed its class. Shipping those is how a project teaches itself that gates are theatre.

WORK-41 and WORK-42 are **not** in this gate. They are the first work after it.

---

## Verification Process Ruling

V1, V2 and V3 stand unchanged and are now doing measurable work — the escaping class did not reopen, and the class of defect V3's static check covers did not recur. The Engineering Manager asks two questions on its own initiative. Both are the right questions and both get a ruling.

### V4 — "All 16 themes" gets a predicate. One new static check is authorised.

WORK-41's close condition is an "all X" claim of exactly the shape V2 governs, and V2 has no mechanical form for it. The evidence that prose cannot carry this claim is in the source: the comment at `:688-692` states the scrim reaches AA in all 16 themes, a human wrote it in good faith, and measurement contradicts it.

**I authorise a second development-time static check, `tools/check-contrast.mjs`, under the identical four constraints from V3** — development-time only, not required to run or serve the app, produces no artifact the app depends on, `index.html` still opens from disk. Its scope is deliberately narrow and I am fixing that scope here so it does not grow into a CSS engine:

- It reads the sixteen theme blocks, which are flat `--token: #hex;` declarations and already machine-readable.
- It holds an **explicit table of (foreground token, background token, minimum ratio)** triples, maintained in the tool by hand.
- It computes WCAG ratios, including alpha-compositing a scrim token over a background token, which is arithmetic over two declared tokens and therefore in scope.
- It exits non-zero on any triple below its minimum.
- It does **not** parse CSS rules, resolve the cascade, follow `color-mix`, or infer which pairs matter. A human decides the pairs; the machine does the arithmetic and the counting, because the arithmetic and the counting are what humans got wrong.

The pair table is a deliverable of WORK-41 and WORK-42, not a prerequisite. This is my **second and last** amendment to the no-build-step rule this quarter. Two checks is a habit; a third would be a pipeline.

### V5 — "All delete paths report their outcome" gets a predicate, and it is an allow-list.

This class has now failed twice in one round: a sweep of "six delete paths" missed a seventh, and the fix was defeated on a path it had been applied to. Counting call sites by hand is the failure mode, so the predicate must not require counting.

**Rule: a bare `save();` statement is forbidden unless it appears on an explicit allow-list recorded in `VERIFICATION.md` with a one-line reason.** The search is `save();` not preceded by an assignment. Every hit must be on the list; the check fails on any hit that is not. This does not force ceremony onto the three preference paths I ruled last round need no toast — those go on the list with their reason, once. A new unreported write fails loudly on the first run, which is the only property that matters.

I am explicitly **not** requiring that every `save()` be followed by `savedToast`. That would be a rule about outcome messaging masquerading as a rule about writes, and it would put a toast on the reorder drag.

### What I am not doing

I am not creating a predicate for "the fix was not defeated later in the same handler" (CODE-01's actual shape). No mechanical search expresses that. It is caught by reading the handler you edited from top to bottom, which is V1's job, and V1 already requires executing the flow.

**Stage 2 remains deferred.** Trigger unchanged and unfired: the first calculation defect that a pure-logic unit test would have caught and V1–V5 would not. Nothing in this round is a calculation defect.

---

## Conflict Rulings

### C6 — 73 versus 90, and which governs release

**Ruling: neither score governs release. I do. Both scores are correct and they are answers to different questions.**

Code Review's 90 is correctly applied: the convention's 90-100 band is defined as "no Critical or High findings," and Code Review found none in its own domain. UI Review's 73 is correctly applied: three High findings puts it squarely in "usable but fragile." Neither reviewer misread the table. The table simply does not compose across two reports, because each reviewer scores the surface they inspected, and the convention has no rule for combining them. I am not going to invent one, and I am certainly not going to average them.

**The build as a whole carries three High findings, so the build is not in the production-ready band. It carries no Critical, so nothing in the convention blocks its release.** The convention says exactly one thing about release and says it once: Critical blocks. High does not.

So the release decision falls to judgement, and my judgement is stated in the Executive Decision. It does not turn on the scores at all. It turns on the fact that three of this round's findings are damage from the last batch, they are XS, and no user is waiting on this build.

**What to tell the team about WORK-41:** it is a two-and-a-half-day accessibility item, scheduled first after the gate, not a release blocker. And one standing rule attaches to it, effective now and costing nothing: **no seventeenth theme ships until `check-contrast.mjs` exists and covers it.** Sixteen themes reached production without a single measurement of text-on-fill; that is the property to stop, and stopping it is cheaper than the item itself.

### C7 — Category delete: Low or Medium

**Ruling: Medium governs. Both severities stand as recorded; neither reviewer's severity is altered.**

Severity describes impact. UI-14 rated the consistency of the interface — the user gets no confirmation — and Low is right for that. CODE-02 rated the failure mode — a destructive, irreversible write can fail with no message at all, and the category returns on reload while the entries it re-pointed at "Unknown" appear to have re-pointed back — and Medium is right for that. These are not competing estimates of one impact; they are two impacts, and when one site carries two, the worse one sets the schedule. That is the rule the Engineering Manager applied and it is correct.

The disagreement changes nothing operationally — same site, same one-line fix, same XS — so I want to be clear why I am ruling anyway rather than waving it through: it is the *gate* decision that this changes. A Low does not enter a release gate. A Medium on a destructive path that a counted sweep missed does.

### C8 — Cold-start header: Medium or Low

**Ruling: split the item by half rather than picking a severity. The cold-start title is Low. The subtitle is Medium. Both land in one edit and the item is scheduled as Medium.**

I verified both halves. The title mismatch at `:6960` is cosmetic and self-corrects on the first navigation — CODE-10's Low is right, and UI-05 does not offer evidence that it costs more than that. The subtitle half is different in kind, and I confirmed it: `renderDashboard()` writes `hdrSub` unconditionally at `:5170`, `navigate()` blanks it at `:3740`, and `renderDashboard` is reached from paths on other screens. The result is the header printing the **Dashboard's** date range under the **Income** screen's title. The subtitle is the only place the app states which period the numbers on screen cover. Printing the wrong period is the app making a statement about the user's money that is not true, and this project's ordering principle is that correctness of financial information outranks everything else — including, here, the fact that no figure itself is wrong.

CODE-10 did not raise the subtitle half at all, so there is no Code Review severity to weigh against UI-05's Medium on it. There is no conflict on the half that matters.

### C9 — CODE-05 against my standing ruling C5

**Ruling: this is new evidence, not a re-raise. C5 stands and is extended. WORK-48 is approved, narrowed to the minimum variant.**

C5 declined to create work for `reportFatal`'s *bluntness* — a quality judgement about one message being too alarming for general use — and I still decline that. CODE-05 is not that finding. It is that the banner renders three claims in one paragraph and two of them are false on any `window.onerror` path: "could not be read," "started empty," "has not been changed." A message that contradicts itself is a defect with evidence, not a preference, and Code Review is right that my own standing rule is being violated by existing code today. C5 was written forward-looking — "no *new* `window.onerror` path may reuse it" — and I now see that the existing path already did. That is my omission, not a reviewer's overreach.

**I restate the rule precisely so it cannot be read the narrow way again: the `#dataErrorBanner` *words* are reserved for database load or parse failure. The *element* may be reused, provided the path that raises it rewrites every claim the element renders.** Reserving the element was never the point; reserving the sentences was.

**I reject the separate-banner-element variant** Code Review prefers and approve its stated minimum. A second banner element means new markup, new visibility state, and a lifecycle question the existing banner does not have — the data-error banner is non-dismissible and cleared only by a successful write, which is exactly wrong for a general runtime error. That is a design decision hiding inside an S estimate. Having `reportFatal` rewrite the `<b>` headline as well as the note makes the banner say one true thing, costs XS, and removes the entire risk. Smallest change that removes the risk; the rewrite is not warranted where the refactor does the same job.

### C10 — CODE-06 against deferred WORK-16

**Ruling: CODE-06 is not WORK-16 — and it gets the same answer. WORK-49 is deferred, and I am widening the trigger so this does not return a third time under a fourth name.**

Code Review and the Engineering Manager are both right that these are different items. Different function, different screen, different cost profile, and WORK-16's trigger as I wrote it names the Daily screen, which this is not on. Folding it under that trigger would be dishonest bookkeeping.

But the Engineering Manager scheduled it as new work at P2 and that does not survive my own reasoning for deferring WORK-16. CODE-06 reports no observed delay. Its impact is a projection — 180,000 `Date` allocations at 5,000 records — on a store that today holds a few hundred. `coding-standards.md` names premature optimisation directly, and I deferred an identical claim eight weeks ago on identical evidence. Approving this one because the arithmetic in its impact paragraph is larger would mean the deferral bar is set by how alarming a projection sounds. The fix — one `slice(0,7)` and one `Map` — will be byte-for-byte the same whenever it is genuinely needed.

**I am replacing WORK-16's site-specific trigger with a class-wide one, covering both items and any successor:** a measured render exceeding 100ms on a mid-range device on the Dashboard or Analytics screen, **or** a real database above 5,000 actual records. Either fires both WORK-16 and WORK-49 together, and they are done in one pass because they share a verification.

---

## Approved Improvements

23 of 26 items approved. Gate items marked **[R4]**.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-43** | Shared button rule's `width: 100%` **[R4]** | Verified at `:787` and `:1649-1650`. A named core module ships a mangled primary action, introduced by the last batch. Three inline overrides. **Narrowed** — see Rejected for the `.btn-block` half. |
| **WORK-44** | Force-clear reports success unconditionally **[R4]** | Verified at `:4566-4574`. A destructive write is reported as successful when it did not land, and it is the round-3 fix being overwritten eight lines below itself. Delete one line. |
| **WORK-45** | Category delete: seventh path, no `save()` check **[R4]** | Verified at `:4699-4700`. Ruling C7 — Medium governs. Destructive, irreversible, and the only mutation in the app that reports nothing at all. |
| WORK-41 | `--on-accent`/`--on-danger`/`--on-success` + per-theme hero scrim | I measured it myself: Nord primary 2.00:1, default danger 3.76:1. `ui-guidelines.md` requires WCAG AA without qualification. Foreground tokens and a scrim alpha only — no redesign, `--primary` untouched. Closes under V4's predicate. |
| WORK-42 | `--primary-text` per theme; eleven foreground call sites | Same class, same blocks, same measurement pass as WORK-41. In four themes the only indicator of which tab you are on is below AA. |
| WORK-46 | Validate `recLastDone` and `recLastLogged` | Financial date correctness through the import path. A 20,000-iteration walk per planned entry per badge refresh, and the ₮NaN class returning through the sibling fields the last sweep did not reach. Two lines; the idiom is three lines above each insertion point. |
| WORK-47 | Guard the exchange-rate cache read and write | Same seam and same reasoning as WORK-39, which I approved last round, in the one function that was missed. A partial write kills the converter permanently; private browsing discards a fetch that succeeded. |
| WORK-48 (narrowed) | `reportFatal` rewrites the headline as well as the note | Ruling C9. The banner currently makes three claims about the user's financial history and two are false. **Approved as the minimum variant only** — rewrite both strings, no second banner element. XS, not S. |
| WORK-50 | Analytics day tap: preserve `scrollLeft`, scroll detail into view | The primary interaction of a core module appears to do nothing and discards the scroll position the user worked to reach. Users conclude the chart is not tappable. XS, one function. |
| WORK-51 | Header names the screen and the period you are on | Ruling C8. Verified: `renderDashboard()` writes `hdrSub` unconditionally at `:5170` and is reached from other screens. The header can state a period unrelated to the visible list, and it is the only place the period is stated. |
| WORK-52 | The Expenses tab must not land on Budget Planning | This is the cost of my own ruling C3 surfacing, and it is fair. The tab bar is the one control whose destination must be unambiguous; `expMode` is sticky module state that nothing resets. One line in `navigate()`, co-edit with WORK-51. |
| WORK-53 | Category tag text below AA over `--surface-2` | The tokens were derived against `--surface` only and the tags render on `--surface-2`. Rides the WORK-41/42 measurement pass under the standing WORK-28 convention — the blocks are already open. |
| WORK-54 | Kingfisher `--text-2` fails on `--surface-2` and `--bg` | One theme, one value, and it is the only theme of sixteen carrying no measurement comment. Same open blocks. XS. |
| WORK-55 (narrowed) | Calendar cells and icon grid below 44px | 44px is a hard minimum in `ui-guidelines.md` and I enforced it last round on WORK-19; these are exceptions, not house style. Approved primarily on the **date picker**, where a mis-tap writes a wrong date into a goal deadline or a plan end date. **Narrowed to the gap and padding values named** — no calendar redesign. |
| WORK-56 | Accessible names for converter, search and quick-amount inputs | `<label for>` pointing at a `<button>` is a broken association, not a missing nicety: the code was written to provide a name and does not. The converter is the app's only route for foreign-currency entry. XS. |
| WORK-59 | Icon grid opens on `focus`, inserting 32 tab stops | A keyboard user traverses 32 emoji buttons on every pass through the Goals form, and the grid opens when they were only tabbing through. Open on `click`. One word. |
| WORK-60 | Quarantined copies accumulate without bound | Unbounded full-blob copies against a ~5 MB quota, in the exact situation — a corrupt store — where the user can least afford to hit quota. They also hold the user's financial history in a key nothing will read again. Keep at most one. |
| WORK-61 | Correct the coverage claim in `check-escaping.mjs` | This is V2's failure mode one level up: a false premise about coverage recorded in the artifact a future contributor reads before extending those templates. Correcting a comment is the cheapest fix that exists. **The `:2398-2400` `normalizeGroup`/cloud comment rides in this item** — same purpose, same class, one edit. |
| WORK-62 | `check:escaping` and `verify` scripts, named in `VERIFICATION.md` | **Promoted to Step 0.** Verified: `package.json` defines one script and `check-escaping` is referenced nowhere in the repo. A predicate with no entry point is not a predicate, it is a file. V2, V4 and V5 all depend on this existing. |
| WORK-63 | Record ids interpolated into CSS selectors | The same "record data reaches a parser unescaped" class the attribute sweep closed, in a parser the sweep does not look at, and it surfaces as the false data-loss alarm of WORK-48. Lands with WORK-48. The `querySelectorAll().find()` form needs no new API. |
| WORK-64 (narrowed) | Delete dead identifiers | Approved for `EMPTY_ICONS.category`, `EMPTY_ICONS.calendar`, `updateBellBadge`'s unused `return`, and `isoDate`. **`fbApp` is excluded** — see Rejected. No sweep, and `no-unused-vars` stays off. |
| WORK-65 (scope reduced) | Add `--t-display` and `--t-hero` | Approved for the **two token additions only**, and only if at least one existing literal is switched in the same edit — the 36px hero and the 30px converter result — so the tokens ship live rather than dead. The 72 literals are convention-bound. |
| WORK-66 (scope reduced) | Add `--r-bar` | Approved for the **one token addition** with its existing bar radii switched, same condition. The twelve radii and six paddings are convention-bound. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-58** | Default an unset theme to dark when the OS prefers dark | Preference, and the problem it names was already solved. The finding's own impact claim is speculation about a hundred thousand users who do not exist, and its premise — that a user must "discover the unlabelled palette glyph" — was made false last round by WORK-25, which put a labelled Appearance card in Settings. Nothing fails. It also makes first-run behaviour vary by device, which makes every future first-run report ambiguous forever, for an S. Work not done is the cheapest work there is. |
| **WORK-43 (second half)** | Move `width: 100%` to a `.btn-block` modifier | Rejected as a change; approved as a convention. Removing the declaration from the shared rule requires adding `.btn-block` to every full-width button in a 6,900-line file — a large mechanical sweep, which my standing rule forbids, with a regression surface of every button in the app, to prevent a fourth instance of a defect that has occurred three times in two years of file history. **Recorded as a convention instead, at zero cost: a button placed beside another element must carry an explicit width.** |
| **WORK-64 (`fbApp`)** | Delete the unread `fbApp` assignment | Cloud Sync is quarantined under my round-1 ruling — hidden while unconfigured, not repaired, **not deleted**, not extended. `fbApp` is quarantined code and holding the `initializeApp` return is conventional in that library. Deleting it is touching a module I have ruled untouchable, to remove one identifier. |
| **WORK-65 (sweep)** | Retire 72 off-scale `font-size` literals | Bound by the standing WORK-28 convention and the no-large-mechanical-sweep rule. The finding itself concedes "no individual size is wrong." M effort, Low severity, zero removed risk, and a diff touching 72 lines of a file with no test harness under it — which is precisely the shape of change that produced the last two rounds of regressions. |
| **WORK-66 (sweep)** | Retire twelve radii and six card paddings | Same ruling, same reason. "Adjacent cards have visibly different corner softness" is polish. Replace off-scale values only in blocks another approved item is already opening. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-49** | Bucket Monthly Trend by `YYYY-MM` key | Ruling C10. Not the deferred WORK-16 — different function, different screen, different cost profile — but the same evidence standard, and it does not meet it: no observed delay, a few hundred records in real stores, and an impact stated entirely as a projection. **Trigger (now class-wide, replacing WORK-16's site-specific one, and governing both items): a measured render above 100ms on a mid-range device on the Dashboard or Analytics screen, or a real database above 5,000 actual records.** Either fires WORK-16 and WORK-49 together, in one pass, because they share a verification. The fix will be identical whenever it lands. |
| **WORK-57** | Keyboard path for category and income-type reordering | The exclusion is real and I am not dismissing it. But it is Low severity as the reviewer set it, it is the largest remaining item at M, and it is not a blocked *creation* flow — the comparison is WORK-06, which I approved because a keyboard user could not create a scheduled contribution at all. Categories exist and are fully usable in any order; what is unreachable is rearranging them. I also decline the narrowed form: doing the category list alone would diverge the two reorder implementations behaviourally, which is exactly what WORK-35's deferral exists to prevent. If it is done, both change, and the extraction comes first. **Trigger: any behavioural change to either reorder path — which then fires WORK-35 and this item as one piece of work — or evidence of a real keyboard or switch user blocked by it.** |
| **WORK-16** | Index Daily chart and calendar by date | Standing deferral, **trigger widened** as described under WORK-49. Otherwise unchanged. |
| **WORK-15** | Cloud load through `importProblem` → `writeDb` → `load()` | Standing deferral unchanged. The hard precondition holds: no build ships with Firebase configured until WORK-15 and the escaping work have both landed. Code Review notes the precondition is now half met; that is not an argument to advance it, it is an argument that the precondition is doing its job. The stale comment at `:2398-2400` is corrected under WORK-61 without touching the code. |
| **WORK-17 (IndexedDB half)**, **WORK-23 (screen half)**, **WORK-30**, **WORK-31**, **WORK-35** | Standing round-3 deferrals and rejections | All unchanged. No report in this round presented new evidence against any of them. WORK-35's trigger did not fire, because WORK-57 is deferred. |
| **Stage 2** | Pure-logic module and test runner | Not promoted, for the third round running, and on the same reasoning. Nothing found this round is a calculation defect: they are a CSS width, two missing outcome checks, two missing validator lines, an unguarded `localStorage` pair, a self-contradicting string, and a set of unmeasured colour values. A pure-logic test harness would have caught none of them. V4 and V5 catch two of the classes outright. **Trigger unchanged and unfired.** |

---

## Development Order

Build order, with the reasoning. Nothing outside R4 begins before R4 closes.

**Step 0 — WORK-62, then V4 and V5's predicates. Tooling before fixes.**
`check-escaping.mjs` exists, returns zero, and is referenced in no script and no document — it is one busy day away from being forgotten, which is the whole failure mode V2 was written to stop. Add `check:escaping`, add `verify` running both, name it in `VERIFICATION.md`. Then write `check-contrast.mjs`'s skeleton and V5's allow-list check. The predicates go in **before** the work they will be used to close, for the same reason the linter did last round: a check installed after the fix proves nothing about the fix.

**Step 1 — WORK-43 [R4].** First, and alone. It is thirty minutes, it is the only finding a user sees the instant they open a core module, and it is the freshest damage in the app. Fix the newest breakage first so the next reviewer is not reading around it.

**Step 2 — WORK-44 [R4], then WORK-45 [R4].** Two commits, not one. WORK-44 deletes a line; WORK-45 adds one. Both close the "the app said done when nothing landed" class, and V5's allow-list is populated in the same pass — every remaining bare `save();` gets its one-line reason recorded, which is the step that stops an eighth path appearing.

**GATE R4 CLOSES.** Conditions: three items landed, one commit each; V1's four write flows executed with a clean console; `npm run verify` returns zero; V5's allow-list committed and its check returning zero. Then the build is releasable.

**Step 3 — WORK-41 + WORK-42 + WORK-53 + WORK-54, as one measurement pass over the theme blocks.** The largest item in the roadmap and the first thing after the gate, because it is the only remaining work either reviewer calls High and all of it lives in one place. Four items, one pass, separate commits: opening sixteen theme declarations four times and re-measuring the same grounds each time is the expensive way to do this. The pair table for `check-contrast.mjs` is a deliverable of this step, and the step does not close until that check returns zero — this is the demonstration case for V4, exactly as WORK-02 was for V2. Constraint from the finding, which I ratify: **`--primary` itself does not change.** It measures correctly as an accent against every surface; only foreground tokens and the scrim alpha are added.

**Step 4 — WORK-46.** Immediately after, and ahead of the rest of the Mediums, because it is the only remaining item touching financial correctness. Two lines finishing the validator sweep that WORK-14 and WORK-40 started on the sibling fields the engines actually pivot on. If any other validator work opens first, this rides along.

**Step 5 — WORK-48 + WORK-63, as one purpose in two commits.** The dependency the Engineering Manager identified is correct and I ratify it: an id containing `"` or `]` throws out of `querySelector`, reaches `reportFatal`, and fires the banner WORK-48 is rewording. Rewording an alarm while leaving a path that fires it falsely is round three repeating itself.

**Step 6 — WORK-51 + WORK-52, as one edit to `navigate()`.** Same function, same `expMode`/`screenTitle` relationship, same class of defect: the header and the tab bar naming different modules. Sequencing them apart means opening the same twenty lines twice.

**Step 7 — WORK-47, then WORK-50.** Two unrelated single-function fixes with nothing to share; ordered by nothing more than which is smaller. Deliberately not batched with anything.

**Step 8 — Hygiene and accessibility tail: WORK-55, WORK-56, WORK-59, WORK-60, WORK-61, WORK-64, plus the WORK-65 and WORK-66 token additions.** Last, because none of them changes a figure or unblocks a flow, and each is small enough to ride along with whatever else opens its region of the file. Separate commits. WORK-65 and WORK-66 are token additions with their canonical uses switched — if either turns into a sweep, it has stopped being the approved item.

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework, no runtime build step, no bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations; existing steps are immutable because files exist in the wild that depend on them. `stepDate` as the single recurrence engine. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever. Offline-first. Mobile-first.

**What changes.**

1. **The theme layer gains a foreground contract.** Today a theme declares fills and the app hopes white works on them. After Step 3, every theme declares what colour text sits on its own accents, and a machine checks it. This is the structural half of WORK-41 and it is the reason that item is worth two and a half days rather than being a colour tweak: it converts sixteen unverified assertions into one enforced table.
2. **Two development-time static checks, and no more.** `lint.mjs` and `check-escaping.mjs` exist; `check-contrast.mjs` is authorised under the identical four constraints. All three run behind one `verify` script. This is the final amendment to the no-build-step rule this quarter.
3. **Two claims become predicates, permanently** — V4 for contrast, V5 for unreported writes. Both are classes that have now failed twice by hand-counting. Neither costs more than a command.
4. **Two rules tighten.** C5's reservation now covers the element's rendered claims, not merely its words. And the WORK-28 convention gains a sibling from WORK-43's rejected half: a button placed beside another element carries an explicit width.

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports. Enabling Firebase. Deleting or repairing any quarantined Cloud Sync code, `fbApp` included. Splitting `index.html` beyond the single authorised sibling module, which remains authorised and remains unexercised. Any large mechanical sweep across the file — the 72 font sizes and twelve radii are the specific temptation, and they are declined. Any `render*` function calling `save()`. A seventeenth theme before `check-contrast.mjs` covers it.

**And one thing I want on the record, because this is the fourth round in which it has been the real finding.** Every serious defect in the last two rounds has had the same shape: someone asserted a class was closed, in good faith, and the assertion was wrong. Six delete paths that were seven. Nine escaped interpolations that were not all of them. Sixteen themes measured in a comment and never measured. Two validator fields covered while their siblings were not. The codebase is sound; the *counting* is not, and it will not become sound by asking people to count more carefully. Each of V2, V4 and V5 replaces one act of counting with one command. That is the durable output of this round, and it is worth more than any of the sixteen findings it was derived from.

**What I am still declining.** The module-boundary problem — 34 mutable globals, filter state read out of DOM inputs — remains recorded as a long-term risk and remains unscheduled. Code Review says it accepts that ruling and again demonstrates the cost by re-reading seven consumers of `db.planned` by hand. That cost is real and it is not yet larger than the cost of a render-layer rewrite without a harness underneath it. It is the leading candidate for the quarter after this one.

---

## Executive Report

The application is releasable on severity and I am nonetheless holding it for three-quarters of a day. There is no Critical in either report, both round-3 Criticals are verified closed against source by a reviewer who re-walked every interpolation site rather than trusting a commit message, and the architecture underneath is in the best shape it has been: integer money throughout, no `toISOString()` anywhere, numbered migrations that stamp only the version reached, whole-file import rejection, a service worker that revalidates without breaking offline, and a modal history stack whose push/pop bookkeeping balances on every path traced. What I will not ship is a named core module rendering its primary action at 87px with a wrapped label, and two paths telling a user a destructive write succeeded when it did not — because all three were created or missed by the batch that was supposed to close exactly that class, and all three are XS.

The three High findings are one problem in one place: the round-3 contrast work fixed text-on-surface, wrote a comment claiming it had done more, and never measured text-on-fill. I measured Nord's primary button myself at 2.00:1 and the default theme's danger fill at 3.76:1, so the numbers are real. They are not a release blocker — non-default themes are opt-in and the default theme's primary passes — but they are the largest quality item in the roadmap and they go first after the gate. The rule I attach costs nothing and matters more than the fix: no seventeenth theme ships until a machine can measure it.

On the four escalated decisions. **C6:** neither score governs release, because the convention's bands do not compose across two reports and averaging them would be arithmetic pretending to be judgement; the convention blocks on Critical alone, there is none, and the hold is mine on the grounds above. **C7:** Medium governs the category delete — two reviewers rated two different impacts of one site, and the worse one sets the schedule. **C8:** the cold-start title is Low and the subtitle is Medium, and I verified why: `renderDashboard()` writes `hdrSub` unconditionally and is reached from other screens, so the header can print the Dashboard's period under the Income screen's title, which is the app stating something untrue about the user's money. **C9:** CODE-05 is new evidence and it is partly my omission — C5 reserved the words looking forward and I did not notice the existing path had already reused them; the rule now covers every claim the element renders, and WORK-48 is approved at its minimum, not as a second banner. **C10:** Monthly Trend is genuinely not the deferred Daily-chart item, and it gets the same answer anyway, because a larger projection is not better evidence; I have widened the trigger to cover the class so a third name does not arrive next round.

On the two items the Engineering Manager raised unprompted, both were right to raise and both get predicates. "All 16 themes" gets `check-contrast.mjs` — narrow by construction, a hand-written table of token pairs and a machine that does the arithmetic and the counting, because the arithmetic and the counting are what humans got wrong. "All delete paths report their outcome" gets an allow-list check on bare `save();`, which fails loudly on an eighth path without forcing a toast onto the three preference writes I already ruled need none.

Of 26 items I approved 23, rejected 1 outright, deferred 2, and narrowed 7 of the approvals. Three further half-items are rejected inside otherwise-approved work: the `.btn-block` refactor, the `fbApp` deletion, and both mechanical sweeps. Excluding rejected and deferred work the approved roadmap is roughly eight engineering days, of which the release gate is 0.75 and the tooling is 0.75.

---

## Implementation Priority

Restated as the single ordered list, for execution:

1. **Step 0 — WORK-62 and the V4/V5 predicates.** Tooling before fixes.
2. **WORK-43 [R4]** — alone, first.
3. **WORK-44 [R4]**, then **WORK-45 [R4]** — two commits, V5's allow-list populated in the same pass.
4. **GATE R4 CLOSES** — V1's four flows clean, `npm run verify` zero, allow-list check zero.
5. **WORK-41 + WORK-42 + WORK-53 + WORK-54** — one measurement pass, four commits, closing on `check-contrast.mjs`.
6. **WORK-46** — the validator sweep finished.
7. **WORK-48 + WORK-63** — the alarm and the path that fires it falsely.
8. **WORK-51 + WORK-52** — one edit to `navigate()`.
9. **WORK-47**, then **WORK-50**.
10. **WORK-55, WORK-56, WORK-59, WORK-60, WORK-61, WORK-64, plus the WORK-65/WORK-66 token additions** — separate commits, riding along.

---

## Recommended Next Action

**Authorise gate R4 — WORK-43, WORK-44, WORK-45 — preceded by Step 0: land WORK-62's `verify` script and write the two predicates that rulings V4 and V5 now require.** The order is not negotiable and it is the same order that worked last round: the checks go in before the fixes, because a predicate installed afterwards proves nothing about the work it was meant to prove. That is one and a half days total, it makes the build releasable, and — more valuably — it retires by machine the two claims this project has now got wrong twice each. Do not let WORK-41 into the gate. It is the largest and most visible item in the roadmap and every instinct will be to bundle it; it is a two-and-a-half-day accessibility item that starts the moment the gate closes, and the eleven-item gate is what produced the Critical we fixed two rounds ago.

*(Round 4. Full reports: `reports/ui-review.md`, `reports/code-review.md`, `reports/engineering-manager.md`.)*
