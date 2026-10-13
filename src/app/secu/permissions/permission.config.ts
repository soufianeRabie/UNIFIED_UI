import { InjectionToken } from '@angular/core';

export type PermissionDenyMode = 'disable' | 'hide';

export interface PermissionConfig {
  /**
   * Default UI behavior when the user lacks a permission.
   * - 'disable': keep the control visible but disabled
   * - 'hide': remove the control from the UI
   */
  denyMode: PermissionDenyMode;

  /**
   * Page access rule for routing.
   * - 'any': any action for the page grants access to its route
   * - 'some': requires one of the actions listed in `routeAccessActions`
   */
  routeAccessMode: 'any' | 'some';

  /** Used only when `routeAccessMode` is 'some'. */
  routeAccessActions: string[];
}

export const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
  denyMode: 'hide',
  routeAccessMode: 'any',
  routeAccessActions: ['VIEW', 'READ', 'MANAGE'],
};

export const PERMISSION_CONFIG = new InjectionToken<PermissionConfig>('PERMISSION_CONFIG', {
  factory: () => DEFAULT_PERMISSION_CONFIG,
});
