# Chief Architect — Final Engineering Decision

**Round 5.** Sources read in full: `reports/ui-review.md` (14 findings, 88/100), `reports/code-review.md` (12 findings, 90/100), `reports/engineering-manager.md` (26 items WORK-67..WORK-92, conflicts C11–C15). Also read before ruling on anything they govern: `knowledge/review-conventions.md`, `knowledge/project.md`, and my own round-4 decision.

Verified against source, not accepted on report:

- `expense-pwa/index.html:7294-7298` — three unconditional `setBannerText` calls and `dl.style.display='none'`, with no test of `dataWasCorrupt`. The flag is real (`:2440`), set at `:2466`, and `updateCorruptBanner()` is called from exactly one place, `:2627` in `load()`. The comment at `:7288-7289` asserts its own untested precondition in prose — *"with the database intact on disk"*. **CODE-01 confirmed, and it is a regression from WORK-48, which I approved and narrowed myself.**
- `:1353-1359` — `.advisor-count` sets `color: var(--on-accent)` once and overrides only `background` for `.good/.warning/.critical`; `:5419` always writes one of those three classes. Default `--on-accent` is `#FFFFFF` (`:39`). Grep for `var(--on-warning)` returns **zero**; the token is declared in all sixteen blocks. UI-01 confirmed exactly.
- `:841-845` — `.hero-label { opacity: .95 }`, under a comment (`:839-840`) explaining the scrim derivation that the opacity silently undoes. UI-02 confirmed.
- `:918-928` — the shared button rule now carries my round-4 convention in prose, ending *"Three places got this wrong; each now sets its own width, below."* `:936` lists three. `:3572-3573` is a fourth. UI-04 confirmed.
- `:79` — *"Radius scale — 3 values only"*, with `--r-bar` declared three lines below it at `:82`. `:76` — *"use ONLY these values"*. C13's stale-comment half confirmed.
- `:4003` — `calcSalary`'s `g()` is a genuine single funnel for seven fields; `:4045-4053` re-reads nine fields through `unnum` directly, **including both percentage fields**; `:4054` spreads raw floats into `db.salaries` under a comment (`:4062-4067`) stating the rounding rule it does not apply. CODE-02 and CODE-05 confirmed, and the fix must touch both read sites, not just `g()`.
- `tools/check-saves.mjs:72` — `/(^|[;{}\s])save\(\)\s*;/`. The trailing semicolon is required. CODE-08 confirmed. Allow-list at `:55-62` reads exactly as the Engineering Manager quoted it.
- `expense-pwa/VERIFICATION.md:288-290` and `:313-316` — both paragraphs describe the state *before* the batch that closed gate R4. CODE-09 confirmed.
- `:2829-2849` — **`writeDb()` calls `showSaveError()` on every failure path.** This is load-bearing for C14 and neither report weighed it.
- `:5746-5749` — `categoryColor()` is `db.categories.findIndex(...)` into `CATEGORY_COLORS`. C11's new fact confirmed.
- `:3990` and `:5458-5477` — `navigate()` re-renders on entry; the guard is on the subtitle only. CODE-07 confirmed.
- `:6698-6708` — `input.addEventListener('click', open)` alone. UI-08 confirmed as a regression from WORK-59.

Ruling issued on all 26 items. No item is silent.

---

## Executive Decision

**No — and it is one XS item away from yes.**

Neither reviewer raised a Critical or a High for the first time in five rounds, both round-4 gate classes are verified closed by re-inspection against source rather than against a commit message, and the architecture underneath is the soundest it has been: integer money end to end, no `toISOString()` anywhere, one store seam, quarantine-before-write, a service worker that revalidates without breaking offline, and a contrast predicate that turned an unmeasurable comment into 432 measurements. What I will not ship is `reportFatal()` telling a user whose financial history is sitting unreadable in a quarantine key that *"Your saved data has not been changed"* while hiding the only button that hands those bytes back — in the exact boot state the entire persistence design exists to survive. It is XS, it is one `if`, and it is damage from a fix I personally approved and narrowed last round, which is the same test that opened gate R4 and the same answer. Everything else in both reports is a quality release: four measurable AA failures that are gaps in a hand-maintained table rather than failures of the mechanism, a salary form that accepts a minus sign into `db.income`, and a tail of XS hygiene.

---

## Release Gate Ruling

**Gate R4 is closed and stays closed.** Its three items landed, the escaping, save-outcome and validator classes are all verified closed under re-inspection, `check-contrast.mjs` and `check-saves.mjs` exist and both return zero, and `check-saves.mjs` demonstrably found the seventh delete path without anyone counting. The process worked at the level I set it at, for the second round running.

**I open gate R5 with exactly one item.**

