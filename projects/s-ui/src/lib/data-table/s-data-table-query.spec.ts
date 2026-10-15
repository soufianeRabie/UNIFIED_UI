import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { operatorsFor } from '../query/s-filter-operators';
import type { SQuery, SQueryField, SQueryLimits } from '../query/s-query.types';
import { createQuery } from '../query/s-query.utils';
import { SDataTable } from './s-data-table';
import type { SColumn } from './s-data-table.types';

interface Row {
  readonly id: string;
  readonly username: string;
  readonly age: number;
}

const COLUMNS: SColumn[] = [
  { key: 'username', header: 'Username', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
];

const FIELDS: SQueryField[] = [
  {
    name: 'username',
    type: 'text',
    filterable: true,
    sortable: true,
    searchable: true,
    nullable: false,
    operators: operatorsFor('text', false),
  },
  {
    name: 'age',
    type: 'number',
    filterable: false,
    sortable: true,
    searchable: false,
    nullable: false,
    operators: operatorsFor('number', false),
  },
];

const LIMITS: SQueryLimits = {
  maxPageSize: 100,
  maxResultWindow: 60,
  maxSort: 3,
  maxConditions: 25,
  maxDepth: 3,
  maxInValues: 100,
  maxSearchLength: 200,
  maxTextValueLength: 500,
};

@Component({
  imports: [SDataTable],
  template: `
    <s-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      [total]="1000"
      [(query)]="query"
      [fields]="fields"
      [limits]="limits"
    />
  `,
})
class Host {
  readonly rows: Row[] = [{ id: '1', username: 'ada', age: 36 }];
  readonly columns = COLUMNS;
  readonly fields = FIELDS;
  readonly limits = LIMITS;
  readonly query = signal<SQuery | null>(createQuery({ page: 2 }));
}

describe('SDataTable (query mode)', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const sortButton = (i: number) => el.querySelectorAll<HTMLButtonElement>('th .sort')[i];
    return { fixture, el, sortButton, host: fixture.componentInstance };
  }

  it('sorts through the query, adding keys with Shift and numbering them', () => {
    const { fixture, el, sortButton, host } = render();
    sortButton(0).click();
    sortButton(1).dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
    fixture.detectChanges();

    expect(host.query()?.sort).toEqual([
      { field: 'username', dir: 'asc' },
      { field: 'age', dir: 'asc' },
    ]);
    expect(host.query()?.page).toBe(1);
    expect([...el.querySelectorAll('.order')].map((o) => o.textContent?.trim())).toEqual([
      '1',
      '2',
    ]);
    expect(el.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');
  });

  it('offers a filter button only on filterable columns and applies the edited condition', () => {
    const { fixture, el, host } = render();
    const buttons = el.querySelectorAll<HTMLButtonElement>('th .filter');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute('aria-label')).toBe('Filter by Username');

    buttons[0].click();
    fixture.detectChanges();
    const input = document.querySelector('.s-popover-pane input[s-input]') as HTMLInputElement;
    input.focus();
    input.value = 'ad';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (document.querySelector('.s-popover-pane button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.query()?.filter.conditions).toEqual([
      { kind: 'condition', field: 'username', op: 'contains', value: 'ad' },
    ]);
    expect(document.querySelector('.s-popover-pane')).toBeNull();
    expect(buttons[0].classList).toContain('active');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('pages through the query and never past the result window', () => {
    const { fixture, el, host } = render();
    expect(el.querySelector('.range')?.textContent).toContain('21–40 of 60');
    const next = el.querySelector<HTMLButtonElement>('[aria-label="Next page"]');
    next?.click();
    fixture.detectChanges();
    expect(host.query()?.page).toBe(3);
    expect(el.querySelector<HTMLButtonElement>('[aria-label="Next page"]')?.disabled).toBe(true);
  });
});
