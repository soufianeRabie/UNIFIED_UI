# 06 — Quality gates

A pull request merges only when every gate is green. Gates run locally (`npm run verify`) and in CI.

## 1. Automated gates

| Gate | Tool | Fails when |
|---|---|---|
| Format | Prettier | any file is not formatted |
| Lint (TS + templates) | ESLint + `angular-eslint` | any rule in §2 is violated |
| Architecture | `eslint-plugin-boundaries` | an import breaks the layer rules in [01](01-architecture.md) |
| Styles | Stylelint | raw colours, `!important`, `::ng-deep`, numeric `z-index` (see [04](04-styling.md)) |
| Types | `ng build` (strict templates) | any type error |
| Unit tests | Vitest via `@angular/build:unit-test` | a test fails or coverage drops below thresholds |
| i18n | `scripts/check-i18n.mjs` | a key used in code is missing from `en.json` or `fr.json` |
| Bundle | `angular.json` budgets | initial > 1 MB, any lazy chunk > 300 kB, component style > 6 kB |

## 2. Key lint rules

- `@angular-eslint/prefer-on-push-component-change-detection`: error
- `@angular-eslint/prefer-signals`, `no-input-rename`, `no-output-native`: error
- `@angular-eslint/template/prefer-control-flow`, `no-inline-styles`, `no-call-expression` (except signal reads), `button-has-type`, `alt-text`, `elements-content`, `interactive-supports-focus`, `label-has-associated-control`: error
- `@angular-eslint/component-selector`: prefixes `s`, `app`, `secu`, `notif`
- `@typescript-eslint/no-explicit-any`, `no-non-null-assertion`: error
- `no-restricted-imports`: `@angular/common/http` outside `**/data-access/**`; `**/dto/**` outside `**/data-access/**`; `primeng/*` in new code
- `import/no-default-export`: error

## 3. Coverage thresholds

| Scope | Lines | Branches |
|---|---|---|
| `projects/s-ui` | 85% | 75% |
| `domains/*/data-access` (mappers, stores) | 90% | 80% |
| `domains/*/features` | smoke tests required, no % gate |

## 4. Pull request checklist

- [ ] Title follows Conventional Commits (`feat(security): …`, `fix(s-ui): …`, `refactor:`, `docs:`).
- [ ] Screenshots light + dark for any visual change.
- [ ] New UI text has keys in both languages.
- [ ] No new dependency without an ADR.
- [ ] Docs updated if a rule or public API changed.

## 5. Definition of done

Feature works end to end against the real API, passes all gates, is keyboard-accessible, translated in EN and FR, and has been reviewed by one other developer.
