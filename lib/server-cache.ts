type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const serverCache = new Map<string, CacheEntry<unknown>>();

function now() {
  return Date.now();
}

export function getServerCache<T>(key: string): T | null {
  const entry = serverCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= now()) {
    serverCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setServerCache<T>(key: string, value: T, ttlMs: number) {
  serverCache.set(key, {
    expiresAt: now() + ttlMs,
    value
  });

  return value;
}

export async function withServerCache<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  const cached = getServerCache<T>(key);
  if (cached) return cached;

  const value = await loader();
  return setServerCache(key, value, ttlMs);
}

export function clearServerCache(prefix?: string) {
  if (!prefix) {
    serverCache.clear();
    return;
  }

  for (const key of serverCache.keys()) {
    if (key.startsWith(prefix)) serverCache.delete(key);
  }
}

export function clearCompanyServerCache(companyId: string) {
  clearServerCache(`company:${companyId}:`);
}
