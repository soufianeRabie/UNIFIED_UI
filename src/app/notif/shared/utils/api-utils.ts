export function unwrapList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === 'object') {
    const record = value as { items?: T[]; data?: T[] };
    if (Array.isArray(record.items)) {
      return record.items;
    }
    if (Array.isArray(record.data)) {
      return record.data;
    }
  }
  return [];
}

export function formatHttpError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Request failed.';
  }
  const err = error as { message?: string; error?: unknown };
  if (typeof err.error === 'string') {
    return err.error;
  }
  if (err.error && typeof err.error === 'object') {
    const payload = err.error as { title?: string; message?: string };
    if (payload.title) {
      return payload.title;
    }
    if (payload.message) {
      return payload.message;
    }
  }
  return err.message || 'Request failed.';
}

export function parseJsonRecord(raw: string): Record<string, string> {
  if (!raw.trim()) {
    return {};
  }
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object.');
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = value === null || value === undefined ? '' : String(value);
  }
  return result;
}
