import { useState, type ReactNode } from "react";
import { Brain, Cpu, Database, Zap, Moon, Sun, ChevronDown, ChevronUp, BookOpenCheck, Microscope, Activity, Layers, GitCompare } from "lucide-react";
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import musaiArchDiagram from "@/assets/images/musai_archdiag.png";
import redmineMemoryStructure from "@/assets/images/redmine_memory_structure.png";
import dnaFlow from "@/assets/images/dna_flow.png";
import dayNightTraining from "@/assets/images/day_night_training.png";
import n8nWorkflow from "@/assets/images/n8n_workflow.png";
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
import brainlobes from '@/assets/images/brainlobes.png';
import flowsensereflect from '@/assets/images/flowsensereflect.png';
import toolsmithfeedbackloop from '@/assets/images/toolsmithfeedbackloop.png';
import { useTheme } from '@/contexts/ThemeContext';
import { ROUTES } from '@/config/routes';

/**
 * Neuroscience & Cognitive Psychology — Musai
 *
 * This version makes the page explicitly scientific:
 *  - Clear mapping between psychological theory ↔️ product behavior
 *  - Precise terminology (attention, predictive processing, memory systems, neuromodulation)
 *  - Testable design claims + suggested product metrics
 *  - Concise primary-source style references at the end (classic and stable)
 */

// Small helpers --------------------------------------------------------------
const SafeImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc('/placeholder.svg')}
      loading="lazy"
    />
  );
};
function SectionToggle(
  { id, icon: Icon, title, expanded, onToggle, right }: {
    id: string;
    icon?: any;
    title: string;
    expanded: boolean;
    onToggle: (id: string) => void;
    right?: ReactNode;
  }
) {
  return (
    <button
      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/40"
      onClick={() => onToggle(id)}
      aria-expanded={expanded}
    >
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="w-5 h-5" /> : null}
        <span className="font-semibold">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {right}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
    </button>
  );
}

function EvidenceTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-background">
      <Microscope className="w-3 h-3 mr-1" /> {children}
    </span>
  );
}

function ClaimRow({ claim, measure }: { claim: string; measure: string }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 p-3 rounded-md border bg-card">
      <div>
        <p className="text-sm font-semibold">Design Claim</p>
        <p className="text-sm text-muted-foreground">{claim}</p>
      </div>
      <div>
        <p className="text-sm font-semibold">Observable / Metric</p>
        <p className="text-sm text-muted-foreground">{measure}</p>
      </div>
    </div>
  );
}

