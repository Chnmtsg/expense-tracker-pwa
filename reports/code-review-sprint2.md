# Code Review: Sprint 2 Post-Implementation (5764a05..52d3267)

Scope: the Sprint 2 items as ruled in `reports/chief-architect.md` and the items carried from `reports/chief-architect-sprint1-review.md`. Measured against `knowledge/coding-standards.md` and `knowledge/project.md`. I read the current `expense-pwa/index.html`, `expense-pwa/sw.js`, `package.json`, and the probes `tools/harness/accounts.js`, `goals.js` and `v1-write-flows.js`. I could not run git or `npm test`. Each "can fail" verdict below comes from reading what the probe asserts against what the pre-fix code did.

## Ruling Conformance

| Item | Matches ruling and conditions | Can the probe fail for its reason? | Findings |
|---|---|---|---|
| WORK-05 | Yes. In `analyzeExpenses` (`index.html:8321-8327`), contributions dated in the period are added to Savings, under the ruled "never reuse for a total" comment. The emergency-fund rule (`:8461-8470`) now also matches category names. Every other rule is untouched, and the Round 13 debt exclusion is intact. | Yes. `goals.js:85-107` expects "Savings healthy (23%)", which is 0% without the change and 84% if the out-of-period 500,000 leaked in. The fund spending is dated outside the period, so it proves the all-time read. | Clean |
| WORK-18 | Yes. `saveEditEntry` refuses an empty `mType`/`mCategory` through `refuseField`, using the add form's messages (`:13480-13482`). | Yes. `accounts.js:699-711` asserts the field is marked and the stored id is unchanged. It does not assert the message. | CODE-03 |
| UI-04 | Yes. "Enter a name", "Enter a target amount" and "Enter an amount" are used across the edit sheets (`:13136-13137`, `:13370`, `:13412`, `:13442`, `:13476`, `:13655`). | Yes. `said()` in `accounts.js:663-697`. | Clean |
| UI-05 / CODE-07 | Yes. `refuseEl(el, msg)` was added and `refuseField` delegates to it (`:5724-5736`). `saveEditIType`/`saveEditCat` use it with the `findByDataId` element (`:7680`, `:7689`, `:7765`, `:7770`). No ids are built from record ids. | Yes. `accounts.js:736-756`. | Clean |
| CODE-09 (WORK-06 part) | Yes. All eight UI-06 sites are now covered: expense edit, goal edit, debt edit, debt payment, log plan, contribution, `catAdd`, `incomeTypeAdd` (`accounts.js:658-735`). | Yes | Clean |
| WORK-19 | Yes. `...parsed` comes first and the known keys are applied over it (`:4176-4186`). Quarantine is unchanged. The `migrate()` comment is corrected (`:3843-3845`). | Yes. The round trip in `v1-write-flows.js:856-881` covers load, save, export (`importProblem`) and import (`importReplacement` + `load`), and goes red without the spread. | Clean |
| WORK-20 | Yes. The check is in the shared validator, the whole file is refused, and nothing is coerced at the read site (`:5193-5210`). `loadFromCloud` runs the same function (`:4423`). | Yes. `v1-write-flows.js:886-904` covers six bad shapes, plus the app's own settings, which are accepted. | Clean |
| WORK-17 | Yes. `stillHeld` is read after `save()` (`:4732-4738`) in `incAdd`, `expAdd`, `acctAdd`, `trAdd`, `debtAdd` and `goalAdd`. | Partly. The stale branch is probed in all six handlers. The quota branch, the one the ruling's Risk is about, is probed only in `incAdd`. | CODE-03 |
| WORK-16 | Yes. `editTargetGone()` with the ruled sentence (`:13104-13112`) is in all ten sheets, including `saveEditGoal`. | Yes. `accounts.js:763-802` covers all ten sheets. | CODE-01 (adjacent, pre-existing) |
| WORK-11 | Sentence: yes (`:8254`). Keys: removed by name, with no prefix sweep (`:8264`). | Yes, for storage. `accounts.js:1612-1627`. | CODE-02 |
| WORK-12 | Yes (`:10913`). | Yes (`accounts.js:805-820`). | Clean |
| WORK-14 | Yes. UI-10's sentence is used verbatim (`:8041`). The threshold is unchanged. | Yes. The sentence and the threshold are checked together (`goals.js:112-127`). | Clean |
| WORK-23 | Yes. The `refocusModalTop` comment (`:6312-6315`) and the `renderDashboard` comment (`:8696-8698`) state the rule without the stale tally. | n/a | Clean |
| UI-07 | Yes. The exact sentence is used (`:12929-12935`): only when there is an `accountId` and the date is not after today, with "Deleted account" when the account is gone. | Yes. `goals.js:131-161` covers all four branches. | Clean |
| WORK-09 | Yes. There is one writer, `pushIncomeWithSplit(prefix, entry)` (`:10571-10587`), used by `incAdd` (`:6943`) and `sSave` (`:6908`). It refuses before anything is pushed, and the salary record and its income go out in one `save()` (`:6912`). The account block uses `fillAccountSelect`→`rebuildSelect` (`:6837-6842`, markup `:2851-2862`). The C8 note is updated (`:4221-4224`). All callers of the changed signatures pass a prefix: I found no bare call in the app or the harness. | Yes. `accounts.js:581-646` covers no accounts (one write, no `accountId`, block hidden), identical moves, and an over-split refusal that writes nothing. | CODE-04 |
| sw.js | `sw.js:9` reads `expense-tracker-v29`. No new assets. | n/a | Clean |

