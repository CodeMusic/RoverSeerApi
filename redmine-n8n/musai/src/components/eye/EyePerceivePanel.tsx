import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, ChevronDown, Play, Pause, Wand2, Contrast, Sun, Moon, Brush, Eraser, ZoomIn, ZoomOut, Crop, Move, Palette, Filter, Trash2 } from 'lucide-react';
import { eyeApi } from '@/lib/eyeApi';

interface EyePerceivePanelProps 
{
  prompt: string;
  onCancel: () => void;
  autoRun?: boolean;
  eyeSessionId?: string;
  onAppendPrompt?: (compositePrompt: string) => void;
}

export const EyePerceivePanel: React.FC<EyePerceivePanelProps> = ({ prompt, onCancel, autoRun, eyeSessionId, onAppendPrompt }) =>
{
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type SessionImage = {
    url: string;
    mime: string | null;
    prompt: string; // composite prompt used to perceive this image
    createdAt: number;
  };

  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [followUpPrompt, setFollowUpPrompt] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const hasAutoRun = useRef(false);
  const slideshowTimerRef = useRef<number | null>(null);

  // Priming prompt (initial instruction) + follow-up cues (short modifiers)
  const primingPromptRef = useRef<string>((prompt || '').trim());
  const [followUpCues, setFollowUpCues] = useState<string[]>([]);
  // Store images as data URLs for maximal portability across browsers
  const [openToolsSection, setOpenToolsSection] = useState<'styles' | 'touchups' | 'advanced' | null>(null);
  const [animationDelayMs, setAnimationDelayMs] = useState<number>(2500);

  const stopSlideshow = () =>
  {
    if (slideshowTimerRef.current !== null)
    {
      window.clearInterval(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  const perceivePrompt = async (text: string) =>
  {
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
        const next = [...prev, { url, mime, prompt: text, createdAt: Date.now() }];
        // Move attentional spotlight to the newly perceived image
        setCurrentIndex(next.length - 1);
        return next;
      });
      try
      {
        onAppendPrompt && onAppendPrompt(text);
      }
      catch
      {
        // ignore session update errors
      }
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

  const handlePerceive = async () =>
  {
    const text = primingPromptRef.current;
    await perceivePrompt(text);
  };

  const handleFollowUp = async () =>
  {
    const text = (followUpPrompt || '').trim();
    if (!text)
    {
      return;
    }
    // Compose full context: priming + prior cues + new cue
    const nextCues = [...followUpCues, text];
    const composite = [primingPromptRef.current, ...nextCues].join('. ');
    await perceivePrompt(composite);
    setFollowUpCues(nextCues);
    setFollowUpPrompt('');
  };

  const handleDownloadCurrent = async () =>
  {
    if (sessionImages.length === 0)
    {
      return;
    }
    try
    {
      const img = sessionImages[currentIndex];
      const mime = img.mime || 'image/png';
      const ext = mime.split('/')?.[1] || 'png';
      const filename = `eyeofmusai.${ext}`;
      // Create a temporary anchor to trigger download
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
      // Fallback: open in new tab
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
      // Load all images to measure dimensions
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

      // Helper to draw image contained within canvas
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

      // Schedule frames
      const delay = Math.max(50, animationDelayMs);
      for (let i = 0; i < bitmaps.length; i++)
      {
        drawContained(bitmaps[i]);
        // Wait delay before drawing next
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
      // Cleanup temp url shortly after save
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    catch (e: any)
    {
      setError(e?.message || 'Failed to create animation');
    }
  };

  const handleDeleteCurrent = () =>
  {
    if (sessionImages.length === 0)
    {
      return;
    }
    const ok = window.confirm('Remove this image from the session?');
    if (!ok)
    {
      return;
    }
    setSessionImages(prev =>
    {
      const next = prev.filter((_, idx) => idx !== currentIndex);
      // Adjust index to nearest valid frame
      setCurrentIndex(i => {
        if (next.length === 0) return 0;
        return Math.min(i, next.length - 1);
      });
      // Stop slideshow if fewer than 2 frames remain
      if (next.length < 2)
      {
        setIsPlaying(false);
      }
      return next;
    });
  };

  const handleToolAction = async (cue: string) =>
  {
    if (!primingPromptRef.current)
    {
      return;
    }
    const nextCues = [...followUpCues, cue];
    const composite = [primingPromptRef.current, ...nextCues].join('. ');
    await perceivePrompt(composite);
    setFollowUpCues(nextCues);
  };
  // Categorized tools: 7 items per row to avoid layout gaps on desktop
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
  const TOUCH_UP_TOOLS: Array<ToolDef> = [
    { id: 'touchup-contrast', label: 'Contrast+', cue: 'increase contrast slightly', Icon: Contrast },
    { id: 'touchup-center', label: 'Center', cue: 'center composition and symmetrical framing', Icon: Crop },
    { id: 'touchup-close', label: 'Close-up', cue: 'close-up composition emphasis on subject', Icon: ZoomIn },
    { id: 'touchup-wide', label: 'Zoom Out', cue: 'wider composition with more environment', Icon: ZoomOut },
    { id: 'touchup-dynamic', label: 'Dynamic', cue: 'add sense of motion and energy', Icon: Move },
    { id: 'touchup-simplify', label: 'Simplify', cue: 'simplify background and reduce clutter', Icon: Eraser },
    { id: 'touchup-balance', label: 'Balance', cue: 'balanced exposure and color harmony', Icon: Palette },
  ];
  const ADVANCED_TOOLS: Array<ToolDef> = [
    { id: 'adv-remove-bg', label: 'Remove BG', cue: 'subject isolated on clean background', Icon: Eraser },
    { id: 'adv-soften', label: 'Soften', cue: 'soft lighting and subtle bokeh', Icon: Filter },
    { id: 'adv-sharpen', label: 'Sharpen', cue: 'sharper focus on subject details', Icon: Wand2 },
    { id: 'adv-mood-warm', label: 'Golden Hour', cue: 'golden hour lighting and warmth', Icon: Sun },
    { id: 'adv-mood-cool', label: 'Blue Hour', cue: 'blue hour cool lighting and calm mood', Icon: Moon },
    { id: 'adv-portrait', label: 'Portrait', cue: 'portrait orientation and subject emphasis', Icon: ZoomIn },
    { id: 'adv-landscape', label: 'Landscape', cue: 'landscape orientation and scenic emphasis', Icon: ZoomOut },
  ];

  useEffect(() =>
  {
    if (autoRun && !hasAutoRun.current)
    {
      hasAutoRun.current = true;
      // Fire and forget; handlePerceive manages state
      handlePerceive();
    }
  }, [autoRun]);

  // Manage slideshow timer
  useEffect(() =>
  {
    if (!isPlaying || sessionImages.length < 2)
    {
      stopSlideshow();
      return;
    }
    // Advance every 2.5 seconds
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

  // Cleanup slideshow timer on unmount
  useEffect(() =>
  {
    return () =>
    {
      if (slideshowTimerRef.current !== null)
      {
        window.clearInterval(slideshowTimerRef.current);
        slideshowTimerRef.current = null;
      }
    };
  }, []);

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
            <div className="rounded-xl border p-3 sm:p-4 bg-background/50 min-h-[240px] flex items-center justify-center relative overflow-hidden">
              {sessionImages.length > 0 ? (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs sm:text-sm text-muted-foreground">Result {currentIndex + 1} / {sessionImages.length}</div>
                    {sessionImages.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setIsPlaying(p => !p)} disabled={isSubmitting}>
                          {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <img src={sessionImages[currentIndex].url} alt="Generated" className="max-h-[60vh] sm:max-h-[70vh] rounded-md object-contain mx-auto w-full" />
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
                    <div className="text-xs text-muted-foreground truncate max-w-[60%]">
                      Prompt: {sessionImages[currentIndex]?.prompt}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground">Your image will appear here</div>
              )}
            </div>

            {/* Tools toolbar (collapsible sections) */}
            <div className="mt-4 space-y-2">
              {/* Section helper rendering */}
              <div>
                <button
                  type="button"
                  className="w-full flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/40"
                  onClick={() => setOpenToolsSection(prev => prev === 'styles' ? null : 'styles')}
                  aria-expanded={openToolsSection === 'styles'}
                >
                  <span className="text-xs sm:text-sm">Art Styles</span>
                  {openToolsSection === 'styles' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {openToolsSection === 'styles' && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
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
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="w-full flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/40"
                  onClick={() => setOpenToolsSection(prev => prev === 'touchups' ? null : 'touchups')}
                  aria-expanded={openToolsSection === 'touchups'}
                >
                  <span className="text-xs sm:text-sm">Touch-ups</span>
                  {openToolsSection === 'touchups' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {openToolsSection === 'touchups' && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {TOUCH_UP_TOOLS.map(({ id, label, cue, Icon }) => (
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
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="w-full flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted/40"
                  onClick={() => setOpenToolsSection(prev => prev === 'advanced' ? null : 'advanced')}
                  aria-expanded={openToolsSection === 'advanced'}
                >
                  <span className="text-xs sm:text-sm">Advanced</span>
                  {openToolsSection === 'advanced' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {openToolsSection === 'advanced' && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {ADVANCED_TOOLS.map(({ id, label, cue, Icon }) => (
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
                )}
              </div>
            </div>

            {/* Follow-up input */}
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

            {/* Animation download */}
            {sessionImages.length > 1 && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
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


