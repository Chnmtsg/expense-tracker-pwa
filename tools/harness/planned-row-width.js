// The planned row's width guard.
//
//   node tools/harness/run.mjs tools/harness/planned-row-width.js --width 320
//   npm run rows
//
// WHY THIS EXISTS
//
// A planned row carries a category name, a group tag, a settlement tag and a
// recurring badge on one line, and 320px is the narrow end of the supported
// band. When the settlement tag was added, this measured the row and found it
// clipping — and then found that it had ALREADY been clipping by 8px before
// the tag existed, because the row's text column was a flex item that had
// never been given `min-width: 0` and so could not shrink below its content.
//
// That defect was invisible by inspection and invisible on the page: the row
// does not scroll, so the overflow simply cut the last few pixels off inside a
// card that looked correct. Nothing in tools/ could have found it — it is a
// measured layout fact, which is what run.mjs exists for.
//
// It runs at 320 because that is where it fails first. A pass here is not a
// claim about 390; run it at both when the row's contents change.
var t = { flows: [] };
function flow(name, fn) {
  var thrown = null;
  try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
  t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
}

try {
  t.viewport_clientWidth = document.documentElement.clientWidth;
  var cid = db.categories[0].id;
  var now = new Date();
  var anchor = toLocalISO(new Date(now.getFullYear(), now.getMonth() - 2, 5));
  db.planned = [
    { id: 'W1', date: todayISO(), amount: 1250000, categoryId: cid, notes: 'unpaid one-off' },
    { id: 'W2', date: todayISO(), amount: 1250000, categoryId: cid, recLastDone: todayISO() },
    { id: 'W3', date: anchor, amount: 1250000, categoryId: cid, recFrequency: 'monthly', recLastDone: anchor }
  ];
  db.actual = [];
  save();

  navigate('expenses');
  var r = computeRange('all');
  document.getElementById('expPreset').value = 'all';
  document.getElementById('expFrom').value = r.from;
  document.getElementById('expTo').value = r.to;
  setExpMode('planned');
  renderExpenses();

  flow('planned rows do not overflow at this width', function () {
    var rows = document.querySelectorAll('#expList .list-item');
    t.row_count = rows.length;
    if (rows.length !== 3) throw new Error('expected 3 planned rows, got ' + rows.length);

    t.rows = [];
    var listRect = document.getElementById('expList').getBoundingClientRect();
    Array.prototype.forEach.call(rows, function (row, i) {
      var rect = row.getBoundingClientRect();
      t.rows.push({ i: i, w: Math.round(rect.width), h: Math.round(rect.height), right: Math.round(rect.right) });
      if (rect.right > listRect.right + 1) {
        throw new Error('row ' + i + ' overflows its list by ' + Math.round(rect.right - listRect.right) + 'px');
      }
      // The row's own content must not scroll inside it either.
      if (row.scrollWidth > row.clientWidth + 1) {
        throw new Error('row ' + i + ' content is clipped: ' + row.scrollWidth + ' > ' + row.clientWidth);
      }
    });

    // The tags themselves must stay inside the row.
    var tags = document.querySelectorAll('#expList .tag');
    t.tag_count = tags.length;
    Array.prototype.forEach.call(tags, function (tag) {
      var tr = tag.getBoundingClientRect();
      if (tr.right > listRect.right + 1) {
        throw new Error('a tag ("' + tag.textContent.trim() + '") overflows the list by ' + Math.round(tr.right - listRect.right) + 'px');
      }
      if (tr.width < 1 || tr.height < 1) throw new Error('a tag collapsed: "' + tag.textContent.trim() + '"');
    });
    t.tag_labels = Array.prototype.map.call(tags, function (x) { return x.textContent.trim(); });
  });

  flow('the page does not scroll sideways', function () {
    var doc = document.documentElement;
    t.scrollWidth = doc.scrollWidth;
    t.clientWidth = doc.clientWidth;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      throw new Error('horizontal overflow: ' + doc.scrollWidth + ' > ' + doc.clientWidth);
    }
  });
} catch (e) {
  t.fatal = String(e && e.message ? e.message : e);
}

document.documentElement.setAttribute('data-probe', JSON.stringify(t));
