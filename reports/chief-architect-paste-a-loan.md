# Chief Architect Ruling — Design Request: reading a lender's message into the debt form

*(Supplemental. The Round 16 ruling at `D:\3_Claude\PowerApps\reports\chief-architect.md`, the Round 15 ruling at `D:\3_Claude\PowerApps\reports\archive-chief-architect-round15.md`, and the standing record at `D:\3_Claude\PowerApps\reports\archive-chief-architect-round14.md` — which carries the round-9 standing decision and the Round 11, 12, 13 and 14 supplementals — **remain in force in full.** This ruling adds to that record and replaces none of it. Two standing entries are read against this proposal and confirmed untested by it; one off-limits entry is added. Nothing else is reopened.)*

*(Archival note, added by the orchestrator and not part of the decision. This file is a DESIGN-REQUEST ruling and deliberately does not occupy `reports/chief-architect.md`, which holds the Round 16 review ruling. The `/review` workflow overwrites `reports/*.md`; this filename is outside that set, as `design-request-*.md` is.)*

**Instrument.** This is a design request, ruled on the precedent of `reports\design-request-debt-tracker.md` and `reports\design-request-true-cost-decoder.md`. There is no UI, Code or Engineering Manager report and none is owed — the owner chose an architectural ruling over "I propose, you approve", as they did for the debt tracker. Two owner decisions are recorded in §1 of the proposal and I do not re-open either: **text rather than image**, and **free**.

**Inputs read in full:** `reports\design-request-paste-a-loan.md`, `reports\chief-architect.md`, `reports\archive-chief-architect-round14.md`, `reports\archive-chief-architect-round15.md`, `reports\design-request-debt-tracker.md`, `knowledge\product-strategy.md`, `knowledge\project.md`, `knowledge\coding-standards.md`, `knowledge\ui-guidelines.md`, `knowledge\review-conventions.md`. Four claims the proposal makes about the application were re-derived at source rather than accepted, per C43; they are in the Verified section below.

**ID namespace.** This is not a review round, so there are no `WORK-` items. The items I create here are `PASTE-01`…`PASTE-04`. They are not to be confused with, renumbered into, or absorbed by any `WORK-` item from Round 16.

**Ruling issued on all five questions in §6, on the §7 deferral and its trigger, on four things the proposal did not ask, and on five collisions. No item is silent.**

---

## Verified Against Source, Not Accepted On Report

- **`debtProblem` does refuse `totalToRepay < principal`** — `index.html:4517`, `return 'repays less than was borrowed'`. §4's invariant exists. It is also the *only* thing §4 leans on, which is the subject of K2 below.
- **The five field ids exist and the handler reads them from the DOM**, so setting `.value` is sufficient: `#debtName`, `#debtPrincipal`, `#debtTotal` at `index.html:3083-3088`, `#debtDate` and `#debtDue` at `:3097-3104`; the `debtAdd` handler reads all five through `document.getElementById(...).value` and `unmoney(...)`. **§3's mechanism works.**
- **`#debtPrincipal` and `#debtTotal` carry `class="money-input"`**, whose display is produced by `formatMoneyInput(input)` — a function that takes the element, strips non-digits, and writes the grouped string. **A value assigned programmatically is not formatted by anything.** The proposal does not mention this and it matters: see PASTE-02.
- **`ISO_DATE_RE` is `/^\d{4}-\d{2}-\d{2}$/` — shape only.** `2027-02-31` passes it, and a `<input type="date">` given an invalid date silently blanks itself. The proposal's date handling has a silent-failure mode it did not state: see PASTE-02.
- **`.more-fields` is the disclosure primitive** (`index.html:2022-2034`, used at `:2807` and `:2895`), styled with child-scoped selectors, so nesting is safe as CSS. The Round 15 ruling keeps it as built and I am not reopening it.
- **The due-date helper already carries the rate clause** and does **not** carry the reminder clause — confirming the state report: WORK-14 shipped, WORK-04's reminder clause has not.

---

## Executive Decision

**Yes. This application is fit for release, and I am opening no release gate — sixth round running.** Nothing in this document is built, so nothing in it changes the release state of what is: five approved items shipped clean since Round 16, the harness is green and the debts fixtures hold 24/24 at 320px. On the request itself the answer is yes with conditions, and it is yes for one reason above all others — **§3 is correct, and it is the whole argument.** A path that sets five input values in front of an existing handler, with its existing refusals and its existing `debtProblem` behind it, adds no write path, no storage key, no schema field, no migration and no new refusal; it is the cheapest shape in which this request could have arrived, and I would have rejected any shape that wrote `db.debts`. What the proposal has not yet earned is the two-amount assignment as stated: the invariant it rests on orders two numbers once you already know they are the principal and the total, and it says nothing whatever about whether the two numbers extracted *are* those two. That gap is closable in one sentence of on-screen copy and one rule about the extractor's failure direction, and this ruling closes it rather than sending the request back.

