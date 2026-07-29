# Chief Architect — Final Engineering Decision

**Inputs received and read in full:**
- `D:\3_Claude\PowerApps\reports\ui-review.md` — 30 findings, 66/100, no Critical
- `D:\3_Claude\PowerApps\reports\code-review.md` — 24 findings, 58/100, one Critical
- `D:\3_Claude\PowerApps\reports\engineering-manager.md` — 50 `WORK-` items, PREREQ-A, conflicts C1/C2/C3

**Measured against:** `D:\3_Claude\PowerApps\knowledge\project.md`, `D:\3_Claude\PowerApps\knowledge\review-conventions.md`, `D:\3_Claude\PowerApps\CLAUDE.md`.

All three reports were present. All 50 `WORK-` items plus PREREQ-A are ruled on below. Nothing is left silent.

I independently verified the three load-bearing claims before ruling: `save()` at `expense-pwa/index.html:2079-2082` has no `try`/`catch`; `autoAdvancePlannedRecurring()` at `index.html:2940-2956` mutates and persists user data from a render path; and there is no `.git` directory in the repository. All three reviewer claims are accurate.

---

## Executive Decision

**No. This application is not fit for release.**

Every write in the product goes through an unguarded `localStorage.setItem()` that fails unconditionally in Safari private browsing and on quota exhaustion, and the user is never told — in a finance application whose only durable store is that same API. Reading the code at `index.html:2940-2956` myself, the picture is worse than "wrong figures": `autoAdvancePlannedRecurring()` runs from `renderExpenses()`, mutates `p.date` in place, and when a schedule passes its end date it drops the record from `db.planned` and calls `save()` — a render pass permanently deletes user records. The two reviewers do not actually disagree; the UI reviewer assessed observable behaviour and both of these failures are invisible from the interface, which is precisely why they are dangerous. The remaining 45 items are real but none of them are why this app cannot ship — the data layer is, and it is roughly six engineer-days of contained, additive work to close.

---

## Conflict Rulings

### C1 — Cloud Sync: remove it, or repair it? → **Hide it. Do not repair it. Do not delete it yet.**

The UI Review is right and the Code Review is right about different things, and the resolution is neither of their headline recommendations taken whole.

**Ruling:** `WORK-12` is approved as written — when `isFirebaseConfigured()` is false, the Cloud Sync card is hidden and the setup guide moves to repository documentation. A consumer finance product for people with "little accounting knowledge" must not display a card promising their most valuable feature and then instruct them to open `index.html` in a text editor.

Once that card is hidden, `WORK-05` (last-write-wins overwrite) and `WORK-14` (invisible sync failure) fix code that no shipped user can reach. Fixing unreachable code is not risk removal; it is work for its own sake. Both are **Deferred**, and they become **preconditions**, not options, the day anyone decides to ship a configured Firebase project. `CODE-05` is a data-loss defect; cloud sync must not be enabled with it open.

I explicitly **reject** the third option nobody proposed — shipping a configured Firebase project now. That would convert `CODE-05` from latent to active for every multi-device user while the local data layer is still losing writes silently. It also introduces a hosted dependency into an application whose first principle is offline-first.

I also **decline to delete** the ~170 inert lines today. Deleting them is a second, unrelated change (`CLAUDE.md`: never implement multiple unrelated features in one task), it is irreversible in a repository with no history, and it is not what removes the user-facing risk. Revisit deletion after PREREQ-A, when deletion becomes a revertible commit rather than a permanent act. Until then the module is **quarantined**: inert, hidden, and off limits for extension.

### C2 — Is there a release blocker? → **Yes. I ratify the Engineering Manager's assumption, and I narrow the gate.**

The Engineering Manager was correct to escalate this rather than assume it, and correct that the two reports are not contradictory.

**Ruling on the principle:** severity belongs to the reviewer who raised it; the *release gate* belongs to me. I do not re-grade any finding. Instead I apply the convention's own definition of Critical — "data loss, wrong financial figures, a security hole" — as the gate test, regardless of the label a reviewer assigned. Anything meeting that description blocks release even if it was recorded as High.

**The release gate is exactly these items:**