const Neuroscience = () => {
  const { isDark, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState(new Set([
    'overview',
    'modules',
    'cfm',
    'history',
    'references',
  ]));

  const toggleSection = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <div className={"min-h-screen bg-background text-foreground transition-colors duration-300"}>
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_UNIVERSITY} />

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Musai: A Cognitive Extension Framework Rooted in Neuroscience and Behavioral Science</h1>
          </div>
          <button onClick={toggleTheme} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent" aria-label="Toggle theme">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start mb-10">
          <div className="space-y-2">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">From Neural Loops to Workflow Loops — The Science of Musai</div>
            <p className="text-base text-muted-foreground">
              Musai is an AI-augmented cognitive system that extends human problem-solving capacity by mirroring the brain’s architecture in a modular, adaptive environment.
            </p>
          </div>
          <div className="justify-self-end w-full md:w-3/4">
            <SafeImage src={brainlobes} alt="Brain lobes schematic" className="w-full rounded-md border" />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Overview in Scientific Context */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle
              id="overview"
              icon={Brain}
              title="System Overview in Scientific Context"
              expanded={expanded.has('overview')}
              onToggle={toggleSection}
            />
            {expanded.has('overview') && (
              <div className="px-4 pb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div>Musai operates as a distributed cognitive architecture, integrating:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Redmine as episodic–semantic memory (Tulving, 1972; Squire & Zola, 1996)</li>
                      <li>n8n as executive control and task-switching network (Miller & Cohen, 2001)</li>
                      <li>n8n loops as neural feedback loops for continuous refinement (Grossberg, 1980)</li>
                      <li>Toolsmith Engine as an adaptive capacity generator analogous to experience-dependent plasticity (Kolb & Whishaw, 1998)</li>
                    </ul>
                    <div className="mt-3">These components form a cognitive feedback cycle:</div>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Sense — Data capture from inputs (voice, APIs, sensors)</li>
             <li>Reflect — <a className="underline decoration-dotted" href={ROUTES.CFM_INFO}>Contextual Feedback Model (CFM)</a> updates priorities and tensions</li>
                      <li>Integrate — Redmine stores linked, tagged outcomes</li>
                      <li>Extend — Toolsmith Engine creates new workflows when existing tools are insufficient</li>
                    </ol>
                  </div>
                  <div>
                    <SafeImage src={flowsensereflect} alt="Sense, Reflect, Integrate, Extend" className="w-full rounded-md border" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Module-Level Function as n8n Tools */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle
              id="modules"
              icon={GitCompare}
              title="Module-Level Function as n8n Tools"
              expanded={expanded.has('modules')}
              onToggle={toggleSection}
            />
            {expanded.has('modules') && (
              <div className="px-4 pb-6 space-y-6">
                {/* Responsive table */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">Module</th>
                        <th className="py-2">Cognitive Analogy</th>
                        <th className="py-2">Primary Function in n8n</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {[
                        ['MusaiChat','Prefrontal–temporal integration','Dialogue, reasoning'],
                        ['MusaiSearch','Dual-stream visual + language cortex','Parallel query + fusion'],
                        ['Eye of Musai','Ventral/dorsal stream processing','Object recognition, context labeling'],
                        ['CodeMusai','Hemispheric problem-solving loop','Logical & creative code generation'],
                        ['MedicalMusai','Clinical decision support network','Summarization, SBAR briefs'],
                        ['TherapyMusai','DMN–limbic integration','Emotional reframing, symbolic mapping'],
                        ['CareerMusai','Executive planning network','Career planning, skill roadmaps, job scouting'],
                        ['MusaiCurations','Hippocampal novelty detection','Adaptive content surfacing'],
                        ['MusaiStudio','Auditory–motor integration','AI-assisted music creation'],
                        ['AgileMusai','Distributed team cognition','Team role orchestration (PO/SM/Dev/QA/Toolsmith)'],
                      ].map(([m,a,f]) => (
                        <tr key={m} className="border-t">
                          <td className="py-2 font-medium">{m}</td>
                          <td className="py-2 text-muted-foreground">{a}</td>
                          <td className="py-2 text-muted-foreground">{f}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="grid md:hidden gap-3">
                  {[
                    ['MusaiChat','Prefrontal–temporal integration','Dialogue, reasoning'],
                    ['MusaiSearch','Dual-stream visual + language cortex','Parallel query + fusion'],
                    ['Eye of Musai','Ventral/dorsal stream processing','Object recognition, context labeling'],
                    ['CodeMusai','Hemispheric problem-solving loop','Logical & creative code generation'],
                    ['MedicalMusai','Clinical decision support network','Summarization, SBAR briefs'],
                    ['TherapyMusai','DMN–limbic integration','Emotional reframing, symbolic mapping'],
                    ['CareerMusai','Executive planning network','Career planning, skill roadmaps, job scouting'],
                    ['MusaiCurations','Hippocampal novelty detection','Adaptive content surfacing'],
                    ['MusaiStudio','Auditory–motor integration','AI-assisted music creation'],
                    ['AgileMusai','Distributed team cognition','Team role orchestration (PO/SM/Dev/QA/Toolsmith)'],
                  ].map(([m,a,f]) => (
                    <div key={m} className="rounded-md border p-3 bg-card">
                      <div className="font-medium">{m}</div>
                      <div className="text-xs text-muted-foreground">{a}</div>
                      <div className="text-sm mt-1">{f}</div>
                    </div>
                  ))}
                </div>

                {/* Example: Other agents use Musai via MCP */}
                <div className="rounded-md border p-4 bg-background/50">
                  <div className="text-sm font-semibold mb-2">Example — Other Agents Use Musai via MCP</div>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Using Musai’s MCP, another system (e.g., RoverByte) calls Musai tools.</li>
                    <li>RoverByte hears a user express a dream job without a clear path.</li>
                    <li>It invokes MusaiSearch and agent dialogue to map pathways and challenges.</li>
                    <li>CareerMusai creates alerts and adjusts the CareerMusai Compass accordingly.</li>
                    <li>Musai identifies skill gaps from the user’s current profile and recommends learning.</li>
                    <li>Musai University generates targeted courses to close those gaps.</li>
                  </ul>
                  <div className="text-xs text-muted-foreground mt-2">Power: AIs can use Musai — and through Musai, craft new tools.</div>
                </div>
              </div>
            )}
          </section>

          {/* Cognitive Feedback & Adaptation */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle
              id="cfm"
              icon={Activity}
              title="Cognitive Feedback and Adaptation (CFM)"
              expanded={expanded.has('cfm')}
              onToggle={toggleSection}
            />
            {expanded.has('cfm') && (
              <div className="px-4 pb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Musai’s architecture is grounded in the Contextual Feedback Model (CFM):</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Content (task data, observations) and Context (past outcomes, biases, emotional salience) interact dynamically.</li>
                      <li>This mirrors how the brain’s predictive models are continuously updated by prediction errors (Friston, 2010).</li>
                      <li>Loops in n8n serve as closed-loop controllers—detecting deviation, correcting output, and integrating learning into Redmine.</li>
                    </ul>
                  </div>
                  <div>
                    <SafeImage src={toolsmithfeedbackloop} alt="Toolsmith feedback loop" className="w-full rounded-md border" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Historical Parallels */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle
              id="history"
              icon={Layers}
              title="Historical Parallels in Productivity Breakthroughs"
              expanded={expanded.has('history')}
              onToggle={toggleSection}
            />
            {expanded.has('history') && (
              <div className="px-4 pb-6 space-y-4 text-sm text-muted-foreground">
                <div>Throughout history, the introduction of cognitive extensions has dramatically increased human productivity:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Written language (~3200 BCE) — Externalized memory</li>
                  <li>Printing press (~1440) — Mass knowledge distribution</li>
                  <li>Scientific method (~1600s) — Systematic discovery loop</li>
                  <li>Computers (~1940s) — Automated calculation and storage</li>
                </ul>
                <div className="mt-2">Musai functions as the next step — an adaptive cognitive co-processor. Like these past innovations, it:</div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Externalizes working memory into a searchable, linked archive (Redmine)</li>
                  <li>Automates repeatable mental processes (n8n loops)</li>
                  <li>Expands capability through new tool creation (Toolsmith)</li>
                  <li>Integrates emotional and contextual reasoning into execution (CFM)</li>
                </ol>
                <div className="mt-2">As this agent naturally extends you, the human–AI loop becomes more than additive. It becomes multiplicative — enabling capabilities you could not imagine before the system adapted itself to your way of thinking and building.</div>
              </div>
            )}
          </section>

          {/* References */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle
              id="references"
              icon={BookOpenCheck}
              title="References"
              expanded={expanded.has('references')}
              onToggle={toggleSection}
            />
            {expanded.has('references') && (
              <div className="px-4 pb-6 text-sm text-muted-foreground space-y-2">
                <p>Friston, K. (2010). The free-energy principle: a unified brain theory? Nature Reviews Neuroscience, 11(2), 127–138.</p>
                <p>Grossberg, S. (1980). How does a brain build a cognitive code? Psychological Review, 87(1), 1–51.</p>
                <p>Kolb, B., & Whishaw, I. Q. (1998). Brain plasticity and behavior. Annual Review of Psychology, 49, 43–64.</p>
                <p>Miller, E. K., & Cohen, J. D. (2001). An integrative theory of prefrontal cortex function. Annual Review of Neuroscience, 24, 167–202.</p>
                <p>Squire, L. R., & Zola, S. M. (1996). Structure and function of declarative and nondeclarative memory systems. PNAS, 93(24), 13515–13522.</p>
                <p>Tulving, E. (1972). Episodic and semantic memory. Organization of Memory. Academic Press.</p>
              </div>
            )}
          </section>
        </div>

        <InfoFooterNav />
      </div>
    </div>
  );
};

export default Neuroscience;