---

## Rulings on the Five Questions in §6

### Q1 — Confirm the no-write-path reading in §3

**Confirmed, and it needs no ruling on storage — but the reading is only true while four properties hold, and they are binding conditions, not implementation detail.**

Filling form fields in front of a handler is not a second write path. The proposal is right about why, and right for the right reason: `debtProblem` validates shape, not truth, so a wrong-but-plausible number passes every check it makes, and the only thing in this application that can catch a misread digit is a human reading a labelled field. That human is therefore the mechanism, not a courtesy. So:

1. **The paste path never calls the add handler, never dispatches a click on `#debtAdd`, and never auto-submits.** There is no "paste and it's recorded" path, at any point, behind any setting.
2. **It never reads or writes `db`, `localStorage`, or any collection.** It touches five DOM elements and nothing else.
3. **Every value it writes is visible and legible in the form's own display idiom before the user taps Add Debt.** A number that arrives in the field in a format the user's own typing would never produce is a number they cannot check against the message. This is what makes PASTE-02's `formatMoneyInput` condition load-bearing rather than cosmetic.
4. **The pasted text remains on screen, beside the fields it filled, for the length of the interaction, and is never stored anywhere.** Not in `#debtNotes`, not in the record, not in `localStorage`. The user's verification act is a comparison, and a comparison needs both sides present. And a lender's message is the user's private document: it enters the DOM, it does not enter the store.

**No ruling on storage is needed and none is given. The Round 15 prohibition on any new storage key, schema field or migration is not tested by this feature and stands unamended** — for the second consecutive request about this module, which is worth recording as a property of the module rather than a coincidence.

### Q2 — The three-or-more-amounts case

**Ruled: fill nothing, and say so in one line that names what to do. The chooser is deferred with a trigger. Filling the two largest is rejected outright.**

The proposal frames this as honesty against the appearance of not working, and it is right that filling nothing may read as failure. It is wrong that this is the expensive branch. Filling the two largest produces a debt that is wrong, plausible, and confirmed by a user who has already been told the app read the message — and under K2 below, the two-largest rule is *more* likely to pick up an interest line or a balance than the two-smallest would be. **A feature that silently changes nothing costs the user the typing they were going to do anyway. A feature that silently changes the wrong thing costs them a wrong financial record and the trust that the next figure is right.** Those are not comparable costs and the mission does not make them comparable.

The appearance problem is solved by copy, not by a guess: the line says how many amounts were found, that it cannot tell which two are the loan, and that the fields below are ready to type into. That is the standing rule from Round 16's Architecture Strategy item 3 — *a derived figure that cannot be computed returns `null` and the screen says what would produce it* — applied one level out, to a derivation over text instead of over a record. It is the same rule and it should be the same voice.

**The chooser — offering the extracted amounts as tappable candidates — is deferred, not rejected**, with a trigger below. It is a real answer and it may turn out to be the common case; it is also a second assignment surface, and I will not buy one before the first has met a real message.

### Q3 — Is the assignment-by-invariant rule sound

**Ruled: sound for ordering, unsound as stated for identification. Approved with one binding addition. The alternative — offer every amount and let the user place all of them — is rejected.**

The rule is right that `totalToRepay ≥ principal` is not a convention but what a loan is, and right that this makes ordering language-independent and immune to template change. That is a genuinely good piece of design and it is why I am approving the feature rather than sending it back for a keyword dictionary I would then have had to reject.

But the invariant is a fact about the pair {principal, total}. It is not a test that the two numbers extracted *are* that pair. A message reading *зээл 1,000,000 · хүү 300,000* — loan one million, interest three hundred thousand — yields exactly two amounts, and §4's rule assigns principal 300,000 and total 1,000,000, producing a debt whose cost reads 700,000 where the truth is 300,000. It passes `debtProblem`, it passes both write-path refusals, it is off by a factor the module exists to expose, **and it is wrong in the direction of alarm, which is the direction this project is least able to detect in itself.** Round 16 rejected option B partly for overstating; I will not approve an extraction rule that can overstate by more, on the same card, three months later.

Two additions close it and both are binding:

1. **The extractor's failure direction is fixed: when in doubt, extract nothing.** A missed amount costs the user typing they were already going to do. A misread amount costs a wrong record. These are the two failure modes and they are not symmetric, so the extractor is biased, deliberately and in one direction, and the comment above it says so in those words. Conservative extraction is also what makes Q2's "fill nothing" the safe default rather than a disappointment: over-extraction lands in the harmless branch.
2. **The assignment is stated on screen as an assumption, at the moment it is made.** One sentence, in the module's existing helper voice, naming what was put where and asking the user to check both against the message. This is C36 applied to an assignment instead of to a figure: *a thing the application concluded by a model of its own is labelled as such wherever it is presented as a fact about the outside world.* The model here is "the smaller of two numbers in a lender's message is the principal", the application has no evidence for it in any individual case, and the one place it can be corrected for free is the screen where it happened.

