# Engineering Manager — Work Plan

**Inputs:** `D:\3_Claude\PowerApps\reports\ui-review.md` (UI-01 to UI-20, score 72) and `D:\3_Claude\PowerApps\reports\code-review.md` (CODE-01 to CODE-15, score 58). Both reports were present, complete and read in full.

**Accounting:** The two reports contain 35 findings, and this plan turns them into 34 `WORK-` items.
- 2 merges absorb 4 findings: UI-02 with CODE-03, and UI-10 with CODE-12.
- 1 finding is split in two: CODE-10 becomes WORK-23 (escaping) and WORK-31 (external script), because its own effort line gives two sizes.
- No finding was dropped, and no item was added without a source.

The `WORK-` numbers start again at 01 for this run. They are not the same as WORK numbers from earlier rounds, such as the deferred WORK-85 that UI Review mentions.

---

## Project Health

The app is not ready to release.
- **Critical (CODE-01):** with two windows or tabs open, one silently overwrites the other's financial records. A background tab can do this on its own through the reminder timer.
- **High findings:** four more problems sit in core modules:
  - the Home headline says "Over budget" about something that is not the budget
  - the debt-reminder switch does nothing
  - on a phone, scrolling Settings reorders categories
  - the Monthly Trend drops the newest months for histories longer than three years

The base underneath is sound on both sides: integer money, versioned and validated storage, measured contrast, and complete modal handling. Both scores (UI 72, Code 58) are held down by a small number of defects. Every Critical and High fix is XS or S, about one and a half days at the top of the estimates.

---

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | A second window or tab silently overwrites records saved by the other (revision-checked writes plus a `storage` listener) | CODE-01 | Critical | P0 | S | — |
| WORK-02 | The "Debt due dates" reminder checkbox is never saved and has no effect (add `notifShowDebts` to the listener list, plus a harness step that toggles the real control) | UI-02, CODE-03 | High (UI-02) / Medium (CODE-03), see Conflicts | P1 | XS | — |
| WORK-03 | The hero card's verdict says "Over budget" about something that is not the budget, and "Net Balance" presents a period figure as a balance | UI-01 | High | P1 | XS | — |
| WORK-04 | The Monthly Trend drops the newest months for ranges longer than 37 months while still labelled "All time" | CODE-02 | High | P1 | XS | — |
| WORK-05 | On a phone, swiping over Categories or Income Types reorders the list instead of scrolling (move the drag to a grip handle) | UI-03 | High | P1 | S | — |
| WORK-06 | The goal editor changes the record before validating, so a cancelled edit is saved by the next write | CODE-04 | Medium | P2 | XS | — |
| WORK-07 | The Reset confirmation lists less than it deletes (debts, goals, plans, settings) and offers no export first; Reset also does not re-apply the theme | UI-10, CODE-12 | Medium (UI-10) / Low (CODE-12), see Conflicts | P2 | XS | — |
| WORK-08 | Income, Expenses and Budget Planning show how many entries there are, never their total | UI-05 | Medium | P2 | XS | — |
| WORK-09 | On the same Dashboard card, ↑ means "good" on one pane and "bad" on another | UI-08 | Medium | P2 | XS | — |
| WORK-10 | Tapping a calendar day does not bring the day detail into view | UI-09 | Medium | P2 | XS | — |
| WORK-11 | Goal cards carry mocking copy, permanently on overdue goals | UI-12 | Medium | P2 | XS | — |
| WORK-12 | The Financial Advisor states made-up statistics as facts | UI-13 | Medium | P2 | XS | — |
| WORK-13 | The Salary Calculator's two-column grid has no narrow-width fallback; helpers and figures are squeezed | UI-06 | Medium | P2 | XS | — |
| WORK-14 | Errors on the four main add forms are a toast only; the field is neither marked nor focused | UI-04 | Medium | P2 | S | — |
| WORK-15 | The Savings Goals add form always sits above the goal list | UI-11 | Medium | P2 | S | — |
| WORK-16 | On narrow screens the list-row text column is very narrow, worst on Budget Planning (measure first) | UI-07 | Medium | P2 | S | — |
| WORK-17 | Analytics and the Monthly Trend rescan whole collections once per day or month, on every tap | CODE-05 | Medium | P2 | S | WORK-04 |
| WORK-18 | Two functions far exceed "keep functions small" (`#editModalSave`, about 380 lines; `renderDebts`, about 550 lines) | CODE-07 | Medium | P2 | M | WORK-06, WORK-20 |
| WORK-19 | One 12,000-line document with global mutable state; UI handlers change storage directly (staged store object) | CODE-06 | Medium | P2 | L | WORK-01 |
| WORK-20 | A goal contribution can be saved against a goal deleted while the sheet was open | CODE-15 | Low | P3 | XS | — |
| WORK-21 | `load()` is commented as "TOTAL" but only checks the shape of `categories` | CODE-09 | Low | P3 | XS | — |
| WORK-22 | The service worker's background refresh does not wait for the cache write | CODE-13 | Low | P3 | XS | — |
| WORK-23 | Stored values reach `innerHTML` unescaped (wrap in `escapeHTML`) | CODE-10 (escaping part) | Low | P3 | XS | — |
| WORK-24 | The Firebase SDK is pinned to an old version and loaded from a CDN with no integrity check | CODE-14 | Low | P3 | XS | — |
| WORK-25 | The bell's reminder count is not announced to screen readers | UI-15 | Low | P3 | XS | — |
| WORK-26 | Settings shows developer-facing text to end users (the Firebase sentence) | UI-16 | Low | P3 | XS | — |
| WORK-27 | Planned amounts are shown in the "money spent" red | UI-20 | Low | P3 | XS | — |
| WORK-28 | Category colours repeat after twelve and are the only key to the stacked daily chart (record as a known limit) | UI-14 | Low | P3 | XS | WORK-05 (context only) |
| WORK-29 | Comments use line coordinates and unenforced counts, several already wrong; a doc block is misplaced | CODE-08 | Low | P3 | S | — |
| WORK-30 | The drag-to-reorder logic is copied for categories and income types | CODE-11 | Low | P3 | S | WORK-05 |
| WORK-31 | Move the inline script to an external `app.js` so the CSP can drop `'unsafe-inline'` | CODE-10 (external-script part) | Low | P3 | S | WORK-22 |
| WORK-32 | The same form uses two different date controls (opportunistic) | UI-17 | Low | P3 | S | — |
| WORK-33 | Font sizes off the declared scale on high-traffic text (opportunistic) | UI-18 | Low | P3 | XS | — |
| WORK-34 | Emoji still used as button icons, against the file's own icon rule (opportunistic) | UI-19 | Low | P3 | XS | — |

