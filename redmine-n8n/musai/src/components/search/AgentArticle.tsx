import React from 'react';

interface AgentArticleProps {
  html: string;
}

// Renders trusted agent-supplied article HTML with newspaper-style formatting
export const AgentArticle: React.FC<AgentArticleProps> = ({ html }) =>
{
  return (
    <div className="agent-article">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default AgentArticle;


