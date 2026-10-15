import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { operatorsFor } from '@s/core';
import type { SFilterCondition, SQueryField, SQueryLimits } from '@s/core';
import { SColumnFilter } from './s-column-filter';

const LIMITS: SQueryLimits = {
  maxPageSize: 100,
  maxResultWindow: 10_000,
  maxSort: 3,
  maxConditions: 25,
  maxDepth: 3,
  maxInValues: 100,
  maxSearchLength: 200,
  maxTextValueLength: 5,
};

const AGE: SQueryField = {
  name: 'age',
  type: 'number',
  filterable: true,
  sortable: true,
  searchable: false,
  nullable: false,
  operators: operatorsFor('number', false),
};

const ACTIVE: SQueryField = { ...AGE, name: 'isActive', type: 'boolean', operators: ['eq'] };

@Component({
  imports: [SColumnFilter],
  template: `
    <s-column-filter
      [field]="field()"
      label="Age"
      [condition]="condition()"
      [limits]="limits"
      (applied)="applied.push($event)"
    />
  `,
})
class Host {
  readonly field = signal(AGE);
  readonly condition = signal<SFilterCondition | undefined>(undefined);
  readonly limits = LIMITS;
  readonly applied: (SFilterCondition | null)[] = [];
}

describe('SColumnFilter', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = <T extends HTMLElement>(selector: string) =>
      fixture.nativeElement.querySelector(selector) as T;
    const type = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const applyButton = () => el<HTMLButtonElement>('button[type="submit"]');
    return { fixture, el, type, applyButton, host: fixture.componentInstance };
  }

  it('titles the editor and starts with the type default operator', () => {
    const { el } = render();
    expect(el('.title').textContent).toContain('Filter · Age');
    expect(el('s-select .trigger').textContent).toContain('Is');
  });

  it('applies only a valid value, typed for the contract', () => {
    const { el, type, applyButton, host } = render();
    expect(applyButton().disabled).toBe(true);

    type(el<HTMLInputElement>('input[s-input]'), '4 2');
    applyButton().click();
    expect(host.applied).toEqual([{ kind: 'condition', field: 'age', op: 'eq', value: 42 }]);
  });

  it('shows the server message for an invalid value before sending', () => {
    const { el, type, applyButton } = render();
    type(el<HTMLInputElement>('input[s-input]'), 'abc');
    expect(applyButton().disabled).toBe(true);
    expect(el('[role="alert"]').textContent).toContain('QUERY.INVALID_VALUE');
  });

  it('edits an existing condition and clears it', () => {
    const { fixture, el, host } = render();
    host.field.set(ACTIVE);
    host.condition.set({ kind: 'condition', field: 'isActive', op: 'eq', value: true });
    fixture.detectChanges();

    const [yes, no] = Array.from(el('.segmented').querySelectorAll('button'));
    expect(yes.getAttribute('aria-pressed')).toBe('true');
    no.click();
    fixture.detectChanges();
    el<HTMLButtonElement>('button[type="submit"]').click();
    el<HTMLButtonElement>('button[type="button"][variant="ghost"]').click();

    expect(host.applied).toEqual([
      { kind: 'condition', field: 'isActive', op: 'eq', value: false },
      null,
    ]);
  });
});
