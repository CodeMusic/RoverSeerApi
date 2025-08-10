import React from 'react';
import { Brain, Wand2, GitMerge, Cloud, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type CognitiveStageState = 'pending' | 'running' | 'complete' | 'skipped';

export interface CognitiveThinkingStripProps
{
  logicalState?: CognitiveStageState;
  creativeState?: CognitiveStageState;
  fusionState?: CognitiveStageState;
  cloudState?: CognitiveStageState;
  className?: string;
}

const stageLabelFor = (state: CognitiveStageState | undefined): string =>
{
  if (!state)
  {
    return 'pending';
  }
  return state;
};

const StagePill: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  state: CognitiveStageState;
  accentClass: string;
}> = ({ icon: Icon, title, subtitle, state, accentClass }) =>
{
  const isRunning = state === 'running';
  const isComplete = state === 'complete';
  const isSkipped = state === 'skipped';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2 bg-card',
        isRunning && 'ring-2 ring-primary/40 border-primary/40',
        isComplete && 'border-emerald-500/30',
        isSkipped && 'opacity-50'
      )}
    >
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', accentClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <div className="text-xs font-semibold leading-tight">{title}</div>
        <div className="text-[10px] text-muted-foreground leading-tight">{subtitle}</div>
      </div>
      <div className="ml-auto">
        <Badge variant={isComplete ? 'default' : isRunning ? 'secondary' : 'outline'}>
          {stageLabelFor(state)}
        </Badge>
      </div>
    </div>
  );
};

export const CognitiveThinkingStrip: React.FC<CognitiveThinkingStripProps> = ({
  logicalState = 'running',
  creativeState = 'pending',
  fusionState = 'pending',
  cloudState = 'pending',
  className
}) =>
{
  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <StagePill
          icon={Brain}
          title="Logical Mind"
          subtitle="depth-first analysis"
          state={logicalState}
          accentClass="bg-primary/10 text-primary"
        />
        <div className="text-xs text-muted-foreground">→</div>
        <StagePill
          icon={Wand2}
          title="Creative Mind"
          subtitle="breadth-first ideation"
          state={creativeState}
          accentClass="bg-purple-500/10 text-purple-500"
        />
        <div className="text-xs text-muted-foreground">→</div>
        <StagePill
          icon={GitMerge}
          title="Musai Fusion"
          subtitle="synthesis + trade-offs"
          state={fusionState}
          accentClass="bg-emerald-500/10 text-emerald-600"
        />
        <div className="text-xs text-muted-foreground">→</div>
        <StagePill
          icon={Cloud}
          title="Cloud Assist"
          subtitle="optional hybrid"
          state={cloudState}
          accentClass="bg-sky-500/10 text-sky-600"
        />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <ShieldCheck className="w-3 h-3" />
        <span>Local bicameral thinking by default. Cloud is opt-in and scoped.</span>
      </div>
    </div>
  );
};

export default CognitiveThinkingStrip;


