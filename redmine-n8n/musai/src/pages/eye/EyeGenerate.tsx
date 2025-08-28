import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Image as ImageIcon, Loader2 } from 'lucide-react';
import { eyeApi } from '@/lib/eyeApi';
import { AllSessions } from '@/types/chat';

type LocationState = 
{
  prompt?: string;
};

export default function EyeGenerate()
{
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  const emptySessions: AllSessions[] = [];

  const handleConfirm = async () =>
  {
    const prompt = (state.prompt || '').trim();
    if (!prompt)
    {
      navigate(-1);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try
    {
      const blob = await eyeApi.generateImage(prompt);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
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

  const handleCancel = () => navigate(-1);

  const renderContent = () => (
    <div className="flex-1 p-6 space-y-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground mb-2">Prompt</div>
          <div className="text-base">{state.prompt}</div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleCancel} className="rounded-xl">Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="rounded-xl">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            Perceive
          </Button>
        </div>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-600 p-3 text-sm">{error}</div>
        )}
        {imageUrl && (
          <div className="rounded-xl border p-4 bg-background/50">
            <div className="text-sm text-muted-foreground mb-2">Result</div>
            <img src={imageUrl} alt="Generated" className="max-h-[70vh] rounded-md object-contain mx-auto" />
            <div className="mt-3 text-center">
              <a href={imageUrl} download={"eyeofmusai.png"} className="text-sm underline">Download</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Left sidebar placeholder for consistent layout */}
      <div className="hidden md:block w-0" />
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" /> Eye of Musai — Perceive
          </div>
        </div>
        {renderContent()}
      </div>
      {/* Right sidebar placeholder */}
      <div className="hidden md:block w-0" />
    </div>
  );
}


