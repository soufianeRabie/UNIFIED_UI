# ADR 0011 — Advanced Angular architecture: domain slices, facades, zoneless, resources

- Status: Accepted
- Date: 2026-10-16

## Context

The legacy screens mix HTTP, state and markup in large components. The unified UI must stay maintainable while domains grow and must be extractable into packages. Angular 21 makes signals and zoneless change detection the default and adds `httpResource`/`resource` for signal-driven reads; Signal Forms are still experimental.

## Decision

1. Cut the app by business domain, each with `feature / ui / data-access / domain / util` layers and a single `index.ts` public API; enforce with ESLint boundaries.
2. Stores (facades) are the only entry to state; they expose read-only signals and `void` intents and are provided per route.
3. Target zoneless: no code may rely on zone.js.
4. Use `httpResource`/`rxResource` for signal-dependent reads; RxJS for commands and streams.
5. Keep typed reactive forms until Signal Forms are stable.
6. Extension points are typed `InjectionToken`s; domains are registered with `provideX()`.

Full rules: [09](../09-angular-architecture.md).

## Consequences

- More files per feature, but each is small, testable and replaceable.
- Domains can move to libraries without refactoring.
- Lint rules must be extended (layer element types, function size) — tracked in PROGRESS.
- Legacy code is exempt until migrated; migrated code must comply fully.
