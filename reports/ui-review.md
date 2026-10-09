# UI Review — Whole Application

**Scope.** The whole interface in `D:\3_Claude\PowerApps\expense-pwa\index.html` as it is on disk, including the uncommitted changes. That covers all eight screens (Home, Income, Expenses/Budget Planning, Analytics, Savings Goals, Debts, Salary Calculator, Settings), the More sheet, the bell sheet and the eight modals. It is measured against `knowledge/ui-guidelines.md` and `knowledge/project.md`.

**Evidence basis.** This is a source review. No new renders were taken. Wherever a finding depends on a pixel width I worked out from CSS rather than measured, it says "derived" and names the measurement that would settle it. This project has been wrong about derived pixel figures before.

**Not reopened.** The Debts card, the Debts summary block and every Round 17 and design-request ruling stay in force. The deferred Debts items (ABD2, ABD3, the chip-row residue, PDD1) are carried, not re-filed. One finding (UI-02) shows that a premise in `chief-architect-clearing-the-bell.md` is false at source, and says so.

---

## Executive Summary

The individual screens are mostly well built: the colour tokens hold up in all sixteen themes, modals trap focus and respond to Escape and Android Back, empty states tell "you have nothing" apart from "your filter is hiding it", and colour almost always comes with words. The weak points sit at the edges, in controls that look correct and do not behave correctly.

The single biggest problem is in Settings. The **Debt due dates** reminder checkbox has no change listener, so unticking it does nothing. This is the only control a user has to quiet the debt reminders the owner has already complained about. A recent ruling stated the opposite.

Two other High findings:
- The Home hero card's verdict line says "Over budget" for something that is not the budget, on the same screen as a "Budget" tab that may show the opposite.
- On a phone, a vertical swipe across the Categories or Income Types list reorders the list instead of scrolling the page.

All three Highs are XS or S fixes.

---

## Overall Score

**72 / 100**: Usable but fragile.

There are no Critical findings. There are three High findings, each in a core module, each hit in normal use, and none is a corner case. On top of them sit ten Medium findings, most of them small. The score stays above 60 because the base underneath (contrast, focus handling, confirmation of destructive actions, money formatting, empty and error states) is sound, and every High has a small fix that changes no storage.

---

## Strengths

- **Contrast is measured, not claimed.** Every text/background pair comes from a token. Hover fills (`--primary-hover`, `--danger-hover`), the hero scrim and the heatmap ceiling are worked out per theme so they clear AA in all sixteen themes, and the stylesheet bans opacity and filters over text because those cannot be measured (`:1186-1206`, `:1535-1563`, `:2648-2667`).
- **The modal system is complete.** It has a focus trap, Escape that goes through each modal's own cancel button so promises still resolve, focus returned on close, and Android Back closing the top modal instead of leaving the app (`:5926-6013`).
- **Empty states never lie about the user's data.** `filteredEmptyState` separates "no entries" from "none in this period" and offers a "Show all time" button (`:12297-12321`). `revealEntryDate` moves the filter so a just-added entry is always visible (`:5353-5375`).
- **Colour is backed by words on almost every money figure.** Planned vs Actual says "over by" / "under by" / "on target", the trend chart uses ↑/↓, plans carry "✓ Paid" / "Unpaid", and the advisor badge has a screen-reader-only severity word (`:8318-8332`, `:8447-8455`, `:6976-7014`, `:8061-8086`).
- **Destructive actions are confirmed, and the confirmations name the cascade.** Deleting a goal counts its contributions, deleting a recurring plan warns that past occurrences go too, and Reset needs two confirmations (`:9796-9803`, `:7036-7042`, `:7708-7712`).

---

## Findings

### UI-01 — The hero card's verdict says "Over budget" about something that is not the budget

