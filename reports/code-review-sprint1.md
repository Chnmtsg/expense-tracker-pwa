# Code Review: Sprint 1 (1be4f80..main)

**Scope.** WORK-02, WORK-01, WORK-03, WORK-04, WORK-08, WORK-07 and WORK-06, plus the v28 cache key. Each one was checked against its ruling in `reports/chief-architect.md` (Approved Improvements).

**Files read:**
- `D:\3_Claude\PowerApps\expense-pwa\index.html`
- `D:\3_Claude\PowerApps\expense-pwa\sw.js`
- `D:\3_Claude\PowerApps\tools\harness\accounts.js`
- `D:\3_Claude\PowerApps\tools\harness\goals.js`
- `D:\3_Claude\PowerApps\package.json`
- `D:\3_Claude\PowerApps\tools\harness\run.mjs` (how pass/fail is decided)

**What could not be assessed, and why:**
- This role has Read, Glob and Grep only, so `git diff` and `git log` could not be run.
- Commit subjects come from `D:\3_Claude\PowerApps\.git\logs\HEAD`. The only commit body readable on disk is the last one (`.git\COMMIT_EDITMSG`, the v28 staging commit). The bodies of the seven WORK commits are in compressed git objects.
- So the evidence those commits claim (for example "shown failing on current `main`") has **not** been verified. No `npm test` result is claimed here.
- The changed regions were found by their WORK-xx markers and read in full, together with the flows around them.

---

## Executive Summary

All seven items match their rulings in shape. Each one reuses an existing mechanism (`navigate`, the `visibilitychange` listener, `refuseField`, `stepDate`, `confirmDialog`), and none adds a stored field, a schema change or a new dependency.

The biggest risk is that WORK-02's scroll reset may be undone on every destination reached through the More sheet (Accounts, Goals, Debts, Salary, Settings, Budget Planning):
- `navigate()` scrolls to the top while the closed sheet's history entry is still waiting to be removed.
- The deferred `history.go(-n)` then traverses with `history.scrollRestoration` left at `auto`, so the browser can put back the scroll position from before the sheet opened.
- The WORK-02 probe calls `navigate()` directly and never goes through a modal, so it cannot see this.

The other findings are Low: probe gaps, two inaccurate comments, and two "today"-adjacent surfaces the day-rollover branch does not refresh.

## Overall Score

**80 / 100. Solid (75-89).**

One contained High (CODE-01) holds it below 90. CODE-01's mechanism comes from the code plus documented browser behaviour, and was not run. If the probe in its recommendation shows the reset holds on the More paths, the remaining findings are all Low and the score would be about 88. Correctness of money and data is clean for this sprint: nothing here writes a stored figure wrongly, and WORK-03 is probed as writing nothing to the store.

**Ruling conformance, item by item:**

| Item | Ruled shape followed? | Notes |
|---|---|---|
| WORK-02 | Yes: `if (from !== name) window.scrollTo(0, 0)` at `index.html:6682`, same-screen exemption kept | CODE-01, CODE-02 |
| WORK-01 | Yes: one helper, `rebuildSelect` (`:10622-10629`), used for `incType` (`:6883`), `expCategory` (`:7416`), and `incAccount`/`expAccount` via `fillAccountSelect` (`:10603-10609`). `renderDebts` untouched. `setExpMode` (`:6964`) and `confirmSpend` (`:10569-10571`) comments corrected. Probe uses a non-first category and an empty `db.actual` (`accounts.js:909-929`) | Clean |
| WORK-03 | Yes: one branch in the existing listener (`:4674-4677`), only on a changed day; presets re-applied except Custom; the four entry dates moved only if they still hold the previous day; `navigate(current)`; no `save()`, no sheet fields touched; `calDate` excluded; month-boundary case in the harness | CODE-03, CODE-04, CODE-06, CODE-09 |
| WORK-04 | Yes: the sentence appears only when a contribution names an account (`:10315-10329`); advisor reworded (`:8479`); cascade unchanged | CODE-08 |
| WORK-08 | Yes: walks `stepDate` from `recStartDate` (`goalOccurrenceAtOrBefore`, `:7078-7088`); `null` only when none remain (`:12800`); first Goals flow in `npm test` (`package.json:22,27`) | CODE-05, CODE-06, CODE-08 |
| WORK-07 | Yes: Actual disabled for a repeating plan with a helper pointing to Log (`:12862-12869`); a one-off plan unchanged | Clean |
| WORK-06 | Yes, for every UI-06 location: `saveEditGoal`, debt edit, debt payment, log plan, contribution, `saveEditEntry`, `catAdd`, `incomeTypeAdd` | CODE-07, CODE-09 |
| v28 | `sw.js:9` reads `expense-tracker-v28` | Clean |

