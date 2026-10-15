import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIcon } from '../icon/s-icon';

/**
 * Search box with icon and clear button. `value` is two-way; `searched` fires
 * once typing pauses (debounced), and immediately on clear or Escape.
 *
 *   <s-search [(value)]="query" (searched)="store.search($event)" />
 */
@Component({
  selector: 's-search',
  imports: [SIcon],
  templateUrl: './s-search.html',
  styleUrl: './s-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SSearch {
  private readonly labels = inject(SUiLabels);

  readonly value = model('');
  readonly placeholder = input<string>();
  readonly debounce = input(300, { transform: numberAttribute });
  readonly searched = output<string>();

  protected readonly text = computed(() => {
    this.labels.version();
    return {
      placeholder: this.placeholder() || this.labels.get('S.SEARCH.PLACEHOLDER'),
      clear: this.labels.get('S.SEARCH.CLEAR'),
    };
  });

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.searched.emit(value.trim()), this.debounce());
  }

  protected clear(): void {
    clearTimeout(this.timer);
    this.value.set('');
    this.searched.emit('');
  }
}
