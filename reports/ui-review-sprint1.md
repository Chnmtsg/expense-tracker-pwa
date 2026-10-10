# UI Review: Sprint 1 (1be4f80..main)

Scope: the user-facing changes for WORK-01, 02, 03, 04, 06, 07 and 08 in `D:\3_Claude\PowerApps\expense-pwa\index.html`, checked against `knowledge/ui-guidelines.md` and the rulings in `D:\3_Claude\PowerApps\reports\chief-architect.md`. Ruled items are not reopened. I reviewed the code by reading it. I ran no browser or harness, and I could not run `git log`, so the screens below were identified by reading the code at each `WORK-` site.

## Executive Summary

Sprint 1 delivers all seven rulings in the shape they were ruled. The four Highs are closed:
- Screens now open at the top.
- The add forms keep their category and account.
- Entry dates and presets move to the new day on resume.
- The goal-delete confirm names the money that returns to accounts.

No new Critical or High problem was introduced. The biggest remaining problem is a side effect of WORK-03. On the first resume of a new month, the Analytics period moves to the new month, but the calendar under it stays on the old month. This brings back the range/calendar mismatch that the app's own sync code exists to prevent. A second gap is that WORK-02's "different screen" test misses Expenses ↔ Budget Planning. The app names these as two modules, but they share one screen, so switching between them keeps the old scroll position.

## Overall Score

**88 / 100.** There are no Critical or High findings, and every ruling is met as written. Two Medium side effects (UI-01, UI-02) and five Low wording and consistency gaps hold the score just below the 90 band.

## Strengths

- **WORK-02** is one line, and it follows the ruled exemption exactly (`navigate()`, `:6682`). Same-screen re-renders from resume, import and cross-window refresh keep the user's place. The `confirmSpend` Move hand-off still brings `#trAmount` into view, because the focus call comes after the scroll (`:10572-10578`). The app has no smooth scrolling, so the reset does not animate on every tab switch.
- **WORK-01**'s `rebuildSelect` (`:10622-10629`) is the single helper the ruling asked for. All four selects use it (`:6883`, `:7416`, `:10608`). When the kept option no longer exists, the select falls back to the previous default. The misleading comment in `confirmSpend` is now true (`:10569-10570`).
- **WORK-03** (`:13612-13625`) moves a date only if it still holds the previous day, never touches an open sheet and never saves. This meets every guard in the ruling.
- **WORK-04**'s confirm sentence (`:10323-10328`) uses the same "comes back out of / goes back into" wording as the income and debt deletes (`:6935`, `:11710`). It handles one or several accounts. It counts only contributions that have already happened, so it matches what `accountBalance` will actually show. The advisor no longer recommends the delete (`:8479`).
- **WORK-07** disables Actual, links the helper to it with `aria-describedby`, and puts the helper directly after the control, so it is read in order. One-off plans behave as before (`:12862-12869`).
- **WORK-06** replaced every location listed in UI-06 with `refuseField`, including the debt schedule and settle refusals (`:12971-13308`, `:7530-7563`). Date fields opened through the picker clear the mark when a date is picked (`:10045-10050`).

## Findings

### UI-01: After a month boundary, the Analytics period moves to the new month but the calendar stays on the old one

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`:
  - preset refresher `:5595`
  - `syncCalendarAnchor` `:5564-5577`, with its two call sites at `:5598` and in the change handler after `:5600`
  - `refreshForNewDay` `:13623`
- **Evidence:**
  - The new refresher calls `applyPreset` only. It does not call `syncCalendarAnchor`.
  - The comment at `:5534-5546` says the calendar must follow the range, and that "the property is false if either [call site] is missing". It names the symptom: "The Peak day tile could name a date the calendar below it was not showing."
  - Before Sprint 1, the range and the calendar were both stale after a resume, so they at least agreed. Now, on the 1st, "This Month" and the stat tiles describe the new, empty month while the calendar shows last month in full.
- **Impact:** Once a month, every user who resumes the installed app on Analytics sees two parts of one screen describing different months, with nothing to explain it. The workaround is the arrow button.
- **Recommendation:** The ruling excluded `calDate` because it is "a navigation cursor, not a record date". This finding does not dispute that. The issue is that the range and calendar now disagree. The smallest fix is to call `syncCalendarAnchor` from the Daily refresher when the preset is not Custom, as a third call site. If the architect prefers to keep the user's arrow position, record the mismatch as accepted. Either way, this needs a one-line ruling, because it touches what the ruling put out of scope.
- **Effort:** XS

### UI-02: Switching between Expenses and Budget Planning keeps the previous scroll position, although the header names a different module

- **Severity:** Medium
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`:
  - More → Budget Planning `:6649`
  - Expenses tab `:6630-6631`
  - `navigate()` `:6655`, `:6682`
  - `screenTitle` `:6612-6614`
