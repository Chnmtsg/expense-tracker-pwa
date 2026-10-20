# Chief Architect Decision: latest upgrades across all 16 themes (quick add v35–v37, Debts 1a·05 / v38)

Inputs, read in full and left unmodified: `D:/3_Claude/PowerApps-live/reports/engineering-manager-themes-latest.md`, `D:/3_Claude/PowerApps-live/reports/ui-review-themes-latest.md`, `D:/3_Claude/PowerApps-live/reports/code-review-themes-latest.md`. I also read the request (`reports/design-request-themes-latest.md`), all 16 sheets in `reports/themes-debts-1a05/`, and the code at `expense-pwa/index.html` lines 1860–1903, 11773–11777, 11918–11935 and 12040–12048. I checked how `check-contrast.mjs` resolves aliases at lines 163–201, and confirmed that themes are applied on `html[data-theme]`, so a `var()` alias declared on `:root` resolves per theme. I changed nothing. This report is meant to be saved as `D:/3_Claude/PowerApps-live/reports/chief-architect-themes-latest.md`.

## Executive Decision

**No: v38 is not fit to publish as built. The live v37 stays fit and stays live.**

Neither review found anything Critical, and no financial figure is computed wrongly. But the debt detail, the screen whose job is to show what borrowing costs, tells a user with a schedule to "Add the date this has to be repaid by" while the same screen shows "Final instalment 2027-07-15". I saw this in all 16 themes (detail-1..4). That is the one High (UI-01), and it makes the module's main figure look broken.

The Debts list hero also carries "since this update" copy, which must never ship. In flamingo and rose, repayment progress is painted in the same red as cost and overdue. That works against the Debts module's purpose in `knowledge/project.md`: showing the difference between paying debt down and paying for borrowing.

