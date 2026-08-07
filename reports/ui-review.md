# UI Review — Round 13

*(The agent is read-only by role definition — `Read`, `Glob`, `Grep` — so it could not write this file; the text below is its complete report, transcribed unmodified.)*

## Executive Summary

Round 12's seventeen-item roadmap landed, and it landed properly: I verified all thirteen UI-visible items at source rather than accepting the record, and every one is on disk with the shape the architect ruled, including the class-only selector form, the inner-cap interest formula, and the four entry dates set in one place. The Debts module's three High findings and four Medium findings from round 12 are closed, and the assertions that close them are the site-to-site comparison and the 320px overflow flow, both of which now run at the width they claim. What remains on that screen is not structural — it is language. The two Medium findings in this report both sit on the words attached to the one figure `project.md` says the module exists to produce: the gated helper sentence now points at a different quantity from the one it captions, and nothing anywhere tells the user that the interest split is the application's own even allocation rather than the lender's schedule. There is no Critical and no High finding in this review.

## Overall Score

**90 / 100** — Production ready, at the bottom of that band. The band is entered on the absence of Critical and High findings and I found none: the module that was 78/100 with three High in round 12 now has a styled 44px action row, a correction path that preserves its ledger, and a cost figure that cannot exceed what the loan could carry. It is 90 rather than higher because both Mediums are on the caption of the headline figure of the newest core module, and because two of the Lows are guards or comments that state something the code no longer does — the failure class this project has spent four rounds retiring.

## Strengths

Verified at source, not accepted from the record.

- **The class-only selector shape actually reaches both cards, and the assertion can now see it.** `index.html:1540-1551` carries `button.goal-add` and `button.goal-icon-btn` with no ancestor. A grep for both class names across the whole file returns exactly two markup sites — `:8281-8284` and `:8491-8494` — and four rules. `tools/harness/debts.js:154-216` measures both rows and compares `h`, `w` and `backgroundColor` site-to-site with only the guideline's 44 as a literal, and `package.json:16` now carries `--width 320`, so the measurement is taken on a phone rather than at desktop width.
- **The interest cap is the form that was ruled, with the derivation in the comment.** `:8385` is `Math.round(Math.min(debtPaid(d.id), total) * cost / total)` — the inner-cap form — and `:8359-8379` states why the cap exists and why the inner form beats the outer on a hand-edited import. `debts.js:230-268` pays the total exactly, then overpays, and asserts the cost is exactly `totalToRepay − principal` in both cases and that the capped figure reaches the screen.
- **The edit modal is fenced to the six conditions it was approved under.** `:8573-8600` renders exactly five fields; `:9161-9186` mutates in place, repeats the `totalToRepay < principal` refusal with a named message rather than clamping, and touches no payment. `debts.js:279-364` drives it through the real edit button and the shared Save, and reads `debtPaid` through the record's own id rather than the literal — which is the difference between a check that catches orphaning and one that sits green beside it.
- **The reorder cost nothing on the empty case.** `#debtTotalsCard` at `:2559` precedes the add card at `:2564`, and `renderDebts` hides it while `db.debts` is empty (`:8394`), so a first-time user still meets the form first with nothing above it.
- **Modal accessibility is genuinely complete, and the debt modals inherit all of it.** `openModal` at `:4761-4774` pushes history, records return focus, locks scroll and lands on the first real field rather than the close X; `:4804-4818` traps Tab in both directions and routes Escape through the modal's own dismiss control so `confirmDialog` still resolves. Every debt destructive action is confirmed, and the debt delete names the number of payments it will take (`:8512-8515`).

## Findings

There are **no Critical findings** and **no High findings** in this review. Both bands are empty, and I am not filling them.

---

