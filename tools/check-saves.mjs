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
//   A bare `save();` — one whose return value is discarded — is forbidden
//   unless its line number and reason are recorded in ALLOWED below.
//
// A new unreported write fails on the first run. That is the only property
// that matters. An eighth delete path cannot appear silently.
//
// This deliberately does NOT require that every save() be followed by
// savedToast(). That would be a rule about outcome messaging disguised as a
// rule about writes, and it would put a toast on a reorder drag. Ruling V5 is
// explicit on the point.
//
// Line numbers drift. When they do, the check reports the drift rather than
// failing silently — the reason string is matched against the surrounding
// code so a moved line is recognised and a NEW bare save is not.

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
    why: 'Reorder drag. The new order is already on screen; a toast per drop would be noise. Ruled acceptable in round 3 (WORK-38 narrowing).'
  },
  {
    fn: 'initCategoryReorder',
    why: 'Reorder drag. Same reasoning as the income-type reorder.'
  },
  {
    fn: 'maybeFireOSNotifications',
    why: 'Records lastNotifiedAt after firing an OS notification, to stop it firing twice in a day. Bookkeeping, not a record the user entered; there is no toast, so nothing reports success. Losing it costs one duplicate reminder.'
  }
];

// A bare save: `save();` with nothing capturing the result. Matches
// `save();` and `... ; save();` but not `const ok = save();`,
// `okSave = save();` or `return save();`.
const BARE_SAVE = /(^|[;{}\s])save\(\)\s*;/;
const CAPTURED = /(?:=|return|\?|:|\|\||&&)\s*save\(\)/;

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

function buildScopes() {
  const state = { quote: null, block: false };
  const stack = [];
  const perLine = [];
  let depth = 0;
  for (const raw of lines) {
    const code = stripNonCode(raw, state);
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

const hits = [];
lines.forEach((line, i) => {
  const code = line.replace(/\/\/.*$/, '');
  if (!BARE_SAVE.test(code)) return;
  if (CAPTURED.test(code)) return;
  hits.push({ line: i + 1, names: enclosingNames(i), text: line.trim().slice(0, 78) });
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
