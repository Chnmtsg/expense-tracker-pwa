# UI Review: Sprint 2 (5764a05..52d3267)

Scope: the user-facing result of WORK-05, 09, 11, 12, 14, 16, 17, 18, 19, 20 and 23, and of the carried Sprint 1 items UI-04, UI-05/CODE-07 and UI-07. Measured against `knowledge/ui-guidelines.md`, the Sprint 2 rulings in `D:\3_Claude\PowerApps\reports\chief-architect.md` and the carried rulings in `D:\3_Claude\PowerApps\reports\chief-architect-sprint1-review.md`.

I reviewed by reading `D:\3_Claude\PowerApps\expense-pwa\index.html` and `D:\3_Claude\PowerApps\expense-pwa\sw.js` at each site. I ran no browser, harness or git, so every claim below comes from reading the code. Nothing already ruled is reopened.

## Executive Summary

Every Sprint 2 item does what its ruling says. Each wording ruling is met word for word:
- the edit-sheet messages
- the contribution-delete sentence
- the Notifications helper
- the Reset list
- the deleted-in-another-window sentence

The Salary screen now writes through the same function as Add Income, and is unchanged for a user with no accounts. No Critical, High or Medium problem was introduced.

The biggest remaining problem is in WORK-11. Reset now deletes the remembered display currency, filter and converter keys from storage. But the running page keeps its in-memory copies until the next launch. So straight after Reset, Settings still shows the old display currency and Home still shows the ≈ reading. That is the exact symptom ruling C-2 named.

The other three findings are Low: the medium used for one message, one refusal phrase, and the new Salary card's heading.

## Overall Score

**92 / 100.** There are no Critical, High or Medium findings, and every ruled item is met. Four Low findings, one of them a partial miss on a ruled symptom (UI-01), keep the score off the top of the 90 band.

## Strengths

- **WORK-09.** There is one writer, `pushIncomeWithSplit` (`:10571-10587`), and one renderer, `renderIncomeSplit` (`:10523`), keyed by id prefix. Salary and Add Income therefore cannot drift apart.
  - The salary record and its income still share one `save()` (`:6908-6912`).
  - A split refusal pushes nothing, then marks and focuses the row at fault.
  - `#sAcctWrap` stays hidden with no accounts (`:2854`, `fillAccountSelect` `:10737`), so the no-accounts screen is unchanged, as ruled.
  - The split rows and their "Stays in …" line update live as hours are typed (`:6833`).
- **UI-04 / WORK-18.** Edit-sheet messages now match the add forms exactly:
  - "Enter a name", "Enter a target amount", "Enter an amount" (`:13136-13137`, `:13476`)
  - "Add an income type first" / "Add a category first" (`:13480-13482`)
  - No "valid amount", "cannot be empty" or "must be greater than zero" wording is left in any user-facing refusal.
- **UI-05 / CODE-07.** `refuseEl` (`:5729`) is the shared marker, and `refuseField` delegates to it. Both Settings rename handlers now mark, focus and set `aria-invalid` on the row input they found by data attribute (`:7680`, `:7689`, `:7765`, `:7770`). The rename field and the add field in the same card now behave the same.
- **UI-07.** The sentence and its condition match the ruling exactly: account named, and `date <= todayISO()` (`:12933-12935`).
- **WORK-17.** All six add forms clear only while the record is still held, and the check reads `db` after `save()`:
  - Income `:6945`
  - Expense `:7478`
  - Account `:10894`
  - Money move `:10920`
  - Debt `:12571`
  - Goal `:12688`
  
  After a stale-write refusal, the dialog's "please make your change again" now means tapping Add once more.
- **WORK-14.** The helper uses UI-10's sentence word for word (`:8041`), and its terms match the checkbox labels directly above it.
- **WORK-05.** The 50/30/20 savings share now counts goal contributions dated in the period (`:8325-8327`). The emergency-fund rule now recognises the default category (`:8464-8466`). So the advisor no longer tells a user who follows its own advice ("set up a goal with a recurring contribution") that they are failing.

## Findings

