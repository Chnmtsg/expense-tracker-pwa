// The Accounts feature's binding conditions, as a command.
//
//   node tools/harness/run.mjs tools/harness/accounts.js --width 320
//   npm run accounts
//
// WHY THIS EXISTS
//
// Accounts were approved (reports/chief-architect-accounts.md) as a VIEW over
// records that already exist plus one new ledger, transfers. The safety
// argument is again a set of negatives — no existing total moves, a restore
// replaces accounts like everything else, a transfer can never name an account
// that is not there — and negatives rot silently. Each flow below is one of
// those conditions.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}
function publish() {
  document.documentElement.setAttribute('data-probe', JSON.stringify(t));
}

var tid = db.incomeTypes[0].id;
var cid = db.categories[0].id;
function seed() {
  db.accounts = [
    { id: 'A1', name: 'Needs (Khan)', opening: 100000 },
    { id: 'A2', name: 'Debt payoff', opening: 0 }
  ];
  db.transfers = [
    { id: 'T1', date: todayISO(), amount: 30000, fromId: 'A1', toId: 'A2', notes: '' }
  ];
  db.income = [
    { id: 'I1', date: todayISO(), amount: 500000, typeId: tid, notes: '', accountId: 'A1' },
    { id: 'I2', date: todayISO(), amount: 70000,  typeId: tid, notes: '' }
  ];
  db.planned = [];
  db.debts = []; db.debtPayments = [];
  db.actual = [
    { id: 'E1', date: todayISO(), amount: 45000, categoryId: cid, notes: '', accountId: 'A1' }
  ];
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;

  /* STEP 1 — STORE AND IMPORT (ruling C1, C2). */

  // Red by deleting `accounts: [], transfers: []` from importReplacement.
  flow('restoring a backup taken before accounts existed clears accounts', function () {
    seed();
    if (!save()) throw new Error('setup failed: could not persist the fixture');
    var legacyFile = JSON.parse(JSON.stringify(db));
    delete legacyFile.accounts;
    delete legacyFile.transfers;
    legacyFile.income.forEach(function (r) { delete r.accountId; });
    legacyFile.actual.forEach(function (r) { delete r.accountId; });
    var v = importProblem(legacyFile);
    if (v !== null) throw new Error('a pre-accounts backup is refused: ' + v);
    var r = importReplacement(legacyFile);
    t.A_legacy_accounts = r.accounts;
    t.A_legacy_transfers = r.transfers;
    if (!Array.isArray(r.accounts) || r.accounts.length) throw new Error('accounts survived a restore: ' + JSON.stringify(r.accounts));
    if (!Array.isArray(r.transfers) || r.transfers.length) throw new Error('transfers survived a restore: ' + JSON.stringify(r.transfers));
  });

  flow('the app accepts and carries its own export', function () {
    seed();
    var exported = JSON.parse(JSON.stringify(db, null, 2));
    t.B_verdict = importProblem(exported);
    if (t.B_verdict !== null) throw new Error('the app refuses its own export: ' + t.B_verdict);
    var r = importReplacement(exported);
    if (r.accounts.length !== 2 || r.transfers.length !== 1) throw new Error('import lost accounts or transfers');
    if (r.income[0].accountId !== 'A1') throw new Error('import lost an income accountId');
  });

  // Each shape is refused by a different check. Red by removing the matching
  // line from accountProblem, transferProblem, the ends cross-check or
  // entryProblem.
  flow('malformed accounts and transfers are refused with a reason', function () {
    function verdictFor(mutate) {
      seed();
      var f = JSON.parse(JSON.stringify(db));
      mutate(f);
      return importProblem(f);
    }
    var cases = {
      accounts_not_list:  function (f) { f.accounts = {}; },
      account_no_name:    function (f) { f.accounts[0].name = '   '; },
      account_neg_open:   function (f) { f.accounts[0].opening = -1; },
      account_str_open:   function (f) { f.accounts[0].opening = '100'; },
      account_dup_id:     function (f) { f.accounts[1].id = 'A1'; },
      transfer_self:      function (f) { f.transfers[0].toId = 'A1'; },
      transfer_missing:   function (f) { f.transfers[0].toId = 'GONE'; },
      transfer_bad_date:  function (f) { f.transfers[0].date = '9/10/2026'; },
      transfer_neg:       function (f) { f.transfers[0].amount = -5; },
      income_empty_acct:  function (f) { f.income[0].accountId = ''; },
      actual_num_acct:    function (f) { f.actual[0].accountId = 7; },
      share_zero:         function (f) { f.accounts[0].share = 0; },
      share_fraction:     function (f) { f.accounts[0].share = 12.5; },
      share_over:         function (f) { f.accounts[0].share = 101; },
      shares_sum_over:    function (f) { f.accounts[0].share = 60; f.accounts[1].share = 50; },
      income_id_empty:    function (f) { f.transfers[0].incomeId = ''; }
    };
    t.C_refusals = {};
    var accepted = [];
    Object.keys(cases).forEach(function (k) {
      var v = verdictFor(cases[k]);
      t.C_refusals[k] = v;
      if (v === null) accepted.push(k);
    });
    if (accepted.length) throw new Error('accepted malformed file(s): ' + accepted.join(', '));
    // The deliberate exception: an accountId naming nothing is "No account".
    t.C_dangling = verdictFor(function (f) { f.income[0].accountId = 'GONE'; });
    if (t.C_dangling !== null) throw new Error('a dangling income accountId was refused: ' + t.C_dangling);
    // Valid envelope fields, including a move whose income is gone, pass.
    t.C_envelope_ok = verdictFor(function (f) { f.accounts[0].share = 60; f.accounts[1].share = 40; f.transfers[0].incomeId = 'GONE'; });
    if (t.C_envelope_ok !== null) throw new Error('valid shares / incomeId were refused: ' + t.C_envelope_ok);
  });

  // Red by removing `|| []` from accounts or transfers in load().
  flow('a store written before accounts existed still loads', function () {
    var legacy = {
      schemaVersion: SCHEMA_VERSION,
      income: [{ id: 'L1', date: todayISO(), amount: 4000, typeId: tid, notes: '' }],
      planned: [], actual: [], categories: db.categories, incomeTypes: db.incomeTypes,
      salaries: [], goals: [], goalContributions: [], debts: [], debtPayments: [], settings: {}
    };
    localStorage.setItem(KEY, JSON.stringify(legacy));
    db = load();
    if (!Array.isArray(db.accounts) || db.accounts.length) throw new Error('db.accounts is ' + JSON.stringify(db.accounts));
    if (!Array.isArray(db.transfers) || db.transfers.length) throw new Error('db.transfers is ' + JSON.stringify(db.transfers));
    if (db.income.length !== 1) throw new Error('the legacy store lost its income');
  });

  // Red by removing 'accounts' from LOAD_COLLECTIONS: the non-list then
  // reaches the app instead of the quarantine.
  flow('a stored non-list accounts value is quarantined, not loaded', function () {
    var bad = JSON.parse(JSON.stringify(db));
    bad.accounts = { oops: true };
    localStorage.setItem(KEY, JSON.stringify(bad));
    var realErr = console.error;
    console.error = function () {};   // the quarantine logs on purpose
    try { db = load(); } finally { console.error = realErr; }
    t.E_accounts = db.accounts;
    if (!Array.isArray(db.accounts)) throw new Error('a non-list accounts value reached the app');
    if (!corruptRawKey) throw new Error('the bad store was not quarantined');
  });

  /* STEP 2 — THE SCREEN AND THE BALANCE (ruling C3, C4, C7). */

  // Seed: A1 opens 100,000, +500,000 income, -45,000 expense, -30,000 moved
  // out = 525,000. A2 receives the 30,000. Each excluded record below would
  // move one of those figures if it were counted.
  flow('a balance counts exactly what it should', function () {
    seed();
    var future = new Date(); future.setDate(future.getDate() + 3);
    db.income.push({ id: 'IF', date: toLocalISO(future), amount: 999, typeId: tid, notes: '', accountId: 'A1' });
    db.planned.push({ id: 'PL', date: todayISO(), amount: 777, categoryId: cid, notes: '', accountId: 'A1' });
    t.F_A1 = accountBalance(db.accounts[0]);
    t.F_A2 = accountBalance(db.accounts[1]);
    if (t.F_A1 !== 525000) throw new Error('A1 is ' + t.F_A1 + ', expected 525000');
    if (t.F_A2 !== 30000) throw new Error('A2 is ' + t.F_A2 + ', expected 30000');
    navigate('accounts');
    t.F_total_text = document.getElementById('acctTotal').textContent;
    if (t.F_total_text !== fmt(555000)) throw new Error('total reads ' + t.F_total_text + ', expected ' + fmt(555000));
    if (document.getElementById('accounts').offsetParent === null) throw new Error('the Accounts screen is not showing');
    if (document.getElementById('acctMoveCard').style.display === 'none') throw new Error('Move money is hidden with two accounts');
  });

  // The ruling's central negative: accounts are a view, so Home must not move.
  flow('accounts and transfers do not change any Home figure', function () {
    seed();
    db.accounts = []; db.transfers = [];
    db.income.forEach(function (r) { delete r.accountId; });
    db.actual.forEach(function (r) { delete r.accountId; });
    navigate('dashboard');
    var before = document.getElementById('dashboard').textContent;
    seed();
    navigate('dashboard');
    var after = document.getElementById('dashboard').textContent;
    if (before !== after) throw new Error('the Dashboard text changed when accounts were added');
  });

  flow('the forms refuse what the ruling refuses', function () {
    seed(); save(); navigate('accounts');
    var n = db.accounts.length;
    document.getElementById('acctName').value = '   ';
    document.getElementById('acctAdd').click();
    if (db.accounts.length !== n) throw new Error('an account with a blank name was added');
    document.getElementById('acctName').value = 'Hobby';
    document.getElementById('acctOpening').value = '20,000';
    document.getElementById('acctAdd').click();
    var added = db.accounts[db.accounts.length - 1];
    if (db.accounts.length !== n + 1 || added.name !== 'Hobby' || added.opening !== 20000) {
      throw new Error('a valid account was not added as typed: ' + JSON.stringify(added));
    }
    var m = db.transfers.length;
    document.getElementById('trFrom').value = 'A1';
    document.getElementById('trTo').value = 'A1';
    document.getElementById('trAmount').value = '5,000';
    document.getElementById('trAdd').click();
    if (db.transfers.length !== m) throw new Error('a move to the same account was saved');
    document.getElementById('trTo').value = 'A2';
    document.getElementById('trAmount').value = '';
    document.getElementById('trAdd').click();
    if (db.transfers.length !== m) throw new Error('a move of nothing was saved');
    document.getElementById('trAmount').value = '5,000';
    document.getElementById('trAdd').click();
    if (db.transfers.length !== m + 1) throw new Error('a valid move was not saved');
    if (accountBalance(db.accounts[0]) !== 520000) throw new Error('the move did not reach the balance');
  });

  flow('the Data Summary lists accounts without a clear, and money moves with one', function () {
    seed(); navigate('settings'); renderDataSummary();
    var html = document.getElementById('dataSummary').innerHTML;
    if (html.indexOf('Accounts') < 0 || html.indexOf('Money moves') < 0) throw new Error('a row is missing');
    // The control itself, not just the label (CODE-04). Clearing accounts
    // would orphan the transfers, so that row must have no clear button.
    if (document.querySelector('#dataSummary [aria-label="Clear all Accounts"]')) throw new Error('Accounts can be cleared');
    if (!document.querySelector('#dataSummary [aria-label="Clear all Money moves"]')) throw new Error('Money moves has no clear button');
  });

  /* STEP 3 — THE FORM AND EDIT SELECTS (ruling C5, C6). */

  flow('the empty screen has no ₮0 headline, and one account explains the missing move', function () {
    db.accounts = []; db.transfers = []; navigate('accounts');
    if (document.getElementById('acctTotalBlock').style.display !== 'none') throw new Error('the total shows with no accounts');
    db.accounts = [{ id: 'A1', name: 'Cash', opening: 0 }]; renderAccounts();
    if (document.getElementById('acctTotalBlock').style.display === 'none') throw new Error('the total is hidden with an account');
    if (document.getElementById('acctMoveHint').style.display === 'none') throw new Error('no hint with exactly one account');
    seed(); renderAccounts();
    if (document.getElementById('acctMoveHint').style.display !== 'none') throw new Error('the hint stays with two accounts');
  });

  flow('with no accounts the forms are exactly as before', function () {
    db.accounts = []; db.transfers = [];
    navigate('income'); setExpMode('actual'); navigate('expenses');
    if (document.getElementById('incAcctWrap').style.display !== 'none') throw new Error('Income shows an account select with no accounts');
    if (document.getElementById('expAcctWrap').style.display !== 'none') throw new Error('Expenses shows an account select with no accounts');
  });

  flow('the income form records the account and starts on the last used', function () {
    seed(); save(); navigate('income');
    if (document.getElementById('incAcctWrap').style.display === 'none') throw new Error('the select is hidden with accounts');
    // seed's last income has no account, so the form starts on "No account".
    t.H_initial = document.getElementById('incAccount').value;
    if (t.H_initial !== '') throw new Error('started on ' + t.H_initial + ', expected No account');
    document.getElementById('incAmount').value = '12,000';
    document.getElementById('incAccount').value = 'A2';
    document.getElementById('incAdd').click();
    var added = db.income[db.income.length - 1];
    if (added.amount !== 12000 || added.accountId !== 'A2') throw new Error('stored ' + JSON.stringify(added));
    t.H_next = document.getElementById('incAccount').value;
    if (t.H_next !== 'A2') throw new Error('the form did not start on the last used account: ' + t.H_next);
    if (document.getElementById('incList').textContent.indexOf('Debt payoff') < 0) throw new Error('the row does not name its account');
    // "No account" is the field's absence, not "".
    document.getElementById('incAmount').value = '1,000';
    document.getElementById('incAccount').value = '';
    document.getElementById('incAdd').click();
    var plain = db.income[db.income.length - 1];
    if ('accountId' in plain) throw new Error('"No account" stored accountId=' + JSON.stringify(plain.accountId));
  });

  flow('a plan never takes an account from the form', function () {
    seed(); save(); setExpMode('planned'); navigate('expenses');
    if (document.getElementById('expAcctWrap').style.display !== 'none') throw new Error('Planned mode shows Paid from');
    document.getElementById('expAccount').value = 'A1';
    document.getElementById('expAmount').value = '9,000';
    document.getElementById('expAdd').click();
    var plan = db.planned[db.planned.length - 1];
    if ('accountId' in plan) throw new Error('a plan stored an account');
    setExpMode('actual');
    if (document.getElementById('expAcctWrap').style.display === 'none') throw new Error('Actual mode hides Paid from');
    if (document.getElementById('expAccount').value !== 'A1') throw new Error('Paid from did not start on the last used account');
  });

  flow('the edit sheet sets, changes and removes the account', function () {
    seed(); save(); navigate('income');
    openEditModal('income', 'I1');
    if (document.getElementById('mAccount').value !== 'A1') throw new Error('the sheet did not show the entry account');
    document.getElementById('mAccount').value = '';
    document.getElementById('editModalSave').click();
    var i1 = db.income.find(function (x) { return x.id === 'I1'; });
    if ('accountId' in i1) throw new Error('choosing No account left accountId=' + JSON.stringify(i1.accountId));
    // A2 must be able to cover the 45,000 or the limit (step 3) stops the move.
    db.accounts[1].opening = 100000;
    openEditModal('actual', 'E1');
    document.getElementById('mAccount').value = 'A2';
    document.getElementById('editModalSave').click();
    var e1 = db.actual.find(function (x) { return x.id === 'E1'; });
    if (e1.accountId !== 'A2') throw new Error('the expense edit did not move the account: ' + e1.accountId);
  });

  // CODE-01. Logging a plan writes no account in Phase 1, so a plan must not
  // hold one: the field is hidden for plans, and a move to Planned drops it.
  flow('a plan cannot keep an account through the edit sheet', function () {
    seed(); db.planned = [{ id: 'P9', date: todayISO(), amount: 5000, categoryId: cid, notes: '' }]; save();
    openEditModal('planned', 'P9');
    if (document.getElementById('mAcctWrap').style.display !== 'none') throw new Error('Paid from is showing on a plan');
    document.getElementById('editModalSave').click();
    openEditModal('actual', 'E1');
    document.querySelector('#mKindSeg [data-mkind="planned"]').click();
    if (document.getElementById('mAcctWrap').style.display !== 'none') throw new Error('Paid from stays visible after switching to Planned');
    document.getElementById('editModalSave').click();
    var moved = db.planned.find(function (x) { return x.id === 'E1'; });
    if (!moved) throw new Error('setup failed: E1 did not move to planned');
    if ('accountId' in moved) throw new Error('a plan kept accountId=' + moved.accountId);
  });

  /* PHASE 2, ITEM 1a — DEBT PAYMENTS TAKEN FROM AN ACCOUNT. */

  function seedDebt() {
    db.debts = [{ id: 'D1', name: 'A lender', date: todayISO(), principal: 300000, totalToRepay: 360000, notes: '' }];
    db.debtPayments = [];
  }

  flow('a debt payment from an account lowers that account and nothing else', function () {
    seed(); seedDebt(); save();
    var before = accountBalance(db.accounts[0]);
    openDebtPaymentModal('D1');
    var sel = document.getElementById('mAccount');
    if (!sel) throw new Error('the payment sheet has no Paid from with accounts');
    document.getElementById('mAmount').value = '60,000';
    sel.value = 'A1';
    document.getElementById('editModalSave').click();
    var pay = db.debtPayments[db.debtPayments.length - 1];
    if (!pay || pay.accountId !== 'A1' || pay.amount !== 60000) throw new Error('stored ' + JSON.stringify(pay));
    t.J_A1 = accountBalance(db.accounts[0]);
    if (t.J_A1 !== before - 60000) throw new Error('A1 went ' + before + ' -> ' + t.J_A1);
    if (accountBalance(db.accounts[1]) !== 30000) throw new Error('A2 moved');
    // The next sheet starts on the account just used.
    openDebtPaymentModal('D1');
    if (document.getElementById('mAccount').value !== 'A1') throw new Error('the sheet did not start on the last used account');
    document.getElementById('mAmount').value = '1,000';
    document.getElementById('mAccount').value = '';
    document.getElementById('editModalSave').click();
    var plain = db.debtPayments[db.debtPayments.length - 1];
    if ('accountId' in plain) throw new Error('"No account" stored accountId=' + JSON.stringify(plain.accountId));
    if (accountBalance(db.accounts[0]) !== t.J_A1) throw new Error('an unassigned payment moved A1');
    openDebtHistoryProbe();
  });
  function openDebtHistoryProbe() {
    navigate('debts');
    var btn = document.querySelector('[data-debt-hist="D1"]');
    if (!btn) throw new Error('setup failed: no payment-history button on the debt card');
    btn.click();
    if (document.getElementById('editModalBody').textContent.indexOf('Needs (Khan)') < 0) {
      throw new Error('the payment history does not name the account');
    }
    closeEditModal();
  }

  flow('with no accounts the payment sheet is exactly as before', function () {
    seed(); seedDebt(); db.accounts = []; db.transfers = [];
    db.income.forEach(function (r) { delete r.accountId; });
    db.actual.forEach(function (r) { delete r.accountId; });
    save();
    openDebtPaymentModal('D1');
    if (document.getElementById('mAccount')) throw new Error('Paid from shows with no accounts');
    closeEditModal();
  });

  flow('import checks a debt payment accountId', function () {
    seed(); seedDebt();
    db.debtPayments = [{ id: 'P1', debtId: 'D1', date: todayISO(), amount: 1000, notes: '', accountId: '' }];
    var f = JSON.parse(JSON.stringify(db));
    t.K_verdict = importProblem(f);
    if (t.K_verdict === null) throw new Error('an empty debt payment accountId was accepted');
    f.debtPayments[0].accountId = 'A1';
    if (importProblem(f) !== null) throw new Error('a valid debt payment accountId was refused: ' + importProblem(f));
  });

  /* ENVELOPES STEP 2 — SHARES AND THE SPLIT (ruling E2, E3, E4). */

  function seedShares() {
    seed();
    db.accounts[1].share = 20;   // A2 Debt payoff
    db.accounts.push({ id: 'A3', name: 'Hobby', opening: 0, share: 30 });
    save();
  }

  flow('a share is refused past 100% and stored as absent when empty', function () {
    seedShares(); navigate('accounts');
    var n = db.accounts.length;
    document.getElementById('acctName').value = 'Savings';
    document.getElementById('acctShare').value = '60';
    document.getElementById('acctAdd').click();
    if (db.accounts.length !== n) throw new Error('a share taking the total to 110% was accepted');
    document.getElementById('acctShare').value = '12.5';
    document.getElementById('acctAdd').click();
    if (db.accounts.length !== n) throw new Error('a fractional share was accepted');
    document.getElementById('acctShare').value = '50';
    document.getElementById('acctAdd').click();
    var added = db.accounts[db.accounts.length - 1];
    if (db.accounts.length !== n + 1 || added.share !== 50) throw new Error('a valid share was not stored: ' + JSON.stringify(added));
    openEditAccount(added.id);
    document.getElementById('mAcctShare').value = '';
    document.getElementById('editModalSave').click();
    if ('share' in added) throw new Error('an emptied share stored share=' + JSON.stringify(added.share));
    if (document.getElementById('acctShareLine').textContent.indexOf('50%') < 0) {
      throw new Error('the share line does not state the total: ' + document.getElementById('acctShareLine').textContent);
    }
  });

  flow('an income is split into linked money moves by the shares', function () {
    seedShares(); navigate('income');
    document.getElementById('incAccount').value = 'A1';
    document.getElementById('incAccount').dispatchEvent(new Event('change'));
    document.getElementById('incAmount').value = '1,000,000';
    document.getElementById('incAmount').dispatchEvent(new Event('input'));
    if (document.getElementById('incSplitWrap').style.display === 'none') throw new Error('no split offered with shares');
    var a2 = document.getElementById('incSplit-A2'), a3 = document.getElementById('incSplit-A3');
    if (!a2 || !a3) throw new Error('a split row is missing');
    t.L_prefill = [a2.value, a3.value];
    if (unmoney(a2.value) !== 200000 || unmoney(a3.value) !== 300000) throw new Error('prefill ' + t.L_prefill.join(' / '));
    a3.value = '250,000'; a3.dispatchEvent(new Event('input'));
    t.L_rest = document.getElementById('incSplitRest').textContent;
    if (t.L_rest.indexOf(fmt(550000)) < 0) throw new Error('the remainder line reads ' + t.L_rest);
    var before = accountBalance(db.accounts[0]);
    document.getElementById('incAdd').click();
    var inc = db.income[db.income.length - 1];
    var moves = db.transfers.filter(function (m) { return m.incomeId === inc.id; });
    t.L_moves = moves.map(function (m) { return m.toId + ':' + m.amount; });
    if (inc.amount !== 1000000 || inc.accountId !== 'A1') throw new Error('income stored ' + JSON.stringify(inc));
    if (moves.length !== 2) throw new Error('expected 2 linked moves, got ' + moves.length);
    if (accountBalance(db.accounts[0]) !== before + 550000) throw new Error('A1 should gain the remainder 550000');
    if (accountBalance(db.accounts[2]) !== 250000) throw new Error('Hobby should hold the edited 250000');
  });

  flow('a split larger than the income, or a split turned off, writes no moves', function () {
    seedShares(); navigate('income');
    var m0 = db.transfers.length, i0 = db.income.length;
    document.getElementById('incAccount').value = 'A1';
    document.getElementById('incAmount').value = '100,000';
    document.getElementById('incAmount').dispatchEvent(new Event('input'));
    var a3 = document.getElementById('incSplit-A3');
    a3.value = '95,000'; a3.dispatchEvent(new Event('input'));
    document.getElementById('incAdd').click();
    if (db.income.length !== i0 || db.transfers.length !== m0) throw new Error('an over-split income was saved');
    document.getElementById('incSplitOn').checked = false;
    document.getElementById('incSplitOn').dispatchEvent(new Event('change'));
    document.getElementById('incAdd').click();
    if (db.income.length !== i0 + 1) throw new Error('the unsplit income was not saved');
    if (db.transfers.length !== m0) throw new Error('an unticked split still wrote moves');
    document.getElementById('incSplitOn').checked = true;
  });

  flow('editing a split income keeps its moves in step and refuses what would break them', function () {
    seedShares();
    db.income.push({ id: 'IS', date: todayISO(), amount: 1000000, typeId: tid, notes: '', accountId: 'A1' });
    db.transfers.push({ id: 'S2', date: todayISO(), amount: 200000, fromId: 'A1', toId: 'A2', notes: 'Split of income', incomeId: 'IS' });
    save(); navigate('income');
    openEditModal('income', 'IS');
    if (document.getElementById('editModalBody').textContent.indexOf('does not split it again') < 0) throw new Error('no note about the split');
    document.getElementById('mAmount').value = '150,000';
    document.getElementById('editModalSave').click();
    if (db.income.find(function (x) { return x.id === 'IS'; }).amount !== 1000000) throw new Error('shrunk below its moves');
    document.getElementById('mAmount').value = '1,000,000';
    document.getElementById('mAccount').value = 'A2';
    document.getElementById('editModalSave').click();
    if (db.income.find(function (x) { return x.id === 'IS'; }).accountId !== 'A1') throw new Error('moved into an account its split pays');
    document.getElementById('mAccount').value = '';
    document.getElementById('editModalSave').click();
    if (db.income.find(function (x) { return x.id === 'IS'; }).accountId !== 'A1') throw new Error('a split income lost its account');
    var past = new Date(); past.setDate(past.getDate() - 2);
    document.getElementById('mDate').value = toLocalISO(past);
    document.getElementById('mAccount').value = 'A3';
    document.getElementById('editModalSave').click();
    var mv = db.transfers.find(function (m) { return m.id === 'S2'; });
    if (mv.fromId !== 'A3' || mv.date !== toLocalISO(past)) throw new Error('the move did not follow: ' + JSON.stringify(mv));
  });

  /* ENVELOPES STEP 3 — THE LIMIT (ruling E5, E6, E7). Synchronous parts. */

  flow('a money move beyond the source balance is refused, with no override', function () {
    seed(); save(); navigate('accounts');
    var m0 = db.transfers.length;
    document.getElementById('trFrom').value = 'A2';   // holds 30,000
    document.getElementById('trTo').value = 'A1';
    document.getElementById('trAmount').value = '30,001';
    document.getElementById('trAdd').click();
    if (db.transfers.length !== m0) throw new Error('a move larger than the source balance was saved');
    document.getElementById('trAmount').value = '30,000';
    document.getElementById('trAdd').click();
    if (db.transfers.length !== m0 + 1) throw new Error('a move of exactly the balance was refused');
  });

  flow('a spend that fits, or one with no account, saves at once with no dialog', function () {
    seed(); save(); setExpMode('actual'); navigate('expenses');
    var calls = 0, real = window.choiceDialog;
    window.choiceDialog = function () { calls++; return Promise.resolve('cancel'); };
    try {
      var n = db.actual.length;
      document.getElementById('expAccount').value = 'A2';
      document.getElementById('expAmount').value = '30,000';
      document.getElementById('expAdd').click();
      if (db.actual.length !== n + 1) throw new Error('a spend of exactly the balance was not saved in the same task');
      document.getElementById('expAccount').value = '';
      document.getElementById('expAmount').value = '9,999,999';
      document.getElementById('expAdd').click();
      if (db.actual.length !== n + 2) throw new Error('a no-account spend was limited');
      if (calls) throw new Error('the dialog opened ' + calls + ' time(s) for spends that need none');
    } finally { window.choiceDialog = real; }
  });

  flow('editing only the notes of an overdrawn expense does not trip the limit', function () {
    seed();
    db.accounts.push({ id: 'A3', name: 'Hobby', opening: 0 });
    db.actual.push({ id: 'EO', date: todayISO(), amount: 45000, categoryId: cid, notes: '', accountId: 'A3' });
    save();
    var calls = 0, real = window.choiceDialog;
    window.choiceDialog = function () { calls++; return Promise.resolve('cancel'); };
    try {
      openEditModal('actual', 'EO');
      document.getElementById('mNotes').value = 'fixed a typo';
      document.getElementById('editModalSave').click();
      if (calls) throw new Error('a notes-only edit opened the limit dialog');
      if (db.actual.find(function (x) { return x.id === 'EO'; }).notes !== 'fixed a typo') throw new Error('the notes edit was not saved');
    } finally { window.choiceDialog = real; }
  });

  flow('an edit counts what the expense already took from the account', function () {
    seed();
    db.accounts.push({ id: 'A3', name: 'Hobby', opening: 50000 });
    db.actual.push({ id: 'EC', date: todayISO(), amount: 45000, categoryId: cid, notes: '', accountId: 'A3' });
    save();   // Hobby: 5,000 left
    var calls = 0, real = window.choiceDialog;
    window.choiceDialog = function () { calls++; return Promise.resolve('cancel'); };
    try {
      openEditModal('actual', 'EC');
      document.getElementById('mAmount').value = '50,000';
      document.getElementById('editModalSave').click();
      if (calls) throw new Error('raising 45,000 to 50,000 against a 50,000 account was limited — the old amount was not credited');
      if (db.actual.find(function (x) { return x.id === 'EC'; }).amount !== 50000) throw new Error('the edit was not saved');
    } finally { window.choiceDialog = real; }
  });

  /* Post-implementation review fixes. */

  // UI-03 / CODE-03
  flow('a split row the user typed survives a change to the amount', function () {
    seedShares(); navigate('income');
    document.getElementById('incAccount').value = 'A1';
    document.getElementById('incAmount').value = '1,000,000';
    document.getElementById('incAmount').dispatchEvent(new Event('input'));
    var a3 = document.getElementById('incSplit-A3');
    a3.value = '50,000'; a3.dispatchEvent(new Event('input'));
    document.getElementById('incAmount').value = '1,200,000';
    document.getElementById('incAmount').dispatchEvent(new Event('input'));
    if (unmoney(document.getElementById('incSplit-A3').value) !== 50000) throw new Error('the typed row was reset to ' + document.getElementById('incSplit-A3').value);
    if (unmoney(document.getElementById('incSplit-A2').value) !== 240000) throw new Error('an untouched row did not follow the new amount');
    // UI-08: never a negative remainder.
    var a2 = document.getElementById('incSplit-A2');
    a2.value = '1,500,000'; a2.dispatchEvent(new Event('input'));
    if (/-/.test(document.getElementById('incSplitRest').textContent)) throw new Error('negative remainder: ' + document.getElementById('incSplitRest').textContent);
    document.getElementById('incAmount').value = '';
    document.getElementById('incAmount').dispatchEvent(new Event('input'));
  });

  /* WORK-09: the Salary save writes its income through Add Income's own
     writer. Two conditions of the ruling, plus the refusal path. */
  function fillSalary() {
    navigate('salary');
    sIds.forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('sHourly').value = '10,000';
    document.getElementById('sNormal').value = '160';
    document.getElementById('sSIPct').value = '11.5';
    document.getElementById('sWHTPct').value = '10';
    document.getElementById('sNormal').dispatchEvent(new Event('input'));
    return calcSalary().net;
  }
  function countWrites(fn) {
    var real = Storage.prototype.setItem, n = 0;
    Storage.prototype.setItem = function (k, v) { if (k === KEY) n++; return real.call(this, k, v); };
    try { fn(); } finally { Storage.prototype.setItem = real; }
    return n;
  }

  flow('with no accounts the Salary screen and its write are unchanged', function () {
    seed();
    db.accounts = []; db.transfers = [];
    db.income.forEach(function (x) { delete x.accountId; });
    save();
    var net = fillSalary();
    if (document.getElementById('sAcctWrap').style.display !== 'none') throw new Error('the account block shows with no accounts');
    var salaries = db.salaries.length, incomes = db.income.length;
    var writes = countWrites(function () { document.getElementById('sSave').click(); });
    if (writes !== 1) throw new Error('the salary and its income took ' + writes + ' writes, not one');
    if (db.salaries.length !== salaries + 1 || db.income.length !== incomes + 1) throw new Error('the salary or its income was not written');
    var inc = db.income[db.income.length - 1];
    if (inc.amount !== net) throw new Error('the income is ' + inc.amount + ', not the net ' + net);
    if ('accountId' in inc) throw new Error('an accountless salary income carries accountId ' + JSON.stringify(inc.accountId));
    if (db.transfers.length) throw new Error('an accountless salary made moves');
    if ('accountId' in db.salaries[db.salaries.length - 1]) throw new Error('the salary record names an account');
  });

  flow('a Salary save makes the same moves as Add Income of the same net', function () {
    seedShares();
    db.transfers = []; db.salaries = [];
    save();
    var net = fillSalary();
    if (document.getElementById('sAcctWrap').style.display === 'none') throw new Error('the account block is hidden with accounts');
    document.getElementById('sAccount').value = 'A1';
    document.getElementById('sAccount').dispatchEvent(new Event('change'));
    if (document.getElementById('sSplitWrap').style.display === 'none') throw new Error('the split rows are hidden with shares');
    var over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (over > 0) throw new Error('the Salary screen scrolls sideways by ' + over + 'px with the account block');
    var writes = countWrites(function () { document.getElementById('sSave').click(); });
    if (writes !== 1) throw new Error('the salary and its income took ' + writes + ' writes, not one');
    var sInc = db.income[db.income.length - 1];
    if (sInc.accountId !== 'A1') throw new Error('the salary income went into ' + JSON.stringify(sInc.accountId));
    var sMoves = splitMovesOf(sInc.id);

    navigate('income');
    document.getElementById('incAccount').value = 'A1';
    document.getElementById('incAccount').dispatchEvent(new Event('change'));
    document.getElementById('incAmount').value = moneyValue(net);
    document.getElementById('incAmount').dispatchEvent(new Event('input'));
    document.getElementById('incAdd').click();
    var iInc = db.income[db.income.length - 1];
    var iMoves = splitMovesOf(iInc.id);
    function shape(ms) { return JSON.stringify(ms.map(function (m) { return [m.fromId, m.toId, m.amount, m.date, m.notes]; }).sort()); }
    if (!sMoves.length) throw new Error('the salary made no split moves');
    if (shape(sMoves) !== shape(iMoves)) throw new Error('salary moves ' + shape(sMoves) + ' differ from Add Income ' + shape(iMoves));
  });

  flow('a salary split larger than the net is refused and writes nothing', function () {
    seedShares();
    db.transfers = []; db.salaries = [];
    db.incomeTypes = db.incomeTypes.filter(function (t) { return t.name !== 'Salary'; });
    save();
    var net = fillSalary();
    document.getElementById('sAccount').value = 'A1';
    document.getElementById('sAccount').dispatchEvent(new Event('change'));
    var row = document.getElementById('sSplit-A3');
    row.value = moneyValue(net + 1); row.dispatchEvent(new Event('input'));
    var before = localStorage.getItem(KEY), types = db.incomeTypes.length, incomes = db.income.length;
    document.getElementById('sSave').click();
    if (!row.classList.contains('invalid')) throw new Error('the split row is not marked');
    if (db.salaries.length || db.income.length !== incomes || db.transfers.length || db.incomeTypes.length !== types) throw new Error('a refused salary left something pushed');
    if (localStorage.getItem(KEY) !== before) throw new Error('a refused salary wrote the store');
    row.value = ''; row.removeAttribute('data-edited');
    navigate('dashboard');
  });

  /* R4 (phase 2 rest): borrowed money arriving into an account. */

  // WORK-06: refusals in the edit sheets and Settings mark and focus the field.
  flow('an edit-sheet or Settings refusal marks and focuses the field', function () {
    seed(); save();
    function marked(id, what) {
      var el = document.getElementById(id);
      if (!el.classList.contains('invalid') || el.getAttribute('aria-invalid') !== 'true') throw new Error(what + ': ' + id + ' is not marked');
      if (document.activeElement !== el) throw new Error(what + ': ' + id + ' is not focused');
    }
    openEditModal('actual', 'E1');
    document.getElementById('mAmount').value = '0';
    document.getElementById('editModalSave').click();
    marked('mAmount', 'expense edit');
    // Sprint 1 review UI-04: the edit sheets refuse in the add form's words.
    function said(msg, what) {
      var got = document.getElementById('toast').textContent;
      if (got !== msg) throw new Error(what + ' said "' + got + '", the add form says "' + msg + '"');
    }
    said('Enter an amount', 'expense edit');
    closeEditModal();
    db.goals = [{ id: 'GW', name: 'Trip', target: 100000, icon: '🎯', deadline: '', notes: '', createdDate: todayISO() }]; save();
    openGoalEditModal('GW');
    document.getElementById('mGoalName').value = '';
    document.getElementById('editModalSave').click();
    said('Enter a name', 'goal edit name');
    marked('mGoalName', 'goal edit name');
    document.getElementById('mGoalName').value = 'Trip';
    document.getElementById('mGoalTarget').value = '0';
    document.getElementById('editModalSave').click();
    said('Enter a target amount', 'goal edit target');
    marked('mGoalTarget', 'goal edit target');
    closeEditModal();
    // Sprint 1 review CODE-09: every other WORK-06 site, not a sample.
    db.debts = [{ id: 'DY', name: 'Bat', principal: 100000, totalToRepay: 100000, date: isoFromToday(-30), notes: '' }];
    db.planned = [{ id: 'PL', date: todayISO(), amount: 5000, categoryId: db.categories[0].id, notes: '' }];
    save();
    [
      ['debt payment', function () { openDebtPaymentModal('DY'); }, 'mAmount', '0', 'Enter an amount'],
      ['debt settle', function () { openDebtSettleModal('DY'); }, 'mSettledOn', isoFromToday(5), 'A debt cannot be settled on a future date'],
      ['log plan', function () { openLogPlannedModal('PL'); }, 'mAmount', '0', 'Enter an amount'],
      ['contribution', function () { openContributeModal('GW'); }, 'mAmount', '0', 'Enter an amount']
    ].forEach(function (c) {
      c[1]();
      document.getElementById(c[2]).value = c[3];
      document.getElementById('editModalSave').click();
      marked(c[2], c[0]);
      said(c[4], c[0]);
      closeEditModal();
    });
    db.goals = []; db.debts = []; db.planned = []; save();
    // WORK-18: an emptied category or type select is refused, not saved as ''.
    openEditModal('actual', 'E1');
    document.getElementById('mCategory').innerHTML = '';
    document.getElementById('editModalSave').click();
    marked('mCategory', 'expense edit with no category');
    if (db.actual[0].categoryId !== cid) throw new Error('the expense was saved with category ' + JSON.stringify(db.actual[0].categoryId));
    closeEditModal();
    openEditModal('income', 'I1');
    document.getElementById('mType').innerHTML = '';
    document.getElementById('editModalSave').click();
    marked('mType', 'income edit with no type');
    if (db.income[0].typeId !== tid) throw new Error('the income was saved with type ' + JSON.stringify(db.income[0].typeId));
    closeEditModal();
    db.debts = [{ id: 'DX', name: 'Bat', principal: 100000, totalToRepay: 100000, date: todayISO(), notes: '' }]; save();
    openDebtEditModal('DX');
    document.getElementById('mDebtName').value = '';
    document.getElementById('editModalSave').click();
    marked('mDebtName', 'debt edit');
    // A half-filled schedule marks the part still empty, not a filled one.
    document.getElementById('mDebtName').value = 'Bat';
    document.getElementById('mSchedInstalment').value = '50,000';
    document.getElementById('mSchedCount').value = '2';
    document.getElementById('mSchedFirstDue').value = '';
    document.getElementById('editModalSave').click();
    marked('mSchedFirstDue', 'half-filled schedule');
    if (document.getElementById('mSchedInstalment').classList.contains('invalid')) throw new Error('the filled Instalment was marked');
    closeEditModal();
    db.debts = []; save();
    navigate('settings');
    document.getElementById('newCatName').value = '';
    document.getElementById('catAdd').click();
    marked('newCatName', 'category add');
    document.getElementById('newCatName').dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('newIncomeTypeName').value = '';
    document.getElementById('incomeTypeAdd').click();
    marked('newIncomeTypeName', 'income type add');
    document.getElementById('newIncomeTypeName').dispatchEvent(new Event('input', { bubbles: true }));
    // Sprint 1 review UI-05 / CODE-07: renaming in Settings marks the row's
    // own input, found by record id, and says what the add form says.
    function markedEl(el, what) {
      if (!el || !el.classList.contains('invalid') || el.getAttribute('aria-invalid') !== 'true') throw new Error(what + ': the name field is not marked');
      if (document.activeElement !== el) throw new Error(what + ': the name field is not focused');
    }
    var catId = db.categories[0].id, typeId = db.incomeTypes[0].id;
    document.querySelector('[data-edit-cat="' + catId + '"]').click();
    var catIn = findByDataId('input[data-edit-name]', 'editName', catId);
    catIn.value = '';
    document.querySelector('[data-save-cat="' + catId + '"]').click();
    markedEl(catIn, 'category rename');
    said('Enter a name', 'category rename');
    renderSettings();
    document.querySelector('[data-edit-itype="' + typeId + '"]').click();
    var other = db.incomeTypes.find(function (x) { return x.id !== typeId; });
    var typeIn = findByDataId('input[data-edit-iname]', 'editIname', typeId);
    typeIn.value = other.name;
    document.querySelector('[data-save-itype="' + typeId + '"]').click();
    markedEl(typeIn, 'income type rename to a taken name');
    said('Type already exists', 'income type rename');
    editingCatId = null; editingITypeId = null; renderSettings();
    navigate('dashboard');
  });
  // WORK-16: a sheet whose record another window deleted says so and saves
  // nothing, in every edit handler. The storage listener replaces db while
  // the sheet is open; removing the record from db stands in for that.
  flow('an edit of a record deleted in another window says nothing was saved', function () {
    seed();
    db.planned = [{ id: 'PG', date: todayISO(), amount: 5000, categoryId: cid, notes: '' }];
    db.goals = [{ id: 'GG', name: 'Trip', target: 100000, icon: '🎯', deadline: '', notes: '', createdDate: todayISO() }];
    db.debts = [{ id: 'DG', name: 'Bat', principal: 100000, totalToRepay: 100000, date: isoFromToday(-30), notes: '' }];
    save();
    var wrong = [];
    [
      ['income edit', function () { openEditModal('income', 'I1'); }, function () { db.income = db.income.filter(function (x) { return x.id !== 'I1'; }); }],
      ['expense edit', function () { openEditModal('actual', 'E1'); }, function () { db.actual = []; }],
      ['plan edit', function () { openEditModal('planned', 'PG'); }, function () { db.planned = []; }],
      ['log plan', function () { openLogPlannedModal('PG'); }, function () { db.planned = []; }],
      ['goal edit', function () { openGoalEditModal('GG'); }, function () { db.goals = []; }],
      ['contribution', function () { openContributeModal('GG'); }, function () { db.goals = []; }],
      ['debt edit', function () { openDebtEditModal('DG'); }, function () { db.debts = []; }],
      ['debt payment', function () { openDebtPaymentModal('DG'); }, function () { db.debts = []; }],
      ['debt settle', function () { openDebtSettleModal('DG'); }, function () { db.debts = []; }],
      ['account edit', function () { openEditAccount('A2'); }, function () { db.accounts = db.accounts.filter(function (a) { return a.id !== 'A2'; }); }]
    ].forEach(function (c) {
      seed();
      db.planned = [{ id: 'PG', date: todayISO(), amount: 5000, categoryId: cid, notes: '' }];
      db.goals = [{ id: 'GG', name: 'Trip', target: 100000, icon: '🎯', deadline: '', notes: '', createdDate: todayISO() }];
      db.debts = [{ id: 'DG', name: 'Bat', principal: 100000, totalToRepay: 100000, date: isoFromToday(-30), notes: '' }];
      db.debtPayments = []; db.goalContributions = [];
      save();
      // A dialog left open by an earlier flow must not stand in for this one.
      if (document.getElementById('confirmModal').classList.contains('show')) document.getElementById('confirmOk').click();
      c[1]();
      c[2]();
      var amt = document.getElementById('mAmount');
      if (amt) amt.value = '1,000';
      document.getElementById('editModalSave').click();
      // Sprint 2 review UI-02: in a dialog titled "Not saved", not a toast.
      var dlg = document.getElementById('confirmModal');
      var said = dlg.classList.contains('show') ? document.getElementById('confirmMessage').textContent : '(no dialog)';
      var title = document.getElementById('confirmTitle').textContent;
      if (said !== 'This entry was deleted in another window. Nothing was saved.') wrong.push(c[0] + ' said "' + said + '" (toast: "' + document.getElementById('toast').textContent + '")');
      else if (title !== 'Not saved') wrong.push(c[0] + ' titled the dialog "' + title + '"');
      else if (editCtx) wrong.push(c[0] + ' left the sheet open');
      else if (db.debtPayments.length || db.goalContributions.length || db.actual.some(function (x) { return x.amount === 1000; })) wrong.push(c[0] + ' wrote a record');
      if (editCtx) closeEditModal();
      if (document.getElementById('confirmModal').classList.contains('show')) document.getElementById('confirmOk').click();
      document.getElementById('toast').textContent = '';
    });
    db.planned = []; db.goals = []; db.debts = []; save();
    if (wrong.length) throw new Error(wrong.join('; '));
  });
  // WORK-12: moving out of an account already below zero says how far below,
  // as the account card does, not "has only ₮0".
  flow('a move out of a negative account states its balance', function () {
    seed();
    db.accounts = [{ id: 'N1', name: 'Cash', opening: 0 }, { id: 'N2', name: 'Bank', opening: 0 }];
    db.transfers = []; db.income = [];
    db.actual = [{ id: 'EN', date: todayISO(), amount: 5000, categoryId: cid, notes: '', accountId: 'N1' }];
    save(); navigate('accounts');
    document.getElementById('trFrom').value = 'N1';
    document.getElementById('trTo').value = 'N2';
    document.getElementById('trAmount').value = '1,000';
    document.getElementById('trAdd').click();
    var said = document.getElementById('toast').textContent;
    if (said !== leftPhrase('Cash', -5000)) throw new Error('the refusal said "' + said + '"');
    if (db.transfers.length) throw new Error('the move was recorded');
    document.getElementById('trAmount').value = '';
    navigate('dashboard');
  });
  // WORK-07: a repeating plan cannot be switched to Actual in the edit sheet.
  flow('a repeating plan cannot become an actual expense in the edit sheet', function () {
    seed();
    db.planned = [
      { id: 'PR', date: isoFromToday(-90), amount: 20000, categoryId: cid, notes: '', recFrequency: 'monthly' },
      { id: 'PO', date: todayISO(), amount: 5000, categoryId: cid, notes: '' }
    ];
    save();
    openEditModal('planned', 'PR');
    var act = document.querySelector('#mKindSeg [data-mkind="actual"]');
    if (!act.disabled) throw new Error('Actual is offered for a repeating plan');
    if (!/A repeating plan stays a plan\. To record a payment, use Log in Reminders/.test(document.getElementById('mKindHelp').textContent)) throw new Error('the reason is not shown');
    if (document.querySelector('#mKindHelp [aria-hidden="true"]').textContent !== '🔔') throw new Error('the bell emoji is not hidden from screen readers');
    act.click();
    if (act.classList.contains('active')) throw new Error('a disabled Actual still switched');
    closeEditModal();
    openEditModal('planned', 'PO');
    if (document.querySelector('#mKindSeg [data-mkind="actual"]').disabled) throw new Error('a one-off plan lost its switch');
    closeEditModal();
    db.planned = []; save();
  });
  // WORK-04: deleting a goal says the money paid from accounts goes back.
  flow('a goal delete names the money that goes back into each account', function () {
    seed();
    var real = window.confirmDialog, said = [];
    window.confirmDialog = function (msg) { said.push(msg); return Promise.resolve(false); };
    try {
      db.goals = [{ id: 'GD', name: 'Phone', target: 100000, icon: '📱', deadline: '', notes: '', createdDate: todayISO() }];
      db.goalContributions = [
        { id: 'C1', goalId: 'GD', date: todayISO(), amount: 60000, notes: '', accountId: 'A1' },
        { id: 'C2', goalId: 'GD', date: todayISO(), amount: 40000, notes: '' },
        { id: 'C3', goalId: 'GD', date: isoFromToday(3), amount: 5000, notes: '', accountId: 'A1' }
      ];
      save(); navigate('goals');
      document.querySelector('[data-goal-del="GD"]').click();
      if (!/The ₮60,000 paid into it from Needs \(Khan\) goes back into Needs \(Khan\)\./.test(said[0] || '')) throw new Error('the delete does not say where the money goes: ' + said[0]);
      db.goalContributions[1].accountId = 'A2'; save(); renderGoals();
      document.querySelector('[data-goal-del="GD"]').click();
      if (!/₮100,000 paid into it goes back into the accounts it came from: ₮60,000 into Needs \(Khan\), ₮40,000 into /.test(said[1] || '')) throw new Error('two accounts: ' + said[1]);
      db.goalContributions.forEach(function (c) { delete c.accountId; }); save(); renderGoals();
      document.querySelector('[data-goal-del="GD"]').click();
      if (/goes back/.test(said[2] || '')) throw new Error('no account, but the delete talks about one: ' + said[2]);
      if (db.goals.length !== 1) throw new Error('Cancel deleted the goal');
      db.goals = []; db.goalContributions = []; save();
    } finally { window.confirmDialog = real; }
  });
  // WORK-03: a resume on the 1st of the next month moves untouched entry
  // dates and every non-Custom preset to the new day, keeps a typed date and
  // a Custom range, and writes nothing.
  flow('a resume on a new day moves untouched dates and presets, and keeps typed ones', function () {
    seed(); save();
    var RealDate = window.Date, now = new RealDate();
    var next1st = new RealDate(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
    function FakeDate() {
      var a = Array.prototype.slice.call(arguments);
      return a.length ? new (Function.prototype.bind.apply(RealDate, [null].concat(a)))() : new RealDate(next1st.getTime());
    }
    FakeDate.prototype = RealDate.prototype;
    FakeDate.now = function () { return next1st.getTime(); };
    FakeDate.UTC = RealDate.UTC; FakeDate.parse = RealDate.parse;
    var vis = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    var oldDay = todayISO();
    try {
      ['expDate', 'debtDate', 'sDate'].forEach(function (id) { document.getElementById(id).value = oldDay; }); // untouched
      // An open edit sheet holding the previous day is the user's edit: left alone.
      openEditModal('actual', 'E1');
      document.getElementById('mDate').value = oldDay;
      document.getElementById('incDate').value = '2020-01-05'; // typed by the user
      var dash = document.getElementById('dashPreset'), inc = document.getElementById('incPreset');
      dash.value = 'thisMonth'; dash.dispatchEvent(new Event('change'));
      // Analytics on This Month: its calendar must follow the range (UI-01).
      var daily = document.getElementById('dailyPreset');
      daily.value = 'thisMonth'; daily.dispatchEvent(new Event('change'));
      inc.value = 'custom'; document.getElementById('incFrom').value = '2020-01-01'; document.getElementById('incTo').value = '2020-01-31';
      lastSeenDay = oldDay;
      var raw = localStorage.getItem(KEY);
      window.Date = FakeDate;
      var newDay = todayISO();
      if (newDay === oldDay || newDay.slice(8) !== '01') throw new Error('fixture: the fake clock did not move: ' + newDay);
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return 'visible'; } });
      var realBadge = window.updateBellBadge, badges = 0;
      window.updateBellBadge = function () { badges++; return realBadge.apply(this, arguments); };
      try { document.dispatchEvent(new Event('visibilitychange')); } finally { window.updateBellBadge = realBadge; }
      if (badges !== 1) throw new Error('the bell badge was refreshed ' + badges + ' times on a new day');
      ['expDate', 'debtDate', 'sDate'].forEach(function (id) {
        if (document.getElementById(id).value !== newDay) throw new Error('an untouched ' + id + ' stayed on ' + document.getElementById(id).value);
      });
      if (document.getElementById('mDate').value !== oldDay) throw new Error('the resume changed a date inside an open sheet');
      closeEditModal();
      if (document.getElementById('incDate').value !== '2020-01-05') throw new Error('a typed date was changed');
      if (document.getElementById('dashFrom').value !== newDay) throw new Error('"This Month" still starts ' + document.getElementById('dashFrom').value);
      if (document.getElementById('incFrom').value !== '2020-01-01' || inc.value !== 'custom') throw new Error('a Custom range was changed');
      if (toLocalISO(calDate) !== newDay) throw new Error('the Analytics range moved but its calendar stayed on ' + toLocalISO(calDate));
      // A range that did not move keeps the month the user stepped to.
      if (next1st.getMonth() !== 0) {
        daily.value = 'thisYear'; daily.dispatchEvent(new Event('change'));
        calDate = new RealDate(2020, 4, 1);
        lastSeenDay = '2000-01-01';
        document.dispatchEvent(new Event('visibilitychange'));
        if (calDate.getFullYear() !== 2020) throw new Error('a resume moved the calendar although This Year did not move');
      }
      lastSeenDay = newDay;
      if (localStorage.getItem(KEY) !== raw) throw new Error('the resume wrote to the store');
      // Same day again: nothing moves.
      document.getElementById('expDate').value = '2020-02-02';
      document.dispatchEvent(new Event('visibilitychange'));
      if (document.getElementById('expDate').value !== '2020-02-02') throw new Error('a same-day resume moved a date');
    } finally {
      window.Date = RealDate;
      delete document.visibilityState;
      if (vis) Object.defineProperty(Document.prototype, 'visibilityState', vis);
      lastSeenDay = todayISO();
      ['expDate', 'incDate', 'debtDate', 'sDate'].forEach(function (id) { document.getElementById(id).value = todayISO(); });
      var inc2 = document.getElementById('incPreset'); inc2.value = 'thisMonth'; inc2.dispatchEvent(new Event('change'));
      document.getElementById('dashPreset').dispatchEvent(new Event('change'));
      var d2 = document.getElementById('dailyPreset'); d2.value = 'thisMonth'; d2.dispatchEvent(new Event('change'));
    }
  });
  // WORK-02: a change of screen opens at the top; navigate(current) does not move.
  flow('a new screen opens at the top; re-rendering the same screen keeps the place', function () {
    seed();
    navigate('settings');
    window.scrollTo(0, 1500);
    if (window.scrollY < 200) throw new Error('fixture: Settings is not tall enough to scroll (' + window.scrollY + ')');
    var kept = window.scrollY;
    navigate('settings');
    if (window.scrollY !== kept) throw new Error('navigate(current) moved the page from ' + kept + ' to ' + window.scrollY);
    navigate('dashboard');
    if (window.scrollY !== 0) throw new Error('Home opened at scrollY ' + window.scrollY);
    // The limit dialog's Move hand-off is measured in navigation.js, through
    // the real dialog at full size, where history restores scroll.
    navigate('dashboard');
  });
  flow('borrowed money in an account changes no Home, income or Analytics figure', function () {
    seed();
    db.debts = [{ id: 'DL', name: 'A lender', date: todayISO(), principal: 300000, totalToRepay: 300000, notes: '' }];
    save();
    navigate('dashboard'); var home = document.getElementById('dashboard').textContent;
    navigate('daily'); var an = document.getElementById('daily').textContent;
    navigate('income'); var inc = document.getElementById('income').textContent;
    var a1 = accountBalance(db.accounts[0]);
    db.debts[0].accountId = 'A1'; save();
    if (accountBalance(db.accounts[0]) !== a1 + 300000) throw new Error('the borrowed money did not reach A1');
    navigate('dashboard'); if (document.getElementById('dashboard').textContent !== home) throw new Error('Home changed');
    navigate('daily'); if (document.getElementById('daily').textContent !== an) throw new Error('Analytics changed');
    navigate('income'); if (document.getElementById('income').textContent !== inc) throw new Error('the Income screen changed');
    if (accountUses('A1').debts !== 1) throw new Error('accountUses does not count the debt');
    // A future borrow date is not counted yet.
    db.debts[0].date = isoFromToday(3);
    if (accountBalance(db.accounts[0]) !== a1) throw new Error('a future loan was counted');
    var f = JSON.parse(JSON.stringify(db));
    f.debts[0].accountId = '';
    if (importProblem(f) === null) throw new Error('an empty debt accountId was accepted on import');
    db.debts = []; save();
  });

  flow('the add-debt form records where the money arrived, and starts on No account', function () {
    seed(); save(); navigate('debts');
    var sel = document.getElementById('debtAccount');
    if (document.getElementById('debtAcctWrap').style.display === 'none') throw new Error('Received into is hidden with accounts');
    if (sel.value !== '') throw new Error('Received into did not start on No account');
    document.getElementById('debtName').value = 'Bank';
    document.getElementById('debtPrincipal').value = '300,000';
    document.getElementById('debtTotal').value = '300,000';
    sel.value = 'A2';
    document.getElementById('debtAdd').click();
    var d = db.debts[db.debts.length - 1];
    if (!d || d.accountId !== 'A2') throw new Error('stored ' + JSON.stringify(d));
    if (document.getElementById('debtAccount').value !== '') throw new Error('the form did not reset to No account');
    document.getElementById('debtName').value = 'Family';
    document.getElementById('debtPrincipal').value = '1,000';
    document.getElementById('debtTotal').value = '1,000';
    document.getElementById('debtAdd').click();
    if ('accountId' in db.debts[db.debts.length - 1]) throw new Error('No account wrote an accountId field');
    // Without accounts, the form and the edit sheet are as before.
    db.accounts = []; db.transfers = []; db.debts.forEach(function (x) { delete x.accountId; });
    db.income.forEach(function (x) { delete x.accountId; }); db.actual.forEach(function (x) { delete x.accountId; });
    save(); renderDebts();
    if (document.getElementById('debtAcctWrap').style.display !== 'none') throw new Error('Received into shows with no accounts');
    openDebtEditModal(db.debts[0].id);
    if (document.getElementById('mAccount')) throw new Error('the edit sheet shows Received into with no accounts');
    closeEditModal();
    db.debts = []; save();
  });
} catch (e) { t.ERROR = String(e && e.message ? e.message : e); }

