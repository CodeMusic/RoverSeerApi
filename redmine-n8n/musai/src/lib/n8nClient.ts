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
	return base;
}