- **Severity:** High
- **Location:** Home screen, hero card. `renderDashboard` at `D:\3_Claude\PowerApps\expense-pwa\index.html:8184-8193`; label `:2601`; "Budget" chart tab `:2708`; Planned vs Actual verdicts `:8330-8332` and `:8380-8384`.
- **Evidence:**
  - When income is greater than zero and `net < 0`, the line under the headline reads `↓ Over budget by ${fmt(-net)}`, where `net = totalIncome - totalExp`. That is spending beyond income. It has nothing to do with any plan.
  - The same screen's chart card has a tab labelled **Budget**. Its comment (`:2702-2703`) chose that word specifically to mean "Budget Planning", and that pane prints "over by" / "under by" against the plan.
  - So one screenful can show "↓ Over budget by ₮50,000" in the hero and "under by ₮200,000" in the Budget pane, for the same period. Both figures are correct and the shared word makes them contradict each other.
  - The figure's own label, "Net Balance", uses a stock word for a period figure. The Dashboard defaults to This Month, so the figure is "this month's income minus this month's spending", not money the user has. The Debts screen's comment (`:3116-3118`) explains why mixing stocks and flows on a filtered card misleads.
- **Impact:** This is the headline sentence of the main screen, read first and at a glance by a user with no accounting background. They are told they are over a budget they may not have set, or contradicted by the tab beside it. It shows up whenever spending passes income in a period, which is a normal month for the target user.
- **Recommendation:** Change the wording only:
  - Negative branch: `↓ You spent ₮X more than you earned`.
  - Label: something like `Net this period`, so it no longer reads as a balance.
  - Leave the figure, the arrows and the positive branch alone.
- **Effort:** XS

### UI-02 — The "Debt due dates" reminder checkbox does nothing when changed

- **Severity:** High
- **Location:** Settings → Notifications. `renderNotifPrefs` at `D:\3_Claude\PowerApps\expense-pwa\index.html:7479-7520`; listener list `:7519`; read by the reminder engine at `:5550`.
- **Evidence:**
  - The template renders five checkboxes plus one select, and `savePref` reads all six (`:7509-7516`).
  - The listener list that triggers `savePref` is `['notifEnabled','notifDaysAhead','notifShowPlanned','notifShowGoals','notifShowRecurring']`. **`notifShowDebts` is missing.** A grep shows no other listener anywhere in the file.
  - Unticking "Debt due dates" therefore changes the box on screen but writes nothing and does not refresh the bell. The bell keeps counting debts, OS notifications keep firing, and the box shows ticked again the next time Settings renders.
  - The value is saved only by accident, if the user happens to change a different preference afterwards.
  - Nothing tests this. `tools\harness\debts.js` sets `db.settings.notifications.showDebts` directly and never goes through the checkbox.
  - `reports\chief-architect-clearing-the-bell.md:45` says *"the save handler writes all five"*. The handler would, but it is never called for this box.
- **Impact:** Debt reminders are the only reminders that reach the phone's notification tray every month (BEL-01), and the owner has already complained about too many of them. This checkbox is the one way offered to turn them off. It looks like it worked and it did not, which is worse than having no switch at all.
- **Recommendation:** Add `'notifShowDebts'` to the array at `:7519`. Add one harness step that toggles the actual control and checks `db.settings.notifications.showDebts`, so the control rather than the stored value is what gets tested.
- **Effort:** XS

### UI-03 — On a phone, swiping over the Categories or Income Types list reorders it instead of scrolling the page

- **Severity:** High
- **Location:** Settings → Categories and Income Types. CSS `.list-item.draggable-row` at `D:\3_Claude\PowerApps\expense-pwa\index.html:1268-1278`; `initCategoryReorder` `:7265-7295`; `initIncomeTypeReorder` `:7144-7189`; hint text `:7567`; index-based colours `categoryColor` `:8494-8497`.
- **Evidence:**
  - Every row and every element inside it has `touch-action: none`, so the browser cannot start a scroll from any of them.
  - The drag starts after **5px** of vertical movement (`:7292`, `:7164`), with no hold delay.
  - The hint says "Press and drag", which suggests press-and-hold, but no hold is required.
  - The default install has nine categories and four income types. On the Settings screen, before Notifications, Backup and Storage, that is a long band where any upward swipe that starts on a row moves a category instead of scrolling.
  - The side effect is visible elsewhere: `categoryColor` picks colours by list position, so an accidental reorder recolours categories in the Analytics chips, stacked bars and day detail.
