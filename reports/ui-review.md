# UI Review — Round 16 — the Debts module, and the true-cost-decoder proposal

**Scope:** the Debts module in `D:\3_Claude\PowerApps\expense-pwa\index.html` — screen markup (3032-3089), `debtProblem` (4479-4505), the `computeReminders` debt branch (5207-5225), `debtPaid` / `debtOutstanding` / `debtInterestPaid` / `renderDebts` (9440-9773), the payment, edit and history sheets (9775-9946), the add handler (9953-9992) and the debt write paths in the save handler (10482-10574). Plus `D:\3_Claude\PowerApps\reports\design-request-true-cost-decoder.md`, reviewed as specified.

**Measured against:** `knowledge/ui-guidelines.md`, `knowledge/project.md`, `knowledge/product-strategy.md` (2026-09-18), `knowledge/review-conventions.md`.

**Method note:** this is a source review. Widths and text advances are derived from declared token values with the arithmetic shown, so they can be checked or re-measured. Where a result depends on the rendering engine I say so rather than assert it. Findings marked **[proposal]** are against the design request as specified, not against shipped code; their severity is the impact *if it ships in that form*.

---

## Executive Summary

The shipped Debts module is the most carefully reasoned screen in this application and most of it is right: the summary-above-form reorder, the cleared-debts sink, the three capped derivations, the refuse-at-the-boundary treatment of every date and amount rule, and the one sentence that says whose arithmetic produced the cost figure. It has no Critical and no High defect as built. Its real weaknesses are that the screen contradicts itself about how much has been paid in the one state the code spends three comments defending against, that the optional due-date field silently drives a reminder the form never mentions, and that the repeat action of the whole module — "+ Payment" — sits below a form roughly 670px tall that a returning user has already used. On the proposal, the single biggest problem is §5's "omit the rate, say nothing": the strategy's first-sequence, permanently-free, mission-defining figure would be invisible for every debt without a due date, and the screen would not say why or what to do about it, while the field that unlocks it is labelled "optional" and presented as having no consequences.

## Overall Score

**80 / 100** — band 75-89, "Solid. Contained High findings, or accumulated Mediums, hold it below 90."

No Critical and no High findings in the shipped module. Five Mediums — a self-contradicting "paid" figure, an unannounced side effect on an optional field, the repeat action buried under the add form, a missing exact-amount affordance on the sheet most prone to a wrong figure, and no plain-language home for the rate this screen is about to grow — hold it out of the 90s. Four of the five are XS or S, which is why it sits high in the band. **This score excludes UI-01, which is High against an unbuilt proposal. If the proposal ships with §5 as written, the module scores in the 60s, because the feature that justifies the module would then be absent without explanation for a large share of users.**

## Strengths

- **The boundary discipline is genuinely consistent and unusual.** Four rules — total below principal (9964, 10494), due date before borrow date (9973, 10519), payment before borrow date (10564), borrow date moved past an existing payment (10511) — are all refused at the boundary the user is standing at, never clamped, and each toast names the specific record that blocks the change. That is the correct pattern for a user with no training and it is applied through both doors of every rule.
- **The screen order is argued from use, not from convention.** The comment at 3033-3043 reasons from "one add and many glances", and the conclusion is checked against the first-run case rather than asserted — `renderDebts` hides the totals card while the list is empty (9511), which is what makes the reorder free.
- **The cost figure is qualified on screen.** The third helper sentence (9595) states that the split is the app's own even allocation and may not match the lender's statement. That is the practice the proposal correctly identifies as precedent, and it is rare.
- **Touch targets and reuse are clean.** `button.goal-add` (min-height 44px, 1720-1723) and `button.goal-icon-btn` (44×44, 1726-1730) are class-only rules and do reach `.debt-actions`; `.list-item .actions button` in the history sheet is 44×44 (1251-1259); `.qa-btn` is 44px (2013-2018). One chip component, not two (1657-1673).
- **Destructive actions and the cascade.** Debt delete states the payment count in the confirm (9760-9762) and the payment ledger is deleted with its parent (9769) rather than orphaned. Payment delete is confirmed (9919) and the history sheet re-renders on success only (9935-9936).
- **Urgency is suppressed once a debt is cleared** (5212, 9709), so the screen never chases a user about a debt it simultaneously reports as settled.

