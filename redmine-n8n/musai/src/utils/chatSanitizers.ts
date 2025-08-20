// Shared utilities for chat content hygiene and optional context envelopes

/** Prefix that marked the optional hidden-context envelope */
export const CTX_SENTINEL = 'CTXJSON:';

/** Safely decode a base64 string to UTF-8 text. */
export function decodeBase64ToUtf8(b64: string): string
{
  try { return decodeURIComponent(escape(atob(b64))); }
  catch
  {
    try { return atob(b64); } catch { return ''; }
  }
}

/**
 * Parse an optional CTX envelope `CTXJSON:<base64(JSON)>`.
 * Returns null if the text is not an envelope or cannot be parsed.
 */
export function parseCtxEnvelope(text: string): { visible: string; payload: string } | null
{
  if (!text || !text.startsWith(CTX_SENTINEL)) return null;
  const encoded = text.slice(CTX_SENTINEL.length);
  try
  {
    const obj = JSON.parse(decodeBase64ToUtf8(encoded));
    if (obj && typeof obj.visible === 'string')
    {
      return { visible: obj.visible, payload: String(obj.payload ?? '') };
    }
  }
  catch {}
  return null;
}

/** Remove code/results blocks and compact whitespace for chat bubble display. */
export function stripCodeAndResultsBlocks(text: string): string
{
  if (!text) return text;
  return text
    // Paired blocks
    .replace(/\[code\][\s\S]*?\[\/code\]/gi, '')
    .replace(/\[results\][\s\S]*?\[\/results\]/gi, '')
    .replace(/\[coderesults\][\s\S]*?\[\/coderesults\]/gi, '')
    // Single-bracket variants like [code: ...] or [results: ...]
    .replace(/\[\s*code\s*:[^\]]*\]/gi, '')
    .replace(/\[\s*results\s*:[^\]]*\]/gi, '')
    .replace(/\[\s*coderesults\s*:[^\]]*\]/gi, '')
    // General single-bracket headers starting with "code" or "coderesults"
    // e.g. [Code (javascript) snippet: ... | last output: ...]
    .replace(/\[\s*code[^\]]*\]/gi, '')
    .replace(/\[\s*coderesults[^\]]*\]/gi, '')
    .trim();
}


