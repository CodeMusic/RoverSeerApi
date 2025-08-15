export function getN8nCredentials(): { username: string; password: string }
{
	try
	{
		const winEnv = (typeof window !== 'undefined' && (window as any).env) ? (window as any).env : undefined;
		const username = (import.meta as any).env?.VITE_N8N_BASIC_USER || winEnv?.VITE_N8N_BASIC_USER || 'siteuser';
		const password = (import.meta as any).env?.VITE_N8N_BASIC_PASS || winEnv?.VITE_N8N_BASIC_PASS || 'codemusai';
		return { username: String(username), password: String(password) };
	}
	catch
	{
		return { username: 'siteuser', password: 'codemusai' };
	}
}

export function getN8nAuthHeader(): Record<string, string>
{
	const { username, password } = getN8nCredentials();
	const base64 = typeof btoa === 'function' ? btoa(`${username}:${password}`) : Buffer.from(`${username}:${password}`, 'utf-8').toString('base64');
	return { Authorization: `Basic ${base64}` };
}

/**
 * Returns a persistent client id for this browser. Creates and stores one if missing.
 */
export function getMusaiClientId(): string
{
  try {
    const key = 'musai.clientId';
    let id = '';
    try { id = window.localStorage.getItem(key) || ''; } catch {}
    if (!id) {
      // Generate a simple random id; stable thereafter via localStorage
      const rand = Math.random().toString(36).slice(2) + Date.now().toString(36);
      id = `mclient_${rand}`;
      try { window.localStorage.setItem(key, id); } catch {}
    }
    return id;
  } catch {
    // Fallback (non-persistent)
    return `mclient_${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Derive a deterministic session id from the client id. Used by n8n to track memory.
 */
export function getN8nSessionId(): string
{
  // Prefer IP-hash if available (computed by utils/ip.ts and stored under this key)
  try {
    const ipHash = window.localStorage.getItem('client-ip-hash-v1');
    if (ipHash && ipHash.length > 0) {
      return ipHash;
    }
  } catch {}

  const clientId = getMusaiClientId();
  // Fallback: Simple FNV-1a hash of client id → hex
  let h = 0x811c9dc5;
  for (let i = 0; i < clientId.length; i++) {
    h ^= clientId.charCodeAt(i);
    h = (h >>> 0) * 0x01000193;
  }
  const hex = (h >>> 0).toString(16);
  return `msess_${hex}`;
}

export function withN8nAuthHeaders(existing?: HeadersInit): HeadersInit
{
	const base: Record<string, string> = {};
	if (existing)
	{
		if (existing instanceof Headers)
		{
			existing.forEach((value, key) => { base[key] = value; });
		}
		else if (Array.isArray(existing))
		{
			existing.forEach(([key, value]) => { base[key] = value as string; });
		}
		else
		{
			Object.assign(base, existing as Record<string, string>);
		}
	}
	// Always enforce Basic auth for n8n endpoints
	const auth = getN8nAuthHeader();
	base['Authorization'] = auth.Authorization;
  // Include identity/session headers for all n8n requests
  try { base['X-Musai-Client-Id'] = getMusaiClientId(); } catch {}
  try { base['X-Musai-Session-Id'] = getN8nSessionId(); } catch {}
	return base;
}


