# Code Review: Accounts (Phase 1)

2026-10-09, branch accounts-phase1 (a6d4f02..6b05397). Score 78/100.

| ID | Severity | Finding | Fix |
|---|---|---|---|
| CODE-01 | High | The edit sheet let a planned expense take "Paid from". Logging that plan as actual writes no account, so the account was dropped without a word and the balance was overstated. accountUseCount also counted plans that no row labels. | The edit-sheet field is Actual-only and follows the Actual/Planned toggle. A move to Planned deletes accountId, and plans are no longer counted. |
| CODE-02 | High (release gate) | The ruling's accepted risk requires the cache-key bump in the same release, but sw.js was still v24. | Bumped to v25 on the branch. |
| CODE-03 | Medium | The starting balance had two definitions, and the formula follows only the edit-sheet one. | Shared with UI-01: one label ("Starting amount") and one definition. |
| CODE-04 | Low | The Data Summary harness flow checked labels, not the clear controls. | It now asserts no clear button on Accounts and one on Money moves. |

Clean: money arithmetic, persistence and backward compatibility (C1/C2),
write paths (C6/C8), escaping, error handling, performance.