---

## Findings

---

**UI-01 — [proposal] The rate would be silently absent for every debt with no due date, and the screen would say nothing**

- **Severity:** High (if shipped as specified)
- **Location:** `reports/design-request-true-cost-decoder.md` §5 row 1 ("No `dueDate` → Omit the rate. Say nothing."); form field at `expense-pwa/index.html:3078-3082`; validator at `4493-4499`
- **Evidence:** `dueDate` is optional in the schema (`4499`), optional in the form label ("Due by (optional)", 3078), and its helper (3080-3082) tells the user only what the field does *not* do: "It does not create a planned expense — recording a repayment is still up to you." Nothing in the form says the field is load-bearing for anything. Under §3 the term is derived solely from `dueDate − date`, so leaving that field empty removes the module's headline figure entirely, and §5 rules that the screen says nothing about it.
- **Impact:** `product-strategy.md` puts this figure first in the build sequence, on the permanently-free side of the line, and calls it "the number most likely to change what somebody does". A user who skipped an optional field gets a Debts screen with no rate, no indication a rate exists, and no way to discover the one action that would produce it. The proposal's own defence — that debts without a due date are family loans with no cost — is an argument about *typical* records, not about the form: the field is presented as skippable to every user, including the ones with a non-bank loan and a term they could have entered. Two users of the same application see structurally different screens and neither is told why.
- **Recommendation:** Do not ship §5 row 1 as written. Where `totalToRepay > principal` and `dueDate` is absent, render one actionable line in the rate's position: *"Add the date this has to be repaid by to see what it costs per year."* The gate on cost keeps the family case silent, which is the outcome §5 actually wants, and preserves the existing rule that a zero cost is omitted rather than printed as ₮0. Separately, rewrite the due-date helper (3080-3082) to state what the field now does, rather than only what it does not — this is the same edit UI-03 asks for and should be made once.
- **Effort:** S

---

**UI-02 — In the overpayment state the screen states two different figures for how much has been paid, one card apart**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:9539-9540` (`totalPaid`, capped per debt); `9654` and `9722` (the card's `paid`, uncapped); `9798` and `9913` (the payment and history sheets, uncapped)
- **Evidence:** `totalPaid` caps each debt at its own `totalToRepay`, deliberately and with a stated reason. The per-debt card computes `const paid = debtPaid(d.id)` with no cap and prints it as `<span class="paid">${fmt(paid)}</span> paid of ${fmt(total)}`. On the module's own worked example (the comment at 9484-9488: ₮1,300,000 repayable, ₮1,400,000 recorded) the summary tile reads **"Paid back so far ₮1,300,000"** and the card immediately below it reads **"₮1,400,000 paid of ₮1,300,000"**. The history sheet repeats the uncapped figure. Nothing on the screen accounts for the ₮100,000 difference.
- **Impact:** The application disagrees with itself about how much money the user handed over, using the same word for both figures, on one screen, for an audience defined as having little accounting knowledge and being under financial stress. The available readings are "the app is broken" or "I lost ₮100,000", and neither is true. This is Medium rather than High because it is only reachable in the overpayment state — but that state is not hypothetical: it is the observed defect the file already hardened three separate derivations against (9476-9488, 9529-9538), which means the module treats it as reachable while leaving the two most-read figures unreconciled.
- **Recommendation:** Do not cap the card figure — the ledger total is a fact and the user should see what they recorded. Reconcile instead: when `debtPaid(d.id) > totalToRepay`, add one line to the card in the module's existing helper voice, e.g. *"₮100,000 more than agreed is recorded here. Check your payments if that is not right."* One site, gated on a condition that is false for every correctly-entered debt. This is a display reconciliation, not a change to any derivation, and it does not reopen the caps.
- **Effort:** S

---

**UI-03 — The due-date field produces a reminder and an OS notification, and the form never says so**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:3078-3082` (field and helper); `5207-5225` (the reminder branch); `7113-7116` (the toggle, in Settings); `7119` (the only explanation, in Settings)
- **Evidence:** Filling `debtDue` causes `computeReminders` to emit a bell item once the date is within `daysAhead`, and the item is marked `urgent` within 3 days, which the Settings text at 7119 says fires an OS notification once per day. `showDebts` defaults to `true` (3869, 3924). The field's helper (3080-3082) says only that it does not create a planned expense. The only place in the application that explains debt reminders is a paragraph inside the Settings notifications card — a screen the user has no reason to visit.
- **Impact:** Two costs in opposite directions. A user who wants reminders — a named, permanently-free feature in `product-strategy.md` — has no way to learn that this field is how to get them, and the field is labelled optional, so many will skip it. A user who did not want a notification receives one about a debt, on a schedule they never agreed to, from a field whose helper implied it had no consequences. Both are avoidable with one clause.
- **Recommendation:** Add one sentence to the existing helper: *"You'll get a reminder as the date approaches."* Make this edit together with UI-01's, so the field's helper ends up stating both of the things it actually does.
- **Effort:** XS