// Deleting is async (dialogs), so it runs last and publishes when done.
function deleteFlows() {
  var realConfirm = window.confirmDialog, realAlert = window.alertDialog;
  t.G_alerts = [];
  window.alertDialog = function (msg) { t.G_alerts.push(msg); return Promise.resolve(); };
  window.confirmDialog = function () { return Promise.resolve(true); };
  seed(); save(); navigate('accounts');
  document.querySelector('[data-del-acct="A1"]').click();
  return new Promise(function (r) { setTimeout(r, 50); }).then(function () {
    if (db.accounts.length !== 2) throw new Error('an account in use was deleted');
    // Split by kind, each naming where to find it (UI-04).
    if (!/1 income entry \(Income tab\), 1 expense \(Expenses tab\), 1 money move/.test(t.G_alerts[0] || '')) {
      throw new Error('the refusal did not split the count by kind: ' + t.G_alerts[0]);
    }
    // A debt payment alone also blocks the delete, and says where it lives.
    db.transfers = []; db.income = []; db.actual = [];
    db.debts = [{ id: 'D1', name: 'A lender', date: todayISO(), principal: 1000, totalToRepay: 1000, notes: '' }];
    db.debtPayments = [{ id: 'P1', debtId: 'D1', date: todayISO(), amount: 500, notes: '', accountId: 'A2' }];
    save(); renderAccounts();
    document.querySelector('[data-del-acct="A2"]').click();
    return new Promise(function (r) { setTimeout(r, 50); });
  }).then(function () {
    if (db.accounts.length !== 2) throw new Error('an account used by a debt payment was deleted');
    if (!/1 debt payment \(a debt's payment history\)/.test(t.G_alerts[1] || '')) throw new Error('the refusal did not name the debt payment: ' + t.G_alerts[1]);
    db.debtPayments = []; save(); renderAccounts();
    document.querySelector('[data-del-acct="A2"]').click();
    return new Promise(function (r) { setTimeout(r, 50); });
  }).then(function () {
    if (db.accounts.length !== 1 || db.accounts[0].id !== 'A1') throw new Error('an unused account was not deleted');
  }).finally(function () {
    window.confirmDialog = realConfirm; window.alertDialog = realAlert;
  });
}


// E2: both income delete paths take the split moves, and say so.
function incomeDeleteFlows() {
  var realConfirm = window.confirmDialog;
  var asked = [];
  window.confirmDialog = function (msg) { asked.push(msg); return Promise.resolve(true); };
  seed();
  db.income.push({ id: 'IS', date: todayISO(), amount: 1000000, typeId: tid, notes: '', accountId: 'A1' });
  db.transfers.push({ id: 'S2', date: todayISO(), amount: 200000, fromId: 'A1', toId: 'A2', notes: '', incomeId: 'IS' });
  save(); navigate('income');
  document.querySelector('[data-del-inc="IS"]').click();
  return new Promise(function (r) { setTimeout(r, 50); }).then(function () {
    if (db.transfers.some(function (m) { return m.incomeId === 'IS'; })) throw new Error('row delete left the split move');
    if (!db.transfers.some(function (m) { return m.id === 'T1'; })) throw new Error('row delete took an unrelated move');
    if (!/1 money move it was split into is deleted too/.test(asked[0] || '')) throw new Error('row confirm: ' + asked[0]);
    db.income.push({ id: 'IT', date: todayISO(), amount: 5000, typeId: tid, notes: '', accountId: 'A1' });
    db.transfers.push({ id: 'S3', date: todayISO(), amount: 1000, fromId: 'A1', toId: 'A2', notes: '', incomeId: 'IT' });
    save(); navigate('settings');
    var btn = document.querySelector('#dataSummary [aria-label="Clear all Income entries"]');
    if (!btn) throw new Error('setup failed: no Clear button on income');
    btn.click();
    return new Promise(function (r) { setTimeout(r, 50); });
  }).then(function () {
    if (db.income.length) throw new Error('income was not cleared');
    if (db.transfers.some(function (m) { return m.incomeId; })) throw new Error('Clear income left split moves');
    if (!db.transfers.some(function (m) { return m.id === 'T1'; })) throw new Error('Clear income took a hand-made move');
    if (!/split from income is deleted too/.test(asked[1] || '')) throw new Error('clear confirm: ' + asked[1]);
  }).finally(function () { window.confirmDialog = realConfirm; });
}

// The dialog paths. Each answer is stubbed, then what was saved is read.
function limitFlows() {
  var real = window.choiceDialog;
  var asked = [];
  function answer(a) {
    window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve(a); };
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  seed();
  db.accounts.push({ id: 'A3', name: 'Hobby', opening: 35000 });
  save(); setExpMode('actual'); navigate('expenses');
  var n = db.actual.length;
  function spend() {
    document.getElementById('expAccount').value = 'A3';
    document.getElementById('expAmount').value = '45,000';
    document.getElementById('expAdd').click();
  }
  answer('cancel'); spend();
  return tick().then(function () {
    if (db.actual.length !== n) throw new Error('Cancel still saved the expense');
    var q = asked[0];
    if (!q || !/Hobby has .*35,000 left\. This costs .*45,000 — .*10,000 short\./.test(q.msg)) throw new Error('dialog text: ' + (q && q.msg));
    if (!q.opts.okLabel || !/Move .*10,000/.test(q.opts.okLabel)) throw new Error('the form did not offer the move: ' + q.opts.okLabel);
    answer('ok'); spend();
    return tick();
  }).then(function () {
    if (db.actual.length !== n) throw new Error('Move saved the expense');
    if (!document.getElementById('accounts').classList.contains('active')) throw new Error('Move did not open Accounts');
    if (document.getElementById('trTo').value !== 'A3' || document.getElementById('trFrom').value !== 'A1') throw new Error('Move was not prefilled to/from');
    if (unmoney(document.getElementById('trAmount').value) !== 10000) throw new Error('Move amount is ' + document.getElementById('trAmount').value);
    if (unmoney(document.getElementById('expAmount').value) !== 45000) throw new Error('the expense form lost what was typed');
    navigate('expenses');
    answer('alt'); spend();
    return tick();
  }).then(function () {
    if (db.actual.length !== n + 1) throw new Error('Record anyway did not save');
    if (accountBalance(db.accounts[2]) !== -10000) throw new Error('Hobby should read -10,000');
    // The payment sheet names the move in words and offers no navigation (E6).
    db.debts = [{ id: 'D1', name: 'A lender', date: todayISO(), principal: 300000, totalToRepay: 300000, notes: '' }];
    save();
    answer('cancel');
    openDebtPaymentModal('D1');
    document.getElementById('mAccount').value = 'A3';
    document.getElementById('mAmount').value = '5,000';
    var before = db.debtPayments.length;
    document.getElementById('editModalSave').click();
    return tick().then(function () { return before; });
  }).then(function (before) {
    var q = asked[asked.length - 1];
    if (db.debtPayments.length !== before) throw new Error('a payment the account cannot cover was saved on Cancel');
    if (q.opts.okLabel) throw new Error('the payment sheet offered a navigating Move');
    if (!/Move .* from Needs \(Khan\) first/.test(q.msg)) throw new Error('the payment sheet did not name the move: ' + q.msg);
    closeEditModal();
  }).finally(function () { window.choiceDialog = real; });
}

// E8: the third button never leaks into the other two dialogs.
function choiceCleanupFlow() {
  var p = choiceDialog('x', { okLabel: 'Go', altLabel: 'Other' });
  var alt = document.getElementById('confirmAlt');
  if (alt.style.display === 'none') return Promise.reject(new Error('choiceDialog did not show its link'));
  document.getElementById('confirmModal').click();   // the backdrop
  return p.then(function (r) {
    if (r !== 'cancel') throw new Error('the backdrop resolved ' + r);
    if (alt.style.display !== 'none') throw new Error('the link stayed visible after the dialog closed');
    var c = confirmDialog('y');
    if (alt.style.display !== 'none') throw new Error('confirmDialog shows the choice link');
    document.getElementById('confirmCancel').click();
    return c;
  }).then(function () {
    var a = alertDialog('z');
    if (alt.style.display !== 'none') throw new Error('alertDialog shows the choice link');
    if (document.getElementById('confirmOk').style.display === 'none') throw new Error('alertDialog lost its OK button');
    document.getElementById('confirmOk').click();
    return a;
  });
}

// UI-01, UI-02 / CODE-01: a partial donor is never over-asked, and a move
// started from the dialog returns to the unsaved expense.
// Sprint 1 review CODE-08: the WORK-04 sentence says the money "goes back
// into" the account. The delete is run, and the balance rises by exactly that.
function goalDeleteBalanceFlow() {
  var real = window.confirmDialog, said = [];
  window.confirmDialog = function (msg) { said.push(msg); return Promise.resolve(true); };
  seed();
  db.goals = [{ id: 'GB', name: 'Phone', target: 100000, icon: '📱', deadline: '', notes: '', createdDate: todayISO() }];
  db.goalContributions = [
    { id: 'B1', goalId: 'GB', date: todayISO(), amount: 60000, notes: '', accountId: 'A1' },
    { id: 'B2', goalId: 'GB', date: isoFromToday(3), amount: 5000, notes: '', accountId: 'A1' }
  ];
  save(); navigate('goals');
  var before = accountBalance(db.accounts[0]);
  document.querySelector('[data-goal-del="GB"]').click();
  return new Promise(function (r) { setTimeout(r, 30); }).then(function () {
    if (!/The ₮60,000 paid into it from Needs \(Khan\) goes back into Needs \(Khan\)/.test(said[0] || '')) throw new Error('sentence: ' + said[0]);
    if (db.goals.length || db.goalContributions.length) throw new Error('the goal was not deleted');
    var after = accountBalance(db.accounts[0]);
    if (after - before !== 60000) throw new Error('the sentence said ₮60,000 goes back; the balance moved by ' + (after - before));
    navigate('dashboard');
  }).finally(function () { window.confirmDialog = real; });
}

function moveReturnFlow() {
  var real = window.choiceDialog, asked = [];
  window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve('ok'); };
  seed();
  db.accounts = [
    { id: 'A1', name: 'Needs', opening: 30000 },
    { id: 'A3', name: 'Hobby', opening: 10000 }
  ];
  db.transfers = []; db.income = []; db.actual = [];
  save(); setExpMode('actual'); navigate('expenses');
  document.getElementById('expAccount').value = 'A3';
  // WORK-01: a category that is not the first one, and no actual expense to
  // make A3 the "last used" account, so only a kept choice can survive.
  var cat2 = db.categories[1].id;
  document.getElementById('expCategory').value = cat2;
  document.getElementById('expAmount').value = '100,000';
  document.getElementById('expAdd').click();
  return new Promise(function (r) { setTimeout(r, 30); }).then(function () {
    var q = asked[0];
    if (!/Move .*30,000/.test(q.opts.okLabel)) throw new Error('offered ' + q.opts.okLabel + ' from a donor holding 30,000');
    if (!/Needs, your fullest account, can cover .*30,000 of it/.test(q.msg)) throw new Error('the partial cover was not stated: ' + q.msg);
    if (unmoney(document.getElementById('trAmount').value) !== 30000) throw new Error('prefilled ' + document.getElementById('trAmount').value);
    document.getElementById('trAdd').click();
    if (db.transfers.length !== 1) throw new Error('the suggested move was refused');
    if (!document.getElementById('expenses').classList.contains('active')) throw new Error('the move did not return to the unsaved expense');
    if (db.actual.length !== 0) throw new Error('the expense was saved without the user');
    if (unmoney(document.getElementById('expAmount').value) !== 100000) throw new Error('the expense form lost its amount');
    if (document.getElementById('expCategory').value !== cat2) throw new Error('the expense form lost its category: ' + document.getElementById('expCategory').value);
    if (document.getElementById('expAccount').value !== 'A3') throw new Error('the expense form lost its account: "' + document.getElementById('expAccount').value + '"');
    // The Actual/Planned toggle keeps the category too, and Income its type.
    setExpMode('planned'); setExpMode('actual');
    if (document.getElementById('expCategory').value !== cat2) throw new Error('the mode toggle lost the category');
    navigate('income');
    var type2 = db.incomeTypes[1].id;
    document.getElementById('incType').value = type2;
    document.getElementById('incAccount').value = 'A3';
    renderIncome();
    if (document.getElementById('incType').value !== type2 || document.getElementById('incAccount').value !== 'A3') throw new Error('the income form lost its type or account');
    navigate('expenses');
    // A later, unrelated move stays on Accounts.
    navigate('accounts');
    document.getElementById('trFrom').value = 'A3';
    document.getElementById('trTo').value = 'A1';
    document.getElementById('trAmount').value = '1,000';
    document.getElementById('trAdd').click();
    if (!document.getElementById('accounts').classList.contains('active')) throw new Error('an ordinary move jumped to Expenses');
    document.getElementById('expAmount').value = '';
  }).finally(function () { window.choiceDialog = real; });
}

// The two-modal close, with REAL clicks: Record anyway over the edit sheet
// closes the dialog and then the sheet. The contract is the user's: after
// that, Back still works. Two history.back() calls in one task are one
// traversal in Chrome, which once left expectedPops one too high, so the next
// real Back press was swallowed and a newly opened sheet stayed open.
function stackedCloseFlow() {
  seed();
  db.accounts.push({ id: 'A3', name: 'Hobby', opening: 0 });
  save(); navigate('expenses');
  openEditModal('actual', 'E1');
  document.getElementById('mAccount').value = 'A3';
  document.getElementById('editModalSave').click();
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  return wait(50).then(function () {
    var alt = document.getElementById('confirmAlt');
    if (alt.style.display === 'none') throw new Error('setup failed: the limit dialog did not open');
    if (modalStack.length !== 2) throw new Error('setup failed: expected 2 stacked modals, got ' + modalStack.length);
    alt.click();
    return wait(400);
  }).then(function () {
    if (modalStack.length) throw new Error(modalStack.length + ' modal(s) still open');
    if (db.actual.find(function (x) { return x.id === 'E1'; }).accountId !== 'A3') throw new Error('Record anyway did not save the edit');
    t.M_expectedPops = expectedPops;
    if (expectedPops !== 0) throw new Error('expectedPops is ' + expectedPops + ' — the next Back press would be swallowed');
    openEditModal('actual', 'E1');
    history.back();   // the user's Back
    return wait(400);
  }).then(function () {
    if (modalStack.length) throw new Error('Back did not close a sheet opened after the stacked close');
  });
}

// CODE-02 (owner's ruling 2026-10-09): the limit also guards undoing a move
// whose money was spent, and a future expense brought to today.
function isoFromToday(days) {
  var d = new Date(); d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function moveDeleteFlow() {
  var realConfirm = window.confirmDialog, realAlert = window.alertDialog;
  var alerts = [], confirms = 0;
  window.alertDialog = function (msg) { alerts.push(msg); return Promise.resolve(); };
  window.confirmDialog = function () { confirms++; return Promise.resolve(true); };
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  seed();   // T1 moved 30,000 into A2 Debt payoff
  db.actual.push({ id: 'ES', date: todayISO(), amount: 20000, categoryId: cid, notes: '', accountId: 'A2' });
  db.transfers.push({ id: 'TF', date: isoFromToday(3), amount: 50000, fromId: 'A1', toId: 'A2', notes: '' });
  save(); navigate('accounts');
  document.querySelector('[data-del-tr="T1"]').click();
  return tick().then(function () {
    if (!db.transfers.some(function (m) { return m.id === 'T1'; })) throw new Error('a move whose money was spent was deleted');
    if (confirms) throw new Error('the delete asked to confirm before refusing');
    if (!/Debt payoff has only .*10,000 left/.test(alerts[0] || '')) throw new Error('refusal text: ' + alerts[0]);
    // A future-dated move is not counted yet, so undoing it is free.
    document.querySelector('[data-del-tr="TF"]').click();
    return tick();
  }).then(function () {
    if (db.transfers.some(function (m) { return m.id === 'TF'; })) throw new Error('a future-dated move could not be deleted');
    // Once the spending is gone, the move can be undone.
    db.actual = db.actual.filter(function (x) { return x.id !== 'ES'; });
    save(); renderAccounts();
    document.querySelector('[data-del-tr="T1"]').click();
    return tick();
  }).then(function () {
    if (db.transfers.some(function (m) { return m.id === 'T1'; })) throw new Error('an unspent move could not be deleted');
    if (alerts.length !== 1) throw new Error(alerts.length + ' refusals, expected 1');
  }).finally(function () { window.confirmDialog = realConfirm; window.alertDialog = realAlert; });
}

function redateFlow() {
  var real = window.choiceDialog, calls = 0;
  window.choiceDialog = function () { calls++; return Promise.resolve('cancel'); };
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  seed();
  db.accounts.push({ id: 'A3', name: 'Hobby', opening: 10000 });
  db.actual.push({ id: 'EF', date: isoFromToday(2), amount: 45000, categoryId: cid, notes: '', accountId: 'A3' });
  save(); navigate('expenses');
  var later = isoFromToday(5);
  openEditModal('actual', 'EF');
  document.getElementById('mDate').value = later;
  document.getElementById('editModalSave').click();
  return tick().then(function () {
    if (calls) throw new Error('moving a future expense to another future date opened the limit');
    var ef = db.actual.find(function (x) { return x.id === 'EF'; });
    if (ef.date !== later) throw new Error('the future-to-future edit was not saved');
    openEditModal('actual', 'EF');
    document.getElementById('mDate').value = todayISO();
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    if (calls !== 1) throw new Error('bringing a future expense to today did not open the limit');
    if (db.actual.find(function (x) { return x.id === 'EF'; }).date !== later) throw new Error('Cancel still redated the expense');
    closeEditModal();
  }).finally(function () { window.choiceDialog = real; });
}

// R1 (phase 2 rest): an income change that leaves an account short.
function incomeShortFlow() {
  var realChoice = window.choiceDialog, realConfirm = window.confirmDialog, realAlert = window.alertDialog;
  var asked = [], confirms = 0, answer = 'cancel', alerts = [];
  window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve(answer); };
  window.alertDialog = function (msg) { alerts.push(msg); return Promise.resolve(); };
  window.confirmDialog = function () { confirms++; return Promise.resolve(true); };
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  db.accounts = [
    { id: 'A1', name: 'Needs', opening: 0 },
    { id: 'A2', name: 'Hobby', opening: 0 }
  ];
  db.transfers = [{ id: 'S1', date: todayISO(), amount: 200000, fromId: 'A1', toId: 'A2', notes: 'Split of income', incomeId: 'IS' }];
  db.income = [
    { id: 'IS', date: todayISO(), amount: 1000000, typeId: tid, notes: '', accountId: 'A1' },
    { id: 'IC', date: todayISO(), amount: 5000, typeId: tid, notes: '', accountId: 'A1' }
  ];
  db.actual = [
    { id: 'EN', date: todayISO(), amount: 801000, categoryId: cid, notes: '', accountId: 'A1' },   // Needs: 4,000 left
    { id: 'EH', date: todayISO(), amount: 150000, categoryId: cid, notes: '', accountId: 'A2' }
  ];
  db.planned = []; db.debts = []; db.debtPayments = [];
  save(); navigate('income');
  // 1. Moving an unsplit income to Hobby strands Needs' spending: refused,
  // no dialog. (A split income is already held by E3.)
  openEditModal('income', 'IC');
  document.getElementById('mAccount').value = 'A2';
  document.getElementById('editModalSave').click();
  return tick().then(function () {
    if (db.income.find(function (x) { return x.id === 'IC'; }).accountId !== 'A1') throw new Error('an account change that strands spending was saved');
    if (asked.length) throw new Error('the account change asked instead of refusing');
    if (!/Needs has only .*4,000 left, so this income can't move out of it/.test(alerts[0] || '')) throw new Error('refusal: ' + alerts[0]);
    closeEditModal();
    // 2. Moving its date past today takes from Needs AND the split target.
    openEditModal('income', 'IS');
    document.getElementById('mDate').value = isoFromToday(4);
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    var q = asked[0];
    if (!q || !/the Hobby account below zero, at -₮150,000/.test(q.msg) || !/the Needs account below zero/.test(q.msg)) throw new Error('the date warning did not name both accounts: ' + (q && q.msg));
    if (db.income.find(function (x) { return x.id === 'IS'; }).date !== todayISO()) throw new Error('Cancel still moved the date');
    if (db.transfers[0].date !== todayISO()) throw new Error('Cancel still moved the split');
    // 2b. Lowering the amount is warned too (R1.3).
    document.getElementById('mDate').value = todayISO();
    document.getElementById('mAmount').value = '900,000';
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    if (asked.length !== 2 || !/the Needs account below zero/.test(asked[1].msg)) throw new Error('a lower amount was not warned');
    if (db.income.find(function (x) { return x.id === 'IS'; }).amount !== 1000000) throw new Error('Cancel still lowered the amount');
    // 2c. Another window writes while the dialog is open: nothing is saved
    // to the detached record, and the user is told (CODE-01).
    window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); refreshFromStorage(); return Promise.resolve('alt'); };
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve(answer); };
    if (!/nothing was saved/.test(alerts[alerts.length - 1] || '')) throw new Error('a save lost to another window was not reported: ' + alerts[alerts.length - 1]);
    if (db.income.find(function (x) { return x.id === 'IS'; }).amount !== 1000000) throw new Error('the stale edit landed');
    if (!document.getElementById('editModal').classList.contains('show')) throw new Error('the sheet closed over a lost save');
    closeEditModal();
    asked.length = 1;
    // 3. Deleting it: one dialog, Cancel keeps it, Delete anyway deletes.
    document.querySelector('[data-del-inc="IS"]').click();
    return tick();
  }).then(function () {
    if (asked.length !== 2 || confirms) throw new Error('delete showed ' + (asked.length - 1) + ' choice and ' + confirms + ' confirm dialogs');
    if (!/1 money move it was split into/.test(asked[1].msg) || !/comes back out of Needs and the accounts it was split into/.test(asked[1].msg) || !/Delete anyway/.test(asked[1].opts.altLabel)) throw new Error('delete dialog: ' + asked[1].msg + ' / ' + asked[1].opts.altLabel);
    if (!asked[1].opts.altDanger) throw new Error('the delete link is not marked as a delete');
    if (!db.income.some(function (x) { return x.id === 'IS'; })) throw new Error('Cancel still deleted');
    answer = 'alt';
    document.querySelector('[data-del-inc="IS"]').click();
    return tick();
  }).then(function () {
    if (db.income.some(function (x) { return x.id === 'IS'; }) || db.transfers.length) throw new Error('Delete anyway did not delete the income and its move');
    // 4. An income nothing depends on deletes through the plain confirm.
    db.actual = []; save(); renderIncome();
    var before = asked.length;
    document.querySelector('[data-del-inc="IC"]').click();
    return tick().then(function () { return before; });
  }).then(function (before) {
    if (asked.length !== before) throw new Error('a clean delete opened the shortfall dialog');
    if (confirms !== 1 || db.income.length) throw new Error('a clean delete did not go through its confirm');
  }).finally(function () { window.choiceDialog = realChoice; window.confirmDialog = realConfirm; window.alertDialog = realAlert; });
}

