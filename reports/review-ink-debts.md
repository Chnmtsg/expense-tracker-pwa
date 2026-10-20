# The Ink redesign of the Debts screen, and what was done about it

2026-10-19. Request: `design-request-ink-debts.md` (handoff screens 1a·05 and
1a·06). Reports: `ui-review-ink-debts.md` (52/100), `code-review-ink-debts.md`
(52/100), `engineering-manager-ink-debts.md`. Ruling:
`chief-architect-ink-debts.md` (the corrected design approved in 21 ordered
steps; step 1 was the ruling itself). One commit per step, merged slice by
slice to `main`. WORK numbers are this round's own.

| Step | Item | Commit | Outcome |
|---|---|---|---|
| 2 | WORK-12 | 2a21851 | `debtNextDate` + `debtDueState` extracted; the bell and the card read them. New flow pins the tie and the 30-day edge. |
| 3 | WORK-05 (extract) | 2240228 | `debtRateLineHTML(d)`, word for word; the ruled sentence is written once. |
| 4 | WORK-11 (extract) | 8209da2 | `deleteDebt(id)`, same cascade, resolves true/false. |
| 5 | WORK-03, WORK-02 | cd8da11 | `#debtDetailModal`, the one surface PDR12 was lifted for; Back closes the top layer (navigation.js flow). |
| 6 | WORK-04, WORK-21 | 811752d | `debtCardParts(d)`; card HTML byte-identical across five states; the detail carries every fact, the relationship sentence and a Payments row. |
| 7 | WORK-05, WORK-17 | 1f6c93c | Rate slot verbatim in the detail; no market line, no "why this matters". |
| 8 | WORK-06 | 8673d64 | State-dependent footer: Mark settled / + Payment; Settled on · Change / demoted + Payment. |
| 9 | WORK-11 (detail) | 4bb94d1 | Delete under Edit, one cascade; closes edit and detail. |
| 10 | WORK-10 | 8c52342 | Detail re-renders on every write; closes with its own message when another window deletes its debt (cross-window case 3). |
| 11 | WORK-19, 15, 16 | 713f65f | Cards become rows; ~25 flows re-anchored to row and detail; three ring pairs in check-contrast. Ring track deviates from the ruling's `--text-3` (measured 2.56:1 in the default theme) to `--surface-3`. |
| 12 | WORK-13 | 370df9c | Cleared fold restyled only. |
| 13 | WORK-08 | c5fa8fc | Bar = paid ÷ (paid + still owed); condition 9 gains a settled-short case. |
| 14 | WORK-07 | 78a3408 | Borrowed leaves the summary; both sentences stay visible. |
| 15 | WORK-14 | 4824044 | Still owed at `--t-hero`; nine digits measured at 216px of 254 at 320, so no fit-to-width code. |
| 16 | WORK-22 | 4938546 | `debtScheduleOccurrences`, bounded, anchor-day walk. |
| 17 | WORK-01 | a161153 | "Coming up": upcoming instalments only, "Next" in words, nearest six then a count; nothing scores. Two schedule conditions restated: terms in the ruled surfaces only. |
| 18 | WORK-18 | f5e5d5e | "Final instalment" tile beside the due chip (PDR1). |
| 19 | WORK-20 | 3aa9d85 | Detail's + Payment pre-fills min(next instalment, still owed); label stays "+ Payment". |
| 20 | WORK-23 | f38ae2d | One add entry: the disclosure's summary reads "+ Add debt". |
| 21 | WORK-24 | b9312d0 | Due-date order, on the owner's recorded confirmation; condition 8b rewritten. |

Not built, by the ruling: WORK-08 (rejected); the WORK-07 behaviour change of
closing modals before a sign-in redirect belongs to the startup sign-in round,
not this one. Deferred with triggers: `fitToWidth` (only if 320 or the language
layer overflows the headline), shortening the gated cost sentence (a request
against ABR7), a market comparison (product-strategy.md first), the add form in
a sheet.

Harness lessons recorded in memory: Chrome keeps 50 session-history entries,
so a probe's synchronous block that batches more modal closes than that leaves
`expectedPops` stuck or hangs the run (accounts.js sits at ~48); and inline
scripts here can lose backslashes, which turned `/\s+/` into `/s+/` twice.

`npm test` exits 0 after every commit, debts at 320 and 390. Lint stays at 17
warnings. `sw.js` still reads v34: nothing in this round has been published.
