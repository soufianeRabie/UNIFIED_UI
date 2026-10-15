import { TestBed } from '@angular/core/testing';
import { SConfirm } from './s-confirm';

describe('SConfirm', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  async function ask(tone?: 'danger') {
    const confirm = TestBed.inject(SConfirm);
    const answer = confirm.ask({ title: 'Delete user', message: 'admin will lose access.', tone });
    await Promise.resolve();
    TestBed.tick();
    const frame = document.querySelector('s-confirm-dialog .frame') as HTMLElement;
    return { answer, frame };
  }

  it('describes the decision in an alert dialog', async () => {
    const { frame, answer } = await ask('danger');
    expect(frame.getAttribute('role')).toBe('alertdialog');
    expect(document.getElementById(frame.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(
      'Delete user',
    );
    expect(document.getElementById(frame.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      'admin will lose access.',
    );
    const confirm = frame.querySelector('.confirm') as HTMLButtonElement;
    expect(confirm.dataset['variant']).toBe('danger');
    expect(confirm.textContent?.trim()).toBe('Delete');
    (frame.querySelector('.cancel') as HTMLButtonElement).click();
    await answer;
  });

  it('resolves true on confirm and false on cancel', async () => {
    const first = await ask();
    (first.frame.querySelector('.confirm') as HTMLButtonElement).click();
    expect(await first.answer).toBe(true);

    const second = await ask();
    expect((second.frame.querySelector('.confirm') as HTMLButtonElement).textContent?.trim()).toBe(
      'Confirm',
    );
    (second.frame.querySelector('.cancel') as HTMLButtonElement).click();
    expect(await second.answer).toBe(false);
  });
});
