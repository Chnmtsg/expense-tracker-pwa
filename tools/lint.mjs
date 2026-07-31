// Development-time static check over the inline script in expense-pwa/index.html.
//
// The application is one self-contained HTML file that runs by being opened from
// disk. Nothing here is required to run, load or serve it, and nothing here
// produces an artifact it depends on. Delete this directory and the app is
// unaffected.
//
// Extraction approach: every line outside a <script> block is replaced with an
// empty line rather than removed. The generated file therefore has exactly the
// same line numbering as index.html, so ESLint's reported positions are the real
// positions and there is no offset arithmetic to get wrong.

import { ESLint } from 'eslint';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'expense-pwa', 'index.html');
const workDir = join(root, '.lint');
const generated = join(workDir, 'index.script.js');

const raw = readFileSync(source, 'utf8');

// Blank out HTML comments first, preserving line count. Without this the word
// "<script>" written inside a comment — which it is, in the note explaining the
// CSP — opens a phantom script block and the stylesheet gets linted as
// JavaScript. Found by running this check against itself.
const decommented = raw.replace(/<!--[\s\S]*?-->/g, (block) => '\n'.repeat((block.match(/\n/g) || []).length));

const lines = decommented.split('\n');

// Blank everything that is not executable script. Inline <script> only — a
// tag with src= is an external file and none exist here.
let inScript = false;
let scriptLines = 0;
const out = lines.map((line) => {
  const opens = /<script(?![^>]*\bsrc=)[^>]*>/.test(line);
  const closes = /<\/script>/.test(line);

  if (opens && closes) return '';          // single-line script block, none today
  if (opens) { inScript = true; return ''; }   // blank the tag itself
  if (closes) { inScript = false; return ''; }
  if (inScript) { scriptLines++; return line; }
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
