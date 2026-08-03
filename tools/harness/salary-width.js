// GUARANTEE: the Salary screen does not scroll the page sideways.
//
//   node tools/harness/run.mjs tools/harness/salary-width.js --width 320
//   ...and at 360, 390, 430. Assert the band the project supports.
//
// That sentence is the whole contract. If this probe is green, no horizontal
// scrollbar appears on #salary at the asserted width; if it is red, one does.
// ui-guidelines.md states "No horizontal scrolling" with no qualifier, and the
// Salary Inputs card is the most crowded layout in the application — eight
// fields in a two-column grid with no breakpoint — so it is the screen most
// likely to break the rule first.
//
// WHY THIS EXISTS, AND WHAT IT FOUND
//
// Round 8's UI-01 raised a High: `.grid-2` is `1fr 1fr` with no breakpoint and
// no `min-width: 0`, so — the reasoning went — the tracks could not compress
// below the inputs' intrinsic width and every phone scrolled sideways. The
// finding stated plainly that its figures were computed from the declared box
// model rather than measured, named this instrument as what would settle it,
// and asked for confirmation before anyone acted.
//
// Measured, 2026-08-03, Chrome (Blink) via run.mjs with the reserved scrollbar
// gutter suppressed: IT DID NOT REPRODUCE. No horizontal overflow at any width
// from 240 to 430, and applying `.grid-2 > * { min-width: 0 }` produced
// identical figures — the fix was inert. The grid item is a <div> wrapper, not
// the input, and a percentage-width child does not propagate a floor into its
// parent block's min-content contribution. The declaration was not landed.
//
// Numbers are deliberately NOT recorded in this header. They belong to a run,
// not to a comment; run the probe.
//
// WHAT THIS CANNOT TELL YOU
//
// Blink only. Form-control intrinsic sizing inside grid genuinely differs
// between engines, and iOS Safari is a target — README.md's install
// instructions and the app's own Storage Status card both name it. A green run
// here is not evidence about WebKit. If horizontal scroll is ever OBSERVED on
// the Salary screen on iOS, the fix is pre-ruled: `.grid-2 > * { min-width: 0 }`
// at index.html:863, with the observation recorded as the derivation and the
// observing engine named.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}
try {
  // Required by run.mjs in width mode. Every figure below is worthless if the
  // frame did not lay out at the width that was asked for — which is exactly
  // how this instrument misdescribed five rounds of width results.
  t.viewport_clientWidth = document.documentElement.clientWidth;

  navigate('salary');
  var screen = document.getElementById('salary');
  // A probe that measures a hidden screen measures nothing, and #salary is not
  // the boot screen.
  if (!screen || screen.offsetParent === null) {
    throw new Error('setup failed: #salary is not the active screen');
  }

  var inputs = screen.querySelectorAll('.grid-2 input');
  t.A_inputs_in_grid = inputs.length;
  // A count of zero is not a pass.
  if (!inputs.length) throw new Error('setup failed: no inputs inside a .grid-2 on #salary');

  var de = document.documentElement;
  t.B_overflow = de.scrollWidth - de.clientWidth;
  t.C_grid_width = Math.round(inputs[0].closest('.grid-2').getBoundingClientRect().width * 100) / 100;
  t.D_input_width = Math.round(inputs[0].getBoundingClientRect().width * 100) / 100;

  flow('the salary screen does not scroll sideways', function () {
    if (t.B_overflow > 0) {
      throw new Error('page scrolls sideways by ' + t.B_overflow + 'px at ' +
                      t.viewport_clientWidth + 'px — ' + t.A_inputs_in_grid +
                      ' inputs, grid ' + t.C_grid_width + 'px, input ' + t.D_input_width + 'px');
    }
  });
} catch (e) { t.ERROR = String(e && e.message ? e.message : e); }
document.documentElement.setAttribute('data-probe', JSON.stringify(t));
