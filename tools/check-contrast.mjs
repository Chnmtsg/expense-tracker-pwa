// V4 predicate — theme contrast.
//
// WHY THIS EXISTS
//
// The stylesheet carried a comment asserting that a scrim reached WCAG AA "in
// all 16 themes". A human wrote it in good faith and measurement contradicted
// it. That is the third time this project has shipped an artifact asserting a
// swept class with no search behind it, and the second time the assertion was
// about colour.
//
// An "all N themes" claim is exactly the shape ruling V2 governs: it is not a
// claim, it is a search. This is that search.
//
// SCOPE — fixed by ruling V4, and deliberately narrow so this does not grow
// into a CSS engine:
//
//   * It reads the theme blocks, which are flat `--token: #hex;` declarations
//     and already machine-readable.
//   * It holds an explicit table of (foreground, background, minimum) triples,
//     maintained BY HAND below. A human decides which pairs matter.
//   * It does the arithmetic and the counting, because the arithmetic and the
//     counting are what humans got wrong.
//   * It can composite a scrim over a background, which is arithmetic over two
//     declared tokens.
//
// It does NOT parse CSS rules, resolve the cascade, follow color-mix(), or
// infer which pairs matter. If a pair is not in the table below, this check
// says nothing about it — and the table is the deliverable of the work that
// uses it, not a prerequisite.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'expense-pwa', 'index.html'), 'utf8');

/* ------------------------------------------------------------------
   THE PAIR TABLE — maintained by hand.

   `fg` and `bg` are token names without the leading `--`, or a literal
   `#rrggbb`. `min` is the WCAG ratio required: 4.5 for normal text, 3.0 for
   large text (>=18.66px bold or >=24px) and for non-text graphics.

   `over` optionally composites `fg` on top of a scrim before measuring — used
   for the gradient hero cards, where the text sits on a semi-transparent black
   overlay above the accent.

   Entries are added by the work that establishes them. An empty table passes,
   which is correct: this file makes no claim of its own.
------------------------------------------------------------------ */
const PAIRS = [
  // --- Populated by WORK-41 / WORK-42 / WORK-53 / WORK-54 (Step 3). ---
  // Example of the intended shape, commented out until those tokens exist:
  //   { fg: 'on-accent',    bg: 'primary',   min: 4.5, note: 'label on every primary button' },
  //   { fg: 'on-danger',    bg: 'danger',    min: 4.5, note: 'data-loss banner, reminder badge' },
  //   { fg: 'primary-text', bg: 'surface',   min: 4.5, note: 'active tab label' },
];

/* ------------------------------------------------------------------
   Below this line is arithmetic. Nothing here decides what matters.
------------------------------------------------------------------ */

// Theme blocks are `:root { … }` and `html[data-theme="x"] { … }`, each a flat
// list of custom properties. Anything nested would not match, which is fine —
// this file's contract is that theme blocks stay flat.
function readThemes(text) {
  const themes = new Map();
  const blockRe = /(?::root|html\[data-theme="([a-z]+)"\])\s*\{([^}]*)\}/g;
  let m;
  while ((m = blockRe.exec(text))) {
    const name = m[1] || ':root';
    const tokens = themes.get(name) || {};
    const declRe = /--([\w-]+)\s*:\s*([^;]+);/g;
    let d;
    while ((d = declRe.exec(m[2]))) tokens[d[1]] = d[2].trim();
    themes.set(name, tokens);
  }
  return themes;
}

// A token may alias another token: `--placeholder: var(--text-2);`. Resolved
// with a depth cap so a cycle reports rather than hangs.
function resolve(tokens, value, depth = 0) {
  if (depth > 10) return null;
  const v = String(value || '').trim();
  const alias = v.match(/^var\(\s*--([\w-]+)\s*\)$/);
  if (alias) return resolve(tokens, tokens[alias[1]], depth + 1);
  return /^#[0-9a-f]{6}$/i.test(v) ? v : null;
}

function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(c) {
  const a = c.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Flatten `alpha` of `over` on top of `base`. Used for the hero scrim.
function composite(base, over, alpha) {
  return [0, 1, 2].map((i) => over[i] * alpha + base[i] * (1 - alpha));
}

function colourFor(tokens, spec) {
  if (/^#[0-9a-f]{6}$/i.test(spec)) return rgb(spec);
  const hex = resolve(tokens, tokens[spec]);
  return hex ? rgb(hex) : null;
}

const themes = readThemes(src);
const failures = [];
const missing = [];
let checked = 0;
let worst = { ratio: Infinity, where: '' };

for (const [themeName, tokens] of themes) {
  for (const pair of PAIRS) {
    let fg = colourFor(tokens, pair.fg);
    let bg = colourFor(tokens, pair.bg);
    if (!fg || !bg) {
      missing.push(`${themeName}: ${!fg ? '--' + pair.fg : '--' + pair.bg} is undefined or not a plain hex`);
      continue;
    }
    if (pair.over) {
      const scrim = colourFor(tokens, pair.over.colour);
      if (!scrim) {
        missing.push(`${themeName}: scrim --${pair.over.colour} is undefined`);
        continue;
      }
      bg = composite(bg, scrim, pair.over.alpha);
    }
    const r = ratio(fg, bg);
    checked++;
    if (r < worst.ratio) worst = { ratio: r, where: `${themeName} ${pair.fg} on ${pair.bg}` };
    if (r < pair.min) {
      failures.push(
        `${themeName}: --${pair.fg} on --${pair.bg} = ${r.toFixed(2)}:1, needs ${pair.min}:1` +
        (pair.note ? `  (${pair.note})` : '')
      );
    }
  }
}

for (const line of failures) console.log(`  FAIL  ${line}`);
for (const line of missing) console.log(`  MISS  ${line}`);
console.log('');
console.log(
  `contrast predicate: ${themes.size} themes x ${PAIRS.length} pairs, ` +
  `${checked} measured, ${failures.length} below threshold` +
  (checked ? `, worst ${worst.ratio.toFixed(2)}:1 (${worst.where})` : '')
);
if (!PAIRS.length) {
  console.log('  note: the pair table is empty, so this check asserts nothing yet.');
  console.log('  It is populated by the work that establishes each pair (see ruling V4).');
}
process.exit(failures.length + missing.length > 0 ? 1 : 0);
