#!/usr/bin/env node
/**
 * Builds a tiny site that forwards every old GitHub Pages URL
 * (https://tengdu.github.io/lounge/...) to the same page on the new origin.
 *
 *   node scripts/make-redirect-site.mjs <built out/ dir> <target origin> <dest dir>
 *
 * GitHub Pages cannot send real 301s, so each page carries a meta refresh,
 * a canonical link (which is what search engines follow to move rankings)
 * and a JS redirect that keeps the query string and hash. 404.html catches
 * anything not enumerated, e.g. old links with typos or removed lounges.
 */
import fs from "node:fs";
import path from "node:path";

const [outDir, targetArg, destDir] = process.argv.slice(2);
if (!outDir || !targetArg || !destDir) {
  console.error("usage: make-redirect-site.mjs <out dir> <target origin> <dest dir>");
  process.exit(1);
}
const target = targetArg.replace(/\/+$/, "");
if (!/^https:\/\//.test(target)) {
  console.error(`target must be an https origin, got ${targetArg}`);
  process.exit(1);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function page(to) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lounge has moved</title>
<link rel="canonical" href="${esc(to)}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>location.replace(${JSON.stringify(to)} + location.search + location.hash)</script>
</head>
<body style="font:16px system-ui;padding:40px">
<p>Lounge has moved to <a href="${esc(to)}">${esc(to)}</a>.</p>
</body>
</html>
`;
}

const NOT_FOUND = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lounge has moved</title>
<meta name="robots" content="noindex">
<script>
  // /lounge/<rest> on github.io becomes /<rest> on the new origin.
  var rest = location.pathname.replace(/^\\/lounge(?=\\/|$)/, "");
  location.replace(${JSON.stringify(target)} + (rest || "/") + location.search + location.hash);
</script>
</head>
<body style="font:16px system-ui;padding:40px">
<p>Lounge has moved to <a href="${esc(target)}/">${esc(target)}</a>.</p>
</body>
</html>
`;

let count = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_next") continue;
      walk(full);
      continue;
    }
    if (!entry.name.endsWith(".html") || entry.name === "404.html" || entry.name.startsWith("_not-found")) continue;

    const rel = path.relative(outDir, full).split(path.sep).join("/");
    const route = rel === "index.html" ? "/" : "/" + rel.replace(/(\/index)?\.html$/, "");
    const dest = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, page(target + route));
    count++;
  }
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });
walk(outDir);
fs.writeFileSync(path.join(destDir, "404.html"), NOT_FOUND);
// Stop Jekyll from hiding anything.
fs.writeFileSync(path.join(destDir, ".nojekyll"), "");
console.log(`Wrote ${count} redirect pages + 404.html to ${destDir} → ${target}`);