- **Impact:** Settings is a core module and Backup & Restore, the app's only protection against data loss, sits below these lists. Normal scrolling on the main platform silently changes the user's data, and the user is not told.
- **Recommendation:** Smallest fix: give each row a small grip handle and move both `touch-action: none` and the `pointerdown` listener onto that handle only, so the rest of the row scrolls normally. Change the hint to name the handle. This does not touch the deferred keyboard-reorder item (WORK-85) or the deferred merge of the two reorder implementations, and it should not be merged with them.
- **Effort:** S

### UI-04 — Form errors on the four main add forms are a toast only; the field is neither marked nor focused

- **Severity:** Medium
- **Location:** `incAdd` `D:\3_Claude\PowerApps\expense-pwa\index.html:6436-6441`; `expAdd` `:6914-6919`; `goalAdd` `:11499-11514`; `debtAdd` `:11381-11404`; edit-modal save branches `:11890-11982`. For comparison, Salary's save `:6351-6377`; style `input.invalid` `:2455-2458`; toast `:5378-5388`, `.toast` `:2460-2469`.
- **Evidence:**
  - Every refusal on these forms is `toast('…'); return;`. No `.invalid` class, no `aria-invalid`, no focus.
  - The `.invalid` style exists, and the Salary screen already uses it properly: it marks the field, focuses it and names it in the toast.
  - The toast sits at `bottom: 90px`, has `pointer-events: none` and fades after 1.8–8s.
  - The Debts add form is about nine controls tall. "Enter who lent it" refers to the first field, which is off-screen above the **Add Debt** button the user just tapped.
- **Impact:** A first-time user who misses the toast sees a button that did nothing. On the long Goals and Debts forms they must scroll up to find which field is wrong. On a phone the toast can also sit behind the on-screen keyboard.
- **Recommendation:** Reuse Salary's pattern on each refusal: add `.invalid` and `aria-invalid="true"`, focus the field, keep the toast. Clear the mark on input, as Salary does at `:6346`. No new component.
- **Effort:** S

### UI-05 — Income, Expenses and Budget Planning show how many entries there are, never how much they add up to

- **Severity:** Medium
- **Location:** Income list heading `D:\3_Claude\PowerApps\expense-pwa\index.html:2912`; Expenses / Budget Planning list heading `:2989`; written by `renderIncome` `:6462` and `renderExpenses` `:6961`.
- **Evidence:** Each list is headed `Entries (N)`, and N is the only summary figure on these screens. The period total for income, actual spending or planned spending appears only on Home or Analytics. Budget Planning in particular has no planned total anywhere on its own screen.
- **Impact:** The question a user asks on the Expenses screen is "how much have I spent this month". The screen answers "12 entries" and sends them to another tab for the money. This fails the guidelines' "most important information first" on three of the eight modules.
- **Recommendation:** Add the filtered total to the existing heading, e.g. `Entries (12) · ₮1,234,000`, from the same `list` the count is already taken from. No new card and no new figure: it is the sum of the rows already shown.
- **Effort:** XS

### UI-06 — Salary Calculator's two-column grid has no narrow-width fallback; helper text and figures are squeezed into half-width columns

