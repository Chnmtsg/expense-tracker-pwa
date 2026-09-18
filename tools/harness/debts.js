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

  /* CONDITION 8 — ORDER. A cleared debt is finished; it must not sit above
     money still owed. Only that split is imposed — the live debts keep the
     user's own order, because sorting them by size or age would have this app
     assert a repayment strategy. Red by dropping the sort in renderDebts. */
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
    // The live pair kept the user's own relative order — A was entered before B
    // and still leads it. A sort that reordered them would assert a strategy.
    if (names[2] !== 'Cleared first' || names[3] !== 'Cleared again') {
      throw new Error('the cleared pair lost its relative order: ' + names.join(' | '));
    }

    // Rendering must not rewrite what is stored. A sort in place would be
    // persisted by the next save — a render with a side effect on user data.
    t.N_stored_order = db.debts.map(function (d) { return d.id; }).join(',');
    if (t.N_stored_order !== 'S1,S2,S3,S4') {
      throw new Error('renderDebts reordered the stored data: ' + t.N_stored_order);
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

  /* CONDITION — THE EXTRACTOR READS WHAT IS THERE AND NOTHING ELSE.
     Red by accepting a bare ungrouped run with no currency marker: the
     account-number row starts reporting 5,104,123,456 as money.

     DATE-MASKING IS NOT REDDENED BY THIS TABLE, and that is worth stating
     rather than leaving as an apparent gap. Extracting amounts before masking
     the dates was tried against these rows and they all still pass, because
     the ungrouped-run rule independently rejects 2027, 01 and 05 — no currency
     marker stands next to any of them. Masking is the primary guard and the
     run rule is the backstop; here the backstop happens to catch everything the
     table contains. Do not read these rows as proof that the ordering works.

     THE FAILURE DIRECTION IS FIXED: WHEN IN DOUBT, EXTRACT NOTHING. A missed
     amount costs the user typing they were going to do anyway; a misread one
     costs a wrong financial record that looks right, and debtProblem cannot
     catch it because it validates shape and not truth. Every row below that
     expects [] is that rule, not a gap in the table.

     THE INTEREST-LINE ROW IS THE ONE TO READ FIRST. "зээл 1,000,000 · хүү
     300,000" is loan one million, interest three hundred thousand — two
     amounts, so extraction succeeds, and the caller will then assign the
     SMALLER as the principal and produce a debt whose cost reads 700,000 where
     the truth is 300,000. Nothing in the text distinguishes it from a real
     principal-and-total pair. That is why the assumption is stated on screen at
     the moment it is made, and why softening that sentence breaks this
     feature's honesty rather than its arithmetic. */
  flow('the extractor reads amounts and dates, and stays quiet when unsure', function () {
    var rows = [
      ['ordinary lender SMS',      'Таны зээл 1,000,000₮ олгогдлоо. Эргэн төлөх дүн 1,360,000₮', [1000000, 1360000], []],
      ['the interest-line trap',   'зээл 1,000,000 · хүү 300,000',                               [1000000, 300000],  []],
      ['one amount',               'Зээл 500,000₮ олгогдлоо',                                    [500000],           []],
      ['three amounts',            'Зээл 1,000,000₮ хүү 300,000₮ үлдэгдэл 1,300,000₮',           [1000000, 300000, 1300000], []],
      ['no amounts',               'Таны хүсэлт хүлээн авлаа',                                   [],                 []],
      ['dot-date, no phantom',     'Эргэн төлөх 2027.01.01',                                     [],                 ['2027-01-01']],
      ['iso and slash dates',      '2026-01-05 -аас 2027/03/09 хүртэл',                          [],                 ['2026-01-05', '2027-03-09']],
      ['a percentage is not money','Сарын хүү 3% байна. Зээл 1,000,000₮',                        [1000000],          []],
      ['impossible calendar date', 'Хугацаа 2027.02.31',                                         [],                 []],
      ['an account number',        'Дансны дугаар 5104123456 руу шилжүүлнэ үү',                  [],                 []],
      ['bare run beside a marker', 'Нийт 1360000₮',                                              [1360000],          []],
      ['no-break space grouping',  'Зээл 1\u00A0000\u00A0000 төг',                                [1000000],          []],
      ['a decimal is ambiguous',   'Дүн 1.000.000',                                              [],                 []],
      ['equal amounts, family',    'Авсан 500,000₮ буцаах 500,000₮',                             [500000, 500000],   []]
    ];
    t.P_rows = [];
    rows.forEach(function (r) {
      var got = pasteExtract(r[1]);
      t.P_rows.push(r[0] + ' -> ' + JSON.stringify(got.amounts) + ' ' + JSON.stringify(got.dates));
      if (JSON.stringify(got.amounts) !== JSON.stringify(r[2])) {
        throw new Error(r[0] + ': amounts ' + JSON.stringify(got.amounts) +
                        ', expected ' + JSON.stringify(r[2]));
      }
      if (JSON.stringify(got.dates) !== JSON.stringify(r[3])) {
        throw new Error(r[0] + ': dates ' + JSON.stringify(got.dates) +
                        ', expected ' + JSON.stringify(r[3]));
      }
    });

    // It is pure over its argument and knows nothing about this application.
    var before = JSON.stringify({ d: db.debts.length, p: db.debtPayments.length });
    pasteExtract('Зээл 9,999,999₮ 2027-01-01');
    if (JSON.stringify({ d: db.debts.length, p: db.debtPayments.length }) !== before) {
      throw new Error('the extractor touched the store');
    }
    if (pasteExtract(null).amounts.length || pasteExtract(undefined).dates.length) {
      throw new Error('the extractor throws or invents on a non-string');
    }
  });

  /* CONDITION — PASTING FILLS THE FORM AND CREATES NOTHING.
     Red by having the fill call the add handler, by filling #debtName, by
     skipping formatMoneyInput, or by inverting the smaller/larger assignment.

     The whole safety argument of this feature is that a human reads labelled
     fields before a record exists. debtProblem cannot help: it validates shape,
     not truth, so a misread digit that is a plausible number passes every check
     this application makes. So the assertions below are about what did NOT
     happen as much as what did. */
  flow('pasting a lender message fills the form and stores nothing', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();

    var name = document.getElementById('debtName');
    var principal = document.getElementById('debtPrincipal');
    var total = document.getElementById('debtTotal');
    var date = document.getElementById('debtDate');
    var due = document.getElementById('debtDue');
    var notes = document.getElementById('debtNotes');

    var reset = function () {
      name.value = ''; principal.value = ''; total.value = '';
      date.value = todayISO(); due.value = ''; notes.value = '';
    };

    // Two amounts: smaller is the principal, larger the total, both formatted
    // the way the user's own typing would format them.
    reset();
    var r = pasteFillDebtForm('Таны зээл 1,000,000₮ олгогдлоо. Эргэн төлөх дүн 1,360,000₮');
    t.PF_principal = principal.value;
    t.PF_total = total.value;
    if (principal.value !== '1,000,000') throw new Error('principal reads ' + principal.value);
    if (total.value !== '1,360,000') throw new Error('total reads ' + total.value);
    if (unmoney(principal.value) >= unmoney(total.value)) {
      throw new Error('the larger amount was not put in the total');
    }
    if (!r.filledAmounts || r.amountsFound !== 2) throw new Error('the result misreports the fill');

    // Never the name, never the notes, and never a record.
    if (name.value !== '') throw new Error('the lender name was guessed: ' + name.value);
    if (notes.value !== '') throw new Error('the pasted message was stored in the notes');
    if (db.debts.length !== 0) throw new Error('pasting created a debt without the user');

    // And the add handler still refuses, because the name is the one field the
    // user must type. This is the deliberate friction, asserted rather than
    // assumed.
    document.getElementById('debtAdd').click();
    t.PF_debts_after_click = db.debts.length;
    if (db.debts.length !== 0) {
      throw new Error('a pasted message plus one tap became a stored debt with no lender');
    }

    // Three amounts: nothing is filled, because picking two would be a guess.
    reset();
    var r3 = pasteFillDebtForm('Зээл 1,000,000₮ хүү 300,000₮ үлдэгдэл 1,300,000₮');
    t.PF_three = { p: principal.value, t: total.value, found: r3.amountsFound, filled: r3.filledAmounts };
    if (principal.value !== '' || total.value !== '') {
      throw new Error('three amounts were guessed at: ' + principal.value + ' / ' + total.value);
    }
    if (r3.amountsFound !== 3 || r3.filledAmounts) throw new Error('the result misreports the refusal');

    /* One date, and the destination depends on the borrow date already in the
       form — the record's own dueDate >= date invariant doing the assignment,
       which is the same idea the amounts use. */
    reset();
    pasteFillDebtForm('Эргэн төлөх 2099.01.01');
    t.PF_future_due = due.value;
    if (due.value !== '2099-01-01') throw new Error('a future date did not become the due date');
    if (date.value !== todayISO()) throw new Error('a future date moved the borrow date');

    reset();
    pasteFillDebtForm('Олгосон 2020.01.01');
    t.PF_past_borrow = date.value;
    if (date.value !== '2020-01-01') throw new Error('a past date did not become the borrow date');
    if (due.value !== '') throw new Error('a past date became a due date');

    // Two dates: earlier borrows, later falls due.
    reset();
    pasteFillDebtForm('2026-01-05 -аас 2027/03/09 хүртэл');
    t.PF_two_dates = date.value + ' / ' + due.value;
    if (date.value !== '2026-01-05' || due.value !== '2027-03-09') {
      throw new Error('two dates landed wrong: ' + t.PF_two_dates);
    }

    reset();
  });

  /* CONDITION — THE PASTE CONTROL IS ONE LEVEL DEEP, CLOSED, AND DRIVEN BY ITS
     OWN BUTTON.
     Red by removing the nested <details>, by opening it by default, or by
     wiring the button to anything that submits.

     One level is the ruled maximum: a sub-section of a form. Two would be a
     maze, and the primitive was chosen for costing the user nothing to learn.
     This asserts the depth rather than trusting the markup, because a later
     edit that wraps it again would be invisible to every other flow here. */
  flow('the paste control is one level deep, closed, and fills only on its button', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();

    var box = document.getElementById('debtPasteText');
    var btn = document.getElementById('debtPasteRead');
    if (!box || !btn) throw new Error('the paste control is not on the screen');

    var inner = box.closest('details');
    var outer = inner && inner.parentElement.closest('details');
    if (!inner) throw new Error('the paste control is not inside a disclosure');
    if (!outer || outer.id !== 'debtAddFields') {
      throw new Error('the paste control is not inside the add-debt form');
    }
    if (outer.parentElement.closest('details')) {
      throw new Error('the disclosures are nested more than one level deep');
    }
    t.PC_closed_by_default = !inner.open;
    if (inner.open) throw new Error('the paste control is open before it is asked for');

    /* Empty until asked. Asserted HERE and not in the PASTE-04 flow, because
       this is the first flow in the file to touch the control: by the time that
       one runs, this flow's own click has already put a line in it, and an
       assertion made after clearing it by hand would only prove the clearing
       worked. */
    var resultEl = document.getElementById('debtPasteResult');
    t.PC_result_initially = resultEl.textContent;
    if (resultEl.textContent.trim() !== '') {
      throw new Error('the control speaks before it is used: ' + resultEl.textContent);
    }

    // Its own button, and nothing else, does the fill. No submit.
    inner.open = true;
    box.value = 'Таны зээл 1,000,000₮ олгогдлоо. Эргэн төлөх дүн 1,360,000₮';
    var principal = document.getElementById('debtPrincipal');
    principal.value = '';
    document.getElementById('debtTotal').value = '';
    btn.click();
    t.PC_after_click = principal.value;
    if (principal.value !== '1,000,000') {
      throw new Error('the button did not fill the form: ' + principal.value);
    }
    if (db.debts.length !== 0) throw new Error('the button created a record');
    // The message stays put: the user compares it against the fields.
    if (box.value === '') throw new Error('the message was cleared out from under the comparison');

    /* Nothing spills sideways at this width with the control open, which is the
       measurement the ruled fallback turns on: if the nested control cannot sit
       inside the card, it comes out of the disclosure. */
    var card = inner.closest('.card');
    t.PC_card_overflow = Math.round(card.scrollWidth - card.clientWidth);
    if (card.scrollWidth > card.clientWidth + 1) {
      throw new Error('the paste control overflows its card by ' + t.PC_card_overflow +
                      'px at ' + t.viewport_clientWidth);
    }
    t.PC_page_overflow = Math.round(
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (t.PC_page_overflow > 0) {
      throw new Error('the page scrolls sideways at ' + t.viewport_clientWidth);
    }
    inner.open = false;
  });

  /* CONDITION — THE CONTROL SAYS WHAT IT ASSUMED, AND SAYS WHEN IT COULD NOT.
     Red by clearing the line, or by rewording it as an announcement of success.

     THIS FLOW IS THE FEATURE'S HONESTY, NOT ITS POLISH. The fill applies a rule
     the text cannot confirm — of two amounts the smaller is the principal —
     which orders a pair and never establishes that the pair found is the loan.
     The interest-line message below is a real Mongolian lender phrasing and it
     produces a WRONG debt that passes debtProblem, both write-path refusals and
     every other flow in this file. The only thing between it and a confirmed
     record is this sentence plus a human comparison, so the assertion is on the
     words: it must name the rule, and it must not read as "filled from your
     message". It also carries no pasted text, which is what keeps
     check-escaping.mjs as narrow as it is. */
  flow('the paste control states its assumption, and says when it cannot fill', function () {
    db.debts = []; db.debtPayments = [];
    navigate('debts'); renderDebts();
    var box = document.getElementById('debtPasteText');
    var btn = document.getElementById('debtPasteRead');
    var out = document.getElementById('debtPasteResult');
    box.closest('details').open = true;

    // A fill names the rule it applied.
    box.value = 'зээл 1,000,000 · хүү 300,000';
    btn.click();
    t.PR_filled = out.textContent.replace(/\s+/g, ' ').trim();
    if (t.PR_filled === '') throw new Error('the form was filled silently');
    if (t.PR_filled.indexOf('smaller') < 0 || t.PR_filled.indexOf('larger') < 0) {
      throw new Error('the line does not name the rule it applied: ' + t.PR_filled);
    }
    if (!/check/i.test(t.PR_filled)) {
      throw new Error('the line does not ask the user to check: ' + t.PR_filled);
    }
    if (/filled from your message|read your message|success/i.test(t.PR_filled)) {
      throw new Error('the line announces success instead of stating an assumption: ' + t.PR_filled);
    }

    /* AND THIS IS WHY IT MATTERS. That message is a principal and an interest
       line, so the rule has just produced a debt that repays 1,000,000 on
       300,000 borrowed — a cost of 700,000 where the truth is 300,000. The
       fields hold it and the sentence is the only thing saying so. */
    t.PR_trap_principal = document.getElementById('debtPrincipal').value;
    t.PR_trap_total = document.getElementById('debtTotal').value;
    if (t.PR_trap_principal !== '300,000' || t.PR_trap_total !== '1,000,000') {
      throw new Error('the interest-line trap no longer behaves as recorded: ' +
                      t.PR_trap_principal + ' / ' + t.PR_trap_total);
    }

    // A refusal says how many it found, and never quotes the message.
    box.value = 'Зээл 1,000,000₮ хүү 300,000₮ үлдэгдэл 1,300,000₮';
    btn.click();
    t.PR_refused = out.textContent.replace(/\s+/g, ' ').trim();
    if (t.PR_refused.indexOf('3 amounts') < 0) {
      throw new Error('the line does not say how many amounts were found: ' + t.PR_refused);
    }
    if (t.PR_refused.indexOf('1,000,000') >= 0 || t.PR_refused.indexOf('зээл') >= 0) {
      throw new Error('the line quotes the pasted message back: ' + t.PR_refused);
    }

    box.value = 'Таны хүсэлт хүлээн авлаа';
    btn.click();
    t.PR_none = out.textContent.replace(/\s+/g, ' ').trim();
    if (t.PR_none.indexOf('no amounts') < 0) {
      throw new Error('an unreadable message does not say so: ' + t.PR_none);
    }

    box.value = '';
    box.closest('details').open = false;
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
    t.R_line = line.textContent.replace(/s+/g, ' ').trim();

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
      .textContent.replace(/s+/g, ' ').trim();
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
    t.R_ask = ask.textContent.replace(/s+/g, ' ').trim();
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
    t.R_extreme_line = document.querySelector('.debt-rate').textContent.replace(/s+/g, ' ').trim();
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
