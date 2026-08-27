# Chief Architect Ruling — Round 15, Core Tab Screen Redesign (`redesign-core-screens`)

*(Archival note, added by the review orchestrator and not part of the Chief Architect's decision. The review workflow overwrites this filename on every run, so **the Round 14 supplemental — which was itself the top of the standing record carrying the round-9 standing decision and the Round 11, 12, 13 and 14 supplementals — is preserved verbatim at `reports/archive-chief-architect-round14.md`, and ALL OF THOSE REMAIN IN FORCE.** The Round 14 UI, Code and Engineering Manager reports are archived alongside it under the same `-round14` suffix. This round's scope was the four core tab screens only; the ruling below adds to that record and replaces none of it. Nothing in this document should be read as reopening a prior decision it does not name.)*

Inputs read in full and unmodified:
- `D:\3_Claude\PowerApps\reports\ui-review.md` — 15 findings, 84/100
- `D:\3_Claude\PowerApps\reports\code-review.md` — 9 findings, 88/100
- `D:\3_Claude\PowerApps\reports\engineering-manager.md` — `WORK-01`…`WORK-18`, conflicts C1 and C2

Measured against `D:\3_Claude\PowerApps\knowledge\project.md`, `D:\3_Claude\PowerApps\knowledge\coding-standards.md`, `D:\3_Claude\PowerApps\knowledge\ui-guidelines.md`, `D:\3_Claude\PowerApps\knowledge\review-conventions.md`.

---

## Executive Report

**Is the application fit for release: yes. Is this branch fit to merge today: no.**

Two independent reviews found zero Critical and zero High findings across 24 items, the money path, store, migrations and offline path are untouched, the harness is green at all four commits and contrast holds at 480 pairs with a worst case of 4.52:1. Nothing here threatens financial correctness, and on severity alone this branch could ship. It does not merge today for a different reason: five of the six Mediums sit on the home screen of a personal finance app, they were authored by these four commits, and the entire Medium set is between one and one and a half days of XS and S work. Fixing them on the branch keeps the branch's own review true; merging first and carrying them as follow-ups puts a review into `main` that no longer describes the code, which is the same decay failure both reviewers independently reported in the comments. The architecture itself is sound and I am approving no structural change to it — the consolidation, the amount-first form order and the `<details>` disclosure all stay exactly as built.

The state of the branch is therefore: correct, incomplete, and one short sprint from mergeable. Seventeen of the eighteen `WORK-` items are approved (one at reduced scope), one is deferred on evidence, and one half-item is rejected. No item in this cycle is M, L or XL, and I am approving no rewrite, no framework, no build step and no new abstraction.

---

## Conflict Rulings

### C1 — Priority band and scope of the required-field gap (`UI-13` vs `CODE-01`, gates `WORK-06`)

**Ruling: P2, Sprint 1, at the four-field scope.**

Both filed severities stand as filed; I am not touching either, and neither reviewer is overruled. The band question is decided on cost and on what the file itself asserts. `index.html:2198-2211` states an unqualified "if and only if" test, and `CODE-01` traces four fields that satisfy it — `#incAmount`/`#incType` via the early returns at 5893 and 5895, `#expAmount`/`#expCategory` via 6352 and 6353. A rule the file states about itself and does not keep is not polish; it is the written record being wrong on the two highest-traffic write paths in the application. The whole fix is four attributes and four spans with no handler change. Deferring an XS item one sprint to protect a band is not a saving, it is bookkeeping. The four-field superset stands, because implementing two would silently discard half of a finding.

**Condition on `WORK-06`:** the convention block at 2198-2211 enumerates a tally ("the six add-form fields and the five in the two edit modals"). Landing four new marks makes that sentence false. It is corrected in the same commit, or `WORK-06` manufactures exactly the stale-claim defect `WORK-07` exists to clean up. I record this as a risk arising from approved work, not as a new finding.

### C2 — Which divider mechanism the consolidated cards share (`UI-07` vs `CODE-06`, gates `WORK-12` and `WORK-13`)

