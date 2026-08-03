# Handoff — state of the work

Written at the end of the session that ran review round 6 and implemented it.
Read `reports/chief-architect.md` first: it is the standing decision and it
outranks this file. This one covers what that report does not — where the work
stopped, how to run the checks, and the mistakes that cost the most time.

---

## Where things stand

Six review rounds have run. Rounds 4, 5 and 6 are **fully implemented**.

**Round 6's work is on the `round-6` branch and has not been merged to `main`.**
Nineteen commits, one per approved item, each message carrying its own evidence
and its own red-then-green demonstration where one applies.

Rounds 5 and 6 each found **no Critical and no High** — the first two rounds in
the project's history to do so.

### Gate R5 was reopened, and then closed properly

Round 5 recorded gate R5 as closed. Round 6 established that it never was. Its
stated condition named *"a deliberately corrupted store followed by a thrown
runtime error"*, and nothing had ever performed that walk — `run.mjs` exited 0
whether or not the probe threw, so no command could have reported it either.
The code item had landed and was correct; the evidence did not exist.

That is now fixed (WORK-98) and the gate closed on a demonstration rather than
a commit: revert the guard, `npm run v1` goes red; restore it, green.

**The build is releasable.** Everything still open was deferred by the architect
with an explicit trigger, not left undone:

| Deferred | Trigger that reopens it |
|---|---|
| WORK-97(b) — calendar cell geometry | a decision, not a discovery: accept the sub-390px track overlap and record why, or spend the rest of the card's inset. See the measured table in the `.cal-grid` comment |
| WORK-85 + WORK-35 | any behavioural change to either reorder path (extraction first), or a real keyboard/switch user blocked |
| WORK-16 / WORK-49 | a measured render >100ms on a mid-range device on Dashboard or Analytics, **or** a real store >5,000 actual records |
| WORK-15 (Cloud Sync) | precondition: never ship with Firebase configured until WORK-15 and the escaping work have both landed |
| WORK-17 IndexedDB half | a real blob approaching 2 MB |
| WORK-23 screen half | the modal half landing and users still reporting disorientation on Back |
| Stage 2 (test harness) | the first *calculation* defect a unit test would have caught. Round 6 checked `calcSalary`, `stepDate`, `computeRange` and `plannedOccurrences` and found none — still unfired, fifth round running |

Rejected with no trigger — these return only on an observed user harm, not a
reviewer's projection: WORK-58/88 (auto dark theme), the `.btn-block` refactor,
deleting `fbApp`, and both mechanical sweeps (72 font sizes, 69 spacings).
**WORK-104 moved `.helper` off the 11px floor and did NOT reopen the sweep** —
11px is *on* the scale, so it was never a member of that set.

Shapes rejected inside approved items, worth not re-proposing: the `z-index`
route for the hero highlight (measured below AA), flagging salary fields on
`input` rather than Save (toasts mid-keystroke), and a deny-list in
`check-escaping.mjs` (one live site, already safe).

---

## How to check your work

```
npm run verify     # the four static predicates, must exit 0
npm run v1         # write flows + the corrupt-boot walk, in headless Chrome
node tools/harness/run.mjs tools/harness/boot-crash.js
```

`verify` runs `lint` → `check:escaping` → `check:contrast` → `check:saves`.
Each exists because someone asserted a class was closed and was wrong.

**The ceiling is four plus one**: four static predicates behind `verify`, plus
one render harness in `tools/harness/`. New assertions go *inside* one of those
five. There is no sixth executable.

**`npm run v1` can now fail, and could not before.** It exits non-zero on a
thrown flow, on an unexpected console error, and on a payload that will not
parse. "Unexpected" excludes the deliberate quota injection and the corrupt-boot
walk, which raise errors on purpose — a blanket count would go red on a clean
build, and an assertion that cries wolf gets deleted by the next person to run
it. If you add a deliberate failure to a probe, put it inside the
`expectingFailure` window or you will break this.

`tools/harness/run.mjs` renders a probe against the app and prints what it
measured:

```
node tools/harness/run.mjs <probe.js> [--width 390] [--fixture] [--no-transitions]
```

`--fixture` injects `tools/harness/fixture.js`, which gives you `loadFixture()`
and `RANGES` — the five-plan dataset from `expense-pwa/VERIFICATION.md` whose
expected totals are **290,000 / 360,000 / 260,000 / 50,000** for ranges A–D.
Run that after any change to recurrence, filtering or the dashboard.

Set `CHROME_PATH` if Chrome is not at the default Windows location.

Note what this file does **not** say: how many pairs `check-contrast.mjs`
measures, how many `save()` sites are allow-listed, how many themes exist. Those
are the tools' numbers and the tools print them. A document that restates them
goes stale, and this project has now proved that three times.

---

## Mistakes worth not repeating

Every one of these produced a false pass or a false failure in this project.

**Instrument faults — the expensive category.** More findings in rounds 4–6
came from a broken probe than from broken code, and a broken probe that
*passes* is the dangerous shape.

