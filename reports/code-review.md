# Code Review — Round 13

*(The agent is read-only by role definition; this is its complete report, transcribed unmodified.)*

**Scope:** `expense-pwa/` (index.html ~9,424 lines, sw.js, manifest, docs) and `tools/` (4 static predicates, 1 render runner, 5 probes), with particular attention to the round-12 changes WORK-170..WORK-186.
**References:** `knowledge/coding-standards.md`, `knowledge/project.md`, `knowledge/review-conventions.md`, and the Supplemental Decision, Round 12 in `reports/chief-architect.md`.

---

## Executive Summary

The application is in good shape and round 12 did what it was approved to do. I re-derived the money arithmetic, the store seam, the debt edit path and the un-scoped CSS at source, and all four hold: `debtInterestPaid`'s cap is correct at every boundary I could construct including `Infinity` and `NaN` inputs; the debt edit branch mutates in place and orphans nothing; `importReplacement` is a genuinely hoisted top-level declaration and is safe on the boot path; and un-scoping `button.goal-add`/`button.goal-icon-btn` reaches exactly the two markup sites that carry those classes and nothing else.

The single biggest risk is not in the application — it is that `npm run verify` cannot see a syntax error placed inside an HTML comment that lives inside a JavaScript template literal, and the file contains four such comments, two of which carry a hand-written warning that a backtick there will stop the script parsing. The user's report is correct and I have confirmed the mechanism at `tools/lint.mjs:29`. A static gate that returns 0 on a file whose top-level script cannot parse is the round-6 "the machine could not say no" defect, returning through the one instrument nobody re-derived this round.

Below that, the new assertions are mostly real, but WORK-176's determinism baseline is vacuous by construction, and WORK-174's user-visible half — notes rendering on the card — has no assertion at all; only its CSS half is guarded.

## Overall Score

**84 / 100 — Solid. High findings exist but are contained.**

One High, no Critical. The High is a gap in a verification instrument rather than in shipped behaviour, and it is contained because `npm run boot` and `npm run v1` both catch the class the moment they run, and the project's own procedure requires all five commands after each commit. The four Medium findings are real quality problems with workarounds; the Lows are assertion hygiene and consistency. Nothing here blocks release.

---

## Findings

### Critical

**None.** I looked specifically for a stored figure that can drift, a write that can half-complete, an orphaned record and a debt figure reaching a period-filtered surface, and found none. This section is empty as a result, not for want of looking.

---

### High

**CODE-01 — `npm run verify` returns 0 on a file whose script cannot parse, because `lint.mjs` deletes the regions where the parse error lives**

- **Severity:** High
- **Location:** `tools/lint.mjs:29` (the blanking regex); the blind regions are `expense-pwa/index.html:4926-4928`, `:8265-8272`, `:8427-8440`, `:8468-8479`
- **Evidence:** `lint.mjs:29` runs `raw.replace(/<!--[\s\S]*?-->/g, block => '\n'.repeat(newlines))` over the **whole file**, before the `<script>` extraction at `:37-46`. Four HTML comments live *inside JavaScript template literals* — `:8265-8272` inside `renderGoals`'s per-card template, `:8427-8440` and `:8468-8479` inside `renderDebts`, `:4926-4928` inside `openThemePicker`. Those bytes are literal string content to the browser's parser, and `lint.mjs` erases them before ESLint sees them. A backtick placed in any of the four ends the template literal in the browser and does not exist in the linted file. ESLint therefore parses a **different program** than the one that ships, reports no fatal error, `errors` stays 0, and `lint.mjs:74` exits 0 — followed by three predicates (`check-escaping`, `check-contrast`, `check-saves`) none of which parses JavaScript. `index.html:8265` and `:8468` both carry a hand-written warning — *"NO BACKTICKS IN THIS COMMENT… a backtick here ends the string and the whole script stops parsing"* — which is precisely an invariant the tooling appears to enforce and does not.
  Re-runnable demonstration: insert a backtick into the comment at `index.html:8468-8479`, run `npm run verify` (exits 0), then `npm run boot` (fails). Revert with the Edit tool.
  Secondary evidence: `lint.mjs:8-11` states *"every line outside a `<script>` block is replaced with an empty line"*. That is not what the tool does — `:29` also blanks lines **inside** the script block. A header overstating a tool's coverage is the class this repository has now paid for in three rounds.
