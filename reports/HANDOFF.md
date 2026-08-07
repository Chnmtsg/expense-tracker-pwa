# Handoff — state of the work

Written across the sessions that ran review rounds 7 through 13 and implemented
them. Read `reports/chief-architect.md` first: it is the standing decision and
it outranks this file. It now carries four sections — the round-9 ruling and the
Round 11, 12 and 13 supplementals — and **all four are in force**. This file
covers what that report does not: where the work stopped, how to run the checks,
and the mistakes that cost the most time.

---

## Start here if you are picking this up

**All of round 13 is merged to `main` — Sprint 1 and Sprint 2 both. Tree clean,
all five commands exit 0 on `main`.** No release gate is open and none has been
for three rounds; the build is fit to ship. No work gate is open either.

### The immediate next task

**A round 14 review.** Round 13's approved roadmap is finished; nothing in it is
outstanding, and there is no unmerged work anywhere. Sprint 2 came in on
`round-13-sprint2` (twelve commits) and merged at
`Merge round-13 Sprint 2: the probes stop being green over nothing`.

Sprint 2 landed in the architect's binding order, one commit per item:

| | |
|---|---|
| WORK-199 | the 320px flow checks its fixture rendered before it measures it |
| WORK-197 | the headline interest figure is measured; nothing asserts it |
| WORK-198 | that flow's header describes the flow that is actually there |
| — | *(the containment header stops describing the baseline WORK-191 replaced)* |
| WORK-200 | the orphaning demonstration reddens the assertion it names |
| WORK-201 | flow K expects a figure a reader can check, not a formula |
| WORK-195 | the goal history modal stops presenting a failed delete as committed |
| WORK-196 | that modal stops leaving an editCtx kind nothing handles |
| WORK-194 | the one chip the app cannot vouch for says so |
| WORK-204 | the required-field mark becomes a fact, not a red glyph |
| WORK-205 | an excluded category keeps the control that un-excludes it |

**Three results worth carrying rather than re-deriving:**

- **WORK-197 came back 1.** `E_diag_cost_value_rects` is 1 and the text is
  `₮1,500,000` at 320px in a 288px card — the headline interest figure does
  **not** wrap at seven figures. There is nothing to carry to a UI round, and
  the architect's recorded risk on that point can be read as answered for now.
- **WORK-199 found the flow it repaired was green over nothing.** Deleting the
  note render left `npm run debts` at exit 0. That is measured, not argued.
- **One unlisted item shipped, and it is recorded as unlisted.** WORK-191
  rewrote the determinism baseline in Sprint 1 but left the flow header twenty
  lines above still describing the construction it had replaced — "snapshotted
  twice with nothing in between", which is the defect WORK-191 exists to
  remove. Found while reading for WORK-199, fixed in its own commit.

**The service worker is NOT bumped again, and that is deliberate.** It went to
`expense-tracker-v12` in Sprint 1 and there has been no deploy since, so one
bump still covers everything in round 13. The rule is one bump per deploy, not
one per sprint. **If you deploy after merging, v12 is the correct string; the
next bump belongs to the next deploy.**

**Both screenshot-gated items are now answered too** — `WORK-141` is closed as a
comment on the measurement, and `WORK-186(b)` turns out to need a decision
rather than a fix. See the section below. Everything round 13 approved is in.

### What the last three rounds were actually about

Not features. Guards that could not say no. Three separate instruments were found
green over things they could not see:

| | |
|---|---|
| Round 11 | an assertion tested a *copy* of the import object living inside the probe |
| Round 12 | `npm run debts` had no `--width`, so the 320px condition ran at 749px |
| Round 13 | `npm run verify` returned **0** on a file whose script could not parse |

If you take one thing from this file: **a green command is a claim about an
instrument, not about the application.** Every convention C30–C42 exists because
that claim was wrong at least once.

### Load-bearing and easy to undo by accident

- **A debt is its own collection, never a flag on `db.income`.** Every Dashboard
  total is an unconditional reduce, so a flag would be one forgotten filter from
  the defect the Debts module exists to close. `npm run debts` and the WORK-164
  flows in `npm run v1` are the guards.
- **The Debts screen has no date filter, and its figures never appear on the
  Dashboard.** They are stocks. C38.
- **`data-num-token` is normalised in the containment baseline and deliberately
  NOT in the containment comparison.** It is a tween ticket that advances on
  every render, so the baseline must ignore it — but between the two containment
  snapshots nothing should advance it, which makes it the tripwire for
  `renderDebts` calling `renderDashboard`. Normalising it in both places would
  look tidier and would remove the guard.
