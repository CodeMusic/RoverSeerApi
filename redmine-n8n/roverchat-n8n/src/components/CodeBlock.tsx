import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Copy, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeMusaiCompiler from './code/CodeMusaiCompiler';

interface CodeBlockProps {
  language: string;
  children: string;
}

// Map common language names to Monaco editor language IDs
const languageMap: { [key: string]: string } = {
  js: 'javascript',
  javascript: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  python: 'python',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'csharp',
  cs: 'csharp',
  go: 'go',
  rust: 'rust',
  rs: 'rust',
  ruby: 'ruby',
  rb: 'ruby',
  php: 'php',
  sql: 'sql',
  html: 'html',
  css: 'css',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  terraform: 'hcl',
  tf: 'hcl',
  bicep: 'bicep',
  powershell: 'powershell',
  ps1: 'powershell',
  shell: 'shell',
  bash: 'shell',
  sh: 'shell',
};

export const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const codeText = children.replace(/\n$/, '');
  const [compilerVisible, setCompilerVisible] = useState(false);
  const [compilerPosition, setCompilerPosition] = useState({ x: 0, y: 0 });
  const playButtonRef = useRef<HTMLButtonElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      toast({
        description: "Code copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast({
        description: "Failed to copy code",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handlePlayCode = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCompilerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setCompilerVisible(true);
  };

  const handleCopyToPlayground = () => {
    localStorage.setItem('playground-code', codeText);
    // Map the language to Monaco editor format
    const normalizedLang = language.toLowerCase();
    const monacoLang = languageMap[normalizedLang] || normalizedLang;
    
    if (monacoLang) {
      localStorage.setItem('playground-language', monacoLang);
    }
    
    navigate('/code-musai');
    toast({
      description: "Code copied to CodeMusai's Playground",
      duration: 2000,
    });
  };

  const handleOpenPlayground = () => {
    setCompilerVisible(false);
    handleCopyToPlayground();
  };

  return (
    <div className="relative my-6 group rounded-xl overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl border border-slate-200 dark:border-slate-800 code-block-hover">
      <div className="absolute top-0 right-0 flex items-center gap-2 m-2 z-10">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 opacity-100 group-hover:opacity-0 transition-opacity">
          {language.toUpperCase()}
        </span>
        <Button
          ref={playButtonRef}
          variant="ghost"
          size="icon"
          className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-slate-200/80 dark:hover:bg-slate-700/80 play-button-pulse"
          onClick={handlePlayCode}
        >
          <PlayCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="rounded-xl !mt-0 !mb-0 shadow-inner text-left"
        customStyle={{
          margin: 0,
          borderRadius: '0.75rem',
          background: 'rgba(15, 23, 42, 0.95)',
        }}
      >
        {codeText}
      </SyntaxHighlighter>
      
      {/* CodeMusai's Compiler */}
      <CodeMusaiCompiler
        code={codeText}
        language={language}
        isVisible={compilerVisible}
        onClose={() => setCompilerVisible(false)}
        onOpenPlayground={handleOpenPlayground}
        position={compilerPosition}
      />
    </div>
  );
};