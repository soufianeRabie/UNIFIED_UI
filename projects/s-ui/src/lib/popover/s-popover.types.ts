/** Preferred side; the overlay flips to the other one when there is no room. */
export type PopoverPlacement = 'below' | 'above';

/** Panel widths come from a scale; `trigger` matches the anchor's width (selects, pickers). */
export type PopoverWidth = 'auto' | 'trigger' | 'sm' | 'md' | 'lg';

/** Why the popover closed — callers decide what to do with focus or drafts. */
export type PopoverCloseReason = 'escape' | 'outside' | 'programmatic';
