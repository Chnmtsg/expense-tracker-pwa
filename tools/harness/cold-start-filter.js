// GUARANTEE: on a COLD START with a saved Analytics range, the calendar paints
// the month that range implies — not the current month.
//
//   node tools/harness/run.mjs tools/harness/cold-start-filter.js
//
// WHY A SECOND FRAME, AND WHY THAT IS CHEAP HERE
//
// The property is about what happens when the app boots with state already in
// localStorage, and a probe injected after the app script has already missed
// the boot. So this seeds `filter-state-v1` and boots the app a SECOND time in
// a nested frame, then reads that frame — the same technique boot-crash.js
// already uses. The nested copy carries #nested in its URL and does nothing but
// boot; without that guard it would inject this probe again, forever.
//
// WHAT IT GUARDS, AND WHY IT EXISTS AT ALL
//
// The Analytics filter governs the stat tiles, the chips and the Daily
// Breakdown. The calendar reads a module-level `calDate`. Keeping the two in
// step has now been approved twice and been false twice:
//
//   WORK-95   established the property. Anchored on the range START, so six of
//             nine presets opened on the oldest month in the range.
//   WORK-118  fixed the anchor. Synced only in the preset `change` handler, so
//             the restore path — which sets .value in script and fires no
//             change event — still fell back to the current month on EVERY
//             cold start.
//   WORK-132  syncs from both call sites. This probe is what makes that
//             checkable rather than asserted.
//
// Both previous approvals named the ◀/▶ arrows as their acceptance test. The
// arrows verify the sync does not BREAK month stepping; they never exercise a
// boot, so they could not fail on the symptom either time. That is the
// distinction this file exists to hold.
if (location.hash === '#nested') {
  // second boot — just let the app run
} else {
  var t = { flows: [] };
  function flow(name, fn) {
    var thrown = null;
    try { fn(); } catch (e) { thrown = String(e && e.message ? e.message : e); }
    t.flows.push(name + ': ' + (thrown ? 'THREW ' + thrown : 'ok'));
  }
  try {
    // "Last Year" is chosen deliberately: its range cannot contain today, so
    // the clamp must land on the range END. A preset containing today would
    // pass even with the sync missing, because the initialiser already lands
    // on the current month — an assertion that cannot fail.
    var PRESET = 'lastYear';
    localStorage.setItem('filter-state-v1', JSON.stringify({ daily: { preset: PRESET, from: '', to: '' } }));

    var f = document.createElement('iframe');
    f.style.cssText = 'width:390px;height:820px;border:0';
    f.src = 'inner.html#nested';
    f.onload = function () {
      try {
        var w = f.contentWindow, d = f.contentDocument;

        // What the saved range actually resolves to in the booted app, rather
        // than a date this probe hardcoded.
        var r = w.computeRange(PRESET);
        var end = r && r.to ? r.to : '';
        t.A_range = r ? r.from + '..' + r.to : '(none)';
        if (!end) throw new Error('setup failed: ' + PRESET + ' resolved to no range');
        // todayISO is a `const` arrow, so it is NOT a property of the frame's
        // window — but the outer document is the app too, so it is in scope
        // here directly. computeRange IS a function declaration, hence w.*.
        if (todayISO() <= end) {
          throw new Error('setup failed: ' + PRESET + ' contains today, so this cannot fail on the symptom');
        }

        w.navigate('daily');
        if (typeof w.renderDaily === 'function') w.renderDaily();

        t.B_saved_preset = d.getElementById('dailyPreset').value;
        t.C_calendar_month = d.getElementById('calMonthLbl').textContent;

        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        t.D_expected_month = months[parseInt(end.slice(5, 7), 10) - 1] + ' ' + end.slice(0, 4);

        flow('cold start paints the month the saved range implies', function () {
          if (t.B_saved_preset !== PRESET) {
            throw new Error('setup failed: the saved preset was not restored, got "' + t.B_saved_preset + '"');
          }
          if (t.C_calendar_month !== t.D_expected_month) {
            throw new Error('calendar opened on ' + t.C_calendar_month + ', but the restored range ' +
                            t.A_range + ' implies ' + t.D_expected_month);
          }
        });
      } catch (e) {
        t.ERROR = 'reading nested frame: ' + String(e && e.message ? e.message : e);
      }
      document.documentElement.setAttribute('data-probe', JSON.stringify(t));
    };
    document.body.appendChild(f);
  } catch (e) {
    t.ERROR = String(e && e.message ? e.message : e);
    document.documentElement.setAttribute('data-probe', JSON.stringify(t));
  }
}
