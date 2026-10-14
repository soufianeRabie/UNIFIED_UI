# ADR 0003 — Signals-first state, per-route stores

- **Status:** Accepted · 2026-10-14
- **Context:** Screens currently mix component fields, signals and ad-hoc RxJS subjects. Angular 21's signals cover local and page state; a global store library adds ceremony we do not need yet.
- **Decision:** Page state lives in an `@Injectable()` store provided on the route, exposing read-only signals and intent methods. RxJS is used inside stores and API clients for I/O composition only. App-wide state (session, permissions, tenant) lives in root-provided stores in `core`/`shared`. No NgRx.
- **Consequences:** One state pattern to learn; state is disposed with the page; templates only read signals. Revisit with a new ADR if cross-page caching or undo/redo becomes a requirement.
