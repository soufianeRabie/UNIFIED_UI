import { SECU_ACTIONS, getActionLabel, SecuActionDefinition } from './actions';

// This file provides reusable utility functions for permission-driven UI.
// Keep small and reusable. New helpers can be added for additional patterns.

/** Return all known action definitions. */
export function getAllActions(): SecuActionDefinition[] {
  return SECU_ACTIONS;
}

/** Action label by code, defaulting to raw code if missing. */
export function actionLabel(actionCode: string): string {
  return getActionLabel(actionCode?.toUpperCase() ?? '');
}

/** Return whether this code is a recognized action. */
export function isActionCodeValid(actionCode: string): boolean {
  return !!actionCode && actionCode.trim().length > 0 && actionLabel(actionCode) !== actionCode;
}

/** Convert action code into a boolean property key, e.g. CREATE -> canCreate */
export function actionToFlagKey(actionCode: string): string {
  const s = (actionCode ?? '').toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return `can${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}