---

## Findings

### Critical

None.

### High

**CODE-01: WORK-02's scroll reset is probably undone by the deferred history traversal on every navigation that follows a modal close**

- **Severity:** High
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - `navigate()` `:6682`
  - More-sheet navigation `:6643-6651`
  - `openModal` `:6310` (pushState)
  - `closeModal` `:6336-6341`
  - `flushPendingBacks` `:6290-6296`
  - `confirmSpend` Move hand-off `:10568-10578`
  - Probe: `D:\3_Claude\PowerApps\tools\harness\accounts.js:685-703`
- **Evidence:**
  - `openModal` calls `history.pushState`. In Chrome that saves the current scroll offset on the entry being left.
  - The `[data-more-nav]` handler calls `closeModal(moreSheet)` and then `navigate(dest)` in the same task.
  - `closeModal` defers the history removal with `setTimeout(flushPendingBacks, 0)`, which runs `history.go(-n)` *after* `navigate()` has already called `window.scrollTo(0, 0)`.
  - Nothing in the repository sets `history.scrollRestoration` (Grep finds no match). With the default `auto`, a same-document traversal restores the scroll offset saved on the target entry, which is the position the user was at when they opened More.
  - The `confirmSpend` Move hand-off runs the same sequence (choiceDialog closes → `navigate('accounts')` → `trAmount.focus()` → deferred `go(-1)`).
  - The WORK-02 probe calls `navigate()` with no modal open, so this path is never exercised.
  - **Not executed.** This is an inference from the code and documented browser behaviour.
- **Impact:** If it is confirmed, the High defect WORK-02 was ruled to fix remains on Accounts, Goals, Debts, Salary, Settings and Budget Planning. Only the four tab-bar destinations are fixed. The Move hand-off could also leave `#trAmount` out of view, which is the property the ruling asked to be confirmed.
- **Recommendation:**
  1. First, add a probe that scrolls Home, opens `#moreSheet`, clicks a `[data-more-nav]` button, waits for the deferred traversal (around 100 ms), and asserts `scrollY === 0`.
  2. If it fails, set `history.scrollRestoration = 'manual'` once at init. The modal-stack comment (`:6266`) already says the stack owns history outright and screen-level history is not used. A modal never changes the page's scroll (`body` is `overflow: hidden` while one is open), so manual restoration loses nothing.
  3. Keep the same-screen exemption as it is.
- **Effort:** XS

### Medium

None.

### Low

**CODE-02: The WORK-02 Move hand-off assertion is a hand-built replica and can pass without testing anything**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\harness\accounts.js:695-701`
- **Evidence:**
  - The probe calls `navigate('accounts'); tr.focus();` itself. It does not go through `confirmSpend`, which has the dialog close and the deferred `history.go` that CODE-01 is about.
  - `focus()` scrolls an element into view by itself, so the assertion holds whatever `navigate()` does.
  - If `#acctMoveCard` were hidden (it is hidden with fewer than two accounts, `:10703`), `getBoundingClientRect()` returns all zeros and the `r.top < 0 || r.bottom > innerHeight` check passes without testing anything.
  - `moveReturnFlow` (`:901-949`) does go through the real hand-off but never measures the viewport.
