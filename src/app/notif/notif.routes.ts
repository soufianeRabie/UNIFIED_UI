import { Routes } from '@angular/router';

export const NOTIF_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notif-layout.component').then((m) => m.NotifLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent)
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/templates/templates.component').then((m) => m.TemplatesComponent)
      },
      {
        path: 'event-types',
        loadComponent: () =>
          import('./features/event-types/event-types.component').then((m) => m.EventTypesComponent)
      },
      {
        path: 'data-sources',
        loadComponent: () =>
          import('./features/data-sources/data-sources.component').then((m) => m.DataSourcesComponent)
      },
      {
        path: 'recipient-groups',
        loadComponent: () =>
          import('./features/recipient-groups/recipient-groups.component').then((m) => m.RecipientGroupsComponent)
      },
      {
        path: 'my-preferences',
        loadComponent: () =>
          import('./features/my-preferences/my-preferences.component').then((m) => m.MyPreferencesComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent)
      },
      {
        path: 'providers',
        loadComponent: () =>
          import('./features/providers/providers.component').then((m) => m.ProvidersComponent)
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/events/events.component').then((m) => m.EventsComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent)
      },
      {
        path: 'reference',
        loadComponent: () =>
          import('./features/reference/reference.component').then((m) => m.ReferenceComponent)
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];
