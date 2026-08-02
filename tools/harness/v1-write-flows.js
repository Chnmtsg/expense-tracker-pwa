// V1 — the four write flows a personal finance app cannot ship broken,
// driven through the real controls, with every console error captured.
var t = { consoleErrors: [], flows: [] };

var realError = console.error;
console.error = function () { t.consoleErrors.push(Array.prototype.join.call(arguments, ' ').slice(0, 120)); realError.apply(console, arguments); };
window.addEventListener('error', function (e) { t.consoleErrors.push('window.error: ' + (e.message || e.error)); });
window.addEventListener('unhandledrejection', function (e) { t.consoleErrors.push('unhandledrejection: ' + e.reason); });

function flow(name, fn) {
  var before = t.consoleErrors.length;
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok')
    + (t.consoleErrors.length > before ? ' | console errors +' + (t.consoleErrors.length - before) : ''));
}

try {
  var cid = db.categories[0].id;
  var tid = db.incomeTypes[0].id;

  // 1 — add income
  flow('add income', function () {
    navigate('income'); renderIncome();
    document.getElementById('incDate').value = todayISO();
    document.getElementById('incAmount').value = '5000';
    document.getElementById('incAdd').click();
  });
  t.A_income_count = db.income.length;
  t.A_toast = document.getElementById('toast').textContent;

  // 2 — edit income  (the branch that reported success unconditionally)
  flow('edit income', function () {
    openEditModal('income', db.income[0].id);
    document.getElementById('mAmount').value = '7500';
    document.getElementById('editModalSave').click();
  });
  t.B_amount_after_edit = db.income[0].amount;
  t.B_modal_closed = !document.getElementById('editModal').classList.contains('show');
  t.B_toast = document.getElementById('toast').textContent;

  // 3 — add expense
  flow('add expense', function () {
    expMode = 'actual';
    navigate('expenses'); renderExpenses();
    document.getElementById('expDate').value = todayISO();
    document.getElementById('expAmount').value = '1200';
    document.getElementById('expAdd').click();
  });
  t.C_actual_count = db.actual.length;
  t.C_toast = document.getElementById('toast').textContent;

  // 4 — edit expense  (the branch that threw on every use)
  flow('edit expense', function () {
    openEditModal('actual', db.actual[0].id);
    document.getElementById('mAmount').value = '3400';
    document.getElementById('editModalSave').click();
  });
  t.D_amount_after_edit = db.actual[0].amount;
  t.D_modal_closed = !document.getElementById('editModal').classList.contains('show');
  t.D_toast = document.getElementById('toast').textContent;
  t.D_list_refreshed = document.getElementById('expList').innerHTML.indexOf('3,400') > -1;

  // The false alarm must not be showing.
  t.E_data_banner_hidden = !document.getElementById('dataErrorBanner').classList.contains('show');
  t.F_save_banner_hidden = !document.getElementById('saveErrorBanner').classList.contains('show');

  // And the contract still holds when a write genuinely fails.
  var real = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    if (k === 'expense-tracker-v1') { var e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
    return real.call(this, k, v);
  };
  openEditModal('income', db.income[0].id);
  document.getElementById('mAmount').value = '9999';
  document.getElementById('editModalSave').click();
  t.G_income_edit_failed_toast = document.getElementById('toast').textContent;
  Storage.prototype.setItem = real;
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}
t.H_total_console_errors = t.consoleErrors.length;
document.documentElement.setAttribute('data-probe', JSON.stringify(t));
