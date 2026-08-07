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
    if (/interest/i.test(t.B_totals_html)) {
      throw new Error('a debt owed to family is captioned with interest: ' + t.B_totals_html);
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
    // 500,000 of 1,500,000 repaid against a 500,000 cost = 166,667.
    if (t.K_interest !== Math.round(500000 * 500000 / 1500000)) {
      throw new Error('interest did not re-derive from the new total: ' + t.K_interest);
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
     sideways scroll, deliberately and on the record — index.html:890-896
     derives it for the six headline-figure classes, and `.debt-total-value` at
     :1610 is the same choice for this screen. A flow that asserted "the figure
     did not wrap" would be asserting against a decision the application made on
     purpose. So wrapping is MEASURED here (E_diag_cost_value_rects) and
     asserted nowhere.

     THE DECLARATIONS UNDER TEST are `.goal-meta-item.note` at index.html:1502
     and `.debt-name` at :1585 — the two `overflow-wrap: anywhere` rules that
     stop a long unbroken token from setting a floor this card cannot shrink
     past. Delete either and this flow reddens; measured, most recently at 91px
     of overflow with :1502 removed.

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
       `overflow-wrap: anywhere` (index.html:1610), which converts an overfilled
       figure into a mid-number line break rather than a page overflow — so the
       assertion below reads zero on the failure exactly as it does on the
       success, and cannot see it. 10,000,000 borrowed against 13,000,000 owed,
       6,500,000 repaid, puts 1,500,000 into "Paid in interest": ten glyphs in
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
      // actually carries, `.goal-meta-item.note` at index.html:1502, DOES
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
       narrower .grid-2 tiles for many rounds, and index.html:890-896 records
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
     fails on correct code. So the four are snapshotted twice with nothing in
     between and required to be identical before anything else is asserted. A
     screen that fails that is dropped from the set here, with the reason
     recorded, rather than making the whole flow untrustworthy. */
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
