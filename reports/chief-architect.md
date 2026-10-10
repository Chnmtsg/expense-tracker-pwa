# Chief Architect: Final Engineering Decision (Whole Application, v27)

**Inputs.** I read all three reports in full. None of them had been modified.
- `D:\3_Claude\PowerApps\reports\ui-review.md`: UI-01 to UI-11, score 73
- `D:\3_Claude\PowerApps\reports\code-review.md`: CODE-01 to CODE-14, score 76
- `D:\3_Claude\PowerApps\reports\engineering-manager.md`: WORK-01 to WORK-23, conflicts C-1 to C-3

I measured them against `knowledge/review-conventions.md` and `knowledge/project.md`. I also checked them against the standing rulings: Round 18 (`reports/chief-architect.md`), `chief-architect-accounts.md`, `chief-architect-envelopes.md`, `chief-architect-phase2-rest.md` and `HANDOFF.md`.

**Checked at source before ruling** (`D:\3_Claude\PowerApps\expense-pwa\index.html`):
- **CODE-01 is true.** `:7390` rebuilds the options with `document.getElementById('expCategory').innerHTML = categoryOptions();`. `categoryOptions()` (`:7341-7343`) emits no `selected` attribute.
- **UI-02 / CODE-02 are true.** The only `visibilitychange` listener is at `:4674`.
- **UI-03 is true.** Goal delete runs `db.goalContributions = db.goalContributions.filter(c => c.goalId !== g.id)` (`:10290`). The advisor line at `:8453` still says "Delete it or start a fresh goal to keep momentum."
- **UI-05 has one property that changes the shape of the fix.** The `sSave` handler (`:6747-6828`) pushes the salary record and the income in **one** `save()`, and its comment says "the two writes on this handler cannot disagree". So any fix that splits them into two user actions is ruled out (see WORK-09).

---

## Executive Decision (Executive Report)

**Yes. v27 is fit for release and stays live.** Neither reviewer found a Critical, and the Round 18 release gate (cross-window overwrite) is closed and probed by `crosswindow` in `npm test`.

The four Highs (WORK-01 to WORK-04) are real and sit in the most frequent flows. Three of them write a wrong record without saying so: wrong category or account, yesterday's date, and spent money reappearing in an envelope. Correctness of financial data outranks everything else, so these four are the whole of the next deploy's purpose. But each wrong value is visible on the row and can be corrected, and pulling a cached offline-first app back would gain nothing.

All four are XS or S. None changes the stored schema, the export format or the cloud payload. They ship as Sprint 1, one commit each, in one deploy at v28. Structurally the base is sound. The one structural item, the fired WORK-19 trigger, is approved as step 1 only. It is a wrapper over the existing `writeDb`, not a rewrite.