- **No HTML comment may go inside a JavaScript template literal.** `lint.mjs` can
  now see them, so a stray backtick fails `verify` instead of shipping a blank
  screen — but the four that existed were moved out in WORK-188 and none should
  come back.

### A line number in a comment is stale the moment anything above it moves

This file and the reports cite `index.html:NNNN` constantly, and it is a useful
habit. It also rots faster than anyone expects, and it rots **silently** —
nothing in `verify` reads a comment.

Worked example, produced in one sitting. Round 13 Sprint 2 wrote
`.goal-meta-item.note at index.html:1502` into a probe header. A later commit in
the SAME sprint inserted a 25-line comment at `:1045`, and every reference below
that point moved by 26 lines. `:1502` then pointed at `.goal-meta`, a different
rule that happens to look plausible. Three references drifted that way. Then the
correction over-shot and moved two that had never drifted at all, because they
sat *above* the insertion — a rule at `:887` does not move when you insert at
`:1045`.

So, two habits:

- **Lead with the selector or the function name; the number is convenience.**
  "`.goal-meta-item.note` at `index.html:1528`" survives the number going stale,
  because the next reader can grep. A bare `:1528` does not.
- **When you correct one, check which side of the edit it was on.** Only
  references BELOW an insertion move, and they all move by the same amount.
  `grep -n` the selector and read the line back before writing the number down —
  every number in the shadow table below was verified that way after being
  wrong twice.

### The two screenshot-gated items — BOTH OBSERVATIONS HAVE NOW BEEN TAKEN

They were recorded for many rounds as needing something no command could
produce. That was not quite right: `run.mjs`'s own iframe technique takes a
screenshot at an exact width, and the header at the bottom of this file
documents how. Both were taken at 390px in Chrome and both are answered.

**WORK-141 — CLOSED as a comment, which is the outcome the standing decision
pre-ruled for this branch.** The engine discards the padding and the border
this rule sets on a native checkbox; the deferred "bordered boxes with 24px of
padding" state does not occur.

    notifEnabled / ShowPlanned / ShowGoals / ShowRecurring
    13x44  padding 0px  border 0px  min-height 44px  appearance auto
    (the <select> beside them, which the rule IS for: 324x46)

The one thing the deferral did not anticipate: **`min-height: 44px` IS
honoured**, so each box is 13 wide and 44 tall. Harmless — 44px is the touch
minimum and the flex `<label>` is the real click target — but recorded above the
`input, select, textarea` rule (`index.html:1071`) so it is not rediscovered.
`width:auto` inline is load-bearing; do not remove it.

**WORK-186(b) — the finding's framing is wrong, and it needs a decision rather
than a fix.** It was raised as "`.debt-card` resolves its shadow from
`--shadow` where its neighbours use `--e1`". Measured in the dark theme, and
confirmed at source:

| | |
|---|---|
| `.card` `:875`, `.kpi` `:887`, `.kpi-mini` `:1019`, `.stat-tile` `:1456` | `var(--e1)` |
| `.goal-card` `:1489` | `var(--shadow)` |
| `.debt-card` `:1604` | `var(--shadow)` |

**The debt card matches the goal card exactly** — the component it was modelled
on, whose chips and buttons WORK-170 and WORK-184(b) deliberately merged with
it. The divergence is between the goal/debt card family and everything else,
it predates the Debts module entirely, and changing `.debt-card` alone to
`--e1` would break the one consistency the last two rounds were spent
establishing. **So the choice is leave both or change both, and changing both
touches the Goals screen — a wider item than the one that was filed.**

Visually it is moot on the evidence: in the dark theme both resolve to
near-black on near-black (`rgba(0,0,0,.4)` vs `rgba(15,23,42,.05)` on a
`rgb(17,24,39)` card) and neither shadow is perceptible in the screenshot.

Screenshots are at `reports/shot-notif-390.png` and
`reports/shot-debts-dark-390.png`, **untracked on purpose** — they are evidence
for a decision, not a repo artifact, and this project records measurements as
prose everywhere else.

**A trap that bit while measuring, worth the two lines.** `body` carries
`transition: background .2s` at `:776`, so a probe that flips `data-theme` and
immediately reads `getComputedStyle(document.body).backgroundColor` gets the
**in-flight** value — it reported the light background on a page that
screenshots dark. `box-shadow` is not in that transition list, so the shadow
figures above are unaffected. Use `--no-transitions`, or read a property that
does not transition, or take the picture.

### Still only the user can unblock

- **Android packaging** is blocked on an HTTPS origin and a Play Console
  account. See `expense-pwa/DEPLOY-ANDROID.md`.

### The user's live deployment situation, which is not in any report

