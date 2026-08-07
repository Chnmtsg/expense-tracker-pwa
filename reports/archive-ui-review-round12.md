# UI Review — Round 12

*(The agent has read-only tools by role definition — `Read`, `Glob`, `Grep` — so it could not write this file itself; the text below is its complete report, transcribed unmodified.)*

## Executive Summary

The Debts module is the most carefully *reasoned* thing in this file — the stock/flow separation is real, the no-filter decision is written into the markup, the zero-interest case falls out of the arithmetic instead of being exempted, and `npm run debts` asserts the negatives that would otherwise rot silently. The reasoning did not survive contact with the stylesheet. The three action buttons on every debt card — the only way to record a payment, open the ledger, or delete — carry classes whose CSS rules are scoped under `.goal-actions` and therefore do not apply inside `.debt-actions`, so the module's primary control renders as an unstyled user-agent button with none of the 44px sizing the comment above it claims it is reusing. Behind that sit two more: a debt cannot be edited at all, so the only way to fix a mistyped amount is a delete that cascades the entire payment ledger; and `debtInterestPaid` is uncapped where `debtOutstanding` and the percentage are both capped, so a user who over-records a payment is shown more interest than the loan could ever have cost — on the one number the feature exists to produce. Nothing outside the Debts screen is affected; that isolation is genuinely held and asserted.

## Overall Score

**78 / 100** — Solid; High findings exist but are contained. Three High findings, no Critical. All three are confined to one module reached through More, and the property that protects the rest of the app — a debt never reaches a Dashboard total — holds and is guarded by `tools/harness/debts.js` and the WORK-164 flows. The score is not lower because the seven other modules are unchanged and round 10 closed every Medium round 9 raised; it is not higher because a newly-shipped core module ships its primary action as an unstyled control below the mobile minimum.

## Strengths

Verified at source, not accepted from the record.

- **The stock/flow separation is structural, not clerical.** `debtPaid`, `debtOutstanding` and `debtInterestPaid` (`index.html:8241-8276`) take no date argument and never call `getRange`, exactly as `goalSaved:8130-8134` does. `tools/harness/debts.js:78-99` reads all three under three different Dashboard presets including `lastMonth`, which excludes today entirely — a flow-shaped implementation reads zero there. The screen carries no filter row and `debts.js:240-247` fails if one appears.
- **The Income-screen sentence is the intervention it was approved as.** `index.html:2300-2309` states the negation in words — *"Borrowed money is not income"* — before the link, and `:8450-8453` writes nothing and carries nothing across. A user who reads it and walks away has still been told the true thing, which was the point.
- **Zero-interest is correct by arithmetic rather than by branch.** `:8270-8276` returns 0 when `cost <= 0` with no flag and no discriminator, and `debts.js:106-129` asserts that a screen of family debts carries no interest caption anywhere in `#debtTotals`.
- **Cascade delete is confirmed, counted and driven through the real control.** `:8365-8381` names the number of payments in the confirmation, and `debts.js:263-294` exercises it through a click with `confirmDialog` stubbed rather than by calling the handler, then checks for orphans directly.
- **Round 9's six findings are closed on disk, not in a record.** `:7710` hides a reading that would print zero with the formatter's own `Math.round` as the predicate; `:7719-7721` carries the age judgement in wording rather than paint; `:7762-7763` names each currency; `.conv-reading` is at `--t-micro` (`:999`).

## Findings

---

**UI-01 — The three action buttons on every debt card receive none of the styling the module claims to reuse, including the 44px touch target**

