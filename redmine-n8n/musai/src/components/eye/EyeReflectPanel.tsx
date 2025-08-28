import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { eyeApi, EyeRecognizeRequest, EyeRecognizeResponse } from '@/lib/eyeApi';

interface EyeReflectPanelProps
{
  payload: EyeRecognizeRequest;
  preview?: { data: string; mimeType: string; fileName?: string };
  onCancel: () => void;
  autoRun?: boolean;
}

export const EyeReflectPanel: React.FC<EyeReflectPanelProps> = ({ payload, preview, onCancel, autoRun }) =>
{
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EyeRecognizeResponse | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const hasAutoRun = useRef(false);
  const submittedRef = useRef(false);

  const normalizeBase64Data = (data?: string): string | null =>
  {
    if (!data) return null;
    const commaIndex = data.indexOf(',');
    return commaIndex !== -1 ? data.slice(commaIndex + 1) : data;
  };

  const imageSrc = useMemo(() =>
  {
    const source = preview || payload?.image;
    if (!source) return null;
    const base64 = normalizeBase64Data(source.data);
    if (!base64) return null;
    return `data:${source.mimeType};base64,${base64}`;
  }, [preview, payload]);

  useEffect(() =>
  {
    setIsImageLoading(!!imageSrc);
  }, [imageSrc]);

  const handleAnalyze = async () =>
  {
    if (!payload) return;
    if (submittedRef.current && !error) {
      // Already sent and not in an error-retry state
      return;
    }
    submittedRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try
    {
      const res = await eyeApi.recognize(payload);
      setResult(res);
    }
    catch (e: any)
    {
      setError((e?.message || 'Recognition failed').toString());
      // Allow retry after error
      submittedRef.current = false;
    }
    finally
    {
      setIsSubmitting(false);
    }
  };

  useEffect(() =>
  {
    if (autoRun && !hasAutoRun.current)
    {
      hasAutoRun.current = true;
      handleAnalyze();
    }
  }, [autoRun]);

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Eye className="w-4 h-4" /> Eye of Musai — Reflect
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {imageSrc && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Selected image</div>
              <img
                src={imageSrc}
                alt={preview?.fileName || payload?.image?.fileName || 'Selected'}
                className="max-h-64 rounded-md object-contain"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
              {isImageLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading image…</span>
                </div>
              )}
            </div>
          )}

          {!result && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAnalyze} disabled={isSubmitting || !!result || isImageLoading} className="rounded-xl">Analyze</Button>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 flex items-center justify-between gap-3">
              <span>{error}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setError(null); submittedRef.current = false; handleAnalyze(); }} className="rounded-xl">Retry</Button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.summary && (
                <div className="p-3 rounded-md bg-muted/40">
                  <div className="text-xs text-muted-foreground mb-1">Summary</div>
                  <div className="text-sm whitespace-pre-wrap">{result.summary}</div>
                </div>
              )}
              <div className="pt-2 flex gap-2 justify-end">
                <Button onClick={onCancel} className="rounded-xl">Back</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Musai is Recognizing…</span>
          </div>
        </div>
      )}
    </div>
  );
};