### UI-01: After Reset, the old display currency, filters and converter pair stay on screen until the app is relaunched

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - Reset handler `:8250-8275`, side-key removal `:8264`
  - `displayCurrency` held in memory `:9761`, read only at boot `:13812`
  - `syncDisplayCurrencyControl` `:9949`, `renderConvReading` `:9870`
  - `convFromCurr`/`convToCurr` `:9587`, `:10028-10029`
- **Evidence:**
  - The handler removes `'display-currency'`, `FILTER_STATE_KEY`, `'conv-last-from'` and `'conv-last-to'` from storage, then calls `db = load()` and re-renders. It does not re-read any of these values into memory.
  - `displayCurrency` is set from storage only by `loadDisplayCurrency()` at boot, so it keeps its old value (for example `'USD'`).
  - `renderSettings()` → `syncDisplayCurrencyControl()` then sets `sel.value = displayCurrency`. The Display Currency control therefore shows USD straight after a reset that said it deletes "settings".
  - The rate cache is not one of the removed keys. So `renderConvReading` keeps drawing the ≈ USD reading on Home and Salary.
  - The filter presets and the converter pair are also still in the DOM and in memory, and the next filter change writes them back to storage.
  - Everything is correct only after a relaunch.
- **Impact:** C-2 named this symptom directly: "A ≈ reading in a remembered currency after that sentence is the same understatement". The storage half of WORK-11 is done, but the user is looking at the same session, and in it the setting visibly survived an act described as "cannot be undone". A probe that only inspects `localStorage` passes.
- **Recommendation:** In the same handler, after the keys are removed, bring the in-memory state back to the defaults the next boot would compute:
  - call `loadDisplayCurrency()` before `renderSettings()` (it already falls back to `'MNT'`);
  - reset `convFromCurr`/`convToCurr` to their defaults;
  - re-apply the default preset to the period filters, as boot does.
  
  This stays within the ruling: removal by name, no sweep, one handler.
- **Effort:** S

### UI-02: "Nothing was saved" is a dialog in one stale case and a fading toast in the other

- **Severity:** Low
- **Location:** `D:\3_Claude\PowerApps\expense-pwa\index.html`
  - `editTargetGone` `:13108-13112`, used by all eight edit handlers (`:13133` … `:13653`)
  - compare with `dbReplacedSince` `:10660-10664`, and the stale-write dialog in `writeDb` `:4641`
- **Evidence:**
  - `editTargetGone()` closes the sheet and calls `toast(EDIT_TARGET_GONE_MSG)`. The toast lasts about 3.5 s (`:5753-5754`).
  - In the same edit sheets, the other "another window changed things, nothing was saved" outcome uses `alertDialog(..., { title: 'Not saved' })`, and so does the stale-write refusal.
  - The file states its own rule for this at `:10644-10646` and `:8239-8242`: a message the user must act on goes in a dialog, because a toast fades and can sit behind the keyboard.
- **Impact:** This message tells the user that the correction they just typed was thrown away and the sheet has closed. If they look away, the sheet simply vanishes, which looks like the save worked. That is the false-success impression WORK-16 was ruled to remove. Two sibling outcomes of one cause also look different.
- **Recommendation:** Keep the ruled sentence. Show it with `alertDialog(EDIT_TARGET_GONE_MSG, { title: 'Not saved' })` after `closeEditModal()`, matching `dbReplacedSince`.
- **Effort:** XS

### UI-03: The money-move refusal for a negative account reads as a status, not as a refusal

- **Severity:** Low
- **Location:** `trAdd`, `D:\3_Claude\PowerApps\expense-pwa\index.html:10912-10914`. Compare with the other `leftPhrase` callers at `:10872` and `:13521`.
- **Evidence:**
  - WORK-12 replaced the message with `leftPhrase(...)` alone. For a negative source this gives a toast such as "Needs is already at -₮5,000", with the Amount field marked.
  - The positive branch ("Needs has only ₮20,000 left") implies the amount is too large. The negative branch states a balance and does not say the move was refused or why.
  - Both other callers add the consequence: ", so ₮X can't be taken back out of it", and ", so this income can't move out of it".
- **Impact:** The contradiction WORK-12 targeted ("only ₮0" next to a negative card) is gone. But a user with no accounting knowledge now gets a statement of fact with no stated reason why nothing happened. Only the red field links the two.
- **Recommendation:** Follow the other two callers. Add `, so this can't be moved` after `leftPhrase(...)` in this one call. Use the same template for both branches.
- **Effort:** XS