// R2 (phase 2 rest): logging a plan is spending from an account.
function logPlanFlow() {
  var real = window.choiceDialog, asked = [];
  window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve('cancel'); };
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  function bellRow() { openNotifModal(); return document.getElementById('notifBody'); }
  seed();   // E1 is the last actual, paid from A1
  db.planned = [{ id: 'PL', date: todayISO(), amount: 45000, categoryId: cid, notes: 'Rent' }];
  save();
  var body = bellRow();
  if (body.querySelector('[data-convert-planned="PL"]')) throw new Error('with accounts the bell still logs blind');
  var btns = body.querySelectorAll('[data-edit-planned="PL"]');
  if (btns.length !== 1 || !/Log .*45,000/.test(btns[0].textContent)) throw new Error('expected one "Log" button opening the sheet, got ' + btns.length);
  btns[0].click();
  var sel = document.getElementById('mAccount');
  if (!sel || sel.value !== 'A1') throw new Error('the log sheet did not start on the last-used account: ' + (sel && sel.value));
  // A2 holds 30,000: the limit stops it, with no navigating Move.
  sel.value = 'A2';
  var n = db.actual.length;
  document.getElementById('editModalSave').click();
  return tick().then(function () {
    if (db.actual.length !== n) throw new Error('Cancel on the limit still logged the plan');
    if (!asked.length || asked[0].opts.okLabel) throw new Error('the log sheet did not run the limit without Move');
    document.getElementById('mAccount').value = 'A1';
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    var e = db.actual[db.actual.length - 1];
    if (db.actual.length !== n + 1 || e.accountId !== 'A1' || e.amount !== 45000 || e.date !== todayISO()) throw new Error('logged ' + JSON.stringify(e));
    if (db.planned[0].recLastDone !== todayISO()) throw new Error('the plan was not marked done');
    if ('accountId' in db.planned[0]) throw new Error('the plan took an account');
    // UI-05: the save started in the bell, so the bell is back, on top of
    // its own history entry: Back closes it and nothing else.
    var bell = document.getElementById('notifModal');
    if (!bell.classList.contains('show') || modalStack.length !== 1) throw new Error('the bell did not come back after a save that started there');
    if (!history.state || !history.state.appModal) throw new Error('the bell came back without its history entry');
    history.back();
    return tick();
  }).then(function () {
    if (document.getElementById('notifModal').classList.contains('show') || modalStack.length) throw new Error('Back did not close the returned bell');
    if (history.state && history.state.appModal) throw new Error('a dead modal entry is left under the screen');
    // Cancel is not a save: the bell stays shut.
    db.planned = [{ id: 'PC', date: todayISO(), amount: 1000, categoryId: cid, notes: '' }]; save();
    bellRow().querySelector('[data-edit-planned="PC"]').click();
    closeEditModal();
    return tick();
  }).then(function () {
    if (document.getElementById('notifModal').classList.contains('show') || modalStack.length) throw new Error('Cancel on a sheet from the bell reopened the bell');
    // No accounts: both buttons, and one-tap writes no account field.
    db.accounts = []; db.transfers = []; db.actual.forEach(function (x) { delete x.accountId; }); db.income.forEach(function (x) { delete x.accountId; });
    db.planned = [{ id: 'PN', date: todayISO(), amount: 9000, categoryId: cid, notes: '' }];
    save();
    var b2 = bellRow();
    if (!b2.querySelector('[data-convert-planned="PN"]') || !b2.querySelector('[data-edit-planned="PN"]')) throw new Error('without accounts the bell row changed');
    b2.querySelector('[data-convert-planned="PN"]').click();
    var last = db.actual[db.actual.length - 1];
    if (last.amount !== 9000 || 'accountId' in last) throw new Error('one-tap without accounts wrote ' + JSON.stringify(last));
    closeModal(document.getElementById('notifModal'));
    db.planned = [{ id: 'PM', date: todayISO(), amount: 9000, categoryId: cid, notes: '' }]; save();
    openLogPlannedModal('PM');
    if (document.getElementById('mAccount')) throw new Error('without accounts the log sheet shows Paid from');
    closeEditModal();
    return tick();
  }).finally(function () { window.choiceDialog = real; });
}

