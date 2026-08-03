// A throw out of the top-level script must still reach a banner with a route out.
//
//   node tools/harness/boot-crash.js  (via run.mjs, no --width)
//
// WHY THIS IS A SECOND FRAME
//
// The probe is injected after the app script, so by the time it runs the app
// has already booted and a boot-time throw can no longer be produced. It seeds
// the store and boots the app a SECOND time in a nested frame, then reads that
// frame's DOM. The nested copy carries #nested in its URL and does nothing but
// boot — without that guard it would inject this probe again, forever.
//
// WHAT IT GUARDS
//
// reportFatal() and its two listeners sat at the bottom of ~5,000 lines of
// straight-line top-level statements, so they did not exist yet when
// `let db = load()` ran — the one statement the mechanism was written for. The
// result was a blank screen with no banner, no Restore and no Download damaged
// file, in exactly the state the banner exists for. Moving the registration
// above load() must keep this green.
//
// WHAT THIS PROBE CANNOT SEE
//
// Console errors raised inside the NESTED frame are invisible to this one.
// Hooking console.error here records only the outer document's errors, and the
// outer document does nothing but build an iframe — so such a hook would be an
// assertion that can barely fail, watching the wrong window. This probe
// therefore reports no console field at all, rather than reporting one that is
// structurally always zero. Do not add the recorder from v1-write-flows.js
// believing it covers the boot; it does not.
if (location.hash === '#nested') {
  // second boot — just let the app run
} else {
  var t = { flows: [] };
  try {
    // The reachable path. `categories` is a non-empty NON-array, so it parses
    // cleanly (quarantine never fires) and then d.categories.forEach(...) throws
    // a TypeError outside the try that guards the parse.
    //
    // A string, not an object: `parsed.categories?.length ? ... : defaults`
    // gates on .length, and {0:'x'}.length is undefined, so an object falls
    // back to the defaults and never throws. That difference cost a run.
    localStorage.setItem('expense-tracker-v1', JSON.stringify({
      version: 99, categories: 'abc', income: [], actual: [], planned: []
    }));

    var f = document.createElement('iframe');
    f.style.cssText = 'width:390px;height:820px;border:0';
    f.src = 'inner.html#nested';
    f.onload = function () {
      try {
        var d = f.contentDocument;
        var banner = d.getElementById('dataErrorBanner');

        // navigate('dashboard') runs at the very end of init and is the only
        // thing that sets aria-current. Absent => the script died partway,
        // which is the precondition this probe is worthless without.
        t.A_init_completed = !!d.querySelector('[aria-current="page"]');
        t.B_banner_showing = !!banner && banner.classList.contains('show');
        t.C_title = banner ? d.getElementById('dataErrorTitle').textContent : '(no banner)';
        t.D_restore_reachable =
          !!d.getElementById('dataErrorImport') &&
          d.getElementById('dataErrorImport').offsetParent !== null;

        var thrown = null;
        try {
          if (t.A_init_completed) {
            throw new Error('setup failed: init completed, so no boot-time throw was produced');
          }
          if (!t.B_banner_showing) {
            throw new Error('a boot-time throw produced no banner — blank screen, no route to Restore');
          }
          if (!t.D_restore_reachable) {
            throw new Error('banner shown but Restore from file is not reachable');
          }
        } catch (e) { thrown = String(e.message); }
        t.flows.push('boot throw is reported: ' + (thrown ? 'THREW ' + thrown : 'ok'));
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
