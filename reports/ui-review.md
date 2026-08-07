# UI Review — Round 14

## Executive Summary

Round 13's roadmap is on disk in the shape it was ruled: I verified the disclosure sentence, the `📝` note marker, the eleven `aria-required` attributes, the persistent `₮0` exclusion chip and the gated goal-history re-render at source rather than accepting the record. There is no Critical and no High finding in this review, and the build is fit to ship. What this round turns up is a pattern the last several rounds have not: three screens present a correct figure or a correct control without saying what it is or whether it can act. The single biggest problem is on the Dashboard — **"Left After Plan" is computed on a different basis from the two figures beside it and from the hero figure above it, and nothing on the card says so**, which is the same defect class the architect approved WORK-179 to close on the Debts summary card, still open on the app's most-read surface.

## Overall Score

**90 / 100** — Production ready, at the floor of that band. The band is entered on the absence of Critical and High findings and I found none: every module is reachable, every list has an empty state, every destructive action is confirmed and names its collateral, and every interactive class in the file carries an explicit 44px floor. It is 90 rather than higher because two of the three Medium findings sit on the Dashboard and Analytics — the two screens a user reads most — and both are comprehension defects against `project.md:68-70`, which requires every screen to be understandable without training.

## Strengths

Verified at source, not accepted from the record.

- **The 44px floor is complete, not sampled.** Every interactive component in the stylesheet sets it explicitly: `button.primary/.secondary/.danger` (`:1089`), `input, select, textarea` (`:1072`), `.list-item .actions button` at 44×44 (`:1194`), `button.goal-add` and `button.goal-icon-btn` at 44 and 44×44 (`:1568`, `:1574`), `.chip` (`:1408`), `.chip-mini` (`:1445`), the five `.qa-*` classes (`:1745`-`:1770`), `.cal-nav button` (`:1776`), `.convert-btn` (`:2010`), `.swap-btn` (`:2042`) and `.close-x` (`:2127`). I could not find an interactive class without one. That is unusual and it is why the Mobile area is clean without qualification.
- **Round 13's Debts copy does the job it was approved for.** `:8570` names the figure rather than reaching back for it, and says whose arithmetic produced it, against the allocation at `:8493-8499`. On the committed render `reports/shot-debts-dark-390.png` the summary card reads "Paid in interest ₮200,000" with both sentences beneath it and neither restates the other.
- **Destructive actions name what they will take.** `:8675` counts the payments a debt delete will cascade, `:8412` counts the contributions, `:6142` names the record count and collection, `:6283` names the "Unknown" consequence of deleting a category in use. Every one routes through `confirmDialog` (`:4892`), which resolves on Escape, Back and backdrop.
- **Meaning is never carried by colour alone.** The trend legend repeats ↑/↓ beside the two swatches (`:2252-2253`), Planned-vs-Actual prints "over"/"under" in words (`:7004-7005`), `.chip.off` carries a dashed border and a strikethrough as well as a colour change (`:1441-1444`), and a cleared debt says "✓ Cleared" (`:8651`).
- **Modal mechanics are genuinely finished.** `openModal` (`:4831`) pushes history, records return focus, locks scroll and lands on the first real field; the keydown handler traps Tab in both directions and routes Escape through the modal's own dismiss control (`:4874-4888`); `closeModal` pops exactly the history entry it pushed (`:4859-4863`).

## Findings

There are **no Critical findings** and **no High findings** in this review. Both bands are empty and I am not filling them.

---

