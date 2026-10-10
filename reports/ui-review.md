# UI Review: Whole Application (v27)

**Scope.** I reviewed the whole interface in `D:\3_Claude\PowerApps\expense-pwa\index.html` as deployed at v27 (`D:\3_Claude\PowerApps\expense-pwa\sw.js`). That covers:
- the four tab screens: Home, Income, Expenses / Budget Planning and Analytics;
- the five More destinations: Accounts, Budget Planning, Debts, Savings Goals, Salary Calculator and Settings;
- the bell sheet, the More sheet, and the shared edit and confirm modals.

I measured it against `knowledge/ui-guidelines.md` and `knowledge/project.md`.

**Evidence basis.** This is a source review. I took no new renders, and any figure that depends on a render says so.

**Not reopened.** These stay closed:
- every Debts ruling;
- the Round 18 ruling (`reports/chief-architect.md`);
- the Accounts, Envelopes and Phase 2 rest rulings, including R1.6: Data Summary bulk clears are left as they are, and any limit on them is off limits;
- the owner's "keep reminding" answers;
- the deferred Budget Planning heading total;
- the "convert when next edited" rules for emoji, font sizes and date controls (WORK-32, 33 and 34 were rejected).

Where a finding touches a recorded decision, it names that decision and gives the new argument.

**Round 18 carry-over, checked at source.** Every approved Round 18 UI item is in the file:
- the hero sentence reads "You spent ₮X more than you earned" (`:8637`);
- the notification prefs wire every control (`:7952`);
- the drag starts on a grip (`:1288-1298`);
- the Budget pane has no arrows (`:8779-8786`);
- the calendar scrolls the day detail into view (`:9169`);
- the sarcastic quotes are gone (`:10120-10167`);
- the advisor makes no unsourced statistical claims (`:8170-8173`);
- Income and Actual show a total in the heading (`:6882`, `:7405`);
- Salary uses `.form-row` (`:2793`);
- Goals sits behind a disclosure (`:3110`);
- Reset names what it erases (`:8147`);
- the bell count is announced (`:5930`).

---

## Executive Summary

The interface is in better shape than at Round 18. Every High from that round is fixed. Contrast is measured across sixteen themes, and the Accounts dialogs explain their consequences in plain words.

The weak points now sit where state outlives its moment:
- the page keeps its scroll position across screens;
- the app's idea of "today" is fixed when it launches;
- deleting a goal quietly reverses money that left an account.

**The single biggest problem is that switching screens never resets the scroll position.** Tap Home from halfway down Expenses or Settings and Home opens with its headline figure above the viewport. The app's most important number is missing on arrival, and the first-screenful guarantees the project has measured only hold at scroll position zero.

There are no Critical findings. There are three Highs, all S or XS.

---

## Overall Score

**73 / 100: Usable but fragile.**

Three High findings sit in core flows that every user hits: navigation, adding an entry, and finishing a goal. That places the score in the 60-74 band. It stays at the top of the band because there are only three Mediums and five Lows. The base is also sound: modals, focus, contrast, confirmations, empty and filtered-empty states, and money formatting. Every High has a small fix that changes no stored schema.

---

## Strengths

- **The Accounts dialogs explain consequences instead of just refusing.**
  - The limit dialog states the balance, the cost and the shortfall, and offers a Move capped at what the donor account holds (`confirmSpend`, `:10508-10541`).
  - Every three-way dialog opens with Cancel focused.
  - Long refusals wait in a dialog instead of a fading toast (`refuseInDialog`, `:10474-10479`).
- **The add forms mark and focus the field they refuse.** `refuseField` (`:5663-5671`) replaced toast-only errors on Income, Expenses, Goals, Debts, Accounts and Move money.
- **Contrast is measured, not claimed.** Hover fills, the hero scrim, the heatmap ceiling and the focus ring are all derived per theme, and opacity over text is banned because it cannot be measured (`:156-175`, `:928-1000`, `:1186-1206`, `:1558-1586`).
- **Destructive actions are confirmed, and the confirmations name what goes with them.**
  - Split moves are named on income delete (`:6916-6927`).
  - Every occurrence is named on recurring-plan delete (`:7487-7490`).
  - Goal contributions are counted (`:10285-10287`).
  - Reset uses two steps (`:8147-8150`).
- **Empty states never misstate the user's data.** `filteredEmptyState` separates "none in this period" from "none at all" and offers "Show all time" (`:13470-13494`).

---

## Findings

### UI-01: Switching screens keeps the previous scroll position, so the destination opens part-way down the page

