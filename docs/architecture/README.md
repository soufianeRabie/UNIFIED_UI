# Unified UI — Architecture Handbook

This handbook is the contract for every line of front-end code in this repository.
Code review enforces it; tooling (ESLint, Stylelint, tests, budgets) automates as much of it as possible.
When the code and this handbook disagree, the code is wrong — or the handbook is changed first, through an ADR.

| # | Document | Read it when |
|---|----------|--------------|
| 01 | [Architecture](01-architecture.md) | You need to know where code lives and what may import what |
| 02 | [Design system (`@s/ui`)](02-design-system.md) | You build or change a shared component |
| 03 | [Angular standards](03-angular-standards.md) | You write any TypeScript or template |
| 04 | [Styling](04-styling.md) | You write any CSS/SCSS |
| 05 | [Feature blueprint](05-feature-blueprint.md) | You build or migrate a screen |
| 06 | [Quality gates](06-quality-gates.md) | You open or review a pull request |
| 07 | [Migration plan](07-migration-plan.md) | You need to know what is being done next |
| ADR | [Decision records](adr/) | You want the *why* behind a rule |

## The ten rules

1. **One responsibility per file.** A component is a folder: `.ts`, `.html`, `.scss`, `.spec.ts`. Types, DTOs, mappers and constants live in their own files.
2. **Dependencies point inward.** `features → ui/data-access → domain`, and everything may use `@s/ui`. Nothing imports "upwards" or across domains. ([01](01-architecture.md))
3. **Screens are composed, never styled.** A page uses `@s/ui` components. No inline `style`, no ad-hoc layout CSS in pages. ([04](04-styling.md))
4. **Tokens only.** No hex, rgb, raw `px` sizes, shadows or fonts outside `tokens.css`. ([04](04-styling.md))
5. **Wire types never reach the UI.** DTOs are mapped to domain models in `data-access`. ([05](05-feature-blueprint.md))
6. **Signals for state, RxJS for I/O.** Components read signals; HTTP stays in `data-access`. ([03](03-angular-standards.md))
7. **OnPush, standalone, `inject()`, signal inputs, built-in control flow.** No exceptions. ([03](03-angular-standards.md))
8. **No logic in templates.** Templates read signals/computed values; they do not call methods that compute. ([03](03-angular-standards.md))
9. **Every string is translated, every control is accessible.** WCAG 2.2 AA is the floor. ([02](02-design-system.md), [03](03-angular-standards.md))
10. **Nothing merges red.** Lint, style lint, types, tests and budgets pass, or the PR does not merge. ([06](06-quality-gates.md))
