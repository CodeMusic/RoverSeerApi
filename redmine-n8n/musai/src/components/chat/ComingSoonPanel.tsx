import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Theater, GraduationCap, Search, Bot, Sparkles, Zap, BookOpen } from "lucide-react";

interface ComingSoonPanelProps {
  tab: string;
  onClose: () => void;
}

export const ComingSoonPanel = ({ tab, onClose }: ComingSoonPanelProps) => {
  const getTabInfo = () => {
    switch (tab) {
      case "emergent-narrative":
        return {
          icon: Theater,
          title: "MusaiTale",
          subtitle: "Interactive Storytelling Experience",
          description: "Experience dynamic, AI-generated narratives that adapt to your choices and create unique storylines tailored to your preferences.",
          features: [
            "Dynamic story generation",
            "Choice-driven narratives", 
            "Character development tracking",
            "Multiple story branches and endings"
          ]
        };
      case "musai-university":
        return {
          icon: GraduationCap,
          title: "Musai U",
          subtitle: "Personalized Learning Platform",
          description: "Ask what you want to learn, and our AI will create a personalized curriculum with interactive lessons that adapt to your learning style.",
          features: [
            "Personalized learning paths",
            "Interactive n8n automation workflows", 
            "Adaptive content generation",
            "Progress tracking and analytics"
          ]
        };
      case "musai-search":
        return {
          icon: Search,
          title: "Musai Search",
          subtitle: "Intelligent Knowledge Discovery",
          description: "Advanced search capabilities that understand context and intent, providing you with precise and relevant results from vast knowledge bases.",
          features: [
            "Contextual search understanding",
            "Multi-source knowledge aggregation",
            "Real-time result ranking",
            "Semantic query processing"
          ]
        };
      case "task-musai":
      case "agents": // Keep for backward compatibility
        return {
          icon: Bot,
          title: "AgileMusai",
          subtitle: "Autonomous Task Performers",
          description: "Deploy specialized AI agents that can perform complex tasks and workflows autonomously on your behalf.",
          features: [
            "Task automation and delegation",
            "Multi-step workflow execution",
            "Real-time progress monitoring",
            "Custom agent specializations"
          ]
        };
      default:
        return {
          icon: Sparkles,
          title: "Coming Soon",
          subtitle: "Exciting Features Ahead",
          description: "We're working on something amazing!",
          features: []
        };
    }
  };

  const tabInfo = getTabInfo();
  const Icon = tabInfo.icon;

  return (
    <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-semibold">{tabInfo.title}</h1>
            <p className="text-sm text-muted-foreground">{tabInfo.subtitle}</p>
          </div>
        </div>

      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl" />
            </div>
            <div className="relative bg-background border-2 border-dashed border-border rounded-3xl p-12">
              <Icon className="w-24 h-24 mx-auto text-muted-foreground/50" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">{tabInfo.title}</h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              {tabInfo.description}
            </p>
          </div>

          {tabInfo.features.length > 0 && (
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Planned Features
                </CardTitle>
                <CardDescription>
                  Here's what we're building for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tabInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Learn More
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Coming Soon • Stay tuned for updates
          </div>
        </div>
      </div>
    </div>
  );
}; 