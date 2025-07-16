import React from 'react';
import CodePlayground from '@/components/CodePlayground';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Playground = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Code Playground</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
        </div>
        <CodePlayground />
      </div>
    </div>
  );
};

export default Playground;