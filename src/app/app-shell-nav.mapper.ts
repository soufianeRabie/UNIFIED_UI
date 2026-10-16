import { normalizeUrl, type SNavItem, type SNavSection } from '@s/core';
import type { SecuMenuItemDto } from './secu/models/secu.models';

export interface ShellNavLabels {
  readonly security: string;
  readonly notifications: string;
  readonly account: string;
  readonly mySecurity: string;
  readonly changePassword: string;
  readonly authSettings: string;
}

export interface ShellNavContext {
  readonly labels: ShellNavLabels;
  readonly canAuthSettings: boolean;
  /** Unread notifications, shown on the inbox entry. */
  readonly unread: number;
}

const NOTIF_PREFIX = '/notif';
const INBOX_URL = '/notif/notifications';

/**
 * The permission menu of `/api/secu/me/menu` (only pages the user may open) as sidebar sections: security pages,
 * notification pages, then the account links every signed-in user has.
 */
export function toNavSections(
  menu: readonly SecuMenuItemDto[],
  context: ShellNavContext,
): SNavSection[] {
  const roots = splitMixedRoots(sortByOrder(menu));
  const notif = roots
    .filter((root) => sectionOf(root) === 'notifications')
    .map((root) => toItem(root, context));
  const security = roots
    .filter((root) => sectionOf(root) === 'security')
    .map((root) => toItem(root, context));
  const { labels } = context;

  const account: SNavItem[] = [
    link('account-security', labels.mySecurity, '/admin/my-security', 'shield'),
    link('account-password', labels.changePassword, '/security/change-password', 'key'),
    ...(context.canAuthSettings
      ? [link('account-auth-settings', labels.authSettings, '/admin/auth-settings', 'cog')]
      : []),
  ];

  return [
    { id: 'security', label: labels.security, items: security },
    { id: 'notifications', label: labels.notifications, items: notif },
    { id: 'account', label: labels.account, items: account },
  ].filter((section) => section.items.length > 0);
}

function toItem(dto: SecuMenuItemDto, context: ShellNavContext): SNavItem {
  const url = normalizeUrl(dto.pageUrl);
  return {
    id: `page-${dto.idPage}`,
    label: (dto.pageName || dto.pageCode || '').trim(),
    url,
    icon: iconName(dto.icon),
    badge: url === INBOX_URL ? context.unread : undefined,
    children: sortByOrder(dto.children ?? []).map((child) => toItem(child, context)),
  };
}

function link(id: string, label: string, url: string, icon: string): SNavItem {
  return { id, label, url, icon, children: [] };
}

/** `pi pi-users` (PrimeIcons class stored in the page table) → `users`; anything else (emoji) → none. */
function iconName(icon: string | null): string | null {
  const match = /(?:^|\s)pi-([a-z0-9-]+)/.exec(icon ?? '');
  return match ? match[1] : null;
}

function sortByOrder(items: readonly SecuMenuItemDto[]): SecuMenuItemDto[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

type Section = 'security' | 'notifications';

function sectionsIn(dto: SecuMenuItemDto): Set<Section> {
  const url = normalizeUrl(dto.pageUrl);
  const own: Section[] = url ? [url.startsWith(NOTIF_PREFIX) ? 'notifications' : 'security'] : [];
  return new Set([...own, ...(dto.children ?? []).flatMap((c) => [...sectionsIn(c)])]);
}

function sectionOf(dto: SecuMenuItemDto): Section {
  return sectionsIn(dto).has('notifications') && !sectionsIn(dto).has('security')
    ? 'notifications'
    : 'security';
}

/** A container page whose children belong to several sections is replaced by those children. */
function splitMixedRoots(roots: readonly SecuMenuItemDto[]): SecuMenuItemDto[] {
  return roots.flatMap((root) =>
    !normalizeUrl(root.pageUrl) && sectionsIn(root).size > 1
      ? splitMixedRoots(sortByOrder(root.children ?? []))
      : [root],
  );
}