**UI-01 — "Left After Plan" is computed on a different basis from every other figure on the Dashboard's headline card, and nothing says so**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:6879-6893`, rendered into the tile at `:2212-2221`
- **Evidence:**
  - The hero figure is `net = totalIncome - totalExp` (`:6852`), and the two tiles beside the third are `totalIncome` and `totalExp` (`:6853-6854`). The third tile is `plannedNet = totalIncome - totalPlanned` (`:6889`). `totalExp` does not appear in it.
  - So on a card with four figures, three are computed on one basis and the fourth on another. Worked from the code with income ₮1,000,000, actual spending ₮900,000, plan ₮300,000: the hero reads **Net Balance ₮100,000** and the tile below it reads **Left After Plan ₮700,000**, painted `var(--success-text)` green by `:6891`.
  - `#kpiPlannedNetSub` exists directly under the value (`:2219`) and is already used to explain the tile in the other state — `'No plan set'` at `:6887`. In the state where a plan exists it is set to the empty string (`:6892`), so the explanation slot is present and deliberately blank in exactly the case that needs it.
  - The comment at `:6875-6878` records that this tile was renamed once already because "Planned Left" read as "budget I still have to spend". The naming was corrected; the basis was not stated.
  - This is the same shape the architect approved WORK-179 to close on `#debtTotalsCard` — two figures on one card computed on two different bases, with nothing saying why — and the remedy ruled there was one ungated sentence, which now ships at `:8568`.
- **Impact:** For the audience `project.md:68-70` names, the plainest reading of a green "Left After Plan ₮700,000" is "you have ₮700,000 left", directly contradicting the larger figure at the top of the same card. The tile is one of three on the app's most-read surface and is the only one whose meaning depends on a budgeting concept the user may not hold. A user who acts on the larger number spends money that is already gone. It is Medium rather than High because both figures are individually correct, both are labelled, and a user who has deliberately built a plan is likelier to hold the concept.
- **Recommendation:** Write the basis into the sub-line that already exists — set `plannedNetSub.textContent` in the `else` branch at `:6892` instead of clearing it, to a sentence that states the arithmetic *and* the thing being misread, e.g. "Income minus your plan — money already spent is not taken off." One string, one branch, no new element, no change to the figure, no change to the `totalPlanned === 0` case. Wording is the implementer's; the requirement is that it names the deduction that is *not* made, because that is the misreading. If a longer string is chosen, note that `.kpi-strip` collapses to one column below 480px (`:1012`) but is a third of the width above it — check it at 320 with the existing width probe rather than deriving a figure.
- **Effort:** XS

---

**UI-02 — The four headline figures on Analytics do not say what they measure, and one of them does not say what it is divided by**

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:7214-7235`, rendered into `#dailyStats` at `:2483`
- **Evidence:**
  - `renderDailyStats` sources `db.actual` or `db.planned` exclusively (`:7200-7203`). No income record can reach any of the four tiles. The tile labels are `Total`, `Daily avg`, `Days logged` and `Peak day` (`:7216`, `:7221`, `:7226`, `:7231`).
  - A grep for "expens"/"spend" inside the Analytics screen returns two hits: the sub-line `with spending` on the third tile (`:7228`) and the empty state `No expenses on this day.` (`:7521`). The screen's four headings — `Categories` (`:2487`), `Daily Breakdown` (`:2497`), `Calendar View — Actual` (`:2503`), `Day details` (`:2518`) — name no quantity, and the segmented control reads `Actual` / `Planned` with no noun (`:2465-2472`). **The screen names what it is about only when it has nothing to show.**
  - The Dashboard, by contrast, labels the same quantity "Expenses" (`:2208`). So the app is explicit on one screen and silent on the other about the same number.
  - Second defect on the same component: `avg = total / daysLogged` where `daysLogged` is the count of distinct dates carrying an entry (`:7209-7210`). "Daily avg" is therefore the average on days the user spent, not the average per day of the selected period. Over a 30-day range with three active days the tile reads roughly ten times the user's actual daily rate. The sub-line "3 active days" (`:7223`) is the only disambiguator and it sits below the figure in `--t-micro`.
- **Impact:** A user arrives on Analytics from a tab labelled "Analytics" and reads "Total ₮840,000" as the first figure on the screen. Nothing tells them it excludes income, and nothing tells them it excludes any category they have switched off with a chip. The "Daily avg" tile is worse than unlabelled — it is labelled in a way that states a rate the app is not computing, on a screen whose purpose is to help the user understand their own spending pace. Both are recoverable by an attentive reader, which is why this is Medium.
- **Recommendation:** Two label strings in one function. Make the first tile's label mode-aware — `Total spent` in actual mode, `Total planned` in planned mode — matching the vocabulary `expFormTitle` already uses at `:5360`. Change `Daily avg` to `Avg per active day`, which makes the label self-sufficient and turns the existing sub-line into reinforcement rather than the only correction. No change to any figure, no new element, no change to the mode toggle.
- **Effort:** XS