### UI-04: The new Salary account card has no heading and breaks the screen's card pattern

- **Severity:** Low
- **Location:** Salary screen markup, `D:\3_Claude\PowerApps\expense-pwa\index.html:2851-2862`
- **Evidence:**
  - Every other card on the Salary screen opens with an `<h3>`: "Inputs" (`:2781`) and "Where the gross comes from" (`:2836`).
  - `#sAcctWrap` is a separate `.card` that starts directly with the "Into account" label. It sits under the read-only breakdown card, so after the hours the user scrolls past computed figures and reaches an unlabelled card holding one select.
  - On Add Income, the same control sits inside the entry card (`:2911`), where it is clearly part of the form.
- **Impact:** On a phone, the one new choice on the screen looks like part of the breakdown, or like a stray control, rather than "where this pay goes". This mirrors the "Past moves" problem already ruled as WORK-15. The ruled fallback holds, so nothing fails.
- **Recommendation:** Add an `<h3>` to `#sAcctWrap` in the existing card style, for example "Where the net pay goes". Do not move or restructure the block.
- **Effort:** XS

### Review areas

- **Layout and Hierarchy:**
  - UI-04.
  - Otherwise clean. No Sprint 2 change moves a headline figure.
- **Navigation:**
  - Clean.
  - `renderSalaryAccount` runs on arrival and on `navigate(current)` (`:6749`).
  - Every edit sheet keeps Cancel/Close.
  - The deleted-target path closes the sheet rather than trapping the user.
- **Typography:** Clean. No new sizes. The split rows reuse `.form-row` and `.helper`.
- **Colour and Theme:**
  - Clean.
  - `refuseEl` uses `.invalid` together with a message, so colour is never the only signal.
  - Salary history keeps `.amount pos` for net pay.
- **Spacing:**
  - Clean. The new markup uses `var(--s3)` and the existing card padding.
  - The split checkbox row copies Add Income's `gap:8px` exactly.
- **Cards:** UI-04 only. Padding, radius and shadow come from `.card`.
- **Mobile:**
  - Clean for the changes in scope.
  - The split rows use `.form-row`, which collapses to one column.
  - No new fixed widths.
- **Accessibility:**
  - `aria-invalid` and focus are now set on the Settings rename refusals.
  - Every split input has a `<label for>` that carries the account name and share (`:10539`).
  - Not raised: the WORK-14 helper's first sentence still names the bell only as "🔔" (`:8041`). That is the Sprint 1 UI-06 pattern, but it lies outside WORK-14's ruled scope (UI-10's sentence only) and was not changed this sprint.
- **States:**
  - UI-01 and UI-02.
  - Every destructive action in scope is still confirmed.
  - The single contribution delete now names the money returning, as ruled.
  - WORK-17 means a stale-write refusal no longer wipes what the user typed.
  - Not raised: WORK-16's ruled sentence says "This entry" even in the contribution, payment and account sheets, where the thing deleted is a goal, debt or account. The sentence was ruled word for word, so this is not reopened.
- **Numbers and Formatting:**
  - Clean.
  - Every new amount goes through `fmt` (`:10560-10561`, `:10578`, `:12934`), with an explicit `-₮` for negatives.
  - The import refusals added by WORK-20 (`:5200-5209`) use the same quoted-key wording as the existing `settings.quickAmounts` refusals.
- **Not user-facing:** WORK-19, WORK-23 and the `sw.js` key (`expense-tracker-v29`, `:9`). These were checked for user-visible side effects and none were found.

## Quick Wins

None. No finding in this report is Medium or above. UI-02, UI-03 and UI-04 are each XS and could ride along with the next copy commit.

## Estimated UX Impact

There are no Critical or High findings to fix. As shipped, Sprint 2 means:
- the Home advisor credits savings that go into goals and an Emergency Fund category;
- salary pay reaches the user's accounts and envelopes, as Add Income does;
- every edit and rename refusal points at the field to fix, in the same words as the add forms;
- a stale-write refusal no longer erases a half-entered form;
- a correction to a record deleted elsewhere is no longer reported as "Updated".

Fixing UI-01 would make Reset look finished in the session where the user performs it, not only after the next launch.