| Gate item | Why it blocks release |
|---|---|
| **WORK-71** | On a corrupt-data boot, any later runtime error replaces a true message with a false one about the user's financial data and removes the route back to the quarantined copy. It is the only finding in either report where the app makes a false statement about money in the one state the storage design exists to make survivable — and it is fresh damage from the last batch. |

Roughly half an hour. **Nothing else joins**, and I am explicitly declining to pair WORK-74 into it despite both Code Review and the Engineering Manager naming CODE-04 as the most likely trigger. The guard fixes the outcome regardless of which path raises it; CODE-04 is Low as its reviewer set it, and a one-item gate is the property that made R4 work where the eleven-item gate two rounds before it produced a Critical. WORK-74 is the first item after the gate closes.

**WORK-86 does not enter the gate.** It is the second consecutive regression introduced by an accessibility fix, which is worth recording, but the tab-stop problem WORK-59 removed was the worse of the two and the picker has a working fallback — the user types an emoji, or accepts the 🎯 default. A Low with a fallback is not a gate item.

---

## Verification Process Ruling

V1, V2, V3, V4 and V5 all stand and all are now doing measurable work. Two amendments, both inside existing tools.

### V6 — The pair table's coverage gets one mechanical assertion, and it goes inside `check-contrast.mjs`

The Engineering Manager is right that the coverage question has moved. The mechanism is correct — both reviewers say so independently, and Code Review calls it the clearest example in the codebase of a class genuinely closed rather than asserted closed. But four painted surfaces that carry text were outside the table, and a hand-maintained list of pairs is still a hand-maintained list.

I will not solve that by making the tool parse CSS. V4's four constraints hold and its exclusions hold: no cascade resolution, no `color-mix()` following, no inferring which pairs matter. A human decides the pairs.

**I authorise one new assertion inside `check-contrast.mjs`: a declared `--on-*` token with zero `var()` references anywhere in `index.html` fails the check.** This is a grep and a count over declarations the tool already parses. It is not a CSS engine and it is not a fifth tool. It would have caught UI-01 — the round's worst contrast finding — mechanically, because `--on-warning` is declared sixteen times and used nowhere, and that unreferenced token *is* the fingerprint of a fill that paints text with the wrong foreground.

**And I adopt the Engineering Manager's rule as a standing convention, at zero cost: a CSS rule that paints a fill under text adds a pair-table row in the same commit.** It sits beside the seventeenth-theme rule, which also stands.

### V5 amended in one respect only — the predicate, not the allow-list

CODE-08 is correct and it is V2's failure mode inside a tool: `check-saves.mjs` carries the header *"A new unreported write fails on the first run. That is the only property that matters"* above a regex that cannot see `if (ok) save()`, `forEach(() => save())`, or a `save()` closing an arrow body. A guard narrower than the claim written on it is how the class returns, and the next reader will trust the header. **WORK-78 widens the regex to detect a discarded call by inverting the `CAPTURED` test.** The allow-list itself is untouched — see C14.

### The tool count is frozen at four

I said in round 4 that "two checks is a habit; a third would be a pipeline," and then authorised two predicates in the same breath. The honest count on disk is four: `lint.mjs`, `check-escaping.mjs`, `check-contrast.mjs`, `check-saves.mjs`. I am owning that and closing it: **four is the number for this quarter. New assertions go inside an existing tool or they do not exist.** V6 is written that way deliberately.

### `VERIFICATION.md` stops restating numbers the tools own

CODE-09 found §6 asserting two things that are now false. The cheap fix is to correct the two paragraphs. The durable fix is to stop the document restating counts and pending-work status that live in the tool — *"empty until WORK-41/42/53/54 populate it"* and *"`check-saves.mjs` fails on it today"* are both statements about a moment, recorded in a document read long after the moment. **WORK-79 removes the claims about pending state and does not restate the pair count.** The mirrored allow-list table stays; it is a reason table, not a census.

### Stage 2 remains deferred, and it came closer this round than ever before