- **Severity:** Medium
- **Location:** Salary screen inputs grid `D:\3_Claude\PowerApps\expense-pwa\index.html:2764-2799`; "Where the gross comes from" tiles `:2808-2814`; `.grid-2` `:911` (fixed `1fr 1fr`, no breakpoint). The file's own constraint is at `:2334-2347`; the existing fallback primitive `.form-row` is at `:2060-2069`.
- **Evidence (derived, not measured):**
  - At 320px each grid column is about 121px wide.
  - "Overtime at Night (×1.8)" wraps while "Night Hours (×1.2)" beside it does not, so the inputs in a row sit at different heights.
  - The SI% helper ("Your contribution, deducted from gross pay. 11.5% is the standard employee rate — change it if yours differs.") sits inside a grid cell. At 13px in about 121px that is roughly seven lines.
  - The stylesheet says outright: *"EVERY .helper IS A FULL-WIDTH BLOCK, AND THAT IS A CONSTRAINT ON WHERE ONE MAY BE PUT"*. Two helpers here break that rule.
  - The pay tiles use `.kpi .value` (22px bold) in a content box of about 87px at 320 and about 107px at 360. A seven-figure normal-pay figure such as "₮1,408,000" needs about 117px, so `overflow-wrap: anywhere` will break it mid-number.
- **Impact:** A first-time user meets the tax and insurance terms here, and the explanation of them is the part that is squeezed. Pay figures that break mid-number are hard to read on the screen whose whole purpose is reading them.
- **Recommendation:**
  - Change the two grids from `.grid-2` to the existing `.form-row` (`auto-fit, minmax(150px, 1fr)`), which already falls back to one column on narrow screens.
  - Move the two helpers so they sit after the grid at full width, as the stated rule requires.
  - Measure the tile figures at 320 and 360 with the existing `run.mjs --width` harness before and after the change.
- **Effort:** XS

### UI-07 — On narrow screens the list-row text column is very narrow, worst on Budget Planning rows

- **Severity:** Medium
- **Location:** `.list-item` and its actions `D:\3_Claude\PowerApps\expense-pwa\index.html:1228-1263`; planned-row template `:6971-7033`. Also affects the Income and Actual rows.
- **Evidence (derived, not measured):**
  - The amount (15px bold, about 70–90px) and two 44px icon buttons with their gaps (108px) share one line with the description. Together that is about 180–200px of fixed width.
  - The row's inner width is about 228px at 320px and about 298px at 390px, which leaves the description column about **30–50px at 320** and about **100–120px at 390**.
  - A recurring planned row has to fit a category name, a group tag, a status tag, a recurrence tag with an end date, a "Since" date with notes, and "📅 Next:" followed by four ISO dates (about 55 characters).
  - The stylesheet already records this row overflowing at 320 before `min-width: 0` was added (`:1234-1243`). That fix stopped the clipping; it did not give the text room.
- **Impact:** Budget Planning is a core module, and its list is where a user checks what is paid and what is coming. On a phone each row becomes a narrow column of text many lines tall, and the amount, the actual answer, sits beside a tower of tags.
- **Recommendation:** Measure first. Capture one recurring planned row with a seven-figure amount at 320 and 390 using the existing harness. If the column is under about 120px at 390, let `.list-item` wrap so the amount and action block drops to its own line below the text at narrow widths. That is a single declaration plus an ordering check, with no change to the row template.
- **Effort:** S

### UI-08 — On the same Dashboard card, ↑ means "good" on one pane and "bad" on another

- **Severity:** Medium
- **Location:** Dashboard chart card. Planned vs Actual verdicts `D:\3_Claude\PowerApps\expense-pwa\index.html:8330-8331`; Monthly Trend legend `:2733-2734` and labels `:8454-8455`; hero line `:8187-8189`.
- **Evidence:**
  - On the Trend pane, ↑ is green and means income, ↓ is red and means expenses. In the hero, ↑ means "saved".
  - On the Budget pane, **↑ is red and means overspent** ("↑ over ₮X") and ↓ is green ("↓ under ₮X").
  - The file's own comments (`:2730-2732`, `:8447-8453`) say the arrows exist so a reader who cannot tell red from green can still read the chart. For exactly that reader, ↑ switches meaning between two tabs of one card.
