# 06 — Quality gates

A pull request merges only when every gate is green. Gates run locally (`npm run verify`) and in CI.

## 1. Automated gates

| Gate                  | Tool                                  | Fails when                                                                          |
| --------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| Format                | Prettier                              | any file is not formatted                                                           |
| Lint (TS + templates) | ESLint + `angular-eslint`             | any rule in §2 is violated                                                          |
| Architecture          | `eslint-plugin-boundaries`            | an import breaks the layer rules in [01](01-architecture.md)                        |
| Styles                | Stylelint                             | raw colours, `!important`, `::ng-deep`, numeric `z-index` (see [04](04-styling.md)) |
| Types                 | `ng build` (strict templates)         | any type error                                                                      |
| Unit tests            | Vitest via `@angular/build:unit-test` | a test fails or coverage drops below thresholds                                     |
| i18n                  | `scripts/check-i18n.mjs`              | a key used in code is missing from `en.json` or `fr.json`                           |
| Bundle                | `angular.json` budgets                | initial > 1 MB, any lazy chunk > 300 kB, component style > 6 kB                     |

## 2. Key lint rules

Configured in `eslint.config.mjs` and `stylelint.config.mjs`. **Strict** folders (`projects/s-ui`, `src/app/domains`, and for styles `src/app/core/shell`) run with `--max-warnings 0`; legacy folders produce a report only (`npm run lint:legacy`, `npm run lint:styles:legacy`) until Phase 5.

- Angular: `prefer-standalone`, `prefer-on-push-component-change-detection`, `prefer-signals`, `prefer-inject`, `prefer-output-readonly`, `no-input-rename`, `no-output-native`, `use-component-view-encapsulation`, `component-max-inline-declarations` (0 lines of inline template/styles), selector prefixes `s`, `app`, `secu`, `notif`
- Templates: `prefer-control-flow`, `no-inline-styles` (incl. `[style]` / `ngStyle`), `button-has-type`, `alt-text`, `elements-content`, `label-has-associated-control`, `interactive-supports-focus`, `click-events-have-key-events`, `no-any`, `eqeqeq`
- TypeScript: `no-explicit-any`, `no-non-null-assertion`, `consistent-type-imports` (strict folders only)
- Restricted syntax: default exports, `@Input/@Output/@ViewChild…` decorators, `console.*`
- Restricted imports: `@angular/common/http` and `**/dto/**` outside `data-access`; `primeng` in new code; inside `@s/ui` no `@s/ui` self-import, no ngx-translate/HTTP/PrimeNG
- Architecture: `boundaries/dependencies` with the policies of [01 §3](01-architecture.md)
- File size: `max-lines` 300 (TS) / 200 (HTML)

**Review-only** (not machine-checkable reliably): "no compute methods in templates" ([03 §2](03-angular-standards.md)) — the linter cannot tell a signal read `users()` from a method call `isActive(row)`.

## 3. Coverage thresholds

| Scope                                     | Lines                           | Branches |
| ----------------------------------------- | ------------------------------- | -------- |
| `projects/s-ui`                           | 85%                             | 75%      |
| `domains/*/data-access` (mappers, stores) | 90%                             | 80%      |
| `domains/*/features`                      | smoke tests required, no % gate |

## 4. Pull request checklist

- [ ] Title follows Conventional Commits (`feat(security): …`, `fix(s-ui): …`, `refactor:`, `docs:`).
- [ ] Screenshots light + dark for any visual change.
- [ ] New UI text has keys in both languages.
- [ ] No new dependency without an ADR.
- [ ] Docs updated if a rule or public API changed.

## 5. Definition of done

Feature works end to end against the real API, passes all gates, is keyboard-accessible, translated in EN and FR, and has been reviewed by one other developer.
