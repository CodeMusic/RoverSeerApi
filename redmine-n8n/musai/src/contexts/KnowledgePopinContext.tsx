import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type PopinLink =
{
  label: string;
  href: string;
};

export type KnowledgePopinContent =
{
  title: string;
  body: React.ReactNode;
  links?: PopinLink[];
};

type KnowledgePopinContextType =
{
  isOpen: boolean;
  content: KnowledgePopinContent | null;
  open: (content: KnowledgePopinContent) => void;
  close: () => void;
};

const KnowledgePopinContext = createContext<KnowledgePopinContextType | undefined>(undefined);

export function KnowledgePopinProvider({ children }: { children: React.ReactNode })
{
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [content, setContent] = useState<KnowledgePopinContent | null>(null);

  const open = useCallback((next: KnowledgePopinContent) =>
  {
    setContent(next);
    setIsOpen(true);
  }, []);

  const close = useCallback(() =>
  {
    setIsOpen(false);
    setTimeout(() => setContent(null), 250);
  }, []);

  const value = useMemo<KnowledgePopinContextType>(() => ({ isOpen, content, open, close }), [isOpen, content, open, close]);

  return (
    <KnowledgePopinContext.Provider value={value}>
      {children}
    </KnowledgePopinContext.Provider>
  );
}

export function useKnowledgePopin(): KnowledgePopinContextType
{
  const ctx = useContext(KnowledgePopinContext);
  if (!ctx)
  {
    throw new Error('useKnowledgePopin must be used within a KnowledgePopinProvider');
  }
  return ctx;
}


