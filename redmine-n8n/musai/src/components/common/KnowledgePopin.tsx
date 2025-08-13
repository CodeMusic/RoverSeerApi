import React from 'react';
import { useKnowledgePopin } from '@/contexts/KnowledgePopinContext';
import { X } from 'lucide-react';

export function KnowledgePopin()
{
  const { isOpen, content, close } = useKnowledgePopin();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      className={
        isOpen
          ? 'fixed inset-0 z-[1000] flex items-center justify-center'
          : 'pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center opacity-0'
      }
    >
      {/* Foggy glass outside the panel */}
      <div
        className={
          isOpen
            ? 'absolute inset-0 transition-opacity duration-200 supports-[backdrop-filter]:backdrop-blur-md bg-background/55'
            : 'absolute inset-0 transition-all duration-200 supports-[backdrop-filter]:backdrop-blur-0 bg-transparent'
        }
        onClick={close}
      />

      {/* Subtle vignette to focus attention */}
      <div
        className={
          isOpen
            ? 'pointer-events-none absolute inset-0 from-black/5 to-transparent bg-radial [--tw-gradient-from-position:50%_50%] [--tw-gradient-to-position:100%_100%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-from),var(--tw-gradient-to))]'
            : 'hidden'
        }
      />

      {/* Panel (theme-native colors) */}
      <div
        className={
          isOpen
            ? 'relative mx-3 max-w-xl w-full rounded-2xl md:rounded-3xl border bg-card text-foreground shadow-2xl ring-1 ring-border/40 transition-transform duration-200 scale-100'
            : 'relative mx-3 max-w-xl w-full rounded-2xl md:rounded-3xl border bg-card text-foreground shadow-2xl ring-1 ring-border/40 transition-transform duration-200 scale-95'
        }
      >
        <button
          aria-label="Close"
          className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-foreground/80"
          onClick={close}
        >
          <X className="w-5 h-5" />
        </button>

        {content && (
          <div className="p-5">
            <div className="text-lg font-semibold mb-1">{content.title}</div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {content.body}
            </div>
            {Array.isArray(content.links) && content.links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {content.links.map((lnk) => (
                  <a
                    key={lnk.href}
                    href={lnk.href}
                    target={lnk.href.startsWith('/') ? '_self' : '_blank'}
                    rel={lnk.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border bg-background hover:bg-muted transition-colors"
                  >
                    {lnk.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgePopin;


