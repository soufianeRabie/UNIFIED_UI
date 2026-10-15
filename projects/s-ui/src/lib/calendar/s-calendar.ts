import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
} from '@angular/core';
import { addMonths, isoPartsOf, todayIso } from '@s/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIconButton } from '../icon-button/s-icon-button';
import { isOutside, monthGrid, pickRange } from '@s/core';
import { dayLabel, dayNumber, firstDayOfWeek, monthTitle, weekdayNames } from '@s/core';
import { nextFocusedDay } from '@s/core';
import type { CalendarMode, SDateRange } from '@s/core';

let nextId = 0;

/**
 * Our month calendar (ADR 0008): names, digits and the first day of the week from the active locale (`Intl`),
 * full keyboard support (arrows follow the reading direction, Home/End, PageUp/PageDown, Shift for years),
 * single day or range. Values are ISO days (`YYYY-MM-DD`).
 *
 *   <s-calendar [(value)]="day" />
 *   <s-calendar mode="range" [(range)]="period" (picked)="close()" />
 */
@Component({
  selector: 's-calendar',
  imports: [SIconButton],
  templateUrl: './s-calendar.html',
  styleUrl: './s-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCalendar {
  private readonly labels = inject(SUiLabels);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  readonly mode = input<CalendarMode>('single');
  readonly value = model<string | null>(null);
  readonly range = model<SDateRange | null>(null);
  readonly min = input<string>();
  readonly max = input<string>();
  /** A selection is complete: a day (single), or the end of a range. */
  readonly picked = output();

  protected readonly titleId = `s-calendar-title-${++nextId}`;
  private readonly today = todayIso();
  /** The day with the roving tab stop; the visible month is always its month. */
  protected readonly focused = linkedSignal(
    () => this.value() ?? this.range()?.start ?? this.today,
  );

  protected readonly view = computed(() => {
    this.labels.version();
    const locale = this.labels.locale();
    const firstDay = firstDayOfWeek(locale);
    const { year, month } = isoPartsOf(this.focused());
    return {
      title: monthTitle(locale, year, month),
      weekdays: weekdayNames(locale, firstDay),
      weeks: monthGrid({
        year,
        month,
        firstDay,
        mode: this.mode(),
        value: this.value(),
        range: this.range(),
        today: this.today,
        focused: this.focused(),
        min: this.min(),
        max: this.max(),
        label: (iso) => dayLabel(locale, iso),
        number: (day) => dayNumber(locale, day),
      }),
      previous: this.labels.get('S.CALENDAR.PREVIOUS'),
      next: this.labels.get('S.CALENDAR.NEXT'),
      todayLabel: this.labels.get('S.CALENDAR.TODAY'),
    };
  });

  protected moveMonth(months: number): void {
    this.focused.update((iso) => addMonths(iso, months));
  }

  protected goToToday(): void {
    this.focusDay(this.today);
  }

  protected pick(iso: string): void {
    this.focused.set(iso);
    if (this.mode() === 'single') {
      this.value.set(iso);
      this.picked.emit();
      return;
    }
    const range = pickRange(this.range(), iso);
    this.range.set(range);
    if (range.end) this.picked.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const next = nextFocusedDay(this.focused(), event.key, {
      rtl: this.document.documentElement.dir === 'rtl',
      firstDay: firstDayOfWeek(this.labels.locale()),
      shift: event.shiftKey,
    });
    if (!next) return;
    event.preventDefault();
    if (!isOutside(next, this.min(), this.max())) this.focusDay(next);
  }

  private focusDay(iso: string): void {
    this.focused.set(iso);
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`)?.focus(),
      { injector: this.injector },
    );
  }
}
