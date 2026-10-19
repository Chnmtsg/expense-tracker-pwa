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

// Sprint 1 review UI-02: Expenses and Budget Planning share one screen, so a
// switch between them is a change of mode, and the Expenses tab back from
// Planned opens at the top. Planned is reached from the screen's own control
// and from Home's Plan expenses link (see planLinkFlow). More no longer
// carries a Budget Planning entry.
function budgetSwitchFlow() {
  var cid = db.categories[0].id, i;
  db.accounts = []; db.actual = []; db.planned = [];
  for (i = 0; i < 40; i++) db.actual.push({ id: 'X' + i, date: todayISO(), amount: 1000 + i, categoryId: cid, notes: '' });
  for (i = 0; i < 40; i++) db.planned.push({ id: 'Y' + i, date: todayISO(), amount: 1000 + i, categoryId: cid, notes: '' });
  save();
  if (document.querySelector('[data-more-nav="budget"]')) throw new Error('More still has a Budget Planning entry');
  document.querySelector('nav.tabbar button[data-nav="expenses"]').click();
  document.querySelector('.segmented button[data-exp="planned"]').click();
  if (expMode !== 'planned') throw new Error('the Planned control did not open Budget Planning');
  if (document.getElementById('hdrTitle').textContent !== 'Budget Planning') throw new Error('Planned is headed "' + document.getElementById('hdrTitle').textContent + '"');
  window.scrollTo(0, 800);
  var from = window.scrollY;
  if (from < 200) throw new Error('fixture: Budget Planning is not tall enough to scroll (' + from + ')');
  document.querySelector('nav.tabbar button[data-nav="expenses"]').click();
  return wait(100).then(function () {
    if (expMode !== 'actual') throw new Error('the Expenses tab did not switch back');
    if (window.scrollY !== 0) throw new Error('Expenses from Budget Planning opened at scrollY ' + window.scrollY);
    db.actual = []; db.planned = []; save();
    navigate('dashboard');
  });
}

// Chief Architect review 3, WORK-01: Home's Budget pane is the named way into
// Budget Planning, and it opens Expenses in Planned mode from Actual.
function planLinkFlow() {
  setExpMode('actual');
  navigate('dashboard');
  document.querySelector('.segmented button[data-dash-chart="plan"]').click();
  var link = document.getElementById('dashPlanLink');
  if (!link) throw new Error('the Budget pane has no Plan expenses link');
  if (!(link.getBoundingClientRect().height > 0)) throw new Error('the Plan expenses link is not shown');
  link.click();
  if (!document.getElementById('expenses').classList.contains('active')) throw new Error('Plan expenses did not open Expenses');
  if (expMode !== 'planned') throw new Error('Plan expenses opened Expenses in ' + expMode + ' mode');
  if (document.getElementById('hdrTitle').textContent !== 'Budget Planning') throw new Error('Plan expenses is headed "' + document.getElementById('hdrTitle').textContent + '"');
  // Chief Architect review 4, WORK-01: already in Planned mode, a schedule
  // picked but not saved survives the link (setExpMode would clear it).
  var freq = document.getElementById('expRecFreq');
  freq.value = 'monthly';
  if (freq.value !== 'monthly') throw new Error('fixture: no monthly frequency option');
  navigate('dashboard');
  document.getElementById('dashPlanLink').click();
  if (expMode !== 'planned') throw new Error('Plan expenses left Planned mode');
  if (freq.value !== 'monthly') throw new Error('Plan expenses cleared the unsaved frequency (now "' + freq.value + '")');
  setExpMode('actual');
  document.querySelector('.segmented button[data-dash-chart="split"]').click();
  navigate('dashboard');
}

// Ink Debts step 5 (chief-architect-ink-debts.md, WORK-03): the debt detail is
// a modal, so Back closes only the top layer. Payment over the detail, Back
// closes the payment sheet and leaves the detail; the next Back closes the
// detail; no history entry is left behind and the list has not moved.
function debtDetailBackFlow() {
  db.debts = [{ id: 'ND1', name: 'Nav lender', date: todayISO(), principal: 300000, totalToRepay: 360000, notes: '' }];
  db.debtPayments = [];
  save();
  navigate('debts');
  window.scrollTo(0, 0);
  var detail = document.getElementById('debtDetailModal');
  var edit = document.getElementById('editModal');
  var open = document.querySelector('#debtList [data-debt-open="ND1"]');
  if (!open) throw new Error('the debt name is not a control that opens the detail');
  open.click();
  if (!detail.classList.contains('show')) throw new Error('the debt name did not open the detail');
  if (document.getElementById('debtDetailTitle').textContent !== 'Nav lender') throw new Error('the detail is not titled with the debt');
  document.querySelector('#debtList [data-debt-pay="ND1"]').click();
  if (!edit.classList.contains('show')) throw new Error('the payment sheet did not open');
  // The payment sheet is the one on top: the centre of the screen is inside it.
  var r = edit.querySelector('.modal').getBoundingClientRect();
  var hit = document.elementFromPoint(r.left + r.width / 2, r.top + 10);
  if (!hit || !edit.contains(hit)) throw new Error('the payment sheet is not above the detail');
  history.back();
  return wait(300).then(function () {
    if (edit.classList.contains('show')) throw new Error('Back did not close the payment sheet');
    if (!detail.classList.contains('show')) throw new Error('Back closed the detail along with the payment sheet');
    history.back();
    return wait(300);
  }).then(function () {
    if (detail.classList.contains('show')) throw new Error('the second Back did not close the detail');
    if (!document.getElementById('debts').classList.contains('active')) throw new Error('closing the detail left the Debts screen');
    if (history.state && history.state.appModal) throw new Error('a modal history entry was left behind');
    if (modalStack.length) throw new Error(modalStack.length + ' modal(s) still on the stack');
    db.debts = []; save();
    navigate('dashboard');
  });
}

try { t.viewport_clientWidth = document.documentElement.clientWidth; } catch (e) { t.flows.push('setup: THREW ' + e.message); }
Promise.resolve()
  .then(asyncFlow('a screen reached through the More sheet opens at the top', moreNavFlow))
  .then(asyncFlow('Back closes a sheet and leaves the page where it was', sheetKeepsPlaceFlow))
  .then(asyncFlow('the limit dialog Move opens Accounts with the amount in view', moveHandoffFlow))
  .then(asyncFlow('the Expenses tab back from Budget Planning opens at the top', budgetSwitchFlow))
  .then(asyncFlow('Home Budget pane Plan expenses opens Budget Planning', planLinkFlow))
  .then(asyncFlow('Back closes a sheet over the debt detail, then the detail', debtDetailBackFlow))
  .then(publish, publish);
