import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { AuthStore } from '../../../core/stores/auth.store';
import { getAppConfig } from '../../../core/config/app-config';

export interface SecuMenuItem {
  idPage: number;
  pageCode: string;
  pageName: string;
  pageUrl: string | null;
  icon: string | null;
  pageType: string | null;
  sortOrder: number | null;
  actions: string[];
  children: SecuMenuItem[];
}

type PermissionMap = Record<string, string[]>;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  private readonly permissions = signal<PermissionMap>({});
  readonly loaded = signal(false);
  readonly menu = signal<SecuMenuItem[]>([]);
  private load$?: Observable<SecuMenuItem[]>;

  ensureLoaded(): Observable<SecuMenuItem[]> {
    if (this.loaded()) return of(this.menu());

    if (!this.load$) {
      const base = getAppConfig().apiUrl.replace(/\/api\/?$/, '');
      let headers = new HttpHeaders();
      const token = this.authStore.accessToken();
      if (token) headers = headers.set('Authorization', `Bearer ${token}`);

      this.load$ = this.http.get<SecuMenuItem[]>(`${base}/api/secu/me/menu`, { headers }).pipe(
        tap((items) => this.apply(items ?? [])),
        catchError((err) => {
          console.warn('NOTIF: unable to load security menu; denying gated actions.', err);
          this.apply([]);
          return of([] as SecuMenuItem[]);
        }),
        shareReplay(1)
      );
    }

    return this.load$;
  }

  reload(): Observable<SecuMenuItem[]> {
    this.invalidate();
    return this.ensureLoaded();
  }

  invalidate(): void {
    this.permissions.set({});
    this.menu.set([]);
    this.loaded.set(false);
    this.load$ = undefined;
  }

  can(page: string, action: string): boolean {
    if (!page || !action) return false;
    const allowed = this.permissions()[page.toUpperCase()];
    if (!allowed) return false;
    return allowed.includes('*') || allowed.includes(action.toUpperCase());
  }

  canRead(page: string): boolean { return this.can(page, 'READ'); }
  canCreate(page: string): boolean { return this.can(page, 'CREATE'); }
  canUpdate(page: string): boolean { return this.can(page, 'UPDATE'); }
  canDelete(page: string): boolean { return this.can(page, 'DELETE'); }

  getActionsForPage(page: string): string[] {
    return [...(this.permissions()[(page ?? '').toUpperCase()] ?? [])];
  }

  canAny$(page: string, actions: string[]): Observable<boolean> {
    return this.ensureLoaded().pipe(map(() => actions.some((a) => this.can(page, a))));
  }

  private apply(items: SecuMenuItem[]): void {
    this.menu.set(items);
    this.permissions.set(this.buildMap(items));
    this.loaded.set(true);
  }

  private buildMap(items: SecuMenuItem[]): PermissionMap {
    const map: PermissionMap = {};
    const visit = (item: SecuMenuItem) => {
      if (item?.pageCode) {
        const page = item.pageCode.toUpperCase();
        map[page] ??= [];
        for (const action of item.actions ?? []) {
          const a = action.toUpperCase();
          if (!map[page].includes(a)) map[page].push(a);
        }
      }
      (item.children ?? []).forEach(visit);
    };
    (items ?? []).forEach(visit);
    return map;
  }
}
