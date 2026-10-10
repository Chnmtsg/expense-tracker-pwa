# Chief Architect: Sprint 2 Post-Implementation Ruling

Inputs: `reports/ui-review-sprint2.md` (UI-01 to UI-04, 92/100) and `reports/code-review-sprint2.md` (CODE-01 to CODE-04, 88/100). I read both in full and changed neither. I measured them against the Sprint 2 rulings in `reports/chief-architect.md`, the carried rulings in `reports/chief-architect-sprint1-review.md`, and `knowledge/`.

I read the sites these rulings depend on in `expense-pwa/index.html`:
- `:5530-5546`, `:5628-5671` (the filter state and its restore path)
- `:6024-6106` (`logPlannedAsActual`, `openLogPlannedModal`)
- `:8250-8275` (the Reset handler)
- `:9739-9796`, `:9909-9933`, `:10026-10031` (the display currency and the converter pair)
- `:10642`, `:10862-10921` (`leftPhrase`, `trAdd`)
- `:13104-13112` (`editTargetGone`)
- `:13402-13431` (`saveEditLogPlanned`)
- `:13785-13814` (`refreshForNewDay` and boot)

I also read `eslint.config.mjs:62-78` and `tools/lint.mjs`.

This is a short post-implementation ruling, so there is no Engineering Manager roadmap. Instead of Manager conflicts, it settles the questions the reviewers sent up. No ruled Sprint 2 item is reopened.

## Executive Decision

**No for v29 as staged. Yes once the fix-now set below lands and `npm test` is green.**

- Sprint 2 matches every ruling, and both reviewers confirm that every condition of approval has a probe that can fail.
- CODE-01 is the reason v29 is held. It is pre-existing, not caused by Sprint 2. But it is in a handler Sprint 2 edited, and it writes a **duplicate expense** and **silently consumes a reminder**. That is wrong financial data, and it ranks above everything else. The fix is size S.
- UI-01/CODE-02 is a partial miss on a ruled symptom (C-2). The other Lows are each XS and in lines this deploy introduces. It is cheaper to land them now than to ship them and carry them.
- CODE-04 does not change behaviour and is carried.

v29 has not been deployed, so these commits ship under the v29 key. If any v29 build has already reached a client, bump the key to v30 instead.

## Approved Improvements

Fix now, before the v29 deploy. Each row is its own commit.

