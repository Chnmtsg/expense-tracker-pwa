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
  // --- Text on accent fills (WORK-41) ---
  { fg: 'on-accent',  bg: 'primary',   min: 4.5, note: 'label on every primary button, .qa-btn hover, more-item icon' },
  { fg: 'on-danger',  bg: 'danger',    min: 4.5, note: 'data-loss banner, reminder badge, danger buttons' },
  { fg: 'on-success', bg: 'success',   min: 4.5, note: 'quick-amount save button' },
  { fg: 'on-warning', bg: 'warning',   min: 4.5, note: 'advisor warning badge' },

  // The two gradient cards use --on-hero, not --on-accent. The scrim exists
  // precisely so that white works on the gradient, so white is the answer there
  // and the per-theme alpha is what varies; --on-accent is for FLAT fills,
  // which have no scrim. Measuring --on-accent here (a dark colour in the
  // themes where white fails on the flat fill) put dark text on a DARKENED
  // gradient and reported eleven failures — the check caught the mistake.
  //
  // The lighter stop governs, so both are measured.
  { fg: 'on-hero', bg: 'primary',   over: { colour: '#000000', alphaToken: 'hero-scrim' }, min: 4.5, note: 'hero KPI / salary summary, dark stop' },
  { fg: 'on-hero', bg: 'primary-2', over: { colour: '#000000', alphaToken: 'hero-scrim' }, min: 4.5, note: 'hero KPI / salary summary, LIGHT stop — the one that was failing' },

  // --- --primary as a foreground (WORK-42) ---
  { fg: 'primary-text', bg: 'surface',   min: 4.5, note: 'active tab label, goal %, converter result, convert button' },
  { fg: 'primary-text', bg: 'surface-2', min: 4.5, note: 'more-sheet icon tile sits on surface-2' },

  // --- Semantic text on cards and on their own tints (WORK-05, re-measured
  //     for WORK-53: the tags render on surface-2, not surface) ---
  { fg: 'success-text', bg: 'surface',   min: 4.5 },
  { fg: 'success-text', bg: 'surface-2', min: 4.5 },
  { fg: 'danger-text',  bg: 'surface',   min: 4.5 },
  { fg: 'danger-text',  bg: 'surface-2', min: 4.5 },
  { fg: 'warning-text', bg: 'surface',   min: 4.5 },
  { fg: 'warning-text', bg: 'surface-2', min: 4.5 },
  { fg: 'needs-text',   bg: 'surface-2', min: 4.5, note: 'Needs tag on a list row' },
  { fg: 'wants-text',   bg: 'surface-2', min: 4.5, note: 'Wants tag on a list row' },
  { fg: 'savings-text', bg: 'surface-2', min: 4.5, note: 'Savings tag on a list row' },

  // --- Body and secondary text (WORK-54: kingfisher was the one theme of
  //     sixteen with no measurement behind it) ---
  { fg: 'text',   bg: 'surface',   min: 4.5 },
  { fg: 'text',   bg: 'surface-2', min: 4.5 },
  { fg: 'text',   bg: 'bg',        min: 4.5 },
  { fg: 'text-2', bg: 'surface',   min: 4.5 },
  { fg: 'text-2', bg: 'surface-2', min: 4.5, note: 'list row meta, helper text, chip amounts' },
  { fg: 'text-2', bg: 'bg',        min: 4.5 },

  // --- The advisor badge overrides the fill per state, so each state's own
  //     foreground is measured (WORK-67). Without these the badge was white on
  //     green at 2.32:1 on the default theme. ---
  { fg: 'on-success', bg: 'success', min: 4.5, note: 'advisor badge, good' },
  { fg: 'on-warning', bg: 'warning', min: 4.5, note: 'advisor badge, warning' },
  { fg: 'on-danger',  bg: 'danger',  min: 4.5, note: 'advisor badge, critical' },

  // --- Hover repaints the fill to --primary-2, which is lighter in every
  //     theme, and the label does not change with it (WORK-84a) ---
  { fg: 'on-accent', bg: 'primary-hover', min: 4.5, note: 'primary button / goal-add / swap on hover' },

  // --- Calendar heat cells: text over a --primary tint at --heat-max, its
  //     densest point, composited over the card the grid sits on (WORK-69) ---
  { fg: 'text', bg: 'primary', over: { colour: 'surface-2', alphaToken: 'heat-max', invert: true }, min: 4.5, note: 'calendar heat cell at full intensity — day number and amount' },

  // --- The focus ring is a non-text indicator: 3:1 (WCAG 2.4.11) ---
  { fg: 'focus-ring-color', bg: 'bg',        min: 3.0 },
  { fg: 'focus-ring-color', bg: 'surface',   min: 3.0 },
  { fg: 'focus-ring-color', bg: 'surface-2', min: 3.0 },
  { fg: 'focus-ring-color', bg: 'surface-3', min: 3.0 },
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

