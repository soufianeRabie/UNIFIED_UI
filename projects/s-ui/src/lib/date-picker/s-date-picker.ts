import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SCalendar } from '../calendar/s-calendar';
import type { CalendarMode, SDateRange } from '../calendar/s-calendar.types';
import type { ControlSize } from '../core/scale.types';
import { SUiLabels } from '../core/s-ui-labels';
import { S_FIELD } from '../field/s-field.context';
import { SIcon } from '../icon/s-icon';
import { SPopover } from '../popover/s-popover';
import { type DatePickerValue, isEmptyPick, pickerText } from './s-date-picker.utils';

/**
 * Our date field (ADR 0008 — never `<input type="date">`): a button showing the date in the user's locale, our
 * calendar in a popover, a clear button. Single day or range; ISO values (`YYYY-MM-DD`).
 *
 *   <s-field label="Born on"><s-date-picker [(value)]="born" /></s-field>
 *   <s-date-picker mode="range" [(range)]="period" aria-label="Created between" />
 */
@Component({
  selector: 's-date-picker',
  imports: [SCalendar, SIcon, SPopover],
  templateUrl: './s-date-picker.html',
  styleUrl: './s-date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SDatePicker), multi: true },
  ],
})
export class SDatePicker implements ControlValueAccessor {
  private readonly labels = inject(SUiLabels);
  protected readonly field = inject(S_FIELD, { optional: true });

  readonly mode = input<CalendarMode>('single');
  readonly value = model<string | null>(null);
  readonly range = model<SDateRange | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  readonly placeholder = input<string>();
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly controlSize = input<ControlSize>('md');

  protected readonly open = signal(false);
  protected readonly disabled = signal(false);

  protected readonly view = computed(() => {
    this.labels.version();
    const range = this.mode() === 'range';
    return {
      text: pickerText(this.labels.locale(), this.mode(), this.value(), this.range()),
      placeholder:
        this.placeholder() ||
        this.labels.get(range ? 'S.DATE.RANGE_PLACEHOLDER' : 'S.DATE.PLACEHOLDER'),
      clear: this.labels.get('S.DATE.CLEAR'),
      empty: isEmptyPick(this.mode(), this.value(), this.range()),
    };
  });

  private onChange: (value: DatePickerValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected toggle(): void {
    if (!this.disabled()) this.open.update((open) => !open);
  }

  protected onDay(iso: string | null): void {
    this.value.set(iso);
    this.onChange(iso);
  }

  protected onRange(range: SDateRange | null): void {
    this.range.set(range);
    if (range?.end) this.onChange(range);
  }

  protected clear(): void {
    this.value.set(null);
    this.range.set(null);
    this.onChange(null);
    this.onTouched();
  }

  protected onClosed(): void {
    this.onTouched();
  }

  writeValue(value: DatePickerValue): void {
    if (this.mode() === 'range') this.range.set(typeof value === 'object' ? value : null);
    else this.value.set(typeof value === 'string' ? value : null);
  }

  registerOnChange(fn: (value: DatePickerValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
