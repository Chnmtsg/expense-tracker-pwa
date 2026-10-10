// Savings Goals, as a command. The first probe of its own for this module.
//
//   node tools/harness/run.mjs tools/harness/goals.js
//   npm run goals
//
// WORK-08: recLastLogged is an occurrence date wherever it is written. Deleting
// a contribution rolled it back to a contribution's OWN date, so a manual
// top-up on another weekday moved a weekly schedule to that weekday for good.
var t = { flows: [] };
function publish() {
  document.documentElement.setAttribute('data-probe', JSON.stringify(t));
}
function asyncFlow(name, fn) {
  return function () {
    return Promise.resolve().then(fn).then(
      function () { t.flows.push(name + ': ok'); },
      function (e) { t.flows.push(name + ': THREW ' + (e && e.message ? e.message : e)); });
  };
}
function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
function iso(days) { var d = new Date(); d.setDate(d.getDate() + days); return toLocalISO(d); }

function cursorFlow() {
  var real = window.confirmDialog;
  window.confirmDialog = function () { return Promise.resolve(true); };
  var start = iso(-42), wk1 = iso(-35), topUp = iso(-33), wk2 = iso(-28);
  db.accounts = []; db.transfers = [];
  db.goals = [{ id: 'G', name: 'Trip', target: 1000000, icon: '🎯', deadline: '', notes: '', createdDate: start,
    recFrequency: 'weekly', recAmount: 10000, recStartDate: start, recIntervalDays: null, recLastLogged: wk2 }];
  db.goalContributions = [
    { id: 'C0', goalId: 'G', date: start, amount: 10000, notes: 'Auto-scheduled contribution' },
    { id: 'C1', goalId: 'G', date: wk1, amount: 10000, notes: 'Auto-scheduled contribution' },
    { id: 'CT', goalId: 'G', date: topUp, amount: 5000, notes: 'top-up' },
    { id: 'C2', goalId: 'G', date: wk2, amount: 10000, notes: 'Auto-scheduled contribution' }
  ];
  save(); navigate('goals');
  function del(id) {
    openGoalHistoryModal('G');
    document.querySelector('#editModalBody [data-del-contrib="' + id + '"]').click();
    return tick();
  }
  return del('C2').then(function () {
    var g = db.goals[0];
    // The newest left is the top-up, two days after an occurrence.
    if (g.recLastLogged !== wk1) throw new Error('rolled back to ' + g.recLastLogged + ', expected the occurrence ' + wk1 + ' (top-up was ' + topUp + ')');
    var next = computeNextRecurring({ startDate: g.recStartDate, lastLogged: g.recLastLogged, frequency: g.recFrequency, intervalDays: g.recIntervalDays });
    // The walk advances to today or later; today is an occurrence (start is
    // six weeks back), so a schedule still on its weekday is due today.
    if (next !== iso(0)) throw new Error('the next due date left the schedule: ' + next + ', expected ' + iso(0));
    return del('C1').then(function () { return del('CT'); }).then(function () { return del('C0'); });
  }).then(function () {
    if (db.goals[0].recLastLogged !== null) throw new Error('with no contributions left the cursor is ' + db.goals[0].recLastLogged);
    closeEditModal();
    db.goals = []; db.goalContributions = []; save();
  }).finally(function () { window.confirmDialog = real; });
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;
} catch (e) { t.flows.push('setup: THREW ' + e.message); }

Promise.resolve()
  .then(asyncFlow('deleting a contribution keeps a weekly schedule on its own weekday', cursorFlow))
  .then(publish, publish);
