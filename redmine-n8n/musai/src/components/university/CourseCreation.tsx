import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Edit, Check, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LecturePreviewModal from '@/components/university/LecturePreviewModal';
import { universityApi } from '@/lib/universityApi';
import type { Course, CourseCreationRequest } from '@/types/university';
import { Textarea } from '@/components/ui/textarea';
import { eyeApi } from '@/lib/eyeApi';

interface CourseCreationProps 
{
  initialTopic?: string;
  onComplete?: () => void;
}

interface GeneratedCourseData 
{
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
}

const CourseCreation = ({ initialTopic, onComplete }: CourseCreationProps) => 
{
  const [topic, setTopic] = useState(initialTopic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedCourseData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<GeneratedCourseData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewSummary, setPreviewSummary] = useState<string>('');
  const [previewCache, setPreviewCache] = useState<Record<string, { content: string; isHtml: boolean; title: string }>>({});
  const [courseIconUrl, setCourseIconUrl] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState<boolean>(false);
  const navigate = useNavigate();

  // Session cache keys to avoid re-fetching on reloads
  const getCourseCacheKey = (t: string) => 
  {
    const normalized = t.trim().toLowerCase();
    return normalized ? `musai-university-course-gen::${encodeURIComponent(normalized)}` : '';
  };

  const currentCacheKey = getCourseCacheKey(topic);

  // Load from session cache if available (prevents refetch on reload)
  useEffect(() => 
  {
    if (!topic.trim() || generatedData)
    {
      return;
    }
    try 
    {
      const cached = currentCacheKey ? sessionStorage.getItem(currentCacheKey) : null;
      if (cached)
      {
        const parsed = JSON.parse(cached) as GeneratedCourseData;
        setGeneratedData(parsed);
        setEditedData(parsed);
        // Try to load any previously generated icon
        try
        {
          const iconKey = currentCacheKey ? `courseIcon::${currentCacheKey}` : '';
          if (iconKey)
          {
            const icon = window.localStorage.getItem(iconKey);
            if (icon)
            {
              setCourseIconUrl(icon);
            }
          }
        }
        catch {}
      }
    }
    catch {}
  }, [topic, currentCacheKey, generatedData]);

  // Auto-generate only on first visit with initialTopic and no cache/flag
  useEffect(() => 
  {
    const hasTopic = Boolean(initialTopic && topic.trim());
    const hasCache = Boolean(currentCacheKey && sessionStorage.getItem(currentCacheKey));
    const hasGeneratedFlag = Boolean(currentCacheKey && sessionStorage.getItem(`${currentCacheKey}::generated`));
    const shouldAutoGenerate = Boolean(hasTopic && !generatedData && !isGenerating && !hasCache && !hasGeneratedFlag);
    if (shouldAutoGenerate)
    {
      handleGenerateCourseDraft();
    }
  }, [initialTopic, topic, generatedData, isGenerating, currentCacheKey]);

  const handleGenerateCourseDraft = async () => 
  {
    if (!topic.trim()) return;

    setIsGenerating(true);
    
    try 
    {
      // Call n8n to generate course metadata and syllabus
      const courseData = await universityApi.generateCourseFromTopic(topic);
      setGeneratedData(courseData);
      setEditedData(courseData);
      // Cache in session to prevent re-fetching on reload
      try 
      {
        if (currentCacheKey)
        {
          sessionStorage.setItem(currentCacheKey, JSON.stringify(courseData));
          sessionStorage.setItem(`${currentCacheKey}::generated`, '1');
        }
      }
      catch {}

      // Generate small course icon based on title/description/tags
      try
      {
        const iconKey = currentCacheKey ? `courseIcon::${currentCacheKey}` : '';
        if (iconKey)
        {
          const existing = window.localStorage.getItem(iconKey);
          if (existing)
          {
            setCourseIconUrl(existing);
          }
          else
          {
            setIsGeneratingIcon(true);
            const promptParts: string[] = [];
            if (courseData.title) promptParts.push(`Course icon for: ${courseData.title}`);
            if (courseData.description) promptParts.push(courseData.description);
            if (Array.isArray(courseData.tags) && courseData.tags.length > 0) promptParts.push(`Tags: ${courseData.tags.join(', ')}`);
            const prompt = promptParts.join('\n');
            const blob = await eyeApi.generateImage(prompt);
            const dataUrl = await blobToDataUrl(blob);
            try { window.localStorage.setItem(iconKey, dataUrl); } catch {}
            setCourseIconUrl(dataUrl);
          }
        }
      }
      catch
      {
        // Silent fail; placeholder icon will remain
      }
      finally
      {
        setIsGeneratingIcon(false);
      }
    } 
    catch (error) 
    {
      console.error('Error generating course:', error);
      alert('Failed to generate course. Please try again.');
    } 
    finally 
    {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => 
  {
    setIsEditing(true);
    setEditedData(generatedData);
  };

  const handleSaveEdit = () => 
  {
    if (editedData) 
    {
      setGeneratedData(editedData);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => 
  {
    setIsEditing(false);
    setEditedData(generatedData);
  };

  const handleCreateCourse = async () => 
  {
    if (!generatedData) return;

    setIsCreating(true);
    
    try 
    {
      const request: CourseCreationRequest = {
        title: generatedData.title,
        description: generatedData.description,
        instructor: generatedData.instructor,
        passThreshold: 70
      };

      const course = await universityApi.createCourse(request);
      
      // Call completion callback to return to university dashboard
      if (onComplete) {
        onComplete();
      } else {
        // Fallback: Navigate to the course syllabus view
        navigate(`/university/course/${course.metadata.id}`, {
          state: { 
            course,
            fromCreation: true,
            generatedSyllabus: generatedData.syllabus
          }
        });
      }
    } 
    catch (error) 
    {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } 
    finally 
    {
      setIsCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => 
  {
    switch (difficulty) 
    {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCacheKeyForLecture = (lectureTitle: string): string => 
  {
    const courseTitle = (isEditing ? editedData?.title : generatedData?.title) || 'draft';
    return `${courseTitle}::${lectureTitle}`;
  };

  const hasMeaningfulLecturePayload = (payload?: { content: string; isHtml: boolean; title: string }): boolean =>
  {
    if (!payload || typeof payload.content !== 'string')
    {
      return false;
    }
    const raw = payload.content;
    const text = payload.isHtml
      ? raw.replace(/<[^>]*>/g, ' ')
      : raw;
    const stripped = text
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#*>`*_>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return stripped.length >= 20;
  };

  const areAllLecturesGenerated = (): boolean => 
  {
    const list = (isEditing ? editedData?.syllabus : generatedData?.syllabus) || [];
    if (!list.length)
    {
      return false;
    }
    return list.every(s => {
      const payload = previewCache[getCacheKeyForLecture(s.title)];
      return hasMeaningfulLecturePayload(payload);
    });
  };

  const handleExportCourseHtml = (): void => 
  {
    const data = isEditing ? editedData : generatedData;
    if (!data)
    {
      return;
    }
    const list = data.syllabus || [];

    const escapeHtml = (str: string): string => 
    {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    // Course icon (prefer state, fallback to localStorage)
    let iconDataUrl: string | null = courseIconUrl;
    try
    {
      if (!iconDataUrl)
      {
        const iconKey = currentCacheKey ? `courseIcon::${currentCacheKey}` : (data.title ? `courseIcon::${encodeURIComponent(data.title.trim().toLowerCase())}` : '');
        if (iconKey)
        {
          iconDataUrl = window.localStorage.getItem(iconKey);
        }
      }
    }
    catch {}

    const courseHeader = `
      <header class="course-header">
        ${iconDataUrl ? `<div class=\"course-icon\"><img src=\"${iconDataUrl}\" alt=\"${escapeHtml(data.title)}\" /></div>` : ''}
        <h1 class="course-title">${escapeHtml(data.title)}</h1>
        <div class="course-meta">Instructor: ${escapeHtml(data.instructor)} • Difficulty: ${escapeHtml(data.difficulty)} • Duration: ${escapeHtml(data.estimatedDuration)}</div>
        <p class="course-description">${escapeHtml(data.description)}</p>
        <div class="course-tags">${(data.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      </header>
    `;

    const lecturesHtml = list.map((s, idx) => 
    {
      const cacheKey = getCacheKeyForLecture(s.title);
      const payload = previewCache[cacheKey];
      if (!payload)
      {
        return '';
      }
      const imageKey = `lecturePreviewImage::${cacheKey}`;
      let imageDataUrl: string | null = null;
      try { imageDataUrl = window.localStorage.getItem(imageKey); } catch {}
      // Avoid duplicate image: if HTML content already contains an <img> near the top, skip separate image block
      const contentHasLeadingImage = Boolean(payload?.isHtml && typeof payload?.content === 'string' && /<img\b/i.test(payload.content.slice(0, 600)));
      const imageBlock = (!contentHasLeadingImage && imageDataUrl) ? `<div class="feature-image"><img src="${imageDataUrl}" alt="${escapeHtml(s.title)}" /></div>` : '';
      const contentBlock = payload.isHtml
        ? `<div class="lecture-content">${payload.content}</div>`
        : `<pre class="lecture-content-md">${escapeHtml(payload.content)}</pre>`;
      return `
        <article class="lecture">
          <h2 class="lecture-title">${idx + 1}. ${escapeHtml(payload.title || s.title)}</h2>
          ${imageBlock}
          ${contentBlock}
        </article>
      `;
    }).join('\n');

    const css = `
      body { font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Inter, sans-serif; color: #111; margin: 0; padding: 24px; background: #fff; }
      .course-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 24px; }
      .course-icon { width: 64px; height: 64px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 10px; }
      .course-icon img { width: 100%; height: 100%; object-fit: cover; }
      .course-title { font-size: 28px; font-weight: 800; margin: 0 0 6px 0; }
      .course-meta { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
      .course-description { font-size: 14px; color: #374151; }
      .course-tags { margin-top: 8px; }
      .tag { display: inline-block; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 11px; color: #374151; margin-right: 6px; }
      .lecture { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 16px 0; }
      .lecture-title { font-size: 18px; font-weight: 700; margin: 0 0 10px 0; }
      .feature-image { border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
      .feature-image img { width: 100%; height: auto; object-fit: cover; }
      .lecture-content { font-size: 14px; line-height: 1.6; }
      .lecture-content-md { white-space: pre-wrap; font-size: 13px; line-height: 1.5; background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; }
      @media print { body { padding: 12mm; } }
    `;

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(data.title)} — Course Export</title>
          <style>${css}</style>
        </head>
        <body>
          ${courseHeader}
          ${lecturesHtml}
        </body>
      </html>`;

    try
    {
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.title.replace(/\s+/g, '-').toLowerCase()}-course.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 border-b-2 border-purple-200 dark:border-purple-800 pb-2">
            🎓 Create New Course
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Enter a topic and let AI generate your course structure
          </p>
        </div>

        {/* Topic Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Topic
            </CardTitle>
            <CardDescription>
              Enter the main topic you want to learn about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">What would you like to learn?</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quantum Physics, Machine Learning, Ancient History..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateCourseDraft()}
                />
                <Button
                  onClick={handleGenerateCourseDraft}
                  disabled={!topic.trim() || isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global generating indicator for auto-start flow */}
        {isGenerating && !generatedData && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Preparing your course syllabus...</p>
            </div>
          </div>
        )}

        {/* Generated Course Preview */}
        {generatedData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generated Course
                </CardTitle>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </Button>
                    </>
                  )}
                  {!isEditing && areAllLecturesGenerated() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCourseHtml}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Course (HTML)
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Overview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                    {courseIconUrl ? (
                      <img src={courseIconUrl} alt="Course icon" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        {isGeneratingIcon ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                        ) : (
                          <BookOpen className="h-8 w-8 text-white" />
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editedData?.title || ''}
                          onChange={(e) => setEditedData(prev => prev ? {...prev, title: e.target.value} : null)}
                          className="text-lg font-semibold"
                        />
                        <Input
                          value={editedData?.instructor || ''}
                          onChange={(e) => setEditedData(prev => prev ? {...prev, instructor: e.target.value} : null)}
                          placeholder="Instructor name"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg">{generatedData.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {generatedData.instructor}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <Textarea
                    value={editedData?.description || ''}
                    onChange={(e) => setEditedData(prev => prev ? {...prev, description: e.target.value} : null)}
                    placeholder="Course description..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {generatedData.description}
                  </p>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getDifficultyColor(generatedData.difficulty)}>
                    {generatedData.difficulty}
                  </Badge>
                  <Badge variant="secondary">
                    {generatedData.estimatedDuration}
                  </Badge>
                  {generatedData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Syllabus */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                  Course Syllabus
                </h4>
                <div className="space-y-3">
                  {(isEditing ? (editedData?.syllabus || []) : generatedData.syllabus).map((lecture, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50/40 dark:hover:bg-gray-800 cursor-pointer group"
                      onClick={() => {
                        if (isEditing) return;
                        setPreviewTitle(lecture.title);
                        setPreviewSummary(lecture.summary);
                        setPreviewOpen(true);
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-300">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={lecture.title}
                              onChange={(e) => setEditedData(prev => {
                                if (!prev) return prev;
                                const next = { ...prev } as any;
                                next.syllabus = [...next.syllabus];
                                next.syllabus[index] = { ...next.syllabus[index], title: e.target.value };
                                return next;
                              })}
                              placeholder="Lecture title"
                            />
                            <Textarea
                              value={lecture.summary}
                              onChange={(e) => setEditedData(prev => {
                                if (!prev) return prev;
                                const next = { ...prev } as any;
                                next.syllabus = [...next.syllabus];
                                next.syllabus[index] = { ...next.syllabus[index], summary: e.target.value };
                                return next;
                              })}
                              placeholder="Lecture summary"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Duration</Label>
                              <Input
                                value={lecture.duration}
                                onChange={(e) => setEditedData(prev => {
                                  if (!prev) return prev;
                                  const next = { ...prev } as any;
                                  next.syllabus = [...next.syllabus];
                                  next.syllabus[index] = { ...next.syllabus[index], duration: e.target.value };
                                  return next;
                                })}
                                className="w-32"
                                placeholder="e.g., 45m"
                              />
                              <div className="ml-auto flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditedData(prev => {
                                    if (!prev) return prev;
                                    const next = { ...prev } as any;
                                    next.syllabus = next.syllabus.filter((_, i: number) => i !== index);
                                    return next;
                                  })}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-medium">{lecture.title}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {lecture.summary}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {lecture.duration}
                                  </Badge>
                                  {(() => {
                                    const key = getCacheKeyForLecture(lecture.title);
                                    const has = Boolean(previewCache[key]);
                                    return has ? (
                                      <span className="inline-flex items-center text-green-600 text-xs gap-1">
                                        <Check className="h-3 w-3" /> Ready
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                              <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-purple-600">➔</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditedData(prev => {
                          if (!prev) return prev;
                          const next = { ...prev } as any;
                          next.syllabus = [...next.syllabus, { title: 'New lecture', summary: '', duration: '30m' }];
                          return next;
                        })}
                      >
                        Add Syllabus Item
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {generatedData && (
          <div className="flex gap-4 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/university')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              disabled={isCreating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Course...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        )}
        <LecturePreviewModal 
          open={previewOpen} 
          onClose={() => setPreviewOpen(false)} 
          title={previewTitle} 
          summary={previewSummary}
          courseTitle={(isEditing ? editedData?.title : generatedData?.title) || ''}
          courseDescription={(isEditing ? editedData?.description : generatedData?.description) || ''}
          instructor={(isEditing ? editedData?.instructor : generatedData?.instructor) || ''}
          difficulty={(isEditing ? editedData?.difficulty : generatedData?.difficulty) || 'beginner'}
          tags={(isEditing ? editedData?.tags : generatedData?.tags) || []}
          syllabus={(isEditing ? editedData?.syllabus : generatedData?.syllabus) || []}
          currentIndex={(() => {
            const list = (isEditing ? editedData?.syllabus : generatedData?.syllabus) || [];
            const idx = list.findIndex(s => s.title === previewTitle);
            return idx >= 0 ? idx : undefined;
          })()}
          cacheKey={`${(isEditing ? editedData?.title : generatedData?.title) || 'draft'}::${previewTitle}`}
          cachedContent={previewCache[`${(isEditing ? editedData?.title : generatedData?.title) || 'draft'}::${previewTitle}`]?.content}
          cachedIsHtml={previewCache[`${(isEditing ? editedData?.title : generatedData?.title) || 'draft'}::${previewTitle}`]?.isHtml}
          cachedResolvedTitle={previewCache[`${(isEditing ? editedData?.title : generatedData?.title) || 'draft'}::${previewTitle}`]?.title}
          onGenerated={(key, payload) => setPreviewCache(prev => ({ ...prev, [key]: payload }))}
        />
      </div>
    </div>
  );
};

export default CourseCreation; 

async function blobToDataUrl(blob: Blob): Promise<string>
{
  return new Promise((resolve, reject) =>
  {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}