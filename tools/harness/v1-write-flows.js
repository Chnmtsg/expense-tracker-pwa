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

  /* WORK-143 assertion 1 — ACCEPTANCE for the `≈` reading (WORK-142).
     ---------------------------------------------------------------------
     Written before the feature and demonstrated red, per the standing rule
     that an acceptance condition must be able to fail on the symptom.

     The symptom it has to fail on is the one the whole design exists to
     prevent: a converted figure that does not equal the ₮ figure it sits
     under. So it does not ask whether an element is present or whether it
     contains "≈" — a visibility assertion is not a function assertion. It
     reads the ₮ figure off the screen, multiplies by the rate the app was
     given, and requires the reading to match.

     The state is set here rather than inherited from the flows above, for
     two reasons. The failed-write flow leaves db.income[0] in a state that
     depends on whether a rejected save mutated memory first, which is not
     something a display assertion should be sensitive to. And a hand-checkable
     figure is worth more than a derived one: 3,400,000 ₮ at 3,400 ₮/USD is
     exactly USD 1,000, so a reader can verify the expectation without
     re-running the arithmetic the app performs.

     Cache-only, no network: the rate table is seeded straight into
     RATES_CACHE_KEY with a current timestamp. run.mjs gives Chrome a fresh
     user-data-dir and the harness has no network, so a feature that fetched
     on render would fail here — which is the point. */
  flow('the ≈ reading equals the ₮ figure times the cached rate', function () {
    if (typeof setDisplayCurrency !== 'function') {
      throw new Error('no setDisplayCurrency seam — the ≈ reading does not exist yet');
    }
    db.income = [{ id: 'CONV1', date: todayISO(), amount: 3400000, typeId: tid, notes: '' }];
    db.actual = [];
    db.planned = [];

    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
      base: 'USD', rates: { USD: 1, MNT: 3400 },
      updatedText: 'probe-seeded', timestamp: Date.now()
    }));

    setDisplayCurrency('USD');
    navigate('dashboard');
    renderDashboard();

    var kpi = document.getElementById('kpiNet');
    var conv = document.getElementById('kpiNetConv');
    if (!conv) throw new Error('#kpiNetConv is not in the document');

    t.K_kpi_net = kpi.textContent;
    t.K_kpi_conv = conv.textContent;

    // Sign-aware on purpose: unmoney() strips the minus with every other
    // non-digit, so reusing it here would read a deficit as a surplus and
    // this assertion would pass on a net of the wrong sign.
    var sign = /^\s*-|^-?₮?\s*-/.test(t.K_kpi_net) ? -1 : 1;
    var mnt = sign * parseInt(t.K_kpi_net.replace(/[^\d]/g, ''), 10);
    t.K_mnt_read = mnt;
    if (mnt !== 3400000) {
      throw new Error('setup failed: #kpiNet reads ' + mnt + ', expected 3400000');
    }

    var expected = Math.round(mnt * (1 / 3400));   // 1000, exactly
    t.K_expected = expected;
    if (expected !== 1000) throw new Error('setup failed: expectation is ' + expected + ', not 1000');

    if (t.K_kpi_conv.indexOf('≈') === -1) {
      throw new Error('the reading is not marked as an approximation: "' + t.K_kpi_conv + '"');
    }

    /* The AMOUNT field only, not every digit in the line.
       This previously stripped all non-digits from the whole string, and it
       passed only because the probe seeded a rate date — 'probe-seeded' — that
       happened to contain none. The moment WORK-160 made the line carry a real
       date, the same assertion read "≈ USD 1,000 · rate saved 8/4/2026" as
       1000842026 and went red against a correct render.

       That is this round's own defect class in miniature: an assertion passing
       for a reason its author did not intend. The line's format is
       "<amount> · <provenance>", so the amount is what precedes the separator,
       and saying so is what stops the provenance half from being read as
       money. */
    var amountPart = t.K_kpi_conv.split('·')[0];
    t.K_amount_part = amountPart;
    if (amountPart === t.K_kpi_conv) {
      throw new Error('the reading carries no "·" provenance separator: "' + t.K_kpi_conv + '"');
    }
    var shown = parseInt(amountPart.replace(/[^\d]/g, ''), 10);
    if (shown !== expected) {
      throw new Error('the ≈ reading says ' + shown + ', but ' + mnt +
                      ' ₮ at 3400 ₮/USD is ' + expected);
    }
    if (t.K_kpi_conv.indexOf('USD') === -1) {
      throw new Error('the reading does not name its currency: "' + t.K_kpi_conv + '"');
    }
    // It reads the figure, it does not replace it. The ₮ figure must survive.
    if (kpi.textContent.indexOf('₮') === -1) {
      throw new Error('the ₮ figure lost its symbol — the reading replaced the unit of record');
    }
  });

  /* WORK-143 assertion 2 — OFFLINE HONESTY.
     ---------------------------------------
     No rate, no reading. Anywhere. The failure this forbids is a reading
     rendered from a rate the app does not have — a stale constant, a default
     of 1, or a figure left over from the last render. Any of those would put a
     number under the user's balance that no exchange rate supports.

     Free to run: run.mjs gives Chrome a fresh user-data-dir and the harness has
     no network, so removing the cache entry IS the offline condition. A
     feature that fetched on render would hang or throw here rather than
     quietly passing.

     Both sites are checked, because "permitted to be absent" has to hold at
     each of them independently — one of the two could easily keep a stale
     node.

     WORK-151 CLAUSE 2 — THE SALARY SITE IS SEEDED, AND THE PREMISE IS PROVED
     BEFORE IT IS USED. As first written, the digit this flow removes from
     #sNetConv came from the empty salary form rendering "≈ USD 0" — the very
     string WORK-157 is approved to delete. On the day that lands, the salary
     half of this assertion would keep passing while asserting nothing at all,
     because the reading it watches for would already be absent for a reason
     that has nothing to do with the rate.

     So the form is given a real net first, and the positive control below
     asserts the reading IS present while the rate is. An absence assertion
     that never established the corresponding presence is not evidence — it is
     a check that cannot tell "correctly hidden" from "never rendered". */
  flow('no cached rate means no reading at either site', function () {
    // A real salary, so the reading under test is a real figure. Values are
    // arbitrary; only "non-zero" matters, and it is asserted rather than
    // assumed.
    document.getElementById('sHourly').value = '10000';
    document.getElementById('sNormal').value = '100';
    var salary = calcSalary();
    t.L_seeded_net = salary.net;
    if (!(salary.net > 0)) {
      throw new Error('setup failed: seeded salary net is ' + salary.net + ', so the salary site has nothing to lose');
    }

    // POSITIVE CONTROL — with a rate still cached, the salary reading is there.
    // This is what makes the absence below mean something.
    var sConvBefore = document.getElementById('sNetConv');
    t.L_s_conv_with_rate = sConvBefore.textContent;
    if (!/\d/.test(t.L_s_conv_with_rate)) {
      throw new Error('setup failed: no salary reading even WITH a rate cached ("' +
                      t.L_s_conv_with_rate + '") — the absence assertion below would be vacuous');
    }

    localStorage.removeItem(RATES_CACHE_KEY);
    setDisplayCurrency('USD');          // still on; it is the RATE that is gone
    navigate('dashboard'); renderDashboard();
    renderSalaryConvReading();

    var kpiConv = document.getElementById('kpiNetConv');
    var sConv = document.getElementById('sNetConv');
    t.L_kpi_conv_offline = kpiConv.textContent;
    t.L_s_conv_offline = sConv.textContent;
    t.L_kpi_hidden = kpiConv.style.display === 'none';
    t.L_s_hidden = sConv.style.display === 'none';

    if (/\d/.test(t.L_kpi_conv_offline)) {
      throw new Error('a reading survived with no rate cached: "' + t.L_kpi_conv_offline + '"');
    }
    if (/\d/.test(t.L_s_conv_offline)) {
      throw new Error('the salary reading survived with no rate cached: "' + t.L_s_conv_offline + '"');
    }
    if (!t.L_kpi_hidden) throw new Error('#kpiNetConv is empty but still occupying space');
    if (!t.L_s_hidden) throw new Error('#sNetConv is empty but still occupying space');

    // And the ₮ figure is untouched by the absence — it is complete alone.
    t.L_kpi_net_offline = document.getElementById('kpiNet').textContent;
    if (t.L_kpi_net_offline.indexOf('₮') === -1) {
      throw new Error('the ₮ figure went missing when the rate did: "' + t.L_kpi_net_offline + '"');
    }
  });

  /* WORK-143 assertion 3, corrected by WORK-151 — STORAGE INVARIANCE.
     -----------------------------------------------------------------
     Switching display currency must reach neither the stored blob nor the
     exported one. This is the assertion that makes the REJECTED shape — a
     currency that reaches the database — impossible to land by accident.

     TWO COMPARISONS, AND THEY GUARD DIFFERENT FACTS. Holding both is the
     point; either alone is a hole.

       localStorage bytes  — guards "nothing was WRITTEN TO THE STORE".
       JSON.stringify(db)  — guards "nothing was MUTATED IN MEMORY".

     As first written this flow had only the first, and that made it green by
     construction rather than by evidence. setDisplayCurrency calls no save()
     and no writeDb(), so the stored bytes cannot change no matter what it does
     to `db` — while exportBackup serialises `db`, not localStorage. A change
     that set db.settings.displayCurrency without saving would have left this
     flow green and changed the export on the very next tap.

     The second expression is the literal contents of exportBackup, not a
     look-alike: `JSON.stringify(db, null, 2)`. If exportBackup ever serialises
     something else, this must follow it, because the fact being guarded is
     what the user's backup file contains.

     Stated on bytes rather than on fields, in both cases, because a
     field-by-field comparison would pass a change that added a key with a null
     value.

     Demonstrated red by perturbing the APPLICATION: planting
     `db.settings.__x = code;` in setDisplayCurrency leaves the byte comparison
     green and turns the export comparison red. That contrast is the whole
     demonstration — it is what shows the two are not the same question. */
  flow('switching display currency reaches neither the stored nor the exported blob', function () {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
      base: 'USD', rates: { USD: 1, MNT: 3400, EUR: 0.9 },
      updatedText: 'probe-seeded', timestamp: Date.now()
    }));
    setDisplayCurrency('MNT');
    if (!save()) throw new Error('setup failed: could not write a baseline blob');

    var storedBefore = localStorage.getItem('expense-tracker-v1');
    var exportBefore = JSON.stringify(db, null, 2);   // exportBackup's own expression
    if (!storedBefore) throw new Error('setup failed: no stored blob to compare');

    setDisplayCurrency('USD');
    setDisplayCurrency('EUR');
    setDisplayCurrency('MNT');
    setDisplayCurrency('USD');

    var storedAfter = localStorage.getItem('expense-tracker-v1');
    var exportAfter = JSON.stringify(db, null, 2);
    t.M_stored_identical = storedBefore === storedAfter;
    t.M_export_identical = exportBefore === exportAfter;
    t.M_stored_len = storedBefore.length;
    t.M_export_len = exportBefore.length;

    if (!t.M_stored_identical) {
      // Length is reported second and deliberately: swapping "MNT" for "USD"
      // inside the blob leaves it the same size, so a length comparison would
      // pass this. If the two numbers below match, that is the message.
      throw new Error('the STORED blob changed when the display currency did (lengths ' +
                      storedBefore.length + ' -> ' + storedAfter.length + ')');
    }
    if (!t.M_export_identical) {
      throw new Error('the EXPORTED blob changed when the display currency did — a display ' +
                      'preference reached db and would ship in the next backup (lengths ' +
                      exportBefore.length + ' -> ' + exportAfter.length + ')');
    }
    // The preference did persist — otherwise this flow would pass by doing
    // nothing at all, which is the way an invariance check goes hollow.
    t.M_pref_stored = localStorage.getItem('display-currency');
    if (t.M_pref_stored !== 'USD') {
      throw new Error('setup failed: the preference did not persist, so nothing was actually switched');
    }
  });

  /* WORK-143 assertion 4 — UNIT-OF-RECORD INVARIANCE.
     -------------------------------------------------
     Tightened from "rows still show 3,400 and ₮" to something that can fail on
     the symptom: with a display currency ON, every amount the app RECORDS is
     still whole tugrik, in storage and on screen. A reading is added; nothing
     is reinterpreted.

     This is assertion 4's whole job — it is what makes the rejected shape
     (swap the symbol, keep the number) impossible to land by accident. So it
     checks the row text AND the stored integer, because the rejected shape
     would leave the stored integer alone and change only what is painted. */
  flow('a display currency changes no recorded amount', function () {
    db.income = [{ id: 'UOR1', date: todayISO(), amount: 7500, typeId: tid, notes: '' }];
    db.actual = [{ id: 'UOR2', date: todayISO(), amount: 3400, categoryId: cid, notes: '' }];
    if (!save()) throw new Error('setup failed: could not persist the fixture');

    setDisplayCurrency('USD');
    expMode = 'actual';
    navigate('expenses'); renderExpenses();

    t.N_stored_actual = db.actual[0].amount;
    t.N_row_html = document.getElementById('expList').innerHTML;
    t.N_row_shows_3400 = t.N_row_html.indexOf('3,400') > -1;
    t.N_row_shows_tugrik = t.N_row_html.indexOf('₮') > -1;
    t.N_row_shows_usd = /\bUSD\b/.test(t.N_row_html);

    if (t.N_stored_actual !== 3400) {
      throw new Error('the stored amount became ' + t.N_stored_actual + ' — a reading reached the database');
    }
    if (!t.N_row_shows_3400) throw new Error('the row no longer shows 3,400');
    if (!t.N_row_shows_tugrik) throw new Error('the row lost its ₮ — the unit of record was reinterpreted');
    if (t.N_row_shows_usd) {
      throw new Error('a row is showing USD; the reading is permitted at #kpiNet and #sNet only');
    }

    /* One CARD, one converted figure — counted per card, not per document.
       The Dashboard's three mini tiles read the same period as the hero, so a
       reading on any of them would sit beside another on the same card and
       invite a subtraction that rounding makes wrong. Two readings on two
       different cards is the design, not a violation: #kpiNetConv and
       #sNetConv are both expected to exist.

       The first version of this check counted every .conv-reading in the
       document and went red at two. That was the assertion overstating the
       invariant, not the app breaking it — the two live on different cards on
       different screens. Recorded because a check that fails on correct code
       is the kind that gets deleted rather than fixed. */
    navigate('dashboard'); renderDashboard();
    // Cards identified by object identity, not by id or class: two cards can
    // share a class, and counting them as one would hide the very collision
    // this looks for.
    var cards = [], counts = [], worst = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.conv-reading'), function (el) {
      if (el.style.display === 'none' || !/\d/.test(el.textContent)) return;
      var card = el.closest('.card, .hero-kpi') || el.parentNode;
      var ix = cards.indexOf(card);
      if (ix === -1) { ix = cards.push(card) - 1; counts[ix] = 0; }
      counts[ix]++;
      if (counts[ix] > worst) worst = counts[ix];
    });
    t.N_cards_with_readings = cards.length;
    t.N_readings_per_card = counts.join(',');
    t.N_worst_card = worst;
    if (worst > 1) {
      throw new Error('one card carries ' + worst + ' converted figures: ' + t.N_readings_per_card);
    }
    // A reading is expected SOMEWHERE, or this flow passes by rendering none.
    if (worst < 1) {
      throw new Error('no reading rendered at all, so this flow checked nothing');
    }
  });

  /* WORK-164 — BORROWED MONEY IS NOT INCOME.
     ========================================
     The store seam for db.debts and db.debtPayments, guarded before anything
     renders or writes them.

     The defect these exist to close: the app had nowhere to record borrowed
     money, so a user who borrowed ₮1,000,000 either logged it as Income — and
     the headline Net Balance rose by ₮1,000,000 at the moment they became
     ₮1,000,000 poorer — or logged nothing and had the same money counted as
     spending twice.

     A debt therefore lives in its OWN collection, never as a flag on an
     existing one, because every Dashboard total is an unconditional reduce
     over a whole array. Assertion 1 is the guard for exactly that, and its
     perturbation is the defect written out as code.

     These run before the corrupt-boot walk and after the display-currency
     flows, and they leave db.debts populated — nothing below reads it. */

  // Shared by the four flows: a debt and two payments against it.
  function seedDebt() {
    db.debts = [{
      id: 'D1', name: 'Test lender', date: todayISO(),
      principal: 1000000, totalToRepay: 1300000, notes: ''
    }];
    db.debtPayments = [
      { id: 'DP1', debtId: 'D1', date: todayISO(), amount: 200000, notes: '' },
      { id: 'DP2', debtId: 'D1', date: todayISO(), amount: 300000, notes: '' }
    ];
  }
  /* #kpiIncome and #kpiExpenses are written through setNumAnimated, which is
     driven by requestAnimationFrame — and run.mjs's own header says rAF is
     STARVED under --virtual-time-budget and that anything animated "must be
     driven by a stubbed frame clock, not waited on".

     Read synchronously without that, both tiles return "₮0" forever: the tween
     has started and not advanced. The first version of this flow compared
     "₮0" to "₮0" twice and called it invariance, which is a check that cannot
     fail dressed as two that can. Only #kpiNet was real, because :6472 writes
     it directly and says why.

     So the clock is stubbed to fire once with a timestamp far past the tween's
     450ms, which drives every pending tile straight to its target. */
  function withFramesRun(fn) {
    var realRaf = window.requestAnimationFrame;
    var ticks = 0;
    window.requestAnimationFrame = function (cb) {
      if (ticks++ > 500) return 0;             // never loop, whatever happens
      cb(performance.now() + 1e6);             // p clamps to 1 on the first tick
      return ticks;
    };
    try { return fn(); } finally { window.requestAnimationFrame = realRaf; }
  }
  function dashboardFigures() {
    return withFramesRun(function () {
      navigate('dashboard'); renderDashboard();
      return {
        income:  document.getElementById('kpiIncome').textContent,
        expense: document.getElementById('kpiExpenses').textContent,
        net:     document.getElementById('kpiNet').textContent
      };
    });
  }

  /* ASSERTION 1 — a debt reaches no Dashboard total.
     The one that matters. Red by `db.income.concat(db.debts)` at the income
     reduce, which is §2's defect expressed as a one-line change. */
  flow('debts and payments reach no Dashboard total', function () {
    db.income = [{ id: 'DB0', date: todayISO(), amount: 500000, typeId: tid, notes: '' }];
    db.actual = [{ id: 'DB1', date: todayISO(), amount: 120000, categoryId: cid, notes: '' }];
    db.planned = [];
    db.debts = []; db.debtPayments = [];
    setDisplayCurrency('MNT');            // no ≈ line in the way
    var before = dashboardFigures();

    seedDebt();
    var after = dashboardFigures();

    t.P_before = before;
    t.P_after = after;
    if (before.income !== after.income) {
      throw new Error('a debt moved Income: ' + before.income + ' -> ' + after.income +
                      ' — borrowed money is being counted as earned');
    }
    if (before.expense !== after.expense) {
      throw new Error('a debt or payment moved Expenses: ' + before.expense + ' -> ' + after.expense);
    }
    if (before.net !== after.net) {
      throw new Error('a debt moved Net Balance: ' + before.net + ' -> ' + after.net);
    }
    // The seed must be non-trivial, or this flow passes by comparing nothing.
    if (!db.debts.length || !db.debtPayments.length) {
      throw new Error('setup failed: nothing was seeded, so nothing was excluded');
    }
    // And the figures must be non-zero, or three comparisons of "₮0" would
    // pass whatever the app did. This is the check that would have caught the
    // starved-clock version of this flow.
    if (!/[1-9]/.test(before.income) || !/[1-9]/.test(before.expense) || !/[1-9]/.test(before.net)) {
      throw new Error('setup failed: a tile read as zero (' + before.income + ' / ' +
                      before.expense + ' / ' + before.net + ') — the comparison is vacuous');
    }
  });

  /* ASSERTION 2 — a backup carrying debts survives the round trip.
     Red by deleting `debts: []` from the import replacement object. */
  flow('a backup round-trips its debts and payments', function () {
    seedDebt();
    if (!save()) throw new Error('setup failed: could not persist the fixture');

    // exportBackup's own expression, so this tracks what the user's file holds.
    var exported = JSON.parse(JSON.stringify(db, null, 2));
    t.Q_exported_debts = exported.debts.length;
    t.Q_exported_payments = exported.debtPayments.length;
    if (t.Q_exported_debts !== 1 || t.Q_exported_payments !== 2) {
      throw new Error('the export dropped records before import was even reached');
    }

    t.Q_import_verdict = importProblem(exported);
    if (t.Q_import_verdict !== null) {
      throw new Error('the app refuses its own export: ' + t.Q_import_verdict);
    }

    /* The replacement object the import path actually builds, exercised in
       BOTH directions — and the second is the one the defaults exist for.

       `...parsed` spreads last, so a file that HAS debts carries them through
       regardless of the defaults. The defaults matter for the other case: a
       backup taken before this feature has no `debts` key, and without a
       default in the replacement the running db's debts would survive an
       import that was supposed to replace everything. `:6021-6023` states that
       property — "absent collections come back empty rather than surviving" —
       and a stale debt surviving a restore is a claim about money the user
       thought they had just replaced. */
    function replacementFor(file) {
      return {
        schemaVersion: file.schemaVersion,
        income: [], planned: [], actual: [],
        categories: [], incomeTypes: [],
        salaries: [], goals: [], goalContributions: [],
        debts: [], debtPayments: [],
        settings: {},
        ...file
      };
    }

    var carried = replacementFor(exported);
    t.Q_replaced_debts = (carried.debts || []).length;
    t.Q_replaced_payments = (carried.debtPayments || []).length;
    if (t.Q_replaced_debts !== 1) throw new Error('import lost the debt: 1 -> ' + t.Q_replaced_debts);
    if (t.Q_replaced_payments !== 2) throw new Error('import lost payments: 2 -> ' + t.Q_replaced_payments);

    // A pre-feature backup: same file, both keys removed.
    var legacyFile = JSON.parse(JSON.stringify(exported));
    delete legacyFile.debts;
    delete legacyFile.debtPayments;
    var cleared = replacementFor(legacyFile);
    t.Q_legacy_debts = cleared.debts;
    t.Q_legacy_payments = cleared.debtPayments;
    if (!Array.isArray(t.Q_legacy_debts) || t.Q_legacy_debts.length !== 0) {
      throw new Error('importing a pre-feature backup left debts behind: ' +
                      JSON.stringify(t.Q_legacy_debts) + ' — a restore did not replace what it claimed to');
    }
    if (!Array.isArray(t.Q_legacy_payments) || t.Q_legacy_payments.length !== 0) {
      throw new Error('importing a pre-feature backup left debt payments behind: ' +
                      JSON.stringify(t.Q_legacy_payments));
    }
  });

  /* ASSERTION 3 — BACKWARD COMPATIBILITY. Every blob ever written by this app
     predates these collections, so a stored file with no `debts` key must load
     to [] and must not throw. Red by `parsed.debts` without the `|| []`. */
  flow('a blob written before debts existed still loads', function () {
    var legacy = {
      schemaVersion: SCHEMA_VERSION,
      income: [{ id: 'L1', date: todayISO(), amount: 4000, typeId: tid, notes: '' }],
      planned: [], actual: [],
      categories: db.categories, incomeTypes: db.incomeTypes,
      salaries: [], goals: [], goalContributions: [],
      settings: {}
    };
    if ('debts' in legacy) throw new Error('setup failed: the fixture is not a legacy blob');
    localStorage.setItem('expense-tracker-v1', JSON.stringify(legacy));

    db = load();
    t.R_debts = Array.isArray(db.debts) ? db.debts.length : String(db.debts);
    t.R_payments = Array.isArray(db.debtPayments) ? db.debtPayments.length : String(db.debtPayments);
    t.R_income_survived = db.income.length;

    if (!Array.isArray(db.debts)) throw new Error('db.debts is ' + t.R_debts + ', not a list');
    if (!Array.isArray(db.debtPayments)) throw new Error('db.debtPayments is ' + t.R_payments + ', not a list');
    if (t.R_income_survived !== 1) throw new Error('the legacy blob lost its income');

    // The Data Summary reads .length on both, so it is the first thing that
    // would throw. Exercise it rather than asserting the shape and hoping.
    navigate('settings');
    renderDataSummary();
    t.R_summary_ok = document.getElementById('dataSummary').innerHTML.indexOf('Debts') > -1;
    if (!t.R_summary_ok) throw new Error('the Data Summary does not list Debts');
  });

  /* ASSERTION 4 — a malformed file is refused with a named message.
     Red by removing 'debts' from optionalArrays, or the debtProblem entry from
     perRecord. Four shapes, because each is refused by a different check. */
  flow('a malformed debt file is refused, not absorbed', function () {
    function verdictFor(mutate) {
      var f = {
        schemaVersion: SCHEMA_VERSION,
        income: [], planned: [], actual: [],
        categories: db.categories, incomeTypes: db.incomeTypes,
        salaries: [], goals: [], goalContributions: [],
        debts: [], debtPayments: [], settings: {}
      };
      mutate(f);
      return importProblem(f);
    }
    var good = { id: 'X', name: 'L', date: todayISO(), principal: 100, totalToRepay: 130 };

    t.S_not_a_list   = verdictFor(f => { f.debts = 'nope'; });
    t.S_bad_amount   = verdictFor(f => { f.debts = [{ ...good, principal: '1,000' }]; });
    t.S_repays_less  = verdictFor(f => { f.debts = [{ ...good, totalToRepay: 50 }]; });
    t.S_orphan_pay   = verdictFor(f => { f.debtPayments = [{ id: 'P', date: todayISO(), amount: 10 }]; });
    t.S_clean        = verdictFor(f => { f.debts = [good]; });

    if (t.S_not_a_list === null)  throw new Error('"debts" as a string was accepted');
    if (t.S_bad_amount === null)  throw new Error('a string borrowed amount was accepted — it becomes NaN in every sum');
    if (t.S_repays_less === null) throw new Error('a debt repaying less than was borrowed was accepted');
    if (t.S_orphan_pay === null)  throw new Error('a payment with no debtId was accepted');
    // And the refusals must not be indiscriminate, or "refuse everything" would
    // pass all four checks above.
    if (t.S_clean !== null) throw new Error('a well-formed debt file was refused: ' + t.S_clean);
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
