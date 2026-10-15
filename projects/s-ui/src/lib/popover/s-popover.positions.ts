import type { ConnectedPosition } from '@angular/cdk/overlay';
import type { PopoverPlacement } from './s-popover.types';

const GAP = 6;

const BELOW: readonly ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: GAP },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: GAP },
];

const ABOVE: readonly ConnectedPosition[] = [
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -GAP },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -GAP },
];

/**
 * Preferred side first, then the opposite side as a fallback. `start` / `end` are logical: the CDK mirrors them
 * in RTL, so the panel aligns with the anchor's reading edge in every language.
 */
export function popoverPositions(placement: PopoverPlacement): ConnectedPosition[] {
  return placement === 'above' ? [...ABOVE, ...BELOW] : [...BELOW, ...ABOVE];
}