- **Impact:** The ruling's condition ("confirm the `confirmSpend` Move hand-off still brings `#trAmount` into view") is not guarded on the path where it could actually fail.
- **Recommendation:**
  - Move the viewport assertion into `moveReturnFlow`, right after the hand-off and after a wait longer than the deferred traversal.
  - Assert `r.height > 0` first.
- **Effort:** XS

**CODE-03: The day-rollover branch moves the Analytics range without moving its calendar, breaking a property its own design record states**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - `syncCalendarAnchor` comment `:5534-5563`
  - refresher `:5595`
  - `refreshForNewDay` `:13623`
- **Evidence:**
  - The refresher pushed at `:5595` re-applies the preset but does not call `syncCalendarAnchor`.
  - The comment above `syncCalendarAnchor` says "TWO CALL SITES… the property is false if either is missing". It names the symptom: the Peak day tile can name a date the calendar below it is not showing.
  - On a resume on the 1st, the Analytics range moves to the new month while the calendar stays on the old one.
  - The ruling put `calDate` out of scope as "a navigation cursor, not a record date". So this follows the ruling, but it leaves a third writer of the range that the design record does not list.
- **Impact:** On the morning of the 1st, Analytics shows this month's stats over last month's calendar until the user changes the preset. The comment no longer describes every path that changes the range.
- **Recommendation:**
  - Architect's call. Either call `syncCalendarAnchor()` inside the `daily` refresher, which re-anchors the month only when the range itself moved, or record in the `syncCalendarAnchor` comment that a resume deliberately does not re-anchor.
  - Either way, the comment must list the third path.
- **Effort:** XS

**CODE-04: The bell badge is not refreshed when the day changes**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - `refreshForNewDay` `:13614-13625`
  - 30-minute interval `:13597`
- **Evidence:**
  - `refreshForNewDay` re-renders the active screen but does not call `updateBellBadge()`.
  - The badge on resume reflects yesterday's due set until the 30-minute interval next fires.
  - The ruled shape did not ask for this, so it is not a deviation from the ruling.
- **Impact:** Reminders that fall due overnight are not counted on the badge at the moment the user opens the app. Opening the bell recomputes them, so nothing is lost.
- **Recommendation:** Add `updateBellBadge()` to the day-change branch, if the architect agrees it belongs to "today is live". It is one line and writes nothing.
- **Effort:** XS

**CODE-05: Deleting an older goal contribution can move the schedule cursor forward past unpaid occurrences**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:12795-12801`, with `saveEditContribution` `:13286-13296`
- **Evidence:**
  - Every contribution delete recomputes `recLastLogged` from the newest *remaining* contribution, even when the deleted one was not the newest.
  - `saveEditContribution` only advances the cursor one occurrence per contribution. So a late manual top-up dated `-7` against a weekly schedule leaves the cursor at `-35`, with `-28`, `-21` and `-14` still owed.
  - Deleting any older contribution then sets the cursor to `goalOccurrenceAtOrBefore(g, -7)`, which is `-7`. The three overdue occurrences silently leave the bell.
  - The code before WORK-08 had the same jump (it rolled back to the contribution's own date). So this is pre-existing, and the ruled shape kept it rather than adding it.
- **Impact:** After a routine correction, reminders can stop for occurrences that were never paid. This is the same symptom class WORK-08 was opened for ("reminders fire on the wrong day or stop").
- **Recommendation:**
  - For the architect: apply the rollback only when it moves the cursor backward, i.e. `min(current, computed)`. A delete can then never advance the schedule.
  - Add the case to `goals.js`.
- **Effort:** XS

**CODE-06: Two comments touched this sprint state what the code does not**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7069-7090` and `:13600-13601`
- **Evidence:**
  - **WORK-08 inserted `goalOccurrenceAtOrBefore` between `stepDate`'s doc comment and `stepDate` itself.**
    - The comment "The one definition of a recurrence step. Returns the next ISO date… `anchorDay`… Callers pass parseISO(p.date).getDate()" now runs straight into the new function's own two-line comment and sits above `goalOccurrenceAtOrBefore`.
    - `stepDate` (`:7090`) has no comment.
  - **The WORK-03 block says "The four entry dates below".**
    - That is a count no code enforces. `knowledge/coding-standards.md` (Comments): "Never write … a count, unless something enforces it."
