// V5 predicate — every write reports its outcome, or says why it does not.
//
// WHY THIS EXISTS
//
// This class has now failed twice in a single round. A sweep of "six delete
// paths" missed a seventh. And the fix applied to one of the six was defeated
// eight lines below itself by an unconditional success toast. Both were found
// by a reviewer reading the file, not by the person who swept it.
//
// The failure mode is counting call sites by hand, so this predicate must not
// require counting. It is an allow-list, not a census:
//
//   A `save()` whose return value nothing consumes is forbidden unless the
//   ENCLOSING FUNCTION is named in ALLOWED below, with a reason.
//
// A new unreported write fails on the first run. That is the only property
// that matters. An eighth delete path cannot appear silently.
//
// Sites are identified by their enclosing scope, never by line number, so
// moving code does not need this file edited. The scope chain is computed by
// brace depth — see buildScopes() — because the two reorder drags save inside
// a local `finish` closure that names nothing a human would allow-list.
//
// This deliberately does NOT require that every save() be followed by
// savedToast(). That would be a rule about outcome messaging disguised as a
// rule about writes, and it would put a toast on a reorder drag. Ruling V5 is
// explicit on the point, and round 5 re-affirmed it: a failed write is already
// reported by the save-error banner writeDb() raises: a toast is a *second*,
// optional message, and omitting one is not the same as failing silently.
//
// This header is itself a claim, and it has been wrong once. It said "a new
// unreported write fails on the first run" above a regex that required a
// trailing semicolon and therefore could not see `if (ok) save()` or
// `forEach(() => save())`. Re-derive it against the code below before trusting
// it.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'expense-pwa', 'index.html');
const lines = readFileSync(file, 'utf8').split('\n');

/* ------------------------------------------------------------------
   THE ALLOW-LIST — maintained by hand, mirrored in VERIFICATION.md.

   `fn` is a substring of the enclosing function or handler, used to identify
   the site independently of its line number. `why` is the reason this write
   does not report an outcome to the user.

   Adding an entry is a deliberate act. If you are adding one because a toast
   felt like too much ceremony, that is the wrong reason.
------------------------------------------------------------------ */
const ALLOWED = [
  {
    fn: 'saveSoon',
    why: 'Coalesced preference write. Not a record; no toast is shown, so there is no false success to report. Failure still raises the banner through writeDb().'
  },
  {
    fn: 'flushPendingSave',
    why: 'The same coalesced preference write, flushed on pagehide. Same reasoning.'
  },
  {
    fn: 'initIncomeTypeReorder',
    why: 'Reorder drag. Failure IS reported - writeDb() raises the save-error banner on every failure path. The omitted toast is a noise judgement about a drag gesture, not a claim that a failed write is silent. Ruled in round 3 (WORK-38 narrowing) and re-affirmed in round 5 (C14).'
  },
  {
    fn: 'initCategoryReorder',
    why: 'Reorder drag. Same reasoning. Category order sets the Analytics palette by array index, so a failed write reverts a visible change - and the save-error banner is what reports it.'
  },
  {
    fn: 'maybeFireOSNotifications',
    why: 'Records lastNotifiedAt after firing an OS notification, to stop it firing twice in a day. Bookkeeping, not a record the user entered; there is no toast, so nothing reports success. Losing it costs one duplicate reminder.'
  }
];

// A discarded save: `save()` whose result nothing reads.
//
// This required a trailing semicolon — `/(^|[;{}\s])save\(\)\s*;/` — and the
// header above claims "a new unreported write fails on the first run. That is
// the only property that matters." It did not hold. Three forms are valid
// JavaScript that discard the return value and carry no semicolon:
//
//     if (ok) save()
//     rows.forEach(() => save())
//     () => save()
//
// None matched, so none was counted as a hit, so none was ever checked against
// the allow-list. A guard narrower than the claim written on it is how a class
// comes back — the same failure as a comment asserting coverage it does not
// have, one level up, inside the tool that exists to stop exactly that.
//
// The test is now what it always should have been: find every call, then ask
// whether anything CONSUMES it. Punctuation after the call says nothing about
// that; the token before it says everything.
const ANY_SAVE = /(^|[^\w$.])save\s*\(\s*\)/g;

