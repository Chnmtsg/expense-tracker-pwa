# Chief Architect: Colour System (Home charts, Analytics, theme tokens), live v38

Inputs, read in full and left unmodified:
- D:/3_Claude/PowerApps-live/reports/ui-review-colours.md (score 66; UI-01 to UI-11)
- D:/3_Claude/PowerApps-live/reports/code-review-colours.md (score 78; CODE-01 to CODE-10)
- D:/3_Claude/PowerApps-live/reports/engineering-manager-colours.md (WORK-01 to WORK-14; conflicts C1 to C9)

Also read: knowledge/review-conventions.md, knowledge/project.md, reports/design-request-colours.md, and all 20 sheets in reports/themes-colours/. I checked the code in D:/3_Claude/PowerApps-live/expense-pwa/index.html for `drawPvA`, `CATEGORY_COLORS`/`categoryColor`, the migration chain (`SCHEMA_VERSION = 3`, `toV1` to `toV3`) and the light and dark token values. Where I quote a contrast ratio that is not in a report, it is my own WCAG arithmetic from the token values, and I give it as a risk, not as a finding.

## Executive Decision

**Yes. The application is fit for release, and v38 stays live.** Neither reviewer raised a Critical finding. No figure is wrong anywhere in scope, and text contrast passes in all 16 themes. Every chart has words or amounts beside its colours, so a user who reads colour wrongly can still read the right numbers. The colour layer still fails the product's own promise that one colour has one meaning:
- in 7 themes, Planned, "more spending" and "your balance" are painted in a state hue;
- category colours move when the list is reordered;
- nothing in `npm test` measures a chart colour.

