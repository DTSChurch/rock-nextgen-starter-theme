// Layout binding gate. Run with `npm run check`.
//
// <%# expr %> is a DATABINDING expression. It only evaluates when DataBind() is
// called on the containing control. Rock's RockPage databinds the <head> —
// which is why <%# ResolveRockUrl(...) %> works there — but nothing databinds
// arbitrary <body> markup, so the identical syntax silently renders src="".
// A theme that loads its scripts from the body ships <script src=""> with no
// error or warning anywhere; if a stylesheet then hides content pending a
// script (e.g. an animation library's opacity:0), whole pages render blank.
//
// THE RULE, taken from Rock's own RockNextGen/Layouts/Site.Master:
//   external scripts and stylesheets belong in the <head>, loaded with
//   <%# ResolveRockUrl("~~/...", true) %>, using `defer` for scripts that
//   need the DOM. The body holds only inline <script> blocks.

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../Layouts/Site.Master', import.meta.url), 'utf8');
const headEnd = src.toLowerCase().indexOf('</head>');

if (headEnd === -1) {
  console.log('FAIL Site.Master has no </head> — cannot determine head/body split');
  process.exit(1);
}

const lineOf = i => src.slice(0, i).split('\n').length;
// Server comments <%-- ... --%> may legitimately discuss this syntax; ignore their contents.
const commentRanges = [...src.matchAll(/<%--[\s\S]*?--%>/g)].map(m => [m.index, m.index + m[0].length]);
const inComment = i => commentRanges.some(([a, b]) => i >= a && i < b);

let failed = 0;
const fail = (i, msg, detail) => {
  console.log(`FAIL L${lineOf(i)} ${msg}`);
  if (detail) console.log(`       ${detail}`);
  failed++;
};

// 1. No databinding expressions in the body — they render empty.
for (const m of src.matchAll(/<%#[\s\S]*?%>/g)) {
  if (m.index > headEnd && !inComment(m.index)) {
    fail(m.index, 'databinding expression in <body> — renders empty',
      `${m[0].replace(/\s+/g, ' ').slice(0, 90)}\n       move it to <head>; <%# %> only evaluates in a databound container`);
  }
}

// 2. No external scripts in the body at all — head + defer is the pattern.
for (const m of src.matchAll(/<script[^>]*\ssrc\s*=[^>]*>/gi)) {
  if (m.index > headEnd && !inComment(m.index)) {
    fail(m.index, 'external <script src> in <body> — belongs in <head> with defer',
      m[0].replace(/\s+/g, ' ').slice(0, 90));
  }
}

// 3. The symptom itself: an empty src anywhere.
for (const m of src.matchAll(/<script[^>]*\ssrc\s*=\s*(""|''|"\s+"|'\s+')[^>]*>/gi)) {
  if (!inComment(m.index)) fail(m.index, '<script> with empty src');
}

// 4. No hardcoded /Themes/<Name>/ asset paths — they break the moment the
//    theme folder is renamed. Use ResolveRockUrl("~~/...") instead.
for (const m of src.matchAll(/\s(?:src|href)\s*=\s*"(\/Themes\/[^"]+)"/gi)) {
  if (!inComment(m.index)) {
    fail(m.index, `hardcoded theme path (breaks on folder rename): ${m[1]} — use ResolveRockUrl("~~/...")`);
  }
}

// 5. Head scripts that need the DOM must be deferred, or they run before it exists.
const headSrc = src.slice(0, headEnd);
for (const m of headSrc.matchAll(/<script(?![^>]*\bdefer\b)[^>]*\ssrc\s*=\s*"[^"]*~~\/[^"]*"[^>]*>/gi)) {
  if (inComment(m.index)) continue;
  fail(m.index, 'theme script in <head> without defer — runs before the DOM exists',
    m[0].replace(/\s+/g, ' ').slice(0, 90));
}

console.log(failed
  ? `\n${failed} failure(s) — see messages above`
  : 'PASS scripts load from <head> via ResolveRockUrl with defer; no databinding in <body>');
process.exit(failed ? 1 : 0);
