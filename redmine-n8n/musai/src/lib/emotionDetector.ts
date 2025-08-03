import { useMusaiMood } from '@/contexts/MusaiMoodContext';

export interface EmotionTrigger {
  keywords: string[];
  emojis: string[];
  effects: {
    mood?: string;
    party?: boolean;
    rainbow?: boolean;
    matrix?: boolean;
    confetti?: boolean;
  };
  intensity: 'subtle' | 'moderate' | 'intense';
}

export const emotionTriggers: EmotionTrigger[] = [
  // Celebration & Joy
  {
    keywords: ['🎉', '🎊', '🎈', 'congratulations', 'amazing', 'fantastic', 'brilliant', 'excellent', 'wonderful', 'incredible', 'outstanding', 'perfect', 'success', 'achievement', 'victory', 'win', 'yay', 'woohoo', 'hooray'],
    emojis: ['🎉', '🎊', '🎈', '🎆', '🎇', '✨', '🌟', '💫', '🎪', '🎨', '🎭', '🎪'],
    effects: {
      mood: 'energetic',
      party: true,
      confetti: true
    },
    intensity: 'intense'
  },
  
  // Excitement & Enthusiasm
  {
    keywords: ['excited', 'thrilled', 'pumped', 'stoked', 'awesome', 'epic', 'mind-blowing', 'revolutionary', 'breakthrough', 'innovative', 'cutting-edge', 'next-level'],
    emojis: ['🚀', '⚡', '🔥', '💥', '🎯', '🏆', '💪', '🎪'],
    effects: {
      mood: 'energetic',
      party: true
    },
    intensity: 'moderate'
  },
  
  // Calm & Peaceful
  {
    keywords: ['peaceful', 'calm', 'serene', 'tranquil', 'zen', 'meditation', 'mindfulness', 'breathing', 'relax', 'chill', 'gentle', 'soft', 'quiet'],
    emojis: ['🧘', '🌸', '🍃', '🌊', '☮️', '🕊️', '🌿', '🍵', '🪷'],
    effects: {
      mood: 'zen'
    },
    intensity: 'subtle'
  },
  
  // Creativity & Imagination
  {
    keywords: ['creative', 'imaginative', 'artistic', 'inspired', 'visionary', 'innovative', 'original', 'unique', 'artistic', 'beautiful', 'aesthetic', 'design'],
    emojis: ['🎨', '🖼️', '🎭', '🎪', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺', '🎻'],
    effects: {
      mood: 'creative',
      rainbow: true
    },
    intensity: 'moderate'
  },
  
  // Mystery & Intrigue
  {
    keywords: ['mysterious', 'enigmatic', 'cryptic', 'secret', 'hidden', 'unknown', 'obscure', 'puzzling', 'intriguing', 'fascinating', 'curious', 'strange'],
    emojis: ['🔮', '✨', '🌟', '💫', '🌙', '⭐', '🔭', '🔬', '🧿', '⚗️'],
    effects: {
      mood: 'mysterious',
      matrix: true
    },
    intensity: 'moderate'
  },
  
  // Focus & Determination
  {
    keywords: ['focused', 'determined', 'concentrated', 'precise', 'accurate', 'detailed', 'thorough', 'systematic', 'methodical', 'analytical', 'logical'],
    emojis: ['🎯', '🔍', '📊', '📈', '📉', '📋', '📝', '✏️', '📚', '🔬'],
    effects: {
      mood: 'focused'
    },
    intensity: 'subtle'
  },
  
  // Playful & Fun
  {
    keywords: ['fun', 'playful', 'silly', 'goofy', 'wacky', 'hilarious', 'funny', 'humorous', 'entertaining', 'amusing', 'delightful', 'charming'],
    emojis: ['😄', '😆', '🤪', '😜', '🤡', '🎪', '🎭', '🎨', '🎪', '🎪'],
    effects: {
      mood: 'playful',
      confetti: true
    },
    intensity: 'moderate'
  },
  
  // Surprise & Shock
  {
    keywords: ['surprising', 'shocking', 'unexpected', 'astonishing', 'stunning', 'breathtaking', 'jaw-dropping', 'mind-boggling', 'incredible', 'unbelievable'],
    emojis: ['😱', '🤯', '💥', '⚡', '🔥', '💫', '✨', '🌟', '🎆'],
    effects: {
      mood: 'energetic',
      confetti: true,
      party: true
    },
    intensity: 'intense'
  }
];

export function detectEmotion(text: string): EmotionTrigger | null {
  const lowerText = text.toLowerCase();
  
  for (const trigger of emotionTriggers) {
    // Check keywords
    const hasKeyword = trigger.keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    // Check emojis
    const hasEmoji = trigger.emojis.some(emoji => 
      text.includes(emoji)
    );
    
    if (hasKeyword || hasEmoji) {
      return trigger;
    }
  }
  
  return null;
}

export function triggerEmotionEffects(trigger: EmotionTrigger) {
  const { toggleMatrix, toggleRainbow, toggleParty, setMood } = useMusaiMood();
  
  // Set mood if specified
  if (trigger.effects.mood) {
    setMood(trigger.effects.mood);
  }
  
  // Trigger effects based on intensity
  if (trigger.intensity === 'intense') {
    if (trigger.effects.party) toggleParty();
    if (trigger.effects.rainbow) toggleRainbow();
    if (trigger.effects.matrix) toggleMatrix();
  } else if (trigger.intensity === 'moderate') {
    // 50% chance for moderate effects
    if (trigger.effects.party && Math.random() > 0.5) toggleParty();
    if (trigger.effects.rainbow && Math.random() > 0.5) toggleRainbow();
    if (trigger.effects.matrix && Math.random() > 0.5) toggleMatrix();
  }
  // Subtle effects only change mood, no visual effects
}

export function analyzeAIResponse(response: string): {
  emotion: EmotionTrigger | null;
  shouldTrigger: boolean;
} {
  const emotion = detectEmotion(response);
  
  if (!emotion) {
    return { emotion: null, shouldTrigger: false };
  }
  
  // Determine if we should trigger based on intensity and randomness
  let shouldTrigger = false;
  
  switch (emotion.intensity) {
    case 'intense':
      shouldTrigger = Math.random() > 0.2; // 80% chance
      break;
    case 'moderate':
      shouldTrigger = Math.random() > 0.6; // 40% chance
      break;
    case 'subtle':
      shouldTrigger = Math.random() > 0.8; // 20% chance
      break;
  }
  
  return { emotion, shouldTrigger };
} 