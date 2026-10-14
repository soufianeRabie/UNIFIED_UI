# ADR 0001 — Design system as a library inside the app workspace

- **Status:** Accepted · 2026-10-14
- **Context:** The unified app needs its own visual identity (the KAFALA dossier language) and the components must be reusable by other Angular products later. A separate repository would slow iteration while the components are still being shaped by real screens.
- **Decision:** Build the design system as `projects/s-ui` (`@s/ui`) inside the `UNIFIED_UI` workspace, imported through a TypeScript path alias. It has its own `package.json` and `public-api.ts` from day one and may not import application code.
- **Consequences:** Components evolve together with the screens that use them, in one PR. Extraction (Phase 6) is a build-and-publish step, not a refactor. The boundary is enforced by lint, not by repository separation, so the lint rule is mandatory.