---

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Add forms keep category/type and account across re-renders | **High.** It writes wrong records in the most frequent flow, and it breaks a promise the Envelopes ruling put in the UI ("the form keeps what was typed"). **Ruled shape:** one small helper that rebuilds a `<select>`'s options and re-selects the previous value if it still exists, falling back to today's default otherwise. Use it for `expCategory`, `expAccount`, `incType` and `incAccount`. `renderDebts` is **not** touched, because it already behaves correctly and its split is deferred (WORK-18b). Fix the two comments that state a property the code does not have (`setExpMode`, `confirmSpend`). `moveReturnFlow` must assert that category and account survive the round trip, with a **non-first** category and an **empty** `db.actual`, and it must be shown failing on current `main`. |
| WORK-02 | Reset scroll when switching screens | **High.** The headline figure must be visible on arrival. One `window.scrollTo(0, 0)` in `navigate()`, **only when the destination differs from the active screen.** That exemption is binding, because WORK-03 depends on it. Confirm the `confirmSpend` Move hand-off still brings `#trAmount` into view. |
| WORK-03 | Day rollover on resume | **Severity of record: High (C-1).** It dates money records wrongly by default on the primary platform. **Ruled shape:** one branch inside the existing `visibilitychange` listener, on becoming visible, run only when `todayISO()` differs from the day last seen. That branch: (a) re-applies every non-custom preset through `applyPreset`; (b) moves each boot-prefilled entry date field (`incDate`, `expDate`, `debtDate`, `sDate`) to today **only if it still holds the previous day**, so a typed date is never changed; (c) re-renders the active screen with `navigate(current)`. **It does not touch any field inside an open sheet, and it does not call `save()`.** `calDate` is a navigation cursor, not a record date, and is out of scope. Add a harness case that crosses a month boundary. Must land after WORK-01. |
| WORK-04 | Goal-delete confirm names the money returning to accounts; advisor stops recommending the delete | **High.** Money that was already spent silently reappears in an envelope, and the limit then allows it to be spent twice. These are the two corrections UI-03 asked for and nothing more: one sentence in the confirm (only when a contribution names an account), naming the amount and the account, in the style of the income and debt deletes; and the advisor line reworded to "Start a fresh goal to keep momentum." The cascade itself is unchanged (see Deferred). |
| WORK-05 | Advisor savings rules count Savings Goals | **Medium.** The top line on Home tells people who follow the app's own advice that they are failing. Two changes, both in `analyzeExpenses`, with one purpose (the advisor reading how the user actually saves): count goal contributions dated in the period toward Savings, and treat spending in the default Emergency Fund category as having an emergency fund. Every other rule is left alone. The Round 13 rule that keeps debt out of `analyzeExpenses` is untouched. Lands after WORK-04, as a separate commit. |
| WORK-06 | Edit-sheet and Settings refusals use `refuseField` | **Medium.** Save appears to do nothing on the longest sheets. It reuses the existing helper, so no new component is needed. The fix covers every location in UI-06. |
| WORK-07 | Recurring plan → "Actual" in the edit sheet | **Medium.** It silently rewrites months of Planned history. **Product ruling: disable the Actual segment while the record is a recurring plan**, with a one-line helper pointing to Log. A confirm would still let the user perform an act that has no legitimate use, because Log already records a payment and keeps the plan. Disabling removes the risk; confirming only narrates it. A one-off plan keeps today's behaviour. |
| WORK-08 | Goal schedule cursor rollback | **Medium.** After an ordinary correction, reminders fire on the wrong day or stop. **Ruled shape:** set `recLastLogged` to the latest schedule occurrence at or before the newest remaining contribution, found by walking `stepDate` from `recStartDate`. Set it to `null` only when no contributions remain, which is today's behaviour. The other option, null plus a forward walk, is **not** approved, because it can resurrect every past occurrence as overdue. Land it with the first Goals harness flow inside `npm test`: weekly schedule, manual top-up on another weekday, then delete. |
| WORK-09 | Salary save records an account and splits (C8 reopened) | **Medium.** C8 was a Phase 1 scoping note, written before Envelopes made splitting on arrival the central act. Re-splitting after an edit is off limits by standing ruling, so a salary saved without an account bypasses the envelopes permanently. **Ruled shape:** extract the existing "write an income with its account and split moves" step of `incAdd` into one function, and have both `incAdd` and `sSave` call it. There must be one implementation of the split, not two. The Salary screen gets "Into account", plus the split rows when shares exist, built with WORK-01's helper. The salary record and its income stay in **one** `save()`. A user with no accounts sees the Salary screen and its write exactly as before, and a probe asserts this. A second probe shows that a Salary save and an Add Income of the same net amount produce identical moves. Update the C8 note at `accounts` in `load()`. A hand-off to the Income form is rejected because it breaks the one-save property recorded at `:6805-6808`. |
| WORK-10 (step 1 only) | Write wrapper over `writeDb`, Accounts screen first | **The trigger has fired. Leaving it unruled again is not acceptable.** The Phase 2 High was this class, and safety now depends on six hand-placed `dbReplacedSince` calls. **Ruled shape:** one function that **calls** the guarded `writeDb` and never replaces it. It takes the snapshot before any `await`, re-checks after, re-finds the record by id at write time, and on a vanished record closes with WORK-16's sentence. It is applied to the Accounts handlers only (`acctAdd`, `trAdd`, transfer delete, account delete, `saveEditAccount`) as a refactor with no behaviour change. **From the commit that lands it, every new write path uses the wrapper, and no new hand-placed `dbReplacedSince` is written.** That rule is the real value of step 1. No class hierarchy, no store library, no second write path. Later stages are deferred (see Deferred). |
| WORK-11 | Reset confirmation and side keys (C-2) | **Low**, and the same honesty class WORK-07 (Round 18) fixed. Add "accounts and money moves" to the sentence, **and** remove the named side keys (`DISPLAY_CURRENCY_KEY`, `FILTER_STATE_KEY`, `conv-last-from`, `conv-last-to`) in the same handler, by name. No prefix sweep of localStorage. One handler, one purpose (Reset does what it says), so this is one item. |
| WORK-12 | Money-move refusal says "only ₮0" for a negative account | **Low.** The refusal contradicts a figure on the same card. Use `leftPhrase`. |
| WORK-13 | Row Edit/Delete buttons carry the row's identity | **Low.** A screen-reader user cannot tell which record a Delete removes. Follow the Accounts pattern already in the file. Land after WORK-01, because they share render functions. |
| WORK-14 | Notifications helper wording | **Low. Product ruling: fix the wording, not the threshold.** Changing the threshold changes what reaches the phone's tray, and the owner's "keep reminding" answers on reminders stand. Use UI-10's sentence. |
| WORK-15 | "Past moves" label on Accounts | **Low.** This is the only place a move can be reviewed or undone, and it reads as part of the form. One existing `.group-label`, shown only when rows exist. |
| WORK-16 | Edits report "Updated" for a record another window deleted | **Low.** A correction is lost while the user is told it was saved. One sentence, "This entry was deleted in another window. Nothing was saved.", in every edit handler, including the silent `saveEditGoal`. It ships **alone and before WORK-10**, so the wrapper absorbs a behaviour that already exists and is already probed, rather than introducing it. |
| WORK-17 | Add forms keep typed input after a stale-write refusal | **Low. Amended scope:** keep the fields **only when the new record is no longer in `db` after `save()`**, which is exactly the stale-write reload case. On a quota failure the entry is still in memory and in the list, so clear the form as today. Leaving it populated there invites a second tap and a **duplicate financial record** (see Risks). |
| WORK-18 | Edit sheet refuses an empty type/category | **Low.** Without it, the one recovery path (Restore) fails when it is needed. Refuse with the add form's message through `refuseField`, after WORK-06. |
| WORK-19 | `load()` carries unknown top-level collections through | **Low today, but it is the gate for every future collection.** Spread `parsed` first, then apply the known-key defaults and validation over it. Quarantine behaviour is unchanged. Correct the `:3831` comment. **Condition:** a probe shows that an object with an unknown top-level key survives load and then save, and that export then import still round-trips. |
| WORK-20 | Validate `settings.notifications` on import and cloud load | **Low.** Validate in the shared validator, under its own stated rule that a wrong type means the file did not come from this app, and refuse the whole file. Do not coerce at the read site: a silent repair hides a bad file. |
| WORK-21 | Lowering an account's starting amount warns | **Low. Ruling: warn, then allow.** This is the standing R1 rule: a change that only takes money away is warned about and allowed, and it must stay possible because it is the user correcting a record. Use `accountShortfalls` and the existing `choiceDialog`. Build it on the WORK-10 wrapper, not on a hand-placed check. |
| WORK-22 (measurement only) | Measure the Income and Expenses lists at 10,000 records | **Low.** This is the one heavy surface on the commonest write path that has no figure. Add both lists to `perf.js` at 10,000 records and record the result in HANDOFF in the same form as the WORK-17 (Round 18) measurement. A row cap stays off limits. |
| WORK-23 | Remove stale counts from two design-record comments | **Low.** The coding standard forbids unenforced counts. State the rule, drop the tally, and touch only these two comments. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-07, "confirm first" option | Confirmation before switching a recurring plan to Actual | Rejected in favour of disabling. The act has no legitimate use that Log does not already serve better. A confirm keeps the destructive path open and only narrates it. |
| WORK-08, "set to null" option | Null the goal cursor and let the forward walk recompute | It can bring back every past occurrence as overdue in the bell. That is a new wrong state that replaces the old one. |
| WORK-09, hand-off variant (not proposed by a reviewer; recorded so it is not re-raised) | Send the salary figure to the Add Income form instead of writing it | It breaks the salary/income single-save property recorded in the handler, and leaves salary history without its income whenever the user abandons the form. |
| WORK-14, "change the threshold" option | Make goal contributions urgent a day early | It changes what reaches the notification tray, which the owner has ruled on. The defect is the sentence, so the sentence changes. |
| WORK-17, "keep the form on quota failure too" | Keep inputs populated on every failed save | It invites a duplicate record (see Risks). The narrower scope removes the reported harm without creating that one. |
| WORK-20, "coerce at the read site" option | `Number()` on `daysAhead` | It silently repairs a file the validator's own rule says to refuse, and it leaves the stored value wrong for every other reader. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-10, stages beyond step 1 | Moving the remaining screens onto the write wrapper | **Settled by** any of these: (a) work starting on Notifications or Reports, which are named WORK-19 triggers; (b) another defect of the detached-record / false-"Updated" class found outside Accounts; (c) step 1 having landed, plus a new account-touching flow being proposed. Then migrate one screen per commit, with no behaviour change. A rewrite is still not authorised. |
| WORK-22, delegation | One delegated listener per list instead of per-row listeners | **Settled by** the WORK-22 measurement. If an add, delete or edit re-render of either list takes over **100 ms** at 10,000 records under the assumed 6x phone slowdown (the WORK-17 threshold), approve delegation using the existing `data-show-all` pattern. Otherwise close it. |
| — (UI-03 open design question; not a WORK item) | Should deleting a goal keep its contributions, or should a reached goal have a "done" state? | **Real, but the right shape is unknown.** WORK-04 removes the silent part and stops the app recommending the act. **Settled by** either the owner reporting that people delete reached goals after spending the money, or a reviewer finding that the WORK-04 confirm is not enough. Linking goals to accounts stays off limits whatever is chosen. |

