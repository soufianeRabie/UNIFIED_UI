# 01 — Architecture

## 1. Goals

- **Reusable by construction.** The design system and each business domain are built so they can be lifted into their own npm package without rewriting a line.
- **Predictable.** Any developer can find any file from its name, and can tell from an import whether it is allowed.
- **Scalable.** Adding a domain or a screen adds a folder; it does not touch unrelated code.

## 2. Workspace layout

```
UNIFIED_UI/
├─ projects/
│  └─ s-ui/                      @s/ui — design system (no business knowledge)
│     ├─ styles/                 tokens.css · base.css · controls.css · overlay.css · index.css
│     └─ src/
│        ├─ lib/<component>/     one folder per component (see 02)
│        └─ public-api.ts        the only entry point consumers may import
│
├─ src/app/
│  ├─ core/                      app-wide singletons, created once at bootstrap
│  │  ├─ auth/                   OIDC session, token storage, auth interceptor, guards
│  │  ├─ http/                   base URL resolution, error interceptor, tenant header
│  │  ├─ i18n/                   translation setup, S UI label bridge
│  │  ├─ config/                 runtime config (public/config.json)
│  │  ├─ errors/                 global ErrorHandler, error → message mapping
│  │  └─ shell/                  application frame: sidebar, topbar, breadcrumbs
│  │
│  ├─ shared/                    app-specific building blocks reused by several domains
│  │  ├─ permissions/            HasAction directive, permission guard, PermissionStore
│  │  └─ pipes/                  date/number formatting bound to the active locale
│  │
│  ├─ domains/
│  │  ├─ security/               bounded context: users, roles, groups, permissions, audit…
│  │  │  ├─ domain/              pure TypeScript models + business rules (no Angular)
│  │  │  ├─ data-access/         *-api.ts (HTTP), dto/, mappers/, *-store.ts (signal state)
│  │  │  ├─ ui/                  presentational components specific to the domain
│  │  │  ├─ features/            route-level pages, one folder per screen
│  │  │  ├─ security.routes.ts
│  │  │  └─ index.ts             public surface for other domains (models + tokens only)
│  │  └─ notification/           same shape
│  │
│  ├─ app.config.ts · app.routes.ts · app.ts
│
└─ docs/architecture/            this handbook
```

`domains/security` is the future `@secu/security` package and `domains/notification` the future `@secu/notification` package; `projects/s-ui` is `@s/ui`. Their folder boundaries are drawn now so extraction is a move, not a refactor.

## 3. Layers and the dependency rule

```
 features ──► ui ──────────┐
    │                       ▼
    └──────► data-access ─► domain
    │            │
    ▼            ▼
 shared ──► core ──► @s/ui ◄── (everyone)
```

| Layer         | May import                                              | Must not import                       | Contains                                        |
| ------------- | ------------------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| `@s/ui`       | Angular, `@angular/cdk`, `primeicons`                   | anything under `src/app`              | generic components, tokens                      |
| `core`        | `@s/ui`, Angular                                        | `shared`, `domains`                   | singletons, shell                               |
| `shared`      | `@s/ui`, `core`                                         | `domains`                             | cross-domain app pieces                         |
| `domain`      | nothing (plain TS)                                      | Angular, RxJS, HTTP                   | models, value objects, rules                    |
| `data-access` | `domain`, `core/http`                                   | `ui`, `features`, `@s/ui`             | API clients, DTOs, mappers, stores              |
| `ui`          | `domain`, `@s/ui`                                       | `data-access`, `features`, HttpClient | presentational components (inputs/outputs only) |
| `features`    | everything in its own domain, `shared`, `core`, `@s/ui` | another domain's internals            | pages: wire stores to ui                        |

**Cross-domain access** goes only through the other domain's `index.ts` (models and injection tokens, never components or stores). If two domains need the same thing, it moves to `shared` or `core`.

These rules are enforced by `eslint-plugin-boundaries` (see [06](06-quality-gates.md)); a violation fails CI.

## 4. Runtime composition

- `app.routes.ts` lazy-loads each domain: `{ path: 'security', loadChildren: () => import('./domains/security/security.routes') }`.
- Each domain exposes a `provideSecurity()` / `provideNotification()` environment-provider function. The app registers them in `app.config.ts`; a future host app does the same.
- Domain configuration (API base URL, app code) is injected through an `InjectionToken`, never read from a global.

## 5. Naming map

| Thing               | Folder / file                                        | Class                   | Selector                        |
| ------------------- | ---------------------------------------------------- | ----------------------- | ------------------------------- |
| DS component        | `projects/s-ui/src/lib/button/s-button.ts`           | `SButton`               | `s-button` / `button[s-button]` |
| Domain page         | `domains/security/features/users-list/users-list.ts` | `UsersList`             | `secu-users-list`               |
| Domain ui component | `domains/security/ui/user-form/user-form.ts`         | `UserForm`              | `secu-user-form`                |
| Core component      | `core/shell/sidebar/sidebar.ts`                      | `Sidebar`               | `app-sidebar`                   |
| API client          | `data-access/users-api.ts`                           | `UsersApi`              | —                               |
| Store               | `data-access/users-store.ts`                         | `UsersStore`            | —                               |
| DTO                 | `data-access/dto/user.dto.ts`                        | `UserDto` (interface)   | —                               |
| Mapper              | `data-access/mappers/user.mapper.ts`                 | `toUser()` functions    | —                               |
| Model               | `domain/user.ts`                                     | `User` (interface/type) | —                               |

File and class naming follow the Angular v20+ style guide (no `.component` / `Component` suffixes). Selector prefixes: `s-` design system, `app-` core/shared, `secu-` security, `notif-` notification.
