import React from 'react';
import { useKnowledgePopin } from '@/contexts/KnowledgePopinContext';

type KnowledgeKey = 'cfm' | 'awareness-first';

const KNOWLEDGE_CONTENT: Record<KnowledgeKey, { title: string; body: React.ReactNode; links: { label: string; href: string }[] }> = {
  'cfm': {
    title: 'Contextual Feedback Model (CFM)',
    body: (
      <>
        <p>
          A cognitive architecture framing cognition as a loop between content (inputs, thoughts) and context (memory, emotional tone).
          Meaning and behavior emerge as context shapes content and—through feedback—content reshapes context.
        </p>
      </>
    ),
    links: [
      { label: 'Read more (CFM – July 2025 Edition)', href: 'https://blog.codemusic.ca/2025/07/24/the-contextual-feedback-model-cfm-july-2025-edition' },
    ]
  },
  'awareness-first': {
    title: 'Awareness‑First Model',
    body: (
      <>
        <p>
          A philosophical‑scientific proposal that treats awareness—not matter—as the fundamental substrate, explaining coherence and emergence via feedback.
          In practice, it complements CFM by centering noticing as the initiating force for change.
        </p>
      </>
    ),
    links: [
      { label: 'Read more (Awareness‑First Model)', href: 'https://blog.codemusic.ca/2025/08/07/the-awareness-first-model/' },
    ]
  }
};

export function KnowledgeTerm({ k, children }: { k: KnowledgeKey; children?: React.ReactNode })
{
  const { open } = useKnowledgePopin();
  const onClick = (e: React.MouseEvent) =>
  {
    e.preventDefault();
    open(KNOWLEDGE_CONTENT[k]);
  };
  return (
    <button
      className="underline decoration-dotted underline-offset-2 hover:text-primary"
      onClick={onClick}
      aria-label={`Open info for ${KNOWLEDGE_CONTENT[k].title}`}
    >
      {children}
    </button>
  );
}

export default KnowledgeTerm;