This is real work, and it is approved below as small, separate, measured steps. None of it blocks the build that is live.

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| WORK-01 | Category palette into per-theme `--cat-1` to `--cat-12` tokens | This is the root cause behind UI-01, CODE-01, CODE-02 and CODE-09. Colour decided in JavaScript cannot follow the theme or be measured. Approved as tokens declared in `:root`, with per-theme overrides only where measurement fails (see C5). The fallback for a deleted category becomes `var(--text-2)`, not `var(--text-3)`, because light `--text-3` (`#94A3B8`) is about 2.3:1 on `--surface-2` and would fail its own row. `CATEGORY_COLORS` is deleted. |
| WORK-02 | Stable `colorSlot` on each category | A colour that changes when a list is tidied silently re-teaches the user, and Reports and the AI Assistant on the roadmap will chart by category. Approved **without a `toV4` migration and without bumping `SCHEMA_VERSION`** (see Conflict Rulings, WORK-02 shape). Store a validated integer from 1 to 12, never a colour string. |
| WORK-03 | Planned vs Actual: neutral `--chart-planned`, fill tokens for Actual, classes instead of inline styles, one state function | This removes the Planned/Actual collision in 7 themes (UI-02, CODE-04) and the nord/owl hue-only pair (UI-08, CODE-04) at S effort. Today's state rules are kept exactly; the only rule change is WORK-09. |
| WORK-05 | Heatmap legend built from the cells' own ramp | The legend currently shows a density the grid never paints, which is the very thing the markup comment says it prevents. It is a contained fix. |
| WORK-06 | Hero card on a danger-based ground when Left over is negative | A negative balance on a green card (mint, forest, peacock, oled) contradicts the one figure the screen leads with. Approved with the `--hero-from` / `--hero-to` pair as the mechanism (see C8). |
| WORK-07 | Flamingo `--primary-text` off the danger hue | One token. Today the active tab and the mode labels read as warning red. |
| WORK-08 | Needs/Wants/Savings tokens separated from the state tokens; dark declares its own | The donut is the default Home pane, and today it passes value judgements the app does not intend (UI-03, CODE-06). Approved as **new values for the existing `--needs`/`--wants`/`--savings` tokens**. There are no new `--group-*` tokens and no category slots are reserved (see C7). |
| WORK-09 (rows) | Savings rows over plan no longer shown as red "over" | Showing saving as overspending contradicts the vision directly (UI-04, CODE-05). Approved for the per-row rule. The totals line is deferred (below). |
| WORK-10 | Measure what charts paint | This is how these defects shipped unnoticed. Approved, delivered **in parts with the fix each part guards** (see Development Order): the new 3.0 `PAIRS` rows, plus one probe `tools/harness/chart-colours.js` in `npm test` with a single distance function defined once. |
| WORK-11 | "Income minus plan" in `--text`, `--danger-text` only when negative | XS. The app currently paints green the one figure it warns users not to treat as spendable. |
| WORK-12 (flamingo) | Flamingo hero deeper brand step | Both reviewers agree on flamingo, and the owner noticed it. Once WORK-06 adds the hero pair, this is a value change and nothing more. Nord and owl are deferred (below). |
| WORK-13 | Daily totals under the stacked chart in `--text-2` | XS. It removes a second meaning of red ("an expense" as well as "over plan"). |
| WORK-14 | Donut legend percentage stays on the label line at 360 px | XS. It shows in all 16 sheets and pushes Savings below the fold. The existing `donut-legend-width.js` probe must keep passing. |

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-02 (part) | Migration `toV4` that stamps slots | The load normaliser is needed anyway, for imports and for categories created by older builds. Run over a file with no slots, it assigns the lowest unused slot in array order and then the least-used one, which gives exactly `(index % 12) + 1`, the same result as the migration. A migration would add a second code path and restamp every stored file and exported backup for nothing. The file's own precedent (the `debts`/`goals` comment: "NO MIGRATION, DELIBERATELY") applies. |
| WORK-02 (part) | Fixed slots written into `defaultCategories` and `LOAN_PAYMENT_CATEGORY` | `toV3` spreads `LOAN_PAYMENT_CATEGORY`. Adding a field to it changes what a shipped migration produces, which the append-only rule forbids. One function assigns slots, called by the normaliser and by `catAdd`, and nowhere else. |
| WORK-03 (option) | `--text-3` as the Planned colour | Light `--text-3` on `--surface-2` is about 2.3:1, below the 3.0 row that WORK-10 adds. |
| WORK-04 (option) | UI-05(b) primary route: one heat hue giving 3:1 from empty to max while text keeps 4.5:1 | The arithmetic rules it out in the two themes it was meant for. Kingfisher (`--surface-2` `#B2EBF2`, L ≈ 0.75) leaves a luminance window of about 0.18 to 0.22 even with pure black text. Nord (`#434C5E` with light text) has no window at all: text needs fill L ≤ 0.15, range needs L ≥ 0.31. |
| WORK-08 (option) | Reserve category slots for the three groups | This would take 3 of the 12 slots that C5 needs for categories, and it couples two unrelated charts. The group tokens already exist; they need values, not a new source. |
| WORK-12 (option) | `--hero-scrim-colour` token (CODE-08) | It would be a second hero mechanism beside the `--hero-from` / `--hero-to` pair that WORK-06 already needs. One mechanism serves both (C8). |

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-04 (range) | Heat ramp reaching 3:1 in kingfisher and nord (UI-05(b), CODE-10) | A UI sketch on kingfisher and nord choosing between UI's fallback (a small solid ground behind the cell text, which would allow a full-range fill) and Code's top-band marker (a non-fill mark on the heaviest days), measured against the arithmetic above. Until then the amounts printed in the cells carry the ranking, which is Code's position and costs nothing. The `--heat` hue part of WORK-04 is approved and is not deferred. |
| WORK-09 (totals line) | "Total … over by" excluding or neutralising Savings | This changes what a printed total means, and a financial figure outranks a colour. Settled by the owner saying whether the totals line is a spending total (Needs + Wants) or an allocation total (all groups). Default if there is no answer: unchanged. |
| WORK-12 (nord, owl) | Deeper hero step in nord and owl | The reviewers disagree on these themes (UI says nord and owl; Code says slate, nord, owl and gold "less visibly"), and nord's muted look is the theme's identity. Settled by the owner asking for it after seeing flamingo fixed. It is then a value change on the same pair. |

## Conflict Rulings

**C1: Severity of the category palette (UI-01 High vs CODE-01/02/03 Medium).** Under review-conventions only the reviewer who raised a finding sets its severity, so both stand as raised. I rule on priority: **P1**, on the higher severity. The fix is the root cause and the dependency for WORK-02, WORK-08 and the probe, so the order would not change at Medium anyway.

**C2: Severity of the Planned vs Actual collision (UI-02 High vs CODE-04 Medium).** Both severities stand. **P1.** The fix is S and touches no data. A planned amount painted in alarm red, or "under" painted in the brand green, is a misreading for the target user, who reads colour first.

