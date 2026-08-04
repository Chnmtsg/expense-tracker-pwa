// Runs a probe script against a copy of the app in headless Chrome and prints
// what it measured.
//
// WHY THIS EXISTS
//
// Ruling V1 requires every changed top-level flow to be executed with the
// console visible, and rulings V2/V4/V5 require claims to be re-runnable. The
// four static checks in tools/ cover what can be decided from source. This
// covers what can only be decided by rendering: computed colours, measured
// widths, what a handler actually does when clicked.
//
// It was rebuilt from memory in five separate sessions before being committed,
// which is the reason it is here.
//
//   node tools/harness/run.mjs <probe.js> [--width 390] [--fixture]
//
// The probe is plain browser JS. It writes its result as JSON to
// documentElement's `data-probe` attribute; this script extracts and prints it.
// With --fixture, tools/harness/fixture.js is injected first and the probe may
// call loadFixture() and read RANGES.
//
// LESSONS THE HARD WAY — each of these produced a false pass or a false
// failure at least once, so they are enforced or documented here:
//
//  * `--window-size` is IGNORED by headless Chrome for viewport purposes.
//    Sizing must be done by hosting the page in an iframe of an exact CSS
//    width, which --width does.
//  * REPORT `document.documentElement.clientWidth`, NOT `innerWidth`. This
//    line used to say a probe reporting its own innerWidth was "the only way
//    to know what it measured", and that advice was the fault: innerWidth
//    INCLUDES a reserved scrollbar gutter and clientWidth does not, so the one
//    self-check this file recommended was the single number that could not
//    reveal the gutter. Chrome-on-Windows reserved 15px inside every hosted
//    frame — the app is far taller than the frame — so every width-mode result
//    for five rounds described a viewport 15px narrower than the one it named,
//    on an app whose supported band is 320-390px. The gutter is suppressed
//    below, and `viewport_clientWidth` is now REQUIRED from a width-mode probe
//    and checked against --width, so a frame that does not honour the request
//    fails instead of quietly reporting the wrong layout.
//  * CSS transitions do not settle under --virtual-time-budget, so
//    getComputedStyle returns an in-flight value. Probes that read painted
//    colour must disable transitions first (see --no-transitions).
//  * `requestAnimationFrame` is starved. Anything animated (setNumAnimated)
//    must be driven by a stubbed frame clock, not waited on.
//  * A probe that reports zero matches is not a pass. Assert the fixture
//    produced the thing you are measuring before measuring it.
//  * `var name = ...` in a probe silently coerces to a string: window.name is
//    a DOMString. Same for `top`, `length`, `status`.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const args = process.argv.slice(2);
const probePath = args.find((a) => !a.startsWith('--'));
if (!probePath) {
  console.error('usage: node tools/harness/run.mjs <probe.js> [--width N] [--fixture] [--no-transitions]');
  process.exit(2);
}
const widthArg = args.indexOf('--width');
const width = widthArg > -1 ? parseInt(args[widthArg + 1], 10) : 0;
const useFixture = args.includes('--fixture');
const killTransitions = args.includes('--no-transitions');

const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

const app = readFileSync(join(root, 'expense-pwa', 'index.html'), 'utf8');
const probe = readFileSync(resolve(probePath), 'utf8');
const fixture = useFixture ? readFileSync(join(here, 'fixture.js'), 'utf8') : '';
const preludeParts = [];
if (killTransitions) {
  preludeParts.push("var __k=document.createElement('style');__k.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.appendChild(__k);");
}
// Width mode only: lay out like the overlay-scrollbar browsers the app runs on.
// Without this the hosted frame reserves a classic gutter and every measured
// width is ~15px narrower than the one requested. Phones do not reserve one.
if (width) {
  preludeParts.push("var __s=document.createElement('style');__s.textContent='html{scrollbar-width:none}html::-webkit-scrollbar{width:0;height:0}';document.head.appendChild(__s);");
}
const prelude = preludeParts.length ? preludeParts.join('\n') + '\n' : '';

const dir = mkdtempSync(join(tmpdir(), 'pwa-harness-'));
const inner = app.replace(
  /<\/script>\s*<\/body>/,
  `</script>\n<script>\n${fixture}\n${prelude}${probe}\n</script>\n</body>`
);
writeFileSync(join(dir, 'inner.html'), inner);

// An iframe of an exact CSS width is the only reliable way to set the viewport.
//
// The host POLLS for the inner frame's result rather than sampling once at a
// fixed delay, and writes an explicit ERROR if it never appears.
//
// It used to do `getAttribute('data-probe') || '{}'` after 1800ms. A probe that
// threw before reporting, or that simply had not finished, produced the literal
// {} — which parses, contains no THREW, and carries no console field, so every
// check below was skipped and the command printed {} and exited 0. That is the
// same class as the parse-failure exit-0 closed in round 6, in the same file,
// in the one mode neither `npm run v1` nor boot-crash.js exercises. It matters
// because the deferred calendar-geometry decision is supposed to be settled by
// a width-mode probe, and its numbers have already been wrong twice.
if (width) {
  writeFileSync(join(dir, 'host.html'), `<body style="margin:0"><script>
    var f=document.createElement('iframe');
    f.style.cssText='width:${width}px;height:820px;border:0;display:block';
    f.src='inner.html';
    var waited=0, STEP=100, LIMIT=15000;
    function publish(v){ document.documentElement.setAttribute('data-probe', v); }
    f.onload=function(){
      (function poll(){
        var v=null;
        try { v=f.contentDocument.documentElement.getAttribute('data-probe'); } catch(e){}
        if (v) return publish(v);
        waited+=STEP;
        if (waited>=LIMIT) return publish(JSON.stringify({
          ERROR:'probe did not write data-probe within '+LIMIT+'ms'
        }));
        setTimeout(poll, STEP);
      })();
    };
    document.body.appendChild(f);
  </script></body>`);
}