---

## Quick Wins

These are XS or S items that remove Medium or higher severity. Inside each priority band, do them first.

- **P0:** WORK-01 (S). The release blocker is itself small.
- **P1:** WORK-02 (XS), WORK-03 (XS), WORK-04 (XS), WORK-05 (S).
- **P2, XS:** WORK-06, WORK-07, WORK-08, WORK-09, WORK-10, WORK-11, WORK-12, WORK-13.
- **P2, S:** WORK-14, WORK-15, WORK-16, WORK-17.

Low-cost P3 items are not quick wins under this definition and stay in P3.

---

## Sprint Plan

**Sprint 1 items:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09, WORK-10, WORK-11, WORK-12, WORK-13.

**Total effort:** 1 S + 1 S + 11 XS. At the top of each band that is about 13.5 hours, or roughly 1.7 engineering days. The rest of the sprint is left for verification on purpose: the harness step WORK-02 requires, the narrow-width measurement for WORK-13, `npm run verify` and `npm run v1`, and the deploy.

**What the sprint delivers:**
- **The release blocker is closed.** A stale window can no longer overwrite another window's records (WORK-01).
- **All four High findings are closed:**
  - the debt-reminder switch works and is tested through the real control (WORK-02)
  - the Home headline stops contradicting the Budget tab (WORK-03)
  - the Monthly Trend shows the latest months (WORK-04)
  - Settings scrolls normally on a phone (WORK-05)
- **Eight XS Medium fixes ship as well:**
  - cancelled goal edits are no longer saved (WORK-06)
  - Reset says what it destroys (WORK-07)
  - list screens show their totals (WORK-08)
  - Dashboard arrows are consistent (WORK-09)
  - a calendar tap scrolls to the day detail (WORK-10)
  - goal and advisor copy is honest and respectful (WORK-11, WORK-12)
  - the Salary grid works at narrow widths (WORK-13)

WORK-03 and WORK-09 both change copy on the Dashboard card, so they should go out in one commit.

---

## Roadmap

- **Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09, WORK-10, WORK-11, WORK-12, WORK-13
- **Sprint 2:** WORK-14, WORK-15, WORK-16, WORK-17, WORK-20, WORK-21, WORK-22, WORK-23, WORK-24
- **Sprint 3:** WORK-18, WORK-25, WORK-26, WORK-27, WORK-28, WORK-29, WORK-30
- **Later:**
  - WORK-19, staged one screen at a time. Its trigger is the start of the Reports or Notifications module, or any new write path.
  - WORK-31, alongside or after step 1 of WORK-19.
  - WORK-32, WORK-33 and WORK-34, done only when those lines are next edited for another reason, as both reviewers recommend.

---

## Dependencies