**Rejected: offering every amount for the user to place.** It is the chooser wearing a different hat, it asks an untrained user under financial stress to do the labelling the feature was asked to do, and at that point the user is better served by reading the message and typing two numbers, which is what they do today.

### Q4 — The §5 collision with UI-04 / WORK-05

**Ruled at K1 below. In short: WORK-05 ships first and unchanged; the paste control is nested one level inside it; deeper nesting is off limits; and the fallback is pre-ruled so it cannot cost a round.** The proposal was right to want this decided now rather than discovered by whoever implements the second one, and that instinct is worth more to this project than the answer is.

### Q5 — Free, and no obligation to a later paid tier

**Confirmed. Permanently free, not subject to future repricing, and nothing here obliges a paid tier — with one boundary that I am drawing now because it does not exist yet and will be much more expensive to draw later.**

Recording a debt is named in `product-strategy.md`'s permanently-free list. Auto-filling the same form is the same act done faster, over the same record, on the free side of a line the strategy calls not a risk but a line. Nothing about the mechanism argues otherwise — and note that the strategy already treats a paste path as the universal floor beneath an automatic one, in its own words about SMS capture: *"It ships with a paste or share-sheet path that works everywhere."* This request is that floor, built first, over the debt record.

**The boundary, and it is binding.** The free/paid line in this project is drawn at **which record a feature writes**, never at which mechanism it uses. Pasting text is not a paid mechanism and parsing is not a paid capability; *drafting expense entries from bank messages* is the paid feature, and it is paid because of the record it writes and the users it serves, who are by then stable. Therefore: **this parser is over the debt form only. The day it accepts an expense SMS, learns a bank's format, writes to `db.actual`, or becomes a general "paste anything" entry point, it has crossed into the paid feature and the line stops being enforceable.** That shape is added to the off-limits list.

---

## Rulings on What the Proposal Did Not Ask

Four. Each would otherwise have been settled by whoever implemented it, which is how this project has historically bought its most expensive rounds.

### N1 — `#debtName` is filled by §3 and has no rule anywhere in §4

**Ruled: the paste path does not fill `#debtName`. Ever.**

§3 lists it among the five fields set; §4 gives rules for amounts and for dates and none for a name. A name is not orderable by any invariant, and deriving one from a message requires exactly the lender-keyword dictionary §4 rejects for the right reasons. It is also the one required field the user knows without reading anything.

And leaving it empty buys a property worth having on purpose: **the required name field is this feature's deliberate friction, and it stays.** With Name blank, `#debtAdd`'s first refusal (`toast('Enter who lent it')`) stands between a paste and a stored record, so there is no reflex path from "paste" to "recorded" — the user must type one deliberate thing before the record exists. That is the cheapest possible guarantee that §3's whole safety argument is real and not merely intended.

### N2 — Programmatic values do not pass through the money formatter

**Ruled: the two amounts are written as raw digits and then passed through the existing seam — `el.value = String(n); formatMoneyInput(el);` — and no display string is constructed anywhere in the paste path.**

`formatMoneyInput` takes the element, so this is a call, not a refactor and not a second formatter. Two reasons it is binding rather than tidy: the user cannot check `1000000` against `1,000,000₮` in a message at a glance, and a second place in this file that formats money is the beginning of the divergence this project has spent rounds removing elsewhere. `unmoney` would have parsed the raw digits perfectly well, which is exactly why this would have been skipped.

### N3 — Dates: the single-date case, the three-or-more case, calendar validity, and extraction order

Four rules, one principle — **the same invariant-ordering idea §4 already uses for amounts, extended rather than duplicated.**

- **Two dates:** earlier → `#debtDate`, later → `#debtDue`, as §4 states. Approved.
- **One date — unstated in the proposal and the common case for a lender's SMS.** Ruled: it fills `#debtDue` when it is strictly later than the value already in `#debtDate` (which the form defaults to today); otherwise it fills `#debtDate`. That is the record's own invariant `dueDate ≥ date` doing the assignment, which keeps this feature to **one idea** instead of two, and it is checkable by the user in two labelled fields.
- **Three or more dates:** fill no dates, same as amounts. One rule, not two.
- **Calendar validity, and this is a silent failure the proposal did not see.** `ISO_DATE_RE` is shape-only, so `2027.02.31` normalises to a string that passes it, and a native date input given an invalid value blanks itself without a word. **Every extracted date is round-tripped through `parseISO` and confirmed to return the same year, month and day before it is written**, and a date that fails is treated as absent. Dates are parsed with the module's existing `parseISO`/`toLocalISO` idiom; **`new Date(freeText)` is forbidden**, carried from the standing record.
- **Extraction order, binding:** **dates are extracted and removed from the text before amounts are extracted.** `2027.01.01` contains three digit runs. Without this, the most common date format in the target market manufactures phantom amounts, and — because of Q2 — usually into the harmless branch, which means it would be *invisible* rather than broken. Invisible is worse.

