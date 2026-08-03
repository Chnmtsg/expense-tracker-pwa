# Handoff — state of the work

Written at the end of the session that ran review round 7 and implemented it.
Read `reports/chief-architect.md` first: it is the standing decision and it
outranks this file. This one covers what that report does not — where the work
stopped, how to run the checks, and the mistakes that cost the most time.

---

## Where things stand

Seven review rounds have run. Rounds 4, 5, 6 and 7 are **fully implemented and
merged to `main`.** One commit per approved item, each message carrying its own
evidence and its own red-then-green demonstration where one applies.

Rounds 5 and 6 found no Critical and no High. **Round 7 found one High**, and
it was damage from round 6: WORK-99 moved the error *reporting* above
`let db = load()` and left the *recovery* below it, so after a boot-time throw
"Restore from file" opened a picker and did nothing. The probe added in the
same round to guard that state asserted the button was **visible** rather than
**functional**, so it passed.

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

```
npm run verify       # the four static predicates, must exit 0
npm run v1           # write flows + the corrupt-boot walk
npm run boot         # a boot-time throw must still reach a working Restore
npm run recurrence   # the five-plan fixture's totals and the 31st clamp
```

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
