// Centralized UI strings (resx-style), grouped by Musai module/tab
// Add per-module strings here to ensure copy is unique per section

import { APP_TERMS } from '@/config/constants';

export type ModuleUiStrings = {
  sidebarTitle: string;
  newSessionText: string;
};

export const UI_STRINGS: {
  defaults: ModuleUiStrings;
  musai: Partial<Record<string, ModuleUiStrings>>;
} = {
  // Fallbacks when a module does not specify its own copy
  defaults: {
    sidebarTitle: 'Library',
    newSessionText: 'Create a Thread'
  },
  // Per-module overrides (grouped by tab id)
  musai: {
    [APP_TERMS.TAB_CHAT]: {
      sidebarTitle: 'Chat Sessions',
      newSessionText: 'New Chat'
    },
    [APP_TERMS.TAB_SEARCH]: {
      sidebarTitle: 'Search History',
      newSessionText: 'New Search'
    },
    [APP_TERMS.TAB_EYE]: {
      sidebarTitle: 'Eye Sessions',
      newSessionText: 'New Eye Session'
    },
    [APP_TERMS.TAB_CODE]: {
      sidebarTitle: 'Development Sessions',
      newSessionText: 'New Dev Session'
    },
    [APP_TERMS.TAB_UNIVERSITY]: {
      sidebarTitle: 'Courses',
      newSessionText: 'Create Course'
    },
    [APP_TERMS.TAB_THERAPY]: {
      sidebarTitle: 'Therapy Sessions',
      newSessionText: 'New Therapy Session'
    },
    [APP_TERMS.TAB_NARRATIVE]: {
      sidebarTitle: 'Narrative Sessions',
      newSessionText: 'New MusaiTale'
    },
    [APP_TERMS.TAB_CAREER]: {
      sidebarTitle: 'Career Sessions',
      newSessionText: 'New Career Session'
    },
    [APP_TERMS.TAB_MEDICAL]: {
      sidebarTitle: 'Medical Sessions',
      newSessionText: 'New Medical Session'
    },
    [APP_TERMS.TAB_TASK]: {
      sidebarTitle: 'Sprints',
      newSessionText: 'New Sprint'
    }
  }
};



