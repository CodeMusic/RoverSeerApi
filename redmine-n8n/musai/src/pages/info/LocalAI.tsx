import React, { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Cloud, Zap, Shield, Database, GitBranch, Brain, Network, Workflow, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ROUTES from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
// Import from src/assets/images for bundling
import technicaldiagramRedmindn8n from '@/assets/images/technicaldiagramRedmindn8n.png';
import requestSplitThenFusion from '@/assets/images/RequestSplitThenFusion.png';
import n8nCanvasMock from '@/assets/images/n8nCanvasMock.png';
import historicalstarcase from '@/assets/images/historicalstarcase.png';

const SafeImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img src={imgSrc} alt={alt} className={className} loading="lazy" onError={() => setImgSrc('/placeholder.svg')} />
  );
};

function SectionToggle({ id, icon: Icon, title, expanded, onToggle, right }: { id: string; icon?: any; title: string; expanded: boolean; onToggle: (id: string) => void; right?: ReactNode }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/40" onClick={() => onToggle(id)} aria-expanded={expanded}>
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

const LocalAI = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(new Set<string>(['why', 'arch', 'run', 'modules', 'perf', 'privacy', 'metaphors', 'example', 'controls', 'changes']));
  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CODE} />

      <div className="container mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Musai Local AI — Architecture, Privacy, and Hybrid Controls</h1>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="uppercase">Local</Badge>
              <ArrowUpDown className="w-4 h-4 opacity-70" />
              <Badge variant="secondary" className="uppercase">Hybrid</Badge>
            </div>
            <div className="mt-3 text-muted-foreground">Local-First Intelligence. Hybrid When You Approve.</div>
            <p className="text-base text-muted-foreground">
              A dual-mind architecture running on your hardware (Pi-5 → workstation), orchestrated by n8n and grounded in Redmine memory. Private by default, explainable by design.
            </p>
          </div>
          <div className="justify-self-end w-full md:w-3/4">
            <SafeImage src={technicaldiagramRedmindn8n} alt="Technical diagram: Redmine + n8n" className="w-full rounded-md border" />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Why Hybrid */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="why" icon={GitBranch} title="Why Hybrid (Without Hand-Waving)" expanded={expanded.has('why')} onToggle={toggle} />
            {expanded.has('why') && (
              <div className="px-4 pb-6 text-sm text-muted-foreground space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Local-first = agency. Fast inference, full data custody, deterministic audit.</li>
                  <li>Hybrid = selective leverage. Per-task opt-in to cloud for heavy reasoning or up-to-date retrieval.</li>
                  <li>Explainable routing. n8n flows decide if/when to call out; Redmine records why/what happened.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Architecture (Concrete) */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="arch" icon={Workflow} title="Architecture (Concrete)" expanded={expanded.has('arch')} onToggle={toggle} />
            {expanded.has('arch') && (
              <div className="px-4 pb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="rounded-md border p-3">
                      <div className="font-semibold mb-1">1) n8n Orchestrator (Executive Control)</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Routes: Local-only → Hybrid (opt-in) → Cloud-only (explicit)</li>
                        <li>Guards: Redaction, token caps, domain allowlists, model allowlists</li>
                        <li>Evidence: Every run has an ID, parameters, artifacts, and outcomes stored</li>
                      </ul>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="font-semibold mb-1">2) Redmine Memory (Working + Long-Term)</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Working memory: current task state, links, artifacts</li>
                        <li>Long-term: decisions, briefs, style guides, tool specs</li>
                        <li>Recall: tags/relations act like attention cues for retrieval in future flows</li>
                      </ul>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="font-semibold mb-1">3) Dual-Mind Execution (Local)</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Logical path (“Dolphin”): depth-first analysis, plans, checks</li>
                        <li>Creative path (“Penguin”): breadth-first ideation, alternatives, edge cases</li>
                        <li>Fusion: explicit synthesis → agreements, disagreements, rationale chips</li>
                      </ul>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="font-semibold mb-1">4) Optional Cloud Assist (Scoped)</div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use cases: long-doc summarization, standards lookup, heavy generation</li>
                        <li>Controls: redact → summarize → cap tokens → restrict domains/models</li>
                        <li>Receipts: source, timestamp, payload class, reason for call-out</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <SafeImage src={requestSplitThenFusion} alt="Request split then fusion" className="w-full rounded-md border" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* How a Request Runs */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="run" icon={Cpu} title="How a Request Runs (No Fluff)" expanded={expanded.has('run')} onToggle={toggle} />
            {expanded.has('run') && (
              <div className="px-4 pb-6 grid md:grid-cols-5 gap-3 text-sm">
                {[
                  ['1. Request Analysis (Local)','Classify complexity, sensitivity, latency tolerance.'],
                  ['2. Dual-Mind Pass (Local)','Logical plan + creative alternatives → fused recommendation.'],
                  ['3. Policy Gate (Local)','If fused result needs external knowledge: apply redaction, caps, allowlists.'],
                  ['4. Optional Cloud Call (Hybrid)','Scoped retrieval or compute; attach receipts.'],
                  ['5. Memory Update (Local)','Redmine issue/comment with inputs (class), outputs, rationale, artifacts, run IDs.'],
                ].map(([h,b]) => (
                  <div key={h} className="rounded-md border p-3 bg-card">
                    <div className="font-semibold mb-1">{h}</div>
                    <div className="text-muted-foreground">{b}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Modules as Tools */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="modules" icon={Network} title="Modules as Tools (n8n-ready)" expanded={expanded.has('modules')} onToggle={toggle} />
            {expanded.has('modules') && (
              <div className="px-4 pb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>MusaiSearch → reasoning-first web/academic scan; outputs citations + conflict cards</li>
                    <li>Eye of Musai → classify/detect/caption; attach labeled exemplars to Redmine</li>
                    <li>CodeMusai → dual-mind code plan + implementation; emits diff + tests</li>
                    <li>MedicalMusai → SBAR brief + differential prompts; PDF export</li>
                    <li>TherapyMusai → symbolic reframes; Insight Timeline updates</li>
                  </ul>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>CareerMusai → career planning, skill roadmaps, job scouting</li>
                    <li>MusaiCurations → daily deck; “why this” receipts; Notion/Readwise sync</li>
                    <li>MusaiStudio → loop generation/arrangement; stem export</li>
                    <li>AgileMusai → Scrum orchestration (PO/SM/Dev/QA/Toolsmith agents); demo evidence bundling</li>
                  </ul>
                </div>
                <SafeImage src={n8nCanvasMock} alt="n8n canvas mock" className="w-full rounded-md border" />
              </div>
            )}
          </section>

          {/* Local Performance */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="perf" icon={Zap} title="Local Performance, Measured Where It Matters" expanded={expanded.has('perf')} onToggle={toggle} />
            {expanded.has('perf') && (
              <div className="px-4 pb-6 text-sm text-muted-foreground space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Latency: sub-second token streaming (local models) for chat/briefing</li>
                  <li>Throughput: batch summarization with streaming writes to Redmine</li>
                  <li>Footprint: Pi-5 viable for many tasks; heavier tasks route to workstation or cloud (opt-in)</li>
                </ul>
                <div className="text-xs">Provide your own local benchmarks per device; n8n can emit a “Perf” issue with timings.</div>
              </div>
            )}
          </section>

          {/* Privacy, IP, and Audit */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="privacy" icon={Shield} title="Privacy, IP, and Audit (Plainly)" expanded={expanded.has('privacy')} onToggle={toggle} />
            {expanded.has('privacy') && (
              <div className="px-4 pb-6 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-md border p-3">
                  <div className="font-semibold mb-1">1) Copyright & Terms Reality</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Cloud model terms may allow providers to store/use your inputs/outputs.</li>
                    <li>Outcomes: training leakage, derivative resemblance, loss of exclusivity.</li>
                  </ul>
                </div>
                <div className="rounded-md border p-3">
                  <div className="font-semibold mb-1">2) Data to Cloud ≠ Disappears</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Prompts, docs, and logs can be retained by the provider.</li>
                    <li>Later generations may echo your proprietary text or structure.</li>
                  </ul>
                </div>
                <div className="rounded-md border p-3">
                  <div className="font-semibold mb-1">3) Attack Surface (Even Without “Hacking”)</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Prompt injection (malicious instructions in content)</li>
                    <li>Model/context exfiltration (coax hidden system data)</li>
                    <li>No audit (can’t reconstruct why a response happened)</li>
                  </ul>
                </div>
                <div className="rounded-md border p-3">
                  <div className="font-semibold mb-1">4) Local AI with Full Memory Control (Musai)</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Data residency: stays on your machines</li>
                    <li>Transparent memory: inspect Redmine at any time</li>
                    <li>Audit trail: every run has inputs (classed), transforms, outputs, evidence</li>
                    <li>Explainable: routing logic, policy gates, and receipts are visible</li>
                  </ul>
                </div>
                <div className="rounded-md border p-3">
                  <div className="font-semibold mb-1">Security posture features</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Per-flow redaction policies (emails, IDs, secrets)</li>
                    <li>Token caps on any cloud call</li>
                    <li>Domain/model allowlists</li>
                    <li>Scoped credentials; rotation via n8n secrets</li>
                    <li>Evidence bundles: logs, screenshots, PDFs, hashes as Redmine attachments</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Concrete Metaphors */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="metaphors" icon={Database} title="Concrete Metaphors (for Stakeholders)" expanded={expanded.has('metaphors')} onToggle={toggle} />
            {expanded.has('metaphors') && (
              <div className="px-4 pb-6 text-sm text-muted-foreground space-y-1">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Redmine = Lab notebook: every experiment recorded, searchable, citable.</li>
                  <li>n8n = Assembly line: each station is a known step; retooling creates new stations.</li>
                  <li>Policy Gate = Airlock: scrub sensitive particles before any external exposure.</li>
                  <li>Dual-Mind = Two cameras: one wide (creative), one zoom (logical); fused depth-of-field.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Example Flow */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="example" icon={GitBranch} title="Example Flow: Other Agents Use Musai via MCP" expanded={expanded.has('example')} onToggle={toggle} />
            {expanded.has('example') && (
              <div className="px-4 pb-6 text-sm space-y-3">
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Another AI system uses Musai’s MCP to access tools (e.g., RoverByte).</li>
                  <li>RoverByte hears a user say they want a certain job but don’t see a path.</li>
                  <li>RoverByte invokes MusaiSearch and agent dialogue to research pathways and challenges.</li>
                  <li>Findings are sent to CareerMusai to create alerts and adjust the CareerMusai Compass.</li>
                  <li>Based on the user’s current profile, skill gaps are identified and recommended.</li>
                  <li>Musai University generates targeted courses to close the gaps.</li>
                  <li>Redmine updates the career roadmap, alerts, artifacts, and run receipts for audit.</li>
                </ol>
                <div className="text-muted-foreground">The real power: AIs can use Musai—and through Musai, craft new tools.</div>
                <SafeImage src={historicalstarcase} alt="Historical staircase visualization" className="w-full md:w-3/4 mx-auto rounded-md border" />
              </div>
            )}
          </section>

          {/* Controls */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="controls" icon={Shield} title="Controls (UI copy you can reuse)" expanded={expanded.has('controls')} onToggle={toggle} />
            {expanded.has('controls') && (
              <div className="px-4 pb-6 grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-md border p-3 bg-card">
                  <div className="font-semibold mb-1">Hybrid Assist</div>
                  <div className="text-muted-foreground">Off / Per-task / Allowed for: {`{Search, Summarize, Generate}`}</div>
                </div>
                <div className="rounded-md border p-3 bg-card">
                  <div className="font-semibold mb-1">Redaction</div>
                  <div className="text-muted-foreground">On (emails, tokens, secrets)</div>
                </div>
                <div className="rounded-md border p-3 bg-card">
                  <div className="font-semibold mb-1">Token Cap</div>
                  <div className="text-muted-foreground">1,024 (default; per node override)</div>
                </div>
                <div className="rounded-md border p-3 bg-card">
                  <div className="font-semibold mb-1">Allowlists</div>
                  <div className="text-muted-foreground">Domains {`{nih.gov, arxiv.org, iso.org}`}; Models {`{gpt-X, claude-Y}`}</div>
                </div>
                <div className="rounded-md border p-3 bg-card md:col-span-2">
                  <div className="font-semibold mb-1">Receipts Panel</div>
                  <div className="text-muted-foreground">time, endpoint, token count, redaction summary, link to run</div>
                </div>
              </div>
            )}
          </section>

          {/* What changes */}
          <section className="border rounded-lg overflow-hidden bg-card">
            <SectionToggle id="changes" icon={Cloud} title="What Changes When You Adopt This" expanded={expanded.has('changes')} onToggle={toggle} />
            {expanded.has('changes') && (
              <div className="px-4 pb-6 text-sm text-muted-foreground space-y-1">
                <ul className="list-disc pl-5 space-y-1">
                  <li>You keep your data. Every artifact is yours, locally.</li>
                  <li>You see the reasoning. Agreements, conflicts, receipts, and runs.</li>
                  <li>You compound capability. Toolsmith turns retro insights into reusable nodes.</li>
                  <li>You move like a team of ten. Agents handle toil; you steer outcomes.</li>
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="pt-6">
          <InfoFooterNav />
        </div>
      </div>
    </div>
  );
};

export default LocalAI;


