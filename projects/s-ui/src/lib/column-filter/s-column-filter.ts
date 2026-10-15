import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { SButton } from '../button/s-button';
import type { SDateRange } from '../calendar/s-calendar.types';
import { SUiLabels } from '../core/s-ui-labels';
import { SDatePicker } from '../date-picker/s-date-picker';
import { SInput } from '../input/s-input';
import { conditionIssues } from '../query/s-filter-condition.utils';
import type {
  SFilterCondition,
  SFilterOperator,
  SQueryField,
  SQueryLimits,
} from '../query/s-query.types';
import { SSelect } from '../select/s-select';
import type { SSelectOption } from '../select/s-select.types';
import type { FilterDraft } from './s-column-filter.types';
import {
  conditionFrom,
  draftFrom,
  editorKind,
  editorOperators,
  operatorLabelKey,
} from './s-column-filter.utils';

/**
 * Type-aware filter editor for one column (handbook 08 §7): the operators of the field's type, the right editor
 * for the value (text, number, range, our date pickers, yes/no, options), the server's validation messages before
 * sending. Emits the condition on Apply, or `null` on Clear.
 *
 *   <s-column-filter [field]="field" label="Created" [condition]="current" [limits]="limits"
 *                    (applied)="setColumnFilter($event)" />
 */
@Component({
  selector: 's-column-filter',
  imports: [SButton, SDatePicker, SInput, SSelect],
  templateUrl: './s-column-filter.html',
  styleUrl: './s-column-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SColumnFilter {
  private readonly labels = inject(SUiLabels);

  readonly field = input.required<SQueryField>();
  /** Translated column header. */
  readonly label = input.required<string>();
  readonly condition = input<SFilterCondition | undefined>(undefined);
  readonly limits = input<SQueryLimits | null>(null);
  readonly applied = output<SFilterCondition | null>();

  protected readonly draft = linkedSignal<FilterDraft>(() =>
    draftFrom(this.field(), this.condition()),
  );

  protected readonly view = computed(() => {
    this.labels.version();
    const field = this.field();
    const draft = this.draft();
    const condition = conditionFrom(field, draft);
    const limits = this.limits();
    const issues = condition && limits ? conditionIssues(condition, field, limits) : [];
    return {
      title: this.labels.get('S.FILTER.TITLE', { column: this.label() }),
      kind: editorKind(field, draft.op),
      operators: editorOperators(field).map((op): SSelectOption<SFilterOperator> => ({
        value: op,
        label: this.labels.get(operatorLabelKey(op, field.type)),
      })),
      choices: (field.options ?? []).map((o): SSelectOption<string> => ({ value: o, label: o })),
      range: { start: draft.startDay, end: draft.endDay } satisfies SDateRange,
      error: issues[0] ? this.labels.error(issues[0].code, issues[0].args) : null,
      canApply: !!condition && issues.length === 0,
      text: {
        operator: this.labels.get('S.FILTER.OPERATOR'),
        value: this.labels.get('S.FILTER.VALUE'),
        values: this.labels.get('S.FILTER.VALUES'),
        from: this.labels.get('S.FILTER.FROM'),
        to: this.labels.get('S.FILTER.TO'),
        yes: this.labels.get('S.FILTER.YES'),
        no: this.labels.get('S.FILTER.NO'),
        apply: this.labels.get('S.FILTER.APPLY'),
        clear: this.labels.get('S.FILTER.CLEAR'),
      },
    };
  });

  protected update(patch: Partial<FilterDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  protected setOperator(op: SFilterOperator | readonly SFilterOperator[] | null): void {
    if (typeof op === 'string') this.update({ op });
  }

  protected setChoices(value: string | readonly string[] | null): void {
    this.update({ choices: value === null ? [] : typeof value === 'string' ? [value] : value });
  }

  protected setRange(range: SDateRange | null): void {
    this.update({ startDay: range?.start ?? null, endDay: range?.end ?? null });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected apply(event?: Event): void {
    event?.preventDefault();
    if (this.view().canApply) this.applied.emit(conditionFrom(this.field(), this.draft()));
  }

  protected clear(): void {
    this.applied.emit(null);
  }
}