**Ruling: `UI-07`'s inset form wins. `.stat-strip` converges onto `.kpi-strip` — padding on the card, divider on the row.**

Two treatments of one pattern were introduced by one change on the two screens the pattern was introduced for. That is the defect, and consistency is the thing being bought. The inset form also drops a dependency on `overflow: hidden` for corner clipping, and it uses a border to draw a border, which is the mechanism the next reader will expect. `CODE-06`'s `gap: 1px` with a border-coloured strip background is a good trick and it buys immunity to a fifth stat tile — a tile nobody has proposed and which appears on no roadmap. That is designing for a requirement that does not exist, and it would leave `UI-07`'s inconsistency open permanently, since `.kpi-strip` would keep the inset form regardless.

Consequently **`WORK-13` collapses to `CODE-06`'s own stated minimal fix**: one comment line above the template literal at `renderDailyStats` (7994) naming the coupling to the quadrant rules. The mechanism-replacement alternative inside `CODE-06` is rejected as the losing branch of this ruling. The finding is not dismissed — the risk it names is real and is closed by making the coupling visible at the place a fifth tile would be added, which is the cheapest thing that removes it.

**Acceptance for `WORK-12`:** at 320, 360 and 390px the four stat tiles show the same divider inset as the KPI card, and `overflow: hidden` is no longer required to clip the corners.

---

## Standing Rulings on the Escalated Questions

### Merge timing

**`redesign-core-screens` does not merge to `main` until Sprint 1 has landed on it.** The EM's recommendation 1 is upheld. Sprint 1 commits go onto the branch, the full harness (`verify`, `v1`, `boot`, `recurrence`, `debts`, `pva`, `rows`) and the contrast run are re-run on the branch head, and the branch then merges as one unit. Sprint 2 and Sprint 3 are post-merge work on `main`.

### `sw.js` cache key

**No further bump.** The branch is already at v15 and `CODE-09` establishes that nobody can determine from the repository whether v15 has been published. Bumping again inside one unpublished branch is precisely the over-bump the rule at `sw.js:1-8` warns against. v15 carries Sprint 1 and Sprint 2. The next deploy records v15 and its date per `WORK-18`; only a deploy after that recorded one justifies v16.

### EM recommendation 4 — the "claims that decay" standing rule

**Approved.** Both reviewers hit this independently, from different directions, in the same cycle: `CODE-05(a,b,c)`, `CODE-08`, and the comment halves of `UI-09` and `UI-12`. Four claims went stale in one change. This file's comments are its design record, there is no mechanism keeping them true, and re-discovering the same pattern every cycle is the most expensive way to hold a rule. It costs a few lines in a knowledge file. Tracked as **`ARCH-01`** — a standing rule, not a finding, and not attributable to any reviewer.

It is added to `D:\3_Claude\PowerApps\knowledge\coding-standards.md` as a new section, in the file's existing voice:

```
## Comments

Comments in this project are the design record. Keep them true.

State the rule, not the tally.

Never write "the only", "all", or a count, unless something enforces it.

Reference code by function, selector or id — never by line number.

A cross-file reference is a name, not a coordinate.

When you open a block, re-read the comment above it before you commit.
```

That is the whole of it. **No tooling.** Nobody proposed a checker and I am not approving one: a lint rule for prose would cost more than the four claims it would have caught, and this rule earns its place precisely because it is cheap.

### `WORK-09` — the item that cannot be closed by reading

**Deferred, evidence-gated, with a trigger. It is not sprint work and it does not enter a sprint until the evidence exists.**

The doctrine, stated once so it applies beyond this item: an item that cannot be resolved by reading is not a code item, it is an evidence item. It gets an owner, a trigger, and a written observation. It never carries an effort estimate and it never blocks a merge.

