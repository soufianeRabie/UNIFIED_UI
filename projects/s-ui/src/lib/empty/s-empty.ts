import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SIcon } from '../icon/s-icon';

/**
 * Placeholder for a list or panel with nothing in it: an icon, a short title
 * and, optionally, one sentence and an action projected as content.
 *
 *   <s-empty icon="users" [title]="'SECU.USERS.EMPTY' | translate" />
 */
@Component({
  selector: 's-empty',
  imports: [SIcon],
  templateUrl: './s-empty.html',
  styleUrl: './s-empty.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SEmpty {
  readonly title = input.required<string>();
  readonly icon = input('inbox');
}