// A token's raw declared value, following `var(--x)` aliases. Used for the
// scrim alpha, which is a number rather than a colour.
function resolveRaw(tokens, name, depth = 0) {
  if (depth > 10) return null;
  const v = String(tokens[name] || '').trim();
  const alias = v.match(/^var\(\s*--([\w-]+)\s*\)$/);
  return alias ? resolveRaw(tokens, alias[1], depth + 1) : v;
}

function colourFor(tokens, spec) {
  if (/^#[0-9a-f]{6}$/i.test(spec)) return rgb(spec);
  const hex = resolve(tokens, tokens[spec]);
  return hex ? rgb(hex) : null;
}

const parsed = readThemes(src);

// A theme block overrides only what it declares; everything else cascades from
// :root. Modelling that matters — --focus-ring-color is declared once in :root
// and inherited by all sixteen, so measuring only per-block declarations
// reported it as undefined in twelve themes rather than measuring it.
const base = parsed.get(':root') || {};
const themes = new Map();
for (const [name, tokens] of parsed) {
  themes.set(name, name === ':root' ? tokens : { ...base, ...tokens });
}
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
      // `invert` means the PAIR's bg is the tint and over.colour is what it is
      // painted on top of — the calendar cell case, where --primary at
      // --heat-max sits over --surface-2. Without it the compositing would be
      // the wrong way round and would report a comfortable pass.
      if (pair.over.invert) {
        const ground = colourFor(tokens, pair.over.colour);
        const alpha = parseFloat(resolveRaw(tokens, pair.over.alphaToken));
        if (!ground || !Number.isFinite(alpha)) {
          missing.push(`${themeName}: --${pair.over.colour} / --${pair.over.alphaToken} is undefined`);
          continue;
        }
        const r = ratio(fg, composite(ground, bg, alpha));
        checked++;
        if (r < worst.ratio) worst = { ratio: r, where: `${themeName} ${pair.fg} on ${pair.bg}` };
        if (r < pair.min) {
          failures.push(
            `${themeName}: --${pair.fg} on --${pair.bg}@${alpha} over --${pair.over.colour} = ${r.toFixed(2)}:1, needs ${pair.min}:1` +
            (pair.note ? `  (${pair.note})` : '')
          );
        }
        continue;
      }
      const scrim = colourFor(tokens, pair.over.colour);
      // The alpha may itself be a token, so a per-theme scrim is measured at
      // the value that theme actually declares rather than a constant.
      const alpha = pair.over.alphaToken
        ? parseFloat(resolveRaw(tokens, pair.over.alphaToken))
        : pair.over.alpha;
      if (!scrim || !Number.isFinite(alpha)) {
        missing.push(`${themeName}: scrim ${pair.over.colour} / --${pair.over.alphaToken || 'alpha'} is undefined`);
        continue;
      }
      bg = composite(bg, scrim, alpha);
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

/* V6 — a declared `--on-*` token that nothing references.
 *
 * A foreground token exists to be painted on a fill. One declared in every
 * theme and referenced nowhere means some rule is painting that fill with a
 * DIFFERENT foreground — which is exactly how the advisor badge shipped white
 * on green at 2.32:1 while `--on-warning` sat declared sixteen times and used
 * zero. The pair table said the token was fine, and it was; the rule was not
 * using it.
 *
 * This is a grep and a count over declarations already parsed. It is not a CSS
 * engine: it cannot tell which rule should have used the token, only that
 * nothing did.
 */
const declaredOn = new Set();
for (const tokens of themes.values()) {
  for (const name of Object.keys(tokens)) if (/^on-/.test(name)) declaredOn.add(name);
}
const unused = [...declaredOn].filter((n) => !new RegExp(`var\\(\\s*--${n}\\s*[,)]`).test(src));
for (const n of unused) {
  console.log(`  UNUSED  --${n} is declared but referenced nowhere.`);
  console.log('          A foreground token nothing paints with means some rule is painting');
  console.log('          that fill with the wrong one. Use it, or delete it.');
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
if (unused.length) {
  console.log(`  ${unused.length} declared-but-unreferenced --on-* token(s)`);
}
process.exit(failures.length + missing.length + unused.length > 0 ? 1 : 0);
