export type ClipSourceType = 'upload' | 'generated' | 'tts';

export interface AudioClip
{
  id: string;
  name: string;
  durationSec: number;
  color: string;
  sourceType: ClipSourceType;
}

export interface TimelineClip
{
  id: string;
  clipId: string;
  trackIndex: number;
  startTimeSec: number;
  gain: number;
}

export interface StudioTransport
{
  isPlaying: boolean;
  currentTimeSec: number;
}

export interface WaveformData
{
  peaks: number[];
  sampleRate: number;
  durationSec: number;
}


