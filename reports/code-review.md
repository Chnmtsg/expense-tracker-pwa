# Code Review: expense-pwa (v27, whole application)

Scope: all of `expense-pwa/` (`index.html` at 13,559 lines, `sw.js`, `manifest.json`), measured against `knowledge/coding-standards.md`, `knowledge/project.md` and `knowledge/review-conventions.md`. I read the data layer first (schema, `load`, `migrate`, `writeDb`, import validation). Then I traced one write path (Add Expense → `confirmSpend` → Move money → back to the unsaved expense) and one read path (`renderDashboard` → `expandPlannedInRange` → `drawPvA`/`drawMonthlyTrend`). Then I went through every review area.

I did not reopen anything ruled in `reports/chief-architect*.md` or `reports/HANDOFF.md`. WORK-17, WORK-18b, WORK-24 and WORK-31 stay deferred on their own triggers. CODE-05 reports that WORK-19's trigger has fired; it does not reopen the ruling. I could not run `npm test` (read-only tools), so no claim here rests on a probe result I did not see.

---

## Executive Summary

The persistence core is in good shape:
- Money is stored as integer tugrik with one rounding boundary.
- Every write goes through one guarded `writeDb`.
- The schema is versioned with append-only migrations.
- Unreadable data is quarantined, and imports are validated record by record.
- The cross-window guard from Round 18 is in place.

The defects found in this round are at the edges, where UI state and stored records meet, not in the store itself.

**The biggest risk is CODE-01.** The Add Expense form loses its category and "Paid from" choices whenever the Expenses screen re-renders. That includes the "Move money, then come back to your unsaved expense" flow that the Envelopes ruling built, which tells the user their form "still holds what they typed". A user who follows that flow can record the expense against the wrong category and with "No account". The account balance the move just topped up then never pays for the purchase.

Three Medium defects can also put wrong data into the record:
- Stale dates after the app stays open overnight (CODE-02).
- Converting a recurring plan to an actual expense silently rewrites months of planned history (CODE-03).
- Deleting a goal contribution shifts the goal's schedule (CODE-04).

One structural item: WORK-19's own trigger, "any new write path", has fired several times over and has not been acted on (CODE-05).

## Overall Score

**76 / 100.** One contained High (CODE-01, XS–S to fix) and four Mediums keep this in the "Solid" band, below 90. No finding reaches Critical. Stored data is never corrupted or lost by the store itself; the wrong records described here come from form and edit paths, and each one is visible to an attentive user.

---

## Findings

### Critical

None.

### High

**CODE-01 — The Add Expense form forgets its category and account on every render, including on the return from the limit dialog's Move**

- **Severity:** High
- **Location:**
  - `expense-pwa/index.html:7390`: `renderExpenses` does `expCategory.innerHTML = categoryOptions()`.
  - `:7391` and `:10560-10565`: `fillAccountSelect` rebuilds `#expAccount` from `lastUsedAccountId(db.actual)`.
  - `:6953-6957` and `:6969`: `setExpMode` says "Amount, notes and category are kept", then calls `renderExpenses()`.
  - `:10527-10528` and `:10536-10538`: `confirmSpend` says "The expense form keeps what was typed".
  - `:10728-10733`: `trAdd` calls `navigate('expenses')` and toasts "now tap Add Expense to save it".
  - Same pattern on Income: `:6872-6873`.
  - Contrast `renderDebts` `:11091-11093`, which keeps the user's choice across a render.
- **Evidence:**
  - Replacing a `<select>`'s options through `innerHTML` with no `selected` attribute selects the first option. So:
    - Every `renderExpenses()` resets the category to the first category (by default "Rent").
    - Every render resets "Paid from" to the account on the last recorded actual expense, or to "No account" when none exists.
  - `renderExpenses()` runs on:
    - the Actual/Planned toggle (`setExpMode`);
    - every navigation to the screen;
    - every add and delete;
    - every cross-window refresh.
  - The Move flow sets account A, moves money into A, and navigates back. The category is now the first category, and "Paid from" is whatever `lastUsedAccountId` returns. In `tools/harness/accounts.js` `moveReturnFlow` (`:761-793`), `db.actual` is empty, so it returns "No account".
  - The probe asserts only that `#expAmount` survived (`:783`). `limitFlows` sets `expAccount` again before each spend (`:694`), which hides the reset.