- **Severity:** High
- **Location:** `navigate()` at `D:\3_Claude\PowerApps\expense-pwa\index.html:6650-6672`. It affects every screen, reached from the tab bar or the More sheet (`:6613-6647`).
- **Evidence:**
  - All screens share the document's scroll. `.screen` sections toggle `display` inside one `<main>` (`:883-885`).
  - `navigate()` swaps the active section and re-renders, but never scrolls. A search for `scrollTo`, `scrollTop` and `scrollIntoView` finds only two `scrollIntoView` calls, both for the Analytics day-detail card (`:9169`, `:9351`).
  - So `window.scrollY` carries over, clamped to the new page's height. Example: scroll down the Expenses list or Settings to Backup, then tap Home. Home opens with the "Left over" hero, the KPI strip and the advisor above the viewport, showing the charts card.
  - The project's own geometry guarantee for Debts is defined "at scroll position zero" (`reports/archive-chief-architect-round17.md:38`). Arriving from another screen does not produce that position.
- **Impact:**
  - "Most important information first" fails on arrival at every one of the eight modules, after any scrolled visit to another screen. That is normal use on a phone.
  - On the primary journey, a user tapping Expenses from a scrolled screen can land with the Amount field above the fold.
- **Recommendation:** In `navigate()`, call `window.scrollTo(0, 0)` when the destination differs from the screen that is currently active.
  - Leave same-screen calls alone. The import handler's `navigate(current)` (`:8120`) and the `setExpMode` toggle keep the user's place.
  - `confirmSpend`'s Move hand-off still works: it focuses `#trAmount` after navigating, and focus scrolls that field into view.
- **Effort:** XS

### UI-02: The app's "today" is fixed at launch, so after a night in the background new entries get yesterday's date and "This Month" shows last month

- **Severity:** High
- **Location:**
  - Date fields are prefilled once at boot: `D:\3_Claude\PowerApps\expense-pwa\index.html:13529-13532` (`sDate`, `incDate`, `expDate`, `debtDate`).
  - Range presets are computed only at boot or on change: `initPeriodFilter` `:5576-5606`, `computeRange` `:5460-5474`.
  - The only `visibilitychange` handler flushes saves and nothing else: `:4674-4676`.
- **Evidence:**
  - `incDate` and `expDate` are set to `todayISO()` once at boot. No later code writes them. `debtDate` is reset only after a debt is added (`:12381`).
  - The add handlers store the field's value (`:6834`, `:7351`), so a stale prefilled date is saved as typed.
  - Non-custom presets turn into fixed `from`/`to` values in the filter inputs, and `getRange` reads those inputs (`:5475-5480`). The comment "presets recompute (so 'This Month' stays fresh)" (`:5576`) is true only on a cold start.
  - Other parts of the app read the clock live: the bell (`computeReminders`, `:5742`, refreshed every 30 minutes at `:13523`), the advisor (`:8185`) and account balances (`accountBalance`, `:10306`).
  - So a PWA resumed after midnight has a bell that says "Today" and an Add form prefilled with yesterday. After a month boundary, Home's preset still says "This Month" while the header shows last month's dates.
- **Impact:**
  - The installed PWA is the recommended way to run the app, and phones routinely resume it without reloading.
  - The most frequent act in the app, adding an expense, then writes a wrong date into a financial record without saying so. On the 1st of a month it files the entry under the previous month's totals, budget comparison and trend.
  - I rate this High rather than Critical because the date is visible on the form and on the row, and the user can correct it.
- **Recommendation:**
  1. On `visibilitychange` to visible, compare `todayISO()` with the day last seen.
  2. If the day has changed, re-apply every non-custom preset through the existing `applyPreset` path and re-render the active screen.
  3. In the same handler, move any untouched date field that still holds the old day to today. Leave a date the user typed alone.

  No new control is needed.
- **Effort:** S

### UI-03: Deleting a goal quietly returns all its contributions to the account they were paid from, and the advisor recommends that delete

- **Severity:** High
- **Location:**
  - Goal delete: `renderGoals` `D:\3_Claude\PowerApps\expense-pwa\index.html:10281-10293`.
  - `accountBalance` subtracting contributions: `:10312`.
  - Contribution "Paid from": `:12512-12513`.
  - Advisor "Goal reached" tip: `:8448-8454`.
- **Evidence:**
  - Since P3 (R3), a contribution can carry an `accountId`, and `accountBalance` subtracts it from that account.
  - The goal delete removes every contribution (`db.goalContributions = …filter(c => c.goalId !== g.id)`), so each paying account goes back up by everything the goal ever took.
  - The confirm reads only `Delete "X" and all N contributions? This cannot be undone.` Nothing says an account balance will change.
  - The R1 rule warns only when a change takes money away (`accountShortfalls`, `:10438-10443`). This change adds money, so no warning ever fires.
  - When a goal is reached, the advisor tells the user: "Delete it or start a fresh goal to keep momentum."
