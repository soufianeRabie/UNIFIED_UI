# 09 — Angular architecture rules (restrictive)

Binding rules for every new or migrated file. Where this page and an older page disagree, **this page wins**. Each rule is phrased as MUST / MUST NOT; a PR that breaks one is blocked unless an ADR grants the exception.

Decision record: [ADR 0011](adr/0011-advanced-angular-architecture.md).

## 1. Strategic design: domains and slices

- **A1.** The app is cut by **business domain** (bounded context), not by technical type: `domains/security`, `domains/notification`. There is no top-level `components/`, `services/` or `models/` folder.
- **A2.** Every domain has the same five layer kinds. A layer folder may be absent, never renamed.

  | Layer         | Content                                                    | Angular? |
  | ------------- | ---------------------------------------------------------- | -------- |
  | `feature`     | routed pages and smart containers; one folder per use case | yes      |
  | `ui`          | presentational components: inputs/outputs only             | yes      |
  | `data-access` | API clients, DTOs, mappers, stores/facades                 | yes      |
  | `domain`      | models, value objects, branded ids, pure business rules    | **no**   |
  | `util`        | domain-specific pure helpers (formatting, parsing)         | **no**   |

- **A3.** Allowed imports (enforced by ESLint boundaries; violation = red build):

  ```
  feature ─► ui, data-access, domain, util
  ui ─► domain, util
  data-access ─► domain, util
  domain ─► util
  util ─► (nothing app-specific)
  all ─► shared, core (public index only), @s/core, @s/ui, @s/tokens
  ```

- **A4.** A domain's `index.ts` is its **only** public API. Another domain may import from it only models, ids and injection tokens — never components, stores or API clients. Deep imports (`domains/security/data-access/...` from outside security) are forbidden.
- **A5.** `core` = singletons created once (auth, http, i18n, config, errors, shell). `shared` = app pieces reused by ≥ 2 domains. Neither may import a domain. Something used by only one domain stays in that domain.
- **A6.** Framework-free logic goes to `@s/core` (ADR 0010) when it is generic, or to the domain's `domain/`/`util/` when it is business-specific. Both are unit-testable without TestBed.

## 2. Components

- **C1.** Standalone, `OnPush`, `inject()`, `input()/model()/output()/viewChild()`, external `.html`/`.scss`. No decorators for inputs/outputs/queries, no `NgModule`.
- **C2.** Two kinds only:
  - **Container** (`feature`): injects a store/facade, passes signals down, turns outputs into intents. No business rules, no styles beyond layout composition through `@s/ui`.
  - **Presentational** (`ui`, `@s/ui`): no injected services except `@s/ui` infrastructure; renders inputs, emits outputs.
