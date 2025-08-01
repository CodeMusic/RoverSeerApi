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
import { Send, Code, MessageSquare, Sparkles, Bot, User, Menu, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DevSessionSidebar } from './DevSessionSidebar';
import { DevSession, Message } from '@/types/chat';
import { format } from 'date-fns';

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
  // Development Sessions State
  const [sessions, setSessions] = useState<DevSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Current Session State
  const [code, setCode] = useState(defaultValue);
  const [language, setLanguage] = useState(defaultLanguage);
  const [output, setOutput] = useState<string>('');
  const [isOutputPopped, setIsOutputPopped] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.value === language);
  const canRunInBrowser = currentLanguage?.canRunInBrowser ?? false;
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const { handlePopOutput } = usePopoutWindow(
    isOutputPopped,
    setIsOutputPopped,
    language,
    code,
    output
  );

  // Session Management Functions
  const createNewSession = () => {
    const newSession: DevSession = {
      id: Date.now().toString(),
      name: undefined,
      type: 'dev',
      language: 'javascript',
      code: '// Write your code here\nconsole.log("Hello, World!");',
      output: '',
      chatMessages: [],
      lastUpdated: Date.now(),
      favorite: false,
      createdAt: Date.now(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    loadSession(newSession);
  };

  const loadSession = (session: DevSession) => {
    setCode(session.code);
    setLanguage(session.language);
    setOutput(session.output || '');
    setChatMessages(session.chatMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    })));
  };

  const saveCurrentSession = () => {
    if (!currentSessionId) return;
    
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? {
            ...session,
            code,
            language,
            output,
            chatMessages: chatMessages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp.getTime(),
            })),
            lastUpdated: Date.now(),
          }
        : session
    ));
  };

  const handleSessionSelect = (sessionId: string) => {
    saveCurrentSession();
    setCurrentSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      loadSession(session);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        const nextSession = remainingSessions[0];
        setCurrentSessionId(nextSession.id);
        loadSession(nextSession);
      } else {
        createNewSession();
      }
    }
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, name: newName, lastUpdated: Date.now() }
        : session
    ));
  };

  const handleToggleFavorite = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, favorite: !session.favorite, lastUpdated: Date.now() }
        : session
    ));
  };

  useEffect(() => {
    // Load sessions from localStorage or create default session
    const savedSessions = localStorage.getItem('dev-sessions');
    const savedCurrentId = localStorage.getItem('current-dev-session-id');
    
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        // Migrate old sessions to include type property
        const migratedSessions = parsedSessions.map((session: any) => ({
          ...session,
          type: session.type || 'dev' // Add type if missing
        }));
        setSessions(migratedSessions);
        
        if (savedCurrentId && migratedSessions.find((s: DevSession) => s.id === savedCurrentId)) {
          setCurrentSessionId(savedCurrentId);
          const currentSession = migratedSessions.find((s: DevSession) => s.id === savedCurrentId);
          if (currentSession) {
            loadSession(currentSession);
          }
        } else if (migratedSessions.length > 0) {
          setCurrentSessionId(migratedSessions[0].id);
          loadSession(migratedSessions[0]);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        createNewSession();
      }
    } else {
      createNewSession();
    }

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('dev-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('current-dev-session-id', currentSessionId);
    }
  }, [currentSessionId]);

  // Auto-save current session
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      saveCurrentSession();
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [code, language, output, chatMessages]);

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
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Development Sessions Sidebar */}
      <DevSessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isSidebarOpen={isSidebarOpen}
        onNewSession={createNewSession}
        onSessionSelect={handleSessionSelect}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-sidebar/30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={`${isSidebarOpen ? 'Hide' : 'Show'} sessions sidebar`}
              className={cn(isSidebarOpen ? "bg-sidebar-accent" : "")}
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">CodeMusai's Playground</h1>
              <p className="text-xs text-muted-foreground">
                {currentSession?.name || `${language} Development`} • {sessions.length} sessions • Sidebar: {isSidebarOpen ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Side */}
          <div className="flex-1 flex flex-col border-r">
            <div className="flex items-center justify-between p-3 border-b bg-sidebar/20">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Code Editor</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
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
        </div>
      </div>

      {/* AI Chat Side */}
      <div className="w-96 flex flex-col border-l">
        <div className="flex items-center justify-between p-3 border-b bg-sidebar/20">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">AI Chat</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
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
        </div>
      </div>
      </div>
    </div>
  );
};

export default CodeMusaiPlayground; 