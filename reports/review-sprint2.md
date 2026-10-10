# Review of Sprint 2, and what was done about it

2026-10-10. Scope: WORK-05, 18, 19, 20, 17, 16, 11, 12, 14, 23, 09 and the
carried Sprint 1 review items UI-04, UI-05/CODE-07, CODE-09 (WORK-06 part)
and UI-07, on `main` (5764a05..52d3267).
Reports: `ui-review-sprint2.md` (92/100) and `code-review-sprint2.md` (88/100).
Ruling: `chief-architect-sprint2-review.md` (no for v29 as staged; yes once
the fix-now set lands). All fix-now items are on the branch
`sprint2-review-fixes`, one commit each, and ship with Sprint 2 as v29.

| ID | Sev | Finding | Outcome |
|---|---|---|---|
| UI-02 | Low | "Nothing was saved" was a fading toast while the sibling stale outcome is a dialog. | **Fixed as ruled.** `editTargetGone(msg = EDIT_TARGET_GONE_MSG)` closes the sheet and shows `alertDialog(msg, { title: 'Not saved' })`; all ten sheets change through it. The WORK-16 flow asserts an open "Not saved" dialog for every sheet, and closes any dialog an earlier flow left open first, so a leftover cannot pass for it. Without the fix: 'income edit said "(no dialog)" (toast: ...)'. |
| CODE-01 | Med | The log sheet logged whatever occurrence was due at Save time: a duplicate expense and a vanished reminder when another window logged first; a silent close for a one-off. | **Fixed as ruled.** `editCtx` carries the displayed `due`; after the last await, `nextPlannedDue(p) !== editCtx.due` closes through `editTargetGone(LOG_TARGET_MOVED_MSG)`: "This plan was logged or changed in another window. Nothing was saved." The false comment is replaced. Probe (recurring and one-off, through a real StorageEvent): without the fix "recurring: logged again, 2 expenses; recurring: moved recLastDone to 2026-10-17; ... one-off: said "(no dialog)"". **Process note:** the first commit (c461a0f) went in with `npm test` red: the new flow ran synchronously and pushed the page past Chrome's ~50 history entries, breaking two later Back-counting flows. The app change was not the cause (the old probe passed against it). Fixed in 042f757 by running the flow async; no history rewritten. **Risk now live:** `nextPlannedDue` already floors at `todayISO()`, so the ruling's second Risk is present today: a sheet left open past midnight on an occurrence that has passed is refused with this sentence. Nothing wrong is written, but the sentence names another window when the cause was the clock. Recorded in the code comment. |
| UI-01 / CODE-02 | Low | After Reset the old display currency stayed applied for the session. | **Fixed as ruled.** `DISPLAY_CURRENCY_KEY` replaces the literal; `loadDisplayCurrency(); syncDisplayCurrencyControl(); renderSalaryConvReading();` follow the removals. Without the fix: "the session still applies display currency USD"; with `setDisplayCurrency('MNT')` instead: "Reset left settings behind: display-currency". Lint 16 → 17, accepted in the ruling. Converter pair: no change (rejected as moot). Filter presets: deferred with a trigger. |
| UI-03 | Low | The negative-account move refusal stated a balance, not a refusal. | **Fixed with the ruled template**, both branches: "Cash is already at -₮5,000, so ₮1,000 can't be moved out of it". |
| UI-04 | Low | The new Salary account card had no heading. | **Fixed.** `<h3>Where the net pay goes</h3>`. Without it: "the account card heading is missing". |
| CODE-03 | Low | WORK-17's quota branch was probed in one form of six; WORK-18's message was not asserted. | **Fixed, harness only.** The quota block loops over all six forms. Ruled mutation `goalAdd` → `if (ok)` fails "goalAdd/goalName"; a changed WORK-18 message fails naming it. |
| CODE-04 | Low | The Salary split's amount getter repaints the screen. | **Carried to Sprint 3** as ruled, its own commit after WORK-10 step 1 (sooner if anything edits `calcSalary` or the shared split code). |

`npm test` exits 0 after each commit except c461a0f (see CODE-01). Lint is
at 17 warnings, the one added being the accepted `DISPLAY_CURRENCY_KEY`
reference. `sw.js` reads `expense-tracker-v29`; the live site read v28, so
no v29 build has reached a client and the key stays v29.
