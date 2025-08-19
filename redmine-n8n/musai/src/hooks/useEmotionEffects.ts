import { useCallback } from 'react';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { analyzeAIResponse, triggerEmotionEffects, EmotionTrigger } from '@/lib/emotionDetector';

export function useEmotionEffects() {
  const { toggleMatrix, toggleRainbow, toggleParty, setMood } = useMusaiMood();

  const processAIResponse = useCallback((response: string) => {
    // Respect global effects toggle
    if ((window as any).__musai_effects_enabled === false) {
      return { triggered: false, emotion: null, effects: null } as const;
    }
    const { emotion, shouldTrigger } = analyzeAIResponse(response);
    
    if (emotion && shouldTrigger) {
      // Set mood if specified
      if (emotion.effects.mood) {
        setMood(emotion.effects.mood);
      }
      
      // Trigger effects once per response: trigger distinct set without loops/repeats
      const toTrigger: Array<'party' | 'rainbow' | 'matrix'> = [];
      if (emotion.effects.party) toTrigger.push('party');
      if (emotion.effects.rainbow) toTrigger.push('rainbow');
      if (emotion.effects.matrix) toTrigger.push('matrix');
      // Shuffle lightly to avoid the same ordering pattern
      toTrigger.sort((a, b) => (a > b ? 1 : -1));
      for (const eff of toTrigger) {
        if (eff === 'party') toggleParty();
        if (eff === 'rainbow') toggleRainbow();
        if (eff === 'matrix') toggleMatrix();
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