import React from 'react';
import { executeHTML } from '@/utils/codeExecutor';

interface PlaygroundOutputProps {
  language: string;
  output: string;
  code: string;
  iframeRef: React.RefObject<HTMLDivElement>;
  outputRef: React.RefObject<HTMLDivElement>;
}

export const PlaygroundOutput: React.FC<PlaygroundOutputProps> = ({
  language,
  output,
  code,
  iframeRef,
  outputRef
}) => {
  const isIframePreview = language === 'html' || language === 'css' || language === 'markdown';
  return isIframePreview ? (
    <div ref={iframeRef} className="w-full h-full bg-white" />
  ) : (
    <div ref={outputRef} className="w-full h-full p-4 font-mono text-sm overflow-auto bg-black text-white">
      {output}
    </div>
  );
};