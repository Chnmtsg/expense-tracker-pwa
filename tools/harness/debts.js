// The Debts module's binding conditions, as a command.
//
//   node tools/harness/run.mjs tools/harness/debts.js
//   node tools/harness/run.mjs tools/harness/debts.js --width 320
//
// WHY THIS EXISTS
//
// The Debts screen records money the user borrowed and shows what the
// borrowing costs them. Its whole safety argument is a set of NEGATIVES — a
// debt never reaches a Dashboard total, a stock never depends on a date
// filter, a deleted debt leaves no orphans — and negatives are exactly the
// claims that rot silently, because nothing on screen changes when they stop
// being true.
//
// Each flow is one of the conditions the feature was approved under, and each
// was demonstrated red by breaking the APPLICATION rather than the
// expectation. The perturbation that reddens it is named in its comment, so a
// later reader can re-run the demonstration instead of trusting this note.
//
// A probe, not a sixth runner: run.mjs executes it exactly as it executes
// v1-write-flows.js, boot-crash.js and recurrence.js.
//
// The result is published LAST and asynchronously, because the delete path
// awaits confirmDialog. run.mjs polls for data-probe rather than sampling once,
// so a deferred write is read correctly; a synchronous write would have
// captured the state before the delete handler resumed.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}
function publish() {
  document.documentElement.setAttribute('data-probe', JSON.stringify(t));
}

// setNumAnimated is driven by requestAnimationFrame, which run.mjs starves —
// see its header. Without a stubbed clock the KPI tiles read "₮0" forever and
// any comparison between them is vacuous rather than merely wrong.
//
// The full derivation — why the tween clamps on the first tick, and how the
// first version of this compared "₮0" to "₮0" twice and called it invariance —
// is in tools/harness/v1-write-flows.js above its copy of this helper. Pointed
// at rather than restated: an abbreviated second telling drifts from the first,
// and the drift is invisible because both still read plausibly.
function withFramesRun(fn) {
  var realRaf = window.requestAnimationFrame;
  var ticks = 0;
  window.requestAnimationFrame = function (cb) {
    if (ticks++ > 500) return 0;
    cb(performance.now() + 1e6);
    return ticks;
  };
  try { return fn(); } finally { window.requestAnimationFrame = realRaf; }
}

// The Dashboard range lives in the DOM, not in a variable, so it is moved the
// way a user moves it.
function setDashPreset(id) {
  var sel = document.getElementById('dashPreset');
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
}