// R3 (phase 2 rest): a goal contribution can be paid from an account.
function goalFlow() {
  var real = window.choiceDialog, asked = [];
  window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve('cancel'); };
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  function goal(id) {
    return { id: id, name: 'Trip ' + id, target: 1000000, icon: '🎯', deadline: '', notes: '', createdDate: todayISO(),
      recFrequency: 'monthly', recAmount: 25000, recStartDate: todayISO(), recIntervalDays: null, recLastLogged: null };
  }
  seed();
  db.goals = [goal('G1')]; db.goalContributions = [];
  save();
  var a1 = accountBalance(db.accounts[0]);
  openContributeModal('G1');
  var sel = document.getElementById('mAccount');
  if (!sel || sel.value !== '') throw new Error('the contribution sheet should start on No account, got ' + (sel && sel.value));
  if (!/Pick the account you took this money out of/.test(document.getElementById('editModalBody').textContent)) throw new Error('the helper is missing');
  sel.value = 'A2';   // holds 30,000
  document.getElementById('mAmount').value = '45,000';
  document.getElementById('editModalSave').click();
  return tick().then(function () {
    if (db.goalContributions.length) throw new Error('Cancel on the limit still added the contribution');
    if (!asked.length || asked[0].opts.okLabel) throw new Error('the contribution sheet did not run the limit without Move');
    document.getElementById('mAccount').value = 'A1';
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    var c = db.goalContributions[0];
    if (!c || c.accountId !== 'A1') throw new Error('stored ' + JSON.stringify(c));
    if (accountBalance(db.accounts[0]) !== a1 - 45000) throw new Error('A1 did not lose the contribution');
    if (accountUses('A1').goalContributions !== 1) throw new Error('accountUses does not count it');
    openGoalHistoryModal('G1');
    if (document.getElementById('editModalBody').textContent.indexOf('Needs (Khan)') < 0) throw new Error('the history does not name the account');
    closeEditModal();
    // The bell: one button, opening the sheet prefilled like the one tap.
    db.goalContributions = []; db.goals = [goal('G1')]; save();
    openNotifModal();
    var body = document.getElementById('notifBody');
    if (body.querySelector('[data-log-goalrec]') || body.querySelector('[data-goal-add]')) throw new Error('with accounts the bell still adds blind or offers Custom amount');
    body.querySelector('[data-goal-add-rec="G1"]').click();
    document.getElementById('mAccount').value = 'A1';
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    var viaSheet = db.goalContributions[0], g1 = db.goals[0];
    if (!document.getElementById('notifModal').classList.contains('show') || modalStack.length !== 1) throw new Error('the bell did not come back after a contribution that started there');
    closeModal(document.getElementById('notifModal'));
    // The same goal, one-tap, with no accounts: what the sheet must match.
    db.accounts = []; db.transfers = [];
    db.income.forEach(function (x) { delete x.accountId; }); db.actual.forEach(function (x) { delete x.accountId; });
    db.goalContributions = []; db.goals = [goal('G1')]; save();
    openNotifModal();
    var body = document.getElementById('notifBody');
    if (!body.querySelector('[data-log-goalrec="G1"]') || !body.querySelector('[data-goal-add="G1"]')) throw new Error('without accounts the bell row changed');
    body.querySelector('[data-log-goalrec="G1"]').click();
    var viaTap = db.goalContributions[0];
    closeModal(document.getElementById('notifModal'));
    ['goalId', 'date', 'amount', 'notes'].forEach(function (k) {
      if (viaSheet[k] !== viaTap[k]) throw new Error('the prefilled sheet wrote ' + k + '=' + viaSheet[k] + ', one tap writes ' + viaTap[k]);
    });
    if (viaSheet.accountId !== 'A1' || 'accountId' in viaTap) throw new Error('account fields wrong');
    if (g1.recLastLogged !== db.goals[0].recLastLogged || !g1.recLastLogged) throw new Error('recLastLogged ' + g1.recLastLogged + ' vs ' + db.goals[0].recLastLogged);
    openContributeModal('G1');
    if (document.getElementById('mAccount')) throw new Error('without accounts the sheet shows Paid from');
    closeEditModal();
    db.goals = []; db.goalContributions = []; save();
    return tick();
  }).finally(function () { window.choiceDialog = real; });
}