---

## Conflict Rulings

**Severity rule (restated from Round 18).** Under `review-conventions.md` I change neither reviewer's severity. I set the **severity of record for the WORK item**, which is the highest severity among its sources.

**C-1: Severity of the day-rollover defect (WORK-03).**
- **Ruling:** WORK-03 is carried at **High, P1, Sprint 1.** UI-02 stays High and CODE-02 stays Medium in their own reports.
- **Why:** both reviewers agree on the facts. The most frequent act in the app writes a wrong date into a money record by default, on the platform the app recommends, and on the 1st of a month it files the entry under the previous month's totals. That fits "users hit this in normal use". The "visible to an attentive user" argument is a workaround, and having a workaround does not lower an item below High when the default path is the wrong one.

**C-2: Scope of the Reset confirmation fix (WORK-11).**
- **Ruling: remove the side keys and keep the word "settings".** Add "accounts and money moves".
- **Why:** the user reads "Delete every record… settings" as "the app starts clean". A ≈ reading in a remembered currency after that sentence is the same understatement Round 18's WORK-07 fixed. Rewording the sentence to exclude preferences would make it more accurate but less useful, and it would still leave the stale filter state applying to data that no longer exists.
- **Scope limits:** keys are removed by name, in the existing handler, with no general sweep. Theme handling stays as Round 18 ruled.