---

**UI-03 — Settings → Data Summary offers six full-strength destructive controls that the handler proves cannot act**

- **Severity:** Medium
- **Location:** `D:\7_source: expense-pwa\index.html:6122-6131` and `:6138-6141`; rendered state in `reports/shot-notif-390.png` — full path `D:\3_Claude\PowerApps\expense-pwa\index.html`
- **Evidence:**
  - The clear button is rendered on the sole condition that a row has a `clear` function: `${r.clear ? '<button class="danger chip-mini" …>✕</button>' : ''}` (`:6128`). The record count is not consulted.
  - The handler proves the button is inert in that state: `if (r.count === 0) { toast('Already empty'); return; }` (`:6141`). The application knows the control cannot do anything and paints it anyway.
  - The committed render at 390px (`reports/shot-notif-390.png`) is an empty store, and it shows six saturated red `.danger` buttons — beside `Income entries 0`, `Actual expenses 0`, `Planned expenses 0`, `Salary calculations 0`, `Goal contributions 0` and `Debt payments 0`. They are the largest and most saturated elements on the card; the counts they sit beside are single grey digits. The explanation of what they are — *"Use the ✕ buttons to force-clear a data type if something feels stuck. Non-reversible — export first."* (`:2724`) — is rendered **below** all six.
  - `Categories 9` and `Income types 6` carry no button, so the same card also teaches, silently, that a red ✕ marks a row that can be destroyed — while showing it beside every row that cannot be.
  - The application already has the opposite pattern one screen away: `renderDebts` hides `#debtTotalsCard` entirely rather than showing zeroes (`:8507`), on the stated ground that a figure with nothing behind it implies a question that was not asked.
- **Impact:** This is the card an untrained user meets on a fresh install, on the screen where the app is simultaneously asking them to take backups seriously. The loudest thing on it is a column of destructive buttons, and every one of them is dead. The two available readings are both bad — "something is wrong with my data" or "let me press one and see" — and the second lands on a confirmation dialogue for an irreversible action. Hierarchy is inverted: the control outweighs the information the card exists to give.
- **Recommendation:** Gate the button on the count as well as the capability — `${r.clear && r.count > 0 ? … : ''}` at `:6128`. Six destructive controls leave the empty state, and the affordance stays exactly where it can act. Keep the `r.count === 0` guard at `:6141` as belt-and-braces and say so in a comment, matching how `renderSettings()` was kept at `:6146`. The `👁 View` button on the Salary row is the same shape at a much lower cost — opening an empty list is honest — so I am not recommending a change to it; it is noted so the decision is deliberate rather than overlooked.
- **Effort:** XS

---

**UI-04 — Two buttons share one flex row in Data Summary with neither setting its own width, so the same ✕ renders at two sizes in one card**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:6125-6129`, against the convention stated at `:1092-1107`
- **Evidence:**
  - The shared button rule sets `width: 100%` (`:1108`) and its own comment states the rule this violates, in the file's own words: *"every button that sits beside another element sets its own width. No exceptions … a button dropped into a flex row claims the whole row unless told otherwise, and flex-grow cannot rescue its sibling once free space is negative."*
  - `renderDataSummary` puts `👁 View` and `✕` inside one `display:flex` span (`:6125-6129`). Neither carries a width, and `.chip-mini` (`:1445`) sets padding, radius and minimums but no width. Every other row has one button in that span.
  - In the committed render `reports/shot-notif-390.png`, the ✕ on the "Salary calculations" row is visibly wider than the ✕ on the rows above and below it, which are the same class with the same content. **I have not measured it and I am claiming no pixel figure** — a derived pixel figure has been wrong four times in this project. The observation is the relative difference visible in the render.
  - The file already carries the fix pattern for exactly this: `#sHistory, #dayDetailClose, #settingsThemeBtn { width: auto; flex: 0 0 auto; }` (`:1117`), and `#dayDetailClose` is itself a `.chip-mini`.
