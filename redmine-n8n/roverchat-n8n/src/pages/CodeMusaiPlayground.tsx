import React from 'react';
import CodeMusaiPlayground from '@/components/code/CodeMusaiPlayground';
import { useNavigate } from 'react-router-dom';

const CodeMusaiPlaygroundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <CodeMusaiPlayground onClose={() => navigate('/')} />
    </div>
  );
};

export default CodeMusaiPlaygroundPage; 