**C-3: Readiness band.**
- **Ruling:** both scores stand as each reviewer justified them. The architectural reading is that **no Critical exists, so there is no release gate.** There are four Highs of record, so the app sits below "Solid" until Sprint 1 ships. The 73/76 split comes from C-1, and C-1 is now settled at High.

**On the Engineering Manager's other recommendations:**
- **Rec. 3 (WORK-10).** Ruled: step 1 approved, later stages deferred with triggers.
- **Rec. 4 (four product rulings).** WORK-07: disable. WORK-09: C8 is reopened for Salary, in the shape above. WORK-21: warn, then allow. WORK-14: fix the wording.
- **Rec. 5 (UI-03 question).** Deferred with a trigger, above.
- **Rec. 6 (`project.md` omits Accounts).** Not a WORK item, and I do not edit that file. Recorded as a risk: `project.md`'s own stated property is that every shipped module named by the app has an entry, and Accounts, the first item under More, breaks it. The document owner should add it.
- **Dependencies.** All of them are upheld: WORK-01 before WORK-03, the WORK-02 exemption, WORK-04 before WORK-05, WORK-06 before WORK-18, WORK-01 before WORK-09 and WORK-13. One change: **WORK-16 ships before WORK-10, not folded into it.** WORK-10 step 1 covers only Accounts, while WORK-16 covers every edit handler.

