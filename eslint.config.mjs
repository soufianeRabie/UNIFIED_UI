// @ts-check
/**
 * ESLint — enforces docs/architecture (03 Angular standards, 01 layer rules).
 *
 * Two regimes (docs/architecture/07-migration-plan.md, Phase 0):
 *   STRICT  projects/s-ui/** and src/app/domains/**   → errors
 *   LEGACY  everything else under src/app             → warnings, so the app keeps building
 *           while screens migrate. Move a file into domains/ and it becomes strict.
 */
import angular from 'angular-eslint';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

/** Same config objects with every rule downgraded to a warning (for legacy code). */
const asWarnings = (configs) =>
  configs.map((c) => ({
    ...c,
    rules: Object.fromEntries(
      Object.entries(c.rules ?? {}).map(([name, value]) => {
        const sev = Array.isArray(value) ? value[0] : value;
        if (sev === 'off' || sev === 0) return [name, value];
        return [name, Array.isArray(value) ? ['warn', ...value.slice(1)] : 'warn'];
      }),
    ),
  }));

const TS_PRESETS = [...tseslint.configs.recommended, ...angular.configs.tsRecommended];
const HTML_PRESETS = [
  ...angular.configs.templateRecommended,
  ...angular.configs.templateAccessibility,
];

/** Folders that already meet the handbook. Add a folder here once it is compliant. */
const STRICT_DIRS = [
  'projects/s-core',
  'projects/s-ui',
  'src/app/domains',
  'src/app/core/i18n',
  'src/app/core/query',
  'src/app/core/shell',
  'src/app/core/errors/app-error',
  'src/app/core/permissions',
  'src/app/dev',
];
const STRICT_TS = STRICT_DIRS.map((d) => `${d}/**/*.ts`);
const STRICT_HTML = STRICT_DIRS.map((d) => `${d}/**/*.html`);
const LEGACY_TS = ['src/app/**/*.ts'];
const LEGACY_HTML = ['src/app/**/*.html'];

/** Architecture elements — docs/architecture/01-architecture.md §2–3. */
const ELEMENTS = [
  // Element patterns match folders. Order matters: the first match wins, so the
  // specific layers come before the catch-alls (domain root, app root).
  { type: 's-core', pattern: 'projects/s-core/src' },
  { type: 's-ui', pattern: 'projects/s-ui/src' },
  { type: 'domain', pattern: 'src/app/domains/*/domain', capture: ['scope'] },
  { type: 'data-access', pattern: 'src/app/domains/*/data-access', capture: ['scope'] },
  { type: 'ui', pattern: 'src/app/domains/*/ui', capture: ['scope'] },
  { type: 'feature', pattern: 'src/app/domains/*/features', capture: ['scope'] },
  { type: 'domain-root', pattern: 'src/app/domains/*', capture: ['scope'] },
  { type: 'core', pattern: 'src/app/core' },
  { type: 'shared', pattern: 'src/app/shared' },
  { type: 'legacy', pattern: 'src/app/{secu,notif,features}' },
  { type: 'app', pattern: 'src/app' },
];

const SAME_SCOPE = { scope: '{{ from.element.captured.scope }}' };
const sameScope = (type) => ({ element: { type, captured: SAME_SCOPE } });
const anyOf = (...types) => ({ element: { types: { anyOf: types } } });

