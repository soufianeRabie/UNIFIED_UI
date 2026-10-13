import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ReferenceService } from '../../core/services/reference.service';
import { ReferenceItem } from '../../core/models/reference';
import { formatHttpError } from '../../shared/utils/api-utils';

@Component({
  selector: 'notif-reference',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, MessageModule, TableModule],
  templateUrl: './reference.component.html'
})
export class ReferenceComponent {
  private readonly referenceService = inject(ReferenceService);

  channels: ReferenceItem[] = [];
  priorities: ReferenceItem[] = [];
  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status = { type: 'info', message: 'Loading reference data...' };
    this.referenceService.getChannels().subscribe({
      next: (channels) => {
        this.channels = channels;
        this.referenceService.getPriorities().subscribe({
          next: (priorities) => {
            this.priorities = priorities;
            this.status = null;
          },
          error: (err) => {
            this.status = { type: 'error', message: formatHttpError(err) };
          }
        });
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }
}

