import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SKpi } from './s-kpi';

@Component({
  imports: [SKpi],
  template: `<s-kpi [value]="8" label="Roles" icon="id-card" tone="success" />`,
})
class Host {}

describe('SKpi', () => {
  it('shows the value, the label, the icon and the tone', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const kpi = fixture.nativeElement.querySelector('s-kpi') as HTMLElement;
    expect(kpi.querySelector('.value')?.textContent).toBe('8');
    expect(kpi.querySelector('.label')?.textContent).toBe('Roles');
    expect(kpi.querySelector('i')?.className).toBe('pi pi-id-card');
    expect(kpi.dataset['tone']).toBe('success');
  });
});
