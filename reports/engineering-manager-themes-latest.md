## Project Health

The UI review scores this round 76/100 and the code review scores it 80/100. Neither report has a Critical finding, so nothing blocks release on the severity rules alone. There is one High finding (UI-01): the debt detail asks the user for a repayment date while the same screen shows the final instalment date. It sits in the v38 Debts work, so v38 should not be published until it is fixed, along with the v38-only "since this update" copy (UI-05). Quick add v35–v37 is already live and works in all 16 themes, with Medium polish outstanding. The bigger, lasting risk is that state colours (chip fill, schedule dots, progress versus danger) are never measured and only the default theme is ever rendered by a probe, so theme regressions are caught only by reading screenshots.

## Priority Matrix

| Item ID | Title | Source IDs | Severity | Priority | Effort | Depends On |
|---|---|---|---|---|---|---|
| WORK-01 | The debt detail asks for a repayment date while showing the final instalment date. The prompt names the wrong field (due date instead of borrowed date). | UI-01 | High | P1 | S | — |
| WORK-02 | Debt detail hierarchy: the balance figure is smaller than its "still owed" caption, and the figure-less prompt is the largest text | UI-04 | Medium | P2 | XS | WORK-01 |
| WORK-03 | Overdue or part-paid schedule row: the amount actually due sits in 11px uppercase while the full instalment is the large figure | UI-03 | Medium | P2 | S | — |
| WORK-04 | Debts hero: about 75 words of helper text push the list below the fold. It says "since this update" (release-note language) and "the figure above" (unclear which of three) | UI-05 | Medium | P2 | S | — |
| WORK-05 | The debt detail bar uses `.goal-bar` (unmeasured pair, below 3:1 in flamingo and kingfisher, a different colour from the list bar). Move it to `.debt-summary-bar` | CODE-01 | Medium | P2 | XS | — |
| WORK-06 | Progress colour (`--primary-text`) is red or crimson in flamingo and rose, the same as cost and overdue | CODE-03, UI-02 (flamingo and rose part) | Medium | P2 | S | WORK-05; Conflict C1 |
| WORK-07 | Overdue, Next and Later schedule dots are all hollow and differ only by hue, which nearly matches in rose, flamingo, nord and owl | CODE-02, UI-02 (nord part) | Medium | P2 | XS | WORK-13, WORK-06; Conflict C2 |
| WORK-08 | Quick add Expense/Income active segment is shown by a fill at about 1.1:1 | UI-06 | Medium | P2 | XS | — |
| WORK-09 | After Save, the toast says only "Expense added", with no amount or category | UI-07 | Medium | P2 | XS | — |
| WORK-10 | The selected quick add chip's fill against the sheet is below 3:1 in flamingo and kingfisher, with no non-colour cue and no measured pair | CODE-04 | Medium | P2 | S | Conflict C5 |
| WORK-11 | No probe renders a non-default theme. Add theme-loop flows to `quick-entry.js` and `debts.js` | CODE-05 | Medium | P2 | M | WORK-05, WORK-07, WORK-10 (soft) |
| WORK-12 | Guard against status colours sitting too close in hue (primary-text vs danger-text, warning-text vs danger-text). Includes the mild sepia, gold and owl Paid/Next case | UI-02 (tool part, and sepia/gold/owl) | Medium | P2 | M | WORK-06, WORK-07; Conflict C4 |
| WORK-13 | Schedule state colour depends on CSS source order (`next overdue`), and the rules set properties that do nothing | CODE-07 | Low | P3 (pulled into Sprint 1 as a dependency) | XS | — |
| WORK-14 | Outlined chip boundary is about 1.4–2.0:1 against the sheet and unmeasured, faint in dark themes | UI-08, CODE-06 | Low | P3 | S | Conflict C3 |
| WORK-15 | `.chip` and `.segmented button` don't inherit the body font, so the account chip renders in a different face | UI-09 | Low | P3 | XS | — |
| WORK-16 | Unguarded `.chip:hover` sticks on touch and looks like a selected state | CODE-10 | Low | P3 | XS | — |
| WORK-17 | The loan row's pencil icon opens the debt instead of editing | UI-10 | Low | P3 | XS | — |
| WORK-18 | The Debts row breaks the date at its hyphen and writes "overdue 5d" | UI-11 | Low | P3 | XS | — |
| WORK-19 | Ring and bar track barely visible against the card in oled, gold, dark and midnight | UI-12 | Low | P3 | XS | WORK-05 |
| WORK-20 | Mint and forest render the Still owed hero and the quick add amount in near-success green | UI-13 | Low | P3 | S | — |
| WORK-21 | Off-scale literals, a duplicated selector and duplicated bar geometry in the new Debts CSS | CODE-08 | Low | P3 | XS | WORK-05 |
| WORK-22 | `THEMES.dark.accent` has drifted from the CSS block. Optionally add a guard in `check-contrast.mjs` | CODE-09 | Low | P3 | XS | — |
| WORK-23 | Debts comments carry unenforced counts and a contrast claim that is too broad (line 1875) | CODE-11 | Low | P3 | XS | WORK-06, WORK-07 |