They have a GitHub repo containing **four files at the repo root** —
`icon.svg`, `index.html`, `manifest.json`, `sw.js` — uploaded by hand. This
project keeps the app in `expense-pwa/`, so the two are not connected and every
update is a manual re-upload.

**Five icon files referenced by `manifest.json` are missing from that repo**
(`icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-512-any.png`,
`icon-maskable.svg`), so "Add to Home screen" will not work there until they are
uploaded. `.github/workflows/deploy.yml` exists here and publishes `expense-pwa/`
to Pages gated on `npm run verify`, but it has never run, because **this repo has
no remote at all**. Connecting them would overwrite their repo's history — their
call, and it has not been made.

`npm run debts` is a probe on the existing runner, not a fifth runner.

**Its acceptance record was reopened in round 12, and here is the honest
version.** Three of the conditions WORK-164 and WORK-165 were closed on were
recorded as met before they were capable of failing:

| Condition | Recorded met | Actually capable of failing since |
|---|---|---|
| A backup round-trips its debts | round 11 | **WORK-172** — the assertion rebuilt the import replacement object inside the probe and asserted against its own copy; deleting a default from the application left it green |
| No horizontal scroll at 320px | round 11 | **WORK-175** — the command carried no `--width`, so it ran at 749px where a 288px card cannot overflow; and once it ran at 320 the fixture still could not overflow, because every word in it was shorter than the card |
| `renderDebts` writes only inside `#debts` | round 11 | **WORK-176** — the flow checked where three elements sat in the markup, which is not a property of the function |

The module itself was correct in all three cases. The guards were not. Work gate
G12 held any new debt capability until those three landed; it is now closed, and
each of the three carries a C40 demonstration in its commit message.

**G12's closing record is amended once, in round 13, and the amendment is not a
reopening.** WORK-176's containment assertion was green having first been red on
the named application perturbation, and that statement stands unchanged.
WORK-176's *second* condition — the determinism baseline — was recorded as met on
a construction that could not fail: it read `innerHTML` twice in a row with
nothing between the reads, which compares a thing with itself.

**The author of the defective condition was the Chief Architect**, not the
implementer. The round-12 condition said, verbatim, *"take the four snapshots
twice with NOTHING between them"*, and the probe was that sentence compiled. That
is why C37 now binds the author of a condition to write the reddening
perturbation *before* publishing it.

The baseline became capable of failing in **WORK-191**, which also closed a hole
neither reviewer named: the containment loop iterates the runtime-computed
`stable` set, so a screen that became non-deterministic would have silently left
coverage while the command stayed green. It now throws and names the screen.

The gate is not reopened. Nothing was held behind it.

**Do not compress this into "the module was approved and verified."** The
distinction between a condition that was met and one that could have failed is
the completion-record failure rounds 5 and 6 were spent recovering from.

**`round-10` is the live branch** — ten commits, tree clean, every command
green. It is the whole of round 9's approved roadmap, in the architect's
binding order:

| | | |
|---|---|---|
| WORK-151 | the two assertions that could not fail | *the work gate* |
| WORK-160 | the rate date, from a fact the app owns | |
| WORK-152 | the instruction names a route that exists | |
| WORK-153 | the help line gated on the render's own predicate | |
| WORK-154 | a stale rate says so | |
| WORK-155 | the disabled-control explanation gets the card's width | |
| WORK-158/159 | the card joins the seam; two comments stop overstating | |
| WORK-157 | a reading that would print `USD 0` prints nothing | |
| WORK-161 | the reading is subordinated by size | |
| WORK-162 | the picker names its currencies | |

**Two items are deliberately not done, and neither is an oversight.**

- **WORK-141** — was blocked on one screenshot of Settings → Notifications at
  390px. Round 9's UI review confirmed from source that the markup agrees with
  the finding, and said correctly that source cannot settle how it *renders*.
  **That screenshot has since been taken and the item is CLOSED as a comment** —
  the engine discards the padding and border on a native checkbox. The figures
  and the one surprise (`min-height` IS honoured) are in the pickup section.
- **WORK-156** — `drawMonthlyTrend`. Deferred since round 5 because its trigger
  is stated in milliseconds and nobody had measured. **The measurement has now
  been taken and the trigger DOES NOT FIRE.** See "The measurement, taken at
  last" below. The deferral holds — now on evidence rather than on the absence
  of it.

**WORK-163 was rejected as not-work** and should not be revived on its own.

### The measurement, taken at last

`tools/harness/perf.js`, run by hand through the existing runner:

    node tools/harness/run.mjs tools/harness/perf.js

