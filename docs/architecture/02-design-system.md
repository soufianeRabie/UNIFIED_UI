# 02 — Design system (`@s/ui`)

`@s/ui` is the only place visual decisions are made. Screens compose it; they never restyle it.
It ports the KAFALA "S vocabulary" to Angular with the same names and the same dossier design language, so React and Angular products share one system.

## 1. Principles

1. **Names over looks.** A screen says _what_ (`<s-stamp tone="success">`), never _how_ (`color: green`).
2. **The scale is the API.** Inputs are typed unions of token steps (`gap: '0'…'6'`, `tone: 'muted' | …`). A component cannot be asked for a value outside the system.
3. **Native first.** Buttons, inputs and links stay native elements (`button[s-button]`, `input[s-input]`) so forms, routing, focus and assistive tech work for free.
4. **Grow, don't bypass.** If a screen needs something a component cannot do, the component gets a new input or variant in this library. Local overrides are rejected in review.
5. **Zero business knowledge.** No HTTP, no permissions, no translations service, no domain types. Text the library renders itself comes through `provideSUi({ translate })`.

## 2. Component inventory

| Group       | Components                                                                                               | Status                                          |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Arrangement | `SStack`, `SRow`, `SGrid`, `SPanel`, `SPanelHeader`, `SSplitView`                                        | Phase 1 (split view: 2)                         |
| Typography  | `SText`, `SHeading`, `SNotice`                                                                           | Phase 1                                         |
| Page        | `SPageHeader`, `SBreadcrumbs`, `SSaveBar`                                                                | Phase 1 (breadcrumbs, save bar: 2)              |
| Actions     | `SButton`, `SIconButton`, `SRowMenu`, `SSegmented`                                                       | Phase 1 (row menu, segmented: 2)                |
| Status      | `SStamp`, `SKpi`, `SEmpty`, `SAvatar`, `SSkeleton`                                                       | Phase 1 (avatar: 2)                             |
| Forms       | `SInput` (directive), `SField`, `SSwitch`, `SCheckbox`, `SSelect`, `SCombobox`, `SDatePicker`, `SSearch` | Phase 1: input, field, switch, search · 2: rest |
| Data        | `SDataTable`, `SColumnFilter`, `SFilterBar`, `SPagination`, `SMatrix`                                    | Phase 1 (column filter, matrix: 2)              |
| Overlays    | `SDialog`, `SConfirm` (service), `SToast` (service), `SPopover`, `SSheet`                                | Phase 1: dialog, confirm · 2: rest              |
| Shell       | `SAppShell`, `SSidebarNav`, `STopbar`                                                                    | Phase 2                                         |

## 3. Folder contract (every component, no exceptions)

```
projects/s-ui/src/lib/button/
├─ s-button.ts          class + metadata only (inputs, outputs, host bindings, computed view state)
├─ s-button.html        template
├─ s-button.scss        styles — tokens only, :host-scoped
├─ s-button.types.ts    exported unions/interfaces for the public API (if any)
├─ s-button.spec.ts     behaviour + accessibility tests
└─ index.ts             re-exports the public symbols of this folder
```

- Directives without a template (e.g. `SInput`) have no `.html`; their visual rules live in `styles/controls.css`.
- Sub-parts that are only meaningful inside a parent (e.g. `SCell`, `SRowActions` for the table) live in the parent folder, each in its own file: `s-cell.directive.ts`.
- Shared unions used by several components (`Space`, `TextTone`, `StateTone`…) live in `lib/core/scale.types.ts`.
- `public-api.ts` re-exports folder `index.ts` files only. Anything not exported there is private.

## 4. Component API rules

| Rule                                                                                    | Why                                                            |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ChangeDetectionStrategy.OnPush`, standalone, signal `input()` / `model()` / `output()` | Predictable rendering, zone-less ready                         |
| Variants via `data-*` host attributes, styled with `:host([data-variant="…"])`          | One selector per variant, no class soup, no `[ngClass]`        |
| Two-way state uses `model()` (`[(page)]`, `[(open)]`)                                   | Same pattern for every controllable component                  |
| Form controls implement `ControlValueAccessor`                                          | Work with reactive forms                                       |
| No `any` in public types; generics for row/item types (`SDataTable<T>`)                 | Type safety reaches the screen                                 |
| Derived view state is `computed()`; templates never call compute methods                | Performance + readability                                      |
| No `@Input` decorators, no `ngClass`, `ngStyle`, `*ngIf`, `*ngFor`                      | Modern Angular only                                            |
| No `::ng-deep`, no `ViewEncapsulation.None`                                             | Encapsulation is the guarantee that screens cannot leak styles |
| Icons are named (`icon="search"`) and resolved by `SIcon`                               | The glyph set can change in one place                          |

## 5. Accessibility contract (WCAG 2.2 AA)

- Every interactive element is reachable and operable by keyboard and shows `:focus-visible` (token `--focus-ring`).
- Icon-only buttons require `aria-label` (also used as the tooltip). The compiler enforces it: it is an `input.required`, and the template linter sees it as the button's content.
- State is never conveyed by colour alone (stamps have text and border; switches show a state label).
- Dialogs: focus trap, `Escape` closes, focus returns to the trigger, `aria-labelledby` set — provided by CDK.
- Tables: `<th scope="col">`, `aria-sort` on sortable headers, `aria-busy` while loading.
- Contrast: every token pair used for text meets 4.5:1 in both themes (checked when tokens change).

## 6. Theming

- Light is the default; dark follows `prefers-color-scheme`; `<html data-theme="light|dark">` forces one.
- Components only reference **semantic** tokens (`--ink-2`, `--seal`, `--rule`), never palette values, so a theme is a token file.
- A brand for a client = a new token file overriding the palette. Components do not change.

## 7. Usage example

```html
<s-page-header
  [title]="'SECU.USERS.TITLE' | translate"
  [subtitle]="'SECU.USERS.SUBTITLE' | translate"
>
  <button s-button variant="primary" icon="plus" s-page-actions (click)="create()">
    {{ 'SECU.USERS.NEW' | translate }}
  </button>
</s-page-header>

<s-panel>
  <s-filter-bar>
    <s-search [(value)]="query" (searched)="store.search($event)" />
    <s-switch [(checked)]="showInactive">{{ 'COMMON.SHOW_INACTIVE' | translate }}</s-switch>
  </s-filter-bar>

  <s-data-table
    [rows]="store.users()"
    [columns]="columns"
    rowKey="id"
    [loading]="store.loading()"
    [total]="store.total()"
    [(page)]="page"
  >
    <ng-template s-cell="status" [rows]="store.users()" let-user>
      <s-stamp [tone]="user.active ? 'success' : 'neutral'">…</s-stamp>
    </ng-template>
    <ng-template s-row-actions [rows]="store.users()" let-user>
      <button
        s-icon-button
        icon="pencil"
        [label]="'COMMON.EDIT' | translate"
        (click)="edit(user)"
      ></button>
    </ng-template>
  </s-data-table>
</s-panel>
```

## 8. Definition of done for a component

- [ ] Folder contract (§3) respected; exported from `index.ts` and `public-api.ts`.
- [ ] Tokens only (Stylelint passes); light and dark checked.
- [ ] Keyboard + screen-reader behaviour verified; spec covers inputs, outputs, a11y attributes.
- [ ] Documented with a usage snippet in the component's TSDoc.
- [ ] Used by at least one real screen before it is considered stable.
