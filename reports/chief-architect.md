# Chief Architect: Final Engineering Decision

**Inputs.** I read all three reports in full, unmodified:
- `D:\3_Claude\PowerApps\reports\ui-review.md`: UI-01 to UI-20, score 72
- `D:\3_Claude\PowerApps\reports\code-review.md`: CODE-01 to CODE-15, score 58
- `D:\3_Claude\PowerApps\reports\engineering-manager.md`: WORK-01 to WORK-34, plus three recorded conflicts

I measured them against `knowledge/review-conventions.md` and `knowledge/project.md`.

**Checked at source before ruling** (`D:\3_Claude\PowerApps\expense-pwa\index.html`):
- **CODE-01.** `writeDb` (`:4407-4427`) calls `localStorage.setItem(KEY, JSON.stringify(obj))` with no check. A search for `addEventListener('storage'`, `BroadcastChannel` and `navigator.locks` returns nothing. The finding is true.
- **UI-02 / CODE-03.** The listener array at `:7519` is `['notifEnabled','notifDaysAhead','notifShowPlanned','notifShowGoals','notifShowRecurring']`, and `notifShowDebts` is missing. The finding is true.
- **CODE-02.** `if (months.length > 36) break;` is at `:8421`. The finding is true.
- **UI-05 (Budget Planning part).** `renderExpenses` (`:6953-6960`) lists one row per plan, not one per occurrence. A summed heading would therefore not equal planned spending for the period. This changes my ruling on WORK-08 (see below).
- **The reorder deferral.** The standing deferral of the two reorder implementations, recorded at `reports\archive-code-review-round9.md:164`, has the trigger "a behavioural change to either".

---

## Executive Decision (Executive Report)

**No. Nothing new should be released until WORK-01 is in.** This reverses the "fit for release" verdict of the last ten rounds. Nothing regressed. A defect that has always been there has now been found and confirmed at source.

CODE-01 is silent loss of financial records. With the installed PWA and a browser tab both open, or two desktop tabs, the window with a stale copy overwrites the other window's records. A background tab can do it with no user action, through the 30-minute reminder timer.

That is the one failure this application must never have, and correctness of financial data outranks everything else. It is also small to fix: S effort, in one function, through the single existing write path.

Under it the base is sound in both reports: integer money, versioned and validated storage, measured contrast, and complete modal handling. The three other Highs (UI-01, UI-03, CODE-02) and the High-severity half of WORK-02 are XS or S. They are ordinary defects, not signs of a structural failure, and a restructure is neither needed nor approved this quarter.

The live v23 already carries CODE-01. Pulling it back would gain nothing in an offline-first app whose users have it cached. The fix is to ship WORK-01, on its own, as the next deploy.