- **Severity:** High
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1553` (`.debt-actions`), against `:1501-1512` (the rules) and `:8350-8354` (the markup); rationale comment at `:1514-1517`
- **Evidence:**
  - `:8350-8354` renders `<div class="debt-actions">` containing `<button class="goal-add">+ Payment</button>`, `<button class="goal-icon-btn">📜</button>` and `<button class="goal-icon-btn">✕</button>`.
  - The only rules for those classes anywhere in the file are `.goal-actions button.goal-add` (`:1501`), `:hover` (`:1506`), `.goal-actions button.goal-icon-btn` (`:1507`) and `:hover` (`:1512`). All four require a `.goal-actions` ancestor. `grep` for `goal-add` and `goal-icon-btn` across the file returns those four selectors and nothing else — no combined `.goal-actions, .debt-actions` selector, no media-query variant.
  - `.debt-actions` itself (`:1553`) sets only `display: flex; gap: 6px`.
  - Nothing else picks them up. There is no bare `button { }` rule; the button system at `:1062-1086` is `button.primary, button.secondary, button.danger` only, and the appearance reset at `:1147` names `.cal-cell, .barchart .col, .cur-pick-item`. So these three buttons fall back to the user-agent default: UA font (not `inherit`), UA padding, UA grey fill and bevel, and no `min-height` or `width`/`height`.
  - The declarations that are lost are exactly the ones the comment at `:1514-1517` says are being reused: `min-height: 44px` on `.goal-add`, `width: 44px; height: 44px` on `.goal-icon-btn`, and `background: var(--primary); color: var(--on-accent)` — the affordance that makes "+ Payment" read as the card's primary action.
  - **How to measure rather than derive this, which is the part that should gate the fix.** `tools/harness/debts.js` already renders `#debts` and already measures `card.getBoundingClientRect().width` at `:216`. Add to that flow `document.querySelector('.debt-actions .goal-add').getBoundingClientRect()` and, after `navigate('goals'); renderGoals()`, the same for `.goal-actions .goal-add`, then run `node tools/harness/run.mjs tools/harness/debts.js --width 320`. The two heights should be equal and at least 44; I am not quoting a figure for the unstyled one, because a derived pixel figure has been wrong four times in this project.
  - `debts.js:166` clicks `[data-debt-pay]` and the flow passes — which is correct and is also the point: a functional assertion cannot see this, and no condition in the WORK-165 approval covers geometry or paint.
- **Impact:** `ui-guidelines.md` sets a minimum touch target of 44x44 and the app is used at 320-430px. This is the entire action row of a newly-shipped core module: the only route to recording a payment, the only route to the payment ledger, and the delete. Below 44px on a phone, mis-taps land on the adjacent button — and one of the three adjacent buttons is a cascade delete. Beyond the target, a native OS button sitting inside a card where every other control is themed reads to a non-technical user as a broken or half-loaded screen, on the module whose stated job is to be looked at often enough to change behaviour. The identical goal card two screens away shows the same three controls done correctly, so the app disagrees with itself about what a card action looks like.
- **Recommendation:** Extend the four selectors at `:1501`, `:1506`, `:1507` and `:1512` to also match `.debt-actions` — `.goal-actions button.goal-add, .debt-actions button.goal-add { … }` and the same for the icon variant. That is the smallest safe fix, it keeps the single definition the comment at `:1514-1517` was written to preserve, and it touches no markup. Do **not** clone the rules into a `.debt-actions button` block: that creates the second place for the 44px target to drift that the comment exists to prevent. Land the probe extension above in the same commit so the claim of reuse is measured rather than asserted.
- **Effort:** XS

---

**UI-02 — A debt cannot be edited, so correcting a typo means deleting the debt and its entire payment ledger; the notes field is never displayed anywhere**

- **Severity:** High
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8350-8354` (the action row), `:8365-8381` (delete), `:2524-2525` and `:8471-8474` (notes in, never out), against `:8195`/`:8204` and `openGoalEditModal:8682-8728`
- **Evidence:**
  - The debt card offers three actions — pay, history, delete. The goal card at `:8193-8196` offers four, and the fourth is `data-goal-edit`, wired at `:8204` to a modal that edits name, target, deadline, notes and schedule.
  - Every other financial record type in the app is editable: income and both expense kinds through `openEditModal` (`:5179`, `:5612`), goals through `openGoalEditModal`. Debts are the only collection with a write path and no correction path.
  - The only correction available is delete, and delete cascades: `:8378` removes every payment for that debt, and the confirmation at `:8370` says so — *"and all N payments? This cannot be undone."* A user who typed 1,300,000 as 1,300,00 after recording eight payments must delete and re-enter nine records.
  - `#debtNotes` is a labelled textarea (`:2524-2525`), its value is trimmed and stored (`:8473`), and `grep` for `d.notes` in a render site returns nothing: not `renderDebts` (`:8330-8358`), not the payment modal (`:8390-8399`), not the history modal (`:8431-8436`). There is no edit modal for it to appear in either. The app asks for a note — the placeholder suggests *"e.g. 3 month term..."*, which is precisely the information a borrower needs later — and then never shows it back. Goal notes are equally absent from the goal card but *are* readable and editable at `:8705`, which is the difference.
  - The standing decision records the consequence as a risk on the assumption that editing exists: *"`totalToRepay` is a single number, so a renegotiated or variable NBFI loan cannot be represented without editing it, which silently restates history"* (`reports/chief-architect.md:581`). There is no surface on which that edit can be performed.
