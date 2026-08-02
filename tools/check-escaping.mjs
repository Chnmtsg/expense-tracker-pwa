// V2 predicate for the escaping class.
//
// The claim "every record field interpolated into markup is escaped" is not a
// claim, it is a search. This is that search. A previous commit asserted the
// class was closed after fixing 33 sites; nine remained, because the assertion
// was never expressed as something that could be re-run and return zero.
//
// SCOPE — deliberately narrow, and the narrowing is the point.
//
// The defect class is record data interpolated inside an HTML *attribute
// value*, where a quote in the data closes the attribute early and everything
// after it is parsed as markup. That is what turns an imported backup into
// script execution.
//
// Text-content interpolation is a different and lesser question: a quote there
// is just a quote.
//
// WHAT KEEPS THOSE SITES SAFE — and this paragraph used to be wrong, which is
// why it is now specific. It said they were "covered by escapeHTML() already,
// and the remainder are fmt()/fmtCompact() output". At least three are neither:
// the recurring badge interpolates x.recFrequency and x.recEndDate, the goal
// deadline pill interpolates g.deadline, and the goal schedule line
// interpolates a label derived from g.recFrequency.
//
// None is exploitable, but not for the reason that was written down. They are
// safe because the IMPORT VALIDATORS constrain those particular fields —
// isRecFrequency() restricts the frequency to four literals and ISO_DATE_RE
// restricts every date — so the values reaching those templates cannot contain
// markup. The safety comes from the validators, not from a wrapper.
//
// The practical consequence for anyone extending those templates: a new field
// interpolated into text content must either be escaped or be validated on the
// way in. Assuming this file covers it is the mistake. It does not look at text
// content at all.
//
// A first version of this check matched every interpolation in every template
// and reported 101 sites, nearly all safe. A check that reports things nobody
// will action gets ignored, and an ignored check is worse than none — so this
// one answers exactly the question CODE-02 asked.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'expense-pwa', 'index.html');
const lines = readFileSync(file, 'utf8').split('\n');

// An attribute assignment whose value contains an interpolation:  foo="...${x}..."
const ATTR_WITH_INTERP = /[\w-]+\s*=\s*"[^"]*\$\{[^}]*\}[^"]*"/g;

// Functions whose output is controlled and cannot carry a quote.
// recInterval() is here for the same reason fmt() is: it returns a clamped
// integer, so its output cannot carry a quote no matter what the store holds.
const SAFE_WRAPPER = /^(?:escapeHTML|fmt|fmtCompact|fmtCurrency|categoryColor|encodeURIComponent|recInterval)\s*\(/;

// A numeric expression cannot produce a quote. Percentages, opacities and
// dash-array values are computed, never stored.
const NUMERIC = /\.toFixed\s*\(|^\s*\d/;

const hits = [];
lines.forEach((line, i) => {
  const attrs = line.match(ATTR_WITH_INTERP);
  if (!attrs) return;

  for (const attr of attrs) {
    const interpolations = attr.match(/\$\{[^}]*\}/g) || [];
    for (const raw of interpolations) {
      const expr = raw.slice(2, -1).trim();
      if (SAFE_WRAPPER.test(expr)) continue;
      if (NUMERIC.test(expr)) continue;
      // Skip an expression with no property access in it.
      //
      // The reason this rule USED to give — "record data reaches markup
      // through a property access" — is not true, and stating it that way
      // invited the next reader to trust the rule further than it goes. A
      // record value that has been destructured or aliased into a bare
      // identifier reaches markup with no dot in sight, and this skips it.
      // index.html's `data-qa-set="${a}"` is exactly that: `a` is an element
      // of db.settings.quickAmounts, mapped out of the store. It is safe, but
      // not because of anything this predicate checked — importProblem()
      // constrains every quick amount to a finite positive number, which is
      // the same "the validators, not the wrapper" argument this tool's own
      // header makes about a different set of sites.
      //
      // Narrowness worth knowing rather than fixing: ATTR_WITH_INTERP matches
      // double-quoted attribute values only, so a single-quoted one would be
      // invisible here. There are none today.
      if (!/\w\.\w/.test(expr)) continue;
      // A ternary whose branches are both string literals is controlled by the
      // code no matter what the condition reads — the output is one of two
      // values written here, not anything from the store.
      if (/\?\s*'[^']*'\s*:\s*'[^']*'\s*$/.test(expr)) continue;
      hits.push({ line: i + 1, attr: attr.slice(0, 70), expr });
    }
  }
});

for (const h of hits) {
  console.log(`expense-pwa/index.html:${h.line}  \${${h.expr}}`);
  console.log(`    in  ${h.attr}`);
}
console.log('');
console.log(`escaping predicate: ${hits.length} unescaped record interpolation(s) in attribute values`);
process.exit(hits.length > 0 ? 1 : 0);