### N4 — The parser is the first function in this application whose input is arbitrary user text

**Ruled: PASTE-01 ships with fixtures in `tools\harness\debts.js`, riding its own commit. No new runner, no new probe.**

The ceiling is four plus one and it is a ceiling on runners; the debts harness exists and already carries fixtures for this module. A pure `text → { amounts, dates }` function with a table of cases is the cheapest assertion this project has ever been offered, and the reddening perturbation is trivial and real: invert the smaller/larger assignment and the fixture goes red, per C37 and C40(b). This is also the precedent the deferred effective-rate entry already set, where a harness fixture was pre-ruled as a condition of a figure that had not been built.

**The fixture table is ruled here, not left open:** §4's four rows; the two-amount interest-line case from K2, asserting that the extractor's conservatism or the on-screen assumption line covers it; a message containing a `2027.01.01`-style date, asserting no phantom amount; a percentage token, asserting it is not an amount; a single date in the future and a single date in the past, asserting the two different destinations from N3; and an invalid calendar date, asserting it is treated as absent.

---

## Conflict Rulings

There is no Engineering Manager report and therefore no recorded conflict list. These are the five collisions I found between the proposal, the standing record and the source. Each is ruled.

### K1 — §5: the nested `<details>`, against WORK-05 (UI-04), approved and unbuilt

**Ruling: WORK-05 ships first, unchanged and unre-scoped. The paste control is a `<details class="more-fields">` nested exactly one level inside it. Nesting deeper than one level is off limits. The fallback is pre-ruled.**

Three candidate answers existed and two of them cost more than they look.

*Re-scoping WORK-05* is the worst of them. WORK-05 was approved on the module's own reasoning — *one add and many glances* — and its conditions are already precise: the existing primitive unchanged, `open` when `db.debts.length === 0`, the empty-state copy re-read. Re-scoping an approved item to accommodate a feature that did not exist when it was ruled is how approved work turns into unbounded work, and this project has a standing rule against exactly that shape under a different name.

*Plain markup, no inner disclosure* — a labelled `<textarea>` sitting permanently above the required Name field — reads cheapest and is not. It makes a nine-control form ten controls tall, which directly contradicts the argument that produced WORK-05, and it puts a box for a lender's message above the field for the lender's name on the screen where a first-time user meets this module for the first time.

*Nesting one level* costs one tap, and it costs it at the cheapest moment in the module: the module's own comment establishes that adding a debt is the rare act and glancing is the frequent one. Native `<details>` inside native `<details>` needs no JavaScript, no new gesture, and carries correct keyboard and screen-reader behaviour for free — which is the entire argument the file already makes for the primitive at `index.html:2791-2792`. `.more-fields`' selectors are child-scoped, so nothing cascades. And it composes with WORK-05 rather than colliding: the returning user's screen is unchanged because WORK-05 already closed the card, which is the property §5 wanted.

**Pre-ruled fallback, so this cannot cost a round.** If at 320px the inner summary's chevron and dashed rule read as a second card rather than as a sub-section of the form, the inner `<details>` is dropped and the control renders as plain markup at the top of the card's contents, with no further architect input. Re-run the debts harness at 320, 360 and 390px either way.

### K2 — §4's invariant against a two-amount message that is not {principal, total}

**Ruling: the proposal's reasoning is right and its coverage is short. Ruled at Q3 — conservative extraction plus a stated assumption on screen. The rule ships; it ships labelled.**

Recorded separately from Q3 because the proposal did not raise it and somebody will eventually want to know whether it was considered. It was, the counterexample is a common Mongolian lender phrasing, and the answer is that the feature's honesty lives in a sentence rather than in the arithmetic. **That is the same lesson Round 16 recorded about `debtAnnualCostRate` — the wording is the load-bearing part, not the expression — arriving a second time, in the same module, about a different thing.** Twice is a pattern and I am writing it into the strategy below.

### K3 — §3 fills `#debtName`; §4 gives no rule for it

**Ruling: §3 is wrong on this field and it is corrected here. Four fields, not five. Ruled at N1.**

### K4 — The request against `product-strategy.md`'s build sequence

**Ruling: approved as shape; it is not on the build sequence and it displaces nothing on it. Its position relative to the payoff plan is the owner's call, not mine.**

