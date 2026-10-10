# Review of Sprint 1, and what was done about it

2026-10-10. Scope: WORK-02, 01, 03, 04, 08, 07, 06 on `main` (1be4f80..3b5b47d).
Reports: `ui-review-sprint1.md` (88/100) and `code-review-sprint1.md` (80/100).
Ruling: `chief-architect-sprint1-review.md`. All fix-now items are on the branch
`sprint1-review-fixes`, one commit each, and ship with Sprint 1 as v28.

| ID | Sev | Finding | Outcome |
|---|---|---|---|
| CODE-01 | High | A screen picked from More jumped back to the old scroll position after the sheet's deferred `history.go`. | **Fixed, and measured first.** With `scrollRestoration` on `auto`, More → Settings landed at scrollY 600 after the traversal. The WORK-02 probe had missed it: a `--width` run puts the app in an iframe, and an iframe does not restore scroll. `history.scrollRestoration = 'manual'` is set once, unconditionally as ruled. New gate `npm run navigation` runs at full size; it fails without the line. |
| CODE-02 | Low | The Move hand-off assertion was a hand-built replica. | **Fixed, in `navigation.js`, not `moveReturnFlow`.** The ruling placed it in `moveReturnFlow`, but `accounts.js` runs at `--width 320`, in the iframe where history never restores scroll, so the assertion there could not fail for the reason it exists. The new flow goes through the real limit dialog at full size and asserts `height > 0` and in view. The replica was removed. |
| UI-02 | Med | Expenses ↔ Budget Planning kept the scroll position. | **Fixed.** The two mode-changing entry points scroll to the top when the mode changed. Without the fix: "Budget Planning opened at scrollY 1032". |
| CODE-09 (WORK-03) | Low | The day-change probe covered a sample. | **Fixed.** It now covers `debtDate`, `sDate` and an open sheet's `#mDate`, which must be left alone. It fails if `mDate` is added to `ENTRY_DATE_IDS`. |
| UI-01 / CODE-03 | Med | On the 1st, the Analytics range moved but its calendar did not. | **Fixed as ruled.** The refresher calls `syncCalendarAnchor` only when the range moved. The probe fails both ways: with no sync, and with an unguarded sync, which moves an arrow-picked month under This Year. |
| CODE-04 | Low | The bell badge was not refreshed on a day change. | **Fixed.** `updateBellBadge()` is in `refreshForNewDay`. The probe counts one refresh, and 0 without the fix. |
| CODE-05 | Low | Deleting an older contribution could advance the goal cursor past owed occurrences. | **Fixed as `min(current, computed)`**, and a null cursor stays null. A new `goals.js` flow failed first: "moved the cursor from 2026-09-05 to 2026-10-03". |
| CODE-08 | Low | The goal-delete cascade never ran under test. | **Fixed.** A new flow confirms the delete and asserts Needs rises by exactly the ₮60,000 the sentence names. It fails with the cascade removed. |
| UI-03 | Low | A half-filled schedule marked the filled Instalment field. | **Fixed.** It marks the first empty part. Before the fix: "mSchedFirstDue is not marked". |
| UI-06 | Low | The WORK-07 helper was three clauses, and the bell was named only by an emoji. | **Fixed with the ruled sentence**, and the emoji is `aria-hidden`. |
| CODE-06 | Low | The `stepDate` comment sat above the wrong function, and two comments stated counts. | **Fixed.** The helper moved unchanged below `stepDate`. The counts are replaced by `ENTRY_DATE_IDS`. |
| UI-04 | Low | Edit-sheet refusal wording differs from the add form. | **Carried to Sprint 2**, after WORK-18, with the add form's messages verbatim. |
| UI-05 / CODE-07 | Low | Settings rename refusals are toast only. | **Carried to Sprint 2**, after WORK-18, as `refuseEl(el, msg)` with `refuseField` delegating to it. |
| UI-07 | Low | A single contribution delete does not say the money returns. | **Carried to Sprint 2** as an XS item, with the ruled sentence. |
| CODE-09 (WORK-06) | Low | The WORK-06 probe covers three of eight sites. | **Carried to Sprint 2** with WORK-18. |

`npm test` exits 0 after each commit. It now runs ten probes: the original eight plus `goals` and `navigation`. Lint holds at 16 warnings.
