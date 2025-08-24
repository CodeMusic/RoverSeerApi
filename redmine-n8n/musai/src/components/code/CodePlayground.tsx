import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { executeJavaScript, executeHTML, executeCSS, executeMarkdown, executeJSON } from '@/utils/codeExecutor';
import { executeSQL } from '@/utils/sqlExecutor';
import { executePython } from '@/utils/pythonExecutor';
import { executeRuby } from '@/utils/rubyExecutor';
import { useToast } from '@/hooks/use-toast';
import { EditorHeader } from '@/components/playground/EditorHeader';
import { PlaygroundOutput } from '@/components/playground/PlaygroundOutput';
import { usePopoutWindow } from '@/hooks/usePopoutWindow';
import { SUPPORTED_LANGUAGES, getLanguageSample } from '@/components/playground/constants';

interface CodePlaygroundProps {
  defaultLanguage?: string;
  defaultValue?: string;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({
  defaultLanguage = 'javascript',
  defaultValue = '// Write your code here\nconsole.log("Hello, World!");',
}) => {
  const [code, setCode] = useState(defaultValue);
  const [language, setLanguage] = useState(defaultLanguage);
  const [output, setOutput] = useState<string>('');
  const [isOutputPopped, setIsOutputPopped] = useState(false);
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.value === language);
  const canRunInBrowser = currentLanguage?.canRunInBrowser ?? false;

  const { handlePopOutput } = usePopoutWindow(
    isOutputPopped,
    setIsOutputPopped,
    language,
    code,
    output
  );

  useEffect(() => {
    const savedCode = localStorage.getItem('playground-code');
    const savedLanguage = localStorage.getItem('playground-language');
    const mergeStrategy = localStorage.getItem('playground-merge-strategy') as 'comment-and-prepend' | 'append' | 'replace' | null;
    
    if (savedCode) {
      if (mergeStrategy) {
        // Merge incoming code with existing editor content safely
        const current = (savedLanguage ? '' : code) || '';
        const next = mergeStrategy === 'append'
          ? `${current}\n\n${savedCode}`
          : mergeStrategy === 'replace'
            ? savedCode
            : `/* Imported from inline compiler */\n/* --- Previous code commented below --- */\n/*\n${current}\n*/\n\n${savedCode}`;
        setCode(next);
      } else {
        setCode(savedCode);
      }
      localStorage.removeItem('playground-code');
      localStorage.removeItem('playground-merge-strategy');
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
      localStorage.removeItem('playground-language');
    }

    // If flagged, auto-run once mounted for snappier UX
    try {
      const shouldAutoRun = localStorage.getItem('playground-auto-run');
      if (shouldAutoRun) {
        localStorage.removeItem('playground-auto-run');
        setTimeout(() => { void handleRun(); }, 150);
      }
    } catch {}

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const handleRun = async () => {
    try {
      if (language === 'html') {
        if (iframeRef.current) {
          const iframe = executeHTML(code);
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
        }
        return;
      }
      if (language === 'css') {
        if (iframeRef.current) {
          const iframe = executeCSS(code);
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
        }
        return;
      }

      if (language === 'markdown') {
        if (iframeRef.current) {
          const iframe = await executeMarkdown(code);
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
        }
        return;
      }

      if (language === 'json') {
        const { result, error } = executeJSON(code);
        setOutput(result || (error ? `Error: ${error}` : ''));
        toast({
          description: error ? 'Invalid JSON' : 'JSON parsed',
          variant: error ? 'destructive' : 'success',
        });
        return;
      }

      if (language === 'sql') {
        const res = await executeSQL({ query: code });
        if (res.error) {
          setOutput(`Error: ${res.error}`);
          toast({ description: 'SQL execution failed', variant: 'destructive' });
        } else {
          const header = (res.columns || []).join('\t');
          const lines = (res.rows || []).map(r => r.map(v => v === null ? 'NULL' : String(v)).join('\t'));
          setOutput([header, ...lines].join('\n'));
          toast({ description: 'SQL executed successfully' });
        }
        return;
      }

      if (language === 'python') {
        const res = await executePython({ code });
        if (res.error) {
          setOutput([res.stdout, res.stderr, `Error: ${res.error}`].filter(Boolean).join('\n'));
          toast({ description: 'Python execution failed', variant: 'destructive' });
        } else {
          setOutput([res.stdout, res.stderr].filter(Boolean).join('\n'));
          toast({ description: 'Python executed successfully' });
        }
        return;
      }

      if (language === 'ruby') {
        const res = await executeRuby({ code });
        if (res.error) {
          setOutput([res.stdout, `Error: ${res.error}`].filter(Boolean).join('\n'));
          toast({ description: 'Ruby execution failed', variant: 'destructive' });
        } else {
          setOutput(res.stdout || '');
          toast({ description: 'Ruby executed successfully' });
        }
        return;
      }

      const { result, error, logs = [] } = await executeJavaScript(code);
      const outputText = [
        ...(logs.length > 0 ? logs : []),
        ...(result !== undefined ? [result] : []),
        ...(error ? [`Error: ${error}`] : [])
      ].join('\n');
      
      setOutput(outputText);
      
      toast({
        description: error ? "Execution failed" : "Code executed successfully",
        variant: error ? "destructive" : "success",
      });
    } catch (err) {
      toast({
        description: "Failed to execute code",
        variant: "destructive",
      });
    }
  };

  const handleResize = () => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return (
    <Card className="w-full h-[90vh] mx-auto bg-card shadow-lg">
      <CardHeader className="border-b border-border/20">
        <EditorHeader
          language={language}
          setLanguage={(nextLang) => {
            const isEmpty = !code || !code.trim();
            const currentSample = getLanguageSample(language).trim();
            const isDefault = code.trim() === currentSample || code.trim() === (defaultValue || '').trim();

            if (isEmpty || isDefault)
            {
              setLanguage(nextLang);
              setCode(getLanguageSample(nextLang));
              return;
            }

            const replace = window.confirm(`Replace current content with ${nextLang} sample? Click Cancel to keep your code.`);
            setLanguage(nextLang);
            if (replace)
            {
              setCode(getLanguageSample(nextLang));
            }
          }}
          code={code}
          onRun={handleRun}
          onPopOutput={handlePopOutput}
          isOutputPopped={isOutputPopped}
          onSetCode={setCode}
        />
      </CardHeader>
      <CardContent className="p-4 pb-8 h-[calc(90vh-5rem)]">
        <ResizablePanelGroup 
          direction="vertical" 
          className="h-full rounded-md border"
          onLayout={handleResize}
          id="playground-panels"
        >
          <ResizablePanel 
            defaultSize={canRunInBrowser && !isOutputPopped ? 60 : 100}
            id="editor-panel"
            order={1}
          >
            <div className="h-full">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              />
            </div>
          </ResizablePanel>
          {canRunInBrowser && !isOutputPopped && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={40}
                id="output-panel"
                order={2}
              >
                <div className="h-full flex flex-col">
                  <PlaygroundOutput
                    language={language}
                    output={output}
                    code={code}
                    iframeRef={iframeRef}
                    outputRef={outputRef}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  );
};

export default CodePlayground;