Specifically: someone opens the app on a physical iPhone in iOS Safari at 390px and looks at the range-preset pill on all four core screens. The observation — device, iOS version, date, and whether a disclosure indicator is drawn — is recorded in `D:\3_Claude\PowerApps\reports\HANDOFF.md`. If an indicator is drawn, `WORK-09` closes as verified with no work. If none is drawn, `WORK-09` re-enters as scoped work at whatever severity `UI-12`'s author sets, implemented as `appearance: none` plus an explicit chevron while keeping the native `<select>` element.

I explicitly **reject implementing the chevron speculatively.** That would replace native platform select chrome on every platform to remove an unmeasured risk on one, which is a wider blast radius than the risk itself. Note also that the deferral costs nothing that can be paid today: the comment-accuracy half of `UI-12` ("shrinks to its own text", which `CODE-05c` independently traces) is not blocked on any device and ships inside `WORK-07` in Sprint 1.

---

## Approved Improvements

| Item ID | Title | Reason for approval |
|---|---|---|
| ARCH-01 | Write the "claims decay" rule into `knowledge/coding-standards.md` | Two reviewers found the same failure mode independently; a few lines of prose stop it being re-found every cycle. |
| WORK-01 | Restore a heading per Dashboard chart pane and settle the trend range label | The home screen has no heading below `<h1>` and two of three charts render untitled. `ui-guidelines.md` requires clear hierarchy; `project.md` requires comprehension without training. `CODE-02` is the same title line, so one commit. |
| WORK-02 | Reword the middle chart tab once | One label edit closes a vocabulary collision across three adjacent screens and a wrap at 320px. Same string, one decision. |
| WORK-03 | Drop the bold weight from the lead Amount placeholder | One declaration stops the most-used field in a finance app reading as pre-filled. Highest user value per byte in the cycle. |
| WORK-04 | Link the segmented controls to the regions they swap | Assistive technology gets no signal that the region changed. Mechanical attributes, no behaviour change. |
| WORK-05 | Stop the donut legend overflowing below ~430px | Direct violation of a stated `ui-guidelines.md` rule ("No horizontal scrolling") on the home screen, at the phone widths this app targets. One declaration. |
| WORK-06 | Mark the four required add-form fields | Per C1. The file states an "if and only if" test it does not keep, on its two highest-traffic write paths. |
| WORK-07 | Make the written record match the code | Four false claims and one stale citation must not enter `main` and be read as settled. First application of ARCH-01. |
| WORK-08 | Shared `<symbol>` defs for the repeating glyphs — `CODE-07` scope only | This change created this duplication by trading a shared font for per-site copies; one copy sits inside a template literal where search alone cannot reach it. Cleaning up debt your own change made is not speculation. |
| WORK-10 | Extract `selectSegment()` and retire the four copies | The duplicated half is an accessibility invariant (`aria-pressed`) that four places must remember; this change added the fourth. A refactor, not a rewrite. |
| WORK-11 | Delete the dead CSS and bring `.cal-nav` onto the token scale | Deletion is the cheapest risk removal there is. Both findings touch line 1985, so it is one block and one edit. The token half is the file's own stated "replaced as their blocks are next opened" convention, failing at the exact moment it binds. |
| WORK-12 | One "one card, divided" treatment, on the inset form | Per C2. One pattern, one mechanism, introduced by one change. |
| WORK-13 | Name the `.stat-tile` divider coupling at the renderer — comment only | Per C2. Puts the warning where a fifth tile would be added, at one line, without designing for a tile nobody has asked for. |
| WORK-14 | Non-colour cue and accessible name on the advisor severity badge | Hue-only signalling; the rendered text is the same digit in all three states. XS, and severity a user cannot read is severity the app did not communicate. |
| WORK-15 | Move `.more-fields` above `#expRecWrap` | The disclosure sits ~200px from the form it extends. One block move on a write form. |
| WORK-16 | Persist the selected Dashboard chart pane across relaunch | An offline-first app is relaunched constantly; resetting the home view every launch is a cost paid repeatedly. Rides existing persistence — no new mechanism. |
| WORK-17 | Add the three KPI icon-tint pairs to `check-contrast.mjs` | `check-contrast.mjs:49` states that entries are added by the work that establishes them. This work established three tinted grounds and added none. A seventeenth theme would inherit an unmeasured pair. |
| WORK-18 | Record the deployed cache string and date in `HANDOFF.md` at deploy | The offline story rests on this cache key, and today "has this string been published" is unanswerable. One line at deploy makes an existing rule checkable. |