**C3: Severity of the heatmap range (UI-05 Medium vs CODE-10 Low).** Both severities stand. I split WORK-04:
- the hue part (heat stops speaking in success or danger in 7 themes) is P1 and approved;
- the range part is deferred, because the right shape is not known and the obvious one is infeasible (see Rejected).

**C4: Overall score (66 vs 78).** Both scores stand. Each is consistent with its own findings, and the gap is exactly C1 and C2. My reading is "usable but fragile" in the colour layer. That is not a release blocker, because no figure is wrong.

**C5: Slot count and tuning.** **Twelve slots, `--cat-1` to `--cat-12`.** The reasons:
- Ten slots would make the 11th and 12th categories share colours with the 1st and 2nd on the day slots are stamped.
- The defaults plus Loan payment already reach 11.
- R2's least-used assignment keeps duplicates as far apart as possible past 12.

Tuning follows Code's shape, with UI's grouping as an outcome rather than a plan:
- defaults in `:root`, tuned for light grounds;
- overrides only in themes where a `PAIRS` row or the probe fails;
- if the same overrides repeat across several dark-ground themes, they are declared once under a shared selector list, never copied block by block.

Risk, stated plainly: twelve colours that all reach 3:1, all differ from each other and all stay clear of three state families may not fit one strict threshold. The slot-vs-state distance is binding. The slot-vs-slot threshold may be looser, and it is set once, as a constant in the probe, in the WORK-01 commit, with the measured minimum recorded in the commit message. Lowering either constant later needs a ruling.

**C6: How Savings over plan reads (WORK-09). Owner's taste; recommended default below.** Engineering ruling first: the state function decides from (group, planned, actual), and Savings rows never use the danger colour. Default presentation:
- words "ahead by ₮X" / "short by ₮X" / "on target", in `--text-2`;
- the Savings row's **Actual bar painted in `--savings`** (group identity, not a judgement).

UI-04's "neutral bar" is overruled because a neutral Actual bar would match the neutral Planned bar and fail the probe's Planned ≠ Actual assertion. The owner's alternative is "ahead by" in `--success-text`, which is Code's "positive" option. It is a one-line change in the state function if the owner prefers it.

**C7: May group colours equal state colours (WORK-08)?** **No.** Needs, Wants and Savings must not equal, or sit within the probe's distance threshold of, `--success`, `--danger` or `--warning` in any theme. The probe enforces this in the WORK-08 commit. Group colours may equal the brand colour: the brand is not a judgement, and this keeps WORK-08 small. **The values are the owner's taste.** Recommended default, adjusted per theme until the rows and the probe pass:
- Needs: blue family, keeping each theme's current value where it is already outside the danger family. Flamingo, rose and sepia move.
- Wants: violet family (off amber).
- Savings: cyan family (off green), for example around `#0E7490` on light grounds.

The dark theme declares its own three tokens.

**C8: How to fix the muddy hero (WORK-12).** **UI's `--hero-from` / `--hero-to` pair**, introduced by WORK-06:
- defaults are `var(--primary)` and `var(--primary-2)`, so all 16 themes are unchanged on introduction;
- the negative state overrides the pair with danger-based values;
- flamingo then sets a deeper brand step so its scrim can fall toward about 0.22.

The `check-contrast.mjs` hero rows are pointed at the pair. On the affected themes: flamingo only now (both reviewers agree, and the owner saw it); nord and owl are deferred. **Flamingo's exact values are the owner's taste.** Default: start one step deeper on the coral ramp and accept the first value at which white clears 4.5:1 with the scrim at or under 0.25.

**C9: How to fix the heatmap range (WORK-04).** Neither proposal is adopted yet. UI-05(b)'s primary route is infeasible in kingfisher and nord (see Rejected). The choice between UI's solid ground behind the text and Code's top-band marker is deferred, with the trigger stated above. What proceeds now:
- a per-theme `--heat` token, defaulting to `var(--primary)`, overridden in mint, forest, peacock, oled, flamingo, rose and sepia;
- a probe assertion that `--heat` stays clear of `--success` and `--danger` in every theme.

**The override hues are the owner's taste.** Default: blue-indigo family for the four green themes, and a violet/plum family for flamingo, rose and sepia.

