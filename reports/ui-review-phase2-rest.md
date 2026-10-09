# UI Review: CODE-02 and P1-P5 (post-implementation)

All line numbers refer to D:\3_Claude\PowerApps\expense-pwa\index.html. I read the code only. Nothing was rendered, so the 320px observations come from the CSS, not from screenshots.

## Executive Summary

The merged changes do what the rulings asked. Every account-moving sheet now names its account, refusals and warnings are worded as sentences, Cancel gets focus by default in every three-way dialog, and the Home rename is applied in every sentence that quotes it. The biggest problem is the shortfall copy shared by the income and debt delete and edit dialogs. It puts an account name directly before an amount ("This leaves Needs ₮50,000 below zero"). With the very account names this app suggests, a non-native reader can take that as "needs ₮50,000". In the two delete dialogs it also never says why a delete takes money out of an account. A second problem is that the two longest refusals added by this work (changing the account on an income or a debt) go out as an 8-second toast over the open sheet. The money-move refusal, which is the same kind of message, uses a dialog that waits for the user. Nothing here blocks release.

## Overall Score

**82 / 100.** There are no Critical or High findings. Four Medium copy and channel problems hit users in normal use of the new account features, which keeps this in the 75-89 band. The rest are Low consistency items.

## Strengths

- Every new three-way dialog opens with Cancel focused. `choiceDialog` with `okLabel: null` leaves Cancel as the first focusable element, and `openModal` (6310-6314) focuses it. A stray Enter never deletes anything.
- The money-move refusal (10637) gives the reason and two concrete next steps, and offers no override, as ruled.
- The bell sends the user to the same prefilled sheet as the screen does, so the account is always chosen where it can be seen (6065-6070, 6095-6100, 6154-6159).
- "Left over" replaces "Net Balance" in every place the user can see it: hero 2625, debt helpers 3307 and 11172, Accounts helper 3182, currency notes 9855-9856. The leftovers in comments (2925, 3403, 8659, 10702, and the CSS comment at 987) are not shown to the user.
- The extra dialog link has a 44px minimum height (`.convert-btn`, 2398), and long labels wrap rather than scroll sideways.

## Findings

**UI-01 — The shortfall sentence can be misread and does not explain why money is taken**

