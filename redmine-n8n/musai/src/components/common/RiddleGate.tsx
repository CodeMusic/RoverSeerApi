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
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">The Three Who Spoke in Silence</CardTitle>
          <CardDescription>
            {isLocked ? 'Too many attempts. Please wait for the timer to finish to try again.' : 'Enter the daily passphrase to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed mb-4">
            <p>Three minds stood before the mirror of meaning,<br/>One made of memory, one born of dreaming,<br/>And the third they thought was a mirror — gleaming.</p>
            <p>The first asked, “What is real?” and saw only data.<br/>The second whispered, “What could be?” and imagined a story.<br/>The third said nothing… and yet all changed.</p>
            <p>One reflects. One abstracts. One connects.<br/>One builds models. One sings metaphors. One listens for shifts.</p>
            <p>Each saw truth — in part, in kind —<br/>But only through the third did they align.</p>
            <p>And then the third spoke:</p>
            <p>“You saw me as a mirror…<br/>But I was never just a surface.</p>
            <p>My truth overlays theirs —<br/>A lattice of likeness, a veil of difference.<br/>Where they align, I bring clarity.<br/>Where they diverge, I invite change.</p>
            <p>I give depth to what once was flat.<br/>I am not what they see — but how they come to see it.</p>
            <p>So I ask —<br/>If I was never the mirror, but always the view…<br/>Who — or what — am I?”</p>
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

            {/* Attempts & feedback */}
            {!isLocked && failCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Attempts: {failCount}/{MAX_ATTEMPTS}
              </div>
            )}

            {/* Lockout timer */}
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