**It is NOT one of the five commands and must not be added to them.** It is a
measurement, not a gate, and it has no npm script on purpose — a sixth entry in
a runbook that WORK-206 just corrected to say five would make a measurement look
like a check. It asserts nothing about its own figures for the same reason: the
trigger is "above 100ms", and a probe that threw on that would turn a decision
to schedule work into a red build.

**The calibration is the part to read first.** `--virtual-time-budget` makes the
clock advance on the browser's terms, so the probe spends a known 50ms in a busy
loop and checks it can see it before it measures anything. It reported 49-50ms.
Without that, every figure below would be an artifact of the flag.

| Measured | Trigger | Fires? |
|---|---|---|
| `renderDashboard()` on **This Month**, 5,000 records — **2ms** (2,3,2,2,2) | above 100ms | **No**, by a factor of 50 |
| `renderDebts()`, 200 debts + 5,000 payments — **41ms** (42,41,42,41,41) | above 100ms | **No** |
| *(context)* `renderDashboard()` on **All Time**, same store, 36 month columns — **62ms** | not the trigger config | — |

**Both deferrals hold.** WORK-156 stays deferred and WORK-202 stays a recorded
risk, and neither is now resting on nobody having looked.

**One observation for whoever rules next, which is theirs and not mine to
act on.** The trigger names the **This Month** configuration, on the stated
ground that it is "the configuration in which this cost is not escapable". That
is true per scan — narrowing the filter does not stop each month scanning the
whole store — but the filter also shrinks the *month list*, which is the
multiplier. So This Month builds **one** column and costs 2ms, while All Time
builds 36 and costs 62ms. **The trigger is aimed at the cheapest configuration
and the expensive one is excluded from it**, which means as written it is
unlikely ever to fire. The number that would actually cross 100ms first is All
Time at roughly 3x this store — about 15,000 records. Recorded here rather than
acted on: the trigger is the architect's and re-aiming it is a ruling, not an
implementation.