Trigger unchanged: the first calculation defect that a pure-logic unit test would have caught and V1–V6 would not. CODE-02 is input validation — Code Review says so itself and I agree. CODE-05 is the near miss and I want it on the record: a unit test asserting `calcSalary` returns integers would have caught it. It did not fire the trigger because `calcSalary` computes correctly and the defect is a write-boundary rule applied to one of two writes. **Trigger unfired, not widened.** If a second rounding or arithmetic defect appears in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences`, that fires it and I will not need to be asked twice.

---

## Conflict Rulings

### C11 — UI-07 against deferred WORK-57 (now WORK-85)

**Ruling: the palette fact is genuinely new, it is correctly raised, and the deferral stands. WORK-85 remains deferred with the reasoning corrected.**

I verified `categoryColor()` at `:5746-5749` and UI Review is right: the colour is `CATEGORY_COLORS[idx % length]` over `findIndex`, so category order sets the Analytics palette. My round-4 reasoning said "categories exist and are fully usable in any order; what is unreachable is rearranging them," and that sentence is now understated. Reordering is not merely a list preference; it is a control over the chart.

It is still not a control over anything the app *states*. No meaning attaches to a specific colour — the categories are labelled, the legend is labelled, and nothing in the app says "red means overspending." What a keyboard user cannot do is choose which arbitrary colour lands on which category. That is a cosmetic outcome of a functional control, and it does not convert a Low into scheduled work ahead of every Medium in the roadmap.

The two structural reasons for the deferral are untouched by the new fact: it is the largest remaining item at M, and doing the category list alone would diverge the two reorder implementations behaviourally, which is precisely what WORK-35's deferral exists to prevent. **Trigger unchanged: any behavioural change to either reorder path — which fires WORK-35 and this item as one piece of work — or evidence of a real keyboard or switch user blocked by it.** The palette consequence is now recorded in the deferral, so it does not arrive a third time as new evidence.

### C12 — UI-10 against rejected WORK-58 (now WORK-88)

**Ruling: rejected again, and the Engineering Manager's assessment is exactly right — nothing new was brought.**

UI-10 absorbed my correction about the Appearance card into its own impact paragraph and left the argument otherwise identical. Same severity, same recommendation, same absence of anything failing. My round-4 reasons all hold: it is a preference; the discoverability premise was falsified by WORK-25; and it makes first-run behaviour vary by device, which makes every future first-run report ambiguous forever, for an S.

One addition, because a re-raise deserves a sharper answer than a repeat: this is a **rejection, not a deferral, and it has no trigger.** A rejection with no trigger does not return unless a *user* is observed to be harmed, not a reviewer's projection of one. I would rather be wrong about this and told so by a real report than re-litigate it in round 6.

### C13 — UI-11 against the rejected sweeps

**Ruling: split. The sweep half is rejected for the second time. The stale-comment half is approved, and the Engineering Manager is right that it is WORK-61's class, not WORK-65/66's.**

The sweep half brings nothing new — the count is unchanged at 72 and the finding again concedes "no single value is wrong." Bound by the standing WORK-28 convention and the no-large-mechanical-sweep rule, on a file with no test harness under it, for Low severity and zero removed risk.

The comment half is a different thing entirely and it was nearly rejected by association, which is exactly why the Engineering Manager was right to separate it. I verified both: `:79` says *"Radius scale — 3 values only"* with `--r-bar` declared three lines below it, and `:76` says *"use ONLY these values"* against roughly 69 declarations that do not. **These are false claims recorded in the file** — the same class as `check-escaping.mjs`'s coverage claim (WORK-61), the button rule's "three places" (WORK-70), `VERIFICATION.md` §6 (WORK-79), and the calendar's "44.6px at 360px" (WORK-83). Four instances of that class in one round, and it is the class I named in round 4 as the project's real defect.

**Approved, narrowed to the two comments, with one condition on the wording: the corrected comments must state an intent, not a census.** "New declarations use these values" is a rule that cannot go stale. "Use ONLY these values" is a claim about 6,900 lines that was false the day it was written and will be false again. That distinction is the whole value of the item.

### C14 — UI-09 asks me to remove two entries from the V5 allow-list

**Ruling: the allow-list stands unchanged. WORK-87 is rejected. UI-09's central factual claim is wrong, and I checked it rather than ruling on the principle.**

UI-09's impact reads: *"A failed write during a reorder is silent."* It is not. `writeDb()` at `:2829-2849` calls `showSaveError()` on **every** failure path — both the `corruptQuarantineFailed` refusal and the `localStorage.setItem` catch — and returns false. A failed reorder raises the same persistent save-error banner as a failed income entry. What is absent is a *toast*, and a toast is outcome messaging, not failure reporting. The allow-list's own first entry says this in as many words: *"Failure still raises the banner through writeDb()."*

The Engineering Manager was right that UI-09 carries one fact the allow-list reason does not answer — "the new order is already on screen" is weaker than it looks once the palette consequence is known, because after a reload the palette reverts. That is a fair criticism of the *reason text*, not of the ruling. So I am fixing the reason rather than the code: **the allow-list entries for `initIncomeTypeReorder` and `initCategoryReorder` are amended to read that a failed reorder is reported by the save-error banner raised in `writeDb()`, and that the omitted toast is a noise judgement about a drag gesture, not a claim that failure is silent.** Text change, no code change, rides with WORK-79.

V5 stands exactly as written: *"I am explicitly not requiring that every `save()` be followed by `savedToast`. That would be a rule about outcome messaging masquerading as a rule about writes, and it would put a toast on the reorder drag."* A toast per drop on a drag gesture is noise, and noise on every drop is how users learn to dismiss the toast that matters.

### C15 — UI Review's Strength against Code Review's biggest risk, on the same five lines

**Ruling: the Engineering Manager's assessment is correct and this is not a conflict. Both statements are true. WORK-71 stands at Medium and takes the gate alone.**

UI Review exercised the non-corrupt path, where WORK-48 is correct and the praise is accurate — the banner no longer contradicts itself on a `window.onerror` from a healthy boot. Code Review exercised the corrupt path, which UI Review did not open. Five lines can be a fix and a regression at once when they are unconditional and there are two conditions.

I am ruling anyway rather than waving it through, because there is something in this for the process. The comment at `:7288-7289` states the precondition the code does not test — *"with the database intact on disk"* — in prose, in good faith, in a fix I approved. **That is the fifth instance this round of the project's standing failure mode: a true-sounding claim written beside code that does not enforce it.** It has now happened inside my own ruling C5. C5 required that a path reusing the element rewrite every claim the element renders; WORK-48 satisfied that in one direction and violated it in the other. **I restate C5 once more, in its final form: the `#dataErrorBanner` words are reserved for load or parse failure. A path may reuse the element only if it rewrites every claim the element renders *and* establishes that it is not overwriting a more urgent true message.** The corrupt-data message outranks the generic one; `if (dataWasCorrupt) return;` is the whole implementation.

