import { useCallback } from 'react';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { analyzeAIResponse, triggerEmotionEffects, EmotionTrigger } from '@/lib/emotionDetector';

export function useEmotionEffects() {
  const { toggleMatrix, toggleRainbow, toggleParty, setMood } = useMusaiMood();

  const processAIResponse = useCallback((response: string) => {
    const { emotion, shouldTrigger } = analyzeAIResponse(response);
    
    if (emotion && shouldTrigger) {
      // Set mood if specified
      if (emotion.effects.mood) {
        setMood(emotion.effects.mood);
      }
      
      // Trigger effects based on intensity
      if (emotion.intensity === 'intense') {
        if (emotion.effects.party) toggleParty();
        if (emotion.effects.rainbow) toggleRainbow();
        if (emotion.effects.matrix) toggleMatrix();
      } else if (emotion.intensity === 'moderate') {
        // 50% chance for moderate effects
        if (emotion.effects.party && Math.random() > 0.5) toggleParty();
        if (emotion.effects.rainbow && Math.random() > 0.5) toggleRainbow();
        if (emotion.effects.matrix && Math.random() > 0.5) toggleMatrix();
      }
      // Subtle effects only change mood, no visual effects
      
      return {
        triggered: true,
        emotion: emotion,
        effects: emotion.effects
      };
    }
    
    return {
      triggered: false,
      emotion: null,
      effects: null
    };
  }, [setMood, toggleMatrix, toggleRainbow, toggleParty]);

  const triggerManualEffect = useCallback((effectType: 'party' | 'rainbow' | 'matrix' | 'confetti') => {
    switch (effectType) {
      case 'party':
        toggleParty();
        break;
      case 'rainbow':
        toggleRainbow();
        break;
      case 'matrix':
        toggleMatrix();
        break;
      case 'confetti':
        // Confetti is part of party effect
        toggleParty();
        break;
    }
  }, [toggleMatrix, toggleRainbow, toggleParty]);

  return {
    processAIResponse,
    triggerManualEffect
  };
} 