import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import type { Lecture, ChatMessage } from '@/types/university';

interface LectureChatProps 
{
  lecture: Lecture;
  onLectureUpdate: (lecture: Lecture) => void;
}

const LectureChat = ({ lecture, onLectureUpdate }: LectureChatProps) => 
{
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStep = lecture.steps[lecture.currentStep];

  useEffect(() => 
  {
    scrollToBottom();
  }, [currentStep?.chat]);

  const scrollToBottom = () => 
  {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => 
  {
    if (!message.trim() || isLoading || !currentStep) return;

    const userMessage: ChatMessage = {
      role: 'user',
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    const updatedSteps = [...lecture.steps];
    updatedSteps[lecture.currentStep] = {
      ...currentStep,
      chat: [...currentStep.chat, userMessage]
    };

    let updatedLecture = {
      ...lecture,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    };

    onLectureUpdate(updatedLecture);
    setMessage('');
    setIsLoading(true);

    try 
    {
      // Send to AI agent
      const response = await universityApi.sendChatMessage(
        `step-${lecture.currentStep}`,
        userMessage.message
      );

      const agentMessage: ChatMessage = {
        role: 'agent',
        message: response.reply,
        timestamp: new Date().toISOString()
      };

      // Add agent response
      const finalSteps = [...updatedLecture.steps];
      finalSteps[lecture.currentStep] = {
        ...finalSteps[lecture.currentStep],
        chat: [...finalSteps[lecture.currentStep].chat, agentMessage]
      };

      updatedLecture = {
        ...updatedLecture,
        steps: finalSteps,
        updatedAt: new Date().toISOString()
      };

      onLectureUpdate(updatedLecture);
    } 
    catch (error) 
    {
      console.error('Failed to send chat message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'agent',
        message: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };

      const errorSteps = [...updatedLecture.steps];
      errorSteps[lecture.currentStep] = {
        ...errorSteps[lecture.currentStep],
        chat: [...errorSteps[lecture.currentStep].chat, errorMessage]
      };

      onLectureUpdate({
        ...updatedLecture,
        steps: errorSteps,
        updatedAt: new Date().toISOString()
      });
    } 
    finally 
    {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => 
  {
    if (e.key === 'Enter' && !e.shiftKey) 
    {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => 
  {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentStep) 
  {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">
          No step selected for chat.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI Tutor - Step {lecture.currentStep + 1}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Ask questions about "{currentStep.title}" and get personalized help
          </p>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {currentStep.chat.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Bot className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Welcome to AI Tutoring!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                I'm here to help you understand this step. Ask me anything about:
              </p>
              <div className="text-left max-w-md mx-auto">
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Concepts you don't understand</li>
                  <li>Examples or clarifications</li>
                  <li>How this relates to other topics</li>
                  <li>Study tips and strategies</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          currentStep.chat.map((chatMessage, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                chatMessage.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {chatMessage.role === 'agent' && (
                <Avatar className="h-8 w-8 bg-purple-100 dark:bg-purple-900">
                  <AvatarFallback>
                    <Bot className="h-4 w-4 text-purple-600" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  chatMessage.role === 'user'
                    ? 'bg-purple-600 text-white ml-auto'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{chatMessage.message}</p>
                <p
                  className={`text-xs mt-1 opacity-70 ${
                    chatMessage.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(chatMessage.timestamp)}
                </p>
              </div>

              {chatMessage.role === 'user' && (
                <Avatar className="h-8 w-8 bg-blue-100 dark:bg-blue-900">
                  <AvatarFallback>
                    <User className="h-4 w-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 bg-purple-100 dark:bg-purple-900">
              <AvatarFallback>
                <Bot className="h-4 w-4 text-purple-600" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about this step..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!message.trim() || isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Statistics */}
      {currentStep.chat.length > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep.chat.filter(m => m.role === 'user').length} questions asked
          </p>
        </div>
      )}
    </div>
  );
};

export default LectureChat;