---

## Approved Improvements

23 of 26 items approved, one of them as a half. Gate item marked **[R5]**.

| Item ID | Title | Reason for approval |
|---|---|---|
| **WORK-71** | `reportFatal()` overwrites a live corrupt-data banner **[R5]** | Verified at `:7294-7298` against `:2440/:2466/:2627`. The app makes a false statement about the user's financial data and hides the recovery button, in the one state the persistence design exists to survive. One `if`. Ruling C15. |
| WORK-74 | Guard `updateStorageStatus()`'s `persisted()` await | A storage-status query that fails is worth a line of text, not a permanent undismissible alarm. The `try` pattern exists two functions above at `:3099-3106` and was not applied. First item after the gate; it is the most plausible trigger of WORK-71. |
| WORK-72 | Salary form accepts negative hours and percentages into `db.income` | Financial correctness in a named core module aimed at people with little accounting knowledge, and `coding-standards.md` says "Validate inputs" without qualification. **Scope corrected against source:** `g()` at `:4003` covers seven fields, but `:4045-4053` re-reads nine through `unnum` directly including both percentages. One `nonNegative()` helper, used at both read sites, or the fix is half a fix. |
| WORK-75 | Round in `calcSalary`'s return; `db.salaries` stores integers | Verified: `:4054` spreads raw floats under a comment at `:4062-4067` that states the rule and applies it to one of the two writes on the same handler. Makes an existing claim true and gives money one rounding boundary. Co-edit with WORK-72. |
| WORK-73 | `FileReader.onerror` on Restore from file | The recovery path the corrupt-data banner itself routes to. Every other outcome on this path was deliberately given a modal; the read failure is the one that got none. Two lines. |
| WORK-67 | Advisor badge foregrounds per state | Verified: `.advisor-count` sets `--on-accent` once and `:5419` always overrides the fill. White on `#10B981` is 2.32:1 on the **default** theme's landing screen. Three `color:` declarations, and it retires a token declared sixteen times and used zero times — which V6 will then hold. |
| WORK-68 (narrowed) | Remove `.hero-label`'s `opacity: .95` | **Approved as the deletion only.** Twelve themes fall to 4.2–4.3:1 on the caption above the app's headline figure. Deleting one declaration is smaller than re-deriving twelve alphas and adding a pair row — and it makes the *existing* table row true, because the tool measures `--on-hero` at full strength, which is then what paints. |
| WORK-69 (narrowed) | Cap the calendar heat ramp; add the pair rows | The heatmap exists to answer "which days did I spend most" and the cells holding the answer are the unreadable ones. **Narrowed to the ramp cap and the pair-table rows — no heatmap redesign.** Legibility of a figure outranks the smoothness of a colour ramp; ranking survives in the ramp, the `aria-label` and the day-detail card. |
| WORK-70 | Fourth sibling-in-a-row button, and the comment's count | Verified at `:918-928`, `:936`, `:3572-3573`. This is my own round-4 convention written into the file with a census beside it, and the census is now false. **Condition: replace the count with the class statement** — "each sibling-in-a-row sets its own width" — so it cannot go stale a fifth time. |
| WORK-76 (narrowed) | `revealEntryDate()` syncs the custom-range editor | The identical problem is solved four lines away at `:7253-7255`; one of two writers has the knowledge. **Approved as moving the one toggle line only. The three-line extraction is rejected** — a refactor where a one-line addition removes the same risk. |
| WORK-77 (conditional) | Early-return `renderDashboard()` when off-screen | The cheapest available lever on the deferred performance class without reopening it: not "make the loop faster" but "do not run the loop", thirteen times per session minimum. `navigate()` re-renders on entry at `:3990`, so nothing is lost. **Condition: verify first that every element `renderDashboard()` writes lives inside `#dashboard`.** `hdrSub` is the known exception and is already guarded; a second one would be silently frozen by the early return. |
| WORK-78 | Widen `BARE_SAVE` to detect a discarded call | Verified at `check-saves.mjs:72`. A predicate narrower than the claim on its own header is V2's failure mode inside a tool, and the tools are now the project's memory. Re-run must still yield exactly the five allow-listed hits. |
| WORK-79 | Correct `VERIFICATION.md` §6 | Verified: both paragraphs describe the state before the batch that closed gate R4. **Narrowed and extended: remove the claims about pending state, do not restate the pair count, and amend the two reorder allow-list reasons per ruling C14.** After WORK-78. |
| WORK-80 | Extract `downloadJSON()`; defer the revoke | Both copies sit on the data-recovery path, which is where a silently cancelled download costs most, and the fragile part of the idiom — synchronous `revokeObjectURL` after `click()` — is currently written twice. XS, two adjacent functions, and the timing fix then lands once. |
| WORK-81 | `importProblem()` checks id uniqueness | The import path is described in the source as the only place untrusted data enters, and this is the one structural property of a record collection it does not check. Two records sharing an id means one tap deletes two — quiet, destructive, and unrecoverable. One `Set` inside the existing loop. |
| WORK-82 | Reject a quick-amount of zero | A control that is visibly present and cannot do anything, produced by a guard that went out of its way to almost prevent it. `.filter(v => v > 0)` plus the import validator agreeing, so the two boundaries stop disagreeing. |
| WORK-83 (narrowed) | Calendar card padding, icon-grid breakpoint, and the comment | 44px is a hard minimum in `ui-guidelines.md`. **Approved for the three named changes only** — `padding-left/right: var(--s3)` on the calendar card, the icon grid's 5-column breakpoint to `max-width: 400px`, and correcting the "44.6px at 360px" claim. This is the second half of a fix that was recorded as complete; the false comment is why it stayed hidden. |
| WORK-84 (split, both approved) | Hover fill and `.hero-kpi::before` | (a) The `{ fg: on-accent, bg: primary-2 }` pair row costs nothing and lets the table force whatever the four themes need. (b) Moving `.hero-kpi::before` behind the scrim removes the surface from the contrast question entirely rather than adding another row to police — the better shape. **Two commits; (b) is a paint-order change on the app's most-looked-at card and gets its own visual check.** |
| WORK-86 | Keyboard route into the goal icon picker | Verified at `:6698-6708`. A regression from WORK-59, and the idiom already exists at `:6416-6421` for the five readonly date fields. Enter/Space to open, Escape to close, focus returns to the input. Not a gate item. |
| WORK-89 (half) | Correct the radius and spacing scale comments | Ruling C13. Verified at `:76` and `:79`. Two false claims recorded in the file, which is the class WORK-61 was approved for at XS. **Condition: the replacements state an intent, not a census.** The sweep half is rejected — see below. |
| WORK-90 | `aria-pressed` on the theme swatches | Sixteen `<button>`s whose only selected-state signal is a border colour and a halo. A screen-reader user cannot tell which theme is applied. One attribute, kept in sync with the class swap that already exists. |
| WORK-91 | PNG icons for iOS home screen | The app's own Storage Status card names iOS Safari and the About card recommends installing to the home screen as the mitigation against storage eviction. Shipping an icon format that platform ignores undercuts the app's own reliability advice. Sibling asset files already exist beside `index.html`, so nothing about opening from disk changes. `sw.js` `ASSETS` updated in the same commit. |
| WORK-92 (narrowed) | `outline-offset: -2px` on `.cal-cell:focus-visible` | The keyboard indicator on the date picker — the only route to a goal deadline or a recurring end date — is half-drawn since the gap change. **One declaration.** Caused by WORK-55's gap reduction, so it lands with WORK-83, which finishes that same change. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **WORK-87** | Add `savedToast` to the two reorder handlers | Ruling C14. The finding's central claim — "a failed write during a reorder is silent" — is false against source: `writeDb()` at `:2829-2849` raises `showSaveError()` on every failure path, including the quarantine refusal. What is missing is a toast, and V5 exists precisely to keep outcome-messaging preferences out of a rule about writes. A toast on every drop of a drag gesture is noise, and noise is how users learn to ignore the toast that matters. The allow-list *reason text* was weak and is being corrected under WORK-79; the ruling is not. |
| **WORK-88** | Default an unset theme to dark when the OS prefers dark | Ruling C12. Rejected in round 4 and re-raised with the correction absorbed and the argument otherwise unchanged. Nothing fails, no user is blocked, and the item's own impact is a projection. It makes first-run behaviour vary by device, which makes every future first-run report ambiguous forever, for an S. **This rejection carries no trigger: it returns only on an observed user harm, not on a reviewer's projection of one.** Work not done is the cheapest work there is. |
| **WORK-89 (sweep half)** | Snap 72 font sizes, 9 radii, ~69 spacings and 7 card paddings onto the scales | Ruling C13. Second raise, no new evidence, count unchanged, and the finding again concedes "no individual value is wrong." Bound by the standing WORK-28 convention and the no-large-mechanical-sweep rule: M effort, Low severity, zero removed risk, and a diff across hundreds of lines of a file with no test harness under it — which is the exact shape of change that produced two prior rounds of regressions. Off-scale values are replaced only in blocks another approved item is already opening. |
| **WORK-76 (extraction half)** | Extract the shared "apply a preset and persist it" body | Rejected as a change, approved as the one-line fix. Two call sites do not justify a new seam when moving one existing line removes the entire defect. Smallest change that removes the risk. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **WORK-85** | Keyboard path for category and income-type reordering | Ruling C11. The palette-by-index fact is real, verified at `:5746-5749`, and is now **recorded in this deferral** so it is not offered as new evidence a third time. It raises the stake from list order to arbitrary chart colours; it does not make a figure wrong, block a flow, or remove the divergence problem. **Trigger unchanged: any behavioural change to either reorder path — which fires WORK-35 and this item together, extraction first — or evidence of a real keyboard or switch user blocked by it.** |
| **WORK-16 / WORK-49** | Index Daily chart and calendar; bucket Monthly Trend | Standing deferral, class-wide trigger unchanged: a measured render above 100ms on a mid-range device on Dashboard or Analytics, **or** a real database above 5,000 actual records. Code Review explicitly declined to re-raise these and presented no new evidence, which I note approvingly. WORK-77 lands first so that when the trigger does fire, the measurement is not taken against a Dashboard repainting thirteen times more often than it needs to. |
| **WORK-35** | Extract the shared reorder implementation | Standing deferral. Trigger did not fire, because WORK-85 is deferred. |
| **WORK-15** | Cloud load through `importProblem` → `writeDb` → `load()` | Standing deferral. Hard precondition holds and is doing its job: no build ships with Firebase configured until WORK-15 and the escaping work have both landed. |
| **WORK-17 (IndexedDB half)**, **WORK-23 (screen half)**, **WORK-30**, **WORK-31** | Standing round-3 deferrals | Unchanged. No report this round presented new evidence against any of them. |
| **Stage 2** | Pure-logic module and test runner | Not promoted, fourth round running. **Trigger unfired but closer than ever: CODE-05 is the first finding a unit test would plausibly have caught.** It does not fire because `calcSalary` computes correctly and the defect is a write-boundary rule. A second rounding or arithmetic defect in `calcSalary`, `stepDate`, `computeRange` or `plannedOccurrences` fires it. |