- **Impact:** Mistyping an amount is normal use, and money entry is where it happens most. The user's two options are both bad: destroy the ledger and rebuild it by hand, or leave a debt whose "Still owed" and "Paid in interest" are permanently wrong — and those are the two figures the module exists to produce. The delete path additionally carries real data-loss exposure for a user reaching for it as an edit, which is what a user does when there is no edit. The notes field compounds it: the one place a repayment term could live is write-only storage.
- **Recommendation:** Add an edit modal on the `openGoalEditModal` pattern, reusing `#editModal` and a new `editCtx.kind === 'debt'` branch beside the existing three in the save handler at `:8899-8961`. Fields: name, principal, total to repay, date, notes. It must repeat the `totalToRepay < principal` refusal from `:8466-8469` rather than clamping, for the reason already written at `:3828-3832`. Render `d.notes` on the card when non-empty in the same commit, so the field the form collects has somewhere to be read. Add a fourth `.goal-icon-btn` (`✎`) to `.debt-actions` — land UI-01 first, or the new button is unstyled too.
- **Effort:** S

---

**UI-03 — Interest paid is uncapped where outstanding and percentage are both capped, so over-recording a payment shows a cost the loan could not have carried**

- **Severity:** High
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8270-8276` (`debtInterestPaid`), against `:8247-8250` (`debtOutstanding`) and `:8325` (`pct`); write path `:8951-8961`
- **Evidence:**
  - `debtOutstanding` floors at zero with the reason stated: *"overpaying does not make the lender owe you money"* (`:8248`). `pct` caps at 100 (`:8325`). `debtInterestPaid` applies neither: it returns `Math.round(debtPaid(d.id) * cost / total)` with `debtPaid` unbounded (`:8275`).
  - The payment write path at `:8951-8961` validates only `amount > 0`. It does not compare the amount to `debtOutstanding(d)` and does not warn.
  - Worked from the module's own fixture (`tools/harness/debts.js:61`): principal 1,000,000, total to repay 1,300,000, so the loan's whole cost is 300,000. Record payments totalling 1,500,000 — one duplicate entry, or a final payment typed as the full total rather than the remainder — and the card shows **100%**, **✓ Cleared**, **₮0 still owed**, and **Interest so far ₮346,153**. The summary card repeats it under **"Paid in interest"** with the helper *"That is money you paid for borrowing, on top of what you borrowed."* Every one of those figures except the last is right; the last is arithmetically impossible.
  - Both plausible routes are reachable without any unusual behaviour. The payment modal does show `debtOutstanding` in its helper (`:8392`), which mitigates but does not prevent — nothing stops the save, and nothing flags the card afterwards.
  - **Not Critical, and here is why:** nothing stored is wrong, the figure is derived from records the user really entered, no total outside the Debts screen is touched (asserted at `debts.js:137-198`), and the card is visibly in its terminal state. It is High because it misstates the single number the module was built to produce, through an ordinary data-entry slip, on a screen whose stated purpose is to confront the user with that number.
- **Impact:** The behavioural goal recorded throughout the design — *"when people see how much money they spend on non-oafs they can be changed"* — depends on that figure being trustworthy. A user who notices it is too high loses confidence in the module; a user who does not notice carries an inflated lifetime cost in the summary card forever, because there is no edit path to the payment either (see UI-02).
- **Recommendation:** Cap the paid figure inside the interest formula only: `Math.round(Math.min(debtPaid(d.id), total) * cost / total)` at `:8275`, with a comment stating the derivation — the interest fraction is defined over the agreed total, so paying beyond that total cannot buy more of it, the same reasoning `:8248` already gives for flooring outstanding. One `Math.round` is preserved. Separately, and optionally, toast a warning at `:8954` when `amount > debtOutstanding(d)`; the cap is the fix, the warning is the courtesy. Add a flow to `tools/harness/debts.js` seeding payments beyond `totalToRepay` and asserting `debtInterestPaid <= totalToRepay - principal`; demonstrate it red by removing the `Math.min`, which is a change to the application.
- **Effort:** XS

---

**UI-04 — The module's headline figures sit below a nine-control add form, so the number the feature exists to show is never the first thing seen**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:2498-2535`
- **Evidence:**
  - Source order on `#debts` is: add-debt card (`:2499-2527`), then `#debtTotalsCard` (`:2529-2532`), then `#debtList` (`:2534`).
  - The add card contains an `h3`, a two-sentence helper, four labelled inputs each with `min-height: 44px` from `:1046`, a second helper, a textarea with `min-height: 60px`, and a 44px primary button, plus `var(--s4)` padding top and bottom. The summary card starts below all of it, under a persistent header and above a tab bar.
  - `#debtTotalsCard` is the only place "Still owed", "Borrowed in total" and "Paid in interest" appear.
  - **How to measure rather than derive it:** a width-mode probe with `#debts` active reporting `document.getElementById('debtTotalsCard').getBoundingClientRect().top` alongside `window.innerHeight` and `viewport_clientWidth`, run through `node tools/harness/run.mjs … --width 320|360|390|430`. I am deliberately not quoting a pixel total.
  - The reorder is safe by construction: `renderDebts` sets `totalsCard.style.display = 'none'` when `db.debts` is empty (`:8284`), so a first-time user still meets the form first with nothing above it.
