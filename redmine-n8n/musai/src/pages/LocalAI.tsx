import React from 'react';
import { Cpu, Cloud, Zap, Shield, Database, GitBranch, Brain, Network, Workflow, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';
import ROUTES from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';

const LocalAI = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CODE} />
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Local AI Architecture</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Privacy-First, Performance-Optimized, Intelligently Hybrid
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <MusaiShimmer rounded="xl">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="relative">
                <Cpu className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="text-xs">Local</Badge>
                </div>
              </div>
              <ArrowUpDown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="relative">
                <Cloud className="w-16 h-16 text-green-600 dark:text-green-400" />
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="text-xs">Cloud</Badge>
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              The Future of AI is Hybrid
            </h2>
          </MusaiShimmer>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Musai combines the privacy and speed of local AI with the intelligence and scale of cloud models. 
            Through n8n workflows and Redmine memory systems, we've created a dual-mind architecture that 
            learns and grows while keeping your data secure.
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cpu className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle>Local AI First</CardTitle>
                  <CardDescription>Privacy-preserving local processing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Your data never leaves your machine
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Instant responses, no network latency
                </li>
                <li className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  Optimized for local hardware
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <GitBranch className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <CardTitle>Smart Hybrid</CardTitle>
                  <CardDescription>AI decides when to use cloud</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  AI chooses the best model for each task
                </li>
                <li className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-500" />
                  Complex queries leverage cloud intelligence
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-cyan-500" />
                  Seamless fallback and escalation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cloud className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <CardTitle>Cloud Enhancement</CardTitle>
                  <CardDescription>When you need more power</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Access to latest large language models
                </li>
                <li className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Vast knowledge base and real-time data
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Optional, user-controlled cloud usage
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Dual Mind Architecture */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">The Dual Mind System</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Through n8n workflows, Musai operates as a dual-mind system where local and cloud AI 
              work together seamlessly, building knowledge through Redmine's memory architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Workflow className="w-8 h-8 text-orange-500" />
                  <div>
                    <CardTitle>n8n Workflow Engine</CardTitle>
                    <CardDescription>Orchestrating AI decision-making</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Our n8n workflows create intelligent routing that determines whether to process 
                  requests locally or escalate to cloud models. This creates a "working dual mind" 
                  where both systems learn from each interaction.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Local Processing</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Smart Cloud Escalation</span>
                    <Badge variant="outline">15%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-cyan-500" />
                  <div>
                    <CardTitle>Redmine Memory System</CardTitle>
                    <CardDescription>Building on the backs of the past</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Every interaction builds upon previous knowledge through our Redmine integration. 
                  The system creates a persistent memory that grows over time, learning from past 
                  conversations and decisions to improve future responses.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Memory Retention</span>
                    <Badge variant="outline">∞</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Context Awareness</span>
                    <Badge variant="outline">Advanced</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">How the Hybrid System Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h4 className="font-semibold">Request Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Local AI analyzes the complexity and requirements of your request
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">2</span>
              </div>
              <h4 className="font-semibold">Smart Routing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                n8n workflows determine optimal processing: local, cloud, or hybrid approach
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h4 className="font-semibold">Processing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Execute using the most appropriate AI model while maintaining privacy
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">4</span>
              </div>
              <h4 className="font-semibold">Memory Building</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Results are integrated into Redmine memory for future learning and context
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Performance */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl p-8">
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-bold">Privacy First, Performance Always</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Unlike traditional cloud-only AI systems, Musai keeps your sensitive data local while 
              intelligently leveraging cloud capabilities only when beneficial and with your consent.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-3" />
                <h4 className="font-semibold mb-2">Privacy Protected</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sensitive data processed locally with optional cloud enhancement
                </p>
              </div>
              
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto text-yellow-600 dark:text-yellow-400 mb-3" />
                <h4 className="font-semibold mb-2">Optimized Performance</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Best of both worlds: local speed with cloud intelligence
                </p>
              </div>
              
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto text-purple-600 dark:text-purple-400 mb-3" />
                <h4 className="font-semibold mb-2">Continuous Learning</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  AI system that grows smarter with every interaction
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Get Started */}
        <div className="text-center space-y-6">
          <h3 className="text-3xl font-bold">Experience the Future of AI</h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Ready to experience AI that respects your privacy while delivering cloud-level intelligence? 
            Start with Musai's hybrid approach today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(ROUTES.MAIN_APP)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="lg"
            >
              Try Musai Chat
            </Button>
            <Button 
              onClick={() => navigate('/university')}
              variant="outline"
              size="lg"
            >
              Explore Musai U
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalAI;