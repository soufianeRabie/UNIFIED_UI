import { CdkListbox, CdkOption, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlSize } from '../core/scale.types';
import { SUiLabels } from '../core/s-ui-labels';
import { S_FIELD } from '../field/s-field.context';
import { SIcon } from '../icon/s-icon';
import { SPopover } from '../popover/s-popover';
import type { SSelectOption } from '@s/core';
import {
  SEARCHABLE_FROM,
  filterOptions,
  selectedValues,
  selectionSummary,
  valueFromSelection,
} from '@s/core';

/**
 * Our select (ADR 0008): one or many values, keyboard and type-ahead from the CDK listbox, a filter box for long
 * lists, our look in every browser and direction. Works with `[(value)]` or reactive forms.
 *
 *   <s-field label="Status">
 *     <s-select [options]="statusOptions" [(value)]="status" />
 *   </s-field>
 *   <s-select [options]="roleOptions" multiple formControlName="roles" />
 */
@Component({
  selector: 's-select',
  imports: [CdkListbox, CdkOption, SIcon, SPopover],
  templateUrl: './s-select.html',
  styleUrl: './s-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SSelect), multi: true }],
})
export class SSelect<T> implements ControlValueAccessor {
  private readonly labels = inject(SUiLabels);
  protected readonly field = inject(S_FIELD, { optional: true });

  readonly options = input.required<readonly SSelectOption<T>[]>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>();
  /** Accessible name when the select is not inside an `s-field`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly controlSize = input<ControlSize>('md');
  /** Filter box; by default only for lists longer than eight options. */
  readonly searchable = input<boolean | undefined>(undefined);
  readonly value = model<T | readonly T[] | null>(null);

  protected readonly open = signal(false);
  protected readonly term = signal('');
  protected readonly disabled = signal(false);
  protected readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly selection = computed(() => selectedValues(this.value()));
  protected readonly view = computed(() => {
    this.labels.version();
    const options = this.options();
    return {
      summary: selectionSummary(options, this.selection(), (count) =>
        this.labels.get('S.SELECT.COUNT', { count }),
      ),
      placeholder: this.placeholder() || this.labels.get('S.SELECT.PLACEHOLDER'),
      showFilter: this.searchable() ?? options.length > SEARCHABLE_FROM,
      filterLabel: this.labels.get('S.SELECT.FILTER'),
      empty: this.labels.get('S.SELECT.EMPTY'),
      visible: filterOptions(options, this.term()),
    };
  });

  private onChange: (value: T | readonly T[] | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected toggle(): void {
    if (this.disabled()) return;
    this.term.set('');
    this.open.update((open) => !open);
  }

  protected select(event: ListboxValueChangeEvent<T>): void {
    const next = valueFromSelection(event.value, this.multiple());
    this.value.set(next);
    this.onChange(next);
    if (!this.multiple()) this.open.set(false);
    if (!this.multiple()) this.trigger().nativeElement.focus();
  }

  protected onClosed(): void {
    this.onTouched();
  }

  protected onFilter(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }

  writeValue(value: T | readonly T[] | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | readonly T[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