- **Impact:** Small. One control renders at two sizes inside one card, which reads as a rendering fault rather than as a distinction, on the screen whose job is to report the state of the user's data accurately. It also means the destructive control is largest on the one row that has a non-destructive neighbour.
- **Recommendation:** Give both buttons in `renderDataSummary` an explicit `width:auto`, on the `:1117` precedent. Do not add `width: auto` to `.chip-mini` itself — that class is used by the chip-row All/None buttons, the day-detail Close and the notification permission button, and changing it would move four sites to fix one.
- **Effort:** XS

---

**UI-05 — The two edit modals mark their required fields to assistive technology only; no sighted user sees a mark**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8745-8750` and `:9071-9077`, against the rule stated at `:1988-2001`
- **Evidence:**
  - A grep for `aria-required` returns eleven inputs: the six add-form fields (`:2279`, `:2534`, `:2539`, `:2614`, `:2616`, `:2618`) and five in the two edit modals (`:8746`, `:8748`, `:8750`, `:9072`, `:9077`).
  - A grep for `required-mark` returns six labels — exactly the six add-form fields. The five modal fields carry the attribute and no glyph: `<label for="mDebtName">Who lent it</label>`, `<label for="mDebtPrincipal">Amount borrowed (₮)</label>`, `<label for="mDebtTotal">Total you will pay back (₮)</label>`, `<label for="mGoalName">Name</label>`, `<label for="mGoalTarget">Target Amount (₮)</label>`.
  - The stylesheet's own comment above `.required-mark` states the rule the shipped state breaks: *"The asterisk is PAINT. `aria-required="true"` on the input is the fact … the two must be applied together or the glyph is decoration"* (`:1988-1991`). The inverse case — the fact with no paint — is the same rule failing in the other direction, and the comment does not anticipate it.
  - The save handlers do enforce all five: `:9306-9307` for the goal branch, and the debt branch refuses name, principal and total with named toasts.
- **Impact:** Low and confined to correcting an existing record. A sighted user editing a debt has no signal that three of five fields are required until Save fails and a toast tells them one at a time. Every add form in the application marks the same fields; the modals that enforce the identical rules do not, so the application teaches a convention on one surface and drops it on the other.
- **Recommendation:** Add `<span class="required-mark">*</span>` to the five labels that already have the attribute behind them. Five spans in two template literals, no CSS, no change to any handler and no visual change to the six sites that already carry both. Do not add a legend — the `sHourly` helper at `:2280` is the right pattern where a rule needs words, and repeating it five times is the noise that pattern exists to avoid.
- **Effort:** XS

---

**UI-06 — The reminders sheet redraws itself after a failed save, presenting an uncommitted write as committed — the one thing the two history modals now say must not happen**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:4725-4729` and `:4744-4748`
- **Evidence:**
  - "→ Mark as Actual" writes a record into `db.actual`, then either advances `p.recLastDone` or deletes the plan, then runs `const ok = save(); updateBellBadge(); openNotifModal(); renderExpenses(); renderDashboard(); savedToast(ok, msg);`. `openNotifModal()` is not gated on `ok`.
  - "✓ Add ₮X" pushes a `goalContribution`, sets `recLastLogged`, and does the same at `:4744-4748`.
  - On a failed write the sheet therefore redraws with the reminder gone or re-dated — the visual statement that the action completed — while the toast beside it reads `SAVE_FAILED_MSG`, *"Not saved — see the banner at the top"* (`:3763`).
  - The two history modals were brought into line in round 13 and both now carry the rule in prose. `:8798-8803`: *"a modal that re-rendered after a FAILED save would present a list the store never accepted as though it had been committed — so a failure leaves the dialog as it was and the save-error banner speaks for it."* `:9181-9186` says the same. Both then gate on `ok` (`:8811`, `:9187`). The reminders sheet is the third modal with an in-place refresh after a write, and it does not.
  - The two background renders on those paths (`renderExpenses`, `renderDashboard`, `renderGoals`) are ruled and I am not reopening them; the finding is the modal.