Conditions attached to approved work:

- **WORK-06** — the tally at 2198-2211 is corrected in the same commit (see C1).
- **WORK-05** — measure at 320, 360 and 390px before and after; `UI-05`'s arithmetic is derived from declared values, not observed.
- **WORK-04** — the stated scope only. Do **not** escalate to a full `tablist`/`tab`/`tabpanel` conversion; that changes keyboard behaviour for no added user benefit and both `UI-04` and I rule it out.
- **WORK-15** — re-run `v1` and `rows`; this reorders DOM on a live write form.
- **WORK-16** — persist through the mechanism `applyPreset` already uses. No new storage key, no migration. A missing or unrecognised value falls back to the current default pane.
- **WORK-17** — if any file or report states the contrast pair count, it moves in the same commit. ARCH-01 applies to the tooling too.
- **WORK-08** — applied only to the glyphs enumerated in `CODE-07` that actually repeat. If implementation finds itself touching the tab bar or the More sheet, stop and re-scope; that is the file-wide sweep the project forbids.

---

## Rejected Improvements

| Item ID | Title | Reason for rejection |
|---|---|---|
| WORK-08 (`UI-09` conversion half) | Convert the two highest-traffic remaining emoji sets to SVG | `UI-09` offers an explicit either/or: narrow the comment, **or** take two scoped sets. `WORK-07` takes the first branch and closes the finding. Once the comment is true, converting more emoji has no stated user cost behind it — it is preference, and it re-opens platform-rendering surface on three screens for nothing. |
| CODE-06 alternative (`gap: 1px` divider mechanism) | Count-agnostic stat dividers | Per C2. Premature generalisation for a fifth tile that exists on no roadmap, at the price of leaving `UI-07`'s inconsistency permanently open. |
| A checker for ARCH-01 | Tooling to enforce comment claims | Nobody asked for it and it would cost more than the four claims it would catch. The rule stays written prose. |

---

## Deferred

| Item ID | Title | What would change the decision |
|---|---|---|
| WORK-09 | Verify the range-preset select's affordance on iOS Safari | A five-minute look at a physical iPhone at 390px, recorded in `D:\3_Claude\PowerApps\reports\HANDOFF.md` with device, iOS version and date. No indicator drawn re-opens it as scoped work; an indicator drawn closes it as verified. Nothing else settles it, and no amount of reading will. |

---

## Implementation Priority

### Sprint 1 — on `redesign-core-screens`, before the merge

| Order | Item | Why here |
|---|---|---|
| 0 | ARCH-01 | Its own commit on `main`, independent of the branch. It goes first because `WORK-07` is its first application; writing the rule after the fix means the fix is written from memory. |
| 1 | WORK-03 | Isolated one-liner, no dependency, highest user value per byte. Cheap early harness run. |
| 2 | WORK-05 | Isolated one-liner closing a stated `ui-guidelines.md` violation. Same reason. |
| 3 | WORK-01 | The heading chain starts here; it fixes the pane names `WORK-02` must know. `CODE-02`'s parentheses drop in the same commit — restoring the heading without it leaves a bracketed orphan. |
| 4 | WORK-02 | Depends on 3. One reword, decided once, satisfying `UI-02` and `UI-08`. |
| 5 | WORK-04 | Same markup region as 3 and 4; batching keeps the touched surface in one review. Must precede `WORK-10` so the helper encodes the final invariant, not an intermediate one. |
| 6 | WORK-06 | Independent of everything above; four attributes, four spans, plus the tally correction. |
| 7 | WORK-07 | **Last commit on the branch.** This is a correction to my ordering of the EM's plan, and it matters: `WORK-07` writes the design record, and if it runs before items 1-6 it describes a state that six commits then invalidate. The record is written once, describing what actually shipped. |

