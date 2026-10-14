# PROGRESS — Unified UI (security + notification) & S design system

> **Single source of truth for project status.** Read this first in every session.
> Update it at the end of every step (see "Update protocol" at the bottom). Newest entries on top in the log.

---

## 1. Current status

| Field | Value |
|---|---|
| **Current phase** | Phase 0 — Guard rails (not started) · awaiting owner approval of the architecture handbook |
| **Last completed step** | Architecture handbook written (`docs/architecture/`) — 2026-10-14 |
| **Next step** | On approval: Phase 0.1 — add ESLint (angular-eslint + eslint-plugin-boundaries), Stylelint, Prettier, `npm run verify` |
| **Blocked by** | Owner review of `docs/architecture/` |

### Phase checklist (details in `docs/architecture/07-migration-plan.md`)

- [ ] **Phase 0 — Guard rails**
  - [ ] 0.1 ESLint + angular-eslint + boundaries (errors for `projects/s-ui/**`, `src/app/domains/**`; warnings for legacy)
  - [ ] 0.2 Stylelint (no raw colours/`!important`/`::ng-deep`/numeric z-index) + Prettier + `npm run verify`
  - [ ] 0.3 Delete dead code: car-rental services/models in `src/app/core` (customer, invoice, branch…), `@tailwind` lines in `src/styles.scss`, broken `"@secu/ui": "file:../../SecuLib/dist/secu-ui"` dependency
  - [ ] 0.4 `scripts/check-i18n.mjs` + fill the 189 missing keys (en + fr)
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

| Item | Value |
|---|---|
| Workspace root | `C:\DATA SOUFIANE RABYA\security-notification-platform\` |
| Repos (GitHub, owner `soufianeRabie`, branch `main`) | `SECURITY_API`, `NOTIFICATION_API`, `UNIFIED_UI` (each folder is its own git repo) |
| Stack | Angular 21.1 · TypeScript 5.9 strict · Vitest (`@angular/build:unit-test`) · ngx-translate 18 · PrimeNG 21 (legacy) · `@angular/cdk` 21.1.6 · `@fontsource-variable/sora`, `@fontsource-variable/newsreader`, `@fontsource/ibm-plex-mono` · .NET 10 APIs |
| Database | PostgreSQL 17 local, DB `security_notification` (both APIs share it; EF history tables differ) |
| Real config | `SECURITY_API/SecurityApi.Api/appsettings*.json`, `NOTIFICATION_API/NotificationService.API/appsettings*.json` — **git-ignored, contain secrets, never commit**; templates are `*.example.json` |
| Run security API | `dotnet run --project SECURITY_API/SecurityApi.Api --launch-profile http` → http://localhost:5000 |
| Run notification API | `dotnet run --project NOTIFICATION_API/NotificationService.API --urls http://localhost:5003` (env `ASPNETCORE_ENVIRONMENT=Development`; rebuild first so `bin/appsettings.json` is current) |
| Run UI | `cd UNIFIED_UI && npx ng serve --port 4200` → http://localhost:4200 |
| Local login | seeded `admin` / `Admin@123`, tenant `DEFAULT` (admin's `tenant_id` set to `DEFAULT` manually in DB) |
| Design reference (React) | `C:\Users\ADMIN\Documents\ChatGPT\KAFALA` — `src/components/s/` (S vocabulary), `src/components/data-table/`, `src/styles/_tokens.scss` |
| Older library copy | `C:\SecuLib` (no git): `secu-ui`, `secu-auth`, `secu-notif`, `secu-shell` — same screens, older; to be replaced in Phase 6 |

---

## 3. Draft code (exists, NOT compliant, NOT committed)

Written before the handbook; violates ADR 0005 (inline templates/styles, several classes per file). Restructure in Phase 1, do not build on it as-is:

- `projects/s-ui/src/lib/core/{types.ts, labels.ts, provide.ts}`
- `projects/s-ui/src/lib/layout/layout.ts` (SStack, SRow, SGrid, SPanel, SPanelHeader)
- `projects/s-ui/src/lib/text/text.ts` (SText, SHeading, SNotice)
- `projects/s-ui/src/lib/action/action.ts` (SIcon, SButton, SIconButton, SStamp, SEmpty, SKpi)
- `projects/s-ui/src/lib/form/form.ts` (SInput, SField, SSwitch, SSearch, SFilterBar)
- `projects/s-ui/src/lib/data/data-table.ts` (SDataTable, SPagination, SCell, SRowActions) — also: remove method calls in template (`ariaSort`, `sortIcon`, `display`) → computed view model
- `projects/s-ui/src/lib/page/page-header.ts`, `projects/s-ui/src/lib/overlay/dialog.ts` (SDialog, SConfirm)
- `projects/s-ui/src/public-api.ts`, `projects/s-ui/package.json`
- npm deps already installed: `@angular/cdk`, the three `@fontsource` packages

---

## 4. Known issues / open items

| # | Issue | Owner decision needed? |
|---|---|---|
| 1 | 27 rows in `hr_management."NOT_NOTIFICATION"` + 33 Hangfire jobs created 2026-10-14 ~22:36 by a mis-configured run — not cleaned | Yes: delete or keep |
| 2 | 189 translation keys missing (en + fr); generated keys like `DOM_FALLBACK.TEXT_178` | No — Phase 0.4 |
| 3 | ~440 corrupted characters (lost emoji bytes) in secu components — fixed as screens migrate (icons → `s-icon`) | No |
| 4 | Security seeder leaves admin `tenant_id` NULL → notification API rejects calls (`Missing X-Tenant-Id`) | Yes: seed a default tenant in SECURITY_API? |
| 5 | Gmail app password was stored in plain text in old config → rotate it | Owner action |
| 6 | Old folders still on disk: `C:\SecurityUi`, `C:\DATA SOUFIANE RABYA\NotificationApi\NotificationApi`, `HR_MANAGEMENT\{NOTIFICATION_API,SECURITY_API}` | Yes: delete when confirmed |

---

## 5. Log (newest first)

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
