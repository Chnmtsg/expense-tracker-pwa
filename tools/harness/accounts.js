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

Promise.resolve()
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
  .then(publish, publish);