---

**UI-04 — The module's repeat action sits below a form roughly 670px tall that the returning user has already used**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:3032-3089` (screen order: totals card → add card → `#debtList`); the reorder argument at `3033-3043`
- **Evidence:** The add card runs from 3049 to 3086: an h3, a two-line helper, three label/input pairs, a helper, two label/date pairs, a two-line helper, a label/textarea and a button. Derived at 390px from the declared rules — ~28 (h3) + ~40 + 3×72 + ~34 + 2×72 + ~40 + ~90 + 48 + 32 (card padding) ≈ **670px**. Above it sits the totals card at roughly 180px plus the header. The first debt card therefore begins around y≈880 on a 390×844 device. `+ Payment` (9739) is the only route to recording a repayment and it is inside that card.
- **Impact:** The screen's own comment argues that over a debt's life there is one add and many glances, and moved the summary above the form on exactly that reasoning. The argument was applied to the summary and stopped there: the *action* that recurs — recording a payment — is still a full swipe past a nine-control form the user completed once, months ago. `product-strategy.md` makes repayment the behaviour the product is trying to sustain; it is currently the furthest thing from the top of its own screen. Medium and not High because the content is reachable by scrolling and the summary at the top still answers the glance.
- **Recommendation:** Wrap the add card in the `<details>` / `.more-fields` disclosure the application already uses (1936-2012, correct keyboard and AT behaviour, no new primitive), `open` when `db.debts.length === 0` and closed otherwise — the same emptiness gate `renderDebts` already applies to the totals card (9511). Summary → a one-line "Record borrowed money" disclosure → the live debts. Note the dependency: the empty-state copy at 9513 says "add it above", which stays true under this shape but must be re-read if the form is moved rather than collapsed. This finding also surfaces on the Goals screen (2969+); fix it here only, where the module's own comment has already established the principle.
- **Effort:** S

---

**UI-05 — The payment sheet offers three generic amounts and not the one amount it already knows**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:9796-9810` (sheet body and `renderQuickAmountRow('qaRowDebtPay', ...)`); `10144-10149` (the amounts: 50,000 / 100,000 / 200,000, shared app-wide); the helper at `9797-9799`
- **Evidence:** The sheet prints the outstanding balance in its own helper — `<b>${fmt(debtOutstanding(d))}</b> still owed` — and then offers quick-amount chips of ₮50k / ₮100k / ₮200k, the same three used by Add Income, Add Expense and goal contributions. There is no chip for the remainder. The module's own comment at 9484-9488 names "a final payment typed as the whole total rather than the remainder" as an observed cause of the wrong figure it then capped three derivations to contain.
- **Impact:** The final payment is the moment the user is most likely to type a wrong number, and it is the only payment whose correct value the application already has on screen. The module answered that risk defensively — floor at zero, cap inside the multiplication, cap per debt in the total — rather than with the affordance that prevents it. Offering the exact figure removes the overpayment case at its source, which is also the state UI-02 is about.
- **Recommendation:** On this sheet only, prepend one chip that sets `#mAmount` to `debtOutstanding(d)`, labelled with the figure so it reads as an amount and not a command — e.g. `₮430,000` with the row captioned, or the chip text "Clear it — ₮430,000". Reuse `.qa-btn` unchanged; the 44px floor and the `data-qa-set` wiring already exist. Suppress it when the debt is cleared, matching the existing demotion of `+ Payment` on a cleared card (1800-1803).
- **Effort:** S

