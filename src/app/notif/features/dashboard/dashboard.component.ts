import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { NotifConfigService } from '../../core/services/notif-config.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationStats } from '../../core/models/notification-stats';
import { NotificationItem } from '../../core/models/notification';
import { formatHttpError, unwrapList } from '../../shared/utils/api-utils';
import { channelLabel, statusLabel, statusSeverity } from '../../shared/utils/notification-enums';

interface Breakdown {
  label: string;
  count: number;
}

@Component({
  selector: 'notif-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, TagModule, TableModule, SkeletonModule, MessageModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  readonly config = inject(NotifConfigService);
  private readonly notifications = inject(NotificationsService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<NotificationStats | null>(null);
  readonly recent = signal<NotificationItem[]>([]);

  readonly statusBreakdown = computed<Breakdown[]>(() => this.toBreakdown(this.stats()?.byStatus));
  readonly channelBreakdown = computed<Breakdown[]>(() => this.toBreakdown(this.stats()?.byChannel));

  readonly channelLabel = channelLabel;
  readonly statusLabel = statusLabel;
  readonly statusSeverity = statusSeverity;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.notifications.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(formatHttpError(err));
        this.loading.set(false);
      }
    });

    this.notifications.list(1, 8).subscribe({
      next: (response) => this.recent.set(unwrapList<NotificationItem>(response).slice(0, 8)),
      error: () => this.recent.set([])
    });
  }

  private toBreakdown(map?: Record<string, number>): Breakdown[] {
    if (!map) {
      return [];
    }
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }
}