The strategy's sequence is ordered by what unblocks what: the decoder, the payoff plan, the language layer, cloud sync, payments. This feature is on none of it and unblocks none of it. That is not a reason to reject it — the owner asked for it and a design request from the owner is a product decision, exactly as `design-request-debt-tracker.md` §1 established — but it is a reason to say plainly what it is: **an input convenience over a record that already works, not a capability the roadmap is waiting on.** It is approved because it is small, because it removes no defence, and because it serves mission step 1. It is not approved ahead of anything already ruled.

**And one honest note, recorded as a risk rather than a finding:** this feature's value rests on the assumption that typing is why debts go unrecorded. Nothing in this repository establishes that. It belongs, in form, beside the entries in `product-strategy.md`'s *Unverified Market Assumptions* table. I am not scheduling its verification and I am not gating the work on it; I am declining to let the assumption pass as a fact, which is what that table exists to prevent.

### K5 — Free here, against the paid SMS-capture feature that uses the same mechanism

**Ruling: the line is drawn at the record, never at the mechanism. Ruled and bounded at Q5.** Parsing is not a paid capability in this product and must never be described as one, or the free tier becomes a question of implementation detail and the binding constraint stops binding.

---

## Approved Improvements

Four items. Conditions are binding and are part of the approval, not commentary on it. **None of these is authorised to begin; see the Final Recommendation.**