- **Impact:** `ui-guidelines.md` says most important information first, and `project.md` records this module's purpose as showing what borrowing costs. Over a debt's life there is one add and many payments and glances; the layout optimises for the one. A returning user must scroll past an empty form they have already used to reach the answer to the question they opened the screen for. The Savings Goals screen has the same form-first order but no summary card, so this is a new inversion rather than a carried one.
- **Recommendation:** Move the `#debtTotalsCard` block (`:2529-2532`) above the add-debt card. No CSS, no JS, no change to the empty case. Leave `#debtList` where it is.
- **Effort:** XS

---

**UI-05 — "Date borrowed" is the only entry date field in the app that is not prefilled with today, so the date silently recorded is never shown to the user**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:2522-2523`, against `:9147-9149`; fallback at `:8470`
- **Evidence:**
  - The init block sets `sDate`, `incDate` and `expDate` to `todayISO()` at `:9147-9149`. `debtDate` is not in that list, and `grep` for `debtDate').value` returns only the read at `:8470` and the harness write at `debts.js:159`. Nothing ever assigns it.
  - The modal date fields do the same thing by a different route: `:8394` and `:8603` render `value="${todayISO()}"`.
  - `:8470` falls back to `todayISO()` when the field is blank, so a debt entered with an empty date is stamped today without the user ever seeing that date.
  - The label carries no `.required-mark` (`:2522`), correctly — it is optional — which is exactly why a blank field reads as "nothing will be recorded here" rather than "today will be recorded here".
  - The date is then displayed as fact on the card: `Borrowed ${fmt(d.principal)} on ${escapeHTML(d.date)}` (`:8344`).
- **Impact:** Borrowing is usually recorded after the fact — the user gets home from the lender, or remembers a family loan from last month. The one field that would prompt them to correct it is blank, so today's date is written and then presented back as though they chose it. Every sibling form in the app prefills for exactly this reason: a visible default is editable, an invisible one is not. With no edit path (UI-02), a wrong borrowing date is permanent short of deleting the debt.
- **Recommendation:** Add `document.getElementById('debtDate').value = todayISO();` to the init block at `:9147-9149` so all four entry dates are set in one place. Clear it back to `todayISO()` rather than leaving it stale in the reset at `:8476-8479`, matching what the other add forms do with their own fields.
- **Effort:** XS

---

