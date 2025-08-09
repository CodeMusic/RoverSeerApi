import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { APP_TERMS } from '@/config/constants';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { Bot, GitBranch, Zap, Wrench, Network, CheckCircle2, Sparkles, ClipboardList, Theater, Database, Workflow } from 'lucide-react';

const TaskMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_TASK} />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-rose-600 bg-clip-text text-transparent">TaskMusai</h1>
          <p className="text-muted-foreground text-lg">Orchestrated achievement, powered by n8n. A tool that builds tools — then uses them.</p>
        </div>

        {/* What It Is */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> What Is TaskMusai?</CardTitle>
            <CardDescription>Execution mind + workflow engine + working memory.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              TaskMusai turns intent into coordinated action. It uses n8n to compose and run tools, creates new tools when needed,
              and uses Redmine both to fetch relevant memory and to act as a shared working memory for the sprint. High-level requests
              become well-formed backlog items that move through an agile flow until done.
            </p>
          </CardContent>
        </Card>

        {/* Core Mechanics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Workflow className="w-5 h-5" /> n8n Orchestrator</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Routes work to the right tools; chains steps; escalates to cloud when needed. Every step is observable and repeatable.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> Toolsmith Engine</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Can design and scaffold new n8n nodes/workflows (“create a tool to do X”), then immediately use them in the plan.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> Redmine Memory Substrate</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pulls appropriate long-term memory and writes working state as issues, stories, and tasks. Serves as shared model-of-work.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" /> Scrum Spine</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Intake → Clarify → Plan Sprint → Build → Demo → Feedback → Next Sprint. Clear Definition of Done per story.
            </CardContent>
          </Card>
        </div>

        {/* Lifecycle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Request → Sprint Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">1) Intake & Clarification</div>
              <div>Turn the ask into user stories with acceptance criteria. Resolve unknowns up front.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">2) Sprint Plan</div>
              <div>Generate a sprint backlog, sequence dependencies, and allocate tools/workflows.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">3) Build via n8n</div>
              <div>Execute workflows, create tools when needed, and update Redmine as source of truth.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">4) Emergent Demo</div>
              <div>Use a narrative-style demo to show outcomes and surface change requests.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">5) Feedback → Next Sprint</div>
              <div>Convert demo feedback into the next sprint’s instructions; keep momentum.</div>
            </div>
          </CardContent>
        </Card>

        {/* Emergent Demo Theater */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Theater className="w-5 h-5" /> Emergent Demo Theater</CardTitle>
            <CardDescription>Scrum demo via narrative—fast alignment, concrete changes.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              When a sprint ends, TaskMusai can run a short emergent narrative demo: scenes represent features, constraints, and edge cases.
              You react in plain language; the system translates that into actionable deltas for the next sprint. Like TherapyMusai’s
              narrative processing—but applied to product increments.
            </p>
          </CardContent>
        </Card>

        {/* Why It Matters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Why It Matters</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-2">
              <li>Turn intent into shippable outcomes with an observable, repeatable workflow</li>
              <li>Bridge ideation and execution by letting the system create and use new tools</li>
              <li>Ground decisions in memory—Redmine as long-term + working memory</li>
              <li>Align faster with narrative demos that become next sprint instructions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskMusaiInfo;


