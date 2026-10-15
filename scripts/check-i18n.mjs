#!/usr/bin/env node
/**
 * i18n gate — docs/architecture/06-quality-gates.md.
 *
 * Languages come from public/i18n/languages.json (ADR 0006). Fails (exit 1) when
 *   - the registry is inconsistent (default/fallback not enabled, file missing),
 *   - an ENABLED language is missing a key used in src/app.
 * Reports, without failing:
 *   - coverage of DISABLED languages (being translated),
 *   - generated keys (DOM_FALLBACK.*, AUTO_INLINE_*) that must be renamed when
 *     their screen is migrated (03 §2),
 *   - keys present in a locale but never used.
 *
 * A "used key" is any quoted UPPER_SNAKE dotted literal in a .ts/.html file
 * of src/app or projects/s-ui (the library's own `S.*` labels),
 * e.g. 'SECU.USERS.TITLE'. Keys built dynamically must be listed in
 * DYNAMIC_KEY_PREFIXES so they are not reported as unused.
 *
 * Error codes (ADR 0009): a literal of an ERROR_CODE_AREAS area ('QUERY.RANGE_INVERTED') is a server
 * error code, not a key — it requires the key `ERRORS.<code>`. Every `ERRORS.*` key of the default
 * language must also exist in every enabled language (codes arrive from the server at run time).
 *
 * Usage: node scripts/check-i18n.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIRS = [join(ROOT, 'src', 'app'), join(ROOT, 'projects', 's-ui', 'src')];
const LOCALE_DIR = join(ROOT, 'public', 'i18n');
const KEY_PATTERN = /['"`]([A-Z][A-Z0-9_]*(?:\.[A-Z0-9_]+)+)['"`]/g;
const GENERATED_PATTERN = /^(DOM_FALLBACK|AUTO_INLINE_[A-Z_]+)\./;
const DYNAMIC_KEY_PREFIXES = ['ERRORS.'];
/** Server error-code areas whose codes the UI also emits itself (client-side mirrors of server rules). */
const ERROR_CODE_AREAS = ['QUERY']; // not COMMON/SECU/NOTIF: those prefixes are also UI key namespaces
const toKey = (literal) =>
  ERROR_CODE_AREAS.includes(literal.split('.')[0]) ? `ERRORS.${literal}` : literal;

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
for (const file of SOURCE_DIRS.flatMap((dir) => walk(dir))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const match of line.matchAll(KEY_PATTERN)) {
      const key = toKey(match[1]);
      if (!used.has(key)) used.set(key, `${relative(ROOT, file)}:${i + 1}`);
    }
  });
}

const registry = JSON.parse(readFileSync(join(LOCALE_DIR, 'languages.json'), 'utf8'));
const errors = [];
const enabledCodes = registry.languages.filter((l) => l.enabled).map((l) => l.code);
const disabledCodes = registry.languages.filter((l) => !l.enabled).map((l) => l.code);
for (const role of ['defaultLanguage', 'fallbackLanguage']) {
  if (!enabledCodes.includes(registry[role]))
    errors.push(`${role} "${registry[role]}" is not an enabled language`);
}
const loadLocale = (code) => {
  const file = join(LOCALE_DIR, `${code}.json`);
  if (!existsSync(file)) return null;
  return flatten(JSON.parse(readFileSync(file, 'utf8')));
};

// Error messages are looked up by code at run time: the default language's ERRORS.* set is the reference.
for (const key of loadLocale(registry.defaultLanguage)?.keys() ?? []) {
  if (key.startsWith('ERRORS.') && !used.has(key))
    used.set(key, `public/i18n/${registry.defaultLanguage}.json`);
}

const locales = {};
const missing = {};
const unused = {};
for (const code of enabledCodes) {
  locales[code] = loadLocale(code);
  if (!locales[code]) {
    errors.push(`enabled language "${code}" has no file public/i18n/${code}.json`);
    continue;
  }
  missing[code] = [...used.keys()].filter((key) => !locales[code].has(key)).sort();
  unused[code] = [...locales[code].keys()].filter(
    (key) => !used.has(key) && !DYNAMIC_KEY_PREFIXES.some((p) => key.startsWith(p)),
  );
}
const coverage = {};
for (const code of disabledCodes) {
  const table = loadLocale(code);
  const done = table ? [...used.keys()].filter((key) => table.has(key)).length : 0;
  coverage[code] = {
    translated: done,
    total: used.size,
    percent: Math.floor((done / used.size) * 100),
  };
}
const generated = [...used.keys()].filter((key) => GENERATED_PATTERN.test(key));

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      { used: Object.fromEntries(used), errors, missing, unused, coverage, generated },
      null,
      2,
    ),
  );
} else {
  console.log(
    `i18n: ${used.size} keys used in src/app + projects/s-ui · enabled: ${enabledCodes.join(', ')}`,
  );
  for (const error of errors) console.log(`  ✗ ${error}`);
  for (const code of enabledCodes.filter((c) => missing[c])) {
    console.log(`  ${code}: ${missing[code].length} missing, ${unused[code].length} unused`);
    for (const key of missing[code]) console.log(`    ✗ ${key}  (${used.get(key)})`);
  }
  for (const [code, c] of Object.entries(coverage)) {
    console.log(
      `  ${code} (disabled): ${c.percent}% translated (${c.translated}/${c.total}) — enable when 100%`,
    );
  }
  console.log(`  generated keys still in use (rename on migration): ${generated.length}`);
}

const failed = errors.length > 0 || enabledCodes.some((code) => (missing[code] ?? []).length > 0);
process.exitCode = failed ? 1 : 0;
