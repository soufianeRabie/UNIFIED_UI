/*
 * @s/ui — public API. The only entry point consumers may import:
 *
 *   import { SStack, SPanel } from '@s/ui';
 *
 * Angular components only: framework-free logic, types and labels live in `@s/core`, styles in
 * `@s/tokens` (ADR 0010). Every folder under lib/ follows the contract in
 * docs/architecture/02-design-system.md §3 and is re-exported here through its
 * index.ts. Anything not exported here is private.
 */

export * from './lib/core';
export * from './lib/stack';
export * from './lib/row';
export * from './lib/grid';
export * from './lib/panel';
export * from './lib/text';
export * from './lib/heading';
export * from './lib/notice';
export * from './lib/page-header';
export * from './lib/icon';
export * from './lib/button';
export * from './lib/icon-button';
export * from './lib/stamp';
export * from './lib/empty';
export * from './lib/kpi';
export * from './lib/field';
export * from './lib/input';
export * from './lib/switch';
export * from './lib/search';
export * from './lib/filter-bar';
export * from './lib/pagination';
export * from './lib/data-table';
export * from './lib/dialog';
export * from './lib/confirm';
export * from './lib/popover';
export * from './lib/select';
export * from './lib/calendar';
export * from './lib/date-picker';
export * from './lib/column-filter';
export * from './lib/filter-chips';
export * from './lib/app-shell';
export * from './lib/sidebar-nav';
export * from './lib/breadcrumbs';
