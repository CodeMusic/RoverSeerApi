import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import taskHero from '@/assets/images/taskmusai_hero.png';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Workflow,
  Wrench,
  Database,
  GitBranch,
  ClipboardList,
  Theater,
  Users,
  Shield,
  CheckCircle2,
  Gauge,
  Rocket,
  ListChecks,
  BookOpen,
  HelpCircle,
  Sparkles
} from 'lucide-react';

const TaskMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  const handleStartSprint = (): void =>
  {
    navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_TASK } });
  };

  const handleViewSampleBacklog = (): void =>
  {
    navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_TASK, initialQuery: 'show sample backlog' } });
  };

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_TASK} />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero */}
        <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-rose-600 bg-clip-text text-transparent">
              TaskMusai — Your On-Demand Scrum Team
            </h1>
            <p className="text-muted-foreground text-lg">
              Agents that plan, build, demo, and iterate — powered by n8n, shaped by Redmine.
            </p>
            <div className="mt-6 flex items-center gap-3 md:justify-start justify-center">
              <Button size="lg" onClick={handleStartSprint}>
                <Rocket className="w-4 h-4" /> Start a Sprint
              </Button>
              <Button variant="outline" size="lg" onClick={handleViewSampleBacklog}>
                <BookOpen className="w-4 h-4" /> View a Sample Backlog
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-violet-500/15 via-rose-400/10 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
              <img src={taskHero} alt="TaskMusai hero" className="block w-full h-auto" />
            </div>
          </div>
        </div>

        {/* What It Is */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" /> What It Is
            </CardTitle>
            <CardDescription>
              More than Manus. Open‑Manus meets Scrum — orchestrated flow with tool creation built in.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium flex items-center gap-2"><Workflow className="w-4 h-4" /> n8n Orchestrator</div>
                <div>Executes and chains work with observable, repeatable runs.</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium flex items-center gap-2"><Wrench className="w-4 h-4" /> Toolsmith Engine</div>
                <div>Creates new n8n nodes/workflows when gaps appear — then uses them.</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium flex items-center gap-2"><Database className="w-4 h-4" /> Redmine Memory</div>
                <div>Source of truth for goals, backlog, status, and artifacts.</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Virtual Scrum Team</div>
                <div>Agents coordinate as PO, Scrum Master, Dev, QA, and Toolsmith.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Maps to Scrum */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" /> How It Maps to Scrum (1:1)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium">Product Vision → Product Backlog</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Epics and User Stories with Acceptance Criteria</li>
                  <li>Estimated, prioritized, and stored as Redmine issues</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium">Sprint Planning</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Create Sprint Backlog (Redmine version)</li>
                  <li>Expand stories into tasks/sub‑tasks and assign to roles/tools</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium">Daily Flow</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Agents run tasks via n8n; status auto‑updates in Redmine</li>
                  <li>Impediments become issues; Scrum Master unblocks or escalates</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium">Sprint Review (Emergent Demo)</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Scene‑based demo mapped to acceptance criteria</li>
                  <li>Feedback becomes ready stories for next sprint</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border bg-card md:col-span-2">
                <div className="font-medium">Sprint Retrospective</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Process improvements captured as actionable items</li>
                  <li>Toolsmith Engine turns retro items into reusable tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Virtual Scrum Team */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Virtual Scrum Team (Agents)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-2">
              <li><span className="font-medium">Product Owner (PO) Proxy</span> — Clarifies outcomes, updates acceptance criteria, prioritizes backlog.</li>
              <li><span className="font-medium">Scrum Master</span> — Manages flow, removes blockers, guards WIP limits, enforces Done.</li>
              <li><span className="font-medium">Developer Agents</span> — Build features, integrate systems, write docs.</li>
              <li><span className="font-medium">QA Agent</span> — Generates test plans, validates acceptance criteria, captures evidence.</li>
              <li><span className="font-medium">Toolsmith</span> — Designs/scaffolds new n8n nodes/workflows, publishes and inserts into plan.</li>
              <li><span className="font-medium">Tech Writer (optional)</span> — Produces notes, changelogs, and runbooks.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Redmine Memory */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" /> Redmine as Working + Long‑Term Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium">Trackers</div>
              <div>Epic, Story, Task, Sub‑task, Bug, Spike, Chore</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium">Statuses</div>
              <div>New → In Progress → In Review → Blocked → Done</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium">Custom Fields</div>
              <div>Acceptance Criteria, Definition of Done, Evidence Links, Tool Dependencies</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium">Relations</div>
              <div>Story ↔ Tasks, Blocked By, Duplicates, Follows</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium">Versions/Sprints</div>
              <div>Each sprint is a Redmine Version with dates, burndown, and scope.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium">Artifacts</div>
              <div>Build logs, demo links, test evidence, and configs attached to producing issues.</div>
            </div>
          </CardContent>
        </Card>

        {/* Tool Creation That Feeds the Process */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Tool Creation That Feeds the Process
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Spike → Toolsmith drafts a spec (inputs, outputs, errors, tests).</li>
              <li>Scaffold → Generate a new n8n node/workflow.</li>
              <li>Prove → QA runs a small acceptance suite.</li>
              <li>Publish → Register the tool with docs and examples.</li>
              <li>Reuse → Insert into current task and future plans automatically.</li>
            </ol>
            <div className="text-muted-foreground">Result: your toolset compounds every sprint.</div>
          </CardContent>
        </Card>

        {/* Lifecycle (Request → Increment) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Lifecycle (Request → Increment)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">1. Intake & Clarification</div>
              <div>Goals → Epics/Stories with acceptance criteria and estimates; unknowns become Spikes.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">2. Sprint Planning</div>
              <div>Select scope; generate Sprint Backlog; map tasks → tools; set Definition of Done.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">3. Build (n8n)</div>
              <div>Execute tasks, create tools when needed, update Redmine in real time.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">4. Emergent Demo (Review)</div>
              <div>Scene‑based demo mapped to acceptance criteria; feedback → new stories.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="font-medium mb-1">5. Retrospective → Improvements</div>
              <div>Process/tooling improvements become actionable items (often Toolsmith work).</div>
            </div>
          </CardContent>
        </Card>

        {/* Governance & Transparency */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Governance & Transparency
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-card">Traceability — Every increment links back to a story and acceptance criteria.</div>
            <div className="p-3 rounded-lg border bg-card">Repeatability — n8n executions are versioned; parameters and credentials are scoped.</div>
            <div className="p-3 rounded-lg border bg-card">Evidence — QA attaches test results, screenshots, logs, and run IDs to Redmine.</div>
            <div className="p-3 rounded-lg border bg-card">Burndown & Velocity — Redmine sprint charts reflect real execution.</div>
            <div className="p-3 rounded-lg border bg-card md:col-span-2">Definition of Done — Enforced per tracker; demoed + accepted + documented.</div>
          </CardContent>
        </Card>

        {/* Example */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" /> Example: “Weekly Newsletter from 6 Feeds”
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div><span className="font-medium">Epic:</span> Automated Editorial</div>
            <div className="font-medium">Stories:</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Aggregate & dedupe feeds</li>
              <li>Summarize into sections with tone constraints</li>
              <li>Publish to CMS</li>
              <li>Cross‑post to socials (with UTM)</li>
            </ul>
            <div><span className="font-medium">Toolsmith:</span> Builds a “CMS Markdown Upload” node</div>
            <div><span className="font-medium">QA:</span> Validates formatting, links, image rendering, and social previews</div>
            <div><span className="font-medium">Review:</span> Demo shows newsletter preview + published post</div>
            <div><span className="font-medium">Next Sprint:</span> Style variants; image selection rules; A/B share text</div>
          </CardContent>
        </Card>

        {/* Why Teams Pick TaskMusai */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" /> Why Teams Pick TaskMusai
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-2">
              <li>Agile by design — a real Scrum heartbeat, not just automation.</li>
              <li>Tool gaps vanish — tool creation is part of the plan, not a blocker.</li>
              <li>Always in context — Redmine keeps intent, decisions, and artifacts together.</li>
              <li>Faster alignment — narrative demos stakeholders understand.</li>
            </ul>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> FAQs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div>
              <div className="font-medium">Does it replace our team?</div>
              <div>No — it supplements. “Always‑on Agile assistants” that reduce toil and keep flow.</div>
            </div>
            <div>
              <div className="font-medium">Can it work with our Redmine schema?</div>
              <div>Yes — mappers adapt to your trackers, workflows, and custom fields.</div>
            </div>
            <div>
              <div className="font-medium">How are risky actions controlled?</div>
              <div>Approval gates, scoped credentials, auditable runs.</div>
            </div>
            <div>
              <div className="font-medium">Can we bring our own tools?</div>
              <div>Absolutely. TaskMusai composes existing tools and only builds new ones when needed.</div>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          <div className="mb-3 text-muted-foreground text-sm">Prefer technical detail? See the Scrum Orchestration Guide, n8n Workflow Stubs, and Redmine Mapping Reference.</div>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={handleStartSprint}>
              <Rocket className="w-4 h-4" /> Start a Sprint
            </Button>
            <Button variant="outline" size="lg" onClick={handleViewSampleBacklog}>
              <BookOpen className="w-4 h-4" /> See a Sample Backlog & Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskMusaiInfo;
