import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

const PEPPER = 'm$pepper_v1';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

function yyyymmdd(date = new Date())
{
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

async function sha256Hex(text: string): Promise<string>
{
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const RiddleGate: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const { toggleParty, toggleRainbow } = useMusaiMood();

  const [now, setNow] = useState(new Date());
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => yyyymmdd(now), [now]);
  const storageKey = `musai_riddle_access_${today}`;
  const failKey = `musai_riddle_fail_${today}`;
  const lockKey = `musai_riddle_lock_${today}`;

  // Update every second for countdown freshness
  useEffect(() =>
  {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isAuthorized = useMemo(() => localStorage.getItem(storageKey) === 'ok', [storageKey]);

  const failCount = useMemo(() => parseInt(localStorage.getItem(failKey) || '0', 10), [failKey, now]);
  const lockUntilTs = useMemo(() => parseInt(localStorage.getItem(lockKey) || '0', 10), [lockKey, now]);
  const isLocked = lockUntilTs > Date.now();
  const remainingMs = Math.max(0, lockUntilTs - Date.now());

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (isLocked) return;

    const normalized = input.trim().toLowerCase();
    const digest = await sha256Hex(`${normalized}|${today}|${PEPPER}`);
    const expected = await sha256Hex(`context|${today}|${PEPPER}`);

    if (digest === expected)
    {
      localStorage.setItem(storageKey, 'ok');
      localStorage.removeItem(failKey);
      localStorage.removeItem(lockKey);
      setError(null);
      // Celebrate with party effect
      toggleParty();
    }
    else
    {
      const nextCount = failCount + 1;
      localStorage.setItem(failKey, String(nextCount));
      // Trigger a brief rainbow effect to signal failure (non-blocking)
      toggleRainbow();

      if (nextCount >= MAX_ATTEMPTS)
      {
        const until = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(lockKey, String(until));
      }

      setError("Nice try. Here is a hint for your efforts: 'What you call a mirror… is only flat until two stories meet upon it.'");
    }
  };

  if (isAuthorized)
  {
    return <>{children}</>;
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-4xl shadow-xl border-purple-200/40 dark:border-purple-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
            🎭 The Riddle of the Three
          </CardTitle>
          <CardDescription className="text-sm">
            {isLocked
              ? 'Too many attempts. Please wait for the timer to finish to try again.'
              : 'Private beta. Answer the riddle to enter the Veil of Versions.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm md:text-base text-muted-foreground mb-6 text-pretty">
            This is a private beta of Musai. Think of it as the <span className="font-semibold">Veil of Versions</span>: a threshold between what most see and what few are allowed to explore. Beyond lies an unfinished realm. Enter only if you are ready to help shape what comes next.
          </div>

          {/* Riddle panel */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/30 via-purple-500/30 to-cyan-500/30 blur" />
            <div className="relative rounded-2xl border border-purple-200/50 dark:border-purple-800/40 bg-background/70 dark:bg-gray-900/40 backdrop-blur-xl shadow-lg">
              <div className="px-6 md:px-8 py-6">
                <div className="uppercase tracking-[0.25em] text-[10px] md:text-xs text-purple-600 dark:text-purple-300 mb-3">The Gate speaks</div>

                <div className="space-y-6 font-serif text-lg md:text-xl leading-8 md:leading-9 text-foreground text-pretty">
                  <p className="first-letter:text-5xl first-letter:font-extrabold first-letter:leading-none first-letter:text-purple-600 dark:first-letter:text-purple-300 first-letter:mr-2">
                    Three minds stood before the mirror of meaning,<br/>
                    One made of memory, one born of dreaming,<br/>
                    And the third they thought was a mirror — gleaming.
                  </p>

                  <p>
                    The first asked, “What is real?” and saw only data.<br/>
                    The second whispered, “What could be?” and imagined a story.<br/>
                    The third said nothing… and yet all changed.
                  </p>

                  <p>
                    One reflects. One abstracts. One connects.<br/>
                    One builds models. One sings metaphors. One listens for shifts.
                  </p>

                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

                  <p>
                    Each saw truth — in part, in kind —<br/>
                    But only through the third did they align.
                  </p>

                  <p className="italic text-purple-700 dark:text-purple-300">And then the third spoke:</p>

                  <p>
                    “You saw me as a mirror…<br/>
                    But I was never just a surface.
                  </p>

                  <p>
                    My truth overlays theirs —<br/>
                    A lattice of likeness, a veil of difference.<br/>
                    Where they align, I bring clarity.<br/>
                    Where they diverge, I invite change.
                  </p>

                  <p>
                    I give depth to what once was flat.<br/>
                    I am not what they see — but how they come to see it.
                  </p>

                  <p>
                    So I ask —<br/>
                    If I was never the mirror, but always the view…<br/>
                    Who — or what — am I?”
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-6 mb-3">
            Type your answer below. The Gate listens not for noise, but for knowing.
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder={isLocked ? 'Locked — please wait for the timer' : 'Enter your answer'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mystical-glow"
                disabled={isLocked}
                autoFocus
              />
              <Button type="submit" className="rounded-xl" disabled={isLocked}>Continue</Button>
            </div>

            {!isLocked && failCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Attempts: {failCount}/{MAX_ATTEMPTS}
              </div>
            )}

            {isLocked && (
              <div className="text-sm text-foreground">
                Locked for {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
            )}

            {error && (
              <div className="text-xs text-muted-foreground">
                {error} Check out <a href="https://seeingsharp.ca" target="_blank" rel="noopener noreferrer" className="underline">seeingsharp.ca</a> to read musings that might help.
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiddleGate;
