// Screen navigation, as a command. Runs at the default width, NOT --width:
// a --width run puts the app inside an iframe, and an iframe does not restore
// scroll on a history traversal, so a scroll probe there passes on a defect
// a phone shows. Measured: in this frame `history.back()` put 600 back.
//
//   node tools/harness/run.mjs tools/harness/navigation.js
//   npm run navigation
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
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// WORK-02 / Sprint 1 review CODE-01: a screen reached through the More sheet
// opens at the top AFTER the sheet's deferred history traversal, which used
// to restore the scroll offset saved when the sheet opened.
function moreNavFlow() {
  navigate('dashboard');
  window.scrollTo(0, 600);
  var from = window.scrollY;
  if (from < 100) throw new Error('fixture: Home is not tall enough to scroll (' + from + ')');
  document.getElementById('moreBtn').click();
  document.querySelector('[data-more-nav="settings"]').click();
  return wait(300).then(function () {
    if (!document.getElementById('settings').classList.contains('active')) throw new Error('More did not open Settings');
    if (window.scrollY !== 0) throw new Error('Settings via More opened at scrollY ' + window.scrollY + ' (Home was at ' + from + ')');
    if (history.state && history.state.appModal) throw new Error('a modal history entry was left behind');
  });
}

// Back still closes a sheet, and a sheet still keeps the page where it was.
function sheetKeepsPlaceFlow() {
  navigate('settings');
  window.scrollTo(0, 500);
  var at = window.scrollY;
  document.getElementById('moreBtn').click();
  history.back();
  return wait(300).then(function () {
    if (document.getElementById('moreSheet').classList.contains('show')) throw new Error('Back did not close the sheet');
    if (window.scrollY !== at) throw new Error('closing a sheet moved the page from ' + at + ' to ' + window.scrollY);
    navigate('dashboard');
  });
}

// The limit dialog's Move, through the real dialog: Accounts opens with the
// prefilled amount in view once the dialog's history entry is gone.
function moveHandoffFlow() {
  var cid = db.categories[0].id;
  db.accounts = [{ id: 'N1', name: 'Needs', opening: 10000 }, { id: 'N2', name: 'Spare', opening: 500000 }];
  db.transfers = []; db.actual = []; db.income = [];
  save();
  setExpMode('actual'); navigate('expenses');
  document.getElementById('expAccount').value = 'N1';
  document.getElementById('expCategory').value = cid;
  document.getElementById('expAmount').value = '50,000';
  window.scrollTo(0, 400);
  document.getElementById('expAdd').click();
  return wait(100).then(function () {
    if (!document.getElementById('confirmModal').classList.contains('show')) throw new Error('the limit dialog did not open');
    document.getElementById('confirmOk').click();
    return wait(300);
  }).then(function () {
    if (!document.getElementById('accounts').classList.contains('active')) throw new Error('Move did not open Accounts');
    var r = document.getElementById('trAmount').getBoundingClientRect();
    if (!(r.height > 0)) throw new Error('the Move amount is not rendered');
    if (r.top < 0 || r.bottom > window.innerHeight) throw new Error('the Move amount is out of view: ' + r.top + '..' + r.bottom + ' of ' + window.innerHeight);
    if (db.actual.length) throw new Error('Move saved the expense');
    document.getElementById('expAmount').value = '';
    db.accounts = []; db.transfers = []; save();
    navigate('dashboard');
  });
}

try { t.viewport_clientWidth = document.documentElement.clientWidth; } catch (e) { t.flows.push('setup: THREW ' + e.message); }
Promise.resolve()
  .then(asyncFlow('a screen reached through the More sheet opens at the top', moreNavFlow))
  .then(asyncFlow('Back closes a sheet and leaves the page where it was', sheetKeepsPlaceFlow))
  .then(asyncFlow('the limit dialog Move opens Accounts with the amount in view', moveHandoffFlow))
  .then(publish, publish);
