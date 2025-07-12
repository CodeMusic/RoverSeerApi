import React from 'react';

export const getCustomStyles = () => `
  <style>
    /* KaTeX base styles */
    .katex { 
      font-size: 1.1em !important;
      font-family: KaTeX_Main, 'Times New Roman', serif !important;
    }
    
    /* Block LaTeX styles */
    .code-block-latex {
      margin: 1.5rem 0;
      background: rgb(15 23 42 / 0.95);
      border-radius: 0.75rem;
      overflow: hidden;
      border: 1px solid rgb(51 65 85 / 0.5);
    }

    .code-block-header {
      padding: 0.5rem 1rem;
      background: rgb(30 41 59 / 0.95);
      border-bottom: 1px solid rgb(51 65 85 / 0.5);
      color: #e2e8f0;
      font-family: ui-monospace, monospace;
      font-size: 0.875rem;
    }

    .code-block-content {
      padding: 1rem;
      overflow-x: auto;
      color: #e2e8f0;
      font-family: KaTeX_Main, 'Times New Roman', serif;
      font-size: 1.1em;
    }

    /* Inline math styling */
    .katex-inline {
      padding: 0.2em 0.4em;
      margin: 0 0.2em;
      background: rgba(30, 41, 59, 0.05);
      border-radius: 0.25rem;
      display: inline-block;
    }

    .dark .katex-inline {
      background: rgba(255, 255, 255, 0.05);
    }

    /* Dark mode adjustments */
    .dark .katex { color: #e2e8f0; }
    .dark .code-block-latex { background: rgb(15 23 42 / 0.95); }
    .dark .code-block-header { background: rgb(30 41 59 / 0.95); }
  </style>
`;

interface StyleProviderProps {
  children: React.ReactNode;
}

export const StyleProvider: React.FC<StyleProviderProps> = ({ children }) => {
  return (
    <div className="markdown-content">
      {children}
    </div>
  );
};