import { InjectionToken } from '@angular/core';

/**
 * What a page may ask about the signed-in user's rights. Reads must be signal-based, so a `computed()` that calls them
 * updates when permissions load. The app provides the implementation (`app.config.ts`); domains depend on this token only.
 */
export interface PagePermissions {
  canCreate(pageCode: string): boolean;
  canRead(pageCode: string): boolean;
  canUpdate(pageCode: string): boolean;
  canDelete(pageCode: string): boolean;
}

export const PAGE_PERMISSIONS = new InjectionToken<PagePermissions>('PAGE_PERMISSIONS');