- **Impact:** The fallback channel meant for colour-blind users is the one that contradicts itself. Other users see a green ↑ meaning good on one tab and a red ↑ meaning bad on the next.
- **Recommendation:** Remove the arrows from the Budget pane's verdicts only. The words "over" / "under" / "on target" already carry the meaning and match the card's totals line, which has no arrows.
- **Effort:** XS

### UI-09 — Tapping a calendar day does not bring the day detail into view; tapping a chart bar does

- **Severity:** Medium
- **Location:** Analytics. Calendar cell handler `D:\3_Claude\PowerApps\expense-pwa\index.html:8688-8694`; chart column handler `:8863-8875`; helper text `:3046`.
- **Evidence:** The chart handler calls `scrollIntoView` on `#dayDetailCard` when a day opens. Its comment records why: without it "the tap looked like it did nothing at all". The calendar handler re-renders and does not scroll, although its helper says "Tap a day for details." The detail card renders below the roughly 420px calendar, so taps on the top rows open it off-screen.
- **Impact:** The bug that was fixed for the chart is still present for the calendar, which is the screen's other main interaction.
- **Recommendation:** Apply the same open-only `scrollIntoView({ block: 'nearest' })` in the calendar handler.
- **Effort:** XS

### UI-10 — The Reset confirmation lists less than it actually deletes

- **Severity:** Medium
- **Location:** Settings → Backup & Restore. `btnReset` handler `D:\3_Claude\PowerApps\expense-pwa\index.html:7708-7712`.
- **Evidence:** The first dialog reads "Delete ALL data (income, expenses, categories, salary history)?" The reset removes the whole storage key (`:7713`), which also erases **debts, debt payments, savings goals, goal contributions, planned expenses, income types and settings**. Neither dialog offers an export first, although the Backup card sits directly above.
- **Impact:** A user reading the list can reasonably conclude that their debts and goals survive. Debts are the obligations this app exists to keep in front of the user, and they would be lost with nothing to restore from.
- **Recommendation:** Rewrite the first message to name everything erased, or drop the partial list and say "every record in this app", and add "Export a backup first if you might want any of it." Keep the two-step confirmation.
- **Effort:** XS

### UI-11 — The Savings Goals add form always sits above the goal list

- **Severity:** Medium
- **Location:** Savings Goals screen `D:\3_Claude\PowerApps\expense-pwa\index.html:3056-3103`. The Debts precedent is at `:3157-3177`.
- **Evidence:** "New Goal" is about ten controls: icon, name, target, deadline, notes and a four-field schedule block. It always renders open above `#goalList`. Debts had the same problem and fixed it with a native `<details>` that is open while the list is empty and closed otherwise. That comment's own argument, "one add and many glances", applies here unchanged.
- **Impact:** A returning user who opens Goals to check progress or tap "+ Add ₮" scrolls past a form they finished months ago, every visit. On a 390px screen the first goal card will usually be below the fold.
- **Recommendation:** Wrap the form in the existing `.more-fields` disclosure, open when `db.goals` is empty and closed otherwise, exactly as `renderDebts` does. This adds no component. (The off-limits rule on a second disclosure applies to the Debts screen only.)
- **Effort:** S

### UI-12 — Goal cards carry mocking copy, permanently on overdue goals

- **Severity:** Medium
- **Location:** `GOAL_QUOTES` `D:\3_Claude\PowerApps\expense-pwa\index.html:9637-9686`, rendered on every goal card at `:9760-9761`.
- **Evidence:**
  - Every goal card shows a rotating quote.
  - Examples: "😅 Barely started... but hey, at least you tried." / "🤨 Wait, are you actually going to do it?!" / "🥇 Victory is basically guaranteed. Basically."
  - In the overdue set: **"🤡 The deadline was more of a suggestion, right?"**
  - The owner chose "keep reminding" for missed goal deadlines (CLD1). An overdue goal therefore keeps the overdue rotation indefinitely, and the clown is one of its four lines.