| Item ID | Title | Reason for approval |
|---|---|---|
| UI-02 | "Nothing was saved" is a toast in one stale case and a dialog in the other | WORK-16 exists to stop a lost correction looking saved. A toast that fades while the sheet closes brings back that impression for any user who looks away. The file's own rule (`:10644-10646`, `:8239-8242`) says a message the user must act on goes in a dialog. **Shape:** change only `editTargetGone()`. It calls `closeEditModal()`, then `alertDialog(msg, { title: 'Not saved' })`. Give it one optional parameter, `msg = EDIT_TARGET_GONE_MSG`, so that CODE-01 can reuse it. The ruled sentence does not change: `This entry was deleted in another window. Nothing was saved.` All ten sheets change with this one function. |
| CODE-01 | The log-plan sheet logs whatever occurrence is due at Save time | This is the only Medium, and it writes wrong financial data: a second expense for an occurrence that is already logged, plus the next occurrence marked paid with no expense, so its reminder disappears. It is the WORK-08 / CODE-05 symptom class, and both of those were fixed before deploy. **Shape:** (1) `openLogPlannedModal` stores the occurrence it showed: `editCtx = { kind: 'logPlanned', planId, due }`. (2) In `saveEditLogPlanned`, **after the last `await` and immediately before `logPlannedAsActual`**, compare `nextPlannedDue(p)` with `editCtx.due`. If they differ, including when it is `null`, call `editTargetGone(LOG_TARGET_MOVED_MSG)` and write nothing. The check sits after the awaits because the `confirmSpend` dialog is itself a window in which another tab can log the occurrence. (3) Replace the `:13427-13428` comment with the true rule: the sheet acts on the occurrence it displayed, or on nothing. (4) Do not change `logPlannedAsActual` or its other callers. The one-off case, where `nextPlannedDue` is `null` after another window logs the plan, takes the same path. That removes the silent close the code review named. |
| UI-01 / CODE-02 | After Reset, the old display currency stays applied for the session | This is one issue, reported by both reviewers (see Conflict Rulings). C-2 named this exact symptom: "A ≈ reading in a remembered currency after that sentence". WORK-11 is not finished while that reading is still on screen in the session where the user pressed Reset. **Shape:** (1) In the removal list, replace the literal `'display-currency'` with `DISPLAY_CURRENCY_KEY` and delete the stale "declared further down" comment. (2) After the removals and before the existing renders, call `loadDisplayCurrency(); syncDisplayCurrencyControl(); renderSalaryConvReading();`. Do **not** call `setDisplayCurrency('MNT')`, because it writes the key straight back into storage through `rememberUiPref`, which undoes the removal. Home refreshes itself through `navigate('dashboard')` on arrival (`:9779-9783`). (3) Converter pair: **no change.** `openConverter` re-reads `conv-last-from`/`conv-last-to` from storage every time it opens (`:10028-10031`), so the in-memory pair never reaches the screen after Reset. On that point UI-01's evidence does not hold. (4) Filter presets: deferred (see Deferred). **Lint:** the warning count goes from 16 to 17. I accept that. The new warning is in the class `eslint.config.mjs:66-73` documents as safe (a reference inside a handler that runs only on a click, after the declaration has been evaluated). `tools/lint.mjs` has no warning ceiling. One source of truth for a storage key outweighs one documented-safe warning, and the ruling named the constant. State the 16 to 17 change in the commit message. Do not reorder declarations to avoid it, because that is the sweep the config rejects. |
| UI-03 | The money-move refusal for a negative account reads as a status | WORK-12 removed the contradiction, but the refusal still does not say that anything was refused. The other two `leftPhrase` callers state the consequence. **Exact text**, used for both branches through one template, at `:10913`: `` `${leftPhrase(accountName(fromId), fromBalance)}, so ${fmt(amount)} can't be moved out of it` `` For example: "Needs is already at -₮5,000, so ₮10,000 can't be moved out of it" and "Needs has only ₮20,000 left, so ₮25,000 can't be moved out of it". It still goes through `refuseField('trAmount', …)`, and nothing else changes. |
| UI-04 | The new Salary account card has no heading | This card is new in v29, and every other card on the screen opens with an `<h3>`. WORK-15 already ruled the same "control reads as part of something else" defect on Accounts. **Exact heading:** `<h3>Where the net pay goes</h3>`, as the first child of `#sAcctWrap`, in the existing card style. Do not move or restructure the block. A user with no accounts still sees no change, because the whole card stays hidden. |
| CODE-03 | Two Sprint 2 probes leave the ruled property unguarded in part | The WORK-17 scope was amended because of one risk, a duplicate financial record after a quota failure, and the guard covers one of six handlers. This is harness only. **Shape:** loop the existing quota block over the `forms` table the stale block already uses, and assert that the amount field is empty in each one. Add `said('Add a category first', …)` and `said('Add an income type first', …)` beside the two WORK-18 `marked` calls. |

**Conditions of approval (probes).** Each must be shown failing on the pre-fix code, or, for harness-only items, against a stated mutation:
- **UI-02:** the WORK-16 flow in `accounts.js` (`:763-802`) asserts, for all ten sheets, that the sentence appears in an open alert dialog titled "Not saved", not in a toast. It goes red on current `main`.
- **CODE-01:** add two cases to the same flow.
  - **Recurring:** open Log for a recurring plan, then advance `recLastDone` through a simulated other-window write, so the storage listener replaces `db`. Then Save. Assert that `db.actual.length` is unchanged, that `recLastDone` equals the value the other window wrote, and that the dialog shows the CODE-01 sentence.
  - **One-off:** the same steps, where the other window's write leaves `nextPlannedDue` `null`. Assert that nothing is written and the same sentence is shown.
  - Both cases go red on current `main`: the first because a duplicate is written, the second because the sheet closes silently.
- **UI-01 / CODE-02:** in `resetFlow` (`accounts.js:1612-1627`):
  - set the display currency to a non-MNT code with a cached rate, then Reset;
  - assert `displayCurrency === 'MNT'`, `#displayCurrency.value === 'MNT'`, and that `#sNetConv` is hidden;
  - assert that the `display-currency` key is still absent from storage after the renders, which guards against the `setDisplayCurrency` trap.
  - It goes red on current `main`.
