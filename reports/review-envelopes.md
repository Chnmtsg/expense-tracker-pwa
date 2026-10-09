# Post-implementation review: Envelopes

2026-10-09, branch accounts-envelopes. Code review scored 88/100, UI review 78/100.

| ID | Severity | Finding | Outcome |
|---|---|---|---|
| UI-01 | High | After "Move", the user was left on Accounts and the expense was not saved, so a "Money moved" toast could be read as the purchase being recorded. | Fixed: a move started from the dialog returns to the unsaved expense, with "Money moved — now tap Add Expense to save it". Ordinary moves stay on Accounts. |
| UI-02 / CODE-01 | Medium | Move could ask for more than the fullest account holds, which trAdd then refused: a dead end. | Fixed: the suggestion is capped at `min(short, donor balance)`, and a partial cover is stated ("Needs, your fullest account, can cover ₮30,000 of it"). |
| UI-03 / CODE-03 | Medium | Changing the income amount wiped split rows the user had edited. | Fixed: edited rows keep their value; untouched rows follow the shares. |
| UI-04 | Medium | The shares summary misstated the split when the receiving account has a share. | Fixed: one sentence on both forms and in the summary — the account an income arrives in keeps whatever the others don't take. |
| UI-05 | Medium | "Record anyway" (accent colour, weight 600) looked stronger than Cancel. | Fixed: muted `--text-2` at normal weight. Contrast check still passes in 16 themes. |
| UI-06 | Low | Income-edit refusals did not say what to do. | Fixed. |
| UI-07 | Low | The edit sheet's share field had no helper. | Fixed. |
| UI-08 | Low | The "Stays in" line could go negative, and the refusal landed on the first row. | Fixed: "The split is ₮X more than the income"; the refusal lands on the row the user edited. |
| CODE-02 | Low | Deleting a money move, or moving a future-dated expense's date to today, can push an account negative without the dialog. | **Open: needs a Chief Architect ruling.** The code follows E5 as written; this asks whether those paths count as spending. |
| CODE-04 | Low | The share check sat under the transfer-ends comment. | Fixed. |
| (unverified in review) | — | "Record anyway" over the edit sheet closes two modals in one task. | **Measured and fixed. It was a real bug.** Chrome treats two `history.back()` calls in one task as a single traversal, which left `expectedPops` at 1, so the user's next Back press was swallowed. Closes now accumulate into one `history.go(-n)`. The probe fails on the previous commit ("expectedPops is 1") and passes now. |
