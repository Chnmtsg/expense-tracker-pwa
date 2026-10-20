// WORK-01 — a second window must never silently overwrite the first.
//
//   node tools/harness/run.mjs tools/harness/cross-window.js   (npm run crosswindow)
//
// Two copies of the app on one profile: this page (A) and a nested frame (B)
// that shares its localStorage. The nested copy carries #second in its URL and
// does nothing but boot, the same guard boot-crash.js uses, so this probe is not
// injected into it a second time.
//
// WHAT IT GUARDS
//
// Each window read the store once at boot and wrote its whole in-memory copy
// back on every save, so B's entry was erased by A's next save of anything.
// Two paths now close that, and each is driven here through the real Add
// Income control rather than by calling save():
//
//  1. THE RACE. B saves and A saves in the same task, before the `storage`
//     event can reach A. writeDb() must refuse A's write because the store no
//     longer holds what A last read, keep B's record, bring A up to date, and
//     tell A's user in words — a quiet refusal is the same defect moved.
//  2. THE EVENT. B saves, the event arrives, and A refreshes on its own. A's
//     next save then lands on top of B's record instead of replacing it.
if (location.hash === '#second') {
  // second window — just let the app run
} else {
  var t = { consoleErrors: [], flows: [] };
  var realError = console.error;
  console.error = function () { t.consoleErrors.push(Array.prototype.join.call(arguments, ' ').slice(0, 160)); realError.apply(console, arguments); };
  window.addEventListener('error', function (e) { t.consoleErrors.push('window.error: ' + (e.message || e.error)); });

  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); };
  var stored = function () { return JSON.parse(localStorage.getItem(KEY) || '{"income":[]}'); };
  var notesInStore = function () { return stored().income.map(function (i) { return i.notes; }).sort().join(','); };
  // Add one income entry through the real form of the given window.
  var addIncome = function (w, amount, notes) {
    w.navigate('income');
    w.document.getElementById('incDate').value = todayISO();   // A's helper: todayISO is a const, not a window property
    w.document.getElementById('incAmount').value = String(amount);
    w.document.getElementById('incNotes').value = notes;
    w.document.getElementById('incAdd').click();
  };
  var dialogOpen = function () { return document.getElementById('confirmModal').classList.contains('show'); };

  (async function () {
    try {
      var frame = document.createElement('iframe');
      frame.src = location.href.split('#')[0] + '#second';
      frame.style.cssText = 'width:390px;height:600px;border:0';
      await new Promise(function (r) { frame.onload = r; document.body.appendChild(frame); });
      var B = frame.contentWindow;
      await wait(50);
      if (typeof B.navigate !== 'function') throw new Error('setup failed: the second window did not boot');

      // 1 — the race
      addIncome(B, 1000, 'from-B-1');
      addIncome(window, 2000, 'from-A-1');      // same task: A has not heard yet
      t.A_store_after_race = notesInStore();
      t.A_db_has_B1 = db.income.some(function (i) { return i.notes === 'from-B-1'; });
      t.A_db_has_A1 = db.income.some(function (i) { return i.notes === 'from-A-1'; });
      t.A_dialog = dialogOpen() && /not saved/i.test(document.getElementById('confirmMessage').textContent);
      t.A_toast = document.getElementById('toast').textContent;
      t.A_save_banner = document.getElementById('saveErrorBanner').classList.contains('show');
      if (t.A_store_after_race !== 'from-B-1') throw new Error('race: store holds ' + t.A_store_after_race);
      if (!t.A_db_has_B1 || t.A_db_has_A1) throw new Error('race: window A was not brought up to date');
      if (!t.A_dialog) throw new Error('race: window A was not told its entry was not saved');
      if (!/another window/.test(t.A_toast)) throw new Error('race: toast gave the wrong reason: ' + t.A_toast);
      if (t.A_save_banner) throw new Error('race: the storage-failure banner was raised for a stale write');
      document.getElementById('confirmOk').click();
      await wait(50);

      // 2 — the event
      addIncome(B, 3000, 'from-B-2');
      await wait(100);                            // let the storage event reach A
      t.B_db_has_B2_in_A = db.income.some(function (i) { return i.notes === 'from-B-2'; });
      if (!t.B_db_has_B2_in_A) throw new Error('event: window A did not refresh when B saved');
      addIncome(window, 4000, 'from-A-2');
      t.B_store_after_event = notesInStore();
      if (t.B_store_after_event !== 'from-A-2,from-B-1,from-B-2') throw new Error('event: store holds ' + t.B_store_after_event);
      await wait(100);
      t.B_frame_count = B.document.getElementById('incCount').textContent;
      if (t.B_frame_count !== '3') throw new Error('event: window B did not refresh when A saved, shows ' + t.B_frame_count);
      t.flows.push('cross-window: ok');

      // 3 — the limit dialog (chief-architect-ink-quickadd.md, WORK-01a). A's
      // Add Expense waits on the dialog for a short account; B saves while it
      // is open; "Record anyway" must then write nothing and say why, because
      // what A's user agreed to was judged against records that are gone.
      db.accounts = [{ id: 'X1', name: 'Thin', opening: 1000 }];
      db.actual = [];
      save();
      await wait(100);
      navigate('expenses');
      if (!db.categories.length) throw new Error('limit: the fixture has no category');
      document.getElementById('expCategory').value = db.categories[0].id;
      document.getElementById('expAccount').value = 'X1';
      document.getElementById('expAmount').value = '5000';
      document.getElementById('expNotes').value = 'from-A-short';
      document.getElementById('expAdd').click();
      await wait(50);
      if (!dialogOpen() || !/can't cover this/.test(document.getElementById('confirmTitle').textContent)) throw new Error('limit: the shortfall dialog did not open');
      addIncome(B, 7000, 'from-B-3');
      await wait(100);                            // the storage event replaces A's db
      document.getElementById('confirmAlt').click();
      await wait(100);
      t.L_store_has_A = stored().actual.some(function (x) { return x.notes === 'from-A-short'; });
      t.L_db_has_A = db.actual.some(function (x) { return x.notes === 'from-A-short'; });
      if (t.L_store_has_A || t.L_db_has_A) throw new Error('limit: the expense was written over records another window replaced');
      if (!dialogOpen() || !/another window/i.test(document.getElementById('confirmMessage').textContent)) throw new Error('limit: A was not told why nothing was saved: ' + document.getElementById('confirmMessage').textContent);
      document.getElementById('confirmOk').click();
      await wait(50);
      t.flows.push('cross-window limit dialog: ok');

      // 4 — the debt detail (chief-architect-ink-debts.md, WORK-10). A has a
      // debt's detail open; B records a payment and A's detail shows it; B
      // deletes the debt and A's detail closes, saying why.
      db.debts = [{ id: 'W1', name: 'Shared lender', date: todayISO(), principal: 200000, totalToRepay: 240000, notes: '' }];
      db.debtPayments = [];
      save();
      await wait(100);
      navigate('debts');
      document.querySelector('#debtList [data-debt-open="W1"]').click();
      var detail = document.getElementById('debtDetailModal');
      if (!detail.classList.contains('show')) throw new Error('detail: window A could not open the debt');
      B.navigate('debts');
      // B acts through its own row and detail, as a user there would.
      B.document.querySelector('#debtList [data-debt-open="W1"]').click();
      B.document.querySelector('#debtDetailFoot [data-debt-pay="W1"]').click();
      B.document.getElementById('mAmount').value = '50000';
      B.document.getElementById('editModalSave').click();
      await wait(150);
      t.D_detail_after_payment = document.getElementById('debtDetailBody').textContent.replace(/\s+/g, ' ');
      if (!detail.classList.contains('show')) throw new Error('detail: a payment in window B closed A\'s detail');
      if (t.D_detail_after_payment.indexOf('₮50,000 paid of') < 0) throw new Error('detail: A\'s detail did not show B\'s payment: ' + t.D_detail_after_payment);
      B.confirmDialog = function () { return Promise.resolve(true); };
      B.document.querySelector('#debtDetailTopActions [data-debt-edit="W1"]').click();
      B.document.getElementById('mDebtDelete').click();
      await wait(200);
      if (detail.classList.contains('show')) throw new Error('detail: A\'s detail stayed open on a debt B deleted');
      if (!dialogOpen() || !/deleted in another window/.test(document.getElementById('confirmMessage').textContent)) {
        throw new Error('detail: A was not told its debt was deleted');
      }
      if (document.getElementById('debtDetailBody').innerHTML.trim()) throw new Error('detail: the closed detail still holds its figures');
      document.getElementById('confirmOk').click();
      await wait(50);
      t.flows.push('cross-window debt detail: ok');
    } catch (e) {
      t.ERROR = String(e && e.message ? e.message : e);
    }
    t.H_unexpected_console_errors = t.consoleErrors.length;
    document.documentElement.setAttribute('data-probe', JSON.stringify(t));
  })();
}