- **Impact:** Low and reachable only on a failed write — quota exhaustion or an evicted store. Nothing is lost and a reload restores the true state, and the banner is up. The cost is that at the moment the user most needs a single clear answer, the sheet and the toast tell them opposite things, in the one place where the app has already decided that must not happen.
- **Recommendation:** Gate both calls the way the sibling paths are gated: `if (ok) openNotifModal(); else closeModal(document.getElementById('notifModal'));` at `:4727` and `:4746`. Two lines, one function, no new state. If it is preferred to leave the sheet open on failure, then the two history-modal comments need a sentence saying why this modal is treated differently — but the cheaper and more consistent answer is to match them.
- **Effort:** XS

---

**UI-07 — Keyboard focus is dropped to `<body>` whenever a modal redraws its own body after an action inside it**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:8811` (debt payments), `:9187` (goal contributions), `:4727` and `:4746` (reminders), against `openModal:4831-4843`
- **Evidence:**
  - `openModal` returns immediately when the element already carries `.show` (`:4832`), so the re-entrant calls at the four sites above refresh the modal's `innerHTML` and never reach the focus line at `:4843`.
  - The control that was activated lives inside the replaced subtree — `[data-debt-pay-del]` inside `#editModalBody`, `[data-del-contrib]` inside the same, `[data-convert-planned]` and `[data-log-goalrec]` inside `#notifBody`. Removing the focused element leaves `document.activeElement` as `<body>`.
  - `confirmDialog` does restore focus to the delete button before it resolves (`closeModal:4852-4853`), so the loss happens after the confirmation, on the re-render.
  - The Tab handler recovers, but only on the next keypress and only to the top of the dialog: `if (!inside) first.focus()` (`:4883-4886`), and `first` is the close X.
- **Impact:** Low, and it falls entirely on keyboard and switch users. Deleting three payments from a history modal costs three trips from the close X back down the list, with no announcement that anything happened in between. It is not a block — every control remains reachable — which is why it is Low rather than higher.
- **Recommendation:** Restore focus at the four re-render sites to a stable element inside the dialog. The cheapest correct form is one small helper called after each refresh that focuses the modal's own dismiss control, or the list container if it is given `tabindex="-1"`. **I am deliberately not proposing the general case:** the same loss happens on every list re-render after a delete on the Debts, Goals, Income and Expenses screens, and closing that would be an app-wide sweep, which the standing decision forbids. Four modal sites is a correction; the sweep is not.
- **Effort:** S

---

**UI-08 — `.goal-card`'s bottom margin was left off the spacing scale when its twin's was fixed**

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html:1489` against `:1604`
- **Evidence:**
  - `.debt-card` is `box-shadow: var(--shadow); margin-bottom: var(--s3);` (`:1604`), changed last round with the reason recorded at `:1598-1603`: *"the plain `.card` rules this is interleaved with use the token."*
  - `.goal-card` is `box-shadow: var(--shadow); margin-bottom: 14px;` (`:1489`) and is otherwise declaration-for-declaration identical to `.debt-card` — same `background`, same `border`, same `border-radius: var(--radius)`, same `padding: 16px`, same shadow token.
  - `.goal-card` interleaves with a plain `.card` in exactly the same way `.debt-card` does: `#goalList` (`:2571`) follows the New Goal `.card`, whose own `margin-bottom` is `var(--s3)` (`:876`). So the Goals screen renders a 12px gap between the form and the first goal card and a 14px gap between goal cards; the Debts screen renders 12px throughout.
  - Rounds 12 and 13 spent four items deliberately merging these two components — the chip (`:1503-1512`), the two action-button rules (`:1546-1565`), the percentage rounding widened to both cards. This is the one resolved value on which they still differ, and it is the property that was changed on one of them.
