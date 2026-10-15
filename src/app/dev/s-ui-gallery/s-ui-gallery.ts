import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  SButton,
  SCell,
  SConfirm,
  SDataTable,
  SDialog,
  SEmpty,
  SField,
  SFilterBar,
  SGrid,
  SHeading,
  SIconButton,
  SInput,
  SKpi,
  SNotice,
  SPageHeader,
  SPanel,
  SPanelHeader,
  SRow,
  SRowActions,
  SSearch,
  SStack,
  SStamp,
  SSwitch,
  SText,
  type SSort,
} from '@s/ui';
import { GalleryWidgets } from './gallery-widgets/gallery-widgets';
import { GALLERY_COLUMNS, GALLERY_USERS, type GalleryUser } from './s-ui-gallery.data';

type TableState = 'data' | 'loading' | 'empty' | 'error';

/**
 * Dev-only review page for @s/ui (route `/dev/ui`, excluded from production
 * builds). Renders every component with sample data, in light, dark and RTL.
 * Sample text is deliberately not translated: this is a developer tool.
 */
@Component({
  selector: 'app-s-ui-gallery',
  imports: [
    GalleryWidgets,
    SButton,
    SCell,
    SDataTable,
    SDialog,
    SEmpty,
    SField,
    SFilterBar,
    SGrid,
    SHeading,
    SIconButton,
    SInput,
    SKpi,
    SNotice,
    SPageHeader,
    SPanel,
    SPanelHeader,
    SRow,
    SRowActions,
    SSearch,
    SStack,
    SStamp,
    SSwitch,
    SText,
  ],
  templateUrl: './s-ui-gallery.html',
  styleUrl: './s-ui-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SUiGallery {
  private readonly document = inject(DOCUMENT);
  private readonly confirm = inject(SConfirm);

  protected readonly columns = GALLERY_COLUMNS;
  protected readonly query = signal('');
  protected readonly showInactive = signal(true);
  protected readonly state = signal<TableState>('data');
  protected readonly page = signal(1);
  protected readonly sort = signal<SSort | null>(null);
  protected readonly dialogOpen = signal(false);
  protected readonly lastAction = signal('—');

  protected readonly users = computed<readonly GalleryUser[]>(() => {
    if (this.state() === 'empty' || this.state() === 'loading') return [];
    const q = this.query().toLowerCase();
    const sort = this.sort();
    const rows = GALLERY_USERS.filter(
      (u) =>
        (this.showInactive() || u.active) &&
        (!q || u.username.includes(q) || u.fullName.toLowerCase().includes(q)),
    );
    if (!sort) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    const key = sort.key as keyof GalleryUser;
    return [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])) * factor);
  });
  protected readonly activeCount = computed(() => GALLERY_USERS.filter((u) => u.active).length);

  protected setTheme(theme: 'light' | 'dark'): void {
    this.document.documentElement.dataset['theme'] = theme;
  }

  protected toggleDirection(): void {
    const html = this.document.documentElement;
    html.dir = html.dir === 'rtl' ? 'ltr' : 'rtl';
  }

  protected async remove(user: GalleryUser): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete user',
      message: `${user.fullName} will lose access immediately.`,
      tone: 'danger',
    });
    this.lastAction.set(ok ? `Deleted ${user.username}` : 'Cancelled');
  }
}