- **Impact:**
  - An expense can be saved under the wrong category, which skews Planned vs Actual, the donut and the advisor.
  - It can also be saved against the wrong account or none, so the account balances become wrong. In the Move case the money just moved into A stays unspent, and the purchase is never charged to A.
  - This happens in the app's most frequent flow (switching mode with a typed amount) and in a ruled envelope flow whose own toast promises the form is intact.
  - Two comments state a property the code does not have.
- **Recommendation:** Keep the current value across the rebuild, the way `renderDebts` does:
  - Read `expCategory.value` and `expAccount.value` before rebuilding.
  - Re-select them if they still exist.
  - Fall back to the current defaults otherwise.
  - Apply the same treatment to `incType` and `incAccount` in `renderIncome`.

  In `moveReturnFlow`, assert that category and account survive the round trip, with a non-first category and an empty `db.actual`.
- **Effort:** S

### Medium

**CODE-02 — A session that stays open past midnight or month-end keeps yesterday's dates and last month's "This Month"**

- **Severity:** Medium
- **Location:**
  - `expense-pwa/index.html:13529-13532`: the entry-date defaults are set once, at boot.
  - `:5579-5590`: `initPeriodFilter` computes the preset range once, at boot.
  - `:8974`: `calDate` is initialised once.
  - `:4674-4676`: the only `visibilitychange` listener flushes saves and does nothing else. There is no `pageshow` or `focus` handling anywhere.
- **Evidence:**
  - `#incDate` and `#expDate` are filled with `todayISO()` at init and are not reset after an add (`incAdd` `:6856-6858`, `expAdd` `:7372-7377`).
  - The "This Month" preset writes concrete `from`/`to` strings into the inputs at init, and nothing recomputes them later.
  - An installed PWA on Android is routinely resumed from the background rather than reloaded.
- **Impact:**
  - The next morning, a new entry defaults to yesterday's date.
  - On the 1st of a month, Home shows last month under the label "This Month" until the user changes the preset.
  - Income and Expense lists filter on that stale range.
  - These are wrong dates on money records, made by default, in normal use on the primary platform.
- **Recommendation:** On `visibilitychange` to visible, if `todayISO()` differs from the day last seen:
  - re-apply each non-custom preset through the existing `applyPreset` path;
  - reset any entry-date field the user has not edited;
  - re-render the active screen through `navigate`.

  Add a harness case that advances the clock across a month boundary.
- **Effort:** S

**CODE-03 — Switching a recurring plan to "Actual" in the edit sheet deletes the whole series' planned history without the warning the delete gives**

- **Severity:** Medium
- **Location:**
  - `expense-pwa/index.html:12792-12796`: the Actual/Planned toggle, with the date field pre-filled from the plan's anchor.
  - `:13361-13372`: `saveEditEntry` clears the recurrence and splices the record from `db.planned` to `db.actual`.
  - Contrast `:7485-7490`: the delete path warns "Every occurrence of it disappears, including the ones already in the past."
- **Evidence:**
  - For a monthly plan anchored months ago, the edit sheet opens dated on the anchor ("Since" date).
  - Tapping Actual and Save removes the plan, so every past period's Planned total drops by that amount.
  - It also writes one actual expense dated on the anchor, possibly months back.
  - With no account selected, which is the default for a plan, no limit check runs.
  - The delete path, which destroys the same history, asks first.
- **Impact:**
  - Planned vs Actual and the Planned totals for past periods change silently.
  - A probably fictitious actual expense lands in an old month.
  - The correct act already exists: "Log" from the bell or the log sheet keeps the plan and writes the actual for the due occurrence.
- **Recommendation:** The smallest safe options are:
  - disable the Actual segment while the record being edited is a recurring plan, pointing to Log instead; or
  - put the delete path's confirmation sentence in front of the switch.

  Either option needs a one-line product ruling. A one-off plan can keep today's behaviour.
- **Effort:** XS (once ruled)

**CODE-04 — Deleting a goal contribution resets the schedule cursor to a contribution's date, which shifts or silences the schedule**

