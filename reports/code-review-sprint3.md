# Code Review: Sprint 3 Post-Implementation (69f5d6b..d7167d7)

**Inputs.** I read `knowledge/review-conventions.md`, `knowledge/coding-standards.md` and `knowledge/project.md`. The rulings I checked against are `reports/chief-architect.md` (the Sprint 3 list, the WORK-10 step 1 shape and its standing rule, WORK-21, the WORK-22 deferral) and `reports/chief-architect-sprint2-review.md` (the CODE-04 carry, the occurrence rule, the Reset rule). Source files read: `expense-pwa/index.html`, `tools/harness/accounts.js`, `tools/harness/perf.js`, `reports/HANDOFF.md`, `expense-pwa/sw.js` and `eslint.config.mjs`.

I could not run git, npm or the probes. Every statement below comes from reading the current code. Where I say a probe "can fail", I mean the code path it asserts on would differ on the pre-fix shape I describe. I did not see it go red.

## Executive Summary

Sprint 3 does what the rulings say it should.
- `commitWrite` is synchronous and calls `save()` → `writeDb`, so there is no second write path.
- It checks for a gone record before it checks for a replaced `db`, and its return contract (`true`/`false` from `save()`, `null` when nothing was attempted) is honoured by all five callers.
- `computeSalary` is pure, and WORK-13 and WORK-15 render and escape correctly.

There are no Critical, High or Medium findings. The nine Lows fall into three groups:
- **A probe gap on the one new await.** The WORK-21 dialog put an `await` into `saveEditAccount`. That is the only place on the wrapper where the "snapshot before any await" property actually does work, and nothing probes it.
- **Records that misstate what landed.** The WORK-22 HANDOFF entry names the wrong item and leaves its ruled decision unsettled.
- **Design-record comments that claim properties the code lacks.**

The biggest risk is the first group. WORK-10 step 1 exists to protect exactly this window, and a regression there would ship green.

## Overall Score

**91 / 100.** Every finding is Low. Nothing writes a wrong figure, and every ruled condition is present in the code.

It sits at the bottom of the 90-100 band, not higher, for two reasons:
- The wrapper's most important property is unguarded at its one live use (CODE-01).
- The WORK-22 measurement was delivered without settling, or escalating, the decision the ruling made it settle (CODE-02).

## Conformance by Item (one line each where clean)

- **WORK-10 step 1: matches the ruling.**
  - `commitWrite` (`index.html:10714-10720`) takes a snapshot the caller captured before its first await. At write time it finds the record again by id in the current `db`.
  - A gone record goes to `editTargetGone()`, which uses WORK-16's sentence.
  - A replaced `db` gets `DB_REPLACED_MSG` in an "Not saved" dialog. The gone check runs first, so a record deleted in another window is named as deleted, not as "changed". `wrapperFlow` case 1 pins that order: swapping the two checks turns it red.
  - `apply(record)` then mutates the current `db`, and `save()` writes it.
  - It is applied to `acctAdd` (`:10953`), `trAdd` (`:10973`), the move delete (`:10944`), the account delete (`:10887`) and `saveEditAccount` (`:13760`). No `dbReplacedSince` remains in Accounts, and none was added anywhere.
  - Two side effects of the ruled shape:
    - A delete whose record vanished now shows WORK-16's sentence.
    - `editTargetGone()` runs `closeEditModal()` on the two list deletes, where no sheet is open. That is harmless today: `closeModal` with no stack entry pushes no history. See Technical Debt.
- **CODE-04: matches the ruling.**
  - `computeSalary()` (`:6804`) writes no element. `calcSalary()` (`:6827`) paints from it, and `INCOME_FORM_AMOUNT.s` (`:10548`) reads it.
  - The probe at `accounts.js:643-645` sets `#sGross` to a sentinel and goes red if a split-row keystroke repaints it.
  - Two stale comments remain (CODE-05), and a pre-existing claim inside the new function is false (CODE-04).
