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
      {/* Soft dim + backdrop blur for cohesion */}
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-sm md:backdrop-blur',
          isEnter ? 'animate-musai-flourish-dim-enter' : 'animate-musai-flourish-dim-leave'
        )}
        style={{ background: 'linear-gradient(180deg, rgba(17,24,39,0.35), rgba(17,24,39,0.55))' }}
      />

      {/* Diagonal sheen sweep (the flourish) */}
      <div
        className={cn(
          'absolute -inset-x-1/2 inset-y-0',
          'rotate-12',
          isEnter ? 'animate-musai-flourish-sheen-enter' : 'animate-musai-flourish-sheen-leave'
        )}
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(168,85,247,0.04) 35%, rgba(99,102,241,0.10) 50%, rgba(168,85,247,0.04) 65%, rgba(255,255,255,0.00) 100%)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Subtle edge vignette to frame the transition */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 110%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 60%), radial-gradient(120% 80% at 50% -10%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 60%)'
        }}
      />
    </div>
  );
};

export default PortalEffect;


