import React from 'react';

interface StreamingTextProps
{
  content: string;
}

/**
 * StreamingText renders the current assistant text with word-by-word animation.
 * - Every new word fades in smoothly
 * - The latest word also gets a transient red→blue→purple glow
 * - Respects prefers-reduced-motion: only opacity fade is applied
 */
export const StreamingText: React.FC<StreamingTextProps> = ({ content }) =>
{
  const tokens = React.useMemo(() =>
  {
    return content.match(/\S+|\s+/g) || [];
  }, [content]);

  const lastWordIndex = React.useMemo(() =>
  {
    for (let i = tokens.length - 1; i >= 0; i--)
    {
      if (/\S/.test(tokens[i]) && !/^\s+$/.test(tokens[i]))
      {
        return i;
      }
    }
    return -1;
  }, [tokens]);

  return (
    <div className="bg-steel-purple rounded-2xl px-3 py-2 text-gray-900 dark:text-white">
      {tokens.map((t, idx) => {
        const isWhitespace = /^\s+$/.test(t);
        if (isWhitespace)
        {
          return <span key={idx}>{t}</span>;
        }
        const isLatest = idx === lastWordIndex;
        return (
          <span key={idx} className={`word ${isLatest ? 'word-latest' : ''}`}>{t}</span>
        );
      })}
    </div>
  );
};


