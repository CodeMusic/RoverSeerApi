import type { AllSessions } from '@/types/chat';
import { GraduationCap, BookOpen, Sparkles, MessageSquare, Code, TrendingUp, Heart, Eye } from 'lucide-react';

export const UNIVERSITY_SIDEBAR_TITLE = 'Scholarly sessions';
export const UNIVERSITY_NEW_SESSION_TEXT = 'New course concept';

export const getUniversitySessionIcon = (session: AllSessions) =>
{
  if (session.type === 'university')
  {
    switch (session.scope)
    {
      case 'course':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'standalone':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'concept':
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  }
  switch (session.type)
  {
    case 'dev':
      return <Code className="w-4 h-4" />;
    case 'career':
      return <TrendingUp className="w-4 h-4" />;
    case 'therapy':
      return <Heart className="w-4 h-4" />;
    case 'eye':
      return <Eye className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

export const getUniversitySessionName = (session: AllSessions) =>
{
  if (session.type === 'university')
  {
    if (session.scope === 'standalone')
    {
      return session.name || session.topic || 'Standalone Lecture';
    }
    if (session.scope === 'concept')
    {
      return session.name || session.topic || 'Course Concept';
    }
    return session.name || session.topic || 'Course';
  }
  if (session.type === 'dev')
  {
    if (session.name) return session.name;
    if (session.code)
    {
      const firstLine = session.code.split('\n')[0] || '';
      return firstLine.length > 30 ? `${firstLine.slice(0, 30)}…` : firstLine || 'Dev Session';
    }
    return 'Dev Session';
  }
  if (session.type === 'career' || session.type === 'therapy' || session.type === 'chat')
  {
    if (session.name) return session.name;
    const message = session.messages?.find?.((m) => m.role === 'user')?.content;
    return message || (session.type === 'career' ? 'Career Session' : session.type === 'therapy' ? 'Therapy Session' : 'Chat Session');
  }
  if (session.type === 'eye')
  {
    if (session.name) return session.name;
    if (session.prompts && session.prompts.length > 0)
    {
      return session.prompts[session.prompts.length - 1];
    }
    return 'Eye Session';
  }
  return session.name || 'Session';
};

export const getUniversitySessionSubtitle = (session: AllSessions) =>
{
  if (session.type === 'university')
  {
    if (session.scope === 'course')
    {
      const progress = Math.round(session.progress ?? 0);
      return `${progress}% complete`;
    }
    if (session.scope === 'standalone')
    {
      return 'Standalone lecture';
    }
    return 'Concept draft';
  }
  const updated = new Date(session.lastUpdated).toLocaleString();
  return updated;
};