---

**UI-06 — [proposal] The rate has no home on the card that does not collide with something already there, and no form that an untrained user can read**

- **Severity:** Medium (if shipped as specified)
- **Location:** `reports/design-request-true-cost-decoder.md` §4 and §6.4; `expense-pwa/index.html:1782` (`.debt-pct`), `1784` (`.debt-meta`), `1809-1818` (`.debt-totals`), `9716-9748` (the card template)
- **Evidence:** Three things, all derivable from the current markup. **(a)** The card already carries an unlabelled 22px bold percentage at top right (`.debt-pct`, 9727) which means *repaid*. A second percentage meaning *cost per year* would sit within about 100px of it, and under option C a third. **(b)** The chip row already renders up to four chips — borrowed, due, cost, note — inside a card interior of `320 − 32 (main) − 2 (border) − 32 (padding) = 254px`; a fifth chip pushes it to roughly four wrapped rows at the narrowest supported width. **(c)** The cost chip is gated on `costHere` (9661), which is `interest paid > 0` and therefore false until the first payment, while the rate is knowable the moment the debt is recorded — so the two cannot share a gate and the rate cannot simply extend the existing chip.
- **Impact:** The figure `product-strategy.md` calls the one most likely to change behaviour would land as a bare percentage in a wrapped pill row, beside a different bare percentage, on a screen read by someone who by definition does not know what an annualised rate is. A number nobody can parse changes nothing, which is the one outcome this feature cannot afford.
- **Recommendation:** Three parts, all within the existing card structure.
  1. **Give it a sentence, not a chip.** One line directly under `.debt-numbers` in the card head, above the chip row — the position the eye reaches after "X paid of Y" and before the metadata. The visible string must carry the unit and the subject in words: *"This loan costs about 81% a year."* Never a bare `81%`, never the abbreviation APR (`product-strategy.md`: the user does not know their APR and nothing may require them to).
  2. **Label the existing percentage** as UI-08 asks, so the card does not contain two unexplained percentages.
  3. **Keep it off the summary card.** Rates over loans of different terms do not aggregate into a figure this module could defend, and the "All borrowing" helper block is explicitly closed at three sentences (9588-9590). §6.4 is right that the figure belongs to the Debts screen; within that screen it belongs to the per-debt card only. I would also keep it out of the bell (`sub`, 5219) — a notification is not a place to meet a number that needs a sentence.

  **On §4, from comprehension only — the arithmetic ruling is the architect's.** Option C is the weakest on this card: three percentages and a request to hold the difference between two annualisation methods, for this user. Option D is worse still over time — it prints the lender's own figure, then doubles the headline number for the same debt in a later version with no change to the user's data, which is precisely the kind of movement that costs a finance app its credibility. Option A produces a figure that agrees with the lender's paperwork, and a number that confirms the framing the screen exists to break has no behaviour-changing content left in it. **Option B is the only one whose output is one number, one label and one assumption sentence — the exact shape `debtInterestPaid` already ships and that this module has proven it can carry.** If a user checking against their paperwork needs the flat figure, put it in the assumption sentence or behind the existing detail sheet, not as a second figure on the card: that is C's benefit at B's comprehension cost.
- **Effort:** M (the presentation work; excludes the computation)

---

**UI-07 — [proposal] The short-term and zero-term cases would render as a bug**

