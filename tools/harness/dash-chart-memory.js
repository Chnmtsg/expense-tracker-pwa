// The Dashboard remembers which chart you left it on.
//
//   node tools/harness/run.mjs tools/harness/dash-chart-memory.js
//   npm run dashchart
//
// WHY THIS EXISTS
//
// Two things here are easy to get wrong and invisible when they are.
//
// The first is the storage shape. The chart tab has no key of its own — it
// rides the Dashboard's existing filter entry, because it is the same idea
// ("how the user left this view") and because a second key for one enum is not
// worth a migration. That only works because saveFilterState MERGES into a
// prefix instead of replacing it: every other caller writes preset/from/to
// together, so before this the two spellings were indistinguishable, and a
// replace would silently drop the chart on the next preset change. That is the
// flow below that would have caught it, and it is the reason this file exists
// rather than a comment.
//
// The second is the fallback. A stored pane name from a build with a different
// set of charts matches nothing, and the naive restore leaves every pane
// hidden — a card that looks like it failed to render, from a value that was
// valid when it was written.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}
function activePane() {
  var p = document.querySelector('.dash-pane.active');
  return p ? p.dataset.dashPane : null;
}
try {
  navigate('dashboard');
  t.default_pane = activePane();

  flow('the default pane is showing and exactly one pane is active', function () {
    if (document.querySelectorAll('.dash-pane.active').length !== 1) {
      throw new Error('expected exactly 1 active pane, got ' + document.querySelectorAll('.dash-pane.active').length);
    }
    if (t.default_pane !== 'split') throw new Error('expected split, got ' + t.default_pane);
  });

  flow('pressing a tab selects its pane and stores it', function () {
    var btn = document.querySelector('.segmented button[data-dash-chart="trend"]');
    btn.click();
    t.after_click = activePane();
    t.stored = (JSON.parse(localStorage.getItem(FILTER_STATE_KEY) || '{}').dash || {}).chart;
    if (t.after_click !== 'trend') throw new Error('pane is ' + t.after_click);
    if (t.stored !== 'trend') throw new Error('stored is ' + JSON.stringify(t.stored));
  });

  flow('a preset change does not wipe the stored chart', function () {
    var sel = document.getElementById('dashPreset');
    sel.value = 'all';
    sel.dispatchEvent(new Event('change'));
    t.stored_after_preset = (JSON.parse(localStorage.getItem(FILTER_STATE_KEY) || '{}').dash || {}).chart;
    t.preset_after = (JSON.parse(localStorage.getItem(FILTER_STATE_KEY) || '{}').dash || {}).preset;
    if (t.stored_after_preset !== 'trend') throw new Error('chart lost on preset change: ' + JSON.stringify(t.stored_after_preset));
    if (t.preset_after !== 'all') throw new Error('preset not stored: ' + JSON.stringify(t.preset_after));
  });

  flow('the stored pane is what a fresh boot would restore', function () {
    var restored = setDashChart((loadFilterState().dash || {}).chart || DASH_CHART_DEFAULT);
    t.restored = restored;
    if (restored !== 'trend') throw new Error('restored ' + restored);
    if (activePane() !== 'trend') throw new Error('active pane after restore is ' + activePane());
  });

  flow('an unrecognised stored pane falls back instead of hiding everything', function () {
    var picked = setDashChart('a-pane-from-some-other-build');
    t.fallback_pick = picked;
    t.fallback_active = activePane();
    if (picked !== 'split') throw new Error('fallback picked ' + picked);
    if (document.querySelectorAll('.dash-pane.active').length !== 1) {
      throw new Error('fallback left ' + document.querySelectorAll('.dash-pane.active').length + ' panes active');
    }
  });

  flow('the tab button and the pane agree after every path above', function () {
    var pressed = document.querySelectorAll('.segmented button[data-dash-chart][aria-pressed="true"]');
    t.pressed_count = pressed.length;
    if (pressed.length !== 1) throw new Error('expected 1 pressed tab, got ' + pressed.length);
    if (pressed[0].dataset.dashChart !== activePane()) {
      throw new Error('tab ' + pressed[0].dataset.dashChart + ' but pane ' + activePane());
    }
  });

  /* WORK-04. More than 36 months of history must show the LATEST 36, and say
     so. The cap used to count from the start, so a 40-month store drew its
     oldest months and dropped the newest under "All time". perf.js seeds
     exactly 36 months, which is why nothing caught it: this seeds 40. */
  flow('the Monthly Trend keeps the newest months beyond 36', function () {
    var savedIncome = db.income, savedActual = db.actual;
    var now = new Date();
    db.income = []; db.actual = [];
    for (var i = 0; i < 40; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      db.income.push({ id: 'trend' + i, date: toLocalISO(d), amount: 1000 + i, typeId: db.incomeTypes[0].id, notes: '' });
    }
    try {
      drawMonthlyTrend('', '');
      var cols = document.querySelectorAll('#monthlyChart .col .lbl');
      t.trend_cols = cols.length;
      t.trend_last = cols.length ? cols[cols.length - 1].textContent : null;
      t.trend_first = cols.length ? cols[0].textContent : null;
      t.trend_label = document.getElementById('trendRangeLbl').textContent;
      var want = monthNames[now.getMonth()] + " '" + String(now.getFullYear()).slice(2);
      var oldest = new Date(now.getFullYear(), now.getMonth() - 35, 1);
      var wantFirst = monthNames[oldest.getMonth()] + " '" + String(oldest.getFullYear()).slice(2);
      if (t.trend_cols !== 36) throw new Error('expected 36 columns, got ' + t.trend_cols);
      if (t.trend_last !== want) throw new Error('newest column is ' + t.trend_last + ', expected ' + want);
      if (t.trend_first !== wantFirst) throw new Error('oldest column is ' + t.trend_first + ', expected ' + wantFirst);
      if (!/^Latest 36 months/.test(t.trend_label)) throw new Error('label does not say it is clamped: ' + t.trend_label);
    } finally {
      db.income = savedIncome; db.actual = savedActual;
    }
  });
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}
document.documentElement.setAttribute('data-probe', JSON.stringify(t));
