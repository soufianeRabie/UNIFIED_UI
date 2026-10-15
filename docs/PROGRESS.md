# PROGRESS — Unified UI (security + notification) & S design system

> **Single source of truth for project status.** Read this first in every session.
> Update it at the end of every step (see "Update protocol" at the bottom). Newest entries on top in the log.

---

## 1. Current status

| Field                   | Value                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Current phase**       | Phase 0 complete → Phase 1 — Design system foundation                                                                                                                                    |
| **Last completed step** | 0.5 Corrupted glyphs repaired — Phase 0 done — 2026-10-15                                                                                                                                |
| **Next step**           | Phase 1.1 — wire `projects/s-ui` into the build (tsconfig alias `@s/ui`, angular.json styles: fonts, CDK overlay, `s-ui/styles/index.css`) and bridge legacy `--s-*` variables to tokens |
| **Blocked by**          | —                                                                                                                                                                                        |

### Phase checklist (details in `docs/architecture/07-migration-plan.md`)

- [x] **Phase 0 — Guard rails** (done 2026-10-15)
  - [x] 0.1 ESLint + angular-eslint + boundaries (errors for `projects/s-ui/**`, `src/app/domains/**`; warnings for legacy)
  - [x] 0.2 Stylelint (no raw colours/`!important`/`::ng-deep`/numeric z-index) + Prettier + `npm run verify`
  - [x] 0.3 Delete dead code (20 unreachable files, Tailwind, broken `@secu/ui` dependency, scaffold `secu/app.*`)
  - [x] 0.4 `scripts/check-i18n.mjs` (`npm run i18n:check`, part of `verify`) + 189 missing keys filled (en + fr)
  - [x] 0.5 Repair corrupted glyphs (lost emoji/symbol bytes) in legacy templates
- [ ] **Phase 1 — Design system foundation (`projects/s-ui`)**
  - [x] Tokens written: `projects/s-ui/styles/tokens.css`, `base.css`, `controls.css`, `overlay.css`, `index.css`
  - [ ] Restructure draft components into the folder contract (see §3 "Draft code")
  - [ ] tsconfig path alias `@s/ui`, angular.json styles (fonts, cdk overlay css, s-ui index.css), `provideSUi` with ngx-translate
  - [ ] Specs for every component; bridge legacy `--s-*` variables to tokens
- [ ] **Phase 2 — Shell + reference screen (Users)** in `src/app/domains/security`
- [ ] **Phase 3 — Security domain screens**
- [ ] **Phase 4 — Notification domain screens**
- [ ] **Phase 5 — Remove legacy CSS, bridge, PrimeNG**
- [ ] **Phase 6 — Package `@s/ui`, `@secu/security`, `@secu/notification`; replace `C:\SecuLib`**

---

## 2. Environment facts

