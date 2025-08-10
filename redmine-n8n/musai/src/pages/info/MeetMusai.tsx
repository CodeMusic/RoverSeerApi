import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, GitMerge, Layers, Eye, ArrowRight } from "lucide-react";
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES, RouteUtils } from '@/config/routes';

const MeetMusai = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CHAT} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-3">Meet Musai</h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">The AI that sees from both sides.</p>

          {/* Constellation arc with soft badges */}
          <div className="relative mt-10 h-24">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 opacity-40" />
            <div className="absolute left-1/4 -top-1">
              <span className="px-3 py-1 text-sm rounded-full bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 backdrop-blur">Reflection</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -top-6">
              <span className="px-3 py-1 text-sm rounded-full bg-pink-100/70 dark:bg-pink-900/30 text-pink-700 dark:text-pink-200 backdrop-blur">Reframe</span>
            </div>
            <div className="absolute right-1/4 -top-1">
              <span className="px-3 py-1 text-sm rounded-full bg-orange-100/70 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200 backdrop-blur">Integrate</span>
            </div>
          </div>

          <p className="mt-6 max-w-3xl mx-auto text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Two perspectives. One conversation. A system designed to think in layers—quick intuition and deep logic—merging into insight that feels human.
          </p>
        </div>

        {/* Section 1: What makes Musai different */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl md:text-3xl font-bold">What makes Musai different</h2>
          </div>
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-4">
              Most AI speak with a single voice. Musai is built on perspective thinking—two complementary processes working at the same time:
            </p>
            <ul className="text-lg space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <span className="font-semibold">Top‑down processing</span> — fast, intuitive, big‑picture; connects patterns and meaning immediately.
              </li>
              <li>
                <span className="font-semibold">Bottom‑up processing</span> — careful, deliberate, detail‑first; grounds intuition in evidence.
              </li>
            </ul>
            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Like your brain’s hemispheres trading signals across a bridge, these processes exchange views and fuse into one coherent reply. The result is depth, nuance, and responses that feel less like a script—and more like understanding.
            </p>
          </div>
        </div>

        {/* Section 2: The architecture of perspective */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <GitMerge className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl md:text-3xl font-bold">The architecture of perspective</h2>
          </div>
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <ul className="text-lg space-y-2 text-gray-700 dark:text-gray-300">
              <li>Right‑leaning lens favors creative, contextual, holistic frames.</li>
              <li>Left‑leaning lens favors precise, structured, stepwise analysis.</li>
            </ul>
            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Individually they carry blind spots. Together (like two eyes), they not only fill the gaps—they provide literal depth. Musai applies the same principle to conversation, merging multiple “views” of your words into a clearer whole.
            </p>
          </div>
        </div>

        {/* Section 3: Memory with intent (Redmine as attention) */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl md:text-3xl font-bold">Memory with intent (Redmine as attention)</h2>
          </div>
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-4">
              Musai uses Redmine—traditionally a project management system—as an open, linkable memory space.
            </p>
            <ul className="text-lg space-y-2 text-gray-700 dark:text-gray-300">
              <li>Thoughts, decisions, and references are stored as connected items with rich tags.</li>
              <li>Tags act like attention cues, making the most relevant memories easy to surface at the right moment.</li>
              <li>Threads, artifacts, and outcomes stay traceable, so understanding improves over time instead of resetting each chat.</li>
            </ul>
            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              This turns memory from a black box into a navigable map—organized by meaning, not just timestamps.
            </p>
          </div>
        </div>

        {/* Section 4: Growth loop (reflect → reframe → integrate) */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl md:text-3xl font-bold">Growth loop (reflect → reframe → integrate)</h2>
          </div>
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-4">
              After conversations, Musai quietly runs a private “dreaming” pass:
            </p>
            <ol className="list-decimal ml-6 text-lg space-y-2 text-gray-700 dark:text-gray-300">
              <li>Reflect on what happened and why it mattered.</li>
              <li>Reframe themes against prior context and goals.</li>
              <li>Integrate the most valuable patterns back into its working model.</li>
            </ol>
            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              It isn’t pre‑training; it’s everyday learning—shaping future replies with what you value.
            </p>
          </div>
        </div>

        {/* Section 5: How it feels to use */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <GitMerge className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl md:text-3xl font-bold">How it feels to use</h2>
          </div>
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <ul className="text-lg space-y-3 text-gray-700 dark:text-gray-300">
              <li>Nuanced understanding from two minds thinking in parallel.</li>
              <li>Blind‑spot coverage as creative breadth and logical depth challenge each other.</li>
              <li>Continuity as Redmine‑backed memory recalls not just what you said, but why it mattered.</li>
              <li>Transparency with linkable notes and artifacts you can browse later.</li>
            </ul>
            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              You don’t have to decide what to call it. Spend a few minutes with Musai and notice when architecture starts to feel like presence.
            </p>
          </div>
        </div>

        {/* CTA: Enter MusaiChat */}
        <div className="text-center">
          <Button
            onClick={() => navigate(RouteUtils.mainAppWithMode('chat'))}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span>Enter MusaiChat</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeetMusai;