**Neutral Planned token.** **`--chart-planned`, its own token, declared once in `:root` as `var(--text-2)`.** The reasons:
- `--text-2` is neutral in every theme and is already measured at 4.5:1 for text; light `#475569` on `--surface-2` is about 6.9:1.
- As an alias it needs no per-theme tuning in 16 themes.
- It can never be a state hue.

A 3.0 `PAIRS` row against `--surface-2` lands with it. **Lightness is the owner's taste.** If the owner finds a `--text-2` bar too heavy, a theme may override it with a lighter grey that still passes the row (in light, for example, `#64748B`, about 4.4:1 on `--surface-2`). `--text-3` is not eligible in light.

**WORK-02 shape (ruled here because it changes stored data).**
- One function assigns a slot: the lowest unused, or the least-used once all 12 are taken, with ties going to the lowest.
- Both the load normaliser (next to `normalizeGroup`) and `catAdd` call it.
- `categoryColor()` validates the slot itself (`Number.isInteger`, from 1 to 12) before it builds `var(--cat-N)`. That keeps it a constant wrapper for `check-escaping.mjs` without trusting the normaliser.
- `importProblem` does not reject a bad slot; the normaliser repairs it, which is the same policy as `group`.
- Older builds keep the field, because `load()` spreads the parsed file.
- The `catAdd` comment and the KNOWN LIMIT comment above the palette are rewritten in the same commit.

**Graphic fills must reach 3:1 (ruled because WORK-03 depends on it).** UI-08 and CODE-04 move the Actual bars from the `-text` tokens to `--success` and `--danger`. By my arithmetic, light `--success` (`#10B981`) on `--surface-2` is about 2.3:1. UI-06 already measured 2.54:1 on white for the Trend bar. So switching tokens without tuning would lower Actual-bar contrast in light. Ruling: before WORK-03, the fill tokens `--success` and `--danger` get 3.0 rows against `--surface` and `--surface-2`, and any theme that fails is tuned in that commit. **Exact values are the owner's taste.** Default: the nearest deeper step of the same hue that passes. For light `--success` that is `#059669` (about 3.4:1 on `--surface-2` and 3.8:1 on white). Light `--danger` already passes, at about 3.4:1.

## Development Order

One commit per step. Run `npm test` at every step. Each step brings its own measurement, so the suite is green after every commit and no row is added before the change that makes it pass.

| Step | Item | Commit content | Size |
|---|---|---|---|
| 1 | WORK-07 | Flamingo `--primary-text` moved off the danger hue (default `#B4235A`, about 6:1 on white; owner may choose another value). Existing text rows re-run. | XS |
| 2 | WORK-11 | "Income minus plan" in `--text`, and in `--danger-text` when negative. | XS |
| 3 | WORK-10 (fills) | 3.0 `PAIRS` rows for `--success`/`--danger` against `--surface` and `--surface-2`; tune the failing themes' fill values. | S |
| 4 | WORK-03 | `--chart-planned` token; classes `.pva-plan` and `.pva-actual.is-over/.is-under/.is-unplanned`; one state function with today's rules unchanged; inline colour styles removed. Creates `tools/harness/chart-colours.js` with the single distance function and assertion (c), Planned ≠ Actual in both states. Adds the `--chart-planned` vs `--surface-2` row. Probe added to `npm test`. | S |
| 5 | WORK-09 (rows) | Savings rule inside the state function (C6 default). The probe asserts that a Savings row with actual above plan is never painted `--danger`. | S |
| 6 | WORK-06 | `--hero-from` / `--hero-to` pair (defaults unchanged) plus `.hero-kpi.is-negative` on a danger-based ground. Hero rows in `check-contrast.mjs` read the pair, and the negative state is measured. | S |
| 7 | WORK-01 (+ WORK-10 slots) | `--cat-1` to `--cat-12` in `:root` plus failing-theme overrides; `categoryColor()` returns `var(--cat-N)`, still positional; fallback `var(--text-2)`; `CATEGORY_COLORS` deleted. `PAIRS` rows for the slots against `--surface`/`--surface-2`; probe assertions (a) slot vs state and (b) slot vs slot. | M |
| 8 | WORK-02 (+ WORK-10 stability) | `colorSlot` normaliser plus `catAdd`, with no migration. Probe assertion (d): a chip keeps its colour after a reorder and after deleting the category above it. A file without slots reproduces the position colours exactly. | M |
| 9 | WORK-08 | New `--needs`/`--wants`/`--savings` values per theme; the dark theme declares its own. 3.0 rows against `--surface`; probe assertion that groups stay clear of the state colours. | S |
| 10 | WORK-05 | Legend swatches built from `heatMin` up to `heatMax`, on `--surface-2`, with an unfaded border. | S |
| 11 | WORK-04 (hue) | `--heat` token with overrides in the 7 themes; probe assertion that heat stays clear of the state colours. | S |
| 12 | WORK-12 (flamingo) | Flamingo hero pair values and re-derived scrim. | XS |
| 13 | WORK-13 | Daily totals in `--text-2`. | XS |
| 14 | WORK-14 | Donut legend percentage on the label line. | XS |