- **Severity:** Medium
- **Location:**
  - `expense-pwa/index.html:12726-12734`: `g.recLastLogged = remaining[0]?.date || null`.
  - Against `:13211-13222` and `:6170`, which write the occurrence date (`nextDue` / `nextDate`).
  - Read by `computeNextRecurring` `:5727-5734`.
- **Evidence:**
  - Every writer of `recLastLogged` stores an occurrence date, except this rollback. It stores the date of the newest remaining contribution, which can be a manual "+ Add ₮" on any day.
  - `computeNextRecurring` steps forward from the cursor by the schedule's frequency. Only the monthly step re-anchors to `startDate`'s day.
  - So:
    - A weekly schedule on Mondays moves to Wednesdays permanently after deleting an older contribution, if the newest one left is a Wednesday top-up.
    - A future-dated contribution left in place pushes the cursor into the future, and reminders stop until that date.
  - This is the same class `logPlannedAsActual`'s comment calls ARCH-1 ("writing the payment date there would step a monthly series off its anchor").
  - Savings Goals still has no probe of its own (HANDOFF, item 8 of the above-the-list ruling). The `accounts.js` contribution flow checks that the cursor advances, not this rollback.
- **Impact:** Contribution reminders fire on the wrong day, or not at all, after an ordinary correction. Nothing on screen says the schedule moved.
- **Recommendation:** Roll back to an occurrence date, not a contribution date. Two ways:
  - set the cursor to the latest schedule occurrence at or before the newest remaining contribution, by walking `stepDate` from `recStartDate`; or
  - set it to null, and let the existing forward-looking walk recompute it.

  Land this with the first Goals probe, covering a weekly schedule, a manual top-up, then a delete.
- **Effort:** S

**CODE-05 — WORK-19's trigger ("any new write path") has fired repeatedly, and concurrency safety is now a per-handler convention**

- **Severity:** Medium
- **Location:**
  - `reports/chief-architect.md:84`: the WORK-19 trigger.
  - New write paths since that ruling:
    - `acctAdd` `:10689`;
    - `trAdd` `:10706`;
    - transfer delete `:10666-10686`;
    - account delete `:10614-10637`;
    - income split `:6843-6855`;
    - `saveEditAccount` `:13403`;
    - the account fields in five edit handlers.
  - The guard that has to be remembered, `dbReplacedSince` (`:10487-10491`), is called by hand at `:13069`, `:13154`, `:13178`, `:13209`, `:13279` and `:13317`.
- **Evidence:**
  - Accounts Phase 1, Envelopes and Phase 2 rest each added write paths.
  - No ruling in `chief-architect-accounts.md`, `chief-architect-envelopes.md` or `chief-architect-phase2-rest.md` mentions WORK-19 (searched). The trigger fired and was neither taken up nor re-deferred.
  - The cost has already shown up once: the Phase 2 review's High (detached records after an awaited dialog) was this class, fixed handler by handler.
  - Handlers that mutate `db` from UI code are still the only mutation mechanism (`expAdd` `:7371`, `incAdd` `:6851`, and others).
- **Impact:** Every future account-touching flow with an `await` has to remember the snapshot check, or it reintroduces a false "Updated". Accounts made the write surface much larger, which is the scenario the deferral was written for.
- **Recommendation:** Put WORK-19 to the Chief Architect as fired, under its own ruled shape:
  - Step 1 wraps the guarded `writeDb` and does not replace it.
  - Go one screen at a time, in the same file. Start with Accounts, the newest and most await-heavy module.
  - No rewrite.
- **Effort:** L (staged; step 1 is S–M)

### Low

