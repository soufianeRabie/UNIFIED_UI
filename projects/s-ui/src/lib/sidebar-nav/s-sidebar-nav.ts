import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { openGroupsFor, type SNavItem, type SNavSection } from '@s/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIcon } from '../icon/s-icon';

/** An item as rendered: open state precomputed (no logic in the template). */
interface NavNode {
  readonly item: SNavItem;
  readonly open: boolean;
  readonly children: readonly NavNode[];
}

/**
 * The application navigation, in titled sections. Groups open on the way to the current page and remember the
 * user's toggles; the active link carries `aria-current="page"`. Collapsed: one icon per top-level entry, each
 * with its name as tooltip and accessible name.
 *
 *   <s-sidebar-nav [sections]="shell.sections()" [currentUrl]="shell.url()" [collapsed]="collapsed()" />
 */
@Component({
  selector: 's-sidebar-nav',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, SIcon],
  templateUrl: './s-sidebar-nav.html',
  styleUrl: './s-sidebar-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-collapsed]': 'collapsed() ? "" : null' },
})
export class SSidebarNav {
  private readonly labels = inject(SUiLabels);

  readonly sections = input.required<readonly SNavSection[]>();
  readonly currentUrl = input('');
  readonly collapsed = input(false, { transform: booleanAttribute });
  /** A link was followed (the shell closes the mobile drawer). */
  readonly navigated = output();
  /** A group was clicked while collapsed: the shell expands the sidebar so its children can show. */
  readonly expandRequested = output();

  private readonly toggled = signal<Readonly<Record<string, boolean>>>({});

  protected readonly view = computed(() => {
    this.labels.version();
    const auto = openGroupsFor(this.sections(), this.currentUrl());
    const toggled = this.toggled();
    const node = (item: SNavItem): NavNode => ({
      item,
      open: toggled[item.id] ?? auto.has(item.id),
      children: item.children.map(node),
    });
    return {
      label: this.labels.get('S.SHELL.NAV'),
      sections: this.sections().map((section) => ({ ...section, nodes: section.items.map(node) })),
    };
  });

  protected toggle(node: NavNode): void {
    if (this.collapsed()) {
      this.expandRequested.emit();
      return;
    }
    this.toggled.update((state) => ({ ...state, [node.item.id]: !node.open }));
  }
}