---

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Cross-window overwrite guard | Critical: silent loss of financial records, and it blocks release. Fix it through `writeDb` only, as a staleness check before every write plus a `storage` listener that reloads the stale window. **Binding constraints on its shape:** (a) **No change to the stored schema, the export format or the cloud payload.** Detecting staleness by comparing the stored string with the last string this page read or wrote meets this. Any revision counter must stay outside the record body, so that import and cloud validation do not change. (b) **A refused write must tell the user, in words, that their entry was not saved and why.** A refusal that drops the entry quietly is the same defect moved to the other window. (c) **Every path that writes must be covered:** `save`, `saveSoon`/`flushPendingSave`, the interval timer, and cloud apply. (d) **Prove it with a re-runnable harness flow that uses two pages on one profile:** B writes, then A writes, and B's record survives while A is told. |
| WORK-02 | Debt due dates checkbox has no effect | This is the only control for the reminders the owner has complained about, and it reports a state it never applied. Add `'notifShowDebts'` to the listener list. The harness step that toggles the **real control** is part of the item, not optional: the existing test sets the stored value directly, and that is why the defect survived. |
| WORK-03 | Hero verdict says "Over budget"; "Net Balance" labels a period figure | High. The headline sentence of the main screen contradicts the tab beside it. Change the wording only: the figure, the arrows and the positive branch stay as they are. Search the harness for the old strings before changing them. |
| WORK-04 | Monthly Trend drops the newest months beyond 37 | High, and it shows wrong financial history under a label claiming completeness. Clamp the start of the range to end minus 36 months, and change the label so it says the chart shows the latest 36. Add a harness case with more than 37 months: the existing probe seeds exactly 36, which is why this was missed. |
| WORK-05 | Swiping Settings lists reorders instead of scrolling | High. Normal scrolling silently changes user data and shifts category colours. Move the drag to a grip handle. Put `touch-action: none` and `pointerdown` on the handle only, and reword the hint. |
| WORK-06 | Goal editor changes the record before validating | A cancelled edit gets persisted to a financial target. Validate into local variables, then assign, as the debt branch already does. |
| WORK-07 | Reset understates what it deletes; theme not re-applied | The dialog lets a user think their debts and goals survive an irreversible erase. **Scope:** list everything erased, or say "every record in this app", and add the one-sentence prompt to export a backup first. Keep the two-step confirmation. Call `applyTheme` after `load()`. Both changes are in the same handler and serve the same purpose, making Reset's outcome match what the user was told, so they are one item. **No export button inside the dialog.** |
| WORK-08 (Income and Actual only) | List headings show a count, never a total | This answers the question these screens are opened for, using figures already on screen. For Income and Actual, the sum of the listed rows is the true period total. **The Budget Planning part is deferred** (see Deferred). |
| WORK-09 | ↑ means good on one pane and bad on another | The colour-blind fallback contradicts itself. Remove the arrows from the Budget pane's verdicts only. |
| WORK-10 | Calendar tap does not scroll to day detail | The chart's fix, not yet applied to the calendar. One call to `scrollIntoView` when a day opens. |
| WORK-11 | Mocking copy on goal cards | CLD1 makes the overdue rotation permanent, so the sarcasm is a lasting state. Delete the sarcastic strings and keep the encouraging ones. |
| WORK-12 | Advisor states made-up statistics as fact | Puts the main screen's guidance under C36's honesty rule. Rewrite or remove the outside figures only, and leave the rules and their triggers alone. |
| WORK-13 | Salary grid has no narrow fallback | The helpers break the stylesheet's own rule and the figures break mid-number. Swap to the existing `.form-row` and move the two helpers. **Measure at 320 and 360 before and after**, because these figures are derived, not measured. |
| WORK-14 | Add-form errors are toast-only | Medium and seen in normal use. It reuses Salary's existing field-marking pattern and needs no new component. |
| WORK-15 | Goals add form always above the list | Reuses the Debts disclosure pattern for the same "one add, many glances" problem. Open when there are no goals, closed otherwise. |
| WORK-18a (`#editModalSave` only) | Split the seven-kind save handler into a dispatch table | CODE-04 was hidden in this handler, and CODE-15 sits in the same handler. A pure restructure **after** WORK-06 and WORK-20, keeping validate-then-assign in every branch. This is a refactor, not a rewrite. **`renderDebts` is split off and deferred** (see Deferred), because it is a separate change in a separate function. |
| WORK-20 | Contribution saved against a deleted goal | It leaves an orphaned money record that still counts in the Data Summary. Use the same find-then-close guard as the debt payment branch. |
| WORK-21 | `load()` claims a full check but checks only `categories` | Closes a boot-crash class and makes the comment true. **Ruled shape:** any collection that is not an array goes down the **existing quarantine** path. Do **not** coerce it to `[]`: coercing, then saving once, destroys the only copy of whatever was there. |
| WORK-22 | Service worker refresh does not await the cache write | Offline-first correctness of every deploy, for one `return`. |
| WORK-23 | Stored values reach `innerHTML` unescaped | Four XS wraps in `escapeHTML`. This is defence in depth in a finance app with a cloud write path coming. It is not speculative, because the CSP cannot back it up. |
| WORK-25 | Bell count not announced | An accessibility defect fixed in one line of `updateBellBadge`. |
| WORK-26 | Developer-facing Firebase sentence in Settings | Delete the sentence. It tells the target user the app is unfinished. Leave Storage Status alone. |
| WORK-27 | Planned amounts shown in "money spent" red | The same colour means two different things one tab apart. Render planned amounts in `--text` in Planned mode. |
| WORK-28 | Category colours repeat after twelve | **A known-limit note only**, of one or two lines, by name and not by line number. No palette or chart work. |
| WORK-29 | Comments with line coordinates; misplaced doc block | These are wrong today, by thousands of lines, and they break the coding standard. **Scope:** the listed coordinates and the `debtAnnualCostRate` doc block only. No general sweep of comments. |
| WORK-30 | Duplicated drag-to-reorder logic | The standing deferral's trigger, "a behavioural change to either", is fired by WORK-05. Unify into `initReorder` as a **pure refactor in its own commit, straight after WORK-05**, verified by the same harness flow. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-32 | Two date controls on one form | Consistency only, and both controls work (UI-17 says so itself). As a scheduled item it would be preference work. The existing rule already covers it: pick one control per form when that form is next edited for another reason. No WORK item is needed to carry that rule. |
| WORK-33 | Font sizes off the declared scale | Nothing fails for the user. The standing reading, that a block is opened by the declarations a commit edits, already converts these on edit, and a sweep is off limits. A scheduled item would turn that rule into a sweep. |
| WORK-34 | Emoji still used as button icons | Visual inconsistency only. The file's own icon rule already says "unconverted, not exempt", so they convert when the lines are edited. A standalone item adds no protection the rule does not give. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-08 (Budget Planning part) | Planned total in the Budget Planning heading | **Risk, stated as a risk:** the Planned list shows one row per *plan*, so summing those rows understates any period that holds recurring occurrences. UI-05's "sum of the rows already shown" would put a wrong financial figure on screen. **It is settled when** the heading's figure comes from the same occurrence-expanding derivation that Planned vs Actual uses for planned totals, and a harness case shows the two figures agree over the same range, including a weekly plan in a monthly view. With that shown, it ships as an XS follow-up. |
| WORK-16 | Narrow list-row text column | Every pixel figure in it is derived. **It is settled by** capturing one recurring planned row with a seven-figure amount at 320 and 390. If the description column is under about 120px at 390, approve the single wrap declaration. If not, close it. The measurement may be taken now, and the change waits for the number. |
| WORK-17 | Analytics rescans collections per day/month | The cost is real in principle, and the perf harness deliberately deferred it. No user-visible stall has been measured. **It is settled by** the perf harness at 10,000 transactions under phone-class CPU throttling. If one Analytics chip or day tap takes over about 100 ms, approve the shared bucketing helper. It must keep WORK-04's end-of-range clamp, and the case with more than 37 months must be re-run. |
| WORK-18b (`renderDebts` split) | Split the 550-line `renderDebts` | A different function and a different change from WORK-18a. A Debts visual-refresh design request is open (commit `56c09d5`) and will reshape this function. Splitting it now means doing it twice. **It is settled by** that request being ruled and built. The split then goes in as a pure refactor straight after. |
| WORK-19 | Store object owning all mutations | Real, and staged, but the right moment has not come. **Trigger:** work starting on Reports or Notifications, or on any new write path, or turning on Cloud Sync as a write path. Step 1 must wrap WORK-01's guarded `writeDb`, not replace it. One screen at a time, in the same file. A rewrite is not authorised. |
| WORK-24 | Old Firebase SDK from a CDN with no integrity check | Inert while `firebaseConfig` is empty. **Hard gate:** it must land in, or before, the commit that fills in `firebaseConfig`, with a current pinned version plus `integrity` and `crossorigin`, or served from the same origin. No exceptions. |
| WORK-31 | External `app.js` so the CSP can drop `'unsafe-inline'` | A real security gain, but it moves 8,800 lines and changes the service-worker shell. **Trigger:** WORK-19 step 1 has landed, or any write path is added that puts stored strings into `innerHTML` without going through the validator. WORK-22 must already be in. |