function seed() {
  db.debts = [
    { id: 'D1', name: 'A lender', date: todayISO(), principal: 1000000, totalToRepay: 1300000, notes: '' },
    { id: 'D2', name: 'My sister', date: todayISO(), principal: 500000,  totalToRepay: 500000,  notes: '' }
  ];
  db.debtPayments = [
    { id: 'P1', debtId: 'D1', date: todayISO(), amount: 650000, notes: '' },
    { id: 'P2', debtId: 'D2', date: todayISO(), amount: 100000, notes: '' }
  ];
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;

  /* CONDITION 1 — STOCK INVARIANCE.
     Every figure on this screen is true as of now and must not move when the
     Dashboard's date filter moves. Red by making debtPaid filter its payments
     through getRange('dash'). "lastMonth" is the sharpest case: it excludes
     today entirely, so a flow-shaped implementation reads zero. */
  flow('the debt figures do not move with the Dashboard date filter', function () {
    seed();
    var d1 = db.debts[0];
    var read = function () {
      return { paid: debtPaid('D1'), out: debtOutstanding(d1), cost: debtInterestPaid(d1) };
    };

    setDashPreset('thisMonth'); var a = read();
    setDashPreset('all');       var b = read();
    setDashPreset('lastMonth'); var c = read();
    setDashPreset('all');       // leave it somewhere sane for later flows

    t.A_thisMonth = a; t.A_allTime = b; t.A_lastMonth = c;
    if (!a.paid) throw new Error('setup failed: nothing was paid, so nothing could vary');
    ['paid', 'out', 'cost'].forEach(function (k) {
      if (a[k] !== b[k] || a[k] !== c[k]) {
        throw new Error(k + ' moved with the filter: thisMonth ' + a[k] +
                        ', allTime ' + b[k] + ', lastMonth ' + c[k] +
                        ' — a stock is being treated as a flow');
      }
    });
  });

  /* CONDITION 2 — ZERO-INTEREST DEBT.
     Money from family usually costs nothing. That must fall out of the
     arithmetic as exactly zero, the cost line must be ABSENT rather than read
     "₮0", and the rest of the card must still be right. Red by removing the
     Math.round(interest) === 0 guard in renderDebts. */
  flow('an interest-free debt shows no cost figure at all', function () {
    seed();
    var sister = db.debts[1];
    t.B_sister_cost = debtInterestPaid(sister);
    t.B_sister_out  = debtOutstanding(sister);
    if (t.B_sister_cost !== 0) {
      throw new Error('an interest-free debt reported a cost of ' + t.B_sister_cost);
    }
    if (t.B_sister_out !== 400000) {
      throw new Error('outstanding is ' + t.B_sister_out + ', expected 400000 — the zero case broke the rest');
    }

    // With EVERY debt interest-free, the screen shows no cost heading at all.
    db.debts = [sister];
    db.debtPayments = db.debtPayments.filter(function (p) { return p.debtId === 'D2'; });
    navigate('debts'); renderDebts();
    t.B_totals_html = document.getElementById('debtTotals').textContent.replace(/\s+/g, ' ').trim();
    // Matches the LABEL, not the word "interest". WORK-08 renamed both cost
    // sites to "Cost so far", and this assertion had been written against the
    // old wording — so after the rename it could no longer fail, whatever the
    // screen did. "cost so far" and not "so far", because "Paid back so far"
    // is an unconditional tile beside it.
    if (/cost so far/i.test(t.B_totals_html)) {
      throw new Error('a debt owed to family is captioned with a cost: ' + t.B_totals_html);
    }
    if (t.B_totals_html.indexOf('400,000') === -1) {
      throw new Error('the outstanding figure is missing from an interest-free summary: ' + t.B_totals_html);
    }
  });

  /* THE ACTION BUTTONS ARE STYLED, AND ARE THE SAME CONTROLS AS THE GOAL CARD'S.
     Red by restoring the `.goal-actions ` ancestor to the button.goal-add rule.

     A functional assertion cannot see this. Every flow in this file clicked
     [data-debt-pay] and passed while the button was a 23px native control on
     rgb(240,240,240) — because a click works on an unstyled button. What broke
     was geometry and paint, and nothing was looking at either.

     COMPARED SITE-TO-SITE, not against literals. The one hard number is the
     44px touch minimum from ui-guidelines.md, which is a stated project rule.
     Everything else is asserted EQUAL between the debt row and the goal row, so
     the check survives any future restyle of the shared component and fails
     only when the two diverge — which is the actual property, since these are
     meant to be one control used twice.

     Run at 320: the button geometry is a phone property and `npm run debts`
     now carries --width 320. */
  flow('the debt action buttons are the same controls as the goal card\'s', function () {
    db.goals = [{ id: 'GG', name: 'A goal', target: 1000000, icon: '🎯', notes: '' }];
    db.goalContributions = [];
    db.debts = [{
      id: 'BB', name: 'A lender', date: todayISO(),
      principal: 1000000, totalToRepay: 1300000, notes: ''
    }];
    db.debtPayments = [];

    function measure(sel) {
      var el = document.querySelector(sel);
      if (!el) throw new Error('setup failed: nothing matched ' + sel);
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el);
      return { h: Math.round(r.height), w: Math.round(r.width), bg: cs.backgroundColor };
    }

    navigate('goals'); renderGoals();
    var goalAdd  = measure('.goal-actions button.goal-add');
    var goalIcon = measure('.goal-actions button.goal-icon-btn');

    navigate('debts'); renderDebts();
    var debtAdd  = measure('.debt-actions button.goal-add');
    var debtIcon = measure('.debt-actions button.goal-icon-btn');

    t.I_goal_add = goalAdd; t.I_debt_add = debtAdd;
    t.I_goal_icon = goalIcon; t.I_debt_icon = debtIcon;

    // The one absolute: ui-guidelines.md's touch minimum.
    if (debtAdd.h < 44) throw new Error('the payment button is ' + debtAdd.h + 'px tall, below the 44px minimum');
    if (debtIcon.h < 44 || debtIcon.w < 44) {
      throw new Error('a debt icon button is ' + debtIcon.w + 'x' + debtIcon.h + ', below 44x44 — one of them deletes');
    }

    /* Everything else: the two rows must not diverge — but on the properties
       the STYLESHEET sets, not the ones the content sets.

       The primary action is compared on height and background only. Its width
       is padding around a label, and the two labels differ by design: "+ Add ₮"
       against "+ Payment", measured at 76 and 93. The first version of this
       flow compared width too and went red against a correctly-fixed
       application, which is a defect in the assertion rather than the code —
       and this project has already paid for that once.

       The icon button IS compared on width, because there width is a declared
       44px and not a function of its glyph. */
    ['h', 'bg'].forEach(function (k) {
      if (goalAdd[k] !== debtAdd[k]) {
        throw new Error('the primary action differs between cards on ' + k +
                        ': goal ' + goalAdd[k] + ', debt ' + debtAdd[k]);
      }
    });
    ['h', 'w', 'bg'].forEach(function (k) {
      if (goalIcon[k] !== debtIcon[k]) {
        throw new Error('the icon button differs between cards on ' + k +
                        ': goal ' + goalIcon[k] + ', debt ' + debtIcon[k]);
      }
    });

    // And the goal row must itself be styled, or "equal" would pass on two
    // equally-broken rows.
    if (goalAdd.h < 44) throw new Error('setup failed: the goal button is unstyled too, so equality proves nothing');
  });

  /* OVERPAYMENT — the cost of borrowing cannot exceed what the loan cost.
     Red by removing the Math.min from debtInterestPaid.

     Over-recording is ordinary: a duplicate entry, or a final payment typed as
     the whole total rather than the remainder. The outstanding balance and the
     percentage were already clamped; the cost figure was not, so it reported a
     number the loan could not have carried — on the one figure this module
     exists to produce.

     The expectation is hand-checkable rather than a re-run of the formula:
     1,000,000 borrowed against 1,300,000 repayable is a cost of exactly
     300,000, and no amount of paying can make it more. */
  flow('overpaying a debt cannot inflate the cost of borrowing', function () {
    db.debts = [{
      id: 'OVER', name: 'A lender', date: todayISO(),
      principal: 1000000, totalToRepay: 1300000, notes: ''
    }];
    var d = db.debts[0];
    var cost = d.totalToRepay - d.principal;      // 300,000

    // Exactly settled: the whole cost has been paid and not a tugrik more.
    db.debtPayments = [{ id: 'O1', debtId: 'OVER', date: todayISO(), amount: 1300000, notes: '' }];
    t.H_at_total = debtInterestPaid(d);
    if (t.H_at_total !== cost) {
      throw new Error('paying the total exactly reports ' + t.H_at_total + ', expected ' + cost);
    }

    // Overpaid by 100,000 — a duplicate final payment.
    db.debtPayments.push({ id: 'O2', debtId: 'OVER', date: todayISO(), amount: 100000, notes: '' });
    t.H_paid = debtPaid('OVER');
    t.H_over = debtInterestPaid(d);
    t.H_outstanding = debtOutstanding(d);
    if (t.H_paid !== 1400000) throw new Error('setup failed: paid is ' + t.H_paid + ', expected 1400000');
    if (t.H_over > cost) {
      throw new Error('overpaying reported ' + t.H_over + ' of interest on a loan that cost ' + cost +
                      ' — a figure the loan could not have carried');
    }
    if (t.H_over !== cost) {
      throw new Error('a fully-repaid debt reports ' + t.H_over + ' interest, expected the full ' + cost);
    }
    // The already-clamped figures must not have moved either.
    if (t.H_outstanding !== 0) throw new Error('outstanding is ' + t.H_outstanding + ', expected 0');

    // And it is still visible on screen as the capped figure, not just in the
    // function — the summary card is where the user meets this number.
    navigate('debts'); renderDebts();
    t.H_totals = document.getElementById('debtTotals').textContent.replace(/\s+/g, ' ').trim();
    if (t.H_totals.indexOf('300,000') === -1) {
      throw new Error('the summary does not show the capped cost: ' + t.H_totals);
    }
  });

  /* EDITING A DEBT KEEPS ITS PAYMENTS.

     Red at K_id (below) by having the edit branch REPLACE the record rather
     than mutate it — run, observed, and quoted:

       db.debts = db.debts.filter(x => x.id !== editCtx.debtId)
                          .concat({ ...d, id: uid(), name, principal, ... });

       npm run debts: exit 1
       "the debt has a new id (4f3ksedamsiobf6k) — it was replaced rather than
        mutated, and every payment now points at a debt that no longer exists"
       K_debts 1, K_payments 2 — both still correct, which is the point.

     THE PERTURBATION RECORDED HERE BEFORE WAS "push a new record with a fresh
     id", and it never reached this flow's own assertion. A throw exits a flow at
     its first failure, and pushing makes db.debts.length 2, so it reddened
     `the edit created a second debt: 2` at the FIRST assertion and stopped —
     also run and observed. That assertion is a real one, but it is not the one
     the flow is named for, and a reader re-running the recorded demonstration
     would have watched a different guard fire and concluded the orphaning check
     was proven. Replacing keeps the count at 1 and the payments at 2, so it
     walks past the two coarser checks and lands on the one that matters.

     Payments are matched on debtId, so a replaced record orphans every one of
     them and the card reads as though nothing had ever been paid — the exact
     data loss the edit path exists to spare the user, arriving through the edit
     path. Driven through the real controls: the edit button, the modal's fields,
     the shared Save. */
  flow('editing a debt keeps its payments and re-derives from the new total', function () {
    db.debts = [{
      id: 'ED', name: 'A lender', date: todayISO(),
      principal: 1000000, totalToRepay: 1300000, notes: ''
    }];
    db.debtPayments = [
      { id: 'EP1', debtId: 'ED', date: todayISO(), amount: 300000, notes: '' },
      { id: 'EP2', debtId: 'ED', date: todayISO(), amount: 200000, notes: '' }
    ];
    navigate('debts'); renderDebts();

    var btn = document.querySelector('[data-debt-edit="ED"]');
    if (!btn) throw new Error('setup failed: no edit control rendered');
    btn.click();
    // 1,300,000 was a typo for 1,500,000.
    document.getElementById('mDebtTotal').value = '1500000';
    document.getElementById('editModalSave').click();

    t.K_debts = db.debts.length;
    t.K_payments = db.debtPayments.length;
    t.K_total = db.debts[0].totalToRepay;
    // Read through the record's OWN id, not the literal 'ED'. Using the
    // literal would keep resolving against the orphaned payments and report
    // 500,000 while the card showed nothing paid — so the check named for the
    // orphaning would sit green while a vaguer one downstream caught it.
    t.K_id = db.debts[0].id;
    t.K_paid = debtPaid(db.debts[0].id);
    t.K_outstanding = debtOutstanding(db.debts[0]);
    t.K_interest = debtInterestPaid(db.debts[0]);

    if (t.K_debts !== 1) throw new Error('the edit created a second debt: ' + t.K_debts);
    if (t.K_total !== 1500000) throw new Error('the edit did not take: total is ' + t.K_total);
    if (t.K_payments !== 2) throw new Error('payments were touched: ' + t.K_payments + ' left of 2');
    if (t.K_id !== 'ED') {
      throw new Error('the debt has a new id (' + t.K_id + ') — it was replaced rather than mutated, ' +
                      'and every payment now points at a debt that no longer exists');
    }
    if (t.K_paid !== 500000) {
      throw new Error('the payments no longer resolve against the debt: paid reads ' + t.K_paid +
                      ' of 500000');
    }
    // Re-derived from the NEW total, without anything rewriting a payment.
    if (t.K_outstanding !== 1000000) {
      throw new Error('outstanding is ' + t.K_outstanding + ', expected 1500000 - 500000');
    }
    /* 500,000 repaid of 1,500,000 owed, against a 500,000 cost of borrowing:
       500,000 x 500,000 / 1,500,000 = 166,666.67, which rounds to 166,667.

       THE LITERAL, not the arithmetic. The expression here used to be
       Math.round(500000 * 500000 / 1500000) — a compile-time constant, so not a
       breach of the rule against a probe rebuilding the value it guards, but it
       restated the application's own formula in the place where the expected
       answer should be, and it did so two flows after this file argues against
       exactly that. An expectation written as a calculation is an expectation
       nobody can check by eye, and it agrees with a wrong implementation of the
       same formula for the same reason the implementation is wrong. */
    if (t.K_interest !== 166667) {
      throw new Error('interest did not re-derive from the new total: ' + t.K_interest +
                      ', expected 166667');
    }
  });

  /* A STORED NON-INTEGER DOES NOT REACH A MONEY FIELD MULTIPLIED.
     Red by removing moneyValue() from the debt principal render in index.html.

     The validators admit a non-integer deliberately — tightening them would
     retroactively reject somebody's backup — so a hand-edited file can carry
     principal: 1000.5. Rendered raw that becomes value="1000.5", and
     formatMoneyInput strips the decimal point on its pre-fill call, so the field
     shows 10,005 and Save writes it back. Ten times the stored figure, in a box
     the user is about to commit.

     The expectation is a hand-checkable literal, not a re-run of the helper:
     1000.5 rounds to 1001, which formatMoneyInput groups as "1,001". */
  flow('a stored non-integer reaches the edit field rounded, not multiplied', function () {
    db.debts = [{
      id: 'NI', name: 'A lender', date: todayISO(),
      principal: 1000.5, totalToRepay: 1300.5, notes: ''
    }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    document.querySelector('[data-debt-edit="NI"]').click();
    t.M_principal_field = document.getElementById('mDebtPrincipal').value;
    t.M_total_field = document.getElementById('mDebtTotal').value;

    if (t.M_principal_field !== '1,001') {
      throw new Error('the edit field shows "' + t.M_principal_field + '" for a stored 1000.5 — expected "1,001"');
    }
    if (t.M_total_field !== '1,301') {
      throw new Error('the total field shows "' + t.M_total_field + '" for a stored 1300.5 — expected "1,301"');
    }
    document.getElementById('editModalCancel').click();
  });

  /* AN EDIT CANNOT MAKE A DEBT REPAY LESS THAN IT LENT.
     Red by removing the refusal from the edit branch.

     The add form refuses this and the import validator refuses this; an edit
     path that clamped or accepted it would be the one door in three that lets
     the state through, and debtInterestPaid returns 0 for a negative cost — so
     it would read as an interest-free loan rather than as an error. */
  flow('an edit that repays less than it lent is refused, and stores nothing', function () {
    db.debts = [{
      id: 'RF', name: 'A lender', date: todayISO(),
      principal: 1000000, totalToRepay: 1300000, notes: ''
    }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    document.querySelector('[data-debt-edit="RF"]').click();
    document.getElementById('mDebtTotal').value = '500000';   // below principal
    document.getElementById('editModalSave').click();

    t.L_total_after = db.debts[0].totalToRepay;
    t.L_modal_open = document.getElementById('editModal').classList.contains('show');
    t.L_toast = document.getElementById('toast').textContent;

    if (t.L_total_after !== 1300000) {
      throw new Error('a debt repaying less than it lent was stored: ' + t.L_total_after);
    }
    if (!t.L_modal_open) {
      throw new Error('the modal closed on a refused edit, so the user cannot see or fix the value');
    }
    if (!/cannot be less/i.test(t.L_toast)) {
      throw new Error('the refusal did not say why: "' + t.L_toast + '"');
    }
    // Close it so later flows are not left inside a modal.
    document.getElementById('editModalCancel').click();
  });

  /* CONDITION 4 — ISOLATION THROUGH THE REAL CONTROLS.
     The store-seam assertion in v1-write-flows.js seeds db.debts directly.
     This one creates a debt and a payment by TAPPING, which is the path a
     future engineer would actually change. Red by adding a db.income.push to
     the debt-save handler — the shape somebody would write while "making the
     loan show up". */
  flow('a debt created by tapping still reaches no Dashboard total', function () {
    db.income = [{ id: 'I1', date: todayISO(), amount: 500000, typeId: db.incomeTypes[0].id, notes: '' }];
    db.actual = [{ id: 'A1', date: todayISO(), amount: 120000, categoryId: db.categories[0].id, notes: '' }];
    db.planned = []; db.debts = []; db.debtPayments = [];
    setDashPreset('all');

    var read = function () {
      return withFramesRun(function () {
        navigate('dashboard'); renderDashboard();
        return {
          income:  document.getElementById('kpiIncome').textContent,
          expense: document.getElementById('kpiExpenses').textContent,
          net:     document.getElementById('kpiNet').textContent
        };
      });
    };
    var before = read();

    navigate('debts');
    document.getElementById('debtName').value = 'Tapped lender';
    document.getElementById('debtPrincipal').value = '1000000';
    document.getElementById('debtTotal').value = '1300000';
    document.getElementById('debtDate').value = todayISO();
    document.getElementById('debtAdd').click();
    t.D_debts_created = db.debts.length;
    if (t.D_debts_created !== 1) {
      throw new Error('setup failed: the add control created ' + t.D_debts_created + ' debts');
    }

    document.querySelector('[data-debt-pay]').click();
    document.getElementById('mAmount').value = '650000';
    document.getElementById('editModalSave').click();
    t.D_payments_created = db.debtPayments.length;
    if (t.D_payments_created !== 1) {
      throw new Error('setup failed: the payment modal created ' + t.D_payments_created + ' payments');
    }

    var after = read();
    t.D_before = before; t.D_after = after;
    // All THREE tiles, matching the guard in v1-write-flows.js. This one used
    // to check income and net only, so a starved-clock #kpiExpenses reading
    // "₮0" would have compared "₮0" to "₮0" and passed — the exact vacuity the
    // stubbed clock exists to prevent, surviving in the guard that certifies
    // the stub worked.
    if (!/[1-9]/.test(before.income) || !/[1-9]/.test(before.expense) || !/[1-9]/.test(before.net)) {
      throw new Error('setup failed: a tile read zero (' + before.income + ' / ' +
                      before.expense + ' / ' + before.net + '), so the comparison is vacuous');
    }
    if (before.income !== after.income) {
      throw new Error('a tapped debt moved Income: ' + before.income + ' -> ' + after.income +
                      ' — borrowed money is being counted as earned');
    }
    if (before.expense !== after.expense) {
      throw new Error('a tapped payment moved Expenses: ' + before.expense + ' -> ' + after.expense +
                      ' — repaying principal is not spending');
    }
    if (before.net !== after.net) {
      throw new Error('a tapped debt moved Net Balance: ' + before.net + ' -> ' + after.net);
    }

    // And the cost IS visible where it belongs. 650,000 of 1,300,000 repaid,
    // against a 300,000 cost, is 150,000 — hand-checkable.
    navigate('debts'); renderDebts();
    t.D_totals = document.getElementById('debtTotals').textContent.replace(/\s+/g, ' ').trim();
    if (t.D_totals.indexOf('150,000') === -1) {
      throw new Error('half of a 300,000 cost is 150,000; the screen says: ' + t.D_totals);
    }
  });

  /* CONDITION 5 — NO HORIZONTAL SCROLL AT 320px WITH USER-SUPPLIED TEXT.
     Run with --width 320. Three user-supplied or user-driven strings reach this
     card and all three are in the fixture: the lender name, the note chip, and
     a seven-figure amount.

     WHAT THIS FLOW GUARANTEES: that rendering this card at 320px does not make
     the PAGE scroll sideways.

     WHAT IT DOES NOT GUARANTEE, and the distinction is the whole reason the
     diagnostics below are not assertions: that any individual figure or word
     stays on one line. This application ACCEPTS wrapping in preference to
     sideways scroll, deliberately and on the record — the `.kpi .value` rule
     derives it for the headline-figure classes, and `.debt-total-value` is the
     same choice for this screen. A flow that asserted "the figure
     did not wrap" would be asserting against a decision the application made on
     purpose. So wrapping is MEASURED here (E_diag_cost_value_rects) and
     asserted nowhere.

     THE DECLARATIONS UNDER TEST are `.goal-meta-item.note` and `.debt-name` —
     the `overflow-wrap: anywhere` rules that
     stop a long unbroken token from setting a floor this card cannot shrink
     past. Delete either and this flow reddens; measured, most recently at 91px
     of overflow with :1559 removed.

     EACH FIXTURE STRING MUST CONTAIN AN UNBROKEN RUN, and that is not
     decoration. The first version was 78 characters of ordinary words — "Khaan
     Bank Non Banking Financial Institution Ulaanbaatar Branch Number Fourteen".
     Long, realistic, and completely unable to detect what it was written to
     guard: every word in it is shorter than the card, so the line wraps at a
     space whether the declaration is present or not, and deleting the
     declaration left the flow green. `overflow-wrap: anywhere` only does
     anything to a TOKEN longer than its container. Mongolian compounds run this
     long unspaced, and a user typing into a free-text field can produce one in
     any language.

     Keep both halves of each string: the spaced words prove ordinary names
     still fit, the unbroken run is what makes the assertion capable of
     failing. */
  flow('a long lender name does not push the page sideways', function () {
    /* THE AMOUNTS ARE SEVEN-FIGURE, and that is the second thing this fixture
       is for. `.debt-total-value` released its wrapping with
       `overflow-wrap: anywhere`, which converts an overfilled
       figure into a mid-number line break rather than a page overflow — so the
       assertion below reads zero on the failure exactly as it does on the
       success, and cannot see it. 10,000,000 borrowed against 13,000,000 owed,
       6,500,000 repaid, puts 1,500,000 into "Cost so far": ten glyphs in
       the largest type on the screen, in a flex item that is 40% of a 320px
       card. That is the width the diagnostic below is taken at. */
    db.debts = [{
      id: 'LONG', date: todayISO(), principal: 10000000, totalToRepay: 13000000,
      name: 'Khaan Bank ' +
            'banksanhuugiinbaiguullagaulaanbaatarsalbardugaararvandurov ' +
            'Ulaanbaatar Branch',
      // TWO free-text fields reach this card and both are user-supplied, so
      // both carry an unbroken run: an assertion that covered one of the two
      // would look exactly like one that covered both.
      //
      // This sentence used to justify the note's run by saying `.debt-meta-item`
      // declares no overflow-wrap of its own. Both halves were false by the time
      // anyone read them. `.debt-meta-item` was DELETED in WORK-184(b), which
      // merged the debt chips into `.goal-meta-item`; and the class the chip
      // actually carries, `.goal-meta-item.note`, DOES
      // declare `overflow-wrap: anywhere`. The run is needed for the opposite
      // reason to the one recorded: not because the declaration is missing, but
      // because a declaration that only acts on an over-long token is untested
      // without one.
      notes: 'gurvansaryntursguitshuudguitgereenuudeeravchirsanhugatsaanduusna'
    }];
    db.debtPayments = [{ id: 'LP', debtId: 'LONG', date: todayISO(), amount: 6500000, notes: '' }];
    navigate('debts'); renderDebts();

    var de = document.documentElement;
    t.E_page_overflow = de.scrollWidth - de.clientWidth;
    t.E_viewport = de.clientWidth;
    var card = document.querySelector('.debt-card');
    if (!card) throw new Error('setup failed: no debt card rendered');

    /* THE SETUP ASSERTIONS COME FIRST, AND THE NOTE ONE IS NOT CEREMONY.
       Deleting the note render from the application left this flow GREEN —
       measured, exit 0 — because a chip that never renders cannot overflow.
       So the half of the fixture that carries the second user-supplied field
       was guarding nothing: the flow would have gone on reporting "a long
       lender name does not push the page sideways" about a card that no longer
       had a note on it at all. run.mjs:45-46 states the house rule this broke —
       assert the fixture produced the thing you are measuring before measuring
       it.

       It is placed BEFORE the overflow throw deliberately. Deleting the note
       REDUCES overflow, so there is no competing red: if both could fire, the
       flow would report an overflow failure for a setup fault and send the next
       reader to the CSS. */
    var noteChip = card.querySelector('.goal-meta-item.note');
    if (!noteChip) {
      throw new Error('setup failed: the note chip did not render — the fixture\'s ' +
                      'second user-supplied field is not on the card being measured');
    }

    /* DIAGNOSTIC, not an assertion — C42(b). Recorded because it is the first
       thing worth knowing when the overflow assertion fires, and asserted
       against nothing because there is no honest comparison for it that page
       overflow does not already imply: a card narrower than its container is
       not a defect, and a card wider than one IS the page overflow above. */
    t.E_diag_card_width = Math.round(card.getBoundingClientRect().width);

    /* DIAGNOSTIC, and deliberately NOT an assertion — the second half of C42(b).

       WHAT IT MEASURES. getClientRects() returns one rect per line box, so a
       figure that fits on one line reports 1 and a figure broken mid-number
       reports 2. "Paid in interest" is the figure this module exists to
       produce, it is set in the largest type on the screen, and its own rule
       releases wrapping with `overflow-wrap: anywhere` — so at 320px it may
       break between two digits and read as two numbers. Nobody has ever
       measured whether it does.

       WHY IT IS NOT ASSERTED, and this is the part not to quietly upgrade
       later. `=== 1` would assert a property the application does not hold.
       `.kpi .value` has run at the same token with the same wrap release in
       narrower .grid-2 tiles for many rounds, and the `.kpi .value` rule records
       that wrapping was DELIBERATELY CHOSEN there over sideways scroll. So an
       asserted line count would go red on correct code the first time a longer
       amount, a wider theme font or a raised token met it — and an assertion
       that goes red on correct code is a defect in the assertion.

       So it is measured every run and compared to nothing. If it comes back
       greater than 1, that is evidence for a UI round about whether the
       headline figure should wrap, not a guard failing. */
    var costValue = document.querySelector('.debt-total-item.cost .debt-total-value');
    if (!costValue) {
      throw new Error('setup failed: no "Paid in interest" value rendered — the ' +
                      'seven-figure seed did not reach the summary card');
    }
    t.E_diag_cost_value_rects = costValue.getClientRects().length;
    t.E_diag_cost_value_text = costValue.textContent.trim();

    if (t.E_page_overflow !== 0) {
      throw new Error('page overflows by ' + t.E_page_overflow + 'px at ' + t.E_viewport +
                      ' — a lender name is user-supplied text');
    }
  });

  /* CONTAINMENT — renderDebts writes nothing outside #debts.
     Red by adding a write to an element on another screen inside renderDebts.

     COVERAGE: #dashboard, #income, #expenses and #goals. Containment beyond
     those four is still a REVIEW condition — read the function and check that
     every getElementById in it resolves inside #debts. This assertion narrows
     the eye's job to four screens; it does not retire it.

     The first version of this flow checked that three static elements were
     descendants of #debts, which is a property of the MARKUP and not of
     renderDebts at all. Adding a stray write to another screen left it green;
     it reddened only if somebody physically moved an element out of the
     section, which nobody would do. It looked like a guard and stopped the eye
     without replacing it.

     THE BASELINE IS TAKEN FIRST, and it is not ceremony. If any of these four
     screens rendered non-deterministically — a timestamp, a tween mid-flight, a
     random ordering — the snapshot comparison would go red against a correct
     application, and this project has already paid once for an assertion that
     fails on correct code. So each screen is RENDERED AGAIN between the two
     snapshots and the two are required to match before anything else is
     asserted. A screen that fails that throws by name, unless it is listed in
     ALLOW_UNSTABLE with a written reason.

     This paragraph used to end "the four are snapshotted twice with nothing in
     between", and WORK-191 made that false without correcting it here — the
     re-render it added is the whole content of that item, and the sentence
     describing the construction it replaced outlived it by one commit, twenty
     lines above the code. Both halves of the fix are stated at the call site
     below; this is the summary, and a summary that contradicts what it
     summarises is worse than no summary. */
  flow('renderDebts writes nothing outside #debts', function () {
    var SCREENS = ['dashboard', 'income', 'expenses', 'goals'];

    // Give each screen something to render, so the snapshots are of populated
    // markup rather than four empty states that would match trivially.
    db.income = [{ id: 'C1', date: todayISO(), amount: 500000, typeId: db.incomeTypes[0].id, notes: '' }];
    db.actual = [{ id: 'C2', date: todayISO(), amount: 120000, categoryId: db.categories[0].id, notes: '' }];
    db.goals = [{ id: 'C3', name: 'A goal', target: 1000000, icon: '🎯', notes: '' }];
    db.goalContributions = [{ id: 'C4', goalId: 'C3', date: todayISO(), amount: 250000, notes: '' }];
    db.debts = [{ id: 'C5', name: 'A lender', date: todayISO(), principal: 1000000, totalToRepay: 1300000, notes: '' }];
    db.debtPayments = [{ id: 'C6', debtId: 'C5', date: todayISO(), amount: 650000, notes: '' }];

    // Render all four. Called twice below, because a baseline that does not
    // re-render cannot observe non-determinism.
    function renderAllFour() {
      withFramesRun(function () {
        navigate('dashboard'); renderDashboard();
        navigate('income');    renderIncome();
        navigate('expenses');  renderExpenses();
        navigate('goals');     renderGoals();
      });
    }

    function snapshot() {
      var out = {};
      SCREENS.forEach(function (id) { out[id] = document.getElementById(id).innerHTML; });
      return out;
    }

    /* data-num-token is a monotonic counter, and the baseline normalises it
       while the containment check deliberately does NOT.

       nextNumToken() increments a per-element counter and writes it to the DOM,
       so setNumAnimated can abandon a tween whose ticket has been superseded.
       It therefore advances on every render of an animated tile, with the
       displayed value and data-num-value identical. Two Dashboard renders differ
       by exactly that attribute and nothing else — measured: token "3" against
       "5", 7825 bytes both, first divergence at offset 1661.

       Stripping it from the BASELINE is correct: the baseline asks "does
       rendering this screen twice produce the same markup", and a bookkeeping
       ticket that exists to be different is not part of that question.

       Leaving it IN the containment comparison is also correct, and is why this
       is not normalisation-as-a-dodge. Between `a` and `after` only renderDebts
       runs, and renderDebts must not call renderDashboard. If it did, the token
       would advance even when every displayed figure was unchanged — so keeping
       it raw there turns the counter into the tripwire for the one containment
       violation that would otherwise be invisible. */
    function withoutTokens(snap) {
      var out = {};
      Object.keys(snap).forEach(function (id) {
        out[id] = snap[id].replace(/ data-num-token="\d+"/g, '');
      });
      return out;
    }

    /* THE BASELINE RE-RENDERS BETWEEN THE TWO SNAPSHOTS, and the first version
       did not — it read innerHTML twice in a row with nothing in between, which
       compares a thing with itself and always matches. None of the three cases
       the header names could have been detected, and `stable` was the full set
       on every run by construction.

       That was not an implementation slip: the Round 12 acceptance condition
       said "take the four snapshots twice with NOTHING between them", and this
       was that sentence compiled. The Chief Architect has recorded the defect as
       its own. It is why C37 now binds the author of a condition to write the
       reddening perturbation before publishing it. */
    renderAllFour();
    var a = snapshot();
    renderAllFour();
    var b = snapshot();

    var aNorm = withoutTokens(a);
    var bNorm = withoutTokens(b);
    var stable = SCREENS.filter(function (id) { return aNorm[id] === bNorm[id]; });
    t.J_stable_screens = stable.join(',');
    t.J_dropped = SCREENS.filter(function (id) { return aNorm[id] !== bNorm[id]; }).join(',') || 'none';

    /* AND A SHORTFALL THROWS, NAMING THE SCREEN — which is the half nobody
       reported and the reason this item was widened.

       The containment loop below iterates `stable`, not SCREENS. So without this
       check a screen that became non-deterministic would silently leave
       coverage: the command stays green, containment is asserted over three
       screens instead of four, and the only trace is a field in output nobody is
       required to read. A guard that quietly says yes to less on every run,
       without anyone editing anything, is worse than one that was never written.

       ALLOW_UNSTABLE is empty and every addition to it carries a written reason.
       An entry here is a statement that a screen is known non-deterministic and
       is knowingly outside containment coverage. */
    var ALLOW_UNSTABLE = [];      // { id, reason } — empty, and additions are justified
    var unexpected = SCREENS.filter(function (id) {
      return stable.indexOf(id) === -1 &&
             !ALLOW_UNSTABLE.some(function (x) { return x.id === id; });
    });
    if (unexpected.length) {
      throw new Error('screen(s) no longer snapshot deterministically and are not in ALLOW_UNSTABLE: ' +
                      unexpected.join(', ') + ' — containment would silently stop covering them');
    }

    /* Compared against `b`, NOT `a`, and the difference matters.

       `b` is the snapshot taken immediately before this line, so anything that
       differs afterwards is attributable to navigate('debts') + renderDebts()
       and to nothing else. Comparing against `a` was wrong and the strengthened
       baseline caught it on its first run: the second renderAllFour() sits
       between `a` and here, and it legitimately advances the Dashboard's
       data-num-token counters, so the check reported "renderDebts changed
       #dashboard" about a write renderDebts had not made.

       Raw, with tokens intact — see withoutTokens above. Nothing between `b` and
       `after` may advance a Dashboard tween ticket, so if one moves, something
       called renderDashboard from inside renderDebts. */
    navigate('debts');
    renderDebts();

    var after = snapshot();
    stable.forEach(function (id) {
      if (after[id] !== b[id]) {
        throw new Error('renderDebts changed #' + id + ' — it writes outside its own screen');
      }
    });
  });

  /* NO FILTER ROW — the structural half of condition 1. A control here would
     make "how much do I still owe" a function of a date range. */
  flow('the Debts screen carries no date filter', function () {
    var section = document.getElementById('debts');
    var filters = section.querySelectorAll('.filter-row, [id$="Preset"], [id$="From"], [id$="To"]');
    t.G_filter_controls = filters.length;
    if (filters.length) {
      throw new Error(filters.length + ' filter control(s) on a screen of stocks');
    }
  });

  /* CONDITION 8 — THE SPLIT. A finished debt must not sit above money still
     owed, and the finished ones keep the order they were entered in, because
     nothing has earned the right to order debts that are over.

     THIS FLOW NO LONGER GUARDS THE LIVE PAIR'S ORDER, and the removal is the
     point rather than a loss. It used to assert that the live debts kept entry
     order; that rule ended when the list was ordered by what is still owed.
     Its fixture would have gone on passing either way, because the two live
     records happen to be entered in ascending order — a green that cannot
     fail. The live order is guarded by the flow below, on a fixture built so
     that entry order and size order disagree.

     Red by dropping the cleared/live clause in renderDebts' comparator. */
  flow('cleared debts sink below the ones still owed', function () {
    db.debts = [
      { id: 'S1', name: 'Cleared first', date: todayISO(), principal: 100000, totalToRepay: 100000, notes: '' },
      { id: 'S2', name: 'Still owed A',  date: todayISO(), principal: 200000, totalToRepay: 200000, notes: '' },
      { id: 'S3', name: 'Cleared again', date: todayISO(), principal: 300000, totalToRepay: 300000, notes: '' },
      { id: 'S4', name: 'Still owed B',  date: todayISO(), principal: 400000, totalToRepay: 400000, notes: '' }
    ];
    db.debtPayments = [
      { id: 'SP1', debtId: 'S1', date: todayISO(), amount: 100000, notes: '' },
      { id: 'SP3', debtId: 'S3', date: todayISO(), amount: 300000, notes: '' }
    ];
    navigate('debts'); renderDebts();

    var names = Array.prototype.map.call(
      document.querySelectorAll('#debtList .debt-name'),
      function (n) { return n.textContent.trim(); });
    t.N_order = names;
    if (names.length !== 4) throw new Error('expected 4 cards, got ' + names.length);
    if (names[0] !== 'Still owed A' || names[1] !== 'Still owed B') {
      throw new Error('a cleared debt outranks money still owed: ' + names.join(' | '));
    }
    // The finished pair kept the order it was entered in. Nothing orders
    // debts that are over, and the stable sort gives that for free.
    if (names[2] !== 'Cleared first' || names[3] !== 'Cleared again') {
      throw new Error('the finished pair lost its relative order: ' + names.join(' | '));
    }

    // Rendering must not rewrite what is stored. A sort in place would be
    // persisted by the next save — a render with a side effect on user data.
    t.N_stored_order = db.debts.map(function (d) { return d.id; }).join(',');
    if (t.N_stored_order !== 'S1,S2,S3,S4') {
      throw new Error('renderDebts reordered the stored data: ' + t.N_stored_order);
    }
  });

  /* CONDITION 8b — THE LIVE DEBTS ARE ORDERED BY WHAT IS STILL OWED, SMALLEST
     FIRST, AND THE APPLICATION SAYS NOTHING ABOUT WHY.

     THE FIXTURE IS BUILT SO ENTRY ORDER AND SIZE ORDER DISAGREE, and that is
     the whole of its design. The flow above used to carry this rule's opposite
     on a fixture where the two agreed, so it would have passed whichever rule
     was true — the defect a green that cannot fail always is. Here the records
     are entered largest-first, so insertion order and the asserted order are
     exact reverses of each other.

     THE KEY IS WHAT IS STILL OWED AND NOT THE AGREED TOTAL, and the fixture
     separates those too: the debt with the LARGEST agreed total has the
     SMALLEST amount left, so a comparator reading totalToRepay puts it last
     where this asserts it first.

     AND NOTHING ON THE SCREEN NAMES A STRATEGY. The order is the product's,
     taken by ruling; the application states no word, badge, number or icon
     about a repayment order, and the last assertion here is what keeps that
     true when somebody later wants to explain the order to the user.

     Red by dropping the size clause from renderDebts' comparator, or by
     keying it on totalToRepay. */
  flow('the live debts are ordered by what is still owed, and nothing says so', function () {
    db.debts = [
      // Entered largest-left first; each name states what it should rank.
      { id: 'O1', name: 'Fourth',  date: todayISO(), principal: 900000, totalToRepay: 900000, notes: '' },
      { id: 'O2', name: 'Third',   date: todayISO(), principal: 700000, totalToRepay: 700000, notes: '' },
      { id: 'O3', name: 'Second',  date: todayISO(), principal: 400000, totalToRepay: 400000, notes: '' },
      // Largest agreed total, smallest amount left: separates the two keys.
      { id: 'O4', name: 'First',   date: todayISO(), principal: 950000, totalToRepay: 950000, notes: '' }
    ];
    db.debtPayments = [
      { id: 'OP4', debtId: 'O4', date: todayISO(), amount: 900000, notes: '' }
    ];
    navigate('debts'); renderDebts();

    t.O_entry_order = db.debts.map(function (d) { return d.name; }).join(' | ');
    t.O_left = db.debts.map(function (d) { return debtOutstanding(d); }).join(',');
    t.O_rendered = Array.prototype.map.call(
      document.querySelectorAll('#debtList .debt-name'),
      function (n) { return n.textContent.trim(); });

    if (t.O_rendered.length !== 4) throw new Error('expected 4 cards, got ' + t.O_rendered.length);
    if (t.O_rendered.join(' | ') !== 'First | Second | Third | Fourth') {
      throw new Error('the live debts are not ordered by what is left: ' + t.O_rendered.join(' | '));
    }
    // The fixture would be worthless if entry order already matched.
    if (t.O_entry_order === t.O_rendered.join(' | ')) {
      throw new Error('the fixture no longer separates entry order from size order');
    }

    // Rendering must not rewrite what is stored.
    t.O_stored = db.debts.map(function (d) { return d.id; }).join(',');
    if (t.O_stored !== 'O1,O2,O3,O4') {
      throw new Error('renderDebts reordered the stored data: ' + t.O_stored);
    }

    /* AND THE SCREEN SAYS NOTHING ABOUT AN ORDER. No strategy word, no rank,
       no badge. The order is the product's and the user is told nothing. */
    t.O_screen = document.getElementById('debts').textContent.replace(/\s+/g, ' ');
    if (/snowball|avalanche|strategy|pay this one first|smallest first|priority|recommend|rank/i.test(t.O_screen)) {
      throw new Error('the screen names a repayment order');
    }
  });

  /* CONDITION 9 — THE SUMMARY RECONCILES. Paid back so far plus Still owed is
     the total agreed, including when a debt has been overpaid, which is the
     case the rest of this screen is already careful about. Red by dropping the
     Math.min cap on totalPaid. */
  flow('paid back plus still owed is the total agreed', function () {
    db.debts = [
      { id: 'T1', name: 'Overpaid',  date: todayISO(), principal: 100000, totalToRepay: 130000, notes: '' },
      { id: 'T2', name: 'Part paid', date: todayISO(), principal: 200000, totalToRepay: 200000, notes: '' }
    ];
    db.debtPayments = [
      { id: 'TP1', debtId: 'T1', date: todayISO(), amount: 200000, notes: '' },  // 70,000 over
      { id: 'TP2', debtId: 'T2', date: todayISO(), amount: 50000,  notes: '' }
    ];
    navigate('debts'); renderDebts();

    var vals = Array.prototype.map.call(
      document.querySelectorAll('#debtTotals .debt-total-item'),
      function (item) {
        return {
          label: item.querySelector('.debt-total-label').textContent.trim(),
          value: unmoney(item.querySelector('.debt-total-value').textContent)
        };
      });
    t.O_tiles = vals;
    var by = {};
    vals.forEach(function (v) { by[v.label] = v.value; });
    if (!('Paid back so far' in by)) throw new Error('no paid-back tile: ' + vals.map(function (v) { return v.label; }).join(' | '));

    var agreed = 130000 + 200000;
    t.O_agreed = agreed;
    if (by['Paid back so far'] + by['Still owed'] !== agreed) {
      throw new Error('paid ' + by['Paid back so far'] + ' + owed ' + by['Still owed'] +
                      ' = ' + (by['Paid back so far'] + by['Still owed']) + ', not the agreed ' + agreed);
    }
    // The cap is PER DEBT: T1's 70,000 overpayment must not absorb T2's
    // outstanding 150,000.
    if (by['Still owed'] !== 150000) throw new Error('still owed is ' + by['Still owed'] + ', expected 150000');

    /* THE CARD REPORTS THE LEDGER, UNCAPPED, AND SAYS SO WHEN IT DIFFERS.
       Red by capping the card's paid figure at the debt's total.

       This fixture has seeded the overpayment state since it was written and
       asserted only the summary, so the card underneath it - stating 200,000
       against the tile's 130,000, in the same word, one card apart - was
       invisible to this file. The tile caps because an aggregate exceeding
       everything ever agreed is the worse lie; the card does not, because
       reducing what the user recorded to make two of the app's own figures
       agree is the app under-reporting the user's own data. Two figures, two
       jobs, and a line on the card reconciling them. */
    /* BY LENDER NAME, NOT BY POSITION. T1 is overpaid, so debtOutstanding
       reads zero, so the cleared-debts sink moves it BELOW T2 - and indexing
       [0] here read the part-paid debt and reported a failure that was the
       test's, not the app's. */
    var cardsNow = Array.prototype.slice.call(document.querySelectorAll('.debt-card'));
    var pick = function (name) {
      for (var i = 0; i < cardsNow.length; i++) {
        if (cardsNow[i].querySelector('.debt-name').textContent.trim() === name) return cardsNow[i];
      }
      throw new Error('no card for ' + name);
    };
    var t1card = pick('Overpaid');
    t.O_card_paid = unmoney(t1card.querySelector('.debt-numbers .paid').textContent);
    if (t.O_card_paid !== 200000) {
      throw new Error('the card reports ' + t.O_card_paid + ' paid, not the 200,000 recorded — ' +
                      'the app is under-reporting what the user entered');
    }
    t.O_card_note = (t1card.textContent.match(/more than agreed[^.]*./) || [''])[0];
    if (t1card.textContent.indexOf('70,000 more than agreed') < 0) {
      throw new Error('the card states 200,000 paid of 130,000 with nothing accounting for the gap');
    }

    // And a correctly-entered debt grows no such line.
    var t2card = pick('Part paid');
    if (t2card.textContent.indexOf('more than agreed') >= 0) {
      throw new Error('a debt paid within its agreed total carries an overpayment line');
    }
    if (by['Borrowed in total'] !== 300000) throw new Error('borrowed is ' + by['Borrowed in total']);

    // A fourth tile was added to this card, and this file runs at 320. The
    // tiles wrap two to a row; nothing may spill out of the card doing it.
    var card = document.getElementById('debtTotals');
    var cardRect = card.getBoundingClientRect();
    t.O_overflow = Math.round(card.scrollWidth - card.clientWidth);
    if (card.scrollWidth > card.clientWidth + 1) {
      throw new Error('the totals card overflows by ' + t.O_overflow + 'px at ' + t.viewport_clientWidth);
    }
    Array.prototype.forEach.call(card.querySelectorAll('.debt-total-item'), function (item) {
      if (item.getBoundingClientRect().right > cardRect.right + 1) {
        throw new Error('a tile spills out of the totals card at ' + t.viewport_clientWidth);
      }
    });
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      throw new Error('the page scrolls sideways with four tiles on screen');
    }
  });
  /* CONDITION 10 — A SETTLED DEBT STOPS SOLICITING PAYMENTS.
     "+ Payment" is kept on a cleared card, because correcting a mis-entered
     payment is legitimate and this is the door to it. It stops being the
     accented primary action, which was inviting the now-rare action with more
     weight than the "✓ Cleared" beside it. Geometry must NOT change — the 44px
     target is a project rule, not a style. Red by dropping the
     .debt-card.cleared button.goal-add rule. */
  flow('a cleared card stops pushing + Payment as its primary action', function () {
    db.debts = [
      { id: 'C1', name: 'Settled', date: todayISO(), principal: 100000, totalToRepay: 100000, notes: '' },
      { id: 'C2', name: 'Live',    date: todayISO(), principal: 200000, totalToRepay: 200000, notes: '' }
    ];
    db.debtPayments = [{ id: 'CP1', debtId: 'C1', date: todayISO(), amount: 100000, notes: '' }];
    navigate('debts'); renderDebts();

    var clearedBtn = document.querySelector('.debt-card.cleared button.goal-add');
    var liveBtn = document.querySelector('.debt-card:not(.cleared) button.goal-add');
    if (!clearedBtn || !liveBtn) throw new Error('setup failed: need one cleared and one live card');
    var cs = getComputedStyle(clearedBtn), ls = getComputedStyle(liveBtn);
    t.P_cleared_bg = cs.backgroundColor;
    t.P_live_bg = ls.backgroundColor;
    t.P_cleared_h = Math.round(clearedBtn.getBoundingClientRect().height);
    t.P_live_h = Math.round(liveBtn.getBoundingClientRect().height);

    if (cs.backgroundColor === ls.backgroundColor) {
      throw new Error('a cleared debt still paints + Payment as the primary action: ' + cs.backgroundColor);
    }
    // Demoted, not shrunk. Both must still clear the 44px touch minimum.
    if (t.P_cleared_h < 44) throw new Error('the demoted button is ' + t.P_cleared_h + 'px tall');
    if (t.P_cleared_h !== t.P_live_h) {
      throw new Error('demotion changed geometry: cleared ' + t.P_cleared_h + ' vs live ' + t.P_live_h);
    }
    // And it is still there — removing it would remove the correction path.
    if (clearedBtn.getAttribute('data-debt-pay') !== 'C1') {
      throw new Error('the cleared card lost its payment control');
    }
  });

  /* CONDITION 11 — NO REPAYMENT BEFORE THE LOAN.
     Money cannot be repaid before it was lent, and the state is reachable
     through TWO doors: dating a payment early, or moving the borrow date past
     a payment already recorded. Both are refused rather than clamped, matching
     the total-below-principal rule this module already enforces both ways.
     Red by dropping either guard in the save handler. */
  flow('a payment cannot be dated before the money was borrowed', function () {
    var borrowed = '2026-03-10';
    db.debts = [{ id: 'E1', name: 'A lender', date: borrowed, principal: 100000, totalToRepay: 100000, notes: '' }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    openDebtPaymentModal('E1');
    // The picker carries the bound too, so the common path never reaches the
    // handler's refusal.
    t.Q_min_attr = document.getElementById('mDate').getAttribute('min');
    if (t.Q_min_attr !== borrowed) throw new Error('date field min is ' + t.Q_min_attr + ', expected ' + borrowed);

    document.getElementById('mDate').value = '2026-03-09';
    document.getElementById('mAmount').value = '50000';
    document.getElementById('editModalSave').click();
    t.Q_after_early = db.debtPayments.length;
    t.Q_sheet_open = document.getElementById('editModal').classList.contains('show');
    if (t.Q_after_early !== 0) throw new Error('a payment dated before the loan was stored');
    if (!t.Q_sheet_open) throw new Error('the sheet closed over a refused date');

    // The boundary itself is legal — same day is not "before".
    document.getElementById('mDate').value = borrowed;
    document.getElementById('editModalSave').click();
    t.Q_after_same_day = db.debtPayments.length;
    if (t.Q_after_same_day !== 1) throw new Error('a payment on the borrow date was refused');
  });

  flow('the borrow date cannot be moved past a payment already recorded', function () {
    db.debts = [{ id: 'F1', name: 'A lender', date: '2026-03-10', principal: 100000, totalToRepay: 100000, notes: '' }];
    db.debtPayments = [{ id: 'FP1', debtId: 'F1', date: '2026-03-15', amount: 50000, notes: '' }];
    navigate('debts'); renderDebts();

    openDebtEditModal('F1');
    t.R_max_attr = document.getElementById('mDebtDate').getAttribute('max');
    if (t.R_max_attr !== '2026-03-15') throw new Error('borrow-date max is ' + t.R_max_attr);

    document.getElementById('mDebtDate').value = '2026-03-20';
    document.getElementById('editModalSave').click();
    t.R_date_after = db.debts[0].date;
    if (t.R_date_after !== '2026-03-10') {
      throw new Error('the borrow date moved past its payment to ' + t.R_date_after);
    }

    // A legal move still works, so the guard is a bound and not a freeze.
    document.getElementById('mDebtDate').value = '2026-03-12';
    document.getElementById('editModalSave').click();
    t.R_date_legal = db.debts[0].date;
    if (t.R_date_legal !== '2026-03-12') {
      throw new Error('a legal borrow-date change was refused: ' + t.R_date_legal);
    }
  });
  /* CONDITION 12 — A DUE DATE IS A REMINDER, NOT A PLANNED EXPENSE.
     This is the binding condition the whole feature was approved under. A due
     date reaches the bell and nothing else: writing a planned expense from it
     would push debt money into the Dashboard through Planned vs Actual and
     "Left After Plan", which is the one door CONDITION 1 and the no-Dashboard
     flow exist to keep shut. Red by having renderDebts or debtAdd push to
     db.planned. */
  flow('a debt due date creates no planned expense and no actual', function () {
    db.planned = []; db.actual = []; db.income = [];
    db.debts = []; db.debtPayments = [];
    navigate('debts');
    document.getElementById('debtName').value = 'A lender';
    document.getElementById('debtPrincipal').value = '1000000';
    document.getElementById('debtTotal').value = '1300000';
    document.getElementById('debtDate').value = todayISO();
    document.getElementById('debtDue').value = '2026-12-01';
    document.getElementById('debtAdd').click();

    t.S_debts = db.debts.length;
    t.S_due = db.debts.length ? db.debts[0].dueDate : null;
    t.S_planned = db.planned.length;
    t.S_actual = db.actual.length;
    if (t.S_debts !== 1) throw new Error('the debt was not stored');
    if (t.S_due !== '2026-12-01') throw new Error('due date stored as ' + t.S_due);
    if (t.S_planned !== 0) throw new Error(t.S_planned + ' planned expense(s) written from a debt due date');
    if (t.S_actual !== 0) throw new Error(t.S_actual + ' actual expense(s) written from a debt due date');

    // And it still reaches no Dashboard figure, which is the reason the
    // previous two assertions matter.
    setDashPreset('all');
    withFramesRun(function () { navigate('dashboard'); renderDashboard(); });
    t.S_kpiExpenses = document.getElementById('kpiExpenses').textContent;
    t.S_pva = document.getElementById('pvaChart').textContent;
    if (unmoney(t.S_kpiExpenses) !== 0) throw new Error('a debt due date reached Expenses: ' + t.S_kpiExpenses);
    if (t.S_pva.indexOf('1,300,000') >= 0 || t.S_pva.indexOf('1,000,000') >= 0) {
      throw new Error('a debt appears in Planned vs Actual: ' + t.S_pva);
    }
  });

  /* CONDITION 13 — THE DUE DATE IS BOUNDED AND OPTIONAL.
     Optional because money from family usually has no agreed date; bounded
     because a debt cannot fall due before it was lent. Both write paths refuse
     rather than clamp. Red by dropping either guard. */
  flow('a due date earlier than the borrow date is refused', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts');
    document.getElementById('debtName').value = 'Backwards';
    document.getElementById('debtPrincipal').value = '100000';
    document.getElementById('debtTotal').value = '100000';
    document.getElementById('debtDate').value = '2026-05-10';
    document.getElementById('debtDue').value = '2026-05-09';
    document.getElementById('debtAdd').click();
    t.T_after_bad_add = db.debts.length;
    if (t.T_after_bad_add !== 0) throw new Error('a debt due before it was borrowed was stored');

    // Optional: the same debt with the field left empty is accepted.
    document.getElementById('debtDue').value = '';
    document.getElementById('debtAdd').click();
    t.T_after_empty = db.debts.length;
    t.T_due_when_empty = db.debts.length ? db.debts[0].dueDate : 'MISSING';
    if (t.T_after_empty !== 1) throw new Error('a debt with no due date was refused');
    if (t.T_due_when_empty !== null) throw new Error('an empty due date stored as ' + t.T_due_when_empty);

    // And the edit path enforces the same bound, and can clear the date.
    var id = db.debts[0].id;
    db.debts[0].dueDate = '2026-06-01';
    openDebtEditModal(id);
    document.getElementById('mDebtDue').value = '2026-05-09';
    document.getElementById('editModalSave').click();
    t.T_edit_refused = db.debts[0].dueDate;
    if (t.T_edit_refused !== '2026-06-01') throw new Error('the edit path stored ' + t.T_edit_refused);

    document.getElementById('mDebtDue').value = '';
    document.getElementById('editModalSave').click();
    t.T_edit_cleared = db.debts[0].dueDate;
    if (t.T_edit_cleared !== null) throw new Error('clearing the due date left ' + t.T_edit_cleared);
  });

  /* CONDITION 14 — A SETTLED DEBT IS NOT OVERDUE.
     The date passed and nothing is owed, so the card must not paint a warning
     and the bell must not raise a reminder that cannot be acted on. Red by
     dropping the `cleared` branch in dueChip or the outstanding check in
     computeReminders. */
  flow('a cleared debt is never overdue', function () {
    db.debts = [
      { id: 'V1', name: 'Settled late', date: '2026-01-01', dueDate: '2026-02-01',
        principal: 100000, totalToRepay: 100000, notes: '' },
      { id: 'V2', name: 'Still owed',   date: '2026-01-01', dueDate: '2026-02-01',
        principal: 200000, totalToRepay: 200000, notes: '' }
    ];
    db.debtPayments = [{ id: 'VP1', debtId: 'V1', date: '2026-01-15', amount: 100000, notes: '' }];
    db.settings.notifications = {
      enabled: true, daysAhead: 7, showPlanned: false, showGoals: false,
      showRecurring: false, showDebts: true, lastNotifiedAt: 0
    };
    navigate('debts'); renderDebts();

    var clearedCard = document.querySelector('.debt-card.cleared');
    var liveCard = document.querySelector('.debt-card:not(.cleared)');
    t.U_cleared_chip = clearedCard.querySelector('.debt-meta').textContent.replace(/\s+/g, ' ');
    t.U_live_chip = liveCard.querySelector('.debt-meta').textContent.replace(/\s+/g, ' ');
    if (clearedCard.querySelector('.deadline-danger, .deadline-warning')) {
      throw new Error('a settled debt is painted overdue: ' + t.U_cleared_chip);
    }
    if (t.U_cleared_chip.indexOf('2026-02-01') < 0) {
      throw new Error('the settled card dropped the due date entirely: ' + t.U_cleared_chip);
    }
    if (!liveCard.querySelector('.deadline-danger')) {
      throw new Error('an unpaid overdue debt is not marked overdue: ' + t.U_live_chip);
    }

    var reminders = computeReminders().filter(function (r) { return r.type === 'debt'; });
    t.U_reminders = reminders.map(function (r) { return r.title; });
    if (reminders.length !== 1) throw new Error('expected 1 debt reminder, got ' + reminders.length);
    if (reminders[0].data.id !== 'V2') throw new Error('the reminder is for the settled debt');

    // The setting turns them off entirely.
    db.settings.notifications.showDebts = false;
    t.U_off = computeReminders().filter(function (r) { return r.type === 'debt'; }).length;
    if (t.U_off !== 0) throw new Error('debt reminders ignore their own setting');
  });

  /* CONDITION — REPLACING THE WHOLE DATABASE RE-RENDERS THE SCREEN THE USER IS
     STANDING ON, INCLUDING THIS ONE.
     Red by restoring loadFromCloud's hard-coded render list, which omitted
     Debts: the card below keeps the previous database's lender and figures.

     The cloud path itself cannot be driven here — it needs Firebase, and this
     harness has no network. What it CAN drive is the seam that path now uses,
     and the seam is the whole of the fix: the defect was never in the cloud
     call, it was in a hard-coded list of screens that did not include this one.
     So this swaps db wholesale, exactly as loadFromCloud does, calls the seam,
     and asserts the screen moved. A test of the property rather than of the
     transport.

     The import path closed this same defect at its own door and said the list
     "cannot drift again as screens are added". It drifted again through the
     other door, which is why the assertion is here rather than trusted. */
  flow('a whole-database swap re-renders the Debts screen under the user', function () {
    db.debts = [{ id: 'C1', name: 'Before the restore', date: '2026-01-01',
                  principal: 1000000, totalToRepay: 1300000, notes: '' }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();
    t.CL_before = document.querySelector('.debt-name').textContent;
    if (t.CL_before !== 'Before the restore') throw new Error('the fixture did not render');

    /* Exactly what loadFromCloud does to the store: a new object graph, with no
       render call of its own. Anything that repaints has to come from the seam. */
    const replacement = JSON.parse(JSON.stringify(db));
    replacement.debts = [{ id: 'C2', name: 'After the restore', date: '2026-02-01',
                           principal: 2000000, totalToRepay: 2600000, notes: '' }];
    replacement.debtPayments = [];
    db = replacement;

    // The seam, copied from the call site rather than described.
    renderSettings();
    navigate(document.querySelector('.screen.active')?.id || 'dashboard');

    t.CL_after = document.querySelector('.debt-name').textContent;
    t.CL_card_count = document.querySelectorAll('.debt-card').length;
    if (t.CL_after === 'Before the restore') {
      throw new Error('the Debts screen still shows the previous database after a full swap — ' +
                      'its "+ Payment" resolves an id that no longer exists');
    }
    if (t.CL_after !== 'After the restore' || t.CL_card_count !== 1) {
      throw new Error('the swap rendered ' + t.CL_card_count + ' card(s), showing ' + t.CL_after);
    }
  });

  /* CONDITION — A LOAN QUOTED AS A MONTHLY RATE COMES OUT AS THE RIGHT TOTAL.
     Red by changing the month derivation by one in either direction: every
     row with a term moves, and the part-month row moves first.

     SIMPLE INTEREST ON THE ORIGINAL AMOUNT, and whole months with any
     remaining days counting as one more. Both are conventions the user did not
     state and the record does not hold, which is why they are asserted here
     rather than left to read correctly. Compounding was the other branch and
     differs by 66,000 on a 1,000,000 loan over a year - if somebody switches
     the formula, the 12-month row is what says so.

     The Jan 31 row is the clamping case stepDate already solved: setMonth
     overflows rather than clamping, so 31 Jan plus a month is 3 March unless
     the day is clamped to the month that results. A second clamping rule in
     this file would be one to keep in step, so this asserts the shared one. */
  flow('a loan quoted as a monthly rate computes to the right total', function () {
    var rows = [
      ['12 months at 3%',        1000000, 3,   '2026-01-01', '2027-01-01', 1360000, 12],
      ['3 months at 3%',         1000000, 3,   '2026-01-01', '2026-04-01', 1090000, 3],
      ['45 days is two months',  1000000, 3,   '2026-01-01', '2026-02-15', 1060000, 2],
      ['one day is one month',   1000000, 3,   '2026-01-01', '2026-01-02', 1030000, 1],
      ['Jan 31 to Feb 28',       1000000, 3,   '2026-01-31', '2026-02-28', 1030000, 1],
      ['a decimal rate',         1000000, 3.5, '2026-01-01', '2027-01-01', 1420000, 12],
      ['six months at 5%',        500000, 5,   '2026-01-01', '2026-07-01',  650000, 6]
    ];
    t.FEE_rows = [];
    rows.forEach(function (r) {
      var got = feeComputeTotal(r[1], r[2], r[3], r[4]);
      t.FEE_rows.push(r[0] + ' -> ' + JSON.stringify(got));
      if (!got) throw new Error(r[0] + ': computed nothing');
      if (got.total !== r[5] || got.months !== r[6]) {
        throw new Error(r[0] + ': got ' + got.total + ' over ' + got.months +
                        ' months, expected ' + r[5] + ' over ' + r[6]);
      }
    });

    /* NULL, NOT A GUESS, wherever there is nothing to compute. Each of these
       would otherwise write a number into a money field the user is about to
       store. */
    var nulls = [
      ['zero-length term',  1000000, 3,  '2026-01-01', '2026-01-01'],
      ['due before borrow', 1000000, 3,  '2026-06-01', '2026-01-01'],
      ['absent due date',   1000000, 3,  '2026-01-01', ''],
      ['zero rate',         1000000, 0,  '2026-01-01', '2027-01-01'],
      ['negative rate',     1000000, -3, '2026-01-01', '2027-01-01'],
      ['nothing borrowed',        0, 3,  '2026-01-01', '2027-01-01'],
      ['malformed due date',1000000, 3,  '2026-01-01', 'junk']
    ];
    nulls.forEach(function (r) {
      var got = feeComputeTotal(r[1], r[2], r[3], r[4]);
      if (got !== null) throw new Error(r[0] + ': computed ' + JSON.stringify(got) + ', expected null');
    });

    // Pure over its arguments: no store, no DOM, and it does not use today.
    var before = JSON.stringify({ d: db.debts.length, p: db.debtPayments.length });
    feeComputeTotal(9999999, 9, '2026-01-01', '2027-01-01');
    if (JSON.stringify({ d: db.debts.length, p: db.debtPayments.length }) !== before) {
      throw new Error('the calculator touched the store');
    }

    /* AND IT IS NOT debtTermDays WEARING A DIFFERENT NAME. That one answers a
       different question in a different unit, and the two must not be unified:
       365 days is 12 months here and 365 days there. */
    if (debtTermDays('2026-01-01', '2027-01-01') !== null) {
      throw new Error('debtTermDays changed shape — it takes a record, not two dates');
    }
    var rec = { date: '2026-01-01', dueDate: '2027-01-01', principal: 1000000, totalToRepay: 1360000 };
    t.FEE_days = debtTermDays(rec);
    t.FEE_months = feeComputeTotal(1000000, 3, '2026-01-01', '2027-01-01').months;
    if (t.FEE_days !== 365 || t.FEE_months !== 12) {
      throw new Error('the two term derivations drifted: ' + t.FEE_days + ' days, ' + t.FEE_months + ' months');
    }
  });

  /* CONDITION — THE RATE FILLS THE TOTAL, AND CREATES NOTHING.
     Red by giving #debtRate class="money-input" (3.5 becomes 35, a tenfold
     error on a multiplier), by recomputing from only one of the three inputs,
     by not clearing the rate when the user edits the total, or by leaving the
     rate in the field after a debt is added.

     The safety argument is the one the paste control was approved under and it
     is unchanged here: a human reads labelled fields before a record exists.
     debtProblem cannot help - it validates shape, not truth, and a modelled
     total is a perfectly plausible number. */
  flow('a monthly rate fills the total, and stores nothing by itself', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();

    var rate = document.getElementById('debtRate');
    var principal = document.getElementById('debtPrincipal');
    var total = document.getElementById('debtTotal');
    var due = document.getElementById('debtDue');
    var date = document.getElementById('debtDate');
    var name = document.getElementById('debtName');
    if (!rate) throw new Error('there is no monthly-rate field');

    // It is NOT a money input: that class strips non-digits and would turn 3.5
    // into 35 at the moment of entry.
    t.FR_rate_classes = rate.className;
    if (/money-input/.test(rate.className)) {
      throw new Error('the rate field strips its own decimal point: ' + rate.className);
    }

    var type = function (el, v) {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    var reset = function () {
      name.value = ''; principal.value = ''; total.value = '';
      rate.value = ''; due.value = ''; date.value = todayISO();
    };

    /* RECOMPUTES FROM ANY OF THE THREE, so the order does not matter. Filled
       here in the most awkward order available: rate first, then the due date
       that is BELOW the total, then the principal. */
    reset();
    date.value = '2026-01-01';
    type(rate, '3');
    t.FR_after_rate_only = total.value;
    if (total.value !== '') throw new Error('a rate alone computed a total: ' + total.value);
    type(due, '2027-01-01');
    t.FR_after_due = total.value;
    if (total.value !== '') throw new Error('a rate and a date with nothing borrowed computed: ' + total.value);
    type(principal, '1,000,000');
    t.FR_after_principal = total.value;
    if (total.value !== '1,360,000') {
      throw new Error('3% a month for 12 months on 1,000,000 filled ' + total.value);
    }

    // A decimal rate survives the field.
    type(rate, '3.5');
    t.FR_decimal = total.value;
    if (total.value !== '1,420,000') throw new Error('3.5% filled ' + total.value);

    // Nothing was stored, and the add handler still refuses without a lender.
    if (db.debts.length !== 0) throw new Error('the calculator created a debt');
    document.getElementById('debtAdd').click();
    if (db.debts.length !== 0) throw new Error('rate plus one tap became a stored debt with no lender');

    /* THE USER'S OWN EDIT WINS. From the moment they type a total it is theirs,
       and the rate is cleared so the next keystroke anywhere cannot overwrite
       it. */
    type(total, '1,111,111');
    t.FR_rate_after_manual = rate.value;
    if (rate.value !== '') throw new Error('the rate survived a manual total: ' + rate.value);
    type(due, '2028-01-01');
    t.FR_total_after_manual = total.value;
    if (total.value !== '1,111,111') {
      throw new Error('a later keystroke overwrote the total the user typed: ' + total.value);
    }

    // And a completed add leaves no rate behind for the next debt.
    reset();
    date.value = '2026-01-01';
    type(principal, '1,000,000');
    type(due, '2027-01-01');
    type(rate, '3');
    name.value = 'A lender';
    document.getElementById('debtAdd').click();
    t.FR_debts_added = db.debts.length;
    t.FR_stored_total = db.debts.length ? db.debts[0].totalToRepay : null;
    t.FR_rate_after_add = rate.value;
    if (db.debts.length !== 1) throw new Error('the debt was not added');
    if (db.debts[0].totalToRepay !== 1360000) {
      throw new Error('the stored total is ' + db.debts[0].totalToRepay);
    }
    if (rate.value !== '') throw new Error('the next debt inherits this one rate: ' + rate.value);
    // The rate reached no record.
    if (JSON.stringify(db.debts[0]).indexOf('"rate"') >= 0) {
      throw new Error('the rate was stored on the record');
    }
  });

  /* CONDITION — THE CALCULATOR SAYS WHAT IT ASSUMED, AND YIELDS WHEN IT HAS
     NOTHING TO SAY.
     Red by clearing the line, or by rewording it as an announcement.

     THIS FLOW IS THE FEATURE'S HONESTY, NOT ITS POLISH, and it replaces a
     property that does NOT survive from the paste control. That path put the
     lender's own digits beside the lender's own message, so the check was a
     comparison against a document in the user's hand. This total appears in no
     document they hold - their message says a monthly rate, not a tugrik
     figure - so the line names the INPUTS and the CONVENTIONS instead, which
     they do have. All four are asserted because all four can be wrong. */
  /* CONDITION — THE CALCULATOR SAYS WHAT IT IS WAITING FOR, AND ONLY WHERE
     SAYING IT WOULD BE TRUE.
     Red by dropping the amount-borrowed condition from the gate, by asking
     before the compute is attempted, by leaving the family advice up, or by
     rewording the sentence to name something other than the due date.

     THE NEGATIVES ARE THE POINT OF THIS FLOW. The sentence promises that
     adding the date will fill the total, so every state in which that would
     not happen has to stay silent - otherwise the form breaks the same
     promise twice, the second time inside the sentence that explains the
     first break. */
  flow('the calculator says what it is waiting for, and nowhere else', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();
    var rate = document.getElementById('debtRate');
    var principal = document.getElementById('debtPrincipal');
    var total = document.getElementById('debtTotal');
    var due = document.getElementById('debtDue');
    var date = document.getElementById('debtDate');
    var working = document.getElementById('debtRateWorking');
    var family = document.getElementById('debtFamilyHelper');
    var type = function (el, v) {
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    var shown = function () {
      return working.style.display === 'none' ? '' : working.textContent.replace(/\s+/g, ' ').trim();
    };
    var clear = function () {
      principal.value = ''; total.value = ''; rate.value = ''; due.value = '';
      date.value = '2026-01-01';
      type(rate, '');
    };

    // A rate and an amount, and no date to spend them over.
    clear();
    type(principal, '1,000,000');
    type(rate, '3');
    t.RD_ask = shown();
    t.RD_family_hidden = family.style.display === 'none';
    if (t.RD_ask !== 'Add the date this has to be repaid by, and the rate above will fill in the total.') {
      throw new Error('the line read "' + t.RD_ask + '"');
    }
    if (!t.RD_family_hidden) {
      throw new Error('the family advice is still holding the space');
    }
    // It asks for an input and names nothing else.
    if (/required|must|need|missing|invalid|error|optional|\bwe\b|₮|%/i.test(t.RD_ask)) {
      throw new Error('forbidden vocabulary reached the form: ' + t.RD_ask);
    }
    // And the promise it makes is kept in the next keystroke.
    type(due, '2027-01-01');
    t.RD_after_date = total.value;
    t.RD_after_line = shown();
    if (t.RD_after_date !== '1,360,000') {
      throw new Error('the promised total did not fill: "' + t.RD_after_date + '"');
    }
    if (/Add the date/.test(t.RD_after_line)) {
      throw new Error('the ask outlived the date it asked for: ' + t.RD_after_line);
    }
    if (!/Assumed 3% a month/.test(t.RD_after_line)) {
      throw new Error('the working line did not take over: ' + t.RD_after_line);
    }

    /* SILENT IN EVERY STATE WHERE ADDING A DATE WOULD NOT FILL THE TOTAL. */
    // Nothing borrowed: a date would fill nothing, so nothing is said.
    clear();
    type(rate, '3');
    t.RD_no_principal = shown();
    if (t.RD_no_principal !== '') {
      throw new Error('it asked for a date with nothing borrowed: ' + t.RD_no_principal);
    }
    if (family.style.display === 'none') {
      throw new Error('the family advice did not hold the space while the line was silent');
    }

    // A rate that does not parse is not a rate.
    clear();
    type(principal, '1,000,000');
    type(rate, 'three');
    t.RD_bad_rate = shown();
    if (t.RD_bad_rate !== '') throw new Error('an unparseable rate asked for a date: ' + t.RD_bad_rate);

    // A zero rate has nothing to spread over any term.
    clear();
    type(principal, '1,000,000');
    type(rate, '0');
    t.RD_zero_rate = shown();
    if (t.RD_zero_rate !== '') throw new Error('a zero rate asked for a date: ' + t.RD_zero_rate);

    /* A DUE DATE THAT IS NOT AFTER THE BORROW DATE: SILENT, BECAUSE THE
       SENTENCE WOULD BE FALSE - the date is already typed. debtAdd refuses
       that pair in its own words and the card asks for a usable one. */
    clear();
    type(principal, '1,000,000');
    type(rate, '3');
    type(due, '2026-01-01');
    t.RD_same_day = shown();
    if (t.RD_same_day !== '') {
      throw new Error('it asked for a date that was already there: ' + t.RD_same_day);
    }

    // And it never renders beside a total it did not have to ask for.
    clear();
    type(principal, '1,000,000');
    type(due, '2027-01-01');
    type(rate, '3');
    t.RD_computed = shown();
    if (/Add the date/.test(t.RD_computed)) {
      throw new Error('the ask rendered while a total was computed: ' + t.RD_computed);
    }

    // Leave the form as it was found.
    clear();
  });

  flow('the calculator states its assumption, and yields when there is none', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();
    var rate = document.getElementById('debtRate');
    var principal = document.getElementById('debtPrincipal');
    var total = document.getElementById('debtTotal');
    var due = document.getElementById('debtDue');
    var date = document.getElementById('debtDate');
    var working = document.getElementById('debtRateWorking');
    var family = document.getElementById('debtFamilyHelper');
    if (!working) throw new Error('there is no working line');

    var type = function (el, v) {
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    // Silent until there is something to say, and the family advice holds the
    // space meanwhile.
    principal.value = ''; total.value = ''; rate.value = ''; due.value = '';
    date.value = '2026-01-01';
    t.FW_initial = working.textContent;
    if (working.textContent.trim() !== '') throw new Error('the line speaks before it computes');

    type(principal, '1,000,000');
    type(due, '2027-01-01');
    type(rate, '3');
    t.FW_line = working.textContent.replace(/\s+/g, ' ').trim();
    t.FW_family_hidden = family.style.display === 'none';

    if (t.FW_line === '') throw new Error('the total was filled silently');
    if (t.FW_line.indexOf('3%') < 0) throw new Error('the line does not name the rate: ' + t.FW_line);
    if (t.FW_line.indexOf('12 whole months') < 0) {
      throw new Error('the line does not name the month count and its convention: ' + t.FW_line);
    }
    if (t.FW_line.indexOf('original amount') < 0) {
      throw new Error('the line does not name the interest convention: ' + t.FW_line);
    }
    if (t.FW_line.indexOf('360,000') < 0) {
      throw new Error('the line does not name the cost produced: ' + t.FW_line);
    }
    if (!/check/i.test(t.FW_line)) {
      throw new Error('the line does not ask the user to check anything: ' + t.FW_line);
    }
    if (/we calculated|calculated your total|done for you/i.test(t.FW_line)) {
      throw new Error('the line announces a result instead of stating an assumption: ' + t.FW_line);
    }
    if (!t.FW_family_hidden) {
      throw new Error('the family-loan advice is still showing under a computed total');
    }

    /* AND IT YIELDS. Clearing the rate leaves the user with a total they can
       still edit and the advice that belongs to the no-rate case. */
    type(rate, '');
    t.FW_after_clear = working.textContent.trim();
    t.FW_family_back = family.style.display !== 'none';
    if (t.FW_after_clear !== '') throw new Error('the line outlived its rate: ' + t.FW_after_clear);
    if (!t.FW_family_back) throw new Error('the family-loan advice did not come back');

    // A manual total takes the line with it.
    type(rate, '3');
    if (working.textContent.trim() === '') throw new Error('the line did not return');
    type(total, '1,111,111');
    if (working.textContent.trim() !== '') {
      throw new Error('the line survived a hand-typed total: ' + working.textContent);
    }
  });

  /* CONDITION — A DEBT IS FINISHED WHEN IT IS PAID OFF, OR WHEN THE USER SAYS
     SO, AND NOTHING ELSE COUNTS AS SAYING SO.
     Red by making debtSettled ignore settledOn.

     THE FAILURE DIRECTION IS "NOT SETTLED" AND THAT IS THE WHOLE POINT OF THE
     SHAPE TEST. debtProblem has never run over records arriving through
     loadFromCloud, so a truthy test would let any junk string mark a debt
     finished - and a debt wrongly reported finished is the application
     under-reporting an obligation its own record holds, which silences a
     reminder about money that is still owed. Every malformed row below asserts
     the debt stays LIVE. */
  flow('a debt is settled when it is paid off, or when the user says so', function () {
    var base = function (extra) {
      var d = { id: 'S9', name: 'A lender', date: '2026-01-01', dueDate: '2027-01-01',
                principal: 1000000, totalToRepay: 1360000, notes: '' };
      for (var k in extra) d[k] = extra[k];
      return d;
    };

    // Paid off in full: settled, as it always was, with no settledOn anywhere.
    db.debts = [base({})];
    db.debtPayments = [{ id: 'SP9', debtId: 'S9', date: '2026-06-01', amount: 1360000, notes: '' }];
    t.SE_paidoff = debtSettled(db.debts[0]);
    if (!t.SE_paidoff) throw new Error('a fully repaid debt is not settled');

    // Settled early: less than the agreed total, and the record says so.
    db.debtPayments = [{ id: 'SP9', debtId: 'S9', date: '2026-05-01', amount: 1120000, notes: '' }];
    t.SE_before = debtSettled(db.debts[0]);
    if (t.SE_before) throw new Error('an unfinished debt is settled before anyone says so');
    db.debts = [base({ settledOn: '2026-05-01' })];
    t.SE_after = debtSettled(db.debts[0]);
    t.SE_outstanding_unchanged = debtOutstanding(db.debts[0]);
    if (!t.SE_after) throw new Error('the user said it is finished and the predicate disagrees');
    if (t.SE_outstanding_unchanged !== 240000) {
      throw new Error('debtOutstanding changed: ' + t.SE_outstanding_unchanged +
                      ' — it must keep reporting the record');
    }

    /* ABSENT AND NULL ARE THE SAME THING, which is the dueDate lesson: a backup
       written before this field existed must behave exactly like one that
       carries an explicit null. */
    var absent = base({});
    var nulled = base({ settledOn: null });
    db.debts = [absent];
    var a = debtSettled(absent);
    db.debts = [nulled];
    var b = debtSettled(nulled);
    t.SE_absent_vs_null = a + '/' + b;
    if (a !== b) throw new Error('absent and null disagree: ' + t.SE_absent_vs_null);
    if (a) throw new Error('a debt with no settled date reads as settled');

    // Junk is refused by the validator AND read as not settled by the predicate.
    var junk = ['', 'yesterday', '01/05/2026', 5, true, {}];
    t.SE_junk = [];
    junk.forEach(function (v) {
      var rec = base({ settledOn: v });
      db.debts = [rec];
      var verdict = debtProblem(rec);
      var settled = debtSettled(rec);
      t.SE_junk.push(JSON.stringify(v) + ' -> ' + (verdict || 'accepted') + ', settled=' + settled);
      if (settled) {
        throw new Error('junk settled date marked a debt finished: ' + JSON.stringify(v));
      }
      if (!verdict) throw new Error('debtProblem accepted ' + JSON.stringify(v) + ' as a settled date');
    });

    /* AND THE SHAPE TEST IS A SHAPE TEST, WHICH IS DELIBERATE RATHER THAN A
       GAP. ISO_DATE_RE checks four-two-two and nothing else, so an impossible
       calendar date passes it and settles the debt. That is exactly what
       dueDate already does with the same regex, and the record carries what
       the user typed either way. The alternative - round-tripping through
       parseISO here - would make this field stricter than its sibling for no
       stated reason, and feeTermMonths does that round trip because it
       DIVIDES by the result. Nothing divides by this one. */
    var impossible = base({ settledOn: '2026-13-01' });
    db.debts = [impossible];
    t.SE_impossible_settles = debtSettled(impossible);
    if (!t.SE_impossible_settles) {
      throw new Error('a shape-valid date did not settle the debt');
    }

    // It is pure over the record and takes no date argument.
    if (debtSettled.length !== 1) throw new Error('debtSettled takes more than one argument');
    if (debtSettled(null) !== false) throw new Error('debtSettled(null) is not false');
  });

  /* CONDITION — EVERY SURFACE THAT SAYS "STILL OWED" AGREES WITH THE PREDICATE.
     Red by reverting any one site to the old outstanding === 0 test.

     One rule, its readers. A debt settled early is finished while money remains
     against the agreed total, so every site that renders an OBLIGATION has to
     ask the predicate rather than the arithmetic. The sharpest of them is the
     payment sheet's exact-remainder chip: left on the old test it offers a
     one-tap payment of money the user has said they do not owe, on the module's
     own affordance for the final payment.

     AND ONE SITE DELIBERATELY DOES NOT MOVE. The percentage is a share of the
     MONEY, not of the obligation, so a settled-early card reads 82% beside
     ✓ Cleared and both are true. Printing 100% would state that money was
     repaid which was not. */
  flow('a settled debt stops being owed at every surface that says so', function () {
    db.debts = [
      { id: 'V1', name: 'Settled early', date: '2026-01-01', dueDate: '2026-12-01',
        principal: 1000000, totalToRepay: 1360000, notes: '', settledOn: '2026-05-01' },
      { id: 'V2', name: 'Still running', date: '2026-01-01', dueDate: '2026-12-01',
        principal: 500000, totalToRepay: 650000, notes: '' }
    ];
    db.debtPayments = [{ id: 'VP1', debtId: 'V1', date: '2026-05-01', amount: 1120000, notes: '' }];
    db.settings.notifications = {
      enabled: true, daysAhead: 400, showPlanned: false, showGoals: false,
      showRecurring: false, showDebts: true, lastNotifiedAt: 0
    };
    navigate('debts'); renderDebts();

    // The sort: finished debts sink, whichever way they finished.
    t.SS_order = Array.prototype.map.call(document.querySelectorAll('.debt-name'),
      function (n) { return n.textContent; });
    if (t.SS_order[0] !== 'Still running') {
      throw new Error('a settled debt still sits above a live one: ' + t.SS_order.join(' | '));
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll('.debt-card'));
    var pick = function (name) {
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].querySelector('.debt-name').textContent === name) return cards[i];
      }
      throw new Error('no card for ' + name);
    };
    var settledCard = pick('Settled early');

    // The card, its class, and its due chip.
    if (!settledCard.classList.contains('cleared')) {
      throw new Error('a settled debt does not carry the cleared treatment');
    }
    t.SS_remaining = settledCard.querySelector('.debt-remaining').textContent.trim();
    if (t.SS_remaining.indexOf('still owed') >= 0) {
      throw new Error('the card says still owed on a settled debt: ' + t.SS_remaining);
    }
    t.SS_chip = settledCard.querySelector('.debt-meta').textContent.replace(/\s+/g, ' ');
    if (/overdue/.test(t.SS_chip)) {
      throw new Error('a settled debt is painted overdue: ' + t.SS_chip);
    }

    /* THE PERCENTAGE DOES NOT MOVE. 1,120,000 of 1,360,000 is 82%, and that is
       what a share of the money is. */
    t.SS_pct = settledCard.querySelector('.debt-pct').textContent;
    if (t.SS_pct !== '82%') {
      throw new Error('the percentage moved to ' + t.SS_pct + ' — it is a share of the money, not of the obligation');
    }

    // The summary tile.
    var tiles = {};
    Array.prototype.forEach.call(document.querySelectorAll('#debtTotals .debt-total-item'), function (i) {
      tiles[i.querySelector('.debt-total-label').textContent.trim()] =
        unmoney(i.querySelector('.debt-total-value').textContent);
    });
    t.SS_tiles = tiles;
    if (tiles['Still owed'] !== 650000) {
      throw new Error('Still owed is ' + tiles['Still owed'] +
                      ' — it counts 240,000 of an obligation the user says is finished');
    }
    if (tiles['Borrowed in total'] !== 1500000) throw new Error('Borrowed in total moved');
    if (tiles['Paid back so far'] !== 1120000) throw new Error('Paid back so far moved');

    // The bell.
    t.SS_reminders = computeReminders().filter(function (r) { return r.type === 'debt'; })
      .map(function (r) { return r.data.id; });
    if (t.SS_reminders.indexOf('V1') >= 0) {
      throw new Error('the bell still reminds about a debt the user finished');
    }
    if (t.SS_reminders.indexOf('V2') < 0) {
      throw new Error('the live debt lost its reminder');
    }

    /* THE PAYMENT SHEET, AND ITS CHIP. This is the site that would otherwise
       offer to take money the user does not owe. */
    openDebtPaymentModal('V1');
    t.SS_sheet = document.getElementById('editModalBody').textContent.replace(/\s+/g, ' ').trim();
    t.SS_sheet_exact = document.getElementById('qaRowDebtPay').dataset.qaExact || '(none)';
    if (t.SS_sheet.indexOf('still owed') >= 0) {
      throw new Error('the payment sheet says still owed on a settled debt: ' + t.SS_sheet);
    }
    if (document.getElementById('qaRowDebtPay').dataset.qaExact) {
      throw new Error('the payment sheet offers a one-tap payment of ' +
                      t.SS_sheet_exact + ' on a debt the user has settled');
    }
    closeEditModal();

    // The history modal.
    openDebtHistoryModal('V1');
    t.SS_history = document.getElementById('editModalBody').textContent.replace(/\s+/g, ' ').trim();
    if (t.SS_history.indexOf('still owed') >= 0) {
      throw new Error('the history modal says still owed on a settled debt');
    }
    closeEditModal();

    // And debtOutstanding itself is untouched: it still reports the record.
    t.SS_outstanding = debtOutstanding(db.debts.filter(function (d) { return d.id === 'V1'; })[0]);
    if (t.SS_outstanding !== 240000) {
      throw new Error('debtOutstanding was changed to ' + t.SS_outstanding);
    }
  });

  /* CONDITION — THE USER CAN SAY A DEBT IS FINISHED, AND UNSAY IT.
     Red by stamping todayISO() instead of reading the field, by writing
     anything besides settledOn, by dropping the borrow-date refusal, by
     deleting the key instead of nulling it, or by forgetting the bell.

     THE USER STATES THE DATE. Defaulting the field to today is a convenience
     they can overwrite; writing today without asking would store the date of a
     CLICK under a name that says settlement, which is the application
     asserting a fact it was not told. The flow settles on a date that is NOT
     today for exactly that reason - if it stamped, this goes red. */
  flow('a user can mark a debt finished, and undo it', function () {
    var soon = new Date(); soon.setDate(soon.getDate() + 5);
    var soonISO = soon.toISOString().slice(0, 10);
    db.debts = [{ id: 'W1', name: 'A lender', date: '2026-01-01', dueDate: soonISO,
                  principal: 1000000, totalToRepay: 1360000, notes: '' }];
    db.debtPayments = [{ id: 'WP1', debtId: 'W1', date: '2026-05-01', amount: 1120000, notes: '' }];
    db.settings.notifications = {
      enabled: true, daysAhead: 30, showPlanned: false, showGoals: false,
      showRecurring: false, showDebts: true, lastNotifiedAt: 0
    };
    navigate('debts'); renderDebts(); updateBellBadge();

    var badge = document.getElementById('bellBadge');
    t.WS_bell_before = badge.style.display === 'none' ? 'hidden' : badge.textContent;
    if (t.WS_bell_before !== '1') throw new Error('fixture: the debt is not on the bell');

    // The control: icon only, and labelled for anyone who cannot see the glyph.
    var btn = document.querySelector('[data-debt-settle]');
    if (!btn) throw new Error('there is no way to mark a debt settled');
    t.WS_btn = { text: btn.textContent.trim(), title: btn.title, aria: btn.getAttribute('aria-label'),
                 cls: btn.className };
    if (btn.textContent.trim().length > 2) {
      throw new Error('the control carries a text label: ' + btn.textContent);
    }
    if (!btn.title || !btn.getAttribute('aria-label')) {
      throw new Error('the control has no accessible name');
    }
    if (btn.className !== 'goal-icon-btn') {
      throw new Error('the control is not the existing icon button: ' + btn.className);
    }

    btn.click();
    var field = document.getElementById('mSettledOn');
    if (!field) throw new Error('the sheet has no date field');
    t.WS_default = field.value;
    t.WS_min = field.getAttribute('min');
    if (t.WS_default !== todayISO()) throw new Error('the field does not default to today');
    if (t.WS_min !== '2026-01-01') throw new Error('the field does not floor at the borrow date');

    // A date before the money was lent is refused, and stores nothing.
    field.value = '2025-06-01';
    document.getElementById('editModalSave').click();
    t.WS_refused = db.debts[0].settledOn;
    t.WS_toast_open = !!document.getElementById('mSettledOn');
    if (db.debts[0].settledOn) throw new Error('a debt was settled before it was borrowed');
    if (!t.WS_toast_open) throw new Error('the sheet closed on a refusal');

    /* A DATE THE USER CHOSE, NOT TODAY. If the handler stamped todayISO() this
       assertion is what catches it. */
    field.value = '2026-05-01';
    var totalBefore = db.debts[0].totalToRepay;
    var paymentsBefore = db.debtPayments.length;
    document.getElementById('editModalSave').click();

    t.WS_settledOn = db.debts[0].settledOn;
    t.WS_keys = Object.keys(db.debts[0]).join(',');
    if (t.WS_settledOn !== '2026-05-01') {
      throw new Error('stored ' + t.WS_settledOn + ' — the application stamped rather than read the field');
    }
    if (db.debts[0].totalToRepay !== totalBefore) throw new Error('the agreed total was rewritten');
    if (db.debtPayments.length !== paymentsBefore) throw new Error('a payment was invented');
    if (!debtSettled(db.debts[0])) throw new Error('the debt is not settled after settling it');

    // And the bell went with it, without waiting for a timer.
    t.WS_bell_after = badge.style.display === 'none' ? 'hidden' : badge.textContent;
    if (t.WS_bell_after !== 'hidden') {
      throw new Error('the bell still counts a debt the user just finished: ' + t.WS_bell_after);
    }

    // Reopening shows what was stored, not today.
    document.querySelector('[data-debt-settle]').click();
    t.WS_reopened = document.getElementById('mSettledOn').value;
    if (t.WS_reopened !== '2026-05-01') {
      throw new Error('the sheet reopened on ' + t.WS_reopened + ' instead of the stored date');
    }

    /* UNDO IS EMPTYING THE FIELD, and it writes null rather than deleting the
       key, so absent and cleared stay the same shape to every reader. */
    document.getElementById('mSettledOn').value = '';
    document.getElementById('editModalSave').click();
    t.WS_after_undo = db.debts[0].settledOn;
    t.WS_key_present = 'settledOn' in db.debts[0];
    if (db.debts[0].settledOn !== null) throw new Error('undo stored ' + t.WS_after_undo);
    if (!t.WS_key_present) throw new Error('undo deleted the key instead of nulling it');
    if (debtSettled(db.debts[0])) throw new Error('the debt is still settled after undo');
    updateBellBadge();
    t.WS_bell_restored = badge.style.display === 'none' ? 'hidden' : badge.textContent;
    if (t.WS_bell_restored !== '1') throw new Error('the reminder did not come back after undo');
  });

  /* CONDITION — A SETTLED DEBT SAYS WHAT IT LEFT UNPAID, AND ONLY A SETTLED ONE.
     Red by dropping the `cleared` clause from the gate: the unsettled row below
     starts printing a saving on a debt the user still owes, which is the
     predicted saving three rulings have refused.

     THE NEGATIVE ROWS ARE THE POINT. One is the cheap half — the line appears
     where it should. The other three are the guard: this sentence is one gate
     clause away from claiming a saving on a live debt, from claiming one on a
     debt paid in full, and from claiming one on an empty ledger. At most ONE
     gated helper line renders under a card in every state below, which is the
     property that has kept this card from growing a sentence per round. */
  flow('a settled debt says what it left unpaid, and only a settled one', function () {
    var mk = function (extra) {
      var d = { id: 'Z1', name: 'A lender', date: '2026-01-01', dueDate: '2026-12-01',
                principal: 1000000, totalToRepay: 1360000, notes: '' };
      for (var k in extra) d[k] = extra[k];
      return d;
    };
    var pay = function (amount) {
      return amount === null ? [] : [{ id: 'ZP1', debtId: 'Z1', date: '2026-05-01', amount: amount, notes: '' }];
    };
    var render = function (debt, payments) {
      db.debts = [debt]; db.debtPayments = payments;
      navigate('debts'); renderDebts();
      var card = document.querySelector('.debt-card');
      return {
        helpers: Array.prototype.map.call(card.querySelectorAll('.helper'), function (h) {
          return h.textContent.replace(/\s+/g, ' ').trim();
        })
      };
    };

    // Settled early: the line appears, and says what it is measured against.
    var a = render(mk({ settledOn: '2026-05-01' }), pay(1120000));
    t.SV_settled = a.helpers;
    if (a.helpers.length !== 1) {
      throw new Error('expected exactly one helper line, got ' + a.helpers.length + ': ' + a.helpers.join(' | '));
    }
    if (a.helpers[0].indexOf('240,000') < 0) {
      throw new Error('the line does not state the difference: ' + a.helpers[0]);
    }
    if (a.helpers[0].indexOf('less than the agreed total') < 0) {
      throw new Error('the line does not say what the figure is measured against: ' + a.helpers[0]);
    }
    if (a.helpers[0].indexOf('marked this settled') < 0) {
      throw new Error('the line does not say whose act produced this state: ' + a.helpers[0]);
    }
    /* IT NEVER CONGRATULATES. "Saved" is refused permanently: it is true only
       if every tugrik the user handed over reached this ledger, and it also
       spends the payoff plan's own vocabulary. */
    if (/sav(e|ed|ing)|written off|forgiven|waived|well done|congratul/i.test(a.helpers[0])) {
      throw new Error('the line claims the user is better off: ' + a.helpers[0]);
    }

    /* THE BINDING NEGATIVE. Unsettled, money outstanding - the exact state the
       predicted saving would have claimed a figure on. */
    var b = render(mk({}), pay(1120000));
    t.SV_unsettled = b.helpers;
    if (b.helpers.length !== 0) {
      throw new Error('a live debt carries a settlement line: ' + b.helpers.join(' | '));
    }

    // Settled and paid in full: nothing was left unpaid, so nothing is said.
    var c = render(mk({ settledOn: '2026-05-01' }), pay(1360000));
    t.SV_paidfull = c.helpers;
    if (c.helpers.length !== 0) {
      throw new Error('a fully repaid debt carries a settlement line: ' + c.helpers.join(' | '));
    }

    // Settled with an empty ledger: "after paying" would describe nothing paid.
    var d2 = render(mk({ settledOn: '2026-05-01' }), pay(null));
    t.SV_empty = d2.helpers;
    if (d2.helpers.length !== 1 || d2.helpers[0].indexOf('No payments recorded yet') < 0) {
      throw new Error('an empty ledger says something other than that it is empty: ' + d2.helpers.join(' | '));
    }

    // And the overpayment sibling is untouched, still rendering alone.
    var e = render(mk({}), pay(1400000));
    t.SV_overpaid = e.helpers;
    if (e.helpers.length !== 1 || e.helpers[0].indexOf('more than agreed') < 0) {
      throw new Error('the overpayment line changed: ' + e.helpers.join(' | '));
    }
  });

  /* CONDITION — A SCHEDULE IS THREE FACTS OR IT IS NOT A SCHEDULE.
     Red by deleting the clause: every malformed row below is accepted.

     Shape is refused at the border and sense at the boundary the user stands
     at, which is this module's own two-door split. So debtProblem checks only
     that the object could be a schedule - it does NOT check that the
     instalments add up to the agreed total, that the first date is after the
     borrow date, or that the count is more than one. Those are the write
     path's, and an importer that rejected a whole backup over them would
     destroy more than it protects.

     ONE MESSAGE FOR THE WHOLE FIELD. The three are meaningless apart, so a
     reader told which one is wrong still has an object that is not a schedule. */
  flow('a repayment schedule is three facts, and anything else is refused', function () {
    var mk = function (schedule) {
      var d = { id: 'Y1', name: 'A lender', date: '2026-01-01', dueDate: '2027-01-01',
                principal: 1000000, totalToRepay: 1360000, notes: '' };
      if (schedule !== undefined) d.schedule = schedule;
      return d;
    };
    var good = { instalment: 113333, count: 12, firstDue: '2026-02-01' };

    t.SC_valid = debtProblem(mk(good));
    if (t.SC_valid !== null) throw new Error('a valid schedule was refused: ' + t.SC_valid);

    /* ABSENT AND NULL ARE THE SAME THING - the dueDate and settledOn lesson, a
       third time: a backup written before this field existed must behave
       exactly like one carrying an explicit null. */
    t.SC_absent = debtProblem(mk(undefined));
    t.SC_null = debtProblem(mk(null));
    if (t.SC_absent !== t.SC_null) {
      throw new Error('absent and null disagree: ' + t.SC_absent + ' / ' + t.SC_null);
    }
    if (t.SC_absent !== null) throw new Error('a debt with no schedule was refused');

    var bad = [
      ['not an object',        'monthly'],
      ['an array',             [113333, 12, '2026-02-01']],
      ['no instalment',        { count: 12, firstDue: '2026-02-01' }],
      ['instalment zero',      { instalment: 0, count: 12, firstDue: '2026-02-01' }],
      ['instalment negative',  { instalment: -1, count: 12, firstDue: '2026-02-01' }],
      ['instalment a string',  { instalment: '113,333', count: 12, firstDue: '2026-02-01' }],
      ['count fractional',     { instalment: 113333, count: 12.5, firstDue: '2026-02-01' }],
      ['count zero',           { instalment: 113333, count: 0, firstDue: '2026-02-01' }],
      ['count a string',       { instalment: 113333, count: '12', firstDue: '2026-02-01' }],
      ['no firstDue',          { instalment: 113333, count: 12 }],
      ['firstDue malformed',   { instalment: 113333, count: 12, firstDue: '01/02/2026' }],
      ['firstDue a number',    { instalment: 113333, count: 12, firstDue: 20260201 }]
    ];
    t.SC_refused = [];
    bad.forEach(function (row) {
      var verdict = debtProblem(mk(row[1]));
      t.SC_refused.push(row[0] + ' -> ' + (verdict || 'ACCEPTED'));
      if (!verdict) throw new Error('debtProblem accepted ' + row[0]);
      if (verdict !== 'has an invalid repayment schedule') {
        throw new Error(row[0] + ' returned a different message: ' + verdict);
      }
    });

    /* SHAPE ONLY, DELIBERATELY. These three are nonsense as contracts and the
       validator accepts every one of them, because refusing them here would
       refuse a whole backup over a judgement the write path makes better. */
    var shapeOnly = [
      ['instalments that miss the total', { instalment: 1, count: 1, firstDue: '2026-02-01' }],
      ['a first date before the borrow',  { instalment: 113333, count: 12, firstDue: '2020-01-01' }],
      ['a count of one',                  { instalment: 1360000, count: 1, firstDue: '2026-02-01' }]
    ];
    t.SC_shape_only = [];
    shapeOnly.forEach(function (row) {
      var verdict = debtProblem(mk(row[1]));
      t.SC_shape_only.push(row[0] + ' -> ' + (verdict || 'accepted'));
      if (verdict) {
        throw new Error(row[0] + ' was refused at the border: ' + verdict +
                        ' — sense belongs to the write path');
      }
    });

    // And nothing reads it yet: the field changes no figure on any screen.
    db.debts = [mk(good)];
    db.debtPayments = [];
    navigate('debts'); renderDebts();
    var card = document.querySelector('.debt-card');
    t.SC_card_text = card.textContent.replace(/\s+/g, ' ').trim();
    if (/113,333|instalment|schedule/i.test(t.SC_card_text)) {
      throw new Error('the schedule reached the card: ' + t.SC_card_text);
    }
    if (debtOutstanding(db.debts[0]) !== 1360000) {
      throw new Error('the schedule moved a figure: ' + debtOutstanding(db.debts[0]));
    }
  });

  /* CONDITION — THE USER CAN STATE THE AGREED SCHEDULE, AND THE APPLICATION
     NEVER SUPPLIES IT.
     Red by dropping the all-three-or-none rule, the count-of-two rule, or the
     sum rule; or by pre-filling the fields from the record.

     THE APPLICATION MUST NOT SUPPLY THESE NUMBERS. totalToRepay divided by the
     term is an instalment, and offering it for the user to accept would be
     inference wearing a calculator's clothes - the object refused four times,
     and the one whose absence is the whole reason a recorded schedule unlocks
     anything. The empty-modal assertion below is the guard.

     AND THE RECORD HOLDS THE AGREEMENT WITHOUT SCORING PERFORMANCE AGAINST IT.
     Nothing counts instalments paid, nothing says behind or missed, and the
     schedule reaches no card, chip, tile or bell item. Asserted at the end. */
  flow('a user can state the agreed schedule, and the app never supplies it', function () {
    db.debts = [{ id: 'G1', name: 'A lender', date: '2026-01-01', dueDate: '2027-01-01',
                  principal: 1000000, totalToRepay: 1360000, notes: '' }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    var open = function () {
      openDebtEditModal('G1');
      return {
        inst: document.getElementById('mSchedInstalment'),
        count: document.getElementById('mSchedCount'),
        first: document.getElementById('mSchedFirstDue')
      };
    };
    var save = function () { document.getElementById('editModalSave').click(); };

    /* EMPTY ON A DEBT WITH NO SCHEDULE. If the application ever pre-fills these
       from the record, this is what catches it. */
    var els = open();
    if (!els.inst || !els.count || !els.first) throw new Error('the schedule fields are not in the edit modal');
    t.GS_empty = [els.inst.value, els.count.value, els.first.value].join('|');
    if (t.GS_empty !== '||') {
      throw new Error('the application supplied a schedule the user did not state: ' + t.GS_empty);
    }

    // Two of three is not a schedule.
    els.inst.value = '113,333'; els.count.value = '12'; els.first.value = '';
    save();
    t.GS_partial = db.debts[0].schedule;
    t.GS_modal_open = document.getElementById('editModal').classList.contains('show');
    t.GS_partial_toast = document.getElementById('toast').textContent;
    if (db.debts[0].schedule) throw new Error('a partial schedule was stored');
    if (!t.GS_modal_open) throw new Error('two parts of three were accepted in silence and the modal closed');
    if (!/all three/i.test(t.GS_partial_toast)) throw new Error('the refusal did not say why: "' + t.GS_partial_toast + '"');

    // One payment is a due date.
    els = { inst: document.getElementById('mSchedInstalment'), count: document.getElementById('mSchedCount'), first: document.getElementById('mSchedFirstDue') };
    els.inst.value = '1,360,000'; els.count.value = '1'; els.first.value = '2026-02-01';
    save();
    if (db.debts[0].schedule) throw new Error('a count of one was stored');

    // Instalments that cannot cover the agreed total.
    els.inst.value = '1,133,333'; els.count.value = '12'; els.first.value = '2026-02-01';
    save();
    t.GS_after_bad_sum = db.debts[0].schedule;
    if (db.debts[0].schedule) throw new Error('a schedule missing the agreed total by millions was stored');

    // A first payment before the money was lent.
    els.inst.value = '113,333'; els.count.value = '12'; els.first.value = '2025-06-01';
    save();
    if (db.debts[0].schedule) throw new Error('a first payment before the borrow date was stored');

    // And the real thing.
    els.inst.value = '113,333'; els.count.value = '12'; els.first.value = '2026-02-01';
    save();
    t.GS_stored = db.debts[0].schedule;
    t.GS_keys = Object.keys(db.debts[0]).join(',');
    if (!db.debts[0].schedule) throw new Error('a valid schedule was refused');
    if (db.debts[0].schedule.instalment !== 113333 || db.debts[0].schedule.count !== 12 ||
        db.debts[0].schedule.firstDue !== '2026-02-01') {
      throw new Error('stored ' + JSON.stringify(db.debts[0].schedule));
    }
    if (db.debts[0].totalToRepay !== 1360000) throw new Error('the agreed total was rewritten');
    if (db.debtPayments.length !== 0) throw new Error('a payment was invented');
    if (debtProblem(db.debts[0]) !== null) throw new Error('the stored schedule fails its own validator');

    // Reopening shows what was stored.
    els = open();
    t.GS_reopened = [els.inst.value, els.count.value, els.first.value].join('|');
    if (t.GS_reopened !== '113,333|12|2026-02-01') {
      throw new Error('the modal reopened on ' + t.GS_reopened);
    }

    /* THE PAYOFF DATE, STATED WHERE ITS INPUTS ARE TYPED.
       Red by replacing the stepDate walk with setMonth (the 31st case), by
       dropping the ceiling (the 601 case hangs the tab rather than failing),
       by guarding count < 2 in the reader (the count-of-one case), or by
       computing once at open instead of on input (every live case below).

       THE LINE IS A GUARD AND NOT A DISPLAY. firstDue is the one part of a
       stored debt record that no refusal and no validator checks, so this
       states what the user just typed implies while the paper is still in
       their hand. It does not refuse a wrong date and does not claim to. */
    var payoffLine = function () {
      var el = document.getElementById('mSchedPayoff');
      if (!el) throw new Error('the payoff line is not in the edit modal');
      return el.style.display === 'none' ? '' : el.textContent;
    };
    var typeSched = function (count, first) {
      var c = document.getElementById('mSchedCount');
      var f = document.getElementById('mSchedFirstDue');
      c.value = count; f.value = first;
      c.dispatchEvent(new Event('input', { bubbles: true }));
      return payoffLine();
    };

    // Stored, stated on open, without anyone typing.
    t.GS_payoff_open = payoffLine();
    if (t.GS_payoff_open !== 'The last of these falls on 2027-01-01.') {
      throw new Error('on open the line read "' + t.GS_payoff_open + '"');
    }

    /* THE 31st, WHICH IS THE ONE THAT CAN BE WRONG INVISIBLY. Three payments
       from 31 January land on 31 March. A naive setMonth walk gives 3 April,
       and gives it silently. */
    t.GS_payoff_31 = typeSched('3', '2026-01-31');
    if (t.GS_payoff_31 !== 'The last of these falls on 2026-03-31.') {
      throw new Error('the 31st walked to "' + t.GS_payoff_31 + '"');
    }

    /* AND THE SAME ANCHOR LANDING IN A SHORT MONTH, which is the case that
       separates a clamped per-step walk from one setMonth jump of count - 1:
       the jump gives 3 March, and on the case above it gives the right answer
       by luck. Written after the first version of this fixture passed under
       exactly that wrong implementation. */
    t.GS_payoff_feb = typeSched('3', '2025-12-31');
    if (t.GS_payoff_feb !== 'The last of these falls on 2026-02-28.') {
      throw new Error('the anchor landing in February gave "' + t.GS_payoff_feb + '"');
    }

    // One payment is stepped zero times. The modal refuses a count of one on
    // save and the validator accepts it, so an imported record can hold it.
    t.GS_payoff_one = typeSched('1', '2026-05-09');
    if (t.GS_payoff_one !== 'The last of these falls on 2026-05-09.') {
      throw new Error('a count of one gave "' + t.GS_payoff_one + '"');
    }

    // Nothing to state is stated as nothing, never as a guess or a throw.
    t.GS_payoff_blank = [typeSched('', '2026-05-09'), typeSched('12', ''),
                         typeSched('abc', '2026-05-09'),
                         typeSched('0', '2026-05-09')].join('|');
    if (t.GS_payoff_blank !== '|||') {
      throw new Error('a malformed schedule stated something: ' + t.GS_payoff_blank);
    }

    /* A FRACTION IS TRUNCATED AND THE LINE SAYS SO BY STATING THE RESULT.
       parseInt is what the save branch stores, so "2.5" becomes two payments
       there too; the line states the date two payments imply rather than
       hiding, which is the guard doing its job rather than failing at it. */
    t.GS_payoff_frac = typeSched('2.5', '2026-05-09');
    if (t.GS_payoff_frac !== 'The last of these falls on 2026-06-09.') {
      throw new Error('a fractional count gave "' + t.GS_payoff_frac + '"');
    }

    /* THE CEILING. debtProblem accepts any integer count and loadFromCloud
       never runs it, so without this the walk is a million iterations in the
       user's tab. Fifty years of monthly payments is the boundary. */
    t.GS_payoff_600 = typeSched('600', '2026-01-01');
    t.GS_payoff_601 = typeSched('601', '2026-01-01');
    if (t.GS_payoff_600 !== 'The last of these falls on 2075-12-01.') {
      throw new Error('600 months gave "' + t.GS_payoff_600 + '"');
    }
    if (t.GS_payoff_601 !== '') {
      throw new Error('601 months walked instead of refusing: "' + t.GS_payoff_601 + '"');
    }

    // Put the real schedule back and leave the modal as it was found.
    typeSched('12', '2026-02-01');
    els = { inst: document.getElementById('mSchedInstalment'), count: document.getElementById('mSchedCount'), first: document.getElementById('mSchedFirstDue') };

    // Emptying all three removes it, and writes null rather than deleting.
    els.inst.value = ''; els.count.value = ''; els.first.value = '';
    save();
    t.GS_after_clear = db.debts[0].schedule;
    t.GS_key_present = 'schedule' in db.debts[0];
    if (db.debts[0].schedule !== null) throw new Error('clearing stored ' + JSON.stringify(t.GS_after_clear));
    if (!t.GS_key_present) throw new Error('clearing deleted the key instead of nulling it');

    /* NOTHING SCORES IT. Put the schedule back, record a payment that does not
       match it, and assert that no surface says so. */
    els = open();
    els.inst.value = '113,333'; els.count.value = '12'; els.first.value = '2026-02-01';
    save();
    db.debtPayments = [{ id: 'GP1', debtId: 'G1', date: '2026-02-01', amount: 40000, notes: '' }];
    renderDebts(); updateBellBadge();
    var card = document.querySelector('.debt-card');
    t.GS_card = card.textContent.replace(/\s+/g, ' ').trim();
    if (/113,333|instalment|schedule|behind|missed|on track|of 12|falls on|last of these/i.test(t.GS_card)) {
      throw new Error('the schedule reached the card: ' + t.GS_card);
    }
    t.GS_reminders = computeReminders().filter(function (r) { return r.type === 'debt'; }).length;
    if (t.GS_reminders > 1) {
      throw new Error('the bell counts instalments rather than debts: ' + t.GS_reminders);
    }
  });


  /* CONDITION — THE EFFECTIVE RATE IS SOLVED OVER THE SCHEDULE'S OWN DATED
     CASH FLOWS, AND SAYS NOTHING WHEN IT CANNOT DESCRIBE THE CONTRACT.
     Red by modelling the payments as twelve equal twelfths of a year, by
     anchoring the last payment on the instalment instead of the agreed total,
     by clamping a failed bracket to the ceiling, or by reading db.debtPayments.

     THE EXPECTED FIGURE IS NOT WRITTEN DOWN HERE AND THAT IS DELIBERATE. A
     fixture that asserts 81.7 proves only that nobody changed the number. This
     one states the cash flows the record implies - the day offsets and the
     amounts, both hand-checkable - and asserts that discounting them at the
     rate the application returned brings them back to the amount borrowed. A
     model that puts the payments in the wrong place, or that drops the
     remainder out of the last one, cannot pass that.

     THE DECODER'S PUBLISHED TABLE IS THE CORROBORATION AND NOT THE
     EXPECTATION. It was computed under twelve equal months; this application
     measures days, so every row lands slightly above it, and the short rows
     land further above because annualising a quarter-year figure amplifies a
     small difference in timing. Asserted as a band, in the right direction,
     which is what that table can honestly support. */
  flow('an effective rate is solved over the dated flows a schedule implies', function () {
    // 2026 is not a leap year: 1 Feb is day 31, 1 Mar is day 59, and twelve
    // monthly payments from 1 February land on day 365.
    var MONTHLY_12 = [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    var rows = [
      { p: 1000000, total: 1300000, count: 12, published: 65.5 },
      { p: 1000000, total: 1360000, count: 12, published: 81.2 },
      { p: 500000,  total: 650000,  count: 6,  published: 153.3 },
      { p: 1000000, total: 1300000, count: 3,  published: 400.3 }
    ];
    t.EFF_rows = [];
    rows.forEach(function (row, n) {
      var inst = Math.round(row.total / row.count);
      var last = row.total - inst * (row.count - 1);
      var days = MONTHLY_12.slice(0, row.count);
      var amounts = days.map(function (_, i) { return i === row.count - 1 ? last : inst; });
      // The flows describe the whole agreement or the model is wrong before it
      // is solved. Hand-checkable: 11 x 113,333 + 113,337 is 1,360,000.
      var summed = amounts.reduce(function (a, b) { return a + b; }, 0);
      if (summed !== row.total) {
        throw new Error('row ' + n + ' flows sum to ' + summed + ', not ' + row.total);
      }

      var d = { id: 'E' + n, name: 'Row ' + n, date: '2026-01-01', dueDate: '2027-01-01',
                principal: row.p, totalToRepay: row.total, notes: '',
                schedule: { instalment: inst, count: row.count, firstDue: '2026-02-01' } };
      var pct = debtEffectiveAnnualRate(d);
      if (typeof pct !== 'number' || !isFinite(pct)) {
        throw new Error('row ' + n + ' returned ' + pct);
      }

      // Back to a daily rate, then discount the stated flows to day zero.
      var daily = Math.pow(1 + pct / 100, 1 / 365) - 1;
      var pv = 0;
      for (var i = 0; i < days.length; i++) pv += amounts[i] / Math.pow(1 + daily, days[i]);
      t.EFF_rows.push({ pct: Math.round(pct * 100) / 100, pv: Math.round(pv), published: row.published });
      if (Math.abs(pv - row.p) > 1) {
        throw new Error('row ' + n + ' at ' + pct.toFixed(2) + '% discounts to ' +
                        Math.round(pv) + ', not the ' + row.p + ' borrowed');
      }
      if (!(pct > row.published)) {
        throw new Error('row ' + n + ' came in at or below the equal-months figure: ' + pct.toFixed(2));
      }
      if (!(pct < row.published * 1.05)) {
        throw new Error('row ' + n + ' is nowhere near the equal-months figure: ' + pct.toFixed(2));
      }
    });

    /* THE REMAINDER LIVES IN THE LAST PAYMENT. The boundary permits the
       instalments to miss the agreed total by up to one whole instalment, so
       this record is ordinary: three of 430,000 against a total of 1,300,000,
       whose real last payment is 440,000. Modelled as 3 x 430,000 it drops
       10,000 of the contract. */
    var rem = { id: 'ER', name: 'Remainder', date: '2026-01-01', dueDate: '2026-04-01',
                principal: 1000000, totalToRepay: 1300000, notes: '',
                schedule: { instalment: 430000, count: 3, firstDue: '2026-02-01' } };
    t.EFF_remainder = debtEffectiveAnnualRate(rem);
    var remDaily = Math.pow(1 + t.EFF_remainder / 100, 1 / 365) - 1;
    var remPv = 430000 / Math.pow(1 + remDaily, 31) + 430000 / Math.pow(1 + remDaily, 59) +
                440000 / Math.pow(1 + remDaily, 90);
    if (Math.abs(remPv - 1000000) > 1) {
      throw new Error('the remainder was dropped: 1,000,000 discounts to ' + Math.round(remPv));
    }

    /* SAYS NOTHING RATHER THAN SAYING SOMETHING CONFIDENT. Each of these is a
       record this object cannot describe, and every one of them is reachable
       through loadFromCloud, which never runs debtProblem. */
    var base = function (over) {
      var d = { id: 'EN', name: 'N', date: '2026-01-01', dueDate: '2027-01-01',
                principal: 1000000, totalToRepay: 1360000, notes: '',
                schedule: { instalment: 113333, count: 12, firstDue: '2026-02-01' } };
      Object.keys(over).forEach(function (k) { d[k] = over[k]; });
      return d;
    };
    var nulls = {
      no_schedule:      base({ schedule: null }),
      key_absent:       (function () { var d = base({}); delete d.schedule; return d; })(),
      schedule_array:   base({ schedule: [113333, 12, '2026-02-01'] }),
      count_one:        base({ schedule: { instalment: 1360000, count: 1, firstDue: '2026-02-01' } }),
      count_fractional: base({ schedule: { instalment: 113333, count: 12.5, firstDue: '2026-02-01' } }),
      count_past_ceiling: base({ schedule: { instalment: 113333, count: 601, firstDue: '2026-02-01' } }),
      first_malformed:  base({ schedule: { instalment: 113333, count: 12, firstDue: 'soon' } }),
      first_before_loan: base({ schedule: { instalment: 113333, count: 12, firstDue: '2025-06-01' } }),
      sum_rule_missed:  base({ schedule: { instalment: 50000, count: 12, firstDue: '2026-02-01' } }),
      no_cost:          base({ totalToRepay: 1000000, schedule: { instalment: 83333, count: 12, firstDue: '2026-02-01' } }),
      nothing_borrowed: base({ principal: 0 }),
      // A payment on the day the money arrived, larger than the money: no rate
      // discounts it back, so the bracket cannot straddle. null, never the
      // ceiling - a clamped derivation reports the ceiling as the answer.
      bracket_fails:    { id: 'EB', name: 'B', date: '2026-01-01', dueDate: '2026-03-01',
                          principal: 100000, totalToRepay: 300000, notes: '',
                          schedule: { instalment: 150000, count: 2, firstDue: '2026-01-01' } }
    };
    t.EFF_nulls = {};
    Object.keys(nulls).forEach(function (k) {
      var got;
      try { got = debtEffectiveAnnualRate(nulls[k]); }
      catch (e) { throw new Error(k + ' threw instead of returning null: ' + e.message); }
      t.EFF_nulls[k] = got;
      if (got !== null) throw new Error(k + ' returned ' + got + ' instead of null');
    });
    if (debtEffectiveAnnualRate(null) !== null || debtEffectiveAnnualRate(undefined) !== null) {
      throw new Error('a missing record did not return null');
    }

    /* A PROPERTY OF THE CONTRACT AND NOT OF THE LEDGER. Recording repayments
       does not move it, because what an agreement costs was fixed when it was
       agreed. The same rule debtAnnualCostRate states one derivation above. */
    var contract = base({});
    t.EFF_before_payments = debtEffectiveAnnualRate(contract);
    db.debts = [contract];
    db.debtPayments = [
      { id: 'EP1', debtId: 'EN', date: '2026-02-01', amount: 113333, notes: '' },
      { id: 'EP2', debtId: 'EN', date: '2026-03-01', amount: 500000, notes: '' }
    ];
    t.EFF_after_payments = debtEffectiveAnnualRate(contract);
    if (t.EFF_after_payments !== t.EFF_before_payments) {
      throw new Error('a repayment moved the rate: ' + t.EFF_before_payments +
                      ' became ' + t.EFF_after_payments);
    }
    db.debtPayments = [];
  });


  /* CONDITION — THE CARD STATES ONE RATE SENTENCE, AND WHICH ONE IS SELECTED
     BY WHETHER THE RECORD STATES A SCHEDULE.
     Red by solving for the falling-balance figure before testing the flat one
     (the ask-line assertion), by rendering both (the exclusivity assertion),
     by dropping the fallback when the solve declines, or by clamping the
     computation instead of the display.

     THE TWO SENTENCES ARE ALTERNATIVES AND NEVER A PAIR. The one-sentence
     closure on this card's rate copy survives a second variant only because
     exactly one of them renders in every reachable state, which is what the
     count below asserts rather than assumes.

     THE ASK LINE IS THE ONE THAT GOES WRONG BY DEFAULT. A schedule needs no
     due date, so an implementation that reaches for the falling-balance figure
     first states it on a record whose slot is the line asking for a due date -
     and then the due date is never requested and the flat figure never becomes
     computable on that debt. */
  flow('one rate sentence, chosen by whether a schedule is stated', function () {
    var SCHED = { instalment: 113333, count: 12, firstDue: '2026-02-01' };
    var mk = function (id, over) {
      var d = { id: id, name: id, date: '2026-01-01', dueDate: '2027-01-01',
                principal: 1000000, totalToRepay: 1360000, notes: '' };
      Object.keys(over || {}).forEach(function (k) { d[k] = over[k]; });
      return d;
    };
    var lineFor = function (id) {
      var card = document.querySelector('[data-debt-edit="' + id + '"]').closest('.debt-card');
      var el = card.querySelector('.debt-rate');
      return {
        count: card.querySelectorAll('.debt-rate').length,
        ask: el ? el.classList.contains('ask') : false,
        text: el ? el.textContent.replace(/\s+/g, ' ').trim() : ''
      };
    };

    db.debts = [
      mk('S1', { schedule: SCHED }),                              // stated schedule
      mk('S2', {}),                                               // no schedule
      mk('S3', { dueDate: '', schedule: SCHED }),                 // schedule, no due date
      mk('S4', { schedule: { instalment: 1360000, count: 1, firstDue: '2026-02-01' } }),
      mk('S5', { schedule: { instalment: 113333, count: 12, firstDue: 'whenever' } }),
      // An extreme one: two payments a month apart on money doubled.
      mk('S6', { dueDate: '2026-03-01', principal: 100000, totalToRepay: 200000,
                 schedule: { instalment: 100000, count: 2, firstDue: '2026-02-01' } })
    ];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    t.RS_sched = lineFor('S1');
    t.RS_plain = lineFor('S2');
    t.RS_no_due = lineFor('S3');
    t.RS_one = lineFor('S4');
    t.RS_malformed = lineFor('S5');
    t.RS_extreme = lineFor('S6');

    // Exactly one rate sentence per card, in every state above.
    ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].forEach(function (id) {
      var n = lineFor(id).count;
      if (n !== 1) throw new Error(id + ' rendered ' + n + ' rate lines, not 1');
    });

    // A stated schedule gets the falling-balance sentence and not the flat one.
    if (!/as much as a loan charging/.test(t.RS_sched.text)) {
      throw new Error('a scheduled debt read "' + t.RS_sched.text + '"');
    }
    if (/of what you borrowed/.test(t.RS_sched.text)) {
      throw new Error('both sentences rendered: ' + t.RS_sched.text);
    }
    if (!/on what you still owe/.test(t.RS_sched.text)) {
      throw new Error('the sentence does not name what the percentage is a share of: ' + t.RS_sched.text);
    }
    // It states an equivalence, never a charge this lender makes.
    if (/\bAPR\b|interest rate|effective|true rate|real rate|actual rate|double|was |now /i.test(t.RS_sched.text)) {
      throw new Error('forbidden vocabulary reached the card: ' + t.RS_sched.text);
    }
    // 81.7% over this record, rounded for display.
    if (!/charging 82% a year/.test(t.RS_sched.text)) {
      throw new Error('the figure is not the one the record implies: ' + t.RS_sched.text);
    }

    // No schedule: the flat sentence, unchanged, on every card that has always
    // carried it.
    if (!/Costs you 36% of what you borrowed, each year\./.test(t.RS_plain.text)) {
      throw new Error('the flat sentence changed: "' + t.RS_plain.text + '"');
    }

    /* A SCHEDULE AND NO DUE DATE: THE ASK LINE, AND NO FIGURE. This is the
       negative that keeps the due date worth asking for. */
    if (!t.RS_no_due.ask) {
      throw new Error('a schedule without a due date suppressed the ask: "' + t.RS_no_due.text + '"');
    }
    if (/%/.test(t.RS_no_due.text)) {
      throw new Error('a rate rendered where the ask belongs: ' + t.RS_no_due.text);
    }

    // One payment is a bullet loan: the flat sentence is the honest one.
    if (!/of what you borrowed/.test(t.RS_one.text)) {
      throw new Error('a one-payment schedule read "' + t.RS_one.text + '"');
    }
    // And a schedule this object cannot describe falls back rather than failing.
    if (!/of what you borrowed/.test(t.RS_malformed.text)) {
      throw new Error('a malformed schedule read "' + t.RS_malformed.text + '"');
    }

    /* THE CEILING BOUNDS WHAT IS PRINTED AND NEVER WHAT IS COMPUTED. The
       function keeps the true figure; only the sentence says "more than". */
    if (!/more than 1,000% a year on what you still owe/.test(t.RS_extreme.text)) {
      throw new Error('an extreme rate printed "' + t.RS_extreme.text + '"');
    }
    t.RS_extreme_true = debtEffectiveAnnualRate(db.debts[5]);
    if (!(t.RS_extreme_true > 1000)) {
      throw new Error('the computation was clamped: ' + t.RS_extreme_true);
    }

    /* RECORDING A REPAYMENT DOES NOT MOVE THE SENTENCE, because what an
       agreement costs was fixed when it was agreed. */
    db.debtPayments = [{ id: 'RP1', debtId: 'S1', date: '2026-02-01', amount: 700000, notes: '' }];
    renderDebts();
    t.RS_after_payment = lineFor('S1').text;
    if (t.RS_after_payment !== t.RS_sched.text) {
      throw new Error('a repayment moved the sentence: "' + t.RS_after_payment + '"');
    }
    db.debtPayments = [];
  });


  /* CONDITION — THE SUMMARY BLOCK STATES ONE SENTENCE WITH NO COST AND TWO
     WITH ONE, AND ITS CLOSURE IS ENFORCED RATHER THAN ASSERTED IN A COMMENT.
     Red by adding a sentence to that block, by removing one, or by ungating
     the cost pair so the relationship sentence stops standing alone.

     WHY THIS EXISTS AND WHY NOW. The block carries a comment reading "CLOSED AT
     THREE SENTENCES. One ungated, two gated." Coding standards forbid a comment
     that states a count unless something enforces it, and nothing did: the
     card's rate closure is asserted on six differently-shaped records and the
     per-card helper closure is asserted in five states, but the only thing that
     had ever looked at this block was a check for one figure and the absence of
     a string. It is also the block whose shape is under an open question, and
     an unguarded closure on a block somebody is about to restructure is
     unguarded in BOTH directions - against a fourth sentence arriving and
     against one of the three quietly going missing.

     IT COUNTS ELEMENTS AND NOT SENTENCES, deliberately. The gated pair is two
     sentences inside one .helper, which is why the comment's own count reads
     three where the DOM holds two. The assertion states the DOM fact and the
     text assertions below state which sentences those elements carry, so a
     change that merges, splits or relocates them cannot pass by accident. */
  flow('the summary block states one sentence, or two when there is a cost', function () {
    var helpers = function () {
      var el = document.getElementById('debtTotals');
      return Array.prototype.map.call(el.querySelectorAll('.helper'), function (h) {
        return h.textContent.replace(/\s+/g, ' ').trim();
      });
    };

    /* NO COST: the relationship sentence alone. A loan from family repaid at
       what it lent produces no cost, and the sentence explaining a cost figure
       would then explain a figure that is not on screen. */
    db.debts = [{ id: 'T1', name: 'Ээж', date: '2026-01-01', dueDate: '',
                  principal: 300000, totalToRepay: 300000, notes: '' }];
    db.debtPayments = [{ id: 'TP1', debtId: 'T1', date: '2026-02-01', amount: 100000, notes: '' }];
    navigate('debts'); renderDebts();
    t.TS_no_cost = helpers();
    if (t.TS_no_cost.length !== 1) {
      throw new Error('with no cost the block states ' + t.TS_no_cost.length +
                      ' sentences, not 1: ' + t.TS_no_cost.join(' | '));
    }
    if (t.TS_no_cost[0].indexOf('Still owed') < 0) {
      throw new Error('the ungated sentence is not the relationship one: ' + t.TS_no_cost[0]);
    }

    /* A COST: the relationship sentence, and the one that qualifies the figure.
       That second element carries the model disclosure - the application's own
       even allocation, named as such - which is why nothing may make it
       quieter than the figure it corrects. */
    db.debts.push({ id: 'T2', name: 'A lender', date: '2026-01-01', dueDate: '2027-01-01',
                    principal: 1000000, totalToRepay: 1360000, notes: '' });
    db.debtPayments.push({ id: 'TP2', debtId: 'T2', date: '2026-02-01', amount: 200000, notes: '' });
    renderDebts();
    t.TS_with_cost = helpers();
    if (t.TS_with_cost.length !== 2) {
      throw new Error('with a cost the block states ' + t.TS_with_cost.length +
                      ' sentences, not 2: ' + t.TS_with_cost.join(' | '));
    }
    if (t.TS_with_cost[0] !== t.TS_no_cost[0]) {
      throw new Error('the ungated sentence changed when a cost appeared');
    }
    if (t.TS_with_cost[1].indexOf('not counted in your Net Balance') < 0) {
      throw new Error('the scope sentence is missing: ' + t.TS_with_cost[1]);
    }
    if (t.TS_with_cost[1].indexOf('may not match your lender') < 0) {
      throw new Error('the model disclosure is missing from the block that carries the cost figure: ' +
                      t.TS_with_cost[1]);
    }

    /* AND THE DISCLOSURE IS READABLE WHEREVER THE FIGURE IS. Not inside a
       <details>, not behind a control, not display:none - a qualification the
       user must perform an action to read is not a qualification while the
       number it corrects is on screen. */
    var el = document.getElementById('debtTotals');
    t.TS_cost_tile = !!el.querySelector('.debt-total-item.cost');
    t.TS_disclosure_gated = !!el.querySelector('details .helper, .helper[hidden], .helper[style*="display:none"]');
    if (!t.TS_cost_tile) throw new Error('the cost tile did not render, so this flow proved nothing');
    if (t.TS_disclosure_gated) {
      throw new Error('a summary sentence is behind a control while the cost figure is on screen');
    }
  });


  /* CONDITION — AT LEAST ONE COMPLETE DEBT CARD IS REACHABLE ON THE DEBTS
     SCREEN WITHOUT SCROLLING.
     That sentence is the guarantee. The pixels below are its implementation,
     and the assertion compares two elements measured at run time: the first
     card's bottom edge against the bottom navigation's top edge, at scroll
     position zero. No literal height appears in it.

     WHY A RELATIONSHIP AND NEVER A NUMBER. This project has had four wrong
     derived pixel figures and a width-mode probe that silently reported a
     viewport fifteen pixels narrower than the one it named. A height literal
     would be the next member of that family: it would pass until a font, a
     theme or a device changed, and it would describe a layout nobody measured.

     THE GUARANTEE IS A 390 STATEMENT AND IT SAYS SO. No geometry guarantee is
     claimed below it, permanently and for a measured reason: at 320 the frame
     is exceeded by more than the whole block above the list contains, so a 320
     guarantee could only be committed red or relaxed until it passed, and both
     are refused. 320 and 360 are recorded as diagnostics and compared against
     nothing. The route back for 320 is the list itself - grouping or collapse -
     and never another thirty pixels above it.

     THE SCOPE WAS FIXED BEFORE THE MEASUREMENT AND NOT AFTER IT. A red reading
     here is a signal about the application and never a licence to re-word this
     sentence; the next true thing anybody adds to this screen reddens it, and
     that is the guard working rather than the guard being wrong.

     THE FRAME IS 820px AND IT IS A FIXTURE, NOT A DEVICE. run.mjs hosts the
     app in an iframe of exactly this height. Green here does not establish the
     same result in a browser tab with an address bar, and whoever quotes the
     green should say so. The owner's own device is an installed PWA with no
     address bar, which is the taller case, not the shorter one.

     EVERYTHING ELSE THIS FLOW GATHERS IS DIAGNOSTIC AND NOTHING COMPARES
     AGAINST IT - per-card heights, card-to-card variance, the first card's top
     offset, the slack in pixels and the chip-row counts. They are recorded so
     that the next density question is argued from measurements instead of from
     a screenshot. A figure nothing asserts is a diagnostic; calling it a guard
     is how this module reached 294px across ten rulings with nothing watching.

     Red by restoring the progress track on a debt with no payments, by
     restoring .debt-pct to 22px, or by adding any block to the card template. */
  flow('one whole debt card is reachable without scrolling', function () {
    db.debts = [
      { id: 'G1', name: 'Хүн ам банк бус', date: '2026-06-15', dueDate: '2027-06-15',
        principal: 1500000, totalToRepay: 2040000, notes: '',
        schedule: { instalment: 170000, count: 12, firstDue: '2026-07-15' } },
      { id: 'G2', name: 'Нэг сарын зээл', date: '2026-08-01', dueDate: '2026-11-01',
        principal: 500000, totalToRepay: 650000, notes: 'Ажлын газраас' },
      { id: 'G3', name: 'Ээж', date: '2026-05-01', dueDate: '', principal: 300000,
        totalToRepay: 300000, notes: '' },
      { id: 'G4', name: 'Car loan from a dealership with a long name', date: '2025-09-01',
        dueDate: '2026-09-01', principal: 12000000, totalToRepay: 15600000, notes: '' },
      { id: 'G5', name: 'Paid off already', date: '2025-01-01', dueDate: '2025-07-01',
        principal: 400000, totalToRepay: 520000, notes: '', settledOn: '2025-06-20' }
    ];
    db.debtPayments = [
      { id: 'GP1', debtId: 'G1', date: '2026-07-15', amount: 170000, notes: '' },
      { id: 'GP2', debtId: 'G1', date: '2026-08-15', amount: 170000, notes: '' },
      { id: 'GP3', debtId: 'G2', date: '2026-09-01', amount: 200000, notes: '' },
      { id: 'GP4', debtId: 'G4', date: '2026-01-10', amount: 3000000, notes: '' },
      { id: 'GP5', debtId: 'G5', date: '2025-06-20', amount: 520000, notes: '' }
    ];
    navigate('debts'); renderDebts();
    window.scrollTo(0, 0);

    var cards = document.querySelectorAll('.debt-card');
    if (cards.length !== 5) throw new Error('the fixture rendered ' + cards.length + ' cards, not 5');
    var nav = document.querySelector('nav.tabbar');
    if (!nav) throw new Error('there is no bottom navigation to measure against');

    var first = cards[0].getBoundingClientRect();
    var navTop = nav.getBoundingClientRect().top;

    /* DIAGNOSTIC, ASSERTED AGAINST NOTHING. Recorded so the next density
       question starts from numbers. */
    t.GEO_width = document.documentElement.clientWidth;
    t.GEO_frame_height = window.innerHeight;
    t.GEO_first_card_top = Math.round(first.top);
    t.GEO_first_card_height = Math.round(first.height);
    t.GEO_nav_top = Math.round(navTop);
    t.GEO_slack_px = Math.round(navTop - first.bottom);
    t.GEO_card_heights = Array.prototype.map.call(cards, function (c) {
      return Math.round(c.getBoundingClientRect().height);
    });
    t.GEO_height_spread = Math.max.apply(null, t.GEO_card_heights) -
                          Math.min.apply(null, t.GEO_card_heights);
    t.GEO_chip_rows = Array.prototype.map.call(cards, function (c) {
      var meta = c.querySelector('.debt-meta');
      if (!meta) return 0;
      var tops = {};
      Array.prototype.forEach.call(meta.children, function (ch) {
        tops[Math.round(ch.getBoundingClientRect().top)] = 1;
      });
      return Object.keys(tops).length;
    });
    t.GEO_bars = document.querySelectorAll('.debt-card .goal-bar').length;

    /* THE GUARANTEE, and the only assertion in this flow. It is claimed at 390
       and nowhere else - at the narrower widths the figures above are gathered
       and compared against nothing, which is what "no guarantee below 390"
       means in code rather than in prose. */
    if (t.GEO_width === 390 && !(first.bottom < navTop)) {
      throw new Error('no whole debt card fits above the navigation at 390: the first card ends at ' +
                      Math.round(first.bottom) + ' and the bar starts at ' + Math.round(navTop));
    }

    /* AND THE PROGRESS TRACK IS ABSENT WHERE IT CARRIES NO INFORMATION.
       Asserted here rather than in a flow of its own because nothing observed
       this element before today, and a length that states what three larger
       figures on the same card already state is not a length worth drawing.

       A SETTLED-EARLY DEBT KEEPS ITS BAR. It is cleared but not paid in full,
       so the length is real - the distinction the card spends a comment on. */
    var barOf = function (id) {
      var card = document.querySelector('[data-debt-edit="' + id + '"]').closest('.debt-card');
      return card.querySelectorAll('.goal-bar').length;
    };
    t.GEO_bar_partial = barOf('G1');   // two payments recorded
    t.GEO_bar_nothing = barOf('G3');   // nothing paid
    t.GEO_bar_cleared = barOf('G5');   // paid in full
    if (t.GEO_bar_partial !== 1) throw new Error('a part-paid debt lost its progress track');
    if (t.GEO_bar_nothing !== 0) throw new Error('an empty track rendered on a debt with no payments');
    if (t.GEO_bar_cleared !== 0) throw new Error('a full track rendered on a debt already paid in full');

    // Settled early: cleared, and the money is not all repaid, so the length
    // is real and the bar stays.
    db.debts.push({ id: 'G6', name: 'Settled early', date: '2026-01-01', dueDate: '2026-06-01',
                    principal: 500000, totalToRepay: 700000, notes: '', settledOn: '2026-04-01' });
    db.debtPayments.push({ id: 'GP6', debtId: 'G6', date: '2026-04-01', amount: 400000, notes: '' });
    renderDebts();
    t.GEO_bar_settled_short = barOf('G6');
    if (t.GEO_bar_settled_short !== 1) {
      throw new Error('a debt settled for less than the agreed total lost its progress track');
    }
  });

  /* CONDITION — THE PAYMENT SHEET OFFERS THE ONE AMOUNT IT ALREADY KNOWS.
     Red by dropping data-qa-exact from the sheet, or by reading it as an
     argument instead of from the row — the second only reddens on the
     ✎ Edit / Cancel round trip, which is exactly why that round trip is here.

     The final payment is the payment most likely to be typed wrong and the only
     one whose correct value is already on screen, in this sheet's own helper
     line. It is also the observed cause of the overpayment state the module
     hardened three derivations against. This removes it at source rather than
     containing it downstream.

     It must not reach any other sheet: the three amounts are shared app-wide
     and user-editable, and this figure belongs to one debt. */
  flow('the payment sheet offers the exact remainder, and only where there is one', function () {
    db.debts = [
      { id: 'X1', name: 'Still owing', date: '2026-01-01', principal: 1000000, totalToRepay: 1300000, notes: '' },
      { id: 'X2', name: 'Settled',     date: '2026-01-01', principal: 500000,  totalToRepay: 500000,  notes: '' }
    ];
    db.debtPayments = [{ id: 'XP1', debtId: 'X1', date: '2026-02-01', amount: 870000, notes: '' },
                       { id: 'XP2', debtId: 'X2', date: '2026-02-01', amount: 500000, notes: '' }];
    navigate('debts'); renderDebts();

    openDebtPaymentModal('X1');
    var row = document.getElementById('qaRowDebtPay');
    var exactBtn = row.querySelector('[data-qa-set="430000"]');
    t.QA_outstanding = debtOutstanding(db.debts[0]);
    t.QA_labels = Array.prototype.map.call(row.querySelectorAll('.qa-btn'), function (b) {
      return b.textContent.trim();
    });
    if (t.QA_outstanding !== 430000) throw new Error('fixture drifted: ' + t.QA_outstanding + ' owed');
    if (!exactBtn) throw new Error('no chip for the remainder: ' + t.QA_labels.join(' | '));
    if (exactBtn.textContent.indexOf('430,000') < 0) {
      throw new Error('the chip does not name the figure: ' + exactBtn.textContent);
    }

    // It fills the field and nothing else — no payment is recorded by tapping it.
    var paymentsBefore = db.debtPayments.length;
    exactBtn.click();
    t.QA_filled = document.getElementById('mAmount').value;
    if (t.QA_filled !== '430,000') throw new Error('the chip filled ' + t.QA_filled);
    if (db.debtPayments.length !== paymentsBefore) throw new Error('the chip recorded a payment');

    /* SURVIVES A RE-RENDER IT DOES NOT CONTROL. ✎ Edit then Cancel rebuilds this
       row, and renderAllQuickAmountRows rebuilds every row after quick amounts
       are saved. An implementation that took the figure as an argument loses it
       on both paths. */
    row.querySelector('[data-qa-edit-toggle]').click();
    row.querySelector('[data-qa-cancel]').click();
    if (!row.querySelector('[data-qa-set="430000"]')) {
      throw new Error('the remainder chip was lost on the edit/cancel round trip');
    }
    renderAllQuickAmountRows();
    if (!row.querySelector('[data-qa-set="430000"]')) {
      throw new Error('the remainder chip was lost when the shared amounts re-rendered');
    }
    closeEditModal();

    // A cleared debt has no remainder to offer.
    openDebtPaymentModal('X2');
    var row2 = document.getElementById('qaRowDebtPay');
    t.QA_cleared_has_exact = !!row2.dataset.qaExact;
    if (row2.dataset.qaExact) {
      throw new Error('a settled debt offers a remainder chip of ' + row2.dataset.qaExact);
    }
    closeEditModal();

    // And no other sheet grew one. The attribute is set by this sheet alone.
    var contribRow = document.getElementById('qaRowContrib');
    if (contribRow && contribRow.dataset.qaExact) {
      throw new Error('the goal contribution sheet inherited a remainder chip');
    }
  });

  /* CONDITION — THE ADD FORM IS OUT OF THE WAY ONCE THERE IS SOMETHING TO SEE.
     Red by removing the addFields.open assignment from renderDebts, or by
     deleting the <details> wrapper.

     The screen's own layout comment argues one add and many glances, and the
     module acted on it for the SUMMARY and not for the repeat action. Recording
     a repayment means reaching "+ Payment" on a debt card, and that card sat
     below a nine-control form the user completed once. This measures the
     distance rather than asserting the markup, because the markup can be right
     while the form still renders open.

     Also holds the empty-state's promise: the copy says "add it above", which
     is only true while the form is open, and it is open exactly when the list
     is empty. */
  flow('the add form collapses once there is a debt to glance at', function () {
    var fields = document.getElementById('debtAddFields');
    if (!fields) throw new Error('the add-debt form is not a disclosure');

    // Empty list: open, so "add it above" in the empty state is true.
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();
    t.F_open_when_empty = fields.open;
    if (!fields.open) {
      throw new Error('the empty state says "add it above" and the form is closed');
    }

    seed();
    renderDebts();
    t.F_open_with_debts = fields.open;
    if (fields.open) throw new Error('the add form stays open over the debts it buries');

    /* MEASURE THE DISCLOSURE'S OWN HEIGHT, NOT ITS CHILDREN'S CLIENT RECTS.
       This was written as getClientRects().length === 0 on #debtPrincipal and
       failed at all three widths against a form that was collapsing correctly.
       In this Chrome a closed <details> on the ACTIVE screen still reports a
       client rect for a child while itself collapsing to summary height — the
       already-shipped income disclosure behaves identically, which is what
       established that the test was wrong rather than the markup. A closed
       details is its summary: one 44px row. */
    t.F_form_height_closed = Math.round(fields.getBoundingClientRect().height);
    if (t.F_form_height_closed > 60) {
      throw new Error('the form did not collapse: ' + t.F_form_height_closed + 'px, expected a summary row');
    }

    /* THE MEASUREMENT THE FINDING WAS ABOUT. Distance from the top of the
       screen to the first "+ Payment". Compared against the same distance with
       the form open, so this asserts a relationship rather than a magic number
       that would need re-tuning at every width. */
    var payBtn = document.querySelector('[data-debt-pay]');
    if (!payBtn) throw new Error('no + Payment button to measure');
    var screenTop = document.getElementById('debts').getBoundingClientRect().top;
    t.F_pay_top_closed = Math.round(payBtn.getBoundingClientRect().top - screenTop);

    fields.open = true;
    t.F_pay_top_open = Math.round(
      document.querySelector('[data-debt-pay]').getBoundingClientRect().top - screenTop);
    fields.open = false;

    t.F_saved_px = t.F_pay_top_open - t.F_pay_top_closed;
    if (t.F_saved_px <= 300) {
      throw new Error('collapsing the form moved + Payment up by only ' + t.F_saved_px +
                      'px — the form is not what was burying it');
    }
  });

  /* CONDITION — A DEBT WRITE REFRESHES THE BELL.
     Red by removing updateBellBadge() from the debt payment write site.

     The bell counts what computeReminders returns, and computeReminders drops
     a debt the moment it is settled. Every goal write site refreshes the badge
     and the debt sites did not, so clearing a debt in full - from the reminder
     sheet's own "+ Payment" button, which is the sharpest path - left the bell
     still counting it until a 30-minute timer or an unrelated income, expense
     or goal write repaired it. In an offline-first app that stays open all day
     that timer IS the repair, and a reminder that outlives its cause is what
     the computeReminders debt branch says this module must not produce.

     Invisible to every other flow in this file: the debt figures are all
     correct throughout, the card says "✓ Cleared", and only the digit in the
     header disagrees. */
  flow('paying a debt off in full clears it from the bell', function () {
    var soon = new Date(); soon.setDate(soon.getDate() + 3);
    var soonISO = soon.toISOString().slice(0, 10);
    db.debts = [{ id: 'B1', name: 'A lender', date: todayISO(), dueDate: soonISO,
                  principal: 1000000, totalToRepay: 1300000, notes: '' }];
    db.debtPayments = [];
    db.settings.notifications = {
      enabled: true, daysAhead: 7, showPlanned: false, showGoals: false,
      showRecurring: false, showDebts: true, lastNotifiedAt: 0
    };
    navigate('debts'); renderDebts(); updateBellBadge();

    var badge = document.getElementById('bellBadge');
    t.BELL_before = badge.style.display === 'none' ? 'hidden' : badge.textContent;
    if (t.BELL_before !== '1') {
      throw new Error('a debt due in 3 days is not on the bell: ' + t.BELL_before);
    }

    // Through the real write path, not by assigning to db: the point of the
    // finding is that the HANDLER forgot the refresh, so a flow that refreshes
    // by hand would pass against the defect.
    openDebtPaymentModal('B1');
    document.getElementById('mAmount').value = '1,300,000';
    document.getElementById('editModalSave').click();

    t.BELL_after = badge.style.display === 'none' ? 'hidden' : badge.textContent;
    t.BELL_outstanding = debtOutstanding(db.debts[0]);
    if (t.BELL_outstanding !== 0) {
      throw new Error('the payment did not clear the debt: ' + t.BELL_outstanding + ' still owed');
    }
    if (t.BELL_after !== 'hidden') {
      throw new Error('the bell still counts a debt the app reports as settled: ' + t.BELL_after);
    }
  });

  /* CONDITION — THE YEARLY COST LINE SAYS WHAT ITS PERCENTAGE IS A SHARE OF.
     Red by shortening the sentence to a bare percentage, or by rewording it as
     an interest rate.

     The wording is the load-bearing part of this feature and not its
     arithmetic. debtAnnualCostRate reports the cost as a share of the amount
     BORROWED over the agreed term; a borrower repaying in installments does not
     hold the whole principal for the whole term, so the same loan carries a
     true rate on the falling balance of roughly double. Presented as "the
     interest rate" the figure understates by that factor and repeats the
     lender's own flattering framing, which is the thing the module exists to
     break. Presented as a share of what was borrowed it understates nothing.
     So the assertion is on the words, because the words are what was ruled. */
  flow('the yearly cost line names what the percentage is a share of', function () {
    db.debts = [{ id: 'R1', name: 'A lender', date: '2026-01-01', dueDate: '2027-01-01',
                  principal: 1000000, totalToRepay: 1360000, notes: '' }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    var line = document.querySelector('.debt-rate');
    if (!line) throw new Error('a loan with a cost and a term shows no yearly cost line');
    t.R_line = line.textContent.replace(/\s+/g, ' ').trim();

    if (t.R_line.indexOf('36%') < 0) {
      throw new Error('expected 36% (360,000 on 1,000,000 over 365 days): ' + t.R_line);
    }
    if (t.R_line.indexOf('of what you borrowed') < 0) {
      throw new Error('the line does not say what the percentage is a share of: ' + t.R_line);
    }
    if (t.R_line.indexOf('each year') < 0) {
      throw new Error('the line does not say over what period: ' + t.R_line);
    }
    if (/APR/i.test(t.R_line) || /interest rate/i.test(t.R_line)) {
      throw new Error('the line claims to be an interest rate or an APR: ' + t.R_line);
    }

    /* A PROPERTY OF THE CONTRACT, NOT OF THE LEDGER. Red by having
       debtAnnualCostRate consult debtPaid. What a loan costs was fixed when it
       was agreed, so recording a repayment must not move it — and a later
       reader who thinks the function forgot the payments has this flow telling
       them it did not. */
    db.debtPayments = [{ id: 'RP1', debtId: 'R1', date: '2026-06-01', amount: 900000, notes: '' }];
    renderDebts();
    t.R_line_after_payment = document.querySelector('.debt-rate')
      .textContent.replace(/\s+/g, ' ').trim();
    if (t.R_line_after_payment !== t.R_line) {
      throw new Error('recording a repayment moved the yearly cost: ' +
                      t.R_line + ' -> ' + t.R_line_after_payment);
    }
  });

  /* CONDITION — NO LINE WHERE THERE IS NO RATE TO STATE.
     Red by dropping either guard from debtAnnualCostRate.

     Two states, and they are omitted for different reasons. No due date means
     no term, so nothing can be computed. Nothing owed above what was borrowed
     is the family case, where the honest figure is that the borrowing cost
     nothing — and "costs you 0% of what you borrowed" answers a question
     nobody asked, which is renderDebts' own stated reason for omitting a zero
     cost line rather than printing one. */
  flow('a costly debt with no term asks for the date; money from family stays silent', function () {
    db.debts = [{ id: 'R2', name: 'A lender', date: '2026-01-01',
                  principal: 1000000, totalToRepay: 1300000, notes: '' }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    if (document.querySelector('.debt-rate:not(.ask)')) {
      throw new Error('a debt with no due date states a yearly cost it cannot know');
    }
    var ask = document.querySelector('.debt-rate.ask');
    if (!ask) {
      throw new Error('a debt that costs money and has no term neither states a rate nor asks for one');
    }
    t.R_ask = ask.textContent.replace(/\s+/g, ' ').trim();
    if (t.R_ask.indexOf('%') >= 0) {
      throw new Error('the prompt quotes a figure it does not have: ' + t.R_ask);
    }

    /* GATED ON A COST, NOT ON THE DUE DATE. Red by gating the prompt on the
       absence of a term alone. Money from family carries no cost, so there is
       no rate to reveal and no reason to send the user back to their sister for
       a repayment date. Both lines must be absent here, not just the figure. */
    db.debts = [{ id: 'R3', name: 'My sister', date: '2026-01-01',
                  principal: 500000, totalToRepay: 500000, notes: '' }];
    renderDebts();
    t.R_nocost = !!document.querySelector('.debt-rate');
    if (t.R_nocost) {
      throw new Error('money from family is captioned with a yearly cost or asked for a date');
    }
  });

  /* CONDITION — THE CEILING BOUNDS THE PRINT, NEVER THE COMPUTATION.
     Red by clamping inside debtAnnualCostRate instead of at the render, which
     is the shape that looks equivalent and is not: a clamped derivation reports
     the ceiling as though it were the answer, and nothing downstream can tell
     the two apart.

     A three-day loan at ten percent annualises past 1,200%. That is correct and
     reads to an untrained user as a broken application, so the SENTENCE says
     "more than 1,000%" while the function keeps the true figure for anything
     that needs it. */
  flow('an extreme rate is capped in what it prints, not in what it computes', function () {
    db.debts = [{ id: 'R4', name: 'A lender', date: '2026-01-01', dueDate: '2026-01-04',
                  principal: 1000000, totalToRepay: 1100000, notes: '' }];
    db.debtPayments = [];
    navigate('debts'); renderDebts();

    t.R_extreme_computed = debtAnnualCostRate(db.debts[0]);
    if (t.R_extreme_computed !== 1217) {
      throw new Error('the derivation was clamped: got ' + t.R_extreme_computed + ', expected 1217');
    }
    t.R_extreme_line = document.querySelector('.debt-rate').textContent.replace(/\s+/g, ' ').trim();
    if (t.R_extreme_line.indexOf('more than 1,000%') < 0) {
      throw new Error('an extreme rate is printed raw: ' + t.R_extreme_line);
    }
    if (t.R_extreme_line.indexOf('1,217') >= 0) {
      throw new Error('the ceiling did not bound the print: ' + t.R_extreme_line);
    }
  });
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}

/* CONDITION 3 — CASCADE, and it runs last because it is the only asynchronous
   one: the delete path awaits confirmDialog, so the assertions have to wait a
   turn for the handler to resume.

   A deleted debt takes its payments with it. Orphans would be invisible on
   this screen — every figure filters on debtId — and would still be counted by
   the Data Summary, so the store would report money the user cannot see. Red
   by dropping the db.debtPayments filter in the delete handler.

   Driven through the real control rather than by calling the handler, because
   the confirmation is part of what a delete IS here. */
function cascadeFlow() {
  seed();
  navigate('debts'); renderDebts();
  t.C_before_debts = db.debts.length;
  t.C_before_payments = db.debtPayments.length;

  var realConfirm = window.confirmDialog;
  window.confirmDialog = function () { return Promise.resolve(true); };
  var btn = document.querySelector('[data-debt-del="D1"]');
  if (!btn) throw new Error('setup failed: no delete control rendered');
  btn.click();

  return new Promise(function (resolve) { setTimeout(resolve, 100); }).then(function () {
    window.confirmDialog = realConfirm;
    t.C_after_debts = db.debts.length;
    t.C_after_payments = db.debtPayments.length;
    t.C_orphans = db.debtPayments.filter(function (p) {
      return !db.debts.some(function (d) { return d.id === p.debtId; });
    }).length;

    if (t.C_after_debts !== t.C_before_debts - 1) {
      throw new Error('the delete did not happen: ' + t.C_before_debts + ' -> ' + t.C_after_debts);
    }
    if (t.C_orphans !== 0) {
      throw new Error(t.C_orphans + ' payment(s) survive a debt that no longer exists — ' +
                      'invisible on this screen, still counted by the Data Summary');
    }
    if (t.C_after_payments !== 1) {
      throw new Error('the cascade took the wrong payments: ' + t.C_after_payments + ' left, expected 1');
    }
  });
}

Promise.resolve()
  .then(cascadeFlow)
  .then(
    function () { t.flows.push('deleting a debt removes its payments: ok'); },
    function (e) { t.flows.push('deleting a debt removes its payments: THREW ' + (e && e.message ? e.message : e)); }
  )
  .then(publish, publish);
