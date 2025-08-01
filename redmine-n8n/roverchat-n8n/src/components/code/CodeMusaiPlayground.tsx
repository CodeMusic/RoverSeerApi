import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { executeJavaScript, executeHTML } from '@/utils/codeExecutor';
import { useToast } from '@/hooks/use-toast';
import { EditorHeader } from '../playground/EditorHeader';
import { PlaygroundOutput } from '../playground/PlaygroundOutput';
import { usePopoutWindow } from '@/hooks/usePopoutWindow';
import { SUPPORTED_LANGUAGES } from '../playground/constants';
import { Send, Code, MessageSquare, Sparkles, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CodeMusaiPlaygroundProps {
  defaultLanguage?: string;
  defaultValue?: string;
  onClose?: () => void;
}

const CodeMusaiPlayground: React.FC<CodeMusaiPlaygroundProps> = ({
  defaultLanguage = 'javascript',
  defaultValue = '// Write your code here\nconsole.log("Hello, World!");',
  onClose
}) => {
  const [code, setCode] = useState(defaultValue);
  const [language, setLanguage] = useState(defaultLanguage);
  const [output, setOutput] = useState<string>('');
  const [isOutputPopped, setIsOutputPopped] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'chat'>('code');
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
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
    
    if (savedCode) {
      setCode(savedCode);
      localStorage.removeItem('playground-code');
    }
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
      localStorage.removeItem('playground-language');
    }

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

      const { result, error, logs = [] } = await executeJavaScript(code);
      const outputText = [
        ...(logs.length > 0 ? logs : []),
        ...(result !== undefined ? [result] : []),
        ...(error ? [`Error: ${error}`] : [])
      ].join('\n');
      
      setOutput(outputText);
      
      toast({
        description: error ? "Execution failed" : "Code executed successfully",
        variant: error ? "destructive" : "default",
      });
    } catch (err) {
      toast({
        description: "Failed to execute code",
        variant: "destructive",
      });
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Simulate AI response - in real implementation, this would call your AI API
      const aiResponse = await simulateAIResponse(chatInput, code, output, language);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const simulateAIResponse = async (userInput: string, currentCode: string, currentOutput: string, currentLanguage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const context = `
Current Code (${currentLanguage}):
\`\`\`${currentLanguage}
${currentCode}
\`\`\`

${currentOutput ? `Current Output:\n${currentOutput}\n` : ''}

User Question: ${userInput}
`;

    // Simple response simulation - replace with actual AI API call
    if (userInput.toLowerCase().includes('error') || userInput.toLowerCase().includes('fix')) {
      return `I can see you're having an issue with your code. Let me help you debug this:

1. **Check for syntax errors**: Make sure all brackets, parentheses, and quotes are properly closed.
2. **Verify variable names**: Ensure all variables are declared before use.
3. **Check the console output**: Look for any error messages in the output.

Would you like me to suggest specific fixes based on your code?`;
    } else if (userInput.toLowerCase().includes('optimize') || userInput.toLowerCase().includes('improve')) {
      return `Here are some ways to optimize your code:

1. **Use more efficient algorithms**: Consider time complexity
2. **Reduce redundant operations**: Look for repeated calculations
3. **Use appropriate data structures**: Choose the right structure for your use case
4. **Add error handling**: Make your code more robust

Would you like me to show you specific optimizations for your current code?`;
    } else if (userInput.toLowerCase().includes('explain')) {
      return `Let me explain what your code does:

Your code appears to be a ${currentLanguage} program that ${currentCode.includes('console.log') ? 'outputs text to the console' : 'performs some computation'}.

The main components are:
- Code structure and logic
- Output handling
- Error management

Is there a specific part you'd like me to explain in more detail?`;
    } else {
      return `I understand you're working on ${currentLanguage} code. I can help you with:

- **Code review and suggestions**
- **Debugging assistance**
- **Performance optimization**
- **Best practices guidance**
- **Alternative approaches**

What specific aspect would you like to focus on?`;
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-sidebar/30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Code className="w-5 h-5 text-primary flex-shrink-0" />
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold">CodeMusai's Playground</h1>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <MessageSquare className="w-3 h-3" />
                AI-Assisted Development
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Write, run, and develop code with AI assistance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="flex items-center gap-2">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'code' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('code')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          <Code className="w-4 h-4 mr-2" />
          Code Editor
        </Button>
        <Button
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('chat')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          AI Chat
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' ? (
          <Card className="w-full h-full mx-auto bg-card shadow-lg border-0 rounded-none">
            <CardHeader className="border-b border-border/20">
              <EditorHeader
                language={language}
                setLanguage={setLanguage}
                code={code}
                onRun={handleRun}
                onPopOutput={handlePopOutput}
                isOutputPopped={isOutputPopped}
              />
            </CardHeader>
            <CardContent className="p-4 pb-8 h-[calc(100vh-12rem)]">
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
        ) : (
          <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a conversation with AI</h3>
                  <p className="text-muted-foreground">
                    Ask questions about your code, get help with debugging, or request optimizations.
                  </p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "flex gap-3 max-w-[80%]",
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted text-foreground rounded-lg px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      AI is thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about your code, request help, or get suggestions... (Cmd/Ctrl + Enter to send)"
                  className="flex-1 min-h-[60px] resize-none"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Current code and output are automatically shared with AI for context
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeMusaiPlayground; 