- **UI-03:** the WORK-12 probe (`accounts.js:805-820`) asserts the full sentence for both the negative and the positive branch.
- **UI-04:** one assertion that `#sAcctWrap > h3` reads "Where the net pay goes" when an account exists.
- **CODE-03:** in one handler other than `incAdd`, temporarily change the `stillHeld(...)` gate to `if (ok)` and show the quota loop going red, then revert. Record that in the commit message.
- **All:** `npm test` green after each commit.

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| UI-01, "reset `convFromCurr`/`convToCurr`" part | Reset the converter pair in memory | It removes no risk. `openConverter` reads the pair from storage on every open (`:10028-10031`), and storage is already cleared. The in-memory pair is never shown after Reset. |
| UI-01 / CODE-02, `setDisplayCurrency('MNT')` variant (not proposed; recorded so it is not reached for) | Use the existing setter to apply the default | It writes the key back through `rememberUiPref`, which undoes the removal WORK-11 ruled. The loader-plus-sync shape gives the same screen without the write. |
| CODE-02, "keep the literal with a corrected comment" option (from the implementer's note) | Avoid the 17th lint warning by keeping `'display-currency'` | It keeps two spellings of one storage key, held together only by a probe, to avoid a warning that the project's own lint configuration classifies as safe. The ruling named the constant. |
| Reset by page reload (not proposed; recorded so it is not re-raised) | `location.reload()` after Reset to rebuild all in-memory state | It loses the "Reset complete" confirmation. In a tab without an installed service worker it can fail offline, which is not acceptable for an offline-first app. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| UI-01, "re-apply the default filter preset" part | Period filters keep their old preset in the session after Reset | Storage is already clean, so the next launch is correct. In the session, the old preset filters an empty store and misstates no figure. Bringing the DOM back to defaults would need a second restore entry point in `initPeriodFilter` for no visible harm. **Settled by** any of these: a reviewer showing a figure the stale in-session preset misstates; Reset gaining a path that leaves records behind; or a member being added to the filter state that changes a figure rather than a view. Then add one `resetToDefault` to `periodPresetRefreshers`' sibling list, called from Reset. |
| CODE-04 | The Salary split's amount getter repaints the Salary screen | **Carry to Sprint 3, its own commit, after WORK-10 step 1.** The shape is known and approved: a pure `computeSalary()` that returns the rounded object, the existing paint calling it, and `INCOME_FORM_AMOUNT.s` pointing at the pure part, with no behaviour change. It is not done now because behaviour is correct today, and a refactor of the salary paint is the wrong thing to add to a pending deploy. **It moves forward** if any change before then edits `calcSalary` or the shared split code. It then lands first, in its own commit. |

## Conflict Rulings

No Engineering Manager roadmap was produced for this review, so no conflicts were recorded. These are the questions the reviewers sent up, and the overlaps between the reports:

- **UI-01 and CODE-02 are the same issue.** Both describe in-memory state outliving WORK-11's storage removal. They are ruled as one item, in one commit. CODE-02's narrower shape (the display currency) is the approved scope. UI-01's converter part is rejected as moot, and its filter part is deferred.
- **CODE-02, literal vs constant:** use `DISPLAY_CURRENCY_KEY`. The lint count goes from 16 to 17, which is accepted for the reason above. The implementer's note is correct that the literal was chosen for lint and not for runtime. The code reviewer is correct that the comment's stated reason was false.
- **UI-02 and CODE-01 share one outlet.** `editTargetGone(msg)` becomes the single "sheet closes, nothing was saved" path, shown in a dialog. CODE-01 uses it with its own sentence.
- **CODE-01 sentence (exact):** `This plan was logged or changed in another window. Nothing was saved.` Declare it as a constant beside `EDIT_TARGET_GONE_MSG`. "Logged or changed" is deliberate. The occurrence also moves if another window edits the plan's schedule, and the sentence must be true in both cases. The code review's draft, "already logged", would be false in the second case.
- **UI-03 text (exact):** `${leftPhrase(name, balance)}, so ${fmt(amount)} can't be moved out of it`
- **UI-04 heading (exact):** `Where the net pay goes`
- **Items the reviewers noted but did not raise** (the WORK-14 helper's emoji-only bell; "This entry" in goal, debt and account sheets; the emergency-fund scan cost): these are not findings, and they stay closed. The first two are ruled wording. The third sits under WORK-22's measurement, and only that measurement can open it.
- **Code review Future Risks:**
  - WORK-19's carried junk keys stay under the standing Cloud Sync gate (the 1 MiB ruling).
  - On WORK-20 refusing a device's own export, the ruling holds: fix the stored value, never loosen the validator.

## Development Order

1. **UI-02.** XS. It fixes the outlet that CODE-01 reuses. Doing it first means CODE-01's probe asserts the final medium once, and is not written against the toast and then rewritten.
2. **CODE-01.** S, Medium. The financial-data fix. Write the failing probe first, then the `editCtx.due` check and the comment correction.
3. **UI-01 / CODE-02.** XS. The constant, the loader and sync calls, and the extended `resetFlow`.
4. **UI-03.** XS. Copy, with the WORK-12 probe asserting both branches.
5. **UI-04.** XS. Markup only.
6. **CODE-03.** XS, harness only. Last among the fixes, because none of steps 1 to 5 touches the add handlers or `saveEditEntry`. It lands before deploy so that the WORK-17 risk is guarded in every handler that ships.
7. **Cache key:** confirm `sw.js:9` still reads `expense-tracker-v29` and that no v29 build has reached a client. If one has, use v30.
8. **`npm test`** green with all standing gates, then deploy v29.

*Reasoning:* the shared outlet comes before the Medium that depends on it, the Medium before the Lows, and behaviour before copy and markup. Harness-only work comes last because nothing before it changes what it guards. The total is about half a day plus probes.

## Architecture Strategy

- **Stays:**
  - `writeDb` as the single write path, with the cross-window guard.
  - `refuseField`/`refuseEl` as the single refusal marker.
  - `pushIncomeWithSplit` as the one implementation of income with its split.
  - Side-key removal by name in Reset, with no sweep.
  - `refreshForNewDay` as the single "today moved" hook.
  - Every Sprint 2 ruling, unchanged.
- **Changes:**
  - **`editTargetGone(msg)` is the single outlet** for "this sheet closed and nothing was saved", and it is always a dialog.
  - **A sheet that acts on a schedule occurrence carries the occurrence it displayed in `editCtx`**, and at write time it refuses, in words, when the occurrence has moved. This is now a standing rule. It binds every Notifications sheet (a WORK-10 trigger) from the commit that adds it, so the CODE-01 class is not re-created sheet by sheet.
  - **Reset brings in-memory mirrors back through their existing loaders**, never through setters that write. A new side key with an in-memory mirror must name its loader in the Reset handler in the same commit that adds it.
- **Off limits:**
  - Record version fields, or any schema change, to detect "changed underneath". The code review's technical-debt note is answered by the occurrence rule above and by WORK-10's later stages, not by a migration.
  - A localStorage prefix sweep.
  - Reload-on-reset.
  - A declaration reorder sweep to reduce lint warnings.
  - Changing `logPlannedAsActual`'s contract for its other callers.
  - Everything already off limits in `reports/chief-architect.md`.
- **Risks (not findings):**
  - The bell's one-tap Log, the other caller of `logPlannedAsActual`, reads the occurrence at tap time. Neither reviewer examined whether an open bell list re-renders when another window replaces `db`. If it does not, a tap on a stale row could repeat the CODE-01 pattern. Check it when WORK-10's later stages reach the bell, or sooner if Notifications work starts.
  - CODE-01's check depends on `nextPlannedDue` being a function of the plan alone. If it ever starts to read the clock, a resume across midnight with the sheet open could refuse a legitimate log. `refreshForNewDay` does not touch open sheets, by ruling, so the stored `due` would then be the wrong comparison.

## Final Recommendation

Next, change `editTargetGone()` to show its sentence in an `alertDialog` titled "Not saved" (UI-02), and update the ten-sheet WORK-16 probe to assert the dialog. Then write the two failing CODE-01 cases, recurring and one-off, and land the `editCtx.due` check behind them. Work down the Development Order from there. v29 deploys only after step 8 is green.