**UI-06 — The summary card shows "Still owed" larger than "Borrowed in total" with nothing explaining the gap, because its explanatory sentence is gated off until the first payment**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8299`, `:8301-8318`
- **Evidence:**
  - `showCost = Math.round(totalInterest) !== 0` (`:8299`) gates both the third figure and the helper at `:8317`. `totalInterest` is a function of what has been *paid*, so for every debt with no payments yet it is exactly zero and `showCost` is false.
  - In that state the card headed "All borrowing" shows precisely two figures: **Still owed ₮1,300,000** and **Borrowed in total ₮1,000,000** — computed on two different bases (`totalToRepay` less payments at `:8291`, sum of `principal` at `:8290`) — with no third figure, no helper, and no label saying why one exceeds the other.
  - The gap is at its largest and least earned at exactly that moment, and it grows with the number of debts, since both figures are sums across all of them.
  - The helper that would explain it exists and is well-written — *"That is money you paid for borrowing, on top of what you borrowed. It is not counted in your Net Balance."* — and describes the interest already paid, not the difference between the two figures on screen.
  - This is not the ruled hide-when-zero behaviour being questioned. Suppressing a "Paid in interest ₮0" line under money from your mother is correct and I am not re-proposing it. The defect is that a *different* piece of explanatory text was attached to the same predicate.
- **Impact:** `project.md` defines the audience as people with little accounting knowledge and requires every screen to be understandable without training. The summary card is the first thing that user sees after recording a debt, and it appears to contradict itself — the app says they owe more than they borrowed and offers no reason. The rational readings are "the app is wrong" or "I typed something wrong", and neither is true. The per-debt card is less exposed because the user typed both numbers into adjacent fields moments earlier; the summary across several debts is not.
- **Recommendation:** Render a short helper under `.debt-totals` that is **not** gated on `showCost`, stating the relationship rather than a figure: *"'Still owed' includes anything you agreed to pay on top of what you borrowed."* Keep the existing sentence at `:8317` gated as it is and append it when `showCost` is true. No new figure, no new card, no change to the hide predicate.
- **Effort:** XS

---

**UI-07 — The debt payment-history modal diverges from the goal history modal it was modelled on in three ways, including a read-only list whose only dismiss button says "Cancel"**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8408-8448`, against `openGoalHistoryModal:8747-8778`
- **Evidence:**
  - `openDebtHistoryModal` calls `resetEditModalButtons()` at `:8409`, which sets the cancel button's text to `'Cancel'` (`:8808`), then hides Save at `:8446` and never relabels cancel. `openGoalHistoryModal` hides Save and sets the label to `'Close'` at `:8776-8777`, with the reason written at `:8775`. The same is done at `:5932` and `:6630`. The debt modal is the one read-only view in the app whose exit is labelled "Cancel", which asks the user what they are cancelling.
  - Empty case: `:8430` renders `<div class="helper">No payments recorded yet.</div>`; the goal equivalent at `:8768` renders `<div class="empty">No contributions yet.</div>`. `.empty` (`:1201`) is centred with 24px padding; `.helper` is a small left-aligned block. Two list-empty states, one modal apart, styled differently.
  - Note text: `:8422` interpolates `escapeHTML(p.notes)` bare, where `:8761`, `:5168` and `:5600` all wrap it in `<span class="note">`, which `:1161` paints at `--text` and weight 700. The user's own note is the weakest text in the debt row and the strongest in every other row in the app.
- **Impact:** No function is lost and nothing is unreadable. It is inconsistency the user feels rather than names — the same list, reached the same way, behaving slightly differently depending on which screen it was opened from.
- **Recommendation:** Set `editModalCancel.textContent = 'Close'` after `:8446`; change `.helper` to `.empty` at `:8430`; wrap the note at `:8422` in `<span class="note">`. Three lines, one function.
- **Effort:** XS

---