- **WORK-01 before WORK-19.** The store object in WORK-19 will own `save()`. It should wrap the revision-checked `writeDb`, not be built first and patched later.
- **WORK-01 and WORK-24 before Cloud Sync is turned on.** CODE-01 warns that the lost-update problem moves from tabs to devices once sync runs. CODE-14 warns that the CDN SDK would run unverified against financial data. The working tree already holds uncommitted cloud-sync changes, so this gate matters now.
- **WORK-04 before WORK-17.** The Code reviewer bundles these. WORK-04 is an XS fix that should not wait for the S refactor, but the date-bucketing helper in WORK-17 must keep the end-of-range clamp. Verify the 37-plus-month case again after WORK-17.
- **WORK-06 and WORK-20 before WORK-18.** Both are XS fixes inside `#editModalSave`. Fixing them first makes WORK-18 a pure restructure that must keep validate-then-assign in every branch, rather than a restructure carrying hidden bugs.
- **WORK-05 before WORK-30.** UI Review says the grip-handle fix should not be merged with the deferred merge of the two reorder implementations. The handle fix therefore goes into both copies first. WORK-30 then unifies them with the handle behaviour already in place.
- **WORK-05 and WORK-28 (context, not blocking).** Accidental reorders shift category colours. Once WORK-05 lands, WORK-28 is only the known-limit note.
- **WORK-22 before WORK-31.** Both change `sw.js`. Correct the cache-write chain first, then add `app.js` to the cached shell.
- **Measure before you fix:**
  - WORK-13: measure the tile figures at 320 and 360 with `run.mjs --width`, before and after the change.
  - WORK-16: capture one recurring planned row with a seven-figure amount at 320 and 390 before changing anything. UI Review marks its pixel figures as derived, not measured.

---

## Conflicts

These go to the Chief Architect. I have not resolved them.

1. **UI-02 and CODE-03: same defect, different severity.**
   - **UI Review says High.** This checkbox is the only control for the debt reminders the owner has already complained about. They are the only reminders that reach the phone's notification tray every month, and a switch that looks like it worked but did not is "worse than having no switch at all."
   - **Code Review says Medium.** The preference is not saved and the bell keeps showing debts, a real defect with a workaround.
   - I scheduled WORK-02 as P1. The severity of record is the Architect's call.
2. **UI-10 and CODE-12: overlapping defect, different severity.**
   - **UI Review says Medium.** The Reset dialog understates what it erases, so a user may conclude that debts and goals survive, and they are lost with nothing to restore. It also asks for an export prompt.
   - **Code Review says Low.** The prompt omits goals and debts. It adds that the theme is not re-applied after Reset.
   - I merged them into WORK-07 at P2.
3. **UI-03 and CODE-11: a scope disagreement, not a factual one.**
   - **UI Review** says the grip-handle fix "should not be merged with" the deferred merge of the two reorder implementations.
   - **Code Review** recommends unifying the two implementations into `initReorder`.
   - I kept them as separate items and ordered them WORK-05 then WORK-30. The Architect should confirm whether the earlier deferral of the merge still stands, which would hold WORK-30 at Later.

---

## Estimated Effort

These are the top of each band: XS 0.5 h, S 4 h, M 2 d, L 5 d, with an 8-hour day.

| Priority | Items | Composition | Estimate |
|---|---|---|---|
| P0 | 1 | 1 S | 0.5 d |
| P1 | 4 | 3 XS, 1 S | 0.7 d |
| P2 | 14 | 8 XS, 4 S, 1 M, 1 L | 9.5 d (2.5 d without WORK-18 and WORK-19) |
| P3 | 15 | 11 XS, 4 S | 2.7 d |
| **Total** | **34** | | **about 13.4 d** |

Removing the release blocker and every High takes about 1.2 days. Nearly half of the total effort is WORK-19 alone.

---

## Recommendations

1. **Ship WORK-01 before anything else, and gate Cloud Sync on WORK-01 plus WORK-24.** It is the only Critical, it is S, and it goes through the single existing write path.
2. **The whole of Sprint 1 is small, so hold it to evidence.** Each fix needs a re-runnable check, not a comment. WORK-02 in particular must be tested through the real checkbox. The current harness sets the stored value directly, which is why the defect survived.
3. **Correct the record behind WORK-02.** UI-02 shows that the premise at `reports\chief-architect-clearing-the-bell.md:45` ("the save handler writes all five") is false at source. That ruling should be revisited, and conflicts 1 and 2 need a severity of record.
4. **Treat WORK-19 as staged work with a trigger, not a rewrite.** Schedule it before Reports or Notifications begin, not before.
5. **Note the Code reviewer's Technical Debt section, which I have not turned into work.** It is not filed as findings and so carries no `WORK-` IDs:
   - Firestore's 1 MiB single-document limit for cloud sync
   - the `recLastDone` high-water mark for planned series
   - the hard-wired currency
   - the 5,000-step `plannedOccurrences` guard

   If any of these should become work, it needs a finding first.
