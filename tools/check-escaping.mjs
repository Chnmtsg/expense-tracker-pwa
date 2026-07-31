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
// is just a quote. Those sites are covered by escapeHTML() already where the
// value is free text, and the remainder are fmt()/fmtCompact() output, which is
// a formatted number.
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
const SAFE_WRAPPER = /^(?:escapeHTML|fmt|fmtCompact|fmtCurrency|categoryColor|encodeURIComponent)\s*\(/;

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
      // Record data reaches markup through a property access. Bare loop
      // counters and literals from fixed in-code arrays cannot carry a quote.
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
