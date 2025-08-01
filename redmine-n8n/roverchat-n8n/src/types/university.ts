// Central type definitions for Musai University

export interface LectureStep 
{
  title: string;
  description: string;
}

export interface QuizQuestion 
{
  question: string;
  choices: string[];
  correctIndex: number;
}

export interface ChatMessage 
{
  role: 'user' | 'agent';
  message: string;
  timestamp: string;
}

export interface LectureStepContent 
{
  title: string;
  content: string; // markdown or html
  quiz: QuizQuestion[];
  chat: ChatMessage[];
  completed: boolean;
  quizPassed: boolean;
}

// Legacy Lecture interface for backward compatibility
export interface Lecture 
{
  id: string;
  title: string;
  topic: string;
  status: 'planning' | 'in_progress' | 'complete';
  steps: LectureStepContent[];
  currentStep: number;
  passThreshold: number;
  overallScore: number;
  exported: boolean;
  createdAt: string;
  updatedAt: string;
}

// New Course-based system types
export interface CourseMetadata 
{
  id: string;
  title: string;
  description: string;
  instructor: string;
  imagePath?: string;
  passThreshold: number; // Default 50%
  processorFile?: ProcessorFile;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLecture 
{
  id: string;
  title: string;
  summary: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
  content?: string; // markdown content
  quiz?: QuizQuestion[];
  quizAttempts: QuizAttempt[];
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt 
{
  id: string;
  answers: number[];
  score: number;
  passed: boolean;
  timestamp: string;
}

export interface Course 
{
  metadata: CourseMetadata;
  lectures: CourseLecture[];
  currentLectureIndex: number;
  overallProgress: number;
  completedLectures: number;
}

export interface ProcessorFile 
{
  teachingStyle: string;
  persona: string;
  tone: 'socratic' | 'poetic' | 'technical' | 'conversational';
  customInstructions?: string;
}

export interface CourseFolderStructure 
{
  coursePath: string;
  metaJson: CourseMetadata;
  sysbusJson: { id: string; routing: string };
  processorJson?: ProcessorFile;
  lecturesPath: string;
}

export interface StandaloneLecture 
{
  id: string;
  title: string;
  content: string;
  quiz: QuizQuestion[];
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface UniversityState 
{
  courses: Course[];
  standaloneLectures: StandaloneLecture[];
  currentCourse: Course | null;
  currentLecture: CourseLecture | null;
  isLoading: boolean;
  error: string | null;
}

export type UniversityTab = 'lecture' | 'chat' | 'quiz' | 'syllabus';

export interface TabState 
{
  activeTab: UniversityTab;
  lockedTabs: Set<UniversityTab>;
}

// Quiz status indicators
export type QuizStatus = 'unwritten' | 'available' | 'passed' | 'failed';

// Course creation flow types
export interface CourseCreationRequest 
{
  title: string;
  description: string;
  instructor: string;
  imagePath?: string;
  passThreshold?: number;
  processorFile?: ProcessorFile;
}

export interface LectureGenerationRequest 
{
  courseId: string;
  lectureIndex: number;
  lectureTitle: string;
  previousLectureContext?: string;
  processorFile?: ProcessorFile;
}

export interface QuizGenerationRequest 
{
  courseId: string;
  lectureId: string;
  lectureContent: string;
  processorFile?: ProcessorFile;
}