| Gate item | Why it meets the Critical definition |
|---|---|
| PREREQ-A | Not user risk. We cannot ship fixes to a 5,522-line file we cannot diff, bisect or roll back. |
| WORK-01 | Data loss. Unsignalled. Verified. |
| WORK-02 | Data loss. The first write overwrites the only recoverable copy. |
| WORK-03 | Wrong financial figures on the Dashboard, plus persisted record deletion from a render path. |
| WORK-04 + WORK-15 | The only place untrusted data enters the system; bad records are persisted before they crash the render, and `group` is a stored-XSS vector on the same path. |
| WORK-10 | Drives the duplicate-planned-expense loop, which corrupts Planned vs Actual and "Planned Left". This is a financial-correctness defect wearing a UX costume. |
| WORK-12 | Ruled in on product-integrity grounds, stated openly: a consumer product must not ask users to edit source code. Half a day. |

**Not in the gate:** WORK-06, WORK-07, WORK-08, WORK-09, WORK-11. These are genuine High findings and they are approved and scheduled immediately after the gate, but under the shared convention High is "significantly harder or riskier to use", not "blocks release". I will not inflate the gate — an inflated gate is how real gates get ignored. The Engineering Manager's proposed gate of "WORK-01 through WORK-12" is **overruled as too broad**: it is ≈10 engineer-days where ≈6 removes the risk.

### C3 — Which is authoritative, the shipped app or `knowledge/project.md`? → **`project.md` is authoritative as vision; the shipped app is authoritative as inventory. Amend the document.**

**Ruling:** take UI-05 option (a). `knowledge/project.md` is amended so its Core Modules list describes what exists — Dashboard, Salary Calculator, Income, Expenses, Daily, Goals, Settings — and Budget Planning, Analytics and Reports move into the Long-term Vision list where Cloud Sync already sits. `WORK-13` as an XL build is **rejected**; `WORK-13` as a documentation reconciliation is **approved**.

Three reasons:

1. No user was promised these modules. The app never claims them anywhere in the interface. The divergence costs the team its prioritisation baseline, not the user their money. The cheapest fix for a documentation defect is a documentation edit.
2. Building three XL modules on a data layer that silently loses writes and deletes planned records during rendering is backwards. Correctness of financial data outranks feature surface.
3. Trimming the brief does **not** collapse the architectural argument, which was the Engineering Manager's stated fear. `WORK-17` (`schemaVersion`) survives entirely on present-tense merit: `WORK-03` changes a persisted shape, backup files of the old shape already exist in the wild, and without a version field no future migration can tell them apart. `WORK-03` itself is justified by a wrong number on the Dashboard today, not by a Reports module tomorrow. Only `WORK-19`'s file split loses its justification — and I am deferring that anyway, on its own merits.

**Consequence for `WORK-35`:** the ruling does not remove Income from the core module list, so UI-18's premise survives. But the proposed remedy — swapping Daily out of the tab bar for Income — is rejected within the deferral. See Deferred.

### Sequencing deviation — WORK-17 (`schemaVersion`) ahead of WORK-03 (recurrence rework) → **Confirmed. The Engineering Manager is right and the Code Review's own step order is overruled here.**

`WORK-03` turns `p.date` from a mutable cursor into an immutable anchor plus `lastConvertedDate`. That is a persisted-shape change. `CODE-09`'s own recommendation says to add the version "before any further data-shape change", and the code reviewer's step ordering optimised for how fast risk is retired, not for what is irreversible. Irreversibility wins in a repository with no version control and with backup files already distributed. `WORK-17` is S effort and shares a single `load()` edit with `WORK-16` and `WORK-25`, so the cost of doing it first is close to zero.

One correction to the plan: `WORK-25` removes two dead keys from `validateImport()`, and `WORK-04` rewrites that same function. `WORK-25`'s import-path change must land **inside** `WORK-04`'s rewrite, not as its own edit. And backward compatibility is binding — an old backup file still containing `recurringIncome` or `osPermission` must import cleanly, ignored, not rejected.

### PREREQ-A — version control → **Approved and elevated to item zero. No engineering work of any kind starts before it.**

The Engineering Manager was correct not to mint a `WORK-` ID for something no reviewer raised as a numbered finding — that is exactly the discipline the conventions ask for. It does not need an ID to be mandatory. It is under thirty minutes, it multiplies the cost and the risk of every other item on this list, and it is the difference between "we tried a fix and reverted it" and "we tried a fix and the app is now different in ways nobody can reconstruct." It is also what makes my C1 deferral of the Firebase deletion safe. Nothing else in this report is authorised to begin until the repository has an initial commit of the current, unmodified state.