**CODE-06 — Income, expense and account edits report "Updated" when another window deleted the record while the sheet was open**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:13246`, `:13261-13294`: income branch.
  - `:13299`, `:13319-13377`: expense branch.
  - `:13408-13417`: `saveEditAccount`.
  - `:12893-12894`: `saveEditGoal` returns with no word.
- **Evidence:**
  - The `storage` listener (`:4693-4699`) replaces `db` while a sheet is open.
  - If the other window deleted this record, `find` returns `undefined`, every assignment is skipped, and `save()` succeeds on the fresh copy, so `savedToast` says "Updated" / "Account updated".
  - The await-time fix (`dbReplacedSince`) does not cover this non-await path.
  - The sibling handlers close silently instead (`saveEditDebtPayment` `:13126`, `saveEditContribution` `:13199`).
- **Impact:** A correction is lost while the user is told it was saved. This needs two windows and a delete of the same record.
- **Recommendation:** When the record is not found, close with one sentence: "This entry was deleted in another window. Nothing was saved." Use it in all edit handlers.
- **Effort:** XS

**CODE-07 — Add forms clear what was typed even when the write was refused**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:6856-6858` (`incAdd`).
  - `:7372-7377` (`expAdd`).
  - The same shape in `acctAdd` `:10698-10701`, `trAdd` `:10721-10723`, `debtAdd` `:12370-12377` and `goalAdd` `:12484-12489`.
  - The refusal message: `STALE_WRITE_MSG` `:4592`.
- **Evidence:**
  - On a stale-write refusal, `writeDb` reloads `db`, so the new entry is gone, and shows "please make your change again" (`:4616-4620`).
  - The handler then empties the fields anyway.
- **Impact:** The user is asked to re-enter something the app has just erased from the form. The trigger is a narrow cross-window race.
- **Recommendation:** Clear the inputs only when `ok`. On a quota failure the entry stays in memory and in the list, so keeping the form populated is harmless there too.
- **Effort:** XS

**CODE-08 — An edit can write an empty `typeId`/`categoryId`, which makes the app's own backup unrestorable**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:12779` and `:13285`: income type.
  - `:12786-12788` and `:13325`: category.
  - No last-one guard on delete: `:7638-7648` (income types), `:8013-8032` (categories).
  - Refused on import: `entryProblem` `:4840`.
- **Evidence:**
  - Deleting every income type (or category) in a session leaves the edit sheet's select with no options, so `.value` is `''`, which is saved.
  - `load()` restores default types on the next boot (`:4166-4167`), but the record keeps `''`.
  - Export then produces a file that `importProblem` rejects ("has no typeId").
  - The add forms refuse this case (`:6838`, `:7355`); the edit sheet does not.
- **Impact:** The precondition is rare. The cost is that the one recovery path, Restore, fails at the moment it is needed.
- **Recommendation:** Refuse Save in the edit sheet when the select is empty, with the add form's own message.
- **Effort:** XS

**CODE-09 — `load()` silently drops any top-level collection it does not know, and the "newer build" guard cannot prevent it**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:4162-4224`: `d` is built from a fixed list of keys.
  - `:3831`: `if (v > SCHEMA_VERSION) return d; // written by a newer build — leave it alone`.
- **Evidence:**
  - `d` is assembled key by key from `parsed`, so a collection added by a later build is not in `d`. `migrate` then "leaves alone" an object that has already lost it.
  - The next `save()` writes the stripped object, still stamped with the newer version.
  - The cross-window guard does not help: a stale tab's `refreshFromStorage` runs its own older `load()` and adopts the new raw string as `lastSeenRaw` (`:4149`), so its next save passes the check.
  - HANDOFF records this hazard for Accounts ("a stale v24 page would save over `accounts`/`transfers`"). It was mitigated by cache-key discipline only, and a key bump does not close an already-open old tab.
- **Impact:** Nothing today; no new collection is pending. The next new collection could be erased by any still-open older tab, and the comment at `:3831` claims a protection that does not exist.
- **Recommendation:** Spread `parsed` first in `load()`, so unknown keys carry through, then apply the known-key defaults over it. Correct the `:3831` comment. This is backward compatible.
- **Effort:** XS

