# CLAUDE.md — instructions for AI sessions in UNIFIED_UI

## Read first, in this order

1. `docs/PROGRESS.md` — current phase, next step, known issues, environment facts.
2. `docs/architecture/README.md` — the ten rules.
3. The handbook page(s) for the step you are about to do (`docs/architecture/01`–`07`, `adr/`).

## Non-negotiable

- The handbook in `docs/architecture/` is the contract. Do not write code that breaks it. If a rule must change, propose an ADR to the owner first.
- One component per folder (`.ts` / `.html` / `.scss` / `.types.ts` / `.spec.ts` / `index.ts`). No inline templates or styles, no `style=""`, no raw colours/sizes outside `projects/s-ui/styles/tokens.css`.
- Layers: `features → ui / data-access → domain`; `@s/ui` never imports app code; DTOs stay in `data-access`.
- Angular 21 modern APIs only: standalone, OnPush, `inject()`, signal `input/model/output`, `@if/@for`.
- Never commit secrets. Real `appsettings*.json` in the API repos are git-ignored on purpose.

## Workflow

- Work in the order of `docs/PROGRESS.md` §1. One step at a time; verify (build / tests / browser) before marking it done.
- After every step, update `docs/PROGRESS.md` following its "Update protocol".
- Ask the owner before: pushing, deleting folders or DB data, adding dependencies not in the handbook, changing a rule.
- Commit messages: Conventional Commits (`feat(s-ui): …`, `refactor(security): …`, `docs: …`).
