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

        // THE ASSERTION IS THAT INIT COMPLETED. Read this before changing it.
        //
        // navigate('dashboard') runs at the very end of the top-level script
        // and is the only thing that sets aria-current, so its presence means
        // every statement ran — including the #importFile change listener
        // ~2,650 lines below `let db = load()`, which is what actually reads a
        // chosen backup. That is the property worth guarding: a banner
        // offering "Restore from file" is worth nothing if the listener behind
        // it was never registered.
        //
        // This probe previously asserted the OPPOSITE — that init did NOT
        // complete — treating the crash as a setup precondition, and then
        // checked that the Restore button was VISIBLE. Both passed while the
        // button did nothing at all. A visibility assertion is not a function
        // assertion, and that is why this shipped.
        t.A_init_completed = !!d.querySelector('[aria-current="page"]');
        t.B_banner_showing = !!banner && banner.classList.contains('show');
        t.C_title = banner ? d.getElementById('dataErrorTitle').textContent : '(no banner)';
        t.D_restore_reachable =
          !!d.getElementById('dataErrorImport') &&
          d.getElementById('dataErrorImport').offsetParent !== null;
        // The listener is registered on #importFile at the bottom of the
        // script. It cannot be read back from the DOM, so init completing is
        // the proxy — which is exactly why A_init_completed is the assertion.
        t.E_import_input_present = !!d.getElementById('importFile');

        // Did the DEFAULTS actually get substituted, or did the app boot on the
        // half-built database?
        //
        // The catch must discard `d`. It is assigned from `parsed` before the
        // normalisation that throws, so without an explicit reset it is still
        // truthy, `if (!d)` never fires, and the app runs with `categories` as
        // the string "abc" — init completes, the banner shows, and every
        // assertion above passes. Verified: with the reset removed, this probe
        // was green. That is why this measurement exists.
        //
        // `db` is a top-level `let`, so it is NOT a property of the frame's
        // window and cannot be read from here. categoryOptions() is a function
        // declaration, so it IS — and calling it exercises db.categories
        // directly: a real array of records returns <option> markup, while the
        // string "abc" throws on .map.
        //
        // Not a DOM proxy. #expCategory is only filled when the Expenses
        // screen renders, and boot lands on the Dashboard, so its option count
        // is 0 on a perfectly healthy boot — an assertion on it fails green
        // builds, which is how this measurement got written wrong the first
        // time.
        t.F_category_options = -1;
        try {
          var html = f.contentWindow.categoryOptions();
          t.F_category_options = (String(html).match(/<option/g) || []).length;
        } catch (err) {
          t.F_category_error = String(err && err.message ? err.message : err);
        }

        var thrown = null;
        try {
          if (!t.A_init_completed) {
            throw new Error('the top-level script did not finish — every listener below load() is unregistered, including the one that reads a restored backup');
          }
          if (!t.B_banner_showing) {
            throw new Error('a corrupt store produced no banner — the user is told nothing');
          }
          if (t.C_title !== 'Your saved data could not be read.') {
            throw new Error('banner is not the corrupt-data message: "' + t.C_title + '"');
          }
          if (!t.D_restore_reachable || !t.E_import_input_present) {
            throw new Error('banner shown but the Restore route is not there');
          }
          if (t.F_category_options < 1) {
            throw new Error('booted on the half-built database — the defaults were not substituted, so db.categories is not a usable list (' + t.F_category_options + ' options)');
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