- **Evidence:**
  - Both entry points call `setExpMode(...)` and then `navigate('expenses')`.
  - Before and after, the active screen is `expenses`, so `from === name` and no scroll reset happens.
  - The header changes ("Budget Planning" ↔ "Expenses"), and `project.md` lists Budget Planning as its own core module. The code comment at `:6975` calls them "two named destinations behind one screen".
  - Example: scroll down the Expenses list, then open More → Budget Planning. The page opens part-way down the planned list, and the Add form is above the viewport.
- **Impact:** This is the UI-01 symptom (the original review's UI-01, not this report's) on one core-module pair, in normal use.
- **Recommendation:** Add `window.scrollTo(0, 0)` in those two entry points, only when `expMode` actually changes. Leave the exemption in `navigate()` and the segmented toggle inside `setExpMode` as they are, so the ruled exemption is untouched.
- **Effort:** XS

### UI-03: The "fill in all three parts" schedule refusal marks the Instalment field even when that field is filled

- **Severity:** Low
- **Location:** `saveEditDebt`, `D:\3_Claude\PowerApps\expense-pwa\index.html:13104-13106`
- **Evidence:** When one or two of the three schedule parts are filled, the refusal always targets `mSchedInstalment`. If the user fills Instalment and Count but leaves First due empty, the field they did fill turns red and takes focus, and the empty field stays unmarked.
- **Impact:** WORK-06 exists to point the user at the field that needs attention. In this one case it points at the wrong field. The toast text still explains the rule, so the user can recover.
- **Recommendation:** Pass the id of the first *empty* part of the three to `refuseField`.
- **Effort:** XS

