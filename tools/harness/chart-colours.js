// The chart colour probe.
//
//   node tools/harness/run.mjs tools/harness/chart-colours.js --no-transitions
//   npm run chartcolours
//
// WHY THIS EXISTS
//
// check-contrast.mjs measures ratios between declared tokens, and nothing
// else (ruling V4). The defects in the colour review were of a different
// kind: a chart painting two things that must read differently in colours
// that are the same, or nearly the same, in some themes. Planned vs Actual
// drew Planned in the brand colour, so in mint, forest, peacock and oled a
// planned amount and an under-plan actual were both green, and in flamingo,
// rose and sepia Planned and an over-plan actual were both red
// (chief-architect-colours.md, WORK-03 and WORK-10). Every theme passed
// every contrast row while it happened.
//
// This probe renders the chart in each of the 16 themes and reads the
// colours actually painted, so it measures the cascade, not the tokens.
//
// ONE DISTANCE. `distance()` below is the only colour distance in the
// harness. Thresholds are constants beside it; lowering one needs a ruling
// (chief-architect-colours.md, C5).
var t = { flows: [], consoleErrors: [] };
var realError = console.error;
console.error = function () {
  t.consoleErrors.push(Array.prototype.join.call(arguments, ' ').slice(0, 160));
  realError.apply(console, arguments);
};
window.addEventListener('error', function (e) { t.consoleErrors.push('window.error: ' + (e.message || e.error)); });

function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}

// Euclidean distance in OKLab, on computed `rgb()` / `rgba()` strings. OKLab
// is perceptually even enough that one number serves hue and lightness
// differences alike, which is what "reads as a different thing" needs: a
// plain equality test misses flamingo's #F97066 beside #AD1C1C.
function oklab(css) {
  var m = String(css).match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error('not a colour: ' + css);
  var c = m[1].split(',').map(function (x) { return parseFloat(x); });
  var lin = c.slice(0, 3).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  var l = Math.cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]);
  var mm = Math.cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]);
  var s = Math.cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]);
  return [
    0.2104542553 * l + 0.7936177850 * mm - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s
  ];
}
function distance(a, b) {
  var p = oklab(a), q = oklab(b);
  return Math.sqrt(Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2) + Math.pow(p[2] - q[2], 2));
}
// Two chart marks meant to be told apart must be at least this far apart.
// Set in the WORK-03 commit: on the build before it, the colliding pairs the
// review named measured 0.077 (oled) to 0.142 (mint).
var MIN_APART = 0.15;
// A "neutral" mark may carry at most this much OKLab chroma. --text-2 is
// tinted in some themes (forest and mint green, rose and flamingo red), so
// "neutral" is measured, not assumed.
var MAX_NEUTRAL_CHROMA = 0.06;
function chroma(css) { var p = oklab(css); return Math.sqrt(p[1] * p[1] + p[2] * p[2]); }

function tok(name) {
  var p = document.createElement('span');
  p.style.color = 'var(' + name + ')';
  document.body.appendChild(p);
  var c = getComputedStyle(p).color;
  p.remove();
  return c;
}

try {
  var was = db.settings.theme;
  navigate('dashboard');

  /* (c) PLANNED IS NEVER MISTAKEN FOR ACTUAL, in either state.
     Read by position, not by class, so the probe means the same thing on a
     build that predates the classes: the first bar of a row is Planned and
     the second Actual. */
  flow('planned and actual bars differ in every theme, over and under', function () {
    if (db.categories.length < 2) throw new Error('setup failed: need two categories');
    var over = db.categories[0].id, under = db.categories[1].id;
    var worst = { d: Infinity };
    Object.keys(THEMES).forEach(function (th) {
      applyTheme(th);
      drawPvA(
        [{ id: 'P1', date: todayISO(), amount: 100000, categoryId: over },
         { id: 'P2', date: todayISO(), amount: 90000,  categoryId: under }],
        [{ id: 'A1', date: todayISO(), amount: 150000, categoryId: over },
         { id: 'A2', date: todayISO(), amount: 40000,  categoryId: under }]
      );
      var rows = document.querySelectorAll('#pvaChart .pva-row');
      if (rows.length !== 2) throw new Error(th + ': expected 2 rows, got ' + rows.length);
      Array.prototype.forEach.call(rows, function (row, i) {
        var bars = row.querySelectorAll('.pva-bar-row .bar > span');
        var plan = getComputedStyle(bars[0]).backgroundColor, act = getComputedStyle(bars[1]).backgroundColor;
        var d = distance(plan, act);
        var state = i === 0 ? 'over' : 'under';
        if (d < worst.d) worst = { d: +d.toFixed(3), theme: th, state: state, plan: plan, actual: act };
        if (d < MIN_APART) throw new Error(th + ' ' + state + ': Planned ' + plan + ' vs Actual ' + act + ' only ' + d.toFixed(3) + ' apart (min ' + MIN_APART + ')');
      });
    });
    t.C_worst_planned_vs_actual = worst;
  });

  /* Planned is a neutral reference, never a hue (chief-architect-colours.md,
     "Neutral Planned token"). Distance alone misses flamingo's old pair: a
     coral Planned beside a deep red Actual differs by lightness, 0.226 apart,
     yet both read as red. */
  flow('the planned bar is neutral in every theme', function () {
    var cid = db.categories[0].id;
    var tinted = [];
    Object.keys(THEMES).forEach(function (th) {
      applyTheme(th);
      drawPvA([{ id: 'P1', date: todayISO(), amount: 100000, categoryId: cid }],
              [{ id: 'A1', date: todayISO(), amount: 50000, categoryId: cid }]);
      var plan = getComputedStyle(document.querySelector('#pvaChart .pva-row .bar > span')).backgroundColor;
      if (chroma(plan) > MAX_NEUTRAL_CHROMA) tinted.push(th + ' ' + plan + ' C=' + chroma(plan).toFixed(3));
    });
    if (tinted.length) throw new Error('Planned is not neutral: ' + tinted.join('; '));
  });

  /* Actual bars are fills, painted in the fill tokens, not the -text ones
     (CODE-04): the -text tokens are faded for words on dark grounds, and in
     nord over and under were then a pale pink and a pale green. */
  flow('actual bars paint the state fill tokens', function () {
    var over = db.categories[0].id, under = db.categories[1].id;
    Object.keys(THEMES).forEach(function (th) {
      applyTheme(th);
      drawPvA(
        [{ id: 'P1', date: todayISO(), amount: 100000, categoryId: over },
         { id: 'P2', date: todayISO(), amount: 90000,  categoryId: under }],
        [{ id: 'A1', date: todayISO(), amount: 150000, categoryId: over },
         { id: 'A2', date: todayISO(), amount: 40000,  categoryId: under }]
      );
      var rows = document.querySelectorAll('#pvaChart .pva-row');
      var overAct = getComputedStyle(rows[0].querySelectorAll('.bar > span')[1]).backgroundColor;
      var underAct = getComputedStyle(rows[1].querySelectorAll('.bar > span')[1]).backgroundColor;
      if (overAct !== tok('--danger')) throw new Error(th + ': over bar ' + overAct + ', expected --danger ' + tok('--danger'));
      if (underAct !== tok('--success')) throw new Error(th + ': under bar ' + underAct + ', expected --success ' + tok('--success'));
    });
  });

  applyTheme(was || 'light');
  t.E_unexpected_console_errors = t.consoleErrors.length;
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
