export interface RuntimeAppConfig {
  apiUrl: string;
  securityUrl: string;
  notifApiUrl?: string;
}

let currentConfig: RuntimeAppConfig | null = null;

export async function loadAppConfig(): Promise<RuntimeAppConfig> {
  const response = await fetch('/app.config.json', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Unable to load /app.config.json: ${response.status} ${response.statusText}`);
  }

  const loaded = (await response.json()) as Partial<RuntimeAppConfig>;
  currentConfig = validateConfig(loaded);
  return currentConfig;
}

export function getAppConfig(): RuntimeAppConfig {
  if (!currentConfig) {
    throw new Error('Runtime config was requested before /app.config.json was loaded.');
  }

  return currentConfig;
}

function validateConfig(loaded: Partial<RuntimeAppConfig>): RuntimeAppConfig {
  const apiUrl = requireString(loaded.apiUrl, 'apiUrl').replace(/\/$/, '');

  return {
    apiUrl,
    securityUrl: normalizeSecurityUrl(loaded.securityUrl, apiUrl),
    notifApiUrl: typeof loaded.notifApiUrl === 'string' ? loaded.notifApiUrl.replace(/\/$/, '') : undefined,
  };
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required runtime config value: ${path}`);
  }

  return value.trim();
}

function normalizeSecurityUrl(value: unknown, apiUrl: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().replace(/\/$/, '');
  }

  const parsed = new URL(apiUrl, window.location.origin);
  parsed.pathname = parsed.pathname.replace(/\/api\/?$/, '');
  parsed.search = '';
  parsed.hash = '';

  return parsed.toString().replace(/\/$/, '');
}
