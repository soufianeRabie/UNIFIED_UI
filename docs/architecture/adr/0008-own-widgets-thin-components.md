# ADR 0008 — Every widget is ours; components stay thin

- **Status:** Accepted · 2026-10-15
- **Context:** Native and third-party widgets (browser date pickers, PrimeNG selects and calendars) look different in every browser, cannot be themed to the dossier language, behave differently in RTL, and drift visually from the rest of the system. Separately, today's screens pack HTTP, state, validation, formatting and markup into single 400+ line components that cannot be tested or reused.
- **Decision:**
  1. **Own widgets.** Select, multi-select, calendar, date and date-range pickers, popovers, menus, column filters and every future control are built in `@s/ui` with our markup, our tokens and our dimensions. Behaviour primitives come only from `@angular/cdk` (overlay, a11y focus/keyboard, listbox patterns). No native `<input type="date">`, no PrimeNG, no other UI kit.
  2. **Dates through `Intl`.** Month and weekday names, first day of week and number formats come from the active locale (`Intl.DateTimeFormat`, `Intl.Locale`), so every language — including RTL — is correct without translations of calendar text.
  3. **Thin components.** A component class only wires: inputs, outputs, injected services, and `computed()` view models that **call pure functions**. Any logic with a branch worth testing (date math, operator rules, query updates, formatting, validation) lives in a sibling pure file (`*.utils.ts`) or a store, with its own unit tests.
  4. **Limits (enforced in review, ESLint `max-lines`):** component `.ts` ≤ 120 lines soft / 200 hard; a pure-function file ≤ 200 lines; a store ≤ 250.
- **Consequences:** More code in `@s/ui`, all of it ours to shape; consistent look in every browser, theme and direction. Logic gets fast unit tests independent of the DOM. Reviews reject components that compute, and widgets imported from outside `@s/ui`.
