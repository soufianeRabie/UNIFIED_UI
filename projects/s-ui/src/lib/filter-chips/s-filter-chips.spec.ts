import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { startOfDayInstant } from '@s/core';
import type { SColumn } from '@s/core';
import { operatorsFor } from '@s/core';
import type { SFilterType, SQuery, SQueryField } from '@s/core';
import { createQuery, setColumnFilter } from '@s/core';
import { SFilterChips } from './s-filter-chips';
import { chipValueText } from '@s/core';

function field(name: string, type: SFilterType): SQueryField {
  return {
    name,
    type,
    filterable: true,
    sortable: true,
    searchable: false,
    nullable: true,
    operators: operatorsFor(type, true),
  };
}

const FIELDS = [
  field('createdAt', 'datetime'),
  field('isActive', 'boolean'),
  field('email', 'text'),
];
const COLUMNS: SColumn[] = [
  { key: 'createdAt', header: 'Created' },
  { key: 'isActive', header: 'Status' },
];

@Component({
  imports: [SFilterChips],
  template: `<s-filter-chips [(query)]="query" [fields]="fields" [columns]="columns" />`,
})
class Host {
  readonly fields = FIELDS;
  readonly columns = COLUMNS;
  readonly query = signal<SQuery>(
    setColumnFilter(
      setColumnFilter(createQuery({ page: 3 }), 'isActive', {
        kind: 'condition',
        field: 'isActive',
        op: 'eq',
        value: true,
      }),
      'email',
      { kind: 'condition', field: 'email', op: 'isNull' },
    ),
  );
}

describe('SFilterChips', () => {
  const format = { locale: 'en-GB', yes: 'Yes', no: 'No' };

  it('writes values the way people read them', () => {
    expect(
      chipValueText(
        FIELDS[0],
        {
          kind: 'condition',
          field: 'createdAt',
          op: 'between',
          value: [startOfDayInstant('2026-10-01'), startOfDayInstant('2026-10-16')],
        },
        format,
      ),
    ).toBe('1 Oct 2026 – 15 Oct 2026');
    expect(
      chipValueText(
        field('n', 'number'),
        { kind: 'condition', field: 'n', op: 'in', value: [1000, 2, 3, 4, 5] },
        format,
      ),
    ).toBe('1,000, 2, 3 +2');
    expect(
      chipValueText(FIELDS[2], { kind: 'condition', field: 'email', op: 'isNull' }, format),
    ).toBe('');
  });

  it('lists each column filter with its header and removes one or all', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const chips = () => [...el.querySelectorAll('.chip .text')].map((c) => c.textContent?.trim());

    expect(chips()).toEqual(['Status · is Yes', 'email · is empty']);
    const remove = el.querySelector('.remove') as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe('Remove filter: Status · is Yes');

    remove.click();
    fixture.detectChanges();
    expect(chips()).toEqual(['email · is empty']);
    expect(fixture.componentInstance.query().page).toBe(1);
    expect(el.querySelector('.clear-all')).toBeNull();
  });
});