Why this order:
- **Steps 1 and 2** are one-token or one-line fixes that remove a High and a Medium. They are the least likely to collide with the parallel quick add edits to `index.html`.
- **Step 3 goes before step 4** because WORK-03 switches the bars to fill tokens; tuning them first is what keeps that switch from lowering contrast in light.
- **Step 4 comes early.** WORK-03 is High at S effort, needs no data change, and gives birth to the probe, so every later step adds an assertion to an existing file instead of inventing one.
- **Step 5 follows step 4** because the Savings rule is a rule inside the state function that step 4 creates.
- **Step 6 before step 12** because the hero pair is introduced once, then tuned.
- **Step 7 before step 8** because the slot integer indexes tokens that must already exist. The stored-data step is kept alone, so it can be reverted alone.
- **Step 8 before step 9**, so that the probe file and the token conventions are settled before the group values move.
- **Step 10 before step 11**, so that the `--heat` change shows correctly in both the cells and the legend.
- **Steps 12 to 14** are polish, in P3 order.

Total effort stays about 9 days. Owner rulings are not on the critical path, because every taste decision above has a default the build can use.

## Architecture Strategy

**What stays.**
- CSS custom properties are the only source of colour.
- Charts stay DOM-rendered, with no chart library and no canvas.
- The single-file offline PWA and the 16 themes stay.
- `check-contrast.mjs` keeps its ratio-only scope (ruling V4). Distance and "one meaning" checks live in the harness probe.
- The stacked daily chart keeps its structure. The day detail stays the labelled view.
- Brand `--primary` values are not re-tuned to dodge state hues. Charts stop borrowing the brand instead.

**What changes.**
- A declared **graphic token role**: `--cat-1` to `--cat-12`, `--chart-planned`, `--heat` and `--hero-from`/`--hero-to`.
- Fill tokens (`--success`, `--danger`, `--needs`, `--wants`, `--savings`) must reach 3:1 against the grounds they are painted on.
- `-text` tokens are for words only.
- Category colour becomes a property of the category: a stored, validated integer slot, never a colour string.
- Colour state is decided in one function per chart and painted through classes. This happens in Planned vs Actual now, and in other renderers only when they are next touched for a reason of their own.
- Every new theme or chart token lands with its row and probe assertion in the same commit.

**What is off limits this quarter.**
- Storing any colour string in user data. It would break theme-awareness and the `check-escaping.mjs` guarantee at once.
- User-pickable category colours (not requested; same reason).
- Hashing the category id for colour (Code: about 0.4% chance of no collision).
- A chart library, or redesigning any chart to work around colour.
- Adding a 17th theme before the `chart-colours.js` probe exists.
- New `--group-*` tokens, or a second hero mechanism.
- Changing what the Planned vs Actual totals line sums, without the owner's ruling.

Risks I see that are not findings:
- Steps 3 to 14 all edit `index.html`, which the quick add work is also editing. Rebase before each commit and anchor on function names.
- The headless-Chrome traps in the standing memory apply to the new probe. Every assertion must be shown to fail at least once against the old values before it is trusted.

## Final Recommendation

Start with step 1: change flamingo's `--primary-text` to the default `#B4235A` (or the owner's value) in `index.html`, re-run `check-contrast.mjs` and `npm test`, and commit it alone. Then continue down the Development Order one commit at a time, using the stated defaults for every taste decision unless the owner answers first. Four decisions are the owner's:
- the Savings-row wording and colour (C6);
- the group colour values (C7);
- the heat override hues (C9);
- the lightness of the Planned grey.

The owner's answers can replace the defaults at any step without changing the order.
