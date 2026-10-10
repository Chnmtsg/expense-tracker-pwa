# Chief Architect: Sprint 1 Post-Implementation Ruling

Inputs: `reports/ui-review-sprint1.md` (UI-01 to UI-07, 88/100) and `reports/code-review-sprint1.md` (CODE-01 to CODE-09, 80/100). Both were read in full and neither was changed. Measured against the Sprint 1 rulings in `reports/chief-architect.md` and against `knowledge/project.md`. I read the sites in `expense-pwa/index.html` that these rulings depend on: `:5534-5609`, `:5667`, `:6630-6682`, `:7603-7607`, `:10315-10329`, `:12788-12801`, `:12862-12869`, `:13104-13106`, `:13598-13633`.

This is a short post-implementation ruling, so there is no Engineering Manager roadmap. The calling agent set this scope. Instead of conflicts the Manager recorded, this ruling settles the questions the reviewers sent up for a decision. No ruled Sprint 1 item is reopened.

## Executive Decision

**No for v28 as it is staged. Yes once the fix-now set below lands and `npm test` is green.**

- Sprint 1 matches its rulings, and nothing in it writes a stored figure wrongly.
- CODE-01 is a High. If it is real, the main High of the sprint (WORK-02) is still open on six of the ten destinations, and the probe never exercises it. That cannot ship unsettled.
- The two Mediums (UI-01, UI-02) are side effects of Sprint 1's own changes. Each is fixed by one or two lines, and they should not reach users in the deploy that caused them.
- Everything else is either a defect in code Sprint 1 touched, which is cheaper to fix now than to carry, or it belongs to a named later item.

v28 has not been deployed, so these commits ship under the v28 key. If any v28 build has already reached a client, bump the key to v29 instead.

## Approved Improvements

Fix now, before the v28 deploy. One commit per row unless the row says otherwise.

