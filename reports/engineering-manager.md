# Engineering Manager: Whole Application (v27)

**Inputs.** I read both reports in full:
- `reports/ui-review.md`: UI Review, v27, 73/100, 11 findings (UI-01 to UI-11).
- `reports/code-review.md`: Code Review, v27, 76/100, 14 findings (CODE-01 to CODE-14).

That is 25 source findings. Two pairs describe the same problem, so they merge into **23 WORK items**. No finding was dropped and no severity was changed.

**ID note.** `WORK-01` to `WORK-23` are this report's own items, numbered fresh as `review-conventions.md` requires. Earlier rounds' IDs (WORK-17, WORK-18b, WORK-19, WORK-24, WORK-31) always appear here as **"prior WORK-nn"** so they are not confused with this round's items.

---

## Project Health

Neither report has a Critical finding. The UI score (73, "Usable but fragile") and the Code score (76, "Solid") fall either side of the 75 line. The main reason is that the reviewers rate the shared day-rollover defect differently: High in UI, Medium in Code (Conflict C-1).

The four Highs are all XS or S. They all sit in the most frequent flows, and three of them silently write wrong records:
- the wrong category or account after a re-render or a Move round trip;
- yesterday's date after a resume;
- money that has already been spent reappearing in an envelope after a goal delete.

The fourth puts the headline figure above the viewport on arrival. The persistence core is reported sound. The defects are at the edges, where form and session state meet stored records. About a day and a half of P1 work should lift the app back to Solid.

---

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Add Expense and Add Income forms forget the chosen category or type and the account on every re-render, including the return from the limit dialog's Move | CODE-01 | High | P1 | S | — |
| WORK-02 | Switching screens keeps the previous scroll position, so the destination opens part-way down the page | UI-01 | High | P1 | XS | — |
| WORK-03 | "Today" is fixed at launch: after a night or a month boundary in the background, new entries default to yesterday and "This Month" shows last month | UI-02, CODE-02 | High (UI-02) / Medium (CODE-02), see C-1 | P1 | S | WORK-01; coordinate with WORK-02 |
| WORK-04 | Deleting a goal quietly returns all its account-paid contributions to their accounts, and the advisor recommends that delete | UI-03 | High | P1 | S | — |
| WORK-05 | Advisor savings rules ignore Savings Goals: red "Savings only 0%" critical tip for people who save through Goals; the emergency-fund rule ignores the default Emergency Fund category and non-English goal names | UI-04 | Medium | P2 | S | WORK-04 (same function, sequence only) |
| WORK-06 | Refusals in the edit sheets and the Settings add fields are toast-only; the field is neither marked nor focused | UI-06 | Medium | P2 | S | — |
| WORK-07 | Switching a recurring plan to "Actual" in the edit sheet deletes the series' whole planned history with no warning | CODE-03 | Medium | P2 | XS (once ruled) | Chief Architect product ruling |
| WORK-08 | Deleting a goal contribution resets the schedule cursor to a contribution date, which shifts or silences the reminders; land it with the first Goals probe | CODE-04 | Medium | P2 | S | — |
| WORK-09 | Salary Calculator's "Save & Add as Income" records no account and never splits, so for envelope users the main income skips the envelopes | UI-05 | Medium | P2 | M | Ruling on C8; WORK-01 (reuse its select helper) |
| WORK-10 | Prior WORK-19's trigger ("any new write path") has fired repeatedly; concurrency safety is now a per-handler convention | CODE-05 | Medium | P2 | L (staged; step 1 is S–M) | Chief Architect ruling (trigger fired) |
| WORK-11 | Reset confirmation omits accounts and money moves; the display-currency, filter and converter keys survive a Reset that promises to delete "settings" | UI-09, CODE-12 | Low | P3 | XS | Small scope choice, see C-2 |
| WORK-12 | Money-move refusal says "has only ₮0" when the source account is negative | UI-07 | Low | P3 | XS | — |
| WORK-13 | Row Edit and Delete buttons are named only "Edit" and "Delete", so a screen reader hears a column of identical buttons | UI-08 | Low | P3 | S | Sequence after WORK-01 (same render functions) |
| WORK-14 | Notifications helper misstates when "Goal contributions due" becomes urgent | UI-10 | Low | P3 | XS | Product choice: fix the wording or change the threshold |
| WORK-15 | Money-move history on Accounts has no label and sits directly under the Move Money button | UI-11 | Low | P3 | XS | — |
| WORK-16 | Income, expense and account edits report "Updated" when another window deleted the record while the sheet was open | CODE-06 | Low | P3 | XS | Related to WORK-10 (may be absorbed if WORK-10 is approved) |
| WORK-17 | Add forms clear what was typed even when the write was refused | CODE-07 | Low | P3 | XS | — |
| WORK-18 | An edit can save an empty `typeId` or `categoryId`, which makes the app's own backup unrestorable | CODE-08 | Low | P3 | XS | WORK-06 (use `refuseField` for the refusal) |
| WORK-19 | `load()` silently drops unknown top-level collections, and the "newer build" guard at `:3831` cannot prevent it | CODE-09 | Low | P3 | XS | — |
| WORK-20 | Import and cloud load accept any `settings.notifications`; a string `daysAhead` breaks the reminder window | CODE-10 | Low | P3 | XS | — |
| WORK-21 | Lowering an account's starting amount can push it below zero with no warning | CODE-11 | Low | P3 | XS (once ruled) | Chief Architect one-line ruling |
| WORK-22 | Income and Expenses lists are unbounded, rebuild with two listeners per row, and are not measured at 10,000 records | CODE-13 | Low | P3 | S (measure) + S (delegation, only if the threshold is crossed) | Measurement before delegation |
| WORK-23 | Two design-record comments carry counts that are now false ("FOUR SITES ONLY", "thirteen places") | CODE-14 | Low | P3 | XS | — |

