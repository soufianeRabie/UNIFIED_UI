import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'secu-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="s-pagination">
      <span class="s-pagination-info">
        {{ totalRecords ? (page - 1) * size + 1 : 0 }}-{{ min(page * size, totalRecords) }} of {{ totalRecords }} records
      </span>
      <div class="s-pagination-controls">
        <button class="s-page-btn" [disabled]="page <= 1" (click)="go(1)">&laquo;</button>
        <button class="s-page-btn" [disabled]="page <= 1" (click)="go(page - 1)">&lsaquo;</button>
        @for (p of pages(); track p) {
          <button class="s-page-btn" [class.active]="p === page" (click)="go(p)">{{ p }}</button>
        }
        <button class="s-page-btn" [disabled]="page >= totalPages" (click)="go(page + 1)">&rsaquo;</button>
        <button class="s-page-btn" [disabled]="page >= totalPages" (click)="go(totalPages)">&raquo;</button>
      </div>
    </div>
  `,
})
export class SecuPaginationComponent {
  @Input() page = 1;
  @Input() size = 20;
  @Input() totalRecords = 0;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  go(p: number) {
    this.pageChange.emit(Math.max(1, Math.min(p, this.totalPages || 1)));
  }

  min(a: number, b: number) {
    return Math.min(a, b);
  }

  pages(): number[] {
    const total = this.totalPages || 1;
    const cur = this.page;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }
}
