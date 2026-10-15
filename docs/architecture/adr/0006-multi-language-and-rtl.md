# ADR 0006 — Any number of languages, left-to-right and right-to-left

- **Status:** Accepted · 2026-10-15
- **Context:** The app shipped with French and English hard-coded in four places (a `'en' | 'fr'` type, a toggle button, the DOM fallback translator, the i18n check). Clients will need more languages, Arabic first, which is written right-to-left. Adding a language must not require code changes.
- **Decision:**
  1. **Registry.** `public/i18n/languages.json` is the single list of languages: `code`, native `label`, `dir` (`ltr` | `rtl`), `locale` (BCP 47, e.g. `ar-MA`), `enabled`, plus `defaultLanguage` and `fallbackLanguage`. It is loaded at runtime, so enabling a language is a deploy of two JSON files, not a rebuild.
  2. **One file per language** in `public/i18n/<code>.json`, same key tree as the fallback language. Missing keys fall back to `fallbackLanguage` at runtime.
  3. **Document direction.** The active language sets `<html lang="…" dir="…">`. Layout is written with logical CSS properties (04 §2.7) so RTL needs no separate stylesheet. Legacy screens still use physical properties and are only RTL-correct once migrated.
  4. **No language codes in code.** Components and services use `I18nStore` (`current`, `dir`, `languages`, `use(code)`) from `core/i18n`; no `'fr' | 'en'` unions, no flags-per-language branches. The switcher lists the enabled languages from the registry and hides itself when only one is enabled.
  5. **The backend is told.** Every HTTP request carries `Accept-Language: <locale>` so APIs can localise messages and pick notification templates.
  6. **Gate.** `npm run i18n:check` fails when an _enabled_ language is missing a key used in code, or when the registry is inconsistent (default/fallback not enabled, file missing). Disabled languages report their coverage only — they can be translated progressively.
  7. **Fonts.** A language whose script the brand fonts do not cover overrides the font tokens under `:root:lang(<code>)` in `tokens.css` (Arabic: IBM Plex Sans Arabic, self-hosted via `@fontsource` when the language is enabled).
- **Adding a language:** add `public/i18n/<code>.json`, add an entry with `"enabled": false` to `languages.json`, translate until `i18n:check` reports 100 % for it, then set `"enabled": true`.
- **Consequences:** Language support is data, not code. RTL quality depends on the migration away from legacy CSS, which the Stylelint logical-property rule already enforces for new code. Dates and numbers are formatted with the active `locale` through `Intl` (shared pipes, Phase 2), not Angular's build-time `LOCALE_ID`.
