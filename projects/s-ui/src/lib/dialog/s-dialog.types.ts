export type DialogWidth = 'sm' | 'md' | 'lg';

/** Panel widths; the overlay never exceeds the viewport minus a 16px gutter on each side. */
export const DIALOG_WIDTHS: Readonly<Record<DialogWidth, string>> = {
  sm: '420px',
  md: '560px',
  lg: '760px',
};

export const DIALOG_MAX_WIDTH = 'calc(100vw - 32px)';
export const DIALOG_PANEL_CLASS = 's-dialog-panel';
export const DIALOG_BACKDROP_CLASS = 's-dialog-backdrop';
