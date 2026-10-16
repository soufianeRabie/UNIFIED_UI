import type { SCrumb, SNavItem, SNavSection } from './s-nav.types';

/** `admin/users` → `/admin/users`; trailing slash, query and fragment removed; blank → `null`. */
export function normalizeUrl(url: string | null | undefined): string | null {
  const path = url?.trim().split(/[?#]/)[0].replace(/\/+$/, '');
  if (!path) return null;
  return path.startsWith('/') ? path : `/${path}`;
}

/** Whether `current` is `url` or one of its sub-pages (`/admin/users/42` is inside `/admin/users`). */
export function isWithin(current: string, url: string | null): boolean {
  const target = normalizeUrl(url);
  const here = normalizeUrl(current);
  return !!target && !!here && (here === target || here.startsWith(`${target}/`));
}

/**
 * The chain of items leading to the page at `current`, outermost first — the most specific match wins, so
 * `/admin/users/42` selects "Users" rather than a broader "/admin" entry. Empty when no item matches.
 */
export function activeTrail(
  sections: readonly SNavSection[],
  current: string,
): readonly SNavItem[] {
  let best: readonly SNavItem[] = [];
  let bestLength = -1;
  const visit = (items: readonly SNavItem[], trail: readonly SNavItem[]) => {
    for (const item of items) {
      const path = [...trail, item];
      const url = normalizeUrl(item.url);
      if (url && isWithin(current, url) && url.length > bestLength) {
        best = path;
        bestLength = url.length;
      }
      visit(item.children, path);
    }
  };
  sections.forEach((section) => visit(section.items, []));
  return best;
}

/** Breadcrumbs for the current page: section, then the active trail; the current page has no link. */
export function breadcrumbs(sections: readonly SNavSection[], current: string): readonly SCrumb[] {
  const trail = activeTrail(sections, current);
  if (trail.length === 0) return [];
  const section = sections.find((s) => s.items.some((item) => item === trail[0]));
  const crumbs = trail.map((item, i) => ({
    label: item.label,
    url: i === trail.length - 1 ? null : normalizeUrl(item.url),
  }));
  return section ? [{ label: section.label, url: null }, ...crumbs] : crumbs;
}

/** Ids of the groups to show open: the ancestors of the active page (others stay as the user left them). */
export function openGroupsFor(
  sections: readonly SNavSection[],
  current: string,
): ReadonlySet<string> {
  const trail = activeTrail(sections, current);
  return new Set(trail.slice(0, -1).map((item) => item.id));
}

/** Items sorted by a numeric order then label, recursively. */
export function sortNav<T extends { readonly label: string; readonly children: readonly T[] }>(
  items: readonly T[],
  order: (item: T) => number,
): readonly T[] {
  return [...items]
    .sort((a, b) => order(a) - order(b) || a.label.localeCompare(b.label))
    .map((item) => ({ ...item, children: sortNav(item.children, order) }));
}