- **Impact:** The design record describes the wrong function in the module that most depends on recurrence semantics, and the count drifts silently when an entry date is added to `ENTRY_DATE_IDS`.
- **Recommendation:**
  - Move `goalOccurrenceAtOrBefore` and its comment below `stepDate`, so the `stepDate` comment sits directly above its function.
  - Say "The entry dates in `ENTRY_DATE_IDS`" instead of "four".
- **Effort:** XS

**CODE-07: Settings rename refusals still use a toast alone, while the WORK-06 commit subject says Settings refusals mark the field**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - `saveEditIType` `:7599`, `:7608`
  - `saveEditCat` `:7684`, `:7689`
- **Evidence:**
  - These four refusals still call `toast()` with the field neither marked nor focused.
  - They are not among the UI-06 locations, so WORK-06 covered its ruled scope in full.
  - But the commit subject ("edit-sheet and Settings refusals mark and focus the field") is broader than the change.
  - The inline inputs have no `id`, so `refuseField(id, …)` cannot reach them as written.
- **Impact:** On the same Settings screen, adding a category marks the field, but renaming one to an empty or duplicate name does not. Users notice the inconsistency, but nothing fails.
- **Recommendation:** Carry it as a follow-up item. Either give `refuseField` an element overload, or give the inline inputs ids. Do not widen WORK-06 after the fact.
- **Effort:** XS

**CODE-08: The goal-delete cascade WORK-04 describes is never run under test, and the Goals flow does not cover it as the ruling planned**

- **Severity:** Low
- **Location:**
  - `D:\3_Claude\PowerApps\tools\harness\accounts.js:612-635`
  - `D:\3_Claude\PowerApps\tools\harness\goals.js:62-64`
- **Evidence:**
  - The ruling says WORK-08's Goals flow "is also where WORK-04's delete path gets covered". `goals.js` has a single flow, the cursor flow.
  - The WORK-04 probe in `accounts.js` asserts the sentence correctly: one account, two accounts, none, and a future-dated contribution excluded. But its `confirmDialog` stub always returns `false`, so the delete and the balance it restores never run.
- **Impact:** The sentence says money "goes back into" an account, and no probe checks that the account balance actually rises by that amount after the delete.
- **Recommendation:** Add one confirm-`true` pass to the `accounts.js` flow that asserts `accountBalance(A1)` rises by exactly ₮60,000. Or add it to `goals.js` as the ruling planned.
- **Effort:** XS

**CODE-09: The WORK-03 and WORK-06 probes check a sample of what each ruling protects**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\harness\accounts.js:565-590` and `:639-683`
- **Evidence:**
  - **WORK-03 probe:**
    - It asserts `expDate`, a typed `incDate`, the `dash` preset, a Custom `inc` range, and no store write.
    - It does not assert `debtDate` or `sDate`, that the active screen re-rendered, or that a field inside an open edit sheet is left alone. The ruling lists that last one as binding ("It does not touch any field inside an open sheet").
    - It also sets `lastSeenDay` directly, so the boot assignment at `:13633` is not covered.
  - **WORK-06 probe:** It checks three of the eight UI-06 locations (expense edit, debt edit, `catAdd`).
  - All of these properties hold in the code today (`:13612-13625` reads only the four form ids; every UI-06 site calls `refuseField`).
- **Impact:** These are negative guarantees with no probe. A later edit to `ENTRY_DATE_IDS` or to one of the five unprobed save functions would regress without a red run.
- **Recommendation:**
  - WORK-03: extend the flow to `debtDate` and `sDate`, and open an edit sheet holding the previous day in `#mDate` before dispatching `visibilitychange`.
  - WORK-06: loop the marked-field assertion over the remaining five sites.
