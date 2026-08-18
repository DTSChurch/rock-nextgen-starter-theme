// Theme consistency gate. Run with `npm run check` after `npm run build`.
//
// Asserts three contracts that fail silently at runtime if broken:
//
// 1. MARKERS — Rock's ThemeOverrideBuilder rewrites theme.css in place using
//    four exact literal markers. If any is missing or reworded (the classic
//    mistake is dropping the word "Start"), Rock's strip regex matches zero
//    bytes and nothing configured in the admin fields editor ever reaches the
//    browser — including the brand's primary color.
//
// 2. TOKEN SYNC — every theme.json field `default` must match the value
//    declared in Styles/_tokens.scss. core.css declares every --base-* token
//    itself, so a var() fallback aimed at a core token is dead code; _tokens'
//    :root declarations are the only thing making theme.json defaults real.
//
// 3. IMPORT ORDER — dart-sass passes a literal ".css" @import through
//    verbatim. Browsers silently DROP any CSS @import that appears after the
//    first style rule, which reads as "the token system isn't loading" with no
//    error anywhere. Verify every @import in the compiled file precedes the
//    first rule.

import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// SCSS `//` comments never reach the compiled output, and this repo's doc
// comments legitimately quote marker literals and token examples — strip them
// before analyzing source files.
const stripLineComments = src => src.replace(/^\s*\/\/.*$/gm, '').replace(/([^:])\/\/[^\n]*/g, '$1');

let failed = 0;
const fail = msg => { console.log(`FAIL ${msg}`); failed++; };
const pass = msg => console.log(`PASS ${msg}`);

// --- 1. Markers --------------------------------------------------------------

const MARKERS = [
  '/* CSS Overrides Top Start */',
  '/* CSS Overrides Top End */',
  '/* CSS Overrides Bottom Start */',
  '/* CSS Overrides Bottom End */',
];

for (const file of ['Styles/theme.scss', 'Styles/theme.css']) {
  const src = file.endsWith('.scss') ? stripLineComments(read(file)) : read(file);
  for (const marker of MARKERS) {
    const count = src.split(marker).length - 1;
    if (count !== 1) {
      fail(`${file}: marker ${JSON.stringify(marker)} appears ${count} time(s), expected exactly 1`);
    }
  }
}
if (!failed) pass('all four Rock override markers present exactly once in theme.scss and theme.css');

// --- 2. theme.json defaults vs _tokens.scss -----------------------------------

const themeJson = JSON.parse(read('theme.json'));
const tokensSrc = stripLineComments(read('Styles/_tokens.scss'));

// Collect { variable, default } leaf fields from all panels.
const fields = [];
const walk = list => {
  for (const field of list ?? []) {
    if (field.type === 'panel') walk(field.fields);
    else if (field.variable && field.default !== undefined) fields.push(field);
  }
};
walk(themeJson.fields);

// Variables whose defaults are file paths (image fields) are consumed as
// var() fallbacks in _theme.scss rather than declared on :root — the fallback
// is genuinely reachable because core.css never defines them.
const NOT_DECLARED_ON_ROOT = new Set(['logo-image']);

const declared = new Map();
for (const m of tokensSrc.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
  if (!declared.has(m[1])) declared.set(m[1], m[2].trim());
}

const norm = v => v
  .toLowerCase()
  .replace(/["']/g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*,\s*/g, ',')
  .replace(/\s*\/\s*/g, '/')
  .trim();

let tokenFailures = 0;
for (const field of fields) {
  if (NOT_DECLARED_ON_ROOT.has(field.variable)) continue;
  const value = declared.get(field.variable);
  if (value === undefined) {
    fail(`theme.json variable "${field.variable}" is not declared in _tokens.scss — its default is not authoritative`);
    tokenFailures++;
  } else if (norm(value) !== norm(String(field.default))) {
    fail(`--${field.variable}: theme.json default ${JSON.stringify(field.default)} != _tokens.scss ${JSON.stringify(value)}`);
    tokenFailures++;
  }
}
if (!tokenFailures) pass(`${fields.length} theme.json variable(s) checked against _tokens.scss`);

// --- 3. compiled @import order -------------------------------------------------

const compiled = read('Styles/theme.css');
const firstRule = compiled.indexOf('{');
let importFailures = 0;
for (const m of compiled.matchAll(/@import\b[^;]*;/g)) {
  if (firstRule !== -1 && m.index > firstRule) {
    fail(`theme.css: @import after the first style rule is silently dropped by browsers: ${m[0].slice(0, 80)}`);
    importFailures++;
  }
}
if (!importFailures) pass('every @import in compiled theme.css precedes the first style rule');

console.log(failed ? `\n${failed} failure(s)` : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);
