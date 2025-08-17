export interface StreamingHandlers
{
  onToken: (textChunk: string) => void;
  onFinalJson?: (obj: any, raw: string) => void;
  onFirstToken?: () => void;
  onError?: (message?: string, payload?: any) => void;
}

export interface StreamingResult
{
  finalText: string;
  sawStreamToken: boolean;
  raw: string;
}

export const shouldTreatAsStream = (contentTypeHeader: string | null): boolean =>
{
  const ct = contentTypeHeader || '';
  if (!ct) return true; // conservative: try to stream when possible
  return /application\/x-ndjson/i.test(ct) || /text\/event-stream/i.test(ct) || /text\//i.test(ct) || !/application\/json/i.test(ct);
};

// Parse either NDJSON lines or SSE `data: {...}` lines
function extractEvent(line: string): { type: string; content?: string; obj?: any } | null
{
  let payload = line.trim();
  if (!payload) return null;
  if (payload.startsWith('data:'))
  {
    payload = payload.slice(5).trimStart();
  }
  try
  {
    const obj = JSON.parse(payload) as Record<string, unknown>;
    const type = typeof obj.type === 'string' ? obj.type : 'item';
    const content =
      (typeof (obj as any).content === 'string' && (obj as any).content) ||
      (typeof (obj as any).delta === 'string' && (obj as any).delta) ||
      (typeof (obj as any).text === 'string' && (obj as any).text) ||
      '';
    return { type, content, obj };
  }
  catch
  {
    return null;
  }
}

// Reads a streaming HTTP response and emits tokens and/or a final JSON payload
export async function readNdjsonOrSse(
  response: Response,
  handlers: StreamingHandlers
): Promise<StreamingResult>
{
  let finalText = '';
  let sawStreamToken = false;
  let rawAccumulator = '';

  if (!response.body)
  {
    return { finalText, sawStreamToken, raw: '' };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  rawAccumulator = '';
  let firstTokenEmitted = false;

  while (true)
  {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    rawAccumulator += chunk;

    const normalized = buffer
      .replace(/}\s*(?=\s*\{)/g, '}\n') // back-to-back JSON
      .replace(/\n\n/g, '\n'); // SSE double newlines → single line

    const lines = normalized.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines)
    {
      const evt = extractEvent(line);
      if (!evt || evt.type !== 'item') continue;
      const content = evt.content || '';
      if (!content) continue;

      // Embedded final JSON payload in content
      if (/^\s*\{/.test(content))
      {
        try
        {
          const obj = JSON.parse(content);
          handlers.onFinalJson?.(obj, content);
        }
        catch
        {
          // ignore invalid json content
        }
        continue;
      }

      // Streaming token
      sawStreamToken = true;
      if (!firstTokenEmitted)
      {
        firstTokenEmitted = true;
        handlers.onFirstToken?.();
      }
      finalText += content;
      handlers.onToken(content);
    }
  }

  // flush remainder
  const tailFlush = decoder.decode();
  if (tailFlush)
  {
    buffer += tailFlush;
    rawAccumulator += tailFlush;
  }
  const tailEvt = extractEvent(buffer.trim());
  if (tailEvt)
  {
    if (tailEvt.type === 'error') {
      handlers.onError?.(typeof tailEvt.obj?.message === 'string' ? tailEvt.obj.message : undefined, tailEvt.obj);
    } else if (tailEvt.type === 'item' && tailEvt.content) {
      if (/^\s*\{/.test(tailEvt.content))
      {
        try
        {
          const obj = JSON.parse(tailEvt.content);
          handlers.onFinalJson?.(obj, tailEvt.content);
        }
        catch {}
      }
      else
      {
        sawStreamToken = true;
        if (!firstTokenEmitted)
        {
          firstTokenEmitted = true;
          handlers.onFirstToken?.();
        }
        finalText += tailEvt.content;
        handlers.onToken(tailEvt.content);
      }
    }
  }

  return { finalText, sawStreamToken, raw: rawAccumulator };
}