Eight small commits, all XS or S, clear v38. Quick add fixes ship separately, because v37 is already live and nothing in it is broken badly enough to hold anything.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Debt detail asks for a repayment date while showing the final instalment | The only High, on the module's main figure. **The fix is in the prompt condition and wording only.** When `d.schedule` exists, never show the due-date prompt. If the schedule rate is null because `sc.firstDue < d.date`, show a prompt that names the borrowed date and links to Edit. If it is null for any other reason (for example, the instalments don't add up to the total), show nothing. Without a schedule, keep today's prompt. `debtEffectiveAnnualRate`, `debtTermDays` and the rate maths must not change in this commit. Add a `debts.js` assertion for each of the three branches. |
| WORK-02 | Detail hierarchy: balance smaller than its caption; ask prompt is the largest text | Two declarations that put the figure above its caption. They also make the existing 1938 comment true on the detail. Lands after WORK-01, which edits the same line. |
| WORK-03 | Overdue or part-paid row: the amount actually due is in the smallest text | Removes a real misreading of money ("how much do I pay?" gets answered ₮170,000 instead of ₮85,000). **Display only:** show the `left` value that is already computed as the row amount, and the full amount in the caption. No new arithmetic. |
| WORK-04 | Debts hero copy: "since this update", "the figure above", about 75 words above the fold | "Since this update" goes stale the day v38 ships. Ruling on shape: drop the clause from the hero entirely (`debtSpendingLineHTML` already gates the older-payments distinction on `older`), name the figure ("Cost so far is…"), and put the explanation behind the existing `.more-fields` disclosure. The earlier "three sentences" ruling covered length, not placement, so this does not reopen it. |
| WORK-05 | Detail bar uses unmeasured `.goal-bar`; move it to `.debt-summary-bar` | One class swap. It removes an unmeasured pair that is below 3:1 in two themes, and a second colour for one fact. Savings Goals keeps `.goal-bar`. |
| WORK-06 | Progress is red in flamingo and rose | Per C1: one `--progress` token, overridden only in flamingo and rose, with its pairs added to `check-contrast.mjs`. The colour is owner taste; a default is given in C1. |
| WORK-07 | Overdue, Next and Later dots are all hollow and differ only by hue | Per C2: fill the overdue dot in every theme. It is a shape change, needs no new token and works regardless of hue. The comment at line 1875 must be narrowed to "against the surface" in the same commit, because it describes the rule being edited. |
| WORK-08 | Quick add mode segment shown by a 1.1:1 fill | The mode decides spending versus income, and since v36 it repeats across saves. Default: reuse the app's existing `.segmented button.active` treatment (`--surface` plus shadow). No new style. Quick add commit, not a v38 gate. |
| WORK-09 | Toast says only "Expense added" | Makes the stays-open flow verifiable entry by entry. Use the same formatter and value that were saved ("₮12,500 · Groceries added"). Undo is out of scope. |
| WORK-10 | Selected quick chip fill below 3:1 in flamingo and kingfisher | Per C5: add a non-colour cue on the pressed chip. Do **not** add a `primary`-on-`surface` 3.0 row (see Rejected). |
| WORK-11 | No probe renders a non-default theme | Fixes the cause behind CODE-01 to CODE-04. Scope: one theme-loop flow in `quick-entry.js` and one in `debts.js`, asserting differences only: the detail bar uses the summary-bar pair; the pressed chip differs from an unpressed one by more than fill; the overdue dot is filled and Later is not; Paid's colour differs from Overdue's. No ratios in the harness. |
| WORK-12 | Guard against status colours that sit too close | Per C4, **narrowed**: a separate, named "distinct pairs" table in `check-contrast.mjs`, starting with one pair, `--progress` against `--danger-text`. That is the one pair that shares a shape (both filled) and a screen after WORK-07. Use a perceptual distance, not hue alone; hue alone misses nord's pale tints. Set the threshold by measurement: the pre-fix flamingo and rose values must fail and the post-fix values must pass. Record it in the tool header. Add pairs only when a screen pairs two state colours in the same shape. |
| WORK-13 | Schedule state colour depends on source order | It is a dependency of WORK-07 and removes a silent-repaint risk on an overdue instalment. Pulled in before v38. |
| WORK-14 | Outlined chip boundary faint and unmeasured | Per C3, **comment only**: record at line 2236 that the outline is unmeasured by decision, and why. The visual change is deferred to the owner (see Deferred). |
| WORK-15 | `.chip` / `.segmented button` don't inherit the body font | One declaration, and it moves toward the typography standard. It does change every segmented control app-wide, so regenerate the sheets after it. Its own commit. |
| WORK-16 | Unguarded `.chip:hover` sticks on touch | The same guard the keypad already uses, now that the outline is how chips are recognised. |
| WORK-17 | Loan row's pencil opens the debt instead of editing | XS. The same glyph doing two jobs one row apart is a trap. Optional before v38 (the loan row is v38 work). |
| WORK-18 | Debts row breaks the date at its hyphen; "overdue 5d" | XS, and it is the most time-sensitive line on the row. Optional before v38. |
| WORK-21 | Off-scale literals, duplicated selector and bar geometry in the Debts CSS | Cheap, and the duplicated geometry is the drift that produced CODE-01. Only replace a literal with a token where the values are equal, so nothing visible changes. After WORK-05. |
| WORK-22 | `THEMES.dark.accent` has drifted from the CSS block | Correct the swatch and add the `THEMES` against block guard in `check-contrast.mjs` in the same commit. They are one concern: the fix, and the check that stops a 17th theme drifting the same way. |
| WORK-23 | Debts comments carry unenforced counts and an over-broad contrast claim | Required by the coding standards. The line 1875 sentence moves into WORK-07's commit. This item keeps the 1800–1813 rewrite without counts. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-10 (part) | Add `{ fg: 'primary', bg: 'surface', min: 3.0 }` to the contrast table | It would fail at once in flamingo and kingfisher. That either turns the `npm run verify` release gate red or forces a retune of `--primary`, which CODE-04 itself rules out because it is the button fill app-wide. Measure the cue the state actually relies on (see C5), not the one it no longer relies on. |
| WORK-12 (part) | Hue guard for the sepia, gold and owl Paid/Next case | Paid is filled and Next is hollow, so shape already separates them. A guard here would flag a non-problem and push three themes toward retunes nobody asked for. |
| WORK-20 | Neutral Still owed hero and quick amount in mint and forest | Green `--text` is those themes' identity, so this is owner taste, and the words carry the meaning. The fix proposed is a per-theme override on specific components, which would put component rules into theme blocks; the code review credits the current architecture for having none. If the owner wants it, the right change is a global `--text` retune in those two themes, as a separate decision. |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-14 (visual part) | Strengthen the chip outline | The owner's call; the owner chose the v37 outline. **Recommended default: keep `--border-2`.** If the owner says the chips read as keys in the dark themes, use the already measured `--text-2` at 1px (C3). No new token. |
| WORK-19 | Ring and bar track barely visible in oled, gold, dark and midnight | Brightening the track lowers fill against track, which is the pair the gate measures at 3:1. Revisit when a track value exists that keeps fill against track at 3:1 or more **and** is visible against the card in those four themes, both shown in `check-contrast.mjs`. Until then the percentage label carries the meaning. |
| WORK-07 (nord Next vs Later) | Nord's Next and Later dots at 1.03:1 | The overdue fill fixes the overdue case. Next has its word. Revisit if the WORK-11 loop or an owner report shows Next being missed in nord. The remedy would then be a nord `--warning-text` retune (owner taste), not a new shape. |
| C2 (UI-02 nord part) | More saturated nord `--danger-text` | Owner taste. **Recommended default: no retune.** Nord's `--danger-text` colours every expense figure in that theme, and the shape fix already separates overdue. Revisit only if the owner finds Overdue still too quiet in nord on the regenerated detail-3 sheet. |