---

## Development Order

Nothing outside R5 begins before R5 closes.

**Step 0 — WORK-78, then WORK-79. Tooling before fixes, as always.**
Widen `BARE_SAVE` to detect a discarded call rather than a semicolon; confirm the five allow-listed sites are still the only hits. Then correct `VERIFICATION.md` §6 — removing the pending-state claims, restating no counts the tool owns, and amending the two reorder allow-list reasons per C14. The document is corrected *after* the widening so it describes the final state, and it is written so the contrast pass in Step 4 cannot make it stale again.

**Step 1 — WORK-71 [R5]. Alone.**
One `if (dataWasCorrupt) return;` immediately after the `fatalReported` check.

**GATE R5 CLOSES.** Conditions: the item landed; V1's write flows executed with a clean console, including a deliberately corrupted store followed by a thrown runtime error, which is the flow that produced the defect; `npm run verify` returns zero across all four tools. **Then the build is releasable.**

**Step 2 — WORK-74.** The trigger, immediately after the symptom, in the same file region, same `try`/`catch` shape as `ensurePersistentStorage()`.

**Step 3 — WORK-72 + WORK-75, one pass over `calcSalary` and the `sSave` handler, two commits.** The last two money-correctness gaps in the file, both at a boundary, both in a named core module. Ahead of the contrast work because a wrong income record outranks an unreadable one. The clamp must cover `g()` **and** the nine direct `unnum` reads at `:4045-4053`.