**UI-01 — The cost helper's "That extra" resolves to the agreed extra, not to the figure it sits under**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8441-8444`, under the figure rendered at `:8422-8424`
- **Evidence:**
  - Two helper lines render in sequence under `.debt-totals`. The ungated one (`:8442`) reads *"'Still owed' includes anything you agreed to pay on top of what you borrowed."* The gated one (`:8444`) reads *"That extra is what borrowing has cost you so far, and it is not counted in your Net Balance."*
  - "That extra" has exactly one antecedent in the preceding sentence, and it is *anything you agreed to pay on top of what you borrowed* — `totalToRepay − principal`, the whole agreed difference, which is a constant of the loan.
  - The figure the second sentence is attached to is `totalInterest` (`:8402`, `:8424`), which is `debtInterestPaid` summed — the proportional share of that difference that has been **paid so far** (`:8380-8386`). Before the last payment these are different numbers by construction. On the module's own fixture (`debts.js:67`, principal 1,000,000 / total 1,300,000), after paying 650,000 the agreed extra is 300,000 and the figure printed is 150,000.
  - The label directly above the figure, "Paid in interest" (`:8423`), is correct and points the other way, so the card gives the reader two conflicting cues about what the number is.
  - This is a defect introduced by the WORK-179 rewording, not one it inherited. The sentence it replaced — *"That is money you paid for borrowing, on top of what you borrowed"* — described the figure. Adding an ungated sentence in front of it gave the demonstrative a new and wrong antecedent.
- **Impact:** `project.md:32-35` records this module's reason for existing as *"showing what the borrowing has cost them is the one figure most likely to change what they do"*, and `project.md:68-70` defines the audience as people with little accounting knowledge who get no training. The plainest reading of the pair tells such a reader that the whole extra they agreed to pay is the number on screen — that is, that a 1,300,000 repayment on 1,000,000 borrowed will cost them 150,000. The figure is right; the sentence attached to it halves it. A careful reader recovers from "so far" and from the label, which is why this is Medium and not High.
- **Recommendation:** Reword `:8444` so it names the figure rather than reaching back for a demonstrative — for example *"That is the part of it you have paid so far, and it is not counted in your Net Balance."* One string, no new figure, no change to the `showCost` predicate, no change to the ungated sentence. The architect's WORK-179 condition already anticipated this exact check: *"read the two together and if either restates the other, the gated one is reworded."* The condition was applied to restatement; it should also have been applied to reference.
- **Effort:** XS

---

**UI-02 — Nothing tells the user that the interest split is the app's own even allocation, so the figure will not match what the lender told them**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8380-8386` (the allocation), surfaced at `:8423-8424` ("Paid in interest") and `:8484` ("Interest so far") with no qualifier at either site
- **Evidence:**
  - `debtInterestPaid` allocates cost proportionally: `paid × (totalToRepay − principal) / totalToRepay`. The comment at `:8340-8351` states plainly that this is a chosen allocation and that the alternatives were rejected — *"Charging interest first is what the lender actually does"* — so the file itself records that this is not what the lender does.
  - Neither user-facing string says so. The summary label is "Paid in interest" (`:8423`); the card chip is "Interest so far" (`:8484`). Both are unqualified statements of fact about a specific loan.
  - The consequence is a number that can differ materially from the lender's own statement. Paying 100,000 against the fixture loan produces "Interest so far ₮23,077" on the card; a real amortising schedule front-loads interest and would report a substantially larger figure at the same point.
  - The screen has room for the qualifier and already uses helpers of exactly this kind — `:2569-2572`, `:2584-2586`, `:8442` — so this is an omission in a pattern the screen already follows, not a missing surface.
  - **I am not re-proposing the model.** The proportional allocation, the two-amounts input and the absence of an APR model are all ruled and I am not reopening any of them. The finding is that the ruled model is presented without saying it is a model.
- **Impact:** For a user with no accounting knowledge the two possible readings are both bad: they conclude the app is wrong, or they conclude the lender is overcharging. Either way the figure the module was built to make trustworthy stops being trusted, on the one screen whose behavioural argument depends on the number being believed. The user cannot investigate, because nothing on the screen explains where the split came from.
- **Recommendation:** One short helper under `.debt-totals`, beside the sentence UI-01 fixes: *"We spread the extra evenly across your repayments, so this may differ from your lender's own statement."* No change to `debtInterestPaid`, no second figure, no branch. If a single sentence is preferred over two, fold it into UI-01's rewrite — the two land in the same block and can ship as one string.
- **Effort:** XS

---

