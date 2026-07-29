# UI/UX Review Report — Income & Expense Tracker (PWA)

Reviewed: `expense-pwa/index.html` (5,161 lines, single-file app)
Reviewer role: Principal UI/UX Designer
Date: 2026-07-28

---

# Executive Summary

This is a genuinely well-crafted interface for a solo-built PWA. It has a real design
system — spacing, type, radius and elevation are all tokenised, focus rings are
`:focus-visible`-only, `prefers-reduced-motion` is respected, safe-area insets are
handled, and 16 themes ship with hand-tuned contrast notes in the CSS. That is far
above the norm for a single-file app.

The weaknesses are not in the visual layer. They are in **touch ergonomics**,
**form accessibility**, and **error feedback** — three areas where the design system
defines the right rule and the components then quietly break it. There is also one
structural IA problem: Income, a primary daily action, is buried two taps deep while
Expenses gets a top-level tab.

---

## Overall Score

| Category | Score |
|---|---|
| Visual Design | 84 |
| User Experience | 72 |
| Accessibility | 62 |
| Mobile Experience | 74 |
| Consistency | 78 |
| **Overall** | **74 / 100** |

---

## Strengths

- **A real token system.** `--s1..--s7`, `--r-sm/md/full`, `--t-micro..--t-h1`,
  `--e1..--e3`. The CSS even comments "use ONLY these values". Most of the layout
  honours it.
- **Theme work is exceptional.** 16 themes, each with `--needs/--wants/--savings`
  re-mapped so the donut stays legible, and inline comments recording measured
  contrast ratios ("darkened for AA compliance (5.7:1)"). `applyTheme()` also updates
  the `theme-color` meta so the OS chrome follows the theme.
- **Motion is disciplined.** One 280ms screen transition, one 350ms value pulse, both
  disabled under `prefers-reduced-motion`.
- **Empty states are designed, not defaulted.** `emptyState()` renders an icon, a
  title and a helpful sentence for Income, Expenses and Goals.
- **The hero-KPI + mini-strip hierarchy is correct.** One dominant number (Net
  Balance), three supporting figures. This is the right dashboard grammar.
- **The Financial Advisor is the product's differentiator.** ~25 rules producing
  concrete, numeric, actionable sentences ("Planned ₮X, spent ₮Y") rather than
  generic advice.

---

## Critical Issues

### CI-1 — Form labels are not associated with their inputs
Roughly 60 instances of `<label>Date</label><input type="date" id="incDate">`. There
is no `for=` attribute and no wrapping.

**Why it matters:** a screen reader announces the input as unlabelled; the user hears
"edit text, blank". Tapping the label text — a normal mobile habit, and a much larger
target than the field itself — does nothing.

**How to fix:** add `for`/`id` pairs, or wrap the input inside the `<label>`. This is
mechanical and safe.

### CI-2 — A cluster of touch targets below the 44px minimum
The design system sets `min-height: 44px` on `input`, `select`, `textarea` and the
three button variants. Several components then opt out:

| Component | Effective height |
|---|---|
| `.segmented button` (Actual/Planned) | ~33px |
| `.chip` (category filters) | 32px |
| `.goal-actions .goal-icon-btn` | 34px |
| `.cal-nav button` (month prev/next) | ~30px |
| `.qa-btn` (quick amounts) | ~33px |
| `.close-x` (every modal) | ~26px, unsized |

**Why it matters:** these are not decorative. `.segmented` switches the entire
Expenses screen between Actual and Planned; `.close-x` dismisses every modal in the
app. On a phone held one-handed these are mis-tap generators.

**How to fix:** raise each to 44px, or keep the visual size and add transparent
padding / `::before` hit-area expansion so the ink stays compact.

### CI-3 — Validation errors appear only as a disappearing toast
`toast('Enter an amount')`, `toast('Add a category first')`, `toast('Pick a first
contribution date')` — all fire at the bottom of the screen for 1.8 seconds. Only one
field in the entire app (`sHourly`) ever receives the `.invalid` style.

**Why it matters:** on the Goals form the user may be scrolled past the offending
field. The toast says *what* is wrong but never *where*. If the user looks away for
two seconds the message is gone with no way to recall it.

**How to fix:** apply `.invalid` to the failing field, scroll it into view, and keep
an inline error message under it until corrected. The `.invalid` style already exists
and is unused — this is mostly wiring.

