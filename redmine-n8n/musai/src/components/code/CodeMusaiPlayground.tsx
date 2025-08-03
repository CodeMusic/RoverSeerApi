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
import { Send, Code, MessageSquare, Sparkles, Bot, User, Menu, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DevSessionSidebar } from './DevSessionSidebar';
import { DevSession, Message } from '@/types/chat';
import { format } from 'date-fns';
import { MysticalTypingIndicator } from '@/components/chat/MysticalTypingIndicator';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';

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
  // Session management props
  sessions?: DevSession[];
  currentSessionId?: string;
  onNewSession?: () => void;
  onSessionSelect?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newName: string) => void;
  onToggleFavorite?: (sessionId: string) => void;
  onUpdateSession?: (sessionId: string, data: Partial<DevSession>) => void;
}

const CodeMusaiPlayground: React.FC<CodeMusaiPlaygroundProps> = ({
  defaultLanguage = 'javascript',
  defaultValue = '// Write your code here\nconsole.log("Hello, World!");',
  onClose,
  sessions = [],
  currentSessionId = '',
  onNewSession = () => {},
  onSessionSelect = () => {},
  onDeleteSession = () => {},
  onRenameSession = () => {},
  onToggleFavorite = () => {},
  onUpdateSession = () => {}
}) => {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  
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
    onNewSession();
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
    
    const updatedSession: Partial<DevSession> = {
      code,
      language,
      output,
      chatMessages: chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.getTime()
      })),
      lastUpdated: Date.now()
    };
    
    onUpdateSession(currentSessionId, updatedSession);
  };

  const handleSessionSelect = (sessionId: string) => {
    saveCurrentSession();
    onSessionSelect(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      loadSession(session);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    onDeleteSession(sessionId);
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    onRenameSession(sessionId, newName);
  };

  const handleToggleFavorite = (sessionId: string) => {
    onToggleFavorite(sessionId);
  };

  // Auto-save current session when code changes
  useEffect(() => {
    if (currentSessionId) {
      const timeoutId = setTimeout(saveCurrentSession, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [code, language, output, chatMessages, currentSessionId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleRun = async () => {
    try {
      let result = '';
      
      if (language === 'javascript') {
        const executionResult = await executeJavaScript(code);
        const outputText = [
          ...(executionResult.logs || []),
          ...(executionResult.result !== undefined ? [executionResult.result] : []),
          ...(executionResult.error ? [`Error: ${executionResult.error}`] : [])
        ].join('\n');
        result = outputText;
      } else if (language === 'html') {
        const iframe = executeHTML(code);
        if (iframeRef.current) {
          iframeRef.current.innerHTML = '';
          iframeRef.current.appendChild(iframe);
        }
        result = 'HTML rendered in iframe';
      } else {
        result = `Code execution for ${language} is not yet supported in the browser.`;
      }
      
      setOutput(result);
      saveCurrentSession();
      
      toast({
        title: "Code executed successfully",
        description: `Output updated for ${language} code`,
      });
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      toast({
        title: "Code execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Simulate API delay
      const aiResponse = await simulateAIResponse(
        userMessage.content,
        code,
        output,
        language
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      saveCurrentSession();
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat error",
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

    const responses = [
      `I can help you with your ${currentLanguage} code! Looking at your current code:\n\n\`\`\`${currentLanguage}\n${currentCode}\n\`\`\`\n\n${userInput.includes('bug') || userInput.includes('error') ? 'I notice you might be having an issue. Let me analyze the code and suggest some improvements.' : 'Here are some suggestions to improve your code:'}\n\n1. **Code Structure**: Consider breaking this into smaller, more manageable functions\n2. **Error Handling**: Add try-catch blocks where appropriate\n3. **Documentation**: Add comments to explain complex logic\n\nWould you like me to help you implement any of these improvements?`,
      
      `Great question about your ${currentLanguage} code! Based on what I see:\n\n\`\`\`${currentLanguage}\n${currentCode.substring(0, 200)}${currentCode.length > 200 ? '...' : ''}\n\`\`\`\n\nHere's what I recommend:\n\n- **Performance**: Consider optimizing the algorithm\n- **Readability**: Use more descriptive variable names\n- **Best Practices**: Follow ${currentLanguage} conventions\n\nWould you like me to show you how to implement any of these suggestions?`,
      
      `I see you're working with ${currentLanguage}! Your current output shows:\n\n\`\`\`\n${currentOutput || 'No output yet'}\n\`\`\`\n\nTo help you better, could you tell me:\n1. What specific problem are you trying to solve?\n2. Are you getting any error messages?\n3. What's the expected behavior?\n\nThis will help me provide more targeted assistance.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleResize = () => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  // Show PreMusaiPage if no sessions exist
  if (sessions.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <PreMusaiPage
          type="code"
          onSubmit={(input) => {
            // Create a new dev session with the input as initial code
            createNewSession();
            // Set the code after a brief delay to ensure session is created
            setTimeout(() => {
              setCode(input);
            }, 100);
          }}
          onQuickAction={(actionId, actionType, actionData) => {
            switch (actionId) {
              case 'code-new':
                createNewSession();
                break;
              case 'code-playground':
                // Quick playground mode
                createNewSession();
                break;
              case 'code-templates':
                if (actionData) {
                  createNewSession();
                  setTimeout(() => {
                    setCode(actionData);
                  }, 100);
                }
                break;
              default:
                console.log('Code quick action:', actionId, actionType, actionData);
            }
          }}
          isLoading={false}
          className="h-full"
        />
      </div>
    );
  }

  // Show CodeMusai PreMusai interface if no current session
  if (!currentSession) {
    return (
      <div className="h-full flex flex-col">
        <PreMusaiPage
          type="code"
          onSubmit={(input) => {
            // Create a new dev session with the input as initial code or prompt
            createNewSession();
            // Set the code after a brief delay to ensure session is created
            setTimeout(() => {
              setCode(input);
            }, 100);
          }}
          onQuickAction={(actionId, actionType, actionData) => {
            switch (actionId) {
              case 'code-new':
                createNewSession();
                break;
              case 'code-playground':
                // Quick playground mode
                createNewSession();
                break;
              case 'code-templates':
                if (actionData) {
                  createNewSession();
                  setTimeout(() => {
                    setCode(actionData);
                  }, 100);
                }
                break;
              default:
                console.log('Code quick action:', actionId, actionType, actionData);
            }
          }}
          isLoading={false}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Development Sessions Sidebar */}
      {isSidebarOpen && (
        <DevSessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          isSidebarOpen={isSidebarOpen}
          onNewSession={createNewSession}
          onSessionSelect={handleSessionSelect}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onToggleFavorite={handleToggleFavorite}
          onToggleCollapse={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-purple-200 dark:border-purple-800 bg-sidebar/30">
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
                          <PlaygroundOutput
                            output={output}
                            language={language}
                            code={code}
                            iframeRef={iframeRef}
                            outputRef={outputRef}
                          />
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Chat Side */}
          {isChatOpen && (
            <div className="w-96 flex flex-col border-l">
              <div className="flex items-center justify-between p-3 border-b bg-sidebar/20">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">AI Chat</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                  title="Hide AI Chat"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
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
                    <div className="flex justify-start">
                      <MysticalTypingIndicator isDarkMode={false} />
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
          )}

          {/* Chat Toggle Button when chat is closed */}
          {!isChatOpen && (
            <div className="absolute right-4 bottom-4">
              <Button
                onClick={() => setIsChatOpen(true)}
                className="rounded-full w-12 h-12 shadow-lg"
                title="Show AI Chat"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Sidebar Toggle Button when sidebar is closed */}
          {!isSidebarOpen && (
            <div className="absolute left-4 top-4">
              <Button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-full w-12 h-12 shadow-lg"
                title="Show Sessions Sidebar"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeMusaiPlayground; 