**CODE-10 — Import and cloud load accept any `settings.notifications`, and a string `daysAhead` breaks the reminder window**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:5138-5141`: only "settings is an object" is checked.
  - `:5741-5745`: `notif.daysAhead || 7` is added with `+` to `getDate()`.
  - `:7906-7907`: strict `===` comparison in the Settings select.
- **Evidence:**
  - A hand-edited or third-party `"daysAhead": "14"` makes `getDate() + "14"` a string concatenation ("1014" on the 10th). `setDate` then lands about 2.7 years ahead, so every planned, goal and debt reminder within that span shows.
  - The Settings select then matches no option and shows "1 day".
  - A non-numeric value gives an Invalid Date cutoff.
  - The validator's own stated rule ("a value that is not … means the file did not come from this app") is applied to `quickAmounts` but not here.
- **Impact:** A bell full of far-future reminders, and a Settings control that shows a value it is not applying. Reachable only through a hand-edited file.
- **Recommendation:** Two options:
  - in `importProblem`, refuse a present `notifications` that is not an object, or whose `daysAhead`/flags have the wrong type; or
  - coerce `daysAhead` with `Number()` at the one read site.
- **Effort:** XS

**CODE-11 — Lowering an account's starting amount can push it below zero with no warning**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:13403-13418` (`saveEditAccount`), against the shared rule `accountShortfalls` `:10438-10443`.
- **Evidence:**
  - Every other change that removes money from an account is refused or warned through `accountShortfalls`: income edits, debt edits, deletes and moves (R1).
  - The starting-amount edit writes `a.opening` directly.
- **Impact:** An account can go negative because of a correction, with no sentence explaining why. This is one door left open in an otherwise uniform rule.
- **Recommendation:** Run `accountShortfalls({[a.id]: newOpening - a.opening})`. If it reports a shortfall, use the existing warn-then-allow `choiceDialog`, and the `dbReplacedSince` check after it. Needs a one-line ruling on whether this case should warn.
- **Effort:** XS

**CODE-12 — The Reset confirmation lists what it deletes but leaves out accounts and money moves; "settings" survive in side keys**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:8147`: dialog text.
  - `:8151-8156`: what Reset removes.
  - Side keys that survive: `DISPLAY_CURRENCY_KEY` `:9616`, `FILTER_STATE_KEY` `:5481`, `conv-last-from`/`-to` `:9523`, `:9530`.
- **Evidence:**
  - The list was written for WORK-07, before Accounts existed. It names income, expenses, plans, goals, debts, salary, categories, income types and settings.
  - `removeItem(KEY)` also erases accounts and transfers.
  - It does not erase the display currency, so after a reset that promised to delete settings, the ≈ reading still shows.
- **Impact:** The same class of understatement WORK-07 fixed, back because a module was added later. Minor, because "every record in this app" leads the sentence.
- **Recommendation:** Add "accounts and money moves" to the sentence. Either remove the UI-preference keys in the same handler, or stop saying "settings".
- **Effort:** XS

**CODE-13 — The Income and Expenses lists are unbounded, rebuild with two listeners per row after every write, and are not measured at 10,000 records**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:6893-6911` (`renderIncome`).
  - `:7416-7495` (`renderExpenses`).
  - `tools/harness/perf.js` measures the Dashboard, Analytics and Debts only (`:121-226`).
- **Evidence:**
  - With "All Time" selected, every add, delete and edit rebuilds the full list as one `innerHTML` string.
  - It then attaches two listeners per row: about 20,000 at 10,000 records.
  - In Planned mode, each recurring row also walks its schedule (`upcomingPlannedDates` → `nextPlannedDue`).
  - The WORK-17 measurements in HANDOFF cover other screens.
- **Impact:** Unknown, and that is the gap. This is the one heavy surface that sits on the commonest write path and has no figure.
- **Recommendation:**
  - Add the two lists to `perf.js` at 10,000 records.
  - If the figure crosses the WORK-17 threshold, replace per-row listeners with one delegated listener per list. The `data-show-all` handler at `:13481` already uses that pattern.
  - A row cap is off limits by standing ruling and is not proposed.
- **Effort:** S (measure); S (delegation, if needed)

**CODE-14 — Two comments carry counts that are now false, against the Comments standard**

- **Severity:** Low
- **Location:**
  - `expense-pwa/index.html:6247`: "FOUR SITES ONLY — the two history modals and the two reminder actions". There are five call sites: `:6134`, `:6173`, `:11897`, `:12742`, `:12872` (`returnToBell`, UI-05).
  - `:8573`: "called from thirteen places that are not the Dashboard". There are fourteen: `:5997`, `:6826`, `:6861`, `:6930`, `:7384`, `:7493`, `:7669`, `:7871`, `:8030`, `:8160`, `:9670`, `:9944`, `:13294`, `:13374`.
