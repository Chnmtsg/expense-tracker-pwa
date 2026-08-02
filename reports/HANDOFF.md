# Handoff — state of the work

Written at the end of the session that implemented rounds 4 and 5. Read
`reports/chief-architect.md` first: it is the standing decision and it outranks
this file. This one covers what that report does not — where the work stopped,
how to run the checks, and the mistakes that cost the most time.

---

## Where things stand

Five review rounds have run. Rounds 4 and 5 are **fully implemented**; gates R3,
R4 and R5 are closed. `git log` from `5654215` forward is the whole history, one
commit per approved item or batch, each message carrying its own evidence.

Round 5 found **no Critical and no High** — the first time in five rounds.

The build is releasable. Everything still open was deferred by the architect
with an explicit trigger, not left undone:

| Deferred | Trigger that reopens it |
|---|---|
| WORK-85 + WORK-35 | any behavioural change to either reorder path (extraction first), or a real keyboard/switch user blocked |
| WORK-16 / WORK-49 | a measured render >100ms on a mid-range device on Dashboard or Analytics, **or** a real store >5,000 actual records |
| WORK-15 (Cloud Sync) | precondition: never ship with Firebase configured until WORK-15 and the escaping work have both landed |
| WORK-17 IndexedDB half | a real blob approaching 2 MB |
| WORK-23 screen half | the modal half landing and users still reporting disorientation on Back |
| Stage 2 (test harness) | the first *calculation* defect a unit test would have caught. Came closest in round 5 (CODE-05); still unfired |

Rejected with no trigger — these return only on an observed user harm, not a
reviewer's projection: WORK-58/88 (auto dark theme), the `.btn-block` refactor,
deleting `fbApp`, and both mechanical sweeps (72 font sizes, 69 spacings).

---

## How to check your work

```
npm run verify     # all four static predicates, must exit 0
npm run v1         # the four write flows in headless Chrome
```

`verify` runs `lint` → `check:escaping` → `check:contrast` → `check:saves`.
Each exists because someone asserted a class was closed and was wrong. **The
tool count is frozen at four** by architect ruling — new assertions go *inside*
an existing tool.

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

---

## Mistakes worth not repeating

Every one of these produced a false pass or a false failure in this project.

**Instrument faults — the expensive category.** More findings in rounds 4 and 5
came from a broken probe than from broken code, and a broken probe that
*passes* is the dangerous shape.

- `--window-size` is ignored by headless Chrome. I once reported a "three-width
  sweep" that measured the same viewport three times. Host the page in a sized
  iframe and have the probe report its own `innerWidth`.
- CSS transitions never settle under `--virtual-time-budget`. Reading a painted
  colour without disabling them compares one stale value against three
  backgrounds — it reported three themes as failing that were fine.
- `requestAnimationFrame` is starved. Drive animations with a stubbed frame
  clock; never wait on them.
- **A count of zero is not a pass.** A calendar assertion matched zero cells and
  read as green; the fixture had no data in the month the calendar draws.
- `var name = el` in a probe silently coerces to a string (`window.name` is a
  DOMString). Same trap: `top`, `length`, `status`.
- Query inside the active screen. `querySelector('.convert-btn')` returns the
  first in the *document*, which was on a hidden screen and measured 0px.

**Windows/PowerShell.**

- `index.html` is LF. PowerShell `.Replace()` with `\r\n` silently matches
  nothing — it defeated three scripted edits in one change. Use the Edit tool
  for multi-line changes, or match `\n`.
- `$` in a `(?m)^...$` regex does not match before `\r\n`. Mixed endings make
  regex edits partially apply.
- Use absolute paths; the working directory persists between calls and drifts.
- Commit messages via `git commit -F <file>`, written with the Write tool —
  `Set-Content`/`Out-File -Encoding utf8` adds a BOM into the subject line.
- The local test server dies periodically; restart it before blaming a probe.

**Process.**

- Land tooling *before* the fix it will verify. A check installed afterwards
  proves nothing about the work. This is the order that worked three rounds
  running.
- Commit incrementally. Step 8 of round 4 was applied as seven items and only
  then considered for splitting; hand-reverting interleaved edits was riskier
  than one wide commit, so the architect's "separate commits" instruction was
  missed. Decide the commit boundary before editing, not after.
- When a check flags something safe, fix the code so it is *obviously* safe
  rather than widening the check. A boolean in an attribute was hoisted to a
  local instead of teaching `check-escaping.mjs` to accept comparisons — the
  narrowness is the point.

---

## The one thing to carry forward

For four rounds the real defect was never the code. It was that assertions of
completeness were wrong: six delete paths that were seven, nine escaped
interpolations that were not all of them, sixteen themes measured in a comment
and never measured, "three places got this wrong" when there were four.

The fix was not to count more carefully. It was to move each claim somewhere a
machine re-derives it. `check-saves.mjs` found the seventh delete path on its
first run without anyone counting; `check-contrast.mjs` turned an unverifiable
comment into 512 measurements and caught its own author's error while doing it.

That work is done, and it has a live consequence: **the tools' own headers and
`VERIFICATION.md` are claims too.** Round 5 found `check-saves.mjs` carrying a
header broader than its regex, and `VERIFICATION.md` §6 describing the state
before the batch that closed the previous gate. Both were corrected. `verify`
is the answer to "is this still true" — run it rather than reading a comment
that says it is.
