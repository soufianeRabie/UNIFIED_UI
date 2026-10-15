import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { operatorLabelKey } from '../column-filter/s-column-filter.utils';
import { SUiLabels } from '../core/s-ui-labels';
import type { SColumn } from '../data-table/s-data-table.types';
import { SIcon } from '../icon/s-icon';
import type { SFilterCondition, SQuery, SQueryField } from '../query/s-query.types';
import { clearFilters, setColumnFilter } from '../query/s-query.utils';
import { chipValueText } from './s-filter-chips.utils';

/**
 * The active column filters as removable chips, under the filter bar: users see at a glance why the list is
 * narrowed, and undo one filter or all of them. Renders nothing when no column is filtered.
 *
 *   <s-filter-chips [(query)]="query" [fields]="schema.fields" [columns]="columns" />
 */
@Component({
  selector: 's-filter-chips',
  imports: [SIcon],
  templateUrl: './s-filter-chips.html',
  styleUrl: './s-filter-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SFilterChips {
  private readonly labels = inject(SUiLabels);

  readonly query = model.required<SQuery>();
  readonly fields = input.required<readonly SQueryField[]>();
  /** Headers of the table, so chips use the same words as the columns. */
  readonly columns = input<readonly SColumn[]>([]);

  protected readonly view = computed(() => {
    this.labels.version();
    const format = {
      locale: this.labels.locale(),
      yes: this.labels.get('S.FILTER.YES'),
      no: this.labels.get('S.FILTER.NO'),
    };
    const fields = new Map(this.fields().map((f) => [f.name, f]));
    const headers = new Map(this.columns().map((c) => [c.key, c.header]));
    const chips = this.query()
      .filter.conditions.filter((node): node is SFilterCondition => node.kind === 'condition')
      .flatMap((condition) => {
        const field = fields.get(condition.field);
        if (!field) return [];
        const text = [
          headers.get(field.name) ?? field.name,
          '·',
          this.labels.get(operatorLabelKey(condition.op, field.type)).toLowerCase(),
          chipValueText(field, condition, format),
        ]
          .filter(Boolean)
          .join(' ');
        return [
          { field: field.name, text, remove: this.labels.get('S.FILTER.REMOVE', { label: text }) },
        ];
      });
    return {
      chips,
      label: this.labels.get('S.FILTER.ACTIVE'),
      clearAll: this.labels.get('S.FILTER.CLEAR_ALL'),
    };
  });

  protected remove(field: string): void {
    this.query.update((query) => setColumnFilter(query, field, null));
  }

  protected removeAll(): void {
    this.query.update(clearFilters);
  }
}
