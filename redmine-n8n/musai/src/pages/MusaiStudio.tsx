import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '@/components/common/BaseLayout';
import { StudioLibrary } from '@/components/studio/StudioLibrary';
import { StudioTimeline } from '@/components/studio/StudioTimeline';
import { StudioGenerators } from '@/components/studio/StudioGenerators';
import audioEngine from '@/lib/audio/AudioEngine';
import { AudioClip, TimelineClip } from '@/types/studio';
import { ROUTES } from '@/config/routes';
import { MusaiCopilotSummon } from '@/components/common/MusaiCopilotSummon';

const MusaiStudio: React.FC = () =>
{
  const navigate = useNavigate();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [buffersById, setBuffersById] = useState<Map<string, AudioBuffer>>(new Map());
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
  const [numTracks, setNumTracks] = useState<number>(4);

  const clipsMap = useMemo(() =>
  {
    const map = new Map<string, { meta: AudioClip; buffer: AudioBuffer }>();
    clips.forEach((meta) =>
    {
      const buf = buffersById.get(meta.id);
      if (buf) map.set(meta.id, { meta, buffer: buf });
    });
    return map;
  }, [clips, buffersById]);

  const handleUpload = async (files: FileList) =>
  {
    const entries: Array<{ meta: AudioClip; buffer: AudioBuffer }> = [];
    for (const file of Array.from(files))
    {
      try
      {
        const clip = await audioEngine.createClipFromFile(file);
        entries.push(clip);
      }
      catch
      {
        // ignore invalid file
      }
    }
    if (entries.length > 0)
    {
      setClips(prev => [...prev, ...entries.map(e => e.meta)]);
      setBuffersById(prev =>
      {
        const next = new Map(prev);
        entries.forEach(e => next.set(e.meta.id, e.buffer));
        return next;
      });
    }
  };

  const addClipToTimeline = (clipId: string, trackIndex: number, startTimeSec: number) =>
  {
    const id = uuidv4();
    const tlc: TimelineClip = { id, clipId, trackIndex, startTimeSec, gain: 1 };
    setTimelineClips(prev => [...prev, tlc]);
  };

  const moveClipOnTimeline = (clipId: string, timelineClipId: string, trackIndex: number, startTimeSec: number) =>
  {
    setTimelineClips(prev => prev.map(tc => tc.id === timelineClipId ? { ...tc, trackIndex, startTimeSec } : tc));
  };

  const removeClipFromTimeline = (timelineClipId: string) =>
  {
    setTimelineClips(prev => prev.filter(tc => tc.id !== timelineClipId));
  };

  const handlePlay = () =>
  {
    audioEngine.play(timelineClips, clipsMap);
  };

  const handleStop = () =>
  {
    audioEngine.stop();
  };

  const addGeneratedClip = (meta: AudioClip, buffer: AudioBuffer) =>
  {
    setClips(prev => [...prev, meta]);
    setBuffersById(prev =>
    {
      const next = new Map(prev);
      next.set(meta.id, buffer);
      return next;
    });
  };

  const handleExport = async () =>
  {
    const blob = await audioEngine.renderMixdownToWav(timelineClips, clipsMap);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'musai_mixdown.wav';
    a.click();
    URL.revokeObjectURL(url);
  };

	const renderMainContent = () => (
		<div className="relative p-6 md:p-8 lg:p-10 pb-28">
			<div className="container mx-auto max-w-6xl space-y-4">
				<div className="text-center space-y-2">
					<h1 className="text-4xl md:text-5xl font-bold">Musai Studio</h1>
					<p className="text-muted-foreground max-w-3xl mx-auto">
						Library → Timeline → Play → Export. Runs locally. Drop clips, arrange tracks, and ship a cue.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-4">
						<StudioLibrary clips={clips} onUploadFiles={handleUpload} />
						<StudioGenerators onAddGeneratedClip={addGeneratedClip} />
					</div>
					<div className="md:col-span-2">
						<StudioTimeline
							numTracks={numTracks}
							clips={clips}
							timelineClips={timelineClips}
							onAddClip={addClipToTimeline}
							onMoveClip={moveClipOnTimeline}
							onRemoveClip={removeClipFromTimeline}
							onPlay={handlePlay}
							onStop={handleStop}
							onExport={handleExport}
						/>
					</div>
				</div>

				<div className="mt-10 flex justify-center">
					<MusaiCopilotSummon className="w-full max-w-2xl" />
				</div>
			</div>
		</div>
	);

	return (
		<BaseLayout
			currentTab="studio"
			sessions={[]}
			currentSessionId=""
			onNewSession={() => {}}
			onSessionSelect={() => {}}
			onDeleteSession={() => {}}
			onRenameSession={() => {}}
			onToggleFavorite={() => {}}
			renderMainContent={renderMainContent}
			onTabChange={(tab) => {
				navigate(ROUTES.MAIN_APP, { state: { switchToTab: tab } });
			}}
			isNavigationExpanded={isNavigationExpanded}
			onToggleNavigation={() => setIsNavigationExpanded(!isNavigationExpanded)}
		/>
	);
};

export default MusaiStudio;

