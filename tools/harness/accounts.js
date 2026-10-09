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
      actual_num_acct:    function (f) { f.actual[0].accountId = 7; }
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
} catch (e) { t.ERROR = String(e && e.message ? e.message : e); }

publish();
