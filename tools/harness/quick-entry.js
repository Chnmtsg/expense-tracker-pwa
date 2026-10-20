// The quick-add sheet, as a command.
//
//   node tools/harness/run.mjs tools/harness/quick-entry.js --width 320 --height 568
//   npm run quick   (also quick360, quick390)
//
// WHY THIS EXISTS
//
// The quick-add sheet, "Add entry" (chief-architect-ink-quickadd.md), in
// its Expense and Income modes (Debt payment mode is not in this release).
// Each mode saves here through its form's own writer: an expense through Add
// Expense's, an income with its split through Add Income's. The flows below
// hold the invariants — nothing chosen for the user, one record per Save,
// nothing written by Close, Escape, Back, a refusal or a declined limit
// dialog, Enter acting only on an action, the loan correction word for word —
// and that the tab bar's raised middle slot and the sheet fit 320x568,
// 360x640 and 390x844.
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
// Flows that wait on a dialog's promise; run after the synchronous ones.
var asyncFlows = [];
function flowAsync(name, fn) { asyncFlows.push([name, fn]); }
var tick = function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); };
function press() {
  Array.prototype.forEach.call(arguments, function (k) {
    var b = document.querySelector('#quickKeys [data-qk="' + k + '"]');
    if (!b) throw new Error('no key ' + k);
    b.click();
  });
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;
  t.viewport_clientHeight = document.documentElement.clientHeight;
  db.income = []; db.actual = []; db.planned = []; db.accounts = []; db.transfers = [];
  save();

  // Owner rule 2026-10-19: the app opens on the quick-add sheet ("Add entry",
  // WORK-17). run.mjs records the
  // launch state in window.__launch before putting the sheet away.
  flow('the app opens on the Add entry sheet, over Home', function () {
    var l = window.__launch;
    if (!l) throw new Error('run.mjs did not record the launch state');
    t.launch = l;
    if (!l.sheetOpen) throw new Error('the keypad was not open at launch');
    if (l.screen !== 'dashboard') throw new Error('the screen under the keypad is ' + l.screen + ', not Home');
    if (!l.historyModal) throw new Error('the launch keypad has no history entry, so Back would leave the app');
    if (!l.focusInSheet) throw new Error('focus was not inside the launch keypad');
  });

  // The owner, 2026-10-20 (later, over C6's content-sized sheet): on a phone
  // the sheet is the whole screen. Every run here is a phone width. Keys
  // stay 64px at every height (the owner's rule), and nothing scrolls at
  // 360x640 and taller.
  flow('on a phone the sheet fills the screen, keys 64px', function () {
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    var md = sheet.querySelector('.modal');
    var r = md.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    t.sheetGeo = { vw: vw, vh: vh, top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width) };
    if (Math.abs(r.top) > 0.5 || Math.abs(r.height - vh) > 1 || Math.abs(r.width - vw) > 1) {
      throw new Error('the sheet is ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' at top ' + Math.round(r.top) + ' in a ' + vw + 'x' + vh + ' screen, not the whole screen');
    }
    // The amount sits in the free space, below the header and above the chips.
    var amt = document.getElementById('quickAmount').getBoundingClientRect();
    var chipsTop = document.getElementById('quickPicks').getBoundingClientRect().top;
    if (vh >= 844 && !(amt.top - document.getElementById('quickModes').getBoundingClientRect().bottom > 40 && chipsTop - amt.bottom > 40)) throw new Error('the amount is not centred in the free space');
    if (vh >= 640 && md.scrollHeight > md.clientHeight + 1) throw new Error('the sheet scrolls by ' + (md.scrollHeight - md.clientHeight) + 'px at ' + vw + 'x' + vh);
    var top = sheet.querySelector('.quick-top');
    if (vh >= 640 && top.scrollHeight > top.clientHeight + 1) throw new Error('the amount region scrolls at ' + vw + 'x' + vh);
    var key = document.querySelector('#quickKeys [data-qk="1"]').getBoundingClientRect();
    if (key.height < 64) throw new Error('keys are ' + Math.round(key.height) + 'px tall at ' + vw + 'x' + vh);
    var x = document.getElementById('quickClose').getBoundingClientRect();
    // C6: close and the mode segments share one row; the title names the
    // dialog for screen readers only.
    var seg = document.getElementById('quickModes').getBoundingClientRect();
    if (x.top >= seg.bottom || x.bottom <= seg.top) throw new Error('the close button is not on the segments row');
    if (document.getElementById('quickModes').querySelectorAll('button').length < 2) throw new Error('the mode segments are missing');
    if (!document.getElementById('quickTitle').classList.contains('sr-only')) throw new Error('the dialog title is not kept for screen readers');
    if (x.width < 44 || x.height < 44) throw new Error('the close button is ' + Math.round(x.width) + 'x' + Math.round(x.height));
    var grab = sheet.querySelector('.sheet-grabber');
    if (!grab || grab.getAttribute('aria-hidden') !== 'true') throw new Error('the grabber is missing or not aria-hidden');
    var act = document.getElementById('quickSave').getBoundingClientRect();
    if (act.bottom > window.innerHeight || act.top < window.innerHeight / 2) throw new Error('the actions are not in the bottom half of the screen');
    // Save is 56px tall (chief-architect-ink-quickadd.md, WORK-10) and says
    // Save because it writes (the owner's 2026-10-20 decision). The "Income →" hand-off is retired (C1, Development Order 9).
    var saveBtn = document.getElementById('quickSave');
    if (saveBtn.getBoundingClientRect().height < 56) throw new Error('#quickSave is ' + Math.round(saveBtn.getBoundingClientRect().height) + 'px tall');
    if (saveBtn.textContent !== 'Save expense') throw new Error('Save reads "' + saveBtn.textContent + '"');
    if (document.getElementById('quickIncome')) throw new Error('the Income → hand-off is still there');
    // Nothing shows behind a full-screen sheet, so it draws no blur, and no
    // grabber (a sheet's mark).
    if (getComputedStyle(sheet).backdropFilter !== 'none') throw new Error('the full-screen sheet still blurs a backdrop no one sees');
    if (grab.offsetParent !== null) throw new Error('the full-screen sheet shows a grabber');
    document.getElementById('quickClose').click();
  });

  // WORK-13: a tap beside the sheet closes it only while it is empty.
  // WORK-17: the dialog and the + button share the accessible name "Add
  // entry"; the close X names what it closes.
  flow('the sheet and its + button are named Add entry', function () {
    var btn = document.getElementById('quickBtn');
    if (btn.getAttribute('aria-label') !== 'Add entry' || btn.title !== 'Add entry') throw new Error('the + button is named ' + btn.getAttribute('aria-label') + ' / ' + btn.title);
    var dlg = sheet.querySelector('[role="dialog"]');
    var title = document.getElementById(dlg.getAttribute('aria-labelledby'));
    if (!title || title.textContent !== 'Add entry') throw new Error('the dialog is named ' + (title && title.textContent));
    if (document.getElementById('quickClose').getAttribute('aria-label') !== 'Close Add entry') throw new Error('the close X is named ' + document.getElementById('quickClose').getAttribute('aria-label'));
    if (/Enter amount/.test(sheet.outerHTML + btn.outerHTML)) throw new Error('"Enter amount" is still on the sheet or the button');
  });

  flow('a tap beside the sheet closes it only while nothing is entered', function () {
    navigate('dashboard');
    var tapBeside = function () { sheet.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
    document.getElementById('quickBtn').click();
    tapBeside();
    if (shown()) throw new Error('a tap beside the empty sheet did not close it');
    document.getElementById('quickBtn').click();
    press('5');
    tapBeside();
    if (!shown()) throw new Error('a tap beside the sheet threw away ₮5');
    if (amountText() !== '₮5') throw new Error('the amount changed to ' + amountText());
    press('back');
    tapBeside();
    if (shown()) throw new Error('cleared back to empty, a tap beside it did not close it');
  });

  // chief-architect-ink-quickadd.md, WORK-08 / C6: run at 390x844, 360x640
  // and 320x568 (npm run quick390 / quick360 / quick). At every size the
  // sheet scrolls nowhere sideways, and every key and action is on screen.
  flow('at this height every key and action is on screen, with no sideways scroll', function () {
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    t.fit = { vw: vw, vh: vh };
    var md = sheet.querySelector('.modal');
    if (md.scrollWidth > md.clientWidth + 1 || document.documentElement.scrollWidth > vw + 1) throw new Error('the sheet scrolls sideways at ' + vw + 'x' + vh);
    var keys = document.querySelectorAll('#quickKeys [data-qk]');
    if (keys.length !== 12) throw new Error('found ' + keys.length + ' keys, not 12');
    var acts = document.querySelectorAll('#quickSheet .quick-actions button');
    if (!acts.length) throw new Error('found no actions');
    [].slice.call(keys).concat([].slice.call(acts)).forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.top < 0 || r.bottom > vh + 0.5 || r.left < 0 || r.right > vw + 0.5) {
        throw new Error('"' + (b.dataset.qk || b.textContent) + '" is off screen at ' + vw + 'x' + vh + ': ' + Math.round(r.top) + '-' + Math.round(r.bottom));
      }
    });
    t.fit.saveBottom = Math.round(acts[acts.length - 1].getBoundingClientRect().bottom);
    // WORK-20 / C6: each chip row is one row of 44px chips, ending in "All…".
    var cats = [].slice.call(document.querySelectorAll('#quickPicks > *')).filter(function (c) { return c.style.display !== 'none'; });
    if (cats.length < 2 || cats[cats.length - 1].id !== 'quickAllWrap') throw new Error('the category row does not end in All…');
    var rowTop = cats[0].getBoundingClientRect().top;
    var catsEl = document.getElementById('quickPicks');
    cats.forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (Math.abs(r.top - rowTop) > 1) throw new Error('the category row wraps at "' + c.textContent + '"');
      if (r.height < 44) throw new Error('chip "' + c.textContent + '" is ' + Math.round(r.height) + 'px tall');
      if (r.right > catsEl.getBoundingClientRect().right + 0.5) throw new Error('chip "' + c.textContent + '" is cut off');
    });
    t.fit.chips = cats.length - 1;
    // C6 / Development Order 9: Income mode, with its correction and a split
    // line, keeps every key and Save on screen.
    db.accounts = [{ id: 'F1', name: 'Main', opening: 0 }, { id: 'F2', name: 'Savings', opening: 0, share: 20 }];
    db.income = [{ id: 'FI', date: todayISO(), amount: 1, typeId: db.incomeTypes[0].id, notes: '', accountId: 'F1' }];
    save();
    document.getElementById('quickClose').click();
    document.getElementById('quickBtn').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    press('1', '0', '0', '000');
    if (document.getElementById('quickSplit').offsetParent === null) throw new Error('setup: no split line');
    [].slice.call(document.querySelectorAll('#quickKeys [data-qk], #quickSave, #quickChangeSplit')).forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.top < 0 || r.bottom > vh + 0.5) throw new Error('in Income mode "' + (b.dataset.qk || b.textContent) + '" is off screen at ' + vw + 'x' + vh);
    });
    // No row of the region is squashed: a squashed box keeps its edges off
    // the chips while its text spills over them, so the test is that the
    // amount's box is still a full line tall (the region scrolls instead).
    // Not scrollHeight: the glyphs overhang a healthy line box by a few px.
    var amtEl = document.getElementById('quickAmount');
    var amtLine = parseFloat(getComputedStyle(amtEl).lineHeight);
    if (amtEl.clientHeight < amtLine - 1) throw new Error('in Income mode the amount is squashed (' + amtEl.clientHeight + 'px box for a ' + Math.round(amtLine) + 'px line) at ' + vw + 'x' + vh);
    t.fit.incomeTopScrolls = sheet.querySelector('.quick-top').scrollHeight > sheet.querySelector('.quick-top').clientHeight + 1;
    db.accounts = []; db.income = []; save();
    [document.getElementById('quickDate'), document.getElementById('quickAcctWrap')].forEach(function (c) {
      if (c.style.display === 'none') return;
      if (c.getBoundingClientRect().height < 44) throw new Error(c.id + ' is under 44px');
    });
    document.getElementById('quickClose').click();
  });

  // Owner-chosen design (2026-10-19): a big amount that shrinks only to fit,
  // a muted ₮ and a muted empty state, and dialer-sized key digits.
  flow('the amount is big, shrinks to fit, and reads as a placeholder at zero', function () {
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    var el = document.getElementById('quickAmount');
    var root = getComputedStyle(document.documentElement);
    // C6: on short screens the amount steps down to make room: --t-hero at
    // 700px tall and under, --t-display at 600px and under.
    var vh0 = document.documentElement.clientHeight;
    var big = parseFloat(root.getPropertyValue(vh0 > 700 ? '--t-amount' : vh0 > 600 ? '--t-hero' : '--t-display'));
    var muted = getComputedStyle(el).color;
    if (!el.classList.contains('is-empty')) throw new Error('₮0 is not marked empty');
    press('2', '5', '000');
    if (el.classList.contains('is-empty')) throw new Error('₮25,000 is still marked empty');
    if (getComputedStyle(el).color === muted) throw new Error('the typed amount is still the muted colour');
    if (el.textContent !== '₮25,000') throw new Error('the amount reads "' + el.textContent + '"');
    var everyday = parseFloat(getComputedStyle(el).fontSize);
    if (everyday !== big) throw new Error('₮25,000 is ' + everyday + 'px, not the full ' + big + 'px');
    var cur = parseFloat(getComputedStyle(el.querySelector('.quick-cur')).fontSize);
    if (!(cur < everyday)) throw new Error('the ₮ is not smaller than the digits');
    press('9', '9', '9', '9', '9', '9', '9', '9', '9');
    var longSize = parseFloat(getComputedStyle(el).fontSize);
    t.amount_sizes = { everyday: everyday, longest: longSize };
    if (!(longSize <= big)) throw new Error('the twelve-digit amount grew (' + longSize + 'px)');
    if (el.scrollWidth > el.clientWidth) throw new Error('the shrunk amount still overflows by ' + (el.scrollWidth - el.clientWidth) + 'px');
    var keySize = parseFloat(getComputedStyle(document.querySelector('#quickKeys [data-qk="1"]')).fontSize);
    // The owner, 2026-10-20: --t-display digits were too big; --t-h2 now.
    if (keySize !== parseFloat(root.getPropertyValue('--t-h2'))) throw new Error('key digits are ' + keySize + 'px');
    document.getElementById('quickClose').click();
  });

  flow('the header keeps every screen title on one line', function () {
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

  flow('the tab bar is Home, Income, Add entry, Expenses, More, and Analytics is in More', function () {
    var slots = Array.prototype.map.call(document.querySelectorAll('nav.tabbar > button'), function (b) {
      return b.getAttribute('aria-label') || b.textContent.trim();
    });
    if (slots.join('|') !== 'Home|Income|Add entry|Expenses|More') throw new Error('the slots are ' + slots.join(', '));
    var nav = document.querySelector('nav.tabbar');
    if (nav.scrollWidth > nav.clientWidth) throw new Error('the tab bar overflows by ' + (nav.scrollWidth - nav.clientWidth) + 'px');
    var disc = document.querySelector('#quickBtn .tab-add-disc').getBoundingClientRect();
    t.tab_add_disc = { width: Math.round(disc.width), top: Math.round(disc.top), navTop: Math.round(nav.getBoundingClientRect().top) };
    if (disc.width < 44 || disc.height < 44) throw new Error('the Add entry disc is ' + Math.round(disc.width) + 'x' + Math.round(disc.height));
    if (!(disc.top < nav.getBoundingClientRect().top)) throw new Error('the Add entry disc does not rise above the bar');
    var widths = Array.prototype.map.call(document.querySelectorAll('nav.tabbar > button'), function (b) { return Math.round(b.getBoundingClientRect().width); });
    if (Math.max.apply(null, widths) - Math.min.apply(null, widths) > 1) throw new Error('the slots are uneven: ' + widths.join(', '));
    document.getElementById('moreBtn').click();
    var item = document.querySelector('[data-more-nav="daily"]');
    if (!item) throw new Error('Analytics is not in the More sheet');
    item.click();
    if (!document.getElementById('daily').classList.contains('active')) throw new Error('More did not open Analytics');
    if (document.getElementById('hdrTitle').textContent !== 'Analytics') throw new Error('Analytics is headed "' + document.getElementById('hdrTitle').textContent + '"');
    if (!document.getElementById('moreBtn').classList.contains('active')) throw new Error('More is not highlighted on Analytics');
    if (document.querySelector('nav.tabbar .active:not(#moreBtn)')) throw new Error('another tab is also highlighted on Analytics');
  });

  // Review 3 WORK-04. Headless Chrome has no safe-area inset, so this holds
  // the zero-inset geometry only; the inset case rests on the CSS arithmetic.
  flow('the toast clears the raised Add entry disc (zero inset)', function () {
    // The longest toast the sheet raises, so a wrap is part of the test.
    toast('Not saved yet. Adjust the split, then tap Add.');
    var tr = document.getElementById('toast').getBoundingClientRect();
    var disc = document.querySelector('#quickBtn .tab-add-disc').getBoundingClientRect();
    t.toast_clearance_px = Math.round(disc.top - tr.bottom);
    if (!(tr.bottom <= disc.top)) throw new Error('the toast bottom (' + Math.round(tr.bottom) + ') is below the disc top (' + Math.round(disc.top) + ')');
  });

  // Owner decision 2026-10-19: no zoom at all on phones. Headless Chrome
  // cannot pinch or double-tap, so this holds the three layers a phone acts
  // on (viewport tag, touch-action, iOS gesture guard), not the gestures.
  flow('the page cannot be zoomed: viewport, touch-action and the iOS gesture guard', function () {
    var vp = document.querySelector('meta[name="viewport"]').getAttribute('content');
    if (!/user-scalable\s*=\s*no/.test(vp) || !/maximum-scale\s*=\s*1(\.0)?\b/.test(vp)) throw new Error('the viewport still allows zoom: ' + vp);
    var g = new Event('gesturestart', { bubbles: true, cancelable: true });
    document.querySelector('#quickKeys [data-qk="1"]').dispatchEvent(g);
    if (!g.defaultPrevented) throw new Error('an iOS pinch (gesturestart) is not cancelled');
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    [document.documentElement, document.body, document.getElementById('quickBtn'), sheet.querySelector('.modal'), document.querySelector('#quickKeys [data-qk="1"]')].forEach(function (el) {
      var ta = getComputedStyle(el).touchAction;
      if (ta !== 'pan-x pan-y') throw new Error((el.id || el.className || el.tagName) + ' has touch-action ' + ta);
    });
    document.getElementById('quickClose').click();
    var grip = document.createElement('span');
    grip.className = 'drag-handle';
    document.body.appendChild(grip);
    var gta = getComputedStyle(grip).touchAction;
    grip.remove();
    if (gta !== 'none') throw new Error('the drag grip lost touch-action none: ' + gta);
  });

  flow('the keypad opens empty, ignores leading zeros and enables the actions on an amount', function () {
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    if (!shown()) throw new Error('the sheet did not open');
    if (amountText() !== '₮0') throw new Error('opened at ' + amountText());
    if (!document.getElementById('quickSave').disabled) throw new Error('Save enabled at zero');
    press('0', '000');
    if (amountText() !== '₮0') throw new Error('leading zeros kept: ' + amountText());
    press('1', '2', '000');
    if (amountText() !== '₮12,000') throw new Error('1 2 000 reads ' + amountText());
    if (document.getElementById('quickSave').disabled) throw new Error('Save still disabled at ₮12,000');
    press('back');
    if (amountText() !== '₮1,200') throw new Error('delete reads ' + amountText());
    var key = function (target, k) {
      var ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
      document.querySelector(target).dispatchEvent(ev);
      return ev;
    };
    key('#quickKeys [data-qk="1"]', '5');
    if (amountText() !== '₮12,005') throw new Error('a typed 5 reads ' + amountText());
    key('#quickKeys [data-qk="1"]', 'Backspace');
    if (amountText() !== '₮1,200') throw new Error('a typed Backspace reads ' + amountText());
    // Focus opens on the close X, where Enter would close and discard.
    if (!key('#quickClose', 'Enter').defaultPrevented) throw new Error('Enter on the close X is not stopped');
    if (!key('#quickKeys [data-qk="7"]', 'Enter').defaultPrevented) throw new Error('Enter on a key is not stopped');
    if (key('#quickSave', 'Enter').defaultPrevented) throw new Error('Enter on Save is stopped');
    if (!key('#quickPicks [data-qpick]', 'Enter').defaultPrevented) throw new Error('Enter on a category chip is not stopped');
    if (!shown() || amountText() !== '₮1,200') throw new Error('Enter changed the sheet: ' + amountText());
  });

  // chief-architect-ink-quickadd.md, WORK-05: a field in the sheet keeps its
  // own keys, and no field takes focus when the sheet opens. The planted
  // fields stand for any future one; the real Note field and "All…" select
  // are asserted in the Note flow below.
  flow('a field in the sheet keeps its keys, and the sheet opens without focusing one', function () {
    var sheet = document.getElementById('quickSheet');
    var panel = sheet.querySelector('.modal');
    var inp = document.createElement('input');
    var sel = document.createElement('select');
    sel.innerHTML = '<option>x</option>';
    panel.insertBefore(sel, panel.firstChild);
    panel.insertBefore(inp, panel.firstChild);
    try {
      if (shown()) closeModal(sheet);
      document.getElementById('quickBtn').click();
      if (!shown()) throw new Error('the sheet did not open');
      if (document.activeElement === inp || document.activeElement === sel) throw new Error('a field took focus at open: ' + document.activeElement.tagName);
      // The sheet's own container takes the first focus: no ring on a segment
      // or chip that would read as a selection.
      if (document.activeElement !== sheet.querySelector('.modal')) throw new Error('first focus is on ' + (document.activeElement.id || document.activeElement.textContent));
      press('4');
      ['2', 'Backspace'].forEach(function (k) {
        [inp, sel].forEach(function (el) {
          var ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
          el.dispatchEvent(ev);
          if (ev.defaultPrevented) throw new Error(k + ' in a ' + el.tagName + ' was taken by the keypad');
        });
      });
      if (amountText() !== '₮4') throw new Error('typing in a field changed the amount: ' + amountText());
    } finally {
      inp.remove(); sel.remove();
      if (shown()) closeModal(sheet);
    }
  });

  flow('the longest amount fits, and every key is a 44px target', function () {
    // Its own sheet, so a failure in the flow above is not reported twice.
    if (shown()) document.getElementById('quickClose').click();
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    if (!shown() || amountText() !== '₮0') throw new Error('setup: the sheet opened at ' + amountText());
    press('9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9');
    var el = document.getElementById('quickAmount');
    if (amountText() !== '₮999,999,999,999') throw new Error('twelve-digit cap reads ' + amountText());
    if (el.scrollWidth > el.clientWidth) throw new Error('amount overflows by ' + (el.scrollWidth - el.clientWidth) + 'px');
    var line = parseFloat(getComputedStyle(el).lineHeight);
    t.longest_amount = { height: el.offsetHeight, line: line, fontSize: getComputedStyle(el).fontSize };
    if (el.offsetHeight > line * 1.5) throw new Error('the longest amount wraps: ' + el.offsetHeight + 'px for a ' + line + 'px line');
    var keys = document.querySelectorAll('.quick-key, .quick-actions button, #quickModes button');
    if (keys.length !== 15) throw new Error('expected 15 targets (12 keys, Save, 2 modes), found ' + keys.length);
    Array.prototype.forEach.call(keys, function (k) {
      var r = k.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) throw new Error('"' + k.textContent + '" is ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    var modal = sheet.querySelector('.modal');
    if (modal.scrollHeight > modal.clientHeight) t.sheet_scrolls_at_820 = true;
    document.getElementById('quickClose').click();
    if (shown()) throw new Error('close left the sheet open');
  });

  // chief-architect-ink-quickadd.md, Development Order 7 (WORK-03, 04, 09,
  // 14, 20). Restates the hand-off flow it replaces: the keypad's Expense
  // action now saves, so "a record only on Add" becomes "one record per
  // Save, none without a category".
  flow('Save expense writes one record, never with a guessed category', function () {
    var cats = db.categories;
    if (cats.length < 3) throw new Error('setup: the defaults have ' + cats.length + ' categories');
    db.accounts = [{ id: 'QA', name: 'Khan card', opening: 10000000 }];
    db.actual = [{ id: 'Q0', date: todayISO(), amount: 1, categoryId: cats[2].id, notes: '', accountId: 'QA' }];
    save();
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    // Opens with nothing chosen, today, and the last-used account.
    var pressed = document.querySelectorAll('#quickPicks [aria-pressed="true"]');
    if (pressed.length) throw new Error('a category is pre-selected: ' + pressed[0].textContent);
    var first = document.querySelector('#quickPicks [data-qpick]');
    if (first.dataset.qpick !== cats[2].id) throw new Error('the first chip is ' + first.textContent + ', not the last used ' + cats[2].name);
    if (document.getElementById('quickDateVal').textContent !== 'Today') throw new Error('the date chip reads ' + document.getElementById('quickDateVal').textContent);
    if (document.getElementById('quickAcctVal').textContent !== 'Khan card') throw new Error('the account chip reads ' + document.getElementById('quickAcctVal').textContent);
    press('2', '5', '000');
    var before = db.actual.length;
    document.getElementById('quickSave').click();
    if (db.actual.length !== before) throw new Error('Save with no category wrote a record');
    if (!shown()) throw new Error('a refused Save closed the sheet');
    if (document.getElementById('toast').textContent !== 'Choose a category') throw new Error('the refusal said "' + document.getElementById('toast').textContent + '"');
    if (!document.activeElement.closest('#quickPicks')) throw new Error('the refusal did not focus the category row');
    var chip = document.querySelector('#quickPicks [data-qpick="' + cats[1].id + '"]');
    chip.click();
    if (chip.getAttribute('aria-pressed') !== 'true') throw new Error('the tapped chip is not pressed');
    if (document.querySelectorAll('#quickPicks [aria-pressed="true"]').length !== 1) throw new Error('more than one chip pressed');
    document.getElementById('quickSave').click();
    var r = db.actual[db.actual.length - 1];
    if (db.actual.length !== before + 1) throw new Error('Save wrote ' + (db.actual.length - before) + ' records');
    if (r.amount !== 25000 || r.categoryId !== cats[1].id || r.date !== todayISO() || r.accountId !== 'QA' || r.notes !== '') throw new Error('Save wrote ' + JSON.stringify(r));
    if (JSON.parse(localStorage.getItem(KEY)).actual.length !== before + 1) throw new Error('the record was not stored');
    if (shown()) throw new Error('the sheet stayed open after Save');
    if (document.getElementById('toast').textContent !== 'Expense added') throw new Error('the toast said "' + document.getElementById('toast').textContent + '"');
    // Reopened, everything is reset, and the order now leads with that chip.
    document.getElementById('quickBtn').click();
    if (amountText() !== '₮0') throw new Error('reopened at ' + amountText());
    if (document.querySelectorAll('#quickPicks [aria-pressed="true"]').length) throw new Error('the last choice survived a reopen');
    if (document.querySelector('#quickPicks [data-qpick]').dataset.qpick !== cats[1].id) throw new Error('recent order did not lead with the category just used');
    // "All…" reaches every category, the last one included.
    press('7');
    var last = cats[cats.length - 1];
    var all = document.getElementById('quickAll');
    if (all.options.length !== cats.length + 1) throw new Error('All… lists ' + (all.options.length - 1) + ' of ' + cats.length);
    all.value = last.id;
    all.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('quickSave').click();
    r = db.actual[db.actual.length - 1];
    if (r.categoryId !== last.id || r.amount !== 7) throw new Error('All… saved ' + JSON.stringify(r));
    db.actual = []; db.accounts = []; save();
  });

  // WORK-15: the Note chip opens a field that did not exist before, hides
  // the keypad while it has focus, keeps its own keys, and is saved.
  flow('the Note chip opens a field, hides the keypad, and its text is saved', function () {
    db.actual = []; save();
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    if (document.getElementById('quickNote')) throw new Error('the note field exists before Note is tapped');
    if (document.activeElement === document.getElementById('quickAll')) throw new Error('All… took focus at open');
    press('3', '000');
    document.querySelector('#quickPicks [data-qpick]').click();
    document.getElementById('quickNoteBtn').click();
    var note = document.getElementById('quickNote');
    if (!note || document.activeElement !== note) throw new Error('the note field did not open with focus');
    if (document.getElementById('quickKeys').offsetParent !== null) throw new Error('the keypad stayed up while typing a note');
    var vh = document.documentElement.clientHeight, sb = document.getElementById('quickSave').getBoundingClientRect();
    if (sb.bottom > vh + 0.5 || sb.top < 0) throw new Error('Save is off screen while typing a note');
    ['2', 'Backspace'].forEach(function (k) {
      var ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
      note.dispatchEvent(ev);
      if (ev.defaultPrevented) throw new Error(k + ' in the note was taken by the keypad');
    });
    if (amountText() !== '₮3,000') throw new Error('typing in the note changed the amount: ' + amountText());
    note.value = '<b>Nomin</b> supermarket';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    // Pressing Save keeps the note's focus, so the keypad does not jump in.
    var md = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    document.getElementById('quickSave').dispatchEvent(md);
    if (!md.defaultPrevented) throw new Error('pressing Save blurs the note, so the keypad would move Save mid-tap');
    note.blur();
    if (document.getElementById('quickNote')) throw new Error('the note field stayed after blur');
    if (document.getElementById('quickKeys').offsetParent === null) throw new Error('the keypad did not come back after the note');
    if (document.getElementById('quickNoteVal').textContent !== '<b>Nomin</b> supermarket') throw new Error('the Note chip reads "' + document.getElementById('quickNoteVal').innerHTML + '"');
    // C6: the meta row stays one row of whole chips with a long note and a
    // long account name: Date in full, the others ellipsised, none clipped.
    db.accounts = [{ id: 'QL', name: 'Khan Bank everyday spending card', opening: 0 }];
    quickAcct = 'QL'; renderQuickMeta();
    var metaRow = sheet.querySelector('.quick-meta').getBoundingClientRect();
    ['quickDate', 'quickAcctWrap', 'quickNoteBtn'].forEach(function (id) {
      var c = document.getElementById(id), r = c.getBoundingClientRect();
      if (r.right > metaRow.right + 0.5 || Math.abs(r.top - metaRow.top) > 1) throw new Error(id + ' is clipped or wrapped');
      if (c.scrollWidth > c.clientWidth + 1) throw new Error(id + ' overflows its chip by ' + (c.scrollWidth - c.clientWidth) + 'px');
    });
    var dv = document.getElementById('quickDateVal');
    if (dv.scrollWidth > dv.clientWidth + 1) throw new Error('the date is cut: ' + dv.textContent);
    db.accounts = []; quickAcct = ''; renderQuickMeta();
    var mdAfter = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    document.getElementById('quickSave').dispatchEvent(mdAfter);
    if (mdAfter.defaultPrevented) throw new Error('Save swallows presses when no note is being typed');
    document.getElementById('quickSave').click();
    var r = db.actual[db.actual.length - 1];
    if (!r || r.notes !== '<b>Nomin</b> supermarket') throw new Error('saved notes ' + JSON.stringify(r && r.notes));
    document.getElementById('quickBtn').click();
    if (document.getElementById('quickNoteVal').textContent !== '') throw new Error('the note survived a reopen');
    // Closed while the note has focus: the field goes with no error.
    document.getElementById('quickNoteBtn').click();
    closeQuickNote();
    if (document.getElementById('quickNote')) throw new Error('the note field outlived closeQuickNote');
    document.getElementById('quickClose').click();
    db.actual = []; save();
  });

  flow('Close, Escape and Back write nothing', function () {
    navigate('dashboard');
    var before = db.actual.length;
    ['close', 'escape', 'back'].forEach(function (how) {
      document.getElementById('quickBtn').click();
      press('9');
      document.querySelector('#quickPicks [data-qpick]').click();
      if (how === 'close') document.getElementById('quickClose').click();
      if (how === 'escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      if (how === 'back') dismissModal(modalStack[modalStack.length - 1].el);
      if (shown()) throw new Error(how + ' did not close the sheet');
      if (db.actual.length !== before) throw new Error(how + ' wrote a record');
    });
  });

  flow('a picked date is saved; the toast names a moved filter only on Expenses', function () {
    db.actual = []; save();
    // The Expenses filter on last month: saving from Home moves it, silently.
    navigate('expenses');
    var preset = document.getElementById('expPreset');
    preset.value = 'lastMonth'; preset.dispatchEvent(new Event('change', { bubbles: true }));
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    press('3');
    document.querySelector('#quickPicks [data-qpick]').click();
    document.getElementById('quickSave').click();
    if (document.getElementById('toast').textContent !== 'Expense added') throw new Error('from Home the toast said "' + document.getElementById('toast').textContent + '"');
    if (preset.value === 'lastMonth') throw new Error('the Expenses filter was not moved to show the entry');
    // On Expenses itself, the move is said.
    preset.value = 'lastMonth'; preset.dispatchEvent(new Event('change', { bubbles: true }));
    setExpMode('actual');
    navigate('expenses');
    document.getElementById('quickBtn').click();
    press('4');
    document.querySelector('#quickPicks [data-qpick]').click();
    document.getElementById('quickSave').click();
    if (!/^Expense added · showing /.test(document.getElementById('toast').textContent)) throw new Error('on Expenses the toast said "' + document.getElementById('toast').textContent + '"');
    // A picked day: the picker opens over the sheet and its day is saved.
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    press('6');
    document.querySelector('#quickPicks [data-qpick]').click();
    document.getElementById('quickDate').click();
    if (!document.getElementById('datePickerModal').classList.contains('show')) throw new Error('the date picker did not open');
    var day = document.querySelector('#dpGrid [data-dp-day$="-01"]');
    var iso = day.dataset.dpDay;
    day.click();
    if (!shown()) throw new Error('picking a date closed the sheet');
    if (iso !== todayISO() && document.getElementById('quickDateVal').textContent !== iso) throw new Error('the date chip reads ' + document.getElementById('quickDateVal').textContent);
    document.getElementById('quickSave').click();
    if (db.actual[db.actual.length - 1].date !== iso) throw new Error('saved on ' + db.actual[db.actual.length - 1].date + ', not ' + iso);
    // WORK-04/09: the picked day is not remembered; the next open is today.
    document.getElementById('quickBtn').click();
    if (document.getElementById('quickDateVal').textContent !== 'Today') throw new Error('a reopened sheet kept the picked date: ' + document.getElementById('quickDateVal').textContent);
    document.getElementById('quickClose').click();
    db.actual = []; save();
  });

  // WORK-11: the limit dialog stacks over the sheet, offers no Move (which
  // would navigate away and lose the entry), and Cancel writes nothing.
  flowAsync('the limit dialog stacks over the sheet; Cancel writes nothing, Record anyway writes once', async function () {
    // A second account with money, so a dialog allowed to offer Move would.
    db.accounts = [{ id: 'QT', name: 'Thin', opening: 1000 }, { id: 'QF', name: 'Full', opening: 900000 }];
    db.actual = [{ id: 'QX', date: todayISO(), amount: 1, categoryId: db.categories[0].id, notes: '', accountId: 'QT' }];
    save();
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    press('5', '000');
    document.querySelector('#quickPicks [data-qpick]').click();
    document.getElementById('quickSave').click();
    var dlg = document.getElementById('confirmModal');
    if (!dlg.classList.contains('show')) throw new Error('the limit dialog did not open');
    if (+getComputedStyle(dlg).zIndex <= +getComputedStyle(sheet).zIndex) throw new Error('the dialog does not stack over the sheet');
    if (document.getElementById('confirmOk').style.display !== 'none') throw new Error('the dialog offers "' + document.getElementById('confirmOk').textContent + '", which would navigate away');
    document.getElementById('confirmCancel').click();
    await tick(20);
    if (db.actual.length !== 1) throw new Error('Cancel wrote a record');
    if (!shown() || amountText() !== '₮5,000') throw new Error('Cancel lost the entry: ' + amountText());
    document.getElementById('quickSave').click();
    document.getElementById('confirmAlt').click();
    await tick(20);
    if (db.actual.length !== 2) throw new Error('Record anyway wrote ' + (db.actual.length - 1) + ' records');
    if (shown()) throw new Error('the sheet stayed open after Record anyway');
    await tick(50);
    db.actual = []; db.accounts = []; save();
  });

  // chief-architect-ink-quickadd.md, Development Order 9. Restates the
  // Income hand-off flows it replaces: Income now saves in the sheet, with
  // the form's two protections, the loan correction (C3) and the split (C1).
  flow('Income mode keeps the amount, corrects a loan, and saves one income', function () {
    db.accounts = []; db.income = []; db.transfers = []; save();
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    var loan = document.getElementById('quickLoan');
    if (loan.offsetParent !== null) throw new Error('the loan correction shows in Expense mode');
    press('5', '0', '0', '000');
    document.querySelector('#quickPicks [data-qpick]').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    if (amountText() !== '₮500,000') throw new Error('the mode change lost the amount: ' + amountText());
    if (document.querySelectorAll('#quickPicks [aria-pressed="true"]').length) throw new Error('the expense choice carried into Income');
    if (document.querySelector('#quickModes [data-qmode="income"]').getAttribute('aria-pressed') !== 'true') throw new Error('the Income segment is not pressed');
    var types = db.incomeTypes;
    if (!types.length || !document.querySelector('#quickPicks [data-qpick="' + types[0].id + '"]')) throw new Error('the chips are not income types');
    if (document.getElementById('quickSave').textContent !== 'Save income') throw new Error('Save reads ' + document.getElementById('quickSave').textContent);
    if (loan.offsetParent === null) throw new Error('the loan correction is missing in Income mode');
    var p = loan.querySelector('p');
    if (p.textContent !== 'Borrowed money is not income.' || !p.querySelector('b')) throw new Error('the correction reads "' + p.textContent + '"');
    if (p.scrollWidth > p.clientWidth + 1) throw new Error('the correction is truncated');
    if (document.getElementById('quickGoDebts').textContent !== 'Record borrowed money instead →') throw new Error('the link reads ' + document.getElementById('quickGoDebts').textContent);
    document.getElementById('quickSave').click();
    if (db.income.length) throw new Error('Save with no type wrote an income');
    if (document.getElementById('toast').textContent !== 'Choose a type') throw new Error('the refusal said ' + document.getElementById('toast').textContent);
    document.querySelector('#quickPicks [data-qpick="' + types[0].id + '"]').click();
    document.getElementById('quickSave').click();
    if (db.income.length !== 1) throw new Error('Save income wrote ' + db.income.length);
    var r = db.income[0];
    if (r.amount !== 500000 || r.typeId !== types[0].id || r.date !== todayISO() || 'accountId' in r) throw new Error('Save income wrote ' + JSON.stringify(r));
    if (db.transfers.length) throw new Error('an income into no account wrote a split');
    if (shown()) throw new Error('the sheet stayed open');
    if (document.getElementById('toast').textContent !== 'Income added') throw new Error('the toast said ' + document.getElementById('toast').textContent);
    // The link: the sheet closes and Debts opens.
    document.getElementById('quickBtn').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    document.getElementById('quickGoDebts').click();
    if (shown() || !document.getElementById('debts').classList.contains('active')) throw new Error('the loan link did not go to Debts');
    db.income = []; save();
    navigate('dashboard');
  });

  flow('Income into an account with shares shows the split, and saves exactly that', function () {
    var tid = db.incomeTypes[0].id;
    db.accounts = [
      { id: 'A1', name: 'Main', opening: 0 },
      { id: 'A2', name: 'Savings', opening: 0, share: 20 }
    ];
    db.income = [{ id: 'I0', date: todayISO(), amount: 1000, typeId: tid, notes: '', accountId: 'A1' }];
    db.transfers = [];
    save();
    navigate('dashboard');
    document.getElementById('quickBtn').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    if (document.getElementById('quickAcctVal').textContent !== 'Main' || document.getElementById('quickAcctKey').textContent !== 'Into') throw new Error('the account chip reads ' + document.getElementById('quickAcctKey').textContent + ' ' + document.getElementById('quickAcctVal').textContent);
    var split = document.getElementById('quickSplit');
    if (split.offsetParent !== null) throw new Error('the split line shows at ₮0');
    press('1', '0', '0', '000');
    if (split.offsetParent === null) throw new Error('no split line for an account with shares');
    var line = document.getElementById('quickSplitText').textContent;
    if (line !== '₮20,000 to Savings · ₮80,000 stays in Main') throw new Error('the split line reads "' + line + '"');
    var vh = document.documentElement.clientHeight;
    var sr = split.getBoundingClientRect(), sv = document.getElementById('quickSave').getBoundingClientRect();
    if (sr.top < 0 || sv.bottom > vh + 0.5 || sr.bottom > sv.top) throw new Error('the split line is not in view above Save');
    document.querySelector('#quickPicks [data-qpick="' + tid + '"]').click();
    document.getElementById('quickSave').click();
    if (db.income.length !== 2) throw new Error('Save income wrote ' + (db.income.length - 1));
    var r = db.income[1];
    if (r.accountId !== 'A1' || r.amount !== 100000) throw new Error('wrote ' + JSON.stringify(r));
    if (db.transfers.length !== 1) throw new Error('wrote ' + db.transfers.length + ' split moves');
    var m = db.transfers[0];
    if (m.fromId !== 'A1' || m.toId !== 'A2' || m.amount !== 20000 || m.incomeId !== r.id || m.date !== r.date) throw new Error('the split move is ' + JSON.stringify(m));
    // Into the account with no shares, nothing is split and no line shows.
    document.getElementById('quickBtn').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    var acct = document.getElementById('quickAcct');
    acct.value = 'A2'; acct.dispatchEvent(new Event('change', { bubbles: true }));
    press('5', '000');
    if (split.offsetParent !== null) throw new Error('a split line for an account no one takes a share of');
    document.querySelector('#quickPicks [data-qpick="' + tid + '"]').click();
    document.getElementById('quickSave').click();
    if (db.income.length !== 3 || db.transfers.length !== 1) throw new Error('an unsplit income wrote moves');
    // Shares past 100%: said on the line, and Save refuses there.
    db.accounts.push({ id: 'A3', name: 'Debt', opening: 0, share: 90 });
    save();
    document.getElementById('quickBtn').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    acct.value = 'A1'; acct.dispatchEvent(new Event('change', { bubbles: true }));
    press('1', '000');
    if (!/^The split is ₮100 more than the income$/.test(document.getElementById('quickSplitText').textContent)) throw new Error('the over-split line reads "' + document.getElementById('quickSplitText').textContent + '"');
    document.querySelector('#quickPicks [data-qpick="' + tid + '"]').click();
    document.getElementById('quickSave').click();
    if (db.income.length !== 3) throw new Error('an over-split income was saved');
    if (document.getElementById('toast').textContent !== 'The split adds up to ₮1,100, more than the income') throw new Error('the refusal said ' + document.getElementById('toast').textContent);
    if (document.activeElement.id !== 'quickChangeSplit') throw new Error('the refusal did not focus Change split');
    document.getElementById('quickClose').click();
    db.accounts = []; db.income = []; db.transfers = []; save();
  });

  flow('Change split hands the income to Add Income, unsaved', function () {
    var tid = db.incomeTypes[db.incomeTypes.length - 1].id;
    db.accounts = [
      { id: 'A1', name: 'Main', opening: 0 },
      { id: 'A2', name: 'Savings', opening: 0, share: 20 }
    ];
    db.income = [{ id: 'I0', date: todayISO(), amount: 1000, typeId: db.incomeTypes[0].id, notes: '', accountId: 'A1' }];
    save();
    navigate('dashboard');
    document.getElementById('incAmount').value = '';
    document.getElementById('quickBtn').click();
    document.querySelector('#quickModes [data-qmode="income"]').click();
    press('1', '0', '0', '000');
    document.getElementById('quickAll').value = tid;
    document.getElementById('quickAll').dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('quickChangeSplit').click();
    if (shown()) throw new Error('the sheet stayed open');
    if (!document.getElementById('income').classList.contains('active')) throw new Error('not on Income');
    if (db.income.length !== 1) throw new Error('Change split wrote a record');
    if (document.getElementById('incAmount').value !== '100,000') throw new Error('amount field reads "' + document.getElementById('incAmount').value + '"');
    if (document.getElementById('incType').value !== tid) throw new Error('the type was not carried');
    if (document.getElementById('incAccount').value !== 'A1') throw new Error('income goes into ' + document.getElementById('incAccount').value);
    var row = document.querySelector('#incSplitRows [data-split-acct="A2"]');
    if (!row) throw new Error('no split row for the account with a share');
    if (row.value !== '20,000') throw new Error('the 20% row reads "' + row.value + '"');
    if (document.activeElement !== row) throw new Error('focus is on ' + document.activeElement.id);
    var rest = document.getElementById('incSplitRest').textContent;
    if (rest !== 'Stays in Main: ₮80,000') throw new Error('the rest line reads "' + rest + '"');
    var toastEl = document.getElementById('toast');
    if (toastEl.textContent !== 'Not saved yet. Adjust the split, then tap Add.') throw new Error('the cue reads "' + toastEl.textContent + '"');
    document.getElementById('incAdd').click();
    if (db.income.length !== 2 || db.income[1].amount !== 100000) throw new Error('Add wrote ' + JSON.stringify(db.income[1]));
    document.getElementById('incAmount').value = '';
    db.accounts = []; db.income = []; save();
  });
} catch (e) {
  t.ERROR = String(e && e.message ? e.message : e);
}
(async function () {
  for (var i = 0; i < asyncFlows.length; i++) {
    var thrown = null;
    try { await asyncFlows[i][1](); } catch (e) { thrown = String(e && e.message ? e.message : e); }
    t.flows.push(asyncFlows[i][0] + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
  }
  publish();
})();