---

## Conflict Rulings

**Severity rule.** Under `review-conventions.md`, only the reviewer who raised a finding sets its severity, so I change neither reviewer's number. What I set is the **severity of record for the WORK item**. **A merged item is scheduled at the highest severity among its sources.** A merge must never make a defect less urgent than its worst-placed observer found it.

**1. UI-02 (High) against CODE-03 (Medium): the same defect.**
- **Ruling:** WORK-02 is carried at **High, priority P1.**
- **Why:** both reviewers are right about different things. Code Review describes the mechanism, and for the mechanism alone "a workaround exists" holds. UI Review describes what happens to the user. This is the only switch for the one reminder type that reaches the phone's notification tray every month, on the owner's stated complaint, and it reports a state it never applied. That fits the definition of High: a core module is significantly harder to use, and users hit it in normal use.
- **Correction of record:** `reports\chief-architect-clearing-the-bell.md:45` says "the save handler writes all five". That premise was **false at source**: the handler is never called for this box. I do not edit that report. The ruling there, that nothing is added to the Settings screen, **still stands**, because it depended on the control existing, and WORK-02 makes the control work. Until WORK-02 lands, that ruling's assurance to the owner is not true, and the owner should be told so in plain words.

**2. UI-10 (Medium) against CODE-12 (Low): overlapping findings.**
- **Ruling:** WORK-07 is carried at **Medium, priority P2, Sprint 1**, under the same highest-severity rule.
- **Why:** a destructive, irreversible action whose confirmation lets the user conclude that debts and goals survive is a real quality problem, not polish. Merging them is upheld: both parts are in one handler and serve one purpose. The export-first addition is a sentence of copy, not a control.

