// The recurrence engine's regression guard.
//
//   node tools/harness/run.mjs tools/harness/recurrence.js --fixture
//   npm run recurrence
//
// WHY THIS EXISTS
//
// tools/harness/fixture.js has carried four expected totals and four expected
// plan counts since Stage 0 — the numbers VERIFICATION.md §3 derives and §5's
// gate-close checklist is written in terms of — plus sumOccurrences() and
// plansListed() to evaluate them. Nothing ever ran them. No probe used
// --fixture, so HANDOFF's instruction to "run that after any change to
// recurrence, filtering or the dashboard" could not be followed: the next
// engineer had to write the runner first, and so nobody did.
//
// The recurrence engine has the longest defect history in this application —
// ARCH-1's overflowing month step, the cursor that walked away from its
// anchor, totals that came out as the guard constant. It had no command that
// would catch a regression in any of them. It does now.
//
// It also answers the strongest argument against the deferred Stage 2 test
// harness: that no command in this project would surface a calculation defect.
// One does. That strengthens the deferral rather than weakening it.
//
// A probe, not a sixth runner: run.mjs executes it, exactly as it executes
// v1-write-flows.js and boot-crash.js.
var t = { flows: [], results: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}

try {
  if (typeof loadFixture !== 'function' || typeof RANGES === 'undefined') {
    throw new Error('setup failed: fixture not injected — run with --fixture');
  }
  loadFixture();
  t.A_plans_loaded = db.planned.length;
  if (t.A_plans_loaded !== 5) {
    throw new Error('setup failed: expected the 5-plan fixture, got ' + t.A_plans_loaded);
  }

  // Each range is its own flow, so one wrong total does not hide the other three.
  RANGES.forEach(function (r) {
    flow('range ' + r.key + ' (' + r.from + '..' + r.to + ')', function () {
      var total = sumOccurrences(r.from, r.to);
      var plans = plansListed(r.from, r.to);
      t.results.push({ key: r.key, total: total, plans: plans, expectTotal: r.expectTotal, expectPlans: r.expectPlans });
      if (total !== r.expectTotal) {
        throw new Error('total ' + total + ', expected ' + r.expectTotal);
      }
      if (plans !== r.expectPlans) {
        throw new Error('plan count ' + plans + ', expected ' + r.expectPlans);
      }
    });
  });

  // The monthly-31st clamp, which is ARCH-1's own case: a plan anchored on the
  // 31st must land on the last day of a short month and RETURN to the 31st
  // afterwards, rather than overflowing into the next month and sticking there.
  flow('monthly anchored on the 31st clamps and recovers', function () {
    var feb = expandPlannedInRange(db.planned, '2026-02-01', '2026-02-28')
      // A projected occurrence carries the synthetic id "<seriesId>:<date>";
      // only the occurrence landing on the plan's own anchor date keeps the
      // plain id. Match both or the recurring ones are invisible.
      .filter(function (x) { return x.id === 'F2' || String(x.id).indexOf('F2:') === 0; });
    var mar = expandPlannedInRange(db.planned, '2026-03-01', '2026-03-31')
      // A projected occurrence carries the synthetic id "<seriesId>:<date>";
      // only the occurrence landing on the plan's own anchor date keeps the
      // plain id. Match both or the recurring ones are invisible.
      .filter(function (x) { return x.id === 'F2' || String(x.id).indexOf('F2:') === 0; });
    t.B_feb_31st = feb.map(function (x) { return x.date; }).join(',');
    t.C_mar_31st = mar.map(function (x) { return x.date; }).join(',');
    if (t.B_feb_31st !== '2026-02-28') {
      throw new Error('February occurrence should clamp to 2026-02-28, got "' + t.B_feb_31st + '"');
    }
    if (t.C_mar_31st !== '2026-03-31') {
      throw new Error('March should return to the 31st anchor, got "' + t.C_mar_31st + '"');
    }
  });
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}
document.documentElement.setAttribute('data-probe', JSON.stringify(t));
