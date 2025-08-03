import axios from 'axios';
import type { 
  Course, 
  CourseMetadata, 
  CourseLecture, 
  QuizAttempt, 
  ProcessorFile, 
  CourseCreationRequest,
  LectureGenerationRequest,
  QuizGenerationRequest,
  StandaloneLecture,
  QuizQuestion,
  ChatMessage
} from '@/types/university';

// Base URL for n8n endpoints - adjust as needed
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || '/api/n8n';

// Types for the university system
export interface LectureStep 
{
  title: string;
  description: string;
}

export interface LecturePlan 
{
  steps: LectureStep[];
}

export interface LectureContent 
{
  id: string;
  title: string;
  content: string; // markdown or html
  quiz: QuizQuestion[];
}

export interface Lecture 
{
  id: string;
  title: string;
  status: 'planning' | 'in_progress' | 'complete';
  steps: Array<{
    title: string;
    content: string;
    quiz: QuizQuestion[];
    chat: ChatMessage[];
  }>;
  passThreshold: number;
  score: number;
  exported: boolean;
  createdAt: string;
}

export interface QuizResult 
{
  score: number;
  correct: boolean[];
  passed: boolean;
}

export interface ChatResponse 
{
  reply: string;
}

// API Service Class
class UniversityApiService 
{
  private axiosInstance;