Then: full harness (`verify`, `v1`, `boot`, `recurrence`, `debts`, `pva`, `rows`) plus the contrast run on the branch head, then merge to `main`. No `sw.js` bump.

### Sprint 2 — on `main`, after the merge

`WORK-11` → `WORK-12` → `WORK-13` → `WORK-10` → `WORK-15` → `WORK-16`.

Deletions before edits: `WORK-11` removes four dead blocks so `WORK-12` reasons about less stylesheet. `WORK-12` and `WORK-13` are the C2-gated pair and land adjacently so the comment is written against the mechanism that shipped. `WORK-10` follows, now that `WORK-04` has landed and the invariant is final. `WORK-15` and `WORK-16` are independent and go last because each needs its own harness re-run.

### Sprint 3 — on `main`

`WORK-17` → `WORK-14` → `WORK-08`.

`WORK-17` first: it extends the instrument, and an instrument extended early protects everything after it. `WORK-14` next, XS and self-contained. `WORK-08` last — it is the largest remaining item, the least urgent, and the one most likely to want re-scoping when it is opened.

### Unscheduled

- **`WORK-09`** — evidence check, any time, by anyone with an iPhone. Not sprint work.
- **`WORK-18`** — bound to the next deploy event, not to a sprint.

Total approved code effort remains what the EM estimated: roughly three and a half to four days across three sprints, no item above S.

---

## Architecture Strategy — next quarter

**What stays, and is not up for discussion.** The single-file `expense-pwa/index.html` application. No build step, no framework, no bundler, no component abstraction for four cards. Offline-first and mobile-first, with the service worker cache key remaining a hand-maintained fact. Comments as the design record — now with ARCH-01 keeping them honest. The redesign's own decisions: the card consolidation, the amount-first form order, the `<details>` disclosure, and the chart-tab handler's refusal to re-render. All three reviews found these correct and I am not reopening them.

**What changes.** Duplication is removed only where the duplicate encodes an invariant that can silently drift — `aria-pressed` across four segmented controls (`WORK-10`), and icon path data across six sites (`WORK-08`). Deduplication for tidiness is not a goal and will be rejected. One divider mechanism for consolidated cards, inset, documented once. Every claim in a comment states a rule rather than a count, and every cross-file reference names a function rather than a line.

**What is off limits.** A rewrite of the Dashboard render path. Lazy pane rendering — `perf.js` at 5,000 records is the tripwire, and only a measured breach reopens it; `CODE-07`'s own report declines to recommend it and so do I. A file-wide icon sweep. Converting the segmented controls to full ARIA tablist. Any new storage key, schema field or migration in this cycle. And no second `sw.js` bump before a deploy is recorded.

**One structural risk I am recording as a risk, not as a finding** — the code review's future-risk note that every figure the charts show exists only as `innerHTML`. That is the first wall a Reports, Cloud Sync or AI Assistant module hits, all three of which sit in `project.md`'s long-term vision. It is not a defect today and this change did not worsen it. The trigger is explicit: the first time a second consumer needs the same computed series, that computation moves out of the renderer into a pure function returning data. Not one line before that, and never as part of a UI cycle.

---

## Recommended Next Action

Add the ARCH-01 `## Comments` section to `D:\3_Claude\PowerApps\knowledge\coding-standards.md` as a single standalone commit on `main`, then check out `redesign-core-screens` and implement Sprint 1 in the stated order — `WORK-03`, `WORK-05`, `WORK-01` (with `CODE-02`'s parentheses in the same commit), `WORK-02`, `WORK-04`, `WORK-06` at the four-field scope with the 2198-2211 tally corrected in that same commit, and `WORK-07` last so the design record describes what actually shipped — leaving `expense-pwa/sw.js` at v15; then run the full harness and the contrast check on the branch head and merge to `main`.
