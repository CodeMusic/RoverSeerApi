import React from 'react';
import { cn } from '@/lib/utils';

interface InfoPageSurfaceProps
{
  className?: string;
  auraClassName?: string;
  children: React.ReactNode;
}

/**
 * A rounded, soft-card surface used to frame informational pages.
 * Adds gentle aura, border, and backdrop blur for a cohesive, polished feel.
 */
export function InfoPageSurface(props: InfoPageSurfaceProps): JSX.Element
{
  const { className, auraClassName, children } = props;

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'pointer-events-none absolute -inset-4 rounded-2xl',
          'bg-gradient-to-tr from-foreground/10 via-muted-foreground/5 to-transparent blur-2xl',
          auraClassName
        )}
      />
      <div className="relative rounded-2xl border bg-card/70 backdrop-blur shadow-sm">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default InfoPageSurface;


