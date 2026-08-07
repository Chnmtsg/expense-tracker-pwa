// The deferred performance measurement, as a probe.
//
//   node tools/harness/run.mjs tools/harness/perf.js
//
// WHY THIS EXISTS, AND WHY IT IS NOT IN THE RUNBOOK
//
// Two costs have been carried as deferrals on the same grounds — an arithmetic
// argument that nobody had turned into a number:
//
//   WORK-16/49 / WORK-156   drawMonthlyTrend walks the whole store once per
//                           month (index.html:7074-7083). Six rounds deferred.
//   WORK-202 (a risk)       renderDebts makes about six full passes over
//                           db.debtPayments per debt. Rejected as scheduled
//                           work and recorded as a risk with this trigger.
//
// Both triggers name the same instrument — "a probe under tools/harness/, run
// through run.mjs" — and the standing decision says that if the first
// measurement is ever taken, renderDebts rides in the SAME probe rather than
// earning a second one. So both live here.
//
// THIS IS NOT ONE OF THE FIVE COMMANDS and must not be added to them. It is a
// measurement taken by hand when someone wants the number, not a gate. It has
// no npm script for the same reason: the runbook says five, WORK-206 corrected
// it to say five, and a sixth entry would make a measurement look like a check.
//
// IT ASSERTS NOTHING ABOUT THE FIGURES, deliberately. The trigger is "above
// 100ms", and if this probe threw on that it would turn a decision to schedule
// work into a red build. It asserts only that the measurement is TRUSTWORTHY —
// see the calibration below — and reports the numbers for a human to compare
// against the trigger. C42(b): every figure here is labelled a measurement, and
// this paragraph is the reason it is not asserted.
var t = { flows: [] };

/* THE CALIBRATION IS THE POINT, and without it every figure below is suspect.
   run.mjs drives Chrome with --virtual-time-budget, which makes the clock
   advance on the browser's terms rather than the wall's. If performance.now()
   reported virtual time across a synchronous block, a "measurement" here would
   be an artifact of the harness and would read as fast or as slow as the flag
   felt like. So the probe first spends a known amount of real time in a busy
   loop and checks that it can see it. If it cannot, it THROWS instead of
   reporting a number nobody should trust — the same rule as "a probe that
   reports zero matches is not a pass". */
function busyFor(ms) {
  var end = Date.now() + ms;
  var n = 0;
  while (Date.now() < end) { n += Math.sqrt(n + 1); }
  return n;
}

function timeIt(fn) {
  var a = performance.now();
  fn();
  return performance.now() - a;
}

// Median, not mean: one GC pause in five runs should not decide a six-round
// deferral.
function median(xs) {
  var s = xs.slice().sort(function (a, b) { return a - b; });
  var mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function setDashPreset(id) {
  var sel = document.getElementById('dashPreset');
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
}

try {
  t.calibration_ms = Math.round(timeIt(function () { busyFor(50); }));
  if (t.calibration_ms < 25 || t.calibration_ms > 250) {
    throw new Error('the clock in this harness cannot measure a known 50ms of work — ' +
                    'it reported ' + t.calibration_ms + 'ms, so every figure in this ' +
                    'probe would be an artifact of --virtual-time-budget rather than a cost');
  }

  /* WORK-16/49 — THE SEEDED STORE THE TRIGGER NAMES.
     5,000 income-plus-actual records, spread across three years so the All Time
     case actually builds a long month list. The trigger is stated against the
     "This Month" configuration specifically, on the ground that it is the one
     the user cannot escape by narrowing the filter. Both are reported, because
     All Time is where the arithmetic says the cost lives and reporting only the
     cheaper case would be choosing the answer. */
  var HALF = 2500;
  var inc = [], act = [];
  for (var i = 0; i < HALF; i++) {
    // Deterministic spread, no Math.random: a measurement that cannot be
    // re-run against the same store is not a measurement.
    var d = new Date(2024, (i * 7) % 36, ((i * 13) % 27) + 1);
    var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
              '-' + String(d.getDate()).padStart(2, '0');
    inc.push({ id: 'I' + i, date: iso, amount: 10000 + (i % 500), typeId: db.incomeTypes[0].id, notes: '' });
    act.push({ id: 'A' + i, date: iso, amount: 5000 + (i % 300), categoryId: db.categories[0].id, notes: '' });
  }
  db.income = inc;
  db.actual = act;
  t.seeded_records = db.income.length + db.actual.length;
  if (t.seeded_records !== 5000) {
    throw new Error('setup failed: seeded ' + t.seeded_records + ' records, the trigger names 5000');
  }

  navigate('dashboard');

  // Warm once so the first figure is not measuring first-call JIT.
  renderDashboard();

  setDashPreset('thisMonth');
  var thisMonth = [];
  for (var r = 0; r < 5; r++) thisMonth.push(timeIt(renderDashboard));
  t.M_dashboard_thisMonth_ms = Math.round(median(thisMonth));
  t.M_dashboard_thisMonth_runs = thisMonth.map(function (x) { return Math.round(x); }).join(',');

  setDashPreset('all');
  var allTime = [];
  for (var r2 = 0; r2 < 5; r2++) allTime.push(timeIt(renderDashboard));
  t.M_dashboard_allTime_ms = Math.round(median(allTime));
  t.M_dashboard_allTime_runs = allTime.map(function (x) { return Math.round(x); }).join(',');

  /* The month count is what the per-month full scan multiplies by, so it is the
     figure that EXPLAINS the two above rather than merely accompanying them.
     The columns are `.col` inside #monthlyChart (index.html:7106). Asserted
     rather than reported, because a count of zero here would silently turn the
     explanation into a fallback artifact — the first version of this line read
     `.mc-col`, matched nothing, fell through to counting the chart's own child
     elements and reported "1 month" for a three-year store. */
  t.M_allTime_months = document.querySelectorAll('#monthlyChart .col').length;
  if (t.M_allTime_months < 2) {
    throw new Error('setup failed: the All Time trend drew ' + t.M_allTime_months +
                    ' month column(s) over a three-year store — the per-month scan ' +
                    'this probe exists to measure did not happen');
  }

  /* WORK-202 — 200 debts and 5,000 payments, the store its trigger names. */
  var debts = [], pays = [];
  for (var j = 0; j < 200; j++) {
    debts.push({ id: 'D' + j, name: 'Lender ' + j, date: '2025-01-15',
                 principal: 1000000, totalToRepay: 1300000, notes: '' });
  }
  for (var k = 0; k < 5000; k++) {
    pays.push({ id: 'P' + k, debtId: 'D' + (k % 200), date: '2025-06-10',
                amount: 1000, notes: '' });
  }
  db.debts = debts;
  db.debtPayments = pays;
  t.seeded_debts = db.debts.length;
  t.seeded_payments = db.debtPayments.length;

  navigate('debts');
  renderDebts();                       // warm
  var debtRuns = [];
  for (var r3 = 0; r3 < 5; r3++) debtRuns.push(timeIt(renderDebts));
  t.N_debts_ms = Math.round(median(debtRuns));
  t.N_debts_runs = debtRuns.map(function (x) { return Math.round(x); }).join(',');

  if (!document.querySelector('.debt-card')) {
    throw new Error('setup failed: no debt card rendered, so renderDebts was timed over nothing');
  }

  t.flows.push('measurement taken: ok');
} catch (e) {
  t.flows.push('measurement: THREW ' + String(e && e.message ? e.message : e));
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