---

## Development Order (Implementation Priority)

**Rules for every item:**
- One item per branch and commit, merged `--no-ff`.
- `npm test` green after each item.
- Every new refusal, warning or preserved state ships with a probe shown failing on the code before the fix.
- No `SCHEMA_VERSION` bump and no migration.
- No change to the export format or the cloud payload.

**Sprint 1, then Deploy C (v28, with the cache key checked against the live `sw.js` first):**
1. **WORK-02.** XS, High. It establishes the same-screen exemption that WORK-03 relies on.
2. **WORK-01.** S, High. It must precede WORK-03, otherwise every resume after midnight resets a half-filled form.
3. **WORK-03.** S, High. Includes the month-boundary harness case.
4. **WORK-04.** S, High. Includes the confirm sentence and the advisor rewording.
5. **WORK-08.** S, Medium. Brings the first Goals flow into `npm test`. That flow is also where WORK-04's delete path gets covered.
6. **WORK-07.** XS, Medium. Now ruled. It silently rewrites financial history, so it does not wait for Sprint 2.
7. **WORK-06.** S, Medium.

*Reasoning:* the four wrong-record or lost-headline Highs come first, then the two Mediums that silently change stored history or schedules, then the refusal consistency that WORK-18 builds on. Upper-bound effort is about 3 days including harness work.

**Sprint 2 (data honesty and the remaining Mediums):**
8. **WORK-05.** After WORK-04, because they share `analyzeExpenses`.
9. **WORK-18.** Needs WORK-06's helper.
10. **WORK-19.** The forward-compatibility gate, with the round-trip probe.
11. **WORK-20.**
12. **WORK-17.** In its amended scope.
13. **WORK-16.** Must precede WORK-10.
14. **WORK-11**, 15. **WORK-12**, 16. **WORK-14**, 17. **WORK-23.** XS copy and comment items.
18. **WORK-09.** M. After WORK-01, whose helper it uses. Last in the sprint, because it is the largest item and reopens a ruled path.

**Sprint 3 (structure, then measurement and polish):**
19. **WORK-10 step 1.** The Accounts handlers onto the wrapper, with no behaviour change.
20. **WORK-21.** On the wrapper, as the first new write behaviour built under the new rule.
21. **WORK-22**, measurement only.
22. **WORK-13.** After WORK-01. If WORK-22 later triggers delegation, the delegation comes after WORK-13.
23. **WORK-15.**

*Reasoning:* bugs come before the structure that moves their code. The wrapper lands once the false-"Updated" behaviour it absorbs (WORK-16) already exists and is probed. Measurement comes before any performance change.

---

## Architecture Strategy

