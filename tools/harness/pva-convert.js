// The reminder-conversion and Planned-vs-Actual guard.
//
//   node tools/harness/run.mjs tools/harness/pva-convert.js
//   npm run pva
//
// WHY THIS EXISTS
//
// Two defects were reported together, and neither is visible from source: one
// is about what is on the screen after a click, the other is about how wide a
// bar is drawn. The static checks in tools/ cannot decide either.
//
//  * "Mark as Actual" wrote the actual on the PLAN'S DUE DATE, which is
//    routinely outside the period the Expenses screen is filtered to —
//    reminders fire days ahead and overdue plans are deliberately included. The
//    plan left the planned tab in the same tap, so under the default "This
//    Month" filter the money vanished from both tabs at once and a conversion
//    that had worked was indistinguishable from a delete. The record was in the
//    database the whole time, which is why nothing that inspects db caught it —
//    the assertion has to be that the row is ON SCREEN.
//
//  * Planned vs Actual scaled every bar to the largest figure in the CARD, so a
//    small category that spent exactly its plan drew two 10% slivers beside
//    Rent. Both were 10%, so any check for "equal money draws equal bars" that
//    used one row passed on the broken build. The multi-row case is the one
//    that has to be asserted, and it is asserted here with a big row present.
//
// A probe, not a fifth runner: run.mjs executes it exactly as it executes
// v1-write-flows.js and recurrence.js.
var t = { flows: [], consoleErrors: [] };
var realError = console.error;
console.error = function () {
  t.consoleErrors.push(Array.prototype.join.call(arguments, ' ').slice(0, 160));
  realError.apply(console, arguments);
};
window.addEventListener('error', function (e) { t.consoleErrors.push('window.error: ' + (e.message || e.error)); });

function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}

function setExpRange(presetId) {
  var r = computeRange(presetId);
  document.getElementById('expPreset').value = presetId;
  document.getElementById('expFrom').value = r.from;
  document.getElementById('expTo').value = r.to;
  saveFilterState('exp', { preset: presetId, from: r.from, to: r.to });
}

// Widths of the two bars of every rendered Planned vs Actual row, in order, as
// numbers. Read as strings these compare wrong: the style property normalises
// the "100.0%" the template writes to "100%", so a string assertion fails on a
// build that is drawing the right bar.
function barWidths() {
  return Array.prototype.map.call(
    document.querySelectorAll('#pvaChart .pva-bar-row .bar > span'),
    function (s) { return parseFloat(s.style.width); }
  );
}