---

## Quick Wins

These are XS or S items that remove Medium-or-higher severity. Do them first inside their band.

- **WORK-02** (XS, High): one `window.scrollTo(0, 0)` in `navigate()` when the destination changes.
- **WORK-01** (S, High): preserve the select value across a rebuild, using the `renderDebts` pattern, and extend `moveReturnFlow` to assert category and account.
- **WORK-03** (S, High/Medium): one `visibilitychange` day-change branch. It re-applies the presets, moves untouched date fields to today, and re-renders the same screen. Add a month-boundary harness case.
- **WORK-04** (S, High): one sentence in the goal-delete confirm, and one reworded advisor line.
- **WORK-08** (S, Medium): roll the cursor back to an occurrence date (or null), together with the first Goals probe.
- **WORK-06** (S, Medium): replace `toast` with the existing `refuseField` in the edit and Settings refusal branches.
- **WORK-05** (S, Medium): count period-dated goal contributions as savings, and treat the default Emergency Fund category as an emergency fund.
- **WORK-07** (XS, Medium): a quick win only after its product ruling.

---

## Sprint Plan

**Sprint 1: WORK-01, WORK-02, WORK-03, WORK-04, WORK-08, WORK-06.**

**Total effort:** 1 XS + 5 S, about 2.5 to 3 days at the upper bounds. That includes the harness additions both reviewers asked for: the `moveReturnFlow` assertions, the month-boundary case and the first Goals probe. It leaves room for `npm test` and a deploy.

**Order inside the sprint:**
1. WORK-02
2. WORK-01
3. WORK-03
4. WORK-04
5. WORK-08
6. WORK-06

All six edit the same `index.html`, so land them one at a time.

**What it delivers:**
- Every screen opens at its top.
- The add forms keep the category and account the user chose, including through the Move round trip that the Envelopes ruling promises.
- Entries are dated today, and "This Month" means this month in a resumed PWA.
- Deleting a finished goal tells the user that the money goes back into the paying account, and the advisor stops recommending the delete.
- Goal reminders stay on schedule after a contribution delete, and Savings Goals finally has a probe of its own.
- Edit-sheet errors behave like add-form errors.
- All four Highs are closed and two Mediums are removed.

**Deliberately left out:**
- WORK-05: it touches `analyzeExpenses` right after WORK-04 and is better as the first item of Sprint 2.
- WORK-07, WORK-09, WORK-10 and WORK-21: each waits on a ruling.

