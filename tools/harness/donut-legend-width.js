// The Dashboard donut legend's width guard.
//
//   node tools/harness/run.mjs tools/harness/donut-legend-width.js --width 320
//   npm run donut
//
// WHY THIS EXISTS
//
// The legend beside the Needs/Wants/Savings donut puts four things on one
// line: a dot, a category-group name that is a flex item, a bold money figure
// and a percentage. The row is `display: flex` and was never given a wrap, so
// the money figure and the percentage cannot move to a second line. In MNT a
// seven-figure amount is the normal case, not the tail.
//
// The donut sits in a 140px svg with `flex-shrink: 0`, so what the legend gets
// is the card interior minus 140 minus the gap. The row does not scroll and
// the card does not clip, so an overflow here paints outside the card and
// pushes the PAGE sideways — which ui-guidelines.md forbids outright and which
// nothing else in tools/ measures. Every other width probe in this directory
// watches a list row; this watches the one flex row on the home screen whose
// content is a currency figure of unbounded width.
//
// It runs at three widths because the failure is data-dependent and arrives at
// different widths for different magnitudes: a five-figure amount fits at 390
// and not at 320. A pass at one width is not a claim about the others.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;

  // One category per group, so all three legend rows carry a figure. If the
  // seed data does not offer three groups the assertion below says so rather
  // than the probe quietly measuring two rows.
  var byGroup = {};
  db.categories.forEach(function (c) { if (!byGroup[c.group]) byGroup[c.group] = c.id; });
  t.groups_found = Object.keys(byGroup);

  var today = todayISO();
  db.actual = [];
  var n = 0;
  Object.keys(byGroup).forEach(function (grp) {
    n++;
    // Seven figures: the normal magnitude in MNT and the one that sets the
    // row's unshrinkable width.
    db.actual.push({ id: 'D' + n, date: today, amount: 1250000 + n, categoryId: byGroup[grp] });
  });
  db.income = [];
  db.planned = [];
  save();

  navigate('dashboard');
  var r = computeRange('all');
  document.getElementById('dashPreset').value = 'all';
  document.getElementById('dashFrom').value = r.from;
  document.getElementById('dashTo').value = r.to;
  renderDashboard();

  flow('the legend rendered the rows this measures', function () {
    var rows = document.querySelectorAll('#donutLegend .row');
    t.legend_row_count = rows.length;
    // run.mjs:45 — a probe that reports zero matches is not a pass.
    if (rows.length !== 3) throw new Error('expected 3 legend rows, got ' + rows.length);
    var anyFigure = false;
    Array.prototype.forEach.call(rows, function (row) {
      if (/\d/.test(row.textContent)) anyFigure = true;
    });
    if (!anyFigure) throw new Error('legend rows carry no figure, so width is not being measured');
  });

  // MEASURE THE LEGEND AGAINST THE CARD, NOT THE ROWS AGAINST THE LEGEND.
  //
  // The obvious assertion — does each .row overflow #donutLegend — passes even
  // when the page is 51px too wide, and the reason is the whole defect. The
  // legend is a flex item at its initial `min-width: auto`, so it cannot
  // shrink below its own min-content: instead of the rows overflowing the
  // legend, the LEGEND grows to fit the rows and overflows the card. Rows
  // measured against a column that resized itself to hold them always fit.
  //
  // So the boundary that matters is the card's content box, which does not
  // move.
  flow('the donut and its legend fit inside the card', function () {
    var legend = document.getElementById('donutLegend');
    var wrap = legend.closest('.donut-wrap');
    var card = wrap.closest('.card');
    var legendRect = legend.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    // The card's padding is real space the content may not use.
    var pad = parseFloat(getComputedStyle(card).paddingRight) || 0;
    var limit = cardRect.right - pad;

    t.legend_width = Math.round(legendRect.width);
    t.card_content_right = Math.round(limit);
    t.legend_right = Math.round(legendRect.right);
    t.legend_overflow_px = Math.round(legendRect.right - limit);

    t.rows = [];
    Array.prototype.forEach.call(legend.querySelectorAll('.row'), function (row, i) {
      var rect = row.getBoundingClientRect();
      t.rows.push({
        i: i,
        text: row.textContent.replace(/\s+/g, ' ').trim(),
        w: Math.round(rect.width),
        right: Math.round(rect.right),
        lines: Math.round(rect.height / 20)
      });
    });

    if (legendRect.right > limit + 1) {
      throw new Error('the legend overflows the card by ' + t.legend_overflow_px + 'px');
    }
  });

  flow('the page does not scroll sideways', function () {
    t.scrollWidth = document.documentElement.scrollWidth;
    t.clientWidth = document.documentElement.clientWidth;
    if (t.scrollWidth > t.clientWidth) {
      throw new Error('page scrolls sideways: scrollWidth ' + t.scrollWidth + ' > clientWidth ' + t.clientWidth);
    }
  });
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