---

## High Priority Improvements

### HP-1 — Income is buried under "More"
The bottom bar is Home / Expenses / Daily / Goals / More. Income and the Salary
Calculator live inside the More sheet.

Income is a daily-to-weekly action for anyone tracking freelance work, and the whole
Net Balance figure depends on it being logged. Costing it two taps while Daily Chart —
a read-only view — gets a primary slot inverts the actual usage frequency.

**Fix:** promote Income to the tab bar; move Daily Chart into More, or merge Daily
into the Dashboard as a section. Alternatively add a floating quick-add that offers
Income / Expense from anywhere.

### HP-2 — Placeholder text fails AA contrast
`--placeholder: #94A3B8` on `--surface: #FFFFFF` measures ≈2.9:1. WCAG AA requires
4.5:1 for text this size.

The placeholders carry real instructional content — "e.g. Groceries", "e.g. Travel to
Japan", "📅 Tap — leave empty for unlimited". The last one is the *only* affordance
telling the user that field is a tappable date picker.

**Fix:** darken to roughly `#64748B` (≈4.8:1) in the light themes. Audit the same
token across all 16 themes — several inherit the same weak value.

### HP-3 — Adding an entry costs more interaction than it should
To log an expense: tap Expenses → scroll past the mode toggle and three filter
controls → reach the form → fill amount → pick category → tap Add. The add form sits
*below* the filter row it has nothing to do with.

**Fix:** a persistent add affordance (FAB or a compact top-of-screen row), and move
the filters to a single collapsed "period" pill so the form starts near the top.

### HP-4 — Modals cannot be dismissed from the keyboard and steal no focus
No `Escape` handler, no focus trap, no focus return to the trigger, no
`role="dialog"` / `aria-modal="true"`. Applies to all nine modals including the
confirm dialog that guards destructive resets.

**Fix:** a small shared modal controller. This is one function that all nine reuse.

---

## Medium Priority Improvements

### MP-1 — Two different empty-state languages
`.empty-state` (icon + title + description) is used for Income, Expenses and Goals.
`.empty` (one line of grey text) is used for the Planned-vs-Actual chart, the daily
chart, categories, income types and goal history. The user sees two different
qualities of blank screen depending on where they are.

**Fix:** route everything through `emptyState()`. The icon set already has `calendar`
and `category` entries that are currently unused.

### MP-2 — Mixed icon language
The nav bar, KPI strip and empty states use a clean 24×24 stroke SVG set. Buttons and
headings use emoji: "💾 Save & Add as Income", "➕ Add Expense", "🌍 Convert from
foreign currency", "🔁 Frequency", "📊 Data Summary". Emoji render differently on
Android, iOS and Windows, don't inherit `currentColor`, and don't respond to the
theme.

**Fix:** pick one. Given the SVG set already exists, migrate button/heading icons to
it and reserve emoji for user-chosen content (goal icons, advisor tips) where the
playfulness is the point.

### MP-3 — `word-break: break-all` on currency values
Applied to `.hero-value`, `.mini-value`, `.st-value`, `.conv-val`, `.cal-val`. On a
narrow screen this can break `₮1,250,000` between two digits, producing a line ending
in `₮1,250,` — which reads as a different number at a glance.

**Fix:** `overflow-wrap: anywhere` plus `fmtCompact()` for the cramped slots. The
compact formatter already exists.

### MP-4 — The four filter rows eat the top of every screen
Dashboard, Income, Expenses and Daily each render a preset select plus two date
inputs. At `flex: 1 1 130px` on a 360px viewport that wraps to two rows, consuming
~110px before any content appears — on the screen the user opened to see content.

**Fix:** collapse to a single pill showing the active range ("This Month ▾") that
expands on tap.

### MP-5 — Calendar cells are too dense on small phones
`aspect-ratio: 1/1; min-height: 44px` in a 7-column grid at 360px gives ~44px cells
holding a day number *and* a compact currency value at 10px with `break-all`.

**Fix:** below ~400px, drop the amount and rely on the heat-map intensity alone; keep
the value in the tooltip and the day-detail card.

### MP-6 — Goal quote tone is a product risk
The `overdue` bucket includes "🤡 The deadline was more of a suggestion, right?" and
"😬 Late is better than never."

