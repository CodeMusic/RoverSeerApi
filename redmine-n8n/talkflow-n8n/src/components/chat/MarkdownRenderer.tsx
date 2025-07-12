import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './CodeBlock';
import { LaTeXBlock } from './LaTeXBlock';
import 'katex/dist/katex.min.css';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const components: Components = {
    code({ node, inline, className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <CodeBlock language={language}>
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        );
      }
      
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre({ children }) {
      return <>{children}</>;
    },
    // Custom components for math rendering
    // @ts-ignore - math components are added by remark-math but not typed
    math: ({ value }) => <LaTeXBlock content={value} />,
    // @ts-ignore - math components are added by remark-math but not typed
    inlineMath: ({ value }) => <LaTeXBlock content={value} inline />,
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
      className="prose dark:prose-invert max-w-none"
    >
      {content}
    </ReactMarkdown>
  );
};