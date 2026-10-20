# Review request: the latest upgrades in every theme

2026-10-20. Owner's words: "can you review the each theme for our latest
upgrades? Is there any improvement of latest updates UI, UX?"

The code is live branch `live-v35` in `D:/3_Claude/PowerApps-live`. Live
(published) is v37; v38 is built and unpublished. The latest upgrades are:

1. **Quick add (v35–v37, live):** full-screen Enter amount on phones; the
   keypad digits at `--t-h2`; the sheet stays open after Save; chips outlined
   on the surface with "CATEGORY"/"DETAILS" labels and icons on Date, the
   account and Note.
2. **Debts round (v38, unpublished;** `reports/chief-architect-debts-1a05.md`):
   rows instead of cards, the Still owed hero and bar, the debt detail sheet
   with "Final instalment", the Schedule list (Paid / Next / Overdue dots,
   "N paid" and "N more" folds), the Payments row, the Pay prefill, the bell's
   missed instalment; and the "Loan payment · {debt}" row in Expenses with
   "₮170,000 paid, ₮45,000 of it is cost".

## Evidence: every theme, four screens

`reports/themes-debts-1a05/`, 16 PNG sheets, 4 themes each, 360×760 per
panel, each theme in its own browser (no shared storage):

| Screen | Sheets |
|---|---|
| Quick add (Groceries chosen, ₮12,500) | `quick-1.png` … `quick-4.png` |
| Debts list | `debts-1.png` … `debts-4.png` |
| Debt detail, scrolled to the schedule (one instalment overdue, part-paid) | `detail-1.png` … `detail-4.png` |
| Expenses with a loan row | `expenses-1.png` … `expenses-4.png` |

Sheet order: 1 = light, mint, sepia, ocean; 2 = forest, rose, flamingo,
kingfisher; 3 = dark, slate, nord, midnight; 4 = peacock, gold, owl, oled.

`npm run verify` measures 36 text/surface pairs per theme for AA
(`tools/check-contrast.mjs`); it does not measure non-text graphics (chip
outlines, dots, the ring, the bar track) or how a theme's accent reads.

## Questions

1. Does any theme lose a state or a boundary on these screens (outlined chips
   against the surface, the selected chip, the dots, overdue vs next colours,
   the ring and bar tracks, the folds)?
2. Are there theme-specific failures (an accent that clashes, text on accent
   fills, a colour meaning two things)?
3. What UI/UX improvements to the latest upgrades are worth making, smallest
   first?
