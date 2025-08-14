export async function fetchClientIp(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.ip === 'string' ? data.ip : null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  } catch {
    return null;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const STORAGE_KEY = 'client-ip-hash-v1';

export function getStoredClientIpHash(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function computeAndStoreClientIpHash(): Promise<string | null> {
  try {
    const existing = getStoredClientIpHash();
    if (existing) return existing;
    const ip = await fetchClientIp();
    if (!ip) return null;
    const hash = await sha256Hex(ip.trim());
    localStorage.setItem(STORAGE_KEY, hash);
    return hash;
  } catch {
    return null;
  }
}