---

## Approved Improvements

38 items. Where I narrowed the scope, the narrowing is binding and stated.

| Item ID | Title | Reason for approval |
|---|---|---|
| PREREQ-A | Put the repository under version control | Under thirty minutes; makes every other item revertible. Item zero. |
| WORK-01 | `save()` has no failure path | The Critical. Verified. Approved in the reviewer's exact shape: `try`/`catch`, visible failure banner, boolean return. **No retry, no fallback store** — making failure visible is the whole fix. |
| WORK-02 | Corrupt JSON swallowed then overwritten | Irreversible loss of the entire financial history. Quarantine to a side key before falling back. |
| WORK-03 | Rendering rewrites stored planned dates | Wrong figures on the Dashboard today, and I verified a render pass persistently deletes records past their end date. A render must never write. |
| WORK-04 | `validateImport()` validates containers, not records | The only place untrusted data enters the system, and it persists before it crashes. |
| WORK-06 | Touch targets below the mandated 44×44 px | The app violates its own written rule on Edit and Delete — adjacent, undersized, one destructive. Mobile-first is not negotiable. |
| WORK-07 | Amounts and tags fail WCAG AA contrast | The numbers the product exists to communicate are the least readable text on screen. Approved in the text-only-variant shape; existing tokens stay for fills and bars. |
| WORK-08 | No form input is programmatically labelled | 67 labels, zero `for=`. Mechanical, no design input, unblocks every form for assistive technology. |
| WORK-09 | Core interactions unreachable by keyboard | Whole features are closed to keyboard and switch users. Co-scheduled with WORK-26 — same code paths, touch them once. |
| WORK-10 | Entries vanish when outside the active filter | Produces duplicate planned expenses, which corrupt Planned vs Actual. In the release gate. |
| WORK-11 | Salary Calculator unusable without payroll knowledge | Its output is written straight into the Income ledger; a wrong SI/WHT assumption propagates into every figure. |
| WORK-12 | Non-functional Cloud Sync card with developer instructions | C1 ruling. Hide the card when unconfigured. |
| WORK-13 | Two core modules do not exist in the interface | **Approved as documentation reconciliation only (UI-05 option a).** The XL build is rejected. See C3. |
| WORK-15 | Category `group` interpolated without escaping | Stored XSS on the import and cloud-load paths. Four `escapeHTML()` wraps plus a load-time constraint. |
| WORK-16 | Settings merge order discards notification defaults | Defeats the very defaults mechanism it was written to provide. One spread moved. Same `load()` edit as WORK-17. |
| WORK-17 | No schema version, no migration framework | Precondition for WORK-03's shape change and for migrating backup files already in the wild. Sequencing confirmed. |
| WORK-18 | Service worker is network-first for the app shell | Direct contradiction of two stated project principles, Fast and Offline-first. A weak connection hangs the launch. Approved as stale-while-revalidate for the shell only. |
| WORK-21 | Recurrence stepping implemented four times | Approved **only as a by-product of WORK-03**, not as separate work. The copies have already drifted on end-date handling; the rework touches all four sites anyway. |
| WORK-24 | Projected occurrences missing from Day Details | The app contradicts itself on the drill-down screen. Cheap once WORK-03 lands; must not precede it. |
| WORK-25 | Dead persisted fields and one mislabeled setting | The mislabeled checkbox misleads the named target user. Dead keys are the most expensive dead code. **Constraint:** land inside WORK-04's `validateImport()` rewrite; old backups carrying those keys must still import. |
| WORK-26 | Modals are not accessible dialogs | Escape-to-cancel and focus restoration on the delete-confirmation modal. Co-scheduled with WORK-09. |
| WORK-27 | Status messages never announced | Two attributes make every success and error message audible. |
| WORK-28 | Validation errors only as a transient toast | Extends a pattern that already exists in the file for Hourly Rate. No new mechanism. |
| WORK-29 | Header reserves the top inset at its bottom | One value in a CSS shorthand removes a ~47 px dead band from every screen on the exact device class this PWA targets. |
| WORK-30 | Dashboard KPI labels do not say what they measure | "Net Balance ₮0" on the 1st of the month tells a non-accountant the app lost their money. |
| WORK-31 | Advisor outranks user data and nags on fresh install | A red critical badge derived from three data points, above every chart of the user's real data. |
| WORK-32 | Currency figures break mid-number | A figure split across two lines is misread at a glance, on the Dashboard's primary tiles. |
| WORK-33 | Negative amounts render as "₮-5,000" | A deficit is visually identical to a surplus on the app's largest number. Financial presentation correctness. |
| WORK-36 | Placeholder text fails AA contrast | Placeholders carry the only affordance hint on the readonly date fields, which otherwise look broken. |
| WORK-38 | Salary income stored as floating point | Financial correctness. Every other money path stores integers. XS. |
| WORK-40 | `drawPvA()` aggregates by name, not id | Two same-named categories silently merge into one row with the wrong group. Wrong financial aggregation. XS. |
| WORK-39 | Salary percentages unvalidated, wrong message | One more branch of WORK-28 plus a corrected message. Free if done together; approved bundled with WORK-28. |
| WORK-41 | `wireIconGrid()` leaks a document listener per modal open | Unbounded in a long-lived installed PWA. Approved **bundled into WORK-26**, which is already rewriting the modal open/close lifecycle. |
| WORK-42 | Advisor mixes period-filtered and all-time data | **Approved in the labelling shape only** — tag the three rules "vs last 30 days". The rescoping variant is rejected; it would depend on WORK-20, which is deferred. |
| WORK-43 | Import `FileReader` has no error handler | One line, on the screen a user reaches when their data is already at risk. |
| WORK-46 | Tab accessible name differs from visible label | WCAG 2.5.3. Removing a redundant attribute. Bundle with the WORK-08 sweep. |
| WORK-47 | `role="tablist"` without the tab pattern | **Approved in the "drop the roles, use `aria-pressed`" shape only.** Completing the full ARIA tab pattern is rejected — it is more code to keep a promise nothing needed made. |
| WORK-48 | PWA install: dark splash, maskable icon outside safe zone | XS, first impression on install, and a clipped home-screen wordmark on the target platform. |
| WORK-49 | Long note text pushes rows past the viewport | Introduces page-level horizontal scrolling, which the UI guidelines prohibit. The file already guards this pattern elsewhere. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-44 | Two different empty-state treatments | Both treatments work and every list has one. Nothing fails for the user. This is a preference for uniformity, and uniformity is not a risk. Rejected outright. |
| WORK-50 | Enforce declared design-token scales across the file | Rejected as an L-effort sweep. A large mechanical diff across a 5,522-line file, touching type, spacing, radius and 159 inline styles at once, is high-churn work with no user-visible outcome and a real chance of visual regression — and it violates "never implement multiple unrelated features in one task." The Code Review's own recommendation on CODE-24 was explicit: *"Do not do a sweep. Promote the repeated clusters as those areas are next touched."* I adopt that as a standing convention rather than a work item. See Architecture Strategy. |