**3. UI-03 against CODE-11: whether to merge the reorder implementations.**
- **Ruling:** the standing deferral **has ended**. Its own trigger, "a behavioural change to either", fires on WORK-05, which changes the behaviour of both.
- **Both reviewers are honoured, in sequence:**
  1. WORK-05 goes first as its own commit. It applies the identical handle change to both copies, so the High fix does not wait behind a refactor. This follows UI Review's "do not merge them".
  2. WORK-30 follows straight after, in the same sprint, as a pure refactor commit with no behaviour change, verified by the same harness flow. This follows Code Review's unification.
- **Not moved to Later.** Leaving two copies after the one change most likely to make them drift is the exact risk the deferral's trigger was written to catch.
- **Out of scope for both:** the keyboard-reorder item (WORK-85) stays deferred and is not touched.

**On the Engineering Manager's other recommendations:**
- **Recommendation 2 (evidence for every fix).** Upheld and made binding. Every Sprint 1 item lands with `npm run verify` and `npm run v1` green, and WORK-01, WORK-02, WORK-04 and WORK-05 each add a harness flow that drives the real behaviour.
- **Recommendation 5 (Technical Debt not converted into work).** Upheld: without a finding there is no WORK item. One of those debts, Firestore's 1 MiB single-document limit, is stated here **as a risk**. Last-write-wins on one document, plus a hard size ceiling, means Cloud Sync cannot be turned on safely as currently shaped. Turning it on therefore needs, besides WORK-01 and WORK-24, a Code Review finding and a ruling on that limit.
- **Suggestion that WORK-03 and WORK-09 share one commit.** Overruled. They are unrelated defects that happen to sit on one card. Make two commits. They may ship in the same deploy.

---

## Development Order (Implementation Priority)

**Step 0: isolate the working tree.** The uncommitted cloud-sync and debt changes in `expense-pwa\index.html` and `expense-pwa\README.md` go first:
- Verify them with `npm run verify` and `npm run v1`.
- Commit them as their own commit or commits, separated by concern.

This step is not a WORK item. It exists so that WORK-01's diff can be reviewed and reverted on its own. Nothing in that tree turns sync on (`firebaseConfig` stays empty).

**Deploy A: the release blocker, alone**
1. **WORK-01.** It is the only Critical, and every later write depends on a guarded `writeDb`. It ships as soon as its two-window harness flow passes, with a cache-key bump, before anything else is merged. One change per deploy makes any regression traceable.