- **Impact:** The static gate can certify a completely dead application. A release that ran `verify` and skipped `boot` ships a blank screen. More corrosively, the gate's record says it covers a class it does not, so the next person trusts it.
- **Recommendation:** Two lines, and I would take both. (1) In `lint.mjs`, blank HTML comments **only outside script regions** — do the `<script>` boundary pass first, and apply the comment regex to the non-script lines only. (2) Correct the header at `:8-11` to state what the tool actually removes. The comment-relocation in CODE-02 removes the cause; this removes the blind spot regardless.
- **Effort:** S

---

### Medium

**CODE-02 — Developer commentary is written inside template literals and is emitted into the user's DOM on every card render**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:8265-8272` (per goal card), `:8468-8479` (per debt card), `:8427-8440` (per Debts render), `:4926-4928` (per theme swatch, 16 per open)
- **Evidence:** These are HTML comments sitting inside the template literals assigned to `el.innerHTML`. `:8468-8479` is ~780 bytes of prose re-emitted for **every debt card**; `:8265-8272` for every goal card; `:4926-4928` sixteen times per theme-picker open. They are also the direct cause of CODE-01: the file has to maintain a hand-written "no backticks in this comment" rule at `:8265` and `:8468` because there is no mechanism that can. `coding-standards.md` asks for clean structure and no unnecessary nesting; commentary that ships as markup is neither.
- **Impact:** Comment nodes proportional to record count in the live DOM, a lexical hazard that only prose can guard, and the blind region that makes CODE-01 possible. It also makes the rendered markup harder to diff in the harness snapshots that WORK-176 now compares.
- **Recommendation:** Move all four to JavaScript block comments immediately above the expression they explain (`renderDebts`'s card map, `renderGoals`'s card map, `openThemePicker`'s map). No text is lost, the backtick hazard disappears, and `lint.mjs` sees the whole script again.
- **Effort:** S

**CODE-03 — A stored non-integer amount is silently multiplied by a power of ten when any edit modal repopulates it**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:8586` and `:8588` (debt principal and total — the newest instances, added by WORK-173), and the same shape pre-existing at `:9030`, `:9048` (income/expense amount), `:8908` (goal target), `:8930` (goal recurring amount). Mechanism at `:4213-4228` (`formatMoneyInput`) and `:4199` (`unmoney`).
- **Evidence:** `debtProblem` at `:3904-3909` and `entryProblem` at `:3767` require `typeof === 'number'` and finite, **not integer** — the Chief Architect relies on exactly this admission in the WORK-171 tie-break. A backup carrying `principal: 1000.5` therefore imports cleanly. `openDebtEditModal` renders `value="${escapeHTML(d.principal)}"` → `"1000.5"`, then calls `formatMoneyInput(el)` at `:8597`, whose `digits = oldVal.replace(/\D/g, '')` at `:4217` strips the decimal point and produces `"10,005"`. The modal **displays** 10,005 for a stored 1000.5, and pressing Save writes `unmoney("10,005") = 10005` at `:9165`. The comment at `:4206-4212` states this ordering is "the real decimal guard" for *input*; nobody derived what it does to a *pre-filled* non-integer.
- **Impact:** A wrong financial figure, silently, at the moment a user corrects a typo. Not Critical because the precondition is a hand-edited or third-party backup — this application's own write path can never produce a non-integer, and the wrong number is visible in the field before the user commits it.
- **Recommendation:** Round at the population site, not at the validator: `value="${escapeHTML(Math.round(d.principal))}"` and the same for the other five. This is deliberately not a validator tightening — the Chief Architect's ruling 8 ("a shared validator is not tightened at the cost of a file that used to import") forbids that direction, and rounding at the render keeps the file importable.
- **Effort:** XS

**CODE-04 — The import handler re-renders four screens; the application has seven, and two of them show money**

- **Severity:** Medium
- **Location:** `expense-pwa/index.html:6293` (`renderSettings(); renderIncome(); renderExpenses(); renderDashboard();`)
- **Evidence:** After a successful import, `db` is replaced at `:6275` and four screens are re-rendered. `renderDebts()`, `renderGoals()`, `renderDaily()` and `calcSalary()` are not called. The Settings import button is safe because it lives on Settings — but `#dataErrorImport` at `:3262-3263` is a **banner** control, reachable from any screen, and `reportFatal()` at `:3169-3173` deliberately leaves it visible. So: user is on Debts, a runtime error raises the banner, the user follows the banner's own advice and restores a backup — and the Debts screen keeps rendering the pre-import debt cards. The stale cards carry `data-debt-pay="<old id>"`; `openDebtPaymentModal` resolves it at `:8529`, finds nothing, and returns silently at `:8530`, so "+ Payment" is a dead control with no message.
- **Impact:** Financial records the user has just replaced remain on screen as though current, and the primary action on them does nothing. Recovery is one tab tap, which is why this is Medium and not High.
- **Recommendation:** Replace the four hard-coded calls with a re-render of whatever is active — `navigate(document.querySelector('.screen.active')?.id || 'dashboard')` — after `renderSettings()`. `navigate()` at `:5054-5060` already knows every screen's render function, so the list cannot drift again as screens are added. That is one line and it closes the class rather than the case.
- **Effort:** XS

**CODE-05 — WORK-176's determinism baseline cannot fail, and its comment claims a property it does not have**

- **Severity:** Medium
- **Location:** `tools/harness/debts.js:504-511` (the comment), `:532-545` (the baseline)
- **Evidence:** `snapshot()` reads `innerHTML` from four elements; `a` and `b` are taken back to back at `:538-539` with **nothing between them**. JavaScript is single-threaded and `innerHTML` serialisation of an unmutated DOM is deterministic, so `a[id] === b[id]` for all four ids on every run: `stable` is always the full set and `t.J_dropped` is always `'none'`. The comment at `:504-511` says the baseline exists because *"if any of these four screens rendered non-deterministically — a timestamp, a tween mid-flight, a random ordering — the snapshot comparison would go red against a correct application"*. No render occurs between the two snapshots, so exactly none of those three conditions can be detected. This is an assertion that looks like a guard, inside the fix for an assertion that looked like a guard.
  The containment assertion itself at `:550-555` **is** real and I am not challenging it — `renderDebts()` genuinely runs between `a` and `after`, and nothing else re-renders those four screens, so a stray write is caught.
- **Impact:** The Chief Architect made this baseline a non-optional condition of WORK-176 ("Conditions, and the second is not optional"). As written it discharges the condition in form only. Anyone reading `t.J_dropped: "none"` concludes the four screens were proven deterministic; they were not tested.
- **Recommendation:** Re-render between the two snapshots. Wrap the four `navigate()/render()` calls at `:525-530` in a function, call it, snapshot `a`, call it again, snapshot `b`. Everything downstream is unchanged.
- **Effort:** XS

---

### Low

**CODE-06 — WORK-174's user-visible behaviour is unguarded; only its CSS half is**

- **Severity:** Low
- **Location:** `tools/harness/debts.js:461-487`; the unguarded render is `expense-pwa/index.html:8485`
- **Evidence:** The overflow flow seeds `notes` with an unbroken token and asserts only `t.E_page_overflow !== 0`. Nothing asserts that the note chip rendered. Deleting `${d.notes ? '<span class="goal-meta-item note">…' : ''}` from `index.html:8485` leaves this flow green — the page simply stops overflowing. Separately, `t.E_card_width` is measured at `:482` and never compared to anything. `run.mjs:45-46` states the house rule this violates: *"A probe that reports zero matches is not a pass. Assert the fixture produced the thing you are measuring before measuring it."*
- **Impact:** The Debts module's newest visible feature has no assertion. Nothing fails for the user today; a future edit removing it would be silent.
- **Recommendation:** Before the overflow assertion, add `if (!document.querySelector('.debt-card .goal-meta-item.note')) throw new Error('setup failed: the note chip did not render, so the overflow measurement is of a card without one');`. Either assert `E_card_width` against the viewport or drop the measurement.
- **Effort:** XS

**CODE-07 — `debts.js` justifies its fixture with a CSS class that WORK-184(b) deleted**

- **Severity:** Low
- **Location:** `tools/harness/debts.js:467-472`
- **Evidence:** The comment reads *"the note is rendered as a chip, and `.debt-meta-item` declares no overflow-wrap of its own, so it needs the same unbroken run as the name"*. `.debt-meta-item` no longer exists — WORK-184(b) deleted it in favour of `.goal-meta-item` (`index.html:1477-1493`), and `.goal-meta-item.note` at `:1502` **does** declare `overflow-wrap: anywhere`. Both halves of the sentence are now false about the current stylesheet. `HANDOFF.md:318` states the standing convention: *"Comments state derivations, never bare results."*
- **Impact:** The next reader trying to re-run the WORK-174 demonstration looks for a rule that is not there. No behaviour is affected.
- **Recommendation:** Rewrite to name `.goal-meta-item.note` at `index.html:1502` as the declaration under test.
- **Effort:** XS

**CODE-08 — The WORK-173 orphaning demonstration, as recorded, reddens a different assertion than the one it is named for**

- **Severity:** Low
- **Location:** `tools/harness/debts.js:270-272` (the recorded perturbation), `:309` and `:312` (the two assertions)
- **Evidence:** The comment names the perturbation as *"having the edit branch **push** a new record with a fresh id instead of mutating in place."* Taken literally — `db.debts.push({...})` — the collection grows to two and the **first** failing assertion is `:309`, `'the edit created a second debt'`. The assertion the flow is named for, `:312` `t.K_id !== 'ED'`, is never reached. C40 step 3 requires the failure message to name *the assertion in question*, and `HANDOFF.md:271-273` states the reason: *"A throw exits a flow at its first failing assertion. One perturbation run only ever proves the first assertion in each flow."* Only a *replace* (filter out, then push) reaches `:312`. I cannot tell from the code which was performed.
- **Impact:** The recorded demonstration for the orphaning assertion may be evidence for a different assertion. No effect on the running application.
- **Recommendation:** Change the comment to name the perturbation precisely — *"replacing the record: `db.debts = db.debts.filter(x => x.id !== editCtx.debtId).concat({ ...d, id: uid() })`"* — so a re-run reaches `:312` by name.
- **Effort:** XS

**CODE-09 — Flow K states its expectation by re-running the application's formula, two flows after the file argues against doing that**

- **Severity:** Low
- **Location:** `tools/harness/debts.js:325`
- **Evidence:** `if (t.K_interest !== Math.round(500000 * 500000 / 1500000))`. That is `debtInterestPaid`'s body (`index.html:8385`) rewritten with the fixture's numbers substituted. Flow H states the opposite principle at `:227-229`: *"The expectation is hand-checkable rather than a re-run of the formula."* This is not a C41 breach in substance — the expression is a compile-time constant and cannot track a change in the application — but it obscures the hand-checkable figure the comment at `:324` already supplies.
- **Impact:** Internal consistency only.
- **Recommendation:** `if (t.K_interest !== 166667)`, with the existing comment at `:324` as the derivation.
- **Effort:** XS

**CODE-10 — `renderDebts` scans `db.debtPayments` six times per debt**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:8400-8402` and `:8448-8454`; helper at `:8329-8333`
- **Evidence:** `debtPaid(id)` filters the whole `db.debtPayments` array. Per render it is called once by each of the three `reduce`s at `:8400-8402` (twice, via `debtOutstanding` and `debtInterestPaid`) and three more times per card at `:8448-8450`, plus a fourth filter for the payment count at `:8454`. That is ~6 full passes over the payment ledger per debt — O(debts × payments). `goalSaved` at `:8210-8214` has the identical shape.
- **Impact:** Negligible at realistic sizes (debts are few and long-lived). It becomes visible only in the pathological case the review brief asks about — hundreds of debts against thousands of payments — which no real user reaches. Reported because the review area asks specifically about quadratic work over a growing list.
- **Recommendation:** Build one `Map` of `debtId → { paid, count }` at the top of `renderDebts` and read it in both loops. Do not touch `goalSaved` in the same change.
- **Effort:** S

**CODE-11 — The service worker cache string was not bumped for round 12, against its own instruction**

- **Severity:** Low
- **Location:** `expense-pwa/sw.js:1-2`
- **Evidence:** `// Bump this string on every deploy to force a fresh install of the SW.` followed by `const CACHE = 'expense-tracker-v11';`. Round 11 bumped it to v11 (commit `8369bcb`), Round 12 changed `index.html` substantially and the string is unchanged, while a GitHub Pages deploy workflow now exists (commit `de1360d`).
- **Impact:** Small, and mitigated by design: `staleWhileRevalidate` at `:68-93` serves the cached copy and refreshes it in the background, so an installed user gets round 12 on their **second** load rather than the first. That is the documented trade of the caching strategy, not a failure — but the file's own rule is not being followed, and the rule exists so old caches get purged at `:32-39`.
- **Recommendation:** Bump to `expense-tracker-v12` in the round-13 closing commit.
- **Effort:** XS

**CODE-12 — Two read-only history modals set `editCtx` two different ways, and one of them has no branch in the save handler**

- **Severity:** Low
- **Location:** `expense-pwa/index.html:8957` (`editCtx = { kind: 'goal-history', goalId }`) against `:8606` (`editCtx = null`); fall-through at `:9234-9237`
- **Evidence:** `openDebtHistoryModal` — the round-12 sibling — nulls `editCtx`. `openGoalHistoryModal` sets `kind: 'goal-history'`, and the save handler at `:9106` has no branch for it: execution would fall through the four `kind` branches to `:9235`, `document.getElementById('mDate').value`, which is `null` in a history body and throws. It is unreachable today because `:8983` hides `#editModalSave` and `focusablesIn` will not surface a hidden control, and the next modal calls `resetEditModalButtons()` at `:8890` / `:9019` / `:8574` / `:8603`.
- **Impact:** None today. It is one hidden button away from a throw that would reach `reportFatal()` and tell a user their saved data could not be read.
- **Recommendation:** Make `openGoalHistoryModal` set `editCtx = null`, matching the debt modal that was written after it.
- **Effort:** XS

---

## Review Areas — the clean ones

**Correctness of money.** Clean, apart from CODE-03. Money is integer tugrik end to end: every entry point runs through `unmoney` (`:4199`), which strips every non-digit, and `formatMoneyInput` (`:4213`) removes the decimal point before the parser can see it. Rounding is defined in one place per figure — `fmt` at `:4101`, one `Math.round` on the running total in `debtInterestPaid` at `:8385`. I walked `Math.min(debtPaid(d.id), total)` at every boundary: `paid = 0` → 0; `paid = total` → exactly `cost`; `paid > total` → `cost`, never more; `cost <= 0` → 0 (`:8384`), which covers a hand-edited `principal > totalToRepay`; `total <= 0` → 0 (`:8382`), which also removes the division by zero. NaN cannot enter — `+d.totalToRepay || 0` folds NaN to 0 and is then caught by the `<= 0` guard, and `+p.amount || 0` does the same per payment. The cap incidentally also contains an `Infinity` payment sum, which the uncapped form would have propagated. The Chief Architect's claim that the inner-cap form "always returns an integer" is true: `Math.round` of a finite number is an integer, and every input is proved finite before it reaches the multiplication. Dates are ISO strings throughout, compared with `localeCompare` and validated by `ISO_DATE_RE`.

**Data and persistence.** Clean. One store key, one write seam (`writeDb` at `:3654`), quarantine before any write (`:3201-3227`), `load()` total for any bytes (`:3300-3454`), numbered append-only migrations with the version stamped at what was actually reached (`:3033-3047`). `db.debts`/`db.debtPayments` enter through `|| []` at `:3362-3363` and are absent from the migration list deliberately, with the reasoning recorded. A failed write cannot half-update: the blob is serialised and set atomically, and `writeDb` refuses outright when quarantine failed (`:3664`). Offline is genuine — `ensurePersistentStorage` and `loadDisplayCurrency` read local state only, and nothing on the boot path fetches.

**Architecture.** Clean for round 12. `db.debts` and `db.debtPayments` are read in exactly eleven places, all inside the Debts module or the Data Summary (verified by exhaustive grep); nothing in `renderDashboard`, `analyzeExpenses` or any period-filtered surface touches them. The debt edit path is a second writer and it writes five scalar fields on a record found by id — it cannot orphan a payment, because payments resolve on `debtId` and the id is never reassigned. `renderDataSummary` at `:6048` gives `debts` no `clear`, which is what stops the one route that could have orphaned the ledger.

**Maintainability.** Two findings above (CODE-02, CODE-07). Otherwise: functions are single-purpose, the shared ledger validator `contributionProblem(r, fk)` at `:3871` is genuinely reused for goal contributions and debt payments rather than copied, and `.goal-meta-item` is now one component instead of two. I found no dead code introduced in round 12.

**Error handling.** Clean. Every debt write captures `save()`'s return and reports through `savedToast` (`:8522`, `:8635`, `:9182`, `:9200`, `:8679`); `check-saves.mjs` confirms no bare site was added. The payment-delete re-render is correctly gated on success at `:8642`, and the failure path closes the modal so the banner speaks. The debt edit refusals at `:9167-9176` return without mutating and leave the modal open, which `debts.js:337-364` asserts including the toast text.

**Security.** Clean. Every user-supplied value in the new Debts markup goes through `escapeHTML` — `d.name` `:8461`/`:8584`, `d.notes` `:8485`/`:8592`, `d.date` `:8483`/`:8590`, `d.id` in four attributes `:8491-8494`, `p.notes`/`p.date`/`p.id` `:8616`/`:8620`. Modal titles that interpolate a lender name use `textContent` (`:8532`, `:8607`), and `confirmDialog` writes its message with `textContent` at `:4831`, so the delete prompt at `:8513` is safe. `check-escaping.mjs` returns zero. No third-party dependency runs — Firebase stays unloaded while `firebaseConfig` is empty. Nothing sensitive is logged.

**Performance.** CODE-10 is the only quadratic path introduced by the module, and it is not reachable at realistic sizes. Initial load does no network work.

**Reliability and scalability.** At 10,000 transactions the Debts screen is unaffected — its figures are stocks over two small collections. The first thing to break as the app grows remains the Dashboard/Analytics render, unchanged from previous rounds and still behind a measured trigger.

---

## Technical Debt

- **The four in-template HTML comments (CODE-02) are the real debt behind CODE-01.** Every future comment written into a card template re-arms both. This is the cheapest structural cleanup in the file.
- **The 44px target and the shared chip are now correctly single-sourced, but named for goals.** `goal-add`, `goal-icon-btn`, `goal-bar` and `goal-meta-item` all paint the Debts screen. The Chief Architect has this recorded off-limits with a trigger (a third module borrowing any of them). I re-derived the blast radius of the WORK-170 un-scoping and confirm it is closed: the only elements carrying those classes are `:8281-8284` and `:8491-8494`, both already inside their `.goal-actions`/`.debt-actions` layout containers, and the specificity drop from (0,2,1) to (0,1,1) is not beaten by any later rule that can match them (`.alert-banner button` at `:2057` and `.list-item .actions button` at `:1166` are the only candidates and neither is an ancestor of these buttons). No action needed; recorded so the next reviewer does not re-derive it.
- **Isolation coverage narrowed when WORK-173 landed**, exactly as the Chief Architect recorded at `chief-architect.md:825`. `debts.js:372-439` exercises the **add** path against the Dashboard totals; the edit path has no equivalent. I am not raising it as a finding because the architect recorded it as an accepted risk with a named trigger and the edit branch demonstrably touches five scalar fields. Referenced here so the trigger stays visible.
- **The `escapeHTML(number)` → `formatMoneyInput` shape (CODE-03) exists at six sites.** Fixing the two debt ones alone would close the case and leave the class, which is the failure mode this project has ruled against twice.

## Future Risks

- **The next syntax error will be found by `boot`, not by `verify`, and only if `boot` is run.** Until CODE-01 is fixed, `npm run verify` is not a sufficient gate on its own, and `HANDOFF.md:179-187`'s runbook lists four commands where the architect's order requires five (`npm run debts` is missing from that block). Anyone following the handoff rather than the standing decision runs the wrong set.
- **A third writer into `db.debts`** would put the isolation condition at one covered path in three. The trigger is already named.
- **`analyzeExpenses` remains the most likely place a debt figure gets smuggled onto a period-filtered card.** Nothing this round moved toward it; it stays the thing to refuse.
- **Cleared debts accumulate.** `renderDebts` at `:8447` maps `db.debts` unsorted and unarchived, so settled loans stack above live ones forever. Same exposure as `db.goals`. Recorded, not scheduled.

## Recommended Refactoring

The smallest set that removes the most risk, in order:

1. **Move the four in-template comments out of their template literals (CODE-02), then fix `lint.mjs`'s comment blanking to respect script boundaries (CODE-01).** Doing both means the blind region stops existing *and* stops being possible. This is the one change that restores an instrument to what its record says it does.
2. **Round at the six money-input population sites (CODE-03)** — one expression each, no validator touched, ruling 8 respected.
3. **Replace the four hard-coded renders after import with `navigate(activeScreenId)` (CODE-04)** — one line, and it closes the drift permanently rather than adding the two screens that are missing today.
4. **Re-render between the two determinism snapshots (CODE-05)** and **assert the note chip rendered (CODE-06)**. Together these make WORK-176 and WORK-174 guard what their headers claim, which is the standing condition both landed under.

Everything else is XS hygiene and can ride with whichever commit is nearest.
