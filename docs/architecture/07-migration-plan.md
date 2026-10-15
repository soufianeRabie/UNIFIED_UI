# 07 — Migration plan

From today's code (one large stylesheet per module, templates and styles inline, PrimeNG theme overrides, generated translation keys) to the architecture in this handbook — without a big-bang rewrite. The app stays working after every phase.

## Starting point (Oct 2026)

| Area         | Today                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Structure    | `src/app/secu`, `src/app/notif`, `src/app/core` (contains leftover car-rental services: customers, invoices, branches) |
| Components   | 125 TS files, templates mostly inline, 708 inline `style=""`, emoji/corrupted icons                                    |
| Styles       | `secu.styles.css` (77 kB) + `notif.styles.css` (67 kB) global, PrimeNG Lara overridden with `!important`               |
| i18n         | 976 keys used, 189 missing, many generated keys (`DOM_FALLBACK.TEXT_178`)                                              |
| Tests / lint | 2 specs, no ESLint, no Stylelint                                                                                       |

## Phase 0 — Guard rails (first, ~1–2 days)

1. Add ESLint (`angular-eslint`, `eslint-plugin-boundaries`), Stylelint, Prettier, `npm run verify`.
2. Rules start as **errors for new folders** (`projects/s-ui/**`, `src/app/domains/**`) and **warnings for legacy folders**, so new code is clean from day one without blocking the app.
3. Delete dead code (car-rental services and models, unused `@tailwind` directives, broken `@secu/ui` file dependency).
4. Add `scripts/check-i18n.mjs`; fill the 189 missing keys.

## Phase 1 — Design system foundation

`projects/s-ui`: tokens, base, controls, overlay styles; components listed as Phase 1 in [02](02-design-system.md), each following the folder contract, with specs. `provideSUi` wired to ngx-translate.

**Bridge:** legacy `--s-*` variables are re-pointed at the new tokens, so every not-yet-migrated screen immediately adopts the new palette, type and radii.

## Phase 2 — Shell + reference screen

1. `core/shell`: `SAppShell`, sidebar and topbar on `@s/ui`; one shell for security and notification (replaces `secu-layout` and `notif-layout`).
2. Create `domains/security` and migrate **Users** completely per [05](05-feature-blueprint.md). This screen becomes the template every other migration copies.

## Phase 3 — Security domain

Roles → Groups → Permissions matrix → Pages / Actions / Page-actions → Companies → Policies → Data filters → Tokens → Audit (log, config, reports) → My security / Auth settings.
Each screen: move to `domains/security`, split into api/store/ui/page, delete its rules from `secu.styles.css`.

## Phase 4 — Notification domain

Dashboard, inbox, templates (editor), event types, events, data sources, recipient groups, providers, reports, settings, reference data, users, preferences — same procedure, into `domains/notification`.

## Phase 5 — Remove legacy

Delete `secu.styles.css`, `notif.styles.css`, the `--s-*` bridge and PrimeNG (once no screen imports it). Turn all lint warnings into errors.

## Phase 6 — Package and reuse

1. Build `@s/ui`, `@secu/security`, `@secu/notification` with `ng-packagr`; publish to a private registry (GitHub Packages).
2. Replace `C:\SecuLib` (older copies of the same screens) with these packages; its host app becomes a consumer.
3. Any Angular product installs the packages and calls `provideSUi()`, `provideSecurity()`, `provideNotification()`.

## Tracking

Each phase is a milestone; each screen migration is one PR that follows [05 §6](05-feature-blueprint.md). Progress is visible as the shrinking size of the two legacy stylesheets.