**UI-03 — The debt note is the only chip in the application carrying user text with no caption, so it is indistinguishable from app-authored metadata in the same row**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8485`, in the row built at `:8482-8486`
- **Evidence:**
  - `.debt-meta` renders up to three chips of the same component. Two carry app-authored captions: `Borrowed ₮X on YYYY-MM-DD` (`:8483`) and `Interest so far ₮Y` (`:8484`). The third is `${escapeHTML(d.notes)}` with no prefix, no icon and no label (`:8485`).
  - Every other chip built from this component leads with a marker: the goal card's deadline chip opens with 📅 (`:8237`) and its schedule chip with 🔁 (`:8247`).
  - The placeholder invites content that reads exactly like app metadata — *"e.g. 3 month term…"* (`:2590`). A note of "3 month term" sitting third in a row whose first two chips are app-authored facts about the loan reads as a fourth app-authored fact.
- **Impact:** Cosmetic and small. The user cannot tell at a glance which part of the chip row is the app talking and which part is their own note, on the one chip whose content the app cannot vouch for. It also weakens the value WORK-174 was landed for: a note the user cannot identify as their own is a note they will not trust as the loan term they recorded.
- **Recommendation:** Prefix the note chip with a marker, matching the goal chips: `📝 ${escapeHTML(d.notes)}` at `:8485`. One string. Do not add a border or colour modifier — `.goal-meta-item.note` already carries the only declaration this chip needs, which is `overflow-wrap: anywhere` (`:1502`), and the 320px flow seeds an unbroken note against it (`debts.js:472`).
- **Effort:** XS

---

**UI-04 — The two history modals still diverge on the exact behaviour WORK-181 was landed to align, and the debt modal's comment says they do not**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8635-8642` against `:8998-9002`
- **Evidence:**
  - The debt payment-history delete path is `const ok = save(); renderDebts(); … if (ok) openDebtHistoryModal(debtId); else closeEditModal();` (`:8635`, `:8642`). The comment above it at `:8636-8637` states: *"Refreshed in place ON SUCCESS ONLY, matching the goal history modal."*
  - The goal contribution-history delete path is `const ok = save(); openGoalHistoryModal(goalId); renderGoals(); updateBellBadge();` (`:8998-9001`). The refresh is unconditional. `ok` is used only for the toast at `:9002`.
  - So the goal modal does the thing the debt comment describes itself as avoiding: on a failed write it redraws the list without the deleted row while `savedToast` reports `SAVE_FAILED_MSG` (`:3724`), presenting an uncommitted delete as committed alongside a message saying it was not saved.
  - The architect's WORK-181 condition was *"the re-render after a payment delete happens only on a successful `save()`, matching the goal path exactly"*. The debt half was implemented; the goal path it was matched against does not have that property, and the comment now asserts a derivation from a fact that is not true.
- **Impact:** Low and confined to a failure path — the write fails on quota exhaustion or an evicted store, and the banner and toast both speak. Nothing is lost; a reload restores the contribution. The larger cost is the comment: a statement that two paths agree is exactly the statement that stops the next reader checking, which is the class of failure recorded at `HANDOFF.md:318-321` and paid for in three separate rounds of this project.
- **Recommendation:** Make `:8999` conditional in the same shape as `:8642` — `if (ok) openGoalHistoryModal(goalId); else closeEditModal();` — so the comment at `:8636-8637` becomes true rather than being deleted. One line, one function. `renderGoals()` and `updateBellBadge()` stay unconditional, matching `renderDebts()` at `:8635`.
- **Effort:** XS

---