- **Impact:** None to comprehension; two pixels between cards on one screen. The cost is to the invariant: `ui-guidelines.md:37` asks for an 8px system, and the pair of components the last two rounds were spent unifying is no longer unified. It is the "close the case, leave the class" shape the architect ruled against when widening WORK-185 to both cards.
- **Recommendation:** Change `:1489` to `margin-bottom: var(--s3);`. One declaration. **This is not the app-wide spacing sweep and must not be read as it** — that remains correctly rejected and I am not re-raising it. It is the sibling of a rule edited last round, on the one property that now diverges between two components deliberately made identical.
- **Effort:** XS

---

## Review Areas — Clean or Covered

- **Layout and Hierarchy.** Covered by UI-01 and UI-03. Otherwise correct: the Dashboard runs hero → three-tile strip → advisor → three charts, and `#debtTotalsCard` precedes the nine-control add form (`:2599` before `:2604`) while hiding itself on the empty case (`:8507`).
- **Navigation.** Clean. All eight modules in `project.md:17-26` are reachable by name — four in the tab bar (`:2767-2788`) and Budget Planning, Debts, Salary Calculator and Settings in the More sheet (`:2798-2852`), with Savings Goals beside them. `titles` (`:5050-5062`), `MORE_TABS` (`:5110`) and `navigate` (`:5111-5132`) agree, the More pill takes `aria-current` while a sub-tab is open, `screenTitle` follows the Expenses mode toggle, and the tab press resets a sticky Planned mode (`:5087`). Every modal has both a close X and a Cancel/Close, and Android Back closes the top modal (`:4821-4829`).
- **Typography.** Clean for this round. No new off-scale size was introduced by any round-13 item — the disclosure sentence, the note marker and the exclusion chip all reuse `.helper` and `.goal-meta-item`. The residual literals in the goal and debt card blocks (`.goal-name` 17px, `.debt-remaining` 14px, `font-weight: 800`) are the app-wide sweep, now correctly declined for a sixth round; I checked that no new one arrived and am not re-raising it.
- **Colour and Theme.** Clean. Round 13 added no fill, no `opacity` on a text-bearing element, no `filter` and no `mix-blend-mode` over text, so the C22 property holds. The `📝` chip inherits `.goal-meta-item.note` (`:1528`), whose only declaration is `overflow-wrap`; the `₮0` exclusion chip reuses `.chip.off` (`:1441-1444`), whose token pairs are already in `check-contrast.mjs`. Income/expense/warning semantics are stable across screens. The known `#converterUse` disabled-label exposure is referenced, not re-raised.
- **Spacing.** Covered by UI-08 for the one divergence; otherwise clean for this round's changes.
- **Cards — including the ruling on the deferred item WORK-186(b).** Padding and radius are identical across `.card`, `.goal-card` and `.debt-card` at resolved values.

  **The WORK-186(b) trigger has fired, and I am ruling on it.** The trigger was *"one screenshot of the Debts screen in one dark theme at 390px"*; that screenshot exists at `reports/shot-debts-dark-390.png` and I opened it. Three facts settle the item:

  1. `:root` declares `--shadow: var(--e1)` (`:146`), and `--e1` is declared once at `:121` and never overridden by any theme. `--shadow` is overridden in exactly **eight** theme blocks — `:183` dark, `:375` midnight, `:416` slate, `:457` oled, `:498` nord, `:578` peacock, `:699` owl, `:740` gold. **In the other eight themes `.debt-card`, `.goal-card` and `.card` resolve to byte-identical shadows.** The round-12 finding's premise — *"`--shadow` is redeclared by fifteen themes"* — is wrong on the file, and correcting it halves the item before anything is measured.
  2. In the render, a `.debt-card` and the plain `.card` above it are stacked with the standard gap and **no elevation or edge difference is perceptible between the two card families.** So neither branch the deferral named is selected: the debt cards do not read as floating, and the plain cards do not read as flat relative to them. Both read the same.
  3. `.debt-card` (`:1604`) matches `.goal-card` (`:1489`), the component it was modelled on and whose chips and buttons rounds 12 and 13 deliberately merged with it. Converging `.debt-card` alone would break that; converging both is the app-wide elevation question that was already rejected as out of scope.

  **Ruling: close WORK-186(b). There is no user-visible defect in any of the sixteen themes and no fix is owed.** The one consequence worth acting on is that the comment at `index.html:1598-1603` still says the question is *"deferred behind one screenshot"*, which becomes false the moment this is recorded — it should carry the measurement instead. I have not raised that as a finding because it is a comment, and it rides free in whichever commit closes the item.

  **WORK-141** is closed on measurement and I am referencing it, not re-raising it.