  constructor() 
  {
    this.axiosInstance = axios.create({
      baseURL: N8N_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ===== COURSE-BASED SYSTEM METHODS =====

  // Automation A: Course Creation
  async createCourse(request: CourseCreationRequest): Promise<Course> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/course/create', request);
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error creating course:', error);
      // Return mock data for development
      const courseId = `course-${Date.now()}`;
      const now = new Date().toISOString();
      
      const course: Course = {
        metadata: {
          id: courseId,
          title: request.title,
          description: request.description,
          instructor: request.instructor,
          imagePath: request.imagePath,
          passThreshold: request.passThreshold || 50,
          createdAt: now,
          updatedAt: now
        },
        lectures: [
          {
            id: `${courseId}-lecture-1`,
            title: "Introduction to " + request.title,
            summary: "Overview and foundations of the course",
            status: 'unlocked',
            quizAttempts: [],
            chatHistory: [],
            createdAt: now,
            updatedAt: now
          },
          {
            id: `${courseId}-lecture-2`,
            title: "Core Concepts",
            summary: "Key principles and theoretical foundations",
            status: 'locked',
            quizAttempts: [],
            chatHistory: [],
            createdAt: now,
            updatedAt: now
          },
          {
            id: `${courseId}-lecture-3`,
            title: "Practical Applications",
            summary: "Real-world examples and hands-on practice",
            status: 'locked',
            quizAttempts: [],
            chatHistory: [],
            createdAt: now,
            updatedAt: now
          }
        ],
        currentLectureIndex: 0,
        overallProgress: 0,
        completedLectures: 0
      };

      // Save to local storage
      await this.saveCourse(course);
      return course;
    }
  }

  // New method: Generate course from topic using n8n
  async generateCourseFromTopic(topic: string): Promise<{
    title: string;
    description: string;
    instructor: string;
    syllabus: Array<{
      title: string;
      summary: string;
      duration: string;
    }>;
    estimatedDuration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  }> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/course/generate-from-topic', {
        topic,
        includeSyllabus: true,
        includeMetadata: true
      });
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error generating course from topic:', error);
      // Return mock data for development
      const mockInstructors = [
        'Dr. Quantum Mind',
        'Professor Neural Flow',
        'Dr. Cognitive Architect',
        'Professor Synaptic Bridge',
        'Dr. Emergent Intelligence'
      ];
      
      const mockDifficulties = ['beginner', 'intermediate', 'advanced'] as const;
      const mockTags = ['AI', 'Technology', 'Science', 'Philosophy', 'Psychology'];
      
      return {
        title: `Introduction to ${topic}`,
        description: `A comprehensive course exploring the fundamentals and advanced concepts of ${topic}. This course combines theoretical foundations with practical applications, designed to take you from basic understanding to mastery of the subject matter.`,
        instructor: mockInstructors[Math.floor(Math.random() * mockInstructors.length)],
        syllabus: [
          {
            title: `Introduction to ${topic}`,
            summary: `Overview of key concepts and foundational principles`,
            duration: '45 min'
          },
          {
            title: 'Core Principles and Theories',
            summary: `Deep dive into the fundamental theories and frameworks`,
            duration: '60 min'
          },
          {
            title: 'Practical Applications',
            summary: `Real-world examples and hands-on implementation`,
            duration: '75 min'
          },
          {
            title: 'Advanced Concepts',
            summary: `Complex topics and cutting-edge developments`,
            duration: '90 min'
          },
          {
            title: 'Integration and Synthesis',
            summary: `Bringing everything together and next steps`,
            duration: '60 min'
          }
        ],
        estimatedDuration: '5 hours',
        difficulty: mockDifficulties[Math.floor(Math.random() * mockDifficulties.length)],
        tags: mockTags.slice(0, 3)
      };
    }
  }

  // Automation B: Lecture Generation
  async generateLecture(request: LectureGenerationRequest): Promise<CourseLecture> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/lecture/generate', request);
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error generating lecture:', error);
      // Return mock data for development
      const now = new Date().toISOString();
      
      const lecture: CourseLecture = {
        id: `${request.courseId}-lecture-${request.lectureIndex + 1}`,
        title: request.lectureTitle,
        summary: `Generated lecture content for ${request.lectureTitle}`,
        status: 'unlocked',
        content: `# ${request.lectureTitle}\n\n## Learning Objectives\n- Understand key concepts\n- Apply knowledge practically\n- Evaluate different approaches\n\n## Content\nThis is a sample lecture content that would be generated by the AI agent based on the course context and processor file.\n\n### Key Points\n- Point 1: Important concept\n- Point 2: Another important concept\n- Point 3: Practical application\n\n## Summary\nThis lecture covers the fundamental concepts and prepares you for the next module.`,
        quiz: [
          {
            question: "What is the main topic of this lecture?",
            choices: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 0
          },
          {
            question: "Which concept is most important?",
            choices: ["Concept A", "Concept B", "Concept C", "Concept D"],
            correctIndex: 1
          }
        ],
        quizAttempts: [],
        chatHistory: [],
        createdAt: now,
        updatedAt: now
      };

      return lecture;
    }
  }

  // Automation C: Quiz Generation
  async generateQuiz(request: QuizGenerationRequest): Promise<QuizQuestion[]> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/quiz/generate', request);
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error generating quiz:', error);
      // Return mock data for development
      return [
        {
          question: "What is the primary focus of this lecture?",
          choices: ["Theory", "Practice", "Both", "Neither"],
          correctIndex: 2
        },
        {
          question: "Which approach is recommended?",
          choices: ["Approach A", "Approach B", "Approach C", "Approach D"],
          correctIndex: 1
        }
      ];
    }
  }

  // Submit quiz answers
  async submitQuizAnswers(lectureId: string, answers: number[]): Promise<QuizAttempt> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/quiz/submit', { 
        lectureId, 
        answers 
      });
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error submitting quiz:', error);
      // Return mock data for development
      const score = answers.reduce((acc, answer, index) => {
        return acc + (answer === index ? 1 : 0); // Mock: correct answer is same as index
      }, 0) / answers.length;

      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}`,
        answers,
        score,
        passed: score >= 0.5,
        timestamp: new Date().toISOString()
      };

      return attempt;
    }
  }

  // Course management
  async getCourses(): Promise<Course[]> 
  {
    try 
    {
      const stored = localStorage.getItem('musai-university-courses');
      return stored ? JSON.parse(stored) : [];
    } 
    catch (error) 
    {
      console.error('Error loading courses:', error);
      return [];
    }
  }

  async saveCourse(course: Course): Promise<void> 
  {
    try 
    {
      const courses = await this.getCourses();
      const existingIndex = courses.findIndex(c => c.metadata.id === course.metadata.id);
      
      if (existingIndex >= 0) 
      {
        courses[existingIndex] = course;
      } 
      else 
      {
        courses.push(course);
      }
      
      localStorage.setItem('musai-university-courses', JSON.stringify(courses));
    } 
    catch (error) 
    {
      console.error('Error saving course:', error);
    }
  }

  async getCourse(courseId: string): Promise<Course | null> 
  {
    try 
    {
      const courses = await this.getCourses();
      return courses.find(c => c.metadata.id === courseId) || null;
    } 
    catch (error) 
    {
      console.error('Error loading course:', error);
      return null;
    }
  }

  // Standalone lectures management
  async getStandaloneLectures(): Promise<StandaloneLecture[]> 
  {
    try 
    {
      const stored = localStorage.getItem('musai-university-standalone-lectures');
      return stored ? JSON.parse(stored) : [];
    } 
    catch (error) 
    {
      console.error('Error loading standalone lectures:', error);
      return [];
    }
  }

  async saveStandaloneLecture(lecture: StandaloneLecture): Promise<void> 
  {
    try 
    {
      const lectures = await this.getStandaloneLectures();
      const existingIndex = lectures.findIndex(l => l.id === lecture.id);
      
      if (existingIndex >= 0) 
      {
        lectures[existingIndex] = lecture;
      } 
      else 
      {
        lectures.push(lecture);
      }
      
      localStorage.setItem('musai-university-standalone-lectures', JSON.stringify(lectures));
    } 
    catch (error) 
    {
      console.error('Error saving standalone lecture:', error);
    }
  }

  // ===== LEGACY LECTURE METHODS (for backward compatibility) =====

  // Agent 1: Create/refine syllabus for course
  async createLecturePlan(topic: string): Promise<LecturePlan> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/start-planner', { topic });
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error creating lecture plan:', error);
      // Return mock data for development
      return {
        steps: [
          { title: "Introduction to " + topic, description: "Overview and foundations" },
          { title: "Core Concepts", description: "Key principles and theory" },
          { title: "Practical Applications", description: "Real-world examples and use cases" },
          { title: "Advanced Topics", description: "Deep dive into complex scenarios" },
          { title: "Summary and Next Steps", description: "Recap and further learning paths" }
        ]
      };
    }
  }

  // Agent 2: Generate lecture content from approved plan
  async generateLectureContent(steps: LectureStep[]): Promise<LectureContent> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/generate-lecture', { steps });
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error generating lecture content:', error);
      // Return mock data for development
      return {
        id: `lecture-${Date.now()}`,
        title: steps[0]?.title || "Generated Lecture",
        content: `# ${steps[0]?.title || "Generated Lecture"}\n\nThis is a sample lecture content that would be generated by the AI agent.\n\n## Learning Objectives\n- Understand key concepts\n- Apply knowledge practically\n- Evaluate different approaches\n\n## Content\nDetailed lecture content would appear here...`,
        quiz: [
          {
            question: "What is the main topic of this lecture?",
            choices: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 0
          }
        ]
      };
    }
  }

  // Agent 3: Learning Q&A chat
  async sendChatMessage(stepId: string, question: string): Promise<ChatResponse> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/chat', { 
        stepId, 
        question 
      });
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error sending chat message:', error);
      // Return mock data for development
      return {
        reply: `Thank you for your question about "${question}". This is a sample response from the AI tutor. In a real implementation, this would provide contextual help based on the current lecture step.`
      };
    }
  }

  // Agent 4: Generate and grade quiz
  async submitQuiz(stepId: string, answers: number[]): Promise<QuizResult> 
  {
    try 
    {
      const response = await this.axiosInstance.post('/quiz', { 
        stepId, 
        answers 
      });
      return response.data;
    } 
    catch (error) 
    {
      console.error('Error submitting quiz:', error);
      // Return mock data for development
      const correct = answers.map((_, index) => index === 0); // Mock: first answer is always correct
      const score = correct.filter(Boolean).length / correct.length;
      return {
        score,
        correct,
        passed: score >= 0.5
      };
    }
  }

  // Local storage management for lectures
  async getLectures(): Promise<Lecture[]> 
  {
    try 
    {
      const stored = localStorage.getItem('musai-university-lectures');
      return stored ? JSON.parse(stored) : [];
    } 
    catch (error) 
    {
      console.error('Error loading lectures:', error);
      return [];
    }
  }

  async saveLecture(lecture: Lecture): Promise<void> 
  {
    try 
    {
      const lectures = await this.getLectures();
      const existingIndex = lectures.findIndex(l => l.id === lecture.id);
      
      if (existingIndex >= 0) 
      {
        lectures[existingIndex] = lecture;
      } 
      else 
      {
        lectures.push(lecture);
      }
      
      localStorage.setItem('musai-university-lectures', JSON.stringify(lectures));
    } 
    catch (error) 
    {
      console.error('Error saving lecture:', error);
    }
  }

  async deleteLecture(lectureId: string): Promise<void> 
  {
    try 
    {
      const lectures = await this.getLectures();
      const filtered = lectures.filter(l => l.id !== lectureId);
      localStorage.setItem('musai-university-lectures', JSON.stringify(filtered));
    } 
    catch (error) 
    {
      console.error('Error deleting lecture:', error);
    }
  }

  async deleteCourse(courseId: string): Promise<void> 
  {
    try 
    {
      const courses = await this.getCourses();
      const filtered = courses.filter(c => c.metadata.id !== courseId);
      localStorage.setItem('musai-university-courses', JSON.stringify(filtered));
    } 
    catch (error) 
    {
      console.error('Error deleting course:', error);
    }
  }
}

export const universityApi = new UniversityApiService();