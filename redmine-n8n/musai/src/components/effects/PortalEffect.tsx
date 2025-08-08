import React from 'react';
import { cn } from '@/lib/utils';

interface PortalEffectProps {
  phase: 'enter' | 'leave' | 'none';
}

// Lightweight portal transition overlay for page/tab transitions
// Renders an animated radial gradient that expands/contracts
export const PortalEffect: React.FC<PortalEffectProps> = ({ phase }) =>
{
  if (phase === 'none')
  {
    return null;
  }

  const isEnter = phase === 'enter';

  return (
    // Lower z-index so the fixed left NavigationBar (z-50) stays visible
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      {/* Dim backdrop to ensure content is occluded without hiding nav */}
      <div className={cn(
        'absolute inset-0',
        isEnter ? 'animate-musai-portal-dim-enter' : 'animate-musai-portal-dim-leave'
      )} style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.28) 0%, rgba(17,24,39,0.75) 60%, rgba(0,0,0,0.85) 100%)' }} />
      {/* Core portal pulse */}
      <div
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen',
          'bg-gradient-to-br from-cyan-400 via-indigo-400 to-purple-500 opacity-80',
          isEnter ? 'animate-musai-portal-enter' : 'animate-musai-portal-leave'
        )}
        style={{ width: '26rem', height: '26rem' }}
      />
    </div>
  );
};

export default PortalEffect;


