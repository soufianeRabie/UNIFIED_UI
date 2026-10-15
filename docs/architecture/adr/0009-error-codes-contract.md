# ADR 0009 — The UI speaks error codes, not server sentences

- **Status:** Accepted · 2026-10-15
- **Context:** The APIs now answer every error with RFC 9457 problem details carrying a stable `code`, named `args` and, for validation, `errors[]` with JSON paths (PLATFORM_DOTNET ADR 0002). Legacy screens show `error.title` as free text. The UI supports any number of languages, highlights invalid fields, and must react to protection responses (413, 429, 504).
- **Decision:**
  1. **Translate codes.** The UI renders an error from `ERRORS.<code>` in its own i18n files, interpolating `args` (`{{max}}`). `title` / `message` (already localized by the server from `Accept-Language`) are the fallback when a key is missing — never the first choice.
  2. **One mapper.** `core/errors` owns the problem → `AppError` mapping (`code`, `args`, `fieldErrors: { path, code, args }[]`, `retryAfterSeconds`, `correlationId`). Features never read `HttpErrorResponse` themselves.
  3. **Field errors by path.** Forms and the query model map `errors[].path` (`filter.conditions[1].value`, `size`) to the control or column filter that produced it.
  4. **Protection responses are part of the UX.** `429` disables the triggering action for `Retry-After` seconds with a translated message; `413` and `504` show translated notices; the correlation id is shown in "technical details" so support can find the logs.
  5. **i18n gate.** Every code the UI can receive (`COMMON.*`, `QUERY.*`, and each service area as it migrates) has an `ERRORS.*` key in every enabled language; `check-i18n` reports missing ones.
- **Consequences:** Messages are consistent across screens and languages, and precise per field. Adding a server error code requires adding its UI key (same rule as server resources). Legacy screens keep reading `title` until migrated — the server keeps it meaningful for them.
