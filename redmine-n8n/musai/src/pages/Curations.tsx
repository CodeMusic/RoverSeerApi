import React from 'react';
import { MusaiCurations } from '@/components/curations/MusaiCurations';
import { CurationsLocked } from '@/pages/CurationsLocked';
import { useCurationsApproval } from '@/hooks/useCurationsApproval';
import { useCurationsAvailability } from '@/hooks/useCurationsAvailability';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';

export const Curations: React.FC = () => {
  const { isPublic, requiresApproval, isLoading: approvalLoading } = useCurationsApproval();
  const { isAvailable: contentAvailable, isLoading: contentLoading } = useCurationsAvailability();

  // Show loading state
  if (approvalLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MusaiShimmer>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full animate-pulse" />
            <p className="text-lg text-muted-foreground">Checking curations availability...</p>
          </div>
        </MusaiShimmer>
      </div>
    );
  }

  // No content available at all
  if (!contentAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🌟</span>
          </div>
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">No Curations Yet</h2>
          <p className="text-muted-foreground">
            Musai hasn't generated any curations yet. Check back later as the AI creates emergent content based on user interactions.
          </p>
        </div>
      </div>
    );
  }

  // Content exists but requires approval and isn't public
  if (requiresApproval && !isPublic) {
    return <CurationsLocked />;
  }

  // Show public curations
  return <MusaiCurations isPublicView={true} />;
};