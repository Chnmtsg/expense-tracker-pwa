# Code Review — Round 12

*(The agent is read-only by role definition and could not write this file; the text below is its complete report, transcribed unmodified.)*

Scope: `expense-pwa/index.html` (~9,180 lines), `tools/` (4 static predicates + 1 harness runner + 5 probes), `package.json`. Particular attention to the Debts module (WORK-164..167). References: `knowledge/coding-standards.md`, `knowledge/project.md`, `knowledge/ui-guidelines.md`, `reports/chief-architect.md` §Round 11, `reports/design-request-debt-tracker.md`.

## Executive Summary

The Debts module is architecturally sound and its data layer is the best part of it: the six store sites are genuinely all six, `debtProblem`/`contributionProblem(r, fk)` reject at the border rather than clamping, the cascade delete is complete, and the central safety claim — a debt reaches no Dashboard total — holds by construction and is guarded by an assertion that can really fail. The no-migration ruling was re-derived and it holds. The problems are at the edges: the debt card's three action buttons carry classes whose CSS rules are scoped to `.goal-actions` and therefore match nothing, so every control on the new screen renders as an unstyled native button below the 44px minimum; `debtInterestPaid` is the one derived figure of three that is not clamped, so an overpaid debt overstates the exact number the module exists to show; and the `v1` assertion commissioned to guard the import `replacement` object tests a copy of that object living inside the probe, so the perturbation its own comment names cannot redden it. **The single biggest risk is CODE-03**: the round's work gate was declared closed on four assertions, and one of them guards a duplicate of the code it names.

## Overall Score

**78 / 100** — Solid. High findings exist but are contained.

Three High findings, none of which touches stored data or a Dashboard total. CODE-01 is CSS-only and confined to one screen. CODE-02 needs a user to record more than they owe and is self-correctable. CODE-03 is a guard that cannot fail rather than a defect in the guarded code, which is correct today. The store seam, the validators, the write seam and the cascade are clean, which is why this does not fall into the 60-74 band.

---

## Findings

### Critical

None. I looked specifically for: a debt or payment reaching `:6462-6465`; an app-created record in `db.actual`; a throw on the boot path from new code; a lost collection on import or Reset; unescaped record data in an attribute. None is present.

---

### High

**CODE-01 — Every button on a debt card is unstyled and below the 44px touch minimum**

- **Severity** — High
- **Location** — `expense-pwa/index.html:1501-1512` (the rules), `:1514-1523` (the comment that claims otherwise), `:1553` (`.debt-actions`), `:8350-8353` (the markup)
- **Evidence** — The only rules for these two classes are descendant-scoped:
  ```css
  .goal-actions button.goal-add    { … min-height: 44px; … }
  .goal-actions button.goal-icon-btn { width: 44px; height: 44px; … }
  ```
  `renderDebts` emits them inside `<div class="debt-actions">`, not `.goal-actions`:
  ```html
  <button class="goal-add" data-debt-pay="…">+ Payment</button>
  <button class="goal-icon-btn" … data-debt-hist="…">📜</button>
  <button class="goal-icon-btn" … data-debt-del="…">✕</button>
  ```
  I enumerated every `.X button` selector in the stylesheet (`.notif-item .notif-actions`, `.list-item .actions`, `.empty-state`, `.segmented`, `.icon-grid`, `.cal-nav`, `.alert-banner`) and every `button.class` rule (`.primary`, `.secondary`, `.danger`, `:disabled`, `:focus-visible`). There is no bare `button { }` base rule. Nothing matches these three elements. `.goal-bar` at `:8347` *does* work, because `:1487` is class-only — so the comment at `:1514-1517` is half right, and it states its result rather than deriving it: *"Deliberately reuses .goal-bar, .goal-add and .goal-icon-btn … a second copy would be a second place for the 44px target to drift."* Two of the three named reuses do not happen. `tools/check-contrast.mjs:103` also measures `on-accent` on `primary-hover` and annotates it *"primary button / goal-add"* — a pair that is not painted on this screen.
