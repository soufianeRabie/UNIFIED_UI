# ADR 0005 — File and naming conventions

- **Status:** Accepted · 2026-10-14
- **Context:** Existing files put templates, styles, interfaces and several classes in one `.ts` file, which makes reviews and ownership hard on a large codebase.
- **Decision:** Follow the Angular v20+ style guide: no `.component`/`Component` suffixes (`s-button.ts` → `SButton`), one exported class per file, external `.html`/`.scss`, separate `*.types.ts`, `*.dto.ts`, `*.mapper.ts`, `*-api.ts`, `*-store.ts`. Selector prefixes `s-`, `app-`, `secu-`, `notif-`. Named exports only.
- **Consequences:** File names alone tell you what a file is and which layer it belongs to, which is what the boundary lint rules key on. Slightly more files — accepted.