/** Who may import whom. Anything not allowed here is an error. */
const POLICIES = [
  { from: { element: { type: 's-core' } }, allow: { to: { element: { type: 's-core' } } } },
  { from: { element: { type: 's-ui' } }, allow: { to: anyOf('s-ui', 's-core') } },
  { from: { element: { type: 'core' } }, allow: { to: anyOf('core', 's-ui', 's-core') } },
  {
    from: { element: { type: 'shared' } },
    allow: { to: anyOf('shared', 'core', 's-ui', 's-core') },
  },
  { from: { element: { type: 'domain' } }, allow: { to: sameScope('domain') } },
  {
    from: { element: { type: 'data-access' } },
    allow: {
      to: [sameScope('data-access'), sameScope('domain'), anyOf('core', 's-core')],
    },
  },
  {
    from: { element: { type: 'ui' } },
    allow: {
      to: [
        sameScope('ui'),
        sameScope('domain'),
        { element: { type: 's-ui' } },
        { element: { type: 's-core' } },
      ],
    },
  },
  {
    from: { element: { type: 'feature' } },
    allow: {
      to: [
        sameScope('feature'),
        sameScope('ui'),
        sameScope('data-access'),
        sameScope('domain'),
        anyOf('shared', 'core', 's-ui', 's-core'),
      ],
    },
  },
  {
    from: { element: { type: 'domain-root' } },
    allow: {
      to: [
        sameScope('feature'),
        sameScope('data-access'),
        sameScope('domain'),
        sameScope('domain-root'),
        anyOf('shared', 'core', 's-ui', 's-core'),
      ],
    },
  },
  // Another domain is reachable only through its public index.ts (domain-root).
  {
    from: { element: { types: { anyOf: ['feature', 'domain-root'] } } },
    allow: { to: { element: { type: 'domain-root' } } },
  },
  {
    from: { element: { type: 'app' } },
    allow: { to: anyOf('app', 'core', 'shared', 'domain-root', 's-ui', 's-core', 'legacy') },
  },
  // Legacy code may import anything until it is migrated.
  {
    from: { element: { type: 'legacy' } },
    allow: { to: anyOf('legacy', 'core', 'shared', 's-ui', 's-core', 'domain-root') },
  },
];

