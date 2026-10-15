import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';
import type { HeadingLevel } from './s-heading.types';

/**
 * Section heading with a real heading role and level for assistive tech.
 * Level 1 is the document serif; level 4 is the small caps label above a group.
 *
 *   <s-heading level="2">Permissions</s-heading>
 */
@Component({
  selector: 's-heading',
  templateUrl: './s-heading.html',
  styleUrl: './s-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'heading',
    '[attr.aria-level]': 'level()',
    '[attr.data-level]': 'level()',
  },
})
export class SHeading {
  readonly level = input<HeadingLevel, unknown>(2, {
    transform: (v) => clampLevel(numberAttribute(v, 2)),
  });
}

function clampLevel(n: number): HeadingLevel {
  return Math.min(4, Math.max(1, Math.round(n))) as HeadingLevel;
}
