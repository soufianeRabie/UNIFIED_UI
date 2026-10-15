#!/usr/bin/env node
/**
 * i18n gate — docs/architecture/06-quality-gates.md.
 *
 * Fails (exit 1) when a translation key used in src/app is missing from any
 * locale in public/i18n. Reports, without failing:
 *   - generated keys (DOM_FALLBACK.*, AUTO_INLINE_*) that must be renamed when
 *     their screen is migrated (03 §2),
 *   - keys present in a locale but never used.
 *
 * A "used key" is any quoted UPPER_SNAKE dotted literal in a .ts/.html file,
 * e.g. 'SECU.USERS.TITLE'. Keys built dynamically must be listed in
 * DYNAMIC_KEY_PREFIXES so they are not reported as unused.
 *
 * Usage: node scripts/check-i18n.mjs [--json]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIR = join(ROOT, 'src', 'app');
const LOCALE_DIR = join(ROOT, 'public', 'i18n');
const LOCALES = ['en', 'fr'];
const KEY_PATTERN = /['"`]([A-Z][A-Z0-9_]*(?:\.[A-Z0-9_]+)+)['"`]/g;
const GENERATED_PATTERN = /^(DOM_FALLBACK|AUTO_INLINE_[A-Z_]+)\./;
const DYNAMIC_KEY_PREFIXES = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

function flatten(node, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, path, out);
    else out.set(path, value);
  }
  return out;
}

const used = new Map(); // key -> first file:line
for (const file of walk(SOURCE_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const match of line.matchAll(KEY_PATTERN)) {
      if (!used.has(match[1])) used.set(match[1], `${relative(ROOT, file)}:${i + 1}`);
    }
  });
}

const locales = Object.fromEntries(
  LOCALES.map((lang) => [
    lang,
    flatten(JSON.parse(readFileSync(join(LOCALE_DIR, `${lang}.json`), 'utf8'))),
  ]),
);

const missing = {};
for (const lang of LOCALES) {
  missing[lang] = [...used.keys()].filter((key) => !locales[lang].has(key)).sort();
}
const generated = [...used.keys()].filter((key) => GENERATED_PATTERN.test(key));
const unused = {};
for (const lang of LOCALES) {
  unused[lang] = [...locales[lang].keys()].filter(
    (key) => !used.has(key) && !DYNAMIC_KEY_PREFIXES.some((p) => key.startsWith(p)),
  );
}

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify({ used: Object.fromEntries(used), missing, generated, unused }, null, 2),
  );
} else {
  console.log(`i18n: ${used.size} keys used in src/app`);
  for (const lang of LOCALES) {
    console.log(`  ${lang}: ${missing[lang].length} missing, ${unused[lang].length} unused`);
    for (const key of missing[lang]) console.log(`    ✗ ${key}  (${used.get(key)})`);
  }
  console.log(`  generated keys still in use (rename on migration): ${generated.length}`);
}

process.exitCode = LOCALES.some((lang) => missing[lang].length > 0) ? 1 : 0;
