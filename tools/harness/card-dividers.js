// The two consolidated cards divide the same way.
//
//   node tools/harness/run.mjs tools/harness/card-dividers.js --width 320
//   npm run dividers
//
// WHY THIS EXISTS
//
// The Dashboard's KPI strip and the Analytics stats strip are one pattern —
// several readings grouped into a single card with hairline rules instead of a
// bordered, shadowed tile each. They were introduced by one change, for the
// same reason, on the two screens that needed it, and they were built
// differently: one put the horizontal padding on the CARD and the rule on the
// row, the other put the padding on the TILE and the rule on the tile's edge.
// The visible difference is where the hairline stops — inset from the card's
// border on the Dashboard, running into it on Analytics.
//
// That is not a defect a user reports and it is not something a stylesheet
// diff shows either, because both spellings look reasonable in isolation. It
// is only visible as a number: the distance from the card's left edge to where
// its divider starts. So that is what this measures, on both screens, and it
// asserts they agree rather than asserting either one's value — the point is
// consistency, and a hardcoded 16 here would be one more claim to go stale if
// the spacing scale ever moves.
//
// It also checks that neither card needs `overflow: hidden` to keep its
// corners, which is the property the inset form buys and the reason it won.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}

// The gap between a card's border box and where a child's border begins.
function insetOf(card, childSelector, side) {
  var card_r = card.getBoundingClientRect();
  var child = card.querySelector(childSelector);
  if (!child) throw new Error('no ' + childSelector + ' inside the card');
  var child_r = child.getBoundingClientRect();
  return side === 'left'
    ? Math.round(child_r.left - card_r.left)
    : Math.round(card_r.right - child_r.right);
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;

  var byGroup = {};
  db.categories.forEach(function (c) { if (!byGroup[c.group]) byGroup[c.group] = c.id; });
  var today = todayISO();
  db.actual = [];
  var n = 0;
  Object.keys(byGroup).forEach(function (grp) {
    n++;
    db.actual.push({ id: 'V' + n, date: today, amount: 1250000 + n, categoryId: byGroup[grp] });
  });
  db.income = [{ id: 'VI1', date: today, amount: 3400000, typeId: db.incomeTypes[0].id }];
  db.planned = [];
  save();

  navigate('dashboard');
  var r = computeRange('all');
  document.getElementById('dashPreset').value = 'all';
  document.getElementById('dashFrom').value = r.from;
  document.getElementById('dashTo').value = r.to;
  renderDashboard();

  // MEASURE EACH CARD WHILE ITS OWN SCREEN IS SHOWING. Every screen stays in
  // the DOM and the inactive ones are display:none, and a display:none element
  // reports a zero-sized rect from getBoundingClientRect - so measuring the
  // Dashboard card from the Analytics screen returns 0 for every distance and
  // the comparison silently passes or fails on nothing. The first version of
  // this probe did exactly that and reported a 0px inset for a card that has
  // 16px of padding.
  var kpiCard = document.querySelector('.kpi-strip');
  var kpiRows = document.querySelectorAll('.kpi-strip .kpi-mini');
  t.kpi_row_count = kpiRows.length;
  t.kpi_visible_when_measured = kpiCard.getBoundingClientRect().width > 0;
  t.kpi_inset_left = insetOf(kpiCard, '.kpi-mini + .kpi-mini', 'left');
  t.kpi_inset_right = insetOf(kpiCard, '.kpi-mini + .kpi-mini', 'right');
  t.kpi_overflow = getComputedStyle(kpiCard).overflow;

  navigate('daily');
  document.getElementById('dailyPreset').value = 'all';
  document.getElementById('dailyFrom').value = r.from;
  document.getElementById('dailyTo').value = r.to;
  renderDaily();

  var statCard = document.querySelector('.stat-strip');
  var statTiles = document.querySelectorAll('.stat-strip .stat-tile');
  t.stat_tile_count = statTiles.length;
  t.stat_visible_when_measured = statCard.getBoundingClientRect().width > 0;
  t.stat_inset_left = insetOf(statCard, '.stat-tile:first-child', 'left');
  t.stat_inset_right = insetOf(statCard, '.stat-tile:nth-child(2)', 'right');
  t.stat_overflow = getComputedStyle(statCard).overflow;

  flow('both cards were measured while visible, with the rows this compares', function () {
    // run.mjs:45 — a probe that reports zero matches is not a pass. Here the
    // zero that matters is a zero-sized rect, not a zero-length list.
    if (!t.kpi_visible_when_measured) throw new Error('the KPI card was not showing when it was measured');
    if (!t.stat_visible_when_measured) throw new Error('the stats card was not showing when it was measured');
    if (t.kpi_row_count !== 3) throw new Error('expected 3 KPI rows, got ' + t.kpi_row_count);
    if (t.stat_tile_count !== 4) throw new Error('expected 4 stat tiles, got ' + t.stat_tile_count);
  });

  flow('the two cards inset their dividers by the same amount', function () {
    if (t.kpi_inset_left !== t.stat_inset_left) {
      throw new Error('left inset differs: kpi ' + t.kpi_inset_left + ' vs stat ' + t.stat_inset_left);
    }
    if (t.kpi_inset_right !== t.stat_inset_right) {
      throw new Error('right inset differs: kpi ' + t.kpi_inset_right + ' vs stat ' + t.stat_inset_right);
    }
    if (t.kpi_inset_left < 1) {
      throw new Error('the dividers are not inset at all: ' + t.kpi_inset_left);
    }
  });

  flow('neither card relies on overflow:hidden to keep its corners', function () {
    var clipped = [];
    if (t.kpi_overflow === 'hidden') clipped.push('.kpi-strip');
    if (t.stat_overflow === 'hidden') clipped.push('.stat-strip');
    // Not a defect in itself — but the inset form was chosen BECAUSE it does
    // not need the clip, so a clip reappearing means the pattern drifted back.
    if (clipped.length) throw new Error('still clipping: ' + JSON.stringify(clipped));
  });

  flow('the page does not scroll sideways', function () {
    t.scrollWidth = document.documentElement.scrollWidth;
    t.clientWidth = document.documentElement.clientWidth;
    if (t.scrollWidth > t.clientWidth) {
      throw new Error('page scrolls sideways: ' + t.scrollWidth + ' > ' + t.clientWidth);
    }
  });
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