## Conflict Rulings

**C1: `--progress` token or retune `--primary-text`. Ruling: a new `--progress` token (CODE-03), with rose in scope.**
- `--primary-text` has 19 consumers: brand foreground, links, "Record borrowed money", the nav. Retuning it in flamingo to fix one meaning would change the theme's identity everywhere and leave the coupling in place for the next red or amber accent, a risk the code review names.
- One alias token is the smallest change that removes the risk without that cost. It is `--progress: var(--primary-text)` on `:root`, it changes nothing in 14 themes, it resolves per theme because themes are on `html` (`:root`), and `check-contrast.mjs` already follows aliases (lines 163–201).
- Rose is in scope. 14° of hue apart reads as one family in debts-2 and detail-2.
- **The colour is the owner's taste.** Recommended defaults so the build can proceed:
  - **flamingo:** move `--progress` from red toward a burnt coral or orange-brown, roughly 25° or more of hue away from `--danger-text #AD1C1C`.
  - **rose:** move it from crimson toward plum or magenta, roughly 25° or more away from `--danger-text #B31739`.
  - In both themes take the nearest value in that direction that passes 4.5:1 on `--surface` / `--surface-2` and 3:1 on `--surface-3`, as the tool reports.
  - The owner approves on the regenerated debts-2 and detail-2 sheets before v38 is published.

**C2: nord's states, shape or token. Ruling: shape (CODE-02), in every theme. No token change.**
A filled overdue dot separates Overdue from Later whatever the hue, so it fixes rose, flamingo, nord and owl at once and protects themes that don't exist yet. The nord `--danger-text` retune is owner taste, deferred, default no change. Nord Next against Later is deferred with a trigger (see Deferred).

**C3: chip outline, new token or `--text-2`. Ruling: no new token. The comment lands now; the visual change goes to the owner.**
The finding is Low, and the outline is an owner decision made one release ago. If it is strengthened, use the already measured `--text-2` at 1px. A `--chip-outline` token would add a token and a table row for a Low item.

**C4: where the "status colours must differ" guard lives. Ruling: each tool answers one question.**
- Whether two tokens are distinguishable is a property of the tokens. It belongs in `check-contrast.mjs`, which already parses all 16 themes statically and so covers a 17th theme for free. It goes in a separate, named "distinct pairs" table with a perceptual-distance metric (WORK-12, narrowed to one pair).
- Whether a component consumes the right token or shape in every theme is a property of the wiring. It belongs in the harness theme loop (WORK-11), using difference checks only.
- The code review's "the pair table cannot express this" describes the table as it stands today. It is not a prohibition; a second table is the smallest extension. Neither tool computes the other's facts.

**C5: is the selected quick chip clear in every theme. Ruling: CODE-04 stands at Medium. The UI review's Strengths line does not answer it.**
The UI review measured text on the fill. CODE-04 measured the fill against the sheet, which is the boundary that shows the state, and in flamingo and kingfisher the label barely changes colour, so that boundary is the only cue. Those are different pairs, and the second one is the one that marks the state.

Remedy: a non-colour cue that does not change chip width. `fitQuickChips()` measures widths only on open and resize, so a wider pressed chip could overflow its fitted row.
- **Recommended default (owner taste):** set the pressed chip's existing 1.5px border to `var(--text)`. `--text` on `--surface` is already measured at 4.5:1 or more, the change adds zero width, and no new table row is needed.
- If the owner prefers the reviewer's check glyph or bold weight, the commit must re-run `fitQuickChips()` on selection and prove at 360px that no row wraps.

## Development Order

Each step is one commit. Run `npm test` (the seven standing gates) after every commit.

**Before v38 is published (required):**

