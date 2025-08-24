import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Play, Maximize2, MessageSquare, Code, Sparkles } from 'lucide-react';
import { executeJavaScript, executeHTML, executeCSS, executeMarkdown, executeJSON } from '@/utils/codeExecutor';
import { executeSQL } from '@/utils/sqlExecutor';
import { executePython } from '@/utils/pythonExecutor';
import { executeRuby } from '@/utils/rubyExecutor';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CodeMusaiCompilerProps {
  code: string;
  language: string;
  isVisible: boolean;
  onClose: () => void;
  onOpenPlayground: () => void;
  position?: { x: number; y: number };
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

const CodeMusaiCompiler: React.FC<CodeMusaiCompilerProps> = ({
  code,
  language,
  isVisible,
  onClose,
  onOpenPlayground,
  position = { x: 0, y: 0 }
}) => {
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const { toast } = useToast();
  const iframeRef = useRef<HTMLDivElement>(null);
  const compilerRef = useRef<HTMLDivElement>(null);

  const normalizedLang = language.toLowerCase();
  const monacoLang = languageMap[normalizedLang] || normalizedLang;
  const canRunInBrowser = ['javascript', 'typescript', 'html', 'css', 'markdown', 'json', 'sql', 'python', 'ruby'].includes(monacoLang);

  useEffect(() => {
    if (isVisible) {
      setOutput('');
      setExecutionTime(0);
    }
  }, [isVisible, code]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (compilerRef.current && !compilerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const handleRun = async () => {
    if (!canRunInBrowser) {
      toast({
        description: `${monacoLang} code cannot be executed in browser`,
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const startTime = performance.now();

    try {
      if (monacoLang === 'html') {
        if (iframeRef.current) {
          const iframe = executeHTML(code);
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
          setOutput('HTML rendered successfully');
        }
      } else if (monacoLang === 'css') {
        if (iframeRef.current) {
          const iframe = executeCSS(code);
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
          setOutput('CSS applied in preview');
        }
      } else if (monacoLang === 'markdown') {
        if (iframeRef.current) {
          const iframe = await executeMarkdown(code);
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
          setOutput('Markdown rendered successfully');
        }
      } else if (monacoLang === 'json') {
        const { result, error } = executeJSON(code);
        setOutput(result || (error ? `Error: ${error}` : ''));
      } else if (monacoLang === 'sql') {
        const res = await executeSQL({ query: code });
        if (res.error) {
          setOutput(`Error: ${res.error}`);
        } else {
          const header = (res.columns || []).join('\t');
          const lines = (res.rows || []).map(r => r.map(v => v === null ? 'NULL' : String(v)).join('\t'));
          setOutput([header, ...lines].join('\n'));
        }
      } else if (monacoLang === 'python') {
        const res = await executePython({ code });
        if (res.error) {
          setOutput([res.stdout, res.stderr, `Error: ${res.error}`].filter(Boolean).join('\n'));
        } else {
          setOutput([res.stdout, res.stderr].filter(Boolean).join('\n'));
        }
      } else if (monacoLang === 'ruby') {
        const res = await executeRuby({ code });
        if (res.error) {
          setOutput([res.stdout, `Error: ${res.error}`].filter(Boolean).join('\n'));
        } else {
          setOutput(res.stdout || '');
        }
      } else {
        // Treat TypeScript as JavaScript (types stripped in executor)
        const { result, error, logs = [] } = await executeJavaScript(code);
        const outputText = [
          ...(logs.length > 0 ? logs : []),
          ...(result !== undefined ? [result] : []),
          ...(error ? [`Error: ${error}`] : [])
        ].join('\n');
        
        setOutput(outputText);
        
        if (error) {
          toast({
            description: "Execution failed",
            variant: "destructive",
          });
        } else {
          toast({
            description: "Code executed successfully",
          });
        }
      }
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast({
        description: "Failed to execute code",
        variant: "destructive",
      });
    } finally {
      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setIsRunning(false);
    }
  };

  const handleOpenPlayground = () => {
    // Store intent to merge code when opening the full playground
    localStorage.setItem('playground-code', code);
    localStorage.setItem('playground-language', monacoLang);
    localStorage.setItem('playground-merge-strategy', 'comment-and-prepend');
    onOpenPlayground();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={compilerRef}
      className="fixed z-50 compiler-thought-bubble"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Card className="w-96 max-h-[80vh] shadow-2xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
        <CardHeader className="pb-3 border-b border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-300" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                CodeMusai's Compiler
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {monacoLang.toUpperCase()}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Code Preview
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleOpenPlayground}
                >
                  <Maximize2 className="h-3 w-3 mr-1" />
                  Full Playground
                </Button>
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs font-mono max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{code}</pre>
            </div>
          </div>

          {/* Run Button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleRun}
              disabled={!canRunInBrowser || isRunning}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              {isRunning ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
            {executionTime > 0 && (
              <Badge variant="outline" className="text-xs">
                {executionTime.toFixed(2)}ms
              </Badge>
            )}
          </div>

          {/* Output */}
          {output && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Output
              </span>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs font-mono max-h-32 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
          )}

          {/* HTML Output */}
          {monacoLang === 'html' && iframeRef.current && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                HTML Preview
              </span>
              <div 
                ref={iframeRef}
                className="border border-gray-300 dark:border-gray-600 rounded-md h-32 overflow-hidden"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleOpenPlayground}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Chat with AI
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleOpenPlayground}
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Full Playground
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeMusaiCompiler; 