UI-02 covers several separate problems, so it is split across WORK-06, WORK-07 and WORK-12. Its Medium severity is unchanged in each.

## Quick Wins

These remove Medium or higher severity at XS or S effort, in order within their band:

- **P1:** WORK-01 (S). Removes the only High.
- **P2, XS:** WORK-05, WORK-07 (with WORK-13), WORK-02, WORK-08, WORK-09.
- **P2, S:** WORK-03, WORK-04, WORK-06, WORK-10.

## Sprint Plan

**Sprint 1: the v38 publish gate, plus two quick add quick wins.**

- Items: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-13, WORK-07, WORK-08, WORK-09.
- Total effort: 4 S + 6 XS, roughly 2 to 3 days including the re-run.
- The re-run means regenerating the 16 theme sheets and `npm test` (the seven standing gates).
- WORK-06 and WORK-07 cannot start until the Chief Architect rules on Conflicts C1 and C2. If that ruling is late, they drop out and v38 waits for them; nothing else is added in their place.

**What the sprint delivers:**

- The debt detail shows a cost figure, or a prompt that matches what is on screen.
- The detail leads with what is still owed and what is due now.
- The Debts hero no longer carries release-note copy.
- Repayment progress is one measured colour across the list and the detail, and is not red in flamingo or rose.
- An overdue instalment has its own dot shape.
- Quick add shows its mode clearly and says what each Save recorded.

**Must land before v38 is published:** WORK-01, WORK-04, WORK-02, WORK-03, WORK-05, WORK-06, WORK-07 and WORK-13. They are all v38 Debts surfaces, and WORK-04's "since this update" wording only makes sense if it never ships.

- WORK-18 (XS) is optional before v38 if there is room.
- WORK-08 and WORK-09 are quick add (v35–v37, already live). They do not gate v38 and should ship as their own change.

## Roadmap

- **Sprint 1:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-13, WORK-07, WORK-08, WORK-09
- **Sprint 2:** WORK-10, WORK-11, WORK-12, WORK-19, WORK-21, WORK-23
- **Sprint 3:** WORK-14, WORK-15, WORK-16, WORK-17, WORK-18, WORK-22
- **Later:** WORK-20

## Dependencies

- **WORK-01 before WORK-02.** Both edit the `.debt-rate.ask` line. Settle the prompt's condition and wording first, then size it.
- **WORK-05 before WORK-06, WORK-19 and WORK-21.**
  - Once the detail bar uses `.debt-summary-bar`, it becomes one of the five `--primary-text` consumers. WORK-06 then recolours list and detail together instead of leaving the detail on `--primary`.
  - WORK-19 (track visibility) and WORK-21 (duplicated bar geometry) both act on that one component.
- **WORK-13 before WORK-07.** Filling the overdue dot edits the same rules (index.html 1897–1899). Make the overdue selector explicit first, so the new fill does not depend on source order.
- **WORK-06 before WORK-07.** CODE-02 itself says the two go together: once Overdue is filled, Paid and Overdue are both filled dots and would be the same red in flamingo unless the progress colour has moved.
- **WORK-06 and WORK-07 before WORK-12.** A hue-proximity guard added first would fail at once on flamingo, rose and nord.
- **WORK-05, WORK-07 and WORK-10 before WORK-11 (soft).** The theme-loop assertions should target the final properties: the detail bar component, the overdue dot's fill, and the pressed chip's cue.
- **WORK-06 and WORK-07 before WORK-23.** The comment at index.html 1875 should describe the code as it ends up.

