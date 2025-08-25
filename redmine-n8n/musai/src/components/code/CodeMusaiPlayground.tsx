import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { executeJavaScript, executeHTML } from '@/utils/codeExecutor';
import { useToast } from '@/hooks/use-toast';
import { EditorHeader } from '../playground/EditorHeader';
import { PlaygroundOutput } from '../playground/PlaygroundOutput';
import { usePopoutWindow } from '@/hooks/usePopoutWindow';
import { SUPPORTED_LANGUAGES } from '../playground/constants';
import { Code, MessageSquare, Sparkles, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DevSession, Message } from '@/types/chat';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';
import { ChatPane } from '@/components/chat/ChatPane';
import { Toaster } from '@/components/ui/toaster';
import CodeMusaiCompiler from '@/components/code/CodeMusaiCompiler';
import { useMessageSender } from '@/hooks/useMessageSender';
import { useQueryClient } from '@tanstack/react-query';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCompilerVisible, setIsCompilerVisible] = useState(false);
  const [compilerAnchor, setCompilerAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.value === language);
  const canRunInBrowser = currentLanguage?.canRunInBrowser ?? false;
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Wire CodeMusai chat to the same n8n chat endpoint
  const queryClient = useQueryClient();
  const { sendMessage: sendMessageToWebhook } = useMessageSender(
    (sessionId: string, updatedMessages) => {
      setMessages(updatedMessages);
      saveCurrentSession({ chatMessages: updatedMessages });
    },
    queryClient
  );

  const { handlePopOutput } = usePopoutWindow(
    isOutputPopped,
    setIsOutputPopped,
    language,
    code,
    output
  );

  // Protective snapshot + merge strategies to ensure user code is never lost
  const commentOutCode = (text: string, lang: string): string => {
    const l = (lang || '').toLowerCase();
    const ts = new Date().toISOString();
    const banner = ` Previous code snapshot @ ${ts} `;
    if (['javascript','typescript','css','java','c','cpp','csharp','go','rust','php','sql'].includes(l)) {
      return `/*${banner}\n${text}\n*/`;
    }
    if (l === 'html') {
      return `<!--${banner}\n${text}\n-->`;
    }
    if (['python','shell','bash','sh','ruby'].includes(l)) {
      return text.split('\n').map(line => `# ${line}`).join('\n');
    }
    // Fallback to a generic banner
    return `/*${banner}\n${text}\n*/`;
  };

  const applyExternalCode = (
    newCode: string,
    strategy: 'comment-and-prepend' | 'append' | 'replace' = 'comment-and-prepend'
  ): void => {
    const current = code || '';
    let next = '';
    switch (strategy) {
      case 'append':
        next = `${current}\n\n${newCode}`;
        break;
      case 'replace':
        // Still snapshot the old code at the bottom for safety
        next = `${newCode}\n\n${commentOutCode(current, language)}`;
        break;
      case 'comment-and-prepend':
      default:
        next = `${commentOutCode(current, language)}\n\n${newCode}`;
        break;
    }
    setCode(next);
    // Persist immediately so session retains the snapshot
    saveCurrentSession({ code: next });
  };

  // This page no longer renders a scoped toaster; rely on global RouteAwareToaster

  // Session Management Functions
  const createNewSession = () => {
    onNewSession();
  };

  const loadSession = (session: DevSession) => {
    setCode(session.code);
    setLanguage(session.language);
    setOutput(session.output || '');
    setMessages(session.chatMessages || []);
  };

  const saveCurrentSession = (overrides?: Partial<DevSession>) => {
    if (!currentSessionId) return;
    const updatedSession: Partial<DevSession> = {
      code,
      language,
      output,
      chatMessages: messages,
      lastUpdated: Date.now(),
      ...(overrides || {})
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
  }, [code, language, output, messages, currentSessionId]);

  // No manual scroll; ChatPane manages its own scrolling

  // Load session data whenever the selected session changes externally
  useEffect(() => {
    if (!currentSessionId)
    {
      // Reset to defaults when no session is selected
      setCode(defaultValue);
      setLanguage(defaultLanguage);
      setOutput('');
      setMessages([]);
      return;
    }

    const session = sessions.find(s => s.id === currentSessionId);
    if (session)
    {
      loadSession(session);
    }
  }, [currentSessionId, sessions, defaultLanguage, defaultValue]);

  const handleRun = async (ev?: React.MouseEvent) => {
    try {
      let result = '';
      let hadError = false;
      
      if (language === 'javascript') {
        const executionResult = await executeJavaScript(code);
        const outputText = [
          ...(executionResult.logs || []),
          ...(executionResult.result !== undefined ? [executionResult.result] : []),
          ...(executionResult.error ? [`Error: ${executionResult.error}`] : [])
        ].join('\n');
        result = outputText;
        hadError = Boolean(executionResult.error);
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
      saveCurrentSession({ output: result });
      
      toast({
        title: hadError ? "Code execution failed" : "Code executed successfully",
        description: hadError ? 'There were errors during execution. See output.' : `Output updated for ${language} code`,
        variant: hadError ? "destructive" : "success",
      });
      
      const target = ev?.currentTarget as HTMLElement | undefined;
      if (target) {
        const rect = target.getBoundingClientRect();
        setCompilerAnchor({ x: rect.left + rect.width / 2, y: rect.top });
        setIsCompilerVisible(true);
      }
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

  const onSendMessage = async (text: string) => {
    const payload = (text || '').trim();
    if (!payload) return;
    setIsTyping(true);
    try {
      await sendMessageToWebhook(payload, currentSessionId || 'dev', messages);
    } catch (e) {
      console.error('Chat error:', e);
      toast({ title: 'Chat error', description: 'Failed to contact AI', variant: 'destructive' });
    } finally {
      setIsTyping(false);
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

  // No-op key handler retained for legacy references (chat input handled inside ChatPane)

  // PreMusai gating logic: show PreMusai inside main area while keeping sidebars accessible
  const shouldShowPreMusai = sessions.length === 0 || !currentSession;

  const handleQuickAction = (actionId: string, actionType: string, actionData?: any) => {
    switch (actionId)
    {
      case 'code-chat':
      case 'code-new':
      case 'code-playground':
      {
        createNewSession();
        return;
      }
      case 'code-templates':
      {
        if (actionData)
        {
          createNewSession();
          setTimeout(() => {
            applyExternalCode(String(actionData), 'comment-and-prepend');
          }, 100);
        }
        return;
      }
      default:
      {
        // Generic fallback for dynamic actions: if it's a submit with data, send to chat
        if (actionType === 'submit' && actionData)
        {
          const payload = String(actionData);
          createNewSession();
          setTimeout(async () => {
            setIsChatOpen(true);
            setIsTyping(true);
            try { await onSendMessage(payload); }
            finally { setIsTyping(false); }
          }, 100);
          return;
        }
        console.log('Code quick action:', actionId, actionType, actionData);
      }
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Main Content Area */}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b-2 border-purple-200 dark:border-purple-800 bg-sidebar/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{currentSession?.name || `${language} Development`}</h1>
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden min-w-0">
          {shouldShowPreMusai ? (
            <div className="flex-1 flex flex-col">
              <PreMusaiPage
                type="code"
                onSubmit={(input) => {
                  // Create session, then enter main interface with chat pre-seeded and loading
                  const trimmed = (input || '').trim();
                  createNewSession();
                  setTimeout(async () => {
                    // Ensure chat is visible
                    setIsChatOpen(true);
                    if (trimmed) {
                      const userMessage: Message = {
                        id: `${Date.now()}`,
                        role: 'user',
                        content: trimmed,
                        timestamp: Date.now()
                      };
                      setMessages(prev => {
                        const next = [...prev, userMessage];
                        saveCurrentSession({ chatMessages: next });
                        return next;
                      });
                      setIsTyping(true);
                      try { await onSendMessage(trimmed); } finally { setIsTyping(false); }
                    }
                  }, 100);
                }}
                onQuickAction={handleQuickAction}
                isLoading={false}
                className="h-full"
              />
            </div>
          ) : (
          <>
          {/* Code Editor Side */}
          <div className="flex-1 flex flex-col border-r min-w-0">
            <div className="flex items-center justify-between p-3 border-b bg-sidebar/20">
              <div className="flex items-center gap-2 min-w-0">
                <Code className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm truncate">{currentSession?.name || `${language} Session`}</span>
              </div>
              <div className="flex items-center gap-2">
                {!isChatOpen && (
                  <Button
                    onClick={() => setIsChatOpen(true)}
                    className="h-8 px-3 bg-slate-600 text-white hover:bg-slate-700"
                    title="Open AI Chat"
                    aria-label="Open AI Chat"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">Open Chat</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Card className="w-full h-full mx-auto bg-card shadow-lg border-0 rounded-none flex flex-col">
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
                <CardContent className="flex-1 overflow-hidden p-4 pb-8 relative">
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
                          {/* Using global RouteAwareToaster; no scoped toaster here */}
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
            <div className="w-96 flex flex-col border-l min-h-0">
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
              <div className="flex-1 min-h-0">
                <ChatPane
                  sessionId={currentSessionId || 'unsaved'}
                  module="code"
                  messageList={messages}
                  onMessageSend={onSendMessage}
                  isTyping={isTyping}
                  className="h-full"
                  prefixText={(() => {
                    const maxLen = 240;
                    const codeHead = code.split('\n').slice(0, 6).join('\n');
                    const codePart = codeHead.length > maxLen ? `${codeHead.slice(0, maxLen)}…` : codeHead;
                    const firstOutLine = (output || '').toString().split('\n')[0] || '';
                    const outTrim = firstOutLine.length > maxLen ? `${firstOutLine.slice(0, maxLen)}…` : firstOutLine;
                    return `[Code (${language}) snippet: ${codePart} | last output: ${outTrim}]`;
                  })()}
                />
              </div>
            </div>
          )}

          {/* Chat Toggle Button when chat is closed (moved to header; no floating button) */}

          {/* Sidebar Toggle Button when sidebar is closed */}
          {!isSidebarOpen && (
            <div className="absolute left-4 top-8">
              <Button
                onClick={() => {
                  setIsSidebarOpen(true);
                  const evt = new Event('musai-left-sidebar-expand');
                  window.dispatchEvent(evt);
                }}
                className="rounded-full w-12 h-12 shadow-lg text-muted-foreground"
                title="Show Sessions Sidebar"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          )}
          </>
          )}
        </div>
      </div>
      {/* Inline compiler bubble anchored from Run */}
      <CodeMusaiCompiler
        code={code}
        language={language}
        isVisible={isCompilerVisible}
        onClose={() => setIsCompilerVisible(false)}
        onOpenPlayground={() => setIsCompilerVisible(false)}
        position={compilerAnchor}
      />
    </div>
  );
};

export default CodeMusaiPlayground; 