**UI-05 — The required-field asterisk is decoration on four of the five fields that carry it, and no edit modal marks required fields at all**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:2493`, `:2498`, `:2573`, `:2575`, `:2577` against `:2238-2240`; edit modals at `:8583-8592` and `:8902-8908`
- **Evidence:**
  - Five labels carry `<span class="required-mark">*</span>`: goal name, goal target, and the debt form's three required fields. One further site, `sHourly`, carries the mark **and** `aria-required="true"` **and** a helper spelling the rule out in words (`:2239-2240`).
  - The other five carry the glyph only. A grep for `aria-required` across the whole file returns `:2239` and nothing else. There is no legend anywhere explaining what the asterisk means.
  - The two edit modals that enforce the identical rules carry no mark at all. `openDebtEditModal` (`:8583-8592`) labels name, borrowed and total plainly, and the save handler at `:9167-9169` rejects all three when empty or non-positive with a toast. `openGoalEditModal` (`:8902-8908`) is the same shape against `:9115-9116`.
  - The mark is not colour-only — it is a glyph as well as `--danger-text` (`:1962`) — so this is not a colour-encoding finding.
- **Impact:** Small, and it falls on the audience `project.md:68-70` names: an unexplained red asterisk teaches nothing to a user who has not met the convention, and a screen reader announces it as "star" appended to the label with no programmatic requirement behind it. In the edit modals the user learns a field was required only after pressing Save and reading a toast, on forms that enforce three separate rules.
- **Recommendation:** Add `aria-required="true"` to the five inputs whose labels already carry the mark, so the glyph and the accessibility tree agree — five attributes, no visual change. Carry the mark and the attribute into the two edit modals, since they enforce the same rules. Do not add a legend line to each form; the `sHourly` pattern of a helper is right where a rule needs explaining and would be noise repeated five times.
- **Effort:** S

---

**UI-06 — WORK-184(a)'s acceptance condition cannot detect the effect a font-size increase has on a wrap-released element**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1610` and `:1602-1603`; the condition is recorded at `reports/chief-architect.md:707`; the assertion is `tools/harness/debts.js:461-487`
- **Evidence:**
  - `.debt-total-value` moved from 20px/800 to `var(--t-h2)` / `var(--w-bold)` (`:1610`), inside `.debt-total-item { flex: 1 1 40%; min-width: 0 }` (`:1603`) in a wrapping row (`:1602`). The declaration also carries `overflow-wrap: anywhere`.
  - The only condition attached to that change was: *"`npm run debts` at 320 must still report `scrollWidth − clientWidth === 0` after the size increases."* The flow that answers it is the long-lender-name overflow flow, which asserts exactly `de.scrollWidth − de.clientWidth === 0` (`debts.js:478`, `:483`).
  - `overflow-wrap: anywhere` converts overfill into a mid-token line break rather than into overflow. A figure that no longer fits its tile therefore breaks — potentially between digits of a grouped amount — and the page-overflow assertion still reads zero. The condition is satisfied by the failure mode as well as by the success.
  - Nothing anywhere measures the rendered width or line count of `.debt-total-value`. **I have not measured whether it breaks and I am not asserting that it does** — a derived pixel figure has been wrong four times in this project and I am not adding a fifth.
  - Recorded honestly against it: `.kpi .value` has run at the same token with the same wrap release in narrower `.grid-2` tiles for many rounds, and the comment at `:890-896` records that wrapping was deliberately chosen there over sideways scroll. If the debt figure does break, it is behaviour the application already accepts elsewhere, which is why this is a guard finding at Low and not a layout finding.
- **Impact:** No user-visible defect is claimed. The cost is to the record: a condition was reported met on an instrument that cannot see the property the change put at risk, which is the same shape as the three conditions round 12 reopened and `HANDOFF.md:38-50` documents.
- **Recommendation:** Extend the existing 320px flow with one measurement of `.debt-total-item.cost .debt-total-value` — `el.getClientRects().length` — seeded with a seven-figure amount, and assert it is 1. Name the perturbation that reddens it in the flow header, per C40: raise `--t-h2` in `index.html`. Do not change `:1610`; the token is correct and was correctly ruled.
- **Effort:** XS

---