## Executive Summary

Sprint 2 lands every item in its ruled shape. Every condition of approval has a probe that would go red on the pre-fix code, and all of them run inside `npm test` (`package.json:22`). Nothing in the sprint writes a stored figure wrongly. The one schema-adjacent change, WORK-19, carries the round-trip probe the ruling required.

The biggest risk is not in Sprint 2's own lines. It is in a handler Sprint 2 edited. The log-plan sheet does not remember which occurrence it was opened for. If another window logs that occurrence first, Save records a second expense for it and marks the next occurrence paid, so that reminder silently disappears (CODE-01). The remaining findings are Low: Reset clears the display currency from storage but not from the open session, two probe gaps, and a salary getter that repaints the screen.

## Overall Score

**88 / 100.** There is no Critical or High finding, and every ruling is met with a probe that can fail. One Medium (CODE-01, a schedule-cursor defect of the WORK-08 class, pre-existing but in a handler this sprint touched) and three Lows keep it just below 90.

## Findings

### Critical

None.

### High

None.

### Medium

**CODE-01 — The log-plan sheet logs whatever occurrence is due at Save time, not the one it showed**

- Severity: Medium
- Location:
  - `expense-pwa/index.html:6077-6106` (`openLogPlannedModal`). `editCtx` is `{ kind: 'logPlanned', planId }` at `:6084`, so the `due` it displays and prefills into `#mDate` at `:6090` is not kept.
  - `:13407-13431` (`saveEditLogPlanned`), including the comment at `:13427-13428`.
  - `:6024-6036` (`logPlannedAsActual`).
- Evidence:
  - Window A opens Log for a recurring plan due on day X, so `#mDate` holds X. Window B logs X.
  - A's storage listener replaces `db`, and the sheet stays open (`navigate()` does not close modals, `:6732-6761`). The plan still exists, so the WORK-16 guard at `:13410` passes.
  - `logPlannedAsActual` recomputes `due` as the next occurrence Y. It writes an actual dated X (from the field) and sets `p.recLastDone = Y` (`:6036`).
  - Result: a second expense for X, and occurrence Y marked paid with no expense, so Y's reminder is gone.
  - For a one-off plan, `res` is `null`, and the sheet closes with no message (`:13429`). That contradicts the rule written above `editTargetGone` ("Said in words, never a silent close").
  - The comment at `:13427` says `res` is null "only if the plan was logged elsewhere". That is false for recurring plans.
  - The WORK-16 probe removes records but never pre-logs one, so this path is unguarded.
