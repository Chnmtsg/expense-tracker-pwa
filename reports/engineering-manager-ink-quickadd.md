# Engineering Manager: the Ink quick-add sheet (1a·02)

Sources: `D:\3_Claude\PowerApps\reports\ui-review-ink-quickadd.md` (UI-01 to UI-18, score 62) and `D:\3_Claude\PowerApps\reports\code-review-ink-quickadd.md` (CODE-01 to CODE-15, score 64). I read both in full. All 33 findings are traced below. I did not change any severity. Where two reviewers gave the same problem different severities, the Severity column shows both, with their sources, and I set priority from the higher one.

## Project Health

The proposal can't be built as drawn. UI Review scored it 62 and Code Review 64, which puts both in the "usable but fragile" band. Between them they found one Critical issue (income split, CODE-01) and nine distinct High problems. The shipped keypad is safe today only because it writes nothing. The sheet would write money records directly, and the money rules it needs live inside three form click handlers that it can't call. Nothing here calls for a redesign. Once the three writers are pulled out of their handlers and about a dozen spec corrections are ruled, the build can go ahead in safe steps.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | Pull out `recordActualExpense`, `recordIncome(entry, split)` and `recordDebtPayment` so they take values instead of reading the DOM, and route them through `commitWrite` with a snapshot before the first await. The handlers become callers. No behaviour change. | CODE-02 | High | P1 | M | none |
| WORK-02 | An income save from the sheet must not skip the account split, and must not apply a split the user never saw | CODE-01, UI-07 | Critical (CODE-01) / High (UI-07) | P0 | S | WORK-01, ruling on C1 |
| WORK-03 | No category, type or debt chip is selected when the sheet opens. Save with no chip writes nothing and refuses on the chip row. | UI-03, CODE-04 | High | P1 | S | WORK-01, WORK-20 |
| WORK-04 | Date always opens on today and is resolved with `todayISO()` at save time. Only the account defaults to last used. | UI-04, CODE-08 | High (UI-04) / Medium (CODE-08) | P1 | XS | WORK-01 |
| WORK-05 | The sheet's keydown handler ignores text-field targets, and `openModal` must not focus a Note input on open (including at cold start) | UI-05, CODE-05 | High | P1 | S | none |
| WORK-06 | Income mode shows the "Borrowed money is not income" correction and a link to Debts | UI-06, CODE-03 | High | P1 | S | WORK-15 (layout slot), ruling on C3 |
| WORK-07 | Debt payment mode: never opens `#editModal` (it paints under the sheet). Writes through `recordDebtPayment`. Chips list live debts only, in `debtsByUrgency` order. Shows the still-owed line and the Home double-count statement. Carries over the borrow-date floor and the `d.date` default. Has an empty state. Writes only to `db.debtPayments`. | CODE-06, UI-08 | High (CODE-06) / Medium (UI-08) | P1 | M | WORK-01, WORK-09, WORK-15, ruling on C4 |
| WORK-08 | The sheet fits at 390x844, 360x640 and 320x568 with no sideways scroll. Add a height option to run.mjs and assert that Save and the bottom keys are in view. | UI-01, CODE-09 (fit and harness) | High (UI-01) / Medium (CODE-09) | P1 | M | WORK-10, owner decision on key height |
| WORK-09 | Sheet state: `openQuickEntry` resets every field and opens on Expense. Changing mode keeps the amount and clears the chip. A prefill applies only to an empty amount and the first digit replaces it. | UI-09, CODE-12 | Medium | P1 (blocks WORK-07) | S | none |
| WORK-10 | Segments, chips and meta chips get a hit area of at least 44px. Keys stay 64px with `--t-display` digits. Extend the 44px sweep in quick-entry.js. | UI-02, CODE-09 (size clause) | High (UI-02) / Medium (CODE-09) | P1 | S | none |
| WORK-11 | The shortfall dialog is called with `offerMove: false`, and each refusal focuses the sheet's own control, with the forms' exact wording | UI-12, CODE-07 | Medium | P2 | S | WORK-01 |
| WORK-12 | SMS paste is out of scope for this build. Correct the request's false premise that paste-a-loan exists. | UI-10, CODE-10 | Medium | P2 | XS | none |
| WORK-13 | Keep `#quickClose` (44px, labelled). The grabber is decoration only. A backdrop tap doesn't dismiss once anything has been entered. | UI-11 | Medium | P2 | XS | none |
| WORK-14 | Save closes the sheet. The toast names the record through `savedToast`. Fix the "· showing {period}" suffix, which refers to a screen the user can't see. | UI-13, CODE-15 | Medium (UI-13) / Low (CODE-15) | P2 | XS | WORK-01, ruling on C5 |
| WORK-15 | Note interaction: the chip becomes an inline field and the keypad hides while it has focus. Remove the duplicate note line under the amount. | UI-14 | Medium | P1 (frees the slot WORK-06 and WORK-07 need, and part of WORK-08's fit) | S | WORK-05 |
| WORK-16 | Ink tokens only (colours, `--r-*` radii, `--s*` spacing). Add each new foreground/background pair to check-contrast.mjs for all 17 themes. | UI-15, CODE-09 (radius clause) | Medium | P2 | S | none |
| WORK-17 | Assistive tech: `aria-pressed` on segments and chips, an accessible dialog name, the + button renamed to match, and From / Into / Paid from on the account chip | UI-16 | Medium | P2 | S | none |
| WORK-18 | Restate the harness's hand-off assertions in quick-entry.js, navigation.js, signin.js and the run.mjs prelude, using the replacement invariants both reports list. Keep the `#quickSheet`, `#quickKeys [data-qk]` and `#quickBtn` ids. | UI-17, CODE-11 | Medium | P1 (gates every P0/P1 behaviour commit) | M | lands in the same commit as each behaviour change |
| WORK-19 | Rewrite the comments and names that state the old "writes nothing / never Save" rule, citing the 2026-10-20 reversal | CODE-14 (plus the WORK-01 comment clause of UI-17) | Low | P3 | XS | WORK-02 (decides whether `quickEntryTo` survives), WORK-17 (rename) |
| WORK-20 | "Recent use" means push order scanned from the end, skips deleted categories, is frozen while the sheet is open, and needs no new storage key. "All…" is a native `<select>` filled by `categoryOptions()`. Add an empty state. | UI-18, CODE-13 | Low | P1 (blocks WORK-03: without "All…" the chip row can't reach every category) | S | none |

## Quick Wins

These are XS or S effort and remove Medium-or-higher severity. Do them first within their priority band.

- P0: WORK-02 (S), once C1 is ruled.
- P1: WORK-04 (XS), WORK-05 (S), WORK-03 (S), WORK-06 (S), WORK-10 (S), WORK-09 (S), WORK-15 (S).
- P2: WORK-12 (XS), WORK-13 (XS), WORK-14 (XS), WORK-11 (S), WORK-16 (S), WORK-17 (S).

WORK-12 is a scope exclusion plus a one-row correction to the request. It costs minutes and keeps a false premise out of the build ruling.

## Sprint Plan

**Sprint 1: WORK-12, WORK-01, WORK-05.**

- Total effort: one M, one S and one XS, about 2.5 to 3 days.
- What it delivers:
  - The request is corrected, so the ruling doesn't inherit the paste-a-loan premise.
  - The three money writers are pulled out of `expAdd`, `incAdd` and `saveEditDebtPayment`. Each extraction is its own commit, with v1-write-flows, debts and accounts green and no behaviour change.
  - The keypad's keydown handler ignores text-field targets. This is harmless on today's keypad and required before any Note field exists.
- What users see: nothing. The sprint removes the structural blocker (CODE-02) that every write-related item depends on.
- To run in parallel, outside engineering capacity:
  - The Chief Architect rules on C1 to C6.
  - The owner decides whether keys may drop below 64px on short screens (UI-01, CODE-09).

Sprint 2 can't start its fit work or its Income and Debt work without those rulings.

## Roadmap

- **Sprint 1:** WORK-12, WORK-01, WORK-05
- **Sprint 2:** WORK-10, WORK-08, WORK-09, WORK-20, WORK-03, WORK-04, WORK-11, WORK-13, WORK-18 (Expense-mode invariants)
- **Sprint 3:** WORK-15, WORK-02, WORK-06, WORK-07, WORK-14, WORK-16, WORK-17, WORK-18 (Income and Debt invariants), WORK-19
- **Later:** none. Every item is scheduled within three sprints.

## Dependencies

- **WORK-01 comes before WORK-02, WORK-03, WORK-04, WORK-07, WORK-11 and WORK-14.**
  - Each of these needs a writer that takes values, returns the save outcome, accepts `offerMove`, resolves the date at save time and goes through `commitWrite`.
  - Building the sheet's save before the extraction would create the duplicate write paths CODE-02 warns about.
- **WORK-10 comes before WORK-08.** Fit can only be measured at compliant sizes. The owner's key-height decision also comes before WORK-08, because it decides whether 320x568 can fit at all.
- **WORK-05 comes before WORK-15.** A Note field must not exist in the sheet until digits typed into it can't reach the amount.
- **WORK-15 comes before WORK-06 and WORK-07.** Both reports put the mode-specific lines (the "is not income" correction, "₮X still owed") in the slot that removing the duplicate note line frees. WORK-08's fit budget also assumes that line is gone.
- **WORK-09 comes before WORK-07.** The debt prefill must apply only to an empty amount, and a mode change must clear the chip, or a typed amount gets overwritten (UI-09, CODE-06).
- **WORK-20 comes before WORK-03.** The chip row needs a defined order and an "All…" path before "no default chip, refuse without one" can be built and probed.
- **WORK-18 has no slot of its own.** Each assertion is restated in the commit that changes the behaviour it covers. Deleting probes to turn the gate green is ruled out by both reports.
- **WORK-19 rides with the same commits.** It waits on C1 (whether `quickEntryTo` survives as a split fallback) and on WORK-17 (the rename happens once, there).
- **Rulings come before builds:**
  - C1 before WORK-02
  - C3 before WORK-06
  - C4 before WORK-07
  - C5 before WORK-14
  - C6 and the owner's key decision before WORK-08

## Conflicts

For the Chief Architect. I have not resolved any of these.

**C1: How Income mode handles a split account (WORK-02).**
- UI-07: the sheet saves directly. When the chosen account has shares, it shows one outcome line above Save ("₮20,000 to Savings · ₮80,000 stays in Main") using the form's own calculation. Editing individual rows stays on the full form, reached from that line. UI's answer 7 retires `quickEntryTo`.
- CODE-01: the sheet must not save when `splitPlan` is non-empty. It falls back to `quickEntryTo('income')` with a one-line reason, and the form's split rows stay the only place a split is confirmed. No hidden `q` prefix. CODE-14 keeps `quickEntryTo` for exactly this purpose.
- Severity also differs: Critical (CODE-01) against High (UI-07).

**C2: Severity differences on merged items.**
- WORK-04: High (UI-04) against Medium (CODE-08).
- WORK-07: High (CODE-06) against Medium (UI-08).
- WORK-08 and WORK-10: High (UI-01, UI-02) against Medium (CODE-09).
- WORK-14: Medium (UI-13) against Low (CODE-15).
- I kept both values and set priority from the higher. None of these changes the priority band except WORK-14, which would stay P2 under either value.

**C3: Wording and destination of the income correction (WORK-06).**
- UI-06: the line reads "Borrowed money is not income. Record a debt →" and opens the Debts add form. It must keep the words "is not income".
- CODE-03: show the sentence itself, visible and unshortened. The link closes the sheet and calls `navigate('debts')`.

**C4: Debt-mode copy and chip filter (WORK-07).**
- UI-08:
  - The Home statement may be "shortened … the meaning kept".
  - Chips show "unsettled debts".
  - With no debts, show "No debts recorded. Add debt →" and disable Save.
- CODE-06:
  - The helper sentence is shown "word for word".
  - Chips show `!debtSettled(d) && debtOutstanding(d) > 0`.
  - CODE-04 keeps Save enabled and refuses when no debt is chosen. CODE doesn't address the empty state where no debts exist.

**C5: The toast suffix when saving over another screen (WORK-14).**
- UI-13: drop the "· showing …" suffix when the target list isn't on screen, but still move the filter.
- CODE-15: keep a suffix that names the screen ("· Money shows Last Month").

**C6: Sheet geometry and who decides key height (WORK-08).** This one is low stakes.
- UI-01:
  - A content-sized bottom sheet with `max-height: 100dvh`. The top band shows only when there's room.
  - Close and segments share one row.
  - The owner decides on keys under 64px.
- CODE-09:
  - A full-height sheet (top 0) below 600px.
  - Keep 64px keys "unless the architect rules otherwise".
- The two layouts are largely compatible. The threshold and the deciding authority differ.

## Estimated Effort

Rough conversion: XS about 0.1 day, S about 0.5 day, M about 1.5 days.

| Band | Items | Effort | Approx. days |
|---|---|---|---|
| P0 | WORK-02 | 1 S | 0.5 |
| P1 | WORK-01, 03, 04, 05, 06, 07, 08, 09, 10, 15, 18, 20 | 4 M, 7 S, 1 XS | about 9.6 |
| P2 | WORK-11, 12, 13, 14, 16, 17 | 3 S, 3 XS | about 1.8 |
| P3 | WORK-19 | 1 XS | 0.1 |
| **Total** | 20 items | | **about 12 days** |

These totals cover only the corrections and safeguards the reviewers raised. Building the sheet's basic UI (markup, chip rendering, mode switching) is not a finding in either report, so it has no `WORK-` item. It needs its own estimate in the build ruling.

## Recommendations

1. **Don't let anyone build the sheet's Save before WORK-01 lands.** Three form-bound handlers are the whole write layer. A sheet that copies them gives us four money paths that will drift. Pulling them out is about two days, needs no behaviour change, and is fully covered by existing gates.
2. **Rule C1 first.** It is the only Critical item, and the two reviewers propose opposite behaviours: show the split and save, or refuse and hand off to the form. Your ruling also decides whether `quickEntryTo` survives.
3. **Write the spec corrections into the build ruling.** No default chip, date always today, SMS paste excluded, 44px and 64px floors, Ink tokens. Each is a one-line rule that both reviewers agree on, and together they remove most of the High findings before any code is written.
4. **Get the owner's call on key height for short screens now.** Neither reviewer will decide it, and WORK-08 can't finish without it.
5. **Keep today's keypad until Sprint 3's gates are green.** Swapping it in early would put a direct-save Income mode without the loan protection, or a Debt mode that paints under the payment sheet, on the screen the app opens to at every cold start.