| Item                                                 | Value                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace root                                       | `C:\DATA SOUFIANE RABYA\security-notification-platform\`                                                                                                                                                                                                                   |
| Repos (GitHub, owner `soufianeRabie`, branch `main`) | `SECURITY_API`, `NOTIFICATION_API`, `UNIFIED_UI` (each folder is its own git repo)                                                                                                                                                                                         |
| Stack                                                | Angular 21.1 · TypeScript 5.9 strict · Vitest (`@angular/build:unit-test`) · ngx-translate 18 · PrimeNG 21 (legacy) · `@angular/cdk` 21.1.6 · `@fontsource-variable/sora`, `@fontsource-variable/newsreader`, `@fontsource/ibm-plex-mono` · .NET 10 APIs                   |
| Database                                             | PostgreSQL 17 local, DB `security_notification` (both APIs share it; EF history tables differ)                                                                                                                                                                             |
| Real config                                          | `SECURITY_API/SecurityApi.Api/appsettings*.json`, `NOTIFICATION_API/NotificationService.API/appsettings*.json` — **git-ignored, contain secrets, never commit**; templates are `*.example.json`                                                                            |
| Run security API                                     | `dotnet run --project SECURITY_API/SecurityApi.Api --launch-profile http` → http://localhost:5000                                                                                                                                                                          |
| Run notification API                                 | `dotnet run --project NOTIFICATION_API/NotificationService.API --urls http://localhost:5003` (env `ASPNETCORE_ENVIRONMENT=Development`; rebuild first so `bin/appsettings.json` is current)                                                                                |
| Run UI                                               | `cd UNIFIED_UI && npx ng serve --port 4200` → http://localhost:4200                                                                                                                                                                                                        |
| Local login                                          | seeded `admin` / `Admin@123`, tenant `DEFAULT` (admin's `tenant_id` set to `DEFAULT` manually in DB)                                                                                                                                                                       |
| Quality gates                                        | `npm run verify` = format:check → lint → lint:styles → ng build → ng test. Legacy reports: `npm run lint:legacy`, `npm run lint:styles:legacy`                                                                                                                             |
| Lint stack                                           | ESLint 9.39 + angular-eslint 21.4 + typescript-eslint 8 + eslint-plugin-boundaries 7.2 (+ TS resolver); Stylelint 17.16 + standard-scss + declaration-strict-value; Prettier 3.9. ESLint 9 is EOL but required by angular-eslint 21 → upgrade to ESLint 10 with Angular 22 |
| Design reference (React)                             | `C:\Users\ADMIN\Documents\ChatGPT\KAFALA` — `src/components/s/` (S vocabulary), `src/components/data-table/`, `src/styles/_tokens.scss`                                                                                                                                    |
| Older library copy                                   | `C:\SecuLib` (no git): `secu-ui`, `secu-auth`, `secu-notif`, `secu-shell` — same screens, older; to be replaced in Phase 6                                                                                                                                                 |

---

## 3. Draft code (exists, NOT compliant, NOT committed — moved to `UNIFIED_UI/.drafts/s-ui-src/`, git-ignored)

Written before the handbook; violates ADR 0005 (inline templates/styles, several classes per file). Restructure in Phase 1, do not build on it as-is:

- `.drafts/s-ui-src/lib/core/{types.ts, labels.ts, provide.ts}`
- `.drafts/s-ui-src/lib/layout/layout.ts` (SStack, SRow, SGrid, SPanel, SPanelHeader)
- `.drafts/s-ui-src/lib/text/text.ts` (SText, SHeading, SNotice)
- `.drafts/s-ui-src/lib/action/action.ts` (SIcon, SButton, SIconButton, SStamp, SEmpty, SKpi)
- `.drafts/s-ui-src/lib/form/form.ts` (SInput, SField, SSwitch, SSearch, SFilterBar)
- `.drafts/s-ui-src/lib/data/data-table.ts` (SDataTable, SPagination, SCell, SRowActions) — also: remove method calls in template (`ariaSort`, `sortIcon`, `display`) → computed view model
- `.drafts/s-ui-src/lib/page/page-header.ts`, `projects/s-ui/src/lib/overlay/dialog.ts` (SDialog, SConfirm)
- `.drafts/s-ui-src/public-api.ts` (`projects/s-ui/package.json` is committed)
- npm deps already installed: `@angular/cdk`, the three `@fontsource` packages

---

## 4. Known issues / open items

| #   | Issue                                                                                                                                                 | Owner decision needed?                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | 27 rows in `hr_management."NOT_NOTIFICATION"` + 33 Hangfire jobs created 2026-10-14 ~22:36 by a mis-configured run — not cleaned                      | Yes: delete or keep                         |
| 2   | 189 translation keys missing (en + fr); generated keys like `DOM_FALLBACK.TEXT_178`                                                                   | No — Phase 0.4                              |
| 3   | ~~~440 corrupted characters~~ fixed in 0.5 (originals restored; emoji icons are replaced by `s-icon` during migration)                                | No                                          |
| 4   | Security seeder leaves admin `tenant_id` NULL → notification API rejects calls (`Missing X-Tenant-Id`)                                                | Yes: seed a default tenant in SECURITY_API? |
| 5   | Gmail app password was stored in plain text in old config → rotate it                                                                                 | Owner action                                |
| 6   | Old folders still on disk: `C:\SecurityUi`, `C:\DATA SOUFIANE RABYA\NotificationApi\NotificationApi`, `HR_MANAGEMENT\{NOTIFICATION_API,SECURITY_API}` | Yes: delete when confirmed                  |

---

## 5. Log (newest first)

### 2026-10-15

- **0.5 Glyphs:** restored 130 corrupted sequences in 20 legacy templates to their original characters, identified from the surviving UTF-8 tail bytes (🗑 🔍 ✏ ⚠ 👁 ⏳ 🔐 🔗 🎭 👤 👥 🏢 🏷 ▶ ▾ ▸ ▲ ▼ · … é ═, password dots). 0 `U+FFFD` left in `src/app`. **Verified:** `npm run verify` ✔; browser re-sweep of the 9 affected routes → 0 corrupted characters (page-actions had 1 001). **Phase 0 complete.**

- **0.4 i18n:** added `scripts/check-i18n.mjs` (fails on keys used in `src/app` but missing from `public/i18n/{en,fr}.json`; reports generated + unused keys) and `npm run i18n:check`, now part of `verify`. Wrote 189 missing keys in EN + FR from each key's on-screen context (no `{{…}}` in values — ngx-translate would treat it as a parameter). Repaired 54 corrupted values per locale (lost `…`, emoji prefixes baked into labels). Fixed `notif/features/data-sources/data-sources.component.html`, which printed 46 keys **without** the translate pipe. **Verified:** `npm run verify` ✔; browser sweep of all 28 security + notification routes (logged in as admin/DEFAULT) → **0 raw keys on every screen** (before: e.g. `SECU.USERS.COL.*` on Users). Remaining: corrupted glyphs on users (4), roles (25), groups (22), page-actions (1 001), pages, policies, permissions, companies → step 0.5.

- **0.3 Dead code:** import-graph reachability from `main.ts` + specs (static + lazy `import()`) found 20 unreachable files → deleted: car-rental services (analytics, branch, customer, invoice, payment, pricing, reservation, vehicle, vehicle-category), `theme.service`, models (analytics, billing, fleet, organization, page-response, pricing, rental), `secu/directives/has-action.directive.ts`, `secu/guards/secu-auth.guard.ts`, `shared/layout/main-layout.component.ts` (also removed 2 of the 3 boundary violations). Removed never-configured Tailwind (`@tailwind` lines were emitted raw into the CSS bundle) and deps `tailwindcss`, `postcss`, `autoprefixer`, `@secu/ui` (broken `file:` link). Prettier `endOfLine: auto` (CRLF checkouts on Windows). **Verified:** 104/104 files reachable, format ✔, lint ✔, lint:styles ✔, build ✔ (788 kB), tests ✔ 2/2.
- Note: local services (5000/5003/4200) were stopped when the previous session ended — restart per §2 when a browser check is needed.

- **0.1 ESLint** (`eslint.config.mjs`): angular-eslint 21 + typescript-eslint + boundaries v7 (`boundaries/dependencies` policies = handbook 01 §3, same-domain via `{{ from.element.captured.scope }}`), restricted imports (HTTP/DTO/PrimeNG), restricted syntax (default export, decorators, console), `component-max-inline-declarations` 0, `max-lines`. Strict = errors for `projects/s-ui`, `src/app/domains`; legacy = presets downgraded to warnings. Verified with a deliberately bad probe file in `src/app/domains` → 17/17 violations reported, then deleted.
- **Legacy baseline** (to shrink to 0 by Phase 5): ESLint 2 169 warnings (top: 715 inline styles, 280 button-has-type, 262 prefer-signals, 206 label-control, 157 control-flow), 3 boundary violations (`core/services/oidc-auth.service.ts` → secu, `shared/layout/main-layout.component.ts` → secu ×2). Stylelint ~1 600 findings (582 `!important`, 451 raw values, 441 physical properties).
- **0.2 Stylelint** (`stylelint.config.mjs`, all findings warnings; strict folders gated with `--max-warnings 0`), **Prettier** (`.prettierignore`; formatted docs + new files only), npm scripts `lint`, `lint:legacy`, `lint:styles`, `lint:styles:legacy`, `format`, `format:check`, `verify`. Added token `--focus-ring-danger`.
- Draft `projects/s-ui/src` moved to git-ignored `.drafts/s-ui-src` (non-compliant; reference for Phase 1).
- Deleted unused scaffold duplicate `src/app/secu/app.{ts,html,scss,spec.ts}`; replaced stale `app.spec.ts` (asserted a non-existent "Hello, car-rental-ui" title) with a real smoke test.
- Docs: `06-quality-gates.md` §2 rewritten to match the actual config (no-call-expression is review-only).
- **Verified:** `format:check` ✔, `lint` ✔, `lint:styles` ✔, `ng build` ✔ (initial 788 kB), `ng test` ✔ 2/2.

### 2026-10-14

- Wrote architecture handbook: `docs/architecture/README.md`, `01`–`07`, `adr/0001`–`0005`.
- Moved tokens into `projects/s-ui/styles/`; drafted Phase 1 components (non-compliant, see §3).
- Installed `@angular/cdk@21.1.6` and self-hosted fonts.
- Pushed to `UNIFIED_UI`: i18n loader fix, flag emoji fix, nav links between security ↔ notification.
- Pushed to `SECURITY_API`: fresh-DB seeder fix (duplicate `SECU_ADMIN` role).
- Created DB `security_notification`; all three services run locally and login works end to end.

### 2026-10-13

- Split code into 3 repos (`SECURITY_API`, `NOTIFICATION_API`, `UNIFIED_UI`), secrets replaced by `*.example.json`, pushed.
- `UNIFIED_UI` uses the i18n snapshot (from `SecurityUi - Copy`), build green.
- Deleted `NotificationApi/AutoPieces` and `RENTAL/car-rental-api` (owner request).

---

## Update protocol (mandatory for every session)

1. **Start:** read `CLAUDE.md`, this file, then `docs/architecture/README.md` and the handbook pages relevant to the next step.
2. **Before a step:** set "Current phase" / "Next step" in §1 if they changed.
3. **After each completed step:** tick it in §1, add a dated bullet to §5 (what changed, which files, verification done), update §3/§4 if affected.
4. **Never** mark a step done without verification (build, tests, or browser check — say which).
5. **Commit** progress with the code it describes (`docs: update progress` or inside the feature commit). Push only when the owner has asked for pushes in that session.