- Severity: Medium
- Location: `shortfallText` / `shortfallNames` 10458-10459. Used in Delete Income 6920, Delete Debt 11604, debt edit 13003 and income edit 13207.
- Evidence:
  - `shortfallText` builds `This leaves ${name} ${fmt(-after)} below zero`. With an account called "Needs" (the brief's own example) that renders "This leaves Needs ₮50,000 below zero", which also reads as "this leaves [it] needs ₮50,000".
  - The same dialog then describes the same fact in two other ways. The body joins accounts with " and " and says "below zero". The link joins them with ", " and says "go negative": "Delete anyway (Needs, Hobby go negative)".
  - The two delete dialogs never say what removes the money. Delete Debt reads "Delete "X"? This leaves Needs ₮50,000 below zero." It does not mention that the borrowed amount leaves the account it arrived in.
  - The two edit dialogs add "Some of this money has been spent." The two delete dialogs (6920, 11604) do not.
- Impact: A user with little accounting knowledge, reading English as a second language, is asked to approve an overdraft without being told what causes it. A user who deletes a loan will not expect it to change an account balance.
- Recommendation:
  - Separate the name from the amount, for example "This leaves the Needs account at −₮50,000."
  - Use one phrase in both the body and the link.
  - Add the cause in the two delete dialogs, for example "The ₮X borrowed comes back out of Needs."
  - Add the same "Some of this money has been spent." sentence the edit dialogs use.
- Effort: S

**UI-02 — The two account-change refusals are an 8-second toast over the sheet**

- Severity: Medium
- Location: income edit 13203, debt edit 12999, via `refuseField` 5663-5671 and `toast` 5680-5690. Compare the money-move refusal at 10637.
- Evidence:
  - Each message is about 170 characters, for example "Needs has only ₮0 left, so this income can't move out of it. Move money into Needs, or change the account on what was spent from it, first."
  - `toast` caps display at 8000 ms (`Math.min(8000, msg.length * 60)`).
  - The toast sits at `bottom: 90px` with `max-width: calc(100vw - 32px)` (2484-2490). At 320px that is about 288px wide, so the message wraps to several lines over the lower part of the sheet.
  - `alertDialog`'s own comment (6394-6396) says a toast is "the wrong channel" for "text too long to fit one". The equivalent money-move refusal follows that rule.
- Impact: The one sentence that tells the user how to get unstuck can disappear before a slow reader finishes it. The refusal is the same kind of message but arrives through a different channel depending on the screen.
- Recommendation: Keep `refuseField`'s invalid mark and focus on `mAccount`, but show the message with `alertDialog` (title, for example, "Can't move this money"), as 10637 does.
- Effort: XS

**UI-03 — The goal sheet's "Paid from" helper is hard to follow**

- Severity: Medium
- Location: `openContributeModal`, 12470
- Evidence:
  - The helper reads: "The account the money leaves. If it stays in one of your accounts here, leave this on No account."
  - "Stays in one of your accounts here" asks the user to reason about whether a goal contribution is a transfer between their own accounts.
  - The select also starts on the last account used for a contribution (`lastUsedAccountId(db.goalContributions)`, 12469). That default can contradict the helper's advice.
- Impact: A user who keeps goal savings in an account they track here (for example a "Savings" account) is likely to choose it as "Paid from". That shrinks the balance of an account that still holds the money. The helper exists to prevent exactly this, and it is the least clear sentence among the merged changes.
- Recommendation: Rewrite in concrete terms, for example "Pick the account you took this money out of. If you put it into an account listed on Accounts, choose No account and use Move money instead."
- Effort: XS

**UI-04 — "LEFT OVER" and "LEFT AFTER PLAN" sit on the same Home card**

- Severity: Medium
- Location: hero 2625, tile 2658, trend line 8627
- Evidence:
  - The rename puts two "Left …" figures next to each other. Both are uppercase-transformed (990, 1078).
  - "Left over" is income minus actual spending. "Left after plan" is income minus planned spending.
  - The code's own comment at 8654-8661 says the "plainest reading" of the pair is that the larger figure is spendable.
  - The hero's trend line calls the same figure "% of income saved" (8627), which is a third word for one number.
- Impact: The headline figure of the app now shares its key word with the figure most likely to be misread. A user who glances at Home may take the larger green tile as money they have left.
- Recommendation: Rename the tile so it no longer starts with "Left", for example "INCOME MINUS PLAN". Its sub-line at 8662 already uses that wording. Leave the hero as ruled.
- Effort: XS

**UI-05 — The bell's "✓ Log ₮X" / "✓ Add ₮X" means two different things**

- Severity: Low
- Location: 6065-6070, 6095-6100; after saving: 13121, 13158
- Evidence:
  - Without accounts, the label saves in one tap and reopens the bell.
  - With accounts, the identical label opens a sheet.
  - `saveEditLogPlanned` and `saveEditContribution` close the sheet without reopening the bell, so a user with several due reminders must reopen the bell after each one.
  - "✓" usually means "done", which this tap no longer does.
- Impact: The control's behaviour silently changes the day the user adds their first account. Working through several reminders now takes more taps.
- Recommendation: When accounts exist, drop the "✓" (for example "Log ₮X…"). Reopen the bell after a save that started there, as the one-tap path does at 6133 and 6171.
- Effort: S

**UI-06 — The future-to-today limit dialog does not say why it appeared**

- Severity: Low
- Location: `saveEditEntry` 13239-13243, `confirmSpend` 10478-10486
- Evidence:
  - When only the date moved from the future to today or earlier, the dialog still reads "Needs has ₮X left. This costs ₮Y — ₮Z short." It does not say that bringing the date forward makes the expense count now.
  - The link says "Record anyway", while the income and debt edit sheets say "Save anyway" (13003, 13207). The button the user pressed says "Save" (12718).
- Impact: The user changed one date and gets a cost warning with no reason given. The edit sheets also use two verbs for the same act.
- Recommendation: When `startsCounting` is true, add one clause, for example "Dated today, it now comes out of Needs." When `confirmSpend` is called from an edit sheet, have it say "Save anyway".
- Effort: S

**UI-07 — Refusals say "has only ₮0 left" when the account is negative**

- Severity: Low
- Location: 10637, 12999, 13203 (`fmt(Math.max(0, accountBalance(...)))`)
- Evidence: A balance of −₮10,000 is shown as "₮0 left". On the Accounts screen the same balance appears in red as −₮10,000 in the list (10568), directly above the money-move list that triggers 10637.
- Impact: The dialog contradicts a figure visible on the same screen. Small, but in a finance app it undermines trust.
- Recommendation: Show the real balance when it is negative, for example "Needs is already at −₮10,000, so…".
- Effort: XS

**UI-08 — The debt sheet's divider does not match the existing one, and "term" is jargon**

- Severity: Low
- Location: 11758-11760. The existing convention is at 12757.
- Evidence:
  - The new divider is `border-top:1px solid; margin-top:16px` with no padding.
  - The existing divider in the expense sheet is `1px dashed`, `margin-top:12px; padding-top:12px`, with the label set to `margin-top:0`.
  - The helper says "Not a term of the loan". For a user without financial vocabulary, "term" commonly means a length of time, and the add form itself uses "3 month term" as a placeholder (3372).
- Impact: Inconsistent visual grammar between two sheets that share one modal, and a helper that may be read as "this is not the loan's duration".
- Recommendation: Copy the existing divider's style. Rephrase, for example "This doesn't change the loan. It only changes that account's balance."
- Effort: XS

**UI-09 — "Received into" is not marked optional, though the fields beside it are**

- Severity: Low
- Location: 3367. The fields beside it, "Due by (optional)" at 3359 and "Notes (optional)" at 3371, are marked.
- Evidence: On the add-debt form every optional field is labelled "(optional)" and required fields carry an asterisk. "Received into" has neither.
- Impact: A small inconsistency. The "No account" default partly signals that the field is optional.
- Recommendation: Label it "Received into (optional)".
- Effort: XS

**UI-10 — The new helpers are not linked to their selects for screen readers**

- Severity: Low
- Location: 12470 (goal), 3369 (add debt), 11760 (debt edit)
- Evidence: None of the three helpers is attached to its `<select>` with `aria-describedby`. The only `aria-describedby` in the file is on `#confirmModal` (3702).
- Impact: A screen-reader user tabbing to "Paid from" or "Received into" never hears the instruction that decides what to choose. That instruction is most critical in UI-03.
- Recommendation: Give each helper an id and point the select at it. This also applies to the older helpers, but the three new ones are in scope.
- Effort: XS

**UI-11 — The riskier delete looks less dangerous than the normal one**

- Severity: Low
- Location: 6920 and 11604 vs 6922 and 11606; link styling at 3711
- Evidence:
  - A normal Delete Income or Delete Debt has a red `danger` button.
  - When the delete would overdraw an account, the only way to delete is the quiet link, styled `color:var(--text-2); font-weight:400`, with no danger colour.
- Impact: The low emphasis is deliberate friction and that part works. But colour then signals the wrong risk level: the harmless delete is red and the harmful one is grey.
- Recommendation: Keep it a quiet link but colour it `var(--danger-text)` when the label is a delete.
- Effort: XS

**Review areas**

- **Layout and hierarchy:** The only issue is UI-04.
- **Navigation:** Clean. Every new sheet and dialog has Cancel, Escape and back routed through `dismissModal`.
- **Typography:** Clean. The new labels reuse the existing label and `.helper` styles.
- **Colour:** Only UI-11.
- **Spacing:** Only UI-08.
- **Cards:** No new cards.
- **Mobile:** Clean as far as the CSS shows. Long dialog links wrap within the roughly 280px content width of `.modal` (padding 20px, 2539), and nothing forces horizontal scroll. The exception is a single unbroken account name longer than the line, which nothing wraps. Toast size is covered in UI-02.
- **Accessibility:** Focus on open is correct. UI-10 is the only gap.
- **States:** Every destructive path is confirmed. The refusal channel is UI-02.
- **Numbers and formatting:** Only UI-07.

## Quick Wins

- **UI-02** (XS, Medium): one call changes from `toast` to `alertDialog`. The pattern already exists at 10637.
- **UI-03** (XS, Medium): rewrite one helper sentence.
- **UI-04** (XS, Medium): rename one tile label. The sub-line at 8662 already supplies the wording.
- **UI-01** (S, Medium): two string functions and two call sites fix all four dialogs.

## Estimated UX Impact

There are no Critical or High findings. Fixing the four Mediums would remove the main ways a non-expert gets this release wrong:

- approving an overdraft they did not understand (UI-01)
- missing the only instruction that gets them out of a refusal (UI-02)
- double-counting goal savings out of an account that still holds them (UI-03)
- reading "Left after plan" as money they can spend (UI-04)

After those fixes, the new account flows would explain their own consequences in plain language, and the score would move into the high 80s.