const target = 'file:///' + join(dir, width ? 'host.html' : 'inner.html').replace(/\\/g, '/');
const res = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-extensions',
  '--allow-file-access-from-files',
  `--user-data-dir=${join(dir, 'profile')}`,
  '--virtual-time-budget=20000', '--dump-dom', target
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const m = /data-probe="([^"]*)"/.exec(res.stdout || '');
if (!m) {
  console.error('No result. The probe threw before writing data-probe, or the page did not load.');
  console.error('Check for a syntax error in the probe, and that CHROME_PATH is right.');
  process.exit(1);
}
const json = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
                 .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let parsed;
try { parsed = JSON.parse(json); }
catch {
  // A payload that will not parse is a probe that did not report. Exiting 0
  // here meant the command could not fail even on its own read path.
  console.error('Probe payload did not parse:');
  console.log(json);
  process.exit(1);
}

console.log(JSON.stringify(parsed, null, 2));

/* WHY THIS COMMAND CAN FAIL, AND WHY IT COULD NOT BEFORE
   -----------------------------------------------------
   Until round 6 the exit code tested only `parsed.ERROR` — the probe's outer
   catch. Every other failure was invisible to it: flow() records a thrown flow
   as a STRING containing THREW rather than re-throwing, and the console-error
   count went into a field nothing read. A run in which all four write flows
   threw, the save-failure contract was broken and the data-error banner was
   showing still exited 0 and printed success.

   That is not a hypothetical. Five approved items were recorded as landed on
   the strength of a green line from this command, and re-derivation found all
   five had not landed as recorded.

   Narrowness worth knowing: the console-error assertion is keyed on
   H_unexpected_console_errors, so a probe that does not report that field gets
   no console checking. The THREW scan and the ERROR check apply to every probe. */
const failures = [];

// A payload with no keys is a probe that measured nothing. It used to be
// indistinguishable from success: {} parses, has no ERROR, contains no THREW,
// and reports no console field, so every check below passed over it.
if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
  failures.push('probe reported an empty payload — it measured nothing');
}

if (parsed && parsed.ERROR) failures.push('probe aborted: ' + parsed.ERROR);

// RECURSIVE, over arrays and plain objects alike. It used to descend into
// arrays only, so a probe reporting a table keyed by width — which is exactly
// the shape the deferred calendar measurement calls for — could hide a THREW
// one level down and still exit 0.
const scan = (value, path) => {
  if (typeof value === 'string') {
    if (value.includes('THREW')) failures.push(`${path} — ${value}`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scan(v, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) scan(v, `${path}.${k}`);
  }
};
for (const [key, value] of Object.entries(parsed || {})) scan(value, key);

/* A width-mode probe must say what viewport it actually laid out in.
   ------------------------------------------------------------------
   This is the assertion the header's old advice stood in for. A comment
   recommending a self-check is not a self-check: for five rounds every
   width-mode figure was taken 15px narrow and nothing could tell, because the
   number the header recommended (innerWidth) includes the gutter that was the
   fault. The probe reports document.documentElement.clientWidth as
   `viewport_clientWidth`; if it disagrees with --width by more than a rounding
   pixel, the run fails rather than producing a figure for the wrong viewport.

   Required, not optional. A width-mode probe that omits the field is a probe
   whose measurements cannot be attributed to a viewport, which is the same
   thing as not knowing what it measured. */
if (width) {
  const got = parsed && parsed.viewport_clientWidth;
  if (typeof got !== 'number') {
    failures.push(`--width ${width} was requested but the probe reported no viewport_clientWidth ` +
      `— a width-mode probe must report document.documentElement.clientWidth`);
  } else if (Math.abs(got - width) > 1) {
    failures.push(`--width ${width} was requested but the frame laid out at ${got}px ` +
      `— every figure in this run describes a viewport that was not asked for`);
  }
}

// Only errors raised OUTSIDE a deliberate-failure block. The probe's quota and
// corrupt-boot walks raise errors on purpose; failing on those would make this
// red on a clean build, and an assertion that cries wolf gets switched off.
if (parsed && parsed.H_unexpected_console_errors > 0) {
  failures.push(`${parsed.H_unexpected_console_errors} unexpected console error(s): ` +
    JSON.stringify(parsed.consoleErrors || []));
}

if (failures.length) {
  console.error('\nFAILED');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
process.exit(0);