- **WORK-21: matches the ruling**, with one probe gap (CODE-01).
  - The warning is built on the wrapper, using `accountShortfalls` and the existing `choiceDialog`. It warns and then allows.
  - Validation (name, share) runs before the dialog. Declining keeps the sheet open.
  - `openingWarnFlow` covers four cases, each of which can fail: decline, Save anyway, a raise, and a cut that leaves money.
  - The existing synchronous flows that save the account sheet (`accounts.js:398-401`, the WORK-16 flow) stay valid, because `saveEditAccount` reaches no `await` when there is no shortfall.
- **WORK-22: the measurement is sound; the record is not** (CODE-02, CODE-03).
  - `timeList` asserts that the drawn row count equals the list's own count and meets a minimum, so it cannot time an empty render.
- **WORK-13: matches UI-08's listed sites, plus Debts and money moves.**
  - Labels are escaped once and do not double-escape (`:7006`, `:7595`, `:10911`).
  - Probe gaps are in CODE-06. Two bare history-sheet deletes remain (CODE-07).
- **WORK-15: matches the ruling.**
  - One `.group-label` sits directly above `#trList` and is shown only when there are rows (`:3238`, `:10908`).
  - The probe checks the text, the adjacency and the empty case.
  - One comment overclaims (CODE-08).

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

**CODE-01: The wrapper's "snapshot before any await" property is unprobed at its one live await (`saveEditAccount`)**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:13738-13769` (`saveEditAccount`)
  - `tools/harness/accounts.js:1805-1844` (`openingWarnFlow`)
  - `tools/harness/accounts.js:1759-1801` (`wrapperFlow`)
- **Evidence:**
  - WORK-21 added `await choiceDialog(...)` (`:13757`) between `const snap = db` (`:13739`) and `commitWrite(snap, ...)` (`:13760`).
  - `wrapperFlow` drives another window only through the two list deletes.
  - `openingWarnFlow` never changes storage while the dialog is open.
  - So no probe goes red if `saveEditAccount` passes `db` instead of `snap` (the snapshot taken late), or if the snapshot capture moves below the `await`. In either case an opening cut that was warned against the old records would be written over the other window's records.
  - `acctAdd` and `trAdd` have no await, so their snapshot check is trivially true and cannot be the guard. The deletes are covered.
- **Impact:** This is the exact property WORK-10 step 1 was ruled for, at the first new write behaviour built on it. A regression would ship green.
- **Recommendation:** Add one case to `openingWarnFlow`, using `wrapperFlow`'s `otherWindow` helper.
  - Inside the stubbed `choiceDialog`, have the other window add an expense on `AO`, then return `'alt'`.
  - Assert that the opening is unchanged, that the alert is `DB_REPLACED_MSG`, and that the sheet is still open (`editCtx` set).
  - Show it red by temporarily passing `db` as the snapshot.
- **Effort:** XS

**CODE-02: The WORK-22 HANDOFF entry names the wrong item and leaves the ruled delegation decision neither settled nor escalated**

- **Severity:** Low
- **Location:** `reports/HANDOFF.md:116-125`
- **Evidence:**
  - The entry says "WORK-13's delegation question stays a ruling". Delegation is the deferred **WORK-22, delegation** row (`chief-architect.md:76`). WORK-13 is the aria-label item.
  - That row reads: "Settled by the WORK-22 measurement. If ... over 100 ms at 10,000 records under the assumed 6x ... approve delegation ... Otherwise close it."
  - The recorded figures are All Time 137 ms (Income) and 145 ms (Expenses). Both are over 100 ms even unthrottled, and about 0.8-0.9 s at 6x. This Month is about 30 ms at 6x.
  - The entry instead applies C44: "may corroborate a deferral, not fire one". It does not mention the standing rule at `HANDOFF.md:875`: "WORK-210(b) lands *first* the day anything turns on a number". The ruling made this deferral turn on this number.
  - The ruling also does not say which filter configuration the trigger means. This Month passes; All Time fails.
