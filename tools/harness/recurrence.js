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

  /* "Due" is forward-looking for a recurring series.
     ------------------------------------------------
     The absence of recLastDone means the user has never LOGGED an occurrence
     of this series, not that a payment was missed — renderExpenses labels a
     recurring plan "Since <date>", which advertises backdating as the way to
     record a standing commitment. The app records bookkeeping actions and may
     not manufacture a financial claim from their absence.

     F3 in this fixture is anchored 2025-10-05, "monthly past", and has been
     sitting here since Stage 0 describing exactly the defect nothing asked
     about: nextPlannedDue returned the anchor however old, so the series held
     a permanently urgent badge, fired an OS notification every day, printed
     four past dates under "Next:", and offered a button that wrote one actual
     expense the user never incurred per tap.

     These assert the contract, not the arithmetic. stepDate is unchanged and
     no aggregation function is involved — plannedOccurrences and
     expandPlannedInRange walk from p.date and never call nextPlannedDue, so
     no past-period total moves. */
  flow('no recurring series reports a due date in the past', function () {
    var today = todayISO();
    var offenders = [];
    db.planned.forEach(function (p) {
      if (!p.recFrequency) return;              // one-offs are a different contract
      var due = nextPlannedDue(p);
      t['D_due_' + p.id] = due;
      if (due && due < today) offenders.push(p.id + ' due ' + due);
    });
    if (!Object.keys(t).some(function (k) { return k.indexOf('D_due_') === 0; })) {
      throw new Error('setup failed: no recurring plans in the fixture to check');
    }
    if (offenders.length) {
      throw new Error('due before today (' + today + '): ' + offenders.join(', '));
    }
  });

  flow('the upcoming list never shows a past date', function () {
    var today = todayISO();
    var f3 = db.planned.filter(function (p) { return p.id === 'F3'; })[0];
    if (!f3) throw new Error('setup failed: F3 is not in the fixture');
    var next4 = upcomingPlannedDates(f3, 4);
    t.E_f3_upcoming = next4.join(',');
    if (next4.length !== 4) throw new Error('expected 4 upcoming dates, got ' + next4.length);
    var past = next4.filter(function (d) { return d < today; });
    if (past.length) {
      throw new Error('"Next:" would print past dates: ' + past.join(', '));
    }
  });

  /* THE OPEN HORIZON — the branch every range above skips.
     ------------------------------------------------------
     All four RANGES entries carry explicit from/to dates, so aggregationEnd's
     and listingEnd's open branches were never executed by any command. That
     branch governs the DEFAULT All-Time view on the Dashboard, Expenses, the
     category chips and both Daily renders — and this probe's own header called
     itself "the recurrence engine's regression guard" while never reaching it.

     Two horizons exist and they deliberately differ:
       aggregationEnd(OPEN_END) -> today          totals stop at today
       listingEnd(OPEN_END)     -> today + 1 year listing looks ahead
     Keeping them apart is the property. Collapse them and either the totals
     start counting money that has not been spent, or the Budget Planning list
     stops showing a plan that has not started yet. */
  flow('an open range aggregates up to today and no further', function () {
    var today = todayISO();
    var all = expandPlannedInRange(db.planned, OPEN_START, OPEN_END);
    t.F_open_occurrences = all.length;
    if (!all.length) throw new Error('setup failed: an open range expanded to nothing');

    var future = all.filter(function (o) { return o.date > today; });
    if (future.length) {
      throw new Error(future.length + ' occurrence(s) after today in an open range, first ' + future[0].date +
                      ' — totals would count money not yet spent');
    }

    // Bounded, not merely finite. F3 is monthly since 2025-10-05, so this is
    // tens. Thousands would mean the horizon collapsed to the guard constant,
    // which is the defect the two horizons exist to prevent.
    var f3 = all.filter(function (o) { return o.id === 'F3' || String(o.id).indexOf('F3:') === 0; });
    t.G_f3_open_count = f3.length;
    if (f3.length < 2) throw new Error('setup failed: F3 should recur many times before today');
    if (f3.length > 100) {
      throw new Error('F3 expanded to ' + f3.length + ' occurrences — the horizon is not bounded by today');
    }
  });

  flow('a plan starting after today is listed but contributes nothing', function () {
    // Built here rather than added to the fixture, so the four range totals
    // above are untouched. Passed by value, so db.planned is not modified.
    var start = parseISO(todayISO());
    start.setDate(start.getDate() + 60);
    var future = {
      id: 'FUTURE', date: toLocalISO(start), amount: 999999,
      categoryId: db.categories[0].id, recFrequency: 'monthly'
    };
    t.H_future_anchor = future.date;

    t.I_listed = hasPlannedOccurrence(future, OPEN_START, OPEN_END);
    t.J_occurrences = expandPlannedInRange([future], OPEN_START, OPEN_END).length;

    if (t.I_listed !== true) {
      throw new Error('a plan starting in 60 days is not listed — listingEnd stopped short of it');
    }
    if (t.J_occurrences !== 0) {
      throw new Error('a plan starting in 60 days contributed ' + t.J_occurrences +
                      ' occurrence(s) to an open total — aggregationEnd ran past today');
    }
  });
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}
document.documentElement.setAttribute('data-probe', JSON.stringify(t));
