# ADR 0010 — The design system is three packages: tokens, a framework-free core, and per-framework components

- **Status:** Accepted · 2026-10-16
- **Context:** The owner wants the design system usable later from React / Next.js apps, not only Angular. `@s/ui` components are Angular and cannot run in React; but most of their value — tokens, the query model, filter conversions, date and calendar maths, select and table logic, label keys — is already plain TypeScript and CSS (ADR 0008 kept components thin for this reason).
- **Decision:**
  1. **`@s/tokens`** (`projects/s-tokens`): plain CSS — tokens, base, native-control skins, layer order. Loaded first by every app, any framework.
  2. **`@s/core`** (`projects/s-core`): plain TypeScript — `query/`, `date/`, `calendar/`, `select/`, `filter/`, `table/`, `i18n/` (label keys and English defaults). **No framework import** (`@angular/*`, `react`, `rxjs`… are lint errors); only relative imports inside. Unit tests live here.
  3. **`@s/ui`** (`projects/s-ui`): Angular components only — templates, styles, CDK behaviour, signals, forms integration — rendering on top of `@s/core` and `@s/tokens`. CDK-specific CSS (overlays) stays here.
  4. A future **`@s/react`** renders the same `@s/core` with React (behaviour from a headless library such as React Aria, as `@s/ui` uses the CDK) and the same `@s/tokens`; both UIs then look and behave the same, and a rule fixed in `@s/core` is fixed in both.
  5. Apps import logic and types from `@s/core` (`createQuery`, `SQueryField`, `SSelectOption`…) and components from `@s/ui`. `@s/ui` does not re-export `@s/core`.
- **Consequences:** Two imports instead of one in Angular screens. Logic cannot accidentally depend on Angular. Packaging (Phase 6) publishes three packages; `@s/ui` depends on `@s/core` and `@s/tokens`.
