import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Image as ImageIcon, Loader2 } from 'lucide-react';
import { eyeApi } from '@/lib/eyeApi';

interface EyePerceivePanelProps 
{
  prompt: string;
  onCancel: () => void;
  autoRun?: boolean;
}

export const EyePerceivePanel: React.FC<EyePerceivePanelProps> = ({ prompt, onCancel, autoRun }) =>
{
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAutoRun = useRef(false);

  const handlePerceive = async () =>
  {
    const text = (prompt || '').trim();
    if (!text)
    {
      onCancel();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try
    {
      const blob = await eyeApi.generateImage(text);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setImageMime(blob.type || null);
    }
    catch (e: any)
    {
      const msg = (e?.message || 'Generation failed').toString();
      setError(msg);
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
      // Fire and forget; handlePerceive manages state
      handlePerceive();
    }
  }, [autoRun]);

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Eye className="w-4 h-4" /> Eye of Musai — Perceive
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Prompt</div>
            <div className="text-sm sm:text-base break-words">{prompt}</div>
          </div>

          <div className="flex gap-2 justify-end lg:col-span-1 lg:justify-end">
            <Button variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
            <Button onClick={handlePerceive} disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
              Perceive
            </Button>
          </div>

          <div className="lg:col-span-2">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-600 p-3 text-sm flex items-center justify-between gap-3">
                <span>{error}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setError(null); handlePerceive(); }} className="rounded-xl">Retry</Button>
                </div>
              </div>
            )}
            <div className="rounded-xl border p-3 sm:p-4 bg-background/50 min-h-[240px] flex items-center justify-center">
              {imageUrl ? (
                <div className="w-full">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">Result</div>
                  <img src={imageUrl} alt="Generated" className="max-h-[70vh] rounded-md object-contain mx-auto w-full" />
                  <div className="mt-3 text-center">
                    {(() => {
                      const ext = imageMime?.split('/')?.[1] || 'png';
                      const filename = `eyeofmusai.${ext}`;
                      return (
                        <a href={imageUrl} download={filename} className="text-sm underline">Download</a>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground">Your image will appear here</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Perceiving…</span>
          </div>
        </div>
      )}
    </div>
  );
};


