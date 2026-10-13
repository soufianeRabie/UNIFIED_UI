import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslatePipe } from '@ngx-translate/core';
import { PermissionService } from '../../core/services/permission.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { NotificationDetail, NotificationItem } from '../../core/models/notification';
import { DeadLetterItem } from '../../core/models/deadletter';
import { formatHttpError } from '../../shared/utils/api-utils';
import { channelLabel, statusLabel, statusSeverity, priorityLabel } from '../../shared/utils/notification-enums';

const PAGE_INBOX = 'NOTIF_INBOX';
const PAGE_SETTINGS = 'NOTIF_SETTINGS';

@Component({
  selector: 'notif-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
    PaginatorModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  readonly PAGE_INBOX = PAGE_INBOX;
  readonly PAGE_SETTINGS = PAGE_SETTINGS;
  readonly perm = inject(PermissionService);
  private readonly service = inject(NotificationsService);
  private readonly realtime = inject(RealtimeService);

  // Inbox state
  readonly items = signal<NotificationItem[]>([]);
  readonly selected = signal<NotificationDetail | null>(null);
  readonly total = signal(0);
  readonly unread = signal(0);
  readonly loading = signal(false);

  page = 1;
  pageSize = 20;
  pageCode = '';

  // Dead letters
  readonly deadLetters = signal<DeadLetterItem[]>([]);
  resolved = false;
  reviewedBy = 'ui';

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  readonly channelLabel = channelLabel;
  readonly statusLabel = statusLabel;
  readonly statusSeverity = statusSeverity;
  readonly priorityLabel = priorityLabel;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadInbox();
    this.loadDeadLetters();
    this.loadUnread();

    this.realtime.start();
    this.subs.push(
      this.realtime.notification$.subscribe((item) => {
        // Prepend live notification if it matches the active page filter (or is global).
        this.items.update((list) => [item, ...list].slice(0, this.pageSize));
        this.total.update((t) => t + 1);
        this.status = { type: 'info', message: `New notification: ${item.title}` };
      }),
      this.realtime.unreadCount$.subscribe((count) => this.unread.set(count))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.realtime.stop();
  }

  loadInbox(): void {
    this.loading.set(true);
    this.service.listPaged(this.page, this.pageSize, this.pageCode || undefined).subscribe({
      next: (res) => {
        this.items.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
        this.status = null;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.loading.set(false);
      }
    });
  }

  loadUnread(): void {
    this.service.unreadCount().subscribe({
      next: (r) => this.unread.set(r.count ?? 0),
      error: () => undefined
    });
  }

  applyFilter(): void {
    this.page = 1;
    this.loadInbox();
  }

  onPage(event: { first?: number; rows?: number }): void {
    this.pageSize = event.rows ?? this.pageSize;
    this.page = Math.floor((event.first ?? 0) / this.pageSize) + 1;
    this.loadInbox();
  }

  open(item: NotificationItem): void {
    this.service.getById(item.id).subscribe({
      next: (detail) => (this.selected.set(detail)),
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  markRead(): void {
    const current = this.selected();
    if (!current) return;
    this.service.markRead(current.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Notification marqu�©e comme lue.' };
        this.open(current as NotificationItem);
        this.loadInbox();
        this.loadUnread();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  markAllRead(): void {
    const unreadIds = this.items()
      .filter(n => !n.readAt)
      .map(n => n.id);
    if (!unreadIds.length) return;
    forkJoin(unreadIds.map(id => this.service.markRead(id))).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Toutes les notifications marqu�©es comme lues.' };
        this.loadInbox();
        this.loadUnread();
      },
      error: () => { this.loadInbox(); this.loadUnread(); }
    });
  }

  cancel(): void {
    const current = this.selected();
    if (!current) {
      return;
    }
    this.service.cancel(current.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Notification cancelled.' };
        this.open(current as NotificationItem);
        this.loadInbox();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  // ---- Notification attachment download ----
  // [SRB ] The notification's template decides whether an attachment exists; the API
  //        surfaces that as attachmentFileName. We regenerate the xlsx on demand via the
  //        NotificationService — no event-code knowledge or hardcoded names in the UI.
  readonly downloadingAttachment = signal(false);

  downloadAttachment(notificationId: string, fileName?: string | null): void {
    this.downloadingAttachment.set(true);
    this.service.downloadAttachment(notificationId, fileName ?? 'rapport.xlsx').subscribe({
      next: () => this.downloadingAttachment.set(false),
      error: (err) => {
        this.downloadingAttachment.set(false);
        this.status = { type: 'error', message: formatHttpError(err) };
      },
    });
  }

  // ---- Dead letters (admin) ----
  loadDeadLetters(): void {
    this.service.getDeadLetters(this.resolved).subscribe({
      next: (items) => this.deadLetters.set(items),
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  replayDeadLetter(item: DeadLetterItem): void {
    this.service.replayDeadLetter(item.id, this.reviewedBy || 'ui').subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Dead letter replayed.' };
        this.loadDeadLetters();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  resolveDeadLetter(item: DeadLetterItem): void {
    this.service.resolveDeadLetter(item.id, this.reviewedBy || 'ui').subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Dead letter resolved.' };
        this.loadDeadLetters();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }
}


