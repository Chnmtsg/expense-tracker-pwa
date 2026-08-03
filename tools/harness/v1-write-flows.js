// V1 — the four write flows a personal finance app cannot ship broken,
// driven through the real controls, with every console error captured.
//
// Two kinds of console error arrive here and they must never be confused. The
// quota block and the corrupt-boot walk at the bottom raise errors ON PURPOSE —
// that is the thing they test. Everything else is a defect. They go into two
// separate lists so run.mjs can fail on the second without failing on the
// first: an assertion that goes red on a clean build is deleted by the next
// person who runs it, and then nothing is checked at all.
var t = { consoleErrors: [], expectedConsoleErrors: [], flows: [] };
var expectingFailure = false;   // true only inside a deliberate-failure block

function record(msg) {
  (expectingFailure ? t.expectedConsoleErrors : t.consoleErrors).push(String(msg).slice(0, 160));
}

var realError = console.error;
console.error = function () { record(Array.prototype.join.call(arguments, ' ')); realError.apply(console, arguments); };
window.addEventListener('error', function (e) { record('window.error: ' + (e.message || e.error)); });
window.addEventListener('unhandledrejection', function (e) { record('unhandledrejection: ' + e.reason); });

// A thrown flow is recorded rather than re-thrown, so the run continues and
// reports every flow. run.mjs fails on the THREW substring — see the note there.
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

  /* EVERY VALUE RECORDED BELOW IS ALSO ASSERTED. That was not true until
     round 7, and the gap is the reason this note exists.

     These four flows used to run the actions, record eight values into `t`,
     and compare none of them. The only `throw`s in the file were in the
     corrupt-boot walk at the bottom — which is why reverting the guard it
     watches turned the run red, and why nothing else here could. A build
     where "edit income" wrote 5000 instead of 7500, or where the data-error
     banner was stuck on, or where a failed write reported "Updated", exited 0
     and printed success.

     The store starts empty on every run (run.mjs gives Chrome a fresh
     user-data-dir), so the counts below are absolute, not deltas. */

  // 1 — add income
  flow('add income', function () {
    navigate('income'); renderIncome();
    document.getElementById('incDate').value = todayISO();
    document.getElementById('incAmount').value = '5000';
    document.getElementById('incAdd').click();

    t.A_income_count = db.income.length;
    t.A_amount = db.income.length ? db.income[0].amount : null;
    t.A_toast = document.getElementById('toast').textContent;
    if (t.A_income_count !== 1) throw new Error('expected 1 income record, got ' + t.A_income_count);
    if (t.A_amount !== 5000) throw new Error('stored 5000 as ' + t.A_amount);
    if (!/added/i.test(t.A_toast)) throw new Error('no add confirmation: "' + t.A_toast + '"');
  });

  // 2 — edit income  (the branch that reported success unconditionally)
  flow('edit income', function () {
    openEditModal('income', db.income[0].id);
    document.getElementById('mAmount').value = '7500';
    document.getElementById('editModalSave').click();

    t.B_amount_after_edit = db.income[0].amount;
    t.B_modal_closed = !document.getElementById('editModal').classList.contains('show');
    t.B_toast = document.getElementById('toast').textContent;
    if (t.B_amount_after_edit !== 7500) throw new Error('edit wrote ' + t.B_amount_after_edit + ', expected 7500');
    if (!t.B_modal_closed) throw new Error('edit modal stayed open after save');
    if (!/updated/i.test(t.B_toast)) throw new Error('no update confirmation: "' + t.B_toast + '"');
  });

  // 3 — add expense
  flow('add expense', function () {
    expMode = 'actual';
    navigate('expenses'); renderExpenses();
    document.getElementById('expDate').value = todayISO();
    document.getElementById('expAmount').value = '1200';
    document.getElementById('expAdd').click();

    t.C_actual_count = db.actual.length;
    t.C_amount = db.actual.length ? db.actual[0].amount : null;
    t.C_toast = document.getElementById('toast').textContent;
    if (t.C_actual_count !== 1) throw new Error('expected 1 actual record, got ' + t.C_actual_count);
    if (t.C_amount !== 1200) throw new Error('stored 1200 as ' + t.C_amount);
    if (!/added/i.test(t.C_toast)) throw new Error('no add confirmation: "' + t.C_toast + '"');
  });

  // 4 — edit expense  (the branch that threw on every use)
  flow('edit expense', function () {
    openEditModal('actual', db.actual[0].id);
    document.getElementById('mAmount').value = '3400';
    document.getElementById('editModalSave').click();

    t.D_amount_after_edit = db.actual[0].amount;
    t.D_modal_closed = !document.getElementById('editModal').classList.contains('show');
    t.D_toast = document.getElementById('toast').textContent;
    t.D_list_refreshed = document.getElementById('expList').innerHTML.indexOf('3,400') > -1;
    if (t.D_amount_after_edit !== 3400) throw new Error('edit wrote ' + t.D_amount_after_edit + ', expected 3400');
    if (!t.D_modal_closed) throw new Error('edit modal stayed open after save');
    if (!/updated/i.test(t.D_toast)) throw new Error('no update confirmation: "' + t.D_toast + '"');
    if (!t.D_list_refreshed) throw new Error('the list still shows the old amount after an edit');
  });

  // Neither alarm may be showing after four successful writes.
  flow('no false alarms', function () {
    t.E_data_banner_hidden = !document.getElementById('dataErrorBanner').classList.contains('show');
    t.F_save_banner_hidden = !document.getElementById('saveErrorBanner').classList.contains('show');
    if (!t.E_data_banner_hidden) throw new Error('the data-error banner is showing on a healthy store');
    if (!t.F_save_banner_hidden) throw new Error('the save-error banner is showing after four successful writes');
  });

  // And the contract still holds when a write genuinely fails.
  flow('failed write is reported, not confirmed', function () {
    expectingFailure = true;
    var real = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'expense-tracker-v1') { var e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      return real.call(this, k, v);
    };
    try {
      openEditModal('income', db.income[0].id);
      document.getElementById('mAmount').value = '9999';
      document.getElementById('editModalSave').click();
      t.G_income_edit_failed_toast = document.getElementById('toast').textContent;
      t.G_save_banner_shown = document.getElementById('saveErrorBanner').classList.contains('show');
    } finally {
      // Restored in a finally: leaving the stub installed would make every
      // later write in this probe fail for the wrong reason.
      Storage.prototype.setItem = real;
      expectingFailure = false;
    }
    if (/updated/i.test(t.G_income_edit_failed_toast)) {
      throw new Error('a failed write reported success: "' + t.G_income_edit_failed_toast + '"');
    }
    if (!/not saved/i.test(t.G_income_edit_failed_toast)) {
      throw new Error('a failed write did not say so: "' + t.G_income_edit_failed_toast + '"');
    }
    if (!t.G_save_banner_shown) throw new Error('a failed write raised no save-error banner');
  });

  /* GATE R5's own closing condition, as a command rather than as a sentence.
     ------------------------------------------------------------------------
     The condition read: "V1's write flows executed with a clean console,
     INCLUDING A DELIBERATELY CORRUPTED STORE FOLLOWED BY A THROWN RUNTIME
     ERROR, which is the flow that produced the defect." Nothing ever performed
     that walk. This probe corrupted no store and raised no runtime error, and
     run.mjs could not have reported it if it had.

     The defect it guards: on a boot where load() failed to parse,
     updateCorruptBanner() puts TRUE text on #dataErrorBanner — the data could
     not be read, the app started empty, the unreadable bytes were set aside —
     and reveals Download damaged file. reportFatal() then overwrote all three
     claims with "Your saved data has not been changed" and hid the button that
     hands those bytes back, in the one state the quarantine design exists to
     survive.

     Reverting `if (dataWasCorrupt) return;` in reportFatal() must turn this
     red. That is the demonstration, and it is the only reason to trust it.

     Runs LAST: it corrupts the store and leaves a banner up, so nothing
     measured above would survive it. */
  flow('corrupt boot then runtime error', function () {
    expectingFailure = true;

    localStorage.setItem('expense-tracker-v1', '{not json');
    db = load();   // flags the store corrupt, quarantines the bytes, raises the true banner

    if (!dataWasCorrupt) throw new Error('setup failed: load() did not flag the store as corrupt');
    t.I_corrupt_title = document.getElementById('dataErrorTitle').textContent;
    t.I_download_shown = document.getElementById('dataErrorDownload').style.display !== 'none';
    if (!t.I_download_shown) throw new Error('setup failed: nothing was quarantined, so there is no button to protect');

    // The latch is per-session and nothing above opened it. Reset so the walk
    // tests reportFatal()'s guard rather than its one-banner-per-session rule.
    fatalReported = false;
    // Through the registered listener, not by calling reportFatal() directly:
    // the wiring is part of what gate R5 closed on.
    window.dispatchEvent(new ErrorEvent('error', {
      message: 'probe-injected runtime error', error: new Error('probe-injected runtime error')
    }));

    t.J_title_after_fatal = document.getElementById('dataErrorTitle').textContent;
    t.J_download_shown_after_fatal = document.getElementById('dataErrorDownload').style.display !== 'none';

    if (t.J_title_after_fatal !== t.I_corrupt_title) {
      throw new Error('reportFatal overwrote a live corrupt-data banner: "' + t.J_title_after_fatal + '"');
    }
    if (!t.J_download_shown_after_fatal) {
      throw new Error('reportFatal hid Download damaged file on a corrupt boot');
    }
  });
  expectingFailure = false;
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}
t.H_unexpected_console_errors = t.consoleErrors.length;
t.H_expected_console_errors = t.expectedConsoleErrors.length;
document.documentElement.setAttribute('data-probe', JSON.stringify(t));
