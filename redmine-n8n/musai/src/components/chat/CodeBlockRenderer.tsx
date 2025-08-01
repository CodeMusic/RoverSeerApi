import React from 'react';
import { CodeBlock } from './CodeBlock';
import ReactDOM from 'react-dom';

interface CodeBlockRendererProps {
  container: Element;
}

export const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({ container }) => {
  React.useEffect(() => {
    const codeBlocks = container.querySelectorAll('.code-block-placeholder');
    
    const renderCodeBlock = (node: HTMLElement) => {
      const language = node.getAttribute('data-language') || '';
      const code = decodeURIComponent(node.getAttribute('data-code') || '');
      return <CodeBlock language={language}>{code}</CodeBlock>;
    };

    codeBlocks.forEach((block) => {
      if (block instanceof HTMLElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode?.replaceChild(wrapper, block);
        ReactDOM.render(renderCodeBlock(block), wrapper);
      }
    });

    return () => {
      const wrappers = container.querySelectorAll('.code-block-wrapper');
      wrappers.forEach((wrapper) => {
        ReactDOM.unmountComponentAtNode(wrapper);
      });
    };
  }, [container]);

  return null;
};