---

## Roadmap

- **Sprint 1:** WORK-02, WORK-01, WORK-03, WORK-04, WORK-08, WORK-06
- **Sprint 2:** WORK-05, WORK-07 (if ruled), WORK-18, WORK-19, WORK-17, WORK-11, WORK-12, WORK-09 (if ruled)
- **Sprint 3:** WORK-10 step 1 (if ruled), WORK-16, WORK-21 (if ruled), WORK-22 (measure), WORK-20, WORK-23
- **Later:**
  - WORK-10 stages beyond step 1
  - WORK-22 delegation (only if the measurement crosses the prior WORK-17 threshold)
  - WORK-13
  - WORK-14
  - WORK-15

---

## Dependencies

- **WORK-01 before WORK-03.**
  - Both reviewers recommend that the day-rollover handler re-render the active screen. Code Review specifies doing it through `navigate`.
  - Until WORK-01 lands, every `renderExpenses()` and `renderIncome()` resets the category or type and the account selects.
  - Shipping WORK-03 first would add a new trigger for the CODE-01 defect: every resume after midnight would quietly reset a half-filled form.
- **WORK-02 and WORK-03 must agree on same-screen behaviour.**
  - UI-01's fix resets scroll only when the destination differs, which keeps `navigate(current)` callers in place.
  - WORK-03's re-render of the active screen relies on that exemption.
  - If WORK-02 drops the exemption, a resume would jump the user to the top mid-task.
- **WORK-04 before WORK-05 (sequence only).** Both edit `analyzeExpenses`: WORK-04 rewords the "Goal reached" tip and WORK-05 changes the savings and emergency-fund rules. Landing them separately keeps each diff reviewable.
- **WORK-06 before WORK-18.**
  - CODE-08's fix is "refuse Save in the edit sheet when the select is empty".
  - Once WORK-06 has converted `saveEditEntry` to `refuseField`, WORK-18's refusal should use the same helper, not add another toast-only branch, which is exactly what UI-06 reports.
- **WORK-01 before WORK-09.** UI-05 reuses `fillAccountSelect` and the Income split rendering on the Salary screen. WORK-01 introduces the value-preserving select helper, and the Salary selects should be built with it from the start so the CODE-01 class is not reintroduced.
- **WORK-08 provides the Goals probe.** The probe that WORK-08 adds (weekly schedule, manual top-up, then delete) is the natural place to cover WORK-04's goal-delete path later. It is not a blocker.
- **WORK-10 and WORK-16.** Code Review states that the prior WORK-19 step 1 "retires the hand-placed `dbReplacedSince` calls and CODE-06's per-handler 'record vanished' checks together". WORK-16 is XS and can ship alone. If WORK-10 is approved, the architect may prefer to fold it in. I scheduled them in the same sprint so neither is wasted.
- **WORK-10 and WORK-21.** CODE-11's fix runs a dialog followed by a `dbReplacedSince` check. If WORK-10 step 1 lands first, WORK-21 uses the new wrapper instead of a hand-placed check.
- **WORK-01, WORK-13 and WORK-22 share the same render functions** (`renderIncome` and `renderExpenses`). Land them in the order WORK-01, then WORK-13, then WORK-22 delegation, to avoid rework.
- **Ruling gates:**
  - WORK-07: a product ruling on disabling the Actual segment versus confirming first.
  - WORK-09: C8 reopened by a new argument (Envelopes postdates C8).
  - WORK-10: prior WORK-19's trigger has fired.
  - WORK-21: whether the opening-amount change should warn.
  - WORK-14: wording versus threshold (a product choice).
  - WORK-11: removing the side keys versus no longer saying "settings" (C-2).

---

## Conflicts

**C-1: Severity of the day-rollover defect (WORK-03).**
- **UI Review (UI-02): High.** The most frequent act writes a wrong date into a financial record without saying so. On the 1st of a month the entry is filed under the previous month's totals, budget comparison and trend. It is not Critical because the date is visible on the form and on the row and can be corrected.
- **Code Review (CODE-02): Medium.** These are "wrong dates on money records, made by default, in normal use on the primary platform", filed among the Mediums that "can also put wrong data into the record". Each one is "visible to an attentive user".
- **Position.** I have not changed either severity. For scheduling I set the merged item to P1 because one source is High. That is a priority decision, not a severity ruling. The severity itself is for the Chief Architect to record.