- Impact: In the multi-window case the cross-window design exists for, a schedule silently drops a reminder and the period's expenses include a duplicate. This is the same symptom class as WORK-08 and CODE-05 (Sprint 1), which were Medium.
- Recommendation:
  - Keep the displayed occurrence in `editCtx` (`{ kind: 'logPlanned', planId, due }`).
  - In `saveEditLogPlanned`, after the existing guard, compare it with `nextPlannedDue(p)`. If they differ, close with a sentence in the WORK-16 style rather than writing, for example "This was already logged in another window. Nothing was saved."
  - Correct the `:13427` comment.
  - Add one case to the `accounts.js` WORK-16 flow: open Log, advance `recLastDone`, then Save.
  - This does not touch `logPlannedAsActual`'s other callers.
- Effort: S

### Low

**CODE-02 — Reset removes the display currency from storage but leaves it applied for the rest of the session**

- Severity: Low
- Location: `expense-pwa/index.html:8258-8273` (Reset handler), `:9761-9771` (`displayCurrency`, `loadDisplayCurrency`), `:13812-13813` (the only call to `loadDisplayCurrency`). Probe: `tools/harness/accounts.js:1612-1627`.
- Evidence:
  - The handler removes `'display-currency'`, `FILTER_STATE_KEY`, `'conv-last-from'` and `'conv-last-to'` from storage. The in-memory `displayCurrency`, `convFromCurr` and `convToCurr` stay as they were.
  - `renderSettings()` and `renderDashboard()` then redraw from the old in-memory currency. After "Reset complete", Settings still shows, for example, USD, and the ≈ readings stay. On the next launch the setting silently becomes MNT.
  - The handler applies its own principle to the theme, with the comment "the screen must stop wearing the old one", but not to this setting.
  - The key is written as the literal `'display-currency'`. The comment says this is because `DISPLAY_CURRENCY_KEY` is "declared further down". That reason does not hold: the handler runs on a click, after the whole script has run, so the constant is initialised. The ruling names `DISPLAY_CURRENCY_KEY`.
  - The probe checks storage only.
- Impact: The confirmation says settings are deleted, but one visible setting stays on screen until reload and then changes without a word. Nothing financial is affected.
- Recommendation:
  - Use `DISPLAY_CURRENCY_KEY` and drop the stale comment.
  - After the removals, call `loadDisplayCurrency(); syncDisplayCurrencyControl();` before the existing renders.
  - Add one assertion to `resetFlow` that `displayCurrency === 'MNT'` after Reset.
  - No prefix sweep is needed.
- Effort: XS

**CODE-03 — Two Sprint 2 probes leave the property the ruling cared about unguarded in part**

- Severity: Low
- Location: `tools/harness/v1-write-flows.js:945-961`; `tools/harness/accounts.js:699-711`.
- Evidence:
  - **WORK-17:** The ruling narrowed the scope because of one Risk: a form left filled after a quota failure invites a duplicate financial record. The quota branch is asserted only for `incAdd`. In any of the other five handlers (`:7478`, `:10894`, `:10920`, `:12571`, `:12688`), a future change from `stillHeld(...)` to `if (ok)` would pass the stale-branch check and reintroduce the duplicate risk with nothing turning red.
  - **WORK-18:** The flow asserts the mark and the unchanged id, but not the message. The ruling says to refuse "with the add form's message", and UI-04 made matching messages the standard.
- Impact: The guard covers one of six handlers for the risk that justified the amended scope, and none for the WORK-18 wording.
- Recommendation:
  - Loop the existing quota block over the same `forms` table the stale block already uses, asserting that the amount field is empty.
  - Add `said('Add a category first', …)` and `said('Add an income type first', …)` beside the two `marked` calls.
  - This is harness only.
- Effort: XS

**CODE-04 — The Salary split's amount getter repaints the Salary screen**

- Severity: Low
- Location: `expense-pwa/index.html:10518-10521` (`INCOME_FORM_AMOUNT.s: () => calcSalary().net`), `:6784-6826` (`calcSalary` writes ten elements and calls `renderConvReading`), `:6833`.
- Evidence:
  - `renderIncomeSplit('s')` and `updateSplitRest('s')` each call the getter. One keystroke in a salary field therefore runs `calcSalary()` up to three times: once in the listener, once in `renderIncomeSplit`, and once in `updateSplitRest`. Each run rewrites the breakdown and re-reads and re-parses the rates cache.
  - Typing in a split row repaints the salary breakdown as well.
  - The `'inc'` getter, by contrast, only reads a field.