// R4 (phase 2 rest): correcting or deleting a debt whose money was spent.
function loanEditFlow() {
  var realChoice = window.choiceDialog, realConfirm = window.confirmDialog, realAlert = window.alertDialog;
  var asked = [], confirms = 0, answer = 'cancel', alerts = [];
  window.alertDialog = function (msg) { alerts.push(msg); return Promise.resolve(); };
  window.choiceDialog = function (msg, opts) { asked.push({ msg: msg, opts: opts }); return Promise.resolve(answer); };
  window.confirmDialog = function () { confirms++; return Promise.resolve(true); };
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  seed();   // A2 Debt payoff holds 30,000
  db.debts = [
    { id: 'DL', name: 'Bank', date: todayISO(), principal: 300000, totalToRepay: 300000, notes: '', accountId: 'A2' },
    { id: 'DC', name: 'Family', date: todayISO(), principal: 5000, totalToRepay: 5000, notes: '', accountId: 'A1' }
  ];
  db.actual.push({ id: 'ES', date: todayISO(), amount: 320000, categoryId: cid, notes: '', accountId: 'A2' });   // A2: 10,000 left
  save(); navigate('debts');
  // 1. Moving the arrival to another account strands A2's spending: refused.
  openDebtEditModal('DL');
  var sel = document.getElementById('mAccount');
  if (!sel || sel.value !== 'A2') throw new Error('the edit sheet does not show Received into');
  sel.value = 'A1';
  document.getElementById('editModalSave').click();
  return tick().then(function () {
    if (db.debts[0].accountId !== 'A2') throw new Error('an arrival move that strands spending was saved');
    if (asked.length) throw new Error('the account change asked instead of refusing');
    // 2. Lowering the principal is warned; Cancel keeps it.
    document.getElementById('mAccount').value = 'A2';
    document.getElementById('mDebtPrincipal').value = '200,000';
    document.getElementById('mDebtTotal').value = '200,000';
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    if (!/Debt payoff has only .*10,000 left, so this money can't move/.test(alerts[0] || '')) throw new Error('refusal: ' + alerts[0]);
    if (!asked[0] || !/the Debt payoff account below zero, at -₮90,000/.test(asked[0].msg) || !/Save anyway/.test(asked[0].opts.altLabel)) throw new Error('principal warning: ' + (asked[0] && asked[0].msg));
    if (db.debts[0].principal !== 300000) throw new Error('Cancel still lowered the principal');
    // A borrow date moved past today is warned too (R4.4).
    document.getElementById('mDebtPrincipal').value = '300,000';
    document.getElementById('mDebtTotal').value = '300,000';
    document.getElementById('mDebtDate').value = isoFromToday(5);
    document.getElementById('editModalSave').click();
    return tick();
  }).then(function () {
    if (asked.length !== 2 || !/the Debt payoff account below zero/.test(asked[1].msg)) throw new Error('a later borrow date was not warned');
    if (db.debts[0].date !== todayISO()) throw new Error('Cancel still moved the borrow date');
    closeEditModal();
    asked.length = 1;
    // 3. Deleting it: one dialog with the shortfall, Delete anyway deletes.
    document.querySelector('[data-debt-del="DL"]').click();
    return tick();
  }).then(function () {
    if (asked.length !== 2 || confirms) throw new Error('delete showed ' + (asked.length - 1) + ' choice and ' + confirms + ' confirm dialogs');
    if (!/Delete anyway/.test(asked[1].opts.altLabel) || !db.debts.some(function (x) { return x.id === 'DL'; })) throw new Error('the delete warning was wrong or Cancel deleted');
    if (!/The ₮300,000 borrowed comes back out of Debt payoff/.test(asked[1].msg)) throw new Error('the debt delete does not say why: ' + asked[1].msg);
    answer = 'alt';
    document.querySelector('[data-debt-del="DL"]').click();
    return tick();
  }).then(function () {
    if (db.debts.some(function (x) { return x.id === 'DL'; })) throw new Error('Delete anyway did not delete');
    // 4. A debt nothing depends on deletes through the plain confirm.
    var before = asked.length;
    document.querySelector('[data-debt-del="DC"]').click();
    return tick().then(function () { return before; });
  }).then(function (before) {
    if (asked.length !== before || confirms !== 1 || db.debts.length) throw new Error('a clean debt delete did not go through its confirm');
  }).finally(function () { window.choiceDialog = realChoice; window.confirmDialog = realConfirm; window.alertDialog = realAlert; });
}

// WORK-11: Reset names accounts and money moves, and the settings kept
// under keys of their own go with it. Runs last: it erases everything.
function resetFlow() {
  var realConfirm = window.confirmDialog, asked = [];
  window.confirmDialog = function (msg) { asked.push(msg); return Promise.resolve(true); };
  var sideKeys = [DISPLAY_CURRENCY_KEY, FILTER_STATE_KEY, 'conv-last-from', 'conv-last-to'];
  sideKeys.forEach(function (k) { localStorage.setItem(k, k === FILTER_STATE_KEY ? '{}' : 'USD'); });
  localStorage.setItem('not-this-apps-key', 'keep');
  seed(); save();
  document.getElementById('btnReset').click();
  return new Promise(function (r) { setTimeout(r, 50); }).then(function () {
    if (!/accounts and money moves/.test(asked[0] || '')) throw new Error('the confirm does not name accounts and money moves: ' + asked[0]);
    var left = sideKeys.filter(function (k) { return localStorage.getItem(k) !== null; });
    if (left.length) throw new Error('Reset left settings behind: ' + left.join(', '));
    if (localStorage.getItem('not-this-apps-key') !== 'keep') throw new Error('Reset removed a key that is not its own');
    if (db.accounts.length || db.transfers.length) throw new Error('setup failed: Reset did not erase the records');
  }).finally(function () { window.confirmDialog = realConfirm; localStorage.removeItem('not-this-apps-key'); });
}

// Sprint 2 review CODE-01: the log sheet logs the occurrence it showed or
// nothing. Another window logs it first; the storage listener replaces db
// while the sheet is open; Save must not log the next occurrence instead.
// Async, with a wait after each case, so each modal's deferred history step
// lands before the next opens: the sync flows above leave every one pending,
// and Chrome keeps only about fifty history entries per tab.
function logMovedFlow() {
  var wrong = [];
  function wait() { return new Promise(function (r) { setTimeout(r, 50); }); }
  function run(c) {
    seed();
    db.planned = [c[1]];
    db.actual = [];
    save();
    openLogPlannedModal('PW');
    // The other window logs today's occurrence and writes the store.
    var other = JSON.parse(localStorage.getItem(KEY));
    other.planned[0].recLastDone = todayISO();
    other.actual.push({ id: 'OW', date: todayISO(), amount: 5000, categoryId: cid, notes: 'other window' });
    localStorage.setItem(KEY, JSON.stringify(other));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, storageArea: localStorage }));
    if (db.actual.length !== 1) { wrong.push(c[0] + ': setup failed, the other window\'s write did not arrive'); return wait(); }
    document.getElementById('editModalSave').click();
    return wait().then(function () {
      var dlg = document.getElementById('confirmModal').classList.contains('show');
      var said = dlg ? document.getElementById('confirmMessage').textContent : '(no dialog)';
      if (db.actual.length !== 1) wrong.push(c[0] + ': logged again, ' + db.actual.length + ' expenses');
      if (db.planned[0].recLastDone !== todayISO()) wrong.push(c[0] + ': moved recLastDone to ' + db.planned[0].recLastDone);
      if (said !== 'This plan was logged or changed in another window. Nothing was saved.') wrong.push(c[0] + ': said "' + said + '"');
      if (editCtx) closeEditModal();
      if (dlg) document.getElementById('confirmOk').click();
      return wait();
    });
  }
  return wait()
    .then(function () { return run(['recurring', { id: 'PW', date: todayISO(), amount: 5000, categoryId: cid, notes: '', recFrequency: 'weekly' }]); })
    .then(function () { return run(['one-off', { id: 'PW', date: todayISO(), amount: 5000, categoryId: cid, notes: '' }]); })
    .then(function () {
      db.planned = []; db.actual = []; save();
      if (wrong.length) throw new Error(wrong.join('; '));
    });
}