- **Impact:** The guidelines ask for "Simple. Clean. Professional." For a user who has just missed a savings target, the app's response is sarcasm. That costs the trust a finance app depends on, and the owner's decision makes it a lasting state rather than a passing one.
- **Recommendation:** Delete the sarcastic entries (the 😅, 🤨, 🥇, 🙌 and 🤡 lines and similar). Keep the encouraging ones. This changes no code shape.
- **Effort:** XS

### UI-13 — The Financial Advisor states made-up statistics as facts

- **Severity:** Medium
- **Location:** `analyzeExpenses` on the Home screen, e.g. `D:\3_Claude\PowerApps\expense-pwa\index.html:7900-7901`, `:7974-7975`, `:8026-8027`.
- **Evidence:**
  - "Consistent tracking is the #1 predictor of hitting financial goals."
  - "Cooking one extra meal a day at home could save ~30%."
  - "Experts suggest 3–6 months of essential expenses…"
  - None has a source, and "~30%" is not computed from the user's data.
  - The project's standing convention C36 ("one fact per user-facing claim, from the source the app can defend") has been applied strictly to the Debts module and never to this card.
- **Impact:** The advisor is the third card on the main screen and the only first-run guidance a user gets. A user with no training cannot tell which of its numbers come from their own data and which are filler, and both are written in the same confident tone.
- **Recommendation:** Rewrite only the lines that state outside figures, either as advice without numbers ("Cooking at home more often is usually the quickest saving") or by removing the number. Leave the rules and their triggers alone.
- **Effort:** XS

### UI-14 — Category colours repeat after twelve, and are the only key to the stacked daily chart

- **Severity:** Low
- **Location:** `CATEGORY_COLORS` and `categoryColor` `D:\3_Claude\PowerApps\expense-pwa\index.html:8490-8497`; stacked segments `:8814-8820`.
- **Evidence:** Colour is chosen as `idx % 12`, so a thirteenth category reuses the first one's colour in chips, stacked bars and day detail. In the stacked chart the segments are identified only by colour plus a `title` tooltip, which needs hover and the main platform has none. The text fallback is the day-detail card, which takes a tap.
- **Impact:** A user with many categories cannot tell two segments apart, and a colour-blind user cannot read any stack without tapping. The workaround exists, which is why this is Low.
- **Recommendation:** Record this as a known limit in the code comment. If it ever becomes work, extend the palette rather than redesign the chart. Note that UI-03's accidental reorders also shift these colours.
- **Effort:** XS

### UI-15 — The bell's reminder count is not announced to screen readers

- **Severity:** Low
- **Location:** Header bell `D:\3_Claude\PowerApps\expense-pwa\index.html:2578-2580`; `updateBellBadge` `:5612-5625`.
- **Evidence:** The button has `aria-label="Reminders"`, which replaces its content as its accessible name, so the count in `#bellBadge` is never spoken. The count is shown visually by a red pill only.
- **Impact:** A screen-reader user cannot tell whether anything is overdue without opening the sheet.
- **Recommendation:** In `updateBellBadge`, set the label to include the count, e.g. `Reminders, 3 due`.
- **Effort:** XS

### UI-16 — Settings shows developer-facing and technical text to end users

- **Severity:** Low
- **Location:** Notifications helper `D:\3_Claude\PowerApps\expense-pwa\index.html:7503-7506`; Storage Status `:4968-4981`.
- **Evidence:**
  - The Notifications helper ends: *"True push-when-closed requires a scheduled server — ask when you want to add that via Firebase Cloud Messaging."* That is written to the developer.
  - Storage Status shows quota figures in KB and MB, and a button labelled "Request Persistent Storage Again".
- **Impact:** The target user cannot act on any of this, and the Firebase sentence suggests the app is unfinished.
- **Recommendation:** Delete the Firebase sentence. Leave Storage Status as it is unless a later round looks at that card as a whole.
- **Effort:** XS

### UI-17 — The same form uses two different date controls