**Step 4 — WORK-73.** Alone. The recovery path stops being silent.

**Step 5 — WORK-67 + WORK-68 + WORK-69 + WORK-84, one measurement pass, five commits.**
All four are gaps in one artifact and sequencing them apart means re-deriving the same sixteen theme grounds four times. The step does not close until `check-contrast.mjs` returns zero **with the new rows in it and V6's unused-token assertion in place** — the same demonstration pattern that closed round 4's Step 3. WORK-84(b), the `.hero-kpi::before` paint-order change, is its own commit with its own visual check.

**Step 6 — WORK-70.** Alone, thirty minutes, and the comment's census becomes a class statement.

**Step 7 — WORK-83 + WORK-92, one pass over `.cal-*`, two commits, after Step 5.** Colour first, geometry second. WORK-92 exists *because* of the gap change WORK-83 completes, so splitting them risks a third pass over the same rules.

**Step 8 — WORK-77.** Alone, after the write-target audit. Not batched with anything, because an early return that silently freezes an element is the failure mode and it deserves undivided attention.

**Step 9 — the tail: WORK-76, WORK-80, WORK-81, WORK-82, WORK-86, WORK-89(comments), WORK-90, WORK-91.** Separate commits, riding along with whatever else opens their region. None changes a figure or unblocks a flow.