function asyncFlow(name, fn) {
  return function () {
    return Promise.resolve().then(fn).then(
      function () { t.flows.push(name + ': ok'); },
      function (e) { t.flows.push(name + ': THREW ' + (e && e.message ? e.message : e)); });
  };
}

Promise.resolve()
  .then(asyncFlow('an over-limit spend stops, offers the move, and records only on Record anyway', limitFlows))
  .then(asyncFlow('the choice dialog cleans up and never leaks into the other dialogs', choiceCleanupFlow))
  .then(asyncFlow('a goal delete returns exactly the money its confirm names', goalDeleteBalanceFlow))
  .then(asyncFlow('a move is never more than the donor holds, and returns to the unsaved expense', moveReturnFlow))
  .then(asyncFlow('Record anyway over the edit sheet closes both and leaves history clean', stackedCloseFlow))
  .then(asyncFlow('undoing a move whose money was spent is refused; a future or unspent one is not', moveDeleteFlow))
  .then(asyncFlow('a future expense brought to today passes the limit; future to future does not', redateFlow))
  .then(asyncFlow('an income change that strands spending is refused; one that takes money is warned', incomeShortFlow))
  .then(asyncFlow('a logged plan is paid from an account and limited; without accounts nothing changes', logPlanFlow))
  .then(asyncFlow('a goal contribution is paid from an account and limited; the bell sheet writes what one tap did', goalFlow))
  .then(asyncFlow('a debt arrival move that strands spending is refused; a lower principal or delete is warned', loanEditFlow))
  .then(incomeDeleteFlows)
  .then(
    function () { t.flows.push('deleting or clearing income takes its split moves: ok'); },
    function (e) { t.flows.push('deleting or clearing income takes its split moves: THREW ' + (e && e.message ? e.message : e)); }
  )
  .then(deleteFlows)
  .then(
    function () { t.flows.push('delete is refused while an account is used, allowed when not: ok'); },
    function (e) { t.flows.push('delete is refused while an account is used, allowed when not: THREW ' + (e && e.message ? e.message : e)); }
  )
  .then(asyncFlow('the log sheet never logs an occurrence other than the one it showed', logMovedFlow))
  .then(asyncFlow('Reset names accounts and money moves and clears its own settings keys', resetFlow))
  .then(publish, publish);