- `--window-size` is ignored by headless Chrome for layout. Host the page in a
  sized iframe and have the probe report its own `innerWidth`.
- The same trap bites **screenshots**: a plain `--screenshot` of `index.html`
  renders at desktop width and silently crops the right-hand side — which is
  exactly where the thing you are checking usually is. Host it in an iframe of
  the target width, set the window a little *wider* than the iframe, and use
  `--force-device-scale-factor=1`.
- CSS transitions never settle under `--virtual-time-budget`. Reading a painted
  colour without disabling them compares one stale value against three
  backgrounds.
- `requestAnimationFrame` is starved. Drive animations with a stubbed frame
  clock; never wait on them.
- **A count of zero is not a pass**, and neither is a selector that found the
  wrong thing. Round 6 lost four runs to this: `#analytics` (the screen id is
  `daily`), `qaRowIncome` (it is `qaRowInc`), the first `.grid-2` on a screen
  that has several, and `.kpi .value` tiles that are not all inside the grid
  under test. **Assert your setup found what you expected before measuring it** —
  every probe here now throws a `setup failed:` error rather than measuring air.
- A top-level `let` is **not** a property of `window`. Reading
  `frame.contentWindow.db` returns `undefined` no matter what `db` holds, so an
  assertion built on it is always false and looks like a real failure.
- `var name = el` in a probe silently coerces to a string (`window.name` is a
  DOMString). Same trap: `top`, `length`, `status`.
- When poisoning the store to test `load()`, the blob must have a **truthy
  `.length`** to reach the throwing path — `categories: 'abc'` works,
  `categories: {0:'x'}` does not, because `.length` is `undefined` there and
  `load()` quietly falls back to the defaults. Half an hour.

**Windows/PowerShell.**

- `index.html` is LF. PowerShell `.Replace()` with `\r\n` silently matches
  nothing. Use the Edit tool for multi-line changes, or match `\n`.
- `$` in a `(?m)^...$` regex does not match before `\r\n`.
- Use absolute paths; the working directory persists between calls and drifts.
- Commit messages **always** via `git commit -F <file>`, written with the Write
  tool. `Set-Content`/`Out-File -Encoding utf8` adds a BOM into the subject
  line, and a multi-line `-m "..."` is torn apart by the PowerShell parser into
  dozens of `pathspec did not match` errors.
- `Select-String` renders a leading `/*` as `\*`. It is a display artifact, not
  a broken CSS comment — confirm with Read before "fixing" it.

**Process.**

- Land tooling *before* the fix it will verify, and **demonstrate a new
  assertion red before you trust it green.** An assertion only ever seen green
  is itself an unverified claim. Round 6 made this a standing rule.
- **Decide the commit boundary before editing.** Splitting several changes to
  one file into separate commits afterwards means reverting each group,
  committing, and re-applying it — roughly a dozen extra edits. Round 4 skipped
  this and produced one wide commit against instruction; round 6 paid the cost
  instead.
- When a check flags something safe, fix the code so it is *obviously* safe
  rather than widening the check.
- **Open the thing you claim you changed.** Round 6 found five approved round-5
  items not on disk as recorded, three of which were visible in thirty seconds
  to anyone who looked — two blank PNGs, a comment, and a CSS rule never edited.

---

## Conventions that came out of round 6

These are the architect's, not suggestions:

- **Comments state derivations, never results.** Inputs and an operator survive
  an edit; a bare figure does not. Five instances of a false number in two
  rounds, each arriving inside the fix for the last one.
- **An approval condition naming an artifact state closes by re-deriving the
  artifact.** An asset commit closes by opening the asset.
- **An unmeasurable fill may not paint over text.** A fill written as an
  `rgba()` literal cannot be expressed as a pair-table row, so the contrast
  mechanism is blind to it by construction — it moves beneath the measured
  stack or it is deleted. `.hero-kpi` carries the worked example.
- **Ruling C5, extended.** A path may reuse `#dataErrorBanner` only if it
  rewrites every claim the element renders *and* is not overwriting a more
  urgent true message — and every flag gating what that element says resets in
  one place, in `load()`.

---

## The one thing to carry forward

For four rounds the real defect was never the code. It was that assertions of
completeness were wrong: six delete paths that were seven, nine escaped
interpolations that were not all of them, sixteen themes measured in a comment
and never measured, "three places got this wrong" when there were four.

The fix was to move each claim somewhere a machine re-derives it, and the
static half of that is genuinely done. `check-saves.mjs` found the seventh
delete path on its first run without anyone counting.

**Round 6's lesson is that only half of it was done.** The runtime half was
never checked at all: `npm run v1` returned 0 whether the application worked or
not, and five approved items were recorded as landed when they had not been.
The green line was a person reading JSON.

So the rule now has two parts. Move the claim somewhere a machine re-derives
it — and then **prove the machine can say no**. `verify`, `v1` and
`boot-crash.js` are the answer to "is this still true". Run them rather than
reading a comment that says it is, and when you add to them, break the thing
they watch and watch them fail first.