- **Evidence:** `coding-standards.md`: "Never write 'the only', 'all', or a count, unless something enforces it." Neither count is enforced, and both went stale.
- **Impact:** These comments are the design record, and they mislead the next reader of the focus and render rules.
- **Recommendation:** State the rule without the tally, for example "after a modal redraws its own body", and drop the number.
- **Effort:** XS

---

### Review areas

- **Correctness of money:** Clean, apart from dates.
  - One unit (`unmoney` `:5375`, `formatMoneyInput` `:5389`).
  - One display rounding (`fmt` `:5277`).
  - Salary rounds its whole result in one place (`:6731-6736`).
  - `moneyValue` guards fractional imports.
  - Every division I traced has a guard for a zero or negative denominator.
  - Dates are built only from local components. Day differences use `Math.round(…/86400000)`, so DST does not shift them.
  - One defect: CODE-02, day rollover in long-lived sessions.
- **Data and persistence:** CODE-04, CODE-08, CODE-09, CODE-10.
  - One store, written as a single blob.
  - `writeDb` is the only guarded write path. Reset's `removeItem` is the one deliberate exception.
  - Versioned, append-only migrations.
  - `load()` is total, with quarantine.
  - Import is validated per record and rejected whole.
  - The stale-write guard is in place.
  - Offline-first holds: stale-while-revalidate with `waitUntil` on the put (`sw.js:86-94`); rates are optional and cached; Firebase is inert while `firebaseConfig` is empty.
- **Architecture:** CODE-05.
  - Responsibilities are named and grouped.
  - The UI mutates `db` directly by design until WORK-19.
  - Shared helpers are reused: `accountShortfalls`, `spendShortfall`, `stepDate`, `initReorder`, `downloadJSON`.
- **Maintainability:** CODE-14.
  - `renderDebts` is still about 570 lines; WORK-18b is deferred and its trigger has not fired.
  - The reorder duplication is gone (WORK-30).
  - I found no dead code beyond the documented no-op `renderDashboard()` calls, which are explained in place.
- **Error handling:** CODE-06, CODE-07.
  - Every write reports through `savedToast`.
  - Corrupt-data, save-failure and fatal banners are wired before `load()`.
  - The import read failure has `onerror`.
  - `serviceWorker.register(...).catch(() => {})` is silent. Acceptable: offline caching is a progressive enhancement, and the app still works.
- **Security:** Clean.
  - `escapeHTML` is applied to every stored string I traced into `innerHTML`.
  - Dialogs use `textContent`.
  - The CSP allows `'unsafe-inline'` (WORK-31, deferred).
  - The Firebase SDK is unpinned and has no integrity check (WORK-24, deferred with a hard gate; inert today).
  - Nothing sensitive is logged.
  - The one third-party call is `open.er-api.com`, made only when the converter is opened.
- **Performance:** CODE-13.
  - Nothing quadratic over transactions on the write path.
  - `accountBalance` is O(N) per account.
  - Analytics and the All Time trend are measured, and WORK-17 stays deferred under its threshold.
- **Reliability and scalability:** CODE-02 and CODE-13.
  - At 10,000 records the measured screens are within budget.
  - The unmeasured lists are what I would expect to break first.
- **Technical debt:** Below.

---

## Technical Debt

- **Mutations live in UI handlers (CODE-05).**
  - About forty handlers each mutate `db`, call `save()`, re-render and toast.
  - Each one with an `await` must remember `dbReplacedSince`.
  - WORK-19 is the ruled remedy, and its trigger has fired.
- **One shared `#editModal`, driven by a global `editCtx`.**
  - It now serves ten kinds of record.
  - The dispatch table (WORK-18a) made it readable. The coupling remains: any new sheet must reset buttons, set `editCtx` and register a handler, and it inherits the "record vanished" path (CODE-06).
- **Form state is rebuilt, not kept (CODE-01).**
  - Render functions own the add-form selects.
  - Each render that rebuilds options has to remember to keep the user's choice; Debts does, Income and Expenses do not.
  - A small `rebuildSelect(el, optionsHTML)` helper that preserves the current value would remove the class.
