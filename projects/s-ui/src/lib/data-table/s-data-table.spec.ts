import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SCell } from './s-cell.directive';
import { SDataTable } from './s-data-table';
import type { SColumn, SSort } from './s-data-table.types';
import { SRowActions } from './s-row-actions.directive';

interface User {
  id: string;
  username: string;
  email: string | null;
  active: boolean;
}

const COLUMNS: SColumn[] = [
  { key: 'username', header: 'Username', sortable: true, mono: true },
  { key: 'email', header: 'Email', priority: 'medium' },
  { key: 'active', header: 'Status', width: 'sm' },
];

@Component({
  imports: [SDataTable, SCell, SRowActions],
  template: `
    <s-data-table
      [rows]="rows()"
      [columns]="columns"
      rowKey="id"
      caption="Users"
      [loading]="loading()"
      [error]="error()"
      [total]="total()"
      [(page)]="page"
      [(sort)]="sort"
      emptyTitle="No users yet"
    >
      <ng-template s-cell="active" [rows]="rows()" let-user>
        <b class="status">{{ user.active ? 'Active' : 'Inactive' }}</b>
      </ng-template>
      <ng-template s-row-actions [rows]="rows()" let-user>
        <button type="button" class="edit" (click)="edited.push(user.id)">Edit</button>
      </ng-template>
    </s-data-table>
  `,
})
class Host {
  readonly columns = COLUMNS;
  readonly rows = signal<User[]>([
    { id: 'u1', username: 'admin', email: 'admin@local.test', active: true },
    { id: 'u2', username: 'jdoe', email: null, active: false },
  ]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal<number | null>(null);
  readonly page = signal(1);
  readonly sort = signal<SSort | null>(null);
  readonly edited: string[] = [];
}

describe('SDataTable', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const refresh = () => fixture.detectChanges();
    return { fixture, host, refresh, app: fixture.componentInstance };
  }

  it('renders headers, default cells (— for empty) and custom cells', () => {
    const { host } = render();
    const headers = [...host.querySelectorAll('th')].map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Username', 'Email', 'Status', 'Actions']);
    const rows = host.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    const second = [...rows[1].querySelectorAll('td')].map((td) => td.textContent?.trim());
    expect(second.slice(0, 3)).toEqual(['jdoe', '—', 'Inactive']);
    expect(rows[0].querySelector('td')?.classList).toContain('mono');
    expect(host.querySelector('th[data-width="sm"]')).not.toBeNull();
    expect(host.querySelector('td[data-priority="medium"]')).not.toBeNull();
  });

  it('gives row actions the row and an accessible column header', () => {
    const { host, app } = render();
    expect(host.querySelector('th.actions-col .visually-hidden')?.textContent).toBe('Actions');
    (host.querySelectorAll('.edit')[1] as HTMLButtonElement).click();
    expect(app.edited).toEqual(['u2']);
  });

  it('cycles sort asc → desc → none and exposes aria-sort', () => {
    const { host, refresh, app } = render();
    const button = () => host.querySelector('th button.sort') as HTMLButtonElement;
    const th = () => host.querySelector('th') as HTMLElement;
    expect(host.querySelectorAll('th button.sort').length).toBe(1);

    button().click();
    refresh();
    expect(app.sort()).toEqual({ key: 'username', dir: 'asc' });
    expect(th().getAttribute('aria-sort')).toBe('ascending');

    button().click();
    refresh();
    expect(th().getAttribute('aria-sort')).toBe('descending');

    button().click();
    refresh();
    expect(app.sort()).toBeNull();
    expect(th().hasAttribute('aria-sort')).toBe(false);
  });

  it('shows skeleton rows while the first page loads, and dims stale rows on reload', () => {
    const { host, refresh, app } = render();
    app.loading.set(true);
    refresh();
    expect(host.querySelector('table')?.classList).toContain('dim');
    expect(host.querySelector('table')?.getAttribute('aria-busy')).toBe('true');

    app.rows.set([]);
    refresh();
    expect(host.querySelectorAll('tr.skeleton').length).toBe(5);
    expect(host.querySelector('tr.skeleton')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the empty state spanning every column', () => {
    const { host, refresh, app } = render();
    app.rows.set([]);
    refresh();
    const cell = host.querySelector('tbody td') as HTMLTableCellElement;
    expect(cell.colSpan).toBe(4);
    expect(cell.querySelector('s-empty .title')?.textContent).toBe('No users yet');
  });

  it('replaces the table with an alert when loading failed', () => {
    const { host, refresh, app } = render();
    app.error.set('Could not load users.');
    refresh();
    expect(host.querySelector('table')).toBeNull();
    expect(host.querySelector('s-notice')?.getAttribute('role')).toBe('alert');
  });

  it('adds pagination once a total is bound and pages two-way', () => {
    const { host, refresh, app } = render();
    expect(host.querySelector('s-pagination')).toBeNull();
    app.total.set(45);
    refresh();
    const next = host.querySelector(
      's-pagination button[aria-label="Next page"]',
    ) as HTMLButtonElement;
    next.click();
    refresh();
    expect(app.page()).toBe(2);
  });
});