---

## Architecture Strategy — Next Quarter

**What stays, and is not open for discussion.** A single self-contained `index.html` that runs by being opened from disk. No framework, no runtime build step, no bundler. `localStorage` as the store, single-blob and therefore atomic. One store seam — `writeDb`/`save`/`load`. Quarantine-before-write on corrupt data. Numbered, append-only, version-stamped migrations. `stepDate` as the single recurrence engine. `toLocalISO`/`parseISO` everywhere and no `toISOString()`, ever. Offline-first. Mobile-first.

**What changes.**

1. **The theme layer's foreground contract is built; the coverage question moves to the pair table and gets one machine assertion.** V6 fails `check-contrast.mjs` on any declared `--on-*` token with zero `var()` references. Alongside it, a standing convention: **a CSS rule that paints a fill under text adds a pair-table row in the same commit.**
2. **The tool count is frozen at four.** `lint.mjs`, `check-escaping.mjs`, `check-contrast.mjs`, `check-saves.mjs`, all behind one `verify` script. I said "a third would be a pipeline" and then authorised two; four is the honest count and it is the ceiling. New assertions go inside an existing tool.
3. **`VERIFICATION.md` stops mirroring numbers.** It describes what each predicate asserts and points at the tool. It records no counts, no "empty until", no "fails today". A document that restates a tool's state will go stale, and this project has now proved that twice.
4. **C5 reaches its final form.** A path may reuse `#dataErrorBanner` only if it rewrites every claim the element renders *and* establishes it is not overwriting a more urgent true message.
5. **The two `.btn` conventions become one class statement rather than a census** — "each sibling-in-a-row sets its own width" replaces "three places got this wrong."

**What is off limits this quarter.** Rewriting the store. IndexedDB. Building Reports. Enabling Firebase. Deleting or repairing any quarantined Cloud Sync code, `fbApp` included. Splitting `index.html` beyond the single authorised sibling module. Any large mechanical sweep across the file — the 72 font sizes and 69 spacings are the specific temptation and they are declined for the second time. Any `render*` function calling `save()`. A seventeenth theme before `check-contrast.mjs` covers it. **A fifth tool.** CSS parsing, cascade resolution or `color-mix()` following inside `check-contrast.mjs`.

**Risks I am recording, not scheduling.** Both come from Code Review's Future Risks and neither is a finding. First, `analyzeExpenses()` is 330 lines of 26 inline rules with no seam, and it is where the roadmap's AI Budget Assistant will want to live — every rule added makes that extraction dearer. Second, every consumer re-derives its own filter/expand pipeline from `db` directly, and Reports, Debt Planner and Investment Tracker each need a second read model over the same collections; the fifth such consumer is where the seven-consumer hand audit stops being affordable. The module-boundary problem — 34 mutable globals, filter state read out of DOM inputs — remains the leading candidate for the quarter after this one, and it remains cheaper to live with than to rewrite a render layer with no harness underneath it.

**And the thing that has changed, which matters more than any item in this roadmap.** For four rounds the real defect was that assertions of completeness were wrong: six delete paths that were seven, nine escaped interpolations that were not all, sixteen themes measured in a comment and never measured. This round, every one of the four false claims found — "three places", "44.6px at 360px", "3 values only", and §6's two paragraphs — **was found by someone re-deriving rather than reading**, and three of the five contrast findings are gaps in a table a machine now polices rather than assertions a human made. The counting problem is not solved; it has been moved somewhere it can be checked. That is the correct destination and it is worth more than the twenty-three fixes below it. The remaining discipline is the one CODE-08 and CODE-09 name: **the tools' own headers and the document that describes them are now claims too, and they get re-derived like everything else.**