- **Severity:** Low
- **Location:** Expenses add form (Planned mode): native `#expDate` at `D:\3_Claude\PowerApps\expense-pwa\index.html:2943` beside the tap-to-open picker on `#expRecEnd` at `:2981`. The same pair appears in the edit modal at `:11827` and `:11844`. Goals uses the custom picker at `:3073` and `:3096`.
- **Evidence:** The Debts form's own comment (`:3235-3238`) says *"one form with two different date controls is a worse answer than either control."* The Planned expense form and the edit-expense modal both do that.
- **Impact:** This is a consistency problem only. Both controls work and both can be used by keyboard (`wireDateField` `:9540-9551`).
- **Recommendation:** None until someone next edits these forms for another reason. Then pick one control per form, following the Debts rule.
- **Effort:** S

### UI-18 — Font sizes off the declared scale on high-traffic text

- **Severity:** Low
- **Location:** `.list-item .meta` 12px `D:\3_Claude\PowerApps\expense-pwa\index.html:1245`; `.notif-title` 14px `:856`; `.notif-sub` 12px `:857`; `.goal-name` 17px `:1649`; `.goal-quote` 12.5px `:1902`; `.advisor-tip .tip-title` 13.5px and `.tip-message` 12.5px `:2013-2014`.
- **Evidence:** The scale is 11 / 13 / 15 / 18 / 22 / 30 / 36 (`:141-147`). The secondary line on every list row in the app is 12px, between `--t-micro` and `--t-sm`.
- **Impact:** No reading failure, but there are effectively two "secondary" sizes across screens.
- **Recommendation:** Convert to tokens when these declarations are next edited for another reason, under the standing reading that "a block is opened by the declarations a commit edits". No sweep.
- **Effort:** XS

### UI-19 — Emoji are still used as button icons, against the file's own icon rule

- **Severity:** Low
- **Location:** Salary `💾 Save & Add as Income`, `🕘 History` at `D:\3_Claude\PowerApps\expense-pwa\index.html:2823-2824`; Backup `⬇`, `⬆`, `🗑` at `:3354-3357`. Settings card headings: emoji on four (`:3260`, `:3285`, `:3321`, `:3338`), none on four (`:3299`, `:3313`, `:3344`, `:3353`). The rule is at `:2380-2394`.
- **Evidence:** The stated rule is that labelled buttons use the stroked SVG set, and *"Anything else still carrying one is unconverted, not exempt."* These are unconverted, and so the Settings card headings are inconsistent with each other.
- **Impact:** Visual inconsistency only.
- **Recommendation:** Convert when these lines are next edited for another reason.
- **Effort:** XS

### UI-20 — Planned amounts are shown in the "money spent" red

- **Severity:** Low
- **Location:** `renderExpenses` `D:\3_Claude\PowerApps\expense-pwa\index.html:7027` (`.amount.neg` in both modes); `.list-item .amount.neg` `:1249`.
- **Evidence:** In Budget Planning, every plan amount, paid or unpaid, renders in `--danger-text`, the same colour as actual spending. Planned vs Actual uses `--primary` for planned (`:8368`).
- **Impact:** The same colour means "money left your pocket" on one tab and "an intention" on the next.
- **Recommendation:** In Planned mode, render the amount in `--text`.
- **Effort:** XS

---

## Review Areas

