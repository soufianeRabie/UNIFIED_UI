/*
 * @s/ui — public API. The only entry point consumers may import:
 *
 *   import { SStack, SPanel } from '@s/ui';
 *
 * Every folder under lib/ follows the contract in
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