**What stays:**
- A single-file, offline-first, mobile-first PWA, with localStorage as the source of truth.
- Integer tugrik money, and dates built only from local components.
- The versioned, append-only schema; quarantine; record-by-record import validation.
- **`writeDb` as the single write path**, with the cross-window guard.
- Balances derived from records and never stored. Accounts are a view over records: no income, expense, Dashboard or Analytics total reads `accountId`.
- The R1 tiers: moving money is refused; taking money away is warned about, then allowed; spending is warned with "Record anyway"; "No account" is never limited.
- Every standing Debts, Accounts, Envelopes and Phase 2 rest ruling.

**What changes this quarter:**
- **Form state survives renders.** One value-preserving select helper (WORK-01). New selects are built with it from the start (WORK-09).
- **"Today" is live.** A day-change branch in the existing visibility listener (WORK-03). No new timers.
- **One implementation of "income with its split"**, shared by Income and Salary (WORK-09).
- **The write wrapper exists** over `writeDb`, Accounts first (WORK-10 step 1). From then on, new write paths use it.
- **`load()` is forward compatible** (WORK-19). This is now a precondition for any new top-level collection.
- All of the above are refactors inside the existing file. None is a rewrite.

**Gated, not refused:**
- **Cloud Sync stays off.** The Round 18 gate stands unchanged: WORK-24 (Firebase SDK pinning, deferred in Round 18), plus a finding and ruling on the 1 MiB single-document limit. Accounts and transfers make the blob grow faster.
- **Notifications or Reports work** triggers WORK-10's later stages, and must first have WORK-19 (this round) landed if it adds a collection.

**Off limits:**
- Any rewrite.
- Frameworks, build steps, state or store libraries.
- IndexedDB or a second store.
- Re-splitting an income after an edit. Accounts on plans. Linking goals to accounts.
- Any limit on Data Summary bulk clears. A row cap on lists.
- Changing notification thresholds without an owner ruling.
- App-wide sweeps of spacing, fonts, emoji or comments.
- A redesign of goal deletion this quarter.

**Risks (stated as risks, not findings):**
- **WORK-17.** If an add form stays populated after a quota failure while the entry is still in memory, a second tap would create a duplicate financial record. That is why the scope is narrowed to "record no longer in `db`".
- **WORK-19.** Carrying unknown keys through `load()` means an export can contain them. If `importProblem` rejects unknown top-level keys, a backup from a newer build becomes unrestorable on an older one. The round-trip probe is a condition of approval for this reason.
- **WORK-05.** A user who records the same money both as a Savings-group expense and as a goal contribution would have it counted twice in the savings figure. This is acceptable for an advisory figure that changes no stored record, but it must not be reused for any total.
- **WORK-03.** If the handler ever wrote into an open sheet's fields or called `save()`, a resume would alter or persist an edit the user had not confirmed. Both are excluded by the ruled shape.

---

## Final Recommendation (Recommended Next Action)

Start Sprint 1 with **WORK-02** on its own branch: one `window.scrollTo(0, 0)` in `navigate()`, applied only when the destination differs from the active screen, with a harness assertion that a cross-screen navigation lands at scroll position zero and a same-screen `navigate(current)` does not move. When `npm test` is green, merge it and go straight to **WORK-01**. That means the value-preserving select helper for `expCategory`, `expAccount`, `incType` and `incAccount`, plus a `moveReturnFlow` assertion with a non-first category and an empty `db.actual`, shown failing on current `main` first. WORK-03 must not start until WORK-01 is merged. Sprint 1 ships as one deploy at v28, after the live `sw.js` has been confirmed at v27.

Relevant files:
- D:\3_Claude\PowerApps\reports\engineering-manager.md
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\reports\chief-architect-phase2-rest.md
- D:\3_Claude\PowerApps\reports\chief-architect-accounts.md
- D:\3_Claude\PowerApps\reports\HANDOFF.md
- D:\3_Claude\PowerApps\expense-pwa\index.html