- **C3.** Templates read signals and `computed` values only. No method calls that compute, no pipes that do business logic, no inline object/array literals passed to inputs in loops.
- **C4.** Every `@for` has `track` on a stable id. `$index` only for static lists.
- **C5.** Size limits from [03 §7](03-angular-standards.md#7-file-size-limits) are hard limits. Exceeding one means split, not suppress.
- **C6.** Host bindings via `host: {}` metadata, never `@HostBinding`/`@HostListener`.

## 3. State

- **S1.** Zoneless change detection is the target (Angular 21 default). Code MUST NOT depend on zone.js: no `NgZone.run`, no `setTimeout` to trigger rendering, no `ChangeDetectorRef.detectChanges`.
- **S2.** One store (facade) per page or per shared slice. It is the **only** entry point to state for its components: components never call API clients.
- **S3.** A store exposes `Signal<T>` (read-only) and intent methods returning `void`. It never exposes `WritableSignal`, `Observable` subjects or its API client.
- **S4.** Page stores are provided at the route (`providers: [UsersStore]`) so they are destroyed with the page. Root stores only for app-wide state (session, permissions, tenant, language).
- **S5.** State is one immutable object per store (`signal<State>`), updated with `update(s => ({ ...s, … }))`. Derived data is `computed`, never duplicated state.
- **S6.** `linkedSignal` for state that resets when an input changes; `effect` only for side effects toward the outside world (storage, logging, imperative DOM APIs) — never to copy one signal into another.
- **S7.** No global state library. Introducing NgRx SignalStore or similar requires an ADR with a measured need.

## 4. Data access

- **D1.** `HttpClient` exists only in `data-access/*-api.ts`. One API class per resource.
- **D2.** API classes return domain models, never DTOs; mapping happens in `mappers/` (pure functions).
- **D3.** Reads: `httpResource` / `rxResource` inside the store when the request depends on signals (query, id). Commands and streams (search debounce, websockets, cancellation) use RxJS and finish in the store as signals.
- **D4.** Lists use the query contract (ADR 0007, [08](08-query-contract.md)); no client-side paging/filter of server data.
- **D5.** Errors become `AppError` with an error **code** (ADR 0009). No component reads `HttpErrorResponse`.
- **D6.** Base URLs and app codes come from injection tokens, never from `environment` imports inside a domain.

## 5. Dependency injection and extension points

- **I1.** Every cross-cutting seam is an `InjectionToken` with a typed interface (e.g. `SHELL_NAV_SOURCE`). Consumers depend on the token, never on the concrete class.
- **I2.** Each domain exposes `provideX(config)` returning `EnvironmentProviders`; the app composes them in `app.config.ts`. A future host app does the same.
- **I3.** Prefer `providedIn: 'root'` only for stateless or truly global services; stateful services are provided at a route or component.
- **I4.** Interceptors and guards are functions (`HttpInterceptorFn`, `CanActivateFn`, `ResolveFn`).

## 6. Forms

- **F1.** Typed reactive forms (`NonNullableFormBuilder`) until Signal Forms leave experimental status; switching requires an ADR.
- **F2.** Validation messages are keys; server `errors[].path` is mapped to controls (ADR 0009).
- **F3.** Form components are presentational: input = initial value, output = draft. Saving is the container's job.

## 7. Routing and performance

- **P1.** Every domain and every page is lazy (`loadChildren` / `loadComponent`). The initial bundle contains only core + shell.
- **P2.** `@defer (on viewport | on idle | on interaction)` for heavy below-the-fold or rarely opened UI (charts, editors, dialogs' content).
- **P3.** Route-level `withComponentInputBinding()`; route params read through `input()`, not `ActivatedRoute` subscriptions.
- **P4.** Preloading strategy is explicit and documented; no ad-hoc prefetch code.
- **P5.** Images through `NgOptimizedImage`; icons are font/SVG.
- **P6.** Bundle budgets in `angular.json` are errors. Raising a budget needs a PR justification.
- **P7.** Large lists (> 200 rows rendered) use server paging or CDK virtual scroll.

## 8. Clean code

- **K1.** One responsibility per file; one exported class per file; named exports only.
- **K2.** Names reveal intent: `users-list.ts` (page), `user-form.ts` (ui), `users.api.ts`, `users.store.ts`, `user.mapper.ts`, `user.rules.ts`. See ADR 0005.
- **K3.** Functions ≤ 30 lines, ≤ 3 parameters (else an options object), no boolean flag parameters that switch behaviour.
- **K4.** No magic strings: route paths, permission codes, storage keys and translation keys are constants or typed unions.
- **K5.** `strict` TypeScript, no `any`, no `!` without a guard, branded ids for entities (`UserId`).
- **K6.** Comments explain _why_; code explains _what_. No commented-out code.
- **K7.** Every user-visible string is a translation key; every control meets WCAG 2.2 AA.

## 9. Enforcement

| Rule group     | Tool                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| A3–A5          | `eslint-plugin-boundaries` element types per layer                       |
| C1, C3, C6, S1 | `angular-eslint` rules (`prefer-signals`, `no-host-metadata-property` …) |
| C5, K3         | ESLint `max-lines`, `max-lines-per-function`, `max-params`               |
| K5             | `tsconfig` strict + `@typescript-eslint/no-explicit-any`                 |
| P6             | `angular.json` budgets                                                   |
| Everything     | `npm run verify` in CI; code review checklist below                      |

### Review checklist (copy into PRs)

- [ ] Files in the right domain and layer; no deep cross-domain imports
- [ ] Containers inject a store; presentational components inject nothing
- [ ] No DTO, `HttpClient` or `HttpErrorResponse` outside `data-access`
- [ ] Store exposes only signals + `void` intents
- [ ] No logic or method calls in templates; `track` on every `@for`
- [ ] Lazy route / `@defer` for anything heavy
- [ ] All strings are keys; errors are codes

## Sources

- Angular 21 signals-first and zoneless defaults — javascript-conference.com, "What Changes When Angular 21 Goes Signals-First and Zoneless-by-Default?"
- Domain slicing and enforced boundaries — angulararchitects.io, "Modern Architectures with Angular – Sheriff"
- Performance practices — angular.dev performance guide
- DDD pitfalls in large Angular codebases — dev.to, "9 Architecture Mistakes That Quietly Kill Large Angular Codebases"
