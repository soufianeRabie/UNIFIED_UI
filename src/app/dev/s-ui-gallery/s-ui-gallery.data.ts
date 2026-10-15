import type { SColumn } from '@s/ui';

export interface GalleryUser {
  readonly id: string;
  readonly username: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly role: string;
  readonly active: boolean;
}

export const GALLERY_COLUMNS: readonly SColumn[] = [
  { key: 'username', header: 'Username', sortable: true, mono: true },
  { key: 'fullName', header: 'Full name', sortable: true },
  { key: 'email', header: 'Email', priority: 'medium' },
  { key: 'role', header: 'Role', priority: 'low', width: 'md' },
  { key: 'active', header: 'Status', width: 'sm' },
];

export const GALLERY_USERS: readonly GalleryUser[] = [
  {
    id: 'u1',
    username: 'admin',
    fullName: 'System Administrator',
    email: 'admin@local.test',
    role: 'SECU_ADMIN',
    active: true,
  },
  {
    id: 'u2',
    username: 'k.benali',
    fullName: 'Karima Benali',
    email: 'k.benali@example.com',
    role: 'MANAGER',
    active: true,
  },
  {
    id: 'u3',
    username: 'y.idrissi',
    fullName: 'Youssef Idrissi',
    email: null,
    role: 'USER',
    active: false,
  },
  {
    id: 'u4',
    username: 's.amrani',
    fullName: 'Salma Amrani',
    email: 's.amrani@example.com',
    role: 'AUDITOR',
    active: true,
  },
];