- **Impact:** The deferral the measurement was commissioned to settle is left in an undefined state, under the wrong ID. Someone reading HANDOFF for the delegation question will search for WORK-13 and find the aria-label work.
- **Recommendation:**
  - Correct the ID to "WORK-22 (delegation)".
  - State plainly that the two standing rules conflict here: the Round 19 deferral says this figure settles the item, while C44 and WORK-210(b) say it cannot until the wall-time bound lands.
  - Send it up for a ruling on which configuration the trigger means and whether WORK-210(b) lands first.
  - Do not build delegation, and do not close the item, in the meantime.
- **Effort:** XS

**CODE-03: The WORK-22 seed is fixed to 2024-2026, so the This Month measurement stops working on 2027-01-01**

- **Severity:** Low
- **Location:** `tools/harness/perf.js:244-251`, `:278-279`, `:287-288`
- **Evidence:**
  - Records are dated `new Date(2024, (w * 7) % 36, ...)`, which covers January 2024 to December 2026.
  - The This Month cases call `timeList(..., 1)`, which throws "setup failed" when fewer than one row is drawn.
  - From January 2027, This Month holds no seeded record.
  - It fails loudly, not falsely, and `perf.js` is not in `npm test`. But the measurement the ruling asked for, "in the same form", cannot be repeated after 12 weeks.
- **Impact:** The next person to re-take the figure, for example after WORK-210(b) lands as CODE-02 requires, gets a setup failure with no obvious cause.
- **Recommendation:** Anchor the seed to the current month: count months back from `new Date()` instead of forward from 2024. Leave the spread and the record counts unchanged.
- **Effort:** XS

**CODE-04: The Salary breakdown can still print parts that do not add up to its gross, while the comment says it cannot (pre-existing)**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:6795-6821` (`computeSalary` and its comment)
- **Evidence:**
  - Each component is rounded on its own, and so is `gross`.
  - Example: rate 3, overtime 1, night 1.
    - `otPay` 4.5 rounds to 5, and `ntPay` 3.6 rounds to 4.
    - `gross` 8.1 rounds to 8.
    - The screen and the stored `db.salaries` row show 5 + 4 under a gross of 8.
  - A realistic case: rate ₮10,001 with 1 OT and 1 OT+night hour gives parts 15,002 + 18,002 under a gross of 33,003.
  - The comment, carried into the function this sprint wrote, says this was fixed ("could print parts that did not add up to its own total"). The archived ruling (`archive-chief-architect-round8.md:108-112`) records that defect as closed.
  - The stored income amount (`r.net`) is correctly rounded. Only the breakdown disagrees with itself, by ₮1 per rounded part.
  - CODE-04 was ruled as no behaviour change, so it was right not to fix this.
- **Impact:** A breakdown off by ₮1 reads as an arithmetic fault in the app's one payroll calculator. A standing record states a property the code does not have.
- **Recommendation:**
  - Not part of CODE-04. Raise it for a ruling.
  - The smallest fix: derive `gross` as the sum of the rounded parts, and `net` as `gross - r(si) - r(wht)`, so the totals are built from what is shown.
  - Until then, correct the comment to say what the code does.
- **Effort:** S

**CODE-05: Two comments in the `sSave` handler still name `calcSalary()` as the site that reads and clamps the inputs**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:6895-6901`, `:6918-6920`
- **Evidence:**
  - The comments say "Through readSalaryField, not unnum, for the same reason calcSalary() is", "Clamping only inside calcSalary()'s g()" and "calcSalary() rounds its entire return object now".
  - After CODE-04, `g` and the rounding live in `computeSalary()`. `calcSalary()` only paints.
  - This breaks the coding standard: "Comments in this project are the design record. Keep them true" and "When you open a block, re-read the comment above it."
