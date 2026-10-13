export interface SecuActionDefinition {
  code: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Action Registry
// All app-level actions are centralized here. Add new permissions in this
// list to make them globally available in the UI and permission service.
// ---------------------------------------------------------------------------
export const SECU_ACTIONS: SecuActionDefinition[] = [
  { code: 'CREATE', label: 'Create' },
  { code: 'READ', label: 'Read' },
  { code: 'UPDATE', label: 'Update' },
  { code: 'DELETE', label: 'Delete' },
  { code: 'ACTIVATE', label: 'Activate' },
  { code: 'DEACTIVATE', label: 'Deactivate' },
  { code: 'SUSPEND', label: 'Suspend' },
  { code: 'LOCK', label: 'Lock' },
  { code: 'UNLOCK', label: 'Unlock' },
  { code: 'APPROVE', label: 'Approve' },
  { code: 'REJECT', label: 'Reject' },
  { code: 'PUBLISH', label: 'Publish' },
  { code: 'SUBMIT', label: 'Submit' },
  { code: 'REVIEW', label: 'Review' },
  { code: 'ASSIGN', label: 'Assign' },
  { code: 'REVOKE', label: 'Revoke' },
  { code: 'EXPORT', label: 'Export' },
  { code: 'IMPORT', label: 'Import' },
  { code: 'DOWNLOAD', label: 'Download' },
  { code: 'UPLOAD', label: 'Upload' },
  { code: 'PRINT', label: 'Print' },
  { code: 'ARCHIVE', label: 'Archive' },
  { code: 'RESTORE', label: 'Restore' },
  { code: 'DUPLICATE', label: 'Duplicate' },
  { code: 'CLONE', label: 'Clone' },
  { code: 'CHANGE_PASSWORD', label: 'Change Password' },
  { code: 'RESET_PASSWORD', label: 'Reset Password' },
  { code: 'MANAGE_USERS', label: 'Manage Users' },
  { code: 'MANAGE_ROLES', label: 'Manage Roles' },
  { code: 'MANAGE_PERMISSIONS', label: 'Manage Permissions' },
  { code: 'VIEW_AUDIT', label: 'View Audit Logs' },
  { code: 'VIEW_REPORTS', label: 'View Reports' },
  { code: 'GENERATE_REPORT', label: 'Generate Report' },
  { code: 'EXECUTE', label: 'Execute' },
  { code: 'CONFIGURE', label: 'Configure' },
  { code: 'VERIFY', label: 'Verify' },
  { code: 'SIGN', label: 'Sign' },
  { code: 'TRANSFER', label: 'Transfer' },
  { code: 'REFUND', label: 'Refund' },
  { code: 'CANCEL', label: 'Cancel' },
  { code: 'COMPLETE', label: 'Complete' },
];

const ACTION_MAP = Object.fromEntries(SECU_ACTIONS.map((a) => [a.code.toUpperCase(), a]));

export const SECU_ACTION_CODES = SECU_ACTIONS.map((a) => a.code);

export function getActionLabel(actionCode: string): string {
  const def = ACTION_MAP[actionCode?.toUpperCase() ?? ''];
  return def ? def.label : actionCode;
}

export function isKnownAction(actionCode: string): boolean {
  return Boolean(ACTION_MAP[actionCode?.toUpperCase() ?? '']);
}