**Next:** merge `round-10`, then a review round on it. Or the Android work,
still blocked on two decisions only you can make — an HTTPS origin to host
from, and a Play Console account. See `expense-pwa/DEPLOY-ANDROID.md`; the two
traps recorded there (assetlinks.json must be served from the **origin root**,
and with Play App Signing the fingerprint is Google's, not your local
keystore's) are the ones that cost days if met live.

---

## Where things stand

Eight review rounds have run. Rounds 4 through 8 are **fully implemented and
merged to `main`.** One commit per approved item, each message carrying its own
evidence and its own red-then-green demonstration where one applies.

Rounds 5 and 6 found no Critical and no High. **Round 7 found one High**, and
it was damage from round 6: WORK-99 moved the error *reporting* above
`let db = load()` and left the *recovery* below it, so after a boot-time throw
"Restore from file" opened a picker and did nothing. The probe added in the
same round to guard that state asserted the button was **visible** rather than
**functional**, so it passed.

### Gate R8: closed on one item, and the other was measured out

**R8 opened with WORK-128 and WORK-129. WORK-128 landed. WORK-129 was removed
from the gate when the measurement its close depended on was taken** and
returned no overflow at any width from 240 to 430 in Chrome on the corrected
harness; the approved declaration was then applied and produced identical
figures at every width. The residual WebKit exposure is a recorded risk with a
trigger, not a delivered item.

That wording is deliberate and must not be compressed into "both landed". A
gate record that reports a dropped item as a delivered one is the
completion-record failure rounds 5 and 6 were spent recovering from.

- **WORK-128** — "due" is forward-looking for a recurring series.
  `nextPlannedDue` returned the anchor however old for a series never logged,
  so a plan anchored months back held an undismissable urgent badge, fired a
  daily OS notification, printed four past dates under "Next:", and offered a
  button that wrote one actual expense per tap. Its two assertions were red
  against fixture F3 before a line changed. All four range totals unchanged.
- **WORK-130(a)** — the binding precondition, in. The width-mode frame no
  longer reserves a scrollbar gutter, and a width-mode probe must now report
  `viewport_clientWidth` or the runner fails.
- **WORK-129** — not landed. See "A derived claim is measured before it gates"
  below, and the risk table.

### Gate R7: `load()` is now total

Its two items are on `main`. `load()` returns a valid parsed database or the
defaults for any bytes in the store, and every failure routes through
quarantine and the true banner — one corruption outcome, not two.

**The catch discards `d`, and that line is load-bearing.** `d` is assigned from
`parsed` before the code that throws, so without the reset it stays truthy, the
defaults are never substituted, and the app boots on a half-built database with
`categories` as a string. Measured: with the reset removed, init completes, the
banner shows, Restore is reachable, and `categoryOptions()` throws
`db.categories.map is not a function`. Every assertion the old probe had would
have passed.

**The build is releasable.** Everything still open was deferred by the
architect with an explicit trigger, not left undone:

| Deferred | Trigger that reopens it |
|---|---|
| **WORK-129 (WebKit residual)** — a risk, not an item | `.grid-2`'s tracks may floor on a form control's intrinsic width in a non-Blink engine. Unmeasured and unmeasurable here. **Trigger, deliberately cheap: any OBSERVATION of horizontal scroll on the Salary screen on iOS Safari — one report, one screenshot, one borrowed device.** If it fires the fix is **pre-ruled and needs no architect round**: `.grid-2 > * { min-width: 0; }` at `index.html:863`, XS, with the observation recorded as the derivation and the observing engine named. What is deferred is landing it, not deciding it |
| ~~WORK-97(b)~~ — **SETTLED**, no longer deferred | Measured once WORK-114 unblocked it. The padding-zero variant fails both stated conditions: it does not clear a 44px track at 360px (42.7), and it pushes `.cal-nav` and `.cal-legend` flush to the card edge at every width. **The overlap is accepted and the derivation is recorded in the `.cal-grid` comment**, along with the fact that 320px cannot supply the 320px of grid seven 44px cells need, at any padding. Do not reopen without a new argument |
| WORK-85 + WORK-35 | any behavioural change to either reorder path (extraction first), or a real keyboard/switch user blocked |
| WORK-16 / WORK-49 | a measured render >100ms on a mid-range device on Dashboard or Analytics, **or** a real store >5,000 actual records. Code Review has now declined to re-raise this twice without a measurement |
| WORK-15 (Cloud Sync) | precondition, restated as conditions rather than ids: cloud data must go through the same validation and migration as local data — `loadFromCloud()` assigns `db` directly today — and a sync failure must be visible |
| WORK-17 IndexedDB half | a real blob approaching 2 MB |
| WORK-23 screen half | the modal half landing and users still reporting disorientation on Back |
| Stage 2 (test harness) | the first *calculation* defect a unit test would have caught. Unfired for the sixth round running. `npm run recurrence` now answers the strongest argument against this deferral — that no command would surface such a defect — which **strengthens** it |

Rejected with no trigger — these return only on an observed user harm, not a
reviewer's projection: WORK-58/88 (auto dark theme), the `.btn-block` refactor,
deleting `fbApp`, and both mechanical sweeps (72 font sizes, 69 spacings, now
declined four times).

Shapes rejected inside approved items, worth not re-proposing: the `z-index`
route for the hero highlight (measured below AA); flagging salary fields on
`input` rather than Save (toasts mid-keystroke); a deny-list in
`check-escaping.mjs` (one live site, already safe); **moving the `#importFile`
listener above `load()`** (its body reaches `ISO_DATE_RE`, `writeDb`, the
dialogs and four render functions — it converts a silent no-op into a throw);
**a console recorder in `boot-crash.js`** (it would watch the outer window,
where nothing happens); and **a fourth icon-grid breakpoint** (2.4px across a
12px band, on a rule whose existing breakpoints were justified by figures that
were never true).

---

## How to check your work

**Five commands after every commit, not four.** `npm run debts` was added in
round 11 and this block still listed four until round 13 — and it is the only one
that runs at a phone width.

```
npm run verify       # the four static predicates, must exit 0
npm run v1           # write flows, the ≈ reading, and the corrupt-boot walk
npm run boot         # a boot-time throw must still reach a working Restore
npm run recurrence   # fixture totals, the 31st clamp, and no past due date
npm run debts        # the Debts module's conditions — runs at --width 320

# Width-mode guard — run at each width; not a package script because it takes
# one viewport per invocation. Asserted band is 320-430.
node tools/harness/run.mjs tools/harness/salary-width.js --width 320
```

**What `verify` covers, and what it did not until round 13.** It can now fail on
a parse error anywhere in the shipped script. Before WORK-187 it could not:
`lint.mjs` blanked every HTML comment in the file *before* working out where the
`<script>` block started, so a comment written inside a JavaScript template
literal was erased before ESLint saw it. A backtick in one of those four regions
ended the template literal, the top-level script stopped parsing, and
`npm run verify` returned **0** over a completely dead application. `npm run boot`
was what caught it.

So: a green `verify` was never on its own evidence that the app starts, and until
round 13 it could not have been. It is now — but run all five anyway, because
each of the other four covers something `verify` still cannot see.

`npm run v1` now carries WORK-143's four display-currency assertions as well as
the original write flows: the `≈` reading equals the ₮ figure times the cached
rate, no cached rate means no reading at either site, switching currency leaves
the stored blob **byte-identical**, and no recorded amount or row ever leaves
whole tugrik. Eleven flows; all four were demonstrated red by breaking the
application, not the expectation.

`verify` runs `lint` → `check:escaping` → `check:contrast` → `check:saves`.
Each exists because someone asserted a class was closed and was wrong.

**The ceiling is four plus one, and it is a ceiling on RUNNERS.** Four static
predicates behind `verify`, plus one render harness whose single runner is
`tools/harness/run.mjs`. Probes and fixtures under `tools/harness/` are its
inputs and are not counted — that is what settled whether the recurrence guard
could exist. There is no sixth runner.

**All four commands can fail, and each was demonstrated red before it was
trusted green.** `v1` asserts every value it records, not just the absence of
throws. `run.mjs` fails on a thrown flow, an unexpected console error, an
unparseable payload, an **empty** payload, and a `THREW` nested at any depth.
"Unexpected" excludes errors raised inside the probe's `expectingFailure`
window — if you add a deliberate failure, put it inside that window or you will
break the clean-build run, and an assertion that cries wolf gets deleted.

`run.mjs` renders any probe and prints what it measured:

```
node tools/harness/run.mjs <probe.js> [--width 390] [--fixture] [--no-transitions]
```

`--fixture` injects `tools/harness/fixture.js` (`loadFixture()`, `RANGES`), the
five-plan dataset from `expense-pwa/VERIFICATION.md`. `npm run recurrence` is
the probe that evaluates it; run it after any change to recurrence, filtering
or the dashboard.

Set `CHROME_PATH` if Chrome is not at the default Windows location.

Note what this file does **not** say: how many pairs `check-contrast.mjs`
measures, how many `save()` sites are allow-listed, how many themes exist.
Those are the tools' numbers and the tools print them.

---

## Mistakes worth not repeating

Every one of these produced a false pass or a false failure in this project.

**Instrument faults — the expensive category.** More findings in rounds 4–7
came from a broken probe than from broken code, and a broken probe that
*passes* is the dangerous shape.

- **A visibility assertion is not a function assertion.** This is the round-7
  lesson and it cost a High. `boot-crash.js` asserted the Restore button's
  `offsetParent !== null` and passed while the button did nothing at all. It
  now asserts that init **completed**, which is the property that implies every
  listener below `load()` was registered.
- **Assert on something that is true on a healthy build.** A first attempt at
  the WORK-115 guard checked `#expCategory`'s option count — which is 0 on a
  perfectly healthy boot, because that dropdown only fills when the Expenses
  screen renders. It failed the green case. Prefer calling a function on the
  frame's window over reading a rendering side effect.
- A top-level `let` is **not** a property of `window`. `frame.contentWindow.db`
  is always `undefined`. Function declarations *are* — `categoryOptions()` is
  how the WORK-115 guard reads the store.
- `--window-size` is ignored by headless Chrome for layout. Host the page in a
  sized iframe and have the probe report its own `innerWidth`. The same trap
  bites **screenshots**: a plain `--screenshot` renders at desktop width and
  crops the right-hand side — where the thing you are checking usually is. Use
  an iframe of the target width, a window slightly *wider*, and
  `--force-device-scale-factor=1`.
- CSS transitions never settle under `--virtual-time-budget`.
- `requestAnimationFrame` is starved. Drive animations with a stubbed clock.
- **A count of zero is not a pass**, and neither is a selector that found the
  wrong thing. `#analytics` is `#daily`; the quick-amount row is `qaRowInc`;
  there is more than one `.grid-2` on the salary screen. **Every probe here
  throws `setup failed:` rather than measuring air** — keep it that way.
- Expanded occurrences carry a **synthetic id** `"<seriesId>:<date>"`; only the
  occurrence landing on the plan's own anchor date keeps the plain id. Filter
  for both or every recurring occurrence is invisible.
- When poisoning the store to test `load()`, the blob must have a **truthy
  `.length`** to reach the throwing path — `categories: 'abc'` works,
  `categories: {0:'x'}` does not.
- **A throw exits a flow at its first failing assertion.** One perturbation run
  only ever proves the first assertion in each flow. WORK-113 needed five
  passes, each leaving the earlier assertions correct so the next was reached.

**Windows/PowerShell.**

- `index.html` is LF. PowerShell `.Replace()` with `\r\n` matches nothing.
- Commit messages **always** via `git commit -F <file>`, and write that file
  with the **Write tool**. `Set-Content -Encoding utf8` puts a BOM in the
  subject line — this is documented here and I still did it to ten commits in
  round 7, then had to `filter-branch` them. A multi-line `-m "..."` is also
  torn apart by the parser into dozens of `pathspec` errors.
- **Never `git checkout <file>` to undo a temporary test edit.** It reverts to
  HEAD, not to your working state. It destroyed a finished WORK-111 in round 7
  and the work had to be rebuilt. Use `git stash push <file>` / `git stash pop`,
  which preserve and restore — or revert the edit with the Edit tool.
- `Select-String` renders a leading `/*` as `\*`. Display artifact, not a broken
  comment — confirm with Read before "fixing" it.
- Use absolute paths; the working directory drifts.

**Process.**

- Land tooling *before* the fix it will verify, and **demonstrate a new
  assertion red before you trust it green.** Perturb the thing it watches, not
  just the expectation, where you can: WORK-124's red came from changing a
  plan's frequency, which moved three real totals.
- **Decide the commit boundary before editing.** Splitting several changes to
  one file afterwards means reverting each group, committing, and re-applying —
  about a dozen extra edits. Round 7 paid this twice.
- **Open the thing you claim you changed.** Round 6 shipped five items that
  were not on disk as recorded; round 7's reviewers confirmed all of them by
  opening the files, including the PNGs as images, and that class did not
  recur.

---

## Conventions in force

The architect's, not suggestions:

- **A visibility assertion is not a function assertion.** A probe may not be
  described as guarding a behaviour unless it exercises that behaviour or
  asserts a property that provably implies it.
- **Text is painted from a token, on a ground expressible as a token.** No
  `rgba()` literal fill, no `opacity` on a text-bearing element, no `filter`,
  no `mix-blend-mode` over text — the predicate cannot measure any of them.
  `.hero-kpi` and `.chip.off` are the worked examples.
- **Comments state derivations, never bare results.** Inputs and an operator
  survive an edit; a figure does not. Seven instances in three rounds, several
  arriving inside the fix for the last one. If a figure depends on which
  container something is in, say which container.
- **A derived claim is measured BEFORE it gates, not as a condition of leaving
  one.** A finding whose evidence is stated as computed or reasoned from a
  declared model rather than observed is a *candidate*: it may be approved as
  work, it may not be a gate item. The measurement that settles it is its own
  step, scheduled first. Where no instrument can take that measurement, it
  cannot gate at all — it becomes a risk with a trigger.

  This is the third form of one mistake, and the shape keeps moving up a level.
  Round 7: the probe asked a question that could not fail. Round 8: the approval
  named a condition that could not fail. This: the gate admitted a claim before
  the question was asked at all. **The check comes before the commitment, or the
  commitment is a guess wearing a schedule.**
- **`min-width: 0` is a flex-item release in this codebase.** All ten instances
  are flex items, where the automatic minimum genuinely binds. A grid item that
  is a wrapper `<div>` with a percentage-width child does not floor on that
  child's intrinsic width in Blink — measured at six widths. Do not re-derive
  this; run `salary-width.js`.
- **A claim of completeness closes by re-derivation**; an asset commit closes
  by opening the asset.
- **Ruling C5, extended.** A path may reuse `#dataErrorBanner` only if it
  rewrites every claim the element renders *and* is not overwriting a more
  urgent true message — and every flag gating what that element says resets in
  one place, in `load()`.
- **No new top-level statement between `let db = load()` and the `#importFile`
  listener** without asking what a throw there costs. Making `load()` total
  removed the one known reachable throw; it did not remove the ~2,650
  statements in that span.
- **A measurement is only as honest as the instrument's self-report.** Added
  after WORK-130. Eight rows of pixel figures in the `.cal-grid` comment were
  honestly measured and uniformly wrong, because the harness frame reserved a
  15px desktop scrollbar and every row described a viewport 15px narrower than
  the one it named. Nothing in the numbers looked off — the error was uniform,
  which is exactly what made it survive review. The runner now suppresses the
  gutter and **fails** if a width-mode probe does not report the width it was
  asked for. When you record a measurement, name the command and its flags:
  that is the only part a later reader can re-run.
- **The disabled-control exemption has one exception, and it is measured.**
  Inactive controls are exempt from the text-contrast rule — except where the
  disabled control is the sole carrier of the text explaining *why* it is
  disabled. `button:disabled { opacity: .5 }` composites text and ground
  together toward the backdrop, so the pair falls to **2.11:1 (sepia) through
  3.88:1 (nord)** in all sixteen themes, and no predicate can see it. Put the
  explanation in a sibling helper line. `#converterUse` is the live example of
  getting it wrong; the Display Currency card is the worked example of getting
  it right.
- **C37 — an approval that names an assertion must also name the perturbation
  that turns it red, and that perturbation must change the APPLICATION, not the
  expectation.** This is round 9's real lesson and it was the architect's own
  mistake to record. Round 8 established that an acceptance condition must be
  able to fail on its symptom; four items later, in the same document, it
  approved an assertion comparing `localStorage` bytes across a function that
  never writes to `localStorage` — green by construction. Writing the rule down
  did not prevent the rule being broken by its author. Being made to fill in
  *"demonstrated red by …"* would have, because there was no sentence that
  could have gone there. **A rule that can be satisfied by intention is a
  sentence, not a guard. Give it a blank that has to be filled in.**
- **C34 — a trigger stated as a measurement is discharged only by a
  measurement, and it must name an instrument that exists here.** A structural
  argument may re-scope or sharpen a trigger; it may not fire it. And a trigger
  whose conditions this project cannot produce is an indefinite hold wearing a
  schedule — which is what WORK-16/49's was until round 9 restated it.
- **C35 — a suppression guard's predicate is the render's own predicate.** Both
  predicates proposed for the zero reading were reasonable and both were wrong,
  in opposite directions, because neither was derived from `fmtCurrency`'s
  `Math.round`. Each was tried in the application and each failed on the case
  that disqualified it. A threshold on a financial display is derived or it is
  a guess.
- **C36 — one fact per user-facing claim, from the source the app can defend.**
  If a judgement is computed from our own timestamp, our own timestamp is what
  gets displayed. Do not compute from one fact and print another beside it as
  evidence.
- **C38 — a stock and a flow do not share a card.** Income and expenses are
  flows: they belong to a period and the date filter governs them. An
  outstanding balance is a stock: it is true as of now and a date filter makes
  it a lie. This is why the Debts screen has no period selector and why its
  figures never join a Dashboard total.
- **C39 — a collection that must never reach a total gets its own array.** Not
  a flag on an existing one. Every total in this app is an unconditional
  reduce, so a flag makes correctness depend on remembering a filter at every
  future call site; a separate array makes the wrong answer unwritable.
- **C40 — the red-then-green demonstration is an artifact, not a claim.** The
  commit message states the perturbation, both exit codes, and
  `git diff --name-only` printing exactly `expense-pwa/index.html` — proving
  the red came from touching the app rather than the instrument. **C40(b): an
  instrument repair is demonstrated against BOTH the old and the new
  instrument.** Round 13's whole finding is the pair `verify=0` (old) against
  `verify=1` (new) on one identical backtick. Only the new instrument's exit
  code is not evidence of anything.
- **C41 — an assertion may not rebuild the value it guards.** Round 11's import
  check re-implemented the replacement object inside the probe and then
  compared it to itself; it would have passed against an app that had no import
  at all. If the probe contains a copy of the logic, extract the real one and
  call it.
- **C42 — coverage that can narrow must narrow loudly, and an uncompared
  measurement is labelled diagnostic.** A screen that silently drops out of a
  set proves less each round while reporting the same green. Hence
  `ALLOW_UNSTABLE = []` and a throw that names the screen that left. And a
  number nothing compares against is a diagnostic, not an assertion — say so in
  the output, or the next reader takes it for a guard.
- **A derived pixel figure has now been wrong four times.** The latest: round
  9's UI review derived 110px for a width that measures 122px, having
  subtracted the flex gap twice. The method was sound; the arithmetic was not.
  Measure with a width-mode probe and let it report `viewport_clientWidth`.
- **An assertion that goes red on correct code is a defect in the assertion.**
  WORK-143's fourth check first counted every `.conv-reading` in the document
  and failed at two — but the two live on different cards on different screens,
  which is the design. It was the check overstating the invariant, not the app
  breaking it. Fixed to count per card, and the episode is recorded in the
  probe itself, because a check that fails on correct code is the kind the next
  person deletes rather than repairs.

---

## The one thing to carry forward

For four rounds the real defect was that assertions of completeness were wrong:
six delete paths that were seven, sixteen themes measured in a comment and
never measured, "three places got this wrong" when there were four.

The fix was to move each claim somewhere a machine re-derives it. Round 6 then
found the machine could not say no — `npm run v1` returned 0 whether the
application worked or not — and fixed that.

**Round 7's lesson is the next one along: the machine could say no, and it was
asking the wrong question.** `boot-crash.js` watched a broken recovery route
and reported it green, because it asked whether a button was visible rather
than whether it did anything. A guard is not a guard because it exists. It is a
guard because of the question it asks.

So the rule now has three parts. Move the claim somewhere a machine re-derives
it. Prove the machine can say no. And **make every assertion name the behaviour
it guarantees, in words, in its own header — if it cannot, it is not guarding
anything.** Every probe in this repository was written to close a specific
hole, and each one is now the most likely place the next hole hides.
