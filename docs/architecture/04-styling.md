# 04 — Styling

## 1. Where CSS may exist

| Location                                                       | Allowed content                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `projects/s-ui/styles/tokens.css`                              | The **only** place with raw values: colours, sizes, fonts, shadows, durations                    |
| `projects/s-ui/styles/base.css`, `controls.css`, `overlay.css` | Document defaults and native-control skins, tokens only                                          |
| `projects/s-ui/src/lib/**/*.scss`                              | Component styles, `:host`-scoped, tokens only                                                    |
| `src/app/core/shell/**/*.scss`                                 | Application frame layout (sidebar width, grid areas), tokens only                                |
| `src/app/domains/**/ui/**/*.scss`                              | Rare: domain visuals that are not generic (e.g. a permission matrix cell). Tokens only, reviewed |
| `src/app/domains/**/features/**`                               | **No styles.** Pages compose components                                                          |
| `src/styles/vendor/*.css`                                      | Quarantined third-party overrides (PrimeNG during migration). Deleted at the end of migration    |

## 2. Rules (enforced by Stylelint)

1. **No raw colours** — no hex, `rgb()`, `hsl()`, named colours outside `tokens.css`. Tints use `color-mix(in srgb, var(--token) N%, transparent)`.
2. **No raw lengths for spacing, type or radius** — `var(--space-*)`, `var(--text-*)`, `var(--radius-*)`. Allowed raw values: `0`, `1px` borders, `%`, `fr`, `ch`, and fixed component geometry (e.g. a 34px control height) inside `@s/ui` only.
3. **No `!important`** outside `src/styles/vendor/`.
4. **No `::ng-deep`**, no `ViewEncapsulation.None`.
5. **No `z-index` numbers** — `var(--layer-*)`.
6. **No transitions without tokens** — `var(--duration-*) var(--ease-standard)`; motion is disabled by `prefers-reduced-motion` through the tokens.
7. **Logical properties** (`margin-inline`, `padding-block`, `inset-inline-start`) so RTL works.
8. **No element selectors in components** except inside `:host` for the component's own native parts.
9. **Selectors stay shallow**: max 3 compound selectors, no IDs.

## 3. Cascade layers

```
@layer tokens, base, components;   ← declared once in s-ui/styles/index.css
```

Tokens lose to everything; library components lose to application styles. Component `.scss` files are encapsulated by Angular and need no layer.

## 4. Typography roles

| Role                               | Token / component                                        |
| ---------------------------------- | -------------------------------------------------------- |
| Page title                         | `SPageHeader` → `--font-serif`, `--text-display` (fluid) |
| Section title                      | `SHeading level=2/3`                                     |
| Body                               | `--font-sans`, `--text-base` (13px)                      |
| Secondary text                     | `SText tone="muted"`                                     |
| References (ids, codes, usernames) | `SText mono` / column `mono: true` → `--font-mono`       |
| Labels, table headers              | `--text-xs`, caps, `--tracking-caps`                     |

## 5. Colour roles

| Meaning                          | Token family                                                | Example                         |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| Primary action, brand, selection | `--seal`                                                    | Save button, active nav item    |
| Success / active / granted       | `--sage`                                                    | "Active" stamp                  |
| Warning                          | `--amber-ink`                                               | expiring token                  |
| Error / destructive              | `--alert`                                                   | delete button, validation       |
| Legal / pending / special        | `--stamp`                                                   | pending approval                |
| Text                             | `--ink`, `--ink-2`, `--ink-3`                               | body, secondary, subtle         |
| Surfaces                         | `--paper`, `--paper-raised`, `--paper-sunk`, `--paper-deep` | page, card, table header, track |
| Lines                            | `--rule`, `--rule-strong`                                   | dividers, control borders       |

Each family has `-wash` (background tint) and `-contrast` (text on a filled background). Never put `--ink` text on a `--seal` fill — use `--seal-contrast`.