**UI-07 — Analytics: a category excluded from the charts keeps its exclusion when it leaves the date range, but its chip does not render, so the control that would restore it disappears**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7251-7258` against `:7112`, `:7166`, `:7304` and `:7401`
- **Evidence:**
  - `dailyExcluded` is a `Set` of category ids (`:7057`) and is applied by four consumers: the stat strip (`:7112`), the calendar heatmap (`:7166`), the stacked chart (`:7304`) and the day-detail list (`:7401`).
  - `renderDailyChips` builds the chip row only from categories that have data in the current range: `db.categories.filter(c => totalByCat[c.id] !== undefined)` (`:7251-7253`). Nothing adds a chip for an excluded category with no data in the range.
  - Toggling the range does not clear `dailyExcluded` — `initPeriodFilter('daily', renderDaily)` re-renders, and nothing in `renderDaily` (`:7096-7103`) resets the set.
  - The calendar is the site where this bites, because it is not range-filtered: `renderCalendar` reads `db.actual` in full (`:7147`) and navigates by its own month control (`:2464-2468`), while still applying `dailyExcluded` (`:7166`). So a category excluded while one range was active stays hidden from every month of the heatmap after the range moves somewhere it has no data, with no chip on screen and nothing saying a filter is active.
  - There is a recovery: the "All" button clears the set (`:7078-7079`). It is unlabelled as a recovery and a user who does not know a filter is on has no reason to press it.
- **Impact:** Low and reached by a specific sequence, but the failure is the one that costs most trust in an analytics screen — figures quietly excluding data with no visible control and no indicator. `ui-guidelines.md` calls for reduced cognitive load; a filter with no on-screen representation is the opposite.
- **Recommendation:** Render a chip for every id in `dailyExcluded` even when it has no data in the range, appended after the sorted list at `:7259` with its amount shown as `₮0`. That keeps the control adjacent to the state it controls and needs no new component — `.chip.off` already exists and already carries `aria-pressed`. A cheaper alternative if that is unwanted: show a count beside the "Categories" title at `:2447` when `dailyExcluded.size > 0`.
- **Effort:** S

---

**UI-08 — The 320px overflow flow justifies its own fixture with a class that no longer exists and a property that is now false**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\tools\harness\debts.js:467-472`, against `expense-pwa\index.html:1502`
- **Evidence:**
  - The comment reads: *"The note is rendered as a chip, and `.debt-meta-item` declares no `overflow-wrap` of its own, so it needs the same unbroken run as the name or the assertion covers one of the two and looks like it covers both."*
  - `.debt-meta-item` was deleted by WORK-184(b); a grep for it across `index.html` returns only the historical note at `:1477-1483` explaining the deletion. The chip is now `.goal-meta-item` with a `.note` modifier (`:8485`), and that modifier's single declaration is `overflow-wrap: anywhere` (`:1502`).
  - The fixture seed itself (`debts.js:472`) is still correct and still load-bearing — it is what makes the assertion capable of reddening when that declaration is removed. Only the stated derivation is stale.
- **Impact:** None to the user, and the guard still works. It is a probe comment asserting a property of the application that the application no longer has, in the one file whose purpose is to say what the guards guarantee — `HANDOFF.md:424-427` makes naming the guaranteed behaviour in the probe's own header a standing rule.
- **Recommendation:** Update the comment to name the class that now renders the chip and the declaration it now depends on: `.goal-meta-item.note` and its `overflow-wrap: anywhere` at `index.html:1502`. The seed and the assertion are unchanged.
- **Effort:** XS

---

## Review Areas — Clean or Covered