- **Impact:** A reader is sent to the paint function to find the clamp and the rounding boundary.
- **Recommendation:** Replace `calcSalary()` with `computeSalary()` in those three sentences. Change nothing else.
- **Effort:** XS

**CODE-06: The WORK-13 probe checks only buttons that already have an `aria-label`, under a comment claiming "every list"**

- **Severity:** Low
- **Location:** `tools/harness/accounts.js:849-874`; the selector is at `:862`
- **Evidence:**
  - The selector is `c[1] + ' button[aria-label]'`.
  - A row button that loses its `aria-label` entirely falls back to its `title` ("Delete") as its accessible name. That is the exact defect, and it is not selected, so the probe stays green as long as any other button in the list keeps a label.
  - Only `I1`'s label is asserted in full. The others are only checked against the `BARE` pattern.
  - The comment "on every list" conflicts with CODE-07 and with the standard "Never write ... 'all' ... unless something enforces it."
- **Impact:** The regression most likely to reach WORK-13 (a render rewrite that drops the attribute) is the one this probe cannot see.
- **Recommendation:**
  - Select `button[data-edit-*], button[data-del-*], button[data-goal-*], button[data-debt-*]` per list, and fail on a missing label as well as a bare one.
  - Reword the comment to name the lists the probe covers.
- **Effort:** XS

**CODE-07: Debt-payment and goal-contribution history rows still have identity-less Delete buttons**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:12139` (`aria-label="Delete payment"`), `:12984` (`aria-label="Delete contribution"`)
- **Evidence:** Each row in these two history sheets has a Delete that a screen reader announces identically. This is UI-08's defect class, in sites UI-08 did not list. WORK-13 was right to keep to its listed scope.
- **Impact:** In a long payment or contribution history, a screen-reader user cannot tell which money record a Delete removes.
- **Recommendation:** Raise it to UI Review and the Engineering Manager for scoping. If approved, use the same `rowName` pattern (date and amount).
- **Effort:** XS

**CODE-08: The WORK-15 markup comment says the list is "The only place a move can be reviewed or undone"**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:3235-3237`
- **Evidence:** Moves are also removed in two other places:
  - Deleting an income takes its split moves (`:7040`).
  - Data Summary has "Clear all Money moves" (`:7933`).
  
  The coding standard says: "Never write 'the only' ... unless something enforces it." The phrase comes from the ruling's reason text, but a reason is not a comment's licence.
- **Impact:** A future reader may treat `#trList` as the sole undo path when reasoning about cascade or clear behaviour.
- **Recommendation:** State the rule without the absolute, for example: "Where moves are reviewed and undone one at a time. Labelled, and only when there are rows ..."
- **Effort:** XS

**CODE-09: HANDOFF does not record that Sprint 3 landed or that the wrapper rule is now in force, and the deploy key is ambiguous**

- **Severity:** Low
- **Location:** `reports/HANDOFF.md:36-48`; `expense-pwa/sw.js:9`
- **Evidence:**
  - "Where things stand" still ends "Next: deploy v29 on the owner's word, then Sprint 3 ... with CODE-04 carried."
  - HANDOFF has no mention of `commitWrite` or of the standing rule "every new write path uses the wrapper, no new hand-placed `dbReplacedSince`".
  - `sw.js:9` reads `expense-tracker-v29`. HANDOFF cannot say whether v29 reached clients before Sprint 3 merged on top of it, which decides whether Sprint 3 ships under v29 or needs v30.
- **Impact:**
  - The next session will not learn the rule that Sprint 3 exists to establish. That is the rule `chief-architect.md:41` calls "the real value of step 1".
  - Deploying under an already-shipped key would leave clients on stale code.
- **Recommendation:**
  - Add a Sprint 3 bullet that lists the merged items and states the wrapper rule.
  - Record whether v29 was deployed. If it was, bump `sw.js` to v30 before deploying Sprint 3.
- **Effort:** XS

## Review Areas