- **Impact:**
  - A user saves ₮1,000,000 for a phone out of "Needs", reaches the goal, buys the phone, and deletes the goal as advised.
  - "Needs" now shows ₮1,000,000 that does not exist. The spending limit, which is the point of envelopes, lets that money be spent a second time.
  - Nothing on screen links the jump in the balance to the delete.
- **Recommendation:** These are corrections only, not a redesign:
  1. When any of the goal's contributions names an account, the delete confirm adds one sentence in the style of the income and debt deletes, for example: "The ₮1,000,000 paid into it from Needs goes back into Needs."
  2. Reword the advisor tip to "Start a fresh goal to keep momentum", so the app stops recommending the act.

  Whether a deleted goal should keep its contributions is a design question for the architect. Neither change above depends on the answer.
- **Effort:** S

### UI-04: The advisor's savings rules ignore Savings Goals, so people who save through Goals get a red "Savings only 0%" tip and are told to set up the goal they already have

- **Severity:** Medium
- **Location:** `analyzeExpenses`, `D:\3_Claude\PowerApps\expense-pwa\index.html:8202-8229` (Needs/Wants/Savings rule) and `:8341-8347` (emergency fund rule). Sort order: `:8500-8502`.
- **Evidence:**
  - `byGroup` is built from `actual` only. Goal contributions are never written to `db.actual` (`:13210`, `:6166`), and a search finds only one `db.actual.push`, at `:5970`.
  - A user who saves only through Savings Goals therefore scores `sPct = 0`. If they have any spending in the period, they get the **critical** tip "Savings only 0% of spending — Below 10% is risky… Set up a goal with a recurring contribution to force the habit." Critical tips sort first, so this is the top advisor line on Home.
  - The figure is a share of *spending*, but the tip cites the 50/30/20 guideline, which is a share of *income*.
  - The emergency-fund rule matches only goal names against an English pattern (`/emergen|rainy|safety|buffer|reserve/i`). It fires for a user who logs to the default **"Emergency Fund"** category (`:3730`) and for any goal named in Mongolian.
- **Impact:** The guidance card on the main screen contradicts what the user is visibly doing in a module the app ships. People who follow the app's advice see the worst-graded tip in red for as long as they keep doing so. This costs trust on the card that is the only first-run guidance.
- **Recommendation:**
  - Count goal contributions dated in the period toward the Savings figure. These are period-dated user records with no debt in them, so the off-limits rule that keeps debt out of `analyzeExpenses` (Round 13) is not touched.
  - Treat spending in the default Emergency Fund category as having an emergency fund.
  - Leave every other rule alone.
- **Effort:** S

### UI-05: Salary Calculator's "Save & Add as Income" records no account and never splits, so for an envelope user the main income skips the envelopes

- **Severity:** Medium
- **Location:** `sSave` handler at `D:\3_Claude\PowerApps\expense-pwa\index.html:6747-6828` (income write at `:6808`). The C8 note is at `:4201-4205`. The edit sheet's no-re-split helper is at `:12781`.
- **Evidence:**
  - The salary write pushes an income with no `accountId` and no split moves.
  - The edit sheet cannot fix this afterwards: "Editing it does not split it again. To split it differently, delete this income and add it again."
  - C8 (`chief-architect-accounts.md`) recorded the salary path as accountless *in Phase 1*. That was before Envelopes (v26) made splitting income on arrival the main act of the account model.
- **Impact:**
  - A user with envelopes who uses the Salary Calculator, a core module, gets the salary recorded under no account, so none of it reaches the envelopes.
  - Assigning the account later in the edit sheet still does not split it.
  - The only correct path is to delete the salary income and re-enter the net figure on the Income screen. The calculator's output then no longer matches its own income entry.
- **Recommendation:**
  - When accounts exist, show "Into account" on the Salary screen, plus the split rows when other accounts have shares. Reuse `fillAccountSelect` and the Income form's split rendering, so the Salary save writes what Add Income would.
  - This needs a ruling first, because C8 is a recorded decision. The new argument is that Envelopes postdates C8, and the edit path cannot split afterwards.
- **Effort:** M