Two further rejections are recorded inside their items' rulings rather than as separate lines, because they are scope narrowings on items I otherwise approved: the **XL build** of WORK-13 (rejected, C3), the **full ARIA tab pattern** option in WORK-47, the **rescoping** option in WORK-42, and the **tab-set swap** proposed in WORK-35 (see Deferred).

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-05 | Cloud sync overwrites the whole document last-write-wins | A decision to actually ship a configured Firebase project. At that moment this stops being deferred and becomes a **precondition** of enabling sync — not a follow-up. It is a data-loss defect and cloud sync does not ship with it open. |
| WORK-14 | Sync failures invisible; UI shows stale success | Same trigger as WORK-05. Both reviewers raised it independently and they are right, but it is XS work on a code path no shipped user can reach once WORK-12 lands. |
| WORK-19 | No module boundaries; UI persists storage directly | **Split ruling.** The half that removes real risk — a single `store` seam owning load/get/mutate/save, and the ban on `save()` from any `render*` function — is already delivered by WORK-01 and WORK-03 and is approved there. The remaining half, the XL file split into `app.js` + `styles.css`, is deferred. What would change it: the file needing to grow again (a new screen or collection), or the arrival of a second engineer, at which point a reviewable diff stops being a convenience and becomes a requirement. Do not split the file as an end in itself. |
| WORK-20 | `analyzeExpenses()` is 328 lines and 24 rules | An explicitly no-behaviour-change refactor of code that currently works. What would change it: the next advisor rule being added, or a defect traced to rule interaction. It is then done one rule at a time, as the reviewer described — never as a single large edit. WORK-31 must have landed first. |
| WORK-22 | Drag-to-reorder copied for categories and income types | 45 byte-for-byte identical lines with no observed defect and no drift, unlike the recurrence duplication in WORK-21 which had already diverged. What would change it: either copy needing a behavioural change. Fix it in that edit, not before. |
| WORK-23 | Charts re-scan the full transaction list per day/month | The analysis is sound and the complexity is real, but the trigger is a dataset nobody has yet. What would change it: a measured render time above ~100 ms on a mid-range phone with a realistic dataset, or a single user report of a stall. Measure before optimising; the fix is local and will still be local later. |
| WORK-34 | Category colours repeat after twelve | The app ships nine defaults and the labelled breakdown already exists via `renderDaySelected()`. What would change it: evidence that users routinely exceed twelve categories, or this being free while WORK-07/WORK-37 are open in the same palette code. |
| WORK-35 | Income and Salary two taps deep, no back affordance | **The proposed remedy is rejected** — swapping Daily out of the tab bar for Income trades one navigation complaint for another and is churn on the primary mobile surface. The underlying affordance problem is real: the More pill does not indicate which sub-screen is open. What would change it: evidence that income is being under-recorded relative to expenses, which would justify the depth change; absent that, only the cheaper affordance half is reconsidered, and only when the tab bar is next touched. |
| WORK-37 | Group and status colours collide across themes | Real, but the tags carry text labels, which is the reviewer's own reason it is not High, and this is an M-effort palette change across sixteen themes. What would change it: WORK-07 landing and the collision still causing misreads once the text-only status variants exist. Re-measure then; WORK-07 may have already separated them. |
| WORK-45 | Raw ISO dates in most places, long-form in one | ISO is unambiguous, merely unfamiliar, and nothing fails. What would change it: this becoming near-free while list-row rendering is already open — `fmtDate()` sits next to `fmt()`, which WORK-32 and WORK-33 are already editing. If it is not free in that pass, leave it. |