**C-2: Scope of the Reset confirmation fix (WORK-11).**
- **UI Review (UI-09):** add "accounts and money moves" to the list. Nothing more.
- **Code Review (CODE-12):** add the same words, and also either remove the UI-preference side keys (display currency, filter state, converter last-from/to) in the same handler, or stop saying "settings".
- **Position.** The two reports agree on the facts. They differ on whether the surviving side keys are part of the defect. The second half of CODE-12 needs a choice between the two options.

**C-3: Readiness band.**
- **UI Review:** 73, "Usable but fragile" (three Highs in core flows).
- **Code Review:** 76, "Solid" (one contained High, four Mediums).
- **Position.** Each score is justified within its own report. Part of the gap comes from C-1, where the same defect counts as a High in one report and a Medium in the other. I report both scores as they stand.

No other disagreements. The reports cover different ground and do not contradict each other's evidence. UI Review's praise of the Accounts dialogs (consequences explained, Move offered) and Code Review's CODE-01 (the form state lost on the return from that Move) concern different parts of the same flow. Both stand.

---

## Estimated Effort

Upper bounds from `review-conventions.md`: XS ≤ 0.5 h, S ≤ 0.5 day, M 1–2 days, L up to a week.

| Band | Items | Sizes | Upper-bound total |
|---|---|---|---|
| P0 | none | — | 0 |
| P1 | WORK-01, 02, 03, 04 | 1 XS + 3 S | about 1.5 days |
| P2 | WORK-05, 06, 07, 08, 09, 10 | 1 XS + 3 S + 1 M + 1 L | about 8.5 days in full; about 4 to 5 days if WORK-10 is limited to step 1 (S–M) |
| P3 | WORK-11 to WORK-23 | 11 XS + 2 S (+1 conditional S) | about 2 days (+0.5 day if WORK-22 delegation is needed) |
| **All** | 23 items | | **about 12 days in full**, of which about 5 days (WORK-10 stages beyond step 1) are staged and ruling-dependent |

---

## Recommendations

1. **Ship Sprint 1 as planned.** All four Highs are XS or S, change no stored schema, export format or cloud payload, and three of them stop the app silently writing wrong records in its most frequent flows. WORK-01 must land before WORK-03.
2. **Record a severity for the day-rollover defect (C-1).** It is the one point where the two reviewers disagree on impact, and it decides which readiness band the app sits in.
3. **Rule on prior WORK-19 as fired (WORK-10).**
   - Code Review found the trigger fired across Accounts Phase 1, Envelopes and Phase 2 rest. No ruling since then took it up or re-deferred it.
   - Concurrency safety now depends on six hand-placed `dbReplacedSince` calls.
   - Code Review proposes the already-ruled shape: step 1 wraps `writeDb`, one screen at a time, Accounts first, no rewrite. Approving, re-deferring with a new trigger, or rejecting are all acceptable outcomes. Leaving it unruled again is the one outcome to avoid.
4. **Four one-line product rulings unblock four items:**
   - WORK-07: disable "Actual" on a recurring plan, or confirm first.
   - WORK-09: does Envelopes reopen C8 for the Salary save?
   - WORK-21: should lowering a starting amount warn?
   - WORK-14: fix the wording, or change the threshold.
5. **Answer UI-03's open design question when convenient.** UI-03 asks whether a deleted goal should keep its contributions. WORK-04 does not depend on the answer, but the answer decides whether a deeper change follows.
6. **Note for the doc owner (not a WORK item).** UI Review observes that `knowledge/project.md` does not list Accounts, which now ships as the first item under More.

Relevant files:
- D:\3_Claude\PowerApps\reports\ui-review.md
- D:\3_Claude\PowerApps\reports\code-review.md
- D:\3_Claude\PowerApps\knowledge\review-conventions.md
- D:\3_Claude\PowerApps\.claude\agents\engineering-manager.md