### UI-06: Refusals inside edit sheets and the Settings add fields are still a toast only, with the field neither marked nor focused

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`:
  - `saveEditGoal` `:12897-12908`
  - debt edit `:12954-12956`
  - debt payment `:13129`
  - log plan `:13172`
  - contribution `:13202`
  - `saveEditEntry` `:13234`
  - Settings `catAdd` `:7504` and `incomeTypeAdd` `:7535`

  Toast styling is at `:2483-2492`; the sheet styling is at `:2527-2540`.
- **Evidence:**
  - Each branch is `toast('…'); return;`. The modal sheet anchors at the bottom of the screen (`align-items: flex-end`), and the toast draws over it at `bottom: 90px` with `z-index: 100`, then fades.
  - WORK-14 approved the field-marking fix for the add forms only, and `refuseField` now exists as the shared helper.
- **Impact:**
  - On the debt edit sheet (name, two amounts, dates, schedule) and the goal edit sheet (recurrence block), a user who misses the toast sees Save do nothing.
  - They then have to scroll the sheet to find the empty field.
  - The same act behaves differently depending on whether it is an add or an edit.
- **Recommendation:** Replace each `toast(msg)` with `refuseField('<fieldId>', msg)`. The helper already marks the field, sets `aria-invalid`, focuses it and clears the mark on input. No new component is needed.
- **Effort:** S

### UI-07: The money-move refusal says "has only ₮0" when the source account is negative

- **Severity:** Low
- **Location:** `trAdd`, `D:\3_Claude\PowerApps\expense-pwa\index.html:10714-10717`. The correct phrasing helper, `leftPhrase`, is at `:10469`.
- **Evidence:** `` `${accountName(fromId)} has only ${fmt(Math.max(0, fromBalance))}` ``. The Phase 2 fix (UI-07, `leftPhrase`) was applied to the delete refusal and the edit sheets but not to this one. The account list directly above the form shows the same balance in red as −₮X.
- **Impact:** The refusal contradicts a figure visible on the same card.
- **Recommendation:** Use `leftPhrase(accountName(fromId), fromBalance)`.
- **Effort:** XS

### UI-08: Row action buttons are named only "Edit" and "Delete", so a screen-reader user hears a column of identical buttons

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`:
  - Income `:6905-6906`
  - Expenses `:7477-7478`
  - Income Types `:7621-7622`
  - Categories `:7995-7996`
  - Goals `:10269-10271` (History, Edit, Delete)
- **Evidence:** `aria-label="Edit"` and `aria-label="Delete"` on every row. The Accounts list already names the row: `aria-label="Edit ${name}"` (`:10607-10608`).
- **Impact:** When moving between buttons, a screen-reader user cannot tell which entry a Delete will remove. They have to read back to the row each time.
- **Recommendation:** Follow the Accounts pattern and add the row's identifying text, for example `Delete Groceries, 2026-10-10, ₮12,000`.
- **Effort:** S

### UI-09: The Reset confirmation's list leaves out accounts and money moves

- **Severity:** Low
- **Location:** `btnReset`, `D:\3_Claude\PowerApps\expense-pwa\index.html:8147`
- **Evidence:** The message lists income, expenses, planned expenses, goals and contributions, debts and payments, salary history, categories, income types and settings. Accounts and money moves arrived with v25 and v26 and are not named, although the reset erases them.
- **Impact:** This is minor, because the sentence opens with "Delete every record in this app". A user who skims the list may still think their accounts survive.
- **Recommendation:** Add "accounts and money moves" to the list.
- **Effort:** XS

### UI-10: The Notifications helper misstates when "Goal contributions due" becomes urgent

- **Severity:** Low
- **Location:** Helper text at `D:\3_Claude\PowerApps\expense-pwa\index.html:7934`. Urgency rules: `:5763` (planned, ≤1 day), `:5803` and `:5876` (goals and debts, ≤3 days), `:5904` (goal contributions, ≤0 days).
- **Evidence:** The helper says urgent means "due within 1 day for expenses/recurring". Goal-contribution reminders become urgent only on the due day or after (`daysUntil <= 0`).
- **Impact:** A user expecting a phone notification the day before a scheduled contribution does not get one.
- **Recommendation:** Reword to "due within 1 day for planned expenses, on the day for goal contributions, 3 days for goal deadlines and debts". Alternatively, align `:5904` with the planned-expense threshold. That is a product choice.
- **Effort:** XS

### UI-11: The money-move history on Accounts has no label and sits directly under the Move Money button

