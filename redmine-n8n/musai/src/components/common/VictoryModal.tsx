import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldAlert, MessageSquare, Eye, BellRing, AlertTriangle } from 'lucide-react';

type VictoryModalProps =
{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * VictoryModal
 *
 * Shows once after the user passes the RiddleGate, welcoming them into the private beta.
 * Mirrors the tone and aesthetic of the gate while setting expectations and surfacing
 * a temporary debug mode that reveals agent flow in Chat (hidden in production).
 */
export function VictoryModal(props: VictoryModalProps)
{
  const { isOpen, onOpenChange } = props;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl overflow-hidden">
        <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-cyan-500/20 blur" />
        <div className="relative">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              Welcome beyond the Veil
            </DialogTitle>
            <DialogDescription className="text-sm">
              You have entered the Musai private beta. This world is in flux — luminous but unfinished.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3 text-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600" />
              <div>
                User management is not implemented yet. Chat history is not private in this build. Please keep requests respectful.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 mt-0.5 text-purple-600" />
              <div>
                Start with <span className="font-medium">ChatMusai</span> to feel the basic cadence before exploring the others.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600" />
              <div>
                This is a live, local instance. An <span className="font-medium">activity monitor</span> will safeguard against too many concurrent tasks.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Eye className="w-4 h-4 mt-0.5 text-cyan-600" />
              <div>
                <span className="font-medium">Debug view</span> is temporarily enabled to reveal bicamera agents’ flow and the final synthesis. In production, intermediate agent output will be hidden.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 mt-0.5 text-emerald-600" />
              <div>
                Frontier support is planned: you’ll be able to add your own <span className="font-medium">OpenAI</span> key, and later toggle hybrid modes.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BellRing className="w-4 h-4 mt-0.5 text-indigo-600" />
              <div>
                You’ll see low‑key <span className="font-medium">announcements</span> as modules stabilize. For now, explore gently and notice how your attention shapes the outcomes.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() =>
              {
                // Optional helper: let users quickly hide the agent flow if they wish
                localStorage.setItem('musai-debug-bicamera', 'false');
                onOpenChange(false);
              }}
            >
              Hide Debug View
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
              {
                localStorage.setItem('musai-debug-bicamera', 'true');
                onOpenChange(false);
              }}
            >
              Enter Musai
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VictoryModal;