- **Effort:** S

---

## Review Areas

- **Correctness of money:** Clean for this sprint.
  - WORK-04 counts only contributions dated on or before today, which matches how balances count.
  - `+c.amount || 0` guards against NaN.
  - The sentence is written with `textContent` (`:6379`).
- **Data and persistence:** Clean.
  - No schema, export or cloud-payload change.
  - WORK-08 writes an existing field with occurrence semantics.
  - WORK-03 is probed as leaving `KEY` unchanged.
  - The edit save path keeps validate-then-assign.
- **Architecture:** Clean. Every item reuses an existing mechanism, and there is one helper per concern (`rebuildSelect`, `goalOccurrenceAtOrBefore`, `refreshForNewDay`).
- **Maintainability:** CODE-06.
- **Error handling:** Clean in scope. Every UI-06 refusal now marks and focuses its field. `wireDateField` clears the mark on a picked date (`:10045-10051`). CODE-07 is outside the ruled scope.
- **Security:** Clean. No new `innerHTML` takes user text without `escapeHTML`, and the WORK-07 helper is static.
- **Performance:** Clean.
  - `goalOccurrenceAtOrBefore` is linear in the number of occurrences, once per delete.
  - `rebuildSelect` is linear in the number of options.
  - Neither runs over the transaction list.
- **Reliability and scalability:** CODE-01 is the open reliability question. Nothing in this sprint scales with the record count.

## Technical Debt

- **History owns two things now** (CODE-01). The modal stack uses `history` for Back, and WORK-02 now depends on the scroll position history does not restore. Until `scrollRestoration` is set explicitly, any new navigation that follows a modal close inherits the problem.
- **The cursor semantics for goal schedules are split across two writers** (CODE-05). `saveEditContribution` advances one step at a time, and the delete recomputes from scratch. They will keep disagreeing until one rule ("a delete never advances") is stated in one place.
- **"Today" surfaces are listed by hand** (CODE-03, CODE-04). `refreshForNewDay` knows the entry dates, the presets and the active screen. The calendar anchor and the bell are not in that list, and future date-dependent surfaces (Notifications on the roadmap) will need to be added to it.

## Future Risks

- **Notifications (Long-term Vision).** It will depend on the goal cursor being right and on the bell being refreshed after a day change. CODE-04 and CODE-05 become user-visible missed notifications rather than a stale badge.
- **Any new screen reached through a sheet** (WORK-09's Salary changes, future Reports) inherits CODE-01 unless restoration is set to manual.
- **WORK-13 (row identity on Edit/Delete) and WORK-09** both re-render the add forms. They must keep going through `rebuildSelect`. A new select built with `innerHTML` directly would bring back WORK-01's defect, and no lint rule enforces this.

## Recommended Refactoring

1. **Settle CODE-01 with one probe, then one line.** Add a More-sheet navigation probe. If it fails, add `history.scrollRestoration = 'manual'` at init, and move the hand-off viewport assertion into `moveReturnFlow` (CODE-02). This removes the only High.
2. **Make the goal-cursor delete one-directional** (CODE-05), and add the confirm-`true` goal-delete balance check (CODE-08). Both belong in `goals.js`, which the ruling meant to be the Goals module's probe.
3. **Repair the two comments** (CODE-06) in one comment-only commit, per `coding-standards.md`.
4. **Put CODE-03 and CODE-04 to the architect as one question:** which "today" surfaces belong to the day-change branch. Implement the answer as additions to `refreshForNewDay` only. No timers, as WORK-03 ruled.

CODE-07 and CODE-09 are probe coverage and consistency follow-ups. Neither needs any change to the application's structure.