- **Severity:** Low
- **Location:** Markup `#trList` at `D:\3_Claude\PowerApps\expense-pwa\index.html:3222`. Render at `:10651-10665`.
- **Evidence:** Past moves are written as list rows 12px below the form's primary button, inside the same card, with no heading or label. With no moves, nothing renders.
- **Impact:** At a glance, the rows read as part of the form, for example a pending move, rather than as history. This is the only place a user can review or undo a move.
- **Recommendation:** Add one `.group-label` "Past moves" above the list, shown only when the list has rows. No new component is needed.
- **Effort:** XS

---

## Review Areas

- **Layout and hierarchy:** UI-01. Each screen leads with the right thing when viewed from the top: the hero on Home, Amount on the add forms, totals above the list on Accounts and Debts. UI-01 is why the user often does not land at the top.
- **Navigation:**
  - All eight project.md modules are reachable by name: four tabs, plus Budget Planning, Debts, Salary and Settings under More. The header title, `aria-current` and the More highlight show the current location (`:6650-6662`).
  - Every sheet has a close button, Cancel, Escape and Android Back.
  - Carried, not filed: Back on a top-level screen leaves the app (deferred), and the More sheet does not mark the current destination.
  - For the doc owner, not a UI defect: `knowledge/project.md` does not list **Accounts**, which now ships under More and is the first item there.
- **Typography:** Clean apart from the known off-scale sizes, which are converted when edited (WORK-33 was rejected). The hierarchy is clear and token-driven.
- **Colour and theme:**
  - The palette is limited and token-driven across sixteen themes.
  - Income is green, spending red and planned amounts neutral, consistently. Red and green are always paired with words, or with ↑/↓ on the Trend pane only.
  - Category colours repeating after twelve is a recorded known limit (`:8958-8961`).
- **Spacing:** No new finding. The off-scale literals are a known standing state, and an app-wide sweep is off limits. Nothing cramped found beyond what earlier rounds measured.
- **Cards:** Clean. `.card`, `.kpi`, `.kpi-strip`, `.stat-strip`, `.goal-card` and `.debt-card` share padding and radius. The goal/debt shadow difference is accepted in writing (`:1779-1792`).
- **Mobile:**
  - Every interactive target I checked sets 44px: inputs, buttons, chips, tab bar, calendar cells, list actions, grip, summaries, dialog links, the converter swap and the close X.
  - The two documented sub-44 cases (icon grid at 320px, date-picker track at 320px) stay accepted.
  - The only sideways scrolling is inside the two bar charts, by design.
- **Accessibility:**
  - UI-08.
  - Contrast is measured AA in all themes. The focus ring uses `--text` and reaches at least 4.78:1 (`:156-175`), and no rule anywhere removes outlines. Every form input I checked has a `<label for>` or an `aria-label`.
  - Carried: keyboard reordering (WORK-85, deferred), and focus loss after list deletes (the focus sweep is off limits).
- **States:**
  - UI-02, UI-03, UI-06, UI-09, UI-10, UI-11.
  - Every list has an empty state, with a filtered variant where a filter applies. Loading states exist for the converter and Storage Status. Write failures and cross-window conflicts raise banners or dialogs that say what to do next (`:2588-2594`, `:4592`). Every destructive action is confirmed.
  - Carried: Data Summary bulk clears (R1.6, and limits on them are off limits).
- **Numbers and formatting:**
  - UI-04, UI-07.
  - One `fmt` for all money: leading ₮, grouped thousands, an explicit `-₮` for negatives (`:5277-5280`). `fmtCompact` is used only on chart axes and cells.
  - Dates are ISO everywhere: consistent, though not friendly. Not filed.

---

## Quick Wins

- **UI-01** (XS, High): one scroll reset in `navigate()` puts every screen's most important figure back on arrival.
- **UI-02** (S, High): one visibility handler stops resumed sessions writing yesterday's date and labelling last month "This Month".
- **UI-03** (S, High): one sentence in the goal-delete confirm and one reworded advisor line stop a silent jump in an account balance.
- **UI-04** (S, Medium): counting goal contributions as savings stops the advisor flagging people who save the way the app suggests.
- **UI-06** (S, Medium): swapping `toast` for the existing `refuseField` makes edit-sheet errors behave like add-form errors.

---

## Estimated UX Impact

With UI-01 to UI-03 fixed:

- **Every screen opens at its top.** Home shows "Left over" first every time, the add forms open with Amount in view, and the first-screenful work done on Debts and Home applies on every arrival, not only after a reload.
- **Entries get today's date and presets mean today's period**, even in an installed app resumed after a night or a month boundary. The most frequent act in the app stops filing money under the wrong day.
- **Account balances stay true when a finished goal is cleared away.** The user is told before money that already left an envelope reappears in it, and the app stops recommending the act that causes it.

None of the three changes the stored schema, an export format or a ruled sentence.