- **Correctness of money:**
  - The Sprint 3 changes touch no amount arithmetic except `computeSalary`, which is unchanged in behaviour.
  - A pre-existing breakdown inconsistency is recorded as CODE-04.
- **Data and persistence:**
  - The wrapper keeps `writeDb` as the single guarded write.
  - A stale refusal inside `save()` reloads `db`, and `stillHeld` keeps the add forms populated, as WORK-17 ruled.
  - No schema, export or cloud change. Clean apart from CODE-01.
- **Architecture:** One wrapper, no second path, no new abstraction. Clean.
- **Maintainability:** CODE-05 and CODE-08 (comments); otherwise clean.
- **Error handling:**
  - Every `commitWrite` refusal is said in a dialog.
  - `ok === null` returns are checked at all five call sites.
  - `false` reaches `savedToast`, which says why. Clean.
- **Security:** The new `aria-label` strings go through `escapeHTML` exactly once. No new DOM sink. Clean.
- **Performance:** Measured, not changed. CODE-02 and CODE-03.
- **Reliability and scalability:** All Time list renders are above the ruled threshold at 10,000 records (CODE-02). That is for the ruling to act on.
- **Technical debt:** See below.

## Technical Debt

- **The wrapper's gone path reports through the edit-sheet outlet.** `commitWrite` calls `editTargetGone()`, which runs `closeEditModal()`: it nulls `editCtx` and closes `#editModal`. That is right for `saveEditAccount` and a no-op for the two list deletes today. When later stages bring history-sheet deletes (CODE-07's sites) or bell actions onto the wrapper, a gone record there would also clear any `editCtx` and close `#editModal`. Before the first non-sheet handler with an open modal is migrated, give `commitWrite` a way to report "gone" without closing the edit sheet. For example, a `gone` callback that defaults to `editTargetGone`.
- **Six hand-placed `dbReplacedSince` calls remain outside Accounts** (`index.html:13387`, `:13472`, `:13495`, `:13536`, `:13614`, `:13652`). These are ruled for the later stages, and they are where the CODE-01 class can still recur sheet by sheet.
- **The Salary rounding scheme** (CODE-04) sits under a standing record that says it was closed.

## Future Risks

- **The WORK-10 later stages are now one trigger away.** Under trigger (c), step 1 has landed, so the next account-touching flow fires them. Without CODE-01's probe pattern, each migrated sheet with a dialog repeats the gap.
- **The WORK-22 decision gates delegation**, and WORK-13 explicitly lands before it. If delegation is approved, it rewrites the same render functions WORK-13 just labelled. CODE-06's stronger probe is what would catch a label lost in that rewrite.
- **The CODE-01 class in the bell.** The Sprint 2 ruling's open risk (a stale bell row tapping a moved occurrence) is unchanged by Sprint 3, and becomes due when Notifications work starts.

## Recommended Refactoring

No structural change is needed. The smallest set that removes the most risk:

1. **CODE-01:** one cross-window case in `openingWarnFlow`, shown red against a late snapshot.
2. **CODE-02 / CODE-09:** correct and complete the HANDOFF records, and send the WORK-22 configuration and WORK-210(b) question up for a ruling.
3. **CODE-06:** widen the WORK-13 probe's selector.
4. **CODE-03, CODE-05, CODE-08:** XS fixes to a seed and to comments.
5. **Before WORK-10's later stages:** decouple the wrapper's gone report from `closeEditModal()` (Technical Debt, first item).

CODE-04 and CODE-07 need a ruling or scoping before any code changes.

Relevant files:
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\expense-pwa\sw.js
- D:\3_Claude\PowerApps\tools\harness\accounts.js
- D:\3_Claude\PowerApps\tools\harness\perf.js
- D:\3_Claude\PowerApps\reports\HANDOFF.md
- D:\3_Claude\PowerApps\reports\chief-architect.md
- D:\3_Claude\PowerApps\reports\chief-architect-sprint2-review.md