**Sprint 1: the Highs, then the cheap Mediums (Deploy B)**

2. **WORK-02.** High. XS, plus the harness step through the real control. It also restores the truth of a prior ruling.
3. **WORK-04.** High, and a wrong financial history. XS, plus the case with more than 37 months.
4. **WORK-03.** High, on the main screen's headline. Copy only.
5. **WORK-05.** High. S.
6. **WORK-30.** Straight after WORK-05, as a pure refactor. The trigger has fired.
7. **WORK-06**, then 8. **WORK-20.** Money-record integrity inside `#editModalSave`. Both must land before WORK-18a.
9. **WORK-07.** Destructive-action honesty.
10. **WORK-08**, Income and Actual only.
11. **WORK-09**, 12. **WORK-10**, 13. **WORK-11**, 14. **WORK-12**, 15. **WORK-13** (measure before and after). These are independent XS items, ordered by how much traffic each screen gets.

**Sprint 2: defence and form quality**

16. **WORK-21** (quarantine, not coerce), 17. **WORK-22**, 18. **WORK-23**. Data and offline safety go first in the sprint.
19. **WORK-14**, 20. **WORK-15**. The two S-effort user-facing Mediums.
21. **WORK-25**, 22. **WORK-26**, 23. **WORK-27**. XS Lows.

**Sprint 3: structure**

24. **WORK-18a.** Only after WORK-06 and WORK-20, so the restructure carries no hidden bugs.
25. **WORK-29**, 26. **WORK-28.** Comment corrections, which are safest once the code they describe has stopped moving.

**Reasoning for the order:** data loss first, then wrong figures and broken controls (the Highs), then cheap honesty and usability fixes, then defensive hardening, then structure. Every refactor follows the bug fixes inside the code it moves, never the other way round. **Effort:** Deploy A plus Sprint 1 is roughly 2.2 engineering days at the top of each band. The rest of the sprint is for verification.

---

## Architecture Strategy

**What stays:**
- A single-file, offline-first, mobile-first PWA.
- localStorage as the source of truth.
- Integer tugrik money, and dates built only from local components.
- The versioned schema with migrations that are only ever added to.
- Quarantine of unreadable data, and import validated record by record.
- **`writeDb` as the single write path.** WORK-01 makes it stronger, it does not add a second one.
- The modal system, the token-driven themes, and every standing Debts ruling.

**What changes this quarter:**
- `writeDb` gains a staleness guard and a cross-window reload (WORK-01).
- `#editModalSave` becomes a dispatch table (WORK-18a).
- The two reorder state machines become one (WORK-30).
- `load()` enforces the shape of every collection (WORK-21).
- All of these are refactors inside the existing file. None is a rewrite.

**Gated, not refused:**
- **Cloud Sync stays off.** `firebaseConfig` stays empty until three things are true:
  1. WORK-01 has landed.
  2. WORK-24 has landed.
  3. The 1 MiB single-document risk has been raised as a finding and ruled.
- The store object (WORK-19) and the external script (WORK-31) begin only on their triggers.

**Off limits:**
- Any rewrite.
- Frameworks, build steps or state libraries.
- A second store, IndexedDB, or a sync engine before the gate above.
- Changing the stored schema to deliver WORK-01.
- App-wide sweeps of spacing, fonts, emoji or comments.
- Reopening ruled Debts decisions.
- Any figure on screen that is not computed by the derivation that already owns it. The deferred Budget Planning total is the live example.

---

## Final Recommendation (Recommended Next Action)

First, commit the current working tree on its own, as Step 0. Then build **WORK-01**: a staleness guard inside `writeDb`, plus a `storage` listener that reloads a stale window. It changes no stored schema and no export or cloud format. A refused write tells the user in plain words that their entry was not saved. The fix is proved by a re-runnable two-page harness flow in which window B's record survives a later write from window A. When `npm run verify` and `npm run v1` are green, ship it on its own as the next deploy with a cache-key bump. Only then should Sprint 1 start, beginning with WORK-02.