- **Layout and Hierarchy.** Clean. `#debtTotalsCard` now precedes the add form (`:2559` before `:2564`) and hides itself on the empty case (`:8394`), which was round 12's UI-04. The Dashboard's order is unchanged and correct: hero Net Balance, three-tile strip, advisor, then the three charts. Nothing on the Debts screen competes with the summary.
- **Navigation.** Clean. All eight modules in `project.md:17-26` are reachable by name — four in the tab bar (`:2727-2748`), Budget Planning, Debts, Salary Calculator and Settings in the More sheet (`:2758-2812`), with Savings Goals beside them. `titles` (`:4979-4991`), `MORE_TABS` (`:5039`) and `navigate` (`:5040-5061`) agree, so the header names the screen and the More pill carries `aria-current` while a sub-tab is open. Every modal has both a `close-x` and a Cancel, and Android Back closes the top modal rather than the app (`:4731-4759`).
- **Typography.** Clean for this round's changes. `.debt-total-value` is on the scale at `--t-h2` / `--w-bold` (`:1610`) and `.debt-meta-item` is gone. The residual off-scale literals in the goal and debt card blocks (`.goal-name` 17px, `.debt-remaining` 14px, `font-weight: 800`) are the app-wide sweep, declined five times; I am not re-raising it and record that I checked no *new* size was introduced.
- **Colour and Theme.** Clean. The cost figure is painted from `--danger-text` on both grounds it appears on and both pairs are in `tools/check-contrast.mjs`, so `npm run verify` measures them across every theme. No `rgba()` literal fill, no `opacity` on a text-bearing element, no `filter` and no `mix-blend-mode` over text in any of the round-12 code. Meaning is never colour-only: the cleared card says "✓ Cleared" in words (`:8489`), the cost chip is captioned, and the note chip's weakness is a caption problem (UI-03), not a colour one.
- **Spacing.** Clean for this round. `.debt-card`'s bottom margin is `var(--s3)` (`:1578`) and `.debt-totals` uses `var(--s3)` (`:1602`), matching the `.card`s they interleave with.
- **Cards.** Covered by the deferred `--shadow` / `--e1` divergence, which is held behind one screenshot and which I am not re-raising. Padding and radius on `.debt-card` (`:1571`) match `.goal-card` and `.card` exactly.
- **Mobile.** Clean. The four-button action row is the tightest in the application — `.debt-actions` is `display: flex; gap: 6px` with no `flex-wrap` (`:1597`), holding one label button and three 44px squares — and both flows that would catch it are green at `--width 320`: the geometry flow measures the buttons at that width (`debts.js:154-216`) and the overflow flow asserts `scrollWidth − clientWidth === 0` with an unbroken 58-character lender token and an unbroken note (`debts.js:461-487`). I am recording the tightness rather than reporting it, because the measurement exists and says it fits.
- **Accessibility.** Covered by UI-05. Otherwise clean on this round's changes: every input on `#debts` has a `<label for>` (`:2573-2590`) and so does every field in the debt edit modal (`:8583-8592`); all four card buttons carry `aria-label` as well as `title` (`:8491-8494`); focus is `2px solid var(--focus-ring-color)` with an offset on `button:focus-visible` (`:1138-1140`) and reaches every debt control; `escapeHTML` wraps every interpolation on the card and in both modals; `confirmDialog` writes with `textContent` (`:4831`). The known `#converterUse` disabled-label case and WORK-141 are unchanged and I am referencing, not re-raising, them.
- **States.** Clean. `#debtList` has an empty state with its own icon (`:8395`, `:9318`); the summary card hides rather than zeroes (`:8394`); the payment-history modal has its own `.empty` case and a Close button (`:8624`, `:8650`); the per-card "No payments recorded yet." line appears only at zero payments (`:8497`). Both destructive paths are confirmed and the debt one counts what it will take with it (`:8512-8515`). Every write reports through `savedToast(ok, …)`. There is no async work on this screen, so no loading state is owed.
- **Numbers and Formatting.** Covered by UI-01 and UI-02. Otherwise clean: every amount goes through `fmt` (`:4101-4104`), which puts the sign outside the ₮; no figure on the Debts screen is negative or sign-ambiguous, because each is a positive magnitude captioned in words; the headline percentage is `Math.floor` while unsettled on both the debt card (`:8480`) and the goal card (`:8273`), so 100 prints only when the exact terminal flag is set, and both bars keep `toFixed(1)` because a bar is a length rather than a claim.

## Quick Wins

- **UI-01** — one string, and the sentence under the module's headline figure stops describing a different number.
- **UI-02** — one sentence, and the interest figure stops being presented as the lender's arithmetic rather than the app's.

Both are XS and both land in the same block of `renderDebts`, so they can be written and read together.

## Estimated UX Impact

The Critical and High bands are empty, so nothing in this report changes what the user can do — the Debts module works, is reachable, is operable on a phone and cannot be made to report a cost the loan could not carry. What the two Mediums change is whether the user believes the one number the module was built to produce. Today a user six months into a loan reads "Paid in interest ₮150,000" under a sentence telling them that is the whole extra they agreed to pay, and beside a lender's statement that says something different again, with nothing on screen accounting for either gap. After UI-01 and UI-02 the figure says what it is — the part of the agreed extra paid so far, spread evenly by the app — and both discrepancies are explained before the user has to invent an explanation. That is the difference between a number that changes behaviour and a number that gets dismissed, which is the argument the module was approved on. The six Lows are consistency and record-keeping: the user notices none of them individually, and the guard and comment items (UI-04, UI-06, UI-08) matter to whoever reviews this next rather than to the person using it.
