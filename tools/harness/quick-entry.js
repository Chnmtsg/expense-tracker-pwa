// The Quick entry keypad, as a command.
//
//   node tools/harness/run.mjs tools/harness/quick-entry.js --width 320
//   npm run quick
//
// WHY THIS EXISTS
//
// Quick entry writes nothing itself: it hands an amount to the Add Income or
// Add Expense form and that form's Add button writes the record. The flows
// below hold that hand-off — the right screen, the right mode, the amount
// formatted as if typed, a record only on Add — and that the header's extra
// button and the keypad fit the narrowest supported width.
var t = { flows: [], consoleErrors: [] };
var realErr = console.error;
console.error = function () {
  t.consoleErrors.push(Array.prototype.map.call(arguments, String).join(' '));
  realErr.apply(console, arguments);
};
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}
function publish() {
  t.H_unexpected_console_errors = t.consoleErrors.length;
  document.documentElement.setAttribute('data-probe', JSON.stringify(t));
}
var sheet = document.getElementById('quickSheet');
var shown = function () { return sheet.classList.contains('show'); };
var amountText = function () { return document.getElementById('quickAmount').textContent; };
function press() {
  Array.prototype.forEach.call(arguments, function (k) {
    var b = document.querySelector('#quickKeys [data-qk="' + k + '"]');
    if (!b) throw new Error('no key ' + k);
    b.click();
  });
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;
  db.income = []; db.actual = []; db.planned = []; db.accounts = []; db.transfers = [];
  save();

  flow('the header keeps every screen title on one line beside three buttons', function () {
    var h1 = document.getElementById('hdrTitle');
    var lineH = parseFloat(getComputedStyle(h1).lineHeight) || parseFloat(getComputedStyle(h1).fontSize) * 1.3;
    var worst = { title: '', height: 0 };
    ['dashboard', 'income', 'expenses', 'daily', 'goals', 'accounts', 'debts', 'salary', 'settings'].forEach(function (s) {
      navigate(s);
      var header = document.querySelector('header');
      if (header.scrollWidth > header.clientWidth) throw new Error(s + ': header overflows by ' + (header.scrollWidth - header.clientWidth) + 'px');
      if (h1.scrollWidth > h1.clientWidth) throw new Error(s + ': "' + h1.textContent + '" is cut off');
      if (h1.offsetHeight > worst.height) worst = { title: h1.textContent, height: h1.offsetHeight };
    });
    setExpMode('planned'); navigate('expenses');
    if (h1.offsetHeight > worst.height) worst = { title: h1.textContent, height: h1.offsetHeight };
    setExpMode('actual');
    t.header_tallest_title = worst;
    if (worst.height > lineH * 1.5) throw new Error('"' + worst.title + '" wraps: ' + worst.height + 'px for a ' + lineH + 'px line');
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) throw new Error('page scrolls sideways');
  });

  flow('the keypad opens empty, ignores leading zeros and enables the actions on an amount', function () {
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    if (!shown()) throw new Error('the sheet did not open');
    if (amountText() !== '₮0') throw new Error('opened at ' + amountText());
    if (!document.getElementById('quickIncome').disabled || !document.getElementById('quickExpense').disabled) throw new Error('actions enabled at zero');
    press('0', '000');
    if (amountText() !== '₮0') throw new Error('leading zeros kept: ' + amountText());
    press('1', '2', '000');
    if (amountText() !== '₮12,000') throw new Error('1 2 000 reads ' + amountText());
    if (document.getElementById('quickExpense').disabled) throw new Error('Expense still disabled at ₮12,000');
    press('back');
    if (amountText() !== '₮1,200') throw new Error('delete reads ' + amountText());
    var e = new KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true });
    document.getElementById('quickClose').dispatchEvent(e);
    if (amountText() !== '₮12,005') throw new Error('a typed 5 reads ' + amountText());
    document.getElementById('quickClose').dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    if (amountText() !== '₮1,200') throw new Error('a typed Backspace reads ' + amountText());
  });

  flow('the longest amount fits, and every key is a 44px target', function () {
    press('9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9');
    var el = document.getElementById('quickAmount');
    if (amountText() !== '₮120,099,999,999') throw new Error('twelve-digit cap reads ' + amountText());
    if (el.scrollWidth > el.clientWidth) throw new Error('amount overflows by ' + (el.scrollWidth - el.clientWidth) + 'px');
    var line = parseFloat(getComputedStyle(el).lineHeight);
    t.longest_amount = { height: el.offsetHeight, line: line, fontSize: getComputedStyle(el).fontSize };
    if (el.offsetHeight > line * 1.5) throw new Error('the longest amount wraps: ' + el.offsetHeight + 'px for a ' + line + 'px line');
    var keys = document.querySelectorAll('.quick-key, .quick-actions button');
    if (keys.length !== 14) throw new Error('expected 14 targets, found ' + keys.length);
    Array.prototype.forEach.call(keys, function (k) {
      var r = k.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) throw new Error('"' + k.textContent + '" is ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    var modal = sheet.querySelector('.modal');
    if (modal.scrollHeight > modal.clientHeight) t.sheet_scrolls_at_820 = true;
    document.getElementById('quickClose').click();
    if (shown()) throw new Error('close left the sheet open');
  });

  flow('Expense opens Add Actual Expense with the amount, and only Add writes', function () {
    setExpMode('planned');
    navigate('income');
    document.getElementById('quickBtn').click();
    press('2', '5', '000');
    var before = db.actual.length;
    document.getElementById('quickExpense').click();
    if (shown()) throw new Error('the sheet stayed open');
    if (!document.getElementById('expenses').classList.contains('active')) throw new Error('not on Expenses');
    if (expMode !== 'actual') throw new Error('mode is ' + expMode);
    if (document.getElementById('expAmount').value !== '25,000') throw new Error('amount field reads "' + document.getElementById('expAmount').value + '"');
    if (document.activeElement.id !== 'expCategory') throw new Error('focus is on ' + document.activeElement.id);
    if (db.actual.length !== before) throw new Error('a record was written before Add');
    document.getElementById('expAdd').click();
    var r = db.actual[db.actual.length - 1];
    if (db.actual.length !== before + 1 || r.amount !== 25000) throw new Error('Add wrote ' + JSON.stringify(r));
  });

  flow('Income opens Add Income with the amount, and only Add writes', function () {
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    if (amountText() !== '₮0') throw new Error('reopened at ' + amountText());
    press('5', '0', '0', '000');
    var before = db.income.length;
    document.getElementById('quickIncome').click();
    if (!document.getElementById('income').classList.contains('active')) throw new Error('not on Income');
    if (document.getElementById('incAmount').value !== '500,000') throw new Error('amount field reads "' + document.getElementById('incAmount').value + '"');
    if (document.activeElement.id !== 'incType') throw new Error('focus is on ' + document.activeElement.id);
    if (db.income.length !== before) throw new Error('a record was written before Add');
    document.getElementById('incAdd').click();
    var r = db.income[db.income.length - 1];
    if (db.income.length !== before + 1 || r.amount !== 500000) throw new Error('Add wrote ' + JSON.stringify(r));
  });
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}
publish();
