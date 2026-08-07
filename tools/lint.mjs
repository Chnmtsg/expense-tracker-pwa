// Development-time static check over the inline script in expense-pwa/index.html.
//
// The application is one self-contained HTML file that runs by being opened from
// disk. Nothing here is required to run, load or serve it, and nothing here
// produces an artifact it depends on. Delete this directory and the app is
// unaffected.
//
// Extraction approach: every line that is not executable script is replaced with
// an empty line rather than removed. The generated file therefore has exactly the
// same line numbering as index.html, so ESLint's reported positions are the real
// positions and there is no offset arithmetic to get wrong.
//
// "Not executable script" means: outside a <script> block, OR inside an HTML
// comment that is itself outside a <script> block. It does NOT mean "inside an
// HTML comment", and the distinction is the whole of WORK-187 — see the walk
// below.

import { ESLint } from 'eslint';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'expense-pwa', 'index.html');
const workDir = join(root, '.lint');
const generated = join(workDir, 'index.script.js');

const raw = readFileSync(source, 'utf8');

/* ONE WALK, TRACKING BOTH STATES, and the order inside it is the entire fix.

   This used to be two passes: a global `raw.replace(/<!--[\s\S]*?-->/g, …)`
   that blanked every HTML comment in the file, and then the script-boundary
   walk below. Comment blanking ran FIRST and it ran over the WHOLE file, so an
   HTML comment written INSIDE a JavaScript template literal was erased before
   ESLint ever saw it. Those bytes are string content to the browser: a backtick
   in one ends the template literal and the top-level script stops parsing. So
   ESLint was handed a different program from the one that ships, reported no
   error, and `npm run verify` returned 0 over a completely dead application.
   Measured before this change: one backtick inserted at index.html:8468 gave
   verify=0 and boot=1.

   THE OBVIOUS FIX IS WRONG AND MUST NOT BE REINSTATED. Simply running the
   boundary walk first and blanking comments only on non-script lines relights
   the defect this file's own header recorded finding by running the check
   against itself: index.html:7 contains the literal text "<script>" inside an
   HTML comment, so the boundary test would open a phantom script region at line
   7 and the entire stylesheet would be linted as JavaScript.

   Hence one walk with both states, and comment state is consulted BEFORE the
   script test:

     outside a script region  — a line inside an HTML comment is blanked, and is
                                NOT tested for script tags. That is what keeps
                                line 7 from opening a phantom region.
     inside a script region   — comments are left alone entirely. They are
                                string content and ESLint must see them.

   The cheap check that the phantom defect has not returned is printed on every
   run: `lint: <N> script lines checked`. N must not move when this file is
   edited. If it jumps by thousands, the walk is eating the stylesheet. */
const lines = raw.split('\n');

let inScript = false;
let inComment = false;          // only tracked OUTSIDE script regions
let scriptLines = 0;
const out = lines.map((line) => {
  // --- Outside script: comment state governs, and suppresses the tag test ---
  if (!inScript) {
    if (inComment) {
      // Closing on this line releases the suppression for the NEXT line only.
      // A comment that closes and then opens a script tag on the same line does
      // not exist in this file and would be blanked here rather than guessed at.
      if (line.includes('-->')) inComment = false;
      return '';
    }
    // An unterminated `<!--` opens the suppression for subsequent lines. Both
    // markers on one line is a self-contained comment: no state change, and the
    // tag test below still runs on whatever surrounds it.
    const opensComment = line.includes('<!--');
    const closesComment = line.includes('-->');
    if (opensComment && !closesComment) { inComment = true; return ''; }
    if (opensComment && closesComment) return '';
  }

  // --- Script boundaries. Inline <script> only; a tag with src= is an external
  //     file and none exist here. ---
  const opens = /<script(?![^>]*\bsrc=)[^>]*>/.test(line);
  const closes = /<\/script>/.test(line);

  if (opens && closes) return '';               // single-line script block, none today
  if (opens) { inScript = true; return ''; }    // blank the tag itself
  if (closes) { inScript = false; return ''; }
  if (inScript) { scriptLines++; return line; } // comments inside script are KEPT
  return '';
});

if (scriptLines === 0) {
  console.error('lint: found no inline script in ' + source);
  process.exit(2);
}

mkdirSync(workDir, { recursive: true });
writeFileSync(generated, out.join('\n'), 'utf8');

const eslint = new ESLint({ overrideConfigFile: join(root, 'eslint.config.mjs') });
const results = await eslint.lintFiles([generated]);

let errors = 0;
let warnings = 0;
for (const result of results) {
  for (const m of result.messages) {
    const severity = m.severity === 2 ? 'error' : 'warning';
    if (m.severity === 2) errors++; else warnings++;
    // Report against index.html, which is the file a human will open.
    console.log(`expense-pwa/index.html:${m.line}:${m.column}  ${severity}  ${m.message}  ${m.ruleId ?? ''}`);
  }
}

rmSync(workDir, { recursive: true, force: true });

console.log('');
console.log(`lint: ${scriptLines} script lines checked, ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 ? 1 : 0);