This is a personal-finance app. A missed goal deadline is often a missed emergency
fund or a missed medical target. Sarcasm aimed at the user at that moment reads as
mockery, not motivation — and unlike the other buckets, the user can't escape it
without editing the goal.

**Fix:** keep the humour in the `starting`/`progressing` buckets where the stakes are
low; make `overdue` uniformly supportive.

---

## Low Priority Improvements

- **LP-1** — Modals use `align-items: flex-end` and `border-radius: 16px 16px 0 0`,
  so they render as bottom sheets even on a wide desktop window. Centre them above a
  breakpoint.
- **LP-2** — The theme swatch preview shows background + accent dot only. A user
  can't tell from the swatch whether body text will be legible. Add a text sample.
- **LP-3** — `.st-label` and `.mini-label` are 10–11px uppercase. Contrast passes,
  but 10px is below comfortable mobile reading size.
- **LP-4** — Sub-screens reached through More have no back affordance; the user must
  find the tab bar again.
- **LP-5** — The toast has no `aria-live`, so success and error messages are never
  announced to screen-reader users. Combined with CI-3, those users get no feedback
  at all on a failed save.
- **LP-6** — Category filter chip state (`dailyExcluded`) resets on reload and when
  switching Actual/Planned, silently changing the totals shown in the stat strip.

---

## Quick Wins

| # | Change | Effort | Benefit |
|---|---|---|---|
| 1 | Add `for`/`id` to all labels | ~1.5h | Fixes CI-1 outright; larger tap targets everywhere for free |
| 2 | Raise the six sub-44px components to 44px | ~1h | Fixes CI-2; removes the app's main mis-tap source |
| 3 | Darken `--placeholder` across themes | ~30m | AA compliance on instructional text |
| 4 | Apply the existing `.invalid` class + scroll-into-view on validation failure | ~1.5h | Most of CI-3 using CSS that already ships |
| 5 | Add `aria-live="polite"` to the toast | ~5m | Screen readers hear every confirmation |
| 6 | Route the remaining blank states through `emptyState()` | ~45m | Fixes MP-1; icons already exist |
| 7 | Swap `break-all` for `overflow-wrap: anywhere` | ~15m | Stops currency figures splitting mid-number |
| 8 | Soften the four `overdue` goal quotes | ~10m | Removes the tone risk at the worst moment |

Total: **≈5.5 hours for eight fixes**, closing two of the three critical issues.

---

## Professional Recommendations

1. **Treat the token system as a contract, then enforce it.** The CSS says "use ONLY
   these values" and then components hardcode `padding: 8px`, `font-size: 13px`,
   `height: 34px`. The system is good; the drift is what produces every touch-target
   and density issue in this report. A pass replacing hardcoded values with tokens
   would prevent the next round of the same bugs.

2. **Accessibility is one focused day of work, not a project.** Labels, touch
   targets, placeholder contrast, `aria-live`, and a shared modal controller with
   focus trap + Escape. That sequence moves the accessibility score from 62 to
   roughly 85 without touching the visual design.

3. **Rebalance the information architecture around frequency of use, not around
   feature symmetry.** Income and Expenses are the two halves of the same daily
   action and should have equal prominence. Daily Chart and Salary Calculator are
   periodic and belong behind More.

4. **Reduce the dashboard's vertical cost.** Hero + 3 KPIs + advisor + donut +
   planned-vs-actual + trend is six full-width cards before the user has learned
   anything they didn't already know. Consider collapsing the lower three behind a
   "More insights" disclosure, defaulting open on tablet and above.

5. **Sixteen themes is a maintenance surface, not a feature.** Every new semantic
   colour must now be defined 16 times, and the contrast comments show this is
   already being hand-audited. Consider deriving the variants from three or four base
   palettes.

---

## Estimated UX Improvement

Executing the Quick Wins plus HP-1 through HP-4:

| Category | Now | After |
|---|---|---|
| Visual Design | 84 | 86 |
| User Experience | 72 | 84 |
| Accessibility | 62 | 87 |
| Mobile Experience | 74 | 86 |
| Consistency | 78 | 85 |
| **Overall** | **74** | **≈86** |

Estimated effort: **≈16 hours**. The largest single gain is accessibility, and it is
also the cheapest per point.
