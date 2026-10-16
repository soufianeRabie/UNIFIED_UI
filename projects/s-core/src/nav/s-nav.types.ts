/** One entry of the application navigation. `label` is already translated (or comes from the server). */
export interface SNavItem {
  readonly id: string;
  readonly label: string;
  /** Route; `null` for a pure group that only opens its children. */
  readonly url: string | null;
  /** Icon name for `SIcon` (`users`, `bell`); `null` shows a neutral dot. */
  readonly icon: string | null;
  /** Small counter (unread notifications…); hidden when 0 or absent. */
  readonly badge?: number;
  readonly children: readonly SNavItem[];
}

/** A titled block of the sidebar (`Security`, `Notifications`, `Account`). */
export interface SNavSection {
  readonly id: string;
  readonly label: string;
  readonly items: readonly SNavItem[];
}

/** One step of the breadcrumb trail; the last one is the current page. */
export interface SCrumb {
  readonly label: string;
  readonly url: string | null;
}