const TS_RULES = (level) => ({
  '@angular-eslint/prefer-standalone': level,
  '@angular-eslint/prefer-on-push-component-change-detection': level,
  '@angular-eslint/prefer-signals': level,
  '@angular-eslint/prefer-output-readonly': level,
  '@angular-eslint/no-input-rename': level,
  '@angular-eslint/no-output-native': level,
  '@angular-eslint/use-component-view-encapsulation': level,
  '@angular-eslint/component-max-inline-declarations': [
    level,
    { template: 0, styles: 0, animations: 0 },
  ],
  '@angular-eslint/component-selector': [
    level,
    // Attribute selectors keep native semantics: <button s-button>, <input s-input>.
    { type: ['element', 'attribute'], prefix: ['s', 'app', 'secu', 'notif'], style: 'kebab-case' },
  ],
  '@angular-eslint/directive-selector': [
    level,
    { type: 'attribute', prefix: ['s', 'app', 'secu', 'notif'], style: 'camelCase' },
  ],
  '@typescript-eslint/no-explicit-any': level,
  '@typescript-eslint/no-non-null-assertion': level,
  // `_name`: required by a signature but intentionally unused (e.g. ngTemplateContextGuard).
  '@typescript-eslint/no-unused-vars': [
    level,
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  // Only where constructor injection is banned: `--fix` would turn DI constructor types into
  // `import type` and break injection at runtime in legacy code.
  '@typescript-eslint/consistent-type-imports':
    level === 'error' ? ['error', { fixStyle: 'inline-type-imports' }] : 'off',
  'no-restricted-syntax': [
    level,
    { selector: 'ExportDefaultDeclaration', message: 'Named exports only (ADR 0005).' },
    {
      selector:
        'Decorator[expression.callee.name=/^(Input|Output|ViewChild|ViewChildren|ContentChild|ContentChildren|HostBinding|HostListener)$/]',
      message: 'Use signal APIs / host metadata (03 §2).',
    },
    {
      selector: "CallExpression[callee.object.name='console']",
      message: 'Use the core logger (03 §2).',
    },
  ],
  'max-lines': [level, { max: 300, skipBlankLines: true, skipComments: true }],
});

const HTML_RULES = (level) => ({
  '@angular-eslint/template/prefer-control-flow': level,
  '@angular-eslint/template/no-inline-styles': [
    level,
    { allowNgStyle: false, allowBindToStyle: false },
  ],
  '@angular-eslint/template/button-has-type': level,
  '@angular-eslint/template/alt-text': level,
  '@angular-eslint/template/elements-content': level,
  '@angular-eslint/template/label-has-associated-control': level,
  '@angular-eslint/template/interactive-supports-focus': level,
  '@angular-eslint/template/click-events-have-key-events': level,
  '@angular-eslint/template/no-any': level,
  '@angular-eslint/template/eqeqeq': level,
  'max-lines': [level, { max: 200 }],
});

export default tseslint.config(
  { ignores: ['dist/**', '.angular/**', 'node_modules/**', 'public/**', '**/*.spec.ts.snap'] },

  // ---- TypeScript: shared setup ------------------------------------------
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    processor: angular.processInlineTemplates,
    plugins: { boundaries },
    settings: {
      'boundaries/elements': ELEMENTS,
      'boundaries/include': ['src/app/**/*', 'projects/s-ui/src/**/*', 'projects/s-core/src/**/*'],
      'import/resolver': {
        typescript: {
          project: ['tsconfig.app.json', 'tsconfig.spec.json'],
          noWarnOnMultipleProjects: true,
        },
      },
    },
  },

  // ---- LEGACY (warnings) ---------------------------------------------------
  {
    files: LEGACY_TS,
    ignores: STRICT_DIRS.map((d) => `${d}/**`),
    extends: asWarnings(TS_PRESETS),
    rules: {
      ...TS_RULES('warn'),
      'boundaries/dependencies': ['warn', { default: 'disallow', policies: POLICIES }],
    },
  },
  {
    files: LEGACY_HTML,
    ignores: STRICT_DIRS.map((d) => `${d}/**`),
    extends: asWarnings(HTML_PRESETS),
    rules: HTML_RULES('warn'),
  },

  // ---- STRICT (errors) -----------------------------------------------------
  {
    files: STRICT_TS,
    extends: TS_PRESETS,
    rules: {
      ...TS_RULES('error'),
      'boundaries/dependencies': ['error', { default: 'disallow', policies: POLICIES }],
    },
  },
  { files: STRICT_HTML, extends: HTML_PRESETS, rules: HTML_RULES('error') },

  // HTTP and wire types live in data-access only (05 §2).
  {
    files: ['src/app/domains/**/*.ts'],
    ignores: ['src/app/domains/*/data-access/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@angular/common/http', message: 'HTTP belongs in data-access/*-api.ts.' },
          ],
          patterns: [
            {
              group: ['**/dto/**', '**/*.dto'],
              message: 'DTOs never leave data-access; use domain models.',
            },
            { group: ['primeng', 'primeng/*'], message: 'New code uses @s/ui (ADR 0002).' },
          ],
        },
      ],
    },
  },
  // Every @s/ui attribute is kebab-case like its components: <input s-input>, <ng-template s-cell>.
  {
    files: ['projects/s-ui/**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 's', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['projects/s-ui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@s/ui', '@s/ui/*'], message: 'Inside @s/ui use relative imports.' },
            {
              group: ['primeng', 'primeng/*', '@ngx-translate/*', '@angular/common/http'],
              message: '@s/ui has no business/i18n/HTTP dependencies (02 §1).',
            },
          ],
        },
      ],
    },
  },

  // @s/core is framework-free (ADR 0010): it must run under Angular, React and Node alike.
  {
    files: ['projects/s-core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@s/core', '@s/core/*'], message: 'Inside @s/core use relative imports.' },
            {
              group: [
                '@angular/*',
                'react',
                'react-*',
                'rxjs',
                'rxjs/*',
                '@s/ui',
                'primeng',
                '@ngx-translate/*',
              ],
              message: '@s/core is framework-free: plain TypeScript only (ADR 0010).',
            },
          ],
        },
      ],
    },
  },

  // Tests may use any, non-null assertions and longer files; their small host
  // components keep the template inline, next to the assertions.
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@angular-eslint/component-max-inline-declarations': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines': 'off',
    },
  },
);
