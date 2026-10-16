import type { Routes } from '@angular/router';
import { UsersStore } from './data-access/users.store';

/** Users list, mounted by the app at `…/users`. The store lives and dies with the page. */
export const USERS_ROUTES: Routes = [
  {
    path: '',
    providers: [UsersStore],
    loadComponent: () => import('./features/users-list/users-list').then((m) => m.UsersList),
    title: 'Users — Security',
  },
];