- Impact: The behaviour is correct today. But a function the shared split code treats as a pure read has side effects. That breaks "One responsibility per function", and any future side effect added to `calcSalary` will fire from the split rows.
- Recommendation: Split `calcSalary` into a pure `computeSalary()` that returns the rounded object, plus the existing paint. Point `INCOME_FORM_AMOUNT.s` at the pure part. No behaviour change.
- Effort: XS

## Review Areas

- **Correctness of money:** Clean for Sprint 2's own changes. The salary net and its split floors use the same rounded `r.net`, and a split larger than the net is refused before anything is pushed. One adjacent issue: CODE-01.
- **Data and persistence:**
  - WORK-19 and WORK-20 meet their rulings.
  - Migrations run after the spread and only delete keys, so carrying `parsed` through changes no v0/v1 outcome.
  - The single-save property of `sSave` holds.
  - Offline behaviour is unchanged, and no new path reaches the network.
- **Architecture:** Clean. There is one implementation of "income with its split" for two forms, and `refuseField` is now a thin wrapper over `refuseEl`.
- **Maintainability:** CODE-04. Comments touched this sprint state rules, not tallies, except the stale reason in CODE-02.
- **Error handling:** CODE-01 (one silent close). Every other edit handler now says why it did nothing.
- **Security:** Clean. New user text reaches the DOM through `textContent` (`confirmDialog`, `toast`) or `escapeHTML` (split rows, advisor tips).
- **Performance:**
  - Nothing measured regresses.
  - The new emergency-fund check scans all of `db.actual` with a category `find` per row on each Home render (`:8465-8466`). I have not raised it, because the standards forbid premature optimisation and no measurement shows a cost.
  - If WORK-22's measurement is ever extended to Home, precomputing the set of matching category ids is the fix.
- **Reliability and scalability:** Clean for the scope reviewed.
- **Technical debt:** see below.

## Technical Debt

- The edit sheets identify their target by id only, not by the state they displayed. WORK-16 handles "gone", but not "changed underneath" (CODE-01). The WORK-10 wrapper re-finds the record by id at write time. It should also be able to compare a version or occurrence, or this class will reappear on each sheet it absorbs.
- UI preferences live in separate side keys with in-memory mirrors (CODE-02). Every new side key needs its own Reset and Import handling, by name.
- `calcSalary` combines computing and painting (CODE-04), and the shared split code now depends on it.

## Future Risks

- **WORK-19 now carries unknown top-level keys indefinitely.** Junk keys from hand-edited files will persist into every export and cloud payload too. That is the intended trade, but the cloud blob size question (Firestore 1 MiB, raised in earlier rounds) gets slightly worse.
- **WORK-20 refuses files that a pre-fix cloud load may already have stored.** A device whose local store took a malformed `notifications` block from cloud before this sprint will produce exports that its own Restore now refuses. This is rare, and it follows the ruling. If reported, the answer is to fix the stored value, not to loosen the validator.
- **Notifications work (a WORK-10 trigger) will add more sheets that act on a schedule occurrence.** Each inherits CODE-01 unless the occurrence is carried in `editCtx`.

## Recommended Refactoring

1. **CODE-01.** Carry the displayed `due` in `editCtx` for the log-plan sheet, and refuse in words when it no longer matches. This is the only item that touches stored schedule state.
2. **CODE-03.** Two harness loops, so the WORK-17 duplicate-record risk and the WORK-18 wording are guarded in every handler.
3. **CODE-02.** Use the constant, and reload the display currency after Reset.
4. **CODE-04.** A pure `computeSalary()` behind the existing paint.

No rewrite, library or schema change is needed for any of them.

Files referenced:
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\expense-pwa\sw.js
- D:\3_Claude\PowerApps\tools\harness\accounts.js
- D:\3_Claude\PowerApps\tools\harness\goals.js
- D:\3_Claude\PowerApps\tools\harness\v1-write-flows.js
- D:\3_Claude\PowerApps\package.json
- D:\3_Claude\PowerApps\reports\chief-architect.md
- D:\3_Claude\PowerApps\reports\chief-architect-sprint1-review.md
