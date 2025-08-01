import React from 'react';
import CodeMusaiPlayground from '@/components/code/CodeMusaiPlayground';
import { useNavigate } from 'react-router-dom';

const Playground = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">CodeMusai's Playground</h1>
          <p className="text-muted-foreground mt-2">AI-assisted code development environment</p>
        </div>
        <CodeMusaiPlayground onClose={() => navigate('/')} />
      </div>
    </div>
  );
};

export default Playground;