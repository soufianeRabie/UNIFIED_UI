/**
 * Stylelint — enforces docs/architecture/04-styling.md.
 *
 * Everything reports as a warning. The gate is the npm script:
 *   lint:styles         strict folders (projects/s-ui, src/app/domains, src/app/core/shell)
 *                       with --max-warnings 0  → any finding fails the build
 *   lint:styles:legacy  the rest of src/ — report only, shrinks to zero by Phase 5
 * tokens.css is the only file allowed to hold raw values.
 */

const ARCHITECTURE_RULES = {
  // 04 §2.1 — no raw colours
  'color-no-hex': [true],
  'color-named': ['never'],
  'function-disallowed-list': [['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklch']],
  // 04 §2.1/2.2/2.5 — tokens for colour, type, radius, elevation, stacking
  'scale-unlimited/declaration-strict-value': [
    [
      '/color$/',
      'fill',
      'stroke',
      'font-family',
      'font-size',
      'border-radius',
      'box-shadow',
      'z-index',
    ],
    {
      ignoreValues: [
        'inherit',
        'initial',
        'unset',
        'currentColor',
        'currentcolor',
        'transparent',
        'none',
        '0',
        '1em',
        '50%',
        'auto',
      ],
      ignoreFunctions: false,
      disableFix: true,
    },
  ],
  // 04 §2.3 / 2.4 / 2.9
  'declaration-no-important': [true],
  'selector-pseudo-element-disallowed-list': [['ng-deep']],
  'selector-max-id': [0],
  'selector-max-compound-selectors': [3],
  // 04 §2.7 — logical properties
  'property-disallowed-list': [
    [
      '/^(margin|padding)-(left|right|top|bottom)$/',
      '/^border-(left|right|top|bottom)(-.+)?$/',
      'left',
      'right',
      'top',
      'bottom',
      'width',
      'height',
      'min-width',
      'max-width',
      'min-height',
      'max-height',
    ],
    { message: (p) => `Use the logical property instead of "${p}" (04 §2.7).` },
  ],
  'declaration-property-value-disallowed-list': [
    { 'text-align': ['left', 'right'], float: ['left', 'right'] },
  ],
};

/** @type {import('stylelint').Config} */
export default {
  defaultSeverity: 'warning',
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['dist/**', '.angular/**', 'node_modules/**', '.drafts/**', 'public/**'],
  rules: {
    // House style that differs from the standard config
    'selector-class-pattern': null, // BEM-ish names like .s-btn-primary in legacy, :host attribute selectors in new code
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'declaration-empty-line-before': null,
    'comment-empty-line-before': null,
    'no-descending-specificity': null,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['host', 'host-context'] }],
    'selector-type-no-unknown': [true, { ignore: ['custom-elements'] }],
    // Compact one-line variant rules (`:host([data-tone="x"]) { … }`) are house style.
    'declaration-block-single-line-max-declarations': null,
    'rule-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'value-keyword-case': ['lower', { ignoreProperties: ['font-family', '/^--font-/'] }],
    ...ARCHITECTURE_RULES,
  },
  overrides: [
    {
      // The one file that owns raw values.
      files: ['projects/s-ui/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
};
