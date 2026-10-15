# 03 — Angular standards

Applies to all TypeScript and templates in `src/app` and `projects/*`. Angular 21, TypeScript strict.

## 1. Required

| Topic            | Rule                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components       | Standalone, `ChangeDetectionStrategy.OnPush`, external `templateUrl` + `styleUrl`                                                                                     |
| Inputs / outputs | `input()`, `input.required()`, `model()`, `output()` — never decorators                                                                                               |
| DI               | `inject()` in field initialisers — no constructor parameter injection                                                                                                 |
| Templates        | Built-in control flow (`@if`, `@for` with `track`, `@switch`, `@defer`)                                                                                               |
| State            | `signal`, `computed`, `linkedSignal`; RxJS only at I/O boundaries (HTTP, websockets, debounced input) and converted with `toSignal` / `rxResource` patterns in stores |
| Forms            | Typed reactive forms (`NonNullableFormBuilder`). No `ngModel` in feature code                                                                                         |
| Routing          | Lazy routes per domain and per page; guards are functions (`CanActivateFn`)                                                                                           |
| Subscriptions    | `takeUntilDestroyed()` or `toSignal`; never manual `unsubscribe` bookkeeping                                                                                          |
| Types            | `strict`, no `any` (use `unknown` + narrowing), no non-null `!` except after an explicit guard                                                                        |
| Strings          | Every user-visible string is a translation key: `DOMAIN.FEATURE.ELEMENT` (`SECU.USERS.TITLE`)                                                                         |

## 2. Forbidden

| Forbidden                                                                                     | Use instead                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NgModule` (new code)                                                                         | standalone + `provideX()` functions                                                                                           |
| `@Input()` / `@Output()` / `@ViewChild` decorators                                            | signal APIs (`input`, `output`, `viewChild`)                                                                                  |
| `*ngIf`, `*ngFor`, `[ngClass]`, `[ngStyle]`                                                   | `@if`, `@for`, `data-*` attributes / `class.x` bindings                                                                       |
| Inline `template:` / `styles:`                                                                | `.html` / `.scss` files                                                                                                       |
| `style="…"` and `[style.x]` in templates                                                      | `@s/ui` components and tokens (sole exception: data-driven geometry through a CSS custom property, e.g. `[style.--progress]`) |
| Calling methods that compute in templates (`{{ total() * 2 }}` via a method, `isActive(row)`) | `computed()` view models; plain signal reads are fine                                                                         |
| `HttpClient` outside `data-access`                                                            | an `*-api.ts` client                                                                                                          |
| DTO types in components                                                                       | mapped domain models                                                                                                          |
| `localStorage` / `window` access in components                                                | a `core` service with an injection token                                                                                      |
| `setTimeout` for change detection, `ChangeDetectorRef.detectChanges` hacks                    | signals                                                                                                                       |
| Translation keys generated from text (`DOM_FALLBACK.TEXT_178`)                                | meaningful keys                                                                                                               |
| `console.log` in committed code                                                               | `core/errors` logger                                                                                                          |
| Barrel imports from inside the same library (`import … from '@s/ui'` inside `s-ui`)           | relative imports                                                                                                              |
| Default exports                                                                               | named exports                                                                                                                 |

## 3. State management

- **Page state** lives in a store service provided at the route (`providers: [UsersStore]`), so it dies with the page.
- A store exposes **read-only signals** and **intent methods**; it never exposes `WritableSignal`.

```ts
@Injectable()
export class UsersStore {
  private readonly api = inject(UsersApi);

  private readonly state = signal<UsersState>(initialState);

  readonly users   = computed(() => this.state().items);
  readonly total   = computed(() => this.state().total);
  readonly loading = computed(() => this.state().status === 'loading');
  readonly error   = computed(() => this.state().error);

  load(query: UsersQuery): void { … }   // intents: verbs, return void
  remove(id: UserId): void { … }
}
```

- **App state** (session, permissions, tenant) lives in `core`/`shared` stores provided in root.
- No global state library (NgRx) until a measured need appears — ADR required.

## 4. Error handling

- `data-access` maps HTTP errors to a typed `AppError` (`{ kind: 'network' | 'forbidden' | 'validation' | 'not-found' | 'unknown', message, fieldErrors? }`).
- Stores keep `error: AppError | null`; pages render it with `SNotice` or the table's `error` input.
- Unexpected exceptions reach the global `ErrorHandler`, which logs and shows a toast — never a blank screen.

## 5. Performance

- OnPush everywhere; `@for` always has a stable `track` (an id, not `$index`, when items can move).
- Lazy-load every domain and every page; use `@defer (on viewport)` for heavy below-the-fold panels.
- No function calls in templates (see §2); derive with `computed`.
- Images: `NgOptimizedImage`. Icons: font/SVG, never PNG sprites.
- Bundle budgets in `angular.json` are hard errors (see [06](06-quality-gates.md)).

## 6. File size limits

| File               | Soft limit | Hard limit (PR blocked) |
| ------------------ | ---------- | ----------------------- |
| Component `.ts`    | 150 lines  | 250                     |
| Template `.html`   | 120 lines  | 200                     |
| Store / API client | 200 lines  | 300                     |

Exceeding a soft limit means the component is doing two jobs: split it into a page + presentational `ui` components.