| Item ID | Title | Reason for approval |
|---|---|---|
| **PASTE-01** | The extractor: a pure function from pasted text to candidate amounts and dates, with its harness fixtures | This is the whole of the feature's correctness and it is ruled here rather than left to implementation, on the WORK-15 precedent. **Conditions, all binding.** Pure — text in, `{ amounts, dates }` out; **no `db` read, no DOM access, no `document`**; it does not know what a debt is. **Dates extracted and the matched spans removed before amounts are extracted** (N3). A digit run adjacent to `%` is never an amount. **The failure direction is fixed and stated in the comment in those words: when in doubt, extract nothing** — a missed amount costs typing, a misread amount costs a record, and the two are not comparable. The separators it accepts are enumerated once, in the comment, as the design record; a token it cannot resolve unambiguously is not an amount. Amounts are whole tugrik, per the unit-of-record rule at the parse boundary. **Fixtures ride this commit** per N4, with the ruled table and the stated perturbation. In `tools\harness\debts.js` — **no new runner, no second probe.** S. |
| **PASTE-02** | The assignment, and the fill, through the seams that already exist | Per Q3 and N1–N3. **Conditions, all binding.** Amounts: exactly two → smaller to `#debtPrincipal`, larger to `#debtTotal`; equal amounts fill both, which is the zero-cost family loan the form's own helper already invites; one → `#debtPrincipal` only; three or more → nothing; none → nothing. Dates per N3, including the single-date rule, the three-or-more rule, the `parseISO` round-trip, and `new Date(freeText)` forbidden. **`#debtName` is never filled** (N1). **`#debtNotes` is never filled and the pasted text is never stored** (Q1.4). Amounts are set as raw digits and passed through **`formatMoneyInput(el)`** — the existing seam, one call, no constructed display string (N2). **It never calls the add handler and never auto-submits** (Q1.1). No change to `debtProblem`, to either write path, or to any existing refusal. XS–S. |
| **PASTE-03** | The control's home: nested one level inside WORK-05's disclosure | Per K1. **Conditions:** the existing `.more-fields` primitive unchanged — **no new component, and the Round 15 ruling that keeps `<details>` as built is not reopened.** Closed by default. Inside the add-debt card, above `#debtName`. **Nesting deeper than one level is off limits.** **WORK-05 ships first — binding** — so this is written against the shape that actually exists rather than against one described in a report. Fallback pre-ruled per K1. Re-run the debts harness at 320, 360 and 390px. S. |
| **PASTE-04** | Two sentences: what was assumed, and what could not be read | Per Q2 and Q3, and this is the item that makes §3's safety argument true rather than intended. **Conditions, all binding.** On a successful two-amount fill, **one sentence** in the module's existing helper voice naming what went where and asking the user to check both against the message — it states an assumption, it does not apologise, and it does not offer to correct anything. On a fill that could not be made, **one sentence** naming how many amounts were found, that the app cannot tell which two are the loan, and that the fields below are ready to type into. **No pasted text is ever interpolated into `innerHTML`** — the lines state counts and never content, which is what keeps `check-escaping.mjs` unwidened. **The paste control's copy is closed at these two sentences, permanently, on the way in** — the `.debt-totals` and "Left After Plan" precedents, applied before three rounds of growth rather than after. XS. |

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| **R1** | A parser that writes `db.debts`, or a paste that submits the form | The proposal rejects it first and is right. It would be a second write path into financial records, and `debtProblem` cannot catch a wrong-but-plausible number because it validates shape, not truth. Pre-rejected here so it cannot arrive later as a convenience. |
| **R2** | A Mongolian — or any — lender keyword dictionary | Rejected, and §4 declines it first. Lender-specific, rots on the next template change, and confidently wrong when it fails, which is the worst of the three available failure modes on a financial record. |
| **R3** | Filling the two largest amounts when three or more are found | Per Q2. It produces a debt that is wrong, plausible and confirmed by a user who has just been told the application read their message — and per K2 it is *more* exposed to a balance or an instalment line than any other candidate rule. |
| **R4** | Offering every extracted amount for the user to place | Per Q3. It hands the labelling problem back to an untrained user under financial stress, which is the task the feature was asked to remove, and at that point reading the message and typing two numbers is the better product. |
| **R5** | Auto-filling `#debtName` | Per N1. §3 claims it, §4 gives no rule for it, no invariant orders it, and deriving it needs R2. Leaving it empty also preserves the one deliberate act between a paste and a record. |
| **R6** | Storing the pasted text — in `#debtNotes`, in the record, or in `localStorage` | Nobody asked for it and it is the cheapest thing here to get wrong. A lender's message is the user's private document; it enters the DOM for the length of the interaction and it does not enter the store. |
| **R7** | Cloud vision OCR, through a proxy or otherwise | **Rejected permanently, and split out of the §7 deferral so it cannot return attached to it.** It needs a backend and a per-call charge on a feature ruled permanently free, it breaks offline-first, and it sends the user's loan document off their phone. All three are grounds on their own. The image path's only door back is the deferral below, and that door leads to an on-device path or to nothing. |
| **R8** | A general "paste anything" entry point, or expense/bank-SMS parsing reached from here | Per Q5 and K5. The free/paid line is drawn at the record a feature writes. This parser is over the debt form only. |
| **R9** | Any new storage key, schema field or migration | Carried from Round 15 and Round 16 unchanged, and confirmed at source as untested by this feature — for the second consecutive request about this module. |
| **R10** | A new harness runner, or a second probe, for the parser | Carried. The ceiling is four plus one and it is a ceiling on runners; the debts harness exists and the fixtures go in it. A second unasserting probe is a second home for a trust argument, per the standing off-limits entry. |
| **R11** | `<details>` nested more than one level, or a second disclosure mechanism | Per K1. One level is a sub-section of a form. Two is a maze, and the primitive was chosen for costing the user nothing to understand. |
| **R12** | Interpolating pasted text into `innerHTML`, or widening `check-escaping.mjs` to cover it | Per PASTE-04. The lines state counts, never content, so the question does not arise — and the check stays narrow on purpose, carried from Round 13. |
| **All prior rejections** — carried | Every shape in seven rejection tables | Unchanged and none re-raised. In particular, and read against this proposal: **no APR or amortisation model**, no second rate on a debt card, no `≈` reading on a debt card, no date filter on the Debts screen, no cap that under-reports what the user recorded, no numeric solver without its own ruling, no app-wide sweep of any kind. **None of them is touched by this request**, which is a property of the shape §3 chose and is worth saying out loud. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| **D1 — image OCR** | Reading a photographed or uncopyable lender message | **The §7 deferral is accepted and its trigger is approved, sharpened in two ways.** Trigger as proposed: the text path has shipped, **and** a real lender message is observed that a user cannot paste — a photographed paper contract, or an app that blocks copying. **Sharpened:** the observation is recorded in `D:\3_Claude\PowerApps\reports\HANDOFF.md` with the date and what was actually seen, on the Round 15 evidence-item doctrine — an item that cannot be resolved by reading is an evidence item, it carries no effort estimate and it blocks nothing. **Second sharpening: if it ever fires, the only permitted shape is on-device, lazy-loaded on the `loadFirebaseSDK` precedent. Cloud vision is rejected permanently at R7 and is not the fallback if on-device proves inaccurate** — if on-device cannot read Mongolian Cyrillic well enough, the answer is that the image path does not ship, not that the request escalates. **Third:** `project.md`'s Long-term Vision lists an *OCR Receipt Scanner*. That is a different record, a different screen and a different feature; **this deferral does not inherit from it and does not schedule it**, and neither may be used to fire the other. |
| **D2 — the chooser** | Offering the extracted amounts as tappable candidates when three or more are found | Deferred rather than rejected, because the proposal is right that this may be the common case and nobody yet knows. **Trigger: after the text path has shipped, an observation that real lender messages routinely yield three or more amounts, recorded in `HANDOFF.md` with the count and the message shape** — not the text itself, per R6. **Pre-ruled shape if it fires, so no architect round is needed: the candidates are placed by the user into the two labelled fields and nothing is assigned by the application; the conservative-extraction rule and the on-screen assumption line both still apply; and it is one surface inside the existing control, never a modal.** Until then, PASTE-04's honest line is the answer and it costs two sentences. |
| **Carried** | Every standing deferral | **Unchanged, every trigger intact, none fired by this request.** In particular: the effective rate (trigger: the day a repayment schedule is recorded), scheduled repayments and reminders, WORK-10, WORK-11, WORK-210(b), WORK-213, Stage 2, and the language layer — which still needs its own scoped proposal and its own ruling before a line of it is written, and which this feature does not advance despite parsing Mongolian text. **Nothing in this ruling authorises a Mongolian string anywhere in the interface.** |