**UI-08 — The debt summary reimplements the KPI tile at a fourth headline size that is not on the type scale, and the debt chip diverges from the goal chip it was copied from without a reason**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1558-1562` against `.kpi` at `:885-897`; `:1541-1548` against `.goal-meta-item` at `:1476-1483`
- **Evidence:**
  - `.debt-total-label` (`:1560`) is `font-size: var(--t-micro); color: var(--text-2); text-transform: uppercase; letter-spacing: .04em; font-weight: var(--w-medium)` — declaration for declaration identical to `.kpi .label` (`:889`) apart from its margin. `.debt-total-value` (`:1561`) is `font-size: 20px; font-weight: 800; overflow-wrap: anywhere`, where `.kpi .value` (`:897`) is `var(--t-h2)` (22px) at `var(--w-bold)` with the same wrap release. The component was rebuilt rather than reused, and the rebuild introduced 20px, which is not on the scale at `:109` (11/13/15/18/22).
  - `.debt-meta-item` (`:1541-1548`) against `.goal-meta-item` (`:1476-1483`): padding `3px 9px` vs `3px 10px`, no border vs `1px solid var(--border)`, no `font-weight` vs `600`, `var(--t-micro)` vs the literal `11px` (the same value). Four differences between two chips that carry the same kind of content two screens apart, none stated, three of them almost certainly unintended.
  - The comment introducing the block (`:1514-1517`) argues explicitly for reuse over cloning. The reuse it names is `.goal-bar`, `.goal-add` and `.goal-icon-btn` — two of which do not in fact reach the card (UI-01) — while the two components it *did* clone are not mentioned.
- **Impact:** Polish. Nothing fails, nothing is unreadable. It is a fifth headline-figure treatment in a file that already had four, and a second chip that is one pixel and one border away from the first, which is how a design system stops being one.
- **Recommendation:** Point `.debt-total-value` at `var(--t-h2)` and `var(--w-bold)` so the summary reads at the same weight as every other KPI in the app, and bring `.debt-meta-item`'s padding, border and weight into line with `.goal-meta-item` — or, better and no larger, delete `.debt-meta-item` and use `.goal-meta-item`, which is what the `.cost` modifier can then extend. Do not attempt the general font-size sweep; that has been declined four times and this is not it.
- **Effort:** XS

---

**UI-09 — A debt 99.6% repaid prints "100%" beside "₮5,000 still owed"**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8325` and `:8341`
- **Evidence:** `pct = Math.min(100, paid / total * 100)` (`:8325`) is rendered with `pct.toFixed(0)` (`:8341`), which rounds to nearest. `cleared` is a separate and exact test, `outstanding === 0` (`:8326`). Any repayment fraction from 99.5% up prints "100%" while `.debt-remaining` in the same card still shows a non-zero figure and the card keeps its uncleared styling. The bar at `:8347` uses `toFixed(1)` and is therefore fractionally more honest than the number above it. The same shape exists on the goal card at `:8146`/`:8185`; I am reporting it once, here, because this is where it was newly written.
- **Impact:** Small, but it is a headline percentage contradicting the figure beside it on the same card, on the last payment — the moment the user is most likely to be looking. A user who reads "100%" and stops paying is out by the remainder.
- **Recommendation:** Use `Math.floor(pct)` for the displayed integer when `!cleared`, so 100% is printed only when the debt is actually cleared and the `✓ Cleared` state agrees with the number above it. Leave the bar's `toFixed(1)` alone.
- **Effort:** XS

---

