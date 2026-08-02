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
//    width, which --width does. A probe that reports its own innerWidth is the
//    only way to know what it measured.
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
const prelude = killTransitions
  ? "var __k=document.createElement('style');__k.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.appendChild(__k);\n"
  : '';

const dir = mkdtempSync(join(tmpdir(), 'pwa-harness-'));
const inner = app.replace(
  /<\/script>\s*<\/body>/,
  `</script>\n<script>\n${fixture}\n${prelude}${probe}\n</script>\n</body>`
);
writeFileSync(join(dir, 'inner.html'), inner);

// An iframe of an exact CSS width is the only reliable way to set the viewport.
if (width) {
  writeFileSync(join(dir, 'host.html'), `<body style="margin:0"><script>
    var f=document.createElement('iframe');
    f.style.cssText='width:${width}px;height:820px;border:0;display:block';
    f.src='inner.html';
    f.onload=function(){ setTimeout(function(){
      document.documentElement.setAttribute('data-probe',
        f.contentDocument.documentElement.getAttribute('data-probe')||'{}');
    }, 1800); };
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
catch { console.log(json); process.exit(0); }

console.log(JSON.stringify(parsed, null, 2));
// A probe that reported an ERROR key has not verified anything.
process.exit(parsed && parsed.ERROR ? 1 : 0);