- **Two cursor conventions for one idea (CODE-04).**
  - `recLastDone` (plans) and `recLastLogged` (goals) both mean "the last occurrence logged".
  - They are written by different code with different rules.
  - The goal side has no probe.
- **Forward compatibility rests on cache-key discipline (CODE-09).**
  - `load()`'s fixed key list makes every new collection a hazard for any still-open older tab.
- **Comment tallies (CODE-14).**
  - The file's heavy design-record comments are valuable.
  - Counts inside them go stale with each feature. The ARCH-01 pass HANDOFF names stays unscheduled.

## Future Risks

- **Cloud Sync.**
  - The whole-blob, last-write-wins upload (`syncToCloud` `:4515-4518`) and Firestore's 1 MiB per-document limit are still unruled (Round 18 Architecture Strategy).
  - Accounts and transfers make the blob grow faster.
  - Turning sync on also needs WORK-24, and benefits from WORK-19.
- **Notifications and Reports (roadmap).**
  - Both are WORK-19 triggers by name.
  - Notifications will add more background writes like `maybeFireOSNotifications`' `save()` of `lastNotifiedAt` (`:6203-6204`).
  - A timer-driven write that loses the cross-window race shows the user "Your last change was not saved", for a change they never made.
- **Growth of the transaction list.**
  - CODE-13 is the unmeasured surface.
  - `writeDb` reads and writes the whole blob on every save (`:4616-4623`); this will be the next cost to watch past a few MB.
- **More account-touching flows** (scheduled repayments, payday automation). Each one adds an `await` over a sheet and another place for CODE-01's form-state class and CODE-05's re-check convention to be missed.
- **A new top-level collection** (Reports' saved views, an edit trail) is erased by any older open tab until CODE-09 is fixed.

## Recommended Refactoring

The smallest set of changes that removes the most risk:

1. **Preserve select values across re-renders (CODE-01).**
   - One helper that rebuilds a `<select>`'s options and re-selects the prior value when it still exists.
   - Use it for `expCategory`, `expAccount`, `incType` and `incAccount`.
   - Extend `moveReturnFlow` to assert category and account.
2. **A day-rollover refresh on resume (CODE-02).** One `visibilitychange` branch that re-applies non-custom presets and resets entry dates the user has not edited, through `navigate`.
3. **Fix the goal cursor rollback, with the first Goals probe (CODE-04).**
   - Recompute the cursor as an occurrence date, or set it to null.
   - Add a goals harness flow to `npm test`.
4. **Bring WORK-19 back for a ruling as fired (CODE-05).** Step 1 wraps `writeDb`, starting with Accounts. This retires the hand-placed `dbReplacedSince` calls and CODE-06's per-handler "record vanished" checks together.
5. **Carry unknown top-level keys through `load()` (CODE-09).** A one-line spread that turns a silent forward-compatibility hazard into a non-event.
6. **The XS batch:**
   - CODE-03 (once ruled);
   - CODE-06;
   - CODE-07;
   - CODE-08;
   - CODE-10;
   - CODE-11 (once ruled);
   - CODE-12;
   - CODE-14.

   None changes the schema, the export format or the cloud payload.

No rewrite, framework, store library or new dependency is proposed or needed.

---

Files referenced:
- D:\3_Claude\PowerApps\expense-pwa\index.html
- D:\3_Claude\PowerApps\expense-pwa\sw.js
- D:\3_Claude\PowerApps\expense-pwa\manifest.json
- D:\3_Claude\PowerApps\tools\harness\accounts.js
- D:\3_Claude\PowerApps\tools\harness\perf.js
- D:\3_Claude\PowerApps\package.json
- D:\3_Claude\PowerApps\reports\chief-architect.md
- D:\3_Claude\PowerApps\reports\HANDOFF.md
- D:\3_Claude\PowerApps\reports\code-review-phase2-rest.md
- D:\3_Claude\PowerApps\reports\review-phase2-rest.md
- D:\3_Claude\PowerApps\knowledge\coding-standards.md
- D:\3_Claude\PowerApps\knowledge\project.md
- D:\3_Claude\PowerApps\knowledge\review-conventions.md
