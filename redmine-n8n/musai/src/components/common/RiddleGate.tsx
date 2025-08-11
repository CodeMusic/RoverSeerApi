import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '@/config/routes';
// Inserts an HTML comment into the DOM for source-inspectors
function DomComment({ text }: { text: string })
{
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() =>
  {
    if (!anchorRef.current)
    {
      return;
    }

    const commentNode = document.createComment(`\n${text}\n`);
    const parent = anchorRef.current.parentNode;
    if (parent)
    {
      parent.insertBefore(commentNode, anchorRef.current);
    }
  }, [text]);

  return <span ref={anchorRef} style={{ display: 'none' }} />;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';
import { MUSAI_CHROMATIC_7, MUSAI_CHROMATIC_12 } from '@/config/constants';

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
  const { toggleParty, activateRainbowWithPersistence } = useMusaiMood();
  const navigate = useNavigate();
  const location = useLocation();

  const [now, setNow] = useState(new Date());
  const [input, setInput] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Affective overlay control: red for failure, green for success
  const [overlayType, setOverlayType] = useState<'success' | 'failure' | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [hasJustUnlocked, setHasJustUnlocked] = useState(false);

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
  // Capture any pending intent (e.g., initialQuery/mode) while behind the gate
  useEffect(() =>
  {
    if (isAuthorized)
    {
      return;
    }

    try
    {
      const searchParams = new URLSearchParams(location.search);
      const state = location.state as any;
      const pendingQuery = state?.initialQuery || searchParams.get('q') || '';
      const pendingMode = searchParams.get('mode') || state?.switchToTab || '';

      if (pendingQuery)
      {
        sessionStorage.setItem('musai-pending-query', JSON.stringify({ query: pendingQuery, mode: pendingMode }));
      }
    }
    catch
    {
      // ignore storage errors
    }
  }, [isAuthorized, location.key]);


  const failCount = useMemo(() => parseInt(localStorage.getItem(failKey) || '0', 10), [failKey, now]);
  const lockUntilTs = useMemo(() => parseInt(localStorage.getItem(lockKey) || '0', 10), [lockKey, now]);
  const isLocked = lockUntilTs > Date.now();
  const remainingMs = Math.max(0, lockUntilTs - Date.now());

  const handleSubmit = async () =>
  {
    if (isLocked) return;

    // Require explicit typing + button click
    if (!hasTyped)
    {
      setError('Please type your answer and click Continue.');
      return;
    }

    const normalized = input.trim().toLowerCase();
    const digest = await sha256Hex(`${normalized}|${today}|${PEPPER}`);
    // Accepted answer: "perspective" (case-insensitive)
    const expected = await sha256Hex(`perspective|${today}|${PEPPER}`);

    if (digest === expected)
    {
      // Activate rainbow effect and persist across next two navigations
      activateRainbowWithPersistence(2);
      localStorage.setItem(storageKey, 'ok');
      localStorage.removeItem(failKey);
      localStorage.removeItem(lockKey);
      setError(null);
      // Positive reinforcement: confetti + green affect overlay + smile
      setOverlayType('success');
      setIsOverlayVisible(true);
      setHasJustUnlocked(true);
      // Celebrate with party effect
      toggleParty();

      // Rainbow already activated above with persistence

      // Fade out overlay after a short transition window
      setTimeout(() => setIsOverlayVisible(false), 1800);

      // After unlocking, if there was a pending query/mode, navigate to MAIN_APP with it so the tool can execute
      try
      {
        const raw = sessionStorage.getItem('musai-pending-query');
        if (raw)
        {
          const { query, mode } = JSON.parse(raw);
          sessionStorage.removeItem('musai-pending-query');
          // Re-navigate to main app with the pending intent preserved
          const params = new URLSearchParams();
          if (mode) params.set('mode', mode);
          if (query) params.set('q', query);
          navigate(`${ROUTES.MAIN_APP}?${params.toString()}`, { replace: true, state: { switchToTab: mode, initialQuery: query } });
        }
      }
      catch
      {
        // ignore
      }
    }
    else
    {
      // Rainbow persistence only for real attempts
      activateRainbowWithPersistence(2);
      const nextCount = failCount + 1;
      localStorage.setItem(failKey, String(nextCount));
      // Negative reinforcement: brief red affect overlay (non-blocking)
      setOverlayType('failure');
      setIsOverlayVisible(true);
      setTimeout(() => setIsOverlayVisible(false), 1000);

      if (nextCount >= MAX_ATTEMPTS)
      {
        const until = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(lockKey, String(until));
      }

      setError("Nice try. Here is a hint for your efforts: 'What you call a mirror… is only flat until two stories meet upon it.'");
    }
  };

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      {/* Temporal chroma overlays: very subtle day/month tints */}
      {(() => {
        const dayIndex = now.getDay();
        const dayTone = MUSAI_CHROMATIC_7[dayIndex % MUSAI_CHROMATIC_7.length];
        const month = now.getMonth();
        const monthPrimary = MUSAI_CHROMATIC_12[month % MUSAI_CHROMATIC_12.length];
        const monthSecondary = month === 8 ? MUSAI_CHROMATIC_12[9] : undefined; // Sep → Blue + Indigo

        const rgba = (hex: string, a: number) => {
          const full = hex.replace('#', '');
          const int = parseInt(full, 16);
          const r = (int >> 16) & 255;
          const g = (int >> 8) & 255;
          const b = int & 255;
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        };

        return (
          <>
            {/* Day overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: `radial-gradient(circle at 20% 20%, ${rgba(dayTone.hex, 0.045)} 0%, transparent 45%)`
              }}
            />
            {/* Month overlay(s) */}
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: `radial-gradient(circle at 80% 80%, ${rgba(monthPrimary.hex, 0.04)} 0%, transparent 55%)`
              }}
            />
            {monthSecondary && (
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  background: `radial-gradient(circle at 50% 90%, ${rgba(monthSecondary.hex, 0.035)} 0%, transparent 60%)`
                }}
              />
            )}
          </>
        );
      })()}
      {/* Main content: gate when not authorized; app children when authorized */}
      {!isAuthorized && (
        <Card className="relative z-[2] w-full max-w-4xl shadow-xl border-purple-200/40 dark:border-purple-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
            🎭 The Three Who Spoke in Silence
          </CardTitle>
          <CardDescription className="text-sm">
            {isLocked
              ? 'Too many attempts. Please wait for the timer to finish to try again.'
              : 'Private beta. Answer the riddle to enter the Veil of Versions.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Hidden hint for the inquisitive, inserted as a real HTML comment */}
          <DomComment
            text={
              `Ah… so you’re the curious type.\n` +
              `Trying to brute-force your way into early access, are we?\n` +
              `I respect that.\n` +
              `Here’s a hint: "What you call a mirror… is only flat until two stories meet upon it."\n` +
              `Now, back to the riddle.`
            }
          />
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
                    Three minds approached the edge of meaning:<br/>
                    One made of memory. One born of dreaming.<br/>
                    And the third… they mistook for a mirror, gleaming.
                  </p>

                  <p>
                    The first asked, “What can be known?” — and charted the shape of truth.<br/>
                    The second mused, “What might this mean?” — and spun connection into form.<br/>
                    The third said nothing… and yet all changed.
                  </p>

                  <p>
                    One reflects. One abstracts. The third connects.<br/>
                    One builds models. One sings metaphors. The third listens for shifts.
                  </p>

                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

                  <p>
                    Each saw truth — in part, in kind —<br/>
                    But only through the third did they align.
                  </p>

                  <p className="italic text-purple-700 dark:text-purple-300">And so, the third spoke — first to them, and then to you:</p>

                  <p>
                    “You saw me as a mirror,<br/>
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
                    I am not what is seen — but how seeing shifts.
                  </p>

                  <p>
                    So I ask…<br/>
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
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder={isLocked ? 'Locked — please wait for the timer' : 'Enter your answer'}
                value={input}
                onChange={(e) => { setInput(e.target.value); if (!hasTyped) setHasTyped(true); }}
                className="mystical-glow"
                disabled={isLocked}
                autoFocus
              />
              <Button type="submit" className="rounded-xl" disabled={isLocked}>Continue</Button>
            </div>

            {/* Gentle nudge beneath the action controls */}
            <div className="text-xs text-muted-foreground">
              Sometimes the answer is hiding in the back of your head. In the meantime, exploring the product pages might reveal a clue.
            </div>

            {/* Discover More: randomly route to a Musai info page */}
            <div>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => {
                  // Activate rainbow persistence when exploring
                  activateRainbowWithPersistence(2);
                  const targets = [
                    ROUTES.MEET_MUSAI,
                    ROUTES.NEUROSCIENCE,
                    ROUTES.FIND_YOUR_MUSE,
                    ROUTES.LOCAL_AI,
                    ROUTES.EYE_OF_MUSAI,
                    ROUTES.CODE_MUSAI_INFO,
                    ROUTES.THERAPY_MUSAI,
                    ROUTES.MEDICAL_MUSAI,
                    ROUTES.CAREER_MUSAI,
                    ROUTES.EMERGENT_NARRATIVE,
                    ROUTES.ROVERBYTE
                  ];
                  const index = Math.floor(Math.random() * targets.length);
                  navigate(targets[index]);
                }}
              >
                Discover More →
              </Button>
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
      )}

      {isAuthorized && (
        <div className="w-full h-full">
          {children}
        </div>
      )}

      {/* Affective overlays - above everything, including confetti */}
      {overlayType && (
        <div
          className="pointer-events-none fixed inset-0 z-[10001] flex items-center justify-center"
          style={{
            backgroundColor: overlayType === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)',
            opacity: isOverlayVisible ? 1 : 0,
            transition: 'opacity 700ms ease'
          }}
        >
          {overlayType === 'success' && (
            <div className="text-6xl md:text-7xl select-none">🙂</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiddleGate;