| Item ID | Title | Reason for approval |
|---|---|---|
| CODE-01 | Scroll reset undone by the deferred `history.go` after a modal closes | It is the only High, and it would leave WORK-02's High open on Accounts, Goals, Debts, Salary, Settings and Budget Planning. **Ruling:** first add the More-sheet probe (scroll Home, open `#moreSheet`, click a `[data-more-nav]` button, wait about 100 ms, assert `scrollY === 0`) and record whether it fails on current `main`. Then add `if ('scrollRestoration' in history) history.scrollRestoration = 'manual';` once, at init, before any `openModal` can run. **This line is approved whatever the probe shows.** A pass in headless Chromium says nothing about WebKit, which the installed PWA also runs on. The modal stack already owns history outright (`:6266`), and a modal never changes the page's scroll, so manual restoration costs nothing. The probe stays in `npm test` as the guard. The same-screen exemption at `:6682` is not touched. |
| CODE-02 | The Move hand-off viewport assertion is a replica | It is the guard on the condition the WORK-02 ruling set, and it sits on the path CODE-01 is about. Move the assertion into `moveReturnFlow`, after a wait longer than the deferred traversal, and assert `r.height > 0` first. It is harness only and the same mechanism as CODE-01, so it may share CODE-01's probe commit. |
| UI-02 | Expenses and Budget Planning share a scroll position | This is the WORK-02 symptom on a pair of core modules, in normal use. **Ruling:** at the two entry points that change `expMode`, call `window.scrollTo(0, 0)` only when the mode actually changed. Those are the tab handler at `:6630` and the More → Budget Planning branch at `:6649`. Leave `navigate()` and the segmented toggle inside `setExpMode` alone. Land it after CODE-01, because the More path depends on it. |
| UI-01 / CODE-03 | On the 1st, the Analytics range and its calendar show different months | **Ruling: sync, do not accept the mismatch.** The design record says the calendar follows the range, and a Peak day tile naming a date the calendar is not showing is the exact symptom it exists to stop. The WORK-03 ruling made `calDate` a cursor so that a resume would not *gratuitously* move it. It did not license the range and the calendar disagreeing. **Shape:** in the refresher at `:5595`, capture `fromEl.value`/`toEl.value`, run `applyPreset`, and call `syncCalendarAnchor()` only if either value changed. The user's arrow position survives every resume where the range did not move. Update two comments: the `syncCalendarAnchor` comment should name its call sites, listing this one, rather than state a count, and the WORK-03 comment's "left where the user put it" becomes "moved only when the range it shows moved". |
| CODE-04 | Bell badge not refreshed on a day change | **Ruling: approved.** The badge is a "today" surface, and Notifications on the roadmap will inherit the gap. Add `updateBellBadge()` to the day-change branch of `refreshForNewDay`. It writes nothing. Do not add `maybeFireOSNotifications()`, which no reviewer raised. |
| CODE-05 | A contribution delete can advance the schedule cursor past unpaid occurrences | **Ruling: approved as `min(current, computed)`.** A delete may only move the cursor backward. At `:12800`: no contributions remain → `null` (as now). `g.recLastLogged` is `null` → stays `null`, because null already means every occurrence is owed. Otherwise use the earlier of the two ISO dates. Add the reviewer's weekly late-top-up case to `goals.js`, failing first. Silently dropping owed reminders is the same symptom class WORK-08 was opened for, and the fix is in WORK-08's own lines. |
| CODE-08 | The goal-delete cascade that WORK-04 describes never runs under test | The WORK-04 sentence makes a money claim ("goes back into"), and correctness of financial data comes first. Add one confirm-`true` pass to the `accounts.js` WORK-04 flow that asserts `accountBalance(A1)` rises by exactly ₮60,000. Harness only. |
| CODE-09 (WORK-03 part only) | WORK-03 probe covers a sample | It is approved now because UI-01 and CODE-04 edit `refreshForNewDay` in this round, and the binding guarantee should be guarded before that function is edited again. Extend the flow to `debtDate` and `sDate`, and add an open edit sheet whose `#mDate` holds the previous day, asserting it is left alone. The WORK-06 part is carried (see Deferred). |
| UI-03 | The schedule refusal marks a filled Instalment field | WORK-06 exists to point at the field that needs attention, and here it points at the wrong one. At `:13105`, pass the id of the first *empty* part among `mSchedInstalment`, `mSchedCount`, `mSchedFirstDue`. The message is unchanged. |
| UI-06 | The WORK-07 helper is three clauses, and the bell is named only by emoji | The helper does not follow the ruling, which asked for a one-line helper pointing to Log. **Exact sentence:** `A repeating plan stays a plan. To record a payment, use Log in Reminders (🔔) when it is due.` Wrap the emoji in `<span aria-hidden="true">`, so a screen reader hears "Reminders", the button's accessible name. The id, `aria-describedby` and placement are unchanged. |
| CODE-06 | Two comments from this sprint state what the code does not | These are design-record errors introduced this sprint, in the recurrence code. Move `goalOccurrenceAtOrBefore` and its comment below `stepDate`, so `stepDate`'s comment sits directly above it again. Replace "The four entry dates below" with "The entry dates in `ENTRY_DATE_IDS`". The commit touches comments only. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| UI-01 / CODE-03, "record the mismatch as accepted" option | Leave the range and the calendar disagreeing after a resume | It accepts a self-contradicting screen on the app's most common entry path, once a month for every user, when a guarded call removes it. |
| UI-01 / CODE-03, "always call `syncCalendarAnchor`" variant | Re-anchor on every day change | It would reset the user's arrow position on resumes where the range did not move (for example, This Year in mid-year). That breaks the cursor property the WORK-03 ruling kept, for no gain. |
| CODE-01, "line only if the probe fails" variant | Make `scrollRestoration = 'manual'` conditional on a headless result | The behaviour depends on the browser engine, and the probe runs on one engine. The line is the declared ownership of history, not a workaround, so it lands either way. |

## Deferred

These are carried to a named later item. Nothing is dropped.

