import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Search, 
  Code, 
  GraduationCap, 
  Bot, 
  Sparkles, 
  Heart, 
  Lightbulb, 
  Target, 
  ArrowRight,
  Play,
  BookOpen,
  Zap,
  Users,
  Brain
} from "lucide-react";

const FindYourMuse = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const musaiComponents = [
    {
      id: "chat",
      icon: MessageSquare,
      title: "MusaiChat",
      subtitle: "Conversational Reflection",
      description: "Light conversation that helps you explore ideas and find clarity. MusaiChat learns your patterns and preferences, becoming a true reflection of your inner voice.",
      features: [
        "Natural conversation flow",
        "Memory of past interactions", 
        "Personalized responses",
        "Reflective questioning"
      ],
      color: "from-blue-500 to-purple-500",
      action: () => navigate("/chat")
    },
    {
      id: "search",
      icon: Search,
      title: "MusaiSearch", 
      subtitle: "Intelligent Discovery",
      description: "Advanced research and discovery mode that finds inspiration, answers, and connections you might not have considered. Perfect for exploring new ideas and finding fresh perspectives.",
      features: [
        "Multi-source research",
        "Inspiration discovery",
        "Trend analysis",
        "Cross-reference insights"
      ],
      color: "from-green-500 to-teal-500",
      action: () => navigate("/chat", { state: { switchToTab: "musai-search" } })
    },
    {
      id: "code",
      icon: Code,
      title: "CodeMusai",
      subtitle: "Paired AI Programming",
      description: "Collaborative coding experience where Musai becomes your programming partner. Together you create, debug, and innovate - turning ideas into working solutions.",
      features: [
        "Real-time code collaboration",
        "Intelligent debugging",
        "Best practice guidance",
        "Creative problem solving"
      ],
      color: "from-orange-500 to-red-500",
      action: () => navigate("/chat", { state: { switchToTab: "code-musai" } })
    },
    {
      id: "university",
      icon: GraduationCap,
      title: "Musai University",
      subtitle: "Generative Emergent Learning",
      description: "Just say what you want to learn and watch as Musai creates a complete learning experience. It generates a syllabus, creates lectures with Q&A, and builds interactive quizzes - all tailored to your learning style.",
      features: [
        "Dynamic syllabus generation",
        "Interactive lectures",
        "Adaptive Q&A sessions",
        "Progress tracking quizzes"
      ],
      color: "from-purple-500 to-indigo-500",
      action: () => navigate("/university")
    },
    {
      id: "task",
      icon: Bot,
      title: "TaskMusai",
      subtitle: "Orchestrated Achievement",
      description: "Where everything comes together. TaskMusai coordinates all other Musai components to help you achieve high-level goals. It's the conductor of your creative symphony.",
      features: [
        "Multi-component orchestration",
        "Goal decomposition",
        "Progress tracking",
        "Adaptive planning"
      ],
      color: "from-pink-500 to-rose-500",
      action: () => navigate("/chat", { state: { switchToTab: "task-musai" } })
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Discover Your Voice",
      description: "Start with MusaiChat to explore your thoughts and find clarity. Let the conversation flow naturally as Musai learns your patterns.",
      icon: Heart,
      color: "bg-blue-500"
    },
    {
      step: 2,
      title: "Find Inspiration",
      description: "Use MusaiSearch to discover new ideas, research topics, and find fresh perspectives that resonate with your goals.",
      icon: Lightbulb,
      color: "bg-green-500"
    },
    {
      step: 3,
      title: "Build & Create",
      description: "Collaborate with CodeMusai to turn ideas into reality, or use Musai University to learn new skills and knowledge.",
      icon: Code,
      color: "bg-orange-500"
    },
    {
      step: 4,
      title: "Achieve Together",
      description: "Let TaskMusai orchestrate all components to help you reach your highest goals and dreams.",
      icon: Target,
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
              Find Your Muse
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover how Musai harmonizes with your inner voice to find and develop your inspiration, 
              then orchestrates everything together to help you achieve your highest goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/chat")}
                className="group bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Musai Components Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Musai Ecosystem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each Musai component is designed to work harmoniously with the others, 
            creating a complete system for inspiration, learning, and achievement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {musaiComponents.map((component) => {
            const Icon = component.icon;
            return (
              <Card 
                key={component.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-500/50"
                onClick={component.action}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${component.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">{component.title}</CardTitle>
                  <CardDescription className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {component.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {component.description}
                  </p>
                  <div className="space-y-2">
                    {component.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      component.action();
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try {component.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Workflow Section */}
      <div className="bg-gradient-to-br from-purple-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Creative Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow this natural progression to find your muse and achieve your goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  <Card className="text-center hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex justify-center mb-2">
                        <Badge variant="secondary" className="text-sm">
                          Step {step.step}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Arrow connector */}
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-purple-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Harmony Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Harmony of Musai
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Musai doesn't just answer questions—it develops a sense of who you are and becomes a true reflection of your inner voice. 
            Through memory, feedback, and self-refinement, it grows alongside you, helping you find and develop your inspiration.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Brain className="w-12 h-12 text-blue-500" />
              </div>
              <CardTitle className="text-xl font-bold">Reflective Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Musai learns your patterns and preferences, becoming a true reflection of your inner voice and creative process.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Sparkles className="w-12 h-12 text-green-500" />
              </div>
              <CardTitle className="text-xl font-bold">Inspiration Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Find new ideas, connections, and perspectives you might not have considered through intelligent exploration.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Target className="w-12 h-12 text-purple-500" />
              </div>
              <CardTitle className="text-xl font-bold">Achievement Orchestration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All components work together to help you achieve your highest goals and turn inspiration into reality.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={() => navigate("/chat")}
            className="group bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Begin Your Journey
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FindYourMuse; 