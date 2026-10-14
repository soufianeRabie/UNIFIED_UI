# ADR 0004 — Dossier design tokens as the single source of visual values

- **Status:** Accepted · 2026-10-14
- **Context:** The current UI is a generic dark dashboard (blue accent, glows, emoji icons) with colours hard-coded across 145 kB of CSS and 708 inline styles. The product owner wants a distinct identity, already proven in KAFALA.
- **Decision:** Adopt the KAFALA "dossier" language as tokens in `projects/s-ui/styles/tokens.css`: paper surfaces, green-cast ink, `seal` for the primary action, `stamp`/`sage`/`alert`/`amber` for state, Newsreader serif for titles, Sora for text, IBM Plex Mono for references, a 4px spacing grid. Light by default, dark via OS or `data-theme`. Fonts are self-hosted with `@fontsource` (no third-party CDN).
- **Consequences:** Every visual value has one owner. A client brand is a token override. Stylelint forbids raw values elsewhere. The same token file can be adopted by KAFALA (aliases for its existing variable names are included).
