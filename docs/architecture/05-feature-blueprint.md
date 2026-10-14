# 05 — Feature blueprint

Every screen is built the same way. This is the reference, using **Security → Users**.

## 1. Files

```
src/app/domains/security/
├─ domain/
│  ├─ user.ts                       User, UserId (branded), UserStatus
│  └─ user.rules.ts                 pure functions: canBeDeleted(user), displayName(user)
├─ data-access/
│  ├─ dto/
│  │  ├─ user.dto.ts                UserDto, CreateUserRequestDto, UpdateUserRequestDto (wire shapes)
│  │  └─ paged.dto.ts               PagedResponseDto<T>
│  ├─ mappers/
│  │  └─ user.mapper.ts             toUser(dto), toCreateUserRequest(draft) …
│  ├─ users-api.ts                  UsersApi: HTTP only, returns Observable<domain types>
│  └─ users-store.ts                UsersStore: signal state + intents, provided per route
├─ ui/
│  └─ user-form-dialog/
│     ├─ user-form-dialog.ts        presentational: input(user), output(save), typed reactive form
│     ├─ user-form-dialog.html
│     └─ user-form-dialog.spec.ts   (no .scss — composed from @s/ui)
└─ features/
   └─ users-list/
      ├─ users-list.ts              page: injects UsersStore, wires ui + @s/ui
      ├─ users-list.html
      ├─ users-list.columns.ts      SColumn[] definition (translated headers via factory)
      └─ users-list.spec.ts
```

## 2. Responsibilities

| File | Does | Never does |
|---|---|---|
| `user.ts` | Describes a user as the UI understands it | Mirror the API's field names |
| `user.dto.ts` | Mirrors the API contract exactly | Get imported outside `data-access` |
| `user.mapper.ts` | Converts DTO ⇄ model, fills defaults, parses dates | Call HTTP |
| `users-api.ts` | Builds requests, maps responses and errors | Hold state |
| `users-store.ts` | Holds page state, debounces search, exposes signals and intents | Touch the DOM or templates |
| `user-form-dialog.ts` | Renders a form, validates, emits a draft | Inject services or call APIs |
| `users-list.ts` | Connects store ↔ components, handles navigation and confirmations | Contain business rules or styles |

## 3. Data flow

```
users-list.html ──(intent: search/page/sort/save/delete)──► UsersStore ──► UsersApi ──► HTTP
        ▲                                                        │
        └──────────────── signals (users, total, loading, error) ┘
```

1. The page calls an intent: `store.search(term)`.
2. The store updates its query signal; one RxJS pipeline (`switchMap`) calls `UsersApi`.
3. `UsersApi` maps `PagedResponseDto<UserDto>` → `Page<User>` and HTTP errors → `AppError`.
4. The store writes the result into its state signal; the page re-renders through `computed`s.

## 4. Page template shape

A page template is only composition. If you need a `<div>` with a class, you need an `@s/ui` component instead.

```html
<s-page-header …><button s-button sPageActions …></button></s-page-header>
<s-panel>
  <s-filter-bar>…</s-filter-bar>
  <s-data-table …>
    <ng-template sCell="…" let-row>…</ng-template>
    <ng-template sRowActions let-row>…</ng-template>
  </s-data-table>
</s-panel>
<secu-user-form-dialog [(open)]="…" [user]="…" (save)="store.save($event)" />
```

## 5. Permissions

- Visibility/enablement of actions uses the `shared/permissions` directive: `*hasAction="'CREATE'"` or `[permAction]`.
- Route access uses `permissionGuard` in `security.routes.ts`, never checks inside components.
- The page code is declared once in the route `data: { pageCode: 'USERS_LIST' }`.

## 6. Checklist for a migrated screen

- [ ] Follows the file layout above; no file over its size limit.
- [ ] No inline styles, no `.scss` in `features/`, no raw text.
- [ ] DTOs only in `data-access`; mapper covered by unit tests.
- [ ] Store tested (intents → state); page smoke-tested (renders, empty, error).
- [ ] Keyboard path verified: search → table → row action → dialog → save → focus returns.
- [ ] Translations present in `en.json` and `fr.json`.