---

## Development Order

Sequenced by irreversibility first, then by risk removed per day, then by cost. Effort figures use the Engineering Manager's nominal conversion.

### Stage 0 — Make the work revertible (≈0.25 d)
**PREREQ-A.** Initial commit of the current, unmodified state before a single character changes. Everything below assumes it.

### Stage 1 — The release gate: data durability and correctness (≈5.5 d)
Order is dictated by what is irreversible, not by what is cheapest.

1. **WORK-01** — the write must fail loudly before anything else is trusted to write. Introduces the `store` seam that WORK-02 and WORK-17 hang off.
2. **WORK-02** — inside the same object. Never let the first write overwrite an unparsed blob.
3. **WORK-17 + WORK-16 + WORK-25** — one `load()` edit. Version first, because everything after it changes shape. WORK-16 and WORK-25 are free here and expensive anywhere else.
4. **WORK-04 + WORK-15** — one hardening of the single untrusted-data entry point. WORK-25's `validateImport()` change lands inside this rewrite, not separately. Old backups must still import.
5. **WORK-03 + WORK-21 + WORK-24** — the shape change, now that there is a version to branch on. `stepDate()` and the Day Details fix fall out of the same rework; doing WORK-24 first would layer a fix on a model that still destroys history.
6. **WORK-10** — closes the duplicate-planned-expense loop that corrupts the figures WORK-03 just made correct.
7. **WORK-12** — hide the Cloud Sync card. Independent; last in the gate because it is the only non-data item in it.

**Gate closes here. Nothing ships before this point.** Re-run the full review after Stage 1 — `CLAUDE.md` step 6 — before declaring the gate closed.

### Stage 2 — Ship quality (≈2.5 d)
8. **WORK-18** — offline-first is a stated principle the service worker currently contradicts. Isolated to `sw.js`; do it alone so a caching regression is attributable.
9. **WORK-30, WORK-33, WORK-32, WORK-29, WORK-49, WORK-48** — six XS items. Every one removes a misreading or a visible defect for a fixed, tiny cost. Batched because they share no code and cannot mask each other.
10. **WORK-13** — amend `knowledge/project.md`. Do it here, before Stage 3 planning, so the next prioritisation is made against a document that is true.