// What a consumed call looks like, testing the text immediately BEFORE it:
//   const ok = save()   okSave = save()   return save()
//   a ? save() : b      x || save()       x && save()
//   f(save())           [save()]          `${save()}`
// A trailing `.something` would also consume it, and is checked separately.
//
// `=>` is deliberately NOT here. An arrow body — `forEach(() => save())` — is
// the exact form the old regex missed, and whether its value is consumed
// depends on the caller, which this tool does not analyse. Reporting it is the
// safe direction: a legitimate one goes on the allow-list with a reason, which
// costs a line; a missed one costs the class. My first version of this list
// included `=>` and let two of three planted test forms through.
const CONSUMED_BEFORE = /(?:[=(,[?:]|\breturn\b|\|\||&&|\+|-|!)\s*$/;

// The enclosing scope chain for every line, by brace depth.
//
// Two cheaper approaches were tried and both were wrong in ways that matter:
//
//   1. Nearest name walking backwards. Both reorder drags save inside a local
//      `finish` closure, which names nothing a human would recognise.
//   2. Any name within 400 lines backwards. This credited the category-DELETE
//      handler to initCategoryReorder, which sits above it but does not
//      contain it — a false PASS on the exact defect this file exists to
//      catch. A predicate that can be satisfied by a neighbour is not a
//      predicate.
//
// So: a real scope chain. Strings, template literals, comments and regex
// literals are blanked before counting braces, because this file is full of
// HTML templates containing `{`.
function stripNonCode(line, state) {
  let out = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i], next = line[i + 1];
    if (state.block) {
      if (c === '*' && next === '/') { state.block = false; i++; }
      continue;
    }
    if (state.quote) {
      if (c === '\\') { i++; continue; }
      if (c === state.quote) state.quote = null;
      continue;
    }
    if (c === '/' && next === '*') { state.block = true; i++; continue; }
    if (c === '/' && next === '/') break;
    if (c === '"' || c === "'" || c === '`') { state.quote = c; continue; }
    out += c;
  }
  return out;
}

const NAME_RE = /function\s+([A-Za-z_$][\w$]*)|const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\(|async|function)|getElementById\('([^']+)'\)\.addEventListener|\[data-([\w-]+)\]/;

// Every line with strings, template literals, comments and regex blanked.
// Built once by buildScopes() and reused for the hit scan, because the word
// "save()" appears in this file's own prose and in the app's block comments —
// the first run of the widened predicate reported two comment lines as
// unreported writes, which is the same false-positive shape in reverse.
const CODE_ONLY = [];

function buildScopes() {
  const state = { quote: null, block: false };
  const stack = [];
  const perLine = [];
  let depth = 0;
  for (const raw of lines) {
    const code = stripNonCode(raw, state);
    CODE_ONLY.push(code);
    // The name on this line describes the scope it opens, so record it before
    // the braces on this line are counted.
    const m = raw.match(NAME_RE);
    const pending = m ? (m[1] || m[2] || m[3] || m[4]) : null;
    perLine.push(stack.map((s) => s.name).reverse());
    for (const c of code) {
      if (c === '{') {
        depth++;
        if (pending && !stack.some((s) => s.depth === depth)) {
          stack.push({ name: pending, depth });
        }
      } else if (c === '}') {
        while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
        depth--;
      }
    }
  }
  return perLine;
}

const SCOPES = buildScopes();
function enclosingNames(idx) {
  const names = SCOPES[idx] || [];
  return names.length ? names : ['(top level)'];
}

// `save()` also appears in this tool's own prose and in the app's comments, so
// comments are stripped before matching. Definitions and property accesses
// (`function save()`, `x.save()`) are excluded by ANY_SAVE's own boundary.
const hits = [];
lines.forEach((line, i) => {
  const code = CODE_ONLY[i] || '';
  if (/function\s+save\s*\(/.test(code)) return;

  ANY_SAVE.lastIndex = 0;
  let m;
  while ((m = ANY_SAVE.exec(code))) {
    const before = code.slice(0, m.index + m[1].length);
    const after = code.slice(ANY_SAVE.lastIndex);
    // Consumed by what precedes it (assignment, return, argument, operator)
    // or by what follows it (a method call on the result).
    if (CONSUMED_BEFORE.test(before)) continue;
    if (/^\s*\./.test(after)) continue;
    hits.push({ line: i + 1, names: enclosingNames(i), text: line.trim().slice(0, 78) });
    break;   // one report per line is enough to action it
  }
});

const unlisted = [];
const matched = new Set();
for (const hit of hits) {
  // Nearest enclosing name wins. Scanning ALLOWED first instead would let a
  // site match a farther entry that merely appears earlier in the list — the
  // first version did exactly that, and reported two real entries as stale
  // while their sites were silently credited to a neighbour.
  const name = hit.names.find((n) => ALLOWED.some((a) => a.fn === n));
  if (name) matched.add(name);
  else unlisted.push(hit);
}

for (const hit of unlisted) {
  console.log(`expense-pwa/index.html:${hit.line}  bare save() in ${hit.names[0]}` +
    (hit.names.length > 1 ? ` (inside ${hit.names.slice(1, 3).join(' < ')})` : ''));
  console.log(`    ${hit.text}`);
  console.log('    -> capture the result and report it (savedToast), or add this site to');
  console.log('       ALLOWED in tools/check-saves.mjs with a reason.');
}

// An allow-list entry whose site no longer exists is stale. Report it, but do
// not fail on it: a removed write is not a defect, only untidy bookkeeping.
const stale = ALLOWED.filter((a) => !matched.has(a.fn));
for (const s of stale) console.log(`  stale allow-list entry: ${s.fn} — no bare save() found in it`);

console.log('');
console.log(
  `save-outcome predicate: ${hits.length} bare save() site(s), ` +
  `${hits.length - unlisted.length} allowed, ${unlisted.length} unlisted` +
  (stale.length ? `, ${stale.length} stale entr${stale.length === 1 ? 'y' : 'ies'}` : '')
);
process.exit(unlisted.length > 0 ? 1 : 0);