---

## Development Order

**Three binding sequences: the Round 16 remainder before this feature; WORK-05 before PASTE-03; PASTE-01 before PASTE-02 before PASTE-03 before PASTE-04.**

**Before any of it — the Round 16 remainder, unchanged.** WORK-02 (carrying WORK-13), WORK-04's reminder clause, WORK-05, WORK-06, WORK-09, and WORK-12's citation half, in the Round 16 order. That work is ruled, scheduled and cheap, and **a new request does not queue-jump approved work.** WORK-05 in particular is a hard prerequisite of PASTE-03: building the paste control against a card whose shape is described in a report rather than present in the file is how a condition gets written against something that then changes underneath it, which this project has paid for in three separate rounds.

| Order | Item | Why here |
|---|---|---|
| 1 | **PASTE-01** | The function and its fixtures first, on the WORK-15 precedent. Everything downstream gates on what it returns, and it is the only part of this feature that can be wrong invisibly. Its fixtures ride the same commit because a pure parser without a fixture is precisely the thing that drifts while every command stays green. |
| 2 | **PASTE-02** | The assignment and the fill, against an extractor whose output is already final and already asserted. Nothing here touches the DOM's layout, so it can be read and reverted on its own. |
| 3 | **PASTE-03** | The control's home. Largest surface change and the one most likely to want re-scoping when it is opened, so it goes after the logic it hosts — and after WORK-05, binding. Harness at 320, 360 and 390. |
| 4 | **PASTE-04** | **Last, and not optional.** The two sentences are what make §3's safety argument true: the fill states its assumption where the assumption was made, and a fill that could not happen says so instead of looking broken. A paste path that changes fields silently has not shipped this feature; it has shipped its hazard. |

Run the full harness after each commit and expect 0; the debts harness at 320px after 3. **No `sw.js` bump** — the standing rule holds: v15 carries this work, the next deploy records v15 and its date, and only a deploy after that recorded one justifies v16.

---

## Architecture Strategy — next quarter

**What stays, and is not open for discussion.** Everything in the round-9 standing decision and the Round 11 through 16 supplementals, in full. The single self-contained `expense-pwa\index.html` that runs by being opened from disk. No framework, no build step, no bundler, no component abstraction — **and, reaffirmed against this request specifically, no new dependency: no Tesseract, no vision SDK, no parser library.** `localStorage`, one write seam, `load()` total, quarantine before write, numbered append-only migrations. **Offline-first, mobile-first, and correctness of financial data above everything.** A debt figure never reaches a period-filtered surface (C38). A figure the application computed by a model of its own is labelled as such wherever it is presented as a fact about the outside world (C36). Comments state rules, never tallies (ARCH-01). A citation names the thing, not the place (C43). The Debts module's own decisions stand and I am reopening none of them.

**What changes.**

1. **The application gains its first parser over arbitrary user text, and it is fenced on all four sides.** Pure, `db`-blind, DOM-blind, storing nothing, writing nothing, and asserted by fixtures in the harness that already exists. Those four properties are not tidiness — they are what makes the difference between an input convenience and a second door into the user's financial records, and any future change that removes one of them is a change to what this feature is.
2. **A new rule, and it generalises past this feature: where the application extracts meaning from something the user did not type into a labelled field, its failure direction is fixed toward extracting nothing.** Under-extraction costs the user work they were already doing. Over-extraction costs them a record that is wrong and looks right. The two are not comparable and the code says which one it prefers, in the comment, in those words.
3. **C36 is extended from figures to assignments.** Round 16 recorded that the wording, not the arithmetic, is what makes `debtAnnualCostRate` honest. K2 is the same lesson about a different object: an assumption the application makes *about which number is which* is a model of its own, and it is labelled at the point it is made. Twice in two rounds in the same module is a pattern, and it is now a rule rather than a recollection.
4. **The free/paid line is drawn at the record a feature writes, never at the mechanism it uses.** Parsing is not a paid capability. Pasting is not a paid gesture. `product-strategy.md`'s paid SMS capture is paid because of `db.actual` and because of who it serves, and stating that here is what keeps the binding constraint enforceable when the next feature arrives sharing a mechanism with a paid one.
5. **A form-filling path is not a write path only while the user can read what was filled.** Q1's four properties are the definition, not the implementation. Any one of them lost, and this ruling's central finding is no longer true.