### Stage 3 — Accessibility, cheapest first (≈4 d)
Placed here deliberately. Six of eight UI High findings are accessibility and they are the easiest items to quietly drop when data work overruns — the Engineering Manager flagged that risk and was right.

11. **WORK-08 + WORK-46 + WORK-47 + WORK-27** — mechanical, no design input, no dependencies. Largest accessibility gain per hour in the whole backlog.
12. **WORK-06** — CSS-only, brings the app in line with its own rule.
13. **WORK-07 → WORK-36** — contrast. WORK-07 first because it establishes the AA ratios everything downstream must preserve; running the palette work first would force its measurements to be redone.
14. **WORK-09 + WORK-26 + WORK-41** — one body of work in the modal and focus code paths. Touch those helpers once.

### Stage 4 — Comprehension and financial presentation (≈3 d)
15. **WORK-11** — the one screen where a misunderstanding changes reported figures.
16. **WORK-28 + WORK-39** — one pattern, applied everywhere, plus the branch it was missing.
17. **WORK-31** — before any future WORK-20; a targeted change is cheap now and a constraint to preserve later.
18. **WORK-38, WORK-40, WORK-43, WORK-42** — four small correctness and honesty fixes. WORK-42 in labelling form only.

**Total approved: ≈18–20 engineer-days**, against ≈48 in the roadmap. Roughly 28 days are rejected or deferred, of which 16 are the two XL items I have declined to authorise as builds.

---

## Architecture Strategy — Next Quarter

**What stays, permanently.** Offline-first and mobile-first. No build step, no package manager, no framework, no bundler. Two optional remote resources with working fallbacks, and no more. The Code Review found the dependency story clean and minimal; that is an asset, not an accident, and it is the reason this app can be reasoned about at all. Zero-dependency is the architecture, not a phase before the real one.

**What changes.** One thing: the data layer gains a seam. A single `store` object owns load, get, mutate and save, with error handling, corrupt-blob quarantine and the schema version inside it. Every mutation goes through it. **No `render*` function may call `save()` — ever.** That single rule is what makes `CODE-03` structurally impossible rather than merely fixed, and it is the entire structural change I am authorising this quarter. It arrives as a by-product of WORK-01 and WORK-03, not as a project.

**What is off limits.**
- **No rewrite.** The Code Review is explicit — steps 1 through 4 are additive, local and backward compatible. I am approving those and nothing beyond them. Never approve a rewrite where a refactor removes the same risk.
- **No file split this quarter.** 5,522 lines in one file is a cost, not a hazard. It becomes a hazard when a second engineer arrives or the file grows again. Splitting a file is not the same as having modules.
- **No new modules.** Budget Planning, Analytics and Reports are vision items. Nothing on the long-term list is built on a data layer that only stopped losing writes last sprint.
- **No cloud sync.** Quarantined and hidden. Not extended, not deleted yet, not enabled without WORK-05 and WORK-14 landing first.
- **No large mechanical sweeps.** Standing convention replacing WORK-50: *when you next touch an area, snap its values to the declared tokens and promote repeated inline clusters to classes.* Tokens get enforced by attrition, not by a diff nobody can review.

**Standing rules for the quarter.** Backward compatibility is binding on every persisted-shape change — a backup file exported today must import a year from now. Every data-shape change goes behind a numbered migration; there is no second exception now that WORK-17 exists. One concern per change, so a regression is attributable to a commit.

**One risk I am recording, not raising as a finding.** Neither reviewer filed it as a numbered finding, so it does not enter the backlog and no one may treat it as one: there is no automated test of any kind, and Stage 1 rewrites the persistence, migration and recurrence logic of a finance application. The Code Review notes under Technical Debt that "nothing here can be unit tested." The mitigation I am mandating is procedural, not architectural — PREREQ-A first, one concern per commit, and a manual export-then-import round-trip verified after each Stage 1 step. If the team later wants a test seam, the `store` object created in WORK-01 is where it goes, and that is a decision for next quarter with evidence, not this one.

---

## Executive Report

The three reports are consistent with each other and both scores are earned. The UI Review's 66/100 and the Code Review's 58/100 describe the same product from two vantage points: a visible surface that is genuinely better than average — real design tokens, empty states everywhere, confirmation on every destructive action, disciplined date handling — sitting on a foundation that is not safe. The UI reviewer recorded no Critical because both of the disqualifying defects are invisible from the interface. That is not a miss; it is the finding.