## Conflicts

**C1: how to stop progress reading as danger in flamingo and rose (WORK-06)**
- UI-02 recommends changing tokens only: give flamingo's `--primary-text` a coral or rose-brown hue that is clearly not red. Its recommendation names flamingo and nord, not rose.
- CODE-03 recommends a new `--progress` token (defaulting to `var(--primary-text)`), overridden only in flamingo and rose, with the five consumers pointed at it and its pairs added to `check-contrast.mjs`. The reason is that `--primary-text` also serves as brand foreground and link colour.
- The disagreement is whether to retune a token that does several jobs or to split it, and whether rose is in scope.

**C2: the remedy for nord's indistinct schedule states (WORK-07)**
- UI-02 recommends a more saturated nord `--danger-text`, from Nord's `#BF616A` family, still passing 4.5:1.
- CODE-02 recommends a shape change (fill the overdue dot) and "not a new token", applied in every theme.
- UI-02 also measures Next against Later at 1.03:1 in nord, which the shape fix alone does not separate.

**C3: strengthening the chip outline (WORK-14)**
- UI-08 recommends `--text-3`, or a new `--chip-outline` token measured at 3:1 on `--surface`, added to `check-contrast.mjs`.
- CODE-06 recommends recording the decision in the comment at index.html 2236. If the outline is strengthened, it should use the already-measured `--text-2` at 1px, not a new token.

**C4: where the "status colours must differ" guard lives (WORK-11, WORK-12)**
- UI-02 recommends adding a hue-proximity check (roughly 30°) to `check-contrast.mjs`.
- CODE-05 and the code review's Technical Debt section put difference checks in the harness probes and keep "ratios in `check-contrast.mjs`". They describe the pair table as unable, by design, to express "these two state colours must differ".

**C5: whether the selected quick add chip is clear in every theme (WORK-10)**
- The UI review's Strengths says the selected chip "reads clearly in all 16 themes", on the basis that text on the fill is at least 4.5:1.
- CODE-04 measures the fill against the sheet at about 2.8:1 (flamingo) and 2.7:1 (kingfisher). It says the label colour barely changes in those themes, so the fill is the only cue, which fails WCAG 1.4.11. CODE-04 stays Medium.

## Estimated Effort

| Band | Items | Sizes | Rough total |
|---|---|---|---|
| P0 | none | — | 0 |
| P1 | 1 | 1 S | about half a day |
| P2 | 11 | 5 XS, 4 S, 2 M | about 5 to 6 days (the two M items are most of it) |
| P3 | 11 | 9 XS, 2 S | about 1.5 days |
| **Total** | **23** | **14 XS, 7 S, 2 M** | **about 7 to 8 days** |

These totals do not include regenerating the 16 theme sheets and re-running `npm test` after each sprint.

## Recommendations

1. Hold v38 until Sprint 1's Debts items land. WORK-01 is the only High and makes the module's main figure look broken. WORK-04's "since this update" copy must never ship.
2. Rule on C1 and C2 first. They are the only things that can delay Sprint 1, and both affect whether `--primary-text` keeps doing several jobs.
3. Rule on C4 before Sprint 2. Both reports agree on the root cause: state colours are unmeasured and only the default theme is rendered. Until a theme-aware guard exists (WORK-11 and/or WORK-12), every future state (Notifications, Savings Planner, a 17th theme) will repeat these findings.
4. Rule on C5 explicitly. The two reviewers disagree on whether a published quick add control fails 1.4.11.

The two source reports are saved unmodified at `D:/3_Claude/PowerApps-live/reports/ui-review-themes-latest.md` and `D:/3_Claude/PowerApps-live/reports/code-review-themes-latest.md`. This report is meant to be saved as `D:/3_Claude/PowerApps-live/reports/engineering-manager-themes-latest.md`; I have not written it.