1. **WORK-01**: the prompt condition and wording, plus three `debts.js` assertions. It goes first because it is the only High and it is independent.
2. **WORK-02**: sizes on the same `.debt-rate.ask` line WORK-01 just settled.
3. **WORK-03**: the part-paid row amount swap, display only.
4. **WORK-04**: hero copy and disclosure. "Since this update" must never ship.
5. **WORK-05**: detail bar to `.debt-summary-bar`. This puts the detail bar among the `--primary-text` consumers that WORK-06 repoints.
6. **WORK-13**: explicit `li.overdue` selector, split declarations, line 1898 moved out. The overdue fill must not depend on source order.
7. **WORK-06**: `--progress` token, flamingo and rose overrides (C1 defaults), five consumers repointed, contrast pairs added. It must come before the fill: once Overdue is filled, Paid and Overdue are both filled dots and must not share a red.
8. **WORK-07**: overdue dot filled, line 1875 comment narrowed.
9. *(Optional, if there is room)* **WORK-18**, then **WORK-17**: XS, v38 surfaces.
10. **Publish gate, not a commit:** regenerate all 16 sheets. The owner looks at debts-2 and detail-2 (flamingo and rose colours, C1), and at detail-3 and detail-4 (nord and owl overdue dot). Then publish v38.

**After v38, quick add (live), each its own commit and release:**

11. **WORK-08**: mode segment. Medium, and the error repeats across saves.
12. **WORK-09**: toast names the amount and category.
13. **WORK-10**: pressed chip cue (C5 default).
14. **WORK-16**: hover guard.
15. **WORK-15**: font inherit, app-wide; regenerate the sheets.

**Then the guards and cleanup (Sprint 2):**

16. **WORK-12**: the distinct-pairs table, one pair. It goes first so the C1 values are locked in by a gate.
17. **WORK-11**: theme loops in `quick-entry.js` and `debts.js`, targeting the final shapes from steps 5, 8 and 13.
18. **WORK-21**: Debts CSS literals and duplicate geometry, after WORK-05.
19. **WORK-23**: rewrite the 1800–1813 comment, after the code it describes has settled.
20. **WORK-22**: `dark.accent` fix plus the `THEMES`/block guard.
21. **WORK-14**: the line 2236 comment.

Why this order: steps 1–8 are exactly the v38 surfaces. Inside that set the order follows the stated dependencies (01→02, 05→06, 13→07, 06→07). Quick add follows because it is live and degraded, not broken. The guards come after the fixes so they lock in final values instead of failing on known collisions on their first run.

## Architecture Strategy

**What stays:**
- Token-only components, with no component rules in theme blocks.
- `check-contrast.mjs` as the static, all-theme token gate.
- Words on every state. Colour is never the only signal.
- `.goal-bar` for Savings Goals.
- The owner's v35–v37 quick add decisions: full-screen, stays open, outlined chips.

**What changes:**
- **One new semantic token, `--progress`.** This starts a deliberate split where a token does several jobs and a theme's brand can collide with a state. It is limited to this one case. No other token is split this quarter without a finding showing a collision.
- **The contrast tool gains a second table, "distinct pairs".** It holds pairs only where two state colours share a shape on one screen.
- **The harness gains a theme loop with difference assertions.** Screenshot sheets stop being the only theme evidence. They stay as the owner's taste check, not the gate.

**What is off limits:**
- Retuning `--primary` or `--primary-text` in any theme to fix a single component.
- Per-theme component overrides.
- New tokens for Low findings.
- Ratio maths inside the harness.
- A CSS engine or a new library in the tools.
- Any change to debt rate, cost or spending arithmetic inside these theming and copy commits. Correctness of the figures outranks every visual concern here, and those functions are out of this scope.
- Undo on quick add without its own decision.

**Risks I see that are not findings:**
- After WORK-07, Paid and Overdue are both filled dots, separated by hue alone. In owl, `--primary-text #CAA370` against `--danger-text #E2A3A3` may read close. WORK-12's one pair covers this in every theme, which is why it comes first in Sprint 2.
- A pressed-chip cue that changes width can break the one-row fit of `fitQuickChips()`, which is why the C5 default uses the border colour.
- WORK-01 sits next to the rate functions. Its commit must change only the prompt branch. The three new assertions are the evidence.

## Final Recommendation

Start with WORK-01, as one commit. With a schedule present, the due-date prompt never shows. If the borrowed date is after the first instalment, the prompt names the borrowed date and links to Edit. Otherwise nothing is shown. No change to `debtEffectiveAnnualRate`, and a `debts.js` assertion for each branch. It is the only High, it gates v38, and it has no dependencies. Steps 2–8 follow in the order above. v38 is published only after the 16 sheets are regenerated and the owner has approved the flamingo and rose `--progress` colours.
