// Development-time static check. See tools/lint.mjs for how the inline script
// is extracted; index.html itself is never modified and never needs this to run.
//
// Scope is deliberately narrow. This is not a style pass and it must not become
// one: it exists to catch the class of defect that shipped an undeclared
// identifier into a core flow, where the failure was a runtime ReferenceError
// under "use strict" that no amount of reading the diff revealed.
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',       // the app is a classic inline <script>, not a module
      globals: {
        // Browser surface the app actually uses. Anything not listed here and
        // not declared in the file is exactly what we want reported.
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', location: 'readonly', history: 'readonly',
        console: 'readonly', fetch: 'readonly', caches: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', requestAnimationFrame: 'readonly',
        performance: 'readonly', Notification: 'readonly', Intl: 'readonly',
        // Added when renderCalendar() began reading --heat-max at render time.
        // Flagged by this very check, which is the point of it.
        getComputedStyle: 'readonly',
        Blob: 'readonly', URL: 'readonly', FileReader: 'readonly',
        KeyboardEvent: 'readonly', ErrorEvent: 'readonly', Event: 'readonly',
        Storage: 'readonly', matchMedia: 'readonly', alert: 'readonly',
        firebase: 'readonly'      // loaded at runtime only when Cloud Sync is configured
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      // The rule this whole check exists for.
      'no-undef': 'error',

      // Adjacent classes of the same failure: something that reads as working
      // code but cannot work.
      'no-const-assign': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-func-assign': 'error',
      'no-obj-calls': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-unsafe-negation': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-cond-assign': 'error',
      'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error',
      'no-sparse-arrays': 'error',
      'no-fallthrough': 'error',

      // Temporal dead zone. Two defects in this project's history were a `let`
      // declared below the line that first reached it, so this is worth seeing —
      // but it is a WARNING, not an error, and deliberately so.
      //
      // The rule cannot distinguish a module-level statement that really does
      // execute before the declaration from a reference inside a function that
      // only runs later. In this file every current hit is the latter: todayISO
      // inside click handlers, onOk/onCancel inside a cleanup closure, editCtx
      // assigned from deferred handlers. All safe. Making them errors would
      // force a reorder sweep across the file that removes no risk, and would
      // train everyone to ignore the output — which costs more than the rule
      // is worth.
      //
      // The real TDZ failures were boot crashes, and V1 (run the four write
      // flows with the console visible) catches those directly. This rule is
      // the second line, not the first.
      'no-use-before-define': ['warn', { functions: false, classes: false, variables: true }],

      // Deliberately NOT enabled: style, formatting, complexity, unused vars.
      // A check that reports things nobody intends to fix gets ignored, and an
      // ignored check is worse than none.
      'no-unused-vars': 'off'
    }
  }
];
