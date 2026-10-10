# UI Review: Sprint 4 (5ec2dfe..27d3291)

## Executive Summary

Every Sprint 4 item matches its ruling, and I found no regression on any screen the user sees. The Salary screen now computes every total from the rounded figures it shows, so on screen and in the stored row the parts add to gross, SI plus WHT equals deductions, and gross minus deductions equals net. The Income and Expenses rows still Edit and Delete exactly as before, now through one delegated listener per list. The biggest problem is that the cost that triggered WORK-22 is still there after delegation, and no deferral row with a trigger carries it. A user with a large history on All Time still waits about 210-270 ms per add on a desktop, which is roughly 1.3-1.6 s at the assumed 6x phone slowdown. That is a gap in the record, not a defect in what shipped. The second finding is that HANDOFF still says nothing on `main` is undeployed, while v30 is staged.

## Overall Score

**91 / 100.** There are no Critical or High findings, so the score sits in the 90-100 band. It stays near the bottom of the band because of one Medium, a user-facing cost that is now nobody's open item, and one Low, a stale deploy record.

## Strengths

- **The Salary arithmetic follows the ruled shape exactly** (`expense-pwa/index.html:6807-6822`). Each part is rounded, gross is the sum of the rounded parts, SI and WHT are each rounded from that whole gross, deductions = SI + WHT, and net = gross - deductions.
  - `calcSalary` (`:6826-6844`) only paints that object.
  - The ≈ conversion reads the same whole-tugrik net.
  - The comment states the rule the code now enforces and names the pre-Sprint 4 behaviour.
  - Nothing migrates old records, as ruled.
- **The income written by a Salary save is the stored net** (`:6924`), and its note quotes the same gross, SI and WHT that the summary card shows. The probe (`tools/harness/accounts.js:656-694`) asserts all three identities on screen and in `db.salaries` for both the UI-05 inputs and the CODE-04 inputs.
- **Delegation behaves the same as the old per-row listeners** (`index.html:7030-7054`, `:7625-7640`).
  - Edit is checked before Delete.
  - The confirm and shortfall dialogs are unchanged: "Delete Income" with its split-moves sentence and "Delete anyway (…)", and "Delete Expense" with its recurring-series sentence.
  - The write and re-render order is unchanged.
  - The rows' markup and accessible names (WORK-13) are untouched.
  - Keyboard activation (Enter or Space on a button fires `click`, which bubbles) still works.
  - The empty-state "Show all time" button still goes through its own document-level `data-show-all` handler, and the new list handlers ignore it because they return early when `closest()` finds no edit or delete button.
- **WORK-210(b) reports and does not assert, as pre-ruled.** `run.mjs:167` adds `wall_clock_ms` beside `in_frame_ms_total`. The HANDOFF re-take records both figures for every run.

## Findings

**UI-01: The All Time list cost that fired WORK-22 is unchanged after delegation, and no deferral row carries it**

- Severity: Medium
- Location: Income and Expenses screens on the All Time filter. `reports/HANDOFF.md:150-168`. Also surfaces in the code comment at `expense-pwa/index.html:7023-7029`.
- Evidence:
  - HANDOFF records the re-take before delegation: Income All Time 209-219 ms, Expenses 225-244 ms.
  - After delegation: Income 205-212 ms, Expenses 239-273 ms, "No measurable change: the All Time cost is building 10,000 rows of HTML, not binding their listeners."
  - The trigger was 100 ms at 6x, about 17 ms unthrottled. The figures are still about 12-16 times over it.
  - HANDOFF ends with "anything more (pagination, virtualisation) needs its own round", but that sentence is not a deferral row with a trigger. WORK-22's own deferral is used up now that delegation has landed.
  - The code comment at `:7023-7029` says the per-row listeners are why "All Time took over 200 ms per add". The figures recorded after delegation contradict that. A later reader would take the cost as fixed.
- Impact: A heavy user who switches to All Time (one tap, no training needed, and the configuration the ruling says the trigger is read against) waits roughly 1.3-1.6 s after each add, edit or delete at the assumed 6x phone slowdown. The cost grows linearly with history, so it is already noticeable well below 10,000 rows. With no row and no trigger, nothing will bring it back to a round.
- Recommendation: Do not build anything in this sprint. Record a deferral row for the All Time render cost. It carries the post-delegation figures and a trigger, for example the next sprint that touches either list's render, or an All Time figure above a stated bound, so the architect's "own round" has something to rule on. In the same commit, correct the comment at `:7023-7029` so it no longer blames the listeners for the 200 ms (keep the "behaviour-identical" sentence). The row cap stays off limits as ruled.
- Effort: XS