**UI-10 — The debt card and the two plain cards it sits between resolve their shadow from different tokens, so their elevation differs in fifteen of sixteen themes**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1527` against `.card` at `:875`; tokens at `:121` and `:146`/`:183`
- **Evidence:** `.card` sets `box-shadow: var(--e1)`. `--e1` is declared once, in `:root` at `:121`, and `grep` for `--e1:` returns exactly that one line — no theme overrides it. `.debt-card` (`:1527`) and `.goal-card` (`:1463`) set `box-shadow: var(--shadow)`, and `--shadow` *is* redeclared by every dark and tinted theme (`:183`, `:375`, `:416`, `:457`, `:498`, `:578`, `:699`, `:740`, …), typically to `0 1px 3px rgba(0,0,0,.4)`. In the default light theme the two agree, because `:146` sets `--shadow: var(--e1)`. In every other theme the debt cards carry a visibly stronger shadow than the add-debt and summary cards directly above them. `.debt-card` also uses `margin-bottom: 14px` where `.card` uses `var(--s3)` (12px).
- **Impact:** `ui-guidelines.md` asks for consistent card shadows. On the Debts screen three card types stack vertically for the first time in the app, which is what makes a long-standing token split visible. Cosmetic; nothing is unreadable and no layout moves.
- **Recommendation:** Set `.debt-card`'s shadow to `var(--e1)` and its `margin-bottom` to `var(--s3)`, matching the `.card`s it is interleaved with — one component, two declarations. The wider question of whether `.card` should track the per-theme `--shadow` is app-wide, has a regression surface of every card in the file, and is not this round's work; record it, do not sweep it.
- **Effort:** XS

---

## Review Areas — Clean or Covered

- **Layout and Hierarchy.** Covered by UI-04. Nothing else competes: the Dashboard is unchanged and carries no debt figure, which is the ruled behaviour and is asserted at `debts.js:137-198`.
- **Navigation.** Clean. All eight modules in `project.md` are reachable by name — four in the tab bar (`:2660-2687`), four in the More sheet, with Debts second at `:2708-2717` carrying a subtitle that says what it is. `titles` (`:4892`), `MORE_TABS` (`:4942`) and the `navigate` branch (`:4962`) all agree, so the header names the screen and the More pill carries `aria-current` while it is open. Every modal has both a `close-x` and a Cancel.
- **Typography.** Covered by UI-08. No other new size was introduced.
- **Colour and Theme.** Clean. `--danger-text` is used for the cost figure on both grounds it appears on, and both pairs — `danger-text`/`surface` and `danger-text`/`surface-2` — are in `tools/check-contrast.mjs:84-85`, so `npm run verify` measures them across every theme. No `rgba()` literal, no `opacity`, no `filter` and no `mix-blend-mode` over any text in the new CSS. Meaning is never carried by colour alone: the cleared card is `✓ Cleared` in words as well as green, and the cost chip is captioned "Interest so far". The cleared card's `color-mix(… 8%, transparent)` gradient ground is copied verbatim from `.goal-card.done` (`:1465`) and is not new exposure.
- **Spacing.** Covered by UI-08 and UI-10. New code uses `--s3` and `--t-micro` in the summary block and literals in the card block; the residual app-wide literal sweep is the standing rejected item and I am not re-raising it.
- **Cards.** Covered by UI-10. Padding and radius match `.goal-card` exactly.
- **Mobile.** Covered by UI-01. Horizontal scroll is genuinely handled: `overflow-wrap: anywhere` on `.debt-name`, `.debt-numbers` and `.debt-total-value`, `min-width: 0` on the head's flex child (`:8333`) and on `.debt-total-item` (`:1559`), `flex-wrap: wrap` on `.debt-meta`, `.debt-foot` and `.debt-totals` — and `debts.js:203-221` asserts `scrollWidth − clientWidth === 0` with an 82-character lender name at `--width 320`. That condition was met.
- **Accessibility.** Covered by UI-01's target size. Otherwise clean: every input on `#debts` has a `<label for>` (`:2508`, `:2510`, `:2512`, `:2522`, `:2524`) and every modal input likewise (`:8394-8398`); the two icon buttons carry `aria-label` as well as `title` (`:8352-8353`); the debt name and all ids go through `escapeHTML`; `confirmDialog` writes with `textContent` (`:4734`), so a lender name cannot inject; the focus ring at `:1138` is on bare `button`, so it still reaches the unstyled debt buttons. The known `#converterUse` disabled-label finding and WORK-141 are unchanged and I am referencing, not re-raising, them.
- **States.** Clean. `#debtList` has an empty state with its own icon (`:8285`, `:9075`); the summary card is hidden rather than zeroed when there is nothing to summarise (`:8284`); the history modal has its own empty case; both destructive actions are confirmed, and the debt one names the number of payments it will take with it (`:8370`). Every write reports through `savedToast(ok, …)`, so a failed save is not announced as a success. There is no async work on this screen, so no loading state is owed.
- **Numbers and Formatting.** Covered by UI-03 and UI-09. Otherwise clean: every amount goes through `fmt` (`:4004-4007`), which puts the sign outside the ₮; no figure on this screen is negative or sign-ambiguous, because each is a positive magnitude captioned in words. Dates render as raw ISO, which is the app-wide convention (`:5168`, `:8761`) rather than a divergence.

## Quick Wins

- **UI-01** — extending four existing selectors restores the 44px target and the primary affordance on the module's main action; nothing else in the report is this cheap for this much.
- **UI-03** — one `Math.min`, and the module's headline number can no longer report a cost the loan did not have.
- **UI-04** — moving one `<div>` above another puts the answer to "how much do I still owe" first, and costs nothing on an empty screen because the card already hides itself.
- **UI-05** — one line in the init block makes the fourth entry date behave like the other three.
- **UI-06** — one ungated sentence stops the summary card appearing to contradict itself before the first payment.

## Estimated UX Impact

Once UI-01, UI-02 and UI-03 land, the Debts screen stops being a well-reasoned module with a broken surface. The payment button becomes a 44px primary control instead of a native OS button, which removes both the mis-tap risk next to a cascade delete and the strong impression that the screen failed to load. A mistyped amount becomes a correction instead of a choice between destroying eight payment records and living with two permanently wrong figures — and the repayment term the form already asks for becomes something the user can read back. The interest figure becomes one that cannot exceed what the loan actually cost, which matters more here than the arithmetic suggests: this module was approved on the argument that a *named* number changes behaviour, and a named number that can be visibly impossible does not. With the Mediums added, a returning user opens Debts and sees what they still owe before they see an empty form, and the summary card stops asking a user with no accounting knowledge to work out for themselves why they owe more than they borrowed. Nothing outside the Debts screen changes, in either direction — which is the property the module was built to have, and which currently holds.