### UI-04: Edit-sheet refusals use different wording from the add form for the same field

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`:
  - goal add `:12528-12529` compared with goal edit `:12971-12972`
  - expense and income add `:7380`, `:6847` compared with the edit sheets `:13203`, `:13246`, `:13276`, `:13308`
- **Evidence:**

  | Field | Add form says | Edit sheet says |
  |---|---|---|
  | Goal name | "Enter a name" | "Name cannot be empty" |
  | Goal target | "Enter a target amount" | "Target must be greater than zero" |
  | Amount | "Enter an amount" | "Enter a valid amount" |

  The debt add and edit sheets already match.
- **Impact:** UI-06 described the problem as "the same act behaves differently depending on whether it is an add or an edit". The behaviour now matches, but the words do not. "Valid" also does not tell the user what is wrong.
- **Recommendation:** Use the add form's message in each edit branch.
- **Effort:** XS

### UI-05: Renaming a category or income type in Settings still refuses with a toast only

- **Severity:** Low
- **Location:** `saveEditIType` `D:\3_Claude\PowerApps\expense-pwa\index.html:7599`, `:7608`; `saveEditCat` `:7684`, `:7689`
- **Evidence:** Each refusal is still `toast('…'); return;`. This was outside UI-06's list, so WORK-06 did what it was ruled to do. But in the same Settings card, the add field now marks and focuses (`:7530`, `:7549`, `:7561`, `:7563`) while the inline rename field does not.
- **Impact:** This is a small add/edit inconsistency inside one card. The rename field is the one the user just typed in, so it is not lost.
- **Recommendation:** Mark and focus the inline rename input on refusal. It has no `id`, so either give it one or have the refusal mark the element directly. Do this when WORK-18 next touches these refusals.
- **Effort:** XS

### UI-06: The WORK-07 helper is three clauses rather than one line, and it names the bell by an emoji that does not match the button's name

- **Severity:** Low
- **Location:** `openEditModal`, `D:\3_Claude\PowerApps\expense-pwa\index.html:12869`; bell button `:2602`
- **Evidence:**
  - The helper reads: "This plan repeats, so it stays a plan: turning it into an expense would erase its past months. To record a payment, add it as an Actual expense, or use Log when it shows under 🔔." That is about 40 words. The ruling asked for "a one-line helper pointing to Log".
  - The bell button's accessible name is "Reminders", but the helper names it only as 🔔, which a screen reader announces as "bell".
  - The helper says "an expense", while the disabled segment is labelled "Actual".
- **Impact:** At 360px the helper takes several lines before Date and Amount, on the sheet where the user came to edit those fields. A screen-reader user is told to look for a "bell" control that is announced as "Reminders".
- **Recommendation:** Shorten the helper to one sentence that uses the on-screen names, for example: "A repeating plan stays a plan. To record a payment, use Log in Reminders (🔔)."
- **Effort:** XS

### UI-07: Deleting a single contribution still returns its money to the account without saying so

- **Severity:** Low
- **Location:** Goal history sheet, `D:\3_Claude\PowerApps\expense-pwa\index.html:12788`
- **Evidence:**
  - The confirm reads only "Delete this contribution?".
  - The contribution can carry an `accountId`, and `accountBalance` subtracts it. Deleting it raises that account's balance, which is the same effect WORK-04 now names for the whole-goal delete.
  - This was outside UI-03's scope, so this is not a defect against the ruling.
- **Impact:** Since WORK-04, deleting the whole goal explains the balance change, but deleting one of its contributions does not. Deleting a single entry is usually a correction, so the money returning is right. Only the explanation is missing.
- **Recommendation:** Add the same sentence when the contribution names an account, for example: "The ₮X goes back into Needs."
- **Effort:** XS

### Review areas

- **Layout and Hierarchy:** WORK-02 restores "most important information first" on arrival. The remaining gap is UI-02. The UI-06 helper length also affects the edit sheet.
- **Navigation:** Clean. Cancel and Back still work in every sheet that changed, and the WORK-07 lock does not trap the user.
- **Typography:** Clean. The new helper uses the existing `.helper` token (`:2371`).
- **Colour and Theme:** Clean. Refusals reuse `.invalid` (`:2478`) together with a message, so colour is not the only signal.
- **Spacing:** Clean. The helper's inline margin (`-4px 0 12px`) matches the segmented control's existing 12px rhythm.
- **Cards:** No changes in scope.
- **Mobile:** The segmented buttons keep `min-height: 44px` (`:1406`), and no new horizontal overflow was found. Helper length is covered in UI-06.
- **Accessibility:** `aria-invalid` and focus are set on every WORK-06 refusal. The disabled Actual drops out of the tab order and its helper is read in order. The emoji naming issue is covered in UI-06. Disabled segments show a pointer cursor because `.segmented button` (`:1405`) overrides `button:disabled` (`:1208`). This affects desktop only and is not raised as a finding.
- **States:** The goal delete and contribution delete still ask for confirmation. The missing explanation is covered in UI-07. The WORK-08 rollback updates the bell straight away (`updateBellBadge`, `:12815`).
- **Numbers and Formatting:** Clean. The WORK-04 sentence and the WORK-06 messages format amounts with `fmt`.

## Quick Wins

- **UI-01** (XS, Medium): one extra call site stops Analytics showing two months at once on the 1st. It needs a one-line architect ruling first.
- **UI-02** (XS, Medium): two scroll resets in the mode-changing entry points finish what WORK-02 started, without touching the ruled exemption.

## Estimated UX Impact

No Critical or High findings remain in the Sprint 1 scope. With the sprint as shipped, users now:
- land on each screen's headline figure;
- keep the category and account they picked;
- get today's date after leaving the app open overnight;
- are told, before deleting a goal, that its money goes back into named accounts.

Fixing the two Mediums would remove the last two places where the screen contradicts itself: the Analytics range against its calendar on the 1st of the month, and the Budget Planning header against a viewport left part-way down the other list.
