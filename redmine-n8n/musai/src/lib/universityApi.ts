import axios from 'axios';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { withN8nAuthHeaders, ensureN8nSessionInBody } from '@/lib/n8nClient';
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
  ChatMessage,
  CourseExam,
  ExamType,
  Lecture,
  LectureStep
} from '@/types/university';
import { getRandomWittyError } from '@/config/messages';

// Base URL for n8n endpoints - prefer Vite proxy in development to avoid CORS
const N8N_BASE_URL = N8N_ENDPOINTS.BASE_URL;

const inMemoryUniversityStore = {
  courses: [] as Course[],
  standaloneLectures: [] as StandaloneLecture[]
};

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

// Use Lecture type from '@/types/university'

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

    // Ensure Basic Auth and identity headers are applied for all requests to n8n
    this.axiosInstance.interceptors.request.use((config) => {
      config.headers = withN8nAuthHeaders(config.headers as any) as any;

      // Inject sessionId into JSON body for non-GETs, mirroring chat behavior
      const method = String(config.method || 'get').toLowerCase();
      if (method !== 'get')
      {
        const contentType = (config.headers as any)?.['Content-Type'] || (config.headers as any)?.['content-type'] || 'application/json';
        try
        {
          const originalBody = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? {});
          const { updatedBody, headerSessionId } = ensureN8nSessionInBody(originalBody, contentType);
          // Update body
          config.data = contentType.includes('application/json') ? JSON.parse(updatedBody) : updatedBody;
          // Ensure header reflects the computed session id
          (config.headers as any)['X-Musai-Session-Id'] = headerSessionId;
        }
        catch
        {
          // no-op; fall back to existing body if transformation fails
        }
      }
      return config;
    });
  }

  // ===== COURSE-BASED SYSTEM METHODS =====

  // Normalize n8n-like payloads that may be arrays or contain stringified JSON in an "output" field
  private parseN8nLikePayload(raw: any): any
  {
    // Cognition: robustly interpret n8n outputs, including code-fenced JSON strings
    const tryParse = (value: unknown): any =>
    {
      if (typeof value !== 'string')
      {
        return value;
      }

      const stripCodeFence = (text: string): string =>
      {
        const trimmed = text.trim();
        if (!trimmed.startsWith('```'))
        {
          return text;
        }
        // Remove leading ```lang (optional) and trailing ```
        const firstFenceEnd = trimmed.indexOf('\n');
        const withoutHead = firstFenceEnd >= 0 ? trimmed.slice(firstFenceEnd + 1) : trimmed.replace(/^```+[^\n]*\n?/, '');
        const lastFence = withoutHead.lastIndexOf('```');
        const inner = lastFence >= 0 ? withoutHead.slice(0, lastFence) : withoutHead;
        return inner.trim();
      };

      // First, attempt raw JSON parse
      try
      {
        return JSON.parse(value);
      }
      catch
      {
        // If the string is code-fenced (e.g., ```json ... ```), strip and retry
        const unfenced = stripCodeFence(value);
        if (unfenced !== value)
        {
          try
          {
            return JSON.parse(unfenced);
          }
          catch
          {
            // fall through
          }
        }
        return value;
      }
    };

    if (Array.isArray(raw) && raw.length > 0)
    {
      const first = raw[0];
      if (first && typeof first === 'object')
      {
        if ('output' in first)
        {
          return tryParse((first as any).output);
        }
        if ('content' in first)
        {
          return tryParse((first as any).content);
        }
        return first;
      }
      if (typeof first === 'string')
      {
        return tryParse(first);
      }
    }

    if (raw && typeof raw === 'object')
    {
      const obj = raw as any;
      if (obj.output !== undefined)
      {
        return tryParse(obj.output);
      }
      if (obj.content !== undefined)
      {
        return tryParse(obj.content);
      }
      return obj;
    }

    if (typeof raw === 'string')
    {
      // If the payload is a JSON string (possibly an array with { output }),
      // parse it and then re-run normalization to unwrap common wrappers.
      const parsed = tryParse(raw);
      if (parsed === raw)
      {
        return raw;
      }
      return this.parseN8nLikePayload(parsed);
    }

    return raw;
  }

  // Coerce arbitrary response shapes into the GeneratedCourseData structure the UI expects
  private coerceCourseFromTopicSchema(data: any): {
    title: string;
    description: string;
    instructor: string;
    syllabus: Array<{ title: string; summary: string; duration: string }>;
    estimatedDuration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  }
  {
    // Some workflows return { name, parameters: { ...actual fields... } }
    const src = (data && typeof data === 'object' && (data as any).parameters && typeof (data as any).parameters === 'object')
      ? (data as any).parameters
      : data;

    const title = (src?.title || src?.courseTitle || '').toString() || 'New Course';
    const description = (src?.description || src?.summary || '').toString();
    const instructor = (src?.instructor || 'Musai Instructor').toString();

    const rawSyllabus = Array.isArray(src?.syllabus) ? src.syllabus
      : Array.isArray(src?.lectures) ? src.lectures
      : [];
    const syllabus = rawSyllabus.map((item: any) =>
    {
      // Normalize alternate key names like "lecture topic"
      const t = (item?.title || item?.['lecture topic'] || item?.topic || 'Untitled').toString();
      const s = (item?.summary || item?.description || '').toString();
      const d = (item?.duration || item?.estimatedDuration || '45 min').toString();
      return { title: t, summary: s, duration: d };
    });

    const estimatedDuration = (src?.estimatedDuration || (syllabus.length > 0 ? `${syllabus.length * 45} min` : '45 min')).toString();
    const difficulty = (src?.difficulty || 'beginner') as 'beginner' | 'intermediate' | 'advanced';
    const tags = Array.isArray(src?.tags) ? src.tags.map((t: any) => String(t)) : [];

    return {
      title,
      description,
      instructor,
      syllabus,
      estimatedDuration,
      difficulty,
      tags
    };
  }

  private normalizeQuizQuestions(raw: any): QuizQuestion[] | undefined
  {
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : undefined;
    if (!list || list.length === 0)
    {
      return undefined;
    }
    const normalized = list.map((item: any, index: number): QuizQuestion =>
    {
      const questionText = (item?.question || item?.prompt || `Question ${index + 1}`).toString();
      const rawChoices = Array.isArray(item?.choices)
        ? item.choices
        : Array.isArray(item?.options)
          ? item.options
          : Array.isArray(item?.answers)
            ? item.answers
            : [];
      const choices = rawChoices.length > 0
        ? rawChoices.map((choice: any) => choice?.toString?.() ?? String(choice))
        : ['True', 'False'];
      const deriveIndex = (): number =>
      {
        if (typeof item?.correctIndex === 'number') return item.correctIndex;
        if (typeof item?.answerIndex === 'number') return item.answerIndex;
        if (typeof item?.correct === 'number') return item.correct;
        if (typeof item?.correct === 'string')
        {
          const idx = choices.findIndex(choice => choice.toLowerCase() === item.correct.toLowerCase());
          return idx >= 0 ? idx : 0;
        }
        if (typeof item?.answer === 'string')
        {
          const idx = choices.findIndex(choice => choice.toLowerCase() === item.answer.toLowerCase());
          return idx >= 0 ? idx : 0;
        }
        return 0;
      };
      const correctIndex = deriveIndex();
      return {
        question: questionText,
        choices,
        correctIndex: correctIndex >= 0 && correctIndex < choices.length ? correctIndex : 0
      };
    });
    return normalized;
  }

  private normalizeQuizAttempts(raw: any): QuizAttempt[]
  {
    if (!Array.isArray(raw))
    {
      return [];
    }
    return raw.map((attempt: any, index: number): QuizAttempt =>
    {
      const answersSource = Array.isArray(attempt?.answers)
        ? attempt.answers
        : Array.isArray(attempt?.selected)
          ? attempt.selected
          : [];
      const answers = answersSource.map((value: any) => Number(value));
      const timestamp = typeof attempt?.timestamp === 'string' ? attempt.timestamp : new Date().toISOString();
      const score = typeof attempt?.score === 'number' ? attempt.score : Number(attempt?.percent ?? attempt?.percentage ?? 0);
      const passed = Boolean(attempt?.passed ?? attempt?.pass ?? (score >= 70));
      return {
        id: (attempt?.id || `attempt-${Date.now()}-${index}`).toString(),
        answers,
        score,
        passed,
        timestamp,
      };
    });
  }

  private normalizeChatHistory(raw: any): ChatMessage[]
  {
    if (!Array.isArray(raw))
    {
      return [];
    }
    return raw.map((message: any): ChatMessage =>
    {
      const role = message?.role === 'user' ? 'user' : 'agent';
      const content = (message?.message || message?.content || '').toString();
      const timestamp = typeof message?.timestamp === 'string' ? message.timestamp : new Date().toISOString();
      return {
        role,
        message: content,
        timestamp
      };
    }).filter(msg => Boolean(msg.message));
  }

  private coerceCourseLecture(data: any, request: LectureGenerationRequest): CourseLecture
  {
    const now = new Date().toISOString();
    const source = (data && typeof data === 'object' && (data as any).parameters && typeof (data as any).parameters === 'object')
      ? (data as any).parameters
      : data;

    const id = (source?.id || source?.lectureId || `${request.courseId}-lecture-${request.lectureIndex + 1}-${Date.now()}`).toString();
    const title = (source?.title || source?.lectureTitle || request.lectureTitle || 'Generated Lecture').toString();
    const summary = (source?.summary || source?.description || source?.synopsis || `AI generated lecture for ${title}`).toString();
    const statusRaw = (source?.status || source?.state || 'unlocked').toString().toLowerCase();
    const allowedStatuses: Array<CourseLecture['status']> = ['locked', 'unlocked', 'in_progress', 'completed'];
    const status = (allowedStatuses.includes(statusRaw as CourseLecture['status']) ? statusRaw : 'unlocked') as CourseLecture['status'];

    const duration = (source?.duration || source?.estimatedDuration || '').toString();

    const deriveContent = (): string | undefined =>
    {
      if (typeof source?.content === 'string') return source.content;
      if (typeof source?.markdown === 'string') return source.markdown;
      if (typeof source?.html === 'string') return source.html;
      if (Array.isArray(source?.sections))
      {
        return source.sections.map((section: any) => section?.body || section?.content || '').join('\n\n');
      }
      return undefined;
    };

    const quiz = this.normalizeQuizQuestions(source?.quiz ?? source?.questions);
    const quizAttempts = this.normalizeQuizAttempts(source?.quizAttempts);
    const chatHistory = this.normalizeChatHistory(source?.chatHistory);

    const createdAt = typeof source?.createdAt === 'string' ? source.createdAt : now;
    const updatedAt = typeof source?.updatedAt === 'string' ? source.updatedAt : now;

    return {
      id,
      title,
      summary,
      status,
      duration: duration || undefined,
      content: deriveContent(),
      quiz: quiz && quiz.length > 0 ? quiz : undefined,
      quizAttempts,
      chatHistory,
      createdAt,
      updatedAt
    };
  }

  private normalizeCoursePayload(raw: any): Course
  {
    const now = new Date().toISOString();
    const metadataSource = (raw && typeof raw === 'object' && raw.metadata && typeof raw.metadata === 'object') ? raw.metadata : raw;
    const metadata: CourseMetadata = {
      id: (metadataSource?.id || raw?.id || `course-${Date.now()}`).toString(),
      title: (metadataSource?.title || raw?.title || 'New Course').toString(),
      description: (metadataSource?.description || metadataSource?.summary || raw?.description || '').toString(),
      instructor: (metadataSource?.instructor || raw?.instructor || 'Musai Instructor').toString(),
      imagePath: metadataSource?.imagePath || raw?.imagePath,
      passThreshold: typeof metadataSource?.passThreshold === 'number'
        ? metadataSource.passThreshold
        : typeof raw?.passThreshold === 'number'
          ? raw.passThreshold
          : 50,
      processorFile: metadataSource?.processorFile || raw?.processorFile,
      createdAt: metadataSource?.createdAt || now,
      updatedAt: metadataSource?.updatedAt || now
    };

    const rawLectures = Array.isArray(raw?.lectures) ? raw.lectures : [];
    const lectures: CourseLecture[] = rawLectures.map((lecture: any, index: number) =>
    {
      const lectureId = (lecture?.id || `${metadata.id}-lecture-${index + 1}`).toString();
      const lectureTitle = (lecture?.title || lecture?.name || `Lecture ${index + 1}`).toString();
      const lectureSummary = (lecture?.summary || lecture?.description || '').toString();
      const lectureDuration = (lecture?.duration || lecture?.estimatedDuration || '').toString();
      const statusCandidate = (lecture?.status || lecture?.state || (index === 0 ? 'unlocked' : 'locked')).toString().toLowerCase();
      const allowedStatuses: Array<CourseLecture['status']> = ['locked', 'unlocked', 'in_progress', 'completed'];
      const status = allowedStatuses.includes(statusCandidate as CourseLecture['status'])
        ? statusCandidate as CourseLecture['status']
        : (index === 0 ? 'unlocked' : 'locked');

      const content = typeof lecture?.content === 'string'
        ? lecture.content
        : typeof lecture?.markdown === 'string'
          ? lecture.markdown
          : typeof lecture?.html === 'string'
            ? lecture.html
            : undefined;

      const quiz = this.normalizeQuizQuestions(lecture?.quiz);
      const quizAttempts = this.normalizeQuizAttempts(lecture?.quizAttempts);
      const chatHistory = this.normalizeChatHistory(lecture?.chatHistory);

      return {
        id: lectureId,
        title: lectureTitle,
        summary: lectureSummary,
        status,
        content,
        quiz: quiz && quiz.length > 0 ? quiz : undefined,
        quizAttempts,
        chatHistory,
        createdAt: typeof lecture?.createdAt === 'string' ? lecture.createdAt : now,
        updatedAt: typeof lecture?.updatedAt === 'string' ? lecture.updatedAt : now,
        duration: lectureDuration || undefined
      };
    });

    const completedLectures = typeof raw?.completedLectures === 'number'
      ? raw.completedLectures
      : lectures.filter(l => l.status === 'completed').length;

    return {
      metadata,
      lectures,
      currentLectureIndex: typeof raw?.currentLectureIndex === 'number' ? raw.currentLectureIndex : 0,
      overallProgress: typeof raw?.overallProgress === 'number' ? raw.overallProgress : Math.round((completedLectures / Math.max(lectures.length, 1)) * 100),
      completedLectures,
      midtermExam: raw?.midtermExam,
      finalExam: raw?.finalExam
    };
  }

  // Automation A: Course Creation (local assembly using provided syllabus)
  async createCourse(request: CourseCreationRequest): Promise<Course> 
  {
    // Assemble the course locally to ensure the exact generated syllabus is preserved
    const courseId = `course-${Date.now()}`;
    const now = new Date().toISOString();

    const lecturesFromSyllabus = Array.isArray(request.syllabus) ? request.syllabus : [];
    const lectures = (lecturesFromSyllabus.length > 0
      ? lecturesFromSyllabus
      : []
    ).map((item, index): CourseLecture => ({
      id: `${courseId}-lecture-${index + 1}`,
      title: String(item.title || `Lecture ${index + 1}`),
      summary: String(item.summary || ''),
      duration: item.duration ? String(item.duration) : undefined,
      status: index === 0 ? 'unlocked' : 'locked',
      quizAttempts: [],
      chatHistory: [],
      createdAt: now,
      updatedAt: now
    }));

    const course: Course = {
      metadata: {
        id: courseId,
        title: request.title,
        description: request.description,
        instructor: request.instructor,
        imagePath: request.imagePath,
        passThreshold: request.passThreshold || 50,
        difficulty: request.difficulty,
        estimatedDuration: request.estimatedDuration,
        tags: request.tags,
        createdAt: now,
        updatedAt: now
      },
      lectures,
      currentLectureIndex: 0,
      overallProgress: 0,
      completedLectures: 0
    };

    const normalizedCourse = this.normalizeCoursePayload(course);
    await this.saveCourse(normalizedCourse);
    return normalizedCourse;
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
      const attemptRequest = async (endpoint: string) =>
      {
        const response = await this.axiosInstance.post(
          endpoint,
          {
            topic,
            includeSyllabus: true,
            includeMetadata: true
          },
          { timeout: 600000 }
        );
        const parsed = this.parseN8nLikePayload(response.data);
        return this.coerceCourseFromTopicSchema(parsed);
      };

      try
      {
        return await attemptRequest(N8N_ENDPOINTS.UNIVERSITY.GENERATE_COURSE_CONTENT);
      }
      catch (primaryError)
      {
        console.warn('Primary course generation endpoint failed, falling back', primaryError);
        return await attemptRequest('/course/generate-from-topic');
      }
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
    let courseContext: Course | null = null;
    try 
    {
      courseContext = await this.getCourse(request.courseId).catch(() => null);
      const lectureSummary = request.lectureSummary
        || courseContext?.lectures?.[request.lectureIndex]?.summary
        || `Develop a comprehensive lecture titled "${request.lectureTitle}".`;

      const descriptionParts: string[] = [lectureSummary];
      if (request.previousLectureContext)
      {
        descriptionParts.push(`Previous lecture context: ${request.previousLectureContext}`);
      }
      if (courseContext?.metadata?.description)
      {
        descriptionParts.push(`Course description: ${courseContext.metadata.description}`);
      }

      const processor = request.processorFile || courseContext?.metadata?.processorFile;
      if (processor)
      {
        const personaPieces: string[] = [];
        if (processor.persona) personaPieces.push(`Persona: ${processor.persona}`);
        if (processor.teachingStyle) personaPieces.push(`Teaching style: ${processor.teachingStyle}`);
        if (processor.tone) personaPieces.push(`Tone: ${processor.tone}`);
        if (personaPieces.length > 0)
        {
          descriptionParts.push(personaPieces.join(' | '));
        }
        if (processor.customInstructions)
        {
          descriptionParts.push(`Custom guidance: ${processor.customInstructions}`);
        }
      }

      const steps: LectureStep[] = [
        {
          title: request.lectureTitle,
          description: descriptionParts.filter(Boolean).join('\n\n')
        }
      ];

      const syllabusContext = courseContext?.lectures?.map((lecture) => ({
        title: lecture.title,
        summary: lecture.summary
      }));

      const lectureContent = await this.generateLectureContent(steps, {
        courseTitle: courseContext?.metadata?.title,
        courseDescription: courseContext?.metadata?.description,
        instructor: courseContext?.metadata?.instructor,
        tags: courseContext?.metadata?.processorFile ? [courseContext.metadata.processorFile.persona].filter(Boolean) : undefined,
        syllabus: syllabusContext,
        currentIndex: request.lectureIndex
      });

      const now = new Date().toISOString();
      const resolvedTitle = typeof lectureContent === 'object' && lectureContent && 'title' in lectureContent && lectureContent.title
        ? String((lectureContent as { title: unknown }).title)
        : request.lectureTitle;

      let resolvedContent = (() =>
      {
        if (typeof lectureContent === 'string')
        {
          return lectureContent;
        }
        if (lectureContent && typeof lectureContent === 'object')
        {
          const candidate = (lectureContent as any).content ?? (lectureContent as any).html ?? (lectureContent as any).markdown;
          if (typeof candidate === 'string' && candidate.trim().length > 0)
          {
            return candidate;
          }
        }
        return '';
      })();

      if (!resolvedContent || resolvedContent.trim().length === 0)
      {
        if (typeof lectureContent === 'string')
        {
          resolvedContent = lectureContent;
        }
        else if (lectureContent)
        {
          try
          {
            resolvedContent = JSON.stringify(lectureContent, null, 2);
          }
          catch
          {
            resolvedContent = '';
          }
        }
      }

      const resolvedDuration = (() =>
      {
        if (lectureContent && typeof lectureContent === 'object')
        {
          const candidate = (lectureContent as any).duration ?? (lectureContent as any).estimatedDuration;
          if (typeof candidate === 'string' && candidate.trim().length > 0)
          {
            return candidate;
          }
        }
        return courseContext?.lectures?.[request.lectureIndex]?.duration;
      })();

      const quiz = this.normalizeQuizQuestions(
        typeof lectureContent === 'object' && lectureContent ? (lectureContent as any).quiz : undefined
      );

      return {
        id: typeof lectureContent === 'object' && lectureContent && 'id' in lectureContent && lectureContent.id
          ? String((lectureContent as { id: unknown }).id)
          : `${request.courseId}-lecture-${request.lectureIndex + 1}-${Date.now()}`,
        title: resolvedTitle,
        summary: lectureSummary,
        status: 'unlocked',
        content: resolvedContent,
        duration: resolvedDuration || undefined,
        quiz: quiz && quiz.length > 0 ? quiz : undefined,
        quizAttempts: [],
        chatHistory: [],
        createdAt: now,
        updatedAt: now
      };
    } 
    catch (error) 
    {
      console.error('Error generating lecture:', error);
      // Return mock data for development
      const now = new Date().toISOString();
      
      return this.coerceCourseLecture({
        id: `${request.courseId}-lecture-${request.lectureIndex + 1}`,
        title: request.lectureTitle,
        summary: `Generated lecture content for ${request.lectureTitle}`,
        duration: courseContext?.lectures?.[request.lectureIndex]?.duration,
        status: 'unlocked',
        content: `# ${request.lectureTitle}\n\n## Learning Objectives\n- Understand key concepts\n- Apply knowledge practically\n- Evaluate different approaches\n\n## Content\nThis is a sample lecture content that would be generated by the AI agent based on the course context and processor file.\n\n### Key Points\n- Point 1: Important concept\n- Point 2: Another important concept\n- Point 3: Practical application\n\n## Summary\nThis lecture covers the fundamental concepts and prepares you for the next module.`,
        quiz: [
          {
            question: 'What is the main topic of this lecture?',
            choices: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: 0
          },
          {
            question: 'Which concept is most important?',
            choices: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
            correctIndex: 1
          }
        ],
        quizAttempts: [],
        chatHistory: [],
        createdAt: now,
        updatedAt: now
      }, request);
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

  // Exam Generation (Midterm/Final)
  async generateCourseExam(courseId: string, type: ExamType, lectureContents: string[]): Promise<CourseExam>
  {
    try 
    {
      // Exams can also run long; align with lecture timeout
      const response = await this.axiosInstance.post('/exam/generate', {
        courseId,
        type,
        lectureContents
      }, { timeout: 600000 });
      return response.data;
    }
    catch (error)
    {
      console.error('Error generating exam:', error);
      // Mock exam for development
      const now = new Date().toISOString();
      const questions: QuizQuestion[] = [
        {
          question: `Comprehensive question 1 (${type})`,
          choices: ['A', 'B', 'C', 'D'],
          correctIndex: 0
        },
        {
          question: `Comprehensive question 2 (${type})`,
          choices: ['A', 'B', 'C', 'D'],
          correctIndex: 1
        },
        {
          question: `Comprehensive question 3 (${type})`,
          choices: ['A', 'B', 'C', 'D'],
          correctIndex: 2
        }
      ];
      return {
        id: `${courseId}-${type}-${Date.now()}`,
        type,
        title: `${type === 'midterm' ? 'Midterm' : 'Final'} Exam`,
        questions,
        attempts: [],
        createdAt: now,
        updatedAt: now
      };
    }
  }

  async submitCourseExam(courseId: string, examId: string, answers: number[]): Promise<QuizAttempt>
  {
    try 
    {
      const response = await this.axiosInstance.post('/exam/submit', { courseId, examId, answers });
      return response.data;
    }
    catch (error)
    {
      console.error('Error submitting exam:', error);
      // Mock grading
      const score = answers.reduce((acc, answer, index) => acc + (answer === index % 4 ? 1 : 0), 0) / (answers.length || 1);
      return {
        id: `attempt-${Date.now()}`,
        answers,
        score,
        passed: score >= 0.6,
        timestamp: new Date().toISOString()
      };
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
      if (typeof window === 'undefined' || !window.localStorage)
      {
        return [...inMemoryUniversityStore.courses];
      }
      const stored = window.localStorage.getItem('musai-university-courses');
      if (!stored)
      {
        return [...inMemoryUniversityStore.courses];
      }
      const parsed = JSON.parse(stored) as Course[];
      inMemoryUniversityStore.courses = parsed;
      return parsed;
    } 
    catch (error) 
    {
      console.error('Error loading courses:', error);
      return [...inMemoryUniversityStore.courses];
    }
  }

  async saveCourse(course: Course): Promise<void> 
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

    inMemoryUniversityStore.courses = courses;

    try 
    {
      if (typeof window !== 'undefined' && window.localStorage)
      {
        window.localStorage.setItem('musai-university-courses', JSON.stringify(courses));
      }
    } 
    catch (error) 
    {
      console.error('Error saving course:', error);
      // fall back to in-memory store only
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
      if (typeof window === 'undefined' || !window.localStorage)
      {
        return [...inMemoryUniversityStore.standaloneLectures];
      }
      const stored = window.localStorage.getItem('musai-university-standalone-lectures');
      if (!stored)
      {
        return [...inMemoryUniversityStore.standaloneLectures];
      }
      const parsed = JSON.parse(stored) as StandaloneLecture[];
      inMemoryUniversityStore.standaloneLectures = parsed;
      return parsed;
    } 
    catch (error) 
    {
      console.error('Error loading standalone lectures:', error);
      return [...inMemoryUniversityStore.standaloneLectures];
    }
  }

  async saveStandaloneLecture(lecture: StandaloneLecture): Promise<void> 
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

    inMemoryUniversityStore.standaloneLectures = lectures;

    try 
    {
      if (typeof window !== 'undefined' && window.localStorage)
      {
        window.localStorage.setItem('musai-university-standalone-lectures', JSON.stringify(lectures));
      }
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
  async generateLectureContent(
    steps: LectureStep[],
    context?: {
      courseTitle?: string;
      courseDescription?: string;
      instructor?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      tags?: string[];
      syllabus?: Array<{ title: string; summary?: string; duration?: string }>;
      currentIndex?: number;
    }
  ): Promise<LectureContent> 
  {
    try 
    {
      // Preview generation can take time in n8n; extend timeout
      const response = await this.axiosInstance.post(
        N8N_ENDPOINTS.UNIVERSITY.GENERATE_LECTURE,
        { 
          steps,
          // Provide optional course context to improve generation quality
          courseTitle: context?.courseTitle,
          courseDescription: context?.courseDescription,
          instructor: context?.instructor,
          difficulty: context?.difficulty,
          tags: context?.tags,
          syllabus: context?.syllabus,
          currentIndex: context?.currentIndex
        },
        { timeout: 600000 }
      );
      // Normalize n8n array/output wrappers to a consistent shape
      const parsed = this.parseN8nLikePayload(response.data);
      return parsed;
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
      // Return witty message so user knows it failed
      return {
        reply: getRandomWittyError(),
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
      const raw = stored ? JSON.parse(stored) : [];
      // Normalize any older saved shapes into the unified Lecture type
      const normalized: Lecture[] = Array.isArray(raw) ? raw.map((l: any) => {
        const steps = Array.isArray(l?.steps) ? l.steps.map((s: any) => ({
          title: String(s?.title || ''),
          content: String(s?.content || ''),
          quiz: Array.isArray(s?.quiz) ? s.quiz : [],
          chat: Array.isArray(s?.chat) ? s.chat : [],
          completed: Boolean(s?.completed ?? false),
          quizPassed: Boolean(s?.quizPassed ?? false)
        })) : [];

        const createdAt = String(l?.createdAt || new Date().toISOString());
        const updatedAt = String(l?.updatedAt || createdAt);

        const lecture: Lecture = {
          id: String(l?.id || `lecture-${Date.now()}`),
          title: String(l?.title || 'Untitled Lecture'),
          topic: String(l?.topic || l?.title || ''),
          status: (l?.status === 'planning' || l?.status === 'in_progress' || l?.status === 'complete') ? l.status : 'in_progress',
          steps,
          currentStep: Number.isFinite(l?.currentStep) ? Number(l.currentStep) : 0,
          passThreshold: typeof l?.passThreshold === 'number' ? l.passThreshold : 0.7,
          overallScore: typeof l?.overallScore === 'number' ? l.overallScore : (typeof l?.score === 'number' ? l.score : 0),
          exported: Boolean(l?.exported ?? false),
          createdAt,
          updatedAt
        };
        return lecture;
      }) : [];
      return normalized;
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
      const toSave: Lecture = {
        ...lecture,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) 
      {
        lectures[existingIndex] = toSave;
      } 
      else 
      {
        lectures.push(toSave);
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
    const filtered = (await this.getCourses()).filter(c => c.metadata.id !== courseId);
    inMemoryUniversityStore.courses = filtered;
    try
    {
      if (typeof window !== 'undefined' && window.localStorage)
      {
        window.localStorage.setItem('musai-university-courses', JSON.stringify(filtered));
      }
    }
    catch (error)
    {
      console.error('Error deleting course:', error);
    }
  }
}

export const universityApi = new UniversityApiService();
