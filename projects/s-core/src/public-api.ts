/*
 * @s/core — framework-free part of the S design system (ADR 0010): the query model and its rules, date and
 * calendar maths, filter editors' conversions, select and table logic, label keys. Plain TypeScript, no Angular,
 * no React: every UI layer (`@s/ui` for Angular, a future `@s/react`) renders on top of it.
 */
export * from './i18n';
export * from './date';
export * from './calendar';
export * from './query';
export * from './select';
export * from './filter';
export * from './table';
export * from './nav';
