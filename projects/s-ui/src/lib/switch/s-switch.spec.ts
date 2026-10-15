import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SSwitch } from './s-switch';

@Component({
  imports: [SSwitch, ReactiveFormsModule],
  template: `<s-switch [formControl]="active">Active</s-switch>`,
})
class Host {
  readonly active = new FormControl(true, { nonNullable: true });
}

describe('SSwitch', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return { fixture, host, button: host.querySelector('[role="switch"]') as HTMLButtonElement };
  }

  it('is a labelled switch reflecting the form value', () => {
    const { host, button } = render();
    const label = host.querySelector('.label') as HTMLElement;
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.textContent).toBe('Active');
  });

  it('toggles on click and writes back to the form', () => {
    const { fixture, button } = render();
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active.value).toBe(false);
    expect(button.getAttribute('aria-checked')).toBe('false');
  });

  it('follows the form disabled state', () => {
    const { fixture, button } = render();
    fixture.componentInstance.active.disable();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.active.value).toBe(true);
  });
});