I ratify both scores unchanged, ratify the Engineering Manager's release-blocked reading of C2, and narrow its gate from eleven items to seven plus PREREQ-A. Of 50 `WORK-` items I have approved 38, deferred 10 and rejected 2, and I have narrowed the scope of five more inside their approvals — most consequentially by refusing both XL builds. `WORK-13` becomes a documentation edit rather than three new modules, and `WORK-19` becomes a rule about where `save()` may be called rather than a file split. That takes the committed backlog from ≈48 engineer-days to ≈18–20, and the release gate itself to ≈6.

The single most important decision in this report is not on the backlog at all. This repository has no version control, and the first work item rewrites the persistence layer of a finance application in a 5,522-line file. Every reviewer noticed the file; the code reviewer alone noticed the absence of history and called it "the cheapest debt on the list to retire." He was right, and it is the one item where doing nothing is unacceptable at any price.

The application is not fit for release today. It is roughly six engineer-days of contained, additive, backward-compatible work from being fit for release — and none of that work requires a rewrite, a framework, a new module or a design decision.

---

## Implementation Priority

| # | Item(s) | Gate | Effort |
|---|---|---|---|
| 0 | PREREQ-A — version control, initial commit of unmodified state | **Blocking** | XS |
| 1 | WORK-01 — guarded write, visible failure banner, `store` seam | **Release gate** | S |
| 2 | WORK-02 — corrupt-blob quarantine | **Release gate** | S |
| 3 | WORK-17 + WORK-16 + WORK-25 — `schemaVersion`, migration list, merge order, dead fields | **Release gate** | S + XS + XS |
| 4 | WORK-04 + WORK-15 — per-record import validation, escape and constrain `group` | **Release gate** | S + XS |
| 5 | WORK-03 + WORK-21 + WORK-24 — recurrence as schedule, `stepDate()`, Day Details | **Release gate** | M |
| 6 | WORK-10 — warn when a new entry falls outside the filter | **Release gate** | S |
| 7 | WORK-12 — hide the unconfigured Cloud Sync card | **Release gate** | S |
| — | **Re-review (CLAUDE.md step 6). Gate closes. Release permitted.** | | |
| 8 | WORK-18 — stale-while-revalidate app shell | Ship quality | S |
| 9 | WORK-30, WORK-33, WORK-32, WORK-29, WORK-49, WORK-48 | Ship quality | XS ×6 |
| 10 | WORK-13 — amend `knowledge/project.md` to the shipped module set | Ship quality | XS |
| 11 | WORK-08, WORK-46, WORK-47, WORK-27 — mechanical accessibility | Accessibility | S + XS ×3 |
| 12 | WORK-06 — 44×44 touch targets | Accessibility | S |
| 13 | WORK-07 → WORK-36 — contrast, in that order | Accessibility | M + S |
| 14 | WORK-09 + WORK-26 + WORK-41 — keyboard, dialogs, listener teardown | Accessibility | M |
| 15 | WORK-11 — expand SI/WHT, annotate defaults | Comprehension | S |
| 16 | WORK-28 + WORK-39 — inline validation everywhere | Comprehension | S + XS |
| 17 | WORK-31 — advisor placement and fresh-install gating | Comprehension | S |
| 18 | WORK-38, WORK-40, WORK-43, WORK-42 (labelling only) | Correctness | XS ×3 + S |

Deferred, revisited only on their stated triggers: WORK-05, WORK-14, WORK-19, WORK-20, WORK-22, WORK-23, WORK-34, WORK-35, WORK-37, WORK-45. Rejected: WORK-44, WORK-50.

---

## Recommended Next Action

**Approve PREREQ-A and authorise Stage 1 as scoped above — nothing more.** The single next action is to place `D:\3_Claude\PowerApps` under version control and commit the current state unmodified, before any file is edited. It costs under thirty minutes, it is the only item in this report that is unacceptable to skip at any price, and it is what converts every subsequent fix from an irreversible act into a revertible commit. On your approval, the first code change is `WORK-01` at `D:\3_Claude\PowerApps\expense-pwa\index.html:2079-2082` — a `try`/`catch`, a boolean return, and a visible failure banner — and no other work begins until that commit exists. This workflow has reviewed and decided; it has not implemented, and I have started nothing.