**What is off limits this quarter.** Everything on the round-9, 11, 12, 13, 14, 15 and 16 lists, unchanged — including the amortisation model, APR anywhere in the interface, a second rate on a debt card, any cap that under-reports what the user recorded, a numeric solver without its own ruling, a fifth runner, a second probe, widening `check-escaping.mjs`, every mechanical sweep, and any new storage key, schema field or migration. **Four additions:**

- **Any parser in this application that writes to a collection.** Parsers produce candidates for a human to confirm in a labelled field. They do not produce records.
- **A general-purpose "paste anything" entry point, and this parser learning any record other than a debt.** Per Q5 and K5. It is the free/paid line and it is also the blast radius.
- **Cloud vision, or any network call in the service of reading a document the user holds.** Per R7. Permanently, and independently of whether the image path ever ships.
- **`<details>` nested more than one level, anywhere.** Per K1.

**Risks I am recording, not scheduling. None of these is a finding, and no reviewer raised any of them as one.**

- **Mine, from K2 and Q3.** The two-amount assignment can be wrong in a way that passes every defence this application has, and the only thing standing between it and a stored record is PASTE-04's sentence plus a human comparison. If that sentence is ever weakened to a reassurance — if it ever reads as *"filled from your message"* rather than as *"this is what I assumed; check it"* — the feature becomes a confident guesser and this approval becomes wrong. **The wording is the load-bearing part, exactly as it was for `debtAnnualCostRate`.** I am recording it so that whoever softens it knows what they are spending.
- **Mine, from K4.** This feature's value rests on an unverified assumption — that typing is why debts go unrecorded. It is approved on the owner's judgement of their own market, which `product-strategy.md` says explicitly outranks this repository. If the assumption is wrong, what was spent is four small commits and a permanent piece of parser surface; recorded so a wrong assumption can be traced to what it decided.
- **Mine, from Q2.** Conservative extraction means the most likely visible outcome of this feature, for a real message dense with account numbers and reference codes, is the honest "I could not read this" line. That is the correct behaviour and it may read as the feature not working. **D2's trigger is what converts that from a complaint into evidence**, and it is the reason the chooser is deferred rather than rejected.
- **A share-target or share-sheet path is not authorised by this ruling.** `product-strategy.md` mentions one for the paid SMS feature. It is a manifest change and a platform integration on an application that runs by being opened from disk, and it would need its own proposal and its own ruling. Recorded so it is not mistaken for an implementation detail of a paste box.
- **Carried from Round 16, unchanged.** Every string in this module is a literal, and this feature adds two more of the hardest kind — sentences whose exact wording carries the module's honesty, about a message written in a language the interface does not yet speak. The language layer is item 3 of the build sequence and still needs its own scoped proposal and its own ruling.
- **Carried.** The bell badge has no single refresh seam; `renderDebts` walks the payment ledger roughly seven times per debt; the required-field rule is kept in this module and knowingly unkept in two others; at least one stale line-number citation lives elsewhere in the application file.

---

## Final Recommendation

**Take this ruling to the product owner and get an explicit yes before a line of it is written — this ruling decides a shape, it does not authorise work, and the four items above do not begin without the owner's approval.** When that approval exists, the order is not negotiable: finish the Round 16 remainder first — WORK-02 carrying WORK-13, WORK-04's reminder clause, WORK-05, WORK-06, WORK-09, then WORK-12's citation half — because it is already ruled, already scheduled, and **WORK-05 is a hard prerequisite of PASTE-03**; then `PASTE-01`, the pure extractor with its fixtures in `D:\3_Claude\PowerApps\tools\harness\debts.js`, written to extract dates before amounts and biased to extract nothing when in doubt; then the assignment, then its home, then the two sentences last. The one sentence I want carried out of this ruling is the one that decided Q3: **the invariant that a loan repays at least what it lent will tell you which of two numbers is the principal, and it will never tell you that the two numbers you found are the loan — so the application may fill the form, and it must say out loud what it assumed while doing it.** §3 was right that this request adds no write path, and the reason it is approved is that §3 is right; PASTE-04 is what keeps it right after the code is written by someone who has not read this document.

*(Design-request ruling, 2026-09-18. Supplemental to the Round 16 ruling and to the round-9 standing decision and the Round 11, 12, 13, 14 and 15 supplementals, all of which remain in force in full. Items `PASTE-01`…`PASTE-04`; rejections `R1`–`R12`; deferrals `D1`–`D2`; collisions `K1`–`K5`; unasked questions `N1`–`N4`. Source: `D:\3_Claude\PowerApps\reports\design-request-paste-a-loan.md`.)*