**UI-02: HANDOFF still says nothing on `main` is undeployed, while v30 is staged**

- Severity: Low
- Location: `reports/HANDOFF.md:36-38` and `:64-68`. The key is at `expense-pwa/sw.js:9` (`expense-tracker-v30`).
- Evidence:
  - `HANDOFF.md:37-38` reads "Round 19 Sprints 2 and 3 with their review fixes. Nothing on `main` is undeployed."
  - `:65-68` still lists Sprint 4 as "Next".
  - There is no Sprint 4 bullet that lists what landed: UI-05/CODE-04 (with "existing records untouched"), CODE-03, WORK-210(b) and the WORK-22 delegation. There is also no "v30 not yet deployed; v29 live" line of the kind Sprint 3's CODE-09 ruling required.
  - The only Sprint 4 record is the WORK-22 measurement paragraph.
- Impact: The next session reads that nothing is pending and may not deploy. Users would then keep the Salary breakdown that does not add up, which is the money fix this sprint exists for. Nothing fails in the app itself.
- Recommendation: Replace the "Next (Sprint 4…)" line with a Sprint 4 bullet that lists the items and their review reports. Change "Nothing on `main` is undeployed" to state that v30 is staged on `main`, v29 is live, and the live `sw.js` should be checked before deploying. Touch only `HANDOFF.md`.
- Effort: XS

**Review areas**

- **Layout and Hierarchy:** Clean. Sprint 4 changed no markup or order. The Salary summary card still leads with net, then gross, SI, WHT and deductions.
- **Navigation:** Clean. Nothing changed.
- **Typography:** Clean. Nothing changed.
- **Colour and Theme:** Clean. Row amounts keep `.pos` and `.neg` as before.
- **Spacing:** Clean. Nothing changed.
- **Cards:** Clean. Nothing changed.
- **Mobile:** Clean. The row buttons and their size are unchanged. Delegation does not affect touch targets.
- **Accessibility:** Clean. The row buttons keep their record-naming `aria-label`s, and keyboard activation still reaches the delegated handlers.
- **States:** Clean. Both list deletes are still confirmed. The empty and filtered-empty states are unchanged and their escape hatch still works. Salary still refuses net ≤ 0 and negative fields with a named toast.
- **Numbers and Formatting:** Clean. Every Salary figure is now a whole tugrik before `fmt`, so the summary card, the "Where the gross comes from" parts, the stored row and the income note all agree. The Salary History sheet (`index.html:7905-7923`) still shows the stored figures of rows saved before Sprint 4, which may be off by one tugrik. That was ruled ("existing records untouched"), and I am not reopening it.

## Quick Wins

- **UI-01:** One deferral row and one comment correction keep a known user-facing cost in a future round, and stop the code from claiming it was fixed.

## Estimated UX Impact

There are no Critical or High findings to fix. What users get from this sprint once v30 deploys: every Salary calculation they save from then on adds up, on screen, in Salary History and in the income it creates. That removes the "the calculator can't add" doubt from the one payroll tool. Income and Expenses rows behave exactly as before.

Fixing UI-01 changes nothing on screen today. It makes sure the remaining All Time lag on large histories reaches a ruling instead of disappearing from the record. Fixing UI-02 makes sure the Salary fix actually reaches users.

Files:
- `D:\3_Claude\PowerApps\expense-pwa\index.html` (6790-6844, 6891-6948, 7023-7054, 7624-7640, 7905-7923)
- `D:\3_Claude\PowerApps\expense-pwa\sw.js` (9)
- `D:\3_Claude\PowerApps\tools\harness\accounts.js` (656-694)
- `D:\3_Claude\PowerApps\tools\harness\run.mjs` (167)
- `D:\3_Claude\PowerApps\tools\harness\perf.js` (59, 307)
- `D:\3_Claude\PowerApps\reports\HANDOFF.md` (36-38, 64-68, 150-168)
- `D:\3_Claude\PowerApps\reports\chief-architect-sprint3-review.md` (55-72, 87)