- **Impact** — The primary action of a new module ("+ Payment"), its history control and its **destructive delete** render as native browser buttons at roughly 20-24px tall, in the platform UI font, on a mobile-first application whose own guideline (`knowledge/ui-guidelines.md:65`) states a 44x44 minimum. A delete sitting at half the minimum target beside a payment button is a mis-tap that destroys a debt and cascades its whole ledger.
- **Recommendation** — Drop the `.goal-actions` ancestor from the two rules (`button.goal-add`, `button.goal-icon-btn`), which is what the comment already claims is true, and correct the comment. Do not clone the rules — that is the drift the comment was written to prevent.
- **Effort** — XS

**CODE-02 — `debtInterestPaid` is the one derived figure that is not clamped, so an overpaid debt overstates the cost of borrowing**

- **Severity** — High
- **Location** — `expense-pwa/index.html:8270-8276`; compare `:8249` and `:8325`
- **Evidence** — The three derived figures handle `paid > totalToRepay` inconsistently:
  ```js
  debtOutstanding: Math.max(0, (+d.totalToRepay||0) - debtPaid(d.id))   // :8249  clamped
  pct:             Math.min(100, paid / total * 100)                     // :8325  clamped
  debtInterestPaid: Math.round(debtPaid(d.id) * cost / total)            // :8275  NOT clamped
  ```
  Nothing on either write path bounds a payment: `openDebtPaymentModal` (`:8384-8406`) offers no maximum, the save branch (`:8951-8960`) checks only `amount <= 0`, and `contributionProblem` (`:3811-3818`) checks only `amount < 0`. Worked example with the module's own numbers — principal 1,000,000, totalToRepay 1,300,000, cost 300,000. A user records 1,400,000 (a mistyped payment, a duplicate entry, or a real late fee): `debtOutstanding` reads 0 and the card says "✓ Cleared" — both correct — while `debtInterestPaid` returns `round(1,400,000 × 300,000 / 1,300,000)` = **323,077**, above the debt's entire cost of borrowing. It then propagates into `totalInterest` at `:8292` and the "Paid in interest" headline at `:8314`.
- **Impact** — The application states a cost of borrowing that is arithmetically impossible under its own model, on the one number the whole feature exists to produce, with nothing on screen to flag it. Boundaries verified as correct: no payments → 0; `totalToRepay === principal` → 0 via `cost <= 0`; `total <= 0` → 0; a corrupt `principal > totalToRepay` → 0. Overpayment is the only broken boundary, which is why this is High and not Critical — the outstanding balance and the percentage stay right, and the user can delete the offending payment from the history modal.
- **Recommendation** — `return Math.min(cost, Math.round(debtPaid(d.id) * cost / total));`, with a comment deriving it from the same fact `:8248` already states — paying more than you owe does not buy more interest. One rounding is preserved.
- **Effort** — XS

**CODE-03 — WORK-164 assertion 2 asserts against a copy of the import `replacement` object, so its named perturbation cannot turn it red**

