import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SPanel } from './s-panel';
import { SPanelHeader } from './s-panel-header';

@Component({
  imports: [SPanel, SPanelHeader],
  template: `
    <s-panel tone="accent" padding="5">
      <p>body</p>
      <s-panel-header>Title <button type="button" sPanelActions>Add</button></s-panel-header>
    </s-panel>
  `,
})
class Host {}

describe('SPanel', () => {
  it('exposes tone and padding and renders the header before the body', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('s-panel') as HTMLElement;
    expect(panel.dataset['tone']).toBe('accent');
    expect(panel.dataset['padding']).toBe('5');
    expect(panel.firstElementChild?.tagName).toBe('S-PANEL-HEADER');
  });

  it('puts [sPanelActions] in the header actions slot', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelector('s-panel-header .actions') as HTMLElement;
    expect(actions.querySelector('button')?.textContent).toBe('Add');
  });
});