| Item ID | Title | What would change the decision |
|---|---|---|
| UI-04 | Edit-sheet refusal wording differs from the add form | **Carry to Sprint 2, as its own commit directly after WORK-18.** WORK-18 already rules "refuse with the add form's message", so the edit branches adopt that principle there. Use the add form's message verbatim: "Enter a name", "Enter a target amount", "Enter an amount". It is not fixed now because the wording is inconsistent but not wrong, and the field is correctly marked. |
| UI-05 / CODE-07 | Settings rename refusals are toast only | **Carry to Sprint 2, its own commit after WORK-18, which touches the same handlers (`saveEditIType`, `saveEditCat`).** Shape: add an element-taking marker (for example `refuseEl(el, msg)`) and have `refuseField(id, msg)` delegate to it. Then use it with the `nameEl` that `findByDataId` already returns. Do not give the row inputs ids built from record ids. WORK-06 is not widened after the fact. The WORK-06 commit subject stays as written, because history is not rewritten. |
| UI-07 | A single contribution delete does not say the money returns | **Carry to Sprint 2 as a standalone XS item.** It is outside every Sprint 1 site and not a regression. **Exact sentence**, used only when the contribution has an `accountId` and `date <= todayISO()` (WORK-04's counting rule): `Delete this contribution? The ${fmt(amount)} goes back into ${accountName}.` Use `Deleted account` when the account is gone, as at `:10320`. Otherwise keep `Delete this contribution?`. |
| CODE-09 (WORK-06 part) | WORK-06 probe checks three of eight sites | **Carry to Sprint 2 with WORK-18**, which next edits the refusals. Loop the marked-field assertion over the five unprobed sites. It is not needed now because every site calls `refuseField` today and none is edited this round. |

## Conflict Rulings

No Engineering Manager roadmap was produced for this post-implementation review, so there are no recorded conflicts. These are the questions the reviewers sent up for a ruling:

- **UI-01 / CODE-03:** call `syncCalendarAnchor`, guarded on the range having moved. The mismatch is not accepted.
- **CODE-04:** `updateBellBadge()` belongs to the day-change branch. The day-change surfaces are now: entry dates, presets, the calendar anchor (when the range moved), the active screen and the bell badge. New "today" surfaces are added to `refreshForNewDay` only, with no timers, as WORK-03 ruled.
- **CODE-05:** `min(current, computed)`, with `null` current staying `null`. A delete never advances a schedule.
- **UI-02:** scroll to the top at the two mode-changing entry points, only when the mode changed. The ruled exemption is untouched.
- **UI-06:** `A repeating plan stays a plan. To record a payment, use Log in Reminders (🔔) when it is due.`
- **UI-07:** `Delete this contribution? The ₮X goes back into <account>.` This is carried to Sprint 2.
- **UI-04 / UI-05 / CODE-07:** these are carried to Sprint 2, beside WORK-18. Each is its own commit, and the add form's message is the standard.
- **CODE-01 conditional fix:** the orchestrator's fix is approved, and widened to unconditional, as reasoned above.

## Development Order

1. **CODE-01 + CODE-02.** Probe first (record whether it fails on `main`), then the `scrollRestoration` line. This removes the only High, and UI-02's More path depends on it.
2. **UI-02.** It needs step 1 to hold on the More → Budget Planning path.
3. **CODE-09 (WORK-03 part).** It guards `refreshForNewDay`'s binding property before that function is edited.
4. **UI-01 / CODE-03.** The guarded anchor sync and its two comments.
5. **CODE-04.** One line in the same function, in its own commit.
6. **CODE-05.** Failing `goals.js` case first, then the `min` rule.
7. **CODE-08.** Harness only. It confirms the money claim shipping in v28.
8. **UI-03.**
9. **UI-06.**
10. **CODE-06.** Comment only. Last, because step 4 also edits the WORK-03 comment block.
11. **`npm test`** (all standing gates) green, then deploy v28.

*Reasoning:* the High comes first, then the Medium that depends on it, then the "today" changes behind their guard, then schedule and money correctness, then copy and comments. Every step is XS except step 3, which is small.

## Architecture Strategy

- **Stays:** `navigate()` as the single place a screen change resets scroll, with its same-screen exemption. `refreshForNewDay` as the single "today moved" hook, with no timers. `refuseField` as the single refusal marker. `rebuildSelect` for every select. `goalOccurrenceAtOrBefore`/`stepDate` as the one definition of a recurrence step.
- **Changes:** the history stack now explicitly owns scroll restoration (`manual`). The calendar anchor gains a third, guarded call site. The goal cursor gains one stated rule ("a delete never advances it"), held in the delete path.
- **Off limits:** screen-level history or routing; any per-screen scroll memory; timers for day rollover; re-deriving `calDate` on render; widening WORK-06 after the fact; schema, export or cloud-payload changes in this round.
- **Risks (not findings):**
  - Any new screen reached through a sheet, or new date-dependent surface, must be checked against `navigate()` and `refreshForNewDay` respectively. Nothing enforces that except the probes approved here.
  - The CODE-05 rule lives in one writer. If a future path deletes contributions in bulk (for example a goal-level reset), it must apply the same `min` rule.

## Final Recommendation

Next, write the More-sheet navigation probe (CODE-01), run it on current `main`, and record whether it fails. Then land `history.scrollRestoration = 'manual'` at init with the probe in `npm test`, and work down the Development Order. v28 deploys only after step 11 is green.