- **Severity:** Medium (if shipped as specified)
- **Location:** `reports/design-request-true-cost-decoder.md` §5 rows 3 and 4; `expense-pwa/index.html:4500-4503` (`debtProblem` deliberately does not cross-check `dueDate` against `date`)
- **Evidence:** The proposal states the problem correctly and leaves the display unruled. A 3-day term annualises to a figure in the tens of thousands of percent; the §4 table already shows 400.4% at three months. `debtProblem` permits `dueDate === date` from an import, so a zero-length term is reachable and the division is unguarded.
- **Impact:** A debt card reading "this loan costs about 47,000% a year" is arithmetically defensible and reads to an untrained user as a broken application — which discredits every other figure on the screen, including the correct ones. A zero-length term yields `Infinity` or `NaN`, which would reach `fmt`-adjacent rendering as a visible artefact.
- **Recommendation:** Guard the zero and negative term by omitting the figure entirely, the same disposition §5 gives a missing due date (with UI-01's prompt, since the state is indistinguishable to the user). Cap the *display*, not the computation, at a round threshold with an explicit "more than": *"This loan costs more than 1,000% a year."* That is still true, still shocking, and does not read as a rendering fault. Pick the threshold once and state it where the function lives.
- **Effort:** S

---

**UI-08 — The debt card's largest number is a percentage with no label**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1782` (`.debt-pct`, 22px, `--w-bold`); `9727` (`<div class="debt-pct">${pctLabel}%</div>`)
- **Evidence:** The most visually dominant element on each debt card is a bare integer and a percent sign. Nothing on the card names it. Its meaning inverts the sibling it was cloned from: a goal's percentage filling up is good, a debt's percentage is the share *repaid*, so a higher number is good for the opposite reason and could equally be read as the share still owed.
- **Impact:** Recoverable — "₮370,000 paid of ₮1,000,000" sits immediately to its left and "₮630,000 still owed" sits below, and the reading order for a screen reader puts the figures before the percentage. That is why this is Low. It stops being Low if UI-06 lands a second percentage on the same card without fixing it.
- **Recommendation:** Add the word. Either a small caption under the figure ("repaid") or `aria-label` plus a visible suffix. `.debt-pct` is a per-module rule (1782-1783), so this does not touch `.goal-pct`.
- **Effort:** XS

---

**UI-09 — The same figure carries two different names one card apart**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:9618` ("Paid in interest", summary tile) and `9732` ("Interest so far", per-debt chip)
- **Evidence:** Both render `debtInterestPaid` — aggregated in the first case, per debt in the second. With a single recorded debt the two are numerically identical and sit roughly one card apart under two different labels. Neither label uses the vocabulary the rest of the screen teaches: the form (3055-3056) and the More sheet entry (3268) both say "what the borrowing costs you", and the word "interest" appears nowhere in the form, deliberately — the comment at 3064-3068 explains that the module takes two amounts precisely *because* the user does not think in interest rates.
- **Impact:** Minor. A user with one debt may read the two labels as two different metrics that happen to agree. Nothing fails, and the qualifying sentence under the summary (9595) is on the same screen.
- **Recommendation:** One name, in the screen's own words. "Cost so far" at both sites, or "Paid in interest" at both. Do not add a second qualifying sentence — the one-site rule at 9584-9586 was ruled on and should stand.
- **Effort:** XS

---

**UI-10 — The payment sheet's Amount field breaks the file's own stated rule for required fields**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:9802-9803` (label and input); the rule at `2262-2279`; the handler at `10550`
- **Evidence:** The stylesheet states the test explicitly: "A field is marked here if and only if its handler returns early rather than storing what was typed", and requires the asterisk and `aria-required` to be applied together. The debt payment handler does exactly that (`if (amount <= 0) { toast('Enter a valid amount'); return; }`, 10550). The label carries no `.required-mark` and the input no `aria-required`. The sibling modal in the same module — `openDebtEditModal` — does carry both on all three of its required fields, and its comment at 9838-9843 states that it was given them on purpose.
- **Impact:** Within one module, one sheet marks its required fields and the other does not. No wrong data is stored; the handler bounces the entry with a toast. The same class exists on the goal-contribution sheet (10114) and the income/expense edit sheets (10356) — report once, and if it is fixed, derive the set from the handlers as the rule says rather than sweeping.
- **Recommendation:** Add `<span class="required-mark">*</span>` to the label and `aria-required="true"` to `#mAmount` on this sheet.
- **Effort:** XS

---

**UI-11 — An eight-figure total wraps mid-number on the narrowest supported width**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:1809-1810` (`.debt-totals`, `.debt-total-item { flex: 1 1 40% }`), `1817` (`.debt-total-value { font-size: var(--t-h2); ... overflow-wrap: anywhere }`); `--t-h2: 22px` at `141`, `--s3: 12px` at `128`
- **Evidence:** Derived. At a 320px viewport the card interior is `320 − 32 (main) − 2 (border) − 32 (padding) = 254px`; four tiles at `flex: 1 1 40%` lay out two per row, giving `(254 − 12) / 2 = 121px` per tile. At 22px weight 700, digit advance is roughly 0.55em ≈ 12.1px and a comma roughly 6px, so `₮1,000,000` ≈ 110px (fits) and `₮12,000,000` ≈ 122px (does not). `overflow-wrap: anywhere` then breaks at an arbitrary character, because a comma between digits is not a line-break opportunity under the Unicode algorithm. At 360px the tile is 141px and eight figures fit. **This is derived from declared values and should be re-measured with a width probe before acting** — the round-15 report records a case where a derived 110px measured at 122px.
- **Impact:** A money figure split across two lines mid-digit-group at 320px. `totalBorrowed` reaching eight figures is entirely plausible for the target user with several loans. Readability only; the digits are all present and `fmt` output is correct.
- **Recommendation:** Confirm by measurement first. If real, the smallest fix is a single-column stack for `.debt-totals` below ~360px, keeping four tiles. Do not reach for `fmtCompact` here — this card is where the user checks the exact figure.
- **Effort:** XS

---

**UI-12 — A recorded payment can only be deleted, never corrected**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:9897-9910` (the history rows: one delete button, no edit); `openDebtEditModal`'s rationale at `9815-9822`
- **Evidence:** The payment history sheet renders each payment with a single `✕` control. There is no edit path, so correcting a mistyped amount, date or note requires deleting the record and re-entering it through the payment sheet. The debt edit modal exists precisely because this pattern was judged wrong for the parent record: "The substitute on offer was a confirmation dialogue announcing how many payment records it was about to destroy, presented to somebody who had mistyped a digit."
- **Impact:** Low. Unlike the debt case, deleting one payment destroys only that payment, and re-entry restores everything including the note — so no data is unrecoverable and the cost is two extra interactions. Recorded because the module's own argument for a correction path applies one level down, and because the same gap exists on goal contributions (10286-10289), which means any fix should cover both or neither.
- **Recommendation:** No action this cycle. If it is taken up, it is one shared correction sheet for both ledgers, not two.
- **Effort:** M

---

**UI-13 — [proposal] Nothing in the request fixes the rate to the contracted term rather than to today**

- **Severity:** Low (if shipped as specified)
- **Location:** `reports/design-request-true-cost-decoder.md` §3 (term = `dueDate − date`); `expense-pwa/index.html:9707` and `5213`, where the two existing date derivations in this module both measure from `todayISO()`
- **Evidence:** §3 specifies the term correctly as `dueDate − date`, which is a constant of the contract. But both existing day-count derivations in the module compute against today — the due chip's `daysLeft` (9707) and the reminder's `daysUntil` (5213) — so today-relative is the shape a reader of this file would most naturally reach for, and the request does not say not to.
- **Impact:** If implemented from today, the module's headline figure would change every time the user opened the screen, rise as the due date approached, and go undefined or negative past it. A number that moves daily with no user action is not one anybody will act on, and it would contradict the cleared-debt handling, which already establishes that a passed due date stops meaning anything once the debt is settled.
- **Recommendation:** State in the ruling that the term is the contracted span and the rate is therefore constant for the life of the debt — it changes only when the user edits `date` or `dueDate`. Cheap to say now, expensive to discover later.
- **Effort:** XS

---

## Clean Areas

- **Navigation.** Debts is reachable from More with a label and a subtitle stating what it is for (3262-3271), and from the point of the most likely mistake — the "Borrowed money is not income" block on the Add Income form, which is a correction rather than a signpost and lands the user one tap away (2812-2821). The `<h1>` names the screen (5831). No finding: the module's own contextual entry point is better than the alternatives I would otherwise have proposed.
- **States.** Empty state for the debt list with a module-specific icon (9512-9514, `EMPTY_ICONS.debt` at 10723), empty state inside the history sheet (9910), a per-card "No payments recorded yet" (9745), the totals card hidden rather than zeroed while the list is empty (9511), and the cost line omitted rather than printed as ₮0 (9547). Every write returns through `savedToast(ok, ...)`, and the history sheet does not re-render over a failed save (9935-9936). No async operation exists on this screen, so no loading state is required.
- **Colour and theme.** No new colour value. The cost figure uses `--danger-text` on grounds already in `check-contrast.mjs`'s pair table (1677, 1818), and the cleared state changes border, background, bar colour *and* the "✓ Cleared" text, so it is never hue-only. The due chip's warning and danger states each carry their own wording ("due today", "overdue 12d"), so urgency is never carried by colour alone.
- **Typography, spacing and cards.** `.debt-total-value` uses `--t-h2` / `--w-bold` rather than the off-scale 20px/800 it once carried, and its label is declaration-identical to `.kpi .label` (1811-1817). `.debt-card` uses `--radius` and `--s3` (1749-1771); the `--shadow` divergence against `.card` is recorded, measured and settled, and re-litigating it is the rejected app-wide sweep.
- **Keyboard and focus.** Every control in the module is a native `<button>` or `<input>` in source order; the modal restores focus via `refocusModalTop` (9935); the history sheet correctly hides Save and relabels Cancel to "Close" (9943-9944).
- **Numbers and formatting.** One formatter (`fmt`, 4694-4697) with the sign outside the symbol, whole tugrik throughout, ISO dates throughout. No sign ambiguity: this module renders no negative figure — `debtOutstanding` floors at zero and every other figure is a magnitude.
- **Horizontal scrolling.** No overflow found. `.debt-meta` and `.debt-foot` both wrap, `.debt-name` and `.debt-numbers` carry `overflow-wrap: anywhere` for the user-supplied lender name, and the longest app-authored chip ("Borrowed ₮12,000,000 on 2026-08-07" ≈ 220px including padding) fits the 254px card interior at 320px. UI-11 is a wrap-quality issue, not an overflow.

---

## Quick Wins

- **UI-03** — one clause on an existing helper line makes a named free-tier feature discoverable and stops an unannounced notification. XS.
- **UI-08** — one word next to the card's largest number removes an ambiguity that will get worse the moment the rate ships. XS.
- **UI-09** — one label, chosen once, in the vocabulary the rest of the screen already teaches. XS.
- **UI-10** — two attributes restore the file's own stated required-field rule inside the module that wrote it down. XS.
- **UI-13** — one sentence in the ruling, and it costs nothing now. XS.
- **UI-01** — S, and it is the one that decides whether the proposed feature exists for most users.
- **UI-02** — S, one gated line, and it removes the only place this screen contradicts itself.
- **UI-04** — S, one existing disclosure primitive, and it puts the module's repeat action back above the fold.
- **UI-05** — S, and it removes the overpayment case at source rather than capping it downstream.

## Estimated UX Impact

With UI-01 fixed, the true-cost figure either appears or tells the user exactly what to do to make it appear, so the feature the product strategy is built on exists for every user rather than only for those who happened to fill an optional field. With UI-02 through UI-05, the screen stops stating two different figures for the same money, the optional due-date field stops having invisible consequences in both directions, a returning user reaches their own debts and the "+ Payment" button without a full swipe past a form they have already used, and the final payment — the one most likely to be typed wrong — can be entered with one tap on the exact figure the sheet is already showing them. Together these change the module from one that is careful about the numbers it derives into one that is equally careful about the numbers it shows, which is the property this screen needs before it starts printing a rate.
