import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AudioClip } from '@/types/studio';

interface StudioLibraryProps
{
  clips: AudioClip[];
  onUploadFiles: (files: FileList) => void;
}

export const StudioLibrary: React.FC<StudioLibraryProps> = ({ clips, onUploadFiles }) =>
{
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBrowse = () =>
  {
    fileInputRef.current?.click();
  };

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Library</h3>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) onUploadFiles(e.target.files); }}
          />
          <Button size="sm" onClick={handleBrowse}>Add Audio</Button>
        </div>
      </div>
      <div className="space-y-1 max-h-64 overflow-auto pr-1">
        {clips.length === 0 && (
          <div className="text-sm text-muted-foreground">No clips yet. Upload audio to get started.</div>
        )}
        {clips.map(clip => (
          <div
            key={clip.id}
            className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-accent cursor-grab"
            draggable
            onDragStart={(e) =>
            {
              e.dataTransfer.setData('text/clip-id', clip.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: clip.color }} />
              <span className="font-medium">{clip.name}</span>
            </div>
            <div className="text-muted-foreground tabular-nums">{clip.durationSec.toFixed(2)}s</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudioLibrary;


