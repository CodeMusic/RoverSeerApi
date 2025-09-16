import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { n8nApi } from '@/config/n8nEndpoints';
import audioEngine from '@/lib/audio/AudioEngine';
import { AudioClip } from '@/types/studio';
import { v4 as uuidv4 } from 'uuid';

interface StudioGeneratorsProps
{
  onAddGeneratedClip: (meta: AudioClip, buffer: AudioBuffer) => void;
}

export const StudioGenerators: React.FC<StudioGeneratorsProps> = ({ onAddGeneratedClip }) =>
{
  const [musicPrompt, setMusicPrompt] = useState('chill lo-fi drum loop');
  const [sfxPrompt, setSfxPrompt] = useState('gentle ocean wave');
  const [ttsText, setTtsText] = useState('Welcome to Musai Studio.');
  const [isBusy, setIsBusy] = useState(false);

  const handleGenerateMusic = async () =>
  {
    setIsBusy(true);
    try
    {
      const blob = await n8nApi.generateMusicLoop(musicPrompt, 8, 'lofi');
      if (!blob) return;
      const buffer = await audioEngine.decodeBlobToBuffer(blob);
      const meta: AudioClip = { id: uuidv4(), name: `music: ${musicPrompt.slice(0, 18)}`, durationSec: buffer.duration, color: '#60a5fa', sourceType: 'generated' };
      onAddGeneratedClip(meta, buffer);
    }
    finally { setIsBusy(false); }
  };

  const handleGenerateSfx = async () =>
  {
    setIsBusy(true);
    try
    {
      const blob = await n8nApi.generateSfxLoop(sfxPrompt, 4);
      if (!blob) return;
      const buffer = await audioEngine.decodeBlobToBuffer(blob);
      const meta: AudioClip = { id: uuidv4(), name: `sfx: ${sfxPrompt.slice(0, 18)}`, durationSec: buffer.duration, color: '#34d399', sourceType: 'generated' };
      onAddGeneratedClip(meta, buffer);
    }
    finally { setIsBusy(false); }
  };

  const handleTts = async () =>
  {
    const text = ttsText.trim();
    if (!text)
    {
      return;
    }
    setIsBusy(true);
    try
    {
      const response = await fetch('http://musai-api:9000/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok)
      {
        throw new Error(`TTS request failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const buffer = await audioEngine.decodeBlobToBuffer(blob);
      const meta: AudioClip = { id: uuidv4(), name: `voice: ${text.slice(0, 18)}`, durationSec: buffer.duration, color: '#f59e0b', sourceType: 'tts' };
      onAddGeneratedClip(meta, buffer);
    }
    catch (error)
    {
      console.warn('Piper TTS failed', error);
    }
    finally
    {
      setIsBusy(false);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-card space-y-3">
      <h3 className="font-semibold">Generators</h3>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Music Loop</label>
        <input className="w-full px-2 py-1 rounded border bg-background" value={musicPrompt} onChange={(e) => setMusicPrompt(e.target.value)} />
        <Button size="sm" onClick={handleGenerateMusic} disabled={isBusy}>Generate Music (AudioCraft)</Button>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">SFX Loop</label>
        <input className="w-full px-2 py-1 rounded border bg-background" value={sfxPrompt} onChange={(e) => setSfxPrompt(e.target.value)} />
        <Button size="sm" variant="outline" onClick={handleGenerateSfx} disabled={isBusy}>Generate SFX (SoundCraft)</Button>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Text to Speech</label>
        <textarea className="w-full px-2 py-1 rounded border bg-background" rows={3} value={ttsText} onChange={(e) => setTtsText(e.target.value)} />
        <Button size="sm" variant="secondary" onClick={handleTts} disabled={isBusy}>Synthesize Voice (Piper)</Button>
      </div>
    </div>
  );
};

export default StudioGenerators;

