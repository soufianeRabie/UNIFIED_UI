import { operatorsFor, type SColumn, type SQueryField, type SQueryLimits } from '@s/ui';

export const QUERY_COLUMNS: readonly SColumn[] = [
  { key: 'username', header: 'Username', sortable: true, mono: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true, width: 'md' },
  { key: 'failedLoginCount', header: 'Failed logins', sortable: true, align: 'end', width: 'sm' },
  { key: 'createdAt', header: 'Created', sortable: true, width: 'lg' },
  { key: 'active', header: 'Status', width: 'sm' },
];

function field(
  name: string,
  type: SQueryField['type'],
  nullable: boolean,
  options?: readonly string[],
): SQueryField {
  return {
    name,
    type,
    filterable: true,
    sortable: type !== 'boolean',
    searchable: type === 'text',
    nullable,
    operators: operatorsFor(type, nullable),
    options,
  };
}

/** What `GET …/users/query/schema` returns, mapped (core/query). */
export const QUERY_FIELDS: readonly SQueryField[] = [
  field('username', 'text', false),
  field('email', 'text', true),
  field('role', 'enum', false, ['SECU_ADMIN', 'MANAGER', 'USER', 'AUDITOR']),
  field('failedLoginCount', 'number', false),
  field('createdAt', 'datetime', false),
  field('active', 'boolean', false),
];

export const QUERY_LIMITS: SQueryLimits = {
  maxPageSize: 100,
  maxResultWindow: 10_000,
  maxSort: 3,
  maxConditions: 25,
  maxDepth: 3,
  maxInValues: 100,
  maxSearchLength: 200,
  maxTextValueLength: 500,
};

export const QUERY_ROWS = [
  {
    id: 'u1',
    username: 'admin',
    email: 'admin@local.test',
    role: 'SECU_ADMIN',
    failedLoginCount: 0,
    createdAt: '2026-01-10',
    active: true,
  },
  {
    id: 'u2',
    username: 'k.benali',
    email: null,
    role: 'MANAGER',
    failedLoginCount: 3,
    createdAt: '2026-03-05',
    active: false,
  },
];
