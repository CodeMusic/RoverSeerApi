import React from 'react';
import { useKnowledgePopin } from '@/contexts/KnowledgePopinContext';
import { X } from 'lucide-react';

export function KnowledgePopin()
{
  const { isOpen, content, close } = useKnowledgePopin();

  return (
    <div
      aria-hidden={!isOpen}
      className={
        isOpen
          ? 'fixed inset-0 z-[1000] flex items-center justify-center'
          : 'pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center opacity-0'
      }
    >
      {/* Blur layer */}
      <div
        className={
          isOpen
            ? 'absolute inset-0 backdrop-blur-sm bg-background/40 transition-opacity duration-200'
            : 'absolute inset-0 backdrop-blur-0 bg-transparent transition-all duration-200'
        }
        onClick={close}
      />

      {/* Panel */}
      <div
        className={
          isOpen
            ? 'relative mx-3 max-w-xl w-full rounded-xl border bg-card/90 backdrop-blur-md shadow-2xl transition-transform duration-200 scale-100'
            : 'relative mx-3 max-w-xl w-full rounded-xl border bg-card/90 backdrop-blur-md shadow-2xl transition-transform duration-200 scale-95'
        }
      >
        <button
          aria-label="Close"
          className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
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
              <div className="mt-3">
                {content.links.map((lnk) => (
                  <a
                    key={lnk.href}
                    href={lnk.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline text-sm block"
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