try {
  var cid = db.categories[0].id;

  /* 1 — an OVERDUE one-off converted from the bell.
     The date the actual is written on is the plan's due date, which here is
     last month, while the Expenses screen is filtered to This Month. Before the
     fix the record was written and then shown nowhere: the plan left the
     planned tab in the same tap, so both tabs went quiet and the conversion was
     indistinguishable from a delete. */
  flow('convert an overdue plan and keep the actual on screen', function () {
    var now = new Date();
    var overdue = toLocalISO(new Date(now.getFullYear(), now.getMonth() - 1, 15));
    db.planned = [{ id: 'P1', date: overdue, amount: 77777, categoryId: cid, notes: 'overdue one-off' }];
    db.actual = [];
    db.settings.notifications = {
      enabled: true, daysAhead: 7,
      showPlanned: true, showGoals: false, showRecurring: false, lastNotifiedAt: 0
    };
    if (!save()) throw new Error('setup failed: save() rejected the fixture');

    navigate('expenses');
    setExpRange('thisMonth');
    renderExpenses();
    t.A_overdue_date = overdue;
    t.A_listed_before = document.getElementById('expList').textContent.indexOf(fmt(77777)) >= 0;
    if (t.A_listed_before) throw new Error('setup failed: the plan date is inside This Month, so the bug cannot occur');

    openNotifModal();
    var btn = document.querySelector('[data-convert-planned]');
    if (!btn) throw new Error('setup failed: no "Mark as Actual" button — the reminder never appeared');
    btn.click();

    t.A_actual_count = db.actual.length;
    t.A_actual_date = db.actual.length ? db.actual[0].date : null;
    t.A_planned_count = db.planned.length;
    t.A_preset_after = document.getElementById('expPreset').value;
    t.A_listed_after = document.getElementById('expList').textContent.indexOf(fmt(77777)) >= 0;
    t.A_toast = document.getElementById('toast').textContent;

    // The record itself: written once, on the due date, and not lost.
    if (t.A_actual_count !== 1) throw new Error('expected 1 actual record, got ' + t.A_actual_count);
    if (t.A_actual_date !== overdue) throw new Error('actual dated ' + t.A_actual_date + ', expected ' + overdue);
    // And the thing the user reported: it has to be ON SCREEN afterwards.
    if (!t.A_listed_after) throw new Error('the converted actual is not in the Expenses list — it reads as deleted');
    if (t.A_preset_after !== 'lastMonth') throw new Error('filter moved to ' + t.A_preset_after + ', expected lastMonth');
    if (!/showing/i.test(t.A_toast)) throw new Error('the toast does not say the period moved: "' + t.A_toast + '"');
  });

  /* 1b — the plan itself survives the conversion, and says it was met.
     A plan is a budget line, not a to-do: removing it dropped the category's
     planned figure to zero at the very moment its actual arrived. */
  flow('the converted plan stays in the planned section', function () {
    if (db.planned.length !== 1) throw new Error('the plan was deleted: ' + db.planned.length + ' left');
    t.F_plan_cursor = db.planned[0].recLastDone || null;
    if (t.F_plan_cursor !== t.A_overdue_date) {
      throw new Error('plan cursor is ' + t.F_plan_cursor + ', expected ' + t.A_overdue_date);
    }

    // Visible on the planned tab, and marked as logged rather than looking
    // like an outstanding commitment.
    setExpMode('planned');
    renderExpenses();
    var listed = document.getElementById('expList').textContent;
    t.F_planned_listed = listed.indexOf(fmt(77777)) >= 0;
    t.F_marked_logged = /Logged as actual/i.test(listed);
    if (!t.F_planned_listed) throw new Error('the kept plan is not on the planned tab');
    if (!t.F_marked_logged) throw new Error('the kept plan does not say it was logged — it reads as still owed');
  });

  /* 1c — retirement. The plan used to be retired by being deleted; it is now
     retired by its cursor. If that does not hold, the reminder never clears and
     every further tap writes one more actual expense for a plan already paid. */
  flow('a logged plan stops asking to be logged again', function () {
    t.G_due_after = nextPlannedDue(db.planned[0]);
    if (t.G_due_after !== null) throw new Error('a logged one-off is still due on ' + t.G_due_after);

    openNotifModal();
    t.G_convert_buttons = document.querySelectorAll('[data-convert-planned]').length;
    if (t.G_convert_buttons !== 0) {
      throw new Error('the bell still offers to log the plan — tapping it again fabricates a duplicate expense');
    }
    closeModal(document.getElementById('notifModal'));

    // The badge's textContent is left stale when it hides, so display is the
    // only honest signal here.
    updateBellBadge();
    t.G_badge_hidden = document.getElementById('bellBadge').style.display === 'none';
    if (!t.G_badge_hidden) throw new Error('the bell badge still counts the logged plan');
    t.G_actual_count_unchanged = db.actual.length;
    if (t.G_actual_count_unchanged !== 1) throw new Error('actual count drifted to ' + t.G_actual_count_unchanged);
  });

  /* 1d — the reason the plan is kept: both sides of the comparison survive.
     This is the case that used to draw Planned ₮0 against real spending. */
  flow('planned vs actual still has both sides after a conversion', function () {
    var from = toLocalISO(new Date(parseISO(t.A_overdue_date).getFullYear(), parseISO(t.A_overdue_date).getMonth(), 1));
    var to = toLocalISO(new Date(parseISO(t.A_overdue_date).getFullYear(), parseISO(t.A_overdue_date).getMonth() + 1, 0));
    var planned = expandPlannedInRange(db.planned, from, to);
    var actual = db.actual.filter(function (x) { return inRange(x.date, from, to); });
    t.H_planned_total = planned.reduce(function (s, x) { return s + (+x.amount || 0); }, 0);
    t.H_actual_total = actual.reduce(function (s, x) { return s + (+x.amount || 0); }, 0);
    if (t.H_planned_total !== 77777) throw new Error('planned total is ' + t.H_planned_total + ', expected 77777');
    if (t.H_actual_total !== 77777) throw new Error('actual total is ' + t.H_actual_total + ', expected 77777');

    drawPvA(planned, actual);
    var w = barWidths();
    t.H_widths = w;
    if (w.length !== 2) throw new Error('expected 2 bars, got ' + w.length);
    if (w[0] !== 100 || w[1] !== 100) throw new Error('a plan met exactly drew ' + w[0] + '% vs ' + w[1] + '%');
    if (!/on target/i.test(document.getElementById('pvaChart').textContent)) {
      throw new Error('a plan met exactly does not read as on target');
    }
  });

  /* 1e — editing a kept plan must not silently un-log it. The edit modal
     cleared the cursor on every non-recurring save, and the cursor is now the
     only record that the plan was met. */
  flow('editing a logged plan leaves it logged', function () {
    openEditModal('planned', db.planned[0].id);
    document.getElementById('mNotes').value = 'edited note';
    document.getElementById('editModalSave').click();

    t.I_cursor_after_edit = db.planned[0].recLastDone || null;
    t.I_due_after_edit = nextPlannedDue(db.planned[0]);
    t.I_notes = db.planned[0].notes;
    if (t.I_notes !== 'edited note') throw new Error('the edit did not save: notes are "' + t.I_notes + '"');
    if (t.I_cursor_after_edit !== t.A_overdue_date) throw new Error('the edit cleared the logged mark');
    if (t.I_due_after_edit !== null) throw new Error('the edited plan came back due on ' + t.I_due_after_edit);
  });

  /* 1f — but RESCHEDULING is a fresh commitment and must fall due again,
     otherwise a plan moved to next month can never be logged. */
  flow('rescheduling a logged plan makes it due again', function () {
    var now2 = new Date();
    var future = toLocalISO(new Date(now2.getFullYear(), now2.getMonth(), now2.getDate() + 3));
    openEditModal('planned', db.planned[0].id);
    document.getElementById('mDate').value = future;
    document.getElementById('editModalSave').click();

    t.J_new_date = db.planned[0].date;
    t.J_due_after_move = nextPlannedDue(db.planned[0]);
    if (t.J_new_date !== future) throw new Error('the date did not move: ' + t.J_new_date);
    if (t.J_due_after_move !== future) throw new Error('a rescheduled plan is due ' + t.J_due_after_move + ', expected ' + future);
  });

  /* 1g — the second door: logging a plan for what the bill actually came to.
     The reminder is where the user finds out the figure was wrong, so it is
     where the correction has to be possible. */
  flow('the reminder offers a custom amount', function () {
    openNotifModal();
    var primary = document.querySelector('[data-convert-planned]');
    var custom = document.querySelector('[data-edit-planned]');
    t.K_primary_label = primary ? primary.textContent.trim() : null;
    t.K_has_custom = !!custom;
    if (!primary) throw new Error('the rescheduled plan is not in the bell');
    if (!custom) throw new Error('a planned reminder has no custom-amount action');
    if (t.K_primary_label.indexOf(fmt(77777)) < 0) {
      throw new Error('the primary action does not name what it will log: "' + t.K_primary_label + '"');
    }

    custom.click();
    t.K_notif_closed = !document.getElementById('notifModal').classList.contains('show');
    t.K_sheet_open = document.getElementById('editModal').classList.contains('show');
    t.K_prefilled_amount = document.getElementById('mAmount').value;
    t.K_prefilled_date = document.getElementById('mDate').value;
    if (!t.K_notif_closed) throw new Error('the notification sheet stayed open behind the editor');
    if (!t.K_sheet_open) throw new Error('the custom-amount sheet did not open');
    if (unmoney(t.K_prefilled_amount) !== 77777) {
      throw new Error('the sheet opened on "' + t.K_prefilled_amount + '", expected the planned amount');
    }
    if (t.K_prefilled_date !== db.planned[0].date) {
      throw new Error('the sheet opened on ' + t.K_prefilled_date + ', expected the due date');
    }
  });

  flow('a zero custom amount is refused and the sheet stays open', function () {
    document.getElementById('mAmount').value = '0';
    document.getElementById('editModalSave').click();
    t.L_sheet_still_open = document.getElementById('editModal').classList.contains('show');
    t.L_actual_count = db.actual.length;
    if (!t.L_sheet_still_open) throw new Error('the sheet closed over a rejected amount');
    if (t.L_actual_count !== 1) throw new Error('a zero amount was written: ' + t.L_actual_count + ' actuals');
  });

  /* The case the whole feature exists for, and the one that can quietly go
     wrong: the actual takes the PAYMENT date while the plan's cursor takes the
     OCCURRENCE. Writing the payment date to the cursor would step a recurring
     series off its anchor — ARCH-1's defect arriving through a text field. */
  flow('a custom amount logs what was paid and leaves the plan priced as planned', function () {
    var due = db.planned[0].date;
    var d = parseISO(due);
    var paidOn = toLocalISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    document.getElementById('mAmount').value = '90000';
    document.getElementById('mDate').value = paidOn;
    document.getElementById('mNotes').value = 'price went up';
    document.getElementById('editModalSave').click();

    var logged = db.actual[db.actual.length - 1];
    t.M_actual_count = db.actual.length;
    t.M_logged_amount = logged.amount;
    t.M_logged_date = logged.date;
    t.M_logged_notes = logged.notes;
    t.M_plan_amount = db.planned[0].amount;
    t.M_plan_cursor = db.planned[0].recLastDone;
    t.M_due_after = nextPlannedDue(db.planned[0]);
    t.M_sheet_closed = !document.getElementById('editModal').classList.contains('show');

    if (t.M_actual_count !== 2) throw new Error('expected 2 actuals, got ' + t.M_actual_count);
    if (t.M_logged_amount !== 90000) throw new Error('logged ' + t.M_logged_amount + ', expected the edited 90000');
    if (t.M_logged_date !== paidOn) throw new Error('logged on ' + t.M_logged_date + ', expected ' + paidOn);
    if (t.M_logged_notes !== 'price went up') throw new Error('notes were not carried: "' + t.M_logged_notes + '"');
    // Repricing the plan would erase the variance at the moment it became known.
    if (t.M_plan_amount !== 77777) throw new Error('the plan was repriced to ' + t.M_plan_amount);
    if (t.M_plan_cursor !== due) throw new Error('cursor is ' + t.M_plan_cursor + ', expected the occurrence ' + due);
    if (t.M_due_after !== null) throw new Error('still due on ' + t.M_due_after + ' after being logged');
    if (!t.M_sheet_closed) throw new Error('the sheet stayed open after a successful save');
  });

  /* 3 — "which of my plans are paid?" answered on the row itself.
     A plan now survives being logged, so settled and outstanding plans sit in
     the same list and nothing but these markers separates them. */
  flow('the planned list marks a one-off paid or unpaid', function () {
    var cid3 = db.categories[0].id;
    var today = todayISO();
    db.planned = [
      { id: 'U1', date: today, amount: 11111, categoryId: cid3, notes: 'not paid' },
      { id: 'U2', date: today, amount: 22222, categoryId: cid3, notes: 'paid', recLastDone: today }
    ];
    db.actual = [];
    if (!save()) throw new Error('setup failed: save() rejected the fixture');

    navigate('expenses');
    setExpRange('thisMonth');
    setExpMode('planned');
    renderExpenses();
    var html = document.getElementById('expList').innerHTML;
    t.N_unpaid_tags = (html.match(/tag unpaid">Unpaid</g) || []).length;
    t.N_paid_tags = (html.match(/tag paid">✓ Paid</g) || []).length;
    if (t.N_unpaid_tags !== 1) throw new Error('expected 1 Unpaid tag, got ' + t.N_unpaid_tags);
    if (t.N_paid_tags !== 1) throw new Error('expected 1 Paid tag, got ' + t.N_paid_tags);

    // The tag has to track the record, not just exist. Logging the outstanding
    // one must flip exactly one tag.
    var p = db.planned.find(function (x) { return x.id === 'U1'; });
    logPlannedAsActual(p);
    setExpMode('planned');
    renderExpenses();
    var html2 = document.getElementById('expList').innerHTML;
    t.N_unpaid_after = (html2.match(/tag unpaid">Unpaid</g) || []).length;
    t.N_paid_after = (html2.match(/tag paid">✓ Paid</g) || []).length;
    if (t.N_unpaid_after !== 0) throw new Error('a logged plan still reads Unpaid');
    if (t.N_paid_after !== 2) throw new Error('expected 2 Paid tags after logging, got ' + t.N_paid_after);
  });

  /* A series is never "paid" — it is paid THROUGH a date, with another
     occurrence coming. The row must say that rather than claim it is finished. */
  flow('a recurring plan reports how far it is paid', function () {
    var cid4 = db.categories[0].id;
    var now3 = new Date();
    var anchor = toLocalISO(new Date(now3.getFullYear(), now3.getMonth() - 2, 5));
    db.planned = [{ id: 'R1', date: anchor, amount: 33333, categoryId: cid4, recFrequency: 'monthly' }];
    db.actual = [];
    save();

    setExpRange('all');
    setExpMode('planned');
    renderExpenses();
    t.O_before = document.getElementById('expList').textContent;
    if (t.O_before.indexOf('Not logged yet') < 0) {
      throw new Error('a never-logged series does not say so');
    }
    if (/Paid thru/.test(t.O_before)) throw new Error('a never-logged series claims to be paid');

    var due = nextPlannedDue(db.planned[0]);
    logPlannedAsActual(db.planned[0]);
    setExpRange('all');
    setExpMode('planned');
    renderExpenses();
    t.O_after = document.getElementById('expList').textContent;
    t.O_cursor = db.planned[0].recLastDone;
    if (t.O_after.indexOf('Paid thru ' + due) < 0) {
      throw new Error('the series does not report being paid through ' + due);
    }
    // And it must still be listed as ongoing, not retired like a one-off.
    if (t.O_after.indexOf('Next:') < 0) throw new Error('the series lost its next-due line');
    if (nextPlannedDue(db.planned[0]) === null) throw new Error('the series was retired by one payment');
  });

  /* The analytics day breakdown in Planned mode — the window the report named.
     Each line there is one occurrence on one date, so it can state settlement
     per line rather than listing every plan identically. */
  flow('the analytics planned breakdown marks each occurrence', function () {
    var cid5 = db.categories[0].id;
    var today2 = todayISO();
    db.planned = [
      { id: 'D1', date: today2, amount: 44444, categoryId: cid5, notes: 'outstanding' },
      { id: 'D2', date: today2, amount: 55555, categoryId: cid5, notes: 'settled', recLastDone: today2 }
    ];
    db.actual = [];
    save();

    dailyMode = 'planned';
    dailyExcluded = new Set();
    dailySelectedDate = today2;
    renderDaySelected();
    var body = document.getElementById('dayDetailBody').innerHTML;
    t.P_paid = (body.match(/tag paid">✓ Paid</g) || []).length;
    t.P_unpaid = (body.match(/tag unpaid">Unpaid</g) || []).length;
    if (t.P_paid !== 1) throw new Error('expected 1 Paid line in the planned breakdown, got ' + t.P_paid);
    if (t.P_unpaid !== 1) throw new Error('expected 1 Unpaid line in the planned breakdown, got ' + t.P_unpaid);

    // Actual mode is the commoner view and must not grow a tag on every row.
    db.actual = [{ id: 'DA1', date: today2, amount: 66666, categoryId: cid5 }];
    dailyMode = 'actual';
    renderDaySelected();
    var abody = document.getElementById('dayDetailBody').innerHTML;
    t.P_actual_tags = (abody.match(/tag (paid|unpaid)"/g) || []).length;
    if (t.P_actual_tags !== 0) throw new Error('actual mode grew ' + t.P_actual_tags + ' settlement tags');
  });

  /* 2 — per-row bar scaling.
     A small category that spent exactly its plan must draw two equal FULL bars
     even when a much larger category shares the card. Under one shared maximum
     it drew two slivers and the card could not answer its own question. */
  flow('planned vs actual bars scale to their own row', function () {
    if (db.categories.length < 2) throw new Error('setup failed: need two categories');
    var big = db.categories[0].id, small = db.categories[1].id;
    var planned = [
      { id: 'B1', date: todayISO(), amount: 400000, categoryId: big },
      { id: 'S1', date: todayISO(), amount: 40000,  categoryId: small }
    ];
    var actual = [
      { id: 'B2', date: todayISO(), amount: 200000, categoryId: big },
      { id: 'S2', date: todayISO(), amount: 40000,  categoryId: small }
    ];
    drawPvA(planned, actual);

    var w = barWidths();
    t.B_widths = w;
    // Rows are sorted by planned+actual, so the big category leads.
    if (w.length !== 4) throw new Error('expected 4 bars, got ' + w.length);
    if (w[0] !== 100) throw new Error('big planned drew ' + w[0] + '%, expected 100%');
    if (w[1] !== 50) throw new Error('big actual drew ' + w[1] + '%, expected 50% of its own row');
    if (w[2] !== 100) throw new Error('small planned drew ' + w[2] + '% — still scaled to the card maximum');
    if (w[3] !== 100) throw new Error('small actual drew ' + w[3] + '% — equal money must draw equal bars');
  });

  // Equal planned and actual, stated on its own because it is the case the
  // report named.
  flow('equal planned and actual draw equal bars', function () {
    var cid2 = db.categories[0].id;
    drawPvA(
      [{ id: 'E1', date: todayISO(), amount: 12345, categoryId: cid2 }],
      [{ id: 'E2', date: todayISO(), amount: 12345, categoryId: cid2 }]
    );
    var w = barWidths();
    t.C_widths = w;
    if (w.length !== 2) throw new Error('expected 2 bars, got ' + w.length);
    if (w[0] !== w[1]) throw new Error('equal money drew unequal bars: ' + w[0] + ' vs ' + w[1]);
    if (w[0] !== 100) throw new Error('equal money drew ' + w[0] + '%, expected a full track');
  });

  // A row with nothing on either side must draw empty bars, not NaN%.
  flow('a zero row does not divide by zero', function () {
    drawPvA(
      [{ id: 'Z1', date: todayISO(), amount: 0, categoryId: db.categories[0].id }],
      []
    );
    var w = barWidths();
    t.D_widths = w;
    if (w.some(isNaN)) throw new Error('NaN width: ' + w.join(','));
  });

  t.E_unexpected_console_errors = t.consoleErrors.length;
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
