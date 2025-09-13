import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Image as ImageIcon, Loader2, Sparkles, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Play, Pause, Wand2, Contrast, Sun, Moon, Brush, Eraser, ZoomIn, ZoomOut, Crop, Move, Palette, Filter, Trash2 } from 'lucide-react';
import { eyeApi, EyeRecognizeRequest } from '@/lib/eyeApi';

export interface EyeWorkbenchSeed
{
  initialPrompt?: string;
  initialImage?: { data: string; mimeType: string; fileName?: string };
  autoRun?: boolean;
  autoRunMagicEye?: boolean;
}

interface EyeWorkbenchPanelProps
{
  seed: EyeWorkbenchSeed;
  onCancel: () => void;
  eyeSessionId?: string;
  onAppendPrompt?: (compositePrompt: string) => void;
}

export const EyeWorkbenchPanel: React.FC<EyeWorkbenchPanelProps> = ({ seed, onCancel, eyeSessionId, onAppendPrompt }) =>
{
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session timeline of images (perceived or magic outputs)
  type SessionImage = {
    url: string;
    mime: string | null;
    prompt?: string;
    summary?: string;
    summaryCollapsed?: boolean;
    createdAt: number;
    source: 'perceive' | 'magiceye' | 'initial';
  };
  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animationDelayMs, setAnimationDelayMs] = useState<number>(2500);
  const slideshowTimerRef = useRef<number | null>(null);

  // Perceive state
  const primingPromptRef = useRef<string>((seed.initialPrompt || '').trim());
  const [followUpPrompt, setFollowUpPrompt] = useState<string>('');
  const [followUpCues, setFollowUpCues] = useState<string[]>([]);
  const hasAutoRun = useRef(false);

  // Magic result surface (non-image JSON/text)
  const [magicEyeResult, setMagicEyeResult] = useState<any>(null);

  const stopSlideshow = () =>
  {
    if (slideshowTimerRef.current !== null)
    {
      window.clearInterval(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  // Manage slideshow timer
  useEffect(() =>
  {
    if (!isPlaying || sessionImages.length < 2)
    {
      stopSlideshow();
      return;
    }
    slideshowTimerRef.current = window.setInterval(() =>
    {
      setCurrentIndex(prev =>
      {
        const next = (prev + 1) % sessionImages.length;
        return next;
      });
    }, 2500);
    return () =>
    {
      if (slideshowTimerRef.current !== null)
      {
        window.clearInterval(slideshowTimerRef.current);
        slideshowTimerRef.current = null;
      }
    };
  }, [isPlaying, sessionImages.length]);

  // Seed initial image if provided
  useEffect(() =>
  {
    if (seed.initialImage)
    {
      const base64 = (() =>
      {
        const data = seed.initialImage!.data;
        const commaIndex = data.indexOf(',');
        return commaIndex !== -1 ? data.slice(commaIndex + 1) : data;
      })();
      const url = `data:${seed.initialImage.mimeType};base64,${base64}`;
      setSessionImages(prev =>
      {
        const exists = prev.some(p => p.url === url);
        if (exists) return prev;
        const appended: SessionImage = { url, mime: seed.initialImage?.mimeType || null, createdAt: Date.now(), source: 'initial' };
        return [...prev, appended];
      });
      setCurrentIndex(i => 0);
    }
  }, [seed.initialImage]);

  // Auto-run based on seed flags
  useEffect(() =>
  {
    if (hasAutoRun.current) return;
    if (seed.autoRunMagicEye && sessionImages.length > 0)
    {
      hasAutoRun.current = true;
      void handleMagicEye();
      return;
    }
    if (seed.autoRun && seed.initialPrompt)
    {
      hasAutoRun.current = true;
      void handlePerceive();
      return;
    }
  }, [seed.autoRun, seed.autoRunMagicEye, seed.initialPrompt, sessionImages.length]);

  const perceiveWithPrompt = async (text: string) =>
  {
    setIsSubmitting(true);
    setError(null);
    try
    {
      const blob = await eyeApi.generateImage(text);
      const toDataUrl = (b: Blob) => new Promise<string>((resolve, reject) => {
        try {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result || ''));
          fr.onerror = reject;
          fr.readAsDataURL(b);
        } catch (e) { reject(e); }
      });
      const url = await toDataUrl(blob);
      const mime = blob.type || null;
      setSessionImages(prev =>
      {
        const appended: SessionImage = { url, mime, prompt: text, createdAt: Date.now(), source: 'perceive' };
        const next: SessionImage[] = [...prev, appended];
        setCurrentIndex(next.length - 1);
        return next;
      });
      try { onAppendPrompt && onAppendPrompt(text); } catch {}
    }
    catch (e: any)
    {
      setError(e?.message || 'Generation failed');
    }
    finally
    {
      setIsSubmitting(false);
    }
  };

  const handlePerceive = async () =>
  {
    const text = (primingPromptRef.current || '').trim();
    if (!text)
    {
      onCancel();
      return;
    }
    // If there is a current frame, run MagicEye with current image + prompt; otherwise generate from text
    // Perceive should use prompts; if an image exists, we still generate from the prompt (not MagicEye)
    if (sessionImages.length > 0) {
      await perceiveWithPrompt(text);
      return;
    }
    await perceiveWithPrompt(text);
  };

  const handleFollowUp = async () =>
  {
    const text = (followUpPrompt || '').trim();
    if (!text)
    {
      return;
    }
    const nextCues = [...followUpCues, text];
    const composite = [primingPromptRef.current, ...nextCues].join('. ');
    await perceiveWithPrompt(composite);
    setFollowUpCues(nextCues);
    setFollowUpPrompt('');
  };

  const buildRecognizePayloadForCurrent = (): EyeRecognizeRequest | null =>
  {
    if (sessionImages.length === 0) return null;
    const img = sessionImages[currentIndex];
    const base64 = (() =>
    {
      const comma = img.url.indexOf(',');
      return comma !== -1 ? img.url.slice(comma + 1) : '';
    })();
    const mime = img.mime || 'image/png';
    const fileName = 'eyeofmusai.png';
    return { image: { data: base64, mimeType: mime, fileName } };
  };

  const handleAnalyze = async () =>
  {
    const payload = buildRecognizePayloadForCurrent();
    if (!payload)
    {
      setError('No image to analyze.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try
    {
      const res = await eyeApi.recognize(payload);
      // Store summary on the current frame so paging shows its own analysis
      setSessionImages(prev =>
      {
        const next: SessionImage[] = [...prev];
        if (currentIndex >= 0 && currentIndex < next.length)
        {
          const current = next[currentIndex];
          next[currentIndex] = { ...current, summary: res?.summary } as SessionImage;
        }
        return next;
      });
    }
    catch (e: any)
    {
      setError((e?.message || 'Recognition failed').toString());
    }
    finally
    {
      setIsSubmitting(false);
    }
  };

  const magicEyeWithPrompt = async (_prompt: string) =>
  {
    const payload = buildRecognizePayloadForCurrent();
    if (!payload)
    {
      setError('No image to send to MagicEye.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setMagicEyeResult(null);
    try
    {
      const res = await eyeApi.magicEyeUpload(payload);
      if (res instanceof Blob)
      {
        if (res.type && res.type.startsWith('image/'))
        {
          const url = URL.createObjectURL(res);
          setMagicEyeResult({ type: 'image', mimeType: res.type, size: res.size });
          setSessionImages(prev =>
          {
            const appended: SessionImage = { url, mime: res.type || null, createdAt: Date.now(), source: 'magiceye' };
            const next: SessionImage[] = [...prev, appended];
            setCurrentIndex(next.length - 1);
            return next;
          });
        }
        else
        {
          setMagicEyeResult({ type: 'blob', mimeType: res.type, size: res.size });
        }
      }
      else
      {
        // JSON or text outcome; show in panel
        setMagicEyeResult(res);
      }
    }
    catch (e: any)
    {
      setError((e?.message || 'MagicEye failed').toString());
    }
    finally
    {
      setIsSubmitting(false);
    }
  };

  const handleMagicEye = async () =>
  {
    // No additional prompt; just send current image
    await magicEyeWithPrompt('');
  };

  // Tools
  type ToolDef = { id: string; label: string; cue: string; Icon: React.ComponentType<{ className?: string }> };
  const ART_STYLE_TOOLS: Array<ToolDef> = [
    { id: 'style-cinematic', label: 'Cinematic', cue: 'cinematic color grading and depth', Icon: Filter },
    { id: 'style-painterly', label: 'Painterly', cue: 'painterly brush strokes style', Icon: Brush },
    { id: 'style-vibrant', label: 'Vibrant', cue: 'more vibrant colors and saturation', Icon: Palette },
    { id: 'style-warm', label: 'Warm', cue: 'warmer lighting and tones', Icon: Sun },
    { id: 'style-cool', label: 'Cool', cue: 'cooler lighting and tones', Icon: Moon },
    { id: 'style-noir', label: 'Noir', cue: 'high contrast monochrome noir style', Icon: Contrast },
    { id: 'style-magic', label: 'Enhance', cue: 'enhance details and quality', Icon: Wand2 },
  ];

  const handleToolAction = async (cue: string) =>
  {
    if (!primingPromptRef.current)
    {
      return;
    }
    const nextCues = [...followUpCues, cue];
    const composite = [primingPromptRef.current, ...nextCues].join('. ');
    await perceiveWithPrompt(composite);
    setFollowUpCues(nextCues);
  };

  const handleDeleteCurrent = () =>
  {
    if (sessionImages.length === 0)
    {
      return;
    }
    const ok = window.confirm('Remove this image from the session?');
    if (!ok) return;
    setSessionImages(prev =>
    {
      const next = prev.filter((_, idx) => idx !== currentIndex);
      setCurrentIndex(i => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
      if (next.length < 2) setIsPlaying(false);
      return next;
    });
  };

  const handleDownloadCurrent = async () =>
  {
    if (sessionImages.length === 0) return;
    try
    {
      const img = sessionImages[currentIndex];
      const mime = img.mime || 'image/png';
      const ext = mime.split('/')?.[1] || 'png';
      const filename = `eyeofmusai.${ext}`;
      const a = document.createElement('a');
      a.href = img.url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    catch
    {
      window.open(sessionImages[currentIndex].url, '_blank');
    }
  };

  const handleDownloadAnimation = async () =>
  {
    if (sessionImages.length < 2)
    {
      setError('Need at least 2 images to create an animation.');
      return;
    }
    try
    {
      const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      const bitmaps = await Promise.all(sessionImages.map(s => loadImage(s.url)));
      const width = Math.max(...bitmaps.map(b => b.width));
      const height = Math.max(...bitmaps.map(b => b.height));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx)
      {
        setError('Canvas unsupported for animation.');
        return;
      }

      const fps = Math.max(1, Math.min(60, Math.round(1000 / Math.max(50, animationDelayMs))));
      const stream = (canvas as HTMLCanvasElement).captureStream(fps);
      const mimeCandidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      let chosenMime: string | null = null;
      for (const m of mimeCandidates)
      {
        if ((window as any).MediaRecorder && (window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported(m))
        {
          chosenMime = m; break;
        }
      }
      if (!chosenMime)
      {
        setError('Animation download not supported in this browser.');
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType: chosenMime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      const stopped = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
      recorder.start();

      const drawContained = (img: HTMLImageElement) =>
      {
        ctx.clearRect(0, 0, width, height);
        const scale = Math.min(width / img.width, height / img.height);
        const dw = Math.round(img.width * scale);
        const dh = Math.round(img.height * scale);
        const dx = Math.floor((width - dw) / 2);
        const dy = Math.floor((height - dh) / 2);
        ctx.drawImage(img, dx, dy, dw, dh);
      };

      const delay = Math.max(50, animationDelayMs);
      for (let i = 0; i < bitmaps.length; i++)
      {
        drawContained(bitmaps[i]);
        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, delay));
      }
      recorder.stop();
      await stopped;
      const blob = new Blob(chunks, { type: chosenMime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eyeofmusai_animation.webm';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    catch (e: any)
    {
      setError(e?.message || 'Failed to create animation');
    }
  };

  const toggleSummaryCollapsed = (idx: number) =>
  {
    setSessionImages(prev =>
    {
      const next: SessionImage[] = [...prev];
      if (idx >= 0 && idx < next.length)
      {
        const cur = next[idx];
        next[idx] = { ...cur, summaryCollapsed: !cur.summaryCollapsed };
      }
      return next;
    });
  };

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Eye className="w-4 h-4" /> Eye of Musai — Workbench
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="rounded-xl">Close</Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          {/* Prompt summary at top */}
          <div className="rounded-xl border bg-card p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Prompt</div>
            <div className="text-sm sm:text-base break-words">{primingPromptRef.current || <span className="text-muted-foreground">(none)</span>}</div>
          </div>

          {/* Current image viewer and controls */}
          <div className="rounded-xl border p-3 sm:p-4 bg-background/50 min-h-[240px] flex items-center justify-center relative overflow-hidden lg:col-span-2">
            {sessionImages.length > 0 ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs sm:text-sm text-muted-foreground">Result {currentIndex + 1} / {sessionImages.length}</div>
                  <div className="flex items-center gap-2">
                    {sessionImages.length > 1 && (
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setIsPlaying(p => !p)} disabled={isSubmitting}>
                        {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={handleAnalyze} disabled={isSubmitting}>
                      Analyze
                    </Button>
                    <Button size="sm" className="rounded-xl magiceye-aurora" variant="secondary" onClick={handleMagicEye} disabled={isSubmitting}>
                      <Sparkles className="w-4 h-4 mr-2" /> MagicEye
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <img src={sessionImages[currentIndex].url} alt="Result" className="max-h-[60vh] sm:max-h-[70vh] rounded-md object-contain mx-auto w-full" />
                  {sessionImages[currentIndex]?.source === 'magiceye' && (
                    <div className="absolute top-2 right-2 rounded-full px-2 py-1 text-[10px] sm:text-xs flex items-center gap-1 magiceye-aurora-soft border border-white/20 shadow-md">
                      <Eye className="w-3 h-3" />
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                  {sessionImages[currentIndex]?.summary && (
                    <div className="absolute left-0 right-0 bottom-0 bg-background/80 backdrop-blur-sm border-t rounded-b-md">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 text-left"
                        onClick={() => toggleSummaryCollapsed(currentIndex)}
                        aria-expanded={!sessionImages[currentIndex]?.summaryCollapsed}
                        aria-controls="summary-panel"
                      >
                        <span className="text-xs text-muted-foreground">Summary</span>
                        {sessionImages[currentIndex]?.summaryCollapsed ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      {!sessionImages[currentIndex]?.summaryCollapsed && (
                        <div id="summary-panel" className="px-3 pb-2">
                          <div className="text-xs sm:text-sm whitespace-pre-wrap max-h-40 overflow-auto">{sessionImages[currentIndex].summary}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {sessionImages.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-3 sm:p-2 rounded-full bg-background/70 border shadow hover:bg-background"
                        onClick={() => setCurrentIndex(idx => (idx - 1 + sessionImages.length) % sessionImages.length)}
                        aria-label="Previous"
                        disabled={isSubmitting}
                      >
                        <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 sm:p-2 rounded-full bg-background/70 border shadow hover:bg-background"
                        onClick={() => setCurrentIndex(idx => (idx + 1) % sessionImages.length)}
                        aria-label="Next"
                        disabled={isSubmitting}
                      >
                        <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button onClick={handleDownloadCurrent} className="text-sm underline">Download</button>
                    <button onClick={handleDeleteCurrent} className="text-sm text-red-600 underline flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                  {sessionImages.length > 1 && (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-xs sm:text-sm text-muted-foreground">ms per image</label>
                        <input
                          type="number"
                          min={50}
                          step={50}
                          value={animationDelayMs}
                          onChange={(e) => setAnimationDelayMs(Number(e.target.value || 0))}
                          className="w-28 border rounded-xl px-2 py-1 bg-background"
                        />
                      </div>
                      <Button onClick={handleDownloadAnimation} disabled={isSubmitting} className="rounded-xl">Download animation</Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground">Your image will appear here</div>
            )}
          </div>

          {/* Tools shortcuts */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ART_STYLE_TOOLS.map(({ id, label, cue, Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={`${label}: ${cue}`}
                  className="flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-muted/40 active:bg-muted disabled:opacity-50"
                  onClick={() => handleToolAction(cue)}
                  disabled={isSubmitting}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up input */}
          <div className="lg:col-span-2">
            <div className="mt-3 flex items-stretch sm:items-center gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={followUpPrompt}
                onChange={(e) => setFollowUpPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFollowUp(); } }}
                placeholder="Type a follow-up to refine or branch this session…"
                className="flex-1 border rounded-xl px-3 py-2 bg-background"
                disabled={isSubmitting}
              />
              <Button onClick={handleFollowUp} disabled={isSubmitting || !followUpPrompt.trim()} className="rounded-xl w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                Perceive
              </Button>
            </div>
          </div>

          {/* Analysis surface (MagicEye non-image outputs) */}
          <div className="lg:col-span-2 space-y-3">
            {magicEyeResult && (
              <div className="p-3 rounded-md bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">MagicEye</div>
                {typeof magicEyeResult === 'string' ? (
                  <div className="text-xs break-words whitespace-pre-wrap">{magicEyeResult}</div>
                ) : (
                  <div className="text-xs break-words whitespace-pre-wrap">{JSON.stringify(magicEyeResult, null, 2)}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Working…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-4 bottom-4 right-4">
          <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-600 p-3 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setError(null)} className="rounded-xl">Dismiss</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EyeWorkbenchPanel;


