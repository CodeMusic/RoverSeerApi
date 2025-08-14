import { v4 as uuidv4 } from 'uuid';
import { AudioClip, TimelineClip } from '@/types/studio';

/**
 * AudioEngine — minimal WebAudio mixer for Musai Studio
 * - Decodes uploads to AudioBuffer
 * - Plays multi-track timelines
 * - Renders mixdown via OfflineAudioContext and returns a WAV Blob
 */
export class AudioEngine
{
  private audioContext: AudioContext | null;
  private activeSources: Array<{ id: string; source: AudioBufferSourceNode; gain: GainNode }>; 

  constructor()
  {
    this.audioContext = null;
    this.activeSources = [];
  }

  private ensureContext(): AudioContext
  {
    if (!this.audioContext)
    {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  async decodeFileToBuffer(file: File): Promise<AudioBuffer>
  {
    const ctx = this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  }

  async decodeBlobToBuffer(blob: Blob): Promise<AudioBuffer>
  {
    const ctx = this.ensureContext();
    const arrayBuffer = await blob.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  }

  async createClipFromFile(file: File): Promise<{ meta: AudioClip; buffer: AudioBuffer }>
  {
    const buffer = await this.decodeFileToBuffer(file);
    const meta: AudioClip = {
      id: uuidv4(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      durationSec: buffer.duration,
      sourceType: 'upload',
      color: pickColor(),
    };
    return { meta, buffer };
  }

  stop()
  {
    this.activeSources.forEach(({ source }) =>
    {
      try { source.stop(); } catch {}
    });
    this.activeSources = [];
  }

  play(timelineClips: TimelineClip[], clipsById: Map<string, { meta: AudioClip; buffer: AudioBuffer }>, whenSec = 0)
  {
    const ctx = this.ensureContext();
    this.stop();
    const now = ctx.currentTime + 0.05; // small scheduling offset

    timelineClips.forEach((tlc) =>
    {
      const clip = clipsById.get(tlc.clipId);
      if (!clip) return;

      const source = ctx.createBufferSource();
      source.buffer = clip.buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = tlc.gain;
      source.connect(gainNode).connect(ctx.destination);

      const startAt = now + Math.max(0, tlc.startTimeSec - whenSec);
      try
      {
        source.start(startAt);
        this.activeSources.push({ id: tlc.id, source, gain: gainNode });
      }
      catch {}
    });
  }

  async renderMixdownToWav(timelineClips: TimelineClip[], clipsById: Map<string, { meta: AudioClip; buffer: AudioBuffer }>, sampleRate = 44100): Promise<Blob>
  {
    // Determine total length
    let totalDuration = 0;
    timelineClips.forEach((tlc) =>
    {
      const clip = clipsById.get(tlc.clipId);
      if (!clip) return;
      const end = tlc.startTimeSec + clip.buffer.duration;
      if (end > totalDuration) totalDuration = end;
    });
    const length = Math.max(1, Math.ceil(totalDuration * sampleRate));

    const offline = new OfflineAudioContext({ numberOfChannels: 2, length, sampleRate });

    timelineClips.forEach((tlc) =>
    {
      const clip = clipsById.get(tlc.clipId);
      if (!clip) return;

      const source = offline.createBufferSource();
      source.buffer = toStereoBuffer(offline, clip.buffer);
      const gainNode = offline.createGain();
      gainNode.gain.value = tlc.gain;
      source.connect(gainNode).connect(offline.destination);
      try { source.start(tlc.startTimeSec); } catch {}
    });

    const rendered = await offline.startRendering();
    const wav = encodeAudioBufferToWav(rendered);
    return new Blob([wav], { type: 'audio/wav' });
  }
}

function toStereoBuffer(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer
{
  if (buffer.numberOfChannels === 2)
  {
    return buffer;
  }
  const stereo = ctx.createBuffer(2, buffer.length, buffer.sampleRate);
  const monoData = buffer.getChannelData(0);
  stereo.getChannelData(0).set(monoData);
  stereo.getChannelData(1).set(monoData);
  return stereo;
}

function floatTo16BitPCM(input: Float32Array): Int16Array
{
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++)
  {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function interleave(left: Float32Array, right: Float32Array): Float32Array
{
  const length = left.length + right.length;
  const interleaved = new Float32Array(length);
  let index = 0;
  for (let i = 0; i < left.length; i++)
  {
    interleaved[index++] = left[i];
    interleaved[index++] = right[i];
  }
  return interleaved;
}

function encodeAudioBufferToWav(buffer: AudioBuffer): ArrayBuffer
{
  const numChannels = 2;
  const sampleRate = buffer.sampleRate;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const interleaved = interleave(left, right);
  const pcm16 = floatTo16BitPCM(interleaved);

  const headerSize = 44;
  const dataSize = pcm16.byteLength;
  const totalSize = headerSize + dataSize;
  const bufferArray = new ArrayBuffer(totalSize);
  const view = new DataView(bufferArray);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  new Int16Array(bufferArray, headerSize).set(pcm16);
  return bufferArray;
}

function writeString(view: DataView, offset: number, str: string)
{
  for (let i = 0; i < str.length; i++)
  {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

const PALETTE = ['#60a5fa', '#f59e0b', '#34d399', '#f472b6', '#a78bfa', '#f87171', '#22d3ee', '#fb7185'];
function pickColor(): string
{
  const index = Math.floor(Math.random() * PALETTE.length);
  return PALETTE[index];
}

export default new AudioEngine();