- **Mobile.** Clean — see Strengths. Both committed renders are at 390px and neither shows horizontal overflow; the Debts screen's four-button action row and the long-name/long-note case are guarded at `--width 320` by the existing flow.
- **Accessibility.** Covered by UI-05 and UI-07. Otherwise clean: every input on every screen has a `<label for>` or an `aria-label` — including `#curPickSearch` (`:2892`), the two converter side buttons (`:2908`, `:2917`) and the four filter-row presets; the focus ring is a solid 2px outline with an offset on a token that cannot fail by construction (`:1163-1166`, derivation at `:124-142`); `escapeHTML` wraps every interpolation on the debt and goal cards and in both edit modals; `confirmDialog` writes with `textContent` (`:4901`); tab labels are their own visible text, which is why the `aria-label`s were removed (`:2761-2766`).
- **States.** Clean apart from UI-03 and UI-06. Every list has an empty state, and Income and Expenses additionally distinguish "empty" from "empty because of the filter", with a "Show all time" escape hatch (`filteredEmptyState:9532`). The only async surface with a wait — the rate fetch — has a loading state, a cached state, a stale state and an error state that says what to do (`:8048-8082`). Every destructive path is confirmed and every write reports through `savedToast(ok, …)`.
- **Numbers and Formatting.** Covered by UI-01 and UI-02 for what the labels say; the formatting itself is clean. Every amount goes through `fmt` or `fmtCompact`, both of which take the magnitude first and re-apply the sign outside the ₮ (`:4199-4209`), so no figure is sign-ambiguous. The unit of record is the whole tugrik and the boundary is stated once at `:4225-4239`. Percentages use `Math.floor` while unsettled on both the debt card (`:8610`) and the goal card (`:8370`), so 100 prints only when the exact terminal test is true, while the bars keep `toFixed(1)` because a bar is a length rather than a claim.

## Quick Wins

- **UI-01** — one string into a sub-line element that already exists and is currently blank; the app's headline card stops offering two answers to "how much do I have".
- **UI-02** — two label strings in one function; the Analytics screen starts saying what its four figures measure, using vocabulary the Expenses screen already uses.
- **UI-03** — one conditional in one template; six inert destructive controls leave the first-run Settings screen and the affordance stays where it can act.

All three are XS, all three are strings or a predicate, and none touches a stored value or a calculation.

## Estimated UX Impact

The Critical and High bands are empty, so nothing here changes what a user can do: every module is reachable, every figure is arithmetically correct, and nothing loses data. What the three Mediums change is whether the user can act on what they read. Today a user with a plan and a month of spending behind them sees ₮100,000 at the top of the Dashboard and a green ₮700,000 immediately below it, taps through to Analytics and reads a "Total" that silently excludes their income and a "Daily avg" that is roughly ten times their actual daily rate, then opens Settings and finds the loudest thing on the screen is six red buttons that do nothing. After UI-01 through UI-03 each of those figures says what it is, in the vocabulary the rest of the application already uses, and the destructive controls appear only where they can act — which is the difference between a dashboard a user checks and one they learn to distrust. The five Lows are consistency and failure-path work: UI-05 and UI-07 are felt only by users editing records with a keyboard or a screen reader, UI-06 only on a failed write, and UI-04 and UI-08 are two components that should look identical and do not.
