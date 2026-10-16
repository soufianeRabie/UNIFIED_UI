import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SCrumb } from '@s/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIcon } from '../icon/s-icon';

/**
 * Where the user is: section › group › page. The last crumb is the current page (`aria-current="page"`,
 * no link).
 *
 *   <s-breadcrumbs [crumbs]="shell.crumbs()" />
 */
@Component({
  selector: 's-breadcrumbs',
  imports: [RouterLink, SIcon],
  templateUrl: './s-breadcrumbs.html',
  styleUrl: './s-breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBreadcrumbs {
  private readonly labels = inject(SUiLabels);

  readonly crumbs = input.required<readonly SCrumb[]>();

  protected readonly label = computed(() => {
    this.labels.version();
    return this.labels.get('S.SHELL.BREADCRUMB');
  });
}
