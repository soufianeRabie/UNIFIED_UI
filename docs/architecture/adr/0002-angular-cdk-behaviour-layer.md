# ADR 0002 — Angular CDK as the behaviour layer; PrimeNG phased out

- **Status:** Accepted · 2026-10-14
- **Context:** Today's screens use PrimeNG with the Lara theme, overridden by hundreds of `!important` rules to look custom. A design system needs full control of markup and styles, but overlays, focus trapping, keyboard handling and virtual scrolling are hard to get right by hand.
- **Decision:** `@s/ui` uses `@angular/cdk` (dialog, overlay, a11y, scrolling, table where useful) for behaviour and owns 100% of markup and styles — the same split KAFALA makes with Radix. New code does not import PrimeNG. Existing PrimeNG usages are removed screen by screen during migration.
- **Consequences:** No theme fighting, smaller CSS, accessible primitives maintained by the Angular team. We write more component code ourselves (combobox, date picker) — accepted, because those are exactly the components that carry the brand.