---

## Executive Report

The application is one XS item from releasable and I am holding it for that item. Neither reviewer raised a Critical or a High for the first time in five rounds; both round-4 gate classes are verified closed by re-inspection against source; all 33 `save()` sites capture or are allow-listed with a reason; `check-saves.mjs` builds a real brace-depth scope chain and found the seventh delete path without anyone counting; and `check-contrast.mjs` converted an unmeasurable "all 16 themes" comment into 432 measurements and caught its own author's error while doing it. The build I am holding is in the best shape this project has produced.

What holds it is `reportFatal()`. I verified it: three unconditional `setBannerText` calls and a hidden download button, with `dataWasCorrupt` sitting in scope untested, under a comment asserting the precondition in prose. On a boot where the store failed to parse, any later runtime error tells the user their saved data has not been changed — while it sits unreadable in a quarantine key — and removes the only button that hands those bytes back. Their rational response is to reload, which changes nothing. That is the app making a false statement about the user's financial history in the one state the entire storage design exists to survive, and it is damage from a fix I approved and narrowed myself. Gate R5 is that item and nothing else: one `if`, half an hour, and I am declining to pair even its most likely trigger into the gate, because a one-item gate is why R4 worked.

On the five escalated conflicts. **C11:** the palette-by-index fact is real and I verified it at `:5746-5749`; it raises reordering from a list preference to a control over arbitrary chart colours, which is not enough to move a Low ahead of every Medium, and the deferral stands with the fact now recorded in it. **C12:** rejected again, and this rejection carries no trigger — it returns on an observed user, not a projected one. **C13:** the Engineering Manager was right to separate the halves; the sweep is rejected for the second time and the two stale comments are approved, on condition their replacements state an intent rather than a census. **C14:** I checked the claim rather than the principle, and the claim is wrong — `writeDb()` raises `showSaveError()` on every failure path, so a failed reorder is reported, just not toasted; the allow-list stands and its reason text is corrected instead. **C15:** not a conflict — two reviewers exercised two paths through five unconditional lines, and both were right.

Of 26 items I approved 23, rejected 2 outright plus one half, deferred 1, and narrowed 8 of the approvals. Two verification amendments, both inside existing tools: V6 fails `check-contrast.mjs` on a declared-but-unreferenced `--on-*` token — which would have caught this round's worst contrast finding mechanically — and `BARE_SAVE` is widened to detect a discarded call rather than a semicolon. The tool count is frozen at four. Excluding rejected and deferred work the approved roadmap is roughly three engineering days, the smallest this project has produced, and none of it needs a rewrite, a dependency, or a change to the single-file constraint.

---

## Implementation Priority

1. **Step 0 — WORK-78, then WORK-79.** Predicate widened, then the document corrected to the post-widening state and written to own no counts.
2. **WORK-71 [R5]** — alone.
3. **GATE R5 CLOSES** — V1's flows clean including a corrupted-store-then-throw walk, `npm run verify` zero across four tools.
4. **WORK-74** — the trigger, immediately after the symptom.
5. **WORK-72 + WORK-75** — one pass over `calcSalary`/`sSave`, two commits; the clamp covers both read sites.
6. **WORK-73** — the recovery path stops being silent.
7. **WORK-67 + WORK-68 + WORK-69 + WORK-84** — one measurement pass, five commits, closing on `check-contrast.mjs` returning zero with V6 in place.
8. **WORK-70** — alone; the census becomes a class statement.
9. **WORK-83 + WORK-92** — one pass over `.cal-*`, colour before geometry.
10. **WORK-77** — alone, after the write-target audit.
11. **WORK-76, WORK-80, WORK-81, WORK-82, WORK-86, WORK-89(comments), WORK-90, WORK-91** — separate commits, riding along.

---

## Recommended Next Action

**Land Step 0 — WORK-78 and WORK-79 — then gate R5's single item, WORK-71, and close the gate.** That is under a day and it is the same order that has worked for three consecutive rounds: the predicate is widened before anything is trusted to it, and the fix goes in last so the check can be run against it. Do not let the contrast pass into the gate. It is the largest and most visible block of work in the roadmap, every instinct will be to bundle it with the one-line guard because both feel like "the round-5 batch," and it is four items across sixteen theme blocks that starts the moment the gate closes. The single most valuable half-hour available to this project right now is `if (dataWasCorrupt) return;` — because it is the only line in three days of approved work that stops the application lying to a user about their money.

*(Round 5. Full reports: `reports/ui-review.md`, `reports/code-review.md`, `reports/engineering-manager.md`.)*
