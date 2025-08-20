export interface MoodOption {
  emoji: string;
  label: string;
}

export const THERAPY_MOODS: MoodOption[] = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🤔', label: 'Thoughtful' }
];

export function extractMoodFromContent(text: string): { mood: string | null; stripped: string }
{
  if (!text) return { mood: null, stripped: text };
  const match = text.match(/^\s*\[\s*Mood\s*:\s*([^\]]+)\]\s*(.*)$/i);
  if (match)
  {
    const moodRaw = (match[1] || '').trim();
    const remainder = match[2] ?? '';
    return { mood: moodRaw, stripped: remainder };
  }
  return { mood: null, stripped: text };
}

export function getMoodEmoji(mood: string): string
{
  switch (String(mood || '').toLowerCase())
  {
    case 'happy': return '😊';
    case 'sad': return '😔';
    case 'anxious': return '😰';
    case 'frustrated': return '😤';
    case 'calm': return '😌';
    case 'thoughtful': return '🤔';
    default: return '✨';
  }
}

export function getTherapyMoodStyling(mood: string): { userBubble: string; userText: string } | null
{
  const key = String(mood || '').toLowerCase();
  switch (key)
  {
    case 'happy':
      return {
        userBubble: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
        userText: 'text-yellow-900 dark:text-yellow-100'
      };
    case 'sad':
      return {
        userBubble: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
        userText: 'text-blue-900 dark:text-blue-100'
      };
    case 'anxious':
      return {
        userBubble: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
        userText: 'text-amber-900 dark:text-amber-100'
      };
    case 'frustrated':
      return {
        userBubble: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
        userText: 'text-red-900 dark:text-red-100'
      };
    case 'calm':
      return {
        userBubble: 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700',
        userText: 'text-teal-900 dark:text-teal-100'
      };
    case 'thoughtful':
      return {
        userBubble: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
        userText: 'text-purple-900 dark:text-purple-100'
      };
    default:
      return null;
  }
}


