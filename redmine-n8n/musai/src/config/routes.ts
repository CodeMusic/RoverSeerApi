/**
 * Application routing configuration
 * Centralized route definitions for easy maintenance and customization
 */

export const ROUTES = {
  // Main application routes
  HOME: '/',
  MAIN_APP: '/musai',
  
  // Marketing/Info pages
  PLAYGROUND: '/playground',
  CODE_PLAYGROUND: '/code-musai',
  CODE_MUSAI_INFO: '/code-musai/info',
  UNIVERSITY_INFO: '/university/info',
  NEUROSCIENCE: '/neuroscience',
  MEET_MUSAI: '/meet-musai',
  FIND_YOUR_MUSE: '/find-your-muse',
  LOCAL_AI: '/local-ai',
  ROVERBYTE: '/roverbyte',
  EYE_OF_MUSAI: '/eye-of-musai',
  CAREER_MUSAI: '/career-musai',
  THERAPY_MUSAI: '/therapy-musai',
  MEDICAL_MUSAI: '/medical-musai',
  MEDICAL_MUSAI_DEMO: '/medical-musai/demo',
  EMERGENT_NARRATIVE: '/emergent-narrative',
  TASK_MUSAI: '/task-musai',
  CURATIONS_INFO: '/curations/info',
  MUSAI_STUDIO_INFO: '/musai-studio/info',
  MUSAI_STUDIO: '/musai-studio',
  ROADMAP: '/roadmap',
  
  // University routes
  UNIVERSITY: '/university',
  UNIVERSITY_LECTURE_NEW: '/university/lecture/new',
  UNIVERSITY_LECTURE_VIEW: '/university/lecture/:id',
  UNIVERSITY_COURSE_NEW: '/university/course/new',
  UNIVERSITY_COURSE_VIEW: '/university/course/:courseId',
  
  // AI-generated content
  CURATIONS: '/curations',
  
  // Utility
  NOT_FOUND: '*'
} as const;

/**
 * Helper functions for route construction
 */
export const createRouteWithParams = (route: string, params: Record<string, string>) => {
  let result = route;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
};

/**
 * Route utilities for navigation
 */
export const RouteUtils = {
  // Main app routes with mode/tab support
  mainAppWithMode: (mode: string, query?: string) => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (query) params.set('q', query);
    return `${ROUTES.MAIN_APP}?${params.toString()}`;
  },
  
  // University routes
  universityLecture: (id: string) => createRouteWithParams(ROUTES.UNIVERSITY_LECTURE_VIEW, { id }),
  universityCourse: (courseId: string) => createRouteWithParams(ROUTES.UNIVERSITY_COURSE_VIEW, { courseId }),
  
  // Check if current path is main app
  isMainApp: (pathname: string) => pathname === ROUTES.MAIN_APP,
};

export default ROUTES;