- **Severity** — High
- **Location** — `tools/harness/v1-write-flows.js:592-635`; the code it claims to guard is `expense-pwa/index.html:6177-6185`
- **Evidence** — The comment at `:573-574` states the C37 demonstration: *"Red by deleting `debts: []` from the import replacement object."* The flow then builds its own:
  ```js
  function replacementFor(file) {
    return { schemaVersion: file.schemaVersion, income: [], planned: [], actual: [],
             categories: [], incomeTypes: [], salaries: [], goals: [], goalContributions: [],
             debts: [], debtPayments: [], settings: {}, ...file };
  }
  ```
  and asserts on `replacementFor(exported)` and `replacementFor(legacyFile)`. Deleting `debts: []` from `index.html:6182` leaves this flow green: the defaults being exercised are the probe's. I grepped the whole harness for `importFile`, `replacement` and `FileReader` — nothing anywhere drives `index.html`'s real import path. The comment at `:592-593` — *"The replacement object the import path actually builds"* — states a result that is false, against the standing rule that comments state derivations. The other half of the flow is real (`save()`, `JSON.parse(JSON.stringify(db))` and `importProblem()` are the app's own), so the failure is confined to the legacy-defaults claim, which is exactly the half the defaults exist for.
- **Impact** — Site 3 of the six the architect enumerated — *"Import `replacement`: a backup imports without its debts, silently"* — is unguarded, while the round's work gate was closed on the strength of it. This is the shape `run.mjs:159-174` records as having falsely landed five items, and the shape round 7's High took (an assertion on visibility rather than function). The guarded code is correct today; the guard is not.
- **Recommendation** — Extract the literal at `index.html:6177-6185` into a named top-level function (`function importReplacement(parsed) { … }`) called by the handler, and have the flow call *that*. One source of truth, the probe stops carrying a copy, and the named perturbation reddens it. Driving the real `#importFile` with a `DataTransfer` would also work but is far more machinery for the same property.
- **Effort** — S

---

### Medium

**CODE-04 — The 320px condition is never run by the command that is supposed to carry it**

- **Severity** — Medium
- **Location** — `package.json:16`; `tools/harness/debts.js:200-221`; `tools/harness/run.mjs:108-129`
- **Evidence** — `"debts": "node tools/harness/run.mjs tools/harness/debts.js"` — no `--width`. `run.mjs` only builds the sizing iframe when `width` is truthy (`:108`), only injects the scrollbar-gutter suppression when `width` is truthy (`:83-85`), and only checks `viewport_clientWidth` when `width` is truthy (`:214-223`). Without the flag the probe runs at headless Chrome's default (~785px after the reserved gutter). The flow's assertion is `if (t.E_page_overflow !== 0) throw` — at 785px a debt card cannot overflow, whatever its CSS, so the flow passes without testing anything. The architect's WORK-165 condition 5 is explicit: *"No horizontal scroll at 320px … via a width-mode probe with `#debts` active reporting `viewport_clientWidth`."* `reports/HANDOFF.md:32-33` states the command *"carries the seven conditions the screen was approved under"*; six of the seven are carried.
- **Impact** — The overflow shape the architect recorded as recurring (`:582`, "the shape recurs anywhere a `width:auto` control takes user-supplied text") is protected by a green line that would stay green if the protection were removed. The probe does report `viewport_clientWidth` unconditionally (`debts.js:71`), so the vacuity is visible in the output to anyone who reads it — which is why this is Medium, not High.
- **Recommendation** — Add `--width 320` to the `debts` script. Same runner, same probe, one flag; not a fifth runner. Verify `t.viewport_clientWidth` comes back 320.
- **Effort** — XS

**CODE-05 — The containment flow cannot fail on the symptom it names**

- **Severity** — Medium
- **Location** — `tools/harness/debts.js:223-236`
- **Evidence** — The flow is titled *"renderDebts writes nothing outside `#debts`"* and its comment says this is *"the same property asserted rather than reviewed."* What it actually does is check that three static elements are DOM descendants of `#debts`:
  ```js
  ['debtList','debtTotals','debtTotalsCard'].forEach(id => { … if (!section.contains(el)) throw … });
  ```
  That is a property of the markup at `:2529-2534`, not of `renderDebts`. The perturbation that expresses the named symptom — adding a write to an element on another screen inside `renderDebts`, which is precisely what `renderDashboard`'s guard at `:6440-6446` exists to prevent — leaves this flow green. It reddens only if somebody physically moves one of the three elements out of the section, which nobody would do.
- **Impact** — A visibility-class assertion presented as a function assertion, against the project's own standing convention. Its cost is not that it is useless but that it retires the review condition it was substituted for: the architect listed containment as a **review** condition *"checked by eye"*, and an assertion that looks like a guard stops the eye.
- **Recommendation** — Either make it fail on the symptom — snapshot `innerHTML` of `#dashboard`, `#income`, `#expenses` and `#goals`, call `renderDebts()`, assert all four are byte-identical — or delete the flow and restore the review condition honestly. The snapshot version is a handful of lines and does redden on the named perturbation.
- **Effort** — S

**CODE-06 — A debt cannot be edited, and the only correction path destroys its payment ledger**

- **Severity** — Medium
- **Location** — `expense-pwa/index.html:8350-8353` (three actions: pay, history, delete); compare `:8195` (`data-goal-edit`) and `openGoalEditModal`
- **Evidence** — The sibling module this one is modelled on ships an edit control; Debts does not. `principal` and `totalToRepay` are the two fields the entire cost-of-borrowing arithmetic derives from (`:8273-8275`), they are entered once, and the add form refuses `totalToRepay < principal` at `:8466` — so a user who transposes a digit has no in-app remedy except delete, which cascades every recorded payment away at `:8378`, followed by re-keying the debt and every payment. The architect's own risk list at `chief-architect.md:581` assumed the capability exists: *"`totalToRepay` is a single number, so a renegotiated or variable NBFI loan cannot be represented **without editing it**… If it bites, the answer is an edit trail."* There is nothing to edit with.
- **Impact** — A typo in either of the two defining numbers of a debt is unfixable without deliberate data loss, in the module whose stated purpose is a number that changes behaviour. Medium rather than High because the workaround exists and the data lost is re-enterable.
- **Recommendation** — Not necessarily an edit modal now — this was not in the approved scope, and adding one is a decision, not a fix. The minimum honest step is to record it: either an `openDebtEditModal` on the `openGoalEditModal` pattern (S), or a line in the standing decision converting `:581`'s recorded risk from "editing restates history" to "editing does not exist". Do not let the risk register describe a capability the code lacks.
- **Effort** — S

**CODE-07 — `debtNotes` is write-only: collected, stored, never rendered anywhere**

- **Severity** — Medium
- **Location** — `expense-pwa/index.html:2524-2525` (the field), `:8473` (the write), and no read site
- **Evidence** — The form offers `<textarea id="debtNotes" placeholder="e.g. 3 month term...">`, the handler stores `notes: document.getElementById('debtNotes').value.trim()`, and I grepped every debt render path — `renderDebts` (`:8320-8359`), `openDebtPaymentModal` (`:8390-8399`), `openDebtHistoryModal` (`:8431-8436`) — none reads `d.notes`. Payment notes *are* rendered (`p.notes` at `:8422`), which makes the asymmetry accidental rather than a policy. Goal notes are at least readable through the goal edit modal (`:8914`); with no debt edit modal (CODE-06) there is no route at all.
- **Impact** — The application asks for information, keeps it in the user's storage and in every export, and can never show it back. The placeholder actively suggests recording the loan term — the single most useful thing to note about an NBFI loan — into a field that is unreachable.
- **Recommendation** — Render it on the card, guarded on presence, alongside the existing `.debt-meta` items: `${d.notes ? `<span class="debt-meta-item">${escapeHTML(d.notes)}</span>` : ''}`. Escaped, matching `:8422`.
- **Effort** — XS

---

### Low

**CODE-08 — `contributionProblem` accepts `amount === 0`, which both write paths refuse**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:3816`; the boundary rule the file states for itself at `:3896-3899`; write paths at `:8954` and `:8967`
- **Evidence** — `if (typeof r.amount !== 'number' || !Number.isFinite(r.amount) || r.amount < 0) return 'has an invalid amount';` — `< 0`, so a zero-amount payment imports. Both editors use `if (amount <= 0) { toast(...); return; }`. The quick-amounts check twelve lines above states the intended rule explicitly: *"`<= 0`, so the two boundaries agree: the editor drops non-positive values and the import path refuses them, rather than one storing what the other would have discarded."* Inherited from the goal-contribution validator, not introduced by round 11 — but round 11 extended it to a second financial collection.
- **Impact** — A ₮0 payment row in the ledger and in the Data Summary count that no editor could have produced. No wrong figure — it sums to nothing.
- **Recommendation** — `r.amount <= 0`, with the derivation borrowed from `:3896-3899`. Check `goalContributions` fixtures still import.
- **Effort** — XS

**CODE-09 — The debt history modal diverges from the goal history modal it was copied from**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:8437-8447`; compare `:8775-8797`
- **Evidence** — Two differences, both regressions against the sibling. (a) `openGoalHistoryModal` sets `editModalCancel.textContent = 'Close'` with the reason attached — *"only Cancel/Close makes sense"*; `openDebtHistoryModal` hides Save (`:8446`) but leaves `resetEditModalButtons()`'s "Cancel" label, so a read-only list is dismissed by a button labelled Cancel. `openSalaryHistory:5932` follows the goal precedent too, so Debts is the odd one of three. (b) After deleting a contribution the goal modal re-renders itself (`:8792`); the debt modal calls `closeEditModal()` (`:8442`), so correcting three mistaken payments takes three round trips through the card.
- **Impact** — Cosmetic on (a); on (b) it lengthens the exact task CODE-02 makes necessary.
- **Recommendation** — Relabel Cancel to Close; replace `closeEditModal()` with `openDebtHistoryModal(debtId)` to refresh in place, matching `:8792`.
- **Effort** — XS

**CODE-10 — Import accepts a `debtPayment` pointing at no debt, the state the cascade delete exists to prevent**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:3905-3936` (no referential check); the property asserted at `:8374-8377`
- **Evidence** — `contributionProblem(r, 'debtId')` requires the key to be a non-empty string, never that it resolves against `data.debts`. The delete handler's comment states why that matters: *"orphans would be invisible here and would still be counted by the Data Summary."* Import can create precisely that state; the app defends the invariant on one path and not the other. Supporting detail: `v1-write-flows.js:690` names its case `S_orphan_pay`, but what it constructs is a payment with **no `debtId` key at all** (`:696`, *"a payment with no debtId was accepted"*) — the variable name promises an orphan check that the case does not make. Same exposure exists today for `goalContributions`, so this is inherited rather than introduced.
- **Impact** — A hand-edited or hand-merged backup can carry money records the Data Summary counts and no screen can show or delete. Not reachable from the app's own export.
- **Recommendation** — In `importProblem`'s `perRecord` loop, after the per-collection id `Set` is built, check each child's foreign key against its parent's id set for both `goalContributions`/`goals` and `debtPayments`/`debts`. Rename `S_orphan_pay` to say what it tests. If the parent-set check is judged out of scope, rename the probe variable anyway — it is currently the only thing claiming the property.
- **Effort** — S

**CODE-11 — `withFramesRun` is duplicated verbatim across two probes, with its reasoning abbreviated in the copy**

- **Severity** — Low
- **Location** — `tools/harness/v1-write-flows.js:500-522` and `tools/harness/debts.js:37-49`
- **Evidence** — Identical bodies, including the `ticks++ > 500` guard and the `performance.now() + 1e6` timestamp. The first carries the full derivation (why the tween clamps, that the first version compared "₮0" to "₮0"); the second compresses it to two lines. The vacuity guard that makes the stub trustworthy is also duplicated and is *narrower* in the copy — `v1-write-flows.js:567` tests income, expense and net; `debts.js:176` tests income and net only, so a starved-clock `#kpiExpenses` reading "₮0" would go unnoticed there.
- **Impact** — Two copies of the one helper whose failure mode is silent false-passing. The next fix will land in one of them.
- **Recommendation** — Either move `withFramesRun` and the non-zero-tiles guard into `tools/harness/fixture.js` and run both probes with `--fixture` (fixture.js is an input, not a runner, so the ceiling is untouched), or at minimum widen `debts.js:176` to include `before.expense` and point its comment at the full derivation instead of restating it.
- **Effort** — XS

**CODE-12 — `debtDate` is the only add-form date input never initialised and never reset**

- **Severity** — Low
- **Location** — `expense-pwa/index.html:2522-2523`; init at `:9147-9149`; reset at `:8476-8479`
- **Evidence** — Boot sets `sDate`, `incDate` and `expDate` to `todayISO()`; `debtDate` is not in that list, so the field renders blank. The handler defaults correctly (`:8470`, `|| todayISO()`), so nothing is wrong with the data. But after a debt is added with an explicit backdated date, the four other fields are cleared at `:8476-8479` and the date is not, so the next debt silently inherits the previous one's date.
- **Impact** — No wrong figure. An empty date control where the app's other three show today, and a sticky value on a second entry.
- **Recommendation** — Add `document.getElementById('debtDate').value = todayISO();` to the init list, and reset it alongside the other four fields after a successful add.
- **Effort** — XS

---

## Review Areas

**Correctness of Money** — One finding (CODE-02). Otherwise clean and verified rather than assumed: integer tugrik end to end; `unmoney` (`:4102`) strips every non-digit so no decimal and no minus can enter; `debtInterestPaid` performs exactly one `Math.round` on the running total; division by zero is guarded at `:8272`; a corrupt `principal > totalToRepay` returns 0 rather than a negative cost; no NaN, Infinity or sign inversion reachable from either write path. Dates are ISO strings compared lexically throughout, consistent with the rest of the file; the module holds no time-zone logic because none of its figures has a period.

**Data and Persistence** — Clean, and this is the strongest part of the round. One store seam (`writeDb`/`save`/`load`), quarantine before write, all debt writes consume `save()`'s return and report through `savedToast`. All six schema sites are present and I checked each individually: `load()` field-by-field `:3302-3303`, fresh defaults `:3365`, import `replacement` `:6182`, `optionalArrays` `:3876`, `perRecord` `:3914-3915`, `renderDataSummary` `:5951-5952`. I then swept for a seventh — `exportBackup` serialises `db` whole (`:3683`), and no other site enumerates collections. **The no-migration ruling holds and I re-derived it rather than accepting it:** `migrations` transforms data and there is nothing to transform; `parsed.debts || []` covers every file this app has ever written; and a `SCHEMA_VERSION` bump would have bought nothing, because `migrate:2975` leaves a future-versioned file alone and an older build drops an unknown collection at `load()` either way. Backward compatibility is guarded by a real assertion (`v1-write-flows.js:641-668`). No partial write is possible — `writeDb` serialises the whole blob in one `setItem`. Offline: nothing in the new code fetches; Firebase is unconfigured (`:3402-3409`) so `initFirebase` returns immediately and the unvalidated cloud path (deferred WORK-15) is dormant.

**Architecture** — Clean. C38 and C39 are held in the code, not just in the comments. `db.debts` is its own top-level array; `renderDashboard` contains no reference to it; the three derived functions take no date argument and never call `getRange`; the Debts screen ships no filter row. `renderDebts` writes only to `debtList`, `debtTotals` and `debtTotalsCard.style.display`, all three inside `#debts` at `:2529-2534` — the containment condition is genuinely met (CODE-05 is about the assertion, not the code). `contributionProblem(r, fk)` is parameterised rather than copied, matching `entryProblem(r, fk)`. The UI layer reaches `db` directly, but that is this application's established single-file shape, not a regression.

**Maintainability** — Functions are small and single-purpose; the three derived functions are three lines each. Names are meaningful. The debt-payment save branch (`:8951-8960`) duplicates the contribution branch (`:8964-8971`) in outline, but the two diverge on schedule advancement, so collapsing them would cost more than it saves. Real duplication: CODE-11 in the tooling. No dead code found in the new module. Two comments state results that are not true — `:1514-1517` (CODE-01) and `v1-write-flows.js:592-593` (CODE-03).

**Error Handling** — Clean. Every debt write path checks its input and toasts a named reason (`:8457`, `:8459`, `:8461`, `:8467`, `:8954`); every save reports through `savedToast(ok, …)`; both deletes go through `confirmDialog` and the debt delete names the payment count first (`:8369-8371`). `openDebtPaymentModal` and `openDebtHistoryModal` return early on a missing parent. No swallowed errors introduced. Nothing in the new code runs at boot — `renderDebts` is reached only through `navigate` (`:4962`), and both new `addEventListener` calls target elements that exist in the static markup (`:2306`, `:2526`).

**Security** — Clean. `check-escaping.mjs` passes and I re-derived it by hand across the new templates: every attribute interpolation is `escapeHTML(...)` or numeric; every text interpolation of record data is `escapeHTML(...)` or `fmt(...)`; the two modal titles use `textContent`; `confirmDialog` (`:4733-4734`) uses `textContent`, so the raw `d.name` at `:8370` is safe. Nothing sensitive is logged. No dependency was added — `eslint` remains the only devDependency and the app still ships zero third-party code.

**Performance** — Clean at any realistic size, with one note. `renderDebts` scans `db.debtPayments` about six times per debt (`debtPaid` directly, again inside `debtOutstanding`, again inside `debtInterestPaid`, once for the payment count, plus twice more through the totals reduce at `:8291-8292`). That is O(debts × payments), the same shape `goalSaved` already ships. At 20 debts and 500 payments it is 60,000 comparisons on a screen the user opens deliberately — not worth restructuring, and doing so would trade three obvious three-line functions for one memoised one. Boot cost is unchanged: two `|| []` reads.

**Reliability and Scalability** — At 10,000 transactions nothing in Debts changes; it does not touch `db.income` or `db.actual`. The debt list is unpaginated and unsorted (insertion order), so a user with many settled debts accumulates cleared cards above their live ones — a presentation matter well before a performance one. What breaks first as this grows is not this module: it is the whole-blob `localStorage` write in `writeDb`, which now serialises two more collections on every save.

**Technical Debt** — Below.

---

## Technical Debt

- **The guarded-by-a-copy pattern (CODE-03).** The import handler builds its `replacement` inline inside an async `FileReader` closure, which is unreachable from a probe. That unreachability is the debt; the duplicated literal is only its symptom. Every future addition to the store will face the same choice and will most likely make the same copy. Extracting one named function retires it permanently.
- **Reuse by class name across module boundaries (CODE-01).** `renderDebts` borrows `goal-add`, `goal-icon-btn` and `goal-bar` — three names that say "goal" on a screen about debt, two of which silently do nothing. The intent (one definition of the 44px target) is right; the mechanism is a name that lies. When a third module borrows them, the same trap is set again.
- **Two write paths, two boundary rules (CODE-08, CODE-10).** The editors and the import validators disagree at `amount === 0`, and only one of the two enforces parent-child integrity. Each divergence is small; the class is that "validated on the way in" currently means two different things depending on which door the data used.
- **No edit path on a financial parent record (CODE-06).** Cheap to add now, expensive once `totalToRepay` has a renegotiation history that an edit would silently overwrite — which is exactly what `chief-architect.md:581` says the answer to is an edit *trail*.
- **The width probe is manual by convention (CODE-04).** `salary-width.js` has no npm script either, so "width conditions are checked by hand once and then trusted" is now a pattern rather than an oversight. Every width condition the project accepts on this basis decays the moment nobody re-runs it.

---

## Future Risks

- **The advisor does not know debt exists.** `analyzeExpenses` runs 26 rules over income and expenses (`:6362`, `:6425`, `:6532-6540`), including goal-aware ones. A user with ₮1,300,000 outstanding and a positive month will be told to put their surplus into a savings goal. That is defensible at stage 1 by C38 — the advisor is a period-filtered flow surface — but it is the most likely place for a debt figure to be smuggled onto a filtered card by someone trying to be helpful. It should be named on the off-limits list before it is proposed as polish.
- **Interest still does not reach Net Balance** (deferred WORK-168, `:6465` untouched — verified). The residual is real and stated; the risk is that CODE-02 lands in the same neighbourhood later and someone "fixes" both at once.
- **An abandoned debt reads authoritative forever.** `debtOutstanding` has no staleness concept, exactly as `goalSaved` does not. Now made twice, as the architect recorded.
- **Downgrade is destructive.** A round-11 export imported by a pre-round-11 build writes `debts` to storage through `{...defaults, ...parsed}` and then `load()` drops the key, so the next save erases them. Not a stated requirement, and a `SCHEMA_VERSION` bump would not have changed it — but it is the honest limit of "backward compatible".
- **The Debts list has no sort and no archive.** After a year of NBFI loans the screen is a growing pile of "✓ Cleared" cards above the ones that matter.

---

## Recommended Refactoring

The smallest set of structural changes, in the order that removes the most risk per edit:

1. **Un-scope the two button rules** — `button.goal-add` and `button.goal-icon-btn` instead of `.goal-actions button.…`, and correct the comment at `:1514-1517` to state what is true. Closes **CODE-01**. One line moved, one comment fixed, and it makes the reuse the comment already claims actually happen. (XS)
2. **Clamp `debtInterestPaid` at `cost`** — `Math.min(cost, Math.round(…))`. Closes **CODE-02**, and makes all three derived figures agree about what overpayment means. Add the overpaid case to `debts.js` flow 2 with its perturbation: remove the clamp, the reported cost exceeds `totalToRepay − principal`. (XS)
3. **Extract `importReplacement(parsed)` from the import handler and call it from the probe.** Closes **CODE-03** and retires the whole guarded-by-a-copy pattern for every collection added after this one. This is the highest-value structural change in the list. (S)
4. **Add `--width 320` to the `debts` script**, and make the containment flow snapshot the four other screens' `innerHTML` around a `renderDebts()` call. Closes **CODE-04** and **CODE-05** — two conditions that currently cannot fail become two that can, with no new runner, no framework and no build step. (S)
5. **Render `d.notes` on the card, and reset/initialise `debtDate`.** Closes **CODE-07** and **CODE-12**; two three-line changes that stop the form asking for things it cannot show. (XS)

Items 1-3 are what I would gate a release on. Items 4-5 are the same commit's worth of work and should not wait for another round.