- **Layout and hierarchy:** UI-01, UI-05, UI-07, UI-11. Home puts the right thing first. On Income, Expenses and Budget Planning the money total is missing from the screen.
- **Navigation:** All eight modules can be reached by name: four tabs, plus Budget Planning, Debts, Salary and Settings in More. Location is clear from the header title, `aria-current` and the More tab's highlight (`:6254-6275`). Every modal has close, Cancel, Escape and Back. **Carried, not filed:** Android Back on a top-level screen leaves the app, because screen-level history was deferred by the architect (`:5940-5941`). The More sheet does not mark which destination is current, but the tab highlight and header cover it.
- **Typography:** UI-18. The hierarchy is otherwise clear and mostly drawn from the token scale.
- **Colour and theme:** UI-08, UI-14, UI-20. The palette is token-driven and consistent across sixteen themes, and red/green almost always come with words. Planned amounts (UI-20) and the ↑ arrows (UI-08) are where meaning drifts.
- **Spacing:** No new finding. The roughly 69 off-scale literals are a known, standing state, converted as blocks are edited, and an app-wide sweep is off limits. I found no cramped area beyond UI-06 and UI-07.
- **Cards:** Clean. Padding and radius match across `.card`, `.kpi`, `.goal-card` and `.debt-card`. The goal/debt shadow difference is accepted in writing (`:1756-1769`). `.advisor-card`'s 14px vertical padding (`:1964`) is the only stray value and not worth an item.
- **Mobile:** UI-03, UI-06, UI-07. I found no target under 44px beyond the two already documented and accepted (icon grid at 320, `:1925-1948`; date-picker track at 320, `:2217-2222`). The only horizontal scrolling is inside the charts, by design. **Carried:** the Debts 320px geometry guarantee is intentionally diagnostic only (ABL ruling).
- **Accessibility:** UI-15. Contrast is measured AA in all themes. Every form input I checked has a `<label for>` or an `aria-label`. The global `:focus-visible` ring is in place. **Carried, not filed:** reordering by keyboard (WORK-85, deferred with a trigger), and focus lost after deleting a list row (the stated off-limits focus sweep, `:5916-5919`).
- **States:** UI-02, UI-04, UI-10. Every list has an empty state, plus a filtered empty state where a filter applies. Loading states exist for the converter ("Loading rates…") and storage ("Checking…"). Save failures raise a banner with an Export action. Every destructive action is confirmed.
- **Numbers and formatting:** Clean. One `fmt` everywhere: leading ₮, en-US thousands separators, an explicit `-₮` for negatives (`:4997-5000`), and `fmtCompact` used only on chart axes and cells. Dates are ISO throughout lists and chips. That is consistent, if not friendly, and is not filed.

---

## Quick Wins

- **UI-02** (XS): one missing array entry is why the only debt-reminder switch does nothing.
- **UI-01** (XS): rewording one hero line and one label ends a contradiction on the main screen.
- **UI-05** (XS): adds the sum of rows already listed to an existing heading, answering the question these screens are opened for.
- **UI-08** (XS): removing two arrows makes the colour-blind fallback consistent across one card.
- **UI-09** (XS): reuses the scroll call the chart handler already has.
- **UI-10** (XS): one sentence stops a destructive dialog from understating what it erases.
- **UI-12** (XS): deleting a handful of strings removes mockery from a permanent state.
- **UI-13** (XS): rewording three lines brings the advisor under the honesty rule the rest of the app follows.
- **UI-06** (XS): switches to an existing responsive grid primitive and follows the stylesheet's own helper rule.
- **UI-03** (S): limiting the drag to a handle makes Settings scrollable on a phone again.
- **UI-04** (S): reuses Salary's field-marking pattern on the other add forms.
- **UI-11** (S): reuses the Debts disclosure pattern on the screen with the same problem.
- **UI-07** (S): measure first; if confirmed, a single wrap declaration.

---

## Estimated UX Impact

With UI-01 to UI-03 fixed:
- **Home:** the headline line stops telling users they are over a budget the Budget tab says they are under, and the hero figure stops presenting a month's net as a balance.
- **Settings:** a user who unticks "Debt due dates" gets what the box says, so the bell and the notification tray quiet down as asked. That is the owner's own complaint, closed by the control that already exists for it.
- **Settings, on a phone:** the screen scrolls like every other screen. Swiping through it no longer rearranges categories, and the Analytics colours stop shifting as a side effect.

None of the three changes a stored field, a derivation or a ruled sentence. Taken together they remove the three places where the interface says or does something different from what the user sees.
