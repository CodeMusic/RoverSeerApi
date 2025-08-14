import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AudioClip, TimelineClip } from '@/types/studio';

interface StudioTimelineProps
{
  numTracks: number;
  clips: AudioClip[];
  timelineClips: TimelineClip[];
  pxPerSecond?: number;
  onAddClip: (clipId: string, trackIndex: number, startTimeSec: number) => void;
  onMoveClip: (clipId: string, timelineClipId: string, trackIndex: number, startTimeSec: number) => void;
  onRemoveClip: (timelineClipId: string) => void;
  onPlay: () => void;
  onStop: () => void;
  onExport: () => void;
}

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  numTracks,
  clips,
  timelineClips,
  pxPerSecond = 100,
  onAddClip,
  onMoveClip,
  onRemoveClip,
  onPlay,
  onStop,
  onExport,
}) =>
{
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const durationSec = useMemo(() =>
  {
    const byId = new Map(clips.map(c => [c.id, c]));
    let max = 16;
    timelineClips.forEach(tc =>
    {
      const meta = byId.get(tc.clipId);
      if (!meta) return;
      const end = tc.startTimeSec + meta.durationSec;
      if (end > max) max = end;
    });
    return Math.ceil(max + 1);
  }, [clips, timelineClips]);

  const timeToX = (tSec: number) => tSec * pxPerSecond;
  const xToTime = (x: number) => Math.max(0, x / pxPerSecond);

  const handleDrop = (e: React.DragEvent, trackIndex: number) =>
  {
    e.preventDefault();
    const clipId = e.dataTransfer.getData('text/clip-id');
    const timelineClipId = e.dataTransfer.getData('text/timeline-clip-id');
    if (!clipId) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (bounds?.left || 0);
    const t = xToTime(x);
    if (timelineClipId)
    {
      onMoveClip(clipId, timelineClipId, trackIndex, t);
    }
    else
    {
      onAddClip(clipId, trackIndex, t);
    }
  };

  const handlePlay = useCallback(() =>
  {
    setIsPlaying(true);
    onPlay();
  }, [onPlay]);

  const handleStop = useCallback(() =>
  {
    setIsPlaying(false);
    onStop();
  }, [onStop]);

  const gridCols = Math.ceil(durationSec);
  const tracks = Array.from({ length: numTracks }, (_, i) => i);
  const clipMetaById = useMemo(() => new Map(clips.map(c => [c.id, c])), [clips]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex gap-2">
          {!isPlaying ? (
            <Button size="sm" onClick={handlePlay}>Play</Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={handleStop}>Stop</Button>
          )}
          <Button size="sm" variant="outline" onClick={onExport}>Export WAV</Button>
        </div>
        <div className="text-xs text-muted-foreground">{numTracks} tracks • {durationSec}s • {pxPerSecond}px/s</div>
      </div>

      <div className="relative">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
          <div className="grid" style={{ gridTemplateColumns: `40px repeat(${gridCols}, ${pxPerSecond}px)` }}>
            <div className="text-xs p-1 text-muted-foreground">t</div>
            {Array.from({ length: gridCols }, (_, i) => (
              <div key={i} className="text-[10px] text-muted-foreground p-1 border-l">
                {i}s
              </div>
            ))}
          </div>
        </div>

        <div ref={containerRef} className="overflow-auto">
          {tracks.map(trackIndex => (
            <div
              key={trackIndex}
              className="grid relative h-16 border-b"
              style={{ gridTemplateColumns: `40px repeat(${gridCols}, ${pxPerSecond}px)` }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, trackIndex)}
            >
              <div className="text-xs text-muted-foreground p-1 flex items-start">{trackIndex + 1}</div>
              <div className="col-span-full relative">
                {/* timeline cells */}
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${gridCols}, ${pxPerSecond}px)` }}>
                  {Array.from({ length: gridCols }, (_, i) => (
                    <div key={i} className="border-l border-dashed" />
                  ))}
                </div>

                {/* clips on this track */}
                {timelineClips.filter(tc => tc.trackIndex === trackIndex).map(tc =>
                {
                  const meta = clipMetaById.get(tc.clipId);
                  if (!meta) return null;
                  const left = timeToX(tc.startTimeSec);
                  const width = Math.max(8, timeToX(meta.durationSec));
                  return (
                    <div
                      key={tc.id}
                      className="absolute top-2 h-12 rounded text-xs text-white flex items-center px-2 cursor-grab"
                      style={{ left, width, backgroundColor: meta.color }}
                      draggable
                      onDragStart={(e) =>
                      {
                        e.dataTransfer.setData('text/timeline-clip-id', tc.id);
                        e.dataTransfer.setData('text/clip-id', meta.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDoubleClick={() => onRemoveClip(tc.id)}
                    >
                      <span className="truncate">{meta.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudioTimeline;


