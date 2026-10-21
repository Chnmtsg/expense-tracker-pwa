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
// Category slots (WORK-01, ruling C5). Set in the WORK-01 commit from the
// tuned palettes: closest slot to a state colour measured 0.104, closest two
// slots 0.078 (dark set). On the hex array before it, three slots WERE the
// light state colours (distance 0) and emerald/teal were 0.04 apart.
var SLOT_STATE_APART = 0.10;
var SLOT_SLOT_APART = 0.075;
var SLOTS = 12;

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

  /* Saving more than planned is never painted as overspending (WORK-09,
     C6): not the danger colour on the bar or the word, and not the word
     "over". The Savings bar is still told apart from Planned. */
  flow('a savings row ahead of plan is never danger', function () {
    var sav = db.categories.find(function (c) { return c.group === 'Savings'; });
    if (!sav) throw new Error('setup failed: no Savings category');
    Object.keys(THEMES).forEach(function (th) {
      applyTheme(th);
      drawPvA([{ id: 'P1', date: todayISO(), amount: 100000, categoryId: sav.id }],
              [{ id: 'A1', date: todayISO(), amount: 160000, categoryId: sav.id }]);
      var row = document.querySelector('#pvaChart .pva-row');
      var bars = row.querySelectorAll('.bar > span');
      var plan = getComputedStyle(bars[0]).backgroundColor, act = getComputedStyle(bars[1]).backgroundColor;
      var word = row.querySelector('.pva-head > span:last-child');
      var wordColour = getComputedStyle(word).color;
      if (act === tok('--danger') || act === tok('--danger-text')) throw new Error(th + ': savings bar painted danger ' + act);
      if (wordColour === tok('--danger-text')) throw new Error(th + ': savings word painted --danger-text');
      // Not just "not the danger token": flamingo's --text-2 is a muted red
      // 0.061 from its --danger-text, and read as "over".
      if (chroma(wordColour) > MAX_NEUTRAL_CHROMA) throw new Error(th + ': savings word ' + wordColour + ' is tinted, C=' + chroma(wordColour).toFixed(3));
      if (/^\s*over\b/.test(word.textContent)) throw new Error(th + ': savings row says "' + word.textContent + '"');
      if (act !== tok('--savings')) throw new Error(th + ': savings bar ' + act + ', expected --savings ' + tok('--savings'));
      if (distance(plan, act) < MIN_APART) throw new Error(th + ': savings bar ' + act + ' only ' + distance(plan, act).toFixed(3) + ' from Planned ' + plan);
    });
  });

  /* A negative Left over is never painted on the brand ground (WORK-06).
     The computed gradient names its resolved stops, so the card is read as
     painted: danger-based when negative, the brand pair otherwise. */
  flow('a negative balance sits on a danger ground, never the brand', function () {
    var keep = { income: db.income, actual: db.actual };
    var cid = db.categories[0].id;
    var hero = document.querySelector('.hero-kpi');
    var paint = function (inc, exp) {
      db.income = [{ id: 'HI1', date: todayISO(), amount: inc, type: 'Salary' }];
      db.actual = [{ id: 'HE1', date: todayISO(), amount: exp, categoryId: cid }];
      renderDashboard();
      return getComputedStyle(hero).backgroundImage;
    };
    try {
      navigate('dashboard');
      Object.keys(THEMES).forEach(function (th) {
        applyTheme(th);
        var neg = paint(100000, 250000);
        if (!hero.classList.contains('is-negative')) throw new Error(th + ': negative balance did not mark the card');
        if (neg.indexOf(tok('--hero-neg-from')) < 0 || neg.indexOf(tok('--hero-neg-to')) < 0) throw new Error(th + ': negative card is ' + neg);
        if (neg.indexOf(tok('--primary')) >= 0 && tok('--primary') !== tok('--hero-neg-from')) throw new Error(th + ': negative card still carries the brand ' + tok('--primary'));
        var pos = paint(250000, 100000);
        if (hero.classList.contains('is-negative')) throw new Error(th + ': positive balance kept the negative mark');
        if (pos.indexOf(tok('--hero-from')) < 0) throw new Error(th + ': positive card is ' + pos);
      });
    } finally {
      db.income = keep.income; db.actual = keep.actual;
      renderDashboard();
    }
  });

  /* (a) and (b): every slot is clear of the theme's state colours, and the
     slots are clear of each other, in every theme. Read through the cascade
     (tok), so a shared selector-list block is measured as the browser
     applies it. */
  flow('category colours stay clear of state colours and of each other', function () {
    var worstState = { d: Infinity }, worstPair = { d: Infinity };
    Object.keys(THEMES).forEach(function (th) {
      applyTheme(th);
      var slots = [];
      for (var i = 1; i <= SLOTS; i++) slots.push(tok('--cat-' + i));
      ['--success', '--danger', '--warning'].forEach(function (st) {
        var sc = tok(st);
        slots.forEach(function (c, i) {
          var d = distance(c, sc);
          if (d < worstState.d) worstState = { d: +d.toFixed(3), theme: th, slot: i + 1, state: st };
          if (d < SLOT_STATE_APART) throw new Error(th + ': --cat-' + (i + 1) + ' ' + c + ' is ' + d.toFixed(3) + ' from ' + st + ' ' + sc + ' (min ' + SLOT_STATE_APART + ')');
        });
      });
      for (var a = 0; a < SLOTS; a++) for (var b = a + 1; b < SLOTS; b++) {
        var d = distance(slots[a], slots[b]);
        if (d < worstPair.d) worstPair = { d: +d.toFixed(3), theme: th, slots: [a + 1, b + 1] };
        if (d < SLOT_SLOT_APART) throw new Error(th + ': --cat-' + (a + 1) + ' and --cat-' + (b + 1) + ' only ' + d.toFixed(3) + ' apart (min ' + SLOT_SLOT_APART + ')');
      }
    });
    t.A_worst_slot_state = worstState;
    t.B_worst_slot_pair = worstPair;
  });

  /* The chips paint the slot tokens, not some other source: the Nth
     category's dot is --cat-N in every theme. */
  flow('category chips paint the slot tokens', function () {
    // Chips exist only for categories with spending in range, so each of the
    // first twelve gets one entry today, and every one of them must be found.
    var keep = db.actual;
    var cats = db.categories.slice(0, SLOTS);
    db.actual = cats.map(function (c, i) { return { id: 'CC' + i, date: todayISO(), amount: 1000 + i, categoryId: c.id, notes: '' }; });
    var measured = 0;
    try {
      navigate('daily');
      Object.keys(THEMES).forEach(function (th) {
        applyTheme(th);
        renderDaily();
        cats.forEach(function (c, i) {
          var chip = document.querySelector('[data-chip="' + c.id + '"]');
          if (!chip) throw new Error(th + ': no chip for category ' + (i + 1));
          var painted = getComputedStyle(chip.querySelector('.chip-dot')).backgroundColor;
          if (painted !== tok('--cat-' + (i + 1))) throw new Error(th + ': chip ' + (i + 1) + ' painted ' + painted + ', expected --cat-' + (i + 1) + ' ' + tok('--cat-' + (i + 1)));
          measured++;
        });
      });
    } finally {
      db.actual = keep;
      navigate('dashboard');
    }
    t.A_chips_measured = measured;
  });

  /* (d) A CATEGORY KEEPS ITS COLOUR (WORK-02). Reordering the list and
     deleting the category above must not recolour anything: the colour
     belongs to the category, not to its position. Read as painted, by
     category id, before and after. */
  flow('a category keeps its colour after a reorder and a delete above it', function () {
    var keepCats = db.categories.slice(), keepActual = db.actual;
    var chipColours = function () {
      renderDaily();
      var out = {};
      Array.prototype.forEach.call(document.querySelectorAll('[data-chip]'), function (c) {
        out[c.getAttribute('data-chip')] = getComputedStyle(c.querySelector('.chip-dot')).backgroundColor;
      });
      return out;
    };
    try {
      applyTheme('light');
      navigate('daily');
      db.actual = db.categories.map(function (c, i) { return { id: 'KC' + i, date: todayISO(), amount: 1000 + i, categoryId: c.id, notes: '' }; });
      var before = chipColours();
      if (Object.keys(before).length < 4) throw new Error('setup: only ' + Object.keys(before).length + ' chips');
      // Reorder: move the first category to the end, as a drag would.
      db.categories.push(db.categories.shift());
      var afterMove = chipColours();
      Object.keys(before).forEach(function (id) {
        if (afterMove[id] !== before[id]) throw new Error('reorder recoloured ' + id + ': ' + before[id] + ' -> ' + afterMove[id]);
      });
      // Delete the category now at the top, as the delete button does.
      var gone = db.categories[0].id;
      db.categories = db.categories.filter(function (c) { return c.id !== gone; });
      var afterDel = chipColours();
      Object.keys(afterDel).forEach(function (id) {
        if (id !== gone && afterDel[id] !== before[id]) throw new Error('delete above recoloured ' + id + ': ' + before[id] + ' -> ' + afterDel[id]);
      });
    } finally {
      db.categories = keepCats; db.actual = keepActual;
      navigate('dashboard');
    }
  });

  /* Upgrade keeps every colour: a file written before slots existed, read
     through load() itself, gets (index % 12) + 1 — what the position rule
     painted — including past twelve and including the Loan payment category
     the v2 -> v3 migration appends. Restores the stored bytes afterwards. */
  flow('a file without slots keeps the colours position gave it', function () {
    var raw = localStorage.getItem(KEY);
    try {
      var cats = [];
      for (var i = 0; i < 14; i++) cats.push({ id: 'U' + i, name: 'Cat ' + i, group: 'Needs' });
      localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 2, income: [], planned: [], actual: [], categories: cats, incomeTypes: [{ id: 'T1', name: 'Salary' }], settings: {} }));
      var d = load();
      var got = d.categories.map(function (c) { return c.colorSlot; });
      d.categories.forEach(function (c, idx) {
        if (c.colorSlot !== (idx % 12) + 1) throw new Error(c.name + ' at ' + idx + ' got slot ' + c.colorSlot + ', expected ' + ((idx % 12) + 1) + ' (all: ' + got.join(',') + ')');
      });
      if (!d.categories.some(function (c) { return c.id === LOAN_PAYMENT_CAT_ID; })) throw new Error('setup: migration did not add Loan payment');
    } finally {
      if (raw === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, raw);
    }
  });

  /* A new category takes the lowest free slot, so deleting one and adding
     another reuses the gap rather than repeating a colour in use. */
  flow('a new category takes the lowest unused slot', function () {
    var cats = [1, 2, 4, 5].map(function (n) { return { id: 'N' + n, colorSlot: n }; });
    if (nextColorSlot(cats) !== 3) throw new Error('gap at 3 not reused: got ' + nextColorSlot(cats));
    var full = [];
    for (var n = 1; n <= 12; n++) full.push({ colorSlot: n });
    full.push({ colorSlot: 1 }, { colorSlot: 2 });
    if (nextColorSlot(full) !== 3) throw new Error('least used past twelve should be 3, got ' + nextColorSlot(full));
  });

  applyTheme(was || 'light');
  t.E_unexpected_console_errors = t.consoleErrors.length;
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
